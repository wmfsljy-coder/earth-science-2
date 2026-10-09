/* =========================================================================
   🔬 교과서 실험 — 교과서에 실린 실험을 시뮬레이션으로 해 보고, 하나만 바꿔 내 탐구로. theme.js 다음에 불러온다.

     sthInquiry({ mount: "inq", key: "inq", result: "rInq", items: [ {
       id: "e1", book: "과학탐구실험1", page: 20, title: "…", purpose: "…", steps: ["…"],     // 교과서 실험을 짧게 줄인 것(교과서 문장을 옮기지 않는다)
       iv: "조작 변인", dv: "종속 변인", cv: ["통제 변인"], safety: "", extend: ["하나만 바꿔 볼 거리"],
       sim: { kind: "iframe", url: "…", h: 560, name: "PhET …", ivControl: "화면에서 바꾸는 곳", dvReading: "읽는 값",
              x: { label: "…", unit: "…" }, y: { label: "…", unit: "…" } }                  // 바깥 시뮬레이션: 학생이 읽은 값을 표에 적는다
         | { kind: "model", name: "가상 실험", inputs: [{ k, label, unit, min, max, step, value }], choices: [{ k, label, opts: [["이름", 값], …], value }],
             outputs: [{ k, label, unit, expr: "JS 식(입력 k 와 Math)", dp: 2 }], noise: 0.02, note: "모형 설명" }   // 우리 가상 실험: 측정을 누르면 계산값(+작은 오차)이 쌓인다
     } ] });

   한 실험의 흐름: ① 교과서 실험 읽기 ② 변인 찾기 → 교과서와 견주기 ③ 시뮬레이션으로 교과서 실험 ④ 하나만 바꿔 내 탐구 질문·가설
   ⑤ 시뮬레이션으로 내 탐구(가상 실험은 표에서 바뀐 입력을 스스로 찾아 ‘하나만 바꿨는지’ 점검) ⑥ 결론과 점검 → 보고서.
   기록: sthState(key)[id] = { g, rv, a:[행], q, b:[행], c, ok }.  결과 줄: sthState(result) = "교과서 실험 n/m 탐구 완료".
   ========================================================================= */
(function () {
  "use strict";
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function num(v) { var x = parseFloat(String(v).replace(/,/g, "")); return isNaN(x) ? null : x; }
  function gauss() { var u = 1 - Math.random(), v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
  function near(a, b) { a = String(a || "").replace(/\s/g, ""); b = String(b || "").replace(/\s/g, ""); if (!a || !b) return false; var k = Math.min(3, a.length, b.length); return a.indexOf(b.slice(0, k)) >= 0 || b.indexOf(a.slice(0, k)) >= 0; }

  if (!document.getElementById("inq-css")) {
    var css = document.createElement("style"); css.id = "inq-css";
    css.textContent = ".inq-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:10px;margin:0 0 16px}"
      + ".inq-c{border:2px solid var(--line);border-radius:14px;padding:10px 12px;background:var(--card);cursor:pointer;font-size:13.5px;text-align:left;font:inherit}.inq-c.on{border-color:var(--brand,#0ea5e9);box-shadow:0 0 0 3px rgba(14,165,233,.15)}.inq-c.done{border-color:var(--green-700,#15803d)}"
      + ".inq-c b{display:block;font-size:14.5px;margin:4px 0}.inq-pill{display:inline-block;font-size:11.5px;font-weight:800;border-radius:999px;padding:1px 8px;margin-right:4px;border:1px solid var(--line);background:var(--panel)}"
      + ".inq-step{background:var(--card);border:2px solid var(--line);border-radius:18px;padding:14px 18px;margin:12px 0}.inq-step h4{margin:0 0 8px;font-size:16px;display:flex;gap:8px;align-items:center}"
      + ".inq-n{display:inline-flex;width:24px;height:24px;border-radius:50%;background:var(--brand,#0ea5e9);color:#fff;align-items:center;justify-content:center;font-size:12.5px}"
      + ".inq-tb{background:var(--panel);border-radius:12px;padding:10px 14px;font-size:14px;line-height:1.7}.inq-tb ol{margin:4px 0 0 20px;padding:0}.inq-sub{font-size:13px;color:var(--mist);margin:0 0 8px;line-height:1.6}"
      + ".inq-g{display:grid;grid-template-columns:150px 1fr;gap:6px 10px;align-items:center;font-size:14px}.inq-step input[type=text],.inq-step select,.inq-step textarea{font:inherit;font-size:14px;padding:6px 10px;border:1px solid var(--line);border-radius:10px;background:var(--panel);color:var(--ink);box-sizing:border-box}"
      + ".inq-g input[type=text]{width:100%}.inq-cmp{margin-top:10px;border-left:4px solid var(--teal,#14b8a6);background:var(--panel);border-radius:0 12px 12px 0;padding:10px 14px;font-size:14px;line-height:1.7}"
      + ".inq-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:6px 0;font-size:14.5px}.inq-row input[type=text]{flex:1;min-width:150px}"
      + ".inq-frame{width:100%;border:2px solid var(--line);border-radius:12px;background:#fff}.inq-ctrl{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:8px 16px;margin:6px 0 10px}"
      + ".inq-ctrl label{font-size:13.5px;font-weight:800;display:block}.inq-ctrl input[type=range]{width:100%}.inq-ctrl .v{font-weight:900;color:var(--brand-700,#0369a1)}"
      + ".inq-meter{display:flex;flex-wrap:wrap;gap:10px;margin:6px 0}.inq-meter div{background:var(--panel);border-radius:12px;padding:8px 14px;font-size:13px}.inq-meter b{display:block;font-size:22px;font-family:'Jua',sans-serif;font-weight:400}"
      + "table.inq-t{border-collapse:collapse;font-size:13.5px;margin:8px 0}table.inq-t th,table.inq-t td{border:1px solid var(--line);padding:4px 10px;text-align:center}table.inq-t th{background:var(--panel)}table.inq-t td.chg{background:rgba(250,204,21,.25)}"
      + "table.inq-t input{width:90px;padding:3px 6px;border:1px solid var(--line);border-radius:6px;font:inherit}.inq-chips{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0}.inq-chip{font:inherit;font-size:13px;font-weight:800;border:1px solid var(--line);border-radius:999px;padding:4px 11px;background:var(--panel);cursor:pointer;color:var(--ink)}"
      + ".inq-ck{list-style:none;padding:0;margin:0;font-size:14.5px}.inq-ck li{padding:3px 0}.inq-ck li.ok::before{content:'✅ '}.inq-ck li.no::before{content:'⚠️ '}.inq-ck small{color:var(--mist)}"
      + ".inq-safe{margin-top:8px;padding:8px 12px;border-radius:10px;background:rgba(239,68,68,.08);font-size:13px}.inq-plan{background:var(--panel);border-radius:12px;padding:12px 14px;font-size:13.5px;line-height:1.7;white-space:pre-wrap}"
      + ".inq-msg{font-size:12.5px;color:var(--mist);margin-left:6px}"
      + ".inq-sec{margin:22px 0 10px}.inq-one{margin:10px 0;border:2px solid #f59e0b;border-radius:16px;background:var(--card);overflow:hidden}"
      + ".inq-head{display:block;width:100%;text-align:left;font:inherit;background:linear-gradient(90deg,rgba(245,158,11,.12),transparent);border:0;padding:12px 16px;cursor:pointer;color:var(--ink)}"
      + ".inq-head b{display:block;font-size:15.5px;margin:6px 0 2px}.inq-tag{display:inline-block;font-size:12px;font-weight:900;color:#fff;background:#d97706;border-radius:999px;padding:2px 10px;margin-right:6px}"
      + ".inq-sub2{display:block;font-size:13px;color:var(--mist)}.inq-open{display:inline-block;margin-top:6px;font-size:13px;font-weight:800;color:#b45309}.inq-body{padding:0 12px 10px}";
    document.head.appendChild(css);
  }

  window.sthInquiry = function (opt) {
    var mount = document.getElementById(opt.mount || "inq"), BYSEC0 = (opt.items || []).some(function (it) { return it.sec; }); if (!mount && !BYSEC0) return; if (!mount) mount = document.createElement("div");
    var KEY = opt.key || "inq", RES = opt.result || "rInq", items = opt.items || [];
    var st = window.sthState(KEY) || {}, cur = null;
    function S(id) { return st[id] || (st[id] = {}); }
    function save() { window.sthState(KEY, st); var n = items.filter(function (it) { return st[it.id] && st[it.id].ok; }).length, any = items.some(function (it) { return st[it.id]; }); window.sthState(RES, any ? "교과서 실험 " + n + "/" + items.length + " 탐구 완료" : null); }
    mount.innerHTML = "";
    if (!items.length) { mount.appendChild(el("p", "inq-sub", "이 단원에는 시뮬레이션으로 해 볼 교과서 실험이 아직 없습니다.")); return; }
    /* 소단원 모드: 실험마다 sec(소단원 번호)가 있으면 그 이야기 탭 끝에 접힌 카드로 붙인다(따로 탭을 두지 않는다) */
    var BYSEC = items.some(function (it) { return it.sec; });
    var list = el("div", "inq-list"), body = el("div");
    if (!BYSEC) { mount.appendChild(list); mount.appendChild(body); }
    function paintList() {
      list.innerHTML = "";
      items.forEach(function (it) {
        var c = el("button", "inq-c" + (it === cur ? " on" : "") + (st[it.id] && st[it.id].ok ? " done" : ""));
        c.type = "button";
        c.innerHTML = "<span class='inq-pill'>📘 " + esc(it.book) + " " + esc(it.page) + "쪽</span><span class='inq-pill'>" + (it.sim.kind === "model" ? "🧮 가상 실험" : "🧪 " + esc(it.sim.name || "시뮬레이션")) + "</span>" + (st[it.id] && st[it.id].ok ? "<span class='inq-pill'>✅ 완료</span>" : "") + "<b>" + esc(it.title) + "</b>" + esc(it.purpose || "");
        c.addEventListener("click", function () { cur = it; paintList(); paint(cur, body); body.scrollIntoView({ block: "start", behavior: "smooth" }); });
        list.appendChild(c);
      });
    }

    /* ---- 가상 실험(모형) ---- */
    function modelBox(it, rowsKey, onChange) {
      var M = it.sim, s = S(it.id), box = el("div"), vals = {};
      (M.inputs || []).forEach(function (p) { vals[p.k] = p.value != null ? p.value : p.min; });
      (M.choices || []).forEach(function (c) { vals[c.k] = c.value != null ? c.value : c.opts[0][1]; });
      var ctrl = el("div", "inq-ctrl"); box.appendChild(ctrl);
      (M.inputs || []).forEach(function (p) {
        var w = el("div"), lab = el("label", null, esc(p.label) + " <span class='v'></span>"), r = el("input"); r.type = "range"; r.min = p.min; r.max = p.max; r.step = p.step || (p.max - p.min) / 100; r.value = vals[p.k];
        function show() { lab.querySelector(".v").textContent = (+r.value) + (p.unit ? " " + p.unit : ""); }
        r.addEventListener("input", function () { vals[p.k] = +r.value; show(); live(); });
        w.appendChild(lab); w.appendChild(r); ctrl.appendChild(w); show();
      });
      (M.choices || []).forEach(function (c) {
        var w = el("div"), lab = el("label", null, esc(c.label)), sel = el("select");
        c.opts.forEach(function (o) { var op = el("option", null, esc(o[0])); op.value = o[1]; sel.appendChild(op); });
        sel.value = vals[c.k]; sel.addEventListener("change", function () { vals[c.k] = isNaN(+sel.value) ? sel.value : +sel.value; live(); });
        w.appendChild(lab); w.appendChild(sel); ctrl.appendChild(w);
      });
      var meter = el("div", "inq-meter"); box.appendChild(meter);
      function calc(noisy) {
        var o = {}, names = Object.keys(vals);
        (M.outputs || []).forEach(function (q) {
          var v; try { v = Function.apply(null, names.concat(["Math", "return (" + q.expr + ");"])).apply(null, names.map(function (n) { return vals[n]; }).concat([Math])); } catch (e) { v = NaN; }
          if (noisy && isFinite(v)) v = v * (1 + (M.noise == null ? 0.02 : M.noise) * gauss());
          o[q.k] = isFinite(v) ? +v.toFixed(q.dp == null ? 2 : q.dp) : null;
        });
        return o;
      }
      function live() { var o = calc(false); meter.innerHTML = (M.outputs || []).map(function (q) { return "<div>" + esc(q.label) + "<b>" + (o[q.k] == null ? "—" : o[q.k]) + (q.unit ? " " + esc(q.unit) : "") + "</b></div>"; }).join(""); }
      live();
      var row = el("div", "inq-row"), mb = el("button", "btn primary", "📏 측정해서 표에 적기"), cb = el("button", "btn", "표 비우기"); mb.type = cb.type = "button";
      row.appendChild(mb); row.appendChild(cb); row.appendChild(el("span", "inq-msg", M.noise === 0 ? "이 가상 실험은 정확한 계산값이라 오차가 없습니다." : "진짜 측정처럼 값에 작은 오차가 섞입니다. 같은 조건에서 여러 번 재 보세요.")); box.appendChild(row);
      var tbl = el("div"); box.appendChild(tbl);
      function paintT() {
        var R = s[rowsKey] || [], names = (M.inputs || []).map(function (p) { return [p.k, p.label, p.unit]; }).concat((M.choices || []).map(function (c) { return [c.k, c.label, ""]; }));
        var changed = varied(it, R);
        var h = "<table class='inq-t'><tr><th>#</th>" + names.map(function (n) { return "<th>" + esc(n[1]) + (n[2] ? " (" + esc(n[2]) + ")" : "") + "</th>"; }).join("") + (M.outputs || []).map(function (q) { return "<th>" + esc(q.label) + (q.unit ? " (" + esc(q.unit) + ")" : "") + "</th>"; }).join("") + "</tr>";
        R.forEach(function (r, i) { h += "<tr><td>" + (i + 1) + "</td>" + names.map(function (n) { var v = r.i[n[0]]; var ch = (M.choices || []).filter(function (c) { return c.k === n[0]; })[0]; if (ch) { var op = ch.opts.filter(function (o) { return String(o[1]) === String(v); })[0]; v = op ? op[0] : v; } return "<td class='" + (changed.indexOf(n[0]) >= 0 ? "chg" : "") + "'>" + esc(v) + "</td>"; }).join("") + (M.outputs || []).map(function (q) { return "<td>" + esc(r.o[q.k]) + "</td>"; }).join("") + "</tr>"; });
        tbl.innerHTML = R.length ? h + "</table>" + (changed.length ? "<p class='inq-sub'>노란 칸 = 이 표에서 값이 달라진 입력: <b>" + changed.map(function (k) { return esc(labelOf(it, k)); }).join(", ") + "</b></p>" : "") : "<p class='inq-sub'>아직 잰 값이 없습니다.</p>";
        tbl.appendChild(graph(it, R, null));
      }
      mb.addEventListener("click", function () { var R = s[rowsKey] || (s[rowsKey] = []); if (R.length >= 40) return; var iv = {}; Object.keys(vals).forEach(function (k) { iv[k] = vals[k]; }); R.push({ i: iv, o: calc(true) }); save(); paintT(); if (onChange) onChange(); });
      cb.addEventListener("click", function () { s[rowsKey] = []; save(); paintT(); if (onChange) onChange(); });
      paintT();
      if (M.note) box.appendChild(el("p", "inq-sub", "🧮 " + esc(M.note)));
      return box;
    }
    function labelOf(it, k) { var M = it.sim, f = (M.inputs || []).concat(M.choices || []).filter(function (p) { return p.k === k; })[0]; return f ? f.label : k; }
    function varied(it, R) { var keys = {}; if (!R || R.length < 2) return []; Object.keys(R[0].i).forEach(function (k) { if (R.some(function (r) { return String(r.i[k]) !== String(R[0].i[k]); })) keys[k] = 1; }); return Object.keys(keys); }

    /* ---- 바깥 시뮬레이션: 학생이 읽은 값을 적는 표 ---- */
    function manualBox(it, rowsKey, xl, yl, onChange) {
      var s = S(it.id), box = el("div");
      var tbl = el("div"); box.appendChild(tbl);
      function paintT() {
        var R = s[rowsKey] || (s[rowsKey] = [["", ""], ["", ""], ["", ""]]);
        var h = "<table class='inq-t'><tr><th>#</th><th>" + esc(xl()) + "</th><th>" + esc(yl()) + "</th></tr>";
        R.forEach(function (r, i) { h += "<tr><td>" + (i + 1) + "</td><td><input data-i='" + i + "' data-j='0' value='" + esc(r[0]) + "'></td><td><input data-i='" + i + "' data-j='1' value='" + esc(r[1]) + "'></td></tr>"; });
        tbl.innerHTML = h + "</table>";
        Array.prototype.forEach.call(tbl.querySelectorAll("input"), function (inp) { inp.addEventListener("change", function () { R[+inp.getAttribute("data-i")][+inp.getAttribute("data-j")] = inp.value.trim(); save(); g.replaceWith(g = graph(it, null, R)); if (onChange) onChange(); }); });
        var add = el("button", "btn", "＋ 줄 더하기"); add.type = "button"; add.addEventListener("click", function () { if (R.length < 15) { R.push(["", ""]); save(); paintT(); } }); tbl.appendChild(add);
      }
      var g = el("div"); paintT(); box.appendChild(g = graph(it, null, s[rowsKey]));
      return box;
    }
    /* ---- 그래프: 가상 실험은 바뀐 입력(없으면 첫 입력) → 첫 출력, 손으로 적은 표는 첫 칸 → 둘째 칸 ---- */
    function graph(it, R, man) {
      var pts = [], xl = "", yl = "";
      if (R) {
        var ch = varied(it, R), M = it.sim, xk = ch[0] || ((M.inputs || [])[0] || {}).k, yq = (M.outputs || [])[0];
        if (!yq) return el("div");
        R.forEach(function (r) { var x = num(r.i[xk]), y = num(r.o[yq.k]); if (x != null && y != null) pts.push([x, y]); });
        xl = labelOf(it, xk); yl = yq.label;
      } else (man || []).forEach(function (r) { var x = num(r[0]), y = num(r[1]); if (x != null && y != null) pts.push([x, y]); });
      var w = el("div"); if (pts.length < 2) return w;
      var cv = el("canvas"); cv.width = 520; cv.height = 240; cv.style.maxWidth = "100%"; cv.style.border = "1px solid var(--line)"; cv.style.borderRadius = "10px"; w.appendChild(cv);
      var c = cv.getContext("2d"), x0 = 50, x1 = 505, y0 = 14, y1 = 205;
      var xs = pts.map(function (p) { return p[0]; }), ys = pts.map(function (p) { return p[1]; });
      var xa = Math.min.apply(null, xs), xb = Math.max.apply(null, xs), ya = Math.min(0, Math.min.apply(null, ys)), yb = Math.max.apply(null, ys);
      if (xa === xb) { xa -= 1; xb += 1; } if (ya === yb) { yb = ya + 1; }
      function X(v) { return x0 + (v - xa) / (xb - xa) * (x1 - x0); } function Y(v) { return y1 - (v - ya) / (yb - ya) * (y1 - y0); }
      var ink = getComputedStyle(document.body).color || "#333";
      c.strokeStyle = "#cbd5e1"; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0, y1); c.lineTo(x1, y1); c.stroke();
      c.fillStyle = ink; c.font = "11px sans-serif"; c.textAlign = "center";
      [xa, (xa + xb) / 2, xb].forEach(function (v) { c.fillText(+v.toFixed(2), X(v), y1 + 14); });
      c.textAlign = "right"; [ya, (ya + yb) / 2, yb].forEach(function (v) { c.fillText(+v.toFixed(2), x0 - 4, Y(v) + 4); });
      c.textAlign = "left"; c.fillText((yl || "") + " ↑", x0 + 4, y0 + 8); c.textAlign = "right"; c.fillText((xl || "") + " →", x1, y1 - 6);
      c.fillStyle = "#0ea5e9"; pts.forEach(function (p) { c.beginPath(); c.arc(X(p[0]), Y(p[1]), 4, 0, 7); c.fill(); });
      return w;
    }

    var heads = {};
    function refresh(it) { if (BYSEC) { if (heads[it.id]) heads[it.id](); } else paintList(); }
    function paint(it, body) {
      body.innerHTML = ""; if (!it) return;
      var s = S(it.id);
      /* ① 교과서 실험 */
      var s1 = el("div", "inq-step", "<h4><span class='inq-n'>1</span>교과서 실험</h4>");
      s1.appendChild(el("div", "inq-tb", "<b>📘 " + esc(it.book) + " " + esc(it.page) + "쪽 · " + esc(it.title) + "</b><br>" + esc(it.purpose || "") + (it.steps && it.steps.length ? "<ol>" + it.steps.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ol>" : "") + "<span class='inq-sub'>※ 교과서 내용을 짧게 줄였습니다. 자세한 과정·그림은 교과서 " + esc(it.page) + "쪽을 보세요.</span>"));
      body.appendChild(s1);
      /* ② 변인 찾기 */
      var s2 = el("div", "inq-step", "<h4><span class='inq-n'>2</span>교과서 실험의 변인 찾기</h4><p class='inq-sub'>무엇을 바꾸고, 무엇을 재고, 무엇을 같게 두었을까요? 먼저 써 보고 교과서와 견주세요.</p>");
      var g = s.g || {}, gg = el("div", "inq-g"); s2.appendChild(gg);
      [["iv", "바꾼 것(조작 변인)"], ["dv", "잰 것(종속 변인)"], ["cv", "같게 둔 것(통제 변인)"]].forEach(function (f) { gg.appendChild(el("span", null, f[1])); var i = el("input"); i.type = "text"; i.value = g[f[0]] || ""; if (f[0] === "cv") i.placeholder = "쉼표로 여러 개"; i.addEventListener("change", function () { (s.g = s.g || {})[f[0]] = i.value.trim(); save(); }); gg.appendChild(i); });
      var rb = el("button", "btn", "교과서와 견주기"); rb.type = "button"; var rr = el("div", "inq-row"); rr.appendChild(rb); s2.appendChild(rr);
      var cmp = el("div", "inq-cmp"); cmp.hidden = !s.rv; s2.appendChild(cmp);
      function showCmp() {
        var G = s.g || {}, gcv = String(G.cv || "").split(/[,，]/).map(function (x) { return x.trim(); }).filter(String), hit = (it.cv || []).filter(function (c) { return gcv.some(function (x) { return near(x, c); }); }).length;
        cmp.innerHTML = "<b>📘 교과서 실험의 변인</b><br>" + (near(G.iv, it.iv) ? "✅" : "🔎") + " 바꾼 것: <b>" + esc(it.iv || "—") + "</b><br>" + (near(G.dv, it.dv) ? "✅" : "🔎") + " 잰 것: <b>" + esc(it.dv || "—") + "</b><br>🔎 같게 둔 것: <b>" + esc((it.cv || []).join(", ") || "—") + "</b> — 내가 찾은 것 " + hit + "/" + (it.cv || []).length + "개";
      }
      if (s.rv) showCmp();
      rb.addEventListener("click", function () { s.rv = 1; save(); cmp.hidden = false; showCmp(); });
      body.appendChild(s2);
      /* ③ 시뮬레이션으로 교과서 실험 */
      var s3 = el("div", "inq-step", "<h4><span class='inq-n'>3</span>시뮬레이션으로 교과서 실험 해 보기</h4>");
      if (it.sim.kind === "model") {
        s3.appendChild(el("p", "inq-sub", "교과서처럼 <b>" + esc(it.iv || "조작 변인") + "</b>만 바꾸고 나머지는 그대로 둔 채 여러 번 측정하세요."));
        s3.appendChild(modelBox(it, "a", check));
      } else {
        s3.appendChild(el("div", "inq-tb", "🧪 <b>" + esc(it.sim.name || "") + "</b> <a href='" + esc(it.sim.url) + "' target='_blank' rel='noopener'>새 창에서 열기 ↗</a><br><b>바꿀 곳</b> " + esc(it.sim.ivControl || it.iv) + "<br><b>읽을 값</b> " + esc(it.sim.dvReading || it.dv) + "<br><span class='inq-sub'>바꿀 때마다 읽은 값을 아래 표에 적으세요.</span>"));
        if (it.sim.tab) {      /* 다른 누리집 안에 끼워 넣을 수 없는 시뮬레이션은 새 창으로 */
          var tb = el("a", "btn primary", "🧪 " + esc(it.sim.name || "시뮬레이션") + " 새 창에서 열기 ↗"); tb.href = it.sim.url; tb.target = "_blank"; tb.rel = "noopener";
          var tr = el("div", "inq-row"); tr.appendChild(tb); tr.appendChild(el("span", "inq-msg", "이 시뮬레이션은 이 화면 안에 띄울 수 없어 새 창으로 엽니다. 창을 나란히 놓고 값을 적으세요.")); s3.appendChild(tr);
        } else { var fr = el("iframe", "inq-frame"); fr.loading = "lazy"; fr.src = it.sim.url; fr.height = it.sim.h || 520; fr.setAttribute("allowfullscreen", ""); fr.setAttribute("sandbox", "allow-scripts allow-same-origin allow-popups allow-forms"); s3.appendChild(fr); }
        s3.appendChild(manualBox(it, "a", function () { return (it.sim.x && it.sim.x.label || it.iv || "바꾼 값") + (it.sim.x && it.sim.x.unit ? " (" + it.sim.x.unit + ")" : ""); }, function () { return (it.sim.y && it.sim.y.label || it.dv || "잰 값") + (it.sim.y && it.sim.y.unit ? " (" + it.sim.y.unit + ")" : ""); }, check));
      }
      body.appendChild(s3);
      /* ④ 하나만 바꿔 내 탐구 */
      var q = s.q || (s.q = {}), s4 = el("div", "inq-step", "<h4><span class='inq-n'>4</span>하나만 바꿔 내 탐구로</h4><p class='inq-sub'>교과서 실험에서 <b>한 가지만</b> 바꿉니다. 바꾸는 것이 하나여야 결과가 달라졌을 때 그 까닭을 압니다." + (it.sim.kind === "model" ? " 이 가상 실험에서는 위의 입력 가운데 교과서와 다른 하나를 골라 바꿔 보세요." : "") + "</p>");
      var chips = el("div", "inq-chips"); (it.extend || []).forEach(function (e) { var b = el("button", "inq-chip", "💡 " + esc(e)); b.type = "button"; b.addEventListener("click", function () { qi.placeholder = e; qi.focus(); }); chips.appendChild(b); }); s4.appendChild(chips);
      var r1 = el("div", "inq-row"), qi = el("input"), qd = el("input"); qi.type = qd.type = "text"; qi.placeholder = "내 탐구에서 바꾸는 것"; qd.placeholder = "재는 것"; qi.value = q.iv || ""; qd.value = q.dv || (it.dv || "");
      r1.appendChild(qi); r1.appendChild(el("span", null, "이(가) 달라지면")); r1.appendChild(qd); r1.appendChild(el("span", null, "은(는) 어떻게 달라질까?")); s4.appendChild(r1);
      var r2 = el("div", "inq-row"), h1 = el("input"), h3 = el("input"); h1.type = h3.type = "text"; h1.placeholder = "만약 ~하면 ~할 것이다"; h3.placeholder = "왜냐하면 ~ 때문이다"; h1.value = q.h || ""; h3.value = q.w || "";
      r2.appendChild(el("span", null, "가설")); r2.appendChild(h1); s4.appendChild(r2); var r3 = el("div", "inq-row"); r3.appendChild(el("span", null, "까닭")); r3.appendChild(h3); s4.appendChild(r3);
      [[qi, "iv"], [qd, "dv"], [h1, "h"], [h3, "w"]].forEach(function (p) { p[0].addEventListener("input", function () { q[p[1]] = p[0].value.trim(); save(); check(); }); });
      body.appendChild(s4);
      /* ⑤ 내 탐구 실험 */
      var s5 = el("div", "inq-step", "<h4><span class='inq-n'>5</span>시뮬레이션으로 내 탐구 하기</h4>");
      if (it.sim.kind === "model") { s5.appendChild(el("p", "inq-sub", "이번에는 내가 고른 것만 바꾸고 나머지는 그대로 두세요. 표의 노란 칸이 ‘바꾼 것’입니다.")); s5.appendChild(modelBox(it, "b", check)); }
      else { s5.appendChild(el("p", "inq-sub", "같은 시뮬레이션(위)에서 내가 정한 것을 바꾸며 재고 적으세요.")); s5.appendChild(manualBox(it, "b", function () { return q.iv || "내가 바꾼 것"; }, function () { return q.dv || "잰 것"; }, check)); }
      if (it.safety) s5.appendChild(el("div", "inq-safe", "⚠️ 실제로 해 본다면: " + esc(it.safety)));
      body.appendChild(s5);
      /* ⑥ 결론·점검 */
      var s6 = el("div", "inq-step", "<h4><span class='inq-n'>6</span>결론과 점검</h4>");
      var r6 = el("div", "inq-row"), sel = el("select"); [["", "가설은…"], ["맞음", "맞았다"], ["일부", "일부만 맞았다"], ["틀림", "틀렸다"]].forEach(function (o) { var op = el("option", null, o[1]); op.value = o[0]; sel.appendChild(op); }); sel.value = s.cr || "";
      var cw = el("input"); cw.type = "text"; cw.placeholder = "표와 그래프에서 무엇을 보고 그렇게 판단했나요?"; cw.value = s.c || "";
      r6.appendChild(sel); r6.appendChild(cw); s6.appendChild(r6);
      sel.addEventListener("change", function () { s.cr = sel.value; save(); check(); }); cw.addEventListener("input", function () { s.c = cw.value.trim(); save(); check(); });
      var ck = el("ul", "inq-ck"); s6.appendChild(ck);
      var plan = el("div", "inq-plan"); s6.appendChild(plan);
      var cp = el("button", "btn", "보고서 복사"); cp.type = "button"; var cm = el("span", "inq-msg"); var r7 = el("div", "inq-row"); r7.appendChild(cp); r7.appendChild(cm); s6.appendChild(r7);
      cp.addEventListener("click", function () { try { navigator.clipboard.writeText(plan.textContent); cm.textContent = "복사했습니다."; } catch (e) { cm.textContent = "복사가 막혀 있습니다."; } });
      body.appendChild(s6);
      function filled(R) { if (!R) return 0; return R.filter(function (r) { return Array.isArray(r) ? num(r[0]) != null && num(r[1]) != null : true; }).length; }
      function check() {
        var A = s.a, B = s.b, ch = it.sim.kind === "model" ? varied(it, B) : null, nb = filled(B);
        var one = it.sim.kind === "model" ? ch.length === 1 : !!q.iv && !/,|와 |과 |및|그리고/.test(q.iv);
        var C = [[!!s.rv, "교과서 실험의 변인을 찾고 견주었다", ""], [filled(A) >= 3, "교과서 실험을 시뮬레이션으로 3번 이상 재었다", ""],
                 [!!q.iv && (q.h || "").length > 4, "내 탐구 질문과 가설을 세웠다", ""],
                 [one, "내 탐구에서 바꾼 것이 하나뿐이다", ch && ch.length > 1 ? "표에서 " + ch.map(function (k) { return labelOf(it, k); }).join(", ") + "이(가) 함께 바뀌었어요." : ""],
                 [nb >= 3, "내 탐구를 3번 이상 재었다", "지금 " + nb + "번"], [!!s.cr && (s.c || "").length > 4, "자료를 근거로 결론을 냈다", ""]];
        ck.innerHTML = C.map(function (c) { return "<li class='" + (c[0] ? "ok" : "no") + "'>" + c[1] + (c[2] && !c[0] ? " <small>— " + esc(c[2]) + "</small>" : "") + "</li>"; }).join("");
        var ok = C.every(function (c) { return c[0]; });
        if (ok !== !!s.ok) { s.ok = ok ? 1 : 0; save(); refresh(it); }
        plan.textContent = "[교과서 실험 탐구 보고서]\n출발한 교과서 실험: " + it.book + " " + it.page + "쪽 「" + it.title + "」\n교과서 실험의 변인: 조작 " + (it.iv || "-") + " / 종속 " + (it.dv || "-") + " / 통제 " + (it.cv || []).join(", ")
          + "\n내 탐구 질문: " + (q.iv || "○○") + "이(가) 달라지면 " + (q.dv || "△△") + "은(는) 어떻게 달라질까?\n가설: " + (q.h || "") + (q.w ? " (까닭: " + q.w + ")" : "")
          + "\n실험: " + (it.sim.kind === "model" ? "가상 실험 " : (it.sim.name || "시뮬레이션") + " ") + nb + "번 측정" + (ch && ch.length ? " · 바꾼 것: " + ch.map(function (k) { return labelOf(it, k); }).join(", ") : "")
          + "\n결론: 가설이 " + ({ "맞음": "맞았다", "일부": "일부만 맞았다", "틀림": "틀렸다" }[s.cr] || "…") + ". " + (s.c || "");
      }
      check();
    }
    if (!BYSEC) { cur = items[0]; paintList(); paint(cur, body); return; }
    var SEC = {};
    Array.prototype.forEach.call(document.querySelectorAll(".tab-btn"), function (b) {
      var n = b.querySelector(".num"); if (!n) return;
      var p = document.querySelector('.tab-panel[data-panel="' + b.getAttribute("data-tab") + '"]'); if (p) SEC[n.textContent.trim()] = p;
    });
    items.forEach(function (it) {
      var panel = SEC[it.sec]; if (!panel) return;
      var wrap = panel.querySelector(".inq-sec");
      if (!wrap) { wrap = el("div", "inq-sec"); var tn = panel.querySelector(".teacher-note"); if (tn && tn.parentNode) tn.parentNode.insertBefore(wrap, tn); else panel.appendChild(wrap); }
      var box = el("div", "inq-one"), head = el("button", "inq-head"), bd = el("div", "inq-body"); head.type = "button"; bd.hidden = true;
      function paintHead() {
        var done = st[it.id] && st[it.id].ok;
        head.innerHTML = "<span class='inq-tag'>📘 교과서 실험</span><span class='inq-pill'>" + esc(it.book) + " " + esc(it.page) + "쪽</span><span class='inq-pill'>" + (it.sim.kind === "model" ? "🧮 가상 실험" : "🧪 " + esc(it.sim.name || "시뮬레이션")) + "</span>" + (done ? "<span class='inq-pill'>✅ 완료</span>" : "")
          + "<b>" + esc(it.title) + "</b><span class='inq-sub2'>" + esc(it.purpose || "") + "</span><span class='inq-open'>" + (bd.hidden ? "▾ 시뮬레이션으로 해 보기" : "▴ 접기") + "</span>";
      }
      heads[it.id] = paintHead;
      head.addEventListener("click", function () {
        var A = window.sthAccount;
        if (bd.hidden && A && A.need && !A.need()) { A.login(function () { bd.hidden = false; if (!bd.firstChild) paint(it, bd); paintHead(); }); return; }   /* 기록이 남는 활동이라 로그인 뒤에 연다 */
        bd.hidden = !bd.hidden; if (!bd.hidden && !bd.firstChild) paint(it, bd); paintHead();
      });
      box.appendChild(head); box.appendChild(bd); wrap.appendChild(box); paintHead();
    });
  };
})();
