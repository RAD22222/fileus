import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { initRipples } from './lib/ripple';
import { captureInstallPrompt } from './lib/pwa';
import './index.css';

initRipples();
captureInstallPrompt();

createRoot(document.getElementById('root')!).render(<App />);

// Offline-first: register the service worker in production builds
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('Service worker registration failed:', err);
    });
  });
}
