"use client";

import React, { useEffect, useRef, useState } from "react";

interface SlideCanvasProps {
  children: React.ReactNode;
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function SlideCanvas({
  children,
  width = 1920,
  height = 1080,
  className = "",
  style = {},
}: SlideCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateScale = () => {
      const { width: containerWidth, height: containerHeight } =
        container.getBoundingClientRect();
      const scaleX = containerWidth / width;
      const scaleY = containerHeight / height;

      // Use the smaller scale to ensure the canvas fits within the container without cropping
      setScale(Math.min(scaleX, scaleY));
    };

    const resizeObserver = new ResizeObserver(() => {
      updateScale();
    });

    resizeObserver.observe(container);
    updateScale(); // Initial scale

    return () => {
      resizeObserver.disconnect();
    };
  }, [width, height]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full flex items-center justify-center overflow-hidden ${className}`}
      style={style}
    >
      <div
        className="relative bg-white shadow-xl shrink-0 ring-1 ring-black/5"
        style={{
          width: `${width}px`,
          height: `${height}px`,
          transform: `scale(${scale})`,
          transformOrigin: "center center",
          transition: "transform 0.1s ease-out",
        }}
      >
        {children}
      </div>
    </div>
  );
}
