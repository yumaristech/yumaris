
import React, { useState, useCallback, useEffect } from 'react';
import { ScreenState, Surah, DisplayMode, Ayah } from './types';
import { SURAH_LIST } from './constants';
import WelcomeScreen from './components/WelcomeScreen';
import SurahListScreen from './components/SurahListScreen';
import ReaderScreen from './components/ReaderScreen';
import Header from './components/Header';
import SetorModal from './components/SetorModal';
import LoginScreen from './components/LoginScreen';
import AdminDashboard from './components/AdminDashboard';
import ProgressScreen from './components/ProgressScreen';
import TeacherDashboard from './components/TeacherDashboard';
import { supabase } from './supabaseClient';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isTeacher, setIsTeacher] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [screen, setScreen] = useState<ScreenState>('login');
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
  const [showSetorModal, setShowSetorModal] = useState(false);
  const [setorAyah, setSetorAyah] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Cek session saat mount
  useEffect(() => {
    try {
      const session = localStorage.getItem('yummaris_session');
      if (session) {
        const { username, role, identitas } = JSON.parse(session);
        setIsLoggedIn(true);
        setIsAdmin(role === 'admin');
        setIsTeacher(role === 'teacher');
        setCurrentUser(username);
        setParticipantId(identitas);
        setScreen('welcome');
      }
    } catch (error) {
      console.error('Session restoration failed:', error);
      localStorage.removeItem('yummaris_session');
    }
  }, []);

  const handleLoginSuccess = (username: string, role: string, identitas: string) => {
    setIsLoggedIn(true);
    setIsAdmin(role === 'admin');
    setIsTeacher(role === 'teacher');
    setCurrentUser(username);
    setParticipantId(identitas);
    localStorage.setItem('yummaris_session', JSON.stringify({ username, role, identitas }));
    setScreen('welcome');
  };

  const handleStart = () => setScreen('surah-list');
  const handleViewProgress = () => setScreen('progress');
  const handleAdmin = () => setScreen('admin');
  const handleTeacher = () => setScreen('teacher');
  
  const handleHome = () => {
    if (screen === 'reader' || screen === 'progress' || screen === 'teacher') {
      setScreen('surah-list');
    } else if (screen === 'surah-list' || screen === 'admin') {
      setScreen('welcome');
    } else {
      setScreen('welcome');
    }
    setSelectedSurah(null);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setIsAdmin(false);
    setCurrentUser(null);
    setParticipantId(null);
    localStorage.removeItem('yummaris_session');
    setScreen('login');
    showToast('Berhasil keluar', 'info');
  };

  const handleSelectSurah = (surah: Surah) => {
    setSelectedSurah(surah);
    setScreen('reader');
  };

  const handleOpenSetor = (ayahNumber: number) => {
    setSetorAyah(ayahNumber);
    setShowSetorModal(true);
  };

  const handleSubmitSetor = async (participantId: string) => {
    if (!selectedSurah || !setorAyah) return;

    try {
      // Send to Supabase
      const { error: supabaseError } = await supabase
        .from('submissions')
        .insert([{
          participant_id: participantId,
          surah: selectedSurah.name,
          ayah: setorAyah
        }]);

      if (supabaseError) {
        console.error('Supabase submission error:', supabaseError);
        throw new Error('Submit failed');
      }

      showToast('✓ Hafalan berhasil disetor!', 'success');
      setShowSetorModal(false);
      // Save user ID for next time
      localStorage.setItem('yummaris_user', participantId);
      setCurrentUser(participantId);
    } catch (error) {
      showToast('✗ Gagal mengirim data', 'error');
    }
  };

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden text-gray-800">
      {isLoggedIn && screen !== 'login' && (
        <Header 
          onHome={handleHome} 
          onAdmin={isAdmin ? handleAdmin : undefined}
          onTeacher={isTeacher ? handleTeacher : undefined}
          onProgress={handleViewProgress}
          onLogout={handleLogout}
          showHome={screen !== 'welcome'} 
        />
      )}
      
      <main className="flex-1 overflow-hidden relative">
        {screen === 'login' && (
          <LoginScreen onLoginSuccess={handleLoginSuccess} showToast={showToast} />
        )}

        {isLoggedIn && screen === 'welcome' && (
          <WelcomeScreen onStart={handleStart} />
        )}
        
        {isLoggedIn && screen === 'surah-list' && (
          <SurahListScreen 
            surahs={SURAH_LIST} 
            onSelectSurah={handleSelectSurah} 
          />
        )}
        
        {isLoggedIn && screen === 'reader' && selectedSurah && (
          <ReaderScreen 
            surah={selectedSurah} 
            onOpenSetor={handleOpenSetor}
            showToast={showToast}
          />
        )}

        {isLoggedIn && screen === 'admin' && isAdmin && (
          <AdminDashboard 
            onBack={handleHome}
            showToast={showToast}
          />
        )}

        {isLoggedIn && screen === 'teacher' && currentUser && (
          <TeacherDashboard 
            teacherUsername={currentUser}
            onBack={handleHome}
            onLogout={handleLogout}
            showToast={showToast}
          />
        )}

        {isLoggedIn && screen === 'progress' && participantId && (
          <ProgressScreen 
            participantId={participantId}
            onBack={handleHome}
            showToast={showToast}
          />
        )}
      </main>

      {showSetorModal && selectedSurah && setorAyah && (
        <SetorModal 
          surahName={selectedSurah.name}
          ayahNumber={setorAyah}
          defaultId={participantId || ''}
          onClose={() => setShowSetorModal(false)}
          onSubmit={handleSubmitSetor}
        />
      )}

      {toast && (
        <div className={`fixed bottom-6 right-6 px-6 py-3 rounded-xl shadow-2xl z-[150] animate-bounce-in flex items-center gap-2 text-white font-medium ${
          toast.type === 'success' ? 'bg-green-600' : 
          toast.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
        }`}>
          <span>{toast.message}</span>
        </div>
      )}
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }
        @keyframes bounceIn {
          0% { transform: scale(0.9); opacity: 0; }
          70% { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-bounce-in {
          animation: bounceIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
      `}</style>
    </div>
  );
};

export default App;
