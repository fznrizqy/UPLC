'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import {
  ClipboardList,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  X,
  HelpCircle,
  FolderPlus,
  Edit,
  Lock,
  Unlock,
  AlertCircle,
  AlertTriangle,
  Info,
  Search,
  Image as ImageIcon,
  Upload,
  Loader2
} from 'lucide-react';

export default function AdminQuizzesPage() {
  const { isDevelopmentOrAdmin } = useAuth();
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Create Quiz Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [meetingId, setMeetingId] = useState('');
  const [quizType, setQuizType] = useState('Pre-Validation');
  const [quizTitle, setQuizTitle] = useState('');
  const [passingScore, setPassingScore] = useState(70);

  // Questions dynamic builder for create modal
  const [questions, setQuestions] = useState<any[]>([
    {
      question_text: '',
      image_url: '',
      question_type: 'multiple_choice',
      order_num: 1,
      options: [
        { option_text: '', is_correct: true },
        { option_text: '', is_correct: false },
        { option_text: '', is_correct: false },
        { option_text: '', is_correct: false }
      ]
    }
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImageIndex, setUploadingImageIndex] = useState<{ mode: 'create' | 'edit'; index: number } | null>(null);

  // Edit Quiz Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<any>(null);
  const [editMeetingId, setEditMeetingId] = useState('');
  const [editQuizType, setEditQuizType] = useState('Pre-Validation');
  const [editQuizTitle, setEditQuizTitle] = useState('');
  const [editPassingScore, setEditPassingScore] = useState(70);
  const [editQuestions, setEditQuestions] = useState<any[]>([]);
  const [editSubmissionsCount, setEditSubmissionsCount] = useState(0);
  const [editIsActive, setEditIsActive] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [resQuizzes, resMeetings] = await Promise.all([
        api.get('/quizzes'),
        api.get('/meetings')
      ]);
      setQuizzes(resQuizzes.data);
      setMeetings(resMeetings.data);
      if (resMeetings.data.length > 0) {
        setMeetingId(resMeetings.data[0].id.toString());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredQuizzes = quizzes.filter((q) => {
    const term = search.toLowerCase();
    const titleMatch = (q.title || '').toLowerCase().includes(term);
    const typeMatch = (q.quiz_type || '').toLowerCase().includes(term);
    const meetingMatch = meetings.find((m) => m.id === q.meeting_id)?.title?.toLowerCase().includes(term) || `id #${q.meeting_id}`.includes(term);
    return titleMatch || typeMatch || meetingMatch;
  });

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        question_text: '',
        image_url: '',
        question_type: 'multiple_choice',
        order_num: questions.length + 1,
        options: [
          { option_text: '', is_correct: true },
          { option_text: '', is_correct: false },
          { option_text: '', is_correct: false },
          { option_text: '', is_correct: false }
        ]
      }
    ]);
  };

  const handleRemoveQuestion = (idx: number) => {
    if (questions.length === 1) return;
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const handleQuestionTextChange = (idx: number, text: string) => {
    const updated = [...questions];
    updated[idx].question_text = text;
    setQuestions(updated);
  };

  const handleOptionChange = (qIdx: number, optIdx: number, text: string) => {
    const updated = [...questions];
    updated[qIdx].options[optIdx].option_text = text;
    setQuestions(updated);
  };

  const handleSetCorrect = (qIdx: number, optIdx: number) => {
    const updated = [...questions];
    updated[qIdx].options.forEach((opt: any, i: number) => {
      opt.is_correct = i === optIdx;
    });
    setQuestions(updated);
  };

  // Edit question handlers
  const handleAddEditQuestion = () => {
    setEditQuestions([
      ...editQuestions,
      {
        question_text: '',
        image_url: '',
        question_type: 'multiple_choice',
        order_num: editQuestions.length + 1,
        options: [
          { option_text: '', is_correct: true },
          { option_text: '', is_correct: false },
          { option_text: '', is_correct: false },
          { option_text: '', is_correct: false }
        ]
      }
    ]);
  };

  const handleRemoveEditQuestion = (idx: number) => {
    if (editQuestions.length === 1) return;
    setEditQuestions(editQuestions.filter((_, i) => i !== idx));
  };

  const handleEditQuestionTextChange = (idx: number, text: string) => {
    const updated = [...editQuestions];
    updated[idx].question_text = text;
    setEditQuestions(updated);
  };

  const handleEditOptionChange = (qIdx: number, optIdx: number, text: string) => {
    const updated = [...editQuestions];
    updated[qIdx].options[optIdx].option_text = text;
    setEditQuestions(updated);
  };

  const handleEditSetCorrect = (qIdx: number, optIdx: number) => {
    const updated = [...editQuestions];
    updated[qIdx].options.forEach((opt: any, i: number) => {
      opt.is_correct = i === optIdx;
    });
    setEditQuestions(updated);
  };

  // Image upload handler (single image per question)
  const handleImageUpload = async (mode: 'create' | 'edit', qIdx: number, file: File) => {
    if (!file) return;
    
    // Check file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      alert('Format file tidak didukung. Mohon upload file gambar (PNG, JPG, WEBP, GIF).');
      return;
    }

    // Check size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Ukuran file gambar maksimal 10MB.');
      return;
    }

    try {
      setUploadingImageIndex({ mode, index: qIdx });
      const formData = new FormData();
      formData.append('file', file);

      const res = await api.post('/quizzes/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const imageUrl = res.data.url;
      if (mode === 'create') {
        const updated = [...questions];
        updated[qIdx].image_url = imageUrl;
        setQuestions(updated);
      } else {
        const updated = [...editQuestions];
        updated[qIdx].image_url = imageUrl;
        setEditQuestions(updated);
      }
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.detail || 'Gagal mengupload gambar soal.');
    } finally {
      setUploadingImageIndex(null);
    }
  };

  const handleRemoveImage = (mode: 'create' | 'edit', qIdx: number) => {
    if (mode === 'create') {
      const updated = [...questions];
      updated[qIdx].image_url = '';
      setQuestions(updated);
    } else {
      const updated = [...editQuestions];
      updated[qIdx].image_url = '';
      setEditQuestions(updated);
    }
  };

  const handleToggleActive = async (quiz: any) => {
    try {
      await api.put(`/quizzes/${quiz.id}`, {
        is_active: !quiz.is_active
      });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Gagal mengubah status kuis');
    }
  };

  const handleDeleteQuiz = async (id: number) => {
    if (!confirm('Hapus kuis ini beserta semua jawaban dan riwayat nilainya?')) return;
    try {
      await api.delete(`/quizzes/${id}`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Gagal menghapus kuis');
    }
  };

  const handleOpenEdit = async (quiz: any) => {
    try {
      // Fetch fresh quiz details to ensure full questions with answers
      const res = await api.get(`/quizzes/${quiz.id}`);
      const qData = res.data;
      setEditingQuiz(qData);
      setEditMeetingId(qData.meeting_id.toString());
      setEditQuizType(qData.quiz_type);
      setEditQuizTitle(qData.title);
      setEditPassingScore(qData.passing_score);
      setEditIsActive(qData.is_active);
      setEditSubmissionsCount(qData.submissions_count || 0);

      const mappedQuestions = (qData.questions || []).map((q: any) => ({
        id: q.id,
        question_text: q.question_text,
        image_url: q.image_url || '',
        question_type: q.question_type,
        order_num: q.order_num,
        options: (q.options || []).map((o: any) => ({
          id: o.id,
          option_text: o.option_text,
          is_correct: !!o.is_correct
        }))
      }));
      setEditQuestions(mappedQuestions);
      setShowEditModal(true);
    } catch (err: any) {
      alert('Gagal mengambil data kuis untuk diedit');
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuiz) return;

    // Check questions validation if questions can be edited
    const questionsCanBeEdited = !editIsActive && editSubmissionsCount === 0;

    if (questionsCanBeEdited) {
      for (let i = 0; i < editQuestions.length; i++) {
        if (!editQuestions[i].question_text.trim()) {
          alert(`Pertanyaan #${i + 1} belum diisi.`);
          return;
        }
        const hasCorrect = editQuestions[i].options.some((o: any) => o.is_correct);
        if (!hasCorrect) {
          alert(`Pilihlah salah satu jawaban benar untuk pertanyaan #${i + 1}.`);
          return;
        }
      }
    }

    setEditSubmitting(true);
    try {
      const payload: any = {
        title: editQuizTitle,
        quiz_type: editQuizType,
        passing_score: editPassingScore,
        is_active: editIsActive
      };

      if (questionsCanBeEdited) {
        payload.questions = editQuestions;
      }

      await api.put(`/quizzes/${editingQuiz.id}`, payload);
      setShowEditModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Gagal menyimpan perubahan kuis');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingId || !quizTitle) return;

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].question_text.trim()) {
        alert(`Pertanyaan #${i + 1} belum diisi.`);
        return;
      }
      const hasCorrect = questions[i].options.some((o: any) => o.is_correct);
      if (!hasCorrect) {
        alert(`Pilihlah salah satu jawaban benar untuk pertanyaan #${i + 1}.`);
        return;
      }
    }

    setSubmitting(true);
    try {
      await api.post('/quizzes', {
        meeting_id: parseInt(meetingId),
        quiz_type: quizType,
        title: quizTitle,
        passing_score: passingScore,
        is_active: false, // Default is Draft / Inactive
        questions: questions
      });

      setShowCreateModal(false);
      setQuizTitle('');
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Gagal membuat kuis.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isDevelopmentOrAdmin) {
    return <div className="p-8 text-rose-600 font-bold text-center">Akses Ditolak: Khusus Tim Pengembangan dan Admin.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-800 tracking-tight">
            Kelola Kuis Evaluasi (Tim Pengembangan)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Buat instrumen evaluasi Pre/Post-Validation, atur kunci jawaban, passing grade, edit soal kuis draft, dan kelola status aktif
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Kuis Baru (Draft)</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Cari judul kuis, tipe, atau topik meeting..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none focus:bg-white"
          />
        </div>
      </div>

      {/* Quizzes Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Judul Kuis</th>
                <th className="py-3 px-4">Tipe Kuis</th>
                <th className="py-3 px-4">Meeting Terkait</th>
                <th className="py-3 px-4">Passing Grade</th>
                <th className="py-3 px-4">Pengerjaan</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Memuat data kuis...
                  </td>
                </tr>
              ) : filteredQuizzes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    {search ? 'Tidak ada kuis yang sesuai dengan pencarian.' : 'Belum ada kuis yang dibuat.'}
                  </td>
                </tr>
              ) : (
                filteredQuizzes.map((q) => {
                  const hasSubmissions = (q.submissions_count || 0) > 0;

                  return (
                    <tr key={q.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">{q.title}</div>
                        <div className="text-[10px] text-slate-400">
                          {q.questions?.length || 0} Soal
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-semibold text-[10px]">
                          {q.quiz_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        ID #{q.meeting_id}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{q.passing_score}%</td>
                      <td className="py-3 px-4">
                        {hasSubmissions ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[11px] border border-blue-200">
                            {q.submissions_count} Submit
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">0 Submit</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(q)}
                            title={q.is_active ? 'Klik untuk Nonaktifkan Kuis' : 'Klik untuk Aktifkan Kuis'}
                            className={`relative inline-flex items-center h-6 w-24 rounded-full transition-colors duration-200 ease-in-out cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-emerald-500 shadow-2xs ${
                              q.is_active ? 'bg-emerald-600' : 'bg-slate-300'
                            }`}
                          >
                            <span
                              className={`w-full text-[10px] font-bold text-white transition-opacity ${
                                q.is_active ? 'text-left pl-2.5' : 'text-right pr-2 text-slate-700 font-semibold'
                              }`}
                            >
                              {q.is_active ? 'Aktif' : 'Tidak Aktif'}
                            </span>
                            <span
                              className={`absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                                q.is_active ? 'translate-x-[74px]' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEdit(q)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 font-semibold"
                          title="Edit Kuis"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <Link
                          href={`/quizzes/${q.id}`}
                          className="inline-flex items-center px-2 py-1 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold"
                        >
                          Pratinjau
                        </Link>
                        <button
                          onClick={() => handleDeleteQuiz(q.id)}
                          className="p-1 rounded text-rose-600 hover:bg-rose-50"
                          title="Hapus Kuis"
                        >
                          <Trash2 className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Create Quiz with Multiple Questions (Default Draft) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-800">Buat Kuis Evaluasi Validasi Baru</h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Kuis baru akan disimpan dalam status <strong>Draft (Tidak Aktif)</strong> agar dapat ditinjau dan diedit sebelum sesi dimulai.
                </p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateQuiz} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pilih Sesi Meeting *</label>
                  <select
                    value={meetingId}
                    onChange={(e) => setMeetingId(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    {meetings.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title} ({m.meeting_type})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tipe Kuis *</label>
                  <select
                    value={quizType}
                    onChange={(e) => setQuizType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Pre-Validation">Pre-Validation Quiz</option>
                    <option value="Post-Validation">Post-Validation Quiz</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Judul Kuis *</label>
                  <input
                    type="text"
                    required
                    value={quizTitle}
                    onChange={(e) => setQuizTitle(e.target.value)}
                    placeholder="Contoh: Evaluasi Prosedur Uji Presisi & Akurasi"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Passing Score (%) *</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    required
                    value={passingScore}
                    onChange={(e) => setPassingScore(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-4 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                    Daftar Pertanyaan & Kunci Jawaban
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-100"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Soal</span>
                  </button>
                </div>

                {questions.map((q, qIdx) => (
                  <div key={qIdx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-blue-700">Soal #{qIdx + 1}</span>
                      {questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(qIdx)}
                          className="text-rose-600 hover:text-rose-700 font-semibold"
                        >
                          Hapus Soal
                        </button>
                      )}
                    </div>

                    <input
                      type="text"
                      required
                      placeholder="Masukkan teks pertanyaan..."
                      value={q.question_text}
                      onChange={(e) => handleQuestionTextChange(qIdx, e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
                    />

                    {/* Image Attachment (Single Image per Question) */}
                    <div className="pt-1">
                      {q.image_url ? (
                        <div className="relative border border-slate-200 bg-white rounded-lg p-2.5 flex flex-col items-center gap-2">
                          <div className="w-full max-h-48 overflow-hidden rounded bg-slate-100 flex items-center justify-center p-1">
                            <img
                              src={q.image_url}
                              alt="Gambar Soal"
                              className="max-h-44 max-w-full object-contain mx-auto rounded"
                            />
                          </div>
                          <div className="flex items-center justify-between w-full text-[11px] px-1 text-slate-500">
                            <span className="flex items-center gap-1 text-emerald-700 font-medium">
                              <ImageIcon className="w-3.5 h-3.5" /> Gambar terlampir
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveImage('create', qIdx)}
                              className="text-rose-600 hover:text-rose-700 font-medium hover:underline cursor-pointer"
                            >
                              Hapus Gambar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-dashed border-slate-300 hover:border-blue-400 bg-white hover:bg-blue-50/50 rounded-lg text-[11px] font-medium text-slate-600 hover:text-blue-700 cursor-pointer transition-colors">
                            {uploadingImageIndex?.mode === 'create' && uploadingImageIndex?.index === qIdx ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                                <span>Mengupload Gambar...</span>
                              </>
                            ) : (
                              <>
                                <Upload className="w-3.5 h-3.5 text-slate-400" />
                                <span>Upload Gambar Soal (Opsional, 1 gambar)</span>
                              </>
                            )}
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                              className="hidden"
                              disabled={uploadingImageIndex?.mode === 'create' && uploadingImageIndex?.index === qIdx}
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handleImageUpload('create', qIdx, f);
                                e.target.value = '';
                              }}
                            />
                          </label>
                        </div>
                      )}
                    </div>

                    {/* Options list */}
                    <div className="space-y-2 pl-2">
                      <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block">
                        Pilihan Jawaban (Pilih radio button untuk KUNCI JAWABAN BENAR):
                      </span>
                      {q.options.map((opt: any, optIdx: number) => (
                        <div key={optIdx} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`correct_${qIdx}`}
                            checked={opt.is_correct}
                            onChange={() => handleSetCorrect(qIdx, optIdx)}
                            className="w-4 h-4 text-blue-600"
                            title="Tandai sebagai jawaban benar"
                          />
                          <input
                            type="text"
                            required
                            placeholder={`Pilihan ${String.fromCharCode(65 + optIdx)}`}
                            value={opt.option_text}
                            onChange={(e) => handleOptionChange(qIdx, optIdx, e.target.value)}
                            className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan Kuis...' : 'Simpan Kuis (Draft)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Quiz */}
      {showEditModal && editingQuiz && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <span>Edit Kuis Evaluasi</span>
                  {editSubmissionsCount > 0 ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                      <Lock className="w-3 h-3 text-amber-600" />
                      Terkunci ({editSubmissionsCount} Pengerjaan)
                    </span>
                  ) : editIsActive ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <Lock className="w-3 h-3 text-emerald-600" />
                      Sedang Aktif (Nonaktifkan untuk edit soal)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      <Unlock className="w-3 h-3 text-blue-600" />
                      Mode Draft (Full Edit)
                    </span>
                  )}
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  ID Kuis: #{editingQuiz.id} | Meeting ID: #{editingQuiz.meeting_id}
                </p>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              {/* Context Banner */}
              {editSubmissionsCount > 0 ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold">Struktur Soal & Kunci Jawaban Dikunci</div>
                    <div className="text-[11px] text-amber-700 mt-0.5">
                      Kuis ini telah dikerjakan oleh <strong>{editSubmissionsCount} peserta</strong>. Demi menjaga keabsahan nilai, Anda hanya dapat mengubah <strong>Judul</strong>, <strong>Passing Score</strong>, dan <strong>Status Aktif</strong>. Jika Passing Score diubah, status kelulusan peserta yang sudah submit akan otomatis disinkronkan.
                    </div>
                  </div>
                </div>
              ) : editIsActive ? (
                <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-sky-800 flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold">Kuis Berstatus Aktif</div>
                    <div className="text-[11px] text-sky-700 mt-0.5">
                      Untuk mengedit struktur soal, silakan ubah status kuis menjadi <strong>Tidak Aktif</strong> terlebih dahulu lalu simpan.
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold">Mode Draft Terbuka</div>
                    <div className="text-[11px] text-emerald-700 mt-0.5">
                      Kuis belum aktif dan belum ada pengerjaan. Anda dapat mengedit judul, passing score, teks soal, opsi, dan kunci jawaban secara bebas.
                    </div>
                  </div>
                </div>
              )}

              {/* Basic Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tipe Kuis *</label>
                  <select
                    value={editQuizType}
                    onChange={(e) => setEditQuizType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Pre-Validation">Pre-Validation Quiz</option>
                    <option value="Post-Validation">Post-Validation Quiz</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status Kuis</label>
                  <select
                    value={editIsActive ? 'active' : 'inactive'}
                    onChange={(e) => setEditIsActive(e.target.value === 'active')}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500 font-semibold"
                  >
                    <option value="inactive">Tidak Aktif (Draft / Tersembunyi)</option>
                    <option value="active">Aktif (Dapat Dikerjakan Mahasiswa)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Judul Kuis *</label>
                  <input
                    type="text"
                    required
                    value={editQuizTitle}
                    onChange={(e) => setEditQuizTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Passing Score (%) *</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    required
                    value={editPassingScore}
                    onChange={(e) => setEditPassingScore(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 font-semibold text-blue-700"
                  />
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-4 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                      Daftar Pertanyaan & Kunci Jawaban
                    </h3>
                    {editSubmissionsCount > 0 && (
                      <span className="text-[10px] text-slate-400">
                        (Hanya lihat / Read-only karena sudah ada pengerjaan)
                      </span>
                    )}
                  </div>
                  {!editIsActive && editSubmissionsCount === 0 && (
                    <button
                      type="button"
                      onClick={handleAddEditQuestion}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-100"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Soal</span>
                    </button>
                  )}
                </div>

                {editQuestions.map((q, qIdx) => {
                  const isLocked = editSubmissionsCount > 0 || editIsActive;

                  return (
                    <div
                      key={qIdx}
                      className={`p-4 rounded-xl border ${
                        isLocked
                          ? 'border-slate-200 bg-slate-100/70 opacity-90'
                          : 'border-slate-200 bg-slate-50/50'
                      } space-y-3`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-blue-700 flex items-center gap-1.5">
                          <span>Soal #{qIdx + 1}</span>
                          {isLocked && <Lock className="w-3 h-3 text-slate-400" />}
                        </span>
                        {!isLocked && editQuestions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveEditQuestion(qIdx)}
                            className="text-rose-600 hover:text-rose-700 font-semibold"
                          >
                            Hapus Soal
                          </button>
                        )}
                      </div>

                      <input
                        type="text"
                        required
                        disabled={isLocked}
                        placeholder="Masukkan teks pertanyaan..."
                        value={q.question_text}
                        onChange={(e) => handleEditQuestionTextChange(qIdx, e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg text-xs ${
                          isLocked
                            ? 'bg-slate-200/50 border-slate-300 text-slate-700 cursor-not-allowed'
                            : 'bg-white border-slate-200 focus:ring-2 focus:ring-blue-500'
                        }`}
                      />

                      {/* Image Attachment (Single Image per Question) */}
                      <div className="pt-1">
                        {q.image_url ? (
                          <div className="relative border border-slate-200 bg-white rounded-lg p-2.5 flex flex-col items-center gap-2">
                            <div className="w-full max-h-48 overflow-hidden rounded bg-slate-100 flex items-center justify-center p-1">
                              <img
                                src={q.image_url}
                                alt="Gambar Soal"
                                className="max-h-44 max-w-full object-contain mx-auto rounded"
                              />
                            </div>
                            <div className="flex items-center justify-between w-full text-[11px] px-1 text-slate-500">
                              <span className="flex items-center gap-1 text-emerald-700 font-medium">
                                <ImageIcon className="w-3.5 h-3.5" /> Gambar terlampir
                              </span>
                              {!isLocked && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveImage('edit', qIdx)}
                                  className="text-rose-600 hover:text-rose-700 font-medium hover:underline cursor-pointer"
                                >
                                  Hapus Gambar
                                </button>
                              )}
                            </div>
                          </div>
                        ) : !isLocked ? (
                          <div>
                            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-dashed border-slate-300 hover:border-blue-400 bg-white hover:bg-blue-50/50 rounded-lg text-[11px] font-medium text-slate-600 hover:text-blue-700 cursor-pointer transition-colors">
                              {uploadingImageIndex?.mode === 'edit' && uploadingImageIndex?.index === qIdx ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                                  <span>Mengupload Gambar...</span>
                                </>
                              ) : (
                                <>
                                  <Upload className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Upload Gambar Soal (Opsional, 1 gambar)</span>
                                </>
                              )}
                              <input
                                type="file"
                                accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                                className="hidden"
                                disabled={uploadingImageIndex?.mode === 'edit' && uploadingImageIndex?.index === qIdx}
                                onChange={(e) => {
                                  const f = e.target.files?.[0];
                                  if (f) handleImageUpload('edit', qIdx, f);
                                  e.target.value = '';
                                }}
                              />
                            </label>
                          </div>
                        ) : null}
                      </div>

                      {/* Options list */}
                      <div className="space-y-2 pl-2">
                        <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider block">
                          Pilihan Jawaban (Radio button menandai KUNCI JAWABAN BENAR):
                        </span>
                        {q.options.map((opt: any, optIdx: number) => (
                          <div key={optIdx} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`edit_correct_${qIdx}`}
                              checked={opt.is_correct}
                              disabled={isLocked}
                              onChange={() => handleEditSetCorrect(qIdx, optIdx)}
                              className="w-4 h-4 text-blue-600 disabled:cursor-not-allowed"
                              title="Tandai sebagai jawaban benar"
                            />
                            <input
                              type="text"
                              required
                              disabled={isLocked}
                              placeholder={`Pilihan ${String.fromCharCode(65 + optIdx)}`}
                              value={opt.option_text}
                              onChange={(e) => handleEditOptionChange(qIdx, optIdx, e.target.value)}
                              className={`flex-1 px-3 py-1.5 border rounded-lg text-xs ${
                                isLocked
                                  ? 'bg-slate-200/50 border-slate-300 text-slate-700 cursor-not-allowed'
                                  : 'bg-white border-slate-200 focus:ring-2 focus:ring-blue-500'
                              } ${opt.is_correct ? 'font-semibold text-emerald-800' : ''}`}
                            />
                            {opt.is_correct && (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 shrink-0">
                                Kunci Benar
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs disabled:opacity-50"
                >
                  {editSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
