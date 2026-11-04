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

    function curve(f, X, col) {
      ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 2.8; ctx.lineJoin = "round"; ctx.shadowColor = col; ctx.shadowBlur = 9;
      ctx.beginPath();
      for (var k = 0; k <= 200; k++) { var d = k * 5, x = X(f(d)), y = YD(d); if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
      ctx.stroke(); ctx.restore();
    }
    function draw() {
      paper(ctx, W, H, "ocean", 13);
      var p = PROF[lat];
      head(ctx, p.label + " 바다를 깊이에 따라 재 보기");

      /* 수온약층 띠 (수온 변화율이 큰 구간) */
      var lo = null, hi = null;
      for (var d0 = 0; d0 <= 1000; d0 += 10) {
        if (gradT(d0, p) >= 0.02) { if (lo === null) lo = d0; hi = d0; }
      }
      /* 그래프 칸: 위는 햇빛 받은 밝은 물, 아래로 갈수록 깊은 물 */
      var warm = clamp(p.surfT / 28, 0, 1);
      [[TX0, TX1], [SX0, SX1]].forEach(function (box) {
        water(ctx, box[0], PY0, box[1] - box[0], PY1 - PY0,
          "rgba(" + Math.round(60 + 120 * warm) + "," + Math.round(170 - 30 * warm) + ",230,.42)", "rgba(4,14,40,.75)");
        if (lo !== null) {
          var tg = ctx.createLinearGradient(0, YD(lo), 0, YD(hi));
          tg.addColorStop(0, "rgba(63,211,163,.10)"); tg.addColorStop(.5, "rgba(63,211,163,.28)"); tg.addColorStop(1, "rgba(63,211,163,.10)");
          ctx.fillStyle = tg; ctx.fillRect(box[0], YD(lo), box[1] - box[0], YD(hi) - YD(lo));
          ctx.strokeStyle = "rgba(63,211,163,.6)"; ctx.setLineDash([3, 4]); ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(box[0], YD(lo)); ctx.lineTo(box[1], YD(lo)); ctx.moveTo(box[0], YD(hi)); ctx.lineTo(box[1], YD(hi)); ctx.stroke(); ctx.setLineDash([]);
        }
        /* 햇빛이 비치는 수면 */
        var sg = ctx.createLinearGradient(0, PY0, 0, PY0 + 26);
        sg.addColorStop(0, "rgba(255,240,180," + (.10 + .25 * warm) + ")"); sg.addColorStop(1, "rgba(255,240,180,0)");
        ctx.fillStyle = sg; ctx.fillRect(box[0], PY0, box[1] - box[0], 26);
      });

      axes(ctx, TX0, PY0, TX1, PY1);
      axes(ctx, SX0, PY0, SX1, PY1);
      for (var dd = 0; dd <= 1000; dd += 200) {
        ctx.strokeStyle = KC.grid; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(TX0, YD(dd)); ctx.lineTo(TX1, YD(dd)); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(SX0, YD(dd)); ctx.lineTo(SX1, YD(dd)); ctx.stroke();
        K.t(ctx, dd + "", TX0 - 8, YD(dd) + 4, { s: 10.5, a: "right", c: KC.mute, w: "600" });
        K.t(ctx, dd + "", SX0 - 8, YD(dd) + 4, { s: 10.5, a: "right", c: KC.mute, w: "600" });
      }
      K.t(ctx, "깊이(m)", TX0 - 8, PY0 - 10, { s: 11, a: "right", c: KC.mute });
      for (var tt = 0; tt <= 30; tt += 10) K.t(ctx, tt + "℃", XT(tt), PY1 + 18, { s: 10.5, a: "center", c: KC.mute, w: "600" });
      for (var ss = 33; ss <= 36; ss += 1) K.t(ctx, ss + "", XS(ss), PY1 + 18, { s: 10.5, a: "center", c: KC.mute, w: "600" });
      K.t(ctx, "수온 →", TX1, PY1 + 34, { s: 11, a: "right", c: KC.mute });
      K.t(ctx, "염분(psu) →", SX1, PY1 + 34, { s: 11, a: "right", c: KC.mute });
      pill(ctx, "수온 곡선", TX1 - 8, PY0 + 20, { a: "right", s: 11.5, c: KC.orange });
      pill(ctx, "염분 곡선", SX1 - 8, PY0 + 20, { a: "right", s: 11.5, c: KC.blue });

      /* 곡선 */
      curve(function (d) { return profT(d, p); }, XT, KC.orange);
      curve(function (d) { return profS(d, p); }, XS, KC.blue);

      /* 층 이름: 두 그래프 사이 */
      var GX = (TX1 + SX0) / 2 - 8;
      if (lo !== null) {
        if (lo > 20) pill(ctx, "혼합층", GX, YD(lo / 2) + 5, { a: "center", s: 11.5, c: "#bfe6ff" });
        pill(ctx, "수온약층", GX, YD((lo + hi) / 2) + 5, { a: "center", s: 12, c: KC.green });
        pill(ctx, "심해층", GX, YD((hi + 1000) / 2) + 5, { a: "center", s: 11.5, c: KC.mute });
      } else {
        pill(ctx, "수온약층 없음", GX, YD(500) + 5, { a: "center", s: 11.5, c: KC.mute });
      }

      /* 현재 관측점 */
      var cT = profT(depth, p), cS = profS(depth, p), cD = sigmaT(cT, cS), g = gradT(depth, p);
      ctx.strokeStyle = KC.violet; ctx.setLineDash([4, 4]); ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(TX0, YD(depth)); ctx.lineTo(TX1, YD(depth)); ctx.moveTo(SX0, YD(depth)); ctx.lineTo(SX1, YD(depth)); ctx.stroke(); ctx.setLineDash([]);
      K.glow(ctx, XT(cT), YD(depth), 5, "rgba(182,156,255,.95)", 3.6);
      K.glow(ctx, XS(cS), YD(depth), 5, "rgba(182,156,255,.95)", 3.6);
      /* 수온 · 염분 값 이름표 */
      var tyy = clamp(YD(depth) - 10, PY0 + 40, PY1 - 8);
      pill(ctx, cT.toFixed(1) + " ℃", XT(cT) + 12, tyy, { s: 11.5, c: KC.orange, box: [TX0, TX1] });
      pill(ctx, cS.toFixed(2), XS(cS) + (XS(cS) > SX1 - 70 ? -12 : 12), tyy, { s: 11.5, a: XS(cS) > SX1 - 70 ? "right" : "left", c: KC.blue, box: [SX0, SX1] });

      var layer = (lo !== null && depth >= lo && depth <= hi) ? "수온약층" : (depth <= p.top + 10 ? "혼합층" : (lo === null ? "거의 균질한 층" : (depth < lo ? "혼합층" : "심해층")));
      pill(ctx, "지금 관측점 · " + depth + " m · " + layer, 16, H - 18, { s: 12.5, c: layer === "수온약층" ? KC.green : KC.violet });
      K.t(ctx, "σt = 밀도 − 1000 (클수록 무겁다)", W - 16, H - 18, { s: 11, a: "right", c: KC.mute });

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

    function bottle(x, y, w, h, T, label, on, known) {
      /* 유리병: 물 색은 수온(따뜻할수록 청록, 찰수록 짙은 남색) */
      var warm = clamp(T / 20, 0, 1);
      ctx.save();
      ctx.beginPath(); ctx.roundRect(x, y + 14, w, h - 14, 8); ctx.roundRect(x + w * .3, y, w * .4, 18, 3);
      ctx.fillStyle = "rgba(220,235,255,.08)"; ctx.fill();
      ctx.strokeStyle = on ? KC.violet : "rgba(200,220,255,.45)"; ctx.lineWidth = on ? 2 : 1.2; ctx.stroke();
      var wg = ctx.createLinearGradient(0, y + 30, 0, y + h);
      wg.addColorStop(0, "rgba(" + Math.round(40 + 60 * warm) + "," + Math.round(120 + 90 * warm) + "," + Math.round(200 + 30 * warm) + ",.85)");
      wg.addColorStop(1, "rgba(10," + Math.round(40 + 40 * warm) + ",110,.95)");
      ctx.fillStyle = wg; ctx.beginPath(); ctx.roundRect(x + 3, y + 30, w - 6, h - 33, 6); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.22)"; ctx.fillRect(x + 6, y + 20, 3, h - 28);
      ctx.restore();
      K.t(ctx, label, x + w / 2, y + h + 16, { s: 11, a: "center", w: "800", c: on ? KC.violet : KC.mute });
      K.t(ctx, known, x + w / 2, y + h + 31, { s: 10.5, a: "center", w: "700", c: known === "?" ? KC.dim : KC.green });
    }
    function draw() {
      paper(ctx, W, H, "lab", 21);
      head(ctx, "수온 염분도 (T-S도) · 점이 놓인 등밀도선을 찾아라");
      axes(ctx, X0, Y0, X1, Y1);
      /* 따뜻한 위 · 차가운 아래 바탕 */
      var bg = ctx.createLinearGradient(0, Y0, 0, Y1);
      bg.addColorStop(0, "rgba(255,150,90,.10)"); bg.addColorStop(1, "rgba(90,150,255,.12)");
      ctx.fillStyle = bg; ctx.fillRect(X0, Y0, X1 - X0, Y1 - Y0);
      for (var sal = 32; sal <= 35; sal += 1) K.t(ctx, sal.toFixed(0), XS(sal), Y1 + 18, { s: 10.5, a: "center", c: KC.mute, w: "600" });
      K.t(ctx, "염분(psu) →", X1, Y1 + 36, { s: 11, a: "right", c: KC.mute });
      for (var t0 = 0; t0 <= 25; t0 += 5) K.t(ctx, t0 + "℃", X0 - 8, YT(t0) + 4, { s: 10.5, a: "right", c: KC.mute, w: "600" });
      K.t(ctx, "수온", X0 - 8, Y0 - 10, { s: 11, a: "right", c: KC.mute });
      K.t(ctx, "↘ 오른쪽 아래로 갈수록 무겁다 (σt 증가)", X0, Y1 + 36, { s: 11, c: KC.blue });

      /* 등밀도선 */
      for (var g = 22; g <= 28.5001; g += 0.5) isoline(g, "rgba(200,210,255,.22)", false);
      ctx.save(); ctx.shadowColor = KC.yellow; ctx.shadowBlur = 10; isoline(sig, KC.yellow, true); ctx.restore();
      var lt = tempForSigma(sig, 35.3);
      if (lt !== null && lt >= 1 && lt <= 24) pill(ctx, "σt " + sig.toFixed(2), clamp(XS(35.3) + 6, X0, X1 - 4), YT(lt) - 8, { s: 11.5, c: KC.yellow, box: [X0, X1 + 30] });

      /* 세 정점 */
      ST.forEach(function (q, i) {
        var x = XS(q.S), y = YT(q.T);
        if (i === s) K.glow(ctx, x, y, 6, "rgba(182,156,255,.95)", 3.4);
        else { ctx.fillStyle = got[i] ? KC.green : "rgba(200,210,255,.75)"; ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill(); }
        pill(ctx, q.n, clamp(x, X0 + 30, X1 - 30), y - 14, { s: 11.5, a: "center", c: i === s ? KC.violet : (got[i] ? KC.green : KC.mute) });
      });

      /* 오른쪽 자료판: 채수 기록 카드 */
      var px = 576, pw = W - px - 14, py = 50, ph = 236;
      var cg = ctx.createLinearGradient(px, py, px, py + ph);
      cg.addColorStop(0, "rgba(40,52,110,.65)"); cg.addColorStop(1, "rgba(18,24,60,.65)");
      ctx.fillStyle = cg; ctx.beginPath(); ctx.roundRect(px, py, pw, ph, 12); ctx.fill();
      ctx.strokeStyle = "rgba(200,210,255,.18)"; ctx.lineWidth = 1; ctx.stroke();
      var Q = ST[s], real = sigmaT(Q.T, Q.S), ok = Math.abs(sig - real) <= 0.07;
      K.t(ctx, "채수 기록", px + 16, py + 26, { s: 13, w: "900", c: KC.mute });
      K.t(ctx, Q.n + " · " + Q.m, px + 16, py + 56, { s: 17, w: "900", c: KC.violet });
      K.t(ctx, "수온 " + Q.T.toFixed(1) + " ℃", px + 16, py + 84, { s: 13.5, c: KC.orange });
      K.t(ctx, "염분 " + Q.S.toFixed(1) + " psu", px + 150, py + 84, { s: 13.5, c: KC.blue });
      K.t(ctx, "내가 읽은 σt", px + 16, py + 120, { s: 12, c: KC.mute, w: "800" });
      K.t(ctx, sig.toFixed(2), px + 16, py + 152, { s: 26, w: "900", c: ok ? KC.green : KC.yellow });
      pill(ctx, ok ? "✅ 등밀도선과 맞습니다" : (sig > real ? "이 점보다 무거운 선입니다" : "이 점보다 가벼운 선입니다"),
        px + 16, py + 190, { s: 12.5, c: ok ? KC.green : KC.red, box: [px, px + pw] });
      /* 세 물병 */
      var bw = 46, gap = (pw - 3 * bw) / 4, by = py + ph + 22;
      ST.forEach(function (q, i) {
        bottle(px + gap + i * (bw + gap), by, bw, 74, q.T, q.n, i === s, got[i] ? "σt " + sigmaT(q.T, q.S).toFixed(2) : "?");
      });
      K.t(ctx, "굵은 노란 선이 내가 고른 등밀도선입니다. 정점이 그 선 위에 오도록 맞추세요.", 60, H - 14, { s: 11, c: KC.mute });

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

    var BX0 = 190, BX1 = 840, YEQ = 392, BAND = 88;

    function bands() {
      return [
        { y: YEQ - 3 * BAND, name: "극동풍", dir: -1, on: wind.polar, c: "--violet" },
        { y: YEQ - 2 * BAND, name: "편서풍", dir: 1, on: wind.westerlies, c: "--brand" },
        { y: YEQ - BAND, name: "무역풍", dir: -1, on: wind.trade, c: "--coral" }
      ];
    }
    function loops() {
      var out = [];
      if (wind.trade && wind.westerlies) out.push({ cy: YEQ - 1.5 * BAND, ry: BAND * .46, cw: true, c: "--coral", n: "아열대 순환" });
      if (wind.westerlies && wind.polar) out.push({ cy: YEQ - 2.5 * BAND, ry: BAND * .46, cw: false, c: "--violet", n: "아한대 순환" });
      return out;
    }

    function draw() {
      paper(ctx, W, H, "night", 31);
      head(ctx, "북반구 대양 모식도 — 바람이 만드는 표층 순환");
      var top = YEQ - 3.5 * BAND;
      /* 해분: 깊은 바다 그라데이션 + 양옆 대륙 */
      ctx.save(); ctx.beginPath(); ctx.roundRect(BX0, top, BX1 - BX0, 3.5 * BAND, 14); ctx.clip();
      var og = ctx.createLinearGradient(0, top, 0, YEQ);
      og.addColorStop(0, "#123a6e"); og.addColorStop(1, "#0b5a8c");
      ctx.fillStyle = og; ctx.fillRect(BX0, top, BX1 - BX0, 3.5 * BAND);
      var R = K.rng(4);
      for (var w = 0; w < 26; w++) { var wx = BX0 + R() * (BX1 - BX0), wy = top + R() * 3.5 * BAND; ctx.strokeStyle = "rgba(170,220,255,.10)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(wx, wy); ctx.quadraticCurveTo(wx + 8, wy - 3, wx + 16, wy); ctx.stroke(); }
      ctx.restore();
      land(ctx, BX0 - 14, top, 14, 3.5 * BAND);
      land(ctx, BX1, top, 14, 3.5 * BAND);
      ctx.strokeStyle = "rgba(160,210,255,.35)"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.roundRect(BX0, top, BX1 - BX0, 3.5 * BAND, 14); ctx.stroke();
      K.t(ctx, "적도", BX0 - 22, YEQ + 4, { s: 11.5, a: "right", w: "800", c: KC.mute });
      K.t(ctx, "극", BX0 - 22, top + 14, { s: 11.5, a: "right", w: "800", c: KC.mute });
      ctx.strokeStyle = "rgba(255,211,107,.35)"; ctx.setLineDash([6, 6]); ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(BX0, YEQ - 1); ctx.lineTo(BX1, YEQ - 1); ctx.stroke(); ctx.setLineDash([]);

      /* 바람띠: 흐르는 바람 줄 */
      bands().forEach(function (b) {
        var col = v(b.c);
        ctx.globalAlpha = b.on ? 1 : 0.16;
        var span = (BX1 - BX0 - 100) / 5, off = ((t * 1.6) % span) * b.dir;
        ctx.save(); ctx.beginPath(); ctx.rect(BX0, b.y - 14, BX1 - BX0, 28); ctx.clip();
        for (var i = -1; i < 7; i++) {
          var x = BX0 + 60 + i * span + (b.on ? off : 0);
          var gr = ctx.createLinearGradient(x - b.dir * 26, 0, x + b.dir * 16, 0);
          gr.addColorStop(0, "rgba(255,255,255,0)"); gr.addColorStop(1, col);
          ctx.strokeStyle = gr; ctx.fillStyle = col; ctx.lineWidth = 2.6;
          window.drawArrow(ctx, x - b.dir * 26, b.y, x + b.dir * 16, b.y, 7);
        }
        ctx.restore();
        K.pill(ctx, b.name + (b.dir > 0 ? " →" : " ←"), BX0 - 22, b.y + 5, { s: 11.5, a: "right", c: col });
        ctx.globalAlpha = 1;
      });

      /* 순환 고리: 빛나는 물 알갱이가 돈다 */
      var L = loops(), cx = (BX0 + BX1) / 2, rx = (BX1 - BX0) / 2 - 40;
      L.forEach(function (lp) {
        var col = lp.cw ? KC.orange : KC.violet;
        ctx.strokeStyle = col; ctx.globalAlpha = 0.35; ctx.lineWidth = 6;
        ctx.beginPath(); ctx.ellipse(cx, lp.cy, rx, lp.ry, 0, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1;
        for (var i = 0; i < 26; i++) {
          var u = (i / 26 + t * 0.008) % 1;
          var a = (lp.cw ? 1 : -1) * u * Math.PI * 2 - Math.PI / 2;
          var px = cx + rx * Math.cos(a), py = lp.cy + lp.ry * Math.sin(a);
          ctx.globalAlpha = .9; K.glow(ctx, px, py, 2.6, col, 3); ctx.globalAlpha = 1;
        }
        K.pill(ctx, lp.n + (lp.cw ? " (시계 방향 ↻)" : " (시계 반대 방향 ↺)"), cx, lp.cy + 6, { s: 13, a: "center", c: col });
        K.pill(ctx, "서안 경계류", BX0 + 100, lp.cy + 5, { s: 10.5, a: "center", c: KC.ink });
      });
      if (!L.length) K.pill(ctx, "이웃한 두 바람을 함께 켜야 고리가 완성됩니다", cx, YEQ - 2 * BAND + 4, { s: 13.5, a: "center", c: KC.mute });

      K.t(ctx, "서쪽 가장자리에서는 해류가 좁고 빠르게 흐릅니다 (서안 경계류)", 60, H - 42, { s: 12, c: KC.mute });
      K.warn(ctx, 60, H - 14, "⚠ 실제 해안선이 아닌 네모난 해분 모식도 · 남반구에서는 도는 방향이 반대");

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

    function draw() {
      ctx.clearRect(0, 0, W, H);
      var ek = ekAz();
      /* ── 왼쪽 무대: 깊이에 따라 휘는 물 ── */
      var LW = 420;
      K.stage(ctx, 0, 0, LW, H, "ocean", { seed: 41 });
      K.pill(ctx, "에크만 나선 · 깊이별 물의 움직임", 16, 28, { s: 13, c: KC.blue });
      var ox = 250, oy0 = 80;
      /* 수면 띠 */
      var sg = ctx.createLinearGradient(0, oy0 - 26, 0, oy0 + 14);
      sg.addColorStop(0, "rgba(160,220,255,.0)"); sg.addColorStop(1, "rgba(160,220,255,.16)");
      ctx.fillStyle = sg; ctx.fillRect(14, oy0 - 26, LW - 28, 40);
      for (var i = 0; i <= 6; i++) {
        var yy = oy0 + i * 40;
        var a2 = az + (hemi === "N" ? 1 : -1) * (20 + i * 22);
        var vv = azVec(a2), len = 62 * Math.pow(0.78, i);
        ctx.strokeStyle = "rgba(200,220,255,.12)"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(ox, yy, 70, 13, 0, 0, Math.PI * 2); ctx.stroke();
        var col = i === 0 ? KC.yellow : "rgba(127,211,255," + (1 - i * 0.1).toFixed(2) + ")";
        ctx.save(); ctx.shadowColor = i === 0 ? KC.yellow : KC.blue; ctx.shadowBlur = 6;
        ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = i === 0 ? 4 : 2.6;
        window.drawArrow(ctx, ox, yy, ox + vv.x * len, yy + vv.y * len * 0.55, 9);
        ctx.restore();
        K.glow(ctx, ox, yy, 2, "rgba(220,240,255,.9)", 3);
        if (i === 0) K.pill(ctx, "표층 물", 24, yy + 5, { s: 11, c: KC.yellow });
        else K.t(ctx, (i * 12) + " m", 60, yy + 4, { s: 11, a: "right", c: KC.mute, w: "600" });
      }
      K.pill(ctx, "깊어질수록 짧아지고 더 휘어집니다", 24, 372, { s: 11.5, c: KC.mute, box: [0, LW] });
      K.warn(ctx, 24, H - 14, "⚠ 깊이·화살표 길이는 모식적", "left");

      /* ── 오른쪽 무대: 위에서 본 바람과 순 수송 ── */
      var RX = LW + 8;
      K.stage(ctx, RX, 0, W - RX, H, "ocean", { seed: 43 });
      K.pill(ctx, "위에서 본 모습 · 바람과 순 수송", RX + 16, 28, { s: 13, c: KC.blue });
      var cx = 660, cy = 205, R = 112;
      compass(ctx, cx, cy, R, [az, ek]);
      var wv = azVec(az), ev = azVec(ek);
      /* 직각 표시 */
      var a0 = Math.atan2(wv.y, wv.x), a1 = Math.atan2(ev.y, ev.x);
      var da = ((a1 - a0 + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, 34, a0, a0 + da, da < 0); ctx.closePath();
      ctx.fillStyle = "rgba(255,107,129,.18)"; ctx.fill();
      ctx.save(); ctx.shadowColor = KC.yellow; ctx.shadowBlur = 10;
      ctx.strokeStyle = KC.yellow; ctx.fillStyle = KC.yellow; ctx.lineWidth = 5;
      window.drawArrow(ctx, cx, cy, cx + wv.x * R, cy + wv.y * R, 13);
      ctx.shadowColor = KC.red; ctx.strokeStyle = KC.red; ctx.fillStyle = KC.red;
      window.drawArrow(ctx, cx, cy, cx + ev.x * R * 0.82, cy + ev.y * R * 0.82, 13);
      ctx.restore();
      K.glow(ctx, cx, cy, 3, "rgba(255,255,255,.9)", 3);
      K.pill(ctx, "90°", cx + Math.cos(a0 + da / 2) * 50, cy + Math.sin(a0 + da / 2) * 50 + 5, { s: 11, a: "center", c: KC.red });
      K.pill(ctx, "바람", clamp(cx + wv.x * (R + 30), RX + 40, 860), clamp(cy + wv.y * (R + 30), 60, 340), { s: 12.5, a: "center", c: KC.yellow, box: [RX, W] });
      K.pill(ctx, "에크만 수송", clamp(cx + ev.x * (R + 34), RX + 50, 840), clamp(cy + ev.y * (R + 34), 60, 340), { s: 12.5, a: "center", c: KC.red, box: [RX, W] });

      K.pill(ctx, "바람 " + azName(az) + "쪽 (" + az + "°)", RX + 20, 382, { s: 13.5, c: KC.yellow });
      K.pill(ctx, "순 수송 " + azName(ek) + "쪽 (" + ek + "°)", W - 20, 382, { s: 13.5, a: "right", c: KC.red });
      K.t(ctx, hemi === "N" ? "북반구 : 바람의 오른쪽 90°" : "남반구 : 바람의 왼쪽 90°", RX + 20, 412, { s: 11.5, c: KC.mute });

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

    function draw() {
      ctx.clearRect(0, 0, W, H);
      var vv = speed(h);
      var LW = 600;
      K.stage(ctx, 0, 0, LW, H, "night", { seed: 51 });
      K.pill(ctx, "옆에서 자른 바다 · 쌓인 물이 만든 언덕", 16, 28, { s: 13, c: KC.blue });

      /* 단면: 바닷물 그라데이션 + 기울어진 해수면 */
      var x0 = 40, x1 = 560, base = 170, rise = clamp(h * 0.55, 6, 84), bot = H - 50;
      ctx.save();
      ctx.beginPath(); ctx.moveTo(x0, base);
      for (var k = 0; k <= 100; k++) { var u = k / 100; ctx.lineTo(x0 + u * (x1 - x0), base - rise * u); }
      ctx.lineTo(x1, bot); ctx.lineTo(x0, bot); ctx.closePath(); ctx.clip();
      water(ctx, x0, base - rise, x1 - x0, bot - base + rise, "rgba(70,170,235,.75)", "rgba(6,24,70,.95)");
      /* 같은 수압 면(등수압면): 수면과 나란히 기운다 */
      for (var q = 1; q <= 3; q++) {
        ctx.strokeStyle = "rgba(200,230,255,.22)"; ctx.setLineDash([5, 6]); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x0, base + q * 26); ctx.lineTo(x1, base + q * 26 - rise); ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.restore();
      ctx.save(); ctx.strokeStyle = "#bfe6ff"; ctx.lineWidth = 2.6; ctx.shadowColor = KC.blue; ctx.shadowBlur = 8;
      ctx.beginPath();
      for (var k2 = 0; k2 <= 100; k2++) { var u2 = k2 / 100, x = x0 + u2 * (x1 - x0), y = base - rise * u2; if (k2 === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
      ctx.stroke(); ctx.restore();
      ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.setLineDash([3, 4]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x0, base); ctx.lineTo(x1, base); ctx.stroke(); ctx.setLineDash([]);
      K.pill(ctx, "해수면", x0 + 8, base - 10, { s: 11.5, c: "#bfe6ff" });
      K.pill(ctx, "높은 쪽", x1 - 6, base - rise - 12, { s: 11, a: "right", c: KC.yellow });
      K.pill(ctx, "낮은 쪽", x0 + 8, base + 26, { s: 11, c: KC.mute });
      /* 높이 차 꺾쇠 */
      ctx.strokeStyle = KC.yellow; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x1 + 8, base); ctx.lineTo(x1 + 14, base); ctx.lineTo(x1 + 14, base - rise); ctx.lineTo(x1 + 8, base - rise); ctx.stroke();
      K.pill(ctx, h + " cm", x1 + 20, base - rise / 2 + 5, { s: 11.5, c: KC.yellow, box: [0, LW] });
      K.bracket(ctx, x0, x1, bot + 12, KC.mute, "100 km", false);

      /* 힘 벡터 */
      var px = 300, py = base + 80;
      ctx.save(); ctx.shadowBlur = 8;
      ctx.shadowColor = KC.red; ctx.strokeStyle = KC.red; ctx.fillStyle = KC.red; ctx.lineWidth = 4;
      window.drawArrow(ctx, px - 16, py, px - 96, py, 11);
      ctx.shadowColor = KC.violet; ctx.strokeStyle = KC.violet; ctx.fillStyle = KC.violet;
      window.drawArrow(ctx, px + 16, py, px + 96, py, 11);
      ctx.restore();
      K.pill(ctx, "압력 경도력 (높은 쪽 → 낮은 쪽)", px - 20, py - 18, { s: 11.5, a: "right", c: KC.red, box: [0, LW] });
      K.pill(ctx, "전향력", px + 26, py - 18, { s: 11.5, c: KC.violet, box: [0, LW] });
      /* 지형류: 화면 안쪽으로 (⊗) */
      ctx.fillStyle = "rgba(63,211,163,.18)"; ctx.beginPath(); ctx.arc(px, py, 14, 0, 6.2832); ctx.fill();
      ctx.strokeStyle = KC.green; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(px, py, 12, 0, 6.2832); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(px - 7, py - 7); ctx.lineTo(px + 7, py + 7); ctx.moveTo(px + 7, py - 7); ctx.lineTo(px - 7, py + 7); ctx.stroke();
      K.pill(ctx, "⊗ 지형류 · 두 힘이 평형 → 등수압선과 나란히(화면 안쪽으로) 흐른다", px, py + 44, { s: 11.5, a: "center", c: KC.green, box: [0, LW] });

      /* ── 오른쪽: 속도계 ── */
      var RX = LW + 8, RW = W - RX;
      K.stage(ctx, RX, 0, RW, H, "lab", { seed: 53 });
      K.pill(ctx, "지형류 속도", RX + 16, 28, { s: 13, c: KC.blue });
      K.t(ctx, "지형류 = (g ÷ f) × 기울기", RX + 18, 66, { s: 11.5, c: KC.mute });
      K.t(ctx, vv.toFixed(2) + " m/s", RX + 18, 110, { s: 30, w: "900", c: vv >= 1 ? KC.green : KC.yellow });
      K.pill(ctx, vv >= 1 ? "✅ 서안 경계류 수준입니다" : "아직 느립니다", RX + 18, 146, { s: 12.5, c: vv >= 1 ? KC.green : KC.red, box: [RX, W] });
      /* 막대 속도계: 0~3 m/s, 1~2 m/s 띠 = 실제 서안 경계류 */
      var gx = RX + 30, gw = RW - 60, gy = 210, VMAX = 3;
      function GX(val) { return gx + clamp(val / VMAX, 0, 1) * gw; }
      ctx.fillStyle = "rgba(255,255,255,.08)"; ctx.beginPath(); ctx.roundRect(gx, gy, gw, 14, 7); ctx.fill();
      ctx.fillStyle = "rgba(63,211,163,.22)"; ctx.fillRect(GX(1), gy - 6, GX(2) - GX(1), 26);
      var bg = ctx.createLinearGradient(gx, 0, gx + gw, 0); bg.addColorStop(0, KC.blue); bg.addColorStop(1, KC.green);
      ctx.fillStyle = bg; ctx.beginPath(); ctx.roundRect(gx, gy, Math.max(8, GX(vv) - gx), 14, 7); ctx.fill();
      K.glow(ctx, GX(vv), gy + 7, 4, "rgba(127,211,255,.95)", 3.4);
      [0, 1, 2, 3].forEach(function (m) { K.t(ctx, m + "", GX(m), gy + 34, { s: 10.5, a: "center", c: KC.mute, w: "600" }); });
      K.t(ctx, "m/s", gx + gw, gy + 50, { s: 10.5, a: "right", c: KC.dim });
      K.pill(ctx, "걸프 해류·쿠로시오 1~2 m/s", (GX(1) + GX(2)) / 2, gy - 16, { s: 11, a: "center", c: KC.green, box: [RX, W] });
      K.t(ctx, "위도 35°, g = 9.8 m/s²", RX + 18, 300, { s: 11, c: KC.mute });
      K.t(ctx, "경사가 커질수록 지형류가 빨라집니다.", RX + 18, 322, { s: 11, c: KC.mute });
      K.warn(ctx, RX + 18, H - 16, "⚠ 높이 차는 과장해 그림");

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
    function blob(x, y, r, T, heavy) {
      var cold = clamp(1 - T / 25, 0, 1);
      var g = ctx.createRadialGradient(x - r * .35, y - r * .4, r * .1, x, y, r);
      g.addColorStop(0, "rgba(255,255,255,.95)");
      g.addColorStop(.25, heavy ? "#c9b8ff" : "rgb(" + Math.round(255 - 120 * cold) + "," + Math.round(150 + 60 * cold) + "," + Math.round(120 + 135 * cold) + ")");
      g.addColorStop(1, heavy ? "#4b2fa6" : "rgb(" + Math.round(150 - 100 * cold) + "," + Math.round(60 + 40 * cold) + "," + Math.round(60 + 120 * cold) + ")");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      var sig = sigmaT(T, S), z = settle(sig), heavy = sig >= LIMIT;
      /* ── 왼쪽: 밀도 눈금 ── */
      var LW = 430;
      K.stage(ctx, 0, 0, LW, H, "lab", { seed: 61 });
      K.pill(ctx, "내 물덩어리의 밀도", 16, 28, { s: 13, c: KC.blue });
      K.t(ctx, "수온 " + T.toFixed(1) + " ℃ · 염분 " + S.toFixed(1) + " psu", 40, 74, { s: 13, c: KC.mute, w: "700" });
      K.t(ctx, "σt " + sig.toFixed(2), 40, 110, { s: 26, w: "900", c: heavy ? KC.violet : KC.yellow });
      var gx0 = 50, gx1 = 390, gy = 190;
      function X(s2) { return gx0 + (s2 - 24) / 4.5 * (gx1 - gx0); }
      var bar = ctx.createLinearGradient(gx0, 0, gx1, 0);
      bar.addColorStop(0, "rgba(255,179,92,.75)"); bar.addColorStop(.6, "rgba(127,211,255,.75)"); bar.addColorStop(1, "rgba(182,156,255,.9)");
      ctx.fillStyle = bar; ctx.beginPath(); ctx.roundRect(gx0, gy - 6, gx1 - gx0, 12, 6); ctx.fill();
      for (var g = 24; g <= 28; g += 1) {
        ctx.strokeStyle = KC.line; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(X(g), gy + 8); ctx.lineTo(X(g), gy + 14); ctx.stroke();
        K.t(ctx, String(g), X(g), gy + 30, { s: 10.5, a: "center", c: KC.mute, w: "600" });
      }
      K.t(ctx, "가볍다", gx0, gy + 48, { s: 11, c: KC.orange });
      K.t(ctx, "무겁다 · 밀도 σt →", gx1, gy + 48, { s: 11, a: "right", c: KC.violet });
      ctx.strokeStyle = KC.yellow; ctx.setLineDash([5, 5]); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(X(LIMIT), gy - 40); ctx.lineTo(X(LIMIT), gy + 10); ctx.stroke(); ctx.setLineDash([]);
      K.pill(ctx, "심층수의 기준 27.8", clamp(X(LIMIT), 140, 380), gy - 46, { s: 11.5, a: "center", c: KC.yellow, box: [0, LW] });
      blob(clamp(X(sig), gx0 - 4, gx1 + 4), gy, 11, T, heavy);
      /* 두 손잡이: 차갑게 · 짜게 */
      var ty = 300;
      K.pill(ctx, "❄ 차가울수록", 40, ty, { s: 12, c: KC.blue });
      K.pill(ctx, "🧂 짤수록", 40, ty + 34, { s: 12, c: KC.green });
      K.t(ctx, "→ 무거워진다", 160, ty, { s: 12, c: KC.mute });
      K.t(ctx, "→ 무거워진다", 160, ty + 34, { s: 12, c: KC.mute });
      K.t(ctx, "가라앉는 깊이는 주변 물과 밀도가 같아지는 곳", 40, H - 18, { s: 11, c: KC.mute });

      /* ── 오른쪽: 물기둥 ── */
      var RX = LW + 8;
      K.stage(ctx, RX, 0, W - RX, H, "ocean", { seed: 63 });
      K.pill(ctx, "주변 바다 (북대서양) 속으로", RX + 16, 28, { s: 13, c: KC.blue });
      var cx0 = RX + 64, cx1 = W - 70, cy0 = 60, cy1 = H - 46;
      function YZ(zz) { return cy0 + (zz / 4000) * (cy1 - cy0); }
      water(ctx, cx0, cy0, cx1 - cx0, cy1 - cy0, "rgba(70,170,235,.55)", "rgba(4,12,40,.92)");
      ctx.strokeStyle = "rgba(160,210,255,.3)"; ctx.lineWidth = 1; ctx.strokeRect(cx0, cy0, cx1 - cx0, cy1 - cy0);
      [0, 1000, 2000, 3000, 4000].forEach(function (zz) {
        ctx.strokeStyle = KC.grid; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(cx0, YZ(zz)); ctx.lineTo(cx1, YZ(zz)); ctx.stroke();
        K.t(ctx, zz + " m", cx0 - 8, YZ(zz) + 4, { s: 10.5, a: "right", c: KC.mute, w: "600" });
        K.t(ctx, "σt " + ambAt(zz).toFixed(2), cx1 + 6, YZ(zz) + 4, { s: 10, c: KC.dim, w: "600" });
      });
      K.t(ctx, "주변", cx1 + 6, cy0 - 12, { s: 10.5, c: KC.dim });
      var bx = cx0 + 90, by = YZ(zShow);
      if (zShow > 20) {
        var tg = ctx.createLinearGradient(0, cy0, 0, by);
        tg.addColorStop(0, "rgba(255,255,255,0)"); tg.addColorStop(1, heavy ? "rgba(182,156,255,.55)" : "rgba(255,107,129,.5)");
        ctx.strokeStyle = tg; ctx.lineWidth = 6; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(bx, cy0 + 6); ctx.lineTo(bx, by - 16); ctx.stroke(); ctx.lineCap = "butt";
      }
      ctx.globalAlpha = .5; K.glow(ctx, bx, by, 10, heavy ? "rgba(182,156,255,.6)" : "rgba(255,150,130,.5)", 2.4); ctx.globalAlpha = 1;
      blob(bx, by, 14, T, heavy);
      var settled = Math.abs(zShow - z) < 8;
      K.pill(ctx, settled ? (z >= 3900 ? "바닥까지 가라앉음" : (z < 60 ? "표층에 그대로 떠 있음" : "약 " + z + " m에서 멈춤")) : "가라앉는 중…",
        bx + 26, clamp(by + 5, cy0 + 22, cy1 - 6), { s: 13, c: heavy ? KC.violet : KC.red, box: [RX, cx1] });

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

    function draw() {
      paper(ctx, W, H, "space", 71);
      var vv = vel(i0), yr = years(vv);
      head(ctx, "전 지구 해양 컨베이어 벨트 (개념도)");

      var lx = 110, rx = 790, ty = 100, by = 300, r = 26;
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
      /* 가운데 지구 */
      K.earth(ctx, (lx + rx) / 2, (ty + by) / 2 - 8, 34);
      K.pill(ctx, "벨트 전체 길이 약 40,000 km", (lx + rx) / 2, (ty + by) / 2 + 52, { s: 12.5, a: "center", c: KC.ink });
      /* 벨트: 차가운 심층류(위·오른쪽) · 따뜻한 표층류(아래·왼쪽) */
      ctx.save(); ctx.lineCap = "round"; ctx.lineWidth = 14;
      ctx.strokeStyle = "rgba(90,160,255,.22)"; ctx.beginPath(); ctx.moveTo(lx, ty); ctx.lineTo(rx, ty); ctx.lineTo(rx, by); ctx.stroke();
      ctx.strokeStyle = "rgba(255,150,80,.22)"; ctx.beginPath(); ctx.moveTo(rx, by); ctx.lineTo(lx, by); ctx.lineTo(lx, ty); ctx.stroke();
      ctx.lineWidth = 2; ctx.shadowBlur = 8;
      ctx.shadowColor = KC.blue; ctx.strokeStyle = "rgba(127,211,255,.7)"; ctx.beginPath(); ctx.moveTo(lx, ty); ctx.lineTo(rx, ty); ctx.lineTo(rx, by); ctx.stroke();
      ctx.shadowColor = KC.orange; ctx.strokeStyle = "rgba(255,179,92,.7)"; ctx.beginPath(); ctx.moveTo(rx, by); ctx.lineTo(lx, by); ctx.lineTo(lx, ty); ctx.stroke();
      ctx.restore();
      /* 벨트 위 물 알갱이 (화면에서는 아주 느린 흐름도 보이게 속도를 줄여 보여 줌) */
      for (var i = 0; i < 30; i++) {
        var p = pt((i / 30 + t * 0.0016 * Math.log(1 + vv)) % 1);
        K.glow(ctx, p.x, p.y, 3.2, p.warm ? "rgba(255,179,92,.95)" : "rgba(127,211,255,.95)", 3);
      }
      /* 침강·용승 지점 */
      K.glow(ctx, lx, ty, 7, "rgba(182,156,255,.95)", 3);
      K.arrow(ctx, { x: lx - 30, y: ty - 26 }, { x: lx - 30, y: ty + 8 }, KC.violet, 2.4);
      K.pill(ctx, "그린란드 앞바다 (침강)", lx + 14, ty - 20, { s: 11.5, c: KC.violet });
      K.glow(ctx, lx, by, 7, "rgba(127,211,255,.95)", 3);
      K.arrow(ctx, { x: lx - 30, y: by - 30 }, { x: lx - 30, y: by + 4 }, KC.blue, 2.4);
      K.pill(ctx, "남극 웨델해 (침강)", lx + 14, by + 30, { s: 11.5, c: KC.blue });
      K.glow(ctx, rx, by, 7, "rgba(255,179,92,.95)", 3);
      K.arrow(ctx, { x: rx + 30, y: by + 8 }, { x: rx + 30, y: by - 26 }, KC.orange, 2.4);
      K.pill(ctx, "인도양·태평양 (용승)", rx - 14, by + 30, { s: 11.5, a: "right", c: KC.orange });
      K.pill(ctx, "● 차가운 심층류", (lx + rx) / 2 - 10, ty - 18, { s: 11.5, a: "right", c: KC.blue });
      K.pill(ctx, "● 따뜻한 표층 귀환류", (lx + rx) / 2 + 10, ty - 18, { s: 11.5, c: KC.orange });

      /* 계산 띠 */
      var tg = vv >= 100 ? "표층 해류 수준" : (vv <= 0.3 ? "심층 순환 수준" : "");
      var tS = yr < 1 ? (yr * 12).toFixed(1) + " 개월" : (yr < 10 ? yr.toFixed(1) + " 년" : Math.round(yr).toLocaleString() + " 년");
      K.pill(ctx, "유속 " + (vv < 1 ? vv.toFixed(2) : vv.toFixed(1)) + " cm/s  →  한 바퀴 " + tS + (tg ? "  ·  " + tg : ""), W / 2, 378, { s: 15, a: "center", c: KC.yellow });
      K.t(ctx, "걸리는 시간 = 길이 ÷ 유속 · 40,000 km = 4,000,000,000 cm", W / 2, H - 36, { s: 11, a: "center", c: KC.mute });
      K.t(ctx, "표층 해류(걸프 해류)는 1초에 1~2 m, 심층류는 1초에 1 cm도 못 가는 곳이 많습니다.", W / 2, H - 16, { s: 11, a: "center", c: KC.mute });

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
    function flowArrow(x, y1, y2, col, glowCol, w) {
      ctx.save();
      ctx.lineCap = "round";
      ctx.strokeStyle = glowCol; ctx.lineWidth = w + 8; ctx.globalAlpha = .25;
      ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x, y2); ctx.stroke();
      ctx.globalAlpha = 1; ctx.shadowColor = col; ctx.shadowBlur = 8;
      ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = w;
      window.drawArrow(ctx, x, y1, x, y2, 12);
      /* 흐르는 물 알갱이 */
      var dir = y2 > y1 ? 1 : -1, len = Math.abs(y2 - y1);
      for (var k = 0; k < 4; k++) {
        var u = ((k / 4) + tk * 0.012) % 1;
        ctx.fillStyle = "rgba(255,255,255,.85)"; ctx.beginPath(); ctx.arc(x, y1 + dir * u * (len - 14), 2.2, 0, 6.2832); ctx.fill();
      }
      ctx.restore();
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      var fl = frontLat(), MW = 712;
      K.stage(ctx, 0, 0, MW, H, "ocean", { seed: 81 });
      K.pill(ctx, "우리나라 주변 해류 (위도 모식도)", 16, 28, { s: 13, c: KC.blue });
      /* 바다 수온 바탕: 조경수역 남쪽은 따뜻한 물, 북쪽은 찬물 */
      ctx.save(); ctx.beginPath(); ctx.roundRect(150, YL(43.3), 560, YL(32.6) - YL(43.3), 10); ctx.clip();
      var yf = YL(fl), sg = ctx.createLinearGradient(0, YL(43.3), 0, YL(32.6));
      var fu = clamp((yf - YL(43.3)) / (YL(32.6) - YL(43.3)), 0.05, 0.95);
      sg.addColorStop(0, "rgba(60,110,220,.35)"); sg.addColorStop(Math.max(0, fu - .08), "rgba(60,130,230,.28)");
      sg.addColorStop(Math.min(1, fu + .08), "rgba(255,140,90,.20)"); sg.addColorStop(1, "rgba(255,120,80,.30)");
      ctx.fillStyle = sg; ctx.fillRect(150, YL(43.3), 560, YL(32.6) - YL(43.3));
      ctx.restore();

      /* 위도 눈금 */
      for (var la = 34; la <= 42; la += 2) {
        ctx.strokeStyle = KC.grid; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(150, YL(la)); ctx.lineTo(700, YL(la)); ctx.stroke();
        K.t(ctx, "북위 " + la + "°", 142, YL(la) + 4, { s: 10.5, a: "right", c: KC.mute, w: "600" });
      }
      /* 한반도 모식 */
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(330, YL(43)); ctx.lineTo(410, YL(42.4)); ctx.lineTo(400, YL(40)); ctx.lineTo(420, YL(38));
      ctx.lineTo(400, YL(36)); ctx.lineTo(370, YL(34.3)); ctx.lineTo(300, YL(34.6)); ctx.lineTo(285, YL(37));
      ctx.lineTo(300, YL(40)); ctx.lineTo(300, YL(43));
      ctx.closePath();
      ctx.shadowColor = "rgba(0,0,0,.5)"; ctx.shadowBlur = 12;
      var lg = ctx.createLinearGradient(290, YL(43), 420, YL(34));
      lg.addColorStop(0, "#5f7a45"); lg.addColorStop(.5, "#6e8a4c"); lg.addColorStop(1, "#4d6238");
      ctx.fillStyle = lg; ctx.fill();
      ctx.shadowBlur = 0; ctx.strokeStyle = "rgba(220,240,200,.55)"; ctx.lineWidth = 1.6; ctx.stroke();
      ctx.restore();
      K.pill(ctx, "한반도", 350, YL(38.5) + 4, { s: 12, a: "center", c: "#e2f2cf" });
      K.pill(ctx, "동해", 600, YL(41.6), { s: 12, a: "center", c: KC.blue });
      K.pill(ctx, "황해", 210, YL(36.2), { s: 12, a: "center", c: KC.blue });

      /* 조경수역 */
      if (show.front) {
        ctx.save(); ctx.shadowColor = KC.green; ctx.shadowBlur = 10;
        ctx.strokeStyle = KC.green; ctx.setLineDash([8, 5]); ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(410, YL(fl)); ctx.lineTo(700, YL(fl)); ctx.stroke(); ctx.setLineDash([]); ctx.restore();
        var R = K.rng(9);
        for (var f = 0; f < 18; f++) { var fx = 430 + R() * 260, fy = YL(fl) + (R() - .5) * 22; ctx.globalAlpha = .55 + .4 * Math.sin(tk * .15 + f); K.glow(ctx, fx, fy, 1.4, "rgba(150,255,200,.9)", 3); }
        ctx.globalAlpha = 1;
        K.pill(ctx, "조경수역 (북위 " + fl.toFixed(1) + "°) · 플랑크톤 · 좋은 어장", 700, YL(fl) - 14, { s: 12, a: "right", c: KC.green, box: [0, MW] });
      }

      /* 해류 */
      CUR.forEach(function (c) {
        if ((c.type === "warm" && !show.warm) || (c.type === "cold" && !show.cold)) return;
        var scale = c.type === "warm" ? (0.5 + warm / 100) : (1.5 - warm / 100);
        var y1 = YL(c.y1), y2 = YL(c.y1 + (c.y2 - c.y1) * clamp(scale, 0.45, 1.45));
        var wv = c.type === "warm" ? 3 + 3 * warm / 100 : 3 + 3 * (1 - warm / 100);
        flowArrow(c.x, y1, y2, c.type === "warm" ? KC.red : KC.blue, c.type === "warm" ? "#ff7a59" : "#5aa8ff", wv);
        c._y1 = y1; c._y2 = y2;
      });
      /* 이름표는 화살표를 다 그린 뒤에: 난류는 화살촉 위, 한류는 출발점 위 */
      CUR.forEach(function (c) {
        if ((c.type === "warm" && !show.warm) || (c.type === "cold" && !show.cold)) return;
        if (c.type === "warm") K.pill(ctx, c.n, clamp(c.x, 60, 700), c._y2 - 14, { s: 11.5, a: "center", c: "#ff9a8a", box: [0, MW] });
        else K.pill(ctx, c.n, c.x + 12, c._y1 + 4, { s: 11.5, c: KC.blue, box: [0, MW] });
      });
      K.warn(ctx, 160, H - 14, "⚠ 해안선·해류 길이는 모식적");

      /* 오른쪽 판 */
      var RX = MW + 8, px = RX + 16;
      K.stage(ctx, RX, 0, W - RX, H, "lab", { seed: 83 });
      K.pill(ctx, "힘겨루기", px, 28, { s: 13, c: KC.blue });
      K.t(ctx, "동한 난류 세력", px, 74, { s: 12, w: "800", c: KC.mute });
      K.t(ctx, warm + "%", px, 106, { s: 26, w: "900", c: KC.red });
      /* 세력 막대: 난류 ↔ 한류 */
      var bx = px, bw = W - 16 - px, byy = 122;
      ctx.fillStyle = "rgba(127,211,255,.55)"; ctx.beginPath(); ctx.roundRect(bx, byy, bw, 10, 5); ctx.fill();
      ctx.fillStyle = "rgba(255,107,129,.85)"; ctx.beginPath(); ctx.roundRect(bx, byy, Math.max(6, bw * warm / 100), 10, 5); ctx.fill();
      K.t(ctx, "난류", bx, byy + 26, { s: 10.5, c: KC.red }); K.t(ctx, "한류", bx + bw, byy + 26, { s: 10.5, a: "right", c: KC.blue });
      K.t(ctx, "조경수역", px, 186, { s: 12, w: "800", c: KC.mute });
      K.t(ctx, "북위 " + fl.toFixed(1) + "°", px, 216, { s: 22, w: "900", c: KC.green });
      K.pill(ctx, warm >= 70 ? "여름철 — 난류 우세" : (warm <= 30 ? "겨울철 — 한류 우세" : "봄·가을 수준"), px, 250, { s: 11.5, c: KC.yellow, box: [RX, W] });
      K.t(ctx, "난류와 한류가 만나면", px, 296, { s: 11.5, c: KC.mute });
      K.t(ctx, "플랑크톤이 많아져", px, 316, { s: 11.5, c: KC.mute });
      K.t(ctx, "좋은 어장이 섭니다", px, 336, { s: 11.5, c: KC.mute });
      K.t(ctx, "조경수역 단추를 켜면", px, H - 50, { s: 10.5, c: KC.dim });
      K.t(ctx, "경계가 보입니다", px, H - 32, { s: 10.5, c: KC.dim });

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

    function draw() {
      ctx.clearRect(0, 0, W, H);
      var off = offshore(), mode = off >= 0.5 ? "up" : (off <= -0.5 ? "down" : "none");
      var LW = 330, TOPH = 316;
      /* ── 왼쪽: 위에서 본 모습 ── */
      K.stage(ctx, 0, 0, LW, TOPH, "ocean", { seed: 91 });
      K.pill(ctx, "위에서 본 모습 (위쪽이 북)", 16, 28, { s: 12.5, c: KC.blue });
      var lx = 20, ly = 52, lw = LW - 40, lh = 246;
      land(ctx, lx, ly, 70, lh);
      ctx.strokeStyle = "rgba(220,240,200,.5)"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(lx + 70, ly); ctx.lineTo(lx + 70, ly + lh); ctx.stroke();
      /* 연안 물빛: 용승이면 찬물 띠 */
      if (mode === "up") { var cg = ctx.createLinearGradient(lx + 70, 0, lx + 150, 0); cg.addColorStop(0, "rgba(120,200,255,.45)"); cg.addColorStop(1, "rgba(120,200,255,0)"); ctx.fillStyle = cg; ctx.fillRect(lx + 70, ly, 80, lh); }
      if (mode === "down") { var wg = ctx.createLinearGradient(lx + 70, 0, lx + 150, 0); wg.addColorStop(0, "rgba(255,150,100,.35)"); wg.addColorStop(1, "rgba(255,150,100,0)"); ctx.fillStyle = wg; ctx.fillRect(lx + 70, ly, 80, lh); }
      K.pill(ctx, "육지", lx + 35, ly + lh / 2 + 4, { s: 12, a: "center", c: "#e2f2cf" });
      K.pill(ctx, "바다 (동쪽)", lx + lw - 6, ly + lh - 12, { s: 11.5, a: "right", c: KC.blue, box: [0, LW] });
      var wv = azVec(az), ev = azVec(ekAz()), mx = lx + 180, my = ly + lh / 2;
      ctx.save(); ctx.shadowBlur = 8; ctx.lineWidth = 4;
      ctx.shadowColor = KC.yellow; ctx.strokeStyle = KC.yellow; ctx.fillStyle = KC.yellow;
      window.drawArrow(ctx, mx, my, mx + wv.x * 56, my + wv.y * 56, 11);
      ctx.shadowColor = KC.red; ctx.strokeStyle = KC.red; ctx.fillStyle = KC.red;
      window.drawArrow(ctx, mx, my, mx + ev.x * 56, my + ev.y * 56, 11);
      ctx.restore();
      K.pill(ctx, "바람", clamp(mx + wv.x * 76, lx + 100, LW - 30), clamp(my + wv.y * 76 + 4, ly + 20, ly + lh - 6), { s: 11.5, a: "center", c: KC.yellow, box: [0, LW] });
      K.pill(ctx, "수송", clamp(mx + ev.x * 78, lx + 100, LW - 30), clamp(my + ev.y * 78 + 4, ly + 20, ly + lh - 6), { s: 11.5, a: "center", c: KC.red, box: [0, LW] });

      /* ── 오른쪽: 해안 단면 ── */
      var RX = LW + 8;
      K.stage(ctx, RX, 0, W - RX, TOPH, "night", { seed: 93 });
      K.pill(ctx, "해안 단면 (해안은 왼쪽)", RX + 16, 28, { s: 12.5, c: KC.blue });
      var sx0 = RX + 20, sx1 = W - 20, sy0 = 70, sy1 = TOPH - 16;
      /* 바다: 위 따뜻 · 아래 차가움 */
      var sea = ctx.createLinearGradient(0, sy0, 0, sy1);
      sea.addColorStop(0, "rgba(60,160,230,.8)"); sea.addColorStop(.35, "rgba(25,90,170,.85)"); sea.addColorStop(1, "rgba(6,22,70,.95)");
      ctx.fillStyle = sea; ctx.fillRect(sx0, sy0, sx1 - sx0, sy1 - sy0);
      /* 찬물이 올라온 혀 모양 / 쌓인 따뜻한 물 */
      if (mode === "up") {
        var ug = ctx.createLinearGradient(sx0, 0, sx0 + 260, 0); ug.addColorStop(0, "rgba(140,220,255,.55)"); ug.addColorStop(1, "rgba(140,220,255,0)");
        ctx.fillStyle = ug; ctx.beginPath(); ctx.moveTo(sx0 + 56, sy1); ctx.quadraticCurveTo(sx0 + 70, sy0 + 20, sx0 + 260, sy0 + 6); ctx.lineTo(sx0 + 56, sy0 + 6); ctx.closePath(); ctx.fill();
      } else if (mode === "down") {
        var dg = ctx.createLinearGradient(sx0, 0, sx0 + 240, 0); dg.addColorStop(0, "rgba(255,170,110,.45)"); dg.addColorStop(1, "rgba(255,170,110,0)");
        ctx.fillStyle = dg; ctx.beginPath(); ctx.moveTo(sx0 + 56, sy0); ctx.lineTo(sx0 + 240, sy0); ctx.quadraticCurveTo(sx0 + 90, sy0 + 40, sx0 + 56, sy1 - 30); ctx.closePath(); ctx.fill();
      }
      /* 해안 절벽 */
      var cl = ctx.createLinearGradient(sx0, 0, sx0 + 60, 0); cl.addColorStop(0, "#4a3d2c"); cl.addColorStop(1, "#6b5a40");
      ctx.fillStyle = cl; ctx.beginPath(); ctx.moveTo(sx0, sy0 - 20); ctx.lineTo(sx0 + 46, sy0 - 20); ctx.lineTo(sx0 + 60, sy1); ctx.lineTo(sx0, sy1); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "rgba(200,230,255,.6)"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(sx0 + 48, sy0); ctx.lineTo(sx1, sy0); ctx.stroke();
      K.pill(ctx, "해안", sx0 + 24, sy0 - 26, { s: 11, a: "center", c: "#e2f2cf" });
      /* 표층 수송 화살표 */
      ctx.save(); ctx.shadowColor = KC.red; ctx.shadowBlur = 8; ctx.strokeStyle = KC.red; ctx.fillStyle = KC.red; ctx.lineWidth = 5;
      if (mode === "up") window.drawArrow(ctx, sx0 + 90, sy0 + 26, sx0 + 300, sy0 + 26, 13);
      else if (mode === "down") window.drawArrow(ctx, sx0 + 300, sy0 + 26, sx0 + 90, sy0 + 26, 13);
      ctx.restore();
      if (mode === "none") K.pill(ctx, "표층 수송이 해안과 나란합니다 — 용승도 침강도 없습니다", sx0 + 80, sy0 + 40, { s: 11.5, c: KC.ink, box: [RX, W] });
      else K.pill(ctx, "표층 에크만 수송", sx0 + 320, sy0 + 32, { s: 11.5, c: KC.red, box: [RX, W] });

      /* 연직 흐름: 빛나는 물 알갱이 */
      if (mode !== "none") {
        var col = mode === "up" ? KC.blue : KC.orange;
        ctx.save(); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 3; ctx.globalAlpha = .7;
        for (var i = 0; i < 3; i++) {
          var xx = sx0 + 90 + i * 40;
          if (mode === "up") window.drawArrow(ctx, xx, sy1 - 16, xx, sy0 + 56, 10);
          else window.drawArrow(ctx, xx, sy0 + 56, xx, sy1 - 16, 10);
        }
        ctx.restore();
        for (var j = 0; j < 10; j++) {
          var ph = ((t * 0.04) + j / 10) % 1;
          var py = mode === "up" ? sy1 - 16 - ph * (sy1 - sy0 - 72) : sy0 + 56 + ph * (sy1 - sy0 - 72);
          K.glow(ctx, sx0 + 220 + (j % 2) * 26, py, 2.6, mode === "up" ? "rgba(127,211,255,.95)" : "rgba(255,179,92,.95)", 3);
        }
        if (mode === "up") { var R = K.rng(12); for (var n = 0; n < 14; n++) { var nx = sx0 + 70 + R() * 200, ny = sy0 + 10 + R() * 30; ctx.globalAlpha = .5 + .4 * Math.sin(t * .2 + n); K.glow(ctx, nx, ny, 1.3, "rgba(150,255,200,.9)", 3); } ctx.globalAlpha = 1; }
        K.pill(ctx, mode === "up" ? "찬 심층수 상승 — 연안 용승 (영양염 ↑)" : "표층수 하강 — 연안 침강", sx1 - 8, sy1 - 12, { s: 13, a: "right", c: mode === "up" ? KC.blue : KC.orange, box: [RX, W] });
      }

      /* ── 아래: 결과 띠 ── */
      K.stage(ctx, 0, TOPH + 8, W, H - TOPH - 8, "night", { seed: 95 });
      K.pill(ctx, "바람 " + azName(az) + "쪽 (" + az + "°) · " + (hemi === "N" ? "북반구" : "남반구") + " · 순 수송 " + azName(ekAz()) + "쪽", 20, TOPH + 44, { s: 13.5, c: KC.ink });
      K.pill(ctx, mode === "up" ? "✅ 용승" : (mode === "down" ? "✅ 침강" : "— 어느 쪽도 아님"), W - 20, TOPH + 44, { s: 14, a: "right", c: mode === "none" ? KC.mute : KC.green });
      K.t(ctx, "여름 동해안에 며칠씩 남풍이 불면 표층수가 바다 쪽으로 밀려나며 찬물이 올라옵니다 — 냉수대입니다.", 20, H - 22, { s: 11, c: KC.mute });

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

    function draw() {
      ctx.clearRect(0, 0, W, H);
      var vv = speed(gap);
      var sense = (sys === "low") ? (hemi === "N" ? -1 : 1) : (hemi === "N" ? 1 : -1);
      var inward = sys === "low" ? 1 : -1;
      var LW = 560;
      K.stage(ctx, 0, 0, LW, H, "night", { seed: 101 });
      K.pill(ctx, (hemi === "N" ? "북반구" : "남반구") + " " + (sys === "low" ? "저기압" : "고기압") + " · 위에서 본 지상 바람", 16, 28, { s: 13, c: KC.blue });

      var cx = 290, cy = 236, step = clamp(gap * 0.05 + 18, 22, 48);
      /* 기압 바탕: 저기압은 중심이 푸르고 구름이 감기며, 고기압은 중심이 따뜻하고 맑다 */
      var pg = ctx.createRadialGradient(cx, cy, 10, cx, cy, 4.5 * step);
      if (sys === "low") { pg.addColorStop(0, "rgba(90,140,255,.38)"); pg.addColorStop(1, "rgba(90,140,255,0)"); }
      else { pg.addColorStop(0, "rgba(255,160,90,.30)"); pg.addColorStop(1, "rgba(255,160,90,0)"); }
      ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(cx, cy, 4.5 * step, 0, Math.PI * 2); ctx.fill();
      if (sys === "low") {
        /* 소용돌이 구름 띠 */
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(sense * t * 0.01);
        for (var arm = 0; arm < 3; arm++) {
          ctx.beginPath();
          for (var q = 0; q <= 40; q++) { var th = arm * 2.094 + sense * q * 0.11, rad = 14 + q * step * 0.085; var X = Math.cos(th) * rad, Y = Math.sin(th) * rad; if (q) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }
          ctx.strokeStyle = "rgba(235,240,255,.16)"; ctx.lineWidth = 16; ctx.lineCap = "round"; ctx.stroke();
        }
        ctx.restore();
      }
      for (var i = 1; i <= 4; i++) {
        ctx.save(); ctx.strokeStyle = "rgba(220,230,255,.55)"; ctx.lineWidth = 1.6; ctx.shadowColor = "rgba(160,190,255,.8)"; ctx.shadowBlur = 4;
        ctx.beginPath(); ctx.arc(cx, cy, i * step, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
        var pv = (sys === "low" ? 996 + i * 4 : 1028 - i * 4);
        if (i * step < 200) K.t(ctx, pv + "", cx + i * step + 4, cy - 5, { s: 10, c: KC.mute, w: "700" });
      }
      var cg = ctx.createRadialGradient(cx - 6, cy - 6, 2, cx, cy, 22);
      if (sys === "low") { cg.addColorStop(0, "#bfe0ff"); cg.addColorStop(1, "#2a5fd0"); } else { cg.addColorStop(0, "#ffe2c2"); cg.addColorStop(1, "#d0602a"); }
      K.glow(ctx, cx, cy, 16, sys === "low" ? "rgba(127,180,255,.6)" : "rgba(255,170,110,.6)", 2);
      ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(cx, cy, 20, 0, Math.PI * 2); ctx.fill();
      K.t(ctx, sys === "low" ? "L" : "H", cx, cy + 8, { s: 22, a: "center", w: "900", c: "#ffffff" });

      /* 바람 화살표: 등압선을 비스듬히 가로지르며 돈다 */
      for (var r = 1; r <= 3; r++) {
        var rr = r * step;
        if (rr > 200) break;
        var cnt = 6 + r * 2;
        for (var k = 0; k < cnt; k++) {
          var ang = (k / cnt) * Math.PI * 2 + sense * t * 0.05;
          var x = cx + Math.cos(ang) * rr, y = cy + Math.sin(ang) * rr;
          var tang = ang + sense * Math.PI / 2 - inward * sense * 0.4;
          ctx.save(); ctx.translate(x, y); ctx.rotate(tang);
          var sg = ctx.createLinearGradient(-16, 0, 9, 0); sg.addColorStop(0, "rgba(63,211,163,0)"); sg.addColorStop(1, KC.green);
          ctx.strokeStyle = sg; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(-16, 0); ctx.lineTo(4, 0); ctx.stroke();
          ctx.fillStyle = KC.green; ctx.beginPath(); ctx.moveTo(9, 0); ctx.lineTo(-2, -4.5); ctx.lineTo(-2, 4.5); ctx.closePath(); ctx.fill();
          ctx.restore();
        }
      }
      K.pill(ctx, "→ 지상 바람", 16, H - 48, { s: 11.5, c: KC.green });
      K.pill(ctx, "○ 등압선 (4 hPa 간격)", 120, H - 48, { s: 11.5, c: KC.ink });
      K.pill(ctx, sys === "low" ? "수렴 → 상승 기류 → 구름·비" : "발산 → 하강 기류 → 맑음", 16, H - 16, { s: 12.5, c: sys === "low" ? KC.blue : KC.orange });

      /* ── 오른쪽 판 ── */
      var RX = LW + 8, px = RX + 18;
      K.stage(ctx, RX, 0, W - RX, H, "lab", { seed: 103 });
      K.pill(ctx, "바람 세기 계산", px - 2, 28, { s: 13, c: KC.blue });
      K.t(ctx, "등압선 간격 (4 hPa마다)", px, 74, { s: 12, w: "800", c: KC.mute });
      K.t(ctx, gap.toLocaleString() + " km", px, 106, { s: 22, w: "900", c: KC.ink });
      K.t(ctx, "지균풍 속도", px, 146, { s: 12, w: "800", c: KC.mute });
      var vc = vv >= 20 ? KC.red : (vv <= 5 ? KC.green : KC.yellow);
      K.t(ctx, vv.toFixed(1) + " m/s", px, 184, { s: 30, w: "900", c: vc });
      K.pill(ctx, vv >= 20 ? "매우 강한 바람" : (vv <= 5 ? "약한 바람" : "보통"), px, 216, { s: 12, c: vc, box: [RX, W] });
      /* 깃발: 바람이 셀수록 크게 펄럭인다 */
      var fx = W - 70, fy = 120, flap = Math.sin(t * 0.3) * clamp(vv / 30, 0.1, 1) * 6, fl = 14 + clamp(vv, 0, 30) * 1.3;
      ctx.strokeStyle = "#c8cde0"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(fx, fy - 30); ctx.lineTo(fx, fy + 50); ctx.stroke();
      var fg = ctx.createLinearGradient(fx, 0, fx + fl, 0); fg.addColorStop(0, "#ff8a5c"); fg.addColorStop(1, "#ffd36b");
      ctx.fillStyle = fg; ctx.beginPath(); ctx.moveTo(fx, fy - 30); ctx.quadraticCurveTo(fx + fl / 2, fy - 30 + flap, fx + fl, fy - 22 - flap * .4); ctx.lineTo(fx + fl, fy - 10 - flap * .4); ctx.quadraticCurveTo(fx + fl / 2, fy - 12 + flap, fx, fy - 8); ctx.closePath(); ctx.fill();
      K.t(ctx, "기압 경도력 = 기압 차 ÷ 거리", px, 266, { s: 11.5, c: KC.mute });
      K.t(ctx, "지균풍 : 기압 경도력 = 전향력", px, 288, { s: 11.5, c: KC.mute });
      K.t(ctx, "같은 4 hPa 라도 거리가 짧으면", px, 322, { s: 11.5, c: KC.mute });
      K.t(ctx, "기압 경도력이 커져 바람이 셉니다", px, 342, { s: 11.5, c: KC.mute });
      K.t(ctx, "등압선이 촘촘한 곳이", px, 386, { s: 11.5, c: KC.dim });
      K.t(ctx, "곧 바람이 센 곳입니다.", px, 406, { s: 11.5, c: KC.dim });

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
    function cloud(x, y, s, dark) {
      var g = ctx.createLinearGradient(0, y - 20 * s, 0, y + 14 * s);
      g.addColorStop(0, dark ? "#9aa3b8" : "#f4f6ff"); g.addColorStop(1, dark ? "#4b5266" : "#b9c3dc");
      ctx.fillStyle = g; ctx.beginPath();
      ctx.arc(x - 18 * s, y, 13 * s, 0, 6.2832); ctx.arc(x, y - 9 * s, 17 * s, 0, 6.2832); ctx.arc(x + 19 * s, y - 1 * s, 13 * s, 0, 6.2832);
      ctx.rect(x - 18 * s, y, 37 * s, 13 * s); ctx.fill();
    }
    function sky(x, y, w, h) {
      /* 관측 지점의 하늘: 지금 시각의 날씨 */
      var rain = rainShort(tt), heavy = rain === "짧고 센 소나기", light = rain === "약한 비가 오래";
      ctx.save(); ctx.beginPath(); ctx.roundRect(x, y, w, h, 10); ctx.clip();
      var g = ctx.createLinearGradient(0, y, 0, y + h);
      if (heavy) { g.addColorStop(0, "#2b3045"); g.addColorStop(1, "#50566a"); }
      else if (light) { g.addColorStop(0, "#4a5876"); g.addColorStop(1, "#7f8ba6"); }
      else { g.addColorStop(0, "#2d6fc0"); g.addColorStop(1, "#8cc4ef"); }
      ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
      if (!heavy && !light) { K.sun(ctx, x + w - 34, y + 30, 9); cloud(x + 50, y + 44, .6, false); }
      else {
        cloud(x + 46, y + 34, heavy ? .9 : .75, true); cloud(x + w - 46, y + 30, heavy ? 1 : .7, true);
        var n = heavy ? 34 : 14, R = K.rng(5);
        ctx.strokeStyle = "rgba(190,220,255,.8)"; ctx.lineWidth = heavy ? 1.6 : 1;
        for (var i = 0; i < n; i++) {
          var rx = x + R() * w, ry = y + 46 + ((R() * h + rainT * (heavy ? 5 : 2.4)) % (h - 40));
          ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx - (heavy ? 3 : 1), ry + (heavy ? 10 : 6)); ctx.stroke();
        }
      }
      /* 땅과 풍향 깃발 */
      ctx.fillStyle = "#3d4a2c"; ctx.fillRect(x, y + h - 12, w, 12);
      ctx.restore();
      ctx.strokeStyle = "rgba(255,255,255,.18)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.roundRect(x, y, w, h, 10); ctx.stroke();
      K.pill(ctx, rain, x + w / 2, y + h + 22, { s: 11.5, a: "center", c: heavy ? KC.blue : (light ? "#c6cff5" : KC.yellow), box: [x - 6, x + w + 6] });
    }
    function draw() {
      paper(ctx, W, H, "lab", 111);
      head(ctx, "온대 저기압이 지나가는 36시간 — 관측 지점의 기록");
      var x0 = 90, x1 = 700, y0 = 60, y1 = 300;
      function X(h) { return x0 + h / 36 * (x1 - x0); }
      function YT(c) { return y1 - (c - 0) / 24 * (y1 - y0) * 0.55 - 10; }
      function YP(p) { return y1 - (p - 998) / 20 * (y1 - y0) * 0.42 - 130; }
      /* 세 구역 바탕 */
      [[0, WARM_AT, "rgba(127,211,255,.06)", "온난 전선 앞"], [WARM_AT, COLD_AT, "rgba(255,150,90,.10)", "온난 구역"], [COLD_AT, 36, "rgba(127,180,255,.10)", "한랭 전선 뒤"]].forEach(function (z) {
        ctx.fillStyle = z[2]; ctx.fillRect(X(z[0]), y0, X(z[1]) - X(z[0]), y1 - y0);
        K.t(ctx, z[3], (X(z[0]) + X(z[1])) / 2, y1 - 8, { s: 10.5, a: "center", c: KC.dim });
      });
      axes(ctx, x0, y0, x1, y1);
      for (var h = 0; h <= 36; h += 6) {
        K.t(ctx, h + "h", X(h), y1 + 18, { s: 10.5, a: "center", c: KC.mute, w: "600" });
        ctx.strokeStyle = KC.grid; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(X(h), y0); ctx.lineTo(X(h), y1); ctx.stroke();
      }
      K.t(ctx, "시간 →", x1, y1 + 36, { s: 11, a: "right", c: KC.mute });

      /* 전선 위치 */
      [[WARM_AT, "온난 전선 통과", KC.red], [COLD_AT, "한랭 전선 통과", KC.blue]].forEach(function (f) {
        ctx.save(); ctx.shadowColor = f[2]; ctx.shadowBlur = 6;
        ctx.strokeStyle = f[2]; ctx.setLineDash([6, 5]); ctx.lineWidth = 2.2;
        ctx.beginPath(); ctx.moveTo(X(f[0]), y0); ctx.lineTo(X(f[0]), y1); ctx.stroke(); ctx.restore();
        K.pill(ctx, f[1], clamp(X(f[0]), x0 + 50, x1 - 50), y0 - 8, { s: 11.5, a: "center", c: f[2] });
      });

      /* 곡선 */
      function curve(fn, Y, col) {
        ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 2.8; ctx.shadowColor = col; ctx.shadowBlur = 8; ctx.beginPath();
        for (var k = 0; k <= 180; k++) { var hh = k / 180 * 36, x = X(hh), y = Y(fn(hh)); if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
        ctx.stroke(); ctx.restore();
      }
      curve(tempAt, YT, KC.orange);
      curve(presAt, YP, KC.violet);
      K.pill(ctx, "기온", x0 + 8, YT(tempAt(1)) - 12, { s: 11.5, c: KC.orange });
      K.pill(ctx, "기압", x0 + 8, YP(presAt(1)) - 12, { s: 11.5, c: KC.violet });

      /* 현재 시각 */
      ctx.save(); ctx.strokeStyle = KC.yellow; ctx.lineWidth = 2; ctx.shadowColor = KC.yellow; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.moveTo(X(tt), y0); ctx.lineTo(X(tt), y1); ctx.stroke(); ctx.restore();
      K.glow(ctx, X(tt), YT(tempAt(tt)), 5, "rgba(255,179,92,.95)", 3.4);
      K.glow(ctx, X(tt), YP(presAt(tt)), 5, "rgba(182,156,255,.95)", 3.4);

      /* 오른쪽 판 */
      var RX = 712, px = RX + 14;
      ctx.fillStyle = "rgba(20,28,70,.6)"; ctx.beginPath(); ctx.roundRect(RX, 46, W - RX - 10, H - 56, 12); ctx.fill();
      K.t(ctx, tt.toFixed(1) + " 시간째", px, 78, { s: 18, w: "900", c: KC.yellow });
      K.t(ctx, "기온 " + tempAt(tt).toFixed(1) + " ℃", px, 108, { s: 14, w: "900", c: KC.orange });
      K.t(ctx, "기압 " + presAt(tt).toFixed(1) + " hPa", px, 134, { s: 14, w: "900", c: KC.violet });
      K.t(ctx, "바람 " + windAt(tt), px, 160, { s: 14, w: "900", c: KC.blue });
      K.pill(ctx, zoneAt(tt), px, 192, { s: 11.5, c: KC.ink, box: [RX, W - 10] });
      sky(px - 2, 214, W - px - 22, 120);
      K.t(ctx, "관측 지점의 하늘", px, 390, { s: 10.5, c: KC.dim });

      K.t(ctx, "기온은 온난 전선이 지날 때 오르고, 한랭 전선이 지날 때 급히 떨어집니다.", 90, 352, { s: 12.5, c: KC.mute });
      K.t(ctx, "기압은 저기압 중심이 가까워질수록 내려가고, 전선이 지나간 뒤 다시 오릅니다.", 90, 376, { s: 12.5, c: KC.mute });
      K.t(ctx, "바람은 남동풍 → 남서풍 → 북서풍으로, 시계 방향으로 바뀝니다.", 90, 400, { s: 12.5, c: KC.mute });
      K.t(ctx, "관측 지점은 저기압 중심의 남쪽을 지나고 있습니다.", 90, H - 18, { s: 11, c: KC.dim });

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

    function front(x, y, dx, dy, warm) {
      /* 전선 기호: 온난 전선은 빨간 반원, 한랭 전선은 파란 삼각형 (진행 방향 쪽에 붙는다) */
      var len = Math.sqrt(dx * dx + dy * dy), ux = dx / len, uy = dy / len, nx = uy, ny = -ux;
      var col = warm ? "#ff5a6e" : "#4fa8ff";
      ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 2.4;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + dx * .5 + nx * 6, y + dy * .5 + ny * 6, x + dx, y + dy); ctx.stroke();
      for (var k = 1; k <= 3; k++) {
        var s = k / 4, px = x + dx * s + nx * 3 * (1 - Math.abs(.5 - s) * 2), py = y + dy * s + ny * 3 * (1 - Math.abs(.5 - s) * 2);
        ctx.beginPath();
        if (warm) ctx.arc(px, py, 4.5, Math.atan2(uy, ux), Math.atan2(uy, ux) + Math.PI, true);
        else { ctx.moveTo(px - ux * 5, py - uy * 5); ctx.lineTo(px + ux * 5, py + uy * 5); ctx.lineTo(px + nx * 7, py + ny * 7); }
        ctx.closePath(); ctx.fill();
      }
    }
    function draw() {
      paper(ctx, W, H, "night", 121);
      var d4 = POS[2] + 24 * spd;
      head(ctx, "일기도 세 장과 내가 그린 네 번째 장");

      var bw = 190, bh = 150, gapx = 14, x0 = 30, y0 = 64;
      function box(i, label, cxkm, dashed) {
        var bx = x0 + i * (bw + gapx);
        ctx.save(); ctx.beginPath(); ctx.roundRect(bx, y0, bw, bh, 12); ctx.clip();
        var sg = ctx.createLinearGradient(bx, y0, bx, y0 + bh);
        sg.addColorStop(0, "#123a6e"); sg.addColorStop(1, "#0a2348");
        ctx.fillStyle = sg; ctx.fillRect(bx, y0, bw, bh);
        /* 대륙(서쪽)과 경위선 */
        var lg = ctx.createLinearGradient(bx, 0, bx + 50, 0); lg.addColorStop(0, "rgba(110,138,76,.55)"); lg.addColorStop(1, "rgba(110,138,76,.15)");
        ctx.fillStyle = lg; ctx.beginPath(); ctx.moveTo(bx, y0); ctx.lineTo(bx + 46, y0); ctx.quadraticCurveTo(bx + 30, y0 + bh * .5, bx + 52, y0 + bh); ctx.lineTo(bx, y0 + bh); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = "rgba(200,220,255,.08)"; ctx.lineWidth = 1;
        for (var g = 1; g < 4; g++) { ctx.beginPath(); ctx.moveTo(bx, y0 + g * bh / 4); ctx.lineTo(bx + bw, y0 + g * bh / 4); ctx.stroke(); ctx.beginPath(); ctx.moveTo(bx + g * bw / 4, y0); ctx.lineTo(bx + g * bw / 4, y0 + bh); ctx.stroke(); }
        /* 관측 지점(저기압이 지나는 길의 남쪽) */
        var ox = bx + bw * 0.72, oy = y0 + bh * 0.5, py = oy - 22;
        var lx = clamp(ox + cxkm / 3000 * bw * 1.6, bx + 16, bx + bw - 16);
        /* 등압선 */
        for (var r = 1; r <= 3; r++) { ctx.strokeStyle = "rgba(220,230,255," + (.5 - r * .1) + ")"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(lx, py, 14 + r * 13, 10 + r * 10, 0, 0, 6.2832); ctx.stroke(); }
        /* 전선 */
        front(lx, py, 46, 34, true);
        front(lx, py, -26, 52, false);
        K.glow(ctx, lx, py, 10, "rgba(120,170,255,.5)", 2);
        var cg = ctx.createRadialGradient(lx - 4, py - 4, 2, lx, py, 12);
        cg.addColorStop(0, "#bfe0ff"); cg.addColorStop(1, "#2a5fd0");
        ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(lx, py, 12, 0, Math.PI * 2); ctx.fill();
        K.t(ctx, "L", lx, py + 5, { s: 13, a: "center", w: "900", c: "#ffffff" });
        ctx.restore();
        K.glow(ctx, ox, oy + 28, 3.4, "rgba(255,236,190,.95)", 3);
        K.t(ctx, "관측 지점", ox, oy + 46, { s: 10, a: "center", c: KC.yellow, w: "800" });
        ctx.strokeStyle = dashed ? KC.yellow : "rgba(160,200,255,.35)"; ctx.lineWidth = dashed ? 2 : 1.2;
        if (dashed) ctx.setLineDash([6, 5]);
        ctx.beginPath(); ctx.roundRect(bx, y0, bw, bh, 12); ctx.stroke(); ctx.setLineDash([]);
        K.pill(ctx, label, bx + 4, y0 - 10, { s: 11.5, c: dashed ? KC.yellow : KC.mute, box: [bx - 4, bx + bw + 4] });
        K.pill(ctx, (cxkm < 0 ? "서쪽 " + Math.abs(Math.round(cxkm)) : "동쪽 " + Math.round(cxkm)) + " km",
          bx + bw / 2, y0 + bh + 22, { s: 11, a: "center", c: KC.ink, box: [bx - 4, bx + bw + 4] });
      }
      box(0, "1일차 (어제)", POS[0], false);
      box(1, "2일차 (오늘)", POS[1], false);
      box(2, "3일차 (내일)", POS[2], false);
      box(3, "4일차 (모레) · 예상", d4, true);
      /* 이동 방향 */
      K.arrow(ctx, { x: x0 + 40, y: y0 + bh + 44 }, { x: W - 40, y: y0 + bh + 44 }, "rgba(127,211,255,.55)", 2, 10);
      K.pill(ctx, "편서풍 따라 서 → 동", W / 2, y0 + bh + 49, { s: 11, a: "center", c: KC.blue });

      /* 계산 판 */
      var my = 290;
      ctx.fillStyle = "rgba(20,28,70,.55)"; ctx.beginPath(); ctx.roundRect(24, my - 24, 300, 116, 12); ctx.fill();
      K.t(ctx, "하루 사이에 옮겨 간 거리", 40, my, { s: 12.5, w: "800", c: KC.mute });
      K.t(ctx, "1 → 2 일차 : " + (POS[1] - POS[0]) + " km", 40, my + 26, { s: 13, c: KC.ink });
      K.t(ctx, "2 → 3 일차 : " + (POS[2] - POS[1]) + " km", 40, my + 50, { s: 13, c: KC.ink });
      K.t(ctx, "하루는 24시간입니다", 40, my + 74, { s: 12, c: KC.mute });

      var ok = Math.abs(spd - 40) <= 2;
      K.t(ctx, "내가 읽은 속도 " + spd + " km/h", 360, my + 4, { s: 18, w: "900", c: ok ? KC.green : KC.yellow });
      K.pill(ctx, ok ? "✅ 맞습니다" : (spd > 40 ? "너무 빠릅니다" : "아직 느립니다"), 360, my + 36, { s: 13.5, c: ok ? KC.green : KC.red });
      K.t(ctx, "→ 4일차 중심은 관측 지점 " + (d4 >= 0 ? "동쪽 " + Math.round(d4) : "서쪽 " + Math.abs(Math.round(d4))) + " km",
        360, my + 68, { s: 14, w: "900", c: KC.blue });
      K.t(ctx, ok ? "저기압 중심이 이미 지나갔습니다. 한랭 전선 뒤에 들어갑니다." : "속도를 맞히면 4일차 자리가 정확해집니다.",
        360, my + 94, { s: 12.5, c: KC.mute });
      K.t(ctx, "우리나라는 편서풍대에 있어 기압계가 서 → 동으로 이동합니다.", 40, H - 18, { s: 11, c: KC.mute });
      K.pill(ctx, "▲ 한랭 전선", W - 130, H - 18, { s: 11, a: "right", c: "#4fa8ff" });
      K.pill(ctx, "● 온난 전선", W - 24, H - 18, { s: 11, a: "right", c: "#ff5a6e" });

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
    function draw() {
      ctx.clearRect(0, 0, W, H);
      var p = corePress(), grows = (place === "sea" && sst >= SST_MIN);
      /* ── 왼쪽: 바다(또는 육지) 위 옆모습 ── */
      var LW = 500;
      K.stage(ctx, 0, 0, LW, H, "night", { seed: 131 });
      K.pill(ctx, (place === "land" ? "육지 위" : "열대 바다 위") + " · 옆에서 본 모습", 16, 28, { s: 13, c: KC.blue });
      var bx = 20, by = 60, bw = LW - 40, bh = 270, sy = by + bh - 50;
      /* 하늘 */
      var skg = ctx.createLinearGradient(0, by, 0, sy); skg.addColorStop(0, "rgba(40,60,120,.35)"); skg.addColorStop(1, "rgba(90,130,200,.25)");
      ctx.fillStyle = skg; ctx.beginPath(); ctx.roundRect(bx, by, bw, sy - by, [12, 12, 0, 0]); ctx.fill();
      /* 바다 · 육지 */
      if (place === "land") land(ctx, bx, sy, bw, 50);
      else {
        var warm = clamp((sst - 22) / 10, 0, 1);
        var og = ctx.createLinearGradient(0, sy, 0, sy + 50);
        og.addColorStop(0, "rgb(" + Math.round(30 + 60 * warm) + "," + Math.round(120 + 70 * warm) + "," + Math.round(200 - 20 * warm) + ")"); og.addColorStop(1, "#08244e");
        ctx.fillStyle = og; ctx.fillRect(bx, sy, bw, 50);
        ctx.strokeStyle = "rgba(220,240,255,.35)"; ctx.lineWidth = 1.2;
        for (var wv = 0; wv < 9; wv++) { var wx = bx + 20 + wv * 50 + Math.sin(tl * .1 + wv) * 4; ctx.beginPath(); ctx.moveTo(wx, sy + 8); ctx.quadraticCurveTo(wx + 10, sy + 3, wx + 20, sy + 8); ctx.stroke(); }
      }
      /* 수증기: 위로 올라가는 빛 알갱이 */
      var n = grows ? clamp(Math.round((sst - 26) * 6) + 8, 8, 40) : 3, R = K.rng(7);
      for (var i = 0; i < n; i++) {
        var x0 = bx + 30 + R() * (bw - 60), ph = (R() + tl * (grows ? 0.012 : 0.004)) % 1;
        var yy = sy - ph * (grows ? 200 : 60);
        ctx.globalAlpha = (1 - ph) * .9; K.glow(ctx, x0 + Math.sin(ph * 6 + i) * 6, yy, 1.8, "rgba(127,240,210,.95)", 3); ctx.globalAlpha = 1;
      }
      /* 적란운: 발달할수록 크게 */
      if (grows) {
        var cs = clamp((sst - 26) / 5, 0.3, 1);
        var cg = ctx.createLinearGradient(0, by + 10, 0, by + 110);
        cg.addColorStop(0, "rgba(250,252,255,.95)"); cg.addColorStop(1, "rgba(150,165,200,.85)");
        ctx.fillStyle = cg; ctx.beginPath();
        var ccx = bx + bw / 2;
        ctx.ellipse(ccx, by + 30, 150 * cs + 40, 22, 0, 0, 6.2832);
        for (var c2 = -2; c2 <= 2; c2++) { var pxc = ccx + c2 * 34 * cs, pyc = by + 70 + Math.abs(c2) * 6, prc = 30 * cs + 12; ctx.moveTo(pxc + prc, pyc); ctx.arc(pxc, pyc, prc, 0, 6.2832); }
        ctx.fill();
        K.pill(ctx, "응결 → 잠열 방출", ccx, by + 120 + 30 * cs, { s: 12, a: "center", c: KC.orange, box: [0, LW] });
      }
      K.pill(ctx, grows ? "수증기가 활발히 올라간다" : (place === "land" ? "수증기 공급이 끊겼다" : "바다가 차가워 수증기가 부족하다"),
        bx + bw / 2, sy + 36, { s: 12.5, a: "center", c: grows ? KC.green : KC.red, box: [0, LW] });
      K.t(ctx, "태풍은 해수면 수온 약 26.5 ℃ 이상인 열대 바다에서만 태어납니다.", 20, 362, { s: 12, c: KC.mute });
      K.t(ctx, "찬 바다나 육지를 만나면 수증기 공급이 끊겨 세력을 잃습니다.", 20, 386, { s: 12, c: KC.mute });
      K.t(ctx, "잠열 — 수증기가 물방울로 바뀌며 내놓는 열이 태풍의 에너지원입니다.", 20, H - 18, { s: 11, c: KC.mute });

      /* ── 오른쪽: 위성에서 본 소용돌이 ── */
      var RX = LW + 8, cx = RX + (W - RX) / 2, cy = 190, Rr = grows ? clamp(30 + (sst - 26) * 14, 30, 118) : 26;
      K.stage(ctx, RX, 0, W - RX, H, "space", { seed: 133 });
      K.pill(ctx, "위성에서 본 모습", RX + 16, 28, { s: 13, c: KC.blue });
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(-tl * (grows ? 0.02 : 0.006));   /* 북반구: 시계 반대 방향 */
      for (var k = 0; k < 5; k++) {
        ctx.beginPath();
        for (var s2 = 0; s2 <= 34; s2++) {
          var fr = s2 / 34, rr = Rr * 0.22 + fr * Rr * 0.85, ang = k * Math.PI * 2 / 5 + fr * 2.8;
          var x = Math.cos(ang) * rr, y = Math.sin(ang) * rr;
          if (s2 === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = grows ? "rgba(240,245,255,.55)" : "rgba(200,210,230,.3)"; ctx.lineWidth = grows ? Rr * .22 : 6; ctx.lineCap = "round"; ctx.stroke();
      }
      ctx.restore();
      if (grows) {
        var dg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Rr * .5);
        dg.addColorStop(0, "rgba(255,255,255,.0)"); dg.addColorStop(.35, "rgba(250,252,255,.85)"); dg.addColorStop(1, "rgba(250,252,255,0)");
        ctx.fillStyle = dg; ctx.beginPath(); ctx.arc(cx, cy, Rr * .5, 0, 6.2832); ctx.fill();
        if (p <= 980) { ctx.fillStyle = "#0b1030"; ctx.beginPath(); ctx.arc(cx, cy, clamp(Rr * .08, 3, 9), 0, 6.2832); ctx.fill(); K.pill(ctx, "태풍의 눈", cx + Rr * .2 + 10, cy - Rr * .2 - 6, { s: 11, c: KC.ink, box: [RX, W] }); }
      }
      K.t(ctx, "중심 기압", cx, 336, { s: 12, a: "center", w: "800", c: KC.mute });
      var pc = p <= 940 ? KC.red : (grows ? KC.violet : KC.mute);
      K.t(ctx, p.toFixed(0) + " hPa", cx, 372, { s: 28, a: "center", w: "900", c: pc });
      K.pill(ctx, grows ? (p <= 940 ? "매우 강한 태풍" : (p <= 980 ? "발달 중" : "약한 열대 저압부")) : (place === "land" ? "세력이 빠르게 약해짐" : "태풍으로 발달하지 못함"),
        cx, 404, { s: 12.5, a: "center", c: pc, box: [RX, W] });

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
      var dpr = window.devicePixelRatio || 1;
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
      K.stage(ctx, 0, y0, W, h, "lab", { seed: 143 });
      var RW = 230;
      var g = K.chart(ctx, { x: 4, y: y0 + 22, w: W - RW - 8, h: h - 24, pt: 10, pb: 30, x0: 0, x1: 400, y0: 0, y1: 55, xt: 4, yt: 5, xl: "중심에서의 거리(km) →", xf: function (q) { return q + ""; } });
      K.pill(ctx, "중심에서 멀어지며 재 보기", 14, y0 + 22, { s: 12, c: KC.blue });
      function YP(pp) { return g.B - (pp - 950) / 62 * (g.B - g.T); }
      [[0, 25, "rgba(255,255,255,.05)"], [25, 70, "rgba(255,107,129,.14)"], [70, 250, "rgba(127,211,255,.07)"]].forEach(function (z) { ctx.fillStyle = z[2]; ctx.fillRect(g.X(z[0]), g.T, g.X(z[1]) - g.X(z[0]), g.B - g.T); });
      function curve(fn, Y, col) {
        ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 2.8; ctx.shadowColor = col; ctx.shadowBlur = 8; ctx.beginPath();
        for (var k2 = 0; k2 <= 200; k2++) { var rr2 = k2 * 2, x2 = g.X(rr2), y2 = Y(fn(rr2)); if (k2 === 0) ctx.moveTo(x2, y2); else ctx.lineTo(x2, y2); }
        ctx.stroke(); ctx.restore();
      }
      curve(wind, g.Y, KC.red);
      curve(pres, YP, KC.violet);
      K.pill(ctx, "풍속(m/s)", g.X(78), g.Y(50) + 4, { s: 11, c: KC.red });
      K.pill(ctx, "기압", g.X(330), YP(pres(330)) - 10, { s: 11, c: KC.violet });
      K.line(ctx, { x: g.X(r), y: g.T }, { x: g.X(r), y: g.B }, KC.yellow, 2);
      K.glow(ctx, g.X(r), g.Y(vv), 5, "rgba(255,107,129,.95)", 3.4);
      K.glow(ctx, g.X(r), YP(p), 5, "rgba(182,156,255,.95)", 3.4);
      /* 오른쪽 읽음판 */
      var rx = W - RW + 6, z0 = zone(r);
      K.t(ctx, "거리 " + r + " km", rx, y0 + 30, { s: 13, w: "800", c: KC.yellow });
      K.t(ctx, z0, rx, y0 + 60, { s: 17, w: "900", c: KC.orange });
      K.t(ctx, "풍속 " + vv.toFixed(1) + " m/s", rx, y0 + 90, { s: 15, w: "800", c: KC.red });
      K.t(ctx, "기압 " + p.toFixed(1) + " hPa", rx, y0 + 116, { s: 15, w: "800", c: KC.violet });
      var DS = { "태풍의 눈": ["하강 기류 — 바람이 약하고", "하늘이 갠다"], "눈벽구름": ["가장 강한 상승 기류 —", "최대 풍속과 폭우"],
        "나선 강우대": ["돌풍성 비바람이 띠를 이루며", "지나간다"], "태풍 바깥 영역": ["구름이 많고 바람이", "조금 강한 정도"] }[z0];
      K.t(ctx, DS[0], rx, y0 + 148, { s: 12, w: "700", c: KC.ink });
      K.t(ctx, DS[1], rx, y0 + 168, { s: 12, w: "700", c: KC.ink });
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
    function draw() {
      ctx.clearRect(0, 0, W, H);
      var vR = vAt("R"), vL = vAt("L"), vv = vAt(side);
      var LW = 500;
      K.stage(ctx, 0, 0, LW, H, "ocean", { seed: 151 });
      K.pill(ctx, "태풍은 돌면서 동시에 움직인다 — 위에서 본 모습", 16, 28, { s: 13, c: KC.blue });

      /* 평면도 : 태풍은 화면 위쪽(북동)으로 이동 */
      var cx = 250, cy = 240, R = 120;
      var hg = ctx.createRadialGradient(cx, cy, 10, cx, cy, R);
      hg.addColorStop(0, "rgba(255,107,129,.30)"); hg.addColorStop(1, "rgba(255,107,129,.08)");
      ctx.fillStyle = hg; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, -Math.PI / 2, Math.PI / 2); ctx.closePath(); ctx.fill();
      var tg = ctx.createRadialGradient(cx, cy, 10, cx, cy, R);
      tg.addColorStop(0, "rgba(63,211,163,.26)"); tg.addColorStop(1, "rgba(63,211,163,.06)");
      ctx.fillStyle = tg; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, Math.PI / 2, Math.PI * 1.5); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "rgba(220,230,255,.4)"; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([4, 5]); ctx.beginPath(); ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R); ctx.stroke(); ctx.setLineDash([]);
      /* 구름 소용돌이(시계 반대 방향) */
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(-th * 0.02);
      for (var a = 0; a < 4; a++) {
        ctx.beginPath();
        for (var s2 = 0; s2 <= 30; s2++) { var fr = s2 / 30, rr = 14 + fr * R * .9, an = a * Math.PI / 2 + fr * 2.6; if (s2) ctx.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); else ctx.moveTo(Math.cos(an) * rr, Math.sin(an) * rr); }
        ctx.strokeStyle = "rgba(240,245,255,.22)"; ctx.lineWidth = 12; ctx.lineCap = "round"; ctx.stroke();
      }
      ctx.restore();
      /* 회전 바람 (반시계) — 오른쪽은 더해져 길게, 왼쪽은 빼져 짧게 */
      for (var k = 0; k < 12; k++) {
        var ang = k / 12 * Math.PI * 2 - th * 0.03;
        var x = cx + Math.cos(ang) * R * 0.72, y = cy + Math.sin(ang) * R * 0.72;
        /* 회전 속도 + 이동 속도(위쪽) */
        var tx = Math.sin(ang) * VROT, ty = -Math.cos(ang) * VROT - vm;
        var sp = Math.sqrt(tx * tx + ty * ty), L = 8 + sp * 0.42;
        ctx.save(); ctx.translate(x, y); ctx.rotate(Math.atan2(ty, tx));
        var sg = ctx.createLinearGradient(-L, 0, 6, 0); sg.addColorStop(0, "rgba(182,156,255,0)"); sg.addColorStop(1, KC.violet);
        ctx.strokeStyle = sg; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(-L, 0); ctx.lineTo(2, 0); ctx.stroke();
        ctx.fillStyle = KC.violet; ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(-3, -4.5); ctx.lineTo(-3, 4.5); ctx.closePath(); ctx.fill();
        ctx.restore();
      }
      var eg = ctx.createRadialGradient(cx - 4, cy - 4, 2, cx, cy, 16);
      eg.addColorStop(0, "#ffd0d6"); eg.addColorStop(1, "#d23a52");
      ctx.fillStyle = eg; ctx.beginPath(); ctx.arc(cx, cy, 14, 0, Math.PI * 2); ctx.fill();
      /* 이동 방향 */
      ctx.save(); ctx.shadowColor = KC.yellow; ctx.shadowBlur = 8;
      K.arrow(ctx, { x: cx, y: cy - 18 }, { x: cx, y: cy - R - 34 }, KC.yellow, 4.5, 13);
      ctx.restore();
      K.pill(ctx, "태풍의 진행 방향", cx, cy - R - 42, { s: 12, a: "center", c: KC.yellow });
      K.pill(ctx, "위험 반원", cx + R + 12, cy - 10, { s: 12, c: KC.red, box: [0, LW] });
      K.pill(ctx, "가항 반원", cx - R - 12, cy - 10, { s: 12, a: "right", c: KC.green, box: [0, LW] });
      /* 관측 도시 */
      var ox = cx + (side === "R" ? 1 : -1) * R * 0.95;
      K.glow(ctx, ox, cy + 40, 4.5, "rgba(255,236,190,.95)", 3.4);
      K.pill(ctx, "관측 도시", ox, cy + 66, { s: 11, a: "center", c: KC.ink, box: [0, LW] });
      K.t(ctx, "보라 화살표 길이 = 실제로 부는 바람의 세기", 16, H - 18, { s: 11, c: KC.mute });

      /* ── 오른쪽: 계산 막대 ── */
      var RX = LW + 8, px = RX + 20, bw = W - px - 110;
      K.stage(ctx, RX, 0, W - RX, H, "lab", { seed: 153 });
      K.pill(ctx, "회전 바람 ± 이동 속도", px - 4, 28, { s: 13, c: KC.blue });
      K.t(ctx, "회전 바람 " + VROT + " m/s + 이동 속도 " + vm.toFixed(1) + " m/s", px, 76, { s: 12.5, w: "800", c: KC.mute });
      [["오른쪽 (위험 반원)", vR, KC.red, "rgba(255,107,129,"], ["왼쪽 (가항 반원)", vL, KC.green, "rgba(63,211,163,"]].forEach(function (b, i) {
        var yy = 120 + i * 84;
        K.t(ctx, b[0], px, yy, { s: 12.5, w: "800", c: b[2] });
        ctx.fillStyle = "rgba(255,255,255,.07)"; ctx.beginPath(); ctx.roundRect(px, yy + 10, bw, 22, 11); ctx.fill();
        var bgc = ctx.createLinearGradient(px, 0, px + bw, 0); bgc.addColorStop(0, b[3] + ".35)"); bgc.addColorStop(1, b[3] + ".95)");
        ctx.save(); ctx.shadowColor = b[2]; ctx.shadowBlur = 8; ctx.fillStyle = bgc; ctx.beginPath(); ctx.roundRect(px, yy + 10, Math.max(8, bw * clamp(b[1] / 60, 0, 1)), 22, 11); ctx.fill(); ctx.restore();
        K.t(ctx, b[1].toFixed(1) + " m/s", px + bw + 8, yy + 27, { s: 14, w: "900", c: b[2] });
      });
      K.pill(ctx, "두 반원의 차이 " + (vR - vL).toFixed(1) + " m/s", px, 316, { s: 14, c: KC.yellow, box: [RX, W] });
      K.pill(ctx, "내가 고른 자리의 풍속 " + vv.toFixed(1) + " m/s", px, 352, { s: 14, c: KC.ink, box: [RX, W] });
      K.t(ctx, "북반구 태풍의 바람은 반시계 방향입니다.", px, 394, { s: 11.5, c: KC.mute });
      K.t(ctx, "오른쪽에서는 회전 바람과 이동이 더해집니다.", px, 414, { s: 11.5, c: KC.mute });
      K.t(ctx, "매미는 상륙 뒤 북동쪽으로 달렸습니다.", px, 440, { s: 11, c: KC.dim });
      K.t(ctx, "진로의 동쪽 도시들이 위험 반원에 들었습니다.", px, 458, { s: 11, c: KC.dim });

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
    function puff(p, dark) {
      var g = ctx.createRadialGradient(p[0] - p[2] * .3, p[1] - p[2] * .45, p[2] * .1, p[0], p[1], p[2]);
      if (dark) { g.addColorStop(0, "#e9edf6"); g.addColorStop(.6, "#9aa3b8"); g.addColorStop(1, "#5a6178"); }
      else { g.addColorStop(0, "#ffffff"); g.addColorStop(.7, "#e3e9f6"); g.addColorStop(1, "#b5c0d8"); }
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p[0], p[1], p[2], 0, Math.PI * 2); ctx.fill();
    }
    function flowDots(x, y0, y1, col, n, speed) {
      for (var i = 0; i < n; i++) {
        var u = ((i / n) + ts * speed) % 1, y = y0 + (y1 - y0) * u;
        ctx.globalAlpha = Math.sin(u * Math.PI); K.glow(ctx, x + Math.sin(u * 8 + i) * 4, y, 2.2, col, 3); ctx.globalAlpha = 1;
      }
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      K.stage(ctx, 0, 0, W, H, "night", { seed: 161 });
      var sk = ctx.createLinearGradient(0, 0, 0, H);
      if (stage === 0) { sk.addColorStop(0, "rgba(45,111,192,.75)"); sk.addColorStop(1, "rgba(140,196,239,.55)"); }
      else if (stage === 1) { sk.addColorStop(0, "rgba(20,24,44,.9)"); sk.addColorStop(1, "rgba(60,66,90,.8)"); }
      else { sk.addColorStop(0, "rgba(50,62,96,.8)"); sk.addColorStop(1, "rgba(110,124,156,.6)"); }
      ctx.save(); ctx.beginPath(); ctx.roundRect(0, 0, W, H, 14); ctx.clip(); ctx.fillStyle = sk; ctx.fillRect(0, 0, W, H); ctx.restore();
      K.pill(ctx, "뇌우의 한살이 — " + NAMES[stage], 16, 28, { s: 13, c: stage === 0 ? "#ffffff" : KC.blue, bg: "rgba(9,12,34,.6)" });
      var ground = H - 90, cx = 430;
      if (stage === 0) { K.sun(ctx, 790, 86, 16); K.pill(ctx, "햇볕에 데워진 땅 → 따뜻하고 습한 공기", 870, ground - 14, { s: 11, a: "right", c: KC.orange }); }
      ctx.save(); ctx.beginPath(); ctx.roundRect(0, 0, W, H, 14); ctx.clip();
      land(ctx, 0, ground, W, H - ground);
      ctx.restore();

      var top = stage === 1 ? 70 : (stage === 0 ? 170 : 120);
      var puffs = stage === 1
        ? [[cx, top + 120, 84], [cx - 68, top + 168, 64], [cx + 68, top + 168, 64], [cx, top + 52, 56], [cx, top + 6, 38]]
        : (stage === 0
          ? [[cx, top + 78, 64], [cx - 38, top + 112, 50], [cx + 38, top + 112, 50]]
          : [[cx, top + 118, 56], [cx - 56, top + 138, 42], [cx + 56, top + 138, 42]]);
      /* 성숙 단계: 꼭대기가 대류권 위에서 퍼진 모루 */
      if (stage === 1) {
        var ag = ctx.createLinearGradient(0, top - 30, 0, top + 20); ag.addColorStop(0, "#f4f6ff"); ag.addColorStop(1, "#aab3c8");
        ctx.fillStyle = ag; ctx.beginPath(); ctx.ellipse(cx + 40, top - 8, 190, 22, 0, 0, Math.PI * 2); ctx.fill();
        K.pill(ctx, "대류권 위쪽까지 자란 꼭대기(모루)", cx + 240, top - 30, { s: 11, a: "right", c: KC.ink, box: [0, W] });
      }
      /* 구름: 여러 덩이를 한 덩어리로 묶어 위는 밝고 아래는 어둡게 */
      var minY = 1e9, maxY = -1e9;
      puffs.forEach(function (p) { minY = Math.min(minY, p[1] - p[2]); maxY = Math.max(maxY, p[1] + p[2]); });
      var cgr = ctx.createLinearGradient(0, minY, 0, maxY);
      if (stage === 0) { cgr.addColorStop(0, "#ffffff"); cgr.addColorStop(1, "#c3cde2"); }
      else { cgr.addColorStop(0, "#eef1f8"); cgr.addColorStop(.55, "#a5adc2"); cgr.addColorStop(1, "#4c536a"); }
      ctx.fillStyle = cgr; ctx.beginPath();
      puffs.forEach(function (p) { ctx.moveTo(p[0] + p[2], p[1]); ctx.arc(p[0], p[1], p[2], 0, Math.PI * 2); });
      ctx.fill();
      puffs.forEach(function (p) {
        var hg = ctx.createRadialGradient(p[0] - p[2] * .35, p[1] - p[2] * .45, 2, p[0] - p[2] * .2, p[1] - p[2] * .3, p[2] * .9);
        hg.addColorStop(0, "rgba(255,255,255,.35)"); hg.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(p[0], p[1], p[2], 0, Math.PI * 2); ctx.fill();
      });

      if (stage === 0) {
        ctx.save(); ctx.shadowColor = KC.orange; ctx.shadowBlur = 8;
        K.arrow(ctx, { x: cx - 24, y: ground - 10 }, { x: cx - 24, y: top + 140 }, KC.orange, 4, 11);
        K.arrow(ctx, { x: cx + 24, y: ground - 10 }, { x: cx + 24, y: top + 140 }, KC.orange, 4, 11);
        ctx.restore();
        flowDots(cx - 60, ground - 10, top + 150, "rgba(255,179,92,.95)", 6, 0.012);
        flowDots(cx + 60, ground - 10, top + 150, "rgba(255,179,92,.95)", 6, 0.012);
        K.pill(ctx, "상승 기류만 있다", cx, ground + 30, { s: 12.5, a: "center", c: KC.orange });
      } else if (stage === 1) {
        /* 비 */
        var R = K.rng(3);
        ctx.strokeStyle = "rgba(170,210,255,.75)"; ctx.lineWidth = 1.6;
        for (var i = 0; i < 40; i++) {
          var rx = cx + 20 + R() * 120, ry = top + 200 + ((R() * 200 + ts * 6) % (ground - top - 200));
          ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx - 3, ry + 12); ctx.stroke();
        }
        ctx.save(); ctx.shadowBlur = 8;
        ctx.shadowColor = KC.orange; K.arrow(ctx, { x: cx - 64, y: ground - 10 }, { x: cx - 64, y: top + 110 }, KC.orange, 4, 11);
        ctx.shadowColor = KC.blue; K.arrow(ctx, { x: cx + 74, y: top + 120 }, { x: cx + 74, y: ground - 10 }, KC.blue, 4, 11);
        ctx.restore();
        flowDots(cx - 100, ground - 10, top + 120, "rgba(255,179,92,.95)", 7, 0.014);
        flowDots(cx + 160, top + 130, ground - 10, "rgba(127,211,255,.95)", 7, 0.014);
        /* 번개: 가끔 번쩍 */
        var fl = (ts % 60) < 3;
        if (fl) {
          ctx.save(); ctx.strokeStyle = "#fff6c8"; ctx.lineWidth = 3; ctx.shadowColor = "#fff2a0"; ctx.shadowBlur = 18;
          ctx.beginPath(); ctx.moveTo(cx - 10, top + 180); ctx.lineTo(cx - 26, top + 230); ctx.lineTo(cx - 8, top + 232); ctx.lineTo(cx - 30, ground - 4); ctx.stroke(); ctx.restore();
        }
        K.pill(ctx, "⚡ 번개 · 우박 · 돌풍", cx - 140, top + 230, { s: 11.5, a: "right", c: KC.yellow });
        K.pill(ctx, "상승 기류", cx - 64, ground + 30, { s: 12.5, a: "center", c: KC.orange });
        K.pill(ctx, "하강 기류 + 강수", cx + 74, ground + 30, { s: 12.5, a: "center", c: KC.blue });
      } else {
        var R2 = K.rng(4);
        ctx.strokeStyle = "rgba(170,210,255,.45)"; ctx.lineWidth = 1.2;
        for (var j = 0; j < 14; j++) {
          var rx2 = cx - 60 + R2() * 120, ry2 = top + 180 + ((R2() * 160 + ts * 3) % (ground - top - 180));
          ctx.beginPath(); ctx.moveTo(rx2, ry2); ctx.lineTo(rx2 - 2, ry2 + 8); ctx.stroke();
        }
        ctx.save(); ctx.shadowColor = KC.blue; ctx.shadowBlur = 8;
        K.arrow(ctx, { x: cx, y: top + 160 }, { x: cx, y: ground - 10 }, KC.blue, 4, 11);
        ctx.restore();
        flowDots(cx + 30, top + 160, ground - 10, "rgba(127,211,255,.9)", 6, 0.008);
        K.pill(ctx, "하강 기류만 남고 비가 약해진다", cx, ground + 30, { s: 12.5, a: "center", c: KC.blue });
      }
      K.t(ctx, "뇌우가 한곳에 오래 머물거나 잇따라 지나가면 집중 호우가 됩니다.", 24, H - 18, { s: 11, c: "#e2e8f5" });

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
    function draw() {
      ctx.clearRect(0, 0, W, H);
      var dT = sea - air, strong = dT >= 15, weak = dT <= 10;
      var LW = 640;
      K.stage(ctx, 0, 0, LW, H, "night", { seed: 171 });
      K.pill(ctx, "겨울 서해안 폭설 — 찬 공기가 따뜻한 바다를 건널 때", 16, 28, { s: 13, c: KC.blue });

      var seaY = 260, x0 = 20, x1 = 520;
      /* 바다: 수온이 높을수록 김(수증기)이 피어오른다 */
      var sg = ctx.createLinearGradient(0, seaY, 0, H);
      var wm = clamp(sea / 15, 0, 1);
      sg.addColorStop(0, "rgb(" + Math.round(30 + 50 * wm) + "," + Math.round(100 + 60 * wm) + "," + Math.round(170 + 30 * wm) + ")"); sg.addColorStop(1, "#06204a");
      ctx.save(); ctx.beginPath(); ctx.roundRect(0, 0, LW, H, 14); ctx.clip();
      ctx.fillStyle = sg; ctx.fillRect(0, seaY, x1, H - seaY);
      /* 서해안 육지(눈 덮임) */
      var lg = ctx.createLinearGradient(0, seaY - 26, 0, H); lg.addColorStop(0, "#e8eef8"); lg.addColorStop(.12, "#c9d3e2"); lg.addColorStop(.2, "#5b6b3a"); lg.addColorStop(1, "#3a3424");
      ctx.fillStyle = lg; ctx.beginPath(); ctx.moveTo(x1, seaY); ctx.lineTo(x1 + 14, seaY - 26); ctx.lineTo(LW, seaY - 30); ctx.lineTo(LW, H); ctx.lineTo(x1, H); ctx.closePath(); ctx.fill();
      ctx.restore();
      ctx.strokeStyle = "rgba(220,240,255,.45)"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x0, seaY); ctx.lineTo(x1, seaY); ctx.stroke();
      /* 바다 김 */
      var R = K.rng(8), nSteam = Math.round(clamp(dT, 0, 30));
      for (var s = 0; s < nSteam; s++) {
        var sx = x0 + 20 + R() * (x1 - 60), ph = (R() + tw * 0.01) % 1;
        ctx.globalAlpha = (1 - ph) * .35; ctx.fillStyle = "#e8f3ff"; ctx.beginPath(); ctx.arc(sx + ph * 20, seaY - ph * 40, 4 + ph * 6, 0, 6.2832); ctx.fill();
      }
      ctx.globalAlpha = 1;
      K.pill(ctx, "서해 (수온 " + sea.toFixed(1) + " ℃)", x0 + 10, seaY + 44, { s: 12, c: KC.blue });
      K.pill(ctx, "서해안", x1 + 60, seaY + 44, { s: 12, a: "center", c: "#e2f2cf", box: [0, LW] });

      /* 찬 공기 */
      ctx.save(); ctx.shadowColor = KC.blue; ctx.shadowBlur = 10;
      var ag = ctx.createLinearGradient(x0, 0, x0 + 150, 0); ag.addColorStop(0, "rgba(127,211,255,0)"); ag.addColorStop(1, KC.blue);
      ctx.strokeStyle = ag; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x0, 86); ctx.lineTo(x0 + 140, 86); ctx.stroke();
      K.arrow(ctx, { x: x0 + 120, y: 86 }, { x: x0 + 156, y: 86 }, KC.blue, 5, 14);
      ctx.restore();
      K.pill(ctx, "시베리아 찬 공기 (" + air + " ℃)", x0 + 166, 91, { s: 12.5, c: KC.blue });

      /* 눈구름 */
      var ch = clamp((dT - 4) * 9, 0, 150);
      if (ch > 12) {
        for (var j = 0; j < 4; j++) {
          var ax = x0 + 130 + j * 96;
          ctx.save(); ctx.shadowColor = KC.green; ctx.shadowBlur = 6;
          K.arrow(ctx, { x: ax, y: seaY - 12 }, { x: ax, y: seaY - 24 - ch * (0.3 + j * 0.12) }, "rgba(63,211,163,.85)", 3, 9);
          ctx.restore();
        }
        for (var i = 0; i < 5; i++) {
          var cx2 = x0 + 100 + i * 86, cy2 = seaY - 28 - ch * (0.4 + i * 0.13), cr = 22 + ch * 0.14;
          var cg = ctx.createRadialGradient(cx2 - cr * .3, cy2 - cr * .4, cr * .1, cx2, cy2, cr);
          cg.addColorStop(0, "#ffffff"); cg.addColorStop(.7, "#cbd3e4"); cg.addColorStop(1, "rgba(140,150,175,.85)");
          ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(cx2, cy2, cr, 0, Math.PI * 2); ctx.fill();
        }
        K.pill(ctx, "구름 꼭대기 높이 약 " + Math.round(ch * 14) + " m", x0 + 10, Math.max(seaY - 40 - ch * 0.9, 122), { s: 11.5, c: KC.green });
        /* 해안에 내리는 눈 */
        var R2 = K.rng(21), nSnow = strong ? 60 : Math.round(ch / 5);
        for (var f = 0; f < nSnow; f++) {
          var fx = x1 - 160 + R2() * 270, fy = seaY - 150 + ((R2() * 200 + tw * 1.6) % 210);
          fx += Math.sin(tw * .05 + f) * 4;
          ctx.globalAlpha = .85; ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(fx, fy, 1.6 + (f % 3) * .5, 0, 6.2832); ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      /* ── 오른쪽 판 ── */
      var RX = LW + 8, px = RX + 18;
      K.stage(ctx, RX, 0, W - RX, H, "lab", { seed: 173 });
      K.pill(ctx, "해기차", px - 2, 28, { s: 13, c: KC.blue });
      K.t(ctx, "해기차 (바다 − 공기)", px, 78, { s: 12, w: "800", c: KC.mute });
      var vc = strong ? KC.red : (weak ? KC.mute : KC.yellow);
      K.t(ctx, dT.toFixed(1) + " ℃", px, 120, { s: 32, w: "900", c: vc });
      K.pill(ctx, strong ? "눈구름이 크게 발달" : (weak ? "눈구름이 자라지 못함" : "구름이 조금 생김"), px, 156, { s: 12.5, c: vc, box: [RX, W] });
      /* 온도 막대: 공기와 바다 */
      var gx = px, gw = W - 18 - px, gy = 196;
      function TX(c) { return gx + (c + 25) / 40 * gw; }
      ctx.fillStyle = "rgba(255,255,255,.07)"; ctx.beginPath(); ctx.roundRect(gx, gy, gw, 10, 5); ctx.fill();
      var tg = ctx.createLinearGradient(TX(air), 0, TX(sea), 0); tg.addColorStop(0, KC.blue); tg.addColorStop(1, KC.orange);
      ctx.fillStyle = tg; ctx.fillRect(TX(air), gy, Math.max(2, TX(sea) - TX(air)), 10);
      K.glow(ctx, TX(air), gy + 5, 3.5, "rgba(127,211,255,.95)", 3); K.glow(ctx, TX(sea), gy + 5, 3.5, "rgba(255,179,92,.95)", 3);
      K.t(ctx, "공기", TX(air), gy + 26, { s: 10.5, a: "center", c: KC.blue }); K.t(ctx, "바다", TX(sea), gy - 6, { s: 10.5, a: "center", c: KC.orange });
      K.t(ctx, "아래가 따뜻하면 공기가", px, 256, { s: 11.5, c: KC.mute });
      K.t(ctx, "불안정해져 위로 솟습니다", px, 276, { s: 11.5, c: KC.mute });
      K.t(ctx, "해기차가 클수록", px, 306, { s: 11.5, c: KC.mute });
      K.t(ctx, "눈구름이 높이 자랍니다", px, 326, { s: 11.5, c: KC.mute });
      K.t(ctx, "찬 공기가 따뜻한 바다를 건너며 열과 수증기를 받아 불안정해지고 눈구름대가 생깁니다.", 20, H - 16, { s: 10.5, c: "#e2e8f5" });

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
