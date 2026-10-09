/* =========================================================================
   「○○로 살아 보기」 시뮬레이션 묶음 (선택 활동) — theme.js 다음에 불러온다.
   한 개체(나방·사람·별·원자)로 태어나 조건 속에서 한살이를 살고, 같이 태어난 넷과 견주고,
   끝에 같은 조건으로 30번 살아 본 분포를 본다. 조건은 확률을 바꿀 뿐 한 개체의 결과를 정하지 않는다.

     sthLife.moth({ mount: "life-moth", id: "is2-1-1" });     // 🦋 나방 한 마리 — 자연선택
     sthLife.epi({ mount: "life-epi", id: "is2-3-1" });       // 🦠 유행 속 한 사람 — 감염병
     sthLife.star({ mount: "life-star", id: "eshs-3-2" });    // ⭐ 별 하나 — 별의 진화
     sthLife.atom({ mount: "life-atom", id: "eshs-2-1" });    // ⚛️ 원자 하나 — 방사성 붕괴

   integrated-science-2 와 earth-science-2 의 assets/life-kit.js 는 같은 파일이다(한쪽을 고치면 복사).
   ========================================================================= */
(function () {
  "use strict";
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function rng(seed) { var s = seed >>> 0; return function () { s = (s + 0x6D2B79F5) >>> 0; var t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function seed() { return (Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0; }
  function f1(x) { return (Math.round(x * 10) / 10).toFixed(1); }
  function comma(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
  function yrs(y) {   /* 년 → 읽기 쉬운 말 */
    if (y < 1) return Math.round(y * 365) + "일";
    if (y < 1e4) return comma(y) + "년";
    if (y < 1e8) return f1(y / 1e4) + "만 년";
    if (y < 1e12) return f1(y / 1e8) + "억 년";
    return f1(y / 1e12) + "조 년";
  }

  var CSS = false;
  function css() {
    if (CSS) return; CSS = true;
    var s = document.createElement("style");
    s.textContent = ".lk-box{border:2px solid var(--line);border-radius:18px;background:var(--panel);padding:16px 18px;margin:18px 0}"
      + ".lk-h{font-size:18px;margin:0 0 4px}.lk-sub{color:var(--mist);font-size:13.5px;line-height:1.7;margin:0 0 10px}"
      + ".lk-lab{font-size:12px;font-weight:800;color:var(--mist);margin-top:8px}.lk-row{display:flex;flex-wrap:wrap;gap:7px;margin:6px 0 10px}"
      + ".lk-chip{border:2px solid var(--line);border-radius:999px;padding:6px 12px;font:inherit;font-size:13px;font-weight:800;background:var(--card);color:var(--ink);cursor:pointer;text-align:left}"
      + ".lk-chip.on{border-color:var(--brand);background:var(--brand-100);color:var(--brand-700)}.lk-chip small{display:block;font-weight:600;color:var(--mist);font-size:11px}"
      + ".lk-note{font-size:12px;color:var(--mist);margin:8px 0 0;line-height:1.6}"
      + ".lk-top{display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between;margin-top:14px}"
      + ".lk-now{display:flex;gap:10px;flex-wrap:wrap}.lk-now div{background:var(--card-2);border-radius:12px;padding:6px 12px;font-size:12px;color:var(--mist)}.lk-now b{display:block;font-size:19px;color:var(--ink)}"
      + ".lk-spd{display:flex;gap:5px;flex-wrap:wrap}.lk-spd .btn{padding:5px 10px;font-size:12px}"
      + ".lk-leg{display:flex;flex-wrap:wrap;gap:10px;font-size:12px;color:var(--mist);margin:8px 0}.lk-leg span:before{content:'';display:inline-block;width:11px;height:11px;border-radius:3px;margin-right:4px;vertical-align:-1px;background:var(--c)}"
      + ".lk-p{display:grid;grid-template-columns:130px 1fr 120px;gap:8px;align-items:center;margin:5px 0}.lk-p.me{margin:10px 0}"
      + ".lk-nm{font-size:12.5px;font-weight:800;color:var(--ink);line-height:1.35}.lk-nm small{display:block;color:var(--mist);font-weight:600;font-size:11px}"
      + ".lk-strip{display:grid;gap:1px;height:16px}.lk-p.me .lk-strip{height:26px}.lk-strip i{display:block;background:var(--card-2);border-radius:2px}"
      + ".lk-ct{font-size:12px;color:var(--mist);text-align:right;line-height:1.4}"
      + ".lk-ax{display:grid;grid-template-columns:130px 1fr 120px;gap:8px;font-size:11px;color:var(--mist)}.lk-ax div:nth-child(2){display:flex;justify-content:space-between}"
      + ".lk-pause{border:2px solid var(--brand);border-radius:14px;background:var(--brand-100);padding:12px 14px;margin:12px 0}"
      + ".lk-pause p{margin:0 0 8px;font-weight:800;color:var(--ink);font-size:14px;line-height:1.6}.lk-pause textarea{width:100%;min-height:54px;border:2px solid var(--line);border-radius:10px;padding:8px;font:inherit;font-size:13.5px;background:var(--card);color:var(--ink);box-sizing:border-box}"
      + ".lk-log{list-style:none;margin:8px 0 0;padding:6px 0 0;font-size:13px;line-height:1.7;color:var(--ink);max-height:150px;overflow:auto;border-top:1px dashed var(--line)}.lk-log .y{color:var(--mist);font-weight:800;margin-right:6px}"
      + ".lk-end{margin-top:12px;font-size:13.5px;line-height:1.7;color:var(--ink)}.lk-end table{border-collapse:collapse;width:100%;font-size:13px;margin:8px 0}.lk-end th,.lk-end td{border:1px solid var(--line);padding:6px 8px;text-align:center}.lk-end th{background:var(--card-2);color:var(--mist)}.lk-end td:first-child{text-align:left}"
      + ".lk-hist{display:flex;align-items:flex-end;gap:3px;height:120px;border-bottom:2px solid var(--line);margin:10px 0 2px;padding:0 4px}.lk-hist div{flex:1;display:flex;flex-direction:column-reverse;gap:1px;min-width:0}.lk-hist i{display:block;height:8px;border-radius:2px}"
      + ".lk-hx{display:flex;gap:3px;padding:0 4px;font-size:10.5px;color:var(--mist)}.lk-hx span{flex:1;text-align:center;min-width:0}"
      + ".lk-q{font-size:13.5px;font-weight:800;color:var(--ink);margin:8px 0 0;line-height:1.6}.lk-src{font-size:11.5px;color:var(--mist);margin:12px 0 0;line-height:1.6}"
      + ".lk-spark{width:100%;height:90px;display:block;margin:6px 0}"
      + "@media (max-width:640px){.lk-p,.lk-ax{grid-template-columns:80px 1fr 74px}.lk-nm{font-size:11px}}";
    document.head.appendChild(s);
  }

  /* ---- 공통 엔진 ----
     D = { id, title, sub, choices:[{key,label,opts:[{k,name,small}]}], go, src,
           live(pick, seed) → { n, axis:[…], legend:[[색,이름]], rows:[{name,small,me,cells:[{c,t}],ct:fn(i)}], now:fn(i)→[[이름,값]], log:{i:[html]}, stops:{i:질문}, end:html },
           crowd(pick, seed, run) → { label, sets:[{name,c,v:[…]}], mine, unit, bin, q } } */
  function engine(o, D) {
    var mount = document.getElementById(o.mount); if (!mount) return;
    css();
    var SK = "life_" + D.id + "_" + (o.id || ""), st = (window.sthState && window.sthState(SK)) || {};
    function save() { if (window.sthState) window.sthState(SK, st); }
    var pick = {}; D.choices.forEach(function (c) { pick[c.key] = (st.pick && st.pick[c.key] != null) ? st.pick[c.key] : c.opts[c.def || 0].k; });
    var box = el("div", "lk-box"); box.appendChild(el("h3", "lk-h", D.title));
    var sub = el("p", "lk-sub"); sub.innerHTML = D.sub + " <span style='color:var(--mist)'>(선택 활동 · 약 3분 · 기록·채점 없음)</span>"; box.appendChild(sub);
    D.choices.forEach(function (c, ci) {
      box.appendChild(el("div", "lk-lab", (ci + 1) + ". " + c.label));
      var row = el("div", "lk-row");
      c.opts.forEach(function (x) {
        var b = el("button", "lk-chip" + (pick[c.key] === x.k ? " on" : "")); b.type = "button"; b.innerHTML = x.name + (x.small ? "<small>" + x.small + "</small>" : "");
        b.addEventListener("click", function () { pick[c.key] = x.k; Array.prototype.forEach.call(row.children, function (y) { y.classList.toggle("on", y === b); }); });
        row.appendChild(b);
      });
      box.appendChild(row);
    });
    var go = el("button", "btn primary", D.go || "👶 태어나기"); go.type = "button"; box.appendChild(go);
    box.appendChild(el("p", "lk-note", "같은 조건으로 다시 해도 결과는 매번 달라집니다. 몇 번 해 보고, 조건을 바꿔서도 해 보세요."));
    var stage = el("div"); box.appendChild(stage);
    var src = el("p", "lk-src"); src.innerHTML = D.src; box.appendChild(src);
    mount.appendChild(box);
    var timer = null;
    go.addEventListener("click", start);
    function start() {
      clearTimeout(timer);
      st.pick = JSON.parse(JSON.stringify(pick)); st.n = (st.n || 0) + 1; save();
      var sd = seed(), L = D.live(pick, sd), speed = Math.max(120, Math.min(700, Math.round(18000 / L.n)));
      stage.innerHTML = "";
      var top = el("div", "lk-top"), now = el("div", "lk-now"), spd = el("div", "lk-spd");
      [["느리게", 2.2], ["보통", 1], ["빠르게", 0.25]].forEach(function (x) { var b = el("button", "btn", x[0]); b.type = "button"; b.addEventListener("click", function () { speed = Math.max(40, Math.round(18000 / L.n * x[1])); }); spd.appendChild(b); });
      var skip = el("button", "btn", "⏭ 끝까지"); skip.type = "button"; spd.appendChild(skip);
      top.appendChild(now); top.appendChild(spd); stage.appendChild(top);
      var leg = el("div", "lk-leg"); L.legend.forEach(function (g) { var s = el("span", null, g[1]); s.style.setProperty("--c", g[0]); leg.appendChild(s); }); stage.appendChild(leg);
      var rows = L.rows.map(function (R, ri) {
        if (R.label) stage.appendChild(el("div", "lk-lab", R.label));
        var r = el("div", "lk-p" + (R.me ? " me" : "")), nm = el("div", "lk-nm"); nm.innerHTML = (R.me ? "👤 " : "") + R.name + (R.small ? "<small>" + R.small + "</small>" : "");
        var strip = el("div", "lk-strip"); strip.style.gridTemplateColumns = "repeat(" + L.n + ",1fr)"; var cells = [];
        for (var i = 0; i < L.n; i++) { var c = el("i"); strip.appendChild(c); cells.push(c); }
        var ct = el("div", "lk-ct"); r.appendChild(nm); r.appendChild(strip); r.appendChild(ct); stage.appendChild(r);
        return { R: R, cells: cells, ct: ct };
      });
      var ax = el("div", "lk-ax"); ax.innerHTML = "<div></div><div>" + L.axis.map(function (a) { return "<span>" + a + "</span>"; }).join("") + "</div><div></div>"; stage.appendChild(ax);
      var pauseBox = el("div"); stage.appendChild(pauseBox);
      var log = el("ul", "lk-log"); stage.appendChild(log);
      var endBox = el("div", "lk-end"); stage.appendChild(endBox);
      var i = 0, done = false;
      function paint(k) {
        rows.forEach(function (x) { var c = x.R.cells[k]; if (c) { x.cells[k].style.background = c.c; if (c.t) x.cells[k].title = c.t; } x.ct.textContent = x.R.ct(k); });
        now.innerHTML = L.now(k).map(function (p) { return "<div>" + p[0] + "<b>" + p[1] + "</b></div>"; }).join("");
        (L.log[k] || []).forEach(function (h) { var li = el("li"); li.innerHTML = h; log.insertBefore(li, log.firstChild); });
      }
      function step() {
        if (done) return;
        paint(i); i++;
        if (i >= L.n) return finish();
        if (L.stops[i - 1]) return pause(i - 1);
        timer = setTimeout(step, speed);
      }
      function pause(k) {
        pauseBox.innerHTML = "";
        var p = el("div", "lk-pause"); p.appendChild(el("p", null, "⏸ " + L.stops[k]));
        var ta = document.createElement("textarea"); ta.placeholder = "한두 줄로 (이 기기에만 저장)"; st.notes = st.notes || {}; ta.value = st.notes[k] || "";
        ta.addEventListener("change", function () { st.notes[k] = ta.value.trim(); save(); });
        var b = el("button", "btn primary", "계속 ▶"); b.type = "button"; b.addEventListener("click", function () { pauseBox.innerHTML = ""; timer = setTimeout(step, speed); });
        p.appendChild(ta); p.appendChild(b); pauseBox.appendChild(p);
      }
      skip.addEventListener("click", function () { if (done) return; clearTimeout(timer); pauseBox.innerHTML = ""; while (i < L.n) { paint(i); i++; } finish(); });
      function finish() {
        done = true; clearTimeout(timer);
        endBox.innerHTML = L.end;
        var cb = el("button", "btn primary", D.crowdBtn || "👥 같은 조건으로 30번 해 보면?"); cb.type = "button"; endBox.appendChild(cb);
        var again = el("button", "btn", "🔁 다시"); again.type = "button"; again.style.marginLeft = "6px"; again.addEventListener("click", start); endBox.appendChild(again);
        var cw = el("div"); endBox.appendChild(cw);
        cb.addEventListener("click", function () { cw.innerHTML = ""; hist(cw, D.crowd(pick, sd, L)); });
      }
      timer = setTimeout(step, 300);
    }
  }
  /* 30번 분포: 숫자면 막대 그림, cat 이면 종류별 칸 */
  function hist(wrap, H) {
    wrap.appendChild(el("div", "lk-lab", H.label));
    var lg = el("div", "lk-leg");
    if (H.cat) {
      var t = "<table><tr><th></th>" + H.sets.map(function (s) { return "<th>" + s.name + "</th>"; }).join("") + "</tr>";
      H.cat.forEach(function (c, ci) { t += "<tr><td>" + c + "</td>" + H.sets.map(function (s) { return "<td><b>" + s.v[ci] + "</b>" + (s.of ? " / " + s.of : "") + "</td>"; }).join("") + "</tr>"; });
      var d = el("div", "lk-end"); d.innerHTML = t + "</table>"; wrap.appendChild(d);
    } else {
      var all = []; H.sets.forEach(function (s) { all = all.concat(s.v); }); if (H.mine != null) all.push(H.mine);
      var lo = Math.floor(Math.min.apply(null, all)), hi = Math.ceil(Math.max.apply(null, all)), bw = H.bin || Math.max(1, Math.ceil((hi - lo + 1) / 24));
      lo = Math.floor(lo / bw) * bw;
      var nb = Math.floor((hi - lo) / bw) + 1, hs = el("div", "lk-hist"), hx = el("div", "lk-hx");
      for (var b = 0; b < nb; b++) {
        var col = el("div");
        H.sets.forEach(function (s) { s.v.forEach(function (v) { if (Math.floor((v - lo) / bw) === b) { var i = el("i"); i.style.background = s.c; col.appendChild(i); } }); });
        if (H.mine != null && Math.floor((H.mine - lo) / bw) === b) { var m = el("i"); m.style.background = "var(--ink)"; col.appendChild(m); }
        hs.appendChild(col); hx.appendChild(el("span", null, nb > 16 && b % 2 ? "" : String(lo + b * bw)));
      }
      var mx = 1; Array.prototype.forEach.call(hs.children, function (c) { mx = Math.max(mx, c.children.length); });
      var ih = Math.max(1, Math.min(8, Math.floor((110 - mx) / mx)));   /* 가장 높은 칸이 상자 안에 들어오게 */
      Array.prototype.forEach.call(hs.querySelectorAll("i"), function (i) { i.style.height = ih + "px"; });
      wrap.appendChild(hs); wrap.appendChild(hx);
      H.sets.forEach(function (s) { var mean = s.v.reduce(function (x, y) { return x + y; }, 0) / s.v.length; var sp = el("span", null, s.name + " — 평균 " + f1(mean) + (H.unit || "")); sp.style.setProperty("--c", s.c); lg.appendChild(sp); });
      if (H.mine != null) { var me = el("span", null, "검은 칸 = 나 (" + (Math.round(H.mine * 10) / 10) + (H.unit || "") + ")"); me.style.setProperty("--c", "var(--ink)"); lg.appendChild(me); }
    }
    wrap.appendChild(lg);
    if (H.q) wrap.appendChild(el("p", "lk-q", "🤔 " + H.q));
  }

  /* =========================================================================
     🦋 나방 한 마리 — 회색가지나방(Biston betularia)의 밝은형·검은형
     어른 나방의 열흘. 날마다 새에게 잡힐 확률: 나무껍질과 색이 맞으면 6%, 안 맞으면 8% (열흘 생존 54% 대 43%, 선택 세기 약 0.2).
     ========================================================================= */
  var MOTH_RISK = { clean: { light: 0.06, dark: 0.08 }, sooty: { light: 0.08, dark: 0.06 }, recover: { light: 0.06, dark: 0.08 } };
  var MOTH_SIB = { clean: 0.15, sooty: 0.85, recover: 0.6 };   /* 형제 넷의 검은형 확률 — 그 숲의 시절 무리(드물게·대부분·섞임)를 닮게 */
  var MOTH_P0 = { clean: 0.01, sooty: 0.01, recover: 0.9 }, MOTH_Y0 = { clean: 1800, sooty: 1848, recover: 1970 };
  var MOTH_FOREST = { clean: "깨끗한 숲", sooty: "그을린 숲", recover: "다시 맑아지는 숲" };
  function mothLife(color, forest, rnd) { var r = MOTH_RISK[forest][color], d = 0; for (; d < 10; d++) if (rnd() < r) break; return d; }   /* 산 날 수(0~10) */
  var MOTH = {
    id: "moth", title: "🦋 나방 한 마리로 살아 보기 — 숲 색깔과 자연선택",
    sub: "1800년대 영국의 회색가지나방은 대부분 <b>밝은 바탕에 점</b>이 있었고, 드물게 <b>검은형</b>이 태어났습니다. 공장 매연으로 나무껍질이 검어지자 무슨 일이 일어났을까요? 나방 한 마리로 태어나 어른이 된 뒤의 <b>열흘</b>을 살아 봅니다. 날마다 새가 나무껍질에 앉은 나방을 찾아 먹습니다.",
    choices: [
      { key: "forest", label: "어떤 숲에서 살까", opts: [{ k: "clean", name: "🌳 깨끗한 숲", small: "밝은 지의류로 덮인 나무껍질 (1800년대 초)" }, { k: "sooty", name: "🏭 그을린 숲", small: "매연으로 검어진 나무껍질 (1900년 무렵 맨체스터)" }, { k: "recover", name: "🌱 다시 맑아지는 숲", small: "대기 오염을 줄인 뒤 (1970년 이후)" }] },
      { key: "color", label: "나는 어떤 색으로 태어날까", opts: [{ k: "light", name: "⚪ 밝은형", small: "흰 바탕에 검은 점" }, { k: "dark", name: "⚫ 검은형", small: "온몸이 검다" }] }
    ],
    go: "🐛 날개 펴기",
    src: "근거: 케틀웰(Kettlewell, 1955·1956)의 표지-재포획 실험(그을린 숲에서는 검은형이, 깨끗한 숲에서는 밝은형이 약 2배 더 다시 잡힘), 머저러스(Majerus)의 2001~2007년 새 포식 관찰(Cook 외, 2012). 맨체스터에서 검은형은 1848년 처음 기록되었고 1895년 무렵 약 98%에 이르렀다가, 대기 오염을 줄인 1970년대 뒤로 줄어들었습니다. "
      + "<b>단순화한 모형</b>입니다: 날마다 잡힐 확률(색이 맞으면 6%, 안 맞으면 8%)은 실제 세대마다의 선택 세기(약 0.1~0.3)에 맞춘 값이고, 검은형이 우성 유전된다는 것은 넣지 않았습니다(자손은 부모 색을 그대로 닮는다고 봄).",
    live: function (p, sd) {
      var rnd = rng(sd), f = p.forest, rows = [], names = ["나", "형제 1", "형제 2", "형제 3", "형제 4"];
      var cols = [p.color]; for (var k = 0; k < 4; k++) cols.push(rnd() < MOTH_SIB[f] ? "dark" : "light");
      var lives = cols.map(function (c) { return mothLife(c, f, rnd); });
      var COL = { light: "#e9e2cc", dark: "#3b3b3b" }, EAT = "#d92d20";
      cols.forEach(function (c, ri) {
        var d = lives[ri], cells = [];
        for (var i = 0; i < 10; i++) cells.push(i < d ? { c: COL[c], t: (i + 1) + "일째 살아 있음" } : i === d ? { c: EAT, t: (i + 1) + "일째 새에게 잡힘" } : { c: "var(--line)" });
        rows.push({ name: names[ri], small: (c === "dark" ? "⚫ 검은형" : "⚪ 밝은형"), me: ri === 0, label: ri === 1 ? "같은 날 알에서 나온 형제 넷 (색이 섞여 있음)" : "", cells: cells,
          ct: function (i) { return i < d ? (i + 1) + "일째 살아 있음" : (d >= 10 ? "열흘을 다 살았다" : (d + 1) + "일째 잡힘"); } });
      });
      var mine = lives[0], log = {};
      log[Math.min(mine, 9)] = [mine >= 10 ? "<span class='y'>10일째</span>열흘을 다 살았습니다. 짝을 만나 알을 낳을 수 있었습니다." : "<span class='y'>" + (mine + 1) + "일째</span>🐦 새에게 잡혔습니다." + (mine >= 3 ? " 그래도 3일째부터는 짝짓기·알 낳기를 할 수 있었습니다." : " 알을 낳기 전이었습니다.")];
      /* 무리 전체: 이 숲이 60세대 계속되면 검은형 비율 */
      var R = MOTH_RISK[f], wd = Math.pow(1 - R.dark, 10), wl = Math.pow(1 - R.light, 10), q = MOTH_P0[f], pts = [q];
      for (var g = 0; g < 60; g++) { q = q * wd / (q * wd + (1 - q) * wl); pts.push(q); }
      var W = 600, Hh = 90, path = pts.map(function (v, i) { return (i ? "L" : "M") + (i / 60 * W).toFixed(1) + "," + (Hh - 6 - v * (Hh - 12)).toFixed(1); }).join("");
      var y0 = MOTH_Y0[f], half = -1; for (var h = 1; h < pts.length; h++) if ((pts[h - 1] - 0.5) * (pts[h] - 0.5) <= 0) { half = h; break; }
      return {
        n: 10, axis: ["1일", "3", "5", "7", "10일"], legend: [[COL.light, "밝은형이 살아 있음"], [COL.dark, "검은형이 살아 있음"], [EAT, "새에게 잡힘"]],
        rows: rows, log: log,
        stops: { 2: "사흘째입니다. 다섯 마리 가운데 누가 남았나요? 같은 색인데도 하나는 잡히고 하나는 살아남았다면, 그것은 색 때문일까요, 운 때문일까요?" },
        now: function (i) { var alive = lives.filter(function (d) { return d > i; }).length; return [["날", (i + 1) + "일째"], ["숲", MOTH_FOREST[f]], ["다섯 마리 중 살아 있음", alive + "마리"]]; },
        end: "<h4 style='margin:0 0 4px'>🦋 열흘이 지났습니다</h4><p>나(" + (p.color === "dark" ? "검은형" : "밝은형") + ")는 <b>" + (mine >= 10 ? "열흘을 다 살았습니다" : (mine + 1) + "일째 잡혔습니다") + "</b>. 한 마리의 삶은 운이 크게 좌우합니다. 그런데 무리 전체는 어떨까요? 이 숲이 해마다(한 세대 = 1년) 이어진다면 검은형의 비율은:</p>"
          + "<svg class='lk-spark' viewBox='0 0 " + W + " " + Hh + "' preserveAspectRatio='none'><line x1='0' y1='" + (Hh / 2) + "' x2='" + W + "' y2='" + (Hh / 2) + "' stroke='var(--line)' stroke-dasharray='4 4'/><path d='" + path + "' fill='none' stroke='#3b3b3b' stroke-width='3'/></svg>"
          + "<p class='lk-note'>" + y0 + "년 " + Math.round(MOTH_P0[f] * 100) + "% → " + (y0 + 60) + "년 " + Math.round(pts[60] * 100) + "% (가운데 점선 = 50%)" + (half > 0 ? " · 50%를 넘나든 때: 약 " + (y0 + half) + "년" : "") + "</p>"
      };
    },
    crowd: function (p, sd) {
      var rnd = rng(sd + 77), L = [], D = [];
      for (var i = 0; i < 30; i++) { L.push(mothLife("light", p.forest, rnd)); D.push(mothLife("dark", p.forest, rnd)); }
      var bl = 0, bd = 0; for (var j = 0; j < 1000; j++) { bl += mothLife("light", p.forest, rnd); bd += mothLife("dark", p.forest, rnd); }
      return { label: MOTH_FOREST[p.forest] + "에서 밝은형 30마리 · 검은형 30마리가 산 날 수 (1,000마리씩 살리면 평균: 밝은형 " + f1(bl / 1000) + "일 · 검은형 " + f1(bd / 1000) + "일)", sets: [{ name: "⚪ 밝은형 30마리", c: "#cfc6a8", v: L }, { name: "⚫ 검은형 30마리", c: "#3b3b3b", v: D }], unit: "일", bin: 1,
        q: "두 무더기는 많이 겹칩니다. 그런데도 수십 세대가 지나면 숲 색에 맞는 형이 무리를 차지했습니다. ‘조금 더 오래 사는 쪽이 조금 더 많은 자손을 남긴다’는 것으로 어떻게 설명할 수 있을까요?" };
    }
  };

  /* =========================================================================
     🦠 유행 속 한 사람 — 진해의 한 동네(1,000명)에서 감염병 유행 120일
     SIR 모형: 앓는 기간 7일, 하루 전파 β = R₀/7 × (1−접촉 줄이기), 백신은 맞은 사람의 90%를 감염에서 지킨다(가정).
     ========================================================================= */
  var DIS = { flu: { name: "계절 독감", r0: 1.3 }, covid: { name: "코로나19 초기", r0: 2.5 }, measles: { name: "홍역", r0: 15 } };
  function town(p, rnd, track) {   /* track 명의 사람(앞쪽 번호)은 하루하루 상태를 남긴다 */
    var N = 1000, D = 7, R0 = DIS[p.dis].r0, beta = R0 / D * (1 - p.dist), v = p.vac / 100, eff = 0.9;
    var st = new Array(N), vac = new Array(N), inf = 0, i;   /* 0 걸릴 수 있음, 1 앓는 중(남은 날), -1 회복, -2 백신으로 지켜짐 */
    for (i = 0; i < N; i++) { vac[i] = i === 0 && p.me !== "rand" ? p.me === "yes" : rnd() < v; st[i] = vac[i] && rnd() < eff ? -2 : 0; }
    var days = 120, hist = [], cum = 0, I = 0, rec = [], k;
    for (k = 0; k < track; k++) rec.push([]);
    var left = new Array(N); for (i = 0; i < N; i++) left[i] = 0;
    var seeds = 0; while (seeds < 3) { var x = track + Math.floor(rnd() * (N - track)); if (st[x] === 0) { st[x] = 1; left[x] = D; seeds++; I++; cum++; } }
    var infectedBy = 0, myDay = -1;
    for (var d = 0; d < days; d++) {
      var pInf = 1 - Math.exp(-beta * I / N), newly = [];
      for (i = 0; i < N; i++) if (st[i] === 0 && rnd() < pInf) newly.push(i);
      for (i = 0; i < N; i++) if (st[i] === 1) { left[i]--; if (left[i] <= 0) st[i] = -1; }
      newly.forEach(function (j) { st[j] = 1; left[j] = D; if (j === 0) myDay = d; });
      cum += newly.length; I = 0; for (i = 0; i < N; i++) if (st[i] === 1) I++;
      hist.push({ I: I, cum: cum });
      for (k = 0; k < track; k++) rec[k].push(st[k]);
    }
    return { hist: hist, rec: rec, vac: vac.slice(0, track), cum: cum, myDay: myDay, R0: R0 };
  }
  var EPI = {
    id: "epi", title: "🦠 유행 속 한 사람으로 살아 보기 — 진해의 한 동네",
    sub: "진해의 한 동네에 <b>1,000명</b>이 삽니다. 어느 날 바깥에서 감염된 사람 3명이 들어왔습니다. 나와 친구 넷은 이 동네에서 <b>120일</b>을 지냅니다. 병의 전파력(R₀), 백신을 맞은 비율, 접촉을 얼마나 줄이는지에 따라 유행은 어떻게 달라질까요?",
    choices: [
      { key: "dis", label: "어떤 병일까 (R₀ = 한 사람이 아무 대책 없을 때 옮기는 평균 사람 수)", opts: [{ k: "flu", name: "🤧 계절 독감", small: "R₀ ≈ 1.3" }, { k: "covid", name: "😷 코로나19 초기", small: "R₀ ≈ 2.5" }, { k: "measles", name: "🔴 홍역", small: "R₀ ≈ 15" }], def: 1 },
      { key: "vac", label: "동네 사람 가운데 백신을 맞은 비율", opts: [{ k: 0, name: "0%" }, { k: 50, name: "50%" }, { k: 80, name: "80%" }, { k: 95, name: "95%" }] },
      { key: "dist", label: "모두가 접촉을 얼마나 줄일까", opts: [{ k: 0, name: "평소대로" }, { k: 0.4, name: "40% 줄이기", small: "모임·마스크·손 씻기" }] },
      { key: "me", label: "나는", opts: [{ k: "rand", name: "동네 비율대로" }, { k: "yes", name: "💉 백신을 맞았다" }, { k: "no", name: "백신을 안 맞았다" }] }
    ],
    go: "🏘 동네에서 살기",
    src: "근거: 감염병 수리 모형(SIR, Kermack–McKendrick 1927). R₀ 는 대표값입니다(계절 독감 약 1.2~1.4, 코로나19 초기 약 2~3, 홍역 약 12~18). 집단 면역 문턱 = 1 − 1/R₀. "
      + "<b>단순화한 모형</b>입니다: 앓는 기간은 모두 7일, 동네 사람은 고르게 섞여 만나고, 백신은 맞은 사람의 90%를 감염에서 지킨다고 가정했습니다(실제 효과는 병과 백신마다 다름). 증상의 무게·사망은 다루지 않습니다. 진해의 실제 유행 자료가 아닙니다.",
    live: function (p, sd) {
      var rnd = rng(sd), T = town(p, rnd, 5), n = 40, per = 3, names = ["나", "친구 1", "친구 2", "친구 3", "친구 4"];
      var C = { s: "var(--card-2)", i: "#d92d20", r: "#12b76a", v: "#84caff" }, rows = [];
      function cellOf(rec, k) { var a = rec.slice(k * per, k * per + per); return a.indexOf(1) >= 0 ? { c: C.i, t: "앓는 중" } : a[a.length - 1] === -1 ? { c: C.r, t: "회복(면역)" } : a[0] === -2 ? { c: C.v, t: "백신으로 지켜짐" } : { c: C.s, t: "걸릴 수 있음" }; }
      T.rec.forEach(function (rec, ri) {
        var cells = []; for (var k = 0; k < n; k++) cells.push(cellOf(rec, k));
        var first = rec.indexOf(1);
        rows.push({ name: names[ri], small: T.vac[ri] ? "💉 백신 맞음" : "백신 안 맞음", me: ri === 0, label: ri === 1 ? "나와 같은 반 친구 넷" : "", cells: cells,
          ct: function (k) { var d = k * per + per - 1; return first >= 0 && first <= d ? (first + 1) + "일째 걸림" : rec[0] === -2 ? "지켜짐" : "아직 안 걸림"; } });
      });
      var peak = 0, peakDay = 0; T.hist.forEach(function (h, d) { if (h.I > peak) { peak = h.I; peakDay = d; } });
      var tc = []; for (var k2 = 0; k2 < n; k2++) { var m = 0; for (var d2 = k2 * per; d2 < k2 * per + per; d2++) m = Math.max(m, T.hist[d2].I); tc.push({ c: "rgba(217,45,32," + Math.min(1, 0.08 + m / Math.max(30, peak)) + ")", t: "앓는 사람 최대 " + m + "명" }); }
      rows.push({ name: "동네 1,000명", small: "진할수록 앓는 사람이 많음", label: "동네 전체", cells: tc, ct: function (k) { return "누적 " + T.hist[Math.min(119, k * per + per - 1)].cum + "명"; } });
      var log = {}, pk = Math.floor(peakDay / per);
      if (T.myDay >= 0) (log[Math.floor(T.myDay / per)] = log[Math.floor(T.myDay / per)] || []).push("<span class='y'>" + (T.myDay + 1) + "일째</span>😷 내가 감염되었습니다. 7일 동안 앓고 회복합니다.");
      if (peak >= 10) (log[pk] = log[pk] || []).push("<span class='y'>" + (peakDay + 1) + "일째</span>📈 유행의 정점 — 동시에 앓는 사람 " + peak + "명");
      var stops = {}; if (peak >= 10 && pk < n - 1) stops[pk] = "유행의 정점입니다(동시에 앓는 사람 " + peak + "명). 지금 걸리지 않은 사람이 많은데도 이제부터 앓는 사람이 줄어드는 까닭은 무엇일까요?";
      stops[19] = stops[19] || "60일이 지났습니다. 나와 친구 넷 가운데 걸린 사람과 안 걸린 사람을 갈라 보세요. 백신을 맞았는지와 관계가 있나요, 아니면 운이 더 컸나요?";
      var thr = Math.max(0, 1 - 1 / T.R0), eff = p.vac / 100 * 0.9;
      return {
        n: n, axis: ["1일", "30", "60", "90", "120일"], legend: [[C.s, "걸릴 수 있음"], [C.i, "앓는 중"], [C.r, "회복(면역)"], [C.v, "백신으로 지켜짐"]], rows: rows, log: log, stops: stops,
        now: function (k) { var d = Math.min(119, k * per + per - 1), h = T.hist[d]; return [["날", (d + 1) + "일째"], ["지금 앓는 사람", h.I + "명"], ["지금까지 걸린 사람", h.cum + "명"]]; },
        end: "<h4 style='margin:0 0 4px'>🏘 120일이 지났습니다</h4><p>나는 <b>" + (T.myDay >= 0 ? (T.myDay + 1) + "일째에 걸렸습니다" : "끝까지 걸리지 않았습니다") + "</b>. 동네 1,000명 가운데 <b>" + T.cum + "명</b>이 걸렸습니다.</p>"
          + "<table><tr><th>" + DIS[p.dis].name + " (R₀ " + T.R0 + ")</th><th>값</th></tr><tr><td>집단 면역 문턱 (1 − 1/R₀)</td><td>" + Math.round(thr * 100) + "%</td></tr><tr><td>이 동네에서 백신으로 실제 지켜진 비율 (맞은 비율 × 90%)</td><td>" + Math.round(eff * 100) + "%</td></tr><tr><td>접촉 줄이기</td><td>" + (p.dist ? Math.round(p.dist * 100) + "%" : "없음") + "</td></tr></table>"
          + "<p class='lk-note'>지켜진 비율이 문턱을 넘으면 유행이 크게 번지지 못합니다. 홍역(R₀ 15)의 문턱이 93%나 되는 까닭이 여기에 있습니다.</p>"
      };
    },
    crowd: function (p, sd) {
      var rnd = rng(sd + 5), a = [], b = [], q = JSON.parse(JSON.stringify(p)); q.me = "rand";
      var z = JSON.parse(JSON.stringify(q)); z.vac = 0; z.dist = 0;
      for (var i = 0; i < 30; i++) { a.push(town(q, rnd, 0).cum / 10); b.push(town(z, rnd, 0).cum / 10); }
      var same = p.vac === 0 && p.dist === 0;
      return { label: "같은 조건의 동네 30곳 — 120일 동안 걸린 사람의 비율(%)", sets: same ? [{ name: "고른 조건(백신 0%·평소대로)", c: "#d92d20", v: a }] : [{ name: "고른 조건", c: "#12b76a", v: a }, { name: "대책 없을 때(백신 0%·평소대로)", c: "#d92d20", v: b }], unit: "%", bin: 5,
        q: "같은 병, 같은 조건인데도 어떤 동네는 거의 번지지 않고 어떤 동네는 크게 번졌나요? R₀ 가 1에 가까운 병에서 특히 그런 까닭은 무엇일까요?" };
    }
  };

  /* =========================================================================
     ⭐ 별 하나 — 같은 성운에서 태어난 별 다섯
     질량은 초기 질량 함수(Kroupa 2001: 0.08~0.5 M☉ 에서 M^-1.3, 0.5~100 M☉ 에서 M^-2.3)대로 뽑거나 고른다.
     주계열 수명 ≈ 100억 년 × (M/M☉)^-2.5, 끝: 0.5 M☉ 미만 = 아직 아무도 죽지 않음(수명이 우주 나이보다 김), 0.5~8 = 백색 왜성, 8~20 = 초신성 → 중성자별, 20 이상 = 초신성 → 블랙홀 (단순화)
     ========================================================================= */
  function imf(rnd) {   /* 구간별 거듭제곱 분포에서 질량 하나 */
    var a1 = 1.3, a2 = 2.3, m0 = 0.08, m1 = 0.5, m2 = 100;
    function I(a, lo, hi) { return (Math.pow(hi, 1 - a) - Math.pow(lo, 1 - a)) / (1 - a); }
    var k2 = Math.pow(m1, a2 - a1), w1 = I(a1, m0, m1), w2 = k2 * I(a2, m1, m2), u = rnd() * (w1 + w2);
    function inv(a, lo, v) { return Math.pow(Math.pow(lo, 1 - a) + v * (1 - a), 1 / (1 - a)); }
    return u < w1 ? inv(a1, m0, u) : inv(a2, m1, (u - w1) / k2);
  }
  function starOf(M) {
    var ms = Math.max(3e6, 1e10 * Math.pow(M, -2.5)), pre = Math.max(1e5, 5e7 * Math.pow(M, -1.5)), giant = ms * 0.1;
    var fate = M < 0.5 ? "rd" : M < 8 ? "wd" : M < 20 ? "ns" : "bh";
    var col = M >= 10 ? "#5b8def" : M >= 2 ? "#a9c7ff" : M >= 1.05 ? "#fff6d6" : M >= 0.8 ? "#ffd166" : M >= 0.45 ? "#ffa94d" : "#ff6b4a";
    return { M: M, pre: pre, ms: ms, end: pre + ms + giant, fate: fate, col: col };
  }
  var FATE = { rd: "적색 왜성으로 아주 오래 빛남", wd: "행성상 성운 → 백색 왜성", ns: "초신성 → 중성자별", bh: "초신성 → 블랙홀" };
  var UNIV = 1.38e10, SUNAGE = 4.6e9;
  var STAR = {
    id: "star", title: "⭐ 별 하나로 태어나 보기 — 질량이 정하는 한살이",
    sub: "거대한 분자 구름(성운)이 무너지며 별 다섯이 함께 태어납니다. 별의 한살이는 거의 <b>처음 질량 하나</b>로 정해집니다. 우리은하에서 실제로 태어나는 비율대로 질량을 뽑거나, 직접 골라 보세요. 시간 눈금은 10만 년에서 1조 년까지 <b>10배씩</b> 늘어납니다.",
    choices: [{ key: "m", label: "내 질량 (태양 질량 M☉ 단위)", opts: [{ k: "imf", name: "🎲 우리은하처럼 무작위", small: "실제로 태어나는 비율대로" }, { k: 0.3, name: "0.3 M☉", small: "적색 왜성" }, { k: 1, name: "1 M☉", small: "태양과 같음" }, { k: 3, name: "3 M☉" }, { k: 12, name: "12 M☉" }, { k: 30, name: "30 M☉" }] }],
    go: "🌌 성운에서 태어나기",
    src: "근거: 초기 질량 함수 Kroupa(2001), 주계열 수명 ≈ 100억 년 × (M/M☉)^−2.5(질량-광도 관계 L ∝ M^3.5 에서), 우주 나이 약 138억 년(Planck 2018). "
      + "<b>단순화한 모형</b>입니다: 원시별 시간(5000만 년 × M^−1.5)·거성 시간(주계열의 10%)은 어림값이고, 백색 왜성·중성자별·블랙홀을 가르는 질량(8 M☉, 20 M☉)은 실제로는 금속 함량·자전·쌍성 여부에 따라 달라집니다. 0.08 M☉ 보다 가벼운 갈색 왜성은 넣지 않았습니다.",
    live: function (p, sd) {
      var rnd = rng(sd), ms = [p.m === "imf" ? imf(rnd) : p.m]; for (var k = 0; k < 4; k++) ms.push(imf(rnd));
      var S = ms.map(starOf), n = 40, lo = 5, hi = 13;   /* 10^5 ~ 10^13 년 */
      function tAt(i) { return Math.pow(10, lo + (hi - lo) * (i + 1) / n); }
      var REM = { wd: "#d0d5dd", ns: "#9b8afb", bh: "#101828" }, GI = "#7a271a", PRE = "#fdb022", names = ["나", "별 1", "별 2", "별 3", "별 4"];
      function stage(s, t) {   /* 적색 왜성은 부풀지 않고, 수소를 다 쓰면(아주 먼 미래) 백색 왜성이 된다 */
        if (t < s.pre) return ["pre", PRE, "원시별"];
        if (t < s.pre + s.ms) return ["ms", s.col, "주계열성 (수소를 태움)"];
        if (s.fate === "rd") return ["wd", REM.wd, "백색 왜성 (아직 우주에 없는 먼 미래)"];
        if (t < s.end) return ["gi", GI, "거성"];
        return [s.fate, REM[s.fate], s.fate === "wd" ? "백색 왜성" : s.fate === "ns" ? "중성자별" : "블랙홀"];
      }
      var rows = S.map(function (s, ri) {
        var cells = []; for (var i = 0; i < n; i++) { var g = stage(s, tAt(i)); cells.push({ c: g[1], t: yrs(tAt(i)) + ": " + g[2] }); }
        return { name: names[ri] + " · " + (s.M < 1 ? s.M.toFixed(2) : f1(s.M)) + " M☉", small: FATE[s.fate], me: ri === 0, label: ri === 1 ? "같은 성운에서 함께 태어난 별 넷 (우리은하처럼 무작위)" : "", cells: cells,
          ct: function (i) { return stage(s, tAt(i))[2]; } };
      });
      var me = S[0], log = {}, iOf = function (t) { return Math.max(0, Math.min(n - 1, Math.ceil((Math.log10(t) - lo) / (hi - lo) * n) - 1)); };
      function add(t, h) { if (t > tAt(n - 1)) return; var i = iOf(t); (log[i] = log[i] || []).push("<span class='y'>" + yrs(t) + "</span>" + h); }
      add(me.pre, "🔥 중심에서 수소 핵융합이 시작되어 주계열성이 되었습니다.");
      add(me.pre + me.ms, me.fate === "rd" ? "수소를 거의 다 썼습니다 — 그런데 이 시각은 우주 나이(138억 년)보다 훨씬 뒤입니다." : "🔴 중심의 수소를 다 써서 부풀어 오릅니다(거성).");
      if (me.fate !== "rd") add(me.end, me.fate === "wd" ? "🌫 바깥층을 날려 보내(행성상 성운) 백색 왜성이 남았습니다." : "💥 초신성 폭발! 철보다 무거운 원소를 우주에 흩뿌리고 " + (me.fate === "ns" ? "중성자별" : "블랙홀") + "이 남았습니다.");
      var stops = {}; stops[iOf(SUNAGE)] = "지금 태양의 나이(46억 년)를 막 지났습니다. 다섯 별은 각각 어떤 상태인가요? 가장 무거운 별과 가장 가벼운 별을 견주어 보세요.";
      stops[iOf(UNIV)] = "지금 우주의 나이(138억 년)를 막 지났습니다. 지금까지 한살이를 끝낸 별은 몇 개인가요? 가벼운 별 가운데 지금까지 ‘죽은’ 별이 하나도 없는 까닭은 무엇일까요?";
      return {
        n: n, axis: ["10만 년", "1000만", "10억", "1000억", "1조 년"], legend: [[PRE, "원시별"], ["#ffd166", "주계열(색 = 겉 온도)"], [GI, "거성"], [REM.wd, "백색 왜성"], [REM.ns, "중성자별"], [REM.bh, "블랙홀"]], rows: rows, log: log, stops: stops,
        now: function (i) { var t = tAt(i); return [["나이", yrs(t)], ["나", stage(me, t)[2]], ["우주 나이와 견주면", t > UNIV ? "우주보다 " + f1(t / UNIV) + "배 늙음" : Math.round(t / UNIV * 100) + "%"]]; },
        end: "<h4 style='margin:0 0 4px'>⭐ 내 별: " + (me.M < 1 ? me.M.toFixed(2) : f1(me.M)) + " M☉</h4><p>주계열 수명 약 <b>" + yrs(me.ms) + "</b> · 끝: <b>" + FATE[me.fate] + "</b>. " + (me.fate === "rd" ? "이 별은 우주가 지금보다 훨씬 늙을 때까지 빛납니다. 우리은하 별의 대부분이 이런 작은 별입니다." : me.fate === "wd" ? "태양도 약 50억 년 뒤 이 길을 걷습니다." : "무거운 별은 짧고 굵게 삽니다 — 그리고 그 폭발에서 생긴 원소가 다음 세대 별과 행성(그리고 우리 몸)을 만듭니다.") + "</p>"
      };
    },
    crowd: function (p, sd) {
      var rnd = rng(sd + 3), c = { rd: 0, wd: 0, ns: 0, bh: 0 }, big = { rd: 0, wd: 0, ns: 0, bh: 0 };
      for (var i = 0; i < 30; i++) c[starOf(imf(rnd)).fate]++;
      for (var j = 0; j < 10000; j++) big[starOf(imf(rnd)).fate]++;
      return { label: "우리은하처럼 별 30개를 태어나게 하면 — 끝이 어떻게 갈릴까", cat: ["적색 왜성(아직 아무도 안 죽음)", "백색 왜성", "중성자별", "블랙홀"],
        sets: [{ name: "별 30개", v: [c.rd, c.wd, c.ns, c.bh], of: 30 }, { name: "별 1만 개", v: [big.rd, big.wd, big.ns, big.bh], of: "1만" }],
        q: "30개만 태어나게 하면 초신성이 될 별은 대개 하나도 나오지 않습니다. 그런데도 우리 몸의 철·금 같은 원소가 초신성에서 왔다면, 우리은하에서는 얼마나 많은 별이 태어나고 죽어 왔다는 뜻일까요?" };
    }
  };

  /* =========================================================================
     ⚛️ 원자 하나 — 방사성 동위 원소 하나의 붕괴
     한 원자가 언제 붕괴할지는 알 수 없다(지수 분포). 원자가 많으면 반감기마다 거의 정확히 절반이 남는다.
     ========================================================================= */
  var ISO = {
    c14: { name: "탄소-14", hl: 5730, d: "질소-14", use: "생물 화석·유물(약 5만 년까지)", end: "남은 탄소-14 의 비율로 나무·뼈·조개껍데기 같은 유물의 나이를 잽니다." },
    k40: { name: "칼륨-40", hl: 1.25e9, d: "아르곤-40·칼슘-40", use: "화산암(수천만~수십억 년)", end: "화산암 속 칼륨-40 과 아르곤-40 의 비율로 암석이 굳은 때를 잽니다." },
    u238: { name: "우라늄-238", hl: 4.47e9, d: "(여러 단계를 거쳐) 납-206", use: "지구·운석의 나이", end: "우라늄과 납의 비율로 가장 오래된 암석과 운석, 곧 지구의 나이(약 45억 년)를 잽니다." },
    i131: { name: "아이오딘-131", hl: 8.02 / 365.25, d: "제논-131", use: "의료(갑상샘 검사·치료)", end: "병원에서는 이 규칙으로 몸 안에 남은 양이 언제 얼마로 줄지 미리 셉니다." }
  };
  function decay(rnd) { return -Math.log(1 - rnd()) / Math.LN2; }   /* 반감기 단위의 붕괴 시각 */
  var ATOM = {
    id: "atom", title: "⚛️ 원자 하나로 살아 보기 — 반감기의 정체",
    sub: "나는 방사성 원자 하나입니다. 언제 붕괴해 다른 원소(자원소)가 될지는 <b>아무도 모릅니다</b>. 그런데 원자 1,000개를 함께 두면 반감기마다 거의 정확히 절반이 남습니다. 한 원자의 ‘운’과 많은 원자의 ‘규칙’을 함께 보세요. 시간 눈금은 반감기 단위(0~5번)입니다.",
    choices: [{ key: "iso", label: "어떤 원자로 태어날까", opts: Object.keys(ISO).map(function (k) { var x = ISO[k]; return { k: k, name: x.name, small: "반감기 " + yrs(x.hl) + " · " + x.use }; }) }],
    go: "⚛️ 원자로 태어나기",
    src: "근거: 방사성 붕괴는 원자마다 서로 무관하게 일정한 확률로 일어난다(붕괴 시각은 지수 분포, N = N₀(1/2)^(t/T)). 반감기: 탄소-14 5,730년, 칼륨-40 12.5억 년, 우라늄-238 44.7억 년, 아이오딘-131 8.02일. "
      + "우라늄-238 은 실제로는 여러 단계를 거쳐 납-206 이 되지만, 첫 단계(가장 느림)만 보았습니다.",
    live: function (p, sd) {
      var rnd = rng(sd), X = ISO[p.iso], n = 40, H = 5, ts = []; for (var k = 0; k < 5; k++) ts.push(decay(rnd));
      var many = []; for (var j = 0; j < 1000; j++) many.push(decay(rnd));
      function tAt(i) { return (i + 1) / n * H; }
      var A = "#7f56d9", B = "#d0d5dd", names = ["나", "원자 1", "원자 2", "원자 3", "원자 4"];
      var rows = ts.map(function (t, ri) {
        var cells = []; for (var i = 0; i < n; i++) cells.push(tAt(i) < t ? { c: A, t: X.name } : { c: B, t: X.d + "(으)로 바뀜" });
        return { name: names[ri], small: X.name, me: ri === 0, label: ri === 1 ? "함께 있는 같은 원자 넷" : "", cells: cells, ct: function (i) { return tAt(i) < t ? "아직 " + X.name : "붕괴함 (" + f1(t) + "반감기)"; } };
      });
      var left = function (i) { var c = 0; for (var q = 0; q < 1000; q++) if (many[q] > tAt(i)) c++; return c; };
      var mc = []; for (var i2 = 0; i2 < n; i2++) { var L = left(i2); mc.push({ c: "rgba(127,86,217," + (0.08 + 0.92 * L / 1000) + ")", t: "남은 원자 " + L + "개" }); }
      rows.push({ name: "원자 1,000개", small: "진할수록 많이 남음", label: "같은 원자 1,000개를 함께 두면", cells: mc, ct: function (i) { return left(i) + "개 남음"; } });
      var me = ts[0], log = {}, mi = Math.min(n - 1, Math.max(0, Math.ceil(me / H * n) - 1));
      if (me <= H) log[mi] = ["<span class='y'>" + yrs(me * X.hl) + " 뒤</span>💥 내가 붕괴해 " + X.d + "(으)로 바뀌었습니다."];
      var stops = {}; stops[7] = "반감기 1번(" + yrs(X.hl) + ")이 지났습니다. 원자 1,000개 가운데 몇 개가 남았나요? 나는 남았나요? ‘반감기가 지나면 원자가 반으로 쪼개진다’는 말은 맞을까요?";
      stops[23] = "반감기 3번이 지났습니다. 1,000개는 이론으로 125개가 남아야 합니다. 실제 남은 수와 견주어 보세요. 원자 다섯 개만으로 반감기를 잴 수 있을까요?";
      return {
        n: n, axis: ["0", "1", "2", "3", "4", "5번"], legend: [[A, X.name + " (아직 붕괴 안 함)"], [B, X.d + " (붕괴함)"]], rows: rows, log: log, stops: stops,
        now: function (i) { var t = tAt(i); return [["지난 시간", yrs(t * X.hl)], ["반감기", f1(t) + "번"], ["1,000개 중 남음", left(i) + "개 (이론 " + Math.round(1000 * Math.pow(0.5, t)) + ")"]]; },
        end: "<h4 style='margin:0 0 4px'>⚛️ 나의 붕괴</h4><p>나는 <b>" + (me <= H ? yrs(me * X.hl) + " 뒤(반감기 " + f1(me) + "번)" : "반감기 5번이 지나도록") + "</b> " + (me <= H ? "붕괴했습니다." : "붕괴하지 않았습니다(32개 중 1개꼴로 일어나는 일).") + " 한 원자는 예측할 수 없지만, 많은 원자는 시계처럼 정확합니다. " + X.end + "</p>"
      };
    },
    crowd: function (p, sd) {
      var rnd = rng(sd + 9), v = []; for (var i = 0; i < 30; i++) v.push(Math.min(6, decay(rnd)));
      return { label: ISO[p.iso].name + " 원자 30개가 붕괴할 때까지 걸린 시간 (반감기 단위, 6 이상은 6에)", sets: [{ name: "원자 30개", c: "#7f56d9", v: v }], unit: "반감기", bin: 0.5,
        q: "막대가 왼쪽에 많고 오른쪽으로 갈수록 줄어듭니다. 왜 ‘반감기 1번 근처’에 몰리지 않을까요? 반감기는 한 원자의 수명이 아니라 무엇을 말하는 값일까요?" };
    }
  };

  window.sthLife = {
    moth: function (o) { engine(o, MOTH); }, epi: function (o) { engine(o, EPI); },
    star: function (o) { engine(o, STAR); }, atom: function (o) { engine(o, ATOM); }
  };
})();
