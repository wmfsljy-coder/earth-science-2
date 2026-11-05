/* =========================================================================
   그림 도구(sthKit) — 시뮬레이션 캔버스를 '무대' 위에 또렷하고 실감 나게 그린다.
   theme.js 다음, episodes.js 앞에 불러온다. 모든 과목 저장소에 같은 사본.

     var K = window.sthKit;
     K.stage(ctx, x, y, w, h, "space")     // 무대: space 우주 · lab 실험실 · sky 낮 하늘 · ocean 바다 · earth 땅속 · night 어두운 기본
     K.pill(ctx, "태양", x, y, { a: "center", c: K.C.yellow })   // 반투명 바탕 이름표
     K.glow(ctx, x, y, r)  K.sun()  K.earth()  K.planet()  K.spikes()
     K.wedge()  K.line()  K.arrow()  K.bracket()  K.warn()
     var g = K.chart(ctx, { x, y, w, h, x0, x1, y0, y1, xl: "시간(s)", yl: "속도(m/s)", xt: 5, yt: 4 });
     g.X(값) g.Y(값) 로 좌표 바꾸기, K.plot(ctx, g, [[x,y],…], K.C.blue)
     K.animate(canvas, function (dt) { … })   // setTimeout 으로 약 30번/초. 캔버스가 보일 때만 부른다.
     K.iso({ … })  K.studio()  K.bigText()      // 아이소메트릭 블록 모형(땅·바다·대기 단면) — 아래 머리말 참고

   색은 story.css 의 --stage-* 토큰에서 읽는다(무대는 라이트·다크 모드 모두 같은 어두운 색).
   그림 안의 모든 글자는 pill 이나 t 로 쓰고, 화면(0~900, 0~height) 밖으로 나가지 않게 한다.
   ========================================================================= */
(function () {
  "use strict";
  var FONT = "'Gothic A1','Segoe UI',sans-serif";
  var REDUCE = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  function tok(name, fb) {
    var v = "";
    try { v = getComputedStyle(document.documentElement).getPropertyValue(name).trim(); } catch (e) {}
    return v || fb;
  }
  var C = {};
  function loadColors() {
    C.ink = tok("--stage-ink", "#e8ecff");
    C.mute = tok("--stage-mute", "#9fb0e0");
    C.dim = tok("--stage-dim", "#6f7fb0");
    C.yellow = tok("--stage-yellow", "#ffd36b");
    C.blue = tok("--stage-blue", "#7fd3ff");
    C.green = tok("--stage-green", "#3fd3a3");
    C.red = tok("--stage-red", "#ff6b81");
    C.violet = tok("--stage-violet", "#b69cff");
    C.orange = tok("--stage-orange", "#ffb35c");
    C.pill = tok("--stage-pill", "rgba(9,12,34,.78)");
    C.grid = tok("--stage-grid", "rgba(160,175,255,.12)");
    C.line = tok("--stage-line", "rgba(200,210,255,.45)");
  }
  loadColors();

  function rng(seed) {
    var s = (seed || 1) % 2147483647; if (s <= 0) s += 2147483646;
    return function () { s = s * 16807 % 2147483647; return (s - 1) / 2147483646; };
  }
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }

  var K = {
    C: C, FONT: FONT, REDUCE: REDUCE, rng: rng, clamp: clamp, refresh: loadColors,

    /* 글자 */
    t: function (ctx, s, x, y, o) {
      o = o || {};
      ctx.font = (o.w || "700") + " " + (o.s || 12) + "px " + FONT;
      ctx.fillStyle = o.c || C.ink; ctx.textAlign = o.a || "left"; ctx.textBaseline = "alphabetic";
      ctx.fillText(s, x, y);
    },
    /* 반투명 바탕 이름표. (x, y) 는 글자 기준선, a 로 left·center·right */
    pill: function (ctx, s, x, y, o) {
      o = o || {};
      var sz = o.s || 12;
      ctx.font = (o.w || "800") + " " + sz + "px " + FONT;
      var w = ctx.measureText(s).width, px = 7, h = sz + 9;
      var x0 = o.a === "center" ? x - w / 2 : o.a === "right" ? x - w : x;
      /* 넘치지 않게: o.box = [왼쪽, 오른쪽] (기본은 캔버스 폭 안) */
      var cw = ctx.canvas && ctx.canvas._w ? ctx.canvas._w : 900, lo = (o.box ? o.box[0] : 0) + px + 2, hi = (o.box ? o.box[1] : cw) - px - 2;
      if (x0 < lo) x0 = lo; if (x0 + w > hi) x0 = Math.max(lo, hi - w);
      ctx.fillStyle = o.bg || C.pill;
      ctx.beginPath(); ctx.roundRect(x0 - px, y - sz - 2, w + px * 2, h, 7); ctx.fill();
      if (o.line) { ctx.strokeStyle = o.line; ctx.lineWidth = 1; ctx.stroke(); }
      ctx.fillStyle = o.c || C.ink; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
      ctx.fillText(s, x0, y);
      return { x: x0 - px, y: y - sz - 2, w: w + px * 2, h: h };
    },
    /* 무대 */
    stage: function (ctx, x, y, w, h, kind, o) {
      o = o || {};
      var r = o.r == null ? 14 : o.r, R = rng(o.seed || 7), i, g;
      ctx.save(); ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.clip();
      kind = kind || "night";
      if (kind === "sky") {
        g = ctx.createLinearGradient(x, y, x, y + h); g.addColorStop(0, "#2d6fc0"); g.addColorStop(.7, "#8cc4ef"); g.addColorStop(1, "#d7ecfa");
        ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
      } else if (kind === "ocean") {
        g = ctx.createLinearGradient(x, y, x, y + h); g.addColorStop(0, "#0d4f86"); g.addColorStop(1, "#04142e");
        ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
        for (i = 0; i < 9; i++) {
          var ox = x + R() * w, oy = y + R() * h * .5, orr = 40 + R() * 90, og = ctx.createRadialGradient(ox, oy, 0, ox, oy, orr);
          og.addColorStop(0, "rgba(120,210,255,.10)"); og.addColorStop(1, "rgba(120,210,255,0)"); ctx.fillStyle = og; ctx.fillRect(x, y, w, h);
        }
      } else if (kind === "earth") {
        g = ctx.createLinearGradient(x, y, x, y + h); g.addColorStop(0, "#2a1f1a"); g.addColorStop(1, "#120c0a");
        ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
      } else {
        g = ctx.createLinearGradient(x, y, x + w * .3, y + h);
        if (kind === "lab") { g.addColorStop(0, "#0e1530"); g.addColorStop(1, "#1a2347"); }
        else { g.addColorStop(0, "#070a22"); g.addColorStop(1, "#171c4a"); }
        ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
      }
      if (kind === "space") {
        for (i = 0; i < 7; i++) {
          var cx = x + w * (i / 6) + (R() - .5) * 40, cy = y + h * (.95 - .75 * i / 6) + (R() - .5) * 40, rr = Math.max(w, h) * (.18 + R() * .1);
          var rg = ctx.createRadialGradient(cx, cy, 0, cx, cy, rr);
          rg.addColorStop(0, "rgba(150,130,230,.13)"); rg.addColorStop(.5, "rgba(110,120,220,.05)"); rg.addColorStop(1, "rgba(110,120,220,0)");
          ctx.fillStyle = rg; ctx.fillRect(x, y, w, h);
        }
        var n = Math.round(w * h / 1500);
        for (i = 0; i < n; i++) {
          var sx = x + R() * w, sy = y + R() * h, m = R(), rad = m > .985 ? 1.7 : m > .9 ? 1.15 : .65;
          ctx.globalAlpha = .3 + R() * .6;
          ctx.fillStyle = m > .95 ? (R() > .5 ? "#ffe2b8" : "#c9dcff") : "#ffffff";
          ctx.beginPath(); ctx.arc(sx, sy, rad, 0, 6.2832); ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
      if (kind === "lab" || (o.grid && kind !== "space")) {
        ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
        var step = o.gridStep || 30;
        for (var gx = x + step; gx < x + w; gx += step) { ctx.beginPath(); ctx.moveTo(gx, y); ctx.lineTo(gx, y + h); ctx.stroke(); }
        for (var gy = y + step; gy < y + h; gy += step) { ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x + w, gy); ctx.stroke(); }
        var vg = ctx.createRadialGradient(x + w / 2, y + h / 2, Math.min(w, h) * .2, x + w / 2, y + h / 2, Math.max(w, h) * .75);
        vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,10,.35)"); ctx.fillStyle = vg; ctx.fillRect(x, y, w, h);
      }
      ctx.restore();
      if (o.title) K.pill(ctx, o.title, x + 16, y + 28, { s: 13, c: o.titleColor || C.blue });
    },
    /* 빛나는 점(별·입자·전구) */
    glow: function (ctx, x, y, r, col, halo) {
      var hr = r * (halo || 4.5), g = ctx.createRadialGradient(x, y, 0, x, y, hr);
      g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(r / hr, col || "rgba(255,240,200,.95)");
      g.addColorStop(Math.min(.99, r / hr * 2.2), "rgba(255,220,160,.22)"); g.addColorStop(1, "rgba(255,220,160,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, hr, 0, 6.2832); ctx.fill();
    },
    spikes: function (ctx, x, y, len, a) {
      ctx.save(); ctx.globalAlpha = a == null ? .5 : a; ctx.strokeStyle = "#fff4d6"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x - len, y); ctx.lineTo(x + len, y); ctx.moveTo(x, y - len); ctx.lineTo(x, y + len); ctx.stroke(); ctx.restore();
    },
    sun: function (ctx, x, y, r) {
      var g = ctx.createRadialGradient(x, y, 0, x, y, r * 3.4);
      g.addColorStop(0, "#fffbe8"); g.addColorStop(.22, "#ffd25a"); g.addColorStop(.3, "rgba(255,170,40,.55)"); g.addColorStop(1, "rgba(255,150,30,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 3.4, 0, 6.2832); ctx.fill();
    },
    earth: function (ctx, x, y, r) {
      var g = ctx.createRadialGradient(x - r * .4, y - r * .4, r * .1, x, y, r);
      g.addColorStop(0, "#bfe6ff"); g.addColorStop(.45, "#2f86e0"); g.addColorStop(1, "#123a8a");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill();
      ctx.fillStyle = "rgba(90,190,110,.85)";
      ctx.beginPath(); ctx.ellipse(x + r * .15, y - r * .1, r * .38, r * .22, .6, 0, 6.2832); ctx.fill();
      ctx.strokeStyle = "rgba(160,210,255,.6)"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(x, y, r + 1.5, 0, 6.2832); ctx.stroke();
    },
    /* 둥근 천체·공·입자: 빛이 왼쪽 위에서 오는 입체 공 */
    planet: function (ctx, x, y, r, base, dark) {
      var g = ctx.createRadialGradient(x - r * .4, y - r * .45, r * .08, x, y, r);
      g.addColorStop(0, "rgba(255,255,255,.95)"); g.addColorStop(.18, base || "#c9a26b"); g.addColorStop(1, dark || "#3b2a17");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill();
    },
    wedge: function (ctx, cx, cy, a0, a1, r, fill, stroke) {
      var lo = Math.min(a0, a1), hi = Math.max(a0, a1);
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, lo, hi); ctx.closePath();
      ctx.fillStyle = fill; ctx.fill();
      if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cy, r, lo, hi); ctx.stroke(); }
    },
    line: function (ctx, a, b, col, w, dash, alpha) {
      ctx.save(); ctx.globalAlpha = alpha == null ? 1 : alpha; ctx.strokeStyle = col || C.line; ctx.lineWidth = w || 1.5;
      if (dash) ctx.setLineDash(dash); ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.restore();
    },
    arrow: function (ctx, a, b, col, w, head) {
      var ang = Math.atan2(b.y - a.y, b.x - a.x), hd = head || 9;
      ctx.save(); ctx.strokeStyle = col || C.ink; ctx.fillStyle = col || C.ink; ctx.lineWidth = w || 2; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x - Math.cos(ang) * hd * .6, b.y - Math.sin(ang) * hd * .6); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(b.x, b.y);
      ctx.lineTo(b.x - Math.cos(ang - .42) * hd, b.y - Math.sin(ang - .42) * hd);
      ctx.lineTo(b.x - Math.cos(ang + .42) * hd, b.y - Math.sin(ang + .42) * hd); ctx.closePath(); ctx.fill(); ctx.restore();
    },
    extend: function (a, b, y) { var t = (y - a.y) / (b.y - a.y); return { x: a.x + (b.x - a.x) * t, y: y }; },
    bracket: function (ctx, x0, x1, y, col, lab, up) {
      ctx.strokeStyle = col || C.ink; ctx.lineWidth = 2; var k = up ? -6 : 6;
      ctx.beginPath(); ctx.moveTo(x0, y - k); ctx.lineTo(x0, y); ctx.lineTo(x1, y); ctx.lineTo(x1, y - k); ctx.stroke();
      if (lab) K.pill(ctx, lab, (x0 + x1) / 2, y + (up ? -10 : 22), { a: "center", c: col, s: 12 });
    },
    warn: function (ctx, x, y, s, a) {
      return K.pill(ctx, s || "⚠ 크기·거리는 실제 비율이 아닙니다", x, y, { s: 11, a: a, c: C.yellow, bg: "rgba(60,40,0,.6)", line: "rgba(255,211,107,.45)" });
    },
    /* 그래프 틀: 좌표 바꾸는 함수를 돌려준다 */
    chart: function (ctx, o) {
      var x = o.x, y = o.y, w = o.w, h = o.h, pl = o.pl == null ? 52 : o.pl, pb = o.pb == null ? 34 : o.pb, pt = o.pt == null ? 14 : o.pt, pr = o.pr == null ? 14 : o.pr;
      var L = x + pl, R = x + w - pr, T = y + pt, B = y + h - pb;
      var api = {
        L: L, R: R, T: T, B: B,
        X: function (v) { return L + (v - o.x0) / (o.x1 - o.x0) * (R - L); },
        Y: function (v) { return B - (v - o.y0) / (o.y1 - o.y0) * (B - T); }
      };
      var P0 = o.light ? K.LT : C;
      ctx.fillStyle = o.light ? "rgba(255,255,255,.7)" : "rgba(255,255,255,.03)"; ctx.fillRect(L, T, R - L, B - T);
      ctx.strokeStyle = P0.grid; ctx.lineWidth = 1;
      var xt = o.xt || 5, yt = o.yt || 4, i, v;
      for (i = 0; i <= xt; i++) {
        v = o.x0 + (o.x1 - o.x0) * i / xt; var gx = api.X(v);
        ctx.beginPath(); ctx.moveTo(gx, T); ctx.lineTo(gx, B); ctx.stroke();
        K.t(ctx, o.xf ? o.xf(v) : fmt(v), gx, B + 16, { s: 10.5, a: "center", c: P0.mute, w: "600" });
      }
      for (i = 0; i <= yt; i++) {
        v = o.y0 + (o.y1 - o.y0) * i / yt; var gy = api.Y(v);
        ctx.beginPath(); ctx.moveTo(L, gy); ctx.lineTo(R, gy); ctx.stroke();
        K.t(ctx, o.yf ? o.yf(v) : fmt(v), L - 6, gy + 4, { s: 10.5, a: "right", c: P0.mute, w: "600" });
      }
      ctx.strokeStyle = P0.line; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(L, T); ctx.lineTo(L, B); ctx.lineTo(R, B); ctx.stroke();
      if (o.xl) K.t(ctx, o.xl, R, B + 30, { s: 11, a: "right", c: P0.mute });
      if (o.yl) K.t(ctx, o.yl, L - 4, T - 2 < y + 12 ? y + 12 : T - 2, { s: 11, a: "left", c: P0.mute });
      return api;
    },
    plot: function (ctx, g, pts, col, o) {
      o = o || {};
      if (!pts.length) return;
      ctx.save();
      ctx.strokeStyle = col || C.blue; ctx.lineWidth = o.w || 2.4; ctx.lineJoin = "round";
      if (o.dash) ctx.setLineDash(o.dash);
      if (o.glow !== false) { ctx.shadowColor = col || C.blue; ctx.shadowBlur = o.light ? 3 : 8; }
      ctx.beginPath();
      pts.forEach(function (p, i) { var px = g.X(p[0]), py = g.Y(p[1]); if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); });
      ctx.stroke(); ctx.restore();
      if (o.dots) pts.forEach(function (p) { ctx.fillStyle = col || C.blue; ctx.beginPath(); ctx.arc(g.X(p[0]), g.Y(p[1]), o.dots, 0, 6.2832); ctx.fill(); });
    },
    /* 움직임: setTimeout 으로 돌고, 캔버스가 화면에 있을 때만 step(dt) 를 부른다 */
    animate: function (canvas, step, fps) {
      var last = Date.now(), dtMax = 80, iv = 1000 / (fps || 30);
      function tick() {
        var now = Date.now(), dt = Math.min(now - last, dtMax); last = now;
        if (canvas.offsetParent !== null && !document.hidden) { try { step(dt); } catch (e) { if (window.console) console.error(e); } }
        setTimeout(tick, iv);
      }
      setTimeout(tick, iv);
    }
  };
  /* =========================================================================
     아이소메트릭 블록 모형(K.iso) — 땅·바다·대기를 블록처럼 잘라 옆면으로 속을 보여 준다.
     본보기: earth-science-2/2-1 '빠진 시간 — 부정합', earth-system-2/2-1 '바다가 갈라지는 날',
             integrated-science-2/2-1 '이상 신호 — 엘니뇨'.

       var I = K.iso({ ox: 260, oy: 290, s: 0.75, L: 380, D: 220 });
         월드 좌표: x 0~L (화면 오른쪽 아래로), y 0~D (화면 왼쪽 아래로), z 위로(그림 단위).
         보이는 면: 앞면 front(y = D, 가로 u = x), 오른쪽 면 right(x = L, 가로 u = y), 윗면.
       I.P(x, y, z)                         → 화면 점 {x, y}
       I.face(ctx, "front"|"right", fn)     → 그 면의 좌표(u 가로, z 위)로 바꿔 fn() 을 그린다. 무늬·지층을 평면처럼 그리면 된다.
       I.profile(ctx, side, zOf, z0)        → 면 위에 아래 z0 부터 위 zOf(u) 까지 닫힌 경로(채우기·자르기용, face 안에서 쓴다)
       I.shade(ctx, side, zOf)              → 면 음영(오른쪽 면은 어둡게). zOf(u) 는 그 면의 윗선
       I.top(ctx, zOf, fill)                → 윗면을 x 방향 띠로 그린다(높이가 x 에 따라 달라도 된다). fill 은 색이나 function(i, u) → 색
       I.plane(ctx, z, fill, stroke, x0, x1, y0, y1) → 수평면 한 장(수면·구름층)
       I.water(ctx, level, zOf, o)          → 반투명 물(앞면·오른쪽 면·수면). zOf 는 바닥 높이 함수(u, side)
       I.box(ctx, x0, y0, z0, x1, y1, z1, cTop, cFront, cRight) → 작은 상자(건물·장치)
       I.tree(ctx, x, y, z, sc)  I.house(ctx, x, y, z, w, d, h, roof)  I.person(ctx, x, y, z, color, sc)
       I.label(ctx, x, y, z, 글, dx, dy, 색, box)  → 점과 지시선이 달린 이름표
       I.field(ctx, zOf(x,y), colOf(x,y,z,밝기), nx, ny, after) → 높낮이 있는 지형(섬·산·해저). K.tint("#hex", 밝기) 로 색 음영
       I.edges(ctx, zTopFront, zTopRight)   → 블록 모서리 밝은 선
       K.studio(ctx, x, y, w, h, floor)     → 밝은 스튜디오 바탕과 바닥 그림자 {x, y, rx, ry}
       K.bigText(ctx, 글, x, y, size, fill) → 썸네일처럼 굵은 테두리 글자
     ========================================================================= */
  /* ---------- 밝은 스튜디오 화면용 (블록 모형 장면과 같은 말투) ----------
     K.LT          밝은 바탕용 색표: ink mute dim grid line blue red green yellow orange violet teal
     K.chart(ctx, { …, light: true })   밝은 그래프(흰 바탕·옅은 격자·진한 눈금)
     K.plot(ctx, g, pts, col, { light: true })
     K.card(ctx, x, y, w, h, 제목)       흰 판정 카드(그림자). 제목은 작은 회색 글자
     K.row(ctx, 이름, 값, x0, x1, y, 값색)  카드 안 한 줄(왼쪽 이름·오른쪽 굵은 값)
     K.bar(ctx, x, y, w, 비율, 색)        카드 안 가로 막대
     K.tip(ctx, 글, x, y, w, 좋음여부)    카드 안 한 줄 판정 띠(초록/주황) */
  K.LT = { ink: "#12203a", mute: "#5c7086", dim: "#8a96a8", grid: "rgba(20,40,90,.09)", line: "rgba(20,40,90,.38)",
    blue: "#1c7ed6", red: "#e03131", green: "#0f9f76", yellow: "#f59f00", orange: "#e8590c", violet: "#7048e8", teal: "#0c8599" };
  K.card = function (ctx, x, y, w, h, title) {
    var g = ctx.createLinearGradient(x, y, x + w, y + h); g.addColorStop(0, "#ffffff"); g.addColorStop(1, "#eef2f8");
    ctx.save(); ctx.shadowColor = "rgba(20,30,60,.18)"; ctx.shadowBlur = 14; ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(x, y, w, h, 14); ctx.fill(); ctx.restore();
    if (title) K.t(ctx, title, x + 18, y + 28, { s: 12.5, w: "800", c: K.LT.mute });
  };
  K.row = function (ctx, name, val, x0, x1, y, col) {
    K.t(ctx, name, x0, y, { s: 12, w: "700", c: K.LT.mute });
    K.t(ctx, val, x1, y, { s: 14, w: "900", a: "right", c: col || K.LT.ink });
  };
  K.bar = function (ctx, x, y, w, f, col) {
    ctx.fillStyle = "#e3e9f1"; ctx.beginPath(); ctx.roundRect(x, y, w, 10, 5); ctx.fill();
    ctx.fillStyle = col || K.LT.yellow; ctx.beginPath(); ctx.roundRect(x, y, Math.max(5, w * Math.max(0, Math.min(1, f))), 10, 5); ctx.fill();
  };
  K.tip = function (ctx, s, x, y, w, good) {
    ctx.fillStyle = good ? "#e7f7f0" : (good === false ? "#fdeee4" : "#eef1f5"); ctx.beginPath(); ctx.roundRect(x, y, w, 32, 10); ctx.fill();
    K.t(ctx, s, x + 10, y + 21, { s: 12, w: "800", c: good ? "#0f766e" : (good === false ? "#b4400c" : K.LT.mute) });
  };
  K.tint = function (hex, f) {
    var n = parseInt(hex.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    function c(v) { return Math.max(0, Math.min(255, Math.round(v * f))); }
    return "rgb(" + c(r) + "," + c(g) + "," + c(b) + ")";
  };
  K.studio = function (ctx, x, y, w, h, floor) {
    var bg = ctx.createLinearGradient(0, y, 0, y + h); bg.addColorStop(0, "#f3f6fa"); bg.addColorStop(1, "#d6dee8");
    ctx.fillStyle = bg; ctx.beginPath(); ctx.roundRect(x, y, w, h, 14); ctx.fill();
    if (floor) {
      var fl = ctx.createRadialGradient(floor.x, floor.y, 10, floor.x, floor.y, floor.rx * 1.1);
      fl.addColorStop(0, "rgba(20,30,50,.30)"); fl.addColorStop(.55, "rgba(20,30,50,.08)"); fl.addColorStop(1, "rgba(20,30,50,0)");
      ctx.save(); ctx.beginPath(); ctx.roundRect(x, y, w, h, 14); ctx.clip();
      ctx.fillStyle = fl; ctx.beginPath(); ctx.ellipse(floor.x, floor.y, floor.rx, floor.ry, 0, 0, 6.2832); ctx.fill(); ctx.restore();
    }
  };
  K.bigText = function (ctx, s, x, y, size, fill, a) {
    ctx.font = "900 " + size + "px " + FONT; ctx.textAlign = a || "left"; ctx.lineJoin = "round"; ctx.textBaseline = "alphabetic";
    ctx.strokeStyle = "#111622"; ctx.lineWidth = size * .22; ctx.strokeText(s, x, y);
    ctx.fillStyle = fill || "#ffffff"; ctx.fillText(s, x, y); ctx.lineJoin = "miter";
  };
  K.iso = function (o) {
    var ox = o.ox, oy = o.oy, s = o.s || 0.75, L = o.L, D = o.D, C = 0.866;
    var I = { L: L, D: D, s: s };
    I.P = function (x, y, z) { return { x: ox + (x - y) * C * s, y: oy + (x + y) * 0.5 * s - z * s }; };
    I.face = function (ctx, side, fn) {
      ctx.save();
      if (side === "front") ctx.transform(C * s, 0.5 * s, 0, -s, ox - C * s * D, oy + 0.5 * s * D);
      else ctx.transform(-C * s, 0.5 * s, 0, -s, ox + C * s * L, oy + 0.5 * s * L);
      fn(side === "front" ? L : D);
      ctx.restore();
    };
    I.profile = function (ctx, side, zOf, z0) {
      var Lw = side === "front" ? L : D, u, st = Math.max(2, Lw / 90);
      ctx.beginPath(); ctx.moveTo(0, z0 || 0);
      for (u = 0; u <= Lw + 0.01; u += st) ctx.lineTo(Math.min(u, Lw), zOf(Math.min(u, Lw)));
      ctx.lineTo(Lw, z0 || 0); ctx.closePath();
    };
    I.shade = function (ctx, side, zOf) {
      I.face(ctx, side, function (Lw) {
        I.profile(ctx, side, zOf, 0); ctx.clip();
        var sh = ctx.createLinearGradient(0, 0, 0, 300);
        if (side === "right") { sh.addColorStop(0, "rgba(10,20,50,.34)"); sh.addColorStop(1, "rgba(10,20,50,.18)"); }
        else { sh.addColorStop(0, "rgba(0,0,0,.12)"); sh.addColorStop(1, "rgba(255,255,255,.06)"); }
        ctx.fillStyle = sh; ctx.fillRect(0, 0, Lw, 600);
      });
    };
    I.quad = function (ctx, a, b, c, d, fill, stroke) {
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(c.x, c.y); ctx.lineTo(d.x, d.y); ctx.closePath();
      if (fill) { ctx.fillStyle = fill; ctx.fill(); }
      if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
    };
    I.top = function (ctx, zOf, fill, n) {
      var N = n || 30, i;
      for (i = 0; i < N; i++) {
        var u0 = L * i / N, u1 = L * (i + 1) / N, z0 = zOf(u0), z1 = zOf(u1);
        var col = typeof fill === "function" ? fill(i, (u0 + u1) / 2) : fill;
        I.quad(ctx, I.P(u0, 0, z0), I.P(u1, 0, z1), I.P(u1, D, z1), I.P(u0, D, z0), col);
        ctx.strokeStyle = col; ctx.lineWidth = .8; ctx.stroke();
      }
    };
    I.plane = function (ctx, z, fill, stroke, x0, x1, y0, y1) {
      x0 = x0 || 0; x1 = x1 == null ? L : x1; y0 = y0 || 0; y1 = y1 == null ? D : y1;
      I.quad(ctx, I.P(x0, y0, z), I.P(x1, y0, z), I.P(x1, y1, z), I.P(x0, y1, z), fill, stroke);
    };
    /* 물: zOf(u, side) = 그 면의 바닥 높이. 수면이 바닥보다 낮은 곳은 칠하지 않는다 */
    I.water = function (ctx, level, zOf, opt) {
      opt = opt || {};
      ["front", "right"].forEach(function (side) {
        I.face(ctx, side, function (Lw) {
          var u, st = Math.max(2, Lw / 90);
          ctx.beginPath();
          for (u = 0; u <= Lw + .01; u += st) ctx.lineTo(Math.min(u, Lw), zOf(Math.min(u, Lw), side));
          for (u = Lw; u >= -.01; u -= st) ctx.lineTo(Math.max(u, 0), Math.max(zOf(Math.max(u, 0), side), level));
          ctx.closePath();
          var g = ctx.createLinearGradient(0, level, 0, 0);
          g.addColorStop(0, opt.top || "rgba(70,160,230,.55)"); g.addColorStop(1, opt.deep || "rgba(15,60,130,.75)");
          ctx.fillStyle = g; ctx.fill();
          ctx.strokeStyle = "rgba(255,255,255,.75)"; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(0, level); ctx.lineTo(Lw, level); ctx.stroke();
        });
      });
      if (opt.surface !== false) {
        var a = I.P(0, 0, level), c = I.P(L, D, level);
        var sg = ctx.createLinearGradient(a.x, a.y, c.x, c.y); sg.addColorStop(0, "rgba(140,210,255,.62)"); sg.addColorStop(1, "rgba(40,130,210,.62)");
        if (opt.clipSurface) { ctx.save(); opt.clipSurface(ctx); }
        I.plane(ctx, level, sg, "rgba(255,255,255,.7)");
        ctx.strokeStyle = "rgba(255,255,255,.45)"; ctx.lineWidth = 1;
        var ph = opt.phase || 0;
        for (var i = 0; i < 9; i++) {
          var gx = ((i * 0.37 + ph * .05) % 1) * L, gy = ((i * 0.61) % 1) * D;
          var s1 = I.P(gx - 16, gy, level), s2 = I.P(gx + 10, gy, level);
          ctx.beginPath(); ctx.moveTo(s1.x, s1.y); ctx.quadraticCurveTo((s1.x + s2.x) / 2, s1.y - 3, s2.x, s2.y); ctx.stroke();
        }
        if (opt.clipSurface) ctx.restore();
      }
    };
    I.box = function (ctx, x0, y0, z0, x1, y1, z1, cTop, cFront, cRight) {
      I.quad(ctx, I.P(x0, y1, z0), I.P(x1, y1, z0), I.P(x1, y1, z1), I.P(x0, y1, z1), cFront || "#c9ced6");
      I.quad(ctx, I.P(x1, y0, z0), I.P(x1, y1, z0), I.P(x1, y1, z1), I.P(x1, y0, z1), cRight || "#9aa3b0");
      I.quad(ctx, I.P(x0, y0, z1), I.P(x1, y0, z1), I.P(x1, y1, z1), I.P(x0, y1, z1), cTop || "#e8ecf2");
    };
    I.house = function (ctx, x, y, z, w, d, h, roof) {
      I.box(ctx, x, y, z, x + w, y + d, z + h, "#f1ede6", "#e2dbd0", "#c6bcae");
      var r = roof || "#c0553f", a = I.P(x, y + d / 2, z + h + h * .6), b = I.P(x + w, y + d / 2, z + h + h * .6);
      I.quad(ctx, I.P(x, y + d, z + h), I.P(x + w, y + d, z + h), b, a, r);
      I.quad(ctx, I.P(x + w, y, z + h), I.P(x + w, y + d, z + h), b, b, "rgba(0,0,0,.25)");
      ctx.beginPath(); var p1 = I.P(x + w, y, z + h), p2 = I.P(x + w, y + d, z + h); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.lineTo(b.x, b.y); ctx.closePath();
      ctx.fillStyle = "#b4483a"; ctx.fill();
    };
    I.tree = function (ctx, x, y, z, sc) {
      var p = I.P(x, y, z); sc = sc || 1;
      ctx.fillStyle = "rgba(0,0,0,.18)"; ctx.beginPath(); ctx.ellipse(p.x + 4 * sc, p.y + 1, 7 * sc, 2.5 * sc, 0, 0, 6.283); ctx.fill();
      ctx.fillStyle = "#6b4a2e"; ctx.fillRect(p.x - 1.5 * sc, p.y - 8 * sc, 3 * sc, 8 * sc);
      [[30, 9], [22, 16]].forEach(function (q) {
        var g = ctx.createLinearGradient(p.x - 8 * sc, 0, p.x + 8 * sc, 0); g.addColorStop(0, "#4b8f3e"); g.addColorStop(1, "#24521f");
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(p.x, p.y - q[0] * sc); ctx.lineTo(p.x + 8 * sc, p.y - q[1] * sc); ctx.lineTo(p.x - 8 * sc, p.y - q[1] * sc); ctx.closePath(); ctx.fill();
      });
    };
    I.person = function (ctx, x, y, z, color, sc) {
      var p = I.P(x, y, z); sc = sc || 1;
      ctx.fillStyle = "rgba(0,0,0,.2)"; ctx.beginPath(); ctx.ellipse(p.x + 2, p.y, 4 * sc, 1.6 * sc, 0, 0, 6.283); ctx.fill();
      ctx.fillStyle = color || "#ff6b81"; ctx.beginPath(); ctx.roundRect(p.x - 2.4 * sc, p.y - 10 * sc, 4.8 * sc, 8 * sc, 2 * sc); ctx.fill();
      ctx.fillStyle = "#2b2b33"; ctx.fillRect(p.x - 2 * sc, p.y - 2.5 * sc, 1.6 * sc, 2.5 * sc); ctx.fillRect(p.x + .4 * sc, p.y - 2.5 * sc, 1.6 * sc, 2.5 * sc);
      ctx.fillStyle = "#f1c7a5"; ctx.beginPath(); ctx.arc(p.x, p.y - 12.4 * sc, 2.4 * sc, 0, 6.283); ctx.fill();
    };
    I.label = function (ctx, x, y, z, txt, dx, dy, col, box) {
      var p = I.P(x, y, z), q = { x: p.x + dx, y: p.y + dy };
      ctx.strokeStyle = "rgba(20,25,40,.75)"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
      ctx.fillStyle = "#111622"; ctx.beginPath(); ctx.arc(p.x, p.y, 2.5, 0, 6.283); ctx.fill();
      return K.pill(ctx, txt, q.x + (dx < 0 ? -4 : 4), q.y + 4, { s: 12, a: dx < 0 ? "right" : "left", c: col || "#e8ecff", box: box });
    };
    /* 지형(높이 지도): zOf(x, y) 높이, colOf(x, y, z, light) 색. 먼 칸부터 그려 앞이 뒤를 가린다.
       after(ctx, x0, y0, x1, y1, zMax) 는 칸마다 바로 뒤에 불린다(물 한 칸 덮기 등). */
    I.field = function (ctx, zOf, colOf, nx, ny, after) {
      var dx = L / nx, dy = D / ny, s0, i, j, Z = [];
      for (i = 0; i <= nx; i++) { Z[i] = []; for (j = 0; j <= ny; j++) Z[i][j] = zOf(i * dx, j * dy); }
      for (s0 = 0; s0 <= nx + ny - 2; s0++) {
        for (i = Math.max(0, s0 - ny + 1); i <= Math.min(nx - 1, s0); i++) {
          j = s0 - i;
          var x0 = i * dx, x1 = x0 + dx, y0 = j * dy, y1 = y0 + dy;
          var z00 = Z[i][j], z10 = Z[i + 1][j], z11 = Z[i + 1][j + 1], z01 = Z[i][j + 1];
          var gx = ((z10 + z11) - (z00 + z01)) / (2 * dx), gy = ((z01 + z11) - (z00 + z10)) / (2 * dy);
          var light = Math.max(.55, Math.min(1.25, 1 - gx * .9 + gy * .5));
          var zc = (z00 + z10 + z11 + z01) / 4;
          var col = colOf((x0 + x1) / 2, (y0 + y1) / 2, zc, light);
          I.quad(ctx, I.P(x0, y0, z00), I.P(x1, y0, z10), I.P(x1, y1, z11), I.P(x0, y1, z01), col);
          ctx.strokeStyle = col; ctx.lineWidth = .7; ctx.stroke();
          if (after) after(ctx, x0, y0, x1, y1, Math.max(z00, z10, z11, z01), Math.min(z00, z10, z11, z01));
        }
      }
    };
    /* 색에 밝기 곱하기: K.tint("#c8a46a", 1.1) */
    I.edges = function (ctx, zf, zr) {
      var a = I.P(L, D, 0), b = I.P(L, D, zf), c = I.P(0, D, 0), d = I.P(L, 0, 0);
      ctx.strokeStyle = "rgba(255,255,255,.55)"; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(a.x, a.y); ctx.lineTo(d.x, d.y); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    };
    return I;
  };
  function fmt(v) {
    var a = Math.abs(v);
    if (a >= 1000) return Math.round(v).toLocaleString();
    if (a >= 10 || v === Math.round(v)) return String(Math.round(v * 10) / 10);
    return String(Math.round(v * 100) / 100);
  }
  K.fmt = fmt;
  window.sthKit = K;
})();
