import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";

dotenv.config();

import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import { APP_NAME } from "@sentio/shared";
import authRoutes from "./routes/auth";
import presentationRoutes from "./routes/presentations";
import notificationRoutes from "./routes/notifications";
import sessionRoutes from "./routes/sessions";
import analyticsRoutes from "./routes/analytics";
import aiRoutes from "./routes/ai";
import reportRoutes from "./routes/reports";
import fileRoutes from "./routes/files";
import adminRoutes from "./routes/admin";
import organizationRoutes from "./routes/organizations";

import { registerSocketHandlers } from "./socketHandlers";
import { correlationIdMiddleware } from "./middleware/correlationId";

const app = express();
const server = http.createServer(app);

// ── CORS origins ──
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:3000")
  .split(",")
  .map((o) => o.trim().replace(/\/+$/, ""));

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

// ── Middleware ──
app.use(correlationIdMiddleware);
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);
app.use(helmet());
app.use(express.json());
app.use(cookieParser());

// ── Health Monitoring Endpoint (Module 16.14) ──
app.get("/health", async (_req, res) => {
  const mongoState = mongoose.connection.readyState;
  const mongoStatus =
    mongoState === 1 ? "UP" : mongoState === 2 ? "CONNECTING" : "DOWN";
  const groqStatus = process.env.GROQ_API_KEY ? "UP" : "DEGRADED";
  const azureStatus = process.env.AZURE_STORAGE_CONNECTION_STRING
    ? "UP"
    : "DEGRADED";

  const overallStatus =
    mongoStatus === "UP"
      ? groqStatus === "UP"
        ? "HEALTHY"
        : "DEGRADED"
      : "UNHEALTHY";

  res.status(overallStatus === "UNHEALTHY" ? 503 : 200).json({
    status: overallStatus,
    app: APP_NAME,
    timestamp: new Date().toISOString(),
    services: {
      database: mongoStatus,
      aiProvider: groqStatus,
      blobStorage: azureStatus,
    },
  });
});

// ── Routes ──
app.use("/api/auth", authRoutes);
app.use("/api/presentations", presentationRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/organizations", organizationRoutes);

// ── Global Error Handling Middleware (Module 16.12) ──
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    const correlationId = (req as any).correlationId;
    console.error(`[Error] [CorrelationID: ${correlationId}]`, err);

    res.status(err.status || 500).json({
      message:
        process.env.NODE_ENV === "production"
          ? "Internal server error"
          : err.message || "Internal server error",
      correlationId,
    });
  },
);

// ── Socket.IO ──
registerSocketHandlers(io);

// ── Start ──
const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/sentio";

async function start() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log(`[${APP_NAME}] Connected to MongoDB`);
  } catch (err) {
    console.warn(`[${APP_NAME}] MongoDB not available – running without DB`);
  }

  server.listen(PORT, () => {
    console.log(`[${APP_NAME}] Backend server is running on port ${PORT}`);
  });
}

// Export for test suites
export { app, server };

if (process.env.NODE_ENV !== "test") {
  start();
}
