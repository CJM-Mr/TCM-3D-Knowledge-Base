# -*- coding: utf-8 -*-
"""
由 data/seed.json 构建 SQLite 数据库 data/tcm.db
"""
import json
import os
import sqlite3

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SEED = os.path.join(ROOT, 'data', 'seed.json')

# 数据库输出到项目 data/ 下（与 backend/app.py 的查找顺序一致）
DB = os.environ.get('TCM_DB') or os.path.join(ROOT, 'data', 'tcm.db')

SCHEMA = """
PRAGMA foreign_keys = ON;

DROP TABLE IF EXISTS formula_herb;
DROP TABLE IF EXISTS formula;
DROP TABLE IF EXISTS herb;
DROP TABLE IF EXISTS chapter;
DROP TABLE IF EXISTS book_meta;

CREATE TABLE herb (
  id      TEXT PRIMARY KEY,
  name    TEXT NOT NULL,
  py      TEXT DEFAULT '',
  alias   TEXT DEFAULT '',
  src     TEXT DEFAULT '',
  part    TEXT DEFAULT '',
  cat     TEXT DEFAULT '',
  sub     TEXT DEFAULT '',
  nat     TEXT DEFAULT '',
  fla     TEXT DEFAULT '[]',
  mer     TEXT DEFAULT '[]',
  eff     TEXT DEFAULT '[]',
  tags    TEXT DEFAULT '[]',
  ind     TEXT DEFAULT '',
  clin    TEXT DEFAULT '',
  combo   TEXT DEFAULT '[]',
  dose    TEXT DEFAULT '',
  proc    TEXT DEFAULT '',
  cau     TEXT DEFAULT '',
  pharm   TEXT DEFAULT '[]',
  ref     TEXT DEFAULT ''
);
CREATE INDEX idx_herb_name ON herb(name);
CREATE INDEX idx_herb_cat  ON herb(cat);

CREATE TABLE formula (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  py          TEXT DEFAULT '',
  src         TEXT DEFAULT '',
  book        TEXT DEFAULT '',
  lj          TEXT DEFAULT '',
  cat         TEXT DEFAULT '',
  sub         TEXT DEFAULT '',
  art         TEXT DEFAULT '',
  eff         TEXT DEFAULT '',
  ind         TEXT DEFAULT '',
  ind_detail  TEXT DEFAULT '',
  syn         TEXT DEFAULT '',
  usage       TEXT DEFAULT '',
  cau         TEXT DEFAULT '',
  ana         TEXT DEFAULT '',
  feat        TEXT DEFAULT '',
  application TEXT DEFAULT '',
  song        TEXT DEFAULT '',
  attach      TEXT DEFAULT '',
  rel         TEXT DEFAULT '[]',
  fjx         INTEGER DEFAULT 0,
  fjx_cat     TEXT DEFAULT '',
  fjx_sub     TEXT DEFAULT ''
);
CREATE INDEX idx_formula_name ON formula(name);
CREATE INDEX idx_formula_book ON formula(book);
CREATE INDEX idx_formula_cat  ON formula(cat);
CREATE INDEX idx_formula_fjx  ON formula(fjx, fjx_cat);

CREATE TABLE formula_herb (
  formula_id TEXT NOT NULL,
  herb_id    TEXT NOT NULL,
  dose       TEXT DEFAULT '',
  role       TEXT DEFAULT '',
  note       TEXT DEFAULT '',
  ord        INTEGER DEFAULT 0,
  PRIMARY KEY (formula_id, herb_id)
);
CREATE INDEX idx_fh_herb ON formula_herb(herb_id);

CREATE TABLE chapter (
  book     TEXT NOT NULL,
  name     TEXT NOT NULL,
  ord      INTEGER DEFAULT 0,
  sections TEXT DEFAULT '[]',
  count    INTEGER DEFAULT 0,
  PRIMARY KEY (book, name)
);

CREATE TABLE book_meta (
  id   TEXT PRIMARY KEY,
  data TEXT NOT NULL
);
"""


def j(v):
    return json.dumps(v, ensure_ascii=False)


def main():
    seed = json.load(open(SEED, encoding='utf-8'))
    os.makedirs(os.path.dirname(DB), exist_ok=True)
    if os.path.exists(DB):
        os.remove(DB)
    con = sqlite3.connect(DB)
    con.executescript(SCHEMA)

    con.executemany(
        """INSERT INTO herb (id,name,py,alias,src,part,cat,sub,nat,fla,mer,eff,tags,ind,clin,combo,dose,proc,cau,pharm,ref)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
        [(h['id'], h['name'], h['py'], h['alias'], h['src'], h['part'], h['cat'], h['sub'],
          h['nat'], j(h['fla']), j(h['mer']), j(h['eff']), j(h['tags']), h['ind'], h['clin'],
          j(h['combo']), h['dose'], h['proc'], h['cau'], j(h['pharm']), h['ref'])
         for h in seed['herbs']]
    )

    con.executemany(
        """INSERT INTO formula (id,name,py,src,book,lj,cat,sub,art,eff,ind,ind_detail,syn,
              usage,cau,ana,feat,application,song,attach,rel,fjx,fjx_cat,fjx_sub)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
        [(f['id'], f['name'], f['py'], f['src'], f['book'], f['lj'], f['cat'], f['sub'],
          f['art'], f['eff'], f['ind'], f['indDetail'], f['syn'], f['use'], f['cau'],
          f['ana'], f['feat'], f['apply'], f['song'], f['attach'], j(f['rel']),
          f['fjx'], f['fjxCat'], f['fjxSub'])
         for f in seed['formulas']]
    )

    rows = []
    for f in seed['formulas']:
        for i, c in enumerate(f['comp']):
            rows.append((f['id'], c['h'], c['d'], c.get('r', ''), c.get('n', ''), i))
    con.executemany(
        'INSERT OR REPLACE INTO formula_herb (formula_id,herb_id,dose,role,note,ord) VALUES (?,?,?,?,?,?)',
        rows
    )

    fjx = seed['fangjixue']
    con.executemany(
        'INSERT INTO chapter (book,name,ord,sections,count) VALUES (?,?,?,?,?)',
        [('fangjixue', c['name'], i, j(c.get('sections', [])), c.get('count', 0))
         for i, c in enumerate(fjx.get('chapters', []))]
    )
    con.executemany(
        'INSERT INTO chapter (book,name,ord,sections,count) VALUES (?,?,?,?,?)',
        [('shanghan', l['key'], i, j([l.get('outline', ''), l.get('note', '')]), 0)
         for i, l in enumerate(seed['shanghan'].get('liujing', []))]
    )

    con.executemany('INSERT INTO book_meta (id,data) VALUES (?,?)', [
        ('shanghan', j(seed['shanghan'])),
        ('fangjixue', j(fjx)),
    ])

    con.commit()
    cur = con.cursor()
    stat = {t: cur.execute('SELECT COUNT(*) FROM ' + t).fetchone()[0]
            for t in ('herb', 'formula', 'formula_herb', 'chapter')}
    con.close()

    print('db ->', DB, '(%.2f MB)' % (os.path.getsize(DB) / 1024 / 1024))
    print(stat)


if __name__ == '__main__':
    main()
