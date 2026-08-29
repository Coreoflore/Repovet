import { useState } from 'react';
import RoadmapNode from './RoadmapNode.jsx';
import RoadmapCheckpoint from './RoadmapCheckpoint.jsx';

export default function RoadmapPhase({ phase, statusMap, currentPosition, nodeDetails }) {
  const [isExpanded, setIsExpanded] = useState(true);

  let lineColor = 'border-slate-700';
  let headerColor = 'text-slate-200 bg-slate-800';
  
  if (phase.colorRole === 'frontend') {
    lineColor = 'border-cyan-400/20';
    headerColor = 'text-cyan-200 bg-cyan-900/20';
  } else if (phase.colorRole === 'backend') {
    lineColor = 'border-indigo-400/20';
    headerColor = 'text-indigo-200 bg-indigo-900/20';
  } else if (phase.colorRole === 'devops') {
    lineColor = 'border-fuchsia-400/20';
    headerColor = 'text-fuchsia-200 bg-fuchsia-900/20';
  }

  return (
    <div className="mb-6 sm:mb-8">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className={`flex w-full items-center justify-between px-5 py-3.5 rounded-xl border border-white/5 transition-colors hover:bg-white/5 ${headerColor}`}
      >
        <span className="text-sm font-semibold uppercase tracking-[0.16em]">{phase.label}</span>
        <svg className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
      </button>

      {isExpanded && (
        <div className="relative mt-6 ml-2 sm:ml-6">
          <div className={`absolute top-0 bottom-0 left-[19px] w-0 border-l-2 ${lineColor} z-0`}></div>

          <div className="flex flex-col">
            {phase.nodes.map(node => {
              const status = statusMap[node.id] || 'not_assessed';
              const isCurrent = node.id === currentPosition;

              if (node.type === 'checkpoint') {
                return (
                  <div key={node.id} className="relative z-10 w-full -ml-3 sm:-ml-2">
                    <RoadmapCheckpoint node={node} status={status} />
                  </div>
                );
              }

              return (
                <RoadmapNode 
                  key={node.id} 
                  node={node} 
                  status={status} 
                  details={nodeDetails?.[node.id]} 
                  isCurrent={isCurrent} 
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
