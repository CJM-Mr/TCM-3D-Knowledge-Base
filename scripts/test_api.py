# -*- coding: utf-8 -*-
"""后端接口与数据一致性测试（不依赖浏览器）"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'backend'))
from urllib.parse import quote

from app import create_app

app = create_app()
c = app.test_client()
fails = []
out = []


def ok(cond, msg):
    if not cond:
        fails.append(msg)
    out.append(('PASS ' if cond else 'FAIL ') + msg)


def j(path):
    r = c.get(path)
    return r.status_code, (r.get_json() if r.is_json else None)


# ---------- 基础 ----------
st, h = j('/api/health')
ok(st == 200 and h['counts']['herbs'] == 270, '健康检查 / 中药 270 味')
ok(h['counts']['formulas'] == 282, '方剂 282 首')
ok(h['counts']['shanghan'] == 79, '伤寒论 79 首')
ok(h['counts']['fangjixue'] == 230, '教材 230 首')

st, meta = j('/api/meta')
ok(st == 200 and len(meta['categories']) >= 19, 'meta 分类 %d 项' % len(meta['categories']))
ok(len(meta['fangjixue']['chapters']) == 21, '教材 21 章')
ok(len(meta['shanghan']['liujing']) == 6, '六经 6 项')

st, idx = j('/api/index')
ok(st == 200 and len(idx['herbs']) == 270 and len(idx['formulas']) == 282, '索引完整')
bad = [f for f in idx['formulas'] if not f['comp']]
ok(not bad, '所有方剂概要含组成（异常 %d）' % len(bad))
badh = [x for x in idx['herbs'] if x['id'] not in {y['h'] for y in []} and not x['name']]
ok(not badh, '中药索引字段完整')

# ---------- 详情 ----------
st, hd = j('/api/herbs/mahuang')
ok(st == 200 and hd['herb']['name'] == '麻黄', '中药详情 麻黄')
ok(len(hd['formulas']) == 14, '麻黄相关方剂 %d 首' % len(hd['formulas']))
ok(all(f['comp'] for f in hd['formulas']), '相关方剂均带组成')

st, fd = j('/api/formulas/mahuangtang')
ok(st == 200 and fd['name'] == '麻黄汤', '方剂详情 麻黄汤')
ok([x['h'] for x in fd['comp']] == ['mahuang', 'guizhi', 'kuxingren', 'gancao'], '麻黄汤组成顺序正确')
ok(bool(fd['art']) and bool(fd['song']), '麻黄汤含原文条文与方歌')

st, rel = j('/api/formulas/mahuangtang/related')
ok(st == 200 and len(rel['shared']) > 0, '相关方剂分析 %d 条' % len(rel['shared']))
ok(rel['shared'][0]['n'] >= 2, '相近方剂共有药味 >= 2')

st, cpd = j('/api/compare?ids=mahuangtang,guizhitang')
ok(st == 200 and len(cpd['formulas']) == 2, '对比接口返回 2 首')

# ---------- 场景 ----------
modes = [
    ('overview', '', 552),
    ('book', '', 87),
    ('liujing', '&key=太阳病', 39),
    ('fjx', '', 164),
    ('fjxchapter', '&key=解表剂', 20),
    ('herb', '&id=mahuang', 59),
    ('formula', '&id=mahuangtang', 31),
    ('effect', '&key=解表', 52),
    ('meridian', '&key=肺', 137),
    ('category', '&key=解表药', 52),
    ('fcat', '&key=解表剂', 59),
    ('combo', '&ids=mahuang,guizhi', 10),
]
for m, extra, expect in modes:
    st, sc = j('/api/graph?mode=' + m + extra)
    good = st == 200 and len(sc['nodes']) == expect and sc['title']
    ok(good, '场景 %-10s 节点 %d（期望 %d）' % (m, len(sc['nodes']) if sc else -1, expect))
    if sc and sc['nodes']:
        ids = {n['id'] for n in sc['nodes']}
        dangling = [l for l in sc['links'] if l['a'] not in ids or l['b'] not in ids]
        ok(not dangling, '场景 %-10s 无悬空连线（%d）' % (m, len(dangling)))

# 功效兜底：只在「功效」字段出现的复合词，也应能展开
st, sc1 = j('/api/graph?mode=effect&key=' + quote('清热解毒'))
ok(st == 200 and len(sc1['nodes']) > 3, '功效兜底「清热解毒」节点 %d' % len(sc1['nodes']))
st, sc2 = j('/api/graph?mode=effect&key=' + quote('清热'))
ok(len(sc2['nodes']) > 3, '功效标签「清热」节点 %d' % len(sc2['nodes']))
st, sc3 = j('/api/graph?mode=effect&key=' + quote('完全不存在的词'))
ok(len(sc3['nodes']) == 1, '未知功效仅返回中心节点')

# ---------- 典籍 / 教材 ----------
st, sh = j('/api/book/shanghan')
ok(st == 200 and len(sh['blocks']) == 7, '伤寒论分块 7（六经 + 差后劳复）')
ok(sum(len(b['formulas']) for b in sh['blocks']) == 79, '伤寒论分块方剂合计 79')
ok(sh['herbCount'] >= 60, '伤寒论涉药 %d 味' % sh['herbCount'])

st, lj = j('/api/book/shanghan/太阳病')
ok(st == 200 and len(lj['formulas']) == 38, '太阳病 38 首')
ok(bool(lj['outline']), '太阳病提纲存在')

st, fx = j('/api/book/fangjixue')
ok(st == 200 and len(fx['chapters']) == 21, '教材章节 21')
ok(sum(len(x['formulas']) for x in fx['chapters']) == 230, '教材方剂合计 230')

st, ch = j('/api/book/fangjixue/解表剂')
ok(st == 200 and len(ch['formulas']) == 19, '解表剂 19 首')
ok(len({f['fjxSub'] for f in ch['formulas']}) >= 3, '解表剂分小节 %d' % len({f['fjxSub'] for f in ch['formulas']}))

# ---------- 检索 ----------
st, s1 = j('/api/search?q=甘草')
groups = {g['group']: g['items'] for g in s1['groups']}
ok('中药' in groups and groups['中药'][0]['label'] == '甘草', '搜索「甘草」命中中药')
ok('方剂' in groups and len(groups['方剂']) >= 4, '搜索「甘草」命中方剂 %d' % len(groups.get('方剂', [])))

st, s2 = j('/api/search?q=黄芪 当归')
ok(s2['groups'] and s2['groups'][0]['items'][0]['type'] == 'combo', '配伍组合检索')
ok('10' in s2['groups'][0]['items'][0]['label'], '黄芪+当归 命中 10 首')

st, s3 = j('/api/search?q=方剂学')
ok(any(g['group'] == '教材' for g in s3['groups']), '搜索「方剂学」命中教材')

st, s4 = j('/api/search?q=解表剂')
ok(any(g['group'] == '教材章节' for g in s4['groups']), '搜索「解表剂」命中教材章节')

st, s5 = j('/api/search?q=伤寒')
ok(any(g['group'] == '典籍' for g in s5['groups']), '搜索「伤寒」命中典籍')

# ---------- 主治详解 ----------
st, hh = j('/api/herbs/mahuang')
ie = hh['indExplain']
ok(bool(ie['mechanism']) and '归' in ie['mechanism'], '中药证治机理含归经')
ok(len(ie['items']) == 3, '麻黄主治拆解 3 项')
ok(ie['items'][0]['eff'] == '发汗解表', '风寒感冒 → 发汗解表')
ok(ie['items'][0]['formula'] == '麻黄汤', '风寒感冒 → 麻黄汤')

st, ff = j('/api/formulas/mahuangtang')
ok(isinstance(ff['indDetail'], str) and len(ff['indDetail']) > 40, '方剂主治详述仍为字符串')
ok(len(ff['indExplain']['sentences']) >= 3, '方剂病机拆句 ≥3')
ok(len(ff['indExplain']['items']) >= 4, '方剂证候拆解 ≥4')
ok(not any(x.startswith(('脉', '舌', '苔')) for x in ff['indExplain']['items']), '拆解已排除舌脉')

# 全量抽查：每味中药都要有证治机理，条目必须非空
bad_h = [h for h in idx['herbs'] if not j('/api/herbs/' + h['id'])[1]['indExplain']['items']]
ok(not bad_h, '全部中药均有主治拆解')
bad_m = [h['name'] for h in idx['herbs']
         if not j('/api/herbs/' + h['id'])[1]['indExplain']['mechanism']]
ok(not bad_m, '全部中药均有证治机理')

# ---------- 静态 ----------
r = c.get('/')
ok(r.status_code == 200 and b'<div class="app">' in r.data, '前端首页可访问')
r = c.get('/assets/')
ok(r.status_code in (200, 404), '静态目录可访问')

# ---------- 输出 ----------
print('\n'.join(out))
print('')
print('===== %s（%d 项，失败 %d） =====' % ('ALL GREEN' if not fails else 'FAILED', len(out), len(fails)))
if fails:
    for f in fails:
        print('  !', f)
sys.exit(0)
