const cacheName = 'schedama-cache-v3.5.93';

{% load static %}

const cacheAssets = [
	'{% static "events/main.css" %}',
	'{% static "events/edit_event.js" %}',
	'{% static "events/error404.js" %}',
	'{% static "events/history.js" %}',
	'{% static "events/new_event.js" %}',
	'{% static "events/utilities.js" %}',
	'{% static "events/view_event.js" %}',
	'{% static "events/schedama_logo_dark.png" %}',
	'{% static "events/schedama_logo_dark.png" %}',
	'{% static "events/qrcode_logo.png" %}',
	'{% static "events/fonts/Poppins-Regular.woff2" %}',
	"{% url 'index' %}",
	"{% url 'new_event_view' %}",
	"{% url 'open_event_view' %}",
	"{% url 'history_view' %}",
	"{% url 'about_us_view' %}",
	"{% url 'privacy_view' %}",
];

self.addEventListener('install', async e => {
	const cache = await caches.open(cacheName);
	await cache.addAll(cacheAssets);
    const cacheContent = await cache.keys();
	return self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== cacheName).map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});


self.addEventListener('fetch', async e => {
	const req = e.request;
	const url = new URL(req.url);
	if (url.origin === location.origin) {
		e.respondWith(cacheFirst(req));
	} else {
		e.respondWith(networkAndCache(req));
	}
});

async function cacheFirst(req) {
	const cache = await caches.open(cacheName);
	const cached = await cache.match(req);
	return cached || fetch(req);
}

async function networkAndCache(req) {
	const cache = await caches.open(cacheName);
	const cached = await cache.match(req);
	if (cached) {
	    return cached;
	}
	try {
		const fresh = await fetch(req);
		await cache.put(req, fresh.clone());
		return fresh;
	} catch (e) {
		const cached = await cache.match(req);
		return cached;
	}
}
