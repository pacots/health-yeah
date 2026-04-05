"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    // Register immediately (don't wait for page load)
    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none", // Always check network for updates
        });

        console.log("[PWA] Service Worker registered:", registration);

        // Handle updates
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "activated") {
              console.log("[PWA] New version available");
              // Notify client
              if ("Notification" in window && Notification.permission === "granted") {
                new Notification("Health Yeah Updated", {
                  body: "Pull down to refresh",
                });
              }
            }
          });
        });

        // Check for updates periodically
        setInterval(() => {
          registration.update().catch((error) => {
            console.log("[PWA] Update check failed:", error);
          });
        }, 60 * 60 * 1000); // Every hour

        // Handle messages from service worker
        navigator.serviceWorker.addEventListener("message", (event) => {
          if (event.data.type === "CACHE_UPDATED") {
            console.log("[PWA] Cache updated");
          }
        });
      } catch (error) {
        console.warn("[PWA] Service Worker registration failed:", error);
        // Continue without service worker - app still works
      }
    };

    // Register immediately, not on page load
    registerServiceWorker();

    // Also request notification permission for updates
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {
        // User declined, that's OK
      });
    }
  }, []);

  return null;
}
