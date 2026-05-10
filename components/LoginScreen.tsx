
import React, { useState } from 'react';

interface LoginScreenProps {
  onLoginSuccess: (username: string, role: string, identitas: string) => void;
  showToast: (msg: string, type: 'success' | 'error') => void;
  onBack?: () => void;
}

import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { doc, getDoc, setDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { ArrowLeft } from 'lucide-react';

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, showToast, onBack }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  const handleLogoClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);
    if (newCount >= 7) {
      setShowAdminLogin(true);
      showToast('Mode Admin Aktif', 'success');
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const userEmail = result.user.email;
      
      // Check if user is the designated owner
      if (userEmail === 'pakonigurusejati@gmail.com') {
        showToast('Login Admin (Google) Berhasil!', 'success');
        onLoginSuccess('admin', 'admin', 'OWNER-01');
        return;
      }

      // Check if this email is registered in our users collection for a teacher or admin
      const q = query(collection(db, 'users'), where('email', '==', userEmail));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        showToast(`Login ${userData.role} Berhasil!`, 'success');
        onLoginSuccess(userData.username, userData.role, userData.identitas);
      } else {
        showToast('Akses ditolak. Email tidak terdaftar sebagai Guru/Admin.', 'error');
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

        // Note: Writing permissions for Teachers and custom Admins in Firestore
        // usually requires a Firebase Auth session. If signInAnonymously is disabled
        // in your Firebase Console, these roles will be limited to read-only access.
        if (userRole === 'admin' || userRole === 'teacher') {
          // We no longer attempt signInAnonymously by default because it might be restricted
          // by project policies (auth/admin-restricted-operation).
          // To enable Teacher delete permissions, please enable Anonymous Auth in Firebase Console.
          console.log('Admin/Teacher role detected. Using custom authorization for dashboard.');
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
      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-[40px] p-10 shadow-2xl animate-bounce-in relative">
        {onBack && (
          <button 
            onClick={onBack}
            className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all active:scale-95 group border border-white/5 hover:border-white/20"
            title="Kembali ke Beranda"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-bold uppercase tracking-widest">Kembali</span>
          </button>
        )}
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
              className="w-full py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold text-sm border border-white/20 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 shadow-lg"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
              Login Pemilik / Guru
            </button>
            <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest text-center px-4">
              *Gunakan Google Login jika ingin menghapus/mengubah data
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
