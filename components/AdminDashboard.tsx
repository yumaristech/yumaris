
import React, { useState, useEffect } from 'react';

interface AdminDashboardProps {
  onBack: () => void;
  showToast: (msg: string, type: 'success' | 'error') => void;
  activeTab?: 'all' | 'management' | 'submissions';
}

import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { 
  collection, 
  getDocs, 
  setDoc, 
  doc, 
  deleteDoc, 
  query, 
  orderBy, 
  where,
  writeBatch
} from 'firebase/firestore';

interface UserData {
  username: string;
  password: string;
  identitas: string;
  role: 'admin' | 'user' | 'teacher';
  email?: string;
  class_name?: string;
  whatsapp?: string;
}

interface ClassData {
  name: string;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack, showToast, activeTab = 'all' }) => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [identitas, setIdentitas] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [role, setRole] = useState<'admin' | 'user' | 'teacher'>('user');
  const [selectedClass, setSelectedClass] = useState('');
  const [teacherClasses, setTeacherClasses] = useState<string[]>([]);
  const [newClassName, setNewClassName] = useState('');
  const [editingUsername, setEditingUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isClassLoading, setIsClassLoading] = useState(false);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isSubmissionsLoading, setIsSubmissionsLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [submissionSearch, setSubmissionSearch] = useState('');
  const [submissionClassFilter, setSubmissionClassFilter] = useState('');
  const [submissionIdentitasFilter, setSubmissionIdentitasFilter] = useState('');

  useEffect(() => {
    fetchUsers();
    fetchClasses();
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      setIsSubmissionsLoading(true);
      const q = query(collection(db, 'submissions'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      data.sort((a: any, b: any) => {
        const timeA = (a.created_at?.toDate?.() || a.timestamp?.toDate?.() || new Date(a.created_at || a.timestamp || 0)).getTime();
        const timeB = (b.created_at?.toDate?.() || b.timestamp?.toDate?.() || new Date(b.created_at || b.timestamp || 0)).getTime();
        return timeB - timeA;
      });
      
      setSubmissions(data);
    } catch (err) {
      console.error('Error fetching submissions:', err);
    } finally {
      setIsSubmissionsLoading(false);
    }
  };

  const handleDeleteSubmission = async (id: string) => {
    if (!id) {
      showToast('ID data tidak valid', 'error');
      return;
    }

    if (window.confirm('Hapus riwayat setoran ini?')) {
      try {
        setIsSubmissionsLoading(true);
        const docRef = doc(db, 'submissions', id);
        await deleteDoc(docRef);
        showToast('Setoran berhasil dihapus', 'success');
        await fetchSubmissions();
      } catch (err: any) {
        console.error('Error deleting submission:', err);
        try {
          handleFirestoreError(err, OperationType.DELETE, `submissions/${id}`);
        } catch (rulesErr: any) {
          showToast(`Gagal: ${rulesErr.message.includes('permission') ? 'Izin ditolak' : 'Terjadi kesalahan'}`, 'error');
        }
      } finally {
        setIsSubmissionsLoading(false);
      }
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const filteredSubmissions = React.useMemo(() => {
    return submissions.map(s => {
      const user = users.find(u => u.identitas === (s.participant_id || s.student_identitas));
      return {
        ...s,
        display_username: user ? user.username : (s.student_username || 'Siswa dihapus'),
        display_identitas: s.participant_id || s.student_identitas || '-',
        display_class: user ? user.class_name : (s.student_class || '-')
      };
    }).filter(s => {
      const matchSearch = !submissionSearch || 
        s.display_username?.toLowerCase().includes(submissionSearch.toLowerCase()) || 
        s.display_identitas?.toLowerCase().includes(submissionSearch.toLowerCase()) ||
        s.juz?.toString().includes(submissionSearch) ||
        s.surah?.toLowerCase().includes(submissionSearch.toLowerCase());
      
      const matchClass = !submissionClassFilter || s.display_class === submissionClassFilter;
      const matchIdentitas = !submissionIdentitasFilter || s.display_identitas === submissionIdentitasFilter;
      
      return matchSearch && matchClass && matchIdentitas;
    });
  }, [submissions, users, submissionSearch, submissionClassFilter, submissionIdentitasFilter]);

  const fetchClasses = async () => {
    setIsClassLoading(true);
    try {
      const q = query(collection(db, 'classes'), orderBy('name', 'asc'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => doc.data() as ClassData);
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
      const q = query(collection(db, 'users'), orderBy('username', 'asc'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => doc.data() as UserData);
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
      const userRef = doc(db, 'users', cleanUsername);
      const userData = { 
        username: cleanUsername,
        password: cleanPassword, 
        identitas: cleanIdentitas,
        email: email.trim().toLowerCase(),
        whatsapp: whatsapp.trim(),
        role: role,
        class_name: role === 'user' ? selectedClass : null
      };

      await setDoc(userRef, userData);

      if ((role === 'teacher' || role === 'admin') && email.trim()) {
        const adminRef = doc(db, 'authorized_admins', email.trim().toLowerCase());
        await setDoc(adminRef, { 
          username: cleanUsername, 
          role: role,
          updated_at: new Date()
        });
      }

      if (role === 'teacher') {
        const q = query(collection(db, 'teacher_classes'), where('teacher_username', '==', cleanUsername));
        const querySnapshot = await getDocs(q);
        const batch = writeBatch(db);
        querySnapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });
        await batch.commit();

        if (teacherClasses.length > 0) {
          const innerBatch = writeBatch(db);
          teacherClasses.forEach(c => {
            const tcRef = doc(collection(db, 'teacher_classes'));
            innerBatch.set(tcRef, { teacher_username: cleanUsername, class_name: c });
          });
          await innerBatch.commit();
        }
      }

      showToast(editingUsername ? 'User berhasil diperbarui' : 'User berhasil ditambahkan', 'success');
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
    setEmail('');
    setWhatsapp('');
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
    setEmail(user.email || '');
    setWhatsapp(user.whatsapp || '');
    setRole(user.role || 'user');
    setSelectedClass(user.class_name || '');

    if (user.role === 'teacher') {
      const q = query(collection(db, 'teacher_classes'), where('teacher_username', '==', user.username));
      const querySnapshot = await getDocs(q);
      setTeacherClasses(querySnapshot.docs.map(d => d.data().class_name) || []);
    } else {
      setTeacherClasses([]);
    }
  };

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    setIsClassLoading(true);
    try {
      const classRef = doc(db, 'classes', newClassName.trim());
      await setDoc(classRef, { name: newClassName.trim() });
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
        await deleteDoc(doc(db, 'classes', name));
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
        await deleteDoc(doc(db, 'users', user));
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

  const filteredUsers = React.useMemo(() => {
    return users.filter(user => 
      user.username.toLowerCase().includes(userSearch.toLowerCase()) || 
      user.identitas.toLowerCase().includes(userSearch.toLowerCase())
    );
  }, [users, userSearch]);

  return (
    <div className="h-full w-full flex flex-col p-4 md:p-8 bg-slate-900 overflow-y-auto custom-scrollbar animate-fade-in">
      <div className="max-w-5xl mx-auto w-full space-y-8">
        
        <div className="flex items-center justify-between bg-white/10 backdrop-blur-xl p-6 rounded-[32px] border border-white/10">
          <div>
            <h2 className="text-2xl font-black text-white">
              {activeTab === 'submissions' ? '📋 Riwayat Setoran' : '🛡️ Admin Dashboard'}
            </h2>
            <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest mt-1">
              {activeTab === 'submissions' ? 'Monitoring Setoran Seluruh Siswa' : 'Manajemen Pengguna, Kelas & Riwayat'}
            </p>
          </div>
          <button 
            onClick={onBack}
            className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-bold transition-all"
          >
            Kembali
          </button>
        </div>

        {(activeTab === 'all' || activeTab === 'management') && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5 bg-white rounded-[32px] p-8 shadow-2xl border border-green-50 h-fit">
              <h3 className="text-xl font-black text-green-800 mb-6 flex items-center gap-2">
                <span>{editingUsername ? '✏️' : '👤'}</span> 
                {editingUsername ? 'Edit Pengguna' : 'Tambah User Baru'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Username {editingUsername && '(Tidak bisa diubah)'}</label>
                  <input 
                    type="text" 
                    className={`w-full px-5 py-3 border-2 border-gray-100 rounded-2xl focus:border-green-500 focus:outline-none transition-all font-medium ${editingUsername ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''}`}
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    disabled={isLoading || !!editingUsername}
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
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Email Google (Wajib untuk Guru/Admin agar bisa hapus data)</label>
                  <input 
                    type="email" 
                    className="w-full px-5 py-3 border-2 border-gray-100 rounded-2xl focus:border-green-500 focus:outline-none transition-all font-medium"
                    placeholder="email@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">No. WhatsApp Wali (Contoh: 6281234...)</label>
                  <input 
                    type="text" 
                    className="w-full px-5 py-3 border-2 border-gray-100 rounded-2xl focus:border-green-500 focus:outline-none transition-all font-medium"
                    placeholder="628xxxxxxxxxx"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value.replace(/[^0-9]/g, ''))}
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

            <div className="lg:col-span-7 bg-white rounded-[32px] p-8 shadow-2xl border border-green-50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h3 className="text-xl font-black text-green-800 flex items-center gap-2">
                  <span>📋</span> Daftar Pengguna
                </h3>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">🔍</span>
                  <input 
                    type="text"
                    placeholder="Cari nama atau ID..."
                    className="pl-8 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:border-green-500 focus:outline-none transition-all w-full sm:w-48"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {filteredUsers.length === 0 && !isLoading && (
                  <p className="text-center text-gray-400 py-10">
                    {userSearch ? 'Tidak ada pengguna yang cocok.' : 'Belum ada pengguna.'}
                  </p>
                )}
                {filteredUsers.map((user) => (
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
                        {user.email && (
                          <p className="text-[9px] text-emerald-600 font-bold truncate mt-0.5">
                            📧 {user.email}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Identitas</p>
                        <p className="font-bold text-emerald-700 truncate">{user.identitas}</p>
                        {user.whatsapp && (
                          <p className="text-[9px] text-green-600 font-bold flex items-center gap-1 mt-0.5">
                            <span>📱</span> {user.whatsapp}
                          </p>
                        )}
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
        )}

        {(activeTab === 'all' || activeTab === 'management') && (
          <div className="bg-white rounded-[32px] p-8 shadow-2xl border border-green-50 mt-8">
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
        )}

        {(activeTab === 'all' || activeTab === 'submissions') && (
          <div className="bg-white rounded-[32px] p-8 shadow-2xl border border-green-50 mt-8">
            <div className="flex flex-col gap-6 mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="text-xl font-black text-green-800 flex items-center gap-2">
                  <span>📋</span> Riwayat Setoran Siswa
                </h3>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">🔍</span>
                  <input 
                    type="text"
                    placeholder="Cari Siswa atau Juz..."
                    className="pl-8 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:border-green-500 focus:outline-none transition-all w-full sm:w-64"
                    value={submissionSearch}
                    onChange={(e) => setSubmissionSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-3 p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Filter Kelas</label>
                  <select 
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none focus:border-green-500 transition-all"
                    value={submissionClassFilter}
                    onChange={(e) => setSubmissionClassFilter(e.target.value)}
                  >
                    <option value="">Semua Kelas</option>
                    {classes.map(c => (
                      <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Filter ID Pengguna</label>
                  <select 
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none focus:border-green-500 transition-all"
                    value={submissionIdentitasFilter}
                    onChange={(e) => setSubmissionIdentitasFilter(e.target.value)}
                  >
                    <option value="">Semua ID Pengguna</option>
                    {users
                      .filter(u => u.role === 'user')
                      .sort((a, b) => a.identitas.localeCompare(b.identitas))
                      .map(u => (
                        <option key={u.identitas} value={u.identitas}>{u.identitas} - {u.username}</option>
                      ))
                    }
                  </select>
                </div>
                <button 
                  onClick={() => {
                    setSubmissionClassFilter('');
                    setSubmissionIdentitasFilter('');
                    setSubmissionSearch('');
                  }}
                  className="mt-auto px-4 py-2 text-xs font-bold text-gray-400 hover:text-green-600 transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="pb-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Siswa & ID</th>
                    <th className="pb-3 text-[10px] font-black text-gray-400 uppercase tracking-widest px-4">Detail Setoran</th>
                    <th className="pb-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Waktu</th>
                    <th className="pb-3 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {isSubmissionsLoading ? (
                    <tr>
                      <td colSpan={4} className="py-10 text-center text-gray-400">Memuat data...</td>
                    </tr>
                  ) : filteredSubmissions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-10 text-center text-gray-400 font-medium italic">Data tidak ditemukan.</td>
                    </tr>
                  ) : filteredSubmissions.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50/80 transition-colors group">
                      <td className="py-4">
                        <div className="flex flex-col">
                          <span className="font-black text-gray-800 text-sm">{s.display_username}</span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-white bg-emerald-500 px-1.5 py-0.5 rounded font-black tracking-widest uppercase">ID: {s.display_identitas}</span>
                            {s.display_class !== '-' && (
                              <span className="text-[10px] text-gray-400 font-bold">Kelas {s.display_class}</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-1.5">
                          {s.juz && <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded text-[10px] font-bold">Juz {s.juz}</span>}
                          {s.halaman && <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-100 rounded text-[10px] font-bold">Hal {s.halaman}</span>}
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 rounded text-[10px] font-bold">{s.surah}</span>
                          {(s.ayat || s.ayah) && <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded text-[10px] font-bold">Ayat {s.ayat || s.ayah}</span>}
                        </div>
                      </td>
                      <td className="py-4 whitespace-nowrap">
                        <p className="text-[10px] text-gray-400 font-bold uppercase">
                          {formatDate(s.created_at || s.timestamp)}
                        </p>
                      </td>
                      <td className="py-4 text-right">
                        <button 
                          onClick={() => handleDeleteSubmission(s.id)}
                          className="p-2 text-white bg-red-500 hover:bg-red-600 rounded-xl transition-all shadow-sm shadow-red-100 active:scale-95"
                          title="Hapus"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
