
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

interface ProgressScreenProps {
  participantId: string;
  onBack: () => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

interface Submission {
  id: number;
  surah: string;
  ayah: number;
  created_at: string;
}

const ProgressScreen: React.FC<ProgressScreenProps> = ({ participantId, onBack, showToast }) => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProgress();
  }, [participantId]);

  const fetchProgress = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('participant_id', participantId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (err) {
      console.error('Error fetching progress:', err);
      showToast('Gagal mengambil data progres', 'error');
    } finally {
      setIsLoading(false);
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
      <div className="max-w-4xl mx-auto w-full space-y-8">
        
        <div className="flex items-center justify-between bg-white/10 backdrop-blur-xl p-6 rounded-[32px] border border-white/10">
          <div>
            <h2 className="text-2xl font-black text-white">📊 Progres Hafalan</h2>
            <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest mt-1">ID Peserta: {participantId}</p>
          </div>
          <button 
            onClick={onBack}
            className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-bold transition-all"
          >
            Kembali
          </button>
        </div>

        <div className="bg-white rounded-[32px] p-8 shadow-2xl border border-green-50">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-green-800 flex items-center gap-2">
              <span>📜</span> Riwayat Setoran
            </h3>
            <div className="px-4 py-2 bg-green-50 rounded-xl border border-green-100">
              <span className="text-green-700 font-bold text-sm">Total: {submissions.length} Setoran</span>
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
              <p className="text-gray-400 font-medium">Memuat data...</p>
            </div>
          ) : submissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <div className="text-6xl">📭</div>
              <div className="space-y-1">
                <p className="text-xl font-bold text-gray-800">Belum ada progres</p>
                <p className="text-gray-400">Mulai setor hafalan Anda sekarang!</p>
              </div>
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
                    <tr key={item.id} className="group hover:bg-green-50/50 transition-colors">
                      <td className="py-3 px-2 text-xs font-bold text-gray-400">{submissions.length - index}</td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">📖</span>
                          <span className="font-bold text-gray-800 text-sm">{item.surah}</span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className="inline-block px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-lg font-bold text-xs border border-emerald-100">
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
        </div>

        <div className="bg-gradient-to-br from-emerald-600 to-green-700 rounded-[32px] p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 text-8xl rotate-12">⭐</div>
          <div className="relative z-10 space-y-4">
            <h3 className="text-2xl font-black">Terus Semangat!</h3>
            <p className="text-emerald-50 font-medium max-w-md">
              "Sebaik-baik kalian adalah orang yang belajar Al-Qur'an dan mengajarkannya." (HR. Bukhari)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressScreen;
