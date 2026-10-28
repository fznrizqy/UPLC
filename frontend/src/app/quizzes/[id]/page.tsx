'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import {
  ClipboardList,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Award,
  AlertCircle,
  AlertTriangle,
  HelpCircle,
  ChevronRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function TakeQuizPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const quizId = resolvedParams.id;
  const { user } = useAuth();

  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [qId: number]: number }>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Custom Error Modal State (Styled exactly like Logout Modal)
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchQuiz();
  }, [quizId]);

  const fetchQuiz = async () => {
    try {
      const res = await api.get(`/quizzes/${quizId}`);
      setQuiz(res.data);
    } catch (err: any) {
      const detail = err.response?.data?.detail || 'Gagal memuat kuis';
      setErrorMessage(detail);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (questionId: number, optionId: number) => {
    if (result) return; // Locked once submitted
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionId
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const unanswered = quiz.questions?.filter((q: any) => !selectedAnswers[q.id]);
    if (unanswered && unanswered.length > 0) {
      if (!confirm(`Terdapat ${unanswered.length} soal yang belum Anda jawab. Yakin ingin mengumpulkan sekarang?`)) {
        return;
      }
    }

    setSubmitting(true);
    try {
      const answersPayload = quiz.questions.map((q: any) => ({
        question_id: q.id,
        selected_option_id: selectedAnswers[q.id] || null
      }));

      const res = await api.post(`/quizzes/${quizId}/submit`, {
        answers: answersPayload
      });
      setResult(res.data);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.detail || 'Gagal mengumpulkan kuis');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-xs text-slate-400">
        Memuat soal evaluasi kuis...
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Custom Error Popup Modal (Identical in style to Logout Modal) */}
      {errorMessage && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl border border-slate-100 animate-page-entrance text-slate-800">
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100">
                <AlertTriangle className="w-6 h-6 text-rose-500" />
              </div>

              <h3 className="text-base font-bold text-slate-800">
                Pemberitahuan Kuis
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                {errorMessage}
              </p>

              <div className="mt-6 flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    router.back();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Tutup & Kembali</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* If quiz data is null/unavailable but no error modal displayed */}
      {!quiz && !errorMessage ? (
        <div className="py-12 text-center text-xs text-rose-500">
          Kuis tidak ditemukan atau tidak tersedia.
        </div>
      ) : quiz ? (
        <>
          {/* Back button */}
      <div className="flex items-center gap-3">
        <Link
          href={`/meetings/${quiz.meeting_id}`}
          className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
            {quiz.quiz_type} Evaluasi
          </span>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight mt-0.5">
            {quiz.title}
          </h1>
        </div>
      </div>

      {/* Result Card if submitted */}
      {result && (
        <div className={`p-6 rounded-2xl border shadow-lg ${
          result.passed
            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
            : 'bg-rose-50/80 border-rose-200 text-rose-900'
        }`}>
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
              result.passed ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
            }`}>
              {result.passed ? <CheckCircle2 className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold">
                {result.passed ? 'Selamat, Anda Dinyatakan LULUS!' : 'Belum Mencapai Nilai Kelulusan'}
              </h2>
              <p className="text-xs opacity-90 mt-1">
                Passing score minimum: {quiz.passing_score}%. Skor akhir Anda dihitung dan diverifikasi otomatis oleh server.
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-black">{result.score}%</div>
              <div className="text-xs font-semibold uppercase tracking-wider">
                {result.passed ? 'KOMPETEN' : 'REMEDIAL'}
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-200/50 flex items-center justify-between">
            <Link
              href="/results"
              className="text-xs font-semibold underline hover:opacity-80"
            >
              Lihat Riwayat & Rekap Nilai Saya
            </Link>
            <button
              onClick={() => {
                setResult(null);
                setSelectedAnswers({});
              }}
              className="px-4 py-1.5 rounded-lg bg-white/80 hover:bg-white text-slate-800 text-xs font-semibold border border-slate-200 transition-colors"
            >
              Ulangi Percobaan Kuis
            </button>
          </div>
        </div>
      )}

      {/* Questions Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {quiz.questions && quiz.questions.length > 0 ? (
          quiz.questions.map((q: any, idx: number) => (
            <div
              key={q.id}
              className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-3"
            >
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <div className="flex-1">
                  <div className="text-xs font-bold text-slate-800 leading-relaxed">
                    {q.question_text}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {q.question_type === 'multiple_choice' ? 'Pilihan Ganda (Pilih satu jawaban yang tepat)' : 'Benar / Salah'}
                  </div>
                </div>
              </div>

              {/* Question Image (fit to div and centered) */}
              {q.image_url && (
                <div className="w-full flex justify-center items-center py-2 px-2 bg-slate-50/70 border border-slate-200/80 rounded-xl overflow-hidden my-2">
                  <div className="relative max-w-full flex justify-center items-center">
                    <img
                      src={q.image_url}
                      alt={`Gambar Soal #${idx + 1}`}
                      className="max-h-[380px] max-w-full w-auto h-auto object-contain rounded-lg shadow-xs mx-auto border border-slate-200/60"
                      loading="lazy"
                    />
                  </div>
                </div>
              )}

              {/* Options */}
              <div className="space-y-2 pt-2">
                {q.options.map((opt: any) => {
                  const isChecked = selectedAnswers[q.id] === opt.id;
                  return (
                    <label
                      key={opt.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                        isChecked
                          ? 'border-blue-500 bg-blue-50/50 text-blue-900 font-medium'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question_${q.id}`}
                        value={opt.id}
                        checked={isChecked}
                        onChange={() => handleSelectOption(q.id, opt.id)}
                        disabled={!!result}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                      />
                      <span className="flex-1">{opt.option_text}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-xl p-12 text-center text-slate-400 text-xs border border-slate-200">
            Kuis ini belum memiliki soal pertanyaan.
          </div>
        )}

        {!result && quiz.questions && quiz.questions.length > 0 && (
          <div className="sticky bottom-6 bg-white/95 backdrop-blur p-4 rounded-xl border border-slate-200 shadow-lg flex items-center justify-between">
            <div className="text-xs text-slate-500">
              Terjawab: <span className="font-bold text-slate-800">{Object.keys(selectedAnswers).length}</span> dari {quiz.questions.length} soal
              {!quiz.is_active && (
                <span className="ml-2 px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-semibold text-[10px]">
                  Mode Pratinjau (Kuis Belum Aktif)
                </span>
              )}
            </div>
            <button
              type="submit"
              disabled={submitting || !quiz.is_active}
              title={!quiz.is_active ? 'Kuis belum aktif sehingga jawaban tidak dapat disubmit' : undefined}
              className={`px-6 py-2.5 font-semibold text-xs rounded-lg shadow-md transition-colors ${
                !quiz.is_active
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 disabled:opacity-50'
              }`}
            >
              {!quiz.is_active ? 'Kuis Belum Aktif' : submitting ? 'Menghitung Nilai...' : 'Kumpulkan Jawaban Kuis'}
            </button>
          </div>
        )}
      </form>
      </>
      ) : null}
    </div>
  );
}
