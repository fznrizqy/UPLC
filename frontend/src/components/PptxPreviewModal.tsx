'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { X, ExternalLink, Download, FileSpreadsheet, AlertTriangle, Loader2 } from 'lucide-react';
import '@extend-ai/react-pptx/styles.css';

// Dynamically import ReactPptxViewer and setWasmSource without SSR
const DynamicPptxViewer = dynamic(
  async () => {
    const mod = await import('@extend-ai/react-pptx');
    if (typeof window !== 'undefined' && mod.setWasmSource) {
      mod.setWasmSource('/pptx_wasm_bg.wasm');
    }
    return mod.ReactPptxViewer;
  },
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="text-xs font-medium">Menyiapkan viewer presentasi PPTX...</span>
      </div>
    ),
  }
);

interface PptxPreviewModalProps {
  fileUrl: string;
  fileName: string;
  downloadUrl?: string;
  onClose: () => void;
}

export default function PptxPreviewModal({
  fileUrl,
  fileName,
  downloadUrl,
  onClose,
}: PptxPreviewModalProps) {
  const [arrayBuffer, setArrayBuffer] = useState<ArrayBuffer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    fetch(fileUrl)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Gagal mengunduh file presentasi (${res.status} ${res.statusText})`);
        }
        return res.arrayBuffer();
      })
      .then((buf) => {
        if (active) {
          setArrayBuffer(buf);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message || 'Terjadi kesalahan saat memuat berkas presentasi');
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [fileUrl]);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl max-w-6xl w-full h-[88vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200 cursor-default animate-in fade-in duration-200"
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/90 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 mr-4">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200">
              <FileSpreadsheet className="w-4 h-4 text-amber-600" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-xs md:text-sm text-slate-800 truncate" title={fileName}>
                {fileName}
              </div>
              <div className="text-[10px] text-slate-400 font-medium">
                Pratinjau Presentasi PowerPoint (.pptx)
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {downloadUrl && (
              <a
                href={downloadUrl}
                download
                className="inline-flex items-center gap-1.5 text-xs text-slate-700 hover:text-slate-900 font-semibold px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Unduh File</span>
              </a>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Tutup Pratinjau"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Viewer Body */}
        <div className="flex-1 bg-slate-100 overflow-hidden relative flex flex-col items-center justify-center">
          {loading && (
            <div className="flex flex-col items-center justify-center gap-3 text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="text-xs font-medium">Mengunduh & memproses slide presentasi...</span>
            </div>
          )}

          {error && (
            <div className="p-8 text-center max-w-md">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3 border border-rose-100">
                <AlertTriangle className="w-6 h-6 text-rose-500" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">Gagal Membuka Pratinjau</h4>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{error}</p>
              {downloadUrl && (
                <div className="mt-4">
                  <a
                    href={downloadUrl}
                    download
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh & Buka di PowerPoint</span>
                  </a>
                </div>
              )}
            </div>
          )}

          {!loading && !error && arrayBuffer && (
            <div className="w-full h-full overflow-auto">
              <DynamicPptxViewer
                source={arrayBuffer}
                showToolbar={true}
                showThumbnails={true}
                className="w-full h-full min-h-[500px]"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
