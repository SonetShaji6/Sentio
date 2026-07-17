import { useState, useEffect, useRef } from "react";
import { getAccessToken } from "@/lib/auth";

export function useAutoSave<T>(
  endpoint: string,
  initialData: T,
  delay: number = 2000,
) {
  const [data, setData] = useState<T>(initialData);
  const [saveState, setSaveState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const previousDataRef = useRef<T>(initialData);
  const isFirstRender = useRef(true);

  // Expose a method to immediately update data locally
  const updateData = (newData: Partial<T>) => {
    setData((prev) => ({ ...prev, ...newData }));
    setSaveState("idle");
  };

  useEffect(() => {
    // Skip first render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Skip if data hasn't actually changed
    if (JSON.stringify(data) === JSON.stringify(previousDataRef.current)) {
      return;
    }

    const handler = setTimeout(async () => {
      setSaveState("saving");
      try {
        const token = getAccessToken();
        if (!token) throw new Error("No token");

        const res = await fetch(endpoint, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        });

        if (!res.ok) throw new Error("Failed to save");

        setSaveState("saved");
        previousDataRef.current = data;

        // Reset to idle after a few seconds
        setTimeout(() => setSaveState("idle"), 3000);
      } catch (error) {
        console.error("Auto-save failed:", error);
        setSaveState("error");
      }
    }, delay);

    return () => clearTimeout(handler);
  }, [data, endpoint, delay]);

  return {
    data,
    updateData,
    saveState,
    setData, // direct override if needed
  };
}
