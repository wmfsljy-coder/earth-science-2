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
    var K = 3593333;                                  /* v = K · r² (스토크스) */

    function speed(um) { var r = um * 1e-6 / 2; return K * r * r; }
    function LX(sec) {                                /* 로그 눈금 1초 ~ 10⁹초 */
      var g = clamp(Math.log(Math.max(sec, 1)) / Math.LN10, 0, 9);
      return 350 + g / 9 * (860 - 350);
    }

    function draw() {
      paper(ctx, W, H);
      var vv = speed(dUm), t = depth / vv;
      text(ctx, "잔잔한 물에서 알갱이 하나가 가라앉는 데 걸리는 시간", 60, 34, { s: 14, w: "900" });

      /* 왼쪽 물기둥 */
      var wx0 = 80, wx1 = 260, wy0 = 66, wy1 = 336;
      band(ctx, wx0, wy0, wx1 - wx0, wy1 - wy0, "--brand", 0.13);
      ctx.strokeStyle = v("--line"); ctx.lineWidth = 2; ctx.strokeRect(wx0, wy0, wx1 - wx0, wy1 - wy0);
      band(ctx, wx0, wy1 - 12, wx1 - wx0, 12, "--coral", 0.5);
      text(ctx, "수면", wx0 + 6, wy0 - 8, { s: 11, c: v("--mist") });
      text(ctx, "바닥 (깊이 " + depth + " m)", wx0 + 6, wy1 + 20, { s: 11, c: v("--mist") });
      var u = (tick % 40) / 40;
      var gr = clamp(2 + Math.log(dUm) / Math.LN10 * 3.4, 2.5, 15);
      ctx.fillStyle = v("--coral");
      ctx.beginPath(); ctx.arc((wx0 + wx1) / 2, wy0 + 10 + u * (wy1 - wy0 - 26), gr, 0, Math.PI * 2); ctx.fill();
      text(ctx, "알갱이 크기는 과장해 그렸습니다", wx0, wy1 + 40, { s: 10.5, c: v("--mist") });

      /* 오른쪽 결과 */
      text(ctx, "입자 지름", 350, 76, { s: 11.5, w: "800", c: v("--mist") });
      text(ctx, (dUm / 1000).toFixed(3) + " mm", 350, 106, { s: 24, w: "900", c: v("--brand-700") });
      text(ctx, grainName(dUm), 560, 106, { s: 15, w: "900", c: v("--mist") });
      text(ctx, "침강 속도", 350, 142, { s: 11.5, w: "800", c: v("--mist") });
      text(ctx, vv < 0.001 ? (vv * 1000).toFixed(3) + " mm/s" : vv.toFixed(3) + " m/s", 350, 168, { s: 16, w: "900" });
      text(ctx, "바닥까지 걸리는 시간", 350, 204, { s: 11.5, w: "800", c: v("--mist") });
      text(ctx, fmtSec(t), 350, 234, { s: 26, w: "900", c: (t >= 86400 || t <= 60) ? v("--teal-700") : v("--ink") });

      /* 로그 눈금 */
      var ly = 300;
      ctx.strokeStyle = v("--line"); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(350, ly); ctx.lineTo(860, ly); ctx.stroke();
      [[1, "1초"], [60, "1분"], [3600, "1시간"], [86400, "1일"], [2592000, "한 달"], [31536000, "1년"], [3153600000, "100년"]].forEach(function (m) {
        var x = LX(m[0]);
        ctx.beginPath(); ctx.moveTo(x, ly); ctx.lineTo(x, ly + 6); ctx.stroke();
        text(ctx, m[1], clamp(x, 360, 852), ly + 22, { s: 10, a: "center", c: v("--mist") });
      });
      ctx.fillStyle = v("--coral");
      ctx.beginPath(); ctx.arc(LX(t), ly, 7, 0, Math.PI * 2); ctx.fill();
      text(ctx, "지금 이 알갱이", clamp(LX(t), 400, 800), ly - 14, { s: 11.5, a: "center", w: "800", c: v("--coral-700") });
      text(ctx, "고운 입자일수록 오래 떠 있다가 뒤늦게 가라앉습니다 — 이것이 점이층리를 만듭니다.", 350, 374, { s: 11.5, c: v("--mist") });
      text(ctx, "스토크스 법칙 : 침강 속도 ∝ (반지름)²", 350, 396, { s: 11, c: v("--mist") });

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
    anim(canvas, function () { tick++; draw(); });
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

    function draw() {
      paper(ctx, W, H);
      text(ctx, "퇴적구조로 지층의 위아래 가리기 — " + NAME[str] + (flip ? " (뒤집힌 지층)" : " (정상 지층)"), 60, 34, { s: 14, w: "900" });

      band(ctx, LEFT, TOP, RIGHT - LEFT, BOT - TOP, "--card-2", 1);
      ctx.strokeStyle = v("--line"); ctx.lineWidth = 2.5; ctx.strokeRect(LEFT, TOP, RIGHT - LEFT, BOT - TOP);

      ctx.save();
      ctx.beginPath(); ctx.rect(LEFT, TOP, RIGHT - LEFT, BOT - TOP); ctx.clip();
      if (str === "cross") {
        ctx.strokeStyle = v("--teal"); ctx.lineWidth = 1.8;
        for (var lx = LEFT - 90; lx < RIGHT + 90; lx += 26) {
          ctx.beginPath();
          ctx.moveTo(lx, PY(0.97));
          ctx.quadraticCurveTo(lx + 46, PY(0.62), lx + 104, PY(0.02));
          ctx.stroke();
        }
        ctx.strokeStyle = v("--coral"); ctx.lineWidth = 3.5;
        ctx.beginPath(); ctx.moveTo(LEFT, PY(0.02)); ctx.lineTo(RIGHT, PY(0.02)); ctx.stroke();
      } else if (str === "graded") {
        for (var r = 0; r < 8; r++) {
          var uu = 0.06 + r * 0.125, rad = 2.5 + uu * 11;
          var n = Math.floor((RIGHT - LEFT) / (rad * 2.6));
          for (var i = 0; i < n; i++) {
            ctx.fillStyle = v("--teal"); ctx.globalAlpha = 0.7;
            ctx.beginPath(); ctx.arc(LEFT + 12 + i * (RIGHT - LEFT - 24) / Math.max(n - 1, 1), PY(uu), rad, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = 1;
          }
        }
      } else if (str === "mud") {
        var cx = (LEFT + RIGHT) / 2;
        [-140, 0, 140].forEach(function (off) {
          ctx.fillStyle = v("--abyss");
          ctx.beginPath();
          ctx.moveTo(cx + off - 44, PY(0.02));
          ctx.lineTo(cx + off + 44, PY(0.02));
          ctx.lineTo(cx + off + 7, PY(0.86));
          ctx.lineTo(cx + off - 7, PY(0.86));
          ctx.closePath(); ctx.fill();
          ctx.strokeStyle = v("--coral"); ctx.lineWidth = 2.2; ctx.stroke();
        });
      } else {
        ctx.fillStyle = v("--teal"); ctx.globalAlpha = 0.65;
        ctx.beginPath();
        ctx.moveTo(LEFT, PY(1));
        for (var xx = LEFT; xx <= RIGHT; xx += 4) {
          var ph = (xx - LEFT) / 100 * Math.PI * 2;
          var s1 = Math.sin(ph), uu2 = 0.42 - 0.17 * s1 - 0.05 * Math.sin(ph * 2);
          ctx.lineTo(xx, PY(uu2));
        }
        ctx.lineTo(RIGHT, PY(1)); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
      }
      ctx.restore();

      text(ctx, "그림의 위쪽", (LEFT + RIGHT) / 2, TOP - 12, { s: 12.5, a: "center", w: "800", c: v("--mist") });
      text(ctx, "그림의 아래쪽", (LEFT + RIGHT) / 2, BOT + 24, { s: 12.5, a: "center", w: "800", c: v("--mist") });
      if (flip) {
        text(ctx, "⟳ 이 지층은 지각 변동으로", 60, 150, { s: 12.5, w: "800", c: v("--coral-700") });
        text(ctx, "뒤집혀 있습니다", 60, 172, { s: 12.5, w: "800", c: v("--coral-700") });
      } else {
        text(ctx, "정상 퇴적 상태입니다", 60, 150, { s: 12.5, w: "800", c: v("--mist") });
      }
      text(ctx, "판정한 뒤 오른쪽 설명을", 700, 150, { s: 11.5, c: v("--mist") });
      text(ctx, "확인하세요", 700, 170, { s: 11.5, c: v("--mist") });
      if (said) text(ctx, said, 60, 372, { s: 13.5, w: "900", c: said.indexOf("맞") >= 0 ? v("--teal-700") : v("--rose-700") });
      else text(ctx, "‘위(젊은 쪽)’ 는 퇴적물이 나중에 쌓인 쪽입니다.", 60, 372, { s: 12, c: v("--mist") });
    }
    function say() {
      $("a-updown-info").innerHTML = "<b>" + NAME[str] + "</b> — " + TIP[str] +
        (flip ? " 지금 화면은 <b>뒤집혀</b> 있으니, 구조가 가리키는 ‘위’ 는 그림의 아래쪽에 와 있습니다." : "");
    }
    function answer(pick) {
      var right = flip ? "bot" : "top";
      if (pick === right) {
        said = "✅ 맞았습니다. " + (flip ? "구조가 가리키는 위쪽이 그림의 아래에 있습니다 — 역전된 지층입니다." : "정상 지층이므로 그림의 위쪽이 젊은 쪽입니다.");
        if (flip && !G2.d) { G2.d = true; window.sthState("aFall", G2); mission2(); }
      } else {
        said = "❌ 다시 보세요. " + NAME[str] + "에서 무엇이 ‘위’ 를 가리키는지 오른쪽 설명을 먼저 읽어 보세요.";
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

  /* ---- 장면3 부정합 ---- */
  (function () {
    var canvas = $("a-c-unc"), ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var tilt = 0, eT = 0;
    var got = window.sthState("aUnc") || { a: false, b: false, c: false };
    var RATE = 0.1;                                   /* 1만 년에 0.1 m (= 1년에 0.01 mm) */
    var TOTAL = 200, PXM = 0.9;

    function kind(E) {
      if (E <= 0) return "none";
      if (E >= TOTAL) return "non";
      return tilt > 0 ? "ang" : "par";
    }
    var LABEL = { none: "부정합이 아닙니다", par: "평행 부정합", ang: "경사 부정합", non: "난정합" };

    function draw() {
      paper(ctx, W, H);
      var E = eT * RATE, left = Math.max(0, TOTAL - E), k = kind(E);
      text(ctx, "융기 · 침식 · 침강이 만드는 부정합", 60, 34, { s: 14, w: "900" });

      var X0 = 110, X1 = 620, BASE = 400;
      /* 기반암 화강암 */
      band(ctx, X0, BASE, X1 - X0, 50, "--rose", 0.45);
      ctx.strokeStyle = v("--line"); ctx.lineWidth = 1.5; ctx.strokeRect(X0, BASE, X1 - X0, 50);
      text(ctx, "화강암 기반암", (X0 + X1) / 2, BASE + 30, { s: 12, a: "center", w: "800", c: v("--rose-700") });

      /* 남아 있는 아래 지층 */
      var hpx = left * PXM, cutY = BASE - hpx;
      if (hpx > 1) {
        ctx.save();
        ctx.beginPath(); ctx.rect(X0, cutY, X1 - X0, hpx); ctx.clip();
        var cx = (X0 + X1) / 2, cy = BASE - TOTAL * PXM / 2, ang = -tilt * Math.PI / 180;
        ctx.translate(cx, cy); ctx.rotate(ang); ctx.translate(-cx, -cy);
        var cols = ["--teal", "--brand", "--coral", "--violet", "--amber"];
        for (var i = 0; i < 5; i++) {
          band(ctx, cx - 420, BASE - (i + 1) * 40 * PXM, 840, 40 * PXM - 2, cols[i], 0.65);
        }
        ctx.restore();
      }
      /* 침식면 */
      ctx.strokeStyle = v("--coral"); ctx.lineWidth = 3.5;
      ctx.beginPath();
      for (var x = X0; x <= X1; x += 8) ctx.lineTo(x, cutY + Math.sin(x / 26) * 4);
      ctx.stroke();

      /* 새로 쌓인 지층 두 장 */
      band(ctx, X0, cutY - 54, X1 - X0, 25, "--brand", 0.4);
      band(ctx, X0, cutY - 27, X1 - X0, 25, "--teal", 0.4);
      ctx.strokeStyle = v("--line"); ctx.lineWidth = 1.2;
      ctx.strokeRect(X0, cutY - 54, X1 - X0, 52);
      text(ctx, "다시 가라앉은 뒤 새로 쌓인 지층", X0 + 8, cutY - 62, { s: 11.5, w: "800", c: v("--brand-700") });
      text(ctx, "↑ 부정합면", X1 - 8, cutY + 22, { s: 12, a: "right", w: "900", c: v("--coral-700") });
      text(ctx, "깎여 나간 두께 " + E.toFixed(0) + " m", X0, 462, { s: 12, c: v("--mist") });
      text(ctx, "남은 아래 지층 " + left.toFixed(0) + " m / 200 m", X0 + 220, 462, { s: 12, c: v("--mist") });

      /* 오른쪽 판정판 */
      var px = 660;
      text(ctx, "판정", px, 76, { s: 12, w: "800", c: v("--mist") });
      ctx.strokeStyle = v("--line"); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(px, 88); ctx.lineTo(870, 88); ctx.stroke();
      text(ctx, LABEL[k], px, 124, { s: 21, w: "900", c: k === "none" ? v("--mist") : v("--teal-700") });
      text(ctx, "기울어진 각도 " + tilt + "°", px, 162, { s: 13 });
      text(ctx, "깎인 기간 " + (eT / 100).toFixed(0) + "백만 년", px, 190, { s: 13 });
      text(ctx, "사라진 시간 " + fmtAge(eT * 10000), px, 218, { s: 13, c: v("--coral-700"), w: "800" });
      text(ctx, k === "non" ? "침식이 기반암까지 닿았습니다" : (k === "ang" ? "아래는 기울고 위는 수평입니다" : (k === "par" ? "위아래 지층이 나란합니다" : "깎인 적이 없습니다")),
        px, 252, { s: 12, c: v("--mist") });
      text(ctx, "침식 속도 : 1년에 0.01 mm", px, 290, { s: 11, c: v("--mist") });
      text(ctx, "( 1만 년에 0.1 m )", px, 310, { s: 11, c: v("--mist") });

      var ch = false;
      if (k === "par" && !got.a) { got.a = ch = true; }
      if (k === "ang" && !got.b) { got.b = ch = true; }
      if (k === "non" && !got.c) { got.c = ch = true; }
      if (ch) { window.sthState("aUnc", got); mission(); }

      $("a-unc-read").innerHTML = "깎여 나간 두께: <b>" + E.toFixed(0) + " m</b> (남은 지층 " + left.toFixed(0) + " m)";
      $("a-unc-info").innerHTML =
        k === "none" ? "아직 깎인 적이 없습니다. 퇴적이 끊기지 않고 이어지면 부정합이 생기지 않습니다. <b>깎인 기간</b>을 늘려 보세요."
        : (k === "par" ? "<b>평행 부정합</b>입니다. 지층이 기울지 않은 채로 융기·침식된 뒤 다시 가라앉아 쌓였습니다. 위아래 지층이 나란해서 눈으로는 알아보기 어렵지만, 그 사이에 <b>" + fmtAge(eT * 10000) + "</b> 이 통째로 비어 있습니다."
          : (k === "ang" ? "<b>경사 부정합</b>입니다. 아래 지층은 기울어져 있고 위 지층은 수평이므로, 그 사이에 <b>지각 변동 → 융기 → 침식 → 침강</b> 이 있었다는 뜻입니다. 가장 알아보기 쉬운 부정합입니다."
            : "<b>난정합</b>입니다. 침식이 퇴적층 200 m 를 모두 깎아 내고 <b>화강암 기반암</b>까지 닿았습니다. 땅속 깊은 곳에서 굳은 심성암이 지표에 드러났다는 것은, 그 위를 덮고 있던 암석이 엄청나게 깎여 나갔다는 뜻입니다."));
    }
    function mission() {
      if (got.a) done("m1-3a"); if (got.b) done("m1-3b"); if (got.c) done("m1-3c");
      if (got.a && got.b && got.c) {
        window.sthMission("m1-3", true, "<span class='m-tag'>미션 완료</span>부정합은 <b>쌓이지 않은 시간</b>의 기록입니다. 위아래 지층이 나란하면 <b>평행 부정합</b>, 아래가 기울어져 있으면 <b>경사 부정합</b>, 침식이 심성암·변성암 기반암까지 닿았으면 <b>난정합</b>입니다.");
        ep.clear(2);
      }
    }
    canvas._redraw = draw;
    $("a-tilt").addEventListener("input", function (e) { tilt = +e.target.value; $("a-tilt-val").textContent = tilt + "°"; draw(); });
    $("a-erode").addEventListener("input", function (e) { eT = +e.target.value; $("a-erode-val").textContent = eT + "만 년"; draw(); });
    draw(); mission();
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
      "unc": "<b>부정합면</b> 울퉁불퉁한 이 경계는 <b>침식면</b>입니다. 위아래 지층의 기울기가 다르므로 <b>경사 부정합</b>이고, 그 사이에는 ‘융기 → 침식 → 침강’ 이라는 긴 시간이 통째로 빠져 있습니다.",
      "lime": "<b>㉮ 석회암층</b> 아래 무리에서 지금은 가장 위에 보입니다. 하지만 이 무리는 <b>역전</b>되어 있으므로, 실제로는 <b>가장 먼저</b> 쌓인 지층입니다. 암맥 속 포획암과 같은 암석이기도 합니다.",
      "shale": "<b>㉯ 셰일층 — 고사리 화석</b> 아주 고운 진흙이 굳은 암석입니다. 앞 장면에서 보았듯 고운 입자는 <b>흐름이 거의 없는 잔잔한 물</b>에서만 가라앉습니다. 여기서 고사리 화석이 쏟아져 나왔습니다.",
      "sand": "<b>㉰ 사암층 — 사층리</b> 아래 무리의 맨 아래에 보이지만, 사층리의 비스듬한 엽리가 <b>그림의 아래쪽에서 잘려</b> 있습니다. 잘린 쪽이 위이므로 이 무리는 <b>뒤집혀 있고</b>, ㉰ 는 아래 무리에서 가장 나중에 쌓인 지층입니다.",
      "dike": "<b>㉳ 화강암 암맥 — 관입</b> 아래 무리부터 위 무리까지 <b>전부 가로질러 자르고</b> 있습니다. 관입의 법칙에 따라 암맥은 자신이 자른 모든 지층보다 <b>나중</b>에 생겼습니다. 이 절벽에서 가장 젊은 암석입니다.",
      "xeno": "<b>포획암</b> 암맥 속에 박힌 석회암 조각입니다. 마그마가 뚫고 올라오며 ㉮ 석회암의 조각을 떼어 삼킨 것이므로, <b>석회암이 먼저, 암맥이 나중</b>입니다. 남의 조각을 품은 쪽이 나중입니다."
    };
    function dikeX(y) { return 495 + (300 - y) * 0.08; }

    function draw() {
      paper(ctx, W, H);
      text(ctx, "절벽 단면 — 눌러서 증거를 확인하세요", 60, 34, { s: 14, w: "900" });
      var X0 = 140, X1 = 700;

      band(ctx, X0, 60, X1 - X0, 58, "--violet", sel === "mud" ? 0.85 : 0.5);
      band(ctx, X0, 120, X1 - X0, 58, "--amber", sel === "cong" ? 0.85 : 0.5);
      ctx.fillStyle = v("--ink"); ctx.globalAlpha = 0.5;
      for (var g = 0; g < 26; g++) {
        ctx.beginPath(); ctx.arc(X0 + 20 + g * 21, 132 + (g % 3) * 15, 5, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;

      ctx.save();
      ctx.beginPath(); ctx.rect(X0, 192, X1 - X0, 278); ctx.clip();
      ctx.translate(CX, CY); ctx.rotate(ANG); ctx.translate(-CX, -CY);
      band(ctx, CX - 300, CY - 142, 600, 93, "--brand", sel === "lime" ? 0.9 : 0.6);
      band(ctx, CX - 300, CY - 47, 600, 93, "--teal", sel === "shale" ? 0.9 : 0.6);
      band(ctx, CX - 300, CY + 48, 600, 93, "--coral", sel === "sand" ? 0.9 : 0.6);
      ctx.strokeStyle = v("--ink"); ctx.lineWidth = 1.6; ctx.globalAlpha = 0.5;
      for (var s2 = 0; s2 < 9; s2++) {                 /* 사층리 — 아래쪽에서 잘림 */
        ctx.beginPath();
        ctx.moveTo(CX - 300 + s2 * 66, CY + 52);
        ctx.quadraticCurveTo(CX - 270 + s2 * 66, CY + 100, CX - 230 + s2 * 66, CY + 139);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.restore();

      ctx.strokeStyle = v("--coral"); ctx.lineWidth = sel === "unc" ? 6 : 4;
      ctx.beginPath();
      for (var x = X0; x <= X1; x += 8) ctx.lineTo(x, 185 + Math.sin(x / 22) * 5);
      ctx.stroke();

      ctx.save();                                       /* 암맥 */
      ctx.fillStyle = v("--rose"); ctx.globalAlpha = sel === "dike" ? 0.95 : 0.7;
      ctx.beginPath();
      ctx.moveTo(dikeX(60) - 26, 60); ctx.lineTo(dikeX(60) + 26, 60);
      ctx.lineTo(dikeX(470) + 26, 470); ctx.lineTo(dikeX(470) - 26, 470);
      ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
      ctx.restore();
      ctx.fillStyle = v("--brand"); ctx.strokeStyle = v("--ink"); ctx.lineWidth = sel === "xeno" ? 3 : 1.5;
      ctx.beginPath(); ctx.arc(dikeX(310), 310, 15, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

      /* 이름표 */
      text(ctx, "㉲ 이암 · 건열", X0 + 12, 94, { s: 12.5, w: "900", c: v("--ink") });
      text(ctx, "㉱ 역암 · 기저 역암", X0 + 12, 154, { s: 12.5, w: "900", c: v("--ink") });
      text(ctx, "㉮ 석회암", X0 + 20, 240, { s: 12.5, w: "900", c: v("--ink") });
      text(ctx, "㉯ 셰일 · 고사리 화석", X0 + 20, 330, { s: 12.5, w: "900", c: v("--ink") });
      text(ctx, "㉰ 사암 · 사층리", X0 + 20, 430, { s: 12.5, w: "900", c: v("--ink") });
      text(ctx, "㉳ 암맥", 736, 96, { s: 12.5, w: "900", c: v("--rose-700") });
      text(ctx, "포획암", 736, 314, { s: 12.5, w: "900", c: v("--brand-700") });
      text(ctx, "부정합면", 736, 186, { s: 12.5, w: "900", c: v("--coral-700") });
      ctx.strokeStyle = v("--line"); ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(dikeX(90) + 26, 90); ctx.lineTo(730, 90); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(dikeX(310) + 16, 310); ctx.lineTo(730, 310); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(X1, 185); ctx.lineTo(730, 182); ctx.stroke();

      text(ctx, "조사한 곳 " + G4.seen.length + " / 8", 60, 500, { s: 13, w: "900", c: G4.seen.length >= 8 ? v("--teal-700") : v("--mist") });
      text(ctx, "아래 무리 세 장은 기울어져 있습니다. 위아래부터 판정하세요.", 240, 500, { s: 11.5, c: v("--mist") });
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
      "㉠ 쓸 수 없다 — ‘동물군천이’ 의 법칙이므로 동물 화석만 쓸 수 있다",
      "㉡ 쓸 수 있다 — 식물도 시간에 따라 진화하며 천이하기 때문이다",
      "㉢ 쓸 수 있다 — 식물은 진화하지 않아 어느 시대에나 같은 종이 나오기 때문이다"
    ],
    answer: 1,
    why: [
      "법칙의 이름 때문에 생기는 흔한 오해입니다. 이름은 ‘동물군’ 이지만, 실제로는 식물군도 함께 천이합니다.",
      "그렇습니다. 그래서 이 법칙을 <b>생물군천이의 법칙</b>이라고 부르기도 합니다. 고사리 종류도 시대에 따라 달라지므로 훌륭한 단서가 됩니다.",
      "거꾸로입니다. 식물도 진화하기 때문에 <b>시대마다 다른 종</b>이 나오고, 바로 그래서 순서를 정하는 데 쓸 수 있습니다."
    ],
    onDone: function () { G4.q = true; window.sthState("aSec", G4); mission4(); }
  });

  window.sthOrder({
    mount: "a-order",
    steps: [
      "① 바다 밑에 ㉮ 석회암 · ㉯ 셰일 · ㉰ 사암이 차례로 수평으로 쌓였다",
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
        : "㉡ 이 정답이었습니다. 지층 누중의 법칙에는 ‘역전되지 않았다면’ 이라는 조건이 붙습니다. 퇴적구조로 위아래를 먼저 정해야 합니다.");
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
    question: "반감기가 5,730년인 <b>¹⁴C</b> 로 약 7,000만 년 전 공룡 시대의 응회암 나이를 잴 수 있을까요?",
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

    function draw() {
      paper(ctx, W, H);
      var n = Math.log(100 / p) / Math.LN2, age = n * ISO[iso].t;
      text(ctx, "모원소가 남은 비율 하나로 지나간 시간을 읽는다", 60, 34, { s: 14, w: "900" });

      var X0 = 95, X1 = 520, Y0 = 70, Y1 = 330;
      function XN(nn) { return X0 + nn / 7 * (X1 - X0); }
      function YP(pp) { return Y1 - pp / 100 * (Y1 - Y0); }
      axes(ctx, X0, Y0, X1, Y1);
      for (var k = 0; k <= 7; k++) {
        ctx.strokeStyle = v("--line"); ctx.globalAlpha = 0.45;
        ctx.beginPath(); ctx.moveTo(XN(k), Y0); ctx.lineTo(XN(k), Y1); ctx.stroke(); ctx.globalAlpha = 1;
        text(ctx, k + "", XN(k), Y1 + 18, { s: 10.5, a: "center", c: v("--mist") });
      }
      [0, 25, 50, 75, 100].forEach(function (pp) {
        text(ctx, pp + "%", X0 - 8, YP(pp) + 4, { s: 10.5, a: "right", c: v("--mist") });
      });
      text(ctx, "남은 모원소", X0 - 8, Y0 - 12, { s: 11, a: "right", c: v("--mist") });
      text(ctx, "지나간 반감기 횟수 →", X1, Y1 + 36, { s: 11, a: "right", c: v("--mist") });

      ctx.strokeStyle = v("--teal"); ctx.lineWidth = 3; ctx.beginPath();
      for (var i = 0; i <= 140; i++) {
        var nn2 = i / 140 * 7, x = XN(nn2), y = YP(Math.pow(0.5, nn2) * 100);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      [[1, "1회 · 50%"], [2, "2회 · 25%"], [3, "3회 · 12.5%"]].forEach(function (m) {
        var x = XN(m[0]), y = YP(Math.pow(0.5, m[0]) * 100);
        ctx.strokeStyle = v("--line"); ctx.setLineDash([4, 4]); ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(X0, y); ctx.lineTo(x, y); ctx.lineTo(x, Y1); ctx.stroke(); ctx.setLineDash([]);
        text(ctx, m[1], clamp(x + 6, X0, X1 - 62), y - 8, { s: 10.5, c: v("--mist") });
      });
      ctx.fillStyle = v("--coral");
      ctx.beginPath(); ctx.arc(XN(clamp(n, 0, 7)), YP(p), 7, 0, Math.PI * 2); ctx.fill();

      /* 오른쪽 계산판 */
      var px = 560;
      text(ctx, "쓰고 있는 시계", px, 76, { s: 11.5, w: "800", c: v("--mist") });
      text(ctx, ISO[iso].label + "  →  " + ISO[iso].d, px, 104, { s: 16, w: "900", c: v("--violet-700") });
      text(ctx, "반감기 " + ISO[iso].hl, px, 128, { s: 12.5, c: v("--mist") });
      text(ctx, "지나간 반감기 횟수", px, 168, { s: 11.5, w: "800", c: v("--mist") });
      text(ctx, n.toFixed(2) + " 회", px, 198, { s: 24, w: "900" });
      text(ctx, "절대연령", px, 238, { s: 11.5, w: "800", c: v("--mist") });
      text(ctx, fmtAge(age), px, 270, { s: 26, w: "900", c: v("--teal-700") });

      var bx0 = 560, bx1 = 870, by = 320;
      band(ctx, bx0, by, (bx1 - bx0) * p / 100, 30, "--teal", 0.85);
      band(ctx, bx0 + (bx1 - bx0) * p / 100, by, (bx1 - bx0) * (100 - p) / 100, 30, "--brand", 0.55);
      ctx.strokeStyle = v("--line"); ctx.lineWidth = 1.5; ctx.strokeRect(bx0, by, bx1 - bx0, 30);
      text(ctx, "모원소 " + p.toFixed(2) + "%", bx0, by - 8, { s: 11.5, w: "800", c: v("--teal-700") });
      text(ctx, "자원소 " + (100 - p).toFixed(2) + "%", bx1, by - 8, { s: 11.5, a: "right", w: "800", c: v("--brand-700") });
      text(ctx, "모원소 : 자원소 = 1 : " + ((100 - p) / p).toFixed(2), bx0, by + 52, { s: 14, w: "900" });

      if (p <= 5) {
        text(ctx, "⚠ 측정 한계에 가깝습니다", 60, 392, { s: 14, w: "900", c: v("--rose-700") });
        text(ctx, "남은 모원소가 5 % 아래이면 오차가 급격히 커집니다." + (iso === "C14" ? " ¹⁴C 로 잴 수 있는 것은 길어야 수만 년까지입니다." : ""),
          60, 416, { s: 12, c: v("--mist") });
      } else {
        text(ctx, "반감기는 온도·압력이 바뀌어도 달라지지 않습니다. 그래서 믿을 수 있는 시계입니다.", 60, 400, { s: 12, c: v("--mist") });
      }

      var ch = false;
      if (Math.abs(p - 50) <= 0.3 && !got.a) { got.a = ch = true; }
      if (Math.abs(p - 12.5) <= 0.3 && !got.b) { got.b = ch = true; }
      if (iso === "C14" && p <= 5 && !got.c) { got.c = ch = true; }
      if (ch) { window.sthState("bHalf", got); mission(); }

      $("b-half-read").innerHTML = "절대연령: <b>" + fmtAge(age) + "</b> (반감기 " + ISO[iso].hl + " × " + n.toFixed(2) + "회)";
      $("b-half-info").innerHTML = "모원소가 처음 양의 절반으로 줄어드는 데 걸리는 시간이 <b>반감기</b>입니다. 반감기가 n번 지나면 모원소는 <b>(1/2)<sup>n</sup></b> 만큼 남고, 줄어든 만큼은 모두 <b>자원소</b>가 되어 암석 안에 갇혀 있습니다. 그래서 두 양의 비만 재면 n 이 나오고, 거기에 반감기를 곱하면 절대연령이 됩니다." +
        (p <= 5 ? " — 지금은 모원소가 너무 적게 남아 <b>측정 한계</b>에 가깝습니다." : "");
    }
    function mission() {
      if (got.a) done("m2-2a"); if (got.b) done("m2-2b"); if (got.c) done("m2-2c");
      if (got.a && got.b && got.c) {
        window.sthMission("m2-2", true, "<span class='m-tag'>미션 완료</span>1 : 1 이면 반감기 1번, 1 : 7 이면 3번입니다(남은 모원소 12.5 %). 그리고 남은 모원소가 너무 적어지면 더 이상 잴 수 없습니다 — 시계마다 <b>잴 수 있는 시간의 폭</b>이 정해져 있다는 뜻입니다.");
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

    function draw() {
      paper(ctx, W, H);
      var S = SAMP[k], ratio = S.age / ISO[iso].t, remain = Math.pow(0.5, ratio) * 100;
      var judge = ratio < LO ? "short" : (ratio > HI ? "long" : "ok");
      text(ctx, "시계마다 잴 수 있는 시간의 폭이 다르다", 60, 34, { s: 14, w: "900" });

      /* 로그 시간축 */
      var ay = 250;
      ctx.strokeStyle = v("--line"); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(95, ay); ctx.lineTo(855, ay); ctx.stroke();
      [[1e3, "1천 년"], [1e5, "10만 년"], [1e7, "1천만 년"], [1e9, "10억 년"], [1e10, "100억 년"]].forEach(function (m) {
        var x = LX(m[0]);
        ctx.beginPath(); ctx.moveTo(x, ay); ctx.lineTo(x, ay + 7); ctx.stroke();
        text(ctx, m[1], clamp(x, 130, 820), ay + 24, { s: 10.5, a: "center", c: v("--mist") });
      });
      text(ctx, "잴 수 있는 범위 (반감기의 1/50 ~ 10배)", 95, 74, { s: 12, w: "800", c: v("--mist") });

      var rows = [["C14", "--coral", 100], ["K40", "--violet", 140], ["U238", "--teal", 180]];
      rows.forEach(function (r) {
        var x0 = LX(ISO[r[0]].t * LO), x1 = LX(ISO[r[0]].t * HI);
        band(ctx, x0, r[2] - 11, Math.max(x1 - x0, 3), 22, r[1], r[0] === iso ? 0.85 : 0.3);
        ctx.strokeStyle = v("--line"); ctx.lineWidth = 1.2; ctx.strokeRect(x0, r[2] - 11, Math.max(x1 - x0, 3), 22);
        text(ctx, ISO[r[0]].label, clamp(x0 - 8, 60, 860), r[2] + 5, { s: 12.5, a: "right", w: "900", c: v(r[1] + "-700") });
      });

      var sx = LX(S.age);
      ctx.strokeStyle = v("--ink"); ctx.lineWidth = 2.5; ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.moveTo(sx, 88); ctx.lineTo(sx, ay); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = v("--ink");
      ctx.beginPath(); ctx.arc(sx, ay, 7, 0, Math.PI * 2); ctx.fill();
      text(ctx, S.n, clamp(sx, 150, 780), 300, { s: 13.5, a: "center", w: "900" });
      text(ctx, "실제 나이 약 " + fmtAge(S.age), clamp(sx, 150, 780), 322, { s: 11.5, a: "center", c: v("--mist") });

      /* 판정 */
      var msg = judge === "ok" ? "✅ 잴 수 있습니다" : (judge === "long" ? "✖ 너무 오래되었습니다" : "✖ 너무 최근입니다");
      text(ctx, msg, 60, 372, { s: 20, w: "900", c: judge === "ok" ? v("--teal-700") : v("--rose-700") });
      text(ctx, "나이 ÷ 반감기 = " + (ratio < 0.001 ? ratio.toExponential(1) : ratio.toFixed(3)) + " 배", 330, 372, { s: 13.5, w: "800" });
      text(ctx, "남을 모원소 " + (remain > 99.99 ? "99.99 % 이상" : (remain < 0.01 ? "0.01 % 미만" : remain.toFixed(2) + " %")), 600, 372, { s: 13.5, w: "800" });
      text(ctx, S.m, 60, 404, { s: 11.5, c: v("--mist") });
      text(ctx, "잰 시료 " + got.s.filter(function (x) { return x; }).length + " / 4", 60, 428, { s: 12, w: "900", c: v("--teal-700") });

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
        window.sthMission("m2-3", true, "<span class='m-tag'>미션 완료</span>숯은 ¹⁴C, 응회암·화강암은 ⁴⁰K, 운석은 ²³⁸U 나 ⁴⁰K 로 잽니다. 나이가 반감기보다 <b>훨씬 길면 모원소가 남지 않고</b>, <b>훨씬 짧으면 자원소가 생기지 않습니다.</b> 그래서 재려는 시간에 맞는 시계를 골라야 합니다.");
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
      window.sthMission("m2-4", true, "<span class='m-tag'>미션 완료</span>같은 500만 년인데 가 지역은 1년에 0.05 mm, 나 지역은 0.012 mm 로 쌓였습니다. <b>지층이 두껍다고 해서 더 오랜 시간이 걸린 것은 아닙니다.</b> 두 지역을 이어 준 것은 두께가 아니라 <b>건층(응회암)</b> 과 <b>표준 화석</b> 이었습니다.");
      ep.clear(3); ep.clear(4);
    }
  }
  (function () {
    var canvas = $("b-c-corr"), ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var site = 0, rate = 30;                             /* rate : 0.001 mm/년 단위 */
    var REAL = [250, 60], DT = 5e6;

    function draw() {
      paper(ctx, W, H);
      var mmPerYr = rate / 1000, calc = mmPerYr * DT / 1000;   /* m */
      var real = REAL[site], ok = Math.abs(calc - real) <= 5;
      text(ctx, "건층으로 이어 붙인 두 지역 — 같은 500만 년, 다른 두께", 60, 34, { s: 14, w: "900" });

      var BASE = 400, PX = 0.62;
      function col(x0, idx, name) {
        var h = REAL[idx] * PX;
        band(ctx, x0, BASE, 110, 18, "--violet", 0.8);           /* 아래 응회암 */
        band(ctx, x0, BASE - h, 110, h - 2, idx === 0 ? "--teal" : "--coral", 0.45);
        band(ctx, x0, BASE - h - 20, 110, 18, "--violet", 0.8);  /* 위 응회암 */
        ctx.strokeStyle = v("--line"); ctx.lineWidth = 1.4;
        ctx.strokeRect(x0, BASE - h - 20, 110, h + 38);
        text(ctx, name, x0 + 55, BASE + 44, { s: 13, a: "center", w: "900", c: idx === site ? v("--brand-700") : v("--mist") });
        text(ctx, REAL[idx] + " m", x0 + 55, BASE - h / 2 + 4, { s: 12.5, a: "center", w: "900" });
        return { top: BASE - h - 11, bot: BASE + 9, x0: x0, x1: x0 + 110 };
      }
      var A = col(130, 0, "가 지역"), B = col(390, 1, "나 지역");
      ctx.strokeStyle = v("--violet"); ctx.lineWidth = 2.4; ctx.setLineDash([7, 5]);
      ctx.beginPath(); ctx.moveTo(A.x1, A.top); ctx.lineTo(B.x0, B.top); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(A.x1, A.bot); ctx.lineTo(B.x0, B.bot); ctx.stroke();
      ctx.setLineDash([]);
      text(ctx, "위 응회암 · 6,900만 년 전", 130, 88, { s: 12, w: "800", c: v("--violet-700") });
      text(ctx, "아래 응회암 · 7,400만 년 전", 130, 456, { s: 12, w: "800", c: v("--violet-700") });
      text(ctx, "두 건층 사이 = 500만 년", 130, 478, { s: 12, w: "800", c: v("--coral-700") });
      ctx.strokeStyle = v("--line"); ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(130, 96); ctx.lineTo(500, 96); ctx.stroke();

      /* 계산판 */
      var px = 580;
      text(ctx, "두께 = 퇴적 속도 × 시간", px, 84, { s: 12, w: "800", c: v("--mist") });
      ctx.strokeStyle = v("--line"); ctx.beginPath(); ctx.moveTo(px, 96); ctx.lineTo(870, 96); ctx.stroke();
      text(ctx, "내가 넣은 속도", px, 130, { s: 11.5, w: "800", c: v("--mist") });
      text(ctx, mmPerYr.toFixed(3) + " mm/년", px, 158, { s: 19, w: "900", c: v("--brand-700") });
      text(ctx, "× 500만 년 =", px, 192, { s: 12, c: v("--mist") });
      text(ctx, calc.toFixed(0) + " m", px, 226, { s: 26, w: "900", c: ok ? v("--teal-700") : v("--ink") });
      text(ctx, "실제 " + real + " m (" + (site === 0 ? "가" : "나") + " 지역)", px, 256, { s: 13, w: "800", c: v("--mist") });
      text(ctx, ok ? "✅ 맞았습니다" : (calc < real ? "더 빠르게 (속도 ↑)" : "더 느리게 (속도 ↓)"),
        px, 290, { s: 15, w: "900", c: ok ? v("--teal-700") : v("--rose-700") });

      var gx0 = 580, gw = 280;
      band(ctx, gx0, 320, gw * clamp(real / 300, 0, 1), 18, "--mist", 0.45);
      band(ctx, gx0, 344, gw * clamp(calc / 300, 0, 1), 18, ok ? "--teal" : "--brand", 0.8);
      text(ctx, "실제 두께", gx0, 314, { s: 10.5, c: v("--mist") });
      text(ctx, "내 계산", gx0, 380, { s: 10.5, c: v("--mist") });
      text(ctx, "두 지역의 퇴적 속도는 다르지만", px, 420, { s: 11.5, c: v("--mist") });
      text(ctx, "두 건층 사이의 시간은 똑같습니다", px, 440, { s: 11.5, c: v("--mist") });

      var ch = false;
      if (site === 0 && ok && !G4.a) { G4.a = ch = true; }
      if (site === 1 && ok && !G4.b) { G4.b = ch = true; }
      if (ch) { window.sthState("bCorr", G4); mission4(); }

      $("b-corr-read").innerHTML = "계산한 두께: <b>" + calc.toFixed(0) + " m</b> / 실제 " + real + " m";
      $("b-corr-info").innerHTML = ok
        ? "<b>맞았습니다.</b> " + (site === 0 ? "가 지역은 1년에 0.05 mm 씩 쌓였습니다." : "나 지역은 1년에 0.012 mm 씩 쌓였습니다.") + " 두 지역은 같은 500만 년을 보냈는데 두께는 네 배 넘게 차이가 납니다. <b>지층의 두께는 시간이 아니라 퇴적 속도가 정합니다.</b>"
        : "화산재가 굳은 <b>응회암</b>은 짧은 기간에 넓은 지역에 한꺼번에 쌓여, 멀리 떨어진 두 지역을 잇는 <b>건층(열쇠층)</b> 이 됩니다. 두 응회암의 절대연령 차이가 500만 년이므로, 그 사이 지층은 어느 지역에서나 같은 500만 년 동안 쌓인 것입니다.";
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
        { t: "색과 두께가 뚜렷해 멀리서도 알아보는 얇은 석탄층", a: "key", why: "특징이 뚜렷하고 넓게 이어지면 건층으로 쓸 수 있습니다.", hint: "‘어느 지역에서나 알아볼 수 있는가’ 를 따져 보세요." },
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
      { id: "b2", label: "실습 연구원에게 보내는 답장", hint: "같은 절벽인데 시료마다 다른 동위원소를 써야 하는 까닭을, ‘너무 길면’ 과 ‘너무 짧으면’ 두 경우로 나누어 쓰세요." }
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
      d: "지구가 태어나고(46억 년 전) 굳은 뒤, 바다가 생기고 최초의 생명체가 나타난 시기입니다. 초기 대기에는 산소가 거의 없었고, 약 27억 년 전부터 <b>남세균</b>이 광합성으로 산소를 내놓으면서 바다와 대기의 산소가 늘었습니다. 말기에 이르러 단단한 껍데기가 없는 다세포 생물이 나타났습니다. 전체 지질 시대의 <b>약 88 %</b> 를 차지합니다." };
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

    function draw() {
      paper(ctx, W, H);
      var age = ageOf(day, hour), era = eraOf(age);
      text(ctx, "46억 년을 1년으로 줄인 달력 — 1월 1일 0시에 지구가 태어났다", 60, 34, { s: 14, w: "900" });

      var GX = 62, GY = 76, CW = 66, CH = 10.4;
      var idx = 0;
      for (var m = 0; m < 12; m++) {
        text(ctx, (m + 1) + "월", GX + m * CW + CW / 2 - 2, GY - 10, { s: 11, a: "center", w: "800", c: v("--mist") });
        for (var dd = 0; dd < MDAYS[m]; dd++) {
          idx++;
          var e2 = eraOf(ageOf(idx, 12));
          ctx.fillStyle = v(e2.c); ctx.globalAlpha = idx === day ? 1 : 0.45;
          ctx.fillRect(GX + m * CW, GY + dd * CH, CW - 5, CH - 2);
          ctx.globalAlpha = 1;
          if (idx === day) {
            ctx.strokeStyle = v("--ink"); ctx.lineWidth = 2.4;
            ctx.strokeRect(GX + m * CW - 2, GY + dd * CH - 2, CW - 1, CH + 2);
          }
        }
      }
      var LEG = [["선캄브리아 시대", "--mist"], ["고생대", "--teal"], ["중생대", "--coral"], ["신생대", "--violet"]];
      var lx = 62;
      LEG.forEach(function (g) {
        ctx.fillStyle = v(g[1]); ctx.globalAlpha = 0.8; ctx.fillRect(lx, 404, 16, 12); ctx.globalAlpha = 1;
        text(ctx, g[0], lx + 22, 414, { s: 11.5, w: "800", c: v(g[1] === "--mist" ? "--mist" : g[1] + "-700") });
        lx += g[0].length * 13 + 52;
      });

      text(ctx, dateLabel(day) + "  " + Math.floor(hour) + "시 " + (hour % 1 ? "30" : "00") + "분", 62, 448, { s: 17, w: "900", c: v("--brand-700") });
      text(ctx, "→ 약 " + fmtAge(age * 1e6) + " 전  ·  " + era.n, 320, 448, { s: 15, w: "900" });
      text(ctx, "하루 = 약 1,260만 년", 700, 448, { s: 11.5, c: v("--mist") });

      var ch = false;
      if (Math.abs(age - P_START) <= 10 && !got.a) { got.a = ch = true; }
      if (Math.abs(age - M_START) <= 10 && !got.b) { got.b = ch = true; }
      if (Math.abs(age - C_START) <= 8 && !got.c) { got.c = ch = true; }
      if (day === 365 && hour >= 23.5 && !got.d) { got.d = ch = true; }
      if (ch) { window.sthState("cCal", got); mission(); }

      $("c-cal-read").innerHTML = "지금 이 시각은 약 <b>" + fmtAge(age * 1e6) + " 전</b> — " + era.n;
      $("c-cal-info").innerHTML = "<b>" + era.n + "</b> — " + era.d +
        (day === 365 && hour >= 23.5 ? " <br><b>지금 남은 시간은 30분도 되지 않습니다.</b> 이 마지막 30분이 사람(호모 사피엔스)이 살아온 약 30만 년입니다." : "");
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
      [66, 23, "팔", "팔레오기"], [23, 2.6, "네", "네오기"], [2.6, 0, "제4", "제4기"]
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
      paper(ctx, W, H);
      var ei = evAt(t);
      text(ctx, "해양 생물 다양성 모형 곡선과 다섯 번의 대멸종", 60, 34, { s: 14, w: "900" });

      axes(ctx, X0, Y0, X1, Y1);
      ctx.strokeStyle = v("--teal"); ctx.lineWidth = 2.8; ctx.beginPath();
      for (var aa = 541; aa >= 0; aa--) {
        var x = XT(aa), y = YD(D[aa]);
        if (aa === 541) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      text(ctx, "↑ 생물 종류의 수 (모형)", X0 + 4, Y0 - 6, { s: 11, c: v("--mist") });

      EV.forEach(function (e, i) {
        var x = XT(e.t);
        ctx.strokeStyle = v("--rose"); ctx.lineWidth = i === ei ? 3 : 1.5; ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.moveTo(x, Y0); ctx.lineTo(x, Y1); ctx.stroke(); ctx.setLineDash([]);
        text(ctx, "①②③④⑤".charAt(i), x, Y0 - 12, { s: 14, a: "center", w: "900", c: G3.v[i] ? v("--teal-700") : v("--rose-700") });
      });
      var cx = XT(t);
      ctx.strokeStyle = v("--ink"); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx, Y0); ctx.lineTo(cx, Y1); ctx.stroke();
      ctx.fillStyle = v("--ink");
      ctx.beginPath(); ctx.arc(cx, YD(D[Math.round(clamp(t, 0, 541))]), 6, 0, Math.PI * 2); ctx.fill();

      /* 기(紀) 띠 */
      PER.forEach(function (p, i) {
        var x0 = XT(p[0]), x1 = XT(p[1]);
        band(ctx, x0, Y1 + 4, x1 - x0, 24, i % 2 ? "--brand" : "--teal", 0.3);
        ctx.strokeStyle = v("--line"); ctx.lineWidth = 1; ctx.strokeRect(x0, Y1 + 4, x1 - x0, 24);
        if (x1 - x0 > 20) text(ctx, p[2], (x0 + x1) / 2, Y1 + 21, { s: 11, a: "center", w: "800", c: v("--mist") });
      });
      /* 대(代) 띠 */
      [[541, 252, "고생대", "--teal"], [252, 66, "중생대", "--coral"], [66, 0, "신생대", "--violet"]].forEach(function (g) {
        var x0 = XT(g[0]), x1 = XT(g[1]);
        band(ctx, x0, Y1 + 30, x1 - x0, 22, g[3], 0.45);
        ctx.strokeStyle = v("--line"); ctx.lineWidth = 1; ctx.strokeRect(x0, Y1 + 30, x1 - x0, 22);
        text(ctx, g[2], (x0 + x1) / 2, Y1 + 46, { s: 11.5, a: "center", w: "900", c: v(g[3] + "-700") });
      });
      text(ctx, "541", X0, Y1 + 66, { s: 10.5, a: "center", c: v("--mist") });
      text(ctx, "0 (현재)", X1, Y1 + 66, { s: 10.5, a: "right", c: v("--mist") });
      text(ctx, "← 백만 년 전", (X0 + X1) / 2, Y1 + 66, { s: 10.5, a: "center", c: v("--mist") });

      var per = "";
      for (var q = 0; q < PER.length; q++) if (t <= PER[q][0] && t > PER[q][1]) per = PER[q][3];
      if (!per) per = "제4기";
      text(ctx, t + "백만 년 전 · " + per, 60, 66, { s: 13.5, w: "900" });
      if (ei >= 0) text(ctx, EV[ei].n + " 대멸종 — 생물 속의 약 " + Math.round(EV[ei].sev * 100) + " % 가 사라짐", 340, 66, { s: 13.5, w: "900", c: v("--rose-700") });
      else text(ctx, "찾은 대멸종 " + G3.v.filter(function (x) { return x; }).length + " / 5", 340, 66, { s: 13, w: "900", c: v("--mist") });

      if (ei >= 0 && !G3.v[ei]) { G3.v[ei] = true; window.sthState("cExt", G3); mission3(); }

      $("c-ext-read").innerHTML = ei >= 0
        ? "멸종률: <b>약 " + Math.round(EV[ei].sev * 100) + " %</b> (" + EV[ei].n + ")"
        : "멸종률: 지금은 대멸종 시기가 아닙니다";
      $("c-ext-info").innerHTML = ei >= 0
        ? "<b>" + EV[ei].n + " 대멸종</b> (약 " + EV[ei].t + "백만 년 전) — " + EV[ei].d
        : "지금은 <b>" + per + "</b> 입니다. 지질 시대의 경계는 암석의 종류가 아니라 <b>생물계의 큰 변화</b>로 정합니다. 곡선이 뚝 떨어지는 다섯 자리를 찾아보세요.";
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

    function draw() {
      paper(ctx, W, H);
      var good = span <= 1000 && area >= 4;
      text(ctx, "좋은 표준 화석의 조건 — 짧게 살고, 넓게 퍼질 것", 60, 34, { s: 14, w: "900" });

      band(ctx, XS(50), YA(6) - 8, XS(1000) - XS(50), YA(4) - YA(6) + 8, "--teal", 0.22);
      axes(ctx, X0, Y0, X1, Y1);
      [50, 100, 500, 1000, 5000, 20000].forEach(function (s) {
        text(ctx, s >= 10000 ? (s / 10000) + "억" : s + "", XS(s), Y1 + 18, { s: 10.5, a: "center", c: v("--mist") });
      });
      text(ctx, "살았던 기간 (만 년) →", X1, Y1 + 38, { s: 11, a: "right", c: v("--mist") });
      for (var a2 = 1; a2 <= 6; a2++) text(ctx, a2 + "", X0 - 8, YA(a2) + 4, { s: 10.5, a: "right", c: v("--mist") });
      text(ctx, "대륙 수", X0 - 8, Y0 - 12, { s: 11, a: "right", c: v("--mist") });
      text(ctx, "좋은 표준 화석", (XS(50) + XS(1000)) / 2, YA(5) + 4, { s: 13, a: "center", w: "900", c: v("--teal-700") });

      ctx.fillStyle = v(good ? "--teal" : "--rose");
      ctx.beginPath(); ctx.arc(XS(span), YA(area), 9, 0, Math.PI * 2); ctx.fill();

      var px = 600;
      text(ctx, "판정", px, 84, { s: 12, w: "800", c: v("--mist") });
      ctx.strokeStyle = v("--line"); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(px, 96); ctx.lineTo(872, 96); ctx.stroke();
      text(ctx, good ? "좋은 표준 화석" : (span > 1000 ? "너무 오래 살았다" : "너무 좁게 퍼졌다"),
        px, 130, { s: 19, w: "900", c: good ? v("--teal-700") : v("--rose-700") });
      text(ctx, "살았던 기간 " + (span >= 10000 ? (span / 10000).toFixed(1) + "억 년" : span + "만 년"), px, 168, { s: 12.5 });
      text(ctx, "나오는 대륙 " + area + " 곳 / 6 곳", px, 194, { s: 12.5 });
      text(ctx, "좁힐 수 있는 폭", px, 230, { s: 11.5, w: "800", c: v("--mist") });
      text(ctx, "백악기의 " + (span / CRET * 100).toFixed(0) + " %", px, 258, { s: 20, w: "900", c: span <= 1000 ? v("--teal-700") : v("--rose-700") });
      var bw = 250;
      band(ctx, px, 276, bw, 16, "--mist", 0.3);
      band(ctx, px, 276, bw * clamp(span / CRET, 0, 1), 16, span <= 1000 ? "--teal" : "--rose", 0.8);
      text(ctx, "만나 볼 수 있을 확률 " + Math.round(area / 6 * 100) + " %", px, 320, { s: 12.5, w: "800" });
      band(ctx, px, 330, bw, 16, "--mist", 0.3);
      band(ctx, px, 330, bw * area / 6, 16, area >= 4 ? "--teal" : "--rose", 0.8);
      text(ctx, "1,000만 년 이하 · 4개 대륙 이상을 기준으로 삼았습니다", 60, 372, { s: 11.5, c: v("--mist") });
      text(ctx, "오래 살고 특정 환경에서만 사는 생물은 시대가 아니라 ‘그때의 환경’ 을 알려 주는 시상 화석이 됩니다.", 60, 396, { s: 11.5, c: v("--mist") });

      var ch = false;
      if (good && !G4.a) { G4.a = ch = true; }
      if (span >= 10000 && !G4.b) { G4.b = ch = true; }
      if (area === 1 && !G4.c) { G4.c = ch = true; }
      if (ch) { window.sthState("cIdx", G4); mission4(); }

      $("c-index-read").innerHTML = "판정: <b>" + (good ? "좋은 표준 화석" : (span > 1000 ? "너무 오래 살았다" : "너무 좁게 퍼졌다")) + "</b>";
      $("c-index-info").innerHTML = good
        ? "<b>좋은 표준 화석입니다.</b> 이 화석이 나오면 지층의 나이를 백악기 전체의 " + (span / CRET * 100).toFixed(0) + " % 폭까지 좁힐 수 있고, 대륙 " + area + " 곳에서 나오므로 멀리 떨어진 지역끼리도 이어 붙일 수 있습니다."
        : (span > 1000 ? "<b>너무 오래 살았습니다.</b> 이 생물이 나온다고 해서 지층의 시기를 좁힐 수가 없습니다. 예를 들어 고생대부터 지금까지 사는 생물이라면, 그 화석은 시대를 가르는 데 아무 도움이 되지 않습니다."
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
        : "㉡ 이 정답이었습니다. ‘중생대의 큰 파충류’ 와 ‘공룡’ 은 같은 말이 아닙니다. 익룡·어룡·수장룡은 공룡이 아닙니다.");
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
    { key: "r3", label: "③ 다섯 번의 대멸종과 화석 달력" }
  ],
  items: [
    { id: "all", label: "세 사건을 꿰는 한 문장", hint: "지층은 순서를 말해 주고(상대연령), 방사성 동위원소는 햇수를 말해 주며(절대연령), 화석은 시대를 말해 줍니다. 세 이야기에서 ‘무엇이 먼저인가’ 와 ‘몇 년 전인가’ 가 어떻게 이어졌는지 한 문장으로 쓰세요." },
    { id: "w4", label: "아직 헷갈리는 것", hint: "다음 시간에 여기서부터 시작합니다." }
  ]
});

/* ========================================================================= 05 우리 반 */
window.sthShare({
  mount: "share", unit: "eshs-2-1", unitLabel: "[지구과학 Ⅱ-1] 지구의 역사",
  rows: [
    { key: "r1", label: "① 절벽에 적힌 순서" },
    { key: "r2", label: "② 반으로, 또 반으로" },
    { key: "r3", label: "③ 다섯 번의 대멸종과 화석 달력" }
  ],
  line: { id: "all", label: "세 사건을 꿰는 한 문장" }
});

})();
