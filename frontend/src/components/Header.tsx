'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSidebar } from '@/context/MobileMenuContext';
import { Bell, Wifi, Search, LogOut, AlertTriangle, Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

export default function Header() {
  const { user, logout } = useAuth();
  const { toggleMobileMenu, isDesktopCollapsed, toggleDesktopSidebar } = useSidebar();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const currentDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={toggleMobileMenu}
            className="md:hidden p-2 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Buka Menu Navigasi"
            aria-label="Buka Menu Navigasi"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Desktop Toggle Sidebar Button */}
          <button
            type="button"
            onClick={toggleDesktopSidebar}
            className="hidden md:flex p-2 -ml-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer items-center justify-center"
            title={isDesktopCollapsed ? 'Tampilkan Sidebar' : 'Sembunyikan Sidebar'}
            aria-label="Toggle Sidebar"
          >
            {isDesktopCollapsed ? (
              <PanelLeftOpen className="w-5 h-5 text-blue-600" />
            ) : (
              <PanelLeftClose className="w-5 h-5" />
            )}
          </button>

          <div className="text-xs text-slate-500 font-medium hidden lg:block">
            {currentDate}
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] sm:text-[11px] font-semibold text-emerald-700 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>LAN Mode</span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-semibold text-slate-800 truncate max-w-[150px]">{user?.display_name || 'Loading...'}</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wide">
              {user?.role === 'admin'
                ? 'Administrator Sistem'
                : user?.role === 'development'
                ? 'Tim Pengembangan'
                : 'Tim Rutin'}
            </div>
          </div>

          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-blue-600 text-white font-semibold text-xs flex items-center justify-center shadow-xs">
            {user?.display_name ? user.display_name.substring(0, 2).toUpperCase() : 'US'}
          </div>

          <button
            onClick={() => setShowLogoutModal(true)}
            title="Keluar dari akun"
            className="p-1.5 sm:p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl border border-slate-100 animate-page-entrance text-slate-800">
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100">
                <AlertTriangle className="w-6 h-6 text-rose-500" />
              </div>

              <h3 className="text-base font-bold text-slate-800">
                Konfirmasi Keluar
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Apakah Anda yakin ingin keluar dari akun <span className="font-semibold text-slate-700">{user?.display_name}</span>?
              </p>

              <div className="grid grid-cols-2 gap-2.5 mt-6">
                <button
                  type="button"
                  onClick={() => setShowLogoutModal(false)}
                  className="py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowLogoutModal(false);
                    logout();
                  }}
                  className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Ya, Keluar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
