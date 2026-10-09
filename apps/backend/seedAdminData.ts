import mongoose from "mongoose";
import dotenv from "dotenv";
import AILog from "./src/models/AILog";
import AuditLog from "./src/models/AuditLog";
import User from "./src/models/User";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/sentio";

const ACTIONS = [
  "USER_LOGIN",
  "USER_REGISTER",
  "PRESENTATION_CREATED",
  "PRESENTATION_UPDATED",
  "SESSION_STARTED",
  "SESSION_ENDED",
  "FILE_UPLOADED",
];

async function seedData() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected.");

    const users = await User.find({}).limit(5);
    if (users.length === 0) {
      console.log("No users found. Cannot seed audit logs properly.");
      process.exit(1);
    }
    const adminUser = users.find((u) => u.role === "admin") || users[0];

    console.log("Deleting old AI/Audit mock data...");
    await AILog.deleteMany({ "context.isMock": true });
    await AuditLog.deleteMany({ "details.isMock": true });

    const now = new Date();

    // Seed AI Logs
    console.log("Seeding AI logs...");
    const aiLogsToInsert = [];
    for (let i = 0; i < 150; i++) {
      const daysAgo = Math.floor(Math.random() * 14);
      const pastDate = new Date(
        now.getTime() -
          daysAgo * 24 * 60 * 60 * 1000 -
          Math.random() * 10000000,
      );

      const isError = Math.random() < 0.05; // 5% error rate
      const latency = Math.floor(Math.random() * 1200) + 300; // 300 - 1500ms
      const tokens = Math.floor(Math.random() * 800) + 150;

      aiLogsToInsert.push({
        endpoint: "/api/ai/recommend",
        modelName: "gemini-1.5-flash",
        status: isError ? "error" : "success",
        latencyMs: latency,
        totalTokens: tokens,
        promptTokens: Math.floor(tokens * 0.7),
        completionTokens: Math.floor(tokens * 0.3),
        context: {
          isMock: true,
          feature:
            Math.random() > 0.5 ? "recommendation" : "transcription_summary",
        },
        errorMessage: isError ? "Model rate limit exceeded" : undefined,
        createdAt: pastDate,
      });
    }
    await AILog.insertMany(aiLogsToInsert);

    // Seed Audit Logs
    console.log("Seeding Audit logs...");
    const auditLogsToInsert = [];
    for (let i = 0; i < 80; i++) {
      const daysAgo = Math.floor(Math.random() * 14);
      const pastDate = new Date(
        now.getTime() -
          daysAgo * 24 * 60 * 60 * 1000 -
          Math.random() * 10000000,
      );

      const randomUser = users[Math.floor(Math.random() * users.length)];
      const action = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];

      auditLogsToInsert.push({
        user: randomUser._id,
        action,
        target: randomUser.email,
        details: {
          isMock: true,
          ip: "192.168.1." + Math.floor(Math.random() * 255),
          userAgent:
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        },
        createdAt: pastDate,
      });
    }

    // Add some admin specific logs
    auditLogsToInsert.push({
      user: adminUser._id,
      action: "USER_DELETED",
      target: "spammer@example.com",
      details: { isMock: true },
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    });

    auditLogsToInsert.push({
      user: adminUser._id,
      action: "SYSTEM_NOTIFICATION_SENT",
      target: "ALL_USERS",
      details: {
        isMock: true,
        title: "Scheduled Maintenance",
        deliveryMethod: "both",
      },
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    });

    await AuditLog.insertMany(auditLogsToInsert);

    console.log("Seeding complete!");
    process.exit(0);
  } catch (err) {
    console.error("Seeding error:", err);
    process.exit(1);
  }
}

seedData();
