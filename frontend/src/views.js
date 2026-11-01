/* ========== 全部详情视图的 HTML 构造（纯函数，数据由 API 提供） ========== */
import { esc, nz, songHTML, attachHTML, chipRow, fmtSize } from './ui.js';
import { state, isFav, inCompare } from './state.js';
import { store } from './store.js';

/* ---------------- 空态 ---------------- */
export function emptyHTML() {
  return `<div class="empty">
    <div class="empty-seal">醫</div>
    <h2>开始探索</h2>
    <p>点击三维球体中的节点，或使用上方搜索框。<br>蓝色为中药，金色为方剂。</p>
    <div class="quick">
      <button data-herb="gancao">甘草</button>
      <button data-herb="huangqi">黄芪</button>
      <button data-formula="sijunzitang">四君子汤</button>
      <button data-formula="liuweidihuang">六味地黄丸</button>
    </div>
  </div>`;
}

export function loadingHTML(text) {
  return `<div class="empty"><div class="boot-seal small">醫</div><h2>载入中</h2><p>${esc(text || '')}</p></div>`;
}

/* ---------------- 行 / 卡片 ---------------- */
export function herbRow(h) {
  return `<div class="hrow" data-herb="${h.id}">
    <div class="hrow-l"><b>${esc(h.name)}</b><span>${esc(h.nat)} · ${esc((h.fla || []).join(''))}</span></div>
    <div class="hrow-r">${(h.mer || []).map((m) => m + '经').join(' ')}</div>
  </div>`;
}

export function formulaCard(f, hl) {
  if (!f) return '';
  const comp = f.comp || [];
  return `<div class="fcard" data-formula="${f.id}">
    <div class="fcard-h"><span class="fname">${esc(f.name)}</span><span class="fsrc">${esc(f.src || '')}</span><button class="fcard-cmp ${inCompare(f.id) ? 'on' : ''}" data-cmp="${f.id}" title="加入对比">${inCompare(f.id) ? '✓' : '＋'}</button></div>
    <div class="fcard-eff">${esc(f.eff || '')}</div>
    <div class="fcard-comp">${comp.map((c) => {
      const hb = store.herb(c.h);
      return `<span class="cc ${c.h === hl ? 'hl' : ''}">${hb ? esc(hb.name) : c.h}</span>`;
    }).join('')}</div>
    ${hl && comp.find((c) => c.h === hl) ? `<div class="fcard-note"><b>${esc(store.herbName(hl))}</b> 在方中：${esc(comp.find((c) => c.h === hl).n || comp.find((c) => c.h === hl).r || '')}</div>` : ''}
  </div>`;
}

/* ---------------- 中药详情 ---------------- */
export function herbHTML(h) {
  if (!h) return emptyHTML();
  const tab = state.tab.herb;
  const fs = store.formulasOfHerb(h.id);
  const key = 'h:' + h.id;
  const fav = isFav(key);

  const tabs = [
    ['ov', '概览'], ['eff', '功效主治'], ['ph', '现代药理'], ['f', '相关方剂 ' + fs.length]
  ].map(([k, n]) => `<button class="tab ${tab === k ? 'on' : ''}" data-tab="herb:${k}">${n}</button>`).join('');

  let body = '';
  if (tab === 'ov') {
    body = `
      <section>
        <h3>基本信息</h3>
        <dl class="kv">
          <dt>别名</dt><dd>${esc(h.alias || '—')}</dd>
          <dt>药材来源</dt><dd>${esc(h.src)}</dd>
          <dt>药用部位</dt><dd>${esc(h.part)}</dd>
          <dt>药物类别</dt><dd>${esc(h.cat)}${h.sub ? ' · ' + esc(h.sub) : ''}</dd>
          <dt>用法用量</dt><dd>${esc(h.dose)}</dd>
          <dt>炮制规格</dt><dd>${esc(h.proc)}</dd>
        </dl>
      </section>
      <section>
        <h3>性味归经</h3>
        <div class="kv-inline">
          <span class="lbl">四气</span><span class="chip nat">${esc(h.nat)}</span>
          <span class="lbl">五味</span>${chipRow(h.fla, 'fla')}
        </div>
        <div class="kv-inline">
          <span class="lbl">归经</span>
          ${(h.mer || []).map((m) => `<button class="chip mer link" data-mer="${m}">${m}经</button>`).join('')}
        </div>
      </section>
      <section>
        <h3>使用注意</h3>
        <p class="warn">${esc(h.cau)}</p>
      </section>
      <section>
        <h3>资料来源</h3>
        <p class="src">${esc(h.ref)}</p>
      </section>`;
  } else if (tab === 'eff') {
    const ie = h.indExplain || { mechanism: '', items: [] };
    const items = ie.items || [];
    const anyClin = items.some((x) => x.clin);
    body = `
      <section>
        <h3>主要功效</h3>
        <div class="chips">${chipRow(h.eff, 'eff')}</div>
      </section>
      <section>
        <h3>主治病证</h3>
        <blockquote class="ind-quote">${esc(h.ind)}</blockquote>
      </section>
      ${ie.mechanism ? `<section>
        <h3>证治机理<span class="sec-sub">性味归经推导</span></h3>
        <p class="ind-detail">${esc(ie.mechanism)}</p>
      </section>` : ''}
      ${items.length ? `<section>
        <h3>逐证解析<span class="sec-sub">${items.length} 项</span></h3>
        <div class="ind-list">
          ${items.map((it) => {
            const fid = it.formula ? store.formulaIdByName(it.formula) : '';
            const fx = it.formula
              ? (fid ? `<button class="ii-fx" data-formula="${fid}">${esc(it.formula)}</button>`
                : `<span class="ii-fx plain">${esc(it.formula)}</span>`)
              : '';
            return `<div class="ind-item">
              <div class="ii-head">
                <span class="ii-name">${esc(it.name)}</span>
                ${it.eff ? `<span class="ii-eff">${esc(it.eff)}</span>` : ''}
              </div>
              ${it.clin ? `<div class="ii-body">${esc(it.clin)}${fx}</div>`
                : (it.why ? `<div class="ii-body muted">${esc(it.why)}</div>` : '')}
            </div>`;
          }).join('')}
        </div>
      </section>` : ''}
      ${!anyClin && h.clin ? `<section>
        <h3>临床应用</h3>
        <p>${esc(h.clin)}</p>
      </section>` : ''}
      <section>
        <h3>常用配伍</h3>
        <ul class="combo-list">
          ${(h.combo || []).map(([w, t]) => {
            const other = store.herbs.find((x) => x.name === w);
            return `<li>
              <div class="cl-h">${other ? `<button class="lnk" data-herb="${other.id}">${esc(w)}</button>` : esc(w)}</div>
              <div class="cl-t">${esc(t)}</div>
            </li>`;
          }).join('') || '<li class="muted">暂无</li>'}
        </ul>
      </section>`;
  } else if (tab === 'ph') {
    body = `
      <section>
        <h3>现代药理研究</h3>
        <ul class="pharm">${(h.pharm || []).map((p) => `<li>${esc(p)}</li>`).join('')}</ul>
      </section>
      <div class="note">
        <strong>表述说明</strong>
        以上为现代药理学实验研究结果的归纳，多来自体外实验或动物实验，不等同于临床疗效。传统功效与本项内容分列展示，请勿混同。
      </div>
      <section>
        <h3>资料来源</h3>
        <p class="src">${esc(h.ref)}</p>
      </section>`;
  } else {
    body = fs.length ? `
      <div class="hint-line">共 <b>${fs.length}</b> 首方剂含有「${esc(h.name)}」，点击可进入方剂详情</div>
      ${fs.map((it) => formulaCard(it, h.id)).join('')}` :
      '<div class="side-empty">暂无含该药的方剂</div>';
  }

  return `
    <div class="d-head">
      <div class="d-kind herb">中药</div>
      <h2>${esc(h.name)}</h2>
      <div class="d-py">${esc(h.py)}</div>
      <div class="d-tags">
        <span class="chip nat">${esc(h.nat)}</span>
        ${chipRow(h.fla, 'fla')}
        ${(h.mer || []).map((m) => `<span class="chip mer">${m}经</span>`).join('')}
      </div>
      <div class="d-actions">
        <button class="btn-fav ${fav ? 'on' : ''}" data-fav="${key}" data-favname="${esc(h.name)}">${fav ? '★ 已收藏' : '☆ 收藏'}</button>
        <button class="btn-ghost" data-focus="${key}">球体定位</button>
      </div>
    </div>
    <div class="tabs">${tabs}</div>
    <div class="tab-body">${body}</div>`;
}

/* ---------------- 方剂详情 ---------------- */
export function formulaHTML(f, rel) {
  if (!f) return emptyHTML();
  const tab = state.tab.formula;
  const key = 'f:' + f.id;
  const fav = isFav(key);
  const comp = f.comp || [];

  const tabs = [['ov', '概览'], ['ind', '主治'], ['comp', '组成 ' + comp.length], ['ana', '君臣佐使'], ['rel', '相关方剂']]
    .map(([k, n]) => `<button class="tab ${tab === k ? 'on' : ''}" data-tab="formula:${k}">${n}</button>`).join('');

  let body = '';
  if (tab === 'ov') {
    body = `
      <section>
        <h3>方剂基本信息</h3>
        <dl class="kv">
          <dt>出处</dt><dd>${esc(f.src)}</dd>
          <dt>分类</dt><dd>${esc(f.cat)}${f.sub ? ' · ' + esc(f.sub) : ''}</dd>
          <dt>功效</dt><dd class="strong">${esc(f.eff)}</dd>
          <dt>主治</dt><dd>${esc(f.ind)}</dd>
          ${f.syn ? `<dt>适用证候</dt><dd>${esc(f.syn)}</dd>` : ''}
          <dt>用法</dt><dd>${esc(f.use)}</dd>
        </dl>
      </section>
      ${f.art ? `<section class="art-sec">
        <h3>原文条文<span class="sec-sub">《伤寒论》</span></h3>
        <blockquote class="classic-quote">${esc(f.art)}</blockquote>
      </section>` : ''}
      <section>
        <h3>主治详述</h3>
        <p class="ind-detail">${esc(f.indDetail || f.ind)}</p>
      </section>
      ${f.feat ? `<section>
        <h3>配伍特点<span class="sec-sub">教材</span></h3>
        <p class="feat-txt">${esc(nz(f.feat))}</p>
      </section>` : ''}
      ${f.song ? `<section class="song-sec">
        <h3>方歌</h3>
        <div class="song-quote">${songHTML(f.song)}</div>
      </section>` : ''}
      ${f.apply ? `<section>
        <h3>运用<span class="sec-sub">辨证要点</span></h3>
        <p class="apply-txt">${esc(nz(f.apply))}</p>
      </section>` : ''}
      ${f.attach ? `<section>
        <h3>附方</h3>
        <div class="attach-list">${attachHTML(f.attach)}</div>
      </section>` : ''}
      <section>
        <h3>使用注意</h3>
        <p class="warn">${esc(f.cau)}</p>
      </section>
      <section>
        <h3>组成药物</h3>
        <div class="chips">${comp.map((c) => {
          const hb = store.herb(c.h);
          return hb ? `<button class="chip herb link" data-herb="${hb.id}">${esc(hb.name)}<i>${esc(c.r)}</i></button>` : '';
        }).join('')}</div>
      </section>`;
  } else if (tab === 'ind') {
    const ie = f.indExplain || { items: [], sentences: [], points: '' };
    const its = ie.items || [];
    const sents = ie.sentences || [];
    body = `
      <section>
        <h3>主治原文</h3>
        <blockquote class="ind-quote">${esc(f.ind)}</blockquote>
      </section>
      ${f.syn ? `<section>
        <h3>适用证候</h3>
        <p>${esc(f.syn)}</p>
      </section>` : ''}
      ${its.length ? `<section>
        <h3>证候拆解<span class="sec-sub">${its.length} 项</span></h3>
        <div class="chips">${its.map((x) => `<span class="chip ind-chip">${esc(x)}</span>`).join('')}</div>
      </section>` : ''}
      ${sents.length ? `<section>
        <h3>病机与证候分析</h3>
        <div class="ind-para">${sents.map((s) => `<p>${esc(s)}</p>`).join('')}</div>
      </section>` : ''}
      ${ie.points ? `<section>
        <h3>辨证要点<span class="sec-sub">教材</span></h3>
        <p class="apply-txt">${esc(nz(ie.points))}</p>
      </section>` : ''}
      ${f.cau ? `<section>
        <h3>使用注意</h3>
        <p class="warn">${esc(f.cau)}</p>
      </section>` : ''}
      ${f.art ? `<section class="art-sec">
        <h3>原文条文<span class="sec-sub">《伤寒论》</span></h3>
        <blockquote class="classic-quote">${esc(f.art)}</blockquote>
      </section>` : ''}`;
  } else if (tab === 'comp') {
    body = `
      <div class="hint-line">点击任意药物，查看其性味、归经、功效、药理与配伍禁忌</div>
      ${comp.map((c) => {
        const hb = store.herb(c.h);
        if (!hb) return '';
        return `<div class="comp-item" data-herb="${hb.id}">
          <div class="ci-role role-${esc(c.r)}">${esc(c.r)}</div>
          <div class="ci-main">
            <div class="ci-name">${esc(hb.name)}<span class="ci-dose">${esc(c.d)}</span></div>
            <div class="ci-eff">${esc((hb.eff || []).join(' · '))}</div>
            <div class="ci-note">${esc(c.n)}</div>
            <div class="ci-meta"><span>${esc(hb.nat)}</span>${(hb.fla || []).map((x) => `<span>${x}</span>`).join('')}${(hb.mer || []).map((m) => `<span>${m}经</span>`).join('')}</div>
          </div>
        </div>`;
      }).join('')}`;
  } else if (tab === 'ana') {
    const roles = ['君', '臣', '佐', '使'];
    const desc = {
      '君': '针对主要病机，发挥主要治疗作用',
      '臣': '辅助君药加强疗效，或针对兼证',
      '佐': '辅助治疗、制约药性，或减轻毒副作用',
      '使': '引经报使，或调和诸药'
    };
    body = `
      <div class="jc-intro">${f.fjx ? '君臣佐使据教材方解文字归纳标注，可结合下方「配伍分析」理解。' : '君臣佐使属方剂配伍分析，依据教材标注，不按药物排列顺序自动判定。'}</div>
      ${roles.map((r) => {
        const list = comp.filter((c) => (c.r || '').indexOf(r) >= 0);
        if (!list.length) return '';
        return `<section class="jc-block">
          <div class="jc-head"><span class="jc-badge role-${r}">${r}</span><span class="jc-desc">${desc[r]}</span></div>
          ${list.map((c) => {
            const hb = store.herb(c.h);
            return `<div class="jc-item" ${hb ? `data-herb="${hb.id}"` : ''}>
              <div class="jc-name">${hb ? esc(hb.name) : esc(c.h)}<span>${esc(c.d)}</span></div>
              <div class="jc-note">${esc(c.n)}</div>
            </div>`;
          }).join('')}
        </section>`;
      }).join('')}
      <section>
        <h3>配伍分析</h3>
        <p class="ana">${esc(f.ana)}</p>
      </section>`;
  } else {
    if (!rel) {
      body = '<div class="side-empty">正在分析组成相近方剂…</div>';
    } else {
      body = `
        ${rel.rels.length ? `<section><h3>教材关联方剂</h3>
          <div class="rel-grid">${rel.rels.map((r) => `<button class="rel-chip" data-formula="${r.id}">${esc(r.name)}</button>`).join('')}</div>
        </section>` : ''}
        <section>
          <h3>组成相近方剂</h3>
          ${rel.shared.map((s) => `
            <div class="diff-card" data-formula="${s.id}">
              <div class="dc-h"><b>${esc(s.name)}</b><span>共有 ${s.n} 味</span></div>
              <div class="dc-row"><span class="dc-lbl same">共有</span><span class="dc-v">${s.common.map(esc).join('、')}</span></div>
              <div class="dc-row"><span class="dc-lbl add">本方独有</span><span class="dc-v">${s.onlyA.map(esc).join('、') || '—'}</span></div>
              <div class="dc-row"><span class="dc-lbl del">对方独有</span><span class="dc-v">${s.onlyB.map(esc).join('、') || '—'}</span></div>
            </div>`).join('') || '<div class="side-empty">暂无组成相近的方剂</div>'}
        </section>`;
    }
  }

  return `
    <div class="d-head">
      <div class="d-kind formula">方剂</div>
      <h2>${esc(f.name)}</h2>
      <div class="d-py">${f.py ? esc(f.py) + ' · ' : ''}${esc(f.src)}</div>
      <div class="d-tags">
        ${f.fjxCat ? `<button class="chip cat link" data-fxch="${esc(f.fjxCat)}">${esc(f.cat)}</button>` : `<span class="chip cat">${esc(f.cat)}</span>`}
        ${f.sub ? `<span class="chip cat2">${esc(f.sub)}</span>` : ''}
        ${f.lj ? `<button class="chip lj" data-lj="${esc(f.lj)}">${esc(f.lj)}</button>` : ''}
        <span class="chip eff">${esc(f.eff)}</span>
      </div>
      <div class="d-actions">
        <button class="btn-fav ${fav ? 'on' : ''}" data-fav="${key}" data-favname="${esc(f.name)}">${fav ? '★ 已收藏' : '☆ 收藏'}</button>
        <button class="btn-cmp ${inCompare(f.id) ? 'on' : ''}" data-cmp="${f.id}">${inCompare(f.id) ? '✓ 已加入对比' : '＋ 加入对比'}</button>
        <button class="btn-ghost" data-focus="${key}">球体定位</button>
      </div>
    </div>
    <div class="tabs">${tabs}</div>
    <div class="tab-body">${body}</div>`;
}

/* ---------------- 功效 / 归经 / 分类 ---------------- */
export function effectHTML(key) {
  const hs = store.herbsByEffect(key);
  return `<div class="d-head">
    <div class="d-kind effect">功效</div>
    <h2>${esc(key)}</h2>
    <div class="d-py">功效关联模式 · ${hs.length} 味中药</div>
    <div class="d-tags"><span class="chip eff">${hs.length} 味药</span></div>
  </div>
  <div class="tab-body">
    <div class="hint-line">三维球体中以「${esc(key)}」为中心，展开具有该功效的中药及代表性方剂</div>
    ${hs.length ? hs.map(herbRow).join('')
      : `<div class="side-empty">没有中药标注为「${esc(key)}」，可换一个功效词试试。</div>`}
  </div>`;
}

export function meridianHTML(key) {
  const hs = store.herbsByMer(key);
  return `<div class="d-head">
    <div class="d-kind meridian">归经</div>
    <h2>${esc(key)}经</h2>
    <div class="d-py">归经关联模式 · ${hs.length} 味中药</div>
    <div class="d-tags"><span class="chip mer">${hs.length} 味药</span></div>
  </div>
  <div class="tab-body">
    <div class="hint-line">三维球体中以「${esc(key)}经」为中心，展开归入该经的中药及其组成的方剂</div>
    ${hs.map(herbRow).join('')}
  </div>`;
}

export function categoryHTML(key) {
  const hs = store.herbsByCat(key);
  return `<div class="d-head">
    <div class="d-kind category">药物类别</div>
    <h2>${esc(key)}</h2>
    <div class="d-py">${hs.length} 味中药</div>
  </div>
  <div class="tab-body">${hs.map(herbRow).join('')}</div>`;
}

export function fcatHTML(key) {
  const fs = store.formulasByCat(key);
  return `<div class="d-head">
    <div class="d-kind category">方剂分类</div>
    <h2>${esc(key)}</h2>
    <div class="d-py">${fs.length} 首方剂</div>
  </div>
  <div class="tab-body">${fs.map((f) => formulaCard(f)).join('')}</div>`;
}

/* ---------------- 配伍 ---------------- */
export function comboHTML() {
  const ids = state.combo;
  const fs = ids.length
    ? store.formulas.filter((f) => ids.every((id) => (f.comp || []).some((c) => c.h === id)))
    : [];
  const allHerbs = store.herbs.slice().sort((a, b) => (b.nf || 0) - (a.nf || 0));

  return `<div class="d-head">
    <div class="d-kind combo">配伍</div>
    <h2>药物配伍模式</h2>
    <div class="d-py">选择两味或多味中药，查看同时含有这些药物的方剂</div>
  </div>
  <div class="tab-body">
    <section>
      <h3>已选药物</h3>
      <div class="chips">
        ${ids.map((id) => `<button class="chip herb on" data-uncombo="${id}">${esc(store.herbName(id))}<i>×</i></button>`).join('') || '<span class="muted">尚未选择</span>'}
      </div>
      <div class="pick-grid mt">
        ${allHerbs.slice(0, 60).map((h) => `<button class="pick ${ids.includes(h.id) ? 'on' : ''}" data-combo="${h.id}">${esc(h.name)}<i>${h.nf || 0}</i></button>`).join('')}
      </div>
      ${ids.length >= 2 ? `<button class="btn-primary mt" data-act="runcombo">查看同时含 ${ids.length} 味药的方剂（${fs.length} 首）</button>` : ''}
    </section>
    ${ids.length >= 2 ? `<section>
      <h3>配伍结果<span class="sec-sub">${fs.length} 首</span></h3>
      ${fs.map((f) => formulaCard(f)).join('') || '<div class="side-empty">没有方剂同时含有这些药物</div>'}
    </section>` : ''}
  </div>`;
}

/* ---------------- 目录 ---------------- */
export function browseHTML(list) {
  let title = '中药大全';
  let items = '';

  if (list === 'herbs') {
    const cats = (store.meta.categories || []);
    items = cats.map((c) => `
      <div class="browse-sec">
        <h3>${esc(c.name)}<span>${c.n}</span></h3>
        <div class="pick-grid">${store.herbsByCat(c.name).map((h) => `<button class="pick" data-herb="${h.id}">${esc(h.name)}</button>`).join('')}</div>
      </div>`).join('');
  } else if (list === 'formulas') {
    title = '方剂';
    const fcatItems = (store.meta.fcats || []).map((c) => `
      <div class="browse-sec">
        <h3>${esc(c.name)}<span>${c.n}</span></h3>
        <div class="pick-grid">${store.formulasByCat(c.name).map((f) => `<button class="pick" data-formula="${f.id}">${esc(f.name)}</button>`).join('')}</div>
      </div>`).join('');
    const fjxNav = ((store.fangjixue && store.fangjixue.chapters) || []).length
      ? `<div class="browse-sec" style="margin-top:18px;border-top:1px solid rgba(255,255,255,0.06);padding-top:14px;">
        <h3>《方剂学》教材章节<span>${store.fangjixue.chapters.length}</span></h3>
        <div class="pick-grid">${store.fangjixue.chapters.map((c) => `<button class="pick" data-fxch="${esc(c.name)}">${esc(c.name)}<i>${c.formulas.length}</i></button>`).join('')}</div>
      </div>`
      : '';
    items = fcatItems + fjxNav;
  } else if (list === 'classic') {
    title = '经典方剂';
    items = `<div class="browse-sec"><div class="pick-grid">${store.formulas.filter((f) => (f.n || 0) >= 6).map((f) => `<button class="pick" data-formula="${f.id}">${esc(f.name)}</button>`).join('')}</div></div>`;
  } else if (list === 'shanghan') {
    title = '《伤寒论》经方目录';
    items = ((store.shanghan && store.shanghan.blocks) || []).map((b) => {
      if (!b.formulas.length) return '';
      return `<div class="browse-sec">
        <h3><button class="lj-inline" data-lj="${esc(b.key)}">${esc(b.key)}</button><span>${b.formulas.length}</span></h3>
        <div class="pick-grid">${b.formulas.map((f) => `<button class="pick" data-formula="${f.id}">${esc(f.name)}</button>`).join('')}</div>
      </div>`;
    }).join('');
  } else if (list === 'fangjixue') {
    title = '《方剂学》教材目录';
    items = ((store.fangjixue && store.fangjixue.chapters) || []).map((c) => {
      if (!c.formulas.length) return '';
      return `<div class="browse-sec">
        <h3><button class="lj-inline" data-fxch="${esc(c.name)}">${esc(c.name)}</button><span>${c.formulas.length}</span></h3>
        <div class="pick-grid">${c.formulas.map((f) => `<button class="pick" data-formula="${f.id}">${esc(f.name)}</button>`).join('')}</div>
      </div>`;
    }).join('');
  } else if (list === 'effect') {
    title = '按功效探索';
    items = `<div class="browse-sec"><div class="pick-grid">${(store.meta.effects || [])
      .map((e) => `<button class="pick" data-eff="${esc(e.name)}">${esc(e.name)}<i>${e.n}</i></button>`).join('')}</div></div>`;
  } else if (list === 'meridian') {
    title = '按归经探索';
    items = `<div class="browse-sec"><div class="pick-grid">${(store.meta.meridians || [])
      .map((m) => `<button class="pick" data-mer="${esc(m.name)}">${esc(m.name)}经<i>${m.n}</i></button>`).join('')}</div></div>`;
  } else if (list === 'fav') {
    title = '收藏夹';
    items = state.fav.length
      ? `<div class="browse-sec"><div class="pick-grid">${state.fav.map((x) => `<button class="pick" data-favgo="${x.key}">${esc(x.name)}</button>`).join('')}</div></div>`
      : '<div class="side-empty">尚未收藏任何条目</div>';
  }

  return `<div class="d-head">
    <div class="d-kind plain">目录</div>
    <h2>${title}</h2>
    <div class="d-py">点击条目进入详情并定位到三维球体</div>
  </div>
  <div class="tab-body">${items}</div>`;
}

/* ---------------- 方剂对比 ---------------- */
export function compareHTML(fs) {
  if (!fs.length) {
    return `<div class="d-head">
      <div class="d-kind compare">对比</div>
      <h2>方剂对比</h2>
      <div class="d-py">选择 2 首及以上方剂，逐项对照组成、功效与主治</div>
    </div>
    <div class="tab-body">
      <div class="side-empty">尚未选择方剂。<br>在任意方剂详情或方剂卡片点击「＋ 加入对比」即可添加。</div>
      <button class="btn-primary" data-act="browse-formulas">去方剂大全选择</button>
    </div>`;
  }

  const nm = (id) => store.herbName(id);
  const cnt = {};
  fs.forEach((f) => (f.comp || []).forEach((c) => { cnt[c.h] = (cnt[c.h] || 0) + 1; }));
  const herbIds = Object.keys(cnt).sort((a, b) => {
    if (cnt[b] !== cnt[a]) return cnt[b] - cnt[a];
    return nm(a).localeCompare(nm(b), 'zh');
  });
  const sharedAll = herbIds.filter((h) => cnt[h] === fs.length);

  const row = (label, fn) => `<tr><th>${label}</th>${fs.map((f) => `<td>${fn(f)}</td>`).join('')}</tr>`;
  const compCell = (f) => (f.comp || []).map((c) => `<span class="cmp-herb" data-herb="${c.h}">${esc(nm(c.h))}<i class="role-${esc(c.r)}">${esc(c.r)}</i></span>`).join('');
  const roleContent = (role) => (f) => {
    const xs = (f.comp || []).filter((c) => (c.r || '').indexOf(role) >= 0);
    return xs.length
      ? xs.map((c) => `<span class="cmp-herb" data-herb="${c.h}">${esc(nm(c.h))}</span>`).join('')
      : '<span class="muted">—</span>';
  };
  const matrixRow = (hid) => `<tr class="${cnt[hid] === fs.length ? 'cmp-shared' : ''}">
    <th><span class="cmp-herb" data-herb="${hid}">${esc(nm(hid))}</span></th>
    ${fs.map((f) => {
      const c = (f.comp || []).find((x) => x.h === hid);
      return `<td class="${c ? 'yes' : 'no'}">${c ? `<i class="role-${esc(c.r)}">${esc(c.r)}</i>` : '—'}</td>`;
    }).join('')}
  </tr>`;

  return `<div class="d-head">
    <div class="d-kind compare">对比</div>
    <h2>方剂对比 · ${fs.length} 首</h2>
    <div class="d-py">逐项对照组成、功效与主治；点药名查看中药，点方名查看详情</div>
    <div class="d-actions"><button class="btn-ghost" data-cmp-clear>清空对比篮</button></div>
  </div>
  <div class="tab-body">
    <div class="cmp-scroll">
      <table class="cmp-table">
        <thead><tr><th>项目</th>${fs.map((f) => `<th class="cmp-th" data-formula="${f.id}">${esc(f.name)}</th>`).join('')}</tr></thead>
        <tbody>
          ${row('出处', (f) => esc(f.src))}
          ${row('分类', (f) => esc(f.cat) + (f.sub ? ' · ' + esc(f.sub) : ''))}
          ${fs.some((f) => f.lj) ? row('六经', (f) => (f.lj ? `<span class="chip lj">${esc(f.lj)}</span>` : '<span class="muted">—</span>')) : ''}
          ${fs.some((f) => f.art) ? row('原文条文', (f) => (f.art ? `<div class="classic-quote sm">${esc(f.art)}</div>` : '<span class="muted">—</span>')) : ''}
          ${row('功效', (f) => `<b>${esc(f.eff)}</b>`)}
          ${row('主治', (f) => esc(f.ind))}
          ${row('主治详述', (f) => `<div class="ind-detail">${esc(f.indDetail || f.ind)}</div>`)}
          ${row('组成', compCell)}
          ${row('君药', roleContent('君'))}
          ${row('臣药', roleContent('臣'))}
          ${row('用法', (f) => esc(f.use))}
          ${row('使用注意', (f) => `<span class="warn">${esc(f.cau)}</span>`)}
        </tbody>
      </table>
    </div>
    <section class="cmp-diff">
      <h3>组成对比<span class="cmp-sub">共 ${herbIds.length} 味 · 各方共有 ${sharedAll.length} 味</span></h3>
      <div class="cmp-scroll">
        <table class="cmp-matrix">
          <thead><tr><th>药物</th>${fs.map((f) => `<th class="cmp-th" data-formula="${f.id}">${esc(f.name)}</th>`).join('')}</tr></thead>
          <tbody>${herbIds.map(matrixRow).join('')}</tbody>
        </table>
      </div>
      <p class="muted">✓ 表示该方含有此药，并标注其君臣佐使角色；高亮行为各方共有之药。</p>
    </section>
  </div>`;
}

/* ---------------- 典籍《伤寒论》 ---------------- */
export function bookHTML(data) {
  const sh = (data && data.meta) || {};
  const blocks = (data && data.blocks) || [];
  const fs = (data && data.formulas) || [];

  const ljBlocks = blocks.map((b) => `<div class="lj-block">
    <button class="lj-head" data-lj="${esc(b.key)}">
      <span class="lj-name">${esc(b.key)}</span>
      <span class="lj-num">${b.formulas.length} 方</span>
    </button>
    <p class="lj-outline">${esc(b.outline)}</p>
    <p class="lj-note">${esc(b.note)}</p>
    <div class="rel-grid">${b.formulas.map((f) => `<button class="rel-chip" data-formula="${f.id}">${esc(f.name)}</button>`).join('')}</div>
  </div>`).join('');

  return `<div class="d-head book-head">
    <div class="d-kind book">典籍</div>
    <h2>${esc(sh.full || '《伤寒论》')}</h2>
    <div class="d-py">${esc(sh.dynasty || '')} · ${esc(sh.author || '')} 撰 · ${esc(sh.year || '')}</div>
    <div class="d-tags">
      <span class="chip cat">${esc(sh.volume || '')}</span>
      <span class="chip cat2">六经辨证</span>
      <span class="chip eff">收方 ${fs.length} 首</span>
    </div>
    <div class="d-actions">
      <button class="btn-primary" data-act="book-sphere">球体展开</button>
      <button class="btn-ghost" data-act="browse-shanghan">经方目录</button>
    </div>
  </div>
  <div class="tab-body">
    <section><h3>典籍简介</h3><p class="book-intro">${esc(sh.intro || '')}</p></section>
    <section><h3>学术地位</h3><p class="ind-detail">${esc(sh.status || '')}</p></section>
    <section><h3>学术特色</h3><ul class="book-feats">${(sh.features || []).map((x) => `<li>${esc(x)}</li>`).join('')}</ul></section>
    <section><h3>六经辨证纲要</h3>${ljBlocks}</section>
    <section>
      <h3>收录经方<span class="sec-sub">${fs.length} 首 · 涉药 ${data.herbCount || 0} 味</span></h3>
      <div class="rel-grid">${fs.map((f) => `<button class="rel-chip" data-formula="${f.id}">${esc(f.name)}</button>`).join('')}</div>
    </section>
  </div>`;
}

export function liujingHTML(key, data) {
  const fs = (data && data.formulas) || [];
  return `<div class="d-head book-head">
    <div class="d-kind book">六经</div>
    <h2>${esc(key)}</h2>
    <div class="d-py">《伤寒论》· ${fs.length} 首方剂</div>
    ${data ? `<p class="lj-outline big">${esc(data.outline)}</p><p class="lj-note">${esc(data.note)}</p>` : ''}
    <div class="d-actions">
      <button class="btn-ghost" data-act="open-book">← 返回《伤寒论》</button>
      <button class="btn-ghost" data-act="browse-shanghan">经方目录</button>
    </div>
  </div>
  <div class="tab-body">${fs.map((f) => formulaCard(f)).join('') || '<div class="side-empty">暂无</div>'}</div>`;
}

/* ---------------- 教材《方剂学》 ---------------- */
export function fjxHTML(data) {
  const fx = (data && data.meta) || {};
  const chapters = (data && data.chapters) || [];
  const total = chapters.reduce((n, c) => n + c.formulas.length, 0);

  const chBlocks = chapters.map((c) => {
    const secs = (c.sections || []).filter((s) => c.formulas.length);
    return `<div class="lj-block fx-block">
      <button class="lj-head" data-fxch="${esc(c.name)}">
        <span class="lj-name">${esc(c.name)}</span>
        <span class="lj-num">${c.formulas.length} 首</span>
      </button>
      <p class="lj-outline">${secs.length ? secs.map(esc).join(' · ') : '—'}</p>
      <div class="rel-grid">${c.formulas.map((f) => `<button class="rel-chip" data-formula="${f.id}">${esc(f.name)}</button>`).join('')}</div>
    </div>`;
  }).join('');

  return `<div class="d-head book-head">
    <div class="d-kind book">教材</div>
    <h2>${esc(fx.full || '《方剂学》')}</h2>
    <div class="d-py">${esc(fx.edition || '')}</div>
    <div class="d-tags">
      <span class="chip cat">${esc(fx.author || '')}</span>
      <span class="chip cat2">${esc(fx.press || '')}</span>
      <span class="chip eff">收方 ${total} 首</span>
    </div>
    <div class="d-actions">
      <button class="btn-primary" data-act="fjx-sphere">球体展开</button>
      <button class="btn-ghost" data-act="browse-fangjixue">教材目录</button>
    </div>
  </div>
  <div class="tab-body">
    <section><h3>教材简介</h3><p class="book-intro">${esc(fx.intro || '')}</p></section>
    <section><h3>教材体系</h3><p class="ind-detail">${esc(fx.status || '')}</p></section>
    <section><h3>编写特色</h3><ul class="book-feats">${(fx.features || []).map((x) => `<li>${esc(x)}</li>`).join('')}</ul></section>
    <section><h3>章节目录<span class="sec-sub">${chapters.length} 章 · ${total} 首</span></h3>${chBlocks}</section>
  </div>`;
}

export function fjxChapterHTML(name, data) {
  const chapters = ((store.fangjixue && store.fangjixue.chapters) || []);
  const ch = chapters.find((c) => c.name === name);
  const fs = (data && data.formulas) || [];
  const bySec = {};
  fs.forEach((f) => {
    const k = f.fjxSub || '其他';
    (bySec[k] = bySec[k] || []).push(f);
  });
  const known = (ch && ch.sections) || [];
  const order = known.filter((s) => bySec[s]).concat(Object.keys(bySec).filter((s) => known.indexOf(s) < 0));

  const secBlocks = order.map((s) => `
    <div class="browse-sec">
      <h3>${esc(s)}<span>${bySec[s].length}</span></h3>
      <div class="pick-grid">${bySec[s].map((f) => `<button class="pick" data-formula="${f.id}">${esc(f.name)}</button>`).join('')}</div>
    </div>`).join('');

  return `<div class="d-head book-head">
    <div class="d-kind book">章节</div>
    <h2>${esc(name)}</h2>
    <div class="d-py">《方剂学》· ${fs.length} 首方剂</div>
    ${known.length ? `<p class="lj-outline big">${known.map(esc).join(' · ')}</p>` : ''}
    <div class="d-actions">
      <button class="btn-ghost" data-act="open-fjx">← 返回《方剂学》</button>
      <button class="btn-ghost" data-act="browse-fangjixue">教材目录</button>
    </div>
  </div>
  <div class="tab-body">${secBlocks || '<div class="side-empty">暂无</div>'}</div>`;
}

/* ---------------- 原始资料 ---------------- */
export function docsHTML(docs) {
  const list = (docs || []).map((d) => {
    const isPdf = /\.pdf$/i.test(d.name);
    return `<div class="doc-item">
      <div class="doc-ico ${isPdf ? 'pdf' : 'doc'}">${isPdf ? 'PDF' : 'DOC'}</div>
      <div class="doc-main">
        <div class="doc-name">${esc(d.name)}</div>
        <div class="doc-meta">${fmtSize(d.size)} · 项目原始语料</div>
      </div>
      <a class="doc-dl" href="/docs/${encodeURIComponent(d.name)}" download>下载</a>
    </div>`;
  }).join('');

  return `<div class="d-head">
    <div class="d-kind plain">资料</div>
    <h2>原始文档</h2>
    <div class="d-py">本项目中药与方剂数据的原始来源文件，随程序一并打包</div>
  </div>
  <div class="tab-body">
    ${list || '<div class="side-empty">未找到文档</div>'}
    <div class="note"><strong>说明</strong>数据库中的 270 味中药、282 首方剂即由上述文档解析整理而来，解析脚本见项目 <code>scripts/</code> 目录。</div>
  </div>`;
}
