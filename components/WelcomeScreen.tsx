
import React from 'react';

interface WelcomeScreenProps {
  onStart: () => void;
  participantId: string | null;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart, participantId }) => {
  return (
    <div className="relative h-full w-full flex items-center justify-center overflow-hidden bg-gradient-to-br from-green-900 via-emerald-900 to-teal-950">
      
      {/* Decorative Islamic Pattern Overlay */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{
        backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><path d="M50 0 L60 40 L100 50 L60 60 L50 100 L40 60 L0 50 L40 40 Z" fill="white"/></svg>')`,
        backgroundSize: '60px 60px'
      }}></div>

      {/* Animated Light Orbs */}
      <div className="absolute top-1/4 -left-20 w-64 h-64 md:w-80 md:h-80 bg-emerald-500/20 rounded-full blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-1/4 -right-20 w-64 h-64 md:w-80 md:h-80 bg-green-500/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="relative z-10 w-full max-w-xl px-4 md:px-6 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[32px] md:rounded-[40px] p-6 md:p-10 shadow-2xl flex flex-col items-center text-center max-h-[90vh] overflow-y-auto custom-scrollbar w-full">
          
          <div className="relative mb-6 md:mb-8 group flex-shrink-0">
            <div className="absolute inset-0 bg-emerald-400 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
            <div className="relative w-20 h-20 md:w-28 md:h-28 bg-gradient-to-tr from-emerald-500 to-green-400 rounded-[20px] md:rounded-[28px] flex items-center justify-center shadow-xl rotate-3 group-hover:rotate-6 transition-transform duration-500 text-3xl md:text-5xl">
              📖
            </div>
          </div>

          <div className="space-y-4 md:space-y-6">
            <div className="space-y-1">
              <div className="text-xs md:text-sm font-black text-white/40 uppercase tracking-[0.3em] mb-3">
                YUMARIS SMART <span className="text-emerald-400/50">TAHFIDZ</span>
              </div>
              <h2 className="text-xl md:text-2xl font-black text-emerald-400 uppercase tracking-widest animate-fade-in">
                Ahlan wa Sahlan
              </h2>
              <p className="text-lg md:text-xl font-bold text-white">
                {participantId || 'Santri Terpilih'}
              </p>
            </div>
            
            <div className="space-y-3">
              <p className="text-emerald-50/90 text-sm md:text-base font-medium leading-relaxed max-w-xs md:max-w-sm mx-auto">
                Semoga hari ini hafalan semakin lancar dan hati semakin dekat dengan Al-Qur’an.
              </p>
              <p className="text-emerald-100/60 text-[11px] md:text-xs font-semibold leading-relaxed max-w-xs mx-auto italic">
                Setiap ayat yang dibaca adalah cahaya dan keberkahan untuk masa depan.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 md:gap-4 w-full mt-8 md:mt-12 mb-6 md:mb-8">
            {[
              { icon: '🎧', label: 'Audio' },
              { icon: '🎯', label: '3 Modes' },
              { icon: '📋', label: 'Setor' }
            ].map((feature, i) => (
              <div key={i} className="flex flex-col items-center gap-1 md:gap-2 p-2 md:p-3 rounded-xl md:rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                <span className="text-lg md:text-xl">{feature.icon}</span>
                <span className="text-[9px] md:text-xs text-emerald-200 font-semibold">{feature.label}</span>
              </div>
            ))}
          </div>

          <button 
            onClick={onStart}
            className="group relative w-full sm:w-auto px-10 py-4 md:px-14 md:py-5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white rounded-xl md:rounded-2xl font-black text-lg md:text-xl shadow-[0_10px_40px_-10px_rgba(16,185,129,0.5)] transition-all transform hover:-translate-y-1 active:scale-95 overflow-hidden flex-shrink-0"
          >
            <span className="relative z-10 flex items-center justify-center gap-3">
              Mulai Sekarang
              <span className="text-xl md:text-2xl group-hover:translate-x-1 transition-transform">→</span>
            </span>
          </button>
          
          <p className="mt-6 md:mt-8 text-white/30 text-[9px] md:text-[10px] font-bold tracking-widest uppercase">
            Platform Tahfidz Terintegrasi
          </p>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default WelcomeScreen;
