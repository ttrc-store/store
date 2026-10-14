'use client';

import * as React from 'react';

export function PwaRegister() {
  React.useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('[TTRC PWA] Updated light-theme assets cached.');
                }
              };
            }
          };
        })
        .catch((err) => {
          console.error('[TTRC PWA] ServiceWorker registration failed:', err);
        });
    }
  }, []);

  return null;
}
