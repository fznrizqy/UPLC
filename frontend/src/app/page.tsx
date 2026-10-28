'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import {
  Calendar,
  FileText,
  Video,
  Award,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  FileCheck2,
  PlayCircle
} from 'lucide-react';

interface Stats {
  total_meetings: number;
  upcoming_meetings_count: number;
  total_materials: number;
  total_recordings: number;
  total_quizzes: number;
  user_completed_quizzes: number;
  user_passed_quizzes: number;
  upcoming_meetings: any[];
  recent_materials: any[];
  recent_recordings: any[];
  recent_user_results: any[];
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/dashboard/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Failed to load dashboard stats', err);
    } finally {
      setLoading(false);
    }
  };

  const passRate = stats && stats.user_completed_quizzes > 0
    ? Math.round((stats.user_passed_quizzes / stats.user_completed_quizzes) * 100)
    : 100;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Welcome Banner inspired by screenshot */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 lg:p-7 shadow-xs border border-slate-200/80 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6">
        <div className="z-10 max-w-xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] sm:text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
              Periode Validasi Metode 2026
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-800 tracking-tight">
            Selamat datang, <span className="text-blue-600">{user?.display_name || 'Rekan Lab'}</span>!
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
            Ringkasan transfer knowledge Tim Pengembangan ke Tim Rutin: Meeting Pre/Post-Validation, materi presentasi, rekaman video, dan kuis evaluasi pemahaman metode.
          </p>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-4">
            <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-[11px] sm:text-xs font-medium text-slate-700">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span>{stats?.upcoming_meetings_count || 0} Jadwal Terdekat</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-[11px] sm:text-xs font-medium text-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>{stats?.user_completed_quizzes || 0} Kuis Selesai</span>
            </div>
          </div>
        </div>

        {/* Decorative graphic banner block */}
        <div className="hidden lg:flex items-center justify-center p-6 bg-linear-to-br from-blue-50 to-indigo-50 border border-blue-100/60 rounded-xl text-center min-w-[240px]">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Status Kelulusan Kuis</div>
            <div className="text-3xl font-extrabold text-blue-600">{passRate}%</div>
            <div className="text-xs text-slate-500 mt-1">
              {stats?.user_passed_quizzes || 0} dari {stats?.user_completed_quizzes || 0} Kuis Lulus
            </div>
          </div>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 stagger-child">
        <div className="bg-white rounded-xl p-3.5 sm:p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5 sm:mb-2">
            <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wider">Total Meeting</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-800">{stats?.total_meetings || 0}</div>
          <div className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">Pre & Post-Validation</div>
        </div>

        <div className="bg-white rounded-xl p-3.5 sm:p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5 sm:mb-2">
            <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wider">Materi Lab</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-800">{stats?.total_materials || 0}</div>
          <div className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">PDF & Dokumen</div>
        </div>

        <div className="bg-white rounded-xl p-3.5 sm:p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5 sm:mb-2">
            <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wider">Video</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Video className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-800">{stats?.total_recordings || 0}</div>
          <div className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">Streaming Rekaman</div>
        </div>

        <div className="bg-white rounded-xl p-3.5 sm:p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5 sm:mb-2">
            <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wider">Kuis Aktif</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-800">{stats?.total_quizzes || 0}</div>
          <div className="text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">Evaluasi Pemahaman</div>
        </div>
      </div>

      {/* Progress Bar inspired by screenshot */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm font-bold text-slate-800">Progres Kelulusan Kuis Mandiri</div>
            <div className="text-xs text-slate-500">Evaluasi pemahaman metode validasi untuk Tim Rutin</div>
          </div>
          <Link href="/results" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
            <span>Buka Detail Riwayat</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
          <div
            className="bg-emerald-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(passRate, 100)}%` }}
          ></div>
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
          <span className="font-semibold text-emerald-600">{passRate}% Lulus</span>
          <span>{stats?.user_passed_quizzes || 0} dari {stats?.user_completed_quizzes || 0} kuis terselesaikan</span>
        </div>
      </div>

      {/* Upcoming Meetings & Quick Access Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Upcoming Meetings (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-800">Jadwal Meeting Terdekat</h2>
              <p className="text-xs text-slate-500">Sesi Pre-Validation dan Post-Validation metode Tim Pengembangan</p>
            </div>
            <Link
              href="/meetings"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>Semua Meeting</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {stats?.upcoming_meetings && stats.upcoming_meetings.length > 0 ? (
              stats.upcoming_meetings.map((meeting) => (
                <div key={meeting.id} className="py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/50 px-2 rounded-lg transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex flex-col items-center justify-center shrink-0 border border-blue-100">
                      <span className="text-[10px] uppercase font-bold">
                        {new Date(meeting.date_time).toLocaleDateString('id-ID', { month: 'short' })}
                      </span>
                      <span className="text-sm font-bold leading-none">
                        {new Date(meeting.date_time).getDate()}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          meeting.meeting_type === 'Pre-Validation'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        }`}>
                          {meeting.meeting_type}
                        </span>
                        <span className="text-xs font-medium text-slate-400">
                          {meeting.project_name}
                        </span>
                      </div>
                      <Link href={`/meetings/${meeting.id}`} className="text-sm font-bold text-slate-800 hover:text-blue-600 transition-colors block mt-0.5">
                        {meeting.title}
                      </Link>
                      <div className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>
                          {new Date(meeting.date_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {meeting.meeting_url && (
                      <a
                        href={meeting.meeting_url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-lg bg-slate-50 hover:bg-blue-50 text-blue-600 border border-slate-200 transition-colors"
                        title="Buka Link Meeting"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                    <Link
                      href={`/meetings/${meeting.id}`}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                    >
                      Detail
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                Belum ada jadwal meeting mendatang.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Recent Materials & Recordings */}
        <div className="space-y-6">
          {/* Recent Materials */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-emerald-600" />
                <span>Materi Terkini</span>
              </h3>
              <Link href="/materials" className="text-xs font-semibold text-blue-600 hover:underline">
                Lihat Semua
              </Link>
            </div>
            <div className="space-y-2.5">
              {stats?.recent_materials && stats.recent_materials.length > 0 ? (
                stats.recent_materials.slice(0, 3).map((file) => (
                  <div key={file.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                    <div className="truncate mr-2">
                      <div className="font-semibold text-slate-800 truncate">{file.original_filename}</div>
                      <div className="text-[10px] text-slate-400">{(file.file_size / 1024 / 1024).toFixed(1)} MB</div>
                    </div>
                    <Link
                      href={`/materials`}
                      className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded text-[11px] font-medium text-blue-600 shrink-0"
                    >
                      Buka
                    </Link>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 py-3 text-center">Belum ada materi diunggah.</div>
              )}
            </div>
          </div>

          {/* Recent Recordings */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <PlayCircle className="w-4 h-4 text-indigo-600" />
                <span>Rekaman Terbaru</span>
              </h3>
              <Link href="/recordings" className="text-xs font-semibold text-blue-600 hover:underline">
                Lihat Semua
              </Link>
            </div>
            <div className="space-y-2.5">
              {stats?.recent_recordings && stats.recent_recordings.length > 0 ? (
                stats.recent_recordings.slice(0, 3).map((rec) => (
                  <div key={rec.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                    <div className="truncate mr-2">
                      <div className="font-semibold text-slate-800 truncate">{rec.title}</div>
                      <div className="text-[10px] text-slate-400">{(rec.file_size / 1024 / 1024).toFixed(1)} MB</div>
                    </div>
                    <Link
                      href={`/recordings`}
                      className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded text-[11px] font-medium text-indigo-600 shrink-0"
                    >
                      Tonton
                    </Link>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 py-3 text-center">Belum ada video rekaman.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
