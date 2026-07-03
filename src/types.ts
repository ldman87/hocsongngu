export interface Registration {
  id?: string;
  studentName: string;
  selectedSubjects: string[];
  timestamp: string; // ISO string or Firebase timestamp converted to string
  updatedAt?: string;
}

export interface SubjectStats {
  subject: string;
  count: number;
  percentage: number;
  students: string[];
}
