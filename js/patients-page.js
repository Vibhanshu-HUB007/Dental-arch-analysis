/**
 * patients-page.js — Patient list page logic.
 * Renders patient cards, handles filter/search.
 */

let _allPatients = [];
let _activeFilter = 'all';

async function initPatientsPage() {
  const grid = document.getElementById('patient-grid');
  const loadingState = document.getElementById('loading-state');
  const emptyState   = document.getElementById('empty-state');
  const resultsCount = document.getElementById('results-count');

  try {
    _allPatients = await getPatients();
  } catch (err) {
    loadingState.innerHTML = '<p class="text-muted">⚠ Failed to load patient data. Please refresh.</p>';
    return;
  }

  loadingState.style.display = 'none';
  renderCards(_allPatients);
}

function setFilter(shape, btn) {
  _activeFilter = shape;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  applyFilters();
}

function applyFilters() {
  const query = (document.getElementById('search-input')?.value || '').toLowerCase().trim();
  let filtered = _allPatients;

  if (_activeFilter !== 'all') {
    filtered = filtered.filter(p => p.arch_shape === _activeFilter);
  }
  if (query) {
    filtered = filtered.filter(p => p.model_id.toLowerCase().includes(query));
  }

  renderCards(filtered);
}

function renderCards(patients) {
  const grid       = document.getElementById('patient-grid');
  const emptyState = document.getElementById('empty-state');
  const resultsCount = document.getElementById('results-count');

  grid.innerHTML = '';

  if (!patients.length) {
    emptyState.style.display = 'block';
    resultsCount.textContent = 'No results';
    return;
  }

  emptyState.style.display = 'none';
  resultsCount.textContent = `Showing ${patients.length} of ${_allPatients.length} model${_allPatients.length !== 1 ? 's' : ''}`;

  patients.forEach(p => {
    const card = createPatientCard(p);
    grid.appendChild(card);
  });
}

function createPatientCard(p) {
  const badgeClass = getShapeBadgeClass(p.arch_shape);
  const icAI = fmt(p.inter_canine_width?.ai);
  const imAI = fmt(p.inter_molar_width?.ai);
  const icManual = fmt(p.inter_canine_width?.manual);
  const imManual = fmt(p.inter_molar_width?.manual);
  const icClass  = getAccuracyClass(p.inter_canine_width?.manual, p.inter_canine_width?.ai);
  const imClass  = getAccuracyClass(p.inter_molar_width?.manual, p.inter_molar_width?.ai);
  const crowding = fmt(p.crowding_index?.ai);
  const totalArch = fmt(p.total_arch_material?.ai);

  const article = document.createElement('article');
  article.className = 'patient-card';
  article.setAttribute('role', 'listitem');
  article.innerHTML = `
    <div class="patient-card-header">
      <div>
        <div class="patient-model-id">${escHtml(p.model_id)}</div>
        <div class="mt-1">
          <span class="badge ${badgeClass}">${escHtml(p.arch_shape)}</span>
        </div>
      </div>
      <div class="text-right text-small text-muted">
        ${p.teeth_present ? p.teeth_present.length + ' teeth' : ''}
      </div>
    </div>
    <div class="patient-card-body">
      <div class="measurement-row">
        <span class="measurement-label">Inter-Canine (AI)</span>
        <span class="measurement-value ${icClass}">${icAI} mm</span>
      </div>
      <div class="measurement-row">
        <span class="measurement-label">Inter-Molar (AI)</span>
        <span class="measurement-value ${imClass}">${imAI} mm</span>
      </div>
      <div class="measurement-row">
        <span class="measurement-label">Total Arch (AI)</span>
        <span class="measurement-value">${totalArch} mm</span>
      </div>
      <div class="measurement-row">
        <span class="measurement-label">Crowding (AI)</span>
        <span class="measurement-value">${crowding} mm</span>
      </div>
    </div>
    <div class="patient-card-footer">
      <a href="patient.html?id=${encodeURIComponent(p.model_id)}" class="btn btn-primary btn-sm" style="width:100%;">
        View Details →
      </a>
    </div>
  `;
  return article;
}

function escHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
