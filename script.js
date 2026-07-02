/* ============ DATA LOADING ============ */
let DATA = null;

async function loadData() {
  if (DATA) return DATA;
  const [subjectsRes, programsRes, universitiesRes, relRes, fiqhRes] = await Promise.all([
    fetch('data/subjects.json'),
    fetch('data/programs.json'),
    fetch('data/universities.json'),
    fetch('data/relationships.json'),
    fetch('data/fiqh.json')
  ]);
  const [subjects, programs, universities, relationships, fiqh] = await Promise.all([
    subjectsRes.json(), programsRes.json(), universitiesRes.json(), relRes.json(), fiqhRes.json()
  ]);
  DATA = {
    subjects: subjects.subjects,
    programs: programs.programs,
    universities: universities.universities,
    relationships: relationships.relationships,
    fiqh: fiqh.themes
  };
  return DATA;
}

function fiqhThemeForProgram(programId) {
  return DATA.fiqh.find(t => t.programs.includes(programId));
}

const TIER_LABEL = { wajib: 'Obligatory', mustahab: 'Recommended', mubah: 'Permissible', makruh: 'Disliked', haram: 'Forbidden' };
const TIER_CLASS = { wajib: 'tier-wajib', mustahab: 'tier-mustahab', mubah: 'tier-mubah', makruh: 'tier-makruh', haram: 'tier-haram' };

function byId(arr, id) { return arr.find(x => x.id === id); }

function relationshipsForProgram(programId) {
  return DATA.relationships.filter(r => r.program_id === programId);
}
function relationshipsForUniversity(universityId) {
  return DATA.relationships.filter(r => r.university_id === universityId);
}

/* ============ NAV ACTIVE STATE + MOBILE TOGGLE ============ */
function initNav() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === path || (path === '' && href === 'index.html')) a.classList.add('active');
  });
  const toggle = document.getElementById('nav-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => links.classList.toggle('open'));
  }
}

/* ============ GENERIC HELPERS ============ */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

/* ============ SUBJECT EXPLORER (subjects.html) ============ */
function renderSubjects() {
  const grid = document.getElementById('subjects-grid');
  const search = document.getElementById('subject-search');
  const catFilter = document.getElementById('subject-category-filter');
  const countEl = document.getElementById('subject-count');
  if (!grid) return;

  const cats = [...new Set(DATA.subjects.map(s => s.category))].sort();
  cats.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c; opt.textContent = c;
    catFilter.appendChild(opt);
  });

  function draw() {
    const q = (search.value || '').toLowerCase();
    const cat = catFilter.value;
    const filtered = DATA.subjects.filter(s => {
      const matchesQ = !q || s.name.toLowerCase().includes(q) || s.careers.join(' ').toLowerCase().includes(q);
      const matchesCat = !cat || s.category === cat;
      return matchesQ && matchesCat;
    });
    countEl.textContent = `${filtered.length} of ${DATA.subjects.length} subjects`;
    grid.innerHTML = filtered.map(s => `
      <article class="card">
        <div class="tag-row"><span class="tag">${escapeHtml(s.category)}</span></div>
        <h3>${escapeHtml(s.name)}</h3>
        <p class="desc">${escapeHtml(s.relevance)}</p>
        <ul class="careers-list">
          ${s.careers.map(c => `<li>${escapeHtml(c)}</li>`).join('')}
        </ul>
      </article>
    `).join('') || '<div class="empty-state">No subjects match that search.</div>';
  }

  search.addEventListener('input', debounce(draw, 120));
  catFilter.addEventListener('change', draw);
  draw();
}

/* ============ PROGRAM EXPLORER (programs.html) ============ */
function renderPrograms() {
  const grid = document.getElementById('programs-grid');
  const search = document.getElementById('program-search');
  const catFilter = document.getElementById('program-category-filter');
  const countEl = document.getElementById('program-count');
  if (!grid) return;

  const cats = [...new Set(DATA.programs.map(p => p.category))].sort();
  cats.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c; opt.textContent = c;
    catFilter.appendChild(opt);
  });

  function cardHtml(p) {
    const rels = relationshipsForProgram(p.id);
    const theme = fiqhThemeForProgram(p.id);
    const fiqhBadge = theme ? `<a href="islamic-rulings.html#fiqh-${theme.id}" class="tag fiqh-tag ${TIER_CLASS[theme.practice.tier]}">Fiqh: ${escapeHtml(TIER_LABEL[theme.practice.tier])} ↗</a>` : '';
    return `
      <article class="card">
        <div class="tag-row"><span class="tag">${escapeHtml(p.category)}</span><span class="tag brass">${rels.length} university link${rels.length === 1 ? '' : 's'} in dataset</span>${fiqhBadge}</div>
        <h3>${escapeHtml(p.name)}</h3>
        <p class="desc">${escapeHtml(p.description)}</p>
        <button class="toggle-btn" data-target="prog-${p.id}">View details</button>
        <div class="details" id="prog-${p.id}">
          <h4>Required / preferred subjects</h4>
          <ul>
            ${p.required.length ? `<li><strong>Required:</strong> ${p.required.map(escapeHtml).join(', ')}</li>` : ''}
            ${p.preferred.length ? `<li><strong>Preferred:</strong> ${p.preferred.map(escapeHtml).join(', ')}</li>` : ''}
            ${p.recommended.length ? `<li><strong>Also helpful:</strong> ${p.recommended.map(escapeHtml).join(', ')}</li>` : ''}
          </ul>
          <h4>Typical grade band</h4>
          <ul><li>${escapeHtml(p.grade_band)}</li></ul>
          <h4>Career paths</h4>
          <ul>${p.careers.map(c => `<li><strong>${escapeHtml(c.title)}</strong> — ${escapeHtml(c.note)}</li>`).join('')}</ul>
          <h4>Typical employers</h4>
          <ul><li>${p.employers.map(escapeHtml).join(', ')}</li></ul>
          <h4>Outlook</h4>
          <ul><li>${escapeHtml(p.outlook)}</li></ul>
          <h4>Alternative pathways</h4>
          <ul><li>${escapeHtml(p.alt_pathways)}</li></ul>
          ${theme ? `<h4>Islamic ruling (research summary)</h4>
          <ul><li><strong>Studying:</strong> ${escapeHtml(theme.studying.tier_label)} — <strong>Practising:</strong> ${escapeHtml(theme.practice.tier_label)}. <a href="islamic-rulings.html#fiqh-${theme.id}">See full sourced ruling on "${escapeHtml(theme.title)}" ↗</a></li></ul>` : ''}
          ${rels.length ? `<h4>Verified universities in this dataset</h4>
          <div>${rels.map(r => {
            const u = byId(DATA.universities, r.university_id);
            return `<div class="uni-link-row"><a href="${escapeHtml(r.source_url)}" target="_blank" rel="noopener">${escapeHtml(u ? u.name : r.university_id)} ↗</a><span class="offer">${escapeHtml(r.typical_offer)}</span></div>`;
          }).join('')}</div>` : ''}
        </div>
      </article>
    `;
  }

  function draw() {
    const q = (search.value || '').toLowerCase();
    const cat = catFilter.value;
    const filtered = DATA.programs.filter(p => {
      const matchesQ = !q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
      const matchesCat = !cat || p.category === cat;
      return matchesQ && matchesCat;
    });
    countEl.textContent = `${filtered.length} of ${DATA.programs.length} programs`;
    grid.innerHTML = filtered.map(cardHtml).join('') || '<div class="empty-state">No programs match that search.</div>';
    grid.querySelectorAll('.toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = document.getElementById(btn.dataset.target);
        target.classList.toggle('open');
        btn.textContent = target.classList.contains('open') ? 'Hide details' : 'View details';
      });
    });
  }

  search.addEventListener('input', debounce(draw, 120));
  catFilter.addEventListener('change', draw);
  draw();
}

/* ============ UNIVERSITY EXPLORER (universities.html) ============ */
function renderUniversities() {
  const grid = document.getElementById('universities-grid');
  const search = document.getElementById('university-search');
  const countryFilter = document.getElementById('university-country-filter');
  const countEl = document.getElementById('university-count');
  if (!grid) return;

  const countries = [...new Set(DATA.universities.map(u => u.country))].sort();
  countries.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c; opt.textContent = c;
    countryFilter.appendChild(opt);
  });

  function cardHtml(u) {
    const rels = relationshipsForUniversity(u.id);
    const rankText = u.qs_rank_2026 ? `QS 2026: #${u.qs_rank_2026}` : (u.qs_rank_2024 ? `QS 2024: #${u.qs_rank_2024}` : 'Not separately ranked in our dataset');
    return `
      <article class="card">
        <div class="tag-row"><span class="tag">${escapeHtml(u.country)}</span><span class="tag brass">${escapeHtml(rankText)}</span></div>
        <h3>${escapeHtml(u.name)}</h3>
        <p class="desc"><strong>${escapeHtml(u.entry_model)}.</strong> ${escapeHtml(u.model_note)}</p>
        <button class="toggle-btn" data-target="uni-${u.id}">View linked programs</button>
        <div class="details" id="uni-${u.id}">
          <h4>Official admissions page</h4>
          <ul><li><a href="${escapeHtml(u.url)}" target="_blank" rel="noopener">${escapeHtml(u.url)} ↗</a></li></ul>
          ${rels.length ? `<h4>Verified program offers</h4>
          <div>${rels.map(r => {
            const p = byId(DATA.programs, r.program_id);
            return `<div class="uni-link-row"><a href="${escapeHtml(r.source_url)}" target="_blank" rel="noopener">${escapeHtml(p ? p.name : r.program_id)} ↗</a><span class="offer">${escapeHtml(r.typical_offer)}</span></div>`;
          }).join('')}</div>` : '<p class="desc">No specific verified offer on record yet for this university — see the official admissions page above.</p>'}
        </div>
      </article>
    `;
  }

  function draw() {
    const q = (search.value || '').toLowerCase();
    const country = countryFilter.value;
    const filtered = DATA.universities.filter(u => {
      const matchesQ = !q || u.name.toLowerCase().includes(q);
      const matchesCountry = !country || u.country === country;
      return matchesQ && matchesCountry;
    });
    countEl.textContent = `${filtered.length} of ${DATA.universities.length} universities`;
    grid.innerHTML = filtered.map(cardHtml).join('') || '<div class="empty-state">No universities match that search.</div>';
    grid.querySelectorAll('.toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = document.getElementById(btn.dataset.target);
        target.classList.toggle('open');
        btn.textContent = target.classList.contains('open') ? 'Hide linked programs' : 'View linked programs';
      });
    });
  }

  search.addEventListener('input', debounce(draw, 120));
  countryFilter.addEventListener('change', draw);
  draw();
}

/* ============ CAREER EXPLORER (careers.html) ============ */
function renderCareers() {
  const grid = document.getElementById('careers-grid');
  const search = document.getElementById('career-search');
  const countEl = document.getElementById('career-count');
  if (!grid) return;

  // Flatten careers across programs
  const careers = [];
  DATA.programs.forEach(p => {
    p.careers.forEach(c => {
      careers.push({ title: c.title, note: c.note, programId: p.id, programName: p.name, category: p.category });
    });
  });

  function draw() {
    const q = (search.value || '').toLowerCase();
    const filtered = careers.filter(c => !q || c.title.toLowerCase().includes(q) || c.programName.toLowerCase().includes(q));
    countEl.textContent = `${filtered.length} career paths across ${DATA.programs.length} programs`;
    grid.innerHTML = filtered.map(c => `
      <article class="card">
        <div class="tag-row"><span class="tag">${escapeHtml(c.category)}</span></div>
        <h3>${escapeHtml(c.title)}</h3>
        <p class="desc">${escapeHtml(c.note)}</p>
        <p class="desc"><strong>Via:</strong> ${escapeHtml(c.programName)}</p>
      </article>
    `).join('') || '<div class="empty-state">No careers match that search.</div>';
  }

  search.addEventListener('input', debounce(draw, 120));
  draw();
}

/* ============ ELIGIBILITY CHECKER (eligibility.html) ============ */
function initEligibilityChecker() {
  const checksWrap = document.getElementById('subject-checks');
  const gradeSelect = document.getElementById('grade-band-select');
  const checkBtn = document.getElementById('check-btn');
  const resultsWrap = document.getElementById('eligibility-results');
  if (!checksWrap) return;

  checksWrap.innerHTML = DATA.subjects.map(s => `
    <label><input type="checkbox" value="${escapeHtml(s.id)}" data-name="${escapeHtml(s.name)}"> ${escapeHtml(s.name)}</label>
  `).join('');

  const gradeRank = { 'top': 4, 'high': 3, 'mid': 2, 'standard': 1 };

  function programGradeRank(band) {
    const b = band.toLowerCase();
    if (b.includes('top tier')) return 4;
    if (b.includes('competitive-to-top') || b.includes('top tier at elite')) return 4;
    if (b.includes('competitive')) return 3;
    if (b.includes('standard-to-competitive')) return 2;
    return 1;
  }

  function computeMatch(selectedNames, userGradeKey) {
    const selectedLower = selectedNames.map(n => n.toLowerCase());
    return DATA.programs.map(p => {
      const reqHits = p.required.filter(r => selectedLower.includes(r.toLowerCase())).length;
      const reqTotal = p.required.length;
      const prefHits = p.preferred.filter(r => selectedLower.includes(r.toLowerCase())).length;
      const prefTotal = p.preferred.length;

      let score = 0;
      let eligible = true;
      if (reqTotal > 0) {
        score += (reqHits / reqTotal) * 60;
        if (reqHits < reqTotal) eligible = false;
      } else {
        score += 30; // no hard requirement, baseline credit
      }
      if (prefTotal > 0) score += (prefHits / prefTotal) * 40;
      else score += 20;

      const gradeNeeded = programGradeRank(p.grade_band);
      const gradeGap = userGradeKey - gradeNeeded;

      let label = 'Target';
      if (!eligible) {
        label = 'Not Eligible';
      } else if (gradeGap >= 1) {
        label = 'Safe';
      } else if (gradeGap === 0) {
        label = 'Target';
      } else {
        label = 'Stretch';
      }

      return { program: p, score, eligible, label, reqHits, reqTotal, prefHits, prefTotal };
    }).sort((a, b) => b.score - a.score);
  }

  checkBtn.addEventListener('click', () => {
    const checked = [...checksWrap.querySelectorAll('input:checked')];
    const selectedNames = checked.map(c => c.dataset.name);
    const userGradeKey = gradeRank[gradeSelect.value] || 2;

    if (selectedNames.length === 0) {
      resultsWrap.innerHTML = '<div class="empty-state">Select at least one A-Level subject to see matches.</div>';
      return;
    }

    const matches = computeMatch(selectedNames, userGradeKey).filter(m => m.label !== 'Not Eligible' || m.reqTotal === 0);
    const shown = matches.slice(0, 24);

    resultsWrap.innerHTML = shown.map(m => {
      const rels = relationshipsForProgram(m.program.id);
      const badgeClass = m.label === 'Safe' ? 'safe' : m.label === 'Stretch' ? 'stretch' : 'target';
      return `
        <div class="result-row">
          <div class="result-top">
            <h4>${escapeHtml(m.program.name)}</h4>
            <span class="badge ${badgeClass}">${escapeHtml(m.label)}</span>
          </div>
          <p class="match-line">Required-subject match: ${m.reqHits}/${m.reqTotal || '—'} · Preferred-subject match: ${m.prefHits}/${m.prefTotal || '—'} · Typical band: ${escapeHtml(m.program.grade_band)}</p>
          ${rels.length ? `<div class="uni-mini-list">${rels.slice(0,3).map(r => {
            const u = byId(DATA.universities, r.university_id);
            return `<div class="uni-link-row"><a href="${escapeHtml(r.source_url)}" target="_blank" rel="noopener">${escapeHtml(u ? u.name : r.university_id)} ↗</a><span class="offer">${escapeHtml(r.typical_offer)}</span></div>`;
          }).join('')}</div>` : ''}
        </div>
      `;
    }).join('') || '<div class="empty-state">No programs matched — try selecting more subjects.</div>';
  });
}

/* ============ ISLAMIC RULINGS (islamic-rulings.html) ============ */
function renderFiqh() {
  const grid = document.getElementById('fiqh-grid');
  if (!grid) return;

  function sourceListHtml(items, kind) {
    if (!items || !items.length) return '';
    if (kind === 'quran') {
      return `<h4>Qur'an</h4><ul>${items.map(q => `<li><strong>${escapeHtml(q.ref)}:</strong> "${escapeHtml(q.quote)}" — ${escapeHtml(q.note)}</li>`).join('')}</ul>`;
    }
    if (kind === 'hadith') {
      return `<h4>Sunnah</h4><ul>${items.map(h => `<li><strong>${escapeHtml(h.ref)}</strong> (${escapeHtml(h.grade)}): ${escapeHtml(h.paraphrase)}</li>`).join('')}</ul>`;
    }
    return '';
  }

  function fatwaListHtml(items) {
    if (!items || !items.length) return '';
    return `<h4>Fatwa sources &amp; further reading</h4><div>${items.map(f => `
      <div class="uni-link-row"><a href="${escapeHtml(f.url)}" target="_blank" rel="noopener">${escapeHtml(f.name)} ↗</a><span class="offer">${escapeHtml(f.position)}</span></div>
    `).join('')}</div>`;
  }

  function programNames(ids) {
    return ids.map(id => { const p = byId(DATA.programs, id); return p ? p.name : id; }).join(', ');
  }

  grid.innerHTML = DATA.fiqh.map(t => `
    <article class="card fiqh-card" id="fiqh-${t.id}">
      <div class="tag-row">
        <span class="tag ${TIER_CLASS[t.studying.tier]}">Studying: ${escapeHtml(TIER_LABEL[t.studying.tier])}</span>
        <span class="tag ${TIER_CLASS[t.practice.tier]}">Practising: ${escapeHtml(TIER_LABEL[t.practice.tier])}</span>
      </div>
      <h3>${escapeHtml(t.title)}</h3>
      <p class="desc"><strong>Applies to:</strong> ${escapeHtml(programNames(t.programs))}</p>
      <p class="desc">${escapeHtml(t.summary)}</p>
      <button class="toggle-btn" data-target="fiqhdetail-${t.id}">View full sourced ruling</button>
      <div class="details" id="fiqhdetail-${t.id}">
        <h4>On studying this field</h4>
        <ul><li><strong>${escapeHtml(TIER_LABEL[t.studying.tier])}.</strong> ${escapeHtml(t.studying.explanation)}</li></ul>
        <h4>On working in this field</h4>
        <ul><li><strong>${escapeHtml(TIER_LABEL[t.practice.tier])}.</strong> ${escapeHtml(t.practice.explanation)}</li></ul>
        ${t.scholarly_note ? `<h4>A note on scholarly difference</h4><ul><li>${escapeHtml(t.scholarly_note)}</li></ul>` : ''}
        ${sourceListHtml(t.quran, 'quran')}
        ${sourceListHtml(t.hadith, 'hadith')}
        ${t.principle ? `<h4>Ijmā' &amp; Qiyās (principle applied)</h4><ul><li>${escapeHtml(t.principle)}</li></ul>` : ''}
        ${fatwaListHtml(t.fatwa_sources)}
      </div>
    </article>
  `).join('');

  grid.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = document.getElementById(btn.dataset.target);
      target.classList.toggle('open');
      btn.textContent = target.classList.contains('open') ? 'Hide full sourced ruling' : 'View full sourced ruling';
    });
  });

  // auto-expand if arriving via #fiqh-xxx anchor link
  if (window.location.hash.startsWith('#fiqh-')) {
    const card = document.querySelector(window.location.hash);
    if (card) {
      const detail = card.querySelector('.details');
      const btn = card.querySelector('.toggle-btn');
      if (detail && btn) { detail.classList.add('open'); btn.textContent = 'Hide full sourced ruling'; }
      setTimeout(() => card.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    }
  }
}

/* ============ ENTRY POINT ============ */
document.addEventListener('DOMContentLoaded', async () => {
  initNav();
  try {
    await loadData();
  } catch (e) {
    console.error('Failed to load data', e);
    const main = document.querySelector('main');
    if (main) {
      main.innerHTML = '<div class="wrap"><div class="empty-state">Could not load the dataset (data/*.json). If you opened this file directly from your computer, your browser blocks local data loading for security reasons — run a local server (e.g. <code>python3 -m http.server</code>) or deploy to GitHub Pages, then reload.</div></div>' + main.innerHTML;
    }
    return;
  }
  renderSubjects();
  renderPrograms();
  renderUniversities();
  renderCareers();
  renderFiqh();
  initEligibilityChecker();

  // Home page stat fill-ins
  const statSubjects = document.getElementById('stat-subjects');
  const statPrograms = document.getElementById('stat-programs');
  const statUniversities = document.getElementById('stat-universities');
  const statRelationships = document.getElementById('stat-relationships');
  const statFiqh = document.getElementById('stat-fiqh');
  if (statSubjects) statSubjects.textContent = DATA.subjects.length;
  if (statPrograms) statPrograms.textContent = DATA.programs.length;
  if (statUniversities) statUniversities.textContent = DATA.universities.length;
  if (statRelationships) statRelationships.textContent = DATA.relationships.length;
  if (statFiqh) statFiqh.textContent = DATA.fiqh.length;
});
