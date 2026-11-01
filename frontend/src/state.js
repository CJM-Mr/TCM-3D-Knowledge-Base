import { load } from './ui.js';

export const state = {
  view: { mode: 'overview' },
  detail: null,
  tab: { herb: 'ov', formula: 'ov' },
  trail: [],
  fav: load('tcm.fav', []),
  hist: load('tcm.hist', []),
  combo: [],
  compare: [],
  openGroups: { nav: true, book: true, fjx: false, cat: true, eff: false, mer: false, fcat: false, mine: true },
  detailW: load('tcm.detailW', 0)
};

export const isFav = (key) => state.fav.some((x) => x.key === key);
export const inCompare = (id) => state.compare.includes(id);
