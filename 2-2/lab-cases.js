/* 지구과학 Ⅱ-2 한반도의 암석 — 응용 실험실
   이야기에서 찾은 개념을 처음 보는 상황에 써 본다. 공용 엔진: ../assets/lab.js (sthLab) */
(function () {
"use strict";

window.sthLab({
  mount: "lab", key: "lab", result: "rLab",
  cases: [

  /* ------------------------------------------------------------------ 1. 화성암의 분류 */
  {
    id: "c1", about: "01", tag: "화성암 · 조성과 조직", title: "섬록암을 주문받다", short: "섬록암 만들기",
    who: "🪨", name: "석재 회사",
    say: "“고객이 <b>섬록암</b> 판석을 주문했어요. 가상 마그마 실험실에서 마그마의 조성과 식는 곳을 정해 섬록암을 만들어 보세요. 알갱이가 눈에 보일 만큼 커야 합니다.”",
    predict: {
      q: "섬록암과 안산암은 무엇이 같고 무엇이 다를까요?",
      options: ["㉠ 조성(SiO₂ 함량)은 비슷하고, 식은 깊이(냉각 속도)가 달라 알갱이 크기가 다르다", "㉡ 식은 깊이는 같고, 조성이 다르다", "㉢ 둘 다 같다 — 이름만 다르다"],
      answer: 0
    },
    task: "SiO₂ 함량과 마그마가 식는 깊이를 정해 <b>섬록암</b>을 만드세요.",
    build: function (stage, api) {
      var H = api.h, cv = api.canvas(320), ctx = cv.ctx, W = cv.W;
      var si = 48, dep = 0;
      function kind() { return si < 52 ? 0 : (si < 63 ? 1 : 2); }
      function deep() { return dep >= 2; }
      function name() { return (deep() ? ["반려암", "섬록암", "화강암"] : ["현무암", "안산암", "유문암"])[kind()]; }
      function grain() { return dep < 2 ? 0.05 + dep * 0.1 : 1 + (dep - 2) * 0.8; }
      function draw() {
        var K = window.sthKit, LT = K.LT;
        H.paper(ctx, W, cv.H);
        K.card(ctx, 14, 12, 470, cv.H - 24, "화성암 분류표");
        var x0 = 150, cw = 106, y0 = 76, rh = 64;
        ["염기성 (52% 미만)", "중성 (52~63%)", "산성 (63% 이상)"].forEach(function (s, i) { K.t(ctx, s, x0 + cw * i + cw / 2, y0 - 10, { s: 10.5, w: "800", a: "center", c: LT.mute }); });
        [["화산암 (세립질)", ["현무암", "안산암", "유문암"]], ["심성암 (조립질)", ["반려암", "섬록암", "화강암"]]].forEach(function (r, j) {
          K.t(ctx, r[0], x0 - 10, y0 + rh * j + 37, { s: 11, w: "900", a: "right", c: LT.ink });
          r[1].forEach(function (nm, i) {
            var on = kind() === i && deep() === (j === 1);
            ctx.fillStyle = on ? "#0c8599" : "#e9eef5"; ctx.beginPath(); ctx.roundRect(x0 + cw * i + 3, y0 + rh * j + 3, cw - 6, rh - 6, 10); ctx.fill();
            K.t(ctx, nm, x0 + cw * i + cw / 2, y0 + rh * j + 38, { s: 13.5, w: "900", a: "center", c: on ? "#ffffff" : LT.ink });
          });
        });
        K.t(ctx, "만들어진 암석: " + name(), 40, 254, { s: 17, w: "900", c: name() === "섬록암" ? LT.green : LT.ink });
        K.t(ctx, dep < 2 ? "지표 부근에서 빨리 식음 → 결정이 자랄 시간이 없음" : "지하 깊은 곳에서 천천히 식음 → 결정이 크게 자람", 40, 282, { s: 11.5, w: "700", c: LT.mute });
        /* 입체 표본: 알갱이 크기가 식은 깊이대로 */
        var g = grain(), tx = document.createElement("canvas"); tx.width = 400; tx.height = 280;
        var c = tx.getContext("2d"), dark = [70, 110, 150][kind()], s = Math.max(4, Math.min(60, g * 26)), n = 0;
        c.fillStyle = "rgb(" + (dark + 90) + "," + (dark + 90) + "," + (dark + 95) + ")"; c.fillRect(0, 0, 400, 280);
        var Rg = K.rng(kind() * 100 + Math.round(dep * 10) + 1), cnt = Math.max(80, Math.min(5000, Math.round(400 * 280 / (s * s) * 1.4)));
        for (n = 0; n < cnt; n++) {
          var rr = Rg(), cc = rr < [0.6, 0.4, 0.2][kind()] ? dark - 30 : 230, xx = Rg() * 400, yy = Rg() * 280, ss = s * (.6 + Rg() * .6);
          c.fillStyle = "rgb(" + cc + "," + cc + "," + (cc + 6) + ")"; c.fillRect(xx, yy, ss, ss * (.6 + Rg() * .5));
        }
        var I = K.iso({ ox: 660, oy: 118, s: 1, L: 170, D: 110 }), Z = 76;
        ctx.fillStyle = "rgba(20,30,50,.2)"; ctx.beginPath(); ctx.ellipse(700, 268, 160, 20, 0, 0, 6.2832); ctx.fill();
        ["front", "right"].forEach(function (sd) { I.face(ctx, sd, function (Lw) { ctx.translate(0, Z); ctx.scale(1, -1); ctx.drawImage(tx, 0, 0, Lw, Z); }); });
        I.shade(ctx, "right", function () { return Z; });
        var o = I.P(0, 0, Z); ctx.save(); ctx.transform(0.866, 0.5, -0.866, 0.5, o.x, o.y); ctx.drawImage(tx, 0, 0, 170, 110); ctx.restore();
        K.pill(ctx, "확대한 표본 · 알갱이 약 " + g.toFixed(g < 1 ? 2 : 1) + " mm", 700, 302, { s: 11.5, a: "center", c: "#ffffff" });
      }
      cv.canvas._redraw = draw;
      api.slider({ label: "마그마의 SiO₂ 함량", min: 45, max: 75, step: 1, value: 48, fmt: function (x) { return x + "%"; }, onInput: function (x) { si = x; draw(); } });
      api.slider({ label: "마그마가 식는 깊이", min: 0, max: 10, step: 0.5, value: 0, fmt: function (x) { return x === 0 ? "지표 (용암)" : x + " km"; }, onInput: function (x) { dep = x; draw(); } });
      api.info("SiO₂가 많을수록 밝은 광물(석영·장석)이, 적을수록 어두운 광물(감람석·휘석)이 많아집니다.");
      draw();
      return {
        judge: function () {
          var nm = name();
          if (nm === "섬록암") return { ok: true, msg: "SiO₂ " + si + "% · 깊이 " + dep + " km → 섬록암. 같은 마그마가 지표로 분출했다면 안산암이 되었을 거예요." };
          return { ok: false, msg: "만들어진 암석은 " + nm + " — " + (kind() !== 1 ? "조성(SiO₂)이 섬록암과 다릅니다." : "조성은 맞지만 너무 빨리 식어 알갱이가 작습니다.") };
        }
      };
    },
    hints: [
      "섬록암은 표에서 어느 칸인가요? 가로(조성)와 세로(식은 곳)를 따로 맞추면 됩니다.",
      "중성(SiO₂ 52~63%)에, 알갱이가 커지려면 지하 깊은 곳에서 천천히 식어야 합니다."
    ],
    solution: "SiO₂ <b>52~62%</b>, 식는 깊이 <b>2 km 이상</b>.",
    why: "화성암의 이름은 두 가지로 정해집니다. <b>화학 조성</b>(SiO₂ 함량 — 색과 광물)과 <b>조직</b>(식은 속도 — 알갱이 크기)입니다. 지하 깊은 곳에서 천천히 식으면 조립질의 <b>심성암</b>, 지표에서 빨리 식으면 세립질의 <b>화산암</b>이 됩니다.<br>" +
      "그래서 같은 중성 마그마라도 땅속에서 굳으면 섬록암, 분출하면 안산암이 됩니다. 북한산의 화강암과 한라산 기슭의 현무암이 이렇게 다릅니다. ※ 깊이와 알갱이 크기의 관계는 수업용으로 단순화했습니다."
  },

  /* ------------------------------------------------------------------ 2. 변성 작용 */
  {
    id: "c2", about: "02", tag: "변성 작용", title: "셰일을 편마암으로", short: "편마암 만들기",
    who: "🔥", name: "암석 실험실",
    say: "“셰일 한 덩이를 가상 고온·고압 장치에 넣어 <b>편마암</b>을 만들어 보려 해요. 편마암은 밝은 띠와 어두운 띠가 번갈아 나타나는 암석이죠. 너무 뜨거우면 녹아서 마그마가 되니 조심하세요!”",
    predict: {
      q: "암석이 변성 작용을 받을 때 일어나는 일로 옳은 것은?",
      options: ["㉠ 암석이 모두 녹았다가 다시 굳는다", "㉡ 고체 상태를 유지한 채 광물과 조직이 바뀐다", "㉢ 풍화되어 부스러진다"],
      answer: 1
    },
    task: "온도와 깊이(압력)를 정해 셰일을 <b>편마암</b>으로 바꾸세요. 녹으면 실패입니다.",
    build: function (stage, api) {
      var H = api.h, cv = api.canvas(330), ctx = cv.ctx, W = cv.W;
      var T = 200, D = 5;
      function rock() {
        if (T >= 750) return "녹음 (부분 용융 → 마그마)";
        if (T < 200) return "셰일 (변화 없음)";
        if (D < 8 && T >= 450) return "혼펠스 (접촉 변성)";
        if (T < 350) return "점판암";
        if (T < 450) return "천매암";
        if (T < 600 || D < 20) return "편암";
        return "편마암";
      }
      var gx0 = 90, gx1 = 560, gy0 = 50, gy1 = 290;
      function GX(t) { return gx0 + (t - 100) / 800 * (gx1 - gx0); }
      function GY(d) { return gy0 + d / 40 * (gy1 - gy0); }
      function draw() {
        var K = window.sthKit, LT = K.LT;
        H.paper(ctx, W, cv.H);
        var gc = K.chart(ctx, { x: 16, y: 34, w: 570, h: 286, x0: 100, x1: 900, y0: 40, y1: 0, xt: 4, yt: 4, pl: 56, light: true,
          xl: "온도 →", yl: "깊이 ↓", xf: function (v) { return v + "℃"; }, yf: function (v) { return v + " km"; } });
        K.t(ctx, "온도 – 깊이 그림", 22, 22, { s: 13.5, w: "900", c: LT.ink });
        function rect(t0, t1, d0, d1, col, a) { ctx.fillStyle = col; ctx.globalAlpha = a; ctx.fillRect(gc.X(t0), gc.Y(d0), gc.X(t1) - gc.X(t0), gc.Y(d1) - gc.Y(d0)); ctx.globalAlpha = 1; }
        rect(750, 900, 0, 40, "#e03131", .18); rect(450, 750, 0, 8, "#f59f00", .22); rect(600, 750, 20, 40, "#7048e8", .2);
        K.t(ctx, "녹음", (gc.X(750) + gc.R) / 2, gc.T + 20, { s: 12, w: "900", a: "center", c: LT.red });
        K.t(ctx, "접촉 변성", (gc.X(450) + gc.X(750)) / 2, gc.T + 20, { s: 11, w: "800", a: "center", c: "#b45309" });
        K.t(ctx, "편마암", (gc.X(600) + gc.X(750)) / 2, gc.Y(30), { s: 11, w: "900", a: "center", c: LT.violet });
        var r = rock();
        ctx.fillStyle = "#ffffff"; ctx.strokeStyle = r === "편마암" ? LT.green : LT.ink; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.arc(gc.X(T), gc.Y(D), 8, 0, 6.2832); ctx.fill(); ctx.stroke();
        K.card(ctx, 600, 14, 286, cv.H - 28, "가상 고온·고압 장치");
        K.row(ctx, "온도 · 깊이", T + " ℃ · " + D + " km", 618, 868, 66);
        K.t(ctx, "만들어진 암석", 618, 108, { s: 12, w: "800", c: LT.mute });
        K.t(ctx, r, 618, 140, { s: r.length > 10 ? 15 : 21, w: "900", c: r === "편마암" ? LT.green : (r.indexOf("녹음") === 0 ? LT.red : LT.ink) });
        /* 시료 미니어처: 엽리가 생긴 정도 */
        var I = K.iso({ ox: 718, oy: 176, s: 1, L: 120, D: 70 }), Z = 50, band = r === "편마암" ? 3 : (r === "편암" || r === "천매암" ? 2 : (r === "점판암" ? 1 : 0));
        I.box(ctx, 0, 0, 0, 120, 70, Z, band === 3 ? "#c9c4cf" : "#8a8790", band === 3 ? "#9d97a6" : "#6b6870", band === 3 ? "#7c7686" : "#55525a");
        if (band) ["front", "right"].forEach(function (sd) { I.face(ctx, sd, function (Lw) { var nl = [0, 12, 8, 5][band]; for (var l = 0; l < nl; l++) { ctx.strokeStyle = l % 2 ? "rgba(245,242,236,.85)" : "rgba(30,26,40,.8)"; ctx.lineWidth = [0, 1.2, 2.2, 4][band]; ctx.beginPath(); for (var u = 0; u <= Lw; u += 4) { var zz = 3 + (l + .5) * (Z - 6) / nl + Math.sin(u / 12 + l) * (band === 3 ? 2 : .8); if (u) ctx.lineTo(u, zz); else ctx.moveTo(u, zz); } ctx.stroke(); } }); });
        K.t(ctx, r === "편마암" ? "밝은 띠·어두운 띠 (편마 구조)" : (r === "편암" ? "얇은 판처럼 쪼개지는 엽리 (편리)" : ""), 618, 300, { s: 11.5, w: "700", c: LT.mute });
      }
      cv.canvas._redraw = draw;
      api.slider({ label: "온도", min: 100, max: 900, step: 25, value: 200, fmt: function (x) { return x + " ℃"; }, onInput: function (x) { T = x; draw(); } });
      api.slider({ label: "깊이 (압력)", min: 0, max: 40, step: 1, value: 5, fmt: function (x) { return x + " km"; }, onInput: function (x) { D = x; draw(); } });
      api.info("마그마 가까이 얕은 곳에서는 열만 받는 <b>접촉 변성</b>, 산맥이 만들어지는 깊은 곳에서는 열과 압력을 함께 받는 <b>광역 변성</b>이 일어납니다.");
      draw();
      return {
        judge: function () {
          var r = rock();
          if (r === "편마암") return { ok: true, msg: T + " ℃ · " + D + " km — 넓은 지역이 높은 열과 압력을 함께 받는 광역 변성으로 편마암이 되었습니다." };
          return { ok: false, msg: "만들어진 것: " + r + "." };
        }
      };
    },
    hints: [
      "셰일은 온도와 압력이 높아질수록 점판암 → 천매암 → 편암 → 편마암으로 바뀝니다. 가장 높은 단계입니다.",
      "얕은 곳에서 뜨겁기만 하면 혼펠스가 됩니다. 깊은 곳(20 km 이상)에서 600 ℃ 이상, 그러나 녹지 않게(750 ℃ 미만)."
    ],
    solution: "온도 <b>600~725 ℃</b>, 깊이 <b>20 km 이상</b>.",
    why: "변성 작용은 암석이 <b>녹지 않은 채</b> 열과 압력을 받아 광물과 조직이 바뀌는 것입니다. 마그마 둘레의 좁은 곳에서 열로 굽히는 <b>접촉 변성</b>은 치밀한 혼펠스를, 조산 운동으로 넓은 지역이 눌리고 데워지는 <b>광역 변성</b>은 엽리가 발달한 편암·편마암을 만듭니다.<br>" +
      "우리나라 땅의 넓은 부분을 차지하는 선캄브리아 시대의 편마암은 아주 오래전 거대한 조산 운동의 흔적입니다. ※ 온도·깊이 경계는 대략적인 값입니다."
  },

  /* ------------------------------------------------------------------ 3. 암석의 순환 */
  {
    id: "c3", about: "02", tag: "암석의 순환", title: "셰일이 화강암이 되기까지", short: "암석의 순환",
    who: "♻️", name: "지질공원 해설사",
    say: "“해설판에 ‘이 화강암의 원료는 한때 바다 밑의 진흙이었다’고 쓰려 해요. 진흙이 굳은 셰일이 <b>편마암을 거쳐</b> 화강암이 되는 과정을 세 단계로 보여 주세요.”",
    predict: {
      q: "퇴적암이 화성암이 되려면 반드시 거쳐야 하는 단계는?",
      options: ["㉠ 풍화와 침식", "㉡ 마그마가 되었다가 식어 굳는 과정", "㉢ 변성 작용"],
      answer: 1
    },
    task: "세 단계의 작용을 골라 <b>셰일 → … → 화강암</b>이 되게 하되, 도중에 <b>편마암(변성암)</b>을 거치게 하세요.",
    build: function (stage, api) {
      var H = api.h, cv = api.canvas(280), ctx = cv.ctx, W = cv.W;
      var OPS = [{ v: "none", t: "그대로" }, { v: "weather", t: "풍화·침식" }, { v: "deposit", t: "퇴적·다짐" }, { v: "meta", t: "높은 열·압력 (변성)" }, { v: "melt", t: "녹음 (용융)" }, { v: "slow", t: "지하에서 천천히 식음" }, { v: "fast", t: "지표에서 빨리 식음" }];
      var steps = ["none", "none", "none"];
      var NAME = { sed: "셰일 (퇴적암)", sedi: "진흙·모래 (퇴적물)", meta: "편마암 (변성암)", mag: "마그마", gran: "화강암 (심성암)", volc: "유문암 (화산암)", bad: "일어날 수 없음" };
      function next(s, op) {
        if (op === "none") return s;
        var T = {
          sed: { weather: "sedi", meta: "meta", melt: "mag" }, sedi: { deposit: "sed" },
          meta: { weather: "sedi", meta: "meta", melt: "mag" }, mag: { slow: "gran", fast: "volc" },
          gran: { weather: "sedi", meta: "meta", melt: "mag" }, volc: { weather: "sedi", meta: "meta", melt: "mag" }
        };
        return (T[s] && T[s][op]) || "bad";
      }
      function path() { var s = "sed", p = [s]; for (var i = 0; i < 3; i++) { s = s === "bad" ? "bad" : next(s, steps[i]); p.push(s); } return p; }
      function draw() {
        var K = window.sthKit, LT = K.LT;
        H.paper(ctx, W, cv.H);
        var p = path();
        K.t(ctx, "암석이 걸어간 길", 40, 28, { s: 14, w: "900", c: LT.ink });
        var LOOK = { sed: "#d8c08a", sedi: "#e6cf9a", meta: "#b9b4c4", mag: "#ff9a3c", gran: "#e9c3c1", volc: "#b8aeb0", bad: "#f3b2b2" };
        p.forEach(function (s, i) {
          var x = 40 + i * 215, y = 110, good = s === "gran" && i === 3;
          ctx.save(); ctx.shadowColor = "rgba(20,30,60,.16)"; ctx.shadowBlur = 10; ctx.fillStyle = s === "bad" ? "#fdeee4" : (good ? "#e7f7f0" : "#ffffff"); ctx.beginPath(); ctx.roundRect(x, y - 52, 170, 96, 14); ctx.fill(); ctx.restore();
          var I = K.iso({ ox: x + 85, oy: y - 30, s: .8, L: 40, D: 28 });
          if (s === "mag") { K.glow(ctx, x + 85, y - 18, 12, "rgba(255,150,60,.9)", 1.8); K.planet(ctx, x + 85, y - 18, 13, "#ffd36b", "#c2410c"); }
          else if (s !== "bad") I.box(ctx, 0, 0, 0, 40, 28, 22, K.tint(LOOK[s], 1.08), LOOK[s], K.tint(LOOK[s], .75));
          else K.t(ctx, "✗", x + 85, y - 10, { s: 24, w: "900", a: "center", c: LT.red });
          K.t(ctx, NAME[s], x + 85, y + 30, { s: 12.5, w: "900", a: "center", c: LT.ink });
          if (i < 3) {
            H.arrow(ctx, x + 172, y - 5, x + 212, y - 5, LT.mute, 2, 8);
            K.t(ctx, OPS.filter(function (o) { return o.v === steps[i]; })[0].t, x + 192, y + 70, { s: 10.5, w: "800", a: "center", c: "#1179a6" });
          }
        });
        var viaMeta = p.indexOf("meta") > 0;
        K.tip(ctx, "편마암을 거쳤나요? " + (viaMeta ? "✓ 예" : "✗ 아니요"), 34, 214, 300, viaMeta ? true : null);
      }
      cv.canvas._redraw = draw;
      [0, 1, 2].forEach(function (i) {
        api.seg({ label: (i + 1) + "단계 작용", value: "none", options: OPS, onPick: function (x) { steps[i] = x; draw(); } });
      });
      api.info("각 단계에서 지금 상태의 암석에 일어날 수 있는 작용만 고르세요. 불가능한 작용을 고르면 빨간 칸이 됩니다.");
      draw();
      return {
        judge: function () {
          var p = path();
          if (p.indexOf("bad") >= 0) return { ok: false, msg: "일어날 수 없는 단계가 있습니다 — 예를 들어 암석은 녹기 전에는 ‘식을’ 수 없어요." };
          if (p[3] !== "gran") return { ok: false, msg: "마지막이 " + NAME[p[3]] + " 입니다. 화강암이 되어야 합니다." };
          if (p.indexOf("meta") < 0) return { ok: false, msg: "화강암은 되었지만 편마암을 거치지 않았습니다." };
          return { ok: true, msg: "셰일 → 편마암 → 마그마 → 화강암. 깊이 묻혀 변성되고, 더 뜨거워져 녹았다가, 지하에서 천천히 굳었습니다." };
        }
      };
    },
    hints: [
      "화강암은 마그마가 <b>지하에서 천천히</b> 식어 생깁니다. 그러려면 그 바로 앞 단계는 무엇이어야 할까요?",
      "셰일 → (변성) → 편마암 → (용융) → 마그마 → (천천히 식음) → 화강암."
    ],
    solution: "1단계 <b>높은 열·압력(변성)</b> → 2단계 <b>녹음(용융)</b> → 3단계 <b>지하에서 천천히 식음</b>.",
    why: "암석은 한 모습에 머물지 않고 <b>퇴적암 ↔ 변성암 ↔ 화성암</b>으로 끝없이 바뀝니다. 그 원동력은 지표의 태양 에너지(풍화·침식)와 지구 내부 에너지(변성·용융)입니다.<br>" +
      "정해진 순서는 없어 셰일이 녹지 않고 곧장 풍화될 수도 있지만, <b>화성암이 되려면 반드시 마그마를 거쳐야</b> 합니다. 바다 밑 진흙이 수천만 년 뒤 산꼭대기 화강암이 될 수도 있는 까닭입니다."
  }
  ]
});
})();
