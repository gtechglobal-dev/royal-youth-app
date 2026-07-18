import { useState, useEffect, useCallback } from "react";
import API from "../services/api";

function checkStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    (navigator.standalone === true)
  );
}

export function usePWA() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(() => checkStandalone());
  const [notificationPermission, setNotificationPermission] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "denied"
  );

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    && !window.MSStream;

  useEffect(() => {
    if (checkStandalone()) {
      setIsInstalled(true);
      return;
    }

    const onInstalled = () => setIsInstalled(true);
    window.addEventListener("appinstalled", onInstalled);

    const handler = (e) => {
      e.preventDefault();
      if (checkStandalone()) return;
      setInstallPrompt(e);
    };
    if (!isIOS) {
      window.addEventListener("beforeinstallprompt", handler);
    }

    return () => {
      if (!isIOS) {
        window.removeEventListener("beforeinstallprompt", handler);
      }
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [isIOS]);

  const promptInstall = useCallback(async () => {
    if (!installPrompt) return false;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    setInstallPrompt(null);
    return outcome === "accepted";
  }, [installPrompt]);

  const requestNotificationPermission = useCallback(async () => {
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    return permission;
  }, []);

  const subscribeToPush = useCallback(async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return null;
    const registration = await navigator.serviceWorker.ready;

    let subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      try {
        await API.post("/push/subscribe", subscription.toJSON());
        return subscription;
      } catch (_) {
        await subscription.unsubscribe().catch(() => {});
        subscription = null;
      }
    }

    const res = await API.get("/push/vapid-public-key");
    const convertedKey = urlBase64ToUint8Array(res.data.publicKey);

    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedKey,
    });

    await API.post("/push/subscribe", subscription.toJSON());
    return subscription;
  }, []);

  const unsubscribeFromPush = useCallback(async () => {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      await API.delete("/push/unsubscribe");
    }
  }, []);

  return {
    installPrompt,
    isInstalled,
    isIOS,
    canInstall: isIOS ? !isInstalled : !!installPrompt && !isInstalled,
    notificationPermission,
    promptInstall,
    requestNotificationPermission,
    subscribeToPush,
    unsubscribeFromPush,
  };
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}
