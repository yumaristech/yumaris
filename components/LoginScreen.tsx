
import React, { useState } from 'react';

interface LoginScreenProps {
  onLoginSuccess: (username: string, role: string, identitas: string) => void;
  showToast: (msg: string, type: 'success' | 'error') => void;
}

import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider, signInAnonymously } from 'firebase/auth';

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, showToast }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  const handleLogoClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);
    if (newCount >= 5) {
      setShowAdminLogin(true);
      showToast('Mode Admin Aktif', 'success');
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Check if user is the designated owner or already in admins collection
      if (result.user.email === 'pakonigurusejati@gmail.com') {
        showToast('Login Admin (Google) Berhasil!', 'success');
        onLoginSuccess('admin', 'admin', 'OWNER-01');
      } else {
        showToast('Akses ditolak. Hanya pemilik yang bisa login via Google.', 'error');
        await auth.signOut();
      }
    } catch (err) {
      console.error('Google Login error:', err);
      showToast('Gagal login dengan Google', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const normalizedUsername = username.trim().toLowerCase();
    const userPath = `users/${normalizedUsername}`;
    
    try {
      const userDoc = await getDoc(doc(db, 'users', normalizedUsername));

      if (!userDoc.exists()) {
        showToast('Username atau Password salah', 'error');
        return;
      }

      const data = userDoc.data();
      if (data.password === password) {
        showToast('Login Berhasil!', 'success');
        const userRole = data.role || 'user';

        // Support for custom Administrator and Teacher accounts to have write permissions
        // by signing them in Anonymously to Firebase Auth
        if (userRole === 'admin' || userRole === 'teacher') {
          try {
            const authResult = await signInAnonymously(auth);
            // Record this session for Firestore Rules access control
            await setDoc(doc(db, 'active_admins', authResult.user.uid), {
              username: normalizedUsername,
              role: userRole,
              timestamp: new Date()
            });
          } catch (authErr) {
            console.error('Session activation error:', authErr);
            // We continue even if auth fails, but permissions might be limited
          }
        }

        onLoginSuccess(normalizedUsername, userRole, data.identitas);
      } else {
        showToast('Username atau Password salah', 'error');
      }
    } catch (err) {
      console.error('Login error:', err);
      try {
        handleFirestoreError(err, OperationType.GET, userPath);
      } catch (jsonErr: any) {
        if (jsonErr.message.includes('permission-denied') || jsonErr.message.includes('insufficient permissions')) {
          showToast('Akses ditolak. Periksa aturan keamanan database.', 'error');
        } else {
          showToast('Terjadi kesalahan koneksi database', 'error');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 p-4">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-[40px] p-10 shadow-2xl animate-bounce-in">
        <div className="flex flex-col items-center mb-10">
          <div 
            onClick={handleLogoClick}
            className="w-20 h-20 bg-gradient-to-tr from-emerald-500 to-green-400 rounded-3xl flex items-center justify-center shadow-xl mb-6 rotate-3 cursor-pointer active:scale-90 transition-transform"
          >
            <span className="text-4xl select-none">📖</span>
          </div>
          <h2 className="text-3xl font-black text-white text-center">
            YUMARIS<br/>
            <span className="text-emerald-400">SMART TAHFIDZ</span>
          </h2>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-emerald-300 mb-2 uppercase tracking-widest">Username</label>
            <input 
              type="text" 
              className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:border-emerald-500 focus:outline-none transition-all text-white placeholder:text-white/20"
              placeholder="Masukkan username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-emerald-300 mb-2 uppercase tracking-widest">Password</label>
            <input 
              type="password" 
              className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:border-emerald-500 focus:outline-none transition-all text-white placeholder:text-white/20"
              placeholder="Masukkan password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full py-5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white rounded-2xl font-black text-lg shadow-lg shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50"
          >
            {isLoading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>

        {showAdminLogin && (
          <div className="mt-8 flex flex-col items-center gap-4 animate-fade-in">
            <div className="w-full h-px bg-white/10"></div>
            <button 
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold text-sm border border-white/10 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 shadow-inner"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
              Login Pemilik (Google)
            </button>
            <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest text-center px-4">
              *Gunakan Google Login untuk fitur manajemen tingkat tinggi
            </p>
          </div>
        )}
        
        <p className="mt-8 text-center text-white/30 text-[10px] font-bold uppercase tracking-widest">
          Akses Terbatas • Hubungi Admin
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;
