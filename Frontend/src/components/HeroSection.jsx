import React from "react";
import heroBg from "../assets/hero-bg.jpeg";

const HeroSection = () => {
  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{
        backgroundColor: "#000926",
        backgroundImage: `url(${heroBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center top",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#000926]/30 via-transparent to-[#000926]/90 z-0" />

      {/* Text Content - Overlay on image */}
      <div className="relative z-10 text-center px-4 mt-[60vh]">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3">
          AI Job Matching
        </h1>
        <p className="text-slate-400 text-sm sm:text-base mb-6 max-w-xl mx-auto">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed diam nos
          nibh euismod tinc tincidunt ut oneee magna aliqua.
        </p>

        {/* Search Bar */}
        <div className="flex items-center gap-2 rounded-full p-1.5 max-w-md mx-auto bg-slate-800/80 border border-slate-700">
          <svg
            className="w-4 h-4 ml-3 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search your rine name..."
            className="flex-1 px-3 py-2 focus:outline-none bg-transparent text-white placeholder-slate-400 text-xs"
          />
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full font-medium text-xs transition-all duration-300">
            Search
          </button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
