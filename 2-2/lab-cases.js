/* 지구과학 Ⅱ-2 한반도의 암석 — 응용 실험실
   이야기에서 찾은 개념을 처음 보는 상황에 써 본다. 공용 엔진: ../assets/lab.js (sthLab) */
(function () {
"use strict";

window.sthLab({
  mount: "lab", key: "lab", result: "rLab",
  cases: [

  /* ------------------------------------------------------------------ 1. 화성암의 분류 */
  {
    id: "c1", tag: "화성암 · 조성과 조직", title: "섬록암을 주문받다", short: "섬록암 만들기",
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
        H.paper(ctx, W, cv.H);
        H.text(ctx, "화성암 분류표", 40, 28, { s: 14, w: "900" });
        var x0 = 150, cw = 130, y0 = 60, rh = 60;
        ["염기성 (SiO₂ 52% 미만)", "중성 (52~63%)", "산성 (63% 이상)"].forEach(function (s, i) { H.text(ctx, s, x0 + cw * i + cw / 2, y0 - 8, { s: 10.5, w: "800", a: "center", c: H.v("--mist") }); });
        [["화산암 (세립질)", ["현무암", "안산암", "유문암"]], ["심성암 (조립질)", ["반려암", "섬록암", "화강암"]]].forEach(function (r, j) {
          H.text(ctx, r[0], x0 - 8, y0 + rh * j + 35, { s: 11, w: "800", a: "right" });
          r[1].forEach(function (nm, i) {
            var on = kind() === i && deep() === (j === 1);
            H.box(ctx, x0 + cw * i + 2, y0 + rh * j + 2, cw - 4, rh - 4, on ? H.v("--teal") : H.v("--card-2"), on ? 0.6 : 1);
            H.text(ctx, nm, x0 + cw * i + cw / 2, y0 + rh * j + 36, { s: 13, w: "900", a: "center" });
          });
        });
        /* 확대 사진 흉내: 알갱이 */
        var bx = 620, by = 60, bw = 220, bh = 160, g = grain(), n = 0;
        ctx.save(); ctx.beginPath(); ctx.rect(bx, by, bw, bh); ctx.clip();
        var dark = [70, 110, 150][kind()];
        ctx.fillStyle = "rgb(" + (dark + 90) + "," + (dark + 90) + "," + (dark + 95) + ")"; ctx.fillRect(bx, by, bw, bh);
        var s = Math.max(2, Math.min(34, g * 14));
        for (var yy = by; yy < by + bh; yy += s) for (var xx = bx; xx < bx + bw; xx += s) {
          n++; var r = ((n * 73) % 97) / 97;
          var c = r < [0.6, 0.4, 0.2][kind()] ? dark : 220;
          ctx.fillStyle = "rgb(" + c + "," + c + "," + (c + 6) + ")"; ctx.fillRect(xx + 1, yy + 1, s - 1, s - 1);
        }
        ctx.restore();
        H.text(ctx, "확대한 모습 (알갱이 약 " + g.toFixed(g < 1 ? 2 : 1) + " mm)", bx, by + bh + 18, { s: 11, c: H.v("--mist") });
        H.text(ctx, "만들어진 암석: " + name(), 150, 220, { s: 18, w: "900", c: name() === "섬록암" ? H.v("--green-700") : H.v("--ink") });
        H.text(ctx, dep < 2 ? "지표 부근에서 빨리 식음 → 결정이 자랄 시간이 없음" : "지하 깊은 곳에서 천천히 식음 → 결정이 크게 자람", 150, 250, { s: 12, c: H.v("--mist") });
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
    id: "c2", tag: "변성 작용", title: "셰일을 편마암으로", short: "편마암 만들기",
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
        H.paper(ctx, W, cv.H);
        H.text(ctx, "온도 – 깊이 그림", 40, 28, { s: 14, w: "900" });
        H.axes(ctx, gx0, gy0, gx1, gy1);
        H.box(ctx, GX(750), gy0, gx1 - GX(750), gy1 - gy0, H.v("--rose"), 0.2);
        H.text(ctx, "녹음", (GX(750) + gx1) / 2, gy0 + 20, { s: 12, w: "900", a: "center", c: H.v("--rose-700") });
        H.box(ctx, GX(450), gy0, GX(750) - GX(450), GY(8) - gy0, H.v("--amber"), 0.2);
        H.text(ctx, "접촉 변성", (GX(450) + GX(750)) / 2, gy0 + 20, { s: 11, w: "800", a: "center", c: H.v("--amber-700") });
        H.box(ctx, GX(600), GY(20), GX(750) - GX(600), gy1 - GY(20), H.v("--violet"), 0.2);
        H.text(ctx, "편마암", (GX(600) + GX(750)) / 2, GY(30), { s: 11, w: "800", a: "center", c: H.v("--violet-700") });
        [100, 300, 500, 700, 900].forEach(function (t) { H.text(ctx, t + "℃", GX(t), gy0 - 8, { s: 10, a: "center", c: H.v("--mist") }); });
        [0, 10, 20, 30, 40].forEach(function (d) { H.text(ctx, d + " km", gx0 - 6, GY(d) + 4, { s: 10, a: "right", c: H.v("--mist") }); });
        H.dot(ctx, GX(T), GY(D), 7, H.v("--ink"));
        var r = rock();
        H.rows(ctx, 610, 70, [
          ["온도 · 깊이", T + " ℃ · " + D + " km"],
          ["만들어진 암석", r, r === "편마암" ? "--green-700" : (r.indexOf("녹음") === 0 ? "--rose-700" : null), true]
        ], 70);
        H.text(ctx, r === "편마암" ? "밝은 띠·어두운 띠 (편마 구조)" : (r === "편암" ? "얇은 판처럼 쪼개지는 엽리 (편리)" : ""), 610, 240, { s: 11.5, c: H.v("--mist") });
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
    id: "c3", tag: "암석의 순환", title: "셰일이 화강암이 되기까지", short: "암석의 순환",
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
        H.paper(ctx, W, cv.H);
        var p = path();
        H.text(ctx, "암석이 걸어간 길", 40, 28, { s: 14, w: "900" });
        p.forEach(function (s, i) {
          var x = 40 + i * 215, y = 110;
          H.box(ctx, x, y - 34, 170, 58, s === "bad" ? H.v("--rose") : (s === "gran" && i === 3 ? H.v("--green") : H.v("--card-2")), s === "bad" || (s === "gran" && i === 3) ? 0.35 : 1);
          H.text(ctx, NAME[s], x + 85, y, { s: 13, w: "900", a: "center" });
          if (i < 3) {
            H.arrow(ctx, x + 172, y - 5, x + 212, y - 5, H.v("--mist"), 2, 8);
            H.text(ctx, OPS.filter(function (o) { return o.v === steps[i]; })[0].t, x + 192, y + 44, { s: 10.5, w: "800", a: "center", c: H.v("--brand-700") });
          }
        });
        var viaMeta = p.indexOf("meta") > 0;
        H.text(ctx, "편마암을 거쳤나요? " + (viaMeta ? "✓ 예" : "✗ 아니요"), 40, 230, { s: 13, w: "800", c: viaMeta ? H.v("--green-700") : H.v("--mist") });
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
