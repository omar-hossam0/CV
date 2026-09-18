import mongoose from "mongoose";

async function check() {
  await mongoose.connect("mongodb://127.0.0.1:27017");
  const admin = mongoose.connection.db.admin();
  const dbs = await admin.listDatabases();
  console.log("Databases found on local MongoDB:");
  for (const dbInfo of dbs.databases) {
    console.log(`- ${dbInfo.name} (${dbInfo.sizeOnDisk} bytes)`);
    if (["admin", "config", "local"].includes(dbInfo.name)) continue;
    const db = mongoose.connection.useDb(dbInfo.name);
    const collections = await db.db.listCollections().toArray();
    for (const c of collections) {
      const count = await db.collection(c.name).countDocuments();
      console.log(`    * ${c.name}: ${count} documents`);
    }
  }
  await mongoose.disconnect();
}

check().catch((err) => {
  console.error("Error inspecting MongoDB:", err.message);
  process.exit(1);
});
