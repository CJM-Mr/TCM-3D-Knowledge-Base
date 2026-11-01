/* ========== 客户端数据仓库：轻量索引常驻 + 详情按需缓存 ========== */

export const store = {
  meta: null,
  herbs: [],            // 轻量索引
  formulas: [],         // 方剂概要（含组成药味）
  herbMap: new Map(),
  formulaMap: new Map(),
  formulaByName: new Map(),
  herbFull: new Map(),  // id -> 完整中药
  formulaFull: new Map(),
  herbFormulas: new Map(),

  shanghan: null,       // /api/book/shanghan 结果
  liujing: new Map(),
  fangjixue: null,
  fxChapter: new Map(),

  counts: { herbs: 0, formulas: 0, shanghan: 0, fangjixue: 0 },

  setMeta(m) {
    this.meta = m;
    this.counts = m.counts;
  },

  setIndex(d) {
    this.herbs = d.herbs;
    this.formulas = d.formulas;
    this.herbMap = new Map(d.herbs.map((h) => [h.id, h]));
    this.formulaMap = new Map(d.formulas.map((f) => [f.id, f]));
    this.formulaByName = new Map(d.formulas.map((f) => [f.name, f.id]));
  },

  herb(id) { return this.herbMap.get(id); },
  formula(id) { return this.formulaMap.get(id); },
  formulaIdByName(name) { return this.formulaByName.get(name) || ''; },
  herbName(id) { const h = this.herbMap.get(id); return h ? h.name : id; },

  setHerbDetail(id, data) {
    if (data.herb && data.indExplain) data.herb.indExplain = data.indExplain;
    this.herbFull.set(id, data.herb);
    this.herbFormulas.set(id, data.formulas || []);
  },
  herbDetail(id) { return this.herbFull.get(id); },
  formulasOfHerb(id) { return this.herbFormulas.get(id) || []; },

  setFormulaFull(f) { this.formulaFull.set(f.id, f); },
  formulaDetail(id) { return this.formulaFull.get(id); },

  /* 统计辅助 */
  herbsByCat(cat) { return this.herbs.filter((h) => h.cat === cat); },
  herbsByMer(m) { return this.herbs.filter((h) => h.mer.indexOf(m) >= 0); },
  herbsByTag(t) { return this.herbs.filter((h) => (h.tags || []).indexOf(t) >= 0); },
  /* 功效：先按标签找，找不到再按「功效」字段找（与后端 graph 的兜底一致） */
  herbsByEffect(k) {
    const a = this.herbsByTag(k);
    if (a.length) return a;
    return this.herbs.filter((h) => (h.eff || []).indexOf(k) >= 0);
  },
  formulasByCat(cat) { return this.formulas.filter((f) => f.cat === cat); },
  shanghanFormulas() { return this.formulas.filter((f) => f.book === 'shanghan'); },
  fjxFormulas() { return this.formulas.filter((f) => f.fjx); }
};
