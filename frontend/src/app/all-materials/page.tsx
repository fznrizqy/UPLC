'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import {
  Calendar,
  Plus,
  Search,
  ExternalLink,
  ChevronRight,
  Clock,
  Filter,
  Trash2,
  Edit,
  X,
  BookOpen,
  AlertTriangle
} from 'lucide-react';

export default function AllMaterialsPage() {
  const { isDevelopmentOrAdmin } = useAuth();
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');

  // Delete confirmation modal state
  const [deletingMeeting, setDeletingMeeting] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Modal create/edit meeting state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    project_name: '',
    meeting_type: 'Pre-Validation',
    date_time: '',
    location_type: 'Virtual Meeting',
    location_detail: '',
    meeting_url: '',
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchMeetings();
  }, [search, filterType]);

  const fetchMeetings = async () => {
    try {
      const res = await api.get('/meetings', {
        params: {
          meeting_type: filterType || undefined,
          search: search || undefined
        }
      });
      setMeetings(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = async () => {
    setEditingId(null);
    setFormData({
      title: '',
      project_name: 'PRE-0001',
      meeting_type: 'Pre-Validation',
      date_time: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
      location_type: 'Virtual Meeting',
      location_detail: '',
      meeting_url: '',
      description: ''
    });
    setShowModal(true);

    try {
      const res = await api.get('/meetings/next-sharing-id?meeting_type=Pre-Validation');
      if (res.data?.next_sharing_id) {
        setFormData((prev) => ({ ...prev, project_name: res.data.next_sharing_id }));
      }
    } catch (err) {
      console.error('Failed to fetch next sharing ID', err);
    }
  };

  const handleMeetingTypeChange = async (newType: string) => {
    setFormData((prev) => ({ ...prev, meeting_type: newType }));
    if (!editingId) {
      try {
        const res = await api.get(`/meetings/next-sharing-id?meeting_type=${encodeURIComponent(newType)}`);
        if (res.data?.next_sharing_id) {
          setFormData((prev) => ({ ...prev, project_name: res.data.next_sharing_id }));
        }
      } catch (err) {
        console.error('Failed to fetch next sharing ID', err);
      }
    }
  };

  const handleOpenEdit = (m: any) => {
    setEditingId(m.id);
    const isOffline = m.location && m.location !== 'Virtual Meeting';
    setFormData({
      title: m.title,
      project_name: m.project_name,
      meeting_type: m.meeting_type,
      date_time: new Date(m.date_time).toISOString().slice(0, 16),
      location_type: isOffline ? 'Offline' : 'Virtual Meeting',
      location_detail: isOffline ? m.location : '',
      meeting_url: m.meeting_url || '',
      description: m.description || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const computedLocation =
        formData.location_type === 'Offline'
          ? (formData.location_detail.trim() || 'Offline')
          : 'Virtual Meeting';

      const payload = {
        title: formData.title,
        project_name: formData.project_name,
        meeting_type: formData.meeting_type,
        date_time: formData.date_time,
        location: computedLocation,
        meeting_url: formData.meeting_url,
        description: formData.description
      };

      if (editingId) {
        await api.put(`/meetings/${editingId}`, payload);
      } else {
        await api.post('/meetings', payload);
      }
      setShowModal(false);
      fetchMeetings();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Gagal menyimpan modul materi.');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingMeeting) return;
    setIsDeleting(true);
    try {
      await api.delete(`/meetings/${deletingMeeting.id}`);
      setDeletingMeeting(null);
      fetchMeetings();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Gagal menghapus materi.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-600" />
            <span>Semua Sharing</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Katalog lengkap modul materi validasi metode, dokumen protokol, rekaman video, dan kuis evaluasi
          </p>
        </div>

        {isDevelopmentOrAdmin && (
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Materi Baru</span>
          </button>
        )}
      </div>

      {/* Filter and search bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Cari judul, proyek, metode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Semua Tipe Sharing</option>
            <option value="Pre-Validation">Pre-Validation</option>
            <option value="Post-Validation">Post-Validation</option>
            <option value="Sosialisasi">Sosialisasi</option>
            <option value="Training">Training</option>
          </select>
        </div>
      </div>

      {/* Meeting list cards (4 columns on xl/2xl, 3 on lg, 2 on md, 1 on mobile) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4.5 stagger-child">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs">
            Memuat daftar materi validasi...
          </div>
        ) : meetings.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl p-12 text-center border border-slate-200 text-slate-400 text-xs">
            Belum ada materi validasi yang ditemukan.
          </div>
        ) : (
          meetings.map((m) => (
            <div
              key={m.id}
              className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between overflow-hidden"
            >
              <div className="p-5">
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    m.meeting_type === 'Pre-Validation'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : m.meeting_type === 'Post-Validation'
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      : m.meeting_type === 'Sosialisasi'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-purple-50 text-purple-700 border border-purple-200'
                  }`}>
                    {m.meeting_type}
                  </span>
                  <span className="text-xs font-semibold text-slate-500 truncate max-w-[150px]">
                    {m.project_name}
                  </span>
                </div>

                <Link
                  href={`/meetings/${m.id}`}
                  className="text-base font-bold text-slate-800 hover:text-blue-600 transition-colors block line-clamp-1"
                >
                  {m.title}
                </Link>

                <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                  {m.description || 'Tidak ada deskripsi tambahan untuk materi validasi ini.'}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <span>{new Date(m.date_time).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{new Date(m.date_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</span>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="bg-slate-50/80 px-5 py-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {m.meeting_url && (
                    <a
                      href={m.meeting_url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-md bg-white border border-slate-200 text-blue-600 hover:bg-blue-50 transition-colors"
                      title="Buka Link Google Meet / Zoom"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {isDevelopmentOrAdmin && (
                    <>
                      <button
                        onClick={() => handleOpenEdit(m)}
                        className="p-1.5 rounded-md bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                        title="Edit Materi"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingMeeting(m)}
                        className="p-1.5 rounded-md bg-white border border-slate-200 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Hapus Materi"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>

                <Link
                  href={`/meetings/${m.id}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  <span>Detail</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Create/Edit Meeting */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800">
                {editingId ? 'Edit Modul Materi' : 'Buat Modul Materi Baru'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Judul Materi / Topik Validasi *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Contoh: Sosialisasi Uji Disolusi Tablet Parasetamol"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    ID Sharing (Auto-Generated) *
                  </label>
                  <input
                    type="text"
                    required
                    readOnly={!editingId}
                    value={formData.project_name}
                    onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
                    className={`w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-blue-700 focus:outline-none ${
                      !editingId ? 'bg-slate-100/80 cursor-not-allowed select-all' : 'bg-white focus:ring-2 focus:ring-blue-500'
                    }`}
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Format: {formData.meeting_type === 'Pre-Validation' ? 'PRE-XXXX' : formData.meeting_type === 'Post-Validation' ? 'POS-XXXX' : formData.meeting_type === 'Sosialisasi' ? 'SOS-XXXX' : 'TRN-XXXX'}
                  </span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tipe Sharing *
                  </label>
                  <select
                    value={formData.meeting_type}
                    onChange={(e) => handleMeetingTypeChange(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Pre-Validation">Pre-Validation</option>
                    <option value="Post-Validation">Post-Validation</option>
                    <option value="Sosialisasi">Sosialisasi</option>
                    <option value="Training">Training</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Waktu Pelaksanaan Sesi *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.date_time}
                  onChange={(e) => setFormData({ ...formData, date_time: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Tempat (Virtual Meeting / Offline) */}
              <div className="space-y-2.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tempat Pelaksanaan Sesi *
                  </label>
                  <select
                    value={formData.location_type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        location_type: e.target.value,
                        location_detail: e.target.value === 'Virtual Meeting' ? '' : formData.location_detail
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Virtual Meeting">Virtual Meeting</option>
                    <option value="Offline">Offline</option>
                  </select>
                </div>

                {formData.location_type === 'Offline' && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                    <label className="block font-semibold text-slate-700 text-xs">
                      Detail Tempat Offline *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.location_detail}
                      onChange={(e) => setFormData({ ...formData, location_detail: e.target.value })}
                      placeholder="Contoh: Ruang Rapat Lt. 2 / Lab Kimia Fisika"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-500 block">
                      Tempat ini yang akan tercetak otomatis pada laporan Export Daftar Hadir.
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Link Meeting Virtual (Opsional)
                </label>
                <input
                  type="url"
                  value={formData.meeting_url}
                  onChange={(e) => setFormData({ ...formData, meeting_url: e.target.value })}
                  placeholder="https://meet.google.com/... atau Zoom"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Deskripsi / Catatan Materi
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ringkasan poin penting pembahasan metode validasi..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Modul'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (Styled identically to Logout modal) */}
      {deletingMeeting && (
        <div
          onClick={() => !isDeleting && setDeletingMeeting(null)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in duration-200 text-slate-800 cursor-default"
          >
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100">
                <AlertTriangle className="w-6 h-6 text-rose-500" />
              </div>

              <h3 className="text-base font-bold text-slate-800">
                Konfirmasi Hapus
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Apakah Anda yakin ingin menghapus materi <span className="font-semibold text-slate-700">"{deletingMeeting.title}"</span> beserta seluruh dokumen dan rekamannya?
              </p>

              <div className="grid grid-cols-2 gap-2.5 mt-6">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setDeletingMeeting(null)}
                  className="py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={confirmDelete}
                  className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isDeleting ? 'Menghapus...' : 'Ya, Hapus'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
