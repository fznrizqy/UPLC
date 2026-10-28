'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import api, { getApiBaseUrl } from '@/lib/api';
import { Video, Play, Search, Calendar, Clock, X } from 'lucide-react';

export default function RecordingsPage() {
  const { token } = useAuth();
  const [recordings, setRecordings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeVideo, setActiveVideo] = useState<any>(null);

  useEffect(() => {
    fetchRecordings();
  }, []);

  const fetchRecordings = async () => {
    try {
      const res = await api.get('/recordings');
      setRecordings(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = recordings.filter((r) =>
    r.title.toLowerCase().includes(search.toLowerCase())
  );

  const apiBase = getApiBaseUrl();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-800 tracking-tight">
            Video Materi Sharing
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Tonton kembali penjelasan dan demonstrasi metode validasi dengan fast streaming LAN
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Cari judul rekaman..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none focus:bg-white"
          />
        </div>
      </div>

      {/* Video Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 stagger-child">
        {loading ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-400">
            Memuat daftar rekaman...
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl p-12 text-center border border-slate-200 text-slate-400 text-xs">
            Belum ada rekaman video yang tersedia.
          </div>
        ) : (
          filtered.map((rec) => (
            <div
              key={rec.id}
              className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-between"
            >
              {/* Fake Video Thumbnail Header */}
              <div
                onClick={() => setActiveVideo(rec)}
                className="h-36 bg-linear-to-tr from-slate-900 to-indigo-950 relative flex items-center justify-center cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-indigo-500 transition-all">
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                </div>
                <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/60 text-white text-[10px] font-mono">
                  {(rec.file_size / 1024 / 1024).toFixed(1)} MB
                </span>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 line-clamp-2">{rec.title}</h3>
                  <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(rec.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <Link
                    href={`/meetings/${rec.meeting_id}`}
                    className="text-xs text-slate-500 hover:text-blue-600 font-medium"
                  >
                    Buka Meeting Terkait
                  </Link>
                  <button
                    onClick={() => setActiveVideo(rec)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Putar Video</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Video Modal */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
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
    </div>
  );
}
