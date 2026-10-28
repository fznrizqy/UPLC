'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import api, { getApiBaseUrl } from '@/lib/api';
import { FileText, Download, Eye, Search, Filter, Calendar } from 'lucide-react';
import PptxPreviewModal from '@/components/PptxPreviewModal';

export default function MaterialsPage() {
  const { token } = useAuth();
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activePdfUrl, setActivePdfUrl] = useState<string | null>(null);
  const [activePptxFile, setActivePptxFile] = useState<any | null>(null);

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      const res = await api.get('/files');
      setFiles(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredFiles = files.filter((f) =>
    f.original_filename.toLowerCase().includes(search.toLowerCase()) ||
    (f.description && f.description.toLowerCase().includes(search.toLowerCase()))
  );

  const apiBase = getApiBaseUrl();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-800 tracking-tight">
            Dokumen Sharing
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Arsip lengkap dokumen protokol, laporan validasi (PDF), dan materi presentasi (PPT/PPTX)
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Cari file dokumen materi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none focus:bg-white"
          />
        </div>
      </div>

      {/* Materials Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Nama Dokumen</th>
                <th className="py-3 px-4">Tipe Format</th>
                <th className="py-3 px-4">Ukuran</th>
                <th className="py-3 px-4">Tanggal Unggah</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Memuat materi...
                  </td>
                </tr>
              ) : filteredFiles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Tidak ada materi validasi yang ditemukan.
                  </td>
                </tr>
              ) : (
                filteredFiles.map((f) => {
                  const lowerName = f.original_filename.toLowerCase();
                  const isPdf = lowerName.endsWith('.pdf');
                  const isPptx = lowerName.endsWith('.pptx') || lowerName.endsWith('.ppt');
                  return (
                    <tr key={f.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">{f.original_filename}</div>
                        {f.description && <div className="text-[11px] text-slate-400 mt-0.5">{f.description}</div>}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-semibold uppercase">
                          {f.original_filename.split('.').pop()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {(f.file_size / 1024 / 1024).toFixed(2)} MB
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(f.created_at).toLocaleDateString('id-ID')}
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        {isPdf && (
                          <button
                            onClick={() => setActivePdfUrl(`${apiBase}/files/${f.id}/preview?token=${token}`)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Preview</span>
                          </button>
                        )}
                        {isPptx && (
                          <button
                            onClick={() => setActivePptxFile(f)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-50 text-amber-700 hover:bg-amber-100 font-semibold transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Preview</span>
                          </button>
                        )}
                        <a
                          href={`${apiBase}/files/${f.id}/download?token=${token}`}
                          download
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </a>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PDF Modal */}
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
                  className="text-slate-400 hover:text-slate-600 px-2 py-1 font-bold text-sm"
                >
                  Tutup
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
