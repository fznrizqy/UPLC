'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import {
  CalendarCheck,
  Search,
  Users,
  ExternalLink,
  Calendar,
  Clock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Award,
  BookOpen,
  Download,
  FileDown
} from 'lucide-react';
import { exportAttendancePdf } from '@/lib/attendancePdf';

export default function AdminAttendancesPage() {
  const { isDevelopmentOrAdmin } = useAuth();
  const [attendances, setAttendances] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Track open accordion IDs (Set of meeting IDs)
  const [openMeetingIds, setOpenMeetingIds] = useState<number[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [resAtt, resMeetings] = await Promise.all([
        api.get('/meetings/attendances/all'),
        api.get('/meetings')
      ]);
      setAttendances(resAtt.data);
      setMeetings(resMeetings.data);
      
      // Default: tutup semua akordeon saat halaman dibuka
      setOpenMeetingIds([]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleAccordion = (meetingId: number) => {
    setOpenMeetingIds((prev) =>
      prev.includes(meetingId)
        ? prev.filter((id) => id !== meetingId)
        : [...prev, meetingId]
    );
  };

  const toggleAll = (expand: boolean) => {
    if (expand) {
      setOpenMeetingIds(meetings.map((m) => m.id));
    } else {
      setOpenMeetingIds([]);
    }
  };

  // Group attendances by meeting
  const groupedData = meetings.map((m, idx) => {
    const list = attendances.filter((att) => att.meeting_id === m.id);
    return {
      index: idx + 1,
      meeting: m,
      attendances: list
    };
  });

  // Filter grouped data by search term
  const filteredGroups = groupedData.filter((group) => {
    const term = search.toLowerCase();
    if (!term) return true;

    const m = group.meeting;
    const titleMatch = (m.title || '').toLowerCase().includes(term);
    const idSharingMatch = (m.project_name || '').toLowerCase().includes(term);
    const typeMatch = (m.meeting_type || '').toLowerCase().includes(term);
    
    // Check if any participant matches
    const hasParticipantMatch = group.attendances.some((att) => {
      const u = att.user;
      return (
        (u?.display_name || '').toLowerCase().includes(term) ||
        (u?.username || '').toLowerCase().includes(term) ||
        (u?.role || '').toLowerCase().includes(term)
      );
    });

    return titleMatch || idSharingMatch || typeMatch || hasParticipantMatch;
  });

  if (!isDevelopmentOrAdmin) {
    return <div className="p-8 text-rose-600 font-bold text-center">Akses Ditolak: Khusus Tim Pengembangan dan Admin.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2.5">
            <CalendarCheck className="w-6 h-6 text-emerald-600" />
            <span>Daftar Hadir Sesi Sharing</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Rekapitulasi kehadiran peserta yang dikelompokkan berdasarkan setiap sesi sharing validasi metode
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold flex items-center gap-1.5 shadow-2xs">
            <Users className="w-4 h-4 text-emerald-600" />
            <span>Total Kehadiran: {attendances.length} Log Personel</span>
          </div>
        </div>
      </div>

      {/* Filter & Controller Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari ID sharing, judul, nama analis, inisial..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none focus:bg-white"
          />
        </div>

        {/* Accordion Expand/Collapse All */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={() => toggleAll(true)}
            className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors"
          >
            Buka Semua
          </button>
          <button
            type="button"
            onClick={() => toggleAll(false)}
            className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors"
          >
            Tutup Semua
          </button>
        </div>
      </div>

      {/* Main Accordion Grouped Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            {/* Table Header with soft green background inspired by the reference screenshot */}
            <thead className="bg-[#EBF7EE] border-b border-emerald-200 text-[#1B5E20] font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th className="py-3.5 px-4 w-32">ID Sharing</th>
                <th className="py-3.5 px-4 min-w-[240px]">Judul Sesi Sharing</th>
                <th className="py-3.5 px-4 w-36">Tipe Sharing</th>
                <th className="py-3.5 px-4 w-44">Jadwal Sesi</th>
                <th className="py-3.5 px-4 w-36 text-center">Total Hadir</th>
                <th className="py-3.5 px-4 w-28 text-right">Detail</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Memuat data daftar hadir...
                  </td>
                </tr>
              ) : filteredGroups.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    {search ? 'Tidak ada sesi sharing yang cocok dengan pencarian.' : 'Belum ada sesi sharing yang tersedia.'}
                  </td>
                </tr>
              ) : (
                filteredGroups.map((group) => {
                  const m = group.meeting;
                  const isOpen = openMeetingIds.includes(m.id);
                  const count = group.attendances.length;

                  return (
                    <React.Fragment key={m.id}>
                      {/* Parent Row (Sharing Summary Header) */}
                      <tr
                        onClick={() => toggleAccordion(m.id)}
                        className={`transition-colors cursor-pointer select-none ${
                          isOpen ? 'bg-slate-50/90 font-medium' : 'hover:bg-slate-50/60'
                        }`}
                      >
                        <td className="py-3.5 px-4 text-center font-bold text-slate-500">
                          {group.index}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                          {m.project_name}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-800 text-xs">{m.title}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-full font-semibold text-[10px] border ${
                            m.meeting_type === 'Pre-Validation'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : m.meeting_type === 'Post-Validation'
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                              : m.meeting_type === 'Sosialisasi'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-purple-50 text-purple-700 border-purple-200'
                          }`}>
                            {m.meeting_type}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          <div className="flex items-center gap-1 font-medium">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>
                              {new Date(m.date_time).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 ml-4.5">
                            {new Date(m.date_time).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}{' '}
                            WIB
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              count > 0
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            <Users className="w-3 h-3" />
                            <span>{count} Orang</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5 text-blue-600 font-semibold text-[11px]">
                            <span>{isOpen ? 'Tutup' : 'Lihat'}</span>
                            {isOpen ? (
                              <ChevronUp className="w-4 h-4 text-blue-600" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Accordion Expanded Detail: List of Attendances */}
                      {isOpen && (
                        <tr className="bg-[#F8FAFC]">
                          <td colSpan={7} className="p-0 border-b border-slate-200">
                            <div className="p-4 sm:p-6 border-l-4 border-blue-600 space-y-3 animate-in fade-in duration-200">
                              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                                <div className="flex items-center gap-2">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                  <span className="font-bold text-slate-800 text-xs">
                                    Daftar Personel Hadir ({count} Orang)
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {/* Tombol Export Daftar Hadir PDF */}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      exportAttendancePdf(m, group.attendances);
                                    }}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
                                    title="Unduh laporan resmi daftar hadir dalam format PDF"
                                  >
                                    <FileDown className="w-3.5 h-3.5" />
                                    <span>Export Daftar Hadir</span>
                                  </button>

                                  <Link
                                    href={`/meetings/${m.id}`}
                                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 hover:underline px-2 py-1"
                                  >
                                    <span>Buka Halaman Sharing</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </Link>
                                </div>
                              </div>

                              {count === 0 ? (
                                <div className="py-6 text-center text-slate-400 text-xs bg-white rounded-lg border border-dashed border-slate-200">
                                  Belum ada personel yang mengonfirmasi kehadiran untuk sesi sharing ini.
                                </div>
                              ) : (
                                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
                                  <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                                      <tr>
                                        <th className="py-2.5 px-3 w-10 text-center">No</th>
                                        <th className="py-2.5 px-4">Nama Lengkap</th>
                                        <th className="py-2.5 px-4">Jabatan</th>
                                        <th className="py-2.5 px-4 text-right">Waktu Hadir</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-700">
                                      {group.attendances.map((att, attIdx) => {
                                        const u = att.user;
                                        return (
                                          <tr key={att.id} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="py-2.5 px-3 text-center text-slate-400 font-medium">
                                              {attIdx + 1}
                                            </td>
                                            <td className="py-2.5 px-4 font-bold text-slate-800">
                                              {u?.display_name || '-'}
                                            </td>
                                            <td className="py-2.5 px-4">
                                              {u?.position ? (
                                                <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px] border border-slate-200">
                                                  {u.position}
                                                </span>
                                              ) : (
                                                <span className="text-slate-400 italic text-[11px]">-</span>
                                              )}
                                            </td>
                                            <td className="py-2.5 px-4 text-right text-slate-600 font-medium">
                                              <span className="text-slate-700">
                                                {new Date(att.attended_at).toLocaleDateString('id-ID', {
                                                  day: 'numeric',
                                                  month: 'short',
                                                  year: 'numeric'
                                                })}
                                              </span>
                                              <span className="text-slate-400 text-[10px] ml-1.5">
                                                {new Date(att.attended_at).toLocaleTimeString('id-ID', {
                                                  hour: '2-digit',
                                                  minute: '2-digit'
                                                })}{' '}
                                                WIB
                                              </span>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
