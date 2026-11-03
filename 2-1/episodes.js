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

    function draw() {
      ctx.clearRect(0, 0, W, H);
      var vv = speed(dUm), t = depth / vv;
      /* ── 왼쪽: 물기둥 ── */
      var LW = 320;
      K.stage(ctx, 0, 0, LW, H, "ocean", { seed: 301 });
      K.pill(ctx, "잔잔한 물속 알갱이", 16, 28, { s: 13, c: KC.blue });
      var wx0 = 70, wx1 = 250, wy0 = 66, wy1 = 336;
      water(ctx, wx0, wy0, wx1 - wx0, wy1 - wy0, "rgba(90,180,230,.45)", "rgba(10,40,90,.85)");
      ctx.strokeStyle = "rgba(200,230,255,.35)"; ctx.lineWidth = 1.5; ctx.strokeRect(wx0, wy0, wx1 - wx0, wy1 - wy0);
      ctx.strokeStyle = "rgba(220,240,255,.7)"; ctx.beginPath();
      for (var q = 0; q <= 30; q++) { var sx = wx0 + q / 30 * (wx1 - wx0), sy = wy0 + Math.sin(q / 3 + tick * .08) * 1.5; if (q) ctx.lineTo(sx, sy); else ctx.moveTo(sx, sy); }
      ctx.stroke();
      /* 바닥 퇴적물: 아래 굵고 위 고운 점이층 */
      var sg = ctx.createLinearGradient(0, wy1 - 18, 0, wy1); sg.addColorStop(0, "#b8a27a"); sg.addColorStop(1, "#7a5d3a");
      ctx.fillStyle = sg; ctx.fillRect(wx0, wy1 - 18, wx1 - wx0, 18);
      var R = K.rng(5);
      for (var s = 0; s < 40; s++) { var px = wx0 + 4 + R() * (wx1 - wx0 - 8), py = wy1 - 2 - R() * 14, pr = 1 + (py - (wy1 - 18)) / 18 * 2.4; ctx.fillStyle = "rgba(60,40,20,.45)"; ctx.beginPath(); ctx.arc(px, py, pr, 0, 6.2832); ctx.fill(); }
      K.pill(ctx, "수면", wx0, wy0 - 8, { s: 11, c: "#bfe6ff" });
      K.pill(ctx, "바닥 (깊이 " + depth + " m)", wx0, wy1 + 24, { s: 11, c: KC.ink });
      /* 가라앉는 알갱이 */
      var u = (tick % 40) / 40;
      var gr = clamp(2 + Math.log(dUm) / Math.LN10 * 3.4, 2.5, 15);
      var gx = (wx0 + wx1) / 2, gy = wy0 + 10 + u * (wy1 - wy0 - 36);
      var tr = ctx.createLinearGradient(0, gy - 50, 0, gy); tr.addColorStop(0, "rgba(255,255,255,0)"); tr.addColorStop(1, "rgba(255,220,170,.35)");
      ctx.strokeStyle = tr; ctx.lineWidth = gr; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(gx, Math.max(wy0, gy - 50)); ctx.lineTo(gx, gy); ctx.stroke(); ctx.lineCap = "butt";
      K.planet(ctx, gx, gy, gr, "#d9b98a", "#6b4a26");
      K.warn(ctx, 16, H - 16, "⚠ 알갱이 크기는 과장");

      /* ── 오른쪽: 결과 ── */
      var RX = LW + 8, px0 = RX + 22;
      K.stage(ctx, RX, 0, W - RX, H, "lab", { seed: 303 });
      K.pill(ctx, "바닥까지 걸리는 시간", px0 - 6, 28, { s: 13, c: KC.blue });
      K.t(ctx, "입자 지름", px0, 70, { s: 11.5, w: "800", c: KC.mute });
      K.t(ctx, (dUm / 1000).toFixed(3) + " mm", px0, 100, { s: 24, w: "900", c: KC.blue });
      K.pill(ctx, grainName(dUm), px0 + 170, 98, { s: 13, c: "#e6d3b0" });
      K.t(ctx, "침강 속도", px0, 136, { s: 11.5, w: "800", c: KC.mute });
      K.t(ctx, vv < 0.001 ? (vv * 1000).toFixed(3) + " mm/s" : vv.toFixed(3) + " m/s", px0, 162, { s: 16, w: "900", c: KC.ink });
      K.t(ctx, "걸리는 시간", px0, 198, { s: 11.5, w: "800", c: KC.mute });
      var tc = (t >= 86400 || t <= 60) ? KC.green : KC.yellow;
      K.t(ctx, fmtSec(t), px0, 230, { s: 28, w: "900", c: tc });

      /* 로그 눈금 */
      var ly = 300;
      var lg = ctx.createLinearGradient(350, 0, 860, 0); lg.addColorStop(0, "rgba(255,179,92,.6)"); lg.addColorStop(1, "rgba(127,211,255,.6)");
      ctx.fillStyle = lg; ctx.beginPath(); ctx.roundRect(350, ly - 4, 510, 8, 4); ctx.fill();
      [[1, "1초"], [60, "1분"], [3600, "1시간"], [86400, "1일"], [2592000, "한 달"], [31536000, "1년"], [3153600000, "100년"]].forEach(function (m) {
        var x = LX(m[0]);
        ctx.strokeStyle = KC.line; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, ly + 4); ctx.lineTo(x, ly + 10); ctx.stroke();
        K.t(ctx, m[1], clamp(x, 360, 852), ly + 26, { s: 10.5, a: "center", c: KC.mute, w: "600" });
      });
      K.glow(ctx, LX(t), ly, 6, "rgba(255,211,107,.95)", 3);
      K.pill(ctx, "지금 이 알갱이", clamp(LX(t), 400, 800), ly - 16, { s: 11.5, a: "center", c: KC.yellow });
      K.t(ctx, "← 굵은 모래: 금방 바닥에", 350, 352, { s: 11, c: KC.orange });
      K.t(ctx, "고운 점토: 며칠씩 떠 있다 →", 860, 352, { s: 11, a: "right", c: KC.blue });
      K.t(ctx, "고운 입자일수록 오래 떠 있다가 뒤늦게 가라앉습니다 — 이것이 점이층리를 만듭니다.", 350, 380, { s: 11.5, c: KC.mute });
      K.t(ctx, "스토크스 법칙 : 침강 속도 ∝ (반지름)²", 350, 402, { s: 11, c: KC.dim });

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
    var TOP = 70, BOT = 330, LEFT = 250, RIGHT = 650;
    function PY(u) { return flip ? (BOT - u * (BOT - TOP)) : (TOP + u * (BOT - TOP)); }

    function rock(x, y, w, h, c0, c1, seed) {
      var g = ctx.createLinearGradient(x, y, x + w * .3, y + h);
      g.addColorStop(0, c0); g.addColorStop(1, c1);
      ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
      var R = K.rng(seed || 3);
      for (var i = 0; i < w * h / 90; i++) { ctx.fillStyle = R() > .5 ? "rgba(255,255,255,.07)" : "rgba(0,0,0,.10)"; ctx.fillRect(x + R() * w, y + R() * h, 1.5, 1.5); }
    }
    function draw() {
      paper(ctx, W, H, "earth", 311);
      head(ctx, "퇴적구조로 지층의 위아래 가리기 — " + NAME[str] + (flip ? " (뒤집힌 지층)" : " (정상 지층)"));

      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,.6)"; ctx.shadowBlur = 18;
      ctx.fillStyle = "#6b5232"; ctx.fillRect(LEFT, TOP, RIGHT - LEFT, BOT - TOP);
      ctx.restore();
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
      ctx.strokeStyle = "rgba(255,230,190,.35)"; ctx.lineWidth = 1.5; ctx.strokeRect(LEFT, TOP, RIGHT - LEFT, BOT - TOP);

      K.pill(ctx, "그림의 위쪽", (LEFT + RIGHT) / 2, TOP - 12, { s: 12, a: "center", c: KC.ink });
      K.pill(ctx, "그림의 아래쪽", (LEFT + RIGHT) / 2, BOT + 26, { s: 12, a: "center", c: KC.ink });
      if (flip) {
        K.pill(ctx, "⟳ 지각 변동으로", 24, 150, { s: 12.5, c: KC.orange });
        K.pill(ctx, "뒤집힌 지층", 24, 180, { s: 12.5, c: KC.orange });
      } else {
        K.pill(ctx, "정상 퇴적 상태", 24, 150, { s: 12.5, c: KC.mute });
      }
      K.t(ctx, "판정한 뒤 아래 설명을", 672, 150, { s: 11.5, c: KC.mute });
      K.t(ctx, "확인하세요", 672, 170, { s: 11.5, c: KC.mute });
      if (said) K.pill(ctx, said, 24, 376, { s: 12.5, c: said.indexOf("맞") >= 0 ? KC.green : KC.red });
      else K.t(ctx, "‘위(젊은 쪽)’는 퇴적물이 나중에 쌓인 쪽입니다.", 24, 376, { s: 12, c: KC.mute });
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
    function draw() {
      paper(ctx, W, H, "earth", 331);
      head(ctx, "절벽 단면 — 눌러서 증거를 확인하세요");
      var X0 = 140, X1 = 700;

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

      /* 이름표 */
      var on = function (k) { return sel === k ? KC.yellow : KC.ink; };
      K.pill(ctx, "㉲ 이암 · 건열", X0 + 12, 94, { s: 12, c: on("mud") });
      K.pill(ctx, "㉱ 역암 · 기저 역암", X0 + 12, 168, { s: 12, c: on("cong") });
      K.pill(ctx, "㉮ 석회암", X0 + 20, 240, { s: 12, c: on("lime") });
      K.pill(ctx, "㉯ 셰일 · 고사리 화석", X0 + 20, 330, { s: 12, c: on("shale") });
      K.pill(ctx, "㉰ 사암 · 사층리", X0 + 20, 430, { s: 12, c: on("sand") });
      ctx.strokeStyle = KC.line; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(dikeX(90) + 26, 90); ctx.lineTo(730, 90); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(dikeX(310) + 16, 310); ctx.lineTo(730, 310); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(X1, 185); ctx.lineTo(730, 182); ctx.stroke();
      K.pill(ctx, "㉳ 암맥", 736, 95, { s: 12, c: sel === "dike" ? KC.yellow : "#ffb6b6" });
      K.pill(ctx, "포획암", 736, 314, { s: 12, c: sel === "xeno" ? KC.yellow : "#e8e2d0" });
      K.pill(ctx, "부정합면", 736, 186, { s: 12, c: sel === "unc" ? KC.yellow : KC.orange });

      K.pill(ctx, "조사한 곳 " + G4.seen.length + " / 8", 24, 502, { s: 12.5, c: G4.seen.length >= 8 ? KC.green : KC.mute });
      K.t(ctx, "아래 무리 세 장은 기울어져 있습니다. 위아래부터 판정하세요.", 200, 502, { s: 11.5, c: KC.mute });
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
      var k = pick(hit(canvas, e));
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
      var LW = 540;
      K.stage(ctx, 0, 0, LW, 372, "lab", { seed: 341 });
      K.pill(ctx, "모원소가 남은 비율 하나로 지나간 시간을 읽는다", 16, 28, { s: 13, c: KC.blue });

      var X0 = 95, X1 = 520, Y0 = 70, Y1 = 330;
      function XN(nn) { return X0 + nn / 7 * (X1 - X0); }
      function YP(pp) { return Y1 - pp / 100 * (Y1 - Y0); }
      axes(ctx, X0, Y0, X1, Y1);
      for (var k = 0; k <= 7; k++) {
        ctx.strokeStyle = KC.grid; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(XN(k), Y0); ctx.lineTo(XN(k), Y1); ctx.stroke();
        K.t(ctx, k + "", XN(k), Y1 + 18, { s: 10.5, a: "center", c: KC.mute, w: "600" });
      }
      [0, 25, 50, 75, 100].forEach(function (pp) { K.t(ctx, pp + "%", X0 - 8, YP(pp) + 4, { s: 10.5, a: "right", c: KC.mute, w: "600" }); });
      K.t(ctx, "남은 모원소", X0 - 8, Y0 - 10, { s: 11, a: "right", c: KC.mute });
      K.t(ctx, "지나간 반감기 횟수 →", X1, Y1 + 34, { s: 11, a: "right", c: KC.mute });
      /* 곡선 아래 면 */
      var ag = ctx.createLinearGradient(0, Y0, 0, Y1); ag.addColorStop(0, "rgba(63,211,163,.28)"); ag.addColorStop(1, "rgba(63,211,163,.02)");
      ctx.fillStyle = ag; ctx.beginPath(); ctx.moveTo(XN(0), Y1);
      for (var i = 0; i <= 140; i++) { var nn = i / 140 * 7; ctx.lineTo(XN(nn), YP(Math.pow(0.5, nn) * 100)); }
      ctx.lineTo(XN(7), Y1); ctx.closePath(); ctx.fill();
      var pts = [];
      for (var i2 = 0; i2 <= 140; i2++) { var nn2 = i2 / 140 * 7; pts.push([XN(nn2), YP(Math.pow(0.5, nn2) * 100)]); }
      glowLine(ctx, pts, KC.green, 3);
      [[1, "1회 · 50%"], [2, "2회 · 25%"], [3, "3회 · 12.5%"]].forEach(function (m) {
        var x = XN(m[0]), y = YP(Math.pow(0.5, m[0]) * 100);
        ctx.strokeStyle = "rgba(200,210,255,.4)"; ctx.setLineDash([4, 4]); ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(X0, y); ctx.lineTo(x, y); ctx.lineTo(x, Y1); ctx.stroke(); ctx.setLineDash([]);
        K.pill(ctx, m[1], clamp(x + 8, X0, X1 - 70), y - 8, { s: 10.5, c: KC.mute });
      });
      ctx.save(); ctx.strokeStyle = KC.yellow; ctx.setLineDash([3, 3]); ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(X0, YP(p)); ctx.lineTo(XN(clamp(n, 0, 7)), YP(p)); ctx.lineTo(XN(clamp(n, 0, 7)), Y1); ctx.stroke(); ctx.restore();
      K.glow(ctx, XN(clamp(n, 0, 7)), YP(p), 5.5, "rgba(255,211,107,.95)", 3.4);

      /* ── 오른쪽: 원자 상자와 계산 ── */
      var RX = LW + 8, px = RX + 16;
      K.stage(ctx, RX, 0, W - RX, 372, "night", { seed: 343 });
      K.pill(ctx, "쓰고 있는 시계 · " + ISO[iso].label + " → " + ISO[iso].d, px - 2, 28, { s: 12.5, c: KC.violet, box: [RX, W] });
      K.t(ctx, "반감기 " + ISO[iso].hl, px, 62, { s: 12, w: "700", c: KC.mute });
      /* 원자 100개: 모원소(초록 빛) · 자원소(보라) */
      var gx = px + 4, gy = 80, cell = 15, nP = Math.round(p);
      var isP = {}; for (var a = 0; a < nP; a++) isP[ORDER[a]] = true;
      for (var j = 0; j < 100; j++) {
        var cx = gx + (j % 10) * cell + 7, cy = gy + Math.floor(j / 10) * cell + 7;
        if (isP[j]) K.glow(ctx, cx, cy, 4, "rgba(63,211,163,.95)", 1.8);
        else K.planet(ctx, cx, cy, 4.2, "#b69cff", "#3d2a7a");
      }
      var tx = gx + 10 * cell + 14;
      K.t(ctx, "● 모원소", tx, gy + 14, { s: 11.5, w: "800", c: KC.green });
      K.t(ctx, p.toFixed(2) + "%", tx, gy + 34, { s: 15, w: "900", c: KC.green });
      K.t(ctx, "● 자원소", tx, gy + 66, { s: 11.5, w: "800", c: KC.violet });
      K.t(ctx, (100 - p).toFixed(2) + "%", tx, gy + 86, { s: 15, w: "900", c: KC.violet });
      K.t(ctx, "모 : 자 = 1 : " + ((100 - p) / p).toFixed(2), tx, gy + 124, { s: 12, w: "900", c: KC.ink });
      K.t(ctx, "지나간 반감기", px, 262, { s: 11.5, w: "800", c: KC.mute });
      K.t(ctx, n.toFixed(2) + " 회", px, 290, { s: 22, w: "900", c: KC.ink });
      K.t(ctx, "절대연령", px + 150, 262, { s: 11.5, w: "800", c: KC.mute });
      K.t(ctx, fmtAge(age), px + 150, 290, { s: 22, w: "900", c: KC.green });
      K.t(ctx, "원자 100개로 나타낸 비율", px, 352, { s: 10.5, c: KC.dim });

      /* ── 아래 띠 ── */
      K.stage(ctx, 0, 380, W, H - 380, "night", { seed: 345 });
      if (p <= 5) {
        K.pill(ctx, "⚠ 측정 한계에 가깝습니다", 20, 408, { s: 13, c: KC.red });
        K.t(ctx, "남은 모원소가 5 % 아래이면 오차가 급격히 커집니다." + (iso === "C14" ? " ¹⁴C로 잴 수 있는 것은 길어야 수만 년까지입니다." : ""), 20, 434, { s: 11.5, c: KC.mute });
      } else {
        K.t(ctx, "반감기는 온도·압력이 바뀌어도 달라지지 않습니다. 그래서 믿을 수 있는 시계입니다.", 20, 420, { s: 12, c: KC.mute });
      }

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

    function LX(y) { return 95 + clamp((Math.log(Math.max(y, 1)) / Math.LN10 - 3) / 7.6, 0, 1) * (855 - 95); }

    function sampleIcon(i, x, y) {
      if (i === 0) { var cg = ctx.createLinearGradient(x - 14, y - 8, x + 14, y + 8); cg.addColorStop(0, "#2b2420"); cg.addColorStop(1, "#0d0a09"); ctx.fillStyle = cg; ctx.beginPath(); ctx.roundRect(x - 16, y - 7, 32, 14, 5); ctx.fill(); ctx.globalAlpha = .6; K.glow(ctx, x + 6, y, 2, "rgba(255,120,60,.9)", 3); ctx.globalAlpha = 1; }
      else if (i === 1) { var tg = ctx.createLinearGradient(0, y - 12, 0, y + 12); tg.addColorStop(0, "#d9d3c4"); tg.addColorStop(1, "#a59c86"); ctx.fillStyle = tg; ctx.beginPath(); ctx.moveTo(x - 16, y + 10); ctx.lineTo(x - 10, y - 10); ctx.lineTo(x + 14, y - 8); ctx.lineTo(x + 16, y + 10); ctx.closePath(); ctx.fill(); }
      else if (i === 2) { ctx.fillStyle = "#d9a1a0"; ctx.beginPath(); ctx.arc(x, y, 13, 0, 6.2832); ctx.fill(); var R = K.rng(2); for (var d = 0; d < 26; d++) { ctx.fillStyle = R() > .6 ? "#222" : "#fff"; ctx.fillRect(x - 9 + R() * 18, y - 9 + R() * 18, 2, 2); } }
      else K.planet(ctx, x, y, 12, "#8f8476", "#2d2620");
    }
    function draw() {
      paper(ctx, W, H, "lab", 351);
      var S = SAMP[k], ratio = S.age / ISO[iso].t, remain = Math.pow(0.5, ratio) * 100;
      var judge = ratio < LO ? "short" : (ratio > HI ? "long" : "ok");
      head(ctx, "시계마다 잴 수 있는 시간의 폭이 다르다");
      K.t(ctx, "잴 수 있는 범위 (반감기의 1/50~10배)", 95, 72, { s: 12, w: "800", c: KC.mute });

      /* 로그 시간축 */
      var ay = 250;
      var lg = ctx.createLinearGradient(95, 0, 855, 0); lg.addColorStop(0, "rgba(255,179,92,.5)"); lg.addColorStop(1, "rgba(182,156,255,.5)");
      ctx.fillStyle = lg; ctx.beginPath(); ctx.roundRect(95, ay - 3, 760, 6, 3); ctx.fill();
      [[1e3, "1천 년"], [1e5, "10만 년"], [1e7, "1천만 년"], [1e9, "10억 년"], [1e10, "100억 년"]].forEach(function (m) {
        var x = LX(m[0]);
        ctx.strokeStyle = KC.line; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, ay + 3); ctx.lineTo(x, ay + 9); ctx.stroke();
        K.t(ctx, m[1], clamp(x, 130, 820), ay + 26, { s: 10.5, a: "center", c: KC.mute, w: "600" });
      });

      var rows = [["C14", KC.orange, 100, "255,179,92"], ["K40", KC.violet, 140, "182,156,255"], ["U238", KC.green, 180, "63,211,163"]];
      rows.forEach(function (r) {
        var x0 = LX(ISO[r[0]].t * LO), x1 = LX(ISO[r[0]].t * HI), on = r[0] === iso;
        var bg = ctx.createLinearGradient(x0, 0, x1, 0); bg.addColorStop(0, "rgba(" + r[3] + ",.15)"); bg.addColorStop(.5, "rgba(" + r[3] + "," + (on ? .9 : .35) + ")"); bg.addColorStop(1, "rgba(" + r[3] + ",.15)");
        ctx.save(); if (on) { ctx.shadowColor = r[1]; ctx.shadowBlur = 10; }
        ctx.fillStyle = bg; ctx.beginPath(); ctx.roundRect(x0, r[2] - 11, Math.max(x1 - x0, 3), 22, 11); ctx.fill(); ctx.restore();
        if (x0 < 250) K.pill(ctx, ISO[r[0]].label + " · 반감기 " + ISO[r[0]].hl, x1 + 10, r[2] + 5, { s: 11.5, c: r[1] });
        else K.pill(ctx, ISO[r[0]].label + " · 반감기 " + ISO[r[0]].hl, x0 - 10, r[2] + 5, { s: 11.5, a: "right", c: r[1] });
      });

      var sx = LX(S.age);
      ctx.save(); ctx.strokeStyle = "rgba(255,255,255,.8)"; ctx.lineWidth = 2; ctx.setLineDash([5, 4]); ctx.shadowColor = "#fff"; ctx.shadowBlur = 6;
      ctx.beginPath(); ctx.moveTo(sx, 88); ctx.lineTo(sx, ay); ctx.stroke(); ctx.setLineDash([]); ctx.restore();
      K.glow(ctx, sx, ay, 5, "rgba(255,255,255,.95)", 3);
      sampleIcon(k, clamp(sx, 150, 780) - 94, 296);
      K.pill(ctx, S.n, clamp(sx, 150, 780), 302, { s: 13, a: "center", c: KC.ink });
      K.t(ctx, "실제 나이 약 " + fmtAge(S.age), clamp(sx, 150, 780), 326, { s: 11.5, a: "center", c: KC.mute });

      /* 판정 */
      var msg = judge === "ok" ? "✅ 잴 수 있습니다" : (judge === "long" ? "✖ 너무 오래되었습니다" : "✖ 너무 최근입니다");
      K.pill(ctx, msg, 24, 374, { s: 17, c: judge === "ok" ? KC.green : KC.red });
      K.t(ctx, "나이 ÷ 반감기 = " + (ratio < 0.001 ? ratio.toExponential(1) : ratio.toFixed(3)) + " 배", 330, 372, { s: 13.5, w: "800", c: KC.ink });
      K.t(ctx, "남을 모원소 " + (remain > 99.99 ? "99.99 % 이상" : (remain < 0.01 ? "0.01 % 미만" : remain.toFixed(2) + " %")), 600, 372, { s: 13.5, w: "800", c: KC.green });
      K.t(ctx, S.m, 24, 404, { s: 11.5, c: KC.mute });
      K.pill(ctx, "잰 시료 " + got.s.filter(function (x) { return x; }).length + " / 4", 24, 430, { s: 11.5, c: KC.green });

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

    function strata(x, y, w, h, c0, c1, seed, lines) {
      var g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, c0); g.addColorStop(1, c1);
      ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
      var R = K.rng(seed);
      for (var i = 0; i < w * h / 120; i++) { ctx.fillStyle = R() > .5 ? "rgba(255,255,255,.07)" : "rgba(0,0,0,.12)"; ctx.fillRect(x + R() * w, y + R() * h, 1.6, 1.6); }
      ctx.strokeStyle = "rgba(0,0,0,.18)"; ctx.lineWidth = 1;
      for (var l = 1; l < lines; l++) { var ly = y + h * l / lines; ctx.beginPath(); ctx.moveTo(x, ly); ctx.lineTo(x + w, ly); ctx.stroke(); }
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      var mmPerYr = rate / 1000, calc = mmPerYr * DT / 1000;   /* m */
      var real = REAL[site], ok = Math.abs(calc - real) <= 5;
      var LW = 552;
      K.stage(ctx, 0, 0, LW, H, "earth", { seed: 361 });
      K.pill(ctx, "건층으로 이어 붙인 두 지역 — 같은 500만 년, 다른 두께", 16, 28, { s: 12.5, c: KC.blue });

      var BASE = 400, PX = 0.62;
      function col(x0, idx, name) {
        var h = REAL[idx] * PX, on = idx === site;
        ctx.save(); ctx.shadowColor = on ? "rgba(255,211,107,.5)" : "rgba(0,0,0,.5)"; ctx.shadowBlur = on ? 18 : 10;
        ctx.fillStyle = "#3a2d22"; ctx.fillRect(x0, BASE - h - 20, 110, h + 38); ctx.restore();
        strata(x0, BASE, 110, 18, "#e8e2e8", "#bdb3c6", 70 + idx, 1);           /* 아래 응회암 */
        strata(x0, BASE - h, 110, h - 2, idx === 0 ? "#c7a774" : "#8a7a6a", idx === 0 ? "#9b7c4c" : "#625547", 72 + idx, Math.max(3, Math.round(h / 14)));
        strata(x0, BASE - h - 20, 110, 18, "#e8e2e8", "#bdb3c6", 74 + idx, 1);  /* 위 응회암 */
        /* 표준 화석(암모나이트) 한 점 */
        var fx = x0 + 78, fy = BASE - h * .55;
        ctx.strokeStyle = "rgba(255,240,210,.75)"; ctx.lineWidth = 1.6; ctx.beginPath();
        for (var s = 0; s < 40; s++) { var a = s * .45, rr = 1 + s * .22; if (s) ctx.lineTo(fx + Math.cos(a) * rr, fy + Math.sin(a) * rr); else ctx.moveTo(fx, fy); }
        ctx.stroke();
        K.pill(ctx, name, x0 + 55, BASE + 46, { s: 12.5, a: "center", c: on ? KC.yellow : KC.mute });
        K.pill(ctx, REAL[idx] + " m", x0 + 40, BASE - h / 2 + 5, { s: 12.5, a: "center", c: KC.ink });
        return { top: BASE - h - 11, bot: BASE + 9, x0: x0, x1: x0 + 110 };
      }
      var A = col(110, 0, "가 지역"), B = col(370, 1, "나 지역");
      ctx.save(); ctx.strokeStyle = KC.violet; ctx.lineWidth = 2.2; ctx.setLineDash([7, 5]); ctx.shadowColor = KC.violet; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.moveTo(A.x1, A.top); ctx.lineTo(B.x0, B.top); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(A.x1, A.bot); ctx.lineTo(B.x0, B.bot); ctx.stroke();
      ctx.setLineDash([]); ctx.restore();
      K.pill(ctx, "위 응회암 · 6,900만 년 전", 110, 82, { s: 11.5, c: KC.violet });
      K.pill(ctx, "아래 응회암 · 7,400만 년 전", 110, 462, { s: 11.5, c: KC.violet });
      K.pill(ctx, "두 건층 사이 = 500만 년", 300, 462, { s: 11.5, c: KC.orange });
      K.t(ctx, "🐚 두 지역에서 같은 표준 화석", 370, 82, { s: 11, c: "#f0e2c0" });

      /* ── 오른쪽 계산판 ── */
      var RX = LW + 8, px = RX + 18;
      K.stage(ctx, RX, 0, W - RX, H, "lab", { seed: 363 });
      K.pill(ctx, "두께 = 퇴적 속도 × 시간", px - 2, 28, { s: 13, c: KC.blue });
      K.t(ctx, "내가 넣은 속도", px, 74, { s: 11.5, w: "800", c: KC.mute });
      K.t(ctx, mmPerYr.toFixed(3) + " mm/년", px, 102, { s: 19, w: "900", c: KC.blue });
      K.t(ctx, "× 500만 년 =", px, 134, { s: 12, c: KC.mute });
      K.t(ctx, calc.toFixed(0) + " m", px, 170, { s: 28, w: "900", c: ok ? KC.green : KC.yellow });
      K.t(ctx, "실제 " + real + " m (" + (site === 0 ? "가" : "나") + " 지역)", px, 200, { s: 13, w: "800", c: KC.mute });
      K.pill(ctx, ok ? "✅ 맞았습니다" : (calc < real ? "더 빠르게 (속도 ↑)" : "더 느리게 (속도 ↓)"), px, 236, { s: 13.5, c: ok ? KC.green : KC.red, box: [RX, W] });
      var gx0 = px, gw = W - 24 - px;
      K.t(ctx, "실제 두께", gx0, 276, { s: 10.5, c: KC.mute });
      ctx.fillStyle = "rgba(255,255,255,.08)"; ctx.beginPath(); ctx.roundRect(gx0, 284, gw, 14, 7); ctx.fill();
      ctx.fillStyle = "rgba(220,220,235,.7)"; ctx.beginPath(); ctx.roundRect(gx0, 284, Math.max(6, gw * clamp(real / 300, 0, 1)), 14, 7); ctx.fill();
      K.t(ctx, "내 계산", gx0, 318, { s: 10.5, c: KC.mute });
      ctx.fillStyle = "rgba(255,255,255,.08)"; ctx.beginPath(); ctx.roundRect(gx0, 326, gw, 14, 7); ctx.fill();
      ctx.save(); ctx.shadowColor = ok ? KC.green : KC.blue; ctx.shadowBlur = 8; ctx.fillStyle = ok ? KC.green : KC.blue;
      ctx.beginPath(); ctx.roundRect(gx0, 326, Math.max(6, gw * clamp(calc / 300, 0, 1)), 14, 7); ctx.fill(); ctx.restore();
      K.t(ctx, "두 지역의 퇴적 속도는 다르지만", px, 400, { s: 11.5, c: KC.mute });
      K.t(ctx, "두 건층 사이의 시간은 똑같습니다", px, 420, { s: 11.5, c: KC.mute });

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
      paper(ctx, W, H, "night", 371);
      var age = ageOf(day, hour), era = eraOf(age);
      head(ctx, "46억 년을 1년으로 줄인 달력 — 1월 1일 0시에 지구가 태어났다");

      var GX = 62, GY = 76, CW = 66, CH = 10.4;
      var idx = 0, selX = 0, selY = 0;
      for (var m = 0; m < 12; m++) {
        K.t(ctx, (m + 1) + "월", GX + m * CW + CW / 2 - 2, GY - 10, { s: 11, a: "center", w: "800", c: KC.mute });
        for (var dd = 0; dd < MDAYS[m]; dd++) {
          idx++;
          var e2 = eraOf(ageOf(idx, 12)), rgb = ECOL[e2.n];
          ctx.fillStyle = "rgba(" + rgb + "," + (idx <= day ? .75 : .28) + ")";
          ctx.beginPath(); ctx.roundRect(GX + m * CW, GY + dd * CH, CW - 5, CH - 2, 2); ctx.fill();
          if (idx === day) { selX = GX + m * CW; selY = GY + dd * CH; }
        }
      }
      /* 고른 날: 빛나는 테두리 */
      ctx.save(); ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2.2; ctx.shadowColor = KC.yellow; ctx.shadowBlur = 12;
      ctx.strokeRect(selX - 2, selY - 2, CW - 1, CH + 2); ctx.restore();
      /* 대가 시작되는 날 표시 */
      [["고생대 시작", P_START], ["중생대", M_START], ["신생대", C_START]].forEach(function (q) {
        var dIdx = Math.ceil((1 - q[1] / EARTH) * 365);
        var mm = 0, d0 = dIdx; while (mm < 11 && d0 > MDAYS[mm]) { d0 -= MDAYS[mm]; mm++; }
        var yx = GX + mm * CW + CW - 6, yy = GY + (d0 - 1) * CH + 4;
        K.glow(ctx, yx, yy, 2, "rgba(255,255,255,.95)", 2.6);
      });
      var LEG = [["선캄브리아 시대"], ["고생대"], ["중생대"], ["신생대"]];
      var lx = 62;
      LEG.forEach(function (g) {
        var rgb = ECOL[g[0]];
        ctx.fillStyle = "rgba(" + rgb + ",.85)"; ctx.beginPath(); ctx.roundRect(lx, 403, 16, 12, 3); ctx.fill();
        K.t(ctx, g[0], lx + 22, 414, { s: 11.5, w: "800", c: "rgb(" + rgb + ")" });
        lx += g[0].length * 13 + 52;
      });
      K.t(ctx, "● 흰 점 = 대가 바뀌는 날", 860, 414, { s: 10.5, a: "right", c: KC.dim });

      K.pill(ctx, dateLabel(day) + "  " + Math.floor(hour) + "시 " + (hour % 1 ? "30" : "00") + "분", 62, 450, { s: 15, c: KC.yellow });
      K.pill(ctx, "→ 약 " + fmtAge(age * 1e6) + " 전  ·  " + era.n, 300, 450, { s: 14, c: "rgb(" + ECOL[era.n] + ")" });
      K.t(ctx, "하루 = 약 1,260만 년", 860, 450, { s: 11.5, a: "right", c: KC.mute });

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
      paper(ctx, W, H, "lab", 381);
      var ei = evAt(t);
      head(ctx, "해양 생물 다양성 모형 곡선과 다섯 번의 대멸종");

      axes(ctx, X0, Y0, X1, Y1);
      /* 곡선 아래 면 + 빛나는 곡선 */
      var ag = ctx.createLinearGradient(0, Y0, 0, Y1); ag.addColorStop(0, "rgba(63,211,163,.32)"); ag.addColorStop(1, "rgba(63,211,163,.03)");
      ctx.fillStyle = ag; ctx.beginPath(); ctx.moveTo(XT(541), Y1);
      for (var a1 = 541; a1 >= 0; a1--) ctx.lineTo(XT(a1), YD(D[a1]));
      ctx.lineTo(XT(0), Y1); ctx.closePath(); ctx.fill();
      var pts = [];
      for (var aa = 541; aa >= 0; aa--) pts.push([XT(aa), YD(D[aa])]);
      glowLine(ctx, pts, KC.green, 2.6);
      K.t(ctx, "↑ 생물 종류의 수 (모형)", X0 + 4, Y0 - 4, { s: 11, c: KC.mute });

      EV.forEach(function (e, i) {
        var x = XT(e.t), on = i === ei;
        ctx.save(); ctx.strokeStyle = on ? KC.red : "rgba(255,107,129,.55)"; ctx.lineWidth = on ? 2.6 : 1.3; ctx.setLineDash([4, 4]);
        if (on) { ctx.shadowColor = KC.red; ctx.shadowBlur = 10; }
        ctx.beginPath(); ctx.moveTo(x, Y0); ctx.lineTo(x, Y1); ctx.stroke(); ctx.restore();
        K.pill(ctx, "①②③④⑤".charAt(i), x, Y0 - 8, { s: 12.5, a: "center", c: G3.v[i] ? KC.green : KC.red });
        if (on) K.glow(ctx, x, YD(D[e.t]), 6, "rgba(255,107,129,.9)", 3);
      });
      var cx = XT(t);
      ctx.save(); ctx.strokeStyle = KC.yellow; ctx.lineWidth = 1.8; ctx.shadowColor = KC.yellow; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.moveTo(cx, Y0); ctx.lineTo(cx, Y1); ctx.stroke(); ctx.restore();
      K.glow(ctx, cx, YD(D[Math.round(clamp(t, 0, 541))]), 5, "rgba(255,211,107,.95)", 3.4);

      /* 기(紀) 띠 */
      PER.forEach(function (p, i) {
        var x0 = XT(p[0]), x1 = XT(p[1]), on = t <= p[0] && t > p[1];
        ctx.fillStyle = on ? "rgba(255,211,107,.35)" : (i % 2 ? "rgba(127,211,255,.18)" : "rgba(63,211,163,.18)");
        ctx.fillRect(x0, Y1 + 4, x1 - x0, 24);
        ctx.strokeStyle = "rgba(200,210,255,.2)"; ctx.lineWidth = 1; ctx.strokeRect(x0, Y1 + 4, x1 - x0, 24);
        if (x1 - x0 > 20) K.t(ctx, p[2], (x0 + x1) / 2, Y1 + 21, { s: 11, a: "center", w: "800", c: on ? KC.yellow : KC.mute });
      });
      /* 대(代) 띠 */
      [[541, 252, "고생대", "63,211,163"], [252, 66, "중생대", "255,160,90"], [66, 0, "신생대", "182,156,255"]].forEach(function (g) {
        var x0 = XT(g[0]), x1 = XT(g[1]);
        var bg = ctx.createLinearGradient(0, Y1 + 30, 0, Y1 + 52); bg.addColorStop(0, "rgba(" + g[3] + ",.55)"); bg.addColorStop(1, "rgba(" + g[3] + ",.25)");
        ctx.fillStyle = bg; ctx.fillRect(x0, Y1 + 30, x1 - x0, 22);
        K.t(ctx, g[2], (x0 + x1) / 2, Y1 + 46, { s: 11.5, a: "center", w: "900", c: "#ffffff" });
      });
      K.t(ctx, "541", X0, Y1 + 66, { s: 10.5, a: "center", c: KC.mute });
      K.t(ctx, "0 (현재)", X1, Y1 + 66, { s: 10.5, a: "right", c: KC.mute });
      K.t(ctx, "← 백만 년 전", (X0 + X1) / 2, Y1 + 66, { s: 10.5, a: "center", c: KC.mute });

      var per = "";
      for (var q = 0; q < PER.length; q++) if (t <= PER[q][0] && t > PER[q][1]) per = PER[q][3];
      if (!per) per = "제4기";
      K.pill(ctx, t + "백만 년 전 · " + per, 16, 62, { s: 13, c: KC.yellow });
      if (ei >= 0) K.pill(ctx, EV[ei].n + " 대멸종 — 생물 속의 약 " + Math.round(EV[ei].sev * 100) + " %가 사라짐", 300, 62, { s: 13, c: KC.red });
      else K.pill(ctx, "찾은 대멸종 " + G3.v.filter(function (x) { return x; }).length + " / 5", 300, 62, { s: 12.5, c: KC.mute });
      K.warn(ctx, W - 16, 62, "⚠ 모형 곡선 · 실제 자료 아님", "right");

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
      var LW = 584;
      K.stage(ctx, 0, 0, LW, 350, "lab", { seed: 391 });
      K.pill(ctx, "좋은 표준 화석의 조건 — 짧게 살고, 넓게 퍼질 것", 16, 28, { s: 13, c: KC.blue });
      /* 좋은 구역 */
      var zg = ctx.createLinearGradient(0, YA(6) - 8, 0, YA(4)); zg.addColorStop(0, "rgba(63,211,163,.30)"); zg.addColorStop(1, "rgba(63,211,163,.10)");
      ctx.fillStyle = zg; ctx.fillRect(XS(50), YA(6) - 8, XS(1000) - XS(50), YA(4) - YA(6) + 8);
      ctx.strokeStyle = "rgba(63,211,163,.6)"; ctx.setLineDash([4, 4]); ctx.lineWidth = 1.2; ctx.strokeRect(XS(50), YA(6) - 8, XS(1000) - XS(50), YA(4) - YA(6) + 8); ctx.setLineDash([]);
      axes(ctx, X0, Y0, X1, Y1);
      [50, 100, 500, 1000, 5000, 20000].forEach(function (s) {
        K.t(ctx, s >= 10000 ? (s / 10000) + "억" : s + "", XS(s), Y1 + 18, { s: 10.5, a: "center", c: KC.mute, w: "600" });
      });
      K.t(ctx, "살았던 기간 (만 년) →", X1, Y1 - 8, { s: 11, a: "right", c: KC.mute });
      for (var a2 = 1; a2 <= 6; a2++) K.t(ctx, a2 + "", X0 - 8, YA(a2) + 4, { s: 10.5, a: "right", c: KC.mute, w: "600" });
      K.t(ctx, "대륙 수", X0 - 8, Y0 - 10, { s: 11, a: "right", c: KC.mute });
      K.pill(ctx, "좋은 표준 화석", (XS(50) + XS(1000)) / 2, YA(5) + 5, { s: 12.5, a: "center", c: KC.green });
      K.t(ctx, "↘ 오래 살고 좁게 퍼지면 시상 화석 쪽", X1, YA(1.6), { s: 10.5, a: "right", c: KC.dim });
      K.glow(ctx, XS(span), YA(area), 7, good ? "rgba(63,211,163,.95)" : "rgba(255,107,129,.95)", 3.2);

      /* ── 오른쪽 판정 ── */
      var RX = LW + 8, px = RX + 16;
      K.stage(ctx, RX, 0, W - RX, 350, "night", { seed: 393 });
      K.pill(ctx, "판정", px - 2, 28, { s: 13, c: KC.blue });
      var jc = good ? KC.green : KC.red;
      K.t(ctx, good ? "좋은 표준 화석" : (span > 1000 ? "너무 오래 살았다" : "너무 좁게 퍼졌다"), px, 70, { s: 19, w: "900", c: jc });
      K.t(ctx, "살았던 기간 " + (span >= 10000 ? (span / 10000).toFixed(1) + "억 년" : span + "만 년"), px, 96, { s: 12.5, w: "700", c: KC.ink });
      /* 대륙 지도: 화석이 나오는 곳에 빛 */
      var mx = px, my = 110;
      ctx.fillStyle = "rgba(40,80,150,.35)"; ctx.beginPath(); ctx.roundRect(mx - 4, my - 4, 264, 92, 10); ctx.fill();
      CONT.forEach(function (c, i) {
        var on = i < area;
        var lg = ctx.createLinearGradient(0, my + c[1] - c[3], 0, my + c[1] + c[3]); lg.addColorStop(0, on ? "#8fb46a" : "#4d5a48"); lg.addColorStop(1, on ? "#5b7a3e" : "#343c32");
        ctx.fillStyle = lg; ctx.beginPath(); ctx.ellipse(mx + c[0], my + c[1], c[2] * .6, c[3] * .6, .2, 0, 6.2832); ctx.fill();
        if (on) K.glow(ctx, mx + c[0], my + c[1], 2.6, "rgba(255,211,107,.95)", 3);
      });
      K.t(ctx, "나오는 대륙 " + area + " 곳 / 6 곳", px, 222, { s: 12.5, w: "800", c: area >= 4 ? KC.green : KC.red });
      var bw = W - 22 - px;
      K.t(ctx, "좁힐 수 있는 폭 · 백악기의 " + (span / CRET * 100).toFixed(0) + " %", px, 254, { s: 11.5, w: "800", c: KC.mute });
      ctx.fillStyle = "rgba(255,255,255,.08)"; ctx.beginPath(); ctx.roundRect(px, 262, bw, 14, 7); ctx.fill();
      ctx.save(); var sc = span <= 1000 ? KC.green : KC.red; ctx.shadowColor = sc; ctx.shadowBlur = 8; ctx.fillStyle = sc;
      ctx.beginPath(); ctx.roundRect(px, 262, Math.max(6, bw * clamp(span / CRET, 0, 1)), 14, 7); ctx.fill(); ctx.restore();
      K.t(ctx, "만나 볼 수 있을 확률 " + Math.round(area / 6 * 100) + " %", px, 302, { s: 11.5, w: "800", c: KC.mute });
      ctx.fillStyle = "rgba(255,255,255,.08)"; ctx.beginPath(); ctx.roundRect(px, 310, bw, 14, 7); ctx.fill();
      ctx.save(); var ac = area >= 4 ? KC.green : KC.red; ctx.shadowColor = ac; ctx.shadowBlur = 8; ctx.fillStyle = ac;
      ctx.beginPath(); ctx.roundRect(px, 310, Math.max(6, bw * area / 6), 14, 7); ctx.fill(); ctx.restore();

      /* ── 아래 설명 ── */
      K.stage(ctx, 0, 358, W, H - 358, "night", { seed: 395 });
      K.t(ctx, "1,000만 년 이하 · 4개 대륙 이상을 기준으로 삼았습니다", 20, 382, { s: 11.5, c: KC.ink });
      K.t(ctx, "오래 살고 특정 환경에서만 사는 생물은 시대가 아니라 ‘그때의 환경’을 알려 주는 시상 화석이 됩니다.", 20, 404, { s: 11.5, c: KC.mute });
      K.warn(ctx, W - 16, 382, "⚠ 대륙 모양은 모식적", "right");

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
