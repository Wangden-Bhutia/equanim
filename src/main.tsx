import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/index.css';
import { App } from './app/App';
import { startInstallListener } from './engine/install';
import { registerServiceWorker } from './engine/sw';

// Listen before rendering so an early `beforeinstallprompt` is not missed.
startInstallListener();

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Offline support: the service worker caches only the app's own files, never your entries.
if (import.meta.env.PROD) registerServiceWorker(import.meta.env.BASE_URL);
