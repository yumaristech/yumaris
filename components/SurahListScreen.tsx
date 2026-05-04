
import React, { useState, useMemo } from 'react';
import { Surah } from '../types';

interface SurahListScreenProps {
  surahs: Surah[];
  onSelectSurah: (surah: Surah) => void;
}

const SurahListScreen: React.FC<SurahListScreenProps> = ({ surahs, onSelectSurah }) => {
  const [search, setSearch] = useState('');
  const [juzFilter, setJuzFilter] = useState('');

  const isNumericSearch = useMemo(() => {
    const num = parseInt(search);
    return !isNaN(num) && num >= 1 && num <= 604;
  }, [search]);

  const filteredSurahs = useMemo(() => {
    if (isNumericSearch) return [];
    return surahs.filter(s => {
      const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || 
                          s.number.toString() === search ||
                          s.meaning.toLowerCase().includes(search.toLowerCase());
      const matchJuz = juzFilter === '' || s.juz === parseInt(juzFilter);
      return matchSearch && matchJuz;
    });
  }, [surahs, search, juzFilter, isNumericSearch]);

  const handlePageSelect = () => {
    const pageNum = parseInt(search);
    if (pageNum >= 1 && pageNum <= 604) {
      // For simplicity, we navigate to the first surah and let ReaderScreen handle the page jump
      // We'll pass a special property if we can, or modify App.tsx
      // Actually, let's just find the surah that starts before or at that page if we could
      // But since we don't have the mapping, we'll use a placeholder and App.tsx will handle it
      (onSelectSurah as any)({ number: 0, name: 'Halaman', page: pageNum });
    }
  };

  return (
    <div className="h-full flex flex-col p-4 md:p-8 animate-fade-in overflow-hidden">
      <div className="max-w-6xl mx-auto w-full flex flex-col h-full gap-6">
        
        <div className="bg-white rounded-3xl shadow-xl shadow-green-900/5 p-6 border border-green-50 flex-shrink-0">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              <input 
                type="text" 
                placeholder="Cari berdasarkan halaman (contoh: 5)..." 
                className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-100 rounded-2xl focus:border-green-500 focus:outline-none transition-all shadow-sm font-medium"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select 
              className="px-6 py-3.5 border-2 border-gray-100 rounded-2xl focus:border-green-500 focus:outline-none bg-white font-medium text-gray-600 shadow-sm cursor-pointer"
              value={juzFilter}
              onChange={(e) => setJuzFilter(e.target.value)}
            >
              <option value="">Semua Juz</option>
              {Array.from({ length: 30 }, (_, i) => (
                <option key={i + 1} value={i + 1}>Juz {i + 1}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {isNumericSearch ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div 
                onClick={handlePageSelect}
                className="group bg-white rounded-3xl p-10 shadow-xl border-2 border-emerald-100 cursor-pointer transition-all hover:border-emerald-500 hover:shadow-emerald-900/10 max-w-sm w-full animate-bounce-in"
              >
                <div className="w-20 h-20 bg-emerald-500 rounded-2xl flex items-center justify-center text-white text-3xl font-black mx-auto mb-6 shadow-lg shadow-emerald-500/30">
                  {search}
                </div>
                <h3 className="text-2xl font-black text-gray-800 mb-2">Buka Halaman {search}</h3>
                <p className="text-gray-500 font-medium">Klik untuk langsung menuju mushaf halaman {search}</p>
              </div>
            </div>
          ) : filteredSurahs.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-8">
              {filteredSurahs.map((surah) => (
                <div 
                  key={surah.number}
                  onClick={() => onSelectSurah(surah)}
                  className="group bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-green-900/5 hover:-translate-y-1 hover:border-green-400 flex items-center gap-4 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-green-50 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform"></div>
                  
                  <div className="relative z-10 w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-700 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {surah.number}
                  </div>
                  
                  <div className="relative z-10 flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-bold text-gray-800 truncate group-hover:text-green-700 transition-colors">{surah.name}</h3>
                      <span className="arabic-text text-xl text-green-700 leading-none">{surah.arabic}</span>
                    </div>
                    <div className="mt-1 text-sm text-gray-500 font-medium">
                      {surah.meaning} • {surah.verses} Ayat
                    </div>
                    <div className="text-xs text-gray-400 mt-1 uppercase tracking-wider font-semibold">
                      {surah.type} • Juz {surah.juz}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500 animate-fade-in">
              <span className="text-6xl mb-6">🔍</span>
              <p className="text-xl font-semibold">Surat tidak ditemukan</p>
              <p className="mt-2">Coba gunakan kata kunci pencarian lain</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SurahListScreen;
