import { useEffect, useState, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { getAccessToken, API_URL } from "@/lib/auth";
import { SOCKET_EVENTS } from "@sentio/shared/src/events/socket.events";

interface UseSocketOptions {
  autoConnect?: boolean;
}

export function useSocket(options: UseSocketOptions = { autoConnect: true }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!options.autoConnect) return;

    // Use token for authentication if available (useful for presenters)
    const token = getAccessToken();

    // Normalize API_URL since it might not be a direct ws:// if using wss on production,
    // socket.io handles standard http URLs to upgrade
    const socketInstance = io(API_URL || "http://localhost:3001", {
      auth: { token },
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socketInstance;
    setSocket(socketInstance);

    socketInstance.on("connect", () => {
      setIsConnected(true);
      setError(null);
    });

    socketInstance.on("disconnect", (reason) => {
      setIsConnected(false);
      if (reason === "io server disconnect") {
        // the disconnection was initiated by the server, you need to reconnect manually
        socketInstance.connect();
      }
    });

    socketInstance.on("connect_error", (err) => {
      setError(err);
    });

    socketInstance.on(SOCKET_EVENTS.ERROR, (errData: { message: string }) => {
      setError(new Error(errData.message));
    });

    return () => {
      socketInstance.disconnect();
      socketRef.current = null;
    };
  }, [options.autoConnect]);

  const emit = useCallback((event: string, payload?: any) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit(event, payload);
    } else {
      console.warn(`Socket not connected. Cannot emit event: ${event}`);
    }
  }, []);

  const subscribe = useCallback(
    (event: string, callback: (...args: any[]) => void) => {
      if (socketRef.current) {
        socketRef.current.on(event, callback);
      }
      return () => {
        if (socketRef.current) {
          socketRef.current.off(event, callback);
        }
      };
    },
    [],
  );

  return {
    socket,
    isConnected,
    error,
    emit,
    subscribe,
  };
}
