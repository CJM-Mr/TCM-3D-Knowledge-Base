# -*- coding: utf-8 -*-
"""
合并伤寒论新增方剂与《方剂学》同名的重复项：
  - 伤寒论原文(art)/煎服法(use)/倪海厦解读(nhx)/六经(lj) 并入已有记录
  - 组成(comp) 优先保留教材版（含君臣佐使）
  - 目标记录 book 设为 shanghan，删除 sh 开头的重复记录
"""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SEED = os.path.join(ROOT, 'data', 'seed.json')


def main():
    seed = json.load(open(SEED, encoding='utf-8'))
    forms = seed['formulas']

    by_name = {}
    for f in forms:
        if f.get('book') != 'shanghan':
            by_name.setdefault(f['name'], []).append(f)

    sh_new = [f for f in forms if f.get('book') == 'shanghan' and f['id'].startswith('sh')]
    removed = set()
    merged = []
    for f in sh_new:
        targets = by_name.get(f['name'])
        if not targets:
            continue
        t = targets[0]
        for k in ('art', 'use', 'nhx', 'lj', 'chapter'):
            if f.get(k):
                t[k] = f[k]
        if not t.get('comp') and f.get('comp'):
            t['comp'] = f['comp']
        for k in ('eff', 'ind', 'indDetail', 'syn', 'ana', 'cau', 'feat', 'apply',
                  'song', 'attach', 'cat', 'sub'):
            if not (t.get(k) or '').strip() and f.get(k):
                t[k] = f[k]
        t['book'] = 'shanghan'
        removed.add(f['id'])
        merged.append('%s -> %s (%s)' % (f['id'], t['id'], f['name']))

    seed['formulas'] = [f for f in forms if f['id'] not in removed]

    # 更新计数与六经分布
    sh = [f for f in seed['formulas'] if f.get('book') == 'shanghan']
    seed['meta']['formulaCount'] = len(seed['formulas'])
    seed['meta']['shanghanCount'] = len(sh)
    lj_count = {}
    for f in sh:
        lj_count[f['lj']] = lj_count.get(f['lj'], 0) + 1
    for x in seed['shanghan'].get('liujing', []):
        if x['key'] in lj_count:
            x['n'] = lj_count[x['key']]

    json.dump(seed, open(SEED, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('合并重复方剂 %d 组:' % len(merged))
    for m in merged:
        print('  ', m)
    print('方剂总数 %d，伤寒论 %d' % (len(seed['formulas']), len(sh)))


if __name__ == '__main__':
    main()
