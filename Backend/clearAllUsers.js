import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const clearAllUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const db = mongoose.connection.db;
    const result = await db.collection("cv-users").deleteMany({});

    console.log(`\n🗑️ Deleted ${result.deletedCount} user(s)`);
    console.log("✨ Database is now clean!");
    
    await mongoose.connection.close();
    console.log("✅ Done!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

clearAllUsers();
