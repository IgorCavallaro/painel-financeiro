// Service worker mínimo — existe só para o navegador considerar o app
// "instalável" (Adicionar à Tela de Início). Não faz cache agressivo:
// os dados sempre vêm do Supabase, nunca de uma versão desatualizada.
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Passthrough simples: deixa toda requisição seguir normalmente pra rede.
  event.respondWith(fetch(event.request));
});
