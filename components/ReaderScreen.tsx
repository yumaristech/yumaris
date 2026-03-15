
import React, { useState, useEffect, useRef } from 'react';
import { Surah, Ayah, DisplayMode } from '../types';

interface ReaderScreenProps {
  surah: Surah;
  onOpenSetor: (ayahNumber: number) => void;
  showToast: (msg: string, type?: 'info' | 'success' | 'error') => void;
}

const ReaderScreen: React.FC<ReaderScreenProps> = ({ surah, onOpenSetor, showToast }) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [loading, setLoading] = useState(true);
  const [displayMode, setDisplayMode] = useState<DisplayMode>('full');
  const [activeAudio, setActiveAudio] = useState<string | null>(null);
  const [activeAyahId, setActiveAyahId] = useState<number | null>(null);
  
  // Fitur Rentang Ayat
  const [range, setRange] = useState({ start: 1, end: surah.verses });
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Helper untuk mengubah angka ke format Arab (٠١٢٣٤٥٦٧٨٩)
  const toArabicNumerals = (num: number) => {
    return num.toString().split('').map(digit => {
      // 1632 adalah kode Unicode untuk '٠' (Angka Arab 0)
      // 48 adalah kode ASCII untuk '0'
      return String.fromCharCode(digit.charCodeAt(0) + 1632 - 48);
    }).join('');
  };

  // Inisialisasi halaman berdasarkan surah yang dipilih
  useEffect(() => {
    const fetchStartPage = async () => {
      try {
        const res = await fetch(`https://api.alquran.cloud/v1/surah/${surah.number}`);
        const data = await res.json();
        if (data.code === 200) {
          const firstAyahPage = data.data.ayahs?.[0]?.page || 1;
          setCurrentPage(firstAyahPage);
        }
      } catch (e) {
        setCurrentPage(1);
      }
    };
    fetchStartPage();
  }, [surah.number]);

  // Load data halaman setiap kali currentPage berubah
  useEffect(() => {
    const fetchPageData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`https://api.alquran.cloud/v1/page/${currentPage}/ar.husary`);
        const data = await res.json();
        if (data.code === 200) {
          setAyahs(data.data.ayahs);
        } else {
          showToast('Gagal memuat halaman', 'error');
        }
      } catch (err) {
        showToast('Koneksi bermasalah', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchPageData();
  }, [currentPage]);

  // Fungsi untuk melompat ke halaman berdasarkan input ayat
  const handleJumpToAyah = async (ayahNum: number, type: 'start' | 'end') => {
    const newVal = Math.max(1, Math.min(surah.verses, ayahNum));
    setRange(prev => ({ ...prev, [type]: newVal }));
    
    if (type === 'start') {
      try {
        const res = await fetch(`https://api.alquran.cloud/v1/ayah/${surah.number}:${newVal}`);
        const data = await res.json();
        if (data.code === 200 && data.data.page !== currentPage) {
          setCurrentPage(data.data.page);
        }
      } catch (e) { /* ignore */ }
    }
  };

  const toggleAudio = (url: string, ayahId: number) => {
    if (activeAudio === url) {
      audioRef.current?.pause();
      setActiveAudio(null);
      setActiveAyahId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play();
        setActiveAudio(url);
        setActiveAyahId(ayahId);
        showToast(`🔊 Memutar Ayat ${ayahId}...`);
      }
    }
  };

  const cleanAyahText = (ayah: Ayah) => {
    if (ayah.numberInSurah === 1 && ayah.surah?.number !== 1 && ayah.surah?.number !== 9) {
      return ayah.text.replace(/^(بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ|بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ)/, '').trim();
    }
    return ayah.text;
  };

  return (
    <div className="h-full flex flex-col overflow-hidden animate-fade-in bg-slate-900">
      <audio ref={audioRef} onEnded={() => { setActiveAudio(null); setActiveAyahId(null); }} className="hidden" />
      
      {/* Control Bar Terintegrasi */}
      <div className="bg-white/10 backdrop-blur-xl border-b border-white/10 p-4 z-30 flex-shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-6">
          
          {/* Navigasi Halaman */}
          <div className="flex items-center gap-4 bg-black/30 p-2 rounded-2xl border border-white/10">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="w-10 h-10 rounded-xl bg-white/5 hover:bg-emerald-500/20 flex items-center justify-center text-white transition-all active:scale-90"
            >
              <span className="rotate-180 text-xl">➜</span>
            </button>
            <div className="text-center px-4 border-x border-white/10 min-w-[120px]">
              <h2 className="text-sm font-black text-white leading-none">HALAMAN {currentPage}</h2>
              <p className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest mt-1">Mushaf Madinah</p>
            </div>
            <button 
              onClick={() => setCurrentPage(p => Math.min(604, p + 1))}
              className="w-10 h-10 rounded-xl bg-white/5 hover:bg-emerald-500/20 flex items-center justify-center text-white transition-all active:scale-90"
            >
              <span className="text-xl">➜</span>
            </button>
          </div>

          {/* Pemilih Rentang Ayat */}
          <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/10">
            <span className="text-[10px] font-black text-emerald-300 uppercase tracking-widest">Rentang:</span>
            <div className="flex items-center gap-2">
              <input 
                type="number" 
                value={range.start}
                onChange={(e) => handleJumpToAyah(parseInt(e.target.value) || 1, 'start')}
                className="w-12 bg-black/40 border border-white/10 rounded-lg py-1 text-center text-white text-sm font-bold focus:border-emerald-500 focus:outline-none"
              />
              <span className="text-white/30 text-xs">s/d</span>
              <input 
                type="number" 
                value={range.end}
                onChange={(e) => handleJumpToAyah(parseInt(e.target.value) || surah.verses, 'end')}
                className="w-12 bg-black/40 border border-white/10 rounded-lg py-1 text-center text-white text-sm font-bold focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Mode Tampilan */}
          <div className="flex gap-1 bg-black/30 p-1.5 rounded-2xl border border-white/10">
            {(['full', 'first', 'hidden'] as DisplayMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => setDisplayMode(mode)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all ${
                  displayMode === mode ? 'bg-emerald-600 text-white shadow-lg' : 'text-white/40 hover:text-white'
                }`}
              >
                {mode === 'full' ? 'Lengkap' : mode === 'first' ? 'Awal Ayat' : 'Setoran'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mushaf Page Container */}
      <div className="flex-1 overflow-y-auto py-8 md:py-12 px-4 mushaf-container custom-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-6">
            <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-emerald-400 font-black tracking-widest animate-pulse uppercase text-xs">Memuat Halaman {currentPage}...</p>
          </div>
        ) : (
          <div className="mushaf-page shadow-[0_50px_100px_-20px_rgba(0,0,0,0.6)]">
            {/* Header Halaman (Identitas Mushaf) */}
            <div className="flex justify-between items-center mb-8 border-b-2 border-red-900/20 pb-4 text-red-900 font-bold text-[10px] md:text-xs">
              <div className="flex flex-col">
                <span className="opacity-50">JUZ</span>
                <span className="text-sm">{ayahs[0]?.juz}</span>
              </div>
              <div className="text-center bg-red-900/5 px-6 py-1 rounded-full border border-red-900/10">
                <span className="text-xl md:text-2xl" style={{ fontFamily: 'Amiri' }}>
                  سُورَةُ {ayahs[0]?.surah?.name || surah.name}
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="opacity-50">HALAMAN</span>
                <span className="text-sm">{currentPage}</span>
              </div>
            </div>

            <div className="arabic-container">
              <div className="arabic-text-flow">
                {ayahs.map((ayah) => {
                  const isStartOfSurah = ayah.numberInSurah === 1;
                  const needsBismillah = isStartOfSurah && ayah.surah?.number !== 1 && ayah.surah?.number !== 9;
                  const text = cleanAyahText(ayah);
                  const words = text.split(' ');
                  const isAyahActive = activeAyahId === ayah.numberInSurah;
                  const isSubmissionMode = displayMode === 'hidden';
                  
                  // LOGIKA RENTANG: Jika di luar rentang, beri visual samar
                  const isOutOfRange = (ayah.surah?.number === surah.number) && 
                                       (ayah.numberInSurah < range.start || ayah.numberInSurah > range.end);

                  return (
                    <React.Fragment key={ayah.number}>
                      {needsBismillah && (
                        <div className="w-full text-center my-8 py-5 border-y-2 border-red-900/5 bg-red-900/[0.02] block rounded-sm">
                          <span className="text-3xl md:text-5xl text-gray-900 block" style={{ direction: 'rtl', fontFamily: 'KFGQPC Uthmanic Script HAFS' }}>
                            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                          </span>
                        </div>
                      )}
                      <span 
                        className={`relative cursor-pointer transition-all duration-500 rounded-lg ${
                          isOutOfRange ? 'opacity-[0.08] grayscale pointer-events-none' : 
                          isAyahActive ? 'bg-emerald-100 ring-[6px] ring-emerald-100 z-10' : 'hover:bg-emerald-50/40'
                        }`}
                        onClick={() => !isOutOfRange && toggleAudio(ayah.audio, ayah.numberInSurah)}
                      >
                        <span className={isSubmissionMode ? 'ayah-blur' : ''}>
                          {displayMode === 'first' ? (
                            <>
                              <span className="text-red-900 font-bold">{words[0]} </span>
                              <span className="ayah-blur opacity-20">{words.slice(1).join(' ')}</span>
                            </>
                          ) : text}
                        </span>
                        
                        <span 
                          className={`ayah-marker group relative ${isSubmissionMode ? 'cursor-pointer' : 'cursor-default'}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isSubmissionMode && !isOutOfRange) onOpenSetor(ayah.numberInSurah);
                          }}
                        >
                          {toArabicNumerals(ayah.numberInSurah)}
                          {isSubmissionMode && !isOutOfRange && (
                            <span className="absolute -top-14 left-1/2 -translate-x-1/2 bg-emerald-900 text-white text-[9px] px-3 py-1.5 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap z-50 transform group-hover:-translate-y-1">
                              Klik untuk Setor
                            </span>
                          )}
                        </span>
                      </span>
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* Footer Halaman */}
            <div className="mt-auto pt-8 border-t-2 border-red-900/10 flex flex-col items-center gap-2">
              <div className="text-[10px] text-red-900/30 font-black tracking-[0.4em] uppercase">
                YUMMARIS SMART TAHFIDZ • 15 BARIS STANDAR
              </div>
              <div className="text-[8px] text-emerald-600/40 italic">
                Rasm Utsmani • Mujamma' al-Malik Fahd
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Info Status Bawah */}
      <div className="bg-emerald-950 text-white/40 px-6 py-3 text-[9px] font-bold flex justify-between items-center border-t border-white/5 uppercase tracking-widest">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-emerald-400">Sistem Fokus Aktif</span>
          </div>
          <span className="hidden md:inline border-l border-white/10 pl-3">Target: Ayat {range.start} - {range.end}</span>
        </div>
        <span className="hidden sm:block">Fokus hafalan tanpa merubah tata letak mushaf standar</span>
      </div>
    </div>
  );
};

export default ReaderScreen;
