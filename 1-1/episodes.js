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
/* setTimeout 애니메이션 (가려진 탭에서는 그리지 않는다) */
function anim(canvas, step) {
  (function tick() {
    if (canvas.offsetParent !== null) step();
    setTimeout(tick, 70);
  })();
}
/* 간단한 해수 상태 방정식 — 수온·염분으로 구하는 밀도 이상치 σt */
function sigmaT(T, S) {
  return 28.14 - 0.0735 * T - 0.00469 * T * T + (0.802 - 0.002 * T) * (S - 35);
}
/* σt 가 주어졌을 때 그 염분에서의 수온 (등밀도선 그리기용) */
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
  ctx.strokeStyle = v("--line"); ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
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

    function draw() {
      paper(ctx, W, H);
      var p = PROF[lat];
      text(ctx, p.label + " 의 연직 관측", 60, 36, { s: 14, w: "900" });

      /* 수온약층 띠 (수온 변화율이 큰 구간) */
      var lo = null, hi = null;
      for (var d0 = 0; d0 <= 1000; d0 += 10) {
        if (gradT(d0, p) >= 0.02) { if (lo === null) lo = d0; hi = d0; }
      }
      [[TX0, TX1], [SX0, SX1]].forEach(function (box) {
        if (lo === null) return;
        ctx.fillStyle = v("--teal"); ctx.globalAlpha = 0.14;
        ctx.fillRect(box[0], YD(lo), box[1] - box[0], YD(hi) - YD(lo)); ctx.globalAlpha = 1;
      });

      axes(ctx, TX0, PY0, TX1, PY1);
      axes(ctx, SX0, PY0, SX1, PY1);
      for (var dd = 0; dd <= 1000; dd += 200) {
        ctx.strokeStyle = v("--line"); ctx.globalAlpha = 0.4;
        ctx.beginPath(); ctx.moveTo(TX0, YD(dd)); ctx.lineTo(TX1, YD(dd)); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(SX0, YD(dd)); ctx.lineTo(SX1, YD(dd)); ctx.stroke();
        ctx.globalAlpha = 1;
        text(ctx, dd + "", TX0 - 8, YD(dd) + 4, { s: 10.5, a: "right", c: v("--mist") });
        text(ctx, dd + "", SX0 - 8, YD(dd) + 4, { s: 10.5, a: "right", c: v("--mist") });
      }
      text(ctx, "깊이(m)", TX0 - 8, PY0 - 12, { s: 11, a: "right", c: v("--mist") });
      for (var tt = 0; tt <= 30; tt += 10) text(ctx, tt + "℃", XT(tt), PY1 + 18, { s: 10.5, a: "center", c: v("--mist") });
      for (var ss = 33; ss <= 36; ss += 1) text(ctx, ss + "", XS(ss), PY1 + 18, { s: 10.5, a: "center", c: v("--mist") });
      text(ctx, "수온 →", TX1, PY1 + 34, { s: 11, a: "right", c: v("--mist") });
      text(ctx, "염분(psu) →", SX1, PY1 + 34, { s: 11, a: "right", c: v("--mist") });

      /* 곡선 */
      ctx.strokeStyle = v("--coral"); ctx.lineWidth = 2.8; ctx.beginPath();
      for (var k = 0; k <= 200; k++) {
        var d = k * 5, x = XT(profT(d, p)), y = YD(d);
        if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.strokeStyle = v("--brand"); ctx.lineWidth = 2.8; ctx.beginPath();
      for (var k2 = 0; k2 <= 200; k2++) {
        var d2 = k2 * 5, x2 = XS(profS(d2, p)), y2 = YD(d2);
        if (k2 === 0) ctx.moveTo(x2, y2); else ctx.lineTo(x2, y2);
      }
      ctx.stroke();

      /* 현재 관측점 */
      var cT = profT(depth, p), cS = profS(depth, p), cD = sigmaT(cT, cS), g = gradT(depth, p);
      ctx.strokeStyle = v("--violet"); ctx.setLineDash([4, 4]); ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.moveTo(TX0, YD(depth)); ctx.lineTo(SX1, YD(depth)); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = v("--violet");
      ctx.beginPath(); ctx.arc(XT(cT), YD(depth), 6, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(XS(cS), YD(depth), 6, 0, Math.PI * 2); ctx.fill();
      if (lo !== null) text(ctx, "수온약층", (TX0 + TX1) / 2, YD((lo + hi) / 2) + 4, { s: 12, a: "center", w: "800", c: v("--teal-700") });

      var layer = (lo !== null && depth >= lo && depth <= hi) ? "수온약층" : (depth <= p.top + 10 ? "혼합층" : (lo === null ? "거의 균질한 층" : (depth < lo ? "혼합층" : "심해층")));
      text(ctx, "깊이 " + depth + " m", 60, 390, { s: 15, w: "900" });
      text(ctx, "수온 " + cT.toFixed(1) + " ℃", 230, 390, { s: 15, w: "900", c: v("--coral-700") });
      text(ctx, "염분 " + cS.toFixed(2) + " psu", 400, 390, { s: 15, w: "900", c: v("--brand-700") });
      text(ctx, "밀도 σt " + cD.toFixed(2), 610, 390, { s: 15, w: "900", c: v("--violet-700") });
      text(ctx, "이 깊이의 층 : " + layer + "  ·  수온 변화율 " + g.toFixed(3) + " ℃/m", 60, 414, { s: 12.5, c: v("--mist") });
      text(ctx, "σt = 밀도 − 1000 (클수록 무겁다)", 560, 414, { s: 11, c: v("--mist") });

      var ch = false;
      if (lat === "low" && g >= 0.02 && !got.a) { got.a = ch = true; }
      if (lat === "mid" && g >= 0.02 && !got.b) { got.b = ch = true; }
      if (lat === "high" && depth >= 300 && !got.c) { got.c = ch = true; }
      if (ch) { window.sthState("aProf", got); mission(); }

      $("a-prof-info").innerHTML = "지금 관측점은 <b>" + layer + "</b> 입니다. " +
        (layer === "혼합층" ? "바람이 위아래를 휘저어 수온이 거의 일정한 층입니다." :
          (layer === "수온약층" ? "깊이가 늘어날수록 수온이 <b>급격히</b> 낮아집니다. 아래쪽 물이 훨씬 무거워 위아래가 잘 섞이지 않는, 일종의 <b>뚜껑</b>입니다." :
            (layer === "심해층" ? "햇빛이 닿지 않아 수온이 낮고 거의 일정합니다." :
              "고위도 바다는 표층부터 차가워서 <b>수온약층이 뚜렷하지 않습니다.</b> 위아래가 잘 섞일 수 있다는 뜻이지요.")));
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

    var X0 = 90, X1 = 540, Y0 = 58, Y1 = 340;
    function XS(sal) { return X0 + ((sal - 31.5) / 4) * (X1 - X0); }
    function YT(t) { return Y1 - (t / 25) * (Y1 - Y0); }

    function isoline(target, color, wide) {
      ctx.strokeStyle = color; ctx.lineWidth = wide ? 3 : 1.4;
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

    function draw() {
      paper(ctx, W, H);
      text(ctx, "수온 염분도 (T-S도)", 60, 34, { s: 14, w: "900" });
      axes(ctx, X0, Y0, X1, Y1);
      for (var sal = 32; sal <= 35; sal += 1) text(ctx, sal.toFixed(0), XS(sal), Y1 + 18, { s: 10.5, a: "center", c: v("--mist") });
      text(ctx, "염분(psu) →", X1, Y1 + 36, { s: 11, a: "right", c: v("--mist") });
      for (var t0 = 0; t0 <= 25; t0 += 5) text(ctx, t0 + "℃", X0 - 8, YT(t0) + 4, { s: 10.5, a: "right", c: v("--mist") });
      text(ctx, "수온", X0 - 8, Y0 - 12, { s: 11, a: "right", c: v("--mist") });

      /* 등밀도선 */
      for (var g = 22; g <= 28.5001; g += 0.5) isoline(g, v("--line"), false);
      isoline(sig, v("--amber"), true);
      var lt = tempForSigma(sig, 35.3);
      if (lt !== null && lt >= 1 && lt <= 24) text(ctx, "σt " + sig.toFixed(2), clamp(XS(35.3) + 6, X0, X1 - 4), YT(lt) - 6, { s: 11.5, w: "800", c: v("--amber-700") });

      /* 세 정점 */
      ST.forEach(function (q, i) {
        var x = XS(q.S), y = YT(q.T);
        ctx.fillStyle = v(i === s ? "--violet" : "--mist");
        ctx.beginPath(); ctx.arc(x, y, i === s ? 8 : 5, 0, Math.PI * 2); ctx.fill();
        text(ctx, q.n, clamp(x, X0 + 24, X1 - 24), y - 14, { s: 11.5, a: "center", w: "800", c: v(i === s ? "--violet-700" : "--mist") });
      });

      /* 오른쪽 자료판 */
      var px = 580;
      var Q = ST[s], real = sigmaT(Q.T, Q.S), ok = Math.abs(sig - real) <= 0.07;
      text(ctx, "채수 기록", px, 84, { s: 13, w: "900" });
      ctx.strokeStyle = v("--line"); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(px, 96); ctx.lineTo(880, 96); ctx.stroke();
      text(ctx, Q.n, px, 126, { s: 20, w: "900", c: v("--violet-700") });
      text(ctx, "수온 " + Q.T.toFixed(1) + " ℃", px, 156, { s: 13.5, c: v("--mist") });
      text(ctx, "염분 " + Q.S.toFixed(1) + " psu", px, 180, { s: 13.5, c: v("--mist") });
      text(ctx, "내가 읽은 σt", px, 224, { s: 12, c: v("--mist"), w: "800" });
      text(ctx, sig.toFixed(2), px, 254, { s: 24, w: "900", c: ok ? v("--teal-700") : v("--ink") });
      text(ctx, ok ? "✅ 등밀도선과 맞습니다" : (sig > real ? "이 점보다 무거운 선입니다" : "이 점보다 가벼운 선입니다"),
        px, 286, { s: 13, w: "900", c: ok ? v("--teal-700") : v("--rose-700") });
      ST.forEach(function (q, i) {
        text(ctx, q.n + (got[i] ? " : σt " + sigmaT(q.T, q.S).toFixed(2) : " : ?"), px, 318 + i * 22,
          { s: 12, w: got[i] ? "800" : "500", c: got[i] ? v("--teal-700") : v("--mist") });
      });
      text(ctx, "굵은 주황 선이 내가 고른 등밀도선입니다. 정점이 그 선 위에 오도록 맞추세요.", 60, H - 16, { s: 11, c: v("--mist") });

      if (ok && !got[s]) { got[s] = true; window.sthState("aTS", got); mission(); }
      $("a-ts-info").innerHTML = "수온과 염분이 <b>둘 다</b> 밀도를 정합니다. 그래서 수온이 다른 두 물이 <b>같은 밀도</b>일 수도 있어요. 수온 염분도에서 같은 자리에 모이는 물 덩어리를 <b>수괴</b>라고 하고, 수괴는 자기가 만들어진 바다의 흔적을 오래 간직합니다." +
        (ok ? " — <b>" + Q.n + " 의 σt 는 " + real.toFixed(2) + "</b> 입니다." : "");
    }
    function mission() {
      ["m1-3a", "m1-3b", "m1-3c", "m1-3d"].forEach(function (id, k) { if (got[k]) done(id); });
      if (got[0] && got[1] && got[2] && got[3]) {
        window.sthMission("m1-3", true, "<span class='m-tag'>미션 완료</span>정점 ㄱ 25.38 · ㄴ 25.03 · ㄷ 27.34. 수온이 가장 낮은 <b>정점 ㄷ(동해 고유수)</b> 가 가장 무겁습니다. 정점 ㄱ과 ㄴ은 수온이 9 ℃나 차이 나는데도 밀도는 비슷합니다. <b>염분이 그 차이를 메운 것</b>입니다.");
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
        { t: "셋 가운데 수온이 가장 높다", a: "k", why: "16 ℃ 로 가장 따뜻합니다.", hint: "표에서 수온을 견주어 보세요." },
        { t: "큰 강물이 많이 흘러들어 염분이 가장 낮다", a: "n", why: "황해는 수심이 얕고 담수 유입이 많아 염분이 낮습니다." },
        { t: "여름에 바닥에 갇혀 남아 있는 찬물", a: "n", why: "겨울에 차가워진 물이 여름에도 바닥에 남아 있는 것입니다.", hint: "얕은 바다의 바닥을 생각해 보세요." },
        { t: "수온이 1 ℃ 안팎으로 거의 일정한 깊은 물", a: "t", why: "동해 깊은 곳은 수온이 거의 변하지 않습니다." },
        { t: "셋 가운데 밀도가 가장 크다", a: "t", why: "σt 27.34 로 가장 무겁습니다." }
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

    var BX0 = 190, BX1 = 840, YEQ = 280, BAND = 66;

    function bands() {
      return [
        { y: YEQ - 3 * BAND, name: "극동풍", dir: -1, on: wind.polar, c: "--violet" },
        { y: YEQ - 2 * BAND, name: "편서풍", dir: 1, on: wind.westerlies, c: "--brand" },
        { y: YEQ - BAND, name: "무역풍", dir: -1, on: wind.trade, c: "--coral" }
      ];
    }
    function loops() {
      var out = [];
      if (wind.trade && wind.westerlies) out.push({ cy: YEQ - 1.5 * BAND, ry: 50, cw: true, c: "--coral", n: "아열대 순환" });
      if (wind.westerlies && wind.polar) out.push({ cy: YEQ - 2.5 * BAND, ry: 50, cw: false, c: "--violet", n: "아한대 순환" });
      return out;
    }

    function draw() {
      paper(ctx, W, H);
      text(ctx, "북반구 대양 모식도 — 바람이 만드는 표층 순환", 60, 34, { s: 14, w: "900" });
      /* 해분 */
      ctx.fillStyle = v("--card-2");
      ctx.beginPath(); ctx.roundRect(BX0, YEQ - 3.5 * BAND, BX1 - BX0, 3.5 * BAND, 14); ctx.fill();
      ctx.strokeStyle = v("--line"); ctx.lineWidth = 2; ctx.stroke();
      text(ctx, "적도", BX0 - 10, YEQ + 4, { s: 11.5, a: "right", w: "800", c: v("--mist") });
      text(ctx, "극", BX0 - 10, YEQ - 3.5 * BAND + 14, { s: 11.5, a: "right", w: "800", c: v("--mist") });

      /* 바람띠 */
      bands().forEach(function (b) {
        ctx.globalAlpha = b.on ? 1 : 0.18;
        ctx.strokeStyle = v(b.c); ctx.fillStyle = v(b.c); ctx.lineWidth = 2.2;
        for (var i = 0; i < 6; i++) {
          var x = BX0 + 60 + i * ((BX1 - BX0 - 100) / 5);
          window.drawArrow(ctx, x - b.dir * 16, b.y, x + b.dir * 16, b.y, 7);
        }
        text(ctx, b.name, BX0 - 10, b.y + 4, { s: 11.5, a: "right", w: "800", c: v(b.c) });
        ctx.globalAlpha = 1;
      });

      /* 순환 고리 */
      var L = loops(), cx = (BX0 + BX1) / 2, rx = (BX1 - BX0) / 2 - 40;
      L.forEach(function (lp) {
        ctx.strokeStyle = v(lp.c); ctx.globalAlpha = 0.45; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(cx, lp.cy, rx, lp.ry, 0, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1;
        for (var i = 0; i < 20; i++) {
          var u = (i / 20 + t * 0.02) % 1;
          var a = (lp.cw ? 1 : -1) * u * Math.PI * 2 - Math.PI / 2;
          ctx.fillStyle = v(lp.c);
          ctx.beginPath(); ctx.arc(cx + rx * Math.cos(a), lp.cy + lp.ry * Math.sin(a), 4.5, 0, Math.PI * 2); ctx.fill();
        }
        text(ctx, lp.n + (lp.cw ? " (시계 방향)" : " (시계 반대 방향)"), cx, lp.cy + 5, { s: 13, a: "center", w: "900", c: v(lp.c + "-700") });
      });
      if (!L.length) text(ctx, "이웃한 두 바람을 함께 켜야 고리가 완성됩니다", cx, YEQ - 2 * BAND, { s: 14, a: "center", w: "800", c: v("--mist") });

      text(ctx, "서쪽 가장자리에서는 해류가 좁고 빠르게 흐릅니다 (서안 경계류)", 60, H - 42, { s: 12, c: v("--mist") });
      text(ctx, "실제 해안선이 아닌 네모난 해분 모식도입니다. 남반구에서는 도는 방향이 반대가 됩니다.", 60, H - 18, { s: 10.5, c: v("--mist") });

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
    anim(canvas, function () { t += 1; draw(); });
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

    function draw() {
      paper(ctx, W, H);
      var ek = ekAz();
      text(ctx, "에크만 나선 — 깊이에 따라 조금씩 더 휘어진다", 60, 34, { s: 14, w: "900" });

      /* 왼쪽: 깊이별 화살표 */
      var ox = 230, oy0 = 80;
      for (var i = 0; i <= 6; i++) {
        var yy = oy0 + i * 40;
        var a2 = az + (hemi === "N" ? 1 : -1) * (20 + i * 22);
        var vv = azVec(a2), len = 62 * Math.pow(0.78, i);
        ctx.globalAlpha = 1 - i * 0.1;
        ctx.strokeStyle = v(i === 0 ? "--amber" : "--brand"); ctx.fillStyle = v(i === 0 ? "--amber" : "--brand"); ctx.lineWidth = i === 0 ? 4 : 2.6;
        window.drawArrow(ctx, ox, yy, ox + vv.x * len, yy + vv.y * len * 0.55, 9);
        ctx.globalAlpha = 1;
        text(ctx, i === 0 ? "바람 (표층)" : (i * 12) + " m", 108, yy + 4, { s: 11, c: v("--mist") });
      }
      text(ctx, "깊어질수록 화살표가 짧아지고 더 휘어집니다", 60, 368, { s: 11.5, c: v("--mist") });

      /* 오른쪽: 나침반 */
      var cx = 650, cy = 210, R = 120;
      compass(ctx, cx, cy, R, [az, ek]);
      var wv = azVec(az), ev = azVec(ek);
      ctx.strokeStyle = v("--amber"); ctx.fillStyle = v("--amber"); ctx.lineWidth = 5;
      window.drawArrow(ctx, cx, cy, cx + wv.x * R, cy + wv.y * R, 13);
      ctx.strokeStyle = v("--coral"); ctx.fillStyle = v("--coral"); ctx.lineWidth = 5;
      window.drawArrow(ctx, cx, cy, cx + ev.x * R * 0.82, cy + ev.y * R * 0.82, 13);
      text(ctx, "바람", clamp(cx + wv.x * (R + 38), 460, 870), clamp(cy + wv.y * (R + 38), 56, 372), { s: 12.5, a: "center", w: "900", c: v("--amber-700") });
      text(ctx, "에크만 수송", clamp(cx + ev.x * (R + 38), 460, 840), clamp(cy + ev.y * (R + 38), 56, 372), { s: 12.5, a: "center", w: "900", c: v("--coral-700") });

      text(ctx, "바람 " + azName(az) + "쪽 (" + az + "°)", 470, 392, { s: 14, w: "900", c: v("--amber-700") });
      text(ctx, "순 수송 " + azName(ek) + "쪽 (" + ek + "°)", 640, 392, { s: 14, w: "900", c: v("--coral-700") });
      text(ctx, hemi === "N" ? "북반구 : 바람의 오른쪽 90°" : "남반구 : 바람의 왼쪽 90°", 470, 414, { s: 11.5, c: v("--mist") });

      var ch = false;
      if (hemi === "N" && Math.abs(((ek - 90 + 540) % 360) - 180) <= 10 && !GOT5.a) { GOT5.a = ch = true; }
      if (hemi === "S" && Math.abs(((ek - 270 + 540) % 360) - 180) <= 10 && !GOT5.b) { GOT5.b = ch = true; }
      if (ch) { window.sthState("aEk", GOT5); mission5(); }

      $("a-ekman-info").innerHTML = "표층 물은 바람의 오른쪽(북반구)으로 조금 휘고, 그 아래 물은 더 휩니다. 이 나선을 <b>모두 더한 값</b>이 순 수송이고, 그 방향이 바람의 <b>직각</b>이 됩니다. " +
        (hemi === "N" && ek >= 80 && ek <= 100 ? "<b>지금이 남풍입니다.</b> 물은 정동쪽으로 실려 갑니다 — 부표가 간 방향이지요." : "바람 방향을 돌려 가며 순 수송이 어떻게 따라 도는지 보세요.");
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

    function draw() {
      paper(ctx, W, H);
      var vv = speed(h);
      text(ctx, "쌓인 물이 만든 언덕과 지형류", 60, 34, { s: 14, w: "900" });

      /* 단면 */
      var x0 = 90, x1 = 620, base = 210, rise = clamp(h * 0.55, 6, 84);
      ctx.strokeStyle = v("--brand"); ctx.lineWidth = 3; ctx.beginPath();
      for (var k = 0; k <= 100; k++) {
        var u = k / 100, x = x0 + u * (x1 - x0), y = base - rise * u;
        if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.fillStyle = v("--brand"); ctx.globalAlpha = 0.16;
      ctx.beginPath(); ctx.moveTo(x0, base); ctx.lineTo(x0, base);
      for (var k2 = 0; k2 <= 100; k2++) { var u2 = k2 / 100; ctx.lineTo(x0 + u2 * (x1 - x0), base - rise * u2); }
      ctx.lineTo(x1, base + 90); ctx.lineTo(x0, base + 90); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
      text(ctx, "해수면", x0, base + 24, { s: 11.5, c: v("--mist") });
      text(ctx, "← 100 km →", (x0 + x1) / 2, base + 62, { s: 11.5, a: "center", c: v("--mist") });
      text(ctx, "높이 차 " + h + " cm", x1 - 10, base - rise - 14, { s: 12.5, a: "right", w: "800", c: v("--brand-700") });

      /* 힘 벡터 */
      var px = 380, py = 120;
      ctx.strokeStyle = v("--coral"); ctx.fillStyle = v("--coral"); ctx.lineWidth = 4;
      window.drawArrow(ctx, px, py, px - 70, py, 11);
      text(ctx, "압력 경도력 (높은 쪽 → 낮은 쪽)", px - 76, py - 12, { s: 11.5, a: "right", w: "800", c: v("--coral-700") });
      ctx.strokeStyle = v("--violet"); ctx.fillStyle = v("--violet");
      window.drawArrow(ctx, px, py, px + 70, py, 11);
      text(ctx, "전향력", px + 78, py + 4, { s: 11.5, w: "800", c: v("--violet-700") });
      ctx.strokeStyle = v("--teal"); ctx.fillStyle = v("--teal"); ctx.lineWidth = 5;
      window.drawArrow(ctx, px, py + 34, px, py + 96, 12);
      text(ctx, "지형류 — 두 힘이 평형을 이루어 등수압선과 나란히 흐른다", px + 16, py + 112, { s: 12, w: "800", c: v("--teal-700") });

      /* 결과 */
      text(ctx, "지형류 = (g ÷ f) × 기울기", 660, 100, { s: 11.5, c: v("--mist") });
      text(ctx, vv.toFixed(2) + " m/s", 660, 142, { s: 26, w: "900", c: vv >= 1 ? v("--teal-700") : v("--ink") });
      text(ctx, vv >= 1 ? "✅ 서안 경계류 수준입니다" : "아직 느립니다", 660, 172, { s: 12.5, w: "800", c: vv >= 1 ? v("--teal-700") : v("--rose-700") });
      text(ctx, "위도 35°, g = 9.8 m/s²", 660, 200, { s: 11, c: v("--mist") });
      text(ctx, "경사가 커질수록 지형류가 빨라집니다. 실제 걸프 해류·쿠로시오는 1~2 m/s 로 흐릅니다.", 60, H - 18, { s: 11, c: v("--mist") });

      if (vv >= 1.0 && !GOT5.c) { GOT5.c = true; window.sthState("aEk", GOT5); mission5(); }
      $("a-geo-info").innerHTML = "에크만 수송이 순환 한가운데로 물을 밀어 넣으면 그 자리 해수면이 몇십 cm 볼록해집니다. 물은 흘러내리려 하지만(<b>압력 경도력</b>) 움직이는 순간 <b>전향력</b>에 휘어, 결국 경사면을 따라 내려가지 못하고 <b>등수압선과 나란히</b> 돕니다.";
    }
    canvas._redraw = draw;
    $("a-slope").addEventListener("input", function (e) { h = +e.target.value; $("a-slope-val").textContent = h + " cm"; draw(); });
    draw(); mission5();
  })();

  function finish() { window.sthState("r1", "해결 · 에크만 수송은 바람의 직각(북반구 오른쪽 90°), 정점 ㄷ 동해 고유수가 σt 27.34 로 가장 무겁다"); }
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

    function draw() {
      paper(ctx, W, H);
      var sig = sigmaT(T, S), z = settle(sig);
      text(ctx, "이 물덩어리는 어디까지 가라앉을까", 60, 34, { s: 14, w: "900" });

      /* 왼쪽: 밀도 눈금 */
      var gx0 = 90, gx1 = 400, gy = 150;
      ctx.strokeStyle = v("--line"); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(gx0, gy); ctx.lineTo(gx1, gy); ctx.stroke();
      function X(s2) { return gx0 + (s2 - 24) / 4.5 * (gx1 - gx0); }
      for (var g = 24; g <= 28; g += 1) {
        ctx.beginPath(); ctx.moveTo(X(g), gy); ctx.lineTo(X(g), gy + 6); ctx.stroke();
        text(ctx, String(g), X(g), gy + 22, { s: 10.5, a: "center", c: v("--mist") });
      }
      text(ctx, "밀도 σt →", gx1, gy + 40, { s: 11, a: "right", c: v("--mist") });
      ctx.strokeStyle = v("--amber"); ctx.setLineDash([5, 5]); ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(X(LIMIT), gy - 44); ctx.lineTo(X(LIMIT), gy + 10); ctx.stroke(); ctx.setLineDash([]);
      text(ctx, "심층수의 기준 27.8", clamp(X(LIMIT), 140, 380), gy - 52, { s: 11.5, a: "center", w: "800", c: v("--amber-700") });
      ctx.fillStyle = v(sig >= LIMIT ? "--violet" : "--coral");
      ctx.beginPath(); ctx.arc(clamp(X(sig), gx0 - 6, gx1 + 6), gy, 9, 0, Math.PI * 2); ctx.fill();
      text(ctx, "내 물덩어리 σt " + sig.toFixed(2), gx0, 100, { s: 16, w: "900", c: sig >= LIMIT ? v("--violet-700") : v("--ink") });
      text(ctx, "수온 " + T.toFixed(1) + " ℃ · 염분 " + S.toFixed(1) + " psu", gx0, 74, { s: 12.5, c: v("--mist") });

      /* 오른쪽: 물기둥 */
      var cx0 = 470, cx1 = 860, cy0 = 70, cy1 = 380;
      function YZ(zz) { return cy0 + (zz / 4000) * (cy1 - cy0); }
      var grad = ctx.createLinearGradient(0, cy0, 0, cy1);
      grad.addColorStop(0, v("--brand-100")); grad.addColorStop(1, v("--card-2"));
      ctx.fillStyle = grad; ctx.fillRect(cx0, cy0, cx1 - cx0, cy1 - cy0);
      ctx.strokeStyle = v("--line"); ctx.lineWidth = 1.5; ctx.strokeRect(cx0, cy0, cx1 - cx0, cy1 - cy0);
      [0, 1000, 2000, 3000, 4000].forEach(function (zz) {
        ctx.strokeStyle = v("--line"); ctx.globalAlpha = 0.5;
        ctx.beginPath(); ctx.moveTo(cx0, YZ(zz)); ctx.lineTo(cx1, YZ(zz)); ctx.stroke(); ctx.globalAlpha = 1;
        text(ctx, zz + " m", cx0 - 8, YZ(zz) + 4, { s: 10.5, a: "right", c: v("--mist") });
      });
      text(ctx, "주변 바다", cx1 - 8, cy0 - 12, { s: 11.5, a: "right", w: "800", c: v("--mist") });
      ctx.fillStyle = v(sig >= LIMIT ? "--violet" : "--coral");
      ctx.beginPath(); ctx.arc(cx0 + 110, YZ(z), 14, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = v(sig >= LIMIT ? "--violet" : "--coral"); ctx.fillStyle = v(sig >= LIMIT ? "--violet" : "--coral"); ctx.lineWidth = 3;
      if (z > 20) window.drawArrow(ctx, cx0 + 110, cy0 + 10, cx0 + 110, YZ(z) - 20, 10);
      text(ctx, z >= 3900 ? "바닥까지 가라앉음" : (z < 60 ? "표층에 그대로 떠 있음" : "약 " + z + " m 에서 멈춤"),
        cx0 + 140, YZ(z) + 5, { s: 13.5, w: "900", c: sig >= LIMIT ? v("--violet-700") : v("--rose-700") });

      text(ctx, "가라앉는 깊이는 <주변 물과 밀도가 같아지는 곳>입니다", 470, H - 18, { s: 11, c: v("--mist") });
      text(ctx, "차가울수록, 짤수록 무거워집니다", 90, H - 18, { s: 11, c: v("--mist") });

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
    draw(); mission();
  })();

  /* ---- 장면3 컨베이어 벨트 속도 ---- */
  (function () {
    var canvas = $("b-c-belt"), ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var i0 = 45, t = 0;
    var got = window.sthState("bBelt") || { a: false, b: false };
    var LEN_CM = 4e9, SEC_YR = 3.1557e7;
    function vel(i) { return 0.1 * Math.pow(10, 0.0334 * i); }
    function years(vv) { return LEN_CM / vv / SEC_YR; }

    function draw() {
      paper(ctx, W, H);
      var vv = vel(i0), yr = years(vv);
      text(ctx, "전 지구 해양 컨베이어 벨트 (개념도)", 60, 34, { s: 14, w: "900" });

      var lx = 110, rx = 790, ty = 90, by = 260, r = 26;
      ctx.strokeStyle = v("--line"); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect(lx, ty, rx - lx, by - ty, r); ctx.stroke();
      /* 침강·용승 지점 */
      ctx.fillStyle = v("--violet");
      ctx.beginPath(); ctx.arc(lx, ty, 11, 0, Math.PI * 2); ctx.fill();
      text(ctx, "그린란드 앞바다 (침강)", lx + 4, ty - 18, { s: 11.5, w: "800", c: v("--violet-700") });
      ctx.fillStyle = v("--cold");
      ctx.beginPath(); ctx.arc(lx, by, 11, 0, Math.PI * 2); ctx.fill();
      text(ctx, "남극 웨델해 (침강)", lx + 4, by + 26, { s: 11.5, w: "800", c: v("--mist") });
      ctx.fillStyle = v("--coral");
      ctx.beginPath(); ctx.arc(rx, by, 11, 0, Math.PI * 2); ctx.fill();
      text(ctx, "인도양·태평양 (용승)", rx - 4, by + 26, { s: 11.5, a: "right", w: "800", c: v("--coral-700") });

      /* 벨트 위 점 */
      function pt(u) {
        var wTop = rx - lx, hSide = by - ty, per = 2 * wTop + 2 * hSide, d = u * per;
        if (d < wTop) return { x: lx + d, y: ty, warm: false };
        d -= wTop;
        if (d < hSide) return { x: rx, y: ty + d, warm: false };
        d -= hSide;
        if (d < wTop) return { x: rx - d, y: by, warm: true };
        d -= wTop;
        return { x: lx, y: by - d, warm: true };
      }
      for (var i = 0; i < 24; i++) {
        var p = pt((i / 24 + t * 0.006 * Math.min(vv, 40)) % 1);
        ctx.fillStyle = v(p.warm ? "--coral" : "--cold");
        ctx.beginPath(); ctx.arc(p.x, p.y, 5.5, 0, Math.PI * 2); ctx.fill();
      }
      text(ctx, "파랑 = 차가운 심층류 · 주황 = 따뜻한 표층 귀환류", (lx + rx) / 2, ty - 42, { s: 11.5, a: "center", c: v("--mist") });
      text(ctx, "벨트 전체 길이 약 40,000 km", (lx + rx) / 2, (ty + by) / 2 + 5, { s: 13, a: "center", w: "800", c: v("--mist") });

      /* 계산 */
      text(ctx, "유속 " + (vv < 1 ? vv.toFixed(2) : vv.toFixed(1)) + " cm/s", 110, 336, { s: 17, w: "900" });
      text(ctx, "→ 한 바퀴 " + (yr < 1 ? (yr * 12).toFixed(1) + " 개월" : (yr < 10 ? yr.toFixed(1) + " 년" : Math.round(yr).toLocaleString() + " 년")),
        360, 336, { s: 17, w: "900", c: v("--brand-700") });
      text(ctx, vv >= 100 ? "표층 해류 수준" : (vv <= 0.3 ? "심층 순환 수준" : ""), 680, 336, { s: 14, w: "900", c: v("--mist") });
      text(ctx, "걸리는 시간 = 길이 ÷ 유속.  40,000 km = 4,000,000,000 cm", 110, 368, { s: 12, c: v("--mist") });
      text(ctx, "표층 해류(걸프 해류)는 1초에 수 m, 심층류는 1초에 1 cm도 못 가는 곳이 많습니다.", 110, H - 18, { s: 11, c: v("--mist") });

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
    anim(canvas, function () { t += 1; draw(); });
  })();

  /* ---- 장면4 우리나라 주변 해류 ---- */
  (function () {
    var canvas = $("b-c-kor"), ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var warm = 50, show = { warm: true, cold: true, front: false };
    var got = window.sthState("bKor") || { a: false, b: false, c: false };
    function frontLat() { return 37.0 + 0.03 * warm; }

    /* 위도 33°~43° 를 세로로 편 모식 지도 */
    function YL(lat) { return 430 - (lat - 32) / 11 * 360; }

    var CUR = [
      { n: "쿠로시오 해류", type: "warm", x: 560, y1: 33.5, y2: 36.0, d: "우리나라 주변 난류의 근원. 저위도에서 고위도로 흐르는 강한 난류입니다." },
      { n: "대마 난류", type: "warm", x: 480, y1: 34.0, y2: 37.0, d: "쿠로시오에서 갈라져 대한해협을 지나 동해로 들어옵니다." },
      { n: "동한 난류", type: "warm", x: 430, y1: 36.0, y2: 40.0, d: "대마 난류의 일부가 동해안을 따라 북상합니다." },
      { n: "황해 난류", type: "warm", x: 250, y1: 34.0, y2: 38.5, d: "쿠로시오의 일부가 황해로 들어와 북상하는, 세력이 약한 난류입니다." },
      { n: "북한 한류", type: "cold", x: 455, y1: 42.0, y2: 37.5, d: "고위도에서 동해안을 따라 남하하여 동한 난류와 맞부딪칩니다." },
      { n: "리만 해류", type: "cold", x: 520, y1: 43.0, y2: 39.0, d: "연해주 방면에서 남하하는 한류로 동해 북부의 수온을 낮춥니다." }
    ];

    function draw() {
      paper(ctx, W, H);
      var fl = frontLat();
      text(ctx, "우리나라 주변 해류 (위도 모식도)", 60, 34, { s: 14, w: "900" });

      /* 위도 눈금 */
      for (var la = 34; la <= 42; la += 2) {
        ctx.strokeStyle = v("--line"); ctx.globalAlpha = 0.45;
        ctx.beginPath(); ctx.moveTo(150, YL(la)); ctx.lineTo(700, YL(la)); ctx.stroke(); ctx.globalAlpha = 1;
        text(ctx, "북위 " + la + "°", 142, YL(la) + 4, { s: 10.5, a: "right", c: v("--mist") });
      }
      /* 한반도 모식 */
      ctx.fillStyle = v("--card-2");
      ctx.beginPath();
      ctx.moveTo(330, YL(43)); ctx.lineTo(410, YL(42.4)); ctx.lineTo(400, YL(40)); ctx.lineTo(420, YL(38));
      ctx.lineTo(400, YL(36)); ctx.lineTo(370, YL(34.3)); ctx.lineTo(300, YL(34.6)); ctx.lineTo(285, YL(37));
      ctx.lineTo(300, YL(40)); ctx.lineTo(300, YL(43));
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = v("--line"); ctx.lineWidth = 2; ctx.stroke();
      text(ctx, "한반도", 350, YL(38.5), { s: 12.5, a: "center", w: "800", c: v("--mist") });
      text(ctx, "동해", 470, YL(41), { s: 12, a: "center", w: "800", c: v("--mist") });
      text(ctx, "황해", 230, YL(37), { s: 12, a: "center", w: "800", c: v("--mist") });

      /* 해류 */
      CUR.forEach(function (c) {
        if ((c.type === "warm" && !show.warm) || (c.type === "cold" && !show.cold)) return;
        var scale = c.type === "warm" ? (0.5 + warm / 100) : (1.5 - warm / 100);
        var y1 = YL(c.y1), y2 = YL(c.y1 + (c.y2 - c.y1) * clamp(scale, 0.45, 1.45));
        ctx.strokeStyle = v(c.type === "warm" ? "--coral" : "--cold");
        ctx.fillStyle = v(c.type === "warm" ? "--coral" : "--cold");
        ctx.lineWidth = 5;
        window.drawArrow(ctx, c.x, y1, c.x, y2, 12);
        text(ctx, c.n, clamp(c.x, 60, 700), y2 + (c.type === "warm" ? -14 : 20),
          { s: 11.5, a: "center", w: "800", c: v(c.type === "warm" ? "--coral-700" : "--cold") });
      });

      /* 조경수역 */
      if (show.front) {
        ctx.strokeStyle = v("--teal"); ctx.setLineDash([8, 5]); ctx.lineWidth = 3.5;
        ctx.beginPath(); ctx.moveTo(410, YL(fl)); ctx.lineTo(700, YL(fl)); ctx.stroke(); ctx.setLineDash([]);
        text(ctx, "조경수역 (북위 " + fl.toFixed(1) + "°)", 700, YL(fl) - 10, { s: 12.5, a: "right", w: "900", c: v("--teal-700") });
      }

      /* 오른쪽 판 */
      var px = 730;
      text(ctx, "동한 난류 세력", px, 90, { s: 12, w: "800", c: v("--mist") });
      text(ctx, warm + "%", px, 124, { s: 24, w: "900", c: v("--coral-700") });
      text(ctx, "조경수역", px, 170, { s: 12, w: "800", c: v("--mist") });
      text(ctx, "북위 " + fl.toFixed(1) + "°", px, 202, { s: 22, w: "900", c: v("--teal-700") });
      text(ctx, warm >= 70 ? "여름철 — 난류 우세" : (warm <= 30 ? "겨울철 — 한류 우세" : "봄·가을 수준"),
        px, 236, { s: 12, w: "800", c: v("--mist") });
      text(ctx, "난류와 한류가 만나면", px, 282, { s: 11.5, c: v("--mist") });
      text(ctx, "플랑크톤이 많아져", px, 302, { s: 11.5, c: v("--mist") });
      text(ctx, "좋은 어장이 섭니다", px, 322, { s: 11.5, c: v("--mist") });
      text(ctx, "조경수역 단추를 켜면 경계가 보입니다. 세력을 바꿔 남북으로 움직여 보세요.", 60, H - 18, { s: 11, c: v("--mist") });

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

    function draw() {
      paper(ctx, W, H);
      var off = offshore(), mode = off >= 0.5 ? "up" : (off <= -0.5 ? "down" : "none");
      text(ctx, "해안을 따라 부는 바람과 연안 용승·침강", 60, 34, { s: 14, w: "900" });

      /* 위에서 본 그림 (왼쪽) */
      var lx = 70, ly = 70, lw = 250, lh = 180;
      ctx.fillStyle = v("--card-2"); ctx.fillRect(lx, ly, 56, lh);
      ctx.strokeStyle = v("--line"); ctx.lineWidth = 2; ctx.strokeRect(lx, ly, lw, lh);
      text(ctx, "육지", lx + 28, ly + lh / 2, { s: 12, a: "center", w: "800", c: v("--mist") });
      text(ctx, "바다", lx + 170, ly + lh / 2, { s: 12, a: "center", w: "800", c: v("--mist") });
      text(ctx, "위에서 본 모습 (위쪽이 북)", lx, ly - 12, { s: 11.5, w: "800", c: v("--mist") });
      var wv = azVec(az), ev = azVec(ekAz()), mx = lx + 170, my = ly + lh / 2;
      ctx.strokeStyle = v("--amber"); ctx.fillStyle = v("--amber"); ctx.lineWidth = 4;
      window.drawArrow(ctx, mx, my, mx + wv.x * 52, my + wv.y * 52, 11);
      text(ctx, "바람", mx + wv.x * 68, my + wv.y * 68 + 4, { s: 11.5, a: "center", w: "800", c: v("--amber-700") });
      ctx.strokeStyle = v("--coral"); ctx.fillStyle = v("--coral");
      window.drawArrow(ctx, mx, my, mx + ev.x * 52, my + ev.y * 52, 11);
      text(ctx, "수송", clamp(mx + ev.x * 72, lx + 20, lx + lw - 10), my + ev.y * 72 + 4, { s: 11.5, a: "center", w: "800", c: v("--coral-700") });

      /* 단면 (오른쪽) */
      var sx0 = 380, sx1 = 870, sy0 = 70, sy1 = 300;
      ctx.fillStyle = v("--card-2"); ctx.fillRect(sx0, sy0, 60, sy1 - sy0);
      ctx.strokeStyle = v("--line"); ctx.lineWidth = 2; ctx.strokeRect(sx0, sy0, sx1 - sx0, sy1 - sy0);
      text(ctx, "해안 단면 (해안은 왼쪽)", sx0, sy0 - 12, { s: 11.5, w: "800", c: v("--mist") });
      text(ctx, "해안", sx0 + 30, sy0 + 20, { s: 11, a: "center", w: "800", c: v("--mist") });
      /* 표층 수송 화살표 */
      ctx.strokeStyle = v("--coral"); ctx.fillStyle = v("--coral"); ctx.lineWidth = 5;
      if (mode === "up") window.drawArrow(ctx, sx0 + 90, sy0 + 34, sx0 + 300, sy0 + 34, 13);
      else if (mode === "down") window.drawArrow(ctx, sx0 + 300, sy0 + 34, sx0 + 90, sy0 + 34, 13);
      else text(ctx, "표층 수송이 해안과 나란합니다 — 용승도 침강도 없습니다", sx0 + 90, sy0 + 38, { s: 12, w: "800", c: v("--mist") });
      if (mode !== "none") text(ctx, "표층 에크만 수송", sx0 + 196, sy0 + 20, { s: 11.5, a: "center", w: "800", c: v("--coral-700") });

      /* 연직 흐름 */
      if (mode !== "none") {
        ctx.strokeStyle = v(mode === "up" ? "--cold" : "--brand"); ctx.fillStyle = v(mode === "up" ? "--cold" : "--brand"); ctx.lineWidth = 4;
        for (var i = 0; i < 3; i++) {
          var xx = sx0 + 80 + i * 40;
          if (mode === "up") window.drawArrow(ctx, xx, sy1 - 20, xx, sy0 + 60, 10);
          else window.drawArrow(ctx, xx, sy0 + 60, xx, sy1 - 20, 10);
        }
        for (var j = 0; j < 8; j++) {
          var ph = ((t * 0.04) + j / 8) % 1;
          var py = mode === "up" ? sy1 - 20 - ph * (sy1 - sy0 - 80) : sy0 + 60 + ph * (sy1 - sy0 - 80);
          ctx.fillStyle = v(mode === "up" ? "--cold" : "--brand"); ctx.globalAlpha = 0.8;
          ctx.beginPath(); ctx.arc(sx0 + 210 + (j % 2) * 26, py, 5, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
        }
      }
      text(ctx, mode === "up" ? "찬 심층수 상승 — 연안 용승" : (mode === "down" ? "표층수 하강 — 연안 침강" : ""),
        sx0 + 260, sy1 + 26, { s: 15, a: "center", w: "900", c: v(mode === "up" ? "--cold" : "--brand-700") });

      text(ctx, "바람 " + azName(az) + "쪽 (" + az + "°) · " + (hemi === "N" ? "북반구" : "남반구") + " · 순 수송 " + azName(ekAz()) + "쪽",
        70, 340, { s: 13.5, w: "900" });
      text(ctx, mode === "up" ? "✅ 용승" : (mode === "down" ? "✅ 침강" : "— 어느 쪽도 아님"), 70, 372,
        { s: 15, w: "900", c: mode === "none" ? v("--mist") : v("--teal-700") });
      text(ctx, "여름 동해안에 며칠씩 남풍이 불면 표층수가 바다 쪽으로 밀려나며 찬물이 올라옵니다 — 냉수대입니다.", 70, H - 18, { s: 11, c: v("--mist") });

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
    anim(canvas, function () { t += 1; draw(); });
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

    function draw() {
      paper(ctx, W, H);
      var vv = speed(gap);
      var sense = (sys === "low") ? (hemi === "N" ? -1 : 1) : (hemi === "N" ? 1 : -1);
      var inward = sys === "low" ? 1 : -1;
      text(ctx, (hemi === "N" ? "북반구" : "남반구") + " " + (sys === "low" ? "저기압" : "고기압"), 60, 34, { s: 14, w: "900" });

      var cx = 320, cy = 230, step = clamp(gap * 0.05 + 18, 22, 48);
      for (var i = 1; i <= 4; i++) {
        ctx.strokeStyle = v("--line"); ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.arc(cx, cy, i * step, 0, Math.PI * 2); ctx.stroke();
        var pv = (sys === "low" ? 996 + i * 4 : 1028 - i * 4);
        if (i * step < 180) text(ctx, pv + "", cx + i * step + 6, cy - 4, { s: 10, c: v("--mist") });
      }
      ctx.fillStyle = v(sys === "low" ? "--brand" : "--coral");
      ctx.beginPath(); ctx.arc(cx, cy, 20, 0, Math.PI * 2); ctx.fill();
      text(ctx, sys === "low" ? "L" : "H", cx, cy + 8, { s: 22, a: "center", w: "900", c: v("--on-accent") });

      /* 바람 화살표 */
      for (var r = 1; r <= 3; r++) {
        var rr = r * step;
        if (rr > 190) break;
        var cnt = 6 + r * 2;
        for (var k = 0; k < cnt; k++) {
          var ang = (k / cnt) * Math.PI * 2 + sense * t * 0.05;
          var x = cx + Math.cos(ang) * rr, y = cy + Math.sin(ang) * rr;
          var tang = ang + sense * Math.PI / 2 - inward * sense * 0.4;
          ctx.save(); ctx.translate(x, y); ctx.rotate(tang);
          ctx.fillStyle = v("--teal");
          ctx.beginPath(); ctx.moveTo(9, 0); ctx.lineTo(-5, -4); ctx.lineTo(-5, 4); ctx.closePath(); ctx.fill();
          ctx.restore();
        }
      }

      /* 오른쪽 판 */
      var px = 570;
      text(ctx, "등압선 간격 (4 hPa 마다)", px, 86, { s: 12, w: "800", c: v("--mist") });
      text(ctx, gap.toLocaleString() + " km", px, 120, { s: 22, w: "900" });
      text(ctx, "지균풍 속도", px, 166, { s: 12, w: "800", c: v("--mist") });
      text(ctx, vv.toFixed(1) + " m/s", px, 202, { s: 30, w: "900", c: vv >= 20 ? v("--rose-700") : (vv <= 5 ? v("--teal-700") : v("--brand-700")) });
      text(ctx, vv >= 20 ? "매우 강한 바람" : (vv <= 5 ? "약한 바람" : "보통"), px, 232, { s: 13, w: "800", c: v("--mist") });
      text(ctx, "기압 경도력 = 기압 차 ÷ 거리", px, 274, { s: 11.5, c: v("--mist") });
      text(ctx, "지균풍 : 기압 경도력 = 전향력", px, 296, { s: 11.5, c: v("--mist") });
      text(ctx, "같은 4 hPa 라도 거리가 짧으면", px, 330, { s: 11.5, c: v("--mist") });
      text(ctx, "기압 경도력이 커져 바람이 셉니다", px, 350, { s: 11.5, c: v("--mist") });
      text(ctx, sys === "low" ? "저기압 : 바람이 모여들어 상승 기류 → 구름·비" : "고기압 : 바람이 퍼져 나가 하강 기류 → 맑음",
        60, 400, { s: 13.5, w: "900", c: v(sys === "low" ? "--brand-700" : "--coral-700") });
      text(ctx, "등압선이 촘촘한 곳이 곧 바람이 센 곳입니다. 일기도에서 가장 먼저 보는 것이지요.", 60, 430, { s: 11, c: v("--mist") });

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
        window.sthMission("m3-2", true, "<span class='m-tag'>미션 완료</span>등압선 간격 200 km 면 약 20 m/s, 800 km 면 약 5 m/s. <b>간격이 4배가 되면 바람은 4분의 1</b>이 됩니다.");
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
        "회전 방향이 반대입니다. 그것은 북반구 고기압의 모습이에요.",
        "저기압은 불어나가는 것이 아니라 <b>모여드는</b> 기압계입니다.",
        "마찰이 없는 상공이라면 거의 나란히 돌지만, 지상에서는 마찰 때문에 등압선을 가로질러 안쪽으로 들어갑니다."
      ],
      onDone: function () { got.c = true; window.sthState("cPress", got); mission(); }
    });
    draw(); mission();
    anim(canvas, function () { t += 1; draw(); });
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

    function draw() {
      paper(ctx, W, H);
      text(ctx, "온대 저기압이 지나가는 36시간 — 관측 지점의 기록", 60, 34, { s: 14, w: "900" });
      var x0 = 90, x1 = 700, y0 = 60, y1 = 300;
      function X(h) { return x0 + h / 36 * (x1 - x0); }
      function YT(c) { return y1 - (c - 0) / 24 * (y1 - y0) * 0.55 - 10; }
      function YP(p) { return y1 - (p - 998) / 20 * (y1 - y0) * 0.42 - 130; }
      axes(ctx, x0, y0, x1, y1);
      for (var h = 0; h <= 36; h += 6) {
        text(ctx, h + "h", X(h), y1 + 18, { s: 10.5, a: "center", c: v("--mist") });
        ctx.strokeStyle = v("--line"); ctx.globalAlpha = 0.35;
        ctx.beginPath(); ctx.moveTo(X(h), y0); ctx.lineTo(X(h), y1); ctx.stroke(); ctx.globalAlpha = 1;
      }
      text(ctx, "시간 →", x1, y1 + 36, { s: 11, a: "right", c: v("--mist") });

      /* 전선 위치 */
      [[WARM_AT, "온난 전선 통과", "--coral"], [COLD_AT, "한랭 전선 통과", "--brand"]].forEach(function (f) {
        ctx.strokeStyle = v(f[2]); ctx.setLineDash([6, 5]); ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(X(f[0]), y0); ctx.lineTo(X(f[0]), y1); ctx.stroke(); ctx.setLineDash([]);
        text(ctx, f[1], clamp(X(f[0]), x0 + 50, x1 - 50), y0 - 10, { s: 11.5, a: "center", w: "800", c: v(f[2] + "-700") });
      });

      /* 곡선 */
      ctx.strokeStyle = v("--coral"); ctx.lineWidth = 3; ctx.beginPath();
      for (var k = 0; k <= 180; k++) {
        var hh = k / 180 * 36, x = X(hh), y = YT(tempAt(hh));
        if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      text(ctx, "기온", x0 + 8, YT(tempAt(1)) - 12, { s: 11.5, w: "800", c: v("--coral-700") });
      ctx.strokeStyle = v("--violet"); ctx.lineWidth = 3; ctx.beginPath();
      for (var k2 = 0; k2 <= 180; k2++) {
        var h2 = k2 / 180 * 36, x2 = X(h2), y2 = YP(presAt(h2));
        if (k2 === 0) ctx.moveTo(x2, y2); else ctx.lineTo(x2, y2);
      }
      ctx.stroke();
      text(ctx, "기압", x0 + 8, YP(presAt(1)) - 12, { s: 11.5, w: "800", c: v("--violet-700") });

      /* 현재 시각 */
      ctx.strokeStyle = v("--amber"); ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(X(tt), y0); ctx.lineTo(X(tt), y1); ctx.stroke();
      ctx.fillStyle = v("--amber");
      ctx.beginPath(); ctx.arc(X(tt), YT(tempAt(tt)), 7, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(X(tt), YP(presAt(tt)), 7, 0, Math.PI * 2); ctx.fill();

      /* 오른쪽 판 */
      var px = 730;
      text(ctx, tt.toFixed(1) + " 시간째", px, 86, { s: 18, w: "900" });
      text(ctx, "기온 " + tempAt(tt).toFixed(1) + " ℃", px, 122, { s: 14, w: "900", c: v("--coral-700") });
      text(ctx, "기압 " + presAt(tt).toFixed(1) + " hPa", px, 150, { s: 14, w: "900", c: v("--violet-700") });
      text(ctx, "바람 " + windAt(tt), px, 178, { s: 14, w: "900", c: v("--brand-700") });
      text(ctx, zoneAt(tt), px, 212, { s: 11.5, c: v("--mist") });
      text(ctx, rainShort(tt), px, 234, { s: 11.5, c: v("--mist") });
      text(ctx, "기온은 온난 전선이 지날 때 오르고, 한랭 전선이 지날 때 급히 떨어집니다.", 90, 350, { s: 12.5, c: v("--mist") });
      text(ctx, "기압은 저기압 중심이 가까워질수록 내려가고, 전선이 지나간 뒤 다시 오릅니다.", 90, 374, { s: 12.5, c: v("--mist") });
      text(ctx, "바람은 남동풍 → 남서풍 → 북서풍으로, 시계 방향으로 바뀝니다.", 90, 398, { s: 12.5, c: v("--mist") });
      text(ctx, "관측 지점은 저기압 중심의 남쪽을 지나고 있습니다.", 90, H - 18, { s: 11, c: v("--mist") });

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
  })();

  /* ---- 장면4 일기도 이동 속도 ---- */
  (function () {
    var canvas = $("c-c-map"), ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var spd = 0;
    var got = window.sthState("cMap") || { a: false, b: false };
    var POS = [-2400, -1440, -480];        /* 관측 지점 기준 km (음수 = 서쪽) */

    function draw() {
      paper(ctx, W, H);
      var d4 = POS[2] + 24 * spd;
      text(ctx, "일기도 세 장과 내가 그린 네 번째 장", 60, 34, { s: 14, w: "900" });

      var bw = 185, bh = 140, gapx = 16, x0 = 60, y0 = 62;
      function box(i, label, cxkm, dashed) {
        var bx = x0 + i * (bw + gapx);
        ctx.strokeStyle = v("--line"); ctx.lineWidth = 2;
        if (dashed) ctx.setLineDash([6, 5]);
        ctx.fillStyle = v("--card-2");
        ctx.beginPath(); ctx.roundRect(bx, y0, bw, bh, 12); ctx.fill(); ctx.stroke();
        ctx.setLineDash([]);
        text(ctx, label, bx + 10, y0 - 8, { s: 11.5, w: "800", c: v("--mist") });
        /* 관측 지점 */
        var ox = bx + bw * 0.72, oy = y0 + bh * 0.5;
        ctx.fillStyle = v("--ink");
        ctx.beginPath(); ctx.arc(ox, oy, 5, 0, Math.PI * 2); ctx.fill();
        text(ctx, "관측 지점", ox, oy + 22, { s: 10, a: "center", c: v("--mist") });
        /* 저기압 중심 */
        var lx = clamp(ox + cxkm / 3000 * bw * 1.6, bx + 16, bx + bw - 16);
        ctx.fillStyle = v("--brand");
        ctx.beginPath(); ctx.arc(lx, oy, 13, 0, Math.PI * 2); ctx.fill();
        text(ctx, "L", lx, oy + 5, { s: 14, a: "center", w: "900", c: v("--on-accent") });
        text(ctx, (cxkm < 0 ? "서쪽 " + Math.abs(Math.round(cxkm)) : "동쪽 " + Math.round(cxkm)) + " km",
          bx + bw / 2, y0 + bh - 12, { s: 10.5, a: "center", c: v("--mist") });
      }
      box(0, "1일차 (어제)", POS[0], false);
      box(1, "2일차 (오늘)", POS[1], false);
      box(2, "3일차 (내일)", POS[2], false);
      box(3, "4일차 (모레) · 예상", d4, true);

      /* 계산 판 */
      var my = 255;
      text(ctx, "하루 사이에 옮겨 간 거리", 60, my, { s: 12.5, w: "800", c: v("--mist") });
      text(ctx, "1 → 2 일차 : " + (POS[1] - POS[0]) + " km", 60, my + 26, { s: 13, c: v("--mist") });
      text(ctx, "2 → 3 일차 : " + (POS[2] - POS[1]) + " km", 60, my + 50, { s: 13, c: v("--mist") });
      text(ctx, "하루는 24시간입니다", 60, my + 74, { s: 12, c: v("--mist") });

      var ok = Math.abs(spd - 40) <= 2;
      text(ctx, "내가 읽은 속도 " + spd + " km/h", 360, my + 4, { s: 17, w: "900", c: ok ? v("--teal-700") : v("--ink") });
      text(ctx, ok ? "✅ 맞습니다" : (spd > 40 ? "너무 빠릅니다" : "아직 느립니다"), 360, my + 34, { s: 15, w: "900", c: ok ? v("--teal-700") : v("--rose-700") });
      text(ctx, "→ 4일차 중심은 관측 지점 " + (d4 >= 0 ? "동쪽 " + Math.round(d4) : "서쪽 " + Math.abs(Math.round(d4))) + " km",
        360, my + 64, { s: 14, w: "900", c: v("--brand-700") });
      text(ctx, ok ? "저기압 중심이 이미 지나갔습니다. 한랭 전선 뒤에 들어갑니다." : "속도를 맞히면 4일차 자리가 정확해집니다.",
        360, my + 92, { s: 12.5, c: v("--mist") });
      text(ctx, "우리나라는 편서풍대에 있어 기압계가 서 → 동으로 이동합니다.", 60, H - 18, { s: 11, c: v("--mist") });

      if (ok && !got.a) { got.a = true; window.sthState("cMap", got); mission(); }
      $("c-map-info").innerHTML = "일기도 한 장은 사진이지만, <b>여러 장을 나란히 놓으면 영화</b>가 됩니다. 기압계가 하루에 얼마나 움직였는지 재면 다음 장면을 그릴 수 있습니다." +
        (ok ? " — 하루 <b>960 km</b>, 시속 <b>40 km</b> 입니다." : "");
    }
    function mission() {
      if (got.a) done("m3-4a"); if (got.b) done("m3-4b");
      if (got.a && got.b) {
        window.sthMission("m3-4", true, "<span class='m-tag'>미션 완료</span>시속 40 km 로 동진하면 모레 저기압 중심은 관측 지점 <b>동쪽 480 km</b>. 한랭 전선이 지난 뒤라 <b>북서풍이 불고 기온이 떨어지며 하늘이 갭니다.</b>");
        ep.clear(3); ep.clear(4);
      }
    }
    canvas._redraw = draw;
    $("c-spd").addEventListener("input", function (e) { spd = +e.target.value; $("c-spd-val").textContent = spd + " km/h"; draw(); });
    window.sthPick({
      mount: "c-q2",
      q: "저기압 중심이 모레 관측 지점의 동쪽 480 km 에 있다면, 모레 낮 관측 지점의 날씨로 가장 알맞은 것은?",
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
        "중심이 480 km 나 동쪽으로 지나갔습니다. 바로 위가 아닙니다.",
        "저기압이 막 지나간 직후라 고기압 한가운데라고 보기는 어렵고, 바람도 남서풍이 아니라 북서풍입니다."
      ],
      onDone: function () { got.b = true; window.sthState("cMap", got); mission(); }
    });
    draw(); mission();
  })();

  function finish() { window.sthState("r3", "해결 · 기압계는 시속 40 km 로 동진, 모레는 한랭 전선 뒤 — 북서풍에 기온 하강, 맑음"); }
  function vsC() {
    var p = window.sthState("c-p") || "";
    $("c-vs").innerHTML = "<b>나의 첫 추리</b> " + (p || "기록 없음") + "<br>" +
      (p.indexOf("㉡") === 0 ? "정확했습니다. 편서풍대라 기압계가 서에서 동으로 갑니다. 일기도 세 장이 그것을 그대로 보여 주었지요."
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

    function draw() {
      paper(ctx, W, H);
      var p = corePress(), grows = (place === "sea" && sst >= SST_MIN);
      text(ctx, "태풍의 발생·발달·소멸", 60, 34, { s: 14, w: "900" });

      /* 바다·육지 */
      var bx = 70, by = 80, bw = 420, bh = 240;
      ctx.fillStyle = v(place === "land" ? "--card-2" : "--brand-100");
      ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 14); ctx.fill();
      ctx.strokeStyle = v("--line"); ctx.lineWidth = 2; ctx.stroke();
      text(ctx, place === "land" ? "육지 위" : "열대 바다 위", bx + 12, by - 10, { s: 11.5, w: "800", c: v("--mist") });

      /* 수증기 기둥 */
      var n = grows ? clamp(Math.round((sst - 26) * 2) + 2, 2, 12) : 1;
      for (var i = 0; i < n; i++) {
        var xx = bx + 40 + (i % 6) * 62, yy = by + bh - 24 - Math.floor(i / 6) * 22;
        ctx.strokeStyle = v("--teal"); ctx.fillStyle = v("--teal"); ctx.lineWidth = 3;
        window.drawArrow(ctx, xx, yy, xx, yy - (grows ? 70 : 24), 8);
      }
      text(ctx, grows ? "수증기가 활발히 올라간다" : (place === "land" ? "수증기 공급이 끊겼다" : "바다가 차가워 수증기가 부족하다"),
        bx + bw / 2, by + 34, { s: 13, a: "center", w: "900", c: grows ? v("--teal-700") : v("--rose-700") });

      /* 소용돌이 */
      var cx = 660, cy = 190, R = grows ? clamp(30 + (sst - 26) * 14, 30, 118) : 26;
      ctx.strokeStyle = v(grows ? "--violet" : "--mist"); ctx.lineWidth = 6; ctx.globalAlpha = 0.6;
      for (var k = 0; k < 4; k++) {
        ctx.beginPath();
        for (var s2 = 0; s2 <= 30; s2++) {
          var fr = s2 / 30, rr = R * 0.25 + fr * R * 0.75, ang = k * Math.PI / 2 - fr * 2.6;
          var x = cx + Math.cos(ang) * rr, y = cy + Math.sin(ang) * rr;
          if (s2 === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      text(ctx, "중심 기압", 660, 330, { s: 12, a: "center", w: "800", c: v("--mist") });
      text(ctx, p.toFixed(0) + " hPa", 660, 366, { s: 28, a: "center", w: "900", c: p <= 940 ? v("--rose-700") : (grows ? v("--violet-700") : v("--mist")) });
      text(ctx, grows ? (p <= 940 ? "매우 강한 태풍" : (p <= 980 ? "발달 중" : "약한 열대 저압부")) : (place === "land" ? "세력이 빠르게 약해짐" : "태풍으로 발달하지 못함"),
        660, 396, { s: 13, a: "center", w: "900", c: v("--mist") });
      text(ctx, "태풍은 해수면 수온 약 26.5 ℃ 이상인 열대 바다에서만 태어납니다.", 70, 356, { s: 12, c: v("--mist") });
      text(ctx, "찬 바다나 육지를 만나면 수증기 공급이 끊겨 세력을 잃습니다.", 70, 380, { s: 12, c: v("--mist") });
      text(ctx, "잠열 — 수증기가 물방울로 바뀌며 내놓는 열이 태풍의 에너지원입니다.", 70, H - 18, { s: 11, c: v("--mist") });

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
  })();

  /* ---- 장면3 태풍 단면 ---- */
  (function () {
    var canvas = $("d-c-cross"), ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var r = 100, t = 0;
    var got = window.sthState("dCross") || { a: false, b: false, c: false };
    var PC = 954, DP = 56, RM = 45, VMAX = 50;

    function pres(rr) { return rr < 1 ? PC : PC + DP * Math.exp(-RM / rr); }
    function wind(rr) { return rr <= RM ? VMAX * (rr / RM) : VMAX * Math.sqrt(RM / rr); }
    function zone(rr) {
      if (rr < 25) return "태풍의 눈";
      if (rr < 70) return "눈벽구름";
      if (rr < 250) return "나선 강우대";
      return "태풍 바깥 영역";
    }

    function draw() {
      paper(ctx, W, H);
      var p = pres(r), vv = wind(r);
      text(ctx, "2003년 태풍 매미 — 중심에서 멀어지며 재 보기", 60, 34, { s: 14, w: "900" });

      /* 왼쪽 평면도 */
      var cx = 220, cy = 210, SC = 0.42;     /* km → px */
      for (var k = 0; k < 5; k++) {
        ctx.strokeStyle = v("--brand"); ctx.globalAlpha = 0.35; ctx.lineWidth = 9;
        ctx.beginPath();
        for (var s2 = 0; s2 <= 40; s2++) {
          var fr = s2 / 40, rr = 45 + fr * 340, ang = t * 0.05 + k * (Math.PI * 2 / 5) - fr * 3.2;
          var x = cx + Math.cos(ang) * rr * SC, y = cy + Math.sin(ang) * rr * SC;
          if (s2 === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke(); ctx.globalAlpha = 1;
      }
      ctx.strokeStyle = v("--coral"); ctx.lineWidth = 7;
      ctx.beginPath(); ctx.arc(cx, cy, RM * SC, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = v("--panel");
      ctx.beginPath(); ctx.arc(cx, cy, 25 * SC, 0, Math.PI * 2); ctx.fill();
      text(ctx, "눈", cx, cy + 4, { s: 11, a: "center", w: "900", c: v("--mist") });
      ctx.strokeStyle = v("--amber"); ctx.setLineDash([5, 4]); ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(cx, cy, Math.max(r * SC, 3), 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
      text(ctx, "지금 보는 거리", cx, cy + 190, { s: 11.5, a: "center", w: "800", c: v("--amber-700") });

      /* 오른쪽 그래프 */
      var x0 = 470, x1 = 860, y0 = 70, y1 = 300;
      function X(rr) { return x0 + rr / 400 * (x1 - x0); }
      function YV(ww) { return y1 - ww / 55 * (y1 - y0); }
      function YP(pp) { return y1 - (pp - 950) / 62 * (y1 - y0); }
      axes(ctx, x0, y0, x1, y1);
      for (var q = 0; q <= 400; q += 100) text(ctx, q + "", X(q), y1 + 18, { s: 10.5, a: "center", c: v("--mist") });
      text(ctx, "중심에서의 거리(km) →", x1, y1 + 36, { s: 11, a: "right", c: v("--mist") });
      ctx.strokeStyle = v("--rose"); ctx.lineWidth = 3; ctx.beginPath();
      for (var k2 = 0; k2 <= 200; k2++) {
        var rr2 = k2 * 2, x2 = X(rr2), y2 = YV(wind(rr2));
        if (k2 === 0) ctx.moveTo(x2, y2); else ctx.lineTo(x2, y2);
      }
      ctx.stroke();
      text(ctx, "풍속", X(60), YV(52) - 6, { s: 11.5, w: "800", c: v("--rose-700") });
      ctx.strokeStyle = v("--violet"); ctx.lineWidth = 3; ctx.beginPath();
      for (var k3 = 0; k3 <= 200; k3++) {
        var rr3 = k3 * 2, x3 = X(rr3), y3 = YP(pres(rr3));
        if (k3 === 0) ctx.moveTo(x3, y3); else ctx.lineTo(x3, y3);
      }
      ctx.stroke();
      text(ctx, "기압", X(300), YP(pres(300)) - 10, { s: 11.5, w: "800", c: v("--violet-700") });
      ctx.strokeStyle = v("--amber"); ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(X(r), y0); ctx.lineTo(X(r), y1); ctx.stroke();
      ctx.fillStyle = v("--amber");
      ctx.beginPath(); ctx.arc(X(r), YV(vv), 7, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(X(r), YP(p), 7, 0, Math.PI * 2); ctx.fill();

      text(ctx, "거리 " + r + " km", 70, 352, { s: 16, w: "900" });
      text(ctx, zone(r), 250, 352, { s: 16, w: "900", c: v("--coral-700") });
      text(ctx, "풍속 " + vv.toFixed(1) + " m/s", 470, 352, { s: 16, w: "900", c: v("--rose-700") });
      text(ctx, "기압 " + p.toFixed(1) + " hPa", 680, 352, { s: 16, w: "900", c: v("--violet-700") });
      text(ctx, zone(r) === "태풍의 눈" ? "하강 기류 — 바람이 약하고 하늘이 갠다" :
        (zone(r) === "눈벽구름" ? "가장 강한 상승 기류 — 최대 풍속과 폭우" :
          (zone(r) === "나선 강우대" ? "돌풍성 비바람이 띠를 이루며 지나간다" : "구름이 많고 바람이 조금 강한 정도")),
        70, 386, { s: 13, w: "800", c: v("--mist") });
      text(ctx, "상륙할 때 매미의 중심 기압은 954 hPa 이었습니다. 그날 제주에서는 최대 순간 풍속 60.0 m/s 가 기록되었습니다.", 70, H - 18, { s: 11, c: v("--mist") });

      var ch = false;
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
    anim(canvas, function () { t += 1; draw(); });
  })();

  /* ---- 장면4 위험 반원 ---- */
  (function () {
    var canvas = $("d-c-half"), ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var side = "R", vm = 0;
    var got = window.sthState("dHalf") || { a: false, b: false, c: false };
    var VROT = 40;

    function vAt(sd) { return sd === "R" ? VROT + vm : Math.max(0, VROT - vm); }

    function draw() {
      paper(ctx, W, H);
      var vR = vAt("R"), vL = vAt("L"), vv = vAt(side);
      text(ctx, "태풍은 돌면서 동시에 움직인다 — 위험 반원", 60, 34, { s: 14, w: "900" });

      /* 평면도 : 태풍은 화면 위쪽(북동)으로 이동 */
      var cx = 300, cy = 230, R = 120;
      ctx.strokeStyle = v("--line"); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = v("--brand"); ctx.globalAlpha = 0.14;
      ctx.beginPath(); ctx.arc(cx, cy, R, -Math.PI / 2, Math.PI / 2); ctx.fill();
      ctx.fillStyle = v("--teal"); ctx.globalAlpha = 0.14;
      ctx.beginPath(); ctx.arc(cx, cy, R, Math.PI / 2, Math.PI * 1.5); ctx.fill(); ctx.globalAlpha = 1;
      /* 회전 바람 (반시계) */
      for (var k = 0; k < 10; k++) {
        var ang = k / 10 * Math.PI * 2;
        var x = cx + Math.cos(ang) * R * 0.72, y = cy + Math.sin(ang) * R * 0.72;
        ctx.save(); ctx.translate(x, y); ctx.rotate(ang - Math.PI / 2);
        ctx.fillStyle = v("--violet");
        ctx.beginPath(); ctx.moveTo(9, 0); ctx.lineTo(-5, -4); ctx.lineTo(-5, 4); ctx.closePath(); ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = v("--coral");
      ctx.beginPath(); ctx.arc(cx, cy, 16, 0, Math.PI * 2); ctx.fill();
      /* 이동 방향 */
      ctx.strokeStyle = v("--amber"); ctx.fillStyle = v("--amber"); ctx.lineWidth = 5;
      window.drawArrow(ctx, cx, cy, cx, cy - R - 40, 13);
      text(ctx, "태풍의 진행 방향", cx, cy - R - 52, { s: 12, a: "center", w: "900", c: v("--amber-700") });
      text(ctx, "위험 반원", cx + R + 14, cy - 10, { s: 12, w: "900", c: v("--brand-700") });
      text(ctx, "가항 반원", cx - R - 14, cy - 10, { s: 12, a: "right", w: "900", c: v("--teal-700") });
      /* 관측 도시 */
      var ox = cx + (side === "R" ? 1 : -1) * R * 0.95;
      ctx.fillStyle = v("--ink");
      ctx.beginPath(); ctx.arc(ox, cy + 40, 7, 0, Math.PI * 2); ctx.fill();
      text(ctx, "관측 도시", ox, cy + 64, { s: 11, a: "center", w: "800", c: v("--ink") });

      /* 계산 막대 */
      var px = 520, bw = 260;
      text(ctx, "회전 바람 " + VROT + " m/s + 이동 속도 " + vm.toFixed(1) + " m/s", px, 90, { s: 12.5, w: "800", c: v("--mist") });
      [["오른쪽 (위험 반원)", vR, "--brand"], ["왼쪽 (가항 반원)", vL, "--teal"]].forEach(function (b, i) {
        var yy = 130 + i * 84;
        text(ctx, b[0], px, yy, { s: 12.5, w: "800", c: v(b[2] + "-700") });
        ctx.fillStyle = v("--card-2"); ctx.fillRect(px, yy + 10, bw, 22);
        ctx.fillStyle = v(b[2]); ctx.fillRect(px, yy + 10, bw * clamp(b[1] / 60, 0, 1), 22);
        text(ctx, b[1].toFixed(1) + " m/s", px + bw + 8, yy + 27, { s: 14, w: "900", c: v(b[2] + "-700") });
      });
      text(ctx, "두 반원의 차이 " + (vR - vL).toFixed(1) + " m/s", px, 316, { s: 15, w: "900", c: v("--rose-700") });
      text(ctx, "내가 고른 자리의 풍속 " + vv.toFixed(1) + " m/s", px, 348, { s: 15, w: "900" });
      text(ctx, "북반구 태풍의 바람은 반시계 방향입니다. 오른쪽에서는 회전 바람과 이동 방향이 같은 쪽을 향해 더해집니다.", 70, 400, { s: 12, c: v("--mist") });
      text(ctx, "매미는 남해안에 상륙한 뒤 북동쪽으로 달렸습니다. 진로의 동쪽 도시들이 위험 반원에 들었습니다.", 70, H - 18, { s: 11, c: v("--mist") });

      var ch = false;
      if (side === "R" && vR >= 55 && !got.a) { got.a = ch = true; }
      if (side === "L" && vL <= 28 && !got.b) { got.b = ch = true; }
      if (ch) { window.sthState("dHalf", got); mission(); }

      $("d-half-info").innerHTML = "태풍의 바람은 <b>회전</b>과 <b>이동</b>이 겹쳐진 것입니다. 진행 방향 오른쪽에서는 두 속도가 <b>더해지고</b>, 왼쪽에서는 <b>빼집니다</b>. 그래서 같은 거리라도 오른쪽이 훨씬 셉니다. 이동 속도가 빠른 태풍일수록 좌우 차이가 커집니다.";
    }
    function mission() {
      if (got.a) done("m4-4a"); if (got.b) done("m4-4b"); if (got.c) done("m4-4c");
      if (got.a && got.b && got.c) {
        window.sthMission("m4-4", true, "<span class='m-tag'>미션 완료</span>이동 속도 15 m/s 면 오른쪽은 55 m/s, 왼쪽은 25 m/s. 같은 태풍인데 <b>두 배 넘게</b> 차이가 납니다.");
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

    function draw() {
      paper(ctx, W, H);
      text(ctx, "뇌우의 한살이 — " + NAMES[stage], 60, 34, { s: 14, w: "900" });
      var ground = H - 90, cx = 430;
      ctx.strokeStyle = v("--line"); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(60, ground); ctx.lineTo(840, ground); ctx.stroke();

      var top = stage === 1 ? 70 : (stage === 0 ? 170 : 120);
      var puffs = stage === 1
        ? [[cx, top + 120, 84], [cx - 68, top + 168, 64], [cx + 68, top + 168, 64], [cx, top + 52, 56], [cx, top + 6, 38]]
        : (stage === 0
          ? [[cx, top + 78, 64], [cx - 38, top + 112, 50], [cx + 38, top + 112, 50]]
          : [[cx, top + 118, 56], [cx - 56, top + 138, 42], [cx + 56, top + 138, 42]]);
      ctx.fillStyle = v("--card-2"); ctx.strokeStyle = v("--mist"); ctx.lineWidth = 1.5;
      puffs.forEach(function (p) { ctx.beginPath(); ctx.arc(p[0], p[1], p[2], 0, Math.PI * 2); ctx.fill(); ctx.stroke(); });

      if (stage === 0) {
        ctx.strokeStyle = v("--coral"); ctx.fillStyle = v("--coral"); ctx.lineWidth = 4;
        window.drawArrow(ctx, cx - 24, ground - 10, cx - 24, top + 130, 10);
        window.drawArrow(ctx, cx + 24, ground - 10, cx + 24, top + 130, 10);
        text(ctx, "상승 기류만 있다", cx, ground + 26, { s: 12.5, a: "center", w: "800", c: v("--coral-700") });
      } else if (stage === 1) {
        ctx.strokeStyle = v("--coral"); ctx.fillStyle = v("--coral"); ctx.lineWidth = 4;
        window.drawArrow(ctx, cx - 64, ground - 10, cx - 64, top + 110, 10);
        ctx.strokeStyle = v("--brand"); ctx.fillStyle = v("--brand");
        window.drawArrow(ctx, cx + 74, top + 120, cx + 74, ground - 10, 10);
        text(ctx, "상승 기류", cx - 64, ground + 26, { s: 12.5, a: "center", w: "800", c: v("--coral-700") });
        text(ctx, "하강 기류 + 강수", cx + 74, ground + 26, { s: 12.5, a: "center", w: "800", c: v("--brand-700") });
        ctx.strokeStyle = v("--brand"); ctx.lineWidth = 2; ctx.globalAlpha = 0.65;
        for (var i = 0; i < 16; i++) {
          var rx = cx + 24 + (i % 8) * 13, ry = top + 200 + (i % 4) * 22;
          ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx - 4, ry + 13); ctx.stroke();
        }
        ctx.globalAlpha = 1;
      } else {
        ctx.strokeStyle = v("--brand"); ctx.fillStyle = v("--brand"); ctx.lineWidth = 4;
        window.drawArrow(ctx, cx, top + 150, cx, ground - 10, 10);
        text(ctx, "하강 기류만 남고 비가 약해진다", cx, ground + 26, { s: 12.5, a: "center", w: "800", c: v("--brand-700") });
      }
      text(ctx, "뇌우가 한곳에 오래 머물거나 잇따라 지나가면 집중 호우가 됩니다.", 60, H - 18, { s: 11, c: v("--mist") });

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
  })();

  (function () {
    var canvas = $("d-c-snow"), ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var air = -5, sea = 6;

    function draw() {
      paper(ctx, W, H);
      var dT = sea - air, strong = dT >= 15, weak = dT <= 10;
      text(ctx, "겨울 서해안 폭설 — 찬 공기가 따뜻한 바다를 건널 때", 60, 34, { s: 14, w: "900" });

      var seaY = 260, x0 = 70, x1 = 620;
      ctx.fillStyle = v("--brand"); ctx.globalAlpha = 0.25;
      ctx.fillRect(x0, seaY, x1 - x0, 60); ctx.globalAlpha = 1;
      ctx.strokeStyle = v("--line"); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x0, seaY); ctx.lineTo(x1, seaY); ctx.stroke();
      text(ctx, "서해 (수온 " + sea.toFixed(1) + " ℃)", x0 + 8, seaY + 38, { s: 12, w: "800", c: v("--brand-700") });
      ctx.fillStyle = v("--card-2"); ctx.fillRect(x1, seaY - 26, 120, 86);
      text(ctx, "서해안", x1 + 60, seaY + 38, { s: 12, a: "center", w: "800", c: v("--mist") });

      /* 찬 공기 */
      ctx.strokeStyle = v("--cold"); ctx.fillStyle = v("--cold"); ctx.lineWidth = 3;
      window.drawArrow(ctx, x0 - 10, 90, x0 + 130, 90, 11);
      text(ctx, "시베리아 찬 공기 (" + air + " ℃)", x0 + 140, 94, { s: 12.5, w: "800", c: v("--cold") });

      /* 눈구름 */
      var ch = clamp((dT - 4) * 9, 0, 150);
      if (ch > 12) {
        ctx.fillStyle = v("--mist"); ctx.globalAlpha = 0.45;
        for (var i = 0; i < 5; i++) {
          var cx2 = x0 + 140 + i * 86, cy2 = seaY - 28 - ch * (0.4 + i * 0.13);
          ctx.beginPath(); ctx.arc(cx2, cy2, 22 + ch * 0.14, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.strokeStyle = v("--teal"); ctx.fillStyle = v("--teal"); ctx.lineWidth = 3;
        for (var j = 0; j < 4; j++) {
          var ax = x0 + 170 + j * 96;
          window.drawArrow(ctx, ax, seaY - 12, ax, seaY - 24 - ch * (0.3 + j * 0.12), 9);
        }
        text(ctx, "구름 꼭대기 높이 약 " + Math.round(ch * 14) + " m", x0 + 10, Math.max(seaY - 40 - ch * 0.9, 112), { s: 11.5, w: "800", c: v("--teal-700") });
      }

      var px = 660;
      text(ctx, "해기차 (바다 − 공기)", px, 96, { s: 12, w: "800", c: v("--mist") });
      text(ctx, dT.toFixed(1) + " ℃", px, 138, { s: 32, w: "900", c: strong ? v("--rose-700") : (weak ? v("--mist") : v("--brand-700")) });
      text(ctx, strong ? "눈구름이 크게 발달" : (weak ? "눈구름이 자라지 못함" : "구름이 조금 생김"), px, 174, { s: 13.5, w: "900", c: strong ? v("--rose-700") : v("--mist") });
      text(ctx, "아래가 따뜻하면 공기가", px, 216, { s: 11.5, c: v("--mist") });
      text(ctx, "불안정해져 위로 솟습니다", px, 236, { s: 11.5, c: v("--mist") });
      text(ctx, "해기차가 클수록", px, 268, { s: 11.5, c: v("--mist") });
      text(ctx, "눈구름이 높이 자랍니다", px, 288, { s: 11.5, c: v("--mist") });
      text(ctx, "찬 공기가 따뜻한 바다 위를 건너며 열과 수증기를 받아 대기가 불안정해지고, 눈구름대가 만들어져 서해안에 폭설을 뿌립니다.", 60, H - 18, { s: 11, c: v("--mist") });

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
    { key: "r4", label: "④ 매미가 오던 밤" }
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
    { key: "r4", label: "④ 매미가 오던 밤" }
  ],
  line: { id: "all", label: "네 사건을 꿰는 한 문장" }
});

})();
