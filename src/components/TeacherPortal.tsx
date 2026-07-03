import React, { useState, useEffect } from "react";
import { STUDENTS, SUBJECTS } from "../data";
import { Registration, SubjectStats } from "../types";
import { LogIn, LogOut, Download, FileSpreadsheet, CheckCircle, AlertTriangle, Search, Filter, Copy, Check } from "lucide-react";
import * as XLSX from "xlsx";
import { motion } from "motion/react";
import { collection, onSnapshot } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";

export default function TeacherPortal() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loginError, setLoginError] = useState<string>("");
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all"); // all, submitted, pending
  const [copied, setCopied] = useState<boolean>(false);

  // Default teacher credentials
  const TEACHER_EMAIL = "ldman87@gmail.com";
  const DEFAULT_PASSWORD = "10A7SongNgu"; // Pre-set easy to remember password

  // Recover session if exists
  useEffect(() => {
    const savedSession = localStorage.getItem("teacher_session");
    if (savedSession === TEACHER_EMAIL) {
      setIsLoggedIn(true);
    }
  }, []);

  // Fetch registrations automatically when logged in
  useEffect(() => {
    if (!isLoggedIn) return;

    setLoading(true);
    const q = collection(db, "registrations");
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: Registration[] = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as Registration);
      });
      // Filter out registrations of students who are not in the class STUDENTS list
      const validData = data.filter((r) => r.studentName && STUDENTS.includes(r.studentName));
      setRegistrations(validData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching registrations for teacher:", error);
      setLoading(false);
      handleFirestoreError(error, OperationType.GET, "registrations");
    });

    return unsubscribe;
  }, [isLoggedIn]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    if (email.trim() !== TEACHER_EMAIL) {
      setLoginError("Email đăng nhập không chính xác hoặc không có quyền truy cập.");
      return;
    }

    if (password !== DEFAULT_PASSWORD) {
      setLoginError("Mật khẩu không chính xác.");
      return;
    }

    setIsLoggedIn(true);
    localStorage.setItem("teacher_session", TEACHER_EMAIL);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem("teacher_session");
    setEmail("");
    setPassword("");
  };

  // Compile full class list status
  const fullClassData = STUDENTS.map((studentName) => {
    const reg = registrations.find((r) => r.studentName === studentName);
    return {
      studentName,
      isRegistered: !!reg,
      selectedSubjects: reg ? reg.selectedSubjects : [],
      timestamp: reg ? new Date(reg.timestamp).toLocaleString("vi-VN") : "Chưa có dữ liệu"
    };
  });

  // Filters and search logic
  const filteredClassData = fullClassData.filter((student) => {
    const matchesSearch = student.studentName.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === "submitted") {
      return matchesSearch && student.isRegistered;
    }
    if (statusFilter === "pending") {
      return matchesSearch && !student.isRegistered;
    }
    return matchesSearch;
  });

  // Calculate stats for Excel export
  const calculateSubjectStats = () => {
    const subjectCounts: { [key: string]: string[] } = {};
    SUBJECTS.forEach((subject) => {
      subjectCounts[subject] = [];
    });

    registrations.forEach((reg) => {
      reg.selectedSubjects.forEach((sub) => {
        if (subjectCounts[sub]) {
          subjectCounts[sub].push(reg.studentName);
        }
      });
    });

    return SUBJECTS.map((subject) => {
      const studentsList = subjectCounts[subject] || [];
      return {
        "Môn Học": subject,
        "Số Lượng Đăng Ký": studentsList.length,
        "Tỉ Lệ (%)": STUDENTS.length > 0 ? `${Math.round((studentsList.length / STUDENTS.length) * 100)}%` : "0%",
        "Danh Sách Học Sinh": studentsList.join(", ")
      };
    });
  };

  // Export to Excel function (using sheetjs)
  const handleExportExcel = () => {
    const workbook = XLSX.utils.book_new();

    // Sheet 1: Detailed survey list
    const detailRows = fullClassData.map((s, idx) => ({
      "STT": idx + 1,
      "Họ và Tên Học Sinh": s.studentName,
      "Trạng Thái Đăng Ký": s.isRegistered ? "Đã xác nhận" : "Chưa khảo sát",
      "Danh Sách Môn Học Đăng Ký": s.isRegistered ? s.selectedSubjects.join(", ") : "N/A",
      "Thời Gian Khảo Sát": s.timestamp
    }));
    const worksheetDetail = XLSX.utils.json_to_sheet(detailRows);
    XLSX.utils.book_append_sheet(workbook, worksheetDetail, "Lựa chọn của từng học sinh");

    // Sheet 2: Summarized subject counts
    const summaryRows = calculateSubjectStats();
    const worksheetSummary = XLSX.utils.json_to_sheet(summaryRows);
    XLSX.utils.book_append_sheet(workbook, worksheetSummary, "Tổng hợp theo môn học");

    // Save and write file
    XLSX.writeFile(workbook, "Ket_Qua_Khao_Sat_Song_Ngu_10A7.xlsx");
  };

  const handleCopyTable = () => {
    // Headers
    let text = "STT\tHọ và Tên Học Sinh\tTrạng Thái Đăng Ký\tDanh Sách Môn Học Đăng Ký\tThời Gian Khảo Sát\n";
    fullClassData.forEach((s, idx) => {
      text += `${idx + 1}\t${s.studentName}\t${s.isRegistered ? "Đã xác nhận" : "Chưa khảo sát"}\t${s.isRegistered ? s.selectedSubjects.join(", ") : "N/A"}\t${s.timestamp}\n`;
    });
    
    // Add summary
    text += "\n\nTỔNG HỢP THEO MÔN HỌC\n";
    text += "Môn Học\tSố Lượng Đăng Ký\tTỉ Lệ (%)\tDanh Sách Học Sinh\n";
    const summaryStats = calculateSubjectStats();
    summaryStats.forEach((row) => {
      text += `${row["Môn Học"]}\t${row["Số Lượng Đăng Ký"]}\t${row["Tỉ Lệ (%)"]}\t${row["Danh Sách Học Sinh"]}\n`;
    });

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }).catch(err => {
      console.error("Failed to copy table: ", err);
      alert("Không thể sao chép tự động. Vui lòng thử lại!");
    });
  };

  const submittedCount = registrations.length;
  const pendingCount = STUDENTS.length - submittedCount;

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-teal-50 p-6 md:p-8 space-y-6" id="teacher-portal-container">
      {/* Tab Header */}
      <div className="flex items-center justify-between border-b border-teal-50 pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-teal-700 text-white p-2.5 rounded-xl">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Cổng Giáo Viên</h2>
            <p className="text-xs text-slate-500">Xem và quản lý phản hồi, xuất báo cáo Excel</p>
          </div>
        </div>

        {isLoggedIn && (
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-800 font-semibold border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            Đăng xuất
          </button>
        )}
      </div>

      {!isLoggedIn ? (
        /* Login Screen */
        <div className="max-w-md mx-auto py-8">
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="text-center space-y-1">
              <div className="mx-auto bg-teal-100 text-teal-700 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-2">
                <LogIn className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 text-lg">Đăng nhập Giáo viên</h3>
              <p className="text-xs text-slate-400">Vui lòng sử dụng tài khoản được cung cấp để xem dữ liệu</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Email Giáo viên</label>
                <input
                  type="email"
                  required
                  placeholder="ldman87@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600">Mật khẩu</label>
                <input
                  type="password"
                  required
                  placeholder="Mật khẩu của giáo viên..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {loginError && (
                <div className="text-xs text-red-600 bg-red-50 border border-red-100 p-3 rounded-xl flex gap-1.5 items-start">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}



              <button
                type="submit"
                className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md cursor-pointer transition-all text-center text-sm"
              >
                Đăng nhập
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* Teacher Dashboard View */
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-emerald-50/60 border border-emerald-100 p-4 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-semibold block">Đã hoàn thành khảo sát</span>
                <span className="text-2xl font-bold text-emerald-700">{submittedCount} học sinh</span>
              </div>
              <CheckCircle className="w-8 h-8 text-emerald-500 stroke-[1.5]" />
            </div>

            <div className="bg-amber-50/60 border border-amber-100 p-4 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-semibold block">Chưa thực hiện khảo sát</span>
                <span className="text-2xl font-bold text-amber-700">{pendingCount} học sinh</span>
              </div>
              <AlertTriangle className="w-8 h-8 text-amber-500 stroke-[1.5]" />
            </div>

            <button
              onClick={handleExportExcel}
              className="bg-teal-600 hover:bg-teal-700 text-white p-4 rounded-xl shadow-lg shadow-teal-600/10 hover:shadow-teal-600/25 transition-all flex flex-col justify-center items-start text-left relative overflow-hidden group cursor-pointer"
            >
              <div className="absolute right-3 bottom-2 text-teal-500 opacity-20 group-hover:scale-110 transition-transform">
                <Download className="w-16 h-16" />
              </div>
              <span className="text-xs text-teal-100 font-semibold block">Xuất file Excel tổng hợp</span>
              <span className="text-base font-bold flex items-center gap-1.5 mt-1">
                <Download className="w-4 h-4" />
                Tải báo cáo về máy
              </span>
            </button>

            <button
              onClick={handleCopyTable}
              className={`${
                copied ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/10" : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/10 hover:shadow-indigo-600/25"
              } text-white p-4 rounded-xl shadow-lg transition-all flex flex-col justify-center items-start text-left relative overflow-hidden group cursor-pointer`}
            >
              <div className="absolute right-3 bottom-2 text-indigo-500 opacity-20 group-hover:scale-110 transition-transform">
                <Copy className="w-16 h-16" />
              </div>
              <span className="text-xs text-indigo-100 font-semibold block">
                {copied ? "Thành công!" : "Hỗ trợ mobile / Zalo"}
              </span>
              <span className="text-base font-bold flex items-center gap-1.5 mt-1">
                {copied ? <Check className="w-4 h-4 text-emerald-200" /> : <Copy className="w-4 h-4" />}
                {copied ? "Đã lưu bộ nhớ tạm" : "Copy bảng dữ liệu"}
              </span>
            </button>
          </div>

          {/* Advice Banner if on Zalo or Mobile */}
          <div className="bg-blue-50 border border-blue-100 p-3.5 rounded-xl flex gap-2 items-start text-xs text-blue-800 leading-relaxed">
            <svg className="w-4.5 h-4.5 text-blue-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <span className="font-semibold block text-blue-950">Mẹo dành cho Giáo viên:</span>
              Nếu bấm nút <strong className="font-semibold text-blue-900">"Tải báo cáo về máy"</strong> trên điện thoại (đặc biệt là khi mở từ tin nhắn Zalo) không hoạt động do cơ chế chặn tải file của ứng dụng, thầy cô vui lòng bấm nút <strong className="font-semibold text-indigo-900">"Copy bảng dữ liệu"</strong>, sau đó mở ứng dụng Google Trang tính (Google Sheets) hoặc Excel trên điện thoại và bấm <strong className="font-semibold text-indigo-900">Dán (Paste)</strong> để nhận toàn bộ kết quả khảo sát ngay lập tức!
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Tìm kiếm tên học sinh..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto self-start md:self-center">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 mr-1 shrink-0">
                <Filter className="w-3.5 h-3.5" /> Lọc danh sách:
              </span>
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg shrink-0 transition-all ${
                  statusFilter === "all" ? "bg-teal-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                Tất cả ({fullClassData.length})
              </button>
              <button
                onClick={() => setStatusFilter("submitted")}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg shrink-0 transition-all ${
                  statusFilter === "submitted" ? "bg-emerald-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                Đã đăng ký ({submittedCount})
              </button>
              <button
                onClick={() => setStatusFilter("pending")}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg shrink-0 transition-all ${
                  statusFilter === "pending" ? "bg-amber-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                Chưa đăng ký ({pendingCount})
              </button>
            </div>
          </div>

          {/* Student Table */}
          <div className="border border-slate-100 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase">
                    <th className="p-4 w-12 text-center">STT</th>
                    <th className="p-4">Họ và Tên</th>
                    <th className="p-4 w-36">Trạng thái</th>
                    <th className="p-4">Các môn đăng ký</th>
                    <th className="p-4 w-44">Thời gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredClassData.length > 0 ? (
                    filteredClassData.map((student, index) => (
                      <tr key={student.studentName} className="hover:bg-slate-50/40 transition-colors">
                        <td className="p-4 text-center text-xs text-slate-400 font-medium">
                          {index + 1}
                        </td>
                        <td className="p-4 font-semibold text-slate-800">
                          {student.studentName}
                        </td>
                        <td className="p-4">
                          {student.isRegistered ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full">
                              Đã nộp phiếu
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100 rounded-full">
                              Chưa khảo sát
                            </span>
                          )}
                        </td>
                        <td className="p-4 max-w-xs md:max-w-md">
                          {student.isRegistered ? (
                            <div className="flex flex-wrap gap-1">
                              {student.selectedSubjects.map((sub) => (
                                <span
                                  key={sub}
                                  className="inline-flex text-[11px] bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded"
                                >
                                  {sub}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-xs">Chưa có dữ liệu</span>
                          )}
                        </td>
                        <td className="p-4 text-xs text-slate-500">
                          {student.timestamp}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400 text-sm">
                        Không tìm thấy kết quả nào phù hợp với bộ lọc
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
