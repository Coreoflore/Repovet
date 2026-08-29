import { useState } from 'react';
import MarkdownRenderer from './MarkdownRenderer.jsx';
import FullStackRoadmap from './roadmap/FullStackRoadmap.jsx';

function ListSection({ title, items, className = '' }) {
  return (
    <section className={`rounded-2xl border border-white/10 bg-white/[0.035] p-5 sm:p-6 ${className}`}>
      <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">{title}</h2>
      <ul className="mt-4 space-y-3">
        {items.length > 0 ? items.map((item, index) => (
          <li key={`${item}-${index}`} className="flex gap-3 text-sm leading-6 text-slate-300">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
            <span><MarkdownRenderer text={String(item)} className="inline" /></span>
          </li>
        )) : <li className="text-sm text-slate-500">No items were returned.</li>}
      </ul>
    </section>
  );
}

function ScoreBar({ score }) {
  const boundedScore = Math.max(0, Math.min(100, Number(score) || 0));
  const color = boundedScore >= 75 ? 'bg-emerald-300' : boundedScore >= 50 ? 'bg-amber-300' : 'bg-rose-300';

  return (
    <div className="flex items-center gap-3">
      <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-800">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${boundedScore}%` }} />
      </div>
      <span className="text-sm font-semibold text-white">{boundedScore}/100</span>
    </div>
  );
}

function AnswerReviewSection({ reviews }) {
  if (reviews.length === 0) return null;

  return (
    <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.035] p-5 sm:p-6">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">Answer-by-answer feedback</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">These scores reflect the evidence in each answer, not just the resume.</p>
      </div>
      <div className="mt-5 space-y-4">
        {reviews.map((review, index) => (
          <article key={`${review.question_id || 'question'}-${index}`} className="rounded-xl border border-white/10 bg-slate-950/30 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="font-medium text-white">Question {Number(review.question_id) + 1}</h3>
              <ScoreBar score={review.score} />
            </div>
            {review.feedback && <MarkdownRenderer text={review.feedback} className="mt-4 text-sm leading-6 text-slate-300" />}
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {Array.isArray(review.strengths) && review.strengths.length > 0 && (
                <ListSection title="What worked" items={review.strengths} className="border-emerald-300/10 bg-emerald-300/[0.04]" />
              )}
              {Array.isArray(review.gaps) && review.gaps.length > 0 && (
                <ListSection title="What to improve" items={review.gaps} className="border-amber-300/10 bg-amber-300/[0.04]" />
              )}
            </div>
            {review.evidence_quote && (
              <blockquote className="mt-4 border-l-2 border-cyan-300/40 pl-3 text-xs leading-5 text-slate-500 font-mono">“<MarkdownRenderer text={review.evidence_quote} className="inline" />”</blockquote>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

function EvidenceSection({ evidence }) {
  if (evidence.length === 0) return null;

  return (
    <section className="mt-6 rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.04] p-5 sm:p-6">
      <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-200">Evidence and signals</h2>
      <div className="mt-4 space-y-4">
        {evidence.map((item, index) => (
          <article key={`${item.claim}-${index}`} className="rounded-xl border border-white/10 bg-slate-950/25 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-cyan-300/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-200">{item.source}</span>
              <h3 className="text-sm font-medium text-white">{item.claim}</h3>
            </div>
            <MarkdownRenderer text={item.detail} className="mt-2 text-sm leading-6 text-slate-300" />
            {item.quote && <blockquote className="mt-3 border-l-2 border-cyan-300/40 pl-3 text-xs leading-5 text-slate-500 font-mono">“<MarkdownRenderer text={item.quote} className="inline" />”</blockquote>}
          </article>
        ))}
      </div>
    </section>
  );
}

export default function ReportView({ report, targetRole, onRestart, onDelete }) {
  const [viewMode, setViewMode] = useState('candidate');
  const strengths = Array.isArray(report.strengths) ? report.strengths : [];
  const gaps = Array.isArray(report.gaps) ? report.gaps : [];
  const nextSteps = Array.isArray(report.next_steps) ? report.next_steps : [];
  const answerReviews = Array.isArray(report.answer_reviews) ? report.answer_reviews : [];
  const evidence = Array.isArray(report.evidence) ? report.evidence : [];
  const answerQuality = report.answer_quality || {};
  const undefendedProject = report.undefended_project || {};

  return (
    <section className="mx-auto max-w-5xl py-8 sm:py-16">
      <div className="mb-9 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-cyan-200">Interview complete · {targetRole}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-5xl">The evidence report.</h1>
        </div>
        <div className="flex flex-wrap gap-3 self-start sm:self-auto">
          <button onClick={onRestart} className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white">Start another</button>
          {onDelete && <button onClick={onDelete} className="rounded-xl border border-rose-400/30 px-4 py-2.5 text-sm text-rose-200 transition hover:border-rose-300/60 hover:text-white">Delete session data</button>}
        </div>
      </div>

      <div className="mb-6 rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-5 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">Overall verdict</p>
        <p className="mt-4 text-3xl font-semibold text-white sm:text-4xl">{report.recommended_level || 'Needs further review'}</p>
        {Number.isFinite(Number(answerQuality.answered_count)) && <p className="mt-4 text-xs font-medium uppercase tracking-[0.14em] text-cyan-100/70">Answer evidence: {answerQuality.substantive_count || 0} of {answerQuality.answered_count} answers contained enough substance</p>}
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">This recommendation weighs resume claims, repository evidence, and the quality of the candidate’s answers together.</p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-white/[0.035] p-2" role="tablist" aria-label="Report view">
        <button type="button" role="tab" aria-selected={viewMode === 'candidate'} onClick={() => setViewMode('candidate')} className={`rounded-xl px-4 py-2.5 text-sm transition ${viewMode === 'candidate' ? 'bg-cyan-300 text-slate-950' : 'text-slate-400 hover:text-white'}`}>Candidate feedback</button>
        <button type="button" role="tab" aria-selected={viewMode === 'evidence'} onClick={() => setViewMode('evidence')} className={`rounded-xl px-4 py-2.5 text-sm transition ${viewMode === 'evidence' ? 'bg-cyan-300 text-slate-950' : 'text-slate-400 hover:text-white'}`}>Evidence review</button>
        {report.roadmapProgress && (
          <button type="button" role="tab" aria-selected={viewMode === 'roadmap'} onClick={() => setViewMode('roadmap')} className={`rounded-xl px-4 py-2.5 text-sm transition ${viewMode === 'roadmap' ? 'bg-cyan-300 text-slate-950' : 'text-slate-400 hover:text-white'}`}>Your Full-Stack Roadmap</button>
        )}
      </div>

      {viewMode !== 'roadmap' && (
        <div className="grid gap-6 md:grid-cols-2">
          <ListSection title="Strengths" items={strengths} className="border-emerald-300/20 bg-emerald-300/[0.06] text-emerald-300" />
          <ListSection title="Gaps" items={gaps} className="border-amber-300/20 bg-amber-300/[0.06] text-amber-300" />
        </div>
      )}

      {viewMode === 'evidence' && <section className="mt-6 rounded-2xl border border-rose-400/40 bg-rose-400/[0.09] p-6 shadow-[0_0_50px_rgba(251,113,133,0.08)] sm:p-8">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-rose-400/20 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-rose-200">Attention required</span>
          <span className="text-xs text-rose-200/60">Least defended project</span>
        </div>
        <h2 className="mt-5 text-2xl font-semibold text-white">{undefendedProject.name || 'No project identified'}</h2>
        <MarkdownRenderer text={undefendedProject.reason || 'The answers did not provide enough evidence to defend a specific project.'} className="mt-3 max-w-3xl text-sm leading-7 text-rose-100/80" />
      </section>}

      {viewMode === 'candidate' && <div className="mt-6">
        <ListSection title="Recommended next steps for you" items={nextSteps} />
      </div>}

      {viewMode === 'candidate' && <AnswerReviewSection reviews={answerReviews} />}
      {viewMode === 'evidence' && <EvidenceSection evidence={evidence} />}
      
      {viewMode === 'roadmap' && report.roadmapProgress && (
        <FullStackRoadmap roadmapProgress={report.roadmapProgress} />
      )}
    </section>
  );
}
