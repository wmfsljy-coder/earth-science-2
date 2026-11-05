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
/* ---- 밝은 스튜디오 + 블록 모형 도구 (_tools/STUDIO_GUIDE.md) ---- */
var LT = K.LT;
/* 밝은 바탕 위 글자 */
function lt(ctx, s, x, y, o) { o = o || {}; K.t(ctx, s, x, y, { s: o.s || 12, w: o.w || "700", a: o.a, c: o.c || LT.mute }); }
/* 썸네일처럼 굵은 제목 + 노란 부제 */
function bigHead(ctx, s, sub, col, x, y) {
  x = x == null ? 18 : x; y = y == null ? 46 : y;
  K.bigText(ctx, s, x, y, 28, col || "#ffffff");
  if (sub) K.bigText(ctx, sub, x, y + 28, 16, "#ffd35a");
}
function hx(h) { var n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function mix(a, b, t, f) {
  var p = hx(a), q = hx(b), o = [], i; f = f || 1; t = clamp(t, 0, 1);
  for (i = 0; i < 3; i++) o.push(clamp(Math.round((p[i] + (q[i] - p[i]) * t) * f), 0, 255));
  return "rgb(" + o.join(",") + ")";
}
/* 바닷물 수온 색(℃): 찬물 짙은 파랑 → 따뜻한 물 주황 */
var TCOL = [[-2, "#173a7a"], [3, "#1f52a0"], [8, "#2a7cc0"], [13, "#3fa7c9"], [18, "#8fd0a8"], [22, "#e9d36e"], [26, "#f59a45"], [30, "#e2442f"]];
function tCol(t, f) {
  t = clamp(t, -2, 30);
  for (var i = 1; i < TCOL.length; i++) if (t <= TCOL[i][0]) break;
  i = Math.min(i, TCOL.length - 1);
  return mix(TCOL[i - 1][1], TCOL[i][1], (t - TCOL[i - 1][0]) / (TCOL[i][0] - TCOL[i - 1][0]), f);
}
/* 화면 두 점 사이 화살표(밝은 바탕용 굵은 화살표) */
function arr(ctx, a, b, col, w, head) { K.arrow(ctx, a, b, col, w || 3, head || 11); }
/* 블록 위 작은 배 */
function boat(ctx, I, x, y, z, sc, hull) {
  sc = sc || 1;
  I.box(ctx, x - 12 * sc, y - 4 * sc, z, x + 12 * sc, y + 4 * sc, z + 5 * sc, "#f3efe6", hull || "#d9493a", "#a8352b");
  I.box(ctx, x - 2 * sc, y - 2.5 * sc, z + 5 * sc, x + 6 * sc, y + 2.5 * sc, z + 11 * sc, "#ffffff", "#e6e9ee", "#b9c0cc");
}
/* 숨은 캔버스: 조작할 때만 바뀌는 무거운 바탕을 한 번 그려 두고 쓴다 */
function cache(canvas, W, H) {
  var off = null, key = null;
  return function (ctx, k, paint) {
    if (!off || key !== k || off.width !== canvas.width) {
      if (!off) { off = document.createElement("canvas"); off.id = (canvas.id || "c") + "-off"; }
      off.width = canvas.width; off.height = canvas.height;
      var c2 = off.getContext("2d"), dpr = canvas.width / W;
      c2.setTransform(1, 0, 0, 1, 0, 0); c2.clearRect(0, 0, off.width, off.height);
      c2.setTransform(dpr, 0, 0, dpr, 0, 0); c2.clearRect(0, 0, W, H);
      paint(c2); key = k;
    }
    ctx.clearRect(0, 0, W, H); ctx.drawImage(off, 0, 0, W, H);
  };
}
/* 입체 구름 한 덩이(왼쪽 위에서 빛을 받는 공) */
function puff3(ctx, I, x, y, z, r, dark, a) {
  var p = I.P(x, y, z), rr = r * I.s * 1.3;
  var g = ctx.createRadialGradient(p.x - rr * .35, p.y - rr * .5, rr * .1, p.x, p.y, rr * 1.05);
  g.addColorStop(0, "#ffffff"); g.addColorStop(.6, dark ? "#b9c1cf" : "#e3e8f0"); g.addColorStop(1, dark ? "#5f6a80" : "#a3afc2");
  if (a != null) ctx.globalAlpha = a;
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, rr, 0, 6.2832); ctx.fill();
  ctx.globalAlpha = 1;
}
/* 밝은 나침반(위에서 본 모습) */
function lcompass(ctx, cx, cy, R, busy) {
  var cg = ctx.createRadialGradient(cx - R * .3, cy - R * .3, R * .1, cx, cy, R);
  cg.addColorStop(0, "#ffffff"); cg.addColorStop(1, "#dfe8f3");
  ctx.save(); ctx.shadowColor = "rgba(20,30,60,.2)"; ctx.shadowBlur = 12; ctx.shadowOffsetY = 4;
  ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  ctx.strokeStyle = LT.line; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = "rgba(20,40,90,.22)"; ctx.lineWidth = 1;
  for (var tk = 0; tk < 360; tk += 15) { var tr = tk * Math.PI / 180, r0 = tk % 45 ? R - 5 : R - 10; ctx.beginPath(); ctx.moveTo(cx + Math.sin(tr) * r0, cy - Math.cos(tr) * r0); ctx.lineTo(cx + Math.sin(tr) * R, cy - Math.cos(tr) * R); ctx.stroke(); }
  function free(az) {
    for (var i = 0; busy && i < busy.length; i++) { var d = ((busy[i] - az) % 360 + 360) % 360; if (d > 180) d = 360 - d; if (d < 32) return false; }
    return true;
  }
  var O = { s: 12, a: "center", w: "900", c: LT.ink };
  if (free(0)) K.t(ctx, "북", cx, cy - R - 8, O);
  if (free(180)) K.t(ctx, "남", cx, cy + R + 18, O);
  if (free(90)) K.t(ctx, "동", cx + R + 16, cy + 4, O);
  if (free(270)) K.t(ctx, "서", cx - R - 16, cy + 4, O);
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
    /* ── 아이소메트릭 블록 모형: x = 먼바다(왼쪽 뒤) → 페루 해안·육지(오른쪽 앞), y = 해안을 따라(뒤 = 북), 앞면 = 해안에 수직인 단면 ── */
    var DH = 440, ZS = 130;                                  /* 모형 칸 높이, 해수면 높이(그림 단위) */
    var I = K.iso({ ox: 400, oy: 112, s: 0.7, L: 700, D: 200 }), L = I.L, D = I.D;
    function xc(y) { return 540 + 12 * Math.sin(y / 32 + 0.6); }          /* 해안선 */
    function ground(x, y) {
      var d = xc(y) - x;
      if (d > 0) { var q = clamp(1 - d / 240, 0, 1); return 8 + 114 * Math.pow(q, 4) + 2 * Math.sin(x / 40) * Math.cos(y / 30); }
      var e = -d;
      return ZS + 2 + Math.min(e, 8) * 0.6 + Math.max(0, e - 8) * 0.13 + 6 * Math.max(0, e - 60) / 100 * (1 + Math.sin(y / 25 + x / 40));
    }
    function landCol(x, y, z, light) {
      var m = z - ZS, c;
      if (m > 3) c = m > 22 ? "#a98a5c" : "#cdb27a";      /* 안데스 기슭 · 사막 해안 */
      else if (m > 0) c = "#e2cf9a";                       /* 모래 해변 */
      else c = "#6f6858";                                  /* 해저 */
      return K.tint(c, light);
    }
    function mix(a, b, f) { return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f]; }
    function seaCol(T, al) {                               /* 표층 수온 → 바다 색(찬물 청록, 따뜻한 물 주황빛) */
      var f = clamp((T - 14) / 10, 0, 1), c = f < .55 ? mix([95, 215, 230], [45, 130, 210], f / .55) : mix([45, 130, 210], [225, 140, 95], (f - .55) / .45);
      return "rgba(" + Math.round(c[0]) + "," + Math.round(c[1]) + "," + Math.round(c[2]) + "," + al + ")";
    }
    function localT(d, T) { return 20.5 + (T - 20.5) * Math.exp(-Math.max(0, d) / 110); }
    function thermoZ(u) {                                  /* 앞면 단면의 수온약층 높이 */
      var U = clamp(upIndex() / 12, -1, 1), d = Math.max(0, xc(D) - u);
      return Math.min(ZS - 3, ZS - 50 + U * 46 * Math.exp(-d / 150));
    }
    function boat(x, y, col) {
      I.box(ctx, x - 10, y - 4, ZS - 1, x + 10, y + 4, ZS + 4, "#f1ede6", col, K.tint(col, .7));
      I.box(ctx, x - 3, y - 3, ZS + 4, x + 4, y + 3, ZS + 10, "#ffffff", "#e6e9ee", "#b9c0ca");
    }
    function drawModel(mode, T, nut, fi) {
      var U = upIndex(), XF = xc(D), A = Math.abs(U);
      K.studio(ctx, 0, 0, W, DH, { x: I.P(L, D, 0).x - 160, y: I.P(L, D, 0).y - 24, rx: 330, ry: 52 });
      ctx.save(); ctx.beginPath(); ctx.roundRect(0, 0, W, DH, 14); ctx.clip();
      /* 윗면: 땅과 해저, 칸마다 바다를 표층 수온 색으로 덮는다 */
      I.field(ctx, ground, landCol, 70, 20, function (c, x0, y0, x1, y1, zMax, zMin) {
        if (ZS > zMin + 0.2) {
          var d = xc((y0 + y1) / 2) - (x0 + x1) / 2;
          var sc = seaCol(localT(d, T), .86); I.quad(c, I.P(x0, y0, ZS), I.P(x1, y0, ZS), I.P(x1, y1, ZS), I.P(x0, y1, ZS), sc, sc);
        }
      });
      /* 오른쪽 면(육지 단면)과 앞면의 땅 부분 */
      ["front", "right"].forEach(function (side) {
        function zf(u) { return side === "front" ? ground(u, D) : ground(L, u); }
        I.face(ctx, side, function (Lw) {
          I.profile(ctx, side, zf, 0);
          var g = ctx.createLinearGradient(0, 0, 0, 170); g.addColorStop(0, "#4d4033"); g.addColorStop(.6, "#7d6448"); g.addColorStop(1, "#b49464");
          ctx.fillStyle = g; ctx.fill();
          ctx.save(); I.profile(ctx, side, zf, 0); ctx.clip();
          ctx.strokeStyle = "rgba(40,28,15,.25)"; ctx.lineWidth = 1;
          for (var y2 = 14; y2 < 170; y2 += 15) { ctx.beginPath(); ctx.moveTo(0, y2); ctx.lineTo(Lw, y2 + 4); ctx.stroke(); }
          ctx.restore();
        });
      });
      /* 앞면의 바다: 찬 심층수 위에 따뜻한 표층수, 그 경계가 수온약층 */
      I.face(ctx, "front", function () {
        var u;
        ctx.save(); ctx.beginPath(); ctx.moveTo(0, ZS);
        for (u = 0; u <= XF; u += 4) ctx.lineTo(u, ZS);
        for (u = XF; u >= 0; u -= 4) ctx.lineTo(u, Math.min(ZS, ground(u, D)));
        ctx.closePath(); ctx.clip();
        var dg = ctx.createLinearGradient(0, 0, 0, ZS); dg.addColorStop(0, "#06183f"); dg.addColorStop(1, "#1d559f");
        ctx.fillStyle = dg; ctx.fillRect(0, 0, L, ZS);
        ctx.beginPath(); ctx.moveTo(0, ZS);
        for (u = 0; u <= XF; u += 4) ctx.lineTo(u, ZS);
        for (u = XF; u >= 0; u -= 4) ctx.lineTo(u, thermoZ(u));
        ctx.closePath();
        var wg = ctx.createLinearGradient(0, ZS, 0, ZS - 90);
        wg.addColorStop(0, "rgba(80,190,230,.95)"); wg.addColorStop(1, "rgba(40,130,200,.88)");
        ctx.fillStyle = wg; ctx.fill();
        ctx.restore();
      });
      I.shade(ctx, "front", function (u) { return Math.max(ground(u, D), u < XF ? ZS : 0); });
      I.shade(ctx, "right", function (u) { return ground(L, u); });
      /* 수온약층 선과 해수면 선(앞면) */
      var pts = [], u2;
      for (u2 = 0; u2 <= XF; u2 += 6) { var zt = thermoZ(u2); if (zt > ground(u2, D) + 1) pts.push(I.P(u2, D, zt)); }
      ctx.save(); ctx.strokeStyle = KC.green; ctx.lineWidth = 2.2; ctx.setLineDash([7, 5]); ctx.shadowColor = KC.green; ctx.shadowBlur = 6;
      ctx.beginPath(); pts.forEach(function (p, i) { if (i) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y); }); ctx.stroke(); ctx.restore();
      var s0 = I.P(0, D, ZS), s1 = I.P(XF, D, ZS);
      ctx.strokeStyle = "rgba(255,255,255,.85)"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(s0.x, s0.y); ctx.lineTo(s1.x, s1.y); ctx.stroke();
      I.edges(ctx, ground(L, D), ground(L, 0));
      /* 앞면의 물 순환 고리: 용승이면 해안 쪽에서 올라와 바다 쪽으로, 침강이면 거꾸로 */
      if (mode !== "none" && A > 0.05) {
        var loop = [[250, 48], [478, 48], [478, ZS - 8], [250, ZS - 8]];
        if (mode === "down") loop = loop.slice().reverse();
        var col = mode === "up" ? "rgba(127,211,255,.95)" : "rgba(255,179,92,.95)";
        ctx.save(); ctx.globalAlpha = clamp(.25 + A / 10, .25, 1);
        for (var k = 0; k < 4; k++) {
          var pa = I.P(loop[k][0], D, loop[k][1]), pb = I.P(loop[(k + 1) % 4][0], D, loop[(k + 1) % 4][1]);
          K.arrow(ctx, { x: pa.x + (pb.x - pa.x) * .2, y: pa.y + (pb.y - pa.y) * .2 }, { x: pa.x + (pb.x - pa.x) * .8, y: pa.y + (pb.y - pa.y) * .8 }, col, 3, 10);
        }
        ctx.restore();
        var per = [], tot = 0;
        for (var k2 = 0; k2 < 4; k2++) { var la = loop[k2], lb = loop[(k2 + 1) % 4]; per.push(Math.abs(lb[0] - la[0]) + Math.abs(lb[1] - la[1])); tot += per[k2]; }
        for (var j = 0; j < 14; j++) {
          var dist = (((t * 0.0045 * A) + j / 14) % 1) * tot, q = 0;
          while (dist > per[q] && q < 3) { dist -= per[q]; q++; }
          var p0 = loop[q], p1 = loop[(q + 1) % 4], f = dist / per[q];
          var pp = I.P(p0[0] + (p1[0] - p0[0]) * f, D, p0[1] + (p1[1] - p0[1]) * f);
          K.glow(ctx, pp.x, pp.y, 2.6, col, 3);
        }
      }
      /* 윗면: 플랑크톤(영양염) · 멸치 떼 */
      var R = K.rng(41), nP = Math.round(nut / 100 * 46);
      for (var n = 0; n < 46; n++) {
        var py = 10 + R() * 180, px = xc(py) - 12 - Math.pow(R(), 1.4) * 190;
        if (n < nP) { ctx.globalAlpha = .55 + .35 * Math.sin(t * .15 + n); var pq = I.P(px, py, ZS); K.glow(ctx, pq.x, pq.y, 1.5, "rgba(150,255,190,.95)", 3); }
      }
      ctx.globalAlpha = 1;
      var nS = Math.round(fi / 170 * 6), R2 = K.rng(77);
      for (var sh = 0; sh < 6; sh++) {
        var fy = 20 + R2() * 160, fx = xc(fy) - 40 - R2() * 150;
        if (sh >= nS) continue;
        for (var e = 0; e < 7; e++) {
          var fp = I.P(fx + Math.sin(e * 2.1 + t * .05) * 9, fy + Math.cos(e * 1.7) * 7, ZS);
          ctx.fillStyle = "rgba(20,40,70,.55)"; ctx.beginPath(); ctx.ellipse(fp.x, fp.y, 3.4, 1.4, -.5, 0, 6.283); ctx.fill();
        }
      }
      /* 마을 · 부두 · 배: 멸치가 많을수록 바다로 나간 배가 많다 */
      [[22, 40], [34, 78], [20, 112], [46, 128], [30, 178]].forEach(function (h, i) {
        var hx = xc(h[1]) + h[0], hy = h[1];
        I.house(ctx, hx, hy, ground(hx + 6, hy + 6), 14, 12, 10, ["#c0553f", "#3f6fb5", "#d08a2e", "#c0553f", "#3f6fb5"][i]);
      });
      var pY = 150, pX = xc(pY);
      I.box(ctx, pX - 46, pY - 4, ZS - 2, pX + 4, pY + 4, ZS + 2, "#b08a5a", "#8a6a44", "#6e5435");
      var out = Math.round(fi / 170 * 4), bc = ["#c0553f", "#3f6fb5", "#d08a2e", "#3a8f6a"];
      for (var bI = 0; bI < 4; bI++) {
        if (bI < out) { var by2 = 30 + bI * 34; boat(xc(by2) - 95 - (bI % 2) * 60, by2, bc[bI]); }
        else boat(pX - 34 + (bI - out) * 13, pY + 14 + (bI - out) * 4, bc[bI]);
      }
      /* 바람(노랑)과 에크만 수송(빨강) — 해수면 위. 방위 → 모형: 동 = +x, 북 = −y */
      var wv = azVec(az), ev = azVec(ekAz()), wl = 12 + ws * 8, WC = [230, 105];
      if (ws > 0) {
        [[110, 40], [380, 40]].forEach(function (c0) {
          K.arrow(ctx, I.P(c0[0] - wv.x * wl * .3, c0[1] - wv.y * wl * .3, ZS + 14), I.P(c0[0] + wv.x * wl * .3, c0[1] + wv.y * wl * .3, ZS + 14), "rgba(255,211,90,.7)", 2.5, 8);
        });
        K.arrow(ctx, I.P(WC[0], WC[1], ZS + 14), I.P(WC[0] + wv.x * wl, WC[1] + wv.y * wl, ZS + 14), KC.yellow, 4.5, 13);
      }
      var e0 = I.P(WC[0], WC[1], ZS + 2), e1 = I.P(WC[0] + ev.x * 75, WC[1] + ev.y * 75, ZS + 2);
      K.arrow(ctx, e0, e1, KC.red, 4.5, 13);
      /* 나침반 */
      var c1 = { x: 222, y: 352 }, cN = { x: 222 + 30 * .866, y: 352 - 15 }, cE = { x: 222 + 30 * .866, y: 352 + 15 };
      K.arrow(ctx, c1, cN, "#24324a", 2, 7); K.line(ctx, c1, cE, "rgba(36,50,74,.6)", 1.5);
      ctx.restore();
      /* 이름표 */
      var box = [0, W];
      K.pill(ctx, "북", cN.x + 6, cN.y - 4, { s: 10.5, c: "#ffffff", box: box });
      K.pill(ctx, "동", cE.x + 6, cE.y + 10, { s: 10.5, c: "#ffffff", box: box });
      function tipPill(p0, p1, txt, col) {
        var dx = p1.x - p0.x, dy = p1.y - p0.y, n = Math.max(1, Math.sqrt(dx * dx + dy * dy)); dx /= n; dy /= n;
        K.pill(ctx, txt, clamp(p1.x + dx * 14, 330, 870), clamp(p1.y + dy * 14 + (dy > 0 ? 12 : -2), 44, 240), { s: 11.5, a: dx < -0.2 ? "right" : (dx > 0.2 ? "left" : "center"), c: col, box: box });
      }
      if (ws > 0) tipPill(I.P(WC[0], WC[1], ZS + 14), I.P(WC[0] + wv.x * wl, WC[1] + wv.y * wl, ZS + 14), "바람 " + ws.toFixed(1) + " m/s", KC.yellow);
      tipPill(e0, e1, "에크만 수송", KC.red);
      I.label(ctx, 640, 70, ground(640, 70), "페루 · 사막 해안", 40, -56, "#f4ead2", box);
      I.label(ctx, 80, D, ZS - 14, "따뜻한 표층수", -60, -10, "#bfe6ff", box);
      I.label(ctx, 30, D, thermoZ(30), "수온약층", -50, 16, KC.green, box);
      I.label(ctx, 140, D, 26, "찬 심층수 · 영양염 많음", -100, 34, "#9fc4ff", box);
      if (mode === "up") I.label(ctx, 478, D, 92, ws <= 3 ? "찬물이 조금만 올라온다" : "찬물이 올라온다 — 연안 용승", -40, 104, KC.blue, box);
      else if (mode === "down") I.label(ctx, 478, D, 92, "표층수가 가라앉는다 — 연안 침강", -40, 104, KC.orange, box);
      else K.pill(ctx, "표층 수송이 해안과 나란합니다", 520, 412, { s: 12, a: "center", c: KC.ink, box: box });
      /* 범례 */
      K.pill(ctx, "남반구 · 페루 앞바다 (태평양)", 20, 284, { s: 11.5, c: "#bfe6ff" });
      K.pill(ctx, "바다 색 = 표층 수온", 20, 316, { s: 11, c: "#ffffff" });
      for (var gI = 0; gI < 10; gI++) { ctx.fillStyle = seaCol(14 + gI * 1.1, 1); ctx.fillRect(22 + gI * 16, 328, 16, 10); }
      K.t(ctx, "14 ℃", 22, 354, { s: 10.5, w: "800", c: "#24324a" }); K.t(ctx, "24 ℃", 182, 354, { s: 10.5, w: "800", c: "#24324a", a: "right" });
      K.t(ctx, "남반구: 에크만 수송은", 22, 378, { s: 11, w: "800", c: "#24324a" });
      K.t(ctx, "바람이 부는 쪽의 왼쪽 90°", 22, 395, { s: 11, w: "800", c: "#24324a" });
      /* 큰 제목 */
      var head1, head2, hc;
      if (mode === "up" && ws > 3) { head1 = "바람이 찬물을 끌어올린다"; head2 = "연안 용승 · 해안 " + T.toFixed(1) + " ℃"; hc = "#7fd3ff"; }
      else if (mode === "up") { head1 = "방향은 맞는데 바람이 약하다"; head2 = "용승이 약함 · 해안 " + T.toFixed(1) + " ℃"; hc = "#ffd35a"; }
      else if (mode === "down") { head1 = "따뜻한 물이 해안에 쌓인다"; head2 = "연안 침강 · 해안 " + T.toFixed(1) + " ℃"; hc = "#ffb35c"; }
      else { head1 = "물이 해안과 나란히 흐른다"; head2 = "용승도 침강도 없음 · " + T.toFixed(1) + " ℃"; hc = "#ffffff"; }
      K.bigText(ctx, head1, 22, 50, 24, "#ffffff"); K.bigText(ctx, head2, 22, 82, 16, hc);
      K.warn(ctx, W - 14, 30, "⚠ 깊이·높이는 보기 쉽게 과장 (실제 해안 폭은 수십 km)", "right");
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      var off = offshore(), mode = off >= 0.5 ? "up" : (off <= -0.5 ? "down" : "none");
      var T = sst(), nut = nutrient(), fi = fish();
      drawModel(mode, T, nut, fi);
      var TOPH = DH;

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

    /* 블록 모형(integrated-science-2/2-1 '이상 신호'와 같은 말투): 적도 태평양을 동서로 잘라 낸 블록.
       앞면 = 적도 단면(따뜻한 표층수 / 수온 약층 / 찬 심층수), 윗면 = 해수면 수온 색 + 서쪽 섬 + 동쪽 안데스, 위 = 워커 순환 고리와 강수대 구름.
       무역풍이 약해지면 수온 약층은 평평해진다(거꾸로 기울지는 않는다). */
    var L = 560, D = 130, ZB = 14, ZS = 128, HW = ZS - ZB, YL = D * 0.56;
    var I = K.iso({ ox: 250, oy: 226, s: 0.74, L: L, D: D });
    var paintE = cache(canvas, W, H);
    function sm(u) { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); }
    function dW() { return (clamp(240 + 52 * k, 170, 322) - 160) / 170; }
    function dE() { return (clamp(240 - 52 * k, 166, 322) - 160) / 170; }
    function thermo(u) { var t2 = u / L; return ZS - HW * (dW() + (dE() - dW()) * (t2 * 0.45 + sm(t2) * 0.55)); }
    function sst(x) { return sstW() + (sstE() - sstW()) * sm((x / L - 0.35) / 0.6); }
    var ISL = [[46, 40, 28, 24], [100, 96, 20, 20], [30, 104, 18, 15], [140, 46, 15, 14]];
    function landZ(x, y) {
      var z = 0, i;
      if (x < 200) { z = -8; for (i = 0; i < ISL.length; i++) { var q = ISL[i], dx = x - q[0], dy = y - q[1]; z += q[2] * Math.exp(-(dx * dx + dy * dy) / (q[3] * q[3])); } z = ZS + z; }
      if (x > L - 80 && y < D * 0.42) { var r = x - (L - 70 + 8 * Math.sin(y / 9)); if (r > -8) z = Math.max(z, ZS - 4 + Math.min(40, r + 8) * 0.4 + 60 * Math.exp(-Math.pow((x - (L - 26)) / 24, 2)) * sm((r + 8) / 30)); }
      return z;
    }
    function zTop(x, y) { return Math.max(ZS, landZ(x, y)); }
    function colTop(x, y, z, l) {
      if (z <= ZS + 0.4) return tCol(sst(x), 1.02 - 0.05 * x / L);
      var h = z - ZS;
      if (x < 250) return h < 3 ? K.tint("#e9d9a6", l) : K.tint(k < 0.6 ? "#a08a52" : "#4f9a3f", l);
      if (h > 52) return K.tint("#f2f5f9", l);
      if (h > 26) return K.tint("#93806a", l);
      return h < 4 ? K.tint("#e4cf98", l) : K.tint("#c9a86a", l);
    }
    function paintBase(c) {
      var fc = I.P(L / 2, D / 2, 0);
      K.studio(c, 0, 0, W, H, { x: fc.x + 10, y: fc.y + 40, rx: 300, ry: 90 });
      I.field(c, zTop, colTop, 84, 20);
      I.face(c, "front", function (Lw) {
        var u, dg = c.createLinearGradient(0, ZB, 0, ZS); dg.addColorStop(0, "#0a2350"); dg.addColorStop(1, "#2f6db0");
        c.fillStyle = dg; c.fillRect(0, 0, Lw, ZS);
        c.beginPath(); for (u = 0; u <= Lw; u += 8) c.lineTo(u, thermo(u) + 1); for (u = Lw; u >= 0; u -= 8) c.lineTo(u, thermo(u) - 12); c.closePath();
        c.fillStyle = "rgba(140,190,240,.35)"; c.fill();
        c.beginPath(); c.moveTo(0, ZS); c.lineTo(Lw, ZS); for (u = Lw; u >= 0; u -= 8) c.lineTo(u, thermo(u)); c.closePath();
        var wg = c.createLinearGradient(0, 0, Lw, 0); for (var i = 0; i <= 8; i++) wg.addColorStop(i / 8, tCol(sst(Lw * i / 8) - 0.4, 0.97));
        c.fillStyle = wg; c.fill();
        c.strokeStyle = "rgba(255,255,255,.85)"; c.lineWidth = 1.6; c.setLineDash([7, 5]); c.beginPath(); for (u = 0; u <= Lw; u += 8) c.lineTo(u, thermo(u)); c.stroke(); c.setLineDash([]);
        c.beginPath(); c.moveTo(0, 0); for (u = 0; u <= Lw; u += 6) c.lineTo(u, ZB + 4 * Math.sin(u / 37) + 2 * Math.sin(u / 11)); c.lineTo(Lw, 0); c.closePath();
        var rg = c.createLinearGradient(0, 0, 0, ZB + 6); rg.addColorStop(0, "#3a2f2a"); rg.addColorStop(1, "#6d5d50"); c.fillStyle = rg; c.fill();
      });
      I.face(c, "right", function (Lw) {
        var dg = c.createLinearGradient(0, ZB, 0, ZS); dg.addColorStop(0, "#0a2350"); dg.addColorStop(1, "#2f6db0");
        c.fillStyle = dg; c.fillRect(0, 0, Lw, ZS);
        c.fillStyle = tCol(sstE() - 0.4, 0.9); c.fillRect(0, thermo(L), Lw, ZS - thermo(L));
        I.profile(c, "right", function (u) { var g0 = landZ(L - .1, u); return g0 > 0 ? g0 : ZB; }, 0);
        var rg = c.createLinearGradient(0, 0, 0, ZS + 60); rg.addColorStop(0, "#3e3128"); rg.addColorStop(1, "#946f4a"); c.fillStyle = rg; c.fill();
      });
      I.shade(c, "front", function () { return ZS; }); I.shade(c, "right", function (u) { return Math.max(ZS, landZ(L - .1, u)); });
      I.edges(c, ZS, ZS);
    }
    function draw() {
      var a = anom(), ph = phase(), i;
      paintE(ctx, k.toFixed(2), paintBase);
      var BX = [0, 640], kk = clamp(k / 1.7, 0, 1);
      /* 물결 */
      ctx.strokeStyle = "rgba(255,255,255,.5)"; ctx.lineWidth = 1;
      for (i = 0; i < 14; i++) { var gx = 200 + ((i * 0.377 + t * 0.002) % 1) * (L - 300), gy = 10 + ((i * 0.618) % 1) * (D - 20), s1 = I.P(gx - 9, gy, ZS), s2 = I.P(gx + 7, gy, ZS); ctx.beginPath(); ctx.moveTo(s1.x, s1.y); ctx.quadraticCurveTo((s1.x + s2.x) / 2, s1.y - 2.5, s2.x, s2.y); ctx.stroke(); }
      /* 적도 용승(동쪽) */
      if (k >= 0.3) {
        var ua = I.P(L - 26, D, ZB + 20), ub = I.P(L - 26, D, ZS - 8);
        ctx.save(); ctx.globalAlpha = clamp(k, .3, 1); arr(ctx, ua, ub, "#ffffff", 4 + 3 * kk, 14); arr(ctx, ua, ub, "#4dabf7", 2 + 3 * kk, 12); ctx.restore();
      }
      /* 무역풍 바람결(동 → 서) */
      var nS = Math.round(3 + 8 * kk);
      for (i = 0; i < nS; i++) {
        var su = ((t * 0.004 * (0.4 + k)) + i / nS) % 1, sx = (L - 90) + ((120 + 200 * kk) - (L - 90)) * su, sy = D * (0.66 + 0.26 * ((i * 0.618) % 1));
        var w1 = I.P(sx, sy, ZS + 7), w2 = I.P(sx - 24, sy, ZS + 7);
        ctx.strokeStyle = "rgba(255,255,255," + (0.9 * Math.sin(su * Math.PI)).toFixed(3) + ")"; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(w1.x, w1.y); ctx.lineTo(w2.x, w2.y); ctx.stroke();
      }
      /* 워커 순환 고리: 강수대에서 오르고 → 위에서 동쪽 → 동쪽에서 내려와 → 지표 무역풍으로 서쪽 */
      var cloudXw = 90 + 300 * clamp(1 - k, 0, 0.7) / 0.7, xS = L - 78, xR = Math.min(cloudXw, xS - 60), z0 = ZS + 12, z1 = ZS + 76;
      function loopPt(u) {
        var w = xS - xR, h = z1 - z0, per = 2 * w + 2 * h, d = (((u % 1) + 1) % 1) * per;
        if (d < h) return [xR, z0 + d]; d -= h; if (d < w) return [xR + d, z1]; d -= w; if (d < h) return [xS, z1 - d]; d -= h; return [xS - d, z0];
      }
      ctx.save(); ctx.lineJoin = "round"; ctx.beginPath();
      for (i = 0; i <= 80; i++) { var lp = loopPt(i / 80), sp = I.P(lp[0], YL, lp[1]); if (i) ctx.lineTo(sp.x, sp.y); else ctx.moveTo(sp.x, sp.y); }
      ctx.strokeStyle = "rgba(30,90,170," + (0.15 + 0.3 * kk).toFixed(3) + ")"; ctx.lineWidth = 4 + 6 * kk; ctx.stroke();
      ctx.strokeStyle = "rgba(235,248,255,.9)"; ctx.lineWidth = 1.4 + 1.6 * kk; ctx.stroke(); ctx.restore();
      [0.2, 0.42, 0.62, 0.9].forEach(function (f) { var q0 = loopPt(f - 0.012), q1 = loopPt(f + 0.012); arr(ctx, I.P(q0[0], YL, q0[1]), I.P(q1[0], YL, q1[1]), "rgba(20,70,150,.9)", 2, 9 + 4 * kk); });
      for (i = 0; i < 14; i++) { var q = loopPt(i / 14 + t * 0.004 * clamp(k, 0.15, 1.7)), qp = I.P(q[0], YL, q[1]); K.glow(ctx, qp.x, qp.y, 1.7, "rgba(40,150,255,.95)", 2.6); }
      /* 강수대 구름 + 비 */
      ctx.strokeStyle = "rgba(40,90,170,.7)"; ctx.lineWidth = 1.3;
      for (i = 0; i < 20; i++) { var ru = (t * 0.02 + i * 0.137) % 1, rx = cloudXw - 26 + (i * 37 % 52), ry = YL - 12 + (i * 23 % 24), zt = ZS + 36 - ru * 30; var ra = I.P(rx, ry, zt), rb = I.P(rx, ry, zt - 8); ctx.beginPath(); ctx.moveTo(ra.x, ra.y); ctx.lineTo(rb.x - 1.5, rb.y); ctx.stroke(); }
      var PF = []; for (i = 0; i < 24; i++) { var aa = i * 2.4, rr = 22 * Math.sqrt((i % 8) / 8 + 0.1); PF.push([cloudXw + Math.cos(aa) * rr * 1.3, YL + Math.sin(aa) * rr * 0.6, ZS + 40 + (i / 24) * 46, 11 + (i % 4) * 2]); }
      PF.sort(function (p, q2) { return (p[0] + p[1] + 1.4 * p[2]) - (q2[0] + q2[1] + 1.4 * q2[2]); }).forEach(function (p) { puff3(ctx, I, p[0], p[1], p[2], p[3], false); });
      /* 이름표 */
      I.label(ctx, 60, D, ZS - 22, "따뜻한 표층수", -26, 60, "#ffd9a8", BX);
      I.label(ctx, 250, D, thermo(250), "수온 약층", -20, 74, "#ffffff", BX);
      I.label(ctx, 150, D, ZB + 26, "차가운 심층수", -26, 50, "#cfe8ff", BX);
      if (k >= 0.6) I.label(ctx, L - 26, D, ZB + 50, "적도 용승", 40, 30, "#bfe8ff", BX);
      I.label(ctx, 30, 104, landZ(30, 104), "인도네시아", -30, -8, "#d9f7c8", BX);
      I.label(ctx, L - 26, 22, landZ(L - 26, 22), "페루 · 안데스", 16, -24, "#f4e6c4", BX);
      I.label(ctx, xR + 40, YL, z1, "워커 순환", -14, -30, "#e8ecff", BX);
      I.label(ctx, xS, YL, z1 - 30, "하강 기류 · 건조", 18, 6, "#e8ecff", BX);
      bigHead(ctx, ph, ph === "엘니뇨" ? "무역풍 약화 → 따뜻한 물이 동쪽으로" : (ph === "라니냐" ? "무역풍 강화 → 동쪽 바다가 더 차갑다" : "무역풍이 따뜻한 물을 서쪽으로 민다"), ph === "엘니뇨" ? "#ffb35c" : (ph === "라니냐" ? "#8fd3ff" : "#ffffff"), 18, 42);
      K.warn(ctx, 630, H - 14, "⚠ 깊이·높이·기울기는 보기 쉽게 과장", "right");

      /* ── 오른쪽 흰 판정 카드 ── */
      var RX = 650, RW = W - RX - 12, x0 = RX + 18, x1 = W - 30;
      K.card(ctx, RX, 12, RW, H - 24, "판정");
      K.t(ctx, ph, x0, 74, { s: 26, w: "900", c: ph === "엘니뇨" ? "#d9480f" : (ph === "라니냐" ? "#1c64c4" : LT.green) });
      K.row(ctx, "무역풍 세기", k.toFixed(2) + " 배", x0, x1, 110);
      K.row(ctx, "동태평양 편차", (a >= 0 ? "+" : "") + a.toFixed(2) + " ℃", x0, x1, 138, a >= 0.5 ? LT.red : (a <= -0.5 ? LT.blue : LT.ink));
      K.row(ctx, "남방 진동 지수", (soi() >= 0 ? "+" : "") + soi().toFixed(2), x0, x1, 166, LT.blue);
      K.row(ctx, "페루 어획 지수", Math.round(fish()) + " %", x0, x1, 194, fish() >= 100 ? LT.green : LT.red);
      K.bar(ctx, x0, 206, x1 - x0, fish() / 180, fish() >= 100 ? "#14b8a6" : "#f59e0b");
      var dif = dW() - dE();
      K.row(ctx, "수온 약층", dif > 0.45 ? "서쪽 깊고 동쪽 얕다" : (dif > 0.15 ? "기울기가 줄었다" : "거의 평평해짐"), x0, x1, 248);
      K.tip(ctx, ph === "엘니뇨" ? "용승이 약해져 어장이 빕니다" : (ph === "라니냐" ? "용승이 더 활발합니다" : "용승으로 좋은 어장"), x0 - 4, 264, RW - 28, ph !== "엘니뇨");
      lt(ctx, "윗면 색 = 해수면 수온", x0, 330, { s: 11.5, w: "800" });
      var lg = ctx.createLinearGradient(x0, 0, x1, 0); for (i = 0; i <= 10; i++) lg.addColorStop(i / 10, tCol(20 + i));
      ctx.fillStyle = lg; ctx.beginPath(); ctx.roundRect(x0, 340, x1 - x0, 12, 6); ctx.fill();
      lt(ctx, "20 ℃", x0, 368, { s: 10.5 }); lt(ctx, "30 ℃", x1, 368, { s: 10.5, a: "right" });
      K.row(ctx, "서태평양", sstW().toFixed(1) + " ℃", x0, x1, 402, LT.orange);
      K.row(ctx, "동태평양", sstE().toFixed(1) + " ℃", x0, x1, 428, sstE() > 25 ? LT.orange : LT.blue);
      lt(ctx, "편차 +0.5 ℃↑ 엘니뇨 · −0.5 ℃↓ 라니냐", x0, 462, { s: 10.5 });

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

    /* 밝은 스튜디오: 왼쪽 흰 카드 = 지역별 강수 편차 막대(가뭄 ↔ 홍수), 오른쪽 위 = 열대 태평양 미니 블록(강수대 구름이 동서로 옮겨 간다),
       아래 흰 카드 = 판정 */
    var I = K.iso({ ox: 612, oy: 156, s: 0.5, L: 430, D: 96 }), ZS = 28;
    function draw() {
      ctx.clearRect(0, 0, W, H);
      K.studio(ctx, 0, 0, W, H, { x: 700, y: 270, rx: 170, ry: 34 });
      var ph = a >= 0.5 ? "엘니뇨" : (a <= -0.5 ? "라니냐" : "평상시"), i;
      bigHead(ctx, ph + " · 편차 " + (a >= 0 ? "+" : "") + a.toFixed(1) + " ℃", "강수대가 옮겨 가면 지구 반대편까지 흔들린다", ph === "엘니뇨" ? "#ffb35c" : (ph === "라니냐" ? "#8fd3ff" : "#ffffff"), 18, 42);
      /* ── 왼쪽 흰 카드: 강수 편차 막대 ── */
      var CX0 = 12, CW = 540, cx = 360, half = 150, y0 = 132;
      K.card(ctx, CX0, 84, CW, 262, "평년 대비 강수량 (원격 영향)");
      [-100, -50, 0, 50, 100].forEach(function (p) {
        var x = cx + p / 100 * half;
        ctx.strokeStyle = p === 0 ? LT.line : LT.grid; ctx.lineWidth = p === 0 ? 1.6 : 1;
        ctx.beginPath(); ctx.moveTo(x, y0 - 6); ctx.lineTo(x, y0 + 5 * 38); ctx.stroke();
        lt(ctx, (p > 0 ? "+" : "") + p + "%", x, y0 - 12, { s: 10.5, a: "center" });
      });
      REG.forEach(function (r, k2) {
        var yy = y0 + k2 * 38 + 6, val = rain(k2), wpx = Math.abs(val) / 100 * half, wet = val >= 0;
        lt(ctx, r.n, CX0 + 18, yy + 15, { s: 11.5, c: LT.ink, w: "800" });
        ctx.fillStyle = "#e9eef5"; ctx.beginPath(); ctx.roundRect(cx - half, yy, 2 * half, 22, 6); ctx.fill();
        ctx.fillStyle = wet ? "#1c7ed6" : "#e8590c"; ctx.beginPath(); ctx.roundRect(wet ? cx : cx - wpx, yy, Math.max(wpx, 1.5), 22, 6); ctx.fill();
        var lab = (val > 0 ? "+" : "") + Math.round(val) + "%" + (val <= -40 ? " 가뭄" : (val >= 40 ? " 홍수" : ""));
        K.t(ctx, lab, wet ? cx - 6 : cx + 6, yy + 16, { s: 12, w: "900", a: wet ? "right" : "left", c: val > 0 ? LT.blue : (val < 0 ? LT.orange : LT.mute) });
      });
      lt(ctx, "← 가뭄 쪽", cx - half, y0 + 5 * 38 + 18, { s: 11, c: LT.orange, w: "800" });
      lt(ctx, "홍수 쪽 →", cx + half, y0 + 5 * 38 + 18, { s: 11, a: "right", c: LT.blue, w: "800" });

      /* ── 오른쪽 위: 열대 태평양 미니 블록 ── */
      ["front", "right"].forEach(function (side) { I.face(ctx, side, function (Lw) { var g = ctx.createLinearGradient(0, 0, 0, ZS); g.addColorStop(0, "#0a2350"); g.addColorStop(1, "#2f86c4"); ctx.fillStyle = g; ctx.fillRect(0, 0, Lw, ZS); }); });
      I.shade(ctx, "front", function () { return ZS; }); I.shade(ctx, "right", function () { return ZS; });
      I.top(ctx, function () { return ZS; }, function (k2, u) { var f = u / I.L; return tCol(29.4 - (1 - Math.max(0, a) / 3) * 5 * f * f + (a < 0 ? a * f : 0), 1.02); }, 30);
      I.box(ctx, 10, 20, ZS, 50, 50, ZS + 6, "#5aa047", "#3f7a33", "#2f5e27"); I.box(ctx, 34, 62, ZS, 70, 86, ZS + 5, "#5aa047", "#3f7a33", "#2f5e27");
      I.box(ctx, I.L - 24, 0, ZS, I.L, 46, ZS + 14, "#b39a72", "#8c7350", "#6d5a3e");
      I.edges(ctx, ZS, ZS);
      var cXw = 90 + clamp(a, -3, 3) / 3 * 150 + 120 * clamp(a / 3, 0, 1);
      ctx.strokeStyle = "rgba(40,90,170,.7)"; ctx.lineWidth = 1.2;
      for (i = 0; i < 12; i++) { var rx = cXw - 18 + (i * 37 % 36), ry = 30 + (i * 23 % 40), ra = I.P(rx, ry, ZS + 26), rb = I.P(rx, ry, ZS + 14); ctx.beginPath(); ctx.moveTo(ra.x, ra.y); ctx.lineTo(rb.x - 1, rb.y); ctx.stroke(); }
      [[-14, 40, 10], [0, 48, 13], [14, 52, 10], [6, 36, 9], [-6, 56, 9]].forEach(function (q) { puff3(ctx, I, cXw + q[0], q[1], ZS + 34 + (q[2] > 11 ? 10 : 0), q[2] * 1.6, false); });
      var cl = I.P(cXw, 48, ZS + 60);
      K.pill(ctx, "강수대", cl.x, cl.y - 8, { s: 11.5, a: "center", c: "#d6c8ff" });
      var w0 = I.P(0, I.D, 0), e0 = I.P(I.L, I.D, 0);
      K.pill(ctx, "서태평양", w0.x + 10, w0.y + 22, { s: 11, a: "center", c: "#ffffff" });
      K.pill(ctx, "동태평양", e0.x, e0.y + 24, { s: 11, a: "center", c: "#ffffff" });

      /* ── 아래 흰 카드: 판정 ── */
      K.card(ctx, 12, 358, W - 24, H - 370, "");
      K.t(ctx, ph, 34, 396, { s: 22, w: "900", c: a >= 0.5 ? "#d9480f" : (a <= -0.5 ? "#1c64c4" : LT.green) });
      K.row(ctx, "페루 어획 지수", Math.round(fish()) + " %", 160, 420, 394, fish() >= 120 ? LT.green : (fish() <= 60 ? LT.red : LT.ink));
      K.bar(ctx, 160, 404, 260, fish() / 180, fish() >= 100 ? "#14b8a6" : "#f59e0b");
      lt(ctx, "비구름이 서는 자리가 옮겨 가면, 비를 받던 곳은 가뭄,", 450, 390, { s: 11.5, c: LT.ink });
      lt(ctx, "건조하던 곳은 홍수 — 같은 해 정반대 재해가 납니다.", 450, 410, { s: 11.5, c: LT.ink });

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
    /* 입체 미니어처: 스튜디오 바닥 위 궤도 모형(태양 공·지구 공·기울어진 자전축)과 오른쪽 흰 카드(북위 65° 여름 일사량 + 빙상 블록) */
    function earth3(x, y, r, label, col, la) {
      var rad = tilt * Math.PI / 180, L0 = r + 14;
      ctx.save(); ctx.strokeStyle = "#12203a"; ctx.lineWidth = 1.8; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(x - Math.sin(rad) * L0, y - Math.cos(rad) * L0); ctx.lineTo(x + Math.sin(rad) * L0, y + Math.cos(rad) * L0); ctx.stroke(); ctx.restore();
      K.planet(ctx, x, y, r, "#4f9ee8", "#123a8a");
      ctx.fillStyle = "rgba(90,190,110,.85)"; ctx.beginPath(); ctx.ellipse(x + r * .15, y - r * .1, r * .38, r * .22, .6, 0, 6.2832); ctx.fill();
      K.pill(ctx, label, x, y + r + 26, { s: 11, a: la || "center", c: col, box: [0, 476] });
    }
    var IB = K.iso({ ox: 690, oy: 170, s: 0.5, L: 260, D: 150 });
    function draw() {
      ctx.clearRect(0, 0, W, H);
      var q = Q(), i;
      K.studio(ctx, 0, 0, W, H, { x: 240, y: 266, rx: 220, ry: 54 });
      /* 궤도판(비스듬히 본 원판) */
      var cx = 240, cy = 236, A = 186, eVis = clamp(ecc * 6, 0, 0.36), Bv = A * Math.sqrt(1 - eVis * eVis) * 0.42, c0 = A * eVis;
      var pg = ctx.createRadialGradient(cx, cy, 10, cx, cy, A); pg.addColorStop(0, "rgba(255,255,255,.75)"); pg.addColorStop(1, "rgba(200,214,232,.55)");
      ctx.fillStyle = pg; ctx.beginPath(); ctx.ellipse(cx, cy, A + 12, Bv + 8, 0, 0, 6.2832); ctx.fill();
      ctx.strokeStyle = "rgba(20,40,90,.45)"; ctx.lineWidth = 1.6; ctx.setLineDash([6, 5]); ctx.beginPath(); ctx.ellipse(cx, cy, A, Bv, 0, 0, 6.2832); ctx.stroke(); ctx.setLineDash([]);
      /* 태양: 받침대 위 빛나는 공 */
      var sx = cx + c0, sy = cy - 26;
      ctx.strokeStyle = "#8a96a8"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(sx, sy + 16); ctx.lineTo(sx, cy); ctx.stroke();
      K.sun(ctx, sx, sy, 12); K.planet(ctx, sx, sy, 16, "#ffd24a", "#e8590c");
      K.pill(ctx, "태양", sx, sy - 26, { s: 11, a: "center", c: "#ffd35a" });
      /* 궤도를 도는 지구(작게) */
      var ox = cx + A * Math.cos(orb), oy = cy - Bv * Math.sin(orb) - 12;
      ctx.globalAlpha = .65; K.planet(ctx, ox, oy, 6, "#4f9ee8", "#123a8a"); ctx.globalAlpha = 1;
      earth3(cx + A, cy - 14, 13, "근일점 · 북반구 " + seasonName(prec), "#a9dcff", "right");
      earth3(cx - A, cy - 14, 13, "원일점 · 북반구 " + seasonName(prec + 180), "#d6c8ff", "left");
      K.warn(ctx, cx, H - 14, "⚠ 이심률·크기는 보기 쉽게 과장", "center");
      bigHead(ctx, "자전축 " + tilt.toFixed(1) + "° · 이심률 " + ecc.toFixed(3), "세차: 근일점일 때 북반구 " + seasonName(prec), "#ffffff", 18, 42);

      /* ── 오른쪽 흰 카드 ── */
      var RX = 488, RW = W - RX - 12, x0 = RX + 18, x1 = W - 30;
      K.card(ctx, RX, 12, RW, H - 24, "북위 65° 여름 일사량");
      var qc = q <= 440 ? LT.blue : (q >= 520 ? LT.orange : LT.ink);
      K.t(ctx, q.toFixed(0) + " W/m²", x0, 82, { s: 32, w: "900", c: qc });
      var lo = 380, hi = 580;
      function GX(val) { return x0 + clamp((val - lo) / (hi - lo), 0, 1) * (x1 - x0); }
      K.bar(ctx, x0, 100, x1 - x0, (q - lo) / (hi - lo), qc);
      [[440, "빙하기 쪽 440"], [520, "간빙기 쪽 520"]].forEach(function (m, j) {
        ctx.strokeStyle = LT.red; ctx.lineWidth = 2; ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.moveTo(GX(m[0]), 94); ctx.lineTo(GX(m[0]), 118); ctx.stroke(); ctx.setLineDash([]);
        lt(ctx, m[1], GX(m[0]), 134, { s: 10.5, a: "center", c: j ? LT.orange : LT.blue, w: "800" });
      });
      /* 빙상 블록: 일사량이 적을수록 얼음 돔이 커진다 */
      var ice = clamp((520 - q) / 80, 0, 1);
      IB.box(ctx, 0, 0, 0, IB.L, IB.D, 14, "#8fb36a", "#6d5a44", "#56473a");
      if (ice > 0.02) {
        var R0 = 40 + 90 * ice, Hh = 10 + 50 * ice;
        for (var z = 0; z <= 12; z++) {
          var f = z / 12, rr = R0 * Math.sqrt(1 - f * 0.92);
          ctx.beginPath();
          for (i = 0; i <= 36; i++) { var a2 = i / 36 * 6.2832, p = IB.P(80 + rr * Math.cos(a2), 75 + rr * 0.8 * Math.sin(a2), 14 + Hh * f); if (i) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y); }
          ctx.fillStyle = mix("#c9e4f5", "#ffffff", f); ctx.fill();
        }
      }
      [[200, 30], [230, 110], [170, 120]].forEach(function (q2) { IB.tree(ctx, q2[0], q2[1], 14, 1.1); });
      K.tip(ctx, q <= 440 ? "빙상이 자란다 · 여름이 시원해 눈이 다 녹지 못함" : (q >= 520 ? "빙상이 물러난다 · 여름이 뜨거워 다 녹음" : "빙상 크기 지금 수준"), x0 - 4, 312, RW - 28, q <= 440 || q >= 520 ? true : null);
      lt(ctx, "기울기↑ → 여름 일사량↑ · 연교차↑", x0, 370, { s: 11.5, c: LT.ink });
      lt(ctx, "근일점에 여름 + 큰 이심률 → 더 뜨거운 여름", x0, 392, { s: 11.5, c: LT.ink });
      lt(ctx, "주기: 기울기 약 4.1만 년 · 세차 약 2.6만 년", x0, 420, { s: 11 });
      lt(ctx, "· 이심률 약 10만 년", x0, 438, { s: 11 });

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

    /* 왼쪽 흰 카드 = 복사 강제력 막대 그래프(밝은 카드 그래프), 오른쪽 = 대기 블록 모형(땅 판 + 에어로졸 층 + 햇빛 줄기) */
    var IA = K.iso({ ox: 718, oy: 214, s: 0.62, L: 230, D: 150 }), ZG = 12, ZL = 120;
    function draw() {
      ctx.clearRect(0, 0, W, H);
      var fa = fAero(), fs = fSun(), ft = fTot(), dT = LAM * ft, i;
      K.studio(ctx, 0, 0, W, H, { x: 718, y: 300, rx: 170, ry: 40 });
      bigHead(ctx, "합계 " + (ft > 0 ? "+" : "") + ft.toFixed(2) + " W/m²", "기온 변화(평형) " + (dT > 0 ? "+" : "") + dT.toFixed(2) + " ℃ = 강제력 × 0.5", ft >= 0 ? "#ffc078" : "#a9dcff", 18, 42);
      /* ── 왼쪽 흰 카드: 막대 ── */
      K.card(ctx, 12, 84, 512, 326, "복사 강제력 — 양수는 데우고, 음수는 식힌다");
      var base = 214, SC = 34, x0 = 74, x1 = 506;
      ctx.fillStyle = "rgba(232,89,12,.06)"; ctx.fillRect(x0, base - SC - 20, x1 - x0, SC + 20);
      ctx.fillStyle = "rgba(28,126,214,.07)"; ctx.fillRect(x0, base, x1 - x0, 3 * SC + 14);
      for (var g = -3; g <= 1; g++) {
        var yy = base - g * SC;
        ctx.strokeStyle = g === 0 ? LT.line : LT.grid; ctx.lineWidth = g === 0 ? 1.8 : 1;
        ctx.beginPath(); ctx.moveTo(x0, yy); ctx.lineTo(x1, yy); ctx.stroke();
        lt(ctx, (g > 0 ? "+" : "") + g, x0 - 8, yy + 4, { s: 10.5, a: "right" });
      }
      lt(ctx, "W/m²", x0 - 8, base - SC - 26, { s: 10.5, a: "right" });
      lt(ctx, "데우는 쪽 ↑", x1, base - SC - 6, { s: 10.5, a: "right", c: LT.orange, w: "800" });
      lt(ctx, "식히는 쪽 ↓", x1, base + 3 * SC + 10, { s: 10.5, a: "right", c: LT.blue, w: "800" });
      [{ n: type === "sulf" ? "황산염 에어로졸" : "검댕(블랙 카본)", val: fa }, { n: "태양 활동", val: fs }, { n: "합계", val: ft }].forEach(function (it, j) {
        var bx = x0 + 34 + j * 140, hpx = it.val * SC, warm = it.val >= 0, col = warm ? LT.orange : LT.blue;
        var y0b = hpx >= 0 ? base - hpx : base, hb = Math.max(Math.abs(hpx), 2);
        var gr = ctx.createLinearGradient(bx, 0, bx + 76, 0); gr.addColorStop(0, warm ? "#ffa94d" : "#74c0fc"); gr.addColorStop(1, warm ? "#e8590c" : "#1c7ed6");
        ctx.fillStyle = gr; ctx.beginPath(); ctx.roundRect(bx, y0b, 76, hb, 6); ctx.fill();
        if (j === 2) { ctx.strokeStyle = LT.ink; ctx.lineWidth = 1.6; ctx.stroke(); }
        lt(ctx, it.n, bx + 38, 396, { s: 11.5, a: "center", c: j === 2 ? LT.ink : LT.mute, w: "800" });
        K.t(ctx, (it.val > 0 ? "+" : "") + it.val.toFixed(2), bx + 38, it.val >= 0 ? base - hpx - 8 : base - 8, { s: 13, a: "center", w: "900", c: col });
      });
      /* ── 오른쪽: 대기 블록 ── */
      IA.box(ctx, 0, 0, 0, IA.L, IA.D, ZG, "#8fb36a", "#6d5a44", "#56473a");
      [[40, 40], [180, 110], [120, 30]].forEach(function (q) { IA.house(ctx, q[0], q[1], ZG, 14, 12, 10); });
      [[80, 120], [200, 40]].forEach(function (q) { IA.tree(ctx, q[0], q[1], ZG, 1.2); });
      var n = Math.round(amt / 3), R = K.rng(17), sp = IA.P(IA.L - 20, 10, ZL + 150);
      K.sun(ctx, sp.x, sp.y, 12 + clamp(dS, -2, 2) * 1.5); K.planet(ctx, sp.x, sp.y, 13 + clamp(dS, -2, 2), "#ffd24a", "#f08c00");
      /* 햇빛 줄기 */
      for (var r = 0; r < 4; r++) {
        var tx = 40 + r * 50, through = type === "sulf" ? 1 - amt / 140 : 1 - amt / 200;
        var a0 = sp, a1 = IA.P(tx, 75, ZL + 4), a2 = IA.P(tx - 8, 75, ZG + 1);
        ctx.save(); ctx.strokeStyle = "rgba(245,159,0,.95)"; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(a0.x, a0.y); ctx.lineTo(a1.x, a1.y); ctx.stroke();
        ctx.globalAlpha = clamp(through, .12, 1); ctx.beginPath(); ctx.moveTo(a1.x, a1.y); ctx.lineTo(a2.x, a2.y); ctx.stroke(); ctx.restore();
        if (type === "sulf" && n > 2 && r % 2 === 0) arr(ctx, a1, IA.P(tx - 50, 75, ZL + 70), "rgba(28,126,214,.85)", 2.4, 9);
      }
      /* 에어로졸 층(투명한 판) */
      var lay = amt / 100;
      IA.plane(ctx, ZL - 14, "rgba(255,255,255," + (0.12 + 0.2 * lay).toFixed(2) + ")", "rgba(20,40,90,.25)");
      for (i = 0; i < n; i++) {
        var ap = IA.P(8 + R() * (IA.L - 16), 8 + R() * (IA.D - 16), ZL - 14 + R() * 24);
        if (type === "sulf") K.planet(ctx, ap.x, ap.y, 2.4, "#ffffff", "#9fb3c8");
        else K.planet(ctx, ap.x, ap.y, 2.6, "#6b5b55", "#120c0a");
      }
      IA.plane(ctx, ZL + 10, "rgba(255,255,255," + (0.08 + 0.12 * lay).toFixed(2) + ")", "rgba(20,40,90,.25)");
      if (type === "soot" && n > 0) { var hp = IA.P(IA.L / 2, IA.D / 2, ZL); ctx.globalAlpha = .45 * lay; K.glow(ctx, hp.x, hp.y, 20, "rgba(255,140,60,.6)", 3); ctx.globalAlpha = 1; }
      var BX = [540, W];
      IA.label(ctx, 10, IA.D, ZL - 2, type === "sulf" ? "황산염 : 햇빛을 되쏜다" : "검댕 : 햇빛을 흡수 → 공기층이 데워짐", -6, -56, type === "sulf" ? "#a9dcff" : "#ffc078", BX);
      if (type === "sulf" && n > 2) K.pill(ctx, "되쏜 햇빛 → 우주로", IA.P(0, 75, ZL + 70).x - 6, IA.P(0, 75, ZL + 70).y - 18, { s: 11, a: "right", c: "#ffffff", box: BX });
      K.pill(ctx, "태양 상수 변화 " + (dS >= 0 ? "+" : "") + dS.toFixed(1) + " W/m² · 에어로졸 양 " + amt, 718, 404, { s: 11.5, a: "center", c: "#ffffff", box: BX });

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
      K.studio(ctx, 0, 0, W, H);
      var pct = anyOn() ? fitPct() : 0, i, y;
      bigHead(ctx, anyOn() ? "맞춤도 " + pct.toFixed(1) + "%" : "요인을 켜 보세요", "1900~2020년 지구 평균 기온 — 관측과 모형", pct >= 90 ? "#9ff0cf" : "#ffffff", 18, 42);
      /* ── 왼쪽 흰 카드: 밝은 그래프 ── */
      K.card(ctx, 12, 80, 612, H - 92, "");
      GX0 = 84; GX1 = 604; GY0 = 104; GY1 = 372;
      var g = K.chart(ctx, { light: true, x: 30, y: 96, w: 586, h: 300, x0: Y0, x1: Y1, y0: -0.4, y1: 1.5, xt: 6, yt: 4, pl: 54, pb: 24, pt: 8, pr: 12, xf: function (v2) { return String(Math.round(v2)); }, yf: function () { return ""; } });
      GX0 = g.L; GX1 = g.R; GY0 = g.T; GY1 = g.B;
      [0, 0.5, 1.0, 1.5].forEach(function (c2) { ctx.strokeStyle = c2 === 0 ? LT.line : LT.grid; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(g.L, Y(c2)); ctx.lineTo(g.R, Y(c2)); ctx.stroke(); lt(ctx, (c2 > 0 ? "+" : "") + c2.toFixed(1), g.L - 6, Y(c2) + 4, { s: 10.5, a: "right" }); });
      lt(ctx, "기온 편차(℃)", g.L - 50, 92, { s: 11 });
      /* 관측 기온 줄무늬 */
      for (var ys = Y0; ys <= Y1; ys++) { ctx.fillStyle = stripeCol(OBS[ys - Y0] - BO); ctx.fillRect(X(ys), g.B + 26, (g.R - g.L) / (Y1 - Y0) + .6, 12); }
      lt(ctx, "해마다의 관측 기온 (파랑 → 빨강)", g.L, g.B + 56, { s: 11 });
      /* 화산 표시 */
      VOLC.forEach(function (o) {
        ctx.strokeStyle = "rgba(112,72,232,.45)"; ctx.lineWidth = 1.3; ctx.setLineDash([3, 4]);
        ctx.beginPath(); ctx.moveTo(X(o[0]), g.T); ctx.lineTo(X(o[0]), g.B); ctx.stroke(); ctx.setLineDash([]);
        K.t(ctx, "🌋", X(o[0]), g.T + 14, { s: 11, a: "center" });
      });
      var sm = 0;
      for (i = 0; i < 30; i++) sm += model(Y0 + i);
      sm /= 30;
      var po = [], pm = [];
      for (y = Y0; y <= Y1; y++) { po.push([y, obs(y) - BO]); pm.push([y, model(y) - sm]); }
      K.plot(ctx, g, po, LT.ink, { light: true, w: 3.2 });
      if (anyOn()) K.plot(ctx, g, pm, LT.blue, { light: true, w: 2.8 });
      K.pill(ctx, "관측", X(2020) - 4, Y(obs(2020) - BO) - 12, { s: 11, a: "right", c: "#ffffff" });
      if (anyOn()) K.pill(ctx, "모형", X(2020) - 4, clamp(Y(model(2020) - sm) + 22, g.T + 20, g.B - 4), { s: 11, a: "right", c: "#a9dcff" });

      /* ── 오른쪽 흰 카드: 맞춤도 ── */
      var RX = 636, RW = W - RX - 12, cxr = RX + RW / 2, x0 = RX + 18, x1 = W - 30;
      K.card(ctx, RX, 12, RW, H - 24, "맞춤도");
      var pc = pct >= 90 ? LT.green : (pct <= 40 ? LT.red : LT.yellow);
      ctx.lineCap = "round"; ctx.lineWidth = 14; ctx.strokeStyle = "#e3e9f1";
      ctx.beginPath(); ctx.arc(cxr, 112, 52, Math.PI * .75, Math.PI * 2.25); ctx.stroke();
      if (anyOn()) { ctx.strokeStyle = pc; ctx.beginPath(); ctx.arc(cxr, 112, 52, Math.PI * .75, Math.PI * (.75 + 1.5 * pct / 100)); ctx.stroke(); }
      ctx.lineCap = "butt";
      K.t(ctx, anyOn() ? pct.toFixed(1) + "%" : "—", cxr, 120, { s: 22, a: "center", w: "900", c: anyOn() ? pc : LT.mute });
      K.tip(ctx, anyOn() ? (pct >= 90 ? "관측과 거의 같다" : (pct <= 40 ? "전혀 맞지 않는다" : "아직 어긋난다")) : "요인을 켜 보세요", x0 - 4, 176, RW - 28, anyOn() ? (pct >= 90 ? true : false) : null);
      lt(ctx, "켠 요인", x0, 238, { s: 11.5, w: "800" });
      K.row(ctx, "자연 (태양·화산)", on.nat ? "● 켬" : "○ 끔", x0, x1, 264, on.nat ? LT.violet : LT.dim);
      K.row(ctx, "온실 기체", on.ghg ? "● 켬" : "○ 끔", x0, x1, 290, on.ghg ? LT.orange : LT.dim);
      K.row(ctx, "인위 에어로졸", on.aer ? "● 켬" : "○ 끔", x0, x1, 316, on.aer ? LT.blue : LT.dim);
      K.row(ctx, "CO₂ (2020)", co2(2020).toFixed(0) + " ppm", x0, x1, 352, LT.ink);
      lt(ctx, "검은 선 = 관측 · 파란 선 = 모형", x0, 392, { s: 11 });
      lt(ctx, "🌋 1902 · 1912 · 1963 · 1982 · 1991", x0, 412, { s: 11 });
      lt(ctx, "자연 요인은 흔들 뿐, 계속 밀어 올리지 못함", x0, 438, { s: 10.5, c: LT.violet, w: "800" });

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
    /* 블록 모형: 지표 한 판 + 그 위에 덮인 '대기 담요'(흡수율이 클수록 짙은 초록 판). 햇빛(노랑)은 내려오고, 일부는 반사(흰색),
       지표가 내보내는 적외선(빨강)은 담요에 붙잡히고, 담요가 다시 내려보낸다(보라). 오른쪽 흰 카드 = 지표 온도 판정 */
    var I = K.iso({ ox: 290, oy: 250, s: 0.62, L: 360, D: 200 }), ZG = 14, ZA = 150, ZT = 250;
    function ray3(x, y, za, zb, col, w, dots) {
      var a = I.P(x, y, za), b = I.P(x, y, zb);
      arr(ctx, a, b, "#ffffff", w + 3, 12); arr(ctx, a, b, col, w, 10);
      for (var k = 0; k < (dots || 2); k++) { var u = ((tg * 0.02) + k / (dots || 2)) % 1, p = I.P(x, y, za + (zb - za) * u); K.glow(ctx, p.x, p.y, 2, "rgba(255,255,255,.95)", 2.4); }
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      var T = Ts(), i, BX = [0, 520];
      var fc = I.P(I.L / 2, I.D / 2, 0);
      K.studio(ctx, 0, 0, W, H, { x: fc.x, y: fc.y + 12, rx: 250, ry: 60 });
      /* 지표 판: 따뜻할수록 붉은 흙, 반사율이 크면 눈·얼음 */
      var hot = clamp((T + 20) / 60, 0, 1), top = alb > 0.36 ? mix("#9fb27a", "#f2f6fa", (alb - 0.36) * 5) : mix("#7fa35a", "#c8a46a", hot);
      I.box(ctx, 0, 0, 0, I.L, I.D, ZG, top, "#6d5a44", "#56473a");
      [[40, 40], [90, 150], [300, 60], [320, 160]].forEach(function (q) { I.tree(ctx, q[0], q[1], ZG, 1.3); });
      I.house(ctx, 200, 120, ZG, 16, 14, 11); I.house(ctx, 230, 150, ZG, 14, 12, 9);
      /* 태양 */
      var sp = I.P(20, 20, ZT + 20); K.sun(ctx, sp.x, sp.y, 14); K.planet(ctx, sp.x, sp.y, 15, "#ffd24a", "#f08c00");
      /* 태양 복사 */
      for (i = 0; i < 3; i++) ray3(50 + i * 30, 50 + i * 18, ZT, ZG + 2, "#f59f00", 3, 2);
      /* 반사 */
      var nref = Math.max(1, Math.round(alb * 10));
      for (i = 0; i < nref; i++) ray3(150 + i * 10, 40 + i * 6, ZG + 2, ZT, "#adb5bd", 2.2, 1);
      /* 대기 담요(아래 판) */
      I.plane(ctx, ZA - 12, "rgba(15,159,118," + (0.06 + 0.22 * eps).toFixed(3) + ")", "rgba(15,159,118,.5)");
      /* 지구 복사(적외선) */
      for (i = 0; i < 4; i++) { var blocked = (i + 0.5) / 4 <= eps, xx = 220 + i * 26, yy = 70 + i * 22; ray3(xx, yy, ZG + 2, blocked ? ZA - 14 : ZT, "#e03131", 3, 2); if (blocked) { var bp = I.P(xx, yy, ZA - 8); K.glow(ctx, bp.x, bp.y, 4, "rgba(224,49,49,.7)", 2.6); } }
      /* 재복사 */
      var nre = Math.round(eps * 4);
      for (i = 0; i < nre; i++) ray3(300 + i * 14, 110 + i * 16, ZA - 14, ZG + 2, "#7048e8", 3, 2);
      /* 대기 담요(윗 판) */
      I.plane(ctx, ZA + 12, "rgba(15,159,118," + (0.05 + 0.2 * eps).toFixed(3) + ")", "rgba(15,159,118,.6)");
      var lp = I.P(0, I.D, ZA + 12);
      K.pill(ctx, "대기 (적외선 흡수율 " + eps.toFixed(2) + ")", lp.x - 8, lp.y + 4, { s: 11.5, a: "right", c: "#9ff0cf", box: BX });
      var r1 = I.P(80, 86, ZT - 30), r2 = I.P(160 + nref * 5, 40 + nref * 3, ZT - 10), r3 = I.P(259, 136, 60), r4 = I.P(320, 130, 60);
      K.pill(ctx, "태양 복사", r1.x - 14, r1.y, { s: 11.5, a: "right", c: "#ffd35a", box: BX });
      K.pill(ctx, "반사 " + (alb * 100).toFixed(0) + "%", r2.x + 12, r2.y, { s: 11.5, c: "#ffffff", box: BX });
      K.pill(ctx, "지구 복사(적외선)", r3.x - 10, r3.y + 34, { s: 11.5, a: "right", c: "#ffb3b3", box: BX });
      if (nre > 0) K.pill(ctx, "재복사", r4.x + 16, r4.y + 20, { s: 11.5, c: "#d6c8ff", box: BX });
      var gp = I.P(I.L, I.D * 0.5, 0);
      K.pill(ctx, "지표 " + T.toFixed(1) + " ℃", gp.x + 8, gp.y + 18, { s: 12, c: T >= 20 ? "#ffc078" : (T <= 5 ? "#a9dcff" : "#ffffff"), box: BX });
      bigHead(ctx, "지표 " + T.toFixed(1) + " ℃", "온실 효과 +" + green().toFixed(1) + " ℃ · 대기가 없다면 " + Tno().toFixed(1) + " ℃", T >= 20 ? "#ffc078" : (T <= 5 ? "#a9dcff" : "#ffffff"), 18, 42);
      K.warn(ctx, 16, H - 12, "⚠ 대기를 담요 한 장으로 본 모형", "left");

      /* ── 오른쪽 흰 카드 ── */
      var RX = 530, RW = W - RX - 12, x0 = RX + 18, x1 = W - 30;
      K.card(ctx, RX, 12, RW, H - 24, "지표 온도");
      var tc = T >= 20 ? LT.orange : (T <= 5 ? LT.blue : LT.ink);
      K.t(ctx, T.toFixed(1) + " ℃", x0, 82, { s: 32, w: "900", c: tc });
      function TX(c) { return x0 + clamp((c + 40) / 100, 0, 1) * (x1 - x0); }
      var tb = ctx.createLinearGradient(x0, 0, x1, 0); tb.addColorStop(0, "#74c0fc"); tb.addColorStop(.5, "#63e6be"); tb.addColorStop(1, "#ff8787");
      ctx.fillStyle = tb; ctx.beginPath(); ctx.roundRect(x0, 100, x1 - x0, 10, 5); ctx.fill();
      [[Tno(), LT.blue], [T, tc]].forEach(function (q) { ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(TX(q[0]), 105, 6.5, 0, 6.2832); ctx.fill(); ctx.strokeStyle = q[1]; ctx.lineWidth = 2.6; ctx.stroke(); });
      lt(ctx, "−40", x0, 128, { s: 10.5 }); lt(ctx, "+60 ℃", x1, 128, { s: 10.5, a: "right" });
      K.row(ctx, "대기가 없다면", Tno().toFixed(1) + " ℃", x0, x1, 168, LT.blue);
      K.row(ctx, "온실 효과의 크기", "+" + green().toFixed(1) + " ℃", x0, x1, 196, green() >= 40 ? LT.orange : (green() < 2 ? LT.blue : LT.green));
      K.row(ctx, "흡수한 태양 복사", absorbed().toFixed(0) + " W/m²", x0, x1, 224, absorbed() < 200 ? LT.blue : LT.yellow);
      K.tip(ctx, green() < 2 ? "온실 효과가 사라졌습니다" : (green() >= 40 ? "담요가 아주 두꺼워졌습니다" : (absorbed() < 200 ? "받아들이는 햇빛이 줄었습니다" : "적외선을 붙잡아 균형 온도가 오른다")), x0 - 4, 244, RW - 28, null);
      lt(ctx, "적외선을 붙잡을수록 지표는 더 뜨거운", x0, 312, { s: 11.5, c: LT.ink });
      lt(ctx, "상태에서 균형을 이룹니다 = 온실 효과", x0, 330, { s: 11.5, c: LT.ink });
      lt(ctx, "태양 상수 1361 W/m²", x0, 366, { s: 11 });
      lt(ctx, "슈테판–볼츠만 법칙으로 계산", x0, 384, { s: 11 });

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

    /* 밝은 스튜디오: 왼쪽 흰 카드 = 배출 경로 카드 그래프(색칠한 넓이 = 누적 배출), 오른쪽 흰 카드 = 판정 + 유리 온도계 미니어처 */
    function draw() {
      ctx.clearRect(0, 0, W, H);
      var C = cum(), T = T2100(), y;
      K.studio(ctx, 0, 0, W, H);
      var tc = T < 1.5 ? LT.green : (T < 2.0 ? "#e67700" : LT.red);
      bigHead(ctx, "2100년 +" + T.toFixed(2) + " ℃", "해마다 " + rate.toFixed(2) + " % 감축" + (ccs ? " · 2040년부터 해마다 50억 t 포집" : ""), T < 1.5 ? "#9ff0cf" : (T < 2.0 ? "#ffe066" : "#ffb3b3"), 18, 42);
      K.card(ctx, 12, 84, 588, H - 96, "");
      var g = K.chart(ctx, { light: true, x: 22, y: 100, w: 570, h: 290, x0: Y0, x1: Y1, y0: -10, y1: 50, xt: 3, yt: 6, pl: 62, pb: 26, pt: 12, pr: 22,
        xf: function (v2) { return String(Math.round(v2)); }, yf: function (v2) { return String(Math.round(v2 * 10)); } });
      GX0 = g.L; GX1 = g.R; GY0 = g.T; GY1 = g.B;
      lt(ctx, "연간 배출량 (억 t CO₂ / 년)", g.L - 54, 100, { s: 11 });
      ctx.strokeStyle = "rgba(15,159,118,.8)"; ctx.lineWidth = 1.6; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(g.L, g.Y(0)); ctx.lineTo(g.R, g.Y(0)); ctx.stroke(); ctx.setLineDash([]);
      K.pill(ctx, "0 — 탄소 중립", g.R - 6, g.Y(0) - 8, { s: 10.5, a: "right", c: "#9ff0cf" });
      var fg = ctx.createLinearGradient(0, g.Y(40), 0, g.Y(0)); fg.addColorStop(0, "rgba(232,89,12,.45)"); fg.addColorStop(1, "rgba(232,89,12,.10)");
      ctx.fillStyle = fg; ctx.beginPath(); ctx.moveTo(g.X(Y0), g.Y(0));
      for (y = Y0; y <= Y1; y++) ctx.lineTo(g.X(y), g.Y(emit(y)));
      ctx.lineTo(g.X(Y1), g.Y(0)); ctx.closePath(); ctx.fill();
      var pts = []; for (y = Y0; y <= Y1; y++) pts.push([y, emit(y)]);
      K.plot(ctx, g, pts, LT.orange, { light: true, w: 3.2 });
      K.pill(ctx, "색칠한 넓이 = 누적 배출량", g.X(2062), g.Y(30), { s: 12, a: "center", c: "#ffc078" });
      if (ccs) K.pill(ctx, "2040~ 포집 50억 t/년", g.X(2040) + 6, g.Y(-4) + 4, { s: 10.5, c: "#a9dcff" });
      lt(ctx, "기온 상승은 누적 배출량에 거의 비례 → 목표 온도 = 탄소 예산", 30, H - 26, { s: 11.5, c: LT.ink, w: "800" });
      /* ── 오른쪽 흰 카드 ── */
      var RX = 612, RW = W - RX - 12, x0 = RX + 18, x1 = W - 30;
      K.card(ctx, RX, 12, RW, H - 24, "2100년 기온 상승");
      K.t(ctx, "+" + T.toFixed(2) + " ℃", x0, 82, { s: 32, w: "900", c: tc });
      K.tip(ctx, T < 1.5 ? "✅ 1.5 ℃ 목표 안" : (T < 2.0 ? "2 ℃ 아래 — 1.5는 아직" : "목표를 넘었습니다"), x0 - 4, 96, RW - 28, T < 1.5 ? true : (T < 2.0 ? null : false));
      K.row(ctx, "누적 배출", Math.round(C * 10).toLocaleString() + " 억 t", x0, x1, 162, LT.orange);
      K.row(ctx, "지금까지", "+" + NOW.toFixed(1) + " ℃", x0, x1, 188);
      K.row(ctx, "누적 1조 t마다", "+0.45 ℃", x0, x1, 214);
      /* 유리 온도계 */
      var bx = RX + 92, top = 246, bot = 388;
      function TY(v2) { return bot - clamp(v2 / 3.5, 0, 1) * (bot - top); }
      var glass = ctx.createLinearGradient(bx - 14, 0, bx + 14, 0); glass.addColorStop(0, "#ffffff"); glass.addColorStop(.5, "#e9eef5"); glass.addColorStop(1, "#b8c4d4");
      ctx.save(); ctx.shadowColor = "rgba(20,30,60,.25)"; ctx.shadowBlur = 10; ctx.shadowOffsetX = 5;
      ctx.fillStyle = glass; ctx.beginPath(); ctx.roundRect(bx - 14, top - 12, 28, bot - top + 22, 14); ctx.fill();
      ctx.beginPath(); ctx.arc(bx, bot + 22, 24, 0, 6.2832); ctx.fill(); ctx.restore();
      var mg = ctx.createLinearGradient(0, bot, 0, top); mg.addColorStop(0, "#20c997"); mg.addColorStop(.45, "#fcc419"); mg.addColorStop(1, "#f03e3e");
      ctx.fillStyle = mg; ctx.beginPath(); ctx.roundRect(bx - 6, TY(T), 12, bot - TY(T) + 18, 6); ctx.fill();
      K.planet(ctx, bx, bot + 22, 17, T < 1.5 ? "#38d9a9" : (T < 2.0 ? "#ffd43b" : "#ff6b6b"), T < 1.5 ? "#087f5b" : (T < 2.0 ? "#e67700" : "#c92a2a"));
      ctx.fillStyle = "rgba(255,255,255,.75)"; ctx.fillRect(bx - 9, top, 3, bot - top - 4);
      [[1.5, LT.green, "1.5 ℃ 목표"], [2.0, "#e67700", "2 ℃"], [3.0, LT.red, "3 ℃"]].forEach(function (m) {
        ctx.strokeStyle = m[1]; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(bx + 16, TY(m[0])); ctx.lineTo(bx + 30, TY(m[0])); ctx.stroke();
        lt(ctx, m[2], bx + 36, TY(m[0]) + 4, { s: 11.5, c: m[1], w: "900" });
      });

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

    /* 블록 모형: 바다(왼쪽 위)와 매립지 도시(오른쪽 아래)를 잘라 낸 블록. 해수면이 오르고, 폭풍 해일 높이가 방조제를 넘으면 도시가 잠긴다.
       앞면 = 단면(지금의 해수면 · 2100년 해수면 · 해일 높이 · 방조제). 오른쪽 흰 카드 = 판정 */
    var I = K.iso({ ox: 250, oy: 196, s: 0.62, L: 420, D: 190 }), ZB = 10, Z0 = 96, XW = 190, CM = 0.4;   /* CM: 1 cm → 그림 단위(크게 과장) */
    var BLD = (function () { var R = K.rng(33), o = [], i, j; for (i = 0; i < 4; i++) for (j = 0; j < 3; j++) o.push([XW + 30 + i * 52 + R() * 8, 18 + j * 58 + R() * 8, 22 + R() * 10, 20 + R() * 8, 20 + R() * 46]); return o.sort(function (p, q) { return (p[0] + p[1]) - (q[0] + q[1]); }); })();
    function draw() {
      ctx.clearRect(0, 0, W, H);
      var rs = riseCm(), nd = needCm(), i, BX = [0, 560];
      var zSea = Z0 + rs * CM, zSurge = zSea + SURGE * CM, zWall = Z0 + wall * CM, flood = wall < nd;
      var fc = I.P(I.L / 2, I.D / 2, 0);
      K.studio(ctx, 0, 0, W, H, { x: fc.x, y: fc.y + 14, rx: 280, ry: 66 });
      function ground(u) { return u < XW - 30 ? ZB + 20 : (u < XW ? ZB + 20 + (u - XW + 30) / 30 * (Z0 - ZB - 20) : Z0); }
      /* 앞면·오른쪽 면 */
      I.face(ctx, "front", function (Lw) {
        var g = ctx.createLinearGradient(0, 0, 0, zSea); g.addColorStop(0, "#0a2350"); g.addColorStop(1, "#3a8fd0");
        ctx.fillStyle = g; ctx.fillRect(0, 0, XW, zSea);
        I.profile(ctx, "front", ground, 0);
        var rg = ctx.createLinearGradient(0, 0, 0, Z0); rg.addColorStop(0, "#3e3128"); rg.addColorStop(1, "#a08058"); ctx.fillStyle = rg; ctx.fill();
        if (flood) { ctx.fillStyle = "rgba(60,140,220,.55)"; ctx.fillRect(XW, Z0, Lw - XW, zSurge - Z0); }
        ctx.strokeStyle = "rgba(255,255,255,.9)"; ctx.lineWidth = 1.4; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.moveTo(0, Z0); ctx.lineTo(Lw, Z0); ctx.stroke();
        ctx.strokeStyle = "#e03131"; ctx.lineWidth = 2; ctx.setLineDash([7, 4]); ctx.beginPath(); ctx.moveTo(0, zSurge); ctx.lineTo(Lw, zSurge); ctx.stroke(); ctx.setLineDash([]);
      });
      I.face(ctx, "right", function (Lw) { var rg = ctx.createLinearGradient(0, 0, 0, Z0); rg.addColorStop(0, "#3e3128"); rg.addColorStop(1, "#8c6c48"); ctx.fillStyle = rg; ctx.fillRect(0, 0, Lw, Z0); if (flood) { ctx.fillStyle = "rgba(60,140,220,.5)"; ctx.fillRect(0, Z0, Lw, zSurge - Z0); } });
      I.shade(ctx, "front", ground); I.shade(ctx, "right", function () { return Z0; });
      /* 바다 윗면 */
      I.plane(ctx, zSea, "rgba(70,160,230,.85)", "rgba(255,255,255,.8)", 0, XW, 0, I.D);
      ctx.strokeStyle = "rgba(255,255,255,.55)"; ctx.lineWidth = 1;
      for (i = 0; i < 8; i++) { var gx = 14 + (i * 53) % 160, gy = 12 + (i * 41) % 166, ph = Math.sin(t * 0.12 + i), s1 = I.P(gx, gy, zSea), s2 = I.P(gx + 14, gy, zSea); ctx.beginPath(); ctx.moveTo(s1.x, s1.y + ph); ctx.quadraticCurveTo((s1.x + s2.x) / 2, s1.y - 2 + ph, s2.x, s2.y + ph); ctx.stroke(); }
      /* 매립지 윗면 */
      I.plane(ctx, Z0, "#a7b98a", "rgba(255,255,255,.6)", XW, I.L, 0, I.D);
      for (i = 0; i < 3; i++) I.plane(ctx, Z0 + 0.2, "#c3c8cf", null, XW + 4, I.L, 44 + i * 58, 52 + i * 58);
      /* 방조제 */
      if (wall > 0) I.box(ctx, XW - 8, 0, ZB, XW + 4, I.D, zWall, okWall() ? "#c3fae8" : (flood ? "#ffc9c9" : "#ffec99"), "#bfc6d2", "#8e97a8");
      /* 건물(창문 불빛) */
      BLD.forEach(function (b) {
        I.box(ctx, b[0], b[1], Z0, b[0] + b[2], b[1] + b[3], Z0 + b[4], "#eef1f6", "#c9d1de", "#97a3b6");
        for (var wz = Z0 + 6; wz < Z0 + b[4] - 4; wz += 8) { var w1 = I.P(b[0] + b[2] * 0.3, b[1] + b[3], wz), w2 = I.P(b[0] + b[2] * 0.7, b[1] + b[3], wz); ctx.strokeStyle = "rgba(255,200,90,.8)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(w1.x, w1.y); ctx.lineTo(w2.x, w2.y); ctx.stroke(); }
      });
      /* 침수: 도시 위 물 */
      if (flood) I.plane(ctx, zSurge, "rgba(60,140,220,.45)", "rgba(255,255,255,.7)", XW + 4, I.L, 0, I.D);
      I.edges(ctx, ground(I.L), Z0);
      I.label(ctx, 30, I.D, zSea, "2100년 해수면 (+" + rs.toFixed(0) + " cm)", -16, -40, "#a9dcff", BX);
      I.label(ctx, 60, I.D, Z0, "지금의 해수면", -20, 54, "#ffffff", BX);
      I.label(ctx, I.L, I.D * 0.6, zSurge, "폭풍 해일 높이 (해수면 + 60 cm)", 14, -40, "#ffb3b3", BX);
      if (wall > 0) I.label(ctx, XW - 2, 10, zWall, "방조제 " + wall + " cm", 10, -30, okWall() ? "#9ff0cf" : (flood ? "#ffb3b3" : "#ffe066"), BX);
      if (flood) { var fp = I.P(XW + 120, I.D * 0.5, zSurge + 30); K.pill(ctx, "도시 침수", fp.x, fp.y, { s: 15, a: "center", c: "#ffb3b3" }); }
      bigHead(ctx, okWall() ? "✅ 꼭 맞는 방조제" : (flood ? "도시가 잠긴다" : "너무 높은 방조제"), "기온 +" + dT.toFixed(1) + " ℃ → 해수면 +" + rs.toFixed(0) + " cm", okWall() ? "#9ff0cf" : (flood ? "#ffb3b3" : "#ffe066"), 18, 42);
      K.warn(ctx, 16, H - 12, "⚠ 높이는 크게 과장", "left");

      /* ── 오른쪽 흰 카드 ── */
      var RX = 584, RW = W - RX - 12, x0 = RX + 18, x1 = W - 30, wc = okWall() ? LT.green : (flood ? LT.red : "#e67700");
      K.card(ctx, RX, 12, RW, H - 24, "판정");
      K.row(ctx, "기온 상승", "+" + dT.toFixed(1) + " ℃", x0, x1, 62, LT.orange);
      K.row(ctx, "해수면 상승", rs.toFixed(0) + " cm", x0, x1, 90, rs >= 70 ? LT.red : (rs < 35 ? LT.green : LT.blue));
      K.row(ctx, "필요한 방조제", nd.toFixed(0) + " cm 이상", x0, x1, 118, "#e67700");
      K.row(ctx, "세운 방조제", wall + " cm", x0, x1, 146, wc);
      var gx = x0, gw = x1 - x0, gy = 172;
      function GX(cm) { return gx + clamp(cm / 160, 0, 1) * gw; }
      ctx.fillStyle = "#e3e9f1"; ctx.beginPath(); ctx.roundRect(gx, gy, gw, 12, 6); ctx.fill();
      ctx.fillStyle = "rgba(15,159,118,.35)"; ctx.fillRect(GX(nd), gy - 4, GX(nd + 40) - GX(nd), 20);
      ctx.fillStyle = wc; ctx.beginPath(); ctx.roundRect(gx, gy, Math.max(6, GX(wall) - gx), 12, 6); ctx.fill();
      lt(ctx, "0", gx, gy + 30, { s: 10.5 }); lt(ctx, "160 cm", gx + gw, gy + 30, { s: 10.5, a: "right" });
      lt(ctx, "알맞은 구간", (GX(nd) + GX(nd + 40)) / 2, gy - 10, { s: 10.5, a: "center", c: LT.green, w: "800" });
      K.tip(ctx, okWall() ? "✅ 꼭 맞게 세웠습니다" : (flood ? "❌ 너무 낮습니다 — 해일에 잠깁니다" : "⚠ 40 cm 넘게 높음 — 예산 낭비"), x0 - 4, 222, RW - 28, okWall());
      lt(ctx, "바닷물은 데워지면 부피가 늘고(열팽창),", x0, 290, { s: 11.5, c: LT.ink });
      lt(ctx, "육지의 빙하가 녹아 물이 더해집니다.", x0, 308, { s: 11.5, c: LT.ink });
      lt(ctx, "연안 도시 = 지반이 지금의 해수면", x0, 340, { s: 11 });
      lt(ctx, "높이인 매립지", x0, 358, { s: 11 });

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
