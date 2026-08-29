import { useState, useRef, useEffect } from 'react';
import MarkdownRenderer from '../MarkdownRenderer.jsx';

export default function RoadmapNode({ node, status, details, isCurrent }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isTopic = node.type === 'topic';
  const isMastered = status === 'mastered';
  const isDeveloping = status === 'developing';
  const isGap = status === 'gap';
  const isNotAssessed = status === 'not_assessed';

  let bgColor = 'bg-slate-800';
  let borderColor = 'border-slate-700';
  let iconColor = 'text-slate-500';
  let icon = null;

  if (isMastered) {
    bgColor = 'bg-emerald-300/10';
    borderColor = 'border-emerald-300/30';
    iconColor = 'text-emerald-400';
    icon = <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg>;
  } else if (isGap) {
    bgColor = 'bg-rose-400/10';
    borderColor = 'border-rose-400/30';
    iconColor = 'text-rose-400';
    icon = <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m18 6-12 12"/><path d="m6 6 12 12"/></svg>;
  } else if (isDeveloping) {
    bgColor = 'bg-amber-300/10';
    borderColor = 'border-amber-300/30';
    iconColor = 'text-amber-400';
    icon = <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4" fill="currentColor"/></svg>;
  } else {
    icon = <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/></svg>;
  }

  const shapeClass = isTopic ? 'rounded-full' : 'rounded-lg';
  const borderStyle = node.optional ? 'border-dashed border-2' : 'border';
  const opacity = isNotAssessed ? 'opacity-60 hover:opacity-100' : 'opacity-100';

  return (
    <div className="relative flex items-center gap-4 py-3" ref={containerRef}>
      <button 
        className={`relative z-10 flex shrink-0 items-center justify-center w-10 h-10 ${shapeClass} ${bgColor} ${borderColor} ${borderStyle} ${iconColor} ${opacity} transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-cyan-300`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`${node.label} - ${status.replace('_', ' ')}`}
        aria-expanded={isOpen}
      >
        {isCurrent && (
          <span className="absolute inset-0 block rounded-full animate-ping bg-cyan-400 opacity-30"></span>
        )}
        {icon}
      </button>

      <div className="flex flex-col">
        <span className="text-sm font-medium text-slate-200">
          {node.label}
          {node.optional && <span className="ml-2 text-[10px] uppercase tracking-wider text-slate-500">Optional</span>}
        </span>
        {isCurrent && <span className="text-xs font-semibold text-cyan-300">You are here</span>}
      </div>

      {isOpen && (
        <div className="absolute left-14 top-10 z-20 w-64 sm:w-80 p-4 mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl">
          <h4 className="font-semibold text-white mb-2">{node.label}</h4>
          {node.note && <p className="text-xs text-slate-400 mb-3 leading-relaxed">{node.note}</p>}
          
          {details?.strengths?.length > 0 && (
            <div className="mb-3">
              <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold">Evidenced</span>
              <ul className="mt-1.5 space-y-2">
                {details.strengths.map((s, i) => <li key={i} className="text-xs text-slate-300 leading-relaxed"><MarkdownRenderer text={s} className="inline" /></li>)}
              </ul>
            </div>
          )}
          {details?.gaps?.length > 0 && (
            <div>
              <span className="text-[10px] uppercase tracking-wider text-rose-400 font-semibold">Gap</span>
              <ul className="mt-1.5 space-y-2">
                {details.gaps.map((g, i) => <li key={i} className="text-xs text-slate-300 leading-relaxed"><MarkdownRenderer text={g} className="inline" /></li>)}
              </ul>
            </div>
          )}
          {!details?.strengths?.length && !details?.gaps?.length && (
            <p className="text-xs text-slate-500 italic">No specific evidence recorded for this topic in the current evaluation.</p>
          )}
        </div>
      )}
    </div>
  );
}
