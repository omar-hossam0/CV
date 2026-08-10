import React from "react";
import { useTheme } from "../context/ThemeContext.jsx";

const companies = [
  { name: "Google", logo: "https://cdn.simpleicons.org/google/4285F4" },
  { name: "Amazon", logo: "https://cdn.simpleicons.org/amazon/FF9900" },
  { name: "Meta", logo: "https://cdn.simpleicons.org/meta/0081FB" },
  { name: "Netflix", logo: "https://cdn.simpleicons.org/netflix/E50914" },
  { name: "Tesla", logo: "https://cdn.simpleicons.org/tesla/CC0000" },
  { name: "Samsung", logo: "https://cdn.simpleicons.org/samsung/1428A0" },
  { name: "Coca Cola", logo: "https://cdn.simpleicons.org/cocacola/E41A1C" },
  { name: "Starbucks", logo: "https://cdn.simpleicons.org/starbucks/036635" },
  { name: "Intel", logo: "https://cdn.simpleicons.org/intel/0071C5" },
];

const CompanySection = () => {
  const { isDark } = useTheme();

  return (
    <section
      id="about"
      className="relative py-24 px-4 transition-colors duration-300"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16 reveal" data-delay="1">
          <h2
            className={`text-4xl lg:text-5xl font-bold mb-4 ${
              isDark ? "text-white" : "text-slate-900"
            }`}
          >
            Over{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              10,000 top
            </span>
            <br />
            companies join with us
          </h2>
          <p
            className={`text-lg max-w-2xl mx-auto ${
              isDark ? "text-slate-300" : "text-slate-600"
            }`}
          >
            Join a community with staff, pensions, as well as other benefits, we
            will always be the best choice for your career.
          </p>
        </div>

        {/* Company Logos Grid */}
        <div
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8 items-center justify-items-center reveal-gentle"
          data-delay="2"
        >
          {companies.map((company, index) => (
            <div
              key={index}
              className={`group rounded-2xl p-6 w-full h-32 flex items-center justify-center shadow-lg hover:shadow-2xl hover:border-blue-500 transition-all duration-300 hover:-translate-y-2 cursor-pointer ${
                isDark
                  ? "bg-slate-800 border border-slate-700"
                  : "bg-white border border-gray-200"
              }`}
            >
              <img
                src={company.logo}
                alt={company.name}
                className="max-w-full max-h-16 object-contain filter grayscale group-hover:grayscale-0 transition-all duration-300 opacity-60 group-hover:opacity-100"
                title={company.name}
              />
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-16 reveal" data-delay="3">
          <button className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-10 py-4 rounded-full font-semibold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
            View All Companies →
          </button>
        </div>
      </div>
    </section>
  );
};

export default CompanySection;
