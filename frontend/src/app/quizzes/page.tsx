'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { ClipboardList, ChevronRight, Award, Calendar, CheckCircle, Lock } from 'lucide-react';

export default function QuizzesCatalogPage() {
  const { isDevelopmentOrAdmin } = useAuth();
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [myResults, setMyResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      const [resQuizzes, resResults] = await Promise.all([
        api.get('/quizzes'),
        api.get('/results/my-results')
      ]);
      setQuizzes(resQuizzes.data);
      setMyResults(resResults.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-slate-800 tracking-tight">
          Evaluasi Kuis
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Uji pemahaman prosedur dan analisis metode Pre & Post-Validation
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 stagger-child">
        {loading ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-400">
            Memuat daftar kuis...
          </div>
        ) : quizzes.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl p-12 text-center border border-slate-200 text-slate-400 text-xs">
            Belum ada kuis yang tersedia untuk dikerjakan.
          </div>
        ) : (
          quizzes.map((q) => {
            const userResult = myResults.find((r) => r.quiz_id === q.id);
            const isFinished = !!userResult;

            return (
              <div
                key={q.id}
                className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        {q.quiz_type}
                      </span>
                      {!q.is_active && (
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
                          <span>Selesai ({userResult.score}%)</span>
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500">
                      Min: {q.passing_score}%
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-800 line-clamp-1">{q.title}</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Jumlah Pertanyaan: {q.questions?.length || 0} Soal
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <Link
                    href={`/meetings/${q.meeting_id}`}
                    className="text-xs text-slate-500 hover:text-blue-600 flex items-center gap-1"
                  >
                    <span>Lihat Meeting</span>
                  </Link>

                  {!q.is_active ? (
                    <div className="flex items-center gap-1.5">
                      {isDevelopmentOrAdmin && (
                        <Link
                          href={`/quizzes/${q.id}`}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors"
                        >
                          <span>Pratinjau</span>
                        </Link>
                      )}
                      <button
                        disabled
                        title="Kuis ini belum diaktifkan oleh Tim Pengembangan"
                        className="px-3 py-1.5 rounded-lg bg-slate-200 text-slate-400 text-xs font-semibold cursor-not-allowed flex items-center gap-1"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Belum Aktif</span>
                      </button>
                    </div>
                  ) : !isFinished ? (
                    <Link
                      href={`/quizzes/${q.id}`}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <span>Kerjakan</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  ) : (
                    <Link
                      href="/results"
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <span>Lihat Hasil</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
