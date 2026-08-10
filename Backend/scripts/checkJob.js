import mongoose from "mongoose";
import Job from "../models/Job.js";
import dotenv from "dotenv";

dotenv.config();

async function checkJob() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const jobId = "69422ade91f3b4345906a5e4";
    const job = await Job.findById(jobId);

    if (job) {
      console.log("\n📋 Job Details:");
      console.log("Title:", job.title);
      console.log("Company:", job.company);
      console.log("Required Skills:", job.requiredSkills);
      console.log("\nDescription (first 300 chars):");
      console.log(job.description?.substring(0, 300));
    } else {
      console.log("❌ Job not found with ID:", jobId);

      // Get one job as example
      const sampleJob = await Job.findOne();
      if (sampleJob) {
        console.log("\n📋 Sample Job:");
        console.log("ID:", sampleJob._id);
        console.log("Title:", sampleJob.title);
        console.log("Required Skills:", sampleJob.requiredSkills);
      }
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

checkJob();
