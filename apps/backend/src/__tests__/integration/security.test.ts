import request from "supertest";
import mongoose from "mongoose";
import { app } from "../../server";
import jwt from "jsonwebtoken";

describe("Module 18: Security & Integration Tests", () => {
  const JWT_SECRET = process.env.JWT_SECRET || "sentio-dev-secret";
  const MONGO_URI =
    process.env.MONGO_URI ||
    "mongodb+srv://Sonet:SonetAdmin%40321@cluster0.nwp9obd.mongodb.net/sentio?appName=Cluster0";

  const userAId = "60d5ecb8b5c9c22b1c8e4001";
  const userBId = "60d5ecb8b5c9c22b1c8e4002";

  const tokenUserA = jwt.sign({ sub: userAId, role: "presenter" }, JWT_SECRET, {
    expiresIn: "1h",
  });
  const tokenUserB = jwt.sign({ sub: userBId, role: "presenter" }, JWT_SECRET, {
    expiresIn: "1h",
  });

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGO_URI);
    }
  }, 15000);

  afterAll(async () => {
    await mongoose.disconnect();
  });

  describe("GET /health", () => {
    it("should return system health status and health payload", async () => {
      const res = await request(app).get("/health");
      expect([200, 503]).toContain(res.status);
      expect(res.body.app).toBe("Sentio");
      expect(res.body.services).toBeDefined();
      expect(res.headers["x-correlation-id"]).toBeDefined();
    });
  });

  describe("IDOR Protection: Reports", () => {
    it("should reject report generation if user does not own the session's presentation", async () => {
      const res = await request(app)
        .post("/api/reports/generate")
        .set("Authorization", `Bearer ${tokenUserA}`)
        .send({ sessionId: "60d5ecb8b5c9c22b1c8e4999", format: "pdf" });

      expect([403, 404]).toContain(res.status);
    });
  });

  describe("Server Security Headers & Correlation IDs", () => {
    it("should include X-Correlation-ID and security headers on responses", async () => {
      const res = await request(app).get("/health");
      expect(res.headers["x-correlation-id"]).toBeDefined();
      expect(res.headers["x-content-type-options"]).toBe("nosniff");
    });
  });
});
