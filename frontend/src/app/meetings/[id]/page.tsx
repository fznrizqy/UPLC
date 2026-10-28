'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import api, { getApiBaseUrl } from '@/lib/api';
import {
  Calendar,
  Clock,
  ExternalLink,
  FileText,
  Video,
  Upload,
  Download,
  Eye,
  Trash2,
  ClipboardList,
  CheckCircle,
  Play,
  ArrowLeft,
  X,
  AlertCircle,
  UserCheck,
  Check,
  MapPin
} from 'lucide-react';
import PptxPreviewModal from '@/components/PptxPreviewModal';

export default function MeetingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const meetingId = resolvedParams.id;
  const { isDevelopmentOrAdmin, token } = useAuth();

  const [meeting, setMeeting] = useState<any>(null);
  const [myResults, setMyResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Upload modal states
  const [showFileUploadModal, setShowFileUploadModal] = useState(false);
  const [uploadFileObj, setUploadFileObj] = useState<File | null>(null);
  const [fileDesc, setFileDesc] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);

  const [showVideoUploadModal, setShowVideoUploadModal] = useState(false);
  const [uploadVideoObj, setUploadVideoObj] = useState<File | null>(null);
  const [videoTitle, setVideoTitle] = useState('');
  const [uploadingVideo, setUploadingVideo] = useState(false);

  // Active playing video modal
  const [activeVideo, setActiveVideo] = useState<any>(null);
  // Active PDF preview modal
  const [activePdfUrl, setActivePdfUrl] = useState<string | null>(null);
  // Active PPTX preview modal
  const [activePptxFile, setActivePptxFile] = useState<any | null>(null);

  // Attendance state
  const [attending, setAttending] = useState(false);
  const [attendSuccessMessage, setAttendSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchMeetingDetail();
  }, [meetingId]);

  const fetchMeetingDetail = async () => {
    try {
      const [resMeeting, resResults] = await Promise.all([
        api.get(`/meetings/${meetingId}`),
        api.get('/results/my-results')
      ]);
      setMeeting(resMeeting.data);
      setMyResults(resResults.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAttendance = async () => {
    setAttending(true);
    try {
      const res = await api.post(`/meetings/${meetingId}/attend`);
      setMeeting((prev: any) => ({
        ...prev,
        is_attended_by_me: true,
        attendances_count: (prev.attendances_count || 0) + 1
      }));
      setAttendSuccessMessage('Kehadiran Anda berhasil dikonfirmasi!');
      setTimeout(() => setAttendSuccessMessage(null), 4000);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Gagal mengonfirmasi kehadiran');
    } finally {
      setAttending(false);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFileObj) return;

    setUploadingFile(true);
    const formData = new FormData();
    formData.append('meeting_id', meetingId);
    formData.append('file', uploadFileObj);
    if (fileDesc) formData.append('description', fileDesc);

    try {
      await api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setShowFileUploadModal(false);
      setUploadFileObj(null);
      setFileDesc('');
      fetchMeetingDetail();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Gagal mengunggah file materi.');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleVideoUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadVideoObj || !videoTitle) return;

    setUploadingVideo(true);
    const formData = new FormData();
    formData.append('meeting_id', meetingId);
    formData.append('title', videoTitle);
    formData.append('file', uploadVideoObj);

    try {
      await api.post('/recordings/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setShowVideoUploadModal(false);
      setUploadVideoObj(null);
      setVideoTitle('');
      fetchMeetingDetail();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Gagal mengunggah rekaman video.');
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleDeleteFile = async (fileId: number) => {
    if (!confirm('Hapus file materi ini?')) return;
    try {
      await api.delete(`/files/${fileId}`);
      fetchMeetingDetail();
    } catch (err) {
      alert('Gagal menghapus file');
    }
  };

  const handleDeleteVideo = async (videoId: number) => {
    if (!confirm('Hapus rekaman video ini?')) return;
    try {
      await api.delete(`/recordings/${videoId}`);
      fetchMeetingDetail();
    } catch (err) {
      alert('Gagal menghapus video');
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-xs text-slate-400">Memuat detail ruang belajar...</div>;
  }

  if (!meeting) {
    return <div className="py-12 text-center text-xs text-rose-500">Meeting tidak ditemukan.</div>;
  }

  const apiBase = getApiBaseUrl();

  return (
    <div className="space-y-6">
      {/* Back button & Title */}
      <div className="flex items-center gap-3">
        <Link
          href="/meetings"
          className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              meeting.meeting_type === 'Pre-Validation'
                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                : meeting.meeting_type === 'Post-Validation'
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                : meeting.meeting_type === 'Sosialisasi'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-purple-50 text-purple-700 border border-purple-200'
            }`}>
              {meeting.meeting_type}
            </span>
            <span className="text-xs font-semibold text-slate-500">{meeting.project_name}</span>
          </div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-800 tracking-tight mt-0.5">
            {meeting.title}
          </h1>
        </div>
      </div>

      {/* Main meeting detail card */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold text-slate-800">
              {meeting.location || 'Virtual Meeting'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-slate-800">
              {new Date(meeting.date_time).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="font-semibold text-slate-800">
              {new Date(meeting.date_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
            </span>
          </div>

          {/* Action buttons (Konfirmasi Hadir & Gabung Meeting Online) */}
          <div className="ml-auto flex items-center gap-2.5">
            {/* Tombol Konfirmasi Hadir */}
            {(() => {
              if (meeting.is_attended_by_me) {
                return (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 text-xs">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Sudah Konfirmasi Hadir</span>
                  </span>
                );
              }

              // Validasi apakah sesi sharing belum tiba harinya (sebelum tanggal sharing)
              const meetingDate = new Date(meeting.date_time);
              meetingDate.setHours(0, 0, 0, 0);

              const todayDate = new Date();
              todayDate.setHours(0, 0, 0, 0);

              const isUpcoming = todayDate.getTime() < meetingDate.getTime();

              if (isUpcoming) {
                const formattedDate = new Date(meeting.date_time).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                });

                return (
                  <button
                    type="button"
                    disabled
                    title={`Konfirmasi hadir belum dibuka. Dapat dikonfirmasi mulai ${formattedDate}.`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-400 border border-slate-200 font-semibold text-xs cursor-not-allowed select-none"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Konfirmasi Hadir (Belum Dibuka)</span>
                  </button>
                );
              }

              return (
                <button
                  type="button"
                  onClick={handleConfirmAttendance}
                  disabled={attending}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-60"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>{attending ? 'Menyimpan...' : 'Konfirmasi Hadir'}</span>
                </button>
              );
            })()}

            {meeting.meeting_url && (
              <a
                href={meeting.meeting_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200 hover:bg-blue-100 transition-colors text-xs"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Gabung Meeting Online</span>
              </a>
            )}
          </div>
        </div>

        {attendSuccessMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{attendSuccessMessage}</span>
          </div>
        )}

        {meeting.description && (
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-700 leading-relaxed">
            <div className="font-semibold text-slate-800 mb-1">Agenda / Rincian Validasi:</div>
            {meeting.description}
          </div>
        )}
      </div>

      {/* Grid: 1. Materials, 2. Recordings, 3. Quizzes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Section A: Learning Materials */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Materi & Dokumen Validasi</span>
              </h3>
              {isDevelopmentOrAdmin && (
                <button
                  onClick={() => setShowFileUploadModal(true)}
                  className="p-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors text-xs font-semibold flex items-center gap-1 px-2"
                >
                  <Upload className="w-3 h-3" />
                  <span>Upload</span>
                </button>
              )}
            </div>

            <div className="space-y-2.5">
              {meeting.learning_files && meeting.learning_files.length > 0 ? (
                meeting.learning_files.map((file: any) => {
                  const lowerName = file.original_filename.toLowerCase();
                  const isPdf = lowerName.endsWith('.pdf');
                  const isPptx = lowerName.endsWith('.pptx') || lowerName.endsWith('.ppt');
                  return (
                    <div
                      key={file.id}
                      className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-white transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-slate-800 truncate" title={file.original_filename}>
                            {file.original_filename}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {(file.file_size / 1024 / 1024).toFixed(2)} MB &bull; {new Date(file.created_at).toLocaleDateString('id-ID')}
                          </div>
                          {file.description && (
                            <div className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                              {file.description}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {isPdf && (
                            <button
                              onClick={() => setActivePdfUrl(`${apiBase}/files/${file.id}/preview?token=${token}`)}
                              className="p-1.5 rounded text-blue-600 hover:bg-blue-50"
                              title="Preview PDF"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {isPptx && (
                            <button
                              onClick={() => setActivePptxFile(file)}
                              className="p-1.5 rounded text-amber-600 hover:bg-amber-50"
                              title="Preview Presentasi PPTX"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <a
                            href={`${apiBase}/files/${file.id}/download?token=${token}`}
                            download
                            className="p-1.5 rounded text-slate-600 hover:bg-slate-100"
                            title="Download File"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                          {isDevelopmentOrAdmin && (
                            <button
                              onClick={() => handleDeleteFile(file.id)}
                              className="p-1.5 rounded text-rose-600 hover:bg-rose-50"
                              title="Hapus File"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  Belum ada dokumen materi untuk meeting ini.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section B: Meeting Recordings */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Video className="w-4 h-4 text-indigo-600" />
                <span>Rekaman Sesi Meeting</span>
              </h3>
              {isDevelopmentOrAdmin && (
                <button
                  onClick={() => setShowVideoUploadModal(true)}
                  className="p-1 rounded bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors text-xs font-semibold flex items-center gap-1 px-2"
                >
                  <Upload className="w-3 h-3" />
                  <span>Upload Video</span>
                </button>
              )}
            </div>

            <div className="space-y-2.5">
              {meeting.recordings && meeting.recordings.length > 0 ? (
                meeting.recordings.map((rec: any) => (
                  <div
                    key={rec.id}
                    className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-white transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-800 truncate" title={rec.title}>
                          {rec.title}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {(rec.file_size / 1024 / 1024).toFixed(1)} MB &bull; {new Date(rec.created_at).toLocaleDateString('id-ID')}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => setActiveVideo(rec)}
                          className="px-2.5 py-1 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1 transition-colors"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Putar</span>
                        </button>
                        {isDevelopmentOrAdmin && (
                          <button
                            onClick={() => handleDeleteVideo(rec.id)}
                            className="p-1.5 rounded text-rose-600 hover:bg-rose-50"
                            title="Hapus Video"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  Belum ada rekaman video diunggah.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section C: Evaluation Quizzes */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-amber-600" />
                <span>Kuis Evaluasi Terkait</span>
              </h3>
              {isDevelopmentOrAdmin && (
                <Link
                  href="/admin/quizzes"
                  className="p-1 rounded bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors text-xs font-semibold flex items-center gap-1 px-2"
                >
                  <span>Kelola Kuis</span>
                </Link>
              )}
            </div>

            <div className="space-y-2.5">
              {meeting.quizzes && meeting.quizzes.length > 0 ? (
                meeting.quizzes.map((quiz: any) => {
                  const userResult = myResults.find((r) => r.quiz_id === quiz.id);
                  const isFinished = !!userResult;

                  return (
                    <div
                      key={quiz.id}
                      className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-white transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                              {quiz.quiz_type}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              Passing Grade: {quiz.passing_score}%
                            </span>
                            {!quiz.is_active && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                                Draft / Belum Aktif
                              </span>
                            )}
                            {isFinished && (
                              <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                                userResult.passed
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}>
                                <CheckCircle className="w-3 h-3 text-emerald-600" />
                                <span>Sudah Dikerjakan (Nilai: {userResult.score}%)</span>
                              </span>
                            )}
                          </div>
                          <div className="text-xs font-bold text-slate-800">{quiz.title}</div>
                        </div>

                        {!quiz.is_active ? (
                          <div className="flex items-center gap-1.5 shrink-0">
                            {isDevelopmentOrAdmin && (
                              <Link
                                href="/admin/quizzes"
                                className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold transition-colors"
                              >
                                Aktifkan di Admin
                              </Link>
                            )}
                            <button
                              disabled
                              title="Kuis ini belum diaktifkan oleh Tim Pengembangan"
                              className="px-3 py-1.5 rounded-lg bg-slate-200 text-slate-400 text-xs font-semibold cursor-not-allowed"
                            >
                              Belum Aktif
                            </button>
                          </div>
                        ) : !isFinished ? (
                          <Link
                            href={`/quizzes/${quiz.id}`}
                            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shrink-0 transition-colors"
                          >
                            Mulai Kuis
                          </Link>
                        ) : (
                          <Link
                            href="/results"
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium shrink-0 transition-colors"
                          >
                            Lihat Hasil
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  Belum ada kuis evaluasi untuk meeting ini.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Video Streaming Player Modal */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl border border-slate-800">
            <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between text-white">
              <div className="font-bold text-sm truncate mr-4">{activeVideo.title}</div>
              <button
                onClick={() => setActiveVideo(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-2 bg-black flex items-center justify-center">
              <video
                controls
                autoPlay
                className="w-full max-h-[70vh] rounded-lg"
                src={`${apiBase}/recordings/${activeVideo.id}/stream?token=${token}`}
              >
                Browser Anda tidak mendukung tag video HTML5.
              </video>
            </div>
          </div>
        </div>
      )}

      {/* PDF In-Browser Preview Modal */}
      {activePdfUrl && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-5xl w-full h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="font-bold text-sm text-slate-800">Preview Dokumen Validasi</div>
              <div className="flex items-center gap-2">
                <a
                  href={activePdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold px-2 py-1 bg-blue-50 hover:bg-blue-100 rounded"
                >
                  Buka di Tab Baru
                </a>
                <button
                  onClick={() => setActivePdfUrl(null)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-slate-100">
              <object
                data={activePdfUrl}
                type="application/pdf"
                className="w-full h-full"
              >
                <iframe src={activePdfUrl} className="w-full h-full border-none">
                  <div className="p-4 text-center text-xs text-slate-600">
                    Browser Anda tidak dapat menampilkan pratinjau PDF langsung.{' '}
                    <a href={activePdfUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                      Klik di sini untuk membuka di tab baru.
                    </a>
                  </div>
                </iframe>
              </object>
            </div>
          </div>
        </div>
      )}

      {/* Modal Upload File */}
      {showFileUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-800">Upload Materi Validasi</h3>
              <button onClick={() => setShowFileUploadModal(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleFileUpload} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Pilih Dokumen (PDF, PPT, PPTX) *
                </label>
                <input
                  type="file"
                  required
                  accept=".pdf,.ppt,.pptx"
                  onChange={(e) => setUploadFileObj(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Keterangan Singkat (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={fileDesc}
                  onChange={(e) => setFileDesc(e.target.value)}
                  placeholder="Contoh: Protokol validasi penetapan kadar zat aktif..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowFileUploadModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={uploadingFile}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 text-white font-semibold disabled:opacity-50"
                >
                  {uploadingFile ? 'Mengunggah...' : 'Upload File'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Upload Video */}
      {showVideoUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-800">Upload Rekaman Video</h3>
              <button onClick={() => setShowVideoUploadModal(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleVideoUpload} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Judul Rekaman *
                </label>
                <input
                  type="text"
                  required
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  placeholder="Contoh: Rekaman Sesi Diskusi HPLC Prep"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Pilih File Video (MP4, WebM, MKV) *
                </label>
                <input
                  type="file"
                  required
                  accept="video/*"
                  onChange={(e) => setUploadVideoObj(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                <p className="text-[10px] text-slate-400 mt-1">Dukungan video streaming lokal hingga 2GB.</p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowVideoUploadModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={uploadingVideo}
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold disabled:opacity-50"
                >
                  {uploadingVideo ? 'Mengunggah...' : 'Upload Video'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PPTX Preview Modal */}
      {activePptxFile && (
        <PptxPreviewModal
          fileUrl={`${apiBase}/files/${activePptxFile.id}/preview?token=${token}`}
          fileName={activePptxFile.original_filename}
          downloadUrl={`${apiBase}/files/${activePptxFile.id}/download?token=${token}`}
          onClose={() => setActivePptxFile(null)}
        />
      )}
    </div>
  );
}
