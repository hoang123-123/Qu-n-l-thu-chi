import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './src/App';

// Polyfill process.env.API_KEY for browser environments (e.g., GitHub Pages)
// The Google GenAI SDK requires process.env.API_KEY to be defined.
const FALLBACK_API_KEY = 'AIzaSyAHfqrq08IV9DI1whbHoX0HF3jABmRggIk';

// Ensure process object exists in the global scope immediately
if (typeof window !== 'undefined') {
  if (!(window as any).process) {
    (window as any).process = {};
  }
  if (!(window as any).process.env) {
    (window as any).process.env = {};
  }
  // Force assignment to ensure it persists
  (window as any).process.env.API_KEY = FALLBACK_API_KEY;
}

// Also patch global 'process' variable reference if possible for strict bundlers
try {
  if (typeof process === 'undefined') {
    // @ts-ignore
    window.process = { env: { API_KEY: FALLBACK_API_KEY } };
  } else {
    if (!process.env) {
      (process as any).env = {};
    }
    if (!process.env.API_KEY) {
      (process.env as any).API_KEY = FALLBACK_API_KEY;
    }
  }
} catch (e) {
  console.warn('Could not polyfill process directly', e);
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);