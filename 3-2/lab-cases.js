/* 지구과학 Ⅲ-2 별과 우주의 진화 — 응용 실험실
   이야기에서 찾은 개념을 처음 보는 상황에 써 본다. 공용 엔진: ../assets/lab.js (sthLab) */
(function () {
"use strict";

window.sthLab({
  mount: "lab", key: "lab", result: "rLab",
  cases: [

  /* ------------------------------------------------------------------ 1. 슈테판·볼츠만 법칙 */
  {
    id: "c1", tag: "흑체 복사 · 별의 크기", title: "베텔게우스는 얼마나 클까", short: "베텔게우스 반지름",
    who: "🔴", name: "천체 사진 동호회",
    say: "“오리온자리의 붉은 별 <b>베텔게우스</b>는 태양보다 약 <b>10만 배</b> 밝대요. 그런데 스펙트럼에는 산화 타이타늄(TiO) 띠가 뚜렷해 표면이 꽤 차가운 별이라고 합니다. 이 별의 반지름을 추정해 전시판을 만들고 싶어요.”",
    predict: {
      q: "베텔게우스는 태양보다 표면 온도가 낮은데도 훨씬 밝습니다. 그 까닭은?",
      options: ["㉠ 지구에 더 가까워서", "㉡ 반지름이 매우 커서, 빛을 내는 표면적이 넓기 때문에", "㉢ 온도가 낮을수록 빛을 많이 내기 때문에"],
      answer: 1
    },
    task: "스펙트럼에 맞는 분광형을 고르고 반지름을 조절해 <b>광도가 태양의 10만 배</b>(± 5%)가 되게 하세요.",
    build: function (stage, api) {
      var H = api.h, cv = api.canvas(320), ctx = cv.ctx, W = cv.W;
      var SP = { B: { t: "B형 (약 20 000 K, 청백색)", T: 20000, c: "#9fc4ff" }, G: { t: "G형 (약 5800 K, 노란색)", T: 5800, c: "#ffe28a" }, M: { t: "M형 (약 3500 K, 붉은색, TiO 띠)", T: 3500, c: "#ff8a5c" } };
      var sp = "G", R = 100;
      function L() { return R * R * Math.pow(SP[sp].T / 5800, 4); }
      function draw() {
        H.paper(ctx, W, cv.H);
        H.text(ctx, "L = R² × T⁴ (태양을 1로 둔 값)", 40, 26, { s: 13.5, w: "900" });
        var cx = 200, cy = 175, pr = Math.min(130, 20 + Math.sqrt(R) * 3.8);
        ctx.fillStyle = SP[sp].c; ctx.beginPath(); ctx.arc(cx, cy, pr, 0, Math.PI * 2); ctx.fill();
        H.dot(ctx, 472, 290, 2, "#ffe28a");
        H.text(ctx, "태양 (같은 비율이면 이 점보다도 작음)", 480, 294, { s: 10.5, c: H.v("--mist") });
        var l = L(), ok = Math.abs(l - 1e5) / 1e5 <= 0.05;
        H.rows(ctx, 470, 60, [
          ["분광형 · 표면 온도", SP[sp].t],
          ["반지름", R + " 배 (태양 = 1)"],
          ["계산한 광도", (l >= 1000 ? Math.round(l).toLocaleString() : l.toFixed(1)) + " 배", ok ? "--green-700" : "--rose-700", true],
          ["목표 광도", "100,000 배"]
        ], 56);
      }
      cv.canvas._redraw = draw;
      api.seg({ label: "분광형", value: "G", options: [{ v: "B", t: "B형" }, { v: "G", t: "G형" }, { v: "M", t: "M형" }], onPick: function (x) { sp = x; draw(); } });
      api.slider({ label: "반지름 (태양의 몇 배)", min: 100, max: 1500, step: 10, value: 100, fmt: function (x) { return x + " 배"; }, onInput: function (x) { R = x; draw(); } });
      api.info("산화 타이타늄(TiO) 같은 분자는 온도가 낮은 별의 대기에서만 부서지지 않고 남아 흡수 띠를 만듭니다.");
      draw();
      return {
        judge: function () {
          var l = L(), ok = Math.abs(l - 1e5) / 1e5 <= 0.05;
          if (sp !== "M") return { ok: false, msg: "TiO 띠가 보이는 별의 분광형이 아닙니다. 붉고 차가운 별입니다." };
          if (ok) return { ok: true, msg: "M형 · 반지름 " + R + " 배 → 광도 약 " + Math.round(l).toLocaleString() + " 배. 태양 자리에 두면 목성 궤도 가까이까지 삼킬 크기입니다." };
          return { ok: false, msg: "광도 " + Math.round(l).toLocaleString() + " 배 — 목표 100,000 배와 다릅니다." };
        }
      };
    },
    hints: [
      "먼저 분광형을 정하세요. TiO 띠는 표면 온도가 가장 낮은 분광형에서 나타납니다.",
      "L = R² × (T/5800)⁴. T = 3500 K이면 (3500/5800)⁴ ≈ 0.133. 10만 ÷ 0.133 = R² → R ≈ ?"
    ],
    solution: "<b>M형</b>을 고르고 반지름을 <b>약 870 배</b>(850~890 배)로 하세요.",
    why: "별이 내는 에너지(광도)는 <b>표면적 × 단위 면적당 방출량</b>입니다. 슈테판·볼츠만 법칙에 따라 단위 면적당 방출량은 T⁴에 비례하므로 L ∝ R²T⁴.<br>" +
      "그래서 온도가 낮은 별이 매우 밝다면 <b>반지름이 엄청나게 크다</b>는 뜻입니다 — H-R도 오른쪽 위의 초거성입니다. 분광형(온도)과 광도만 알면 직접 볼 수 없는 별의 크기까지 계산할 수 있습니다."
  },

  /* ------------------------------------------------------------------ 2. 질량과 주계열 수명 */
  {
    id: "c2", tag: "별의 진화 · 질량과 수명", title: "생명이 자랄 시간이 있는 별", short: "별의 수명",
    who: "👽", name: "외계 생명 탐사 위원회",
    say: "“지구에서 생명이 나타나 복잡해지기까지 약 <b>40억 년</b>이 걸렸어요. 탐사할 별을 고를 때, 별이 주계열에 적어도 40억 년은 머물러야 한다고 봅니다. 밝은 별일수록 행성이 따뜻해 좋지만… 조건을 만족하는 <b>가장 무거운</b> 별은 몇 태양 질량일까요?”",
    predict: {
      q: "무거운 별과 가벼운 별 가운데 주계열에 더 오래 머무는 쪽은?",
      options: ["㉠ 무거운 별 — 연료(수소)가 많으므로", "㉡ 가벼운 별 — 연료는 적지만 훨씬 천천히 태우므로", "㉢ 질량과 상관없이 같다"],
      answer: 1
    },
    task: "별의 질량을 조절해 <b>주계열 수명이 40억 년 이상</b>인 별 가운데 <b>가장 무거운</b> 별을 찾으세요(0.05 M☉ 이내).",
    build: function (stage, api) {
      var H = api.h, cv = api.canvas(320), ctx = cv.ctx, W = cv.W;
      var M = 3;
      function life(m) { return 100 * Math.pow(m, -2.5); }
      function lum(m) { return Math.pow(m, 3.5); }
      var LIM = Math.pow(100 / 40, 1 / 2.5);
      var gx0 = 70, gx1 = 520, gy0 = 50, gy1 = 280;
      function GX(m) { return gx0 + (H.log10(m) + 1) / 2 * (gx1 - gx0); }
      function GY(t) { return gy1 - (H.log10(t) + 1) / 5 * (gy1 - gy0); }
      function draw() {
        H.paper(ctx, W, cv.H);
        H.text(ctx, "질량에 따른 주계열 수명 (가로·세로 모두 로그 눈금)", 40, 26, { s: 13.5, w: "900" });
        H.axes(ctx, gx0, gy0, gx1, gy1);
        var pts = []; for (var lm = -1; lm <= 1.0001; lm += 0.02) pts.push([GX(Math.pow(10, lm)), GY(life(Math.pow(10, lm)))]);
        H.line(ctx, pts, H.v("--amber"), 2.5);
        H.dash(ctx, gx0, GY(40), gx1, GY(40), H.v("--rose"));
        H.text(ctx, "40억 년", gx1 - 4, GY(40) - 6, { s: 10.5, w: "800", a: "right", c: H.v("--rose-700") });
        [0.1, 1, 10].forEach(function (m) { H.text(ctx, m + " M☉", GX(m), gy1 + 16, { s: 10, a: "center", c: H.v("--mist") }); });
        [1, 10, 100, 1000].forEach(function (t) { H.text(ctx, t + "억 년", gx0 - 6, GY(t) + 4, { s: 10, a: "right", c: H.v("--mist") }); });
        H.dot(ctx, GX(M), GY(life(M)), 6, H.v("--ink"));
        var tl = life(M);
        H.rows(ctx, 580, 60, [
          ["질량", M.toFixed(2) + " M☉"],
          ["광도 (≈ M³·⁵)", lum(M).toFixed(lum(M) < 10 ? 2 : 0) + " L☉"],
          ["주계열 수명 (≈ 100억 년 × M⁻²·⁵)", (tl >= 10 ? tl.toFixed(0) : tl.toFixed(1)) + " 억 년", tl >= 40 ? "--green-700" : "--rose-700", true]
        ], 62);
      }
      cv.canvas._redraw = draw;
      api.slider({ label: "별의 질량", min: 0.2, max: 5, step: 0.02, value: 3, fmt: function (x) { return x.toFixed(2) + " M☉"; }, onInput: function (x) { M = x; draw(); } });
      api.info("질량이 2배면 연료도 2배지만, 광도(연료를 태우는 빠르기)는 약 11배가 됩니다.");
      draw();
      return {
        judge: function () {
          var tl = life(M);
          if (tl < 40) return { ok: false, msg: M.toFixed(2) + " M☉ — 주계열 수명 " + tl.toFixed(1) + " 억 년. 생명이 자라기 전에 별이 늙어 버립니다." };
          if (M < LIM - 0.05) return { ok: false, msg: "수명은 충분하지만 더 무거운(더 밝은) 별도 조건을 만족합니다." };
          return { ok: true, msg: M.toFixed(2) + " M☉ — 수명 약 " + tl.toFixed(0) + " 억 년. 이보다 무거운 별은 연료를 너무 빨리 태웁니다." };
        }
      };
    },
    hints: [
      "무거운 별은 중심의 온도·압력이 높아 핵융합이 폭발적으로 빨라집니다. 그래프가 오른쪽으로 갈수록 뚝 떨어집니다.",
      "100 × M⁻²·⁵ = 40 → M²·⁵ = 2.5 → M = 2.5^(1/2.5) ≈ ?"
    ],
    solution: "약 <b>1.44 M☉</b>(1.40~1.44 M☉).",
    why: "무거운 별은 연료가 많지만 광도가 질량의 약 3.5제곱에 비례해 <b>훨씬 빨리</b> 태웁니다. 그래서 주계열 수명은 질량이 클수록 급격히 짧아져요 — 태양은 약 100억 년, 10 M☉ 별은 수천만 년.<br>" +
      "질량은 별의 일생 전체를 정합니다. 가벼운 별은 적색 거성을 거쳐 백색 왜성으로, 무거운 별은 초신성 폭발 뒤 중성자별이나 블랙홀로 삶을 마칩니다. ※ 수명 식은 수업용 어림식입니다."
  },

  /* ------------------------------------------------------------------ 3. 허블 – 르메트르 법칙 */
  {
    id: "c3", tag: "적색 편이 · 허블–르메트르 법칙", title: "스펙트럼으로 잰 은하의 거리", short: "허블 거리",
    who: "🌌", name: "은하 탐사 연구실",
    say: "“새로 찍은 은하의 스펙트럼이에요. 수소의 붉은 선(Hα, 실험실 파장 656.3 nm)이 긴 파장 쪽으로 밀려 있어요. 이 은하는 얼마나 빨리 멀어지고, 얼마나 멀리 있을까요? 허블 상수는 <b>70 km/s/Mpc</b>로 씁니다.”",
    predict: {
      q: "멀리 있는 은하일수록 스펙트럼의 흡수선은 어떻게 나타날까요?",
      options: ["㉠ 파장이 짧은 쪽(파란 쪽)으로 더 많이 밀린다", "㉡ 파장이 긴 쪽(붉은 쪽)으로 더 많이 밀린다", "㉢ 거리와 상관없이 제자리에 있다"],
      answer: 1
    },
    task: "비교 스펙트럼을 밀어 흡수선을 맞춰 <b>적색 편이 z</b>를 구하고, <b>은하까지의 거리</b>를 정하세요(± 4 Mpc).",
    build: function (stage, api) {
      var H = api.h, cv = api.canvas(330), ctx = cv.ctx, W = cv.W;
      var Z0 = 0.023, z = 0, d = 40, C = 300000, H0 = 70;
      var LINES = [486.1, 656.3, 589.3, 393.4, 396.8];
      var x0 = 60, x1 = 840;
      function X(l) { return x0 + (l - 380) / (700 - 380) * (x1 - x0); }
      function band(y, zz, title) {
        H.text(ctx, title, x0, y - 8, { s: 11.5, w: "800", c: H.v("--mist") });
        for (var l = 380; l < 700; l += 2) {
          var hue = 270 - (l - 380) / 320 * 270;
          ctx.fillStyle = "hsl(" + hue + ",75%,60%)"; ctx.fillRect(X(l), y, X(l + 2) - X(l) + 0.5, 30);
        }
        LINES.forEach(function (l0) { var l = l0 * (1 + zz); if (l < 700) { ctx.fillStyle = "#111"; ctx.fillRect(X(l) - 1.5, y, 3, 30); } });
      }
      function draw() {
        H.paper(ctx, W, cv.H);
        band(50, Z0, "관측한 은하의 스펙트럼");
        band(120, z, "비교 스펙트럼 (실험실) — 적색 편이 z = " + z.toFixed(3) + " 만큼 밀어 보기");
        [400, 450, 500, 550, 600, 650, 700].forEach(function (l) { H.text(ctx, l + " nm", X(l), 168, { s: 10, a: "center", c: H.v("--mist") }); });
        var v = C * z;
        H.rows(ctx, 60, 200, [
          ["후퇴 속도 v = c × z", Math.round(v).toLocaleString() + " km/s"],
          ["내가 정한 거리 d", d + " Mpc"]
        ], 50);
        H.rows(ctx, 380, 200, [
          ["허블–르메트르 법칙 v = H₀ × d", "70 × " + d + " = " + (H0 * d).toLocaleString() + " km/s"],
          ["두 속도의 차이", Math.round(Math.abs(H0 * d - v)).toLocaleString() + " km/s", Math.abs(H0 * d - v) < 300 && Math.abs(z - Z0) < 0.0006 ? "--green-700" : null]
        ], 50);
      }
      cv.canvas._redraw = draw;
      api.slider({ label: "적색 편이 z (비교 스펙트럼 밀기)", min: 0, max: 0.04, step: 0.001, value: 0, fmt: function (x) { return x.toFixed(3); }, onInput: function (x) { z = x; draw(); } });
      api.slider({ label: "은하까지의 거리", min: 20, max: 180, step: 2, value: 40, fmt: function (x) { return x + " Mpc"; }, onInput: function (x) { d = x; draw(); } });
      api.info("z = (관측 파장 − 원래 파장) ÷ 원래 파장. 가까운 은하에서는 후퇴 속도 v ≈ c × z (c = 30만 km/s).");
      draw();
      return {
        judge: function () {
          if (Math.abs(z - Z0) > 0.0006) return { ok: false, msg: "비교 스펙트럼의 흡수선이 관측 스펙트럼과 맞지 않습니다." };
          var dd = C * Z0 / H0;
          if (Math.abs(d - dd) <= 4) return { ok: true, msg: "z = 0.023 → v ≈ 6,900 km/s → d = v ÷ H₀ ≈ " + dd.toFixed(0) + " Mpc(약 3억 2천만 광년)." };
          return { ok: false, msg: "적색 편이는 맞았습니다. 거리 " + d + " Mpc 로는 허블–르메트르 법칙의 속도와 맞지 않아요." };
        }
      };
    },
    hints: [
      "먼저 z 슬라이더로 아래 스펙트럼의 검은 선들이 위 스펙트럼과 겹치게 하세요.",
      "v = 300 000 × z, 그리고 d = v ÷ 70."
    ],
    solution: "z = <b>0.023</b>, 거리 약 <b>99 Mpc</b>(96~102 Mpc).",
    why: "멀리 있는 은하일수록 빨리 멀어지고(v = H₀ d), 그 빛은 우주가 팽창하는 동안 늘어나 <b>붉은 쪽으로 밀립니다</b>(적색 편이). 그래서 스펙트럼 한 장이 곧 거리 측정기가 되지요.<br>" +
      "모든 은하가 모든 은하에게서 멀어지는 이 관계는 우주에 중심이 없이 공간 전체가 팽창한다는 뜻입니다. 거꾸로 되돌리면 우주의 나이(약 1/H₀ ≈ 140억 년)도 어림할 수 있습니다."
  }
  ]
});
})();
