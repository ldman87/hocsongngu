import React, { useState, useEffect } from "react";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { SUBJECTS, STUDENTS } from "../data";
import { Registration, SubjectStats } from "../types";
import { BarChart, Users, BookOpen, ChevronRight, ChevronDown, Award } from "lucide-react";
import { motion } from "motion/react";

export default function SubjectSummary() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [stats, setStats] = useState<SubjectStats[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);

  useEffect(() => {
    const q = collection(db, "registrations");
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: Registration[] = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as Registration);
      });
      setRegistrations(data);
      calculateStats(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching registrations in real-time:", error);
      setLoading(false);
      handleFirestoreError(error, OperationType.GET, "registrations");
    });

    return () => unsubscribe();
  }, []);

  const calculateStats = (data: Registration[]) => {
    const subjectCounts: { [key: string]: string[] } = {};
    SUBJECTS.forEach((subject) => {
      subjectCounts[subject] = [];
    });

    data.forEach((reg) => {
      reg.selectedSubjects.forEach((sub) => {
        if (subjectCounts[sub]) {
          subjectCounts[sub].push(reg.studentName);
        }
      });
    });

    const calculatedStats: SubjectStats[] = SUBJECTS.map((subject) => {
      const studentsList = subjectCounts[subject] || [];
      return {
        subject,
        count: studentsList.length,
        percentage: STUDENTS.length > 0 ? Math.round((studentsList.length / STUDENTS.length) * 100) : 0,
        students: studentsList
      };
    });

    // Sort stats by count descending
    calculatedStats.sort((a, b) => b.count - a.count);
    setStats(calculatedStats);
  };

  const toggleExpand = (subject: string) => {
    if (expandedSubject === subject) {
      setExpandedSubject(null);
    } else {
      setExpandedSubject(subject);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-teal-50 p-6 md:p-8 animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-slate-200 rounded"></div>
          <div className="h-4 bg-slate-200 rounded w-5/6"></div>
          <div className="h-4 bg-slate-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  const registeredCount = registrations.length;
  const participationRate = Math.round((registeredCount / STUDENTS.length) * 100);

  return (
    <div className="bg-slate-900 rounded-2xl shadow-xl p-8 flex flex-col text-white overflow-hidden" id="summary-dashboard">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-white">
            <svg className="w-6 h-6 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
            </svg>
            Tổng hợp Kết quả
          </h2>
          <p className="text-slate-400 text-xs mt-1">Số liệu khảo sát nguyện vọng lớp 10A7</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/20">
          <Users className="w-3.5 h-3.5" />
          Tỷ lệ: {registeredCount}/{STUDENTS.length} ({participationRate}%)
        </div>
      </div>

      {/* Progress Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-slate-800/50 border border-slate-800 p-4 rounded-xl flex items-center gap-3">
          <div className="bg-slate-800 p-2.5 rounded-xl text-teal-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-white">{registeredCount}</div>
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Học sinh nộp</div>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-800 p-4 rounded-xl flex items-center gap-3">
          <div className="bg-slate-800 p-2.5 rounded-xl text-teal-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-white">
              {stats.filter(s => s.count > 0).length}
            </div>
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Môn đã chọn</div>
          </div>
        </div>

        <div className="bg-teal-950/40 border border-teal-900/50 p-4 rounded-xl flex items-center gap-3">
          <div className="bg-teal-900/50 p-2.5 rounded-xl text-teal-300">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-teal-200 truncate max-w-[120px]">
              {stats[0]?.count > 0 ? stats[0].subject : "Chưa có"}
            </div>
            <div className="text-[10px] text-teal-400 uppercase font-bold tracking-wider">
              Dẫn đầu ({stats[0]?.count || 0} ĐK)
            </div>
          </div>
        </div>
      </div>

      {/* Stats List */}
      <div className="space-y-4 flex-1">
        <h3 className="text-sm font-semibold text-slate-400">Mức độ quan tâm theo từng môn học</h3>
        
        {stats.length === 0 || registeredCount === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-2xl text-slate-500 text-sm">
            Chưa có phản hồi nào từ học sinh. Hãy là người đầu tiên làm khảo sát nhé!
          </div>
        ) : (
          <div className="space-y-4 divide-y divide-slate-800/50">
            {stats.map((item, index) => {
              const isExpanded = expandedSubject === item.subject;
              return (
                <div key={item.subject} className="pt-4 first:pt-0">
                  {/* Subject Summary Header Button */}
                  <button
                    onClick={() => toggleExpand(item.subject)}
                    className="w-full text-left flex items-start justify-between gap-4 focus:outline-none group cursor-pointer"
                  >
                    <div className="flex-1 space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-300 font-medium group-hover:text-teal-400 transition-colors">
                          {index + 1}. {item.subject}
                        </span>
                        <span className="font-bold text-teal-400">{item.count}/{STUDENTS.length} ({item.percentage}%)</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${item.percentage}%` }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                          className="bg-teal-500 h-full"
                        />
                      </div>
                    </div>
                    
                    <div className="text-slate-500 group-hover:text-teal-400 transition-colors mt-0.5">
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </div>
                  </button>

                  {/* Expanded Student List */}
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 p-4 bg-slate-800/40 rounded-xl border border-slate-800"
                    >
                      <div className="space-y-2">
                        <div className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-teal-400" />
                          Học sinh đã chọn ({item.count}):
                        </div>
                        {item.students.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {item.students.map((student) => (
                              <span
                                key={student}
                                className="inline-flex items-center text-xs bg-slate-800 text-teal-300 border border-slate-700 px-2.5 py-1 rounded-full font-medium shadow-2xs"
                              >
                                {student}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs text-slate-500 italic">Chưa có học sinh nào chọn môn học này.</div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
