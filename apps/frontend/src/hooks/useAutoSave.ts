"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
  const dataRef = useRef<T>(initialData);
  const isFirstRender = useRef(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep dataRef synchronized with latest data
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Sync internal state when initialData updates from an external API fetch
  useEffect(() => {
    if (
      initialData &&
      JSON.stringify(initialData) !== JSON.stringify(previousDataRef.current)
    ) {
      setData(initialData);
      previousDataRef.current = initialData;
      dataRef.current = initialData;
    }
  }, [initialData]);

  // Direct immediate save method
  const saveImmediately = useCallback(
    async (newData?: Partial<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      const targetData = newData
        ? ({ ...dataRef.current, ...newData } as T)
        : dataRef.current;

      setData(targetData);
      dataRef.current = targetData;
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
          body: JSON.stringify(targetData),
        });

        if (!res.ok) throw new Error("Failed to save");

        setSaveState("saved");
        previousDataRef.current = targetData;

        setTimeout(() => setSaveState("idle"), 3000);
      } catch (error) {
        console.error("Immediate save failed:", error);
        setSaveState("error");
      }
    },
    [endpoint],
  );

  // Expose a method to immediately update data locally and schedule debounced save
  const updateData = useCallback((newData: Partial<T>) => {
    setData((prev) => {
      const updated = { ...prev, ...newData };
      dataRef.current = updated;
      return updated;
    });
    setSaveState("idle");
  }, []);

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

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
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

        setTimeout(() => setSaveState("idle"), 3000);
      } catch (error) {
        console.error("Auto-save failed:", error);
        setSaveState("error");
      }
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, endpoint, delay]);

  return {
    data,
    updateData,
    saveImmediately,
    saveState,
    setData,
  };
}
