self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'Moon Between Us';
    const options = {
        body: data.body || 'You have a new update!',
        icon: '/android-chrome-192x192.png',
        badge: '/favicon-32x32.png',
        data: data.url || '/',
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data)
    );
});
