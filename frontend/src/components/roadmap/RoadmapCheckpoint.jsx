export default function RoadmapCheckpoint({ node, status }) {
  const isCleared = status === 'cleared';
  const isInProgress = status === 'in_progress';
  const isLocked = status === 'locked';

  let bgColor = 'bg-slate-900';
  let borderColor = 'border-slate-700/50';
  let borderStyle = isLocked ? 'border-dashed' : 'border-solid';
  let textColor = 'text-slate-500';
  let icon = null;

  if (isCleared) {
    bgColor = 'bg-cyan-900/30';
    borderColor = 'border-cyan-300/40';
    textColor = 'text-cyan-200';
    icon = <svg className="w-3.5 h-3.5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6 9 17l-5-5"/></svg>;
  } else if (isInProgress) {
    borderColor = 'border-cyan-300/30';
    textColor = 'text-slate-300';
    icon = <span className="w-1.5 h-1.5 mr-2 rounded-full bg-cyan-400" />;
  } else {
    icon = <svg className="w-3.5 h-3.5 mr-2 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
  }

  return (
    <div className="relative z-10 w-full max-w-sm py-4">
      <div className={`flex items-center justify-center px-4 py-2.5 rounded-full border-2 ${bgColor} ${borderColor} ${borderStyle}`}>
        {icon}
        <span className={`text-xs font-bold uppercase tracking-[0.14em] ${textColor}`}>
          {node.label}
        </span>
      </div>
    </div>
  );
}
