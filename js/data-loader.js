/**
 * data-loader.js — Loads and caches patients.json, exposes data access functions.
 *
 * Usage:
 *   const patients = await getPatients();
 *   const p = await getPatient('3FPBITVG');
 *   const stats = await getStats();
 */

let _cache = null;

/**
 * Fetch all patients. Results are cached after first load.
 * @returns {Promise<Array>}
 */
async function getPatients() {
  if (_cache) return _cache;
  try {
    const res = await fetch('data/patients.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    _cache = await res.json();
    return _cache;
  } catch (err) {
    console.error('Failed to load patients.json:', err);
    throw err;
  }
}

/**
 * Get a single patient by model_id.
 * @param {string} id
 * @returns {Promise<Object|null>}
 */
async function getPatient(id) {
  const patients = await getPatients();
  return patients.find(p => p.model_id === id) || null;
}

/**
 * Compute aggregate statistics across all patients.
 * @returns {Promise<Object>}
 */
async function getStats() {
  const patients = await getPatients();

  // Arch shape distribution
  const shapeCounts = {};
  patients.forEach(p => {
    shapeCounts[p.arch_shape] = (shapeCounts[p.arch_shape] || 0) + 1;
  });

  // Helper: mean and SD
  function meanSD(values) {
    const valid = values.filter(v => v != null && !isNaN(v));
    if (!valid.length) return { mean: null, sd: null };
    const mean = valid.reduce((a, b) => a + b, 0) / valid.length;
    const variance = valid.reduce((s, v) => s + (v - mean) ** 2, 0) / valid.length;
    return { mean: +mean.toFixed(2), sd: +Math.sqrt(variance).toFixed(2) };
  }

  // Helper: mean absolute deviation between parallel arrays
  function mad(vals1, vals2) {
    const diffs = [];
    vals1.forEach((v, i) => {
      if (v != null && vals2[i] != null) diffs.push(Math.abs(v - vals2[i]));
    });
    if (!diffs.length) return null;
    return +(diffs.reduce((a, b) => a + b, 0) / diffs.length).toFixed(3);
  }

  // Helper: % within threshold
  function pctWithin(vals1, vals2, threshold) {
    let count = 0, total = 0;
    vals1.forEach((v, i) => {
      if (v != null && vals2[i] != null) {
        total++;
        if (Math.abs(v - vals2[i]) <= threshold) count++;
      }
    });
    return total ? +(count / total * 100).toFixed(1) : null;
  }

  const icManual = patients.map(p => p.inter_canine_width?.manual);
  const icAI     = patients.map(p => p.inter_canine_width?.ai);
  const imManual = patients.map(p => p.inter_molar_width?.manual);
  const imAI     = patients.map(p => p.inter_molar_width?.ai);
  const tamManual = patients.map(p => p.total_arch_material?.manual);
  const tamAI     = patients.map(p => p.total_arch_material?.ai);
  const pontM    = patients.map(p => p.ponts_index?.manual);
  const pontAI   = patients.map(p => p.ponts_index?.ai);
  const crowdM   = patients.map(p => p.crowding_index?.manual);
  const crowdAI  = patients.map(p => p.crowding_index?.ai);
  const ahM      = patients.map(p => p.ashley_huse_index?.manual);
  const ahAI     = patients.map(p => p.ashley_huse_index?.ai);

  return {
    total: patients.length,
    shapeCounts,
    measurements: {
      inter_canine: {
        manual: meanSD(icManual),
        ai:     meanSD(icAI),
        mad:    mad(icManual, icAI),
        pct1mm: pctWithin(icManual, icAI, 1),
        pct2mm: pctWithin(icManual, icAI, 2),
        pairs:  patients.map(p => ({ id: p.model_id, manual: p.inter_canine_width?.manual, ai: p.inter_canine_width?.ai }))
      },
      inter_molar: {
        manual: meanSD(imManual),
        ai:     meanSD(imAI),
        mad:    mad(imManual, imAI),
        pct1mm: pctWithin(imManual, imAI, 1),
        pct2mm: pctWithin(imManual, imAI, 2),
        pairs:  patients.map(p => ({ id: p.model_id, manual: p.inter_molar_width?.manual, ai: p.inter_molar_width?.ai }))
      },
      total_arch: {
        manual: meanSD(tamManual),
        ai:     meanSD(tamAI),
        mad:    mad(tamManual, tamAI),
        pct1mm: pctWithin(tamManual, tamAI, 1),
        pct2mm: pctWithin(tamManual, tamAI, 2)
      },
      ponts_index: {
        manual: meanSD(pontM),
        ai:     meanSD(pontAI),
        mad:    mad(pontM, pontAI),
        pct1mm: pctWithin(pontM, pontAI, 1),
        pct2mm: pctWithin(pontM, pontAI, 2)
      },
      crowding_index: {
        manual: meanSD(crowdM),
        ai:     meanSD(crowdAI),
        mad:    mad(crowdM, crowdAI),
        pct1mm: pctWithin(crowdM, crowdAI, 1),
        pct2mm: pctWithin(crowdM, crowdAI, 2)
      },
      ashley_huse: {
        manual: meanSD(ahM),
        ai:     meanSD(ahAI),
        mad:    mad(ahM, ahAI),
        pct1mm: pctWithin(ahM, ahAI, 1),
        pct2mm: pctWithin(ahM, ahAI, 2)
      }
    }
  };
}

/**
 * Get arch shape badge class.
 * @param {string} shape
 * @returns {string}
 */
function getShapeBadgeClass(shape) {
  const map = {
    'Symmetrical':  'badge-symmetrical',
    'V-Shaped':     'badge-v-shaped',
    'U-Shaped':     'badge-u-shaped',
    'Asymmetrical': 'badge-asymmetrical'
  };
  return map[shape] || 'badge-default';
}

/**
 * Returns CSS class for a comparison cell based on difference.
 * @param {number|null} manual
 * @param {number|null} ai
 * @returns {string}
 */
function getAccuracyClass(manual, ai) {
  if (manual == null || ai == null) return '';
  const diff = Math.abs(manual - ai);
  if (diff <= 1) return 'cell-good';
  if (diff <= 2) return 'cell-warn';
  return 'cell-bad';
}

/**
 * Format a number to fixed decimal places, returning '—' for null.
 * @param {number|null} val
 * @param {number} decimals
 */
function fmt(val, decimals = 1) {
  if (val == null || isNaN(val)) return '—';
  return (+val).toFixed(decimals);
}
