# -*- coding: utf-8 -*-
"""
解析《伤寒论》赵开美本全文（伤寒论_简体全文.txt）
  输出 data/shanghan_parsed.json：
  {
    "chapters": [
      {"no": 5, "title": "辨太阳病脉证并治上第五", "lj": "太阳病",
       "articles": ["条文1", ...],
       "formulas": [{"name":"桂枝汤","article":"...","comp":"...","usage":"..."}]}
    ]
  }
"""
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.environ.get('TCM_SHANGHAN_SRC') or r'D:\Desktop\伤寒论_简体全文.txt'
OUT = os.path.join(ROOT, 'data', 'shanghan_parsed.json')

# 篇名 -> 六经归类
LJ_MAP = [
    ('辨太阳病', '太阳病'),
    ('辨阳明病', '阳明病'),
    ('辨少阳病', '少阳病'),
    ('辨太阴病', '太阴病'),
    ('辨少阴病', '少阴病'),
    ('辨厥阴病', '厥阴病'),
    ('辨霍乱病', '霍乱病'),
    ('辨阴阳易差后劳复', '差后劳复'),
    ('辨脉法', '脉法'),
    ('平脉法', '脉法'),
    ('伤寒例', '伤寒例'),
    ('辨痓湿暍', '痓湿暍'),
    ('辨不可发汗', '汗吐下'),
    ('辨可发汗', '汗吐下'),
    ('辨发汗后', '汗吐下'),
    ('辨不可吐', '汗吐下'),
    ('辨可吐', '汗吐下'),
    ('辨不可下', '汗吐下'),
    ('辨可下', '汗吐下'),
    ('辨发汗吐下后', '汗吐下'),
]


def lj_of(title):
    for kw, lj in LJ_MAP:
        if kw in title:
            return lj
    return '其他'


def clean_lines(raw):
    """去掉 PDF 页码标记与行首尾空白，返回非空行列表"""
    out = []
    for ln in raw.split('\n'):
        ln = ln.strip()
        if not ln:
            continue
        if ln.startswith('【原PDF') or ln.startswith('『') or ln.startswith('底本'):
            continue
        out.append(ln)
    return out


def merge_wrapped(lines):
    """合并 PDF 折行：行尾不是句读符则与下一行拼接"""
    merged = []
    buf = ''
    for ln in lines:
        buf += ln
        if ln.endswith(('．', '。', '？', '！', '，', '、', '：')):
            merged.append(buf)
            buf = ''
        elif ln.endswith('．') or ln.endswith('。'):
            merged.append(buf)
            buf = ''
    if buf:
        merged.append(buf)
    return merged


def blocks_of(text):
    """按空行切块"""
    blocks, cur = [], []
    for ln in text.split('\n'):
        s = ln.strip()
        if not s:
            if cur:
                blocks.append(cur)
                cur = []
        else:
            cur.append(s)
    if cur:
        blocks.append(cur)
    return blocks


def parse_formula_name(line):
    s = line[1:]  # 去 ●
    s = re.sub(r'[※．。\s]+$', '', s)
    if s.endswith('方') and len(s) > 1:
        s = s[:-1]
    return s.strip()


def split_comp_usage(lines):
    """方剂块：首行方名，其余为组成+用法；以「右X味/上X味」为界切分"""
    body = merge_wrapped(lines[1:])
    comp, usage = [], []
    hit = False
    for seg in body:
        if not hit and re.match(r'^[右上]\s*[一二三四五六七八九十百]+\s*味', seg):
            hit = True
        if hit:
            usage.append(seg)
        else:
            comp.append(seg)
    return ' '.join(comp).strip(), ' '.join(usage).strip()


def main():
    raw = open(SRC, encoding='utf-8', errors='ignore').read()
    # 过滤 PDF 页码标记（含行内）
    raw = re.sub(r'【原PDF第\d+页】', '', raw)
    # 按 ◆ 切篇
    parts = re.split(r'(?m)^◆\s*(.+?)\s*$', raw)
    # parts[0] 为前言，之后 [篇名, 正文, 篇名, 正文, ...]
    chapters = []
    for i in range(1, len(parts), 2):
        title = re.sub(r'[．。\s]+$', '', parts[i].strip())
        body = parts[i + 1] if i + 1 < len(parts) else ''
        if not title:
            continue
        blks = blocks_of(body)
        articles, formulas = [], []
        last_article = ''
        for blk in blks:
            # 块内定位所有 ● 方剂行
            idxs = [i for i, ln in enumerate(blk) if ln.startswith('●')]
            # ● 之前的行 = 条文
            head_end = idxs[0] if idxs else len(blk)
            head = blk[:head_end]
            if head:
                for a in merge_wrapped(head):
                    a = a.strip()
                    if len(a) < 4:
                        continue
                    articles.append(a)
                    last_article = a
            # 每个 ● 起一个方剂，到下一个 ● 或块尾
            for k, i in enumerate(idxs):
                j = idxs[k + 1] if k + 1 < len(idxs) else len(blk)
                seg = blk[i:j]
                name = parse_formula_name(seg[0])
                comp, usage = split_comp_usage(seg)
                formulas.append({
                    'name': name,
                    'article': last_article,
                    'comp': comp,
                    'usage': usage,
                })
        no_m = re.search(r'第([一二三四五六七八九十百]+)$', title)
        no = cn2num(no_m.group(1)) if no_m else 0
        chapters.append({
            'no': no, 'title': title, 'lj': lj_of(title),
            'articles': articles, 'formulas': formulas,
        })

    data = {'chapters': chapters}
    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=1)

    # 统计
    total_a = sum(len(c['articles']) for c in chapters)
    total_f = sum(len(c['formulas']) for c in chapters)
    print('篇数: %d' % len(chapters))
    print('条文总数: %d' % total_a)
    print('方剂总数(含重复): %d' % total_f)
    print('唯一方名: %d' % len({f['name'] for c in chapters for f in c['formulas']}))
    print()
    for c in chapters:
        print('  %2d. %-22s lj=%-6s 条文%3d 方%3d' % (
            c['no'], c['title'][:22], c['lj'], len(c['articles']), len(c['formulas'])))
    print('\n输出: %s' % OUT)


CN = {'一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9, '十': 10}


def cn2num(s):
    if not s:
        return 0
    if s in CN:
        return CN[s]
    if '十' in s:
        a, _, b = s.partition('十')
        return (CN.get(a, 1) if a else 1) * 10 + (CN.get(b, 0) if b else 0)
    return 0


if __name__ == '__main__':
    main()
