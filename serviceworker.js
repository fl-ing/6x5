self.addEventListener('install', (event) => {
    event.waitUntil(
      caches.open('pwa-cache').then((cache) => {
        return cache.addAll([
          '',
          'index.html',
          'style.css',
          'gamelogic.js',
          'manifest.json',
          'assets/logos/logo_svg.svg',
          'assets/logos/logo_32.png',
          'assets/logos/logo_64.png',
          'assets/logos/logo_128.png',
          'assets/logos/logo_256.png',
          'assets/logos/logo_512.png',
          'assets/wordlists/4-letter-words.txt',
          'assets/wordlists/5-letter-words.txt',
          'assets/wordlists/6-letter-words.txt',
          'assets/fonts/DMMono-Regular.ttf',
          'assets/fonts/Outfit-VariableFont_wght.ttf',
        ]);
      })
    );
  });
  
  self.addEventListener('fetch', (event) => {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  });