import RoadmapPhase from './RoadmapPhase.jsx';
import { fullStackRoadmap } from '../../roadmaps/fullStack.js';

export default function FullStackRoadmap({ roadmapProgress }) {
  if (!roadmapProgress) return null;

  const { nodeStatuses, currentPosition, nodeDetails } = roadmapProgress;

  return (
    <section className="mt-8 animate-in fade-in duration-500">
      <div className="mb-10 flex flex-wrap gap-x-6 gap-y-3 rounded-2xl border border-white/10 bg-white/[0.02] p-5 shadow-sm text-sm">
        <div className="flex items-center gap-2.5">
          <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg>
          <span className="text-slate-300 font-medium">Mastered</span>
        </div>
        <div className="flex items-center gap-2.5">
          <svg className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4" fill="currentColor"/></svg>
          <span className="text-slate-300 font-medium">Developing</span>
        </div>
        <div className="flex items-center gap-2.5">
          <svg className="w-4 h-4 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m18 6-12 12"/><path d="m6 6 12 12"/></svg>
          <span className="text-slate-300 font-medium">Gap</span>
        </div>
        <div className="flex items-center gap-2.5">
          <svg className="w-4 h-4 text-slate-500 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/></svg>
          <span className="text-slate-500 font-medium">Not Assessed</span>
        </div>
      </div>

      <div className="mx-auto max-w-4xl">
        {fullStackRoadmap.phases.map((phase) => (
          <RoadmapPhase 
            key={phase.id} 
            phase={phase} 
            statusMap={nodeStatuses || {}} 
            currentPosition={currentPosition} 
            nodeDetails={nodeDetails || {}} 
          />
        ))}
      </div>
    </section>
  );
}
