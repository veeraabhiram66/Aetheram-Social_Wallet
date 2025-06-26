// PWA Enhancement for Frontend
// Add this to your frontend to make it installable and work offline

// public/sw.js - Service Worker for offline functionality
const CACHE_NAME = 'blockdag-wallet-v1';
const urlsToCache = [
  '/',
  '/static/css/',
  '/static/js/',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});

// public/manifest.json - App manifest for installability
{
  "name": "BlockDAG Smart Wallet",
  "short_name": "BlockDAG Wallet",
  "description": "Gasless transactions with social recovery",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#3B82F6",
  "background_color": "#ffffff",
  "icons": [
    {
      "src": "icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}

// src/hooks/usePWA.js - Hook for PWA functionality
import { useState, useEffect } from 'react';

export const usePWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsInstallable(false);
    }
  };

  return { isInstallable, installApp };
};

// src/components/InstallPrompt.js - Install prompt component
import React from 'react';
import { usePWA } from '../hooks/usePWA';

const InstallPrompt = () => {
  const { isInstallable, installApp } = usePWA();

  if (!isInstallable) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg">
      <div className="flex items-center space-x-3">
        <div>
          <h3 className="font-semibold">Install BlockDAG Wallet</h3>
          <p className="text-sm opacity-90">Access your wallet offline</p>
        </div>
        <button
          onClick={installApp}
          className="bg-white text-blue-600 px-4 py-2 rounded font-medium hover:bg-gray-100"
        >
          Install
        </button>
      </div>
    </div>
  );
};

export default InstallPrompt;

// src/hooks/useOfflineStatus.js - Offline detection
import { useState, useEffect } from 'react';

export const useOfflineStatus = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOffline;
};

// src/components/OfflineIndicator.js - Offline status indicator
import React from 'react';
import { useOfflineStatus } from '../hooks/useOfflineStatus';

const OfflineIndicator = () => {
  const isOffline = useOfflineStatus();

  if (!isOffline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-red-600 text-white text-center py-2 z-50">
      <span className="flex items-center justify-center">
        📵 You're offline. Some features may be limited.
      </span>
    </div>
  );
};

export default OfflineIndicator;

// src/utils/notifications.js - Push notification setup
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

export const sendNotification = (title, options = {}) => {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      ...options
    });
  }
};

// Usage examples:
// - Recovery initiated: sendNotification('Recovery Initiated', { body: 'A guardian has initiated wallet recovery' });
// - Transaction complete: sendNotification('Transaction Complete', { body: 'Your gasless transaction was successful' });
// - Guardian added: sendNotification('Guardian Added', { body: 'A new guardian was added to your wallet' });

// Installation instructions:
// 1. Copy sw.js to public/sw.js
// 2. Update public/manifest.json
// 3. Add PWA components to your App.js
// 4. Register service worker in public/index.html:

/*
<script>
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
</script>
*/
