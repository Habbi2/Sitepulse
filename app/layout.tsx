import './globals.css';
import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SitePulse – Instant Website Quality Score',
  description: 'Fast multi-pillar web quality audits delivering actionable performance, accessibility, SEO, security and UX insights in under a second.',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg'
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans hb-bg transition-colors">
        <div className="min-h-screen flex flex-col">
          <header className="px-6 py-4 flex items-center justify-between border-b border-neutral-900/70 bg-neutral-950/60 backdrop-blur-sm">
            <a href="/" className="text-sm font-medium tracking-wide text-neutral-200 hover:text-white transition">SitePulse</a>
            <nav className="flex items-center gap-6 text-xs text-neutral-400">
              <a href="/" className="hover:text-sky-400 transition">Home</a>
              <a href="https://habbiwebdesign.site" target="_blank" rel="noopener noreferrer" className="hover:text-sky-400 transition">Habbi Web Design</a>
              <a href="https://github.com/Habbi2/Sitepulse" target="_blank" rel="noopener noreferrer" className="hover:text-sky-400 transition">GitHub</a>
            </nav>
          </header>
          <div className="flex-1">
            {children}
          </div>
          <footer className="mt-16 py-8 text-center text-[11px] text-neutral-600">
            <p>&copy; {new Date().getFullYear()} SitePulse. Design inspiration: <a className="hover:text-sky-400 transition" href="https://habbiwebdesign.site" target="_blank" rel="noopener noreferrer">Habbi Web Design</a>.</p>
          </footer>
        </div>
      </body>
    </html>
  );
}
