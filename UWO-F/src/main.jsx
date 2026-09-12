import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { AffiliateProvider } from './context/AffiliateContext';
import './index.css';

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <BrowserRouter>
        <AuthProvider>
          <AffiliateProvider>
            <App />
          </AffiliateProvider>
        </AuthProvider>
      </BrowserRouter>
    </React.StrictMode>
  );
} else {
  console.error("Root element #root not found in document.");
}
