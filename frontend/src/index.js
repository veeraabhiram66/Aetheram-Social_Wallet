import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App"; // Back to the original app with all nonce fixes
import "./index.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// DISABLE service worker to prevent caching issues
// Service worker disabled to ensure no cache problems

// DISABLE service worker to prevent caching issues
// Register service worker for PWA functionality
/*
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}
*/
