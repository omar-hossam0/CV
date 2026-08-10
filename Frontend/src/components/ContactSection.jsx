import React from "react";
import { useTheme } from "../context/ThemeContext.jsx";

const ContactSection = () => {
  const { isDark } = useTheme();

  return (
    <section
      id="contact"
      className="relative py-24 px-4 transition-colors duration-300"
    >
      <div className="max-w-5xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16 reveal" data-delay="1">
          <h2
            className={`text-4xl lg:text-5xl font-bold mb-4 ${
              isDark ? "text-white" : "text-slate-900"
            }`}
          >
            Get started now
          </h2>
          <p
            className={`text-lg max-w-2xl mx-auto ${
              isDark ? "text-slate-300" : "text-slate-600"
            }`}
          >
            Create an account and start your dream job hunting journey today
          </p>
        </div>

        {/* Contact Form */}
        <div
          className={`rounded-3xl shadow-2xl p-8 md:p-12 reveal-gentle ${
            isDark
              ? "bg-slate-800 border border-slate-700"
              : "bg-white border border-gray-200"
          }`}
          data-delay="2"
        >
          <form className="space-y-6">
            {/* Email Input */}
            <div
              className={`flex items-center gap-3 rounded-2xl p-2 ${
                isDark
                  ? "bg-slate-700 border border-slate-600"
                  : "bg-gray-100 border border-gray-300"
              }`}
            >
              <input
                type="email"
                placeholder="Enter your email"
                className={`flex-1 px-6 py-4 bg-transparent focus:outline-none text-lg ${
                  isDark
                    ? "text-white placeholder-slate-400"
                    : "text-slate-900 placeholder-slate-500"
                }`}
              />
              <button
                type="submit"
                className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                Submit
              </button>
            </div>

            {/* Terms */}
            <p
              className={`text-center text-sm ${
                isDark ? "text-slate-400" : "text-slate-500"
              }`}
            >
              By signing up you agree to our{" "}
              <a
                href="#"
                className="font-semibold text-blue-400 hover:text-cyan-400 transition-colors"
              >
                Terms & Conditions
              </a>
            </p>
          </form>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
