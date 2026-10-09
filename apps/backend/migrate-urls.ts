import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

// Load env
dotenv.config({ path: path.join(__dirname, ".env") });

import User from "./src/models/User";
import Presentation from "./src/models/Presentation";
import FileResource from "./src/models/FileResource";
import Report from "./src/models/Report";

const OLD_DOMAIN = "https://projectsentio.blob.core.windows.net";
const NEW_DOMAIN =
  process.env.R2_PUBLIC_DOMAIN + "/" + process.env.R2_BUCKET_NAME;

async function migrate() {
  if (!process.env.MONGO_URI) {
    console.error("No MONGO_URI");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB.");

  let updatedCount = 0;

  // 1. Users
  const users = await User.find({ avatar: { $regex: OLD_DOMAIN } });
  for (const user of users) {
    if (user.avatar) {
      user.avatar = user.avatar.replace(OLD_DOMAIN, NEW_DOMAIN);
      await user.save();
      updatedCount++;
    }
  }

  // 2. Presentations (coverImage, pdfUrl)
  const presentations = await Presentation.find({
    $or: [
      { coverImage: { $regex: OLD_DOMAIN } },
      { pdfUrl: { $regex: OLD_DOMAIN } },
    ],
  });
  for (const pres of presentations) {
    if (pres.coverImage && pres.coverImage.includes(OLD_DOMAIN)) {
      pres.coverImage = pres.coverImage.replace(OLD_DOMAIN, NEW_DOMAIN);
    }
    if (pres.pdfUrl && pres.pdfUrl.includes(OLD_DOMAIN)) {
      pres.pdfUrl = pres.pdfUrl.replace(OLD_DOMAIN, NEW_DOMAIN);
    }
    await pres.save();
    updatedCount++;
  }

  // 3. FileResources
  const files = await FileResource.find({ fileUrl: { $regex: OLD_DOMAIN } });
  for (const file of files) {
    if (file.fileUrl) {
      file.fileUrl = file.fileUrl.replace(OLD_DOMAIN, NEW_DOMAIN);
      await file.save();
      updatedCount++;
    }
  }

  // 4. Reports
  const reports = await Report.find({ fileUrl: { $regex: OLD_DOMAIN } });
  for (const report of reports) {
    if (report.fileUrl) {
      report.fileUrl = report.fileUrl.replace(OLD_DOMAIN, NEW_DOMAIN);
      await report.save();
      updatedCount++;
    }
  }

  console.log(`Migration complete. Updated ${updatedCount} records.`);
  process.exit(0);
}

migrate().catch(console.error);
