export function computeRoadmapProgress(roadmap, strengths, gaps) {
  const statusMap = {};
  
  for (const phase of roadmap.phases) {
    for (const node of phase.nodes) {
      statusMap[node.id] = 'not_assessed';
    }
  }

  const nodeEvidence = {};
  const nodeDetails = {};
  
  for (const s of strengths) {
    if (s.roadmapNodeId && statusMap[s.roadmapNodeId]) {
      nodeEvidence[s.roadmapNodeId] = nodeEvidence[s.roadmapNodeId] || { s: 0, g: 0 };
      nodeEvidence[s.roadmapNodeId].s++;
      
      nodeDetails[s.roadmapNodeId] = nodeDetails[s.roadmapNodeId] || { strengths: [], gaps: [] };
      nodeDetails[s.roadmapNodeId].strengths.push(s.text);
    }
  }
  for (const g of gaps) {
    if (g.roadmapNodeId && statusMap[g.roadmapNodeId]) {
      nodeEvidence[g.roadmapNodeId] = nodeEvidence[g.roadmapNodeId] || { s: 0, g: 0 };
      nodeEvidence[g.roadmapNodeId].g++;
      
      nodeDetails[g.roadmapNodeId] = nodeDetails[g.roadmapNodeId] || { strengths: [], gaps: [] };
      nodeDetails[g.roadmapNodeId].gaps.push(g.text);
    }
  }

  for (const [id, ev] of Object.entries(nodeEvidence)) {
    if (ev.s > 0 && ev.g > 0) {
      statusMap[id] = 'developing';
    } else if (ev.s > 0) {
      statusMap[id] = 'mastered';
    } else if (ev.g > 0) {
      statusMap[id] = 'gap';
    }
  }

  for (const phase of roadmap.phases) {
    let ungatedNodes = [];
    for (const node of phase.nodes) {
      if (node.type === 'checkpoint') {
        const requires = node.requires || ungatedNodes.map(n => n.id);
        if (requires.length === 0) {
          statusMap[node.id] = 'cleared';
        } else {
          let allMastered = true;
          let anyTouched = false;

          for (const req of requires) {
            const st = statusMap[req];
            if (st === 'mastered') {
              anyTouched = true;
            } else if (st === 'developing' || st === 'gap') {
              allMastered = false;
              anyTouched = true;
            } else {
              allMastered = false;
            }
          }

          if (allMastered) statusMap[node.id] = 'cleared';
          else if (anyTouched) statusMap[node.id] = 'in_progress';
          else statusMap[node.id] = 'locked';
        }
        ungatedNodes = [];
      } else {
        ungatedNodes.push(node);
      }
    }
  }

  let currentPosition = null;
  let allCleared = true;
  for (const phase of roadmap.phases) {
    for (const node of phase.nodes) {
      const isCleared = (node.type === 'checkpoint') ? (statusMap[node.id] === 'cleared') : (statusMap[node.id] === 'mastered');
      if (!isCleared && !currentPosition) {
        currentPosition = node.id;
        allCleared = false;
      }
    }
  }

  if (allCleared) {
    const lastPhase = roadmap.phases[roadmap.phases.length - 1];
    currentPosition = lastPhase.nodes[lastPhase.nodes.length - 1].id;
  }

  return {
    nodeStatuses: statusMap,
    currentPosition,
    nodeDetails
  };
}
