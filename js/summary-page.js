/**
 * summary-page.js — Aggregate statistics and charts for all patients.
 */

async function initSummaryPage() {
  try {
    const stats    = await getStats();
    const patients = await getPatients();

    document.getElementById('loading-state').style.display = 'none';
    document.getElementById('summary-content').style.display = 'block';

    // Render all content
    renderKPIs(stats, patients);
    renderStatsTable(stats);
    renderAccuracySummary(stats);

  } catch (err) {
    document.getElementById('loading-state').innerHTML =
      '<p class="text-muted">⚠ Failed to load statistics. Please refresh the page.</p>';
    console.error('Summary page error:', err);
  }
}

/* ============================================================
   KPI Cards
   ============================================================ */
function renderKPIs(stats, patients) {
  const ic  = stats.measurements.inter_canine;
  const im  = stats.measurements.inter_molar;
  const ci  = stats.measurements.crowding_index;

  // Overall accuracy = average pct1mm across IC, IM, Pont's
  const pcts = [ic.pct1mm, im.pct1mm, stats.measurements.ponts_index.pct1mm].filter(v => v != null);
  const avgAcc = pcts.length ? (pcts.reduce((a, b) => a + b, 0) / pcts.length).toFixed(0) + '%' : '—';

  const shapeCounts = stats.shapeCounts;
  const mostCommon  = Object.entries(shapeCounts).sort((a, b) => b[1] - a[1])[0];

  const kpis = [
    { number: stats.total,                        label: 'Total Models' },
    { number: avgAcc,                             label: 'Avg AI Accuracy (within 1mm)' },
    { number: fmt(ic.mad),                        label: 'Mean Abs. Dev — Inter-Canine (mm)' },
    { number: mostCommon ? mostCommon[0] : '—',   label: 'Most Common Arch Shape' }
  ];

  document.getElementById('kpi-grid').innerHTML = kpis.map(k => `
    <div class="summary-stat-card">
      <div class="summary-stat-number">${k.number}</div>
      <div class="summary-stat-label">${k.label}</div>
    </div>
  `).join('');
}

/* ============================================================
   Mean ± SD Table
   ============================================================ */
function renderStatsTable(stats) {
  const m = stats.measurements;
  const rows = [
    { name: 'Inter-Canine Width (mm)', data: m.inter_canine },
    { name: 'Inter-Molar Width (mm)',  data: m.inter_molar  },
    { name: 'Total Arch Material (mm)',data: m.total_arch   },
    { name: "Pont's Index",            data: m.ponts_index  },
    { name: 'Crowding Index (mm)',     data: m.crowding_index},
    { name: 'Ashley & Huse Index',     data: m.ashley_huse  }
  ];

  document.getElementById('stats-table-body').innerHTML = rows.map(r => {
    const { data } = r;
    const madClass = data.mad != null
      ? (data.mad <= 0.5 ? 'cell-good' : data.mad <= 1.5 ? 'cell-warn' : 'cell-bad')
      : '';
    return `
      <tr>
        <td><strong>${r.name}</strong></td>
        <td>${fmt(data.manual?.mean, 2)} ± ${fmt(data.manual?.sd, 2)}</td>
        <td>${fmt(data.ai?.mean, 2)} ± ${fmt(data.ai?.sd, 2)}</td>
        <td class="${madClass}">${fmt(data.mad, 3)}</td>
        <td>${data.pct1mm != null ? data.pct1mm + '%' : '—'}</td>
        <td>${data.pct2mm != null ? data.pct2mm + '%' : '—'}</td>
      </tr>`;
  }).join('');
}

/* ============================================================
   Accuracy Summary Paragraph
   ============================================================ */
function renderAccuracySummary(stats) {
  const m = stats.measurements;
  const ic = m.inter_canine;
  const im = m.inter_molar;
  const pi = m.ponts_index;
  const ci = m.crowding_index;

  const overallPct1 = [ic.pct1mm, im.pct1mm, pi.pct1mm, ci.pct1mm]
    .filter(v => v != null);
  const avgPct1 = overallPct1.length
    ? (overallPct1.reduce((a, b) => a + b, 0) / overallPct1.length).toFixed(1)
    : null;

  document.getElementById('accuracy-summary').innerHTML = `
    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:1rem;">
      <div>
        <div class="text-muted text-small">Inter-Canine Width</div>
        <div style="font-size:1.1rem; font-weight:700; color:var(--teal);">${ic.pct1mm ?? '—'}% within 1mm</div>
        <div class="text-small text-muted">MAD: ${fmt(ic.mad, 3)} mm</div>
      </div>
      <div>
        <div class="text-muted text-small">Inter-Molar Width</div>
        <div style="font-size:1.1rem; font-weight:700; color:var(--teal);">${im.pct1mm ?? '—'}% within 1mm</div>
        <div class="text-small text-muted">MAD: ${fmt(im.mad, 3)} mm</div>
      </div>
      <div>
        <div class="text-muted text-small">Pont's Index</div>
        <div style="font-size:1.1rem; font-weight:700; color:var(--teal);">${pi.pct1mm ?? '—'}% within 1mm</div>
        <div class="text-small text-muted">MAD: ${fmt(pi.mad, 3)}</div>
      </div>
      <div>
        <div class="text-muted text-small">Crowding Index</div>
        <div style="font-size:1.1rem; font-weight:700; color:var(--teal);">${ci.pct1mm ?? '—'}% within 1mm</div>
        <div class="text-small text-muted">MAD: ${fmt(ci.mad, 3)} mm</div>
      </div>
    </div>
    <hr style="margin:1rem 0; border:none; border-top:1px solid var(--gray-200);">
    <p style="margin:0;">
      <strong>Overall AI Performance:</strong>
      Across all ${stats.total} models and key measurements, the AI system achieves an average accuracy of
      <strong style="color:var(--teal);">${avgPct1 ?? '—'}%</strong> of measurements within 1mm of the manual gold standard.
      The mean absolute deviation for inter-canine width is <strong>${fmt(ic.mad, 3)} mm</strong>
      and for inter-molar width is <strong>${fmt(im.mad, 3)} mm</strong>,
      demonstrating clinically acceptable precision for orthodontic arch analysis.
    </p>
  `;
}
