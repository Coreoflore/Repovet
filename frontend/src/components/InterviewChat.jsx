import { useEffect, useMemo, useState } from 'react';
import MarkdownRenderer from './MarkdownRenderer.jsx';

function draftKey(sessionId, questionIndex) {
  return `repovet:draft:${sessionId}:${questionIndex}`;
}

function readDraft(sessionId, questionIndex) {
  try {
    return window.localStorage.getItem(draftKey(sessionId, questionIndex)) || '';
  } catch {
    return '';
  }
}

function removeDraft(sessionId, questionIndex) {
  try {
    window.localStorage.removeItem(draftKey(sessionId, questionIndex));
  } catch {
    // Draft persistence is optional.
  }
}

export default function InterviewChat({ questions, sessionId, onAnswer, onFinish, isFinishing, onCancel, initialIndex = 0 }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [answer, setAnswer] = useState(() => readDraft(sessionId, initialIndex));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [error, setError] = useState('');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [voices, setVoices] = useState([]);

  const questionList = Array.isArray(questions) ? questions : [];
  const totalQuestions = questionList.length;
  const question = questionList[currentIndex];
  const isLastQuestion = currentIndex === totalQuestions - 1;
  const progress = totalQuestions > 0
    ? Math.min(100, Math.max(0, ((currentIndex + 1) / totalQuestions) * 100))
    : 0;

  useEffect(() => {
    const loadVoices = () => {
      if (window.speechSynthesis) {
        setVoices(window.speechSynthesis.getVoices());
      }
    };

    loadVoices();
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  useEffect(() => {
    const handleRequestExit = () => setShowExitModal(true);
    window.addEventListener('requestExitInterview', handleRequestExit);
    return () => window.removeEventListener('requestExitInterview', handleRequestExit);
  }, []);

  useEffect(() => {
    window.speechSynthesis?.cancel();
    setIsPlayingAudio(false);
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, [currentIndex]);

  const preferredVoice = useMemo(() => {
    const maleKeywords = ['male', 'guy', 'david', 'mark', 'george', 'ryan', 'thomas', 'stefan', 'christopher', 'eric', 'james', 'richard'];

    const scoredVoices = voices
      .filter(v => v.lang.toLowerCase().startsWith('en'))
      .map(v => {
        let score = 0;
        const name = v.name.toLowerCase();
        if (maleKeywords.some(keyword => name.includes(keyword))) score += 200;
        if (name.includes('natural')) score += 100;
        if (name.includes('google') || name.includes('siri')) score += 50;
        if (v.lang.toLowerCase() === 'en-us') score += 10;
        else if (v.lang.toLowerCase() === 'en-gb') score += 5;
        return { voice: v, score };
      })
      .sort((a, b) => b.score - a.score);

    return scoredVoices.length > 0 ? scoredVoices[0].voice : null;
  }, [voices]);

  function handleSpeak() {
    if (!window.speechSynthesis) {
      alert('Text-to-speech is not supported in this browser.');
      return;
    }

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    window.speechSynthesis.cancel();

    const cleanText = (question?.text || '')
      .replace(/[`*_#~\[\]]/g, '')
      .replace(/https?:\/\/[^\s]+/g, 'link');

    const utterance = new SpeechSynthesisUtterance(cleanText);

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    // Professional measured pacing and slightly deeper male tone
    utterance.rate = 0.90;
    utterance.pitch = 0.97;

    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    setIsPlayingAudio(true);
    window.speechSynthesis.speak(utterance);
  }

  useEffect(() => {
    if (!sessionId) return;
    try {
      if (answer.trim()) window.localStorage.setItem(draftKey(sessionId, currentIndex), answer);
      else window.localStorage.removeItem(draftKey(sessionId, currentIndex));
    } catch {
      // Draft persistence is optional.
    }
  }, [answer, currentIndex, sessionId]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!answer.trim()) {
      setError('Write an answer before continuing.');
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      await onAnswer(String(currentIndex), answer.trim());
      removeDraft(sessionId, currentIndex);
      if (isLastQuestion) {
        await onFinish();
      } else {
        const nextIndex = currentIndex + 1;
        setCurrentIndex(nextIndex);
        setAnswer(readDraft(sessionId, nextIndex));
      }
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!question) {
    return (
      <section className="mx-auto max-w-3xl py-16">
        <div className="rounded-3xl border border-rose-400/30 bg-rose-400/10 p-8 text-center">
          <h1 className="text-2xl font-semibold text-white">No interview questions are available.</h1>
          <p className="mt-3 text-sm leading-6 text-rose-100/80">The session did not return a usable question list. Please start a new session.</p>
        </div>
      </section>
    );
  }

  if (isFinishing) {
    return (
      <section className="mx-auto max-w-3xl py-16">
        <div className="rounded-3xl border border-cyan-300/20 bg-cyan-300/[0.04] p-10 text-center shadow-glow">
          <div className="mx-auto mb-6 h-12 w-12 animate-spin rounded-full border-4 border-cyan-300 border-t-transparent" />
          <h1 className="text-2xl font-semibold text-white">Generating your evaluation report</h1>
          <p className="mt-4 max-w-lg mx-auto text-sm leading-7 text-slate-400">
            We're analyzing your answers against the repository evidence and resume claims. This typically takes 15–30 seconds.
          </p>
          <div className="mt-8 flex justify-center gap-8 text-xs uppercase tracking-[0.14em] text-slate-500">
            <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />Grading answers</span>
            <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" style={{ animationDelay: '0.5s' }} />Cross-referencing evidence</span>
            <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" style={{ animationDelay: '1s' }} />Writing report</span>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl">
      <div className="mb-9 flex items-end justify-between">
        <div>
          <p className="text-sm font-medium text-cyan-200">Live interview</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Defend your work.</h1>
        </div>
        <p className="text-sm text-slate-500">Question {currentIndex + 1} of {totalQuestions}</p>
      </div>

      <div className="h-1 w-full overflow-hidden rounded-full bg-slate-800">
        <div className="h-full bg-gradient-to-r from-cyan-300 to-indigo-400 transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.045] p-5 shadow-glow sm:p-10">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.15em] text-slate-500">
            <span className="rounded-full bg-cyan-300/10 px-3 py-1.5 text-cyan-200">{question.type || 'technical'}</span>
            <span className="rounded-full bg-slate-800 px-3 py-1.5">{question.difficulty || 'medium'} difficulty</span>
          </div>
          <button
            type="button"
            onClick={handleSpeak}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
              isPlayingAudio 
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)] hover:bg-rose-500/30' 
                : 'bg-cyan-300/10 text-cyan-300 border border-cyan-500/20 hover:bg-cyan-300/20'
            }`}
            title={isPlayingAudio ? 'Stop reading' : 'Read question'}
          >
            {isPlayingAudio ? (
              <>
                <svg className="h-3.5 w-3.5 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
                Stop Listening
              </>
            ) : (
              <>
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M12 18.75V5.25L7.5 9H4.5v6h3L12 18.75z" />
                </svg>
                Listen to Question
              </>
            )}
          </button>
        </div>
        <div className="mt-7 text-2xl font-medium leading-relaxed text-white sm:text-3xl" role="heading" aria-level="2">
          <MarkdownRenderer text={question.text} />
        </div>
        {question.targets?.length > 0 && <p className="mt-5 text-sm text-slate-500">Looking for evidence of: {question.targets.join(', ')}</p>}

        <form onSubmit={handleSubmit} className="mt-9">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="block text-sm font-medium text-slate-300" htmlFor="answer">Your answer</label>
            <span className="text-xs text-slate-600">{answer.trim().length} characters · saved locally</span>
          </div>
          <textarea id="answer" value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="Walk through your reasoning, trade-offs, and what you would do differently..." rows="8" className="input-field mt-3 resize-y leading-7" />
          {answer.trim().includes('`') && (
            <div className="mt-4 rounded-xl border border-white/5 bg-slate-950/20 p-4">
              <p className="text-2xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Format Preview</p>
              <MarkdownRenderer text={answer} className="text-sm leading-6 text-slate-300" />
            </div>
          )}
          {error && <p className="mt-3 text-sm text-rose-200">{error}</p>}
          <button disabled={isSubmitting || isFinishing} className="mt-6 w-full rounded-xl bg-cyan-300 px-4 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-wait disabled:opacity-60" type="submit">
            {isFinishing ? 'Writing your report...' : isSubmitting ? 'Saving answer...' : isLastQuestion ? 'Finish interview' : 'Submit answer'}
          </button>
          <button
            type="button"
            disabled={isSubmitting || isFinishing}
            onClick={() => setShowExitModal(true)}
            className="mt-3 w-full rounded-xl border border-slate-800 bg-slate-950/20 px-4 py-3.5 text-sm font-semibold text-slate-400 transition hover:border-slate-700 hover:text-white hover:bg-slate-900/40 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Cancel and Exit
          </button>
        </form>
      </div>
      <p className="mt-5 text-center text-xs text-slate-600">Specific examples are more useful than perfect answers.</p>

      {/* Exit confirmation modal */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-semibold text-white">Exit Interview?</h3>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Are you sure you want to exit? Your answers entered so far will be lost and this session will be permanently deleted.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowExitModal(false)}
                className="rounded-xl border border-slate-700 bg-slate-950/20 px-4 py-2.5 text-xs font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowExitModal(false);
                  onCancel();
                }}
                className="rounded-xl bg-rose-500 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-rose-400 hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]"
              >
                Yes, Exit Session
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
