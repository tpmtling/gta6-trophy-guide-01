// Leonida Legend: an offline GTA VI trophy guide and tracker.
// Loads the official 55-trophy list from data/trophies.json, renders a cited
// guide per trophy, a 3-stage platinum roadmap and a missable alert, and keeps
// the reader's checklist in localStorage with export / import. No network use
// beyond the one local data file; every other behaviour is computed here.

const STORAGE_KEY = 'leonida-legend-progress-v1';
const SPOILER_KEY = 'leonida-legend-spoiler-shield';

const GRADE_ORDER = { platinum: 0, gold: 1, silver: 2, bronze: 3 };
const KIND_LABELS = {
  all: 'All 55',
  story: 'Story',
  side: 'Side questlines',
  activity: 'Activities',
  collectible: 'Collectibles & scans',
  crime: 'Crime & robberies',
  secret: 'Secrets & one-offs',
  money: 'Money & property',
  character: 'Character',
  completion: '100% completion',
  platinum: 'Platinum',
  online: 'Online',
};

const listEl = document.getElementById('trophyList');
const countEl = document.getElementById('listCount');
const titleEl = document.getElementById('listTitle');
const emptyEl = document.getElementById('emptyState');
const detailEl = document.getElementById('detailPanel');
const detailBodyEl = document.getElementById('detailBody');
const scrimEl = document.getElementById('scrim');

let guideDoc = null;
let earnedIds = loadEarnedIds();
let activeKind = 'all';
let selectedId = null;

function loadEarnedIds() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    return new Set(Array.isArray(raw) ? raw.filter((n) => Number.isInteger(n)) : []);
  } catch {
    return new Set();
  }
}

function saveEarnedIds() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...earnedIds].sort((a, b) => a - b)));
}

function trophyById(id) {
  return guideDoc.trophies.find((t) => t.id === id);
}

function isSpoilerMasked(trophy) {
  const shieldOn = document.getElementById('spoilerToggle').checked;
  return shieldOn && trophy.kind === 'story' && !earnedIds.has(trophy.id);
}

function visibleName(trophy) {
  return isSpoilerMasked(trophy) ? 'Hidden story trophy' : trophy.name;
}

function visibleDescription(trophy) {
  if (isSpoilerMasked(trophy)) return 'Spoiler shield is on: this story trophy stays hidden until you earn it.';
  return trophy.description;
}

function gradeBadge(trophy) {
  const span = document.createElement('span');
  span.className = `badge grade-${trophy.grade}`;
  span.textContent = trophy.grade;
  return span;
}

function flagBadges(trophy) {
  const wrap = document.createElement('span');
  wrap.className = 'flags';
  if (trophy.missable) {
    const b = document.createElement('span');
    b.className = 'badge flag-missable';
    b.textContent = '⚠ potentially missable';
    wrap.append(b);
  }
  if (trophy.hidden) {
    const b = document.createElement('span');
    b.className = 'badge flag-hidden';
    b.textContent = 'hidden on PSN';
    wrap.append(b);
  }
  if (trophy.count) {
    const b = document.createElement('span');
    b.className = 'badge flag-count';
    b.textContent = trophy.count;
    wrap.append(b);
  }
  const stage = document.createElement('span');
  stage.className = 'badge flag-stage';
  stage.textContent = `Stage ${trophy.stage}`;
  wrap.append(stage);
  return wrap;
}

function currentFilters() {
  return {
    kind: activeKind,
    grade: document.getElementById('gradeFilter').value,
    state: document.getElementById('stateFilter').value,
    sort: document.getElementById('sortFilter').value,
    query: document.getElementById('searchInput').value.trim().toLowerCase(),
  };
}

function trophyMatches(trophy, f) {
  if (f.kind === 'online') return false; // the official list has no online trophies
  if (f.kind !== 'all' && trophy.kind !== f.kind) return false;
  if (f.grade !== 'all' && trophy.grade !== f.grade) return false;
  if (f.state === 'earned' && !earnedIds.has(trophy.id)) return false;
  if (f.state === 'remaining' && earnedIds.has(trophy.id)) return false;
  if (f.state === 'missable' && !trophy.missable) return false;
  if (f.state === 'hidden' && !trophy.hidden) return false;
  if (f.query) {
    const haystack = `${trophy.name} ${trophy.description} ${trophy.guide} ${KIND_LABELS[trophy.kind] ?? ''}`.toLowerCase();
    if (!haystack.includes(f.query)) return false;
  }
  return true;
}

function sortTrophies(rows, mode) {
  const byId = (a, b) => a.id - b.id;
  if (mode === 'name') return rows.sort((a, b) => a.name.localeCompare(b.name) || byId(a, b));
  if (mode === 'grade') return rows.sort((a, b) => GRADE_ORDER[a.grade] - GRADE_ORDER[b.grade] || byId(a, b));
  if (mode === 'stage') return rows.sort((a, b) => a.stage - b.stage || byId(a, b));
  return rows.sort(byId);
}

function renderHeroStats() {
  const s = guideDoc.summary;
  const items = [
    ['55', 'trophies: 1 platinum · 2 gold · 6 silver · 46 bronze'],
    ['28', 'hidden on PlayStation until earned'],
    ['0', 'online trophies — the whole list is offline'],
    ['4/10', 'difficulty (PowerPyx estimate)'],
    ['~200 h', 'to the platinum, 1 playthrough'],
    ['1', 'potentially missable trophy — flagged below'],
  ];
  const wrap = document.getElementById('heroStats');
  wrap.replaceChildren();
  for (const [big, small] of items) {
    const d = document.createElement('div');
    d.className = 'stat';
    const b = document.createElement('strong');
    b.textContent = big;
    const p = document.createElement('span');
    p.textContent = small;
    d.append(b, p);
    wrap.append(d);
  }
  document.getElementById('roadmapFacts').textContent =
    `Difficulty ${s.difficulty}. ${s.hours}. ${s.playthroughs} ${s.warnings}`;
  const alert = document.getElementById('missableAlert');
  alert.replaceChildren();
  const head = document.createElement('strong');
  head.textContent = 'Missable watch — read before Chapter 1 ends: ';
  alert.append(head, document.createTextNode(s.missable));
}

function renderRoadmap() {
  const wrap = document.getElementById('stages');
  wrap.replaceChildren();
  for (const stage of guideDoc.roadmap) {
    const card = document.createElement('article');
    card.className = 'stage-card';
    const h = document.createElement('h3');
    h.textContent = `Stage ${stage.stage} — ${stage.title}`;
    const hours = document.createElement('p');
    hours.className = 'stage-hours';
    hours.textContent = stage.hours;
    const detail = document.createElement('p');
    detail.textContent = stage.detail;
    const trophies = document.createElement('p');
    trophies.className = 'stage-trophies';
    trophies.textContent = `Key trophies: ${stage.trophies}`;
    card.append(h, hours, detail, trophies);
    wrap.append(card);
  }
}

function renderKindChips() {
  const wrap = document.getElementById('kindChips');
  wrap.replaceChildren();
  for (const [kind, label] of Object.entries(KIND_LABELS)) {
    const n = kind === 'all'
      ? guideDoc.trophies.length
      : kind === 'online'
        ? 0
        : guideDoc.trophies.filter((t) => t.kind === kind).length;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = kind === activeKind ? 'chip chip-active' : 'chip';
    btn.textContent = `${label} · ${n}`;
    btn.addEventListener('click', () => {
      activeKind = kind;
      renderKindChips();
      renderList();
    });
    wrap.append(btn);
  }
}

function renderProgress() {
  const total = guideDoc.trophies.length;
  const done = earnedIds.size;
  document.getElementById('progressBig').textContent = `${done} / ${total}`;
  document.getElementById('barFill').style.width = `${(done / total) * 100}%`;
  const byGrade = ['platinum', 'gold', 'silver', 'bronze'].map((g) => {
    const all = guideDoc.trophies.filter((t) => t.grade === g);
    const got = all.filter((t) => earnedIds.has(t.id)).length;
    return `${got}/${all.length} ${g}`;
  });
  document.getElementById('progressLabel').textContent = `trophies earned — ${byGrade.join(' · ')}`;
  const next = guideDoc.trophies.find((t) => !earnedIds.has(t.id) && t.missable)
    ?? guideDoc.trophies.find((t) => !earnedIds.has(t.id));
  document.getElementById('progressNext').textContent = done === total
    ? 'Platinum earned. Welcome to the legend club.'
    : `Next up: ${next.name} (${next.grade}, Stage ${next.stage})`;
}

function buildTrophyCard(trophy) {
  const card = document.createElement('article');
  card.className = earnedIds.has(trophy.id) ? 'card card-earned' : 'card';
  if (trophy.missable) card.classList.add('card-missable');

  const top = document.createElement('div');
  top.className = 'card-top';
  const checkLabel = document.createElement('label');
  checkLabel.className = 'check';
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = earnedIds.has(trophy.id);
  box.setAttribute('aria-label', `Mark ${trophy.name} as earned`);
  box.addEventListener('change', () => toggleEarned(trophy.id, box.checked));
  const checkText = document.createElement('span');
  checkText.textContent = 'Earned';
  checkLabel.append(box, checkText);
  top.append(checkLabel, gradeBadge(trophy), flagBadges(trophy));

  const name = document.createElement('h3');
  name.className = 'card-name';
  name.textContent = visibleName(trophy);
  const desc = document.createElement('p');
  desc.className = 'card-desc';
  desc.textContent = visibleDescription(trophy);
  const kind = document.createElement('p');
  kind.className = 'card-kind';
  kind.textContent = KIND_LABELS[trophy.kind] ?? trophy.kind;

  const guideBtn = document.createElement('button');
  guideBtn.type = 'button';
  guideBtn.className = 'guide-btn';
  guideBtn.textContent = selectedId === trophy.id ? 'Hide guide' : 'Read the guide';
  guideBtn.addEventListener('click', () => openDetail(trophy.id));

  card.append(top, name, desc, kind, guideBtn);
  if (selectedId === trophy.id) card.append(buildGuideBlock(trophy));
  return card;
}

function buildGuideBlock(trophy) {
  const block = document.createElement('div');
  block.className = 'guide-block';
  const guide = document.createElement('p');
  guide.className = 'guide-text';
  guide.textContent = isSpoilerMasked(trophy)
    ? 'Spoiler shield is on, so this guide stays covered until the trophy is earned. Turn the shield off above to read it now.'
    : trophy.guide;
  block.append(guide);
  if (trophy.missable) {
    const warn = document.createElement('p');
    warn.className = 'guide-warn';
    warn.textContent = 'Missable watch: this is the one trophy that may not be earnable later in the same playthrough. See the alert at the top of the roadmap.';
    block.append(warn);
  }
  const src = document.createElement('p');
  src.className = 'guide-sources';
  src.textContent = `Sources: ${trophy.sources.join(' · ')}`;
  block.append(src);
  return block;
}

function renderList() {
  const f = currentFilters();
  const rows = sortTrophies(guideDoc.trophies.filter((t) => trophyMatches(t, f)), f.sort);
  listEl.replaceChildren();
  for (const trophy of rows) listEl.append(buildTrophyCard(trophy));
  titleEl.textContent = f.kind === 'online'
    ? 'Online trophies'
    : f.state === 'missable'
      ? 'Missable watch'
      : f.kind === 'all' ? 'All 55 trophies' : `${KIND_LABELS[f.kind]} trophies`;
  countEl.textContent = f.kind === 'online'
    ? 'None — GTA VI launched as a single-player game and the official list contains no online trophies (PowerPyx: 0 online trophies).'
    : `Showing ${rows.length} of ${guideDoc.trophies.length} · ${earnedIds.size} earned overall`;
  emptyEl.hidden = rows.length !== 0;
  if (rows.length === 0 && f.kind !== 'online') {
    emptyEl.textContent = 'No trophy matches these filters. Clear the search or pick another kind.';
  } else if (rows.length === 0) {
    emptyEl.textContent = 'There is nothing to track here: no trophy in the official list needs online play.';
  }
  renderProgress();
}

function toggleEarned(id, on) {
  if (on) earnedIds.add(id);
  else earnedIds.delete(id);
  saveEarnedIds();
  renderList();
  if (selectedId === id && !detailEl.hidden) renderDetail();
}

function openDetail(id) {
  if (selectedId === id && !detailEl.hidden) {
    closeDetail();
    renderList();
    return;
  }
  selectedId = id;
  renderDetail();
  renderList();
}

function renderDetail() {
  const trophy = trophyById(selectedId);
  if (!trophy) return;
  detailBodyEl.replaceChildren();
  const h = document.createElement('h2');
  h.textContent = visibleName(trophy);
  const meta = document.createElement('p');
  meta.className = 'detail-meta';
  meta.append(gradeBadge(trophy), flagBadges(trophy));
  const desc = document.createElement('p');
  desc.className = 'detail-desc';
  desc.textContent = visibleDescription(trophy);
  detailBodyEl.append(h, meta, desc, buildGuideBlock(trophy));
  const mark = document.createElement('button');
  mark.type = 'button';
  mark.className = 'guide-btn';
  mark.textContent = earnedIds.has(trophy.id) ? 'Mark as not earned' : 'Mark as earned';
  mark.addEventListener('click', () => toggleEarned(trophy.id, !earnedIds.has(trophy.id)));
  detailBodyEl.append(mark);
  detailEl.hidden = false;
  scrimEl.hidden = false;
}

function closeDetail() {
  selectedId = null;
  detailEl.hidden = true;
  scrimEl.hidden = true;
}

function exportProgress() {
  const payload = JSON.stringify({ app: 'leonida-legend', version: 1, earned: [...earnedIds] }, null, 2);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
  a.download = 'gta6-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

async function importProgress(file) {
  try {
    const parsed = JSON.parse(await file.text());
    const ids = Array.isArray(parsed) ? parsed : parsed.earned;
    if (!Array.isArray(ids)) throw new Error('no earned list');
    earnedIds = new Set(ids.filter((n) => trophyById(n)));
    saveEarnedIds();
    renderList();
    if (selectedId !== null) renderDetail();
  } catch {
    emptyEl.hidden = false;
    emptyEl.textContent = 'That file could not be imported as trophy progress.';
  }
}

function renderSources() {
  const ul = document.getElementById('sourceList');
  ul.replaceChildren();
  for (const source of guideDoc.sources) {
    const li = document.createElement('li');
    if (source.url) {
      const a = document.createElement('a');
      a.href = source.url;
      a.textContent = source.label;
      a.rel = 'noopener';
      li.append(a);
    } else {
      li.textContent = source.label;
    }
    ul.append(li);
  }
}

function wireControls() {
  for (const id of ['gradeFilter', 'stateFilter', 'sortFilter']) {
    document.getElementById(id).addEventListener('change', renderList);
  }
  document.getElementById('searchInput').addEventListener('input', renderList);
  const spoiler = document.getElementById('spoilerToggle');
  spoiler.checked = localStorage.getItem(SPOILER_KEY) === 'on';
  spoiler.addEventListener('change', () => {
    localStorage.setItem(SPOILER_KEY, spoiler.checked ? 'on' : 'off');
    renderList();
    if (selectedId !== null && !detailEl.hidden) renderDetail();
  });
  document.getElementById('exportBtn').addEventListener('click', exportProgress);
  document.getElementById('importInput').addEventListener('change', (e) => {
    if (e.target.files[0]) importProgress(e.target.files[0]);
    e.target.value = '';
  });
  document.getElementById('resetBtn').addEventListener('click', () => {
    earnedIds = new Set();
    saveEarnedIds();
    renderList();
    if (selectedId !== null && !detailEl.hidden) renderDetail();
  });
  document.getElementById('detailClose').addEventListener('click', () => { closeDetail(); renderList(); });
  scrimEl.addEventListener('click', () => { closeDetail(); renderList(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !detailEl.hidden) { closeDetail(); renderList(); }
  });
  // Deep links for screenshots and sharing: #trophy=28 opens that guide,
  // #missable jumps to the missable watch, #roadmap to the roadmap.
  const hash = new URLSearchParams(location.hash.replace(/^#/, ''));
  if (hash.get('trophy')) {
    const t = trophyById(Number(hash.get('trophy')));
    if (t) { selectedId = t.id; renderDetail(); }
  }
  if (hash.get('filter') === 'missable') {
    document.getElementById('stateFilter').value = 'missable';
  }
  if (hash.get('shield') === 'on') {
    spoiler.checked = true;
    localStorage.setItem(SPOILER_KEY, 'on');
  }
}

async function bootGuideApp() {
  guideDoc = await (await fetch('data/trophies.json')).json();
  renderHeroStats();
  renderRoadmap();
  renderSources();
  wireControls();
  renderKindChips();
  renderList();
  if (selectedId !== null) renderDetail();
}

bootGuideApp();
