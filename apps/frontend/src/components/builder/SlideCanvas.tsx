"use client";

import React, { useEffect, useRef, useState } from "react";
import { PresentationTheme, resolveTheme } from "@/types/theme";

interface SlideCanvasProps {
  children: React.ReactNode;
  theme?: PresentationTheme | any;
  width?: number;
  height?: number;
  zoom?: "fit" | number;
  className?: string;
  style?: React.CSSProperties;
}

export function SlideCanvas({
  children,
  theme,
  width = 1920,
  height = 1080,
  zoom = "fit",
  className = "",
  style = {},
}: SlideCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const resolvedTheme = resolveTheme(theme);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateScale = () => {
      if (typeof zoom === "number") {
        setScale(zoom);
        return;
      }

      const rect = container.getBoundingClientRect();
      // Leave generous comfortable margin around canvas on laptops and desktops
      const availableWidth = Math.max(100, rect.width - 64);
      const availableHeight = Math.max(100, rect.height - 56);

      const scaleX = availableWidth / width;
      const scaleY = availableHeight / height;

      // Fit without cropping, comfortably padded
      const fitScale = Math.min(scaleX, scaleY);
      setScale(Math.min(fitScale, 1.1));
    };

    const resizeObserver = new ResizeObserver(() => {
      updateScale();
    });

    resizeObserver.observe(container);
    updateScale();

    return () => {
      resizeObserver.disconnect();
    };
  }, [width, height, zoom]);

  const getFontFamilyStyle = (font?: string) => {
    switch (font) {
      case "serif":
        return "Georgia, Cambria, 'Times New Roman', Times, serif";
      case "mono":
        return "'JetBrains Mono', 'Fira Code', Menlo, Monaco, Consolas, monospace";
      case "display":
        return "'Outfit', 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif";
      case "sans":
      default:
        return "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full flex items-center justify-center overflow-hidden select-none p-3 sm:p-5 ${className}`}
      style={style}
    >
      <div
        className="relative shrink-0 rounded-2xl sm:rounded-3xl transition-transform duration-150 ease-out origin-center overflow-hidden"
        style={{
          width: `${width}px`,
          height: `${height}px`,
          transform: `scale(${scale})`,
          backgroundColor: resolvedTheme.bg,
          color: resolvedTheme.text,
          borderColor: resolvedTheme.border || "rgba(0,0,0,0.1)",
          fontFamily: getFontFamilyStyle(resolvedTheme.fontFamily),
          boxShadow:
            "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05)",
        }}
      >
        {children}
      </div>
    </div>
  );
}
