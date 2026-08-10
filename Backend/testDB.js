import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const testDB = async () => {
  try {
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected!");

    const db = mongoose.connection.db;

    // Get all collections
    const collections = await db.listCollections().toArray();
    console.log("\n📋 All Collections in Database:");
    collections.forEach((col) => {
      console.log(`   - ${col.name}`);
    });

    // Check cv-users collection
    console.log("\n👥 Checking 'cv-users' collection:");
    const usersCount = await db.collection("cv-users").countDocuments();
    console.log(`   Total users: ${usersCount}`);

    if (usersCount > 0) {
      const users = await db.collection("cv-users").find({}).toArray();
      console.log("\n📝 Users Data:");
      users.forEach((user, index) => {
        console.log(
          `   ${index + 1}. ${user.name} (${user.email}) - Role: ${user.role}`
        );
      });
    } else {
      console.log("   ⚠️ No users found in collection!");
    }

    // Check users collection (without hyphen)
    console.log("\n👥 Checking 'users' collection:");
    const usersCount2 = await db.collection("users").countDocuments();
    console.log(`   Total users: ${usersCount2}`);

    if (usersCount2 > 0) {
      const users2 = await db.collection("users").find({}).toArray();
      console.log("\n📝 Users Data in 'users' collection:");
      users2.forEach((user, index) => {
        console.log(
          `   ${index + 1}. ${user.name} (${user.email}) - Role: ${user.role}`
        );
      });
    }

    await mongoose.disconnect();
    console.log("\n✅ Test completed!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
};

testDB();
