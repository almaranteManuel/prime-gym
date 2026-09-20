import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import './index.css';
import App from './App.js';
import { ProtectedRoute } from './components/ProtectedRoute.js';
import { Alumno } from './pages/Alumno.js';
import { clearAuthToken } from './services/auth-storage.js';

// 8. Registro del Service Worker: el navegador podrá ofrecer
// el prompt de "Instalar aplicación" cuando el manifest + SW sean válidos.
registerSW({ immediate: true });

const root = document.getElementById('root');
if (!root) throw new Error('#root element not found');

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <ProtectedRoute>
      {(user) => user.rol === 'admin' ? <App onLogout={() => { clearAuthToken(); window.location.reload(); }} /> : <Alumno user={user} onLogout={() => window.location.reload()} />}
    </ProtectedRoute>
  </React.StrictMode>,
);
