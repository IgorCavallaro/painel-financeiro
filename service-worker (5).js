// Service worker do Painel 50/30/20.
// - Guarda uma cópia dos arquivos do app para ele abrir mesmo sem internet.
// - Páginas e scripts: tenta a rede primeiro (você sempre recebe a versão nova
//   assim que publica) e só usa a cópia guardada se estiver offline.
// - Dados do Supabase e do assistente NUNCA passam pelo cache.
// Ao publicar uma versão nova, troque o número abaixo.
const VERSAO = 'painel-v2.1.0';
const ARQUIVOS = ['./', './index.html', './lancar.html', './config.js', './manifest.json', './icon-192.png', './icon-512.png',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSAO).then(c => Promise.all(ARQUIVOS.map(u => c.add(u).catch(() => null)))));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSAO).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;                         // gravações vão direto para a rede
  const url = new URL(req.url);
  if (url.hostname.endsWith('supabase.co')) return;         // dados: sempre ao vivo
  const ehApp = url.origin === location.origin || url.hostname === 'cdn.jsdelivr.net' || url.hostname.includes('fonts.g');
  if (!ehApp) return;
  event.respondWith(
    fetch(req).then(res => {
      if (res && res.ok) { const copia = res.clone(); caches.open(VERSAO).then(c => c.put(req, copia)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('./index.html')))
  );
});
