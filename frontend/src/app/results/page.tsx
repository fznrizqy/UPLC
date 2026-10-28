'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Award, CheckCircle2, XCircle, Calendar, ArrowRight } from 'lucide-react';

export default function MyResultsPage() {
  const { user } = useAuth();
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      const res = await api.get('/results/my-results');
      setResults(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const totalAttempts = results.length;

  // Group by quiz_id to calculate stats based on LATEST attempt per unique quiz
  const latestByQuiz: { [key: number]: any } = {};
  results.forEach((r) => {
    if (!latestByQuiz[r.quiz_id]) {
      latestByQuiz[r.quiz_id] = r;
    }
  });

  const uniqueLatestResults = Object.values(latestByQuiz);
  const totalUniqueQuizzes = uniqueLatestResults.length;
  const passedCount = uniqueLatestResults.filter((r) => r.passed).length;
  const passRate = totalUniqueQuizzes > 0 ? Math.round((passedCount / totalUniqueQuizzes) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-slate-800 tracking-tight">
          Hasil & Riwayat Kuis Saya
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Laporan pencapaian kelulusan evaluasi pemahaman metode validasi Anda
        </p>
      </div>

      {/* Summary KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Total Percobaan Kuis
          </div>
          <div className="text-2xl font-bold text-slate-800 mt-1">{totalAttempts} Kali</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Dari {totalUniqueQuizzes} kuis berbeda</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Kuis Dinyatakan Lulus
          </div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{passedCount} Kuis</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Berdasarkan hasil pengerjaan terbaru</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Persentase Kelulusan
          </div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{passRate}%</div>
          <div className="text-[10px] text-slate-400 mt-0.5">{passedCount} dari {totalUniqueQuizzes} kuis lulus</div>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Nama Kuis</th>
                <th className="py-3 px-4">Tipe Sharing</th>
                <th className="py-3 px-4">Nilai Diperoleh</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Waktu Pengerjaan</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Memuat riwayat hasil...
                  </td>
                </tr>
              ) : results.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Anda belum mengerjakan kuis evaluasi apapun.
                  </td>
                </tr>
              ) : (
                results.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-800">
                      {r.quiz?.title || `Kuis #${r.quiz_id}`}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-semibold text-slate-600">
                        {r.quiz?.quiz_type || 'N/A'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-sm text-slate-800">{r.score}%</span>
                      <span className="text-[10px] text-slate-400 ml-1">
                        (Min: {r.quiz?.passing_score || 70}%)
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {r.passed ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Lulus</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-semibold text-[11px]">
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          <span>Tidak Lulus</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(r.created_at).toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/quizzes/${r.quiz_id}`}
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-semibold"
                      >
                        <span>Kerjakan Ulang</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
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
