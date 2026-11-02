# -*- coding: utf-8 -*-
"""
用赵开美本全文（data/shanghan_parsed.json）替换 seed.json 中 book='shanghan' 的方剂：
  - 同名方剂：保留现代注解，用权威原文更新 条文(art)/煎服法(use)/组成(comp)
  - 新方剂：新增记录（仅原文）
  - 旧库异体字方名：规范化后合并
"""
import json
import os
import re
import unicodedata

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SEED = os.path.join(ROOT, 'data', 'seed.json')
PARSED = os.path.join(ROOT, 'data', 'shanghan_parsed.json')

# ---------- 繁简 / 异体 / 别名 ----------
TR = str.maketrans({
    '呉': '吴', '蔴': '麻', '朮': '术', '麥': '麦', '黃': '黄', '參': '参',
    '薑': '姜', '棗': '枣', '當': '当', '歸': '归', '貝': '贝', '龍': '龙',
    '龜': '龟', '鼈': '鳖', '鱉': '鳖', '蠣': '蛎', '藭': '芎', '藶': '苈',
    '蕘': '荛', '藺': '蔺', '麤': '粗', '濇': '涩', '衞': '卫', '渇': '渴',
    '倶': '俱', '麺': '面', '蔕': '蒂', '蘗': '柏', '蘖': '柏', '敱': '豉',
    '蝱': '虻', '蚘': '蛔', '蔞': '蒌', '𫈟': '陈', '蔴': '麻',
    '兩': '两', '個': '个', '昇': '升', '麪': '面', '葦': '苇',
})

ALIAS = {
    '芍药': '白芍', '白芍药': '白芍',
    '杏仁': '苦杏仁', '杏子': '苦杏仁',
    '麻仁': '火麻仁', '麻子仁': '火麻仁', '麻子': '火麻仁',
    '麦门冬': '麦冬', '天门冬': '天冬',
    '芒消': '芒硝', '消石': '硝石',
    '旋复花': '旋覆花', '代赭': '代赭石',
    '栝楼根': '天花粉', '栝楼实': '瓜蒌', '栝蒌根': '天花粉', '栝蒌实': '瓜蒌',
    '黄蓍': '黄芪', '黄耆': '黄芪',
    '葶苈': '葶苈子', '萆薢': '萆薢',
    '桂心': '肉桂', '桂': '桂枝',
    '胶饴': '饴糖', '食蜜': '蜂蜜', '白蜜': '蜂蜜',
    '鸡子': '鸡子黄', '鸡子白': '鸡子黄',
    '萎蕤': '玉竹',
    '蜀椒': '花椒', '椒': '花椒',
    '贝母': '川贝母',
    '连轺': '连翘', '连翘根': '连翘',
    '肥栀子': '栀子',
    '太一禹余粮': '禹余粮',
    '瓜蔕': '瓜蒂',
    '茵𫈟蒿': '茵陈', '茵陈蒿': '茵陈',
    '文蛤': '海蛤壳',
    '香豉': '淡豆豉',
    '豉': '淡豆豉',
    '商陆根': '商陆',
    '连翘根': '连翘',
    '大莓': '大戟',
    '生于地黄': '生地黄',
    '干地黄': '生地黄',
    '芍药': '白芍',
}

# 方名规范化（用于新旧匹配）
FNAME_ALIAS = {
    '旋复代赭汤': '旋覆代赭汤',
    '栀子敱汤': '栀子豉汤',
    '栀子甘草敱汤': '栀子甘草豉汤',
    '栀子生姜敱汤': '栀子生姜豉汤',
    '栀子蘗皮汤': '栀子柏皮汤',
    '瓜蔕散': '瓜蒂散',
    '茵𫈟蒿汤': '茵陈蒿汤',
    '枳实栀子汤': '枳实栀子豉汤',
    '麻黄杏子甘草石膏汤': '麻黄杏仁甘草石膏汤',
    '去桂加白术汤': '桂枝去桂加茯苓白术汤',
}

DOSE_RE = re.compile(r'([一二三四五六七八九十百千半]+(?:两|斤|枚|个|升|合|铢|分|尺|片|茎|把|具|文|斗|筒|握|撮|条|只|双|寸|匕))')
CLEAN_RE = re.compile(r'(去皮|去节|去心|去芦|炙|切|擘|洗|炮|碎|熬|炒|酒洗|汤洗|研|别捣|各|大者|破|肥|绵裹|一方)+$')


def norm_name(s):
    s = s.translate(TR)
    s = re.sub(r'\s+', '', s)
    s = CLEAN_RE.sub('', s)
    s = re.sub(r'^各', '', s)
    return s.strip()


def resolve_herb(name, herb_names, by_name):
    cand = ALIAS.get(name, name)
    if cand in by_name:
        return by_name[cand]
    # 去掉修饰再试
    for strip in ('大者', '肥', '干', '生', '鲜', '炙', '炮'):
        if name.startswith(strip):
            c2 = name[len(strip):]
            c2 = ALIAS.get(c2, c2)
            if c2 in by_name:
                return by_name[c2]
    return None


def parse_comp(text, by_name):
    out = []
    for tok in re.split(r'[．。]', text):
        tok = tok.strip()
        if not tok or len(tok) < 2:
            continue
        doses = list(DOSE_RE.finditer(tok))
        if doses:
            m = doses[0]
            name = tok[:m.start()]
            dose = tok[m.start():]
        else:
            name, dose = tok, ''
        name = norm_name(name)
        if not name or len(name) < 1:
            continue
        hid = resolve_herb(name, None, by_name)
        if hid and all(x['h'] != hid for x in out):
            out.append({'h': hid, 'd': dose, 'r': '', 'n': ''})
    return out


def art_text(t):
    """原文句读：．→，；末尾补。"""
    t = t.replace('．', '，').replace('。', '，')
    t = re.sub(r'，+', '，', t).strip('，')
    return t + '。' if t else ''


def main():
    seed = json.load(open(SEED, encoding='utf-8'))
    parsed = json.load(open(PARSED, encoding='utf-8'))
    herbs = seed['herbs']
    by_name = {h['name']: h['id'] for h in herbs}

    old_forms = [f for f in seed['formulas'] if f.get('book') == 'shanghan']
    other_forms = [f for f in seed['formulas'] if f.get('book') != 'shanghan']
    old_by_name = {}
    for f in old_forms:
        old_by_name.setdefault(norm_name(f['name']), f)

    # 收集所有解析方剂，按规范化方名去重，优先六经篇 / 条文最全
    LJ_PRIORITY = {'太阳病': 0, '阳明病': 1, '少阳病': 2, '太阴病': 3,
                   '少阴病': 4, '厥阴病': 5, '霍乱病': 6, '差后劳复': 7}
    best = {}
    for c in parsed['chapters']:
        for f in c['formulas']:
            key = FNAME_ALIAS.get(f['name'], f['name'])
            key = norm_name(key)
            cand = {
                'name': f['name'], 'lj': c['lj'], 'chapter': c['title'],
                'art': f['article'], 'comp_raw': f['comp'], 'usage': f['usage'],
            }
            cur = best.get(key)
            if cur is None:
                best[key] = cand
            else:
                # 六经篇优先；同优先级取组成更长的
                pc = LJ_PRIORITY.get(cur['lj'], 99)
                pn = LJ_PRIORITY.get(cand['lj'], 99)
                if pn < pc or (pn == pc and len(cand['comp_raw']) > len(cur['comp_raw'])):
                    best[key] = cand

    used_ids = {f['id'] for f in seed['formulas']}
    new_forms = []
    matched_old = 0
    seq = 0
    unmatched_herbs = set()
    for key, d in best.items():
        comp = parse_comp(d['comp_raw'], by_name)
        # 记录未匹配药名（诊断）
        for tok in re.split(r'[．。]', d['comp_raw']):
            tok = tok.strip()
            if not tok or len(tok) < 2:
                continue
            doses = list(DOSE_RE.finditer(tok))
            nm = norm_name(tok[:doses[0].start()] if doses else tok)
            if nm and not resolve_herb(nm, None, by_name):
                unmatched_herbs.add(nm)

        old = old_by_name.get(key)
        if old:
            matched_old += 1
            rec = dict(old)  # 继承全部注解
            rec['art'] = art_text(d['art']) if d['art'] else old.get('art', '')
            rec['use'] = art_text(d['usage']) if d['usage'] else old.get('use', '')
            if comp:
                rec['comp'] = comp
            rec['lj'] = old.get('lj') or d['lj']
            rec['src'] = '《伤寒论》'
        else:
            seq += 1
            fid = 'sh%03d' % seq
            while fid in used_ids:
                seq += 1
                fid = 'sh%03d' % seq
            used_ids.add(fid)
            rec = {
                'id': fid, 'name': d['name'], 'py': '', 'src': '《伤寒论》',
                'book': 'shanghan', 'lj': d['lj'], 'cat': '', 'sub': '',
                'art': art_text(d['art']), 'eff': '', 'ind': '', 'indDetail': '',
                'syn': '', 'use': art_text(d['usage']), 'cau': '', 'ana': '',
                'feat': '', 'apply': '', 'song': '', 'attach': '',
                'rel': [], 'fjx': 0, 'fjxCat': '', 'fjxSub': '', 'comp': comp,
            }
        rec['chapter'] = d['chapter']
        new_forms.append(rec)

    # 统计
    print('解析唯一方剂: %d' % len(best))
    print('匹配旧库(继承注解): %d' % matched_old)
    print('新增方剂: %d' % (len(new_forms) - matched_old))
    print('组方药材未匹配(%d): %s' % (len(unmatched_herbs), ' '.join(sorted(unmatched_herbs))))

    # 更新 shanghan meta
    sh = seed['shanghan']
    lj_count = {}
    for f in new_forms:
        lj_count[f['lj']] = lj_count.get(f['lj'], 0) + 1
    old_lj = {x['key']: x for x in sh.get('liujing', [])}
    new_lj = []
    order = ['太阳病', '阳明病', '少阳病', '太阴病', '少阴病', '厥阴病', '霍乱病', '差后劳复', '汗吐下', '脉法', '伤寒例', '痓湿暍', '其他']
    for k in order:
        if k in lj_count:
            info = old_lj.get(k, {})
            new_lj.append({
                'key': k, 'outline': info.get('outline', ''), 'note': info.get('note', ''),
                'n': lj_count[k],
            })
    sh['liujing'] = new_lj
    sh['volume'] = '十卷 · 二十二篇 · %d 条 · %d 方' % (
        sum(len(c['articles']) for c in parsed['chapters']), len(new_forms))
    sh['stats'] = {'formula': len(new_forms), 'article': sum(len(c['articles']) for c in parsed['chapters'])}
    # 22 篇目录（供前端/检索）
    sh['chapters'] = [{
        'no': c['no'], 'title': c['title'], 'lj': c['lj'],
        'articles': len(c['articles']), 'formulas': len(c['formulas']),
    } for c in parsed['chapters']]

    seed['formulas'] = other_forms + new_forms
    seed['meta']['formulaCount'] = len(seed['formulas'])
    seed['meta']['shanghanCount'] = len(new_forms)

    json.dump(seed, open(SEED, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('\n已写回 %s：方剂总数 %d（伤寒论 %d）' % (SEED, len(seed['formulas']), len(new_forms)))


if __name__ == '__main__':
    main()
