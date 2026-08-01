import { useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Link } from 'react-router-dom';
import LandingPage from './pages/LandingPage.jsx';
import InterviewPage from './pages/InterviewPage.jsx';
import ReportPage from './pages/ReportPage.jsx';
import ContactPage from './pages/ContactPage.jsx';

const historyStorageKey = 'repovet:history';

function readStoredJson(key) {
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function writeStoredJson(key, value) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Local storage is optional
  }
}

function AppHeader() {
  const location = useLocation();
  const pathname = location.pathname;

  let stage = 'onboarding';
  if (pathname.startsWith('/interview')) {
    stage = 'interview';
  } else if (pathname.startsWith('/report')) {
    stage = 'report';
  }

  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-6 lg:px-8">
      <Link 
        to="/" 
        className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
        onClick={(e) => {
          if (stage === 'interview') {
            e.preventDefault();
            window.dispatchEvent(new CustomEvent('requestExitInterview'));
          }
        }}
      >
        <img src="/favicon.jpg" alt="Repovet Logo" className="h-10 w-10 rounded-xl object-cover" />
        <div>
          <p className="font-semibold tracking-tight text-white">Repovet</p>
          <p className="text-xs text-slate-500">Evidence over guesswork</p>
        </div>
      </Link>
      <div className="hidden items-center gap-2 text-xs text-slate-500 sm:flex">
        <span className={`h-2 w-2 rounded-full ${stage === 'onboarding' ? 'bg-cyan-300' : 'bg-slate-700'}`} />
        Setup
        <span className="mx-2 h-px w-8 bg-slate-800" />
        <span className={`h-2 w-2 rounded-full ${stage === 'interview' ? 'bg-cyan-300' : 'bg-slate-700'}`} />
        Interview
        <span className="mx-2 h-px w-8 bg-slate-800" />
        <span className={`h-2 w-2 rounded-full ${stage === 'report' ? 'bg-cyan-300' : 'bg-slate-700'}`} />
        Report
      </div>
    </header>
  );
}

function AppFooter() {
  return (
    <footer className="mt-20 border-t border-slate-900/80 py-8 text-center text-xs text-slate-500">
      <div className="mx-auto max-w-6xl px-5 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="flex items-center gap-1.5 font-medium text-slate-400">
          Made with <span className="text-rose-500">❤️</span> by <span className="text-cyan-300 font-semibold">Team Cadence</span>
        </p>
        <div className="flex items-center gap-6">
          <a
            href="https://discord.gg/RdYcnzF6RS"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-500 hover:text-[#5865F2] transition-colors"
            title="Join our Discord"
          >
            <span className="sr-only">Discord</span>
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
            </svg>
          </a>
          <a href="/contact" className="hover:text-cyan-300 transition-colors">Contact Us</a>
          <p className="text-slate-600">
            Repovet &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </footer>
  );
}

function AppContent() {
  const [history, setHistory] = useState(() => readStoredJson(historyStorageKey) || []);

  function handleAddToHistory(newItem) {
    const nextHistory = [
      newItem,
      ...history.filter((item) => item.sessionId !== newItem.sessionId)
    ].slice(0, 6);
    setHistory(nextHistory);
    writeStoredJson(historyStorageKey, nextHistory);
  }

  function handleDeleteFromHistory(sessionId) {
    const nextHistory = history.filter((item) => item.sessionId !== sessionId);
    setHistory(nextHistory);
    writeStoredJson(historyStorageKey, nextHistory);
  }

  return (
    <div className="min-h-screen bg-ink text-slate-200 overflow-x-hidden flex flex-col justify-between">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-cyan-400/5 blur-3xl animate-float-slow" />
        <div className="absolute -right-20 top-1/3 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl animate-float-delayed" />
      </div>
      <div>
        <AppHeader />
        <main className="relative mx-auto w-full max-w-6xl px-5 pb-10 lg:px-8">
          <Routes>
            <Route path="/" element={<LandingPage history={history} />} />
            <Route path="/interview/:sessionId" element={<InterviewPage onAddToHistory={handleAddToHistory} />} />
            <Route path="/report/:sessionId" element={<ReportPage onDeleteFromHistory={handleDeleteFromHistory} />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="*" element={
              <div className="mx-auto max-w-2xl py-24 text-center">
                <h1 className="text-6xl font-bold text-white">404</h1>
                <p className="mt-4 text-lg text-slate-400">This page doesn't exist.</p>
                <a href="/" className="mt-8 inline-block rounded-xl bg-cyan-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200">Go Home</a>
              </div>
            } />
          </Routes>
        </main>
      </div>
      <AppFooter />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
