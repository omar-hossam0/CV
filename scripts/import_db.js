import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { EJSON } from "bson";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/cv_project_db";
const INPUT_DIR = process.env.INPUT_DIR || path.join(__dirname, "../db_dump");

async function importDatabase() {
  console.log(`🔌 Connecting to MongoDB: ${MONGODB_URI}`);
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;

  const manifestPath = path.join(INPUT_DIR, "manifest.json");
  if (!fs.existsSync(manifestPath)) {
    console.error(`❌ Error: manifest.json not found in ${INPUT_DIR}`);
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  console.log(`📦 Importing data exported at: ${manifest.exportedAt}`);
  console.log(`📦 Original database: ${manifest.database}\n`);

  for (const [collName, expectedCount] of Object.entries(manifest.collections)) {
    if (expectedCount === 0) {
      console.log(`  ⏭️  Skipping [${collName}]: 0 documents`);
      continue;
    }

    const filePath = path.join(INPUT_DIR, `${collName}.json`);
    if (!fs.existsSync(filePath)) {
      console.warn(`  ⚠️  File not found for [${collName}], skipping`);
      continue;
    }

    const raw = fs.readFileSync(filePath, "utf-8");
    const documents = EJSON.parse(raw);

    const collection = db.collection(collName);

    // Drop existing data in this collection to avoid duplicates
    await collection.deleteMany({});

    if (documents.length > 0) {
      await collection.insertMany(documents);
    }

    console.log(`  ✅ Imported [${collName}]: ${documents.length} documents`);
  }

  console.log(`\n✨ Database import completed successfully!`);
  await mongoose.disconnect();
}

importDatabase().catch((err) => {
  console.error("❌ Import failed:", err);
  process.exit(1);
});
