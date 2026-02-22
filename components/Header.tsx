
import React from 'react';

interface HeaderProps {
  onHome: () => void;
  onAdmin?: () => void;
  onTeacher?: () => void;
  onProgress: () => void;
  onLogout: () => void;
  showHome: boolean;
}

const Header: React.FC<HeaderProps> = ({ onHome, onAdmin, onTeacher, onProgress, onLogout, showHome }) => {
  return (
    <header className="bg-gradient-to-r from-green-700 via-green-600 to-emerald-600 text-white py-4 px-6 shadow-lg flex-shrink-0 z-10">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={onHome}>
          <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <span className="text-xl md:text-2xl">📖</span>
          </div>
          <div>
            <h1 className="text-lg md:text-2xl font-bold tracking-wide">YUMMARIS</h1>
            <p className="text-green-100 text-[10px] md:text-sm">Smart Tahfidz Platform</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {showHome && (
            <button 
              onClick={onHome}
              className="bg-white/20 hover:bg-white/30 px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition-all active:scale-95 flex items-center gap-2"
            >
              🏠 <span className="hidden sm:inline">Beranda</span>
            </button>
          )}

          <button 
            onClick={onProgress}
            className="bg-emerald-500/20 hover:bg-emerald-500/40 p-2 rounded-lg transition-all active:scale-95 border border-emerald-500/30"
            title="Progres Hafalan"
          >
            📊
          </button>
          
          {onTeacher && (
            <button 
              onClick={onTeacher}
              className="bg-purple-500/20 hover:bg-purple-500/40 p-2 rounded-lg transition-all active:scale-95 border border-purple-500/30"
              title="Teacher Dashboard"
            >
              👨‍🏫
            </button>
          )}

          {onAdmin && (
            <button 
              onClick={onAdmin}
              className="bg-amber-500/20 hover:bg-amber-500/40 p-2 rounded-lg transition-all active:scale-95 border border-amber-500/30"
              title="Admin Dashboard"
            >
              🛡️
            </button>
          )}

          <button 
            onClick={onLogout}
            className="bg-red-500/20 hover:bg-red-500/40 p-2 rounded-lg transition-all active:scale-95 border border-red-500/30"
            title="Keluar"
          >
            🚪
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
