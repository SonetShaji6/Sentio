import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

// Load env
dotenv.config({ path: path.join(__dirname, ".env") });

import User from "./src/models/User";
import Presentation from "./src/models/Presentation";
import FileResource from "./src/models/FileResource";
import Report from "./src/models/Report";

const BAD_DOMAIN_PART =
  process.env.R2_PUBLIC_DOMAIN + "/" + process.env.R2_BUCKET_NAME;
const GOOD_DOMAIN_PART = process.env.R2_PUBLIC_DOMAIN;

async function fixUrls() {
  if (!process.env.MONGO_URI) {
    console.error("No MONGO_URI");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB.");

  let updatedCount = 0;

  // 1. Users
  const users = await User.find({ avatar: { $regex: BAD_DOMAIN_PART } });
  for (const user of users) {
    if (user.avatar) {
      user.avatar = user.avatar.replace(
        BAD_DOMAIN_PART,
        GOOD_DOMAIN_PART as string,
      );
      await user.save();
      updatedCount++;
    }
  }

  // 2. Presentations
  const presentations = await Presentation.find({
    $or: [
      { coverImage: { $regex: BAD_DOMAIN_PART } },
      { pdfUrl: { $regex: BAD_DOMAIN_PART } },
    ],
  });
  for (const pres of presentations) {
    if (pres.coverImage && pres.coverImage.includes(BAD_DOMAIN_PART)) {
      pres.coverImage = pres.coverImage.replace(
        BAD_DOMAIN_PART,
        GOOD_DOMAIN_PART as string,
      );
    }
    if (pres.pdfUrl && pres.pdfUrl.includes(BAD_DOMAIN_PART)) {
      pres.pdfUrl = pres.pdfUrl.replace(
        BAD_DOMAIN_PART,
        GOOD_DOMAIN_PART as string,
      );
    }
    await pres.save();
    updatedCount++;
  }

  // 3. FileResources
  const files = await FileResource.find({
    fileUrl: { $regex: BAD_DOMAIN_PART },
  });
  for (const file of files) {
    if (file.fileUrl) {
      file.fileUrl = file.fileUrl.replace(
        BAD_DOMAIN_PART,
        GOOD_DOMAIN_PART as string,
      );
      await file.save();
      updatedCount++;
    }
  }

  // 4. Reports
  const reports = await Report.find({ fileUrl: { $regex: BAD_DOMAIN_PART } });
  for (const report of reports) {
    if (report.fileUrl) {
      report.fileUrl = report.fileUrl.replace(
        BAD_DOMAIN_PART,
        GOOD_DOMAIN_PART as string,
      );
      await report.save();
      updatedCount++;
    }
  }

  console.log(`Fix complete. Updated ${updatedCount} records.`);
  process.exit(0);
}

fixUrls().catch(console.error);
