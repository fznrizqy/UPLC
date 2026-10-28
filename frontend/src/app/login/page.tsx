'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Lock, User, AlertCircle, ArrowRight, UserPlus, CheckCircle2, Clock } from 'lucide-react';
import { UplcLogo } from '@/components/Logo';

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  
  // Login State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Register State
  const [regUsername, setRegUsername] = useState('');
  const [regDisplayName, setRegDisplayName] = useState('');
  const [regPosition, setRegPosition] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPasswordConfirm, setRegPasswordConfirm] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', {
        username: username.trim(),
        password: password.trim(),
      });

      const { access_token, user } = response.data;
      login(access_token, user);
      router.push('/');
    } catch (err: any) {
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Gagal masuk. Pastikan server backend sedang berjalan.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (regPassword !== regPasswordConfirm) {
      setError('Konfirmasi password tidak cocok');
      return;
    }

    const upperUsername = regUsername.trim().toUpperCase();
    if (!/^[A-Z]{3}$/.test(upperUsername)) {
      setError('Username wajib 3 huruf alfabet kapital (contoh: ABC)');
      return;
    }

    if (regPassword.length < 4) {
      setError('Password minimal 4 karakter');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/register', {
        username: upperUsername,
        display_name: regDisplayName.trim(),
        position: regPosition.trim() || null,
        password: regPassword,
      });

      setRegisterSuccess(true);
      setRegUsername('');
      setRegDisplayName('');
      setRegPosition('');
      setRegPassword('');
      setRegPasswordConfirm('');
    } catch (err: any) {
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Gagal mendaftar. Silakan coba kembali.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B132B] flex flex-col justify-center items-center px-4 relative overflow-hidden py-10">
      {/* Background glowing decorations */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-md w-full z-10">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100">
          {/* Header Banner */}
          <div className="bg-white p-6 sm:p-8 text-center border-b border-slate-100 flex flex-col items-center">
            <div className="h-16 w-60 mb-2 flex items-center justify-center">
              <UplcLogo className="max-h-full max-w-full w-auto h-auto object-contain" />
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-wide mt-1">
              UPLC
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Unified Pharmacy Learning Center
            </p>
          </div>

          {/* Tab Selector */}
          <div className="flex border-b border-slate-100 bg-slate-50/70 p-1.5">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
                setRegisterSuccess(false);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'login'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Masuk Akun
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError('');
                setRegisterSuccess(false);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'register'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Daftar Akun Baru
            </button>
          </div>

          {/* Form Area */}
          <div className="p-6 sm:p-8">
            {error && (
              <div className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            {mode === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Username
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Masukkan username"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan password"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 mt-3"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span>Masuk ke Sistem</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="pt-4 text-center">
                  <span className="text-xs text-slate-400">Belum memiliki akun? </span>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setError('');
                    }}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    Daftar di sini
                  </button>
                </div>
              </form>
            ) : registerSuccess ? (
              <div className="text-center py-4 space-y-4">
                <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-200 shadow-xs">
                  <Clock className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Pendaftaran Berhasil!</h3>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    Akun Anda telah terdaftar dan saat ini berstatus <strong>PENDING</strong>.
                  </p>
                  <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-left text-[11px] text-slate-600 leading-normal">
                    Administrator akan meninjau akun Anda, menetapkan peran kerja (Tim Rutin / Tim Pengembangan), dan mengaktifkannya sebelum Anda dapat masuk.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setRegisterSuccess(false);
                  }}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-md transition-all"
                >
                  Kembali ke Halaman Masuk
                </button>
              </div>
            ) : (
              <form onSubmit={handleRegister} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Nama Lengkap *
                  </label>
                  <input
                    type="text"
                    required
                    value={regDisplayName}
                    onChange={(e) => setRegDisplayName(e.target.value)}
                    placeholder="Contoh: Budi Santoso, S.Farm"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Jabatan *
                  </label>
                  <select
                    required
                    value={regPosition}
                    onChange={(e) => setRegPosition(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  >
                    <option value="">-- Pilih Jabatan --</option>
                    <option value="Manager Laboratorium">Manager Laboratorium</option>
                    <option value="Asistant Manager Laboratorium">Asistant Manager Laboratorium</option>
                    <option value="Supervisor Laboratorium">Supervisor Laboratorium</option>
                    <option value="Analis Laboratorium">Analis Laboratorium</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={3}
                    value={regUsername}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 3);
                      setRegUsername(val);
                    }}
                    placeholder="3 huruf inisial nama anda"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:normal-case placeholder:font-normal placeholder:tracking-normal uppercase font-bold tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Wajib 3 huruf alfabet kapital inisial nama (contoh: ABC)
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Password *
                    </label>
                    <input
                      type="password"
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Minimal 4 karakter"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Ulangi Password *
                    </label>
                    <input
                      type="password"
                      required
                      value={regPasswordConfirm}
                      onChange={(e) => setRegPasswordConfirm(e.target.value)}
                      placeholder="Konfirmasi password"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="p-2.5 bg-amber-50/80 border border-amber-200 rounded-lg text-[11px] text-amber-800 flex items-start gap-2">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>Akun yang baru didaftarkan akan berstatus <strong>Pending</strong> sampai diaktivasi dan diberi peran oleh Administrator.</span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 mt-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Kirim Permohonan Akun</span>
                    </>
                  )}
                </button>

                <div className="pt-2 text-center">
                  <span className="text-xs text-slate-400">Sudah memiliki akun? </span>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setError('');
                    }}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    Masuk di sini
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
