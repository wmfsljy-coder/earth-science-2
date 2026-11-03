/* 지구과학 Ⅰ-2 대기와 해양의 상호작용과 기후 변화 — 소단원별 이야기 세 편
   ① 멸치가 사라진 해 ② 기후를 흔드는 것들 ③ 탄소를 줄이는 회의
   공용 부품: ../assets/theme.js (sthUnit·sthState·sthGate·sthWork·setupCanvas·cssVar·drawArrow),
             ../assets/story.js (sthStory·sthMission·sthSort·sthOrder·sthPick), ../assets/share.js */
(function () {
"use strict";

window.sthUnit("eshs-1-2");

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
/* setTimeout 애니메이션 (가려진 탭에서는 그리지 않는다) */
function anim(canvas, step) {
  K.animate(canvas, function (dt) { step(dt); });
}
/* 방위각(북=0, 시계 방향) → 화면 단위 벡터 */
function azVec(az) { var r = az * Math.PI / 180; return { x: Math.sin(r), y: -Math.cos(r) }; }
function azName(az) {
  var n = ((az % 360) + 360) % 360;
  var names = ["북", "북동", "동", "남동", "남", "남서", "서", "북서"];
  return names[Math.round(n / 45) % 8];
}
function bar(ctx, x, y, w, h, col, alpha) {
  ctx.save(); ctx.globalAlpha = alpha == null ? 1 : alpha;
  ctx.fillStyle = v(col); ctx.beginPath(); ctx.roundRect(x, y, w, h, 4); ctx.fill(); ctx.restore();
}

/* =========================================================================
   이야기 ① 멸치가 사라진 해
   ========================================================================= */
(function () {
  var ep = window.sthStory({ root: "epA", key: "epA", name: "사건 파일 ①", onDone: finish });

  window.sthGate({
    gate: "a-gate", key: "a-p", title: "관측사의 첫 추리",
    question: "페루 앞바다가 세계에서 손꼽히는 어장이 된 까닭은 무엇일까요?",
    options: [
      "㉠ 적도에 가까워 바닷물이 늘 따뜻하기 때문",
      "㉡ 바람이 표층수를 밀어내고, 그 자리로 깊은 곳의 찬물이 올라오기 때문",
      "㉢ 아마존강이 영양염을 실어다 주기 때문",
      "㉣ 남극에서 떠내려온 빙산이 녹으면서 먹이를 풀어놓기 때문"
    ],
    onPick: function (i) {
      window.sthState("aOK", i === 1 ? "맞음" : "어긋남");
      ep.clear(0);
    }
  });

  /* ---- 장면2 연안 용승·침강 ---- */
  (function () {
    var canvas = $("a-c-up"), ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var az = 90, ws = 7, t = 0;
    var got = window.sthState("aUp") || { a: false, b: false, c: false };

    /* 남반구 : 에크만 수송은 바람의 왼쪽 90° */
    function ekAz() { return ((az - 90) % 360 + 360) % 360; }
    /* 바다는 서쪽(270°). +면 바다 쪽(용승), −면 해안 쪽(침강) */
    function offshore() { return Math.cos((ekAz() - 270) * Math.PI / 180); }
    function upIndex() { return ws * offshore(); }
    function sst() { return clamp(20.5 - 0.42 * upIndex(), 14, 24); }
    function nutrient() { return clamp(upIndex() / 12 * 100, 0, 100); }
    function fish() { return clamp(1.7 * nutrient(), 0, 170); }

    function gauge(x, y, w, label, val, max, col, txt) {
      K.t(ctx, label, x, y, { s: 11.5, w: "800", c: KC.mute });
      ctx.fillStyle = "rgba(255,255,255,.08)"; ctx.beginPath(); ctx.roundRect(x, y + 8, w, 10, 5); ctx.fill();
      ctx.save(); ctx.shadowColor = col; ctx.shadowBlur = 8; ctx.fillStyle = col;
      ctx.beginPath(); ctx.roundRect(x, y + 8, Math.max(6, w * clamp(val / max, 0, 1)), 10, 5); ctx.fill(); ctx.restore();
      K.t(ctx, txt, x, y + 42, { s: 18, w: "900", c: col });
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      var off = offshore(), mode = off >= 0.5 ? "up" : (off <= -0.5 ? "down" : "none");
      var T = sst(), nut = nutrient(), fi = fish();
      var LW = 330, TOPH = 300;
      /* ── 왼쪽: 위에서 본 페루 앞바다 ── */
      K.stage(ctx, 0, 0, LW, TOPH, "ocean", { seed: 201 });
      K.pill(ctx, "위에서 본 모습 (남반구)", 16, 28, { s: 12.5, c: KC.blue });
      var lx = 20, ly = 48, lw = LW - 40, lh = 238;
      land(ctx, lx + lw - 60, ly, 60, lh);
      ctx.strokeStyle = "rgba(220,240,200,.5)"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(lx + lw - 60, ly); ctx.lineTo(lx + lw - 60, ly + lh); ctx.stroke();
      if (mode === "up") { var cg = ctx.createLinearGradient(lx + lw - 60, 0, lx + lw - 150, 0); cg.addColorStop(0, "rgba(120,200,255,.5)"); cg.addColorStop(1, "rgba(120,200,255,0)"); ctx.fillStyle = cg; ctx.fillRect(lx + lw - 150, ly, 90, lh); }
      if (mode === "down") { var wg = ctx.createLinearGradient(lx + lw - 60, 0, lx + lw - 150, 0); wg.addColorStop(0, "rgba(255,150,100,.38)"); wg.addColorStop(1, "rgba(255,150,100,0)"); ctx.fillStyle = wg; ctx.fillRect(lx + lw - 150, ly, 90, lh); }
      K.pill(ctx, "페루(육지)", lx + lw - 30, ly + lh - 12, { s: 11, a: "center", c: "#e2f2cf", box: [0, LW] });
      K.pill(ctx, "태평양", lx + 50, ly + lh - 12, { s: 11, a: "center", c: KC.blue });
      K.t(ctx, "↑ 북", lx + 10, ly + 18, { s: 11, w: "800", c: KC.mute });
      var wv = azVec(az), ev = azVec(ekAz()), mx = lx + 130, my = ly + lh / 2;
      var wl = 18 + ws * 3.4;
      ctx.save(); ctx.shadowBlur = 8; ctx.lineWidth = 4;
      ctx.shadowColor = KC.yellow; ctx.strokeStyle = KC.yellow; ctx.fillStyle = KC.yellow;
      window.drawArrow(ctx, mx, my, mx + wv.x * wl, my + wv.y * wl, 11);
      ctx.shadowColor = KC.red; ctx.strokeStyle = KC.red; ctx.fillStyle = KC.red;
      window.drawArrow(ctx, mx, my, mx + ev.x * 44, my + ev.y * 44, 11);
      ctx.restore();
      K.pill(ctx, "바람", clamp(mx + wv.x * (wl + 18), lx + 24, lx + lw - 84), clamp(my + wv.y * (wl + 18) + 4, ly + 16, ly + lh - 30), { s: 11.5, a: "center", c: KC.yellow, box: [0, LW] });
      K.pill(ctx, "에크만 수송", clamp(mx + ev.x * 72, lx + 50, lx + lw - 110), clamp(my + ev.y * 72 + 4, ly + 34, ly + lh - 30), { s: 11.5, a: "center", c: KC.red, box: [0, LW] });

      /* ── 오른쪽: 해안 단면 (해안은 오른쪽) ── */
      var RX = LW + 8;
      K.stage(ctx, RX, 0, W - RX, TOPH, "night", { seed: 203 });
      K.pill(ctx, "해안 단면 (해안은 오른쪽)", RX + 16, 28, { s: 12.5, c: KC.blue });
      var sx0 = RX + 16, sx1 = W - 16, sy0 = 62, sy1 = TOPH - 14, coast = sx1 - 58;
      var thermo = mode === "up" ? 120 : (mode === "down" ? 246 : 196);
      /* 따뜻한 표층(위) / 찬 심층(아래) — 수온약층이 경계 */
      ctx.save(); ctx.beginPath(); ctx.rect(sx0, sy0, coast - sx0, sy1 - sy0); ctx.clip();
      var deep = ctx.createLinearGradient(0, sy0, 0, sy1); deep.addColorStop(0, "#1b4f9a"); deep.addColorStop(1, "#06183f");
      ctx.fillStyle = deep; ctx.fillRect(sx0, sy0, coast - sx0, sy1 - sy0);
      var dy = mode === "up" ? -26 : (mode === "down" ? 18 : 0);
      ctx.beginPath(); ctx.moveTo(sx0, sy0); ctx.lineTo(coast, sy0); ctx.lineTo(coast, thermo + dy); ctx.lineTo(sx0, thermo); ctx.closePath();
      var wsf = ctx.createLinearGradient(0, sy0, 0, thermo); wsf.addColorStop(0, "rgba(80,190,230,.95)"); wsf.addColorStop(1, "rgba(40,130,200,.85)");
      ctx.fillStyle = wsf; ctx.fill();
      ctx.restore();
      ctx.save(); ctx.strokeStyle = KC.green; ctx.lineWidth = 2.2; ctx.setLineDash([7, 5]); ctx.shadowColor = KC.green; ctx.shadowBlur = 6;
      ctx.beginPath(); ctx.moveTo(sx0, thermo); ctx.lineTo(coast, thermo + dy); ctx.stroke(); ctx.restore();
      K.pill(ctx, "수온약층", sx0 + 10, thermo - 10, { s: 11.5, c: KC.green });
      var cl = ctx.createLinearGradient(coast, 0, sx1, 0); cl.addColorStop(0, "#6b5a40"); cl.addColorStop(1, "#4a3d2c");
      ctx.fillStyle = cl; ctx.beginPath(); ctx.moveTo(coast + 10, sy0 - 18); ctx.lineTo(sx1, sy0 - 18); ctx.lineTo(sx1, sy1); ctx.lineTo(coast, sy1); ctx.closePath(); ctx.fill();
      K.pill(ctx, "육지", (coast + sx1) / 2 + 4, sy0 + 2, { s: 11, a: "center", c: "#e2f2cf", box: [RX, W] });
      ctx.save(); ctx.shadowColor = KC.red; ctx.shadowBlur = 8; ctx.strokeStyle = KC.red; ctx.fillStyle = KC.red; ctx.lineWidth = 5;
      if (mode === "up") window.drawArrow(ctx, coast - 20, sy0 + 26, sx0 + 40, sy0 + 26, 13);
      else if (mode === "down") window.drawArrow(ctx, sx0 + 40, sy0 + 26, coast - 20, sy0 + 26, 13);
      ctx.restore();
      if (mode === "none") K.pill(ctx, "표층 수송이 해안과 나란합니다", sx0 + 30, sy0 + 32, { s: 12, c: KC.ink });
      else K.pill(ctx, "표층 에크만 수송", (sx0 + coast) / 2, sy0 + 50, { s: 11.5, a: "center", c: KC.red });
      if (mode !== "none") {
        var col = mode === "up" ? "rgba(127,211,255,.95)" : "rgba(255,179,92,.95)";
        ctx.save(); ctx.globalAlpha = .6; ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 3;
        for (var i = 0; i < 3; i++) {
          var ax = coast - 50 + i * 16 - 40;
          if (mode === "up") window.drawArrow(ctx, ax, sy1 - 14, ax, sy0 + 64, 10);
          else window.drawArrow(ctx, ax, sy0 + 64, ax, sy1 - 14, 10);
        }
        ctx.restore();
        for (var j = 0; j < 10; j++) {
          var ph = ((t * 0.035) + j / 10) % 1;
          var py = mode === "up" ? sy1 - 14 - ph * (sy1 - sy0 - 80) : sy0 + 64 + ph * (sy1 - sy0 - 80);
          K.glow(ctx, coast - 150 + (j % 3) * 22, py, 2.5, col, 3);
        }
        if (mode === "up") { var R = K.rng(15); for (var n = 0; n < 16; n++) { var nx = coast - 200 + R() * 190, ny = sy0 + 8 + R() * 40; ctx.globalAlpha = .5 + .4 * Math.sin(t * .2 + n); K.glow(ctx, nx, ny, 1.3, "rgba(150,255,200,.9)", 3); } ctx.globalAlpha = 1; }
      }
      K.pill(ctx, mode === "up" ? "찬 심층수 상승 — 연안 용승" : (mode === "down" ? "표층수 하강 — 연안 침강" : "용승도 침강도 없음"),
        sx0 + 10, sy1 - 12, { s: 13, c: mode === "none" ? KC.mute : (mode === "up" ? KC.blue : KC.orange) });

      /* ── 아래 계기판 ── */
      K.stage(ctx, 0, TOPH + 8, W, H - TOPH - 8, "night", { seed: 205 });
      K.t(ctx, "바람 " + azName(az) + "쪽 (" + az + "°) · 세기 " + ws.toFixed(1) + " m/s → 에크만 수송 " + azName(ekAz()) + "쪽 · 용승 지수 = 세기 × 바다 쪽 성분 = " + upIndex().toFixed(1), 20, TOPH + 32, { s: 11, w: "800", c: KC.ink });
      gauge(20, TOPH + 52, 250, "표층 수온", T - 14, 10, T <= 18 ? KC.blue : (T >= 22 ? KC.orange : KC.ink), T.toFixed(1) + " ℃");
      gauge(320, TOPH + 52, 250, "영양염 지수", nut, 100, KC.green, Math.round(nut) + " %");
      gauge(620, TOPH + 52, 250, "멸치 어획 지수", fi, 170, fi >= 90 ? KC.green : KC.red, Math.round(fi) + " %");
      K.t(ctx, "깊은 바다의 찬물에는 영양염이 많습니다. 그 물이 올라와야 플랑크톤이 늘고, 멸치 떼가 모입니다.", 20, H - 10, { s: 10.5, c: KC.mute });

      var ch = false;
      if (T <= 18 && !got.a) { got.a = ch = true; }
      if (T >= 22 && !got.b) { got.b = ch = true; }
      if (ws <= 3 && !got.c) { got.c = ch = true; }
      if (ch) { window.sthState("aUp", got); mission(); }

      $("a-up-info").innerHTML = mode === "up" ?
        "에크만 수송이 <b>바다 쪽</b>을 향합니다. 빠져나간 표층수를 채우려 <b>찬 심층수가 올라오고(연안 용승)</b>, 수온약층도 해안 가까이에서 얕아집니다. 영양염이 함께 올라와 좋은 어장이 섭니다." :
        (mode === "down" ? "에크만 수송이 <b>해안 쪽</b>을 향합니다. 표층수가 해안에 쌓여 가라앉는 <b>연안 침강</b>이 일어나고, 따뜻하고 영양염이 적은 물이 두껍게 덮입니다." :
          "바람이 해안과 직각으로 불면 에크만 수송이 <b>해안과 나란해져</b> 용승도 침강도 일어나지 않습니다. 슬라이더를 돌려 해안과 <b>나란한</b> 바람을 만들어 보세요.");
    }
    function mission() {
      if (got.a) done("m1-2a"); if (got.b) done("m1-2b"); if (got.c) done("m1-2c");
      if (got.a && got.b && got.c) {
        window.sthMission("m1-2", true, "<span class='m-tag'>미션 완료</span>같은 해안, 같은 바다인데 <b>바람 하나로 용승과 침강이 뒤집힙니다.</b> 그리고 방향이 맞아도 바람이 약하면 찬물은 거의 올라오지 못합니다. 페루 앞바다의 풍요는 <b>바람이 만든 것</b>이었습니다.");
        ep.clear(1);
      }
    }
    canvas._redraw = draw;
    $("a-wd").addEventListener("input", function (e) { az = +e.target.value; $("a-wd-val").textContent = azName(az) + " (" + az + "°)"; draw(); });
    $("a-ws").addEventListener("input", function (e) { ws = +e.target.value; $("a-ws-val").textContent = ws.toFixed(1) + " m/s"; draw(); });
    draw(); mission();
    var playU = playBtn("a-up-play");
    anim(canvas, function (dt) { if (playU.on) { t += dt / 70; draw(); } });
  })();

  /* ---- 장면3 워커 순환과 엔소 ---- */
  (function () {
    var canvas = $("a-c-enso"), ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var k = 1, t = 0;
    var got = window.sthState("aEnso") || { a: false, b: false, c: false };

    function anom() { return 4.0 * (1 - k); }
    function sstW() { return 29.5 + 0.6 * (k - 1); }
    function sstE() { return 23.5 + anom(); }
    function soi() { return 5.0 * (k - 1); }
    function fish() { return clamp(100 - 40 * anom(), 0, 180); }
    function phase() { return anom() >= 0.5 ? "엘니뇨" : (anom() <= -0.5 ? "라니냐" : "평상시"); }

    function tCol(c) {   /* 수온 → 색 (20 ℃ 파랑 … 30 ℃ 빨강) */
      var u = clamp((c - 20) / 10, 0, 1);
      return "rgb(" + Math.round(40 + 215 * u) + "," + Math.round(120 + 60 * Math.sin(u * Math.PI)) + "," + Math.round(230 - 190 * u) + ")";
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      var a = anom(), ph = phase();
      var TOP = 344;
      K.stage(ctx, 0, 0, W, TOP, "night", { seed: 211 });
      K.pill(ctx, "열대 태평양의 적도 단면 — 무역풍이 만드는 워커 순환", 16, 28, { s: 13, c: KC.blue });
      var bx0 = 70, bx1 = 830, by0 = 160, by1 = 330;
      /* 대기: 하늘 */
      var sk = ctx.createLinearGradient(0, 50, 0, by0); sk.addColorStop(0, "rgba(30,50,110,.0)"); sk.addColorStop(1, "rgba(80,120,190,.25)");
      ctx.fillStyle = sk; ctx.fillRect(bx0, 50, bx1 - bx0, by0 - 50);
      /* 워커 순환 고리: 강수대에서 오르고, 위에서 동쪽으로, 동쪽에서 내려와, 아래(무역풍)로 서쪽으로 */
      var cloudX = bx0 + 160 + 420 * clamp(1 - k, 0, 0.7) / 0.7;
      var lx0 = cloudX, lx1 = bx1 - 50, ly0 = 70, ly1 = by0 - 14, str = clamp(k, 0.15, 1.7);
      ctx.save(); ctx.globalAlpha = .35 + .3 * clamp(k / 1.7, 0, 1); ctx.strokeStyle = "rgba(200,215,255,.6)"; ctx.lineWidth = 1.4; ctx.setLineDash([4, 6]);
      ctx.beginPath(); ctx.roundRect(lx0, ly0, lx1 - lx0, ly1 - ly0, 30); ctx.stroke(); ctx.restore();
      function loopPt(u) {
        var w = lx1 - lx0, h = ly1 - ly0, per = 2 * w + 2 * h, d = u * per;
        if (d < h) return { x: lx0, y: ly1 - d };            /* 상승 */
        d -= h; if (d < w) return { x: lx0 + d, y: ly0 };     /* 위로 동쪽 */
        d -= w; if (d < h) return { x: lx1, y: ly0 + d };     /* 하강 */
        d -= h; return { x: lx1 - d, y: ly1 };                /* 무역풍(서쪽) */
      }
      for (var q = 0; q < 22; q++) {
        var p = loopPt((q / 22 + t * 0.004 * str) % 1);
        ctx.globalAlpha = .45 + .45 * clamp(k / 1.7, 0, 1); K.glow(ctx, p.x, p.y, 2.2, "rgba(255,211,107,.95)", 3); ctx.globalAlpha = 1;
      }
      /* 무역풍 화살표 */
      ctx.save(); ctx.shadowColor = KC.yellow; ctx.shadowBlur = 8;
      K.arrow(ctx, { x: lx1 - 10, y: ly1 }, { x: Math.max(lx0 + 30, lx1 - 10 - 200 * str), y: ly1 }, KC.yellow, 2 + 3 * k, 10 + 5 * k);
      ctx.restore();
      K.pill(ctx, "무역풍 " + k.toFixed(2) + "배 (동 → 서)", (bx0 + bx1) / 2 + 120, ly1 - 12, { s: 12, a: "center", c: KC.yellow });
      K.pill(ctx, "하강 기류 · 건조", lx1 - 8, ly0 + 46, { s: 11, a: "right", c: KC.mute });
      /* 강수대 구름 */
      var cg = ctx.createLinearGradient(0, 70, 0, 130); cg.addColorStop(0, "#eef2fb"); cg.addColorStop(1, "#7e88a6");
      ctx.fillStyle = cg; ctx.beginPath();
      for (var c = 0; c < 5; c++) { var px = cloudX - 48 + c * 24, py = 100 + (c % 2) * 8, pr = 18 + (c === 2 ? 8 : 0); ctx.moveTo(px + pr, py); ctx.arc(px, py, pr, 0, Math.PI * 2); }
      ctx.fill();
      ctx.strokeStyle = "rgba(170,210,255,.7)"; ctx.lineWidth = 1.4;
      for (var d = 0; d < 7; d++) { var pp = ((t * 0.05) + d / 7) % 1, rx = cloudX - 40 + d * 13; ctx.beginPath(); ctx.moveTo(rx, 124 + pp * 26); ctx.lineTo(rx - 2, 132 + pp * 26); ctx.stroke(); }
      K.pill(ctx, "강수대(상승 기류)", cloudX, 64, { s: 11.5, a: "center", c: KC.violet, box: [bx0, bx1] });

      /* 바다 */
      var yW = clamp(240 + 52 * k, 170, 322), yE = clamp(240 - 52 * k, 166, 322);
      ctx.save(); ctx.beginPath(); ctx.rect(bx0, by0, bx1 - bx0, by1 - by0); ctx.clip();
      var cold = ctx.createLinearGradient(0, by0, 0, by1); cold.addColorStop(0, "#1b4f9a"); cold.addColorStop(1, "#06183f");
      ctx.fillStyle = cold; ctx.fillRect(bx0, by0, bx1 - bx0, by1 - by0);
      var warm = ctx.createLinearGradient(bx0, 0, bx1, 0); warm.addColorStop(0, tCol(sstW())); warm.addColorStop(1, tCol(sstE()));
      ctx.beginPath(); ctx.moveTo(bx0, by0); ctx.lineTo(bx1, by0); ctx.lineTo(bx1, yE); ctx.lineTo(bx0, yW); ctx.closePath();
      ctx.globalAlpha = .75; ctx.fillStyle = warm; ctx.fill(); ctx.globalAlpha = 1;
      ctx.restore();
      ctx.save(); ctx.strokeStyle = KC.green; ctx.lineWidth = 2.6; ctx.shadowColor = KC.green; ctx.shadowBlur = 6;
      ctx.beginPath(); ctx.moveTo(bx0, yW); ctx.lineTo(bx1, yE); ctx.stroke(); ctx.restore();
      ctx.strokeStyle = "rgba(200,230,255,.5)"; ctx.lineWidth = 1.4; ctx.strokeRect(bx0, by0, bx1 - bx0, by1 - by0);
      K.pill(ctx, "수온약층", bx0 + 14, yW - 10, { s: 11.5, c: KC.green });
      K.pill(ctx, "따뜻한 표층수", (bx0 + bx1) / 2, by0 + 26, { s: 12, a: "center", c: "#ffd2b0" });
      K.pill(ctx, "서태평양 (인도네시아)", bx0 + 8, by0 + 24, { s: 11, c: KC.ink });
      K.pill(ctx, "동태평양 (페루)", bx1 - 8, by0 + 24, { s: 11, a: "right", c: KC.ink });
      /* 적도 용승 (동쪽) */
      ctx.save(); ctx.globalAlpha = clamp(k, .2, 1); ctx.shadowColor = KC.blue; ctx.shadowBlur = 8;
      K.arrow(ctx, { x: bx1 - 40, y: by1 - 10 }, { x: bx1 - 40, y: yE + 16 }, KC.blue, 2 + 3 * k, 10);
      ctx.restore();
      if (k >= 0.6) K.pill(ctx, "적도 용승", bx1 - 52, (yE + by1) / 2 - 4, { s: 11, a: "right", c: KC.blue });

      /* ── 아래: 적도를 따라 잰 표층 수온 띠 ── */
      K.stage(ctx, 0, TOP + 8, W, H - TOP - 8, "lab", { seed: 213 });
      var sy = TOP + 54, sh = 24;
      var strip = ctx.createLinearGradient(bx0, 0, bx1, 0); strip.addColorStop(0, tCol(sstW())); strip.addColorStop(.6, tCol((sstW() * .4 + sstE() * .6))); strip.addColorStop(1, tCol(sstE()));
      ctx.fillStyle = strip; ctx.beginPath(); ctx.roundRect(bx0, sy, bx1 - bx0, sh, 8); ctx.fill();
      K.t(ctx, "적도를 따라 잰 표층 수온", bx0, sy - 10, { s: 11.5, w: "800", c: KC.mute });
      K.pill(ctx, sstW().toFixed(1) + " ℃", bx0 + 8, sy + sh + 24, { s: 12, c: KC.orange });
      K.pill(ctx, sstE().toFixed(1) + " ℃ (편차 " + (a >= 0 ? "+" : "") + a.toFixed(2) + ")", bx1 - 8, sy + sh + 24, { s: 12, a: "right", c: a >= 0.5 ? KC.red : (a <= -0.5 ? KC.blue : KC.ink) });
      K.pill(ctx, ph, W / 2, sy + sh + 26, { s: 15, a: "center", c: ph === "엘니뇨" ? KC.red : (ph === "라니냐" ? KC.blue : KC.ink) });
      K.t(ctx, "남방 진동 지수는 동태평양(타히티)과 서태평양(다윈)의 기압 차입니다. 음수면 엘니뇨, 양수면 라니냐 쪽입니다.", W / 2, H - 30, { s: 11, a: "center", c: KC.mute });
      K.t(ctx, "수온 편차 +0.5 ℃ 이상 → 엘니뇨,  −0.5 ℃ 이하 → 라니냐", W / 2, H - 12, { s: 11, a: "center", c: KC.mute });

      $("a-enso-read").innerHTML =
        "<span class='k'>동태평양 수온 편차</span><span class='v " + (a >= 0.5 ? "r" : (a <= -0.5 ? "b" : "y")) + "'>" + (a >= 0 ? "+" : "") + a.toFixed(2) + " ℃ · " + ph + "</span>" +
        "<span class='k'>남방 진동 지수</span><span class='v b'>" + (soi() >= 0 ? "+" : "") + soi().toFixed(2) + "</span>" +
        "<span class='k'>페루 어획 지수</span><span class='v " + (fish() >= 100 ? "g" : "r") + "'>" + Math.round(fish()) + " %</span>" +
        "<span class='sub'>서태평양 " + sstW().toFixed(1) + " ℃ · 동태평양 " + sstE().toFixed(1) + " ℃</span>";

      var ch = false;
      if (a >= 0.5 && !got.a) { got.a = ch = true; }
      if (a <= -0.5 && !got.b) { got.b = ch = true; }
      if (fish() <= 50 && !got.c) { got.c = ch = true; }
      if (ch) { window.sthState("aEnso", got); mission(); }

      $("a-enso-info").innerHTML = ph === "엘니뇨" ?
        "<b>엘니뇨</b> — 무역풍이 약해지자 서쪽에 쌓여 있던 따뜻한 물이 동쪽으로 퍼졌습니다. 동태평양의 <b>수온약층이 깊어져 용승이 약해지고</b> 수온이 오릅니다. 상승 기류가 서는 자리(강수대)가 <b>동쪽으로 이동</b>해, 페루는 홍수·인도네시아는 가뭄 경향이 됩니다." :
        (ph === "라니냐" ? "<b>라니냐</b> — 무역풍이 강해져 따뜻한 물이 더 서쪽으로 몰렸습니다. 동태평양의 <b>용승이 강해져</b> 수온이 더 내려가고, 서태평양의 강수는 더 많아집니다. 페루 어장은 오히려 풍년입니다." :
          "<b>평상시</b> — 무역풍이 따뜻한 표층수를 서쪽에 쌓아 수온약층이 서쪽은 깊고 동쪽은 얕습니다. 서태평양은 상승 기류로 비가 많고, 동태평양은 하강 기류로 건조합니다. 이 고리가 <b>워커 순환</b>입니다.");
    }
    function mission() {
      if (got.a) done("m1-3a"); if (got.b) done("m1-3b"); if (got.c) done("m1-3c");
      if (got.a && got.b && got.c) {
        window.sthMission("m1-3", true, "<span class='m-tag'>미션 완료</span>엘니뇨와 라니냐는 서로 다른 사건이 아니라 <b>무역풍 세기가 만드는 한 축의 양 끝</b>입니다. 바다의 수온 변화(엘니뇨·라니냐)와 대기의 기압 변화(남방 진동)는 한 몸이라 묶어서 <b>엔소(ENSO)</b>라고 부릅니다.");
        ep.clear(2);
      }
    }
    canvas._redraw = draw;
    $("a-trade").addEventListener("input", function (e) { k = +e.target.value; $("a-trade-val").textContent = k.toFixed(2) + "배"; draw(); });
    draw(); mission();
    var playE = playBtn("a-enso-play");
    anim(canvas, function (dt) { if (playE.on) { t += dt / 70; draw(); } });
  })();

  /* ---- 장면4 원격 영향 ---- */
  (function () {
    var canvas = $("a-c-tele"), ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var a = 0;
    var got = window.sthState("aTele") || { a: false, b: false, c: false };

    var REG = [
      { n: "적도 중·동태평양", f: 50 },
      { n: "페루·에콰도르 서해안", f: 45 },
      { n: "미국 남부", f: 25 },
      { n: "인도 몬순 지역", f: -20 },
      { n: "인도네시아·오스트레일리아 북부", f: -40 }
    ];
    function rain(i) { return clamp(REG[i].f * a, -100, 120); }
    function fish() { return clamp(100 - 35 * a, 0, 180); }

    function draw() {
      paper(ctx, W, H, "lab", 221);
      head(ctx, "열대 태평양의 수온 편차가 세계 각지에 남기는 자국 (원격 영향)");

      var cx = 470, half = 190, y0 = 76;
      [-100, -50, 0, 50, 100].forEach(function (p) {
        var x = cx + p / 100 * half;
        ctx.strokeStyle = p === 0 ? KC.line : KC.grid; ctx.lineWidth = p === 0 ? 1.6 : 1;
        ctx.beginPath(); ctx.moveTo(x, y0 - 8); ctx.lineTo(x, y0 + 5 * 42 + 2); ctx.stroke();
        K.t(ctx, (p > 0 ? "+" : "") + p + "%", x, y0 - 14, { s: 10.5, a: "center", c: KC.mute, w: "600" });
      });
      K.t(ctx, "← 가뭄 쪽    평년 대비 강수량    홍수 쪽 →", cx, y0 + 5 * 42 + 22, { s: 11.5, a: "center", w: "800", c: KC.mute });

      REG.forEach(function (r, i) {
        var yy = y0 + i * 42 + 8, val = rain(i);
        K.pill(ctx, r.n, 24, yy + 15, { s: 11.5, c: KC.ink });
        var wpx = Math.abs(val) / 100 * half, wet = val >= 0;
        var g = ctx.createLinearGradient(cx, 0, wet ? cx + half : cx - half, 0);
        g.addColorStop(0, wet ? "rgba(127,211,255,.35)" : "rgba(255,179,92,.35)"); g.addColorStop(1, wet ? "rgba(127,211,255,1)" : "rgba(255,107,80,1)");
        ctx.save(); ctx.shadowColor = wet ? KC.blue : KC.orange; ctx.shadowBlur = wpx > 4 ? 8 : 0;
        ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(wet ? cx : cx - wpx, yy, Math.max(wpx, 1.5), 22, 6); ctx.fill(); ctx.restore();
        K.t(ctx, (val > 0 ? "+" : "") + Math.round(val) + " %", 676, yy + 17, { s: 13, w: "900", c: val > 0 ? KC.blue : (val < 0 ? KC.orange : KC.mute) });
        if (val <= -40) K.pill(ctx, "☀ 가뭄", 746, yy + 17, { s: 12, c: KC.orange });
        else if (val >= 40) K.pill(ctx, "💧 홍수", 746, yy + 17, { s: 12, c: KC.blue });
      });

      /* 강수대가 옮겨 가는 열대 태평양 띠 */
      var sx0 = 60, sx1 = 840, sy = 334;
      var sg = ctx.createLinearGradient(sx0, 0, sx1, 0);
      sg.addColorStop(0, "rgba(255,140,90," + (0.55 - 0.08 * a).toFixed(2) + ")"); sg.addColorStop(1, a >= 0 ? "rgba(255,120,80," + (0.15 + 0.15 * a).toFixed(2) + ")" : "rgba(90,150,255," + (0.35 - 0.1 * a).toFixed(2) + ")");
      ctx.fillStyle = sg; ctx.beginPath(); ctx.roundRect(sx0, sy, sx1 - sx0, 16, 8); ctx.fill();
      K.t(ctx, "서태평양", sx0, sy + 32, { s: 10.5, c: KC.mute }); K.t(ctx, "동태평양", sx1, sy + 32, { s: 10.5, a: "right", c: KC.mute });
      var cX = sx0 + 150 + clamp(a, -3, 3) / 3 * 240 + 120 * (a > 0 ? 1 : 0) * clamp(a / 3, 0, 1);
      var cg = ctx.createLinearGradient(0, sy - 34, 0, sy - 4); cg.addColorStop(0, "#eef2fb"); cg.addColorStop(1, "#7e88a6");
      ctx.fillStyle = cg; ctx.beginPath();
      [[-22, -14, 12], [0, -20, 15], [22, -14, 12]].forEach(function (q) { ctx.moveTo(cX + q[0] + q[2], sy + q[1]); ctx.arc(cX + q[0], sy + q[1], q[2], 0, 6.2832); });
      ctx.fill();
      K.pill(ctx, "강수대", cX + 44, sy - 10, { s: 11, c: KC.violet, box: [sx0, sx1] });

      var ph = a >= 0.5 ? "엘니뇨" : (a <= -0.5 ? "라니냐" : "평상시");
      K.pill(ctx, "수온 편차 " + (a >= 0 ? "+" : "") + a.toFixed(1) + " ℃ · " + ph, 24, 390, { s: 14, c: a >= 0.5 ? KC.red : (a <= -0.5 ? KC.blue : KC.ink) });
      K.pill(ctx, "페루 어획 지수 " + Math.round(fish()) + " %", 330, 390, { s: 14, c: fish() >= 120 ? KC.green : (fish() <= 60 ? KC.red : KC.ink) });
      K.t(ctx, "비구름이 서는 자리가 옮겨 가면, 원래 비를 받던 곳은 가뭄이 들고 건조하던 곳에는 홍수가 납니다.", 24, 414, { s: 11.5, c: KC.mute });
      K.t(ctx, "같은 해에 지구 반대편의 두 나라가 정반대 재해를 겪는 까닭이 여기에 있습니다.", 24, 433, { s: 11.5, c: KC.mute });

      var ch = false;
      if (rain(4) <= -40 && !got.a) { got.a = ch = true; }
      if (fish() >= 120 && !got.b) { got.b = ch = true; }
      if (ch) { window.sthState("aTele", got); mission(); }

      $("a-tele-info").innerHTML = a >= 0.5 ?
        "엘니뇨 때는 강수대가 <b>동쪽으로</b> 옮겨 갑니다. 원래 비가 많던 인도네시아·오스트레일리아 북부는 <b>가뭄</b>, 건조하던 페루 서해안은 <b>홍수</b>. 인도 몬순은 약해지는 경향이 있고, 미국 남부는 비가 늘어나는 경향이 있습니다." :
        (a <= -0.5 ? "라니냐 때는 강수대가 <b>서쪽으로</b> 더 몰립니다. 인도네시아·오스트레일리아 북부는 비가 많아지고, 페루 서해안은 더 건조해집니다. 동태평양의 용승이 강해져 <b>어획량은 오히려 늘어납니다.</b>" :
          "수온 편차가 0에 가까우면 강수대가 제자리에 있습니다. 슬라이더를 좌우로 밀어 강수대가 통째로 옮겨 가는 모습을 보세요.");
    }
    function mission() {
      if (got.a) done("m1-4a"); if (got.b) done("m1-4b"); if (got.c) done("m1-4c");
      if (got.a && got.b && got.c) {
        window.sthMission("m1-4", true, "<span class='m-tag'>미션 완료</span>엔소는 열대 태평양에서 시작되지만, <b>대기를 타고 지구 곳곳으로 전달됩니다.</b> 그래서 페루의 홍수와 오스트레일리아의 가뭄이 같은 해에 일어납니다. 이것을 <b>원격 상관(원격 영향)</b>이라고 합니다.");
        ep.clear(3); ep.clear(4);
      }
    }
    canvas._redraw = draw;
    $("a-anom").addEventListener("input", function (e) { a = +e.target.value; $("a-anom-val").textContent = (a >= 0 ? "+" : "") + a.toFixed(1) + " ℃"; draw(); });
    draw();

    window.sthSort({
      mount: "a-sort",
      buckets: [
        { id: "nina", label: "라니냐", sub: "무역풍 강화 · 동태평양 저온" },
        { id: "norm", label: "평상시", sub: "무역풍 평년 수준" },
        { id: "nino", label: "엘니뇨", sub: "무역풍 약화 · 동태평양 고온" }
      ],
      items: [
        { t: "동태평양의 수온약층이 깊어지고 적도 용승이 약해졌다", a: "nino", why: "따뜻한 물이 동쪽으로 퍼지면서 수온약층이 깊어져 찬물이 올라오지 못합니다.", hint: "무역풍이 약해지면 따뜻한 물이 어디로 갈까요?" },
        { t: "페루 어부의 그물이 비고, 남아메리카 서해안에 홍수가 났다", a: "nino", why: "용승이 약해져 어장이 무너지고, 강수대가 동쪽으로 옮겨 와 비가 쏟아집니다." },
        { t: "남방 진동 지수가 뚜렷한 음수를 기록했다", a: "nino", why: "동태평양의 기압이 내려가고 서태평양의 기압이 올라가면 지수가 음수가 됩니다.", hint: "지수는 동태평양 기압 − 서태평양 기압입니다." },
        { t: "따뜻한 표층수가 서쪽에 쌓이고 동태평양은 용승으로 차갑다", a: "norm", why: "무역풍이 평년 수준으로 불 때의 모습입니다." },
        { t: "서태평양은 상승 기류로 비가 많고 동태평양은 하강 기류로 건조하다", a: "norm", why: "워커 순환이 평년대로 돌고 있는 모습입니다." },
        { t: "동태평양의 용승이 더 강해져 표층 수온이 평년보다 낮아졌다", a: "nina", why: "무역풍이 강해지면 용승도 강해집니다." },
        { t: "인도네시아와 오스트레일리아 북부에 큰비가 이어졌다", a: "nina", why: "강수대가 서쪽으로 더 몰려 비가 많아집니다.", hint: "엘니뇨 때와 정반대로 생각해 보세요." }
      ],
      onDone: function () { got.c = true; window.sthState("aTele", got); mission(); }
    });
    mission();
  })();

  function finish() { window.sthState("r1", "해결 · 페루의 풍요는 연안 용승이 만든 것, 무역풍이 약해지면 엘니뇨가 되어 지구 반대편까지 흔든다"); }
  function vsA() {
    var p = window.sthState("a-p") || "";
    $("a-vs").innerHTML = "<b>나의 첫 추리</b> " + (p || "기록 없음") + "<br>" +
      (p.indexOf("㉡") === 0 ? "정확했습니다. 그리고 오늘은 그 찬물을 끌어올리는 것이 <b>바람</b>이라는 것, 바람이 약해지면 어장이 통째로 무너진다는 것까지 확인했습니다."
        : "㉡ 이 정답이었습니다. 따뜻한 물이 아니라 <b>깊은 곳에서 올라온 찬물</b>이 페루 앞바다를 먹여 살리고 있었습니다.");
  }
  vsA();
  ep.onShow(vsA);
  window.sthWork({
    mount: "wkA", unitLabel: "[지구과학 Ⅰ-2] 이야기 ① 멸치가 사라진 해",
    items: [
      { id: "w1", label: "용승이 일어나는 조건", hint: "어느 방향의 바람이 불 때 용승이 일어나는지, 에크만 수송과 연결해 쓰세요." },
      { id: "w2", label: "엘니뇨 때 달라지는 것", hint: "평상시와 엘니뇨 때 무역풍·수온약층·강수 지역이 어떻게 달라지는지 하나씩 짝지어 쓰세요." }
    ]
  });
})();

/* =========================================================================
   이야기 ② 기후를 흔드는 것들
   ========================================================================= */
(function () {
  var ep = window.sthStory({ root: "epB", key: "epB", name: "사건 파일 ②", onDone: finish });

  window.sthGate({
    gate: "b-gate", key: "b-p", title: "자료실의 첫 추리",
    question: "화산이 뿜어낸 <b>에어로졸</b>은 지구의 기온을 어떻게 바꿀까요?",
    options: [
      "㉠ 에어로졸은 모두 햇빛을 반사하므로 반드시 기온을 낮춘다",
      "㉡ 대체로 낮추지만, 복사 에너지를 흡수해 기온을 높이는 에어로졸도 있다",
      "㉢ 에어로졸은 기온과 아무 관계가 없다",
      "㉣ 에어로졸은 모두 기온을 높인다"
    ],
    onPick: function (i) {
      window.sthState("bOK", i === 1 ? "맞음" : "어긋남");
      ep.clear(0);
    }
  });

  /* ---- 장면2 밀란코비치 ---- */
  (function () {
    var canvas = $("b-c-milan"), ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var tilt = 23.4, ecc = 0.017, prec = 0;
    var got = window.sthState("bMil") || { a: false, b: false, c: false };

    function Q() { return 480 * (1 + 2.0 * ecc * Math.cos((prec - 180) * Math.PI / 180)) * (1 + 0.06 * (tilt - 23.44)); }
    function seasonName(p) {
      var names = ["겨울", "늦겨울", "봄", "늦봄", "여름", "늦여름", "가을", "늦가을"];
      return names[Math.round(((p % 360) + 360) % 360 / 45) % 8];
    }

    var orb = 0;
    function earth(cx, cy, r, label, col, la) {
      var rad = tilt * Math.PI / 180, L = r + 13;
      ctx.save(); ctx.strokeStyle = "rgba(255,255,255,.85)"; ctx.lineWidth = 1.6; ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(cx - Math.sin(rad) * L, cy - Math.cos(rad) * L);
      ctx.lineTo(cx + Math.sin(rad) * L, cy + Math.cos(rad) * L);
      ctx.stroke(); ctx.restore();
      K.earth(ctx, cx, cy, r);
      K.pill(ctx, label, cx, cy + r + 30, { s: 11, a: la || "center", c: col, box: [0, 480] });
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      var q = Q();
      var LW = 480;
      K.stage(ctx, 0, 0, LW, 362, "space", { seed: 231 });
      K.pill(ctx, "지구 운동의 세 가지 변화", 16, 28, { s: 13, c: KC.blue });

      /* 궤도 */
      var cx = 240, cy = 200, A = 168, eVis = clamp(ecc * 6, 0, 0.36);
      var B = A * Math.sqrt(1 - eVis * eVis), c0 = A * eVis;
      ctx.strokeStyle = "rgba(200,210,255,.45)"; ctx.lineWidth = 1.4; ctx.setLineDash([5, 5]);
      ctx.beginPath(); ctx.ellipse(cx, cy, A, B, 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
      K.sun(ctx, cx + c0, cy, 13);
      K.pill(ctx, "태양", cx + c0, cy - 40, { s: 11, a: "center", c: KC.yellow });
      /* 궤도를 도는 지구 (희미하게) */
      var oa = orb, ox = cx + A * Math.cos(oa), oy = cy - B * Math.sin(oa);   /* 북쪽에서 볼 때 시계 반대 방향 */
      ctx.globalAlpha = .55; K.earth(ctx, ox, oy, 6); ctx.globalAlpha = 1;

      earth(cx + A, cy, 11, "근일점 · 북반구 " + seasonName(prec), KC.blue, "right");
      earth(cx - A, cy, 11, "원일점 · 북반구 " + seasonName(prec + 180), KC.violet, "left");
      K.pill(ctx, "자전축 기울기 " + tilt.toFixed(1) + "°", cx, 74, { s: 12.5, a: "center", c: KC.ink });
      K.warn(ctx, cx, 344, "⚠ 이심률·크기는 보기 쉽게 과장", "center");

      /* ── 오른쪽 계기판 ── */
      var RX = LW + 8, px = RX + 18;
      K.stage(ctx, RX, 0, W - RX, 362, "lab", { seed: 233 });
      K.pill(ctx, "북위 65° 여름 일사량", px - 2, 28, { s: 13, c: KC.blue });
      var qc = q <= 440 ? KC.blue : (q >= 520 ? KC.orange : KC.ink);
      K.t(ctx, q.toFixed(0) + " W/m²", px, 98, { s: 30, w: "900", c: qc });
      var gx0 = px, gx1 = W - 24, lo = 380, hi = 580;
      function GX(val) { return gx0 + clamp((val - lo) / (hi - lo), 0, 1) * (gx1 - gx0); }
      var gb = ctx.createLinearGradient(gx0, 0, gx1, 0); gb.addColorStop(0, "rgba(127,211,255,.25)"); gb.addColorStop(1, "rgba(255,179,92,.25)");
      ctx.fillStyle = gb; ctx.beginPath(); ctx.roundRect(gx0, 124, gx1 - gx0, 20, 10); ctx.fill();
      ctx.save(); ctx.shadowColor = qc; ctx.shadowBlur = 10; ctx.fillStyle = qc;
      ctx.beginPath(); ctx.roundRect(gx0, 124, Math.max(10, GX(q) - gx0), 20, 10); ctx.fill(); ctx.restore();
      [[440, "빙하기 쪽"], [520, "간빙기 쪽"]].forEach(function (m) {
        ctx.strokeStyle = KC.yellow; ctx.lineWidth = 2; ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.moveTo(GX(m[0]), 118); ctx.lineTo(GX(m[0]), 150); ctx.stroke(); ctx.setLineDash([]);
        K.t(ctx, m[1] + " " + m[0], clamp(GX(m[0]), gx0 + 40, gx1 - 40), 168, { s: 10.5, a: "center", w: "800", c: KC.yellow });
      });
      /* 빙상 그림: 일사량이 적을수록 커진다 */
      var ice = clamp((520 - q) / 80, 0, 1), iy = 252;
      land(ctx, px, iy, gx1 - px, 26);
      var ig = ctx.createLinearGradient(0, iy - 44 * ice, 0, iy); ig.addColorStop(0, "#ffffff"); ig.addColorStop(1, "#bfe3ff");
      ctx.fillStyle = ig; ctx.beginPath(); ctx.moveTo(px, iy); ctx.quadraticCurveTo(px + 30, iy - 50 * ice - 4, px + 40 + 230 * ice, iy); ctx.closePath(); ctx.fill();
      K.pill(ctx, q <= 440 ? "빙상이 자란다" : (q >= 520 ? "빙상이 물러난다" : "빙상 크기 지금 수준"), gx1 - 4, iy - 12, { s: 11, a: "right", c: q <= 440 ? KC.blue : (q >= 520 ? KC.orange : KC.mute), box: [RX, W] });
      K.t(ctx, q <= 440 ? "여름이 시원해 눈이 다 녹지 못합니다" : (q >= 520 ? "여름이 뜨거워 눈이 모두 녹습니다" : "지금 지구와 비슷한 수준입니다"), px, 304, { s: 12.5, w: "900", c: qc });
      K.t(ctx, "기울기↑ → 여름 일사량↑ · 연교차↑", px, 326, { s: 11, c: KC.mute });
      K.t(ctx, "근일점에 여름 + 큰 이심률 → 더 뜨거운 여름", px, 346, { s: 11, c: KC.mute });

      /* ── 아래 설명 띠 ── */
      K.stage(ctx, 0, 370, W, H - 370, "night", { seed: 235 });
      K.t(ctx, "자전축 기울기 약 4.1만 년 · 세차 운동 약 2.6만 년 · 이심률 약 10만 년 주기로 변합니다.", 20, 396, { s: 12, c: KC.ink });
      K.t(ctx, "이 세 주기가 겹쳐 북반구 고위도의 여름 일사량을 바꾸고, 수만 년 규모의 빙하기·간빙기를 만든다는 것이 밀란코비치 이론입니다.", 20, 420, { s: 11.5, c: KC.mute });
      K.t(ctx, "이심률이 0이면 궤도가 완전한 원이라, 근일점·원일점의 구별 자체가 사라집니다.", 20, 444, { s: 11, c: KC.mute });

      var ch = false;
      if (q <= 440 && !got.a) { got.a = ch = true; }
      if (q >= 520 && !got.b) { got.b = ch = true; }
      if (ecc <= 0.0005 && !got.c) { got.c = ch = true; }
      if (ch) { window.sthState("bMil", got); mission(); }

      $("b-milan-info").innerHTML = "여름 일사량 <b>" + q.toFixed(0) + " W/m²</b>. " +
        (ecc <= 0.0005 ? "이심률이 <b>0</b>이라 궤도가 완전한 원입니다. 태양까지의 거리가 늘 같으니 <b>세차 슬라이더를 아무리 돌려도 일사량이 변하지 않습니다.</b> 세차 운동은 이심률이 있어야 뜻을 가집니다." :
          (q <= 440 ? "북반구 고위도의 여름이 시원합니다. 지난겨울의 눈이 다 녹지 못하고 해마다 쌓이면 <b>빙상이 자라고 빙하기</b>로 갑니다." :
            (q >= 520 ? "여름 일사량이 매우 큽니다. 쌓였던 눈과 얼음이 모두 녹아 <b>빙상이 물러나고 간빙기</b>가 됩니다." :
              "세 슬라이더를 움직여 보세요. 빙하기를 부르는 것은 ‘추운 겨울’이 아니라 <b>눈이 다 녹지 못할 만큼 시원한 여름</b>입니다.")));
    }
    function mission() {
      if (got.a) done("m2-2a"); if (got.b) done("m2-2b"); if (got.c) done("m2-2c");
      if (got.a && got.b && got.c) {
        window.sthMission("m2-2", true, "<span class='m-tag'>미션 완료</span>지구 운동의 세 변화는 지구가 받는 <b>에너지의 총량</b>보다 그 에너지가 <b>언제·어느 위도에 쏟아지는지</b>를 바꿉니다. 그리고 세차 운동은 <b>이심률이 0이 아닐 때만</b> 뜻을 가집니다.");
        ep.clear(1);
      }
    }
    canvas._redraw = draw;
    $("b-tilt").addEventListener("input", function (e) { tilt = +e.target.value; $("b-tilt-val").textContent = tilt.toFixed(1) + "°"; draw(); });
    $("b-ecc").addEventListener("input", function (e) { ecc = +e.target.value; $("b-ecc-val").textContent = ecc.toFixed(3); draw(); });
    $("b-prec").addEventListener("input", function (e) { prec = +e.target.value; $("b-prec-val").textContent = seasonName(prec); draw(); });
    draw(); mission();
    var playM = playBtn("b-milan-play");
    anim(canvas, function (dt) { if (playM.on) { orb += dt / 70 * 0.03; draw(); } });
  })();

  /* ---- 장면3 에어로졸과 태양 활동 ---- */
  (function () {
    var canvas = $("b-c-force"), ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var type = "sulf", amt = 0, dS = 0;
    var got = window.sthState("bFor") || { a: false, b: false, c: false };
    var LAM = 0.5;                                /* 기후 민감도 ℃ / (W/m²) */

    function fAero() { return type === "sulf" ? -0.030 * amt : 0.012 * amt; }
    function fSun() { return 0.175 * dS; }
    function fTot() { return fAero() + fSun(); }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      var fa = fAero(), fs = fSun(), ft = fTot(), dT = LAM * ft;
      var LW = 580;
      K.stage(ctx, 0, 0, LW, 334, "lab", { seed: 241 });
      K.pill(ctx, "복사 강제력 — 양수는 데우고, 음수는 식힌다", 16, 28, { s: 13, c: KC.blue });

      var base = 190, SC = 34, x0 = 70, x1 = 556;
      ctx.fillStyle = "rgba(255,107,80,.05)"; ctx.fillRect(x0, base - 1 * SC - 20, x1 - x0, 1 * SC + 20);
      ctx.fillStyle = "rgba(90,150,255,.06)"; ctx.fillRect(x0, base, x1 - x0, 3 * SC + 14);
      for (var g = -3; g <= 1; g++) {
        var yy = base - g * SC;
        ctx.strokeStyle = g === 0 ? KC.line : KC.grid; ctx.lineWidth = g === 0 ? 1.8 : 1;
        ctx.beginPath(); ctx.moveTo(x0, yy); ctx.lineTo(x1, yy); ctx.stroke();
        K.t(ctx, (g > 0 ? "+" : "") + g, x0 - 8, yy + 4, { s: 10.5, a: "right", c: KC.mute, w: "600" });
      }
      K.t(ctx, "W/m²", x0 - 8, base - 1 * SC - 26, { s: 10.5, a: "right", c: KC.mute });
      K.t(ctx, "데우는 쪽 ↑", x1, base - 1 * SC - 6, { s: 10.5, a: "right", c: KC.orange });
      K.t(ctx, "식히는 쪽 ↓", x1, base + 3 * SC + 8, { s: 10.5, a: "right", c: KC.blue });

      var items = [
        { n: type === "sulf" ? "황산염 에어로졸" : "검댕(블랙 카본)", val: fa },
        { n: "태양 활동", val: fs },
        { n: "합계", val: ft }
      ];
      items.forEach(function (it, i) {
        var bx = x0 + 40 + i * 150, hpx = it.val * SC, warm = it.val >= 0, col = warm ? KC.orange : KC.blue;
        var y0b = hpx >= 0 ? base - hpx : base, hb = Math.max(Math.abs(hpx), 2);
        var gr = ctx.createLinearGradient(0, base, 0, base - hpx);
        gr.addColorStop(0, warm ? "rgba(255,179,92,.35)" : "rgba(127,211,255,.35)"); gr.addColorStop(1, warm ? "rgba(255,120,80,1)" : "rgba(127,211,255,1)");
        ctx.save(); ctx.shadowColor = col; ctx.shadowBlur = i === 2 ? 12 : 6; ctx.fillStyle = gr;
        ctx.beginPath(); ctx.roundRect(bx, y0b, 76, hb, 6); ctx.fill(); ctx.restore();
        if (i === 2) { ctx.strokeStyle = "rgba(255,255,255,.5)"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.roundRect(bx, y0b, 76, hb, 6); ctx.stroke(); }
        K.pill(ctx, it.n, bx + 38, 318, { s: 11.5, a: "center", c: i === 2 ? KC.ink : KC.mute });
        K.t(ctx, (it.val > 0 ? "+" : "") + it.val.toFixed(2), bx + 38, it.val >= 0 ? base - hpx - 8 : base - 8,
          { s: 13, a: "center", w: "900", c: col });
      });

      /* ── 오른쪽: 하늘에서 일어나는 일 ── */
      var RX = LW + 8, RW = W - RX;
      K.stage(ctx, RX, 0, RW, 334, "sky", { seed: 243 });
      K.pill(ctx, type === "sulf" ? "황산염 : 햇빛을 되쏜다" : "검댕 : 햇빛을 흡수한다", RX + 14, 28, { s: 12.5, c: type === "sulf" ? KC.blue : KC.orange, bg: "rgba(9,12,34,.7)" });
      var sx = RX + RW - 50, sy = 70;
      K.sun(ctx, sx, sy, 12 + clamp(dS, -2, 2) * 1.5);
      var layY = 170, n = Math.round(amt / 4), R = K.rng(17);
      /* 에어로졸 층 */
      if (n > 0) { var lg = ctx.createLinearGradient(0, layY - 24, 0, layY + 24); lg.addColorStop(0, "rgba(255,255,255,0)"); lg.addColorStop(.5, type === "sulf" ? "rgba(255,255,255," + (amt / 400).toFixed(2) + ")" : "rgba(40,30,30," + (amt / 220).toFixed(2) + ")"); lg.addColorStop(1, "rgba(255,255,255,0)"); ctx.fillStyle = lg; ctx.fillRect(RX, layY - 24, RW, 48); }
      for (var i2 = 0; i2 < n; i2++) {
        var ax = RX + 14 + R() * (RW - 28), ay = layY - 18 + R() * 36;
        if (type === "sulf") K.glow(ctx, ax, ay, 1.6, "rgba(255,255,255,.95)", 2.6);
        else { ctx.fillStyle = "#1b1515"; ctx.beginPath(); ctx.arc(ax, ay, 2.2, 0, 6.2832); ctx.fill(); ctx.globalAlpha = .5; K.glow(ctx, ax, ay, 1.4, "rgba(255,140,80,.8)", 3); ctx.globalAlpha = 1; }
      }
      /* 햇빛 줄기 */
      for (var r = 0; r < 4; r++) {
        var tx = RX + 50 + r * 52, through = type === "sulf" ? 1 - amt / 140 : 1 - amt / 200;
        ctx.save(); ctx.strokeStyle = "rgba(255,226,140,.9)"; ctx.lineWidth = 2.4; ctx.shadowColor = KC.yellow; ctx.shadowBlur = 6;
        ctx.beginPath(); ctx.moveTo(sx - 20, sy + 10); ctx.lineTo(tx, layY - 4); ctx.stroke();
        ctx.globalAlpha = clamp(through, .15, 1);
        ctx.beginPath(); ctx.moveTo(tx, layY); ctx.lineTo(tx - 16, 300); ctx.stroke(); ctx.restore();
        if (type === "sulf" && n > 2 && r % 2 === 0) K.arrow(ctx, { x: tx, y: layY - 6 }, { x: tx - 40, y: layY - 60 }, "rgba(255,255,255,.85)", 2, 8);
      }
      ctx.save(); ctx.beginPath(); ctx.roundRect(RX, 0, RW, 334, 14); ctx.clip(); land(ctx, RX, 300, RW, 34); ctx.restore();
      if (n > 0) K.pill(ctx, type === "sulf" ? "되쏜 햇빛 → 우주로" : "데워진 공기층", RX + 14, layY - 30, { s: 11, c: type === "sulf" ? "#ffffff" : KC.orange, bg: "rgba(9,12,34,.7)" });
      K.pill(ctx, "합계 " + (ft > 0 ? "+" : "") + ft.toFixed(2) + " W/m² → " + (dT > 0 ? "+" : "") + dT.toFixed(2) + " ℃", RX + RW / 2, 324, { s: 12, a: "center", c: ft >= 0 ? KC.orange : KC.blue, bg: "rgba(9,12,34,.8)", box: [RX, W] });

      /* ── 아래 설명 ── */
      K.stage(ctx, 0, 342, W, H - 342, "night", { seed: 245 });
      K.t(ctx, "큰 화산 분출은 성층권에 황산염 에어로졸을 뿌려 1~2년 동안 지구를 식힙니다. 피나투보(1991)가 그랬습니다.", 20, 364, { s: 11.5, c: KC.mute });
      K.t(ctx, "검댕은 빛을 흡수해 주변 공기를 데웁니다. 같은 에어로졸인데 부호가 반대입니다. 기온 변화(평형) = 강제력 × 0.5", 20, 386, { s: 11.5, c: KC.mute });
      K.t(ctx, "태양 상수의 변화 " + (dS >= 0 ? "+" : "") + dS.toFixed(1) + " W/m² (기온 " + (LAM * fSun()).toFixed(2) + " ℃) · 에어로졸 양 " + amt, 20, 410, { s: 12.5, w: "900", c: KC.ink });

      var ch = false;
      if (ft <= -2.0 && !got.a) { got.a = ch = true; }
      if (type === "soot" && fa > 0 && !got.b) { got.b = ch = true; }
      if (LAM * fs >= 0.15 && !got.c) { got.c = ch = true; }
      if (ch) { window.sthState("bFor", got); mission(); }

      $("b-force-info").innerHTML = "복사 강제력이 <b>양수면 데우는 쪽</b>, <b>음수면 식히는 쪽</b>입니다. " +
        (type === "sulf" ? "황산염 에어로졸은 태양 빛을 반사해 <b>음의 강제력</b>을 만듭니다." :
          "검댕은 복사 에너지를 <b>흡수</b>해 주변 공기를 데우므로 <b>양의 강제력</b>을 만듭니다. 에어로졸이라고 모두 지구를 식히는 것은 아닙니다.") +
        " 태양 활동은 같은 방식으로 재면 그 크기가 <b>훨씬 작습니다.</b>";
    }
    function mission() {
      if (got.a) done("m2-3a"); if (got.b) done("m2-3b"); if (got.c) done("m2-3c");
      if (got.a && got.b && got.c) {
        window.sthMission("m2-3", true, "<span class='m-tag'>미션 완료</span>같은 ‘에어로졸’인데 <b>황산염은 식히고 검댕은 데웁니다.</b> 그리고 태양 활동만으로 만들 수 있는 기온 변화는 0.2 ℃에도 못 미쳤습니다. 자연적 요인은 기후를 <b>흔들기는 해도 한 방향으로 밀지는 못합니다.</b>");
        ep.clear(2);
      }
    }
    canvas._redraw = draw;
    segWire("b-atype", function (b) {
      type = b.getAttribute("data-a");
      $("b-atype-val").textContent = type === "sulf" ? "황산염(반사형)" : "검댕(흡수형)";
      draw();
    });
    $("b-amt").addEventListener("input", function (e) { amt = +e.target.value; $("b-amt-val").textContent = amt; draw(); });
    $("b-sun").addEventListener("input", function (e) { dS = +e.target.value; $("b-sun-val").textContent = (dS >= 0 ? "+" : "") + dS.toFixed(1) + " W/m²"; draw(); });
    draw(); mission();
  })();

  /* ---- 장면4 최근 100년의 귀인 ---- */
  (function () {
    var canvas = $("b-c-attr"), ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var on = { nat: false, ghg: false, aer: false };
    var got = window.sthState("bAttr") || { a: false, b: false, c: false };
    var Y0 = 1900, Y1 = 2020;

    var CO2 = [[1900, 296], [1920, 303], [1940, 311], [1960, 317], [1980, 339], [2000, 369], [2010, 389], [2020, 414]];
    function co2(y) {
      if (y <= CO2[0][0]) return CO2[0][1];
      for (var i = 1; i < CO2.length; i++) {
        if (y <= CO2[i][0]) {
          var u = (y - CO2[i - 1][0]) / (CO2[i][0] - CO2[i - 1][0]);
          return CO2[i - 1][1] + (CO2[i][1] - CO2[i - 1][1]) * u;
        }
      }
      return CO2[CO2.length - 1][1];
    }
    function ghg(y) { return 4.28 * Math.log(co2(y) / 296); }
    function aerRamp(y) { return y < 1930 ? 0 : (y < 1980 ? (y - 1930) / 50 : (y < 2000 ? 1 : Math.max(0.78, 1 - (y - 2000) * 0.011))); }
    function aer(y) { return -0.45 * aerRamp(y); }
    var VOLC = [[1902, -0.20, "산타마리아"], [1912, -0.13, "카트마이"], [1963, -0.17, "아궁"], [1982, -0.14, "엘치촌"], [1991, -0.22, "피나투보"]];
    function volc(y) {
      var s = 0;
      for (var i = 0; i < VOLC.length; i++) { var d = y - VOLC[i][0]; if (d >= 0 && d < 5) s += VOLC[i][1] * Math.exp(-d / 1.5); }
      return s;
    }
    function solar(y) { return 0.16 * clamp((y - 1900) / 45, 0, 1) + 0.025 * Math.sin((y - 1900) / 11 * 2 * Math.PI); }
    function nat(y) { return volc(y) + solar(y); }
    function inter(y) { return 0.10 * Math.cos((y - 1940) / 32.5 * Math.PI); }
    function obs(y) { return ghg(y) + aer(y) + nat(y) + inter(y); }
    function model(y) { return (on.nat ? nat(y) : 0) + (on.ghg ? ghg(y) : 0) + (on.aer ? aer(y) : 0); }
    function anyOn() { return on.nat || on.ghg || on.aer; }

    var OBS = [], BO = 0;
    (function () {
      for (var y = Y0; y <= Y1; y++) OBS.push(obs(y));
      var s = 0; for (var i = 0; i < 30; i++) s += OBS[i];
      BO = s / 30;
    })();
    function fitPct() {
      var M = [], s = 0, i;
      for (var y = Y0; y <= Y1; y++) M.push(model(y));
      for (i = 0; i < 30; i++) s += M[i];
      var bm = s / 30, mo = 0;
      for (i = 0; i < OBS.length; i++) mo += (OBS[i] - BO);
      mo /= OBS.length;
      var sse = 0, sst = 0;
      for (i = 0; i < OBS.length; i++) {
        var o = OBS[i] - BO, m = M[i] - bm;
        sse += (o - m) * (o - m); sst += (o - mo) * (o - mo);
      }
      return clamp(100 * (1 - sse / sst), 0, 100);
    }

    var GX0 = 90, GX1 = 700, GY0 = 70, GY1 = 300;
    function X(y) { return GX0 + (y - Y0) / (Y1 - Y0) * (GX1 - GX0); }
    function Y(c) { return GY1 - (c + 0.4) / 1.9 * (GY1 - GY0); }

    function curve(fn, col, wide, shift) {
      var pts = [];
      for (var y = Y0; y <= Y1; y++) pts.push([X(y), Y(fn(y) - shift)]);
      glowLine(ctx, pts, col, wide);
    }
    function stripeCol(c) {   /* 기온 편차 → 줄무늬 색 */
      var u = clamp((c + 0.3) / 1.4, 0, 1);
      if (u < .4) { var k = u / .4; return "rgb(" + Math.round(40 + 120 * k) + "," + Math.round(90 + 110 * k) + "," + Math.round(200 + 40 * k) + ")"; }
      var k2 = (u - .4) / .6; return "rgb(" + Math.round(230 + 25 * k2) + "," + Math.round(200 - 150 * k2) + "," + Math.round(200 - 160 * k2) + ")";
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      var LW = 712;
      K.stage(ctx, 0, 0, LW, 350, "lab", { seed: 251 });
      K.pill(ctx, "1900~2020년 지구 평균 기온 — 관측과 모형", 16, 28, { s: 13, c: KC.blue });
      axes(ctx, GX0, GY0, GX1, GY1);
      for (var y = 1900; y <= 2020; y += 20) {
        ctx.strokeStyle = KC.grid; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(X(y), GY0); ctx.lineTo(X(y), GY1); ctx.stroke();
        K.t(ctx, String(y), X(y), GY1 + 32, { s: 10.5, a: "center", c: KC.mute, w: "600" });
      }
      for (var c = -0.4; c <= 1.5; c += 0.5) {
        K.t(ctx, (c > 0 ? "+" : "") + c.toFixed(1), GX0 - 8, Y(c) + 4, { s: 10.5, a: "right", c: KC.mute, w: "600" });
      }
      K.t(ctx, "기온 편차(℃)", GX0 - 8, GY0 - 10, { s: 11, a: "right", c: KC.mute });
      /* 관측 기온 줄무늬 (해마다 한 줄) */
      for (var ys = Y0; ys <= Y1; ys++) { ctx.fillStyle = stripeCol(OBS[ys - Y0] - BO); ctx.fillRect(X(ys), GY1 + 4, (GX1 - GX0) / (Y1 - Y0) + .6, 10); }

      /* 화산 표시 */
      VOLC.forEach(function (o) {
        ctx.strokeStyle = "rgba(182,156,255,.5)"; ctx.lineWidth = 1.3; ctx.setLineDash([3, 4]);
        ctx.beginPath(); ctx.moveTo(X(o[0]), GY0); ctx.lineTo(X(o[0]), GY1); ctx.stroke(); ctx.setLineDash([]);
        K.t(ctx, "🌋", X(o[0]), GY0 - 4, { s: 11, a: "center" });
      });

      var sm = 0, i;
      for (i = 0; i < 30; i++) sm += model(Y0 + i);
      sm /= 30;
      curve(obs, "#f2f4ff", 3, BO);
      if (anyOn()) curve(model, KC.blue, 2.6, sm);
      K.pill(ctx, "관측", X(2020) - 4, Y(obs(2020) - BO) - 12, { s: 11, a: "right", c: "#f2f4ff" });
      if (anyOn()) K.pill(ctx, "모형", X(2020) - 4, clamp(Y(model(2020) - sm) + 22, GY0 + 20, GY1 - 4), { s: 11, a: "right", c: KC.blue });

      /* ── 오른쪽 계기판 ── */
      var RX = LW + 8, cxr = RX + (W - RX) / 2, pct = anyOn() ? fitPct() : 0;
      K.stage(ctx, RX, 0, W - RX, 350, "night", { seed: 253 });
      K.pill(ctx, "맞춤도", RX + 14, 28, { s: 13, c: KC.blue });
      var pc = pct >= 90 ? KC.green : (pct <= 40 ? KC.red : KC.yellow);
      ctx.lineCap = "round"; ctx.lineWidth = 12; ctx.strokeStyle = "rgba(255,255,255,.08)";
      ctx.beginPath(); ctx.arc(cxr, 112, 50, Math.PI * .75, Math.PI * 2.25); ctx.stroke();
      if (anyOn()) { ctx.save(); ctx.shadowColor = pc; ctx.shadowBlur = 10; ctx.strokeStyle = pc; ctx.beginPath(); ctx.arc(cxr, 112, 50, Math.PI * .75, Math.PI * (.75 + 1.5 * pct / 100)); ctx.stroke(); ctx.restore(); }
      ctx.lineCap = "butt";
      K.t(ctx, anyOn() ? pct.toFixed(1) + "%" : "—", cxr, 120, { s: 22, a: "center", w: "900", c: anyOn() ? pc : KC.mute });
      K.pill(ctx, anyOn() ? (pct >= 90 ? "관측과 거의 같다" : (pct <= 40 ? "전혀 맞지 않는다" : "아직 어긋난다")) : "요인을 켜 보세요", cxr, 188, { s: 11.5, a: "center", c: anyOn() ? pc : KC.mute, box: [RX, W] });
      var px = RX + 16;
      K.t(ctx, "켠 요인", px, 222, { s: 11.5, w: "800", c: KC.mute });
      K.t(ctx, on.nat ? "● 자연 (태양·화산)" : "○ 자연", px, 244, { s: 11.5, w: "700", c: on.nat ? KC.violet : KC.dim });
      K.t(ctx, on.ghg ? "● 온실 기체" : "○ 온실 기체", px, 264, { s: 11.5, w: "700", c: on.ghg ? KC.orange : KC.dim });
      K.t(ctx, on.aer ? "● 인위 에어로졸" : "○ 인위 에어로졸", px, 284, { s: 11.5, w: "700", c: on.aer ? KC.blue : KC.dim });
      K.t(ctx, "CO₂ " + co2(2020).toFixed(0) + " ppm (2020)", px, 318, { s: 11.5, w: "800", c: KC.mute });

      /* ── 아래 설명 ── */
      K.stage(ctx, 0, 358, W, H - 358, "night", { seed: 255 });
      K.t(ctx, "흰 굵은 선 = 관측 기온 · 파란 선 = 내가 켠 요인으로 그린 모형 · 아래 띠 = 해마다의 관측 기온(파랑 → 빨강)", 20, 380, { s: 11.5, w: "800", c: KC.ink });
      K.t(ctx, "🌋 큰 화산 분출: 1902 산타마리아 · 1912 카트마이 · 1963 아궁 · 1982 엘치촌 · 1991 피나투보", 20, 402, { s: 11.5, c: KC.mute });
      K.t(ctx, "자연 요인은 기온을 위아래로 흔들지만, 한 방향으로 계속 밀어 올리지는 못합니다.", 20, 424, { s: 11.5, c: KC.mute });
      K.t(ctx, "1950~1975년의 정체는 인위적 에어로졸이 온실 기체의 가열을 일부 가린 탓으로 봅니다.", 20, 446, { s: 11.5, c: KC.mute });

      var ch = false;
      if (on.nat && !on.ghg && !on.aer && fitPct() <= 40 && !got.a) { got.a = ch = true; }
      if (on.nat && on.ghg && on.aer && fitPct() >= 90 && !got.b) { got.b = ch = true; }
      if (ch) { window.sthState("bAttr", got); mission(); }

      $("b-attr-info").innerHTML = !anyOn() ? "아래 단추로 요인을 켜면 모형 곡선이 그려집니다. 먼저 <b>자연 요인만</b> 켜 보세요." :
        (on.nat && !on.ghg && !on.aer ? "<b>자연 요인만</b>으로 그린 곡선입니다. 화산이 터진 해에 기온이 잠깐 내려가는 것까지는 맞히지만, <b>최근 50년의 가파른 상승은 전혀 따라가지 못합니다.</b>" :
          (on.nat && on.ghg && on.aer ? "세 요인을 모두 넣자 모형이 관측과 <b>거의 겹칩니다.</b> 20세기 중반의 정체까지 설명됩니다. 최근의 상승은 <b>온실 기체를 넣어야만</b> 그려집니다." :
            (on.ghg && !on.aer ? "온실 기체만 넣으면 20세기 중반이 실제보다 <b>너무 따뜻하게</b> 나옵니다. 그 시기를 식힌 무언가가 더 있었습니다." :
              "요인을 더 켜 보세요. 어떤 조합이 관측을 설명하는지 맞춤도로 견주어 보면 됩니다.")));
    }
    function mission() {
      if (got.a) done("m2-4a"); if (got.b) done("m2-4b"); if (got.c) done("m2-4c");
      if (got.a && got.b && got.c) {
        window.sthMission("m2-4", true, "<span class='m-tag'>미션 완료</span>자연 요인만으로는 맞춤도가 바닥이었고, <b>온실 기체를 넣었을 때 비로소</b> 관측과 겹쳤습니다. 최근 100년의 기온 상승은 자연적 요인만으로는 설명되지 않습니다.");
        ep.clear(3); ep.clear(4);
      }
    }
    canvas._redraw = draw;
    Array.prototype.forEach.call($("b-fac").querySelectorAll("button"), function (b) {
      b.addEventListener("click", function () {
        var kk = b.getAttribute("data-f");
        on[kk] = !on[kk]; b.classList.toggle("on", on[kk]); draw();
      });
    });
    window.sthPick({
      mount: "b-q1",
      q: "최근 100년 동안의 지구 평균 기온 상승에 대한 설명으로 가장 알맞은 것은?",
      options: [
        "태양 활동이 꾸준히 강해졌기 때문이므로 자연적 요인만으로 설명된다",
        "화산 분출이 줄어들어 에어로졸이 사라졌기 때문이다",
        "자연적 요인만으로는 설명되지 않으며, 온실 기체 증가라는 인위적 요인을 넣어야 설명된다",
        "지구 자전축 기울기가 커졌기 때문이다"
      ],
      answer: 2,
      why: [
        "태양 활동의 복사 강제력은 앞 장면에서 재 보았듯 매우 작고, 최근 수십 년 동안 오히려 약해지는 경향을 보였습니다.",
        "에어로졸은 사라지지 않았습니다. 오히려 인위적 에어로졸이 20세기 중반의 가열을 일부 가렸다고 봅니다.",
        "맞습니다. 자연 요인만 켰을 때 맞춤도는 바닥이었고, 온실 기체를 넣었을 때 비로소 관측과 겹쳤습니다.",
        "자전축 기울기는 약 4.1만 년 주기로 아주 천천히 변합니다. 100년 동안의 변화로는 이 정도 상승을 만들 수 없습니다."
      ],
      onDone: function () { got.c = true; window.sthState("bAttr", got); mission(); }
    });
    draw(); mission();
  })();

  function finish() { window.sthState("r2", "해결 · 에어로졸은 식히기도 데우기도 한다, 최근 100년의 상승은 온실 기체를 넣어야만 그려진다"); }
  function vsB() {
    var p = window.sthState("b-p") || "";
    $("b-vs").innerHTML = "<b>나의 첫 추리</b> " + (p || "기록 없음") + "<br>" +
      (p.indexOf("㉡") === 0 ? "정확했습니다. 직접 부호를 뒤집어 보며 확인했지요 — 황산염은 식히고, 검댕은 데웁니다."
        : "직접 재 보니 ㉡ 이었습니다. ‘에어로졸 = 식힌다’는 절반만 맞는 말이었습니다.");
  }
  vsB();
  ep.onShow(vsB);
  window.sthWork({
    mount: "wkB", unitLabel: "[지구과학 Ⅰ-2] 이야기 ② 기후를 흔드는 것들",
    items: [
      { id: "w3", label: "자연적 요인과 인위적 요인", hint: "기온 변화 그래프에서 인위적 요인을 빼면 설명되지 않는 구간이 어디인지 짚고 근거를 쓰세요." },
      { id: "b2", label: "에어로졸에 대한 오해 바로잡기", hint: "‘에어로졸은 지구를 식힌다’고만 알고 있는 친구에게, 황산염과 검댕을 견주어 한 문단으로 설명해 주세요." }
    ]
  });
})();

/* =========================================================================
   이야기 ③ 탄소를 줄이는 회의
   ========================================================================= */
(function () {
  var ep = window.sthStory({ root: "epC", key: "epC", name: "사건 파일 ③", onDone: finish });

  window.sthGate({
    gate: "c-gate", key: "c-p", title: "자문관의 첫 추리",
    question: "온실 기체가 지구를 데우는 까닭으로 가장 알맞은 것은?",
    options: [
      "㉠ 온실 기체가 태양 빛(가시광선)을 직접 흡수해 대기를 데우기 때문",
      "㉡ 태양 복사는 대부분 통과시키고, 지표가 내보내는 지구 복사(적외선)를 흡수했다가 다시 지표로 내보내기 때문",
      "㉢ 온실 기체가 지구와 우주 사이를 막아 공기가 빠져나가지 못하게 하기 때문",
      "㉣ 온실 기체가 지구 내부의 열을 지표로 끌어올리기 때문"
    ],
    onPick: function (i) {
      window.sthState("cOK", i === 1 ? "맞음" : "어긋남");
      ep.clear(0);
    }
  });

  /* ---- 장면2 복사 평형과 온실 효과 ---- */
  (function () {
    var canvas = $("c-c-green"), ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var eps = 0.78, alb = 0.30;
    var got = window.sthState("cGreen") || { a: false, b: false, c: false };
    var S = 1361, SIG = 5.670e-8;

    function absorbed() { return S * (1 - alb) / 4; }
    function Ts() { return Math.pow(absorbed() / SIG * (2 / (2 - eps)), 0.25) - 273.15; }
    function Tno() { return Math.pow(absorbed() / SIG, 0.25) - 273.15; }
    function green() { return Ts() - Tno(); }

    var tg = 0;
    function ray(x0, y0, x1, y1, col, w, dots) {
      ctx.save(); ctx.shadowColor = col; ctx.shadowBlur = 8;
      K.arrow(ctx, { x: x0, y: y0 }, { x: x1, y: y1 }, col, w, 10);
      ctx.restore();
      for (var k = 0; k < (dots || 2); k++) {
        var u = ((tg * 0.02) + k / (dots || 2)) % 1;
        K.glow(ctx, x0 + (x1 - x0) * u, y0 + (y1 - y0) * u, 2, "rgba(255,255,255,.95)", 2.6);
      }
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      var T = Ts();
      var LW = 650;
      K.stage(ctx, 0, 0, LW, H, "space", { seed: 261 });
      K.pill(ctx, "복사 평형과 온실 효과 — 대기를 담요 한 장으로 본 모형", 16, 28, { s: 13, c: KC.blue });
      var gx0 = 14, gx1 = LW - 14, groundY = 340, airY = 160;
      /* 대기: 흡수율이 클수록 짙은 담요 */
      var ag = ctx.createLinearGradient(0, airY - 40, 0, groundY);
      ag.addColorStop(0, "rgba(63,211,163,0)"); ag.addColorStop(.25, "rgba(63,211,163," + (0.10 + 0.32 * eps).toFixed(2) + ")"); ag.addColorStop(1, "rgba(80,150,230,.18)");
      ctx.fillStyle = ag; ctx.fillRect(gx0, airY - 40, gx1 - gx0, groundY - airY + 40);
      ctx.strokeStyle = "rgba(63,211,163," + (0.3 + 0.5 * eps).toFixed(2) + ")"; ctx.lineWidth = 1.5; ctx.setLineDash([6, 5]);
      ctx.beginPath(); ctx.moveTo(gx0, airY + 13); ctx.lineTo(gx1, airY + 13); ctx.stroke(); ctx.setLineDash([]);
      K.pill(ctx, "대기 (적외선 흡수율 " + eps.toFixed(2) + ")", gx0 + 10, airY + 6, { s: 11.5, c: KC.green });
      /* 지표: 온도에 따라 색 */
      ctx.save(); ctx.beginPath(); ctx.roundRect(0, 0, LW, H, 14); ctx.clip();
      var hot = clamp((T + 20) / 60, 0, 1);
      var gg = ctx.createLinearGradient(0, groundY, 0, H);
      gg.addColorStop(0, "rgb(" + Math.round(70 + 140 * hot) + "," + Math.round(120 - 30 * hot) + "," + Math.round(140 - 90 * hot) + ")"); gg.addColorStop(1, "#1d1a18");
      ctx.fillStyle = gg; ctx.fillRect(0, groundY, LW, H - groundY);
      if (alb > 0.36) { ctx.fillStyle = "rgba(240,248,255," + ((alb - .36) * 4).toFixed(2) + ")"; ctx.fillRect(0, groundY, LW, 10); }
      ctx.restore();
      K.pill(ctx, "지표 " + T.toFixed(1) + " ℃", gx0 + 10, groundY + 30, { s: 12, c: T >= 20 ? KC.orange : (T <= 5 ? KC.blue : KC.ink) });

      /* 태양 복사 */
      K.sun(ctx, 60, 62, 14);
      for (var i = 0; i < 3; i++) ray(110 + i * 40, 80, 110 + i * 40, groundY - 8, KC.yellow, 3, 2);
      K.pill(ctx, "태양 복사", 150, 74, { s: 11.5, a: "center", c: KC.yellow });
      /* 반사 */
      var nref = Math.max(1, Math.round(alb * 10));
      for (var r = 0; r < nref; r++) ray(250 + r * 14, groundY - 8, 250 + r * 14, 84, "rgba(235,240,255,.85)", 2.2, 1);
      K.pill(ctx, "반사 " + (alb * 100).toFixed(0) + "%", 250 + nref * 7, 74, { s: 11.5, a: "center", c: "#e8ecff" });
      /* 지구 복사 */
      for (var j = 0; j < 4; j++) {
        var xx = 410 + j * 34, blocked = (j + 0.5) / 4 <= eps;
        ray(xx, groundY - 8, xx, blocked ? airY + 30 : 84, KC.red, 3, 2);
        if (blocked) K.glow(ctx, xx, airY + 22, 4, "rgba(255,107,129,.7)", 2.6);
      }
      K.pill(ctx, "지구 복사(적외선)", 470, groundY + 30, { s: 11.5, a: "center", c: KC.red });
      /* 재복사 */
      var nre = Math.round(eps * 4);
      for (var m = 0; m < nre; m++) ray(560 + m * 18, airY + 30, 560 + m * 18, groundY - 8, KC.violet, 3, 2);
      if (nre > 0) K.pill(ctx, "재복사", 560 + nre * 9 - 9, airY - 14, { s: 11.5, a: "center", c: KC.violet, box: [0, LW] });
      K.t(ctx, "태양 상수 1361 W/m² · 슈테판–볼츠만 법칙으로 계산", 20, H - 16, { s: 11, c: "#d8def0" });

      /* ── 오른쪽 계기판 ── */
      var RX = LW + 8, px = RX + 16;
      K.stage(ctx, RX, 0, W - RX, H, "lab", { seed: 263 });
      K.pill(ctx, "지표 온도", px - 2, 28, { s: 13, c: KC.blue });
      K.t(ctx, T.toFixed(1) + " ℃", px, 82, { s: 32, w: "900", c: T >= 20 ? KC.orange : (T <= 5 ? KC.blue : KC.ink) });
      /* 온도계 막대 */
      var tx0 = px, tx1 = W - 20, TY = 104;
      function TX(c) { return tx0 + clamp((c + 40) / 100, 0, 1) * (tx1 - tx0); }
      var tb = ctx.createLinearGradient(tx0, 0, tx1, 0); tb.addColorStop(0, "#5aa8ff"); tb.addColorStop(.5, "#3fd3a3"); tb.addColorStop(1, "#ff6b50");
      ctx.globalAlpha = .35; ctx.fillStyle = tb; ctx.beginPath(); ctx.roundRect(tx0, TY, tx1 - tx0, 10, 5); ctx.fill(); ctx.globalAlpha = 1;
      K.glow(ctx, TX(T), TY + 5, 4, "rgba(255,211,107,.95)", 3);
      K.glow(ctx, TX(Tno()), TY + 5, 3, "rgba(127,211,255,.95)", 3);
      K.t(ctx, "−40", tx0, TY + 26, { s: 10, c: KC.dim }); K.t(ctx, "+60 ℃", tx1, TY + 26, { s: 10, a: "right", c: KC.dim });
      K.t(ctx, "대기가 없다면", px, 162, { s: 12, w: "800", c: KC.mute });
      K.t(ctx, Tno().toFixed(1) + " ℃", px, 192, { s: 20, w: "900", c: KC.blue });
      K.t(ctx, "온실 효과의 크기", px, 232, { s: 12, w: "800", c: KC.mute });
      K.t(ctx, "+" + green().toFixed(1) + " ℃", px, 262, { s: 20, w: "900", c: green() >= 40 ? KC.orange : (green() < 2 ? KC.blue : KC.green) });
      K.t(ctx, "흡수한 태양 복사", px, 302, { s: 11.5, w: "800", c: KC.mute });
      K.t(ctx, absorbed().toFixed(0) + " W/m²", px, 326, { s: 16, w: "900", c: absorbed() < 200 ? KC.blue : KC.yellow });
      K.t(ctx, "적외선을 붙잡을수록", px, 372, { s: 11, c: KC.mute });
      K.t(ctx, "지표는 더 뜨거운 상태에서", px, 390, { s: 11, c: KC.mute });
      K.t(ctx, "균형을 이룹니다 = 온실 효과", px, 408, { s: 11, c: KC.mute });

      var ch = false;
      if (green() < 2 && !got.a) { got.a = ch = true; }
      if (green() >= 40 && !got.b) { got.b = ch = true; }
      if (absorbed() < 200 && !got.c) { got.c = ch = true; }
      if (ch) { window.sthState("cGreen", got); mission(); }

      $("c-green-info").innerHTML = "지표 온도 <b>" + T.toFixed(1) + " ℃</b> · 온실 효과의 크기 <b>+" + green().toFixed(1) + " ℃</b>. " +
        (green() < 2 ? "대기가 적외선을 거의 붙잡지 못해 <b>온실 효과가 사라졌습니다.</b> 지표가 내보낸 열이 곧장 우주로 나갑니다. 알베도가 0.30일 때 이 지구는 <b>약 −18 ℃</b>입니다." :
          (green() >= 40 ? "담요가 아주 두꺼워졌습니다. 나가는 적외선이 더 많이 붙잡혀 지표는 <b>더 뜨거운 상태에서</b> 균형을 이룹니다. 온실 기체가 늘어난다는 것이 바로 이 뜻입니다." :
            (absorbed() < 200 ? "반사율이 커져 애초에 <b>흡수하는 태양 복사가 줄었습니다.</b> 추워지면 얼음이 늘고, 얼음이 늘면 반사율이 더 커지는 <b>되먹임</b>이 일어납니다." :
              "슬라이더를 움직여 보세요. <b>흡수율</b>은 담요의 두께를, <b>알베도</b>는 애초에 받아들이는 햇빛의 양을 정합니다.")));
    }
    function mission() {
      if (got.a) done("m3-2a"); if (got.b) done("m3-2b"); if (got.c) done("m3-2c");
      if (got.a && got.b && got.c) {
        window.sthMission("m3-2", true, "<span class='m-tag'>미션 완료</span>온실 효과가 없다면 지구 표면은 약 <b>−18 ℃</b>였을 것입니다. 지금의 <b>15 ℃</b>는 대기가 적외선을 붙잡아 준 덕분(+33 ℃)이고, 문제는 그 담요가 <b>더 두꺼워지고 있다</b>는 것입니다. 알베도는 담요와 상관없이 <b>받아들이는 햇빛 자체</b>를 줄입니다.");
        ep.clear(1);
      }
    }
    canvas._redraw = draw;
    $("c-eps").addEventListener("input", function (e) { eps = +e.target.value; $("c-eps-val").textContent = eps.toFixed(2); draw(); });
    $("c-alb").addEventListener("input", function (e) { alb = +e.target.value; $("c-alb-val").textContent = alb.toFixed(2); draw(); });
    draw(); mission();
    var playG = playBtn("c-green-play");
    anim(canvas, function (dt) { if (playG.on) { tg += dt / 70; draw(); } });
  })();

  /* ---- 장면3 배출 경로 ---- */
  (function () {
    var canvas = $("c-c-path"), ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var rate = 1, ccs = false;
    var got = window.sthState("cPath") || { a: false, b: false, c: false, d: false };
    var E0 = 40, Y0 = 2025, Y1 = 2100, NOW = 1.2, TCRE = 0.45;

    function emit(y) {
      var e = E0 * Math.pow(1 - rate / 100, y - Y0);
      var net = e - ((ccs && y >= 2040) ? 5 : 0);
      return Math.max(net, -5);
    }
    function cum() { var s = 0; for (var y = Y0; y <= Y1; y++) s += emit(y); return s; }
    function T2100() { return NOW + TCRE * cum() / 1000; }

    var GX0 = 90, GX1 = 640, GY0 = 76, GY1 = 286;
    function X(y) { return GX0 + (y - Y0) / (Y1 - Y0) * (GX1 - GX0); }
    function Y(e) { return GY1 - (e + 8) / 54 * (GY1 - GY0); }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      var C = cum(), T = T2100();
      var LW = 652;
      K.stage(ctx, 0, 0, LW, 316, "lab", { seed: 271 });
      K.pill(ctx, "2025~2100년 이산화 탄소 배출 경로", 16, 28, { s: 13, c: KC.blue });
      axes(ctx, GX0, GY0, GX1, GY1);
      for (var y = 2025; y <= 2100; y += 25) {
        ctx.strokeStyle = KC.grid; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(X(y), GY0); ctx.lineTo(X(y), GY1); ctx.stroke();
        K.t(ctx, String(y), X(y), GY1 + 18, { s: 10.5, a: y === 2100 ? "right" : "center", c: KC.mute, w: "600" });
      }
      for (var e = 0; e <= 40; e += 10) K.t(ctx, (e * 10) + "", GX0 - 8, Y(e) + 4, { s: 10.5, a: "right", c: KC.mute, w: "600" });
      K.t(ctx, "연간 배출량 (억 t CO₂ / 년)", GX0 - 26, GY0 - 14, { s: 11, c: KC.mute });
      ctx.strokeStyle = "rgba(63,211,163,.7)"; ctx.lineWidth = 1.4; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(GX0, Y(0)); ctx.lineTo(GX1, Y(0)); ctx.stroke(); ctx.setLineDash([]);
      K.pill(ctx, "0 — 탄소 중립", GX1 - 6, Y(0) - 8, { s: 10.5, a: "right", c: KC.green });

      /* 누적 면적: 쌓이는 이산화 탄소 */
      var fg = ctx.createLinearGradient(0, Y(40), 0, Y(0));
      fg.addColorStop(0, "rgba(255,120,90,.55)"); fg.addColorStop(1, "rgba(255,120,90,.12)");
      ctx.fillStyle = fg;
      ctx.beginPath(); ctx.moveTo(X(Y0), Y(0));
      for (var y2 = Y0; y2 <= Y1; y2++) ctx.lineTo(X(y2), Y(emit(y2)));
      ctx.lineTo(X(Y1), Y(0)); ctx.closePath(); ctx.fill();
      var pts = [];
      for (var y3 = Y0; y3 <= Y1; y3++) pts.push([X(y3), Y(emit(y3))]);
      glowLine(ctx, pts, KC.orange, 3);
      K.pill(ctx, "색칠한 넓이 = 누적 배출량", X(2062), Y(30), { s: 12, a: "center", c: KC.orange });
      if (ccs) K.pill(ctx, "2040~ 포집 50억 t/년", X(2040) + 6, Y(-4) + 4, { s: 10.5, c: KC.blue });

      /* ── 오른쪽: 2100년 온도계 ── */
      var RX = LW + 8, px = RX + 16;
      K.stage(ctx, RX, 0, W - RX, 316, "night", { seed: 273 });
      K.pill(ctx, "2100년 기온 상승", px - 2, 28, { s: 13, c: KC.blue });
      var tc = T < 1.5 ? KC.green : (T < 2.0 ? KC.yellow : KC.red);
      K.t(ctx, "+" + T.toFixed(2) + " ℃", px, 84, { s: 30, w: "900", c: tc });
      K.pill(ctx, T < 1.5 ? "✅ 1.5 ℃ 목표 안" : (T < 2.0 ? "2 ℃ 아래 — 1.5는 아직" : "목표를 넘었습니다"), px, 116, { s: 12, c: tc, box: [RX, W] });
      /* 온도계 */
      var bx = W - 52, top = 60, bot = 270;
      function TY(v2) { return bot - clamp(v2 / 3.5, 0, 1) * (bot - top); }
      ctx.fillStyle = "rgba(255,255,255,.08)"; ctx.beginPath(); ctx.roundRect(bx - 9, top - 6, 18, bot - top + 12, 9); ctx.fill();
      var mg = ctx.createLinearGradient(0, bot, 0, top); mg.addColorStop(0, "#3fd3a3"); mg.addColorStop(.45, "#ffd36b"); mg.addColorStop(1, "#ff5a6e");
      ctx.save(); ctx.shadowColor = tc; ctx.shadowBlur = 10; ctx.fillStyle = mg;
      ctx.beginPath(); ctx.roundRect(bx - 6, TY(T), 12, bot - TY(T) + 6, 6); ctx.fill();
      ctx.beginPath(); ctx.arc(bx, bot + 14, 13, 0, 6.2832); ctx.fill(); ctx.restore();
      [[1.5, KC.green], [2.0, KC.yellow]].forEach(function (m) {
        ctx.strokeStyle = m[1]; ctx.lineWidth = 1.6; ctx.setLineDash([4, 3]);
        ctx.beginPath(); ctx.moveTo(bx - 24, TY(m[0])); ctx.lineTo(bx + 14, TY(m[0])); ctx.stroke(); ctx.setLineDash([]);
        K.t(ctx, m[0].toFixed(1) + " ℃", bx - 28, TY(m[0]) + 4, { s: 10.5, a: "right", w: "800", c: m[1] });
      });
      K.t(ctx, "누적 배출", px, 160, { s: 11.5, w: "800", c: KC.mute });
      K.t(ctx, Math.round(C * 10).toLocaleString() + " 억 t", px, 184, { s: 14, w: "900", c: KC.orange });
      K.t(ctx, "지금까지 +" + NOW.toFixed(1) + " ℃", px, 222, { s: 11, c: KC.mute });
      K.t(ctx, "누적 1조 t마다", px, 242, { s: 11, c: KC.mute });
      K.t(ctx, "+0.45 ℃", px, 260, { s: 11, c: KC.mute });

      /* ── 아래 설명 ── */
      K.stage(ctx, 0, 324, W, H - 324, "night", { seed: 275 });
      K.t(ctx, "해마다 줄일 비율 " + rate.toFixed(2) + " %" + (ccs ? " · 2040년부터 해마다 50억 t 포집" : ""), 20, 350, { s: 13, w: "900", c: KC.ink });
      K.t(ctx, "기온 상승은 ‘올해 얼마나 배출했는가’보다 ‘지금까지 모두 합쳐 얼마나 배출했는가’에 거의 비례합니다.", 20, 378, { s: 11.5, c: KC.mute });
      K.t(ctx, "그래서 목표 온도는 곧 ‘앞으로 더 배출해도 되는 양’, 탄소 예산으로 번역됩니다.", 20, 402, { s: 11.5, c: KC.mute });
      K.t(ctx, "포집·저장 기술을 넣으면 같은 감축률로도 더 낮출 수 있지만, 기술만으로 감축을 대신할 수는 없습니다.", 20, 426, { s: 11.5, c: KC.mute });

      var ch = false;
      if (T < 2.0 && !got.a) { got.a = ch = true; }
      if (T < 1.5 && !got.b) { got.b = ch = true; }
      if (rate <= 0 && !got.c) { got.c = ch = true; }
      if (ch) { window.sthState("cPath", got); mission(); }

      $("c-path-info").innerHTML = "누적 배출 <b>" + Math.round(C * 10).toLocaleString() + "억 t</b> → 2100년 <b>+" + T.toFixed(2) + " ℃</b>. " +
        (rate <= 0 ? "감축을 전혀 하지 않으면 해마다 400억 t이 그대로 쌓입니다. 2100년에는 <b>2.5 ℃를 훌쩍 넘습니다.</b>" :
          (T < 1.5 ? "1.5 ℃ 목표 안에 들어왔습니다. 그러려면 배출을 해마다 <b>6 % 가까이</b> 줄여야 한다는 계산이 나옵니다." :
            (T < 2.0 ? "2 ℃ 아래로는 내려왔습니다. 1.5 ℃까지 가려면 감축 속도를 훨씬 더 올려야 합니다." :
              "아직 목표를 넘습니다. 감축률을 올리거나 포집 기술을 함께 써 보세요.")));
    }
    function mission() {
      if (got.a) done("m3-3a"); if (got.b) done("m3-3b"); if (got.c) done("m3-3c"); if (got.d) done("m3-3d");
      if (got.a && got.b && got.c && got.d) {
        window.sthMission("m3-3", true, "<span class='m-tag'>미션 완료</span>1.5 ℃는 구호가 아니라 <b>계산에서 나온 숫자</b>였습니다. 아무것도 하지 않으면 2.5 ℃를 넘고, 해마다 6 % 가까이 줄여야 겨우 1.5 ℃ 안에 들어옵니다. 국제 사회가 <b>탄소 중립</b>을 목표로 삼은 까닭입니다.");
        ep.clear(2);
      }
    }
    canvas._redraw = draw;
    $("c-rate").addEventListener("input", function (e) { rate = +e.target.value; $("c-rate-val").textContent = rate.toFixed(2) + " %/년"; draw(); });
    segWire("c-ccs", function (b) {
      ccs = b.getAttribute("data-c") === "on";
      $("c-ccs-val").textContent = ccs ? "해마다 50억 t 포집" : "도입 안 함";
      draw();
    });
    window.sthOrder({
      mount: "c-order",
      steps: [
        "1992년 유엔 기후 변화 협약 — 기후 변화에 함께 대응하기로 한 첫 국제 협약",
        "1997년 교토 의정서 — 선진국의 온실 기체 감축을 의무로 정함",
        "2015년 파리 협정 — 모든 나라가 감축 목표를 내고, 상승을 1.5 ℃로 억제하기로 합의",
        "2021년 글래스고 기후 합의 — 파리 협정의 이행 지침을 완성하고 석탄 발전 감축에 합의"
      ],
      onDone: function () { got.d = true; window.sthState("cPath", got); mission(); }
    });
    draw(); mission();
  })();

  /* ---- 장면4 해수면 상승과 적응 ---- */
  (function () {
    var canvas = $("c-c-sea"), ctx = window.setupCanvas(canvas), W = canvas._w, H = canvas._h;
    var dT = 2.5, wall = 0, t = 0;
    var got = window.sthState("cSea") || { a: false, b: false, c: false, d: false };
    var SURGE = 60;

    function riseCm() { return (0.28 + 0.20 * (dT - 1.5)) * 100; }
    function needCm() { return riseCm() + SURGE; }
    function okWall() { return wall >= needCm() && wall <= needCm() + 40; }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      var rs = riseCm(), nd = needCm();
      K.stage(ctx, 0, 0, W, 372, "night", { seed: 281 });
      K.pill(ctx, "2100년 해수면 상승과 연안 도시의 적응", 16, 28, { s: 13, c: KC.blue });
      var gx0 = 14, gx1 = W - 14, seaBase = 286, wallX = 470, bot = 372;
      ctx.save(); ctx.beginPath(); ctx.roundRect(0, 0, W, bot, 14); ctx.clip();
      /* 매립지 */
      land(ctx, wallX, seaBase, gx1 - wallX + 14, bot - seaBase);
      /* 도시: 불 켜진 건물들 */
      var R = K.rng(33);
      for (var b = 0; b < 9; b++) {
        var bx = wallX + 40 + b * 42, bh = 50 + R() * 90, bw = 30;
        var bg = ctx.createLinearGradient(bx, 0, bx + bw, 0); bg.addColorStop(0, "#2a3358"); bg.addColorStop(1, "#1a2040");
        ctx.fillStyle = bg; ctx.fillRect(bx, seaBase - bh, bw, bh);
        for (var wy = seaBase - bh + 8; wy < seaBase - 8; wy += 12) for (var wx = bx + 5; wx < bx + bw - 5; wx += 9) { if (R() > .45) { ctx.fillStyle = "rgba(255,214,120," + (.5 + R() * .4).toFixed(2) + ")"; ctx.fillRect(wx, wy, 4, 5); } }
      }
      /* 바다 */
      var seaTop = seaBase - rs * 0.8;
      water(ctx, 0, seaTop, wallX, bot - seaTop, "rgba(60,150,220,.85)", "rgba(6,22,70,.95)");
      ctx.strokeStyle = "#bfe6ff"; ctx.lineWidth = 2.2; ctx.beginPath();
      for (var q = 0; q <= 60; q++) { var xx = q / 60 * wallX, yy = seaTop + Math.sin(q / 4 + t * 0.12) * 3; if (q === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy); }
      ctx.stroke();
      /* 침수 */
      var surgeY = seaTop - SURGE * 0.8;
      if (wall < nd) {
        var fg = ctx.createLinearGradient(0, surgeY, 0, seaBase + 16); fg.addColorStop(0, "rgba(90,170,240,.55)"); fg.addColorStop(1, "rgba(30,90,170,.6)");
        ctx.fillStyle = fg; ctx.fillRect(wallX + 8, surgeY + Math.sin(t * .1) * 2, gx1 - wallX, seaBase - surgeY + 16);
      }
      ctx.restore();
      K.pill(ctx, "2100년 해수면 (+" + rs.toFixed(0) + " cm)", 24, seaTop - 12, { s: 12, c: KC.blue });
      /* 현재 해수면 기준선 */
      ctx.strokeStyle = "rgba(220,230,255,.6)"; ctx.setLineDash([5, 5]); ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(gx0, seaBase); ctx.lineTo(gx1, seaBase); ctx.stroke(); ctx.setLineDash([]);
      K.pill(ctx, "지금의 해수면", 24, seaBase + 22, { s: 11, c: KC.ink });
      /* 폭풍 해일 선 */
      ctx.save(); ctx.strokeStyle = KC.red; ctx.setLineDash([7, 4]); ctx.lineWidth = 2; ctx.shadowColor = KC.red; ctx.shadowBlur = 6;
      ctx.beginPath(); ctx.moveTo(gx0, surgeY); ctx.lineTo(gx1, surgeY); ctx.stroke(); ctx.setLineDash([]); ctx.restore();
      K.pill(ctx, "폭풍 해일이 닿는 높이 (해수면 + 60 cm)", gx1 - 10, surgeY - 10, { s: 11.5, a: "right", c: KC.red });
      if (wall < nd) K.pill(ctx, "도시 침수", wallX + 150, surgeY + 26, { s: 15, a: "center", c: KC.red });
      /* 방조제: 콘크리트 */
      var wallH = wall * 0.8, wc = okWall() ? KC.green : (wall < nd ? KC.red : KC.yellow);
      if (wallH > 1) {
        var cg = ctx.createLinearGradient(wallX - 16, 0, wallX + 6, 0); cg.addColorStop(0, "#9aa2b4"); cg.addColorStop(.5, "#cfd5e2"); cg.addColorStop(1, "#7d8597");
        ctx.fillStyle = cg; ctx.fillRect(wallX - 16, seaBase - wallH, 22, wallH + 8);
        ctx.fillStyle = wc; ctx.fillRect(wallX - 16, seaBase - wallH, 22, 3);
      }
      K.pill(ctx, "방조제 " + wall + " cm", wallX + 16, seaBase - Math.max(wallH, 10) - 10, { s: 12, c: wc });
      K.pill(ctx, "연안 도시 — 지반이 지금의 해수면 높이인 매립지", wallX + 16, bot - 12, { s: 11, c: "#e2f2cf" });

      /* ── 아래 계기판 ── */
      K.stage(ctx, 0, bot + 6, W, H - bot - 6, "lab", { seed: 283 });
      K.t(ctx, "바닷물은 데워지면 부피가 늘고(열팽창), 육지의 빙하가 녹아 물이 더해집니다.", 20, 396, { s: 11, c: KC.mute });
      K.t(ctx, "기온 +" + dT.toFixed(1) + " ℃", 20, 420, { s: 14, w: "900", c: KC.orange });
      K.t(ctx, "해수면 상승 " + rs.toFixed(0) + " cm", 180, 420, { s: 14, w: "900", c: rs >= 70 ? KC.red : (rs < 35 ? KC.green : KC.blue) });
      K.t(ctx, "필요한 방조제 " + nd.toFixed(0) + " cm 이상", 400, 420, { s: 14, w: "900", c: KC.yellow });
      K.pill(ctx, okWall() ? "✅ 꼭 맞게 세웠습니다" : (wall < nd ? "❌ 너무 낮습니다 — 폭풍 해일에 잠깁니다" : "⚠ 필요보다 40 cm 넘게 높음 — 예산 낭비"), W - 16, 443, { s: 11.5, a: "right", c: wc });

      var ch = false;
      if (rs >= 70 && !got.a) { got.a = ch = true; }
      if (rs < 35 && !got.b) { got.b = ch = true; }
      if (okWall() && !got.c) { got.c = ch = true; }
      if (ch) { window.sthState("cSea", got); mission(); }

      $("c-sea-info").innerHTML = "기온이 오르면 해수면도 오릅니다. 지금 설정에서는 2100년까지 <b>" + rs.toFixed(0) + " cm</b> 오릅니다. " +
        (okWall() ? "방조제를 <b>꼭 맞게</b> 세웠습니다. 폭풍 해일까지 막으면서 예산도 아꼈습니다." :
          (wall < nd ? "지금 높이로는 폭풍 해일이 넘어옵니다. <b>해수면 상승 + 60 cm</b> 이상으로 올리세요." :
            "필요한 높이보다 너무 높습니다. <b>너무 낮아도, 너무 높아도</b> 좋은 대책이 아닙니다.")) +
        " 그리고 방조제는 <b>적응</b>일 뿐, 상승 자체를 멈추려면 <b>완화</b>가 필요합니다.";
    }
    function mission() {
      if (got.a) done("m3-4a"); if (got.b) done("m3-4b"); if (got.c) done("m3-4c"); if (got.d) done("m3-4d");
      if (got.a && got.b && got.c && got.d) {
        window.sthMission("m3-4", true, "<span class='m-tag'>미션 완료</span>기온 상승을 1.5 ℃에서 묶으면 방조제도 훨씬 낮아도 됩니다. <b>완화(줄이기)</b>가 <b>적응(견디기)</b>의 부담을 덜어 줍니다. 둘은 고르는 것이 아니라 함께 하는 것입니다.");
        ep.clear(3); ep.clear(4);
      }
    }
    canvas._redraw = draw;
    $("c-dt").addEventListener("input", function (e) { dT = +e.target.value; $("c-dt-val").textContent = dT.toFixed(1) + " ℃"; draw(); });
    $("c-wall").addEventListener("input", function (e) { wall = +e.target.value; $("c-wall-val").textContent = wall + " cm"; draw(); });
    draw();

    window.sthSort({
      mount: "c-sort",
      buckets: [
        { id: "mit", label: "완화", sub: "온실 기체 배출 자체를 줄인다" },
        { id: "ada", label: "적응", sub: "이미 일어난 변화에 맞춰 견딘다" }
      ],
      items: [
        { t: "재생 에너지를 늘려 화석 연료 발전을 줄인다", a: "mit", why: "배출을 줄이므로 완화입니다." },
        { t: "재생 에너지로 물을 전기 분해해 만든 그린 수소를 쓴다", a: "mit", why: "생산 단계부터 온실 기체를 내지 않는 에너지입니다." },
        { t: "발전소에서 나오는 이산화 탄소를 포집해 지층에 저장한다", a: "mit", why: "대기로 나갈 이산화 탄소를 붙잡으므로 완화입니다.", hint: "대기 중 농도를 낮추는 쪽일까요, 피해를 덜 받는 쪽일까요?" },
        { t: "숲을 늘려 이산화 탄소를 흡수한다", a: "mit", why: "식물이 광합성으로 이산화 탄소를 흡수합니다." },
        { t: "해안 도시에 방조제를 높이 쌓는다", a: "ada", why: "이미 오른 해수면에 맞춰 피해를 줄이는 대책입니다." },
        { t: "더위에 잘 견디는 품종으로 농작물을 바꾼다", a: "ada", why: "바뀐 기후에 맞춰 사는 방식을 바꾸는 것입니다." },
        { t: "폭염 때 문을 여는 무더위 쉼터를 늘린다", a: "ada", why: "이미 일어난 폭염의 피해를 줄이는 대책입니다.", hint: "폭염 자체를 줄이는 일인가요?" },
        { t: "가뭄에 대비해 빗물 저장 시설을 늘린다", a: "ada", why: "달라진 강수에 맞춘 대비입니다." }
      ],
      onDone: function () { got.d = true; window.sthState("cSea", got); mission(); }
    });
    mission();
    var playS = playBtn("c-sea-play");
    anim(canvas, function (dt) { if (playS.on) { t += dt / 70; draw(); } });
  })();

  function finish() { window.sthState("r3", "해결 · 온실 효과가 없으면 −18 ℃, 1.5 ℃ 안에 들려면 해마다 6 % 가까이 감축, 완화와 적응은 함께"); }
  function vsC() {
    var p = window.sthState("c-p") || "";
    $("c-vs").innerHTML = "<b>나의 첫 추리</b> " + (p || "기록 없음") + "<br>" +
      (p.indexOf("㉡") === 0 ? "정확했습니다. 그리고 오늘은 그 ‘담요’가 없을 때 지구가 몇 도가 되는지까지 직접 계산했습니다 — 약 −18 ℃ 였습니다."
        : "㉡ 이 정답이었습니다. 온실 기체는 태양 복사는 통과시키고 <b>지구 복사(적외선)</b>를 붙잡았다가 다시 지표로 돌려보냅니다.");
  }
  vsC();
  ep.onShow(vsC);
  window.sthWork({
    mount: "wkC", unitLabel: "[지구과학 Ⅰ-2] 이야기 ③ 탄소를 줄이는 회의",
    items: [
      { id: "c1", label: "온실 효과를 한 문단으로", hint: "태양 복사와 지구 복사를 구분해서, 온실 기체가 하는 일과 그 결과 지표 온도가 어떻게 되는지 쓰세요." },
      { id: "c2", label: "협상 대표에게 드리는 답", hint: "1.5 ℃ 목표를 지키려면 무엇을 얼마나 해야 하는지 계산 결과로 답하고, 완화 대책과 적응 대책을 하나씩 들어 쓰세요." }
    ]
  });
})();

/* ========================================================================= 04 정리하기 */
window.sthWork({
  mount: "wk", unitLabel: "[지구과학 Ⅰ-2] 대기와 해양의 상호작용과 기후 변화 — 정리",
  recap: [
    { key: "r1", label: "① 멸치가 사라진 해" },
    { key: "r2", label: "② 기후를 흔드는 것들" },
    { key: "r3", label: "③ 탄소를 줄이는 회의" },
    { key: "rQuiz", label: "수준별 문제" },
    { key: "rLab", label: "응용 실험실" },
    { key: "rInq", label: "교과서 실험" },
    { key: "rReal", label: "실제 자료" }
  ],
  items: [
    { id: "all", label: "세 사건을 꿰는 한 문장", hint: "대기와 해양은 서로 밀고 당기며, 그 상호 작용이 몇 해 규모(엔소)부터 수만 년 규모(밀란코비치)까지 기후를 만듭니다. 세 이야기에서 ‘에너지의 출입’과 ‘되먹임’이 어떻게 되풀이해 나타났는지 한 문장으로 쓰세요." },
    { id: "w4", label: "아직 헷갈리는 것", hint: "다음 시간에 여기서부터 시작합니다." }
  ]
});

/* ========================================================================= 05 우리 반 */
window.sthShare({
  mount: "share", unit: "eshs-1-2", unitLabel: "[지구과학 Ⅰ-2] 대기와 해양의 상호작용과 기후 변화",
  rows: [
    { key: "r1", label: "① 멸치가 사라진 해" },
    { key: "r2", label: "② 기후를 흔드는 것들" },
    { key: "r3", label: "③ 탄소를 줄이는 회의" },
    { key: "rQuiz", label: "수준별 문제" },
    { key: "rLab", label: "응용 실험실" },
    { key: "rInq", label: "교과서 실험" },
    { key: "rReal", label: "실제 자료" }
  ],
  line: { id: "all", label: "세 사건을 꿰는 한 문장" }
});

})();
