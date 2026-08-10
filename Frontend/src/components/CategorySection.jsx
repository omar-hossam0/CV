import React from "react";
import { useTheme } from "../context/ThemeContext.jsx";

const categories = [
  {
    title: "Accounting / Finance",
    jobs: "745 open position",
    icon: (
      <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
      </svg>
    ),
    color: "from-blue-100 to-blue-200",
    iconColor: "text-blue-600",
  },
  {
    title: "Design / Creative",
    jobs: "1,283 open position",
    icon: (
      <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
      </svg>
    ),
    color: "from-purple-100 to-purple-200",
    iconColor: "text-purple-600",
    featured: true,
  },
  {
    title: "Programming",
    jobs: "2,140 open position",
    icon: (
      <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
        <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z" />
      </svg>
    ),
    color: "from-green-100 to-green-200",
    iconColor: "text-green-600",
  },
  {
    title: "Production / Operation",
    jobs: "892 open position",
    icon: (
      <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20 6h-3V4c0-1.11-.89-2-2-2H9c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zM9 4h6v2H9V4zm3 11c-2.76 0-5-2.24-5-5h2c0 1.66 1.34 3 3 3s3-1.34 3-3h2c0 2.76-2.24 5-5 5z" />
      </svg>
    ),
    color: "from-orange-100 to-orange-200",
    iconColor: "text-orange-600",
  },
  {
    title: "Education / Training",
    jobs: "567 open position",
    icon: (
      <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
        <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z" />
      </svg>
    ),
    color: "from-pink-100 to-pink-200",
    iconColor: "text-pink-600",
  },
  {
    title: "Consultancy",
    jobs: "429 open position",
    icon: (
      <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
      </svg>
    ),
    color: "from-teal-100 to-teal-200",
    iconColor: "text-teal-600",
  },
];

const CategorySection = () => {
  const { isDark } = useTheme();

  return (
    <section
      id="jobs"
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
            Browse jobs by{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              category
            </span>
          </h2>
          <p
            className={`text-lg max-w-2xl mx-auto ${
              isDark ? "text-slate-300" : "text-slate-600"
            }`}
          >
            Choose the field you're most interested in and discover thousands of
            opportunities
          </p>
        </div>

        {/* Category Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category, index) => (
            <div
              key={index}
              className={`group relative rounded-3xl p-8 cursor-pointer transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 hover:border-blue-500 reveal-gentle ${
                isDark
                  ? "bg-slate-700 border border-slate-600"
                  : "bg-white border border-gray-200 shadow-lg"
              } ${category.featured ? "lg:scale-110 shadow-xl border-blue-500" : ""}`}
              data-delay={(index % 3) + 1}
            >
              {category.featured && (
                <div className="absolute -top-3 -right-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                  POPULAR
                </div>
              )}

              <div
                className={`${category.iconColor} mb-4 transform group-hover:scale-110 transition-transform duration-300`}
              >
                {category.icon}
              </div>

              <h3
                className={`text-xl font-bold mb-2 ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                {category.title}
              </h3>

              <p
                className={`text-sm font-medium ${
                  isDark ? "text-slate-400" : "text-slate-600"
                }`}
              >
                {category.jobs}
              </p>

              <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <svg
                  className="w-6 h-6 text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategorySection;
