import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../.env") });

import User from "./models/User";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@sentio.in";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin@12345";
const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://Sonet:SonetAdmin%40321@cluster0.nwp9obd.mongodb.net/sentio?appName=Cluster0";

async function seedAdmin() {
  try {
    console.log("Connecting to MongoDB Atlas...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB.");

    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

    const existingAdmin = await User.findOne({
      email: ADMIN_EMAIL.toLowerCase(),
    });

    if (existingAdmin) {
      existingAdmin.name = "System Administrator";
      existingAdmin.passwordHash = passwordHash;
      existingAdmin.role = "admin";
      existingAdmin.isEmailVerified = true;
      existingAdmin.isBlocked = false;
      await existingAdmin.save();
      console.log(`✅ Admin user updated successfully!`);
    } else {
      await User.create({
        name: "System Administrator",
        email: ADMIN_EMAIL.toLowerCase(),
        passwordHash,
        role: "admin",
        isEmailVerified: true,
        isBlocked: false,
      });
      console.log(`✅ Admin user created successfully!`);
    }

    console.log(`-----------------------------------`);
    console.log(`Admin Email:    ${ADMIN_EMAIL}`);
    console.log(`Admin Password: ${ADMIN_PASSWORD}`);
    console.log(`Role:           admin`);
    console.log(`-----------------------------------`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to seed admin user:", error);
    process.exit(1);
  }
}

seedAdmin();
