self.addEventListener('push', function(event) {
	event.waitUntil(
		self.registration.showNotification('Peter Alert', {icon: '/peter.gif'})
	);
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    fetch(e.request),
  );
});

