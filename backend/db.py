# -*- coding: utf-8 -*-
"""SQLite 数据访问层：把行对象转成前端直接可用的 JSON 结构"""
import json
import os
import sqlite3

_JSON_HERB = ('fla', 'mer', 'eff', 'tags', 'combo', 'pharm')
_JSON_FORMULA = ('rel',)

HERB_COLS = ('id,name,py,alias,src,part,cat,sub,nat,fla,mer,eff,tags,ind,clin,combo,dose,proc,cau,pharm,ref')
FORMULA_COLS = ('id,name,py,src,book,lj,cat,sub,art,eff,ind,ind_detail,syn,usage,cau,ana,'
                'feat,application,song,attach,rel,fjx,fjx_cat,fjx_sub,nhx')

FORMULA_FIELD_MAP = {
    'ind_detail': 'indDetail',
    'usage': 'use',
    'application': 'apply',
    'fjx_cat': 'fjxCat',
    'fjx_sub': 'fjxSub',
}


def _loads(s, default):
    if not s:
        return default
    try:
        return json.loads(s)
    except (ValueError, TypeError):
        return default


def herb_row(r):
    h = dict(r)
    for k in _JSON_HERB:
        h[k] = _loads(h.get(k), [])
    return h


def formula_row(r):
    f = {}
    for k, v in dict(r).items():
        f[FORMULA_FIELD_MAP.get(k, k)] = v
    for k in _JSON_FORMULA:
        f[k] = _loads(f.get(k), [])
    f['fjx'] = int(f.get('fjx') or 0)
    return f


class DB:
    """轻量封装；每个请求一个连接（SQLite 本地库，开销可忽略）"""

    def __init__(self, path):
        self.path = path
        self._mem = None
        self._comp_cache = {}
        self._summ = None
        self._names = {}
        self._load_counts()

    # ---------- 连接 ----------
    def conn(self):
        if self._mem is not None:
            return self._mem
        c = sqlite3.connect(self.path, check_same_thread=False)
        c.row_factory = sqlite3.Row
        c.execute('PRAGMA foreign_keys = ON')
        return c

    def use_memory(self):
        """打包运行时：把只读库整体读入内存，避免临时目录权限问题"""
        src = sqlite3.connect(self.path)
        src.row_factory = sqlite3.Row
        mem = sqlite3.connect(':memory:', check_same_thread=False)
        src.backup(mem)
        src.close()
        mem.row_factory = sqlite3.Row
        self._mem = mem
        return mem

    # ---------- 统计 ----------
    def _load_counts(self):
        c = self.conn()
        self.counts = {
            'herbs': c.execute('SELECT COUNT(*) FROM herb').fetchone()[0],
            'formulas': c.execute('SELECT COUNT(*) FROM formula').fetchone()[0],
            'shanghan': c.execute("SELECT COUNT(*) FROM formula WHERE book='shanghan'").fetchone()[0],
            'fangjixue': c.execute('SELECT COUNT(*) FROM formula WHERE fjx=1').fetchone()[0],
        }
        self.categories = [dict(r) for r in c.execute(
            'SELECT cat AS name, COUNT(*) AS n FROM herb GROUP BY cat ORDER BY n DESC')]
        self.formula_categories = [dict(r) for r in c.execute(
            'SELECT cat AS name, COUNT(*) AS n FROM formula GROUP BY cat ORDER BY MIN(rowid)')]
        # 归经 / 功效存的是 JSON 数组，需在 Python 侧聚合
        mer = {}
        for r in c.execute('SELECT mer FROM herb'):
            for m in _loads(r['mer'], []):
                mer[m] = mer.get(m, 0) + 1
        self.meridians = [{'name': k, 'n': v} for k, v in
                          sorted(mer.items(), key=lambda x: -x[1])]
        eff = {}
        for r in c.execute('SELECT tags FROM herb'):
            for t in _loads(r['tags'], []):
                eff[t] = eff.get(t, 0) + 1
        self.effects = [{'name': k, 'n': v} for k, v in
                        sorted(eff.items(), key=lambda x: (-x[1], x[0]))]
        self.chapters = [dict(r) for r in c.execute(
            'SELECT book,name,ord,sections,count FROM chapter ORDER BY book, ord')]
        for ch in self.chapters:
            ch['sections'] = _loads(ch['sections'], [])
        self.herb_names = [r['name'] for r in c.execute('SELECT name FROM herb')]
        self._names = {r['id']: r['name'] for r in c.execute('SELECT id, name FROM herb')}

    # ---------- 便捷 ----------
    def name_of(self, hid):
        return self._names.get(hid, hid)

    def formula_summaries_map(self):
        if self._summ is None:
            self._summ = {x['id']: x for x in self.formula_summaries()}
        return self._summ

    # ---------- 中药 ----------
    def herbs(self):
        return [herb_row(r) for r in self.conn().execute('SELECT ' + HERB_COLS + ' FROM herb')]

    def herb(self, hid):
        r = self.conn().execute('SELECT ' + HERB_COLS + ' FROM herb WHERE id=?', (hid,)).fetchone()
        return herb_row(r) if r else None

    def herbs_where(self, sql, args=()):
        return [herb_row(r) for r in self.conn().execute(
            'SELECT ' + HERB_COLS + ' FROM herb WHERE ' + sql, args)]

    def herb_formulas(self, hid):
        rows = self.conn().execute(
            '''SELECT f.id, f.name, f.eff, f.cat, f.sub, f.src, f.book, f.lj, f.fjx,
                      fh.dose, fh.role
               FROM formula_herb fh JOIN formula f ON f.id = fh.formula_id
               WHERE fh.herb_id = ?
               ORDER BY (f.book='shanghan') DESC, f.fjx DESC, f.name''', (hid,)).fetchall()
        out = []
        for r in rows:
            f = dict(r)
            f['comp'] = self.comp(f['id'])
            out.append(f)
        return out

    # ---------- 方剂 ----------
    def formulas(self):
        return [formula_row(r) for r in self.conn().execute(
            'SELECT ' + FORMULA_COLS + ' FROM formula')]

    def formula(self, fid):
        r = self.conn().execute('SELECT ' + FORMULA_COLS + ' FROM formula WHERE id=?', (fid,)).fetchone()
        if not r:
            return None
        f = formula_row(r)
        f['comp'] = self.comp(fid)
        return f

    def comp(self, fid):
        if fid in self._comp_cache:
            return self._comp_cache[fid]
        rows = self.conn().execute(
            'SELECT herb_id, dose, role, note FROM formula_herb WHERE formula_id=? ORDER BY ord',
            (fid,)).fetchall()
        out = [{'h': r['herb_id'], 'd': r['dose'], 'r': r['role'], 'n': r['note']} for r in rows]
        self._comp_cache[fid] = out
        return out

    def formulas_containing_all(self, ids):
        if not ids:
            return []
        ph = ','.join('?' * len(ids))
        rows = self.conn().execute(
            '''SELECT f.id, f.name, f.eff, f.cat, f.src, f.book
               FROM formula f JOIN formula_herb fh ON fh.formula_id = f.id
               WHERE fh.herb_id IN (%s)
               GROUP BY f.id HAVING COUNT(DISTINCT fh.herb_id) = ?
               ORDER BY f.name''' % ph, tuple(ids) + (len(ids),)).fetchall()
        return [dict(r) for r in rows]

    def formulas_by_ids(self, ids):
        out = []
        for i in ids:
            f = self.formula(i)
            if f:
                out.append(f)
        return out

    def formulas_where(self, sql, args=(), with_comp=True):
        rows = self.conn().execute('SELECT ' + FORMULA_COLS + ' FROM formula WHERE ' + sql, args).fetchall()
        out = [formula_row(r) for r in rows]
        if with_comp:
            for f in out:
                f['comp'] = self.comp(f['id'])
        return out

    def formula_summaries(self):
        """轻量方剂索引（含组成药味 id/角色，供列表卡片渲染）"""
        rows = self.conn().execute(
            '''SELECT f.id, f.name, f.cat, f.sub, f.src, f.book, f.lj, f.fjx, f.eff
               FROM formula f''').fetchall()
        out = []
        for r in rows:
            f = dict(r)
            f['comp'] = self.comp(f['id'])
            f['n'] = len(f['comp'])
            out.append(f)
        return out

    def herb_formula_counts(self):
        rows = self.conn().execute(
            'SELECT herb_id, COUNT(*) AS n FROM formula_herb GROUP BY herb_id').fetchall()
        return {r['herb_id']: r['n'] for r in rows}

    # ---------- 章节 / 典籍 ----------
    def book_meta(self, bid):
        r = self.conn().execute('SELECT data FROM book_meta WHERE id=?', (bid,)).fetchone()
        return _loads(r['data'], {}) if r else {}

    def chapters_of(self, book):
        return [dict(r) for r in self.conn().execute(
            'SELECT book,name,ord,sections,count FROM chapter WHERE book=? ORDER BY ord', (book,))]

    # ---------- 关联 ----------
    def co_herbs(self, hid, limit=60):
        rows = self.conn().execute(
            '''SELECT fh2.herb_id AS h, COUNT(*) AS n
               FROM formula_herb fh1
               JOIN formula_herb fh2 ON fh1.formula_id = fh2.formula_id
               WHERE fh1.herb_id = ? AND fh2.herb_id <> ?
               GROUP BY fh2.herb_id ORDER BY n DESC LIMIT ?''', (hid, hid, limit)).fetchall()
        return [(r['h'], r['n']) for r in rows]

    def related_formulas(self, fid, limit=26):
        rows = self.conn().execute(
            '''SELECT fh2.formula_id AS f, COUNT(*) AS n
               FROM formula_herb fh1
               JOIN formula_herb fh2 ON fh1.herb_id = fh2.herb_id
               WHERE fh1.formula_id = ? AND fh2.formula_id <> ?
               GROUP BY fh2.formula_id ORDER BY n DESC LIMIT ?''', (fid, fid, limit)).fetchall()
        return [(r['f'], r['n']) for r in rows]
