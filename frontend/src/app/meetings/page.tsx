'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  ExternalLink,
  X,
  BookOpen,
  MapPin,
  CheckCircle2,
  CalendarCheck
} from 'lucide-react';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export default function MeetingsCalendarPage() {
  const { isDevelopmentOrAdmin } = useAuth();
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Calendar current view month and year
  const today = new Date();
  const [currentDate, setCurrentDate] = useState<Date>(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );

  // Selected meeting for detail drawer / popup
  const [selectedMeeting, setSelectedMeeting] = useState<any | null>(null);

  // Modal Create Meeting State
  const [showModal, setShowModal] = useState(false);
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
  }, []);

  const fetchMeetings = async () => {
    try {
      const res = await api.get('/meetings');
      setMeetings(res.data);
    } catch (err) {
      console.error('Failed to fetch meetings', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
  };

  // Open create modal with prefilled date from clicked cell
  const handleOpenCreateForDate = async (year: number, month: number, day: number) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    const defaultTime = '09:00';
    const prefilledDateTime = `${year}-${pad(month + 1)}-${pad(day)}T${defaultTime}`;

    setFormData({
      title: '',
      project_name: 'PRE-0001',
      meeting_type: 'Pre-Validation',
      date_time: prefilledDateTime,
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
    try {
      const res = await api.get(`/meetings/next-sharing-id?meeting_type=${encodeURIComponent(newType)}`);
      if (res.data?.next_sharing_id) {
        setFormData((prev) => ({ ...prev, project_name: res.data.next_sharing_id }));
      }
    } catch (err) {
      console.error('Failed to fetch next sharing ID', err);
    }
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

      await api.post('/meetings', payload);
      setShowModal(false);
      fetchMeetings();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Gagal membuat jadwal meeting.');
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate calendar grid days
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // First day of current month (0: Sunday, 1: Monday, ...)
  const firstDayIndex = new Date(year, month, 1).getDay();
  // Total days in current month
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
  // Total days in previous month
  const prevMonthTotalDays = new Date(year, month, 0).getDate();

  // Map meetings by date string 'YYYY-MM-DD'
  const meetingsByDate: { [key: string]: any[] } = {};
  meetings.forEach((m) => {
    if (!m.date_time) return;
    const d = new Date(m.date_time);
    const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (!meetingsByDate[dateKey]) {
      meetingsByDate[dateKey] = [];
    }
    meetingsByDate[dateKey].push(m);
  });

  // Build grid cells (42 cells: 6 rows x 7 cols)
  interface CalendarCell {
    day: number;
    month: number;
    year: number;
    isCurrentMonth: boolean;
    dateKey: string;
    isToday: boolean;
  }

  const calendarCells: CalendarCell[] = [];

  // Trailing days from previous month
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const d = prevMonthTotalDays - i;
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const dateKey = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarCells.push({
      day: d,
      month: prevMonth,
      year: prevYear,
      isCurrentMonth: false,
      dateKey,
      isToday: false
    });
  }

  // Days of current month
  for (let d = 1; d <= totalDaysInMonth; d++) {
    const isToday =
      d === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear();
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarCells.push({
      day: d,
      month,
      year,
      isCurrentMonth: true,
      dateKey,
      isToday
    });
  }

  // Leading days for next month to complete grid up to multiple of 7 (at least 35 or 42 cells)
  const remainingCells = (7 - (calendarCells.length % 7)) % 7;
  const targetTotal = calendarCells.length + remainingCells < 35 ? 35 - calendarCells.length : remainingCells;
  for (let d = 1; d <= targetTotal; d++) {
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    const dateKey = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarCells.push({
      day: d,
      month: nextMonth,
      year: nextYear,
      isCurrentMonth: false,
      dateKey,
      isToday: false
    });
  }

  // Current month's meeting summary count
  const currentMonthMeetingsCount = meetings.filter((m) => {
    if (!m.date_time) return false;
    const d = new Date(m.date_time);
    return d.getMonth() === month && d.getFullYear() === year;
  }).length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl lg:text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2.5">
              <CalendarIcon className="w-6 h-6 text-blue-600" />
              <span>Jadwal Sharing Materi</span>
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Kalender Bulanan
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Visualisasi kalender jadwal sharing transfer knowledge antara Tim Pengembangan dan Tim Rutin
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/all-materials"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <BookOpen className="w-4 h-4 text-slate-500" />
            <span>Katalog Semua Materi</span>
          </Link>

          {isDevelopmentOrAdmin && (
            <button
              onClick={() => handleOpenCreateForDate(year, month, today.getDate())}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Jadwal Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* Calendar Controller Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
            <button
              onClick={handlePrevMonth}
              title="Bulan Sebelumnya"
              className="p-2 hover:bg-slate-50 text-slate-600 transition-colors border-r border-slate-200"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-3 py-1.5 text-xs font-semibold hover:bg-slate-50 text-slate-700 transition-colors"
            >
              Hari Ini
            </button>
            <button
              onClick={handleNextMonth}
              title="Bulan Berikutnya"
              className="p-2 hover:bg-slate-50 text-slate-600 transition-colors border-l border-slate-200"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="text-base lg:text-lg font-bold text-slate-800">
            {MONTH_NAMES[month]} {year}
          </div>
        </div>

        {/* Legend & Stats */}
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span>Pre-Validation</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
            <span>Post-Validation</span>
          </div>
          <div className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-medium">
            Total {currentMonthMeetingsCount} Sesi Bulan Ini
          </div>
        </div>
      </div>

      {/* Calendar Grid Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Day Header Row */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/75 text-center text-xs font-semibold text-slate-600">
          {DAY_NAMES.map((dayName, idx) => (
            <div
              key={dayName}
              className={`py-2.5 ${idx === 0 ? 'text-rose-600' : ''}`}
            >
              {dayName}
            </div>
          ))}
        </div>

        {/* Calendar Days Grid */}
        <div className="grid grid-cols-7 auto-rows-[minmax(110px,1fr)] divide-x divide-y divide-slate-100">
          {calendarCells.map((cell, idx) => {
            const dayMeetings = meetingsByDate[cell.dateKey] || [];
            return (
              <div
                key={cell.dateKey + idx}
                className={`group relative p-1.5 lg:p-2 flex flex-col justify-between transition-colors ${
                  !cell.isCurrentMonth
                    ? 'bg-slate-50/40 text-slate-400'
                    : cell.isToday
                    ? 'bg-blue-50/20'
                    : 'bg-white hover:bg-slate-50/50'
                }`}
              >
                {/* Cell Header: Date Number + Hover Action */}
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`inline-flex items-center justify-center text-xs font-semibold rounded-full w-6 h-6 ${
                      cell.isToday
                        ? 'bg-blue-600 text-white font-bold shadow-xs'
                        : cell.isCurrentMonth
                        ? 'text-slate-800'
                        : 'text-slate-400'
                    }`}
                  >
                    {cell.day}
                  </span>

                  {/* "Buat Jadwal" Button: only shown on mouse hover, allowed for Tim Pengembangan / Admin */}
                  {isDevelopmentOrAdmin && (
                    <button
                      onClick={() => handleOpenCreateForDate(cell.year, cell.month, cell.day)}
                      title={`Buat Jadwal pada ${cell.day} ${MONTH_NAMES[cell.month]} ${cell.year}`}
                      className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-medium shadow-xs"
                    >
                      <Plus className="w-3 h-3" />
                      <span className="hidden xl:inline">Buat Jadwal</span>
                    </button>
                  )}
                </div>

                {/* Meetings in this day */}
                <div className="flex-1 space-y-1 overflow-y-auto max-h-[90px] pr-0.5">
                  {dayMeetings.map((m) => {
                    const isPre = m.meeting_type === 'Pre-Validation';
                    const timeStr = new Date(m.date_time).toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit'
                    });
                    return (
                      <button
                        key={m.id}
                        onClick={() => setSelectedMeeting(m)}
                        title={`${m.title} (${timeStr} WIB)`}
                        className={`w-full text-left px-2 py-1 rounded-md text-[11px] leading-tight font-medium transition-all flex flex-col gap-0.5 truncate border ${
                          isPre
                            ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200/80'
                            : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border-indigo-200/80'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-[10px] text-slate-600 flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {timeStr}
                          </span>
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              isPre ? 'bg-amber-500' : 'bg-indigo-500'
                            }`}
                          />
                        </div>
                        <div className="truncate font-semibold">{m.title}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Meeting Details Modal / Drawer */}
      {selectedMeeting && (
        <div
          onClick={() => setSelectedMeeting(null)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-in fade-in duration-200 cursor-default"
          >
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    selectedMeeting.meeting_type === 'Pre-Validation'
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : selectedMeeting.meeting_type === 'Post-Validation'
                      ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                      : selectedMeeting.meeting_type === 'Sosialisasi'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-purple-50 text-purple-800 border-purple-200'
                  }`}
                >
                  {selectedMeeting.meeting_type}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  {selectedMeeting.project_name}
                </span>
              </div>
              <button
                onClick={() => setSelectedMeeting(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  {selectedMeeting.title}
                </h3>
                <p className="text-slate-500 mt-1 leading-relaxed">
                  {selectedMeeting.description || 'Tidak ada catatan deskripsi tambahan untuk sesi ini.'}
                </p>
              </div>

              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 space-y-2">
                <div className="flex items-center gap-2 text-slate-700">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold">
                    {selectedMeeting.location || 'Virtual Meeting'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <CalendarIcon className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="font-semibold">
                    {new Date(selectedMeeting.date_time).toLocaleDateString('id-ID', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Pukul{' '}
                    {new Date(selectedMeeting.date_time).toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}{' '}
                    WIB
                  </span>
                </div>
                {selectedMeeting.meeting_url && (
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60">
                    <ExternalLink className="w-4 h-4 text-indigo-600 shrink-0" />
                    <a
                      href={selectedMeeting.meeting_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline truncate"
                    >
                      {selectedMeeting.meeting_url}
                    </a>
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                {selectedMeeting.meeting_url && (
                  <a
                    href={selectedMeeting.meeting_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 sm:flex-none justify-center px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Gabung Virtual Meet</span>
                  </a>
                )}
                <Link
                  href={`/meetings/${selectedMeeting.id}`}
                  className="flex-1 sm:flex-none justify-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <span>Buka Ruang Belajar & Materi</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Create Meeting (From Calendar Cell Hover) */}
      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-in fade-in duration-200 cursor-default"
          >
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-800">
                  Buat Jadwal Meeting Baru
                </h2>
              </div>
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
                  Judul Sesi Meeting *
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
                    readOnly
                    value={formData.project_name}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-100/80 font-bold text-blue-700 cursor-not-allowed select-all"
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
                  Link Meeting Virtual (Google Meet / Zoom)
                </label>
                <input
                  type="url"
                  value={formData.meeting_url}
                  onChange={(e) => setFormData({ ...formData, meeting_url: e.target.value })}
                  placeholder="https://meet.google.com/xyz-abcd-efg"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Deskripsi / Poin Bahasan
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
                  {submitting ? 'Menyimpan...' : 'Simpan Jadwal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
