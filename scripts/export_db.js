import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { EJSON } from "bson";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/cv_project_db";
const OUTPUT_DIR = process.env.OUTPUT_DIR || path.join(__dirname, "../db_dump");

async function exportDatabase() {
  console.log(`🔌 Connecting to MongoDB: ${MONGODB_URI}`);
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const collections = await db.listCollections().toArray();
  console.log(`📦 Found ${collections.length} collections. Starting export to: ${OUTPUT_DIR}\n`);

  const manifest = {
    exportedAt: new Date().toISOString(),
    database: mongoose.connection.name,
    collections: {},
  };

  for (const collInfo of collections) {
    const collName = collInfo.name;
    if (collName.startsWith("system.")) continue;

    const collection = db.collection(collName);
    const documents = await collection.find({}).toArray();
    const filePath = path.join(OUTPUT_DIR, `${collName}.json`);

    // Use BSON EJSON to preserve ObjectIds, Dates, and Binary GridFS buffers perfectly
    const serialized = EJSON.stringify(documents, null, 2);
    fs.writeFileSync(filePath, serialized, "utf-8");

    manifest.collections[collName] = documents.length;
    console.log(`  ✅ Exported [${collName}]: ${documents.length} documents -> ${path.basename(filePath)}`);
  }

  const manifestPath = path.join(OUTPUT_DIR, "manifest.json");
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf-8");
  console.log(`\n📄 Export summary saved to: ${manifestPath}`);
  console.log(`✨ Successfully exported full database to ${OUTPUT_DIR}`);

  await mongoose.disconnect();
}

exportDatabase().catch((err) => {
  console.error("❌ Export failed:", err);
  process.exit(1);
});
