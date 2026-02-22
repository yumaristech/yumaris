
import React, { useState, useEffect } from 'react';

interface SetorModalProps {
  surahName: string;
  ayahNumber: number;
  defaultId?: string;
  onClose: () => void;
  onSubmit: (participantId: string) => Promise<void>;
}

const SetorModal: React.FC<SetorModalProps> = ({ surahName, ayahNumber, defaultId = '', onClose, onSubmit }) => {
  const [participantId, setParticipantId] = useState(defaultId);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (defaultId) setParticipantId(defaultId);
  }, [defaultId]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!participantId.trim()) return;
    
    setIsSubmitting(true);
    await onSubmit(participantId);
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-green-950/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in">
      <div 
        className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md animate-bounce-in border border-green-50"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-black text-green-800">📝 Setor Hafalan</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2">✕</button>
        </div>
        
        <form onSubmit={handleFormSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-widest">Nomor Peserta</label>
            <input 
              type="text" 
              className="w-full px-5 py-4 border-2 border-gray-100 rounded-2xl focus:border-green-500 focus:outline-none transition-all shadow-sm font-medium bg-gray-50/50"
              placeholder="Contoh: T-001"
              value={participantId}
              onChange={(e) => setParticipantId(e.target.value)}
              required
              readOnly={!!defaultId}
            />
          </div>
          
          <div className="bg-green-50/80 p-5 rounded-2xl border border-green-100 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 font-medium">Surat:</span>
              <span className="font-bold text-green-800">{surahName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 font-medium">Target Ayat:</span>
              <span className="font-bold text-green-800">Ayat {ayahNumber}</span>
            </div>
          </div>
          
          <div className="flex gap-3 pt-2">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-4 border-2 border-gray-100 text-gray-500 rounded-2xl font-bold hover:bg-gray-50 transition-all active:scale-95"
            >
              Batal
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-4 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-2xl font-bold shadow-lg shadow-green-600/20 hover:from-green-700 hover:to-emerald-800 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Mengirim...</span>
                </>
              ) : (
                '✓ Setor Hafalan'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SetorModal;
