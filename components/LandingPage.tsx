import React from 'react';
import { motion } from 'motion/react';
import { BookOpen, GraduationCap, ChevronRight, Heart } from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col relative overflow-y-auto custom-scrollbar">
      {/* Background Decor */}
      <div className="fixed inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1590076214667-c0f352d88ad1?auto=format&fit=crop&q=80&w=1920&h=1080" 
          alt="Islamic Architecture" 
          className="w-full h-full object-cover opacity-20"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-slate-900/80 to-slate-900"></div>
      </div>

      <main className="flex-1 flex flex-col items-center justify-center p-6 py-20 relative z-10 max-w-4xl mx-auto text-center w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8 w-full"
        >
          {/* Logo/Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-emerald-400 to-green-600 rounded-[28px] md:rounded-[32px] flex items-center justify-center shadow-2xl shadow-emerald-500/20 rotate-3">
              <BookOpen className="w-10 h-10 md:w-12 md:h-12 text-white" />
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-7xl font-black text-white tracking-tight leading-tight uppercase animate-fade-in">
              YUMARIS SMART <span className="text-emerald-400">TAHFIDZ</span>
            </h1>
            <h2 className="text-lg md:text-2xl font-bold text-emerald-100/90 tracking-wide">
              Teknologi Cerdas untuk Santri Penghafal Al-Qur’an
            </h2>
            <p className="text-base md:text-xl text-emerald-100/80 font-medium max-w-2xl mx-auto px-4">
              Pesantren Berbasis Teknologi merupakan tempat tumbuhnya generasi penghafal Al-Qur’an yang Unggul dan Berkarakter.
            </p>
          </div>

          {/* Hadiths */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-8 md:mt-12 text-left px-4">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/5 backdrop-blur-lg p-5 md:p-6 rounded-[24px] md:rounded-[32px] border border-white/10 hover:border-emerald-500/30 transition-all group"
            >
              <div className="w-8 h-8 md:w-10 md:h-10 bg-emerald-500/20 rounded-full flex items-center justify-center mb-3 md:mb-4 text-emerald-400">
                <Heart className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <p className="text-white/80 italic font-serif leading-relaxed text-sm md:text-base">
                "Sebaik-baik orang di antara kamu adalah orang yang belajar Al-Qur'an dan mengajarkannya"
              </p>
              <p className="text-emerald-400 text-[10px] md:text-xs font-bold mt-3 md:mt-4 uppercase tracking-widest">— HR. Bukhari</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/5 backdrop-blur-lg p-5 md:p-6 rounded-[24px] md:rounded-[32px] border border-white/10 hover:border-emerald-500/30 transition-all group"
            >
              <div className="w-8 h-8 md:w-10 md:h-10 bg-emerald-500/20 rounded-full flex items-center justify-center mb-3 md:mb-4 text-emerald-400">
                <GraduationCap className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <p className="text-white/80 italic font-serif leading-relaxed text-sm md:text-base">
                "Bacalah Al-Qur'an, karena sesungguhnya Al-Qur'an akan datang pada hari kiamat sebagai syafa'at bagi para penghafalnya"
              </p>
              <p className="text-emerald-400 text-[10px] md:text-xs font-bold mt-3 md:mt-4 uppercase tracking-widest">— HR. Muslim</p>
            </motion.div>
          </div>

          {/* Action Button */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="pt-6 md:pt-10 px-4"
          >
            <button 
              onClick={onStart}
              className="group relative w-full md:w-auto px-8 md:px-10 py-4 md:py-5 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-[20px] md:rounded-[24px] font-black text-base md:text-lg shadow-xl shadow-emerald-600/30 transition-all hover:scale-105 active:scale-95 overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 slant-glow"></div>
              <span className="flex items-center justify-center gap-2 md:gap-3 relative z-10">
                Mulai Menjadi Generasi Qur'ani <ChevronRight className="w-5 h-5 md:w-6 md:h-6 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
            <p className="mt-4 text-white/40 text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em]">
              Mari Gapai Syafaat Dengan Al-Quran
            </p>
          </motion.div>
        </motion.div>
      </main>

      {/* Decorative footer elements */}
      <footer className="p-8 relative z-10 text-center">
        <p className="text-white/20 text-xs font-medium">
          © {new Date().getFullYear()} Yumaris Smart Tahfidz • Excellent Character through Al-Quran
        </p>
      </footer>

      <style>{`
        .font-serif { font-family: "Georgia", serif; }
        .slant-glow {
          transform: skewX(-45deg);
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
