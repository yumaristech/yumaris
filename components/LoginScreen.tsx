
import React, { useState } from 'react';

interface LoginScreenProps {
  onLoginSuccess: (username: string, role: string, identitas: string) => void;
  showToast: (msg: string, type: 'success' | 'error') => void;
}

import { supabase } from '../supabaseClient';

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, showToast }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();

      if (error || !data) {
        showToast('Username atau Password salah', 'error');
        return;
      }

      if (data.password === password) {
        showToast('Login Berhasil!', 'success');
        const userRole = data.role || 'user';
        onLoginSuccess(username, userRole, data.identitas);
      } else {
        showToast('Username atau Password salah', 'error');
      }
    } catch (err) {
      console.error('Login error:', err);
      showToast('Terjadi kesalahan koneksi database', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 p-4">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-[40px] p-10 shadow-2xl animate-bounce-in">
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-gradient-to-tr from-emerald-500 to-green-400 rounded-3xl flex items-center justify-center shadow-xl mb-6 rotate-3">
            <span className="text-4xl">📖</span>
          </div>
          <h2 className="text-3xl font-black text-white text-center">
            YUMMARIS<br/>
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
            className="w-full py-5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white rounded-2xl font-black text-lg shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
          >
            Masuk
          </button>
        </form>
        
        <p className="mt-8 text-center text-white/30 text-[10px] font-bold uppercase tracking-widest">
          Akses Terbatas • Hubungi Admin
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;
