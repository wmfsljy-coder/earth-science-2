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
/* 글자가 캔버스 밖으로 나가지 않도록 x 를 살짝 밀어 넣는다 */
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
  ctx.beginPath(); ctx.rect(x0, y0, w, h); ctx.clip();
  var g = ctx.createLinearGradient(0, y0, 0, y0 + h);
  g.addColorStop(0, "#0a1424"); g.addColorStop(1, "#111f33");
  ctx.fillStyle = g; ctx.fillRect(x0, y0, w, h);

  var i, s, sx, sy;
  for (i = 0; i < STARS.length; i++) {
    s = STARS[i];
    if (Math.abs(wrap180(s.lam - lamC)) > spanDeg / 2 + 2) continue;
    sx = toX(s.lam); sy = y0 + h / 2 + s.b * (h / 44);
    if (sy < y0 + 6 || sy > y0 + h - 6) continue;
    ctx.globalAlpha = 0.35 + 0.65 * s.m;
    ctx.fillStyle = "#dbe7f7";
    ctx.beginPath(); ctx.arc(sx, sy, 0.5 + 2.0 * s.m, 0, 6.2832); ctx.fill();
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
  ctx.strokeStyle = withA(v("--line"), 1); ctx.lineWidth = 2;
  ctx.strokeRect(x0 + 1, y0 + 1, w - 2, h - 2);
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

    function draw() {
      paper(ctx, W, H);
      var Hh = tnow - ttran, Hdeg = Hh * 15, s = altAz(Hdeg);
      var X0 = 70, X1 = 830, HY = 330, TOP = 66;

      text(ctx, "남쪽을 바라본 하늘 — 천구 적도 위의 별 하나 (위도 36.5°)", 60, 34, { s: 14, w: "900" });

      /* 하늘 상자 */
      ctx.save();
      ctx.beginPath(); ctx.rect(X0, TOP, X1 - X0, HY - TOP); ctx.clip();
      var gg = ctx.createLinearGradient(0, TOP, 0, HY);
      gg.addColorStop(0, "#0a1424"); gg.addColorStop(1, "#16263d");
      ctx.fillStyle = gg; ctx.fillRect(X0, TOP, X1 - X0, HY - TOP);
      for (var i = 0; i < STARS.length; i += 3) {
        var st = STARS[i];
        var bx = X0 + ((st.lam * 2.11 + tnow * 41) % (X1 - X0));
        var by = TOP + ((st.b + 17) / 34) * (HY - TOP);
        ctx.globalAlpha = 0.25 + 0.5 * st.m;
        ctx.fillStyle = "#cfe0f5";
        ctx.beginPath(); ctx.arc(bx, by, 0.5 + 1.5 * st.m, 0, 6.2832); ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.restore();
      ctx.strokeStyle = v("--line"); ctx.lineWidth = 2;
      ctx.strokeRect(X0, TOP, X1 - X0, HY - TOP);

      /* 고도 눈금 */
      [0, 20, 40, 60].forEach(function (al) {
        var y = HY - al / 70 * (HY - TOP);
        if (y < TOP + 6) return;
        ctx.strokeStyle = "rgba(160,180,210,.22)"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(X0, y); ctx.lineTo(X1, y); ctx.stroke();
        text(ctx, al + "°", X0 + 6, y - 4, { s: 10, c: "rgba(190,208,232,.7)" });
      });

      /* 별의 자리 */
      var sx = clamp((X0 + X1) / 2 + (s.az / 90) * ((X1 - X0) / 2), X0 + 8, X1 - 8);
      var sy = HY - clamp(s.alt, -4, 70) / 70 * (HY - TOP);
      var above = s.alt > 0;
      ctx.fillStyle = above ? "#ffe6a3" : "rgba(160,180,210,.45)";
      ctx.beginPath(); ctx.arc(sx, sy, above ? 9 : 6, 0, 6.2832); ctx.fill();
      if (above) {
        ctx.strokeStyle = "rgba(255,255,255,.9)"; ctx.lineWidth = 1.5; ctx.stroke();
      }
      text(ctx, above ? "★ 이 별" : "★ 지평선 아래", clamp(sx, X0 + 60, X1 - 60), sy - 18,
        { s: 12, a: "center", w: "900", c: above ? "#ffe6a3" : "rgba(190,208,232,.8)" });

      /* 별이 하루 동안 그리는 길 */
      ctx.strokeStyle = "rgba(255,230,163,.30)"; ctx.lineWidth = 1.6; ctx.setLineDash([5, 5]);
      ctx.beginPath();
      var started = false;
      for (var hh = -6; hh <= 6; hh += 0.25) {
        var q = altAz(hh * 15);
        if (q.alt < 0) { started = false; continue; }
        var qx = clamp((X0 + X1) / 2 + (q.az / 90) * ((X1 - X0) / 2), X0, X1);
        var qy = HY - clamp(q.alt, 0, 70) / 70 * (HY - TOP);
        if (!started) { ctx.moveTo(qx, qy); started = true; } else ctx.lineTo(qx, qy);
      }
      ctx.stroke(); ctx.setLineDash([]);

      /* 지평선과 관측자 */
      ctx.strokeStyle = withA(v("--ink"), 0.35); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(X0, HY); ctx.lineTo(X1, HY); ctx.stroke();
      text(ctx, "지평선", (X0 + X1) / 2, HY + 18, { s: 11.5, a: "center", w: "700", c: v("--mist") });
      text(ctx, "남", (X0 + X1) / 2, HY + 40, { s: 13, a: "center", w: "900" });
      text(ctx, "↑ 관측자가 바라보는 방향", (X0 + X1) / 2, HY + 58, { s: 11, a: "center", c: v("--mist") });

      /* 학생이 붙인 이름표 */
      if (G.tag) {
        var el = G.tag === "left";
        text(ctx, el ? "동" : "서", X0 + 16, HY - 14, { s: 17, w: "900", c: "#8ad9f5" });
        text(ctx, el ? "서" : "동", X1 - 16, HY - 14, { s: 17, a: "right", w: "900", c: "#8ad9f5" });
      } else {
        text(ctx, "동 · 서 이름표를 아직 붙이지 않았습니다", (X0 + X1) / 2, HY - 14,
          { s: 12.5, a: "center", w: "700", c: "rgba(210,225,245,.8)" });
      }

      /* 흐르는 방향 화살표 */
      var ay = TOP + 26, ax0 = X0 + 250, ax1 = X0 + 430;
      ctx.strokeStyle = "rgba(255,180,120,.95)"; ctx.fillStyle = "rgba(255,180,120,.95)"; ctx.lineWidth = 2.5;
      window.drawArrow(ctx, ax0 + (tick % 6), ay, ax1 + (tick % 6), ay, 9);
      text(ctx, "시각이 지날수록 별은 이쪽으로 흐릅니다", ax1 + 14, ay + 4, { s: 11.5, w: "800", c: "rgba(255,200,150,.95)" });

      /* 아래 계기판 */
      text(ctx, "시간각", 70, 398, { s: 11, w: "800", c: v("--mist") });
      text(ctx, (Hh >= 0 ? "+" : "") + Hh.toFixed(2) + " 시간", 70, 420, { s: 16, w: "900", c: v("--brand-700") });
      text(ctx, "고도", 230, 398, { s: 11, w: "800", c: v("--mist") });
      text(ctx, s.alt.toFixed(1) + "°", 230, 420, { s: 16, w: "900" });
      text(ctx, "방위 (남에서)", 340, 398, { s: 11, w: "800", c: v("--mist") });
      text(ctx, (s.az >= 0 ? "오른쪽 " : "왼쪽 ") + Math.abs(s.az).toFixed(0) + "°", 340, 420, { s: 16, w: "900" });
      text(ctx, "뜨는 시각 " + hourLabel(ttran - 6) + "  ·  남중 " + hourLabel(ttran), 520, 398, { s: 12, w: "800", c: v("--mist") });
      text(ctx, "지는 시각 " + hourLabel(ttran + 6), 520, 420, { s: 12, w: "800", c: v("--mist") });

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
        window.sthMission("m-a2", true, "<span class='m-tag'>미션 완료</span>별은 <b>왼쪽(동)에서 떠서 오른쪽(서)으로</b> 집니다. 지도는 북쪽을 위로 두어 오른쪽이 동쪽이지만, 천구에서 천체의 이동 방향을 말할 때는 <b>남쪽을 바라볼 때</b>가 기준이라 좌우가 뒤집힙니다. 이제 ‘서에서 동으로’ 와 ‘동에서 서로’ 를 제대로 읽을 수 있습니다.");
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
    anim(canvas, function () { tick++; draw(); });
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
      paper(ctx, W, H);
      var dd = D0 + day, g = geo(planet, dd);
      var col = withA(v(ORB[planet].c), 1);

      /* 천구 */
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
      ctx.lineWidth = 3; ctx.lineCap = "round"; ctx.lineJoin = "round";
      for (i = 1; i < trail.length; i++) {
        p = trail[i - 1]; q = trail[i];
        if (Math.abs(wrap180(p.lam - lamC)) > span / 2 || Math.abs(wrap180(q.lam - lamC)) > span / 2) continue;
        dl = wrap180(q.lam - p.lam); sgn = dl >= 0 ? 1 : -1;
        ctx.strokeStyle = sgn > 0 ? withA(v("--brand"), .95) : withA(v("--coral"), .95);
        ctx.beginPath(); ctx.moveTo(toX(p.lam), toY(p.beta)); ctx.lineTo(toX(q.lam), toY(q.beta)); ctx.stroke();
      }
      var prevS = null;
      for (i = 1; i < trail.length; i++) {
        dl = wrap180(trail[i].lam - trail[i - 1].lam); sgn = dl >= 0 ? 1 : -1;
        if (prevS !== null && sgn !== prevS && Math.abs(wrap180(trail[i].lam - lamC)) <= span / 2) {
          var ux = toX(trail[i].lam), uy = toY(trail[i].beta);
          ctx.strokeStyle = withA(v("--amber"), 1); ctx.lineWidth = 2.5;
          ctx.beginPath(); ctx.arc(ux, uy, 8, 0, 6.2832); ctx.stroke();
          ctx.fillStyle = withA(v("--amber"), 1);
          text(ctx, "유", ux, uy - 16, { s: 12, a: "center", w: "900", c: withA(v("--amber"), 1) });
        }
        prevS = sgn;
      }
      var px = toX(g.lam), py = toY(g.beta);
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(px, py, 7, 0, 6.2832); ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,.85)"; ctx.lineWidth = 1.6; ctx.stroke();
      text(ctx, planet, clamp(px, 50, 850), py - 16, { s: 12.5, a: "center", w: "900", c: "#eef4ff" });
      if (Math.abs(wrap180(g.lamSun - lamC)) <= span / 2) {
        var sxx = toX(g.lamSun);
        ctx.fillStyle = "rgba(255,200,90,.95)";
        ctx.beginPath(); ctx.arc(sxx, toY(0), 9, 0, 6.2832); ctx.fill();
        text(ctx, "태양", clamp(sxx, 50, 850), toY(0) - 20, { s: 12, a: "center", w: "900", c: "rgba(255,220,150,1)" });
      }
      text(ctx, "천구 · 배경별을 기준으로 본 하늘 (황위는 보기 쉽게 확대)", SKY.x + SKY.w / 2, SKY.y + SKY.h - 12,
        { s: 11, a: "center", c: "rgba(200,216,240,.8)" });
      text(ctx, "동", SKY.x + 12, SKY.y + SKY.h - 32, { s: 13, w: "900", c: "rgba(150,210,255,.95)" });
      text(ctx, "서", SKY.x + SKY.w - 12, SKY.y + SKY.h - 32, { s: 13, a: "right", w: "900", c: "rgba(150,210,255,.95)" });

      ctx.strokeStyle = withA(v("--mist"), .5); ctx.lineWidth = 1.5; ctx.setLineDash([4, 5]);
      ctx.beginPath(); ctx.moveTo(px, SKY.y + SKY.h); ctx.lineTo(px, SKY.y + SKY.h + 22); ctx.stroke();
      ctx.setLineDash([]);
      text(ctx, "↑ 이 시선이 하늘의 이 지점을 가리킵니다", clamp(px, 140, 760), SKY.y + SKY.h + 36,
        { s: 11, a: "center", c: v("--mist") });

      /* 궤도면 */
      var a = ORB[planet].a;
      var S = OB.R / (a > 2 ? a * 1.08 : a * 1.25);
      var cx = OB.cx, cy = OB.cy, E = g.E, P = g.p;
      ctx.lineWidth = 1.6;
      ["지구", planet].forEach(function (n) {
        ctx.strokeStyle = withA(v(ORB[n].c), .45);
        ctx.beginPath(); ctx.arc(cx, cy, ORB[n].a * S, 0, 6.2832); ctx.stroke();
      });
      ctx.fillStyle = "#ffb02e";
      ctx.beginPath(); ctx.arc(cx, cy, 9, 0, 6.2832); ctx.fill();
      text(ctx, "태양", cx, cy + 24, { s: 11.5, a: "center", w: "700", c: v("--mist") });

      var ex = cx + E.x * S, ey = cy - E.y * S;
      var ppx = cx + P.x * S, ppy = cy - P.y * S;
      ctx.strokeStyle = withA(v("--mist"), .85); ctx.lineWidth = 1.5; ctx.setLineDash([5, 4]);
      var vx = ppx - ex, vy = ppy - ey, vn = Math.hypot(vx, vy) || 1;
      ctx.beginPath(); ctx.moveTo(ex, ey);
      ctx.lineTo(clamp(ex + vx / vn * (OB.R + 46), 10, 890), clamp(ey + vy / vn * (OB.R + 46), 300, H - 30));
      ctx.stroke(); ctx.setLineDash([]);

      ctx.fillStyle = withA(v("--brand"), 1);
      ctx.beginPath(); ctx.arc(ex, ey, ORB["지구"].rad + 1, 0, 6.2832); ctx.fill();
      text(ctx, "지구", ex, ey - 12, { s: 11.5, a: "center", w: "700" });
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(ppx, ppy, ORB[planet].rad + 1.5, 0, 6.2832); ctx.fill();
      text(ctx, planet, ppx, ppy - 12, { s: 11.5, a: "center", w: "700" });

      function arrowOn(name, color) {
        var o = ORB[name], h1 = helio(name, dd), h2 = helio(name, dd + Math.max(3, o.P / 90));
        var x1 = cx + h1.x * S, y1 = cy - h1.y * S, x2 = cx + h2.x * S, y2 = cy - h2.y * S;
        var n = Math.hypot(x2 - x1, y2 - y1);
        if (n < 1) return;
        ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 2.4;
        window.drawArrow(ctx, x1 + (x2 - x1) / n * 12, y1 + (y2 - y1) / n * 12,
                              x1 + (x2 - x1) / n * 34, y1 + (y2 - y1) / n * 34, 7);
      }
      arrowOn("지구", withA(v("--brand"), .9));
      arrowOn(planet, col);
      text(ctx, "공전 궤도면 (위에서 내려다본 모습) — 화살표는 공전 방향입니다", 24, H - 14, { s: 11.5, c: v("--mist") });
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
            + "지금 이각은 <b>" + Math.abs(el).toFixed(0) + "°</b> 입니다."
            + (Math.abs(el) >= 150 ? " 태양의 <b>거의 정반대쪽(충)</b> 이군요 — 외행성이 역행하는 자리입니다."
                                   : (Math.abs(el) <= 30 ? " 태양에 <b>아주 가까운 쪽(내합 부근)</b> 입니다 — 내행성이 역행하는 자리입니다." : ""));
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
      paper(ctx, W, H);
      var dd = D0 + day, g = geo("화성", dd), S = 62;
      text(ctx, "같은 하늘, 두 개의 모형", 60, 30, { s: 14, w: "900" });

      /* 왼쪽 — 태양 중심 */
      var cx = 225, cy = 250;
      ctx.strokeStyle = withA(v("--line"), 1); ctx.lineWidth = 1.5;
      ["지구", "화성"].forEach(function (n) {
        ctx.beginPath(); ctx.arc(cx, cy, ORB[n].a * S, 0, 6.2832); ctx.stroke();
      });
      ctx.fillStyle = "#ffb02e"; ctx.beginPath(); ctx.arc(cx, cy, 8, 0, 6.2832); ctx.fill();
      var ex = cx + g.E.x * S, ey = cy - g.E.y * S, px = cx + g.p.x * S, py = cy - g.p.y * S;
      ctx.strokeStyle = withA(v("--mist"), .8); ctx.lineWidth = 1.4; ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(px, py); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = withA(v("--brand"), 1); ctx.beginPath(); ctx.arc(ex, ey, 5, 0, 6.2832); ctx.fill();
      ctx.fillStyle = withA(v("--coral"), 1); ctx.beginPath(); ctx.arc(px, py, 5, 0, 6.2832); ctx.fill();
      text(ctx, "태양 중심 모형", cx, 62, { s: 13, a: "center", w: "900" });
      text(ctx, "태양이 가운데, 지구와 화성이 각자 돈다", cx, 82, { s: 11.5, a: "center", c: v("--mist") });
      text(ctx, "지구", ex, ey - 11, { s: 11.5, a: "center", w: "700" });
      text(ctx, "화성", px, py - 11, { s: 11.5, a: "center", w: "700" });

      /* 오른쪽 — 지구 중심 + 주전원 */
      var gx = 665, gy = 250;
      var q = epiPos(R, dd);
      var ccx = gx + q.cx * S, ccy = gy - q.cy * S;
      var qx = gx + q.x * S, qy = gy - q.y * S;
      var er = R * S;
      ctx.strokeStyle = withA(v("--line"), 1); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(gx, gy, ORB["화성"].a * S, 0, 6.2832); ctx.stroke();
      if (er > 0.5) {
        ctx.strokeStyle = withA(v("--violet"), .75); ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.arc(ccx, ccy, er, 0, 6.2832); ctx.stroke(); ctx.setLineDash([]);
      }
      ctx.strokeStyle = withA(v("--mist"), .5); ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(ccx, ccy); ctx.stroke();
      ctx.fillStyle = withA(v("--brand"), 1); ctx.beginPath(); ctx.arc(gx, gy, 6, 0, 6.2832); ctx.fill();
      ctx.fillStyle = withA(v("--violet"), 1); ctx.beginPath(); ctx.arc(ccx, ccy, 3.5, 0, 6.2832); ctx.fill();
      ctx.fillStyle = withA(v("--coral"), 1); ctx.beginPath(); ctx.arc(qx, qy, 5, 0, 6.2832); ctx.fill();
      ctx.strokeStyle = withA(v("--mist"), .8); ctx.setLineDash([5, 4]); ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(qx, qy); ctx.stroke(); ctx.setLineDash([]);
      text(ctx, "지구 중심 모형 (주전원)", gx, 62, { s: 13, a: "center", w: "900" });
      text(ctx, "지구가 가운데, 화성은 작은 원 위를 돈다", gx, 82, { s: 11.5, a: "center", c: v("--mist") });
      text(ctx, "지구", gx, gy + 20, { s: 11.5, a: "center", w: "700" });
      text(ctx, "화성", clamp(qx, 470, 880), qy - 11, { s: 11.5, a: "center", w: "700" });
      text(ctx, "주전원 (반지름 " + R.toFixed(2) + " 배)", clamp(ccx, 500, 860), clamp(ccy - er - 10, 100, 430),
        { s: 11.5, a: "center", w: "800", c: withA(v("--violet-700"), 1) });

      /* 아래 — 두 모형의 겉보기 경도 비교 */
      var by = 420, bh = 92, bx = 60, bw = W - 120;
      ctx.fillStyle = withA(v("--card"), 1); ctx.strokeStyle = withA(v("--line"), 1); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.rect(bx, by, bw, bh); ctx.fill(); ctx.stroke();
      text(ctx, "두 모형이 가리키는 겉보기 경도 (가로: 시간, 세로: 경도)", bx + 8, by - 8, { s: 11.5, w: "700", c: v("--mist") });

      var pts = [], i;
      for (i = 0; i <= day; i += 4) pts.push({ u: geo("화성", D0 + i).lam, w: epiLam(R, D0 + i) });
      if (pts.length > 1) {
        var lo = 1e9, hi = -1e9;
        for (i = 0; i < pts.length; i++) { lo = Math.min(lo, pts[i].u, pts[i].w); hi = Math.max(hi, pts[i].u, pts[i].w); }
        var pad = Math.max(4, (hi - lo) * 0.12); lo -= pad; hi += pad;
        text(ctx, hi.toFixed(0) + "°", bx - 6, by + 14, { s: 10.5, a: "right", c: v("--mist") });
        text(ctx, lo.toFixed(0) + "°", bx - 6, by + bh - 4, { s: 10.5, a: "right", c: v("--mist") });
        var X = function (k) { return bx + 8 + (bw - 16) * k / Math.max(1, pts.length - 1); };
        var Y = function (val) { return by + bh - 10 - (bh - 20) * (val - lo) / Math.max(1e-6, hi - lo); };
        ctx.strokeStyle = withA(v("--brand"), 1); ctx.lineWidth = 5; ctx.lineCap = "round";
        ctx.beginPath();
        for (i = 0; i < pts.length; i++) { if (i) ctx.lineTo(X(i), Y(pts[i].u)); else ctx.moveTo(X(i), Y(pts[i].u)); }
        ctx.stroke();
        ctx.strokeStyle = withA(v("--coral"), 1); ctx.lineWidth = 1.8; ctx.setLineDash([6, 5]);
        ctx.beginPath();
        for (i = 0; i < pts.length; i++) { if (i) ctx.lineTo(X(i), Y(pts[i].w)); else ctx.moveTo(X(i), Y(pts[i].w)); }
        ctx.stroke(); ctx.setLineDash([]);
      } else {
        text(ctx, "날짜를 밀면 두 모형의 경도 곡선이 그려집니다", bx + 16, by + bh / 2 + 4, { s: 12, c: v("--mist") });
      }
      ctx.fillStyle = withA(v("--brand"), 1); ctx.fillRect(bx + 8, by + bh + 12, 22, 5);
      text(ctx, "태양 중심", bx + 36, by + bh + 18, { s: 11.5, c: v("--mist") });
      ctx.fillStyle = withA(v("--coral"), 1); ctx.fillRect(bx + 118, by + bh + 14, 22, 2);
      text(ctx, "주전원", bx + 146, by + bh + 18, { s: 11.5, c: v("--mist") });
      text(ctx, "최대 차이 " + mDiff.toFixed(3) + "°  ·  주전원 모형의 유 " + mFlip + "회", bx + 230, by + bh + 18,
        { s: 12, w: "900", c: mDiff < 0.01 ? v("--teal-700") : v("--ink") });
      text(ctx, dateStr(J2000 + dd * 86400000), bx + bw, by + bh + 18, { s: 11.5, a: "right", c: v("--mist") });
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
        ? "<b>두 곡선이 완전히 겹쳤습니다.</b> 주전원 반지름을 <b>지구 궤도 반지름과 같게</b> 두면, ‘태양에서 화성으로 그은 화살표 + 지구에서 태양으로 그은 화살표’ 와 ‘지구에서 화성으로 그은 화살표’ 가 같은 것이 되어 두 모형이 가리키는 방향은 <b>수학적으로 똑같아집니다</b>. 그래서 프톨레마이오스도 역행을 설명할 수 있었습니다."
        : (mFlip === 0
          ? "<b>주전원이 너무 작습니다.</b> 화성이 작은 원을 도는 속도가 느려서, 지구에서 본 방향이 <b>한 번도 되돌아가지 않습니다</b> — 역행이 아예 나타나지 않습니다. 주전원은 역행을 만들어 내기 위한 장치였습니다."
          : "역행은 나타나지만 두 모형이 가리키는 방향이 최대 <b>" + mDiff.toFixed(2) + "°</b> 어긋납니다. 하늘에서 " + mDiff.toFixed(2) + "° 는 보름달 지름의 " + (mDiff / 0.52).toFixed(0) + "배가 넘습니다. 반지름을 더 맞춰 보세요.");
      draw();
    }
    function mission() {
      if (G.a) done("m-a4a"); if (G.b) done("m-a4b"); if (G.c) done("m-a4c");
      if (G.a && G.b && G.c) {
        window.sthMission("m-a4", true, "<span class='m-tag'>미션 완료</span>주전원 반지름이 <b>지구 궤도 반지름과 같을 때</b> 두 모형은 차이가 0.00° 로 포개집니다. 주전원은 사실 <b>지구의 공전을 다른 이름으로 부른 것</b>이었습니다. 역행 하나만으로는 두 우주관을 가를 수 없었다는 뜻이지요.");
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
      { id: "w2", label: "별자리에 대해 동에서 서로 움직인 행성", hint: "장면 3 에서 화성·금성·목성의 날짜를 밀어 보고, 배경별에 대해 <b>동에서 서로</b> 이동한(역행한) 날짜를 하나 찾아 쓰세요. 그때 그 행성의 이각이 얼마였는지도 함께 적으면 좋습니다.",
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
    ctx.fillStyle = "#3a3f52";
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.2832); ctx.fill();
    ctx.fillStyle = "#ffd27a";
    ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI / 2, Math.PI / 2, el < 0); ctx.closePath(); ctx.fill();
    var lit = 2 * k - 1;
    ctx.beginPath(); ctx.ellipse(cx, cy, Math.abs(lit) * r, r, 0, 0, 6.2832);
    ctx.fillStyle = (lit >= 0) ? "#ffd27a" : "#3a3f52"; ctx.fill();
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

    function draw() {
      paper(ctx, W, H);
      var inner = a < 1, e = maxE(a);
      text(ctx, "지구에서 그은 시선이 행성 궤도에 접할 때 — 그것이 최대 이각", 60, 32, { s: 14, w: "900" });

      var cx = 290, cy = 240, S = 150 / Math.max(1.18, a * 1.1);
      ctx.strokeStyle = withA(v("--line"), 1); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(cx, cy, S, 0, 6.2832); ctx.stroke();
      ctx.strokeStyle = withA(v("--violet"), .85); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx, cy, a * S, 0, 6.2832); ctx.stroke();
      ctx.fillStyle = "#ffb02e"; ctx.beginPath(); ctx.arc(cx, cy, 10, 0, 6.2832); ctx.fill();
      text(ctx, "태양", cx, cy + 26, { s: 11.5, a: "center", w: "700", c: v("--mist") });

      var ex = cx + S, ey = cy;
      ctx.fillStyle = withA(v("--brand"), 1); ctx.beginPath(); ctx.arc(ex, ey, 6, 0, 6.2832); ctx.fill();
      text(ctx, "지구", Math.min(ex + 10, 520), ey + 4, { s: 12, w: "800" });
      text(ctx, "지구 궤도 1 AU", cx, cy - S - 10, { s: 11, a: "center", c: v("--mist") });

      ctx.strokeStyle = withA(v("--mist"), .8); ctx.lineWidth = 1.4; ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(cx, cy); ctx.stroke(); ctx.setLineDash([]);

      if (inner) {
        var tx = a * a, ty = a * Math.sqrt(Math.max(0, 1 - a * a));
        [1, -1].forEach(function (sg) {
          var px = cx + tx * S, py = cy - sg * ty * S;
          ctx.strokeStyle = withA(v("--amber"), .95); ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(px + (px - ex) * 0.22, py + (py - ey) * 0.22); ctx.stroke();
          ctx.fillStyle = withA(v("--violet"), 1);
          ctx.beginPath(); ctx.arc(px, py, 6, 0, 6.2832); ctx.fill();
          text(ctx, sg > 0 ? "동방 최대 이각" : "서방 최대 이각", clamp(px - 14, 110, 470), py + (sg > 0 ? -14 : 20),
            { s: 11.5, a: "right", w: "800", c: withA(v("--violet-700"), 1) });
        });
        ctx.strokeStyle = withA(v("--amber"), .9); ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(ex, ey, 52, Math.PI - e * D2R, Math.PI + e * D2R); ctx.stroke();
        text(ctx, e.toFixed(1) + "°", Math.max(ex - 68, 90), ey + 5, { s: 15, a: "right", w: "900", c: withA(v("--amber-700"), 1) });
      } else {
        var ox = clamp(cx - a * S, 70, 520), oy = cy;
        ctx.strokeStyle = withA(v("--amber"), .95); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(ox, oy); ctx.stroke();
        ctx.fillStyle = withA(v("--violet"), 1);
        ctx.beginPath(); ctx.arc(ox, oy, 6, 0, 6.2832); ctx.fill();
        text(ctx, "충 (이각 180°)", ox, oy - 14, { s: 11.5, a: "center", w: "800", c: withA(v("--violet-700"), 1) });
        text(ctx, "행성이 태양의 정반대쪽까지 갈 수 있습니다", 60, 402, { s: 12, c: v("--mist") });
      }

      /* 오른쪽 계산판 */
      var px2 = 570;
      text(ctx, "계산", px2, 74, { s: 12, w: "800", c: v("--mist") });
      ctx.strokeStyle = v("--line"); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(px2, 86); ctx.lineTo(866, 86); ctx.stroke();
      text(ctx, "행성 궤도 반지름", px2, 116, { s: 11.5, w: "800", c: v("--mist") });
      text(ctx, a.toFixed(2) + " AU", px2, 144, { s: 22, w: "900", c: v("--brand-700") });
      text(ctx, inner ? "내행성 (지구보다 안쪽)" : "외행성 (지구보다 바깥쪽)", px2, 172, { s: 13, w: "800" });
      text(ctx, "최대 이각", px2, 212, { s: 11.5, w: "800", c: v("--mist") });
      text(ctx, inner ? "sin⁻¹(" + a.toFixed(2) + ") = " + e.toFixed(1) + "°" : "180° (한계 없음)",
        px2, 244, { s: 22, w: "900", c: v("--teal-700") });
      text(ctx, inner ? "해가 지고 " + (e / 15).toFixed(1) + "시간이면 이 행성도 집니다" : "충 부근이면 한밤중에 남중합니다",
        px2, 274, { s: 12.5, c: v("--mist") });

      var REF = [["수성", 0.39], ["금성", 0.72], ["지구", 1.00], ["화성", 1.52]];
      var ry = 314;
      REF.forEach(function (r) {
        var on = Math.abs(a - r[1]) < 0.02;
        text(ctx, r[0] + " " + r[1].toFixed(2) + " AU", px2, ry, { s: 12, w: on ? "900" : "600", c: on ? v("--teal-700") : v("--mist") });
        text(ctx, r[1] < 1 ? "최대 이각 " + (Math.asin(r[1]) * R2D).toFixed(0) + "°" : "최대 이각 없음",
          px2 + 150, ry, { s: 12, w: on ? "900" : "600", c: on ? v("--teal-700") : v("--mist") });
        ry += 24;
      });
      text(ctx, "궤도를 완전한 원으로 어림한 값입니다.", 60, 424, { s: 11.5, c: v("--mist") });

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
        : "궤도 반지름이 <b>1 AU 보다 큰</b> 외행성에는 최대 이각이 없습니다. 지구가 행성과 태양 사이에 들어가면 이각이 <b>180°(충)</b> 까지 커지므로, "
          + "해 질 때 떠서 <b>자정에 남중</b>하고 해 뜰 때 집니다. 한밤중에도 볼 수 있다는 뜻입니다.";
    }
    function mission() {
      if (G.a) done("m-b2a"); if (G.b) done("m-b2b"); if (G.c) done("m-b2c");
      if (G.a && G.b && G.c) {
        window.sthMission("m-b2", true, "<span class='m-tag'>미션 완료</span>내행성의 최대 이각은 <b>sin⁻¹(행성 궤도 반지름 ÷ 지구 궤도 반지름)</b> 입니다 — 수성은 약 <b>23°</b>, 금성은 약 <b>46°</b>. 외행성은 지구가 안쪽에 있으므로 이각에 한계가 없습니다.");
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
      var g = c.getContext("2d"); g.scale(2, 2);
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
      paper(ctx, W, H);
      var dd = BASE + day, g = geo(planet, dd), a = ORB[planet].a;
      var S = 165 / Math.max(1.25, a * 1.1), cx = 300, cy = H / 2;

      text(ctx, "이각 하나로 ‘언제 어느 쪽 하늘에서’ 가 정해진다", 60, 30, { s: 14, w: "900" });
      ctx.strokeStyle = withA(v("--line"), 1); ctx.lineWidth = 1.5;
      ["지구", planet].forEach(function (n) {
        ctx.beginPath(); ctx.arc(cx, cy, ORB[n].a * S, 0, 6.2832); ctx.stroke();
      });
      var ex = cx + g.E.x * S, ey = cy - g.E.y * S;
      var px = cx + g.p.x * S, py = cy - g.p.y * S;

      var aS = Math.atan2(cy - ey, cx - ex), aP = Math.atan2(py - ey, px - ex);
      var sweep = ((aP - aS + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      ctx.strokeStyle = withA(v("--amber"), .9); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(ex, ey, 46, aS, aS + sweep, sweep < 0); ctx.stroke();
      var aMid = aS + sweep / 2;
      text(ctx, "이각 " + Math.abs(g.elong).toFixed(0) + "°",
        clamp(ex + Math.cos(aMid) * 70, 70, 520), clamp(ey + Math.sin(aMid) * 70 + 4, 40, 440),
        { s: 13, a: "center", w: "900", c: withA(v("--amber-700"), 1) });

      ctx.strokeStyle = withA(v("--mist"), .8); ctx.lineWidth = 1.5; ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(px, py); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(cx, cy); ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = "#ffb02e"; ctx.beginPath(); ctx.arc(cx, cy, 10, 0, 6.2832); ctx.fill();
      text(ctx, "태양", cx, cy + 26, { s: 12, a: "center", w: "700" });
      ctx.fillStyle = withA(v("--brand"), 1); ctx.beginPath(); ctx.arc(ex, ey, 6, 0, 6.2832); ctx.fill();
      text(ctx, "지구", ex, ey - 14, { s: 12, a: "center", w: "700" });
      ctx.fillStyle = withA(v(ORB[planet].c), 1);
      ctx.beginPath(); ctx.arc(px, py, ORB[planet].rad + 1.5, 0, 6.2832); ctx.fill();
      text(ctx, planet, clamp(px, 60, 540), py - 14, { s: 12, a: "center", w: "700" });

      var bx = 580, bw = 290, by = 96, bh = 230;
      ctx.fillStyle = withA(v("--card"), 1); ctx.strokeStyle = withA(v("--line"), 1); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.rect(bx, by, bw, bh); ctx.fill(); ctx.stroke();
      text(ctx, "하루 동안 지평선 위에 있는 시간", bx, by - 14, { s: 13, w: "900" });
      var hours = ["18시", "21시", "24시", "03시", "06시"], hv = [18, 21, 24, 27, 30];
      for (var i = 0; i < hv.length; i++) {
        var yy = by + 26 + i * ((bh - 50) / 4), m = marginH(g.elong, hv[i] % 24);
        var wpx = clamp(m, 0, 6) / 6 * (bw - 116);
        text(ctx, hours[i], bx + 10, yy + 4, { s: 11.5, w: "700", c: v("--mist") });
        ctx.fillStyle = withA(v("--line"), 1); ctx.fillRect(bx + 56, yy - 7, bw - 116, 14);
        ctx.fillStyle = m >= 0.5 ? withA(v("--green"), .95) : (m > 0 ? withA(v("--amber"), .95) : withA(v("--rose"), .55));
        ctx.fillRect(bx + 56, yy - 7, Math.max(3, wpx), 14);
        text(ctx, m > 0 ? "고도 여유 " + m.toFixed(1) + "h" : "지평선 아래", bx + bw - 8, yy + 4,
          { s: 11, a: "right", w: "700" });
      }
      var rs = riseSet(g.elong);
      text(ctx, "뜨는 시각 " + hhmm(rs.rise) + " · 남중 " + hhmm(rs.transit) + " · 지는 시각 " + hhmm(rs.set),
        bx, by + bh + 22, { s: 11.5, c: v("--mist") });
      text(ctx, "밝게 보이는 비율 " + Math.round(g.k * 100) + "%  ·  지구까지 " + g.dist.toFixed(2) + " AU",
        bx, by + bh + 44, { s: 11.5, c: v("--mist") });
      phaseDisc(ctx, bx + 262, by + bh + 36, 16, g.k, g.elong);
      text(ctx, "모아 둔 줄 " + extra.length + " / 6", 60, 444, { s: 12.5, w: "900", c: extra.length >= 3 ? v("--teal-700") : v("--mist") });
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
          ? "이각이 <b>동방</b> 이므로 행성이 태양보다 <b>늦게</b> 집니다. 해가 진 뒤 <b>서쪽 하늘</b>에서 찾으세요."
          : "이각이 <b>서방</b> 이므로 행성이 태양보다 <b>먼저</b> 뜹니다. 해 뜨기 전 <b>동쪽 하늘</b>에서 찾으세요.")
        + (Math.abs(el) >= 150 ? " 지금은 <b>충</b> 부근입니다 — 해 질 때 떠서 자정에 남중하므로 밤새 볼 수 있습니다."
          : (Math.abs(el) <= 10 ? " 지금은 <b>합</b> 부근이라 태양과 거의 같은 방향입니다 — 햇빛에 묻혀 볼 수 없습니다." : ""))
        + " 표의 ‘관측 가능 시각’ 은 이각에서 계산한 것이고, <b>관측되는 모양</b> 은 밝게 보이는 비율입니다.";
      draw();
    }
    function mission() {
      if (G.a) done("m-b3a"); if (G.b) done("m-b3b"); if (G.c) done("m-b3c");
      var rows = Math.max(extra.length, G.rows || 0);
      if (rows >= 3) done("m-b3d");
      if (G.a && G.b && G.c && rows >= 3) {
        window.sthMission("m-b3", true, "<span class='m-tag'>미션 완료</span>금성은 최대 이각 부근에서도 초저녁이나 새벽에만 보이고, 한밤중 칸은 언제나 <b>X</b> 입니다. 반대로 외행성은 <b>충</b>(이각 180°) 부근에서 밤새 볼 수 있습니다. 개밥바라기(동방 이각)와 샛별(서방 이각)은 <b>같은 금성</b>이었습니다.");
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
      paper(ctx, W, H);
      var g = geo("금성", BASE + day), p = ptolemy(g.elong);
      var dia = 16.68 / g.dist, pdia = 16.68 / p.rho;
      text(ctx, "갈릴레이의 금성 — 두 모형이 예측하는 모양과 크기", 60, 30, { s: 14, w: "900" });

      /* 왼쪽 — 태양 중심 예측 */
      text(ctx, "태양 중심 모형의 예측", 180, 68, { s: 13, a: "center", w: "900", c: v("--brand-700") });
      phaseDisc(ctx, 180, 152, discR(dia), g.k, g.elong);
      text(ctx, "밝은 비율 " + Math.round(g.k * 100) + "%", 180, 220, { s: 13, a: "center", w: "900" });
      text(ctx, "시직경 " + dia.toFixed(1) + "″", 180, 242, { s: 12.5, a: "center", c: v("--mist") });
      text(ctx, "금성까지 " + g.dist.toFixed(3) + " AU", 180, 262, { s: 12, a: "center", c: v("--mist") });

      /* 오른쪽 — 지구 중심(주전원) 예측 */
      text(ctx, "지구 중심(주전원) 모형의 예측", 700, 68, { s: 13, a: "center", w: "900", c: withA(v("--violet-700"), 1) });
      phaseDisc(ctx, 700, 152, discR(pdia), p.k, g.elong);
      text(ctx, "밝은 비율 " + Math.round(p.k * 100) + "%", 700, 220, { s: 13, a: "center", w: "900" });
      text(ctx, "시직경 " + pdia.toFixed(1) + "″", 700, 242, { s: 12.5, a: "center", c: v("--mist") });
      text(ctx, "금성은 늘 지구와 태양 사이", 700, 262, { s: 12, a: "center", c: v("--mist") });

      /* 가운데 — 실제 배치 */
      var cx = 440, cy = 150;
      ctx.strokeStyle = withA(v("--line"), 1); ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(cx, cy, 58, 0, 6.2832); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, 42, 0, 6.2832); ctx.stroke();
      ctx.fillStyle = "#ffb02e"; ctx.beginPath(); ctx.arc(cx, cy, 7, 0, 6.2832); ctx.fill();
      var eA = Math.atan2(g.E.y, g.E.x), vA = Math.atan2(g.p.y, g.p.x);
      var exx = cx + Math.cos(eA) * 58, eyy = cy - Math.sin(eA) * 58;
      var vxx = cx + Math.cos(vA) * 42, vyy = cy - Math.sin(vA) * 42;
      ctx.strokeStyle = withA(v("--mist"), .7); ctx.setLineDash([4, 4]); ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(exx, eyy); ctx.lineTo(vxx, vyy); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = withA(v("--brand"), 1); ctx.beginPath(); ctx.arc(exx, eyy, 5, 0, 6.2832); ctx.fill();
      ctx.fillStyle = withA(v("--violet"), 1); ctx.beginPath(); ctx.arc(vxx, vyy, 5, 0, 6.2832); ctx.fill();
      text(ctx, "실제 배치 (태양·지구·금성)", cx, cy + 84, { s: 11.5, a: "center", w: "800", c: v("--mist") });
      text(ctx, dateStr(J2000 + (BASE + day) * 86400000), cx, cy + 106, { s: 13, a: "center", w: "900" });
      text(ctx, "이각 " + (g.elong >= 0 ? "동방 " : "서방 ") + Math.abs(g.elong).toFixed(0) + "°", cx, cy + 126,
        { s: 12, a: "center", c: v("--mist") });

      /* 아래 — 밝은 비율 곡선 */
      var X0 = 80, X1 = 850, Y0 = 306, Y1 = 410;
      axes(ctx, X0, Y0, X1, Y1);
      function XD(d) { return X0 + d / 900 * (X1 - X0); }
      function YK(k) { return Y1 - k * (Y1 - Y0); }
      [0, 0.5, 1].forEach(function (k) {
        text(ctx, Math.round(k * 100) + "%", X0 - 8, YK(k) + 4, { s: 10.5, a: "right", c: v("--mist") });
        ctx.strokeStyle = withA(v("--line"), .6); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(X0, YK(k)); ctx.lineTo(X1, YK(k)); ctx.stroke();
      });
      var i;
      ctx.strokeStyle = withA(v("--brand"), 1); ctx.lineWidth = 3; ctx.beginPath();
      for (i = 0; i < CURVE.length; i++) { if (i) ctx.lineTo(XD(CURVE[i].d), YK(CURVE[i].k)); else ctx.moveTo(XD(CURVE[i].d), YK(CURVE[i].k)); }
      ctx.stroke();
      ctx.strokeStyle = withA(v("--violet"), 1); ctx.lineWidth = 2.4; ctx.setLineDash([6, 4]); ctx.beginPath();
      for (i = 0; i < CURVE.length; i++) { if (i) ctx.lineTo(XD(CURVE[i].d), YK(CURVE[i].pk)); else ctx.moveTo(XD(CURVE[i].d), YK(CURVE[i].pk)); }
      ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle = withA(v("--ink"), .8); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(XD(day), Y0); ctx.lineTo(XD(day), Y1); ctx.stroke();
      text(ctx, "밝게 보이는 비율", X0, Y0 - 8, { s: 11, w: "800", c: v("--mist") });
      text(ctx, "2024-10-15", X0, Y1 + 18, { s: 10.5, c: v("--mist") });
      text(ctx, "2027-04-03", X1, Y1 + 18, { s: 10.5, a: "right", c: v("--mist") });
      ctx.fillStyle = withA(v("--brand"), 1); ctx.fillRect(X0 + 150, Y1 + 32, 20, 4);
      text(ctx, "태양 중심", X0 + 176, Y1 + 38, { s: 11.5, c: v("--mist") });
      ctx.fillStyle = withA(v("--violet"), 1); ctx.fillRect(X0 + 270, Y1 + 33, 20, 3);
      text(ctx, "지구 중심(주전원) — 35 %를 넘지 못합니다", X0 + 296, Y1 + 38, { s: 11.5, c: v("--mist") });

      var ch = false;
      if (g.k >= 0.90 && !G.a) { G.a = ch = true; }
      if (dia >= 55 && !G.b) { G.b = ch = true; }
      if (g.k - p.k >= 0.60 && !G.c) { G.c = ch = true; }
      if (ch) { window.sthState("bPhase", G); mission(); }

      $("b-phase-read").innerHTML = "밝은 비율 <b>" + Math.round(g.k * 100) + "%</b> (주전원 모형은 " + Math.round(p.k * 100)
        + "%) · 시직경 <b>" + dia.toFixed(1) + "″</b>";
      $("b-phase-info").innerHTML =
        (g.k >= 0.90
          ? "<b>거의 보름 금성입니다.</b> 그런데 시직경은 <b>" + dia.toFixed(1) + "″</b> 로 아주 작습니다 — 금성이 <b>태양 뒤편(외합)</b> 으로 돌아갔다는 뜻입니다. 주전원 모형은 금성을 늘 지구와 태양 사이에 두므로 이 모양을 <b>절대로</b> 만들 수 없습니다."
          : (dia >= 55
            ? "<b>가장 크게 보이는 때입니다.</b> 시직경이 " + dia.toFixed(1) + "″ 나 되는데 밝은 비율은 " + Math.round(g.k * 100) + "% 뿐입니다. 금성이 <b>내합</b> 쪽, 곧 지구에 가장 가까운 자리에 와 있습니다. 가까울수록 가늘어진다 — 이것이 금성이 태양을 돈다는 증거입니다."
            : "날짜를 밀면서 두 원반을 견주어 보세요. 태양 중심 모형은 밝은 비율이 <b>0 %에서 100 %까지</b> 바뀌고 크기도 <b>6배</b> 넘게 달라집니다. 주전원 모형은 밝은 비율이 <b>35 %를 넘지 못하고</b> 크기도 2배 남짓밖에 변하지 않습니다."));
    }
    function mission() {
      if (G.a) done("m-b4a"); if (G.b) done("m-b4b"); if (G.c) done("m-b4c"); if (G.q) done("m-b4d");
      if (G.a && G.b && G.c && G.q) {
        window.sthMission("m-b4", true, "<span class='m-tag'>미션 완료</span>금성은 <b>가늘수록 크게, 둥글수록 작게</b> 보입니다. 가늘 때는 지구와 태양 사이(가까움), 둥글 때는 태양 너머(멂)에 있다는 뜻이지요. 금성이 늘 지구와 태양 사이에 있어야 하는 주전원 모형으로는 <b>보름에 가까운 금성</b>을 설명할 수 없습니다.");
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

  /* ---- 장면2 : 5도의 기울기 ---- */
  (function () {
    var canvas = $("c-c-tilt"), ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var lam = 60, phase = "new", inc = 5.1;
    var G = window.sthState("cTilt") || { a: false, b: false, c: false, d: false };

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

    function draw() {
      paper(ctx, W, H);
      var b = betaOf(lam, inc), ab = Math.abs(b), vd = verdict();
      text(ctx, "백도면이 " + inc.toFixed(1) + "° 기울어져 있을 때 — 삭·망마다 식이 일어날까", 60, 30, { s: 14, w: "900" });

      /* 위에서 본 그림 */
      var cx = 300, cy = 220, R = 138;
      ctx.strokeStyle = withA(v("--line"), 1); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.ellipse(cx, cy, R, R * 0.42, 0, 0, 6.2832); ctx.stroke();
      ctx.fillStyle = "#ffb02e";
      ctx.beginPath(); ctx.arc(70, cy, 24, 0, 6.2832); ctx.fill();
      text(ctx, "태양", 70, cy + 42, { s: 12, a: "center", w: "700" });
      ctx.strokeStyle = withA(v("--amber"), .35); ctx.lineWidth = 1;
      for (var i = -2; i <= 2; i++) {
        ctx.beginPath(); ctx.moveTo(96, cy + i * 11); ctx.lineTo(cx - 26, cy + i * 11); ctx.stroke();
      }
      ctx.fillStyle = withA(v("--brand"), 1);
      ctx.beginPath(); ctx.arc(cx, cy, 16, 0, 6.2832); ctx.fill();
      text(ctx, "지구", cx, cy + 34, { s: 12, a: "center", w: "700" });
      ctx.fillStyle = withA(v("--ink"), .16);
      ctx.beginPath();
      ctx.moveTo(cx, cy - 14); ctx.lineTo(cx + R + 54, cy - 24);
      ctx.lineTo(cx + R + 54, cy + 24); ctx.lineTo(cx, cy + 14);
      ctx.closePath(); ctx.fill();
      text(ctx, "지구의 그림자", cx + R + 10, cy - 34, { s: 11, w: "700", c: v("--mist") });

      /* 달의 방향 : 삭이면 태양 쪽(왼쪽, 180°), 망이면 반대쪽(0°) */
      var moonDir = (phase === "new") ? 180 : 0;
      var nodeDir = moonDir - lam;
      function pt(deg, rr) { return { x: cx + rr * Math.cos(deg * D2R), y: cy - rr * Math.sin(deg * D2R) * 0.42 }; }
      var n1 = pt(nodeDir, R), n2 = pt(nodeDir + 180, R);
      ctx.strokeStyle = withA(v("--violet"), .85); ctx.lineWidth = 2; ctx.setLineDash([7, 5]);
      ctx.beginPath(); ctx.moveTo(n1.x, n1.y); ctx.lineTo(n2.x, n2.y); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = withA(v("--violet"), 1);
      ctx.beginPath(); ctx.arc(n1.x, n1.y, 5, 0, 6.2832); ctx.fill();
      ctx.beginPath(); ctx.arc(n2.x, n2.y, 5, 0, 6.2832); ctx.fill();
      text(ctx, "교점선", clamp((n1.x + cx) / 2, 90, 500), n1.y - 12, { s: 11.5, a: "center", w: "800", c: withA(v("--violet-700"), 1) });

      var mp = pt(moonDir, R);
      ctx.fillStyle = withA(v("--mist"), 1);
      ctx.beginPath(); ctx.arc(mp.x, mp.y, 9, 0, 6.2832); ctx.fill();
      text(ctx, phase === "new" ? "달 (삭)" : "달 (망)", clamp(mp.x, 80, 520), mp.y - 16, { s: 12, a: "center", w: "800" });
      text(ctx, "교점에서 " + Math.abs(lam) + "° 떨어져 있습니다", 60, 392, { s: 12, w: "800", c: v("--mist") });

      /* 옆에서 본 그림 */
      var sy = 436, sx0 = 60, sx1 = 520;
      ctx.strokeStyle = withA(v("--line"), 1); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(sx0, sy); ctx.lineTo(sx1, sy); ctx.stroke();
      text(ctx, "황도면 (옆에서 본 모습)", sx0, sy + 18, { s: 11.5, c: v("--mist") });
      var tilt = inc * 3.4 * D2R;
      ctx.strokeStyle = withA(v("--violet"), .9); ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sx0, sy + Math.tan(tilt) * (sx1 - sx0) / 2);
      ctx.lineTo(sx1, sy - Math.tan(tilt) * (sx1 - sx0) / 2);
      ctx.stroke();
      text(ctx, "백도면 (" + inc.toFixed(1) + "°) — 기울기는 보기 쉽게 확대해 그렸습니다", sx0, sy - 26,
        { s: 11.5, w: "700", c: withA(v("--violet-700"), 1) });

      /* 오른쪽 판정판 */
      var bx = 590, by = 76, bw = 280;
      ctx.fillStyle = withA(v("--card"), 1); ctx.strokeStyle = withA(v("--line"), 1); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.rect(bx, by, bw, 270); ctx.fill(); ctx.stroke();
      text(ctx, "지금 이 배치에서는", bx + 16, by + 28, { s: 13.5, w: "900" });
      var lines = [
        "달의 위치 : " + (phase === "new" ? "삭 (태양 쪽)" : "망 (반대쪽)"),
        "교점에서 떨어진 각 : " + Math.abs(lam) + "°",
        "달의 황위 : " + ab.toFixed(2) + "°",
        "달의 시반지름 : 약 0.26°",
        "일식 한계 황위 : " + SOL_LIMIT.toFixed(1) + "°",
        "월식 한계 황위 : " + LUN_LIMIT.toFixed(1) + "°"
      ];
      lines.forEach(function (t, i2) { text(ctx, t, bx + 16, by + 58 + i2 * 23, { s: 12.5, c: v("--mist") }); });
      text(ctx, vd.t, bx + 16, by + 222, { s: 15, w: "900", c: v(vd.c) });

      /* 황위 막대 */
      var gx = bx + 16, gw = bw - 32, gy = by + 240;
      ctx.fillStyle = withA(v("--line"), 1); ctx.fillRect(gx, gy, gw, 12);
      ctx.fillStyle = withA(v("--teal"), .8); ctx.fillRect(gx, gy, gw * (SOL_LIMIT / 5.5), 12);
      ctx.fillStyle = withA(v("--ink"), 1);
      ctx.fillRect(gx + clamp(ab / 5.5, 0, 1) * gw - 1.5, gy - 4, 3, 20);
      text(ctx, "0°", gx, gy + 28, { s: 10.5, c: v("--mist") });
      text(ctx, "5.5°", gx + gw, gy + 28, { s: 10.5, a: "right", c: v("--mist") });

      var ch = false;
      if (inc === 0 && phase === "new" && Math.abs(lam) >= 60 && !G.a) { G.a = ch = true; }
      if (inc > 0 && phase === "new" && Math.abs(lam) >= 85 && Math.abs(lam) <= 95 && !G.b) { G.b = ch = true; }
      if (inc > 0 && phase === "new" && ab <= SOL_LIMIT && !G.c) { G.c = ch = true; }
      if (inc > 0 && phase === "full" && ab <= LUN_LIMIT && !G.d) { G.d = ch = true; }
      if (ch) { window.sthState("cTilt", G); mission(); }

      $("c-badge").textContent = vd.t;
      $("c-tilt-read").innerHTML = "달의 황위: <b>" + ab.toFixed(2) + "°</b> — " + vd.t;
      $("c-tilt-info").innerHTML = inc === 0
        ? "<b>기울기가 0° 라면</b> 달은 언제나 황도면 위에 있습니다. 교점에서 아무리 멀어도 황위가 0° 이므로, <b>삭마다 일식, 망마다 월식</b> 이 일어납니다 — 한 달에 두 번씩요. 실제로는 그렇지 않지요."
        : (vd.ok
          ? "<b>" + vd.t + "입니다.</b> 달이 교점에서 " + Math.abs(lam) + "° 밖에 떨어져 있지 않아 황위가 " + ab.toFixed(2) + "° 로 작습니다. 태양·달·지구가 거의 한 직선 위에 놓였습니다."
          : "<b>" + vd.t + "</b> 달의 황위가 " + ab.toFixed(2) + "° 나 되어, 달이 태양(또는 지구 그림자)의 " + (betaOf(lam, inc) > 0 ? "위" : "아래") + "쪽을 비껴 지나갑니다. 황위를 <b>" + (phase === "new" ? SOL_LIMIT.toFixed(1) : LUN_LIMIT.toFixed(1)) + "° 아래</b>로 줄이려면 달을 교점 가까이로 옮겨야 합니다.");
    }
    function mission() {
      if (G.a) done("m-c2a"); if (G.b) done("m-c2b"); if (G.c) done("m-c2c"); if (G.d) done("m-c2d");
      if (G.a && G.b && G.c && G.d) {
        window.sthMission("m-c2", true, "<span class='m-tag'>미션 완료</span>기울기가 0° 라면 삭마다 일식, 망마다 월식입니다. 그런데 백도면이 <b>5.1°</b> 기울어져 있어서, 달이 <b>교점 가까이</b> 있을 때 삭·망이 되어야만 식이 일어납니다. 그 한계를 <b>식한</b> 이라 하고, 일식은 교점에서 약 <b>16°</b>, 월식은 약 <b>11°</b> 안쪽입니다.");
        ep.clear(1);
      }
    }
    canvas._redraw = draw;
    $("c-lam").addEventListener("input", function (e) {
      lam = +e.target.value; $("c-lam-val").textContent = lam + "°"; draw();
    });
    segWire("c-phase", function (b) { phase = b.getAttribute("data-k"); draw(); });
    segWire("c-inc", function (b) { inc = parseFloat(b.getAttribute("data-i")); draw(); });
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
      paper(ctx, W, H);
      var c = calc(), total = c.w > 0;
      text(ctx, "달이 크게 보이면 개기, 작게 보이면 금환", 60, 30, { s: 14, w: "900" });

      /* 왼쪽 — 하늘에서 본 겹침 */
      var cx = 200, cy = 190, base = 108;
      var rs = base * (c.ss / 0.2666), rmn = base * (c.sm / 0.2666);
      ctx.fillStyle = "#ffb02e";
      ctx.beginPath(); ctx.arc(cx, cy, rs, 0, 6.2832); ctx.fill();
      ctx.fillStyle = "#2b3145";
      ctx.beginPath(); ctx.arc(cx, cy, rmn, 0, 6.2832); ctx.fill();
      ctx.strokeStyle = withA(v("--line"), 1); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(cx, cy, rs, 0, 6.2832); ctx.stroke();
      text(ctx, "하늘에서 본 겹침", cx, 58, { s: 13, a: "center", w: "900" });
      text(ctx, "태양 " + c.ss.toFixed(4) + "°", cx, 328, { s: 12, a: "center", w: "800", c: withA(v("--amber-700"), 1) });
      text(ctx, "달 " + c.sm.toFixed(4) + "°", cx, 350, { s: 12, a: "center", w: "800", c: v("--mist") });
      text(ctx, total ? "달이 태양을 완전히 덮습니다" : "태양의 가장자리가 고리로 남습니다", cx, 378,
        { s: 12.5, a: "center", w: "900", c: total ? v("--teal-700") : v("--rose-700") });

      /* 가운데 — 본그림자 원뿔 */
      var gx0 = 400, gx1 = 830, my = 150;
      ctx.strokeStyle = withA(v("--line"), 1); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(gx0, my); ctx.lineTo(gx1, my); ctx.stroke();
      text(ctx, "본그림자 원뿔 (옆에서 본 모습)", gx0, 58, { s: 13, w: "900" });
      var LPX = 340;                                      /* 원뿔 길이를 화면에서 340px 로 고정 */
      var apex = gx0 + LPX;
      ctx.fillStyle = withA(v("--ink"), .22);
      ctx.beginPath();
      ctx.moveTo(gx0, my - 26); ctx.lineTo(apex, my); ctx.lineTo(gx0, my + 26); ctx.closePath(); ctx.fill();
      ctx.fillStyle = withA(v("--mist"), 1);
      ctx.beginPath(); ctx.arc(gx0, my, 9, 0, 6.2832); ctx.fill();
      text(ctx, "달", gx0, my - 34, { s: 11.5, a: "center", w: "800" });
      text(ctx, "원뿔의 끝", apex, my - 12, { s: 11, a: "center", c: v("--mist") });

      /* 지구의 자리 */
      var ex = gx0 + LPX * ((dm - Re) / c.L);
      ctx.strokeStyle = withA(v("--brand"), 1); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(clamp(ex, gx0, gx1), my - 46); ctx.lineTo(clamp(ex, gx0, gx1), my + 46); ctx.stroke();
      text(ctx, "지구의 지표", clamp(ex, gx0 + 40, gx1 - 40), my + 66, { s: 11.5, a: "center", w: "800", c: v("--brand-700") });
      text(ctx, total ? "지표가 원뿔 안에 있습니다 → 개기" : "지표가 원뿔 끝을 지났습니다 → 금환",
        gx0, my + 100, { s: 12.5, w: "900", c: total ? v("--teal-700") : v("--rose-700") });
      text(ctx, "원뿔 길이 " + comma(c.L) + " km  ·  달까지 " + comma(dm) + " km", gx0, my + 126, { s: 12, c: v("--mist") });

      /* 오른쪽 아래 계기판 */
      var bx = 400, by = 300, bw = 440;
      ctx.fillStyle = withA(v("--card"), 1); ctx.strokeStyle = withA(v("--line"), 1); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.rect(bx, by, bw, 128); ctx.fill(); ctx.stroke();
      text(ctx, total ? "개기 일식" : "금환 일식", bx + 18, by + 34, { s: 20, w: "900", c: total ? v("--teal-700") : v("--rose-700") });
      text(ctx, total ? "본그림자 띠의 폭" : "본그림자가 지표에 못 미친 정도", bx + 18, by + 64, { s: 11.5, w: "800", c: v("--mist") });
      text(ctx, Math.abs(c.w).toFixed(0) + " km", bx + 18, by + 94, { s: 24, w: "900" });
      text(ctx, "달의 시반지름 − 태양의 시반지름", bx + 240, by + 64, { s: 11.5, w: "800", c: v("--mist") });
      text(ctx, ((c.sm - c.ss) >= 0 ? "+" : "") + (c.sm - c.ss).toFixed(4) + "°", bx + 240, by + 94, { s: 20, w: "900" });
      text(ctx, "달 반지름 1,737 km · 태양 반지름 696,000 km · 지구 반지름 6,378 km 를 쓴 원뿔 모형입니다.",
        60, 452, { s: 11.5, c: v("--mist") });

      var ch = false;
      if (c.w >= 50 && !G.a) { G.a = ch = true; }
      if (c.w <= -50 && !G.b) { G.b = ch = true; }
      if (c.w >= 150 && !G.c) { G.c = ch = true; }
      if (ds >= 152000000 && !G.d) { G.d = ch = true; }
      if (ch) { window.sthState("cShadow", G); mission(); }

      $("c-shadow-read").innerHTML = "판정: <b>" + (total ? "개기 일식" : "금환 일식") + "</b> · "
        + (total ? "띠의 폭 " : "모자란 정도 ") + "<b>" + Math.abs(c.w).toFixed(0) + " km</b>";
      $("c-shadow-info").innerHTML = total
        ? "<b>개기 일식입니다.</b> 달의 시반지름(" + c.sm.toFixed(4) + "°)이 태양의 시반지름(" + c.ss.toFixed(4) + "°)보다 커서 태양을 완전히 덮습니다. 본그림자가 지표에 닿아 폭 <b>" + c.w.toFixed(0) + " km</b> 의 띠를 그리며 지나갑니다. 그 띠 밖에서는 반그림자에 들어 <b>부분 일식</b>으로 보입니다."
        : "<b>금환 일식입니다.</b> 달이 멀어 시반지름(" + c.sm.toFixed(4) + "°)이 태양(" + c.ss.toFixed(4) + "°)보다 작습니다. 본그림자 원뿔의 끝이 지표에 <b>" + Math.abs(c.w).toFixed(0) + " km</b> 만큼 못 미쳐, 태양의 가장자리가 <b>반지 모양</b>으로 남습니다.";
    }
    function mission() {
      if (G.a) done("m-c3a"); if (G.b) done("m-c3b"); if (G.c) done("m-c3c"); if (G.d) done("m-c3d");
      if (G.a && G.b && G.c && G.d) {
        window.sthMission("m-c3", true, "<span class='m-tag'>미션 완료</span>같은 삭이라도 <b>달이 가까우면 개기, 멀면 금환</b> 입니다. 달의 시반지름(0.245°~0.279°)과 태양의 시반지름(0.262°~0.271°)이 <b>거의 같은 크기</b>로 겹쳐 있기 때문에, 거리가 조금만 달라져도 결과가 뒤집힙니다. 개기 일식의 띠는 가장 넓어도 200 km 남짓입니다.");
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
      paper(ctx, W, H);
      var s = stateAt(n, kind);
      text(ctx, "삭망월 29.53일과 교점월 27.21일이 어긋나 만드는 식의 달력", 60, 30, { s: 14, w: "900" });

      /* 위 — 두 바퀴 */
      function wheel(cx, cy, r, ang, title, sub, col) {
        ctx.strokeStyle = withA(v("--line"), 1); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.2832); ctx.stroke();
        ctx.strokeStyle = withA(v(col), .9); ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(cx, cy);
        ctx.lineTo(cx + r * Math.cos(-ang * D2R), cy + r * Math.sin(-ang * D2R)); ctx.stroke();
        ctx.fillStyle = withA(v(col), 1);
        ctx.beginPath(); ctx.arc(cx + r * Math.cos(-ang * D2R), cy + r * Math.sin(-ang * D2R), 6, 0, 6.2832); ctx.fill();
        text(ctx, title, cx, cy - r - 16, { s: 12.5, a: "center", w: "900" });
        text(ctx, sub, cx, cy + r + 24, { s: 11.5, a: "center", c: v("--mist") });
      }
      var phaseAng = kind === "new" ? 0 : 180;
      wheel(160, 130, 58, phaseAng, "달의 위상", kind === "new" ? "삭 (태양과 같은 방향)" : "망 (태양 반대쪽)", "--brand");
      wheel(400, 130, 58, s.nu, "교점에서 잰 각", s.nu.toFixed(0) + "° — 0° 와 180° 가 교점", "--violet");

      /* 오른쪽 판정 */
      var bx = 560, by = 62, bw = 300;
      ctx.fillStyle = withA(v("--card"), 1); ctx.strokeStyle = withA(v("--line"), 1); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.rect(bx, by, bw, 168); ctx.fill(); ctx.stroke();
      text(ctx, dayStr(s.t), bx + 16, by + 32, { s: 17, w: "900", c: v("--brand-700") });
      text(ctx, (kind === "new" ? "삭" : "망") + " · " + n + "번째 달 · " + s.t.toFixed(1) + "일째",
        bx + 16, by + 56, { s: 12, c: v("--mist") });
      text(ctx, "달의 황위 " + s.ab.toFixed(2) + "°", bx + 16, by + 86, { s: 14, w: "900" });
      text(ctx, "한계 " + (kind === "new" ? SOL_LIMIT.toFixed(1) : LUN_LIMIT.toFixed(1)) + "° 안쪽이면 식",
        bx + 16, by + 108, { s: 11.5, c: v("--mist") });
      text(ctx, s.label, bx + 16, by + 142, { s: 13.5, w: "900", c: s.ok ? v("--teal-700") : v("--rose-700") });

      /* 아래 — 36달 띠 */
      var X0 = 70, X1 = 860, Y = 300;
      text(ctx, "36달을 한 줄로 — 위는 삭(일식 차례), 아래는 망(월식 차례)", X0, Y - 42, { s: 12.5, w: "800", c: v("--mist") });
      function XN(nn) { return X0 + nn / 36 * (X1 - X0); }
      var i, st;
      for (i = 0; i <= 36; i++) {
        st = stateAt(i, "new");
        ctx.fillStyle = st.ok ? withA(v("--coral"), .95) : withA(v("--line"), 1);
        ctx.fillRect(XN(i) - 5, Y - 34 - clamp((5.2 - st.ab) * 5, 2, 26), 10, clamp((5.2 - st.ab) * 5, 2, 26));
        st = stateAt(i, "full");
        ctx.fillStyle = st.ok ? withA(v("--violet"), .95) : withA(v("--line"), 1);
        ctx.fillRect(XN(i) - 5, Y + 6, 10, clamp((5.2 - st.ab) * 5, 2, 26));
      }
      ctx.strokeStyle = withA(v("--line"), 1); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(X0 - 10, Y); ctx.lineTo(X1 + 10, Y); ctx.stroke();
      ctx.strokeStyle = withA(v("--ink"), .9); ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(XN(n), Y - 68); ctx.lineTo(XN(n), Y + 40); ctx.stroke();
      for (i = 0; i <= 36; i += 6) text(ctx, i + "", XN(i), Y + 56, { s: 10.5, a: "center", c: v("--mist") });
      text(ctx, "← 몇 번째 달", X1, Y + 56, { s: 10.5, a: "right", c: v("--mist") });
      text(ctx, "막대가 길수록 달이 교점에 가깝습니다 — 색이 들어온 달에만 식이 일어납니다", X0, Y + 82, { s: 11.5, c: v("--mist") });

      /* 식의 계절 눈금 */
      var sy = Y + 108;
      text(ctx, "식의 계절 (약 " + SEASON + "일마다)", X0, sy - 8, { s: 11.5, w: "800", c: v("--mist") });
      for (i = 0; i * SEASON <= SYN * 36; i++) {
        var xx = XN(i * SEASON / SYN);
        if (xx > X1) break;
        ctx.strokeStyle = withA(v("--amber"), .85); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(xx, sy); ctx.lineTo(xx, sy + 14); ctx.stroke();
        text(ctx, i + "", xx, sy + 28, { s: 10.5, a: "center", c: G.seasons.indexOf(i) >= 0 ? v("--teal-700") : v("--mist"), w: G.seasons.indexOf(i) >= 0 ? "900" : "500" });
      }
      text(ctx, "찾은 식의 계절 " + G.seasons.length + " 곳", X0 + 640, sy + 28, { s: 12, w: "900", c: G.seasons.length >= 3 ? v("--teal-700") : v("--mist") });

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
        : "<b>식이 일어나지 않습니다.</b> " + (kind === "new" ? "삭" : "망") + " 이기는 하지만 달의 황위가 " + s.ab.toFixed(2) + "° 나 되어 " + (kind === "new" ? "달이 태양을 비껴갑니다" : "달이 지구 그림자를 비껴갑니다") + ". 달을 <b>몇 달 더</b> 넘겨 교점 가까이로 가야 합니다.";
    }
    function mission() {
      if (G.a) done("m-c4a"); if (G.b) done("m-c4b"); if (G.c) done("m-c4c");
      if (G.seasons.length >= 3) done("m-c4d");
      if (G.q) done("m-c4e");
      if (G.a && G.b && G.c && G.seasons.length >= 3 && G.q) {
        window.sthMission("m-c4", true, "<span class='m-tag'>미션 완료</span>삭망월(29.53일)과 교점월(27.21일)이 어긋나 있어서, 달이 <b>교점 가까이에서 삭·망이 되는 기간</b> 이 약 173일마다 돌아옵니다. 그래서 식은 흩어져 있지 않고 <b>몰려서</b> 일어납니다. 이 모형이 짚어 낸 날짜에 실제로 2024-04-08, 2024-10-02, 2025-03-14, 2025-09-07 의 식이 있었습니다.");
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
      (p.indexOf("㉡") === 0 ? "정확했습니다. 기울기를 0° 로 두어 보면 삭마다 일식이 일어납니다 — 5.1° 가 그것을 막고 있었습니다."
        : "㉡ 이 정답이었습니다. 달의 크기 문제도, 지구 그림자 문제도 아닙니다. 삭일 때 달은 지구 그림자와 반대쪽(태양 쪽)에 있습니다.");
  }
  vsC();
  ep.onShow(vsC);
  window.sthWork({
    mount: "wkC", unitLabel: "[지구과학 Ⅲ-1] 이야기 ③ 그림자가 지나간 자리",
    items: [
      { id: "c1", label: "삭마다 일식이 아닌 까닭", hint: "‘식한’ 이라는 말을 넣어, 달의 황위로 설명하세요.",
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
    { key: "r3", label: "③ 그림자가 지나간 자리" }
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
    { key: "r3", label: "③ 그림자가 지나간 자리" }
  ],
  line: { id: "all", label: "세 사건을 꿰는 한 문장" }
});

})();
