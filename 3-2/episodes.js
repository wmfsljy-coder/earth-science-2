/* 지구과학 Ⅲ-2 별과 우주의 진화 — 소단원별 이야기 네 편
   ① 여자들의 별 목록 ② 질량이 정한 일생 ③ 은하 동물원 ④ 팽창하는 우주
   공용 부품: ../assets/theme.js (sthUnit·sthState·sthGate·sthWork·setupCanvas·cssVar·drawArrow),
             ../assets/story.js (sthStory·sthMission·sthSort·sthOrder·sthPick), ../assets/share.js */
(function () {
"use strict";

window.sthUnit("eshs-3-2");

var FONT = "'Gothic A1','Segoe UI',sans-serif";
function $(id) { return document.getElementById(id); }
function v(name) { return window.cssVar(name); }
function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
function done(id) { var e = $(id); if (e) e.classList.add("done"); }
function paper(ctx, W, H) { ctx.clearRect(0, 0, W, H); ctx.fillStyle = v("--panel"); ctx.fillRect(0, 0, W, H); }
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
  ctx.strokeStyle = v("--line"); ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0, y1); ctx.lineTo(x1, y1); ctx.stroke();
}
function band(ctx, x, y, w, h, color, alpha) {
  ctx.save(); ctx.globalAlpha = alpha === undefined ? 0.75 : alpha;
  ctx.fillStyle = v(color); ctx.fillRect(x, y, w, h); ctx.restore();
}
function dash(ctx, x0, y0, x1, y1, color) {
  ctx.save(); ctx.strokeStyle = v(color || "--line"); ctx.lineWidth = 1.4; ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); ctx.setLineDash([]); ctx.restore();
}
/* setTimeout 애니메이션 (가려진 탭에서는 그리지 않는다) */
function anim(canvas, step) {
  (function tick() {
    if (canvas.offsetParent !== null) step();
    setTimeout(tick, 90);
  })();
}
function hit(canvas, e) {
  var r = canvas.getBoundingClientRect();
  if (!r.width || !r.height) return { x: -1, y: -1 };
  return { x: (e.clientX - r.left) * (canvas._w / r.width), y: (e.clientY - r.top) * (canvas._h / r.height) };
}
function rnd32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    var t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---- 수 표기 ---- */
var SUP = { "-": "⁻", "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", ".": "·" };
function sup(s) {
  return String(s).split("").map(function (c) { return SUP[c] || c; }).join("");
}
function expo(x) {
  if (!isFinite(x) || x === 0) return "0";
  var e = Math.floor(Math.log(Math.abs(x)) / Math.LN10);
  var m = x / Math.pow(10, e);
  if (Math.abs(m - 10) < 0.05) { m = 1; e++; }
  return (Math.abs(m - 1) < 0.05 ? "10" : m.toFixed(1) + "×10") + sup(e);
}
function num(x) {
  if (!isFinite(x)) return "—";
  if (x >= 1e5 || (x > 0 && x < 0.01)) return expo(x);
  if (x >= 1000) return Math.round(x).toLocaleString();
  if (x >= 100) return x.toFixed(0);
  if (x >= 10) return x.toFixed(1);
  if (x >= 1) return x.toFixed(2);
  return x.toFixed(3);
}
function comma(x) { return Math.round(x).toLocaleString(); }
function fmtYear(y) {
  if (y >= 1e8) return (y / 1e8).toFixed(y / 1e8 >= 100 ? 0 : 1) + "억 년";
  if (y >= 1e4) return (y / 1e4).toFixed(y / 1e4 >= 100 ? 0 : 1) + "만 년";
  return comma(y) + "년";
}

/* ---- 빛의 색 ----
   스펙트럼 띠와 별빛은 '그 빛이 실제로 무슨 색인가' 를 보여 주는 그림이므로
   테마 색 토큰 대신 파장·온도에서 곧바로 계산한 색을 쓴다. (그 밖의 모든 색은 cssVar) */
function waveColor(nm) {
  var r = 0, g = 0, b = 0, f = 1;
  if (nm < 380) { r = 0.40; g = 0.20; b = 1; }
  else if (nm < 440) { r = -(nm - 440) / 60; b = 1; }
  else if (nm < 490) { g = (nm - 440) / 50; b = 1; }
  else if (nm < 510) { g = 1; b = -(nm - 510) / 20; }
  else if (nm < 580) { r = (nm - 510) / 70; g = 1; }
  else if (nm < 645) { r = 1; g = -(nm - 645) / 65; }
  else { r = 1; }
  if (nm >= 380 && nm < 420) f = 0.35 + 0.65 * (nm - 380) / 40;
  else if (nm > 700) f = Math.max(0.3, 0.35 + 0.65 * (780 - nm) / 80);
  function c(x) { return Math.round(255 * Math.pow(clamp(x, 0, 1) * f, 0.85)); }
  return "rgb(" + c(r) + "," + c(g) + "," + c(b) + ")";
}
function starColor(T) {
  var t = clamp(T, 1900, 40000) / 100, r, g, b;
  if (t <= 66) { r = 255; g = 99.47 * Math.log(t) - 161.1; }
  else { r = 329.7 * Math.pow(t - 60, -0.1332); g = 288.1 * Math.pow(t - 60, -0.0755); }
  b = t >= 66 ? 255 : (t <= 19 ? 0 : 138.5 * Math.log(t - 10) - 305);
  function c(x) { return Math.round(clamp(x, 40, 255)); }
  return "rgb(" + c(r) + "," + c(g) + "," + c(b) + ")";
}
/* 흑체 복사 세기(플랑크 곡선, 상대값) */
function planck(nm, T) {
  var lam = nm * 1e-9;
  return 1 / (Math.pow(lam, 5) * (Math.exp(0.0143878 / (lam * T)) - 1));
}
var WIEN = 2.898e6;      /* nm·K */
var TSUN = 5800;

/* 주계열의 표면 온도 - 광도 관계 (표를 로그-로그로 이어 붙인 모형) — 이야기 ①②가 함께 쓴다 */
var MS = [[42000, 5.55], [30000, 4.90], [20000, 4.00], [15000, 3.20], [10000, 1.70], [8200, 1.10], [7300, 0.75],
          [6650, 0.45], [5940, 0.13], [5800, 0.00], [5150, -0.40], [4410, -0.80], [3840, -1.20], [3050, -2.20], [2500, -3.10]];
function msLogL(T) {
  var x = Math.log(T) / Math.LN10;
  for (var i = 0; i < MS.length - 1; i++) {
    var a = Math.log(MS[i][0]) / Math.LN10, b = Math.log(MS[i + 1][0]) / Math.LN10;
    if (x <= a && x >= b) return MS[i][1] + (MS[i + 1][1] - MS[i][1]) * (a - x) / (a - b);
  }
  return x > Math.log(42000) / Math.LN10 ? MS[0][1] : MS[MS.length - 1][1];
}

/* =========================================================================
   이야기 ① 여자들의 별 목록
   ========================================================================= */
(function () {
  var ep = window.sthStory({ root: "epA", key: "epA", name: "사건 파일 ①", onDone: finish });

  window.sthGate({
    gate: "a-gate", key: "a-p", title: "캐넌 앞에 놓인 첫 물음",
    question: "수소 흡수선이 가장 진한 별을 <b>A형</b>이라고 불렀습니다. 그렇다면 A형 별에는 수소가 가장 많이 들어 있는 걸까요?",
    options: [
      "㉠ 그렇다 — 흡수선이 진한 만큼 그 원소가 많다는 뜻이다",
      "㉡ 아니다 — 수소는 어느 별에나 가장 많고, 흡수선의 세기는 표면 온도가 정한다",
      "㉢ 아니다 — A형 별에는 수소가 거의 없어서 선만 유난히 도드라져 보인다"
    ],
    onPick: function (i) { window.sthState("aPredOK", i === 1 ? "맞음" : "어긋남"); ep.clear(0); }
  });

  /* ---- 공통 : 분광형 ---- */
  function spType(T) {
    if (T >= 30000) return "O";
    if (T >= 10000) return "B";
    if (T >= 7500) return "A";
    if (T >= 6000) return "F";
    if (T >= 5000) return "G";
    if (T >= 3500) return "K";
    return "M";
  }
  var SPCOL = { O: "파란색", B: "청백색", A: "흰색", F: "황백색", G: "노란색", K: "주황색", M: "붉은색" };
  var SPDESC = {
    O: "가장 뜨거운 별입니다. 이온화된 헬륨의 선이 보이고 수소 선은 오히려 약합니다.",
    B: "청백색 별입니다. 중성 헬륨의 선이 가장 셉니다. (예: 리겔)",
    A: "흰색 별입니다. <b>수소 흡수선이 가장 셉니다.</b> (예: 시리우스 A, 견우성)",
    F: "황백색 별입니다. 수소 선이 약해지고 금속 선이 보이기 시작합니다.",
    G: "노란색 별입니다. 금속 선이 셉니다. <b>태양이 여기에 속합니다.</b>",
    K: "주황색 별입니다. 금속 선이 매우 세고 수소 선은 거의 보이지 않습니다.",
    M: "가장 차가운 별입니다. 원자가 분자로 뭉쳐 <b>넓은 분자 흡수띠</b>가 나타납니다. 우주에서 가장 흔한 별입니다."
  };
  /* ---- 장면2 : 스펙트럼과 흡수선 ---- */
  var G2 = window.sthState("aSpec") || { a: false, b: false, c: false, d: false };
  function mission2() {
    if (G2.a) done("m1-2a"); if (G2.b) done("m1-2b"); if (G2.c) done("m1-2c"); if (G2.d) done("m1-2d");
    if (G2.a && G2.b && G2.c && G2.d) {
      window.sthMission("m1-2", true, "<span class='m-tag'>미션 완료</span>수소 흡수선은 <b>약 9,500 K(A형)</b> 에서 가장 셉니다. 더 뜨거워도, 더 차가워도 약해지지요. 그래서 ‘선이 진한 순서’ 로 늘어놓으면 온도 순서가 깨집니다. 흡수선 자리에도 <b>빛은 남아 있습니다</b> — 다만 덜 올 뿐입니다.");
      ep.clear(1);
    }
  }
  (function () {
    var canvas = $("a-c-spec"), ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var T = 5800, sel = "";
    var SX0 = 175, SX1 = 868, SY0 = 62, SY1 = 146;
    var GX0 = 175, GX1 = 868, GY0 = 236, GY1 = 372;
    var NM0 = 380, NM1 = 750;
    var LT0 = Math.log(40000) / Math.LN10, LT1 = Math.log(2500) / Math.LN10;

    var LINES = [
      { nm: 393.4, k: "metal", n: "Ca II K" },
      { nm: 410.2, k: "H", n: "Hδ" },
      { nm: 434.0, k: "H", n: "Hγ" },
      { nm: 438.4, k: "metal", n: "Fe I" },
      { nm: 447.1, k: "heI", n: "He I" },
      { nm: 468.6, k: "heII", n: "He II" },
      { nm: 486.1, k: "H", n: "Hβ" },
      { nm: 516.7, k: "tio", n: "TiO 띠" },
      { nm: 589.0, k: "metal", n: "Na I D" },
      { nm: 616.0, k: "tio", n: "TiO 띠" },
      { nm: 656.3, k: "H", n: "Hα" },
      { nm: 705.0, k: "tio", n: "TiO 띠" }
    ];
    var KND = { H: "수소 (발머 계열)", heI: "중성 헬륨", heII: "이온화된 헬륨", metal: "금속 원소 (Ca·Fe·Na)", tio: "산화 타이타늄(TiO) 분자" };
    var KSHORT = { H: "수소", heI: "헬륨", heII: "헬륨 이온", metal: "금속", tio: "분자띠" };
    var KCOL = { H: "--teal", heI: "--brand", heII: "--violet", metal: "--amber", tio: "--coral" };
    var KDESC = {
      H: "수소 선은 표면 온도 <b>약 9,500 K(A형)</b> 에서 가장 셉니다. 더 뜨거우면 수소가 이온화되어 빛을 흡수할 전자가 남지 않고, 더 차가우면 전자가 충분히 들뜨지 못합니다.",
      heI: "중성 헬륨의 선은 <b>2만 K 안팎(B형)</b> 에서 가장 셉니다. 헬륨은 수소보다 훨씬 높은 온도라야 들뜹니다.",
      heII: "이온화된 헬륨의 선은 <b>3만 K 이상(O형)</b> 에서만 보입니다. 가장 뜨거운 별이라는 표시입니다.",
      metal: "칼슘·철·나트륨 같은 금속 원소의 선은 <b>4,000~6,000 K(G·K형)</b> 에서 셉니다. 이보다 뜨거우면 금속도 이온화됩니다.",
      tio: "<b>3,500 K 아래(M형)</b> 에서는 원자들이 분자로 뭉칩니다. 분자는 가느다란 선이 아니라 <b>넓은 띠</b> 모양으로 빛을 흡수합니다."
    };
    function strength(temp, k) {
      var x = Math.log(temp) / Math.LN10;
      function g(mu, s) { var d = (x - Math.log(mu) / Math.LN10) / s; return Math.exp(-d * d); }
      if (k === "heII") return g(40000, 0.15);
      if (k === "heI") return g(19000, 0.14);
      if (k === "H") return g(9500, 0.16);
      if (k === "metal") return g(4800, 0.155);
      if (k === "tio") return g(2900, 0.105);
      return 0;
    }
    function XW(nm) { return SX0 + (nm - NM0) / (NM1 - NM0) * (SX1 - SX0); }
    function XT(t) { return GX0 + (LT0 - Math.log(t) / Math.LN10) / (LT0 - LT1) * (GX1 - GX0); }
    function YS(s) { return GY1 - clamp(s, 0, 1) * (GY1 - GY0); }
    function lineW(l) { return l.k === "tio" ? 17 : 5; }

    function draw() {
      paper(ctx, W, H);
      var cls = spType(T), lmax = WIEN / T;
      text(ctx, "표면 온도 하나를 움직이면 스펙트럼이 어떻게 달라지나", 30, 30, { s: 14, w: "900" });

      /* 별 */
      ctx.save();
      ctx.shadowColor = starColor(T); ctx.shadowBlur = 26;
      ctx.fillStyle = starColor(T);
      ctx.beginPath(); ctx.arc(88, 110, 46, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      text(ctx, "지금 이 별", 88, 178, { s: 11.5, a: "center", c: v("--mist") });
      text(ctx, cls + "형", 88, 226, { s: 30, a: "center", w: "900", c: v("--ink") });
      text(ctx, SPCOL[cls], 88, 252, { s: 13, a: "center", w: "800", c: v("--mist") });
      text(ctx, comma(T) + " K", 88, 276, { s: 13, a: "center", w: "800", c: v("--teal-700") });

      /* 연속 스펙트럼 띠 */
      var peak = planck(lmax, T);
      for (var x = SX0; x <= SX1; x++) {
        var nm = NM0 + (x - SX0) / (SX1 - SX0) * (NM1 - NM0);
        var rel = clamp(planck(nm, T) / peak, 0.06, 1);
        ctx.save();
        ctx.globalAlpha = 0.25 + 0.75 * rel;
        ctx.fillStyle = waveColor(nm);
        ctx.fillRect(x, SY0, 1.2, SY1 - SY0);
        ctx.restore();
      }
      /* 흡수선 */
      LINES.forEach(function (l) {
        var s = strength(T, l.k);
        if (s < 0.02) return;
        var w = lineW(l), cx = XW(l.nm);
        ctx.save();
        ctx.globalAlpha = 0.88 * s;
        ctx.fillStyle = "rgb(10,10,16)";
        ctx.fillRect(cx - w / 2, SY0, w, SY1 - SY0);
        ctx.restore();
        if (sel === l.n + l.nm) {
          ctx.strokeStyle = v("--teal"); ctx.lineWidth = 2.5;
          ctx.strokeRect(cx - w / 2 - 2, SY0 - 2, w + 4, SY1 - SY0 + 4);
        }
      });
      ctx.strokeStyle = v("--line"); ctx.lineWidth = 1.5; ctx.strokeRect(SX0, SY0, SX1 - SX0, SY1 - SY0);
      /* 최대 세기 파장 표시 */
      if (lmax >= NM0 && lmax <= NM1) {
        dash(ctx, XW(lmax), SY0 - 12, XW(lmax), SY1, "--ink");
        text(ctx, "최대 세기 " + Math.round(lmax) + " nm", clamp(XW(lmax), SX0 + 60, SX1 - 60), SY0 - 18, { s: 11, a: "center", w: "800", c: v("--ink") });
      } else {
        text(ctx, "최대 세기 파장 " + Math.round(lmax) + " nm (" + (lmax < NM0 ? "자외선 쪽" : "적외선 쪽") + " — 띠 밖)",
          SX1, SY0 - 18, { s: 11, a: "right", w: "800", c: v("--mist") });
      }
      [400, 500, 600, 700].forEach(function (nm) {
        text(ctx, nm + "", XW(nm), SY1 + 18, { s: 10.5, a: "center", c: v("--mist") });
      });
      text(ctx, "nm", SX1, SY1 + 18, { s: 10.5, a: "right", c: v("--mist") });

      /* 고른 흡수선 설명 */
      if (sel) {
        var pick = null;
        LINES.forEach(function (l) { if (sel === l.n + l.nm) pick = l; });
        if (pick) {
          var sv = strength(T, pick.k), rest = 100 * (1 - 0.88 * sv);
          text(ctx, "고른 흡수선 : " + pick.n + " (" + pick.nm.toFixed(1) + " nm) — " + KND[pick.k],
            SX0, SY1 + 44, { s: 12.5, w: "900", c: v(KCOL[pick.k] + "-700") });
          text(ctx, "이 자리에 남아 있는 빛의 세기 : " + rest.toFixed(1) + " %  ( 0 % 가 아닙니다 )",
            SX0, SY1 + 66, { s: 12.5, w: "800", c: rest > 99 ? v("--mist") : v("--rose-700") });
        }
      } else {
        text(ctx, "스펙트럼 띠 위의 어두운 선을 눌러 보세요.", SX0, SY1 + 44, { s: 12.5, c: v("--mist") });
        text(ctx, "검게 보여도 그 파장의 빛이 아주 없는 것은 아닙니다.", SX0, SY1 + 66, { s: 12, c: v("--mist") });
      }

      /* 흡수선 세기 곡선 */
      axes(ctx, GX0, GY0, GX1, GY1);
      text(ctx, "흡수선의 세기", GX0 + 96, GY0 - 10, { s: 11, c: v("--mist") });
      var KEYS = [["heII", 40000], ["heI", 19000], ["H", 9500], ["metal", 4800], ["tio", 2900]];
      KEYS.forEach(function (kk) {
        ctx.strokeStyle = v(KCOL[kk[0]]); ctx.lineWidth = kk[0] === "H" ? 3.4 : 2.2;
        ctx.beginPath();
        for (var i = 0; i <= 160; i++) {
          var lt = LT0 - i / 160 * (LT0 - LT1), tt = Math.pow(10, lt);
          var px = XT(tt), py = YS(strength(tt, kk[0]));
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke();
        var lx = clamp(XT(kk[1]), GX0 + 40, GX1 - 46);
        text(ctx, KSHORT[kk[0]], lx, YS(1) - 8, { s: 11, a: "center", w: "900", c: v(KCOL[kk[0]] + "-700") });
      });
      /* 지금 온도 */
      ctx.strokeStyle = v("--ink"); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(XT(T), GY0 - 4); ctx.lineTo(XT(T), GY1 + 26); ctx.stroke();

      /* 분광형 띠 */
      var BND = [[40000, 30000, "O"], [30000, 10000, "B"], [10000, 7500, "A"], [7500, 6000, "F"], [6000, 5000, "G"], [5000, 3500, "K"], [3500, 2500, "M"]];
      BND.forEach(function (b, i) {
        var x0 = XT(b[0]), x1 = XT(b[1]);
        band(ctx, x0, GY1 + 6, x1 - x0, 24, b[2] === cls ? "--teal" : (i % 2 ? "--brand" : "--mist"), b[2] === cls ? 0.75 : 0.22);
        ctx.strokeStyle = v("--line"); ctx.lineWidth = 1; ctx.strokeRect(x0, GY1 + 6, x1 - x0, 24);
        if (x1 - x0 > 16) text(ctx, b[2], (x0 + x1) / 2, GY1 + 23, { s: 12, a: "center", w: "900", c: v("--ink") });
      });
      [[40000, "40,000"], [10000, "10,000"], [5000, "5,000"], [2500, "2,500"]].forEach(function (m) {
        text(ctx, m[1], clamp(XT(m[0]), GX0 + 24, GX1 - 24), GY1 + 48, { s: 10.5, a: "center", c: v("--mist") });
      });
      text(ctx, "← 뜨겁다      표면 온도(K)      차갑다 →", (GX0 + GX1) / 2, GY1 + 70, { s: 11, a: "center", c: v("--mist") });

      /* 판정 */
      var hs = strength(T, "H");
      text(ctx, "수소 흡수선의 세기 " + (hs * 100).toFixed(0) + " %" + (hs > 0.95 ? "  ← 가장 셉니다!" : ""),
        30, 466, { s: 13, w: "900", c: hs > 0.95 ? v("--teal-700") : v("--mist") });

      var ch = false;
      if (Math.abs(T - 9500) <= 400 && !G2.a) { G2.a = ch = true; }
      if (T >= 30000 && !G2.b) { G2.b = ch = true; }
      if (T <= 3400 && !G2.c) { G2.c = ch = true; }
      if (ch) { window.sthState("aSpec", G2); mission2(); }

      $("a-spec-read").innerHTML = "분광형: <b>" + cls + "형</b> · " + SPCOL[cls] + " · 최대 세기 파장 " + Math.round(lmax) + " nm";
      $("a-spec-info").innerHTML = "<b>" + cls + "형</b> — " + SPDESC[cls] +
        " 빈의 변위 법칙(최대 세기 파장 × 온도 = 2.898×10⁶ nm·K)으로 계산하면 이 별이 가장 세게 내놓는 빛의 파장은 <b>" + Math.round(lmax) + " nm</b> 입니다." +
        (sel ? "" : " 띠 위의 어두운 선을 눌러 그 자리에 남은 빛의 세기를 확인해 보세요.");
    }
    canvas._redraw = draw;
    canvas.addEventListener("click", function (e) {
      var p = hit(canvas, e);
      if (p.y < SY0 - 6 || p.y > SY1 + 6) return;
      var best = null, bd = 99;
      LINES.forEach(function (l) {
        if (strength(T, l.k) < 0.05) return;
        var d = Math.abs(p.x - XW(l.nm));
        if (d < bd && d <= lineW(l) / 2 + 9) { bd = d; best = l; }
      });
      if (!best) return;
      sel = best.n + best.nm;
      if (!G2.d) { G2.d = true; window.sthState("aSpec", G2); mission2(); }
      $("a-spec-info").innerHTML = "<b>" + best.n + " (" + best.nm.toFixed(1) + " nm)</b> — " + KDESC[best.k] +
        " 지금 이 자리에는 이 별이 내는 빛의 <b>" + (100 * (1 - 0.88 * strength(T, best.k))).toFixed(1) + " %</b> 가 남아 있습니다.";
      draw();
    });
    $("a-temp").addEventListener("input", function (e) {
      T = +e.target.value; $("a-temp-val").textContent = comma(T) + " K"; sel = ""; draw();
    });
    draw(); mission2();
  })();

  /* ---- 장면3 : 흑체 복사 법칙으로 별의 크기 재기 ---- */
  (function () {
    var canvas = $("a-c-sb"), ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var T = 5800, lr = 0;
    var got = window.sthState("aSB") || { a: false, b: false, c: false, d: false };

    function RR(R) { return 8 + 46 * clamp((Math.log(R) / Math.LN10 + 2.5) / 5.5, 0, 1); }

    function draw() {
      paper(ctx, W, H);
      var R = Math.pow(10, lr), tp = Math.pow(T / TSUN, 4), sp = R * R, L = tp * sp, lmax = WIEN / T;
      text(ctx, "광도 = (반지름)² × (표면 온도)⁴ — 흑체 복사 법칙 두 개를 한꺼번에", 30, 30, { s: 14, w: "900" });

      /* 크기 비교 */
      ctx.save(); ctx.fillStyle = starColor(TSUN);
      ctx.beginPath(); ctx.arc(120, 195, RR(1), 0, Math.PI * 2); ctx.fill(); ctx.restore();
      ctx.save(); ctx.shadowColor = starColor(T); ctx.shadowBlur = 20; ctx.fillStyle = starColor(T);
      ctx.beginPath(); ctx.arc(268, 195, RR(R), 0, Math.PI * 2); ctx.fill(); ctx.restore();
      text(ctx, "태양", 120, 278, { s: 12.5, a: "center", w: "800", c: v("--mist") });
      text(ctx, "이 별", 268, 278, { s: 12.5, a: "center", w: "900", c: v("--teal-700") });
      text(ctx, "반지름 " + num(R) + " 배", 268, 298, { s: 12, a: "center", c: v("--mist") });
      text(ctx, "크기는 로그로 줄여 그렸습니다", 200, 328, { s: 10.5, a: "center", c: v("--mist") });
      text(ctx, "이 별의 색 — " + SPCOL[spType(T)] + " (" + spType(T) + "형)", 200, 356, { s: 12, a: "center", w: "800", c: v("--mist") });

      /* 계산판 */
      var px = 400;
      ctx.strokeStyle = v("--line"); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(px, 76); ctx.lineTo(872, 76); ctx.stroke();
      text(ctx, "온도가 맡은 몫  (T ÷ 5,800)⁴", px, 104, { s: 11.5, w: "800", c: v("--mist") });
      text(ctx, num(tp) + " 배", px, 134, { s: 22, w: "900", c: Math.abs(T - 11600) <= 100 ? v("--teal-700") : v("--ink") });
      text(ctx, "크기가 맡은 몫  (R ÷ R☉)²", px, 176, { s: 11.5, w: "800", c: v("--mist") });
      text(ctx, num(sp) + " 배", px, 206, { s: 22, w: "900" });
      ctx.strokeStyle = v("--line"); ctx.beginPath(); ctx.moveTo(px, 234); ctx.lineTo(872, 234); ctx.stroke();
      text(ctx, "광도 (태양 = 1)", px, 258, { s: 11.5, w: "800", c: v("--mist") });
      text(ctx, num(L) + " 배", px, 290, { s: 30, w: "900", c: v("--teal-700") });
      text(ctx, "최대 세기 파장", px, 328, { s: 11.5, w: "800", c: v("--mist") });
      text(ctx, Math.round(lmax) + " nm  (" + (lmax < 380 ? "자외선" : (lmax > 750 ? "적외선" : "가시광선")) + ")", px, 352, { s: 15, w: "900", c: v("--violet-700") });

      /* 두 몫 막대 (로그) */
      var bx = px, bw = 460;
      function logbar(y, val, col) {
        var u = clamp((Math.log(Math.max(val, 1e-6)) / Math.LN10 + 6) / 12, 0, 1);
        band(ctx, bx, y, bw, 12, "--mist", 0.25);
        band(ctx, bx, y, bw * u, 12, col, 0.85);
      }
      logbar(140, tp, "--coral");
      logbar(212, sp, "--brand");

      var kind = (T <= 4000 && L >= 1000) ? "적색 거성" : ((R <= 0.02 && T >= 10000) ? "백색왜성" : "");
      text(ctx, kind ? "→ " + kind + " 입니다" : "온도와 반지름을 따로따로 움직여 보세요", px, 392, { s: 14, w: "900", c: kind ? v("--teal-700") : v("--mist") });
      text(ctx, "빈의 변위 법칙 : 최대 세기 파장 × 온도 = 2.898×10⁶ nm·K", 30, 424, { s: 11.5, c: v("--mist") });
      text(ctx, "슈테판·볼츠만 법칙 : 표면 1 m²가 내놓는 에너지 ∝ (표면 온도)⁴", 30, 446, { s: 11.5, c: v("--mist") });

      var ch = false;
      if (Math.abs(T - 11600) <= 100 && !got.a) { got.a = ch = true; }
      if (Math.abs(lr - 2) <= 0.005 && !got.b) { got.b = ch = true; }
      if (T <= 4000 && L >= 1000 && !got.c) { got.c = ch = true; }
      if (lr <= -2 && T >= 10000 && !got.d) { got.d = ch = true; }
      if (ch) { window.sthState("aSB", got); mission(); }

      $("a-sb-read").innerHTML = "광도: <b>태양의 " + num(L) + " 배</b> (온도 몫 " + num(tp) + " × 크기 몫 " + num(sp) + ")";
      $("a-sb-info").innerHTML = kind === "적색 거성"
        ? "<b>적색 거성입니다.</b> 표면은 태양보다 차가운데도 광도는 태양의 " + num(L) + " 배나 됩니다. 온도가 낮은 것을 <b>어마어마한 크기</b>가 덮고도 남은 것이지요. 베텔게우스가 이런 별입니다."
        : (kind === "백색왜성"
          ? "<b>백색왜성입니다.</b> 표면은 매우 뜨겁지만 지구만 한 크기라서 광도는 태양의 " + num(L) + " 배에 지나지 않습니다. 시리우스 B 가 이런 별입니다."
          : "표면 1 m²가 내놓는 에너지는 온도의 <b>네제곱</b>에 비례하고, 표면적은 반지름의 <b>제곱</b>에 비례합니다. 그래서 광도는 두 몫의 곱이 됩니다. 거꾸로 <b>광도와 온도를 관측하면 반지름</b>을 계산할 수 있습니다.");
    }
    function mission() {
      if (got.a) done("m1-3a"); if (got.b) done("m1-3b"); if (got.c) done("m1-3c"); if (got.d) done("m1-3d");
      if (got.a && got.b && got.c && got.d) {
        window.sthMission("m1-3", true, "<span class='m-tag'>미션 완료</span>온도가 2배면 광도는 <b>16배</b>, 반지름이 100배면 광도는 <b>10,000배</b>. 그래서 표면이 차가운 별도 크기만 하면 태양보다 수천 배 밝을 수 있고(<b>적색 거성</b>), 표면이 뜨거워도 작으면 아주 어둡습니다(<b>백색왜성</b>). 이 두 무리는 곧 H-R도에서 다시 만납니다.");
        ep.clear(2);
      }
    }
    canvas._redraw = draw;
    $("a-sbt").addEventListener("input", function (e) { T = +e.target.value; $("a-sbt-val").textContent = comma(T) + " K"; draw(); });
    $("a-sbr").addEventListener("input", function (e) {
      lr = +e.target.value; $("a-sbr-val").textContent = num(Math.pow(10, lr)) + " 배"; draw();
    });
    draw(); mission();
  })();

  /* ---- 장면4 : H-R도 ---- */
  function region(T, lL) {
    if (Math.abs(lL - msLogL(T)) <= 0.75) return "주계열성";
    if (lL >= 4) return "초거성";
    if (T >= 7000 && lL <= -2) return "백색왜성";
    if (lL > msLogL(T)) return "거성";
    return "주계열 아래의 어두운 별";
  }
  var G4 = window.sthState("aHR") || { a: false, b: false, c: false, d: false };
  function mission4() {
    if (G4.a) done("m1-4a"); if (G4.b) done("m1-4b"); if (G4.c) done("m1-4c"); if (G4.d) done("m1-4d");
    if (G4.a && G4.b && G4.c && G4.d) {
      window.sthMission("m1-4", true, "<span class='m-tag'>미션 완료</span>별의 90 % 가까이가 <b>주계열</b> 이라는 좁은 띠 위에 놓입니다. 그 띠 위에서는 <b>뜨거울수록 밝습니다.</b> 띠를 벗어난 별은 오른쪽 위의 <b>거성·초거성</b>(차가운데 밝다 = 아주 크다)이거나 왼쪽 아래의 <b>백색왜성</b>(뜨거운데 어둡다 = 아주 작다)입니다.");
      ep.clear(3); ep.clear(4);
    }
  }
  (function () {
    var canvas = $("a-c-hr"), ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var T = 4000, lL = 2.5;
    var X0 = 110, X1 = 672, Y0 = 60, Y1 = 440;
    var LT0 = Math.log(40000) / Math.LN10, LT1 = Math.log(2500) / Math.LN10;
    function XT(t) { return X0 + (LT0 - Math.log(t) / Math.LN10) / (LT0 - LT1) * (X1 - X0); }
    function YL(l) { return Y1 - (l + 5) / 11 * (Y1 - Y0); }

    var STARS = [
      { n: "태양", T: 5800, L: 0, g: "ms" },
      { n: "시리우스 A", T: 9940, L: 1.40, g: "ms" },
      { n: "프록시마", T: 3050, L: -2.77, g: "ms" },
      { n: "베텔게우스", T: 3600, L: 5.00, g: "gi" },
      { n: "리겔", T: 12100, L: 5.08, g: "gi" },
      { n: "알데바란", T: 3900, L: 2.64, g: "gi" },
      { n: "시리우스 B", T: 25000, L: -1.59, g: "wd" },
      { n: "프로키온 B", T: 7740, L: -3.31, g: "wd" }
    ];

    function draw() {
      paper(ctx, W, H);
      text(ctx, "H-R도 — 표면 온도와 광도를 한 장에 찍으면", 30, 30, { s: 14, w: "900" });
      axes(ctx, X0, Y0, X1, Y1);

      /* 등반지름선 */
      [[-2, "R = 0.01 R☉"], [0, "R = 1 R☉"], [2, "R = 100 R☉"]].forEach(function (r) {
        ctx.save(); ctx.strokeStyle = v("--line"); ctx.lineWidth = 1.2; ctx.setLineDash([3, 4]);
        ctx.beginPath();
        var t0 = 40000, t1 = 2500;
        ctx.moveTo(XT(t0), YL(clamp(2 * r[0] + 4 * (Math.log(t0 / TSUN) / Math.LN10), -5, 6)));
        ctx.lineTo(XT(t1), YL(clamp(2 * r[0] + 4 * (Math.log(t1 / TSUN) / Math.LN10), -5, 6)));
        ctx.stroke(); ctx.setLineDash([]); ctx.restore();
        var ly = 2 * r[0] + 4 * (Math.log(2500 / TSUN) / Math.LN10);
        text(ctx, r[1], X1 - 6, clamp(YL(ly) - 6, Y0 + 12, Y1 - 6), { s: 10, a: "right", c: v("--mist") });
      });

      /* 주계열 띠 */
      ctx.save(); ctx.strokeStyle = v("--teal"); ctx.globalAlpha = 0.3; ctx.lineWidth = 26; ctx.lineJoin = "round";
      ctx.beginPath();
      for (var i = 0; i <= 60; i++) {
        var lt = LT0 - i / 60 * (LT0 - LT1), tt = Math.pow(10, lt);
        var px = XT(tt), py = YL(clamp(msLogL(tt), -5, 6));
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke(); ctx.restore();
      text(ctx, "주계열", XT(9000) + 16, YL(msLogL(9000)) + 26, { s: 12.5, w: "900", c: v("--teal-700") });
      text(ctx, "초거성", XT(7000), YL(5.1), { s: 12.5, w: "900", c: v("--coral-700") });
      text(ctx, "거성", XT(5200), YL(3.2), { s: 12.5, w: "900", c: v("--coral-700") });
      text(ctx, "백색왜성", XT(13000), YL(-2.6), { s: 12.5, w: "900", c: v("--brand-700") });

      /* 실제 별 */
      STARS.forEach(function (s) {
        var px = XT(s.T), py = YL(s.L);
        ctx.save(); ctx.fillStyle = starColor(s.T); ctx.strokeStyle = v("--ink"); ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(px, py, 5.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.restore();
        text(ctx, s.n, clamp(px + 9, X0 + 4, X1 - 96), clamp(py + 4, Y0 + 10, Y1 - 4), { s: 10, c: v("--mist") });
      });

      /* 지금 이 점 */
      var cx = XT(T), cy = YL(lL);
      ctx.save(); ctx.shadowColor = starColor(T); ctx.shadowBlur = 16; ctx.fillStyle = starColor(T);
      ctx.beginPath(); ctx.arc(cx, cy, 10, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = v("--ink"); ctx.lineWidth = 2.4; ctx.stroke(); ctx.restore();

      /* 축 */
      [[40000, "40,000"], [10000, "10,000"], [5000, "5,000"], [2500, "2,500"]].forEach(function (m) {
        text(ctx, m[1], clamp(XT(m[0]), X0 + 22, X1 - 22), Y1 + 20, { s: 10.5, a: "center", c: v("--mist") });
      });
      text(ctx, "← 뜨겁다     표면 온도(K)     차갑다 →", (X0 + X1) / 2, Y1 + 36, { s: 11, a: "center", c: v("--mist") });
      [[-4, "10⁻⁴"], [-2, "10⁻²"], [0, "1"], [2, "10²"], [4, "10⁴"], [6, "10⁶"]].forEach(function (m) {
        text(ctx, m[1], X0 - 8, YL(m[0]) + 4, { s: 10.5, a: "right", c: v("--mist") });
      });
      text(ctx, "광도(태양 = 1)", X0 - 8, Y0 - 14, { s: 11, a: "right", c: v("--mist") });

      /* 판정판 */
      var px2 = 700, reg = region(T, lL), R = Math.sqrt(Math.pow(10, lL)) / Math.pow(T / TSUN, 2);
      text(ctx, "판정", px2, 80, { s: 12, w: "800", c: v("--mist") });
      ctx.strokeStyle = v("--line"); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(px2, 92); ctx.lineTo(884, 92); ctx.stroke();
      text(ctx, reg, px2, 122, { s: 16, w: "900", c: reg === "주계열성" ? v("--teal-700") : v("--coral-700") });
      text(ctx, "표면 온도", px2, 158, { s: 11, w: "800", c: v("--mist") });
      text(ctx, comma(T) + " K · " + spType(T) + "형", px2, 180, { s: 13, w: "800" });
      text(ctx, "광도 (태양 = 1)", px2, 212, { s: 11, w: "800", c: v("--mist") });
      text(ctx, num(Math.pow(10, lL)) + " 배", px2, 234, { s: 13, w: "800" });
      text(ctx, "계산한 반지름", px2, 266, { s: 11, w: "800", c: v("--mist") });
      text(ctx, num(R) + " R☉", px2, 288, { s: 16, w: "900", c: v("--violet-700") });
      text(ctx, "R = √광도 ÷ (T/5800)²", px2, 310, { s: 10.5, c: v("--mist") });
      text(ctx, "찾은 무리", px2, 344, { s: 11, w: "800", c: v("--mist") });
      text(ctx, (G4.a ? "✅" : "▫") + " 주계열", px2, 366, { s: 12, c: G4.a ? v("--teal-700") : v("--mist") });
      text(ctx, (G4.b ? "✅" : "▫") + " 백색왜성", px2, 386, { s: 12, c: G4.b ? v("--teal-700") : v("--mist") });
      text(ctx, (G4.c ? "✅" : "▫") + " 초거성", px2, 406, { s: 12, c: G4.c ? v("--teal-700") : v("--mist") });

      text(ctx, "점선은 반지름이 같은 별들이 놓이는 자리입니다. 같은 온도라면 위로 갈수록 큰 별입니다.", 30, 496, { s: 11.5, c: v("--mist") });
      text(ctx, "가로축이 오른쪽으로 갈수록 온도가 낮아진다는 점에 주의하세요 — H-R도의 오랜 약속입니다.", 30, 518, { s: 11.5, c: v("--mist") });

      var ch = false;
      if (reg === "주계열성" && !G4.a) { G4.a = ch = true; }
      if (reg === "백색왜성" && !G4.b) { G4.b = ch = true; }
      if (reg === "초거성" && !G4.c) { G4.c = ch = true; }
      if (ch) { window.sthState("aHR", G4); mission4(); }

      $("a-hr-read").innerHTML = "이 별은 <b>" + reg + "</b> · 반지름 약 " + num(R) + " R☉";
      $("a-hr-info").innerHTML = reg === "주계열성"
        ? "<b>주계열성</b>입니다. 중심에서 수소 핵융합을 하고 있는 별로, 별의 일생 가운데 가장 긴 시기입니다. 주계열 위에서는 <b>뜨거운 별일수록 밝습니다.</b>"
        : (reg === "백색왜성"
          ? "<b>백색왜성</b>입니다. 표면은 뜨거운데 광도가 아주 작다는 것은 별이 <b>몹시 작다</b>는 뜻입니다(지구만 한 크기). 별의 중심부가 남아 식어 가는 중입니다."
          : (reg === "초거성" || reg === "거성"
            ? "<b>" + reg + "</b>입니다. 표면은 차가운데 광도가 크다는 것은 별이 <b>엄청나게 크다</b>는 뜻입니다. 주계열을 떠난 별이 바깥층을 크게 부풀린 모습입니다."
            : "주계열 띠보다 아래, 그러나 백색왜성이라고 하기에는 온도가 낮은 자리입니다. 실제로 이런 자리에는 별이 거의 없습니다. 점을 옮겨 세 무리를 찾아보세요."));
    }
    canvas._redraw = draw;
    $("a-hrt").addEventListener("input", function (e) { T = +e.target.value; $("a-hrt-val").textContent = comma(T) + " K"; draw(); });
    $("a-hrl").addEventListener("input", function (e) {
      lL = +e.target.value; $("a-hrl-val").textContent = num(Math.pow(10, lL)) + " 배"; draw();
    });
    draw(); mission4();
  })();

  window.sthSort({
    mount: "a-sort",
    buckets: [
      { id: "ms", label: "주계열성", sub: "띠 위에 놓인다" },
      { id: "gi", label: "거성 · 초거성", sub: "차가운데 밝다" },
      { id: "wd", label: "백색왜성", sub: "뜨거운데 어둡다" }
    ],
    items: [
      { t: "태양 — 5,800 K, 광도 1 배", a: "ms", why: "주계열 띠 한가운데에 놓입니다. 우리에게 가장 익숙한 주계열성입니다." },
      { t: "시리우스 A — 9,940 K, 광도 25 배", a: "ms", why: "뜨겁고 밝아 주계열 띠의 위쪽에 놓입니다.", hint: "온도와 광도가 함께 커졌는지 보세요." },
      { t: "프록시마 센타우리 — 3,050 K, 광도 0.0017 배", a: "ms", why: "차갑고 어두워 주계열 띠의 맨 아래쪽에 놓입니다. 이런 별이 가장 흔합니다.", hint: "차갑고 어두우면 띠의 어디쯤일까요." },
      { t: "베텔게우스 — 3,600 K, 광도 약 10만 배", a: "gi", why: "표면이 차가운데 이만큼 밝으려면 지름이 태양의 수백 배여야 합니다. 적색 초거성입니다." },
      { t: "리겔 — 12,100 K, 광도 약 12만 배", a: "gi", why: "주계열 띠보다 훨씬 위에 놓이는 청색 초거성입니다." },
      { t: "알데바란 — 3,900 K, 광도 약 440 배", a: "gi", why: "주계열을 떠나 부풀어 오른 적색 거성입니다." },
      { t: "시리우스 B — 25,000 K, 광도 0.026 배", a: "wd", why: "아주 뜨거운데 어둡습니다. 크기가 지구만 한 백색왜성입니다." },
      { t: "프로키온 B — 7,740 K, 광도 0.00049 배", a: "wd", why: "역시 주계열보다 한참 아래에 놓이는 백색왜성입니다.", hint: "같은 온도의 주계열성과 견주어 얼마나 어두운지 보세요." }
    ],
    onDone: function () { G4.d = true; window.sthState("aHR", G4); mission4(); }
  });

  function finish() { window.sthState("r1", "해결 · O-B-A-F-G-K-M 은 온도의 순서, 흡수선 세기는 양이 아니라 온도가 정한다"); }
  function vsA() {
    var p = window.sthState("a-p") || "";
    $("a-vs").innerHTML = "<b>나의 첫 판단</b> " + (p || "기록 없음") + "<br>" +
      (p.indexOf("㉡") === 0 ? "정확했습니다. 수소는 어느 별에나 가장 많습니다. A형에서 선이 가장 진한 것은 그 온도에서 수소가 빛을 가장 잘 흡수하기 때문입니다."
        : "㉡ 이 정답이었습니다. 흡수선의 세기는 <b>원소의 양</b>이 아니라 <b>표면 온도</b>가 정합니다. 그래서 세기 순서로 매긴 알파벳이 깨졌던 것입니다.");
  }
  vsA();
  ep.onShow(vsA);
  window.sthWork({
    mount: "wkA", unitLabel: "[지구과학 Ⅲ-2] 이야기 ① 여자들의 별 목록",
    items: [
      { id: "w1", label: "분광형과 흡수선", hint: "O형과 M형 별의 스펙트럼에서 수소 흡수선의 세기가 다른 까닭을, 표면 온도와 연결지어 쓰세요.", ph: "O형은 …, M형은 … 이기 때문이다." },
      { id: "a2", label: "별의 반지름을 재는 방법", hint: "만져 볼 수도 없는 별의 반지름을 어떻게 알아내는지, 이 이야기에 나온 두 법칙의 이름을 넣어 설명하세요." }
    ]
  });
})();

/* =========================================================================
   이야기 ② 질량이 정한 일생
   ========================================================================= */
(function () {
  var ep = window.sthStory({ root: "epB", key: "epB", name: "사건 파일 ②", onDone: finish });

  window.sthGate({
    gate: "b-gate", key: "b-p", title: "관측 동아리 부장의 첫 예상",
    question: "성운이 <b>뜨거울수록</b> 별이 잘 태어날까요?",
    options: [
      "㉠ 그렇다 — 뜨거워야 핵융합이 쉽게 시작되기 때문이다",
      "㉡ 아니다 — 먼저 중력으로 수축해야 하므로 오히려 차갑고 밀도가 높아야 한다",
      "㉢ 아니다 — 성운의 온도는 별의 탄생과 아무 상관이 없다"
    ],
    onPick: function (i) { window.sthState("bPredOK", i === 1 ? "맞음" : "어긋남"); ep.clear(0); }
  });

  /* ---- 장면2 : 진스 질량 ---- */
  var GRAV = 6.674e-11, KB = 1.381e-23, MH = 1.673e-27, MSUN = 1.989e30, MU = 2.3;
  function jeans(T, n) {
    var rho = MU * MH * n * 1e6;
    var cs2 = 5 * KB * T / (MU * MH);
    return Math.pow(cs2 / GRAV, 1.5) * Math.sqrt(3 / (4 * Math.PI * rho)) / MSUN;
  }
  (function () {
    var canvas = $("b-c-jeans"), ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var T = 100, ln = 2, tick = 0;
    var CLOUD = 1000;
    var got = window.sthState("bJeans") || { a: false, b: false, c: false, d: false };

    function draw() {
      paper(ctx, W, H);
      var n = Math.pow(10, ln), MJ = jeans(T, n), collapse = MJ < CLOUD;
      text(ctx, "중력과 압력의 겨루기 — 이 성운은 별을 낳을 수 있는가", 30, 30, { s: 14, w: "900" });

      /* 성운 그림 */
      var cx = 205, cy = 225, R = 118;
      ctx.save();
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = v(collapse ? "--violet" : "--amber"); ctx.globalAlpha = 0.12; ctx.fill();
      ctx.restore();
      ctx.save(); ctx.strokeStyle = v("--line"); ctx.lineWidth = 1.5; ctx.setLineDash([5, 5]);
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); ctx.restore();

      var count = Math.round(clamp(20 + ln * 26, 20, 200));
      var rr = rnd32(7);
      var spread = collapse ? 0.55 + 0.45 * ((tick % 30) / 30) : 1;
      for (var i = 0; i < count; i++) {
        var ang = rr() * Math.PI * 2, rad = Math.sqrt(rr()) * R * 0.92;
        var jitter = (rr() - 0.5) * clamp(T / 40, 0.5, 8);
        var px = cx + Math.cos(ang) * rad * spread + jitter;
        var py = cy + Math.sin(ang) * rad * spread + jitter;
        ctx.save(); ctx.globalAlpha = 0.75;
        ctx.fillStyle = v(T > 80 ? "--amber" : "--brand");
        ctx.beginPath(); ctx.arc(px, py, 2.4, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      }
      ctx.save();
      ctx.strokeStyle = v(collapse ? "--violet" : "--amber"); ctx.fillStyle = v(collapse ? "--violet" : "--amber"); ctx.lineWidth = 3;
      for (var k = 0; k < 6; k++) {
        var a2 = k / 6 * Math.PI * 2;
        var r1 = collapse ? R + 24 : R - 18, r2 = collapse ? R - 14 : R + 28;
        window.drawArrow(ctx, cx + Math.cos(a2) * r1, cy + Math.sin(a2) * r1, cx + Math.cos(a2) * r2, cy + Math.sin(a2) * r2, 8);
      }
      ctx.restore();
      text(ctx, collapse ? "중력이 이긴다 — 수축!" : "압력이 이긴다 — 퍼져 버린다", cx, cy + R + 48,
        { s: 15, a: "center", w: "900", c: collapse ? v("--violet-700") : v("--amber-700") });
      text(ctx, "온도 " + T + " K · 수밀도 10" + sup(ln.toFixed(1)) + " 개/cm³", cx, cy + R + 72, { s: 11.5, a: "center", c: v("--mist") });

      /* 계산판 */
      var px2 = 430;
      text(ctx, "진스 질량 — 중력이 이기려면 적어도 이만큼은 무거워야 한다", px2, 70, { s: 12, w: "800", c: v("--mist") });
      ctx.strokeStyle = v("--line"); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(px2, 82); ctx.lineTo(872, 82); ctx.stroke();
      text(ctx, "이 성운 덩어리의 질량", px2, 110, { s: 11.5, w: "800", c: v("--mist") });
      text(ctx, comma(CLOUD) + " M☉", px2, 138, { s: 20, w: "900" });
      text(ctx, "계산한 진스 질량", px2, 178, { s: 11.5, w: "800", c: v("--mist") });
      text(ctx, num(MJ) + " M☉", px2, 216, { s: 30, w: "900", c: collapse ? v("--violet-700") : v("--amber-700") });

      var bx = px2, bw = 440;
      function lbar(y, val, col, lab) {
        var u = clamp((Math.log(Math.max(val, 0.01)) / Math.LN10 + 2) / 7, 0, 1);
        band(ctx, bx, y, bw, 14, "--mist", 0.25);
        band(ctx, bx, y, bw * u, 14, col, 0.85);
        text(ctx, lab, bx, y - 6, { s: 10.5, w: "800", c: v("--mist") });
      }
      lbar(252, CLOUD, "--teal", "성운의 질량 1,000 M☉");
      lbar(296, MJ, collapse ? "--violet" : "--amber", "진스 질량 " + num(MJ) + " M☉");
      text(ctx, collapse ? "진스 질량 < 성운의 질량  →  수축이 시작됩니다" : "진스 질량 > 성운의 질량  →  수축하지 못합니다",
        px2, 336, { s: 14, w: "900", c: collapse ? v("--violet-700") : v("--amber-700") });

      text(ctx, "진스 질량 ∝ 온도¹·⁵ ÷ √밀도", px2, 376, { s: 13, w: "900", c: v("--ink") });
      text(ctx, "온도를 내리거나 밀도를 높이면 진스 질량이 작아집니다.", px2, 398, { s: 11.5, c: v("--mist") });
      text(ctx, "곧, 차갑고 빽빽한 성운일수록 별을 낳기 쉽습니다.", px2, 418, { s: 11.5, c: v("--mist") });
      text(ctx, "실제 분자운은 온도 10~20 K, 수밀도 10³~10⁶ 개/cm³ 입니다.", 30, 446, { s: 11.5, c: v("--mist") });

      var ch = false;
      if (MJ < 100 && !got.a) { got.a = ch = true; }
      if (MJ > 5000 && !got.b) { got.b = ch = true; }
      if (T >= 50 && MJ < 100 && !got.c) { got.c = ch = true; }
      if (T <= 20 && ln >= 3 && MJ < 60 && !got.d) { got.d = ch = true; }
      if (ch) { window.sthState("bJeans", got); mission(); }

      $("b-jeans-read").innerHTML = "진스 질량: <b>" + num(MJ) + " M☉</b> · " + (collapse ? "수축 시작" : "수축 못 함");
      $("b-jeans-info").innerHTML = collapse
        ? "<b>수축이 시작됩니다.</b> 진스 질량(" + num(MJ) + " M☉)이 성운 덩어리의 질량(1,000 M☉)보다 작으므로, 기체의 압력이 중력을 막아 내지 못합니다. 수축이 시작되면 중력 에너지가 열로 바뀌어 중심부가 <b>차차 뜨거워집니다</b> — 온도가 올라가는 것은 수축의 <b>결과</b>입니다."
        : "<b>수축하지 못합니다.</b> 진스 질량(" + num(MJ) + " M☉)이 성운 덩어리의 질량보다 크기 때문입니다. 기체는 뜨거울수록 세게 퍼지려 하고, 성기면 중력이 약합니다. <b>온도를 낮추거나 밀도를 높여</b> 보세요.";
    }
    function mission() {
      if (got.a) done("m2-2a"); if (got.b) done("m2-2b"); if (got.c) done("m2-2c"); if (got.d) done("m2-2d");
      if (got.a && got.b && got.c && got.d) {
        window.sthMission("m2-2", true, "<span class='m-tag'>미션 완료</span>별이 태어나려면 <b>차갑고 빽빽해야</b> 합니다. 온도를 올리면 진스 질량이 커져 수축이 막히고, 밀도를 올리면 진스 질량이 작아져 수축이 쉬워집니다. 실제 분자운(10~20 K)에서는 진스 질량이 태양 질량의 수십 배까지 내려갑니다.");
        ep.clear(1);
      }
    }
    canvas._redraw = draw;
    $("b-jt").addEventListener("input", function (e) { T = +e.target.value; $("b-jt-val").textContent = T + " K"; draw(); });
    $("b-jn").addEventListener("input", function (e) {
      ln = +e.target.value; $("b-jn-val").textContent = "10" + sup(ln.toFixed(1)) + " 개/cm³"; draw();
    });
    draw(); mission();
    anim(canvas, function () { tick++; draw(); });
  })();

  /* ---- 장면3 : 주계열 수명 ---- */
  function msLum(M) { return Math.pow(M, 3.5); }
  function msLife(M) { return 1e10 * Math.pow(M, -2.5); }
  function endOf(M) { return M < 8 ? "백색왜성" : (M < 25 ? "중성자별" : "블랙홀"); }
  (function () {
    var canvas = $("b-c-life"), ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var M = 4;
    var got = window.sthState("bLife") || { a: false, b: false, c: false, d: false };
    var X0 = 95, X1 = 470, Y0 = 72, Y1 = 330;
    function XM(m) { return X0 + (Math.log(m) / Math.LN10 + 1) / 2.7 * (X1 - X0); }
    function YLu(l) { return Y1 - (l + 3.5) / 10 * (Y1 - Y0); }

    function draw() {
      paper(ctx, W, H);
      var L = msLum(M), t = msLife(M);
      text(ctx, "질량이 광도를 정하고, 광도가 수명을 정한다", 30, 30, { s: 14, w: "900" });

      axes(ctx, X0, Y0, X1, Y1);
      ctx.strokeStyle = v("--teal"); ctx.lineWidth = 3; ctx.beginPath();
      for (var i = 0; i <= 120; i++) {
        var lm = -1 + i / 120 * 2.7, mm = Math.pow(10, lm);
        var px = XM(mm), py = YLu(clamp(Math.log(msLum(mm)) / Math.LN10, -3.5, 6.5));
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
      [[0.1, "0.1"], [1, "1"], [10, "10"], [40, "40"]].forEach(function (m) {
        text(ctx, m[1], clamp(XM(m[0]), X0, X1), Y1 + 18, { s: 10.5, a: "center", c: v("--mist") });
      });
      text(ctx, "질량 (태양 = 1) →", X1, Y1 + 38, { s: 11, a: "right", c: v("--mist") });
      [[-3, "10⁻³"], [0, "1"], [3, "10³"], [6, "10⁶"]].forEach(function (m) {
        text(ctx, m[1], X0 - 8, YLu(m[0]) + 4, { s: 10.5, a: "right", c: v("--mist") });
      });
      text(ctx, "광도", X0 - 8, Y0 - 12, { s: 11, a: "right", c: v("--mist") });
      var cpx = XM(M), cpy = YLu(clamp(Math.log(L) / Math.LN10, -3.5, 6.5));
      ctx.save(); ctx.fillStyle = v("--coral");
      ctx.beginPath(); ctx.arc(cpx, cpy, 8, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = v("--ink"); ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
      text(ctx, "광도 = 질량³·⁵", X0 + 10, Y0 + 20, { s: 12, w: "800", c: v("--teal-700") });
      text(ctx, "태양", clamp(XM(1) - 4, X0, X1 - 30), YLu(0) + 20, { s: 10.5, a: "center", c: v("--mist") });

      /* 판정판 */
      var px = 520;
      text(ctx, "이 별의 자료", px, 70, { s: 12, w: "800", c: v("--mist") });
      ctx.strokeStyle = v("--line"); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(px, 82); ctx.lineTo(872, 82); ctx.stroke();
      text(ctx, "질량", px, 108, { s: 11, w: "800", c: v("--mist") });
      text(ctx, M.toFixed(1) + " M☉", px, 132, { s: 18, w: "900" });
      text(ctx, "광도", px + 170, 108, { s: 11, w: "800", c: v("--mist") });
      text(ctx, num(L) + " L☉", px + 170, 132, { s: 18, w: "900" });
      text(ctx, "주계열 수명 = 100억 년 × 질량⁻²·⁵", px, 168, { s: 11.5, w: "800", c: v("--mist") });
      text(ctx, fmtYear(t), px, 208, { s: 30, w: "900", c: v("--teal-700") });

      var bx = px, bw = 350;
      var u = clamp((Math.log(t) / Math.LN10 - 5) / 8, 0, 1);
      band(ctx, bx, 228, bw, 16, "--mist", 0.25);
      band(ctx, bx, 228, bw * u, 16, t > 1.38e10 ? "--violet" : (t < 1e7 ? "--rose" : "--teal"), 0.85);
      var uUni = clamp((Math.log(1.38e10) / Math.LN10 - 5) / 8, 0, 1);
      dash(ctx, bx + bw * uUni, 222, bx + bw * uUni, 250, "--ink");
      text(ctx, "우주의 나이 138억 년", clamp(bx + bw * uUni, px + 70, 800), 266, { s: 10.5, a: "center", c: v("--mist") });

      text(ctx, "중심부의 핵융합", px, 300, { s: 11, w: "800", c: v("--mist") });
      text(ctx, M < 1.3 ? "p-p 반응 (양성자 · 양성자 연쇄)" : "CNO 순환 (탄소 · 질소 · 산소가 촉매)",
        px, 324, { s: 14, w: "900", c: Math.abs(M - 1.3) <= 0.1 ? v("--teal-700") : v("--violet-700") });
      text(ctx, "주계열을 떠난 뒤의 마지막 모습", px, 358, { s: 11, w: "800", c: v("--mist") });
      text(ctx, endOf(M), px, 384, { s: 18, w: "900", c: v("--coral-700") });
      text(ctx, "질량이 2배가 되면 광도는 약 11배가 되고 수명은 약 5.7분의 1로 줄어듭니다.", 30, 420, { s: 11.5, c: v("--mist") });
      text(ctx, "연료가 많아도 헤프게 쓰면 먼저 바닥납니다 — 무거운 별이 먼저 죽는 까닭입니다.", 30, 442, { s: 11.5, c: v("--mist") });

      var ch = false;
      if (Math.abs(M - 1) < 0.05 && !got.a) { got.a = ch = true; }
      if (t > 1.38e10 && !got.b) { got.b = ch = true; }
      if (t < 1e7 && !got.c) { got.c = ch = true; }
      if (Math.abs(M - 1.3) <= 0.1 && !got.d) { got.d = ch = true; }
      if (ch) { window.sthState("bLife", got); mission(); }

      $("b-life-read").innerHTML = "주계열 수명: <b>" + fmtYear(t) + "</b> (광도 " + num(L) + " L☉)";
      $("b-life-info").innerHTML = "질량이 " + M.toFixed(1) + " M☉ 인 주계열성입니다. 광도는 질량의 약 <b>3.5제곱</b>에 비례하므로, 질량이 커지면 연료보다 <b>쓰는 속도</b>가 훨씬 빨리 늘어납니다. 그래서 수명 = 연료 ÷ 쓰는 속도 ∝ 질량⁻²·⁵ 이 되어 " +
        (t > 1.38e10 ? "이 별은 <b>우주가 태어난 뒤로 아직 한 번도 주계열을 떠난 적이 없습니다.</b>"
          : (t < 1e7 ? "이 별은 <b>1,000만 년도 못 되어</b> 주계열을 떠납니다." : "이 별은 약 " + fmtYear(t) + " 동안 주계열에 머무릅니다.")) +
        " 중심부에서는 " + (M < 1.3 ? "<b>p-p 반응</b>" : "<b>CNO 순환</b>") + "이 주로 일어납니다.";
    }
    function mission() {
      if (got.a) done("m2-3a"); if (got.b) done("m2-3b"); if (got.c) done("m2-3c"); if (got.d) done("m2-3d");
      if (got.a && got.b && got.c && got.d) {
        window.sthMission("m2-3", true, "<span class='m-tag'>미션 완료</span>태양은 약 <b>100억 년</b>, 태양 질량의 0.8배 별은 <b>우주 나이보다 길게</b>, 16배 별은 <b>1,000만 년도 못 되게</b> 주계열에 머무릅니다. 질량 하나가 광도·수명·핵융합 방식·마지막 모습을 모두 정합니다.");
        ep.clear(2);
      }
    }
    canvas._redraw = draw;
    $("b-m").addEventListener("input", function (e) { M = +e.target.value; $("b-m-val").textContent = M.toFixed(1) + " 배"; draw(); });
    draw(); mission();
  })();

  /* ---- 장면4 : 진화 경로 ---- */
  var G4 = window.sthState("bPath") || { a: false, b: false, c: false, d: false };
  function mission4() {
    if (G4.a) done("m2-4a"); if (G4.b) done("m2-4b"); if (G4.c) done("m2-4c"); if (G4.d) done("m2-4d");
    if (G4.a && G4.b && G4.c && G4.d) {
      window.sthMission("m2-4", true, "<span class='m-tag'>미션 완료</span>태양 질량의 <b>8배 아래</b>는 적색 거성 → 행성상 성운 → <b>백색왜성</b>, <b>8~25배</b>는 초거성 → 초신성 → <b>중성자별</b>, <b>25배 위</b>는 초신성 뒤에 <b>블랙홀</b>이 남습니다. 갈림길을 정하는 것은 태어날 때의 질량뿐입니다.");
      ep.clear(3); ep.clear(4);
    }
  }
  (function () {
    var canvas = $("b-c-path"), ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var M = 1, prog = 0, playing = false;
    var X0 = 100, X1 = 640, Y0 = 60, Y1 = 410;
    var LT0 = Math.log(40000) / Math.LN10, LT1 = Math.log(2500) / Math.LN10;
    function XT(t) { return X0 + (LT0 - Math.log(clamp(t, 2500, 40000)) / Math.LN10) / (LT0 - LT1) * (X1 - X0); }
    function YL(l) { return Y1 - (clamp(l, -5, 7) + 5) / 12 * (Y1 - Y0); }
    function msT(M) {
      var target = Math.log(msLum(M)) / Math.LN10, lo = 2500, hi = 42000;
      for (var i = 0; i < 40; i++) {
        var mid = Math.sqrt(lo * hi);
        if (msLogL(mid) < target) lo = mid; else hi = mid;
      }
      return clamp(Math.sqrt(lo * hi), 2500, 40000);
    }
    function path(M) {
      var lms = Math.log(msLum(M)) / Math.LN10, tms = msT(M);
      var big = M >= 8;
      var out = [
        { T: 3400, L: lms + 1.3, n: "원시별", d: "차가운 성운이 수축해 중심부가 뜨거워지는 중입니다. 아직 핵융합은 시작되지 않았고, 크고 붉으며 적외선으로 관측됩니다." },
        { T: tms, L: lms, n: "주계열성", d: "중심부에서 수소 핵융합이 시작되었습니다. 별의 일생 가운데 가장 길고 안정된 시기로, 이 질량에서는 약 " + fmtYear(msLife(M)) + " 동안 머무릅니다." },
        { T: big ? 3800 : 3600, L: big ? lms + 0.4 : Math.max(2.8, lms + 2.6), n: big ? "적색 초거성" : "적색 거성", d: "중심부의 수소가 바닥나면 바깥층이 크게 부풀어 오릅니다. 표면 온도는 내려가는데 크기가 훨씬 커져 광도는 오히려 올라갑니다." }
      ];
      if (big) {
        out.push({ T: 5000, L: 7.6, n: "초신성 폭발", d: "중심에 철이 쌓이면 더 이상 핵융합으로 버틸 수 없어 별이 한꺼번에 무너지고 폭발합니다. 이때 철보다 무거운 원소가 만들어져 우주로 흩어집니다." });
        out.push({ T: M < 25 ? 30000 : 12000, L: M < 25 ? -1.5 : -4.6, n: M < 25 ? "중성자별" : "블랙홀", d: M < 25 ? "중심부가 눌려 중성자만 남은 별입니다. 지름이 20 km 남짓인데 질량은 태양만 합니다. 빠르게 돌며 전파를 내보내면 펄서로 관측됩니다." : "빛조차 빠져나오지 못할 만큼 중력이 센 천체가 남습니다. 스스로 빛을 내지 않으므로 둘레 물질의 움직임으로만 알아냅니다." });
      } else {
        out.push({ T: 45000, L: Math.max(2.6, lms + 2.4), n: "행성상 성운", d: "부풀었던 바깥층이 우주로 흩어지고, 드러난 뜨거운 중심부가 그 기체를 비춥니다. 이렇게 흩어진 물질이 다음 세대 별의 재료가 됩니다." });
        out.push({ T: 14000, L: -2.6, n: "백색왜성", d: "남은 중심부는 더 이상 핵융합을 하지 않고, 지구만 한 크기로 눌린 채 아주 천천히 식어 갑니다." });
      }
      return out;
    }

    function draw() {
      paper(ctx, W, H);
      var P = path(M), seg = Math.min(Math.floor(prog), P.length - 1), f = clamp(prog - seg, 0, 1);
      text(ctx, "H-R도 위에 그린 진화 경로 — 갈림길을 정하는 것은 질량뿐", 30, 30, { s: 14, w: "900" });
      axes(ctx, X0, Y0, X1, Y1);

      /* 주계열 띠 */
      ctx.save(); ctx.strokeStyle = v("--teal"); ctx.globalAlpha = 0.22; ctx.lineWidth = 22; ctx.lineJoin = "round";
      ctx.beginPath();
      for (var i = 0; i <= 50; i++) {
        var lt = LT0 - i / 50 * (LT0 - LT1), tt = Math.pow(10, lt);
        var px = XT(tt), py = YL(msLogL(tt));
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke(); ctx.restore();
      text(ctx, "주계열", XT(12000) + 14, YL(msLogL(12000)) + 24, { s: 11.5, w: "900", c: v("--teal-700") });

      /* 경로 */
      ctx.save(); ctx.strokeStyle = v("--coral"); ctx.lineWidth = 3; ctx.setLineDash([6, 5]);
      ctx.beginPath();
      P.forEach(function (p, i) {
        var px2 = XT(p.T), py2 = YL(p.L);
        if (i === 0) ctx.moveTo(px2, py2); else ctx.lineTo(px2, py2);
      });
      ctx.stroke(); ctx.setLineDash([]); ctx.restore();

      var placed = [];
      P.forEach(function (p, i) {
        var px2 = XT(p.T), py2 = YL(p.L), on = i <= seg;
        ctx.save();
        ctx.fillStyle = v(on ? "--coral" : "--mist"); ctx.globalAlpha = on ? 0.95 : 0.4;
        ctx.beginPath(); ctx.arc(px2, py2, 7, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        var DY = [-14, 18, 32, -28, 24];                       /* 단계마다 위아래로 엇갈려 글자가 겹치지 않게 */
        /* 라벨이 서로 겹치면 자리가 빌 때까지 아래로 밀어 놓는다 */
        var left = (i === 0), lab = (i + 1) + ". " + p.n;
        ctx.font = (on ? "900" : "500") + " 11.5px " + FONT;
        var lw = ctx.measureText(lab).width;
        var lx = left ? clamp(px2 - 11, X0 + 76, X1 - 4) : clamp(px2 + 11, X0 + 4, X1 - 92);
        var ly2 = clamp(py2 + DY[i % 5], Y0 + 12, Y1 - 6);
        var lL = left ? lx - lw : lx, lR = lL + lw;
        for (var g = 0; g < 14; g++) {
          var hit = false;
          for (var q = 0; q < placed.length; q++) {
            var o = placed[q];
            if (Math.min(lR, o.R) - Math.max(lL, o.L) > 2 && Math.min(ly2 + 4, o.B) - Math.max(ly2 - 10, o.T) > 2) { hit = true; break; }
          }
          if (!hit) break;
          ly2 = clamp(ly2 + 16, Y0 + 12, Y1 - 6);
        }
        placed.push({ L: lL, R: lR, T: ly2 - 10, B: ly2 + 4 });
        text(ctx, lab, lx, ly2, { s: 11.5, w: on ? "900" : "500", a: left ? "right" : "left", c: on ? v("--ink") : v("--mist") });
      });

      /* 움직이는 별 */
      var a = P[seg], b = P[Math.min(seg + 1, P.length - 1)];
      var nx = XT(a.T) + (XT(b.T) - XT(a.T)) * f, ny = YL(a.L) + (YL(b.L) - YL(a.L)) * f;
      ctx.save(); ctx.shadowColor = starColor(a.T); ctx.shadowBlur = 18; ctx.fillStyle = starColor(a.T);
      ctx.beginPath(); ctx.arc(nx, ny, 9, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = v("--ink"); ctx.lineWidth = 2; ctx.stroke(); ctx.restore();

      [[40000, "40,000"], [10000, "10,000"], [5000, "5,000"], [2500, "2,500"]].forEach(function (m) {
        text(ctx, m[1], clamp(XT(m[0]), X0 + 22, X1 - 22), Y1 + 20, { s: 10.5, a: "center", c: v("--mist") });
      });
      text(ctx, "← 뜨겁다     표면 온도(K)     차갑다 →", (X0 + X1) / 2, Y1 + 34, { s: 11, a: "center", c: v("--mist") });
      [[-4, "10⁻⁴"], [0, "1"], [3, "10³"], [6, "10⁶"]].forEach(function (m) {
        text(ctx, m[1], X0 - 8, YL(m[0]) + 4, { s: 10.5, a: "right", c: v("--mist") });
      });
      text(ctx, "광도", X0 - 8, Y0 - 14, { s: 11, a: "right", c: v("--mist") });

      /* 오른쪽 */
      var px3 = 668;
      text(ctx, "태어날 때의 질량", px3, 80, { s: 11, w: "800", c: v("--mist") });
      text(ctx, M.toFixed(1) + " M☉", px3, 108, { s: 22, w: "900" });
      text(ctx, "지금 단계", px3, 146, { s: 11, w: "800", c: v("--mist") });
      text(ctx, P[seg].n, px3, 174, { s: 18, w: "900", c: v("--coral-700") });
      text(ctx, "마지막 모습", px3, 214, { s: 11, w: "800", c: v("--mist") });
      text(ctx, endOf(M), px3, 242, { s: 20, w: "900", c: v("--violet-700") });
      text(ctx, "찾은 마지막", px3, 286, { s: 11, w: "800", c: v("--mist") });
      text(ctx, (G4.a ? "✅" : "▫") + " 백색왜성 (8배 미만)", px3, 308, { s: 11.5, c: G4.a ? v("--teal-700") : v("--mist") });
      text(ctx, (G4.b ? "✅" : "▫") + " 중성자별 (8~25배)", px3, 330, { s: 11.5, c: G4.b ? v("--teal-700") : v("--mist") });
      text(ctx, (G4.c ? "✅" : "▫") + " 블랙홀 (25배 이상)", px3, 352, { s: 11.5, c: G4.c ? v("--teal-700") : v("--mist") });
      text(ctx, "질량을 바꾸면 경로가 통째로 달라집니다.", px3, 392, { s: 11, c: v("--mist") });

      text(ctx, "화살표를 따라가면 별은 오른쪽 위(부푼 시기)를 거쳐 왼쪽 아래(작고 식은 시기)로 갑니다.", 30, 470, { s: 11.5, c: v("--mist") });
      text(ctx, "무거운 별은 죽으면서 만든 무거운 원소를 우주로 돌려보냅니다 — 다음 세대 별과 행성의 재료입니다.", 30, 480, { s: 11.5, c: v("--mist") });

      var ch = false;
      if (M < 8 && !G4.a) { G4.a = ch = true; }
      if (M >= 8 && M < 25 && !G4.b) { G4.b = ch = true; }
      if (M >= 25 && !G4.c) { G4.c = ch = true; }
      if (ch) { window.sthState("bPath", G4); mission4(); }

      $("b-path-info").innerHTML = "<b>" + P[seg].n + "</b> — " + P[seg].d +
        " <br>태양 질량의 " + M.toFixed(1) + " 배로 태어난 이 별의 마지막은 <b>" + endOf(M) + "</b> 입니다.";
    }
    canvas._redraw = draw;
    $("b-pm").addEventListener("input", function (e) {
      M = +e.target.value; $("b-pm-val").textContent = M.toFixed(1) + " 배"; prog = 0; draw();
    });
    $("b-play").addEventListener("click", function () {
      playing = true; prog = 0; this.classList.add("on"); draw();
    });
    draw(); mission4();
    anim(canvas, function () {
      if (!playing) return;
      prog += 0.09;
      var n = path(M).length - 1;
      if (prog >= n) { prog = n; playing = false; var b = $("b-play"); if (b) b.classList.remove("on"); }
      draw();
    });
  })();

  window.sthOrder({
    mount: "b-order",
    steps: [
      "① 차갑고 빽빽한 성운이 중력으로 수축하기 시작한다",
      "② 수축으로 중심부가 뜨거워져 원시별이 된다",
      "③ 중심 온도가 1,000만 K 를 넘어 수소 핵융합이 시작되고 주계열성이 된다",
      "④ 중심부의 수소가 바닥나고 바깥층이 부풀어 적색 거성이 된다",
      "⑤ 부풀었던 바깥층이 흩어져 행성상 성운이 된다",
      "⑥ 남은 중심부가 백색왜성으로 천천히 식어 간다"
    ],
    onDone: function () { G4.d = true; window.sthState("bPath", G4); mission4(); }
  });

  function finish() { window.sthState("r2", "해결 · 별은 차갑고 빽빽한 성운에서 태어나고, 마지막 모습은 질량이 정한다"); }
  function vsB() {
    var p = window.sthState("b-p") || "";
    $("b-vs").innerHTML = "<b>나의 첫 예상</b> " + (p || "기록 없음") + "<br>" +
      (p.indexOf("㉡") === 0 ? "정확했습니다. 별이 태어나는 곳은 온도가 10~20 K 밖에 되지 않는 차갑고 빽빽한 분자운 속이었습니다."
        : "㉡ 이 정답이었습니다. 먼저 <b>중력 수축</b>이 일어나야 별이 됩니다. 온도가 높으면 기체가 퍼져 버려 오히려 수축을 막습니다.");
  }
  vsB();
  ep.onShow(vsB);
  window.sthWork({
    mount: "wkB", unitLabel: "[지구과학 Ⅲ-2] 이야기 ② 질량이 정한 일생",
    items: [
      { id: "w2", label: "H-R도에서 읽은 것", hint: "질량이 큰 별과 작은 별의 진화 경로가 H-R도에서 어떻게 갈라지는지, 두 별을 골라 비교해 쓰세요." },
      { id: "b2", label: "동아리 부장에게 보내는 답장", hint: "밝게 빛나는 성운이 아니라 검고 차가운 성운에서 별이 태어나는 까닭을, 중력과 압력이라는 말을 넣어 설명하세요." }
    ]
  });
})();

/* =========================================================================
   이야기 ③ 은하 동물원
   ========================================================================= */
(function () {
  var ep = window.sthStory({ root: "epC", key: "epC", name: "사건 파일 ③", onDone: finish });

  window.sthGate({
    gate: "c-gate", key: "c-p", title: "관측실의 첫 추리",
    question: "별처럼 점으로만 보이는 <b>3C 273</b>, 정체가 무엇일까요?",
    options: [
      "㉠ 우리은하 안에 있는 아주 특별한 별이다",
      "㉡ 아주 멀리 있는 은하인데, 중심핵이 은하 전체보다 밝아 점처럼 보이는 것이다",
      "㉢ 망원경이나 사진 건판이 만들어 낸 허상이다"
    ],
    onPick: function (i) { window.sthState("cPredOK", i === 1 ? "맞음" : "어긋남"); ep.clear(0); }
  });

  /* ---- 장면2 : 허블의 소리굽쇠 ---- */
  var G2 = window.sthState("cFork") || { a: false, b: false, c: false, d: false, seen: [] };
  if (!G2.seen) G2.seen = [];
  function mission2() {
    if (G2.a) done("m3-2a"); if (G2.b) done("m3-2b"); if (G2.c) done("m3-2c"); if (G2.d) done("m3-2d");
    if (G2.seen.length >= 4) done("m3-2e");
    if (G2.a && G2.b && G2.c && G2.d && G2.seen.length >= 4) {
      window.sthMission("m3-2", true, "<span class='m-tag'>미션 완료</span>타원 은하는 <b>편평도 e = 10(1 − b/a)</b> 로 E0~E7, 나선 은하는 <b>팽대부가 클수록 Sa, 작고 팔이 느슨할수록 Sc</b> 입니다. 막대가 있으면 SB 를 붙이고, 어느 쪽에도 들지 않으면 불규칙 은하입니다. 이 분류는 <b>모양</b>에 따른 것일 뿐 변해 가는 순서가 아닙니다.");
      ep.clear(1);
    }
  }
  (function () {
    var canvas = $("c-c-fork"), ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var type = "ell", ell = 3, bulge = 25;

    function spiralCls(b) { return b >= 30 ? "a" : (b >= 15 ? "b" : "c"); }
    function label() {
      if (type === "ell") return "E" + ell;
      if (type === "spiral") return "S" + spiralCls(bulge);
      if (type === "barred") return "SB" + spiralCls(bulge);
      return "Irr";
    }
    function drawSpiral(cx, cy, R, bul, barred, alpha) {
      var al = (alpha === undefined ? 1 : alpha);
      var pitch = 5 + (45 - bul) * 0.65;
      ctx.save();
      ctx.fillStyle = v("--brand"); ctx.globalAlpha = al * 0.18;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = al;
      var bR = R * clamp(bul / 100 * 1.6, 0.08, 0.7);
      var bStart = barred ? bR * 1.8 : bR;
      if (barred) {
        ctx.save(); ctx.fillStyle = v("--amber"); ctx.globalAlpha = al * 0.85;
        ctx.beginPath(); ctx.ellipse(cx, cy, bR * 1.8, bR * 0.42, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      }
      ctx.strokeStyle = v("--teal"); ctx.lineWidth = Math.max(2, R / 34);
      var bb = Math.tan(pitch * Math.PI / 180);
      for (var s = 0; s < 2; s++) {
        ctx.beginPath();
        var first = true;
        for (var th = 0; th <= 4.2; th += 0.06) {
          var r = bStart * Math.exp(bb * th);
          if (r > R) break;
          var ang = th + s * Math.PI;
          var px = cx + r * Math.cos(ang), py = cy + r * Math.sin(ang);
          if (first) { ctx.moveTo(px, py); first = false; } else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
      ctx.fillStyle = v("--amber");
      ctx.beginPath(); ctx.arc(cx, cy, bR, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    function drawEll(cx, cy, a, e, alpha) {
      var b = a * (1 - e / 10);
      ctx.save(); ctx.globalAlpha = (alpha === undefined ? 1 : alpha) * 0.85;
      ctx.fillStyle = v("--coral");
      ctx.beginPath(); ctx.ellipse(cx, cy, a, Math.max(b, 3), 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
    function drawIrr(cx, cy, R, alpha) {
      var rr = rnd32(11);
      ctx.save(); ctx.globalAlpha = (alpha === undefined ? 1 : alpha) * 0.8; ctx.fillStyle = v("--violet");
      for (var i = 0; i < 16; i++) {
        var a = rr() * Math.PI * 2, d = Math.sqrt(rr()) * R * 0.9;
        ctx.beginPath(); ctx.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.7, R * (0.12 + rr() * 0.2), 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }

    function draw() {
      paper(ctx, W, H);
      text(ctx, "허블의 소리굽쇠 — 모양만으로 은하를 가른다", 30, 30, { s: 14, w: "900" });

      /* 미리보기 */
      var cx = 225, cy = 225;
      if (type === "ell") {
        drawEll(cx, cy, 148, ell);
        ctx.save(); ctx.strokeStyle = v("--line"); ctx.lineWidth = 1.6; ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.moveTo(cx - 168, cy); ctx.lineTo(cx + 168, cy); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx, cy - 168); ctx.lineTo(cx, cy + 168); ctx.stroke();
        ctx.setLineDash([]); ctx.restore();
        text(ctx, "장반경 a", cx + 76, cy - 8, { s: 11, a: "center", c: v("--mist") });
        text(ctx, "단반경 b", cx + 30, cy - 148 * (1 - ell / 10) / 2 - 4, { s: 11, c: v("--mist") });
      } else if (type === "irr") {
        drawIrr(cx, cy, 140);
      } else {
        drawSpiral(cx, cy, 148, bulge, type === "barred");
      }
      text(ctx, label(), cx, 412, { s: 30, a: "center", w: "900", c: v("--teal-700") });

      /* 소리굽쇠 도표 */
      var FX = 470;
      text(ctx, "소리굽쇠 도표", FX, 64, { s: 12, w: "800", c: v("--mist") });
      ctx.strokeStyle = v("--line"); ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(FX + 150, 230); ctx.lineTo(FX + 195, 150); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(FX + 150, 230); ctx.lineTo(FX + 195, 310); ctx.stroke();
      var MAP = [
        { k: "ell", e: 0, x: FX + 30, y: 230, n: "E0" },
        { k: "ell", e: 4, x: FX + 90, y: 230, n: "E4" },
        { k: "ell", e: 7, x: FX + 145, y: 230, n: "E7" },
        { k: "spiral", b: 40, x: FX + 235, y: 150, n: "Sa" },
        { k: "spiral", b: 22, x: FX + 300, y: 150, n: "Sb" },
        { k: "spiral", b: 8, x: FX + 365, y: 150, n: "Sc" },
        { k: "barred", b: 40, x: FX + 235, y: 310, n: "SBa" },
        { k: "barred", b: 22, x: FX + 300, y: 310, n: "SBb" },
        { k: "barred", b: 8, x: FX + 365, y: 310, n: "SBc" },
        { k: "irr", x: FX + 300, y: 398, n: "Irr" }
      ];
      MAP.forEach(function (m) {
        var on = (m.k === type) && (m.k === "irr" ||
          (m.k === "ell" ? Math.abs(m.e - ell) <= 1 : spiralCls(m.b) === spiralCls(bulge)));
        if (m.k === "ell") drawEll(m.x, m.y, 22, m.e, on ? 1 : 0.4);
        else if (m.k === "irr") drawIrr(m.x, m.y, 20, on ? 1 : 0.4);
        else drawSpiral(m.x, m.y, 24, m.b, m.k === "barred", on ? 1 : 0.4);
        text(ctx, m.n, m.x, m.y + 42, { s: 11, a: "center", w: on ? "900" : "500", c: on ? v("--teal-700") : v("--mist") });
        if (on) {
          ctx.save(); ctx.strokeStyle = v("--teal"); ctx.lineWidth = 2.4;
          ctx.beginPath(); ctx.arc(m.x, m.y, 31, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
        }
      });

      /* 판정 */
      var msg, sub;
      if (type === "ell") {
        var ba = 1 - ell / 10;
        msg = "b ÷ a = " + ba.toFixed(1) + "  →  e = 10 × (1 − " + ba.toFixed(1) + ") = " + ell;
        sub = ell === 0 ? "거의 완전한 공 모양입니다." : (ell >= 6 ? "매우 납작합니다. E7 보다 더 납작한 타원 은하는 분류하지 않습니다." : "적당히 찌그러진 타원 은하입니다.");
      } else if (type === "irr") {
        msg = "편평도나 나선팔로는 나눌 수 없는 모양입니다";
        sub = "대마젤란은하·소마젤란은하가 대표적입니다. 성간 물질이 많고 젊은 별이 활발히 태어납니다.";
      } else {
        msg = "팽대부가 " + bulge + " % → " + label() + " (나선팔 감김 각 약 " + Math.round(5 + (45 - bulge) * 0.65) + "°)";
        sub = spiralCls(bulge) === "a" ? "팽대부가 크고 나선팔이 꽉 감겨 있습니다." : (spiralCls(bulge) === "c" ? "팽대부가 작고 나선팔이 느슨하게 풀려 있습니다." : "팽대부와 나선팔이 중간쯤입니다.");
      }
      text(ctx, msg, 30, 444, { s: 13, w: "900", c: v("--ink") });
      text(ctx, "타원 은하는 늙고 붉은 별이 많고 성간 물질이 적습니다. 나선팔에는 성간 물질과 젊고 푸른 별이 많습니다.", 30, 466, { s: 11, c: v("--mist") });

      var ch = false;
      if (type === "ell" && ell === 0 && !G2.a) { G2.a = ch = true; }
      if (type === "ell" && ell === 7 && !G2.b) { G2.b = ch = true; }
      if ((type === "spiral" || type === "barred") && spiralCls(bulge) === "a" && !G2.c) { G2.c = ch = true; }
      if ((type === "spiral" || type === "barred") && spiralCls(bulge) === "c" && !G2.d) { G2.d = ch = true; }
      if (G2.seen.indexOf(type) < 0) { G2.seen.push(type); ch = true; }
      if (ch) { window.sthState("cFork", G2); mission2(); }

      $("c-fork-read").innerHTML = "분류: <b>" + label() + "</b> · 살펴본 유형 " + G2.seen.length + " / 4";
      $("c-fork-info").innerHTML = "<b>" + label() + "</b> — " + sub +
        " 허블은 은하를 <b>타원 은하(E)</b>, <b>정상 나선 은하(S)</b>, <b>막대 나선 은하(SB)</b>, <b>불규칙 은하(Irr)</b> 로 나누었습니다. 타원 은하는 편평도 <b>e = 10(1 − b/a)</b> 로 E0~E7 로, 나선 은하는 <b>팽대부의 크기와 나선팔이 감긴 정도</b>로 a·b·c 를 붙여 가릅니다.";
    }
    canvas._redraw = draw;
    segWire("c-type", function (b) { type = b.getAttribute("data-t"); draw(); });
    $("c-ell").addEventListener("input", function (e) { ell = +e.target.value; $("c-ell-val").textContent = ell; draw(); });
    $("c-bulge").addEventListener("input", function (e) { bulge = +e.target.value; $("c-bulge-val").textContent = bulge + " %"; draw(); });
    draw(); mission2();
  })();

  /* ---- 장면3 : 분류표 ---- */
  var G3 = window.sthState("cSort") || { a: false, b: false };
  function mission3() {
    if (G3.a) done("m3-3a"); if (G3.b) done("m3-3b");
    if (G3.a && G3.b) {
      window.sthMission("m3-3", true, "<span class='m-tag'>미션 완료</span>타원 은하에는 성간 물질이 적어 새 별이 거의 태어나지 않고, 그래서 <b>늙고 붉은 별</b>이 많습니다. 나선 은하의 <b>나선팔</b>에는 성간 물질이 많아 젊고 푸른 별이 활발히 태어납니다. 불규칙 은하도 성간 물질이 많은 편입니다.");
      ep.clear(2);
    }
  }
  window.sthSort({
    mount: "c-sort",
    buckets: [
      { id: "ell", label: "타원 은하 (E)", sub: "나선팔이 없다" },
      { id: "spiral", label: "정상 나선 은하 (S)", sub: "팽대부에서 팔이 바로 나온다" },
      { id: "barred", label: "막대 나선 은하 (SB)", sub: "막대 끝에서 팔이 나온다" },
      { id: "irr", label: "불규칙 은하 (Irr)", sub: "일정한 모양이 없다" }
    ],
    items: [
      { t: "안드로메다은하(M31) — 팽대부에서 나선팔이 바로 뻗어 나온다", a: "spiral", why: "막대 구조 없이 팽대부에서 팔이 나오는 정상 나선 은하입니다." },
      { t: "솜브레로은하(M104) — 팽대부가 유난히 크고 팔이 꽉 감겨 있다", a: "spiral", why: "팽대부가 큰 정상 나선 은하(Sa)입니다.", hint: "막대가 보이는지부터 따져 보세요." },
      { t: "우리은하 — 중심을 가로지르는 막대 구조가 있는 것으로 보고 있다", a: "barred", why: "우리은하는 막대 나선 은하로 분류합니다." },
      { t: "NGC 1300 — 곧게 뻗은 막대 양 끝에서 나선팔이 시작된다", a: "barred", why: "막대 나선 은하의 교과서 같은 모습입니다." },
      { t: "M87 — 처녀자리 은하단 한가운데의 거대한 공 모양 은하", a: "ell", why: "나선팔이 없는 거대 타원 은하입니다. 중심에서 제트가 뻗어 나오는 전파 은하이기도 합니다." },
      { t: "M32 — 안드로메다은하 곁의 작고 둥근 은하", a: "ell", why: "나선팔이 없고 늙은 별이 많은 왜소 타원 은하입니다.", hint: "나선팔이 보이는지 먼저 확인하세요." },
      { t: "대마젤란은하 — 남반구 하늘에 뿌옇게 보이는 찌그러진 은하", a: "irr", why: "일정한 모양이 없는 불규칙 은하입니다. 성간 물질이 많아 별이 활발히 태어납니다." },
      { t: "소마젤란은하 — 대마젤란은하 곁의 더 작고 모양 없는 은하", a: "irr", why: "역시 불규칙 은하입니다. 우리은하 둘레를 도는 위성 은하입니다." }
    ],
    onDone: function () { G3.a = true; window.sthState("cSort", G3); mission3(); }
  });
  window.sthPick({
    mount: "c-q1",
    q: "타원 은하와 나선 은하를 견주었을 때, <b>성간 물질이 적고 늙고 붉은 별이 주로 있는</b> 쪽은 어느 것일까요?",
    options: [
      "㉠ 타원 은하 — 성간 물질이 적어 새 별이 거의 만들어지지 않는다",
      "㉡ 나선 은하 — 나선팔에 성간 물질이 많아 늙은 별만 남는다",
      "㉢ 둘은 별의 나이가 같다 — 모양만 다를 뿐이다"
    ],
    answer: 0,
    why: [
      "그렇습니다. 새 별을 만들 재료가 적으니 남은 것은 오래된 별뿐이고, 늙은 별은 붉습니다.",
      "거꾸로입니다. 성간 물질이 많으면 <b>젊고 푸른 별</b>이 계속 태어납니다. 나선팔이 푸르게 보이는 까닭이지요.",
      "모양이 다르면 안에 든 것도 다릅니다. 타원 은하는 늙고 붉은 별이, 나선팔에는 젊고 푸른 별이 두드러집니다."
    ],
    onDone: function () { G3.b = true; window.sthState("cSort", G3); mission3(); }
  });
  mission3();

  /* ---- 장면4 : 활동 은하핵 ---- */
  var LEDD_PER_M = 3.3e4;          /* 에딩턴 광도 (L☉ / M☉) */
  var L_PER_MDOT = 1.48e12;        /* 1 M☉/년 을 10 % 효율로 태울 때의 광도 (L☉) */
  var MILKY = 2e10;                /* 우리은하 전체의 광도 어림 (L☉) */
  var G4 = window.sthState("cAgn") || { a: false, b: false, c: false, seen: [] };
  if (!G4.seen) G4.seen = [];
  function mission4() {
    if (G4.a) done("m3-4a"); if (G4.b) done("m3-4b"); if (G4.c) done("m3-4c");
    if (G4.seen.length >= 3) done("m3-4d");
    if (G4.a && G4.b && G4.c && G4.seen.length >= 3) {
      window.sthMission("m3-4", true, "<span class='m-tag'>미션 완료</span>중심핵 하나가 은하 전체보다 밝아지려면 <b>거대 질량 블랙홀</b>이 1년에 태양 질량만큼씩 삼켜야 합니다. 너무 많이 삼키면 쏟아지는 빛이 오히려 기체를 밀어내는 <b>에딩턴 한계</b>에 걸리므로, 퀘이사만큼 밝으려면 블랙홀도 그만큼 무거워야 합니다. 세이퍼트 은하·전파 은하·퀘이사는 겉모습만 다를 뿐 모두 이 <b>활동 은하핵</b>을 가집니다.");
      ep.clear(3);
    }
  }
  (function () {
    var canvas = $("c-c-agn"), ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var lbh = 6, lacc = -3, kind = "seyfert";
    var DATA = {
      seyfert: { n: "세이퍼트 은하", host: "spiral", jet: false,
        d: "겉모습은 보통 <b>나선 은하</b>인데 중심핵이 유난히 밝고, 핵의 스펙트럼에 <b>폭이 넓은 방출선</b>이 나타납니다. 중심핵 둘레의 기체가 아주 빠르게 돌고 있다는 뜻입니다." },
      radio: { n: "전파 은하", host: "ell", jet: true,
        d: "가시광선으로는 평범한 <b>타원 은하</b>로 보이지만 강한 <b>전파</b>를 냅니다. 중심에서 뻗어 나온 <b>제트</b>가 은하 바깥에 거대한 전파 로브를 만듭니다. M87 이 대표적입니다." },
      quasar: { n: "퀘이사", host: "point", jet: true,
        d: "아주 멀리 있는 활동 은하핵으로, 중심핵이 은하 전체보다 밝아 <b>별처럼 점으로</b> 보입니다. 대부분 먼 우주, 곧 <b>우주 초기</b>에 몰려 있습니다. 3C 273 이 처음 밝혀진 퀘이사입니다." }
    };

    function draw() {
      paper(ctx, W, H);
      var M = Math.pow(10, lbh), mdot = Math.pow(10, lacc);
      var L = mdot * L_PER_MDOT, Ledd = LEDD_PER_M * M, ratio = L / Ledd;
      var d = DATA[kind];
      text(ctx, "은하 하나보다 밝은 중심핵 — 그 에너지는 어디서 오는가", 30, 30, { s: 14, w: "900" });

      var cx = 225, cy = 235;
      if (d.host === "spiral") {
        ctx.save(); ctx.strokeStyle = v("--teal"); ctx.globalAlpha = 0.5; ctx.lineWidth = 3;
        for (var s = 0; s < 2; s++) {
          ctx.beginPath();
          for (var a = 0; a < 4.4; a += 0.08) {
            var r = 18 + a * 26, ang = a + s * Math.PI;
            var px = cx + r * Math.cos(ang), py = cy + r * Math.sin(ang) * 0.6;
            if (a === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
          }
          ctx.stroke();
        }
        ctx.restore();
      } else if (d.host === "ell") {
        ctx.save(); ctx.fillStyle = v("--coral"); ctx.globalAlpha = 0.3;
        ctx.beginPath(); ctx.ellipse(cx, cy, 150, 96, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      } else {
        text(ctx, "(너무 멀어 은하는 보이지 않고", cx, cy - 152, { s: 11, a: "center", c: v("--mist") });
        text(ctx, "중심핵만 점으로 보입니다)", cx, cy - 134, { s: 11, a: "center", c: v("--mist") });
      }
      if (d.jet) {
        ctx.save(); ctx.strokeStyle = v("--brand"); ctx.fillStyle = v("--brand"); ctx.lineWidth = 4;
        window.drawArrow(ctx, cx, cy - 14, cx, cy - 158, 10);
        window.drawArrow(ctx, cx, cy + 14, cx, cy + 158, 10);
        ctx.restore();
        text(ctx, "제트", cx + 52, cy - 108, { s: 11.5, w: "900", c: v("--brand-700") });
      }
      var glow = clamp(14 + 3.2 * (Math.log(Math.max(L, 1e8)) / Math.LN10 - 8), 12, 44);
      ctx.save();
      var gr = ctx.createRadialGradient(cx, cy, 3, cx, cy, glow + 12);
      gr.addColorStop(0, "rgb(255,246,220)"); gr.addColorStop(1, "rgba(255,150,80,0)");
      ctx.fillStyle = gr;
      ctx.beginPath(); ctx.ellipse(cx, cy, glow + 12, (glow + 12) * 0.45, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      ctx.save(); ctx.fillStyle = v("--coral"); ctx.globalAlpha = 0.9;
      ctx.beginPath(); ctx.ellipse(cx, cy, glow, glow * 0.34, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      ctx.save(); ctx.fillStyle = "rgb(12,12,20)";
      ctx.beginPath(); ctx.arc(cx, cy, clamp(lbh - 2, 4, 12), 0, Math.PI * 2); ctx.fill(); ctx.restore();
      text(ctx, "거대 질량 블랙홀 + 강착 원반", cx, cy + 66, { s: 11.5, a: "center", w: "800", c: v("--mist") });
      text(ctx, d.n, 30, 62, { s: 15, w: "900", c: v("--coral-700") });

      var px = 450;
      text(ctx, "빨려 들어간 물질의 약 10 % 가 빛으로 바뀐다", px, 70, { s: 12, w: "800", c: v("--mist") });
      ctx.strokeStyle = v("--line"); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(px, 82); ctx.lineTo(872, 82); ctx.stroke();
      text(ctx, "블랙홀 질량", px, 108, { s: 11, w: "800", c: v("--mist") });
      text(ctx, expo(M) + " M☉", px, 132, { s: 17, w: "900" });
      text(ctx, "1년에 삼키는 양", px + 215, 108, { s: 11, w: "800", c: v("--mist") });
      text(ctx, num(mdot) + " M☉", px + 215, 132, { s: 17, w: "900", c: Math.abs(lacc) <= 0.025 ? v("--teal-700") : v("--ink") });
      text(ctx, "중심핵의 광도", px, 170, { s: 11, w: "800", c: v("--mist") });
      text(ctx, expo(L) + " L☉", px, 208, { s: 28, w: "900", c: v("--coral-700") });
      text(ctx, "= 우리은하 전체(2×10¹⁰ L☉)의 " + num(L / MILKY) + " 배", px, 234,
        { s: 12.5, w: "800", c: L / MILKY >= 100 ? v("--teal-700") : v("--mist") });

      text(ctx, "에딩턴 한계 — 이보다 밝아지면 더 삼킬 수 없다", px, 272, { s: 11, w: "800", c: v("--mist") });
      text(ctx, expo(Ledd) + " L☉", px, 296, { s: 15, w: "900", c: v("--violet-700") });
      band(ctx, px, 312, 400, 14, "--mist", 0.25);
      band(ctx, px, 312, 400 * clamp(ratio, 0, 1), 14, ratio > 1 ? "--rose" : "--violet", 0.85);
      text(ctx, "지금 광도 ÷ 에딩턴 광도 = " + num(ratio), px, 344, { s: 13, w: "900", c: ratio > 1 ? v("--rose-700") : v("--ink") });
      text(ctx, ratio > 1 ? "⚠ 한계를 넘었습니다 — 쏟아지는 빛이 기체를 밀어냅니다"
        : "빛의 압력보다 중력이 세므로 물질이 계속 빨려 들어갑니다", px, 368,
        { s: 11.5, c: ratio > 1 ? v("--rose-700") : v("--mist") });
      text(ctx, "살펴본 특이 은하 " + G4.seen.length + " / 3", px, 400,
        { s: 12, w: "900", c: G4.seen.length >= 3 ? v("--teal-700") : v("--mist") });

      text(ctx, "핵융합은 질량의 약 0.7 % 만 빛으로 바꿉니다. 강착 원반은 그 열 배가 넘습니다.", 30, 432, { s: 11.5, c: v("--mist") });
      text(ctx, "에딩턴 광도 ≈ 3.3×10⁴ × (블랙홀 질량 ÷ 태양 질량) L☉", 30, 454, { s: 11.5, c: v("--mist") });

      var ch = false;
      if (L >= 100 * MILKY && !G4.a) { G4.a = ch = true; }
      if (Math.abs(lacc) <= 0.025 && !G4.b) { G4.b = ch = true; }
      if (lbh <= 7 && ratio > 1 && !G4.c) { G4.c = ch = true; }
      if (G4.seen.indexOf(kind) < 0) { G4.seen.push(kind); ch = true; }
      if (ch) { window.sthState("cAgn", G4); mission4(); }

      $("c-agn-read").innerHTML = "중심핵의 광도: <b>" + expo(L) + " L☉</b> (우리은하의 " + num(L / MILKY) + " 배)";
      $("c-agn-info").innerHTML = "<b>" + d.n + "</b> — " + d.d +
        " 지금 설정에서 중심핵은 우리은하 전체의 <b>" + num(L / MILKY) + " 배</b>로 빛나고 있습니다." +
        (ratio > 1 ? " 다만 <b>에딩턴 한계</b>를 넘어섰습니다 — 이만큼 밝으려면 블랙홀이 더 무거워야 합니다." : "");
    }
    canvas._redraw = draw;
    $("c-bh").addEventListener("input", function (e) {
      lbh = +e.target.value; $("c-bh-val").textContent = "10" + sup(lbh.toFixed(1)) + " M☉"; draw();
    });
    $("c-acc").addEventListener("input", function (e) {
      lacc = +e.target.value; $("c-acc-val").textContent = num(Math.pow(10, lacc)) + " M☉/년"; draw();
    });
    segWire("c-agn", function (b) { kind = b.getAttribute("data-g"); draw(); });
    draw(); mission4();
  })();

  /* ---- 장면5 : 변광으로 크기 재기 ---- */
  (function () {
    var canvas = $("c-c-var"), ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var lt = 1, tick = 0;
    var got = window.sthState("cVar") || { a: false, b: false, c: false };
    var AU = 1.496e8, CKM = 2.998e5, LD = CKM * 86400, LY = LD * 365.25;

    function draw() {
      paper(ctx, W, H);
      var t = Math.pow(10, lt), size = LD * t;
      text(ctx, "며칠 만에 깜박이는 것은 며칠보다 클 수 없다", 30, 30, { s: 14, w: "900" });

      var X0 = 60, X1 = 430, Y0 = 72, Y1 = 208;
      axes(ctx, X0, Y0, X1, Y1);
      ctx.strokeStyle = v("--coral"); ctx.lineWidth = 2.6; ctx.beginPath();
      for (var i = 0; i <= 240; i++) {
        var u = i / 240;
        var y = (Y0 + Y1) / 2 - Math.sin(u * Math.PI * 5 + tick * 0.12) * (Y1 - Y0) * 0.33;
        var x = X0 + u * (X1 - X0);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      text(ctx, "밝기", X0 - 8, Y0 - 10, { s: 11, a: "right", c: v("--mist") });
      text(ctx, "시간 →  (한 번 밝아졌다 어두워지는 데 " + (t < 1 ? (t * 24).toFixed(1) + " 시간" : num(t) + " 일") + ")",
        X0, Y1 + 22, { s: 11.5, c: v("--mist") });

      var BX0 = 60, BX1 = 430, BY = 300;
      var LO = Math.log(AU) / Math.LN10, HI = Math.log(1e5 * LY) / Math.LN10;
      function BX(km) { return BX0 + clamp((Math.log(Math.max(km, 1)) / Math.LN10 - LO) / (HI - LO), 0, 1) * (BX1 - BX0); }
      ctx.strokeStyle = v("--line"); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(BX0, BY); ctx.lineTo(BX1, BY); ctx.stroke();
      [[AU, "1 AU"], [60 * AU, "태양계"], [LY, "1 광년"], [1e5 * LY, "우리은하"]].forEach(function (m) {
        var x2 = BX(m[0]);
        ctx.beginPath(); ctx.moveTo(x2, BY); ctx.lineTo(x2, BY + 6); ctx.stroke();
        text(ctx, m[1], clamp(x2, BX0 + 18, BX1 - 18), BY + 22, { s: 10.5, a: "center", c: v("--mist") });
      });
      ctx.save(); ctx.fillStyle = v("--teal");
      ctx.beginPath(); ctx.arc(BX(size), BY, 8, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      text(ctx, "이 중심부", clamp(BX(size), BX0 + 26, BX1 - 26), BY - 14, { s: 11.5, a: "center", w: "900", c: v("--teal-700") });
      text(ctx, "가로 자는 로그 눈금입니다", BX0, BY + 46, { s: 10.5, c: v("--mist") });

      var px = 480;
      text(ctx, "크기 ≤ 변광 시간 × 빛의 속도", px, 70, { s: 12, w: "800", c: v("--mist") });
      ctx.strokeStyle = v("--line"); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(px, 82); ctx.lineTo(872, 82); ctx.stroke();
      text(ctx, "변광 시간", px, 110, { s: 11, w: "800", c: v("--mist") });
      text(ctx, t < 1 ? (t * 24).toFixed(1) + " 시간" : num(t) + " 일", px, 136, { s: 20, w: "900" });
      text(ctx, "중심부의 최대 크기", px, 174, { s: 11, w: "800", c: v("--mist") });
      text(ctx, expo(size) + " km", px, 212, { s: 26, w: "900", c: v("--teal-700") });
      text(ctx, "= " + num(size / AU) + " AU = " + num(t) + " 광일", px, 240, { s: 14, w: "800" });
      text(ctx, "태양계(해왕성 궤도 지름 60 AU) 와 견주면", px, 276, { s: 11, w: "800", c: v("--mist") });
      text(ctx, size < 60 * AU ? "태양계보다 작습니다" : num(size / (60 * AU)) + " 배", px, 300,
        { s: 16, w: "900", c: size < 60 * AU ? v("--teal-700") : v("--ink") });
      text(ctx, "우리은하 지름(10만 광년)과 견주면", px, 336, { s: 11, w: "800", c: v("--mist") });
      text(ctx, expo(size / (1e5 * LY)) + " 배", px, 360, { s: 16, w: "900", c: v("--violet-700") });
      text(ctx, "이만큼 작은 곳에서 은하 수백 개만큼의 빛이 나옵니다.", 30, 402, { s: 11.5, c: v("--mist") });
      text(ctx, "별을 아무리 촘촘히 모아도 이 크기에 그만한 에너지를 담을 수 없습니다 — 남는 답은 블랙홀뿐입니다.", 30, 424, { s: 11.5, c: v("--mist") });

      var ch = false;
      if (t < 1 && !got.a) { got.a = ch = true; }
      if (size < 60 * AU && !got.b) { got.b = ch = true; }
      if (lt >= 1.95 && !got.c) { got.c = ch = true; }
      if (ch) { window.sthState("cVar", got); mission(); }

      $("c-var-read").innerHTML = "중심부의 최대 크기: <b>" + num(size / AU) + " AU</b> (" + num(t) + " 광일)";
      $("c-var-info").innerHTML = "밝기가 " + (t < 1 ? (t * 24).toFixed(1) + " 시간" : num(t) + " 일") +
        " 만에 눈에 띄게 달라진다면, 그 빛을 내는 곳의 크기는 <b>" + num(size / AU) + " AU</b> 를 넘을 수 없습니다. " +
        (size < 60 * AU ? "이것은 <b>태양계보다도 작은</b> 크기입니다. 우리은하 지름의 " + expo(size / (1e5 * LY)) + " 밖에 되지 않습니다."
          : "그래도 우리은하 지름(10만 광년)의 " + expo(size / (1e5 * LY)) + " 밖에 되지 않습니다. 변광 시간을 더 줄여 보세요.");
    }
    function mission() {
      if (got.a) done("m3-5a"); if (got.b) done("m3-5b"); if (got.c) done("m3-5c");
      if (got.a && got.b && got.c) {
        window.sthMission("m3-5", true, "<span class='m-tag'>미션 완료</span>변광 시간만으로 <b>보이지도 않는 천체의 크기 상한</b>을 잴 수 있습니다. 하루 만에 깜박이면 <b>1광일</b>보다 작고, 그것은 태양계보다도 작습니다. 그렇게 작은 곳에서 은하 수백 개만큼의 빛이 나온다는 것 — 이것이 활동 은하핵의 정체를 가른 결정적 단서였습니다.");
        ep.clear(4); ep.clear(5);
      }
    }
    canvas._redraw = draw;
    $("c-var").addEventListener("input", function (e) {
      lt = +e.target.value;
      var tt = Math.pow(10, lt);
      $("c-var-val").textContent = tt < 1 ? (tt * 24).toFixed(1) + " 시간" : num(tt) + " 일";
      draw();
    });
    draw(); mission();
    anim(canvas, function () { tick++; draw(); });
  })();

  function finish() { window.sthState("r3", "해결 · 3C 273 은 태양계보다 작은 활동 은하핵, 허블 분류는 모양일 뿐 진화 순서가 아니다"); }
  function vsC() {
    var p = window.sthState("c-p") || "";
    $("c-vs").innerHTML = "<b>나의 첫 추리</b> " + (p || "기록 없음") + "<br>" +
      (p.indexOf("㉡") === 0 ? "정확했습니다. 3C 273 은 아주 멀리 있는 은하의 중심핵이었고, 그 핵이 은하 전체를 압도할 만큼 밝았습니다."
        : "㉡ 이 정답이었습니다. 적색 편이가 크다는 것은 아주 멀다는 뜻이고, 그렇게 멀리서도 밝게 보이려면 은하 전체보다 밝아야 합니다.");
  }
  vsC();
  ep.onShow(vsC);
  window.sthWork({
    mount: "wkC", unitLabel: "[지구과학 Ⅲ-2] 이야기 ③ 은하 동물원",
    items: [
      { id: "c1", label: "허블의 은하 분류", hint: "타원 은하와 나선 은하를 나누는 기준, 그리고 두 은하 안에 든 별과 성간 물질의 차이를 함께 쓰세요." },
      { id: "c2", label: "퀘이사의 정체를 밝힌 논증", hint: "‘며칠 만의 변광’ 이라는 관측 하나에서 어떻게 중심부의 크기를 알아냈고, 왜 블랙홀이라는 결론에 이르렀는지 차례대로 쓰세요." }
    ]
  });
})();

/* =========================================================================
   이야기 ④ 팽창하는 우주
   ========================================================================= */
(function () {
  var ep = window.sthStory({ root: "epD", key: "epD", name: "사건 파일 ④", onDone: finish });
  var C_KMS = 299792.458, LAM0 = 656.3, TH = 9.778e11;   /* 1/H₀ [년] = 9.778×10¹¹ ÷ H₀ */

  window.sthGate({
    gate: "d-gate", key: "d-p", title: "동아리 부장의 첫 예상",
    question: "관측한 은하가 거의 모두 우리에게서 멀어지고 있습니다. 그렇다면 <b>우리가 우주의 중심</b>일까요?",
    options: [
      "㉠ 그렇다 — 모든 은하가 우리에게서 멀어지므로 우리가 한가운데다",
      "㉡ 아니다 — 공간 자체가 부풀고 있어서, 어느 은하에서 보아도 똑같이 멀어져 보인다",
      "㉢ 아니다 — 은하들이 우리를 피해 한쪽으로 달아나고 있기 때문이다"
    ],
    onPick: function (i) { window.sthState("dPredOK", i === 1 ? "맞음" : "어긋남"); ep.clear(0); }
  });

  /* ---- 장면2 : 적색 편이 ---- */
  (function () {
    var canvas = $("d-c-z"), ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var lam = LAM0;
    var got = window.sthState("dZ") || { a: false, b: false, c: false };
    var SX0 = 150, SX1 = 860, N0 = 620, N1 = 820;
    function XW(nm) { return SX0 + (nm - N0) / (N1 - N0) * (SX1 - SX0); }

    function strip(y0, y1, markNm, col, lab) {
      for (var x = SX0; x <= SX1; x++) {
        var nm = N0 + (x - SX0) / (SX1 - SX0) * (N1 - N0);
        ctx.save(); ctx.globalAlpha = nm > 750 ? 0.30 : 0.95;
        ctx.fillStyle = waveColor(nm);
        ctx.fillRect(x, y0, 1.2, y1 - y0); ctx.restore();
      }
      ctx.save(); ctx.globalAlpha = 0.9; ctx.fillStyle = "rgb(10,10,16)";
      ctx.fillRect(XW(markNm) - 3.5, y0, 7, y1 - y0); ctx.restore();
      ctx.strokeStyle = v(col); ctx.lineWidth = 2; ctx.strokeRect(SX0, y0, SX1 - SX0, y1 - y0);
      text(ctx, lab, 30, (y0 + y1) / 2 + 4, { s: 12, w: "900", c: v(col) });
    }

    function draw() {
      paper(ctx, W, H);
      var dl = lam - LAM0, z = dl / LAM0, vel = z * C_KMS, dist = vel / 70;
      text(ctx, "선이 얼마나 밀렸는가 — 적색 편이로 속도를 잰다", 30, 30, { s: 14, w: "900" });

      strip(66, 118, LAM0, "--mist", "실험실");
      strip(166, 218, lam, "--rose", "이 은하");
      ctx.save(); ctx.strokeStyle = v("--rose"); ctx.fillStyle = v("--rose"); ctx.lineWidth = 2.5;
      window.drawArrow(ctx, XW(LAM0), 142, XW(lam), 142, 9);
      ctx.restore();
      text(ctx, "Δλ = " + dl.toFixed(1) + " nm", clamp((XW(LAM0) + XW(lam)) / 2, SX0 + 40, SX1 - 40), 136,
        { s: 11.5, a: "center", w: "900", c: v("--rose-700") });
      text(ctx, "656.3", XW(LAM0), 60, { s: 10.5, a: "center", c: v("--mist") });
      text(ctx, lam.toFixed(1), clamp(XW(lam), SX0 + 16, SX1 - 16), 236, { s: 10.5, a: "center", c: v("--rose-700") });
      [650, 700, 750, 800].forEach(function (nm) {
        text(ctx, nm + " nm", XW(nm), 256, { s: 10.5, a: "center", c: v("--mist") });
      });
      text(ctx, "750 nm 보다 긴 쪽은 눈에 보이지 않는 적외선입니다", SX0, 276, { s: 10.5, c: v("--mist") });

      ctx.strokeStyle = v("--line"); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(30, 296); ctx.lineTo(872, 296); ctx.stroke();
      text(ctx, "파장의 밀림 Δλ", 40, 320, { s: 11, w: "800", c: v("--mist") });
      text(ctx, dl.toFixed(1) + " nm", 40, 348, { s: 20, w: "900" });
      text(ctx, "적색 편이  z = Δλ ÷ λ₀", 300, 320, { s: 11, w: "800", c: v("--mist") });
      text(ctx, z.toFixed(4), 300, 348, { s: 20, w: "900", c: v("--violet-700") });
      text(ctx, "후퇴 속도  v = z × 빛의 속도", 560, 320, { s: 11, w: "800", c: v("--mist") });
      text(ctx, comma(vel) + " km/s", 560, 350, { s: 24, w: "900", c: v("--teal-700") });

      text(ctx, "허블 상수 70 km/s/Mpc 로 어림한 거리 : " + num(dist) + " Mpc (약 " + num(dist * 3.26) + "백만 광년)",
        40, 388, { s: 12.5, w: "800", c: v("--mist") });
      text(ctx, "적색 편이는 은하가 공간 속을 달려서가 아니라, 빛이 날아오는 동안 공간이 늘어나 파장까지 늘어난 결과입니다.",
        40, 414, { s: 11.5, c: v("--mist") });

      var ch = false;
      if (Math.abs(vel - 3000) <= 60 && !got.a) { got.a = ch = true; }
      if (Math.abs(z - 0.1) <= 0.0005 && !got.b) { got.b = ch = true; }
      if (Math.abs(z - 0.158) <= 0.0005 && !got.c) { got.c = ch = true; }
      if (ch) { window.sthState("dZ", got); mission(); }

      $("d-z-read").innerHTML = "적색 편이: <b>z = " + z.toFixed(4) + "</b> · 후퇴 속도 " + comma(vel) + " km/s";
      $("d-z-info").innerHTML = z === 0
        ? "아직 파장이 밀리지 않았습니다. 슬라이더를 움직여 은하의 Hα 선을 긴 파장 쪽으로 밀어 보세요."
        : "이 은하의 Hα 선은 실험실보다 <b>" + dl.toFixed(1) + " nm</b> 긴 자리에 나타났습니다. 밀린 비율 z = " + z.toFixed(4) +
          " 이므로 후퇴 속도는 <b>" + comma(vel) + " km/s</b> 입니다" +
          (Math.abs(z - 0.158) <= 0.0005 ? " — 앞 이야기의 <b>3C 273</b> 과 똑같은 값입니다." : ".") +
          " 허블 상수를 70 km/s/Mpc 로 보면 거리는 약 " + num(dist) + " Mpc 입니다.";
    }
    function mission() {
      if (got.a) done("m4-2a"); if (got.b) done("m4-2b"); if (got.c) done("m4-2c");
      if (got.a && got.b && got.c) {
        window.sthMission("m4-2", true, "<span class='m-tag'>미션 완료</span>밀린 비율 <b>z = Δλ ÷ λ₀</b> 하나만 재면 후퇴 속도가 나옵니다(v = cz). 3C 273 의 z = 0.158 은 후퇴 속도로 <b>4만 7천 km/s</b> 가 넘습니다 — 별이라면 결코 낼 수 없는 속도이지요.");
        ep.clear(1);
      }
    }
    canvas._redraw = draw;
    $("d-lam").addEventListener("input", function (e) {
      lam = +e.target.value; $("d-lam-val").textContent = lam.toFixed(1) + " nm"; draw();
    });
    draw(); mission();
  })();

  /* ---- 장면3 : 허블-르메트르 법칙 + 팽창 격자 ---- */
  var G3 = window.sthState("dHub") || { a: false, b: false, refs: [] };
  if (!G3.refs) G3.refs = [];
  function mission3() {
    if (G3.a) done("m4-3a"); if (G3.b) done("m4-3b");
    if (G3.refs.length >= 3) done("m4-3c");
    if (G3.a && G3.b && G3.refs.length >= 3) {
      window.sthMission("m4-3", true, "<span class='m-tag'>미션 완료</span>자료에 가장 잘 맞는 기울기는 <b>약 70 km/s/Mpc</b> 이고, 그 역수 1/H₀ 는 <b>약 140억 년</b> — 우주의 나이와 같은 크기입니다. 그리고 격자에서 어느 은하를 기준으로 삼아도 <b>같은 법칙</b>이 나옵니다. 늘어나는 것은 은하가 아니라 <b>공간</b>이기 때문입니다.");
      ep.clear(2);
    }
  }
  var CL = [
    { d: 16.5, v: 1200, n: "처녀자리 은하단" },
    { d: 54, v: 3780, n: "바다뱀자리 은하단" },
    { d: 77, v: 5370, n: "페르세우스 은하단" },
    { d: 99, v: 6930, n: "머리털자리 은하단" },
    { d: 200, v: 14000, n: "먼 은하단" }
  ];
  (function () {
    var canvas = $("d-c-hub"), ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var H0 = 40;
    var X0 = 90, X1 = 600, Y0 = 60, Y1 = 380, DMAX = 300, VMAX = 22000;
    function XD(d) { return X0 + d / DMAX * (X1 - X0); }
    function YV(vv) { return Y1 - clamp(vv, 0, VMAX) / VMAX * (Y1 - Y0); }

    function draw() {
      paper(ctx, W, H);
      var age = TH / H0, err = 0;
      CL.forEach(function (c) { err += Math.abs(c.v - H0 * c.d); });
      text(ctx, "멀리 있는 은하일수록 빠르게 멀어진다 — 기울기를 맞춰 보세요", 30, 30, { s: 14, w: "900" });

      axes(ctx, X0, Y0, X1, Y1);
      [0, 100, 200, 300].forEach(function (d) {
        text(ctx, d + "", XD(d), Y1 + 18, { s: 10.5, a: "center", c: v("--mist") });
      });
      text(ctx, "은하단까지의 거리 (Mpc) →", X1, Y1 + 32, { s: 11, a: "right", c: v("--mist") });
      [0, 5000, 10000, 15000, 20000].forEach(function (vv) {
        text(ctx, comma(vv), X0 - 8, YV(vv) + 4, { s: 10.5, a: "right", c: v("--mist") });
      });
      text(ctx, "↑ 후퇴 속도 (km/s)", 30, Y0 - 12, { s: 11, c: v("--mist") });

      /* 내 직선 */
      ctx.strokeStyle = v("--teal"); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(XD(0), YV(0));
      ctx.lineTo(XD(clamp(VMAX / H0, 0, DMAX)), YV(Math.min(VMAX, H0 * DMAX))); ctx.stroke();
      text(ctx, "v = H₀ × d", XD(12), YV(H0 * 12) - 30, { s: 12, w: "900", c: v("--teal-700") });

      /* 자료 */
      CL.forEach(function (c) {
        var px = XD(c.d), py = YV(c.v), ly = YV(H0 * c.d);
        ctx.save(); ctx.strokeStyle = v("--rose"); ctx.lineWidth = 1.6; ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, ly); ctx.stroke(); ctx.setLineDash([]); ctx.restore();
        ctx.save(); ctx.fillStyle = v("--coral"); ctx.strokeStyle = v("--ink"); ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.restore();
        text(ctx, c.n, clamp(px + 9, X0, X1 - 104), clamp(py - 8, Y0 + 10, Y1 - 4), { s: 10, c: v("--mist") });
      });

      /* 판정판 */
      var px2 = 632;
      text(ctx, "허블 상수 H₀", px2, 78, { s: 11, w: "800", c: v("--mist") });
      text(ctx, H0 + " km/s/Mpc", px2, 108, { s: 20, w: "900", c: Math.abs(H0 - 70) <= 1 ? v("--teal-700") : v("--ink") });
      text(ctx, "자료와의 어긋남 합계", px2, 146, { s: 11, w: "800", c: v("--mist") });
      text(ctx, comma(err) + " km/s", px2, 172, { s: 17, w: "900", c: err < 900 ? v("--teal-700") : v("--rose-700") });
      band(ctx, px2, 184, 236, 12, "--mist", 0.25);
      band(ctx, px2, 184, 236 * clamp(1 - err / 12000, 0, 1), 12, err < 900 ? "--teal" : "--rose", 0.85);
      text(ctx, "막대가 길수록 잘 맞는 것입니다", px2, 212, { s: 10.5, c: v("--mist") });
      text(ctx, "우주의 나이 = 1 ÷ H₀", px2, 250, { s: 11, w: "800", c: v("--mist") });
      text(ctx, fmtYear(age), px2, 288, { s: 26, w: "900", c: v("--violet-700") });
      text(ctx, "H₀ 가 클수록 팽창이 빨랐다는 뜻이므로", px2, 320, { s: 10.5, c: v("--mist") });
      text(ctx, "여기까지 오는 데 걸린 시간은 짧아집니다.", px2, 338, { s: 10.5, c: v("--mist") });
      text(ctx, (G3.a ? "✅" : "▫") + " 가장 잘 맞는 H₀ 찾기", px2, 372, { s: 11.5, c: G3.a ? v("--teal-700") : v("--mist") });
      text(ctx, (G3.b ? "✅" : "▫") + " 나이 100억 년 아래로", px2, 392, { s: 11.5, c: G3.b ? v("--teal-700") : v("--mist") });

      text(ctx, "점선은 자료와 직선이 얼마나 어긋나 있는지를 나타냅니다. 어긋남이 가장 작아지는 기울기를 찾으세요.", 30, 430, { s: 11.5, c: v("--mist") });
      text(ctx, "처녀자리 은하단은 가까워서 은하단 자체의 운동이 섞이는 탓에 직선에서 조금 더 벗어납니다.", 30, 448, { s: 11.5, c: v("--mist") });

      var ch = false;
      if (Math.abs(H0 - 70) <= 1 && !G3.a) { G3.a = ch = true; }
      if (age < 1e10 && !G3.b) { G3.b = ch = true; }
      if (ch) { window.sthState("dHub", G3); mission3(); }

      $("d-hub-read").innerHTML = "우주의 나이: <b>" + fmtYear(age) + "</b> (H₀ = " + H0 + ", 어긋남 " + comma(err) + " km/s)";
      $("d-hub-info").innerHTML = Math.abs(H0 - 70) <= 1
        ? "<b>가장 잘 맞습니다.</b> 기울기 약 70 km/s/Mpc 이 다섯 자료를 모두 지납니다. 이 기울기의 역수 1/H₀ 가 <b>" + fmtYear(age) + "</b> 인데, 실제로 측정된 우주의 나이(약 138억 년)와 거의 같습니다. 팽창 속도가 늘 같았다고 보고 거꾸로 되감은 값이므로 어림이지만, 우주에 <b>나이가 있다</b>는 것을 말해 줍니다."
        : "거리와 후퇴 속도가 <b>비례</b>한다는 것이 허블-르메트르 법칙입니다(v = H₀d). 기울기 H₀ 를 움직여 다섯 자료에 가장 잘 맞는 값을 찾아보세요. 지금 값으로 계산한 우주의 나이는 " + fmtYear(age) + " 입니다.";
    }
    canvas._redraw = draw;
    $("d-h0").addEventListener("input", function (e) {
      H0 = +e.target.value; $("d-h0-val").textContent = H0 + " km/s/Mpc"; draw();
    });
    draw(); mission3();
  })();

  (function () {
    var canvas = $("d-c-grid"), ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var COLS = 5, ROWS = 3, SPX = 112, SPY = 104, OX = 96, OY = 108;
    var ref = 7;
    var GAL = [];
    for (var r = 0; r < ROWS; r++) for (var c = 0; c < COLS; c++) GAL.push({ x: OX + c * SPX, y: OY + r * SPY, i: GAL.length });

    function draw() {
      paper(ctx, W, H);
      text(ctx, "기준을 바꿔 보자 — 어느 은하에 서도 같은 법칙이 나온다", 30, 30, { s: 14, w: "900" });
      var R = GAL[ref];

      /* 격자 */
      ctx.save(); ctx.strokeStyle = v("--line"); ctx.lineWidth = 1.2;
      for (var c2 = 0; c2 < COLS; c2++) {
        ctx.beginPath(); ctx.moveTo(OX + c2 * SPX, OY - 46); ctx.lineTo(OX + c2 * SPX, OY + (ROWS - 1) * SPY + 46); ctx.stroke();
      }
      for (var r2 = 0; r2 < ROWS; r2++) {
        ctx.beginPath(); ctx.moveTo(OX - 52, OY + r2 * SPY); ctx.lineTo(OX + (COLS - 1) * SPX + 52, OY + r2 * SPY); ctx.stroke();
      }
      ctx.restore();

      var maxd = 0;
      GAL.forEach(function (g) { maxd = Math.max(maxd, Math.hypot(g.x - R.x, g.y - R.y)); });
      GAL.forEach(function (g) {
        var dx = g.x - R.x, dy = g.y - R.y, d = Math.hypot(dx, dy);
        if (d > 0.5) {
          var ux = dx / d, uy = dy / d, len = 12 + (d / maxd) * 52;
          ctx.save(); ctx.strokeStyle = v("--rose"); ctx.fillStyle = v("--rose"); ctx.lineWidth = 2.2;
          window.drawArrow(ctx, g.x + ux * 12, g.y + uy * 12, g.x + ux * len, g.y + uy * len, 7);
          ctx.restore();
        }
        ctx.save();
        ctx.fillStyle = v(g.i === ref ? "--teal" : "--violet"); ctx.globalAlpha = 0.9;
        ctx.beginPath(); ctx.ellipse(g.x, g.y, 11, 7, g.i * 0.7, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        if (g.i === ref) {
          ctx.save(); ctx.strokeStyle = v("--teal"); ctx.lineWidth = 2.4;
          ctx.beginPath(); ctx.arc(g.x, g.y, 19, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
          text(ctx, "여기서 본다", g.x, g.y - 26, { s: 11, a: "center", w: "900", c: v("--teal-700") });
        }
      });
      text(ctx, "은하를 눌러 기준을 바꿔 보세요 · 기준으로 삼아 본 은하 " + G3.refs.length + " / 3",
        30, 400, { s: 12.5, w: "900", c: G3.refs.length >= 3 ? v("--teal-700") : v("--mist") });
      text(ctx, "은하는 제자리에 있고 격자(공간)가 늘어납니다. 화살표는 멀어지는 빠르기입니다.", 30, 422, { s: 11.5, c: v("--mist") });

      /* 미니 그래프 */
      var GX0 = 648, GX1 = 872, GY0 = 96, GY1 = 300;
      axes(ctx, GX0, GY0, GX1, GY1);
      text(ctx, "기준 은하에서 본", GX0, 76, { s: 11, w: "800", c: v("--mist") });
      text(ctx, "거리 — 후퇴 속도", GX0, GY1 + 20, { s: 10.5, c: v("--mist") });
      ctx.strokeStyle = v("--teal"); ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(GX0, GY1); ctx.lineTo(GX1, GY0); ctx.stroke();
      GAL.forEach(function (g) {
        var d = Math.hypot(g.x - R.x, g.y - R.y);
        if (d < 0.5) return;
        var u = d / maxd;
        ctx.save(); ctx.fillStyle = v("--coral");
        ctx.beginPath(); ctx.arc(GX0 + u * (GX1 - GX0), GY1 - u * (GY1 - GY0), 4, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      });
      text(ctx, "기준을 어디로 옮겨도", GX0, 330, { s: 11, c: v("--mist") });
      text(ctx, "같은 직선이 나옵니다.", GX0, 350, { s: 11, c: v("--mist") });

      $("d-grid-info").innerHTML = "지금 <b>" + (ref + 1) + "번 은하</b>에 서서 보고 있습니다. 나머지 은하가 모두 멀어지고, <b>멀리 있는 은하일수록 빠르게</b> 멀어집니다. 다른 은하를 눌러 기준을 옮겨도 그림은 똑같습니다 — 그래서 <b>중심이 따로 없습니다.</b>";
    }
    canvas._redraw = draw;
    canvas.addEventListener("click", function (e) {
      var p = hit(canvas, e), best = -1, bd = 26;
      GAL.forEach(function (g) {
        var d = Math.hypot(p.x - g.x, p.y - g.y);
        if (d < bd) { bd = d; best = g.i; }
      });
      if (best < 0) return;
      ref = best;
      if (G3.refs.indexOf(best) < 0) { G3.refs.push(best); window.sthState("dHub", G3); mission3(); }
      draw();
    });
    draw(); mission3();
  })();

  /* ---- 장면4 : 대폭발 이후의 우주 ---- */
  var G4 = window.sthState("dBB") || { seen: [], b: false, c: false, d: false };
  if (!G4.seen) G4.seen = [];
  function mission4() {
    if (G4.seen.length >= 5) done("m4-4a");
    if (G4.b) done("m4-4b"); if (G4.c) done("m4-4c"); if (G4.d) done("m4-4d");
    if (G4.seen.length >= 5 && G4.b && G4.c && G4.d) {
      window.sthMission("m4-4", true, "<span class='m-tag'>미션 완료</span>대폭발 우주론을 받치는 두 기둥은 <b>수소 : 헬륨 = 3 : 1(질량비)</b> 과 <b>우주 배경 복사</b>입니다. 우주 어디를 재도 헬륨이 질량의 4분의 1이고, 약 38만 년 전에 3,000 K 로 출발한 빛이 지금은 <b>2.7 K</b> 의 전파로 하늘 전체에서 옵니다.");
      ep.clear(3);
    }
  }
  (function () {
    var canvas = $("d-c-bb"), ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var st = 0;
    var STAGE = [
      { t: "10⁻³⁶ ~ 10⁻³² 초", T: "약 10²⁸ K", n: "급팽창과 기본 입자",
        d: "상상할 수 없이 뜨겁고 빽빽한 상태입니다. 이 무렵 공간이 아주 짧은 사이에 어마어마하게 부풀었고(<b>급팽창</b>), 그 뒤 쿼크와 전자 같은 <b>기본 입자</b>가 자유롭게 돌아다녔습니다.",
        rat: "" },
      { t: "약 10⁻⁶ 초 ~ 1 초", T: "약 10¹² K", n: "양성자와 중성자",
        d: "우주가 식으면서 쿼크가 뭉쳐 <b>양성자</b>와 <b>중성자</b>가 만들어졌습니다. 중성자가 양성자보다 조금 무거워 만들어지기 어려웠으므로, 개수비는 약 <b>7 : 1</b> 로 굳어졌습니다.",
        rat: "양성자 : 중성자 ≈ 7 : 1" },
      { t: "약 3분", T: "약 10⁹ K", n: "헬륨 원자핵",
        d: "양성자 2개와 중성자 2개가 결합해 <b>헬륨 원자핵</b>이 만들어졌습니다. 중성자가 모두 헬륨에 들어가면 수소 원자핵 : 헬륨 원자핵 ≈ <b>12 : 1</b>, 질량비로는 <b>3 : 1</b> 이 됩니다. 실제 우주 어디를 재도 헬륨이 질량의 약 4분의 1입니다.",
        rat: "수소핵 : 헬륨핵 ≈ 12 : 1", rat2: "질량비로는 3 : 1" },
      { t: "약 38만 년", T: "약 3,000 K", n: "원자의 탄생 · 우주 배경 복사",
        d: "온도가 3,000 K 까지 내려가자 원자핵이 전자를 붙잡아 <b>중성 원자</b>가 되었습니다. 전자에 가로막혀 있던 빛이 그제야 곧장 뻗어 나갔고(<b>우주의 맑게 갬</b>), 그 빛이 오늘날의 <b>우주 배경 복사</b>입니다.",
        rat: "수소 원자 : 헬륨 원자 ≈ 12 : 1" },
      { t: "약 2~3억 년", T: "수십 K", n: "최초의 별과 은하",
        d: "조금 더 빽빽했던 곳이 중력으로 뭉쳐 <b>최초의 별과 은하</b>가 태어났습니다. 별 속에서 탄소·산소 같은 무거운 원소가 처음 만들어져, 대폭발이 남긴 수소·헬륨만의 우주가 비로소 다양해졌습니다.",
        rat: "" }
    ];
    var COL = { q: "--violet", e: "--brand", p: "--coral", n: "--cold", he: "--teal", ha: "--coral", hea: "--teal", star: "--amber" };

    function parts(i) {
      var out = [], k;
      if (i === 0) { for (k = 0; k < 150; k++) out.push({ t: k % 2 ? "q" : "e", r: 2.6 }); }
      else if (i === 1) { for (k = 0; k < 84; k++) out.push({ t: "p", r: 7 }); for (k = 0; k < 12; k++) out.push({ t: "n", r: 7 }); }
      else if (i === 2) { for (k = 0; k < 96; k++) out.push({ t: "p", r: 7 }); for (k = 0; k < 8; k++) out.push({ t: "he", r: 11 }); }
      else if (i === 3) { for (k = 0; k < 96; k++) out.push({ t: "ha", r: 7 }); for (k = 0; k < 8; k++) out.push({ t: "hea", r: 11 }); }
      else { for (k = 0; k < 16; k++) out.push({ t: "star", r: 13 }); }
      return out;
    }
    function draw() {
      paper(ctx, W, H);
      var S = STAGE[st], list = parts(st);
      text(ctx, "우주가 식어 가며 무엇이 언제 만들어졌나", 30, 30, { s: 14, w: "900" });

      var BX0 = 50, BX1 = 600, BY0 = 62, BY1 = 342;
      band(ctx, BX0, BY0, BX1 - BX0, BY1 - BY0, "--card-2", 1);
      ctx.strokeStyle = v("--line"); ctx.lineWidth = 1.5; ctx.strokeRect(BX0, BY0, BX1 - BX0, BY1 - BY0);
      var rr = rnd32(st * 131 + 7);
      list.forEach(function (p) {
        var x = BX0 + 14 + rr() * (BX1 - BX0 - 28), y = BY0 + 14 + rr() * (BY1 - BY0 - 28);
        ctx.save(); ctx.globalAlpha = 0.9; ctx.fillStyle = v(COL[p.t]);
        if (p.t === "star") {
          ctx.beginPath();
          for (var s2 = 0; s2 < 10; s2++) {
            var ang = s2 * Math.PI / 5 - Math.PI / 2, rad = s2 % 2 ? p.r * 0.45 : p.r;
            var px2 = x + Math.cos(ang) * rad, py2 = y + Math.sin(ang) * rad;
            if (s2 === 0) ctx.moveTo(px2, py2); else ctx.lineTo(px2, py2);
          }
          ctx.closePath(); ctx.fill();
        } else {
          ctx.beginPath(); ctx.arc(x, y, p.r, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
        if (p.t === "ha" || p.t === "hea") {
          ctx.save(); ctx.strokeStyle = v("--mist"); ctx.globalAlpha = 0.6; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(x, y, p.r + 6, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
        }
      });
      /* 범례 */
      var LEG = st === 0 ? [["쿼크", "q"], ["전자", "e"]]
        : st === 1 ? [["양성자", "p"], ["중성자", "n"]]
        : st === 2 ? [["수소 원자핵", "p"], ["헬륨 원자핵", "he"]]
        : st === 3 ? [["수소 원자", "ha"], ["헬륨 원자", "hea"]] : [["최초의 별", "star"]];
      var lx = BX0;
      LEG.forEach(function (l) {
        ctx.save(); ctx.fillStyle = v(COL[l[1]]);
        ctx.beginPath(); ctx.arc(lx + 7, BY1 + 22, 7, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        text(ctx, l[0], lx + 20, BY1 + 26, { s: 11.5, c: v("--mist") });
        lx += 30 + l[0].length * 13;
      });

      /* 오른쪽 */
      var px = 632;
      text(ctx, "대폭발 이후", px, 78, { s: 11, w: "800", c: v("--mist") });
      text(ctx, S.t, px, 106, { s: 17, w: "900" });
      text(ctx, "그때의 온도", px, 144, { s: 11, w: "800", c: v("--mist") });
      text(ctx, S.T, px, 172, { s: 20, w: "900", c: v("--amber-700") });
      text(ctx, "이때 만들어진 것", px, 210, { s: 11, w: "800", c: v("--mist") });
      text(ctx, S.n, px, 236, { s: 14, w: "900", c: v("--violet-700") });
      if (S.rat) text(ctx, S.rat, px, 274, { s: 12.5, w: "900", c: v("--teal-700") });
      if (S.rat2) text(ctx, S.rat2, px, 294, { s: 12, w: "800", c: v("--teal-700") });
      text(ctx, "살펴본 단계 " + G4.seen.length + " / 5", px, 326,
        { s: 12, w: "900", c: G4.seen.length >= 5 ? v("--teal-700") : v("--mist") });

      /* 시간 띠 */
      var TX0 = 50, TX1 = 600, TY = 384;
      ctx.strokeStyle = v("--line"); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(TX0, TY); ctx.lineTo(TX1, TY); ctx.stroke();
      STAGE.forEach(function (s3, i) {
        var x = TX0 + i / (STAGE.length - 1) * (TX1 - TX0);
        ctx.save(); ctx.fillStyle = v(i === st ? "--teal" : (G4.seen.indexOf(i) >= 0 ? "--teal" : "--mist"));
        ctx.globalAlpha = i === st ? 1 : 0.55;
        ctx.beginPath(); ctx.arc(x, TY, i === st ? 9 : 6, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        text(ctx, (i + 1) + "", x, TY + 24, { s: 10.5, a: "center", c: v("--mist") });
      });
      text(ctx, "→ 시간", TX1, TY - 14, { s: 11, a: "right", c: v("--mist") });
      text(ctx, "대폭발 후 약 3분까지 만들어진 수소와 헬륨의 비는 지금도 우주 어디서나 거의 같습니다.", 30, 434, { s: 11.5, c: v("--mist") });
      text(ctx, "철보다 무거운 원소는 이때가 아니라 나중에 별 속과 초신성 폭발에서 만들어졌습니다.", 30, 456, { s: 11.5, c: v("--mist") });

      var ch = false;
      if (G4.seen.indexOf(st) < 0) { G4.seen.push(st); ch = true; }
      if (st === 1 && !G4.b) { G4.b = ch = true; }
      if (st === 2 && !G4.c) { G4.c = ch = true; }
      if (ch) { window.sthState("dBB", G4); mission4(); }

      $("d-bb-read").innerHTML = "그때의 온도: <b>" + S.T + "</b> · " + S.n;
      $("d-bb-info").innerHTML = "<b>" + S.n + "</b> (" + S.t + ") — " + S.d;
    }
    canvas._redraw = draw;
    $("d-stage").addEventListener("input", function (e) {
      st = Math.round(+e.target.value); $("d-stage-val").textContent = STAGE[st].t; draw();
    });
    draw(); mission4();
  })();

  (function () {
    var canvas = $("d-c-cmb"), ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var le = 0;
    var X0 = 90, X1 = 600, Y0 = 72, Y1 = 316, LO = 2, HI = 7;
    function XL(nm) { return X0 + clamp((Math.log(nm) / Math.LN10 - LO) / (HI - LO), 0, 1) * (X1 - X0); }

    function draw() {
      paper(ctx, W, H);
      var f = Math.pow(10, le), T = 2.725 * f, lmax = WIEN / T;
      text(ctx, "그때 떠난 빛이 지금은 어떤 빛으로 보이는가", 30, 30, { s: 14, w: "900" });

      axes(ctx, X0, Y0, X1, Y1);
      /* 파장 영역 띠 */
      [[100, 380, "자외선", "--violet"], [380, 750, "가시광선", "--teal"], [750, 1e6, "적외선", "--coral"], [1e6, 1e7, "전파", "--brand"]].forEach(function (b) {
        var x0 = XL(b[0]), x1 = XL(b[1]);
        band(ctx, x0, Y1 + 4, x1 - x0, 20, b[3], 0.3);
        ctx.strokeStyle = v("--line"); ctx.lineWidth = 1; ctx.strokeRect(x0, Y1 + 4, x1 - x0, 20);
        if (x1 - x0 > 40) text(ctx, b[2], (x0 + x1) / 2, Y1 + 19, { s: 10.5, a: "center", w: "800", c: v("--mist") });
      });
      [[100, "10²"], [1e3, "10³"], [1e4, "10⁴"], [1e5, "10⁵"], [1e6, "10⁶"], [1e7, "10⁷"]].forEach(function (m) {
        text(ctx, m[1], XL(m[0]), Y1 + 42, { s: 10.5, a: "center", c: v("--mist") });
      });
      text(ctx, "파장 (nm, 로그 눈금) →", X1, Y1 + 62, { s: 11, a: "right", c: v("--mist") });
      text(ctx, "세기", X0 - 8, Y0 - 14, { s: 11, a: "right", c: v("--mist") });

      /* 지금의 곡선 (2.725 K) */
      function curve(TT, col, wide, alpha) {
        var pk = planck(WIEN / TT, TT);
        ctx.save(); ctx.strokeStyle = v(col); ctx.lineWidth = wide; ctx.globalAlpha = alpha;
        ctx.beginPath();
        for (var i = 0; i <= 200; i++) {
          var lg = LO + i / 200 * (HI - LO), nm = Math.pow(10, lg);
          var y = Y1 - clamp(planck(nm, TT) / pk, 0, 1) * (Y1 - Y0);
          var x = X0 + i / 200 * (X1 - X0);
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke(); ctx.restore();
      }
      curve(2.725, "--mist", 2, 0.55);
      curve(T, "--coral", 3, 1);
      dash(ctx, XL(lmax), Y0, XL(lmax), Y1, "--ink");
      text(ctx, "최대 세기 파장", clamp(XL(lmax), X0 + 54, X1 - 54), Y0 - 6, { s: 10.5, a: "center", w: "800", c: v("--ink") });
      text(ctx, "지금 (2.7 K)", clamp(XL(WIEN / 2.725) - 8, X0, X1 - 62), Y0 + 18, { s: 10.5, a: "right", c: v("--mist") });

      var px = 632;
      text(ctx, "그때 이후 우주가 커진 배율", px, 78, { s: 11, w: "800", c: v("--mist") });
      text(ctx, comma(f) + " 배", px, 106, { s: 20, w: "900" });
      text(ctx, "그때의 복사 온도", px, 144, { s: 11, w: "800", c: v("--mist") });
      text(ctx, num(T) + " K", px, 180, { s: 26, w: "900", c: Math.abs(T - 3000) <= 100 ? v("--teal-700") : v("--coral-700") });
      text(ctx, "최대 세기 파장", px, 216, { s: 11, w: "800", c: v("--mist") });
      text(ctx, lmax >= 1e6 ? num(lmax / 1e6) + " mm" : comma(lmax) + " nm", px, 244, { s: 18, w: "900", c: v("--violet-700") });
      text(ctx, lmax < 380 ? "자외선" : (lmax < 750 ? "가시광선" : (lmax < 1e6 ? "적외선" : "전파")), px, 272, { s: 14, w: "900" });
      text(ctx, Math.abs(T - 3000) <= 100 ? "✅ 우주 배경 복사가 출발한 때입니다" : "온도 × 파장 = 2.898×10⁶ nm·K", px, 308,
        { s: 11.5, w: "800", c: Math.abs(T - 3000) <= 100 ? v("--teal-700") : v("--mist") });
      text(ctx, "공간이 f 배 늘어나면 파장도 f 배 늘어나고, 온도는 f 분의 1 이 됩니다.", 30, 392, { s: 11.5, c: v("--mist") });
      text(ctx, "3,000 K 에서 출발한 빛이 약 1,100배 늘어난 공간을 지나며 2.7 K 의 전파가 되었습니다.", 30, 414, { s: 11.5, c: v("--mist") });

      if (Math.abs(T - 3000) <= 100 && !G4.d) { G4.d = true; window.sthState("dBB", G4); mission4(); }

      $("d-cmb-read").innerHTML = "그때의 복사 온도: <b>" + num(T) + " K</b> · 최대 세기 파장 " + (lmax >= 1e6 ? num(lmax / 1e6) + " mm" : comma(lmax) + " nm");
      $("d-cmb-info").innerHTML = Math.abs(T - 3000) <= 100
        ? "<b>우주 배경 복사가 출발한 때입니다.</b> 그때 우주는 약 3,000 K 였고 빛의 최대 세기 파장은 " + comma(lmax) + " nm — 거의 가시광선이었습니다. 그 뒤 공간이 약 1,100배 늘어나면서 파장도 1,100배 늘어나, 지금은 파장 약 1 mm 의 <b>전파</b>로 관측됩니다."
        : "우주가 f 배 커지면 빛의 파장도 f 배 늘어나므로, 빈의 변위 법칙에 따라 복사 온도는 f 분의 1 이 됩니다. 지금 배율에서는 <b>" + num(T) + " K</b> 이고 최대 세기 파장은 " + (lmax >= 1e6 ? num(lmax / 1e6) + " mm" : comma(lmax) + " nm") + " 입니다. 배율을 키워 <b>3,000 K</b> 였던 때로 되감아 보세요.";
    }
    canvas._redraw = draw;
    $("d-exp").addEventListener("input", function (e) {
      le = +e.target.value;
      $("d-exp-val").textContent = comma(Math.pow(10, le)) + " 배" + (le < 0.005 ? " (지금)" : "");
      draw();
    });
    draw(); mission4();
  })();

  /* ---- 장면5 : 급팽창과 가속 팽창 ---- */
  var G5 = window.sthState("dFut") || { a: false, b: false, c: false, d: false };
  function mission5() {
    if (G5.a) done("m4-5a"); if (G5.b) done("m4-5b"); if (G5.c) done("m4-5c"); if (G5.d) done("m4-5d");
    if (G5.a && G5.b && G5.c && G5.d) {
      window.sthMission("m4-5", true, "<span class='m-tag'>미션 완료</span>중력만 있으면 팽창은 계속 <b>느려져야</b> 합니다. 그런데 Ⅰa형 초신성 관측은 팽창이 <b>빨라지고</b> 있음을 보여 주었고, 그 원인으로 지목된 것이 <b>암흑 에너지</b>(약 70 %)입니다. 한편 대폭발 우주론이 풀지 못한 <b>지평선 문제</b>와 <b>평탄성 문제</b>는 <b>급팽창 우주론</b>이 메웠습니다.");
      ep.clear(4); ep.clear(5);
    }
  }
  (function () {
    var canvas = $("d-c-fut"), ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var de = 30;
    function asinh(x) { return Math.log(x + Math.sqrt(x * x + 1)); }
    function ageF(OL) { return OL <= 0 ? 2 / 3 : (2 / (3 * Math.sqrt(OL))) * asinh(Math.sqrt(OL / (1 - OL))); }
    function aOf(x, OL) {
      if (OL <= 0) return Math.pow(1.5 * x, 2 / 3);
      return Math.pow((1 - OL) / OL, 1 / 3) * Math.pow(Math.sinh(1.5 * Math.sqrt(OL) * x), 2 / 3);
    }

    function draw() {
      paper(ctx, W, H);
      var OL = de / 100, Om = 1 - OL, q0 = Om / 2 - OL;
      var f = ageF(OL), age = f * TH / 70, a0 = aOf(f, OL);
      text(ctx, "대폭발이 풀지 못한 것 — 급팽창과 가속 팽창", 30, 30, { s: 14, w: "900" });

      /* 왼쪽 : 급팽창 도식 */
      var AX0 = 56, AX1 = 400, AY0 = 74, AY1 = 300;
      axes(ctx, AX0, AY0, AX1, AY1);
      text(ctx, "우주의 크기 (로그)", AX0 - 4, AY0 - 14, { s: 10.5, c: v("--mist") });
      text(ctx, "시간 (로그) →", AX1, AY1 + 38, { s: 10.5, a: "right", c: v("--mist") });
      ctx.strokeStyle = v("--brand"); ctx.lineWidth = 3;
      ctx.beginPath();
      var pts = [[0, 0.02], [0.10, 0.07], [0.14, 0.52], [0.18, 0.56], [0.55, 0.74], [1, 0.95]];
      pts.forEach(function (p, i) {
        var x = AX0 + p[0] * (AX1 - AX0), y = AY1 - p[1] * (AY1 - AY0);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();
      var ix = AX0 + 0.12 * (AX1 - AX0);
      dash(ctx, ix, AY0, ix, AY1, "--rose");
      text(ctx, "급팽창", ix + 8, AY0 + 16, { s: 12, w: "900", c: v("--rose-700") });
      text(ctx, "10⁻³⁶ 초 무렵", ix + 8, AY0 + 34, { s: 10.5, c: v("--mist") });
      text(ctx, "그 뒤로는 천천히", AX0 + 140, AY1 - 40, { s: 10.5, c: v("--mist") });
      text(ctx, "급팽창 전에는 지금 하늘의 양쪽 끝도 한 덩어리로 붙어 있었습니다 →", AX0, AY1 + 62, { s: 10.5, c: v("--mist") });
      text(ctx, "그래서 우주 배경 복사의 온도가 어디서나 같습니다 (지평선 문제 해결).", AX0, AY1 + 82, { s: 10.5, c: v("--mist") });
      text(ctx, "또 엄청나게 부푼 덕분에 우주가 거의 편평해집니다 (평탄성 문제 해결).", AX0, AY1 + 102, { s: 10.5, c: v("--mist") });
      text(ctx, "※ 가로·세로 모두 로그이며, 보기 좋게 줄여 그린 도식입니다.", AX0, AY1 + 122, { s: 10, c: v("--mist") });

      /* 오른쪽 : 감속 vs 가속 */
      var BX0 = 470, BX1 = 872, BY0 = 74, BY1 = 320, XMAX = 2.0;
      axes(ctx, BX0, BY0, BX1, BY1);
      function PX(x) { return BX0 + x / XMAX * (BX1 - BX0); }
      function PY(a) { return BY1 - clamp(a / a0 / 2.2, 0, 1) * (BY1 - BY0); }
      ctx.save(); ctx.strokeStyle = v("--mist"); ctx.lineWidth = 2; ctx.setLineDash([5, 4]);
      ctx.beginPath();
      for (var i = 0; i <= 120; i++) {
        var x = 0.0001 + i / 120 * XMAX;
        var px2 = PX(x), py2 = PY(aOf(x, 0) / aOf(2 / 3, 0) * a0);
        if (i === 0) ctx.moveTo(px2, py2); else ctx.lineTo(px2, py2);
      }
      ctx.stroke(); ctx.setLineDash([]); ctx.restore();
      ctx.strokeStyle = v("--coral"); ctx.lineWidth = 3; ctx.beginPath();
      for (var j = 0; j <= 120; j++) {
        var x2 = 0.0001 + j / 120 * XMAX;
        var px3 = PX(x2), py3 = PY(aOf(x2, OL));
        if (j === 0) ctx.moveTo(px3, py3); else ctx.lineTo(px3, py3);
      }
      ctx.stroke();
      dash(ctx, PX(f), BY0, PX(f), BY1, "--ink");
      text(ctx, "지금", clamp(PX(f), BX0 + 16, BX1 - 16), BY0 - 6, { s: 10.5, a: "center", w: "800", c: v("--ink") });
      text(ctx, "점선 : 암흑 에너지가 없을 때 (감속)", BX0 + 10, BY0 + 20, { s: 10.5, c: v("--mist") });
      text(ctx, "굵은 선 : 지금 설정", BX0 + 10, BY0 + 38, { s: 10.5, w: "800", c: v("--coral-700") });
      text(ctx, "우주의 크기", BX0 - 6, BY0 - 14, { s: 10.5, a: "right", c: v("--mist") });
      text(ctx, "시간 →", BX1, BY1 + 20, { s: 10.5, a: "right", c: v("--mist") });

      text(ctx, "암흑 에너지 " + de + " %  ·  물질 " + (100 - de) + " %", BX0, BY1 + 48, { s: 13, w: "900" });
      text(ctx, q0 < 0 ? "팽창이 점점 빨라집니다 (가속 팽창)" : "팽창이 점점 느려집니다 (감속 팽창)", BX0, BY1 + 74,
        { s: 15, w: "900", c: q0 < 0 ? v("--coral-700") : v("--brand-700") });
      text(ctx, "이 우주의 나이 = " + fmtYear(age) + "  (H₀ = 70 일 때)", BX0, BY1 + 100, { s: 13, w: "900", c: v("--violet-700") });
      text(ctx, de === 0 ? "가장 늙은 별보다도 우주가 젊어집니다 — 앞뒤가 맞지 않지요." : (Math.abs(de - 70) < 0.1 ? "실제 관측값입니다. 나이도 138억 년에 가깝게 나옵니다." : "암흑 에너지를 바꾸면 나이도 함께 달라집니다."),
        BX0, BY1 + 124, { s: 11, c: v("--mist") });

      var ch = false;
      if (de === 0 && !G5.a) { G5.a = ch = true; }
      if (q0 < 0 && !G5.b) { G5.b = ch = true; }
      if (Math.abs(de - 70) < 0.1 && !G5.c) { G5.c = ch = true; }
      if (ch) { window.sthState("dFut", G5); mission5(); }

      $("d-fut-read").innerHTML = "팽창: <b>" + (q0 < 0 ? "가속" : "감속") + "</b> · 이 우주의 나이 " + fmtYear(age);
      $("d-fut-info").innerHTML = q0 < 0
        ? "<b>가속 팽창하는 우주입니다.</b> 암흑 에너지가 " + de + " % 를 넘으면 밀어내는 효과가 중력을 이겨, 팽창이 시간이 갈수록 빨라집니다. 1990년대 말 먼 <b>Ⅰa형 초신성</b>이 예상보다 어둡게 보인다는 관측이 바로 이 사실을 알려 주었습니다. 암흑 에너지의 정체는 아직 밝혀지지 않았습니다."
        : "<b>감속 팽창하는 우주입니다.</b> 은하들 사이에 작용하는 중력이 팽창을 늦추기 때문에, 과학자들도 오랫동안 우주가 이렇게 될 것이라고 보았습니다. 암흑 에너지를 늘려 보면 어느 비율부터 팽창이 빨라지는지 알 수 있습니다." +
          (de === 0 ? " 그런데 이 경우 우주의 나이가 <b>" + fmtYear(age) + "</b> 밖에 되지 않아, 가장 늙은 별들보다도 젊어지는 문제가 생깁니다." : "");
    }
    canvas._redraw = draw;
    $("d-de").addEventListener("input", function (e) { de = +e.target.value; $("d-de-val").textContent = de + " %"; draw(); });
    draw(); mission5();
  })();

  window.sthPick({
    mount: "d-q1",
    q: "<b>급팽창 우주론</b>이 설명해 준 것으로 옳은 것을 고르세요.",
    options: [
      "㉠ 우주의 팽창이 왜 점점 빨라지는가",
      "㉡ 서로 반대쪽 하늘의 우주 배경 복사 온도가 왜 거의 같은가",
      "㉢ 수소와 헬륨의 질량비가 왜 약 3 : 1 인가"
    ],
    answer: 1,
    why: [
      "가속 팽창은 급팽창과 다른 이야기입니다. 그것은 1990년대 말 Ⅰa형 초신성 관측으로 알려졌고, 원인으로는 <b>암흑 에너지</b>가 지목됩니다.",
      "그렇습니다. 이것이 <b>지평선 문제</b>입니다. 급팽창 전에는 한 덩어리로 붙어 있어 온도를 맞출 수 있었고, 그 영역이 급팽창으로 크게 부풀었다고 설명합니다. 우주가 거의 편평한 까닭(<b>평탄성 문제</b>)도 함께 풀립니다.",
      "그것은 급팽창이 아니라 <b>대폭발 후 약 3분</b>의 핵반응으로 설명됩니다. 대폭발 우주론이 이미 잘 설명하던 것이지요."
    ],
    onDone: function () { G5.d = true; window.sthState("dFut", G5); mission5(); }
  });

  function finish() { window.sthState("r4", "해결 · 공간이 부푸니 중심이 없다, H0 약 70이면 나이 약 140억 년"); }
  function vsD() {
    var p = window.sthState("d-p") || "";
    $("d-vs").innerHTML = "<b>나의 첫 예상</b> " + (p || "기록 없음") + "<br>" +
      (p.indexOf("㉡") === 0 ? "정확했습니다. 격자에서 어느 은하를 기준으로 삼아도 똑같은 법칙이 나왔습니다 — 중심이 따로 없습니다."
        : "㉡ 이 정답이었습니다. 은하가 공간 속을 달아나는 것이 아니라 <b>공간 자체</b>가 부풀기 때문에, 어느 은하에서 보아도 나머지가 멀어져 보입니다.");
  }
  vsD();
  ep.onShow(vsD);
  window.sthWork({
    mount: "wkD", unitLabel: "[지구과학 Ⅲ-2] 이야기 ④ 팽창하는 우주",
    items: [
      { id: "w3", label: "허블-르메트르 법칙", hint: "거리가 먼 은하일수록 후퇴 속도가 큰 것이 왜 “우주가 팽창한다”는 뜻이 되는지 쓰세요." },
      { id: "d2", label: "대폭발 우주론의 증거와 한계", hint: "대폭발 우주론을 받치는 증거 두 가지를 들고, 그것만으로는 설명되지 않아 급팽창·암흑 에너지가 필요해진 까닭을 쓰세요." }
    ]
  });
})();

/* ========================================================================= 05 정리하기 */
window.sthWork({
  mount: "wk", unitLabel: "[지구과학 Ⅲ-2] 별과 우주의 진화 — 정리",
  recap: [
    { key: "r1", label: "① 여자들의 별 목록" },
    { key: "r2", label: "② 질량이 정한 일생" },
    { key: "r3", label: "③ 은하 동물원" },
    { key: "r4", label: "④ 팽창하는 우주" }
  ],
  items: [
    { id: "all", label: "네 사건을 꿰는 한 문장", hint: "별빛의 스펙트럼 하나에서 온도가, 온도와 밝기에서 크기와 일생이, 은하의 빛에서 그 중심의 정체가, 그리고 빛의 적색 편이에서 우주의 나이가 나왔습니다. ‘우리가 가진 것은 빛뿐인데 어떻게 이 모든 것을 알아냈는가’ 를 한 문장으로 쓰세요." },
    { id: "w4", label: "아직 헷갈리는 것", hint: "다음 시간에 여기서부터 시작합니다." }
  ]
});

/* ========================================================================= 06 우리 반 */
window.sthShare({
  mount: "share", unit: "eshs-3-2", unitLabel: "[지구과학 Ⅲ-2] 별과 우주의 진화",
  rows: [
    { key: "r1", label: "① 여자들의 별 목록" },
    { key: "r2", label: "② 질량이 정한 일생" },
    { key: "r3", label: "③ 은하 동물원" },
    { key: "r4", label: "④ 팽창하는 우주" }
  ],
  line: { id: "all", label: "네 사건을 꿰는 한 문장" }
});

})();
