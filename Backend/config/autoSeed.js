import User from "../models/User.js";
import Job from "../models/Job.js";
import Candidate from "../models/Candidate.js";

/**
 * Automatically seeds initial production data if the database is completely empty.
 * Runs once on server startup.
 */
export const autoSeedData = async () => {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      // Database already has data, no need to seed
      return;
    }

    console.log("🌱 Empty database detected. Auto-seeding initial default data...");

    // 1. Create Default HR Manager Account
    const hrUser = await User.create({
      name: "HR Manager",
      email: "hr@example.com",
      password: "password123", // Automatically hashed by pre-save hook
      role: "hr",
      phone: "+201000000000",
    });

    console.log("✅ Auto-seeded default HR account (Email: hr@example.com / Password: password123)");

    // 2. Create Default Candidate Account
    const candidateUser = await User.create({
      name: "Ahmed Hassan",
      email: "candidate@example.com",
      password: "password123",
      role: "user",
      phone: "+201000000001",
    });

    // 3. Create Sample Jobs
    const jobs = await Job.insertMany([
      {
        title: "Senior Full Stack Developer",
        company: "Tech Solutions",
        description: "Looking for an experienced Full Stack Developer proficient in React, Node.js, Express, MongoDB, and TypeScript. Experience with Docker and Cloud deployment is a plus.",
        department: "Engineering",
        location: "Cairo, Egypt (Hybrid)",
        jobType: "Full-time",
        status: "Active",
        salary: {
          min: 4000,
          max: 6000,
          currency: "USD",
        },
        requiredSkills: ["React", "Node.js", "JavaScript", "TypeScript", "MongoDB", "Docker"],
        experienceLevel: "Senior Level",
        postedBy: hrUser._id,
      },
      {
        title: "Frontend React Developer",
        company: "Innovate Inc",
        description: "We are seeking a talented Frontend Engineer skilled in React, Tailwind CSS, Vite, Redux, and modern JavaScript UI design.",
        department: "Engineering",
        location: "Remote",
        jobType: "Full-time",
        status: "Active",
        salary: {
          min: 2500,
          max: 4500,
          currency: "USD",
        },
        requiredSkills: ["React", "JavaScript", "HTML", "CSS", "Tailwind CSS", "Vite"],
        experienceLevel: "Mid Level",
        postedBy: hrUser._id,
      },
      {
        title: "Backend Node.js Engineer",
        company: "DataCloud Global",
        description: "Join our core backend team building scalable REST APIs and microservices using Node.js, Express, MongoDB, Redis, and AWS.",
        department: "Engineering",
        location: "Alexandria, Egypt",
        jobType: "Full-time",
        status: "Active",
        salary: {
          min: 3000,
          max: 5000,
          currency: "USD",
        },
        requiredSkills: ["Node.js", "Express", "MongoDB", "REST APIs", "AWS", "Docker"],
        experienceLevel: "Mid Level",
        postedBy: hrUser._id,
      },
      {
        title: "Data Scientist / ML Engineer",
        company: "AI Future Labs",
        description: "Seeking a Data Scientist with hands-on experience in Python, PyTorch, Scikit-learn, NLP, BERT transformers, and data pipelines.",
        department: "AI & Data Science",
        location: "Remote",
        jobType: "Full-time",
        status: "Active",
        salary: {
          min: 4500,
          max: 7000,
          currency: "USD",
        },
        requiredSkills: ["Python", "Machine Learning", "PyTorch", "NLP", "Pandas", "Scikit-learn"],
        experienceLevel: "Senior Level",
        postedBy: hrUser._id,
      },
    ]);

    // 4. Create Sample Candidate Profile
    await Candidate.create({
      name: "Ahmed Hassan",
      email: "candidate@example.com",
      phone: "+201000000001",
      skills: ["React", "Node.js", "JavaScript", "TypeScript", "MongoDB", "Express", "Docker"],
      experience: 5,
      experienceLevel: "Senior Level",
      university: "Cairo University",
      degree: "Bachelor in Computer Science",
      resumeText: "Experienced Full Stack Software Engineer with 5+ years of experience in React, Node.js, Express, MongoDB, RESTful APIs, and Docker.",
      user: candidateUser._id,
      applications: [
        {
          jobId: jobs[0]._id,
          status: "Applied",
          appliedAt: new Date(),
        },
      ],
    });

    console.log(`✨ Successfully auto-seeded ${jobs.length} sample jobs and default accounts!`);
  } catch (err) {
    console.warn("⚠️ Auto-seed note:", err.message);
  }
};
