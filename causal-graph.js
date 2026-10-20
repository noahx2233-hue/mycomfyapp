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
    const width = 720;
    const height = 500;
    const center = { x: width / 2, y: 255 };
    const radius = 155;

    // Radar spokes show the most frequently tracked variables. Distance from
    // the center is the share of logged days on which a variable appeared.
    const chartNodes = [...nodes]
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
      .slice(0, 7);
    if (this.selectedNodeId && !chartNodes.some(node => node.id === this.selectedNodeId)) {
      const selected = nodes.find(node => node.id === this.selectedNodeId);
      if (selected) chartNodes[chartNodes.length - 1] = selected;
    }

    const axisCount = Math.max(5, chartNodes.length);
    const angleAt = index => -Math.PI / 2 + (Math.PI * 2 * index / axisCount);
    const pointAt = (index, scale) => ({
      x: center.x + Math.cos(angleAt(index)) * radius * scale,
      y: center.y + Math.sin(angleAt(index)) * radius * scale
    });
    const axisPoints = Array.from({ length: axisCount }, (_, index) => pointAt(index, 1));
    const polygonPoints = points => points.map(point => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' ');
    const coordinates = {};

    chartNodes.forEach((node, index) => {
      const share = totalLogs ? Math.max(0.04, Math.min(1, node.count / totalLogs)) : 0;
      coordinates[node.id] = pointAt(index, share);
    });

    let meshSvg = '';
    for (let level = 1; level <= 5; level++) {
      const ring = axisPoints.map(point => ({
        x: center.x + (point.x - center.x) * level / 5,
        y: center.y + (point.y - center.y) * level / 5
      }));
      meshSvg += `<polygon class="radar-grid-ring${level === 5 ? ' outer' : ''}" points="${polygonPoints(ring)}"></polygon>`;
    }

    const axesSvg = axisPoints.map((point, index) => {
      const labelPoint = pointAt(index, 1.2);
      const node = chartNodes[index];
      const label = node ? escapeHtml(node.label) : (totalLogs ? 'More entries' : 'Log data');
      const anchor = labelPoint.x < center.x - 18 ? 'end' : labelPoint.x > center.x + 18 ? 'start' : 'middle';
      return `<line class="radar-axis-line" x1="${center.x}" y1="${center.y}" x2="${point.x}" y2="${point.y}"></line><text class="radar-axis-label" x="${labelPoint.x}" y="${labelPoint.y}" text-anchor="${anchor}">${label}</text>`;
    }).join('');

    const gridLabels = [20, 40, 60, 80, 100].map(percent => {
      const y = center.y - radius * percent / 100;
      return `<text class="radar-grid-label" x="${center.x + 6}" y="${y - 3}">${percent}%</text>`;
    }).join('');

    let filteredEdges = edges;
    if (this.activeFilter === 'positive') filteredEdges = edges.filter(edge => edge.weight > 0);
    else if (this.activeFilter === 'negative') filteredEdges = edges.filter(edge => edge.weight < 0);

    const edgeSvg = filteredEdges.map(edge => {
      const source = coordinates[edge.source];
      const target = coordinates[edge.target];
      if (!source || !target) return '';
      const selected = !this.selectedNodeId || edge.source === this.selectedNodeId || edge.target === this.selectedNodeId;
      const edgeClass = edge.weight > 0 ? 'radar-link positive' : 'radar-link negative';
      return `<line class="${edgeClass}" x1="${source.x}" y1="${source.y}" x2="${target.x}" y2="${target.y}" opacity="${selected ? 0.82 : 0.12}"><title>${escapeHtml(edge.source)} → ${escapeHtml(edge.target)} (${edge.upliftPercent > 0 ? '+' : ''}${edge.upliftPercent}% uplift)</title></line>`;
    }).join('');

    const polygon = chartNodes.length >= 3
      ? `<polygon class="radar-data-area" points="${polygonPoints(chartNodes.map((node, index) => {
          const share = totalLogs ? Math.max(0.04, Math.min(1, node.count / totalLogs)) : 0;
          return pointAt(index, share);
        }))}"></polygon>`
      : '';

    const pointsSvg = chartNodes.map(node => {
      const point = coordinates[node.id];
      const selected = this.selectedNodeId === node.id;
      return `<g class="radar-node${selected ? ' selected' : ''}" data-node-id="${escapeHtml(node.id)}" tabindex="0" role="button" aria-label="Inspect ${escapeHtml(node.label)}"><circle class="radar-point-halo" cx="${point.x}" cy="${point.y}" r="10"></circle><circle class="radar-point" cx="${point.x}" cy="${point.y}" r="${selected ? 6 : 5}"></circle><title>${escapeHtml(node.label)} · ${node.count} of ${totalLogs} logged days</title></g>`;
    }).join('');

    const centerLabel = totalLogs
      ? `<text class="radar-center-value" x="${center.x}" y="${center.y - 2}">${totalLogs}</text><text class="radar-center-caption" x="${center.x}" y="${center.y + 16}">LOGGED DAYS</text>`
      : `<text class="radar-empty-title" x="${center.x}" y="${center.y - 4}">Your pattern</text><text class="radar-empty-caption" x="${center.x}" y="${center.y + 16}">appears here</text>`;

    this.graphContainer.innerHTML = `
      <svg class="causal-network-svg radar-chart-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Radar mesh of your most tracked daily factors">
        <defs><radialGradient id="radar-fill" cx="50%" cy="50%" r="70%"><stop offset="0%" stop-color="var(--accent-sage)" stop-opacity="0.08"></stop><stop offset="100%" stop-color="var(--accent-sage)" stop-opacity="0.38"></stop></radialGradient></defs>
        <text class="radar-chart-kicker" x="${center.x}" y="25" text-anchor="middle">MOST TRACKED FACTORS</text>
        <text class="radar-chart-note" x="${center.x}" y="43" text-anchor="middle">Distance from center shows how often each factor appears</text>
        ${polygon}
        <g class="radar-mesh">${meshSvg}${axesSvg}${gridLabels}</g>
        <g class="radar-links">${edgeSvg}</g>
        <g class="radar-nodes">${pointsSvg}</g>
        ${centerLabel}
        <g class="radar-legend" transform="translate(${center.x - 105}, 480)"><circle class="radar-legend-dot positive" cx="0" cy="0" r="4"></circle><text x="9" y="4">Positive link</text><circle class="radar-legend-dot negative" cx="112" cy="0" r="4"></circle><text x="121" y="4">Friction link</text></g>
      </svg>
    `;

    this.graphContainer.querySelectorAll('.radar-node').forEach(element => {
      const select = () => this.selectNode(element.getAttribute('data-node-id'), nodes, edges, tagStats);
      element.addEventListener('click', select);
      element.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          select();
        }
      });
    });

    if (this.selectedNodeId && nodes.some(node => node.id === this.selectedNodeId)) {
      this.renderInspector(this.selectedNodeId, nodes, edges, tagStats);
    } else if (this.inspectorContainer) {
      this.inspectorContainer.innerHTML = totalLogs
        ? '<p class="inspector-placeholder">Select a point on the radar to explore that factor and its observed links.</p>'
        : '<p class="inspector-placeholder">Your factor details will appear here after you add a few Daily Self-Log entries.</p>';
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
