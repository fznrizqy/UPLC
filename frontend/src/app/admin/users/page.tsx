'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import {
  Users,
  Plus,
  Trash2,
  Edit2,
  Shield,
  User,
  X,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  UserX,
  Key,
  AlertTriangle
} from 'lucide-react';

export default function AdminUsersPage() {
  const { user: currentUser, isAdmin } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'active' | 'inactive'>('all');

  // Confirmation Modal State (Styled like Logout Modal)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'toggle_active' | 'delete';
    user: any;
    title: string;
    description: string;
    confirmText: string;
    isDanger?: boolean;
  }>({
    isOpen: false,
    type: 'toggle_active',
    user: null,
    title: '',
    description: '',
    confirmText: '',
    isDanger: false
  });

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    username: '',
    display_name: '',
    position: '',
    password: '',
    role: 'routine',
    is_active: true
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      display_name: '',
      position: '',
      password: '',
      role: 'routine',
      is_active: true
    });
    setShowModal(true);
  };

  const handleOpenEdit = (u: any) => {
    setEditingUser(u);
    setFormData({
      username: u.username,
      display_name: u.display_name,
      position: u.position || '',
      password: '',
      role: u.role,
      is_active: u.is_active
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingUser) {
        const payload: any = {
          display_name: formData.display_name,
          position: formData.position.trim() || null,
          role: formData.role,
          is_active: formData.is_active
        };
        if (formData.password) payload.password = formData.password;
        await api.put(`/users/${editingUser.id}`, payload);
      } else {
        await api.post('/users', {
          ...formData,
          position: formData.position.trim() || null
        });
      }
      setShowModal(false);
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Gagal menyimpan akun user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickToggleActive = (u: any) => {
    if (u.id === currentUser?.id) {
      alert('Anda tidak dapat menonaktifkan akun sendiri!');
      return;
    }
    const newStatus = !u.is_active;

    // Jika ingin MENGAKTIFKAN akun (misalnya dari Pending -> Aktif),
    // langsung buka modal edit akun dengan status aktif terpilih agar admin bisa cepat menentukan Role, Jabatan & konfirmasi
    if (newStatus) {
      setEditingUser(u);
      setFormData({
        username: u.username,
        display_name: u.display_name,
        position: u.position || '',
        password: '',
        role: u.role || 'routine',
        is_active: true
      });
      setShowModal(true);
      return;
    }

    // Jika ingin MENONAKTIFKAN akun yang sedang aktif, tampilkan dialog konfirmasi
    setConfirmModal({
      isOpen: true,
      type: 'toggle_active',
      user: u,
      title: 'Konfirmasi Nonaktifkan Akun',
      description: `Apakah Anda yakin ingin menonaktifkan akun '${u.username}' (${u.display_name})? Pengguna tidak akan dapat masuk ke sistem sampai diaktifkan kembali.`,
      confirmText: 'Ya, Nonaktifkan',
      isDanger: true
    });
  };

  const handleDelete = (u: any) => {
    if (u.id === currentUser?.id) {
      alert('Anda tidak dapat menghapus akun admin yang sedang login!');
      return;
    }
    setConfirmModal({
      isOpen: true,
      type: 'delete',
      user: u,
      title: 'Konfirmasi Hapus Akun',
      description: `Apakah Anda yakin ingin menghapus akun pengguna '${u.username}' (${u.display_name})? Seluruh riwayat dan data terkait akun ini akan dihapus secara permanen.`,
      confirmText: 'Ya, Hapus Akun',
      isDanger: true
    });
  };

  const handleConfirmAction = async () => {
    const { type, user: targetUser } = confirmModal;
    if (!targetUser) return;

    try {
      if (type === 'toggle_active') {
        await api.put(`/users/${targetUser.id}`, { is_active: !targetUser.is_active });
      } else if (type === 'delete') {
        await api.delete(`/users/${targetUser.id}`);
      }
      setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Gagal memproses tindakan pengguna');
    }
  };

  // Filtered list based on search and tab
  const filteredUsers = users.filter((u) => {
    const term = search.toLowerCase();
    const matchSearch =
      (u.username || '').toLowerCase().includes(term) ||
      (u.display_name || '').toLowerCase().includes(term) ||
      (u.role || '').toLowerCase().includes(term);

    if (!matchSearch) return false;

    if (filterTab === 'pending') return !u.is_active;
    if (filterTab === 'active') return u.is_active;
    if (filterTab === 'inactive') return !u.is_active;
    return true;
  });

  const pendingCount = users.filter((u) => !u.is_active).length;
  const activeCount = users.filter((u) => u.is_active).length;

  if (!isAdmin) {
    return <div className="p-8 text-rose-600 font-bold text-center">Akses Ditolak: Khusus Administrator Sistem.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            <span>Manajemen Pengguna & Aktivasi Akun</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Verifikasi pendaftaran pengguna baru, tentukan peran tim kerja, dan kelola status aktif/non-aktif akun
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Akun Baru</span>
        </button>
      </div>

      {/* Tabs & Search Filter */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 w-full md:w-auto">
          <button
            type="button"
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterTab === 'all'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Semua ({users.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              filterTab === 'pending'
                ? 'bg-amber-500 text-white shadow-2xs'
                : 'text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending / Non-Aktif ({pendingCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterTab('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterTab === 'active'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Aktif ({activeCount})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari nama, username, role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none focus:bg-white"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Nama Lengkap</th>
                <th className="py-3 px-4">Username</th>
                <th className="py-3 px-4">Jabatan</th>
                <th className="py-3 px-4">Peran (Role)</th>
                <th className="py-3 px-4">Status Akun</th>
                <th className="py-3 px-4">Terdaftar Sejak</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Memuat data user...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    {search ? 'Tidak ada akun yang cocok dengan pencarian.' : 'Tidak ada data pengguna pada kategori ini.'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className={`hover:bg-slate-50 transition-colors ${!u.is_active ? 'bg-amber-50/20' : ''}`}>
                    <td className="py-3 px-4 font-bold text-slate-800">
                      {u.display_name}
                      {u.id === currentUser?.id && (
                        <span className="ml-2 px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-normal">
                          (Anda)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">{u.username}</td>
                    <td className="py-3 px-4">
                      {u.position ? (
                        <span className="text-slate-800 font-medium text-xs">
                          {u.position}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {u.role === 'admin' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-semibold text-[10px]">
                          <Shield className="w-3 h-3 text-amber-600" />
                          <span>Administrator</span>
                        </span>
                      ) : u.role === 'development' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200 font-semibold text-[10px]">
                          <Shield className="w-3 h-3 text-sky-600" />
                          <span>Tim Pengembangan</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold text-[10px]">
                          <User className="w-3 h-3 text-blue-600" />
                          <span>Tim Rutin</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {/* Status Toggle Switch */}
                        <button
                          type="button"
                          onClick={() => handleQuickToggleActive(u)}
                          disabled={u.id === currentUser?.id}
                          title={
                            u.id === currentUser?.id
                              ? 'Tidak dapat menonaktifkan akun sendiri'
                              : u.is_active
                              ? 'Klik untuk Menonaktifkan Akun'
                              : 'Klik untuk Mengaktifkan Akun'
                          }
                          className={`relative inline-flex items-center h-6 w-24 rounded-full transition-colors duration-200 ease-in-out cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-emerald-500 shadow-2xs ${
                            u.id === currentUser?.id
                              ? 'opacity-60 cursor-not-allowed bg-emerald-600'
                              : u.is_active
                              ? 'bg-emerald-600'
                              : 'bg-amber-400'
                          }`}
                        >
                          <span
                            className={`w-full text-[10px] font-bold text-white transition-opacity ${
                              u.is_active ? 'text-left pl-2.5' : 'text-right pr-2 text-slate-800 font-semibold'
                            }`}
                          >
                            {u.is_active ? 'Aktif' : 'Pending'}
                          </span>
                          <span
                            className={`absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                              u.is_active ? 'translate-x-[74px]' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(u.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(u)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                        title="Edit Peran & Data"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      {u.id !== currentUser?.id && (
                        <button
                          onClick={() => handleDelete(u)}
                          className="p-1.5 rounded text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Hapus Akun"
                        >
                          <Trash2 className="w-3.5 h-3.5 inline" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in duration-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-800">
                  {editingUser ? 'Edit Akun & Hak Akses Pengguna' : 'Tambah Akun Pengguna Baru'}
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {editingUser ? `Menyesuaikan peran dan status akun ${editingUser.username}` : 'Daftarkan akun staf baru'}
                </p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Username (Inisial 3 Huruf Kapital) *</label>
                <input
                  type="text"
                  required
                  maxLength={3}
                  disabled={!!editingUser}
                  value={formData.username}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 3);
                    setFormData({ ...formData, username: val });
                  }}
                  placeholder="3 huruf inisial nama anda"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:normal-case placeholder:font-normal placeholder:tracking-normal uppercase font-bold tracking-wider focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap & Gelar *</label>
                <input
                  type="text"
                  required
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  placeholder="Budi Santoso, S.Farm"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Jabatan *</label>
                <select
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white font-medium focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Pilih Jabatan --</option>
                  <option value="Manager Laboratorium">Manager Laboratorium</option>
                  <option value="Asistant Manager Laboratorium">Asistant Manager Laboratorium</option>
                  <option value="Supervisor Laboratorium">Supervisor Laboratorium</option>
                  <option value="Analis Laboratorium">Analis Laboratorium</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {editingUser ? 'Reset Password (Kosongkan jika tidak diganti)' : 'Password *'}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={editingUser ? 'Ketik password baru...' : 'Minimal 4 karakter'}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Peran Kerja (Role) *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500 font-semibold"
                  >
                    <option value="routine">Tim Rutin (Analis/Pelajar)</option>
                    <option value="development">Tim Pengembangan (R&D)</option>
                    <option value="admin">Administrator Sistem</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status Keaktifan *</label>
                  <select
                    value={formData.is_active ? 'true' : 'false'}
                    disabled={editingUser?.id === currentUser?.id}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500 font-semibold disabled:bg-slate-100"
                  >
                    <option value="true">Aktif (Dapat Masuk)</option>
                    <option value="false">Pending / Non-Aktif</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Menyimpan...' : editingUser && formData.is_active && !editingUser.is_active ? 'Simpan & Aktifkan Akun' : 'Simpan Perubahan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal (Styled exactly like Logout Modal) */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl border border-slate-100 animate-page-entrance text-slate-800">
            <div className="p-6 text-center">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 border ${
                  confirmModal.isDanger
                    ? 'bg-rose-50 text-rose-600 border-rose-100'
                    : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                }`}
              >
                {confirmModal.isDanger ? (
                  <AlertTriangle className="w-6 h-6 text-rose-500" />
                ) : (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                )}
              </div>

              <h3 className="text-base font-bold text-slate-800">
                {confirmModal.title}
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                {confirmModal.description}
              </p>

              <div className="grid grid-cols-2 gap-2.5 mt-6">
                <button
                  type="button"
                  onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                  className="py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAction}
                  className={`py-2.5 px-4 rounded-xl text-white text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                    confirmModal.isDanger
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {confirmModal.isDanger ? (
                    <UserX className="w-3.5 h-3.5" />
                  ) : (
                    <UserCheck className="w-3.5 h-3.5" />
                  )}
                  <span>{confirmModal.confirmText}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
