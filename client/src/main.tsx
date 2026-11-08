import React from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider } from './context/AuthContext.js';
import { VaultProvider } from './context/VaultContext.js';
import { App } from './App.js';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <VaultProvider>
        <App />
      </VaultProvider>
    </AuthProvider>
  </React.StrictMode>
);
