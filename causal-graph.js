/**
 * Causal Self — Personal Causal Graph Engine (Step 4)
 * Calculates empirical co-occurrence and correlation between logged variables.
 * Renders an interactive SVG causal network with node inspection and filtering.
 */

class PersonalCausalGraph {
  constructor() {
    this.selectedNodeId = null;
    this.activeFilter = 'all'; // 'all', 'positive', 'negative'
  }

  init() {
    this.graphContainer = document.getElementById('causal-graph-canvas');
    this.inspectorContainer = document.getElementById('causal-inspector-panel');
    this.setupControls();
    this.render();
  }

  setupControls() {
    const filterBtns = document.querySelectorAll('.graph-filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeFilter = btn.getAttribute('data-filter') || 'all';
        this.render();
      });
    });
  }

  // ==========================================================================
  // Causal & Correlation Analysis
  // ==========================================================================

  computeCausalModel() {
    const logs = window.causalStorage.getLogs();
    const totalLogs = logs.length;

    if (totalLogs === 0) {
      return { nodes: [], edges: [], totalLogs: 0 };
    }

    // 1. Collect frequencies & impact on Mood & Energy for each tag
    const tagStats = {};

    const registerTag = (tag, category, log) => {
      if (!tagStats[tag]) {
        tagStats[tag] = {
          id: tag,
          label: tag,
          category,
          count: 0,
          moodSumWith: 0,
          energySumWith: 0,
          coOccurrences: {}
        };
      }
      tagStats[tag].count++;
      tagStats[tag].moodSumWith += log.mood;
      tagStats[tag].energySumWith += log.energy;
    };

    logs.forEach(log => {
      const allLogTags = [
        ...log.inputs.map(t => ({ tag: t, cat: 'input' })),
        ...log.activities.map(t => ({ tag: t, cat: 'activity' })),
        ...log.people.map(t => ({ tag: t, cat: 'person' })),
        ...log.outcomes.map(t => ({ tag: t, cat: 'outcome' }))
      ];

      // Add high/low mood as outcome nodes if relevant
      if (log.mood >= 8) allLogTags.push({ tag: 'High Mood (8+)', cat: 'outcome' });
      if (log.mood <= 5) allLogTags.push({ tag: 'Low Mood (≤5)', cat: 'outcome' });

      allLogTags.forEach(({ tag, cat }) => {
        registerTag(tag, cat, log);
      });

      // Pairwise co-occurrences
      for (let i = 0; i < allLogTags.length; i++) {
        for (let j = 0; j < allLogTags.length; j++) {
          if (i !== j) {
            const src = allLogTags[i].tag;
            const tgt = allLogTags[j].tag;
            tagStats[src].coOccurrences[tgt] = (tagStats[src].coOccurrences[tgt] || 0) + 1;
          }
        }
      }
    });

    // 2. Select top significant nodes across categories
    const nodes = [];
    const minOccurrences = Math.max(1, Math.floor(totalLogs * 0.12));

    Object.values(tagStats).forEach(item => {
      if (item.count >= minOccurrences) {
        const avgMoodWith = item.moodSumWith / item.count;
        const avgEnergyWith = item.energySumWith / item.count;
        
        nodes.push({
          id: item.id,
          label: item.label,
          category: item.category,
          count: item.count,
          avgMood: Math.round(avgMoodWith * 10) / 10,
          avgEnergy: Math.round(avgEnergyWith * 10) / 10
        });
      }
    });

    // 3. Calculate edges (Causes: Inputs / Activities -> Effects: Outcomes / States)
    const edges = [];
    const causeNodes = nodes.filter(n => n.category === 'input' || n.category === 'activity');
    const effectNodes = nodes.filter(n => n.category === 'outcome');

    causeNodes.forEach(c => {
      effectNodes.forEach(e => {
        const coCount = (tagStats[c.id] && tagStats[c.id].coOccurrences[e.id]) || 0;
        if (coCount >= 2) {
          // Probability of outcome given cause: P(E | C)
          const pGivenCause = coCount / c.count;
          // Baseline probability of outcome: P(E)
          const pBaseline = e.count / totalLogs;
          // Uplift: P(E | C) - P(E)
          const uplift = pGivenCause - pBaseline;

          // Only keep statistically interesting connections
          if (Math.abs(uplift) >= 0.15) {
            edges.push({
              source: c.id,
              target: e.id,
              weight: Math.round(uplift * 100) / 100,
              upliftPercent: Math.round(uplift * 100),
              pGivenCause: Math.round(pGivenCause * 100),
              coCount
            });
          }
        }
      });
    });

    return { nodes, edges, totalLogs, tagStats };
  }

  // ==========================================================================
  // Layout & SVG Render
  // ==========================================================================

  render() {
    if (!this.graphContainer) return;

    const { nodes, edges, totalLogs, tagStats } = this.computeCausalModel();

    if (totalLogs === 0 || nodes.length === 0) {
      this.graphContainer.innerHTML = `
        <div class="empty-graph-state">
          <div class="empty-icon-wrapper">🕸</div>
          <h3>No Causal Data Available Yet</h3>
          <p>Log a few daily entries to start mapping your personal causal network.</p>
        </div>
      `;
      return;
    }

    // Partition nodes into 3 columns: Inputs (left), Activities (center), Outcomes (right)
    const cols = {
      input: nodes.filter(n => n.category === 'input'),
      activity: nodes.filter(n => n.category === 'activity'),
      outcome: nodes.filter(n => n.category === 'outcome')
    };

    const width = 820;
    const height = Math.max(480, Math.max(cols.input.length, cols.activity.length, cols.outcome.length) * 68 + 80);

    const xCoords = {
      input: 130,
      activity: 410,
      outcome: 690
    };

    // Calculate (x, y) for each node
    const nodeCoords = {};

    ['input', 'activity', 'outcome'].forEach(cat => {
      const list = cols[cat];
      const spacing = height / (list.length + 1);
      list.forEach((node, idx) => {
        const x = xCoords[cat];
        const y = Math.round(spacing * (idx + 1));
        nodeCoords[node.id] = { x, y, node };
      });
    });

    // Filter edges
    let filteredEdges = edges;
    if (this.activeFilter === 'positive') {
      filteredEdges = edges.filter(e => e.weight > 0);
    } else if (this.activeFilter === 'negative') {
      filteredEdges = edges.filter(e => e.weight < 0);
    }

    // Draw SVG Edges
    let edgesSvg = '';
    filteredEdges.forEach(edge => {
      const src = nodeCoords[edge.source];
      const tgt = nodeCoords[edge.target];
      if (!src || !tgt) return;

      const isPos = edge.weight > 0;
      const strokeWidth = Math.min(5, Math.max(1.8, Math.abs(edge.weight) * 6));
      const strokeClass = isPos ? 'edge-positive' : 'edge-negative';

      // Highlight logic
      let opacity = 0.55;
      if (this.selectedNodeId) {
        if (edge.source === this.selectedNodeId || edge.target === this.selectedNodeId) {
          opacity = 1;
        } else {
          opacity = 0.12;
        }
      }

      // Smooth Bezier Curve from Source to Target
      const dx = (tgt.x - src.x) * 0.5;
      const dPath = `M ${src.x} ${src.y} C ${src.x + dx} ${src.y}, ${tgt.x - dx} ${tgt.y}, ${tgt.x} ${tgt.y}`;

      edgesSvg += `
        <path 
          d="${dPath}" 
          class="causal-edge ${strokeClass}" 
          stroke-width="${strokeWidth}" 
          opacity="${opacity}"
          data-source="${edge.source}"
          data-target="${edge.target}"
        >
          <title>${edge.source} → ${edge.target} (${edge.upliftPercent > 0 ? '+' : ''}${edge.upliftPercent}% uplift)</title>
        </path>
      `;
    });

    // Draw SVG Nodes
    let nodesSvg = '';
    nodes.forEach(node => {
      const coord = nodeCoords[node.id];
      if (!coord) return;

      const isSelected = this.selectedNodeId === node.id;
      const nodeClass = `causal-node-pill ${node.category} ${isSelected ? 'selected' : ''}`;

      // Pill dimensions
      const pillWidth = 140;
      const pillHeight = 36;
      const px = coord.x - pillWidth / 2;
      const py = coord.y - pillHeight / 2;

      nodesSvg += `
        <g class="causal-node-group" data-node-id="${escapeHtml(node.id)}" transform="translate(${px}, ${py})">
          <rect class="${nodeClass}" width="${pillWidth}" height="${pillHeight}" rx="8" ry="8"></rect>
          <text class="node-title" x="${pillWidth / 2}" y="19" text-anchor="middle">${escapeHtml(node.label)}</text>
          <text class="node-meta" x="${pillWidth / 2}" y="30" text-anchor="middle">${node.count}x • Mood ${node.avgMood}</text>
        </g>
      `;
    });

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const posColor = isDark ? '#58A67D' : '#3F6754';
    const negColor = isDark ? '#F85149' : '#C25450';

    this.graphContainer.innerHTML = `
      <svg class="causal-network-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet">
        <defs>
          <marker id="arrow-pos" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 0 1 L 9 5 L 0 9 z" fill="${posColor}" />
          </marker>
          <marker id="arrow-neg" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 0 1 L 9 5 L 0 9 z" fill="${negColor}" />
          </marker>
        </defs>

        <!-- Category Headers -->
        <text class="column-header" x="${xCoords.input}" y="32" text-anchor="middle">INPUTS & HABITS</text>
        <text class="column-header" x="${xCoords.activity}" y="32" text-anchor="middle">ACTIVITIES</text>
        <text class="column-header" x="${xCoords.outcome}" y="32" text-anchor="middle">OUTCOMES & STATES</text>

        <!-- Edges -->
        <g class="edges-layer">${edgesSvg}</g>

        <!-- Nodes -->
        <g class="nodes-layer">${nodesSvg}</g>
      </svg>
    `;

    // Bind Node Clicks
    this.graphContainer.querySelectorAll('.causal-node-group').forEach(el => {
      el.addEventListener('click', () => {
        const nodeId = el.getAttribute('data-node-id');
        this.selectNode(nodeId, nodes, edges, tagStats);
      });
    });

    // Auto-select first active node or preserve selection
    if (!this.selectedNodeId && nodes.length > 0) {
      this.selectNode(nodes[0].id, nodes, edges, tagStats);
    } else if (this.selectedNodeId) {
      this.renderInspector(this.selectedNodeId, nodes, edges, tagStats);
    }
  }

  selectNode(nodeId, nodes, edges, tagStats) {
    this.selectedNodeId = nodeId;
    this.render();
    this.renderInspector(nodeId, nodes, edges, tagStats);
  }

  renderInspector(nodeId, nodes, edges, tagStats) {
    if (!this.inspectorContainer) return;

    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    const outgoing = edges.filter(e => e.source === nodeId);
    const incoming = edges.filter(e => e.target === nodeId);

    let relationsHtml = '';

    if (outgoing.length > 0) {
      relationsHtml += `
        <div class="inspector-section">
          <h4>Influences & Causes:</h4>
          <ul class="inspector-list">
            ${outgoing.map(e => `
              <li class="inspector-item ${e.weight > 0 ? 'pos' : 'neg'}">
                <span class="relation-name">→ ${escapeHtml(e.target)}</span>
                <span class="relation-badge">${e.upliftPercent > 0 ? '+' : ''}${e.upliftPercent}% likelihood</span>
              </li>
            `).join('')}
          </ul>
        </div>
      `;
    }

    if (incoming.length > 0) {
      relationsHtml += `
        <div class="inspector-section">
          <h4>Driven By (Precedents):</h4>
          <ul class="inspector-list">
            ${incoming.map(e => `
              <li class="inspector-item ${e.weight > 0 ? 'pos' : 'neg'}">
                <span class="relation-name">← ${escapeHtml(e.source)}</span>
                <span class="relation-badge">${e.upliftPercent > 0 ? '+' : ''}${e.upliftPercent}% likelihood</span>
              </li>
            `).join('')}
          </ul>
        </div>
      `;
    }

    if (!relationsHtml) {
      relationsHtml = `<p class="inspector-hint">No significant strong links above the 15% threshold for this node yet.</p>`;
    }

    this.inspectorContainer.innerHTML = `
      <div class="inspector-header">
        <span class="inspector-cat-tag ${node.category}">${node.category.toUpperCase()}</span>
        <h3 class="inspector-title">${escapeHtml(node.label)}</h3>
      </div>
      <div class="inspector-stats-grid">
        <div class="inspector-stat-box">
          <span class="stat-label">Logged</span>
          <strong class="stat-val">${node.count} times</strong>
        </div>
        <div class="inspector-stat-box">
          <span class="stat-label">Avg Mood</span>
          <strong class="stat-val">${node.avgMood}/10</strong>
        </div>
        <div class="inspector-stat-box">
          <span class="stat-label">Avg Energy</span>
          <strong class="stat-val">${node.avgEnergy}/10</strong>
        </div>
      </div>
      ${relationsHtml}
    `;
  }
}

window.personalCausalGraph = new PersonalCausalGraph();
