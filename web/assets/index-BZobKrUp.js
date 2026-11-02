(function(){const s=document.createElement("link").relList;if(s&&s.supports&&s.supports("modulepreload"))return;for(const c of document.querySelectorAll('link[rel="modulepreload"]'))e(c);new MutationObserver(c=>{for(const o of c)if(o.type==="childList")for(const h of o.addedNodes)h.tagName==="LINK"&&h.rel==="modulepreload"&&e(h)}).observe(document,{childList:!0,subtree:!0});function a(c){const o={};return c.integrity&&(o.integrity=c.integrity),c.referrerPolicy&&(o.referrerPolicy=c.referrerPolicy),c.crossOrigin==="use-credentials"?o.credentials="include":c.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function e(c){if(c.ep)return;c.ep=!0;const o=a(c);fetch(c.href,o)}})();const P=Math.PI*2,Ht=2.399963229728653,R={herb:{color:"#4fa8ff",rgb:"79,168,255",size:3.9},formula:{color:"#f0b64a",rgb:"240,182,74",size:5},effect:{color:"#3fd6a4",rgb:"63,214,164",size:6.4},meridian:{color:"#a98bfa",rgb:"169,139,250",size:6.4},category:{color:"#63c9e8",rgb:"99,201,232",size:6.4},combo:{color:"#ff8080",rgb:"255,128,128",size:7}},Pt="'PingFang SC','Microsoft YaHei','Hiragino Sans GB','Noto Sans SC',sans-serif";function at(t,s,a,e){const c=1-(t+.5)*2/s,o=Math.sqrt(Math.max(0,1-c*c)),h=t*Ht+(e||0);return{x:Math.cos(h)*o*a,y:c*a,z:Math.sin(h)*o*a}}class Rt{constructor(s,a){this.canvas=s,this.ctx=s.getContext("2d"),this.opts=a||{},this.onSelect=this.opts.onSelect||function(){},this.onHover=this.opts.onHover||function(){},this.onBackground=this.opts.onBackground||function(){},this.onExpand=this.opts.onExpand||function(){},this.nodes=[],this.links=[],this.store=new Map,this.selectedId=null,this.hoverId=null,this.showLabels=!0,this.yaw=.4,this.pitch=-.22,this.vYaw=0,this.vPitch=0,this.zoom=1,this.zoomTarget=1,this.dragging=!1,this.moved=!1,this.pointer={x:0,y:0},this.lastInteract=0,this.dpr=Math.min(window.devicePixelRatio||1,2),this.w=0,this.h=0,this._raf=null,this._last=performance.now(),this._bind(),this.resize(),this._loop=this._loop.bind(this),this._raf=requestAnimationFrame(this._loop)}_bind(){const s=this.canvas;this._onDown=a=>{a.button!==void 0&&a.button!==0&&a.pointerType==="mouse"||(s.setPointerCapture&&s.setPointerCapture(a.pointerId),this.dragging=!0,this.moved=!1,this.lastInteract=performance.now(),this.pointer.x=a.clientX,this.pointer.y=a.clientY,this._start={x:a.clientX,y:a.clientY},this._multi=!1)},this._onMove=a=>{if(this.dragging){const e=a.clientX-this.pointer.x,c=a.clientY-this.pointer.y;Math.abs(a.clientX-this._start.x)+Math.abs(a.clientY-this._start.y)>5&&(this.moved=!0),this.yaw+=e*.0062,this.pitch+=c*.0052,this.pitch=Math.max(-1.32,Math.min(1.32,this.pitch)),this.vYaw=e*.0062*12,this.vPitch=c*.0052*12,this.pointer.x=a.clientX,this.pointer.y=a.clientY,this.lastInteract=performance.now()}else this._hoverAt(a.clientX,a.clientY)},this._onUp=a=>{if(this.dragging){if(this.dragging=!1,this.lastInteract=performance.now(),!this.moved){const e=this._pick(a.clientX,a.clientY);e?this.onSelect(e):this.onBackground()}this.pointer.x=a.clientX,this.pointer.y=a.clientY}},this._onLeave=()=>{this.hoverId=null,this.onHover(null)},this._onDbl=a=>{const e=this._pick(a.clientX,a.clientY);e&&this.onExpand(e)},this._onWheel=a=>{a.preventDefault(),this.zoomTarget*=a.deltaY>0?.9:1.1,this.zoomTarget=Math.max(.45,Math.min(2.6,this.zoomTarget)),this.lastInteract=performance.now()},s.addEventListener("pointerdown",this._onDown),window.addEventListener("pointermove",this._onMove),window.addEventListener("pointerup",this._onUp),s.addEventListener("pointerleave",this._onLeave),s.addEventListener("dblclick",this._onDbl),s.addEventListener("wheel",this._onWheel,{passive:!1}),this._touchStart=null,s.addEventListener("touchstart",a=>{a.touches.length===2&&(this._touchStart={d:this._dist(a.touches),z:this.zoomTarget})},{passive:!0}),s.addEventListener("touchmove",a=>{if(a.touches.length===2&&this._touchStart){a.preventDefault();const e=this._dist(a.touches);this.zoomTarget=Math.max(.45,Math.min(2.6,this._touchStart.z*(e/this._touchStart.d)))}},{passive:!1}),s.addEventListener("touchend",()=>{this._touchStart=null},{passive:!0}),this._onResize=()=>this.resize(),window.addEventListener("resize",this._onResize)}_dist(s){const a=s[0].clientX-s[1].clientX,e=s[0].clientY-s[1].clientY;return Math.hypot(a,e)||1}resize(){const s=this.canvas.getBoundingClientRect();this.w=Math.max(1,s.width),this.h=Math.max(1,s.height),this.canvas.width=Math.round(this.w*this.dpr),this.canvas.height=Math.round(this.h*this.dpr),this.ctx.setTransform(this.dpr,0,0,this.dpr,0,0),this.R=Math.min(this.w,this.h)*.335}setScene(s,a){new Set(this.nodes.map(n=>n.id));const e=s.mode==="focus"?"focus":"sphere",c=[],o=[],h=[];s.nodes.forEach(n=>{n.level===0?c.push(n):n.level===2?h.push(n):o.push(n)});const p=new Map;if(e==="sphere"){const n=s.nodes;n.forEach((u,f)=>{p.set(u.id,at(f,n.length,1,0))})}else{c.forEach(u=>p.set(u.id,{x:0,y:0,z:0}));const n=o.length>14?.56:.48;o.forEach((u,f)=>{const g=at(f,o.length,n,.9);p.set(u.id,g)}),h.forEach((u,f)=>{const g=at(f,h.length,1,2.1);p.set(u.id,g)})}const b=s.nodes.map(n=>{const u=p.get(n.id)||{x:0,y:0,z:0};let f=this.store.get(n.id);return f||(f={cur:{x:0,y:0,z:0}},this.store.set(n.id,f)),Object.assign({},n,{pos:u,cur:f.cur,sx:0,sy:0,k:1,rr:4,alpha:1})}),l=new Set(b.map(n=>n.id));for(const n of Array.from(this.store.keys()))l.has(n)||this.store.delete(n);this.nodes=b,this.links=(s.links||[]).filter(n=>l.has(n.a)&&l.has(n.b)),this.layout=e,e==="sphere"&&a==="reset"&&(this.pitch=-.22)}select(s){this.selectedId=s}setLabels(s){this.showLabels=s}zoomBy(s){this.zoomTarget=Math.max(.45,Math.min(2.6,this.zoomTarget*s))}resetView(){this.zoomTarget=1,this.pitch=-.22,this.vYaw=0,this.vPitch=0}_rot(s){const a=Math.cos(this.yaw),e=Math.sin(this.yaw),c=Math.cos(this.pitch),o=Math.sin(this.pitch),h=s.x*a-s.z*e,p=s.x*e+s.z*a,b=s.y*c-p*o,l=s.y*o+p*c;return{x:h,y:b,z:l}}_project(s){const a=this._rot(s),e=1/(1+a.z*.46),c=this.R*this.zoom;return{x:this.w/2+a.x*c*e,y:this.h/2-a.y*c*e,k:e,z:a.z}}_pick(s,a){const e=this.canvas.getBoundingClientRect(),c=s-e.left,o=a-e.top;let h=null,p=-1;for(const b of this.nodes)Math.hypot(b.sx-c,b.sy-o)<=Math.max(b.rr+7,11)&&b.k>p&&(p=b.k,h=b);return h}_hoverAt(s,a){const e=this._pick(s,a),c=e?e.id:null;c!==this.hoverId&&(this.hoverId=c,this.canvas.style.cursor=e?"pointer":"grab",this.onHover(e))}_loop(s){this._raf=requestAnimationFrame(this._loop);const a=Math.min(.05,(s-this._last)/1e3);if(this._last=s,this.w||this.resize(),!this.dragging){this.yaw+=this.vYaw*a,this.pitch+=this.vPitch*a,this.pitch=Math.max(-1.32,Math.min(1.32,this.pitch));const c=Math.pow(.06,a);this.vYaw*=c,this.vPitch*=c,s-this.lastInteract>2200&&!this.hoverId&&(this.yaw+=a*(this.layout==="focus"?.045:.075))}this.zoom+=(this.zoomTarget-this.zoom)*Math.min(1,a*8);const e=Math.min(1,a*6.5);for(const c of this.nodes)c.cur.x+=(c.pos.x-c.cur.x)*e,c.cur.y+=(c.pos.y-c.cur.y)*e,c.cur.z+=(c.pos.z-c.cur.z)*e;this._draw(s)}_draw(s){const a=this.ctx;a.clearRect(0,0,this.w,this.h);const e=this.w/2,c=this.h/2;this._drawSphereWire(a,e,c);const o=[];for(const n of this.nodes){const u=this._project(n.cur);n.sx=u.x,n.sy=u.y,n.k=u.k;const f=(R[n.type]||R.herb).size,g=n.level===0?2.15:n.level===2?.78:1,v=n.id===this.selectedId?1.35:1;n.rr=f*g*v*Math.pow(u.k,.75),n.alpha=Math.max(.18,Math.min(1,(u.k-.6)*1.55)),o.push(n)}const h=new Map(o.map(n=>[n.id,n]));a.lineCap="round";for(const n of this.links){const u=h.get(n.a),f=h.get(n.b);if(!u||!f)continue;const g=u.id===this.selectedId||f.id===this.selectedId||u.id===this.hoverId||f.id===this.hoverId,v=(u.k+f.k)/2;let m=g?.42:.085+Math.max(0,v-.75)*.16;R[u.type==="herb"?"herb":u.type]||R.herb,a.strokeStyle=g?"rgba(226,206,158,"+Math.min(.5,m)+")":"rgba(150,178,214,"+m+")",a.lineWidth=g?1.15:.8;const L=(u.sx+f.sx)/2,x=(u.sy+f.sy)/2,_=L+(e-L)*.14,N=x+(c-x)*.14;a.beginPath(),a.moveTo(u.sx,u.sy),a.quadraticCurveTo(_,N,f.sx,f.sy),a.stroke()}o.sort((n,u)=>n.k-u.k);const p=[],b=(n,u,f,g)=>{for(const v of p)if(n<v.x+v.w&&n+f>v.x&&u<v.y+v.h&&u+g>v.y)return!1;return!0},l=(Math.sin(s/620)+1)/2;for(const n of o){const u=R[n.type]||R.herb,f=n.level===0,g=n.id===this.selectedId,v=n.id===this.hoverId,m=n.rr,L=m*(f?5.2:3.4)*(1+(g||v?.18:0)),x=a.createRadialGradient(n.sx,n.sy,m*.35,n.sx,n.sy,L);if(x.addColorStop(0,"rgba("+u.rgb+","+.34*n.alpha+")"),x.addColorStop(.45,"rgba("+u.rgb+","+.11*n.alpha+")"),x.addColorStop(1,"rgba("+u.rgb+",0)"),a.fillStyle=x,a.beginPath(),a.arc(n.sx,n.sy,L,0,P),a.fill(),f||g){const Ft=m+5+l*(f?9:5);a.strokeStyle="rgba("+u.rgb+","+.5*(1-l*.7)*n.alpha+")",a.lineWidth=1.1,a.beginPath(),a.arc(n.sx,n.sy,Ft,0,P),a.stroke()}const _=a.createRadialGradient(n.sx-m*.3,n.sy-m*.35,m*.1,n.sx,n.sy,m);if(_.addColorStop(0,"rgba(255,255,255,"+.95*n.alpha+")"),_.addColorStop(.42,"rgba("+u.rgb+","+n.alpha+")"),_.addColorStop(1,"rgba("+u.rgb+","+.72*n.alpha+")"),a.fillStyle=_,a.beginPath(),a.arc(n.sx,n.sy,m,0,P),a.fill(),(f||g||v)&&(a.strokeStyle="rgba(255,255,255,"+.75*n.alpha+")",a.lineWidth=1.2,a.beginPath(),a.arc(n.sx,n.sy,m+1.2,0,P),a.stroke()),!(f||g||v||this.showLabels&&n.k>1.06&&m>2.4))continue;const B=f?13.5:v?12.5:11;a.font=(f?"600 ":"400 ")+B+"px "+Pt;const k=n.label,I=a.measureText(k).width,H=n.sx+m+7,pt=n.sy+B*.36,X=3;if(!b(H-X,n.sy-B*.72,I+X*2,B*1.45)&&!(f||v||g))continue;p.push({x:H-X,y:n.sy-B*.72,w:I+X*2,h:B*1.45});const et=f?.98:v||g?.95:Math.min(.85,n.alpha*.95);a.textAlign="left",a.textBaseline="middle",a.lineWidth=3,a.strokeStyle="rgba(7,11,17,"+.85*et+")",a.strokeText(k,H,pt),a.fillStyle=f?"rgba(255,255,255,"+et+")":"rgba("+u.rgb+","+et+")",a.fillText(k,H,pt)}}_drawSphereWire(s,a,e){const c=this.R*this.zoom;s.save(),s.lineWidth=.7;const o=(p,b)=>{s.strokeStyle="rgba(120,158,200,"+b+")",s.beginPath();for(let l=0;l<=p.length;l++){const n=this._project(p[l%p.length]);l===0?s.moveTo(n.x,n.y):s.lineTo(n.x,n.y)}s.stroke()};[-.72,-.38,0,.38,.72].forEach(p=>{const b=Math.sqrt(Math.max(0,1-p*p)),l=[];for(let n=0;n<60;n++){const u=n/60*P;l.push({x:Math.cos(u)*b,y:p,z:Math.sin(u)*b})}o(l,p===0?.055:.035)});for(let p=0;p<6;p++){const b=p/6*Math.PI,l=[];for(let n=0;n<48;n++){const u=n/48*Math.PI;l.push({x:Math.sin(u)*Math.cos(b),y:Math.cos(u),z:Math.sin(u)*Math.sin(b)})}o(l,.032)}const h=s.createRadialGradient(a,e,c*.55,a,e,c*1.28);h.addColorStop(0,"rgba(72,120,180,0)"),h.addColorStop(.72,"rgba(72,120,180,0.028)"),h.addColorStop(1,"rgba(72,120,180,0)"),s.fillStyle=h,s.beginPath(),s.arc(a,e,c*1.28,0,P),s.fill(),s.restore()}destroy(){cancelAnimationFrame(this._raf),window.removeEventListener("pointermove",this._onMove),window.removeEventListener("pointerup",this._onUp),window.removeEventListener("resize",this._onResize)}}const Dt="";async function S(t,s){let a=Dt+t;if(s){const c=new URLSearchParams;Object.keys(s).forEach(h=>{const p=s[h];p!=null&&p!==""&&c.append(h,p)});const o=c.toString();o&&(a+=(a.indexOf("?")>=0?"&":"?")+o)}const e=await fetch(a,{headers:{Accept:"application/json"}});if(!e.ok)throw new Error("API "+e.status+" "+a);return e.json()}const w={meta:()=>S("/api/meta"),index:()=>S("/api/index"),herb:t=>S("/api/herbs/"+encodeURIComponent(t)),formula:t=>S("/api/formulas/"+encodeURIComponent(t)),formulaRelated:t=>S("/api/formulas/"+encodeURIComponent(t)+"/related"),graph:t=>{const s={mode:t.mode};return t.id&&(s.id=t.id),t.key&&(s.key=t.key),t.ids&&t.ids.length&&(s.ids=t.ids.join(",")),t.deep&&(s.deep="1"),S("/api/graph",s)},search:t=>S("/api/search",{q:t}),compare:t=>S("/api/compare",{ids:(t||[]).join(",")}),bookShanghan:()=>S("/api/book/shanghan"),bookLiujing:t=>S("/api/book/shanghan/"+encodeURIComponent(t)),bookFangjixue:()=>S("/api/book/fangjixue"),bookFjxChapter:t=>S("/api/book/fangjixue/"+encodeURIComponent(t)),docs:()=>S("/api/docs")},d={meta:null,herbs:[],formulas:[],herbMap:new Map,formulaMap:new Map,formulaByName:new Map,herbFull:new Map,formulaFull:new Map,herbFormulas:new Map,shanghan:null,liujing:new Map,fangjixue:null,fxChapter:new Map,counts:{herbs:0,formulas:0,shanghan:0,fangjixue:0},setMeta(t){this.meta=t,this.counts=t.counts},setIndex(t){this.herbs=t.herbs,this.formulas=t.formulas,this.herbMap=new Map(t.herbs.map(s=>[s.id,s])),this.formulaMap=new Map(t.formulas.map(s=>[s.id,s])),this.formulaByName=new Map(t.formulas.map(s=>[s.name,s.id]))},herb(t){return this.herbMap.get(t)},formula(t){return this.formulaMap.get(t)},formulaIdByName(t){return this.formulaByName.get(t)||""},herbName(t){const s=this.herbMap.get(t);return s?s.name:t},setHerbDetail(t,s){s.herb&&s.indExplain&&(s.herb.indExplain=s.indExplain),this.herbFull.set(t,s.herb),this.herbFormulas.set(t,s.formulas||[])},herbDetail(t){return this.herbFull.get(t)},formulasOfHerb(t){return this.herbFormulas.get(t)||[]},setFormulaFull(t){this.formulaFull.set(t.id,t)},formulaDetail(t){return this.formulaFull.get(t)},herbsByCat(t){return this.herbs.filter(s=>s.cat===t)},herbsByMer(t){return this.herbs.filter(s=>s.mer.indexOf(t)>=0)},herbsByTag(t){return this.herbs.filter(s=>(s.tags||[]).indexOf(t)>=0)},herbsByEffect(t){const s=this.herbsByTag(t);return s.length?s:this.herbs.filter(a=>(a.eff||[]).indexOf(t)>=0)},formulasByCat(t){return this.formulas.filter(s=>s.cat===t)},shanghanFormulas(){return this.formulas.filter(t=>t.book==="shanghan")},fjxFormulas(){return this.formulas.filter(t=>t.fjx)}},j=(t,s)=>(s||document).querySelector(t),Ot=(t,s)=>Array.prototype.slice.call(document.querySelectorAll(t)),i=t=>String(t==null?"":t).replace(/[&<>"']/g,s=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[s]),it=(t,s)=>{try{return JSON.parse(localStorage.getItem(t))||s}catch{return s}},lt=(t,s)=>{try{localStorage.setItem(t,JSON.stringify(s))}catch{}},G=t=>String(t==null?"":t).replace(/[\r\n]+/g,"").replace(/\s{2,}/g," ").trim();function qt(t){return t?String(t).split(/\n+/).map(s=>s.trim()).filter(Boolean).map(s=>`<span class="song-line">${i(s)}</span>`).join(""):""}function Wt(t){return t?G(t).split(/(?=\d{1,2}\.(?![\d]))/).map(a=>a.trim()).filter(Boolean).map(a=>{const e=a.match(/^(\d{1,2})\.\s*(.*)$/),c=e?e[2]:a,o=c.match(/^([^\s（(《]{2,12})/),h=o?o[1]:"";let p=o?c.slice(h.length):c,b="";const l=p.match(/^\s*[（(]\s*(《[^》]+》[^）)]*)[）)]/);return l&&(b=l[1],p=p.slice(l[0].length)),`<div class="attach-item">
      ${h?`<div class="attach-name">${i(h)}${b?`<span>${i(b)}</span>`:""}</div>`:""}
      <p class="attach-body">${i(p.trim())}</p>
    </div>`}).join(""):""}const nt=(t,s)=>(t||[]).map(a=>`<span class="chip ${s||""}">${i(a)}</span>`).join(""),At=t=>t>1048576?(t/1048576).toFixed(1)+" MB":Math.max(1,Math.round(t/1024))+" KB",r={view:{mode:"overview"},detail:null,tab:{herb:"ov",formula:"ov"},trail:[],fav:it("tcm.fav",[]),hist:it("tcm.hist",[]),combo:[],compare:[],openGroups:{nav:!0,book:!0,fjx:!1,cat:!0,eff:!1,mer:!1,fcat:!1,mine:!0},detailW:it("tcm.detailW",0)},rt=t=>r.fav.some(s=>s.key===t),K=t=>r.compare.includes(t);function dt(){return`<div class="empty">
    <div class="empty-seal">醫</div>
    <h2>开始探索</h2>
    <p>点击三维球体中的节点，或使用上方搜索框。<br>蓝色为中药，金色为方剂。</p>
    <div class="quick">
      <button data-herb="gancao">甘草</button>
      <button data-herb="huangqi">黄芪</button>
      <button data-formula="sijunzitang">四君子汤</button>
      <button data-formula="liuweidihuang">六味地黄丸</button>
    </div>
  </div>`}function ft(t){return`<div class="empty"><div class="boot-seal small">醫</div><h2>载入中</h2><p>${i(t||"")}</p></div>`}function ht(t){return`<div class="hrow" data-herb="${t.id}">
    <div class="hrow-l"><b>${i(t.name)}</b><span>${i(t.nat)} · ${i((t.fla||[]).join(""))}</span></div>
    <div class="hrow-r">${(t.mer||[]).map(s=>s+"经").join(" ")}</div>
  </div>`}function tt(t,s){if(!t)return"";const a=t.comp||[];return`<div class="fcard" data-formula="${t.id}">
    <div class="fcard-h"><span class="fname">${i(t.name)}</span><span class="fsrc">${i(t.src||"")}</span><button class="fcard-cmp ${K(t.id)?"on":""}" data-cmp="${t.id}" title="加入对比">${K(t.id)?"✓":"＋"}</button></div>
    <div class="fcard-eff">${i(t.eff||"")}</div>
    <div class="fcard-comp">${a.map(e=>{const c=d.herb(e.h);return`<span class="cc ${e.h===s?"hl":""}">${c?i(c.name):e.h}</span>`}).join("")}</div>
    ${s&&a.find(e=>e.h===s)?`<div class="fcard-note"><b>${i(d.herbName(s))}</b> 在方中：${i(a.find(e=>e.h===s).n||a.find(e=>e.h===s).r||"")}</div>`:""}
  </div>`}function Nt(t){if(!t)return dt();const s=r.tab.herb,a=d.formulasOfHerb(t.id),e="h:"+t.id,c=rt(e),o=[["ov","概览"],["eff","功效主治"],["ph","现代药理"],["f","相关方剂 "+a.length]].map(([p,b])=>`<button class="tab ${s===p?"on":""}" data-tab="herb:${p}">${b}</button>`).join("");let h="";if(s==="ov")h=`
      <section>
        <h3>基本信息</h3>
        <dl class="kv">
          <dt>别名</dt><dd>${i(t.alias||"—")}</dd>
          <dt>药材来源</dt><dd>${i(t.src)}</dd>
          <dt>药用部位</dt><dd>${i(t.part)}</dd>
          <dt>药物类别</dt><dd>${i(t.cat)}${t.sub?" · "+i(t.sub):""}</dd>
          <dt>用法用量</dt><dd>${i(t.dose)}</dd>
          <dt>炮制规格</dt><dd>${i(t.proc)}</dd>
        </dl>
      </section>
      <section>
        <h3>性味归经</h3>
        <div class="kv-inline">
          <span class="lbl">四气</span><span class="chip nat">${i(t.nat)}</span>
          <span class="lbl">五味</span>${nt(t.fla,"fla")}
        </div>
        <div class="kv-inline">
          <span class="lbl">归经</span>
          ${(t.mer||[]).map(p=>`<button class="chip mer link" data-mer="${p}">${p}经</button>`).join("")}
        </div>
      </section>
      <section>
        <h3>使用注意</h3>
        <p class="warn">${i(t.cau)}</p>
      </section>
      <section>
        <h3>资料来源</h3>
        <p class="src">${i(t.ref)}</p>
      </section>`;else if(s==="eff"){const p=t.indExplain||{mechanism:"",items:[]},b=p.items||[],l=b.some(n=>n.clin);h=`
      <section>
        <h3>主要功效</h3>
        <div class="chips">${nt(t.eff,"eff")}</div>
      </section>
      <section>
        <h3>主治病证</h3>
        <blockquote class="ind-quote">${i(t.ind)}</blockquote>
      </section>
      ${p.mechanism?`<section>
        <h3>证治机理<span class="sec-sub">性味归经推导</span></h3>
        <p class="ind-detail">${i(p.mechanism)}</p>
      </section>`:""}
      ${b.length?`<section>
        <h3>逐证解析<span class="sec-sub">${b.length} 项</span></h3>
        <div class="ind-list">
          ${b.map(n=>{const u=n.formula?d.formulaIdByName(n.formula):"",f=n.formula?u?`<button class="ii-fx" data-formula="${u}">${i(n.formula)}</button>`:`<span class="ii-fx plain">${i(n.formula)}</span>`:"";return`<div class="ind-item">
              <div class="ii-head">
                <span class="ii-name">${i(n.name)}</span>
                ${n.eff?`<span class="ii-eff">${i(n.eff)}</span>`:""}
              </div>
              ${n.clin?`<div class="ii-body">${i(n.clin)}${f}</div>`:n.why?`<div class="ii-body muted">${i(n.why)}</div>`:""}
            </div>`}).join("")}
        </div>
      </section>`:""}
      ${!l&&t.clin?`<section>
        <h3>临床应用</h3>
        <p>${i(t.clin)}</p>
      </section>`:""}
      <section>
        <h3>常用配伍</h3>
        <ul class="combo-list">
          ${(t.combo||[]).map(([n,u])=>{const f=d.herbs.find(g=>g.name===n);return`<li>
              <div class="cl-h">${f?`<button class="lnk" data-herb="${f.id}">${i(n)}</button>`:i(n)}</div>
              <div class="cl-t">${i(u)}</div>
            </li>`}).join("")||'<li class="muted">暂无</li>'}
        </ul>
      </section>`}else s==="ph"?h=`
      <section>
        <h3>现代药理研究</h3>
        <ul class="pharm">${(t.pharm||[]).map(p=>`<li>${i(p)}</li>`).join("")}</ul>
      </section>
      <div class="note">
        <strong>表述说明</strong>
        以上为现代药理学实验研究结果的归纳，多来自体外实验或动物实验，不等同于临床疗效。传统功效与本项内容分列展示，请勿混同。
      </div>
      <section>
        <h3>资料来源</h3>
        <p class="src">${i(t.ref)}</p>
      </section>`:h=a.length?`
      <div class="hint-line">共 <b>${a.length}</b> 首方剂含有「${i(t.name)}」，点击可进入方剂详情</div>
      ${a.map(p=>tt(p,t.id)).join("")}`:'<div class="side-empty">暂无含该药的方剂</div>';return`
    <div class="d-head">
      <div class="d-kind herb">中药</div>
      <h2>${i(t.name)}</h2>
      <div class="d-py">${i(t.py)}</div>
      <div class="d-tags">
        <span class="chip nat">${i(t.nat)}</span>
        ${nt(t.fla,"fla")}
        ${(t.mer||[]).map(p=>`<span class="chip mer">${p}经</span>`).join("")}
      </div>
      <div class="d-actions">
        <button class="btn-fav ${c?"on":""}" data-fav="${e}" data-favname="${i(t.name)}">${c?"★ 已收藏":"☆ 收藏"}</button>
        <button class="btn-ghost" data-focus="${e}">球体定位</button>
      </div>
    </div>
    <div class="tabs">${o}</div>
    <div class="tab-body">${h}</div>`}function Yt(t,s){if(!t)return dt();const a=r.tab.formula,e="f:"+t.id,c=rt(e),o=t.comp||[],h=o.some(l=>(l.r||"").trim()),p=[["ov","概览"],["ind","主治"],["comp","组成 "+o.length],["ana",h?"君臣佐使":"配伍分析"],["rel","相关方剂"]].map(([l,n])=>`<button class="tab ${a===l?"on":""}" data-tab="formula:${l}">${n}</button>`).join("");let b="";if(a==="ov")b=`
      <section>
        <h3>方剂基本信息</h3>
        <dl class="kv">
          <dt>出处</dt><dd>${i(t.src)}</dd>
          <dt>分类</dt><dd>${i(t.cat)}${t.sub?" · "+i(t.sub):""}</dd>
          <dt>功效</dt><dd class="strong">${i(t.eff)}</dd>
          <dt>主治</dt><dd>${i(t.ind)}</dd>
          ${t.syn?`<dt>适用证候</dt><dd>${i(t.syn)}</dd>`:""}
          <dt>用法</dt><dd>${i(t.use)}</dd>
        </dl>
      </section>
      ${t.art?`<section class="art-sec">
        <h3>原文条文<span class="sec-sub">《伤寒论》</span></h3>
        <blockquote class="classic-quote">${i(t.art)}</blockquote>
      </section>`:""}
      ${t.nhx?`<section class="nhx-sec">
        <h3>倪海厦解读<span class="sec-sub">《人纪·伤寒论》</span></h3>
        <p class="nhx-txt">${i(t.nhx)}</p>
      </section>`:""}
      <section>
        <h3>主治详述</h3>
        <p class="ind-detail">${i(t.indDetail||t.ind)}</p>
      </section>
      ${t.feat?`<section>
        <h3>配伍特点<span class="sec-sub">教材</span></h3>
        <p class="feat-txt">${i(G(t.feat))}</p>
      </section>`:""}
      ${t.song?`<section class="song-sec">
        <h3>方歌</h3>
        <div class="song-quote">${qt(t.song)}</div>
      </section>`:""}
      ${t.apply?`<section>
        <h3>运用<span class="sec-sub">辨证要点</span></h3>
        <p class="apply-txt">${i(G(t.apply))}</p>
      </section>`:""}
      ${t.attach?`<section>
        <h3>附方</h3>
        <div class="attach-list">${Wt(t.attach)}</div>
      </section>`:""}
      <section>
        <h3>使用注意</h3>
        <p class="warn">${i(t.cau)}</p>
      </section>
      <section>
        <h3>组成药物</h3>
        <div class="chips">${o.map(l=>{const n=d.herb(l.h);return n?`<button class="chip herb link" data-herb="${n.id}">${i(n.name)}<i>${i(l.r)}</i></button>`:""}).join("")}</div>
      </section>`;else if(a==="ind"){const l=t.indExplain||{items:[],sentences:[],points:""},n=l.items||[],u=l.sentences||[];b=`
      <section>
        <h3>主治原文</h3>
        <blockquote class="ind-quote">${i(t.ind)}</blockquote>
      </section>
      ${t.syn?`<section>
        <h3>适用证候</h3>
        <p>${i(t.syn)}</p>
      </section>`:""}
      ${n.length?`<section>
        <h3>证候拆解<span class="sec-sub">${n.length} 项</span></h3>
        <div class="chips">${n.map(f=>`<span class="chip ind-chip">${i(f)}</span>`).join("")}</div>
      </section>`:""}
      ${u.length?`<section>
        <h3>病机与证候分析</h3>
        <div class="ind-para">${u.map(f=>`<p>${i(f)}</p>`).join("")}</div>
      </section>`:""}
      ${l.points?`<section>
        <h3>辨证要点<span class="sec-sub">教材</span></h3>
        <p class="apply-txt">${i(G(l.points))}</p>
      </section>`:""}
      ${t.cau?`<section>
        <h3>使用注意</h3>
        <p class="warn">${i(t.cau)}</p>
      </section>`:""}
      ${t.art?`<section class="art-sec">
        <h3>原文条文<span class="sec-sub">《伤寒论》</span></h3>
        <blockquote class="classic-quote">${i(t.art)}</blockquote>
      </section>`:""}`}else if(a==="comp")b=`
      <div class="hint-line">点击任意药物，查看其性味、归经、功效、药理与配伍禁忌</div>
      ${o.map(l=>{const n=d.herb(l.h);return n?`<div class="comp-item" data-herb="${n.id}">
          ${l.r?`<div class="ci-role role-${i(l.r)}">${i(l.r)}</div>`:""}
          <div class="ci-main">
            <div class="ci-name">${i(n.name)}<span class="ci-dose">${i(l.d)}</span></div>
            <div class="ci-eff">${i((n.eff||[]).join(" · "))}</div>
            <div class="ci-note">${i(l.n)}</div>
            <div class="ci-meta"><span>${i(n.nat)}</span>${(n.fla||[]).map(u=>`<span>${u}</span>`).join("")}${(n.mer||[]).map(u=>`<span>${u}经</span>`).join("")}</div>
          </div>
        </div>`:""}).join("")}`;else if(a==="ana"){const l=["君","臣","佐","使"],n={君:"针对主要病机，发挥主要治疗作用",臣:"辅助君药加强疗效，或针对兼证",佐:"辅助治疗、制约药性，或减轻毒副作用",使:"引经报使，或调和诸药"};b=`
      ${h?`
      <div class="jc-intro">${t.fjx?"君臣佐使据教材方解文字归纳标注，可结合下方「配伍分析」理解。":"君臣佐使属方剂配伍分析，依据教材标注，不按药物排列顺序自动判定。"}</div>
      ${l.map(f=>{const g=o.filter(v=>(v.r||"").indexOf(f)>=0);return g.length?`<section class="jc-block">
          <div class="jc-head"><span class="jc-badge role-${f}">${f}</span><span class="jc-desc">${n[f]}</span></div>
          ${g.map(v=>{const m=d.herb(v.h);return`<div class="jc-item" ${m?`data-herb="${m.id}"`:""}>
              <div class="jc-name">${i(m?m.name:v.h)}<span>${i(v.d)}</span></div>
              <div class="jc-note">${i(v.n)}</div>
            </div>`}).join("")}
        </section>`:""}).join("")}`:""}
      <section>
        <h3>配伍分析</h3>
        <p class="ana">${i(t.ana)}</p>
      </section>`}else s?b=`
        ${s.rels.length?`<section><h3>教材关联方剂</h3>
          <div class="rel-grid">${s.rels.map(l=>`<button class="rel-chip" data-formula="${l.id}">${i(l.name)}</button>`).join("")}</div>
        </section>`:""}
        <section>
          <h3>组成相近方剂</h3>
          ${s.shared.map(l=>`
            <div class="diff-card" data-formula="${l.id}">
              <div class="dc-h"><b>${i(l.name)}</b><span>共有 ${l.n} 味</span></div>
              <div class="dc-row"><span class="dc-lbl same">共有</span><span class="dc-v">${l.common.map(i).join("、")}</span></div>
              <div class="dc-row"><span class="dc-lbl add">本方独有</span><span class="dc-v">${l.onlyA.map(i).join("、")||"—"}</span></div>
              <div class="dc-row"><span class="dc-lbl del">对方独有</span><span class="dc-v">${l.onlyB.map(i).join("、")||"—"}</span></div>
            </div>`).join("")||'<div class="side-empty">暂无组成相近的方剂</div>'}
        </section>`:b='<div class="side-empty">正在分析组成相近方剂…</div>';return`
    <div class="d-head">
      <div class="d-kind formula">方剂</div>
      <h2>${i(t.name)}</h2>
      <div class="d-py">${t.py?i(t.py)+" · ":""}${i(t.src)}</div>
      <div class="d-tags">
        ${t.fjxCat?`<button class="chip cat link" data-fxch="${i(t.fjxCat)}">${i(t.cat)}</button>`:`<span class="chip cat">${i(t.cat)}</span>`}
        ${t.sub?`<span class="chip cat2">${i(t.sub)}</span>`:""}
        ${t.lj?`<button class="chip lj" data-lj="${i(t.lj)}">${i(t.lj)}</button>`:""}
        <span class="chip eff">${i(t.eff)}</span>
      </div>
      <div class="d-actions">
        <button class="btn-fav ${c?"on":""}" data-fav="${e}" data-favname="${i(t.name)}">${c?"★ 已收藏":"☆ 收藏"}</button>
        <button class="btn-cmp ${K(t.id)?"on":""}" data-cmp="${t.id}">${K(t.id)?"✓ 已加入对比":"＋ 加入对比"}</button>
        <button class="btn-ghost" data-focus="${e}">球体定位</button>
      </div>
    </div>
    <div class="tabs">${p}</div>
    <div class="tab-body">${b}</div>`}function Ut(t){const s=d.herbsByEffect(t);return`<div class="d-head">
    <div class="d-kind effect">功效</div>
    <h2>${i(t)}</h2>
    <div class="d-py">功效关联模式 · ${s.length} 味中药</div>
    <div class="d-tags"><span class="chip eff">${s.length} 味药</span></div>
  </div>
  <div class="tab-body">
    <div class="hint-line">三维球体中以「${i(t)}」为中心，展开具有该功效的中药及代表性方剂</div>
    ${s.length?s.map(ht).join(""):`<div class="side-empty">没有中药标注为「${i(t)}」，可换一个功效词试试。</div>`}
  </div>`}function Xt(t){const s=d.herbsByMer(t);return`<div class="d-head">
    <div class="d-kind meridian">归经</div>
    <h2>${i(t)}经</h2>
    <div class="d-py">归经关联模式 · ${s.length} 味中药</div>
    <div class="d-tags"><span class="chip mer">${s.length} 味药</span></div>
  </div>
  <div class="tab-body">
    <div class="hint-line">三维球体中以「${i(t)}经」为中心，展开归入该经的中药及其组成的方剂</div>
    ${s.map(ht).join("")}
  </div>`}function Gt(t){const s=d.herbsByCat(t);return`<div class="d-head">
    <div class="d-kind category">药物类别</div>
    <h2>${i(t)}</h2>
    <div class="d-py">${s.length} 味中药</div>
  </div>
  <div class="tab-body">${s.map(ht).join("")}</div>`}function Kt(t){const s=d.formulasByCat(t);return`<div class="d-head">
    <div class="d-kind category">方剂分类</div>
    <h2>${i(t)}</h2>
    <div class="d-py">${s.length} 首方剂</div>
  </div>
  <div class="tab-body">${s.map(a=>tt(a)).join("")}</div>`}function Vt(){const t=r.combo,s=t.length?d.formulas.filter(e=>t.every(c=>(e.comp||[]).some(o=>o.h===c))):[],a=d.herbs.slice().sort((e,c)=>(c.nf||0)-(e.nf||0));return`<div class="d-head">
    <div class="d-kind combo">配伍</div>
    <h2>药物配伍模式</h2>
    <div class="d-py">选择两味或多味中药，查看同时含有这些药物的方剂</div>
  </div>
  <div class="tab-body">
    <section>
      <h3>已选药物</h3>
      <div class="chips">
        ${t.map(e=>`<button class="chip herb on" data-uncombo="${e}">${i(d.herbName(e))}<i>×</i></button>`).join("")||'<span class="muted">尚未选择</span>'}
      </div>
      <div class="pick-grid mt">
        ${a.slice(0,60).map(e=>`<button class="pick ${t.includes(e.id)?"on":""}" data-combo="${e.id}">${i(e.name)}<i>${e.nf||0}</i></button>`).join("")}
      </div>
      ${t.length>=2?`<button class="btn-primary mt" data-act="runcombo">查看同时含 ${t.length} 味药的方剂（${s.length} 首）</button>`:""}
    </section>
    ${t.length>=2?`<section>
      <h3>配伍结果<span class="sec-sub">${s.length} 首</span></h3>
      ${s.map(e=>tt(e)).join("")||'<div class="side-empty">没有方剂同时含有这些药物</div>'}
    </section>`:""}
  </div>`}function Jt(t){let s="中药大全",a="";if(t==="herbs")a=(d.meta.categories||[]).map(c=>`
      <div class="browse-sec">
        <h3>${i(c.name)}<span>${c.n}</span></h3>
        <div class="pick-grid">${d.herbsByCat(c.name).map(o=>`<button class="pick" data-herb="${o.id}">${i(o.name)}</button>`).join("")}</div>
      </div>`).join("");else if(t==="formulas"){s="方剂";const e=(d.meta.fcats||[]).map(o=>`
      <div class="browse-sec">
        <h3>${i(o.name)}<span>${o.n}</span></h3>
        <div class="pick-grid">${d.formulasByCat(o.name).map(h=>`<button class="pick" data-formula="${h.id}">${i(h.name)}</button>`).join("")}</div>
      </div>`).join(""),c=(d.fangjixue&&d.fangjixue.chapters||[]).length?`<div class="browse-sec" style="margin-top:18px;border-top:1px solid rgba(255,255,255,0.06);padding-top:14px;">
        <h3>《方剂学》教材章节<span>${d.fangjixue.chapters.length}</span></h3>
        <div class="pick-grid">${d.fangjixue.chapters.map(o=>`<button class="pick" data-fxch="${i(o.name)}">${i(o.name)}<i>${o.formulas.length}</i></button>`).join("")}</div>
      </div>`:"";a=e+c}else t==="classic"?(s="经典方剂",a=`<div class="browse-sec"><div class="pick-grid">${d.formulas.filter(e=>(e.n||0)>=6).map(e=>`<button class="pick" data-formula="${e.id}">${i(e.name)}</button>`).join("")}</div></div>`):t==="shanghan"?(s="《伤寒论》经方目录",a=(d.shanghan&&d.shanghan.blocks||[]).map(e=>e.formulas.length?`<div class="browse-sec">
        <h3><button class="lj-inline" data-lj="${i(e.key)}">${i(e.key)}</button><span>${e.formulas.length}</span></h3>
        <div class="pick-grid">${e.formulas.map(c=>`<button class="pick" data-formula="${c.id}">${i(c.name)}</button>`).join("")}</div>
      </div>`:"").join("")):t==="fangjixue"?(s="《方剂学》教材目录",a=(d.fangjixue&&d.fangjixue.chapters||[]).map(e=>e.formulas.length?`<div class="browse-sec">
        <h3><button class="lj-inline" data-fxch="${i(e.name)}">${i(e.name)}</button><span>${e.formulas.length}</span></h3>
        <div class="pick-grid">${e.formulas.map(c=>`<button class="pick" data-formula="${c.id}">${i(c.name)}</button>`).join("")}</div>
      </div>`:"").join("")):t==="effect"?(s="按功效探索",a=`<div class="browse-sec"><div class="pick-grid">${(d.meta.effects||[]).map(e=>`<button class="pick" data-eff="${i(e.name)}">${i(e.name)}<i>${e.n}</i></button>`).join("")}</div></div>`):t==="meridian"?(s="按归经探索",a=`<div class="browse-sec"><div class="pick-grid">${(d.meta.meridians||[]).map(e=>`<button class="pick" data-mer="${i(e.name)}">${i(e.name)}经<i>${e.n}</i></button>`).join("")}</div></div>`):t==="fav"&&(s="收藏夹",a=r.fav.length?`<div class="browse-sec"><div class="pick-grid">${r.fav.map(e=>`<button class="pick" data-favgo="${e.key}">${i(e.name)}</button>`).join("")}</div></div>`:'<div class="side-empty">尚未收藏任何条目</div>');return`<div class="d-head">
    <div class="d-kind plain">目录</div>
    <h2>${s}</h2>
    <div class="d-py">点击条目进入详情并定位到三维球体</div>
  </div>
  <div class="tab-body">${a}</div>`}function mt(t){if(!t.length)return`<div class="d-head">
      <div class="d-kind compare">对比</div>
      <h2>方剂对比</h2>
      <div class="d-py">选择 2 首及以上方剂，逐项对照组成、功效与主治</div>
    </div>
    <div class="tab-body">
      <div class="side-empty">尚未选择方剂。<br>在任意方剂详情或方剂卡片点击「＋ 加入对比」即可添加。</div>
      <button class="btn-primary" data-act="browse-formulas">去方剂大全选择</button>
    </div>`;const s=l=>d.herbName(l),a={};t.forEach(l=>(l.comp||[]).forEach(n=>{a[n.h]=(a[n.h]||0)+1}));const e=Object.keys(a).sort((l,n)=>a[n]!==a[l]?a[n]-a[l]:s(l).localeCompare(s(n),"zh")),c=e.filter(l=>a[l]===t.length),o=(l,n)=>`<tr><th>${l}</th>${t.map(u=>`<td>${n(u)}</td>`).join("")}</tr>`,h=l=>(l.comp||[]).map(n=>`<span class="cmp-herb" data-herb="${n.h}">${i(s(n.h))}<i class="role-${i(n.r)}">${i(n.r)}</i></span>`).join(""),p=l=>n=>{const u=(n.comp||[]).filter(f=>(f.r||"").indexOf(l)>=0);return u.length?u.map(f=>`<span class="cmp-herb" data-herb="${f.h}">${i(s(f.h))}</span>`).join(""):'<span class="muted">—</span>'},b=l=>`<tr class="${a[l]===t.length?"cmp-shared":""}">
    <th><span class="cmp-herb" data-herb="${l}">${i(s(l))}</span></th>
    ${t.map(n=>{const u=(n.comp||[]).find(f=>f.h===l);return`<td class="${u?"yes":"no"}">${u?`<i class="role-${i(u.r)}">${i(u.r)}</i>`:"—"}</td>`}).join("")}
  </tr>`;return`<div class="d-head">
    <div class="d-kind compare">对比</div>
    <h2>方剂对比 · ${t.length} 首</h2>
    <div class="d-py">逐项对照组成、功效与主治；点药名查看中药，点方名查看详情</div>
    <div class="d-actions"><button class="btn-ghost" data-cmp-clear>清空对比篮</button></div>
  </div>
  <div class="tab-body">
    <div class="cmp-scroll">
      <table class="cmp-table">
        <thead><tr><th>项目</th>${t.map(l=>`<th class="cmp-th" data-formula="${l.id}">${i(l.name)}</th>`).join("")}</tr></thead>
        <tbody>
          ${o("出处",l=>i(l.src))}
          ${o("分类",l=>i(l.cat)+(l.sub?" · "+i(l.sub):""))}
          ${t.some(l=>l.lj)?o("六经",l=>l.lj?`<span class="chip lj">${i(l.lj)}</span>`:'<span class="muted">—</span>'):""}
          ${t.some(l=>l.art)?o("原文条文",l=>l.art?`<div class="classic-quote sm">${i(l.art)}</div>`:'<span class="muted">—</span>'):""}
          ${o("功效",l=>`<b>${i(l.eff)}</b>`)}
          ${o("主治",l=>i(l.ind))}
          ${o("主治详述",l=>`<div class="ind-detail">${i(l.indDetail||l.ind)}</div>`)}
          ${o("组成",h)}
          ${o("君药",p("君"))}
          ${o("臣药",p("臣"))}
          ${o("用法",l=>i(l.use))}
          ${o("使用注意",l=>`<span class="warn">${i(l.cau)}</span>`)}
        </tbody>
      </table>
    </div>
    <section class="cmp-diff">
      <h3>组成对比<span class="cmp-sub">共 ${e.length} 味 · 各方共有 ${c.length} 味</span></h3>
      <div class="cmp-scroll">
        <table class="cmp-matrix">
          <thead><tr><th>药物</th>${t.map(l=>`<th class="cmp-th" data-formula="${l.id}">${i(l.name)}</th>`).join("")}</tr></thead>
          <tbody>${e.map(b).join("")}</tbody>
        </table>
      </div>
      <p class="muted">✓ 表示该方含有此药，并标注其君臣佐使角色；高亮行为各方共有之药。</p>
    </section>
  </div>`}function Qt(t){const s=t&&t.meta||{},a=t&&t.blocks||[],e=t&&t.formulas||[],c=a.map(o=>`<div class="lj-block">
    <button class="lj-head" data-lj="${i(o.key)}">
      <span class="lj-name">${i(o.key)}</span>
      <span class="lj-num">${o.formulas.length} 方</span>
    </button>
    <p class="lj-outline">${i(o.outline)}</p>
    <p class="lj-note">${i(o.note)}</p>
    <div class="rel-grid">${o.formulas.map(h=>`<button class="rel-chip" data-formula="${h.id}">${i(h.name)}</button>`).join("")}</div>
  </div>`).join("");return`<div class="d-head book-head">
    <div class="d-kind book">典籍</div>
    <h2>${i(s.full||"《伤寒论》")}</h2>
    <div class="d-py">${i(s.dynasty||"")} · ${i(s.author||"")} 撰 · ${i(s.year||"")}</div>
    <div class="d-tags">
      <span class="chip cat">${i(s.volume||"")}</span>
      <span class="chip cat2">六经辨证</span>
      <span class="chip eff">收方 ${e.length} 首</span>
    </div>
    <div class="d-actions">
      <button class="btn-primary" data-act="book-sphere">球体展开</button>
      <button class="btn-ghost" data-act="browse-shanghan">经方目录</button>
    </div>
  </div>
  <div class="tab-body">
    <section><h3>典籍简介</h3><p class="book-intro">${i(s.intro||"")}</p></section>
    <section><h3>学术地位</h3><p class="ind-detail">${i(s.status||"")}</p></section>
    <section><h3>学术特色</h3><ul class="book-feats">${(s.features||[]).map(o=>`<li>${i(o)}</li>`).join("")}</ul></section>
    <section><h3>六经辨证纲要</h3>${c}</section>
    <section>
      <h3>收录经方<span class="sec-sub">${e.length} 首 · 涉药 ${t.herbCount||0} 味</span></h3>
      <div class="rel-grid">${e.map(o=>`<button class="rel-chip" data-formula="${o.id}">${i(o.name)}</button>`).join("")}</div>
    </section>
  </div>`}function Zt(t,s){const a=s&&s.formulas||[];return`<div class="d-head book-head">
    <div class="d-kind book">六经</div>
    <h2>${i(t)}</h2>
    <div class="d-py">《伤寒论》· ${a.length} 首方剂</div>
    ${s?`<p class="lj-outline big">${i(s.outline)}</p><p class="lj-note">${i(s.note)}</p>`:""}
    <div class="d-actions">
      <button class="btn-ghost" data-act="open-book">← 返回《伤寒论》</button>
      <button class="btn-ghost" data-act="browse-shanghan">经方目录</button>
    </div>
  </div>
  <div class="tab-body">${a.map(e=>tt(e)).join("")||'<div class="side-empty">暂无</div>'}</div>`}function ts(t){const s=t&&t.meta||{},a=t&&t.chapters||[],e=a.reduce((o,h)=>o+h.formulas.length,0),c=a.map(o=>{const h=(o.sections||[]).filter(p=>o.formulas.length);return`<div class="lj-block fx-block">
      <button class="lj-head" data-fxch="${i(o.name)}">
        <span class="lj-name">${i(o.name)}</span>
        <span class="lj-num">${o.formulas.length} 首</span>
      </button>
      <p class="lj-outline">${h.length?h.map(i).join(" · "):"—"}</p>
      <div class="rel-grid">${o.formulas.map(p=>`<button class="rel-chip" data-formula="${p.id}">${i(p.name)}</button>`).join("")}</div>
    </div>`}).join("");return`<div class="d-head book-head">
    <div class="d-kind book">教材</div>
    <h2>${i(s.full||"《方剂学》")}</h2>
    <div class="d-py">${i(s.edition||"")}</div>
    <div class="d-tags">
      <span class="chip cat">${i(s.author||"")}</span>
      <span class="chip cat2">${i(s.press||"")}</span>
      <span class="chip eff">收方 ${e} 首</span>
    </div>
    <div class="d-actions">
      <button class="btn-primary" data-act="fjx-sphere">球体展开</button>
      <button class="btn-ghost" data-act="browse-fangjixue">教材目录</button>
    </div>
  </div>
  <div class="tab-body">
    <section><h3>教材简介</h3><p class="book-intro">${i(s.intro||"")}</p></section>
    <section><h3>教材体系</h3><p class="ind-detail">${i(s.status||"")}</p></section>
    <section><h3>编写特色</h3><ul class="book-feats">${(s.features||[]).map(o=>`<li>${i(o)}</li>`).join("")}</ul></section>
    <section><h3>章节目录<span class="sec-sub">${a.length} 章 · ${e} 首</span></h3>${c}</section>
  </div>`}function ss(t,s){const e=(d.fangjixue&&d.fangjixue.chapters||[]).find(l=>l.name===t),c=s&&s.formulas||[],o={};c.forEach(l=>{const n=l.fjxSub||"其他";(o[n]=o[n]||[]).push(l)});const h=e&&e.sections||[],b=h.filter(l=>o[l]).concat(Object.keys(o).filter(l=>h.indexOf(l)<0)).map(l=>`
    <div class="browse-sec">
      <h3>${i(l)}<span>${o[l].length}</span></h3>
      <div class="pick-grid">${o[l].map(n=>`<button class="pick" data-formula="${n.id}">${i(n.name)}</button>`).join("")}</div>
    </div>`).join("");return`<div class="d-head book-head">
    <div class="d-kind book">章节</div>
    <h2>${i(t)}</h2>
    <div class="d-py">《方剂学》· ${c.length} 首方剂</div>
    ${h.length?`<p class="lj-outline big">${h.map(i).join(" · ")}</p>`:""}
    <div class="d-actions">
      <button class="btn-ghost" data-act="open-fjx">← 返回《方剂学》</button>
      <button class="btn-ghost" data-act="browse-fangjixue">教材目录</button>
    </div>
  </div>
  <div class="tab-body">${b||'<div class="side-empty">暂无</div>'}</div>`}function es(t){return`<div class="d-head">
    <div class="d-kind plain">资料</div>
    <h2>原始文档</h2>
    <div class="d-py">本项目中药与方剂数据的原始来源文件，随程序一并打包</div>
  </div>
  <div class="tab-body">
    ${(t||[]).map(a=>{const e=/\.pdf$/i.test(a.name);return`<div class="doc-item">
      <div class="doc-ico ${e?"pdf":"doc"}">${e?"PDF":"DOC"}</div>
      <div class="doc-main">
        <div class="doc-name">${i(a.name)}</div>
        <div class="doc-meta">${At(a.size)} · 项目原始语料</div>
      </div>
      <a class="doc-dl" href="/docs/${encodeURIComponent(a.name)}" download>下载</a>
    </div>`}).join("")||'<div class="side-empty">未找到文档</div>'}
    <div class="note"><strong>说明</strong>数据库中的 270 味中药、282 首方剂即由上述文档解析整理而来，解析脚本见项目 <code>scripts/</code> 目录。</div>
  </div>`}const Et=4,as=j("#graph"),$=new Rt(as,{onSelect:t=>ns(t),onHover:()=>{},onBackground:()=>{r.trail=[],r.detail=null,ps(),M({mode:"overview"},!1),$.resetView(),z()},onExpand:t=>{const s=Object.assign({},r.view,{deep:!r.view.deep});t.type==="herb"?(s.mode="herb",s.id=t.id.slice(2)):t.type==="formula"&&(s.mode="formula",s.id=t.id.slice(2)),M(s,!1)}});let bt=0;async function M(t,s){const a=++bt;r.view=t;let e;try{e=await w.graph(t)}catch{e={mode:"sphere",nodes:[],links:[],title:""}}a===bt&&($.setScene(e,s===!1?void 0:"reset"),is(t),z(),hs(),ds(e.title))}function is(t){t.mode==="herb"?$.select("h:"+t.id):t.mode==="formula"?$.select("f:"+t.id):t.mode==="effect"?$.select("e:"+t.key):t.mode==="meridian"?$.select("m:"+t.key):t.mode==="category"||t.mode==="fcat"?$.select("c:"+t.key):t.mode==="combo"?$.select("k:combo"):t.mode==="book"?$.select("b:shanghan"):t.mode==="liujing"?$.select("l:"+t.key):t.mode==="fjx"?$.select("b:fangjixue"):t.mode==="fjxchapter"?$.select("x:"+t.key):$.select(null)}function ns(t){if(!t)return;const s=t.id.indexOf(":"),a=t.id.slice(0,s),e=t.id.slice(s+1);a==="h"?O(e):a==="f"?q(e):a==="b"?e==="fangjixue"?A():W():a==="l"?D(e):a==="x"?F(e):a==="e"?Y(t.label.replace(" 功效","")):a==="m"?U(t.label.replace("经","")):a==="c"?d.formulas.some(o=>o.cat===e)?J(e):V(e):a==="k"&&y()}function T(t,s,a){const e=r.trail[r.trail.length-1];e&&e.kind===t&&e.id===s||(r.trail.push({kind:t,id:s,name:a}),r.trail.length>14&&r.trail.shift())}function St(t){r.hist=[t].concat(r.hist.filter(s=>s!==t)).slice(0,14),lt("tcm.hist",r.hist),Q()}async function O(t,s){const a=d.herb(t);if(a){if(r.detail={kind:"herb",id:t},!d.herbDetail(t))try{const e=await w.herb(t);d.setHerbDetail(t,e)}catch{}s||T("herb",t,a.name),St(a.name),await M({mode:"herb",id:t}),await y(),z(),E()}}async function q(t,s){const a=d.formula(t);if(a){if(r.detail={kind:"formula",id:t},!d.formulaDetail(t))try{const e=await w.formula(t);d.setFormulaFull(e)}catch{}s||T("formula",t,a.name),St(a.name),await M({mode:"formula",id:t}),await y(),z(),E()}}async function Y(t){r.detail={kind:"effect",key:t},T("effect",t,t),await M({mode:"effect",key:t}),await y(),E()}async function U(t){r.detail={kind:"meridian",key:t},T("meridian",t,t+"经"),await M({mode:"meridian",key:t}),await y(),E()}async function V(t){r.detail={kind:"category",key:t},T("category",t,t),await M({mode:"category",key:t}),await y(),E()}async function J(t){r.detail={kind:"fcat",key:t},T("fcat",t,t),await M({mode:"fcat",key:t}),await y(),E()}async function W(){r.detail={kind:"book"},d.shanghan||(d.shanghan=await w.bookShanghan()),T("book","shanghan","伤寒论"),await M({mode:"book"}),await y(),z(),E()}async function D(t){r.detail={kind:"liujing",key:t},d.liujing.has(t)||d.liujing.set(t,await w.bookLiujing(t)),T("liujing",t,t),await M({mode:"liujing",key:t}),await y(),z(),E()}async function A(){r.detail={kind:"fjx"},d.fangjixue||(d.fangjixue=await w.bookFangjixue()),T("fjx","fangjixue","方剂学"),await M({mode:"fjx"}),await y(),z(),E()}async function F(t){r.detail={kind:"fjxchapter",key:t},d.fangjixue||(d.fangjixue=await w.bookFangjixue()),d.fxChapter.has(t)||d.fxChapter.set(t,await w.bookFjxChapter(t)),T("fjxchapter",t,t),await M({mode:"fjxchapter",key:t}),await y(),z(),E()}async function zt(t){r.combo=t.slice(),r.detail={kind:"combo"},await M({mode:"combo",ids:r.combo}),await y(),E()}async function C(t){t==="shanghan"&&!d.shanghan&&(d.shanghan=await w.bookShanghan()),(t==="fangjixue"||t==="formulas")&&!d.fangjixue&&(d.fangjixue=await w.bookFangjixue()),r.detail={kind:"browse",list:t},t==="formulas"?await M({mode:"fcat"}):t==="herbs"?await M({mode:"category"}):t==="classic"&&await M({mode:"overview"}),await y(),E()}const os=t=>r.compare.includes(t);function vt(t){os(t)?r.compare=r.compare.filter(s=>s!==t):(r.compare.length>=Et&&(r.compare=r.compare.slice(1)),r.compare.push(t)),ut(),r.detail&&r.detail.kind==="formula"&&y(),r.detail&&r.detail.kind==="compare"&&y()}async function gt(){r.detail={kind:"compare"},await y(),E()}function ut(){const t=document.getElementById("compareBar");if(!t)return;if(!r.compare.length){t.classList.add("hidden"),t.innerHTML="";return}t.classList.remove("hidden");const s=r.compare.map(a=>{const e=d.formula(a);return`<button class="cmp-chip" data-rmcmp="${a}">${i(e?e.name:a)}<span class="x">×</span></button>`}).join("");t.innerHTML=`<div class="cmp-bar-inner">
    <span class="cmp-bar-label">对比篮 <b>${r.compare.length}</b>/${Et}</span>
    <div class="cmp-chips">${s}</div>
    <div class="cmp-bar-acts">
      <button class="btn-ghost" data-cmp-clear>清空</button>
      <button class="btn-primary" data-open-compare>开始对比</button>
    </div>
  </div>`}function z(){const t=j("#crumbs"),s=['<button class="crumb" data-crumb="-1">全景</button>'];r.trail.forEach((a,e)=>{s.push('<span class="crumb-sep">›</span>'),s.push(`<button class="crumb${e===r.trail.length-1?" on":""}" data-crumb="${e}">${i(a.name)}</button>`)}),t.innerHTML=s.join(""),t.scrollLeft=t.scrollWidth,cs()}function cs(){const t=document.getElementById("detailBack");t&&t.classList.toggle("hidden",r.trail.length<2)}function ls(t){if(t<0){r.trail=[],r.detail=null,M({mode:"overview"}),z();return}const s=r.trail[t];r.trail=r.trail.slice(0,t+1),Ct(s)}async function Ct(t){t&&(t.kind==="herb"?await O(t.id,!0):t.kind==="formula"?await q(t.id,!0):t.kind==="effect"?Y(t.key||t.id):t.kind==="meridian"?U(t.key||t.id):t.kind==="category"?V(t.key||t.id):t.kind==="fcat"?J(t.key||t.id):t.kind==="book"?W():t.kind==="liujing"?D(t.key||t.id):t.kind==="fjx"?A():t.kind==="fjxchapter"&&F(t.key||t.id))}async function rs(){if(r.trail.length<2)return;r.trail.pop();const t=r.trail[r.trail.length-1];await Ct(t),z()}function ds(t){const s=j("#stageTitle");if(!s)return;const a=d.counts;s.textContent=t||`全景知识网络 · ${a.herbs} 味中药 · ${a.formulas} 首方剂`}function hs(){Ot("#modes button").forEach(t=>t.classList.toggle("on",t.dataset.view===r.view.mode))}function Q(){const t=r.openGroups,s=(m,L,x)=>`
    <div class="side-group">
      <button class="side-title" data-group="${m}">
        <span>${L}</span><span class="caret ${t[m]?"open":""}">▾</span>
      </button>
      <div class="side-body ${t[m]?"":"hide"}">${x}</div>
    </div>`,a=d.meta||{categories:[],effects:[],meridians:[],fcats:[]},e=a.shanghan||{liujing:[]},c=a.fangjixue||{chapters:[]},o=d.shanghanFormulas().length;d.fjxFormulas().length;const h=`
    <button class="nav-item ${r.view.mode==="overview"?"on":""}" data-act="overview">
      <span class="nav-ico">◎</span>全景知识网络<span class="num">${d.herbs.length+d.formulas.length}</span>
    </button>
    <button class="nav-item ${r.view.mode==="category"?"on":""}" data-act="browse-herbs"><span class="nav-ico herb">◈</span>中药大全<span class="num">${d.herbs.length}</span></button>
    <button class="nav-item ${r.view.mode==="fcat"?"on":""}" data-act="browse-formulas"><span class="nav-ico formula">◆</span>方剂<span class="num">${d.formulas.length}</span></button>
    <button class="nav-item ${r.detail&&r.detail.kind==="browse"&&r.detail.list==="classic"?"on":""}" data-act="classic"><span class="nav-ico gold">✦</span>经典方剂<span class="num">${d.formulas.filter(m=>(m.n||0)>=6).length}</span></button>
    <button class="nav-item ${r.view.mode==="book"||r.view.mode==="liujing"?"on":""}" data-act="book"><span class="nav-ico gold">❖</span>《伤寒论》<span class="num">${o}</span></button>
    <button class="nav-item ${r.detail&&r.detail.kind==="docs"?"on":""}" data-act="docs"><span class="nav-ico plain">▤</span>原始文档<span class="num">2</span></button>`,p=e.liujing.map(m=>{const L=d.formulas.filter(x=>x.book==="shanghan"&&x.lj===m).length;return`<button class="nav-item sub" data-lj="${i(m)}">${i(m)}<span class="num">${L}</span></button>`}).join(""),b=c.chapters.map(m=>{const L=d.formulas.filter(x=>x.fjx&&x.cat===m).length;return`<button class="nav-item sub" data-fxch="${i(m)}">${i(m)}<span class="num">${L}</span></button>`}).join(""),l=a.categories.map(m=>`<button class="nav-item sub" data-cat="${i(m.name)}">${i(m.name)}<span class="num">${m.n}</span></button>`).join(""),n=a.effects.slice(0,40).map(m=>`<button class="nav-item sub" data-eff="${i(m.name)}">${i(m.name)}<span class="num">${m.n}</span></button>`).join(""),u=a.meridians.map(m=>`<button class="nav-item sub" data-mer="${i(m.name)}">${i(m.name)}经<span class="num">${m.n}</span></button>`).join(""),f=a.fcats.map(m=>`<button class="nav-item sub" data-fcat="${i(m.name)}">${i(m.name)}<span class="num">${m.n}</span></button>`).join(""),g=r.fav.length?r.fav.slice(0,8).map(m=>`<button class="nav-item sub" data-favgo="${m.key}">${i(m.name)}</button>`).join(""):'<div class="side-empty">尚未收藏</div>',v=r.hist.length?r.hist.slice(0,8).map(m=>`<button class="nav-item sub" data-hist="${i(m)}">${i(m)}</button>`).join(""):'<div class="side-empty">暂无搜索记录</div>';j("#sideScroll").innerHTML=s("nav","知识导航",h)+s("book","典籍 · 伤寒论六经",p)+s("fjx","教材 · 方剂学 "+c.chapters.length+" 章",b)+s("cat","按药物类别",l)+s("eff","按功效分类",n)+s("mer","按归经分类",u)+s("fcat","按方剂分类",f)+s("mine","我的收藏夹",g)+`<div class="side-group"><button class="side-title static"><span>搜索记录</span></button><div class="side-body">${v}</div></div>`}let $t=0;const ot=new Map;let ct=null;async function y(){const t=r.detail,s=j("#detailScroll"),a=++$t;if(!t){s.innerHTML=dt();return}let e="";try{if(t.kind==="herb"){if(!d.herbDetail(t.id)){s.innerHTML=ft("正在读取中药数据…");const c=await w.herb(t.id);d.setHerbDetail(t.id,c)}e=Nt(d.herbDetail(t.id))}else if(t.kind==="formula"){if(!d.formulaDetail(t.id)){s.innerHTML=ft("正在读取方剂数据…");const o=await w.formula(t.id);d.setFormulaFull(o)}let c=null;r.tab.formula==="rel"&&(ot.has(t.id)||ot.set(t.id,await w.formulaRelated(t.id)),c=ot.get(t.id)),e=Yt(d.formulaDetail(t.id),c)}else if(t.kind==="effect")e=Ut(t.key);else if(t.kind==="meridian")e=Xt(t.key);else if(t.kind==="category")e=Gt(t.key);else if(t.kind==="fcat")e=Kt(t.key);else if(t.kind==="combo")e=Vt();else if(t.kind==="browse")e=Jt(t.list);else if(t.kind==="compare")if(!r.compare.length)e=mt([]);else{const c=await w.compare(r.compare);e=mt(c.formulas)}else if(t.kind==="book")d.shanghan||(d.shanghan=await w.bookShanghan()),e=Qt(d.shanghan);else if(t.kind==="liujing"){d.liujing.has(t.key)||d.liujing.set(t.key,await w.bookLiujing(t.key));const c=d.liujing.get(t.key);e=Zt(t.key,c)}else t.kind==="fjx"?(d.fangjixue||(d.fangjixue=await w.bookFangjixue()),e=ts(d.fangjixue)):t.kind==="docs"?(ct||(ct=(await w.docs()).docs),e=es(ct)):t.kind==="fjxchapter"&&(d.fxChapter.has(t.key)||d.fxChapter.set(t.key,await w.bookFjxChapter(t.key)),e=ss(t.key,d.fxChapter.get(t.key)))}catch(c){e=`<div class="side-empty">数据加载失败：${i(c.message)}</div>`}a===$t&&(s.innerHTML=e,s.scrollTop=0)}const Tt=300,us=()=>Math.max(Tt,window.innerWidth-252-300);function Z(t){const s=document.querySelector(".app");s&&(t?(s.style.setProperty("--detail-w",Math.round(t)+"px"),r.detailW=Math.round(t)):(s.style.removeProperty("--detail-w"),r.detailW=0))}function _t(t){const s=document.querySelector(".app");if(!s)return;s.classList.toggle("detail-off",!t);const a=document.getElementById("detailReopen");a&&a.classList.toggle("hidden",t),t&&r.detailW&&Z(r.detailW),$&&$.resize&&$.resize()}function ps(){_t(!1),document.body.classList.remove("detail-open")}function Bt(){_t(!0)}function fs(){const t=document.getElementById("detailResizer");if(!t)return;let s=!1,a=0,e=0;t.addEventListener("pointerdown",o=>{if(window.innerWidth<=1100)return;const h=document.getElementById("detail");h&&(s=!0,a=o.clientX,e=h.getBoundingClientRect().width,document.body.classList.add("resizing"),t.setPointerCapture&&t.setPointerCapture(o.pointerId),o.preventDefault())}),t.addEventListener("pointermove",o=>{if(!s)return;const h=Math.min(us(),Math.max(Tt,e-(o.clientX-a)));Z(h),$.resize()});const c=()=>{s&&(s=!1,document.body.classList.remove("resizing"),r.detailW&&lt("tcm.detailW",r.detailW),$.resize())};t.addEventListener("pointerup",c),t.addEventListener("pointercancel",c),t.addEventListener("dblclick",()=>{Z(0);try{localStorage.removeItem("tcm.detailW")}catch{}$.resize()})}function E(){Bt(),window.innerWidth<=1080&&document.body.classList.add("detail-open")}let yt=0,kt=0;function jt(t){const s=j("#suggest");if(clearTimeout(yt),!t.trim()){s.classList.remove("show"),s.innerHTML="";return}yt=setTimeout(async()=>{const a=++kt;let e=[];try{e=(await w.search(t)).groups||[]}catch{e=[]}if(a===kt){if(!e.length){s.classList.remove("show"),s.innerHTML="";return}s.innerHTML=e.map(c=>`
      <div class="sg-group">${i(c.group)}</div>
      ${c.items.map(o=>`
        <button class="sg-item" data-type="${o.type}"
          data-id="${i(o.id||"")}" data-key="${i(o.key||"")}"
          data-ids="${(o.ids||[]).join(",")}">
          <span class="sg-label">${i(o.label)}</span>
          <span class="sg-sub">${i(o.sub||"")}</span>
          ${o.meta?`<span class="sg-meta">${i(o.meta)}</span>`:""}
        </button>`).join("")}
    `).join(""),s.classList.add("show")}},120)}function wt(t){const s=t.dataset.type;s==="herb"?O(t.dataset.id):s==="formula"?q(t.dataset.id):s==="effect"?Y(t.dataset.key):s==="meridian"?U(t.dataset.key):s==="combo"?zt((t.dataset.ids||"").split(",").filter(Boolean)):s==="book"?W():s==="fjx"?A():s==="fjxchapter"&&F(t.dataset.key),j("#suggest").classList.remove("show")}function ms(){const t=j("#q");t.addEventListener("input",()=>jt(t.value)),t.addEventListener("focus",()=>{t.value&&jt(t.value)}),t.addEventListener("keydown",e=>{if(e.key==="Enter"){const c=j(".sg-item",j("#suggest"));c?c.click():w.search(t.value).then(o=>{const h=(o.groups[0]||{}).items;!h||!h.length||wt({dataset:{type:h[0].type,id:h[0].id||"",key:h[0].key||"",ids:(h[0].ids||[]).join(",")}})})}else e.key==="Escape"&&(j("#suggest").classList.remove("show"),t.blur())}),document.addEventListener("click",e=>{e.target.closest(".searchbox")||j("#suggest").classList.remove("show")}),j("#suggest").addEventListener("click",e=>{const c=e.target.closest(".sg-item");c&&wt(c)}),document.addEventListener("click",e=>{const c=e.target.closest("[data-rmcmp]");if(c){vt(c.dataset.rmcmp);return}if(e.target.closest("[data-cmp-clear]")){r.compare=[],ut(),r.detail&&r.detail.kind==="compare"&&y();return}if(e.target.closest("[data-open-compare]")){gt();return}const p=e.target.closest("[data-cmp]");if(p){vt(p.dataset.cmp);return}}),j("#modes").addEventListener("click",e=>{const c=e.target.closest("button");if(!c)return;const o=c.dataset.view;o==="overview"?(r.trail=[],r.detail=null,M({mode:"overview"}),z(),y()):o==="herb"?C("herbs"):o==="formula"?C("formulas"):o==="combo"?(r.detail={kind:"combo"},y(),E()):o==="compare"?gt():o==="effect"?(r.detail={kind:"browse",list:"effect"},y(),E()):o==="meridian"&&(r.detail={kind:"browse",list:"meridian"},y(),E())}),j("#sideScroll").addEventListener("click",e=>{const c=e.target.closest("[data-group]");if(c){const v=c.dataset.group;r.openGroups[v]=!r.openGroups[v],Q();return}const o=e.target.closest("[data-lj]");if(o){D(o.dataset.lj);return}const h=e.target.closest("[data-fxch]");if(h){F(h.dataset.fxch);return}const p=e.target.closest("[data-cat]");if(p){V(p.dataset.cat);return}const b=e.target.closest("[data-eff]");if(b){Y(b.dataset.eff);return}const l=e.target.closest("[data-mer]");if(l){U(l.dataset.mer);return}const n=e.target.closest("[data-fcat]");if(n){J(n.dataset.fcat);return}const u=e.target.closest("[data-favgo]");if(u){const v=u.dataset.favgo;v.indexOf("h:")===0?O(v.slice(2)):q(v.slice(2));return}const f=e.target.closest("[data-hist]");if(f){const v=f.dataset.hist,m=d.herbs.find(x=>x.name===v);if(m){O(m.id);return}const L=d.formulas.find(x=>x.name===v);L&&q(L.id);return}const g=e.target.closest("[data-act]");if(g){const v=g.dataset.act;v==="overview"?(r.trail=[],r.detail=null,M({mode:"overview"}),z(),y()):v==="browse-herbs"?C("herbs"):v==="browse-formulas"?C("formulas"):v==="classic"?C("classic"):v==="book"?W():v==="fangjixue"?A():v==="browse-shanghan"?C("shanghan"):v==="browse-fangjixue"?C("fangjixue"):v==="docs"&&(r.detail={kind:"docs"},y(),E())}}),j("#crumbs").addEventListener("click",e=>{const c=e.target.closest("[data-crumb]");c&&ls(parseInt(c.dataset.crumb,10))}),j("#detailScroll").addEventListener("click",e=>{const c=e.target.closest("[data-tab]");if(c){const[k,I]=c.dataset.tab.split(":");r.tab[k]=I,y();return}const o=e.target.closest("[data-fav]");if(o){const k=o.dataset.fav,I=o.dataset.favname;rt(k)?r.fav=r.fav.filter(H=>H.key!==k):r.fav.unshift({key:k,name:I}),lt("tcm.fav",r.fav),Q(),y();return}const h=e.target.closest("[data-focus]");if(h){const k=h.dataset.focus;k.indexOf("h:")===0?M({mode:"herb",id:k.slice(2)}):M({mode:"formula",id:k.slice(2)});return}const p=e.target.closest("[data-combo]");if(p){const k=p.dataset.combo;r.combo.includes(k)?r.combo=r.combo.filter(I=>I!==k):r.combo.push(k),r.detail={kind:"combo"},y();return}const b=e.target.closest("[data-uncombo]");if(b){r.combo=r.combo.filter(k=>k!==b.dataset.uncombo),r.detail={kind:"combo"},y();return}if(e.target.closest('[data-act="runcombo"]')){zt(r.combo);return}const n=e.target.closest("[data-lj]");if(n){D(n.dataset.lj);return}const u=e.target.closest("[data-fxch]");if(u){F(u.dataset.fxch);return}const f=e.target.closest("[data-act]");if(f){const k=f.dataset.act;if(k==="open-book"){W();return}if(k==="open-fjx"){A();return}if(k==="browse-shanghan"){C("shanghan");return}if(k==="browse-fangjixue"){C("fangjixue");return}if(k==="browse-formulas"){C("formulas");return}if(k==="book-sphere"){r.detail&&r.detail.kind==="liujing"?D(r.detail.key):W();return}if(k==="fjx-sphere"){r.detail&&r.detail.kind==="fjxchapter"?F(r.detail.key):A();return}}const g=e.target.closest("[data-herb]");if(g){O(g.dataset.herb);return}const v=e.target.closest("[data-formula]");if(v){q(v.dataset.formula);return}const m=e.target.closest("[data-mer]");if(m){U(m.dataset.mer);return}const L=e.target.closest("[data-eff]");if(L){Y(L.dataset.eff);return}const x=e.target.closest("[data-cat]");if(x){V(x.dataset.cat);return}const _=e.target.closest("[data-fcat]");if(_){J(_.dataset.fcat);return}const N=e.target.closest("[data-lj]");if(N){D(N.dataset.lj);return}const B=e.target.closest("[data-fxch]");if(B){F(B.dataset.fxch);return}}),j(".tools").addEventListener("click",e=>{const c=e.target.closest("button");if(!c)return;const o=c.dataset.act;if(o==="zoomin")$.zoomBy(1.18);else if(o==="zoomout")$.zoomBy(.85);else if(o==="reset")$.resetView(),$.zoomTarget=1;else if(o==="labels"){const h=!c.classList.contains("on");c.classList.toggle("on",h),$.setLabels(h)}else o==="full"&&xt()}),j("#btnFs").addEventListener("click",xt),j("#btnNav").addEventListener("click",()=>document.body.classList.toggle("nav-open")),j("#btnDetail").addEventListener("click",()=>document.body.classList.toggle("detail-open"));const s=j("#detailReopen");s&&s.addEventListener("click",()=>Bt()),j("#detailClose").addEventListener("click",()=>document.body.classList.remove("detail-open"));const a=document.getElementById("detailBack");a&&a.addEventListener("click",()=>rs()),document.addEventListener("keydown",e=>{e.key==="/"&&document.activeElement!==t&&(e.preventDefault(),t.focus()),e.key==="Escape"&&(document.body.classList.remove("nav-open","detail-open"),j("#suggest").classList.remove("show"))}),j("#sidebar").addEventListener("click",e=>{window.innerWidth<=860&&e.target.closest(".nav-item")&&document.body.classList.remove("nav-open")})}function xt(){const t=document.documentElement;document.fullscreenElement?(document.exitFullscreen||document.webkitExitFullscreen||function(){}).call(t):(t.requestFullscreen||t.webkitRequestFullscreen||function(){}).call(t)}let Mt=!1;async function Lt(){if(Mt)return;Mt=!0;try{const[a,e]=await Promise.all([w.meta(),w.index()]);d.setMeta(a),d.setIndex(e)}catch(a){j("#bootMask").innerHTML=`<div class="boot-seal">醫</div>
      <div class="boot-txt">后端服务未就绪：${i(a.message)}</div>`;return}Q(),ut(),ms(),fs(),r.detailW&&Z(r.detailW),requestAnimationFrame(()=>$.resize());const t=document.getElementById("stage");window.ResizeObserver&&t&&new ResizeObserver(()=>$.resize()).observe(t),await M({mode:"overview"}),await y(),z(),$.resize();const s=j("#bootMask");s&&(s.classList.add("hide"),setTimeout(()=>{s.remove(),$.resize()},520))}const It=self.crypto&&self.crypto.randomUUID?self.crypto.randomUUID():"c"+Date.now().toString(36)+Math.random().toString(36).slice(2);function st(){try{fetch("/api/ping?cid="+encodeURIComponent(It),{method:"POST",keepalive:!0,cache:"no-store"})}catch{}}function bs(){const t="/api/bye?cid="+encodeURIComponent(It);try{navigator.sendBeacon?navigator.sendBeacon(t):fetch(t,{method:"POST",keepalive:!0})}catch{}}window.addEventListener("pagehide",t=>{t.persisted||bs()});window.addEventListener("pageshow",()=>st());document.addEventListener("visibilitychange",()=>{document.hidden||st()});setInterval(st,5e3);st();document.readyState==="loading"?document.addEventListener("DOMContentLoaded",Lt,{once:!0}):Lt();
