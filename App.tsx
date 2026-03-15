
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
import ErrorBoundary from './components/ErrorBoundary';
import { db } from './firebase';
import { collection, addDoc, serverTimestamp, doc, getDocFromServer } from 'firebase/firestore';

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

  // Connection Test
  useEffect(() => {
    const testConnection = async () => {
      try {
        console.log("Testing Firebase connection to path: users/ping");
        const docRef = doc(db, 'users', 'ping');
        const snapshot = await getDocFromServer(docRef);
        console.log("Firebase connection test successful. Document exists:", snapshot.exists());
      } catch (error: any) {
        console.error("Firebase connection test error details:", {
          message: error.message,
          code: error.code,
          name: error.name
        });
        
        if (error.message?.includes('offline')) {
          console.error("Firebase is offline. Please check your configuration.");
          showToast('Koneksi database offline. Periksa internet Anda.', 'error');
        } else if (error.message?.includes('permission-denied') || error.message?.includes('insufficient permissions')) {
          console.error("Permission denied during connection test. Check rules.");
          // Don't show toast for this yet, might be a race condition or propagation delay
        } else {
          console.log("Firebase connection test returned non-permission error (likely benign).");
        }
      }
    };
    testConnection();
  }, [showToast]);

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
    setIsTeacher(false);
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
      // Send to Firestore
      await addDoc(collection(db, 'submissions'), {
        participant_id: participantId,
        surah: selectedSurah.name,
        ayah: setorAyah,
        created_at: serverTimestamp()
      });

      showToast('✓ Hafalan berhasil disetor!', 'success');
      setShowSetorModal(false);
      // Save user ID for next time
      localStorage.setItem('yummaris_user', participantId);
      setCurrentUser(participantId);
    } catch (error) {
      console.error('Firestore submission error:', error);
      showToast('✗ Gagal mengirim data', 'error');
    }
  };

  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
};

export default App;
