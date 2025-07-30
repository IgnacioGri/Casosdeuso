// Empty service worker for Blazor WebAssembly
// This file is required by the Blazor WebAssembly project template
// but can be left empty if PWA functionality is not needed

self.addEventListener('install', () => {
    // Service worker installed
});

self.addEventListener('activate', () => {
    // Service worker activated
});

self.addEventListener('fetch', (event) => {
    // Default fetch behavior - just pass through
    event.respondWith(fetch(event.request));
});