/* 지구과학 Ⅲ-1 태양계 행성의 겉보기 운동 — 소단원별 이야기 세 편
   ① 거꾸로 가는 별 ② 해 지고 나서 한 시간 ③ 그림자가 지나간 자리
   공용 부품: ../assets/theme.js (sthUnit·sthState·sthGate·sthWork·setupCanvas·cssVar·drawArrow),
             ../assets/story.js (sthStory·sthMission·sthSort·sthOrder·sthPick), ../assets/share.js */
(function () {
"use strict";

window.sthUnit("eshs-3-1");

var FONT = "'Gothic A1','Segoe UI',sans-serif";
var D2R = Math.PI / 180, R2D = 180 / Math.PI;

function $(id) { return document.getElementById(id); }
function v(name) { return window.cssVar(name); }
function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
function done(id) { var e = $(id); if (e) e.classList.add("done"); }
function paper(ctx, W, H) { ctx.clearRect(0, 0, W, H); ctx.fillStyle = v("--card-2"); ctx.fillRect(0, 0, W, H); }
var K = window.sthKit, KC = K.C, REDUCE = K.REDUCE;
/* 무대 바탕 + 제목 이름표(배지가 왼쪽 위에 뜨는 캔버스는 제목을 오른쪽에) */
function stage(ctx, W, H, title, o) {
  o = o || {};
  ctx.clearRect(0, 0, W, H);
  K.stage(ctx, 0, 0, W, H, o.kind || "space", { seed: o.seed || 7 });
  if (title) K.pill(ctx, title, o.right ? W - 16 : 16, 28, { s: 13, a: o.right ? "right" : "left", c: KC.blue });
}
/* 그림 위 이름표 */
function lbl(ctx, s, x, y, o) { o = o || {}; return K.pill(ctx, s, x, y, { s: Math.min(o.s || 12, 13), a: o.a, c: o.c || KC.ink, box: o.box }); }
/* 빛을 받는 둥근 천체 */
function ball(ctx, x, y, r, col, dark) {
  K.glow(ctx, x, y, r * .8, "rgba(255,255,255,.35)", 2.6);
  K.planet(ctx, x, y, r, col, dark || (col === VENUS ? "#8a6420" : (col === MARS ? "#6e2410" : (col === MOON ? "#4a4c58" : "#5a4020"))));
}
var MARS = "#ff8a65", VENUS = "#ffe0a3", MOON = "#e9e9ef";
/* 유리 판 */
function glass(ctx, x, y, w, h, r) {
  ctx.save(); ctx.fillStyle = "rgba(255,255,255,.05)"; ctx.strokeStyle = "rgba(200,210,255,.2)"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r || 12); ctx.fill(); ctx.stroke(); ctx.restore();
}
/* 글자가 캔버스 밖으로 나가지 않도록 x를 살짝 밀어 넣는다 */
function text(ctx, s, x, y, o) {
  o = o || {};
  ctx.font = (o.w || "500") + " " + (o.s || 12) + "px " + FONT;
  ctx.fillStyle = o.c || v("--ink");
  var a = o.a || "left";
  ctx.textAlign = a;
  var W = ctx.canvas._w || 900;
  var w = ctx.measureText(s).width;
  var L = a === "center" ? x - w / 2 : (a === "right" || a === "end" ? x - w : x);
  if (L < 3) x += (3 - L);
  else if (L + w > W - 3) x -= (L + w - (W - 3));
  ctx.fillText(s, x, y);
}
function band(ctx, x, y, w, h, color, alpha) {
  ctx.save(); ctx.globalAlpha = alpha === undefined ? 0.75 : alpha;
  ctx.fillStyle = v(color); ctx.fillRect(x, y, w, h); ctx.restore();
}
function axes(ctx, x0, y0, x1, y1) {
  ctx.strokeStyle = v("--line"); ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0, y1); ctx.lineTo(x1, y1); ctx.stroke();
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
function withA(hex, a) {
  hex = (hex || "#888").trim();
  if (hex.charAt(0) !== "#") return hex;
  if (hex.length === 4) hex = "#" + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
  var r = parseInt(hex.substr(1, 2), 16), g = parseInt(hex.substr(3, 2), 16), b = parseInt(hex.substr(5, 2), 16);
  return "rgba(" + r + "," + g + "," + b + "," + a + ")";
}
/* setTimeout 애니메이션 (가려진 탭에서는 그리지 않는다) */
function anim(canvas, step) {
  (function tick() {
    if (canvas.offsetParent !== null) step();
    setTimeout(tick, 110);
  })();
}

/* ---- 스튜디오 + 입체 우주 모형 도구 ----
   밝은 스튜디오 바탕 위에 궤도면을 비스듬히 내려다본 검은 원반(disk), 입체 공(orb·sunBall),
   하늘 사진은 세워 둔 어두운 진열판(deck), 오른쪽 흰 판정 카드(K.card), 굵은 큰 글자(big). */
var LT = K.LT;
var PCOL = { "수성": ["#d9d4cc", "#5d574f"], "금성": ["#ffe0a3", "#8a6420"], "화성": ["#ff8a65", "#6e2410"],
  "목성": ["#ffd59a", "#7a5220"], "토성": ["#f3d9a0", "#7a6030"], "달": ["#e9e9ef", "#4a4c58"] };
function deck(ctx, x, y, w, h, seed, title) {
  ctx.save(); ctx.shadowColor = "rgba(20,30,60,.30)"; ctx.shadowBlur = 18; ctx.shadowOffsetY = 6;
  ctx.fillStyle = "#0b1030"; ctx.beginPath(); ctx.roundRect(x, y, w, h, 14); ctx.fill(); ctx.restore();
  K.stage(ctx, x, y, w, h, "space", { seed: seed || 5 });
  ctx.strokeStyle = "rgba(255,255,255,.65)"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.roundRect(x + .75, y + .75, w - 1.5, h - 1.5, 14); ctx.stroke();
  if (title) K.pill(ctx, title, x + 14, y + 26, { s: 12.5, c: KC.blue, box: [x, x + w] });
}
/* 궤도 원반: 두께 있는 검은 원반을 비스듬히 내려다본 모습. 돌려주는 함수 pr(x, y, z) 는 원반 좌표(px, y 는 안쪽) → 화면 */
function disk(ctx, cx, cy, R, o) {
  o = o || {};
  var q = o.q || 0.42, th = o.th == null ? 12 : o.th, ry = R * q, i;
  var sh = ctx.createRadialGradient(cx, cy + th + 6, R * .2, cx, cy + th + 6, R * 1.15);
  sh.addColorStop(0, "rgba(20,30,50,.34)"); sh.addColorStop(.6, "rgba(20,30,50,.10)"); sh.addColorStop(1, "rgba(20,30,50,0)");
  ctx.fillStyle = sh; ctx.beginPath(); ctx.ellipse(cx, cy + th + 8, R * 1.12, ry * 1.15 + 10, 0, 0, 6.2832); ctx.fill();
  var rg = ctx.createLinearGradient(cx - R, 0, cx + R, 0); rg.addColorStop(0, "#1b2257"); rg.addColorStop(.45, "#3a4690"); rg.addColorStop(1, "#0f1438");
  ctx.fillStyle = rg; ctx.beginPath(); ctx.ellipse(cx, cy + th, R, ry, 0, 0, Math.PI); ctx.lineTo(cx - R, cy);
  ctx.ellipse(cx, cy, R, ry, 0, Math.PI, 0, true); ctx.closePath(); ctx.fill();
  var tg = ctx.createRadialGradient(cx - R * .25, cy - ry * .4, R * .1, cx, cy, R);
  tg.addColorStop(0, "#1f2a6e"); tg.addColorStop(1, "#080b26");
  ctx.fillStyle = tg; ctx.beginPath(); ctx.ellipse(cx, cy, R, ry, 0, 0, 6.2832); ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.ellipse(cx, cy, R, ry, 0, 0, 6.2832); ctx.clip();
  var Rr = K.rng(o.seed || 11);
  for (i = 0; i < R * 1.3; i++) { ctx.globalAlpha = .2 + Rr() * .55; ctx.fillStyle = "#ffffff"; var z = Rr() > .92 ? 1.7 : 1; ctx.fillRect(cx - R + Rr() * 2 * R, cy - ry + Rr() * 2 * ry, z, z); }
  ctx.globalAlpha = 1; ctx.restore();
  ctx.strokeStyle = "rgba(255,255,255,.8)"; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.ellipse(cx, cy, R, ry, 0, 0, 6.2832); ctx.stroke();
  return function (x, y, z) { return { x: cx + x, y: cy - y * q - (z || 0) }; };
}
function ring(ctx, cx, cy, r, q, col, w, dash) {
  ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = w || 1.6; if (dash) ctx.setLineDash(dash);
  ctx.beginPath(); ctx.ellipse(cx, cy, Math.max(.5, r), Math.max(.5, r * q), 0, 0, 6.2832); ctx.stroke(); ctx.restore();
}
/* 원반 위의 입체 공(행성·달·지구) — 아래에 작은 그림자 */
function orb(ctx, x, y, r, name) {
  ctx.fillStyle = "rgba(0,0,0,.45)"; ctx.beginPath(); ctx.ellipse(x + r * .3, y + r * .85, r * 1.05, r * .34, 0, 0, 6.2832); ctx.fill();
  if (name === "지구") { K.earth(ctx, x, y, r); return; }
  var c = PCOL[name] || [name, "#3b2a17"];
  K.glow(ctx, x, y, r * .8, "rgba(255,255,255,.25)", 2.2);
  K.planet(ctx, x, y, r, c[0], c[1]);
}
/* 빛나는 태양 공 — 밝은 바탕에서도 공으로 보이게 */
function sunBall(ctx, x, y, r) {
  K.sun(ctx, x, y, r);
  var g = ctx.createRadialGradient(x - r * .35, y - r * .35, r * .1, x, y, r);
  g.addColorStop(0, "#fffbe6"); g.addColorStop(.55, "#ffd04a"); g.addColorStop(1, "#ff9a1f");
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill();
}
/* 굵은 큰 글자 두 줄 */
function big(ctx, s1, s2, x, y, col2, a, sz) {
  if (s1) K.bigText(ctx, s1, x, y, sz || 26, "#ffffff", a);
  if (s2) K.bigText(ctx, s2, x, y + 32, 17, col2 || "#ffd35a", a);
}
/* 그래프 범례(흰 바탕 띠): items = [[글, 색], …], 오른쪽 끝 x 에 맞춘다 */
function lgd(ctx, xr, y, items) {
  ctx.font = "800 11.5px " + FONT; var w = 16;
  items.forEach(function (it) { w += ctx.measureText(it[0]).width + 16; });
  ctx.fillStyle = "rgba(255,255,255,.92)"; ctx.strokeStyle = "rgba(20,40,90,.18)"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.roundRect(xr - w, y - 15, w, 22, 8); ctx.fill(); ctx.stroke();
  var x = xr - w + 10;
  items.forEach(function (it) { K.t(ctx, it[0], x, y, { s: 11.5, w: "800", c: it[1] }); x += ctx.measureText(it[0]).width + 16; });
}
/* 흰 판정 카드: 제목(작은 회색) + 큰 판정 글자 */
function vcard(ctx, x, y, w, h, title, head, col, hs) {
  K.card(ctx, x, y, w, h, title);
  if (head) K.t(ctx, head, x + 18, y + 62, { s: hs || 22, w: "900", c: col || LT.ink });
}

/* =========================================================================
   태양계 궤도 계산 — 기존 페이지의 케플러 모형을 그대로 이어받았다.
   a(AU), e, 근일점 경도 w, 평균 경도 L0, 공전 주기 P(일), 궤도 경사 i, 승교점 경도 N
   ========================================================================= */
var ORB = {
  "수성": { a: 0.387098, e: 0.205630, w:  77.457, L0: 252.250, P:    87.969, i: 7.005, N:  48.331, c: "--mist",   rad: 2.6 },
  "금성": { a: 0.723332, e: 0.006772, w: 131.602, L0: 181.979, P:   224.701, i: 3.395, N:  76.680, c: "--violet", rad: 4.2 },
  "지구": { a: 1.000000, e: 0.016709, w: 102.937, L0: 100.464, P:   365.256, i: 0.000, N:   0.000, c: "--brand",  rad: 4.4 },
  "화성": { a: 1.523679, e: 0.093394, w: 336.041, L0: 355.453, P:   686.980, i: 1.850, N:  49.558, c: "--coral",  rad: 3.6 },
  "목성": { a: 5.202887, e: 0.048386, w:  14.728, L0:  34.396, P:  4332.589, i: 1.303, N: 100.464, c: "--amber",  rad: 7.0 },
  "토성": { a: 9.536676, e: 0.053862, w:  92.599, L0:  49.954, P: 10759.220, i: 2.485, N: 113.665, c: "--rose",   rad: 6.2 }
};
var ZODIAC = ["물고기자리", "양자리", "황소자리", "쌍둥이자리", "게자리", "사자자리",
              "처녀자리", "천칭자리", "전갈자리", "궁수자리", "염소자리", "물병자리"];

function norm360(x) { x %= 360; return x < 0 ? x + 360 : x; }
function wrap180(x) { return norm360(x + 180) - 180; }

var J2000 = Date.UTC(2000, 0, 1, 12, 0, 0);
function daysOf(ms) { return (ms - J2000) / 86400000; }
function dateStr(ms) {
  var d = new Date(ms);
  return d.getUTCFullYear() + "-" + ("0" + (d.getUTCMonth() + 1)).slice(-2) + "-" + ("0" + d.getUTCDate()).slice(-2);
}
function helio(name, dd) {
  var o = ORB[name];
  var M = norm360(o.L0 + 360 * dd / o.P - o.w), Mr = M * D2R, e = o.e;
  var C = ((2 * e - e * e * e / 4) * Math.sin(Mr)
         + 1.25 * e * e * Math.sin(2 * Mr)
         + (13 / 12) * e * e * e * Math.sin(3 * Mr)) * R2D;
  var nu = M + C;
  var r = o.a * (1 - e * e) / (1 + e * Math.cos(nu * D2R));
  var u = (nu + o.w - o.N) * D2R;
  var N = o.N * D2R, ii = o.i * D2R;
  var x = r * (Math.cos(N) * Math.cos(u) - Math.sin(N) * Math.sin(u) * Math.cos(ii));
  var y = r * (Math.sin(N) * Math.cos(u) + Math.cos(N) * Math.sin(u) * Math.cos(ii));
  var z = r * Math.sin(u) * Math.sin(ii);
  return { lam: norm360(Math.atan2(y, x) * R2D), r: r, x: x, y: y, z: z };
}
function geo(name, dd) {
  var p = helio(name, dd), E = helio("지구", dd);
  var dx = p.x - E.x, dy = p.y - E.y, dz = p.z - E.z;
  var lam = norm360(Math.atan2(dy, dx) * R2D);
  var lamSun = norm360(Math.atan2(-E.y, -E.x) * R2D);
  var delta = Math.sqrt(dx * dx + dy * dy + dz * dz);
  var beta = Math.asin(dz / delta) * R2D;
  var cosi = (p.r * p.r + delta * delta - E.r * E.r) / (2 * p.r * delta);
  cosi = clamp(cosi, -1, 1);
  return {
    lam: lam, beta: beta, lamSun: lamSun, dist: delta, r: p.r,
    elong: wrap180(lam - lamSun),     /* + 동방 / − 서방 */
    k: (1 + cosi) / 2,                /* 밝게 보이는 비율 */
    p: p, E: E
  };
}
/* 이각으로부터 뜨는·남중·지는 시각(태양시) — 춘분 무렵으로 단순화 */
function riseSet(el) {
  var tr = norm360((12 + el / 15) * 15) / 15;
  return { rise: (tr + 18) % 24, transit: tr, set: (tr + 6) % 24 };
}
function marginH(el, h) {
  var tr = (12 + el / 15 + 48) % 24;
  var dh = ((h - tr + 36) % 24) - 12;
  return 6 - Math.abs(dh);
}
function oxMark(el, h) {
  var m = marginH(el, h);
  return m >= 0.5 ? "O" : (m > 0 ? "△" : "X");
}
function hhmm(h) {
  var t = ((h % 24) + 24) % 24, H = Math.floor(t), M = Math.round((t - H) * 60);
  if (M === 60) { M = 0; H = (H + 1) % 24; }
  return ("0" + H).slice(-2) + ":" + ("0" + M).slice(-2);
}
function hourLabel(t) {
  var h = Math.floor(t), m = Math.round((t - h) * 60);
  return (h >= 24 ? h - 24 : h) + "시 " + ("0" + m).slice(-2) + "분";
}

/* 배경별 — 씨앗 고정 난수로 늘 같은 하늘 */
function mulberry(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    var t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
var STARS = (function () {
  var rnd = mulberry(20260831), s = [];
  for (var i = 0; i < 900; i++) s.push({ lam: rnd() * 360, b: (rnd() - 0.5) * 34, m: Math.pow(rnd(), 2.4) });
  return s;
})();

/* 천구 띠 그리기. 남쪽을 바라볼 때이므로 동쪽이 왼쪽, 서쪽이 오른쪽 */
function drawSky(ctx, box, lamC, spanDeg, opts) {
  opts = opts || {};
  var x0 = box.x, y0 = box.y, w = box.w, h = box.h;
  var k = w / spanDeg;
  var toX = function (lam) { return x0 + w / 2 - wrap180(lam - lamC) * k; };

  ctx.save();
  ctx.beginPath(); ctx.roundRect(x0, y0, w, h, 12); ctx.clip();
  var g = ctx.createLinearGradient(0, y0, 0, y0 + h);
  g.addColorStop(0, "#050818"); g.addColorStop(.5, "#0e1638"); g.addColorStop(1, "#060a1e");
  ctx.fillStyle = g; ctx.fillRect(x0, y0, w, h);

  var i, s, sx, sy;
  for (i = 0; i < STARS.length; i++) {
    s = STARS[i];
    if (Math.abs(wrap180(s.lam - lamC)) > spanDeg / 2 + 2) continue;
    sx = toX(s.lam); sy = y0 + h / 2 + s.b * (h / 44);
    if (sy < y0 + 6 || sy > y0 + h - 6) continue;
    ctx.globalAlpha = 0.35 + 0.65 * s.m;
    ctx.fillStyle = "#dbe7f7";
    if (s.m > .72) { ctx.globalAlpha = 1; K.glow(ctx, sx, sy, 0.7 + 1.5 * s.m, "rgba(219,231,247,.95)", 3.2); }
    else { ctx.beginPath(); ctx.arc(sx, sy, 0.5 + 2.0 * s.m, 0, 6.2832); ctx.fill(); }
  }
  ctx.globalAlpha = 1;

  if (opts.ecliptic !== false) {
    ctx.strokeStyle = "rgba(255,214,120,.55)"; ctx.lineWidth = 1.5; ctx.setLineDash([7, 5]);
    ctx.beginPath(); ctx.moveTo(x0, y0 + h / 2); ctx.lineTo(x0 + w, y0 + h / 2); ctx.stroke();
    ctx.setLineDash([]);
    text(ctx, "황도", x0 + 8, y0 + h / 2 - 8, { s: 11, w: "600", c: "rgba(255,214,120,.8)" });
    for (i = 0; i < 12; i++) {
      var c = i * 30 + 15;
      if (Math.abs(wrap180(c - lamC)) > spanDeg / 2) continue;
      text(ctx, ZODIAC[i], toX(c), y0 + 20, { s: 11, w: "600", a: "center", c: "rgba(190,208,232,.55)" });
    }
  }
  ctx.restore();
  ctx.strokeStyle = KC.line; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.roundRect(x0 + .5, y0 + .5, w - 1, h - 1, 12); ctx.stroke();
  return toX;
}

/* =========================================================================
   이야기 ① 거꾸로 가는 별
   ========================================================================= */
(function () {
  var ep = window.sthStory({ root: "epA", key: "epA", name: "사건 파일 ①", onDone: finish });

  window.sthGate({
    gate: "a-gate", key: "a-p", title: "동아리 일지의 첫 줄",
    question: "남쪽 하늘을 찍은 사진에서 화성이 배경별에 대해 <b>오른쪽</b>으로 옮겨 갔습니다. 화성은 하늘에서 어느 쪽으로 간 것일까요?",
    options: [
      "㉠ 동쪽으로 갔다 — 지도에서도 오른쪽이 동쪽이다",
      "㉡ 서쪽으로 갔다 — 남쪽을 바라볼 때는 왼쪽이 동쪽, 오른쪽이 서쪽이다",
      "㉢ 알 수 없다 — 사진만으로는 하늘의 방위를 정할 수 없다"
    ],
    onPick: function (i) { window.sthState("aPredOK", i === 1 ? "맞음" : "어긋남"); ep.clear(0); }
  });

  /* ---- 장면2 : 일주 운동으로 하늘의 동서 정하기 ---- */
  (function () {
    var canvas = $("a-c-sky"), ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var tnow = 21, ttran = 22, tick = 0;
    var LAT = 36.5;
    var G = window.sthState("aSky") || { a: false, b: false, c: false, d: false, tag: "" };
    if (!G.tag) G.tag = "";

    function altAz(Hdeg) {
      var Hr = Hdeg * D2R, fr = LAT * D2R;
      var alt = Math.asin(Math.cos(fr) * Math.cos(Hr)) * R2D;
      var az = Math.atan2(Math.sin(Hr), Math.cos(Hr) * Math.sin(fr)) * R2D;  /* 남쪽 0, 서쪽 + */
      return { alt: alt, az: az };
    }

    /* 땅 블록 + 유리 하늘 돔 모형. 관측자는 남쪽(화면 안쪽)을 바라본다 → 동 = 화면 왼쪽, 서 = 화면 오른쪽 */
    var I = K.iso({ ox: 310, oy: 150, s: 0.75, L: 280, D: 280 });
    var DCX = 140, DCY = 140, RD = 140, SQ = Math.SQRT1_2;
    var DS = [-SQ, -SQ], DW = [SQ, -SQ];
    function domeP(alt, az, f) {
      var r = RD * (f || 1), ca = Math.cos(alt * D2R), c = Math.cos(az * D2R), sn = Math.sin(az * D2R);
      return I.P(DCX + r * ca * (c * DS[0] + sn * DW[0]), DCY + r * ca * (c * DS[1] + sn * DW[1]), r * Math.sin(alt * D2R));
    }
    var SF = 0.9;   /* 별의 길은 유리 지붕보다 조금 안쪽에 그린다 */
    function status(Hh, s) {
      if (Math.abs(Hh + 6) < 0.13) return { t: "떠오르는 순간", c: LT.orange };
      if (Math.abs(Hh) < 0.13) return { t: "남중", c: LT.green };
      if (Math.abs(Hh - 6) < 0.13) return { t: "지는 순간", c: LT.violet };
      if (s.alt <= 0) return { t: "지평선 아래", c: LT.dim };
      return Hh < 0 ? { t: "남중 전 · 오르는 중", c: LT.blue } : { t: "남중 후 · 내려가는 중", c: LT.blue };
    }
    function draw() {
      var Hh = tnow - ttran, Hdeg = Hh * 15, s = altAz(Hdeg), st = status(Hh, s), LW = 610, i, hh, q;
      ctx.clearRect(0, 0, W, H);
      K.studio(ctx, 0, 0, LW, H, { x: 310, y: 392, rx: 270, ry: 40 });
      ctx.save(); ctx.beginPath(); ctx.roundRect(0, 0, LW, H, 14); ctx.clip();

      /* 땅 블록: 흙 + 풀 */
      I.box(ctx, 0, 0, -40, 280, 280, -7, "#8a6a48", "#9a7650", "#715438");
      I.face(ctx, "front", function (Lw) { var R0 = K.rng(5); for (var k = 0; k < 140; k++) { ctx.fillStyle = R0() > .5 ? "rgba(255,255,255,.18)" : "rgba(40,25,10,.25)"; ctx.fillRect(R0() * Lw, -40 + R0() * 32, 2, 2); } });
      I.face(ctx, "right", function (Lw) { var R0 = K.rng(6); for (var k = 0; k < 140; k++) { ctx.fillStyle = R0() > .5 ? "rgba(255,255,255,.14)" : "rgba(40,25,10,.3)"; ctx.fillRect(R0() * Lw, -40 + R0() * 32, 2, 2); } });
      I.box(ctx, 0, 0, -7, 280, 280, 0, "#79ad55", "#5f9440", "#4c7a33");
      var R1 = K.rng(9);
      for (i = 0; i < 260; i++) { q = I.P(R1() * 280, R1() * 280, 0); ctx.fillStyle = R1() > .5 ? "rgba(40,90,30,.35)" : "rgba(190,235,150,.35)"; ctx.fillRect(q.x, q.y, 2, 1.2); }
      I.edges(ctx, 0, 0);

      /* 하늘 돔: 위쪽 반원 + 지평선 앞쪽 반 타원 */
      var c0 = I.P(DCX, DCY, 0), rs = RD * I.s * 1.2247;
      function domePath() {
        ctx.beginPath(); ctx.arc(c0.x, c0.y, rs, Math.PI, 0);
        for (var t = 0; t <= 180; t += 5) {
          var a = t * D2R, wx = Math.cos(a) * DW[0] + Math.sin(a) * SQ, wy = Math.cos(a) * DW[1] + Math.sin(a) * SQ;
          var p = I.P(DCX + RD * wx, DCY + RD * wy, 0); ctx.lineTo(p.x, p.y);
        }
        ctx.closePath();
      }
      domePath();
      var sg = ctx.createLinearGradient(0, c0.y - rs, 0, c0.y + 40); sg.addColorStop(0, "rgba(8,14,52,.92)"); sg.addColorStop(.75, "rgba(28,48,112,.82)"); sg.addColorStop(1, "rgba(70,100,170,.75)");
      ctx.fillStyle = sg; ctx.fill();
      ctx.save(); domePath(); ctx.clip();
      var R2 = K.rng(21);
      for (i = 0; i < 120; i++) { ctx.globalAlpha = .25 + R2() * .6; ctx.fillStyle = "#e6eeff"; ctx.fillRect(c0.x - rs + R2() * 2 * rs, c0.y - rs + R2() * rs * 1.2, R2() > .9 ? 1.8 : 1.1, R2() > .9 ? 1.8 : 1.1); }
      ctx.globalAlpha = 1; ctx.restore();
      /* 고도 30°·60° 원, 자오선 */
      [30, 60].forEach(function (al) {
        ctx.strokeStyle = "rgba(200,215,255,.28)"; ctx.lineWidth = 1; ctx.beginPath();
        for (var az = -180; az <= 180; az += 6) { var p = domeP(al, az); if (az === -180) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); }
        ctx.stroke();
      });
      ctx.beginPath(); for (var al2 = 0; al2 <= 180; al2 += 6) { var pm = al2 <= 90 ? domeP(al2, 0) : domeP(180 - al2, 180); if (!al2) ctx.moveTo(pm.x, pm.y); else ctx.lineTo(pm.x, pm.y); }
      ctx.strokeStyle = "rgba(200,215,255,.28)"; ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,.85)"; ctx.lineWidth = 1.6; ctx.beginPath();
      for (i = 0; i <= 72; i++) { q = domeP(0, i * 5); if (i) ctx.lineTo(q.x, q.y); else ctx.moveTo(q.x, q.y); }
      ctx.stroke();

      /* 별이 하루 동안 그리는 길 */
      ctx.save(); ctx.strokeStyle = "rgba(255,214,120,.95)"; ctx.lineWidth = 2.6; ctx.setLineDash([7, 5]); ctx.shadowColor = "#ffb020"; ctx.shadowBlur = 6; ctx.beginPath();
      var on = false;
      for (hh = -6; hh <= 6.001; hh += 0.2) { var aa = altAz(hh * 15); if (aa.alt < -0.01) { on = false; continue; } q = domeP(Math.max(0, aa.alt), aa.az, SF); if (on) ctx.lineTo(q.x, q.y); else { ctx.moveTo(q.x, q.y); on = true; } }
      ctx.stroke(); ctx.restore();

      /* 관측자 */
      I.person(ctx, DCX, DCY, 0, "#e8590c", 2.4);

      /* 별 */
      var above = s.alt > 0, sp = domeP(Math.max(0, s.alt), s.az, SF), foot = domeP(0, s.az, SF);
      if (above) {
        K.line(ctx, sp, foot, "rgba(255,214,120,.8)", 1.4, [3, 3]);
        var nx = altAz((Hh + 0.6) * 15);
        if (nx.alt > 0) { var np = domeP(nx.alt, nx.az, SF), dx = np.x - sp.x, dy = np.y - sp.y, dn = Math.hypot(dx, dy) || 1; K.arrow(ctx, { x: sp.x + dx / dn * 12, y: sp.y + dy / dn * 12 }, { x: sp.x + dx / dn * 44, y: sp.y + dy / dn * 44 }, "#ff9a3c", 3, 10); }
        K.glow(ctx, sp.x, sp.y, 6, "rgba(255,230,163,.98)", 4.2); K.spikes(ctx, sp.x, sp.y, 16, .7);
        K.pill(ctx, "★ 이 별 · 고도 " + s.alt.toFixed(0) + "°", sp.x, sp.y - 20, { s: 12, a: "center", c: "#ffe6a3", box: [0, LW] });
      } else {
        ctx.fillStyle = "rgba(120,130,150,.7)"; ctx.beginPath(); ctx.arc(foot.x, foot.y, 5, 0, 6.2832); ctx.fill();
        K.pill(ctx, "★ 지평선 아래", foot.x, foot.y + 26, { s: 12, a: "center", c: "#c7cfe6", box: [0, LW] });
      }
      /* 유리 돔 반짝임 */
      ctx.strokeStyle = "rgba(255,255,255,.55)"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(c0.x, c0.y, rs, Math.PI, 0); ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(c0.x, c0.y, rs - 10, Math.PI * 1.1, Math.PI * 1.32); ctx.stroke();

      /* 방위 이름표: 남·북만 미리 붙여 두고, 동·서는 학생이 붙인다 */
      var pS = domeP(0, 0), pN = domeP(0, 180), pL = domeP(0, -90), pR = domeP(0, 90);
      K.pill(ctx, "남", pS.x, pS.y - 8, { s: 14, a: "center", c: "#ffd35a" });
      K.pill(ctx, "북", pN.x, pN.y + 24, { s: 13, a: "center", c: "#c7cfe6" });
      if (G.tag) {
        var el = G.tag === "left";
        K.pill(ctx, el ? "동" : "서", pL.x - 12, pL.y + 6, { s: 17, a: "right", c: el ? "#7fd3ff" : "#ff8a9a" });
        K.pill(ctx, el ? "서" : "동", pR.x + 12, pR.y + 6, { s: 17, c: el ? "#7fd3ff" : "#ff8a9a" });
      } else {
        K.pill(ctx, "?", pL.x - 12, pL.y + 6, { s: 17, a: "right", c: "#ffffff" });
        K.pill(ctx, "?", pR.x + 12, pR.y + 6, { s: 17, c: "#ffffff" });
      }
      ctx.restore();
      big(ctx, st.t, "고도 " + s.alt.toFixed(1) + "° · " + hourLabel(tnow), 18, 48, "#ffd35a", "left", 25);
      K.warn(ctx, 14, H - 14, "⚠ 하늘을 둥근 지붕으로 나타낸 모형");

      /* 오른쪽 판정 카드 */
      var RX = 620, px = RX + 18, RR = W - 18;
      vcard(ctx, RX, 0, W - RX, H, "판정 · 위도 36.5°, 천구 적도 위의 별", st.t, st.c, st.t.length > 7 ? 18 : 22);
      K.row(ctx, "시간각", (Hh >= 0 ? "+" : "") + Hh.toFixed(2) + " 시간", px, RR, 104);
      K.row(ctx, "고도", s.alt.toFixed(1) + "°", px, RR, 132, s.alt > 0 ? LT.ink : LT.dim);
      K.row(ctx, "방위 (남에서)", (s.az >= 0 ? "오른쪽 " : "왼쪽 ") + Math.abs(s.az).toFixed(0) + "°", px, RR, 160);
      K.bar(ctx, px, 174, RR - px, Math.max(0, s.alt) / 53.5, LT.yellow);
      K.t(ctx, "0°", px, 202, { s: 10, c: LT.dim }); K.t(ctx, "남중 고도 53.5°", RR, 202, { s: 10, a: "right", c: LT.dim });
      K.row(ctx, "뜨는 시각", hourLabel(ttran - 6), px, RR, 234);
      K.row(ctx, "남중", hourLabel(ttran), px, RR, 262);
      K.row(ctx, "지는 시각", hourLabel(ttran + 6), px, RR, 290);
      var tg = !G.tag ? ["동·서 이름표를 아직 안 붙였습니다", null] : (G.tag === "left" ? ["✔ 왼쪽 = 동, 오른쪽 = 서", true] : ["✘ 이름표가 거꾸로입니다", false]);
      K.tip(ctx, tg[0], px - 4, 312, RR - px + 4, tg[1]);
      K.t(ctx, "노란 점선: 이 별이 하루에 그리는 길", px, 374, { s: 11, c: LT.mute });
      K.t(ctx, "주황 화살표: 시각이 지나며 가는 쪽", px, 394, { s: 11, c: LT.mute });

      var ch = false;
      if (Math.abs(Hh + 6) < 0.13 && !G.a) { G.a = ch = true; }
      if (Math.abs(Hh) < 0.13 && !G.b) { G.b = ch = true; }
      if (Math.abs(Hh - 6) < 0.13 && !G.c) { G.c = ch = true; }
      if (ch) { window.sthState("aSky", G); mission(); }

      $("a-sky-read").innerHTML = "시간각: <b>" + (Hh >= 0 ? "+" : "") + Hh.toFixed(2) + " 시간</b> · 고도 <b>"
        + s.alt.toFixed(1) + "°</b>" + (s.alt <= 0 ? " (지평선 아래)" : "");
      var msg;
      if (Math.abs(Hh + 6) < 0.13) msg = "<b>별이 지금 막 떠오릅니다.</b> 고도가 0°이고, 별은 화면의 <b>왼쪽 끝</b>에 있습니다. 별이 뜨는 쪽이 곧 <b>동쪽</b>입니다.";
      else if (Math.abs(Hh) < 0.13) msg = "<b>남중입니다.</b> 별이 바로 남쪽, 화면 한가운데에서 가장 높이 떴습니다. 천구 적도 위의 별은 위도 36.5°에서 고도 <b>53.5°</b>까지 올라갑니다.";
      else if (Math.abs(Hh - 6) < 0.13) msg = "<b>별이 지금 막 집니다.</b> 화면의 <b>오른쪽 끝</b>입니다. 별이 지는 쪽이 <b>서쪽</b>입니다.";
      else if (Hh < 0) msg = "별은 아직 남중 <b>전</b>입니다. 화면 왼쪽에 있고, 시각이 지날수록 오른쪽으로 옮겨 갑니다. 시간각이 <b>−6시간</b>이 되면 지평선에 닿습니다.";
      else msg = "별은 남중을 <b>지났습니다</b>. 화면 오른쪽으로 내려가는 중입니다. 시간각이 <b>+6시간</b>이 되면 지평선에 닿습니다.";
      $("a-sky-info").innerHTML = msg + (G.tag ? "<br><br>" + (G.tag === "left"
        ? "✅ 이름표를 <b>올바로</b> 붙였습니다. 남쪽을 바라볼 때는 <b>왼쪽이 동쪽, 오른쪽이 서쪽</b>입니다."
        : "❌ 이름표가 거꾸로입니다. 별은 <b>동에서 떠서 서로</b> 집니다. 그런데 이 화면에서 별은 <b>왼쪽에서 떠서 오른쪽으로</b> 집니다.") : "");
    }
    function mission() {
      if (G.a) done("m-a2a"); if (G.b) done("m-a2b"); if (G.c) done("m-a2c"); if (G.d) done("m-a2d");
      if (G.a && G.b && G.c && G.d) {
        window.sthMission("m-a2", true, "<span class='m-tag'>미션 완료</span>별은 <b>왼쪽(동)에서 떠서 오른쪽(서)으로</b> 집니다. 지도는 북쪽을 위로 두어 오른쪽이 동쪽이지만, 천구에서 천체의 이동 방향을 말할 때는 <b>남쪽을 바라볼 때</b>가 기준이라 좌우가 뒤집힙니다. 이제 ‘서에서 동으로’와 ‘동에서 서로’를 제대로 읽을 수 있습니다.");
        ep.clear(1);
      }
    }
    canvas._redraw = draw;
    $("a-time").addEventListener("input", function (e) {
      tnow = +e.target.value; $("a-time-val").textContent = hourLabel(tnow); draw();
    });
    $("a-tran").addEventListener("input", function (e) {
      ttran = +e.target.value; $("a-tran-val").textContent = hourLabel(ttran); draw();
    });
    $("a-east-left").addEventListener("click", function () {
      G.tag = "left"; this.classList.add("on"); $("a-east-right").classList.remove("on");
      if (!G.d) G.d = true;
      window.sthState("aSky", G); draw(); mission();
    });
    $("a-east-right").addEventListener("click", function () {
      G.tag = "right"; this.classList.add("on"); $("a-east-left").classList.remove("on");
      window.sthState("aSky", G); draw(); mission();
    });
    if (G.tag === "left") $("a-east-left").classList.add("on");
    if (G.tag === "right") $("a-east-right").classList.add("on");
    draw(); mission();
  })();

  /* ---- 장면3 : 여덟 달의 겉보기 운동 ---- */
  (function () {
    var canvas = $("a-c-retro"), ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var D0 = daysOf(Date.UTC(2024, 7, 1));
    var planet = "화성", day = 0, trail = [];
    var G = window.sthState("aRetro") || { a: false, b: false, c: false, d: false };
    var SKY = { x: 24, y: 22, w: W - 48, h: 250 };
    var OB = { cx: W / 2, cy: 470, R: 150 };

    function collect() {
      trail = [];
      for (var i = 0; i <= day; i += 2) {
        var g = geo(planet, D0 + i);
        trail.push({ lam: g.lam, beta: g.beta });
      }
    }
    function flipsSoFar() {
      var n = 0, sgn = null;
      for (var i = 1; i < trail.length; i++) {
        var s = wrap180(trail[i].lam - trail[i - 1].lam) >= 0 ? 1 : -1;
        if (sgn !== null && s !== sgn) n++;
        sgn = s;
      }
      return n;
    }
    function modeNow() {
      if (trail.length < 2) return "—";
      var n = trail.length;
      return wrap180(trail[n - 1].lam - trail[n - 2].lam) >= 0 ? "순행" : "역행";
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      K.studio(ctx, 0, 0, W, H);
      deck(ctx, SKY.x, SKY.y, SKY.w, SKY.h, 13);
      var dd = D0 + day, g = geo(planet, dd);

      /* 위 — 천구(하늘 사진 진열판) */
      var span = 70, lamC = g.lam;
      if (trail.length > 2) {
        var lo = 0, hi = 0, ref = trail[0].lam, dv;
        for (var t = 0; t < trail.length; t++) {
          dv = wrap180(trail[t].lam - ref);
          if (dv < lo) lo = dv; if (dv > hi) hi = dv;
        }
        span = clamp((hi - lo) * 1.25 + 14, 45, 150);
        lamC = norm360(ref + (lo + hi) / 2);
      }
      var toX = drawSky(ctx, SKY, lamC, span, {});
      var BS = 16;
      function toY(b) { return SKY.y + SKY.h / 2 - b * BS; }
      var i, p, q, dl, sgn;
      ctx.lineWidth = 3.4; ctx.lineCap = "round"; ctx.lineJoin = "round";
      for (i = 1; i < trail.length; i++) {
        p = trail[i - 1]; q = trail[i];
        if (Math.abs(wrap180(p.lam - lamC)) > span / 2 || Math.abs(wrap180(q.lam - lamC)) > span / 2) continue;
        dl = wrap180(q.lam - p.lam); sgn = dl >= 0 ? 1 : -1;
        ctx.strokeStyle = sgn > 0 ? KC.blue : KC.red; ctx.shadowColor = ctx.strokeStyle; ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.moveTo(toX(p.lam), toY(p.beta)); ctx.lineTo(toX(q.lam), toY(q.beta)); ctx.stroke();
      }
      ctx.shadowBlur = 0;
      var prevS = null;
      for (i = 1; i < trail.length; i++) {
        dl = wrap180(trail[i].lam - trail[i - 1].lam); sgn = dl >= 0 ? 1 : -1;
        if (prevS !== null && sgn !== prevS && Math.abs(wrap180(trail[i].lam - lamC)) <= span / 2) {
          var ux = toX(trail[i].lam), uy = toY(trail[i].beta);
          ctx.strokeStyle = KC.yellow; ctx.lineWidth = 2.5;
          ctx.beginPath(); ctx.arc(ux, uy, 8, 0, 6.2832); ctx.stroke();
          lbl(ctx, "유", ux, uy - 16, { s: 12, a: "center", c: KC.yellow });
        }
        prevS = sgn;
      }
      var px = toX(g.lam), py = toY(g.beta);
      orb(ctx, px, py, 7, planet);
      lbl(ctx, planet, clamp(px, 50, 850), py - 16, { s: 12.5, a: "center", c: "#ffffff" });
      if (Math.abs(wrap180(g.lamSun - lamC)) <= span / 2) {
        var sxx = toX(g.lamSun);
        K.sun(ctx, sxx, toY(0), 9);
        lbl(ctx, "태양", clamp(sxx, 50, 850), toY(0) - 22, { s: 12, a: "center", c: KC.yellow });
      }
      text(ctx, "천구 · 배경별을 기준으로 본 하늘 (황위는 보기 쉽게 확대)", SKY.x + SKY.w / 2, SKY.y + SKY.h - 12,
        { s: 11, a: "center", c: "rgba(200,216,240,.85)" });
      K.pill(ctx, "동", SKY.x + 12, SKY.y + SKY.h - 32, { s: 14, c: KC.blue });
      K.pill(ctx, "서", SKY.x + SKY.w - 12, SKY.y + SKY.h - 32, { s: 14, a: "right", c: KC.blue });
      K.line(ctx, { x: px, y: SKY.y + SKY.h + 2 }, { x: px, y: SKY.y + SKY.h + 16 }, LT.line, 1.6, [4, 4]);
      K.t(ctx, "↑ 지구에서 행성으로 그은 시선이 하늘의 이 지점을 가리킵니다", clamp(px, 230, 670), SKY.y + SKY.h + 30, { s: 11.5, a: "center", c: LT.mute });

      /* 아래 — 궤도 원반 모형 */
      var a = ORB[planet].a, RP = 236;
      var S = RP / (a > 2 ? a * 1.08 : a * 1.25), cx = 305, cy = 488, Q = 0.42;
      var pr = disk(ctx, cx, cy, 252, { q: Q, seed: 13 });
      ["지구", planet].forEach(function (n) { ring(ctx, cx, cy, ORB[n].a * S, Q, n === "지구" ? "rgba(127,211,255,.75)" : "rgba(255,170,120,.8)", 1.8); });
      var E = g.E, P = g.p, ep = pr(E.x * S, E.y * S), pp = pr(P.x * S, P.y * S);
      /* 시선: 지구 → 행성 → 원반 가장자리 너머 */
      var ux2 = P.x - E.x, uy2 = P.y - E.y, un = Math.hypot(ux2, uy2) || 1; ux2 /= un; uy2 /= un;
      var bdot = E.x * ux2 + E.y * uy2, rr = 1.04 * 252 / S, tt = -bdot + Math.sqrt(Math.max(0, bdot * bdot - (E.x * E.x + E.y * E.y) + rr * rr));
      var endp = pr((E.x + ux2 * tt) * S, (E.y + uy2 * tt) * S);
      K.line(ctx, ep, endp, "rgba(255,255,255,.85)", 1.6, [6, 4]);
      K.arrow(ctx, { x: endp.x - (endp.x - ep.x) * .04, y: endp.y - (endp.y - ep.y) * .04 }, endp, "#ffffff", 1.8, 9);
      sunBall(ctx, cx, cy - 6, 11);
      function arrowOn(name, color) {
        var o = ORB[name], h1 = helio(name, dd), h2 = helio(name, dd + Math.max(3, o.P / 90));
        var a1 = pr(h1.x * S, h1.y * S), a2 = pr(h2.x * S, h2.y * S), n = Math.hypot(a2.x - a1.x, a2.y - a1.y);
        if (n < 1) return;
        K.arrow(ctx, { x: a1.x + (a2.x - a1.x) / n * 13, y: a1.y + (a2.y - a1.y) / n * 13 }, { x: a1.x + (a2.x - a1.x) / n * 38, y: a1.y + (a2.y - a1.y) / n * 38 }, color, 2.8, 9);
      }
      arrowOn("지구", "#7fd3ff"); arrowOn(planet, "#ffb38a");
      orb(ctx, ep.x, ep.y, 7, "지구"); orb(ctx, pp.x, pp.y, ORB[planet].rad + 3, planet);
      lbl(ctx, "태양", cx, cy + 30, { s: 11.5, a: "center", c: KC.yellow });
      lbl(ctx, "지구", ep.x, ep.y - 15, { s: 11.5, a: "center", c: KC.blue, box: [0, 610] });
      lbl(ctx, planet, pp.x, pp.y - 15, { s: 11.5, a: "center", c: "#ffd0b8", box: [0, 610] });
      K.warn(ctx, 14, H - 12, "⚠ 궤도 크기·행성 크기는 실제 비율이 아님");
      var f = flipsSoFar(), mode = modeNow(), el = g.elong;
      big(ctx, planet + (mode === "—" ? " · 날짜를 밀어 보세요" : " · " + mode + " 중"), "유 " + f + "회 · 이각 " + (el >= 0 ? "동방 " : "서방 ") + Math.abs(el).toFixed(0) + "°", 18, 340, mode === "역행" ? "#ff9aa8" : "#9fe0ff");

      /* 오른쪽 판정 카드 */
      var RX = 622, cy0 = 300, pxx = RX + 18, RR = W - 18;
      vcard(ctx, RX, cy0, W - RX, H - cy0 - 8, "배경별에 대한 겉보기 운동", mode === "—" ? "아직 기록 없음" : mode, mode === "역행" ? LT.red : (mode === "순행" ? LT.blue : LT.dim));
      K.row(ctx, "날짜", dateStr(J2000 + dd * 86400000), pxx, RR, cy0 + 100);
      K.row(ctx, "유 (방향이 바뀐 횟수)", f + "회", pxx, RR, cy0 + 128, f ? LT.orange : LT.ink);
      K.row(ctx, "이각", (el >= 0 ? "동방 " : "서방 ") + Math.abs(el).toFixed(0) + "°", pxx, RR, cy0 + 156);
      K.row(ctx, "지구까지 거리", g.dist.toFixed(2) + " AU", pxx, RR, cy0 + 184);
      K.row(ctx, planet + "의 공전 방향", "늘 서→동", pxx, RR, cy0 + 212, LT.green);
      var tip = mode !== "역행" ? [mode === "순행" ? "순행: 배경별에 대해 서 → 동" : "날짜를 밀면 자취가 남습니다", null]
        : (Math.abs(el) >= 150 ? ["충 부근 — 지구가 앞지르는 중", true] : (Math.abs(el) <= 30 ? ["내합 부근 — 금성이 앞지르는 중", true] : ["역행: 배경별에 대해 동 → 서", false]));
      K.tip(ctx, tip[0], pxx - 4, cy0 + 232, RR - pxx + 4, tip[1]);
      K.t(ctx, "━ 파랑: 순행   ━ 빨강: 역행", pxx, cy0 + 296, { s: 11.5, w: "800", c: LT.mute });
      K.t(ctx, "○ 노랑: 유 (방향이 바뀌는 순간)", pxx, cy0 + 318, { s: 11.5, w: "800", c: LT.mute });
    }

    function refresh() {
      collect();
      var g = geo(planet, D0 + day);
      var f = flipsSoFar(), mode = modeNow(), el = g.elong;
      $("a-day-val").textContent = day + "일";
      $("a-date").textContent = dateStr(J2000 + (D0 + day) * 86400000);
      $("a-state").textContent = mode;
      $("a-orbflip").textContent = "0";
      $("a-skyflip").textContent = f;
      $("a-mode").textContent = mode;
      $("a-elong").textContent = (el >= 0 ? "동방 " : "서방 ") + Math.abs(el).toFixed(0) + "°";
      $("a-retro-read").innerHTML = "겉보기 운동: <b>" + mode + "</b> · 유 " + f + "회 · 이각 "
        + (el >= 0 ? "동방 " : "서방 ") + Math.abs(el).toFixed(0) + "°";

      var ch = false;
      if (planet === "화성" && f >= 2 && !G.a) { G.a = ch = true; }
      if (planet === "화성" && mode === "역행" && Math.abs(el) >= 150 && !G.b) { G.b = ch = true; }
      if (planet === "금성" && f >= 2 && !G.c) { G.c = ch = true; }
      if (planet === "금성" && mode === "역행" && Math.abs(el) <= 30 && !G.d) { G.d = ch = true; }
      if (ch) { window.sthState("aRetro", G); mission(); }
      if (planet === "화성" && f >= 2) $("a-mis").hidden = false;

      var msg;
      if (mode === "역행") {
        msg = "<b>지금 역행 중입니다.</b> 배경별을 기준으로 " + planet + "이(가) <b>동에서 서로</b> 움직이고 있습니다. "
            + "그런데 아래 궤도면을 보세요 — " + planet + "의 공전 방향 화살표는 조금도 바뀌지 않았습니다. "
            + "지금 이각은 <b>" + Math.abs(el).toFixed(0) + "°</b>입니다."
            + (Math.abs(el) >= 150 ? " 태양의 <b>거의 정반대쪽(충)</b> 이군요 — 외행성이 역행하는 자리입니다."
                                   : (Math.abs(el) <= 30 ? " 태양에 <b>아주 가까운 쪽(내합 부근)</b>입니다 — 내행성이 역행하는 자리입니다." : ""));
      } else if (mode === "순행") {
        msg = "<b>순행 중입니다.</b> 배경별을 기준으로 " + planet + "이(가) <b>서에서 동으로</b> 움직이고 있습니다. 행성의 겉보기 운동은 대부분의 기간 동안 순행입니다.";
      } else {
        msg = "날짜를 밀어 보세요. 지구에서 행성으로 그은 <b>시선</b>이 천구에 남기는 자취가 곧 겉보기 운동입니다. 파란 자취는 순행, 붉은 자취는 역행입니다.";
      }
      $("a-retro-info").innerHTML = msg;
      draw();
    }
    function mission() {
      if (G.a) done("m-a3a"); if (G.b) done("m-a3b"); if (G.c) done("m-a3c"); if (G.d) done("m-a3d");
      if (G.a && G.b && G.c && G.d) {
        window.sthMission("m-a3", true, "<span class='m-tag'>미션 완료</span>화성은 이각이 <b>150°를 넘는 충 부근</b>에서, 금성은 이각이 <b>30°도 안 되는 내합 부근</b>에서 역행했습니다. 둘 다 <b>지구와 행성의 거리가 가장 가까워지는 때</b>입니다. 그 순간 안쪽에 있는 쪽이 바깥쪽을 앞지르면서 시선의 방향이 되돌아갑니다.");
        ep.clear(2);
      }
    }
    canvas._redraw = draw;
    $("a-day").addEventListener("input", function (e) { day = +e.target.value; refresh(); });
    segWire("a-planet", function (b) { planet = b.getAttribute("data-p"); refresh(); });
    refresh(); mission();
  })();

  /* ---- 장면4 : 주전원 ---- */
  (function () {
    var canvas = $("a-c-epi"), ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var D0 = daysOf(Date.UTC(2024, 7, 1));
    var day = 0, R = 0.85;
    var G = window.sthState("aEpi") || { a: false, b: false, c: false };
    var mDiff = 0, mFlip = 0;

    function epiPos(r, dd) {
      var hm = helio("화성", dd), he = helio("지구", dd);
      return { x: hm.x - r * he.x, y: hm.y - r * he.y, cx: hm.x, cy: hm.y, ex: he.x, ey: he.y };
    }
    function epiLam(r, dd) { var q = epiPos(r, dd); return norm360(Math.atan2(q.y, q.x) * R2D); }

    function scanR() {
      var mx = 0, i;
      for (i = 0; i <= 760; i += 5) {
        var d = Math.abs(wrap180(geo("화성", D0 + i).lam - epiLam(R, D0 + i)));
        if (d > mx) mx = d;
      }
      mDiff = mx;
      var prev = null, sgn = null, f = 0;
      for (i = 0; i <= 760; i += 4) {
        var L = epiLam(R, D0 + i);
        if (prev !== null) {
          var s = wrap180(L - prev) >= 0 ? 1 : -1;
          if (sgn !== null && s !== sgn) f++;
          sgn = s;
        }
        prev = L;
      }
      mFlip = f;
    }
    function sunFlips() {
      var prev = null, sgn = null, f = 0;
      for (var i = 0; i <= day; i += 2) {
        var L = geo("화성", D0 + i).lam;
        if (prev !== null) {
          var s = wrap180(L - prev) >= 0 ? 1 : -1;
          if (sgn !== null && s !== sgn) f++;
          sgn = s;
        }
        prev = L;
      }
      return f;
    }

    function draw() {
      var dd = D0 + day, g = geo("화성", dd), S = 47, SL = 98, Q = 0.42, i;
      ctx.clearRect(0, 0, W, H);
      K.studio(ctx, 0, 0, W, 372);
      big(ctx, "두 모형의 차이 " + mDiff.toFixed(3) + "°", "주전원 반지름 " + R.toFixed(2) + "배 · 주전원 모형의 유 " + mFlip + "회", 450, 44, mDiff < 0.01 ? "#7cf0c4" : "#ffd35a", "center", 25);

      /* 왼쪽 — 태양 중심 원반 */
      var cx = 225, cy = 236;
      var pr = disk(ctx, cx, cy, 172, { q: Q, seed: 17 });
      ["지구", "화성"].forEach(function (n) { ring(ctx, cx, cy, ORB[n].a * SL, Q, n === "지구" ? "rgba(127,211,255,.75)" : "rgba(255,170,120,.8)", 1.8); });
      var ep = pr(g.E.x * SL, g.E.y * SL), mp = pr(g.p.x * SL, g.p.y * SL);
      K.line(ctx, ep, mp, "rgba(255,255,255,.85)", 1.5, [5, 4]);
      sunBall(ctx, cx, cy - 5, 9);
      orb(ctx, ep.x, ep.y, 6, "지구"); orb(ctx, mp.x, mp.y, 6.5, "화성");
      K.pill(ctx, "태양 중심 모형", cx, 112, { s: 13, a: "center", c: KC.blue });
      lbl(ctx, "지구", ep.x, ep.y - 14, { s: 11.5, a: "center", c: KC.blue, box: [40, 420] });
      lbl(ctx, "화성", mp.x, mp.y - 14, { s: 11.5, a: "center", c: "#ffd0b8", box: [40, 420] });

      /* 오른쪽 — 지구 중심 + 주전원 원반 */
      var gx = 668, gy = 236;
      var pr2 = disk(ctx, gx, gy, 172, { q: Q, seed: 19 });
      var qq = epiPos(R, dd), cc = pr2(qq.cx * S, qq.cy * S), mq = pr2(qq.x * S, qq.y * S), er = R * S;
      ring(ctx, gx, gy, ORB["화성"].a * S, Q, "rgba(255,170,120,.6)", 1.6);
      if (er > 0.5) {
        ctx.save(); ctx.strokeStyle = "rgba(200,180,255,.95)"; ctx.setLineDash([4, 4]); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(cc.x, cc.y, er, er * Q, 0, 0, 6.2832); ctx.stroke(); ctx.restore();
      }
      K.line(ctx, { x: gx, y: gy }, cc, "rgba(200,210,255,.6)", 1.2);
      K.line(ctx, { x: gx, y: gy }, mq, "rgba(255,255,255,.85)", 1.5, [5, 4]);
      orb(ctx, gx, gy - 2, 8, "지구");
      K.glow(ctx, cc.x, cc.y, 3, "rgba(182,156,255,.95)", 3);
      orb(ctx, mq.x, mq.y, 6.5, "화성");
      K.pill(ctx, "지구 중심 모형 (주전원)", gx, 112, { s: 13, a: "center", c: KC.violet });
      lbl(ctx, "지구", gx - 14, gy + 4, { s: 11.5, a: "right", c: KC.blue, box: [480, 900] });
      lbl(ctx, "화성", mq.x, mq.y - 14, { s: 11.5, a: "center", c: "#ffd0b8", box: [480, 900] });
      lbl(ctx, "주전원", cc.x, cc.y + Math.max(er * Q, 8) + 20, { s: 11, a: "center", c: KC.violet, box: [480, 900] });
      K.warn(ctx, 14, 360, "⚠ 궤도·행성 크기는 실제 비율이 아님");

      /* 아래 — 밝은 그래프: 두 모형의 겉보기 경도 */
      var pts = [];
      for (i = 0; i <= day; i += 4) {
        var pu = geo("화성", D0 + i).lam, pw = epiLam(R, D0 + i), pv = pts[pts.length - 1];
        if (pv) { pu = pv.u + wrap180(pu - pv.u); pw = pv.w + wrap180(pw - pv.w); }   /* 360°를 넘어갈 때 끊기지 않게 이어 붙인다 */
        pts.push({ d: i, u: pu, w: pw });
      }
      K.studio(ctx, 0, 380, 612, H - 380);
      if (pts.length > 1) {
        var lo = 1e9, hi = -1e9;
        for (i = 0; i < pts.length; i++) { lo = Math.min(lo, pts[i].u, pts[i].w); hi = Math.max(hi, pts[i].u, pts[i].w); }
        var pad = Math.max(4, (hi - lo) * 0.12); lo -= pad; hi += pad;
        var gch = K.chart(ctx, { x: 6, y: 392, w: 600, h: H - 398, x0: 0, x1: Math.max(8, day), y0: lo, y1: hi, xl: "2024-08-01부터 지난 날(일)", yl: "겉보기 경도(°)", xt: 4, yt: 3, light: true, pl: 54, pt: 30, yf: function (v2) { return Math.round(norm360(v2)) + "°"; } });
        K.plot(ctx, gch, pts.map(function (p2) { return [p2.d, p2.u]; }), LT.blue, { light: true, w: 5 });
        K.plot(ctx, gch, pts.map(function (p2) { return [p2.d, p2.w]; }), LT.red, { light: true, w: 2, dash: [6, 5] });
        lgd(ctx, gch.R, gch.T - 8, [["━ 태양 중심", LT.blue], ["┅ 주전원", LT.red]]);
      } else {
        K.t(ctx, "날짜를 밀면 두 모형의 경도 곡선이 그려집니다", 306, 480, { s: 13, w: "800", a: "center", c: LT.mute });
      }

      /* 오른쪽 아래 판정 카드 */
      var RX = 622, y0 = 380, pxx = RX + 18, RR = W - 18;
      var hd = mDiff < 0.01 ? ["완전히 포개짐", LT.green] : (mFlip === 0 ? ["역행이 안 생김", LT.red] : ["어긋남 " + mDiff.toFixed(2) + "°", LT.orange]);
      vcard(ctx, RX, y0, W - RX, H - y0, "두 모형이 가리키는 방향", hd[0], hd[1], 21);
      K.row(ctx, "최대 차이", mDiff.toFixed(3) + "°", pxx, RR, y0 + 96, hd[1]);
      K.row(ctx, "주전원 반지름", R.toFixed(2) + " 배", pxx, RR, y0 + 122);
      K.row(ctx, "주전원 모형의 유", mFlip + "회", pxx, RR, y0 + 148);
      K.tip(ctx, mDiff < 0.01 ? "주전원 = 지구 궤도와 같은 크기" : "두 곡선이 포개지는 반지름을 찾으세요", pxx - 4, y0 + 160, RR - pxx + 4, mDiff < 0.01 ? true : null);
    }

    function refresh() {
      var f = sunFlips();
      $("a-epi-read").innerHTML = "두 모형의 최대 차이: <b>" + mDiff.toFixed(3) + "°</b> · 주전원 모형의 유 <b>" + mFlip + "회</b>";
      var ch = false;
      if (mDiff < 0.01 && !G.a) { G.a = ch = true; }
      if (f >= 2 && !G.b) { G.b = ch = true; }
      if (R <= 0.70 && mFlip === 0 && !G.c) { G.c = ch = true; }
      if (ch) { window.sthState("aEpi", G); mission(); }

      $("a-epi-info").innerHTML = mDiff < 0.01
        ? "<b>두 곡선이 완전히 겹쳤습니다.</b> 주전원 반지름을 <b>지구 궤도 반지름과 같게</b> 두면, ‘태양에서 화성으로 그은 화살표 + 지구에서 태양으로 그은 화살표’와 ‘지구에서 화성으로 그은 화살표’가 같은 것이 되어 두 모형이 가리키는 방향은 <b>수학적으로 똑같아집니다</b>. 그래서 프톨레마이오스도 역행을 설명할 수 있었습니다."
        : (mFlip === 0
          ? "<b>주전원이 너무 작습니다.</b> 화성이 작은 원을 도는 속도가 느려서, 지구에서 본 방향이 <b>한 번도 되돌아가지 않습니다</b> — 역행이 아예 나타나지 않습니다. 주전원은 역행을 만들어 내기 위한 장치였습니다."
          : "역행은 나타나지만 두 모형이 가리키는 방향이 최대 <b>" + mDiff.toFixed(2) + "°</b> 어긋납니다. 하늘에서 " + mDiff.toFixed(2) + "°는 보름달 지름의 " + (mDiff / 0.52).toFixed(0) + "배가 넘습니다. 반지름을 더 맞춰 보세요.");
      draw();
    }
    function mission() {
      if (G.a) done("m-a4a"); if (G.b) done("m-a4b"); if (G.c) done("m-a4c");
      if (G.a && G.b && G.c) {
        window.sthMission("m-a4", true, "<span class='m-tag'>미션 완료</span>주전원 반지름이 <b>지구 궤도 반지름과 같을 때</b> 두 모형은 차이가 0.00°로 포개집니다. 주전원은 사실 <b>지구의 공전을 다른 이름으로 부른 것</b>이었습니다. 역행 하나만으로는 두 우주관을 가를 수 없었다는 뜻입니다.");
        ep.clear(3); ep.clear(4);
      }
    }
    canvas._redraw = draw;
    $("a-epiday").addEventListener("input", function (e) { day = +e.target.value; $("a-epiday-val").textContent = day + "일"; refresh(); });
    $("a-epir").addEventListener("input", function (e) {
      R = +e.target.value; $("a-epir-val").textContent = R.toFixed(2) + " 배"; scanR(); refresh();
    });
    scanR(); refresh(); mission();
  })();

  function finish() { window.sthState("r1", "해결 · 남쪽 하늘은 왼쪽이 동쪽, 역행은 지구의 추월 — 주전원으로도 같은 하늘이 나온다"); }
  function vsA() {
    var p = window.sthState("a-p") || "";
    $("a-vs").innerHTML = "<b>나의 첫 판단</b> " + (p || "기록 없음") + "<br>" +
      (p.indexOf("㉡") === 0 ? "정확했습니다. 남쪽 하늘에서는 왼쪽이 동쪽이므로, 오른쪽으로 옮겨 간 화성은 <b>동에서 서로</b>, 곧 역행하고 있었습니다."
        : "㉡ 이 정답이었습니다. 별이 뜨는 쪽이 동쪽인데, 남쪽을 바라본 화면에서 별은 <b>왼쪽에서 떠서 오른쪽으로</b> 집니다. 그래서 천구에서는 왼쪽이 동쪽입니다.");
  }
  vsA();
  ep.onShow(vsA);
  window.sthWork({
    mount: "wkA", unitLabel: "[지구과학 Ⅲ-1] 이야기 ① 거꾸로 가는 별",
    items: [
      { id: "w1", label: "역행하는 동안 화성의 공전 방향", hint: "궤도면의 계수기와 하늘의 계수기가 어떻게 달랐는지를 근거로 쓰세요.",
        ph: "화성이 역행하는 동안 화성의 공전 방향은 (          )였다. 그런데 하늘에서 되돌아간 것처럼 보인 까닭은 (          ) 때문이다." },
      { id: "w2", label: "별자리에 대해 동에서 서로 움직인 행성", hint: "장면 3에서 화성·금성·목성의 날짜를 밀어 보고, 배경별에 대해 <b>동에서 서로</b> 이동한(역행한) 날짜를 하나 찾아 쓰세요. 그때 그 행성의 이각이 얼마였는지도 함께 적으면 좋습니다.",
        ph: "행성 이름 / 날짜 / 그때의 이각 / 그렇게 판단한 근거" }
    ]
  });
})();

/* =========================================================================
   이야기 ② 해 지고 나서 한 시간
   ========================================================================= */
(function () {
  var ep = window.sthStory({ root: "epB", key: "epB", name: "사건 파일 ②", onDone: finish });
  var BASE = daysOf(Date.UTC(2024, 9, 15));

  window.sthGate({
    gate: "b-gate", key: "b-p", title: "금성 모둠의 첫 예상",
    question: "한밤중 자정에 남쪽 하늘에서 <b>금성</b>을 볼 수 있을까요?",
    options: [
      "㉠ 볼 수 있다 — 금성은 아주 밝아서 하늘 어디에 있든 보인다",
      "㉡ 볼 수 없다 — 금성은 태양에서 최대 약 46°까지밖에 떨어져 보이지 않는다",
      "㉢ 볼 수 없다 — 금성은 지구보다 작아서 반사하는 빛이 모자라기 때문이다"
    ],
    onPick: function (i) { window.sthState("bPredOK", i === 1 ? "맞음" : "어긋남"); ep.clear(0); }
  });

  /* 밝은 쪽이 보이는 위상 원반 */
  function phaseDisc(ctx, cx, cy, r, k, el) {
    ctx.save();
    var hl = ctx.createRadialGradient(cx, cy, r * .6, cx, cy, r * 1.7); hl.addColorStop(0, "rgba(255,226,160,.28)"); hl.addColorStop(1, "rgba(255,226,160,0)");
    ctx.fillStyle = hl; ctx.beginPath(); ctx.arc(cx, cy, r * 1.7, 0, 6.2832); ctx.fill();
    ctx.fillStyle = "#262a3e";
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.2832); ctx.fill();
    ctx.fillStyle = "#ffe2a0";
    ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI / 2, Math.PI / 2, el < 0); ctx.closePath(); ctx.fill();
    var lit = 2 * k - 1;
    ctx.beginPath(); ctx.ellipse(cx, cy, Math.abs(lit) * r, r, 0, 0, 6.2832);
    ctx.fillStyle = (lit >= 0) ? "#ffe2a0" : "#262a3e"; ctx.fill();
    ctx.strokeStyle = "rgba(120,130,160,.75)"; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.2832); ctx.stroke();
    ctx.restore();
  }

  /* ---- 장면2 : 최대 이각 ---- */
  (function () {
    var canvas = $("b-c-elong"), ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var a = 0.55;
    var G = window.sthState("bElong") || { a: false, b: false, c: false };

    function maxE(aa) { return aa < 1 ? Math.asin(aa) * R2D : 180; }

    /* 원반 위 부채꼴(원반 좌표, 각은 라디안) */
    function fan(pr, x, y, r, a0, a1, fill, stroke) {
      ctx.beginPath(); var c = pr(x, y); ctx.moveTo(c.x, c.y);
      for (var k = 0; k <= 24; k++) { var an = a0 + (a1 - a0) * k / 24, p = pr(x + r * Math.cos(an), y + r * Math.sin(an)); ctx.lineTo(p.x, p.y); }
      ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1.6; ctx.stroke(); }
    }
    function draw() {
      var inner = a < 1, e = maxE(a), LW = 612;
      ctx.clearRect(0, 0, W, H);
      K.studio(ctx, 0, 0, LW, H);
      var cx = 300, cy = 262, Q = 0.45, S = 240 / Math.max(1.18, a * 1.1);
      var pr = disk(ctx, cx, cy, 270, { q: Q, seed: 23 });
      ring(ctx, cx, cy, S, Q, "rgba(127,211,255,.8)", 1.8);
      ring(ctx, cx, cy, a * S, Q, "rgba(200,180,255,.95)", 2.2);
      var ep = pr(S, 0);
      if (inner) {
        var tx = a * a, ty = a * Math.sqrt(Math.max(0, 1 - a * a));
        fan(pr, S, 0, 70, Math.PI, Math.PI + e * D2R, "rgba(255,211,107,.35)", "#ffd35a");
        [1, -1].forEach(function (sg) {
          var tp = pr(tx * S, sg * ty * S), far = pr((tx + (tx - 1) * .25) * S, sg * ty * 1.25 * S);
          K.line(ctx, ep, far, sg < 0 ? "#ffd35a" : "rgba(255,211,107,.6)", sg < 0 ? 2.4 : 1.6);
          orb(ctx, tp.x, tp.y, 7, "금성");
          lbl(ctx, sg < 0 ? "동방 최대 이각" : "서방 최대 이각", tp.x - 14, tp.y + (sg < 0 ? 26 : -14), { s: 11.5, a: "right", c: "#d9ccff", box: [10, LW] });
        });
        var mid = pr(S + 112 * Math.cos(Math.PI + e * D2R / 2), 112 * Math.sin(Math.PI + e * D2R / 2));
        K.pill(ctx, e.toFixed(1) + "°", mid.x, mid.y + 6, { s: 14, a: "center", c: "#ffd35a", box: [10, LW] });
      } else {
        var op = pr(a * S, 0), back = pr((a + 0.15) * S, 0);
        K.line(ctx, ep, back, "#ffd35a", 2.2);
        orb(ctx, op.x, op.y, 7, "화성");
        lbl(ctx, "충 (이각 180°)", op.x, op.y - 16, { s: 11.5, a: "center", c: "#ffd0b8", box: [10, LW] });
      }
      K.line(ctx, ep, { x: cx, y: cy }, "rgba(255,255,255,.75)", 1.4, [5, 4]);
      sunBall(ctx, cx, cy - 6, 12);
      orb(ctx, ep.x, ep.y, 8, "지구");
      lbl(ctx, "태양", cx, cy + 32, { s: 11.5, a: "center", c: KC.yellow });
      lbl(ctx, "지구", ep.x + 14, ep.y + 5, { s: 12, c: KC.blue, box: [10, LW] });
      big(ctx, inner ? "최대 이각 " + e.toFixed(1) + "°" : "최대 이각 없음",
        inner ? "궤도 반지름 " + a.toFixed(2) + " AU · 해 진 뒤 " + (e / 15).toFixed(1) + "시간이면 진다" : "충 부근이면 한밤중에 남중한다", 18, 48);
      K.warn(ctx, 14, H - 14, "⚠ 궤도를 원으로 어림 · 크기는 실제 비율이 아님");

      /* 오른쪽 계산 카드 */
      var RX = 622, px2 = RX + 18, RR = W - 18;
      vcard(ctx, RX, 0, W - RX, H, "계산 · 시선이 궤도에 접할 때", inner ? "내행성" : "외행성", inner ? LT.violet : LT.orange);
      K.row(ctx, "행성 궤도 반지름", a.toFixed(2) + " AU", px2, RR, 100);
      K.row(ctx, "지구 궤도 반지름", "1.00 AU", px2, RR, 126);
      K.t(ctx, inner ? "sin⁻¹(" + a.toFixed(2) + ") = " + e.toFixed(1) + "°" : "180° (한계 없음)", px2, 166, { s: 20, w: "900", c: LT.teal });
      K.tip(ctx, inner ? "해가 지고 " + (e / 15).toFixed(1) + "시간이면 이 행성도 진다" : "지구가 안쪽 — 이각에 한계가 없다", px2 - 4, 182, RR - px2 + 4, inner ? null : true);
      var REF = [["수성", 0.39], ["금성", 0.72], ["지구", 1.00], ["화성", 1.52]], ry = 246;
      K.t(ctx, "행성별 최대 이각", px2, ry - 10, { s: 11.5, w: "800", c: LT.mute });
      REF.forEach(function (r) {
        var on = Math.abs(a - r[1]) < 0.02;
        if (on) { ctx.fillStyle = "#e7f7f0"; ctx.beginPath(); ctx.roundRect(px2 - 6, ry + 4, RR - px2 + 12, 26, 8); ctx.fill(); }
        K.row(ctx, r[0] + " " + r[1].toFixed(2) + " AU", r[1] < 1 ? (Math.asin(r[1]) * R2D).toFixed(0) + "°" : "없음", px2, RR, ry + 22, on ? LT.green : LT.ink);
        ry += 30;
      });
      K.t(ctx, "궤도를 완전한 원으로 어림한 값", px2, H - 20, { s: 11, c: LT.mute });

      var ch = false;
      if (Math.abs(a - 0.39) < 0.005 && !G.a) { G.a = ch = true; }
      if (Math.abs(a - 0.72) < 0.005 && !G.b) { G.b = ch = true; }
      if (a > 1.0001 && !G.c) { G.c = ch = true; }
      if (ch) { window.sthState("bElong", G); mission(); }

      $("b-elong-read").innerHTML = "최대 이각: <b>" + (inner ? e.toFixed(1) + "°" : "180° (한계 없음)") + "</b>";
      $("b-elong-info").innerHTML = inner
        ? "궤도 반지름이 <b>" + a.toFixed(2) + " AU</b> 인 내행성은 태양에서 최대 <b>" + e.toFixed(1) + "°</b> 까지만 떨어져 보입니다. "
          + "하늘에서 태양이 1시간에 15°씩 움직이니, 이 행성은 해가 진 뒤 <b>" + (e / 15).toFixed(1) + "시간</b> 안에 따라서 집니다. "
          + "그래서 내행성은 <b>초저녁 서쪽 하늘</b>이나 <b>새벽 동쪽 하늘</b>에서만 보입니다."
        : "궤도 반지름이 <b>1 AU보다 큰</b> 외행성에는 최대 이각이 없습니다. 지구가 행성과 태양 사이에 들어가면 이각이 <b>180°(충)</b>까지 커지므로, "
          + "해 질 때 떠서 <b>자정에 남중</b>하고 해 뜰 때 집니다. 한밤중에도 볼 수 있다는 뜻입니다.";
    }
    function mission() {
      if (G.a) done("m-b2a"); if (G.b) done("m-b2b"); if (G.c) done("m-b2c");
      if (G.a && G.b && G.c) {
        window.sthMission("m-b2", true, "<span class='m-tag'>미션 완료</span>내행성의 최대 이각은 <b>sin⁻¹(행성 궤도 반지름 ÷ 지구 궤도 반지름)</b>입니다 — 수성은 약 <b>23°</b>, 금성은 약 <b>46°</b>. 외행성은 지구가 안쪽에 있으므로 이각에 한계가 없습니다.");
        ep.clear(1);
      }
    }
    canvas._redraw = draw;
    $("b-a").addEventListener("input", function (e2) {
      a = +e2.target.value; $("b-a-val").textContent = a.toFixed(2) + " AU"; draw();
    });
    draw(); mission();
  })();

  /* ---- 장면3 : 이각과 관측 조건 ---- */
  (function () {
    var canvas = $("b-c-obs"), ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var planet = "금성", day = 0;
    var tbody = $("b-tbody");
    var G = window.sthState("bObs") || { a: false, b: false, c: false, rows: 0 };
    var BOOK = [
      { p: "금성", y: 2024, m: 10, d: 15 }, { p: "금성", y: 2025, m: 1, d: 15 }, { p: "금성", y: 2025, m: 4, d: 15 },
      { p: "화성", y: 2024, m: 10, d: 15 }, { p: "화성", y: 2025, m: 1, d: 15 }, { p: "화성", y: 2025, m: 4, d: 15 }
    ];
    var extra = [];

    function miniPhase(k, el, size) {
      var c = document.createElement("canvas");
      c.width = size * 2; c.height = size * 2;
      c.style.width = size + "px"; c.style.height = size + "px";
      var g = c.getContext("2d"); g.scale(2, 2); c._dprSet = true;   /* 표 안 작은 그림: 2배 해상도로 직접 그림 */
      phaseDisc(g, size / 2, size / 2, size / 2 - 2, k, el);
      return c;
    }
    function rowEl(p, ms, mine) {
      var g = geo(p, daysOf(ms)), el = g.elong;
      var rs = riseSet(el);
      var marks = [19, 24, 5].map(function (h) { return oxMark(el, h); });
      var cls = { "O": "o", "X": "x", "△": "t" };
      var tr = document.createElement("tr");
      if (mine) tr.className = "mine";
      tr.innerHTML = "<td>" + p + "</td><td class='num'>" + dateStr(ms) + "</td><td>"
        + (el >= 0 ? "동쪽" : "서쪽") + "</td><td class='num'>" + Math.abs(el).toFixed(1) + "</td>"
        + marks.map(function (m) { return "<td class='ox " + cls[m] + "'>" + m + "</td>"; }).join("")
        + "<td class='phase-cell'></td>";
      tr.lastChild.appendChild(miniPhase(g.k, el, 30));
      tr.lastChild.insertAdjacentHTML("beforeend",
        "<div style='font-size:10.5px;color:var(--mist);margin-top:2px'>" + Math.round(g.k * 100) + "%</div>");
      tr.title = "뜨는 시각 " + hhmm(rs.rise) + " · 남중 " + hhmm(rs.transit) + " · 지는 시각 " + hhmm(rs.set);
      return tr;
    }
    function fillTable() {
      tbody.innerHTML = "";
      BOOK.forEach(function (b) { tbody.appendChild(rowEl(b.p, Date.UTC(b.y, b.m - 1, b.d), false)); });
      extra.forEach(function (e) { tbody.appendChild(rowEl(e.p, e.ms, true)); });
    }

    function draw() {
      var dd = BASE + day, g = geo(planet, dd), a = ORB[planet].a, LW = 562, i;
      ctx.clearRect(0, 0, W, H);
      K.studio(ctx, 0, 0, LW, H);
      var cx = 285, cy = 296, Q = 0.42, S = 228 / Math.max(1.25, a * 1.1);
      var pr = disk(ctx, cx, cy, 262, { q: Q, seed: 29 });
      ["지구", planet].forEach(function (n) { ring(ctx, cx, cy, ORB[n].a * S, Q, n === "지구" ? "rgba(127,211,255,.8)" : "rgba(255,190,140,.85)", 1.8); });
      var E = g.E, P = g.p, ep = pr(E.x * S, E.y * S), pp = pr(P.x * S, P.y * S);
      var aS = Math.atan2(-E.y, -E.x), aP = Math.atan2(P.y - E.y, P.x - E.x);
      var sweep = ((aP - aS + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      ctx.beginPath(); ctx.moveTo(ep.x, ep.y);
      for (i = 0; i <= 30; i++) { var an = aS + sweep * i / 30, fp = pr(E.x * S + 58 * Math.cos(an), E.y * S + 58 * Math.sin(an)); ctx.lineTo(fp.x, fp.y); }
      ctx.closePath(); ctx.fillStyle = "rgba(255,211,107,.35)"; ctx.fill(); ctx.strokeStyle = "#ffd35a"; ctx.lineWidth = 1.6; ctx.stroke();
      K.line(ctx, ep, pp, "rgba(255,255,255,.85)", 1.5, [5, 4]);
      K.line(ctx, ep, { x: cx, y: cy }, "rgba(255,255,255,.85)", 1.5, [5, 4]);
      sunBall(ctx, cx, cy - 6, 12);
      orb(ctx, ep.x, ep.y, 8, "지구");
      orb(ctx, pp.x, pp.y, ORB[planet].rad + 3, planet);
      var aMid = aS + sweep / 2, lp = pr(E.x * S + 100 * Math.cos(aMid), E.y * S + 100 * Math.sin(aMid));
      lbl(ctx, "이각 " + Math.abs(g.elong).toFixed(0) + "°", lp.x, lp.y + 4, { s: 13, a: "center", c: KC.yellow, box: [10, LW] });
      lbl(ctx, "태양", cx, cy + 32, { s: 12, a: "center", c: KC.yellow });
      lbl(ctx, "지구", ep.x, ep.y - 16, { s: 12, a: "center", c: KC.blue, box: [10, LW] });
      lbl(ctx, planet, pp.x, pp.y - 16, { s: 12, a: "center", c: "#ffe2c8", box: [10, LW] });
      var el = g.elong, where = Math.abs(el) >= 150 ? "충 부근 — 밤새 보인다" : (Math.abs(el) <= 10 ? "합 부근 — 햇빛에 묻힌다" : (el >= 0 ? "초저녁 서쪽 하늘" : "새벽 동쪽 하늘"));
      big(ctx, (el >= 0 ? "동방 이각 " : "서방 이각 ") + Math.abs(el).toFixed(0) + "°", where, 18, 88);
      K.t(ctx, "표에 모아 둔 줄 " + extra.length + " / 6", 18, H - 16, { s: 13, w: "900", c: extra.length >= 3 ? LT.green : LT.mute });

      /* 오른쪽 카드: 시각별 지평선 위 여유 */
      var RX = 572, px = RX + 18, RR = W - 18, by = 96;
      vcard(ctx, RX, 0, W - RX, H, "하루 동안 지평선 위에 있는 시간", where, Math.abs(el) <= 10 ? LT.red : LT.green, 18);
      var hours = ["18시", "21시", "24시", "03시", "06시"], hv = [18, 21, 24, 27, 30], tw = RR - px - 120;
      for (i = 0; i < hv.length; i++) {
        var yy = by + i * 30, m = marginH(el, hv[i] % 24);
        K.t(ctx, hours[i], px, yy + 5, { s: 12, w: "800", c: LT.mute });
        ctx.fillStyle = "#e3e9f1"; ctx.beginPath(); ctx.roundRect(px + 40, yy - 7, tw, 14, 7); ctx.fill();
        ctx.fillStyle = m >= 0.5 ? LT.green : (m > 0 ? LT.yellow : "#f08c9a");
        ctx.beginPath(); ctx.roundRect(px + 40, yy - 7, Math.max(6, clamp(m, 0, 6) / 6 * tw), 14, 7); ctx.fill();
        K.t(ctx, m > 0 ? "여유 " + m.toFixed(1) + "h" : "지평선 아래", RR, yy + 5, { s: 11.5, w: "800", a: "right", c: m > 0 ? LT.ink : LT.red });
      }
      var rs = riseSet(el);
      K.row(ctx, "뜨는 시각", hhmm(rs.rise), px, RR, 270);
      K.row(ctx, "남중", hhmm(rs.transit), px, RR, 296);
      K.row(ctx, "지는 시각", hhmm(rs.set), px, RR, 322);
      K.row(ctx, "지구까지 거리", g.dist.toFixed(2) + " AU", px, RR, 348);
      ctx.fillStyle = "#151a33"; ctx.beginPath(); ctx.roundRect(px - 4, 366, RR - px + 4, 80, 12); ctx.fill();
      phaseDisc(ctx, px + 38, 406, 24, g.k, el);
      K.t(ctx, "망원경으로 본 모양", px + 80, 398, { s: 11.5, w: "800", c: "#c7cfe6" });
      K.t(ctx, "밝게 보이는 비율 " + Math.round(g.k * 100) + "%", px + 80, 422, { s: 15, w: "900", c: "#ffe2a0" });
    }

    function refresh() {
      var dd = BASE + day, g = geo(planet, dd), ms = J2000 + dd * 86400000, el = g.elong;
      $("b-day-val").textContent = dateStr(ms);
      $("b-badge").textContent = planet + " · " + dateStr(ms);
      $("b-dot").style.background = withA(v(ORB[planet].c), 1);
      $("b-obs-read").innerHTML = "이각 <b>" + (el >= 0 ? "동방" : "서방") + " " + Math.abs(el).toFixed(1) + "°</b> · 밝게 보이는 비율 <b>"
        + Math.round(g.k * 100) + "%</b> · 지구까지 <b>" + g.dist.toFixed(2) + " AU</b>";

      var ch = false;
      if (planet === "금성" && el >= 44 && !G.a) { G.a = ch = true; }
      if (planet === "금성" && el <= -44 && !G.b) { G.b = ch = true; }
      if ((planet === "화성" || planet === "목성") && Math.abs(el) >= 150 && !G.c) { G.c = ch = true; }
      if (ch) { window.sthState("bObs", G); mission(); }

      $("b-obs-info").innerHTML =
        (el >= 0
          ? "이각이 <b>동방</b>이므로 행성이 태양보다 <b>늦게</b> 집니다. 해가 진 뒤 <b>서쪽 하늘</b>에서 찾으세요."
          : "이각이 <b>서방</b>이므로 행성이 태양보다 <b>먼저</b> 뜹니다. 해 뜨기 전 <b>동쪽 하늘</b>에서 찾으세요.")
        + (Math.abs(el) >= 150 ? " 지금은 <b>충</b> 부근입니다 — 해 질 때 떠서 자정에 남중하므로 밤새 볼 수 있습니다."
          : (Math.abs(el) <= 10 ? " 지금은 <b>합</b> 부근이라 태양과 거의 같은 방향입니다 — 햇빛에 묻혀 볼 수 없습니다." : ""))
        + " 표의 ‘관측 가능 시각’은 이각에서 계산한 것이고, <b>관측되는 모양</b>은 밝게 보이는 비율입니다.";
      draw();
    }
    function mission() {
      if (G.a) done("m-b3a"); if (G.b) done("m-b3b"); if (G.c) done("m-b3c");
      var rows = Math.max(extra.length, G.rows || 0);
      if (rows >= 3) done("m-b3d");
      if (G.a && G.b && G.c && rows >= 3) {
        window.sthMission("m-b3", true, "<span class='m-tag'>미션 완료</span>금성은 최대 이각 부근에서도 초저녁이나 새벽에만 보이고, 한밤중 칸은 언제나 <b>X</b>입니다. 반대로 외행성은 <b>충</b>(이각 180°) 부근에서 밤새 볼 수 있습니다. 개밥바라기(동방 이각)와 샛별(서방 이각)은 <b>같은 금성</b>이었습니다.");
        ep.clear(2);
      }
    }
    canvas._redraw = draw;
    $("b-day").addEventListener("input", function (e) { day = +e.target.value; refresh(); });
    segWire("b-planet", function (b) { planet = b.getAttribute("data-p"); refresh(); });
    $("b-add").addEventListener("click", function () {
      extra.push({ p: planet, ms: J2000 + (BASE + day) * 86400000 });
      if (extra.length > 6) extra.shift();
      fillTable();
      if (extra.length > (G.rows || 0)) { G.rows = extra.length; window.sthState("bObs", G); }
      mission(); draw();
    });
    fillTable(); refresh(); mission();
  })();

  /* ---- 장면4 : 금성의 위상과 크기 ---- */
  var Dc = 0.5, Rc = 0.36;              /* 프톨레마이오스 주전원 — 중심까지 0.5, 반지름 0.36 (= 0.72배) */
  function ptolemy(el) {
    var e = Math.abs(el) * D2R;
    var disc = Rc * Rc - Dc * Dc * Math.sin(e) * Math.sin(e);
    if (disc < 0) disc = 0;
    var rho = Dc * Math.cos(e) + Math.sqrt(disc);
    if (rho < 0.05) rho = 0.05;
    var vx = rho * Math.cos(e), vy = rho * Math.sin(e);
    var ax = 1 - vx, ay = -vy, bx = -vx, by = -vy;
    var c = (ax * bx + ay * by) / (Math.hypot(ax, ay) * Math.hypot(bx, by) || 1);
    return { k: (1 + clamp(c, -1, 1)) / 2, rho: rho };
  }
  var CURVE = (function () {
    var A = [];
    for (var i = 0; i <= 900; i += 5) {
      var g = geo("금성", BASE + i), p = ptolemy(g.elong);
      A.push({ d: i, k: g.k, pk: p.k });
    }
    return A;
  })();

  (function () {
    var canvas = $("b-c-phase"), ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var day = 0;
    var G = window.sthState("bPhase") || { a: false, b: false, c: false, q: false };

    function discR(arcsec) { return clamp(11 + (arcsec - 9.7) / 51.4 * 38, 8, 52); }

    function draw() {
      var g = geo("금성", BASE + day), p = ptolemy(g.elong);
      var dia = 16.68 / g.dist, pdia = 16.68 / p.rho, i;
      ctx.clearRect(0, 0, W, H);
      K.studio(ctx, 0, 0, W, 290);

      /* 왼쪽·오른쪽 — 망원경 시야 두 개 */
      deck(ctx, 14, 12, 270, 268, 31, "태양 중심 모형의 예측");
      phaseDisc(ctx, 149, 140, discR(dia), g.k, g.elong);
      K.t(ctx, "밝은 비율 " + Math.round(g.k * 100) + "%", 149, 222, { s: 16, w: "900", a: "center", c: "#ffffff" });
      K.t(ctx, "시직경 " + dia.toFixed(1) + "″ · 금성까지 " + g.dist.toFixed(2) + " AU", 149, 246, { s: 11.5, a: "center", c: "#c7cfe6" });
      deck(ctx, 616, 12, 270, 268, 33, "지구 중심(주전원) 모형의 예측");
      phaseDisc(ctx, 751, 140, discR(pdia), p.k, g.elong);
      K.t(ctx, "밝은 비율 " + Math.round(p.k * 100) + "%", 751, 222, { s: 16, w: "900", a: "center", c: "#ffffff" });
      K.t(ctx, "시직경 " + pdia.toFixed(1) + "″ · 늘 지구와 태양 사이", 751, 246, { s: 11.5, a: "center", c: "#c7cfe6" });

      /* 가운데 — 실제 배치 원반 모형 */
      var cx = 450, cy = 182, Q = 0.45, S = 100;
      var pr = disk(ctx, cx, cy, 136, { q: Q, th: 10, seed: 31 });
      ring(ctx, cx, cy, S, Q, "rgba(127,211,255,.8)", 1.6);
      ring(ctx, cx, cy, 0.723 * S, Q, "rgba(255,224,163,.85)", 1.6);
      var eA = Math.atan2(g.E.y, g.E.x), vA = Math.atan2(g.p.y, g.p.x);
      var ep = pr(Math.cos(eA) * S, Math.sin(eA) * S), vp = pr(Math.cos(vA) * 0.723 * S, Math.sin(vA) * 0.723 * S);
      K.line(ctx, ep, vp, "rgba(255,255,255,.85)", 1.4, [4, 4]);
      sunBall(ctx, cx, cy - 5, 9);
      orb(ctx, ep.x, ep.y, 6.5, "지구"); orb(ctx, vp.x, vp.y, 6, "금성");
      lbl(ctx, "지구", ep.x, ep.y - 13, { s: 11, a: "center", c: KC.blue, box: [300, 600] });
      lbl(ctx, "금성", vp.x, vp.y - 13, { s: 11, a: "center", c: "#ffe2a0", box: [300, 600] });
      K.bigText(ctx, dateStr(J2000 + (BASE + day) * 86400000), cx, 52, 24, "#ffffff", "center");
      K.bigText(ctx, "이각 " + (g.elong >= 0 ? "동방 " : "서방 ") + Math.abs(g.elong).toFixed(0) + "°", cx, 82, 16, "#ffd35a", "center");
      K.t(ctx, "실제 배치 (위에서 비스듬히 본 궤도면)", cx, 276, { s: 11, w: "800", a: "center", c: LT.mute });

      /* 아래 — 밝은 그래프 */
      K.studio(ctx, 0, 298, 612, H - 298);
      var gc = K.chart(ctx, { x: 6, y: 306, w: 600, h: H - 310, x0: 0, x1: 900, y0: 0, y1: 1, xt: 3, yt: 2, light: true, pl: 52, pr: 34, pt: 30,
        yf: function (v2) { return Math.round(v2 * 100) + "%"; }, xf: function (d) { return dateStr(J2000 + (BASE + d) * 86400000).slice(0, 7); }, yl: "밝게 보이는 비율" });
      K.plot(ctx, gc, CURVE.map(function (c) { return [c.d, c.k]; }), LT.blue, { light: true, w: 3 });
      K.plot(ctx, gc, CURVE.map(function (c) { return [c.d, c.pk]; }), LT.violet, { light: true, w: 2.4, dash: [6, 4] });
      K.line(ctx, { x: gc.X(day), y: gc.T }, { x: gc.X(day), y: gc.B }, LT.ink, 1.6);
      [[g.k, LT.blue], [p.k, LT.violet]].forEach(function (d2) { ctx.fillStyle = d2[1]; ctx.beginPath(); ctx.arc(gc.X(day), gc.Y(d2[0]), 5, 0, 6.2832); ctx.fill(); });
      lgd(ctx, gc.R, gc.T - 8, [["━ 태양 중심", LT.blue], ["┅ 주전원 (35%를 넘지 못함)", LT.violet]]);

      /* 오른쪽 아래 판정 카드 */
      var RX = 622, y0 = 298, px = RX + 18, RR = W - 18;
      var hd = g.k >= 0.90 ? ["보름에 가까운 금성", LT.green] : (dia >= 55 ? ["가장 크고 가늘다", LT.orange] : ["날짜를 밀어 보세요", LT.dim]);
      vcard(ctx, RX, y0, W - RX, H - y0, "갈릴레이의 금성", hd[0], hd[1], 19);
      K.row(ctx, "태양 중심 예측", Math.round(g.k * 100) + "% · " + dia.toFixed(1) + "″", px, RR, y0 + 92);
      K.row(ctx, "주전원 예측", Math.round(p.k * 100) + "% · " + pdia.toFixed(1) + "″", px, RR, y0 + 118, LT.violet);
      var gap = g.k - p.k;
      K.tip(ctx, gap >= 0.6 ? "주전원으로는 만들 수 없는 모양" : "두 예측의 밝은 비율 차이 " + Math.round(gap * 100) + "%p", px - 4, y0 + 134, RR - px + 4, gap >= 0.6 ? true : null);

      var ch = false;
      if (g.k >= 0.90 && !G.a) { G.a = ch = true; }
      if (dia >= 55 && !G.b) { G.b = ch = true; }
      if (g.k - p.k >= 0.60 && !G.c) { G.c = ch = true; }
      if (ch) { window.sthState("bPhase", G); mission(); }

      $("b-phase-read").innerHTML = "밝은 비율 <b>" + Math.round(g.k * 100) + "%</b> (주전원 모형은 " + Math.round(p.k * 100)
        + "%) · 시직경 <b>" + dia.toFixed(1) + "″</b>";
      $("b-phase-info").innerHTML =
        (g.k >= 0.90
          ? "<b>거의 보름 금성입니다.</b> 그런데 시직경은 <b>" + dia.toFixed(1) + "″</b>로 아주 작습니다 — 금성이 <b>태양 뒤편(외합)</b>으로 돌아갔다는 뜻입니다. 주전원 모형은 금성을 늘 지구와 태양 사이에 두므로 이 모양을 <b>절대로</b> 만들 수 없습니다."
          : (dia >= 55
            ? "<b>가장 크게 보이는 때입니다.</b> 시직경이 " + dia.toFixed(1) + "″ 나 되는데 밝은 비율은 " + Math.round(g.k * 100) + "% 뿐입니다. 금성이 <b>내합</b> 쪽, 곧 지구에 가장 가까운 자리에 와 있습니다. 가까울수록 가늘어진다 — 이것이 금성이 태양을 돈다는 증거입니다."
            : "날짜를 밀면서 두 원반을 견주어 보세요. 태양 중심 모형은 밝은 비율이 <b>0 %에서 100 %까지</b> 바뀌고 크기도 <b>6배</b> 넘게 달라집니다. 주전원 모형은 밝은 비율이 <b>35 %를 넘지 못하고</b> 크기도 2배 남짓밖에 변하지 않습니다."));
    }
    function mission() {
      if (G.a) done("m-b4a"); if (G.b) done("m-b4b"); if (G.c) done("m-b4c"); if (G.q) done("m-b4d");
      if (G.a && G.b && G.c && G.q) {
        window.sthMission("m-b4", true, "<span class='m-tag'>미션 완료</span>금성은 <b>가늘수록 크게, 둥글수록 작게</b> 보입니다. 가늘 때는 지구와 태양 사이(가까움), 둥글 때는 태양 너머(멂)에 있다는 뜻입니다. 금성이 늘 지구와 태양 사이에 있어야 하는 주전원 모형으로는 <b>보름에 가까운 금성</b>을 설명할 수 없습니다.");
        ep.clear(3); ep.clear(4);
      }
    }
    canvas._redraw = draw;
    $("b-pday").addEventListener("input", function (e) {
      day = +e.target.value; $("b-pday-val").textContent = dateStr(J2000 + (BASE + day) * 86400000); draw();
    });
    draw(); mission();

    window.sthPick({
      mount: "b-q1",
      q: "갈릴레이의 금성 관측이 <b>지구 중심 모형을 무너뜨린</b> 까닭으로 가장 알맞은 것은?",
      options: [
        "㉠ 금성이 역행하는 것을 보았기 때문이다",
        "㉡ 금성이 보름에 가까운 모양까지 보여 주었고, 그때 가장 작게 보였기 때문이다",
        "㉢ 금성이 태양에서 최대 46°밖에 떨어지지 않는다는 것을 알아냈기 때문이다"
      ],
      answer: 1,
      why: [
        "역행은 주전원으로도 설명됩니다. 앞 이야기에서 두 모형의 차이가 0.00° 였던 것을 떠올려 보세요. 역행만으로는 두 모형을 가를 수 없습니다.",
        "그렇습니다. 지구 중심 모형에서 금성은 늘 지구와 태양 사이에 있어야 하므로 밝은 면이 우리 쪽을 향할 수 없습니다. 보름에 가까운 금성은 금성이 <b>태양 뒤편까지 돌아간다</b>는 뜻이고, 그때 가장 멀어 가장 작게 보였다는 것이 결정적이었습니다.",
        "최대 이각은 두 모형 모두 설명할 수 있습니다. 프톨레마이오스는 주전원의 크기를 궤도 반지름의 0.72배로 두어 46°를 그대로 맞췄습니다."
      ],
      onDone: function () { G.q = true; window.sthState("bPhase", G); mission(); }
    });
  })();

  function finish() { window.sthState("r2", "해결 · 금성의 최대 이각은 약 46°, 보름에 가까운 금성이 주전원 모형을 무너뜨렸다"); }
  function vsB() {
    var p = window.sthState("b-p") || "";
    $("b-vs").innerHTML = "<b>나의 첫 예상</b> " + (p || "기록 없음") + "<br>" +
      (p.indexOf("㉡") === 0 ? "정확했습니다. 금성은 태양에서 최대 46°까지밖에 못 떨어지므로, 해가 진 뒤 세 시간 안에 금성도 집니다."
        : "㉡ 이 정답이었습니다. 밝기는 관계가 없습니다. 금성이 지구보다 <b>안쪽 궤도</b>를 돌기 때문에 이각에 한계가 생기는 것입니다.");
  }
  vsB();
  ep.onShow(vsB);
  window.sthWork({
    mount: "wkB", unitLabel: "[지구과학 Ⅲ-1] 이야기 ② 해 지고 나서 한 시간",
    items: [
      { id: "w3", label: "표에서 고른 한 줄", hint: "어느 행성, 어느 날짜를 골랐는지 쓰고 — 그 행성이 그 시각에 보이는(또는 보이지 않는) 까닭을 <b>이각</b>으로 설명하세요.", ph: "" },
      { id: "b2", label: "금성 모둠에게 보내는 답장", hint: "금성을 한밤중에 볼 수 없는 까닭과, 화성은 볼 수 있었던 까닭을 내행성·외행성의 차이로 나누어 쓰세요." }
    ]
  });
})();

/* =========================================================================
   이야기 ③ 그림자가 지나간 자리
   ========================================================================= */
(function () {
  var ep = window.sthStory({ root: "epC", key: "epC", name: "사건 파일 ③", onDone: finish });

  var INC = 5.145;                     /* 백도면의 기울기(°) */
  var SYN = 29.530589;                 /* 삭망월(일) */
  var DRA = 27.212221;                 /* 교점월(일) */
  var SEASON = 173.31;                 /* 식의 계절이 돌아오는 간격(일) */
  var T0 = Date.UTC(2024, 3, 8, 18, 20, 0);   /* 2024-04-08 개기일식의 삭 */
  var SOL_LIMIT = 1.4, SOL_CENTRAL = 0.5;     /* 일식 한계 황위 / 중심식 한계 */
  var LUN_LIMIT = 1.0, LUN_TOTAL = 0.4;       /* 월식 한계 황위 / 개기월식 한계 */
  var Rm = 1737.4, Rs = 696000, Re = 6378;    /* 달·태양·지구 반지름(km) */

  function betaOf(lam, inc) { return Math.asin(Math.sin(inc * D2R) * Math.sin(lam * D2R)) * R2D; }
  function dayStr(t) {
    var d = new Date(T0 + t * 86400000);
    return d.getUTCFullYear() + "-" + ("0" + (d.getUTCMonth() + 1)).slice(-2) + "-" + ("0" + d.getUTCDate()).slice(-2);
  }

  window.sthGate({
    gate: "c-gate", key: "c-p", title: "동아리 2학년의 첫 예상",
    question: "삭은 한 달에 한 번 옵니다. 그런데 <b>일식은 왜 매달 일어나지 않을까요?</b>",
    options: [
      "㉠ 달이 때때로 너무 작아 보여서 태양을 가리지 못하기 때문이다",
      "㉡ 달의 공전 궤도면이 황도면에 약 5° 기울어져 있어, 삭이라도 달이 태양의 위나 아래를 지나가기 때문이다",
      "㉢ 삭일 때는 달이 지구의 그림자 속에 들어가 있기 때문이다"
    ],
    onPick: function (i) { window.sthState("cPredOK", i === 1 ? "맞음" : "어긋남"); ep.clear(0); }
  });

  /* ---- 장면2 : 5도의 기울기 (우주 디오라마 — 유리 상자 속 황도면·백도면) ---- */
  (function () {
    var canvas = $("c-c-tilt"), ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var lam = 60, phase = "new", inc = 5.1;
    var G = window.sthState("cTilt") || { a: false, b: false, c: false, d: false };

    /* 진열장: x 0~L (화면 오른쪽 아래), y 0~D (왼쪽 아래), z 위. 태양은 −x 쪽(왼쪽 위) 아주 멀리 */
    var DH = 440;
    var I = K.iso({ ox: 400, oy: 192, s: 0.62, L: 340, D: 340 });
    var L = I.L, D = I.D, HZ = 230, Z0 = 115, CX = L / 2, CY = D / 2, RO = 140;
    var RE = 8.5 / 0.62;                /* 지구 반지름(그림 단위, 화면 8.5 px) */
    var KZ = RE / SOL_LIMIT;            /* 황위 1°를 몇 그림 단위 높이로 — 일식 한계 황위에서 달 그림자가 지구 가장자리에 닿는다 */
    var EXAG = Math.round(Math.atan(KZ * 5.1 / RO) * R2D / 5.1);
    var gph = 200, playing = !REDUCE, ghostOn = playing;

    function verdict() {
      var b = Math.abs(betaOf(lam, inc));
      if (phase === "new") {
        if (b <= SOL_CENTRAL) return { t: "개기 또는 금환 일식", ok: true, c: "--teal-700" };
        if (b <= SOL_LIMIT) return { t: "부분 일식", ok: true, c: "--teal-700" };
        return { t: "삭이지만 일식이 아닙니다", ok: false, c: "--rose-700" };
      }
      if (b <= LUN_TOTAL) return { t: "개기 월식", ok: true, c: "--teal-700" };
      if (b <= LUN_LIMIT) return { t: "부분 월식", ok: true, c: "--teal-700" };
      return { t: "망이지만 월식이 아닙니다", ok: false, c: "--rose-700" };
    }

    function W3(phi, r, z) { var a = phi * D2R; return I.P(CX + r * Math.cos(a), CY + r * Math.sin(a), z); }
    function zOrb(phi, node) { return Z0 + KZ * betaOf(phi - node, inc); }
    function rSh(d) { return RE - (RE - LUN_LIMIT * KZ) * d / RO; }          /* 지구 그림자 반지름(그림 단위) */
    function poly(pts, fill) {
      ctx.beginPath(); pts.forEach(function (p, i) { if (i) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y); });
      ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
    }
    function earthShadowPts() {
      var top = [], bot = [], d;
      for (d = 0; d <= L - CX - 4; d += 6) { top.push(I.P(CX + d, CY, Z0 + rSh(d))); bot.unshift(I.P(CX + d, CY, Z0 - rSh(d))); }
      return top.concat(bot);
    }
    /* 높이 막대(점선) + 궤도면 위 발자국 */
    function pole(x, y, z, col) {
      var a = I.P(x, y, z), b = I.P(x, y, Z0);
      K.line(ctx, a, b, col, 1.2, [3, 3]);
      ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(b.x, b.y, 4, 2, 0, 0, 6.2832); ctx.fill();
    }

    function drawModel(b, ab, vd) {
      var moonDir = phase === "new" ? 180 : 0, node = moonDir - lam;
      var zm = Z0 + KZ * b;
      var base = I.P(L, D, -26);
      K.studio(ctx, 0, 0, W, DH, { x: I.P(L / 2, D / 2, 0).x, y: base.y - 22, rx: 290, ry: 50 });
      ctx.save(); ctx.beginPath(); ctx.roundRect(0, 0, W, DH, 14); ctx.clip();

      /* 태양과 햇빛 */
      var sp = I.P(-300, CY, Z0);
      for (var k = -2; k <= 2; k++) K.line(ctx, I.P(-300, CY, Z0 + k * 7), I.P(0, CY, Z0 + k * 7), "rgba(255,170,40,.55)", 1.2);
      K.sun(ctx, sp.x, sp.y, 20);

      /* 받침대 */
      I.box(ctx, -12, -12, -26, L + 12, D + 12, -2, "#eef1f6", "#c9d1dc", "#a9b3c3");

      /* 유리 상자 속 우주 */
      var sil = [I.P(0, 0, HZ), I.P(L, 0, HZ), I.P(L, 0, 0), I.P(L, D, 0), I.P(0, D, 0), I.P(0, D, HZ)];
      var bg = ctx.createLinearGradient(0, sil[0].y, 0, sil[3].y); bg.addColorStop(0, "#070b26"); bg.addColorStop(1, "#151b47");
      poly(sil, bg);
      ctx.save(); ctx.beginPath(); sil.forEach(function (p, i) { if (i) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y); }); ctx.closePath(); ctx.clip();
      var R = K.rng(41);
      for (var i = 0; i < 170; i++) {
        ctx.fillStyle = "rgba(255,255,255," + (0.25 + R() * 0.6).toFixed(2) + ")";
        var sz = R() > .9 ? 1.8 : 1.1;
        ctx.fillRect(sil[5].x + R() * (sil[2].x - sil[5].x), sil[0].y + R() * (sil[3].y - sil[0].y), sz, sz);
      }
      ctx.restore();
      /* 안쪽 모서리 */
      var o = I.P(0, 0, 0);
      ctx.strokeStyle = "rgba(255,255,255,.16)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(sil[2].x, sil[2].y); ctx.moveTo(o.x, o.y); ctx.lineTo(sil[4].x, sil[4].y); ctx.moveTo(o.x, o.y); ctx.lineTo(sil[0].x, sil[0].y); ctx.stroke();

      /* 상자 안으로 들어온 햇빛 */
      poly([I.P(0, CY, Z0 + RE), I.P(CX, CY, Z0 + RE), I.P(CX, CY, Z0 - RE), I.P(0, CY, Z0 - RE)], "rgba(255,200,90,.13)");

      /* 백도면 아래쪽 반 → 황도면 → 백도면 위쪽 반 */
      function half(up) {
        if (inc === 0) return;
        ctx.beginPath(); var c0 = I.P(CX, CY, Z0); ctx.moveTo(c0.x, c0.y);
        for (var t = 0; t <= 180; t += 6) { var ph = node + (up ? t : 180 + t), p = W3(ph, RO, zOrb(ph, node)); ctx.lineTo(p.x, p.y); }
        ctx.closePath(); ctx.fillStyle = up ? "rgba(182,156,255,.30)" : "rgba(182,156,255,.15)"; ctx.fill();
        ctx.strokeStyle = up ? "rgba(200,180,255,.95)" : "rgba(182,156,255,.55)"; ctx.lineWidth = 2; ctx.beginPath();
        for (t = 0; t <= 180; t += 6) { ph = node + (up ? t : 180 + t); p = W3(ph, RO, zOrb(ph, node)); if (t) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y); }
        ctx.stroke();
      }
      half(false);
      I.plane(ctx, Z0, "rgba(255,211,107,.12)", "rgba(255,211,107,.65)");
      ctx.save(); ctx.setLineDash([5, 5]); ctx.strokeStyle = inc === 0 ? "rgba(200,180,255,.95)" : "rgba(255,211,107,.45)"; ctx.lineWidth = inc === 0 ? 2 : 1.2; ctx.beginPath();
      for (var t2 = 0; t2 <= 360; t2 += 6) { var q = W3(t2, RO, Z0); if (t2) ctx.lineTo(q.x, q.y); else ctx.moveTo(q.x, q.y); }
      ctx.stroke(); ctx.restore();
      half(true);

      /* 교점선 */
      if (inc > 0) {
        K.line(ctx, W3(node, RO * 1.12, Z0), W3(node + 180, RO * 1.12, Z0), "rgba(200,180,255,.95)", 2, [7, 5]);
        [node, node + 180].forEach(function (ph) { var p = W3(ph, RO, Z0); K.glow(ctx, p.x, p.y, 3.5, "rgba(182,156,255,.95)", 3); });
      }

      /* 천체 — 먼 것부터 */
      var mx = CX + RO * Math.cos(moonDir * D2R), my = CY;
      var gx = CX + RO * Math.cos(gph * D2R), gy = CY + RO * Math.sin(gph * D2R), gz = zOrb(gph, node);
      function ghost() {
        if (!ghostOn) return;
        ctx.save(); ctx.globalAlpha = .8; pole(gx, gy, gz, "rgba(200,180,255,.8)");
        var p = I.P(gx, gy, gz); K.glow(ctx, p.x, p.y, 3, "rgba(220,210,255,.6)", 3); K.planet(ctx, p.x, p.y, 5, MOON, "#4a4c58"); ctx.restore();
      }
      var gBack = gx + gy < CX + CY;
      if (gBack) ghost();
      if (phase === "new") {
        pole(mx, my, zm, "rgba(255,255,255,.7)");
        var mp = I.P(mx, my, zm); ball(ctx, mp.x, mp.y, 5.5, MOON, "#4a4c58");
        /* 달의 그림자: 태양 반대쪽(+x)으로 */
        var xEnd = vd.ok ? CX - RE * 0.4 : L - 4, sh = [], d, r0 = 5.5 / 0.62;
        for (d = mx; d <= xEnd; d += 8) sh.push(I.P(d, my, zm + r0 * (1 - .7 * (d - mx) / (L - mx))));
        for (d = xEnd; d >= mx; d -= 8) sh.push(I.P(d, my, zm - r0 * (1 - .7 * (d - mx) / (L - mx))));
        poly(sh, "rgba(0,0,0,.45)");
      }
      var es = ctx.createLinearGradient(I.P(CX, CY, Z0).x, 0, I.P(L, CY, Z0).x, 0);
      es.addColorStop(0, "rgba(0,0,0,.72)"); es.addColorStop(1, "rgba(0,0,0,.28)");
      poly(earthShadowPts(), es);
      var ep2 = I.P(CX, CY, Z0); K.earth(ctx, ep2.x, ep2.y, 8.5);
      if (phase === "new" && vd.ok) {
        var spt = I.P(CX - RE * .55, CY, zm);
        ctx.fillStyle = "rgba(0,0,0,.3)"; ctx.beginPath(); ctx.arc(spt.x, spt.y, 4.5, 0, 6.2832); ctx.fill();
        ctx.fillStyle = "rgba(0,0,0,.85)"; ctx.beginPath(); ctx.arc(spt.x, spt.y, 2, 0, 6.2832); ctx.fill();
      }
      if (phase === "full") {
        pole(mx, my, zm, "rgba(255,255,255,.7)");
        var fp = I.P(mx, my, zm); ball(ctx, fp.x, fp.y, 5.5, MOON, "#4a4c58");
        if (vd.ok) {
          ctx.save(); ctx.beginPath(); ctx.arc(fp.x, fp.y, 6, 0, 6.2832); ctx.clip();
          if (ab <= LUN_TOTAL) { ctx.fillStyle = "rgba(170,60,35,.78)"; ctx.fillRect(fp.x - 7, fp.y - 7, 14, 14); }
          else poly(earthShadowPts(), "rgba(30,12,10,.8)");
          ctx.restore();
        }
      }
      if (!gBack) ghost();

      /* 유리 앞면·윗면 */
      poly([I.P(0, D, 0), I.P(L, D, 0), I.P(L, D, HZ), I.P(0, D, HZ)], "rgba(255,255,255,.035)");
      poly([I.P(L, 0, 0), I.P(L, D, 0), I.P(L, D, HZ), I.P(L, 0, HZ)], "rgba(255,255,255,.05)");
      poly([I.P(0, 0, HZ), I.P(L, 0, HZ), I.P(L, D, HZ), I.P(0, D, HZ)], "rgba(255,255,255,.06)");
      ctx.save(); ctx.globalAlpha = .12; ctx.fillStyle = "#ffffff";
      poly([I.P(40, D, HZ), I.P(95, D, HZ), I.P(25, D, 0), I.P(0, D, 0), I.P(0, D, 40)], "#ffffff"); ctx.restore();
      ctx.strokeStyle = "rgba(255,255,255,.75)"; ctx.lineWidth = 1.3; ctx.beginPath();
      [[0, D, 0, L, D, 0], [L, D, 0, L, 0, 0], [0, D, 0, 0, D, HZ], [L, D, 0, L, D, HZ], [L, 0, 0, L, 0, HZ],
       [0, D, HZ, L, D, HZ], [L, D, HZ, L, 0, HZ], [L, 0, HZ, 0, 0, HZ], [0, 0, HZ, 0, D, HZ]].forEach(function (e) {
        var a = I.P(e[0], e[1], e[2]), c = I.P(e[3], e[4], e[5]); ctx.moveTo(a.x, a.y); ctx.lineTo(c.x, c.y);
      });
      ctx.stroke();
      ctx.restore();

      /* 이름표 */
      K.pill(ctx, "태양 — 실제로는 훨씬 멀고 큼", sp.x, sp.y + 44, { a: "center", s: 11.5, c: "#ffd35a" });
      var mpp = I.P(mx, my, zm), mtxt = "달 (" + (phase === "new" ? "삭" : "망") + ") · 황위 " + (b >= 0 ? "+" : "−") + ab.toFixed(2) + "°";
      var mBox = phase === "new"
        ? K.pill(ctx, mtxt, mpp.x, mpp.y - 15, { a: "center", s: 11.5, c: "#ffffff" })
        : K.pill(ctx, mtxt, mpp.x + 14, mpp.y + 4, { s: 11.5, c: "#ffffff" });
      var eBox = I.label(ctx, CX, CY, Z0 - RE * .9, "지구", -46, 36, "#bfe6ff", [0, W]);
      if (inc > 0) {
        [node, node + 180].forEach(function (ph) {
          var p = W3(ph, RO, Z0), x0 = p.x - 18, y0 = p.y - 30;
          function hit(bx) { return bx && x0 < bx.x + bx.w + 4 && x0 + 36 > bx.x - 4 && y0 < bx.y + bx.h + 4 && y0 + 20 > bx.y - 4; }
          if (hit(mBox) || hit(eBox)) return;
          K.pill(ctx, "교점", p.x, p.y - 12, { a: "center", s: 10.5, c: "#d9ccff" });
        });
      }
      /* 범례 */
      var lg = [["━ 황도면: 지구의 공전 궤도면", "#ffd35a"],
                ["━ 백도면: 달의 공전 궤도면 (" + inc.toFixed(1) + "°)", "#c9b6ff"],
                ["┅ 교점선: 두 면이 만나는 선", "#c9b6ff"],
                ["▬ 검은 띠: 지구·달의 그림자", "#c7cfe6"]];
      if (ghostOn) lg.push(["◌ 흐린 달: 궤도를 도는 달", "#c7cfe6"]);
      lg.forEach(function (r, i3) { K.pill(ctx, r[0], 650, 296 + i3 * 24, { s: 11.5, c: r[1] }); });
      K.warn(ctx, W - 14, 428, "⚠ 백도면 기울기는 약 " + EXAG + "배, 크기·거리는 보기 쉽게 과장", "right");

      /* 큰 제목 */
      var h1, h2, side = b > 0 ? "위" : "아래";
      if (inc === 0) {
        h1 = phase === "new" ? "기울기가 0°라면 — 삭마다 일식" : "기울기가 0°라면 — 망마다 월식";
        h2 = "교점에서 " + Math.abs(lam) + "° 떨어져도 황위는 0°";
      } else if (phase === "new") {
        h1 = vd.ok ? "달 그림자가 지구에 닿았다" : "삭인데 그림자가 비껴간다";
        h2 = vd.ok ? vd.t + " · 황위 " + ab.toFixed(2) + "°" : "달이 태양의 " + side + "쪽을 지나간다 · 황위 " + ab.toFixed(2) + "°";
      } else {
        h1 = vd.ok ? "달이 지구 그림자 속으로" : "망인데 그림자를 비껴간다";
        h2 = vd.ok ? vd.t + " · 황위 " + ab.toFixed(2) + "°" : "지구 그림자의 " + side + "쪽을 지나간다 · 황위 " + ab.toFixed(2) + "°";
      }
      K.bigText(ctx, h1, W - 18, 50, 26, "#ffffff", "right");
      K.bigText(ctx, h2, W - 18, 82, 16, vd.ok ? "#ffd35a" : "#ffb3c1", "right");
    }

    function drawSide(b, ab, vd) {
      var y0 = DH + 8, ly = 560, ex = 330, kz2 = 13, rs0 = SOL_LIMIT * kz2;
      K.stage(ctx, 0, y0, W, H - y0, "space", { seed: 37 });
      K.pill(ctx, "옆에서 본 모습 — 달이 황도면에서 떨어진 높이(황위)", 16, y0 + 26, { s: 12, c: KC.blue });
      for (var k = -1; k <= 1; k++) K.line(ctx, { x: 74, y: ly + k * 9 }, { x: ex - 16, y: ly + k * 9 }, "rgba(255,190,80,.35)", 1);
      K.line(ctx, { x: 30, y: ly }, { x: 495, y: ly }, "rgba(255,211,107,.85)", 1.6);
      K.sun(ctx, 60, ly, 12);
      K.t(ctx, "태양", 60, ly + 32, { s: 11.5, a: "center", c: KC.yellow });
      K.t(ctx, "황도면", 90, ly + 20, { s: 11, c: KC.yellow });
      var g = ctx.createLinearGradient(ex, 0, 495, 0); g.addColorStop(0, "rgba(0,0,0,.75)"); g.addColorStop(1, "rgba(0,0,0,.3)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(ex, ly - rs0); ctx.lineTo(495, ly - rs0 + (rs0 - LUN_LIMIT * kz2) * 165 / 120);
      ctx.lineTo(495, ly + rs0 - (rs0 - LUN_LIMIT * kz2) * 165 / 120); ctx.lineTo(ex, ly + rs0); ctx.closePath(); ctx.fill();
      var mx = phase === "new" ? ex - 120 : ex + 120, my = ly - b * kz2;
      if (phase === "new") {
        var xe = vd.ok ? ex - 8 : 495;
        ctx.fillStyle = "rgba(0,0,0,.5)"; ctx.beginPath(); ctx.moveTo(mx, my - 7); ctx.lineTo(xe, my - 2.5); ctx.lineTo(xe, my + 2.5); ctx.lineTo(mx, my + 7); ctx.closePath(); ctx.fill();
      }
      K.earth(ctx, ex, ly, 18);
      K.t(ctx, "지구", ex, ly + 38, { s: 11.5, a: "center", c: KC.blue });
      ball(ctx, mx, my, 7, MOON, "#4a4c58");
      if (phase === "full" && vd.ok) { ctx.fillStyle = ab <= LUN_TOTAL ? "rgba(170,60,35,.78)" : "rgba(30,12,10,.6)"; ctx.beginPath(); ctx.arc(mx, my, 7.3, 0, 6.2832); ctx.fill(); }
      K.pill(ctx, "달", mx + 12, my + 5, { s: 11, c: "#ffffff" });
      if (ab >= 0.15) {
        K.line(ctx, { x: mx, y: ly }, { x: mx, y: my + (b > 0 ? 8 : -8) }, KC.yellow, 1.5, [3, 3]);
        K.pill(ctx, "황위 " + ab.toFixed(2) + "°", mx - 14, (ly + my) / 2 + 5, { s: 11, a: "right", c: KC.yellow });
      }

      /* 오른쪽 판정판 */
      var bx = 512, by = 462, bw = 374;
      glass(ctx, bx, by, bw, 176, 12);
      text(ctx, "지금 이 배치에서는", bx + 16, by + 26, { s: 13.5, w: "900" });
      var lines = [
        "달의 위치 : " + (phase === "new" ? "삭 (태양 쪽)" : "망 (반대쪽)"),
        "교점에서 떨어진 각 : " + Math.abs(lam) + "°",
        "달의 황위 : " + ab.toFixed(2) + "°",
        "달의 시반지름 : 약 0.26°",
        "일식 한계 황위 : " + SOL_LIMIT.toFixed(1) + "°",
        "월식 한계 황위 : " + LUN_LIMIT.toFixed(1) + "°"
      ];
      lines.forEach(function (t, i2) { text(ctx, t, bx + 16 + (i2 < 3 ? 0 : 184), by + 50 + (i2 % 3) * 20, { s: 12, c: v("--mist") }); });
      text(ctx, vd.t, bx + 16, by + 122, { s: 15, w: "900", c: v(vd.c) });
      var gx = bx + 16, gw = bw - 32, gy = by + 134;
      ctx.fillStyle = "rgba(255,255,255,.08)"; ctx.beginPath(); ctx.roundRect(gx, gy, gw, 12, 6); ctx.fill();
      ctx.save(); ctx.fillStyle = KC.green; ctx.shadowColor = KC.green; ctx.shadowBlur = 8; ctx.beginPath(); ctx.roundRect(gx, gy, gw * (SOL_LIMIT / 5.5), 12, 6); ctx.fill(); ctx.restore();
      K.glow(ctx, gx + clamp(ab / 5.5, 0, 1) * gw, gy + 6, 4, "rgba(255,255,255,.95)", 3);
      text(ctx, "0°", gx, gy + 28, { s: 10.5, c: v("--mist") });
      text(ctx, "5.5°", gx + gw, gy + 28, { s: 10.5, a: "right", c: v("--mist") });
    }

    function drawScene() {
      var b = betaOf(lam, inc), ab = Math.abs(b), vd = verdict();
      ctx.clearRect(0, 0, W, H);
      drawModel(b, ab, vd);
      drawSide(b, ab, vd);
    }

    function draw() {
      var b = betaOf(lam, inc), ab = Math.abs(b), vd = verdict();
      drawScene();

      var ch = false;
      if (inc === 0 && phase === "new" && Math.abs(lam) >= 60 && !G.a) { G.a = ch = true; }
      if (inc > 0 && phase === "new" && Math.abs(lam) >= 85 && Math.abs(lam) <= 95 && !G.b) { G.b = ch = true; }
      if (inc > 0 && phase === "new" && ab <= SOL_LIMIT && !G.c) { G.c = ch = true; }
      if (inc > 0 && phase === "full" && ab <= LUN_LIMIT && !G.d) { G.d = ch = true; }
      if (ch) { window.sthState("cTilt", G); mission(); }

      $("c-badge").textContent = vd.t;
      $("c-tilt-read").innerHTML = "달의 황위: <b>" + ab.toFixed(2) + "°</b> — " + vd.t;
      $("c-tilt-info").innerHTML = inc === 0
        ? "<b>기울기가 0°라면</b> 달은 언제나 황도면 위에 있습니다. 교점에서 아무리 멀어도 황위가 0°이므로, <b>삭마다 일식, 망마다 월식</b>이 일어납니다 — 한 달에 두 번씩요. 실제로는 그렇지 않습니다."
        : (vd.ok
          ? "<b>" + vd.t + "입니다.</b> 달이 교점에서 " + Math.abs(lam) + "° 밖에 떨어져 있지 않아 황위가 " + ab.toFixed(2) + "°로 작습니다. 태양·달·지구가 거의 한 직선 위에 놓였습니다."
          : "<b>" + vd.t + "</b> 달의 황위가 " + ab.toFixed(2) + "°나 되어, 달이 태양(또는 지구 그림자)의 " + (betaOf(lam, inc) > 0 ? "위" : "아래") + "쪽을 비껴 지나갑니다. 황위를 <b>" + (phase === "new" ? SOL_LIMIT.toFixed(1) : LUN_LIMIT.toFixed(1)) + "° 아래</b>로 줄이려면 달을 교점 가까이로 옮겨야 합니다.");
    }
    function mission() {
      if (G.a) done("m-c2a"); if (G.b) done("m-c2b"); if (G.c) done("m-c2c"); if (G.d) done("m-c2d");
      if (G.a && G.b && G.c && G.d) {
        window.sthMission("m-c2", true, "<span class='m-tag'>미션 완료</span>기울기가 0°라면 삭마다 일식, 망마다 월식입니다. 그런데 백도면이 <b>5.1°</b> 기울어져 있어서, 달이 <b>교점 가까이</b> 있을 때 삭·망이 되어야만 식이 일어납니다. 그 한계를 <b>식한</b>이라 하고, 일식은 교점에서 약 <b>16°</b>, 월식은 약 <b>11°</b> 안쪽입니다.");
        ep.clear(1);
      }
    }
    canvas._redraw = draw;
    $("c-lam").addEventListener("input", function (e) {
      lam = +e.target.value; $("c-lam-val").textContent = lam + "°"; draw();
    });
    segWire("c-phase", function (b) { phase = b.getAttribute("data-k"); draw(); });
    segWire("c-inc", function (b) { inc = parseFloat(b.getAttribute("data-i")); draw(); });
    var pb = $("c-tilt-play");
    function pbText() { if (pb) pb.textContent = playing ? "⏸ 달 공전 멈추기" : "▶ 달 공전 보기"; }
    if (pb) pb.addEventListener("click", function () { playing = !playing; ghostOn = true; pbText(); drawScene(); });
    pbText();
    K.animate(canvas, function (dt) { if (!playing) return; gph = (gph + dt / 1000 * 36) % 360; drawScene(); }, 24);
    draw(); mission();
  })();

  /* ---- 장면3 : 개기와 금환 ---- */
  (function () {
    var canvas = $("c-c-shadow"), ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var dm = 380700, ds = 149600000;
    var G = window.sthState("cShadow") || { a: false, b: false, c: false, d: false };

    function calc() {
      var sm = Math.asin(Rm / dm) * R2D;
      var ss = Math.asin(Rs / ds) * R2D;
      var L = Rm * ds / (Rs - Rm);
      var x = dm - Re;
      var w = 2 * Rm * (1 - x / L);
      return { sm: sm, ss: ss, L: L, w: w };
    }
    function comma(n) { return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","); }

    function draw() {
      var c = calc(), total = c.w > 0;
      ctx.clearRect(0, 0, W, H);
      K.studio(ctx, 0, 0, W, H);

      /* 왼쪽 — 하늘에서 본 겹침(망원경 시야) */
      deck(ctx, 14, 14, 300, H - 28, 41, "하늘에서 본 겹침");
      var cx = 164, cy = 200, base = 96;
      var rs = base * (c.ss / 0.2666), rmn = base * (c.sm / 0.2666);
      if (total) {
        var co = ctx.createRadialGradient(cx, cy, rs * .9, cx, cy, rs * 1.9); co.addColorStop(0, "rgba(235,240,255,.8)"); co.addColorStop(.4, "rgba(190,210,255,.25)"); co.addColorStop(1, "rgba(190,210,255,0)");
        ctx.fillStyle = co; ctx.beginPath(); ctx.arc(cx, cy, rs * 1.9, 0, 6.2832); ctx.fill();
      } else K.glow(ctx, cx, cy, rs, "rgba(255,200,90,.9)", 1.35);
      var sd = ctx.createRadialGradient(cx - rs * .2, cy - rs * .2, rs * .1, cx, cy, rs); sd.addColorStop(0, "#fff6d0"); sd.addColorStop(.7, "#ffc94d"); sd.addColorStop(1, "#ff9a1f");
      ctx.fillStyle = sd; ctx.beginPath(); ctx.arc(cx, cy, rs, 0, 6.2832); ctx.fill();
      ctx.fillStyle = "#06070f"; ctx.beginPath(); ctx.arc(cx, cy, rmn, 0, 6.2832); ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,.14)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, rmn, 0, 6.2832); ctx.stroke();
      lbl(ctx, "태양 시반지름 " + c.ss.toFixed(4) + "°", cx, 360, { s: 12, a: "center", c: KC.yellow });
      lbl(ctx, "달 시반지름 " + c.sm.toFixed(4) + "°", cx, 388, { s: 12, a: "center", c: "#ffffff" });
      lbl(ctx, total ? "달이 태양을 완전히 덮습니다" : "태양 가장자리가 고리로 남습니다", cx, 418, { s: 12, a: "center", c: total ? KC.green : KC.red });

      /* 오른쪽 위 — 본그림자 원뿔 입체 모형 */
      var X0 = 330, my = 176, mr = 18, LPX = 430, mx = X0 + 44, apex = mx + LPX;
      var ex = mx + LPX * ((dm - Re) / c.L);
      ctx.save(); ctx.beginPath(); ctx.roundRect(324, 0, W - 324, 296, 14); ctx.clip();
      for (var k = -2; k <= 2; k++) K.arrow(ctx, { x: X0 - 4, y: my + k * 22 }, { x: X0 + 18, y: my + k * 22 }, "rgba(245,159,0,.75)", 2, 7);
      ctx.fillStyle = "rgba(60,70,90,.13)"; ctx.beginPath(); ctx.moveTo(mx, my - mr); ctx.lineTo(W, my - mr - (W - mx) * .1); ctx.lineTo(W, my + mr + (W - mx) * .1); ctx.lineTo(mx, my + mr); ctx.closePath(); ctx.fill();
      var cg = ctx.createLinearGradient(mx, 0, apex, 0); cg.addColorStop(0, "rgba(10,14,30,.88)"); cg.addColorStop(1, "rgba(10,14,30,.55)");
      ctx.fillStyle = cg; ctx.beginPath(); ctx.moveTo(mx, my - mr); ctx.lineTo(apex, my); ctx.lineTo(mx, my + mr); ctx.closePath(); ctx.fill();
      if (!total) { ctx.fillStyle = "rgba(10,14,30,.22)"; ctx.beginPath(); ctx.moveTo(apex, my); ctx.lineTo(W, my - (W - apex) * mr / LPX); ctx.lineTo(W, my + (W - apex) * mr / LPX); ctx.closePath(); ctx.fill(); }
      /* 지구 표면(큰 공의 일부) */
      var ER = 330, ecx = clamp(ex, X0 + 120, W + 40) + ER;
      var eg = ctx.createRadialGradient(ecx - ER * .75, my - 120, 20, ecx, my, ER);
      eg.addColorStop(0, "#bfe6ff"); eg.addColorStop(.35, "#2f86e0"); eg.addColorStop(1, "#123a8a");
      ctx.fillStyle = eg; ctx.beginPath(); ctx.arc(ecx, my, ER, 0, 6.2832); ctx.fill();
      ctx.fillStyle = "rgba(90,190,110,.75)"; ctx.beginPath(); ctx.ellipse(ecx - ER + 34, my - 92, 12, 30, .25, 0, 6.2832); ctx.fill();
      ctx.strokeStyle = "rgba(160,210,255,.7)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(ecx, my, ER + 2, 0, 6.2832); ctx.stroke();
      if (total) { ctx.fillStyle = "rgba(5,8,20,.85)"; ctx.beginPath(); ctx.ellipse(ecx - ER + 3, my, 4, clamp(c.w / 25, 3, 12), 0, 0, 6.2832); ctx.fill(); }
      ctx.restore();
      K.planet(ctx, mx, my, mr, MOON, "#4a4c58");
      lbl(ctx, "달", mx, my - mr - 12, { s: 12, a: "center", c: "#ffffff" });
      lbl(ctx, "햇빛", X0 + 2, my - 66, { s: 11, c: "#ffd35a" });
      lbl(ctx, "본그림자 원뿔", mx + 60, my + 46, { s: 11.5, c: "#e8ecff", box: [324, W] });
      if (apex < W - 10) { K.line(ctx, { x: apex, y: my - 8 }, { x: apex, y: my - 34 }, LT.line, 1.2); lbl(ctx, "원뿔의 끝", apex, my - 40, { s: 11, a: "center", c: "#e8ecff", box: [324, W] }); }
      lbl(ctx, "지표", clamp(ex, X0 + 120, W - 20) + 8, my + 84, { s: 11.5, c: "#bfe6ff", box: [324, W] });
      K.bigText(ctx, total ? "개기 일식" : "금환 일식", 340, 50, 27, "#ffffff");
      K.bigText(ctx, total ? "본그림자가 지표에 닿는다" : "원뿔 끝이 지표에 못 미친다", 340, 82, 16, total ? "#7cf0c4" : "#ff9aa8");
      K.warn(ctx, W - 14, 284, "⚠ 거리·크기는 실제 비율이 아님", "right");

      /* 오른쪽 아래 판정 카드 */
      var RX = 324, y0 = 306, px = RX + 18, RR = W - 18, mid = 612;
      vcard(ctx, RX, y0, W - RX, H - y0 - 2, "판정 · 원뿔 모형", total ? "개기 일식" : "금환 일식", total ? LT.green : LT.red);
      K.t(ctx, Math.abs(c.w).toFixed(0) + " km", mid - 20, y0 + 62, { s: 22, w: "900", a: "right", c: LT.ink });
      K.t(ctx, total ? "본그림자 띠의 폭" : "모자란 정도", mid - 20, y0 + 30, { s: 11.5, w: "800", a: "right", c: LT.mute });
      K.row(ctx, "원뿔 길이", comma(c.L) + " km", px, mid - 20, y0 + 100);
      K.row(ctx, "달까지", comma(dm) + " km", px, mid - 20, y0 + 128);
      K.row(ctx, "달 시반지름", c.sm.toFixed(4) + "°", mid + 10, RR, y0 + 72);
      K.row(ctx, "태양 시반지름", c.ss.toFixed(4) + "°", mid + 10, RR, y0 + 100);
      K.row(ctx, "달 − 태양", ((c.sm - c.ss) >= 0 ? "+" : "") + (c.sm - c.ss).toFixed(4) + "°", mid + 10, RR, y0 + 128, (c.sm - c.ss) >= 0 ? LT.green : LT.red);
      K.t(ctx, "달 반지름 1,737 km · 태양 696,000 km · 지구 6,378 km로 계산", RR, y0 + 152, { s: 10.5, a: "right", c: LT.dim });

      var ch = false;
      if (c.w >= 50 && !G.a) { G.a = ch = true; }
      if (c.w <= -50 && !G.b) { G.b = ch = true; }
      if (c.w >= 150 && !G.c) { G.c = ch = true; }
      if (ds >= 152000000 && !G.d) { G.d = ch = true; }
      if (ch) { window.sthState("cShadow", G); mission(); }

      $("c-shadow-read").innerHTML = "판정: <b>" + (total ? "개기 일식" : "금환 일식") + "</b> · "
        + (total ? "띠의 폭 " : "모자란 정도 ") + "<b>" + Math.abs(c.w).toFixed(0) + " km</b>";
      $("c-shadow-info").innerHTML = total
        ? "<b>개기 일식입니다.</b> 달의 시반지름(" + c.sm.toFixed(4) + "°)이 태양의 시반지름(" + c.ss.toFixed(4) + "°)보다 커서 태양을 완전히 덮습니다. 본그림자가 지표에 닿아 폭 <b>" + c.w.toFixed(0) + " km</b>의 띠를 그리며 지나갑니다. 그 띠 밖에서는 반그림자에 들어 <b>부분 일식</b>으로 보입니다."
        : "<b>금환 일식입니다.</b> 달이 멀어 시반지름(" + c.sm.toFixed(4) + "°)이 태양(" + c.ss.toFixed(4) + "°)보다 작습니다. 본그림자 원뿔의 끝이 지표에 <b>" + Math.abs(c.w).toFixed(0) + " km</b> 만큼 못 미쳐, 태양의 가장자리가 <b>반지 모양</b>으로 남습니다.";
    }
    function mission() {
      if (G.a) done("m-c3a"); if (G.b) done("m-c3b"); if (G.c) done("m-c3c"); if (G.d) done("m-c3d");
      if (G.a && G.b && G.c && G.d) {
        window.sthMission("m-c3", true, "<span class='m-tag'>미션 완료</span>같은 삭이라도 <b>달이 가까우면 개기, 멀면 금환</b>입니다. 달의 시반지름(0.245°~0.279°)과 태양의 시반지름(0.262°~0.271°)이 <b>거의 같은 크기</b>로 겹쳐 있기 때문에, 거리가 조금만 달라져도 결과가 뒤집힙니다. 개기 일식의 띠는 가장 넓어도 200 km 남짓입니다.");
        ep.clear(2);
      }
    }
    canvas._redraw = draw;
    $("c-dm").addEventListener("input", function (e) {
      dm = +e.target.value; $("c-dm-val").textContent = comma(dm) + " km"; draw();
    });
    $("c-ds").addEventListener("input", function (e) {
      ds = +e.target.value;
      $("c-ds-val").textContent = "1억 " + comma(Math.round((ds - 100000000) / 10000)) + "만 km";
      draw();
    });
    draw(); mission();
  })();

  /* ---- 장면4 : 식의 달력 ---- */
  (function () {
    var canvas = $("c-c-when"), ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var n = 1, kind = "new";
    var G = window.sthState("cWhen") || { a: false, b: false, c: false, seasons: [], q: false };
    if (!G.seasons) G.seasons = [];

    function tOf(nn, kk) { return SYN * (kk === "new" ? nn : nn + 0.5); }
    function nodeAng(t) { return norm360(360 * t / DRA); }
    function stateAt(nn, kk) {
      var t = tOf(nn, kk), nu = nodeAng(t), b = betaOf(nu, INC), ab = Math.abs(b);
      var ok, label;
      if (kk === "new") {
        ok = ab <= SOL_LIMIT;
        label = ok ? (ab <= SOL_CENTRAL ? "일식 · 중심식에 가깝다" : "일식 · 부분식에 가깝다") : "일식이 일어나지 않는다";
      } else {
        ok = ab <= LUN_LIMIT;
        label = ok ? (ab <= LUN_TOTAL ? "월식 · 개기에 가깝다" : "월식 · 부분식에 가깝다") : "월식이 일어나지 않는다";
      }
      return { t: t, nu: nu, beta: b, ab: ab, ok: ok, label: label };
    }

    function draw() {
      var s = stateAt(n, kind), i, st;
      ctx.clearRect(0, 0, W, H);
      K.studio(ctx, 0, 0, W, 240);

      /* 위 왼쪽 — 달의 위상 원반(태양은 왼쪽 멀리) */
      var lx = 158, ly = 150, Q = 0.42;
      var pr = disk(ctx, lx, ly, 108, { q: Q, th: 9, seed: 43 });
      ring(ctx, lx, ly, 78, Q, "rgba(233,233,239,.7)", 1.4, [4, 4]);
      sunBall(ctx, 26, ly - 4, 10);
      K.arrow(ctx, { x: 42, y: ly - 4 }, { x: 70, y: ly - 4 }, "#f59f00", 2, 7);
      orb(ctx, lx, ly - 2, 9, "지구");
      var ma = kind === "new" ? Math.PI : 0, mp = pr(78 * Math.cos(ma), 78 * Math.sin(ma));
      orb(ctx, mp.x, mp.y, 6.5, "달");
      K.pill(ctx, "달의 위상 — " + (kind === "new" ? "삭 (태양 쪽)" : "망 (태양 반대쪽)"), lx, 60, { s: 12.5, a: "center", c: KC.blue });

      /* 위 가운데 — 교점에서 잰 각: 기울어진 백도 */
      var rx = 430, ry = 150, RO = 80, ZK = 13;
      var pr2 = disk(ctx, rx, ry, 108, { q: Q, th: 9, seed: 47 });
      ring(ctx, rx, ry, RO, Q, "rgba(255,211,107,.85)", 1.6);
      ctx.save(); ctx.strokeStyle = "rgba(200,180,255,.95)"; ctx.lineWidth = 2; ctx.beginPath();
      for (i = 0; i <= 72; i++) { var ph = i * 5 * D2R, pq = pr2(RO * Math.cos(ph), RO * Math.sin(ph), ZK * Math.sin(ph)); if (i) ctx.lineTo(pq.x, pq.y); else ctx.moveTo(pq.x, pq.y); }
      ctx.stroke(); ctx.restore();
      K.line(ctx, pr2(-RO * 1.15, 0), pr2(RO * 1.15, 0), "rgba(200,180,255,.95)", 1.6, [6, 4]);
      orb(ctx, rx, ry - 2, 9, "지구");
      var nu = s.nu * D2R, zm = ZK * Math.sin(nu), mfoot = pr2(RO * Math.cos(nu), RO * Math.sin(nu)), mtop = pr2(RO * Math.cos(nu), RO * Math.sin(nu), zm);
      K.line(ctx, mtop, mfoot, "rgba(255,255,255,.8)", 1.2, [3, 3]);
      K.planet(ctx, mtop.x, mtop.y, 6.5, MOON, "#4a4c58");
      lbl(ctx, "교점", pr2(RO * 1.15, 0).x + 6, pr2(RO * 1.15, 0).y + 4, { s: 10.5, c: "#d9ccff", box: [310, 560] });
      K.pill(ctx, "교점에서 잰 각 " + s.nu.toFixed(0) + "°", rx, 60, { s: 12.5, a: "center", c: KC.violet });
      K.warn(ctx, 14, 230, "⚠ 백도의 기울기는 과장");

      /* 위 오른쪽 — 큰 글자 + 판정 카드 */
      var hd = s.ok ? (kind === "new" ? "일식이 일어난다" : "월식이 일어난다") : "식이 일어나지 않는다";
      K.bigText(ctx, hd, W - 18, 46, 24, "#ffffff", "right");
      K.bigText(ctx, dayStr(s.t) + " · " + (kind === "new" ? "삭" : "망"), W - 18, 76, 16, s.ok ? "#7cf0c4" : "#ff9aa8", "right");
      var RX = 584, y0 = 94, px = RX + 18, RR = W - 18;
      K.card(ctx, RX, y0, W - RX, 140, n + "번째 달 · " + s.t.toFixed(1) + "일째");
      K.row(ctx, "달의 황위", s.ab.toFixed(2) + "°", px, RR, y0 + 56, s.ok ? LT.green : LT.red);
      K.row(ctx, "식이 되는 한계", (kind === "new" ? SOL_LIMIT.toFixed(1) : LUN_LIMIT.toFixed(1)) + "° 안쪽", px, RR, y0 + 82);
      K.tip(ctx, s.label, px - 4, y0 + 96, RR - px + 4, s.ok);

      /* 아래 — 36달 띠(밝은 판) */
      K.studio(ctx, 0, 248, W, H - 248);
      var X0 = 70, X1 = 860, Y = 352;
      K.t(ctx, "36달을 한 줄로 — 위는 삭(일식 차례), 아래는 망(월식 차례)", X0, 276, { s: 12.5, w: "800", c: LT.ink });
      function XN(nn) { return X0 + nn / 36 * (X1 - X0); }
      for (i = 0; i <= 36; i++) {
        st = stateAt(i, "new"); var h1 = clamp((5.2 - st.ab) * 6.4, 2, 34);
        ctx.fillStyle = st.ok ? LT.orange : "#c9d2de"; ctx.beginPath(); ctx.roundRect(XN(i) - 5, Y - 6 - h1, 10, h1, 3); ctx.fill();
        st = stateAt(i, "full"); var h2 = clamp((5.2 - st.ab) * 6.4, 2, 34);
        ctx.fillStyle = st.ok ? LT.violet : "#c9d2de"; ctx.beginPath(); ctx.roundRect(XN(i) - 5, Y + 6, 10, h2, 3); ctx.fill();
      }
      K.line(ctx, { x: X0 - 10, y: Y }, { x: X1 + 10, y: Y }, LT.line, 1.5);
      K.line(ctx, { x: XN(n), y: Y - 46 }, { x: XN(n), y: Y + 46 }, LT.ink, 2.4);
      K.t(ctx, "삭", X0 - 18, Y - 14, { s: 11.5, w: "900", a: "right", c: LT.orange });
      K.t(ctx, "망", X0 - 18, Y + 24, { s: 11.5, w: "900", a: "right", c: LT.violet });
      for (i = 0; i <= 36; i += 6) K.t(ctx, i + "", XN(i), Y + 60, { s: 10.5, a: "center", c: LT.mute });
      K.t(ctx, "몇 번째 달 →", X0 + 16, Y + 60, { s: 10.5, c: LT.mute });
      K.t(ctx, "막대가 길수록 교점에 가까움 · 색이 든 달에만 식", X0, Y + 82, { s: 11.5, c: LT.mute });
      var sy = Y + 92;
      for (i = 0; i * SEASON <= SYN * 36; i++) {
        var xx = XN(i * SEASON / SYN);
        if (xx > X1) break;
        var got = G.seasons.indexOf(i) >= 0;
        K.line(ctx, { x: xx, y: sy }, { x: xx, y: sy + 12 }, LT.yellow, 2.4);
        if (i) K.t(ctx, i + "", xx, sy + 26, { s: 10.5, a: "center", c: got ? LT.green : LT.mute, w: got ? "900" : "600" });
      }
      K.t(ctx, "식의 계절(약 " + SEASON + "일마다) · 찾은 곳 " + G.seasons.length, X1, Y + 82, { s: 12, w: "900", a: "right", c: G.seasons.length >= 3 ? LT.green : LT.mute });

      var ch = false;
      if (kind === "new" && s.ok && !G.a) { G.a = ch = true; }
      if (kind === "new" && !s.ok && s.ab >= 4 && !G.b) { G.b = ch = true; }
      if (kind === "full" && s.ok && !G.c) { G.c = ch = true; }
      if (s.ok) {
        var se = Math.round(s.t / SEASON);
        if (G.seasons.indexOf(se) < 0) { G.seasons.push(se); ch = true; }
      }
      if (ch) { window.sthState("cWhen", G); mission(); }

      $("c-when-badge").textContent = dayStr(s.t) + " · " + (kind === "new" ? "삭" : "망");
      $("c-when-read").innerHTML = dayStr(s.t) + " · 달의 황위 <b>" + s.ab.toFixed(2) + "°</b> — " + s.label;
      $("c-when-info").innerHTML = s.ok
        ? "<b>식이 일어납니다.</b> " + dayStr(s.t) + " 의 " + (kind === "new" ? "삭" : "망") + " 에 달이 교점에서 가까워(황위 " + s.ab.toFixed(2) + "°) 태양·지구·달이 거의 한 직선 위에 놓입니다. 아래 띠에서 색이 들어온 자리들이 <b>약 " + SEASON + "일마다</b> 되풀이되는 것을 확인해 보세요."
        : "<b>식이 일어나지 않습니다.</b> " + (kind === "new" ? "삭" : "망") + " 이기는 하지만 달의 황위가 " + s.ab.toFixed(2) + "°나 되어 " + (kind === "new" ? "달이 태양을 비껴갑니다" : "달이 지구 그림자를 비껴갑니다") + ". 달을 <b>몇 달 더</b> 넘겨 교점 가까이로 가야 합니다.";
    }
    function mission() {
      if (G.a) done("m-c4a"); if (G.b) done("m-c4b"); if (G.c) done("m-c4c");
      if (G.seasons.length >= 3) done("m-c4d");
      if (G.q) done("m-c4e");
      if (G.a && G.b && G.c && G.seasons.length >= 3 && G.q) {
        window.sthMission("m-c4", true, "<span class='m-tag'>미션 완료</span>삭망월(29.53일)과 교점월(27.21일)이 어긋나 있어서, 달이 <b>교점 가까이에서 삭·망이 되는 기간</b>이 약 173일마다 돌아옵니다. 그래서 식은 흩어져 있지 않고 <b>몰려서</b> 일어납니다. 이 모형이 짚어 낸 날짜에 실제로 2024-04-08, 2024-10-02, 2025-03-14, 2025-09-07의 식이 있었습니다.");
        ep.clear(3); ep.clear(4);
      }
    }
    canvas._redraw = draw;
    $("c-n").addEventListener("input", function (e) { n = +e.target.value; $("c-n-val").textContent = n + "번째"; draw(); });
    segWire("c-sf", function (b) { kind = b.getAttribute("data-k"); draw(); });
    draw(); mission();

    window.sthSort({
      mount: "c-sort",
      buckets: [
        { id: "sol", label: "일식", sub: "달이 태양을 가린다" },
        { id: "lun", label: "월식", sub: "달이 지구 그림자에 들어간다" },
        { id: "no", label: "식이 아니다", sub: "그런 일은 일어나지 않는다" }
      ],
      items: [
        { t: "달이 <b>삭</b>일 때, 교점 가까이에 있다", a: "sol", why: "삭 + 교점 부근 = 일식입니다. 태양–달–지구 차례로 놓입니다." },
        { t: "달이 <b>망</b>일 때, 교점 가까이에 있다", a: "lun", why: "망 + 교점 부근 = 월식입니다. 태양–지구–달 차례로 놓입니다." },
        { t: "달이 멀어서 태양을 다 못 가리고 <b>반지 모양</b>이 남는다", a: "sol", why: "<b>금환 일식</b>입니다. 본그림자 원뿔이 지표에 못 미친 경우입니다.", hint: "가려지는 쪽이 태양인지 달인지 보세요." },
        { t: "가려지기 시작하는 쪽이 태양의 <b>서쪽</b> 가장자리다", a: "sol", why: "달이 서에서 동으로 공전하므로 태양의 서쪽 가장자리부터 가려집니다." },
        { t: "가려진 달이 <b>붉게</b> 보인다", a: "lun", why: "개기 월식 때 지구 대기를 지나며 휘어진 붉은빛이 달에 닿아 붉게 보입니다.", hint: "지구 그림자 속에서 일어나는 일입니다." },
        { t: "지구 전체에서 동시에 같은 모습으로 보인다", a: "lun", why: "월식은 달 자체가 어두워지는 것이라, 달이 보이는 곳이면 어디서나 같은 모습입니다." },
        { t: "좁은 띠 위에서만 볼 수 있고, 띠 밖에서는 부분만 가려진다", a: "sol", why: "본그림자 띠는 폭이 200 km 남짓밖에 되지 않습니다.", hint: "그림자가 지표에 만드는 자국의 크기를 떠올려 보세요." },
        { t: "삭일 때마다, 그러니까 한 달에 한 번씩 일어난다", a: "no", why: "백도면이 5.1° 기울어져 있어 그렇지 않습니다. 달이 교점 가까이에 있을 때의 삭이라야 일식입니다.", hint: "이 이야기 전체가 이것을 뒤집기 위한 것이었습니다." },
        { t: "상현달일 때 태양이 가려진다", a: "no", why: "상현은 달이 태양에서 90° 떨어진 때라 태양을 가릴 수 없습니다.", hint: "태양을 가리려면 달이 태양과 같은 방향에 있어야 합니다." }
      ],
      onDone: function () { G.q = true; window.sthState("cWhen", G); mission(); }
    });
    mission();
  })();

  function finish() { window.sthState("r3", "해결 · 백도면 5.1° 기울기가 식한을 만들고, 달까지의 거리가 개기와 금환을 가른다"); }
  function vsC() {
    var p = window.sthState("c-p") || "";
    $("c-vs").innerHTML = "<b>나의 첫 예상</b> " + (p || "기록 없음") + "<br>" +
      (p.indexOf("㉡") === 0 ? "정확했습니다. 기울기를 0°로 두어 보면 삭마다 일식이 일어납니다 — 5.1°가 그것을 막고 있었습니다."
        : "㉡ 이 정답이었습니다. 달의 크기 문제도, 지구 그림자 문제도 아닙니다. 삭일 때 달은 지구 그림자와 반대쪽(태양 쪽)에 있습니다.");
  }
  vsC();
  ep.onShow(vsC);
  window.sthWork({
    mount: "wkC", unitLabel: "[지구과학 Ⅲ-1] 이야기 ③ 그림자가 지나간 자리",
    items: [
      { id: "c1", label: "삭마다 일식이 아닌 까닭", hint: "‘식한’이라는 말을 넣어, 달의 황위로 설명하세요.",
        ph: "달의 공전 궤도면은 황도면에 약 (      )° 기울어져 있어서, 삭이 되어도 (          )." },
      { id: "c2", label: "동아리 2학년에게 보내는 답장", hint: "같은 일식인데 어떤 날은 개기, 어떤 날은 금환이 되는 까닭을 <b>거리</b>와 <b>시반지름</b>으로 설명하세요." }
    ]
  });
})();

/* ========================================================================= 04 정리하기 */
window.sthWork({
  mount: "wk", unitLabel: "[지구과학 Ⅲ-1] 태양계 행성의 겉보기 운동 · [12지구03-01] — 정리",
  recap: [
    { key: "r1", label: "① 거꾸로 가는 별" },
    { key: "r2", label: "② 해 지고 나서 한 시간" },
    { key: "r3", label: "③ 그림자가 지나간 자리" },
    { key: "rQuiz", label: "수준별 문제" },
    { key: "rLab", label: "응용 실험실" },
    { key: "rInq", label: "교과서 실험" },
    { key: "rReal", label: "실제 자료" }
  ],
  items: [
    { id: "all", label: "세 사건을 꿰는 한 문장",
      hint: "세 이야기 모두 <b>하늘에서 보이는 것</b>과 <b>실제로 일어나는 일</b>이 달랐습니다. 역행, 금성이 보이는 시각, 식이 일어나는 날 — 이 셋에서 ‘보이는 것’을 ‘실제 배치’로 바꿔 읽으려면 무엇을 알아야 했는지 한 문장으로 쓰세요." },
    { id: "w4", label: "아직 헷갈리는 것", hint: "설명하기 어려웠던 지점을 한 문장으로 적어 두세요. 다음 시간에 여기서부터 시작합니다." }
  ]
});

/* ========================================================================= 05 우리 반 */
window.sthShare({
  mount: "share", unit: "eshs-3-1", unitLabel: "[지구과학 Ⅲ-1] 태양계 행성의 겉보기 운동",
  rows: [
    { key: "r1", label: "① 거꾸로 가는 별" },
    { key: "r2", label: "② 해 지고 나서 한 시간" },
    { key: "r3", label: "③ 그림자가 지나간 자리" },
    { key: "rQuiz", label: "수준별 문제" },
    { key: "rLab", label: "응용 실험실" },
    { key: "rInq", label: "교과서 실험" },
    { key: "rReal", label: "실제 자료" }
  ],
  line: { id: "all", label: "세 사건을 꿰는 한 문장" }
});

})();
