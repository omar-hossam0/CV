import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const deleteUser = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const db = mongoose.connection.db;
    const result = await db.collection("cv-users").deleteOne({ email: "amor@gmail.com" });

    console.log(`\n🗑️ Deleted ${result.deletedCount} user(s)`);
    
    // Check remaining users
    const remainingUsers = await db.collection("cv-users").find({}).toArray();
    console.log(`\n📊 Remaining users: ${remainingUsers.length}`);
    
    await mongoose.connection.close();
    console.log("✅ Done!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

deleteUser();
