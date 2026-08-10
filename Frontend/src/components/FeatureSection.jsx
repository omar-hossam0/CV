import React from "react";
import { useTheme } from "../context/ThemeContext.jsx";

const FeatureSection = () => {
  const { isDark } = useTheme();

  return (
    <section
      id="features"
      className="relative py-24 px-4 transition-colors duration-300"
    >
      <div className="max-w-7xl mx-auto">
        {/* Feature 1: Find your passion */}
        <div
          className="max-w-4xl mx-auto text-center mb-32 reveal"
          data-delay="1"
        >
          <h2
            className={`text-4xl lg:text-5xl font-bold mb-6 leading-tight ${
              isDark ? "text-white" : "text-slate-900"
            }`}
          >
            Find your passion and{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              achieve success
            </span>
          </h2>
          <p
            className={`text-lg leading-relaxed mb-6 ${
              isDark ? "text-slate-300" : "text-slate-600"
            }`}
          >
            We help you find not just a job, but a career that you'll love. Our
            advanced AI analyzes your skills, interests, and career goals to
            match you with opportunities that align with your passion.
          </p>
          <p
            className={`text-lg leading-relaxed ${
              isDark ? "text-slate-300" : "text-slate-600"
            }`}
          >
            Take the first step according to our expert guides and achieve the
            success you've always dreamed of.
          </p>
        </div>

        {/* Feature 2: Million of jobs */}
        <div className="max-w-4xl mx-auto text-center reveal" data-delay="2">
          <h2
            className={`text-4xl lg:text-5xl font-bold mb-6 leading-tight ${
              isDark ? "text-white" : "text-slate-900"
            }`}
          >
            Million of jobs, finds{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
              the one thats rights for you
            </span>
          </h2>
          <p
            className={`text-lg leading-relaxed mb-6 ${
              isDark ? "text-slate-300" : "text-slate-600"
            }`}
          >
            Explore a world full of opportunity with millions of active job
            listings from thousands of companies worldwide.
          </p>
          <p
            className={`text-lg leading-relaxed ${
              isDark ? "text-slate-300" : "text-slate-600"
            }`}
          >
            Whether you're an entry-level candidate or an experienced
            professional, we have the right job waiting for you.
          </p>
        </div>
      </div>
    </section>
  );
};

export default FeatureSection;
