"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { subscribeUserToPushAction, unsubscribeUserFromPushAction } from "./push-actions";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushSettings() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      setIsSupported(true);
      registerServiceWorkerAndCheckSubscription();
    } else {
      setIsLoading(false);
    }
  }, []);

  async function registerServiceWorkerAndCheckSubscription() {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error("Service Worker registration failed:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleToggleSubscription() {
    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;

      if (isSubscribed) {
        // Unsubscribe
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
          await unsubscribeUserFromPushAction(subscription.endpoint);
        }
        setIsSubscribed(false);
      } else {
        // Subscribe
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidPublicKey) {
          throw new Error("VAPID public key not found");
        }

        const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey,
        });

        await subscribeUserToPushAction(JSON.parse(JSON.stringify(subscription)));
        setIsSubscribed(true);
      }
    } catch (error) {
      console.error("Failed to toggle subscription:", error);
      alert("Failed to update notification settings. Please check your browser permissions.");
    } finally {
      setIsLoading(false);
    }
  }

  if (!isSupported) {
    return (
      <div className="text-sm text-muted-foreground">
        Push notifications are not supported in this browser.
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-base font-medium">Browser Notifications</h3>
        <p className="text-sm text-muted-foreground">
          Receive native push notifications on this device.
        </p>
      </div>
      <Button
        variant={isSubscribed ? "secondary" : "primary"}
        onClick={handleToggleSubscription}
        disabled={isLoading}
      >
        {isLoading ? "Updating..." : isSubscribed ? "Disable" : "Enable"}
      </Button>
    </div>
  );
}
