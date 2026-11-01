/* ============================================================
 * 本草维度 · 前端控制器
 * 数据全部经 Flask REST API 获取；三维场景由服务端计算
 * ============================================================ */
import { SphereGraph } from './sphere.js';
import { api } from './api.js';
import { store } from './store.js';
import { state, isFav } from './state.js';
import { $, $$, esc, save } from './ui.js';
import * as V from './views.js';

const COMPARE_MAX = 4;

/* ================= 三维引擎 ================= */
const canvas = $('#graph');
const graph = new SphereGraph(canvas, {
  onSelect: (node) => handleNodeClick(node),
  onHover: () => {},
  onBackground: () => {
    // 点击三维空白：收回右侧详情面板 + 清空轨迹 + 球体复位回全景
    state.trail = [];
    state.detail = null;
    closeDetailPanel();
    go({ mode: 'overview' }, false);
    graph.resetView();
    renderCrumbs();
  },
  onExpand: (node) => {
    const v = Object.assign({}, state.view, { deep: !state.view.deep });
    if (node.type === 'herb') { v.mode = 'herb'; v.id = node.id.slice(2); }
    else if (node.type === 'formula') { v.mode = 'formula'; v.id = node.id.slice(2); }
    go(v, false);
  }
});

/* ================= 导航 ================= */
let navToken = 0;

async function go(v, pushTrail) {
  const token = ++navToken;
  state.view = v;
  let sc;
  try {
    sc = await api.graph(v);
  } catch (e) {
    sc = { mode: 'sphere', nodes: [], links: [], title: '' };
  }
  if (token !== navToken) return;      // 已被更新的导航取代
  graph.setScene(sc, pushTrail === false ? undefined : 'reset');
  selectNode(v);
  renderCrumbs();
  syncModeButtons();
  updateStageTitle(sc.title);
}

function selectNode(v) {
  if (v.mode === 'herb') graph.select('h:' + v.id);
  else if (v.mode === 'formula') graph.select('f:' + v.id);
  else if (v.mode === 'effect') graph.select('e:' + v.key);
  else if (v.mode === 'meridian') graph.select('m:' + v.key);
  else if (v.mode === 'category' || v.mode === 'fcat') graph.select('c:' + v.key);
  else if (v.mode === 'combo') graph.select('k:combo');
  else if (v.mode === 'book') graph.select('b:shanghan');
  else if (v.mode === 'liujing') graph.select('l:' + v.key);
  else if (v.mode === 'fjx') graph.select('b:fangjixue');
  else if (v.mode === 'fjxchapter') graph.select('x:' + v.key);
  else graph.select(null);
}

function handleNodeClick(node) {
  if (!node) return;
  const idx = node.id.indexOf(':');
  const t = node.id.slice(0, idx);
  const id = node.id.slice(idx + 1);
  if (t === 'h') openHerb(id);
  else if (t === 'f') openFormula(id);
  else if (t === 'b') { if (id === 'fangjixue') openFjx(); else openBook(); }
  else if (t === 'l') openLiujing(id);
  else if (t === 'x') openFjxChapter(id);
  else if (t === 'e') openEffect(node.label.replace(' 功效', ''));
  else if (t === 'm') openMeridian(node.label.replace('经', ''));
  else if (t === 'c') {
    const isFcat = store.formulas.some((f) => f.cat === id);
    if (isFcat) openFCat(id); else openCategory(id);
  } else if (t === 'k') {
    renderDetail();
  }
}

function pushTrail(kind, id, name) {
  const last = state.trail[state.trail.length - 1];
  if (last && last.kind === kind && last.id === id) return;
  state.trail.push({ kind, id, name });
  if (state.trail.length > 14) state.trail.shift();
}

function addHistory(name) {
  state.hist = [name].concat(state.hist.filter((x) => x !== name)).slice(0, 14);
  save('tcm.hist', state.hist);
  renderSidebar();
}

/* ---------------- 打开各类详情 ---------------- */
async function openHerb(id, noTrail) {
  const h = store.herb(id);
  if (!h) return;
  state.detail = { kind: 'herb', id };
  if (!store.herbDetail(id)) {
    try {
      const d = await api.herb(id);
      store.setHerbDetail(id, d);
    } catch (e) { /* ignore */ }
  }
  if (!noTrail) pushTrail('herb', id, h.name);
  addHistory(h.name);
  await go({ mode: 'herb', id });
  await renderDetail();
  renderCrumbs();
  openDetailOnMobile();
}

async function openFormula(id, noTrail) {
  const f = store.formula(id);
  if (!f) return;
  state.detail = { kind: 'formula', id };
  if (!store.formulaDetail(id)) {
    try {
      const d = await api.formula(id);
      store.setFormulaFull(d);
    } catch (e) { /* ignore */ }
  }
  if (!noTrail) pushTrail('formula', id, f.name);
  addHistory(f.name);
  await go({ mode: 'formula', id });
  await renderDetail();
  renderCrumbs();
  openDetailOnMobile();
}

async function openEffect(key) {
  state.detail = { kind: 'effect', key };
  pushTrail('effect', key, key);
  await go({ mode: 'effect', key });
  await renderDetail();
  openDetailOnMobile();
}

async function openMeridian(key) {
  state.detail = { kind: 'meridian', key };
  pushTrail('meridian', key, key + '经');
  await go({ mode: 'meridian', key });
  await renderDetail();
  openDetailOnMobile();
}

async function openCategory(key) {
  state.detail = { kind: 'category', key };
  pushTrail('category', key, key);
  await go({ mode: 'category', key });
  await renderDetail();
  openDetailOnMobile();
}

async function openFCat(key) {
  state.detail = { kind: 'fcat', key };
  pushTrail('fcat', key, key);
  await go({ mode: 'fcat', key });
  await renderDetail();
  openDetailOnMobile();
}

async function openBook() {
  state.detail = { kind: 'book' };
  if (!store.shanghan) store.shanghan = await api.bookShanghan();
  pushTrail('book', 'shanghan', '伤寒论');
  await go({ mode: 'book' });
  await renderDetail();
  renderCrumbs();
  openDetailOnMobile();
}

async function openLiujing(key) {
  state.detail = { kind: 'liujing', key };
  if (!store.liujing.has(key)) store.liujing.set(key, await api.bookLiujing(key));
  pushTrail('liujing', key, key);
  await go({ mode: 'liujing', key });
  await renderDetail();
  renderCrumbs();
  openDetailOnMobile();
}

async function openFjx() {
  state.detail = { kind: 'fjx' };
  if (!store.fangjixue) store.fangjixue = await api.bookFangjixue();
  pushTrail('fjx', 'fangjixue', '方剂学');
  await go({ mode: 'fjx' });
  await renderDetail();
  renderCrumbs();
  openDetailOnMobile();
}

async function openFjxChapter(name) {
  state.detail = { kind: 'fjxchapter', key: name };
  if (!store.fangjixue) store.fangjixue = await api.bookFangjixue();
  if (!store.fxChapter.has(name)) store.fxChapter.set(name, await api.bookFjxChapter(name));
  pushTrail('fjxchapter', name, name);
  await go({ mode: 'fjxchapter', key: name });
  await renderDetail();
  renderCrumbs();
  openDetailOnMobile();
}

async function openCombo(ids) {
  state.combo = ids.slice();
  state.detail = { kind: 'combo' };
  await go({ mode: 'combo', ids: state.combo });
  await renderDetail();
  openDetailOnMobile();
}

async function openBrowse(kind) {
  if (kind === 'shanghan' && !store.shanghan) store.shanghan = await api.bookShanghan();
  if ((kind === 'fangjixue' || kind === 'formulas') && !store.fangjixue) store.fangjixue = await api.bookFangjixue();
  state.detail = { kind: 'browse', list: kind };
  // 同步转动球体
  if (kind === 'formulas') { await go({ mode: 'fcat' }); }
  else if (kind === 'herbs') { await go({ mode: 'category' }); }
  else if (kind === 'classic') { await go({ mode: 'overview' }); }
  await renderDetail();
  openDetailOnMobile();
}

/* ---------------- 方剂对比 ---------------- */
const inCompare = (id) => state.compare.includes(id);

function toggleCompare(id) {
  if (inCompare(id)) state.compare = state.compare.filter((x) => x !== id);
  else {
    if (state.compare.length >= COMPARE_MAX) state.compare = state.compare.slice(1);
    state.compare.push(id);
  }
  renderCompareBar();
  if (state.detail && state.detail.kind === 'formula') renderDetail();
  if (state.detail && state.detail.kind === 'compare') renderDetail();
}

async function openCompare() {
  state.detail = { kind: 'compare' };
  await renderDetail();
  openDetailOnMobile();
}

function renderCompareBar() {
  const bar = document.getElementById('compareBar');
  if (!bar) return;
  if (!state.compare.length) {
    bar.classList.add('hidden');
    bar.innerHTML = '';
    return;
  }
  bar.classList.remove('hidden');
  const chips = state.compare.map((id) => {
    const f = store.formula(id);
    return `<button class="cmp-chip" data-rmcmp="${id}">${esc(f ? f.name : id)}<span class="x">×</span></button>`;
  }).join('');
  bar.innerHTML = `<div class="cmp-bar-inner">
    <span class="cmp-bar-label">对比篮 <b>${state.compare.length}</b>/${COMPARE_MAX}</span>
    <div class="cmp-chips">${chips}</div>
    <div class="cmp-bar-acts">
      <button class="btn-ghost" data-cmp-clear>清空</button>
      <button class="btn-primary" data-open-compare>开始对比</button>
    </div>
  </div>`;
}

/* ================= 面包屑 ================= */
function renderCrumbs() {
  const el = $('#crumbs');
  const parts = ['<button class="crumb" data-crumb="-1">全景</button>'];
  state.trail.forEach((t, i) => {
    parts.push('<span class="crumb-sep">›</span>');
    parts.push(`<button class="crumb${i === state.trail.length - 1 ? ' on' : ''}" data-crumb="${i}">${esc(t.name)}</button>`);
  });
  el.innerHTML = parts.join('');
  el.scrollLeft = el.scrollWidth;
  syncBackBtn();
}

/* 根据历史栈深度，显示/隐藏详情面板的回退按钮 */
function syncBackBtn() {
  const bb = document.getElementById('detailBack');
  if (bb) bb.classList.toggle('hidden', state.trail.length < 2);
}

function jumpCrumb(i) {
  if (i < 0) {
    state.trail = [];
    state.detail = null;
    go({ mode: 'overview' });
    renderCrumbs();
    return;
  }
  const t = state.trail[i];
  state.trail = state.trail.slice(0, i + 1);
  reopenTrail(t);
}

/* 重新打开历史栈中的某一项（不重复入栈） */
async function reopenTrail(t) {
  if (!t) return;
  if (t.kind === 'herb') await openHerb(t.id, true);
  else if (t.kind === 'formula') await openFormula(t.id, true);
  else if (t.kind === 'effect') openEffect(t.key || t.id);
  else if (t.kind === 'meridian') openMeridian(t.key || t.id);
  else if (t.kind === 'category') openCategory(t.key || t.id);
  else if (t.kind === 'fcat') openFCat(t.key || t.id);
  else if (t.kind === 'book') openBook();
  else if (t.kind === 'liujing') openLiujing(t.key || t.id);
  else if (t.kind === 'fjx') openFjx();
  else if (t.kind === 'fjxchapter') openFjxChapter(t.key || t.id);
}

/* 回退：回到详情面板里的上一页（弹出当前页，重开上一页） */
async function back() {
  if (state.trail.length < 2) return;
  state.trail.pop();                       // 移除当前页
  const prev = state.trail[state.trail.length - 1];
  await reopenTrail(prev);                 // 重开上一页（不再入栈）
  renderCrumbs();
}

/* ================= 舞台标题 ================= */
function updateStageTitle(title) {
  const el = $('#stageTitle');
  if (!el) return;
  const c = store.counts;
  el.textContent = title || `全景知识网络 · ${c.herbs} 味中药 · ${c.formulas} 首方剂`;
}

function syncModeButtons() {
  $$('#modes button').forEach((b) => b.classList.toggle('on', b.dataset.view === state.view.mode));
}

/* ================= 左侧导航 ================= */
function renderSidebar() {
  const g = state.openGroups;
  const group = (key, title, body) => `
    <div class="side-group">
      <button class="side-title" data-group="${key}">
        <span>${title}</span><span class="caret ${g[key] ? 'open' : ''}">▾</span>
      </button>
      <div class="side-body ${g[key] ? '' : 'hide'}">${body}</div>
    </div>`;

  const meta = store.meta || { categories: [], effects: [], meridians: [], fcats: [] };
  const sh = meta.shanghan || { liujing: [] };
  const fx = meta.fangjixue || { chapters: [] };
  const nSh = store.shanghanFormulas().length;
  const nFx = store.fjxFormulas().length;

  const nav = `
    <button class="nav-item ${state.view.mode === 'overview' ? 'on' : ''}" data-act="overview">
      <span class="nav-ico">◎</span>全景知识网络<span class="num">${store.herbs.length + store.formulas.length}</span>
    </button>
    <button class="nav-item ${state.view.mode === 'category' ? 'on' : ''}" data-act="browse-herbs"><span class="nav-ico herb">◈</span>中药大全<span class="num">${store.herbs.length}</span></button>
    <button class="nav-item ${state.view.mode === 'fcat' ? 'on' : ''}" data-act="browse-formulas"><span class="nav-ico formula">◆</span>方剂<span class="num">${store.formulas.length}</span></button>
    <button class="nav-item ${state.detail && state.detail.kind === 'browse' && state.detail.list === 'classic' ? 'on' : ''}" data-act="classic"><span class="nav-ico gold">✦</span>经典方剂<span class="num">${store.formulas.filter((f) => (f.n || 0) >= 6).length}</span></button>
    <button class="nav-item ${state.view.mode === 'book' || state.view.mode === 'liujing' ? 'on' : ''}" data-act="book"><span class="nav-ico gold">❖</span>《伤寒论》<span class="num">${nSh}</span></button>
    <button class="nav-item ${state.detail && state.detail.kind === 'docs' ? 'on' : ''}" data-act="docs"><span class="nav-ico plain">▤</span>原始文档<span class="num">2</span></button>`;

  const ljs = sh.liujing.map((k) => {
    const n = store.formulas.filter((f) => f.book === 'shanghan' && f.lj === k).length;
    return `<button class="nav-item sub" data-lj="${esc(k)}">${esc(k)}<span class="num">${n}</span></button>`;
  }).join('');

  const fxchs = fx.chapters.map((c) => {
    const n = store.formulas.filter((f) => f.fjx && f.cat === c).length;
    return `<button class="nav-item sub" data-fxch="${esc(c)}">${esc(c)}<span class="num">${n}</span></button>`;
  }).join('');

  const cats = meta.categories
    .map((c) => `<button class="nav-item sub" data-cat="${esc(c.name)}">${esc(c.name)}<span class="num">${c.n}</span></button>`).join('');

  const effs = meta.effects.slice(0, 40)
    .map((e) => `<button class="nav-item sub" data-eff="${esc(e.name)}">${esc(e.name)}<span class="num">${e.n}</span></button>`).join('');

  const mers = meta.meridians
    .map((m) => `<button class="nav-item sub" data-mer="${esc(m.name)}">${esc(m.name)}经<span class="num">${m.n}</span></button>`).join('');

  const fcats = meta.fcats
    .map((c) => `<button class="nav-item sub" data-fcat="${esc(c.name)}">${esc(c.name)}<span class="num">${c.n}</span></button>`).join('');

  const favs = state.fav.length
    ? state.fav.slice(0, 8).map((x) => `<button class="nav-item sub" data-favgo="${x.key}">${esc(x.name)}</button>`).join('')
    : '<div class="side-empty">尚未收藏</div>';

  const hist = state.hist.length
    ? state.hist.slice(0, 8).map((n) => `<button class="nav-item sub" data-hist="${esc(n)}">${esc(n)}</button>`).join('')
    : '<div class="side-empty">暂无搜索记录</div>';

  $('#sideScroll').innerHTML =
    group('nav', '知识导航', nav) +
    group('book', '典籍 · 伤寒论六经', ljs) +
    group('fjx', '教材 · 方剂学 ' + fx.chapters.length + ' 章', fxchs) +
    group('cat', '按药物类别', cats) +
    group('eff', '按功效分类', effs) +
    group('mer', '按归经分类', mers) +
    group('fcat', '按方剂分类', fcats) +
    group('mine', '我的收藏夹', favs) +
    `<div class="side-group"><button class="side-title static"><span>搜索记录</span></button><div class="side-body">${hist}</div></div>`;
}

/* ================= 详情面板 ================= */
let detailToken = 0;
const relCache = new Map();
let docsCache = null;

async function renderDetail() {
  const d = state.detail;
  const el = $('#detailScroll');
  const token = ++detailToken;

  if (!d) {
    el.innerHTML = V.emptyHTML();
    return;
  }

  let html = '';
  try {
    if (d.kind === 'herb') {
      if (!store.herbDetail(d.id)) {
        el.innerHTML = V.loadingHTML('正在读取中药数据…');
        const res = await api.herb(d.id);
        store.setHerbDetail(d.id, res);
      }
      html = V.herbHTML(store.herbDetail(d.id));
    } else if (d.kind === 'formula') {
      if (!store.formulaDetail(d.id)) {
        el.innerHTML = V.loadingHTML('正在读取方剂数据…');
        const res = await api.formula(d.id);
        store.setFormulaFull(res);
      }
      let rel = null;
      if (state.tab.formula === 'rel') {
        if (!relCache.has(d.id)) relCache.set(d.id, await api.formulaRelated(d.id));
        rel = relCache.get(d.id);
      }
      html = V.formulaHTML(store.formulaDetail(d.id), rel);
    } else if (d.kind === 'effect') {
      html = V.effectHTML(d.key);
    } else if (d.kind === 'meridian') {
      html = V.meridianHTML(d.key);
    } else if (d.kind === 'category') {
      html = V.categoryHTML(d.key);
    } else if (d.kind === 'fcat') {
      html = V.fcatHTML(d.key);
    } else if (d.kind === 'combo') {
      html = V.comboHTML();
    } else if (d.kind === 'browse') {
      html = V.browseHTML(d.list);
    } else if (d.kind === 'compare') {
      if (!state.compare.length) html = V.compareHTML([]);
      else {
        const res = await api.compare(state.compare);
        html = V.compareHTML(res.formulas);
      }
    } else if (d.kind === 'book') {
      if (!store.shanghan) store.shanghan = await api.bookShanghan();
      html = V.bookHTML(store.shanghan);
    } else if (d.kind === 'liujing') {
      if (!store.liujing.has(d.key)) store.liujing.set(d.key, await api.bookLiujing(d.key));
      const data = store.liujing.get(d.key);
      html = V.liujingHTML(d.key, data);
    } else if (d.kind === 'fjx') {
      if (!store.fangjixue) store.fangjixue = await api.bookFangjixue();
      html = V.fjxHTML(store.fangjixue);
    } else if (d.kind === 'docs') {
      if (!docsCache) docsCache = (await api.docs()).docs;
      html = V.docsHTML(docsCache);
    } else if (d.kind === 'fjxchapter') {
      if (!store.fxChapter.has(d.key)) store.fxChapter.set(d.key, await api.bookFjxChapter(d.key));
      html = V.fjxChapterHTML(d.key, store.fxChapter.get(d.key));
    }
  } catch (e) {
    html = `<div class="side-empty">数据加载失败：${esc(e.message)}</div>`;
  }

  if (token !== detailToken) return;   // 期间发生了新的渲染
  el.innerHTML = html;
  el.scrollTop = 0;
}

/* ================= 面板宽度 / 收起 ================= */
const DETAIL_MIN = 300;
const detailMax = () => Math.max(DETAIL_MIN, window.innerWidth - 252 - 300);

function applyDetailW(w) {
  const app = document.querySelector('.app');
  if (!app) return;
  if (w) {
    app.style.setProperty('--detail-w', Math.round(w) + 'px');
    state.detailW = Math.round(w);
  } else {
    app.style.removeProperty('--detail-w');
    state.detailW = 0;
  }
}

function setDetailOpen(open) {
  const app = document.querySelector('.app');
  if (!app) return;
  app.classList.toggle('detail-off', !open);
  const btn = document.getElementById('detailReopen');
  if (btn) btn.classList.toggle('hidden', open);
  if (open && state.detailW) applyDetailW(state.detailW);
  if (graph && graph.resize) graph.resize();
}

function closeDetailPanel() {
  setDetailOpen(false);
  document.body.classList.remove('detail-open');
}

function openDetailPanel() {
  setDetailOpen(true);
}

function initDetailResizer() {
  const rz = document.getElementById('detailResizer');
  if (!rz) return;
  let dragging = false;
  let startX = 0;
  let startW = 0;

  rz.addEventListener('pointerdown', (e) => {
    if (window.innerWidth <= 1100) return;
    const d = document.getElementById('detail');
    if (!d) return;
    dragging = true;
    startX = e.clientX;
    startW = d.getBoundingClientRect().width;
    document.body.classList.add('resizing');
    rz.setPointerCapture && rz.setPointerCapture(e.pointerId);
    e.preventDefault();
  });

  rz.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const w = Math.min(detailMax(), Math.max(DETAIL_MIN, startW - (e.clientX - startX)));
    applyDetailW(w);
    graph.resize();
  });

  const end = () => {
    if (!dragging) return;
    dragging = false;
    document.body.classList.remove('resizing');
    if (state.detailW) save('tcm.detailW', state.detailW);
    graph.resize();
  };
  rz.addEventListener('pointerup', end);
  rz.addEventListener('pointercancel', end);

  rz.addEventListener('dblclick', () => {
    applyDetailW(0);
    try { localStorage.removeItem('tcm.detailW'); } catch (e) { /* ignore */ }
    graph.resize();
  });
}

function openDetailOnMobile() {
  openDetailPanel();
  if (window.innerWidth <= 1080) document.body.classList.add('detail-open');
}

/* ================= 搜索 ================= */
let searchTimer = 0;
let searchToken = 0;

function renderSuggest(q) {
  const el = $('#suggest');
  clearTimeout(searchTimer);
  if (!q.trim()) {
    el.classList.remove('show');
    el.innerHTML = '';
    return;
  }
  searchTimer = setTimeout(async () => {
    const token = ++searchToken;
    let groups = [];
    try {
      const res = await api.search(q);
      groups = res.groups || [];
    } catch (e) { groups = []; }
    if (token !== searchToken) return;
    if (!groups.length) {
      el.classList.remove('show');
      el.innerHTML = '';
      return;
    }
    el.innerHTML = groups.map((g) => `
      <div class="sg-group">${esc(g.group)}</div>
      ${g.items.map((it) => `
        <button class="sg-item" data-type="${it.type}"
          data-id="${esc(it.id || '')}" data-key="${esc(it.key || '')}"
          data-ids="${(it.ids || []).join(',')}">
          <span class="sg-label">${esc(it.label)}</span>
          <span class="sg-sub">${esc(it.sub || '')}</span>
          ${it.meta ? `<span class="sg-meta">${esc(it.meta)}</span>` : ''}
        </button>`).join('')}
    `).join('');
    el.classList.add('show');
  }, 120);
}

function handleSuggestPick(b) {
  const t = b.dataset.type;
  if (t === 'herb') openHerb(b.dataset.id);
  else if (t === 'formula') openFormula(b.dataset.id);
  else if (t === 'effect') openEffect(b.dataset.key);
  else if (t === 'meridian') openMeridian(b.dataset.key);
  else if (t === 'combo') openCombo((b.dataset.ids || '').split(',').filter(Boolean));
  else if (t === 'book') openBook();
  else if (t === 'fjx') openFjx();
  else if (t === 'fjxchapter') openFjxChapter(b.dataset.key);
  $('#suggest').classList.remove('show');
}

/* ================= 事件绑定 ================= */
function bind() {
  const q = $('#q');
  q.addEventListener('input', () => renderSuggest(q.value));
  q.addEventListener('focus', () => { if (q.value) renderSuggest(q.value); });
  q.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const first = $('.sg-item', $('#suggest'));
      if (first) first.click();
      else {
        api.search(q.value).then((res) => {
          const it = (res.groups[0] || {}).items;
          if (!it || !it.length) return;
          handleSuggestPick({
            dataset: {
              type: it[0].type, id: it[0].id || '', key: it[0].key || '',
              ids: (it[0].ids || []).join(',')
            }
          });
        });
      }
    } else if (e.key === 'Escape') {
      $('#suggest').classList.remove('show');
      q.blur();
    }
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.searchbox')) $('#suggest').classList.remove('show');
  });

  $('#suggest').addEventListener('click', (e) => {
    const b = e.target.closest('.sg-item');
    if (b) handleSuggestPick(b);
  });

  // 对比相关（全局代理）
  document.addEventListener('click', (e) => {
    const rm = e.target.closest('[data-rmcmp]');
    if (rm) { toggleCompare(rm.dataset.rmcmp); return; }
    const clr = e.target.closest('[data-cmp-clear]');
    if (clr) {
      state.compare = [];
      renderCompareBar();
      if (state.detail && state.detail.kind === 'compare') renderDetail();
      return;
    }
    const op = e.target.closest('[data-open-compare]');
    if (op) { openCompare(); return; }
    const cp = e.target.closest('[data-cmp]');
    if (cp) { toggleCompare(cp.dataset.cmp); return; }
  });

  // 顶部模式
  $('#modes').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    const v = b.dataset.view;
    if (v === 'overview') { state.trail = []; state.detail = null; go({ mode: 'overview' }); renderCrumbs(); renderDetail(); }
    else if (v === 'herb') openBrowse('herbs');
    else if (v === 'formula') openBrowse('formulas');
    else if (v === 'combo') { state.detail = { kind: 'combo' }; renderDetail(); openDetailOnMobile(); }
    else if (v === 'compare') openCompare();
    else if (v === 'effect') { state.detail = { kind: 'browse', list: 'effect' }; renderDetail(); openDetailOnMobile(); }
    else if (v === 'meridian') { state.detail = { kind: 'browse', list: 'meridian' }; renderDetail(); openDetailOnMobile(); }
  });

  // 侧栏
  $('#sideScroll').addEventListener('click', (e) => {
    const g = e.target.closest('[data-group]');
    if (g) {
      const k = g.dataset.group;
      state.openGroups[k] = !state.openGroups[k];
      renderSidebar();
      return;
    }
    const lj = e.target.closest('[data-lj]');
    if (lj) { openLiujing(lj.dataset.lj); return; }
    const fx = e.target.closest('[data-fxch]');
    if (fx) { openFjxChapter(fx.dataset.fxch); return; }
    const cat = e.target.closest('[data-cat]');
    if (cat) { openCategory(cat.dataset.cat); return; }
    const eff = e.target.closest('[data-eff]');
    if (eff) { openEffect(eff.dataset.eff); return; }
    const mer = e.target.closest('[data-mer]');
    if (mer) { openMeridian(mer.dataset.mer); return; }
    const fc = e.target.closest('[data-fcat]');
    if (fc) { openFCat(fc.dataset.fcat); return; }
    const fv = e.target.closest('[data-favgo]');
    if (fv) {
      const key = fv.dataset.favgo;
      if (key.indexOf('h:') === 0) openHerb(key.slice(2)); else openFormula(key.slice(2));
      return;
    }
    const hs = e.target.closest('[data-hist]');
    if (hs) {
      const name = hs.dataset.hist;
      const h = store.herbs.find((x) => x.name === name);
      if (h) { openHerb(h.id); return; }
      const f = store.formulas.find((x) => x.name === name);
      if (f) openFormula(f.id);
      return;
    }
    const act = e.target.closest('[data-act]');
    if (act) {
      const a = act.dataset.act;
      if (a === 'overview') { state.trail = []; state.detail = null; go({ mode: 'overview' }); renderCrumbs(); renderDetail(); }
      else if (a === 'browse-herbs') openBrowse('herbs');
      else if (a === 'browse-formulas') openBrowse('formulas');
      else if (a === 'classic') openBrowse('classic');
      else if (a === 'book') openBook();
      else if (a === 'fangjixue') openFjx();
      else if (a === 'browse-shanghan') openBrowse('shanghan');
      else if (a === 'browse-fangjixue') openBrowse('fangjixue');
      else if (a === 'docs') { state.detail = { kind: 'docs' }; renderDetail(); openDetailOnMobile(); }
    }
  });

  // 面包屑
  $('#crumbs').addEventListener('click', (e) => {
    const c = e.target.closest('[data-crumb]');
    if (c) jumpCrumb(parseInt(c.dataset.crumb, 10));
  });

  // 详情面板
  $('#detailScroll').addEventListener('click', (e) => {
    const tab = e.target.closest('[data-tab]');
    if (tab) {
      const [kind, k] = tab.dataset.tab.split(':');
      state.tab[kind] = k;
      renderDetail();
      return;
    }
    const fav = e.target.closest('[data-fav]');
    if (fav) {
      const key = fav.dataset.fav;
      const name = fav.dataset.favname;
      if (isFav(key)) state.fav = state.fav.filter((x) => x.key !== key);
      else state.fav.unshift({ key, name });
      save('tcm.fav', state.fav);
      renderSidebar();
      renderDetail();
      return;
    }
    const focus = e.target.closest('[data-focus]');
    if (focus) {
      const key = focus.dataset.focus;
      if (key.indexOf('h:') === 0) go({ mode: 'herb', id: key.slice(2) });
      else go({ mode: 'formula', id: key.slice(2) });
      return;
    }
    const cb = e.target.closest('[data-combo]');
    if (cb) {
      const id = cb.dataset.combo;
      if (state.combo.includes(id)) state.combo = state.combo.filter((x) => x !== id);
      else state.combo.push(id);
      state.detail = { kind: 'combo' };
      renderDetail();
      return;
    }
    const uc = e.target.closest('[data-uncombo]');
    if (uc) {
      state.combo = state.combo.filter((x) => x !== uc.dataset.uncombo);
      state.detail = { kind: 'combo' };
      renderDetail();
      return;
    }
    const run = e.target.closest('[data-act="runcombo"]');
    if (run) { openCombo(state.combo); return; }
    const dlj = e.target.closest('[data-lj]');
    if (dlj) { openLiujing(dlj.dataset.lj); return; }
    const dfx = e.target.closest('[data-fxch]');
    if (dfx) { openFjxChapter(dfx.dataset.fxch); return; }
    const dact = e.target.closest('[data-act]');
    if (dact) {
      const a = dact.dataset.act;
      if (a === 'open-book') { openBook(); return; }
      if (a === 'open-fjx') { openFjx(); return; }
      if (a === 'browse-shanghan') { openBrowse('shanghan'); return; }
      if (a === 'browse-fangjixue') { openBrowse('fangjixue'); return; }
      if (a === 'browse-formulas') { openBrowse('formulas'); return; }
      if (a === 'book-sphere') {
        if (state.detail && state.detail.kind === 'liujing') openLiujing(state.detail.key);
        else openBook();
        return;
      }
      if (a === 'fjx-sphere') {
        if (state.detail && state.detail.kind === 'fjxchapter') openFjxChapter(state.detail.key);
        else openFjx();
        return;
      }
    }
    const hb = e.target.closest('[data-herb]');
    if (hb) { openHerb(hb.dataset.herb); return; }
    const fm = e.target.closest('[data-formula]');
    if (fm) { openFormula(fm.dataset.formula); return; }
    const mer = e.target.closest('[data-mer]');
    if (mer) { openMeridian(mer.dataset.mer); return; }
    // 详情面板内的分类入口（按功效 / 按类别 / 方剂分类 / 六经 / 教材章节）
    const ef2 = e.target.closest('[data-eff]');
    if (ef2) { openEffect(ef2.dataset.eff); return; }
    const ct2 = e.target.closest('[data-cat]');
    if (ct2) { openCategory(ct2.dataset.cat); return; }
    const fc2 = e.target.closest('[data-fcat]');
    if (fc2) { openFCat(fc2.dataset.fcat); return; }
    const lj2 = e.target.closest('[data-lj]');
    if (lj2) { openLiujing(lj2.dataset.lj); return; }
    const fx2 = e.target.closest('[data-fxch]');
    if (fx2) { openFjxChapter(fx2.dataset.fxch); return; }
  });

  // 舞台工具
  $('.tools').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    const a = b.dataset.act;
    if (a === 'zoomin') graph.zoomBy(1.18);
    else if (a === 'zoomout') graph.zoomBy(0.85);
    else if (a === 'reset') { graph.resetView(); graph.zoomTarget = 1; }
    else if (a === 'labels') {
      const on = !b.classList.contains('on');
      b.classList.toggle('on', on);
      graph.setLabels(on);
    } else if (a === 'full') toggleFullscreen();
  });

  $('#btnFs').addEventListener('click', toggleFullscreen);
  $('#btnNav').addEventListener('click', () => document.body.classList.toggle('nav-open'));
  $('#btnDetail').addEventListener('click', () => document.body.classList.toggle('detail-open'));
  const reopen = $('#detailReopen');
  if (reopen) reopen.addEventListener('click', () => openDetailPanel());
  $('#detailClose').addEventListener('click', () => document.body.classList.remove('detail-open'));
  const detailBack = document.getElementById('detailBack');
  if (detailBack) detailBack.addEventListener('click', () => back());

  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== q) { e.preventDefault(); q.focus(); }
    if (e.key === 'Escape') {
      document.body.classList.remove('nav-open', 'detail-open');
      $('#suggest').classList.remove('show');
    }
  });

  $('#sidebar').addEventListener('click', (e) => {
    if (window.innerWidth <= 860 && e.target.closest('.nav-item')) document.body.classList.remove('nav-open');
  });
}

function toggleFullscreen() {
  const el = document.documentElement;
  if (!document.fullscreenElement) {
    (el.requestFullscreen || el.webkitRequestFullscreen || function () {}).call(el);
  } else {
    (document.exitFullscreen || document.webkitExitFullscreen || function () {}).call(el);
  }
}

/* ================= 启动 ================= */
let booted = false;

export async function boot() {
  if (booted) return;
  booted = true;

  try {
    const [meta, index] = await Promise.all([api.meta(), api.index()]);
    store.setMeta(meta);
    store.setIndex(index);
  } catch (e) {
    $('#bootMask').innerHTML = `<div class="boot-seal">醫</div>
      <div class="boot-txt">后端服务未就绪：${esc(e.message)}</div>`;
    return;
  }

  renderSidebar();
  renderCompareBar();
  bind();
  initDetailResizer();
  if (state.detailW) applyDetailW(state.detailW);

  // 首次布局完成后校正画布尺寸（构造时可能尚未完成栅格布局）
  requestAnimationFrame(() => graph.resize());
  const stageEl = document.getElementById('stage');
  if (window.ResizeObserver && stageEl) {
    new ResizeObserver(() => graph.resize()).observe(stageEl);
  }

  await go({ mode: 'overview' });
  await renderDetail();
  renderCrumbs();
  graph.resize();

  const mask = $('#bootMask');
  if (mask) {
    mask.classList.add('hide');
    setTimeout(() => {
      mask.remove();
      graph.resize();
    }, 520);
  }
}

export { graph };
