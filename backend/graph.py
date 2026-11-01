# -*- coding: utf-8 -*-
"""三维场景构建：把「节点 + 连线」的计算搬到服务端，前端只负责渲染"""

# 与前端 sphere.js 约定的节点类型：herb / formula / category / effect / meridian
MAX_LEVEL = {}


def _add(nodes, nid, ntype, label, level):
    nodes.append({'id': nid, 'type': ntype, 'label': label, 'level': level})


def _link(links, a, b):
    links.append({'a': a, 'b': b})


def build(db, mode, **kw):
    """返回 {'mode': 'sphere'|'focus', 'nodes': [...], 'links': [...], 'title': str}"""
    nodes, links = [], []
    deep = bool(kw.get('deep'))

    if mode == 'overview':
        for h in db.herbs_where('1=1'):
            _add(nodes, 'h:' + h['id'], 'herb', h['name'], 1)
        for f in db.formula_summaries():
            _add(nodes, 'f:' + f['id'], 'formula', f['name'], 1)
        for row in db.conn().execute('SELECT formula_id, herb_id FROM formula_herb'):
            _link(links, 'f:' + row['formula_id'], 'h:' + row['herb_id'])
        return {'mode': 'sphere', 'nodes': nodes, 'links': links,
                'title': '全景知识网络 · %d 味中药 · %d 首方剂' % (db.counts['herbs'], db.counts['formulas'])}

    if mode in ('book', 'liujing'):
        sh = db.book_meta('shanghan')
        ljs = [x['key'] for x in sh.get('liujing', [])]
        # 补入「差后劳复」等六经之外的篇目
        for row in db.conn().execute("SELECT DISTINCT lj FROM formula WHERE book='shanghan' AND lj<>''"):
            if row['lj'] not in ljs:
                ljs.append(row['lj'])
        is_book = mode == 'book'
        bid = 'b:shanghan' if is_book else 'l:' + kw['key']
        _add(nodes, bid, 'category', '伤寒论' if is_book else kw['key'], 0)
        keys = ljs if is_book else [kw['key']]
        if is_book:
            for k in ljs:
                _add(nodes, 'l:' + k, 'category', k, 1)
                _link(links, bid, 'l:' + k)
        rows = db.formulas_where("book='shanghan' AND lj IN (%s)" % ','.join('?' * len(keys)), keys)
        for f in rows:
            _add(nodes, 'f:' + f['id'], 'formula', f['name'], 2)
            _link(links, 'l:' + f['lj'], 'f:' + f['id'])
        return {'mode': 'focus', 'nodes': nodes, 'links': links,
                'title': ('典籍模式 · 《伤寒论》 · %d 首经方' % db.counts['shanghan']) if is_book
                else ('六经辨证 · %s' % kw['key'])}

    if mode in ('fjx', 'fjxchapter'):
        meta = db.book_meta('fangjixue')
        chapters = meta.get('chapters', [])
        is_book = mode == 'fjx'
        bid = 'b:fangjixue' if is_book else 'x:' + kw['key']
        _add(nodes, bid, 'category', '方剂学' if is_book else kw['key'], 0)
        targets = chapters if is_book else [c for c in chapters if c['name'] == kw['key']]
        if is_book:
            for c in chapters:
                _add(nodes, 'x:' + c['name'], 'category', c['name'], 1)
                _link(links, bid, 'x:' + c['name'])
        per_cap = 8 if is_book else 999   # 教材全图仅展示每章代表方，避免标签重叠
        for c in targets:
            rows = db.formulas_where('fjx=1 AND fjx_cat=?', (c['name'],), with_comp=False)[:per_cap]
            for f in rows:
                _add(nodes, 'f:' + f['id'], 'formula', f['name'], 2 if is_book else 1)
                _link(links, 'x:' + f['fjxCat'], 'f:' + f['id'])
        return {'mode': 'focus', 'nodes': nodes, 'links': links,
                'title': ('教材模式 · 《方剂学》 · %d 章 · %d 首方剂' % (len(chapters), db.counts['fangjixue']))
                if is_book else ('方剂学 · %s' % kw['key'])}

    if mode == 'herb':
        h = db.herb(kw['id'])
        if not h:
            return {'mode': 'sphere', 'nodes': [], 'links': [], 'title': ''}
        _add(nodes, 'h:' + h['id'], 'herb', h['name'], 0)
        fl = db.herb_formulas(h['id'])[:999 if deep else 40]
        fids = [x['id'] for x in fl]
        co = {}
        for fid in fids:
            for c in db.comp(fid):
                if c['h'] != h['id']:
                    co[c['h']] = co.get(c['h'], 0) + 1
        for x in fl:
            _add(nodes, 'f:' + x['id'], 'formula', x['name'], 1)
            _link(links, 'h:' + h['id'], 'f:' + x['id'])
        co_list = sorted(co.items(), key=lambda kv: -kv[1])[:999 if deep else 44]
        co_set = set(k for k, _ in co_list)
        for hid, _n in co_list:
            _add(nodes, 'h:' + hid, 'herb', db.name_of(hid), 2)
        for fid in fids:
            for c in db.comp(fid):
                if c['h'] in co_set:
                    _link(links, 'f:' + fid, 'h:' + c['h'])
        return {'mode': 'focus', 'nodes': nodes, 'links': links,
                'title': '中药中心模式 · ' + h['name']}

    if mode == 'formula':
        f = db.formula(kw['id'])
        if not f:
            return {'mode': 'sphere', 'nodes': [], 'links': [], 'title': ''}
        _add(nodes, 'f:' + f['id'], 'formula', f['name'], 0)
        lv1 = set()
        for c in f['comp']:
            lv1.add(c['h'])
            _add(nodes, 'h:' + c['h'], 'herb', db.name_of(c['h']), 1)
            _link(links, 'f:' + f['id'], 'h:' + c['h'])
        for fid, _n in db.related_formulas(f['id'], 999 if deep else 26):
            f2 = db.formula_summaries_map().get(fid)
            if not f2:
                continue
            _add(nodes, 'f:' + fid, 'formula', f2['name'], 2)
            for c in db.comp(fid):
                if c['h'] in lv1:
                    _link(links, 'f:' + fid, 'h:' + c['h'])
        return {'mode': 'focus', 'nodes': nodes, 'links': links,
                'title': '方剂中心模式 · ' + f['name']}

    if mode in ('effect', 'meridian'):
        is_eff = mode == 'effect'
        key = kw['key']
        cid = ('e:' if is_eff else 'm:') + key
        _add(nodes, cid, 'effect' if is_eff else 'meridian', key if is_eff else key + '经', 0)
        if is_eff:
            hs = db.herbs_where('tags LIKE ?', ('%"' + key + '"%',))
            if not hs:
                # 兜底：标签里没有该词时，按「功效」字段再找一次
                hs = db.herbs_where('eff LIKE ?', ('%"' + key + '"%',))
        else:
            hs = db.herbs_where('mer LIKE ?', ('%"' + key + '"%',))
        hset = set()
        for h in hs:
            hset.add(h['id'])
            _add(nodes, 'h:' + h['id'], 'herb', h['name'], 1)
            _link(links, cid, 'h:' + h['id'])
        fc = {}
        for h in hs:
            for x in db.herb_formulas(h['id']):
                fc[x['id']] = fc.get(x['id'], 0) + 1
        summ = db.formula_summaries_map()
        for fid, _n in sorted(fc.items(), key=lambda kv: -kv[1])[:999 if deep else 24]:
            if fid not in summ:
                continue
            _add(nodes, 'f:' + fid, 'formula', summ[fid]['name'], 2)
            for c in db.comp(fid):
                if c['h'] in hset:
                    _link(links, 'f:' + fid, 'h:' + c['h'])
        return {'mode': 'focus', 'nodes': nodes, 'links': links,
                'title': ('功效关联模式 · ' + key) if is_eff else ('归经关联模式 · %s经' % key)}

    if mode in ('category', 'fcat'):
        is_cat = mode == 'category'
        key = kw.get('key') or ''
        # 无 key 时：fcat 显示所有分类概览；category 不支持无 key
        if not key:
            if is_cat:
                # category 无 key：显示所有药物分类 + 各类代表中药
                cats = []
                for row in db.conn().execute(
                    "SELECT cat, COUNT(*) AS n FROM herb WHERE cat IS NOT NULL AND cat<>'' GROUP BY cat ORDER BY n DESC"
                ):
                    cats.append((row['cat'], row['n']))
                for cat, n in cats:
                    _add(nodes, 'c:' + cat, 'category', cat, 0)
                # 每个分类取前 5 个中药
                for cat, n in cats:
                    for h in db.herbs_where('cat=?', (cat,))[:5]:
                        _add(nodes, 'h:' + h['id'], 'herb', h['name'], 1)
                        _link(links, 'c:' + cat, 'h:' + h['id'])
                return {'mode': 'focus', 'nodes': nodes, 'links': links,
                        'title': '药物分类总览 · %d 类 · %d 味中药' % (len(cats), db.counts['herbs'])}
            # fcat 无 key：显示所有方剂分类 + 各类代表方剂
            cats = []
            for row in db.conn().execute(
                "SELECT cat, COUNT(*) AS n FROM formula WHERE cat IS NOT NULL AND cat<>'' GROUP BY cat ORDER BY n DESC"
            ):
                cats.append((row['cat'], row['n']))
            for cat, n in cats:
                _add(nodes, 'c:' + cat, 'category', cat, 0)
            # 每个分类取前 5 个方剂
            summ = db.formula_summaries_map()
            for cat, n in cats:
                for f in db.formulas_where('cat=?', (cat,), with_comp=False)[:5]:
                    _add(nodes, 'f:' + f['id'], 'formula', f['name'], 1)
                    _link(links, 'c:' + cat, 'f:' + f['id'])
            return {'mode': 'focus', 'nodes': nodes, 'links': links,
                    'title': '方剂分类总览 · %d 类 · %d 首方剂' % (len(cats), db.counts['formulas'])}

        cid = 'c:' + key
        _add(nodes, cid, 'category', key, 0)
        if is_cat:
            hs = db.herbs_where('cat=?', (key,))
            for h in hs:
                _add(nodes, 'h:' + h['id'], 'herb', h['name'], 1)
                _link(links, cid, 'h:' + h['id'])
            hset = set(h['id'] for h in hs)
            fc = {}
            for h in hs:
                for x in db.herb_formulas(h['id']):
                    fc[x['id']] = fc.get(x['id'], 0) + 1
            summ = db.formula_summaries_map()
            for fid, _n in sorted(fc.items(), key=lambda kv: -kv[1])[:999 if deep else 26]:
                if fid not in summ:
                    continue
                _add(nodes, 'f:' + fid, 'formula', summ[fid]['name'], 2)
                for c in db.comp(fid):
                    if c['h'] in hset:
                        _link(links, 'f:' + fid, 'h:' + c['h'])
            return {'mode': 'focus', 'nodes': nodes, 'links': links, 'title': '药物类别 · ' + key}

        rows = db.formulas_where('cat=?', (key,), with_comp=False)
        hset = set()
        for f in rows:
            _add(nodes, 'f:' + f['id'], 'formula', f['name'], 1)
            _link(links, cid, 'f:' + f['id'])
            for c in db.comp(f['id']):
                hset.add(c['h'])
        for hid in list(hset)[:999 if deep else 30]:
            _add(nodes, 'h:' + hid, 'herb', db.name_of(hid), 2)
            for f in rows:
                for c in db.comp(f['id']):
                    if c['h'] == hid:
                        _link(links, 'f:' + f['id'], 'h:' + hid)
        return {'mode': 'focus', 'nodes': nodes, 'links': links, 'title': '方剂分类 · ' + key}

    if mode == 'combo':
        ids = kw.get('ids') or []
        cid = 'k:combo'
        label = ' + '.join(db.name_of(i) for i in ids)
        _add(nodes, cid, 'category', label, 0)
        for hid in ids:
            h = db.herb(hid)
            if not h:
                continue
            _add(nodes, 'h:' + hid, 'herb', h['name'], 1)
            _link(links, cid, 'h:' + hid)
        rows = db.formulas_containing_all(ids) if ids else []
        for f in rows:
            _add(nodes, 'f:' + f['id'], 'formula', f['name'], 2)
            for c in db.comp(f['id']):
                if c['h'] in ids:
                    _link(links, 'f:' + f['id'], 'h:' + c['h'])
        return {'mode': 'focus', 'nodes': nodes, 'links': links, 'title': '配伍模式 · ' + label}

    return {'mode': 'sphere', 'nodes': nodes, 'links': links, 'title': ''}
