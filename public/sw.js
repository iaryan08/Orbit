self.addEventListener('push', (event) => {
    console.log('Push event received:', event);
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'Moon Between Us';
    const options = {
        body: data.body || 'You have a new update!',
        icon: '/android-chrome-192x192.png',
        badge: '/favicon-32x32.png',
        data: {
            url: data.url || '/',
            metadata: data.metadata || {}
        },
        vibrate: data.metadata?.type === 'heartbeat' ? [500, 150, 500, 150, 500] : [200, 100, 200]
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            if (clientList.length > 0) {
                let client = clientList[0];
                for (let i = 0; i < clientList.length; i++) {
                    if (clientList[i].focused) {
                        client = clientList[i];
                    }
                }
                return client.focus();
            }
            return clients.openWindow(event.notification.data?.url || '/');
        })
    );
});
