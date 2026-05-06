import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global error handling for easier debugging in the preview
window.addEventListener('error', (event) => {
  console.error('Erro Global Detectado:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Promessa rejeitada sem tratamento:', event.reason);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
