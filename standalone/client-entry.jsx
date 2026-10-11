import React from 'react';
import { createRoot } from 'react-dom/client';

async function start() {
  const localFetch = window.fetch.bind(window);
  const token = location.hash.slice(1);
  // Fragment credentials never enter the HTTP URL, referrer, or server request logs.
  if (token) history.replaceState(null, '', location.pathname);
  let session;
  if (/^[a-f0-9]{64}$/.test(token)) {
    session = await localFetch('/session', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) });
  }
  if (!session?.ok) session = await localFetch('/session', { credentials: 'same-origin' });
  if (!session.ok) throw Error('请使用终端中当前显示的本机链接打开工作台。已保存的账号数据仍保留在本机。');
  const { csrf } = await session.json();
  window.fetch = (input, options = {}) => {
    const url = new URL(input instanceof Request ? input.url : String(input), location.origin);
    if (url.origin !== location.origin || !url.pathname.startsWith('/api/personal-social/')) return localFetch(input, options);
    const headers = new Headers(input instanceof Request ? input.headers : undefined);
    new Headers(options.headers).forEach((value, key) => headers.set(key, value));
    headers.set('X-CSRF-Token', csrf);
    return localFetch(input, { ...options, credentials: 'same-origin', headers });
  };
  window.__ModuleLoader__ = {
    load(module) {
      const client = module.factory(name => { if (name === 'react') return React; throw Error(`不支持的界面模块：${name}`); });
      client.apply({
        effect(fn) { fn(); },
        desktopWorkbenches: { register(options, Panel) { const root = createRoot(document.getElementById('root')); root.render(<Panel />); return () => root.unmount(); } },
      });
    },
  };
  await import('../src/client.js');
}
start().catch(error => {
  const message = document.querySelector('#startup p');
  if (message) message.textContent = error.message || '本机工作台暂时不可用，请重新启动后打开。';
});
