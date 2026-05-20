import { precacheAndRoute } from "workbox-precaching";
import { registerRoute, setDefaultHandler, setCatchHandler } from "workbox-routing";
import { NetworkFirst, NetworkOnly } from "workbox-strategies";

precacheAndRoute(self.__WB_MANIFEST);

registerRoute(
  /^https?:\/\/.*\/api\/.*/i,
  new NetworkFirst({
    cacheName: "api-cache",
    networkTimeoutSeconds: 10,
  })
);

setDefaultHandler(new NetworkOnly());

setCatchHandler(async ({ event }) => {
  if (event.request.mode === "navigate") {
    const cached = await caches.match("/index.html");
    return cached || fetch(event.request);
  }
  return Response.error();
});

const BADGE_CACHE = "push-badge-count";

async function getBadgeCount() {
  const cache = await caches.open(BADGE_CACHE);
  const res = await cache.match("count");
  return res ? parseInt(await res.text(), 10) : 0;
}

async function setBadgeCount(count) {
  const cache = await caches.open(BADGE_CACHE);
  await cache.put("count", new Response(String(count)));
  try {
    if (count > 0) {
      await self.registration.setAppBadge(count);
    } else {
      await self.registration.clearAppBadge();
    }
  } catch (_) {}
}

async function incrementBadge() {
  const count = await getBadgeCount();
  await setBadgeCount(count + 1);
}

async function clearBadge() {
  await setBadgeCount(0);
  try {
    await self.registration.clearAppBadge();
  } catch (_) {}
}

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
    badge: "/favicon-192x192.png",
    image: data.image,
    vibrate: [200, 100, 200],
    data: { url: data.url || "/dashboard", notificationId: data.notificationId },
  };

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(data.title, options),
      incrementBadge(),
    ])
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  let url = event.notification.data?.url || "/dashboard";
  const notifId = event.notification.data?.notificationId;
  if (notifId) {
    const separator = url.includes("?") ? "&" : "?";
    url = `${url}${separator}notif=${notifId}`;
  }
  event.waitUntil(
    Promise.all([
      clearBadge(),
      clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
        const matching = windowClients.find((c) => c.url.includes(url.split("?")[0]));
        if (matching) {
          matching.focus();
        } else {
          clients.openWindow(url);
        }
      }),
    ])
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SET_BADGE") {
    setBadgeCount(Number(event.data.count) || 0);
  }
  if (event.data?.type === "CLEAR_BADGE") {
    clearBadge();
  }
});
