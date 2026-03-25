import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ZimLearn — Offline',
  description: 'You are currently offline. Access your cached study materials.',
}

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 px-6 py-5 border-b border-slate-800">
        <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-sm text-white flex-shrink-0">
          ZL
        </div>
        <span className="text-lg font-bold">
          Zim<span className="text-emerald-400">Learn</span>
        </span>
        <span className="ml-auto flex items-center gap-2 text-xs font-semibold text-amber-400 bg-amber-400/10 border border-amber-400/30 px-3 py-1.5 rounded-full">
          <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
          Offline
        </span>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
        {/* Icon */}
        <div className="w-20 h-20 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center mb-6">
          {/* wifi-off SVG */}
          <svg
            className="w-10 h-10 text-emerald-400"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <line x1="1" y1="1" x2="23" y2="23" />
            <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
            <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
            <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
            <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
            <circle cx="12" cy="20" r="1" fill="currentColor" stroke="none" />
          </svg>
        </div>

        <h1 className="text-3xl font-extrabold mb-3">
          {"You're offline — but "}
          <span className="text-emerald-400">{"don't stop learning!"}</span>
        </h1>

        <p className="text-slate-400 max-w-md mb-8 leading-relaxed">
          Your internet connection is unavailable right now. Any pages and study
          materials you have already visited are still accessible below.
        </p>

        {/* Quick links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-lg mb-10">
          <Link
            href="/student/dashboard"
            className="flex flex-col items-center gap-2 p-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-emerald-500 rounded-xl transition-colors"
          >
            <span className="text-2xl">📊</span>
            <span className="text-sm font-medium">Dashboard</span>
          </Link>
          <Link
            href="/student/subjects"
            className="flex flex-col items-center gap-2 p-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-emerald-500 rounded-xl transition-colors"
          >
            <span className="text-2xl">📚</span>
            <span className="text-sm font-medium">Subjects</span>
          </Link>
          <Link
            href="/student/documents"
            className="flex flex-col items-center gap-2 p-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-emerald-500 rounded-xl transition-colors"
          >
            <span className="text-2xl">📄</span>
            <span className="text-sm font-medium">Documents</span>
          </Link>
        </div>

        {/* Retry */}
        <OfflineRetryButton />

        {/* Tip */}
        <div className="mt-10 max-w-md flex gap-3 bg-amber-400/8 border border-amber-400/25 rounded-xl p-4 text-left">
          <span className="text-xl flex-shrink-0 mt-0.5">💡</span>
          <p className="text-sm text-slate-300">
            <strong className="text-amber-400">Tip:</strong> Download study materials
            while online for offline access. Open any document while connected and
            it will be saved automatically for use without Wi-Fi.
          </p>
        </div>
      </main>

      <footer className="border-t border-slate-800 text-center text-xs text-slate-500 py-5 px-6">
        &copy; {new Date().getFullYear()} ZimLearn — ZIMSEC E-Learning Platform
      </footer>
    </div>
  )
}

// ─── Client retry button ──────────────────────────────────────────────────────
// Extracted into a tiny client component so the page itself stays a Server
// Component while still having an interactive button.

function OfflineRetryButton() {
  // This is intentionally a plain HTML button with inline onclick so the page
  // is statically renderable without 'use client' on the whole page.
  // The button's behaviour is entirely self-contained in the attribute.
  return (
    <button
      // eslint-disable-next-line react/no-danger
      onClick={undefined}
      // Use a data attribute trick: the button emits a custom event the SW intercepts,
      // or simply reloads the page. For SSR safety we attach the handler via dangerouslySetInnerHTML
      // equivalent using a script tag approach below.
      type="button"
      id="offline-retry-btn"
      className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-semibold px-6 py-3 rounded-xl transition-all"
    >
      {/* refresh icon */}
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.25}
        strokeLinecap="round"
        strokeLinejoin="round"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <polyline points="23 4 23 10 17 10" />
        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
      </svg>
      Try Again
      {/* Inline script so the button works without a separate client bundle */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            document.getElementById('offline-retry-btn')?.addEventListener('click', function() {
              this.disabled = true;
              this.textContent = 'Checking…';
              fetch('/manifest.json', { cache: 'no-store' })
                .then(() => window.location.href = '/')
                .catch(() => {
                  this.disabled = false;
                  this.textContent = 'Still offline — try again later';
                  setTimeout(() => { this.textContent = 'Try Again'; }, 3000);
                });
            });
          `,
        }}
      />
    </button>
  )
}
