import { useEffect, useState } from "react";
import { usePWA } from "../hooks/usePWA";

export default function PushNotificationManager() {
  const { notificationPermission, requestNotificationPermission, subscribeToPush, isInstalled } = usePWA();
  const [dismissed, setDismissed] = useState(false);
  const isLoggedIn = !!localStorage.getItem("token");

  useEffect(() => {
    if (!isLoggedIn || !isInstalled) return;
    if (notificationPermission === "granted") {
      subscribeToPush().catch(() => {});
    }
  }, [isLoggedIn, isInstalled, notificationPermission, subscribeToPush]);

  if (!isLoggedIn || !isInstalled || notificationPermission === "granted" || notificationPermission === "denied" || dismissed) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 max-w-sm mx-auto">
      <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-4 animate-slide-up">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-gray-800">Enable notifications</p>
            <p className="text-xs text-gray-500 mt-0.5">Get notified of likes, comments, and messages</p>
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={async () => {
                  const perm = await requestNotificationPermission();
                  if (perm === "granted") {
                    await subscribeToPush();
                  }
                }}
                className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-700"
              >
                Enable
              </button>
              <button onClick={() => setDismissed(true)} className="text-gray-400 text-xs hover:text-gray-600">
                Not now
              </button>
            </div>
          </div>
          <button onClick={() => setDismissed(true)} className="text-gray-300 hover:text-gray-500">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
