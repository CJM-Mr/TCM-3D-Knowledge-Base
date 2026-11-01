/* ============================================================
 * 本草维度 · 三维球状知识关系渲染引擎
 * 纯 Canvas 2D + 三维投影，无外部依赖，可直接 file:// 运行
 * 功能：球面布局、旋转/缩放/惯性、节点拾取、深度排序、
 *       发光节点、标签避让、聚焦布局、平滑过渡
 * ============================================================ */

  const TAU = Math.PI * 2;
  const FIB_ANGLE = 2.399963229728653; // 黄金角

  const TYPE_STYLE = {
    herb:     { color: '#4fa8ff', rgb: '79,168,255',  size: 3.9 },
    formula:  { color: '#f0b64a', rgb: '240,182,74',  size: 5.0 },
    effect:   { color: '#3fd6a4', rgb: '63,214,164',  size: 6.4 },
    meridian: { color: '#a98bfa', rgb: '169,139,250', size: 6.4 },
    category: { color: '#63c9e8', rgb: '99,201,232',  size: 6.4 },
    combo:    { color: '#ff8080', rgb: '255,128,128', size: 7.0 }
  };

  const FONT = "'PingFang SC','Microsoft YaHei','Hiragino Sans GB','Noto Sans SC',sans-serif";

  function fibPoint(i, n, radius, phase) {
    const y = 1 - ((i + 0.5) * 2) / n;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const th = i * FIB_ANGLE + (phase || 0);
    return { x: Math.cos(th) * r * radius, y: y * radius, z: Math.sin(th) * r * radius };
  }

  class SphereGraph {
    constructor(canvas, opts) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.opts = opts || {};
      this.onSelect = this.opts.onSelect || function () {};
      this.onHover = this.opts.onHover || function () {};
      this.onBackground = this.opts.onBackground || function () {};
      this.onExpand = this.opts.onExpand || function () {};

      this.nodes = [];
      this.links = [];
      this.store = new Map();      // id -> 持久节点状态（用于过渡）
      this.selectedId = null;
      this.hoverId = null;
      this.showLabels = true;

      this.yaw = 0.4;
      this.pitch = -0.22;
      this.vYaw = 0;
      this.vPitch = 0;
      this.zoom = 1;
      this.zoomTarget = 1;

      this.dragging = false;
      this.moved = false;
      this.pointer = { x: 0, y: 0 };
      this.lastInteract = 0;
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.w = 0;
      this.h = 0;

      this._raf = null;
      this._last = performance.now();
      this._bind();
      this.resize();
      this._loop = this._loop.bind(this);
      this._raf = requestAnimationFrame(this._loop);
    }

    /* ---------------- 事件 ---------------- */
    _bind() {
      const c = this.canvas;
      this._onDown = (e) => {
        if (e.button !== undefined && e.button !== 0 && e.pointerType === 'mouse') return;
        c.setPointerCapture && c.setPointerCapture(e.pointerId);
        this.dragging = true;
        this.moved = false;
        this.lastInteract = performance.now();
        this.pointer.x = e.clientX;
        this.pointer.y = e.clientY;
        this._start = { x: e.clientX, y: e.clientY };
        this._multi = false;
      };
      this._onMove = (e) => {
        if (this.dragging) {
          const dx = e.clientX - this.pointer.x;
          const dy = e.clientY - this.pointer.y;
          if (Math.abs(e.clientX - this._start.x) + Math.abs(e.clientY - this._start.y) > 5) this.moved = true;
          this.yaw += dx * 0.0062;
          this.pitch += dy * 0.0052;
          this.pitch = Math.max(-1.32, Math.min(1.32, this.pitch));
          this.vYaw = dx * 0.0062 * 12;
          this.vPitch = dy * 0.0052 * 12;
          this.pointer.x = e.clientX;
          this.pointer.y = e.clientY;
          this.lastInteract = performance.now();
        } else {
          this._hoverAt(e.clientX, e.clientY);
        }
      };
      this._onUp = (e) => {
        if (!this.dragging) return;
        this.dragging = false;
        this.lastInteract = performance.now();
        if (!this.moved) {
          const hit = this._pick(e.clientX, e.clientY);
          if (hit) this.onSelect(hit);
          else this.onBackground();
        }
        this.pointer.x = e.clientX;
        this.pointer.y = e.clientY;
      };
      this._onLeave = () => { this.hoverId = null; this.onHover(null); };
      this._onDbl = (e) => {
        const hit = this._pick(e.clientX, e.clientY);
        if (hit) this.onExpand(hit);
      };
      this._onWheel = (e) => {
        e.preventDefault();
        this.zoomTarget *= e.deltaY > 0 ? 0.9 : 1.1;
        this.zoomTarget = Math.max(0.45, Math.min(2.6, this.zoomTarget));
        this.lastInteract = performance.now();
      };

      c.addEventListener('pointerdown', this._onDown);
      window.addEventListener('pointermove', this._onMove);
      window.addEventListener('pointerup', this._onUp);
      c.addEventListener('pointerleave', this._onLeave);
      c.addEventListener('dblclick', this._onDbl);
      c.addEventListener('wheel', this._onWheel, { passive: false });

      // 触摸双指缩放
      this._touchStart = null;
      c.addEventListener('touchstart', (e) => {
        if (e.touches.length === 2) {
          this._touchStart = { d: this._dist(e.touches), z: this.zoomTarget };
        }
      }, { passive: true });
      c.addEventListener('touchmove', (e) => {
        if (e.touches.length === 2 && this._touchStart) {
          e.preventDefault();
          const d = this._dist(e.touches);
          this.zoomTarget = Math.max(0.45, Math.min(2.6, this._touchStart.z * (d / this._touchStart.d)));
        }
      }, { passive: false });
      c.addEventListener('touchend', () => { this._touchStart = null; }, { passive: true });

      this._onResize = () => this.resize();
      window.addEventListener('resize', this._onResize);
    }

    _dist(t) {
      const dx = t[0].clientX - t[1].clientX;
      const dy = t[0].clientY - t[1].clientY;
      return Math.hypot(dx, dy) || 1;
    }

    /* ---------------- 尺寸 ---------------- */
    resize() {
      const rect = this.canvas.getBoundingClientRect();
      this.w = Math.max(1, rect.width);
      this.h = Math.max(1, rect.height);
      this.canvas.width = Math.round(this.w * this.dpr);
      this.canvas.height = Math.round(this.h * this.dpr);
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      this.R = Math.min(this.w, this.h) * 0.335;
    }

    /* ---------------- 场景 ---------------- */
    /**
     * scene = { mode:'sphere'|'focus', nodes:[{id,type,label,level,weight}], links:[{a,b,kind}] }
     */
    setScene(scene, animate) {
      const prevIds = new Set(this.nodes.map((n) => n.id));
      const layout = scene.mode === 'focus' ? 'focus' : 'sphere';

      // 分组
      const lv0 = [], lv1 = [], lv2 = [];
      scene.nodes.forEach((n) => {
        if (n.level === 0) lv0.push(n);
        else if (n.level === 2) lv2.push(n);
        else lv1.push(n);
      });

      const targets = new Map();

      if (layout === 'sphere') {
        const all = scene.nodes;
        all.forEach((n, i) => {
          targets.set(n.id, fibPoint(i, all.length, 1, 0));
        });
      } else {
        // 中心节点置于原点
        lv0.forEach((n) => targets.set(n.id, { x: 0, y: 0, z: 0 }));
        // 一级邻居：内层球壳
        const r1 = lv1.length > 14 ? 0.56 : 0.48;
        lv1.forEach((n, i) => {
          const p = fibPoint(i, lv1.length, r1, 0.9);
          targets.set(n.id, p);
        });
        // 二级邻居：外层球壳，错开相位避免重叠
        lv2.forEach((n, i) => {
          const p = fibPoint(i, lv2.length, 1.0, 2.1);
          targets.set(n.id, p);
        });
      }

      const newNodes = scene.nodes.map((n) => {
        const t = targets.get(n.id) || { x: 0, y: 0, z: 0 };
        let st = this.store.get(n.id);
        if (!st) {
          // 新节点从中心飞出
          st = { cur: { x: 0, y: 0, z: 0 } };
          this.store.set(n.id, st);
        }
        return Object.assign({}, n, {
          pos: t,
          cur: st.cur,
          sx: 0, sy: 0, k: 1, rr: 4, alpha: 1
        });
      });

      // 清理已离场节点
      const keep = new Set(newNodes.map((n) => n.id));
      for (const key of Array.from(this.store.keys())) {
        if (!keep.has(key)) this.store.delete(key);
      }

      this.nodes = newNodes;
      this.links = (scene.links || []).filter(
        (l) => keep.has(l.a) && keep.has(l.b)
      );
      this.layout = layout;

      if (layout === 'sphere') {
        // 全景轻微复位
        if (animate === 'reset') { this.pitch = -0.22; }
      }
    }

    select(id) { this.selectedId = id; }

    setLabels(v) { this.showLabels = v; }

    zoomBy(f) {
      this.zoomTarget = Math.max(0.45, Math.min(2.6, this.zoomTarget * f));
    }

    resetView() {
      this.zoomTarget = 1;
      this.pitch = -0.22;
      this.vYaw = 0;
      this.vPitch = 0;
    }

    /* ---------------- 数学 ---------------- */
    _rot(p) {
      const cy = Math.cos(this.yaw), sy = Math.sin(this.yaw);
      const cp = Math.cos(this.pitch), sp = Math.sin(this.pitch);
      const x1 = p.x * cy - p.z * sy;
      const z1 = p.x * sy + p.z * cy;
      const y2 = p.y * cp - z1 * sp;
      const z2 = p.y * sp + z1 * cp;
      return { x: x1, y: y2, z: z2 };
    }

    _project(p) {
      const r = this._rot(p);
      const k = 1 / (1 + r.z * 0.46);
      const R = this.R * this.zoom;
      return {
        x: this.w / 2 + r.x * R * k,
        y: this.h / 2 - r.y * R * k,
        k: k,
        z: r.z
      };
    }

    _pick(cx, cy) {
      const rect = this.canvas.getBoundingClientRect();
      const px = cx - rect.left;
      const py = cy - rect.top;
      let best = null;
      let bestK = -1;
      for (const n of this.nodes) {
        const d = Math.hypot(n.sx - px, n.sy - py);
        if (d <= Math.max(n.rr + 7, 11) && n.k > bestK) {
          bestK = n.k;
          best = n;
        }
      }
      return best;
    }

    _hoverAt(cx, cy) {
      const hit = this._pick(cx, cy);
      const id = hit ? hit.id : null;
      if (id !== this.hoverId) {
        this.hoverId = id;
        this.canvas.style.cursor = hit ? 'pointer' : 'grab';
        this.onHover(hit);
      }
    }

    /* ---------------- 主循环 ---------------- */
    _loop(now) {
      this._raf = requestAnimationFrame(this._loop);
      const dt = Math.min(0.05, (now - this._last) / 1000);
      this._last = now;
      if (!this.w) this.resize();

      // 旋转与惯性
      if (!this.dragging) {
        this.yaw += this.vYaw * dt;
        this.pitch += this.vPitch * dt;
        this.pitch = Math.max(-1.32, Math.min(1.32, this.pitch));
        const damp = Math.pow(0.06, dt);
        this.vYaw *= damp;
        this.vPitch *= damp;
        if (now - this.lastInteract > 2200 && !this.hoverId) {
          this.yaw += dt * (this.layout === 'focus' ? 0.045 : 0.075);
        }
      }
      this.zoom += (this.zoomTarget - this.zoom) * Math.min(1, dt * 8);

      // 位置插值
      const lerp = Math.min(1, dt * 6.5);
      for (const n of this.nodes) {
        n.cur.x += (n.pos.x - n.cur.x) * lerp;
        n.cur.y += (n.pos.y - n.cur.y) * lerp;
        n.cur.z += (n.pos.z - n.cur.z) * lerp;
      }

      this._draw(now);
    }

    /* ---------------- 绘制 ---------------- */
    _draw(now) {
      const ctx = this.ctx;
      ctx.clearRect(0, 0, this.w, this.h);
      const cx = this.w / 2, cy = this.h / 2;

      // 球体经纬线
      this._drawSphereWire(ctx, cx, cy);

      // 投影节点
      const proj = [];
      for (const n of this.nodes) {
        const p = this._project(n.cur);
        n.sx = p.x; n.sy = p.y; n.k = p.k;
        const base = (TYPE_STYLE[n.type] || TYPE_STYLE.herb).size;
        const levelMul = n.level === 0 ? 2.15 : n.level === 2 ? 0.78 : 1;
        const selMul = n.id === this.selectedId ? 1.35 : 1;
        n.rr = base * levelMul * selMul * Math.pow(p.k, 0.75);
        n.alpha = Math.max(0.18, Math.min(1, (p.k - 0.6) * 1.55));
        proj.push(n);
      }

      // 连线
      const nodeMap = new Map(proj.map((n) => [n.id, n]));
      ctx.lineCap = 'round';
      for (const l of this.links) {
        const a = nodeMap.get(l.a), b = nodeMap.get(l.b);
        if (!a || !b) continue;
        const dim = (a.id === this.selectedId || b.id === this.selectedId ||
          a.id === this.hoverId || b.id === this.hoverId);
        const kAvg = (a.k + b.k) / 2;
        let alpha = dim ? 0.42 : 0.085 + Math.max(0, kAvg - 0.75) * 0.16;
        const st = TYPE_STYLE[a.type === 'herb' ? 'herb' : a.type] || TYPE_STYLE.herb;
        ctx.strokeStyle = dim
          ? 'rgba(226,206,158,' + Math.min(0.5, alpha) + ')'
          : 'rgba(150,178,214,' + alpha + ')';
        ctx.lineWidth = dim ? 1.15 : 0.8;
        const mx = (a.sx + b.sx) / 2, my = (a.sy + b.sy) / 2;
        // 向球心内收，形成弧线
        const ctrlX = mx + (cx - mx) * 0.14;
        const ctrlY = my + (cy - my) * 0.14;
        ctx.beginPath();
        ctx.moveTo(a.sx, a.sy);
        ctx.quadraticCurveTo(ctrlX, ctrlY, b.sx, b.sy);
        ctx.stroke();
      }

      // 节点按深度排序，远的先画
      proj.sort((p, q) => p.k - q.k);

      // 标签避让
      const boxes = [];
      const canPlace = (x, y, w, h) => {
        for (const b of boxes) {
          if (x < b.x + b.w && x + w > b.x && y < b.y + b.h && y + h > b.y) return false;
        }
        return true;
      };

      const pulse = (Math.sin(now / 620) + 1) / 2;

      for (const n of proj) {
        const style = TYPE_STYLE[n.type] || TYPE_STYLE.herb;
        const isHub = n.level === 0;
        const isSel = n.id === this.selectedId;
        const isHov = n.id === this.hoverId;
        const rr = n.rr;

        // 光晕
        const glowR = rr * (isHub ? 5.2 : 3.4) * (1 + (isSel || isHov ? 0.18 : 0));
        const g = ctx.createRadialGradient(n.sx, n.sy, rr * 0.35, n.sx, n.sy, glowR);
        g.addColorStop(0, 'rgba(' + style.rgb + ',' + (0.34 * n.alpha) + ')');
        g.addColorStop(0.45, 'rgba(' + style.rgb + ',' + (0.11 * n.alpha) + ')');
        g.addColorStop(1, 'rgba(' + style.rgb + ',0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(n.sx, n.sy, glowR, 0, TAU);
        ctx.fill();

        // 选中脉冲环
        if (isHub || isSel) {
          const pr = rr + 5 + pulse * (isHub ? 9 : 5);
          ctx.strokeStyle = 'rgba(' + style.rgb + ',' + (0.5 * (1 - pulse * 0.7) * n.alpha) + ')';
          ctx.lineWidth = 1.1;
          ctx.beginPath();
          ctx.arc(n.sx, n.sy, pr, 0, TAU);
          ctx.stroke();
        }

        // 核心
        const core = ctx.createRadialGradient(
          n.sx - rr * 0.3, n.sy - rr * 0.35, rr * 0.1,
          n.sx, n.sy, rr
        );
        core.addColorStop(0, 'rgba(255,255,255,' + (0.95 * n.alpha) + ')');
        core.addColorStop(0.42, 'rgba(' + style.rgb + ',' + n.alpha + ')');
        core.addColorStop(1, 'rgba(' + style.rgb + ',' + (0.72 * n.alpha) + ')');
        ctx.fillStyle = core;
        ctx.beginPath();
        ctx.arc(n.sx, n.sy, rr, 0, TAU);
        ctx.fill();

        // 高亮描边
        if (isHub || isSel || isHov) {
          ctx.strokeStyle = 'rgba(255,255,255,' + (0.75 * n.alpha) + ')';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(n.sx, n.sy, rr + 1.2, 0, TAU);
          ctx.stroke();
        }

        // 标签
        const wantLabel =
          isHub || isSel || isHov ||
          (this.showLabels && n.k > 1.06 && rr > 2.4);
        if (!wantLabel) continue;

        const fs = isHub ? 13.5 : isHov ? 12.5 : 11;
        ctx.font = (isHub ? '600 ' : '400 ') + fs + 'px ' + FONT;
        const text = n.label;
        const tw = ctx.measureText(text).width;
        const lx = n.sx + rr + 7;
        const ly = n.sy + fs * 0.36;
        const pad = 3;
        if (!canPlace(lx - pad, n.sy - fs * 0.72, tw + pad * 2, fs * 1.45)) {
          if (!(isHub || isHov || isSel)) continue;
        }
        boxes.push({ x: lx - pad, y: n.sy - fs * 0.72, w: tw + pad * 2, h: fs * 1.45 });

        const labelAlpha = isHub ? 0.98 : isHov || isSel ? 0.95 : Math.min(0.85, n.alpha * 0.95);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(7,11,17,' + (0.85 * labelAlpha) + ')';
        ctx.strokeText(text, lx, ly);
        ctx.fillStyle = isHub
          ? 'rgba(255,255,255,' + labelAlpha + ')'
          : 'rgba(' + style.rgb + ',' + labelAlpha + ')';
        ctx.fillText(text, lx, ly);
      }
    }

    _drawSphereWire(ctx, cx, cy) {
      const R = this.R * this.zoom;
      ctx.save();
      ctx.lineWidth = 0.7;

      const drawRing = (pts, alpha) => {
        ctx.strokeStyle = 'rgba(120,158,200,' + alpha + ')';
        ctx.beginPath();
        for (let i = 0; i <= pts.length; i++) {
          const p = this._project(pts[i % pts.length]);
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
      };

      // 纬线
      [-0.72, -0.38, 0, 0.38, 0.72].forEach((y) => {
        const r = Math.sqrt(Math.max(0, 1 - y * y));
        const pts = [];
        for (let i = 0; i < 60; i++) {
          const t = (i / 60) * TAU;
          pts.push({ x: Math.cos(t) * r, y: y, z: Math.sin(t) * r });
        }
        drawRing(pts, y === 0 ? 0.055 : 0.035);
      });

      // 经线
      for (let m = 0; m < 6; m++) {
        const phi = (m / 6) * Math.PI;
        const pts = [];
        for (let i = 0; i < 48; i++) {
          const t = (i / 48) * Math.PI;
          pts.push({
            x: Math.sin(t) * Math.cos(phi),
            y: Math.cos(t),
            z: Math.sin(t) * Math.sin(phi)
          });
        }
        drawRing(pts, 0.032);
      }

      // 外缘光晕
      const g = ctx.createRadialGradient(cx, cy, R * 0.55, cx, cy, R * 1.28);
      g.addColorStop(0, 'rgba(72,120,180,0)');
      g.addColorStop(0.72, 'rgba(72,120,180,0.028)');
      g.addColorStop(1, 'rgba(72,120,180,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.28, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    destroy() {
      cancelAnimationFrame(this._raf);
      window.removeEventListener('pointermove', this._onMove);
      window.removeEventListener('pointerup', this._onUp);
      window.removeEventListener('resize', this._onResize);
    }
  }

export { SphereGraph };
