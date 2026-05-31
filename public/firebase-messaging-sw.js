import { initializeApp } from "firebase/app";
import { getMessaging, onBackgroundMessage } from "firebase/messaging/sw";

const CONFIG_CACHE_KEY = 'firebase-config-v1';

async function getFirebaseConfig() {
    try {
        const cached = await caches.match(CONFIG_CACHE_KEY);
        if (cached) {
            return await cached.json();
        }

        const response = await fetch('/api/push-config');
        if (!response.ok) {
            throw new Error('Failed to fetch Firebase config');
        }

        const config = await response.json();
        const cache = await caches.open(CONFIG_CACHE_KEY);
        await cache.put(CONFIG_CACHE_KEY, new Response(JSON.stringify(config)));
        return config;
    } catch (error) {
        console.error('[firebase-messaging-sw] Config fetch failed:', error);
        return null;
    }
}

self.addEventListener('install', (event) => {
    event.waitUntil(
        getFirebaseConfig().then((config) => {
            if (config) {
                console.log('[firebase-messaging-sw] Config loaded successfully');
            }
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('push', async (event) => {
    if (!event.data) return;

    try {
        const config = await getFirebaseConfig();
        if (!config || !config.apiKey) {
            console.warn('[firebase-messaging-sw] No valid config, showing basic notification');
            const data = event.data.json();
            const title = data.notification?.title || 'Alora';
            const body = data.notification?.body || '';
            event.waitUntil(
                self.registration.showNotification(title, {
                    body,
                    icon: '/icons/icon-192x192.png',
                    badge: '/icons/icon-192x192.png',
                })
            );
            return;
        }

        const app = initializeApp(config);
        const messaging = getMessaging(app);

        onBackgroundMessage(messaging, (payload) => {
            console.log('[firebase-messaging-sw] Received background message:', payload);
            const title = payload.notification?.title || 'Alora';
            const options = {
                body: payload.notification?.body || '',
                icon: '/icons/icon-192x192.png',
                badge: '/icons/icon-192x192.png',
                data: payload.data || {},
            };
            self.registration.showNotification(title, options);
        });
    } catch (error) {
        console.error('[firebase-messaging-sw] Initialization error:', error);
    }
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const url = event.notification.data?.matchId
        ? `/chat/${event.notification.data.matchId}`
        : '/discover';

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
            for (const client of clients) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    client.navigate(url);
                    return client.focus();
                }
            }
            return self.clients.openWindow(url);
        })
    );
});
