import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import Navbar from "./components/Navbar.jsx";
import TopNavbar from "./components/TopNavbar.jsx";
import HRLayout from "./components/HRLayout.jsx";
import PageTransition from "./components/PageTransition.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import HRDashboard from "./pages/HRDashboard.jsx";
import MatchedCandidates from "./pages/MatchedCandidates.jsx";
import AllJobsMatching from "./pages/AllJobsMatching.jsx";
// Skills page removed
import Jobs from "./pages/Jobs.jsx";
import JobDetails from "./pages/JobDetails.jsx";
import Interview from "./pages/Interview.jsx";
import Profile from "./pages/Profile.jsx";
import HRProfile from "./pages/HRProfile.jsx";
import JobApplicants from "./pages/JobApplicants.jsx";
import CandidateProfile from "./pages/CandidateProfile.jsx";
import HRMessages from "./pages/HRMessages.jsx";
import HRCompanyProfile from "./pages/HRCompanyProfile.jsx";
import HRApplicants from "./pages/HRApplicants.jsx";
import HRSchedule from "./pages/HRSchedule.jsx";
import HRSettings from "./pages/HRSettings.jsx";
import HRHelpCenter from "./pages/HRHelpCenter.jsx";

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const token = localStorage.getItem("token");

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on role
    const redirectPath =
      user.role === "hr" ? "/hr/dashboard" : "/employee/dashboard";
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

export default function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          {/* Public Landing Page */}
          <Route
            path="/"
            element={
              <>
                <Navbar />
                <Home />
              </>
            }
          />

          {/* Auth Pages */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* ========== EMPLOYEE ROUTES ========== */}
          <Route
            path="/employee/dashboard"
            element={
              <ProtectedRoute allowedRoles={["employee", "user"]}>
                <TopNavbar />
                <PageTransition>
                  <Dashboard />
                </PageTransition>
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/profile"
            element={
              <ProtectedRoute allowedRoles={["employee", "user"]}>
                <TopNavbar />
                <PageTransition>
                  <Profile />
                </PageTransition>
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/jobs"
            element={
              <ProtectedRoute allowedRoles={["employee", "user"]}>
                <TopNavbar />
                <PageTransition>
                  <Jobs />
                </PageTransition>
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/jobs/:jobId"
            element={
              <ProtectedRoute allowedRoles={["employee", "user"]}>
                <TopNavbar />
                <PageTransition>
                  <JobDetails />
                </PageTransition>
              </ProtectedRoute>
            }
          />
          {/* /employee/skills removed */}
          {/* /employee/learning removed */}
          <Route
            path="/employee/interview"
            element={
              <ProtectedRoute allowedRoles={["employee", "user"]}>
                <TopNavbar />
                <PageTransition>
                  <Interview />
                </PageTransition>
              </ProtectedRoute>
            }
          />

          {/* ========== HR ROUTES ========== */}
          <Route
            path="/hr/dashboard"
            element={
              <ProtectedRoute allowedRoles={["hr"]}>
                <HRLayout>
                  <PageTransition>
                    <HRDashboard />
                  </PageTransition>
                </HRLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr/matched-candidates"
            element={
              <ProtectedRoute allowedRoles={["hr"]}>
                <HRLayout>
                  <PageTransition>
                    <MatchedCandidates />
                  </PageTransition>
                </HRLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr/all-jobs-matching"
            element={
              <ProtectedRoute allowedRoles={["hr"]}>
                <TopNavbar />
                <AllJobsMatching />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr/profile"
            element={
              <ProtectedRoute allowedRoles={["hr"]}>
                <HRLayout>
                  <PageTransition>
                    <HRProfile />
                  </PageTransition>
                </HRLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr/jobs"
            element={
              <ProtectedRoute allowedRoles={["hr"]}>
                <HRLayout>
                  <PageTransition>
                    <Jobs />
                  </PageTransition>
                </HRLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr/jobs/:jobId/applicants"
            element={
              <ProtectedRoute allowedRoles={["hr"]}>
                <HRLayout>
                  <PageTransition>
                    <JobApplicants />
                  </PageTransition>
                </HRLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr/candidates/:candidateId"
            element={
              <ProtectedRoute allowedRoles={["hr"]}>
                <HRLayout>
                  <PageTransition>
                    <CandidateProfile />
                  </PageTransition>
                </HRLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr/messages"
            element={
              <ProtectedRoute allowedRoles={["hr"]}>
                <HRLayout>
                  <PageTransition>
                    <HRMessages />
                  </PageTransition>
                </HRLayout>
              </ProtectedRoute>
            }
          />

          {/* Redirect old routes to new structure */}
          <Route
            path="/dashboard"
            element={<Navigate to="/employee/dashboard" replace />}
          />
          <Route
            path="/hr-dashboard"
            element={<Navigate to="/hr/dashboard" replace />}
          />
          <Route
            path="/profile"
            element={<Navigate to="/employee/profile" replace />}
          />
          <Route
            path="/jobs"
            element={<Navigate to="/employee/jobs" replace />}
          />
          {/* /skills redirect removed */}
          {/* /learning redirect removed */}
          <Route
            path="/interview"
            element={<Navigate to="/employee/interview" replace />}
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}
