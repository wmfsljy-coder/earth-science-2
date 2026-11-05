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
   스튜디오 + 블록 모형 공용 — 지구의 역사 '빠진 시간 — 부정합'(본보기)·주상절리 장면과 같은 말투
   밝은 스튜디오 바탕 · 땅을 잘라 낸 블록 · 입체 암석 표본 · 굵은 테두리 큰 글자 · 흰 판정 카드
   ========================================================================= */
var LT = K.LT;
var RK = {
  sand: ["#e2c48c", "#bf9a5e", "sand"], shale: ["#6c6f7a", "#4d505a", "shale"], lime: ["#e2dccb", "#bdb49a", "lime"],
  silt: ["#a8714f", "#80533a", "silt"], mud: ["#9a949c", "#77717c", "shale"], soil: ["#8a6a44", "#6a4f30", "silt"],
  basalt: ["#5d6470", "#3c424c", "silt"], tuff: ["#e8e0e8", "#c4b8cc", "silt"], granite: ["#e0abaa", "#b0767a", "granite"],
  crust: ["#a08a72", "#7a6552", "silt"], mantle: ["#b07a4e", "#8a5636", "silt"]
};
function texture(ctx, kn, x0, z0, w, h, seed) {
  var R = rnd(seed || 3), i;
  if (kn === "shale") {
    ctx.strokeStyle = "rgba(20,22,30,.35)"; ctx.lineWidth = .8;
    for (i = 3; i < h; i += 4) { ctx.beginPath(); ctx.moveTo(x0, z0 + i); ctx.lineTo(x0 + w, z0 + i); ctx.stroke(); }
  } else if (kn === "lime") {
    ctx.strokeStyle = "rgba(90,80,60,.35)"; ctx.lineWidth = .9;
    for (i = 0; i < w; i += 26 + R() * 14) { ctx.beginPath(); ctx.moveTo(x0 + i, z0); ctx.lineTo(x0 + i + 3, z0 + h); ctx.stroke(); }
  } else if (kn === "granite") {
    for (i = 0; i < w * h / 14; i++) { var r = R(); ctx.fillStyle = r > .62 ? "rgba(30,25,30,.75)" : (r > .3 ? "rgba(255,255,255,.6)" : "rgba(200,120,110,.6)"); ctx.fillRect(x0 + R() * w, z0 + R() * h, 1.6 + R() * 2.2, 1.6 + R() * 2.2); }
  } else {
    for (i = 0; i < w * h / (kn === "silt" ? 40 : 55); i++) { ctx.fillStyle = R() > .5 ? "rgba(255,255,255,.22)" : "rgba(60,40,20,.28)"; ctx.fillRect(x0 + R() * w, z0 + R() * h, 1.4, 1.4); }
  }
}
/* 수평 층 한 장(면 좌표 u 가로, z 위) */
function layer(ctx, kind, u0, z0, w, h, seed) {
  var rk = RK[kind] || RK.sand;
  var g = ctx.createLinearGradient(0, z0, 0, z0 + h); g.addColorStop(0, rk[1]); g.addColorStop(1, rk[0]);
  ctx.fillStyle = g; ctx.fillRect(u0, z0, w, h);
  ctx.save(); ctx.beginPath(); ctx.rect(u0, z0, w, h); ctx.clip(); texture(ctx, rk[2], u0, z0, w, h, seed); ctx.restore();
  ctx.strokeStyle = "rgba(40,30,20,.35)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(u0, z0 + h); ctx.lineTo(u0 + w, z0 + h); ctx.stroke();
}
function isoEdges(ctx, I, zT) {
  var a = I.P(I.L, I.D, 0), b = I.P(I.L, I.D, zT), c = I.P(0, I.D, 0), d = I.P(I.L, 0, 0), e = I.P(0, I.D, zT), f = I.P(I.L, 0, zT);
  ctx.strokeStyle = "rgba(255,255,255,.6)"; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(a.x, a.y); ctx.lineTo(d.x, d.y); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
  ctx.moveTo(e.x, e.y); ctx.lineTo(b.x, b.y); ctx.lineTo(f.x, f.y); ctx.stroke();
}
/* 숨은 캔버스(글자 없는 무늬 그림). 2배로 그려 둔다 */
function offCanvas(w, h) {
  var c = document.createElement("canvas"), k = 2; c.width = w * k; c.height = h * k;
  var x = c.getContext("2d"); x.scale(k, k);
  return { c: c, x: x, w: w, h: h };
}
/* 무늬 그림을 블록의 앞면·오른쪽 면(그림 위쪽 = zTop)에, 또는 윗면(z 높이)에 붙인다 */
function faceImg(ctx, I, side, img, zTop) {
  I.face(ctx, side, function (Lw) { ctx.translate(0, zTop); ctx.scale(1, -1); ctx.drawImage(img, 0, 0, Lw, zTop); });
}
function topImg(ctx, I, img, z) {
  var o = I.P(0, 0, z), C = 0.866, s = I.s;
  ctx.save(); ctx.transform(C * s, 0.5 * s, -C * s, 0.5 * s, o.x, o.y); ctx.drawImage(img, 0, 0, I.L, I.D); ctx.restore();
}
/* 광물 알갱이 무늬: 크기 r, 어두운 광물 비율 darkP, 바탕색 base */
function grains(ctx, w, h, r, darkP, base, seed, pink) {
  var bg = ctx.createLinearGradient(0, 0, w, h); bg.addColorStop(0, base[0]); bg.addColorStop(1, base[1]);
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
  var n = clamp(Math.round(w * h / (r * r * 7)), 18, 1400), rg = rnd(seed);
  for (var i = 0; i < n; i++) {
    ctx.save(); ctx.translate(rg() * w, rg() * h); ctx.rotate(rg() * Math.PI);
    var c = rg(), col;
    if (c < darkP) col = rg() > .5 ? ["#2b2a2e", "#0e0d10"] : ["#3c4a35", "#18201a"];
    else if (c < darkP + (1 - darkP) * .55) col = ["#f2ede6", "#b9b2a8"];
    else col = pink && rg() > .5 ? ["#f3c9b6", "#c88f7a"] : ["#d9dde3", "#8f969f"];
    if (r < 3) { ctx.fillStyle = col[0]; ctx.globalAlpha = .8; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill(); }
    else {
      var gg = ctx.createLinearGradient(-r, -r * .6, r, r * .6); gg.addColorStop(0, col[0]); gg.addColorStop(1, col[1]);
      ctx.fillStyle = gg; ctx.globalAlpha = .95;
      ctx.beginPath(); ctx.moveTo(-r * .9, -r * .2); ctx.lineTo(-r * .5, -r * .55); ctx.lineTo(r * .9, -r * .45); ctx.lineTo(r * .9, r * .25); ctx.lineTo(r * .45, r * .55); ctx.lineTo(-r * .9, r * .45); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}
/* 입체 암석 표본: 윗면·앞면·오른쪽 면에 같은 무늬 — 바닥 그림자와 면 음영 */
function specimen(ctx, I, img, Z) {
  var a = I.P(I.L, I.D, 0), b = I.P(0, I.D, 0), c = I.P(I.L, 0, 0);
  ctx.fillStyle = "rgba(20,30,50,.22)"; ctx.beginPath(); ctx.ellipse((b.x + c.x) / 2 + 10, a.y - 6, (c.x - b.x) * .62, 22, 0, 0, 6.2832); ctx.fill();
  faceImg(ctx, I, "front", img, Z); faceImg(ctx, I, "right", img, Z);
  I.shade(ctx, "right", function () { return Z; }); I.shade(ctx, "front", function () { return Z; });
  topImg(ctx, I, img, Z);
  var t1 = I.P(0, 0, Z), t2 = I.P(I.L, 0, Z), t3 = I.P(I.L, I.D, Z), t4 = I.P(0, I.D, Z);
  var sh = ctx.createLinearGradient(t1.x, t1.y, t3.x, t3.y); sh.addColorStop(0, "rgba(255,255,255,.22)"); sh.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = sh; ctx.beginPath(); ctx.moveTo(t1.x, t1.y); ctx.lineTo(t2.x, t2.y); ctx.lineTo(t3.x, t3.y); ctx.lineTo(t4.x, t4.y); ctx.closePath(); ctx.fill();
  isoEdges(ctx, I, Z);
}
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
function judgeCard(ctx, x, W, H, title) { K.card(ctx, x, 0, W - x, H, title || "판정"); }

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
      var melted = T >= sol, LW = 610, box = [0, LW];
      K.studio(ctx, 0, 0, LW, H);
      K.bigText(ctx, melted ? "부분 용융 — 마그마가 생겼다" : "아직 고체입니다", 18, 52, 26, melted ? "#ffb36b" : "#ffffff");
      K.bigText(ctx, "깊이 " + depth + " km · " + T + " °C" + (water ? " · 물 공급" : ""), 18, 86, 18, "#ffd35a");
      /* 온도–깊이 그림(밝은 카드 그래프, 깊이는 아래로) */
      var g = K.chart(ctx, { x: 118, y: 120, w: 484, h: 340, x0: 0, x1: 1600, y0: 200, y1: 0, xt: 4, yt: 4, pl: 46,
        xl: "온도 (°C) →", yl: "깊이 (km) ↓", light: true });
      function GX(t) { return g.X(clamp(t, 0, 1600)); }
      function GY(d) { return g.Y(clamp(d, 0, 200)); }
      function curve2(f, color, lw, dash) {
        var pts = [];
        for (var d = 0; d <= 200; d += 2) { var t = f(d); if (t > 1600) break; pts.push([t, d]); }
        K.plot(ctx, g, pts, color, { light: true, w: lw, dash: dash, glow: !dash });
      }
      /* 녹는 영역 */
      ctx.fillStyle = "rgba(232,89,12,.14)"; ctx.beginPath(); ctx.moveTo(g.R, g.T); ctx.lineTo(g.R, g.B);
      for (var dd = 200; dd >= 0; dd -= 2) ctx.lineTo(GX(water ? wetS(dd) : dryS(dd)), GY(dd));
      ctx.closePath(); ctx.fill();
      curve2(geo, "#5c7086", 2, [6, 4]);
      curve2(dryS, LT.red, 3);
      if (water) curve2(wetS, LT.blue, 3); else curve2(wetS, "rgba(28,126,214,.5)", 1.5, [4, 5]);
      K.pill(ctx, "지온 곡선(평소 땅속 온도)", GX(geo(150)) - 12, GY(150) + 4, { s: 11, a: "right", c: KC.ink, box: [g.L, g.R] });
      K.pill(ctx, "건조한 암석의 용융 곡선", GX(dryS(40)) + 12, GY(40) + 4, { s: 11, c: "#ffb4b4", box: [g.L, g.R] });
      K.pill(ctx, "물이 공급되었을 때", GX(wetS(60)) - 12, GY(60) + 4, { s: 11, a: "right", c: water ? "#a8d8ff" : KC.ink, box: [g.L, g.R] });
      K.t(ctx, "← 고체", g.L + 8, g.T + 18, { s: 11.5, w: "900", c: LT.mute });
      K.t(ctx, "녹는 영역 →", g.R - 8, g.T + 18, { s: 11.5, w: "900", a: "right", c: "#c2410c" });
      /* 지금 이 물질 */
      var px = GX(T), py = GY(depth);
      ctx.save(); ctx.strokeStyle = "rgba(18,32,58,.45)"; ctx.setLineDash([3, 3]); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(78, py); ctx.lineTo(px, py); ctx.stroke(); ctx.restore();
      if (melted) { var pulse = 1 + .18 * Math.sin(wt / 5); K.glow(ctx, px, py, 7 * pulse, "rgba(255,150,60,.95)", 3.2); K.planet(ctx, px, py, 8, "#ffb347", "#c2410c"); }
      else { ctx.fillStyle = "#ffffff"; ctx.strokeStyle = "#0c8599"; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.arc(px, py, 8, 0, 6.2832); ctx.fill(); ctx.stroke(); }
      K.pill(ctx, melted ? "녹는 중" : "고체", clamp(px, g.L + 30, g.R - 30), py - 16, { s: 11.5, a: "center", c: melted ? "#ffc39a" : "#9ff0d0", box: [g.L, g.R] });
      /* 왼쪽 땅속 기둥(지각 0~35 km · 맨틀) — 높이가 그래프의 깊이와 맞춰져 있다 */
      var IC = K.iso({ ox: 66, oy: g.B - 36, s: 1, L: 36, D: 36 }), ZC = g.B - g.T, zm = ZC * (1 - 35 / 200);
      IC.box(ctx, 0, 0, 0, 36, 36, zm, "#c99a6c", "#b07a4e", "#8a5636");
      IC.box(ctx, 0, 0, zm, 36, 36, ZC, "#b9a586", "#a08a72", "#7a6552");
      IC.face(ctx, "front", function () { texture(ctx, "silt", 0, 0, 36, ZC, 9); ctx.strokeStyle = "rgba(255,255,255,.55)"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(0, zm); ctx.lineTo(36, zm); ctx.stroke(); });
      var cz = ZC * (1 - depth / 200), cp = IC.P(36, 36, cz);
      ctx.fillStyle = melted ? "#ff8a2a" : "#0c8599"; ctx.beginPath(); ctx.arc(cp.x, cp.y, 4.5, 0, 6.2832); ctx.fill();
      var c1 = IC.P(0, 36, (ZC + zm) / 2), c2 = IC.P(0, 36, zm / 2);
      K.t(ctx, "지각", c1.x + 18, c1.y + 4, { s: 10.5, w: "900", a: "center", c: "#3a2a1a" });
      K.t(ctx, "맨틀", c2.x + 18, c2.y + 4, { s: 10.5, w: "900", a: "center", c: "#fff2e2" });
      if (water) {
        var Rw = rnd(77);
        for (var wd = 0; wd < 7; wd++) { var wz = cz - 40 + ((wt * 1.5 + wd * 12) % 84); if (wz > 4 && wz < ZC - 4) { var wp = IC.P(36, 8 + Rw() * 26, wz); K.glow(ctx, wp.x, wp.y, 2, "rgba(28,126,214,.95)", 3); } }
        var wb = IC.P(36, 36, 0); K.pill(ctx, "물", wb.x, wb.y + 24, { s: 11, a: "center", c: "#a8d8ff", box: box });
      }
      K.warn(ctx, LW - 14, 30, "⚠ 곡선은 단순화한 모형", "right");

      /* ── 오른쪽 판정 카드 ── */
      var RX = LW + 10, cx0 = RX + 18, x1 = W - 18, bw = x1 - cx0;
      judgeCard(ctx, RX, W, H, "판정");
      K.t(ctx, melted ? "마그마 생성" : "고체 그대로", cx0, 64, { s: 22, w: "900", c: melted ? "#c2410c" : LT.ink });
      K.row(ctx, "이 깊이의 녹는 온도", sol.toFixed(0) + " °C", cx0, x1, 104, water ? LT.blue : LT.red);
      K.row(ctx, "지금 이 물질의 온도", T + " °C", cx0, x1, 132);
      K.row(ctx, "차이", (melted ? "+" : "") + (T - sol).toFixed(0) + " °C", cx0, x1, 160, melted ? "#c2410c" : LT.mute);
      K.tip(ctx, water ? "물이 녹는 온도를 " + (dryS(depth) - wetS(depth)).toFixed(0) + " °C 낮췄다" : "물이 없으면 깊을수록 녹는 온도도 오른다", cx0 - 6, 180, bw + 12, water ? true : null);
      K.t(ctx, "마그마가 생기는 세 가지 방법", cx0, 252, { s: 12, w: "900", c: LT.mute });
      [["온도 상승 (깊은 곳에 열이 더해짐)", got.a], ["압력 감소 (얕아지며 녹음)", got.b], ["물 공급 (녹는점이 낮아짐)", got.c]].forEach(function (m, i) {
        var y = 284 + i * 32;
        ctx.fillStyle = m[1] ? "#e7f7f0" : "#eef1f5"; ctx.beginPath(); ctx.roundRect(cx0 - 6, y - 20, bw + 12, 28, 8); ctx.fill();
        K.t(ctx, m[0], cx0 + 4, y, { s: 11.5, w: "800", c: m[1] ? "#0f766e" : LT.mute });
        K.t(ctx, m[1] ? "✓" : "·", x1 - 4, y, { s: 13, w: "900", a: "right", c: m[1] ? LT.green : LT.dim });
      });
      K.t(ctx, "평소 땅속 암석은 녹지 않습니다.", cx0, 414, { s: 11.5, w: "700", c: LT.mute });
      K.t(ctx, "점선(지온)이 빨간 선 왼쪽에 있으니까요.", cx0, 434, { s: 11.5, w: "700", c: LT.mute });
      K.t(ctx, "깊이·온도·물로 균형을 깨 보세요", cx0, 470, { s: 11, w: "800", c: "#1179a6" });


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
      var KCOL = [LT.orange, LT.teal, LT.violet], LW = 560, box = [0, LW];
      K.studio(ctx, 0, 0, LW, H);
      K.bigText(ctx, rock, 18, 54, 34, "#ffd35a");
      K.bigText(ctx, TYPE[ti].name + " · " + (km === 0 ? "지표(용암)" : km.toFixed(1) + " km에서 굳음"), 18, 88, 17, "#ffffff");
      /* 입체 암석 표본 — 윗면·앞면·옆면에 같은 조직 */
      var TX = offCanvas(300, 200), r = clamp(1.1 + D * 2.0, 1.1, 30);
      var base = [["#3a3533", "#1c1918"], ["#6b6560", "#3f3a36"], ["#b9aea6", "#8a7f78"]][ti];
      grains(TX.x, 300, 200, r, [0.55, 0.35, 0.12][ti], base, Math.round(sio2 * 1000 + km * 10), ti === 2);
      var IS = K.iso({ ox: 236, oy: 222, s: 1, L: 220, D: 150 });
      specimen(ctx, IS, TX.c, 104);
      K.pill(ctx, "🔍 표본 가로 약 30 mm", 26, 140, { s: 11.5, c: KC.ink, box: box });
      K.pill(ctx, coarse ? "조립질 — 알갱이가 눈에 보입니다" : "세립질 — 알갱이가 보이지 않습니다", 26, H - 24, { s: 12.5, c: coarse ? "#7dffa8" : "#ffc39a", box: box });
      /* 땅속 기둥(0 ~ 20 km): 마그마가 굳은 깊이 */
      var IC = K.iso({ ox: 492, oy: 378, s: 1, L: 36, D: 36 }), ZC = 240, zk = ZC - km / 20 * ZC;
      IC.box(ctx, 0, 0, 0, 36, 36, ZC, "#8cbf62", "#b99f80", "#8f7a60");
      IC.face(ctx, "front", function () { ctx.strokeStyle = "rgba(60,40,20,.25)"; ctx.lineWidth = 1; for (var lz = 20; lz < ZC; lz += 20) { ctx.beginPath(); ctx.moveTo(0, lz); ctx.lineTo(36, lz); ctx.stroke(); } });
      var mp = IC.P(18, 36, zk);
      K.glow(ctx, mp.x, mp.y, 6, "rgba(255,150,60,.95)", 2.6); K.planet(ctx, mp.x, mp.y, 6, "#ffb347", "#c2410c");
      K.pill(ctx, km === 0 ? "지표" : km.toFixed(1) + " km", mp.x - 22, mp.y + 5, { s: 11, a: "right", c: "#ffd0a0", box: box });
      var e0 = IC.P(36, 36, ZC), e1 = IC.P(36, 36, 0);
      K.t(ctx, "0 km", e0.x + 36, e0.y - 10, { s: 10, w: "800", c: LT.mute }); K.t(ctx, "20 km", e1.x + 36, e1.y - 20, { s: 10, w: "800", c: LT.mute });

      /* ── 오른쪽 카드: 화성암 이름표 ── */
      var RX = LW + 10, px = RX + 18, x1 = W - 18, bw = x1 - px;
      judgeCard(ctx, RX, W, H, "화성암 이름표");
      K.row(ctx, "마그마의 종류", TYPE[ti].name, px, x1, 58, KCOL[ti]);
      K.row(ctx, "다 굳는 데 걸린 시간", fmtYears(t), px, x1, 86);
      K.row(ctx, "결정의 크기", fmtMm(D), px, x1, 114, coarse ? LT.green : LT.orange);
      /* SiO₂ 띠 */
      var sy = 150, sg = ctx.createLinearGradient(px, 0, x1, 0); sg.addColorStop(0, "#3a3533"); sg.addColorStop(.5, "#8a847e"); sg.addColorStop(1, "#e6dcd4");
      ctx.fillStyle = sg; ctx.beginPath(); ctx.roundRect(px, sy, bw, 12, 6); ctx.fill();
      [52, 63].forEach(function (b) { var xb = px + (b - 45) / 30 * bw; ctx.strokeStyle = "#12203a"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(xb, sy - 4); ctx.lineTo(xb, sy + 16); ctx.stroke(); K.t(ctx, b + "", xb, sy + 30, { s: 10, a: "center", w: "800", c: LT.mute }); });
      var mx = px + (sio2 - 45) / 30 * bw;
      ctx.fillStyle = "#ffffff"; ctx.strokeStyle = "#e8590c"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(mx, sy + 6, 7, 0, 6.2832); ctx.fill(); ctx.stroke();
      K.t(ctx, "SiO₂ 45 %", px, sy + 30, { s: 10, w: "700", c: LT.mute }); K.t(ctx, "75 %", x1, sy + 30, { s: 10, w: "700", a: "right", c: LT.mute });
      K.t(ctx, "SiO₂ " + sio2 + " %", clamp(mx, px + 30, x1 - 30), sy - 10, { s: 11, w: "900", a: "center", c: "#c2410c" });
      /* 분류표: 가로 = 조성, 세로 = 식은 깊이 */
      var c0 = px + 52, cw = (x1 - c0) / 3, ry = [228, 270];
      K.t(ctx, "현무암질", c0 + cw * .5, 216, { s: 10.5, w: "900", a: "center", c: ti === 0 ? KCOL[0] : LT.mute });
      K.t(ctx, "안산암질", c0 + cw * 1.5, 216, { s: 10.5, w: "900", a: "center", c: ti === 1 ? KCOL[1] : LT.mute });
      K.t(ctx, "유문암질", c0 + cw * 2.5, 216, { s: 10.5, w: "900", a: "center", c: ti === 2 ? KCOL[2] : LT.mute });
      for (var ci = 0; ci < 3; ci++) for (var ri = 0; ri < 2; ri++) {
        var on = ci === ti && ri === (coarse ? 1 : 0);
        ctx.fillStyle = on ? K.tint(["#e8590c", "#0c8599", "#7048e8"][ci], 1.0) : "#e9eef5"; ctx.beginPath(); ctx.roundRect(c0 + cw * ci + 3, ry[ri], cw - 6, 34, 8); ctx.fill();
        K.t(ctx, ri === 0 ? TYPE[ci].fast : TYPE[ci].slow, c0 + cw * ci + cw / 2, ry[ri] + 22, { s: 12.5, w: "900", a: "center", c: on ? "#ffffff" : LT.ink });
      }
      K.t(ctx, "세립질", px, ry[0] + 15, { s: 11, w: "900", c: LT.orange }); K.t(ctx, "화산암", px, ry[0] + 29, { s: 10, w: "700", c: LT.mute });
      K.t(ctx, "조립질", px, ry[1] + 15, { s: 11, w: "900", c: LT.green }); K.t(ctx, "심성암", px, ry[1] + 29, { s: 10, w: "700", c: LT.mute });
      K.tip(ctx, coarse ? "천천히 식어 결정이 크게 자랐다" : (km > 0 ? "지하인데도 빨리 식었다(얕은 관입)" : "지표에서 곧바로 식었다"), px - 6, 324, bw + 12, null);
      K.t(ctx, "성분이 같고 조직만 다른 짝:", px, 386, { s: 11.5, w: "800", c: LT.mute });
      K.t(ctx, "현무암–반려암 · 유문암–화강암", px, 406, { s: 11.5, w: "900", c: "#1179a6" });
      K.t(ctx, "가로 = 조성(SiO₂) · 세로 = 굳은 깊이", px, 446, { s: 11, w: "700", c: LT.mute });

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

    /* 화산 단면 블록: 화구가 앞면에 오도록 잘라, 앞면에 마그마 굄과 화도가 보인다. 분출 양식마다 화산 모양이 다르다 */
    var LW = 560, IV = K.iso({ ox: 222, oy: 212, s: 0.8, L: 340, D: 160 }), GZ = 70, VX = 170;
    var SHAPE = [{ h: 30, r: 168, p: 1.5 }, { h: 64, r: 104, p: 1 }, { h: 118, r: 112, p: 1.55 }];
    function zOf(x, y, st) {
      var sh = SHAPE[st], d = Math.sqrt((x - VX) * (x - VX) + (y - IV.D) * (y - IV.D)), f = Math.max(0, 1 - d / sh.r);
      var z = GZ + sh.h * Math.pow(f, sh.p);
      if (d < 9 && st !== 1) z -= (9 - d) * .9;            /* 화구 */
      return z;
    }
    var CACHE = { st: -1, img: null };
    function buildBlock(st) {
      var o = offCanvas(LW, H), c = o.x, I = IV;
      K.studio(c, 0, 0, LW, H, { x: I.P(I.L, I.D, 0).x - 90, y: I.P(I.L, I.D, 0).y - 30, rx: 250, ry: 40 });
      c.save(); c.beginPath(); c.roundRect(0, 0, LW, H, 14); c.clip();
      ["front", "right"].forEach(function (side) {
        I.face(c, side, function (Lw) {
          var zf = function (u) { return side === "front" ? zOf(u, I.D, st) : zOf(I.L, u, st); };
          layer(c, "shale", 0, 0, Lw, 24, 11); layer(c, "sand", 0, 24, Lw, 24, 12); layer(c, "silt", 0, 48, Lw, GZ - 48, 13);
          if (side === "front") {
            /* 화산체(쌓인 용암·화산재 층) */
            c.save(); I.profile(c, "front", zf, GZ); c.clip();
            var vg = c.createLinearGradient(0, GZ, 0, GZ + 120); vg.addColorStop(0, st === 0 ? "#4b4f57" : "#6d6058"); vg.addColorStop(1, st === 0 ? "#2f3238" : "#3e342e");
            c.fillStyle = vg; c.fillRect(0, GZ, Lw, 140);
            c.strokeStyle = "rgba(255,255,255,.12)"; c.lineWidth = 1.2;
            for (var lz = GZ + 8; lz < GZ + 130; lz += st === 2 ? 9 : 7) { c.beginPath(); for (var u = 0; u <= Lw; u += 6) { var zz = Math.min(zf(u) - 2, lz + (zf(u) - GZ) * .25); if (u) c.lineTo(u, zz); else c.moveTo(u, zz); } c.stroke(); }
            c.restore();
            /* 마그마 굄과 화도 */
            var mg = c.createRadialGradient(VX, 24, 4, VX, 24, 80); mg.addColorStop(0, "#ffe08a"); mg.addColorStop(.4, "#ff8a2a"); mg.addColorStop(1, "rgba(200,60,20,.85)");
            c.fillStyle = mg; c.beginPath(); c.ellipse(VX, 24, 72, 15, 0, 0, 6.2832); c.fill();
            var cg = c.createLinearGradient(0, 30, 0, GZ + SHAPE[st].h); cg.addColorStop(0, "#ff6a1f"); cg.addColorStop(1, "#ffd36b");
            c.fillStyle = cg; c.beginPath(); c.moveTo(VX - 9, 34); c.lineTo(VX - 5, zf(VX) + 2); c.lineTo(VX + 5, zf(VX) + 2); c.lineTo(VX + 9, 34); c.closePath(); c.fill();
          }
        });
        I.shade(c, side, function (u) { return side === "front" ? zOf(u, I.D, st) : zOf(I.L, u, st); });
      });
      /* 윗면 지형: 풀밭과 화산 */
      I.field(c, function (x, y) { return zOf(x, y, st); }, function (x, y, z, lt) {
        var h = (z - GZ) / Math.max(1, SHAPE[st].h);
        var base = h > .04 ? (st === 0 ? "#5a5e66" : (st === 1 ? "#7a6a5c" : "#857668")) : "#8cbf62";
        return K.tint(base, lt);
      }, 34, 16);
      [[310, 22], [326, 128], [22, 118], [296, 150]].forEach(function (t, k) { var dd = Math.sqrt((t[0] - VX) * (t[0] - VX) + (t[1] - I.D) * (t[1] - I.D)); if (zOf(t[0], t[1], st) < GZ + 1 && dd > SHAPE[st].r + 16) I.tree(c, t[0], t[1], GZ, .9 + (k % 3) * .12); });
      if (st === 1) {                                      /* 용암돔 */
        var dp = I.P(VX, I.D - 4, zOf(VX, I.D, st));
        var dg = c.createRadialGradient(dp.x - 6, dp.y - 10, 2, dp.x, dp.y, 26); dg.addColorStop(0, "#ffb347"); dg.addColorStop(.5, "#8a3a1a"); dg.addColorStop(1, "#4a2a1a");
        c.fillStyle = dg; c.beginPath(); c.ellipse(dp.x, dp.y, 24, 16, 0, Math.PI, 0); c.fill();
      }
      var a = I.P(I.L, I.D, 0), b = I.P(I.L, I.D, GZ), cc = I.P(0, I.D, 0), d = I.P(I.L, 0, 0);
      c.strokeStyle = "rgba(255,255,255,.6)"; c.lineWidth = 1.2;
      c.beginPath(); c.moveTo(cc.x, cc.y); c.lineTo(a.x, a.y); c.lineTo(d.x, d.y); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
      c.restore();
      CACHE = { st: st, img: o.c };
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      var le = logEta(), E = boom(), st = style(), I = IV, box = [0, LW];
      var SCc = [LT.green, LT.yellow, LT.red];
      if (CACHE.st !== st) buildBlock(st);
      ctx.drawImage(CACHE.img, 0, 0, LW, H);
      var u = (tick % 90) / 90, vz = zOf(VX, I.D, st), vent = I.P(VX, I.D, vz);
      /* 화도 속 가스 거품: 묽으면 빠져나가고, 끈적하면 갇혀 커진다 */
      var nb = Math.round(3 + Hg * 2), Rb = rnd(5);
      I.face(ctx, "front", function () {
        for (var b = 0; b < nb; b++) {
          var ph = (u + b / nb) % 1, bz = 36 + ph * (vz - 40), br = st === 0 ? 1.8 : (st === 1 ? 2.3 : 1.8 + ph * 3.2);
          ctx.fillStyle = "rgba(255,255,255,.85)"; ctx.beginPath(); ctx.arc(VX - 3 + Rb() * 6, bz, br, 0, 6.2832); ctx.fill();
        }
      });
      function surf(th, r) { var x = VX + Math.cos(th) * r, y = I.D + Math.sin(th) * r; return I.P(x, y, zOf(x, y, st) + 1); }
      if (st === 0) {
        [-2.8, -1.95, -1.15, -.35].forEach(function (th, k) {
          ctx.save(); ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.shadowColor = "#ff7a1f"; ctx.shadowBlur = 10;
          var Lr = SHAPE[0].r * (.8 + .25 * ((k * 37) % 10) / 10 + .06 * u);
          ctx.strokeStyle = "#ff7a1f"; ctx.lineWidth = 5; ctx.beginPath();
          for (var r = 6; r <= Lr; r += 6) { var p = surf(th + Math.sin(r / 30 + k) * .08, r); if (r > 6) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y); }
          ctx.stroke(); ctx.restore();
          var q = surf(th, 6 + ((u + k / 4) % 1) * (Lr - 6)); K.glow(ctx, q.x, q.y, 2.4, "rgba(255,230,150,.95)", 3);
        });
      } else {
        var hgt = st === 1 ? 70 : 210, wid = st === 1 ? 30 : 80;
        for (var i = 0; i < 12; i++) {
          var f = ((i + u * 2) / 12) % 1, ax = vent.x + Math.sin(i * 2.1) * wid * f, ay = vent.y - 8 - f * hgt, ar = 9 + f * wid * 0.55;
          var ag = ctx.createRadialGradient(ax - ar * .3, ay - ar * .3, 1, ax, ay, ar);
          ag.addColorStop(0, "rgba(150,140,135,.85)"); ag.addColorStop(1, "rgba(120,110,105,0)");
          ctx.fillStyle = ag; ctx.beginPath(); ctx.arc(ax, ay, ar, 0, 6.2832); ctx.fill();
        }
        if (st === 2) {                                    /* 화쇄류: 뜨거운 화산재가 비탈을 타고 내려온다 */
          [-2.6, -.55].forEach(function (th) {
            for (var k = 0; k < 5; k++) {
              var qq = (u * 1.4 + k / 5) % 1, p = surf(th, 8 + qq * SHAPE[2].r * .95), rr = 12 + qq * 10;
              var pg = ctx.createRadialGradient(p.x, p.y - 4, 1, p.x, p.y - 4, rr); pg.addColorStop(0, "rgba(255,150,80,.75)"); pg.addColorStop(1, "rgba(130,100,90,0)");
              ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(p.x, p.y - 4, rr, 0, 6.2832); ctx.fill();
            }
          });
          for (var bb = 0; bb < 5; bb++) { var bq = (u + bb / 5) % 1; K.glow(ctx, vent.x + (bb - 2) * 26 * bq, vent.y - 20 - bq * 120 + bq * bq * 90, 2, "rgba(255,170,80,.95)", 3); }
        }
      }
      /* 이름표 */
      I.label(ctx, VX + 60, I.D, 24, "마그마 굄", 40, 36, "#ffd0a0", box);
      I.label(ctx, VX + 4, I.D, (36 + vz) / 2, "화도 · 가스 거품", 70, 10, KC.ink, box);
      if (st === 2) { var pf = surf(-2.6, SHAPE[2].r * .8); K.pill(ctx, "화쇄류", pf.x - 18, pf.y - 6, { s: 11.5, a: "right", c: "#ffb4a0", box: box }); }
      if (st === 1) K.pill(ctx, "용암돔", vent.x + 30, vent.y - 8, { s: 11.5, c: KC.yellow, box: box });
      K.pill(ctx, st === 0 ? "용암이 멀리까지 흘러 넓게 퍼집니다" : (st === 2 ? "화산재 기둥이 높이 솟구칩니다" : "용암돔이 자라며 이따금 터집니다"), 18, H - 20, { s: 12, c: st === 0 ? "#ffc39a" : (st === 2 ? "#ffb4a0" : "#ffe08a"), box: box });
      K.bigText(ctx, ["조용히 흘러내린다", "용암돔과 작은 폭발", "폭발적 분출"][st], 18, 52, 28, ["#7dffa8", "#ffd35a", "#ff9a8a"][st]);
      K.bigText(ctx, "SiO₂ " + S + " % · " + T + " °C · 가스 " + Hg.toFixed(1) + " %", 18, 86, 17, "#ffffff");
      K.warn(ctx, LW - 14, 30, "⚠ 높이·크기는 보기 쉽게 과장", "right");

      /* ── 오른쪽 계기판 카드 ── */
      var RX = LW + 10, px = RX + 18, x1 = W - 18, bw = x1 - px;
      judgeCard(ctx, RX, W, H, "분출 양식 판정");
      K.t(ctx, SNAME[st], px, 62, { s: st === 1 ? 15 : 17, w: "900", c: SCc[st] });
      K.row(ctx, "마그마의 점성 (Pa·s)", "10^" + le.toFixed(1), px, x1, 104, le > 5 ? LT.red : LT.green);
      K.bar(ctx, px, 116, bw, le / 10, le > 5 ? LT.red : LT.green);
      K.t(ctx, "묽다", px, 144, { s: 10.5, w: "700", c: LT.dim }); K.t(ctx, "끈적하다", x1, 144, { s: 10.5, w: "700", a: "right", c: LT.dim });
      K.row(ctx, "폭발 지수", E.toFixed(2), px, x1, 184, SCc[st]);
      K.bar(ctx, px, 196, bw, E / 12, SCc[st]);
      [[4, "4"], [7, "7"]].forEach(function (m) {
        var x = px + bw * m[0] / 12;
        ctx.strokeStyle = "#12203a"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, 192); ctx.lineTo(x, 210); ctx.stroke();
        K.t(ctx, m[1], x, 226, { s: 10.5, a: "center", w: "800", c: LT.mute });
      });
      K.t(ctx, "흘러내림", px + bw * 1.6 / 12, 226, { s: 10.5, w: "800", a: "center", c: LT.green });
      K.t(ctx, "터짐", px + bw * 9.5 / 12, 226, { s: 10.5, w: "800", a: "center", c: LT.red });
      K.tip(ctx, "4 미만이면 흘러내리고, 7 이상이면 터집니다", px - 6, 246, bw + 12, null);
      K.t(ctx, "SiO₂가 많을수록, 온도가 낮을수록", px, 308, { s: 11.5, w: "700", c: LT.mute });
      K.t(ctx, "끈적해져 가스가 빠져나가지 못합니다.", px, 326, { s: 11.5, w: "700", c: LT.mute });
      K.t(ctx, "가스 거품이 화도에 갇혀 커질수록", px, 356, { s: 11.5, w: "700", c: LT.mute });
      K.t(ctx, "한꺼번에 터질 위험이 큽니다.", px, 374, { s: 11.5, w: "700", c: LT.mute });
      K.t(ctx, "제주도 현무암질 용암은 멀리 흘렀고,", px, 412, { s: 11, w: "800", c: "#1179a6" });
      K.t(ctx, "SiO₂가 많으면 화산재가 수십 km까지.", px, 430, { s: 11, w: "800", c: "#1179a6" });
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
      var LW = 560, box = [0, LW];
      var NC = J.k === "none" ? "#ffffff" : (J.k === "melt" ? "#ffb36b" : (J.k === "contact" ? "#ffd35a" : "#7dffa8"));
      K.studio(ctx, 0, 0, LW, H);
      K.bigText(ctx, J.n, 18, 52, 26, NC);
      K.bigText(ctx, "온도 " + T + " °C · 깊이 " + dep + " km", 18, 86, 18, "#ffffff");
      /* 온도–깊이 그림(밝은 카드 그래프, 깊이는 아래로) */
      var gch = K.chart(ctx, { x: 14, y: 104, w: 540, h: 330, x0: 0, x1: 1000, y0: 40, y1: 0, xt: 5, yt: 4, pl: 52,
        xl: "온도 (°C) →", yl: "깊이 (km) ↓", light: true });
      var XT = gch.X, YD = gch.Y;
      var zones = [
        [0, 200, 0, 40, "140,150,170", .16, "변성 전", "#e8ecff"],
        [200, 1000, 0, 8, "245,159,0", .26, "접촉 변성", "#ffe08a"],
        [200, 400, 8, 40, "15,159,118", .20, "점판암", "#9ff0d0"],
        [400, 600, 8, 40, "28,126,214", .20, "편암", "#a8d8ff"],
        [600, 800, 8, 40, "112,72,232", .22, "편마암", "#d0bfff"],
        [800, 1000, 8, 40, "232,89,12", .30, "부분 용융", "#ffc39a"]
      ];
      zones.forEach(function (z) {
        var x = XT(z[0]), y = YD(z[2]), w = XT(z[1]) - x, h = YD(z[3]) - y;
        ctx.fillStyle = "rgba(" + z[4] + "," + z[5] + ")"; ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = "rgba(20,40,90,.18)"; ctx.lineWidth = 1; ctx.strokeRect(x, y, w, h);
      });
      [[100, 24, 0], [600, 4, 1], [300, 24, 2], [500, 24, 3], [700, 24, 4], [900, 24, 5]].forEach(function (q) {
        K.pill(ctx, zones[q[2]][6], XT(q[0]), YD(q[1]) + 4, { s: 11, a: "center", c: zones[q[2]][7], box: [gch.L, gch.R] });
      });
      var px0 = XT(T), py0 = YD(dep);
      ctx.save(); ctx.strokeStyle = "rgba(18,32,58,.5)"; ctx.setLineDash([3, 4]); ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(gch.L, py0); ctx.lineTo(px0, py0); ctx.moveTo(px0, gch.T); ctx.lineTo(px0, py0); ctx.stroke(); ctx.restore();
      ctx.fillStyle = J.k === "melt" ? "#ff8a2a" : "#ffffff"; ctx.strokeStyle = "#12203a"; ctx.lineWidth = 2.8; ctx.beginPath(); ctx.arc(px0, py0, 8, 0, 6.2832); ctx.fill(); ctx.stroke();
      K.tip(ctx, "변성 작용은 암석이 녹기 직전까지, 고체인 채로 일어납니다", 14, 444, 540, null);

      /* ── 오른쪽 카드: 손에 든 시료(입체 표본) ── */
      var RX = LW + 10, px = RX + 18, x1 = W - 18;
      judgeCard(ctx, RX, W, H, "손에 든 시료");
      var TX = offCanvas(280, 200), g = TX.x, bw = 280, bh = 200;
      var base = proto === "lime" ? ["#e3ded6", "#b3ab9f"] : (proto === "sand" ? ["#e0cca3", "#b0966a"] : ["#6d6a70", "#3f3d43"]);
      if (J.k !== "none" && proto === "shale") base = J.f >= 3 ? ["#9a97a0", "#4a4850"] : ["#5a5a66", "#33323a"];
      var bg = g.createLinearGradient(0, 0, bw, bh); bg.addColorStop(0, base[0]); bg.addColorStop(1, base[1]);
      g.fillStyle = bg; g.fillRect(0, 0, bw, bh);
      var rg = rnd(Math.round(T + dep * 37 + proto.length * 101));
      if (J.f === 0) {
        var big = J.k !== "none";
        for (var i = 0; i < 300; i++) {
          var gx = rg() * bw, gy = rg() * bh, rr = big ? 2.4 + rg() * 3 : 1.2 + rg() * 1.4;
          var lc = proto === "lime" ? (rg() < .5 ? "#f6f3ee" : "#c9c2b8") : (proto === "sand" ? (rg() < .5 ? "#f1e2bf" : "#b89b6b") : (rg() < .5 ? "#8b8790" : "#1e1d22"));
          g.fillStyle = lc; g.globalAlpha = .85;
          if (big) { g.beginPath(); g.moveTo(gx - rr, gy); g.lineTo(gx, gy - rr * .8); g.lineTo(gx + rr, gy - rr * .2); g.lineTo(gx + rr * .6, gy + rr * .8); g.lineTo(gx - rr * .6, gy + rr * .7); g.closePath(); g.fill(); }
          else { g.beginPath(); g.arc(gx, gy, rr, 0, 6.2832); g.fill(); }
        }
        g.globalAlpha = 1;
      } else {
        var lines = J.f === 1 ? 26 : (J.f === 2 ? 16 : 9);
        for (var l = 0; l < lines; l++) {
          var yy = 6 + (l + 0.5) / lines * (bh - 12), light = l % 2 === 0;
          g.save();
          g.strokeStyle = J.f === 3 ? (light ? "#efeae2" : "#1b1a20") : (J.f === 2 ? (light ? "#d3dce6" : "#3a3f4a") : (light ? "#7b7f8a" : "#2a2b33"));
          g.lineWidth = J.f === 1 ? 1.6 : (J.f === 2 ? 3 : 7); g.globalAlpha = .92;
          if (J.f === 2 && light) { g.shadowColor = "rgba(220,235,255,.9)"; g.shadowBlur = 6; }
          g.beginPath(); g.moveTo(0, yy);
          for (var xx = 0; xx <= bw; xx += 10) g.lineTo(xx, yy + Math.sin((xx + l * 30) / 70) * (J.f === 3 ? 7 : 3));
          g.stroke(); g.restore();
        }
      }
      var IS = K.iso({ ox: 712, oy: 150, s: 1, L: 160, D: 100 }), SZ = 72;
      specimen(ctx, IS, TX.c, SZ);
      var sTop = IS.P(80, 50, SZ), sBot = IS.P(80, 100, 0);
      if (J.k === "regional" && J.f > 0) {
        K.arrow(ctx, { x: sTop.x, y: sTop.y - 56 }, { x: sTop.x, y: sTop.y - 14 }, LT.red, 4, 12);
        K.arrow(ctx, { x: sBot.x, y: sBot.y + 50 }, { x: sBot.x, y: sBot.y + 10 }, LT.red, 4, 12);
        K.pill(ctx, "누르는 힘", sTop.x + 14, sTop.y - 38, { s: 11, c: "#ffb4b4", box: [RX, W] });
      } else if (J.k === "contact") {
        for (var hh = 0; hh < 5; hh++) K.glow(ctx, sBot.x - 70 + hh * 35, sBot.y + 26, 4, "rgba(255,150,60,.9)", 3.5);
        K.pill(ctx, "마그마의 열만 받음 — 방향성 없음", (px + x1) / 2, 62, { s: 11, a: "center", c: KC.yellow, box: [RX, W] });
      } else if (J.k === "melt") {
        for (var mh = 0; mh < 6; mh++) { var mp = IS.P(20 + rg() * 120, 100, 10 + rg() * 52); K.glow(ctx, mp.x, mp.y, 3, "rgba(255,140,50,.95)", 4); }
      }
      K.pill(ctx, J.f > 0 ? "엽리 있음" : "엽리 없음", x1, 330, { s: 12, a: "right", c: J.f > 0 ? "#d0bfff" : KC.ink, box: [RX, W] });
      K.row(ctx, "온도", T + " °C", px, x1, 372, LT.orange);
      K.row(ctx, "깊이 · 압력", dep + " km · 약 " + (dep * 0.027).toFixed(2) + " GPa", px, x1, 400, LT.blue);
      K.t(ctx, "녹기 시작하면 그때부터는", px, 446, { s: 11, w: "700", c: LT.mute });
      K.t(ctx, "마그마의 세계입니다", px, 464, { s: 11, w: "700", c: LT.mute });

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
      var GC = [LT.mute, LT.green, "#d9480f", LT.red];
      var LW = 610, box = [0, LW];
      /* ── 왼쪽: 셰일 블록에 마그마가 관입한 모형(x = 마그마 쪽에서 잰 거리, 1 m = 0.16 칸 · 블록은 약 2.6 km) ── */
      var I = K.iso({ ox: 300, oy: 196, s: 0.8, L: 420, D: 200 }), ZT = 150;
      var edge = R * SC;
      function zone(u) {                                   /* 그 자리의 색: 마그마 · 변성 등급 · 셰일 */
        if (u < edge) return null;
        var gg = grade(tempAt((u - edge) / SC));
        return gg === 3 ? "rgba(224,49,49,.45)" : (gg === 2 ? "rgba(232,89,12,.38)" : (gg === 1 ? "rgba(15,159,118,.30)" : null));
      }
      K.studio(ctx, 0, 0, LW, H, { x: I.P(I.L, I.D, 0).x - 160, y: I.P(I.L, I.D, 0).y - 40, rx: 300, ry: 44 });
      ctx.save(); ctx.beginPath(); ctx.roundRect(0, 0, LW, H, 14); ctx.clip();
      function face(side) {
        I.face(ctx, side, function (Lw) {
          layer(ctx, "shale", 0, 0, Lw, ZT, 31);
          ctx.strokeStyle = "rgba(255,255,255,.12)"; ctx.lineWidth = 1;
          for (var lz = 12; lz < ZT; lz += 14) { ctx.beginPath(); ctx.moveTo(0, lz); ctx.lineTo(Lw, lz); ctx.stroke(); }
          if (side === "front") {
            for (var u = 0; u < Lw; u += 3) { var c = zone(u); if (c) { ctx.fillStyle = c; ctx.fillRect(u, 0, 3.4, ZT); } }
            var mg = ctx.createLinearGradient(0, 0, Math.max(edge, 4), 0); mg.addColorStop(0, "#ffe08a"); mg.addColorStop(.55, "#ff8a2a"); mg.addColorStop(1, "#c2410c");
            ctx.fillStyle = mg; ctx.fillRect(0, 0, Math.max(4, edge), ZT);
          } else {
            var cr = zone(I.L); if (cr) { ctx.fillStyle = cr; ctx.fillRect(0, 0, Lw, ZT); }
          }
        });
      }
      face("front"); face("right");
      I.shade(ctx, "right", function () { return ZT; }); I.shade(ctx, "front", function () { return ZT; });
      I.top(ctx, function () { return ZT; }, function (i, u) { if (u < edge) return "#ff9a3c"; var c = zone(u); return c ? (c.indexOf("224,49") > 0 ? "#d98a7c" : (c.indexOf("232,89") > 0 ? "#d6a77a" : "#9ab48c")) : "#8f8c86"; }, 112);
      isoEdges(ctx, I, ZT);
      /* 지금 보고 있는 자리: 시추 막대 */
      var mu = edge + dist * SC;
      if (mu <= I.L) {
        var p1 = I.P(mu, I.D, ZT + 26), p2 = I.P(mu, I.D, 0);
        ctx.save(); ctx.strokeStyle = "#7048e8"; ctx.lineWidth = 2.6; ctx.setLineDash([6, 4]); ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke(); ctx.restore();
        ctx.fillStyle = "#7048e8"; ctx.beginPath(); ctx.arc(p1.x, p1.y, 5, 0, 6.2832); ctx.fill();
      }
      ctx.restore();
      if (mu <= I.L) { var pp = I.P(mu, I.D, ZT + 26); K.pill(ctx, "🔍 여기 " + dist + " m", pp.x, pp.y - 10, { s: 11.5, a: "center", c: "#d0bfff", box: box }); }
      /* 변성대 폭: 앞면 아래 모서리를 따라 괄호 */
      var b0 = I.P(edge, I.D, 0), b1 = I.P(Math.min(I.L, edge + Wd * SC), I.D, 0);
      ctx.strokeStyle = "#12203a"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(b0.x, b0.y + 4); ctx.lineTo(b0.x, b0.y + 12); ctx.lineTo(b1.x, b1.y + 12); ctx.lineTo(b1.x, b1.y + 4); ctx.stroke();
      K.pill(ctx, "변성대 폭 " + Wd.toFixed(0) + " m", (b0.x + b1.x) / 2, (b0.y + b1.y) / 2 + 34, { s: 12, a: "center", c: KC.ink, box: box });
      I.label(ctx, Math.max(2, Math.min(edge * .5, 60)), I.D, 26, "마그마 · 반지름 " + R + " m", 8, 128, "#ffd35a", box);
      I.label(ctx, I.L, I.D * .4, ZT * .6, "둘레의 암석(셰일)", 16, -96, KC.ink, box);
      K.bigText(ctx, "변성대 폭 " + Wd.toFixed(0) + " m", 18, 52, 28, "#7dffa8");
      K.bigText(ctx, GNAME[g] + " · " + T.toFixed(0) + " °C", 18, 86, 18, "#ffffff");
      K.warn(ctx, LW - 14, 30, "⚠ 블록 두께는 보기 쉽게 그림", "right");

      /* ── 오른쪽 판정 카드 ── */
      var RX = LW + 10, px = RX + 18, x1 = W - 18, bw = x1 - px;
      judgeCard(ctx, RX, W, H, "판정");
      K.t(ctx, GNAME[g], px, 62, { s: 19, w: "900", c: GC[g] });
      K.row(ctx, "이 자리의 최고 온도", T.toFixed(0) + " °C", px, x1, 98, LT.orange);
      K.bar(ctx, px, 110, bw, T / 1100, LT.orange);
      K.row(ctx, "변성대의 폭", Wd.toFixed(0) + " m", px, x1, 148, LT.green);
      K.t(ctx, "폭 ≈ 반지름 × 0.88", px, 172, { s: 11, w: "800", c: LT.mute });
      /* 거리에 따른 최고 온도(밝은 카드 그래프) */
      var gc = K.chart(ctx, { x: px - 10, y: 190, w: bw + 12, h: 168, x0: 0, x1: 2000, y0: 0, y1: 1200, xt: 2, yt: 2, pl: 40, pb: 30,
        xl: "거리 (m) →", yl: "°C", light: true });
      var pts = []; for (var q = 0; q <= 2000; q += 25) pts.push([q, tempAt(q)]);
      K.plot(ctx, gc, pts, LT.orange, { light: true, w: 2.4 });
      ctx.save(); ctx.strokeStyle = LT.mute; ctx.setLineDash([4, 4]); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(gc.L, gc.Y(300)); ctx.lineTo(gc.R, gc.Y(300)); ctx.stroke(); ctx.restore();
      K.t(ctx, "300 °C 변성 시작", gc.R - 4, gc.Y(300) - 5, { s: 10, w: "800", a: "right", c: LT.mute });
      ctx.fillStyle = "#ffffff"; ctx.strokeStyle = "#7048e8"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(gc.X(dist), gc.Y(T), 5.5, 0, 6.2832); ctx.fill(); ctx.stroke();
      K.t(ctx, "광역 변성은", px, 400, { s: 11.5, w: "800", c: LT.mute });
      K.t(ctx, "수백 km 규모", px, 428, { s: 18, w: "900", c: LT.violet });

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
    /* 암석 미니어처(입체 표본) — 마그마 · 화성암 · 퇴적물 · 퇴적암 · 변성암 */
    function node(k, n, cur) {
      var x = n.x, y = n.y;
      ctx.save(); ctx.globalAlpha = cur ? 1 : .62;
      ctx.fillStyle = "rgba(20,30,50,.20)"; ctx.beginPath(); ctx.ellipse(x + 4, y + 26, 44, 11, 0, 0, 6.2832); ctx.fill();
      if (cur) { ctx.strokeStyle = "#f59f00"; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x + 4, y + 26, 52, 14, 0, 0, 6.2832); ctx.stroke(); }
      var I = K.iso({ ox: x - 7, oy: y - 4, s: 1, L: 56, D: 40 });
      if (k === "magma") {
        K.glow(ctx, x, y, 22, "rgba(255,150,60,.9)", 1.9);
        K.planet(ctx, x, y, 24, "#ffd36b", "#c2410c");
        K.glow(ctx, x - 6, y - 6, 5, "rgba(255,240,200,.9)", 2);
      } else if (k === "ign") {
        I.box(ctx, 0, 0, 0, 56, 40, 34, "#e9c3c1", "#d39f9f", "#b07c80");
        ["front", "right"].forEach(function (sd) { I.face(ctx, sd, function (Lw) { texture(ctx, "granite", 0, 0, Lw, 34, sd === "front" ? 3 : 5); }); });
        var R = rnd(9); for (var d = 0; d < 30; d++) { var q = I.P(R() * 56, R() * 40, 34); ctx.fillStyle = R() > .6 ? "rgba(30,25,30,.8)" : "rgba(255,255,255,.8)"; ctx.fillRect(q.x, q.y, 2, 1.5); }
      } else if (k === "sedi") {
        var R2 = rnd(21);
        for (var p = 0; p < 70; p++) { var a = R2() * 6.2832, rr = Math.sqrt(R2()) * 34, hh = (1 - rr / 34) * 26; K.planet(ctx, x + Math.cos(a) * rr, y + 14 + Math.sin(a) * rr * .35 - hh, 2.4 + R2() * 2.4, ["#f1dcae", "#c9a46c", "#9aa0a8", "#e6cf9a"][p % 4], "#6b5320"); }
      } else if (k === "sed") {
        I.box(ctx, 0, 0, 0, 56, 40, 34, "#d8c08a", "#c9a46c", "#a07c48");
        ["front", "right"].forEach(function (sd) { I.face(ctx, sd, function (Lw) { layer(ctx, "sand", 0, 0, Lw, 11, 4); layer(ctx, "shale", 0, 11, Lw, 10, 5); layer(ctx, "lime", 0, 21, Lw, 13, 6); }); });
      } else {
        I.box(ctx, 0, 0, 0, 56, 40, 34, "#b9b4c4", "#9a94a8", "#787286");
        ["front", "right"].forEach(function (sd) { I.face(ctx, sd, function (Lw) {
          for (var b = 0; b < 7; b++) { ctx.strokeStyle = b % 2 ? "rgba(245,242,236,.9)" : "rgba(30,26,40,.85)"; ctx.lineWidth = 3.2; ctx.beginPath();
            for (var u = 0; u <= Lw; u += 3) { var zz = 3 + b * 4.6 + Math.sin(u / 7 + b * .4) * 2.4; if (u) ctx.lineTo(u, zz); else ctx.moveTo(u, zz); } ctx.stroke(); }
        }); });
      }
      ctx.restore();
      K.pill(ctx, n.name, x, y + 48, { s: 13.5, a: "center", c: cur ? KC.yellow : KC.ink });
      if (cur) K.pill(ctx, "지금 이 돌", x, y - 40, { s: 11, a: "center", c: "#ffd35a" });
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      K.studio(ctx, 0, 0, W, H);
      /* 땅 블록: 위는 지표, 아래는 땅속(앞면 단면) */
      var GY = 196, GB = 430;
      ctx.fillStyle = "rgba(20,30,50,.14)"; ctx.beginPath(); ctx.ellipse(460, GB + 6, 430, 14, 0, 0, 6.2832); ctx.fill();
      ctx.fillStyle = "#93c26a"; ctx.beginPath(); ctx.moveTo(24, GY); ctx.lineTo(48, GY - 18); ctx.lineTo(888, GY - 18); ctx.lineTo(864, GY); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#7a5a3c"; ctx.beginPath(); ctx.moveTo(864, GY); ctx.lineTo(888, GY - 18); ctx.lineTo(888, GB - 18); ctx.lineTo(864, GB); ctx.closePath(); ctx.fill();
      var eg = ctx.createLinearGradient(0, GY, 0, GB); eg.addColorStop(0, "#d9c09a"); eg.addColorStop(.5, "#c79a72"); eg.addColorStop(1, "#b9785a");
      ctx.fillStyle = eg; ctx.fillRect(24, GY, 840, GB - GY);
      ctx.strokeStyle = "rgba(90,60,30,.18)"; ctx.lineWidth = 1;
      for (var ly = GY + 22; ly < GB; ly += 26) { ctx.beginPath(); ctx.moveTo(24, ly); ctx.bezierCurveTo(300, ly + 6, 600, ly - 6, 864, ly + 2); ctx.stroke(); }
      ctx.strokeStyle = "rgba(255,255,255,.6)"; ctx.lineWidth = 1.2; ctx.strokeRect(24, GY, 840, GB - GY);
      K.t(ctx, "지표 ↑", 880, GY - 28, { s: 11, a: "right", w: "800", c: LT.mute });
      K.t(ctx, "땅속 ↓", 856, GB - 12, { s: 11, a: "right", w: "800", c: "#5a3a20" });
      K.bigText(ctx, "지금 이 돌: " + N[at].name, 18, 52, 26, "#ffffff");
      K.bigText(ctx, "살아온 시간 " + fmtYears(yrs), 18, 86, 18, "#ffd35a");

      var cx = 465, cy = 250;
      EDGE.forEach(function (e) {
        var A = N[e[0]], B = N[e[1]];
        var ang = Math.atan2(B.y - A.y, B.x - A.x);
        var x1 = A.x + Math.cos(ang) * 54, y1 = A.y + Math.sin(ang) * 54;
        var x2 = B.x - Math.cos(ang) * 56, y2 = B.y - Math.sin(ang) * 56;
        var on = last === e[0] + ">" + e[1];
        var off = (e[0] === "ign" && e[1] === "magma") || (e[0] === "sed" && e[1] === "sedi") ? 7 : ((e[0] === "magma" && e[1] === "ign") || (e[0] === "sedi" && e[1] === "sed") ? -7 : 0);
        var ox = -Math.sin(ang) * off, oy = Math.cos(ang) * off;
        K.arrow(ctx, { x: x1 + ox, y: y1 + oy }, { x: x2 + ox, y: y2 + oy }, on ? LT.blue : "rgba(20,40,90,.30)", on ? 4.5 : 1.8, on ? 14 : 9);
        var lab = STEP[e[0] + ">" + e[1]];
        if (lab) {
          var mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2, dx = mx - cx, dy = my - cy, dl = Math.sqrt(dx * dx + dy * dy) || 1;
          K.pill(ctx, lab, mx + dx / dl * 26, my + dy / dl * 26 + 4, { s: 10.5, a: "center", c: on ? "#9fd8ff" : KC.ink });
        }
      });
      if (flow) {
        var A2 = N[flow.a], B2 = N[flow.b], u = Math.min(1, flow.t / 900);
        for (var k = 0; k < 4; k++) { var uu = Math.max(0, u - k * .05); K.glow(ctx, A2.x + (B2.x - A2.x) * uu, A2.y + (B2.y - A2.y) * uu, 4 - k * .7, "rgba(28,126,214,.95)", 3.5); }
      }
      Object.keys(N).forEach(function (k) { node(k, N[k], k === at); });

      var tail = log.slice(-6).join("  →  ");
      ctx.save(); ctx.shadowColor = "rgba(20,30,60,.16)"; ctx.shadowBlur = 12; ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.roundRect(14, 442, W - 28, 40, 10); ctx.fill(); ctx.restore();
      K.t(ctx, "지나온 길", 30, 467, { s: 11.5, w: "800", c: LT.mute });
      K.t(ctx, tail, 104, 467, { s: 12.5, w: "900", c: LT.ink });

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
      var LW = 560, box = [0, LW];
      /* ── 왼쪽: 노두 블록(퇴적층을 비스듬히 자른 관입암체) ── */
      var I = K.iso({ ox: 250, oy: 262, s: 0.8, L: 330, D: 150 }), ZT = 200;
      var pw = clamp(th * 0.045, 6, 150) * 0.8, ANG = 0.22;
      var TX = offCanvas(330, 200), g = TX.x;
      var LAYK = ["shale", "sand", "mud", "lime", "shale"];
      for (var li = 0; li < 5; li++) { var gz = 200 - (li + 1) * 40; g.save(); g.translate(0, 200); g.scale(1, -1); layer(g, LAYK[li], 0, gz, 330, 40, 90 + li); g.restore(); }
      g.save(); g.translate(165, 100); g.rotate(ANG);
      var dg = g.createLinearGradient(-pw / 2, 0, pw / 2, 0); dg.addColorStop(0, "#26262c"); dg.addColorStop(.2, "#4a4650"); dg.addColorStop(.5, "#5e5866"); dg.addColorStop(.8, "#4a4650"); dg.addColorStop(1, "#26262c");
      g.fillStyle = "rgba(200,90,50,.55)"; g.fillRect(-pw / 2 - 5, -200, pw + 10, 400);
      g.fillStyle = dg; g.fillRect(-pw / 2, -200, pw, 400);
      g.restore();
      K.studio(ctx, 0, 0, LW, H, { x: I.P(I.L, I.D, 0).x - 80, y: I.P(I.L, I.D, 0).y - 30, rx: 250, ry: 40 });
      ctx.save(); ctx.beginPath(); ctx.roundRect(0, 0, LW, H, 14); ctx.clip();
      faceImg(ctx, I, "front", TX.c, ZT);
      I.face(ctx, "right", function (Lw) { for (var k = 0; k < 5; k++) layer(ctx, LAYK[k], 0, 200 - (k + 1) * 40, Lw, 40, 95 + k); });
      I.shade(ctx, "right", function () { return ZT; }); I.shade(ctx, "front", function () { return ZT; });
      I.plane(ctx, ZT, "#7cae52", null);
      var ut = 165 + 100 * Math.tan(ANG);                 /* 윗면에서 암체가 지나가는 자리 */
      I.quad(ctx, I.P(ut - pw / 2 - 4, 0, ZT), I.P(ut + pw / 2 + 4, 0, ZT), I.P(ut + pw / 2 + 4, I.D, ZT), I.P(ut - pw / 2 - 4, I.D, ZT), "#5a5560");
      [[40, 40], [90, 110], [270, 40], [300, 120]].forEach(function (q, k) { if (Math.abs(q[0] - ut) > pw / 2 + 14) I.tree(ctx, q[0], q[1], ZT, .9 + (k % 2) * .15); });
      isoEdges(ctx, I, ZT);
      var sp = I.P(165, I.D, 100);
      if (!field) {                                      /* 손에 든 시료 한 조각만 보인다 */
        ctx.fillStyle = "rgba(214,222,232,.86)";
        ctx.beginPath(); ctx.rect(0, 0, LW, H); ctx.arc(sp.x, sp.y, 40, 0, 6.2832, true); ctx.fill();
        ctx.strokeStyle = "#12203a"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(sp.x, sp.y, 40, 0, 6.2832); ctx.stroke();
      }
      ctx.restore();
      if (field) {
        I.label(ctx, ut, 0, ZT, "관입한 암체", 40, -40, KC.yellow, box);
        I.label(ctx, 30, I.D, 30, "퇴적층", -40, 20, KC.ink, box);
        I.label(ctx, 165 - pw / 2 - 3, I.D, 150, "구워진 경계", -60, -24, "#ffc39a", box);
      } else {
        K.pill(ctx, "손에 든 시료만 보이는 상태", sp.x, sp.y + 66, { s: 12, a: "center", c: KC.ink, box: box });
      }
      K.bigText(ctx, coarse ? "조립질 — 결정이 보인다" : "세립질 — 결정이 안 보인다", 18, 52, 26, coarse ? "#7dffa8" : "#ffffff");
      K.bigText(ctx, field ? "층을 자르고 있다 → 관입" : "주변 암석과의 관계는?", 18, 86, 18, "#ffd35a");
      K.warn(ctx, 16, H - 16, "⚠ 두께는 보기 쉽게 과장");

      /* ── 오른쪽 카드: 시료 단면 확대 ── */
      var RX = LW + 10, px = RX + 18, x1 = W - 18;
      judgeCard(ctx, RX, W, H, "🔍 시료 단면 확대");
      var ST = offCanvas(300, 200), r = clamp(1.0 + D * 2.4, 1.0, 26);
      grains(ST.x, 300, 200, r, .33, ["#56505a", "#2c282f"], Math.round(th + dep * 77), true);
      var IS = K.iso({ ox: 702, oy: 112, s: 1, L: 150, D: 100 });
      specimen(ctx, IS, ST.c, 64);
      K.pill(ctx, coarse ? "조립질 — 알갱이가 보입니다" : "세립질 — 알갱이가 보이지 않습니다", (px + x1) / 2, 262, { s: 12, a: "center", c: coarse ? KC.green : KC.orange, box: [RX, W] });
      K.row(ctx, "식는 데 걸린 시간", fmtYears(t), px, x1, 298);
      K.row(ctx, "자란 결정의 크기", fmtMm(D), px, x1, 326, coarse ? LT.green : LT.orange);
      K.bar(ctx, px, 338, x1 - px, D / 4, coarse ? LT.green : LT.orange);
      K.tip(ctx, th <= 100 ? "얇은 판 — 열을 금방 빼앗긴다 (암맥·암상)" : (th >= 2000 ? "거대한 암체 — 수십만 년 (저반)" : "중간 크기 — 두께를 더 바꿔 보세요"), px - 6, 360, x1 - px + 12, th <= 100 || th >= 2000 ? true : null);
      K.t(ctx, "냉각 시간 ≈ (두께 ÷ 2)² ÷ 열확산 계수", px, 418, { s: 11, w: "800", c: "#1179a6" });
      K.t(ctx, "× 깊을수록 느려지는 보정", px, 436, { s: 11, w: "800", c: "#1179a6" });
      K.t(ctx, coarse ? "화강암·반려암처럼 알갱이가 또렷합니다" : "매끈해도 분출암이라는 뜻은 아닙니다", px, 460, { s: 11, w: "700", c: LT.mute });

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

  /* ---- 장면3 : 주상절리 (아이소메트릭 블록 모형 — 바닷가·강가·산꼭대기 절벽을 블록으로 잘라 본다) ---- */
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

    /* ── 블록 모형: x 는 절벽을 따라(왼쪽 위 → 오른쪽 아래), y 는 깊이 방향.
          땅(용암층)은 y 0~DL, 그 앞(y DL~D)은 바다·강·숲 비탈. 기둥 굵기는 지름 1 m ≈ 42 그림 단위(과장) ── */
    var DH = 410;                                         /* 모형 칸 높이(아래는 읽음판) */
    var I = K.iso({ ox: 470, oy: 155, s: 0.66, L: 460, D: 260 });
    var DL = 150, I2 = K.iso({ ox: 470, oy: 155, s: 0.66, L: 460, D: DL });
    var L = I.L, D = I.D, Z_FL = 22, Z_BASE = 42, ZW = 36;
    var cool = 1, playing = false, ph = 0;
    var SHORT = ["제주 중문·대포", "한탄강", "무등산 서석대·입석대"];
    var PAL = [
      { a: "#5d6470", b: "#454b56", c: "#1c2026", topA: "#80899a", topB: "#3f4652", rock: "현무암", water: [38, 112, 186] },
      { a: "#5a6068", b: "#43484f", c: "#1b1e23", topA: "#7a8290", topB: "#3d434d", rock: "현무암", water: [52, 128, 120] },
      { a: "#a39785", b: "#857a69", c: "#4a4239", topA: "#bdb19e", topB: "#7c705f", rock: "응회암", water: null }
    ];
    function zTopOf() { return Z_BASE + 50 + (flow - 5) / 115 * 100; }   /* 층 두께 5~120 m → 그림 높이 50~150 */

    /* 한 면 위에 기둥을 세운다(면 좌표: u 가로, z 위). u0~u1 구간, z0~z1 높이 */
    function columns(u0, u1, z0, z1, cw, pal, seed, k) {
      var n = Math.max(1, Math.round((u1 - u0) / cw)), w = (u1 - u0) / n, R = rnd(seed), i, c;
      for (i = 0; i < n; i++) {
        var x = u0 + i * w;
        var g = ctx.createLinearGradient(x, 0, x + w, 0);
        g.addColorStop(0, pal.c); g.addColorStop(.3, pal.a); g.addColorStop(.62, pal.b); g.addColorStop(1, pal.c);
        ctx.fillStyle = g; ctx.fillRect(x, z0, w + .5, z1 - z0);
        ctx.strokeStyle = "rgba(0,0,0,.6)"; ctx.lineWidth = 2.2;
        ctx.beginPath(); ctx.moveTo(x, z0); ctx.lineTo(x, z1); ctx.stroke();
        ctx.strokeStyle = "rgba(0,0,0,.28)"; ctx.lineWidth = 1.4;
        var nc = Math.max(1, Math.round((z1 - z0) / 34));
        for (c = 0; c < nc; c++) {
          var cz = z0 + 8 + R() * (z1 - z0 - 16);
          ctx.beginPath(); ctx.moveTo(x + 2, cz); ctx.lineTo(x + w - 2, cz + (R() - .5) * 5); ctx.stroke();
        }
      }
      /* 아직 식지 않은 가운데(위·아래 냉각면에서 안쪽으로 굳어 들어간다) */
      if (k < 1) {
        var h = z1 - z0, a = z0 + h / 2 * k, b = z1 - h / 2 * k;
        var hg = ctx.createLinearGradient(0, a, 0, b);
        hg.addColorStop(0, "rgba(255,150,40,.55)"); hg.addColorStop(.2, "rgba(255,110,30,.95)"); hg.addColorStop(.5, "rgba(255,200,90,1)");
        hg.addColorStop(.8, "rgba(255,110,30,.95)"); hg.addColorStop(1, "rgba(255,150,40,.55)");
        ctx.fillStyle = hg; ctx.fillRect(u0, a, u1 - u0, b - a);
      }
    }
    function oldRock(u0, u1, z0, z1, seed) {
      var g = ctx.createLinearGradient(0, z0, 0, z1); g.addColorStop(0, "#5a4a3a"); g.addColorStop(1, "#8a7358");
      ctx.fillStyle = g; ctx.fillRect(u0, z0, u1 - u0, z1 - z0);
      var R = rnd(seed); ctx.strokeStyle = "rgba(40,28,18,.35)"; ctx.lineWidth = 1;
      for (var y2 = z0 + 6; y2 < z1; y2 += 7) { ctx.beginPath(); ctx.moveTo(u0, y2); ctx.lineTo(u1, y2 + (R() - .5) * 3); ctx.stroke(); }
      for (var i = 0; i < (u1 - u0) * (z1 - z0) / 60; i++) { ctx.fillStyle = R() > .5 ? "rgba(255,240,220,.18)" : "rgba(30,20,10,.25)"; ctx.fillRect(u0 + R() * (u1 - u0), z0 + R() * (z1 - z0), 1.6, 1.6); }
    }
    function ground(u0, u1, z0, z1, wet) {
      var g = ctx.createLinearGradient(0, z0, 0, z1);
      if (wet) { g.addColorStop(0, "#2a2c30"); g.addColorStop(1, "#56504a"); } else { g.addColorStop(0, "#5c4a33"); g.addColorStop(1, "#7a6444"); }
      ctx.fillStyle = g; ctx.fillRect(u0, z0, u1 - u0, z1 - z0);
    }
    function waterFace(u0, u1, rgb) {
      var g = ctx.createLinearGradient(0, ZW, 0, Z_FL);
      g.addColorStop(0, "rgba(" + rgb.join(",") + ",.62)"); g.addColorStop(1, "rgba(" + Math.round(rgb[0] * .4) + "," + Math.round(rgb[1] * .45) + "," + Math.round(rgb[2] * .55) + ",.85)");
      ctx.fillStyle = g; ctx.fillRect(u0, Z_FL, u1 - u0, ZW - Z_FL);
      ctx.strokeStyle = "rgba(255,255,255,.8)"; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(u0, ZW); ctx.lineTo(u1, ZW); ctx.stroke();
    }
    /* 윗면의 육각 기둥 머리 */
    function hexTops(zT, cw, pal, k) {
      var c0 = I2.P(0, 0, zT), c1 = I2.P(L, 0, zT), c2 = I2.P(L, DL, zT), c3 = I2.P(0, DL, zT);
      ctx.save(); ctx.beginPath(); ctx.moveTo(c0.x, c0.y); ctx.lineTo(c1.x, c1.y); ctx.lineTo(c2.x, c2.y); ctx.lineTo(c3.x, c3.y); ctx.closePath(); ctx.clip();
      ctx.fillStyle = pal.topB; ctx.fill();
      var r = cw * 0.55, dx = 1.5 * r, dy = Math.sqrt(3) * r, R = rnd(77), i, j, a;
      for (i = 0; i * dx <= L + r; i++) {
        for (j = -1; j * dy <= DL + r; j++) {
          var cx = i * dx, cy = j * dy + (i % 2 ? dy / 2 : 0);
          ctx.beginPath();
          for (a = 0; a < 6; a++) { var p = I2.P(cx + r * Math.cos(a * Math.PI / 3), cy + r * Math.sin(a * Math.PI / 3), zT); if (a) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y); }
          ctx.closePath();
          ctx.fillStyle = K.tint(pal.topA, .78 + R() * .3); ctx.fill();
          ctx.strokeStyle = "rgba(10,12,16," + (.25 + .55 * k).toFixed(2) + ")"; ctx.lineWidth = 1.3; ctx.stroke();
        }
      }
      if (k < .45) { ctx.fillStyle = "rgba(255,120,40," + ((.45 - k) * 1.6).toFixed(2) + ")"; ctx.fillRect(0, 0, W, DH); }
      ctx.restore();
    }
    function grassTop(zT) {
      var R = rnd(15);
      I2.plane(ctx, zT, "#6f9a4a", null);
      for (var i = 0; i < 4; i++) {                       /* 용암대지 위 논밭 */
        var x0 = 30 + i * 105, y0 = 18 + (i % 2) * 34;
        I2.plane(ctx, zT, ["#86a957", "#a7b766", "#7da352", "#b9ad62"][i], "rgba(60,80,30,.5)", x0, x0 + 80, y0, y0 + 60);
      }
      [[30, 130], [150, 120], [260, 135], [400, 110], [440, 30], [430, 140], [200, 12]].forEach(function (t, k) { I2.tree(ctx, t[0], t[1], zT, .9 + (k % 3) * .12); });
      return R;
    }
    function quadW(x0, x1, y0, y1, z, fill, stroke) { I.quad(ctx, I.P(x0, y0, z), I.P(x1, y0, z), I.P(x1, y1, z), I.P(x0, y1, z), fill, stroke); }

    function render() {
      var t = years(), Dm = colW(), pal = PAL[place], zT = zTopOf(), k = cool;
      var cw = clamp(Dm * 42, 14, 140);
      var wet = !!pal.water, soil = place === 1 ? 6 : 0;
      ctx.clearRect(0, 0, W, H);
      /* ── 위: 블록 모형 ── */
      K.studio(ctx, 0, 0, W, DH, { x: I.P(L, D, 0).x - 60, y: I.P(L, D, 0).y - 30, rx: 330, ry: 52 });
      ctx.save(); ctx.beginPath(); ctx.roundRect(0, 0, W, DH, 14); ctx.clip();
      /* 오른쪽 면(x = L): 땅 u 0~DL, 앞 띠 u DL~D */
      I.face(ctx, "right", function () {
        oldRock(0, DL, 0, Z_BASE, 3);
        columns(0, DL, Z_BASE, zT - soil, cw, pal, 11, k);
        if (soil) { ctx.fillStyle = "#6b4f32"; ctx.fillRect(0, zT - soil, DL, soil); }
        ground(DL, D, 0, Z_FL, wet);
        if (wet) waterFace(DL, D, pal.water);
      });
      I.shade(ctx, "right", function (u) { return u <= DL ? zT : (wet ? ZW : Z_FL); });
      /* 절벽 앞면(y = DL) */
      I2.face(ctx, "front", function (Lw) {
        oldRock(0, Lw, 0, Z_BASE, 5);
        columns(0, Lw, Z_BASE, zT - soil, cw, pal, 21, k);
        if (soil) { ctx.fillStyle = "#6b4f32"; ctx.fillRect(0, zT - soil, Lw, soil); }
      });
      I2.shade(ctx, "front", function () { return zT; });
      /* 윗면 */
      if (place === 1) grassTop(zT); else hexTops(zT, cw, pal, k);
      /* 절벽 앞 띠: 바다 · 강 · 숲 비탈 */
      if (wet) {
        quadW(0, L, DL, D, Z_FL, place === 0 ? "#2b2d31" : "#6c6656", null);
        var R = rnd(40 + place);
        for (var b = 0; b < 9; b++) {                     /* 떨어져 나온 기둥 조각 */
          var bx = 30 + R() * (L - 80), by = DL + 6 + R() * 50, bs = clamp(cw * .55, 8, 28);
          I.box(ctx, bx, by, Z_FL, bx + bs, by + bs * .8, Z_FL + bs * .5, K.tint(pal.topA, .9), K.tint(pal.a, .9), K.tint(pal.c, 1.2));
        }
      } else {
        quadW(0, L, DL, D, Z_FL, "#5f6b3c", null);
        var R2 = rnd(44);
        for (var b2 = 0; b2 < 14; b2++) {                 /* 너덜: 무너져 내린 기둥 토막 */
          var tx = 20 + R2() * (L - 60), ty = DL + 4 + R2() * 60, ts = clamp(cw * .6, 9, 36);
          I.box(ctx, tx, ty, Z_FL, tx + ts, ty + ts * .8, Z_FL + ts * .55, K.tint(pal.topA, .95), K.tint(pal.a, .95), K.tint(pal.c, 1.3));
        }
        [[40, 220], [130, 245], [230, 225], [330, 248], [420, 222], [440, 250], [90, 185]].forEach(function (q, i) { I.tree(ctx, q[0], q[1], Z_FL, 1 + (i % 3) * .15); });
      }
      /* 앞면(y = D) */
      I.face(ctx, "front", function (Lw) { ground(0, Lw, 0, Z_FL, wet); if (wet) waterFace(0, Lw, pal.water); });
      if (wet) {                                          /* 수면과 잔물결 */
        var rgb = pal.water;
        quadW(0, L, DL, D, ZW, "rgba(" + rgb.join(",") + ",.55)", "rgba(255,255,255,.6)");
        ctx.strokeStyle = "rgba(255,255,255,.55)"; ctx.lineWidth = 1.1;
        for (var wv = 0; wv < 10; wv++) {
          var gx = ((wv * .37 + ph * .06) % 1) * (L - 40) + 20, gy = DL + 14 + ((wv * .61) % 1) * (D - DL - 24);
          var s1 = I.P(gx - 14, gy, ZW), s2 = I.P(gx + 10, gy, ZW);
          ctx.beginPath(); ctx.moveTo(s1.x, s1.y); ctx.quadraticCurveTo((s1.x + s2.x) / 2, s1.y - 3, s2.x, s2.y); ctx.stroke();
        }
        /* 절벽 밑에 부딪는 흰 물결 */
        var f0 = I2.P(0, DL, ZW), f1 = I2.P(L, DL, ZW);
        ctx.strokeStyle = "rgba(255,255,255,.75)"; ctx.lineWidth = 2.4; ctx.setLineDash([10, 7]); ctx.lineDashOffset = -ph * 12;
        ctx.beginPath(); ctx.moveTo(f0.x, f0.y + 1); ctx.lineTo(f1.x, f1.y + 1); ctx.stroke(); ctx.setLineDash([]);
      }
      /* 모서리 밝은 선 */
      ctx.strokeStyle = "rgba(255,255,255,.55)"; ctx.lineWidth = 1.2;
      var e1 = I.P(L, DL, zT), e2 = I.P(L, DL, wet ? ZW : Z_FL), e3 = I.P(0, DL, zT), e4 = I.P(L, 0, zT);
      ctx.beginPath(); ctx.moveTo(e3.x, e3.y); ctx.lineTo(e1.x, e1.y); ctx.lineTo(e4.x, e4.y); ctx.moveTo(e1.x, e1.y); ctx.lineTo(e2.x, e2.y); ctx.stroke();
      var e5 = I.P(0, D, 0), e6 = I.P(L, D, 0), e7 = I.P(L, 0, 0);
      ctx.beginPath(); ctx.moveTo(e5.x, e5.y); ctx.lineTo(e6.x, e6.y); ctx.lineTo(e7.x, e7.y); ctx.stroke();
      ctx.restore();

      /* 열이 빠져나가는 방향(냉각면 = 윗면) */
      [[80, 50], [240, 90], [380, 40]].forEach(function (q) {
        var p = I2.P(q[0], q[1], zT); K.arrow(ctx, { x: p.x, y: p.y - 4 }, { x: p.x, y: p.y - 40 }, k < 1 ? "#ff7a2f" : "#f08a24", 3, 10);
      });
      var box = [0, W];
      var ap = I2.P(380, 40, zT);
      K.pill(ctx, "열이 빠져나가는 방향(냉각면)", ap.x + 12, ap.y - 30, { s: 11.5, c: KC.orange, box: box });
      /* 이름표 */
      I2.label(ctx, 70, DL, (Z_BASE + zT) / 2 + 6, pal.rock + " 기둥(주상절리)", -110, -30, "#ffffff", box);
      I2.label(ctx, 40, DL, Z_BASE * .62, "더 오래된 암석", -80, 22, "#f1dcc0", box);
      var fp = I2.P(L - cw * 1.5, DL, zT);
      I2.label(ctx, L - cw * 1.5, DL, zT, "기둥 지름 약 " + Dm.toFixed(2) + " m", 752 - fp.x, 34, "#ffd35a", box);
      if (wet) I.label(ctx, 200, D - 30, ZW, place === 0 ? "바다(파도가 깎아 드러낸 절벽)" : "한탄강(강물이 깎아 드러낸 절벽)", -150, 34, "#bfe6ff", box);
      else I.label(ctx, 160, D - 40, Z_FL + 8, "무너져 내린 기둥 토막(너덜)", -130, 30, "#e3f2c4", box);
      K.pill(ctx, "기둥은 냉각면에 수직으로 자랍니다", W - 14, DH - 16, { s: 11.5, a: "right", c: KC.ink, box: box });
      /* 큰 글자 */
      if (k < 1) { K.bigText(ctx, "용암이 식으며 갈라진다", 22, 52, 28, "#ffffff"); K.bigText(ctx, "위·아래 냉각면부터 안쪽으로 굳는다", 22, 86, 17, "#ffd35a"); }
      else if (Dm >= 1) { K.bigText(ctx, "천천히 식어 굵은 기둥", 22, 52, 28, "#ffffff"); K.bigText(ctx, "두께 " + flow + " m → 지름 약 " + Dm.toFixed(2) + " m", 22, 86, 18, "#7dffa8"); }
      else if (Dm <= 0.6) { K.bigText(ctx, "빨리 식어 가는 기둥", 22, 52, 28, "#ffffff"); K.bigText(ctx, "두께 " + flow + " m → 지름 약 " + Dm.toFixed(2) + " m", 22, 86, 18, "#ffd35a"); }
      else { K.bigText(ctx, "식으며 갈라진 돌기둥", 22, 52, 28, "#ffffff"); K.bigText(ctx, "두께 " + flow + " m → 지름 약 " + Dm.toFixed(2) + " m", 22, 86, 18, "#ffd35a"); }
      K.warn(ctx, W - 14, 30, "⚠ 높이·굵기는 보기 쉽게 과장", "right");
      K.pill(ctx, "📍 " + SHORT[place], W - 14, 62, { s: 12.5, a: "right", c: KC.blue, box: box });

      /* ── 아래: 읽음판 ── */
      var y0 = DH + 8;
      K.stage(ctx, 0, y0, W, H - y0, "night", { seed: 8 });
      K.t(ctx, "용암(화산암)층 두께", 22, y0 + 28, { s: 11.5, w: "800", c: KC.mute });
      K.t(ctx, flow + " m", 22, y0 + 58, { s: 20, w: "900", c: KC.ink });
      K.t(ctx, "다 식는 데 걸린 시간", 220, y0 + 28, { s: 11.5, w: "800", c: KC.mute });
      K.t(ctx, fmtYears(t), 220, y0 + 58, { s: 18, w: "900", c: KC.ink });
      K.t(ctx, "기둥의 지름", 430, y0 + 28, { s: 11.5, w: "800", c: KC.mute });
      ctx.save(); ctx.shadowColor = Dm >= 1 ? KC.green : KC.yellow; ctx.shadowBlur = 12;
      K.t(ctx, Dm.toFixed(2) + " m", 430, y0 + 60, { s: 26, w: "900", c: Dm >= 1 ? KC.green : KC.yellow }); ctx.restore();
      gauge(ctx, 430, y0 + 72, 220, 10, Dm / 2, Dm >= 1 ? KC.green : KC.yellow);
      var seenN = got.seen.filter(function (x) { return x; }).length;
      K.t(ctx, "읽어 본 곳", 700, y0 + 28, { s: 11.5, w: "800", c: KC.mute });
      for (var s = 0; s < 3; s++) {
        if (got.seen[s]) K.glow(ctx, 708 + s * 24, y0 + 52, 4, "rgba(63,211,163,.95)", 3);
        else { ctx.strokeStyle = KC.dim; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(708 + s * 24, y0 + 52, 5, 0, 6.2832); ctx.stroke(); }
      }
      K.t(ctx, seenN + " / 3", 790, y0 + 57, { s: 12.5, w: "900", c: seenN >= 3 ? KC.green : KC.mute });
      K.t(ctx, "용암은 식으면서 부피가 줄어듭니다. 줄어든 만큼 사방으로 잡아당겨지다가 견디지 못하고 갈라지는데,", 22, y0 + 116, { s: 12, c: KC.ink, w: "600" });
      K.t(ctx, "가장 적은 힘으로 면을 나누는 모양이 육각형이라 기둥의 단면이 육각형에 가까워집니다.", 22, y0 + 138, { s: 12, c: KC.mute, w: "600" });
      K.t(ctx, "천천히 식을수록 갈라진 틈의 간격이 넓어져 기둥이 굵어집니다.", 22, y0 + 160, { s: 12, c: KC.mute, w: "600" });
    }

    function draw() {
      var t = years(), D2 = colW();
      render();
      var ch = false;
      if (D2 >= 1 && !got.thick) { got.thick = ch = true; }
      if (D2 <= 0.6 && !got.thin) { got.thin = ch = true; }
      if (!got.seen[place]) { got.seen[place] = true; ch = true; }
      if (ch) { window.sthState("cCol", got); mission(); render(); }

      $("c-col-read").innerHTML = "기둥의 굵기: <b>" + D2.toFixed(2) + " m</b>";
      $("c-col-info").innerHTML = "<b>" + PLACE[place].n + "</b> — " + PLACE[place].d +
        "<br><br>두께 <b>" + flow + " m</b> 인 용암층은 다 식는 데 <b>" + fmtYears(t) + "</b>이 걸리고, 이때 생기는 기둥의 지름은 약 <b>" + D2.toFixed(2) + " m</b>입니다. " +
        (D2 >= 1 ? "두껍게 쌓인 용암은 천천히 식어 <b>굵은 기둥</b>을 만듭니다." : "얇게 흐른 용암은 빨리 식어 <b>가는 기둥</b>이 촘촘히 생깁니다.");
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
    /* ▶ 식는 과정 보기: 그림만 다시 그린다(미션 판정과 무관) */
    var playBtn = $("c-col-play");
    if (playBtn) playBtn.addEventListener("click", function () {
      if (playing) { playing = false; playBtn.textContent = "▶ 이어서 보기"; return; }
      if (cool >= 1) cool = 0;
      playing = true; playBtn.textContent = "⏸ 멈추기";
    });
    K.animate(canvas, function (dt) {
      if (!playing) return;
      cool = Math.min(1, cool + dt / 1000 / 4.5); ph += dt / 1000;
      if (cool >= 1) { playing = false; if (playBtn) playBtn.textContent = "▶ 식는 과정 다시 보기"; }
      render();
    }, 24);
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
    /* 입체 지도 미니어처: 바다 판 위에 두께가 있는 땅 조각을 올린다(한 번만 그려 두고 표식만 다시 그린다) */
    var MAP = null;
    function slab(c, path, th, top, side) {
      c.save(); c.translate(0, th); path(c); c.fillStyle = side; c.fill(); c.restore();
      for (var k = th - 1; k > 0; k--) { c.save(); c.translate(0, k); path(c); c.fillStyle = side; c.fill(); c.restore(); }
      path(c); c.fillStyle = top; c.fill();
    }
    function buildMap() {
      var o = offCanvas(W, H), c = o.x;
      var sea = c.createLinearGradient(0, 40, 0, H - 20); sea.addColorStop(0, "#cfe8fb"); sea.addColorStop(1, "#9fcdf0");
      c.fillStyle = "rgba(20,30,50,.16)"; c.beginPath(); c.roundRect(214, 50, 520, H - 66, 22); c.fill();
      c.fillStyle = sea; c.beginPath(); c.roundRect(208, 40, 520, H - 70, 22); c.fill();
      c.strokeStyle = "rgba(255,255,255,.55)"; c.lineWidth = 1;
      for (var wv = 0; wv < 14; wv++) { var wx = 240 + (wv * 97) % 460, wy = 70 + (wv * 151) % 480; c.beginPath(); c.moveTo(wx, wy); c.quadraticCurveTo(wx + 10, wy - 4, wx + 20, wy); c.stroke(); }
      function land(cc) { cc.beginPath(); LAND.forEach(function (p, i) { if (i === 0) cc.moveTo(p[0], p[1]); else cc.lineTo(p[0], p[1]); }); cc.closePath(); }
      var lg = c.createLinearGradient(340, 0, 530, 0); lg.addColorStop(0, "#a5cf7e"); lg.addColorStop(.6, "#7fb15c"); lg.addColorStop(1, "#5e9446");
      c.fillStyle = "rgba(20,30,50,.18)"; c.save(); c.translate(6, 14); land(c); c.fill(); c.restore();
      slab(c, land, 10, lg, "#8a6f4e");
      c.save(); land(c); c.clip();
      /* 백두대간 쪽 산줄기: 볼록한 능선 */
      c.lineCap = "round";
      c.strokeStyle = "rgba(70,100,45,.55)"; c.lineWidth = 14; c.beginPath(); c.moveTo(455, 100); c.quadraticCurveTo(480, 220, 470, 300); c.quadraticCurveTo(440, 380, 410, 440); c.stroke();
      c.strokeStyle = "rgba(220,240,190,.55)"; c.lineWidth = 4; c.beginPath(); c.moveTo(452, 98); c.quadraticCurveTo(477, 218, 467, 298); c.quadraticCurveTo(437, 378, 407, 438); c.stroke();
      var R = rnd(12);
      for (var i = 0; i < 160; i++) { c.fillStyle = R() > .5 ? "rgba(255,255,255,.18)" : "rgba(40,60,20,.16)"; c.fillRect(340 + R() * 190, 60 + R() * 450, 2, 2); }
      c.restore();
      [[370, 540, 46, 24, 9], [610, 250, 16, 16, 7], [655, 268, 7, 7, 5]].forEach(function (q) {
        c.fillStyle = "rgba(20,30,50,.18)"; c.beginPath(); c.ellipse(q[0] + 5, q[1] + q[4] + 4, q[2], q[3], 0, 0, 6.2832); c.fill();
        var ig = c.createRadialGradient(q[0] - q[2] * .3, q[1] - q[3] * .3, 1, q[0], q[1], Math.max(q[2], q[3])); ig.addColorStop(0, "#b3d88c"); ig.addColorStop(1, "#6f9f4f");
        slab(c, function (cc) { cc.beginPath(); cc.ellipse(q[0], q[1], q[2], q[3], 0, 0, 6.2832); }, q[4], ig, "#8a6f4e");
      });
      MAP = o;
    }
    function pin(x, y, col, on) {
      ctx.fillStyle = "rgba(20,30,50,.25)"; ctx.beginPath(); ctx.ellipse(x + 3, y + 2, 7, 2.6, 0, 0, 6.2832); ctx.fill();
      var h = on ? 18 : 16, r = on ? 7.5 : 7;
      var g = ctx.createRadialGradient(x - r * .4, y - h - r * .3, 1, x, y - h, r * 1.3); g.addColorStop(0, "#ffffff"); g.addColorStop(.25, col); g.addColorStop(1, K.tint(col, .6));
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x, y); ctx.bezierCurveTo(x - r * .4, y - h * .45, x - r * 1.2, y - h + r * .3, x - r, y - h);
      ctx.arc(x, y - h, r, Math.PI, 0); ctx.bezierCurveTo(x + r * 1.2, y - h + r * .3, x + r * .4, y - h * .45, x, y); ctx.fill();
      ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(x, y - h, r * .38, 0, 6.2832); ctx.fill();
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      if (!MAP) buildMap();
      K.studio(ctx, 0, 0, W, H);
      ctx.drawImage(MAP.c, 0, 0, W, H);
      K.t(ctx, "동해", 690, 160, { s: 14, c: "rgba(30,90,150,.55)", w: "900" });
      K.t(ctx, "서해", 300, 420, { s: 14, c: "rgba(30,90,150,.55)", w: "900" });
      SPOT.forEach(function (s, i) {
        var on = sel === i, seen = G4.seen.indexOf(i) >= 0;
        if (!seen && !on) { ctx.strokeStyle = "rgba(232,89,12," + (.3 + .35 * Math.sin(pt / 8 + i)) + ")"; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(s.x, s.y, 15 + 3 * Math.sin(pt / 8 + i), 6 + 1.2 * Math.sin(pt / 8 + i), 0, 0, 6.2832); ctx.stroke(); }
        pin(s.x, s.y, on ? "#1c7ed6" : (seen ? "#0f9f76" : "#e8590c"), on);
        var tx = s.side === 1 ? s.x + 18 : s.x - 18;
        K.pill(ctx, (seen ? "✓ " : "") + s.n, tx, s.y + 5, { s: 11.5, a: s.side === 1 ? "left" : "right", c: on ? KC.blue : (seen ? KC.green : KC.ink) });
      });
      K.bigText(ctx, "지질공원 " + G4.seen.length + " / 6", 18, 52, 28, G4.seen.length >= 6 ? "#7dffa8" : "#ffffff");
      K.bigText(ctx, "표식을 눌러 보세요", 18, 86, 17, "#ffd35a");
      /* 왼쪽 카드: 확인한 곳 */
      K.card(ctx, 14, 108, 262, 226, "확인한 곳");
      SPOT.forEach(function (s, i) {
        var y = 162 + i * 28, seen = G4.seen.indexOf(i) >= 0, on = sel === i;
        if (on) { ctx.fillStyle = "#e7f1fb"; ctx.beginPath(); ctx.roundRect(24, y - 18, 242, 25, 8); ctx.fill(); }
        K.t(ctx, s.n.replace(" 세계지질공원", "").replace(" 국가지질공원", ""), 34, y, { s: 12, w: on ? "900" : "700", c: seen ? LT.ink : LT.dim });
        K.t(ctx, seen ? "✓" : "·", 256, y, { s: 14, w: "900", a: "right", c: seen ? LT.green : LT.dim });
      });
      /* 오른쪽 아래 흰 띠: 한반도 지질의 큰 흐름 */
      ctx.save(); ctx.shadowColor = "rgba(20,30,60,.16)"; ctx.shadowBlur = 12; ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.roundRect(456, 534, W - 470, 54, 12); ctx.fill(); ctx.restore();
      K.t(ctx, "선캄브리아 변성암 → 고생대 퇴적암 → 중생대 화강암·화산암", 470, 555, { s: 11, c: LT.ink, w: "800" });
      K.t(ctx, "→ 신생대 화산암. 이것이 한반도 지질의 큰 흐름입니다.", 470, 576, { s: 11, c: LT.mute, w: "700" });
      K.warn(ctx, W - 14, 30, "⚠ 지도 모양은 간략하게 그린 것", "right");
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
