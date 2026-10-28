'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSidebar } from '@/context/MobileMenuContext';
import {
  LayoutDashboard,
  Calendar,
  FileText,
  Video,
  Award,
  Users,
  ClipboardList,
  ShieldAlert,
  ChevronRight,
  ChevronDown,
  BookOpen,
  FolderKanban,
  X,
  PanelLeftClose,
  CalendarCheck,
} from 'lucide-react';
import { UplcLogo } from '@/components/Logo';

export default function Sidebar() {
  const pathname = usePathname();
  const { isAdmin, isDevelopmentOrAdmin, user } = useAuth();
  const { isMobileOpen, closeMobileMenu, isDesktopCollapsed, toggleDesktopSidebar } = useSidebar();

  // Submenu dropdown collapse state (auto-expanded if current route matches sub-items)
  const isMateriActive =
    pathname.startsWith('/all-materials') ||
    pathname.startsWith('/materials') ||
    pathname.startsWith('/recordings');

  const isKuisActive =
    pathname === '/quizzes' ||
    pathname.startsWith('/quizzes/') ||
    pathname.startsWith('/results');

  const [openMateri, setOpenMateri] = useState<boolean>(isMateriActive || true);
  const [openKuis, setOpenKuis] = useState<boolean>(isKuisActive || true);

  // Sync open state when path changes
  useEffect(() => {
    if (isMateriActive) setOpenMateri(true);
    if (isKuisActive) setOpenKuis(true);
  }, [pathname, isMateriActive, isKuisActive]);

  // Submenu 1: Materi
  const materiSubItems = [
    { label: 'Semua Sharing', href: '/all-materials', icon: BookOpen },
    { label: 'Dokumen Sharing', href: '/materials', icon: FileText },
    { label: 'Video Sharing', href: '/recordings', icon: Video },
  ];

  // Submenu 2: Kuis
  const kuisSubItems = [
    { label: 'Evaluasi Kuis', href: '/quizzes', icon: ClipboardList },
    { label: 'Hasil Kuis', href: '/results', icon: Award },
  ];

  // Group 2: Tim Pengembangan Items
  const devNavItems = [
    { label: 'Kelola Kuis', href: '/admin/quizzes', icon: ClipboardList },
    { label: 'Rekap Nilai Tim', href: '/admin/results', icon: Award },
    { label: 'Daftar Hadir', href: '/admin/attendances', icon: CalendarCheck },
  ];

  // Group 3: Administrator Items
  const adminNavItems = [
    { label: 'Kelola User', href: '/admin/users', icon: Users },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={closeMobileMenu}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden cursor-pointer animate-in fade-in duration-200"
        />
      )}

      {/* Sidebar Drawer (supports mobile drawer & desktop collapse/hide) */}
      <aside
        className={`fixed md:sticky top-0 inset-y-0 left-0 z-50 bg-[#0B132B] text-slate-300 flex flex-col h-screen shrink-0 border-r border-slate-800 select-none transition-all duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0 shadow-2xl w-64' : '-translate-x-full md:translate-x-0'
        } ${
          isDesktopCollapsed ? 'md:w-0 md:border-r-0 md:opacity-0 md:pointer-events-none md:overflow-hidden' : 'md:w-64 md:opacity-100'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between min-w-[256px]">
          <div className="flex-1 flex flex-col items-center justify-center gap-1.5">
            <div className="w-full flex items-center justify-center py-1">
              <UplcLogo light={true} className="h-8 w-auto object-contain" />
            </div>
            <div className="text-[10px] text-slate-400 font-medium tracking-tight text-center">
              Unified Pharmacy Learning Center
            </div>
          </div>

          {/* Close button on mobile */}
          <button
            onClick={closeMobileMenu}
            className="md:hidden p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer ml-1"
            aria-label="Tutup Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

      {/* Nav List */}
      <div className="flex-1 px-3 py-4 space-y-5 overflow-y-auto min-w-[256px]">
        {/* GROUP 1: MENU UTAMA */}
        <div>
          {/* Group Header Label: text-[10px] uppercase font-bold */}
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
            Menu Utama
          </div>
          <nav className="space-y-1">
            {/* 1. Dashboard (Main Item: text-xs / 12px, font-medium) */}
            <Link
              href="/"
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                pathname === '/'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <LayoutDashboard className={`w-4 h-4 shrink-0 ${pathname === '/' ? 'text-white' : 'text-slate-400'}`} />
              <span className="truncate">Dashboard</span>
              {pathname === '/' && <ChevronRight className="w-3.5 h-3.5 ml-auto text-blue-200 shrink-0" />}
            </Link>

            {/* 2. Jadwal Sharing (Main Item: text-xs / 12px, font-medium) */}
            <Link
              href="/meetings"
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                pathname === '/meetings'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <Calendar className={`w-4 h-4 shrink-0 ${pathname === '/meetings' ? 'text-white' : 'text-slate-400'}`} />
              <span className="truncate">Jadwal Sharing</span>
              {pathname === '/meetings' && <ChevronRight className="w-3.5 h-3.5 ml-auto text-blue-200 shrink-0" />}
            </Link>

            {/* 3. DROPDOWN SUBMENU: MATERI */}
            <div className="pt-0.5">
              <button
                type="button"
                onClick={() => setOpenMateri(!openMateri)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  isMateriActive
                    ? 'text-sky-300 bg-slate-800/40 font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <FolderKanban className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>Materi</span>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 shrink-0 ${
                    openMateri ? 'rotate-180 text-sky-300' : 'text-slate-500'
                  }`}
                />
              </button>

              {/* Sub-menu items: text-[11px], inset padding, subtle border-l */}
              {openMateri && (
                <div className="mt-0.5 ml-3.5 pl-2.5 border-l border-slate-800/90 space-y-0.5">
                  {materiSubItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[11px] font-normal transition-all ${
                          isActive
                            ? 'bg-blue-600 text-white font-medium shadow-xs'
                            : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <span className="truncate">{item.label}</span>
                        {isActive && <ChevronRight className="w-3 h-3 ml-auto text-blue-200 shrink-0" />}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 4. DROPDOWN SUBMENU: KUIS */}
            <div className="pt-0.5">
              <button
                type="button"
                onClick={() => setOpenKuis(!openKuis)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  isKuisActive
                    ? 'text-amber-300 bg-slate-800/40 font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ClipboardList className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Kuis</span>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 shrink-0 ${
                    openKuis ? 'rotate-180 text-amber-300' : 'text-slate-500'
                  }`}
                />
              </button>

              {/* Sub-menu items: text-[11px], inset padding, subtle border-l */}
              {openKuis && (
                <div className="mt-0.5 ml-3.5 pl-2.5 border-l border-slate-800/90 space-y-0.5">
                  {kuisSubItems.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      item.href === '/quizzes'
                        ? pathname === '/quizzes' || pathname.startsWith('/quizzes/')
                        : pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[11px] font-normal transition-all ${
                          isActive
                            ? 'bg-blue-600 text-white font-medium shadow-xs'
                            : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <span className="truncate">{item.label}</span>
                        {isActive && <ChevronRight className="w-3 h-3 ml-auto text-blue-200 shrink-0" />}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* GROUP 2: TIM PENGEMBANGAN (Tampil untuk Tim Pengembangan & Admin) */}
        {isDevelopmentOrAdmin && (
          <div>
            {/* Group Header Label */}
            <div className="text-[10px] font-bold text-sky-400 uppercase tracking-wider px-3 mb-2 flex items-center gap-1.5">
              <ClipboardList className="w-3 h-3 text-sky-400 shrink-0" />
              <span>Tim Pengembangan</span>
            </div>
            <nav className="space-y-1">
              {devNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto text-blue-200 shrink-0" />}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}

        {/* GROUP 3: ADMINISTRATOR (Khusus role Admin) */}
        {isAdmin && (
          <div>
            {/* Group Header Label */}
            <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider px-3 mb-2 flex items-center gap-1.5">
              <ShieldAlert className="w-3 h-3 text-amber-400 shrink-0" />
              <span>Administrator</span>
            </div>
            <nav className="space-y-1">
              {adminNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto text-blue-200 shrink-0" />}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>
    </aside>
    </>
  );
}
