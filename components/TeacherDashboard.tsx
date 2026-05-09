
import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';

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
  whatsapp?: string;
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

  // Weekly Report States
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportData, setReportData] = useState({
    tambahanMinggu: '',
    totalHafalan: '',
    murojaah: '',
    setoranTerakhir: '',
    kelancaran: 'Baik',
    fasohah: 'Baik',
    kedisiplinan: 'Baik',
    adab: 'Baik'
  });

  useEffect(() => {
    fetchTeacherData();
  }, [teacherUsername]);

  const fetchTeacherData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch assigned classes
      const qClasses = query(collection(db, 'teacher_classes'), where('teacher_username', '==', teacherUsername));
      const classSnapshot = await getDocs(qClasses);
      const classList = classSnapshot.docs.map(doc => doc.data().class_name);
      setAssignedClasses(classList);

      // 2. Fetch students in those classes
      if (classList.length > 0) {
        const qStudents = query(
          collection(db, 'users'), 
          where('role', '==', 'user'),
          where('class_name', 'in', classList)
        );
        const studentSnapshot = await getDocs(qStudents);
        const studentData = studentSnapshot.docs.map(doc => doc.data() as Student);
        // Sort manually because Firestore doesn't support orderBy with 'in' easily without composite index
        const sortedStudents = studentData.sort((a, b) => a.username.localeCompare(b.username));
        setStudents(sortedStudents);
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
      const qSubmissions = query(
        collection(db, 'submissions'),
        where('participant_id', '==', student.identitas),
        orderBy('created_at', 'desc')
      );
      const querySnapshot = await getDocs(qSubmissions);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];
      setSubmissions(data || []);
    } catch (err) {
      console.error('Error fetching progress:', err);
      showToast('Gagal mengambil progres siswa', 'error');
    } finally {
      setIsFetchingProgress(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const handleSendReport = () => {
    if (!selectedStudent || !selectedStudent.whatsapp) {
      showToast('No WhatsApp wali tidak ditemukan untuk siswa ini', 'error');
      return;
    }

    const message = `Assalamualaikum Wr. Wb. 
Kepada yang terhormat
Wali santri Ananda *${selectedStudent.identitas}*
Saya Pembina Program Tahfidz Ananda memberikan informasi terkait laporan mingguan sebagai berikut

Tambahan Hafalan Minggu ini : *${reportData.tambahanMinggu}* Halaman
Total Hafalan keseluruhan : *${reportData.totalHafalan}* halaman
Murojaah : *${reportData.murojaah}* Juz
Setoran terakhir : Juz *${reportData.setoranTerakhir}*
Kelancaran : *${reportData.kelancaran}*
Fasohah : *${reportData.fasohah}*
Kedisiplinan : *${reportData.kedisiplinan}*
Adab dan Karakter : *${reportData.adab}*

Demikian laporan mingguan ini kami sampaikan. Jazakumullahu khairan atas dukungan dan kerja samanya dalam mendampingi ananda dalam program ini.
Atas perhatiannya, Saya ucapakan terimakasih ☺️🙏🏻
Wa'alaikumsalam Wr. Wb.`;

    const encodedMessage = encodeURIComponent(message);
    const waUrl = `https://wa.me/${selectedStudent.whatsapp}?text=${encodedMessage}`;
    window.open(waUrl, '_blank');
    setShowReportModal(false);
    showToast('Laporan dikirim ke WhatsApp', 'success');
  };

  return (
    <div className="h-full w-full flex flex-col p-4 md:p-8 bg-slate-900 overflow-y-auto custom-scrollbar animate-fade-in">
      <div className="max-w-6xl mx-auto w-full space-y-8">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between bg-white/10 backdrop-blur-xl p-6 rounded-[32px] border border-white/10 gap-6">
          <div className="text-center md:text-left">
            <h2 className="text-2xl font-black text-white">👨‍🏫 Teacher Dashboard</h2>
            <p className="text-purple-400 text-xs font-bold uppercase tracking-widest mt-1">Monitoring Progres Hafalan Siswa</p>
          </div>
          <div className="flex items-center justify-center md:justify-end gap-3 w-full md:w-auto">
            <button 
              onClick={onBack}
              className="flex-1 md:flex-none px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all border border-white/5 active:scale-95"
            >
              Kembali
            </button>
            <button 
              onClick={onLogout}
              className="flex-1 md:flex-none px-6 py-2.5 bg-red-500/20 hover:bg-red-500/40 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all border border-red-500/30 active:scale-95"
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
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                  <div>
                    <h3 className="text-xl font-black text-purple-800 flex items-center gap-2">
                      <span>📊</span> Progres: {selectedStudent.username}
                    </h3>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">ID: {selectedStudent.identitas}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="px-4 py-2 bg-purple-50 rounded-xl border border-purple-100">
                      <span className="text-purple-700 font-bold text-sm">Total: {submissions.length} Setoran</span>
                    </div>
                    <button 
                      onClick={() => setShowReportModal(true)}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-lg shadow-green-100 active:scale-95"
                    >
                      <span>📄</span> Buat Laporan Mingguan
                    </button>
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

      {/* Weekly Report Modal */}
      {showReportModal && selectedStudent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-[40px] w-full max-w-lg p-8 shadow-2xl relative border-t-8 border-green-500 my-8">
            <button 
              onClick={() => setShowReportModal(false)}
              className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all text-xl"
            >
              ✕
            </button>
            
            <div className="mb-8 text-center pt-4">
              <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-4 border-2 border-green-100">
                📝
              </div>
              <h2 className="text-2xl font-black text-gray-800 tracking-tight">Laporan Mingguan</h2>
              <p className="text-gray-400 font-bold text-xs uppercase tracking-[0.2em] mt-1">Ananda: {selectedStudent.identitas}</p>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Tambahan (Halaman)</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 border-2 border-gray-100 rounded-2xl focus:border-green-500 focus:outline-none transition-all font-medium"
                    placeholder="Contoh: 1.5"
                    value={reportData.tambahanMinggu}
                    onChange={(e) => setReportData({...reportData, tambahanMinggu: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Total Hafalan (Halaman)</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 border-2 border-gray-100 rounded-2xl focus:border-green-500 focus:outline-none transition-all font-medium"
                    placeholder="Contoh: 10"
                    value={reportData.totalHafalan}
                    onChange={(e) => setReportData({...reportData, totalHafalan: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Murojaah (Juz)</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 border-2 border-gray-100 rounded-2xl focus:border-green-500 focus:outline-none transition-all font-medium"
                    placeholder="Contoh: 30"
                    value={reportData.murojaah}
                    onChange={(e) => setReportData({...reportData, murojaah: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Setoran Terakhir (Juz)</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 border-2 border-gray-100 rounded-2xl focus:border-green-500 focus:outline-none transition-all font-medium"
                    placeholder="Contoh: 30"
                    value={reportData.setoranTerakhir}
                    onChange={(e) => setReportData({...reportData, setoranTerakhir: e.target.value})}
                  />
                </div>
              </div>

              {['kelancaran', 'fasohah', 'kedisiplinan', 'adab'].map((field) => (
                <div key={field}>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                    {field === 'adab' ? 'Adab dan Karakter' : field.charAt(0).toUpperCase() + field.slice(1)}
                  </label>
                  <select 
                    className="w-full px-4 py-3 border-2 border-gray-100 rounded-2xl focus:border-green-500 focus:outline-none transition-all font-medium bg-white"
                    value={(reportData as any)[field]}
                    onChange={(e) => setReportData({...reportData, [field]: e.target.value})}
                  >
                    <option value="Sangat Baik">Sangat Baik</option>
                    <option value="Baik">Baik</option>
                    <option value="Cukup">Cukup</option>
                    <option value="Perlu Bimbingan">Perlu Bimbingan</option>
                  </select>
                </div>
              ))}
            </div>
            
            <div className="pt-8">
              <button 
                onClick={handleSendReport}
                className="w-full flex items-center justify-center gap-3 py-5 bg-green-600 hover:bg-green-700 text-white rounded-[24px] font-black text-sm uppercase tracking-widest shadow-xl shadow-green-200 transition-all active:scale-95 group"
              >
                <span>SEND TO WHATSAPP</span>
                <span className="group-hover:translate-x-2 transition-transform">📱</span>
              </button>
              <p className="text-center text-[10px] text-gray-400 font-bold mt-4 uppercase tracking-widest">Wali: {selectedStudent.username} • {selectedStudent.whatsapp || 'No WA Kosong'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
