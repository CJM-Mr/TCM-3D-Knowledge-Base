/* ========== 通用工具 ========== */

export const $ = (s, r) => (r || document).querySelector(s);
export const $$ = (s, r) => Array.prototype.slice.call((r || document).querySelectorAll(s));

export const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } };
export const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ } };

/* 教材原文由 PDF 抽取，段落内有硬换行，展示前归一化 */
export const nz = (s) => String(s == null ? '' : s).replace(/[\r\n]+/g, '').replace(/\s{2,}/g, ' ').trim();

export function songHTML(s) {
  if (!s) return '';
  return String(s).split(/\n+/).map((x) => x.trim()).filter(Boolean)
    .map((l) => `<span class="song-line">${esc(l)}</span>`).join('');
}

/* 附方：按「1.方名（《出处》）组成…功用…主治…」切块 */
export function attachHTML(txt) {
  if (!txt) return '';
  const items = nz(txt).split(/(?=\d{1,2}\.(?![\d]))/).map((x) => x.trim()).filter(Boolean);
  return items.map((s) => {
    const m = s.match(/^(\d{1,2})\.\s*(.*)$/);
    const rest = m ? m[2] : s;
    const nm = rest.match(/^([^\s（(《]{2,12})/);
    const name = nm ? nm[1] : '';
    let tail = nm ? rest.slice(name.length) : rest;
    let src = '';
    const sm = tail.match(/^\s*[（(]\s*(《[^》]+》[^）)]*)[）)]/);
    if (sm) { src = sm[1]; tail = tail.slice(sm[0].length); }
    return `<div class="attach-item">
      ${name ? `<div class="attach-name">${esc(name)}${src ? `<span>${esc(src)}</span>` : ''}</div>` : ''}
      <p class="attach-body">${esc(tail.trim())}</p>
    </div>`;
  }).join('');
}

export const chipRow = (arr, cls) => (arr || []).map((x) => `<span class="chip ${cls || ''}">${esc(x)}</span>`).join('');

export const fmtSize = (n) => (n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB');
