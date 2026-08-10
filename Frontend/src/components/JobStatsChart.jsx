import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

export default function JobStatsChart() {
  const [activeTab, setActiveTab] = useState("overview");
  const [timePeriod, setTimePeriod] = useState("week");

  const data = [
    { day: "Mon", "Job View": 120, "Job Applied": 80 },
    { day: "Tue", "Job View": 90, "Job Applied": 70 },
    { day: "Wed", "Job View": 122, "Job Applied": 34 },
    { day: "Thu", "Job View": 110, "Job Applied": 100 },
    { day: "Fri", "Job View": 95, "Job Applied": 85 },
    { day: "Sat", "Job View": 65, "Job Applied": 55 },
    { day: "Sun", "Job View": 90, "Job Applied": 80 },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 text-white rounded-lg p-3 shadow-lg">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 bg-cyan-400 rounded-sm"></div>
            <span className="font-semibold">{payload[0].value}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-400 rounded-sm"></div>
            <span className="font-semibold">{payload[1].value}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Job statistics</h2>
          <p className="text-gray-400 text-sm mt-1">
            Showing JobStatistic Jul 19-25
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setTimePeriod("week")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              timePeriod === "week"
                ? "bg-indigo-50 text-indigo-600"
                : "bg-gray-50 text-gray-600 hover:bg-gray-100"
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setTimePeriod("month")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              timePeriod === "month"
                ? "bg-indigo-50 text-indigo-600"
                : "bg-gray-50 text-gray-600 hover:bg-gray-100"
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setTimePeriod("year")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              timePeriod === "year"
                ? "bg-indigo-50 text-indigo-600"
                : "bg-gray-50 text-gray-600 hover:bg-gray-100"
            }`}
          >
            Year
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-8 border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab("overview")}
          className={`pb-3 text-sm font-semibold transition-all ${
            activeTab === "overview"
              ? "text-gray-900 border-b-2 border-indigo-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab("jobview")}
          className={`pb-3 text-sm font-semibold transition-all ${
            activeTab === "jobview"
              ? "text-gray-900 border-b-2 border-indigo-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Jobs View
        </button>
        <button
          onClick={() => setActiveTab("jobapplied")}
          className={`pb-3 text-sm font-semibold transition-all ${
            activeTab === "jobapplied"
              ? "text-gray-900 border-b-2 border-indigo-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Jobs Applied
        </button>
      </div>

      {/* Chart and Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart Section */}
        <div className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
              barGap={0}
              barCategoryGap="25%"
            >
              <CartesianGrid
                strokeDasharray="0"
                stroke="transparent"
                vertical={false}
              />
              <XAxis
                dataKey="day"
                tick={{ fill: "#9ca3af", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "rgba(0, 0, 0, 0)" }}
              />
              <Bar
                dataKey="Job Applied"
                stackId="a"
                fill="#3b82f6"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="Job View"
                stackId="a"
                fill="#fbbf24"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div className="flex gap-6 mt-4 ml-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-400 rounded-sm"></div>
              <span className="text-gray-700 text-sm font-medium">
                Job View
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded-sm"></div>
              <span className="text-gray-700 text-sm font-medium">
                Job Applied
              </span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="flex flex-col gap-4">
          {/* Job Views Card */}
          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-gray-600 text-sm font-semibold">Job Views</h3>
              <div className="w-9 h-9 bg-amber-400 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                </svg>
              </div>
            </div>
            <div className="mb-2">
              <p className="text-3xl font-bold text-gray-900">2,342</p>
              <p className="text-gray-400 text-xs mt-1">
                This Week{" "}
                <span className="text-cyan-500 font-semibold">6.4% ▲</span>
              </p>
            </div>
          </div>

          {/* Job Applied Card */}
          <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-gray-600 text-sm font-semibold">
                Job Applied
              </h3>
              <div className="w-9 h-9 bg-cyan-400 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M20 6h-2.18c.11-.31.18-.65.18-1a2.996 2.996 0 00-5.5-1.65l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 11 8.76l1-1.36 1 1.36L15.38 12 17 10.83 14.92 8H20v6z" />
                </svg>
              </div>
            </div>
            <div className="mb-2">
              <p className="text-3xl font-bold text-gray-900">654</p>
              <p className="text-gray-400 text-xs mt-1">
                This Week{" "}
                <span className="text-red-500 font-semibold">0.5% ▼</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
