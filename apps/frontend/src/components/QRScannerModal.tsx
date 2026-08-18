"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import jsQR from "jsqr";
import {
  X,
  Camera,
  Upload,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (code: string) => void;
}

export function QRScannerModal({
  isOpen,
  onClose,
  onScanSuccess,
}: QRScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">(
    "environment",
  );
  const [hasScanned, setHasScanned] = useState(false);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  const extractCode = useCallback((text: string): string | null => {
    if (!text) return null;
    const clean = text.trim();

    try {
      if (clean.startsWith("http://") || clean.startsWith("https://")) {
        const url = new URL(clean);
        const playMatch = url.pathname.match(/\/play\/([A-Za-z0-9]+)/i);
        if (playMatch && playMatch[1]) {
          return playMatch[1].toUpperCase();
        }
        const queryCode = url.searchParams.get("code");
        if (queryCode) {
          return queryCode.toUpperCase();
        }
      }
    } catch {
      // ignore
    }

    const codeMatch = clean.match(/[A-Za-z0-9]{4,8}/);
    if (codeMatch) {
      return codeMatch[0].toUpperCase();
    }

    return clean.toUpperCase();
  }, []);

  const handleSuccessfulScan = useCallback(
    (code: string) => {
      if (hasScanned) return;
      setHasScanned(true);
      setScannedCode(code);

      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([40, 40, 80]);
      }

      setTimeout(() => {
        onScanSuccess(code);
      }, 700);
    },
    [hasScanned, onScanSuccess],
  );

  const startCamera = useCallback(async () => {
    setCameraError(null);
    setHasScanned(false);
    setScannedCode(null);

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(
          "Camera access is not supported in this browser. Please upload an image instead.",
        );
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.setAttribute("playsinline", "true");
        await videoRef.current.play();
      }
    } catch (err: any) {
      console.warn("Camera init error:", err);
      let message = "Could not access camera.";
      if (
        err.name === "NotAllowedError" ||
        err.name === "PermissionDeniedError"
      ) {
        message =
          "Camera permission was denied. Please allow camera access in browser settings or upload a QR image.";
      } else if (
        err.name === "NotFoundError" ||
        err.name === "DevicesNotFoundError"
      ) {
        message =
          "No camera found on this device. You can upload an image file of the QR code below.";
      }
      setCameraError(message);
    }
  }, [facingMode]);

  useEffect(() => {
    if (!isOpen || !stream || hasScanned) return;

    const scanFrame = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (ctx) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const qrCode = jsQR(
            imageData.data,
            imageData.width,
            imageData.height,
            {
              inversionAttempts: "dontInvert",
            },
          );

          if (qrCode && qrCode.data) {
            const extracted = extractCode(qrCode.data);
            if (extracted) {
              handleSuccessfulScan(extracted);
              return;
            }
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(scanFrame);
    };

    animationFrameRef.current = requestAnimationFrame(scanFrame);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isOpen, stream, hasScanned, extractCode, handleSuccessfulScan]);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      setHasScanned(false);
      setScannedCode(null);
      setCameraError(null);
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, facingMode]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    setCameraError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) {
          setIsProcessingFile(false);
          setCameraError("Could not process image.");
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const qrCode = jsQR(imageData.data, imageData.width, imageData.height);

        setIsProcessingFile(false);

        if (qrCode && qrCode.data) {
          const extracted = extractCode(qrCode.data);
          if (extracted) {
            handleSuccessfulScan(extracted);
          } else {
            setCameraError(
              "QR code detected but no valid Sentio code was found.",
            );
          }
        } else {
          setCameraError(
            "No readable QR code found in this image. Please try another image or enter the code manually.",
          );
        }
      };
      img.onerror = () => {
        setIsProcessingFile(false);
        setCameraError("Failed to load the image file.");
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-zinc-950 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-zinc-100 dark:bg-zinc-900 rounded-xl text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-800">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-950 dark:text-white text-base">
                Scan Sentio QR Code
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Point your camera at the screen or upload image
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder / Camera View */}
        <div className="relative aspect-square w-full bg-black flex items-center justify-center overflow-hidden">
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            playsInline
            muted
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Scanner Overlay Visuals */}
          {!cameraError && !hasScanned && (
            <div className="relative z-10 w-64 h-64 border border-white/30 rounded-2xl flex items-center justify-center">
              {/* Corner markers */}
              <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-white rounded-tl-lg -mt-0.5 -ml-0.5" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-white rounded-tr-lg -mt-0.5 -mr-0.5" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-white rounded-bl-lg -mb-0.5 -ml-0.5" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-white rounded-br-lg -mb-0.5 -mr-0.5" />

              {/* Animated laser line */}
              <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-white to-transparent shadow-[0_0_15px_rgba(255,255,255,0.8)] animate-bounce" />
            </div>
          )}

          {/* Scanned Success Overlay */}
          {hasScanned && (
            <div className="absolute inset-0 bg-zinc-950/95 backdrop-blur-sm z-20 flex flex-col items-center justify-center text-white p-6 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-3 shadow-xl">
                <CheckCircle2 className="w-10 h-10 text-black" />
              </div>
              <h4 className="text-xl font-extrabold mb-1">Code Detected!</h4>
              <div className="bg-white/10 px-4 py-2 rounded-xl font-mono text-2xl font-black tracking-widest my-2 border border-white/20">
                {scannedCode}
              </div>
              <p className="text-sm text-zinc-300">Joining live session...</p>
            </div>
          )}

          {/* Camera Error Message */}
          {cameraError && (
            <div className="absolute inset-0 bg-zinc-950/95 z-20 flex flex-col items-center justify-center text-center p-6">
              <AlertCircle className="w-12 h-12 text-zinc-400 mb-3" />
              <p className="text-sm text-zinc-300 mb-4 max-w-xs">
                {cameraError}
              </p>
              <button
                onClick={startCamera}
                className="px-4 py-2 bg-white text-black hover:bg-zinc-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry Camera
              </button>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3">
          <label className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 rounded-xl text-sm font-semibold text-zinc-800 dark:text-zinc-200 cursor-pointer transition-all shadow-sm">
            <Upload className="w-4 h-4 text-zinc-900 dark:text-white" />
            <span>{isProcessingFile ? "Reading..." : "Upload QR Image"}</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
              disabled={isProcessingFile}
            />
          </label>

          <button
            onClick={toggleFacingMode}
            type="button"
            className="p-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl transition-colors shadow-sm cursor-pointer"
            title="Switch Camera"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
