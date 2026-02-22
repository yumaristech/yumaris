
import React, { useState, useEffect } from 'react';

interface AdminDashboardProps {
  onBack: () => void;
  showToast: (msg: string, type: 'success' | 'error') => void;
}

import { supabase } from '../supabaseClient';

interface UserData {
  username: string;
  password: string;
  identitas: string;
  role: 'admin' | 'user' | 'teacher';
  class_name?: string;
}

interface ClassData {
  name: string;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack, showToast }) => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [identitas, setIdentitas] = useState('');
  const [role, setRole] = useState<'admin' | 'user' | 'teacher'>('user');
  const [selectedClass, setSelectedClass] = useState('');
  const [teacherClasses, setTeacherClasses] = useState<string[]>([]);
  const [newClassName, setNewClassName] = useState('');
  const [editingUsername, setEditingUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isClassLoading, setIsClassLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    setIsClassLoading(true);
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      setClasses(data || []);
    } catch (err) {
      console.error('Error fetching classes:', err);
    } finally {
      setIsClassLoading(false);
    }
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('username', { ascending: true });

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      showToast('Gagal mengambil data pengguna', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = username.trim();
    const cleanPassword = password.trim();
    const cleanIdentitas = identitas.trim();

    if (!cleanUsername || !cleanPassword || !cleanIdentitas) return;
    setIsLoading(true);

    try {
      if (editingUsername) {
        // Update User
        const { error } = await supabase
          .from('users')
          .update({ 
            username: cleanUsername,
            password: cleanPassword, 
            identitas: cleanIdentitas,
            role: role,
            class_name: role === 'user' ? selectedClass : null
          })
          .eq('username', editingUsername);

        if (error) throw error;

        // Update Teacher Classes if role is teacher
        if (role === 'teacher') {
          // Delete old assignments
          await supabase.from('teacher_classes').delete().eq('teacher_username', cleanUsername);
          // Insert new ones
          if (teacherClasses.length > 0) {
            const assignments = teacherClasses.map(c => ({ teacher_username: cleanUsername, class_name: c }));
            await supabase.from('teacher_classes').insert(assignments);
          }
        }

        showToast('User berhasil diperbarui', 'success');
      } else {
        // Create User
        const { error } = await supabase
          .from('users')
          .insert([{ 
            username: cleanUsername, 
            password: cleanPassword, 
            identitas: cleanIdentitas,
            role: role,
            class_name: role === 'user' ? selectedClass : null
          }]);

        if (error) throw error;

        // Add Teacher Classes if role is teacher
        if (role === 'teacher' && teacherClasses.length > 0) {
          const assignments = teacherClasses.map(c => ({ teacher_username: cleanUsername, class_name: c }));
          await supabase.from('teacher_classes').insert(assignments);
        }

        showToast('User berhasil ditambahkan', 'success');
      }
      
      resetForm();
      fetchUsers();
    } catch (err: any) {
      console.error('Error saving user:', err);
      showToast(err.message || 'Gagal menyimpan user', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setIdentitas('');
    setRole('user');
    setSelectedClass('');
    setTeacherClasses([]);
    setEditingUsername(null);
  };

  const handleEdit = async (user: UserData) => {
    setEditingUsername(user.username);
    setUsername(user.username);
    setPassword(user.password);
    setIdentitas(user.identitas);
    setRole(user.role || 'user');
    setSelectedClass(user.class_name || '');

    if (user.role === 'teacher') {
      const { data } = await supabase.from('teacher_classes').select('class_name').eq('teacher_username', user.username);
      setTeacherClasses(data?.map(d => d.class_name) || []);
    } else {
      setTeacherClasses([]);
    }
  };

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    setIsClassLoading(true);
    try {
      const { error } = await supabase.from('classes').insert([{ name: newClassName.trim() }]);
      if (error) throw error;
      showToast('Kelas berhasil ditambahkan', 'success');
      setNewClassName('');
      fetchClasses();
    } catch (err: any) {
      showToast(err.message || 'Gagal menambah kelas', 'error');
    } finally {
      setIsClassLoading(false);
    }
  };

  const handleDeleteClass = async (name: string) => {
    if (window.confirm(`Hapus kelas ${name}?`)) {
      try {
        const { error } = await supabase.from('classes').delete().eq('name', name);
        if (error) throw error;
        showToast('Kelas berhasil dihapus', 'success');
        fetchClasses();
      } catch (err: any) {
        showToast(err.message || 'Gagal menghapus kelas', 'error');
      }
    }
  };

  const handleDeleteUser = async (user: string) => {
    if (user === 'admin') {
      showToast('Admin tidak bisa dihapus', 'error');
      return;
    }

    if (window.confirm(`Hapus user ${user}?`)) {
      setIsLoading(true);
      try {
        const { error } = await supabase
          .from('users')
          .delete()
          .eq('username', user);

        if (error) throw error;
        showToast('User berhasil dihapus', 'success');
        fetchUsers();
        if (editingUsername === user) resetForm();
      } catch (err) {
        console.error('Error deleting user:', err);
        showToast('Gagal menghapus user', 'error');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="h-full w-full flex flex-col p-4 md:p-8 bg-slate-900 overflow-y-auto custom-scrollbar animate-fade-in">
      <div className="max-w-5xl mx-auto w-full space-y-8">
        
        <div className="flex items-center justify-between bg-white/10 backdrop-blur-xl p-6 rounded-[32px] border border-white/10">
          <div>
            <h2 className="text-2xl font-black text-white">🛡️ Admin Dashboard</h2>
            <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest mt-1">Manajemen Pengguna & Identitas (Supabase)</p>
          </div>
          <button 
            onClick={onBack}
            className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-bold transition-all"
          >
            Kembali
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-5 bg-white rounded-[32px] p-8 shadow-2xl border border-green-50 h-fit">
            <h3 className="text-xl font-black text-green-800 mb-6 flex items-center gap-2">
              <span>{editingUsername ? '✏️' : '👤'}</span> 
              {editingUsername ? 'Edit Pengguna' : 'Tambah User Baru'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Username</label>
                <input 
                  type="text" 
                  className="w-full px-5 py-3 border-2 border-gray-100 rounded-2xl focus:border-green-500 focus:outline-none transition-all font-medium"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Password</label>
                <input 
                  type="text" 
                  className="w-full px-5 py-3 border-2 border-gray-100 rounded-2xl focus:border-green-500 focus:outline-none transition-all font-medium"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Identitas (ID Peserta)</label>
                <input 
                  type="text" 
                  className="w-full px-5 py-3 border-2 border-gray-100 rounded-2xl focus:border-green-500 focus:outline-none transition-all font-medium"
                  placeholder="Contoh: T-001"
                  value={identitas}
                  onChange={(e) => setIdentitas(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Role</label>
                <select 
                  className="w-full px-5 py-3 border-2 border-gray-100 rounded-2xl focus:border-green-500 focus:outline-none transition-all font-medium bg-white"
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'admin' | 'user' | 'teacher')}
                  disabled={isLoading}
                >
                  <option value="user">Pengguna (User)</option>
                  <option value="teacher">Guru (Teacher)</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              {role === 'user' && (
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Kelas</label>
                  <select 
                    className="w-full px-5 py-3 border-2 border-gray-100 rounded-2xl focus:border-green-500 focus:outline-none transition-all font-medium bg-white"
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    disabled={isLoading}
                    required
                  >
                    <option value="">Pilih Kelas</option>
                    {classes.map(c => (
                      <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {role === 'teacher' && (
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Mengampu Kelas</label>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-2 border-2 border-gray-100 rounded-2xl custom-scrollbar">
                    {classes.map(c => (
                      <label key={c.name} className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer hover:text-green-600">
                        <input 
                          type="checkbox" 
                          checked={teacherClasses.includes(c.name)}
                          onChange={(e) => {
                            if (e.target.checked) setTeacherClasses([...teacherClasses, c.name]);
                            else setTeacherClasses(teacherClasses.filter(tc => tc !== c.name));
                          }}
                          className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        {c.name}
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-4 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-bold shadow-lg shadow-green-600/20 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isLoading ? 'Memproses...' : (editingUsername ? 'Update User' : 'Tambah User')}
                </button>
                {editingUsername && (
                  <button 
                    type="button"
                    onClick={resetForm}
                    disabled={isLoading}
                    className="px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl font-bold transition-all active:scale-95 disabled:opacity-50"
                  >
                    Batal
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* List Section */}
          <div className="lg:col-span-7 bg-white rounded-[32px] p-8 shadow-2xl border border-green-50">
            <h3 className="text-xl font-black text-green-800 mb-6 flex items-center gap-2">
              <span>📋</span> Daftar Pengguna
            </h3>
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {users.length === 0 && !isLoading && (
                <p className="text-center text-gray-400 py-10">Belum ada pengguna.</p>
              )}
              {users.map((user) => (
                <div key={user.username} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                  editingUsername === user.username ? 'bg-emerald-50 border-emerald-200 ring-2 ring-emerald-100' : 'bg-gray-50 border-gray-100'
                }`}>
                  <div className="min-w-0 flex-1 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">User</p>
                      <p className="font-bold text-gray-800 truncate">{user.username}</p>
                      <p className="text-[10px] text-gray-400 font-mono truncate">
                        PWD: {user.username === 'admin' && editingUsername !== 'admin' ? '********' : user.password}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Identitas</p>
                      <p className="font-bold text-emerald-700 truncate">{user.identitas}</p>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                        user.role === 'admin' ? 'bg-amber-100 text-amber-700' : 
                        user.role === 'teacher' ? 'bg-purple-100 text-purple-700' : 
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {user.role || 'user'} {user.class_name ? `(${user.class_name})` : ''}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-4">
                    <button 
                      onClick={() => handleEdit(user)}
                      className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-xl transition-all"
                      title="Edit User"
                    >
                      ✏️
                    </button>
                    {user.username !== 'admin' && (
                      <button 
                        onClick={() => handleDeleteUser(user.username)}
                        className="p-2 text-red-400 hover:bg-red-100 rounded-xl transition-all"
                        title="Hapus User"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Class Management Section */}
        <div className="bg-white rounded-[32px] p-8 shadow-2xl border border-green-50">
          <h3 className="text-xl font-black text-green-800 mb-6 flex items-center gap-2">
            <span>🏫</span> Manajemen Kelas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <form onSubmit={handleAddClass} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Tambah Kelas Baru</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    className="flex-1 px-5 py-3 border-2 border-gray-100 rounded-2xl focus:border-green-500 focus:outline-none transition-all font-medium"
                    placeholder="Nama Kelas (Contoh: 7A)"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    required
                    disabled={isClassLoading}
                  />
                  <button 
                    type="submit"
                    disabled={isClassLoading}
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-bold transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isClassLoading ? '...' : 'Tambah'}
                  </button>
                </div>
              </div>
            </form>
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Daftar Kelas</label>
              <div className="flex flex-wrap gap-2">
                {classes.map(c => (
                  <div key={c.name} className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl group">
                    <span className="text-sm font-bold text-gray-700">{c.name}</span>
                    <button 
                      onClick={() => handleDeleteClass(c.name)}
                      className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {classes.length === 0 && <p className="text-gray-400 text-sm italic">Belum ada kelas.</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
