import React, { useState, useEffect } from "react";
import { STUDENTS, SUBJECTS } from "../data";
import { Registration } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { Check, AlertCircle, Sparkles, BookOpen, User, CheckSquare, Square, RefreshCw } from "lucide-react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";

export default function StudentSurvey() {
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [hasPreviousRegistration, setHasPreviousRegistration] = useState<boolean>(false);
  const [existingRegistration, setExistingRegistration] = useState<Registration | null>(null);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  // Filter students based on search term
  const filteredStudents = STUDENTS.filter(student =>
    student.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Check if student already registered whenever selected student changes
  useEffect(() => {
    if (!selectedStudent) {
      setSelectedSubjects([]);
      setHasPreviousRegistration(false);
      setExistingRegistration(null);
      return;
    }

    const checkRegistration = async () => {
      setLoadingHistory(true);
      try {
        const docRef = doc(db, "registrations", selectedStudent);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const studentReg = docSnap.data() as Registration;
          setExistingRegistration(studentReg);
          setSelectedSubjects(studentReg.selectedSubjects || []);
          setHasPreviousRegistration(true);
        } else {
          setSelectedSubjects([]);
          setHasPreviousRegistration(false);
          setExistingRegistration(null);
        }
      } catch (err) {
        console.error("Error fetching registration history:", err);
      } finally {
        setLoadingHistory(false);
      }
    };

    checkRegistration();
  }, [selectedStudent]);

  const handleSubjectToggle = (subject: string) => {
    if (selectedSubjects.includes(subject)) {
      setSelectedSubjects(selectedSubjects.filter(s => s !== subject));
    } else {
      setSelectedSubjects([...selectedSubjects, subject]);
    }
  };

  const handleSelectAll = () => {
    if (selectedSubjects.length === SUBJECTS.length) {
      setSelectedSubjects([]);
    } else {
      setSelectedSubjects([...SUBJECTS]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) {
      alert("Vui lòng chọn tên của em!");
      return;
    }

    setIsSubmitting(true);
    try {
      const registrationData: any = {
        studentName: selectedStudent,
        selectedSubjects: selectedSubjects,
        timestamp: new Date().toISOString()
      };

      if (hasPreviousRegistration) {
        registrationData.updatedAt = new Date().toISOString();
      }

      const docRef = doc(db, "registrations", selectedStudent);
      await setDoc(docRef, registrationData);
      
      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        // Reset form except student name, so they see it's updated
        setHasPreviousRegistration(true);
        setExistingRegistration(registrationData);
      }, 4000);
    } catch (err) {
      console.error("Error saving registration:", err);
      alert("Có lỗi xảy ra khi lưu dữ liệu. Vui lòng thử lại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-teal-100 p-8 flex flex-col" id="survey-form-container">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-teal-900 flex items-center gap-2">
          <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
          </svg>
          Đăng ký Thông tin Nguyện vọng
        </h2>
        <p className="text-slate-500 text-sm">Vui lòng chọn tên của em và các môn học muốn học bằng Tiếng Anh hoặc Song ngữ.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Name Selection */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Họ và tên học sinh</label>
          
          <div className="relative">
            {selectedStudent ? (
              <div className="flex items-center justify-between w-full px-4 py-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-900 font-medium">
                <span>{selectedStudent}</span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStudent("");
                    setSearchTerm("");
                  }}
                  className="text-xs text-teal-600 hover:text-teal-800 underline font-normal focus:outline-none"
                >
                  Thay đổi
                </button>
              </div>
            ) : (
              <div>
                <input
                  type="text"
                  placeholder="Tìm kiếm hoặc nhấp để chọn tên của em..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-teal-500 outline-none text-slate-700 transition-all placeholder:text-slate-400"
                />
                
                {isDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto divide-y divide-slate-50">
                    {filteredStudents.length > 0 ? (
                      filteredStudents.map((student) => (
                        <button
                          key={student}
                          type="button"
                          onClick={() => {
                            setSelectedStudent(student);
                            setIsDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-teal-50 hover:text-teal-700 text-slate-700 text-sm transition-all"
                        >
                          {student}
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-slate-400 text-center">
                        Không tìm thấy học sinh nào khớp tên
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {isDropdownOpen && (
              <div
                className="fixed inset-0 z-0"
                onClick={() => setIsDropdownOpen(false)}
              />
            )}
          </div>
        </div>

        {/* Loading previous registration info */}
        {loadingHistory && (
          <div className="flex items-center justify-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <RefreshCw className="w-5 h-5 text-teal-500 animate-spin mr-2" />
            <span className="text-sm text-slate-500">Đang kiểm tra lịch sử đăng ký...</span>
          </div>
        )}

        {/* Show notice if already registered */}
        {hasPreviousRegistration && !loadingHistory && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm flex gap-3 items-start"
          >
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Cập nhật đăng ký</p>
              <p className="text-xs mt-0.5">
                Hệ thống ghi nhận em (<strong className="font-medium text-amber-900">{selectedStudent}</strong>) đã khảo sát trước đây. 
                Em có thể thay đổi các môn học bên dưới rồi nhấn <strong>"Xác nhận"</strong> để cập nhật lại kết quả mới nhất.
              </p>
            </div>
          </motion.div>
        )}

        {/* Step 2: Subject selection */}
        {selectedStudent && !loadingHistory && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
              <label className="block text-sm font-semibold text-slate-700">
                Danh sách môn học, hoạt động giáo dục đăng ký Song ngữ <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs text-teal-600 hover:text-teal-800 font-semibold self-start sm:self-center"
              >
                {selectedSubjects.length === SUBJECTS.length ? "Bỏ chọn tất cả" : "Chọn tất cả"}
              </button>
            </div>

            <p className="text-xs text-slate-400 italic">Em có thể lựa chọn nhiều môn học cùng lúc.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {SUBJECTS.map((subject) => {
                const isChecked = selectedSubjects.includes(subject);
                return (
                  <button
                    key={subject}
                    type="button"
                    onClick={() => handleSubjectToggle(subject)}
                    className={`flex items-center p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                      isChecked
                        ? "bg-teal-50 border-teal-300 text-teal-900 shadow-xs"
                        : "bg-white border-teal-100 text-slate-700 hover:bg-teal-50/50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}} // Controlled by button click
                      className="w-5 h-5 rounded border-slate-300 text-teal-600 focus:ring-teal-500 accent-teal-600 cursor-pointer pointer-events-none"
                    />
                    <span className="ml-3 font-semibold text-slate-700 text-sm">{subject}</span>
                  </button>
                );
              })}
            </div>

            {/* Submit buttons */}
            <div className="pt-4 border-t border-slate-100">
              <AnimatePresence mode="wait">
                {submitSuccess ? (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="w-full bg-emerald-500 text-white p-4 rounded-xl flex items-center justify-center gap-2 font-medium"
                  >
                    <Sparkles className="w-5 h-5" />
                    <span>Lưu lựa chọn thành công! Cảm ơn em nhé!</span>
                  </motion.div>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Đang ghi nhận...
                      </span>
                    ) : (
                      <>
                        <span>{hasPreviousRegistration ? "Cập nhật Đăng ký" : "Xác nhận Đăng ký"}</span>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                      </>
                    )}
                  </button>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </form>
    </div>
  );
}
