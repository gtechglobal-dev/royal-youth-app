import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { NetworkFirst } from "workbox-strategies";

precacheAndRoute(self.__WB_MANIFEST);

registerRoute(
  /^https?:\/\/.*\/api\/.*/i,
  new NetworkFirst({
    cacheName: "api-cache",
    networkTimeoutSeconds: 10,
  })
);

self.addEventListener("push", (event) => {
  let data = { title: "Royal Youth Hub", body: "", url: "/dashboard" };
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (_) {}

  const options = {
    body: data.body,
    icon: "/icon-192x192.png",
    badge: "/favicon.svg",
    vibrate: [200, 100, 200],
    data: { url: data.url || "/dashboard" },
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/dashboard";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      const matching = windowClients.find((c) => c.url.includes(url));
      if (matching) {
        matching.focus();
      } else {
        clients.openWindow(url);
      }
    })
  );
});
