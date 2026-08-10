import mongoose from "mongoose";
import Job from "../models/Job.js";
import Candidate from "../models/Candidate.js";
import User from "../models/User.js";

mongoose.connect("mongodb://localhost:27017/cv-job-matcher").then(async () => {
  try {
    // Get an HR user (or create one)
    let hrUser = await User.findOne({ role: "hr" });

    if (!hrUser) {
      console.log("⚠️ No HR user found, creating one...");
      hrUser = await User.create({
        name: "HR Manager",
        email: "hr@example.com",
        password: "password123", // Will be hashed by pre-save hook
        role: "hr",
      });
      console.log("✅ Created HR user");
    }

    console.log(`📋 Using HR user: ${hrUser._id}`);

    // Clear existing data
    await Job.deleteMany({});
    await Candidate.deleteMany({});
    console.log("🗑️ Cleared existing data");

    // Create sample jobs with postedBy
    const jobs = await Job.insertMany([
      {
        title: "Senior React Developer",
        company: "TechCorp",
        description:
          "We are looking for an experienced React developer with 5+ years of experience",
        department: "Engineering",
        location: "Cairo, Egypt",
        jobType: "Full-time",
        salary: {
          min: 4000,
          max: 6000,
          currency: "USD",
        },
        requiredSkills: ["React", "JavaScript", "TypeScript"],
        experienceLevel: "Senior Level",
        postedBy: hrUser._id,
      },
      {
        title: "Backend Engineer",
        company: "StartupXYZ",
        description: "Join our backend team working with Node.js and MongoDB",
        department: "Engineering",
        location: "Remote",
        jobType: "Full-time",
        salary: {
          min: 3000,
          max: 5000,
          currency: "USD",
        },
        requiredSkills: ["Node.js", "MongoDB", "API Design"],
        experienceLevel: "Mid Level",
        postedBy: hrUser._id,
      },
      {
        title: "Frontend Engineer",
        company: "MegaTech Inc",
        description: "Create beautiful user interfaces for our platform",
        department: "Engineering",
        location: "Alexandria, Egypt",
        jobType: "Full-time",
        salary: {
          min: 2500,
          max: 4000,
          currency: "USD",
        },
        requiredSkills: ["HTML", "CSS", "JavaScript", "Vue"],
        experienceLevel: "Entry Level",
        postedBy: hrUser._id,
      },
    ]);

    // Create sample candidates
    const candidates = await Candidate.insertMany([
      {
        name: "Ahmed Hassan",
        email: "ahmed@example.com",
        phone: "01000000001",
        skills: ["React", "JavaScript", "TypeScript", "Node.js"],
        experience: 6,
        experienceLevel: "Senior Level",
        university: "Cairo University",
        degree: "Bachelor in Computer Science",
      },
      {
        name: "Fatima Ali",
        email: "fatima@example.com",
        phone: "01100000002",
        skills: ["MongoDB", "Node.js", "Express", "API Design"],
        experience: 3,
        experienceLevel: "Mid Level",
        university: "Ain Shams University",
        degree: "Bachelor in Information Technology",
      },
    ]);

    // Add sample application
    const candidate = await Candidate.findOne({ email: "ahmed@example.com" });
    const job = await Job.findOne({ title: "Senior React Developer" });

    if (candidate && job) {
      candidate.applications.push({
        jobId: job._id,
        status: "Applied",
      });
      await candidate.save();
      console.log("✅ Added sample application");
    }

    console.log("✅ Seed data created successfully!");
    console.log(
      `✨ Created ${jobs.length} jobs and ${candidates.length} candidates`
    );

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
});
