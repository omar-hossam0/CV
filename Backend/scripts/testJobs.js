import dotenv from "dotenv";
import mongoose from "mongoose";
import Job from "../models/Job.js";
import User from "../models/User.js";

dotenv.config();

async function testJobs() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Get count of jobs
    const jobCount = await Job.countDocuments();
    console.log(`\n📊 Total jobs in database: ${jobCount}`);

    // Get active jobs
    const activeJobs = await Job.countDocuments({ status: "Active" });
    console.log(`✅ Active jobs: ${activeJobs}`);

    // Get sample jobs
    const jobs = await Job.find({ status: "Active" })
      .limit(5)
      .populate("postedBy", "name email")
      .select("title company location jobType status createdAt");

    if (jobs.length > 0) {
      console.log("\n📋 Sample Jobs:");
      jobs.forEach((job, index) => {
        console.log(`\n${index + 1}. ${job.title}`);
        console.log(`   Company: ${job.company}`);
        console.log(`   Location: ${job.location || "N/A"}`);
        console.log(`   Type: ${job.jobType || "N/A"}`);
        console.log(`   Status: ${job.status}`);
        console.log(`   Posted by: ${job.postedBy?.name || "Unknown"}`);
        console.log(`   Created: ${job.createdAt}`);
      });
    } else {
      console.log("\n⚠️  No active jobs found!");
      console.log("   HR needs to create jobs first.");
    }

    // Get HR users
    const hrUsers = await User.countDocuments({ role: "hr" });
    console.log(`\n👥 HR users in system: ${hrUsers}`);

    await mongoose.disconnect();
    console.log("\n✅ Disconnected from MongoDB");
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

testJobs();
