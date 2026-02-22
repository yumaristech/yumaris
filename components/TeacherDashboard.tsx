
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

interface TeacherDashboardProps {
  teacherUsername: string;
  onBack: () => void;
  onLogout: () => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

interface Student {
  username: string;
  identitas: string;
  class_name: string;
}

interface Submission {
  id: number;
  surah: string;
  ayah: number;
  created_at: string;
}

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ teacherUsername, onBack, onLogout, showToast }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [assignedClasses, setAssignedClasses] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingProgress, setIsFetchingProgress] = useState(false);

  useEffect(() => {
    fetchTeacherData();
  }, [teacherUsername]);

  const fetchTeacherData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch assigned classes
      const { data: classData, error: classError } = await supabase
        .from('teacher_classes')
        .select('class_name')
        .eq('teacher_username', teacherUsername);

      if (classError) throw classError;
      const classList = classData?.map(c => c.class_name) || [];
      setAssignedClasses(classList);

      // 2. Fetch students in those classes
      if (classList.length > 0) {
        const { data: studentData, error: studentError } = await supabase
          .from('users')
          .select('username, identitas, class_name')
          .eq('role', 'user')
          .in('class_name', classList)
          .order('username', { ascending: true });

        if (studentError) throw studentError;
        setStudents(studentData || []);
      } else {
        setStudents([]);
      }
    } catch (err) {
      console.error('Error fetching teacher data:', err);
      showToast('Gagal mengambil data guru', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredStudents = selectedClass === 'all' 
    ? students 
    : students.filter(s => s.class_name === selectedClass);

  const fetchStudentProgress = async (student: Student) => {
    setSelectedStudent(student);
    setIsFetchingProgress(true);
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('participant_id', student.identitas)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (err) {
      console.error('Error fetching progress:', err);
      showToast('Gagal mengambil progres siswa', 'error');
    } finally {
      setIsFetchingProgress(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="h-full w-full flex flex-col p-4 md:p-8 bg-slate-900 overflow-y-auto custom-scrollbar animate-fade-in">
      <div className="max-w-6xl mx-auto w-full space-y-8">
        
        <div className="flex items-center justify-between bg-white/10 backdrop-blur-xl p-6 rounded-[32px] border border-white/10">
          <div>
            <h2 className="text-2xl font-black text-white">👨‍🏫 Teacher Dashboard</h2>
            <p className="text-purple-400 text-xs font-bold uppercase tracking-widest mt-1">Monitoring Progres Hafalan Siswa</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={onBack}
              className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-bold transition-all"
            >
              Kembali
            </button>
            <button 
              onClick={onLogout}
              className="px-6 py-2 bg-red-500/20 hover:bg-red-500/40 text-white rounded-xl text-sm font-bold transition-all border border-red-500/30"
            >
              Keluar
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Student List Section */}
          <div className="lg:col-span-4 bg-white rounded-[32px] p-8 shadow-2xl border border-purple-50 h-fit">
            <h3 className="text-xl font-black text-purple-800 mb-6 flex items-center gap-2">
              <span>👥</span> Daftar Siswa
            </h3>

            <div className="mb-4">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Filter Kelas</label>
              <select 
                className="w-full px-4 py-2 border-2 border-gray-100 rounded-xl focus:border-purple-500 focus:outline-none transition-all font-medium bg-white text-sm"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                <option value="all">Semua Kelas Diampu</option>
                {assignedClasses.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center py-10">
                <div className="w-8 h-8 border-4 border-purple-100 border-t-purple-600 rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {filteredStudents.length === 0 && <p className="text-center text-gray-400 py-10">Belum ada siswa.</p>}
                {filteredStudents.map((student) => (
                  <button
                    key={student.username}
                    onClick={() => fetchStudentProgress(student)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left ${
                      selectedStudent?.username === student.username 
                        ? 'bg-purple-50 border-purple-200 ring-2 ring-purple-100' 
                        : 'bg-gray-50 border-gray-100 hover:bg-gray-100'
                    }`}
                  >
                    <div>
                      <p className="font-bold text-gray-800">{student.username}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{student.identitas}</p>
                        <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-bold">{student.class_name}</span>
                      </div>
                    </div>
                    <span className="text-xl">→</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Progress Section */}
          <div className="lg:col-span-8 bg-white rounded-[32px] p-8 shadow-2xl border border-purple-50">
            {selectedStudent ? (
              <>
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xl font-black text-purple-800 flex items-center gap-2">
                      <span>📊</span> Progres: {selectedStudent.username}
                    </h3>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">ID: {selectedStudent.identitas}</p>
                  </div>
                  <div className="px-4 py-2 bg-purple-50 rounded-xl border border-purple-100">
                    <span className="text-purple-700 font-bold text-sm">Total: {submissions.length} Setoran</span>
                  </div>
                </div>

                {isFetchingProgress ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <div className="w-12 h-12 border-4 border-purple-100 border-t-purple-600 rounded-full animate-spin"></div>
                    <p className="text-gray-400 font-medium">Memuat progres...</p>
                  </div>
                ) : submissions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                    <div className="text-6xl">📭</div>
                    <p className="text-xl font-bold text-gray-800">Siswa belum memiliki riwayat setoran.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="py-4 px-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">No</th>
                          <th className="py-4 px-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Surah</th>
                          <th className="py-4 px-2 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Ayat</th>
                          <th className="py-4 px-2 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Waktu Setor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {submissions.map((item, index) => (
                          <tr key={item.id} className="group hover:bg-purple-50/50 transition-colors">
                            <td className="py-3 px-2 text-xs font-bold text-gray-400">{submissions.length - index}</td>
                            <td className="py-3 px-2">
                              <div className="flex items-center gap-2">
                                <span className="text-sm">📖</span>
                                <span className="font-bold text-gray-800 text-sm">{item.surah}</span>
                              </div>
                            </td>
                            <td className="py-3 px-2 text-center">
                              <span className="inline-block px-2 py-0.5 bg-purple-50 text-purple-700 rounded-lg font-bold text-xs border border-purple-100">
                                {item.ayah}
                              </span>
                            </td>
                            <td className="py-3 px-2 text-right">
                              <span className="text-xs font-medium text-gray-500">{formatDate(item.created_at)}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-32 text-center space-y-6">
                <div className="w-24 h-24 bg-purple-50 rounded-full flex items-center justify-center text-5xl animate-bounce">
                  👈
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-gray-800">Pilih Siswa</h3>
                  <p className="text-gray-400 max-w-xs mx-auto">Silakan pilih siswa dari daftar di sebelah kiri untuk melihat detail progres hafalan mereka.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
