import React from "react";
import { useScrollReveal } from "../hooks/useScrollReveal.jsx";
import HeroSection from "../components/HeroSection";
import FeatureSection from "../components/FeatureSection";
import CategorySection from "../components/CategorySection";
import LatestJobsSection from "../components/LatestJobsSection";
import CompanySection from "../components/CompanySection";
import TestimonialSection from "../components/TestimonialSection";
import ContactSection from "../components/ContactSection";
import Footer from "../components/Footer";

const Home = () => {
  useScrollReveal();

  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 dark:bg-gradient-to-br dark:from-slate-900 dark:via-blue-900 dark:to-slate-800">
      <HeroSection />
      <FeatureSection />
      <CategorySection />
      <LatestJobsSection />
      <CompanySection />
      <TestimonialSection />
      <ContactSection />
      <Footer />
    </div>
  );
};

export default Home;
