/**
 * Helper to request browser notification permissions and show desktop push alerts.
 */

export async function requestBrowserNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) {
    console.warn(
      "Browser notifications are not supported by this device/browser.",
    );
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
}

export function showBrowserNotification(
  title: string,
  options?: NotificationOptions,
) {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    return;
  }

  try {
    new Notification(title, {
      icon: "/logo.jpg",
      badge: "/logo.jpg",
      ...options,
    });
  } catch (err) {
    console.warn("Failed to trigger browser notification:", err);
  }
}
