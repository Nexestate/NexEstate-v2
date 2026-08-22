import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { registerServiceWorker } from './lib/registerServiceWorker';
import { Providers } from './providers';

registerServiceWorker();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Providers />
  </StrictMode>,
);
