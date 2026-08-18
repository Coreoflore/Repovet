import { useState, useEffect, useRef } from 'react';
import { createSession, uploadResume } from '../services/api.js';

const roles = [
  'Full-Stack Engineer',
  'Backend Engineer',
  'Frontend Engineer',
  'DevOps / Platform Engineer',
  'Site Reliability Engineer (SRE)',
  'Cloud / Infrastructure Architect',
  'Mobile Engineer (iOS / Android)',
  'AI / Machine Learning Engineer',
  'Data Engineer',
  'Data Scientist',
  'Cybersecurity / Security Engineer',
  'QA / Test Automation Engineer',
  'Embedded Systems / Firmware Engineer',
  'Systems Software Engineer',
  'Technical Product Manager',
  'Engineering Manager / Tech Lead'
];

export default function OnboardingForm({ onSessionReady }) {
  const [file, setFile] = useState(null);
  const [repoUrls, setRepoUrls] = useState(['https://github.com/']);
  const [targetRole, setTargetRole] = useState('');
  const [questionCount, setQuestionCount] = useState(6);
  const [parsedResumeText, setParsedResumeText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isBuildingSession, setIsBuildingSession] = useState(false);
  const [error, setError] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const loadingRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  useEffect(() => {
    if (isBuildingSession && loadingRef.current) {
      loadingRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isBuildingSession]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!file) {
      setError('Choose a PDF or DOCX resume to begin.');
      return;
    }
    if (!targetRole.trim()) {
      setError('Select or type a target role to begin.');
      return;
    }

    const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!['.pdf', '.docx'].includes(extension)) {
      setError('Resume must be a PDF or DOCX file.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Resume files must be smaller than 10 MB.');
      return;
    }

    const parsedQuestionCount = Number(questionCount);
    if (!Number.isInteger(parsedQuestionCount) || parsedQuestionCount < 3 || parsedQuestionCount > 10) {
      setError('Interview length must be a whole number between 3 and 10.');
      return;
    }

    const filteredRepoUrls = repoUrls
      .map(url => url.trim())
      .filter((url) => url && url !== 'https://github.com/');

    setError('');
    setIsLoading(true);
    try {
      if (!parsedResumeText) {
        const { resumeText } = await uploadResume(file);
        setParsedResumeText(resumeText);
        return;
      }

      setIsBuildingSession(true);
      const session = await createSession({ resumeText: parsedResumeText, repoUrls: filteredRepoUrls, targetRole, questionCount: parsedQuestionCount });
      onSessionReady({ ...session, repoUrls: filteredRepoUrls, targetRole, questionCount: parsedQuestionCount });
    } catch (requestError) {
      setError(requestError.message);
      setIsBuildingSession(false);
    } finally {
      setIsLoading(false);
    }
  }

  function handleFileChange(event) {
    setFile(event.target.files?.[0] || null);
    setParsedResumeText('');
    setError('');
  }

  function chooseDifferentFile() {
    setFile(null);
    setParsedResumeText('');
    setError('');
  }

  function addRepoUrl() {
    if (repoUrls.length < 5) {
      setRepoUrls([...repoUrls, 'https://github.com/']);
    }
  }

  function removeRepoUrl(index) {
    const newRepoUrls = [...repoUrls];
    newRepoUrls.splice(index, 1);
    if (newRepoUrls.length === 0) newRepoUrls.push('https://github.com/');
    setRepoUrls(newRepoUrls);
  }

  function updateRepoUrl(index, value) {
    const newRepoUrls = [...repoUrls];
    newRepoUrls[index] = value;
    setRepoUrls(newRepoUrls);
  }

  const filteredRoles = roles.filter(role =>
    role.toLowerCase().includes((targetRole || '').toLowerCase().trim())
  );
  const hasExactMatch = roles.some(role =>
    role.toLowerCase() === (targetRole || '').toLowerCase().trim()
  );

  if (isBuildingSession) {
    return (
      <section ref={loadingRef} className="mx-auto max-w-3xl py-12 min-h-[480px] flex items-center justify-center">
        <div className="w-full rounded-3xl border border-cyan-300/20 bg-cyan-300/[0.04] p-8 sm:p-12 text-center shadow-glow">
          <div className="mx-auto mb-6 h-12 w-12 animate-spin rounded-full border-4 border-cyan-300 border-t-transparent" />
          <h2 className="text-2xl font-semibold text-white">Building your personalized interview session</h2>
          <p className="mt-4 max-w-lg mx-auto text-sm leading-7 text-slate-400">
            We're analyzing your resume claims against your GitHub repositories to craft deep-dive technical questions for <span className="font-medium text-cyan-200">{targetRole || 'your target role'}</span>. This typically takes 10–20 seconds.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-6 text-xs uppercase tracking-[0.14em] text-slate-500">
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Parsing Resume & Skills
            </span>
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" style={{ animationDelay: '0.5s' }} />
              Fetching GitHub Source Code
            </span>
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" style={{ animationDelay: '1s' }} />
              Generating Tailored Questions
            </span>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="grid gap-8 py-10 lg:grid-cols-[1fr_1.15fr] lg:items-center lg:py-20">
      <div className="max-w-xl">
        <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-cyan-200">
          Repovet interview practice
        </p>
        <h1 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-[42px]">
          Practice interviews built around your actual work.
        </h1>
        <p className="mt-6 max-w-lg text-base leading-8 text-slate-400">
          We analyze your resume claims and GitHub project source code together to build a realistic practice interview tailored to your target role.
        </p>
        <div className="mt-9 grid max-w-md grid-cols-1 gap-3 text-xs text-slate-400 sm:grid-cols-3 sm:text-[11px]">
          <div className="rounded-xl border border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent p-3 transition hover:border-cyan-500/20">
            <span className="mb-1 block text-lg font-bold text-cyan-300">01</span>
            <span className="font-medium text-slate-400">Resume & Skills</span>
          </div>
          <div className="rounded-xl border border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent p-3 transition hover:border-cyan-500/20">
            <span className="mb-1 block text-lg font-bold text-cyan-300">02</span>
            <span className="font-medium text-slate-400">Project Code</span>
          </div>
          <div className="rounded-xl border border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent p-3 transition hover:border-cyan-500/20">
            <span className="mb-1 block text-lg font-bold text-cyan-300">03</span>
            <span className="font-medium text-slate-400">Feedback Report</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="rounded-3xl border border-white/10 bg-white/[0.045] p-5 shadow-glow sm:p-8">
        <div className="mb-8">
          <p className="text-sm font-medium text-cyan-200">Session Setup</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Start a practice session</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">Your resume is parsed in memory to generate custom questions for your session.</p>
        </div>

        <div className="space-y-5">
          <label className="block text-sm text-slate-300">
            Resume
            <span className={`mt-2 flex cursor-pointer items-center justify-between rounded-xl border border-dashed px-4 py-4 transition-all ${
              file 
                ? 'border-emerald-500/40 bg-emerald-500/[0.03] hover:border-emerald-400/60' 
                : 'border-slate-600 bg-slate-950/40 hover:border-cyan-300/60'
            }`}>
              <span className="flex items-center gap-3 min-w-0">
                {file ? (
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </span>
                ) : (
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-800 text-slate-400 shrink-0">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                    </svg>
                  </span>
                )}
                <span className="min-w-0">
                  <span className="block truncate font-medium text-slate-200">{file ? file.name : 'Upload PDF or DOCX'}</span>
                  <span className="mt-0.5 block text-2xs text-slate-500">Maximum file size: 10 MB</span>
                </span>
              </span>
              <span className={`ml-4 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                file 
                  ? 'bg-emerald-500/10 text-emerald-300' 
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}>
                {file ? 'Change' : 'Browse'}
              </span>
              <input className="sr-only" type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={handleFileChange} />
            </span>
          </label>

          {parsedResumeText && (
            <div className="rounded-xl border border-emerald-300/20 bg-emerald-300/[0.05] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-emerald-200">Resume text extracted successfully</p>
                  <p className="mt-1 text-xs text-slate-500">Review the extracted content before starting the interview.</p>
                </div>
                <button type="button" onClick={chooseDifferentFile} className="text-xs text-slate-400 underline decoration-slate-700 underline-offset-4 hover:text-white">Choose a different file</button>
              </div>
              <pre className="mt-4 max-h-56 overflow-auto whitespace-pre-wrap rounded-lg border border-white/10 bg-slate-950/40 p-3 text-xs leading-5 text-slate-400">{parsedResumeText.slice(0, 5000)}{parsedResumeText.length > 5000 ? '\n\n…Preview truncated' : ''}</pre>
            </div>
          )}

          <div className="block text-sm text-slate-300">
            <span className="mb-2 block">GitHub repositories <span className="text-slate-600">(optional)</span></span>
            <div className="space-y-3">
              {repoUrls.map((url, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                      <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                        <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z" />
                      </svg>
                    </span>
                    <input
                      value={url}
                      onChange={(event) => updateRepoUrl(index, event.target.value)}
                      type="url"
                      placeholder="https://github.com/you/project"
                      className="input-field flex-1 pl-10"
                    />
                  </div>
                  {repoUrls.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRepoUrl(index)}
                      className="shrink-0 rounded-lg p-2.5 text-slate-500 transition hover:bg-white/5 hover:text-white"
                      title="Remove repository"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
            {repoUrls.length < 5 && (
              <button
                type="button"
                onClick={addRepoUrl}
                className="mt-3 text-xs font-medium text-cyan-400 transition hover:text-cyan-300 flex items-center gap-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Add another repository
              </button>
            )}
          </div>

          <label className="block text-sm text-slate-300">
            Target role
            <div ref={dropdownRef} className="relative mt-2">
              <div className="relative">
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => {
                    setTargetRole(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      setIsDropdownOpen(false);
                    } else if (e.key === 'Escape') {
                      setIsDropdownOpen(false);
                    }
                  }}
                  placeholder="Type or select a role (e.g. Frontend Engineer, Student...)"
                  aria-expanded={isDropdownOpen}
                  className="w-full rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-slate-200 pr-10 transition hover:border-cyan-300/60 focus:border-cyan-300 focus:outline-none"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-cyan-300 p-1"
                  aria-label="Toggle role options"
                >
                  <svg
                    className={`h-4 w-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-cyan-300' : ''}`}
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {isDropdownOpen && (
                <ul role="listbox" aria-label="Target role" className="absolute z-20 mt-2 max-h-60 w-full overflow-auto no-scrollbar rounded-xl border border-white/10 bg-slate-900 p-1.5 shadow-2xl shadow-slate-950/80 backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-150">
                  {filteredRoles.length > 0 ? (
                    filteredRoles.map((role) => (
                      <li key={role}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={targetRole === role}
                          onClick={() => {
                            setTargetRole(role);
                            setIsDropdownOpen(false);
                          }}
                          className={`flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                            targetRole === role
                              ? 'bg-cyan-300 text-slate-950 font-semibold'
                              : 'text-slate-300 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          {role}
                        </button>
                      </li>
                    ))
                  ) : (
                    <li>
                      <button
                        type="button"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm text-cyan-300 bg-cyan-300/10 font-medium"
                      >
                        ✦ Use custom role: "{targetRole}"
                      </button>
                    </li>
                  )}
                  {!hasExactMatch && targetRole.trim() && filteredRoles.length > 0 && (
                    <li className="border-t border-white/5 mt-1 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex w-full items-center rounded-lg px-3 py-2.5 text-left text-xs text-cyan-300 hover:bg-cyan-300/10 font-medium"
                      >
                        ✦ Use custom role: "{targetRole.trim()}"
                      </button>
                    </li>
                  )}
                </ul>
              )}
            </div>
          </label>

          <label className="block text-sm text-slate-300">
            Interview length
            <span className="mt-2 flex items-center gap-3">
              <input value={questionCount} onChange={(event) => setQuestionCount(event.target.value)} type="number" min="3" max="10" step="1" className="input-field w-24" />
              <span className="shrink-0 text-xs text-slate-500">questions · choose 3–10</span>
            </span>
          </label>
        </div>

        {error && <p className="mt-5 rounded-lg bg-rose-400/10 px-3 py-2 text-sm text-rose-200">{error}</p>}

        <button disabled={isLoading} type="submit" className="mt-7 flex w-full items-center justify-center rounded-xl bg-cyan-300 px-4 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-wait disabled:opacity-60">
          {isLoading ? (parsedResumeText ? 'Analyzing repos and generating tailored questions...' : 'Reading and validating resume...') : parsedResumeText ? 'Confirm resume and build interview' : 'Scan resume'}
        </button>
      </form>
    </section>
  );
}

