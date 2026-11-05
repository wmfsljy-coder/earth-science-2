/* 지구과학 Ⅱ-1 지구의 역사 — 소단원별 이야기 세 편
   ① 절벽에 적힌 순서 ② 반으로, 또 반으로 ③ 다섯 번의 대멸종과 화석 달력
   공용 부품: ../assets/theme.js (sthUnit·sthState·sthGate·sthWork·setupCanvas·cssVar·drawArrow),
             ../assets/story.js (sthStory·sthMission·sthSort·sthOrder·sthPick), ../assets/share.js */
(function () {
"use strict";

window.sthUnit("eshs-2-1");

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
/* 멈춤 단추(⏸/▶) — 캔버스 아래 controls 에 붙인다 */
function playBtn(id, onToggle) {
  var b = $(id); if (!b) return { on: !REDUCE };
  var st = { on: !REDUCE };
  function paint() { b.textContent = st.on ? "⏸ 움직임 멈추기" : "▶ 움직임 보기"; }
  b.addEventListener("click", function () { st.on = !st.on; paint(); if (onToggle) onToggle(st.on); });
  paint();
  return st;
}
/* 빛나는 곡선 */
function glowLine(ctx, pts, col, w) {
  ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = w || 2.8; ctx.lineJoin = "round"; ctx.shadowColor = col; ctx.shadowBlur = 8;
  ctx.beginPath(); pts.forEach(function (p, i) { if (i) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); }); ctx.stroke(); ctx.restore();
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
function band(ctx, x, y, w, h, color, alpha) {
  ctx.save(); ctx.globalAlpha = alpha === undefined ? 0.75 : alpha;
  ctx.fillStyle = v(color); ctx.fillRect(x, y, w, h); ctx.restore();
}
/* setTimeout 애니메이션 (가려진 탭에서는 그리지 않는다) */
function anim(canvas, step) {
  K.animate(canvas, function (dt) { step(dt); });
}
function hit(canvas, e) {
  var r = canvas.getBoundingClientRect();
  if (!r.width || !r.height) return { x: -1, y: -1 };
  return { x: (e.clientX - r.left) * (canvas._w / r.width), y: (e.clientY - r.top) * (canvas._h / r.height) };
}
/* 시간·연대 표기 */
function fmtSec(s) {
  if (s < 60) return s.toFixed(1) + " 초";
  if (s < 3600) return (s / 60).toFixed(1) + " 분";
  if (s < 86400) return (s / 3600).toFixed(1) + " 시간";
  if (s < 86400 * 365) return (s / 86400).toFixed(1) + " 일";
  return (s / (86400 * 365)).toFixed(1) + " 년";
}
function fmtAge(y) {
  if (y >= 1e8) return (y / 1e8).toFixed(2) + "억 년";
  if (y >= 1e4) return (y / 1e4).toFixed(1) + "만 년";
  if (y >= 1) return Math.round(y).toLocaleString() + "년";
  return y.toFixed(2) + "년";
}
var MDAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
function dateLabel(day) {
  var d = day, m = 0;
  while (m < 12 && d > MDAYS[m]) { d -= MDAYS[m]; m++; }
  if (m > 11) { m = 11; d = 31; }
  return (m + 1) + "월 " + d + "일";
}

/* =========================================================================
   스튜디오 + 블록 모형 공용 — 01 탭 '빠진 시간 — 부정합'(본보기)과 같은 말투
   밝은 스튜디오 바탕 · 지층을 잘라 낸 블록 · 굵은 테두리 큰 글자 · 흰 판정 카드
   ========================================================================= */
var LT = K.LT;
/* 암석 재질: [위쪽 색, 아래쪽 색, 무늬] — 부정합 장면의 ROCK 과 같은 색 */
var RK = {
  sand: ["#e2c48c", "#bf9a5e", "sand"], sand2: ["#c9a46c", "#a07c48", "sand2"], shale: ["#6c6f7a", "#4d505a", "shale"],
  lime: ["#e2dccb", "#bdb49a", "lime"], silt: ["#a8714f", "#80533a", "silt"], mud: ["#9a949c", "#77717c", "shale"],
  tuff: ["#f4ecf2", "#d4c6da", "tuff"], congl: ["#b59a78", "#8c7457", "congl"], granite: ["#e0abaa", "#b0767a", "granite"],
  soil: ["#8a6a44", "#6a4f30", "silt"], dark: ["#7d7268", "#5a5048", "silt"]
};
/* 면 좌표(u 가로, z 위) 안의 무늬 — slope 는 기울어진 층의 기울기 */
function texture(ctx, kn, x0, z0, w, h, seed, slope) {
  var R = K.rng(seed || 3), i;
  slope = slope || 0;
  if (kn === "shale") {
    ctx.strokeStyle = "rgba(20,22,30,.35)"; ctx.lineWidth = .8;
    for (i = 3; i < h; i += 4) { ctx.beginPath(); ctx.moveTo(x0, z0 + i); ctx.lineTo(x0 + w, z0 + i + w * slope); ctx.stroke(); }
  } else if (kn === "lime") {
    ctx.strokeStyle = "rgba(90,80,60,.35)"; ctx.lineWidth = .9;
    for (i = 0; i < w; i += 26 + R() * 14) { ctx.beginPath(); ctx.moveTo(x0 + i, z0 + i * slope); ctx.lineTo(x0 + i + 3, z0 + h + i * slope); ctx.stroke(); }
    for (i = 0; i < w * h / 60; i++) { ctx.fillStyle = "rgba(255,255,255,.25)"; var p1 = R() * w; ctx.fillRect(x0 + p1, z0 + R() * h + p1 * slope, 1.2, 1.2); }
  } else if (kn === "tuff") {
    for (i = 0; i < w * h / 30; i++) { var pt = R() * w; ctx.fillStyle = R() > .6 ? "rgba(120,90,130,.35)" : "rgba(255,255,255,.5)"; ctx.fillRect(x0 + pt, z0 + R() * h + pt * slope, 1.3, 1.3); }
  } else if (kn === "granite") {
    for (i = 0; i < w * h / 14; i++) { var r = R(); ctx.fillStyle = r > .62 ? "rgba(30,25,30,.75)" : (r > .3 ? "rgba(255,255,255,.6)" : "rgba(200,120,110,.6)"); ctx.fillRect(x0 + R() * w, z0 + R() * h, 1.6 + R() * 2.2, 1.6 + R() * 2.2); }
  } else if (kn === "congl") {
    for (i = 0; i < w * h / 26; i++) { var cu = R() * w; K.planet(ctx, x0 + cu, z0 + R() * h + cu * slope, 1.5 + R() * 2.3, ["#e6dccb", "#9aa0a8", "#c98f6a"][i % 3], "#4a4038"); }
  } else {
    for (i = 0; i < w * h / (kn === "silt" ? 40 : 55); i++) { var px = R() * w; ctx.fillStyle = R() > .5 ? "rgba(255,255,255,.22)" : "rgba(60,40,20,.28)"; ctx.fillRect(x0 + px, z0 + R() * h + px * slope, 1.4, 1.4); }
    if (kn === "sand2") { ctx.strokeStyle = "rgba(90,60,25,.35)"; ctx.lineWidth = .8; for (i = 0; i < w; i += 34) { ctx.beginPath(); ctx.moveTo(x0 + i, z0 + 3 + i * slope); ctx.quadraticCurveTo(x0 + i + 14, z0 + h * .5 + i * slope, x0 + i + 30, z0 + h - 2 + i * slope); ctx.stroke(); } }
  }
}
/* 수평 지층 한 장(면 좌표): 그라데이션 + 무늬 + 위 경계선 */
function layer(ctx, kind, u0, z0, w, h, seed) {
  var rk = RK[kind] || RK.sand;
  var g = ctx.createLinearGradient(0, z0, 0, z0 + h); g.addColorStop(0, rk[1]); g.addColorStop(1, rk[0]);
  ctx.fillStyle = g; ctx.fillRect(u0, z0, w, h);
  ctx.save(); ctx.beginPath(); ctx.rect(u0, z0, w, h); ctx.clip(); texture(ctx, rk[2], u0, z0, w, h, seed, 0); ctx.restore();
  ctx.strokeStyle = "rgba(40,30,20,.35)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(u0, z0 + h); ctx.lineTo(u0 + w, z0 + h); ctx.stroke();
}
/* 블록 모서리 밝은 선 */
function isoEdges(ctx, I, zT) {
  var a = I.P(I.L, I.D, 0), b = I.P(I.L, I.D, zT), c = I.P(0, I.D, 0), d = I.P(I.L, 0, 0), e = I.P(0, I.D, zT), f = I.P(I.L, 0, zT);
  ctx.strokeStyle = "rgba(255,255,255,.6)"; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(a.x, a.y); ctx.lineTo(d.x, d.y); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
  ctx.moveTo(e.x, e.y); ctx.lineTo(b.x, b.y); ctx.lineTo(f.x, f.y); ctx.stroke();
}
/* 숨은 캔버스(무늬 그림): 2배로 그려 두고 블록 면에 붙인다. 글자는 넣지 않는다 */
function offCanvas(w, h) {
  var c = document.createElement("canvas"), k = 2; c.width = w * k; c.height = h * k;
  var x = c.getContext("2d"); x.scale(k, k);
  return { c: c, x: x, w: w, h: h };
}
/* 무늬 그림을 블록 면(u 0~Lw, z 0~zTop)에 붙인다. 그림의 위쪽이 z = zTop */
function faceImg(ctx, I, side, img, zTop, sx, sw) {
  I.face(ctx, side, function (Lw) {
    ctx.translate(0, zTop); ctx.scale(1, -1);
    if (sx == null) ctx.drawImage(img, 0, 0, Lw, zTop);
    else ctx.drawImage(img, sx, 0, sw, img.height, 0, 0, Lw, zTop);
  });
}
/* 카드 안 여러 줄 글(낱말 단위로 줄 바꿈) */
function wrapT(ctx, s, x, y, maxW, lh, o) {
  o = o || {};
  ctx.font = (o.w || "700") + " " + (o.s || 12) + "px " + FONT;
  var words = String(s).split(" "), line = "", n = 0;
  for (var i = 0; i < words.length; i++) {
    var t = line ? line + " " + words[i] : words[i];
    if (ctx.measureText(t).width > maxW && line) { K.t(ctx, line, x, y + n * lh, o); n++; line = words[i]; }
    else line = t;
  }
  if (line) { K.t(ctx, line, x, y + n * lh, o); n++; }
  return n;
}
/* 오른쪽 흰 판정 카드(부정합 장면과 같은 자리·크기) */
function judgeCard(ctx, x, W, H, title) { K.card(ctx, x, 0, W - x, H, title || "판정"); }

/* =========================================================================
   이야기 ① 절벽에 적힌 순서
   ========================================================================= */
(function () {
  var ep = window.sthStory({ root: "epA", key: "epA", name: "사건 파일 ①", onDone: finish });

  window.sthGate({
    gate: "a-gate", key: "a-p", title: "지질 조사관의 첫 판단",
    question: "지층 누중의 법칙에 따르면 아래에 있는 지층이 더 오래되었습니다. 그러면 이 절벽의 <b>맨 아래 사암층</b>이 가장 먼저 쌓였다고 바로 말해도 될까요?",
    options: [
      "㉠ 그렇다 — 아래 지층이 먼저 쌓였다는 데에는 예외가 없다",
      "㉡ 아니다 — 지층이 뒤집혔을 수 있으니 퇴적구조로 위아래부터 확인해야 한다",
      "㉢ 아니다 — 절대연령을 재기 전에는 아무것도 말할 수 없다"
    ],
    onPick: function (i) { window.sthState("aPredOK", i === 1 ? "맞음" : "어긋남"); ep.clear(0); }
  });

  /* ---- 장면2 (앞) 스토크스 침강 ---- */
  var G2 = window.sthState("aFall") || { a: false, b: false, c: [false, false, false, false], d: false };
  if (!G2.c) G2.c = [false, false, false, false];
  function mission2() {
    if (G2.a) done("m1-2a");
    if (G2.b) done("m1-2b");
    var allStr = G2.c[0] && G2.c[1] && G2.c[2] && G2.c[3];
    if (allStr) done("m1-2c");
    if (G2.d) done("m1-2d");
    if (G2.a && G2.b && allStr && G2.d) {
      window.sthMission("m1-2", true, "<span class='m-tag'>미션 완료</span>굵은 입자는 몇 초 만에, 고운 입자는 몇 날 며칠에 걸쳐 가라앉습니다. 그래서 한 번의 흐름이 지나가면 <b>아래는 굵고 위는 고운</b> 점이층리가 남습니다. 그리고 사층리·건열·연흔처럼 <b>위아래가 구별되는 퇴적구조</b>가 있으면, 지층이 뒤집혔는지까지 알아낼 수 있습니다.");
      ep.clear(1);
    }
  }

  (function () {
    var canvas = $("a-c-fall"), ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var dUm = 500, depth = 50, tick = 0;
    var KS = 3593333;                                 /* v = KS · r² (스토크스) */

    function speed(um) { var r = um * 1e-6 / 2; return KS * r * r; }
    function LX(sec) {                                /* 로그 눈금 1초 ~ 10⁹초 */
      var g = clamp(Math.log(Math.max(sec, 1)) / Math.LN10, 0, 9);
      return 350 + g / 9 * (860 - 350);
    }

    /* 유리 수조 미니어처: 가로·세로 120, 높이 270(그림 단위) */
    var I = K.iso({ ox: 392, oy: 290, s: 0.95, L: 120, D: 120 }), ZW = 250, ZS = 22;
    function tank(t, gr) {
      var L = I.L, D = I.D;
      /* 뒷벽 유리(옆면 두 장)과 바닥판 */
      I.box(ctx, -8, -8, -10, L + 8, D + 8, 0, "#e9edf2", "#c9d0da", "#a6afbb");
      I.quad(ctx, I.P(0, 0, 0), I.P(L, 0, 0), I.P(L, 0, 270), I.P(0, 0, 270), "rgba(210,232,248,.35)", "rgba(120,150,180,.5)");
      I.quad(ctx, I.P(0, 0, 0), I.P(0, D, 0), I.P(0, D, 270), I.P(0, 0, 270), "rgba(200,225,245,.30)", "rgba(120,150,180,.5)");
      /* 바닥 퇴적물: 아래 굵고 위 고운 점이층(앞면·오른쪽 면에 무늬) */
      ["front", "right"].forEach(function (side) {
        I.face(ctx, side, function (Lw) {
          var g = ctx.createLinearGradient(0, 0, 0, ZS); g.addColorStop(0, "#8a6a42"); g.addColorStop(1, "#d8c39a");
          ctx.fillStyle = g; ctx.fillRect(0, 0, Lw, ZS);
          var R = K.rng(side === "front" ? 5 : 15);
          for (var s = 0; s < 70; s++) { var pz = R() * ZS; K.planet(ctx, R() * Lw, pz, .6 + (1 - pz / ZS) * 2.4, "#e8d6b0", "#5a4026"); }
        });
      });
      I.plane(ctx, ZS, "#d9c7a2", null);
      /* 물 */
      I.water(ctx, ZW, function () { return ZS; }, { phase: tick * .4, top: "rgba(110,185,235,.38)", deep: "rgba(30,90,160,.55)" });
      /* 가라앉는 알갱이 — 굵을수록 크게(과장) */
      var u = (tick % 40) / 40, zg = ZW - 12 - u * (ZW - ZS - 24), p = I.P(L / 2, D / 2, zg), pt = I.P(L / 2, D / 2, Math.min(ZW, zg + 55));
      var tr = ctx.createLinearGradient(0, pt.y, 0, p.y); tr.addColorStop(0, "rgba(255,255,255,0)"); tr.addColorStop(1, "rgba(255,240,210,.7)");
      ctx.strokeStyle = tr; ctx.lineWidth = gr; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(pt.x, pt.y); ctx.lineTo(p.x, p.y); ctx.stroke(); ctx.lineCap = "butt";
      K.planet(ctx, p.x, p.y, gr, "#e2c18e", "#6b4a26");
      /* 앞쪽 유리 모서리와 반사 */
      ctx.strokeStyle = "rgba(255,255,255,.9)"; ctx.lineWidth = 1.6;
      [[0, D], [L, D], [L, 0]].forEach(function (q) { var a = I.P(q[0], q[1], 0), b = I.P(q[0], q[1], 270); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); });
      var t1 = I.P(0, 0, 270), t2 = I.P(L, 0, 270), t3 = I.P(L, D, 270), t4 = I.P(0, D, 270);
      ctx.beginPath(); ctx.moveTo(t1.x, t1.y); ctx.lineTo(t2.x, t2.y); ctx.lineTo(t3.x, t3.y); ctx.lineTo(t4.x, t4.y); ctx.closePath(); ctx.stroke();
      I.face(ctx, "front", function () { var g = ctx.createLinearGradient(0, 0, 40, 0); g.addColorStop(0, "rgba(255,255,255,0)"); g.addColorStop(.5, "rgba(255,255,255,.28)"); g.addColorStop(1, "rgba(255,255,255,0)"); ctx.fillStyle = g; ctx.fillRect(14, 20, 26, 240); });
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      var vv = speed(dUm), t = depth / vv;
      var LW = 568, gr = clamp(2 + Math.log(dUm) / Math.LN10 * 3.4, 2.5, 15);
      /* ── 왼쪽: 밝은 스튜디오 위 유리 수조 ── */
      K.studio(ctx, 0, 0, LW, H, { x: I.P(60, 60, 0).x + 10, y: I.P(120, 120, 0).y - 20, rx: 190, ry: 40 });
      ctx.save(); ctx.beginPath(); ctx.roundRect(0, 0, LW, H, 14); ctx.clip();
      tank(t, gr);
      ctx.restore();
      var box = [0, LW];
      I.label(ctx, 0, I.D, ZW, "수면", -40, -10, "#bfe6ff", box);
      I.label(ctx, 120, 60, ZS * .5, "바닥 (깊이 " + depth + " m)", 30, 22, "#f1dcc0", box);
      var gp = I.P(60, 60, ZW - 12 - ((tick % 40) / 40) * (ZW - ZS - 24));
      K.pill(ctx, grainName(dUm) + " 알갱이", gp.x + gr + 64, gp.y + 5, { s: 12, c: KC.yellow, box: box });
      K.bigText(ctx, fmtSec(t), 18, 52, 30, (t >= 86400 || t <= 60) ? "#7dffa8" : "#ffd35a");
      K.bigText(ctx, "바닥까지 걸리는 시간", 18, 86, 17, "#ffffff");
      K.warn(ctx, 16, H - 16, "⚠ 알갱이 크기는 과장");

      /* ── 오른쪽: 흰 판정 카드 ── */
      var RX = LW + 10, px0 = RX + 18, x1 = W - 18, cw = x1 - px0;
      judgeCard(ctx, RX, W, H, "바닥까지 걸리는 시간");
      K.t(ctx, fmtSec(t), px0, 66, { s: 26, w: "900", c: (t >= 86400 || t <= 60) ? LT.green : "#b45309" });
      K.row(ctx, "입자 지름", (dUm / 1000).toFixed(3) + " mm", px0, x1, 104, LT.blue);
      K.row(ctx, "알갱이 이름", grainName(dUm), px0, x1, 132);
      K.row(ctx, "침강 속도", vv < 0.001 ? (vv * 1000).toFixed(3) + " mm/s" : vv.toFixed(3) + " m/s", px0, x1, 160);
      K.row(ctx, "물 깊이", depth + " m", px0, x1, 188);
      /* 로그 눈금(1초 ~ 10⁹초) */
      function CX(sec) { return px0 + clamp(Math.log(Math.max(sec, 1)) / Math.LN10, 0, 9) / 9 * cw; }
      var ly = 236;
      var lg = ctx.createLinearGradient(px0, 0, x1, 0); lg.addColorStop(0, "#f7b267"); lg.addColorStop(1, "#74c0fc");
      ctx.fillStyle = lg; ctx.beginPath(); ctx.roundRect(px0, ly - 5, cw, 10, 5); ctx.fill();
      [[1, "1초"], [60, "1분"], [3600, "1시간"], [86400, "1일"], [31536000, "1년"], [3153600000, "100년"]].forEach(function (m) {
        var x = CX(m[0]);
        ctx.strokeStyle = LT.line; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x, ly + 5); ctx.lineTo(x, ly + 10); ctx.stroke();
        K.t(ctx, m[1], clamp(x, px0 + 10, x1 - 14), ly + 24, { s: 10, a: "center", c: LT.mute, w: "700" });
      });
      var mx = CX(t);
      ctx.fillStyle = "#ffffff"; ctx.strokeStyle = "#12203a"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(mx, ly, 7, 0, 6.2832); ctx.fill(); ctx.stroke();
      K.t(ctx, "← 굵은 모래: 금방", px0, ly + 48, { s: 11, w: "800", c: LT.orange });
      K.t(ctx, "고운 점토: 며칠 →", x1, ly + 48, { s: 11, w: "800", a: "right", c: LT.blue });
      K.tip(ctx, t >= 86400 ? "하루 넘게 떠 있다 → 층의 위쪽" : (t <= 60 ? "1분 안에 바닥 → 층의 맨 아래" : "지름을 더 키우거나 줄여 보세요"), px0 - 4, 306, cw + 8, (t >= 86400 || t <= 60) ? true : null);
      K.t(ctx, "고운 입자일수록 오래 떠 있다가", px0, 366, { s: 11.5, w: "700", c: LT.mute });
      K.t(ctx, "뒤늦게 가라앉아 점이층리를 만듭니다.", px0, 384, { s: 11.5, w: "700", c: LT.mute });
      K.t(ctx, "스토크스 법칙 : 속도 ∝ (반지름)²", px0, 406, { s: 11, w: "800", c: "#1179a6" });

      var ch = false;
      if (t >= 86400 && !G2.a) { G2.a = ch = true; }
      if (t <= 60 && !G2.b) { G2.b = ch = true; }
      if (ch) { window.sthState("aFall", G2); mission2(); }

      $("a-fall-read").innerHTML = "가라앉는 데 걸리는 시간: <b>" + fmtSec(t) + "</b>";
      $("a-fall-info").innerHTML = t >= 86400
        ? "이 알갱이는 <b>하루가 넘게</b> 물속에 떠 있습니다. 탁한 흐름이 한 번 지나간 뒤, 굵은 것이 먼저 바닥에 깔리고 이런 고운 것이 한참 뒤에 그 위에 내려앉습니다."
        : (t <= 60 ? "<b>1분도 안 되어</b> 바닥에 닿습니다. 흐름이 멈추자마자 가라앉으므로 지층의 <b>맨 아래</b>에 놓입니다."
          : "지름을 바꿔 가며 시간이 어떻게 달라지는지 보세요. 지름이 절반이 되면 속도는 <b>4분의 1</b>이 됩니다.");
    }
    function grainName(um) {
      if (um < 40) return "점토";
      if (um < 63) return "실트(미사)";
      if (um < 2000) return "모래";
      return "굵은 모래";
    }
    canvas._redraw = draw;
    $("a-grain").addEventListener("input", function (e) {
      dUm = +e.target.value; $("a-grain-val").textContent = (dUm / 1000).toFixed(3) + " mm"; draw();
    });
    $("a-depth").addEventListener("input", function (e) {
      depth = +e.target.value; $("a-depth-val").textContent = depth + " m"; draw();
    });
    draw(); mission2();
    var playF = playBtn("a-fall-play");
    anim(canvas, function (dt) { if (playF.on) { tick += dt / 90; draw(); } });
  })();

  /* ---- 장면2 (뒤) 퇴적구조로 위아래 판정 ---- */
  (function () {
    var canvas = $("a-c-updown"), ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var str = "cross", flip = false, said = "";
    var IDX = { cross: 0, graded: 1, mud: 2, ripple: 3 };
    var NAME = { cross: "사층리", graded: "점이층리", mud: "건열", ripple: "연흔" };
    var TIP = {
      cross: "비스듬한 엽리가 <b>위쪽 경계에서 잘려 나가고</b> 아래쪽에서는 완만하게 이어집니다. 잘린 쪽이 <b>위</b>입니다.",
      graded: "한 층 안에서 <b>굵은 입자가 아래, 고운 입자가 위</b>에 놓입니다. 입자가 작아지는 쪽이 <b>위</b>입니다.",
      mud: "마른 진흙이 갈라진 쐐기는 <b>위가 넓고 아래로 갈수록 뾰족</b>합니다. 넓은 쪽이 <b>위</b>입니다.",
      ripple: "물결 자국은 <b>봉우리가 둥글고 골이 뾰족</b>합니다. 둥근 봉우리가 있는 쪽이 <b>위</b>입니다."
    };
    /* 무늬 그림(숨은 캔버스 400×260)을 암석 블록의 앞면에 붙인다 */
    var TOP = 0, BOT = 260, LEFT = 0, RIGHT = 400, TX = offCanvas(400, 260);
    var I = K.iso({ ox: 262, oy: 208, s: 0.75, L: 360, D: 120 }), ZT = 220;
    function PY(u) { return flip ? (BOT - u * (BOT - TOP)) : (TOP + u * (BOT - TOP)); }

    function rock(x, y, w, h, c0, c1, seed) {
      var g = ctx.createLinearGradient(x, y, x + w * .3, y + h);
      g.addColorStop(0, c0); g.addColorStop(1, c1);
      ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
      var R = K.rng(seed || 3);
      for (var i = 0; i < w * h / 90; i++) { ctx.fillStyle = R() > .5 ? "rgba(255,255,255,.10)" : "rgba(0,0,0,.10)"; ctx.fillRect(x + R() * w, y + R() * h, 1.5, 1.5); }
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      var main = ctx; ctx = TX.x; pattern(); ctx = main;
      var LW = 600, box = [0, LW];
      K.studio(ctx, 0, 0, LW, H, { x: I.P(I.L, I.D, 0).x - 60, y: I.P(I.L, I.D, 0).y - 34, rx: 270, ry: 44 });
      ctx.save(); ctx.beginPath(); ctx.roundRect(0, 0, LW, H, 14); ctx.clip();
      faceImg(ctx, I, "front", TX.c, ZT);
      faceImg(ctx, I, "right", TX.c, ZT, TX.c.width - 6, 6);           /* 오른쪽 면: 앞면 끝의 무늬이 안쪽으로 이어진다 */
      I.shade(ctx, "right", function () { return ZT; });
      I.shade(ctx, "front", function () { return ZT; });
      var tg = ctx.createLinearGradient(I.P(0, 0, ZT).x, 0, I.P(I.L, I.D, ZT).x, 0); tg.addColorStop(0, "#e6d2a8"); tg.addColorStop(1, "#c9ae7c");
      I.plane(ctx, ZT, tg, null);
      var Rt = K.rng(9); for (var i = 0; i < 160; i++) { var q = I.P(Rt() * I.L, Rt() * I.D, ZT); ctx.fillStyle = Rt() > .5 ? "rgba(255,255,255,.35)" : "rgba(90,60,30,.25)"; ctx.fillRect(q.x, q.y, 1.6, 1.2); }
      isoEdges(ctx, I, ZT);
      ctx.restore();
      /* 위·아래 표시 */
      I.label(ctx, I.L, I.D * .5, ZT - 12, "그림의 위쪽", 34, -12, KC.ink, box);
      I.label(ctx, I.L, I.D * .5, 14, "그림의 아래쪽", 34, 14, KC.ink, box);
      if (flip) {
        K.bigText(ctx, NAME[str], 18, 52, 30, "#ffffff");
        K.bigText(ctx, "⟳ 뒤집힌 지층", 18, 86, 19, "#ffb36b");
      } else {
        K.bigText(ctx, NAME[str], 18, 52, 30, "#ffffff");
        K.bigText(ctx, "정상 퇴적 상태", 18, 86, 19, "#ffd35a");
      }
      K.warn(ctx, LW - 14, 30, "⚠ 무늬는 보기 쉽게 크게 그림", "right");

      /* 오른쪽 판정 카드 */
      var RX = LW + 10, px = RX + 18, x1 = W - 18;
      judgeCard(ctx, RX, W, H, "위아래 판정");
      K.t(ctx, NAME[str], px, 64, { s: 22, w: "900", c: LT.ink });
      K.row(ctx, "지층 상태", flip ? "뒤집힘" : "정상", px, x1, 102, flip ? LT.orange : LT.green);
      K.row(ctx, "본 퇴적구조", (G2.c.filter(function (x) { return x; }).length) + " / 4", px, x1, 130);
      var HINT = { cross: "잘린 쪽이 위", graded: "고운 쪽이 위", mud: "넓은 쪽이 위", ripple: "둥근 봉우리 쪽이 위" };
      K.row(ctx, "읽는 법", HINT[str], px, x1, 158, LT.blue);
      if (said) {
        var ok = said.indexOf("맞") >= 0;
        ctx.fillStyle = ok ? "#e7f7f0" : "#fdeee4"; ctx.beginPath(); ctx.roundRect(px - 6, 184, x1 - px + 12, 112, 12); ctx.fill();
        wrapT(ctx, said, px + 4, 208, x1 - px - 8, 19, { s: 12.5, w: "800", c: ok ? "#0f766e" : "#b4400c" });
      } else {
        K.tip(ctx, "아래 단추로 위쪽을 판정하세요", px - 4, 190, x1 - px + 8, null);
        wrapT(ctx, "‘위(젊은 쪽)’는 퇴적물이 나중에 쌓인 쪽입니다.", px, 246, x1 - px, 18, { s: 12, w: "700", c: LT.mute });
      }
      K.t(ctx, "뒤집기 단추로 지각 변동을", px, 340, { s: 11.5, w: "800", c: "#1179a6" });
      K.t(ctx, "일으켜 보세요", px, 358, { s: 11.5, w: "800", c: "#1179a6" });
    }
    /* 암석 단면 무늬(숨은 캔버스에) — 원래 그림과 같은 퇴적구조 */
    function pattern() {
      ctx.clearRect(0, 0, 400, 260);
      ctx.save();
      ctx.beginPath(); ctx.rect(LEFT, TOP, RIGHT - LEFT, BOT - TOP); ctx.clip();
      if (str === "cross") {
        rock(LEFT, TOP, RIGHT - LEFT, BOT - TOP, "#d8b981", "#a9834f", 4);
        ctx.strokeStyle = "rgba(110,70,30,.75)"; ctx.lineWidth = 1.8;
        for (var lx = LEFT - 90; lx < RIGHT + 90; lx += 26) {
          ctx.beginPath();
          ctx.moveTo(lx, PY(0.97));
          ctx.quadraticCurveTo(lx + 46, PY(0.62), lx + 104, PY(0.02));
          ctx.stroke();
        }
        ctx.save(); ctx.strokeStyle = KC.orange; ctx.lineWidth = 3.5; ctx.shadowColor = KC.orange; ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.moveTo(LEFT, PY(0.02)); ctx.lineTo(RIGHT, PY(0.02)); ctx.stroke(); ctx.restore();
      } else if (str === "graded") {
        rock(LEFT, TOP, RIGHT - LEFT, BOT - TOP, "#9c8a72", "#6f5c45", 5);
        for (var r = 0; r < 8; r++) {
          var uu = 0.06 + r * 0.125, rad = 2.5 + uu * 11;
          var n = Math.floor((RIGHT - LEFT) / (rad * 2.6));
          for (var i = 0; i < n; i++) K.planet(ctx, LEFT + 12 + i * (RIGHT - LEFT - 24) / Math.max(n - 1, 1), PY(uu), rad, "#e2cfa8", "#6e5434");
        }
      } else if (str === "mud") {
        rock(LEFT, TOP, RIGHT - LEFT, BOT - TOP, "#8a6a4a", "#5a4430", 6);
        var cx = (LEFT + RIGHT) / 2;
        [-140, 0, 140].forEach(function (off) {
          var mg = ctx.createLinearGradient(0, PY(0.02), 0, PY(0.86)); mg.addColorStop(0, "#e2c99a"); mg.addColorStop(1, "#b89664");
          ctx.fillStyle = mg;
          ctx.beginPath();
          ctx.moveTo(cx + off - 44, PY(0.02));
          ctx.lineTo(cx + off + 44, PY(0.02));
          ctx.lineTo(cx + off + 7, PY(0.86));
          ctx.lineTo(cx + off - 7, PY(0.86));
          ctx.closePath(); ctx.fill();
          ctx.strokeStyle = KC.orange; ctx.lineWidth = 2; ctx.stroke();
        });
      } else {
        rock(LEFT, TOP, RIGHT - LEFT, BOT - TOP, "#c9ad80", "#a8885a", 7);
        var rg = ctx.createLinearGradient(0, PY(0.25), 0, PY(1)); rg.addColorStop(0, "#8f7350"); rg.addColorStop(1, "#5f4a32");
        ctx.fillStyle = rg;
        ctx.beginPath();
        ctx.moveTo(LEFT, PY(1));
        for (var xx = LEFT; xx <= RIGHT; xx += 4) {
          var ph = (xx - LEFT) / 100 * Math.PI * 2;
          var s1 = Math.sin(ph), uu2 = 0.42 - 0.17 * s1 - 0.05 * Math.sin(ph * 2);
          ctx.lineTo(xx, PY(uu2));
        }
        ctx.lineTo(RIGHT, PY(1)); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }
    function say() {
      $("a-updown-info").innerHTML = "<b>" + NAME[str] + "</b> — " + TIP[str] +
        (flip ? " 지금 화면은 <b>뒤집혀</b> 있으니, 구조가 가리키는 ‘위’는 그림의 아래쪽에 와 있습니다." : "");
    }
    function answer(pick) {
      var right = flip ? "bot" : "top";
      if (pick === right) {
        said = "✅ 맞았습니다. " + (flip ? "구조가 가리키는 위쪽이 그림의 아래에 있습니다 — 역전된 지층입니다." : "정상 지층이므로 그림의 위쪽이 젊은 쪽입니다.");
        if (flip && !G2.d) { G2.d = true; window.sthState("aFall", G2); mission2(); }
      } else {
        said = "❌ 다시 보세요. " + NAME[str] + "에서 무엇이 ‘위’를 가리키는지 오른쪽 설명을 먼저 읽어 보세요.";
      }
      draw();
    }
    canvas._redraw = draw;
    segWire("a-str", function (b) {
      str = b.getAttribute("data-s"); said = "";
      if (!G2.c[IDX[str]]) { G2.c[IDX[str]] = true; window.sthState("aFall", G2); mission2(); }
      say(); draw();
    });
    $("a-flip").addEventListener("click", function () {
      flip = !flip; this.classList.toggle("on", flip); said = ""; say(); draw();
    });
    $("a-ans-top").addEventListener("click", function () { answer("top"); });
    $("a-ans-bot").addEventListener("click", function () { answer("bot"); });
    if (!G2.c[0]) { G2.c[0] = true; window.sthState("aFall", G2); }
    say(); draw(); mission2();
  })();

  /* ---- 장면3 부정합 — 아이소메트릭 단면 모형 ---- */
  (function () {
    var canvas = $("a-c-unc"), ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var tilt = 0, eT = 0;
    var got = window.sthState("aUnc") || { a: false, b: false, c: false };
    var RATE = 0.1;                                   /* 1만 년에 0.1 m (= 1년에 0.01 mm) */
    var TOTAL = 200;
    function kind(E) { if (E <= 0) return "none"; if (E >= TOTAL) return "non"; return tilt > 0 ? "ang" : "par"; }
    var LABEL = { none: "부정합이 아닙니다", par: "평행 부정합", ang: "경사 부정합", non: "난정합" };

    /* 모형 치수(그림 단위): 블록 가로 L, 깊이 D, 화면 배율 S */
    var L = 380, D = 220, S = 0.75, C = 0.866, OX = 258, OY = 290;
    var G = 42, PXM = 0.75, LAY = 40 * PXM, CG = 7, NA = 18, NB = 18;
    var XC = L / 2, ZC = G + TOTAL * PXM / 2;
    function P(x, y, z) { return { x: OX + (x - y) * C * S, y: OY + (x + y) * 0.5 * S - z * S }; }
    var ROCK = [["#d8b77c", "#b8955a", "sand"], ["#6c6f7a", "#4d505a", "shale"], ["#e2dccb", "#bdb49a", "lime"], ["#a8714f", "#80533a", "silt"], ["#c9a46c", "#a07c48", "sand2"]];

    function finalView() {
      var E = eT * RATE;
      return { dep: 5, th: tilt, cut: Math.max(0, TOTAL - E) * PXM, eroded: E > 0, newDep: 1, water: null, rain: 0, cap: null };
    }
    function f(b, u, th) { var a = th * Math.PI / 180; return ZC + (b - ZC) / Math.cos(a) + (u - XC) * Math.tan(a); }
    function stackTop(u, v) { return v.dep >= 5 ? f(G + 5 * LAY, u, v.th) : G + v.dep * LAY; }
    function cutAt(s, v) { return v.cut === null ? 1e9 : G + v.cut + (v.eroded ? 3 * Math.sin(s / 24) : 0); }
    function lowerTop(u, s, v) { return Math.min(stackTop(u, v), cutAt(s, v)); }
    function newTop(v) { return G + (v.cut || 0) + (CG + NA + NB) * v.newDep; }

    /* 면 좌표(u 가로, z 위) → 화면. front = 앞면(y=D), right = 오른쪽 면(x=L) */
    function faceT(side) {
      if (side === "front") ctx.transform(C * S, 0.5 * S, 0, -S, OX - C * S * D, OY + 0.5 * S * D);
      else ctx.transform(-C * S, 0.5 * S, 0, -S, OX + C * S * L, OY + 0.5 * S * L);
    }
    function texture(kn, x0, z0, w, h, seed, slope) {
      var R = K.rng(seed), i;
      if (kn === "shale") {
        ctx.strokeStyle = "rgba(20,22,30,.35)"; ctx.lineWidth = .8;
        for (i = 3; i < h; i += 4) { ctx.beginPath(); ctx.moveTo(x0, z0 + i); ctx.lineTo(x0 + w, z0 + i + w * slope); ctx.stroke(); }
      } else if (kn === "lime") {
        ctx.strokeStyle = "rgba(90,80,60,.35)"; ctx.lineWidth = .9;
        for (i = 0; i < w; i += 26 + R() * 14) { ctx.beginPath(); ctx.moveTo(x0 + i, z0 + i * slope); ctx.lineTo(x0 + i + 3, z0 + h + i * slope); ctx.stroke(); }
        for (i = 0; i < w * h / 60; i++) { ctx.fillStyle = "rgba(255,255,255,.25)"; var p1 = R() * w; ctx.fillRect(x0 + p1, z0 + R() * h + p1 * slope, 1.2, 1.2); }
      } else {
        for (i = 0; i < w * h / (kn === "silt" ? 40 : 55); i++) { var px = R() * w; ctx.fillStyle = R() > .5 ? "rgba(255,255,255,.22)" : "rgba(60,40,20,.28)"; ctx.fillRect(x0 + px, z0 + R() * h + px * slope, 1.4, 1.4); }
        if (kn === "sand2") { ctx.strokeStyle = "rgba(90,60,25,.35)"; ctx.lineWidth = .8; for (i = 0; i < w; i += 34) { ctx.beginPath(); ctx.moveTo(x0 + i, z0 + 3 + i * slope); ctx.quadraticCurveTo(x0 + i + 14, z0 + h * .5 + i * slope, x0 + i + 30, z0 + h - 2 + i * slope); ctx.stroke(); } }
      }
    }
    function drawFace(side, v) {
      var Lw = side === "front" ? L : D, u, i;
      function su(uu) { return side === "front" ? uu : L + uu * .7; }
      function bandU(uu) { return side === "front" ? uu : L; }
      var slope = side === "front" ? Math.tan(v.th * Math.PI / 180) : 0;
      ctx.save(); faceT(side);
      ctx.beginPath(); ctx.rect(0, 0, Lw, 400); ctx.clip();
      /* 화강암 기반암 */
      ctx.save();
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Lw, 0);
      for (u = Lw; u >= 0; u -= 6) ctx.lineTo(u, Math.min(G, cutAt(su(u), v)));
      ctx.closePath(); ctx.clip();
      var gg = ctx.createLinearGradient(0, 0, 0, G); gg.addColorStop(0, "#a86c6e"); gg.addColorStop(1, "#d9a2a1");
      ctx.fillStyle = gg; ctx.fillRect(0, 0, Lw, G);
      var R = K.rng(side === "front" ? 9 : 19);
      for (var gi = 0; gi < Lw * G / 14; gi++) { var r = R(); ctx.fillStyle = r > .62 ? "rgba(30,25,30,.75)" : (r > .3 ? "rgba(255,255,255,.6)" : "rgba(200,120,110,.6)"); ctx.fillRect(R() * Lw, R() * G, 1.6 + R() * 2.2, 1.6 + R() * 2.2); }
      ctx.restore();
      /* 아래 지층 */
      if (v.dep > 0) {
        ctx.save();
        ctx.beginPath(); ctx.moveTo(0, G);
        for (u = 0; u <= Lw; u += 6) ctx.lineTo(u, Math.max(G, lowerTop(bandU(u), su(u), v)));
        ctx.lineTo(Lw, G); ctx.closePath(); ctx.clip();
        for (i = -3; i < 9; i++) {
          if (v.th === 0 && (i < 0 || i >= 5)) continue;
          var b0 = G + i * LAY, b1 = b0 + LAY, rk = ROCK[(i % 5 + 5) % 5];
          var z00 = f(b0, bandU(0), v.th), z01 = f(b0, bandU(Lw), v.th), z10 = f(b1, bandU(0), v.th), z11 = f(b1, bandU(Lw), v.th);
          ctx.beginPath(); ctx.moveTo(0, z00); ctx.lineTo(Lw, z01); ctx.lineTo(Lw, z11); ctx.lineTo(0, z10); ctx.closePath();
          var lg = ctx.createLinearGradient(0, z10, 0, z00); lg.addColorStop(0, rk[0]); lg.addColorStop(1, rk[1]);
          ctx.fillStyle = lg; ctx.fill();
          ctx.save(); ctx.clip(); texture(rk[2], 0, z00, Lw, LAY + 2, 40 + i + (side === "front" ? 0 : 50), slope); ctx.restore();
          ctx.strokeStyle = "rgba(40,30,20,.35)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, z00); ctx.lineTo(Lw, z01); ctx.stroke();
        }
        ctx.restore();
      }
      /* 부정합면 + 기저 역암 + 새 지층 */
      if (v.eroded && v.cut !== null) {
        if (v.newDep > 0) {
          var layers = [[CG, ["#b59a78", "#8c7457"], "congl"], [NA, ["#ead7a8", "#cdb37e"], "sand"], [NB, ["#a9a4ab", "#86818b"], "shale"]], acc = 0;
          for (var k2 = 0; k2 < 3; k2++) {
            var th2 = layers[k2][0] * Math.min(1, Math.max(0, v.newDep * 3 - k2));
            if (th2 <= 0) break;
            ctx.beginPath();
            for (u = 0; u <= Lw; u += 6) ctx.lineTo(u, Math.max(cutAt(su(u), v), G + v.cut + acc));
            for (u = Lw; u >= 0; u -= 6) ctx.lineTo(u, Math.max(cutAt(su(u), v), G + v.cut + acc + th2));
            ctx.closePath();
            var ng = ctx.createLinearGradient(0, G + v.cut + acc + th2, 0, G + v.cut + acc); ng.addColorStop(0, layers[k2][1][0]); ng.addColorStop(1, layers[k2][1][1]);
            ctx.fillStyle = ng; ctx.fill();
            if (layers[k2][2] === "congl") {
              var Rp = K.rng(side === "front" ? 61 : 71);
              for (var pi = 0; pi < Lw / 7; pi++) { var pu = Rp() * Lw; K.planet(ctx, pu, cutAt(su(pu), v) + 2 + Rp() * 4, 1.6 + Rp() * 2.2, ["#e6dccb", "#9aa0a8", "#c98f6a"][pi % 3], "#4a4038"); }
            } else { ctx.save(); ctx.clip(); texture(layers[k2][2], 0, G + v.cut + acc, Lw, th2, 80 + k2, 0); ctx.restore(); }
            acc += th2;
          }
        }
        ctx.save(); ctx.strokeStyle = "#ff9a3c"; ctx.lineWidth = 2.4; ctx.shadowColor = "#ff8a20"; ctx.shadowBlur = 8;
        ctx.beginPath(); var pen = false; for (u = 0; u <= Lw; u += 4) { var cz = cutAt(su(u), v); if (cz <= stackTop(bandU(u), v) + .5) { if (pen) ctx.lineTo(u, cz); else { ctx.moveTo(u, cz); pen = true; } } else pen = false; } ctx.stroke(); ctx.restore();
      }
      /* 물(재생 중) */
      if (v.water !== null) {
        var tz = function (uu) { return Math.max(G, (v.eroded && v.newDep > 0) ? newTop(v) : lowerTop(bandU(uu), su(uu), v)); };
        ctx.beginPath();
        for (u = 0; u <= Lw; u += 6) ctx.lineTo(u, tz(u));
        for (u = Lw; u >= 0; u -= 6) ctx.lineTo(u, Math.max(tz(u), v.water));
        ctx.closePath();
        ctx.fillStyle = "rgba(60,150,225,.38)"; ctx.fill();
      }
      ctx.restore();
      /* 면 음영 — 블록 면 모양 안에만 */
      ctx.save(); faceT(side);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Lw, 0);
      for (u = Lw; u >= 0; u -= 6) ctx.lineTo(u, Math.max(G, (v.eroded && v.newDep > 0) ? newTop(v) : lowerTop(bandU(u), su(u), v), v.water || 0));
      ctx.closePath(); ctx.clip();
      var sh = ctx.createLinearGradient(0, 0, 0, 260);
      if (side === "right") { sh.addColorStop(0, "rgba(10,20,50,.34)"); sh.addColorStop(1, "rgba(10,20,50,.18)"); }
      else { sh.addColorStop(0, "rgba(0,0,0,.12)"); sh.addColorStop(1, "rgba(255,255,255,.06)"); }
      ctx.fillStyle = sh; ctx.fillRect(0, 0, Lw, 400);
      ctx.restore();
    }
    function drawTop(v) {
      var N = 24, i, u0, u1, z0, z1, a, b, c, d;
      var flat = v.eroded && v.newDep > 0 && v.cut !== null;
      for (i = 0; i < N; i++) {
        u0 = L * i / N; u1 = L * (i + 1) / N;
        z0 = flat ? newTop(v) : Math.max(G, lowerTop(u0, u0, v)); z1 = flat ? newTop(v) : Math.max(G, lowerTop(u1, u1, v));
        a = P(u0, 0, z0); b = P(u1, 0, z1); c = P(u1, D, z1); d = P(u0, D, z0);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(c.x, c.y); ctx.lineTo(d.x, d.y); ctx.closePath();
        var col = (flat && v.newDep >= 1 && v.water === null) ? (i % 2 ? "#6fa64a" : "#73ab4d") : (flat ? "#b9b4bb" : "#cdb07a");
        ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = .8; ctx.stroke();
      }
      if (flat && v.newDep >= 1 && v.water === null) {
        var R = K.rng(5), zt = newTop(v);
        for (i = 0; i < 260; i++) { var q = P(R() * L, R() * D, zt); ctx.fillStyle = R() > .5 ? "rgba(40,90,30,.35)" : "rgba(180,230,140,.35)"; ctx.fillRect(q.x, q.y, 2, 1.2); }
        var r1 = P(0, D * .62, zt), r2 = P(L, D * .48, zt), r3 = P(L, D * .56, zt), r4 = P(0, D * .70, zt);
        ctx.fillStyle = "#8d8f94"; ctx.beginPath(); ctx.moveTo(r1.x, r1.y); ctx.lineTo(r2.x, r2.y); ctx.lineTo(r3.x, r3.y); ctx.lineTo(r4.x, r4.y); ctx.closePath(); ctx.fill();
        [[50, 30], [220, 40], [345, 60], [110, 170], [290, 185], [170, 200], [60, 120]].forEach(function (t, k) { tree(P(t[0], t[1], zt), 0.85 + (k % 3) * 0.15); });
      }
      var landMax = 0; for (i = 0; i <= N; i++) { var uu = L * i / N; landMax = Math.max(landMax, flat ? newTop(v) : Math.max(G, lowerTop(uu, uu, v))); }
      if (v.water !== null && v.water >= landMax - 1) {
        var w1 = P(0, 0, v.water), w2 = P(L, 0, v.water), w3 = P(L, D, v.water), w4 = P(0, D, v.water);
        ctx.beginPath(); ctx.moveTo(w1.x, w1.y); ctx.lineTo(w2.x, w2.y); ctx.lineTo(w3.x, w3.y); ctx.lineTo(w4.x, w4.y); ctx.closePath();
        var wg = ctx.createLinearGradient(w1.x, w1.y, w3.x, w3.y); wg.addColorStop(0, "rgba(120,200,255,.55)"); wg.addColorStop(1, "rgba(40,130,210,.55)");
        ctx.fillStyle = wg; ctx.fill(); ctx.strokeStyle = "rgba(255,255,255,.7)"; ctx.lineWidth = 1.2; ctx.stroke();
        ctx.strokeStyle = "rgba(255,255,255,.45)"; ctx.lineWidth = 1;
        for (i = 1; i < 6; i++) { var s1 = P(L * i / 6 - 20, D * .3, v.water), s2 = P(L * i / 6 + 10, D * .3, v.water); ctx.beginPath(); ctx.moveTo(s1.x, s1.y); ctx.quadraticCurveTo((s1.x + s2.x) / 2, s1.y - 3, s2.x, s2.y); ctx.stroke(); }
      }
    }
    function tree(p, sc) {
      ctx.fillStyle = "rgba(0,0,0,.18)"; ctx.beginPath(); ctx.ellipse(p.x + 4 * sc, p.y + 1, 7 * sc, 2.5 * sc, 0, 0, 6.283); ctx.fill();
      ctx.fillStyle = "#6b4a2e"; ctx.fillRect(p.x - 1.5 * sc, p.y - 8 * sc, 3 * sc, 8 * sc);
      [[30, 9], [22, 16]].forEach(function (q) {
        var g = ctx.createLinearGradient(p.x - 8 * sc, 0, p.x + 8 * sc, 0); g.addColorStop(0, "#4b8f3e"); g.addColorStop(1, "#24521f");
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(p.x, p.y - q[0] * sc); ctx.lineTo(p.x + 8 * sc, p.y - q[1] * sc); ctx.lineTo(p.x - 8 * sc, p.y - q[1] * sc); ctx.closePath(); ctx.fill();
      });
    }
    function edges(v) {
      var zt = (v.eroded && v.newDep > 0) ? newTop(v) : Math.max(G, lowerTop(L, L, v));
      var a = P(L, D, 0), b = P(L, D, zt), c = P(0, D, 0), d = P(L, 0, 0);
      ctx.strokeStyle = "rgba(255,255,255,.55)"; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(a.x, a.y); ctx.lineTo(d.x, d.y); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
    function age(m) { return m <= 0 ? "0년" : (m >= 10000 ? (m / 10000).toFixed(m % 10000 ? 1 : 0) + "억 년" : m.toLocaleString() + "만 년"); }
    function bigText(s, x, y, size, fill) {
      ctx.font = "900 " + size + "px " + FONT; ctx.textAlign = "left"; ctx.lineJoin = "round";
      ctx.strokeStyle = "#111622"; ctx.lineWidth = size * .22; ctx.strokeText(s, x, y);
      ctx.fillStyle = fill || "#ffffff"; ctx.fillText(s, x, y);
    }
    function render(v) {
      ctx.clearRect(0, 0, W, H);
      var LW = 628;
      var bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, "#f3f6fa"); bg.addColorStop(1, "#d6dee8");
      ctx.fillStyle = bg; ctx.beginPath(); ctx.roundRect(0, 0, LW, H, 14); ctx.fill();
      var fl = ctx.createRadialGradient(OX + 60, OY + 230, 20, OX + 60, OY + 230, 330); fl.addColorStop(0, "rgba(20,30,50,.30)"); fl.addColorStop(.55, "rgba(20,30,50,.08)"); fl.addColorStop(1, "rgba(20,30,50,0)");
      ctx.fillStyle = fl; ctx.beginPath(); ctx.ellipse(OX + 60, OY + 232, 290, 66, 0, 0, 6.283); ctx.fill();
      ctx.save(); ctx.beginPath(); ctx.roundRect(0, 0, LW, H, 14); ctx.clip();
      drawFace("front", v); drawFace("right", v); drawTop(v); edges(v);
      if (v.rain > 0) {
        var Rr = K.rng(Math.floor(v.rain * 40) + 3), i;
        ctx.strokeStyle = "rgba(90,140,200,.55)"; ctx.lineWidth = 1.2;
        for (i = 0; i < 70; i++) { var q = P(Rr() * L, Rr() * D, 230 + Rr() * 60); ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(q.x - 3, q.y + 11); ctx.stroke(); }
        for (i = 0; i < 26; i++) { var q2 = P(L + 6 + Rr() * 30, Rr() * D, G + v.cut + 10 - Rr() * 80); ctx.fillStyle = "rgba(140,105,70,.8)"; ctx.fillRect(q2.x, q2.y, 2.4, 2.4); }
        var pl = P(L, D * .2, G + v.cut + 40);
        K.pill(ctx, "비·강물에 깎여 바다로 실려 감", pl.x + 10, pl.y, { s: 11.5, c: "#ffd9a8", box: [0, LW] });
      }
      ctx.restore();
      var E = eT * RATE, k = kind(E);
      if (!v.cap) {
        var lab = function (s, x, y, z, col, dx, dy) {
          var p = P(x, y, z), q = { x: p.x + dx, y: p.y + dy };
          ctx.strokeStyle = "rgba(20,25,40,.75)"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
          ctx.fillStyle = "#111622"; ctx.beginPath(); ctx.arc(p.x, p.y, 2.5, 0, 6.283); ctx.fill();
          K.pill(ctx, s, q.x + (dx < 0 ? -4 : 4), q.y + 4, { s: 12, a: dx < 0 ? "right" : "left", c: col, box: [0, LW] });
        };
        if (k !== "none") {
          lab("새로 쌓인 지층", 30, D, newTop(v) - 14, "#f4e6c4", -40, -30);
          lab("부정합면 · 기저 역암", 80, D, G + v.cut + 2, "#ffb36b", -44, 22);
        }
        if (v.cut > 8 || k === "none") lab(tilt > 0 ? "기울어진 아래 지층" : "아래 지층", L, D * .5, G + Math.max(10, Math.min(v.cut, 150)) * .5, "#e8ecff", 46, -4);
        lab("화강암 기반암", L, D * .8, G * .5, "#ffd0d0", 40, 18);
      }
      if (v.cap) { bigText(v.cap[0], 18, 50, 26, "#ffffff"); if (v.cap[1]) bigText(v.cap[1], 18, 84, 19, "#ffd35a"); }
      else if (k !== "none") { bigText("빠진 시간 " + age(eT), 18, 50, 28, "#ffd35a"); bigText(LABEL[k], 18, 86, 20, "#ffffff"); }
      else { bigText("끊김 없이 쌓인 지층", 18, 50, 26, "#ffffff"); bigText("깎인 기간을 늘려 보세요", 18, 84, 18, "#ffd35a"); }
      K.warn(ctx, LW - 14, 30, "⚠ 두께·기울기는 보기 쉽게 과장", "right");

      /* 오른쪽 판정 카드 */
      var RX = LW + 10, px = RX + 18;
      var card = ctx.createLinearGradient(RX, 0, W, H); card.addColorStop(0, "#ffffff"); card.addColorStop(1, "#eef2f8");
      ctx.save(); ctx.shadowColor = "rgba(20,30,60,.18)"; ctx.shadowBlur = 14; ctx.fillStyle = card; ctx.beginPath(); ctx.roundRect(RX, 0, W - RX, H, 14); ctx.fill(); ctx.restore();
      K.t(ctx, "판정", px, 30, { s: 12.5, w: "800", c: "#5c7086" });
      K.t(ctx, LABEL[k], px, 66, { s: 22, w: "900", c: k === "none" ? "#8a96a8" : "#0f9f76" });
      var row = function (kk, vv, y, col) { K.t(ctx, kk, px, y, { s: 12, w: "700", c: "#5c7086" }); K.t(ctx, vv, W - 18, y, { s: 14, w: "900", a: "right", c: col || "#12203a" }); };
      row("기울어진 각도", tilt + "°", 108);
      row("깎인 기간", age(eT), 136);
      row("깎여 나간 두께", Math.min(E, TOTAL).toFixed(0) + " m", 164, "#c2410c");
      row("남은 아래 지층", Math.max(0, TOTAL - E).toFixed(0) + " / 200 m", 192);
      var bx = px, bw = W - 18 - px, by = 220;
      ctx.fillStyle = "#e3e9f1"; ctx.beginPath(); ctx.roundRect(bx, by, bw, 12, 6); ctx.fill();
      ctx.fillStyle = "#f59e0b"; ctx.beginPath(); ctx.roundRect(bx, by, Math.max(4, bw * eT / 4000), 12, 6); ctx.fill();
      K.t(ctx, "사라진 시간 " + age(eT), px, by + 34, { s: 13, w: "900", c: "#b45309" });
      K.t(ctx, "0", bx, by + 52, { s: 10, c: "#8a96a8" }); K.t(ctx, "4억 년", bx + bw, by + 52, { s: 10, a: "right", c: "#8a96a8" });
      var tip = k === "non" ? "침식이 기반암까지 닿았습니다" : (k === "ang" ? "아래는 기울고 위는 수평" : (k === "par" ? "위아래 지층이 나란합니다" : "깎인 적이 없습니다"));
      ctx.fillStyle = k === "none" ? "#eef1f5" : "#e7f7f0"; ctx.beginPath(); ctx.roundRect(px - 4, 296, W - px - 14, 34, 10); ctx.fill();
      K.t(ctx, tip, px + 6, 318, { s: 12, w: "800", c: k === "none" ? "#5c7086" : "#0f766e" });
      K.t(ctx, "침식 속도 : 1년에 0.01 mm", px, 368, { s: 11, c: "#5c7086" });
      K.t(ctx, "( 1만 년에 0.1 m )", px, 386, { s: 11, c: "#5c7086" });
      K.t(ctx, "▶ 과정 다시 보기로", px, 428, { s: 11.5, w: "800", c: "#1179a6" });
      K.t(ctx, "만들어지는 순서를 보세요", px, 446, { s: 11.5, w: "800", c: "#1179a6" });
    }

    /* 과정 다시 보기 — 퇴적 → (기울기) → 융기 → 침식 → 침강 → 새 퇴적 → 다시 융기 */
    var anim = null;
    function timeline() {
      var E = eT * RATE, cutF = Math.max(0, TOTAL - E) * PXM, topMax = Math.max(5 * LAY, f(G + 5 * LAY, L, tilt) - G);
      var hi = G + topMax + 34;
      return [
        { d: 2600, v: function (t) { return { dep: 5 * t, th: 0, cut: null, eroded: false, newDep: 0, water: G + 5 * LAY + 34, rain: 0, cap: ["① 바다 밑에서 차곡차곡 쌓인다", "아래가 먼저, 위가 나중"] }; } },
        { d: tilt > 0 ? 1500 : 800, v: function (t) { return { dep: 5, th: tilt * t, cut: null, eroded: false, newDep: 0, water: hi, rain: 0, cap: tilt > 0 ? ["② 지각 변동", "지층이 " + tilt + "° 기울어진다"] : ["② 기울지 않은 채", "그대로 들어 올려진다"] }; } },
        { d: 1100, v: function (t) { return { dep: 5, th: tilt, cut: null, eroded: false, newDep: 0, water: hi - (hi - G * .4) * t, rain: 0, cap: ["③ 융기", "물 밖으로 솟아오른다"] }; } },
        { d: E > 0 ? 2600 : 700, v: function (t) { return { dep: 5, th: tilt, cut: E > 0 ? topMax - (topMax - cutF) * t : null, eroded: E > 0, newDep: 0, water: null, rain: E > 0 ? t : 0, cap: E > 0 ? ["④ 침식", age(eT) + " 동안 " + Math.min(E, TOTAL).toFixed(0) + " m가 깎인다"] : ["④ 깎이지 않음", "깎인 기간이 0입니다"] }; } },
        { d: 1100, v: function (t) { return { dep: 5, th: tilt, cut: E > 0 ? cutF : null, eroded: E > 0, newDep: 0, water: G * .4 + (G + cutF + 70 - G * .4) * t, rain: 0, cap: ["⑤ 침강", "다시 바다 밑으로 가라앉는다"] }; } },
        { d: 1800, v: function (t) { return { dep: 5, th: tilt, cut: E > 0 ? cutF : null, eroded: E > 0, newDep: E > 0 ? t : 0, water: G + cutF + 70, rain: 0, cap: ["⑥ 그 위에 새 지층", "자갈(기저 역암)부터 쌓인다"] }; } },
        { d: 1100, v: function (t) { var w = G + cutF + 70; return { dep: 5, th: tilt, cut: E > 0 ? cutF : null, eroded: E > 0, newDep: E > 0 ? 1 : 0, water: w - (w - G * .4) * t, rain: 0, cap: ["⑦ 다시 융기", "오늘 우리가 보는 절벽"] }; } }
      ];
    }
    function draw() { if (!anim) render(finalView()); }
    function judge() {
      var E = eT * RATE, left = Math.max(0, TOTAL - E), k = kind(E), ch = false;
      if (k === "par" && !got.a) { got.a = ch = true; }
      if (k === "ang" && !got.b) { got.b = ch = true; }
      if (k === "non" && !got.c) { got.c = ch = true; }
      if (ch) { window.sthState("aUnc", got); mission(); }
      $("a-unc-read").innerHTML = "깎여 나간 두께: <b>" + Math.min(E, TOTAL).toFixed(0) + " m</b> (남은 지층 " + left.toFixed(0) + " m)";
      $("a-unc-info").innerHTML =
        k === "none" ? "아직 깎인 적이 없습니다. 퇴적이 끊기지 않고 이어지면 부정합이 생기지 않습니다. <b>깎인 기간</b>을 늘려 보세요."
        : (k === "par" ? "<b>평행 부정합</b>입니다. 지층이 기울지 않은 채로 융기·침식된 뒤 다시 가라앉아 쌓였습니다. 위아래 지층이 나란해서 눈으로는 알아보기 어렵지만, 그 사이에 <b>" + age(eT) + "</b>이 통째로 비어 있습니다."
          : (k === "ang" ? "<b>경사 부정합</b>입니다. 아래 지층은 기울어져 있고 위 지층은 수평이므로, 그 사이에 <b>지각 변동 → 융기 → 침식 → 침강</b>이 있었다는 뜻입니다. 가장 알아보기 쉬운 부정합입니다."
            : "<b>난정합</b>입니다. 침식이 퇴적층 200 m를 모두 깎아 내고 <b>화강암 기반암</b>까지 닿았습니다. 땅속 깊은 곳에서 굳은 심성암이 지표에 드러났다는 것은, 그 위를 덮고 있던 암석이 엄청나게 깎여 나갔다는 뜻입니다."));
      draw();
    }
    function mission() {
      if (got.a) done("m1-3a"); if (got.b) done("m1-3b"); if (got.c) done("m1-3c");
      if (got.a && got.b && got.c) {
        window.sthMission("m1-3", true, "<span class='m-tag'>미션 완료</span>부정합은 <b>쌓이지 않은 시간</b>의 기록입니다. 위아래 지층이 나란하면 <b>평행 부정합</b>, 아래가 기울어져 있으면 <b>경사 부정합</b>, 침식이 심성암·변성암 기반암까지 닿았으면 <b>난정합</b>입니다.");
        ep.clear(2);
      }
    }
    var playBtn = $("a-unc-play");
    function stop() { anim = null; playBtn.textContent = "▶ 과정 다시 보기"; render(finalView()); }
    playBtn.addEventListener("click", function () {
      if (anim) { stop(); return; }
      anim = { st: 0, t: 0, tl: timeline() }; playBtn.textContent = "⏹ 멈추고 결과 보기";
    });
    K.animate(canvas, function (dt) {
      if (!anim) return;
      var s = anim.tl[anim.st]; anim.t += dt;
      var u = Math.min(1, anim.t / s.d), e = u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
      render(s.v(e));
      if (u >= 1) { anim.st++; anim.t = 0; if (anim.st >= anim.tl.length) stop(); }
    });
    canvas._redraw = draw;
    $("a-tilt").addEventListener("input", function (e) { tilt = +e.target.value; $("a-tilt-val").textContent = tilt + "°"; if (anim) stop(); judge(); });
    $("a-erode").addEventListener("input", function (e) { eT = +e.target.value; $("a-erode-val").textContent = eT + "만 년"; if (anim) stop(); judge(); });
    judge(); mission();
  })();

  /* ---- 장면4 단면 복원 ---- */
  var G4 = window.sthState("aSec") || { seen: [], q: false, o: false };
  if (!G4.seen) G4.seen = [];
  function mission4() {
    if (G4.seen.length >= 8) done("m1-4a");
    if (G4.q) done("m1-4b");
    if (G4.o) done("m1-4c");
    if (G4.seen.length >= 8 && G4.q && G4.o) {
      window.sthMission("m1-4", true, "<span class='m-tag'>미션 완료</span>순서를 정한 근거는 넷입니다 — 퇴적구조로 읽은 <b>역전</b>, 기울어진 지층이 말해 주는 <b>수평 퇴적</b>, 울퉁불퉁한 <b>부정합면</b>, 그리고 전체를 자르고 남의 조각까지 품은 <b>관입 암맥</b>.");
      ep.clear(3); ep.clear(4);
    }
  }

  (function () {
    var canvas = $("a-c-sec"), ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var sel = "";
    var CX = 420, CY = 331, ANG = -0.24;
    var PARTS = {
      "mud": "<b>㉲ 이암층 — 건열</b> 위 무리의 맨 위입니다. 쐐기가 <b>위쪽에서 넓고 아래로 갈수록 뾰족</b>하므로 이 무리는 역전되지 않았습니다. 건열은 물 밑 진흙이 <b>대기 중에 드러나 말랐다</b>는 뜻이니, 아주 얕은 물가였습니다.",
      "cong": "<b>㉱ 역암층 — 기저 역암</b> 부정합면 바로 위에 놓인 자갈층입니다. 아래 지층이 깎여 나가며 생긴 부스러기가 다시 쌓인 것이라, <b>부정합면 위에 놓인다</b>는 것이 특징입니다.",
      "unc": "<b>부정합면</b> 울퉁불퉁한 이 경계는 <b>침식면</b>입니다. 위아래 지층의 기울기가 다르므로 <b>경사 부정합</b>이고, 그 사이에는 ‘융기 → 침식 → 침강’이라는 긴 시간이 통째로 빠져 있습니다.",
      "lime": "<b>㉮ 석회암층</b> 아래 무리에서 지금은 가장 위에 보입니다. 하지만 이 무리는 <b>역전</b>되어 있으므로, 실제로는 <b>가장 먼저</b> 쌓인 지층입니다. 암맥 속 포획암과 같은 암석이기도 합니다.",
      "shale": "<b>㉯ 셰일층 — 고사리 화석</b> 아주 고운 진흙이 굳은 암석입니다. 앞 장면에서 보았듯 고운 입자는 <b>흐름이 거의 없는 잔잔한 물</b>에서만 가라앉습니다. 여기서 고사리 화석이 쏟아져 나왔습니다.",
      "sand": "<b>㉰ 사암층 — 사층리</b> 아래 무리의 맨 아래에 보이지만, 사층리의 비스듬한 엽리가 <b>그림의 아래쪽에서 잘려</b> 있습니다. 잘린 쪽이 위이므로 이 무리는 <b>뒤집혀 있고</b>, ㉰ 는 아래 무리에서 가장 나중에 쌓인 지층입니다.",
      "dike": "<b>㉳ 화강암 암맥 — 관입</b> 아래 무리부터 위 무리까지 <b>전부 가로질러 자르고</b> 있습니다. 관입의 법칙에 따라 암맥은 자신이 자른 모든 지층보다 <b>나중</b>에 생겼습니다. 이 절벽에서 가장 젊은 암석입니다.",
      "xeno": "<b>포획암</b> 암맥 속에 박힌 석회암 조각입니다. 마그마가 뚫고 올라오며 ㉮ 석회암의 조각을 떼어 삼킨 것이므로, <b>석회암이 먼저, 암맥이 나중</b>입니다. 남의 조각을 품은 쪽이 나중입니다."
    };
    function dikeX(y) { return 495 + (300 - y) * 0.08; }

    function rockFill(x, y, w, h, c0, c1, seed, on) {
      var g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, c0); g.addColorStop(1, c1);
      ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
      var R = K.rng(seed);
      for (var i = 0; i < w * h / 150; i++) { ctx.fillStyle = R() > .5 ? "rgba(255,255,255,.08)" : "rgba(0,0,0,.12)"; ctx.fillRect(x + R() * w, y + R() * h, 1.6, 1.6); }
      if (on) { ctx.fillStyle = "rgba(255,240,180,.18)"; ctx.fillRect(x, y, w, h); }
    }
    /* 절벽 블록 모형: 앞면 = 원래 단면(x 140~700, y 60~470)을 그린 숨은 캔버스. z = (470 − y) × KZ */
    var TX = offCanvas(560, 410), KZ = 0.82, ZT = 410 * KZ, LW = 630;
    var I = K.iso({ ox: 282, oy: 292, s: 0.72, L: 560, D: 130 });
    function FP(x, y) { return I.P(x - 140, I.D, (470 - y) * KZ); }   /* 원래 단면 좌표 → 화면 */
    function unproject(p) {                                          /* 화면 → 원래 단면 좌표(앞면 밖이면 빈 값) */
      var s = I.s, C = 0.866, u = (p.x - 282 + C * s * I.D) / (C * s), z = (0.5 * s * u + 292 + 0.5 * s * I.D - p.y) / s;
      if (u < 0 || u > I.L || z < 0 || z > ZT) return { x: -1, y: -1 };
      return { x: 140 + u, y: 470 - z / KZ };
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      var main = ctx; ctx = TX.x; ctx.clearRect(0, 0, 560, 410); ctx.save(); ctx.translate(-140, -60); pattern(); ctx.restore(); ctx = main;
      var box = [0, LW], P0 = I.P(I.L, I.D, 0);
      K.studio(ctx, 0, 0, LW, H, { x: P0.x - 120, y: P0.y - 40, rx: 330, ry: 52 });
      ctx.save(); ctx.beginPath(); ctx.roundRect(0, 0, LW, H, 14); ctx.clip();
      faceImg(ctx, I, "front", TX.c, ZT);
      faceImg(ctx, I, "right", TX.c, ZT, TX.c.width - 4, 4);
      I.shade(ctx, "right", function () { return ZT; });
      I.shade(ctx, "front", function () { return ZT; });
      /* 윗면: 흙과 풀밭 */
      I.plane(ctx, ZT, "#78a94e", null);
      var Rg = K.rng(3), q, i;
      for (i = 0; i < 300; i++) { q = I.P(Rg() * I.L, Rg() * I.D, ZT); ctx.fillStyle = Rg() > .5 ? "rgba(40,90,30,.35)" : "rgba(190,235,150,.35)"; ctx.fillRect(q.x, q.y, 2, 1.2); }
      [[40, 30], [120, 90], [210, 40], [330, 100], [470, 30], [520, 95]].forEach(function (t, k2) { I.tree(ctx, t[0], t[1], ZT, .9 + (k2 % 3) * .15); });
      isoEdges(ctx, I, ZT);
      ctx.restore();
      /* 이름표(화면에 바로 서 있게) */
      var on = function (k) { return sel === k ? KC.yellow : KC.ink; };
      var lp = function (s, x, y, k, col) { var p = FP(x, y); K.pill(ctx, s, p.x, p.y, { s: 12, c: sel === k ? KC.yellow : (col || KC.ink), box: box }); };
      lp("㉲ 이암 · 건열", 150, 98, "mud");
      lp("㉱ 역암 · 기저 역암", 150, 160, "cong");
      lp("㉮ 석회암", 160, 252, "lime");
      lp("㉯ 셰일 · 고사리 화석", 160, 352, "shale");
      lp("㉰ 사암 · 사층리", 160, 452, "sand");
      void on;
      var dp = FP(dikeX(70), 70), xp = FP(dikeX(310) + 15, 310), up = FP(150, 186);
      [[dp, 70, -116, "㉳ 암맥", sel === "dike" ? KC.yellow : "#ffb6b6"], [xp, 96, 52, "포획암", sel === "xeno" ? KC.yellow : "#efe6d0"], [up, -24, 30, "부정합면", sel === "unc" ? KC.yellow : KC.orange]].forEach(function (L2) {
        var p = L2[0], qx = p.x + L2[1], qy = p.y + L2[2];
        ctx.strokeStyle = "rgba(20,25,40,.75)"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(qx, qy); ctx.stroke();
        ctx.fillStyle = "#111622"; ctx.beginPath(); ctx.arc(p.x, p.y, 2.5, 0, 6.283); ctx.fill();
        K.pill(ctx, L2[3], qx + (L2[1] < 0 ? -4 : 4), qy + 4, { s: 12, a: L2[1] < 0 ? "right" : "left", c: L2[4], box: box });
      });
      K.bigText(ctx, "절벽 단면", 18, 52, 28, "#ffffff");
      K.bigText(ctx, "눌러서 증거 확인", 18, 86, 17, "#ffd35a");
      K.warn(ctx, 16, H - 16, "⚠ 두께·기울기는 보기 쉽게 과장");

      /* 오른쪽 카드: 조사한 곳 */
      var RX = LW + 10, px = RX + 18, x1 = W - 18;
      judgeCard(ctx, RX, W, H, "조사한 곳");
      K.t(ctx, G4.seen.length + " / 8", px, 66, { s: 26, w: "900", c: G4.seen.length >= 8 ? LT.green : LT.ink });
      K.bar(ctx, px, 82, x1 - px, G4.seen.length / 8, G4.seen.length >= 8 ? LT.green : LT.yellow);
      var LIST = [["mud", "㉲ 이암 · 건열"], ["cong", "㉱ 역암 · 기저 역암"], ["unc", "부정합면"], ["lime", "㉮ 석회암"], ["shale", "㉯ 셰일 · 고사리"], ["sand", "㉰ 사암 · 사층리"], ["dike", "㉳ 암맥"], ["xeno", "포획암"]];
      LIST.forEach(function (L3, k3) {
        var y = 124 + k3 * 30, seen = G4.seen.indexOf(L3[0]) >= 0, cur = sel === L3[0];
        if (cur) { ctx.fillStyle = "#fff4d6"; ctx.beginPath(); ctx.roundRect(px - 8, y - 19, x1 - px + 16, 27, 8); ctx.fill(); }
        K.t(ctx, L3[1], px, y, { s: 12.5, w: cur ? "900" : "700", c: seen ? LT.ink : LT.dim });
        K.t(ctx, seen ? "✓" : "·", x1, y, { s: 14, w: "900", a: "right", c: seen ? LT.green : LT.dim });
      });
      K.tip(ctx, "아래 무리 세 장은 기울어져 있습니다", px - 6, 380, x1 - px + 12, null);
      K.t(ctx, "위아래부터 판정하고,", px, 446, { s: 11.5, w: "800", c: "#1179a6" });
      K.t(ctx, "무엇이 무엇을 자르는지 보세요", px, 464, { s: 11.5, w: "800", c: "#1179a6" });
      K.t(ctx, "앞면 단면을 눌러 살펴봅니다", px, 500, { s: 11, w: "700", c: LT.mute });
    }
    /* 절벽 단면 무늬(원래 좌표 그대로, 글자 없이) */
    function pattern() {
      var X0 = 140, X1 = 700;
      var bgg = ctx.createLinearGradient(0, 60, 0, 470); bgg.addColorStop(0, "#7a6450"); bgg.addColorStop(1, "#5a4838");
      ctx.fillStyle = bgg; ctx.fillRect(X0, 60, X1 - X0, 410);

      /* 위 무리: 이암(건열) · 역암 */
      rockFill(X0, 60, X1 - X0, 58, "#8f8a93", "#6c6772", 51, sel === "mud");
      ctx.strokeStyle = "rgba(40,30,25,.65)"; ctx.lineWidth = 1.4;
      [200, 330, 470, 600].forEach(function (mx) { ctx.beginPath(); ctx.moveTo(mx - 8, 60); ctx.lineTo(mx, 92); ctx.lineTo(mx + 8, 60); ctx.stroke(); });
      rockFill(X0, 120, X1 - X0, 58, "#b8946a", "#8d6c47", 52, sel === "cong");
      for (var g = 0; g < 26; g++) K.planet(ctx, X0 + 20 + g * 21, 132 + (g % 3) * 15, 5, "#d8cbb8", "#5d5248");

      /* 아래 무리: 기울고 뒤집힌 세 장 */
      ctx.save();
      ctx.beginPath(); ctx.rect(X0, 192, X1 - X0, 278); ctx.clip();
      ctx.translate(CX, CY); ctx.rotate(ANG); ctx.translate(-CX, -CY);
      rockFill(CX - 300, CY - 142, 600, 95, "#d6d0bf", "#b0a990", 53, sel === "lime");
      rockFill(CX - 300, CY - 47, 600, 95, "#5f6470", "#474b56", 54, sel === "shale");
      rockFill(CX - 300, CY + 48, 600, 94, "#d4b27a", "#ac8a52", 55, sel === "sand");
      /* 셰일 속 고사리 화석 */
      ctx.strokeStyle = "rgba(170,210,150,.55)"; ctx.lineWidth = 1.2;
      [[-200, 0], [-40, 10], [130, -8]].forEach(function (f) {
        var fx = CX + f[0], fy = CY + f[1];
        ctx.beginPath(); ctx.moveTo(fx - 18, fy + 6); ctx.quadraticCurveTo(fx, fy - 4, fx + 18, fy - 2); ctx.stroke();
        for (var l = -3; l <= 3; l++) { ctx.beginPath(); ctx.moveTo(fx + l * 5, fy + 1 - l * .2); ctx.lineTo(fx + l * 5 - 3, fy - 6); ctx.moveTo(fx + l * 5, fy + 1 - l * .2); ctx.lineTo(fx + l * 5 - 3, fy + 7); ctx.stroke(); }
      });
      ctx.strokeStyle = "rgba(90,60,25,.75)"; ctx.lineWidth = 1.6;
      for (var s2 = 0; s2 < 9; s2++) {                 /* 사층리 — 아래쪽에서 잘림 */
        ctx.beginPath();
        ctx.moveTo(CX - 300 + s2 * 66, CY + 52);
        ctx.quadraticCurveTo(CX - 270 + s2 * 66, CY + 100, CX - 230 + s2 * 66, CY + 139);
        ctx.stroke();
      }
      ctx.restore();

      /* 부정합면 */
      ctx.save(); ctx.strokeStyle = KC.orange; ctx.lineWidth = sel === "unc" ? 5 : 3.2; ctx.shadowColor = KC.orange; ctx.shadowBlur = sel === "unc" ? 14 : 8;
      ctx.beginPath();
      for (var x = X0; x <= X1; x += 8) ctx.lineTo(x, 185 + Math.sin(x / 22) * 5);
      ctx.stroke(); ctx.restore();

      /* 암맥: 분홍 화강암 결정 */
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(dikeX(60) - 26, 60); ctx.lineTo(dikeX(60) + 26, 60);
      ctx.lineTo(dikeX(470) + 26, 470); ctx.lineTo(dikeX(470) - 26, 470);
      ctx.closePath();
      if (sel === "dike") { ctx.shadowColor = "#ffb0b0"; ctx.shadowBlur = 16; }
      var dg = ctx.createLinearGradient(dikeX(60) - 26, 0, dikeX(60) + 26, 0); dg.addColorStop(0, "#c98586"); dg.addColorStop(.5, "#e7aaa8"); dg.addColorStop(1, "#b97072");
      ctx.fillStyle = dg; ctx.fill(); ctx.shadowBlur = 0; ctx.clip();
      var Rr = K.rng(77);
      for (var d = 0; d < 300; d++) { var yy = 60 + Rr() * 410; ctx.fillStyle = Rr() > .6 ? "rgba(30,25,30,.7)" : "rgba(255,255,255,.6)"; ctx.fillRect(dikeX(yy) - 26 + Rr() * 52, yy, 2 + Rr() * 1.5, 2 + Rr() * 1.5); }
      ctx.restore();
      /* 포획암 */
      ctx.save(); if (sel === "xeno") { ctx.shadowColor = KC.yellow; ctx.shadowBlur = 14; }
      var xg = ctx.createRadialGradient(dikeX(310) - 4, 306, 2, dikeX(310), 310, 15); xg.addColorStop(0, "#efe9da"); xg.addColorStop(1, "#a69f86");
      ctx.fillStyle = xg; ctx.beginPath(); ctx.arc(dikeX(310), 310, 15, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      ctx.strokeStyle = sel === "xeno" ? KC.yellow : "rgba(40,30,25,.6)"; ctx.lineWidth = sel === "xeno" ? 2.5 : 1.2; ctx.beginPath(); ctx.arc(dikeX(310), 310, 15, 0, Math.PI * 2); ctx.stroke();

    }
    function pick(p) {
      var dx = p.x - CX, dy = p.y - CY;
      var ly = -dx * Math.sin(ANG) + dy * Math.cos(ANG);
      var lx = dx * Math.cos(ANG) + dy * Math.sin(ANG);
      if (Math.abs(p.x - dikeX(310)) < 17 && Math.abs(p.y - 310) < 17) return "xeno";
      if (p.y >= 60 && p.y <= 470 && Math.abs(p.x - dikeX(p.y)) <= 26) return "dike";
      if (p.y > 176 && p.y < 196) return "unc";
      if (p.x < 140 || p.x > 700) return "";
      if (p.y >= 60 && p.y < 118) return "mud";
      if (p.y >= 118 && p.y < 176) return "cong";
      if (p.y >= 196 && p.y <= 470 && Math.abs(lx) <= 300) {
        if (ly < -47) return "lime";
        if (ly < 48) return "shale";
        return "sand";
      }
      return "";
    }
    canvas._redraw = draw;
    canvas.addEventListener("click", function (e) {
      var k = pick(unproject(hit(canvas, e)));
      if (!k) return;
      sel = k;
      if (G4.seen.indexOf(k) < 0) { G4.seen.push(k); window.sthState("aSec", G4); mission4(); }
      $("a-sec-info").innerHTML = PARTS[k];
      draw();
    });
    draw(); mission4();
  })();

  window.sthPick({
    mount: "a-q1",
    q: "셰일층에서는 고사리 같은 <b>식물 화석</b>만 나왔습니다. 이 화석으로 지층의 선후를 따질 수 있을까요?",
    options: [
      "㉠ 쓸 수 없다 — ‘동물군천이’의 법칙이므로 동물 화석만 쓸 수 있다",
      "㉡ 쓸 수 있다 — 식물도 시간에 따라 진화하며 천이하기 때문이다",
      "㉢ 쓸 수 있다 — 식물은 진화하지 않아 어느 시대에나 같은 종이 나오기 때문이다"
    ],
    answer: 1,
    why: [
      "법칙의 이름 때문에 생기는 흔한 오해입니다. 이름은 ‘동물군’이지만, 실제로는 식물군도 함께 천이합니다.",
      "그렇습니다. 그래서 이 법칙을 <b>생물군천이의 법칙</b>이라고 부르기도 합니다. 고사리 종류도 시대에 따라 달라지므로 훌륭한 단서가 됩니다.",
      "거꾸로입니다. 식물도 진화하기 때문에 <b>시대마다 다른 종</b>이 나오고, 바로 그래서 순서를 정하는 데 쓸 수 있습니다."
    ],
    onDone: function () { G4.q = true; window.sthState("aSec", G4); mission4(); }
  });

  window.sthOrder({
    mount: "a-order",
    steps: [
      "① ㉮ 석회암(얕은 바다) · ㉯ 셰일(고사리가 떠밀려 든 늪·호수) · ㉰ 사암(강가)이 차례로 수평으로 쌓였다",
      "② 지각 변동으로 이 지층 무리가 기울어지고 뒤집혔다",
      "③ 물 위로 융기해 윗부분이 깎여 나갔다",
      "④ 다시 가라앉아 그 위에 ㉱ 역암과 ㉲ 이암이 쌓였다 (부정합면 완성)",
      "⑤ 마그마가 전체를 뚫고 올라와 ㉳ 암맥이 되었다",
      "⑥ 다시 융기하고 깎여 오늘의 절벽 단면이 드러났다"
    ],
    onDone: function () { G4.o = true; window.sthState("aSec", G4); mission4(); }
  });

  function finish() { window.sthState("r1", "해결 · 아래 무리는 사층리로 판정한 역전 지층, 전체를 자른 암맥이 가장 젊다"); }
  function vsA() {
    var p = window.sthState("a-p") || "";
    $("a-vs").innerHTML = "<b>나의 첫 판단</b> " + (p || "기록 없음") + "<br>" +
      (p.indexOf("㉡") === 0 ? "정확했습니다. 실제로 이 절벽의 아래 무리는 뒤집혀 있었고, 사층리가 그 사실을 알려 주었습니다."
        : "㉡ 이 정답이었습니다. 지층 누중의 법칙에는 ‘역전되지 않았다면’이라는 조건이 붙습니다. 퇴적구조로 위아래를 먼저 정해야 합니다.");
  }
  vsA();
  ep.onShow(vsA);
  window.sthWork({
    mount: "wkA", unitLabel: "[지구과학 Ⅱ-1] 이야기 ① 절벽에 적힌 순서",
    items: [
      { id: "w1", label: "상대연령을 정한 근거", hint: "절벽 단면에서 어느 법칙을 어디에 적용했는지, 순서와 함께 쓰세요.", ph: "① … 법칙으로 … / ② … 법칙으로 …" },
      { id: "a2", label: "공사 감독에게 보내는 조사 보고", hint: "아래 지층 무리가 뒤집혀 있다고 판단한 근거를, 퇴적구조 하나를 예로 들어 설명하세요." }
    ]
  });
})();

/* =========================================================================
   이야기 ② 반으로, 또 반으로
   ========================================================================= */
(function () {
  var ep = window.sthStory({ root: "epB", key: "epB", name: "사건 파일 ②", onDone: finish });

  var ISO = {
    C14: { t: 5730, label: "¹⁴C", hl: "5,730년", d: "질소-14" },
    K40: { t: 1.25e9, label: "⁴⁰K", hl: "12.5억 년", d: "아르곤-40" },
    U238: { t: 4.47e9, label: "²³⁸U", hl: "44.7억 년", d: "납-206" }
  };

  window.sthGate({
    gate: "b-gate", key: "b-p", title: "실습 연구원의 첫 예상",
    question: "반감기가 5,730년인 <b>¹⁴C</b>로 약 7,000만 년 전 공룡 시대의 응회암 나이를 잴 수 있을까요?",
    options: [
      "㉠ 잴 수 있다 — 반감기를 여러 번 곱하기만 하면 된다",
      "㉡ 잴 수 없다 — 모원소가 거의 남지 않아 측정할 수가 없다",
      "㉢ 잴 수 없다 — 반감기는 온도와 압력에 따라 달라지기 때문이다"
    ],
    onPick: function (i) { window.sthState("bPredOK", i === 1 ? "맞음" : "어긋남"); ep.clear(0); }
  });

  /* ---- 장면2 반감기 계산기 ---- */
  (function () {
    var canvas = $("b-c-half"), ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var p = 80, iso = "K40";
    var got = window.sthState("bHalf") || { a: false, b: false, c: false };

    var ORDER = (function () { var a = [], R = K.rng(13), i; for (i = 0; i < 100; i++) a.push([R(), i]); a.sort(function (x, y) { return x[0] - y[0]; }); return a.map(function (q) { return q[1]; }); })();
    function draw() {
      ctx.clearRect(0, 0, W, H);
      var n = Math.log(100 / p) / Math.LN2, age = n * ISO[iso].t;
      var LW = 578, box = [0, LW];
      /* ── 왼쪽: 밝은 스튜디오 위 카드 그래프 ── */
      K.studio(ctx, 0, 0, LW, H);
      K.bigText(ctx, "절대연령 " + fmtAge(age), 18, 52, 28, "#ffd35a");
      K.bigText(ctx, "반감기 " + n.toFixed(2) + "번 지남", 18, 86, 18, "#ffffff");
      var g = K.chart(ctx, { x: 14, y: 104, w: 552, h: 300, x0: 0, x1: 7, y0: 0, y1: 100, xt: 7, yt: 4, pl: 56,
        xl: "지나간 반감기 횟수 →", yl: "남은 모원소", light: true, yf: function (v) { return v + "%"; } });
      var ag = ctx.createLinearGradient(0, g.T, 0, g.B); ag.addColorStop(0, "rgba(15,159,118,.28)"); ag.addColorStop(1, "rgba(15,159,118,.03)");
      ctx.fillStyle = ag; ctx.beginPath(); ctx.moveTo(g.X(0), g.B);
      var pts = [];
      for (var i = 0; i <= 140; i++) { var nn = i / 140 * 7; pts.push([nn, Math.pow(0.5, nn) * 100]); ctx.lineTo(g.X(nn), g.Y(Math.pow(0.5, nn) * 100)); }
      ctx.lineTo(g.X(7), g.B); ctx.closePath(); ctx.fill();
      K.plot(ctx, g, pts, LT.green, { light: true, w: 3 });
      [[1, "1번 · 50%"], [2, "2번 · 25%"], [3, "3번 · 12.5%"]].forEach(function (m) {
        var x = g.X(m[0]), y = g.Y(Math.pow(0.5, m[0]) * 100);
        ctx.save(); ctx.strokeStyle = "rgba(20,40,90,.3)"; ctx.setLineDash([4, 4]); ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(g.L, y); ctx.lineTo(x, y); ctx.lineTo(x, g.B); ctx.stroke(); ctx.restore();
        K.pill(ctx, m[1], x + 10, y - 8, { s: 11, c: "#e8ecff", box: box });
      });
      var cx = g.X(clamp(n, 0, 7)), cy = g.Y(p);
      ctx.save(); ctx.strokeStyle = "#e8590c"; ctx.setLineDash([3, 3]); ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(g.L, cy); ctx.lineTo(cx, cy); ctx.lineTo(cx, g.B); ctx.stroke(); ctx.restore();
      ctx.fillStyle = "#ffffff"; ctx.strokeStyle = "#12203a"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(cx, cy, 7, 0, 6.2832); ctx.fill(); ctx.stroke();
      if (p <= 5) K.tip(ctx, "⚠ 측정 한계에 가깝습니다 — 남은 모원소가 5 % 아래" + (iso === "C14" ? " (¹⁴C 는 수만 년까지)" : ""), 14, 410, 552, false);
      else K.tip(ctx, "반감기는 온도·압력이 바뀌어도 달라지지 않습니다 — 믿을 수 있는 시계", 14, 410, 552, null);

      /* ── 오른쪽: 흰 카드 — 원자 100개 ── */
      var RX = LW + 10, px = RX + 18, x1 = W - 18;
      judgeCard(ctx, RX, W, H, ISO[iso].label + " → " + ISO[iso].d + " · 반감기 " + ISO[iso].hl);
      var gx = px, gy = 46, cell = 17, nP = Math.round(p);
      ctx.fillStyle = "#e9eef5"; ctx.beginPath(); ctx.roundRect(gx - 6, gy - 6, cell * 10 + 12, cell * 10 + 12, 10); ctx.fill();
      var isP = {}; for (var a = 0; a < nP; a++) isP[ORDER[a]] = true;
      for (var j = 0; j < 100; j++) {
        var ax = gx + (j % 10) * cell + cell / 2, ay = gy + Math.floor(j / 10) * cell + cell / 2;
        if (isP[j]) K.planet(ctx, ax, ay, 6.4, "#5fe0b4", "#0b6e52");
        else K.planet(ctx, ax, ay, 6.4, "#c6b4ff", "#4b2fa0");
      }
      var tx = gx + cell * 10 + 16;
      K.t(ctx, "● 모원소", tx, gy + 16, { s: 11.5, w: "900", c: LT.green });
      K.t(ctx, p.toFixed(2) + "%", tx, gy + 38, { s: 16, w: "900", c: LT.green });
      K.t(ctx, "● 자원소", tx, gy + 76, { s: 11.5, w: "900", c: LT.violet });
      K.t(ctx, (100 - p).toFixed(2) + "%", tx, gy + 98, { s: 16, w: "900", c: LT.violet });
      K.t(ctx, "원자 100개", tx, gy + 150, { s: 10.5, w: "700", c: LT.dim });
      K.row(ctx, "모 : 자", "1 : " + ((100 - p) / p).toFixed(2), px, x1, 262);
      K.row(ctx, "지나간 반감기", n.toFixed(2) + " 번", px, x1, 290);
      K.bar(ctx, px, 302, x1 - px, n / 7, LT.green);
      K.t(ctx, "절대연령", px, 346, { s: 12, w: "800", c: LT.mute });
      K.t(ctx, fmtAge(age), px, 378, { s: 24, w: "900", c: LT.green });
      K.t(ctx, "= 반감기 × 지나간 횟수", px, 404, { s: 11, w: "700", c: LT.mute });
      K.t(ctx, "남은 비율 = (1/2)ⁿ", px, 428, { s: 11, w: "800", c: "#1179a6" });

      var ch = false;
      if (Math.abs(p - 50) <= 0.3 && !got.a) { got.a = ch = true; }
      if (Math.abs(p - 12.5) <= 0.3 && !got.b) { got.b = ch = true; }
      if (iso === "C14" && p <= 5 && !got.c) { got.c = ch = true; }
      if (ch) { window.sthState("bHalf", got); mission(); }

      $("b-half-read").innerHTML = "절대연령: <b>" + fmtAge(age) + "</b> (반감기 " + ISO[iso].hl + " × " + n.toFixed(2) + "회)";
      $("b-half-info").innerHTML = "모원소가 처음 양의 절반으로 줄어드는 데 걸리는 시간이 <b>반감기</b>입니다. 반감기가 n번 지나면 모원소는 <b>(1/2)<sup>n</sup></b> 만큼 남고, 줄어든 만큼은 모두 <b>자원소</b>가 되어 암석 안에 갇혀 있습니다. 그래서 두 양의 비만 재면 n이 나오고, 거기에 반감기를 곱하면 절대연령이 됩니다." +
        (p <= 5 ? " — 지금은 모원소가 너무 적게 남아 <b>측정 한계</b>에 가깝습니다." : "");
    }
    function mission() {
      if (got.a) done("m2-2a"); if (got.b) done("m2-2b"); if (got.c) done("m2-2c");
      if (got.a && got.b && got.c) {
        window.sthMission("m2-2", true, "<span class='m-tag'>미션 완료</span>1 : 1이면 반감기 1번, 1 : 7이면 3번입니다(남은 모원소 12.5 %). 그리고 남은 모원소가 너무 적어지면 더 이상 잴 수 없습니다 — 시계마다 <b>잴 수 있는 시간의 폭</b>이 정해져 있다는 뜻입니다.");
        ep.clear(1);
      }
    }
    canvas._redraw = draw;
    $("b-left").addEventListener("input", function (e) {
      p = +e.target.value; $("b-left-val").textContent = p.toFixed(2) + " %"; draw();
    });
    segWire("b-iso", function (b) { iso = b.getAttribute("data-i"); draw(); });
    draw(); mission();
  })();

  /* ---- 장면3 어떤 시계를 쓸 것인가 ---- */
  (function () {
    var canvas = $("b-c-pick"), ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var SAMP = [
      { n: "㉠ 유적의 숯", age: 12000, m: "불에 탄 나무 — 살아 있을 때 공기 중 탄소를 받아들였다" },
      { n: "㉡ 공룡 지층 위 응회암", age: 7e7, m: "화산재가 굳은 암석 — 굳는 순간 시계가 켜진다" },
      { n: "㉢ 화강암", age: 2e9, m: "땅속 깊이 마그마가 천천히 굳은 심성암" },
      { n: "㉣ 운석", age: 4.56e9, m: "태양계가 만들어질 때 굳은 채 그대로인 돌" }
    ];
    var k = 0, iso = "C14";
    var got = window.sthState("bPick") || { s: [false, false, false, false], b: false, c: false };
    if (!got.s) got.s = [false, false, false, false];
    var LO = 0.02, HI = 10;

    var LW = 600, AX0 = 46, AX1 = 574;
    function LX(y) { return AX0 + clamp((Math.log(Math.max(y, 1)) / Math.LN10 - 3) / 7.6, 0, 1) * (AX1 - AX0); }

    /* 시료 미니어처(입체): 숯 · 응회암 · 화강암 · 운석 */
    function sampleIcon(i, x, y) {
      var I = K.iso({ ox: x, oy: y, s: 1, L: 46, D: 34 });
      ctx.fillStyle = "rgba(20,30,50,.18)"; ctx.beginPath(); ctx.ellipse(x + 6, y + 36, 44, 10, 0, 0, 6.2832); ctx.fill();
      if (i === 0) {
        I.box(ctx, 0, 0, 0, 46, 34, 16, "#3a312c", "#1d1714", "#120d0b");
        I.face(ctx, "front", function () { ctx.strokeStyle = "rgba(255,255,255,.12)"; ctx.lineWidth = 1; for (var k = 4; k < 46; k += 6) { ctx.beginPath(); ctx.moveTo(k, 1); ctx.lineTo(k + 2, 15); ctx.stroke(); } });
        var e = I.P(30, 12, 16); K.glow(ctx, e.x, e.y, 2.4, "rgba(255,120,60,.95)", 3);
      } else if (i === 1) {
        I.box(ctx, 0, 0, 0, 46, 34, 26, "#ece4ee", "#d3c6d8", "#b3a6ba");
        I.face(ctx, "front", function () { texture(ctx, "tuff", 0, 0, 46, 26, 7, 0); ctx.strokeStyle = "rgba(120,90,130,.4)"; ctx.beginPath(); ctx.moveTo(0, 9); ctx.lineTo(46, 9); ctx.moveTo(0, 18); ctx.lineTo(46, 18); ctx.stroke(); });
      } else if (i === 2) {
        I.box(ctx, 0, 0, 0, 46, 34, 26, "#ecbdbb", "#d69a99", "#b47a7b");
        ["front", "right"].forEach(function (sd) { I.face(ctx, sd, function (Lw) { texture(ctx, "granite", 0, 0, Lw, 26, sd === "front" ? 2 : 4, 0); }); });
        var tp = I.P(0, 0, 26), R = K.rng(6); for (var d = 0; d < 40; d++) { var q = I.P(R() * 46, R() * 34, 26); ctx.fillStyle = R() > .6 ? "rgba(30,25,30,.8)" : "rgba(255,255,255,.8)"; ctx.fillRect(q.x, q.y, 2, 1.5); }
        void tp;
      } else {
        var c = I.P(23, 17, 16); K.planet(ctx, c.x, c.y, 18, "#a59684", "#2d2620");
        ctx.fillStyle = "rgba(20,15,10,.35)"; [[-6, -4, 3], [5, 3, 2.4], [-2, 7, 2]].forEach(function (h) { ctx.beginPath(); ctx.arc(c.x + h[0], c.y + h[1], h[2], 0, 6.2832); ctx.fill(); });
      }
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      var S = SAMP[k], ratio = S.age / ISO[iso].t, remain = Math.pow(0.5, ratio) * 100;
      var judge = ratio < LO ? "short" : (ratio > HI ? "long" : "ok"), box = [0, LW];
      K.studio(ctx, 0, 0, LW, H);
      K.bigText(ctx, judge === "ok" ? "잴 수 있습니다" : (judge === "long" ? "너무 오래되었습니다" : "너무 최근입니다"), 18, 52, 28, judge === "ok" ? "#7dffa8" : "#ff9a8a");
      K.bigText(ctx, S.n + " · " + ISO[iso].label + " 시계", 18, 86, 18, "#ffffff");

      /* 시계마다 잴 수 있는 범위(반감기의 1/50 ~ 10배) — 흰 카드 그래프 */
      ctx.fillStyle = "rgba(255,255,255,.75)"; ctx.beginPath(); ctx.roundRect(AX0 - 26, 108, AX1 - AX0 + 52, 216, 12); ctx.fill();
      K.t(ctx, "잴 수 있는 범위 (반감기의 1/50 ~ 10배)", AX0 - 10, 130, { s: 12, w: "800", c: LT.mute });
      var ay = 290;
      ctx.strokeStyle = LT.line; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(AX0, ay); ctx.lineTo(AX1, ay); ctx.stroke();
      [[1e3, "1천 년"], [1e5, "10만 년"], [1e7, "1천만 년"], [1e9, "10억 년"], [1e10, "100억 년"]].forEach(function (m) {
        var x = LX(m[0]);
        ctx.strokeStyle = "rgba(20,40,90,.10)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, 142); ctx.lineTo(x, ay); ctx.stroke();
        ctx.strokeStyle = LT.line; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, ay); ctx.lineTo(x, ay + 6); ctx.stroke();
        K.t(ctx, m[1], clamp(x, AX0 + 18, AX1 - 22), ay + 22, { s: 10.5, a: "center", c: LT.mute, w: "700" });
      });
      var rows = [["C14", "#e8590c", 166], ["K40", "#7048e8", 208], ["U238", "#0f9f76", 250]];
      rows.forEach(function (r) {
        var x0 = LX(ISO[r[0]].t * LO), x1 = LX(ISO[r[0]].t * HI), on = r[0] === iso;
        ctx.save(); ctx.globalAlpha = on ? 1 : .38;
        var bg = ctx.createLinearGradient(0, r[2] - 11, 0, r[2] + 11); bg.addColorStop(0, K.tint(r[1], 1.25)); bg.addColorStop(1, r[1]);
        ctx.fillStyle = bg; ctx.beginPath(); ctx.roundRect(x0, r[2] - 11, Math.max(x1 - x0, 3), 22, 11); ctx.fill(); ctx.restore();
        var lab = ISO[r[0]].label + " · 반감기 " + ISO[r[0]].hl;
        if (x0 < 250) K.pill(ctx, lab, x1 + 10, r[2] + 5, { s: 11.5, c: on ? "#ffffff" : "#c9d2e8", box: box });
        else K.pill(ctx, lab, x0 - 10, r[2] + 5, { s: 11.5, a: "right", c: on ? "#ffffff" : "#c9d2e8", box: box });
      });
      var sx = LX(S.age);
      ctx.save(); ctx.strokeStyle = "#12203a"; ctx.lineWidth = 2; ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.moveTo(sx, 146); ctx.lineTo(sx, ay); ctx.stroke(); ctx.restore();
      ctx.fillStyle = "#ffffff"; ctx.strokeStyle = "#12203a"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(sx, ay, 6.5, 0, 6.2832); ctx.fill(); ctx.stroke();
      /* 시료 미니어처와 이름 */
      var ix = clamp(sx, 90, 470);
      sampleIcon(k, ix - 30, 352);
      K.pill(ctx, S.n, ix + 44, 372, { s: 13, c: KC.ink, box: box });
      K.t(ctx, "실제 나이 약 " + fmtAge(S.age), ix + 44, 398, { s: 11.5, w: "800", c: LT.mute });
      K.warn(ctx, LW - 14, H - 14, "⚠ 가로축은 로그 눈금", "right");

      /* 오른쪽 판정 카드 */
      var RX = LW + 10, px = RX + 18, x1 = W - 18;
      judgeCard(ctx, RX, W, H, "판정");
      K.t(ctx, judge === "ok" ? "잴 수 있다" : (judge === "long" ? "너무 오래됨" : "너무 최근"), px, 64, { s: 22, w: "900", c: judge === "ok" ? LT.green : "#c2410c" });
      K.row(ctx, "쓰는 시계", ISO[iso].label + " → " + ISO[iso].d, px, x1, 102);
      K.row(ctx, "반감기", ISO[iso].hl, px, x1, 130);
      K.row(ctx, "나이 ÷ 반감기", (ratio < 0.001 ? ratio.toExponential(1) : ratio.toFixed(3)) + " 배", px, x1, 158);
      K.row(ctx, "남을 모원소", remain > 99.99 ? "99.99 % 이상" : (remain < 0.01 ? "0.01 % 미만" : remain.toFixed(2) + " %"), px, x1, 186, LT.green);
      K.bar(ctx, px, 198, x1 - px, remain / 100, LT.green);
      K.tip(ctx, judge === "ok" ? "모원소·자원소 둘 다 잴 만큼 있다" : (judge === "long" ? "모원소가 거의 남지 않았다" : "자원소가 거의 생기지 않았다"), px - 4, 224, x1 - px + 8, judge === "ok");
      wrapT(ctx, S.m, px, 286, x1 - px, 18, { s: 11.5, w: "700", c: LT.mute });
      var ns = got.s.filter(function (x) { return x; }).length;
      K.t(ctx, "잰 시료 " + ns + " / 4", px, 372, { s: 12.5, w: "900", c: ns >= 4 ? LT.green : LT.ink });
      for (var d2 = 0; d2 < 4; d2++) { ctx.fillStyle = got.s[d2] ? LT.green : "#d9e0ea"; ctx.beginPath(); ctx.arc(px + 8 + d2 * 22, 392, 7, 0, 6.2832); ctx.fill(); }
      K.t(ctx, "재려는 시간에 맞는 시계를!", px, 424, { s: 11.5, w: "800", c: "#1179a6" });

      var ch = false;
      if (judge === "ok" && !got.s[k]) { got.s[k] = ch = true; }
      if (k === 1 && iso === "C14" && !got.b) { got.b = ch = true; }
      if (k === 0 && iso === "K40" && !got.c) { got.c = ch = true; }
      if (ch) { window.sthState("bPick", got); mission(); }

      $("b-pick-info").innerHTML =
        judge === "ok" ? "<b>" + ISO[iso].label + " 로 잴 수 있습니다.</b> 모원소가 " + remain.toFixed(2) + " % 남아 있고 자원소도 충분히 쌓여, 두 양을 모두 잴 수 있습니다."
        : (judge === "long" ? "<b>너무 오래되었습니다.</b> 반감기의 " + ratio.toFixed(0) + " 배나 지나서 <b>모원소가 거의 남아 있지 않습니다.</b> 남은 양을 잴 수 없으면 시계를 읽을 수 없습니다."
          : "<b>너무 최근입니다.</b> 반감기에 견주면 눈 깜짝할 시간이라 <b>자원소가 거의 생기지 않았습니다.</b> 초시계로 한 해를 재려는 것과 같습니다.");
    }
    function mission() {
      if (got.s[0] && got.s[1] && got.s[2] && got.s[3]) done("m2-3a");
      if (got.b) done("m2-3b"); if (got.c) done("m2-3c");
      if (got.s[0] && got.s[1] && got.s[2] && got.s[3] && got.b && got.c) {
        window.sthMission("m2-3", true, "<span class='m-tag'>미션 완료</span>숯은 ¹⁴C, 응회암·화강암은 ⁴⁰K, 운석은 ²³⁸U나 ⁴⁰K로 잽니다. 나이가 반감기보다 <b>훨씬 길면 모원소가 남지 않고</b>, <b>훨씬 짧으면 자원소가 생기지 않습니다.</b> 그래서 재려는 시간에 맞는 시계를 골라야 합니다.");
        ep.clear(2);
      }
    }
    canvas._redraw = draw;
    segWire("b-sample", function (b) { k = +b.getAttribute("data-k"); draw(); });
    segWire("b-iso2", function (b) { iso = b.getAttribute("data-i"); draw(); });
    draw(); mission();
  })();

  /* ---- 장면4 지층 대비 ---- */
  var G4 = window.sthState("bCorr") || { a: false, b: false, c: false };
  function mission4() {
    if (G4.a) done("m2-4a"); if (G4.b) done("m2-4b"); if (G4.c) done("m2-4c");
    if (G4.a && G4.b && G4.c) {
      window.sthMission("m2-4", true, "<span class='m-tag'>미션 완료</span>같은 500만 년인데 가 지역은 1년에 0.05 mm, 나 지역은 0.012 mm로 쌓였습니다. <b>지층이 두껍다고 해서 더 오랜 시간이 걸린 것은 아닙니다.</b> 두 지역을 이어 준 것은 두께가 아니라 <b>건층(응회암)</b>과 <b>표준 화석</b> 이었습니다.");
      ep.clear(3); ep.clear(4);
    }
  }
  (function () {
    var canvas = $("b-c-corr"), ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var site = 0, rate = 30;                             /* rate : 0.001 mm/년 단위 */
    var REAL = [250, 60], DT = 5e6;

    /* 두 지역의 지층 기둥을 블록으로 잘라 세운다(아래 같은 바닥, 높이 = 실제 두께 × 0.62) */
    var PX = 0.62, ZB = 24, ZTF = 16, ZS2 = 6;
    function column(ox, idx, on) {
      var I = K.iso({ ox: ox, oy: 350, s: 1, L: 96, D: 70 }), h = REAL[idx] * PX;
      var z1 = ZB, z2 = z1 + ZTF, z3 = z2 + h, z4 = z3 + ZTF, zt = z4 + ZS2;
      var mid = idx === 0 ? "sand2" : "mud";
      ["front", "right"].forEach(function (side) {
        I.face(ctx, side, function (Lw) {
          layer(ctx, "shale", 0, 0, Lw, z1, 60 + idx);
          layer(ctx, "tuff", 0, z1, Lw, ZTF, 62 + idx);
          layer(ctx, mid, 0, z2, Lw, h, 64 + idx);
          ctx.strokeStyle = "rgba(40,30,20,.22)"; ctx.lineWidth = 1;
          for (var l = 1; l < Math.max(3, Math.round(h / 14)); l++) { var lz = z2 + h * l / Math.max(3, Math.round(h / 14)); ctx.beginPath(); ctx.moveTo(0, lz); ctx.lineTo(Lw, lz); ctx.stroke(); }
          layer(ctx, "tuff", 0, z3, Lw, ZTF, 66 + idx);
          layer(ctx, "soil", 0, z4, Lw, ZS2, 68 + idx);
          if (side === "front") {                          /* 표준 화석(암모나이트) 한 점 */
            var fx = Lw * .7, fz = z2 + h * .5;
            ctx.strokeStyle = "rgba(255,245,220,.9)"; ctx.lineWidth = 1.5; ctx.beginPath();
            for (var s = 0; s < 40; s++) { var a = s * .45, rr = 1 + s * .2; if (s) ctx.lineTo(fx + Math.cos(a) * rr, fz + Math.sin(a) * rr); else ctx.moveTo(fx, fz); }
            ctx.stroke();
          }
        });
      });
      I.shade(ctx, "right", function () { return zt; });
      I.shade(ctx, "front", function () { return zt; });
      I.plane(ctx, zt, "#7cae52", null);
      I.tree(ctx, 30, 30, zt, .8); I.tree(ctx, 70, 44, zt, .7);
      isoEdges(ctx, I, zt);
      if (on) {
        ctx.save(); ctx.strokeStyle = "#f59f00"; ctx.lineWidth = 3; ctx.shadowColor = "#f59f00"; ctx.shadowBlur = 10;
        var a1 = I.P(0, I.D, 0), a2 = I.P(I.L, I.D, 0), a3 = I.P(I.L, 0, 0), a4 = I.P(I.L, 0, zt), a5 = I.P(0, 0, zt), a6 = I.P(0, I.D, zt);
        ctx.beginPath(); ctx.moveTo(a1.x, a1.y); ctx.lineTo(a2.x, a2.y); ctx.lineTo(a3.x, a3.y); ctx.lineTo(a4.x, a4.y); ctx.lineTo(a5.x, a5.y); ctx.lineTo(a6.x, a6.y); ctx.closePath(); ctx.stroke(); ctx.restore();
      }
      return { I: I, lo: z1 + ZTF / 2, hi: z3 + ZTF / 2, mid: z2 + h / 2, zt: zt };
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      var mmPerYr = rate / 1000, calc = mmPerYr * DT / 1000;   /* m */
      var real = REAL[site], ok = Math.abs(calc - real) <= 5;
      var LW = 572, box = [0, LW];
      K.studio(ctx, 0, 0, LW, H, { x: 300, y: 438, rx: 270, ry: 40 });
      var A = column(150, 0, site === 0), B = column(410, 1, site === 1);
      /* 건층끼리 잇는 선 */
      [["hi", "위 응회암 · 6,900만 년 전"], ["lo", "아래 응회암 · 7,400만 년 전"]].forEach(function (q, i) {
        var a = A.I.P(A.I.L, A.I.D, A[q[0]]), b = B.I.P(0, B.I.D, B[q[0]]);
        ctx.save(); ctx.strokeStyle = "#7048e8"; ctx.lineWidth = 2.4; ctx.setLineDash([7, 5]);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.restore();
        [a, b].forEach(function (p) { ctx.fillStyle = "#7048e8"; ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, 6.2832); ctx.fill(); });
        var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        K.pill(ctx, q[1], mx, my + (i === 0 ? -12 : 26), { s: 11.5, a: "center", c: "#d9ccff", box: box });
      });
      var aP = A.I.P(0, A.I.D, 0), bP = B.I.P(0, B.I.D, 0);
      K.pill(ctx, "가 지역", aP.x + 36, aP.y + 34, { s: 13, a: "center", c: site === 0 ? KC.yellow : KC.ink, box: box });
      K.pill(ctx, "나 지역", bP.x + 36, bP.y + 34, { s: 13, a: "center", c: site === 1 ? KC.yellow : KC.ink, box: box });
      var ma = A.I.P(0, A.I.D, A.mid), mb = B.I.P(B.I.L, B.I.D * .5, B.mid);
      K.pill(ctx, "250 m", ma.x - 8, ma.y + 5, { s: 12.5, a: "right", c: "#ffe7b0", box: box });
      K.pill(ctx, "60 m", mb.x + 10, mb.y + 5, { s: 12.5, c: "#ffe7b0", box: box });
      K.pill(ctx, "🐚 두 지역에서 같은 표준 화석", LW - 14, 132, { s: 11.5, a: "right", c: "#f0e2c0", box: box });
      K.bigText(ctx, "같은 500만 년", 18, 52, 28, "#ffffff");
      K.bigText(ctx, "두께는 250 m 와 60 m", 18, 86, 18, "#ffd35a");
      K.warn(ctx, LW - 14, 30, "⚠ 두께는 실제 비율대로", "right");

      /* ── 오른쪽 계산 카드 ── */
      var RX = LW + 10, px = RX + 18, x1 = W - 18, bw = x1 - px;
      judgeCard(ctx, RX, W, H, "두께 = 퇴적 속도 × 시간");
      K.t(ctx, calc.toFixed(0) + " m", px, 70, { s: 28, w: "900", c: ok ? LT.green : "#b45309" });
      K.row(ctx, "내가 넣은 속도", mmPerYr.toFixed(3) + " mm/년", px, x1, 110, LT.blue);
      K.row(ctx, "지나간 시간", "500만 년", px, x1, 138);
      K.row(ctx, "실제 두께 (" + (site === 0 ? "가" : "나") + " 지역)", real + " m", px, x1, 166);
      K.tip(ctx, ok ? "맞았습니다" : (calc < real ? "더 빠르게 (속도 ↑)" : "더 느리게 (속도 ↓)"), px - 4, 186, bw + 8, ok);
      K.t(ctx, "실제 두께", px, 252, { s: 11, w: "800", c: LT.mute });
      K.bar(ctx, px, 260, bw, real / 300, "#9aa4b5");
      K.t(ctx, "내 계산", px, 292, { s: 11, w: "800", c: LT.mute });
      K.bar(ctx, px, 300, bw, calc / 300, ok ? LT.green : LT.blue);
      K.t(ctx, "0", px, 326, { s: 10, c: LT.dim }); K.t(ctx, "300 m", x1, 326, { s: 10, a: "right", c: LT.dim });
      K.t(ctx, "두 지역의 퇴적 속도는 다르지만", px, 380, { s: 11.5, w: "700", c: LT.mute });
      K.t(ctx, "두 건층 사이의 시간은 똑같습니다", px, 400, { s: 11.5, w: "700", c: LT.mute });
      K.t(ctx, "두께가 아니라 건층으로 잇는다", px, 440, { s: 11.5, w: "800", c: "#1179a6" });

      var ch = false;
      if (site === 0 && ok && !G4.a) { G4.a = ch = true; }
      if (site === 1 && ok && !G4.b) { G4.b = ch = true; }
      if (ch) { window.sthState("bCorr", G4); mission4(); }

      $("b-corr-read").innerHTML = "계산한 두께: <b>" + calc.toFixed(0) + " m</b> / 실제 " + real + " m";
      $("b-corr-info").innerHTML = ok
        ? "<b>맞았습니다.</b> " + (site === 0 ? "가 지역은 1년에 0.05 mm씩 쌓였습니다." : "나 지역은 1년에 0.012 mm씩 쌓였습니다.") + " 두 지역은 같은 500만 년을 보냈는데 두께는 네 배 넘게 차이가 납니다. <b>지층의 두께는 시간이 아니라 퇴적 속도가 정합니다.</b>"
        : "화산재가 굳은 <b>응회암</b>은 짧은 기간에 넓은 지역에 한꺼번에 쌓여, 멀리 떨어진 두 지역을 잇는 <b>건층(열쇠층)</b>이 됩니다. 두 응회암의 절대연령 차이가 500만 년이므로, 그 사이 지층은 어느 지역에서나 같은 500만 년 동안 쌓인 것입니다.";
    }
    canvas._redraw = draw;
    segWire("b-site", function (b) { site = +b.getAttribute("data-k"); draw(); });
    $("b-rate").addEventListener("input", function (e) {
      rate = +e.target.value; $("b-rate-val").textContent = (rate / 1000).toFixed(3) + " mm/년"; draw();
    });
    draw(); mission4();

    window.sthSort({
      mount: "b-sort",
      buckets: [
        { id: "key", label: "건층 (열쇠층)", sub: "짧은 시간에 넓게 쌓인 층" },
        { id: "idx", label: "표준 화석", sub: "시기를 알려 주는 화석" },
        { id: "no", label: "대비에 쓸 수 없다", sub: "시기를 가르지 못한다" }
      ],
      items: [
        { t: "화산이 터져 며칠 만에 넓은 지역을 덮은 화산재층", a: "key", why: "짧은 시간에 넓게 쌓여 어느 지역에서나 같은 시기를 가리킵니다." },
        { t: "색과 두께가 뚜렷해 멀리서도 알아보는 얇은 석탄층", a: "key", why: "특징이 뚜렷하고 넓게 이어지면 건층으로 쓸 수 있습니다.", hint: "‘어느 지역에서나 알아볼 수 있는가’를 따져 보세요." },
        { t: "고생대 바다에 짧게 번성하고 여러 대륙에서 나오는 삼엽충", a: "idx", why: "짧게 살고 넓게 퍼진 생물이라 시기를 콕 집어 줍니다." },
        { t: "중생대 바다에 널리 퍼져 있던 암모나이트", a: "idx", why: "종류가 자주 바뀌어 중생대 안에서도 시기를 더 잘게 가릅니다." },
        { t: "따뜻하고 얕은 바다에서만 자라는 산호", a: "no", why: "<b>시상 화석</b>입니다. 그때의 환경은 알려 주지만 시기는 가르지 못합니다.", hint: "이 생물은 아주 오랫동안 살아왔습니다." },
        { t: "고생대부터 지금까지 거의 변하지 않고 살아온 생물", a: "no", why: "너무 오래 살아남아 어느 시대의 지층인지 좁혀 주지 못합니다." },
        { t: "지역 안의 작은 웅덩이에만 쌓인 두꺼운 진흙층", a: "no", why: "좁은 지역에만 있어 다른 지역과 견줄 수가 없습니다.", hint: "옆 지역에도 같은 층이 있어야 이어 붙일 수 있습니다." }
      ],
      onDone: function () { G4.c = true; window.sthState("bCorr", G4); mission4(); }
    });
    mission4();
  })();

  function finish() { window.sthState("r2", "해결 · 남은 모원소 12.5%면 반감기 3번, 시계는 재려는 시간에 맞춰 골라야 한다"); }
  function vsB() {
    var p = window.sthState("b-p") || "";
    $("b-vs").innerHTML = "<b>나의 첫 예상</b> " + (p || "기록 없음") + "<br>" +
      (p.indexOf("㉡") === 0 ? "정확했습니다. 7,000만 년은 ¹⁴C 반감기의 1만 배가 넘어, 모원소가 한 톨도 남지 않습니다."
        : "㉡ 이 정답이었습니다. 반감기 자체는 온도·압력에 흔들리지 않습니다. 문제는 <b>모원소가 남아 있지 않다</b>는 것입니다.");
  }
  vsB();
  ep.onShow(vsB);
  window.sthWork({
    mount: "wkB", unitLabel: "[지구과학 Ⅱ-1] 이야기 ② 반으로, 또 반으로",
    items: [
      { id: "w2", label: "반감기로 나이 구하기", hint: "고른 시료의 남은 양과 반감기로 절대연령을 계산하고, 계산 과정을 쓰세요." },
      { id: "b2", label: "실습 연구원에게 보내는 답장", hint: "같은 절벽인데 시료마다 다른 동위원소를 써야 하는 까닭을, ‘너무 길면’과 ‘너무 짧으면’ 두 경우로 나누어 쓰세요." }
    ]
  });
})();

/* =========================================================================
   이야기 ③ 다섯 번의 대멸종과 화석 달력
   ========================================================================= */
(function () {
  var ep = window.sthStory({ root: "epC", key: "epC", name: "사건 파일 ③", onDone: finish });
  var EARTH = 4600;                                     /* 백만 년 단위 */
  var P_START = 538.8, M_START = 251.9, C_START = 66.0;

  window.sthGate({
    gate: "c-gate", key: "c-p", title: "학예사가 먼저 묻는 것",
    question: "하늘을 날던 <b>익룡</b>은 공룡일까요?",
    options: [
      "㉠ 공룡이다 — 중생대에 살았던 큰 파충류는 모두 공룡이다",
      "㉡ 공룡이 아니다 — 공룡은 중생대 육상에 살았던 공룡상목의 파충류를 가리킨다",
      "㉢ 공룡이다 — 공룡은 날 수 있는 것과 없는 것으로 나뉜다"
    ],
    onPick: function (i) { window.sthState("cPredOK", i === 1 ? "맞음" : "어긋남"); ep.clear(0); }
  });

  function eraOf(age) {
    if (age > P_START) return { n: "선캄브리아 시대", c: "--mist",
      d: "지구가 태어나고(46억 년 전) 굳은 뒤, 바다가 생기고 최초의 생명체가 나타난 시기입니다. 초기 대기에는 산소가 거의 없었고, 약 27억 년 전부터 <b>남세균</b>이 광합성으로 산소를 내놓으면서 바다와 대기의 산소가 늘었습니다. 말기에 이르러 단단한 껍데기가 없는 다세포 생물이 나타났습니다. 전체 지질 시대의 <b>약 88 %</b>를 차지합니다." };
    if (age > M_START) return { n: "고생대", c: "--teal",
      d: "껍데기를 가진 동물이 한꺼번에 나타나며(캄브리아기) 삼엽충이 바다를 뒤덮었습니다. 육지에는 양치식물의 큰 숲이 생겨 <b>석탄</b>이 되었고(석탄기), 말기에는 대륙이 모두 모여 초대륙 <b>판게아</b>가 되었습니다. 그리고 <b>페름기 말 대멸종</b>으로 끝납니다." };
    if (age > C_START) return { n: "중생대", c: "--coral",
      d: "판게아가 갈라지기 시작해 대서양이 열렸습니다. 전반적으로 <b>따뜻한 기후</b>가 이어져 극지방에도 빙하가 거의 없었고, 육지에는 <b>공룡</b>, 하늘에는 <b>익룡</b>, 바다에는 <b>암모나이트·어룡·수장룡</b>이 번성했습니다. 겉씨식물이 숲을 이루었습니다." };
    return { n: "신생대", c: "--violet",
      d: "대륙이 지금과 비슷하게 자리 잡고, 인도가 유라시아와 부딪쳐 <b>히말라야</b>가 솟았습니다. <b>포유류와 속씨식물</b>이 번성했고, 후반에는 기후가 차가워져 <b>빙하기</b>가 되풀이되었습니다. 그 끝자락에 사람이 나타났습니다." };
  }

  /* ---- 장면2 46억 년 달력 ---- */
  (function () {
    var canvas = $("c-c-cal"), ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var day = 1, hour = 0;
    var got = window.sthState("cCal") || { a: false, b: false, c: false, d: false };

    function ageOf(d, h) { return EARTH * (1 - ((d - 1) + h / 24) / 365); }

    var ECOL = { "선캄브리아 시대": "120,135,180", "고생대": "63,211,163", "중생대": "255,160,90", "신생대": "182,156,255" };
    function draw() {
      ctx.clearRect(0, 0, W, H);
      var age = ageOf(day, hour), era = eraOf(age);
      var EC = { "선캄브리아 시대": "#8c96b8", "고생대": "#0f9f76", "중생대": "#e8590c", "신생대": "#7048e8" };
      K.studio(ctx, 0, 0, W, H, { x: 800, y: 452, rx: 110, ry: 22 });
      K.bigText(ctx, dateLabel(day) + " " + Math.floor(hour) + "시 " + (hour % 1 ? "30" : "00") + "분", 18, 52, 26, "#ffffff");
      K.bigText(ctx, "약 " + fmtAge(age * 1e6) + " 전 · " + era.n, 18, 86, 18, "#ffd35a");

      /* ── 왼쪽: 흰 카드 달력 ── */
      K.card(ctx, 14, 100, 590, 362);
      var GX = 38, GY = 136, CW = 46.5, CH = 9.4;
      var idx = 0, selX = 0, selY = 0;
      for (var m = 0; m < 12; m++) {
        K.t(ctx, (m + 1) + "월", GX + m * CW + CW / 2 - 2, GY - 9, { s: 11, a: "center", w: "800", c: LT.mute });
        for (var dd = 0; dd < MDAYS[m]; dd++) {
          idx++;
          var e2 = eraOf(ageOf(idx, 12));
          ctx.globalAlpha = idx <= day ? .9 : .22;
          ctx.fillStyle = EC[e2.n]; ctx.beginPath(); ctx.roundRect(GX + m * CW, GY + dd * CH, CW - 5, CH - 2, 2); ctx.fill();
          ctx.globalAlpha = 1;
          if (idx === day) { selX = GX + m * CW; selY = GY + dd * CH; }
        }
      }
      ctx.strokeStyle = "#12203a"; ctx.lineWidth = 2.4; ctx.strokeRect(selX - 2, selY - 2, CW - 1, CH + 2);
      [["고생대 시작", P_START], ["중생대", M_START], ["신생대", C_START]].forEach(function (q) {
        var dIdx = Math.ceil((1 - q[1] / EARTH) * 365);
        var mm = 0, d0 = dIdx; while (mm < 11 && d0 > MDAYS[mm]) { d0 -= MDAYS[mm]; mm++; }
        var yx = GX + mm * CW + CW - 9, yy = GY + (d0 - 1) * CH + 3.5;
        ctx.fillStyle = "#ffffff"; ctx.strokeStyle = "#12203a"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(yx, yy, 3.2, 0, 6.2832); ctx.fill(); ctx.stroke();
      });
      K.t(ctx, "○ 흰 점 = 대가 바뀌는 날", GX, 450, { s: 11, w: "800", c: LT.mute });
      K.t(ctx, "하루 = 약 1,260만 년", 590, 450, { s: 11, w: "800", a: "right", c: LT.mute });

      /* ── 오른쪽: 시간의 지층 기둥(두께 = 각 시대의 길이) — 달력이 흐를수록 쌓인다 ── */
      var I = K.iso({ ox: 800, oy: 398, s: 1, L: 56, D: 56 }), ZT = 330;
      var zm = (EARTH - age) / EARTH * ZT;
      var SEG = [["선캄브리아 시대", EARTH, P_START], ["고생대", P_START, M_START], ["중생대", M_START, C_START], ["신생대", C_START, 0]];
      SEG.forEach(function (sg) {
        var z0 = (EARTH - sg[1]) / EARTH * ZT, z1 = Math.min(zm, (EARTH - sg[2]) / EARTH * ZT);
        if (z1 <= z0) return;
        var c = EC[sg[0]];
        I.box(ctx, 0, 0, z0, I.L, I.D, z1, K.tint(c, 1.25), c, K.tint(c, .72));
        if (sg[0] === "선캄브리아 시대") I.face(ctx, "front", function () { ctx.strokeStyle = "rgba(255,255,255,.18)"; ctx.lineWidth = 1; for (var lz = 12; lz < z1; lz += 12) { ctx.beginPath(); ctx.moveTo(0, lz); ctx.lineTo(56, lz); ctx.stroke(); } });
      });
      /* 아직 쌓이지 않은 시간: 점선 틀 */
      ctx.save(); ctx.strokeStyle = "rgba(20,40,90,.35)"; ctx.setLineDash([4, 4]); ctx.lineWidth = 1.2;
      var g1 = I.P(0, I.D, ZT), g2 = I.P(I.L, I.D, ZT), g3 = I.P(I.L, 0, ZT), g4 = I.P(0, 0, ZT), g5 = I.P(0, I.D, zm), g6 = I.P(I.L, I.D, zm), g7 = I.P(I.L, 0, zm);
      ctx.beginPath(); ctx.moveTo(g1.x, g1.y); ctx.lineTo(g2.x, g2.y); ctx.lineTo(g3.x, g3.y); ctx.lineTo(g4.x, g4.y); ctx.closePath();
      ctx.moveTo(g5.x, g5.y); ctx.lineTo(g1.x, g1.y); ctx.moveTo(g6.x, g6.y); ctx.lineTo(g2.x, g2.y); ctx.moveTo(g7.x, g7.y); ctx.lineTo(g3.x, g3.y); ctx.stroke(); ctx.restore();
      isoEdges(ctx, I, zm);
      var mp = I.P(I.L, I.D * .5, zm);
      ctx.fillStyle = "#ffffff"; ctx.strokeStyle = "#12203a"; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.arc(mp.x, mp.y, 5, 0, 6.2832); ctx.fill(); ctx.stroke();
      K.pill(ctx, "지금", mp.x + 12, mp.y + 5, { s: 11.5, c: KC.yellow });
      var box = [606, W];
      var zc = function (a) { return (EARTH - a) / EARTH * ZT; };
      I.label(ctx, 0, I.D, zc(33), "신생대 1.4 %", -40, -40, "#cdbfff", box);
      I.label(ctx, 0, I.D, zc(159), "중생대 4.0 %", -40, -14, "#ffc39a", box);
      I.label(ctx, 0, I.D, zc(395), "고생대 6.2 %", -40, 12, "#9ff0d0", box);
      I.label(ctx, 0, I.D, zc(2600), "선캄브리아 88 %", -36, 10, "#d6dcf2", box);
      K.t(ctx, "기둥 두께 = 시대의 길이", 900 - 14, 34, { s: 11, w: "800", a: "right", c: LT.mute });

      var ch = false;
      if (Math.abs(age - P_START) <= 10 && !got.a) { got.a = ch = true; }
      if (Math.abs(age - M_START) <= 10 && !got.b) { got.b = ch = true; }
      if (Math.abs(age - C_START) <= 8 && !got.c) { got.c = ch = true; }
      if (day === 365 && !got.d) { got.d = ch = true; }
      if (ch) { window.sthState("cCal", got); mission(); }

      $("c-cal-read").innerHTML = "지금 이 시각은 약 <b>" + fmtAge(age * 1e6) + " 전</b> — " + era.n;
      $("c-cal-info").innerHTML = "<b>" + era.n + "</b> — " + era.d +
        (day === 365 ? (hour >= 23.5 ? " <br><b>지금 남은 시간은 30분도 되지 않습니다.</b>이 마지막 30분이 사람(호모 사피엔스)이 살아온 약 30만 년입니다." : " <br>마지막 날입니다. 사람(호모 사피엔스)은 이날 <b>밤 11시 30분이 넘어서야</b> 나타납니다 — 시각 막대를 끝까지 밀어 보세요.") : "");
    }
    function mission() {
      if (got.a) done("m3-2a"); if (got.b) done("m3-2b"); if (got.c) done("m3-2c"); if (got.d) done("m3-2d");
      if (got.a && got.b && got.c && got.d) {
        window.sthMission("m3-2", true, "<span class='m-tag'>미션 완료</span>고생대는 <b>11월 중순</b>, 중생대는 <b>12월 중순</b>, 신생대는 <b>12월 26일</b>에야 시작됩니다. 지구 역사의 대부분은 화석이 드문 <b>선캄브리아 시대</b>이고, 사람은 <b>마지막 30분</b>에 나타났습니다.");
        ep.clear(1);
      }
    }
    canvas._redraw = draw;
    $("c-day").addEventListener("input", function (e) { day = +e.target.value; $("c-day-val").textContent = dateLabel(day); draw(); });
    $("c-hour").addEventListener("input", function (e) {
      hour = +e.target.value;
      $("c-hour-val").textContent = Math.floor(hour) + "시 " + (hour % 1 ? "30" : "00") + "분"; draw();
    });
    draw(); mission();
  })();

  /* ---- 장면3 다섯 번의 대멸종 ---- */
  var G3 = window.sthState("cExt") || { v: [false, false, false, false, false], q: false };
  if (!G3.v) G3.v = [false, false, false, false, false];
  function mission3() {
    var all = G3.v[0] && G3.v[1] && G3.v[2] && G3.v[3] && G3.v[4];
    if (all) done("m3-3a");
    if (G3.q) done("m3-3b");
    if (all && G3.q) {
      window.sthMission("m3-3", true, "<span class='m-tag'>미션 완료</span>다섯 번 가운데 가장 컸던 것은 공룡이 사라진 백악기 말이 아니라 <b>고생대를 끝낸 페름기 말</b>이었습니다. 지질 시대를 대(代)와 기(紀)로 가르는 기준이 바로 이런 <b>생물계의 큰 변화</b>입니다.");
      ep.clear(2);
    }
  }
  (function () {
    var canvas = $("c-c-ext"), ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var t = 541;
    var EV = [
      { t: 445, n: "오르도비스기 말", sev: 0.57, d: "곤드와나 대륙이 남극 쪽으로 옮겨 가며 빙하기가 찾아왔고, 해수면이 크게 내려가 얕은 바다의 생물이 큰 피해를 입었습니다." },
      { t: 372, n: "데본기 후기", sev: 0.50, d: "여러 차례에 걸쳐 일어났습니다. 산호초를 이루던 생물과 갑주어 종류가 크게 줄었습니다." },
      { t: 252, n: "페름기 말", sev: 0.82, d: "지질 시대를 통틀어 <b>가장 큰 멸종</b>입니다. 시베리아에서 엄청난 규모의 화산 활동이 이어졌고, 바다 생물의 대부분이 사라졌습니다. 삼엽충도 이때 끝났습니다. 이 사건이 <b>고생대와 중생대의 경계</b>입니다." },
      { t: 201, n: "트라이아스기 말", sev: 0.48, d: "판게아가 갈라지며 대규모 화산 활동이 일어났습니다. 경쟁자가 사라진 자리를 공룡이 차지하며 크게 번성하게 됩니다." },
      { t: 66, n: "백악기 말", sev: 0.50, d: "거대한 운석이 충돌하며 먼지가 햇빛을 가렸습니다. 공룡과 함께 익룡·어룡·수장룡·암모나이트가 모두 사라졌고, 그 뒤 포유류가 번성합니다. <b>중생대와 신생대의 경계</b>입니다." }
    ];
    var PER = [
      [541, 485, "캄", "캄브리아기"], [485, 444, "오", "오르도비스기"], [444, 419, "실", "실루리아기"],
      [419, 359, "데", "데본기"], [359, 299, "석", "석탄기"], [299, 252, "페", "페름기"],
      [252, 201, "트", "트라이아스기"], [201, 145, "쥐", "쥐라기"], [145, 66, "백", "백악기"],
      [66, 23, "고진", "고진기"], [23, 2.6, "신진", "신진기"], [2.6, 0, "제4", "제4기"]
    ];
    var D = [], cur = 180;
    for (var a = 541; a >= 0; a--) {
      for (var j = 0; j < EV.length; j++) if (EV[j].t === a) cur = cur * (1 - EV[j].sev);
      D[a] = cur;
      cur = cur + 0.012 * cur * (1 - cur / 2800);
    }
    var X0 = 90, X1 = 860, Y0 = 92, Y1 = 400;
    function XT(aa) { return X0 + (541 - aa) / 541 * (X1 - X0); }
    function YD(d) { return Y1 - clamp(d / 2800, 0, 1) * (Y1 - Y0); }

    function evAt(aa) { for (var i = 0; i < EV.length; i++) if (Math.abs(aa - EV[i].t) <= 3) return i; return -1; }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      var ei = evAt(t), LW = 640, box = [0, LW];
      var per = "";
      for (var q = 0; q < PER.length; q++) if (t <= PER[q][0] && t > PER[q][1]) per = PER[q][3];
      if (!per) per = "제4기";
      K.studio(ctx, 0, 0, LW, H);
      K.bigText(ctx, t + "백만 년 전 · " + per, 18, 52, 26, "#ffffff");
      if (ei >= 0) K.bigText(ctx, EV[ei].n + " 대멸종", 18, 86, 19, "#ff9a8a");
      else K.bigText(ctx, "곡선이 뚝 떨어지는 자리를 찾아보세요", 18, 86, 17, "#ffd35a");
      K.warn(ctx, LW - 14, 30, "⚠ 모형 곡선 · 실제 자료 아님", "right");
      var g = K.chart(ctx, { x: 14, y: 104, w: 612, h: 250, x0: 541, x1: 0, y0: 0, y1: 2800, xt: 1, yt: 4, pl: 30,
        yl: "↑ 생물 종류의 수 (모형)", light: true, xf: function () { return ""; }, yf: function () { return ""; } });
      var XT = g.X, YD = function (d) { return g.Y(clamp(d, 0, 2800)); };
      var ag = ctx.createLinearGradient(0, g.T, 0, g.B); ag.addColorStop(0, "rgba(15,159,118,.30)"); ag.addColorStop(1, "rgba(15,159,118,.04)");
      ctx.fillStyle = ag; ctx.beginPath(); ctx.moveTo(XT(541), g.B);
      for (var a1 = 541; a1 >= 0; a1--) ctx.lineTo(XT(a1), YD(D[a1]));
      ctx.lineTo(XT(0), g.B); ctx.closePath(); ctx.fill();
      var pts = [];
      for (var aa = 541; aa >= 0; aa--) pts.push([aa, clamp(D[aa], 0, 2800)]);
      K.plot(ctx, g, pts, LT.green, { light: true, w: 2.8 });
      EV.forEach(function (e, i) {
        var x = XT(e.t), on = i === ei;
        ctx.save(); ctx.strokeStyle = on ? LT.red : "rgba(224,49,49,.45)"; ctx.lineWidth = on ? 2.6 : 1.3; ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.moveTo(x, g.T); ctx.lineTo(x, g.B); ctx.stroke(); ctx.restore();
        ctx.fillStyle = G3.v[i] ? LT.green : (on ? LT.red : "#ffffff"); ctx.strokeStyle = G3.v[i] ? LT.green : LT.red; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(x, g.T + 14, 10, 0, 6.2832); ctx.fill(); ctx.stroke();
        K.t(ctx, String(i + 1), x, g.T + 18.5, { s: 12, w: "900", a: "center", c: G3.v[i] || on ? "#ffffff" : LT.red });
      });
      var cx = XT(t);
      ctx.strokeStyle = "#f59f00"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx, g.T + 28); ctx.lineTo(cx, g.B); ctx.stroke();
      var cy = YD(D[Math.round(clamp(t, 0, 541))]);
      ctx.fillStyle = "#ffffff"; ctx.strokeStyle = "#12203a"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(cx, cy, 7, 0, 6.2832); ctx.fill(); ctx.stroke();
      /* 기(紀) 띠와 대(代) 띠 */
      var by = g.B + 6;
      PER.forEach(function (p, i) {
        var x0 = XT(p[0]), x1 = XT(p[1]), on = t <= p[0] && t > p[1];
        ctx.fillStyle = on ? "#ffe8a3" : (i % 2 ? "#dbe9f6" : "#dff3ea"); ctx.fillRect(x0, by, x1 - x0, 24);
        ctx.strokeStyle = "rgba(20,40,90,.15)"; ctx.lineWidth = 1; ctx.strokeRect(x0, by, x1 - x0, 24);
        if (x1 - x0 > 20) K.t(ctx, p[2], (x0 + x1) / 2, by + 17, { s: 11, a: "center", w: "800", c: on ? "#8a5a00" : LT.mute });
      });
      [[541, 252, "고생대", "#0f9f76"], [252, 66, "중생대", "#e8590c"], [66, 0, "신생대", "#7048e8"]].forEach(function (e2) {
        var x0 = XT(e2[0]), x1 = XT(e2[1]);
        ctx.fillStyle = e2[3]; ctx.fillRect(x0, by + 26, x1 - x0, 22);
        K.t(ctx, e2[2], (x0 + x1) / 2, by + 42, { s: 11.5, a: "center", w: "900", c: "#ffffff" });
      });
      K.t(ctx, "541", g.L, by + 66, { s: 10.5, a: "center", w: "700", c: LT.mute });
      K.t(ctx, "0 (현재)", g.R, by + 66, { s: 10.5, a: "right", w: "700", c: LT.mute });
      K.t(ctx, "← 백만 년 전", (g.L + g.R) / 2, by + 66, { s: 10.5, a: "center", w: "700", c: LT.mute });
      K.tip(ctx, "지질 시대의 경계는 생물계의 큰 변화로 정합니다", 14, by + 80, 612, null);

      /* ── 오른쪽 카드: 다섯 번의 대멸종 ── */
      var RX = LW + 10, px = RX + 18, x1c = W - 18;
      judgeCard(ctx, RX, W, H, "다섯 번의 대멸종");
      var nf = G3.v.filter(function (x) { return x; }).length;
      K.t(ctx, "찾은 곳 " + nf + " / 5", px, 62, { s: 20, w: "900", c: nf >= 5 ? LT.green : LT.ink });
      EV.forEach(function (e, i) {
        var y = 102 + i * 30, on = i === ei;
        if (on) { ctx.fillStyle = "#ffe9e9"; ctx.beginPath(); ctx.roundRect(px - 8, y - 19, x1c - px + 16, 27, 8); ctx.fill(); }
        K.t(ctx, (i + 1) + " " + e.n, px, y, { s: 12, w: on ? "900" : "700", c: G3.v[i] ? LT.ink : LT.dim });
        K.t(ctx, G3.v[i] ? "약 " + Math.round(e.sev * 100) + " %" : "?", x1c, y, { s: 12.5, w: "900", a: "right", c: G3.v[i] ? LT.red : LT.dim });
      });
      K.t(ctx, ei >= 0 ? "사라진 생물 속" : "지금 시기", px, 270, { s: 12, w: "800", c: LT.mute });
      K.t(ctx, ei >= 0 ? "약 " + Math.round(EV[ei].sev * 100) + " %" : per, px, 302, { s: 24, w: "900", c: ei >= 0 ? LT.red : LT.ink });
      K.bar(ctx, px, 316, x1c - px, ei >= 0 ? EV[ei].sev : 0, LT.red);
      K.t(ctx, "가장 큰 멸종은 언제였을까요?", px, 372, { s: 11.5, w: "700", c: LT.mute });
      K.t(ctx, "곡선이 뚝 떨어지는 곳 = 대멸종", px, 440, { s: 11, w: "700", c: LT.mute });

      if (ei >= 0 && !G3.v[ei]) { G3.v[ei] = true; window.sthState("cExt", G3); mission3(); }

      $("c-ext-read").innerHTML = ei >= 0
        ? "멸종률: <b>약 " + Math.round(EV[ei].sev * 100) + " %</b> (" + EV[ei].n + ")"
        : "멸종률: 지금은 대멸종 시기가 아닙니다";
      $("c-ext-info").innerHTML = ei >= 0
        ? "<b>" + EV[ei].n + " 대멸종</b> (약 " + EV[ei].t + "백만 년 전) — " + EV[ei].d
        : "지금은 <b>" + per + "</b>입니다. 지질 시대의 경계는 암석의 종류가 아니라 <b>생물계의 큰 변화</b>로 정합니다. 곡선이 뚝 떨어지는 다섯 자리를 찾아보세요.";
    }
    canvas._redraw = draw;
    $("c-t").addEventListener("input", function (e) { t = +e.target.value; $("c-t-val").textContent = t + "백만 년 전"; draw(); });
    draw(); mission3();
  })();

  window.sthPick({
    mount: "c-q1",
    q: "백악기 말(약 6,600만 년 전) 대멸종 때 사라진 것으로 옳은 것은?",
    options: [
      "㉠ 공룡만 사라지고 익룡·어룡·수장룡은 살아남았다",
      "㉡ 공룡과 함께 익룡·어룡·수장룡, 암모나이트도 사라졌다",
      "㉢ 공룡은 살아남았고 암모나이트만 사라졌다"
    ],
    answer: 1,
    why: [
      "익룡·어룡·수장룡도 이때 함께 사라졌습니다. 다만 이들은 <b>공룡이 아닙니다</b> — 같은 시대를 살았을 뿐입니다.",
      "그렇습니다. 중생대 바다와 하늘을 채우던 큰 파충류와 암모나이트가 이때 함께 사라졌습니다. 그런데 <b>익룡·어룡·수장룡은 공룡이 아닙니다.</b> 전시 목록을 고쳐야 할 대목이 바로 여기입니다.",
      "거꾸로입니다. 공룡은 이 사건으로 사라졌고(조류로 이어진 무리는 남았습니다), 암모나이트도 함께 사라졌습니다."
    ],
    onDone: function () { G3.q = true; window.sthState("cExt", G3); mission3(); }
  });

  /* ---- 장면4 표준 화석의 조건 ---- */
  var G4 = window.sthState("cIdx") || { a: false, b: false, c: false, d: false };
  function mission4() {
    if (G4.a) done("m3-4a"); if (G4.b) done("m3-4b"); if (G4.c) done("m3-4c"); if (G4.d) done("m3-4d");
    if (G4.a && G4.b && G4.c && G4.d) {
      window.sthMission("m3-4", true, "<span class='m-tag'>미션 완료</span>좋은 표준 화석은 <b>짧게 살고 넓게 퍼진</b> 생물입니다. 오래 살면 시대를 가르지 못하고, 좁게 퍼지면 다른 지역과 견줄 수 없습니다. 반대로 <b>오래 살고 특정 환경에서만</b> 사는 생물은 시기 대신 <b>그때의 환경</b>을 알려 주는 <b>시상 화석</b>이 됩니다.");
      ep.clear(3); ep.clear(4);
    }
  }
  (function () {
    var canvas = $("c-c-index"), ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var span = 5000, area = 5;                            /* span : 만 년 */
    var CRET = 7900;                                      /* 백악기 길이 (만 년) */
    var X0 = 120, X1 = 560, Y0 = 84, Y1 = 330;
    function XS(s) { return X0 + (Math.log(s) / Math.LN10 - Math.log(50) / Math.LN10) / (Math.log(20000) / Math.LN10 - Math.log(50) / Math.LN10) * (X1 - X0); }
    function YA(a) { return Y1 - (a - 1) / 5 * (Y1 - Y0); }

    var CONT = [[30, 18, 34, 18, "북아메리카"], [52, 48, 18, 22, "남아메리카"], [100, 16, 30, 14, "유럽"], [104, 44, 22, 22, "아프리카"], [150, 20, 40, 18, "아시아"], [168, 56, 20, 12, "오세아니아"]];
    function draw() {
      ctx.clearRect(0, 0, W, H);
      var good = span <= 1000 && area >= 4;
      var LW = 582, box = [0, LW];
      ctx.clearRect(0, 0, W, H);
      K.studio(ctx, 0, 0, LW, H);
      var verdict = good ? "좋은 표준 화석" : (span > 1000 ? "너무 오래 살았다" : "너무 좁게 퍼졌다");
      K.bigText(ctx, verdict, 18, 52, 28, good ? "#7dffa8" : "#ff9a8a");
      K.bigText(ctx, "살았던 기간 " + (span >= 10000 ? (span / 10000).toFixed(1) + "억 년" : span.toLocaleString() + "만 년") + " · 대륙 " + area + "곳", 18, 86, 17, "#ffffff");
      /* 밝은 카드 그래프(가로축 로그 눈금) */
      var L0 = Math.log(50) / Math.LN10, L1 = Math.log(20000) / Math.LN10;
      var g = K.chart(ctx, { x: 14, y: 104, w: 560, h: 270, x0: L0, x1: L1, y0: 1, y1: 6, xt: 1, yt: 5, pl: 54,
        xl: "살았던 기간 (만 년) →", yl: "대륙 수", light: true, xf: function () { return ""; } });
      function XS(s) { return g.X(Math.log(s) / Math.LN10); }
      function YA(a) { return g.Y(a); }
      [50, 100, 500, 1000, 5000, 20000].forEach(function (s) {
        ctx.strokeStyle = LT.grid; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(XS(s), g.T); ctx.lineTo(XS(s), g.B); ctx.stroke();
        K.t(ctx, s >= 10000 ? (s / 10000) + "억" : s.toLocaleString(), XS(s), g.B + 16, { s: 10.5, a: "center", c: LT.mute, w: "600" });
      });
      var zx0 = XS(50), zx1 = XS(1000), zy0 = YA(6), zy1 = YA(4);
      ctx.fillStyle = "rgba(15,159,118,.16)"; ctx.fillRect(zx0, zy0, zx1 - zx0, zy1 - zy0 + 8);
      ctx.save(); ctx.strokeStyle = "rgba(15,159,118,.7)"; ctx.setLineDash([5, 4]); ctx.lineWidth = 1.5; ctx.strokeRect(zx0, zy0, zx1 - zx0, zy1 - zy0 + 8); ctx.restore();
      K.pill(ctx, "좋은 표준 화석", (zx0 + zx1) / 2, YA(5) + 5, { s: 12.5, a: "center", c: "#7dffa8", box: box });
      K.t(ctx, "↘ 오래 살고 좁게 퍼지면 시상 화석 쪽", g.R - 6, YA(1.4), { s: 11, a: "right", w: "800", c: LT.mute });
      var mx = XS(span), my = YA(area), mc = good ? LT.green : LT.red;
      ctx.save(); ctx.strokeStyle = mc; ctx.setLineDash([3, 3]); ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(g.L, my); ctx.lineTo(mx, my); ctx.lineTo(mx, g.B); ctx.stroke(); ctx.restore();
      ctx.fillStyle = "#ffffff"; ctx.strokeStyle = mc; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(mx, my, 8, 0, 6.2832); ctx.fill(); ctx.stroke();
      K.tip(ctx, "1,000만 년 이하 · 4개 대륙 이상을 기준으로 삼았습니다", 14, 380, 560, null);

      /* ── 오른쪽 판정 카드 ── */
      var RX = LW + 10, px = RX + 18, x1 = W - 18, bw = x1 - px;
      judgeCard(ctx, RX, W, H, "판정");
      K.t(ctx, verdict, px, 62, { s: 20, w: "900", c: good ? LT.green : "#c2410c" });
      /* 세계 지도 미니어처: 화석이 나오는 대륙에 표시 */
      var mx0 = px, my0 = 82, mw = bw, mh = 104;
      var og = ctx.createLinearGradient(0, my0, 0, my0 + mh); og.addColorStop(0, "#cfe8fb"); og.addColorStop(1, "#a9d3f2");
      ctx.fillStyle = og; ctx.beginPath(); ctx.roundRect(mx0, my0, mw, mh, 12); ctx.fill();
      var sx = mw / 270, sy = mh / 96;
      CONT.forEach(function (c, i) {
        var on = i < area, cx = mx0 + 14 + c[0] * sx * 1.25, cy = my0 + 8 + c[1] * sy * 1.25;
        ctx.fillStyle = on ? "#5e7f3c" : "#8f9a8a"; ctx.beginPath(); ctx.ellipse(cx + 1.5, cy + 3, c[2] * .62 * sx * 1.25, c[3] * .62 * sy * 1.25, .2, 0, 6.2832); ctx.fill();
        var lg = ctx.createLinearGradient(0, cy - c[3] * .6, 0, cy + c[3] * .6); lg.addColorStop(0, on ? "#a9d27a" : "#c7cdc2"); lg.addColorStop(1, on ? "#7aa851" : "#a9b0a4");
        ctx.fillStyle = lg; ctx.beginPath(); ctx.ellipse(cx, cy, c[2] * .62 * sx * 1.25, c[3] * .62 * sy * 1.25, .2, 0, 6.2832); ctx.fill();
        if (on) { ctx.fillStyle = "#f59f00"; ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cy, 4, 0, 6.2832); ctx.fill(); ctx.stroke(); }
      });
      K.row(ctx, "나오는 대륙", area + " 곳 / 6 곳", px, x1, 212, area >= 4 ? LT.green : LT.red);
      K.row(ctx, "살았던 기간", span >= 10000 ? (span / 10000).toFixed(1) + "억 년" : span.toLocaleString() + "만 년", px, x1, 240, span <= 1000 ? LT.green : LT.red);
      K.t(ctx, "좁힐 수 있는 폭 · 백악기의 " + (span / CRET * 100).toFixed(0) + " %", px, 274, { s: 11.5, w: "800", c: LT.mute });
      K.bar(ctx, px, 282, bw, span / CRET, span <= 1000 ? LT.green : LT.red);
      K.t(ctx, "만나 볼 수 있을 확률 " + Math.round(area / 6 * 100) + " %", px, 318, { s: 11.5, w: "800", c: LT.mute });
      K.bar(ctx, px, 326, bw, area / 6, area >= 4 ? LT.green : LT.red);
      K.t(ctx, "짧게 살고, 넓게 퍼질 것", px, 372, { s: 12, w: "900", c: "#1179a6" });
      K.t(ctx, "⚠ 대륙 모양은 모식적", px, 400, { s: 10.5, w: "700", c: LT.dim });

      var ch = false;
      if (good && !G4.a) { G4.a = ch = true; }
      if (span >= 10000 && !G4.b) { G4.b = ch = true; }
      if (area === 1 && !G4.c) { G4.c = ch = true; }
      if (ch) { window.sthState("cIdx", G4); mission4(); }

      $("c-index-read").innerHTML = "판정: <b>" + (good ? "좋은 표준 화석" : (span > 1000 ? "너무 오래 살았다" : "너무 좁게 퍼졌다")) + "</b>";
      $("c-index-info").innerHTML = good
        ? "<b>좋은 표준 화석입니다.</b>이 화석이 나오면 지층의 나이를 백악기 전체의 " + (span / CRET * 100).toFixed(0) + " % 폭까지 좁힐 수 있고, 대륙 " + area + " 곳에서 나오므로 멀리 떨어진 지역끼리도 이어 붙일 수 있습니다."
        : (span > 1000 ? "<b>너무 오래 살았습니다.</b>이 생물이 나온다고 해서 지층의 시기를 좁힐 수가 없습니다. 예를 들어 고생대부터 지금까지 사는 생물이라면, 그 화석은 시대를 가르는 데 아무 도움이 되지 않습니다."
          : "<b>너무 좁게 퍼졌습니다.</b> 한 지역에만 있는 화석은 다른 지역 지층과 견줄 수가 없습니다. 표준 화석은 <b>여러 대륙에서 두루 나와야</b> 합니다.");
    }
    canvas._redraw = draw;
    $("c-span").addEventListener("input", function (e) {
      span = +e.target.value;
      $("c-span-val").textContent = span >= 10000 ? (span / 10000).toFixed(1) + "억 년" : span.toLocaleString() + "만 년";
      draw();
    });
    $("c-area").addEventListener("input", function (e) { area = +e.target.value; $("c-area-val").textContent = area + "곳"; draw(); });
    draw(); mission4();

    window.sthSort({
      mount: "c-sort",
      buckets: [
        { id: "p", label: "고생대", sub: "5.39억 ~ 2.52억 년 전" },
        { id: "m", label: "중생대", sub: "2.52억 ~ 0.66억 년 전" },
        { id: "c", label: "신생대", sub: "0.66억 년 전 ~ 현재" }
      ],
      items: [
        { t: "삼엽충 — 바다 밑을 기어 다닌 마디 달린 동물", a: "p", why: "고생대를 대표하며, 페름기 말 대멸종과 함께 사라졌습니다." },
        { t: "방추충(푸줄리나) — 따뜻하고 얕은 바다의 석회질 껍데기", a: "p", why: "고생대 후기의 따뜻한 얕은 바다를 알려 줍니다.", hint: "삼엽충과 같은 시대에 끝난 생물입니다." },
        { t: "갑주어 — 머리에 단단한 갑옷을 두른 초기 물고기", a: "p", why: "고생대 데본기 무렵 바다를 누볐습니다." },
        { t: "암모나이트 — 나선 껍데기를 두른 바다 연체동물", a: "m", why: "중생대 바다에 널리 퍼져 있다가 백악기 말에 사라졌습니다." },
        { t: "공룡 발자국 — 판게아가 갈라지던 시기의 육지", a: "m", why: "공룡은 중생대 육지에서만 살았습니다." },
        { t: "시조새 — 깃털과 이빨을 함께 가진 생물", a: "m", why: "중생대 쥐라기 후기의 화석으로, 파충류와 새를 잇는 특징을 함께 가집니다." },
        { t: "화폐석 — 동전처럼 생긴 따뜻한 바다의 큰 단세포 생물", a: "c", why: "신생대 전기의 따뜻하고 얕은 바다를 알려 줍니다.", hint: "포유류가 번성하던 시대입니다." },
        { t: "매머드 — 두꺼운 털을 두른 빙하기의 큰 짐승", a: "c", why: "신생대 후기의 추운 기후를 알려 줍니다." }
      ],
      onDone: function () { G4.d = true; window.sthState("cIdx", G4); mission4(); }
    });
    mission4();
  })();

  function finish() { window.sthState("r3", "해결 · 익룡·어룡·수장룡은 공룡이 아니다, 가장 큰 멸종은 페름기 말"); }
  function vsC() {
    var p = window.sthState("c-p") || "";
    $("c-vs").innerHTML = "<b>나의 첫 판단</b> " + (p || "기록 없음") + "<br>" +
      (p.indexOf("㉡") === 0 ? "정확했습니다. 익룡은 같은 시대를 살았을 뿐, 공룡상목에 속하지 않습니다."
        : "㉡ 이 정답이었습니다. ‘중생대의 큰 파충류’와 ‘공룡’은 같은 말이 아닙니다. 익룡·어룡·수장룡은 공룡이 아닙니다.");
  }
  vsC();
  ep.onShow(vsC);
  window.sthWork({
    mount: "wkC", unitLabel: "[지구과학 Ⅱ-1] 이야기 ③ 다섯 번의 대멸종과 화석 달력",
    items: [
      { id: "w3", label: "표준 화석의 조건", hint: "어떤 화석이 표준 화석이 되려면 무엇을 갖추어야 하는지, 이 단원에서 본 화석 하나를 예로 들어 쓰세요." },
      { id: "c2", label: "전시 기획자에게 보내는 쪽지", hint: "공룡관 안내판에서 고쳐야 할 것 한 가지와, 그렇게 고쳐야 하는 까닭을 쓰세요." }
    ]
  });
})();

/* ========================================================================= 04 정리하기 */
window.sthWork({
  mount: "wk", unitLabel: "[지구과학 Ⅱ-1] 지구의 역사 — 정리",
  recap: [
    { key: "r1", label: "① 절벽에 적힌 순서" },
    { key: "r2", label: "② 반으로, 또 반으로" },
    { key: "r3", label: "③ 다섯 번의 대멸종과 화석 달력" },
    { key: "rQuiz", label: "수준별 문제" },
    { key: "rLab", label: "응용 실험실" },
    { key: "rInq", label: "교과서 실험" },
    { key: "rReal", label: "실제 자료" }
  ],
  items: [
    { id: "all", label: "세 사건을 꿰는 한 문장", hint: "지층은 순서를 말해 주고(상대연령), 방사성 동위원소는 햇수를 말해 주며(절대연령), 화석은 시대를 말해 줍니다. 세 이야기에서 ‘무엇이 먼저인가’와 ‘몇 년 전인가’가 어떻게 이어졌는지 한 문장으로 쓰세요." },
    { id: "w4", label: "아직 헷갈리는 것", hint: "다음 시간에 여기서부터 시작합니다." }
  ]
});

/* ========================================================================= 05 우리 반 */
window.sthShare({
  mount: "share", unit: "eshs-2-1", unitLabel: "[지구과학 Ⅱ-1] 지구의 역사",
  rows: [
    { key: "r1", label: "① 절벽에 적힌 순서" },
    { key: "r2", label: "② 반으로, 또 반으로" },
    { key: "r3", label: "③ 다섯 번의 대멸종과 화석 달력" },
    { key: "rQuiz", label: "수준별 문제" },
    { key: "rLab", label: "응용 실험실" },
    { key: "rInq", label: "교과서 실험" },
    { key: "rReal", label: "실제 자료" }
  ],
  line: { id: "all", label: "세 사건을 꿰는 한 문장" }
});

})();
