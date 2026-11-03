/* 지구과학 Ⅱ-2 한반도의 암석 — 소단원별 이야기 세 편
   ① 같은 마그마, 다른 돌 ② 돌 한 덩이의 일생 ③ 지질공원 해설사
   공용 부품: ../assets/theme.js (sthUnit·sthState·sthGate·sthWork·setupCanvas·cssVar·drawArrow),
             ../assets/story.js (sthStory·sthMission·sthSort·sthOrder·sthPick), ../assets/share.js */
(function () {
"use strict";

window.sthUnit("eshs-2-2");

var FONT = "'Gothic A1','Segoe UI',sans-serif";
function $(id) { return document.getElementById(id); }
function v(name) { return window.cssVar(name); }
function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
function done(id) { var e = $(id); if (e) e.classList.add("done"); }
function paper(ctx, W, H) { ctx.clearRect(0, 0, W, H); ctx.fillStyle = v("--panel"); ctx.fillRect(0, 0, W, H); }
var K = window.sthKit, KC = K.C, REDUCE = K.REDUCE;
/* 무대 위 둥근 패널(유리판) */
function glass(ctx, x, y, w, h, r, a) {
  ctx.save(); ctx.fillStyle = "rgba(255,255,255," + (a == null ? .045 : a) + ")"; ctx.strokeStyle = "rgba(200,210,255,.18)"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r || 12); ctx.fill(); ctx.stroke(); ctx.restore();
}
/* 빛나는 막대 계기 */
function gauge(ctx, x, y, w, h, f, col) {
  ctx.save(); ctx.fillStyle = "rgba(255,255,255,.08)"; ctx.beginPath(); ctx.roundRect(x, y, w, h, h / 2); ctx.fill();
  var g = ctx.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, "rgba(255,255,255,.25)"); g.addColorStop(.25, col); g.addColorStop(1, col);
  ctx.shadowColor = col; ctx.shadowBlur = 10; ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(x, y, Math.max(h, w * clamp(f, 0, 1)), h, h / 2); ctx.fill(); ctx.restore();
}
/* 암석 질감: 반점이 박힌 그라데이션 덩어리 */
function rockFill(ctx, path, x, y, w, h, top, bot, seed, speck) {
  ctx.save(); path(); ctx.clip();
  var g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, top); g.addColorStop(1, bot);
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  var R = rnd(seed || 5), n = Math.min(600, Math.round(w * h / 140));
  for (var i = 0; i < n; i++) { ctx.globalAlpha = .06 + R() * .14; ctx.fillStyle = R() > .5 ? (speck || "#ffffff") : "#000000"; ctx.fillRect(x + R() * w, y + R() * h, 1.6, 1.6); }
  ctx.restore();
}
function text(ctx, s, x, y, o) {
  o = o || {};
  ctx.font = (o.w || "500") + " " + (o.s || 12) + "px " + FONT;
  ctx.fillStyle = o.c || v("--ink"); ctx.textAlign = o.a || "left";
  ctx.fillText(s, x, y);
}
function segPick(group, btn) {
  Array.prototype.forEach.call(group.querySelectorAll("button"), function (b) { b.classList.toggle("on", b === btn); });
}
function segWire(id, onPick) {
  var g = $(id);
  if (!g) return;
  Array.prototype.forEach.call(g.querySelectorAll("button"), function (b) {
    b.addEventListener("click", function () { segPick(g, b); onPick(b); });
  });
}
function band(ctx, x, y, w, h, color, alpha) {
  ctx.save(); ctx.globalAlpha = alpha === undefined ? 0.75 : alpha;
  ctx.fillStyle = v(color); ctx.fillRect(x, y, w, h); ctx.restore();
}
function boxLine(ctx, x, y, w, h, color, lw) {
  ctx.save(); ctx.strokeStyle = v(color || "--line"); ctx.lineWidth = lw || 1.5;
  ctx.strokeRect(x, y, w, h); ctx.restore();
}
/* setTimeout 애니메이션 (가려진 탭에서는 그리지 않는다) */
function anim(canvas, step) {
  (function tick() {
    if (canvas.offsetParent !== null) step();
    setTimeout(tick, 110);
  })();
}
function hit(canvas, e) {
  var r = canvas.getBoundingClientRect();
  if (!r.width || !r.height) return { x: -1, y: -1 };
  return { x: (e.clientX - r.left) * (canvas._w / r.width), y: (e.clientY - r.top) * (canvas._h / r.height) };
}
/* 작은 난수 발생기 — 같은 조건이면 같은 그림이 나오게 */
function rnd(seed) {
  var a = seed | 0;
  return function () {
    a = (a + 0x6D2B79F5) | 0;
    var t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function fmtYears(y) {
  if (y >= 1e8) return (y / 1e8).toFixed(1) + "억 년";
  if (y >= 1e4) return (y / 1e4).toFixed(y >= 1e6 ? 0 : 1) + "만 년";
  if (y >= 1) return Math.round(y).toLocaleString() + "년";
  return (y * 365).toFixed(0) + "일";
}
function fmtMm(d) {
  if (d >= 10) return d.toFixed(1) + " mm";
  if (d >= 1) return d.toFixed(2) + " mm";
  if (d >= 0.01) return d.toFixed(3) + " mm";
  return d.toFixed(4) + " mm";
}

/* =========================================================================
   이야기 ① 같은 마그마, 다른 돌
   ========================================================================= */
(function () {
  var ep = window.sthStory({ root: "epA", key: "epA", name: "사건 파일 ①", onDone: finish });

  window.sthGate({
    gate: "a-gate", key: "subduct", title: "원고를 고치기 전에, 먼저 예상해 봅시다",
    question: "섭입대에서 마그마가 생기는 <b>가장 큰 까닭</b>은 무엇일까요?",
    options: ["㉠ 판이 밀리며 생긴 마찰열", "㉡ 해양 지각이 직접 녹아서", "㉢ 물이 공급되어 위쪽 맨틀이 부분 용융", "㉣ 지구 중심의 열이 올라와서"],
    onPick: function (i) {
      window.sthState("subductOK", i === 2 ? "맞음" : "어긋남");
      ep.clear(0);
    }
  });

  /* ---- 장면2 : 마그마가 생기는 세 가지 방법 (온도-깊이 그림) ---- */
  (function () {
    var canvas = $("a-c-melt"), ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var depth = 100, T = 1000, water = false, wt = 0, quiet = false;
    var got = window.sthState("aMelt") || { a: false, b: false, c: false };

    var X0 = 110, X1 = 860, Y0 = 70, Y1 = 390;
    function XT(t) { return X0 + clamp(t, 0, 1600) / 1600 * (X1 - X0); }
    function YD(d) { return Y0 + clamp(d, 0, 200) / 200 * (Y1 - Y0); }
    function geo(d) { return 1300 * (1 - Math.exp(-d / 60)); }      /* 지온 곡선 */
    function dryS(d) { return 1100 + 3 * d; }                        /* 건조한 암석의 용융 곡선 */
    function wetS(d) { return Math.max(800, 1000 - 1.5 * d); }       /* 물이 공급되었을 때 */

    function curve(f, color, lw, dash) {
      ctx.save();
      ctx.strokeStyle = color; ctx.lineWidth = lw; if (dash) ctx.setLineDash(dash);
      if (!dash) { ctx.shadowColor = color; ctx.shadowBlur = 9; }
      ctx.beginPath();
      for (var d = 0; d <= 200; d += 2) {
        var t = f(d);
        if (t > 1600) { ctx.stroke(); ctx.restore(); return; }
        if (d === 0) ctx.moveTo(XT(t), YD(d)); else ctx.lineTo(XT(t), YD(d));
      }
      ctx.stroke(); ctx.restore();
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      var sol = water ? wetS(depth) : dryS(depth);
      var melted = T >= sol;
      K.stage(ctx, 0, 0, W, H, "earth", { seed: 21, title: "돌을 녹이는 세 가지 방법 — 온도와 깊이의 싸움", titleColor: KC.orange });

      /* 왼쪽 땅속 기둥(지각·맨틀) */
      var cx0 = 22, cw = 44, moho = YD(35);
      rockFill(ctx, function () { ctx.beginPath(); ctx.roundRect(cx0, Y0, cw, moho - Y0, [8, 8, 0, 0]); }, cx0, Y0, cw, moho - Y0, "#8a7a68", "#5c4c3e", 4);
      rockFill(ctx, function () { ctx.beginPath(); ctx.roundRect(cx0, moho, cw, Y1 - moho, [0, 0, 8, 8]); }, cx0, moho, cw, Y1 - moho, "#7a3f24", "#c2461f", 9, "#ffcf9a");
      K.t(ctx, "지각", cx0 + cw / 2, (Y0 + moho) / 2 + 4, { s: 10.5, a: "center", c: "#f3e7d6", w: "800" });
      K.t(ctx, "맨틀", cx0 + cw / 2, (moho + Y1) / 2 + 4, { s: 10.5, a: "center", c: "#ffe2c8", w: "800" });
      ctx.save(); ctx.strokeStyle = melted ? KC.orange : KC.blue; ctx.lineWidth = 2; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(cx0 + cw, YD(depth)); ctx.lineTo(X0, YD(depth)); ctx.stroke(); ctx.restore();
      if (water) {
        var Rw = rnd(77);
        for (var wd = 0; wd < 7; wd++) {
          var wy = YD(depth) + 40 - ((wt * 1.5 + wd * 12) % 84);
          if (wy > Y0 + 6 && wy < Y1 - 6) K.glow(ctx, cx0 + 8 + Rw() * (cw - 16), wy, 2, "rgba(127,211,255,.95)", 3.2);
        }
        K.t(ctx, "물", cx0 + cw / 2, Y1 + 18, { s: 10.5, a: "center", c: KC.blue });
      }

      /* 그래프 판 */
      ctx.fillStyle = "rgba(255,255,255,.035)"; ctx.fillRect(X0, Y0, X1 - X0, Y1 - Y0);
      ctx.lineWidth = 1;
      [0, 400, 800, 1200, 1600].forEach(function (t) {
        var x = XT(t);
        ctx.strokeStyle = KC.grid; ctx.beginPath(); ctx.moveTo(x, Y0); ctx.lineTo(x, Y1); ctx.stroke();
        K.t(ctx, t + "", x, Y1 + 18, { s: 10.5, a: "center", c: KC.mute, w: "600" });
      });
      [0, 50, 100, 150, 200].forEach(function (d) {
        ctx.strokeStyle = KC.grid; ctx.beginPath(); ctx.moveTo(X0, YD(d)); ctx.lineTo(X1, YD(d)); ctx.stroke();
        K.t(ctx, d + "", X0 - 8, YD(d) + 4, { s: 10.5, a: "right", c: KC.mute, w: "600" });
      });
      ctx.strokeStyle = KC.line; ctx.lineWidth = 1.5; ctx.strokeRect(X0, Y0, X1 - X0, Y1 - Y0);
      K.t(ctx, "온도 (°C) →", XT(1400), Y1 + 18, { s: 11, a: "center", c: KC.mute });
      K.t(ctx, "깊이 (km) ↓", X0 - 4, Y0 - 8, { s: 11, a: "right", c: KC.mute });

      /* 녹는 영역: 뜨거운 빛 */
      ctx.save();
      var mg = ctx.createLinearGradient(XT(700), 0, X1, 0); mg.addColorStop(0, "rgba(255,120,40,.10)"); mg.addColorStop(1, "rgba(255,90,40,.32)");
      ctx.fillStyle = mg;
      ctx.beginPath(); ctx.moveTo(X1, Y0); ctx.lineTo(X1, Y1);
      for (var dd = 200; dd >= 0; dd -= 2) ctx.lineTo(XT(water ? wetS(dd) : dryS(dd)), YD(dd));
      ctx.closePath(); ctx.fill(); ctx.restore();

      curve(geo, "rgba(232,236,255,.75)", 2, [6, 4]);
      curve(dryS, KC.red, 3);
      if (water) curve(wetS, KC.blue, 3); else curve(wetS, "rgba(127,211,255,.55)", 1.5, [4, 5]);

      K.pill(ctx, "지온 곡선 (평소 땅속 온도)", XT(geo(150)) - 14, YD(150) + 4, { s: 11, a: "right", c: KC.ink });
      K.pill(ctx, "건조한 암석의 용융 곡선", XT(dryS(120)) + 12, YD(120) - 6, { s: 11.5, c: KC.red, box: [X0, X1] });
      K.pill(ctx, "물이 공급되었을 때의 용융 곡선", XT(wetS(60)) - 12, YD(60) + 4, { s: 11.5, a: "right", c: water ? KC.blue : KC.mute });
      K.pill(ctx, "← 고체", X0 + 12, Y0 + 22, { s: 11.5, c: KC.mute });
      K.pill(ctx, "녹는 영역 →", X1 - 12, Y0 + 22, { s: 11.5, a: "right", c: KC.orange });

      /* 지금 이 물질 */
      var px = XT(T), py = YD(depth);
      if (melted) {
        var pulse = 1 + .18 * Math.sin(wt / 5);
        K.glow(ctx, px, py, 8 * pulse, "rgba(255,150,60,.95)", 3.6);
        K.planet(ctx, px, py, 8, "#ffb347", "#c2410c");
      } else {
        K.planet(ctx, px, py, 10, "#8fc7b8", "#2c4f49");
        ctx.strokeStyle = "rgba(255,255,255,.6)"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(px, py, 12, 0, 6.2832); ctx.stroke();
      }
      K.pill(ctx, melted ? "녹는 중" : "고체", clamp(px, 150, 800), py - 20, { s: 11.5, a: "center", c: melted ? KC.orange : KC.green });

      /* 아래 판정판 */
      glass(ctx, 14, 414, W - 28, 80, 12);
      K.t(ctx, melted ? "✅ 부분 용융이 일어나 마그마가 생겼습니다" : "고체 그대로입니다 — 아직 녹지 않았습니다",
        32, 439, { s: 18, w: "900", c: melted ? KC.orange : KC.mute });
      var r1 = K.pill(ctx, "이 깊이에서 녹기 시작하는 온도 " + sol.toFixed(0) + " °C", 32, 465, { s: 12, c: water ? KC.blue : KC.red });
      var r2 = K.pill(ctx, "지금 이 물질의 온도 " + T + " °C", r1.x + r1.w + 20, 465, { s: 12, c: KC.ink });
      K.pill(ctx, "차이 " + (melted ? "+" : "") + (T - sol).toFixed(0) + " °C", r2.x + r2.w + 20, 465, { s: 12, c: melted ? KC.orange : KC.mute });
      K.t(ctx, water ? "물이 공급되어 녹는 온도가 " + (dryS(depth) - wetS(depth)).toFixed(0) + " °C나 낮아졌습니다"
                     : "물이 없으면 녹는 온도가 깊어질수록 함께 올라갑니다", 32, 486, { s: 11.5, c: KC.mute, w: "600" });

      if (quiet) return;
      var ch = false, how = "";
      if (melted && !water && depth >= 100) { how = "heat"; if (!got.a) { got.a = ch = true; } }
      else if (melted && !water && depth <= 70 && T <= 1350) { how = "decomp"; if (!got.b) { got.b = ch = true; } }
      else if (melted && water && T < dryS(depth)) { how = "water"; if (!got.c) { got.c = ch = true; } }
      else if (melted) how = "etc";
      if (ch) { window.sthState("aMelt", got); mission(); }

      $("a-melt-read").innerHTML = "지금 상태: <b>" + (melted ? "부분 용융(마그마 생성)" : "고체") + "</b>";
      $("a-melt-info").innerHTML =
        how === "heat" ? "<b>온도 상승으로 녹았습니다.</b> 아래에서 뜨거운 맨틀 물질이 올라오거나 방사성 붕괴열이 쌓여 <b>열이 더 공급된</b> 경우입니다. 깊은 곳의 암석을 녹이려면 이렇게 큰 온도 상승이 필요합니다."
        : how === "decomp" ? "<b>압력 감소로 녹았습니다.</b> 온도는 그대로인데 <b>깊이만 얕아져</b> 녹는 온도가 내려간 것입니다. 해령에서 맨틀이 솟아오르는 곳, 열점에서 뜨거운 기둥이 올라오는 곳이 이 경우입니다."
        : how === "water" ? "<b>물이 공급되어 녹았습니다.</b> 지금 이 온도는 건조했다면 절대 녹지 않는 온도입니다(건조한 암석은 " + dryS(depth).toFixed(0) + " °C가 필요). 섭입하는 판에서 빠져나온 물이 <b>위쪽 맨틀의 녹는점을 끌어내려</b> 부분 용융을 일으킵니다 — 섭입대 마그마의 정체입니다."
        : how === "etc" ? "녹기는 했습니다. 어떤 조건 때문에 녹았는지 미션의 세 가지 방법과 견주어 보세요."
        : "아직 고체입니다. 깊이 들어가면 뜨거워지지만 <b>압력도 함께 높아져 녹는 온도가 같이 올라가기</b> 때문에, 평소 땅속 암석은 녹지 않습니다(점선이 빨간 선 왼쪽에 있습니다). 세 가지 방법 가운데 하나로 이 균형을 깨 보세요.";
    }
    function mission() {
      if (got.a) done("m1-2a"); if (got.b) done("m1-2b"); if (got.c) done("m1-2c");
      if (got.a && got.b && got.c) {
        window.sthMission("m1-2", true, "<span class='m-tag'>미션 완료</span>마그마는 <b>열이 더해질 때</b>, <b>압력이 낮아질 때</b>, <b>물이 공급될 때</b> 생깁니다. 마찰열은 이 셋 어디에도 들어 있지 않습니다. 섭입대는 세 번째, 해령과 열점은 두 번째 경우입니다.");
        ep.clear(1);
      }
    }
    canvas._redraw = draw;
    $("a-depth").addEventListener("input", function (e) {
      depth = +e.target.value; $("a-depth-val").textContent = depth + " km"; draw();
    });
    $("a-temp").addEventListener("input", function (e) {
      T = +e.target.value; $("a-temp-val").textContent = T + " °C"; draw();
    });
    $("a-water").addEventListener("click", function () {
      water = !water; this.classList.toggle("on", water); draw();
    });
    draw(); mission();
    /* 물방울이 올라오고, 녹은 물질이 은은하게 빛난다 */
    if (!REDUCE) K.animate(canvas, function () { if (water || T >= dryS(depth)) { wt++; quiet = true; draw(); quiet = false; } });
  })();

  /* ---- 장면3 : 조성과 깊이가 정하는 화성암 ---- */
  (function () {
    var canvas = $("a-c-rock"), ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var sio2 = 52, km = 3;
    var got = window.sthState("aRock") || { b: false, g: false, r: false, gr: false };
    var TYPE = [
      { key: "basalt", name: "현무암질 마그마", fast: "현무암", slow: "반려암", col: "--coral" },
      { key: "andesite", name: "안산암질 마그마", fast: "안산암", slow: "섬록암", col: "--teal" },
      { key: "rhyolite", name: "유문암질 마그마", fast: "유문암", slow: "화강암", col: "--violet" }
    ];
    function typeIdx() { return sio2 < 52 ? 0 : (sio2 < 63 ? 1 : 2); }
    function years() { return 0.5 + 625 * km * km; }
    function grain() { return 0.02 * Math.sqrt(years()); }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      var ti = typeIdx(), t = years(), D = grain(), coarse = D >= 1;
      var rock = coarse ? TYPE[ti].slow : TYPE[ti].fast;
      var KCOL = [KC.orange, KC.green, KC.violet];
      K.stage(ctx, 0, 0, W, H, "earth", { seed: 33, title: "SiO₂ 함량이 이름을, 굳은 깊이가 알갱이를 정한다", titleColor: KC.orange });

      /* 조직 상자 — 확대경으로 본 암석 단면 */
      var bx = 60, by = 66, bw = 290, bh = 262;
      ctx.save(); ctx.shadowColor = "rgba(0,0,0,.6)"; ctx.shadowBlur = 18; ctx.fillStyle = "#1a1412";
      ctx.beginPath(); ctx.roundRect(bx - 6, by - 6, bw + 12, bh + 12, 16); ctx.fill(); ctx.restore();
      ctx.save();
      ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 12); ctx.clip();
      /* 바탕(석기): 현무암질은 검고, 유문암질은 밝은 회백색 */
      var base = [["#3a3533", "#1c1918"], ["#6b6560", "#3f3a36"], ["#b9aea6", "#8a7f78"]][ti];
      var bgg = ctx.createLinearGradient(bx, by, bx + bw, by + bh); bgg.addColorStop(0, base[0]); bgg.addColorStop(1, base[1]);
      ctx.fillStyle = bgg; ctx.fillRect(bx, by, bw, bh);
      var r = clamp(1.1 + D * 2.0, 1.1, 30);
      var n = clamp(Math.round(bw * bh / (r * r * 7)), 18, 900);
      var rg = rnd(Math.round(sio2 * 1000 + km * 10));
      /* 광물 색: 어두운 광물(휘석·각섬석·흑운모) · 밝은 광물(사장석·정장석·석영) */
      var darkP = [0.55, 0.35, 0.12][ti];
      for (var i = 0; i < n; i++) {
        ctx.save();
        ctx.translate(bx + rg() * bw, by + rg() * bh);
        ctx.rotate(rg() * Math.PI);
        var c = rg(), col;
        if (c < darkP) col = rg() > .5 ? ["#2b2a2e", "#0e0d10"] : ["#3c4a35", "#18201a"];
        else if (c < darkP + (1 - darkP) * .55) col = ["#f2ede6", "#b9b2a8"];
        else col = ti === 2 && rg() > .5 ? ["#f3c9b6", "#c88f7a"] : ["#d9dde3", "#8f969f"];
        if (r < 3) { ctx.fillStyle = col[0]; ctx.globalAlpha = .8; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill(); }
        else {
          var gg = ctx.createLinearGradient(-r, -r * .6, r, r * .6); gg.addColorStop(0, col[0]); gg.addColorStop(1, col[1]);
          ctx.fillStyle = gg; ctx.globalAlpha = .95;
          ctx.beginPath(); ctx.moveTo(-r * .9, -r * .2); ctx.lineTo(-r * .5, -r * .55); ctx.lineTo(r * .9, -r * .45); ctx.lineTo(r * .9, r * .25); ctx.lineTo(r * .45, r * .55); ctx.lineTo(-r * .9, r * .45); ctx.closePath(); ctx.fill();
          ctx.globalAlpha = .35; ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-r * .5, -r * .55); ctx.lineTo(r * .9, -r * .45); ctx.stroke();
        }
        ctx.restore();
      }
      /* 유리 반사 */
      var sh = ctx.createLinearGradient(bx, by, bx + bw * .6, by + bh * .6); sh.addColorStop(0, "rgba(255,255,255,.16)"); sh.addColorStop(.35, "rgba(255,255,255,0)");
      ctx.fillStyle = sh; ctx.fillRect(bx, by, bw, bh);
      ctx.restore();
      K.pill(ctx, "🔍 단면 확대 · 가로 약 " + (bw / 10).toFixed(0) + " mm", bx + 10, by + 24, { s: 11, c: KC.ink });
      K.pill(ctx, coarse ? "조립질 — 알갱이가 눈에 보입니다" : "세립질 — 알갱이가 보이지 않습니다",
        bx, by + bh + 26, { s: 12.5, c: coarse ? KC.green : KC.orange });

      /* 오른쪽 읽음판 */
      var px = 384;
      glass(ctx, px - 14, 60, 494, 270, 14);
      K.t(ctx, "마그마의 종류", px, 88, { s: 11.5, w: "800", c: KC.mute });
      K.t(ctx, TYPE[ti].name, px, 114, { s: 18, w: "900", c: KCOL[ti] });
      K.t(ctx, "다 굳는 데 걸린 시간", px, 150, { s: 11.5, w: "800", c: KC.mute });
      K.t(ctx, fmtYears(t), px, 176, { s: 17, w: "900", c: KC.ink });
      K.t(ctx, "결정의 크기", px, 212, { s: 11.5, w: "800", c: KC.mute });
      K.t(ctx, fmtMm(D), px, 238, { s: 17, w: "900", c: coarse ? KC.green : KC.orange });
      K.t(ctx, "굳은 깊이", px + 240, 150, { s: 11.5, w: "800", c: KC.mute });
      K.t(ctx, km === 0 ? "지표(용암)" : km.toFixed(1) + " km", px + 240, 176, { s: 17, w: "900", c: KC.blue });
      K.t(ctx, "완성된 암석", px + 240, 212, { s: 11.5, w: "800", c: KC.mute });
      ctx.save(); ctx.shadowColor = KC.yellow; ctx.shadowBlur = 14;
      K.t(ctx, rock, px + 240, 246, { s: 30, w: "900", c: KC.yellow }); ctx.restore();

      /* SiO2 띠 */
      var sx = px, sw = 460, sy = 280;
      var g = ctx.createLinearGradient(sx, 0, sx + sw, 0);
      g.addColorStop(0, "#3a3533"); g.addColorStop(0.5, "#6b6560"); g.addColorStop(1, "#d8cbc2");
      ctx.save(); ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(sx, sy, sw, 12, 6); ctx.fill(); ctx.restore();
      [52, 63].forEach(function (b) { var xb = sx + (b - 45) / 30 * sw; ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(xb, sy - 3); ctx.lineTo(xb, sy + 15); ctx.stroke(); K.t(ctx, b + "", xb, sy + 28, { s: 10, a: "center", c: KC.dim }); });
      var mx = sx + (sio2 - 45) / 30 * sw;
      K.glow(ctx, mx, sy + 6, 5, "rgba(255,211,107,.95)", 3);
      K.pill(ctx, "SiO₂ " + sio2 + " %", mx, sy - 10, { s: 11, a: "center", c: KC.yellow, box: [sx - 10, sx + sw + 10] });
      K.t(ctx, "45 % · 어두운 색", sx, sy + 28, { s: 10.5, c: KC.mute });
      K.t(ctx, "밝은 색 · 75 %", sx + sw, sy + 28, { s: 10.5, a: "right", c: KC.mute });

      /* 아래 표 */
      var cx0 = 176, cw = 236, ry1 = 384, ry2 = 420;
      for (var ci = 0; ci < 3; ci++) {
        K.t(ctx, TYPE[ci].name.replace(" 마그마", ""), cx0 + cw * ci + cw / 2, 376, { s: 11.5, a: "center", w: "800", c: ci === ti ? KCOL[ci] : KC.mute });
        for (var ri = 0; ri < 2; ri++) {
          var on = (ci === ti) && (ri === (coarse ? 1 : 0));
          var yy = ri === 0 ? ry1 : ry2;
          ctx.save();
          if (on) { ctx.shadowColor = KCOL[ci]; ctx.shadowBlur = 14; }
          ctx.fillStyle = on ? "rgba(255,255,255,.14)" : "rgba(255,255,255,.04)";
          ctx.strokeStyle = on ? KCOL[ci] : "rgba(200,210,255,.18)"; ctx.lineWidth = on ? 2 : 1;
          ctx.beginPath(); ctx.roundRect(cx0 + cw * ci + 4, yy, cw - 8, 30, 8); ctx.fill(); ctx.stroke(); ctx.restore();
          K.t(ctx, ri === 0 ? TYPE[ci].fast : TYPE[ci].slow, cx0 + cw * ci + cw / 2, yy + 20,
            { s: 13, a: "center", w: on ? "900" : "600", c: on ? KC.ink : KC.mute });
        }
      }
      K.t(ctx, "세립질 · 화산암", cx0 - 8, ry1 + 20, { s: 11.5, a: "right", w: "800", c: KC.orange });
      K.t(ctx, "조립질 · 심성암", cx0 - 8, ry2 + 20, { s: 11.5, a: "right", w: "800", c: KC.green });

      var ch = false;
      if (rock === "현무암" && !got.b) { got.b = ch = true; }
      if (rock === "반려암" && !got.g) { got.g = ch = true; }
      if (rock === "유문암" && !got.r) { got.r = ch = true; }
      if (rock === "화강암" && !got.gr) { got.gr = ch = true; }
      if (ch) { window.sthState("aRock", got); mission(); }

      $("a-rock-read").innerHTML = "완성된 암석: <b>" + rock + "</b> (결정 " + fmtMm(D) + ")";
      $("a-rock-info").innerHTML = "SiO₂ " + sio2 + " %는 <b>" + TYPE[ti].name + "</b>입니다. 깊이 " + km.toFixed(1) +
        " km에서 굳으면 다 식는 데 <b>" + fmtYears(t) + "</b>이 걸리고, 결정은 <b>" + fmtMm(D) + "</b>까지 자랍니다. 그래서 이 암석은 <b>" + rock + "</b>입니다." +
        (km > 0 && D < 1 ? " — 지하에서 굳었는데도 <b>세립질</b>입니다. 얕은 곳에 들어간 마그마는 둘레의 차가운 암석에 열을 금방 빼앗기기 때문입니다(암맥·암상의 조직이 이렇습니다)." :
          (km === 0 ? " 지표로 흘러나온 용암은 거의 곧바로 식어 결정이 자랄 틈이 없습니다." :
            " 깊이 묻힐수록 둘레도 뜨거워 천천히 식고, 그만큼 결정이 크게 자랍니다."));
    }
    function mission() {
      if (got.b) done("m1-3a"); if (got.g) done("m1-3b"); if (got.r) done("m1-3c"); if (got.gr) done("m1-3d");
      if (got.b && got.g && got.r && got.gr) {
        window.sthMission("m1-3", true, "<span class='m-tag'>미션 완료</span>가로줄(조성)과 세로줄(굳은 깊이)이 만나 이름이 정해집니다. SiO₂가 적으면 현무암·반려암, 많으면 유문암·화강암. 빨리 식으면 세립질(화산암), 천천히 식으면 조립질(심성암)입니다. <b>현무암과 반려암, 유문암과 화강암은 성분이 같고 조직만 다른 짝</b>입니다.");
        ep.clear(2);
      }
    }
    canvas._redraw = draw;
    $("a-sio2").addEventListener("input", function (e) {
      sio2 = +e.target.value; $("a-sio2-val").textContent = sio2 + " %"; draw();
    });
    $("a-crust").addEventListener("input", function (e) {
      km = +e.target.value; $("a-crust-val").textContent = km.toFixed(1) + " km"; draw();
    });
    draw(); mission();
  })();

  /* ---- 장면4 : 점성과 분출 양식 ---- */
  var G4 = window.sthState("aErupt") || { q: false, calm: false, boom: false };
  function mission4() {
    if (G4.calm) done("m1-4a"); if (G4.boom) done("m1-4b"); if (G4.q) done("m1-4c");
    if (G4.calm && G4.boom && G4.q) {
      window.sthMission("m1-4", true, "<span class='m-tag'>미션 완료</span>SiO₂가 많고 온도가 낮을수록 마그마는 끈적해집니다. 끈적하면 녹아 있던 가스가 빠져나가지 못하고 갇혀 있다가 <b>한꺼번에 터집니다.</b> 묽은 현무암질 마그마는 가스가 슬슬 빠져나가 <b>조용히 흘러</b> 넓은 용암대지를 만듭니다.");
      ep.clear(3); ep.clear(4);
    }
  }
  (function () {
    var canvas = $("a-c-erupt"), ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var S = 60, T = 1000, Hg = 2, tick = 0, quiet = false, playing = !REDUCE;

    function logEta() { return clamp(0.2 * (S - 50) + 0.00457 * (1200 - T) + 2 - 0.35 * Hg, 0, 12); }
    function boom() { return logEta() + 0.9 * Hg; }
    function style() { var E = boom(); return E < 4 ? 0 : (E < 7 ? 1 : 2); }
    var SNAME = ["조용한 용암류 분출", "중간 — 용암돔과 작은 폭발", "폭발적 분출 (화산재 · 화쇄류)"];

    function draw() {
      ctx.clearRect(0, 0, W, H);
      var le = logEta(), E = boom(), st = style();
      var SC = [KC.green, KC.yellow, KC.red];
      /* 왼쪽 무대: 화산 단면 */
      var LW = 492;
      K.stage(ctx, 0, 0, LW, 374, "night", { seed: 41, title: "점성이 정한다 — 흘러내릴까, 터질까", titleColor: KC.orange });
      ctx.save(); ctx.beginPath(); ctx.roundRect(0, 0, LW, 374, 14); ctx.clip();
      var gx = 246, gy = 262, top = gy - 128, u = (tick % 90) / 90;
      /* 땅속(단면) */
      rockFill(ctx, function () { ctx.beginPath(); ctx.rect(0, gy, LW, 374 - gy); }, 0, gy, LW, 374 - gy, "#4a3a30", "#1c1410", 12, "#ffd9b0");
      /* 마그마 굄 */
      var ch0 = ctx.createRadialGradient(gx, gy + 78, 4, gx, gy + 78, 80);
      ch0.addColorStop(0, "#ffe08a"); ch0.addColorStop(.35, "#ff8a2a"); ch0.addColorStop(1, "rgba(200,50,20,0)");
      ctx.fillStyle = ch0; ctx.beginPath(); ctx.ellipse(gx, gy + 78, 92, 34, 0, 0, 6.2832); ctx.fill();
      K.pill(ctx, "마그마 굄", gx + 70, gy + 98, { s: 11, c: KC.orange });
      /* 화산체 */
      rockFill(ctx, function () { ctx.beginPath(); ctx.moveTo(gx - 170, gy + 1); ctx.quadraticCurveTo(gx - 60, gy - 40, gx - 20, top); ctx.lineTo(gx + 20, top); ctx.quadraticCurveTo(gx + 60, gy - 40, gx + 170, gy + 1); ctx.closePath(); }, gx - 170, top, 340, gy - top + 2, "#6d6058", "#3a302a", 15);
      /* 화도(마그마가 오르는 길) */
      var cg = ctx.createLinearGradient(0, top, 0, gy + 60); cg.addColorStop(0, "#ffd36b"); cg.addColorStop(1, "#ff6a1f");
      ctx.save(); ctx.shadowColor = "#ff8a2a"; ctx.shadowBlur = 14; ctx.fillStyle = cg;
      ctx.beginPath(); ctx.moveTo(gx - 12, gy + 52); ctx.lineTo(gx - 7, top); ctx.lineTo(gx + 7, top); ctx.lineTo(gx + 12, gy + 52); ctx.closePath(); ctx.fill(); ctx.restore();
      /* 가스 거품: 묽으면 빠져나가고, 끈적하면 갇혀 커진다 */
      var nb = Math.round(3 + Hg * 2), Rb = rnd(5);
      for (var b = 0; b < nb; b++) {
        var ph = (u + b / nb) % 1, by0 = gy + 50 - ph * (gy + 50 - top);
        var br = st === 0 ? 2 : (st === 1 ? 2.6 : 2 + ph * 3.5);
        ctx.fillStyle = "rgba(255,255,255,.75)"; ctx.beginPath(); ctx.arc(gx - 5 + Rb() * 10, by0, br, 0, 6.2832); ctx.fill();
      }
      if (st === 0) {
        /* 용암류: 양쪽 비탈을 따라 멀리 흐른다 */
        [-1, 1].forEach(function (s) {
          ctx.save(); ctx.lineCap = "round"; ctx.shadowColor = "#ff7a1f"; ctx.shadowBlur = 16;
          var lg = ctx.createLinearGradient(gx, top, gx + s * 190, gy); lg.addColorStop(0, "#ffe08a"); lg.addColorStop(.5, "#ff7a1f"); lg.addColorStop(1, "#a8321a");
          ctx.strokeStyle = lg; ctx.lineWidth = 9;
          ctx.beginPath(); ctx.moveTo(gx + s * 6, top + 2); ctx.quadraticCurveTo(gx + s * 60, gy - 40, gx + s * (176 + u * 22), gy - 3); ctx.stroke(); ctx.restore();
          for (var k = 0; k < 3; k++) {
            var q = (u + k / 3) % 1, qx = (1 - q) * (1 - q) * (gx + s * 6) + 2 * (1 - q) * q * (gx + s * 60) + q * q * (gx + s * 186), qy = (1 - q) * (1 - q) * (top + 2) + 2 * (1 - q) * q * (gy - 40) + q * q * (gy - 3);
            K.glow(ctx, qx, qy, 2.4, "rgba(255,230,150,.95)", 3);
          }
        });
        K.pill(ctx, "용암이 멀리까지 흘러 넓게 퍼집니다", 18, 360, { s: 12, c: KC.orange });
      } else {
        var hgt = st === 1 ? 70 : 200, wid = st === 1 ? 34 : 90;
        if (st === 1) {
          var dg = ctx.createRadialGradient(gx, top, 2, gx, top, 30); dg.addColorStop(0, "#ffb347"); dg.addColorStop(.6, "#8a3a1a"); dg.addColorStop(1, "#4a2a1a");
          ctx.fillStyle = dg; ctx.beginPath(); ctx.ellipse(gx, top + 2, 28, 18, 0, Math.PI, 0); ctx.fill();
          K.pill(ctx, "용암돔", gx + 34, top - 6, { s: 11, c: KC.yellow });
        }
        for (var i = 0; i < 12; i++) {
          var f = ((i + u * 2) / 12) % 1;
          var ax = gx + Math.sin(i * 2.1) * wid * f, ay = top - 6 - f * hgt, ar = 9 + f * wid * 0.5;
          var ag = ctx.createRadialGradient(ax - ar * .3, ay - ar * .3, 1, ax, ay, ar);
          ag.addColorStop(0, st === 2 ? "rgba(190,180,175,.85)" : "rgba(200,190,180,.7)"); ag.addColorStop(1, "rgba(70,62,60,0)");
          ctx.fillStyle = ag; ctx.beginPath(); ctx.arc(ax, ay, ar, 0, Math.PI * 2); ctx.fill();
        }
        if (st === 2) {
          /* 화쇄류: 뜨거운 화산재가 비탈을 타고 내려온다 */
          [-1, 1].forEach(function (s) {
            for (var k = 0; k < 5; k++) {
              var q = (u * 1.4 + k / 5) % 1, px2 = gx + s * (14 + q * 150), py2 = top + 12 + q * (gy - top - 20);
              var pg = ctx.createRadialGradient(px2, py2, 1, px2, py2, 16 + q * 10); pg.addColorStop(0, "rgba(255,170,90,.75)"); pg.addColorStop(1, "rgba(120,90,80,0)");
              ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(px2, py2, 16 + q * 10, 0, 6.2832); ctx.fill();
            }
          });
          for (var bb = 0; bb < 5; bb++) { var bq = (u + bb / 5) % 1; K.glow(ctx, gx + (bb - 2) * 30 * bq, top - 20 - bq * 120 + bq * bq * 90, 2, "rgba(255,170,80,.95)", 3); }
          K.pill(ctx, "화쇄류", gx + 150, gy - 34, { s: 11, c: KC.red, box: [0, LW] });
        }
        K.pill(ctx, st === 2 ? "화산재 기둥이 높이 솟구칩니다" : "용암돔이 자라며 이따금 터집니다", 18, 360,
          { s: 12, c: st === 2 ? KC.red : KC.yellow });
      }
      ctx.restore();
      K.pill(ctx, "가스 거품", gx + 16, gy + 36, { s: 10.5, c: KC.ink });

      /* 오른쪽 계기판 */
      var RX = LW + 8, RW = W - RX;
      K.stage(ctx, RX, 0, RW, 374, "lab", { seed: 3 });
      var lx = RX + 22, lw = RW - 44;
      K.t(ctx, "마그마의 점성 (Pa·s)", lx, 40, { s: 12, w: "800", c: KC.mute });
      K.pill(ctx, "10^" + le.toFixed(1), lx + lw, 40, { s: 13, a: "right", c: le > 5 ? KC.red : KC.green, box: [RX, W] });
      gauge(ctx, lx, 54, lw, 14, le / 10, le > 5 ? KC.red : KC.green);
      K.t(ctx, "묽다", lx, 86, { s: 10.5, c: KC.dim }); K.t(ctx, "끈적하다", lx + lw, 86, { s: 10.5, a: "right", c: KC.dim });

      K.t(ctx, "폭발 지수", lx, 122, { s: 12, w: "800", c: KC.mute });
      K.pill(ctx, E.toFixed(2), lx + lw, 122, { s: 13, a: "right", c: SC[st], box: [RX, W] });
      gauge(ctx, lx, 136, lw, 14, E / 12, SC[st]);
      [[4, "4"], [7, "7"]].forEach(function (m) {
        var x = lx + lw * m[0] / 12;
        ctx.strokeStyle = KC.ink; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, 131); ctx.lineTo(x, 155); ctx.stroke();
        K.t(ctx, m[1], x, 170, { s: 10.5, a: "center", c: KC.mute });
      });
      K.t(ctx, "흘러내림", lx + lw * 2 / 12, 170, { s: 10, a: "center", c: KC.green });
      K.t(ctx, "터짐", lx + lw * 9.5 / 12, 170, { s: 10, a: "center", c: KC.red });

      ctx.save(); ctx.shadowColor = SC[st]; ctx.shadowBlur = 12;
      K.t(ctx, SNAME[st], lx, 222, { s: 17, w: "900", c: SC[st] }); ctx.restore();
      K.pill(ctx, "SiO₂ " + S + " %", lx, 256, { s: 12, c: KC.ink });
      K.pill(ctx, "온도 " + T + " °C", lx + 100, 256, { s: 12, c: KC.orange });
      K.pill(ctx, "가스 " + Hg.toFixed(1) + " %", lx + 214, 256, { s: 12, c: KC.blue, box: [RX, W] });
      K.t(ctx, "4 미만이면 흘러내리고, 7 이상이면 터집니다", lx, 292, { s: 11.5, c: KC.mute, w: "600" });
      K.t(ctx, "가스 거품이 화도에 갇혀 커질수록 위험합니다", lx, 314, { s: 11.5, c: KC.mute, w: "600" });

      /* 아래 설명 띠 */
      K.stage(ctx, 0, 382, W, 88, "night", { seed: 6 });
      K.t(ctx, "SiO₂가 많을수록, 온도가 낮을수록 끈적해집니다. 끈적한 마그마 속 가스는 빠져나가지 못하고 갇힙니다.", 18, 406, { s: 12, c: KC.ink, w: "600" });
      K.t(ctx, "제주도의 현무암질 용암은 멀리 흘러 넓은 대지를 만들었고, SiO₂가 많은 마그마는 화산재를 수십 km까지 날립니다.", 18, 430, { s: 12, c: KC.mute, w: "600" });
      K.t(ctx, "화산 관측소는 마그마의 조성을 먼저 알아내, 대피 반경과 방식을 다르게 정합니다.", 18, 454, { s: 12, c: KC.mute, w: "600" });
      if (quiet) return;

      var ch = false;
      if (st === 0 && !G4.calm) { G4.calm = ch = true; }
      if (st === 2 && !G4.boom) { G4.boom = ch = true; }
      if (ch) { window.sthState("aErupt", G4); mission4(); }

      $("a-erupt-read").innerHTML = "분출 양식: <b>" + SNAME[st] + "</b>";
      $("a-erupt-info").innerHTML =
        st === 0 ? "<b>조용히 흘러나옵니다.</b> 점성이 낮아 녹아 있던 가스가 슬슬 빠져나가므로 압력이 쌓이지 않습니다. 용암은 멀리까지 흘러 <b>넓고 완만한 지형</b>을 만듭니다. 한탄강 용암대지와 <span data-place=33.38,126.55,10,s>제주도의 용암류</span>가 이런 분출로 만들어졌습니다."
        : st === 1 ? "<b>그 중간입니다.</b> 용암이 멀리 흐르지는 못하고 분화구 위에 쌓여 <b>용암돔</b>을 만들며, 이따금 작은 폭발이 일어납니다. SiO₂나 가스를 조금만 더 올려 보세요."
        : "<b>폭발적으로 분출합니다.</b> 끈적한 마그마 속에 갇힌 가스가 한꺼번에 팽창하면서 마그마를 잘게 부수어 <b>화산재</b>로 날려 보내고, 뜨거운 화산재가 비탈을 타고 내려오는 <b>화쇄류</b>가 생깁니다. 대피 반경을 훨씬 넓게 잡아야 하는 분출입니다.";
    }
    canvas._redraw = draw;
    $("a-si2").addEventListener("input", function (e) { S = +e.target.value; $("a-si2-val").textContent = S + " %"; draw(); });
    $("a-temp2").addEventListener("input", function (e) { T = +e.target.value; $("a-temp2-val").textContent = T + " °C"; draw(); });
    $("a-h2o").addEventListener("input", function (e) { Hg = +e.target.value; $("a-h2o-val").textContent = Hg.toFixed(1) + " %"; draw(); });
    draw(); mission4();
    $("a-erupt-play").addEventListener("click", function () { playing = !playing; this.textContent = playing ? "⏸ 움직임 멈추기" : "▶ 움직임 보기"; });
    if (!playing) $("a-erupt-play").textContent = "▶ 움직임 보기";
    K.animate(canvas, function () { if (playing) { tick++; quiet = true; draw(); quiet = false; } });
  })();

  window.sthPick({
    mount: "a-q1",
    q: "어느 화산의 분화구에서 새로 올라온 마그마를 분석했더니 <b>SiO₂ 함량이 매우 높았습니다.</b> 관측소는 무엇을 준비해야 할까요?",
    options: [
      "㉠ 용암이 멀리 흐를 것에 대비해, 골짜기 아래쪽 마을만 비우면 된다",
      "㉡ 가스가 갇혀 폭발할 수 있으므로, 화산재와 화쇄류까지 생각해 대피 반경을 넓게 잡는다",
      "㉢ SiO₂는 분출 양식과 관계가 없으므로 평소처럼 감시만 한다"
    ],
    answer: 1,
    why: [
      "그것은 SiO₂가 적은 현무암질 마그마일 때의 대응입니다. 끈적한 마그마는 멀리 흐르지 못하는 대신 <b>터집니다.</b>",
      "그렇습니다. SiO₂가 많으면 점성이 커져 가스가 갇히고, 한꺼번에 터지면서 화산재와 화쇄류가 생깁니다. 용암류보다 훨씬 넓은 범위가 위험해집니다.",
      "관계가 큽니다. 실제 화산 재해 대응에서도 마그마의 조성으로 분출 양식을 먼저 가늠하고 대피 계획을 세웁니다."
    ],
    onDone: function () { G4.q = true; window.sthState("aErupt", G4); mission4(); }
  });

  function finish() { window.sthState("r1", "해결 · 마그마는 마찰열이 아니라 물·압력 감소·열로 생기고, 조성과 굳은 깊이가 암석 이름을 정한다"); }
  function vsA() {
    var p = window.sthState("subduct") || "";
    var box = $("a-vs");
    if (!box) return;
    box.innerHTML = "<b>나의 첫 판단</b> " + (p || "기록 없음") + "<br>" +
      (p.indexOf("㉢") === 0 ? "정확했습니다. 섭입하는 판에서 빠져나온 물이 위쪽 맨틀의 녹는점을 낮춰 부분 용융을 일으킵니다."
        : "㉢ 이 정답이었습니다. 마찰열도, 해양 지각이 직접 녹는 것도 아닙니다. <b>물이 공급되어 위쪽 맨틀이 부분 용융</b>됩니다.");
  }
  vsA();
  ep.onShow(vsA);
  window.sthWork({
    mount: "wkA", unitLabel: "[지구과학 Ⅱ-2] 이야기 ① 같은 마그마, 다른 돌",
    items: [
      { id: "w1", label: "마그마가 녹는 진짜 이유", hint: "섭입대에서 마그마가 생기는 과정을 물의 공급과 부분 용융으로 설명하세요. \"마찰열\"이라는 말은 쓰지 말 것.", ph: "" },
      { id: "w2", label: "같은 성분, 다른 조직", hint: "화강암과 유문암은 성분이 비슷한데 결정 크기가 다릅니다. 왜 그런지 쓰세요.", ph: "" }
    ]
  });
})();

/* =========================================================================
   이야기 ② 돌 한 덩이의 일생
   ========================================================================= */
(function () {
  var ep = window.sthStory({ root: "epB", key: "epB", name: "사건 파일 ②", onDone: finish });

  window.sthGate({
    gate: "b-gate", key: "b-p", title: "자갈을 들여다보기 전에",
    question: "편마암의 검고 흰 <b>줄무늬(엽리)</b>는 어떻게 생겼을까요?",
    options: [
      "㉠ 진흙과 모래가 번갈아 쌓여 층이 되었다",
      "㉡ 한 번 녹았다가 다시 굳으면서 무거운 광물이 가라앉아 층이 되었다",
      "㉢ 녹지 않은 채, 누르는 힘에 수직으로 광물이 줄지어 늘어섰다"
    ],
    onPick: function (i) { window.sthState("bPredOK", i === 2 ? "맞음" : "어긋남"); ep.clear(0); }
  });

  /* ---- 장면2 : 변성암 만들기 (온도-깊이) ---- */
  (function () {
    var canvas = $("b-c-meta"), ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var proto = "shale", T = 100, dep = 20;
    var got = window.sthState("bMeta") || { slate: false, schist: false, gneiss: false, marble: false, melt: false };

    var X0 = 90, X1 = 520, Y0 = 70, Y1 = 390;
    function XT(t) { return X0 + clamp(t, 0, 1000) / 1000 * (X1 - X0); }
    function YD(d) { return Y0 + clamp(d, 0, 40) / 40 * (Y1 - Y0); }

    function judge() {
      if (T < 200) return { n: proto === "shale" ? "셰일 (변성 전)" : (proto === "lime" ? "석회암 (변성 전)" : "사암 (변성 전)"), f: 0, k: "none" };
      if (dep < 8) {
        if (proto === "lime") return { n: "대리암", f: 0, k: "contact" };
        if (proto === "sand") return { n: "규암", f: 0, k: "contact" };
        return { n: "혼펠스", f: 0, k: "contact" };
      }
      if (proto === "lime") return { n: "대리암", f: 0, k: "regional" };
      if (proto === "sand") return { n: "규암", f: 0, k: "regional" };
      if (T < 400) return { n: "점판암", f: 1, k: "regional" };
      if (T < 600) return { n: "편암", f: 2, k: "regional" };
      if (T < 800) return { n: "편마암", f: 3, k: "regional" };
      return { n: "부분 용융 — 마그마가 되기 시작", f: 3, k: "melt" };
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      var J = judge();
      var LW = 548;
      K.stage(ctx, 0, 0, LW, H, "earth", { seed: 52, title: "변성 작용 — 녹지 않고 바뀌는 자리", titleColor: KC.violet });
      ctx.fillStyle = "rgba(255,255,255,.03)"; ctx.fillRect(X0, Y0, X1 - X0, Y1 - Y0);
      /* 영역 칠하기 (셰일 기준 눈금) */
      var zones = [
        [0, 200, 0, 40, "190,190,200", .10, "변성 전", KC.mute],
        [200, 1000, 0, 8, "255,211,107", .22, "접촉 변성", KC.yellow],
        [200, 400, 8, 40, "63,211,163", .16, "점판암", KC.green],
        [400, 600, 8, 40, "127,211,255", .17, "편암", KC.blue],
        [600, 800, 8, 40, "182,156,255", .20, "편마암", KC.violet],
        [800, 1000, 8, 40, "255,120,60", .30, "부분 용융", KC.orange]
      ];
      zones.forEach(function (z) {
        var x = XT(z[0]), y = YD(z[2]), w = XT(z[1]) - x, h = YD(z[3]) - y;
        var g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, "rgba(" + z[4] + "," + (z[5] * .6) + ")"); g.addColorStop(1, "rgba(" + z[4] + "," + z[5] + ")");
        ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = "rgba(200,210,255,.18)"; ctx.lineWidth = 1; ctx.strokeRect(x, y, w, h);
      });
      [[100, 24, 0], [600, 4, 1], [300, 24, 2], [500, 24, 3], [700, 24, 4], [900, 24, 5]].forEach(function (q) {
        K.pill(ctx, zones[q[2]][6], XT(q[0]), YD(q[1]) + 4, { s: 11, a: "center", c: zones[q[2]][7] });
      });
      ctx.strokeStyle = KC.line; ctx.lineWidth = 1.5; ctx.strokeRect(X0, Y0, X1 - X0, Y1 - Y0);
      [0, 200, 400, 600, 800, 1000].forEach(function (t) { K.t(ctx, t + "", XT(t), Y1 + 18, { s: 10, a: "center", c: KC.mute, w: "600" }); });
      K.t(ctx, "온도 (°C) →", X1, Y1 + 36, { s: 11, a: "right", c: KC.mute });
      [0, 10, 20, 30, 40].forEach(function (d) { K.t(ctx, d + "", X0 - 8, YD(d) + 4, { s: 10, a: "right", c: KC.mute, w: "600" }); });
      K.t(ctx, "깊이 (km) ↓", X0 - 8, Y0 - 10, { s: 11, a: "right", c: KC.mute });

      var px = XT(T), py = YD(dep);
      ctx.save(); ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.setLineDash([3, 4]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(X0, py); ctx.lineTo(px, py); ctx.moveTo(px, Y0); ctx.lineTo(px, py); ctx.stroke(); ctx.restore();
      K.glow(ctx, px, py, 6, J.k === "melt" ? "rgba(255,150,60,.95)" : "rgba(255,255,255,.95)", 3.4);
      ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(px, py, 10, 0, 6.2832); ctx.stroke();

      var nc = J.k === "none" ? KC.mute : (J.k === "melt" ? KC.orange : (J.k === "contact" ? KC.yellow : KC.green));
      ctx.save(); ctx.shadowColor = nc; ctx.shadowBlur = 12;
      K.t(ctx, J.n, 24, 444, { s: 23, w: "900", c: nc }); ctx.restore();
      K.t(ctx, "변성 작용은 암석이 녹기 직전까지, 고체인 채로 일어납니다.", 24, 468, { s: 11.5, c: KC.mute, w: "600" });
      K.t(ctx, "녹기 시작하면 그때부터는 마그마의 세계입니다.", 24, 485, { s: 11.5, c: KC.mute, w: "600" });

      /* 오른쪽: 손에 든 시료 */
      var RX = LW + 8, RW = W - RX;
      K.stage(ctx, RX, 0, RW, H, "earth", { seed: 9, title: "손에 든 시료" });
      var bx = RX + 22, by = 96, bw = RW - 44, bh = 236;
      ctx.save(); ctx.shadowColor = "rgba(0,0,0,.65)"; ctx.shadowBlur = 16; ctx.fillStyle = "#2a2220";
      ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 18); ctx.fill(); ctx.restore();
      ctx.save();
      ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 18); ctx.clip();
      var base = proto === "lime" ? ["#d9d4cc", "#a59e94"] : (proto === "sand" ? ["#d8c39a", "#a58c62"] : ["#5d5a5e", "#2f2d31"]);
      if (J.k !== "none" && proto === "shale") base = J.f >= 3 ? ["#8a8790", "#3a3840"] : ["#4a4a55", "#24232a"];
      var bg = ctx.createLinearGradient(bx, by, bx + bw, by + bh); bg.addColorStop(0, base[0]); bg.addColorStop(1, base[1]);
      ctx.fillStyle = bg; ctx.fillRect(bx, by, bw, bh);
      var rg = rnd(Math.round(T + dep * 37 + proto.length * 101));
      if (J.f === 0) {
        var big = J.k !== "none";
        for (var i = 0; i < 300; i++) {
          var gx = bx + rg() * bw, gy = by + rg() * bh, rr = big ? 2.4 + rg() * 3 : 1.2 + rg() * 1.4;
          var lc = proto === "lime" ? (rg() < .5 ? "#f6f3ee" : "#c9c2b8") : (proto === "sand" ? (rg() < .5 ? "#f1e2bf" : "#b89b6b") : (rg() < .5 ? "#8b8790" : "#1e1d22"));
          ctx.fillStyle = lc; ctx.globalAlpha = .85;
          if (big) { ctx.beginPath(); ctx.moveTo(gx - rr, gy); ctx.lineTo(gx, gy - rr * .8); ctx.lineTo(gx + rr, gy - rr * .2); ctx.lineTo(gx + rr * .6, gy + rr * .8); ctx.lineTo(gx - rr * .6, gy + rr * .7); ctx.closePath(); ctx.fill(); }
          else { ctx.beginPath(); ctx.arc(gx, gy, rr, 0, 6.2832); ctx.fill(); }
        }
        ctx.globalAlpha = 1;
      } else {
        var lines = J.f === 1 ? 26 : (J.f === 2 ? 16 : 9);
        for (var l = 0; l < lines; l++) {
          var yy = by + 12 + (l + 0.5) / lines * (bh - 24);
          ctx.save();
          var light = l % 2 === 0;
          ctx.strokeStyle = J.f === 3 ? (light ? "#e9e4dc" : "#1b1a20") : (J.f === 2 ? (light ? "#c9d3dc" : "#3a3f4a") : (light ? "#6b6f7a" : "#2a2b33"));
          ctx.lineWidth = J.f === 1 ? 1.6 : (J.f === 2 ? 3 : 7);
          ctx.globalAlpha = .9;
          if (J.f === 2 && light) { ctx.shadowColor = "rgba(220,235,255,.9)"; ctx.shadowBlur = 6; }   /* 운모의 반짝임 */
          ctx.beginPath();
          ctx.moveTo(bx + 4, yy);
          for (var xx = bx + 4; xx <= bx + bw - 4; xx += 10) ctx.lineTo(xx, yy + Math.sin((xx + l * 30) / 70) * (J.f === 3 ? 7 : 3));
          ctx.stroke(); ctx.restore();
        }
      }
      var shn = ctx.createLinearGradient(bx, by, bx + bw * .7, by + bh); shn.addColorStop(0, "rgba(255,255,255,.18)"); shn.addColorStop(.4, "rgba(255,255,255,0)");
      ctx.fillStyle = shn; ctx.fillRect(bx, by, bw, bh);
      ctx.restore();
      /* 누르는 힘 · 열 */
      if (J.k === "regional" && J.f > 0) {
        [bx + bw * .3, bx + bw * .7].forEach(function (ax) {
          K.arrow(ctx, { x: ax, y: by - 34 }, { x: ax, y: by - 6 }, KC.red, 3.5, 11);
          K.arrow(ctx, { x: ax, y: by + bh + 34 }, { x: ax, y: by + bh + 6 }, KC.red, 3.5, 11);
        });
        K.pill(ctx, "누르는 힘", bx + bw / 2, by - 16, { s: 11, a: "center", c: KC.red });
      } else if (J.k === "contact") {
        for (var hh = 0; hh < 5; hh++) K.glow(ctx, bx + bw * (hh + .5) / 5, by + bh + 22, 4, "rgba(255,150,60,.9)", 3.5);
        K.pill(ctx, "마그마의 열만 받음 — 방향성이 없음", bx + bw / 2, by - 14, { s: 11, a: "center", c: KC.yellow, box: [RX, W] });
      } else if (J.k === "melt") {
        for (var mh = 0; mh < 6; mh++) K.glow(ctx, bx + 20 + rg() * (bw - 40), by + 20 + rg() * (bh - 40), 3, "rgba(255,140,50,.95)", 4);
      }
      K.pill(ctx, J.f > 0 ? "엽리 있음" : "엽리 없음", bx + bw, by + bh + 58, { s: 12, a: "right", c: J.f > 0 ? KC.violet : KC.mute, box: [RX, W] });
      K.pill(ctx, "온도 " + T + " °C", RX + 22, H - 34, { s: 12, c: KC.orange });
      K.pill(ctx, "깊이 " + dep + " km · 약 " + (dep * 0.027).toFixed(2) + " GPa", RX + 22, H - 10, { s: 12, c: KC.blue, box: [RX, W] });

      var ch = false;
      if (proto === "shale" && dep >= 8) {
        if (J.n === "점판암" && !got.slate) { got.slate = ch = true; }
        if (J.n === "편암" && !got.schist) { got.schist = ch = true; }
        if (J.n === "편마암" && !got.gneiss) { got.gneiss = ch = true; }
        if (J.k === "melt" && !got.melt) { got.melt = ch = true; }
      }
      if (proto === "lime" && dep < 8 && T >= 200 && !got.marble) { got.marble = ch = true; }
      if (ch) { window.sthState("bMeta", got); mission(); }

      $("b-meta-read").innerHTML = "지금 이 암석: <b>" + J.n + "</b>";
      $("b-meta-info").innerHTML =
        J.k === "none" ? "아직 변성되지 않았습니다. 온도가 200 °C보다 낮으면 광물이 새로 자랄 만큼 원자가 움직이지 못합니다. <b>온도</b>를 올려 보세요."
        : J.k === "melt" ? "<b>변성 작용의 끝입니다.</b> 온도가 너무 높아져 암석의 일부가 녹기 시작했습니다(부분 용융). 여기서부터는 변성암이 아니라 <b>마그마</b>가 만들어지는 자리이고, 밝은 부분과 어두운 부분이 뒤엉킨 암석이 남습니다. 암석의 순환이 다시 출발점으로 돌아간 셈입니다."
        : J.k === "contact" ? "<b>접촉 변성 작용</b>입니다. 얕은 곳이라 누르는 압력이 약하고 <b>마그마의 열만</b> 주로 받습니다. 그래서 광물이 한 방향으로 줄서지 않아 <b>엽리가 생기지 않습니다.</b> 셰일은 단단한 <b>혼펠스</b>, 석회암은 <b>대리암</b>, 사암은 <b>규암</b>이 됩니다."
        : (proto === "shale"
          ? "<b>광역 변성 작용</b>입니다. 깊이 묻혀 <b>열과 압력을 함께</b> 받으면 납작한 광물이 누르는 힘에 수직으로 줄을 섭니다. 온도가 오를수록 <b>점판암 → 편암 → 편마암</b>으로 줄무늬가 굵어집니다. 지금은 <b>" + J.n + "</b>입니다."
          : "석영이나 방해석처럼 <b>모양이 둥근 광물</b>로만 이루어진 암석은 깊이 묻혀 눌려도 줄을 설 납작한 광물이 없어 <b>엽리가 생기지 않습니다.</b> 그래서 석회암은 어디서든 대리암, 사암은 규암이 됩니다.");
    }
    function mission() {
      if (got.slate && got.schist && got.gneiss) done("m2-2a");
      if (got.marble) done("m2-2b");
      if (got.melt) done("m2-2c");
      if (got.slate && got.schist && got.gneiss && got.marble && got.melt) {
        window.sthMission("m2-2", true, "<span class='m-tag'>미션 완료</span>같은 셰일 한 덩이가 온도에 따라 <b>점판암 → 편암 → 편마암</b>으로 등급이 올라가고, 더 뜨거워지면 <b>부분 용융</b>으로 끝납니다. 얕은 곳에서 열만 받으면 엽리 없는 혼펠스·대리암·규암이 됩니다.");
        ep.clear(1);
      }
    }
    canvas._redraw = draw;
    segWire("b-proto", function (b) { proto = b.getAttribute("data-p"); draw(); });
    $("b-t").addEventListener("input", function (e) { T = +e.target.value; $("b-t-val").textContent = T + " °C"; draw(); });
    $("b-d").addEventListener("input", function (e) { dep = +e.target.value; $("b-d-val").textContent = dep + " km"; draw(); });
    draw(); mission();
  })();

  /* ---- 장면3 : 접촉 변성대의 폭 ---- */
  var G3 = window.sthState("bAur") || { wide: false, narrow: false, out: false, sort: false };
  function mission3() {
    if (G3.wide) done("m2-3a"); if (G3.narrow) done("m2-3b"); if (G3.out) done("m2-3c"); if (G3.sort) done("m2-3d");
    if (G3.wide && G3.narrow && G3.out && G3.sort) {
      window.sthMission("m2-3", true, "<span class='m-tag'>미션 완료</span>접촉 변성대의 폭은 <b>관입한 마그마 덩어리의 크기에 비례</b>합니다. 작은 암맥 옆은 몇 m만 구워지고, 큰 암체 둘레는 수백 m가 변합니다. 그래도 <b>수백 km</b>에 걸쳐 일어나는 광역 변성에 비하면 아주 좁은 범위입니다.");
      ep.clear(2);
    }
  }
  (function () {
    var canvas = $("b-c-aur"), ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var R = 300, dist = 100;
    var SC = 0.16;
    function tempAt(x) { return 200 + 900 * Math.exp(-x / (0.4 * R)); }
    function width() { return 0.4 * R * Math.log(9); }
    function grade(t) { return t >= 700 ? 3 : (t >= 500 ? 2 : (t >= 300 ? 1 : 0)); }
    var GNAME = ["변성되지 않음", "약하게 변성됨", "혼펠스대", "강한 변성대"];

    function draw() {
      ctx.clearRect(0, 0, W, H);
      var Wd = width(), T = tempAt(dist), g = grade(T);
      var GC = [KC.mute, KC.green, KC.yellow, KC.red];
      var LW = 664;
      K.stage(ctx, 0, 0, LW, H, "earth", { seed: 61, title: "접촉 변성대 — 마그마 덩어리가 클수록 넓게 구워진다", titleColor: KC.orange });

      var X0 = 30, TOP = 72, BOT = 272, XE = LW - 18;
      var edge = X0 + R * SC;
      /* 둘레의 암석(셰일): 층리가 있는 회색 암석 */
      rockFill(ctx, function () { ctx.beginPath(); ctx.roundRect(X0, TOP, XE - X0, BOT - TOP, 10); }, X0, TOP, XE - X0, BOT - TOP, "#5b5650", "#3a3632", 31);
      ctx.save(); ctx.beginPath(); ctx.roundRect(X0, TOP, XE - X0, BOT - TOP, 10); ctx.clip();
      ctx.strokeStyle = "rgba(255,255,255,.07)"; ctx.lineWidth = 1;
      for (var ly = TOP + 12; ly < BOT; ly += 14) { ctx.beginPath(); ctx.moveTo(X0, ly); ctx.lineTo(XE, ly + 3); ctx.stroke(); }
      /* 변성대: 구워진 정도에 따라 붉게 달아오른 띠 */
      for (var x = 0; x < 3000; x += 20) {
        var gg = grade(tempAt(x));
        if (gg === 0) break;
        ctx.fillStyle = gg === 3 ? "rgba(255,107,129,.42)" : (gg === 2 ? "rgba(255,179,92,.34)" : "rgba(63,211,163,.24)");
        ctx.fillRect(edge + x * SC, TOP, 20 * SC + 0.6, BOT - TOP);
      }
      /* 관입한 마그마 */
      var mg = ctx.createLinearGradient(X0, 0, edge, 0); mg.addColorStop(0, "#ffe08a"); mg.addColorStop(.5, "#ff8a2a"); mg.addColorStop(1, "#c2410c");
      ctx.shadowColor = "#ff8a2a"; ctx.shadowBlur = 24; ctx.fillStyle = mg;
      ctx.fillRect(X0, TOP, Math.max(4, R * SC), BOT - TOP);
      ctx.restore();
      ctx.strokeStyle = KC.line; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.roundRect(X0, TOP, XE - X0, BOT - TOP, 10); ctx.stroke();
      K.pill(ctx, "관입한 마그마", X0 + 10, TOP + 24, { s: 12, c: KC.yellow });
      K.pill(ctx, "반지름 " + R + " m", X0 + 10, TOP + 48, { s: 11, c: KC.orange });
      K.pill(ctx, "둘레의 암석(셰일)", XE - 10, BOT - 12, { s: 12, a: "right", c: KC.ink });
      /* 변성대 폭 */
      K.bracket(ctx, edge, edge + Wd * SC, BOT + 12, KC.ink, "", false);
      K.pill(ctx, "변성대 폭 " + Wd.toFixed(0) + " m", clamp(edge + Wd * SC / 2, 90, LW - 90), BOT + 36, { s: 11.5, a: "center", c: KC.ink, box: [0, LW] });
      /* 지금 보고 있는 지점 */
      var mx = edge + dist * SC;
      ctx.save(); ctx.strokeStyle = KC.violet; ctx.lineWidth = 2.5; ctx.setLineDash([5, 4]); ctx.shadowColor = KC.violet; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.moveTo(mx, TOP - 8); ctx.lineTo(mx, BOT); ctx.stroke(); ctx.restore();
      if (mx <= XE + 40) K.pill(ctx, "🔍 여기", clamp(mx, 60, LW - 60), TOP - 12, { s: 11.5, a: "center", c: KC.violet, box: [0, LW] });

      /* 아래 온도 그래프 */
      var gy0 = 330, gy1 = 420, gx0 = X0 + 40, gx1 = XE - 10;
      function GY(t) { return gy1 - clamp(t, 0, 1200) / 1200 * (gy1 - gy0); }
      ctx.fillStyle = "rgba(255,255,255,.035)"; ctx.fillRect(gx0, gy0, gx1 - gx0, gy1 - gy0);
      ctx.strokeStyle = KC.line; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(gx0, gy0); ctx.lineTo(gx0, gy1); ctx.lineTo(gx1, gy1); ctx.stroke();
      [0, 600, 1200].forEach(function (t) { K.t(ctx, t + "", gx0 - 6, GY(t) + 4, { s: 9.5, a: "right", c: KC.mute, w: "600" }); });
      K.t(ctx, "°C", gx0 - 6, gy0 - 6, { s: 9.5, a: "right", c: KC.mute });
      var pts = [];
      for (var q = 0; q <= 4000; q += 25) { var xx = gx0 + q * SC; if (xx > gx1) break; pts.push([xx, GY(tempAt(q))]); }
      ctx.save(); ctx.strokeStyle = KC.orange; ctx.lineWidth = 2.5; ctx.shadowColor = KC.orange; ctx.shadowBlur = 8; ctx.beginPath();
      pts.forEach(function (p, i) { if (i) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); }); ctx.stroke(); ctx.restore();
      ctx.save(); ctx.strokeStyle = KC.mute; ctx.lineWidth = 1.2; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(gx0, GY(300)); ctx.lineTo(gx1, GY(300)); ctx.stroke(); ctx.restore();
      K.pill(ctx, "300 °C — 변성이 시작되는 온도", gx1 - 6, GY(300) - 6, { s: 10.5, a: "right", c: KC.mute });
      if (gx0 + dist * SC <= gx1) K.glow(ctx, gx0 + dist * SC, GY(T), 4.5, "rgba(182,156,255,.95)", 3.5);
      K.t(ctx, "마그마 가장자리에서의 거리 (m) →", gx1, gy1 + 20, { s: 10.5, a: "right", c: KC.mute });
      [0, 1000, 2000, 3000].forEach(function (q) {
        var xx = gx0 + q * SC; if (xx > gx1 - 190) return;
        K.t(ctx, q + "", xx, gy1 + 20, { s: 10, a: "center", c: KC.mute, w: "600" });
      });

      /* 오른쪽 판정 */
      var RX = LW + 8, RW = W - RX, px = RX + 20;
      K.stage(ctx, RX, 0, RW, H, "night", { seed: 4 });
      K.t(ctx, "판정", px, 40, { s: 12, w: "800", c: KC.mute });
      ctx.save(); ctx.shadowColor = GC[g]; ctx.shadowBlur = 12;
      K.t(ctx, GNAME[g], px, 72, { s: 17, w: "900", c: GC[g] }); ctx.restore();
      K.t(ctx, "이 자리의 최고 온도", px, 116, { s: 11.5, w: "800", c: KC.mute });
      K.t(ctx, T.toFixed(0) + " °C", px, 144, { s: 22, w: "900", c: KC.orange });
      gauge(ctx, px, 156, RW - 40, 10, T / 1100, KC.orange);
      K.t(ctx, "변성대의 폭", px, 204, { s: 11.5, w: "800", c: KC.mute });
      K.t(ctx, Wd.toFixed(0) + " m", px, 232, { s: 22, w: "900", c: KC.green });
      K.pill(ctx, "폭 ≈ 반지름 × 0.88", px, 262, { s: 11, c: KC.ink, box: [RX, W] });
      glass(ctx, px - 6, 300, RW - 28, 76, 10);
      K.t(ctx, "광역 변성은", px + 6, 326, { s: 11.5, w: "800", c: KC.mute });
      K.t(ctx, "수백 km 규모", px + 6, 356, { s: 16, w: "900", c: KC.violet });

      var ch = false;
      if (Wd >= 500 && !G3.wide) { G3.wide = ch = true; }
      if (Wd <= 100 && !G3.narrow) { G3.narrow = ch = true; }
      if (g === 0 && !G3.out) { G3.out = ch = true; }
      if (ch) { window.sthState("bAur", G3); mission3(); }

      $("b-aur-read").innerHTML = "접촉 변성대의 폭: <b>" + Wd.toFixed(0) + " m</b> (지금 자리 " + T.toFixed(0) + " °C)";
      $("b-aur-info").innerHTML = "반지름 " + R + " m 인 마그마가 관입하면 둘레 <b>" + Wd.toFixed(0) + " m</b> 까지가 300 °C를 넘어 변성됩니다. " +
        (g === 0 ? "지금 보고 있는 <b>" + dist + " m</b> 지점은 변성대 <b>바깥</b>입니다. 이렇게 가까운 곳에서도 <b>변성된 암석과 그렇지 않은 암석이 뚜렷이 나뉘는 것</b>이 접촉 변성의 특징입니다."
          : "지금 보고 있는 <b>" + dist + " m</b> 지점은 " + T.toFixed(0) + " °C까지 올라가 <b>" + GNAME[g] + "</b>입니다. 마그마에 가까울수록 더 세게 구워집니다.") +
        " 접촉 변성은 이렇게 <b>마그마 둘레 좁은 범위</b>에서만 일어나므로, 조산대 전체가 바뀌는 광역 변성과는 규모부터 다릅니다.";
    }
    canvas._redraw = draw;
    $("b-size").addEventListener("input", function (e) { R = +e.target.value; $("b-size-val").textContent = R + " m"; draw(); });
    $("b-dist").addEventListener("input", function (e) { dist = +e.target.value; $("b-dist-val").textContent = dist + " m"; draw(); });
    draw(); mission3();
  })();

  window.sthSort({
    mount: "b-sort",
    buckets: [
      { id: "con", label: "접촉 변성 작용", sub: "마그마 둘레, 주로 열" },
      { id: "reg", label: "광역 변성 작용", sub: "조산대·섭입대, 열과 압력" }
    ],
    items: [
      { t: "마그마가 관입한 자리 둘레 수십 ~ 수백 m만 바뀐다", a: "con", why: "변성대의 폭은 관입체 크기에 비례해 좁습니다." },
      { t: "조산대를 따라 수백 km에 걸쳐 바뀐다", a: "reg", why: "판이 부딪치는 곳에서는 넓은 지역이 통째로 변성됩니다.", hint: "범위가 얼마나 넓은지 생각해 보세요." },
      { t: "혼펠스 — 엽리가 거의 없는 아주 단단한 암석", a: "con", why: "열만 받아 방향성이 생기지 않았습니다." },
      { t: "편암과 편마암 — 뚜렷한 엽리", a: "reg", why: "강한 압력이 광물을 한 방향으로 줄 세웠습니다." },
      { t: "마그마 관입부 둘레에서 석회암이 대리암으로 바뀐다", a: "con", why: "석회암이 열을 받아 방해석이 크게 재결정된 것입니다." },
      { t: "판이 섭입하는 곳을 따라 넓은 띠 모양으로, 온도보다 압력이 크게 높아지는 변성이 일어난다", a: "reg", why: "차가운 판이 빠르게 내려가며 압력이 급히 높아지는 고압 변성으로, 넓은 지역에 걸치는 광역 변성의 한 종류입니다." },
      { t: "광물이 새로 자라기는 하지만 줄을 서지는 않는다", a: "con", why: "누르는 방향이 뚜렷하지 않기 때문입니다." },
      { t: "누르는 힘에 수직으로 광물이 배열되어 줄무늬가 생긴다", a: "reg", why: "이것이 엽리이며, 광역 변성의 가장 뚜렷한 증거입니다." }
    ],
    onDone: function () { G3.sort = true; window.sthState("bAur", G3); mission3(); }
  });

  /* ---- 장면4 : 암석의 순환 돌리기 ---- */
  var G4 = window.sthState("bCycle") || { a: false, b: false, c: false, d1: false, d2: false, e: false };
  function mission4() {
    if (G4.a) done("m2-4a"); if (G4.b) done("m2-4b"); if (G4.c) done("m2-4c");
    if (G4.d1 && G4.d2) done("m2-4d");
    if (G4.e) done("m2-4e");
    if (G4.a && G4.b && G4.c && G4.d1 && G4.d2 && G4.e) {
      window.sthMission("m2-4", true, "<span class='m-tag'>미션 완료</span>암석은 <b>화성암 → 퇴적암 → 변성암 → 마그마</b>라는 한 방향 길만 도는 것이 아닙니다. 화성암이 곧장 변성암이 되기도 하고, 변성암이 다시 풍화되어 퇴적물이 되기도 합니다. 지구 시스템 안에서 <b>물질은 사라지지 않고 모습만 바꾸며 돕니다.</b>");
      ep.clear(3); ep.clear(4);
    }
  }
  (function () {
    var canvas = $("b-c-cycle"), ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var saved = window.sthState("bCycleNow") || { at: "magma", yrs: 0, log: ["마그마"] };
    var at = saved.at, yrs = saved.yrs, log = saved.log || ["마그마"];
    var last = "", quiet = false;
    var N = {
      magma: { name: "마그마", x: 140, y: 240, c: "--coral" },
      ign: { name: "화성암", x: 330, y: 104, c: "--rose" },
      sedi: { name: "퇴적물", x: 590, y: 104, c: "--amber" },
      sed: { name: "퇴적암", x: 790, y: 240, c: "--teal" },
      meta: { name: "변성암", x: 460, y: 384, c: "--violet" }
    };
    var EDGE = [["magma", "ign"], ["ign", "sedi"], ["sedi", "sed"], ["sed", "meta"], ["meta", "magma"],
                ["ign", "meta"], ["sed", "magma"], ["meta", "sedi"], ["sed", "sedi"], ["ign", "magma"]];

    var ACT = {
      "b-a1": { k: "cool", label: "냉각 · 고결", from: { magma: "ign" }, yrs: 1e4,
        no: "지금 이 돌은 이미 굳어 있습니다. 냉각·고결은 <b>마그마</b>에게만 일어나는 일입니다." },
      "b-a2": { k: "weather", label: "풍화 · 침식 · 운반", from: { ign: "sedi", sed: "sedi", meta: "sedi" }, yrs: 1e6,
        no: "땅속의 마그마나 이미 부서진 퇴적물에는 일어날 수 없습니다. <b>지표에 드러난 단단한 암석</b>이라야 풍화·침식을 받습니다." },
      "b-a3": { k: "lith", label: "다져짐 · 굳어짐(속성 작용)", from: { sedi: "sed" }, yrs: 1e6,
        no: "속성 작용은 <b>쌓인 퇴적물</b>이 눌리고 굳어 퇴적암이 되는 과정입니다. 단단한 암석에는 일어나지 않습니다." },
      "b-a4": { k: "meta", label: "열과 압력(변성 작용)", from: { ign: "meta", sed: "meta", meta: "meta" }, yrs: 1e7,
        no: "아직 굳지 않은 퇴적물이나 이미 녹아 있는 마그마는 변성될 수 없습니다. 변성은 <b>고체 암석</b>에게 일어납니다." },
      "b-a5": { k: "melt", label: "더 큰 열 — 용융", from: { ign: "magma", sed: "magma", meta: "magma" }, yrs: 1e6,
        no: "마그마는 이미 녹아 있고, 퇴적물은 먼저 굳어 암석이 되어야 합니다." }
    };

    var flow = null;   /* 방금 지나간 길 위를 달리는 빛 (한 번만) */
    var LOOK = {
      magma: ["#ffd36b", "#c2410c"], ign: ["#d6b3b8", "#5a3a44"], sedi: ["#e8cf8e", "#6b5320"],
      sed: ["#9fd8cf", "#1f5a54"], meta: ["#c6b6ff", "#3f3380"]
    };
    var STEP = { "magma>ign": "냉각·고결", "ign>sedi": "풍화·침식", "sedi>sed": "다져짐·굳어짐", "sed>meta": "열·압력", "meta>magma": "용융" };
    function node(k, n, cur) {
      var L = LOOK[k], r = 44;
      if (k === "magma") K.glow(ctx, n.x, n.y, r * .9, "rgba(255,150,60,.85)", 1.6);
      if (cur) { ctx.save(); ctx.shadowColor = "#ffffff"; ctx.shadowBlur = 22; ctx.strokeStyle = "rgba(255,255,255,.95)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(n.x, n.y, r + 7, 0, 6.2832); ctx.stroke(); ctx.restore(); }
      ctx.save(); ctx.globalAlpha = cur ? 1 : .55;
      K.planet(ctx, n.x, n.y, r, L[0], L[1]);
      ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, 6.2832); ctx.clip();
      var R = rnd(k.length * 17);
      if (k === "sed") { ctx.strokeStyle = "rgba(255,255,255,.22)"; ctx.lineWidth = 3; for (var i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(n.x - r, n.y + i * 12); ctx.lineTo(n.x + r, n.y + i * 12 + 2); ctx.stroke(); } }
      else if (k === "meta") { ctx.strokeStyle = "rgba(20,10,60,.4)"; ctx.lineWidth = 4; for (var j = -3; j <= 3; j++) { ctx.beginPath(); ctx.moveTo(n.x - r, n.y + j * 13); for (var xx = -r; xx <= r; xx += 8) ctx.lineTo(n.x + xx, n.y + j * 13 + Math.sin(xx / 9 + j) * 4); ctx.stroke(); } }
      else if (k === "sedi") { for (var s = 0; s < 40; s++) { ctx.fillStyle = R() > .5 ? "rgba(255,255,255,.35)" : "rgba(60,40,10,.45)"; ctx.beginPath(); ctx.arc(n.x + (R() - .5) * 2 * r, n.y + (R() - .5) * 2 * r, 2 + R() * 3, 0, 6.2832); ctx.fill(); } }
      else if (k === "ign") { for (var c = 0; c < 46; c++) { ctx.fillStyle = R() > .6 ? "rgba(20,20,25,.55)" : "rgba(255,255,255,.35)"; ctx.fillRect(n.x + (R() - .5) * 2 * r, n.y + (R() - .5) * 2 * r, 3 + R() * 4, 2 + R() * 3); } }
      ctx.restore();
      K.pill(ctx, n.name, n.x, n.y + 6, { s: 14, a: "center", c: cur ? "#ffffff" : KC.ink });
      if (cur) K.pill(ctx, "지금 이 돌", n.x, n.y - r - 14, { s: 11, a: "center", c: KC.yellow });
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      K.stage(ctx, 0, 0, W, H, "night", { seed: 71, title: "암석의 순환 — 이 돌에게 일어날 일을 골라 보세요" });
      /* 바탕: 위는 지표, 아래는 땅속 */
      var sg = ctx.createLinearGradient(0, 180, 0, H); sg.addColorStop(0, "rgba(120,80,50,0)"); sg.addColorStop(1, "rgba(150,70,30,.22)");
      ctx.fillStyle = sg; ctx.fillRect(0, 180, W, H - 180);
      K.t(ctx, "지표 ↑", W - 18, 72, { s: 10.5, a: "right", c: KC.dim });
      K.t(ctx, "땅속 ↓", W - 18, 424, { s: 10.5, a: "right", c: KC.dim });
      K.pill(ctx, "이 돌이 살아온 시간 " + fmtYears(yrs), W - 16, 28, { s: 13, a: "right", c: KC.blue });

      var cx = 465, cy = 250;
      EDGE.forEach(function (e) {
        var A = N[e[0]], B = N[e[1]];
        var ang = Math.atan2(B.y - A.y, B.x - A.x);
        var x1 = A.x + Math.cos(ang) * 54, y1 = A.y + Math.sin(ang) * 54;
        var x2 = B.x - Math.cos(ang) * 56, y2 = B.y - Math.sin(ang) * 56;
        var on = last === e[0] + ">" + e[1];
        /* 같은 두 자리를 오가는 길은 조금 비켜 그린다 */
        var off = (e[0] === "ign" && e[1] === "magma") || (e[0] === "sed" && e[1] === "sedi") ? 7 : ((e[0] === "magma" && e[1] === "ign") || (e[0] === "sedi" && e[1] === "sed") ? -7 : 0);
        var ox = -Math.sin(ang) * off, oy = Math.cos(ang) * off;
        ctx.save();
        if (on) { ctx.shadowColor = KC.blue; ctx.shadowBlur = 12; }
        K.arrow(ctx, { x: x1 + ox, y: y1 + oy }, { x: x2 + ox, y: y2 + oy }, on ? KC.blue : "rgba(200,210,255,.32)", on ? 4 : 1.6, on ? 13 : 8);
        ctx.restore();
        var lab = STEP[e[0] + ">" + e[1]];
        if (lab) {
          var mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2, dx = mx - cx, dy = my - cy, dl = Math.sqrt(dx * dx + dy * dy) || 1;
          K.pill(ctx, lab, mx + dx / dl * 26, my + dy / dl * 26 + 4, { s: 10.5, a: "center", c: on ? KC.blue : KC.mute });
        }
      });
      if (flow) {
        var A2 = N[flow.a], B2 = N[flow.b], u = Math.min(1, flow.t / 900);
        for (var k = 0; k < 4; k++) { var uu = Math.max(0, u - k * .05); K.glow(ctx, A2.x + (B2.x - A2.x) * uu, A2.y + (B2.y - A2.y) * uu, 4 - k * .7, "rgba(127,211,255,.95)", 3.5); }
      }
      Object.keys(N).forEach(function (k) { node(k, N[k], k === at); });

      var tail = log.slice(-6).join("  →  ");
      glass(ctx, 14, 438, W - 28, 44, 10);
      K.t(ctx, "지나온 길", 30, 465, { s: 11.5, w: "800", c: KC.mute });
      K.t(ctx, tail, 104, 465, { s: 12.5, w: "800", c: KC.ink });

      if (quiet) return;
      $("b-cycle-read").innerHTML = "지금 이 돌은: <b>" + N[at].name + "</b> (살아온 시간 " + fmtYears(yrs) + ")";
    }
    function act(id) {
      var A = ACT[id], to = A.from[at];
      if (!to) {
        $("b-cycle-info").innerHTML = "❌ <b>" + N[at].name + "</b> 에게는 ‘" + A.label + "’가 일어날 수 없습니다. " + A.no;
        return;
      }
      var fromKey = at;
      at = to; yrs += A.yrs; log.push(N[to].name);
      if (log.length > 40) log = log.slice(-40);
      last = fromKey + ">" + to;
      flow = REDUCE ? null : { a: fromKey, b: to, t: 0 };
      window.sthState("bCycleNow", { at: at, yrs: yrs, log: log });

      var ch = false;
      if (fromKey === "sedi" && to === "sed" && !G4.a) { G4.a = ch = true; }
      if (fromKey === "sed" && to === "meta" && !G4.b) { G4.b = ch = true; }
      if (fromKey === "ign" && to === "meta" && !G4.c) { G4.c = ch = true; }
      if (fromKey === "meta" && to === "magma" && !G4.d1) { G4.d1 = ch = true; }
      if (fromKey === "magma" && to === "ign" && !G4.d2) { G4.d2 = ch = true; }
      if (ch) { window.sthState("bCycle", G4); mission4(); }

      var NOTE = {
        cool: "마그마가 식어 굳으면 <b>화성암</b>이 됩니다. 지표 부근이면 며칠 ~ 몇 해, 지하 깊은 곳이면 수만 ~ 수십만 년이 걸립니다.",
        weather: "지표에 드러난 암석은 물·공기·생물의 작용으로 부서지고(풍화), 물과 바람에 실려 나가(침식·운반) <b>퇴적물</b>이 됩니다.",
        lith: "쌓인 퇴적물이 위에서 눌리고 틈이 광물로 메워져 단단해지면(<b>속성 작용</b>) 퇴적암이 됩니다.",
        meta: "높은 열과 압력을 받아 <b>녹지 않은 채</b> 광물과 조직이 바뀌면 변성암이 됩니다. 변성암이 더 센 조건을 받으면 등급이 더 높은 변성암이 됩니다.",
        melt: "녹는점을 넘어서면 암석이 녹아 <b>마그마</b>가 됩니다. 순환이 처음으로 돌아왔습니다."
      };
      $("b-cycle-info").innerHTML = "✅ <b>" + N[fromKey].name + " → " + N[to].name + "</b> (" + A.label + " · 대표 소요 시간 " + fmtYears(A.yrs) + ")<br>" + NOTE[A.k];
      draw();
    }

    canvas._redraw = draw;
    K.animate(canvas, function (dt) { if (flow) { flow.t += dt; if (flow.t > 1100) flow = null; quiet = true; draw(); quiet = false; } });
    Object.keys(ACT).forEach(function (id) {
      var b = $(id);
      if (b) b.addEventListener("click", function () { act(id); });
    });
    segWire("b-start", function (b) {
      var k = b.getAttribute("data-s");
      at = k; yrs = 0; log = [N[k].name]; last = "";
      window.sthState("bCycleNow", { at: at, yrs: yrs, log: log });
      $("b-cycle-info").innerHTML = "이번에는 <b>" + N[k].name + "</b>에서 출발합니다. 순환은 어디서 시작해도 됩니다 — 정해진 출발점이 없다는 것이 바로 ‘순환’의 뜻입니다. 여기서 일어날 수 있는 일을 골라 보세요.";
      draw();
    });
    (function () {
      var g = $("b-start");
      if (g) Array.prototype.forEach.call(g.querySelectorAll("button"), function (b) { b.classList.toggle("on", b.getAttribute("data-s") === at); });
    })();
    draw(); mission4();
    $("b-cycle-info").innerHTML = "지금 이 돌은 <b>" + N[at].name + "</b>입니다. 위의 단추를 눌러 무슨 일이 일어나는지 보세요. 일어날 수 없는 일을 고르면 그 까닭을 알려 줍니다.";
  })();

  window.sthOrder({
    mount: "b-order",
    steps: [
      "① 바다 밑에 고운 진흙이 쌓이고 굳어 셰일이 되었다",
      "② 판이 부딪치는 조산 운동으로 지하 깊은 곳까지 끌려 들어갔다",
      "③ 녹지 않은 채 광물이 새로 자라며 엽리가 생겨 편암이 되었다",
      "④ 온도가 더 올라가 밝은 띠와 어두운 띠로 갈라진 편마암이 되었다",
      "⑤ 위를 덮고 있던 암석이 깎여 나가 지표에 드러났다",
      "⑥ 풍화·침식으로 부서져 굴러다니다 학교 화단의 자갈이 되었다"
    ],
    onDone: function () { G4.e = true; window.sthState("bCycle", G4); mission4(); }
  });

  function finish() { window.sthState("r2", "해결 · 엽리는 쌓인 것도 녹은 것도 아니다, 고체인 채 눌려 줄선 것이고 순환은 다시 마그마로 간다"); }
  function vsB() {
    var p = window.sthState("b-p") || "";
    var box = $("b-vs");
    if (!box) return;
    box.innerHTML = "<b>나의 첫 판단</b> " + (p || "기록 없음") + "<br>" +
      (p.indexOf("㉢") === 0 ? "정확했습니다. 변성 작용은 암석이 녹지 않은 채 고체 상태로 일어나는 변화입니다."
        : "㉢ 이 정답이었습니다. 쌓여서 생긴 층(퇴적 구조)도, 녹았다가 굳은 층도 아닙니다. <b>고체인 채로</b> 광물이 눌리는 힘에 수직으로 줄을 선 것입니다.");
  }
  vsB();
  ep.onShow(vsB);
  window.sthWork({
    mount: "wkB", unitLabel: "[지구과학 Ⅱ-2] 이야기 ② 돌 한 덩이의 일생",
    items: [
      { id: "w3", label: "암석의 순환", hint: "고른 암석 하나가 다른 암석으로 바뀌는 경로를 두 가지 이상 쓰세요.", ph: "" },
      { id: "b2", label: "친구에게 설명하는 엽리", hint: "“줄무늬가 있으니까 퇴적암 아니야?”라고 묻는 친구에게, 엽리가 생기는 과정을 들어 답해 주세요." }
    ]
  });
})();

/* =========================================================================
   이야기 ③ 지질공원 해설사
   ========================================================================= */
(function () {
  var ep = window.sthStory({ root: "epC", key: "epC", name: "사건 파일 ③", onDone: finish });

  window.sthGate({
    gate: "c-gate", key: "c-p", title: "1번 시료를 판정하기 전에",
    question: "결정이 전혀 보이지 않는 <b>세립질</b> 암석입니다. 이 돌은 반드시 지표로 분출한 화산암일까요?",
    options: [
      "㉠ 그렇다 — 세립질이면 언제나 지표로 흘러나와 굳은 화산암이다",
      "㉡ 아니다 — 얕은 곳에 얇게 관입한 암맥·암상도 빨리 식어 세립질이 된다",
      "㉢ 아니다 — 세립질은 오히려 지하 깊은 곳에서 굳었다는 뜻이다"
    ],
    onPick: function (i) { window.sthState("cPredOK", i === 1 ? "맞음" : "어긋남"); ep.clear(0); }
  });

  /* ---- 장면2 : 두께가 정하는 결정 크기 ---- */
  (function () {
    var canvas = $("c-c-grain"), ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var th = 600, dep = 3, field = false;
    var got = window.sthState("cGrain") || { fine: false, coarse: false, trap: false };
    var KAPPA = 31.5;                                  /* 열확산 계수 (m²/년) */

    function years() { return (th / 2) * (th / 2) / KAPPA * (1 + dep / 5); }
    function grain() { return 0.02 * Math.sqrt(years()); }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      var t = years(), D = grain(), coarse = D >= 1;
      K.stage(ctx, 0, 0, W, H, "earth", { seed: 81, title: "결정 크기를 정하는 것은 ‘지표냐 지하냐’가 아니라 ‘얼마나 빨리 식었나’ 다", titleColor: KC.orange });

      /* 왼쪽 노두 */
      var ox = 28, oy = 64, ow = 400, oh = 256;
      ctx.save();
      ctx.beginPath(); ctx.roundRect(ox, oy, ow, oh, 12); ctx.clip();
      var LAY = [["#7d8a8f", "#5c676b"], ["#b59a6a", "#8a7148"], ["#5d6e86", "#3f4d62"], ["#a7a39b", "#7b776f"], ["#7d8a8f", "#5c676b"]];
      for (var i = 0; i < 5; i++) {
        var ly = oy + i * oh / 5;
        rockFill(ctx, function () { ctx.beginPath(); ctx.rect(ox, ly, ow, oh / 5 + 1); }, ox, ly, ow, oh / 5 + 1, LAY[i][0], LAY[i][1], 90 + i);
        ctx.strokeStyle = "rgba(0,0,0,.35)"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(ox, ly); ctx.lineTo(ox + ow, ly); ctx.stroke();
      }
      var pw = clamp(th * 0.045, 6, 150);
      ctx.save();
      ctx.translate(ox + ow / 2, oy + oh / 2); ctx.rotate(0.22); ctx.translate(-(ox + ow / 2), -(oy + oh / 2));
      var dg = ctx.createLinearGradient(ox + ow / 2 - pw / 2, 0, ox + ow / 2 + pw / 2, 0);
      dg.addColorStop(0, "#2a2a30"); dg.addColorStop(.15, "#55505a"); dg.addColorStop(.5, "#6a6470"); dg.addColorStop(.85, "#55505a"); dg.addColorStop(1, "#2a2a30");
      ctx.fillStyle = dg; ctx.fillRect(ox + ow / 2 - pw / 2, oy - 90, pw, oh + 180);
      /* 둘레가 구워진 흔적(접촉부) */
      ctx.strokeStyle = "rgba(255,150,80,.45)"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(ox + ow / 2 - pw / 2 - 2, oy - 90); ctx.lineTo(ox + ow / 2 - pw / 2 - 2, oy + oh + 90);
      ctx.moveTo(ox + ow / 2 + pw / 2 + 2, oy - 90); ctx.lineTo(ox + ow / 2 + pw / 2 + 2, oy + oh + 90); ctx.stroke();
      ctx.restore();
      if (!field) {
        /* 시료 한 조각만 보인다: 둘레는 흐리게 가린다 */
        ctx.fillStyle = "rgba(14,10,8,.82)";
        ctx.beginPath(); ctx.rect(ox, oy, ow, oh); ctx.arc(ox + ow / 2, oy + oh / 2, 44, 0, 6.2832, true); ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,.6)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(ox + ow / 2, oy + oh / 2, 44, 0, 6.2832); ctx.stroke();
      }
      ctx.restore();
      ctx.strokeStyle = KC.line; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.roundRect(ox, oy, ow, oh, 12); ctx.stroke();
      if (field) {
        K.pill(ctx, "관입한 암체", ox + ow / 2 + pw / 2 + 30, oy + 26, { s: 11.5, c: KC.yellow, box: [ox, ox + ow] });
        K.pill(ctx, "퇴적층", ox + 12, oy + oh - 12, { s: 11, c: KC.ink });
        K.pill(ctx, "이 암체는 퇴적층을 비스듬히 가로질러 자르고 있습니다 → 관입", ox, oy + oh + 26, { s: 12, c: KC.red });
        K.t(ctx, "층을 자르는 쪽이 나중에 들어온 것입니다(관입의 법칙).", ox + 4, oy + oh + 48, { s: 11, c: KC.mute, w: "600" });
      } else {
        K.pill(ctx, "손에 든 시료만 보이는 상태", ox + ow / 2, oy + oh / 2 + 66, { s: 11, a: "center", c: KC.ink });
        K.pill(ctx, "‘주변 암석과의 관계 보기’를 누르면 노두 전체가 보입니다", ox, oy + oh + 26, { s: 12, c: KC.yellow });
        K.t(ctx, "조직만 보고 판정하면 틀릴 수 있습니다.", ox + 4, oy + oh + 48, { s: 11, c: KC.mute, w: "600" });
      }

      /* 오른쪽 조직 */
      var bx = 466, by = 64, bw = 300, bh = 196;
      ctx.save(); ctx.shadowColor = "rgba(0,0,0,.6)"; ctx.shadowBlur = 16; ctx.fillStyle = "#1a1412";
      ctx.beginPath(); ctx.roundRect(bx - 5, by - 5, bw + 10, bh + 10, 14); ctx.fill(); ctx.restore();
      ctx.save(); ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 10); ctx.clip();
      var bgc = ctx.createLinearGradient(bx, by, bx + bw, by + bh); bgc.addColorStop(0, "#56505a"); bgc.addColorStop(1, "#2c282f");
      ctx.fillStyle = bgc; ctx.fillRect(bx, by, bw, bh);
      var r = clamp(1.0 + D * 2.4, 1.0, 26);
      var n = clamp(Math.round(bw * bh / (r * r * 7)), 16, 800);
      var rg = rnd(Math.round(th + dep * 77));
      for (var k = 0; k < n; k++) {
        ctx.save();
        ctx.translate(bx + rg() * bw, by + rg() * bh);
        ctx.rotate(rg() * Math.PI);
        var c = rg(), col = c < 0.34 ? ["#f3c9b6", "#c88f7a"] : (c < 0.67 ? ["#eceae6", "#aeaaa3"] : ["#2b2a2e", "#0e0d10"]);
        if (r < 3) { ctx.fillStyle = col[0]; ctx.globalAlpha = .8; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill(); }
        else {
          var gg = ctx.createLinearGradient(-r, -r * .6, r, r * .6); gg.addColorStop(0, col[0]); gg.addColorStop(1, col[1]);
          ctx.fillStyle = gg; ctx.globalAlpha = .95; ctx.fillRect(-r * 0.9, -r * 0.55, r * 1.8, r * 1.1);
          ctx.globalAlpha = .3; ctx.fillStyle = "#ffffff"; ctx.fillRect(-r * 0.9, -r * 0.55, r * 1.8, 1.5);
        }
        ctx.restore();
      }
      var sh = ctx.createLinearGradient(bx, by, bx + bw * .6, by + bh * .6); sh.addColorStop(0, "rgba(255,255,255,.16)"); sh.addColorStop(.35, "rgba(255,255,255,0)");
      ctx.fillStyle = sh; ctx.fillRect(bx, by, bw, bh);
      ctx.restore();
      K.pill(ctx, "🔍 시료 단면 확대", bx + 10, by + 24, { s: 11, c: KC.ink });
      K.pill(ctx, coarse ? "조립질 — 알갱이가 보입니다" : "세립질 — 알갱이가 보이지 않습니다",
        bx, by + bh + 28, { s: 12.5, c: coarse ? KC.green : KC.orange });

      /* 수치 */
      glass(ctx, bx - 6, 312, W - bx - 8, 64, 10);
      K.t(ctx, "식는 데 걸린 시간", bx + 10, 334, { s: 11.5, w: "800", c: KC.mute });
      K.t(ctx, fmtYears(t), bx + 10, 362, { s: 19, w: "900", c: KC.ink });
      K.t(ctx, "자란 결정의 크기", bx + 230, 334, { s: 11.5, w: "800", c: KC.mute });
      K.t(ctx, fmtMm(D), bx + 230, 362, { s: 19, w: "900", c: coarse ? KC.green : KC.orange });

      K.t(ctx, "냉각 시간 ≈ (두께 ÷ 2)² ÷ 열확산 계수 × (깊을수록 느려지는 보정)", 28, 398, { s: 11.5, c: KC.mute, w: "600" });
      K.pill(ctx, "두께 " + th + " m", 28, 424, { s: 12.5, c: KC.yellow });
      K.pill(ctx, "깊이 " + dep.toFixed(1) + " km", 140, 424, { s: 12.5, c: KC.blue });
      K.t(ctx, th <= 100 ? "얇은 판 모양이라 둘레의 차가운 암석에 열을 금방 빼앗깁니다 — 암맥·암상의 조건입니다"
                          : (th >= 2000 ? "거대한 암체는 열이 빠져나가는 데 수십만 년이 걸립니다 — 심성암체(저반)의 조건입니다"
                                        : "중간 크기의 관입체입니다. 두께를 더 키우거나 줄여 보세요"), 28, 446, { s: 12, c: KC.ink, w: "600" });
      K.t(ctx, coarse ? "이 정도 결정이면 화강암·반려암처럼 알갱이가 또렷이 보입니다."
                       : "이 정도면 현무암·유문암처럼 매끈해 보입니다 — 그렇다고 분출암이라는 뜻은 아닙니다.", 28, 464, { s: 12, c: KC.mute, w: "600" });

      var ch = false;
      if (D <= 0.1 && !got.fine) { got.fine = ch = true; }
      if (D >= 2 && !got.coarse) { got.coarse = ch = true; }
      if (D < 1 && field && !got.trap) { got.trap = ch = true; }
      if (ch) { window.sthState("cGrain", got); mission(); }

      $("c-grain-read").innerHTML = "결정 크기: <b>" + fmtMm(D) + "</b> · " + (coarse ? "조립질" : "세립질");
      $("c-grain-info").innerHTML = "두께 <b>" + th + " m</b> 인 마그마가 깊이 " + dep.toFixed(1) + " km에서 굳으면 <b>" + fmtYears(t) +
        "</b> 만에 다 식고, 결정은 <b>" + fmtMm(D) + "</b>까지 자랍니다. " +
        (D < 1 && field ? "<b>결정이 보이지 않는데도 이 암체는 관입암입니다.</b> 주변 퇴적층을 가로질러 자르고 있기 때문입니다. 얇은 암맥·암상은 지하에 있어도 빨리 식어 세립질이 됩니다 — 조직만으로 분출암이라 단정하면 안 되는 까닭입니다."
          : (D < 1 ? "눈으로는 알갱이가 보이지 않습니다. 이럴 때 <b>주변 암석과의 관계</b>를 보지 않으면 분출한 용암인지 관입한 암맥인지 가릴 수 없습니다."
            : "알갱이가 또렷하게 보일 만큼 천천히 식었습니다. 이렇게 큰 결정은 지표로 흘러나온 용암에서는 만들어질 수 없습니다."));
    }
    function mission() {
      if (got.fine) done("m3-2a"); if (got.coarse) done("m3-2b"); if (got.trap) done("m3-2c");
      if (got.fine && got.coarse && got.trap) {
        window.sthMission("m3-2", true, "<span class='m-tag'>미션 완료</span>결정 크기는 <b>식는 속도</b>가 정하고, 식는 속도는 <b>마그마 덩어리의 두께</b>가 정합니다. 그래서 지하에 있더라도 얇은 <b>암맥·암상</b>은 세립질입니다. 조직만 보지 말고 <b>주변 암석과의 관계(자르는가, 덮는가)</b>를 함께 보아야 합니다.");
        ep.clear(1);
      }
    }
    canvas._redraw = draw;
    $("c-thick").addEventListener("input", function (e) { th = +e.target.value; $("c-thick-val").textContent = th + " m"; draw(); });
    $("c-depth").addEventListener("input", function (e) { dep = +e.target.value; $("c-depth-val").textContent = dep.toFixed(1) + " km"; draw(); });
    $("c-field").addEventListener("click", function () { field = !field; this.classList.toggle("on", field); draw(); });
    draw(); mission();
  })();

  /* ---- 장면3 : 주상절리 ---- */
  (function () {
    var canvas = $("c-c-col"), ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var flow = 20, place = 0;
    var got = window.sthState("cCol") || { thick: false, thin: false, seen: [true, false, false] };
    if (!got.seen) got.seen = [true, false, false];
    var PLACE = [
      { n: "제주 중문 · 대포 해안",
        d: "신생대의 화산 활동으로 만들어진 제주도 남쪽 해안입니다. 흘러내린 <b>현무암질 용암</b>이 식으면서 갈라져, 검은 육각 기둥이 해안 절벽을 이룹니다. 제주도는 2010년에 유네스코 세계지질공원으로 인증되었습니다." },
      { n: "한탄강 (연천 · 포천 · 철원)",
        d: "신생대 제4기에 분출한 <b>현무암질 용암</b>이 옛 강줄기를 따라 멀리까지 흘러 들어가 넓은 <b>용암대지</b>를 이루었습니다. 그 뒤 한탄강이 이 용암대지를 다시 깎아 내려, 강가 절벽에 주상절리가 드러났습니다. 2020년에 유네스코 세계지질공원으로 인증되었습니다." },
      { n: "무등산 (서석대 · 입석대)",
        d: "<b>중생대 백악기</b>의 화산 폭발로 뜨거운 화산재가 두껍게 쌓여 굳은 <b>응회암</b>(화산암의 한 종류)이 식으며 갈라져 만들어진 기둥들이, 오랜 침식 끝에 산꼭대기에 병풍처럼 남은 것입니다. 무등산권은 2018년에 유네스코 세계지질공원으로 인증되었습니다." }
    ];
    function years() { return (flow / 2) * (flow / 2) / 31.5; }
    function colW() { return 0.6 * Math.pow(years(), 0.25); }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      var t = years(), D = colW();
      var LW = 534;
      K.stage(ctx, 0, 0, LW, 360, "night", { seed: 91, title: "주상절리 — 식으면서 오그라들어 갈라진다", titleColor: KC.orange });
      ctx.save(); ctx.beginPath(); ctx.roundRect(0, 0, LW, 360, 14); ctx.clip();
      /* 곳마다 다른 배경: 바다 · 강 · 산꼭대기 */
      if (place === 2) {
        var mg = ctx.createLinearGradient(0, 200, 0, 360); mg.addColorStop(0, "#1f3a2a"); mg.addColorStop(1, "#0d1a12");
        ctx.fillStyle = mg; ctx.beginPath(); ctx.moveTo(0, 360); ctx.lineTo(0, 250); ctx.quadraticCurveTo(140, 300, 260, 330); ctx.quadraticCurveTo(400, 300, LW, 240); ctx.lineTo(LW, 360); ctx.closePath(); ctx.fill();
      } else {
        var sea = ctx.createLinearGradient(0, 300, 0, 360); sea.addColorStop(0, place === 0 ? "#1d5a8a" : "#2a6a6a"); sea.addColorStop(1, "#06243a");
        ctx.fillStyle = sea; ctx.fillRect(0, 300, LW, 60);
        ctx.strokeStyle = "rgba(200,235,255,.35)"; ctx.lineWidth = 1.2;
        for (var wv = 0; wv < 4; wv++) { ctx.beginPath(); for (var wx = 0; wx <= LW; wx += 12) ctx.lineTo(wx, 310 + wv * 12 + Math.sin(wx / 30 + wv) * 2); ctx.stroke(); }
      }
      var X0 = 46, X1 = 500, TOP = 92, BOT = 300;
      var pw = clamp(D * 62, 16, 150);
      var n = Math.max(3, Math.floor((X1 - X0) / pw));
      var w = (X1 - X0) / n;
      for (var i = 0; i < n; i++) {
        var x = X0 + i * w, R = rnd(i * 31 + 7), dy = (R() - .5) * 10, bot = BOT + (R() - .5) * 14;
        /* 기둥 앞면: 현무암 질감, 가운데가 밝고 가장자리가 어두운 원기둥 그늘 */
        var cg = ctx.createLinearGradient(x, 0, x + w, 0);
        cg.addColorStop(0, "#1e2228"); cg.addColorStop(.35, "#4f5662"); cg.addColorStop(.6, "#3d434d"); cg.addColorStop(1, "#16191e");
        ctx.fillStyle = cg; ctx.fillRect(x + 1, TOP + dy + 8, w - 2, bot - TOP - dy - 8);
        ctx.strokeStyle = "rgba(0,0,0,.6)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, TOP + dy + 8); ctx.lineTo(x, bot); ctx.stroke();
        /* 가로로 갈라진 금 */
        ctx.strokeStyle = "rgba(0,0,0,.35)"; ctx.lineWidth = 1;
        for (var cr = 0; cr < 3; cr++) { var cy2 = TOP + 50 + R() * (bot - TOP - 70); ctx.beginPath(); ctx.moveTo(x + 2, cy2); ctx.lineTo(x + w - 2, cy2 + (R() - .5) * 4); ctx.stroke(); }
        /* 육각 기둥의 윗면 */
        var cx = x + w / 2, cy = TOP + dy + 8, rr = w * 0.5;
        var tg = ctx.createLinearGradient(cx - rr, cy - rr * .4, cx + rr, cy + rr * .4); tg.addColorStop(0, "#8d96a6"); tg.addColorStop(1, "#4a5160");
        ctx.fillStyle = tg; ctx.strokeStyle = "rgba(220,230,255,.55)"; ctx.lineWidth = 1.2;
        ctx.beginPath();
        for (var a = 0; a < 6; a++) {
          var ang = a * Math.PI / 3;
          var px2 = cx + Math.cos(ang) * rr, py2 = cy + Math.sin(ang) * rr * 0.36;
          if (a === 0) ctx.moveTo(px2, py2); else ctx.lineTo(px2, py2);
        }
        ctx.closePath(); ctx.fill(); ctx.stroke();
      }
      ctx.restore();
      /* 냉각면과 열이 빠지는 방향 */
      ctx.save(); ctx.strokeStyle = "rgba(255,179,92,.6)"; ctx.setLineDash([6, 5]); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(X0 - 10, TOP - 4); ctx.lineTo(X1 + 10, TOP - 4); ctx.stroke(); ctx.restore();
      [X0 + 18, X0 + 300, X0 + 420].forEach(function (ax) { K.arrow(ctx, { x: ax, y: TOP - 4 }, { x: ax, y: TOP - 36 }, KC.orange, 3, 10); });
      K.pill(ctx, "열이 빠져나가는 방향(냉각면)", X0 + 44, TOP - 20, { s: 11.5, c: KC.orange });
      K.pill(ctx, "기둥은 냉각면에 수직으로 자랍니다", 14, 348, { s: 11.5, c: KC.ink });
      K.bracket(ctx, X0 + w, X0 + 2 * w, BOT + 10 > 330 ? 330 : BOT + 10, KC.yellow, "", false);
      K.pill(ctx, "지름 약 " + D.toFixed(2) + " m · 기둥 " + n + " 개", LW - 12, 348, { s: 12, a: "right", c: KC.yellow, box: [0, LW] });

      /* 오른쪽 읽음판 */
      var RX = LW + 8, RW = W - RX, px = RX + 20;
      K.stage(ctx, RX, 0, RW, 360, "night", { seed: 5 });
      K.pill(ctx, PLACE[place].n, px - 6, 36, { s: 14, c: KC.blue, box: [RX, W] });
      K.t(ctx, "용암(화산암)층 두께", px, 80, { s: 11.5, w: "800", c: KC.mute });
      K.t(ctx, flow + " m", px, 106, { s: 20, w: "900", c: KC.ink });
      K.t(ctx, "다 식는 데 걸린 시간", px, 144, { s: 11.5, w: "800", c: KC.mute });
      K.t(ctx, fmtYears(t), px, 170, { s: 18, w: "900", c: KC.ink });
      K.t(ctx, "기둥의 지름", px, 208, { s: 11.5, w: "800", c: KC.mute });
      ctx.save(); ctx.shadowColor = D >= 1 ? KC.green : KC.yellow; ctx.shadowBlur = 12;
      K.t(ctx, D.toFixed(2) + " m", px, 240, { s: 26, w: "900", c: D >= 1 ? KC.green : KC.yellow }); ctx.restore();
      gauge(ctx, px, 254, RW - 40, 10, D / 2, D >= 1 ? KC.green : KC.yellow);
      var seenN = got.seen.filter(function (x) { return x; }).length;
      K.t(ctx, "읽어 본 곳", px, 300, { s: 11.5, w: "800", c: KC.mute });
      for (var s = 0; s < 3; s++) { if (got.seen[s]) K.glow(ctx, px + 90 + s * 22, 296, 4, "rgba(63,211,163,.95)", 3); else { ctx.strokeStyle = KC.dim; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(px + 90 + s * 22, 296, 5, 0, 6.2832); ctx.stroke(); } }
      K.t(ctx, seenN + " / 3", px + 162, 300, { s: 12.5, w: "900", c: seenN >= 3 ? KC.green : KC.mute });

      /* 아래 설명 */
      K.stage(ctx, 0, 368, W, H - 368, "night", { seed: 8 });
      K.t(ctx, "용암은 식으면서 부피가 줄어듭니다. 줄어든 만큼 사방으로 잡아당겨지다가 견디지 못하고 갈라지는데,", 18, 394, { s: 12, c: KC.ink, w: "600" });
      K.t(ctx, "가장 적은 힘으로 면을 나누는 모양이 육각형이라 기둥의 단면이 육각형에 가까워집니다.", 18, 416, { s: 12, c: KC.mute, w: "600" });
      K.t(ctx, "천천히 식을수록 갈라진 틈의 간격이 넓어져 기둥이 굵어집니다.", 18, 438, { s: 12, c: KC.mute, w: "600" });

      var ch = false;
      if (D >= 1 && !got.thick) { got.thick = ch = true; }
      if (D <= 0.6 && !got.thin) { got.thin = ch = true; }
      if (!got.seen[place]) { got.seen[place] = true; ch = true; }
      if (ch) { window.sthState("cCol", got); mission(); }

      $("c-col-read").innerHTML = "기둥의 굵기: <b>" + D.toFixed(2) + " m</b>";
      $("c-col-info").innerHTML = "<b>" + PLACE[place].n + "</b> — " + PLACE[place].d +
        "<br><br>두께 <b>" + flow + " m</b> 인 용암층은 다 식는 데 <b>" + fmtYears(t) + "</b>이 걸리고, 이때 생기는 기둥의 지름은 약 <b>" + D.toFixed(2) + " m</b>입니다. " +
        (D >= 1 ? "두껍게 쌓인 용암은 천천히 식어 <b>굵은 기둥</b>을 만듭니다." : "얇게 흐른 용암은 빨리 식어 <b>가는 기둥</b>이 촘촘히 생깁니다.");
    }
    function mission() {
      if (got.thick) done("m3-3a"); if (got.thin) done("m3-3b");
      if (got.seen[0] && got.seen[1] && got.seen[2]) done("m3-3c");
      if (got.thick && got.thin && got.seen[0] && got.seen[1] && got.seen[2]) {
        window.sthMission("m3-3", true, "<span class='m-tag'>미션 완료</span>주상절리는 용암이 <b>식으면서 수축해 갈라진</b> 틈입니다. 기둥은 열이 빠져나가는 면(냉각면)에 <b>수직</b>으로 자라고, 천천히 식을수록 굵어집니다. 제주·한탄강·무등산의 기둥은 모두 같은 원리로 만들어졌습니다.");
        ep.clear(2);
      }
    }
    canvas._redraw = draw;
    segWire("c-place", function (b) { place = +b.getAttribute("data-k"); draw(); });
    $("c-flow").addEventListener("input", function (e) { flow = +e.target.value; $("c-flow-val").textContent = flow + " m"; draw(); });
    draw(); mission();
  })();

  /* ---- 장면4 : 지질공원 지도 ---- */
  var G4 = window.sthState("cMap") || { seen: [], sort: false, q: false };
  if (!G4.seen) G4.seen = [];
  function mission4() {
    if (G4.seen.length >= 6) done("m3-4a");
    if (G4.sort) done("m3-4b");
    if (G4.q) done("m3-4c");
    if (G4.seen.length >= 6 && G4.sort && G4.q) {
      window.sthMission("m3-4", true, "<span class='m-tag'>미션 완료</span>한반도의 돌은 크게 세 겹으로 읽힙니다 — 선캄브리아 시대의 <b>변성암</b>(경기·영남 일대), 고생대의 <b>퇴적암</b>(강원 석회암), 중생대의 <b>화강암과 화산암</b>, 그리고 신생대의 <b>화산암</b>(제주·한탄강·울릉도). 지질공원은 이 기록을 보전하면서 지역과 함께 쓰는 제도입니다.");
      ep.clear(3); ep.clear(4);
    }
  }
  (function () {
    var canvas = $("c-c-map"), ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var sel = -1, pt = 0;
    var LAND = [[430, 70], [470, 90], [455, 160], [500, 230], [470, 300], [510, 360], [470, 420],
                [430, 470], [390, 500], [370, 460], [400, 400], [360, 340], [390, 270], [350, 210], [380, 140], [400, 90]];
    var SPOT = [
      { n: "한탄강 세계지질공원", x: 430, y: 140, side: 1,
        d: "<b>신생대 제4기</b> · 현무암. 화산에서 흘러나온 묽은 현무암질 용암이 옛 강줄기를 따라 수십 km를 흘러 들어가 <b>용암대지</b>를 만들었고, 그 뒤 한탄강이 이 대지를 다시 깎아 내려 <b>주상절리 절벽</b>이 드러났습니다. ‘용암이 강을 메우고, 강이 다시 용암을 깎았다’는 순서를 읽을 수 있는 곳입니다." },
      { n: "강원고생대 국가지질공원", x: 470, y: 240, side: 0,
        d: "<b>고생대</b> · 석회암. 태백·영월·정선·평창 일대에는 고생대에 <b>따뜻하고 얕은 바다</b>에서 쌓인 두꺼운 석회암층이 있습니다. 빗물에 녹아 만들어진 동굴과 카르스트 지형, 그리고 삼엽충 같은 화석이 나옵니다. 이 석회암이 마그마의 열을 받으면 <b>대리암</b>이 됩니다." },
      { n: "청송 세계지질공원", x: 490, y: 320, side: 1,
        d: "<b>중생대 백악기</b> · 퇴적암과 화산암. 공룡이 살던 시기에 한반도 남동부에는 커다란 호수가 있었고, 그 둘레에서 화산이 터졌습니다. 호수에 쌓인 퇴적암과 그 위를 덮은 화산암이 함께 드러나 있으며, 유문암 속에서 꽃 모양 무늬가 자란 ‘꽃돌’ 로도 알려져 있습니다." },
      { n: "무등산권 세계지질공원", x: 408, y: 440, side: 0,
        d: "<b>중생대 백악기</b> · 화산암. 화산 활동으로 쌓인 두꺼운 화산암이 식으며 수축해 갈라졌고, 오랜 침식 끝에 단단한 기둥만 산꼭대기에 남은 것이 <b>서석대와 입석대</b>입니다. 주상절리가 산 정상부에 병풍처럼 서 있는 드문 곳입니다." },
      { n: "제주도 세계지질공원", x: 370, y: 540, side: 0,
        d: "<b>신생대</b> · 현무암. 바다 밑 화산 활동으로 솟아오른 화산섬입니다. 묽은 현무암질 용암이 조용히 흘러 완만한 방패 모양의 섬을 만들었고, 용암이 흐른 자리에 <b>용암동굴</b>(<span data-place=33.5283,126.7701,14,s>만장굴</span> 등)이, 바다와 만난 자리에 <b>주상절리</b>가 남았습니다. 물과 마그마가 만나 폭발한 자리에는 <span data-place=33.4589,126.9408,15,s>성산일출봉</span> 같은 <b>수성 화산체</b>가 생겼습니다." },
      { n: "울릉도 · 독도 국가지질공원", x: 610, y: 250, side: 1,
        d: "<b>신생대</b> · 화산암. 동해 한가운데 바다 밑에서 솟아오른 화산섬입니다. 제주도보다 SiO₂가 많은 마그마가 섞여 있어 <b>조면암</b> 같은 암석이 나타나고, 그만큼 폭발적인 분출의 흔적도 남아 있습니다. 독도는 울릉도보다 먼저 만들어진 화산섬입니다." }
    ];

    function landPath() { ctx.beginPath(); LAND.forEach(function (p, i) { if (i === 0) ctx.moveTo(p[0], p[1]); else ctx.lineTo(p[0], p[1]); }); ctx.closePath(); }
    function isle(x, y, rx, ry) {
      ctx.save(); ctx.shadowColor = "rgba(120,220,255,.5)"; ctx.shadowBlur = 10;
      var g = ctx.createRadialGradient(x - rx * .3, y - ry * .3, 1, x, y, Math.max(rx, ry)); g.addColorStop(0, "#7fa86a"); g.addColorStop(1, "#3d5a34");
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, 6.2832); ctx.fill(); ctx.restore();
      ctx.strokeStyle = "rgba(220,240,255,.55)"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, 6.2832); ctx.stroke();
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      K.stage(ctx, 0, 0, W, H, "ocean", { seed: 101, title: "우리나라의 지질공원 — 표식을 눌러 형성 과정을 확인하세요" });
      /* 땅: 산지는 진하고 해안은 옅은 초록 */
      ctx.save(); ctx.shadowColor = "rgba(120,220,255,.45)"; ctx.shadowBlur = 16;
      var lg = ctx.createLinearGradient(380, 0, 520, 0); lg.addColorStop(0, "#6f9a5e"); lg.addColorStop(.6, "#4f7a46"); lg.addColorStop(1, "#38592f");
      landPath(); ctx.fillStyle = lg; ctx.fill(); ctx.restore();
      ctx.save(); landPath(); ctx.clip();
      /* 백두대간 쪽 산줄기 음영 */
      ctx.strokeStyle = "rgba(40,30,20,.35)"; ctx.lineWidth = 10; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(455, 100); ctx.quadraticCurveTo(480, 220, 470, 300); ctx.quadraticCurveTo(440, 380, 410, 440); ctx.stroke();
      var R = rnd(12);
      for (var i = 0; i < 160; i++) { ctx.fillStyle = R() > .5 ? "rgba(255,255,255,.08)" : "rgba(0,0,0,.12)"; ctx.fillRect(340 + R() * 190, 60 + R() * 450, 2, 2); }
      ctx.restore();
      landPath(); ctx.strokeStyle = "rgba(220,240,255,.6)"; ctx.lineWidth = 1.5; ctx.stroke();
      /* 제주도 · 울릉도 · 독도 */
      isle(370, 540, 46, 24); isle(610, 250, 16, 16); isle(655, 268, 7, 7);
      K.t(ctx, "동해", 690, 160, { s: 13, c: "rgba(200,230,255,.45)", w: "800" });
      K.t(ctx, "서해", 250, 300, { s: 13, c: "rgba(200,230,255,.45)", w: "800" });

      SPOT.forEach(function (s, i) {
        var on = sel === i, seen = G4.seen.indexOf(i) >= 0;
        var col = on ? "rgba(127,211,255,.95)" : (seen ? "rgba(63,211,163,.95)" : "rgba(255,179,92,.95)");
        if (!seen && !on) { ctx.strokeStyle = "rgba(255,179,92," + (.35 + .35 * Math.sin(pt / 8 + i)) + ")"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(s.x, s.y, 14 + 3 * Math.sin(pt / 8 + i), 0, 6.2832); ctx.stroke(); }
        K.glow(ctx, s.x, s.y, on ? 8 : 6, col, 2.6);
        ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(s.x, s.y, on ? 9 : 7, 0, 6.2832); ctx.stroke();
        var tx = s.side === 1 ? s.x + 18 : s.x - 18;
        K.pill(ctx, (seen ? "✓ " : "") + s.n, tx, s.y + 5, { s: 11.5, a: s.side === 1 ? "left" : "right", c: on ? KC.blue : (seen ? KC.green : KC.ink) });
      });

      glass(ctx, 456, 534, W - 470, 54, 12, .08);
      K.pill(ctx, "확인한 곳 " + G4.seen.length + " / 6", W - 16, 28, { s: 13, a: "right", c: G4.seen.length >= 6 ? KC.green : KC.yellow });
      K.t(ctx, "선캄브리아 변성암 → 고생대 퇴적암 → 중생대 화강암·화산암", 470, 555, { s: 11, c: KC.ink, w: "600" });
      K.t(ctx, "→ 신생대 화산암. 이것이 한반도 지질의 큰 흐름입니다.", 470, 576, { s: 11, c: KC.mute, w: "600" });
      K.warn(ctx, 16, 60, "⚠ 지도 모양은 간략하게 그린 것");
    }
    canvas._redraw = draw;
    canvas.addEventListener("click", function (e) {
      var p = hit(canvas, e), found = -1;
      SPOT.forEach(function (s, i) { if (Math.abs(p.x - s.x) < 22 && Math.abs(p.y - s.y) < 22) found = i; });
      if (found < 0) return;
      sel = found;
      if (G4.seen.indexOf(found) < 0) { G4.seen.push(found); window.sthState("cMap", G4); mission4(); }
      $("c-map-info").innerHTML = "<b>" + SPOT[found].n + "</b> — " + SPOT[found].d;
      draw();
    });
    draw(); mission4();
    /* 아직 안 본 표식이 은은하게 깜박인다 */
    if (!REDUCE) K.animate(canvas, function () { if (G4.seen.length < 6) { pt++; draw(); } });
  })();

  window.sthSort({
    mount: "c-sort",
    buckets: [
      { id: "vol", label: "지표로 흘러나와 굳었다", sub: "화산암" },
      { id: "plu", label: "지하 깊은 곳에서 굳었다", sub: "심성암" },
      { id: "met", label: "열과 압력으로 바뀌었다", sub: "변성암" },
      { id: "sed", label: "쌓여서 굳었다", sub: "퇴적암" }
    ],
    items: [
      { t: "제주 만장굴을 만든 현무암", a: "vol", why: "용암이 흐르면서 겉이 먼저 굳고 속이 빠져나가 동굴이 되었습니다." },
      { t: "한탄강 용암대지를 이룬 현무암", a: "vol", why: "묽은 용암이 멀리까지 흘러 넓은 대지를 만들었습니다." },
      { t: "무등산 서석대의 기둥을 이루는 중생대 화산암", a: "vol", why: "화산 활동으로 쌓인 암석이 식으며 갈라진 것입니다.", hint: "주상절리는 식으면서 갈라진 틈입니다." },
      { t: "북한산을 이루는 중생대 화강암", a: "plu", why: "지하에서 천천히 굳어 알갱이가 또렷한 조립질입니다." },
      { t: "설악산 울산바위를 이루는 화강암", a: "plu", why: "위를 덮고 있던 암석이 깎여 나가면서 지표에 드러난 심성암체입니다." },
      { t: "경기 일대 바탕을 이루는 선캄브리아 시대 편마암", a: "met", why: "깊은 곳에서 열과 압력을 받아 엽리가 생긴 암석입니다." },
      { t: "마그마의 열을 받아 석회암이 바뀐 대리암", a: "met", why: "접촉 변성으로 방해석이 크게 재결정된 암석입니다." },
      { t: "강원 태백 일대의 고생대 석회암", a: "sed", why: "고생대의 따뜻하고 얕은 바다에서 쌓였습니다." },
      { t: "청송 일대 백악기 호수에 쌓인 퇴적암", a: "sed", why: "중생대에 이 일대에 있던 큰 호수의 바닥이었습니다." }
    ],
    onDone: function () { G4.sort = true; window.sthState("cMap", G4); mission4(); }
  });

  window.sthPick({
    mount: "c-q1",
    q: "우리 마을이 <b>지질공원</b>으로 지정되면 무엇이 달라질까요?",
    options: [
      "㉠ 출입이 전면 금지되어 주민도 들어갈 수 없게 된다",
      "㉡ 지질 명소를 보전하면서 교육과 관광에 함께 쓰고, 주민이 해설사·지역 상품·숙박으로 참여해 그 몫이 마을로 돌아간다",
      "㉢ 개발 제한이 모두 풀려 어디든 마음대로 건물을 지을 수 있게 된다"
    ],
    answer: 1,
    why: [
      "울타리를 쳐서 막아 두는 제도가 아닙니다. 지질공원은 <b>보전과 활용을 함께</b> 하는 것이 목적입니다.",
      "그렇습니다. 지질공원은 지질 유산을 보전하면서 <b>교육과 지오투어리즘</b>에 쓰고, 지역 주민이 해설사와 지역 상품으로 참여해 <b>지역 경제에 보탬이 되게</b> 하는 제도입니다. 그래서 일정 기간마다 다시 심사를 받습니다.",
      "반대입니다. 지질 명소가 훼손되면 지질공원 자격을 잃을 수 있으므로 <b>보전이 먼저</b>입니다."
    ],
    onDone: function () { G4.q = true; window.sthState("cMap", G4); mission4(); }
  });

  function finish() { window.sthState("r3", "해결 · 1번은 세립질이지만 암맥이었다, 조직만 보지 말고 주변 암석과의 관계를 보라"); }
  function vsC() {
    var p = window.sthState("c-p") || "";
    var box = $("c-vs");
    if (!box) return;
    box.innerHTML = "<b>나의 첫 판단</b> " + (p || "기록 없음") + "<br>" +
      (p.indexOf("㉡") === 0 ? "정확했습니다. 얇게 관입한 암맥·암상은 빨리 식어 세립질이 됩니다."
        : "㉡ 이 정답이었습니다. 결정 크기를 정하는 것은 <b>식는 속도</b>이고, 얇은 암맥·암상은 지하에 있어도 빠르게 식습니다.");
  }
  vsC();
  ep.onShow(vsC);
  window.sthWork({
    mount: "wkC", unitLabel: "[지구과학 Ⅱ-2] 이야기 ③ 지질공원 해설사",
    items: [
      { id: "c1", label: "1번 시료 판정 보고", hint: "1번 시료가 분출한 용암이 아니라 관입한 암맥이라고 판단한 근거를, 조직과 산출 상태 두 가지로 나누어 쓰세요." },
      { id: "c2", label: "관광객에게 하는 1분 해설", hint: "지질공원 한 곳을 골라, 그곳의 암석이 어떤 과정으로 만들어졌는지와 그곳이 지역에 어떤 값어치가 있는지를 이어서 설명하세요." }
    ]
  });
})();

/* ========================================================================= 04 정리하기 */
window.sthWork({
  mount: "wk", unitLabel: "[지구과학 Ⅱ-2] 한반도의 암석 — 정리",
  recap: [
    { key: "r1", label: "① 같은 마그마, 다른 돌" },
    { key: "r2", label: "② 돌 한 덩이의 일생" },
    { key: "r3", label: "③ 지질공원 해설사" },
    { key: "rQuiz", label: "수준별 문제" },
    { key: "rLab", label: "응용 실험실" },
    { key: "rInq", label: "교과서 실험" },
    { key: "rReal", label: "실제 자료" }
  ],
  items: [
    { id: "all", label: "세 사건을 꿰는 한 문장", hint: "마그마는 어떻게 생기고(①), 그 돌은 어떻게 바뀌어 돌며(②), 그 기록을 우리는 어디서 읽는지(③). 세 이야기에 공통으로 흐르는 것은 ‘얼마나 뜨겁고, 얼마나 눌리고, 얼마나 빨리 식었는가’입니다. 한 문장으로 꿰어 쓰세요." },
    { id: "w4", label: "아직 헷갈리는 것", hint: "다음 시간에 여기서부터 시작합니다." }
  ]
});

/* ========================================================================= 05 우리 반 */
window.sthShare({
  mount: "share", unit: "eshs-2-2", unitLabel: "[지구과학 Ⅱ-2] 한반도의 암석",
  rows: [
    { key: "r1", label: "① 같은 마그마, 다른 돌" },
    { key: "r2", label: "② 돌 한 덩이의 일생" },
    { key: "r3", label: "③ 지질공원 해설사" },
    { key: "rQuiz", label: "수준별 문제" },
    { key: "rLab", label: "응용 실험실" },
    { key: "rInq", label: "교과서 실험" },
    { key: "rReal", label: "실제 자료" }
  ],
  line: { id: "all", label: "세 사건을 꿰는 한 문장" }
});

})();
