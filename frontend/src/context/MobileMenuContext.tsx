'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface SidebarContextType {
  // Mobile drawer state
  isMobileOpen: boolean;
  openMobileMenu: () => void;
  closeMobileMenu: () => void;
  toggleMobileMenu: () => void;

  // Desktop collapsed state
  isDesktopCollapsed: boolean;
  toggleDesktopSidebar: () => void;
  setDesktopCollapsed: (collapsed: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType>({
  isMobileOpen: false,
  openMobileMenu: () => {},
  closeMobileMenu: () => {},
  toggleMobileMenu: () => {},
  isDesktopCollapsed: false,
  toggleDesktopSidebar: () => {},
  setDesktopCollapsed: () => {},
});

export const SidebarProvider = ({ children }: { children: React.ReactNode }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  const pathname = usePathname();

  // Load user desktop preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('uplc_sidebar_collapsed');
    if (saved !== null) {
      setIsDesktopCollapsed(saved === 'true');
    }
  }, []);

  // Automatically close sidebar when navigating to a new route on mobile
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const openMobileMenu = () => setIsMobileOpen(true);
  const closeMobileMenu = () => setIsMobileOpen(false);
  const toggleMobileMenu = () => setIsMobileOpen((prev) => !prev);

  const toggleDesktopSidebar = () => {
    setIsDesktopCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('uplc_sidebar_collapsed', String(next));
      return next;
    });
  };

  const setDesktopCollapsed = (collapsed: boolean) => {
    setIsDesktopCollapsed(collapsed);
    localStorage.setItem('uplc_sidebar_collapsed', String(collapsed));
  };

  return (
    <SidebarContext.Provider
      value={{
        isMobileOpen,
        openMobileMenu,
        closeMobileMenu,
        toggleMobileMenu,
        isDesktopCollapsed,
        toggleDesktopSidebar,
        setDesktopCollapsed,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => useContext(SidebarContext);
