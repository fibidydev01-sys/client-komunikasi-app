// src/main.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  // ❌ DISABLE STRICT MODE (causes double mount in dev)
  // <React.StrictMode>
  <App />
  // </React.StrictMode>
);