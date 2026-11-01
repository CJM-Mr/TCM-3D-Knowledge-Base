/**
 * 从原静态项目的 JS 数据文件导出统一 JSON（seed.json）
 * 复刻 app.js 中的合并逻辑：伤寒论覆盖 / 方剂学补空 + 组成更完整则替换 / 君臣佐使归纳
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const RAW = path.join(ROOT, 'data', 'raw');

const ctx = { console };
vm.createContext(ctx);
[
  'herbs-a.js', 'herbs-b.js', 'herbs-c.js', 'herbs-d.js',
  'formulas.js', 'formulas-b.js', 'formula-ind.js',
  'shanghan.js', 'fangjixue.js'
].forEach((f) => {
  vm.runInContext(fs.readFileSync(path.join(RAW, f), 'utf8'), ctx, { filename: f });
});

const HERBS = vm.runInContext('HERBS', ctx);
const FORMULAS = vm.runInContext('FORMULAS', ctx);
const FORMULA_IND = vm.runInContext('typeof FORMULA_IND !== "undefined" ? FORMULA_IND : {}', ctx);
const SHANGHAN = vm.runInContext('SHANGHAN', ctx);
const SHANGHAN_FORMULAS = vm.runInContext('SHANGHAN_FORMULAS', ctx);
const FANGJIXUE = vm.runInContext('FANGJIXUE', ctx);
const FANGJIXUE_FORMULAS = vm.runInContext('FANGJIXUE_FORMULAS', ctx);

const HERB = new Map(HERBS.map((h) => [h.id, h]));
const name2id = new Map(HERBS.map((h) => [h.name, h.id]));

/* ---- 1. 伤寒论：同名覆盖 ---- */
(function mergeShanghan() {
  const byName = new Map(FORMULAS.map((f) => [f.name, f]));
  SHANGHAN_FORMULAS.forEach((sf) => {
    const comp = sf.comp
      .map((row) => ({ h: name2id.get(row[0]), d: row[1], r: row[2], n: row[3] }))
      .filter((c) => c.h && HERB.has(c.h));
    const data = {
      name: sf.name, py: sf.py, src: '《伤寒论》', book: 'shanghan', lj: sf.lj,
      cat: sf.cat, sub: sf.sub, art: sf.art, eff: sf.eff, ind: sf.ind,
      indDetail: sf.indDetail, use: sf.use, cau: sf.cau, ana: sf.ana, comp: comp
    };
    const old = byName.get(sf.name);
    if (old) Object.assign(old, data);
    else {
      const o = Object.assign({ id: sf.id }, data);
      FORMULAS.push(o);
      byName.set(o.name, o);
    }
  });
})();

/* ---- 2. 方剂学：补空 / 组成更完整则替换 ---- */
function inferRoles(ana, rows) {
  if (!ana) return;
  String(ana).split(/[。；]/).forEach((seg) => {
    const m = seg.match(/(君|臣|佐|使)药/);
    if (!m) return;
    rows.forEach((r) => {
      if (r[2] || !r[0]) return;
      if (seg.indexOf(r[0]) >= 0) r[2] = m[1];
    });
  });
}

(function mergeFangjixue() {
  const byName = new Map(FORMULAS.map((f) => [f.name, f]));
  FANGJIXUE_FORMULAS.forEach((sf) => {
    inferRoles(sf.ana, sf.comp);
    const comp = sf.comp
      .map((row) => ({ h: name2id.get(row[0]), d: row[1], r: row[2], n: row[3] }))
      .filter((c) => c.h && HERB.has(c.h));
    const mark = {
      fjx: 1, fjxCat: sf.cat, fjxSub: sf.sub,
      song: sf.song || '', feat: sf.feat || '', attach: sf.attach || '', apply: sf.apply || ''
    };
    const old = byName.get(sf.name);
    if (old) {
      Object.assign(old, mark);
      if (!old.eff) old.eff = sf.eff;
      if (!old.ind) old.ind = sf.ind;
      if (!old.indDetail) old.indDetail = sf.indDetail;
      if (!old.use) old.use = sf.use;
      if (!old.cau) old.cau = sf.cau;
      if (!old.ana) old.ana = sf.ana;
      if (!old.book && comp.length > old.comp.length) {
        const roleOf = new Map(old.comp.map((c) => [c.h, c.r]));
        old.comp = comp.map((c) => ({ h: c.h, d: c.d, r: c.r || roleOf.get(c.h) || '', n: c.n }));
      } else if (!old.comp || !old.comp.length) {
        old.comp = comp;
      }
    } else {
      const o = Object.assign({}, sf, mark, { id: sf.id, comp: comp });
      FORMULAS.push(o);
      byName.set(o.name, o);
    }
  });
})();

/* ---- 3. 主治详述补全（伤寒论方不覆盖） ---- */
FORMULAS.forEach((f) => {
  if (!f.book && FORMULA_IND[f.id]) f.indDetail = FORMULA_IND[f.id];
  if (!f.indDetail) f.indDetail = f.ind || '';
});

/* ---- 4. 输出 ---- */
const herbs = HERBS.map((h) => ({
  id: h.id, name: h.name, py: h.py || '', alias: h.alias || '',
  src: h.src || '', part: h.part || '', cat: h.cat || '', sub: h.sub || '',
  nat: h.nat || '', fla: h.fla || [], mer: h.mer || [],
  eff: h.eff || [], tags: h.tags || [], ind: h.ind || '', clin: h.clin || '',
  combo: h.combo || [], dose: h.dose || '', proc: h.proc || '',
  cau: h.cau || '', pharm: h.pharm || [], ref: h.ref || ''
}));

const formulas = FORMULAS.map((f) => ({
  id: f.id, name: f.name, py: f.py || '', src: f.src || '',
  book: f.book || '', lj: f.lj || '', cat: f.cat || '', sub: f.sub || '',
  art: f.art || '', eff: f.eff || '', ind: f.ind || '', indDetail: f.indDetail || '',
  syn: f.syn || '', use: f.use || '', cau: f.cau || '', ana: f.ana || '',
  feat: f.feat || '', apply: f.apply || '', song: f.song || '', attach: f.attach || '',
  rel: f.rel || [], fjx: f.fjx ? 1 : 0, fjxCat: f.fjxCat || '', fjxSub: f.fjxSub || '',
  comp: f.comp.filter((c) => HERB.has(c.h)).map((c) => ({ h: c.h, d: c.d || '', r: c.r || '', n: c.n || '' }))
}));

const seed = {
  meta: {
    generatedAt: new Date().toISOString(),
    herbCount: herbs.length,
    formulaCount: formulas.length,
    shanghanCount: formulas.filter((f) => f.book === 'shanghan').length,
    fangjixueCount: formulas.filter((f) => f.fjx).length
  },
  herbs: herbs,
  formulas: formulas,
  shanghan: SHANGHAN,
  fangjixue: FANGJIXUE
};

const out = path.join(ROOT, 'data', 'seed.json');
fs.writeFileSync(out, JSON.stringify(seed, null, 1), 'utf8');
console.log('seed.json ->', out);
console.log(JSON.stringify(seed.meta, null, 1));
console.log('size:', (fs.statSync(out).size / 1024 / 1024).toFixed(2), 'MB');
