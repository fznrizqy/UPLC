'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api, { getApiBaseUrl } from '@/lib/api';
import { Award, Download, CheckCircle2, XCircle, Search, Filter } from 'lucide-react';

export default function AdminResultsPage() {
  const { isDevelopmentOrAdmin, token } = useAuth();
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      const res = await api.get('/results/all');
      setResults(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = results.filter((r) => {
    const userName = r.user?.display_name?.toLowerCase() || '';
    const quizTitle = r.quiz?.title?.toLowerCase() || '';
    const term = search.toLowerCase();
    return userName.includes(term) || quizTitle.includes(term);
  });

  const apiBase = getApiBaseUrl();

  if (!isDevelopmentOrAdmin) {
    return <div className="p-8 text-rose-600 font-bold text-center">Akses Ditolak: Khusus Tim Pengembangan dan Admin.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-800 tracking-tight">
            Rekap Hasil & Kelulusan Evaluasi Tim Rutin
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pantau pemahaman analis farmasi terhadap metode validasi Tim Pengembangan dan export laporan kelulusan
          </p>
        </div>

        <a
          href={`${apiBase}/results/export-csv?token=${token}`}
          download
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>Export Rekap CSV</span>
        </a>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Cari nama analis atau judul kuis..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none focus:bg-white"
          />
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Nama Analis / User</th>
                <th className="py-3 px-4">Judul Kuis Evaluasi</th>
                <th className="py-3 px-4">Tipe Kuis</th>
                <th className="py-3 px-4">Nilai Diperoleh</th>
                <th className="py-3 px-4">Status Kelulusan</th>
                <th className="py-3 px-4 text-right">Tanggal Submit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Memuat data rekap kelulusan...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Belum ada data pengerjaan kuis yang tercatat.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800">{r.user?.display_name || 'N/A'}</div>
                      <div className="text-[10px] text-slate-400 font-mono">@{r.user?.username || 'N/A'}</div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {r.quiz?.title || `Kuis #${r.quiz_id}`}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-semibold text-slate-600">
                        {r.quiz?.quiz_type || 'N/A'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-sm text-slate-800">
                      {r.score}%
                      <span className="text-[10px] font-normal text-slate-400 ml-1">
                        (Min: {r.quiz?.passing_score || 70}%)
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {r.passed ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>LULUS</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-semibold text-[11px]">
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          <span>TIDAK LULUS</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-right">
                      {new Date(r.created_at).toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
