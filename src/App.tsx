import React, { useState } from "react";
import StudentSurvey from "./components/StudentSurvey";
import SubjectSummary from "./components/SubjectSummary";
import TeacherPortal from "./components/TeacherPortal";
import { ClipboardList, BarChart3, Lock } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<"survey" | "summary" | "teacher">("survey");

  return (
    <div className="min-h-screen bg-teal-50 text-slate-800 flex flex-col font-sans selection:bg-teal-500 selection:text-white">
      {/* Header Section */}
      <header className="bg-teal-700 text-white px-6 md:px-8 py-5 md:py-6 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-lg">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight uppercase text-center sm:text-left">
            Khảo sát Nguyện vọng Học Song ngữ
          </h1>
          <p className="text-teal-100 opacity-90 text-sm text-center sm:text-left">
            Tập thể lớp 10A7 • Năm học 2026 - 2027
          </p>
        </div>
        <div className="flex items-center gap-4 bg-teal-800/50 px-4 py-2 rounded-lg border border-teal-600 shrink-0">
          <div className="text-right">
            <p className="text-[10px] text-teal-200 uppercase font-bold tracking-wider">Giáo viên phụ trách</p>
            <p className="text-sm font-medium">ldman87@gmail.com</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center border-2 border-teal-300 shrink-0 font-bold text-white">
            LD
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-teal-100 sticky top-0 z-40 shadow-xs">
        <div className="max-w-5xl mx-auto px-4">
          <nav className="flex justify-center gap-2 md:gap-6 py-3">
            <button
              onClick={() => setActiveTab("survey")}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs md:text-sm font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === "survey"
                  ? "bg-teal-50 text-teal-700 shadow-xs"
                  : "text-slate-600 hover:text-teal-600 hover:bg-teal-50"
              }`}
            >
              <ClipboardList className="w-4 h-4 shrink-0" />
              Phiếu Đăng Ký
            </button>

            <button
              onClick={() => setActiveTab("summary")}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs md:text-sm font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === "summary"
                  ? "bg-teal-50 text-teal-700 shadow-xs"
                  : "text-slate-600 hover:text-teal-600 hover:bg-teal-50"
              }`}
            >
              <BarChart3 className="w-4 h-4 shrink-0" />
              Tổng Hợp Lớp
            </button>

            <button
              onClick={() => setActiveTab("teacher")}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs md:text-sm font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === "teacher"
                  ? "bg-teal-50 text-teal-700 shadow-xs"
                  : "text-slate-600 hover:text-teal-600 hover:bg-slate-50"
              }`}
            >
              <Lock className="w-4 h-4 shrink-0" />
              Cổng Giáo Viên
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 md:py-8">
        <div className="transition-all duration-300">
          {activeTab === "survey" && <StudentSurvey />}
          {activeTab === "summary" && <SubjectSummary />}
          {activeTab === "teacher" && <TeacherPortal />}
        </div>
      </main>

      {/* Footer Section */}
      <footer className="px-6 md:px-8 py-4 bg-white border-t border-teal-100 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-slate-400 font-medium">
        <span>© 2026 Hệ thống Quản lý Học tập - THPT Song ngữ 10A7</span>
        <div className="flex gap-4">
          <span className="text-teal-600">Tình trạng: Máy chủ Hoạt động</span>
          <span>Phiên bản 2.1.0</span>
        </div>
      </footer>
    </div>
  );
}
