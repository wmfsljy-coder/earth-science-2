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
      ctx.fillStyle = "rgba(255,255,255,.03)"; ctx.fillRect(L, T, R - L, B - T);
      ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
      var xt = o.xt || 5, yt = o.yt || 4, i, v;
      for (i = 0; i <= xt; i++) {
        v = o.x0 + (o.x1 - o.x0) * i / xt; var gx = api.X(v);
        ctx.beginPath(); ctx.moveTo(gx, T); ctx.lineTo(gx, B); ctx.stroke();
        K.t(ctx, o.xf ? o.xf(v) : fmt(v), gx, B + 16, { s: 10.5, a: "center", c: C.mute, w: "600" });
      }
      for (i = 0; i <= yt; i++) {
        v = o.y0 + (o.y1 - o.y0) * i / yt; var gy = api.Y(v);
        ctx.beginPath(); ctx.moveTo(L, gy); ctx.lineTo(R, gy); ctx.stroke();
        K.t(ctx, o.yf ? o.yf(v) : fmt(v), L - 6, gy + 4, { s: 10.5, a: "right", c: C.mute, w: "600" });
      }
      ctx.strokeStyle = C.line; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(L, T); ctx.lineTo(L, B); ctx.lineTo(R, B); ctx.stroke();
      if (o.xl) K.t(ctx, o.xl, R, B + 30, { s: 11, a: "right", c: C.mute });
      if (o.yl) K.t(ctx, o.yl, L - 4, T - 2 < y + 12 ? y + 12 : T - 2, { s: 11, a: "left", c: C.mute });
      return api;
    },
    plot: function (ctx, g, pts, col, o) {
      o = o || {};
      if (!pts.length) return;
      ctx.save();
      ctx.strokeStyle = col || C.blue; ctx.lineWidth = o.w || 2.4; ctx.lineJoin = "round";
      if (o.dash) ctx.setLineDash(o.dash);
      if (o.glow !== false) { ctx.shadowColor = col || C.blue; ctx.shadowBlur = 8; }
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
  function fmt(v) {
    var a = Math.abs(v);
    if (a >= 1000) return Math.round(v).toLocaleString();
    if (a >= 10 || v === Math.round(v)) return String(Math.round(v * 10) / 10);
    return String(Math.round(v * 100) / 100);
  }
  K.fmt = fmt;
  window.sthKit = K;
})();
