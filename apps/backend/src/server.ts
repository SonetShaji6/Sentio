import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import { APP_NAME } from "@sentio/shared";
import authRoutes from "./routes/auth";

dotenv.config();

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
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);
app.use(helmet());
app.use(express.json());
app.use(cookieParser());

// ── Routes ──
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", app: APP_NAME });
});

app.use("/api/auth", authRoutes);

// ── Socket.IO ──
io.on("connection", (socket) => {
  console.log("A user connected");
  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

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

start();
