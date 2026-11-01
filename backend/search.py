# -*- coding: utf-8 -*-
"""全局检索：中药 / 方剂 / 功效 / 归经 / 典籍 / 教材章节 / 配伍组合"""
import re

SPLIT = re.compile(r'[、,，\s]+')


def _herb_brief(h):
    return {'type': 'herb', 'id': h['id'], 'label': h['name'],
            'sub': ' · '.join(h['eff'][:3]),
            'meta': (h['nat'] or '') + ' · ' + ''.join(h['mer'])}


def _formula_brief(f):
    return {'type': 'formula', 'id': f['id'], 'label': f['name'],
            'sub': f['eff'], 'meta': f['src']}


def find_herb(db, text):
    h = db.herbs_where('name=?', (text,))
    if h:
        return h[0]
    h = db.herbs_where('name LIKE ?', ('%' + text + '%',))
    return h[0] if h else None


def run(db, q):
    q = (q or '').strip()
    if not q:
        return []
    out = []

    parts = [p for p in SPLIT.split(q) if p]
    if len(parts) > 1:
        herbs = [find_herb(db, p) for p in parts]
        herbs = [h for h in herbs if h]
        if len(herbs) >= 2:
            ids = [h['id'] for h in herbs]
            fs = db.formulas_containing_all(ids)
            return [{'group': '配伍组合', 'items': [{
                'type': 'combo',
                'label': ' + '.join(h['name'] for h in herbs) + ' · %d 首方剂' % len(fs),
                'ids': ids}]}]

    like = '%' + q + '%'
    low = '%' + q.lower() + '%'

    # 典籍
    if any(k in q for k in ('伤寒', '经方', '六经', '张仲景')):
        out.append({'group': '典籍', 'items': [{
            'type': 'book', 'label': '《伤寒论》',
            'sub': '张仲景 · 六经辨证 · %d 首经方' % db.counts['shanghan']}]})

    # 教材
    if '方剂学' in q or '教材' in q:
        meta = db.book_meta('fangjixue')
        out.append({'group': '教材', 'items': [{
            'type': 'fjx', 'label': '《方剂学》',
            'sub': '%s · %d 章 · %d 首方剂' % (meta.get('author', ''),
                                             len(meta.get('chapters', [])),
                                             db.counts['fangjixue'])}]})

    # 教材章节
    chs = [c for c in db.chapters_of('fangjixue') if q in c['name']]
    if chs:
        out.append({'group': '教材章节', 'items': [{
            'type': 'fjxchapter', 'key': c['name'], 'label': c['name'],
            'sub': '《方剂学》· %d 首方剂' % c['count']} for c in chs[:8]]})

    # 中药
    hs = db.herbs_where(
        'name LIKE ? OR alias LIKE ? OR lower(py) LIKE ? OR eff LIKE ? OR tags LIKE ? OR ind LIKE ? '
        'ORDER BY (name LIKE ?) DESC, length(name) LIMIT 14',
        (like, like, low, like, like, like, like))
    if hs:
        out.append({'group': '中药', 'items': [_herb_brief(h) for h in hs]})

    # 方剂
    fs = db.formulas_where(
        'name LIKE ? OR lower(py) LIKE ? OR eff LIKE ? OR ind LIKE ? OR syn LIKE ? '
        'OR art LIKE ? OR lj LIKE ? OR id IN (SELECT formula_id FROM formula_herb '
        'WHERE herb_id IN (SELECT id FROM herb WHERE name = ?)) '
        'ORDER BY (name LIKE ?) DESC, length(name) LIMIT 12',
        (like, low, like, like, like, like, like, q, like))
    if fs:
        out.append({'group': '方剂', 'items': [_formula_brief(f) for f in fs]})

    # 功效
    es = [e for e in db.effects if q in e['name']][:8]
    if es:
        out.append({'group': '功效', 'items': [{
            'type': 'effect', 'key': e['name'], 'label': e['name'],
            'sub': '%d 味中药' % e['n']} for e in es]})

    # 归经
    ms = [m for m in db.meridians if q in m['name'] or q in m['name'] + '经'][:6]
    if ms:
        out.append({'group': '归经', 'items': [{
            'type': 'meridian', 'key': m['name'], 'label': m['name'] + '经',
            'sub': '%d 味中药' % m['n']} for m in ms]})

    return out
