// Quick test for the new endpoints
// Run with: node test_endpoints.js

const testEndpoints = async () => {
  console.log("🧪 Testing Job Details Endpoints...\n");

  // Replace with your actual token and job ID
  const token = "YOUR_TOKEN_HERE";
  const jobId = "693c2a5a7ad215584fc056c9";

  try {
    // Test 1: Get Job Details
    console.log("1️⃣ Testing GET /api/jobs/:id");
    const jobRes = await fetch(`http://localhost:5000/api/jobs/${jobId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const jobData = await jobRes.json();
    console.log("   Status:", jobRes.status);
    console.log("   Data:", jobData.success ? "✅ Success" : "❌ Failed");
    console.log("");

    // Test 2: Analyze Job
    console.log("2️⃣ Testing GET /api/ml/analyze-job/:id");
    const analysisRes = await fetch(
      `http://localhost:5000/api/ml/analyze-job/${jobId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const analysisData = await analysisRes.json();
    console.log("   Status:", analysisRes.status);
    console.log("   Data:", analysisData.success ? "✅ Success" : "❌ Failed");
    if (analysisData.data) {
      console.log("   Match Score:", analysisData.data.matchScore);
      console.log(
        "   Matched Skills:",
        analysisData.data.matchedSkills?.length || 0
      );
      console.log(
        "   Missing Skills:",
        analysisData.data.missingSkills?.length || 0
      );
    }
    console.log("");

    // Test 3: Apply to Job
    console.log("3️⃣ Testing POST /api/jobs/:id/apply");
    const applyRes = await fetch(
      `http://localhost:5000/api/jobs/${jobId}/apply`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    const applyData = await applyRes.json();
    console.log("   Status:", applyRes.status);
    console.log("   Data:", applyData.success ? "✅ Success" : "❌ Failed");
    console.log("   Message:", applyData.message);
    console.log("");
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
};

console.log(
  "⚠️  Note: Update the token and jobId variables in this file first!\n"
);
// testEndpoints();
