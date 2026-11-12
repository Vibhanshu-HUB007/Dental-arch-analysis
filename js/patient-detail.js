/**
 * patient-detail.js — Patient detail page logic.
 * Handles: data loading, header, measurement tables,
 *          Chart.js comparison charts, Three.js STL viewer.
 */

let _patient = null;
let _threeLoaded = false;
let _renderer = null;
let _animFrameId = null;

async function initPatientDetailPage() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  if (!id) {
    showNotFound('No model ID specified in URL.');
    return;
  }

  // Update page title
  document.title = `${id} — Dental Arch Analysis`;

  try {
    _patient = await getPatient(id);
  } catch (e) {
    showNotFound('Failed to load patient data.');
    return;
  }

  if (!_patient) {
    showNotFound(`Model ID "${id}" not found in the dataset.`);
    return;
  }

  renderHeader(_patient);
  renderOverviewSection(_patient);
  renderWidthsSection(_patient);
  renderTeethSection(_patient);
  renderIndicesSection(_patient);
  renderCharts(_patient);
}

/* ============================================================
   Header
   ============================================================ */
function renderHeader(p) {
  const badgeClass = getShapeBadgeClass(p.arch_shape);
  const teethList  = p.teeth_present ? p.teeth_present.join(', ') : '—';
  const totalArch  = fmt(p.total_arch_material?.manual);

  document.getElementById('patient-header').innerHTML = `
    <div>
      <div class="patient-id-display">${escHtml(p.model_id)}</div>
      <div class="patient-meta">
        <span class="badge ${badgeClass}" style="font-size:.85rem; padding:.25rem .75rem;">${escHtml(p.arch_shape)}</span>
        <span class="meta-item">🦷 Teeth: <span class="meta-value">${teethList}</span></span>
        <span class="meta-item">📏 Total arch (manual): <span class="meta-value">${totalArch} mm</span></span>
      </div>
    </div>
    <div>
      <a href="patients.html" class="btn btn-outline btn-sm">← All Patients</a>
    </div>
  `;
}

/* ============================================================
   Section 1: Overview Table
   ============================================================ */
function renderOverviewSection(p) {
  const ic  = p.inter_canine_width  || {};
  const im  = p.inter_molar_width   || {};
  const tam = p.total_arch_material || {};

  document.getElementById('section-overview').innerHTML = `
    <div class="section-title">Overview</div>
    <div class="table-wrapper">
      <table aria-label="Patient overview measurements">
        <thead>
          <tr>
            <th>Parameter</th>
            <th>Manual Method</th>
            <th>AI Detected</th>
            <th>Calculated</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Arch Shape</strong></td>
            <td colspan="3"><span class="badge ${getShapeBadgeClass(p.arch_shape)}">${escHtml(p.arch_shape)}</span></td>
          </tr>
          <tr>
            <td><strong>Total Arch Material</strong></td>
            <td>${fmt(tam.manual)} mm</td>
            <td class="${getAccuracyClass(tam.manual, tam.ai)}">${fmt(tam.ai)} mm</td>
            <td>—</td>
          </tr>
          <tr>
            <td><strong>Inter-Canine Width</strong></td>
            <td>${fmt(ic.manual)} mm</td>
            <td class="${getAccuracyClass(ic.manual, ic.ai)}">${fmt(ic.ai)} mm</td>
            <td>${fmt(ic.calculated)} mm</td>
          </tr>
          <tr>
            <td><strong>Inter-Molar Width</strong></td>
            <td>${fmt(im.manual)} mm</td>
            <td class="${getAccuracyClass(im.manual, im.ai)}">${fmt(im.ai)} mm</td>
            <td>${fmt(im.calculated)} mm</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
}

/* ============================================================
   Section 2: Arch Widths
   ============================================================ */
function renderWidthsSection(p) {
  const ic = p.inter_canine_width || {};
  const im = p.inter_molar_width  || {};

  document.getElementById('section-widths').innerHTML = `
    <div class="section-title">Arch Width Measurements</div>
    <div class="table-wrapper">
      <table aria-label="Arch width measurements comparison">
        <thead>
          <tr>
            <th>Measurement</th>
            <th>Manual (mm)</th>
            <th>AI Detected (mm)</th>
            <th>Calculated (mm)</th>
            <th>Difference (AI–Manual)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Inter-Canine Width</strong></td>
            <td>${fmt(ic.manual)}</td>
            <td class="${getAccuracyClass(ic.manual, ic.ai)}">${fmt(ic.ai)}</td>
            <td>${fmt(ic.calculated)}</td>
            <td>${diffStr(ic.manual, ic.ai)}</td>
          </tr>
          <tr>
            <td><strong>Inter-Molar Width</strong></td>
            <td>${fmt(im.manual)}</td>
            <td class="${getAccuracyClass(im.manual, im.ai)}">${fmt(im.ai)}</td>
            <td>${fmt(im.calculated)}</td>
            <td>${diffStr(im.manual, im.ai)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
}

/* ============================================================
   Section 3: Tooth Widths
   ============================================================ */
function renderTeethSection(p) {
  const tw = p.tooth_widths || {};
  const toothKeys = Object.keys(tw).sort((a, b) => {
    const na = parseInt(a.replace('t',''));
    const nb = parseInt(b.replace('t',''));
    return na - nb;
  });

  if (!toothKeys.length) {
    document.getElementById('section-teeth').innerHTML = '';
    return;
  }

  const rows = toothKeys.map(key => {
    const t = tw[key] || {};
    const acc = getAccuracyClass(t.manual, t.ai);
    return `
      <tr>
        <td><strong>Tooth ${key.replace('t','').replace(/(\d{2})/, '$1')}</strong></td>
        <td>${fmt(t.manual)}</td>
        <td class="${acc}">${fmt(t.ai)}</td>
        <td>${diffStr(t.manual, t.ai)}</td>
      </tr>`;
  }).join('');

  document.getElementById('section-teeth').innerHTML = `
    <div class="section-title">Individual Tooth Widths — Mesiodistal (mm)</div>
    <div class="table-wrapper">
      <table aria-label="Individual tooth mesiodistal widths">
        <thead>
          <tr>
            <th>Tooth</th>
            <th>Manual (mm)</th>
            <th>AI Detected (mm)</th>
            <th>Difference</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

/* ============================================================
   Section 4: Indices
   ============================================================ */
function renderIndicesSection(p) {
  const pi = p.ponts_index          || {};
  const ci = p.crowding_index       || {};
  const ah = p.ashley_huse_index    || {};
  const ih = p.incisor_height_index || {};
  const tj = p.tanaka_johnston      || {};

  document.getElementById('section-indices').innerHTML = `
    <div class="section-title">Orthodontic Indices</div>
    <div class="table-wrapper">
      <table aria-label="Orthodontic indices comparison">
        <thead>
          <tr>
            <th>Index</th>
            <th>Manual</th>
            <th>AI Detected</th>
            <th>Calculated</th>
            <th>Difference (AI–Manual)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Pont's Index</strong></td>
            <td>${fmt(pi.manual)}</td>
            <td class="${getAccuracyClass(pi.manual, pi.ai)}">${fmt(pi.ai)}</td>
            <td>${fmt(pi.calculated)}</td>
            <td>${diffStr(pi.manual, pi.ai)}</td>
          </tr>
          <tr>
            <td><strong>Crowding Index (mm)</strong></td>
            <td>${fmt(ci.manual)}</td>
            <td class="${getAccuracyClass(ci.manual, ci.ai)}">${fmt(ci.ai)}</td>
            <td>${fmt(ci.calculated)}</td>
            <td>${diffStr(ci.manual, ci.ai)}</td>
          </tr>
          <tr>
            <td><strong>Ashley &amp; Huse Index</strong></td>
            <td>${fmt(ah.manual)}</td>
            <td class="${getAccuracyClass(ah.manual, ah.ai)}">${fmt(ah.ai)}</td>
            <td>${fmt(ah.calculated)}</td>
            <td>${diffStr(ah.manual, ah.ai)}</td>
          </tr>
          <tr>
            <td><strong>Incisor Height Index</strong></td>
            <td>${fmt(ih.manual)}</td>
            <td class="${getAccuracyClass(ih.manual, ih.ai)}">${fmt(ih.ai)}</td>
            <td>—</td>
            <td>${diffStr(ih.manual, ih.ai)}</td>
          </tr>
          <tr>
            <td><strong>Tanaka &amp; Johnston</strong></td>
            <td>${fmt(tj.manual)}</td>
            <td class="${getAccuracyClass(tj.manual, tj.ai)}">${fmt(tj.ai)}</td>
            <td>—</td>
            <td>${diffStr(tj.manual, tj.ai)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
}

/* ============================================================
   Charts
   ============================================================ */
function renderCharts(p) {
  const NAVY   = '#1a3a5c';
  const TEAL   = '#2a9d8f';
  const AMBER  = '#e9a825';

  const defaults = {
    plugins: { legend: { labels: { font: { size: 11 }, boxWidth: 14 } } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 10 } } },
      y: { grid: { color: '#e9ecef' }, ticks: { font: { size: 10 } } }
    }
  };

  // Chart 1: Arch Widths
  const ic = p.inter_canine_width || {};
  const im = p.inter_molar_width  || {};
  new Chart(document.getElementById('chart-widths'), {
    type: 'bar',
    data: {
      labels: ['Inter-Canine Width', 'Inter-Molar Width'],
      datasets: [
        { label: 'Manual',     data: [ic.manual, im.manual],     backgroundColor: NAVY,   borderRadius: 4 },
        { label: 'AI',         data: [ic.ai,     im.ai],         backgroundColor: TEAL,   borderRadius: 4 },
        { label: 'Calculated', data: [ic.calculated, im.calculated], backgroundColor: AMBER, borderRadius: 4 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      ...defaults,
      plugins: {
        ...defaults.plugins,
        tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y?.toFixed(1)} mm` } }
      },
      scales: { ...defaults.scales, y: { ...defaults.scales.y, title: { display: true, text: 'mm', font: { size: 10 } } } }
    }
  });

  // Chart 2: Indices
  const pi = p.ponts_index          || {};
  const ci = p.crowding_index       || {};
  const ah = p.ashley_huse_index    || {};
  new Chart(document.getElementById('chart-indices'), {
    type: 'bar',
    data: {
      labels: ["Pont's Index", 'Crowding Index', 'Ashley & Huse'],
      datasets: [
        { label: 'Manual',     data: [pi.manual, ci.manual, ah.manual],     backgroundColor: NAVY,  borderRadius: 4 },
        { label: 'AI',         data: [pi.ai,     ci.ai,     ah.ai],         backgroundColor: TEAL,  borderRadius: 4 },
        { label: 'Calculated', data: [pi.calculated, ci.calculated, ah.calculated], backgroundColor: AMBER, borderRadius: 4 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      ...defaults
    }
  });

  // Chart 3: Individual Tooth Widths
  const tw = p.tooth_widths || {};
  const sortedKeys = Object.keys(tw).sort((a, b) => parseInt(a.replace('t','')) - parseInt(b.replace('t','')));
  const toothLabels  = sortedKeys.map(k => k.replace('t',''));
  const manualWidths = sortedKeys.map(k => tw[k]?.manual ?? null);
  const aiWidths     = sortedKeys.map(k => tw[k]?.ai     ?? null);

  new Chart(document.getElementById('chart-teeth'), {
    type: 'bar',
    data: {
      labels: toothLabels,
      datasets: [
        { label: 'Manual', data: manualWidths, backgroundColor: NAVY, borderRadius: 3 },
        { label: 'AI',     data: aiWidths,     backgroundColor: TEAL, borderRadius: 3 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { font: { size: 11 }, boxWidth: 14 } },
        tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y?.toFixed(1)} mm` } }
      },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 9 } }, title: { display: true, text: 'Tooth Number', font: { size: 10 } } },
        y: { grid: { color: '#e9ecef' }, ticks: { font: { size: 10 } }, title: { display: true, text: 'Width (mm)', font: { size: 10 } }, min: 4 }
      }
    }
  });
}

/* ============================================================
   3D STL Viewer (Three.js — lazy loaded)
   ============================================================ */
async function loadSTL() {
  if (!_patient) return;

  const btn         = document.getElementById('load-stl-btn');
  const placeholder = document.getElementById('viewer-placeholder');
  const container   = document.getElementById('stl-viewer-container');
  const loading     = document.getElementById('viewer-loading');
  const loadingText = document.getElementById('viewer-loading-text');
  const hint        = document.getElementById('viewer-hint');

  btn.disabled = true;
  btn.textContent = 'Loading…';
  placeholder.style.display = 'none';
  container.style.display = 'block';
  loading.style.display = 'flex';

  try {
    // Dynamically load Three.js scripts
    if (!_threeLoaded) {
      loadingText.textContent = 'Loading Three.js…';
      await loadScript('https://unpkg.com/three@0.134.0/build/three.min.js');
      await loadScript('https://unpkg.com/three@0.134.0/examples/js/loaders/STLLoader.js');
      await loadScript('https://unpkg.com/three@0.134.0/examples/js/controls/OrbitControls.js');
      _threeLoaded = true;
    }

    loadingText.textContent = 'Fetching STL model…';
    const stlPath = SITE_CONFIG.STL_BASE_PATH + _patient.model_id + SITE_CONFIG.STL_SUFFIX;

    const loader = new THREE.STLLoader();
    loader.load(
      stlPath,
      function (geometry) {
        loading.style.display = 'none';
        hint.style.display = 'flex';
        btn.textContent = '✓ 3D Model Loaded';
        initThreeScene(geometry, container);
      },
      function (xhr) {
        if (xhr.total) {
          const pct = Math.round(xhr.loaded / xhr.total * 100);
          loadingText.textContent = `Loading STL… ${pct}%`;
        }
      },
      function (err) {
        loading.style.display = 'none';
        container.style.display = 'none';
        placeholder.style.display = 'flex';
        placeholder.innerHTML = `
          <svg width="48" height="48" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="10" stroke="#dc3545" stroke-width="2"/>
            <line x1="12" y1="8" x2="12" y2="12" stroke="#dc3545" stroke-width="2"/>
            <circle cx="12" cy="16" r="1" fill="#dc3545"/>
          </svg>
          <p><strong>STL file not found.</strong></p>
          <p class="text-small text-muted">Expected: <code>${stlPath}</code><br>
          Copy the Dataset/ folder into the website/ directory.</p>`;
        btn.disabled = false;
        btn.textContent = '🦷 Retry Load';
        console.error('STL load error:', err);
      }
    );
  } catch (err) {
    loading.style.display = 'none';
    btn.disabled = false;
    btn.textContent = '🦷 Retry Load';
    console.error('Three.js load error:', err);
  }
}

function initThreeScene(geometry, container) {
  // Cancel previous animation frame if any
  if (_animFrameId) cancelAnimationFrame(_animFrameId);
  if (_renderer) { _renderer.dispose(); container.innerHTML = ''; }

  const W = container.clientWidth;
  const H = container.clientHeight;

  // Scene
  const scene  = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1a2e);

  // Camera
  const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 10000);

  // Renderer
  _renderer = new THREE.WebGLRenderer({ antialias: true });
  _renderer.setSize(W, H);
  _renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(_renderer.domElement);

  // Lighting
  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambient);
  const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight1.position.set(1, 2, 3);
  scene.add(dirLight1);
  const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
  dirLight2.position.set(-2, -1, -2);
  scene.add(dirLight2);

  // Mesh — ivory tooth color
  geometry.computeVertexNormals();
  const material = new THREE.MeshPhongMaterial({
    color: 0xF5F0E8,
    specular: 0x444444,
    shininess: 40,
    side: THREE.DoubleSide
  });
  const mesh = new THREE.Mesh(geometry, material);

  // Auto-center and auto-scale
  geometry.computeBoundingBox();
  const box    = geometry.boundingBox;
  const center = new THREE.Vector3();
  box.getCenter(center);
  const size   = new THREE.Vector3();
  box.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z);
  const scale  = 100 / maxDim;
  mesh.scale.setScalar(scale);
  mesh.position.sub(center.multiplyScalar(scale));

  scene.add(mesh);

  // Camera position
  camera.position.set(0, 40, 160);
  camera.lookAt(0, 0, 0);

  // Controls
  const controls = new THREE.OrbitControls(camera, _renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance   = 50;
  controls.maxDistance   = 400;
  controls.target.set(0, 0, 0);
  controls.update();

  // Resize handler
  const resizeObs = new ResizeObserver(() => {
    const nW = container.clientWidth;
    const nH = container.clientHeight;
    camera.aspect = nW / nH;
    camera.updateProjectionMatrix();
    _renderer.setSize(nW, nH);
  });
  resizeObs.observe(container);

  // Animation loop
  function animate() {
    _animFrameId = requestAnimationFrame(animate);
    controls.update();
    _renderer.render(scene, camera);
  }
  animate();
}

/* ============================================================
   Helpers
   ============================================================ */
function loadScript(src) {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src;
    s.onload  = resolve;
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}

function diffStr(manual, ai) {
  if (manual == null || ai == null) return '—';
  const diff = +(ai - manual).toFixed(2);
  const cls  = Math.abs(diff) <= 1 ? 'cell-good' : Math.abs(diff) <= 2 ? 'cell-warn' : 'cell-bad';
  return `<span class="${cls}">${diff >= 0 ? '+' : ''}${diff}</span>`;
}

function escHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function showNotFound(msg) {
  document.getElementById('patient-header').innerHTML = `
    <div class="empty-state" style="padding:2rem;">
      <h3>Patient Not Found</h3>
      <p class="text-muted">${escHtml(msg)}</p>
      <a href="patients.html" class="btn btn-primary mt-2">← Back to Patients</a>
    </div>
  `;
  // Hide all other sections
  ['viewer-section','section-overview','section-widths','section-teeth','section-indices']
    .forEach(id => { const el = document.getElementById(id); if (el) el.style.display = 'none'; });
}
