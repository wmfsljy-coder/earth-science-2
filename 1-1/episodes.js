/* 지구과학 Ⅰ-1 해수의 순환과 대기의 변화 — 소단원별 이야기 네 편
   ① 바람과 어긋난 부표 ② 1,000년을 도는 물 ③ 일기도 세 장 ④ 매미가 오던 밤
   공용 부품: ../assets/theme.js (sthUnit·sthState·sthGate·sthWork·setupCanvas·cssVar·drawArrow),
             ../assets/story.js (sthStory·sthMission·sthSort·sthOrder·sthPick), ../assets/share.js */
(function () {
"use strict";

window.sthUnit("eshs-1-1");

var FONT = "'Gothic A1','Segoe UI',sans-serif";
function $(id) { return document.getElementById(id); }
function v(name) { return window.cssVar(name); }
function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
function done(id) { var e = $(id); if (e) e.classList.add("done"); }
var K = window.sthKit, KC = K.C, REDUCE = K.REDUCE;
/* 무대 바탕: 종류(space·lab·ocean·sky·earth·night)와 별 배치 씨앗 */
function paper(ctx, W, H, kind, seed) { ctx.clearRect(0, 0, W, H); K.stage(ctx, 0, 0, W, H, kind || "night", { seed: seed || 7 }); }
function pill(ctx, s, x, y, o) { return K.pill(ctx, s, x, y, o); }
function head(ctx, s, c) { K.pill(ctx, s, 16, 28, { s: 13, c: c || KC.blue }); }
/* 물 재질: 위는 밝고 아래로 갈수록 깊은 남색 */
function water(ctx, x, y, w, h, top, bot) {
  var g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, top || "rgba(64,160,230,.55)"); g.addColorStop(1, bot || "rgba(8,30,80,.85)");
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
}
/* 땅 재질 */
function land(ctx, x, y, w, h) {
  var g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, "#6f8a4a"); g.addColorStop(.25, "#5b6b3a"); g.addColorStop(1, "#3a3424");
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
}
/* 멈춤 단추(⏸/▶) — 캔버스 위 controls 에 붙인다 */
function playBtn(id, onToggle) {
  var b = $(id); if (!b) return { on: !REDUCE };
  var st = { on: !REDUCE };
  function paint() { b.textContent = st.on ? "⏸ 움직임 멈추기" : "▶ 움직임 보기"; }
  b.addEventListener("click", function () { st.on = !st.on; paint(); if (onToggle) onToggle(st.on); });
  paint();
  return st;
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
function axes(ctx, x0, y0, x1, y1) {
  ctx.fillStyle = "rgba(255,255,255,.03)"; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  ctx.strokeStyle = KC.line; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0, y1); ctx.lineTo(x1, y1); ctx.stroke();
}
/* setTimeout 애니메이션 (가려진 탭에서는 그리지 않는다) */
function anim(canvas, step) {
  K.animate(canvas, function (dt) { step(dt); });
}
/* ---- 밝은 스튜디오 + 블록 모형 도구 (_tools/STUDIO_GUIDE.md) ---- */
var LT = K.LT;
/* 밝은 바탕 위 글자 */
function lt(ctx, s, x, y, o) { o = o || {}; K.t(ctx, s, x, y, { s: o.s || 12, w: o.w || "700", a: o.a, c: o.c || LT.mute }); }
/* 썸네일처럼 굵은 제목 + 노란 부제 */
function bigHead(ctx, s, sub, col, x, y) {
  x = x == null ? 18 : x; y = y == null ? 46 : y;
  K.bigText(ctx, s, x, y, 28, col || "#ffffff");
  if (sub) K.bigText(ctx, sub, x, y + 28, 16, "#ffd35a");
}
function hx(h) { var n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function mix(a, b, t, f) {
  var p = hx(a), q = hx(b), o = [], i; f = f || 1; t = clamp(t, 0, 1);
  for (i = 0; i < 3; i++) o.push(clamp(Math.round((p[i] + (q[i] - p[i]) * t) * f), 0, 255));
  return "rgb(" + o.join(",") + ")";
}
/* 바닷물 수온 색(℃): 찬물 짙은 파랑 → 따뜻한 물 주황 */
var TCOL = [[-2, "#173a7a"], [3, "#1f52a0"], [8, "#2a7cc0"], [13, "#3fa7c9"], [18, "#8fd0a8"], [22, "#e9d36e"], [26, "#f59a45"], [30, "#e2442f"]];
function tCol(t, f) {
  t = clamp(t, -2, 30);
  for (var i = 1; i < TCOL.length; i++) if (t <= TCOL[i][0]) break;
  i = Math.min(i, TCOL.length - 1);
  return mix(TCOL[i - 1][1], TCOL[i][1], (t - TCOL[i - 1][0]) / (TCOL[i][0] - TCOL[i - 1][0]), f);
}
/* 화면 두 점 사이 화살표(밝은 바탕용 굵은 화살표) */
function arr(ctx, a, b, col, w, head) { K.arrow(ctx, a, b, col, w || 3, head || 11); }
/* 블록 위 작은 배 */
function boat(ctx, I, x, y, z, sc, hull) {
  sc = sc || 1;
  I.box(ctx, x - 12 * sc, y - 4 * sc, z, x + 12 * sc, y + 4 * sc, z + 5 * sc, "#f3efe6", hull || "#d9493a", "#a8352b");
  I.box(ctx, x - 2 * sc, y - 2.5 * sc, z + 5 * sc, x + 6 * sc, y + 2.5 * sc, z + 11 * sc, "#ffffff", "#e6e9ee", "#b9c0cc");
}
/* 숨은 캔버스: 조작할 때만 바뀌는 무거운 바탕을 한 번 그려 두고 쓴다 */
function cache(canvas, W, H) {
  var off = null, key = null;
  return function (ctx, k, paint) {
    if (!off || key !== k || off.width !== canvas.width) {
      if (!off) { off = document.createElement("canvas"); off.id = (canvas.id || "c") + "-off"; }
      off.width = canvas.width; off.height = canvas.height;
      var c2 = off.getContext("2d"), dpr = canvas.width / W;
      c2.setTransform(1, 0, 0, 1, 0, 0); c2.clearRect(0, 0, off.width, off.height);
      c2.setTransform(dpr, 0, 0, dpr, 0, 0); c2.clearRect(0, 0, W, H);
      paint(c2); key = k;
    }
    ctx.clearRect(0, 0, W, H); ctx.drawImage(off, 0, 0, W, H);
  };
}
/* 입체 구름 한 덩이(왼쪽 위에서 빛을 받는 공) */
function puff3(ctx, I, x, y, z, r, dark, a) {
  var p = I.P(x, y, z), rr = r * I.s * 1.3;
  var g = ctx.createRadialGradient(p.x - rr * .35, p.y - rr * .5, rr * .1, p.x, p.y, rr * 1.05);
  g.addColorStop(0, "#ffffff"); g.addColorStop(.6, dark ? "#b9c1cf" : "#e3e8f0"); g.addColorStop(1, dark ? "#5f6a80" : "#a3afc2");
  if (a != null) ctx.globalAlpha = a;
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, rr, 0, 6.2832); ctx.fill();
  ctx.globalAlpha = 1;
}
/* 밝은 나침반(위에서 본 모습) */
function lcompass(ctx, cx, cy, R, busy) {
  var cg = ctx.createRadialGradient(cx - R * .3, cy - R * .3, R * .1, cx, cy, R);
  cg.addColorStop(0, "#ffffff"); cg.addColorStop(1, "#dfe8f3");
  ctx.save(); ctx.shadowColor = "rgba(20,30,60,.2)"; ctx.shadowBlur = 12; ctx.shadowOffsetY = 4;
  ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  ctx.strokeStyle = LT.line; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = "rgba(20,40,90,.22)"; ctx.lineWidth = 1;
  for (var tk = 0; tk < 360; tk += 15) { var tr = tk * Math.PI / 180, r0 = tk % 45 ? R - 5 : R - 10; ctx.beginPath(); ctx.moveTo(cx + Math.sin(tr) * r0, cy - Math.cos(tr) * r0); ctx.lineTo(cx + Math.sin(tr) * R, cy - Math.cos(tr) * R); ctx.stroke(); }
  function free(az) {
    for (var i = 0; busy && i < busy.length; i++) { var d = ((busy[i] - az) % 360 + 360) % 360; if (d > 180) d = 360 - d; if (d < 32) return false; }
    return true;
  }
  var O = { s: 12, a: "center", w: "900", c: LT.ink };
  if (free(0)) K.t(ctx, "북", cx, cy - R - 8, O);
  if (free(180)) K.t(ctx, "남", cx, cy + R + 18, O);
  if (free(90)) K.t(ctx, "동", cx + R + 16, cy + 4, O);
  if (free(270)) K.t(ctx, "서", cx - R - 16, cy + 4, O);
}
/* 간단한 해수 상태 방정식 — 수온·염분으로 구하는 밀도 이상치 σt */
function sigmaT(T, S) {
  return 28.14 - 0.0735 * T - 0.00469 * T * T + (0.802 - 0.002 * T) * (S - 35);
}
/* σt가 주어졌을 때 그 염분에서의 수온 (등밀도선 그리기용) */
function tempForSigma(sig, S) {
  var a = 0.00469, b = 0.0735 + 0.002 * (S - 35), c = -(28.14 + 0.802 * (S - 35) - sig);
  var d = b * b - 4 * a * c;
  if (d < 0) return null;
  return (-b + Math.sqrt(d)) / (2 * a);
}
/* 방위각(북=0, 시계 방향) → 화면 단위 벡터 */
function azVec(az) { var r = az * Math.PI / 180; return { x: Math.sin(r), y: -Math.cos(r) }; }
function azName(az) {
  var n = ((az % 360) + 360) % 360;
  var names = ["북", "북동", "동", "남동", "남", "남서", "서", "북서"];
  return names[Math.round(n / 45) % 8];
}
/* busy : 화살표 이름표가 놓일 방위각들. 그쪽 방위 글자는 지워 글자끼리 겹치지 않게 한다 */
function compass(ctx, cx, cy, R, busy) {
  var cg = ctx.createRadialGradient(cx, cy, R * .1, cx, cy, R);
  cg.addColorStop(0, "rgba(120,190,255,.10)"); cg.addColorStop(1, "rgba(120,190,255,.02)");
  ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = KC.line; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = "rgba(200,210,255,.18)"; ctx.lineWidth = 1;
  for (var tk = 0; tk < 360; tk += 15) { var tr = tk * Math.PI / 180, r0 = tk % 45 ? R - 5 : R - 10; ctx.beginPath(); ctx.moveTo(cx + Math.sin(tr) * r0, cy - Math.cos(tr) * r0); ctx.lineTo(cx + Math.sin(tr) * R, cy - Math.cos(tr) * R); ctx.stroke(); }
  function free(az) {
    for (var i = 0; busy && i < busy.length; i++) {
      var d = ((busy[i] - az) % 360 + 360) % 360;
      if (d > 180) d = 360 - d;
      if (d < 32) return false;
    }
    return true;
  }
  var O = { s: 11.5, a: "center", w: "800", c: v("--mist") };
  if (free(0)) text(ctx, "북", cx, cy - R - 8, O);
  if (free(180)) text(ctx, "남", cx, cy + R + 18, O);
  if (free(90)) text(ctx, "동", cx + R + 16, cy + 4, O);
  if (free(270)) text(ctx, "서", cx - R - 16, cy + 4, O);
}

/* =========================================================================
   이야기 ① 바람과 어긋난 부표
   ========================================================================= */
(function () {
  var ep = window.sthStory({ root: "epA", key: "epA", name: "사건 파일 ①", onDone: finish });

  window.sthGate({
    gate: "a-gate", key: "current", title: "관측사의 첫 추리",
    question: "대기 대순환의 방향과 표층 해류의 방향은 <b>같을까요?</b>",
    options: ["㉠ 정확히 같다", "㉡ 대체로 비슷하지만 정확히 일치하지는 않는다", "㉢ 서로 반대다", "㉣ 아무 관계가 없다"],
    onPick: function (i) {
      window.sthState("currentOK", i === 1 ? "맞음" : "어긋남");
      ep.clear(0);
    }
  });

  /* ---- 장면2 연직 분포 ---- */
  var PROF = {
    low:  { surfT: 28, deepT: 2, top: 100, bot: 600, surfS: 36.5, deepS: 34.6, label: "저위도(열대)" },
    mid:  { surfT: 18, deepT: 2, top: 80,  bot: 500, surfS: 35.0, deepS: 34.6, label: "중위도" },
    high: { surfT: 2,  deepT: 0.5, top: 0, bot: 1000, surfS: 33.0, deepS: 34.6, label: "고위도(극)" }
  };
  function smooth(u) { return u * u * (3 - 2 * u); }
  function profT(d, p) {
    if (d <= p.top) return p.surfT;
    if (d >= p.bot) return p.deepT;
    return p.surfT + (p.deepT - p.surfT) * smooth((d - p.top) / (p.bot - p.top));
  }
  function profS(d, p) {
    if (d <= p.top) return p.surfS;
    if (d >= p.bot) return p.deepS;
    return p.surfS + (p.deepS - p.surfS) * smooth((d - p.top) / (p.bot - p.top));
  }
  function gradT(d, p) {                       /* |dT/dz| (℃/m) */
    if (d <= p.top || d >= p.bot) return 0;
    var u = (d - p.top) / (p.bot - p.top);
    return Math.abs((p.deepT - p.surfT) / (p.bot - p.top) * 6 * u * (1 - u));
  }

  (function () {
    var canvas = $("a-c-prof"), ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var lat = "low", depth = 0;
    var got = window.sthState("aProf") || { a: false, b: false, c: false };

    var TX0 = 95, TX1 = 430, SX0 = 560, SX1 = 860, PY0 = 62, PY1 = 330;
    function XT(t) { return TX0 + (t / 30) * (TX1 - TX0); }
    function XS(s) { return SX0 + ((s - 32) / 5) * (SX1 - SX0); }
    function YD(d) { return PY0 + (d / 1000) * (PY1 - PY0); }

    /* 블록 모형: 바다 한 기둥(깊이 1000 m)을 잘라 낸 모형 — 앞면·오른쪽 면 색 = 그 깊이의 수온. 위에는 관측선, 줄 끝에 CTD 측정기 */
    var I = K.iso({ ox: 160, oy: 316, s: 0.84, L: 112, D: 112 }), ZT = 280;
    function ZD(d) { return ZT * (1 - d / 1000); }
    var paintBlock = cache(canvas, W, H);
    function draw() {
      var p = PROF[lat];
      /* 수온약층 띠 (수온 변화율이 큰 구간) */
      var lo = null, hi = null;
      for (var d0 = 0; d0 <= 1000; d0 += 10) {
        if (gradT(d0, p) >= 0.02) { if (lo === null) lo = d0; hi = d0; }
      }
      paintBlock(ctx, lat, function (c) {
        var fc = I.P(I.L / 2, I.D / 2, 0);
        K.studio(c, 0, 0, W, H, { x: fc.x, y: fc.y + 12, rx: 130, ry: 34 });
        ["front", "right"].forEach(function (side) {
          I.face(c, side, function (Lw) {
            var g = c.createLinearGradient(0, 0, 0, ZT);
            for (var k = 0; k <= 20; k++) { var d = 1000 * (1 - k / 20); g.addColorStop(k / 20, tCol(profT(d, p), side === "right" ? 0.86 : 1)); }
            c.fillStyle = g; c.fillRect(0, 0, Lw, ZT);
            /* 층 경계(점선) */
            if (lo !== null) {
              c.strokeStyle = "rgba(255,255,255,.8)"; c.lineWidth = 1.4; c.setLineDash([6, 4]);
              [lo, hi].forEach(function (d) { c.beginPath(); c.moveTo(0, ZD(d)); c.lineTo(Lw, ZD(d)); c.stroke(); });
              c.setLineDash([]);
            }
            /* 물 알갱이 무늬 */
            var R = K.rng(side === "front" ? 5 : 9); c.fillStyle = "rgba(255,255,255,.16)";
            for (var i = 0; i < 70; i++) c.fillRect(R() * Lw, R() * ZT, 1.3, 1.3);
          });
        });
        I.shade(c, "front", function () { return ZT; }); I.shade(c, "right", function () { return ZT; });
        /* 윗면 = 해수면 */
        var sc = tCol(p.surfT, 1.05);
        I.plane(c, ZT, sc, "rgba(255,255,255,.8)");
        c.strokeStyle = "rgba(255,255,255,.55)"; c.lineWidth = 1;
        for (var w = 0; w < 7; w++) { var gx = 12 + (w * 37) % 90, gy = 10 + (w * 53) % 92, s1 = I.P(gx, gy, ZT), s2 = I.P(gx + 12, gy, ZT); c.beginPath(); c.moveTo(s1.x, s1.y); c.quadraticCurveTo((s1.x + s2.x) / 2, s1.y - 2, s2.x, s2.y); c.stroke(); }
        if (lat === "high") { /* 고위도: 떠다니는 얼음 조각 */
          [[22, 30, 16], [70, 70, 12], [36, 84, 9]].forEach(function (q) { I.box(c, q[0], q[1], ZT, q[0] + q[2], q[1] + q[2] * .7, ZT + 4, "#f4fbff", "#cfe6f5", "#a9c8de"); });
        }
        I.edges(c, ZT, ZT);
        /* 깊이 눈금(앞면 왼쪽 모서리) */
        for (var dd = 0; dd <= 1000; dd += 200) { var q = I.P(I.L, 0, ZD(dd)); c.strokeStyle = LT.line; c.lineWidth = 1; c.beginPath(); c.moveTo(q.x, q.y); c.lineTo(q.x + 6, q.y); c.stroke(); lt(c, dd + " m", q.x + 9, q.y + 4, { s: 10.5 }); }
      });
      /* 관측선과 CTD */
      var cx = I.L * 0.55, sh = I.P(cx, I.D, ZT);
      boat(ctx, I, cx, I.D - 16, ZT, 1.6, "#2b6fd6");
      var pr = I.P(cx, I.D, ZD(depth));
      ctx.strokeStyle = "#1a2236"; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(sh.x, sh.y - 2); ctx.lineTo(pr.x, pr.y - 6); ctx.stroke();
      var cg = ctx.createLinearGradient(pr.x - 6, 0, pr.x + 6, 0); cg.addColorStop(0, "#f2f4f8"); cg.addColorStop(.5, "#b9c2d0"); cg.addColorStop(1, "#6d7686");
      ctx.fillStyle = cg; ctx.beginPath(); ctx.roundRect(pr.x - 6, pr.y - 8, 12, 16, 3); ctx.fill();
      ctx.strokeStyle = "#ffd35a"; ctx.lineWidth = 2; ctx.stroke();
      var BX = [0, 300];
      if (lo !== null) {
        if (lo > 20) I.label(ctx, 0, I.D, ZD(lo / 2), "혼합층", -22, -6, "#ffe1b0", BX);
        I.label(ctx, 0, I.D, ZD((lo + hi) / 2), "수온약층", -22, 0, "#b9f3d9", BX);
        I.label(ctx, 0, I.D, ZD((hi + 1000) / 2), "심해층", -22, 8, "#cfe8ff", BX);
      } else I.label(ctx, 0, I.D, ZD(500), "수온약층 없음", -22, 0, "#cfe8ff", BX);

      /* 오른쪽: 밝은 그래프 둘(깊이 아래로) */
      var cT = profT(depth, p), cS = profS(depth, p), cD = sigmaT(cT, cS), g = gradT(depth, p);
      var layer = (lo !== null && depth >= lo && depth <= hi) ? "수온약층" : (depth <= p.top + 10 ? "혼합층" : (lo === null ? "거의 균질한 층" : (depth < lo ? "혼합층" : "심해층")));
      bigHead(ctx, p.label + " 바다", depth + " m · " + cT.toFixed(1) + " ℃ · " + layer, "#ffffff", 316, 42);
      function chartOf(x, x0, x1, xl, f, col, val, unit) {
        var gg = K.chart(ctx, { light: true, x: x, y: 92, w: 286, h: H - 100, x0: x0, x1: x1, y0: -1000, y1: 0, xt: 5, yt: 5, pl: 54, pb: 38, xl: xl, yf: function (vv) { return Math.round(-vv) + ""; } });
        if (lo !== null) { ctx.fillStyle = "rgba(15,159,118,.14)"; ctx.fillRect(gg.L, gg.Y(-lo), gg.R - gg.L, gg.Y(-hi) - gg.Y(-lo)); }
        var pts = []; for (var k = 0; k <= 200; k++) pts.push([f(k * 5), -k * 5]);
        K.plot(ctx, gg, pts, col, { light: true, w: 3 });
        ctx.strokeStyle = LT.violet; ctx.setLineDash([4, 4]); ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(gg.L, gg.Y(-depth)); ctx.lineTo(gg.R, gg.Y(-depth)); ctx.stroke(); ctx.setLineDash([]);
        var vx = gg.X(val), vy = gg.Y(-depth);
        ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(vx, vy, 6, 0, 6.2832); ctx.fill();
        ctx.strokeStyle = LT.violet; ctx.lineWidth = 3; ctx.stroke();
        var right = vx < gg.R - 80, ty = clamp(vy - 10, gg.T + 40, gg.B - 6);
        K.pill(ctx, unit, right ? vx + 12 : vx - 12, ty, { s: 12, a: right ? "left" : "right", c: col === LT.orange ? "#ffcf9c" : "#a9dcff", box: [gg.L, gg.R] });
        return gg;
      }
      var gT = chartOf(306, 0, 30, "수온(℃) →", function (d) { return profT(d, p); }, LT.orange, cT, cT.toFixed(1) + " ℃");
      chartOf(604, 32, 37, "염분(psu) →", function (d) { return profS(d, p); }, LT.blue, cS, cS.toFixed(2) + " psu");
      lt(ctx, "깊이(m)", gT.L - 48, 98, { s: 11 });
      K.pill(ctx, "수온 곡선", gT.R - 8, gT.T + 20, { a: "right", s: 11.5, c: "#ffcf9c" });
      K.pill(ctx, "염분 곡선", 604 + 286 - 22, gT.T + 20, { a: "right", s: 11.5, c: "#a9dcff" });
      lt(ctx, "σt = 밀도 − 1000 (클수록 무겁다)", W - 16, 90, { s: 10.5, a: "right" });

      var inTh = layer === "수온약층";
      $("a-prof-read").innerHTML =
        "<span class='k'>깊이</span><span class='v b'>" + depth + " m</span>" +
        "<span class='k'>수온 · 염분</span><span class='v y'>" + cT.toFixed(1) + " ℃ · " + cS.toFixed(2) + " psu</span>" +
        "<span class='k'>밀도</span><span class='v g'>σt " + cD.toFixed(2) + "</span>" +
        "<span class='sub'>수온 변화율 " + g.toFixed(3) + " ℃/m</span>" +
        "<span class='ok " + (inTh ? "g" : "") + "'>" + (inTh ? "수온약층 안 · 수온이 급격히 떨어지는 구간" : layer + " · 수온이 거의 일정") + "</span>";

      var ch = false;
      if (lat === "low" && g >= 0.02 && !got.a) { got.a = ch = true; }
      if (lat === "mid" && g >= 0.02 && !got.b) { got.b = ch = true; }
      if (lat === "high" && depth >= 300 && !got.c) { got.c = ch = true; }
      if (ch) { window.sthState("aProf", got); mission(); }

      $("a-prof-info").innerHTML = "지금 관측점은 <b>" + layer + "</b>입니다. " +
        (layer === "혼합층" ? "바람이 위아래를 휘저어 수온이 거의 일정한 층입니다." :
          (layer === "수온약층" ? "깊이가 늘어날수록 수온이 <b>급격히</b> 낮아집니다. 아래쪽 물이 훨씬 무거워 위아래가 잘 섞이지 않는, 일종의 <b>뚜껑</b>입니다." :
            (layer === "심해층" ? "햇빛이 닿지 않아 수온이 낮고 거의 일정합니다." :
              "고위도 바다는 표층부터 차가워서 <b>수온약층이 뚜렷하지 않습니다.</b> 위아래가 잘 섞일 수 있다는 뜻입니다.")));
    }
    function mission() {
      if (got.a) done("m1-2a"); if (got.b) done("m1-2b"); if (got.c) done("m1-2c");
      if (got.a && got.b && got.c) {
        window.sthMission("m1-2", true, "<span class='m-tag'>미션 완료</span>저위도와 중위도에는 뚜렷한 <b>수온약층</b>이 있지만, 고위도에는 없습니다. 표층이 이미 차갑기 때문입니다. 수온약층이 없는 고위도 바다에서는 표층수가 <b>깊은 곳까지 가라앉을 수 있습니다.</b>");
        ep.clear(1);
      }
    }
    canvas._redraw = draw;
    segWire("a-lat", function (b) { lat = b.getAttribute("data-lat"); $("a-lat-val").textContent = PROF[lat].label; draw(); });
    $("a-depth").addEventListener("input", function (e) { depth = +e.target.value; $("a-depth-val").textContent = depth + " m"; draw(); });
    draw(); mission();
  })();

  /* ---- 장면3 수온 염분도 ---- */
  var ST = [
    { n: "정점 ㄱ", T: 16.0, S: 34.5, m: "대마 난류수" },
    { n: "정점 ㄴ", T: 7.0, S: 32.0, m: "황해 저층 냉수" },
    { n: "정점 ㄷ", T: 1.0, S: 34.1, m: "동해 고유수" }
  ];
  (function () {
    var canvas = $("a-c-ts"), ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var s = 0, sig = 22.00;
    var got = window.sthState("aTS") || [false, false, false, false];

    /* 밝은 스튜디오 위 카드 그래프(T-S도) + 오른쪽 흰 판정 카드 + 바닥에 놓인 입체 채수병 세 개 */
    var GX0 = 10, GY0 = 86, GW = 560, GH = 350, gref = null;
    function XS(sal) { return gref.X(sal); }
    function YT(t) { return gref.Y(t); }
    function isoline(target, color, wide) {
      ctx.strokeStyle = color; ctx.lineWidth = wide ? 3.4 : 1.2;
      ctx.beginPath();
      var started = false;
      for (var sal = 31.5; sal <= 35.5001; sal += 0.1) {
        var t = tempForSigma(target, sal);
        if (t === null || t < 0 || t > 25) { started = false; continue; }
        var x = XS(sal), y = YT(t);
        if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    /* 입체 유리 채수병: 원기둥 + 물(색 = 수온) + 바닥 그림자 */
    function bottle(cx, by, r, h, T, label, on, known) {
      var top = by - h, ry = r * 0.32;
      var sh = ctx.createRadialGradient(cx + 6, by + 4, 2, cx + 6, by + 4, r * 1.8);
      sh.addColorStop(0, "rgba(20,30,50,.30)"); sh.addColorStop(1, "rgba(20,30,50,0)");
      ctx.fillStyle = sh; ctx.beginPath(); ctx.ellipse(cx + 6, by + 4, r * 1.8, r * .55, 0, 0, 6.2832); ctx.fill();
      var wl = top + h * 0.22, wc = tCol(T), wd = tCol(T, 0.62);
      var wg = ctx.createLinearGradient(cx - r, 0, cx + r, 0);
      wg.addColorStop(0, wd); wg.addColorStop(0.35, wc); wg.addColorStop(1, wd);
      ctx.fillStyle = wg; ctx.beginPath(); ctx.moveTo(cx - r, wl); ctx.lineTo(cx - r, by); ctx.ellipse(cx, by, r, ry, 0, Math.PI, 0, true); ctx.lineTo(cx + r, wl); ctx.closePath(); ctx.fill();
      ctx.fillStyle = tCol(T, 1.15); ctx.beginPath(); ctx.ellipse(cx, wl, r, ry, 0, 0, 6.2832); ctx.fill();
      var gl = ctx.createLinearGradient(cx - r, 0, cx + r, 0);
      gl.addColorStop(0, "rgba(255,255,255,.35)"); gl.addColorStop(0.2, "rgba(255,255,255,.08)"); gl.addColorStop(0.8, "rgba(255,255,255,.04)"); gl.addColorStop(1, "rgba(255,255,255,.3)");
      ctx.fillStyle = gl; ctx.fillRect(cx - r, top, 2 * r, h);
      ctx.strokeStyle = on ? LT.violet : "rgba(60,80,110,.55)"; ctx.lineWidth = on ? 2.4 : 1.2;
      ctx.beginPath(); ctx.moveTo(cx - r, top); ctx.lineTo(cx - r, by); ctx.ellipse(cx, by, r, ry, 0, Math.PI, 0, true); ctx.lineTo(cx + r, top); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(cx, top, r, ry, 0, 0, 6.2832); ctx.stroke();
      ctx.fillStyle = "#3d4a5e"; ctx.beginPath(); ctx.ellipse(cx, top, r * .55, ry * .55, 0, 0, 6.2832); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.7)"; ctx.fillRect(cx - r * .62, top + 8, 3, h - 18);
      lt(ctx, label, cx, by + 26, { s: 12, a: "center", w: "900", c: on ? LT.violet : LT.ink });
      lt(ctx, known, cx, by + 42, { s: 11, a: "center", w: "800", c: known === "?" ? LT.dim : LT.green });
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      K.studio(ctx, 0, 0, W, H, { x: 735, y: 400, rx: 190, ry: 34 });
      var Q = ST[s], real = sigmaT(Q.T, Q.S), ok = Math.abs(sig - real) <= 0.07;
      bigHead(ctx, "수온 염분도 (T-S도)", "점이 놓인 등밀도선을 찾아라", "#ffffff", 18, 42);
      gref = K.chart(ctx, { light: true, x: GX0, y: GY0, w: GW, h: GH, x0: 31.5, x1: 35.5, y0: 0, y1: 25, xt: 8, yt: 5, pl: 58, pb: 38,
        xf: function (vv) { return vv === Math.round(vv) ? vv.toFixed(0) : ""; }, yf: function (vv) { return vv + "℃"; }, xl: "염분(psu) →" });
      /* 따뜻한 위 · 차가운 아래 바탕 */
      var bg = ctx.createLinearGradient(0, gref.T, 0, gref.B);
      bg.addColorStop(0, "rgba(245,154,69,.12)"); bg.addColorStop(1, "rgba(28,126,214,.12)");
      ctx.fillStyle = bg; ctx.fillRect(gref.L, gref.T, gref.R - gref.L, gref.B - gref.T);
      lt(ctx, "↘ 오른쪽 아래로 갈수록 무겁다 (σt 증가)", gref.L, gref.B + 30, { s: 11.5, c: LT.blue, w: "800" });
      /* 등밀도선 */
      for (var g = 22; g <= 28.5001; g += 0.5) isoline(g, "rgba(28,80,160,.22)", false);
      ctx.save(); ctx.shadowColor = "rgba(245,159,0,.6)"; ctx.shadowBlur = 6; isoline(sig, LT.yellow, true); ctx.restore();
      var lt0 = tempForSigma(sig, 35.3);
      if (lt0 !== null && lt0 >= 1 && lt0 <= 24) K.pill(ctx, "σt " + sig.toFixed(2), clamp(XS(35.3) - 6, gref.L, gref.R - 4), YT(lt0) - 10, { s: 12, a: "right", c: "#ffd35a", box: [gref.L, gref.R] });
      /* 세 정점 */
      ST.forEach(function (q, i) {
        var x = XS(q.S), y = YT(q.T);
        ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(x, y, i === s ? 7.5 : 6, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = i === s ? LT.violet : (got[i] ? LT.green : LT.mute); ctx.lineWidth = i === s ? 3.4 : 2.4; ctx.stroke();
        K.pill(ctx, q.n, clamp(x, gref.L + 34, gref.R - 34), y - 15, { s: 12, a: "center", c: i === s ? "#d6c8ff" : (got[i] ? "#9ff0cf" : "#e8ecff"), box: [gref.L, gref.R] });
      });

      /* 오른쪽 흰 판정 카드: 채수 기록 */
      var px = 588, pw = W - px - 12, py = 12, ph = 262, x0 = px + 18, x1 = px + pw - 18;
      K.card(ctx, px, py, pw, ph, "채수 기록");
      K.t(ctx, Q.n + " · " + Q.m, x0, py + 60, { s: 18, w: "900", c: LT.violet });
      K.row(ctx, "수온", Q.T.toFixed(1) + " ℃", x0, x1, py + 92, LT.orange);
      K.row(ctx, "염분", Q.S.toFixed(1) + " psu", x0, x1, py + 118, LT.blue);
      lt(ctx, "내가 고른 등밀도선", x0, py + 152, { s: 12 });
      K.t(ctx, "σt " + sig.toFixed(2), x0, py + 190, { s: 30, w: "900", c: ok ? LT.green : LT.yellow });
      K.tip(ctx, ok ? "✅ 정점이 이 등밀도선 위에 있습니다" : (sig > real ? "이 점보다 무거운 선입니다 ↓ 값을 줄이세요" : "이 점보다 가벼운 선입니다 ↑ 값을 키우세요"), x0 - 4, py + 212, pw - 28, ok);
      /* 바닥 위 세 채수병 */
      var gap = pw / 3;
      ST.forEach(function (q, i) {
        bottle(px + gap * (i + 0.5), 382, 22, 76, q.T, q.n, i === s, got[i] ? "σt " + sigmaT(q.T, q.S).toFixed(2) : "?");
      });

      if (ok && !got[s]) { got[s] = true; window.sthState("aTS", got); mission(); }
      $("a-ts-info").innerHTML = "수온과 염분이 <b>둘 다</b> 밀도를 정합니다. 그래서 수온이 다른 두 물이 <b>같은 밀도</b>일 수도 있습니다. 수온 염분도에서 같은 자리에 모이는 물 덩어리를 <b>수괴</b>라고 하고, 수괴는 자기가 만들어진 바다의 흔적을 오래 간직합니다." +
        (ok ? " — <b>" + Q.n + " 의 σt는 " + real.toFixed(2) + "</b>입니다." : "");
    }
    function mission() {
      ["m1-3a", "m1-3b", "m1-3c", "m1-3d"].forEach(function (id, k) { if (got[k]) done(id); });
      if (got[0] && got[1] && got[2] && got[3]) {
        window.sthMission("m1-3", true, "<span class='m-tag'>미션 완료</span>정점 ㄱ 25.38 · ㄴ 25.03 · ㄷ 27.34. 수온이 가장 낮은 <b>정점 ㄷ(동해 고유수)</b>가 가장 무겁습니다. 정점 ㄱ과 ㄴ은 수온이 9 ℃나 차이 나는데도 밀도는 비슷합니다. <b>염분이 그 차이를 메운 것</b>입니다.");
        ep.clear(2);
      }
    }
    canvas._redraw = draw;
    segWire("a-st", function (b) { s = +b.getAttribute("data-s"); $("a-st-val").textContent = ST[s].n; draw(); });
    $("a-sig").addEventListener("input", function (e) {
      sig = (+e.target.value) / 100; $("a-sig-val").textContent = sig.toFixed(2); draw();
    });
    draw();

    window.sthSort({
      mount: "a-sort",
      buckets: [
        { id: "k", label: "대마 난류수", sub: "정점 ㄱ · 고온 고염" },
        { id: "n", label: "황해 저층 냉수", sub: "정점 ㄴ · 저온 저염" },
        { id: "t", label: "동해 고유수", sub: "정점 ㄷ · 저온 고염" }
      ],
      items: [
        { t: "쿠로시오 해류에서 갈라져 대한해협으로 들어온 물", a: "k", why: "저위도에서 올라온 물이라 따뜻하고 짭니다." },
        { t: "셋 가운데 수온이 가장 높다", a: "k", why: "16 ℃로 가장 따뜻합니다.", hint: "표에서 수온을 견주어 보세요." },
        { t: "큰 강물이 많이 흘러들어 염분이 가장 낮다", a: "n", why: "황해는 수심이 얕고 담수 유입이 많아 염분이 낮습니다." },
        { t: "여름에 바닥에 갇혀 남아 있는 찬물", a: "n", why: "겨울에 차가워진 물이 여름에도 바닥에 남아 있는 것입니다.", hint: "얕은 바다의 바닥을 생각해 보세요." },
        { t: "수온이 1 ℃ 안팎으로 거의 일정한 깊은 물", a: "t", why: "동해 깊은 곳은 수온이 거의 변하지 않습니다." },
        { t: "셋 가운데 밀도가 가장 크다", a: "t", why: "σt 27.34로 가장 무겁습니다." }
      ],
      onDone: function () { got[3] = true; window.sthState("aTS", got); mission(); }
    });
    mission();
  })();

  /* ---- 장면4 표층 순환 ---- */
  (function () {
    var canvas = $("a-c-gyre"), ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var wind = { polar: true, westerlies: true, trade: true }, t = 0;
    var got = window.sthState("aGyre") || { a: false, b: false, c: false };

    /* 블록 모형: 북반구 대양 하나를 잘라 낸 모형. x = 서(아시아) → 동(아메리카), y = 극(뒤) → 적도(앞).
       윗면 색 = 해수면 수온, 그 위에 떠 있는 바람띠 화살표, 해수면에는 순환 고리를 따라 도는 물 알갱이. */
    var L0 = 470, D0 = 300, ZS = 36, BAND = D0 / 3.5;
    var I = K.iso({ ox: 300, oy: 140, s: 0.78, L: L0, D: D0 });
    var paintG = cache(canvas, W, H);
    function coastW(y) { return 24 + 8 * Math.sin(y / 23) + 5 * Math.sin(y / 9); }
    function coastE(y) { return L0 - 26 - 7 * Math.sin(y / 19 + 1) - 4 * Math.sin(y / 7); }
    function zG(x, y) {
      var w = coastW(y), e = coastE(y);
      if (x < w) return ZS + 6 + Math.min(14, (w - x) * 0.6);
      if (x > e) return ZS + 6 + Math.min(16, (x - e) * 0.6);
      return ZS;
    }
    function bands() {
      return [
        { y: 0.5 * BAND, name: "극동풍", dir: -1, on: wind.polar, c: LT.violet },
        { y: 1.5 * BAND, name: "편서풍", dir: 1, on: wind.westerlies, c: LT.teal },
        { y: 2.5 * BAND, name: "무역풍", dir: -1, on: wind.trade, c: LT.orange }
      ];
    }
    function loops() {
      var out = [];
      if (wind.trade && wind.westerlies) out.push({ cy: 2 * BAND, ry: BAND * .42, cw: true, c: "#f03e5e", n: "아열대 순환" });
      if (wind.westerlies && wind.polar) out.push({ cy: 1 * BAND, ry: BAND * .42, cw: false, c: "#3b5bdb", n: "아한대 순환" });
      return out;
    }
    function paintBase(c) {
      var fc = I.P(L0 / 2, D0 / 2, 0);
      K.studio(c, 0, 0, W, H, { x: fc.x, y: fc.y + 30, rx: 330, ry: 90 });
      I.field(c, zG, function (x, y, z, l) {
        if (z > ZS + 0.5) return K.tint(z > ZS + 14 ? "#9a8a64" : "#7fa35a", l);
        return tCol(2 + 26 * (y / D0), 1.02);
      }, 47, 30);
      /* 앞면 = 적도 단면, 오른쪽 면 = 동쪽 대륙 단면 */
      I.face(c, "front", function (Lw) {
        var g = c.createLinearGradient(0, 0, 0, ZS); g.addColorStop(0, "#0d2f66"); g.addColorStop(1, "#2f86c4");
        c.fillStyle = g; c.fillRect(0, 0, Lw, ZS);
        c.fillStyle = "#6d5a44";
        c.beginPath(); c.moveTo(0, 0); c.lineTo(0, zG(0, D0)); c.lineTo(coastW(D0), ZS + 6); c.lineTo(coastW(D0) + 20, 0); c.closePath(); c.fill();
        c.beginPath(); c.moveTo(Lw, 0); c.lineTo(Lw, zG(Lw - .1, D0)); c.lineTo(coastE(D0), ZS + 6); c.lineTo(coastE(D0) - 20, 0); c.closePath(); c.fill();
        c.fillStyle = "#4a3d2f"; c.fillRect(0, 0, Lw, 5);
      });
      I.face(c, "right", function (Lw) {
        I.profile(c, "right", function (u) { return zG(L0 - .1, u); }, 0);
        var g = c.createLinearGradient(0, 0, 0, ZS + 20); g.addColorStop(0, "#4a3a2b"); g.addColorStop(1, "#8c6c48");
        c.fillStyle = g; c.fill();
        c.strokeStyle = "rgba(40,25,15,.25)"; c.lineWidth = 1;
        for (var i = 1; i < 5; i++) { c.beginPath(); c.moveTo(0, i * 8); c.lineTo(Lw, i * 8 - 3); c.stroke(); }
      });
      I.shade(c, "front", function (u) { return zG(u, D0); });
      I.shade(c, "right", function (u) { return zG(L0 - .1, u); });
      I.edges(c, ZS, ZS);
      /* 적도 표시 */
      c.save(); c.setLineDash([6, 6]); c.strokeStyle = "rgba(245,159,0,.8)"; c.lineWidth = 1.6;
      var e0 = I.P(coastW(D0 - 4), D0 - 4, ZS), e1 = I.P(coastE(D0 - 4), D0 - 4, ZS); c.beginPath(); c.moveTo(e0.x, e0.y); c.lineTo(e1.x, e1.y); c.stroke(); c.restore();
      var BX = [0, 630];
      I.label(c, 10, D0 - 30, zG(10, D0 - 30), "아시아(서쪽)", -24, 26, "#d9f7c8", BX);
      I.label(c, L0 - 10, 40, zG(L0 - 10, 40), "아메리카(동쪽)", 20, -18, "#d9f7c8", BX);
      I.label(c, L0 * 0.6, D0 - 4, ZS, "적도", 18, 34, "#ffd35a", BX);
      I.label(c, L0 * 0.45, 6, ZS, "극 쪽", 16, -22, "#cfe8ff", BX);
      K.warn(c, 16, H - 14, "⚠ 네모난 해분 모식도 · 남반구에서는 도는 방향이 반대", "left");
    }
    function draw() {
      var key = (wind.polar ? 1 : 0) + "" + (wind.westerlies ? 1 : 0) + (wind.trade ? 1 : 0);
      paintG(ctx, key, paintBase);
      var Lp = loops();
      /* 순환 고리: 해수면 위 띠 + 도는 물 알갱이 */
      Lp.forEach(function (lp) {
        var cx = L0 / 2 + 6, rx = L0 / 2 - 64, i, pts = [];
        for (i = 0; i <= 64; i++) { var a = i / 64 * Math.PI * 2; pts.push(I.P(cx + rx * Math.cos(a), lp.cy + lp.ry * Math.sin(a), ZS + 1)); }
        ctx.save(); ctx.lineJoin = "round";
        ctx.beginPath(); pts.forEach(function (p, j) { if (j) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y); });
        ctx.strokeStyle = lp.c; ctx.globalAlpha = .35; ctx.lineWidth = 9; ctx.stroke();
        ctx.globalAlpha = 1; ctx.strokeStyle = "rgba(255,255,255,.85)"; ctx.lineWidth = 1.6; ctx.stroke(); ctx.restore();
        for (i = 0; i < 24; i++) {
          var u = (i / 24 + t * 0.008) % 1, a2 = (lp.cw ? 1 : -1) * u * Math.PI * 2 - Math.PI / 2;
          var q = I.P(cx + rx * Math.cos(a2), lp.cy + lp.ry * Math.sin(a2), ZS + 1);
          K.glow(ctx, q.x, q.y, 2.4, lp.c, 2.6);
        }
        /* 방향 화살표 넷 */
        [0, .25, .5, .75].forEach(function (f) {
          var s0 = (lp.cw ? 1 : -1), a0 = f * Math.PI * 2, a1 = a0 + s0 * 0.22;
          arr(ctx, I.P(cx + rx * Math.cos(a0), lp.cy + lp.ry * Math.sin(a0), ZS + 1), I.P(cx + rx * Math.cos(a1), lp.cy + lp.ry * Math.sin(a1), ZS + 1), lp.c, 3.2, 12);
        });
        /* 서안 경계류: 서쪽 가장자리에서 좁고 빠른 흐름 */
        var wx = cx - rx - 4, yA = lp.cy + lp.ry * 0.7 * (lp.cw ? 1 : -1), yB = lp.cy - lp.ry * 0.7 * (lp.cw ? 1 : -1);
        ctx.save(); ctx.shadowColor = lp.c; ctx.shadowBlur = 8; arr(ctx, I.P(wx, yA, ZS + 2), I.P(wx, yB, ZS + 2), lp.c, 5, 14); ctx.restore();
        K.pill(ctx, "해류 · " + lp.n + (lp.cw ? " ↻" : " ↺"), I.P(cx, lp.cy, ZS).x, I.P(cx, lp.cy, ZS).y + 5, { s: 13, a: "center", c: lp.cw ? "#ffb3c1" : "#bac8ff" });
      });
      /* 바람띠: 해수면 위에 떠서 흐르는 바람 */
      bands().forEach(function (b) {
        ctx.globalAlpha = b.on ? 1 : 0.16;
        var span = (L0 - 80) / 5, off = b.on ? ((t * 1.6) % span) : 0;
        for (var i = 0; i < 6; i++) {
          var tot = L0 - 90, x = 40 + (((i / 6) * tot + off * b.dir) % tot + tot) % tot;
          if (x < 34 || x > L0 - 50) continue;
          var a = I.P(x - b.dir * 22, b.y, ZS + 26), e = I.P(x + b.dir * 22, b.y, ZS + 26);
          arr(ctx, a, e, "#ffffff", 6.5, 15); arr(ctx, a, e, b.c, 3.4, 11);
        }
        var lp0 = I.P(0, b.y, ZS + 26);
        K.pill(ctx, "바람 · " + b.name + (b.dir > 0 ? " (동쪽으로)" : " (서쪽으로)"), lp0.x - 12, lp0.y + 5, { s: 12, a: "right", c: b.on ? "#ffffff" : "#9aa6bb", box: [0, 640] });
        ctx.globalAlpha = 1;
      });
      var subT = wind.trade && wind.westerlies, subP = wind.westerlies && wind.polar;
      bigHead(ctx, subT && subP ? "두 순환 완성" : (subT ? "아열대 순환 ↻" : (subP ? "아한대 순환 ↺" : "고리가 닫히지 않음")),
        subT || subP ? "방향이 반대인 이웃 두 바람 → 순환 하나" : "이웃한 두 바람을 함께 켜 보세요", "#ffffff", 18, 42);
      /* 오른쪽 판정 카드 */
      var px = 648, x0 = px + 18, x1 = W - 30;
      K.card(ctx, px, 96, W - px - 12, 300, "바람과 순환");
      bands().forEach(function (b, i) { K.row(ctx, b.name + (b.dir > 0 ? " (→)" : " (←)"), b.on ? "켜짐" : "꺼짐", x0, x1, 156 + i * 28, b.on ? b.c : LT.dim); });
      K.row(ctx, "아열대 순환", subT ? "시계 방향 ↻" : "없음", x0, x1, 260, subT ? "#e03151" : LT.dim);
      K.row(ctx, "아한대 순환", subP ? "시계 반대 ↺" : "없음", x0, x1, 288, subP ? "#3b5bdb" : LT.dim);
      K.tip(ctx, subT && subP ? "편서풍이 두 순환을 함께 돌립니다" : (subT || subP ? "고리 하나 완성 · 나머지도 만들어 보세요" : "바람 하나로는 고리가 닫히지 않습니다"), x0 - 6, 318, W - px - 36, subT || subP ? true : false);
      lt(ctx, "서쪽 가장자리 = 좁고 빠른 서안 경계류", x0 - 2, 378, { s: 11 });

      var subT = wind.trade && wind.westerlies, subP = wind.westerlies && wind.polar, ch = false;
      if (subT && !subP && !got.a) { got.a = ch = true; }
      if (subP && !subT && !got.b) { got.b = ch = true; }
      if (subT && subP && !got.c) { got.c = ch = true; }
      if (ch) { window.sthState("aGyre", got); mission(); }
    }
    function say() {
      var subT = wind.trade && wind.westerlies, subP = wind.westerlies && wind.polar;
      $("a-gyre-info").innerHTML = subT && subP ? "<b>아열대 순환</b>과 <b>아한대 순환</b>이 모두 생겼습니다. 가운데의 <b>편서풍</b>이 두 순환을 함께 돌리고 있다는 점을 보세요." :
        (subT ? "무역풍 + 편서풍 → <b>아열대 순환</b>. 북반구에서는 시계 방향으로 돕니다." :
          (subP ? "편서풍 + 극동풍 → <b>아한대 순환</b>. 북반구에서는 시계 반대 방향으로 돕니다." :
            "바람이 하나뿐이면 고리가 닫히지 않습니다. <b>방향이 반대인 이웃 두 바람</b>이 있어야 순환이 만들어집니다."));
    }
    canvas._redraw = draw;
    Array.prototype.forEach.call($("a-wind").querySelectorAll("button"), function (b) {
      b.addEventListener("click", function () {
        var k = b.getAttribute("data-wind");
        wind[k] = !wind[k]; b.classList.toggle("on", wind[k]);
        draw(); say();
      });
    });
    function mission() {
      if (got.a) done("m1-4a"); if (got.b) done("m1-4b"); if (got.c) done("m1-4c");
      if (got.a && got.b && got.c) {
        window.sthMission("m1-4", true, "<span class='m-tag'>미션 완료</span>순환 하나를 만들려면 <b>방향이 반대인 이웃 두 바람</b>이 필요합니다. 그래서 편서풍은 아열대 순환과 아한대 순환을 <b>동시에</b> 돌립니다.");
        ep.clear(3);
      }
    }
    say(); draw(); mission();
    var playG = playBtn("a-gyre-play");
    anim(canvas, function (dt) { if (playG.on) { t += dt / 70; draw(); } });
  })();

  /* ---- 장면5 에크만 수송 + 지형류 ---- */
  var GOT5 = window.sthState("aEk") || { a: false, b: false, c: false };
  function mission5() {
    if (GOT5.a) done("m1-5a"); if (GOT5.b) done("m1-5b"); if (GOT5.c) done("m1-5c");
    if (GOT5.a && GOT5.b && GOT5.c) {
      window.sthMission("m1-5", true, "<span class='m-tag'>미션 완료</span>에크만 수송은 <b>바람의 직각</b>(북반구는 오른쪽 90°, 남반구는 왼쪽 90°)입니다. 그렇게 쌓인 물이 만든 해수면 경사가 다시 <b>지형류</b>를 낳습니다.");
      ep.clear(4); ep.clear(5);
    }
  }
  (function () {
    var canvas = $("a-c-ekman"), ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var az = 180, hemi = "N";

    function ekAz() { return ((az + (hemi === "N" ? 90 : -90)) % 360 + 360) % 360; }

    /* 블록 모형: 바닷물을 유리 수조처럼 잘라 낸 블록. 깊이마다 물이 움직이는 방향(에크만 나선)을 화살표로, 위에는 바람, 수면에는 순 수송 */
    var I = K.iso({ ox: 240, oy: 248, s: 0.78, L: 190, D: 190 }), ZT = 168, CX = 95, CY = 95;
    function wv3(a) { var r = a * Math.PI / 180; return { x: Math.sin(r), y: -Math.cos(r) }; }
    function ring(z, r, col, w) {
      ctx.strokeStyle = col; ctx.lineWidth = w || 1; ctx.beginPath();
      for (var k = 0; k <= 48; k++) { var a = k / 48 * 6.2832, p = I.P(CX + r * Math.cos(a), CY + r * Math.sin(a), z); if (k) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y); }
      ctx.stroke();
    }
    function arrow3(z, a, len, col, w, hd) {
      var d = wv3(a), p0 = I.P(CX, CY, z), p1 = I.P(CX + d.x * len, CY + d.y * len, z);
      arr(ctx, p0, p1, "rgba(255,255,255,.9)", w + 3, hd + 3); arr(ctx, p0, p1, col, w, hd);
      return p1;
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      var ek = ekAz(), sg = hemi === "N" ? 1 : -1, i;
      var fc = I.P(CX, CY, 0);
      K.studio(ctx, 0, 0, W, H, { x: fc.x, y: fc.y + 20, rx: 200, ry: 56 });
      /* 뒤쪽 두 벽과 바닥(물 너머로 보이는 면) */
      I.quad(ctx, I.P(0, 0, 0), I.P(I.L, 0, 0), I.P(I.L, 0, ZT), I.P(0, 0, ZT), "rgba(30,100,180,.22)");
      I.quad(ctx, I.P(0, 0, 0), I.P(0, I.D, 0), I.P(0, I.D, ZT), I.P(0, 0, ZT), "rgba(30,100,180,.30)");
      I.plane(ctx, 0, "rgba(20,70,140,.35)");
      /* 깊이별 물의 움직임: 깊을수록 짧아지고 더 휜다 */
      for (i = 6; i >= 0; i--) {
        var z = ZT - 4 - i * 24, a2 = az + sg * (20 + i * 22), len = 78 * Math.pow(0.78, i);
        ring(z, 70, "rgba(255,255,255,.28)", 1);
        var col = i === 0 ? "#1c7ed6" : "rgba(28,126,214," + (1 - i * 0.1).toFixed(2) + ")";
        arrow3(z, a2, len, col, i === 0 ? 4 : 2.8, i === 0 ? 12 : 9);
        var c0 = I.P(CX, CY, z); ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(c0.x, c0.y, 2.4, 0, 6.2832); ctx.fill();
      }
      /* 가운데 관측줄 */
      var ta = I.P(CX, CY, ZT), tb = I.P(CX, CY, ZT - 4 - 6 * 24);
      ctx.strokeStyle = "rgba(255,255,255,.55)"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(ta.x, ta.y); ctx.lineTo(tb.x, tb.y); ctx.stroke();
      /* 앞면·오른쪽 면: 반투명 물 */
      ["front", "right"].forEach(function (side) {
        I.face(ctx, side, function (Lw) {
          var g = ctx.createLinearGradient(0, 0, 0, ZT); g.addColorStop(0, "rgba(15,60,130,.42)"); g.addColorStop(1, "rgba(80,170,235,.20)");
          ctx.fillStyle = g; ctx.fillRect(0, 0, Lw, ZT);
          ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.setLineDash([4, 5]); ctx.lineWidth = 1;
          for (var k = 1; k <= 6; k++) { ctx.beginPath(); ctx.moveTo(0, ZT - 4 - k * 24); ctx.lineTo(Lw, ZT - 4 - k * 24); ctx.stroke(); }
          ctx.setLineDash([]);
        });
      });
      /* 수면 + 순 수송(굵은 빨간 화살표) */
      I.plane(ctx, ZT, "rgba(140,210,255,.30)", "rgba(255,255,255,.85)");
      I.edges(ctx, ZT, ZT);
      var pe = arrow3(ZT + 1, ek, 92, "#e03131", 6, 16);
      /* 바람(수면 위에 떠 있는 노란 화살표) */
      var pw = arrow3(ZT + 58, az, 92, "#f59f00", 6, 16);
      var w0 = I.P(CX, CY, ZT + 58); ctx.strokeStyle = "rgba(245,159,0,.5)"; ctx.setLineDash([3, 4]); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(w0.x, w0.y); ctx.lineTo(ta.x, ta.y); ctx.stroke(); ctx.setLineDash([]);
      var BX = [0, 470];
      /* 범례(화살표 옆 이름표는 방향에 따라 겹치므로 한곳에 모은다) */
      K.pill(ctx, "━ 바람 (수면 위)", 18, 106, { s: 12, c: "#ffd35a" });
      K.pill(ctx, "━ 순 수송 (에크만 수송)", 18, 132, { s: 12, c: "#ffb3b3" });
      K.pill(ctx, "━ 깊이별 물의 움직임", 18, 158, { s: 12, c: "#a9dcff" });
      /* 깊이 눈금(왼쪽 앞 모서리) */
      for (i = 0; i <= 6; i += 2) { var q = I.P(0, I.D, ZT - 4 - i * 24); ctx.strokeStyle = LT.line; ctx.beginPath(); ctx.moveTo(q.x - 6, q.y); ctx.lineTo(q.x, q.y); ctx.stroke(); lt(ctx, (i * 12) + " m", q.x - 9, q.y + 4, { s: 10.5, a: "right" }); }
      /* 북쪽 표시 */
      var n0 = I.P(I.L - 18, 44, ZT), n1 = I.P(I.L - 18, 8, ZT); arr(ctx, n0, n1, "#12203a", 2, 8);
      K.pill(ctx, "북", n1.x + 8, n1.y + 2, { s: 11, c: "#ffffff", box: BX });
      bigHead(ctx, hemi === "N" ? "북반구 · 오른쪽 90°" : "남반구 · 왼쪽 90°", "바람 " + azName(az) + "쪽 → 수송 " + azName(ek) + "쪽", "#ffffff", 18, 42);
      K.warn(ctx, 18, H - 12, "⚠ 깊이·화살표 길이는 모식적", "left");

      /* ── 오른쪽 흰 카드: 위에서 본 바람과 순 수송 ── */
      var RX = 482, RW = W - RX - 12;
      K.card(ctx, RX, 12, RW, H - 24, "위에서 본 모습");
      var cx = RX + RW / 2, cy = 184, R = 100;
      lcompass(ctx, cx, cy, R, [az, ek]);
      var wv = azVec(az), ev = azVec(ek);
      var a0 = Math.atan2(wv.y, wv.x), a1 = Math.atan2(ev.y, ev.x);
      var da = ((a1 - a0 + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, 34, a0, a0 + da, da < 0); ctx.closePath();
      ctx.fillStyle = "rgba(224,49,49,.16)"; ctx.fill();
      arr(ctx, { x: cx, y: cy }, { x: cx + wv.x * R * 0.92, y: cy + wv.y * R * 0.92 }, "#f59f00", 5, 14);
      arr(ctx, { x: cx, y: cy }, { x: cx + ev.x * R * 0.78, y: cy + ev.y * R * 0.78 }, "#e03131", 5, 14);
      ctx.fillStyle = "#12203a"; ctx.beginPath(); ctx.arc(cx, cy, 3.5, 0, 6.2832); ctx.fill();
      K.t(ctx, "90°", cx + Math.cos(a0 + da / 2) * 52, cy + Math.sin(a0 + da / 2) * 52 + 5, { s: 12, a: "center", w: "900", c: LT.red });
      K.row(ctx, "바람이 부는 쪽", azName(az) + "쪽 (" + az + "°)", RX + 18, W - 30, 334, "#d9480f");
      K.row(ctx, "순 수송", azName(ek) + "쪽 (" + ek + "°)", RX + 18, W - 30, 360, LT.red);
      K.tip(ctx, hemi === "N" ? "북반구 : 바람의 오른쪽 90°" : "남반구 : 바람의 왼쪽 90°", RX + 14, 370, RW - 28, true);

      var ch = false;
      if (hemi === "N" && Math.abs(((ek - 90 + 540) % 360) - 180) <= 10 && !GOT5.a) { GOT5.a = ch = true; }
      if (hemi === "S" && Math.abs(((ek - 270 + 540) % 360) - 180) <= 10 && !GOT5.b) { GOT5.b = ch = true; }
      if (ch) { window.sthState("aEk", GOT5); mission5(); }

      $("a-ekman-info").innerHTML = "표층 물은 바람의 오른쪽(북반구)으로 조금 휘고, 그 아래 물은 더 휩니다. 이 나선을 <b>모두 더한 값</b>이 순 수송이고, 그 방향이 바람의 <b>직각</b>이 됩니다. " +
        (hemi === "N" && ek >= 80 && ek <= 100 ? "<b>지금이 남풍입니다.</b> 물은 정동쪽으로 실려 갑니다 — 부표가 간 방향입니다." : "바람 방향을 돌려 가며 순 수송이 어떻게 따라 도는지 보세요.");
    }
    canvas._redraw = draw;
    $("a-wd").addEventListener("input", function (e) {
      az = +e.target.value; $("a-wd-val").textContent = azName(az) + " (" + az + "°)"; draw();
    });
    segWire("a-hemi", function (b) { hemi = b.getAttribute("data-h"); $("a-hemi-val").textContent = hemi === "N" ? "북반구" : "남반구"; draw(); });
    draw();
  })();

  (function () {
    var canvas = $("a-c-geo"), ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var h = 20;
    var G = 9.8, F = 8.365e-5;
    function speed(hcm) { return G * (hcm / 100 / 1e5) / F; }

    /* 블록 모형: 폭 100 km 바다를 잘라 낸 블록. 윗면 = 동쪽으로 높아지는 해수면, 앞면 = 단면(등수압면·두 힘), 윗면 화살표 = 북쪽으로 흐르는 지형류 */
    var I = K.iso({ ox: 200, oy: 180, s: 0.72, L: 380, D: 150 }), ZS = 110;
    function draw() {
      ctx.clearRect(0, 0, W, H);
      var vv = speed(h), rise = clamp(h * 0.5, 4, 60), LW = 470, i;
      function zt(x) { return ZS + rise * x / I.L; }
      var fc = I.P(I.L / 2, I.D / 2, 0);
      K.studio(ctx, 0, 0, W, H, { x: fc.x, y: fc.y + 16, rx: 250, ry: 60 });
      /* 앞면: 바닷물 단면과 기울어진 등수압면 */
      I.face(ctx, "front", function (Lw) {
        I.profile(ctx, "front", zt, 0);
        var g = ctx.createLinearGradient(0, 0, 0, ZS + rise); g.addColorStop(0, "#0c2a5e"); g.addColorStop(1, "#3c9ad6");
        ctx.fillStyle = g; ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,.55)"; ctx.setLineDash([6, 5]); ctx.lineWidth = 1.2;
        for (var q = 1; q <= 3; q++) { ctx.beginPath(); ctx.moveTo(0, ZS - q * 24); ctx.lineTo(Lw, ZS - q * 24 + rise); ctx.stroke(); }
        ctx.setLineDash([]);
        ctx.fillStyle = "#5b4a3a"; ctx.fillRect(0, 0, Lw, 8);
      });
      I.face(ctx, "right", function (Lw) {
        var g = ctx.createLinearGradient(0, 0, 0, ZS + rise); g.addColorStop(0, "#0a2350"); g.addColorStop(1, "#2f7fc0");
        ctx.fillStyle = g; ctx.fillRect(0, 0, Lw, ZS + rise);
        ctx.fillStyle = "#4a3c2f"; ctx.fillRect(0, 0, Lw, 8);
      });
      I.shade(ctx, "front", zt); I.shade(ctx, "right", function () { return ZS + rise; });
      /* 윗면: 기울어진 해수면(높을수록 밝게) */
      I.top(ctx, zt, function (k, u) { return mix("#3f8fd0", "#8fd0f5", u / I.L); }, 30);
      ctx.strokeStyle = "rgba(255,255,255,.5)"; ctx.lineWidth = 1;
      for (i = 0; i < 10; i++) { var gx = 20 + (i * 71) % 340, gy = 14 + (i * 47) % 120, s1 = I.P(gx, gy, zt(gx)), s2 = I.P(gx + 16, gy, zt(gx + 16)); ctx.beginPath(); ctx.moveTo(s1.x, s1.y); ctx.quadraticCurveTo((s1.x + s2.x) / 2, s1.y - 2, s2.x, s2.y); ctx.stroke(); }
      I.edges(ctx, ZS, ZS + rise);
      /* 원래 해수면(점선) */
      var b0 = I.P(0, I.D, ZS), b1 = I.P(I.L, I.D, ZS);
      ctx.strokeStyle = "rgba(255,255,255,.85)"; ctx.setLineDash([3, 4]); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(b0.x, b0.y); ctx.lineTo(b1.x, b1.y); ctx.stroke(); ctx.setLineDash([]);
      /* 높이 차 꺾쇠 */
      var hA = I.P(I.L, I.D, ZS), hB = I.P(I.L, I.D, ZS + rise);
      ctx.strokeStyle = "#f59f00"; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(hA.x + 6, hA.y); ctx.lineTo(hA.x + 12, hA.y); ctx.lineTo(hB.x + 12, hB.y); ctx.lineTo(hB.x + 6, hB.y); ctx.stroke();
      K.pill(ctx, h + " cm", hB.x + 18, (hA.y + hB.y) / 2 + 5, { s: 12, c: "#ffd35a", box: [0, LW] });
      /* 두 힘(앞면 단면 위) */
      var mid = I.P(I.L * 0.5, I.D, ZS * 0.5 + rise * 0.25);
      var pL = I.P(I.L * 0.5 - 95, I.D, ZS * 0.5 + rise * 0.25 - rise * 0.25), pR = I.P(I.L * 0.5 + 95, I.D, ZS * 0.5 + rise * 0.25 + rise * 0.25);
      arr(ctx, mid, pL, "#ffffff", 8, 17); arr(ctx, mid, pL, "#e03131", 5, 14);
      arr(ctx, mid, pR, "#ffffff", 8, 17); arr(ctx, mid, pR, "#7048e8", 5, 14);
      var BX = [0, LW];
      K.pill(ctx, "압력 경도력 → 낮은 쪽", pL.x + 10, pL.y - 16, { s: 11.5, a: "center", c: "#ffb3b3", box: BX });
      K.pill(ctx, "전향력", pR.x + 4, pR.y + 26, { s: 11.5, a: "center", c: "#d6c8ff", box: BX });
      /* 지형류: 윗면 위로 북쪽(블록 안쪽)으로 */
      var fx = I.L * 0.42, g0 = I.P(fx, I.D - 14, zt(fx) + 2), g1 = I.P(fx, 14, zt(fx) + 2);
      ctx.save(); ctx.shadowColor = "rgba(15,159,118,.7)"; ctx.shadowBlur = 8; arr(ctx, g0, g1, "#ffffff", 10, 20); arr(ctx, g0, g1, "#0f9f76", 6.5, 17); ctx.restore();
      K.pill(ctx, "지형류 · 등수압선과 나란히 북쪽으로", g1.x + 12, g1.y - 4, { s: 12, c: "#9ff0cf", box: BX });
      K.pill(ctx, "낮은 쪽(서)", I.P(0, I.D, ZS).x - 10, I.P(0, I.D, ZS).y + 4, { s: 11, a: "right", c: "#e8ecff", box: BX });
      K.pill(ctx, "높은 쪽(동)", I.P(I.L, 0, ZS + rise).x + 8, I.P(I.L, 0, ZS + rise).y + 4, { s: 11, c: "#ffd35a", box: BX });
      var e0 = I.P(0, I.D, 0), e1 = I.P(I.L, I.D, 0);
      K.pill(ctx, "폭 100 km", (e0.x + e1.x) / 2 - 30, (e0.y + e1.y) / 2 + 26, { s: 11, a: "center", c: "#e8ecff", box: BX });
      bigHead(ctx, vv.toFixed(2) + " m/s", "해수면 높이 차 " + h + " cm / 100 km", vv >= 1 ? "#9ff0cf" : "#ffffff", 18, 42);

      /* ── 오른쪽 흰 카드: 속도계 ── */
      var RX = 482, RW = W - RX - 12, x0 = RX + 20, x1 = W - 32;
      K.card(ctx, RX, 12, RW, H - 24, "지형류 속도");
      lt(ctx, "지형류 = (g ÷ f) × 해수면 기울기", x0, 66, { s: 12 });
      K.t(ctx, vv.toFixed(2) + " m/s", x0, 112, { s: 34, w: "900", c: vv >= 1 ? LT.green : LT.yellow });
      K.tip(ctx, vv >= 1 ? "✅ 서안 경계류 수준입니다" : "아직 느립니다 · 기울기를 키워 보세요", x0 - 4, 128, RW - 32, vv >= 1);
      var gx2 = x0 + 6, gw = RW - 52, gy2 = 222, VMAX = 3;
      function GX(val) { return gx2 + clamp(val / VMAX, 0, 1) * gw; }
      ctx.fillStyle = "rgba(15,159,118,.16)"; ctx.fillRect(GX(1), gy2 - 8, GX(2) - GX(1), 26);
      K.bar(ctx, gx2, gy2, gw, vv / VMAX, vv >= 1 ? LT.green : LT.yellow);
      ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(GX(vv), gy2 + 5, 7, 0, 6.2832); ctx.fill(); ctx.strokeStyle = LT.ink; ctx.lineWidth = 2; ctx.stroke();
      [0, 1, 2, 3].forEach(function (m) { lt(ctx, m + "", GX(m), gy2 + 34, { s: 11, a: "center" }); });
      lt(ctx, "m/s", gx2 + gw, gy2 + 50, { s: 10.5, a: "right" });
      lt(ctx, "걸프 해류·쿠로시오 1~2 m/s", (GX(1) + GX(2)) / 2, gy2 - 16, { s: 11.5, a: "center", c: LT.green, w: "800" });
      K.row(ctx, "위도 · 중력 가속도", "35° · 9.8 m/s²", x0, x1, 304, LT.ink);
      lt(ctx, "경사가 커질수록 지형류가 빨라집니다.", x0, 332, { s: 11.5 });
      K.warn(ctx, 18, H - 12, "⚠ 높이 차는 과장해 그림", "left");

      $("a-geo-read").innerHTML =
        "<span class='k'>높이 차</span><span class='v b'>" + h + " cm / 100 km</span>" +
        "<span class='k'>지형류</span><span class='v y'>" + vv.toFixed(2) + " m/s</span>" +
        "<span class='sub'>v = (g ÷ f) × 기울기 · f = 2Ω sin35°</span>" +
        "<span class='ok " + (vv >= 1 ? "g" : "r") + "'>" + (vv >= 1 ? "서안 경계류처럼 빠릅니다" : "1.0 m/s 에 못 미칩니다") + "</span>";

      if (vv >= 1.0 && !GOT5.c) { GOT5.c = true; window.sthState("aEk", GOT5); mission5(); }
      $("a-geo-info").innerHTML = "에크만 수송이 순환 한가운데로 물을 밀어 넣으면 그 자리 해수면이 몇십 cm 볼록해집니다. 물은 흘러내리려 하지만(<b>압력 경도력</b>) 움직이는 순간 <b>전향력</b>에 휘어, 결국 경사면을 따라 내려가지 못하고 <b>등수압선과 나란히</b> 돕니다.";
    }
    canvas._redraw = draw;
    $("a-slope").addEventListener("input", function (e) { h = +e.target.value; $("a-slope-val").textContent = h + " cm"; draw(); });
    draw(); mission5();
  })();

  function finish() { window.sthState("r1", "해결 · 에크만 수송은 바람의 직각(북반구 오른쪽 90°), 정점 ㄷ 동해 고유수가 σt 27.34로 가장 무겁다"); }
  function vsA() {
    var p = window.sthState("current") || "";
    $("a-vs").innerHTML = "<b>나의 첫 추리</b> " + (p || "기록 없음") + "<br>" +
      (p.indexOf("㉡") === 0 ? "정확했습니다. 그리고 오늘 그 ‘어긋나는 정도’가 90°까지 벌어질 수 있다는 것까지 확인했습니다."
        : "㉡ 이 정답이었습니다. 바람이 해류를 만들지만 방향이 그대로 옮겨지지는 않습니다. 전향력이 끼어들기 때문입니다.");
  }
  vsA();
  ep.onShow(vsA);
  window.sthWork({
    mount: "wkA", unitLabel: "[지구과학 Ⅰ-1] 이야기 ① 바람과 어긋난 부표",
    items: [
      { id: "w1", label: "수온약층이 생기는 까닭", hint: "깊이에 따른 수온 변화 그래프에서 수온약층이 어느 구간인지 짚고, 그 층이 왜 위아래 물의 섞임을 막는지 쓰세요." },
      { id: "a2", label: "항해사에게 보내는 답장", hint: "부표가 바람 방향이 아니라 오른쪽 90°로 간 까닭을, ‘전향력’과 ‘에크만 수송’을 넣어 설명하세요." }
    ]
  });
})();

/* =========================================================================
   이야기 ② 1,000년을 도는 물
   ========================================================================= */
(function () {
  var ep = window.sthStory({ root: "epB", key: "epB", name: "사건 파일 ②", onDone: finish });

  window.sthGate({
    gate: "b-gate", key: "b-p", title: "학생 연구원의 첫 추리",
    question: "그린란드 빙상이 녹아 표층에 담수가 쏟아지면, 심층 순환은 어떻게 될까요?",
    options: ["㉠ 물이 늘어나므로 오히려 더 잘 가라앉는다", "㉡ 염분이 낮아져 잘 가라앉지 못하고 순환이 느려진다", "㉢ 아무 영향이 없다 — 순환은 바람이 돌린다"],
    onPick: function () { ep.clear(0); }
  });

  /* ---- 장면2 침강 판정 ---- */
  (function () {
    var canvas = $("b-c-sink"), ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var T = 10, S = 35;
    var got = window.sthState("bSink") || { a: false, b: false };
    var LIMIT = 27.8;

    /* 주변 바다의 밀도 프로파일 (깊이 m → σt) */
    var AMB = [[0, 25.5], [200, 26.4], [600, 27.1], [1000, 27.5], [2000, 27.75], [4000, 27.88]];
    function ambAt(z) {
      for (var i = 1; i < AMB.length; i++) {
        if (z <= AMB[i][0]) {
          var u = (z - AMB[i - 1][0]) / (AMB[i][0] - AMB[i - 1][0]);
          return AMB[i - 1][1] + (AMB[i][1] - AMB[i - 1][1]) * u;
        }
      }
      return AMB[AMB.length - 1][1];
    }
    function settle(sig) {
      if (sig <= AMB[0][1]) return 0;
      for (var z = 0; z <= 4000; z += 20) if (ambAt(z) >= sig) return z;
      return 4000;
    }

    var zShow = 0;
    /* 블록 모형: 북대서양 바다 기둥(0~4000 m). 앞면 색 = 주변 바다의 밀도 층, 그 앞에서 내 물덩어리(입체 공)가 제 깊이까지 가라앉는다.
       오른쪽 흰 카드 = 밀도 눈금과 판정 */
    var I = K.iso({ ox: 210, oy: 306, s: 0.7, L: 230, D: 120 }), ZT = 300;
    function ZD(zz) { return ZT * (1 - zz / 4000); }
    var paintS = cache(canvas, W, H);
    function sigCol(s2, f) { return mix("#f3c47a", "#4b2fa6", (s2 - 25.3) / 2.7, f); }
    function ball(x, y, r, T, heavy) {
      K.planet(ctx, x, y, r, heavy ? "#9b84ff" : tCol(T, 1.1), heavy ? "#2d1b7a" : tCol(T, 0.45));
      ctx.strokeStyle = "rgba(255,255,255,.9)"; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.stroke();
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      var sig = sigmaT(T, S), z = settle(sig), heavy = sig >= LIMIT, icy = T <= 2;
      paintS(ctx, icy ? 1 : 0, function (c) {
        var fc = I.P(I.L / 2, I.D / 2, 0);
        K.studio(c, 0, 0, W, H, { x: fc.x, y: fc.y + 10, rx: 220, ry: 50 });
        ["front", "right"].forEach(function (side) {
          I.face(c, side, function (Lw) {
            var g = c.createLinearGradient(0, ZT, 0, 0);
            for (var k = 0; k <= 16; k++) { var zz = 4000 * k / 16; g.addColorStop(k / 16, sigCol(ambAt(zz), side === "right" ? 0.85 : 1)); }
            c.fillStyle = g; c.fillRect(0, 0, Lw, ZT);
            c.strokeStyle = "rgba(255,255,255,.35)"; c.lineWidth = 1; c.setLineDash([5, 5]);
            [1000, 2000, 3000].forEach(function (zz) { c.beginPath(); c.moveTo(0, ZD(zz)); c.lineTo(Lw, ZD(zz)); c.stroke(); });
            c.setLineDash([]);
            c.fillStyle = "#4a3c2f"; c.fillRect(0, 0, Lw, 6);
          });
        });
        I.shade(c, "front", function () { return ZT; }); I.shade(c, "right", function () { return ZT; });
        I.plane(c, ZT, icy ? "#bfe0f2" : "#5aa8dc", "rgba(255,255,255,.85)");
        if (icy) [[20, 20, 40, 26], [90, 64, 30, 22], [160, 18, 46, 30], [40, 84, 26, 20], [190, 80, 26, 18]].forEach(function (q) {
          I.box(c, q[0], q[1], ZT, q[0] + q[2], q[1] + q[3], ZT + 5, "#f6fbff", "#d6eaf6", "#aecbe0");
        });
        I.edges(c, ZT, ZT);
        [0, 1000, 2000, 3000, 4000].forEach(function (zz) {
          var q = I.P(0, I.D, ZD(zz)); c.strokeStyle = LT.line; c.lineWidth = 1; c.beginPath(); c.moveTo(q.x - 6, q.y); c.lineTo(q.x, q.y); c.stroke();
          lt(c, zz.toLocaleString() + " m", q.x - 9, q.y + 4, { s: 10.5, a: "right" });
          var r2 = I.P(I.L, 0, ZD(zz)); lt(c, "σt " + ambAt(zz).toFixed(2), r2.x + 8, r2.y + 4, { s: 10.5 });
        });
        lt(c, "주변 바다", I.P(I.L, 0, ZT).x + 8, I.P(I.L, 0, ZT).y - 12, { s: 11, w: "800" });
      });
      /* 내 물덩어리 */
      var bxw = I.L * 0.42, top = I.P(bxw, I.D, ZT), bp = I.P(bxw, I.D, ZD(zShow));
      if (zShow > 20) {
        var tg = ctx.createLinearGradient(0, top.y, 0, bp.y);
        tg.addColorStop(0, "rgba(255,255,255,0)"); tg.addColorStop(1, heavy ? "rgba(155,132,255,.8)" : "rgba(255,120,110,.7)");
        ctx.strokeStyle = tg; ctx.lineWidth = 7; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(top.x, top.y + 4); ctx.lineTo(bp.x, bp.y - 14); ctx.stroke(); ctx.lineCap = "butt";
      }
      ball(bp.x, bp.y, 13, T, heavy);
      var settled = Math.abs(zShow - z) < 8;
      var stTxt = settled ? (z >= 3900 ? "바닥까지 가라앉음" : (z < 60 ? "표층에 그대로 떠 있음" : "약 " + z.toLocaleString() + " m에서 멈춤")) : "가라앉는 중…";
      K.pill(ctx, stTxt, bp.x + 22, clamp(bp.y + 5, 110, H - 20), { s: 12.5, c: heavy ? "#d6c8ff" : "#ffb3b3", box: [0, 470] });
      bigHead(ctx, "σt " + sig.toFixed(2), heavy ? "심층수만큼 무겁다 · 깊이 가라앉는다" : "아직 가볍다 · 위에 머문다", heavy ? "#d6c8ff" : "#ffffff", 18, 42);

      /* ── 오른쪽 흰 카드: 밀도 눈금과 판정 ── */
      var RX = 490, RW = W - RX - 12, x0 = RX + 20, x1 = W - 32;
      K.card(ctx, RX, 12, RW, H - 24, "내 물덩어리의 밀도");
      K.row(ctx, "수온", T.toFixed(1) + " ℃", x0, x1, 66, LT.blue);
      K.row(ctx, "염분", S.toFixed(1) + " psu", x0, x1, 92, LT.green);
      K.t(ctx, "σt " + sig.toFixed(2), x0, 140, { s: 32, w: "900", c: heavy ? LT.violet : LT.yellow });
      var gx0 = x0 + 6, gx1 = x1 - 6, gy = 196;
      function X(s2) { return gx0 + clamp((s2 - 24) / 4.5, 0, 1) * (gx1 - gx0); }
      var bar = ctx.createLinearGradient(gx0, 0, gx1, 0);
      bar.addColorStop(0, "#f3c47a"); bar.addColorStop(.6, "#7fb8e6"); bar.addColorStop(1, "#6a4be0");
      ctx.fillStyle = bar; ctx.beginPath(); ctx.roundRect(gx0, gy - 6, gx1 - gx0, 12, 6); ctx.fill();
      for (var g = 24; g <= 28; g += 1) { ctx.strokeStyle = LT.line; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(X(g), gy + 8); ctx.lineTo(X(g), gy + 14); ctx.stroke(); lt(ctx, String(g), X(g), gy + 30, { s: 11, a: "center" }); }
      lt(ctx, "← 가볍다", gx0, gy + 48, { s: 11.5, c: LT.orange, w: "800" });
      lt(ctx, "무겁다 →", gx1, gy + 48, { s: 11.5, a: "right", c: LT.violet, w: "800" });
      ctx.strokeStyle = LT.red; ctx.setLineDash([5, 4]); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(X(LIMIT), gy - 26); ctx.lineTo(X(LIMIT), gy + 10); ctx.stroke(); ctx.setLineDash([]);
      lt(ctx, "심층수 기준 27.8", X(LIMIT), gy - 32, { s: 11.5, a: "right", c: LT.red, w: "800" });
      ball(X(sig), gy, 9, T, heavy);
      K.row(ctx, "❄ 차가울수록", "무거워진다", x0, x1, 290, LT.blue);
      K.row(ctx, "🧂 짤수록", "무거워진다", x0, x1, 316, LT.green);
      K.tip(ctx, heavy ? "북대서양 심층수처럼 바닥으로 갑니다" : (S <= 33 ? "염분이 낮아 담수가 뚜껑을 덮은 셈" : "수온을 낮추거나 염분을 높여 보세요"), x0 - 6, 336, RW - 28, heavy);
      lt(ctx, "가라앉는 깊이 = 주변 물과 밀도가 같아지는 곳", x0, 398, { s: 11 });

      var ch = false;
      if (sig >= LIMIT && !got.a) { got.a = ch = true; }
      if (S <= 33.0 && T <= 2.0 && !got.b) { got.b = ch = true; }
      if (ch) { window.sthState("bSink", got); mission(); }

      $("b-sink-info").innerHTML = sig >= LIMIT ?
        "<b>σt " + sig.toFixed(2) + "</b> — 북대서양 심층수 수준입니다. 이 물은 바닥 가까이까지 가라앉아 남쪽으로 긴 여행을 떠납니다." :
        "<b>σt " + sig.toFixed(2) + "</b> — 아직 주변 심층수보다 가볍습니다. " +
        (S <= 33 ? "염분이 이렇게 낮으면 <b>수온을 아무리 낮춰도</b> 심층까지 내려가지 못합니다. 담수가 뚜껑을 덮은 셈입니다." : "수온을 낮추거나 염분을 높여 보세요.");
    }
    function mission() {
      if (got.a) done("m2-2a"); if (got.b) done("m2-2b");
      if (got.a && got.b) {
        window.sthMission("m2-2", true, "<span class='m-tag'>미션 완료</span>가라앉히는 것은 <b>밀도</b> 하나뿐입니다. 그리고 표층에서 밀도를 정하는 것은 <b>수온과 염분</b>. 담수가 얹혀 염분이 떨어지면 아무리 차가워져도 무거워지지 못합니다.");
        ep.clear(1);
      }
    }
    canvas._redraw = draw;
    $("b-temp").addEventListener("input", function (e) { T = +e.target.value; $("b-temp-val").textContent = T.toFixed(1) + " ℃"; draw(); });
    $("b-sal").addEventListener("input", function (e) { S = +e.target.value; $("b-sal-val").textContent = S.toFixed(1) + " psu"; draw(); });
    zShow = settle(sigmaT(T, S));
    draw(); mission();
    /* 물덩어리가 제 깊이까지 천천히 가라앉거나 떠오른다 */
    anim(canvas, function (dt) {
      var zt = settle(sigmaT(T, S));
      if (REDUCE) { if (zShow !== zt) { zShow = zt; draw(); } return; }
      if (Math.abs(zShow - zt) > 0.5) { zShow += (zt - zShow) * Math.min(1, dt / 450); if (Math.abs(zShow - zt) < 0.5) zShow = zt; draw(); }
    });
  })();

  /* ---- 장면3 컨베이어 벨트 속도 ---- */
  (function () {
    var canvas = $("b-c-belt"), ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var i0 = 45, t = 0;
    var got = window.sthState("bBelt") || { a: false, b: false };
    var LEN_CM = 4e9, SEC_YR = 3.1557e7;
    function vel(i) { return 0.1 * Math.pow(10, 0.0334 * i); }
    function years(vv) { return LEN_CM / vv / SEC_YR; }

    /* 블록 모형: 세계의 바다를 한 줄로 펴서 잘라 낸 블록(개념도). 앞면 단면에 컨베이어 벨트 고리 —
       왼쪽(북대서양·남극) 침강 → 바닥의 차가운 심층류 → 오른쪽(인도양·태평양) 용승 → 위의 따뜻한 표층 귀환류 */
    var I = K.iso({ ox: 150, oy: 190, s: 0.82, L: 470, D: 110 }), ZT = 115;
    var paintB = cache(canvas, W, H);
    var X0 = 44, X1 = 470 - 44, Z0 = 20, Z1 = ZT - 16;
    function pt(u) {
      var a = X1 - X0, b = Z1 - Z0, per = 2 * a + 2 * b, d = ((u % 1) + 1) % 1 * per;
      if (d < a) return { x: X1 - d, z: Z1, warm: true };            /* 표층: 동 → 서 */
      d -= a; if (d < b) return { x: X0, z: Z1 - d, warm: false };   /* 침강 */
      d -= b; if (d < a) return { x: X0 + d, z: Z0, warm: false };   /* 심층: 서 → 동 */
      d -= a; return { x: X1, z: Z0 + d, warm: true };              /* 용승 */
    }
    function draw() {
      var vv = vel(i0), yr = years(vv);
      paintB(ctx, 1, function (c) {
        var fc = I.P(I.L / 2, I.D / 2, 0);
        K.studio(c, 0, 0, W, H, { x: fc.x, y: fc.y + 20, rx: 300, ry: 70 });
        ["front", "right"].forEach(function (side) {
          I.face(c, side, function (Lw) {
            var g = c.createLinearGradient(0, 0, 0, ZT);
            g.addColorStop(0, side === "front" ? "#0b2350" : "#081b40"); g.addColorStop(0.72, "#1f5fa6"); g.addColorStop(0.86, "#3f9fd0"); g.addColorStop(1, "#e7b46a");
            c.fillStyle = g; c.fillRect(0, 0, Lw, ZT);
            c.fillStyle = "#4a3c2f"; c.fillRect(0, 0, Lw, 6);
          });
        });
        I.shade(c, "front", function () { return ZT; }); I.shade(c, "right", function () { return ZT; });
        I.top(c, function () { return ZT; }, function (k, u) { return mix("#7cc3ea", "#f0b874", u / I.L); }, 30);
        /* 얼음(왼쪽 끝 = 고위도 침강 해역) */
        [[8, 12, 30, 22], [16, 52, 24, 18], [6, 84, 30, 18]].forEach(function (q) { I.box(c, q[0], q[1], ZT, q[0] + q[2], q[1] + q[3], ZT + 5, "#f6fbff", "#d6eaf6", "#aecbe0"); });
        I.edges(c, ZT, ZT);
        /* 벨트 길 */
        c.save(); c.lineJoin = "round"; c.lineWidth = 16;
        function path(warm) {
          c.beginPath();
          if (warm) { var a1 = I.P(X0, I.D, Z1), a2 = I.P(X1, I.D, Z1), a3 = I.P(X1, I.D, Z0); c.moveTo(a3.x, a3.y); c.lineTo(a2.x, a2.y); c.lineTo(a1.x, a1.y); }
          else { var b1 = I.P(X0, I.D, Z1), b2 = I.P(X0, I.D, Z0), b3 = I.P(X1, I.D, Z0); c.moveTo(b1.x, b1.y); c.lineTo(b2.x, b2.y); c.lineTo(b3.x, b3.y); }
        }
        path(true); c.strokeStyle = "rgba(255,170,90,.45)"; c.stroke(); c.lineWidth = 2.4; c.strokeStyle = "#ffcf9c"; c.stroke();
        c.lineWidth = 16; path(false); c.strokeStyle = "rgba(120,190,255,.40)"; c.stroke(); c.lineWidth = 2.4; c.strokeStyle = "#bfe3ff"; c.stroke();
        c.restore();
        var BX = [0, 560];
        I.label(c, X0, I.D, (Z0 + Z1) / 2, "침강 · 그린란드·웨델해", -14, 150, "#d6c8ff", BX);
        I.label(c, X1, I.D, (Z0 + Z1) / 2, "용승 · 인도양, 태평양", 30, 24, "#ffd0a8", BX);
        I.label(c, (X0 + X1) / 2 - 40, I.D, Z1, "따뜻한 표층 귀환류", 40, -76, "#ffd0a8", BX);
        I.label(c, (X0 + X1) / 2 - 10, I.D, Z0, "차가운 심층류", 16, 84, "#bfe3ff", BX);
        K.warn(c, 16, H - 12, "⚠ 세계의 바다를 한 줄로 편 개념도 · 깊이는 과장", "left");
      });
      /* 벨트 위 물 알갱이 (아주 느린 흐름도 보이게 속도를 줄여 보여 줌) */
      for (var i = 0; i < 34; i++) {
        var p = pt(i / 34 + t * 0.0016 * Math.log(1 + vv)), q = I.P(p.x, I.D, p.z);
        K.glow(ctx, q.x, q.y, 3, p.warm ? "rgba(255,179,92,.95)" : "rgba(127,211,255,.95)", 2.8);
      }
      [[X0, Z1 - 10, X0, Z0 + 14], [X1, Z0 + 10, X1, Z1 - 14], [X1 - 40, Z1, X1 - 110, Z1], [X0 + 70, Z0, X0 + 140, Z0]].forEach(function (a, k) {
        arr(ctx, I.P(a[0], I.D, a[1]), I.P(a[2], I.D, a[3]), k === 1 || k === 2 ? "#ff8a3d" : "#4dabf7", 4, 13);
      });
      /* 계산 */
      var tg = vv >= 100 ? "표층 해류 수준" : (vv <= 0.3 ? "심층 순환 수준" : "");
      var tS = yr < 1 ? (yr * 12).toFixed(1) + " 개월" : (yr < 10 ? yr.toFixed(1) + " 년" : Math.round(yr).toLocaleString() + " 년");
      var vS = (vv < 1 ? vv.toFixed(2) : vv.toFixed(1)) + " cm/s";
      bigHead(ctx, "한 바퀴 " + tS, "유속 " + vS + (tg ? " · " + tg : ""), yr >= 500 ? "#bfe3ff" : (vv >= 150 ? "#ffd0a8" : "#ffffff"), 18, 42);
      /* ── 오른쪽 흰 카드 ── */
      var RX = 574, RW = W - RX - 12, x0 = RX + 18, x1 = W - 30;
      K.card(ctx, RX, 12, RW, H - 24, "걸리는 시간 = 길이 ÷ 유속");
      K.row(ctx, "벨트 길이", "약 40,000 km", x0, x1, 66);
      K.row(ctx, "유속", vS, x0, x1, 92, LT.blue);
      K.row(ctx, "한 바퀴", tS, x0, x1, 118, yr >= 500 ? LT.violet : LT.orange);
      /* 로그 눈금 속도 막대: 0.1 ~ 200 cm/s */
      var gx = x0 + 4, gw = x1 - x0 - 8, gy = 182;
      function LX(val) { return gx + clamp((Math.log(val) / Math.LN10 + 1) / (Math.log(200) / Math.LN10 + 1), 0, 1) * gw; }
      ctx.fillStyle = "rgba(28,126,214,.14)"; ctx.fillRect(LX(0.1), gy - 8, LX(1) - LX(0.1), 26);
      ctx.fillStyle = "rgba(232,89,12,.14)"; ctx.fillRect(LX(100), gy - 8, LX(200) - LX(100), 26);
      K.bar(ctx, gx, gy, gw, (LX(vv) - gx) / gw, vv >= 100 ? LT.orange : LT.blue);
      ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(LX(vv), gy + 5, 7, 0, 6.2832); ctx.fill(); ctx.strokeStyle = LT.ink; ctx.lineWidth = 2; ctx.stroke();
      [0.1, 1, 10, 100].forEach(function (m) { lt(ctx, String(m), LX(m), gy + 34, { s: 11, a: "center" }); });
      lt(ctx, "cm/s (로그 눈금)", x1, gy + 52, { s: 10.5, a: "right" });
      lt(ctx, "심층류", (LX(0.1) + LX(1)) / 2, gy - 14, { s: 11.5, a: "center", c: LT.blue, w: "800" });
      lt(ctx, "걸프 해류", (LX(100) + LX(200)) / 2 - 8, gy - 14, { s: 11.5, a: "center", c: LT.orange, w: "800" });
      K.tip(ctx, vv >= 150 ? "1년도 안 걸립니다 · 표층 해류의 세계" : (yr >= 500 ? "수백 년 · 심층 순환의 세계" : "유속을 양 끝으로 밀어 견주어 보세요"), x0 - 6, 258, RW - 24, vv >= 150 || yr >= 500 ? true : null);
      lt(ctx, "표층 해류(걸프 해류)는 1초에 1~2 m,", x0, 320, { s: 11.5 });
      lt(ctx, "심층류는 1초에 1 cm도 못 가는 곳이 많습니다.", x0, 340, { s: 11.5 });
      lt(ctx, "40,000 km = 4,000,000,000 cm", x0, 372, { s: 11.5, c: LT.ink });

      $("b-belt-read").innerHTML =
        "<span class='k'>유속</span><span class='v b'>" + (vv < 1 ? vv.toFixed(2) : vv.toFixed(1)) + " cm/s</span>" +
        "<span class='k'>한 바퀴</span><span class='v y'>" + tS + "</span>" +
        "<span class='sub'>시간 = 4,000,000,000 cm ÷ 유속</span>" +
        (tg ? "<span class='ok g'>" + tg + "</span>" : "");

      var ch = false;
      if (vv >= 150 && !got.a) { got.a = ch = true; }
      if (yr >= 500 && !got.b) { got.b = ch = true; }
      if (ch) { window.sthState("bBelt", got); mission(); }

      $("b-belt-info").innerHTML = "같은 벨트라도 <b>유속이 다르면 걸리는 시간이 완전히 달라집니다.</b> " +
        (vv >= 150 ? "이 속도라면 1년도 안 걸립니다 — 표층 해류의 세계입니다." :
          (yr >= 500 ? "이 속도라면 수백 년이 걸립니다 — 심층 순환의 세계입니다. 지금 바닥을 흐르는 물은 수백 년 전 그린란드에서 가라앉은 물일 수 있습니다." :
            "유속을 양 끝으로 밀어 두 세계를 견주어 보세요."));
    }
    function mission() {
      if (got.a) done("m2-3a"); if (got.b) done("m2-3b");
      if (got.a && got.b) {
        window.sthMission("m2-3", true, "<span class='m-tag'>미션 완료</span>같은 벨트인데 한쪽은 <b>1년 미만</b>, 다른 쪽은 <b>수백 년</b>. ‘컨베이어 벨트’는 비유일 뿐, 표층과 심층의 속도는 견줄 수 없을 만큼 다릅니다.");
        ep.clear(2);
      }
    }
    canvas._redraw = draw;
    $("b-v").addEventListener("input", function (e) {
      i0 = +e.target.value;
      var vv = vel(i0);
      $("b-v-val").textContent = (vv < 1 ? vv.toFixed(2) : vv.toFixed(1)) + " cm/s";
      draw();
    });
    draw(); mission();
    var playB = playBtn("b-belt-play");
    anim(canvas, function (dt) { if (playB.on) { t += dt / 70; draw(); } });
  })();

  /* ---- 장면4 우리나라 주변 해류 ---- */
  (function () {
    var canvas = $("b-c-kor"), ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var warm = 50, show = { warm: true, cold: true, front: false };
    var got = window.sthState("bKor") || { a: false, b: false, c: false };
    function frontLat() { return 37.0 + 0.03 * warm; }

    /* 위도 33°~43°를 세로로 편 모식 지도 */
    function YL(lat) { return 430 - (lat - 32) / 11 * 360; }

    var CUR = [
      { n: "쿠로시오 해류", type: "warm", x: 560, y1: 33.5, y2: 36.0, d: "우리나라 주변 난류의 근원. 저위도에서 고위도로 흐르는 강한 난류입니다." },
      { n: "대마 난류", type: "warm", x: 480, y1: 34.0, y2: 37.0, d: "쿠로시오에서 갈라져 대한해협을 지나 동해로 들어옵니다." },
      { n: "동한 난류", type: "warm", x: 430, y1: 36.0, y2: 40.0, d: "대마 난류의 일부가 동해안을 따라 북상합니다." },
      { n: "황해 난류", type: "warm", x: 250, y1: 34.0, y2: 38.5, d: "쿠로시오의 일부가 황해로 들어와 북상하는, 세력이 약한 난류입니다." },
      { n: "북한 한류", type: "cold", x: 455, y1: 42.0, y2: 37.5, d: "고위도에서 동해안을 따라 남하하여 동한 난류와 맞부딪칩니다." },
      { n: "리만 해류", type: "cold", x: 520, y1: 43.0, y2: 39.0, d: "연해주 방면에서 남하하는 한류로 동해 북부의 수온을 낮춥니다." }
    ];

    var tk = 0;
    /* 블록 모형: 한반도 주변 바다(동경 120°~136°, 북위 30.5°~44°)를 잘라 낸 블록. x = 경도(동쪽 = 오른쪽 아래), y = 위도(북쪽 = 오른쪽 위).
       윗면 = 땅 높낮이와 해수면 수온(조경수역 남쪽은 따뜻하고 북쪽은 차갑다), 해수면 위 리본 = 해류. 앞면·오른쪽 면 = 바다 단면(황해는 얕고 동해는 깊다). */
    var LON0 = 120, LON1 = 136, LAT0 = 30.5, LAT1 = 44, ZS = 34;
    var I = K.iso({ ox: 330, oy: 122, s: 0.74, L: 400, D: 420 });
    function GX(lon) { return (lon - LON0) / (LON1 - LON0) * I.L; }
    function GY(lat) { return (LAT1 - lat) / (LAT1 - LAT0) * I.D; }
    var POLY = [
      /* 한반도 */ [[124.4, 39.9], [125.1, 39.6], [125.4, 38.7], [124.9, 38.1], [126.1, 37.7], [126.7, 37.1], [126.2, 36.6], [126.6, 35.9], [126.3, 35.1], [126.2, 34.5], [126.9, 34.4], [127.6, 34.6], [128.4, 34.8], [129.1, 35.1], [129.5, 35.6], [129.5, 36.2], [129.4, 37.0], [129.0, 37.7], [128.4, 38.5], [127.6, 39.3], [127.9, 39.9], [128.8, 40.6], [129.7, 40.9], [129.8, 41.6], [130.6, 42.3], [129.7, 42.5], [128.2, 41.9], [126.5, 41.6], [125.0, 40.4]],
      /* 중국 동북·연해주 */ [[120, 40.9], [121.0, 40.6], [121.6, 40.0], [121.2, 38.8], [122.0, 39.2], [123.3, 39.7], [124.4, 39.9], [125.0, 40.4], [126.5, 41.6], [128.2, 41.9], [129.7, 42.5], [130.6, 42.3], [131.2, 42.6], [132.3, 43.2], [133.5, 42.8], [135.0, 43.6], [136.2, 44.2], [136.2, 44.6], [120, 44.6]],
      /* 중국 동부·산둥 */ [[119.8, 30.3], [122.0, 30.3], [121.9, 31.0], [121.9, 31.7], [120.9, 32.3], [120.9, 33.5], [120.3, 34.4], [119.4, 35.0], [119.6, 35.6], [120.3, 36.0], [120.7, 36.4], [121.5, 36.8], [122.6, 37.3], [122.4, 37.5], [121.5, 37.6], [120.7, 37.8], [119.8, 37.4]],
      /* 일본(규슈·시코쿠·혼슈 서부) */ [[129.6, 33.3], [130.0, 33.8], [130.9, 33.95], [131.0, 34.3], [131.4, 34.45], [132.2, 35.0], [133.0, 35.5], [134.2, 35.6], [135.3, 35.6], [135.9, 35.9], [136.2, 36.1], [136.2, 33.6], [135.2, 33.5], [134.8, 34.2], [134.2, 33.3], [133.1, 32.7], [132.5, 33.0], [132.0, 32.8], [131.7, 32.0], [131.3, 31.3], [130.7, 31.0], [130.2, 31.3], [130.3, 32.0], [129.8, 32.7]]
    ];
    var ISLE = [[126.55, 33.38, 0.36, 0.13], [129.3, 34.4, 0.12, 0.3], [130.87, 37.5, 0.06, 0.05]];   /* 제주도·쓰시마·울릉도 */
    function inPoly(P, x, y) {
      var c = false;
      for (var i = 0, j = P.length - 1; i < P.length; j = i++) {
        var a = P[i], b = P[j];
        if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c;
      }
      return c;
    }
    function isLand(lon, lat) {
      for (var i = 0; i < POLY.length; i++) if (inPoly(POLY[i], lon, lat)) return true;
      for (var k = 0; k < ISLE.length; k++) { var q = ISLE[k], dx = (lon - q[0]) / q[2], dy = (lat - q[1]) / q[3]; if (dx * dx + dy * dy < 1) return true; }
      return false;
    }
    var ZM = {};
    function zLand(x, y) {
      var key = Math.round(x * 10) + "," + Math.round(y * 10);
      if (ZM[key] != null) return ZM[key];
      var lon = LON0 + x / I.L * (LON1 - LON0), lat = LAT1 - y / I.D * (LAT1 - LAT0), z = 0;
      if (isLand(lon, lat)) {
        var n = 0, m = 0;
        [0.3, 0.7].forEach(function (r) { for (var a = 0; a < 8; a++) { m++; if (isLand(lon + r * Math.cos(a * .785), lat + r * Math.sin(a * .785))) n++; } });
        var f = n / m;
        z = ZS + 2 + 15 * Math.pow(f, 1.6) * (0.86 + 0.14 * Math.sin(lon * 3.3) * Math.cos(lat * 2.9));
        if (lon > 127.3 && lon < 129.6 && lat > 36 && lat < 39.6) z += 7 * f;   /* 태백산맥 */
      }
      ZM[key] = z; return z;
    }
    function zTop(x, y) { return Math.max(ZS, zLand(x, y)); }
    /* 바다 바닥(단면용): 황해·동중국해 대륙붕은 얕고, 동해·태평양은 깊다 */
    function seabed(lon, lat) {
      if (lon < 127.5 || (lat < 34.6 && lon < 129.2)) return ZS - 7;
      if (lat < 34.3 && lon < 130) return ZS - 14;
      return 7;
    }
    function seaT(lon, lat, fl) {
      if (lon > 128.6 && lat > 34.9) { var u = (lat - (fl - 0.6)) / 1.2; return lerp4(17, 6, clamp(u, 0, 1)); }
      if (lon < 127.2) return 11 + (37.5 - lat) * 1.6;
      return 15 + (34 - lat) * 1.8;
    }
    function lerp4(a, b, u) { u = u * u * (3 - 2 * u); return a + (b - a) * u; }
    var paintK = cache(canvas, W, H);
    function paintBase(c, fl) {
      var fc = I.P(I.L / 2, I.D / 2, 0);
      K.studio(c, 0, 0, W, H, { x: fc.x, y: fc.y + 30, rx: 320, ry: 90 });
      I.field(c, zTop, function (x, y, z, l) {
        var lon = LON0 + x / I.L * (LON1 - LON0), lat = LAT1 - y / I.D * (LAT1 - LAT0);
        if (z > ZS + 0.4) { var h = z - ZS; return h < 3 ? K.tint("#cdbf8e", l) : (h < 12 ? K.tint("#7fa35a", l) : (h < 19 ? K.tint("#6b8a48", l) : K.tint("#9a8a64", l))); }
        return tCol(seaT(lon, lat, fl), 0.98 + 0.04 * Math.sin(x / 13 + y / 17));
      }, 80, 84);
      ["front", "right"].forEach(function (side) {
        I.face(c, side, function (Lw) {
          function ground(u) { return side === "front" ? zLand(Math.min(u, I.L - .1), I.D - .1) : zLand(I.L - .1, Math.min(u, I.D - .1)); }
          function bed(u) {
            var lon = side === "front" ? LON0 + u / I.L * (LON1 - LON0) : LON1, lat = side === "front" ? LAT0 : LAT1 - u / I.D * (LAT1 - LAT0);
            var g0 = ground(u); return g0 > 0 ? g0 : seabed(lon, lat);
          }
          var g = c.createLinearGradient(0, 0, 0, ZS); g.addColorStop(0, "#0a2350"); g.addColorStop(1, "#2f86c4");
          c.fillStyle = g; c.fillRect(0, 0, Lw, ZS);
          I.profile(c, side, bed, 0);
          var rg = c.createLinearGradient(0, 0, 0, ZS + 20); rg.addColorStop(0, "#3e3128"); rg.addColorStop(1, "#8c6c48");
          c.fillStyle = rg; c.fill();
        });
      });
      I.shade(c, "front", function (u) { return Math.max(ZS, zLand(Math.min(u, I.L - .1), I.D - .1)); });
      I.shade(c, "right", function (u) { return Math.max(ZS, zLand(I.L - .1, Math.min(u, I.D - .1))); });
      I.edges(c, ZS, ZS);
      function at(lon, lat) { return I.P(GX(lon), GY(lat), zTop(GX(lon), GY(lat)) + 2); }
      var p;
      p = at(127.4, 38.2); K.pill(c, "한반도", p.x, p.y, { s: 12, a: "center", c: "#e2f2cf" });
      p = at(131.8, 40.2); K.pill(c, "동해", p.x, p.y, { s: 13, a: "center", c: "#cfe8ff" });
      p = at(123.0, 36.6); K.pill(c, "황해", p.x, p.y, { s: 13, a: "center", c: "#cfe8ff" });
      p = at(133.6, 34.9); K.pill(c, "일본", p.x, p.y, { s: 11.5, a: "center", c: "#e2f2cf" });
      /* 북쪽 표시 */
      var nd = I.P(0, -40, 0), nz = I.P(0, 0, 0), n0 = { x: 590, y: 420 }, n1 = { x: 590 + nd.x - nz.x, y: 420 + nd.y - nz.y }; arr(c, n0, n1, "#12203a", 2.4, 10);
      K.pill(c, "북", n1.x + 8, n1.y + 2, { s: 11, c: "#ffffff" });
      K.warn(c, 16, H - 12, "⚠ 해류 굵기·길이와 높이는 모식적", "left");
    }
    /* 해류 길: 경도·위도 점들 */
    function paths(fl) {
      return [
        { n: "쿠로시오 해류", type: "warm", pts: [[126.4, 30.7], [128.6, 30.8], [130.6, 30.6], [132.6, 31.6], [134.6, 32.6], [135.9, 33.1]], lab: [133.4, 31.9, 0, 30] },
        { n: "대마 난류", type: "warm", pts: [[128.6, 31.0], [128.9, 32.6], [129.4, 34.0], [130.1, 35.2], [131.4, 36.3], [133.6, 37.4]], lab: [129.0, 32.4, -60, 4] },
        { n: "동한 난류", type: "warm", pts: [[129.5, 35.4], [129.8, 36.6], [130.0, 37.4], [130.1, fl - 0.35], [131.2, fl - 0.1], [132.6, fl + 0.1]], lab: [130.0, 37.0, 18, 22] },
        { n: "황해 난류", type: "warm", pts: [[125.6, 31.6], [124.8, 33.4], [124.2, 35.2], [123.9, 36.4 + 0.02 * warm]], lab: [124.6, 33.8, -30, 18] },
        { n: "북한 한류", type: "cold", pts: [[130.3, 41.6], [129.6, 40.6], [129.1, 39.6], [129.0, Math.max(fl + 0.25, 38.0)]], lab: [129.6, 40.6, 26, -6] },
        { n: "리만 해류", type: "cold", pts: [[135.8, 43.7], [133.6, 42.9], [131.7, 42.4], [130.6, 41.8]], lab: [133.6, 42.9, 14, -14] }
      ];
    }
    function draw() {
      var fl = frontLat();
      paintK(ctx, Math.round(fl * 20), function (c) { paintBase(c, fl); });
      var BX = [0, 640];
      /* 조경수역 */
      if (show.front) {
        var f0 = I.P(GX(129.8), GY(fl), ZS + 1), f1 = I.P(GX(135.9), GY(fl), ZS + 1);
        ctx.save(); ctx.shadowColor = "#0f9f76"; ctx.shadowBlur = 8; ctx.strokeStyle = "#20c997"; ctx.setLineDash([9, 5]); ctx.lineWidth = 3.4;
        ctx.beginPath(); ctx.moveTo(f0.x, f0.y); ctx.lineTo(f1.x, f1.y); ctx.stroke(); ctx.setLineDash([]); ctx.restore();
        var R = K.rng(9);
        for (var f = 0; f < 22; f++) { var q = I.P(GX(130 + R() * 5.8), GY(fl + (R() - .5) * 0.7), ZS + 1); ctx.globalAlpha = .55 + .4 * Math.sin(tk * .15 + f); K.glow(ctx, q.x, q.y, 1.5, "rgba(80,230,170,.95)", 3); }
        ctx.globalAlpha = 1;
        K.pill(ctx, "조경수역 · 플랑크톤 · 좋은 어장", f1.x + 6, f1.y - 12, { s: 12, a: "right", c: "#9ff0cf", box: BX });
      }
      /* 해류 리본 */
      var P = paths(fl), labs = [];
      P.forEach(function (c) {
        if ((c.type === "warm" && !show.warm) || (c.type === "cold" && !show.cold)) return;
        var sp = c.pts.map(function (q) { return I.P(GX(q[0]), GY(q[1]), ZS + 2); });
        var strong = c.type === "warm" ? 0.5 + warm / 100 : 1.5 - warm / 100;
        var col = c.type === "warm" ? "#f03e3e" : "#1c7ed6", wv = 2.4 + 2.6 * strong;
        ctx.save(); ctx.lineJoin = "round"; ctx.lineCap = "round";
        ctx.beginPath(); sp.forEach(function (p, i) { if (i) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y); });
        ctx.strokeStyle = "rgba(255,255,255,.85)"; ctx.lineWidth = wv + 5; ctx.stroke();
        ctx.strokeStyle = col; ctx.lineWidth = wv; ctx.stroke(); ctx.restore();
        var a = sp[sp.length - 2], b = sp[sp.length - 1]; arr(ctx, a, b, col, 1, 10 + 3 * strong);
        /* 흐르는 물 알갱이 */
        var len = [0], i;
        for (i = 1; i < sp.length; i++) len.push(len[i - 1] + Math.hypot(sp[i].x - sp[i - 1].x, sp[i].y - sp[i - 1].y));
        for (var k = 0; k < 5; k++) {
          var tl = ((k / 5 + tk * 0.012 * (0.6 + strong * 0.4)) % 1) * len[len.length - 1], j = 1;
          while (j < len.length - 1 && len[j] < tl) j++;
          var u = (tl - len[j - 1]) / Math.max(1e-6, len[j] - len[j - 1]);
          ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(sp[j - 1].x + (sp[j].x - sp[j - 1].x) * u, sp[j - 1].y + (sp[j].y - sp[j - 1].y) * u, 2.2, 0, 6.2832); ctx.fill();
        }
        labs.push(c);
      });
      labs.forEach(function (c) {
        var p = I.P(GX(c.lab[0]), GY(c.lab[1]), ZS + 2);
        K.pill(ctx, c.n, p.x + c.lab[2], p.y + c.lab[3], { s: 11.5, a: c.lab[2] < 0 ? "right" : (c.lab[2] === 0 ? "center" : "left"), c: c.type === "warm" ? "#ffb3b3" : "#a9dcff", box: BX });
      });
      var season = warm >= 70 ? "여름철 — 난류 우세" : (warm <= 30 ? "겨울철 — 한류 우세" : "봄·가을 수준");
      bigHead(ctx, "조경수역 북위 " + fl.toFixed(1) + "°", season, "#ffffff", 18, 42);

      /* ── 오른쪽 흰 카드: 힘겨루기 ── */
      var RX = 648, RW = W - RX - 12, x0 = RX + 18, x1 = W - 30;
      K.card(ctx, RX, 96, RW, 330, "힘겨루기");
      lt(ctx, "동한 난류 세력", x0, 150, { s: 12 });
      K.t(ctx, warm + "%", x0, 186, { s: 30, w: "900", c: LT.red });
      ctx.fillStyle = "#a9d4f5"; ctx.beginPath(); ctx.roundRect(x0, 200, x1 - x0, 12, 6); ctx.fill();
      ctx.fillStyle = "#f03e3e"; ctx.beginPath(); ctx.roundRect(x0, 200, Math.max(6, (x1 - x0) * warm / 100), 12, 6); ctx.fill();
      lt(ctx, "난류", x0, 230, { s: 11, c: LT.red, w: "800" }); lt(ctx, "한류", x1, 230, { s: 11, a: "right", c: LT.blue, w: "800" });
      K.row(ctx, "조경수역", "북위 " + fl.toFixed(1) + "°", x0, x1, 266, LT.green);
      K.tip(ctx, season, x0 - 4, 282, RW - 28, warm >= 70 || warm <= 30 ? true : null);
      lt(ctx, "난류와 한류가 만나면 플랑크톤이", x0, 342, { s: 11.5 });
      lt(ctx, "많아져 좋은 어장이 섭니다.", x0, 360, { s: 11.5 });
      lt(ctx, "조경수역 단추를 켜면 경계가 보입니다", x0, 396, { s: 10.5, c: LT.dim });

      var ch = false;
      if (fl >= 39.0 && !got.a) { got.a = ch = true; }
      if (fl <= 37.5 && !got.b) { got.b = ch = true; }
      if (ch) { window.sthState("bKor", got); mission(); }

      $("b-kor-info").innerHTML = "동해에서는 남쪽에서 올라온 <b>동한 난류</b>와 북쪽에서 내려온 <b>북한 한류</b>가 맞부딪칩니다. 그 경계가 <b>조경수역</b>이고, 난류가 강한 여름에는 북쪽으로, 한류가 강한 겨울에는 남쪽으로 이동합니다.";
    }
    function mission() {
      if (got.a) done("m2-4a"); if (got.b) done("m2-4b"); if (got.c) done("m2-4c");
      if (got.a && got.b && got.c) {
        window.sthMission("m2-4", true, "<span class='m-tag'>미션 완료</span>조경수역은 고정된 선이 아니라 <b>두 해류의 힘겨루기가 정하는 경계</b>입니다. 계절에 따라 남북으로 오르내립니다.");
        ep.clear(3);
      }
    }
    canvas._redraw = draw;
    $("b-warm").addEventListener("input", function (e) { warm = +e.target.value; $("b-warm-val").textContent = warm + "%"; draw(); });
    Array.prototype.forEach.call($("b-show").querySelectorAll("button"), function (b) {
      b.addEventListener("click", function () {
        var k = b.getAttribute("data-show");
        show[k] = !show[k]; b.classList.toggle("on", show[k]); draw();
      });
    });
    draw();
    var playK = playBtn("b-kor-play");
    anim(canvas, function (dt) { if (playK.on) { tk += dt / 70; draw(); } });

    window.sthSort({
      mount: "b-sort",
      buckets: [{ id: "w", label: "난류", sub: "저위도 → 고위도 · 수온과 염분이 높다" }, { id: "c", label: "한류", sub: "고위도 → 저위도 · 수온이 낮고 산소가 많다" }],
      items: [
        { t: "쿠로시오 해류", a: "w", why: "우리나라 주변 난류의 근원입니다." },
        { t: "대마 난류", a: "w", why: "쿠로시오에서 갈라져 동해로 들어옵니다." },
        { t: "동한 난류", a: "w", why: "동해안을 따라 북상하는 난류입니다." },
        { t: "황해 난류", a: "w", why: "황해로 들어와 북상하는 세력이 약한 난류입니다.", hint: "쿠로시오에서 갈라져 나온 물입니다." },
        { t: "북한 한류", a: "c", why: "고위도에서 동해안을 따라 남하합니다." },
        { t: "리만 해류", a: "c", why: "연해주 방면에서 남하하는 한류입니다.", hint: "동해 북쪽에서 내려옵니다." }
      ],
      onDone: function () { got.c = true; window.sthState("bKor", got); mission(); }
    });
    mission();
  })();

  /* ---- 장면5 연안 용승 ---- */
  (function () {
    var canvas = $("b-c-up"), ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var az = 90, hemi = "N", t = 0;
    var got = window.sthState("bUp") || { a: false, b: false, c: false };

    function ekAz() { return ((az + (hemi === "N" ? 90 : -90)) % 360 + 360) % 360; }
    function offshore() { return Math.sin(ekAz() * Math.PI / 180); }   /* +면 바다(동)쪽 */

    /* 블록 모형: 남북으로 뻗은 해안을 잘라 낸 블록. x = 서(육지) → 동(바다), y = 북(뒤) → 남(앞).
       앞면 = 해안 단면(수온 약층이 해안 쪽에서 솟거나 내려간다), 윗면 = 해수면 수온(용승이면 해안 쪽 찬물 띠), 위에 바람·수송 화살표 */
    var I = K.iso({ ox: 250, oy: 200, s: 0.8, L: 380, D: 200 }), ZS = 116, XC = 108;
    var paintU = cache(canvas, W, H);
    function ground(x) { return x < XC - 14 ? ZS + 16 + 6 * Math.sin(x / 13) : (x < XC ? ZS + 16 - (x - XC + 14) * 1.6 : Math.max(10, ZS - 8 - (x - XC) * 1.5)); }
    function thermo(u, mode) {
      var base = ZS - 34, e = Math.exp(-Math.max(0, u - XC) / 70);
      return mode === "up" ? Math.min(ZS - 2, base + 40 * e) : (mode === "down" ? base - 42 * e : base);
    }
    function wv3(a) { var r = a * Math.PI / 180; return { x: Math.sin(r), y: -Math.cos(r) }; }
    function paintBase(c, mode) {
      var fc = I.P(I.L / 2, I.D / 2, 0);
      K.studio(c, 0, 0, W, H, { x: fc.x, y: fc.y + 20, rx: 280, ry: 70 });
      ["front", "right"].forEach(function (side) {
        I.face(c, side, function (Lw) {
          var u;
          if (side === "front") {
            var dg = c.createLinearGradient(0, 0, 0, ZS); dg.addColorStop(0, "#0a2350"); dg.addColorStop(1, "#2a6fb0");
            c.fillStyle = dg; c.fillRect(0, 0, Lw, ZS);
            c.beginPath(); c.moveTo(0, ZS); c.lineTo(Lw, ZS); for (u = Lw; u >= 0; u -= 4) c.lineTo(u, thermo(u, mode)); c.closePath();
            var wg = c.createLinearGradient(0, ZS - 50, 0, ZS); wg.addColorStop(0, "#3fa7c9"); wg.addColorStop(1, "#f2c46a");
            c.fillStyle = wg; c.fill();
            c.strokeStyle = "rgba(255,255,255,.85)"; c.lineWidth = 1.6; c.setLineDash([6, 4]);
            c.beginPath(); for (u = XC; u <= Lw; u += 4) c.lineTo(u, thermo(u, mode)); c.stroke(); c.setLineDash([]);
            I.profile(c, "front", ground, 0);
          } else {
            var dg2 = c.createLinearGradient(0, 0, 0, ZS); dg2.addColorStop(0, "#081b40"); dg2.addColorStop(1, "#225e98");
            c.fillStyle = dg2; c.fillRect(0, 0, Lw, ZS);
            c.fillStyle = mix("#3fa7c9", "#f2c46a", 0.6, 0.85); c.fillRect(0, thermo(I.L, mode), Lw, ZS - thermo(I.L, mode));
            c.beginPath(); c.rect(0, 0, Lw, ground(I.L));
          }
          var rg = c.createLinearGradient(0, 0, 0, ZS + 20); rg.addColorStop(0, "#3e3128"); rg.addColorStop(1, "#8c6c48");
          c.fillStyle = rg; c.fill();
        });
      });
      I.shade(c, "front", function (u) { return Math.max(ZS, ground(u)); });
      I.shade(c, "right", function () { return ZS; });
      /* 윗면: 땅 + 바다(해안 쪽 띠 색은 용승·침강에 따라) */
      I.top(c, function (u) { return Math.max(ZS, ground(u)); }, function (k, u) {
        if (ground(u) > ZS) return u < XC - 14 ? K.tint("#7fa35a", 1 + 0.06 * Math.sin(u)) : "#8c7350";
        var e = Math.exp(-(u - XC) / 60);
        return mode === "up" ? mix("#4aa3d8", "#9ad7e8", e) : (mode === "down" ? mix("#4aa3d8", "#f2c46a", e * 0.8) : "#4aa3d8");
      }, 60);
      I.edges(c, ZS, ZS);
      /* 해안 마을과 나무 */
      [[30, 40], [60, 120], [24, 160], [70, 30]].forEach(function (q, i) { if (i % 2) I.house(c, q[0], q[1], ground(q[0]), 12, 10, 8); else I.tree(c, q[0], q[1], ground(q[0]), 1.1); });
      [[40, 80], [80, 170], [18, 110]].forEach(function (q) { I.tree(c, q[0], q[1], ground(q[0]), 1); });
      var BX = [0, 540];
      I.label(c, 40, I.D, ground(40), "육지", -20, 30, "#e2f2cf", BX);
      I.label(c, I.L - 60, 40, ZS, "바다 (동쪽)", 18, -26, "#cfe8ff", BX);
      K.warn(c, 16, H - 12, "⚠ 깊이·화살표는 모식적", "left");
    }
    function draw() {
      var ek = ekAz(), off = offshore(), mode = off >= 0.5 ? "up" : (off <= -0.5 ? "down" : "none");
      paintU(ctx, mode, function (c) { paintBase(c, mode); });
      var i, BX = [0, 540];
      /* 앞면 흐름 */
      if (mode !== "none") {
        var up = mode === "up";
        arr(ctx, I.P(up ? XC + 40 : XC + 210, I.D, ZS - 10), I.P(up ? XC + 210 : XC + 40, I.D, ZS - 10), "#ffffff", 7, 15);
        arr(ctx, I.P(up ? XC + 40 : XC + 210, I.D, ZS - 10), I.P(up ? XC + 210 : XC + 40, I.D, ZS - 10), "#e03131", 4.5, 13);
        for (i = 0; i < 3; i++) {
          var xx = XC + 84 + i * 30, za = up ? 26 : ZS - 22, zb = up ? ZS - 22 : 26;
          arr(ctx, I.P(xx, I.D, za), I.P(xx, I.D, zb), up ? "#a5d8ff" : "#ffc078", 3, 10);
        }
        for (var j = 0; j < 10; j++) {
          var ph = ((t * 0.04) + j / 10) % 1, zz = up ? 26 + ph * (ZS - 50) : ZS - 22 - ph * (ZS - 50);
          var pp = I.P(XC + 96 + (j % 3) * 30, I.D, zz); K.glow(ctx, pp.x, pp.y, 2.2, up ? "rgba(165,216,255,.95)" : "rgba(255,192,120,.95)", 2.6);
        }
        I.label(ctx, XC + 150, I.D, ZS - 10, up ? "표층수가 바다 쪽으로 빠져나감" : "표층수가 해안 쪽으로 쌓임", 30, 60, "#ffb3b3", BX);
        I.label(ctx, XC + 110, I.D, up ? 40 : ZS - 40, up ? "찬 심층수 상승 · 연안 용승" : "표층수 하강 · 연안 침강", -30, 86, up ? "#a5d8ff" : "#ffc078", BX);
      }
      /* 수면 위: 바람(노랑)과 순 수송(빨강) */
      var cx = 250, cy = 100, wv = wv3(az), ev = wv3(ek);
      var w0 = I.P(cx, cy, ZS + 52), w1 = I.P(cx + wv.x * 80, cy + wv.y * 80, ZS + 52);
      var e0 = I.P(cx, cy, ZS + 1), e1 = I.P(cx + ev.x * 80, cy + ev.y * 80, ZS + 1);
      ctx.strokeStyle = "rgba(245,159,0,.5)"; ctx.setLineDash([3, 4]); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(w0.x, w0.y); ctx.lineTo(e0.x, e0.y); ctx.stroke(); ctx.setLineDash([]);
      arr(ctx, e0, e1, "#ffffff", 9, 18); arr(ctx, e0, e1, "#e03131", 5.5, 15);
      arr(ctx, w0, w1, "#ffffff", 9, 18); arr(ctx, w0, w1, "#f59f00", 5.5, 15);
      if (!REDUCE) for (i = 0; i < 4; i++) { var su = (t * 0.03 + i / 4) % 1, sp = I.P(cx + wv.x * 80 * su - wv.y * 14, cy + wv.y * 80 * su + wv.x * 14, ZS + 52); K.glow(ctx, sp.x, sp.y, 1.8, "rgba(255,230,150,.95)", 2.4); }
      K.pill(ctx, "━ 바람 (수면 위)", 18, 106, { s: 12, c: "#ffd35a" });
      K.pill(ctx, "━ 표층 에크만 수송", 18, 132, { s: 12, c: "#ffb3b3" });
      var nd = I.P(0, -40, 0), nz = I.P(0, 0, 0), n0 = { x: 488, y: 410 }, n1 = { x: 488 + nd.x - nz.x, y: 410 + nd.y - nz.y }; arr(ctx, n0, n1, "#12203a", 2.4, 10);
      K.pill(ctx, "북", n1.x + 8, n1.y + 2, { s: 11, c: "#ffffff", box: BX });
      var res = mode === "up" ? "연안 용승" : (mode === "down" ? "연안 침강" : "용승도 침강도 없음");
      bigHead(ctx, res, "바람 " + azName(az) + "쪽 · " + (hemi === "N" ? "북반구" : "남반구") + " → 수송 " + azName(ek) + "쪽", mode === "up" ? "#a5d8ff" : (mode === "down" ? "#ffc078" : "#ffffff"), 18, 42);

      /* ── 오른쪽 흰 판정 카드 ── */
      var RX = 552, RW = W - RX - 12, x0 = RX + 18, x1 = W - 30;
      K.card(ctx, RX, 12, RW, H - 24, "판정");
      K.t(ctx, res, x0, 74, { s: 23, w: "900", c: mode === "up" ? LT.blue : (mode === "down" ? LT.orange : LT.mute) });
      K.row(ctx, "바람이 부는 쪽", azName(az) + "쪽 (" + az + "°)", x0, x1, 110, "#d9480f");
      K.row(ctx, "반구", hemi === "N" ? "북반구 · 오른쪽 90°" : "남반구 · 왼쪽 90°", x0, x1, 134);
      K.row(ctx, "순 수송", azName(ek) + "쪽 (" + ek + "°)", x0, x1, 156, LT.red);
      K.row(ctx, "수송 방향", off >= 0.5 ? "바다 쪽" : (off <= -0.5 ? "해안 쪽" : "해안과 나란히"), x0, x1, 182, LT.ink);
      /* 작은 나침반: 해안(서쪽)과 두 화살표 */
      var ccx = RX + RW / 2, ccy = 268, R = 58;
      lcompass(ctx, ccx, ccy, R, [az, ek]);
      ctx.save(); ctx.beginPath(); ctx.arc(ccx, ccy, R - 1, 0, 6.2832); ctx.clip(); ctx.fillStyle = "rgba(127,163,90,.45)"; ctx.fillRect(ccx - R, ccy - R, R * 0.45, 2 * R); ctx.restore();
      arr(ctx, { x: ccx, y: ccy }, { x: ccx + wv.x * R * .9, y: ccy + wv.y * R * .9 }, "#f59f00", 4, 11);
      arr(ctx, { x: ccx, y: ccy }, { x: ccx + ev.x * R * .75, y: ccy + ev.y * R * .75 }, "#e03131", 4, 11);
      K.tip(ctx, mode === "up" ? "✅ 용승 · 영양염이 올라와 좋은 어장" : (mode === "down" ? "✅ 침강 · 따뜻한 물이 쌓인다" : "표층 수송이 해안과 나란합니다"), x0 - 6, 346, RW - 24, mode !== "none" ? true : null);
      lt(ctx, "여름 동해안 남풍 → 냉수대", x0, 400, { s: 11 });

      var ch = false;
      if (hemi === "N" && off >= 0.5 && !got.a) { got.a = ch = true; }
      if (hemi === "N" && off <= -0.5 && !got.b) { got.b = ch = true; }
      if (hemi === "S" && Math.abs(off) >= 0.5 && !got.c) { got.c = ch = true; }
      if (ch) { window.sthState("bUp", got); mission(); }

      $("b-up-info").innerHTML = "해안은 남북으로 뻗어 있고 바다는 동쪽입니다. 에크만 수송이 <b>바다 쪽</b>으로 향하면 빠져나간 표층수를 채우려 <b>찬 심층수가 올라오고(용승)</b>, <b>해안 쪽</b>으로 향하면 표층수가 쌓여 <b>가라앉습니다(침강)</b>. 용승수는 영양염이 풍부해 좋은 어장을 만듭니다.";
    }
    function mission() {
      if (got.a) done("m2-5a"); if (got.b) done("m2-5b"); if (got.c) done("m2-5c");
      if (got.a && got.b && got.c) {
        window.sthMission("m2-5", true, "<span class='m-tag'>미션 완료</span>같은 해안, 같은 바람인데 <b>반구가 바뀌면 결과가 뒤집힙니다.</b> 에크만 수송의 방향이 반대가 되기 때문입니다.");
        ep.clear(4); ep.clear(5);
      }
    }
    canvas._redraw = draw;
    $("b-wd").addEventListener("input", function (e) { az = +e.target.value; $("b-wd-val").textContent = azName(az) + " (" + az + "°)"; draw(); });
    segWire("b-hemi", function (b) { hemi = b.getAttribute("data-h"); $("b-hemi-val").textContent = hemi === "N" ? "북반구" : "남반구"; draw(); });
    draw(); mission();
    var playU = playBtn("b-up-play");
    anim(canvas, function (dt) { if (playU.on) { t += dt / 70; draw(); } });
  })();

  function finish() { window.sthState("r2", "해결 · 침강은 밀도(σt 27.8)가 정한다, 벨트 한 바퀴는 유속에 따라 1년 미만에서 수백 년까지"); }
  function vsB() {
    var p = window.sthState("b-p") || "";
    $("b-vs").innerHTML = "<b>나의 첫 추리</b> " + (p || "기록 없음") + "<br>" +
      (p.indexOf("㉡") === 0 ? "맞았습니다. 계산으로도 확인했지요 — 염분이 33 아래로 내려가면 아무리 차가워져도 무거워지지 못했습니다."
        : "직접 계산해 보니 ㉡ 이었습니다. 담수는 물을 <b>가볍게</b> 만들어 침강을 막습니다.");
  }
  vsB();
  ep.onShow(vsB);
  window.sthWork({
    mount: "wkB", unitLabel: "[지구과학 Ⅰ-1] 이야기 ② 1,000년을 도는 물",
    items: [
      { id: "w2", label: "표층 순환과 심층 순환", hint: "두 순환을 움직이는 힘이 각각 무엇인지, 그리고 두 순환의 속도가 왜 다른지 쓰세요." },
      { id: "b2", label: "빙하가 녹으면 바다는", hint: "그린란드 빙상이 녹아 담수가 늘면 심층 순환이 어떻게 되는지, 밀도·수온·염분을 넣어 설명하세요." }
    ]
  });
})();

/* =========================================================================
   이야기 ③ 일기도 세 장
   ========================================================================= */
(function () {
  var ep = window.sthStory({ root: "epC", key: "epC", name: "사건 파일 ③", onDone: finish });

  window.sthGate({
    gate: "c-gate", key: "c-p", title: "실습생의 첫 추리",
    question: "우리나라 부근의 고기압·저기압은 대체로 어느 쪽으로 이동할까요?",
    options: ["㉠ 동쪽에서 서쪽으로", "㉡ 서쪽에서 동쪽으로", "㉢ 남쪽에서 북쪽으로", "㉣ 거의 제자리에 머문다"],
    onPick: function () { ep.clear(0); }
  });

  /* ---- 장면2 등압선과 지균풍 ---- */
  (function () {
    var canvas = $("c-c-press"), ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var sys = "low", hemi = "N", gap = 500, t = 0;
    var got = window.sthState("cPress") || { a: false, b: false, c: false };
    var DP = 400, RHO = 1.2, F = 8.365e-5;
    function speed(gapKm) { return DP / (RHO * F * gapKm * 1000); }

    /* 블록 모형: 땅 한 판 위에 등압선 고리를 그리고, 그 위 공기 기둥을 투명하게 보여 준다.
       지상 바람(초록)이 돌며 모이고(저기압) 흩어진다(고기압). 가운데는 상승 기류와 구름(저기압) 또는 하강 기류와 맑은 하늘(고기압). */
    var I = K.iso({ ox: 278, oy: 238, s: 0.7, L: 300, D: 300 }), ZG = 14, CX = 150, CY = 150;
    function ringPts(r, z) { var out = []; for (var k = 0; k <= 60; k++) { var a = k / 60 * 6.2832; out.push(I.P(CX + r * Math.cos(a), CY + r * Math.sin(a), z)); } return out; }
    function poly(pts) { ctx.beginPath(); pts.forEach(function (p, i) { if (i) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y); }); }
    var PUFF = (function () { var R = K.rng(17), o = [], i; for (i = 0; i < 26; i++) { var a = R() * 6.283, rr = 30 * Math.sqrt(R()) * (1 - i / 40); o.push([Math.cos(a) * rr, Math.sin(a) * rr, (i / 26) * 60, 11 + R() * 7]); } return o; })();
    function cloudAt(z0) {
      PUFF.slice().sort(function (p, q) { return (p[0] + p[1] + 1.4 * p[2]) - (q[0] + q[1] + 1.4 * q[2]); }).forEach(function (q) {
        var p = I.P(CX + q[0], CY + q[1], z0 + q[2]), r = q[3] * I.s * 1.3;
        var g = ctx.createRadialGradient(p.x - r * .35, p.y - r * .5, r * .1, p.x, p.y, r * 1.05);
        g.addColorStop(0, "#ffffff"); g.addColorStop(.6, "#d9dfe8"); g.addColorStop(1, "#9aa6ba");
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, 6.2832); ctx.fill();
      });
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      var vv = speed(gap), i, k;
      var sense = (sys === "low") ? (hemi === "N" ? -1 : 1) : (hemi === "N" ? 1 : -1);
      var inward = sys === "low" ? 1 : -1, LW = 556;
      var fc = I.P(CX, CY, 0);
      K.studio(ctx, 0, 0, W, H, { x: fc.x, y: fc.y + 20, rx: 250, ry: 70 });
      /* 땅 판 */
      I.box(ctx, 0, 0, 0, I.L, I.D, ZG, "#8fb36a", "#6d5a44", "#56473a");
      var step = clamp(gap * 0.05 + 18, 22, 48) * 0.9;
      /* 기압 바탕: 저기압 = 푸른 중심, 고기압 = 따뜻한 중심 */
      for (i = 6; i >= 1; i--) {
        var rr = i * step * 0.75; if (rr > 145) continue;
        poly(ringPts(rr, ZG)); ctx.fillStyle = sys === "low" ? "rgba(70,120,230," + (0.07 + 0.03 * (6 - i)).toFixed(3) + ")" : "rgba(240,140,60," + (0.06 + 0.03 * (6 - i)).toFixed(3) + ")"; ctx.fill();
      }
      for (i = 1; i <= 4; i++) {
        var r2 = i * step; if (r2 > 148) break;
        poly(ringPts(r2, ZG)); ctx.strokeStyle = "rgba(255,255,255,.95)"; ctx.lineWidth = 1.8; ctx.stroke();
        var la = 0.785 + (i - 1) * 0.55, lp = I.P(CX + r2 * Math.cos(la), CY + r2 * Math.sin(la), ZG);
        K.pill(ctx, String(sys === "low" ? 996 + i * 4 : 1028 - i * 4), lp.x, lp.y + 5, { s: 10.5, a: "center", c: "#ffffff", box: [0, LW] });
      }
      /* 가운데 연직 흐름 */
      var c0 = I.P(CX, CY, ZG + 8), c1 = I.P(CX, CY, ZG + 120);
      if (sys === "low") {
        cloudAt(ZG + 128);
        for (k = 0; k < 3; k++) { var dx = (k - 1) * 16; arr(ctx, I.P(CX + dx, CY - dx, ZG + 12), I.P(CX + dx, CY - dx, ZG + 116), "rgba(28,126,214,.9)", 3.4, 12); }
        for (k = 0; k < 5; k++) { var ru = ((t * 0.02) + k / 5) % 1, rp = I.P(CX + 8, CY + 8, ZG + 12 + ru * 104); K.glow(ctx, rp.x, rp.y, 2, "rgba(120,190,255,.95)", 2.6); }
        /* 비 */
        ctx.strokeStyle = "rgba(40,90,170,.6)"; ctx.lineWidth = 1.2;
        for (k = 0; k < 18; k++) { var rx = CX - 26 + (k * 37 % 52), ry = CY - 20 + (k * 23 % 40), zt = ZG + 110 - ((t * 3 + k * 9) % 90); var a = I.P(rx, ry, zt), b = I.P(rx, ry, zt - 8); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x - 1, b.y); ctx.stroke(); }
      } else {
        K.sun(ctx, c1.x + 60, c1.y - 30, 12);
        for (k = 0; k < 3; k++) { var dx2 = (k - 1) * 16; arr(ctx, I.P(CX + dx2, CY - dx2, ZG + 116), I.P(CX + dx2, CY - dx2, ZG + 14), "rgba(232,89,12,.9)", 3.4, 12); }
        for (k = 0; k < 5; k++) { var du = ((t * 0.02) + k / 5) % 1, dp = I.P(CX + 8, CY + 8, ZG + 116 - du * 102); K.glow(ctx, dp.x, dp.y, 2, "rgba(255,170,100,.95)", 2.6); }
      }
      /* 지상 바람: 등압선을 비스듬히 가로지르며 돈다 */
      for (var r = 1; r <= 3; r++) {
        var R0 = r * step; if (R0 > 140) break;
        var cnt = 6 + r * 2;
        for (k = 0; k < cnt; k++) {
          var ang = (k / cnt) * Math.PI * 2 + sense * t * 0.05, tang = ang + sense * Math.PI / 2 - inward * sense * 0.4;
          var px = CX + Math.cos(ang) * R0, py = CY + Math.sin(ang) * R0;
          var p0 = I.P(px - Math.cos(tang) * 13, py - Math.sin(tang) * 13, ZG + 3), p1 = I.P(px + Math.cos(tang) * 13, py + Math.sin(tang) * 13, ZG + 3);
          arr(ctx, p0, p1, "#ffffff", 5, 10); arr(ctx, p0, p1, "#0f9f76", 2.8, 8);
        }
      }
      var BX = [0, LW];
      K.pill(ctx, sys === "low" ? "L" : "H", I.P(CX, CY, ZG).x, I.P(CX, CY, ZG).y + 6, { s: 15, a: "center", c: sys === "low" ? "#a9dcff" : "#ffc078" });
      K.pill(ctx, "━ 지상 바람", 16, H - 46, { s: 11.5, c: "#9ff0cf" });
      K.pill(ctx, "○ 등압선 (4 hPa 간격, 숫자 = hPa)", 16, H - 18, { s: 11.5, c: "#ffffff" });
      bigHead(ctx, (hemi === "N" ? "북반구 " : "남반구 ") + (sys === "low" ? "저기압" : "고기압"),
        (sense === -1 ? "시계 반대 방향 · " : "시계 방향 · ") + (sys === "low" ? "수렴 → 상승 → 구름·비" : "발산 → 하강 → 맑음"), sys === "low" ? "#a9dcff" : "#ffc078", 18, 42);

      /* ── 오른쪽 흰 카드: 바람 세기 계산 ── */
      var RX = 568, RW = W - RX - 12, x0 = RX + 18, x1 = W - 30;
      K.card(ctx, RX, 12, RW, H - 24, "바람 세기 계산");
      K.row(ctx, "등압선 간격 (4 hPa마다)", gap.toLocaleString() + " km", x0, x1, 66, LT.ink);
      lt(ctx, "지균풍 속도", x0, 100, { s: 12 });
      var vc = vv >= 20 ? LT.red : (vv <= 5 ? LT.green : LT.yellow);
      K.t(ctx, vv.toFixed(1) + " m/s", x0, 140, { s: 32, w: "900", c: vc });
      K.bar(ctx, x0, 154, x1 - x0 - 70, vv / 30, vc);
      K.tip(ctx, vv >= 20 ? "매우 강한 바람" : (vv <= 5 ? "약한 바람" : "보통 바람"), x0 - 4, 176, RW - 28, vv >= 20 || vv <= 5 ? true : null);
      /* 깃발: 바람이 셀수록 크게 펄럭인다 */
      var fx = x1 - 40, fy = 112, flap = Math.sin(t * 0.3) * clamp(vv / 30, 0.1, 1) * 6, fl = 14 + clamp(vv, 0, 30) * 1.1;
      ctx.strokeStyle = "#5c7086"; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(fx, fy - 28); ctx.lineTo(fx, fy + 46); ctx.stroke();
      var fg = ctx.createLinearGradient(fx, 0, fx + fl, 0); fg.addColorStop(0, "#ff6b3d"); fg.addColorStop(1, "#ffc53d");
      ctx.fillStyle = fg; ctx.beginPath(); ctx.moveTo(fx, fy - 28); ctx.quadraticCurveTo(fx + fl / 2, fy - 28 + flap, fx + fl, fy - 20 - flap * .4); ctx.lineTo(fx + fl, fy - 8 - flap * .4); ctx.quadraticCurveTo(fx + fl / 2, fy - 10 + flap, fx, fy - 6); ctx.closePath(); ctx.fill();
      lt(ctx, "기압 경도력 = 기압 차 ÷ 거리", x0, 248, { s: 12, c: LT.ink });
      lt(ctx, "지균풍 : 기압 경도력 = 전향력", x0, 272, { s: 12, c: LT.ink });
      lt(ctx, "같은 4 hPa 라도 거리가 짧으면", x0, 308, { s: 11.5 });
      lt(ctx, "기압 경도력이 커져 바람이 셉니다.", x0, 328, { s: 11.5 });
      lt(ctx, "등압선이 촘촘한 곳이 곧 바람이 센 곳입니다.", x0, 364, { s: 11.5, c: LT.dim });

      $("c-press-read").innerHTML =
        "<span class='k'>등압선 간격</span><span class='v b'>" + gap + " km / 4 hPa</span>" +
        "<span class='k'>지균풍</span><span class='v y'>" + vv.toFixed(1) + " m/s</span>" +
        "<span class='sub'>v = Δp ÷ (ρ · f · 거리) · ρ = 1.2 kg/m³ · 위도 35°</span>";

      var ch = false;
      if (vv >= 20 && !got.a) { got.a = ch = true; }
      if (vv <= 5 && !got.b) { got.b = ch = true; }
      if (ch) { window.sthState("cPress", got); mission(); }

      $("c-press-info").innerHTML = (hemi === "N" ? "북반구" : "남반구") + " " + (sys === "low" ? "저기압" : "고기압") +
        " — 지상의 바람은 <b>" + (sense === -1 ? "시계 반대 방향" : "시계 방향") + "</b>으로 <b>" +
        (sys === "low" ? "불어들어 갑니다(수렴)" : "불어나갑니다(발산)") + "</b>. " +
        (sys === "low" ? "모여든 공기는 올라갈 수밖에 없어 구름이 생기고 비가 옵니다." : "내려온 공기는 데워지면서 구름이 흩어져 대체로 맑습니다.");
    }
    function mission() {
      if (got.a) done("m3-2a"); if (got.b) done("m3-2b"); if (got.c) done("m3-2c");
      if (got.a && got.b && got.c) {
        window.sthMission("m3-2", true, "<span class='m-tag'>미션 완료</span>등압선 간격 200 km면 약 20 m/s, 800 km면 약 5 m/s. <b>간격이 4배가 되면 바람은 4분의 1</b>이 됩니다.");
        ep.clear(1);
      }
    }
    canvas._redraw = draw;
    segWire("c-sys", function (b) { sys = b.getAttribute("data-sys"); $("c-sys-val").textContent = sys === "low" ? "저기압" : "고기압"; draw(); });
    segWire("c-hemi", function (b) { hemi = b.getAttribute("data-h"); $("c-hemi-val").textContent = hemi === "N" ? "북반구" : "남반구"; draw(); });
    $("c-gap").addEventListener("input", function (e) { gap = +e.target.value; $("c-gap-val").textContent = gap + " km"; draw(); });
    window.sthPick({
      mount: "c-q1",
      q: "북반구 지상에서 저기압 중심 둘레의 바람을 바르게 말한 것은?",
      options: [
        "시계 반대 방향으로 중심을 향해 불어들어 간다",
        "시계 방향으로 중심을 향해 불어들어 간다",
        "시계 반대 방향으로 바깥을 향해 불어나간다",
        "등압선과 정확히 나란히 돌기만 한다"
      ],
      answer: 0,
      why: [
        "맞습니다. 기압 경도력이 중심을 향하고 전향력이 오른쪽으로 휘게 해, 북반구 저기압에서는 시계 반대 방향으로 감아 들어갑니다.",
        "회전 방향이 반대입니다. 그것은 북반구 고기압의 모습입니다.",
        "저기압은 불어나가는 것이 아니라 <b>모여드는</b> 기압계입니다.",
        "마찰이 없는 상공이라면 거의 나란히 돌지만, 지상에서는 마찰 때문에 등압선을 가로질러 안쪽으로 들어갑니다."
      ],
      onDone: function () { got.c = true; window.sthState("cPress", got); mission(); }
    });
    draw(); mission();
    var playP = playBtn("c-press-play");
    anim(canvas, function (dt) { if (playP.on) { t += dt / 70; draw(); } });
  })();

  /* ---- 장면3 전선 통과 36시간 ---- */
  (function () {
    var canvas = $("c-c-front"), ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var tt = 0;
    var got = window.sthState("cFront") || { a: false, b: false, c: false };
    var WARM_AT = 10, COLD_AT = 22;

    function ramp(x, a, b) { return clamp((x - a) / (b - a), 0, 1); }
    function tempAt(h) {
      if (h < WARM_AT) return 6 + 0.5 * ramp(h, 0, WARM_AT);
      if (h < WARM_AT + 2) return 6.5 + 11.5 * ramp(h, WARM_AT, WARM_AT + 2);
      if (h < COLD_AT) return 18 + 0.5 * ramp(h, WARM_AT + 2, COLD_AT);
      if (h < COLD_AT + 1) return 18.5 - 11.5 * ramp(h, COLD_AT, COLD_AT + 1);
      return 7 - 2 * ramp(h, COLD_AT + 1, 36);
    }
    function presAt(h) {
      if (h < WARM_AT) return 1012 - 8 * ramp(h, 0, WARM_AT);
      if (h < COLD_AT) return 1004 - 2 * ramp(h, WARM_AT, COLD_AT);
      return 1002 + 14 * ramp(h, COLD_AT, 36);
    }
    function windAt(h) { return h < WARM_AT ? "남동풍" : (h < COLD_AT ? "남서풍" : "북서풍"); }
    function zoneAt(h) { return h < WARM_AT ? "온난 전선 앞" : (h < COLD_AT ? "온난 구역" : "한랭 전선 뒤"); }
    function rainShort(h) {
      if (h >= 2 && h < WARM_AT) return "약한 비가 오래";
      if (h >= COLD_AT - 1 && h < COLD_AT + 1.5) return "짧고 센 소나기";
      return "비 없음";
    }
    function rainAt(h) {
      if (h >= 2 && h < WARM_AT) return "층운형 구름에서 약한 비가 오래";
      if (h >= COLD_AT - 1 && h < COLD_AT + 1.5) return "적운형 구름에서 짧고 강한 소나기";
      return "비 없음 · 대체로 맑음";
    }

    var rainT = 0;
    /* 블록 모형: 온대 저기압의 남쪽을 서 → 동으로 잘라 낸 대기 단면 블록. 앞면 = 공기 덩어리와 전선면(찬 공기 파랑, 따뜻한 공기 주황),
       땅 위 = 전선 기호. 두 전선이 시간에 따라 동쪽(오른쪽 아래)으로 움직여 관측 지점(집과 사람)을 지나간다. 오른쪽 = 흰 카드 기록 + 밝은 그래프 */
    var I = K.iso({ ox: 70, oy: 200, s: 0.7, L: 560, D: 70 }), ZG = 10, ZA = 150, XO = 330, VF = 16;
    function xw(h) { return XO + (h - WARM_AT) * VF; }
    function xc(h) { return XO + (h - COLD_AT) * VF; }
    function warmTop(u, h) { var a = xw(h), b = xc(h); return u >= a ? ZG + (u - a) * 0.28 : (u <= b ? ZG + (b - u) * 1.4 : ZG); }
    var PUFF = (function () { var R = K.rng(29), o = [], i; for (i = 0; i < 22; i++) { var a = R() * 6.283, rr = 16 * Math.sqrt(R()) * (1 - i / 34); o.push([Math.cos(a) * rr, Math.sin(a) * rr * 0.6, (i / 22) * 96, 9 + R() * 6]); } return o; })();
    function puffAt(x, y, z, r, dark) {
      var p = I.P(x, y, z), rr = r * I.s * 1.3;
      var g = ctx.createRadialGradient(p.x - rr * .35, p.y - rr * .5, rr * .1, p.x, p.y, rr * 1.05);
      g.addColorStop(0, "#ffffff"); g.addColorStop(.6, dark ? "#c3cad6" : "#e6ebf2"); g.addColorStop(1, dark ? "#6f7b90" : "#a8b3c4");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, rr, 0, 6.2832); ctx.fill();
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      var a = xw(tt), b = xc(tt), i, u;
      var fc = I.P(I.L / 2, I.D / 2, 0);
      K.studio(ctx, 0, 0, W, H, { x: fc.x, y: fc.y + 16, rx: 300, ry: 64 });
      /* 땅 판 */
      I.box(ctx, 0, 0, 0, I.L, I.D, ZG, "#8fb36a", "#6d5a44", "#56473a");
      /* 앞면: 공기 덩어리 단면 */
      I.face(ctx, "front", function (Lw) {
        ctx.save(); ctx.beginPath(); ctx.rect(0, ZG, Lw, ZA - ZG); ctx.clip();
        var cg = ctx.createLinearGradient(0, ZG, 0, ZA); cg.addColorStop(0, "rgba(77,150,230,.55)"); cg.addColorStop(1, "rgba(160,205,245,.35)");
        ctx.fillStyle = cg; ctx.fillRect(0, ZG, Lw, ZA);
        ctx.beginPath(); ctx.moveTo(0, ZA);
        for (u = 0; u <= Lw; u += 4) ctx.lineTo(u, Math.min(ZA, warmTop(u, tt)));
        ctx.lineTo(Lw, ZA); ctx.closePath();
        var wg = ctx.createLinearGradient(0, ZG, 0, ZA); wg.addColorStop(0, "rgba(245,140,60,.62)"); wg.addColorStop(1, "rgba(250,190,120,.38)");
        ctx.fillStyle = wg; ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,.95)"; ctx.lineWidth = 2; ctx.setLineDash([7, 4]);
        ctx.beginPath(); for (u = Math.max(0, a); u <= Lw; u += 4) ctx.lineTo(u, Math.min(ZA, warmTop(u, tt))); ctx.stroke();
        ctx.beginPath(); for (u = Math.min(Lw, b); u >= 0; u -= 2) ctx.lineTo(u, Math.min(ZA, warmTop(u, tt))); ctx.stroke(); ctx.setLineDash([]);
        ctx.restore();
      });
      /* 오른쪽 면: 앞쪽 찬 공기 */
      I.face(ctx, "right", function (Lw) { ctx.fillStyle = "rgba(77,150,230,.42)"; ctx.fillRect(0, ZG, Lw, ZA - ZG); });
      /* 땅 위 전선 기호(온난 = 빨간 반원, 한랭 = 파란 삼각형, 진행 방향 = 동쪽) */
      function frontLine(x, warm) {
        if (x < 4 || x > I.L - 4) return;
        var p0 = I.P(x, 0, ZG), p1 = I.P(x, I.D, ZG), col = warm ? "#e03131" : "#1c7ed6";
        ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.stroke();
        for (var k = 1; k <= 3; k++) {
          var yy = I.D * k / 4, q = I.P(x, yy, ZG), e = I.P(x + 7, yy, ZG), s1 = I.P(x, yy - 5, ZG), s2 = I.P(x, yy + 5, ZG);
          ctx.fillStyle = col; ctx.beginPath();
          if (warm) { ctx.moveTo(s1.x, s1.y); ctx.quadraticCurveTo(e.x + (e.x - q.x) * .3, e.y + (e.y - q.y) * .3, s2.x, s2.y); }
          else { ctx.moveTo(s1.x, s1.y); ctx.lineTo(e.x + (e.x - q.x) * .4, e.y + (e.y - q.y) * .4); ctx.lineTo(s2.x, s2.y); }
          ctx.closePath(); ctx.fill();
        }
      }
      frontLine(a, true); frontLine(b, false);
      /* 구름: 온난 전선면을 따라 넓게 깔린 층운형, 한랭 전선 위 적란운 */
      for (u = a + 12; u < Math.min(I.L - 10, a + 260); u += 22) {
        var zc = warmTop(u, tt) + 8; if (zc > ZA - 6) break;
        puffAt(u, I.D - 6, zc, 10, false); puffAt(u + 9, I.D - 4, zc + 3, 8, false);
      }
      if (b > 10 && b < I.L - 10) PUFF.forEach(function (q) { puffAt(b + 6 + q[0], I.D - 8 + q[1], ZG + 18 + q[2], q[3], true); });
      /* 비 */
      var rainS = rainShort(tt), heavy = rainS === "짧고 센 소나기";
      ctx.strokeStyle = "rgba(40,90,170,.75)";
      function rain(x0, x1, z0, n, w) { ctx.lineWidth = w; for (var k = 0; k < n; k++) { var rx = x0 + (k * 37 % 100) / 100 * (x1 - x0), zt = z0 - ((rainT * 3 + k * 7) % Math.max(8, z0 - ZG - 8)); if (zt - 8 < ZG) continue; var p = I.P(rx, I.D - 4, zt), q = I.P(rx, I.D - 4, zt - 8); ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x - 1.5, q.y); ctx.stroke(); } }
      if (a < I.L) rain(Math.max(0, a + 4), Math.min(I.L, a + 130), ZG + 44, 26, 1);
      if (b > 0 && b < I.L) rain(Math.max(0, b - 14), Math.min(I.L, b + 24), ZG + 70, 22, 1.8);
      /* 관측 지점 */
      I.house(ctx, XO - 10, I.D * 0.35, ZG, 14, 12, 9);
      I.person(ctx, XO + 10, I.D * 0.75, ZG, "#ff6b81", 1.3);
      I.tree(ctx, XO - 30, I.D * 0.7, ZG, 1); I.tree(ctx, XO + 30, I.D * 0.2, ZG, 1);
      var BX = [0, 560];
      I.label(ctx, XO, I.D, ZG, "관측 지점", -10, 50, "#ffd35a", BX);
      if (a > 20 && a < I.L - 20) I.label(ctx, Math.min(a + 70, I.L - 20), I.D, Math.min(ZA - 4, warmTop(Math.min(a + 70, I.L - 20), tt)), "온난 전선면 · 완만", 16, -46, "#ffb3b3", BX);
      if (b > 20 && b < I.L - 20) I.label(ctx, Math.max(4, b - 30), I.D, Math.min(ZA - 4, warmTop(Math.max(4, b - 30), tt)), "한랭 전선면 · 급함", -20, -40, "#a9dcff", BX);
      var lw = I.P(Math.min(I.L - 20, Math.max(20, (a + b) / 2)), I.D, ZG + 22); if (b < I.L && a > 0) K.pill(ctx, "따뜻한 공기", lw.x, lw.y + 4, { s: 11.5, a: "center", c: "#ffd0a8", box: BX });
      K.pill(ctx, "서 ←", 16, H - 46, { s: 11.5, c: "#ffffff" });
      K.pill(ctx, "→ 동 (저기압이 가는 쪽)", I.P(I.L, I.D, 0).x - 80, H - 18, { s: 11.5, c: "#ffffff", box: [0, 560] });
      K.warn(ctx, 16, H - 18, "⚠ 높이는 크게 과장", "left");
      bigHead(ctx, tt.toFixed(1) + " 시간째 · " + zoneAt(tt), rainS === "비 없음" ? "비 없음 · " + windAt(tt) : rainS + " · " + windAt(tt), tt < WARM_AT ? "#ffffff" : (tt < COLD_AT ? "#ffd0a8" : "#a9dcff"), 18, 42);

      /* ── 오른쪽: 흰 카드 기록 + 밝은 그래프 ── */
      var RX = 566, RW = W - RX - 12, x0 = RX + 18, x1 = W - 30;
      K.card(ctx, RX, 12, RW, 168, "관측 기록");
      K.row(ctx, "기온", tempAt(tt).toFixed(1) + " ℃", x0, x1, 62, LT.orange);
      K.row(ctx, "기압", presAt(tt).toFixed(1) + " hPa", x0, x1, 88, LT.violet);
      K.row(ctx, "바람", windAt(tt), x0, x1, 114, LT.blue);
      K.tip(ctx, rainAt(tt), x0 - 6, 132, RW - 24, rainS === "비 없음" ? null : (heavy ? false : null));
      var g1 = K.chart(ctx, { light: true, x: RX, y: 192, w: RW + 4, h: H - 196, x0: 0, x1: 36, y0: 0, y1: 24, xt: 6, yt: 4, pl: 40, pr: 40, pb: 30, xf: function (v2) { return v2 + "h"; }, yf: function (v2) { return v2 + "℃"; } });
      [[0, WARM_AT, "rgba(28,126,214,.07)"], [WARM_AT, COLD_AT, "rgba(245,140,60,.12)"], [COLD_AT, 36, "rgba(28,126,214,.10)"]].forEach(function (z) { ctx.fillStyle = z[2]; ctx.fillRect(g1.X(z[0]), g1.T, g1.X(z[1]) - g1.X(z[0]), g1.B - g1.T); });
      var tp = [], pp = []; for (i = 0; i <= 144; i++) { var hh = i / 4; tp.push([hh, tempAt(hh)]); pp.push([hh, (presAt(hh) - 998) / 20 * 24]); }
      K.plot(ctx, g1, tp, LT.orange, { light: true, w: 2.6 });
      K.plot(ctx, g1, pp, LT.violet, { light: true, w: 2.6 });
      for (i = 0; i <= 4; i++) lt(ctx, String(998 + i * 5), g1.R + 4, g1.Y(i * 6) + 4, { s: 10, c: LT.violet });
      [[WARM_AT, LT.red], [COLD_AT, LT.blue]].forEach(function (f) { ctx.strokeStyle = f[1]; ctx.setLineDash([5, 4]); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(g1.X(f[0]), g1.T); ctx.lineTo(g1.X(f[0]), g1.B); ctx.stroke(); ctx.setLineDash([]); });
      ctx.strokeStyle = "#f59f00"; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(g1.X(tt), g1.T); ctx.lineTo(g1.X(tt), g1.B); ctx.stroke();
      [[tempAt(tt), LT.orange], [(presAt(tt) - 998) / 20 * 24, LT.violet]].forEach(function (q) { ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(g1.X(tt), g1.Y(q[0]), 5, 0, 6.2832); ctx.fill(); ctx.strokeStyle = q[1]; ctx.lineWidth = 2.6; ctx.stroke(); });
      lt(ctx, "기온(℃)", g1.L + 4, g1.T + 14, { s: 11, c: LT.orange, w: "800" });
      lt(ctx, "기압(hPa)", g1.R - 4, g1.T + 14, { s: 11, a: "right", c: LT.violet, w: "800" });

      var ch = false;
      if (tt >= 12 && tt <= 20 && !got.a) { got.a = ch = true; }
      if (tt >= COLD_AT && tt <= COLD_AT + 1 && !got.b) { got.b = ch = true; }
      if (ch) { window.sthState("cFront", got); mission(); }

      $("c-front-info").innerHTML = "<b>" + zoneAt(tt) + "</b> — 기온 " + tempAt(tt).toFixed(1) + " ℃, " + windAt(tt) + ", " + rainAt(tt) + ". " +
        (tt < WARM_AT ? "온난 전선은 따뜻한 공기가 찬 공기 위로 <b>완만하게</b> 타고 오르므로, 넓은 구역에 약한 비가 오래 내립니다." :
          (tt < COLD_AT ? "두 전선 사이 <b>온난 구역</b>입니다. 기온이 높고 하늘이 비교적 맑습니다." :
            "한랭 전선은 찬 공기가 따뜻한 공기를 <b>급하게</b> 밀어 올려, 좁은 구역에 짧고 센 소나기를 뿌리고 기온을 뚝 떨어뜨립니다."));
    }
    function mission() {
      if (got.a) done("m3-3a"); if (got.b) done("m3-3b"); if (got.c) done("m3-3c");
      if (got.a && got.b && got.c) {
        window.sthMission("m3-3", true, "<span class='m-tag'>미션 완료</span>온난 전선 통과 → 기온 급상승·비 그침, 한랭 전선 통과 → 소나기·기온 급강하·북서풍. <b>순서가 정해져 있으니 예보가 가능합니다.</b>");
        ep.clear(2);
      }
    }
    canvas._redraw = draw;
    $("c-t").addEventListener("input", function (e) { tt = +e.target.value; $("c-t-val").textContent = tt.toFixed(1) + "시간"; draw(); });
    window.sthOrder({
      mount: "c-order",
      steps: [
        "남동풍이 불고, 넓게 깔린 층운형 구름에서 약한 비가 오래 내린다",
        "온난 전선이 지나가고 기온이 크게 오르며 비가 그친다",
        "남서풍이 불고 하늘이 대체로 맑다 (온난 구역)",
        "서쪽에서 적란운이 다가와 짧고 강한 소나기가 쏟아진다",
        "한랭 전선이 지나가고 기온이 뚝 떨어지며 북서풍으로 바뀐다",
        "기압이 오르고 하늘이 갠다"
      ],
      onDone: function () { got.c = true; window.sthState("cFront", got); mission(); }
    });
    draw(); mission();
    var playF = playBtn("c-front-play");
    anim(canvas, function (dt) { if (playF.on && rainShort(tt) !== "비 없음") { rainT += dt / 70; draw(); } });
  })();

  /* ---- 장면4 일기도 이동 속도 ---- */
  (function () {
    var canvas = $("c-c-map"), ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var spd = 0;
    var got = window.sthState("cMap") || { a: false, b: false };
    var POS = [-2400, -1440, -480];        /* 관측 지점 기준 km (음수 = 서쪽) */

    /* 일기도 네 장 = 스튜디오 바닥에 나란히 놓인 네 개의 작은 지도 판(블록). 판마다 등압선·전선·구름 소용돌이, 관측 지점 핀.
       아래 = 흰 카드 두 장(하루 사이 거리 · 내가 읽은 속도와 판정) */
    var TL = 250, TD = 190, TZ = 8;
    function tileIso(i) { return K.iso({ ox: 118 + i * 222, oy: 74, s: 0.46, L: TL, D: TD }); }
    function frontOn(J, x, y, dx, dy, warm) {
      var col = warm ? "#e03131" : "#1c7ed6", n = 16, k, pts = [];
      for (k = 0; k <= n; k++) { var s = k / n; pts.push(J.P(x + dx * s + Math.sin(s * 3.14) * 6, y + dy * s, TZ)); }
      ctx.strokeStyle = col; ctx.lineWidth = 2.4; ctx.beginPath(); pts.forEach(function (p, i) { if (i) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y); }); ctx.stroke();
      for (k = 1; k <= 3; k++) {
        var p = pts[k * 4], q = pts[k * 4 + 1], ux = q.x - p.x, uy = q.y - p.y, L0 = Math.hypot(ux, uy) || 1; ux /= L0; uy /= L0;
        var flip = -uy < 0, nx = flip ? uy : -uy, ny = flip ? -ux : ux;   /* 기호는 동쪽(오른쪽) 진행 방향에 붙인다 */
        ctx.fillStyle = col; ctx.beginPath();
        if (warm) ctx.arc(p.x, p.y, 4, Math.atan2(uy, ux), Math.atan2(uy, ux) + Math.PI, flip);
        else { ctx.moveTo(p.x - ux * 4.5, p.y - uy * 4.5); ctx.lineTo(p.x + ux * 4.5, p.y + uy * 4.5); ctx.lineTo(p.x + nx * 7, p.y + ny * 7); }
        ctx.closePath(); ctx.fill();
      }
    }
    function tile(i, label, cxkm, dashed) {
      var J = tileIso(i), ok = !dashed;
      var c = J.P(TL / 2, TD / 2, 0);
      var sh = ctx.createRadialGradient(c.x, c.y + 10, 4, c.x, c.y + 10, 120); sh.addColorStop(0, "rgba(20,30,50,.25)"); sh.addColorStop(1, "rgba(20,30,50,0)");
      ctx.fillStyle = sh; ctx.beginPath(); ctx.ellipse(c.x, c.y + 10, 120, 40, 0, 0, 6.2832); ctx.fill();
      I0box(J);
      /* 대륙(서쪽 끝) */
      J.quad(ctx, J.P(0, 0, TZ), J.P(46, 0, TZ), J.P(30, TD * .5, TZ), J.P(0, TD * .5, TZ), "#9cbf74");
      J.quad(ctx, J.P(0, TD * .5, TZ), J.P(30, TD * .5, TZ), J.P(54, TD, TZ), J.P(0, TD, TZ), "#9cbf74");
      /* 관측 지점과 저기압 중심 */
      var ox = TL * 0.7, oy = TD * 0.62, ly = TD * 0.36;
      var lx = clamp(ox + cxkm * (ox - 22) / 2400, 16, TL - 16);
      for (var r = 3; r >= 1; r--) {
        ctx.beginPath();
        for (var k = 0; k <= 40; k++) { var a = k / 40 * 6.2832, p = J.P(lx + (14 + r * 14) * Math.cos(a), ly + (10 + r * 11) * Math.sin(a), TZ); if (k) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y); }
        ctx.strokeStyle = "rgba(255,255,255,.9)"; ctx.lineWidth = 1.3; ctx.stroke();
      }
      frontOn(J, lx, ly, 50, 54, true);
      frontOn(J, lx, ly, -30, 70, false);
      /* 구름 소용돌이(입체 솜) */
      var R = K.rng(3 + i);
      for (var q = 0; q < 9; q++) { var aa = q * 0.9, rr = 6 + q * 2.6, pc = J.P(lx + rr * Math.cos(aa), ly + rr * Math.sin(aa), TZ + 10 + R() * 4), pr = 7 - q * 0.35;
        var g = ctx.createRadialGradient(pc.x - pr * .3, pc.y - pr * .4, 1, pc.x, pc.y, pr); g.addColorStop(0, "#ffffff"); g.addColorStop(1, "#b8c2d2"); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(pc.x, pc.y, pr, 0, 6.2832); ctx.fill(); }
      var lc = J.P(lx, ly, TZ + 22); K.pill(ctx, "L", lc.x, lc.y, { s: 11, a: "center", c: "#a9dcff" });
      /* 관측 지점 핀 */
      var pp = J.P(ox, oy, TZ), pt = J.P(ox, oy, TZ + 20);
      ctx.strokeStyle = "#12203a"; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(pp.x, pp.y); ctx.lineTo(pt.x, pt.y); ctx.stroke();
      K.planet(ctx, pt.x, pt.y, 5, "#ffd35a", "#c27c00");
      var x0 = 16 + i * 222, x1 = x0 + 212;
      if (dashed) { ctx.save(); ctx.setLineDash([6, 4]); ctx.strokeStyle = "#f59f00"; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(x0, 36, 212, 196, 14); ctx.stroke(); ctx.restore(); }
      K.t(ctx, label, x0 + 10, 30, { s: 12.5, w: "900", c: dashed ? "#d9480f" : LT.ink });
      K.pill(ctx, (cxkm < 0 ? "중심: 서쪽 " + Math.abs(Math.round(cxkm)) : "중심: 동쪽 " + Math.round(cxkm)) + " km", (x0 + x1) / 2, 226, { s: 11, a: "center", c: "#ffffff", box: [x0, x1] });
    }
    function I0box(J) {
      var top = J.P(0, 0, TZ);
      J.box(ctx, 0, 0, 0, TL, TD, TZ, "#3f8fd0", "#2a6aa8", "#1f5288");
      var g = ctx.createLinearGradient(top.x, top.y, top.x, top.y + 120); g.addColorStop(0, "rgba(255,255,255,.18)"); g.addColorStop(1, "rgba(255,255,255,0)");
      J.quad(ctx, J.P(0, 0, TZ), J.P(TL, 0, TZ), J.P(TL, TD, TZ), J.P(0, TD, TZ), g);
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      var d4 = POS[2] + 24 * spd, ok = Math.abs(spd - 40) <= 2;
      K.studio(ctx, 0, 0, W, H);
      tile(0, "1일차 (어제)", POS[0], false);
      tile(1, "2일차 (오늘)", POS[1], false);
      tile(2, "3일차 (내일)", POS[2], false);
      tile(3, "4일차 (모레) · 예상", d4, true);
      arr(ctx, { x: 40, y: 250 }, { x: W - 40, y: 250 }, "rgba(28,126,214,.55)", 2.4, 11);
      K.pill(ctx, "편서풍 따라 서 → 동", W / 2, 255, { s: 11.5, a: "center", c: "#a9dcff" });
      /* 흰 카드 두 장 */
      K.card(ctx, 16, 276, 300, H - 288, "하루 사이에 옮겨 간 거리");
      K.row(ctx, "1 → 2 일차", (POS[1] - POS[0]) + " km", 34, 298, 334, LT.ink);
      K.row(ctx, "2 → 3 일차", (POS[2] - POS[1]) + " km", 34, 298, 360, LT.ink);
      K.row(ctx, "하루", "24 시간", 34, 298, 386, LT.mute);
      lt(ctx, "속도 = 거리 ÷ 시간", 34, 420, { s: 12, c: LT.blue, w: "800" });
      K.card(ctx, 330, 276, W - 342, H - 288, "판정");
      K.t(ctx, "내가 읽은 속도 " + spd + " km/h", 350, 334, { s: 22, w: "900", c: ok ? LT.green : LT.yellow });
      K.tip(ctx, ok ? "✅ 맞습니다 · 하루 960 km" : (spd > 40 ? "너무 빠릅니다" : "아직 느립니다"), 346, 348, 240, ok);
      K.row(ctx, "4일차 중심 위치", "관측 지점 " + (d4 >= 0 ? "동쪽 " + Math.round(d4) : "서쪽 " + Math.abs(Math.round(d4))) + " km", 350, W - 30, 408, LT.blue);
      lt(ctx, ok ? "중심이 이미 지나갔습니다 · 한랭 전선 뒤" : "속도를 맞히면 4일차 자리가 정확해집니다", 350, 434, { s: 11.5 });
      K.pill(ctx, "▲ 한랭 전선", W - 140, 368, { s: 11, a: "right", c: "#a9dcff" });
      K.pill(ctx, "● 온난 전선", W - 30, 368, { s: 11, a: "right", c: "#ffb3b3" });

      if (ok && !got.a) { got.a = true; window.sthState("cMap", got); mission(); }
      $("c-map-info").innerHTML = "일기도 한 장은 사진이지만, <b>여러 장을 나란히 놓으면 영화</b>가 됩니다. 기압계가 하루에 얼마나 움직였는지 재면 다음 장면을 그릴 수 있습니다." +
        (ok ? " — 하루 <b>960 km</b>, 시속 <b>40 km</b>입니다." : "");
    }
    function mission() {
      if (got.a) done("m3-4a"); if (got.b) done("m3-4b");
      if (got.a && got.b) {
        window.sthMission("m3-4", true, "<span class='m-tag'>미션 완료</span>시속 40 km로 동진하면 모레 저기압 중심은 관측 지점 <b>동쪽 480 km</b>. 한랭 전선이 지난 뒤라 <b>북서풍이 불고 기온이 떨어지며 하늘이 갭니다.</b>");
        ep.clear(3); ep.clear(4);
      }
    }
    canvas._redraw = draw;
    $("c-spd").addEventListener("input", function (e) { spd = +e.target.value; $("c-spd-val").textContent = spd + " km/h"; draw(); });
    window.sthPick({
      mount: "c-q2",
      q: "저기압 중심이 모레 관측 지점의 동쪽 480 km에 있다면, 모레 낮 관측 지점의 날씨로 가장 알맞은 것은?",
      options: [
        "한랭 전선이 지난 뒤라 북서풍이 불고 기온이 떨어지며 하늘이 갠다",
        "온난 전선 앞이라 남동풍이 불고 약한 비가 오래 내린다",
        "저기압 중심이 바로 위에 있어 하루 종일 비가 쏟아진다",
        "고기압에 들어 남서풍이 불고 기온이 크게 오른다"
      ],
      answer: 0,
      why: [
        "맞습니다. 저기압 중심과 두 전선이 모두 동쪽으로 빠져나갔으니, 뒤따라온 찬 공기가 들어와 북서풍이 불고 기온이 떨어지며 하늘이 갭니다. 체육대회는 운동장에서 해도 되겠습니다.",
        "온난 전선 앞이라면 저기압 중심이 아직 <b>서쪽</b>에 있어야 합니다.",
        "중심이 480 km나 동쪽으로 지나갔습니다. 바로 위가 아닙니다.",
        "저기압이 막 지나간 직후라 고기압 한가운데라고 보기는 어렵고, 바람도 남서풍이 아니라 북서풍입니다."
      ],
      onDone: function () { got.b = true; window.sthState("cMap", got); mission(); }
    });
    draw(); mission();
  })();

  function finish() { window.sthState("r3", "해결 · 기압계는 시속 40 km로 동진, 모레는 한랭 전선 뒤 — 북서풍에 기온 하강, 맑음"); }
  function vsC() {
    var p = window.sthState("c-p") || "";
    $("c-vs").innerHTML = "<b>나의 첫 추리</b> " + (p || "기록 없음") + "<br>" +
      (p.indexOf("㉡") === 0 ? "정확했습니다. 편서풍대라 기압계가 서에서 동으로 갑니다. 일기도 세 장이 그것을 그대로 보여 주었습니다."
        : "일기도 세 장을 견주어 보니 ㉡ 이었습니다. 중위도 편서풍이 기압계를 동쪽으로 실어 나릅니다.");
  }
  vsC();
  ep.onShow(vsC);
  window.sthWork({
    mount: "wkC", unitLabel: "[지구과학 Ⅰ-1] 이야기 ③ 일기도 세 장",
    items: [
      { id: "w3", label: "일기도에서 읽은 것", hint: "온난 전선과 한랭 전선이 지나갈 때 기온·바람·강수가 어떻게 달라지는지 하나를 골라 쓰세요." },
      { id: "c2", label: "교장 선생님께 드리는 예보문", hint: "모레 날씨를 한 문장으로 말하고, 그렇게 판단한 근거(기압계의 이동 속도와 방향, 전선의 자리)를 함께 쓰세요." }
    ]
  });
})();

/* =========================================================================
   이야기 ④ 매미가 오던 밤
   ========================================================================= */
(function () {
  var ep = window.sthStory({ root: "epD", key: "epD", name: "사건 파일 ④", onDone: finish });

  window.sthGate({
    gate: "d-gate", key: "d-p", title: "상황실의 첫 추리",
    question: "태풍이 지나갈 때, 중심에서 같은 거리라면 어느 쪽이 더 위험할까요?",
    options: ["㉠ 진행 방향의 오른쪽", "㉡ 진행 방향의 왼쪽", "㉢ 양쪽이 똑같다", "㉣ 중심(눈)이 가장 위험하다"],
    onPick: function () { ep.clear(0); }
  });

  /* ---- 장면2 태풍의 일생 ---- */
  (function () {
    var canvas = $("d-c-life"), ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var sst = 28, place = "sea";
    var got = window.sthState("dLife") || { a: false, b: false, c: false };
    var SST_MIN = 26.5;

    function corePress() {
      if (place === "land") return 1002;
      if (sst < SST_MIN) return 1010;
      return Math.max(900, 1010 - 14 * (sst - 26));
    }

    var tl = 0;
    /* 블록 모형: 열대 바다(또는 육지) 한 판과 그 위에서 자라는 태풍. 윗면 색 = 해수면 수온, 수증기 알갱이가 올라가 나선 구름띠(입체 솜)를 키운다.
       북반구라 구름띠는 시계 반대 방향으로 돈다. 오른쪽 흰 카드 = 중심 기압 판정 */
    var I = K.iso({ ox: 262, oy: 226, s: 0.62, L: 320, D: 320 }), ZS = 30, CX = 160, CY = 160;
    var paintL = cache(canvas, W, H);
    function landZ(x, y) { return ZS + 6 + 7 * Math.sin(x / 31) * Math.cos(y / 27) + 5 * Math.sin((x + y) / 17); }
    function paintBase(c, key) {
      var fc = I.P(CX, CY, 0);
      K.studio(c, 0, 0, W, H, { x: fc.x, y: fc.y + 14, rx: 260, ry: 70 });
      if (place === "land") {
        I.field(c, landZ, function (x, y, z, l) { return K.tint(z > ZS + 12 ? "#8d9a5c" : "#7fa35a", l); }, 32, 32);
        ["front", "right"].forEach(function (side) { I.face(c, side, function (Lw) {
          I.profile(c, side, function (u) { return side === "front" ? landZ(u, I.D) : landZ(I.L, u); }, 0);
          var g = c.createLinearGradient(0, 0, 0, ZS + 10); g.addColorStop(0, "#4a3a2b"); g.addColorStop(1, "#8c6c48"); c.fillStyle = g; c.fill();
        }); });
        I.shade(c, "front", function (u) { return landZ(u, I.D); }); I.shade(c, "right", function (u) { return landZ(I.L, u); });
        [[60, 80], [90, 230], [250, 70], [220, 260], [40, 290]].forEach(function (q) { I.house(c, q[0], q[1], landZ(q[0], q[1]), 12, 10, 8); });
        [[120, 40], [270, 180], [30, 160], [180, 290]].forEach(function (q) { I.tree(c, q[0], q[1], landZ(q[0], q[1]), 1.2); });
      } else {
        ["front", "right"].forEach(function (side) { I.face(c, side, function (Lw) {
          var g = c.createLinearGradient(0, 0, 0, ZS); g.addColorStop(0, "#0a2350"); g.addColorStop(0.55, "#1f5fa6"); g.addColorStop(1, tCol(sst, 0.9));
          c.fillStyle = g; c.fillRect(0, 0, Lw, ZS);
        }); });
        I.shade(c, "front", function () { return ZS; }); I.shade(c, "right", function () { return ZS; });
        I.plane(c, ZS, mix("#2a6fb8", "#14b8a6", clamp((sst - 22) / 10, 0, 1)), "rgba(255,255,255,.85)");
        c.strokeStyle = "rgba(255,255,255,.5)"; c.lineWidth = 1;
        for (var w = 0; w < 14; w++) { var gx = 14 + (w * 67) % 290, gy = 14 + (w * 41) % 290, s1 = I.P(gx, gy, ZS), s2 = I.P(gx + 14, gy, ZS); c.beginPath(); c.moveTo(s1.x, s1.y); c.quadraticCurveTo((s1.x + s2.x) / 2, s1.y - 2, s2.x, s2.y); c.stroke(); }
      }
      I.edges(c, ZS, ZS);
    }
    function draw() {
      var p = corePress(), grows = (place === "sea" && sst >= SST_MIN), i;
      paintL(ctx, place + Math.round(sst * 10), paintBase);
      /* 수증기: 위로 올라가는 빛 알갱이 */
      var n = grows ? clamp(Math.round((sst - 26) * 6) + 8, 8, 40) : 3, R = K.rng(7);
      for (i = 0; i < n; i++) {
        var a0 = R() * 6.283, r0 = 30 + R() * 110, ph = (R() + tl * (grows ? 0.012 : 0.004)) % 1;
        var q = I.P(CX + r0 * Math.cos(a0), CY + r0 * Math.sin(a0), ZS + ph * (grows ? 60 : 24));
        ctx.globalAlpha = (1 - ph) * .9; K.glow(ctx, q.x, q.y, 1.8, "rgba(40,190,160,.95)", 3); ctx.globalAlpha = 1;
      }
      /* 나선 구름띠(입체 솜) */
      var Rr = grows ? clamp(46 + (sst - 26) * 26, 46, 150) : 40, rot = -tl * (grows ? 0.02 : 0.006), P2 = [];
      var arms = grows ? 5 : 3, per = grows ? 12 : 5;
      for (var k = 0; k < arms; k++) for (var s2 = 0; s2 <= per; s2++) {
        var fr = s2 / per, rr = Rr * 0.24 + fr * Rr * 0.85, ang = k * Math.PI * 2 / arms + fr * 2.8 + rot;
        P2.push([CX + Math.cos(ang) * rr, CY + Math.sin(ang) * rr, ZS + 58 + (1 - fr) * (grows ? 30 : 6), (grows ? 19 : 11) * (1 - fr * 0.4)]);
      }
      if (grows) for (i = 0; i < 12; i++) { var ea = i / 12 * 6.283 + rot; P2.push([CX + Math.cos(ea) * Rr * 0.2, CY + Math.sin(ea) * Rr * 0.2, ZS + 92, 13]); }
      P2.sort(function (a, b) { return (a[0] + a[1] + 1.4 * a[2]) - (b[0] + b[1] + 1.4 * b[2]); });
      P2.forEach(function (q2) { puff3(ctx, I, q2[0], q2[1], q2[2], q2[3], !grows, grows ? 1 : 0.75); });
      if (grows && p <= 980) {
        var ec = I.P(CX, CY, ZS + 100);
        ctx.fillStyle = "rgba(20,40,80,.55)"; ctx.beginPath(); ctx.ellipse(ec.x, ec.y, clamp(Rr * .07, 4, 10), clamp(Rr * .04, 2.4, 6), 0, 0, 6.2832); ctx.fill();
        K.pill(ctx, "태풍의 눈", ec.x + 18, ec.y - 22, { s: 11.5, c: "#ffffff", box: [0, 540] });
      }
      if (grows) { var lc = I.P(CX + Rr * 0.7, CY - Rr * 0.4, ZS + 70); K.pill(ctx, "응결 → 잠열 방출", lc.x + 8, lc.y - 14, { s: 12, c: "#ffd0a8", box: [0, 540] }); }
      var vp = I.P(CX - 120, CY + 90, ZS);
      K.pill(ctx, grows ? "수증기가 활발히 올라간다" : (place === "land" ? "수증기 공급이 끊겼다" : "바다가 차가워 수증기가 부족하다"), vp.x - 10, vp.y + 40, { s: 12, a: "right", c: grows ? "#9ff0cf" : "#ffb3b3", box: [0, 540] });
      var pc = p <= 940 ? LT.red : (grows ? LT.violet : LT.mute);
      var stat = grows ? (p <= 940 ? "매우 강한 태풍" : (p <= 980 ? "발달 중인 태풍" : "약한 열대 저압부")) : (place === "land" ? "상륙 · 세력이 빠르게 약해짐" : "태풍으로 발달하지 못함");
      bigHead(ctx, stat, place === "land" ? "육지 위 · 수증기 공급 끊김" : "해수면 수온 " + sst.toFixed(1) + " ℃", p <= 940 ? "#ffb3b3" : "#ffffff", 18, 42);
      K.warn(ctx, 16, H - 12, "⚠ 구름 높이·크기는 모식적", "left");

      /* ── 오른쪽 흰 카드 ── */
      var RX = 560, RW = W - RX - 12, x0 = RX + 18, x1 = W - 30;
      K.card(ctx, RX, 12, RW, H - 24, "중심 기압");
      K.t(ctx, p.toFixed(0) + " hPa", x0, 82, { s: 34, w: "900", c: pc });
      K.tip(ctx, stat, x0 - 4, 96, RW - 28, grows ? (p <= 940 ? true : null) : false);
      K.row(ctx, "장소", place === "land" ? "육지 상륙" : "열대 해상", x0, x1, 150);
      K.row(ctx, "해수면 수온", sst.toFixed(1) + " ℃", x0, x1, 176, sst >= SST_MIN ? LT.orange : LT.blue);
      var gx = x0, gw = x1 - x0, gy = 206;
      function SX(v2) { return gx + clamp((v2 - 22) / 10, 0, 1) * gw; }
      var tg = ctx.createLinearGradient(gx, 0, gx + gw, 0); for (i = 0; i <= 10; i++) tg.addColorStop(i / 10, tCol(22 + i));
      ctx.fillStyle = tg; ctx.beginPath(); ctx.roundRect(gx, gy, gw, 12, 6); ctx.fill();
      ctx.strokeStyle = LT.red; ctx.setLineDash([4, 3]); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(SX(26.5), gy - 8); ctx.lineTo(SX(26.5), gy + 20); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(SX(sst), gy + 6, 7, 0, 6.2832); ctx.fill(); ctx.strokeStyle = LT.ink; ctx.lineWidth = 2; ctx.stroke();
      lt(ctx, "22 ℃", gx, gy + 34, { s: 10.5 }); lt(ctx, "32 ℃", gx + gw, gy + 34, { s: 10.5, a: "right" });
      lt(ctx, "26.5 ℃ 이상에서 발달", SX(26.5), gy + 34, { s: 11, a: "center", c: LT.red, w: "800" });
      lt(ctx, "태풍은 해수면 수온 약 26.5 ℃ 이상인", x0, 282, { s: 11.5, c: LT.ink });
      lt(ctx, "열대 바다에서만 태어납니다.", x0, 300, { s: 11.5, c: LT.ink });
      lt(ctx, "찬 바다나 육지를 만나면 수증기", x0, 330, { s: 11.5 });
      lt(ctx, "공급이 끊겨 세력을 잃습니다.", x0, 348, { s: 11.5 });
      lt(ctx, "잠열 = 수증기가 물방울로 바뀌며", x0, 384, { s: 11.5, c: LT.orange, w: "800" });
      lt(ctx, "내놓는 열 → 태풍의 에너지원", x0, 402, { s: 11.5, c: LT.orange, w: "800" });

      var ch = false;
      if (place === "sea" && sst <= 26.0 && !got.a) { got.a = ch = true; }
      if (place === "sea" && p <= 940 && !got.b) { got.b = ch = true; }
      if (ch) { window.sthState("dLife", got); mission(); }

      $("d-life-info").innerHTML = grows ?
        "해수면 수온 <b>" + sst.toFixed(1) + " ℃</b> — 바다에서 올라온 수증기가 응결하며 <b>잠열</b>을 내놓고, 그 열이 공기를 더 올려 중심 기압을 낮춥니다. 수온이 높을수록 더 강해질 수 있습니다." :
        (place === "land" ? "육지에 올라오면 <b>수증기 공급이 끊기고 지표 마찰이 커져</b> 세력이 빠르게 약해집니다. 대개 온대 저기압으로 바뀌거나 소멸합니다." :
          "수온이 <b>26.5 ℃</b>에 못 미치면 올라오는 수증기가 부족해 태풍으로 발달하지 못합니다.");
    }
    function mission() {
      if (got.a) done("m4-2a"); if (got.b) done("m4-2b"); if (got.c) done("m4-2c");
      if (got.a && got.b && got.c) {
        window.sthMission("m4-2", true, "<span class='m-tag'>미션 완료</span>태풍의 연료는 <b>따뜻한 바다의 수증기</b>입니다. 연료가 넉넉하면 940 hPa 아래까지 강해지고, 연료가 끊기면 소멸합니다.");
        ep.clear(1);
      }
    }
    canvas._redraw = draw;
    $("d-sst").addEventListener("input", function (e) { sst = +e.target.value; $("d-sst-val").textContent = sst.toFixed(1) + " ℃"; draw(); });
    segWire("d-place", function (b) { place = b.getAttribute("data-p"); $("d-place-val").textContent = place === "sea" ? "열대 해상" : "육지 상륙"; draw(); });
    window.sthOrder({
      mount: "d-order",
      steps: [
        "수온 27 ℃ 안팎의 열대 바다에서 수증기를 잔뜩 머금은 공기가 모여 올라간다",
        "응결하며 나온 잠열이 상승을 더 키워 중심 기압이 낮아지고 소용돌이가 빨라진다",
        "무역풍을 타고 서쪽으로 나아간다",
        "북태평양 고기압 가장자리를 따라 진로를 북동쪽으로 튼다 (전향)",
        "찬 바다나 육지를 만나 수증기 공급이 끊기고 세력이 약해진다",
        "온대 저기압으로 바뀌거나 소멸한다"
      ],
      onDone: function () { got.c = true; window.sthState("dLife", got); mission(); }
    });
    draw(); mission();
    var playL = playBtn("d-life-play");
    anim(canvas, function (dt) { if (playL.on) { tl += dt / 70; draw(); } });
  })();

  /* ---- 장면3 태풍 단면 (아이소메트릭 블록 모형 — 태풍을 반으로 잘라 속을 본다 + 거리별 풍속·기압) ---- */
  (function () {
    var canvas = $("d-c-cross"), ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var r = 100, t = 0;
    var got = window.sthState("dCross") || { a: false, b: false, c: false };
    var PC = 954, DP = 56, RM = 45, VMAX = 50;

    function pres(rr) { return rr < 1 ? PC : PC + DP * Math.exp(-RM / rr); }
    function wind(rr) { return rr <= RM ? VMAX * (rr / RM) * (rr / RM) : VMAX * Math.sqrt(RM / rr); }   /* 눈 안쪽은 바람이 빨리 잦아든다 */
    function zone(rr) {
      if (rr < 25) return "태풍의 눈";
      if (rr < 70) return "눈벽구름";
      if (rr < 250) return "나선 강우대";
      return "태풍 바깥 영역";
    }

    /* ── 블록 모형: 태풍 중심이 앞면(y = D) 가운데에 오도록 잘라 낸 바다 + 대기 ──
       x 0~L (화면 오른쪽 아래로), y 0~D (왼쪽 아래로). 가로 1 km = KS 그림 단위, 높이 1 km = ZK 그림 단위(과장). */
    var DH = 450;
    var I = K.iso({ ox: 364, oy: 95, s: 0.8, L: 560, D: 220 });
    var L = I.L, D = I.D, XC = L / 2, KS = 280 / 400, ZW = 22, ZK = 9, ZB = ZW + ZK;   /* ZB: 구름 밑면(약 1 km) */
    function sm(a) { a = clamp(a, 0, 1); return a * a * (3 - 2 * a); }
    var ph = 0;                                               /* 구름띠가 도는 각(위에서 볼 때 반시계) */
    /* 구름 꼭대기 높이(해수면 위, km): 거리 rk(km)와 방위 th(위에서 볼 때 반시계로 잰 각) */
    function topKm(rk, th) {
      var core;
      if (rk < 30) core = 15 * sm((rk - 17) / 13);            /* 눈: 맑고, 위로 갈수록 넓어지는 벽 */
      else if (rk < 70) core = 15 - (rk - 30) * 0.02;
      else core = 14.2 - (rk - 70) * 0.035;
      core *= 1 - sm((rk - 120) / 55);                        /* 중심의 짙은 구름은 120 km 쯤부터 끊긴다 */
      var band = 0;
      if (rk > 90 && rk < 380) {
        var s = 0.5 + 0.5 * Math.cos(2 * (th - ph) + (rk - 120) / 38);   /* 바깥으로 갈수록 시계 방향으로 감기는 띠 */
        band = (8.5 - (rk - 120) * 0.016) * sm((s - 0.32) / 0.6) * sm((rk - 90) / 40) * (1 - sm((rk - 320) / 55));
      }
      return Math.max(core, band, 0);
    }
    function polar(x, y) { var dx = (x - XC) / KS, dy = (D - y) / KS; return { rk: Math.sqrt(dx * dx + dy * dy), th: Math.atan2(dy, dx) }; }
    function zOf(x, y) { var p = polar(x, y); return ZW + topKm(p.rk, p.th) * ZK; }
    function frontZ(u) { return zOf(u, D); }
    function colOf(x, y, z, light) {
      var m = (z - ZW) / ZK;
      if (m < 0.25) return K.tint("#2f7fbf", light);                /* 바다 */
      if (m < 4) return K.tint("#cdd6e2", light);                   /* 낮은 구름 */
      if (m < 10) return K.tint("#e6ecf4", light);
      return K.tint("#f5f8fc", light);                              /* 높은 구름 꼭대기 */
    }
    /* 솜뭉치 그림(미리 한 번 그려 둔다): 0 그림자 · 1 낮은 회색 · 2 중간 · 3 꼭대기 흰색 */
    var PUFF = ["rgba(10,30,60,", "rgba(176,188,204,", "rgba(222,229,238,", "rgba(250,252,255,"].map(function (c, i) {
      var cv = document.createElement("canvas"); cv.width = cv.height = 48; var x = cv.getContext("2d"), g = x.createRadialGradient(20, 20, 2, 24, 24, 24);
      g.addColorStop(0, c + (i ? "1)" : ".9)")); g.addColorStop(.55, c + (i ? ".95)" : ".5)"));
      if (i) g.addColorStop(.8, "rgba(186,197,214,.5)");
      g.addColorStop(1, c + "0)");
      x.fillStyle = g; x.fillRect(0, 0, 48, 48); return cv;
    });
    function U(rk, side) { return XC + side * rk * KS; }
    /* 공기 덩어리의 길: 바다 위로 빨려 들어와(수렴) → 눈벽에서 솟고 → 꼭대기에서 퍼져 나간다(발산) */
    function pathPt(f) {
      if (f < 0.5) { var a = f / 0.5; return { rk: 330 - a * 290, z: ZW + 0.4 * ZK }; }
      if (f < 0.72) { var b = (f - 0.5) / 0.22; return { rk: 40 + b * 18, z: ZW + (0.4 + b * 13.8) * ZK }; }
      var c = (f - 0.72) / 0.28; return { rk: 58 + c * 280, z: ZW + (14.2 - c * 2.4) * ZK };
    }

    /* 바탕(스튜디오·바다·구름)은 구름띠가 조금 돌았을 때만 다시 그려 둔다 — 솜뭉치가 많아 매번 그리면 무겁다 */
    var base = null, basePh = -9;
    function paintBase() {
      var dpr = 2;   /* 캔버스 버퍼(setupCanvas)와 같게 */
      if (!base) { base = document.createElement("canvas"); base.width = Math.round(W * dpr); base.height = Math.round(DH * dpr); }
      var ctx = base.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, DH);
      K.studio(ctx, 0, 0, W, DH, { x: I.P(L, D, 0).x - 110, y: I.P(L, D, 0).y - 30, rx: 290, ry: 56 });
      ctx.save(); ctx.beginPath(); ctx.roundRect(0, 0, W, DH, 14); ctx.clip();
      /* 바다(앞면·오른쪽 면) */
      I.water(ctx, ZW, function () { return 0; }, { surface: false, top: "rgba(60,150,220,.85)", deep: "rgba(12,50,110,.95)" });
      I.face(ctx, "front", function (Lw) {   /* 따뜻한 표층이 연료 */
        var g = ctx.createLinearGradient(0, ZW, 0, ZW - 9); g.addColorStop(0, "rgba(255,170,90,.55)"); g.addColorStop(1, "rgba(255,170,90,0)");
        ctx.fillStyle = g; ctx.fillRect(0, ZW - 9, Lw, 9);
      });
      I.edges(ctx, ZW, ZW);
      /* 바다 윗면 */
      var sa = I.P(0, 0, ZW), sc = I.P(L, D, ZW), sg = ctx.createLinearGradient(sa.x, sa.y, sc.x, sc.y);
      sg.addColorStop(0, "#5aa9e6"); sg.addColorStop(1, "#1f69ad"); I.plane(ctx, ZW, sg, "rgba(255,255,255,.6)");
      /* 구름: 칸마다 솜뭉치를 밑면에서 꼭대기까지 쌓는다(뒤에서 앞으로) */
      var nx = 56, ny = 22, dx = L / nx, dy = D / ny, s0, ii, jj;
      for (s0 = 0; s0 <= nx + ny - 2; s0++) {
        for (ii = Math.max(0, s0 - ny + 1); ii <= Math.min(nx - 1, s0); ii++) {
          jj = s0 - ii;
          var cx2 = (ii + 0.5) * dx, cy2 = (jj + 0.5) * dy, pp = polar(cx2, cy2), tk = topKm(pp.rk, pp.th);
          if (tk < 0.8) continue;
          var hs = Math.abs(Math.sin(ii * 12.9898 + jj * 78.233) * 43758.5453) % 1, hs2 = Math.abs(Math.sin(ii * 39.3468 + jj * 11.135) * 24634.6345) % 1;
          cx2 += (hs - 0.5) * dx * 0.7; cy2 += (hs2 - 0.5) * dy * 0.7;
          var zt = ZW + tk * ZK, zb = tk > 3 ? ZB : ZW + tk * ZK * 0.4, sh = I.P(cx2, cy2, ZW);
          ctx.globalAlpha = 0.22; ctx.drawImage(PUFF[0], sh.x - 11, sh.y - 6, 22, 12); ctx.globalAlpha = 1;
          for (var zz = zb; zz < zt + 0.1; zz += 15) {
            var z2 = Math.min(zz, zt), q2 = I.P(cx2, cy2, z2), lvl = clamp(Math.round((z2 - ZW) / ZK / 4), 1, 3), rr3 = (z2 === zt ? 11 : 9.5) * (0.8 + 0.4 * hs);
            ctx.drawImage(PUFF[lvl], q2.x - rr3, q2.y - rr3, rr3 * 2, rr3 * 2);
            if (z2 === zt) break;
            if (zz + 15 > zt) zz = zt - 15;
          }
        }
      }
      ctx.restore();
      basePh = ph;
    }

    function drawModel() {
      if (!base || Math.abs(ph - basePh) > 0.03) paintBase();
      ctx.drawImage(base, 0, 0, W, DH);
      ctx.save(); ctx.beginPath(); ctx.roundRect(0, 0, W, DH, 14); ctx.clip();
      /* 앞면 단면: 구름 아래 비의 장막 + 잘린 구름 + 빗줄기 */
      I.face(ctx, "front", function (Lw) {
        var u, st = 3;
        ctx.beginPath(); ctx.moveTo(0, ZW);
        for (u = 0; u <= Lw; u += st) ctx.lineTo(u, frontZ(u) > ZB + 2.5 * ZK ? ZB : ZW);
        ctx.lineTo(Lw, ZW); ctx.closePath();
        ctx.fillStyle = "rgba(120,140,170,.5)"; ctx.fill();
        ctx.beginPath(); ctx.moveTo(0, ZB);
        for (u = 0; u <= Lw; u += st) ctx.lineTo(u, Math.max(frontZ(u), ZB));
        ctx.lineTo(Lw, ZB); ctx.closePath();
        var g = ctx.createLinearGradient(0, ZB, 0, ZW + 15 * ZK);
        g.addColorStop(0, "#8d9ab0"); g.addColorStop(.4, "#d3dbe6"); g.addColorStop(1, "#fbfcfe");
        ctx.fillStyle = g; ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,.95)"; ctx.lineWidth = 2; ctx.stroke();
        ctx.save(); ctx.clip();
        var R = K.rng(23);
        for (var i = 0; i < 220; i++) { ctx.fillStyle = "rgba(255,255,255," + (0.1 + R() * 0.25).toFixed(2) + ")"; ctx.beginPath(); ctx.arc(R() * Lw, ZB + R() * 14 * ZK, 3 + R() * 7, 0, 6.2832); ctx.fill(); }
        ctx.restore();
        /* 눈: 구름 없이 갠 하늘(하강 기류) */
        var eg = ctx.createLinearGradient(0, ZW, 0, ZW + 15 * ZK); eg.addColorStop(0, "rgba(120,200,255,.55)"); eg.addColorStop(1, "rgba(200,235,255,.25)");
        ctx.fillStyle = eg; ctx.fillRect(XC - 17 * KS, ZW, 34 * KS, 15 * ZK);
        ctx.strokeStyle = "rgba(190,215,255,.55)"; ctx.lineWidth = 1;
        for (u = 4; u < Lw; u += 7) {
          if (frontZ(u) < ZB + 2.5 * ZK) continue;
          var o = ((u * 13 + t * 9) % 12);
          ctx.beginPath(); ctx.moveTo(u, ZB - o * 0.3); ctx.lineTo(u - 1.5, ZW + 1); ctx.stroke();
        }
      });
      I.shade(ctx, "right", function () { return ZW; });
      /* 공기의 흐름(앞면 위, 양쪽 대칭) */
      var N = 9, k, side;
      for (side = -1; side <= 1; side += 2) {
        for (k = 0; k < N; k++) {
          var f = ((k / N) + t * 0.004) % 1, p = pathPt(f), q = I.P(U(p.rk, side), D, p.z);
          var col = f < 0.5 ? "rgba(255,200,120,.95)" : (f < 0.72 ? "rgba(255,255,255,.98)" : "rgba(140,200,255,.95)");
          K.glow(ctx, q.x, q.y, 2.6, col, 2.6);
        }
        K.arrow(ctx, I.P(U(300, side), D, ZW + 0.5 * ZK), I.P(U(150, side), D, ZW + 0.5 * ZK), "#ffb35c", 2.6, 10);
        K.arrow(ctx, I.P(U(46, side), D, ZW + 3 * ZK), I.P(U(52, side), D, ZW + 11 * ZK), "#ffffff", 2.6, 10);
        K.arrow(ctx, I.P(U(90, side), D, ZW + 13.6 * ZK), I.P(U(250, side), D, ZW + 12.4 * ZK), "#5fb8ff", 2.6, 10);
      }
      /* 눈: 천천히 내려오는 공기 */
      for (k = 0; k < 3; k++) {
        var fz = ((k / 3) + t * 0.003) % 1, e = I.P(XC + (k - 1) * 6 * KS, D, ZW + (13 - fz * 11) * ZK);
        K.glow(ctx, e.x, e.y, 2.4, "rgba(170,230,255,.95)", 2.6);
      }
      K.arrow(ctx, I.P(XC, D, ZW + 12 * ZK), I.P(XC, D, ZW + 5 * ZK), "#9fe3ff", 2.4, 9);
      /* 지금 보는 거리(노란 선) */
      var mx = XC + r * KS, a1 = I.P(mx, D, 0), a2 = I.P(mx, D, ZW + 16 * ZK), sea = I.P(mx, D, ZW);
      K.line(ctx, a1, a2, "#ffd35a", 2.4, [6, 4]);
      K.glow(ctx, sea.x, sea.y, 4.5, "rgba(255,211,107,.98)", 3.4);
      ctx.restore();

      /* 이름표 */
      var box = [0, W];
      I.label(ctx, XC, D, ZW + 6 * ZK, "태풍의 눈 · 하강 기류, 하늘이 갬", -150, 80, "#bfe6ff", box);
      I.label(ctx, U(40, 1), D, ZW + 12 * ZK, "눈벽구름 · 가장 강한 상승 기류", 70, -120, "#ffb3c0", box);
      /* 나선 강우대: 지금 띠가 지나는 자리(230 km)를 찾아 가리킨다 */
      for (k = -2; k <= 3; k++) {
        var th = ph - (230 - 120) / 76 + k * Math.PI, sx = XC + 230 * KS * Math.cos(th), sy = D - 230 * KS * Math.sin(th);
        if (Math.sin(th) > 0.15 && sx > 10 && sx < L - 10 && sy > 8 && sy < D - 8) { I.label(ctx, sx, sy, zOf(sx, sy), "나선 강우대", -60, -36, "#e8ecff", box); break; }
      }
      I.label(ctx, U(250, -1), D, ZW * 0.5, "따뜻한 바다 · 수증기가 연료", -40, 40, "#ffd9a8", box);
      var sp = I.P(U(300, -1), D, ZW + 0.5 * ZK); K.pill(ctx, "수렴 · 빨려 드는 바람", sp.x - 6, sp.y - 12, { s: 11, a: "right", c: "#ffc98a", box: box });
      var op = I.P(U(260, -1), D, ZW + 12.4 * ZK); K.pill(ctx, "발산 · 꼭대기에서 퍼져 나감", op.x - 8, op.y - 6, { s: 11, a: "right", c: "#9fd3ff", box: box });
      var tp = I.P(XC + r * KS, D, ZW + 16 * ZK);
      K.pill(ctx, "지금 보는 거리 " + r + " km", tp.x, tp.y - 6, { s: 12, a: "center", c: "#ffd35a", box: box });

      /* 큰 제목 */
      var z0 = zone(r), vv = wind(r);
      var HL = { "태풍의 눈": ["태풍의 눈 — 갑자기 잠잠하다", "#bfe6ff"], "눈벽구름": ["눈벽구름 — 가장 사나운 바람", "#ff8fa3"],
        "나선 강우대": ["나선 강우대 — 띠 모양 비바람", "#ffd35a"], "태풍 바깥 영역": ["태풍 바깥 — 바람이 잦아든다", "#ffffff"] }[z0];
      K.bigText(ctx, HL[0], 22, 50, 26, HL[1]);
      K.bigText(ctx, r + " km · 풍속 " + vv.toFixed(1) + " m/s · " + pres(r).toFixed(0) + " hPa", 22, 82, 17, "#ffffff");
      K.warn(ctx, W - 14, 28, "⚠ 높이는 약 13배 과장 · 구름띠는 모식적", "right");
      K.t(ctx, "상륙할 때 매미의 중심 기압은 954 hPa 이었습니다. 그날 제주에서는 최대 순간 풍속 60.0 m/s가 기록되었습니다.", 22, DH - 14, { s: 11, c: "#4a5872" });
    }

    function drawChart() {
      var y0 = DH + 8, h = H - y0, p = pres(r), vv = wind(r);
      K.studio(ctx, 0, y0, W, h);
      var RW = 236;
      var g = K.chart(ctx, { light: true, x: 4, y: y0 + 22, w: W - RW - 8, h: h - 24, pt: 10, pb: 30, x0: 0, x1: 400, y0: 0, y1: 55, xt: 4, yt: 5, xl: "중심에서의 거리(km) →", xf: function (q) { return q + ""; } });
      K.pill(ctx, "중심에서 멀어지며 재 보기", 14, y0 + 22, { s: 12, c: "#a9dcff" });
      function YP(pp) { return g.B - (pp - 950) / 62 * (g.B - g.T); }
      [[0, 25, "rgba(20,40,90,.05)"], [25, 70, "rgba(224,49,49,.12)"], [70, 250, "rgba(28,126,214,.07)"]].forEach(function (z) { ctx.fillStyle = z[2]; ctx.fillRect(g.X(z[0]), g.T, g.X(z[1]) - g.X(z[0]), g.B - g.T); });
      var pw = [], pp2 = [];
      for (var k2 = 0; k2 <= 200; k2++) { pw.push([k2 * 2, wind(k2 * 2)]); pp2.push([k2 * 2, (pres(k2 * 2) - 950) / 62 * 55]); }
      K.plot(ctx, g, pw, LT.red, { light: true, w: 3 });
      K.plot(ctx, g, pp2, LT.violet, { light: true, w: 3 });
      K.pill(ctx, "풍속(m/s)", g.X(78), g.Y(50) + 4, { s: 11, c: "#ffb3b3" });
      K.pill(ctx, "기압", g.X(330), YP(pres(330)) - 10, { s: 11, c: "#d6c8ff" });
      K.line(ctx, { x: g.X(r), y: g.T }, { x: g.X(r), y: g.B }, "#f59f00", 2.4);
      [[g.Y(vv), LT.red], [YP(p), LT.violet]].forEach(function (q) { ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(g.X(r), q[0], 5.5, 0, 6.2832); ctx.fill(); ctx.strokeStyle = q[1]; ctx.lineWidth = 2.8; ctx.stroke(); });
      /* 오른쪽 흰 판정 카드 */
      var rx = W - RW + 4, z0 = zone(r), cw = RW - 12, x1 = rx + cw - 16;
      K.card(ctx, rx, y0 + 6, cw, h - 14, "거리 " + r + " km");
      K.t(ctx, z0, rx + 16, y0 + 66, { s: 19, w: "900", c: z0 === "눈벽구름" ? LT.red : (z0 === "태풍의 눈" ? LT.blue : LT.orange) });
      K.row(ctx, "풍속", vv.toFixed(1) + " m/s", rx + 16, x1, y0 + 96, LT.red);
      K.row(ctx, "기압", p.toFixed(1) + " hPa", rx + 16, x1, y0 + 120, LT.violet);
      var DS = { "태풍의 눈": ["하강 기류 — 바람이 약하고", "하늘이 갠다"], "눈벽구름": ["가장 강한 상승 기류 —", "최대 풍속과 폭우"],
        "나선 강우대": ["돌풍성 비바람이 띠를 이루며", "지나간다"], "태풍 바깥 영역": ["구름이 많고 바람이", "조금 강한 정도"] }[z0];
      lt(ctx, DS[0], rx + 16, y0 + 150, { s: 12, c: LT.ink });
      lt(ctx, DS[1], rx + 16, y0 + 168, { s: 12, c: LT.ink });
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      drawModel();
      drawChart();

      var ch = false, vv = wind(r);
      if (Math.abs(r - RM) <= 10 && !got.a) { got.a = ch = true; }
      if (r <= 20 && !got.b) { got.b = ch = true; }
      if (vv <= VMAX / 2 && r > RM && !got.c) { got.c = ch = true; }
      if (ch) { window.sthState("dCross", got); mission(); }

      $("d-cross-info").innerHTML = "태풍은 <b>중심으로 갈수록 기압이 낮아집니다.</b> 그런데 풍속은 중심에서 최대가 아니라 <b>눈벽구름</b>에서 가장 셉니다. 눈 안쪽은 하강 기류라 바람이 약하고 하늘이 갭니다. 태풍이 지나갈 때 잠깐 잠잠해지는 것은 태풍이 끝나서가 아니라 <b>눈이 지나가는 중</b>이기 때문입니다.";
    }
    function mission() {
      if (got.a) done("m4-3a"); if (got.b) done("m4-3b"); if (got.c) done("m4-3c");
      if (got.a && got.b && got.c) {
        window.sthMission("m4-3", true, "<span class='m-tag'>미션 완료</span>최대 풍속은 중심이 아니라 <b>눈벽구름(약 45 km)</b>에서. 눈 안쪽은 잠잠하고, 180 km 쯤 나가면 풍속이 절반으로 떨어집니다.");
        ep.clear(2);
      }
    }
    canvas._redraw = draw;
    $("d-r").addEventListener("input", function (e) { r = +e.target.value; $("d-r-val").textContent = r + " km"; draw(); });
    draw(); mission();
    var playC = playBtn("d-cross-play");
    var acc = 0;
    anim(canvas, function (dt) { if (!playC.on) return; t += dt / 70; ph += dt / 1000 * 0.12; acc += dt; if (acc >= 45) { acc = 0; draw(); } });
  })();

  /* ---- 장면4 위험 반원 ---- */
  (function () {
    var canvas = $("d-c-half"), ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var side = "R", vm = 0;
    var got = window.sthState("dHalf") || { a: false, b: false, c: false };
    var VROT = 40;

    function vAt(sd) { return sd === "R" ? VROT + vm : Math.max(0, VROT - vm); }

    var th = 0;
    /* 블록 모형: 바다 한 판 위의 태풍(위에서 본 나선 구름 + 해수면 위 바람 화살표). 태풍은 북쪽(오른쪽 위)으로 간다.
       진행 방향 오른쪽 반원(빨강) = 회전 바람 + 이동 속도, 왼쪽 반원(초록) = 회전 바람 − 이동 속도. 오른쪽 흰 카드 = 두 반원 풍속 막대 */
    var I = K.iso({ ox: 252, oy: 204, s: 0.64, L: 330, D: 330 }), ZS = 22, CX = 165, CY = 175, RR = 120;
    var paintH = cache(canvas, W, H);
    function half(c, right, col) {
      c.beginPath(); var a0 = right ? -Math.PI / 2 : Math.PI / 2;
      var p0 = I.P(CX, CY, ZS); c.moveTo(p0.x, p0.y);
      for (var k = 0; k <= 30; k++) { var a = a0 + k / 30 * Math.PI, q = I.P(CX + RR * Math.cos(a), CY + RR * Math.sin(a), ZS); c.lineTo(q.x, q.y); }
      c.closePath(); c.fillStyle = col; c.fill();
    }
    function paintBase(c) {
      var fc = I.P(I.L / 2, I.D / 2, 0);
      K.studio(c, 0, 0, W, H, { x: fc.x, y: fc.y + 14, rx: 260, ry: 70 });
      ["front", "right"].forEach(function (side) { I.face(c, side, function (Lw) {
        var g = c.createLinearGradient(0, 0, 0, ZS); g.addColorStop(0, "#0a2350"); g.addColorStop(1, "#2f86c4"); c.fillStyle = g; c.fillRect(0, 0, Lw, ZS);
      }); });
      I.shade(c, "front", function () { return ZS; }); I.shade(c, "right", function () { return ZS; });
      I.plane(c, ZS, "#3f93d2", "rgba(255,255,255,.85)");
      half(c, true, "rgba(240,62,62,.30)"); half(c, false, "rgba(15,159,118,.28)");
      c.strokeStyle = "rgba(255,255,255,.9)"; c.lineWidth = 1.4; c.beginPath();
      for (var k = 0; k <= 60; k++) { var a = k / 60 * 6.2832, q = I.P(CX + RR * Math.cos(a), CY + RR * Math.sin(a), ZS); if (k) c.lineTo(q.x, q.y); else c.moveTo(q.x, q.y); }
      c.stroke();
      var t0 = I.P(CX, CY - RR, ZS), t1 = I.P(CX, CY + RR, ZS); c.setLineDash([5, 5]); c.beginPath(); c.moveTo(t0.x, t0.y); c.lineTo(t1.x, t1.y); c.stroke(); c.setLineDash([]);
      I.edges(c, ZS, ZS);
      var BX = [0, 480];
      I.label(c, CX + RR * 0.9, CY - RR * 0.2, ZS, "위험 반원", 30, -6, "#ffb3b3", BX);
      I.label(c, CX - RR * 0.86, CY - RR * 0.5, ZS, "가항 반원", -30, -14, "#9ff0cf", BX);
    }
    var PUFF = (function () { var o = [], a, s2; for (a = 0; a < 4; a++) for (s2 = 0; s2 <= 10; s2++) { var fr = s2 / 10; o.push([a * Math.PI / 2 + fr * 2.6, 14 + fr * RR * .9, 12 - fr * 4]); } return o; })();
    function draw() {
      var vR = vAt("R"), vL = vAt("L"), vv = vAt(side), k;
      paintH(ctx, 1, paintBase);
      /* 관측 도시 */
      var ox = CX + (side === "R" ? 1 : -1) * RR * 0.95, oy = CY + 26;
      I.house(ctx, ox - 6, oy - 5, ZS, 12, 10, 8); I.house(ctx, ox + 8, oy + 6, ZS, 10, 9, 6);
      /* 구름 소용돌이(시계 반대 방향) */
      var rot = -th * 0.02, P2 = PUFF.map(function (q) { return [CX + Math.cos(q[0] + rot) * q[1], CY + Math.sin(q[0] + rot) * q[1], ZS + 30, q[2]]; });
      P2.sort(function (a, b) { return (a[0] + a[1]) - (b[0] + b[1]); });
      P2.forEach(function (q) { puff3(ctx, I, q[0], q[1], q[2], q[3], false, 0.62); });
      /* 회전 바람 + 이동 속도 화살표 */
      for (k = 0; k < 12; k++) {
        var ang = k / 12 * Math.PI * 2 - th * 0.03, x = CX + Math.cos(ang) * RR * 0.72, y = CY + Math.sin(ang) * RR * 0.72;
        var tx = Math.sin(ang) * VROT, ty = -Math.cos(ang) * VROT - vm, L1 = (8 + Math.sqrt(tx * tx + ty * ty) * 0.42) / Math.sqrt(tx * tx + ty * ty + 1e-6);
        var a0 = I.P(x - tx * L1 * .5, y - ty * L1 * .5, ZS + 8), a1 = I.P(x + tx * L1 * .5, y + ty * L1 * .5, ZS + 8);
        arr(ctx, a0, a1, "#ffffff", 6.5, 13); arr(ctx, a0, a1, "#7048e8", 3.6, 11);
      }
      var e = I.P(CX, CY, ZS + 2); K.planet(ctx, e.x, e.y, 9, "#ffd0d6", "#c0263e");
      /* 이동 방향 */
      var m0 = I.P(CX, CY - 16, ZS + 40), m1 = I.P(CX, CY - RR - 40, ZS + 40);
      arr(ctx, m0, m1, "#ffffff", 9, 18); arr(ctx, m0, m1, "#f59f00", 5.5, 15);
      K.pill(ctx, "진행 방향 (북쪽)", m1.x + 10, m1.y - 2, { s: 12, c: "#ffd35a", box: [0, 480] });
      var cp = I.P(ox, oy, ZS); K.pill(ctx, "관측 도시", cp.x + (side === "R" ? 14 : -14), cp.y + 26, { s: 11.5, a: side === "R" ? "left" : "right", c: "#ffffff", box: [0, 480] });
      bigHead(ctx, (side === "R" ? "오른쪽 " : "왼쪽 ") + vv.toFixed(1) + " m/s", side === "R" ? "위험 반원 · 회전 바람 + 이동 속도" : "가항 반원 · 회전 바람 − 이동 속도", side === "R" ? "#ffb3b3" : "#9ff0cf", 18, 42);
      K.warn(ctx, 16, H - 12, "⚠ 보라 화살표 길이 = 실제로 부는 바람의 세기", "left");

      /* ── 오른쪽 흰 카드: 계산 막대 ── */
      var RX = 488, RW = W - RX - 12, x0 = RX + 18, x1 = W - 30, bw = RW - 130;
      K.card(ctx, RX, 12, RW, H - 24, "회전 바람 ± 이동 속도");
      lt(ctx, "회전 바람 " + VROT + " m/s + 이동 속도 " + vm.toFixed(1) + " m/s", x0, 66, { s: 12.5, c: LT.ink, w: "800" });
      [["오른쪽 (위험 반원)", vR, "#e03131"], ["왼쪽 (가항 반원)", vL, "#0f9f76"]].forEach(function (b, i) {
        var yy = 110 + i * 70;
        lt(ctx, b[0], x0, yy, { s: 12.5, c: b[2], w: "900" });
        ctx.fillStyle = "#e3e9f1"; ctx.beginPath(); ctx.roundRect(x0, yy + 10, bw, 20, 10); ctx.fill();
        ctx.fillStyle = b[2]; ctx.beginPath(); ctx.roundRect(x0, yy + 10, Math.max(8, bw * clamp(b[1] / 60, 0, 1)), 20, 10); ctx.fill();
        K.t(ctx, b[1].toFixed(1) + " m/s", x1, yy + 26, { s: 16, w: "900", a: "right", c: b[2] });
      });
      K.row(ctx, "두 반원의 차이", (vR - vL).toFixed(1) + " m/s", x0, x1, 268, LT.yellow);
      K.row(ctx, "내가 고른 자리의 풍속", vv.toFixed(1) + " m/s", x0, x1, 296, LT.ink);
      K.tip(ctx, "북반구 태풍의 바람은 시계 반대 방향", x0 - 4, 312, RW - 28, null);
      lt(ctx, "오른쪽에서는 회전 바람과 이동이 더해집니다.", x0, 372, { s: 11.5, c: LT.ink });
      lt(ctx, "매미는 상륙 뒤 북동쪽으로 달렸습니다.", x0, 402, { s: 11 });
      lt(ctx, "진로의 동쪽 도시들이 위험 반원에 들었습니다.", x0, 420, { s: 11 });

      var ch = false;
      if (side === "R" && vR >= 55 && !got.a) { got.a = ch = true; }
      if (side === "L" && vL <= 28 && !got.b) { got.b = ch = true; }
      if (ch) { window.sthState("dHalf", got); mission(); }

      $("d-half-info").innerHTML = "태풍의 바람은 <b>회전</b>과 <b>이동</b>이 겹쳐진 것입니다. 진행 방향 오른쪽에서는 두 속도가 <b>더해지고</b>, 왼쪽에서는 <b>빼집니다</b>. 그래서 같은 거리라도 오른쪽이 훨씬 셉니다. 이동 속도가 빠른 태풍일수록 좌우 차이가 커집니다.";
    }
    function mission() {
      if (got.a) done("m4-4a"); if (got.b) done("m4-4b"); if (got.c) done("m4-4c");
      if (got.a && got.b && got.c) {
        window.sthMission("m4-4", true, "<span class='m-tag'>미션 완료</span>이동 속도 15 m/s면 오른쪽은 55 m/s, 왼쪽은 25 m/s. 같은 태풍인데 <b>두 배 넘게</b> 차이가 납니다.");
        ep.clear(3);
      }
    }
    canvas._redraw = draw;
    segWire("d-side", function (b) { side = b.getAttribute("data-side"); $("d-side-val").textContent = side === "R" ? "진행 방향 오른쪽" : "진행 방향 왼쪽"; draw(); });
    $("d-vm").addEventListener("input", function (e) { vm = +e.target.value; $("d-vm-val").textContent = vm.toFixed(1) + " m/s"; draw(); });
    window.sthPick({
      mount: "d-q1",
      q: "태풍이 남해안에 상륙한 뒤 북동쪽으로 이동했습니다. 위험 반원에 든 곳은 어디일까요?",
      options: ["진로의 동쪽(남동쪽) 지역", "진로의 서쪽(북서쪽) 지역", "진로 위의 지역만", "태풍이 지나간 뒤의 지역만"],
      answer: 0,
      why: [
        "맞습니다. 진행 방향이 북동쪽이면 그 오른쪽은 남동쪽입니다. 회전 바람과 이동 속도가 더해져 바람이 가장 세고, 바다 쪽에서 밀려드는 바람이라 폭풍 해일 피해도 커집니다.",
        "서쪽은 회전 바람에서 이동 속도가 <b>빠지는</b> 가항 반원입니다.",
        "진로 바로 위는 눈이 지나가면 오히려 잠시 잠잠해집니다.",
        "지나간 뒤인지 아닌지가 아니라, <b>진행 방향의 어느 쪽</b>인지가 갈라놓습니다."
      ],
      onDone: function () { got.c = true; window.sthState("dHalf", got); mission(); }
    });
    draw(); mission();
    var playH = playBtn("d-half-play");
    anim(canvas, function (dt) { if (playH.on) { th += dt / 70; draw(); } });
  })();

  /* ---- 장면5 악기상 ---- */
  var GOT5 = window.sthState("dWx") || { a: false, b: false, c: false, d: false };
  function mission5() {
    if (GOT5.a) done("m4-5a"); if (GOT5.b) done("m4-5b"); if (GOT5.c) done("m4-5c"); if (GOT5.d) done("m4-5d");
    if (GOT5.a && GOT5.b && GOT5.c && GOT5.d) {
      window.sthMission("m4-5", true, "<span class='m-tag'>미션 완료</span>악기상은 저마다 <b>발생 조건</b>이 있습니다. 뇌우와 집중 호우는 여름의 강한 상승 기류, 서해안 폭설은 <b>해기차</b>, 황사는 건조한 땅과 <b>편서풍</b>입니다.");
      ep.clear(4); ep.clear(5);
    }
  }
  (function () {
    var canvas = $("d-c-storm"), ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var stage = 0, seen = window.sthState("dStage") || [false, false, false];
    var NAMES = ["적운 단계", "성숙 단계", "소멸 단계"];
    var TEXTS = [
      "따뜻하고 습한 공기가 올라가며 <b>적운</b>이 자랍니다. 구름 속은 온통 <b>상승 기류</b>뿐이라 아직 비는 내리지 않습니다.",
      "구름이 <b>적란운</b>으로 자라 꼭대기가 대류권 위쪽까지 닿고, 구름 속에 <b>상승 기류와 하강 기류가 함께</b> 있습니다. 강한 소나기·번개·돌풍이 나타나는 가장 위험한 단계이고, 상승과 하강을 되풀이한 얼음 알갱이가 커져 <b>우박</b>으로 떨어지기도 합니다.",
      "하강 기류가 구름 전체를 채우면서 상승 기류가 사라지고, 비가 약해지며 구름이 흩어집니다."
    ];

    var ts = 0;
    /* 블록 모형: 땅 한 판(밭·마을) 위에서 자라는 뇌우 구름(입체 솜). 단계마다 구름 높이·모루·상승/하강 기류 화살표·비·번개가 바뀐다.
       오른쪽 흰 카드 = 단계 판정 */
    var I = K.iso({ ox: 300, oy: 266, s: 0.6, L: 300, D: 220 }), ZG = 14, CX = 150, CY = 110;
    var paintS2 = cache(canvas, W, H);
    var CL = [
      (function () { var R = K.rng(41), o = [], i; for (i = 0; i < 16; i++) { var a = R() * 6.283, r = 34 * Math.sqrt(R()); o.push([Math.cos(a) * r, Math.sin(a) * r * .8, 70 + (i / 16) * 80, 20 + R() * 8]); } return o; })(),
      (function () { var R = K.rng(43), o = [], i; for (i = 0; i < 34; i++) { var a = R() * 6.283, r = 40 * Math.sqrt(R()) * (1 - i / 60); o.push([Math.cos(a) * r, Math.sin(a) * r * .8, 70 + (i / 34) * 220, 20 + R() * 9]); } for (i = 0; i < 22; i++) { var a2 = R() * 6.283, r2 = Math.sqrt(R()); o.push([Math.cos(a2) * r2 * 120 + 30, Math.sin(a2) * r2 * 40, 290 + R() * 14, 15 + R() * 5]); } return o; })(),
      (function () { var R = K.rng(47), o = [], i; for (i = 0; i < 18; i++) { var a = R() * 6.283, r = 60 * Math.sqrt(R()); o.push([Math.cos(a) * r, Math.sin(a) * r * .8, 110 + R() * 70, 16 + R() * 8]); } return o; })()
    ];
    function paintBase(c) {
      var fc = I.P(I.L / 2, I.D / 2, 0);
      K.studio(c, 0, 0, W, H, { x: fc.x, y: fc.y + 14, rx: 250, ry: 64 });
      I.box(c, 0, 0, 0, I.L, I.D, ZG, "#8fb36a", "#6d5a44", "#56473a");
      /* 밭 줄무늬 */
      for (var k = 0; k < 6; k++) { var x0 = 14 + k * 46; I.quad(c, I.P(x0, 150, ZG), I.P(x0 + 36, 150, ZG), I.P(x0 + 36, 210, ZG), I.P(x0, 210, ZG), k % 2 ? "#c9b46a" : "#a7c36e"); }
      [[230, 30], [262, 52], [240, 76]].forEach(function (q) { I.house(c, q[0], q[1], ZG, 14, 12, 10); });
      [[30, 30], [60, 60], [20, 90], [270, 120], [110, 20]].forEach(function (q) { I.tree(c, q[0], q[1], ZG, 1.2); });
      I.edges(c, ZG, ZG);
    }
    function draw() {
      paintS2(ctx, 1, paintBase);
      var i, BX = [0, 590];
      /* 비 */
      if (stage > 0) {
        var R = K.rng(3), n = stage === 1 ? 46 : 16;
        ctx.strokeStyle = stage === 1 ? "rgba(30,80,170,.7)" : "rgba(30,80,170,.4)"; ctx.lineWidth = stage === 1 ? 1.6 : 1.1;
        for (i = 0; i < n; i++) {
          var rx = CX + 10 + (R() - .3) * 70, ry = CY + (R() - .5) * 60, zt = 70 - ((R() * 60 + ts * (stage === 1 ? 5 : 2.5)) % 54);
          var a = I.P(rx, ry, zt), b = I.P(rx, ry, zt - 10); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x - 2, b.y); ctx.stroke();
        }
      }
      /* 구름 */
      var dark = stage > 0;
      CL[stage].slice().sort(function (p, q) { return (p[0] + p[1] + 1.4 * p[2]) - (q[0] + q[1] + 1.4 * q[2]); })
        .forEach(function (q) { puff3(ctx, I, CX + q[0], CY + q[1], q[2], q[3], dark && q[2] < 200); });
      /* 기류 화살표 */
      function flow(x, up, col, glow) {
        var za = up ? ZG + 4 : 150, zb = up ? 150 : ZG + 6, p0 = I.P(x, CY + 50, za), p1 = I.P(x, CY + 50, zb);
        arr(ctx, p0, p1, "#ffffff", 7, 15); arr(ctx, p0, p1, col, 4, 13);
        for (var k = 0; k < 5; k++) { var u = ((k / 5) + ts * 0.013) % 1, pp = I.P(x, CY + 50, za + (zb - za) * u); ctx.globalAlpha = Math.sin(u * Math.PI); K.glow(ctx, pp.x, pp.y, 2.2, glow, 2.8); ctx.globalAlpha = 1; }
      }
      if (stage === 0) { flow(CX - 30, true, "#e8590c", "rgba(255,170,90,.95)"); flow(CX + 30, true, "#e8590c", "rgba(255,170,90,.95)"); }
      else if (stage === 1) { flow(CX - 46, true, "#e8590c", "rgba(255,170,90,.95)"); flow(CX + 56, false, "#1c7ed6", "rgba(120,190,255,.95)"); }
      else flow(CX, false, "#1c7ed6", "rgba(120,190,255,.95)");
      /* 번개: 가끔 번쩍 */
      if (stage === 1 && (ts % 60) < 3) {
        var l0 = I.P(CX + 4, CY, 120), l1 = I.P(CX - 6, CY, 90), l2 = I.P(CX + 6, CY, 80), l3 = I.P(CX - 10, CY, ZG);
        ctx.save(); ctx.strokeStyle = "#fff3a0"; ctx.lineWidth = 3; ctx.shadowColor = "#ffd43b"; ctx.shadowBlur = 16;
        ctx.beginPath(); ctx.moveTo(l0.x, l0.y); ctx.lineTo(l1.x, l1.y); ctx.lineTo(l2.x, l2.y); ctx.lineTo(l3.x, l3.y); ctx.stroke(); ctx.restore();
      }
      if (stage === 0) { var sp = I.P(I.L - 20, 20, 240); K.sun(ctx, sp.x, sp.y, 14); }
      if (stage === 1) I.label(ctx, CX + 90, CY, 298, "대류권 위쪽까지 자란 꼭대기(모루)", 20, -20, "#ffffff", BX);
      var lab = stage === 0 ? "상승 기류만 있다" : (stage === 1 ? "상승 기류 + 하강 기류 · ⚡ 번개·우박·돌풍" : "하강 기류만 남고 비가 약해진다");
      var lp = I.P(CX, I.D, ZG);
      K.pill(ctx, lab, lp.x - 20, lp.y + 28, { s: 12.5, a: "center", c: stage === 0 ? "#ffd0a8" : "#a9dcff", box: BX });
      if (stage === 0) K.pill(ctx, "햇볕에 데워진 땅 → 따뜻하고 습한 공기", 16, 108, { s: 11.5, c: "#ffd0a8" });
      bigHead(ctx, "뇌우의 한살이 — " + NAMES[stage], stage === 1 ? "가장 위험한 단계" : (stage === 0 ? "아직 비는 내리지 않는다" : "구름이 흩어진다"), stage === 1 ? "#ffd35a" : "#ffffff", 18, 42);
      K.warn(ctx, 16, H - 14, "⚠ 구름 높이는 모식적", "left");

      /* ── 오른쪽 흰 카드 ── */
      var RX = 600, RW = W - RX - 12, x0 = RX + 18, x1 = W - 30;
      K.card(ctx, RX, 12, RW, H - 24, "판정");
      K.t(ctx, NAMES[stage], x0, 78, { s: 26, w: "900", c: stage === 1 ? LT.red : (stage === 0 ? LT.orange : LT.blue) });
      K.row(ctx, "상승 기류", stage < 2 ? "있음" : "사라짐", x0, x1, 112, stage < 2 ? LT.orange : LT.dim);
      K.row(ctx, "하강 기류", stage > 0 ? "있음" : "없음", x0, x1, 140, stage > 0 ? LT.blue : LT.dim);
      K.row(ctx, "강수", stage === 0 ? "아직 없음" : (stage === 1 ? "강한 소나기·우박" : "약해짐"), x0, x1, 168, stage === 1 ? LT.red : LT.ink);
      K.row(ctx, "구름 꼭대기", stage === 1 ? "대류권 위쪽(모루)" : (stage === 0 ? "낮은 적운" : "낮아짐"), x0, x1, 196);
      K.tip(ctx, stage === 1 ? "가장 위험한 단계입니다" : (stage === 0 ? "구름이 자라는 중" : "곧 흩어집니다"), x0 - 4, 214, RW - 28, stage === 1 ? false : true);
      lt(ctx, "세 단계를 모두 눌러 보세요.", x0, 290, { s: 11.5, c: LT.ink });
      lt(ctx, "뇌우가 한곳에 오래 머물거나 잇따라", x0, 330, { s: 11.5 });
      lt(ctx, "지나가면 집중 호우가 됩니다.", x0, 348, { s: 11.5 });

      $("d-storm-info").innerHTML = "<b>" + NAMES[stage] + "</b> — " + TEXTS[stage];
      if (!seen[stage]) { seen[stage] = true; window.sthState("dStage", seen); check(); }
    }
    function check() {
      if (seen[0] && seen[1] && seen[2] && !GOT5.a) { GOT5.a = true; window.sthState("dWx", GOT5); }
      mission5();
    }
    canvas._redraw = draw;
    segWire("d-stage", function (b) { stage = +b.getAttribute("data-s"); $("d-stage-val").textContent = NAMES[stage]; draw(); });
    draw(); check();
    var playS = playBtn("d-storm-play");
    anim(canvas, function (dt) { if (playS.on) { ts += dt / 70; draw(); } });
  })();

  (function () {
    var canvas = $("d-c-snow"), ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var air = -5, sea = 6;

    var tw = 0;
    /* 블록 모형: 서해와 서해안을 잘라 낸 블록. x = 서(바다) → 동(서해안 육지). 찬 공기가 서쪽에서 불어와 따뜻한 바다 위를 건너며
       김(수증기)을 받아 눈구름(입체 솜)이 자라고, 해안에 눈이 내린다. 해기차가 클수록 구름이 높다. 오른쪽 흰 카드 = 해기차 판정 */
    var I = K.iso({ ox: 200, oy: 186, s: 0.56, L: 480, D: 200 }), ZS = 30, XC = 330;
    function coast(y) { return XC + 10 * Math.sin(y / 23) + 6 * Math.sin(y / 9); }
    function zG(x, y) { var c = coast(y); return x < c ? ZS : ZS + Math.min(16, (x - c) * 0.35) + 4 * Math.sin(x / 19) * Math.cos(y / 23) * (x > c + 20 ? 1 : 0); }
    var paintW = cache(canvas, W, H);
    function paintBase(c, snowy) {
      var fc = I.P(I.L / 2, I.D / 2, 0);
      K.studio(c, 0, 0, W, H, { x: fc.x, y: fc.y + 10, rx: 260, ry: 56 });
      I.field(c, zG, function (x, y, z, l) {
        if (z <= ZS + 0.3) return tCol(sea, 1.02);
        return snowy ? K.tint("#eef3f9", l) : K.tint(z > ZS + 12 ? "#8d9a6a" : "#9fb27a", l);
      }, 60, 24);
      ["front", "right"].forEach(function (side) { I.face(c, side, function (Lw) {
        function g0(u) { return side === "front" ? zG(Math.min(u, I.L - .1), I.D - .1) : zG(I.L - .1, Math.min(u, I.D - .1)); }
        var wg = c.createLinearGradient(0, 0, 0, ZS); wg.addColorStop(0, "#0a2350"); wg.addColorStop(1, tCol(sea, .85));
        c.fillStyle = wg; c.fillRect(0, 0, Lw, ZS);
        c.beginPath(); c.moveTo(0, 0);
        for (var u = 0; u <= Lw; u += 4) { var gz = g0(u); c.lineTo(u, gz > ZS ? gz : ZS * 0.35 * (side === "front" ? Math.max(0, (u - 200) / 130) : 1)); }
        c.lineTo(Lw, 0); c.closePath();
        var rg = c.createLinearGradient(0, 0, 0, ZS + 16); rg.addColorStop(0, "#3e3128"); rg.addColorStop(1, "#8c6c48"); c.fillStyle = rg; c.fill();
      }); });
      I.shade(c, "front", function (u) { return zG(Math.min(u, I.L - .1), I.D - .1); }); I.shade(c, "right", function (u) { return zG(I.L - .1, Math.min(u, I.D - .1)); });
      I.edges(c, ZS, ZS);
      [[XC + 60, 40], [XC + 90, 120], [XC + 120, 70], [XC + 50, 170]].forEach(function (q) { I.house(c, q[0], q[1], zG(q[0], q[1]), 12, 10, 8, snowy ? "#f2f5fa" : null); });
      var BX = [0, 470];
      I.label(c, 80, I.D - 20, ZS, "서해 (수온 " + sea.toFixed(1) + " ℃)", -20, 40, "#cfe8ff", BX);
      I.label(c, XC + 110, I.D - 10, zG(XC + 110, I.D - 10), "서해안", 16, 34, "#e2f2cf", BX);
    }
    function draw() {
      var dT = sea - air, strong = dT >= 15, weak = dT <= 10, i;
      var ch = clamp((dT - 4) * 9, 0, 150);
      paintW(ctx, sea + "|" + (strong ? 1 : 0), function (c) { paintBase(c, strong); });
      var BX = [0, 470];
      /* 바다 김 */
      var R = K.rng(8), nSteam = Math.round(clamp(dT, 0, 30));
      for (i = 0; i < nSteam; i++) {
        var sx = 20 + R() * (XC - 50), sy = 10 + R() * (I.D - 20), ph = (R() + tw * 0.01) % 1, sp = I.P(sx + ph * 14, sy, ZS + ph * 24);
        ctx.globalAlpha = (1 - ph) * .45; ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(sp.x, sp.y, 2.5 + ph * 5, 0, 6.2832); ctx.fill();
      }
      ctx.globalAlpha = 1;
      /* 찬 공기(서 → 동) */
      for (i = 0; i < 3; i++) { var yy = 40 + i * 60, a0 = I.P(-10, yy, ZS + 70), a1 = I.P(80, yy, ZS + 70); arr(ctx, a0, a1, "#ffffff", 8, 16); arr(ctx, a0, a1, "#1c7ed6", 5, 14); }
      var ap = I.P(-10, 40, ZS + 70);
      K.pill(ctx, "시베리아 찬 공기 (" + air + " ℃)", ap.x + 6, ap.y - 14, { s: 12, c: "#a9dcff", box: BX });
      /* 눈구름: 바람을 따라 동쪽으로 갈수록 높이 자란다 */
      if (ch > 12) {
        var P2 = [];
        for (var row = 0; row < 3; row++) for (var j = 0; j < 6; j++) {
          var cx = 100 + j * 46, cy = 36 + row * 64, top = ch * (0.35 + j * 0.13);
          for (var k = 0; k < 5; k++) P2.push([cx + (k % 2 ? 6 : -6), cy + (k % 3) * 5, ZS + 22 + top * (k / 4), 7 + ch * 0.03 + (k === 4 ? 2 : 0)]);
          /* 상승 화살표 */
          if (row === 2 && j % 2 === 0) P2.push(["arr", cx, cy + 20, top]);
        }
        P2.filter(function (q) { return q[0] === "arr"; }).forEach(function (q) { arr(ctx, I.P(q[1], q[2], ZS + 4), I.P(q[1], q[2], ZS + 20 + q[3] * 0.5), "rgba(15,159,118,.9)", 3, 9); });
        P2.filter(function (q) { return q[0] !== "arr"; }).sort(function (p, q) { return (p[0] + p[1] + 1.4 * p[2]) - (q[0] + q[1] + 1.4 * q[2]); })
          .forEach(function (q) { puff3(ctx, I, q[0], q[1], q[2], q[3], strong); });
        var tp = I.P(100 + 5 * 46, 36, ZS + 24 + ch * 1.0);
        K.pill(ctx, "구름 꼭대기 높이 약 " + Math.round(ch * 14) + " m", tp.x + 14, Math.max(tp.y, 112), { s: 11.5, c: "#9ff0cf", box: BX });
        /* 해안에 내리는 눈 */
        var R2 = K.rng(21), nSnow = strong ? 70 : Math.round(ch / 4);
        for (var f = 0; f < nSnow; f++) {
          var fx = XC - 40 + R2() * 150, fy = 10 + R2() * (I.D - 20), fz = ZS + 70 - ((R2() * 60 + tw * 1.4) % 60);
          var fp = I.P(fx + Math.sin(tw * .05 + f) * 3, fy, fz);
          ctx.fillStyle = "#ffffff"; ctx.strokeStyle = "rgba(60,80,110,.35)"; ctx.lineWidth = .6; ctx.beginPath(); ctx.arc(fp.x, fp.y, 1.7 + (f % 3) * .5, 0, 6.2832); ctx.fill(); ctx.stroke();
        }
      }
      bigHead(ctx, "해기차 " + dT.toFixed(1) + " ℃", strong ? "눈구름이 크게 발달 · 서해안 폭설" : (weak ? "공기가 안정 · 눈구름이 자라지 못함" : "구름이 조금 생김"), strong ? "#ffb3b3" : "#ffffff", 18, 42);
      K.warn(ctx, 16, H - 12, "⚠ 구름 높이는 과장", "left");

      /* ── 오른쪽 흰 카드 ── */
      var RX = 478, RW = W - RX - 12, x0 = RX + 18, x1 = W - 30;
      K.card(ctx, RX, 12, RW, H - 24, "해기차 (바다 − 공기)");
      var vc = strong ? LT.red : (weak ? LT.mute : LT.yellow);
      K.t(ctx, dT.toFixed(1) + " ℃", x0, 84, { s: 34, w: "900", c: vc });
      K.tip(ctx, strong ? "눈구름이 크게 발달" : (weak ? "눈구름이 자라지 못함" : "구름이 조금 생김"), x0 - 4, 100, RW - 28, strong ? true : (weak ? false : null));
      var gx = x0 + 6, gw = x1 - x0 - 12, gy = 172;
      function TX(cc) { return gx + clamp((cc + 25) / 40, 0, 1) * gw; }
      ctx.fillStyle = "#e3e9f1"; ctx.beginPath(); ctx.roundRect(gx, gy, gw, 10, 5); ctx.fill();
      var tg = ctx.createLinearGradient(TX(air), 0, TX(sea) + 1, 0); tg.addColorStop(0, LT.blue); tg.addColorStop(1, LT.orange);
      ctx.fillStyle = tg; ctx.fillRect(TX(air), gy, Math.max(2, TX(sea) - TX(air)), 10);
      [[air, LT.blue], [sea, LT.orange]].forEach(function (q) { ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(TX(q[0]), gy + 5, 6.5, 0, 6.2832); ctx.fill(); ctx.strokeStyle = q[1]; ctx.lineWidth = 2.6; ctx.stroke(); });
      lt(ctx, "공기 " + air + " ℃", TX(air), gy + 30, { s: 11, a: "center", c: LT.blue, w: "800" });
      lt(ctx, "바다 " + sea.toFixed(1) + " ℃", TX(sea), gy - 12, { s: 11, a: "center", c: LT.orange, w: "800" });
      lt(ctx, "아래가 따뜻하면 공기가 불안정해져", x0, 248, { s: 11.5, c: LT.ink });
      lt(ctx, "위로 솟습니다.", x0, 266, { s: 11.5, c: LT.ink });
      lt(ctx, "해기차가 클수록 눈구름이 높이 자랍니다.", x0, 296, { s: 11.5 });
      lt(ctx, "찬 공기가 바다에서 열과 수증기를 받아", x0, 326, { s: 11.5 });
      lt(ctx, "불안정해지고 눈구름대가 생깁니다.", x0, 344, { s: 11.5 });

      var chg = false;
      if (dT >= 15 && !GOT5.b) { GOT5.b = chg = true; }
      if (dT <= 10 && !GOT5.c) { GOT5.c = chg = true; }
      if (chg) { window.sthState("dWx", GOT5); mission5(); }

      $("d-snow-info").innerHTML = "바다와 공기의 온도 차를 <b>해기차</b>라고 합니다. 아래가 따뜻하고 위가 차가우면 공기가 <b>불안정</b>해져 힘차게 솟아오르고, 바다에서 받은 수증기가 눈구름을 만듭니다. " +
        (strong ? "지금처럼 해기차가 크면 눈구름대가 크게 발달해 <b>서해안에 폭설</b>이 내릴 수 있습니다." :
          (weak ? "해기차가 작으면 공기가 안정해 눈구름이 자라지 못합니다." : "해기차를 더 키워 보세요."));
    }
    canvas._redraw = draw;
    $("d-air").addEventListener("input", function (e) { air = +e.target.value; $("d-air-val").textContent = air + " ℃"; draw(); });
    $("d-sea").addEventListener("input", function (e) { sea = +e.target.value; $("d-sea-val").textContent = sea.toFixed(1) + " ℃"; draw(); });
    draw();
    var playW = playBtn("d-snow-play");
    anim(canvas, function (dt) { if (playW.on) { tw += dt / 70; draw(); } });

    window.sthSort({
      mount: "d-sort",
      buckets: [
        { id: "t", label: "뇌우·집중 호우", sub: "여름 · 강한 상승 기류" },
        { id: "s", label: "서해안 폭설", sub: "겨울 · 해기차" },
        { id: "y", label: "황사", sub: "봄 · 건조한 땅과 편서풍" }
      ],
      items: [
        { t: "강한 햇볕으로 지표가 달궈진 여름 오후, 대기가 불안정해진다", a: "t", why: "지표 가열은 적란운을 키우는 대표적인 조건입니다." },
        { t: "좁은 지역에 짧은 시간 동안 아주 많은 비가 쏟아진다", a: "t", why: "집중 호우의 정의 그대로입니다." },
        { t: "적란운 속에서 오르내림을 되풀이한 얼음 알갱이가 커져 떨어진다", a: "t", why: "우박은 발달한 적란운에서 만들어집니다.", hint: "상승 기류와 하강 기류가 함께 있는 구름입니다." },
        { t: "시베리아 찬 공기가 상대적으로 따뜻한 서해를 건너며 눈구름대를 만든다", a: "s", why: "해기차가 만드는 겨울철 서해안 폭설입니다." },
        { t: "몽골과 중국 북부의 건조한 땅에서 흙먼지가 강한 바람에 떠오른다", a: "y", why: "황사의 발원지 조건입니다." },
        { t: "떠오른 먼지가 편서풍을 타고 우리나라까지 날아온다", a: "y", why: "편서풍이 먼지를 동쪽으로 실어 나릅니다.", hint: "중위도에서 부는 바람을 생각해 보세요." }
      ],
      onDone: function () { GOT5.d = true; window.sthState("dWx", GOT5); mission5(); }
    });
    mission5();
  })();

  function finish() { window.sthState("r4", "해결 · 진행 방향 오른쪽이 위험 반원, 최대 풍속은 눈벽구름(약 45 km)에서"); }
  function vsD() {
    var p = window.sthState("d-p") || "";
    $("d-vs").innerHTML = "<b>나의 첫 추리</b> " + (p || "기록 없음") + "<br>" +
      (p.indexOf("㉠") === 0 ? "정확했습니다. 그리고 오늘은 그 까닭까지 직접 더해 보았습니다 — 회전 바람 + 이동 속도."
        : "계산해 보니 ㉠ 이었습니다. 회전 바람과 이동 속도가 더해지는 쪽, 곧 <b>진행 방향의 오른쪽</b>이 위험 반원입니다.");
  }
  vsD();
  ep.onShow(vsD);
  window.sthWork({
    mount: "wkD", unitLabel: "[지구과학 Ⅰ-1] 이야기 ④ 매미가 오던 밤",
    items: [
      { id: "d1", label: "상황실장에게 보내는 보고", hint: "진로의 동쪽 도시들의 피해가 컸던 까닭을 ‘회전 바람’과 ‘이동 속도’를 넣어 설명하세요." },
      { id: "d2", label: "악기상 하나 고르기", hint: "집중 호우·폭설·황사 가운데 하나를 골라, 어떤 조건이 갖춰질 때 일어나는지 쓰세요." }
    ]
  });
})();

/* ========================================================================= 05 정리하기 */
window.sthWork({
  mount: "wk", unitLabel: "[지구과학 Ⅰ-1] 해수의 순환과 대기의 변화 — 정리",
  recap: [
    { key: "r1", label: "① 바람과 어긋난 부표" },
    { key: "r2", label: "② 1,000년을 도는 물" },
    { key: "r3", label: "③ 일기도 세 장" },
    { key: "r4", label: "④ 매미가 오던 밤" },
    { key: "rQuiz", label: "수준별 문제" },
    { key: "rLab", label: "응용 실험실" },
    { key: "rInq", label: "교과서 실험" },
    { key: "rReal", label: "실제 자료" }
  ],
  items: [
    { id: "all", label: "네 사건을 꿰는 한 문장", hint: "바다와 대기는 따로 도는 것이 아니라 서로 밀고 당깁니다. 네 이야기에서 ‘전향력’과 ‘밀도(또는 기압) 차이’가 어떻게 되풀이해서 나타났는지 한 문장으로 쓰세요." },
    { id: "w4", label: "아직 헷갈리는 것", hint: "다음 시간에 여기서부터 시작합니다." }
  ]
});

/* ========================================================================= 06 우리 반 */
window.sthShare({
  mount: "share", unit: "eshs-1-1", unitLabel: "[지구과학 Ⅰ-1] 해수의 순환과 대기의 변화",
  rows: [
    { key: "r1", label: "① 바람과 어긋난 부표" },
    { key: "r2", label: "② 1,000년을 도는 물" },
    { key: "r3", label: "③ 일기도 세 장" },
    { key: "r4", label: "④ 매미가 오던 밤" },
    { key: "rQuiz", label: "수준별 문제" },
    { key: "rLab", label: "응용 실험실" },
    { key: "rInq", label: "교과서 실험" },
    { key: "rReal", label: "실제 자료" }
  ],
  line: { id: "all", label: "네 사건을 꿰는 한 문장" }
});

})();
