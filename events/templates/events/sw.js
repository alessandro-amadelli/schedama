const cacheName = 'schedama-cache-v2.1';

function precache() {
	return caches.open('schedama-cache').then(function (cache){
		return cache.addAll([
			"{% url 'index' %}",
			"{% url 'new_event_view' %}",
			"{% url 'open_event_view' %}",
			"{% url 'history_view' %}",
			"{% url 'about_us_view' %}",
		]);
	});
}

{% load static %}

const staticAssets = [
	'{% static "events/main.css" %}',
	'{% static "events/edit_event.js" %}',
	'{% static "events/error404.js" %}',
	'{% static "events/history.js" %}',
	'{% static "events/new_event.js" %}',
	'{% static "events/utilities.js" %}',
	'{% static "events/view_event.js" %}',
	'{% static "events/schedama_logo_dark.png" %}',
	'{% static "events/schedama_logo.png" %}',
];

self.addEventListener('install', async e => {
	const cache = await caches.open(cacheName);
	await cache.addAll(staticAssets);
	return self.skipWaiting();
});

self.addEventListener('activate', e => {
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
	try {
		const fresh = await fetch(req);
		await cache.put(req, fresh.clone());
		return fresh;
	} catch (e) {
		const cached = await cache.match(req);
		return cached;
	}
}