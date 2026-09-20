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

    function draw() {
      paper(ctx, W, H);
      var off = offshore(), mode = off >= 0.5 ? "up" : (off <= -0.5 ? "down" : "none");
      var T = sst(), nut = nutrient(), fi = fish();
      text(ctx, "페루 앞바다 — 해안을 따라 부는 바람과 연안 용승·침강 (남반구)", 60, 32, { s: 14, w: "900" });

      /* 왼쪽 : 위에서 본 모습 */
      var lx = 60, ly = 66, lw = 290, lh = 184;
      ctx.fillStyle = v("--card-2"); ctx.fillRect(lx + lw - 50, ly, 50, lh);
      ctx.strokeStyle = v("--line"); ctx.lineWidth = 2; ctx.strokeRect(lx, ly, lw, lh);
      text(ctx, "위에서 본 모습", lx, ly - 10, { s: 11.5, w: "800", c: v("--mist") });
      text(ctx, "↑ 북", lx + 12, ly + 20, { s: 11, w: "800", c: v("--mist") });
      text(ctx, "육지", lx + lw - 25, ly + lh / 2, { s: 11, a: "center", w: "800", c: v("--mist") });
      text(ctx, "바다", lx + 60, ly + lh / 2, { s: 11.5, a: "center", w: "800", c: v("--mist") });
      var wv = azVec(az), ev = azVec(ekAz()), mx = lx + 160, my = ly + lh / 2;
      ctx.strokeStyle = v("--amber"); ctx.fillStyle = v("--amber"); ctx.lineWidth = 4;
      window.drawArrow(ctx, mx, my, mx + wv.x * 44, my + wv.y * 44, 11);
      text(ctx, "바람", clamp(mx + wv.x * 62, lx + 24, lx + lw - 24), clamp(my + wv.y * 62 + 4, ly + 16, ly + lh - 8),
        { s: 11.5, a: "center", w: "800", c: v("--amber-700") });
      ctx.strokeStyle = v("--coral"); ctx.fillStyle = v("--coral");
      window.drawArrow(ctx, mx, my, mx + ev.x * 44, my + ev.y * 44, 11);
      text(ctx, "에크만 수송", clamp(mx + ev.x * 70, lx + 44, lx + lw - 44), clamp(my + ev.y * 70 + 4, ly + 16, ly + lh - 8),
        { s: 11.5, a: "center", w: "800", c: v("--coral-700") });

      /* 오른쪽 : 해안 단면 */
      var sx0 = 400, sx1 = 860, sy0 = 66, sy1 = 282;
      ctx.fillStyle = v("--brand-100"); ctx.fillRect(sx0, sy0, sx1 - sx0, sy1 - sy0);
      ctx.fillStyle = v("--card-2"); ctx.fillRect(sx1 - 58, sy0, 58, sy1 - sy0);
      ctx.strokeStyle = v("--line"); ctx.lineWidth = 2; ctx.strokeRect(sx0, sy0, sx1 - sx0, sy1 - sy0);
      text(ctx, "해안 단면 (해안은 오른쪽)", sx0, sy0 - 10, { s: 11.5, w: "800", c: v("--mist") });
      text(ctx, "육지", sx1 - 29, sy0 + 22, { s: 11, a: "center", w: "800", c: v("--mist") });

      /* 표층 수송 */
      ctx.strokeStyle = v("--coral"); ctx.fillStyle = v("--coral"); ctx.lineWidth = 5;
      if (mode === "up") window.drawArrow(ctx, sx1 - 80, sy0 + 34, sx0 + 40, sy0 + 34, 13);
      else if (mode === "down") window.drawArrow(ctx, sx0 + 40, sy0 + 34, sx1 - 80, sy0 + 34, 13);
      else text(ctx, "표층 수송이 해안과 나란합니다", sx0 + 40, sy0 + 38, { s: 12, w: "800", c: v("--mist") });
      if (mode !== "none") text(ctx, "표층 에크만 수송", (sx0 + sx1) / 2 - 20, sy0 + 20, { s: 11.5, a: "center", w: "800", c: v("--coral-700") });

      /* 수온약층 */
      var thermo = mode === "up" ? 120 : (mode === "down" ? 246 : 196);
      ctx.strokeStyle = v("--teal"); ctx.lineWidth = 2.5; ctx.setLineDash([7, 5]);
      ctx.beginPath();
      for (var q = 0; q <= 40; q++) {
        var u = q / 40, xx = sx0 + u * (sx1 - sx0 - 58);
        var yy = thermo + (mode === "up" ? -26 : (mode === "down" ? 18 : 0)) * u;
        if (q === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
      }
      ctx.stroke(); ctx.setLineDash([]);
      text(ctx, "수온약층", sx0 + 12, thermo - 10, { s: 11.5, w: "800", c: v("--teal-700") });

      /* 연직 흐름 + 알갱이 */
      if (mode !== "none") {
        ctx.strokeStyle = v(mode === "up" ? "--cold" : "--brand"); ctx.fillStyle = v(mode === "up" ? "--cold" : "--brand"); ctx.lineWidth = 4;
        for (var i = 0; i < 3; i++) {
          var ax = sx1 - 110 + i * 34;
          if (mode === "up") window.drawArrow(ctx, ax, sy1 - 18, ax, sy0 + 62, 10);
          else window.drawArrow(ctx, ax, sy0 + 62, ax, sy1 - 18, 10);
        }
        for (var j = 0; j < 9; j++) {
          var ph = ((t * 0.035) + j / 9) % 1;
          var py = mode === "up" ? sy1 - 18 - ph * (sy1 - sy0 - 80) : sy0 + 62 + ph * (sy1 - sy0 - 80);
          ctx.save(); ctx.globalAlpha = 0.8; ctx.fillStyle = v(mode === "up" ? "--cold" : "--brand");
          ctx.beginPath(); ctx.arc(sx1 - 190 + (j % 3) * 26, py, 5, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        }
      }
      text(ctx, mode === "up" ? "찬 심층수 상승 — 연안 용승" : (mode === "down" ? "표층수 하강 — 연안 침강" : "용승도 침강도 없음"),
        (sx0 + sx1) / 2, sy1 + 24, { s: 14.5, a: "center", w: "900", c: mode === "none" ? v("--mist") : (mode === "up" ? v("--cold") : v("--brand-700")) });

      /* 아래 계기판 */
      text(ctx, "바람 " + azName(az) + "쪽 (" + az + "°) · 세기 " + ws.toFixed(1) + " m/s  →  에크만 수송 " + azName(ekAz()) + "쪽",
        60, 330, { s: 13.5, w: "900" });
      text(ctx, "용승 지수 = 바람 세기 × 바다 쪽 성분 = " + upIndex().toFixed(1), 60, 356, { s: 12, c: v("--mist") });
      text(ctx, "표층 수온 " + T.toFixed(1) + " ℃", 60, 396, { s: 18, w: "900", c: T <= 18 ? v("--cold") : (T >= 22 ? v("--coral-700") : v("--ink")) });
      text(ctx, "영양염 지수 " + Math.round(nut) + " %", 330, 396, { s: 18, w: "900", c: v("--teal-700") });
      text(ctx, "멸치 어획 지수 " + Math.round(fi) + " %", 600, 396, { s: 18, w: "900", c: fi >= 90 ? v("--teal-700") : v("--rose-700") });
      text(ctx, "깊은 바다의 찬물에는 영양염이 많습니다. 그 물이 올라와야 플랑크톤이 늘고, 멸치 떼가 모입니다.", 60, 424, { s: 11, c: v("--mist") });

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
    anim(canvas, function () { t += 1; draw(); });
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

    function draw() {
      paper(ctx, W, H);
      var a = anom(), ph = phase();
      text(ctx, "열대 태평양의 적도 단면 — 무역풍이 만드는 워커 순환", 60, 30, { s: 14, w: "900" });

      var bx0 = 100, bx1 = 830, by0 = 150, by1 = 330;

      /* 무역풍 */
      ctx.save();
      ctx.strokeStyle = v("--amber"); ctx.fillStyle = v("--amber"); ctx.lineWidth = 2 + 4 * k;
      window.drawArrow(ctx, bx1 - 20, 74, bx0 + 20 + 240 * clamp(1 - k, 0, 0.7), 74, 10 + 5 * k);
      ctx.restore();
      text(ctx, "무역풍 " + k.toFixed(2) + "배 (동 → 서)", (bx0 + bx1) / 2, 54, { s: 12.5, a: "center", w: "900", c: v("--amber-700") });

      /* 비구름 (강수대) */
      var cloudX = bx0 + 130 + 420 * clamp(1 - k, 0, 0.7) / 0.7;
      ctx.save(); ctx.fillStyle = v("--violet"); ctx.globalAlpha = 0.5;
      for (var c = 0; c < 4; c++) { ctx.beginPath(); ctx.arc(cloudX - 38 + c * 25, 116 + (c % 2) * 7, 18, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
      text(ctx, "강수대(상승 기류)", cloudX, 96, { s: 11.5, a: "center", w: "900", c: v("--violet-700") });
      ctx.save(); ctx.strokeStyle = v("--violet"); ctx.fillStyle = v("--violet"); ctx.lineWidth = 3;
      window.drawArrow(ctx, cloudX, by0 - 2, cloudX, 128, 9);
      ctx.restore();

      /* 바다 */
      ctx.fillStyle = v("--card-2"); ctx.fillRect(bx0, by0, bx1 - bx0, by1 - by0);
      ctx.strokeStyle = v("--line"); ctx.lineWidth = 2; ctx.strokeRect(bx0, by0, bx1 - bx0, by1 - by0);
      text(ctx, "서태평양 (인도네시아)", bx0 + 4, by0 - 10, { s: 11.5, w: "800", c: v("--mist") });
      text(ctx, "동태평양 (페루)", bx1 - 4, by0 - 10, { s: 11.5, a: "right", w: "800", c: v("--mist") });

      var yW = clamp(240 + 52 * k, 170, 322), yE = clamp(240 - 52 * k, 166, 322);
      ctx.save();
      ctx.beginPath(); ctx.moveTo(bx0, by0); ctx.lineTo(bx1, by0); ctx.lineTo(bx1, yE); ctx.lineTo(bx0, yW); ctx.closePath();
      ctx.fillStyle = v("--coral"); ctx.globalAlpha = 0.3; ctx.fill(); ctx.restore();
      ctx.strokeStyle = v("--teal"); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(bx0, yW); ctx.lineTo(bx1, yE); ctx.stroke();
      text(ctx, "수온약층", bx0 + 14, yW - 10, { s: 11.5, w: "800", c: v("--teal-700") });
      text(ctx, "따뜻한 표층수", (bx0 + bx1) / 2, by0 + 24, { s: 12, a: "center", w: "800", c: v("--coral-700") });

      /* 적도 용승 (동쪽) */
      ctx.save();
      ctx.strokeStyle = v("--cold"); ctx.fillStyle = v("--cold"); ctx.lineWidth = 2 + 3 * k;
      window.drawArrow(ctx, bx1 - 40, by1 - 12, bx1 - 40, yE + 16, 10);
      ctx.restore();
      if (k >= 0.6) text(ctx, "적도 용승", bx1 - 40, by1 + 20, { s: 11.5, a: "center", w: "800", c: v("--cold") });

      /* 물방울 애니메이션 */
      ctx.save(); ctx.fillStyle = v("--violet"); ctx.globalAlpha = 0.7;
      for (var d = 0; d < 5; d++) {
        var pp = ((t * 0.05) + d / 5) % 1;
        ctx.beginPath(); ctx.arc(cloudX - 30 + d * 16, 136 + pp * 12, 3, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();

      /* 계기판 */
      text(ctx, "서태평양 표층 수온 " + sstW().toFixed(1) + " ℃", 100, 376, { s: 13, w: "800", c: v("--coral-700") });
      text(ctx, "동태평양 표층 수온 " + sstE().toFixed(1) + " ℃", 430, 376, { s: 13, w: "800", c: v("--cold") });
      text(ctx, "동태평양 수온 편차", 100, 410, { s: 11.5, w: "800", c: v("--mist") });
      text(ctx, (a >= 0 ? "+" : "") + a.toFixed(2) + " ℃", 100, 442, { s: 24, w: "900", c: a >= 0.5 ? v("--coral-700") : (a <= -0.5 ? v("--cold") : v("--ink")) });
      text(ctx, "남방 진동 지수", 330, 410, { s: 11.5, w: "800", c: v("--mist") });
      text(ctx, (soi() >= 0 ? "+" : "") + soi().toFixed(2), 330, 442, { s: 24, w: "900", c: v("--violet-700") });
      text(ctx, "페루 어획 지수", 540, 410, { s: 11.5, w: "800", c: v("--mist") });
      text(ctx, Math.round(fish()) + " %", 540, 442, { s: 24, w: "900", c: fish() >= 100 ? v("--teal-700") : v("--rose-700") });
      text(ctx, "판정", 730, 410, { s: 11.5, w: "800", c: v("--mist") });
      text(ctx, ph, 730, 442, { s: 24, w: "900", c: ph === "엘니뇨" ? v("--coral-700") : (ph === "라니냐" ? v("--cold") : v("--mist")) });
      text(ctx, "남방 진동 지수는 동태평양(타히티)과 서태평양(다윈)의 기압 차입니다. 음수면 엘니뇨, 양수면 라니냐 쪽입니다.", 100, 472, { s: 11, c: v("--mist") });
      text(ctx, "수온 편차 +0.5 ℃ 이상 → 엘니뇨,  −0.5 ℃ 이하 → 라니냐", 100, 492, { s: 11, c: v("--mist") });

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
    anim(canvas, function () { t += 1; draw(); });
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
      paper(ctx, W, H);
      text(ctx, "열대 태평양의 수온 편차가 세계 각지에 남기는 자국 (원격 영향)", 60, 30, { s: 14, w: "900" });

      var cx = 470, half = 190, y0 = 78;
      /* 축 */
      ctx.strokeStyle = v("--line"); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(cx, y0 - 14); ctx.lineTo(cx, y0 + 5 * 44 + 6); ctx.stroke();
      [-100, -50, 0, 50, 100].forEach(function (p) {
        var x = cx + p / 100 * half;
        ctx.strokeStyle = v("--line"); ctx.globalAlpha = 0.45;
        ctx.beginPath(); ctx.moveTo(x, y0 - 10); ctx.lineTo(x, y0 + 5 * 44 + 2); ctx.stroke(); ctx.globalAlpha = 1;
        text(ctx, (p > 0 ? "+" : "") + p + "%", x, y0 - 18, { s: 10.5, a: "center", c: v("--mist") });
      });
      text(ctx, "평년 대비 강수량", cx, y0 - 38, { s: 12, a: "center", w: "800", c: v("--mist") });

      REG.forEach(function (r, i) {
        var yy = y0 + i * 44 + 10, val = rain(i);
        text(ctx, r.n, 60, yy + 14, { s: 12, w: "800", c: v("--ink") });
        var wpx = Math.abs(val) / 100 * half;
        bar(ctx, val >= 0 ? cx : cx - wpx, yy, Math.max(wpx, 1.5), 22, val >= 0 ? "--brand" : "--coral", 0.85);
        text(ctx, (val > 0 ? "+" : "") + Math.round(val) + " %", 676, yy + 17, { s: 13, w: "900", c: val > 0 ? v("--brand-700") : (val < 0 ? v("--coral-700") : v("--mist")) });
        text(ctx, val <= -40 ? "가뭄" : (val >= 40 ? "홍수" : ""), 754, yy + 17, { s: 12.5, w: "800", c: val <= -40 ? v("--rose-700") : v("--brand-700") });
      });

      var ph = a >= 0.5 ? "엘니뇨" : (a <= -0.5 ? "라니냐" : "평상시");
      text(ctx, "수온 편차 " + (a >= 0 ? "+" : "") + a.toFixed(1) + " ℃ · " + ph, 60, 346, { s: 16, w: "900", c: a >= 0.5 ? v("--coral-700") : (a <= -0.5 ? v("--cold") : v("--mist")) });
      text(ctx, "페루 어획 지수 " + Math.round(fish()) + " %", 400, 346, { s: 16, w: "900", c: fish() >= 120 ? v("--teal-700") : (fish() <= 60 ? v("--rose-700") : v("--ink")) });
      text(ctx, "비구름이 서는 자리가 옮겨 가면, 원래 비를 받던 곳은 가뭄이 들고 건조하던 곳에는 홍수가 납니다.", 60, 386, { s: 12, c: v("--mist") });
      text(ctx, "같은 해에 지구 반대편의 두 나라가 정반대 재해를 겪는 까닭이 여기에 있습니다.", 60, 412, { s: 12, c: v("--mist") });

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

    function earth(cx, cy, r, label, col) {
      ctx.save();
      ctx.fillStyle = v(col); ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
      var rad = tilt * Math.PI / 180, L = r + 12;
      ctx.strokeStyle = v("--ink"); ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - Math.sin(rad) * L, cy - Math.cos(rad) * L);
      ctx.lineTo(cx + Math.sin(rad) * L, cy + Math.cos(rad) * L);
      ctx.stroke();
      ctx.restore();
      text(ctx, label, cx, cy + r + 30, { s: 11, a: "center", w: "800", c: v("--mist") });
    }

    function draw() {
      paper(ctx, W, H);
      var q = Q();
      text(ctx, "지구 운동의 세 가지 변화와 북위 65° 여름 일사량", 60, 30, { s: 14, w: "900" });

      /* 궤도 */
      var cx = 260, cy = 212, A = 168, eVis = clamp(ecc * 6, 0, 0.36);
      var B = A * Math.sqrt(1 - eVis * eVis), c0 = A * eVis;
      ctx.strokeStyle = v("--line"); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(cx, cy, A, B, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = v("--amber");
      ctx.beginPath(); ctx.arc(cx + c0, cy, 13, 0, Math.PI * 2); ctx.fill();
      text(ctx, "태양", cx + c0, cy + 30, { s: 11, a: "center", w: "800", c: v("--amber-700") });

      earth(cx + A, cy, 11, "근일점 · 북반구 " + seasonName(prec), "--brand");
      earth(cx - A, cy, 11, "원일점 · 북반구 " + seasonName(prec + 180), "--violet");
      text(ctx, "자전축 기울기 " + tilt.toFixed(1) + "°", cx, 88, { s: 12.5, a: "center", w: "900", c: v("--ink") });
      text(ctx, "이심률은 보기 쉽게 과장해 그렸습니다", cx, 350, { s: 10.5, a: "center", c: v("--mist") });

      /* 오른쪽 계기판 */
      var px = 500;
      text(ctx, "북위 65° 여름 일사량", px, 96, { s: 12.5, w: "800", c: v("--mist") });
      text(ctx, q.toFixed(0) + " W/m²", px, 140, { s: 30, w: "900", c: q <= 440 ? v("--cold") : (q >= 520 ? v("--coral-700") : v("--ink")) });
      var gx0 = px, gx1 = 862, lo = 380, hi = 580;
      function GX(val) { return gx0 + clamp((val - lo) / (hi - lo), 0, 1) * (gx1 - gx0); }
      ctx.strokeStyle = v("--line"); ctx.lineWidth = 1.5; ctx.strokeRect(gx0, 164, gx1 - gx0, 20);
      bar(ctx, gx0, 164, GX(q) - gx0, 20, q <= 440 ? "--cold" : (q >= 520 ? "--coral" : "--brand"), 0.85);
      [[440, "빙하기 쪽"], [520, "간빙기 쪽"]].forEach(function (m) {
        ctx.strokeStyle = v("--amber"); ctx.lineWidth = 2.5; ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.moveTo(GX(m[0]), 158); ctx.lineTo(GX(m[0]), 190); ctx.stroke(); ctx.setLineDash([]);
        text(ctx, m[1] + " " + m[0], clamp(GX(m[0]), gx0 + 40, gx1 - 40), 206, { s: 10.5, a: "center", w: "800", c: v("--amber-700") });
      });
      text(ctx, q <= 440 ? "여름이 시원해 눈이 다 녹지 못합니다 → 빙상이 자랍니다" :
        (q >= 520 ? "여름이 뜨거워 눈이 모두 녹습니다 → 빙상이 물러납니다" : "지금 지구와 비슷한 수준입니다"),
        px, 240, { s: 13, w: "900", c: q <= 440 ? v("--cold") : (q >= 520 ? v("--coral-700") : v("--mist")) });
      text(ctx, "기울기가 커질수록 여름 일사량이 늘고", px, 274, { s: 11.5, c: v("--mist") });
      text(ctx, "계절 차이(연교차)도 커집니다", px, 294, { s: 11.5, c: v("--mist") });
      text(ctx, "근일점에 여름이 오면 여름이 더 뜨겁고,", px, 320, { s: 11.5, c: v("--mist") });
      text(ctx, "이심률이 클수록 그 차이가 커집니다", px, 340, { s: 11.5, c: v("--mist") });

      text(ctx, "자전축 기울기 약 4.1만 년 · 세차 운동 약 2.6만 년 · 이심률 약 10만 년 주기로 변합니다.", 60, 386, { s: 12, c: v("--mist") });
      text(ctx, "이 세 주기가 겹쳐 북반구 고위도의 여름 일사량을 바꾸고, 수만 년 규모의 빙하기·간빙기를 만든다는 것이 밀란코비치 이론입니다.", 60, 412, { s: 12, c: v("--mist") });
      text(ctx, "이심률이 0이면 궤도가 완전한 원이라, 근일점·원일점의 구별 자체가 사라집니다.", 60, 438, { s: 11, c: v("--mist") });

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
      paper(ctx, W, H);
      var fa = fAero(), fs = fSun(), ft = fTot(), dT = LAM * ft;
      text(ctx, "복사 강제력 — 기후를 밀고 당기는 힘 (양수는 데우고, 음수는 식힌다)", 60, 30, { s: 14, w: "900" });

      var base = 200, SC = 34, x0 = 90, x1 = 566;
      ctx.strokeStyle = v("--line"); ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.moveTo(x0, base); ctx.lineTo(x1, base); ctx.stroke();
      for (var g = -3; g <= 1; g++) {
        var yy = base - g * SC;
        ctx.strokeStyle = v("--line"); ctx.globalAlpha = 0.35;
        ctx.beginPath(); ctx.moveTo(x0, yy); ctx.lineTo(x1, yy); ctx.stroke(); ctx.globalAlpha = 1;
        text(ctx, (g > 0 ? "+" : "") + g, x0 - 8, yy + 4, { s: 10.5, a: "right", c: v("--mist") });
      }
      text(ctx, "W/m²", x0 - 8, base - 3 * SC - 14, { s: 10.5, a: "right", c: v("--mist") });

      var items = [
        { n: type === "sulf" ? "황산염 에어로졸" : "검댕(블랙 카본)", val: fa, c: fa >= 0 ? "--coral" : "--cold" },
        { n: "태양 활동", val: fs, c: fs >= 0 ? "--coral" : "--cold" },
        { n: "합계", val: ft, c: ft >= 0 ? "--coral" : "--cold" }
      ];
      items.forEach(function (it, i) {
        var bx = x0 + 44 + i * 150, hpx = it.val * SC;
        bar(ctx, bx, hpx >= 0 ? base - hpx : base, 76, Math.max(Math.abs(hpx), 2), it.c, i === 2 ? 1 : 0.8);
        text(ctx, it.n, bx + 38, 326, { s: 11.5, a: "center", w: "800", c: v("--mist") });
        text(ctx, (it.val > 0 ? "+" : "") + it.val.toFixed(2), bx + 38, it.val >= 0 ? base - hpx - 8 : base + Math.abs(hpx) + 18,
          { s: 13, a: "center", w: "900", c: v(it.c === "--coral" ? "--coral-700" : "--cold") });
      });

      var px = 620;
      text(ctx, "복사 강제력 합계", px, 96, { s: 12, w: "800", c: v("--mist") });
      text(ctx, (ft > 0 ? "+" : "") + ft.toFixed(2) + " W/m²", px, 132, { s: 24, w: "900", c: ft >= 0 ? v("--coral-700") : v("--cold") });
      text(ctx, "기온 변화 (평형)", px, 180, { s: 12, w: "800", c: v("--mist") });
      text(ctx, (dT > 0 ? "+" : "") + dT.toFixed(2) + " ℃", px, 216, { s: 28, w: "900", c: dT >= 0 ? v("--coral-700") : v("--cold") });
      text(ctx, "기온 변화 = 강제력 × 0.5", px, 246, { s: 11, c: v("--mist") });
      text(ctx, type === "sulf" ? "황산염 : 햇빛을 되쏜다" : "검댕 : 햇빛을 흡수한다", px, 282, { s: 12.5, w: "800", c: type === "sulf" ? v("--cold") : v("--coral-700") });
      text(ctx, "태양 활동만으로는", px, 314, { s: 11.5, c: v("--mist") });
      text(ctx, (LAM * fSun()).toFixed(2) + " ℃ 뿐입니다", px, 334, { s: 11.5, w: "800", c: v("--mist") });

      text(ctx, "큰 화산 분출은 성층권에 황산염 에어로졸을 뿌려 1~2년 동안 지구를 식힙니다. 피나투보(1991)가 그랬습니다.", 60, 358, { s: 11.5, c: v("--mist") });
      text(ctx, "그러나 화석 연료가 덜 탄 채 나오는 검댕은 빛을 흡수해 주변 공기를 데웁니다. 같은 에어로졸인데 부호가 반대입니다.", 60, 382, { s: 11.5, c: v("--mist") });
      text(ctx, "태양 상수의 변화 " + (dS >= 0 ? "+" : "") + dS.toFixed(1) + " W/m² · 에어로졸 양 " + amt, 60, 410, { s: 12.5, w: "900" });

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

    var GX0 = 90, GX1 = 700, GY0 = 70, GY1 = 320;
    function X(y) { return GX0 + (y - Y0) / (Y1 - Y0) * (GX1 - GX0); }
    function Y(c) { return GY1 - (c + 0.4) / 1.9 * (GY1 - GY0); }

    function curve(fn, col, wide, shift) {
      ctx.strokeStyle = v(col); ctx.lineWidth = wide; ctx.beginPath();
      for (var y = Y0; y <= Y1; y++) {
        var x = X(y), yy = Y(fn(y) - shift);
        if (y === Y0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }

    function draw() {
      paper(ctx, W, H);
      text(ctx, "1900~2020년 지구 평균 기온 — 관측과 모형", 60, 30, { s: 14, w: "900" });
      axes(ctx, GX0, GY0, GX1, GY1);
      for (var y = 1900; y <= 2020; y += 20) {
        ctx.strokeStyle = v("--line"); ctx.globalAlpha = 0.35;
        ctx.beginPath(); ctx.moveTo(X(y), GY0); ctx.lineTo(X(y), GY1); ctx.stroke(); ctx.globalAlpha = 1;
        text(ctx, String(y), X(y), GY1 + 18, { s: 10.5, a: "center", c: v("--mist") });
      }
      for (var c = -0.4; c <= 1.5; c += 0.5) {
        text(ctx, (c > 0 ? "+" : "") + c.toFixed(1), GX0 - 8, Y(c) + 4, { s: 10.5, a: "right", c: v("--mist") });
      }
      text(ctx, "기온 편차(℃)", GX0 - 8, GY0 - 12, { s: 11, a: "right", c: v("--mist") });

      /* 화산 표시 */
      VOLC.forEach(function (o) {
        ctx.strokeStyle = v("--violet"); ctx.globalAlpha = 0.45; ctx.lineWidth = 1.5; ctx.setLineDash([3, 4]);
        ctx.beginPath(); ctx.moveTo(X(o[0]), GY0); ctx.lineTo(X(o[0]), GY1); ctx.stroke();
        ctx.setLineDash([]); ctx.globalAlpha = 1;
        text(ctx, "🌋", X(o[0]), GY0 - 6, { s: 11, a: "center" });
      });

      var sm = 0, i;
      for (i = 0; i < 30; i++) sm += model(Y0 + i);
      sm /= 30;
      curve(obs, "--ink", 3, BO);
      if (anyOn()) curve(model, "--brand", 2.8, sm);

      /* 계기판 */
      var px = 726, pct = anyOn() ? fitPct() : 0;
      text(ctx, "맞춤도", px, 98, { s: 12, w: "800", c: v("--mist") });
      text(ctx, anyOn() ? pct.toFixed(1) + " %" : "—", px, 138, { s: 30, w: "900", c: pct >= 90 ? v("--teal-700") : (pct <= 40 ? v("--rose-700") : v("--ink")) });
      text(ctx, anyOn() ? (pct >= 90 ? "관측과 거의 같다" : (pct <= 40 ? "전혀 맞지 않는다" : "아직 어긋난다")) : "요인을 켜 보세요",
        px, 172, { s: 12.5, w: "800", c: pct >= 90 ? v("--teal-700") : v("--mist") });
      text(ctx, "켠 요인", px, 214, { s: 11.5, w: "800", c: v("--mist") });
      text(ctx, on.nat ? "· 자연 (태양·화산)" : "· ─", px, 236, { s: 11.5, c: on.nat ? v("--violet-700") : v("--mist") });
      text(ctx, on.ghg ? "· 온실 기체" : "· ─", px, 256, { s: 11.5, c: on.ghg ? v("--coral-700") : v("--mist") });
      text(ctx, on.aer ? "· 인위 에어로졸" : "· ─", px, 276, { s: 11.5, c: on.aer ? v("--cold") : v("--mist") });
      text(ctx, "CO₂ " + co2(2020).toFixed(0) + " ppm", px, 310, { s: 12, w: "800", c: v("--mist") });

      text(ctx, "■ 검은 굵은 선 = 관측 기온 · ■ 파란 선 = 내가 켠 요인으로 그린 모형", 90, 366, { s: 12, w: "800", c: v("--mist") });
      text(ctx, "🌋 표시는 큰 화산 분출이 있었던 해입니다 (1902 산타마리아 · 1912 카트마이 · 1963 아궁 · 1982 엘치촌 · 1991 피나투보).", 90, 392, { s: 11.5, c: v("--mist") });
      text(ctx, "자연 요인은 기온을 위아래로 흔들지만, 한 방향으로 계속 밀어 올리지는 못합니다.", 90, 418, { s: 11.5, c: v("--mist") });
      text(ctx, "1950~1975년의 정체는 인위적 에어로졸이 온실 기체의 가열을 일부 가린 탓으로 봅니다.", 90, 444, { s: 11.5, c: v("--mist") });

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

    function draw() {
      paper(ctx, W, H);
      var T = Ts();
      text(ctx, "복사 평형과 온실 효과 — 대기를 담요 한 장으로 본 모형", 60, 30, { s: 14, w: "900" });

      var gx0 = 60, gx1 = 640, groundY = 330, airY = 150;
      /* 지표 */
      ctx.fillStyle = v("--card-2"); ctx.fillRect(gx0, groundY, gx1 - gx0, 46);
      ctx.strokeStyle = v("--line"); ctx.lineWidth = 2; ctx.strokeRect(gx0, 62, gx1 - gx0, 314);
      text(ctx, "지표", gx0 + 10, groundY + 30, { s: 11.5, w: "800", c: v("--mist") });
      /* 대기층 */
      ctx.save(); ctx.fillStyle = v("--teal"); ctx.globalAlpha = 0.12 + 0.35 * eps;
      ctx.fillRect(gx0, airY, gx1 - gx0, 26); ctx.restore();
      ctx.strokeStyle = v("--teal"); ctx.lineWidth = 1.5; ctx.strokeRect(gx0, airY, gx1 - gx0, 26);
      text(ctx, "대기 (적외선 흡수율 " + eps.toFixed(2) + ")", gx0 + 10, airY + 17, { s: 11.5, w: "800", c: v("--teal-700") });

      /* 태양 복사 */
      ctx.save(); ctx.strokeStyle = v("--amber"); ctx.fillStyle = v("--amber"); ctx.lineWidth = 3;
      for (var i = 0; i < 3; i++) window.drawArrow(ctx, 120 + i * 40, 80, 120 + i * 40, groundY - 8, 9);
      ctx.restore();
      text(ctx, "태양 복사", 160, 76, { s: 11.5, a: "center", w: "800", c: v("--amber-700") });
      /* 반사 */
      var nref = Math.max(1, Math.round(alb * 10));
      ctx.save(); ctx.strokeStyle = v("--mist"); ctx.fillStyle = v("--mist"); ctx.lineWidth = 2.5;
      for (var r = 0; r < nref; r++) window.drawArrow(ctx, 260 + r * 14, groundY - 8, 260 + r * 14, 80, 8);
      ctx.restore();
      text(ctx, "반사 " + (alb * 100).toFixed(0) + "%", 260 + nref * 7, 76, { s: 11.5, a: "center", w: "800", c: v("--mist") });

      /* 지구 복사 */
      ctx.save(); ctx.strokeStyle = v("--coral"); ctx.fillStyle = v("--coral"); ctx.lineWidth = 3;
      for (var j = 0; j < 4; j++) {
        var xx = 420 + j * 34;
        var blocked = (j + 0.5) / 4 <= eps;
        window.drawArrow(ctx, xx, groundY - 8, xx, blocked ? airY + 32 : 80, 9);
      }
      ctx.restore();
      text(ctx, "지구 복사(적외선)", 480, groundY + 30, { s: 11.5, a: "center", w: "800", c: v("--coral-700") });
      /* 재복사 */
      ctx.save(); ctx.strokeStyle = v("--violet"); ctx.fillStyle = v("--violet"); ctx.lineWidth = 3;
      var nre = Math.round(eps * 4);
      for (var m = 0; m < nre; m++) window.drawArrow(ctx, 560 + m * 18, airY + 32, 560 + m * 18, groundY - 8, 9);
      ctx.restore();
      if (nre > 0) text(ctx, "재복사", 560 + nre * 9 - 9, airY + 22, { s: 11.5, a: "center", w: "800", c: v("--violet-700") });

      /* 계기판 */
      var px = 664;
      text(ctx, "지표 온도", px, 100, { s: 12.5, w: "800", c: v("--mist") });
      text(ctx, T.toFixed(1) + " ℃", px, 142, { s: 32, w: "900", c: T >= 20 ? v("--coral-700") : (T <= 5 ? v("--cold") : v("--ink")) });
      text(ctx, "대기가 없다면", px, 190, { s: 12, w: "800", c: v("--mist") });
      text(ctx, Tno().toFixed(1) + " ℃", px, 222, { s: 20, w: "900", c: v("--cold") });
      text(ctx, "온실 효과의 크기", px, 262, { s: 12, w: "800", c: v("--mist") });
      text(ctx, "+" + green().toFixed(1) + " ℃", px, 294, { s: 20, w: "900", c: green() >= 40 ? v("--coral-700") : (green() < 2 ? v("--cold") : v("--teal-700")) });
      text(ctx, "흡수한 태양 복사", px, 334, { s: 11.5, w: "800", c: v("--mist") });
      text(ctx, absorbed().toFixed(0) + " W/m²", px, 358, { s: 16, w: "900", c: absorbed() < 200 ? v("--cold") : v("--amber-700") });

      text(ctx, "태양 상수 1361 W/m² · 슈테판–볼츠만 법칙으로 계산", 60, 400, { s: 11.5, c: v("--mist") });
      text(ctx, "대기가 적외선을 붙잡을수록 지표는 더 뜨거운 상태에서 균형을 이룹니다. 이것이 온실 효과입니다.", 60, 424, { s: 12, c: v("--mist") });

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
      paper(ctx, W, H);
      var C = cum(), T = T2100();
      text(ctx, "2025~2100년 이산화 탄소 배출 경로와 2100년 기온", 60, 30, { s: 14, w: "900" });
      axes(ctx, GX0, GY0, GX1, GY1);
      for (var y = 2025; y <= 2100; y += 25) {
        ctx.strokeStyle = v("--line"); ctx.globalAlpha = 0.35;
        ctx.beginPath(); ctx.moveTo(X(y), GY0); ctx.lineTo(X(y), GY1); ctx.stroke(); ctx.globalAlpha = 1;
        text(ctx, String(y), X(y), GY1 + 18, { s: 10.5, a: "center", c: v("--mist") });
      }
      for (var e = 0; e <= 40; e += 10) text(ctx, (e * 10) + "", GX0 - 8, Y(e) + 4, { s: 10.5, a: "right", c: v("--mist") });
      text(ctx, "연간 배출량 (억 t CO₂ / 년)", GX0 - 26, GY0 - 16, { s: 11, c: v("--mist") });
      ctx.strokeStyle = v("--line"); ctx.lineWidth = 1.2; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(GX0, Y(0)); ctx.lineTo(GX1, Y(0)); ctx.stroke(); ctx.setLineDash([]);
      text(ctx, "0 — 탄소 중립", GX1 - 6, Y(0) - 8, { s: 10.5, a: "right", w: "800", c: v("--mist") });

      /* 누적 면적 */
      ctx.save(); ctx.fillStyle = v("--coral"); ctx.globalAlpha = 0.25;
      ctx.beginPath(); ctx.moveTo(X(Y0), Y(0));
      for (var y2 = Y0; y2 <= Y1; y2++) ctx.lineTo(X(y2), Y(emit(y2)));
      ctx.lineTo(X(Y1), Y(0)); ctx.closePath(); ctx.fill(); ctx.restore();
      ctx.strokeStyle = v("--coral"); ctx.lineWidth = 3; ctx.beginPath();
      for (var y3 = Y0; y3 <= Y1; y3++) { var xx = X(y3), yy = Y(emit(y3)); if (y3 === Y0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy); }
      ctx.stroke();
      text(ctx, "색칠한 넓이 = 누적 배출량", X(2055), Y(14), { s: 12, a: "center", w: "800", c: v("--coral-700") });

      /* 계기판 */
      var px = 668;
      text(ctx, "2025~2100 누적 배출", px, 96, { s: 12, w: "800", c: v("--mist") });
      text(ctx, Math.round(C * 10).toLocaleString() + " 억 t", px, 132, { s: 20, w: "900", c: v("--coral-700") });
      text(ctx, "2100년 기온 상승", px, 192, { s: 12, w: "800", c: v("--mist") });
      text(ctx, "+" + T.toFixed(2) + " ℃", px, 232, { s: 32, w: "900", c: T < 1.5 ? v("--teal-700") : (T < 2.0 ? v("--brand-700") : v("--rose-700")) });
      text(ctx, T < 1.5 ? "✅ 1.5 ℃ 목표 안" : (T < 2.0 ? "2 ℃ 아래 — 1.5 는 아직" : "목표를 넘었습니다"),
        px, 264, { s: 13, w: "900", c: T < 1.5 ? v("--teal-700") : (T < 2.0 ? v("--brand-700") : v("--rose-700")) });
      text(ctx, "지금까지 +" + NOW.toFixed(1) + " ℃", px, 300, { s: 11.5, c: v("--mist") });
      text(ctx, "누적 1조 t 마다 +0.45 ℃", px, 320, { s: 11.5, c: v("--mist") });

      text(ctx, "해마다 줄일 비율 " + rate.toFixed(2) + " %" + (ccs ? " · 2040년부터 해마다 50억 t 포집" : ""), 90, 334, { s: 13, w: "900" });
      text(ctx, "기온 상승은 ‘올해 얼마나 배출했는가’보다 ‘지금까지 모두 합쳐 얼마나 배출했는가’에 거의 비례합니다.", 90, 370, { s: 12, c: v("--mist") });
      text(ctx, "그래서 목표 온도는 곧 ‘앞으로 더 배출해도 되는 양’, 탄소 예산으로 번역됩니다.", 90, 396, { s: 12, c: v("--mist") });
      text(ctx, "포집·저장 기술을 넣으면 같은 감축률로도 더 낮출 수 있지만, 기술만으로 감축을 대신할 수는 없습니다.", 90, 422, { s: 11.5, c: v("--mist") });

      var ch = false;
      if (T < 2.0 && !got.a) { got.a = ch = true; }
      if (T < 1.5 && !got.b) { got.b = ch = true; }
      if (rate <= 0 && !got.c) { got.c = ch = true; }
      if (ch) { window.sthState("cPath", got); mission(); }

      $("c-path-info").innerHTML = "누적 배출 <b>" + Math.round(C * 10).toLocaleString() + "억 t</b> → 2100년 <b>+" + T.toFixed(2) + " ℃</b>. " +
        (rate <= 0 ? "감축을 전혀 하지 않으면 해마다 400억 t 이 그대로 쌓입니다. 2100년에는 <b>2.5 ℃를 훌쩍 넘습니다.</b>" :
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
      paper(ctx, W, H);
      var rs = riseCm(), nd = needCm();
      text(ctx, "2100년 해수면 상승과 연안 도시의 적응", 60, 30, { s: 14, w: "900" });

      var gx0 = 60, gx1 = 860, seaBase = 286, wallX = 470;
      ctx.strokeStyle = v("--line"); ctx.lineWidth = 2; ctx.strokeRect(gx0, 66, gx1 - gx0, 300);
      /* 육지 (지반이 지금의 해수면 높이인 매립지) */
      ctx.fillStyle = v("--card-2"); ctx.fillRect(wallX, seaBase, gx1 - wallX - 2, 366 - seaBase);

      /* 바다 */
      var seaTop = seaBase - rs * 0.8;
      ctx.save(); ctx.fillStyle = v("--brand"); ctx.globalAlpha = 0.35;
      ctx.fillRect(gx0 + 2, seaTop, wallX - gx0 - 2, 366 - seaTop); ctx.restore();
      ctx.strokeStyle = v("--brand"); ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (var q = 0; q <= 60; q++) {
        var xx = gx0 + 2 + q / 60 * (wallX - gx0 - 2);
        var yy = seaTop + Math.sin(q / 4 + t * 0.12) * 3;
        if (q === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
      }
      ctx.stroke();
      text(ctx, "2100년 해수면", gx0 + 14, seaTop - 12, { s: 12, w: "800", c: v("--brand-700") });
      /* 현재 해수면 기준선 */
      ctx.strokeStyle = v("--mist"); ctx.setLineDash([5, 5]); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(gx0 + 2, seaBase); ctx.lineTo(gx1 - 4, seaBase); ctx.stroke(); ctx.setLineDash([]);
      text(ctx, "지금의 해수면", gx0 + 14, seaBase + 20, { s: 11, c: v("--mist") });

      /* 폭풍 해일 선 */
      var surgeY = seaTop - SURGE * 0.8;
      ctx.strokeStyle = v("--rose"); ctx.setLineDash([7, 4]); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(gx0 + 2, surgeY); ctx.lineTo(gx1 - 4, surgeY); ctx.stroke(); ctx.setLineDash([]);
      text(ctx, "폭풍 해일이 닿는 높이 (해수면 + 60 cm)", gx1 - 10, surgeY - 8, { s: 11.5, a: "right", w: "800", c: v("--rose-700") });

      /* 침수 표현 */
      if (wall < nd) {
        ctx.save(); ctx.fillStyle = v("--brand"); ctx.globalAlpha = 0.3;
        ctx.fillRect(wallX + 8, surgeY, 250, seaBase - surgeY + 16); ctx.restore();
        text(ctx, "도시 침수", wallX + 133, surgeY - 12, { s: 15, a: "center", w: "900", c: v("--rose-700") });
      }

      /* 방조제 */
      var wallH = wall * 0.8;
      if (wallH > 1) {
        ctx.fillStyle = v(okWall() ? "--teal" : (wall < nd ? "--rose" : "--amber"));
        ctx.fillRect(wallX - 16, seaBase - wallH, 22, wallH + 8);
      }
      text(ctx, "방조제 " + wall + " cm", wallX + 16, seaBase - Math.max(wallH, 10) - 10, { s: 12, w: "900", c: v(okWall() ? "--teal-700" : (wall < nd ? "--rose-700" : "--amber-700")) });
      text(ctx, "연안 도시 — 지반이 지금의 해수면 높이인 매립지", wallX + 16, 356, { s: 11.5, w: "800", c: v("--mist") });

      /* 계기판 */
      text(ctx, "바닷물은 데워지면 부피가 늘고(열팽창), 육지의 빙하가 녹아 물이 더해집니다.", 60, 392, { s: 11.5, c: v("--mist") });
      text(ctx, "2100년 기온 상승 +" + dT.toFixed(1) + " ℃", 60, 420, { s: 14, w: "900" });
      text(ctx, "해수면 상승 " + rs.toFixed(0) + " cm", 330, 420, { s: 14, w: "900", c: rs >= 70 ? v("--rose-700") : (rs < 35 ? v("--teal-700") : v("--ink")) });
      text(ctx, "필요한 방조제 " + nd.toFixed(0) + " cm 이상", 570, 420, { s: 14, w: "900", c: v("--brand-700") });
      text(ctx, okWall() ? "✅ 꼭 맞게 세웠습니다" : (wall < nd ? "❌ 너무 낮습니다 — 폭풍 해일에 잠깁니다" : "⚠ 필요한 높이보다 40 cm 넘게 높습니다 — 예산 낭비"),
        60, 444, { s: 13, w: "900", c: okWall() ? v("--teal-700") : (wall < nd ? v("--rose-700") : v("--amber-700")) });

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
    anim(canvas, function () { t += 1; draw(); });
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
    { key: "r3", label: "③ 탄소를 줄이는 회의" }
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
    { key: "r3", label: "③ 탄소를 줄이는 회의" }
  ],
  line: { id: "all", label: "세 사건을 꿰는 한 문장" }
});

})();
