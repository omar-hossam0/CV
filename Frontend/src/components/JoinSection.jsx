import React from "react";
import { useTheme } from "../context/ThemeContext.jsx";

const JoinSection = () => {
  const { isDark } = useTheme();
  
  return (
    <section className={`relative py-32 px-4 overflow-hidden ${
      isDark 
        ? "bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600"
        : "bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500"
    }`}>
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden opacity-20">
        <div
          className="absolute top-20 left-20 w-96 h-96 bg-white rounded-full filter blur-3xl animate-float"
          style={{ animationDelay: "0s" }}
        ></div>
        <div
          className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full filter blur-3xl animate-float"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto text-center">
        {/* Illustration */}
        <div className="mb-12 reveal" data-delay="1">
          <img
            src="https://undraw.co/api/illustrations/team_collaboration_re_ow29.svg"
            alt="Join us"
            className="w-full max-w-md mx-auto h-auto drop-shadow-2xl"
            style={{
              filter:
                "brightness(1.2) drop-shadow(0 20px 60px rgba(255, 255, 255, 0.2))",
            }}
          />
        </div>

        {/* Title */}
        <h2
          className="text-4xl lg:text-6xl font-bold text-white mb-6 reveal"
          data-delay="2"
        >
          Come on, join with us !
        </h2>

        {/* Subtitle */}
        <p
          className="text-xl text-white/90 mb-12 max-w-2xl mx-auto reveal"
          data-delay="3"
        >
          Create an account and start your dream job hunting journey today
        </p>

        {/* CTA Buttons */}
        <div
          className="flex items-center justify-center gap-4 flex-wrap reveal-fast"
          data-delay="4"
        >
          <button className={`px-10 py-4 rounded-full font-bold text-lg shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 ${
            isDark 
              ? "bg-white text-purple-600" 
              : "bg-white text-teal-600"
          }`}>
            Get Started Now
          </button>
          <button className="bg-white/20 backdrop-blur-sm border-2 border-white text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-white/30 transition-all duration-300">
            Learn More
          </button>
        </div>
      </div>
    </section>
  );
};

export default JoinSection;
