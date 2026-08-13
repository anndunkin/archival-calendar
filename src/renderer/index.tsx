import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles/app.css';

// ── Diagnostic error surface ───────────────────────────────────────────
// The app has shipped blank (no visible error) twice in a row after
// preload/build changes. Render any startup error directly into the page
// so the failure is visible without opening DevTools, instead of leaving
// a silent blank window.
function renderFatalError(title: string, detail: string): void {
  const el = document.createElement('div');
  el.style.cssText =
    'position:fixed;inset:0;background:#fff;color:#1a1a1a;font-family:' +
    'ui-monospace,Consolas,monospace;padding:24px;overflow:auto;z-index:99999;';
  const esc = (s: string) => s.replace(/[<>&]/g, (c) => (c === '<' ? '&lt;' : c === '>' ? '&gt;' : '&amp;'));
  el.innerHTML =
    '<h2 style="color:#b00020;margin:0 0 12px;font-family:sans-serif;">' +
    esc(title) +
    '</h2><pre style="white-space:pre-wrap;font-size:13px;line-height:1.5;">' +
    esc(detail) +
    '</pre>';
  document.body.appendChild(el);
}

window.addEventListener('error', (e) => {
  renderFatalError(
    'Startup error (window.onerror)',
    `${e.message}\n\n${e.error?.stack ?? '(no stack available)'}`
  );
});

window.addEventListener('unhandledrejection', (e) => {
  const reason = e.reason;
  renderFatalError(
    'Startup error (unhandled promise rejection)',
    reason?.stack ?? String(reason)
  );
});

try {
  if (typeof window.archivalCalendar === 'undefined') {
    throw new Error(
      'window.archivalCalendar is undefined — the preload script did not ' +
        'expose the API bridge. Check that dist/main/preload.js exists and ' +
        'that webPreferences.preload in src/main/index.ts points at it.'
    );
  }

  const container = document.getElementById('root');
  if (!container) {
    throw new Error(
      "document.getElementById('root') returned null — index.html is missing " +
        '<div id="root"></div> or the script ran before the DOM was parsed.'
    );
  }
  createRoot(container).render(<App />);
} catch (err) {
  const e = err as Error;
  renderFatalError('Startup error (caught in index.tsx)', `${e.message}\n\n${e.stack ?? ''}`);
}
