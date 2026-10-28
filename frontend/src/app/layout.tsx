import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { SidebarProvider } from "@/context/MobileMenuContext";
import AppLayout from "@/components/AppLayout";

export const metadata: Metadata = {
  title: "UPLC : Unified Pharmacy Learning Center",
  description: "Internal Laboratory E-Learning & Method Validation Platform",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased">
        <AuthProvider>
          <SidebarProvider>
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50 text-xs text-slate-400">Loading...</div>}>
              <AppLayout>
                {children}
              </AppLayout>
            </Suspense>
          </SidebarProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
