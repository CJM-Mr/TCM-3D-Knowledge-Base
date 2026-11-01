/* ========== REST 客户端：所有数据经 Flask API 获取 ========== */

const BASE = '';

async function get(path, params) {
  let url = BASE + path;
  if (params) {
    const qs = new URLSearchParams();
    Object.keys(params).forEach((k) => {
      const v = params[k];
      if (v !== undefined && v !== null && v !== '') qs.append(k, v);
    });
    const s = qs.toString();
    if (s) url += (url.indexOf('?') >= 0 ? '&' : '?') + s;
  }
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error('API ' + res.status + ' ' + url);
  return res.json();
}

export const api = {
  meta: () => get('/api/meta'),
  index: () => get('/api/index'),

  herb: (id) => get('/api/herbs/' + encodeURIComponent(id)),
  formula: (id) => get('/api/formulas/' + encodeURIComponent(id)),
  formulaRelated: (id) => get('/api/formulas/' + encodeURIComponent(id) + '/related'),

  graph: (view) => {
    const p = { mode: view.mode };
    if (view.id) p.id = view.id;
    if (view.key) p.key = view.key;
    if (view.ids && view.ids.length) p.ids = view.ids.join(',');
    if (view.deep) p.deep = '1';
    return get('/api/graph', p);
  },

  search: (q) => get('/api/search', { q }),
  compare: (ids) => get('/api/compare', { ids: (ids || []).join(',') }),

  bookShanghan: () => get('/api/book/shanghan'),
  bookLiujing: (key) => get('/api/book/shanghan/' + encodeURIComponent(key)),
  bookFangjixue: () => get('/api/book/fangjixue'),
  bookFjxChapter: (name) => get('/api/book/fangjixue/' + encodeURIComponent(name)),

  docs: () => get('/api/docs')
};
