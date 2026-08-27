"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { sendTestNotificationAction } from "@/app/dashboard/notifications/actions";

export function TestNotificationButton() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSend = async () => {
    setLoading(true);
    setSuccess(false);
    try {
      await sendTestNotificationAction();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      console.error(e);
      alert("Failed to send test notification");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <Button 
        onClick={handleSend} 
        disabled={loading}
        variant="secondary"
        className="text-xs"
      >
        {loading ? "Sending..." : "Send Test Notification"}
      </Button>
      {success && <span className="text-xs text-accent transition-opacity">Test notification sent.</span>}
    </div>
  );
}
