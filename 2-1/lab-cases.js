/* 지구과학 Ⅱ-1 지구의 역사 — 응용 실험실
   이야기에서 찾은 개념을 처음 보는 상황에 써 본다. 공용 엔진: ../assets/lab.js (sthLab) */
(function () {
"use strict";

window.sthLab({
  mount: "lab", key: "lab", result: "rLab",
  cases: [

  /* ------------------------------------------------------------------ 1. 열쇠층으로 지층 대비 */
  {
    id: "c1", tag: "지층 대비 · 열쇠층", title: "두 골짜기의 지층 잇기", short: "지층 대비",
    who: "🗺️", name: "지질도 작성팀",
    say: "“10 km 떨어진 두 골짜기의 지층을 조사했어요. 둘 다 <b>사암</b>과 <b>석회암</b>, 그리고 얇은 <b>응회암(화산재층)</b>이 있습니다. 두 지역의 지층을 같은 시기끼리 이어야 지질도를 그릴 수 있어요. B 지역 기둥을 위아래로 옮겨 맞춰 주세요.”",
    predict: {
      q: "멀리 떨어진 두 지역의 지층을 같은 시기끼리 이을 때 가장 믿을 만한 기준이 되는 층은?",
      options: ["㉠ 두께가 가장 두꺼운 층", "㉡ 짧은 기간에 넓은 지역에 쌓인 화산재층(응회암)", "㉢ 색깔이 가장 비슷한 사암층"],
      answer: 1
    },
    task: "B 기둥을 옮겨 <b>같은 시기에 쌓인 층이 같은 높이</b>에 오도록 맞추세요(± 2 m).",
    build: function (stage, api) {
      var H = api.h, cv = api.canvas(360), ctx = cv.ctx, W = cv.W;
      /* [이름, 두께 m, 색] 아래에서 위로 */
      var A = [["셰일", 14, "#8a8f98"], ["사암", 12, "#e3c78a"], ["응회암", 3, "#f07a7a"], ["석회암", 16, "#cfe0e8"], ["역암", 10, "#b9a27a"]];
      var B = [["셰일", 8, "#8a8f98"], ["응회암", 3, "#f07a7a"], ["사암", 12, "#e3c78a"], ["석회암", 12, "#cfe0e8"]];
      var off = 3;
      var base = 330, sc = 4.2;
      function tuffTop(col, o) { var h = 0; for (var i = 0; i < col.length; i++) { if (col[i][0] === "응회암") return h; h += col[i][1]; } return 0; }
      function column(x, col, o, name) {
        var y = base - o * sc;
        H.text(ctx, name, x + 45, 30, { s: 13, w: "900", a: "center" });
        col.forEach(function (L) {
          var h = L[1] * sc; y -= h;
          ctx.fillStyle = L[2]; ctx.fillRect(x, y, 90, h);
          ctx.strokeStyle = "rgba(0,0,0,.25)"; ctx.strokeRect(x, y, 90, h);
          if (h > 14) H.text(ctx, L[0], x + 45, y + h / 2 + 4, { s: 11, w: "800", a: "center", c: "#1b2430" });
          else H.text(ctx, L[0], x + 98, y + h / 2 + 4, { s: 10.5, w: "800", c: H.v("--rose-700") });
        });
      }
      function draw() {
        H.paper(ctx, W, cv.H);
        column(140, A, 0, "A 지역");
        column(420, B, off, "B 지역");
        var ya = base - (tuffTop(A) + 3) * sc, yb = base - (off + tuffTop(B) + 3) * sc;
        H.dash(ctx, 230, ya, 420, yb, H.v("--rose"), 2);
        var ok = Math.abs((tuffTop(A)) - (off + tuffTop(B))) <= 2;
        H.text(ctx, "응회암끼리 잇는 선", 325, Math.min(ya, yb) - 8, { s: 11, w: "800", a: "center", c: H.v("--rose-700") });
        H.rows(ctx, 640, 80, [
          ["B 기둥을 올린 높이", (off >= 0 ? "+" : "") + off + " m"],
          ["응회암 높이 차", Math.abs(tuffTop(A) - off - tuffTop(B)).toFixed(0) + " m", ok ? "--green-700" : "--rose-700", true]
        ], 70);
        H.text(ctx, "※ B의 사암은 응회암 ‘위’에 있습니다", 640, 250, { s: 11.5, c: H.v("--mist") });
      }
      cv.canvas._redraw = draw;
      api.slider({ label: "B 기둥을 위아래로 옮기기", min: -10, max: 30, step: 1, value: 3, fmt: function (x) { return (x >= 0 ? "+" : "") + x + " m"; },
        onInput: function (x) { off = x; draw(); } });
      api.info("처음에는 두 사암층의 높이가 맞춰져 있습니다. 그런데 사암은 강가·해변처럼 비슷한 환경이면 <b>서로 다른 시기</b>에도 쌓입니다.");
      draw();
      return {
        judge: function () {
          var d = Math.abs(tuffTop(A) - off - tuffTop(B));
          if (d <= 2) return { ok: true, msg: "응회암끼리 맞췄습니다(+" + off + " m). 이제 보면 B의 사암은 A의 석회암과 같은 시기에 쌓였네요 — 같은 암석이 같은 시기는 아닙니다." };
          return { ok: false, msg: "응회암의 높이가 " + d.toFixed(0) + " m 어긋납니다." + (off === 3 ? " 지금은 사암끼리 맞춘 상태예요." : "") };
        }
      };
    },
    hints: [
      "화산재는 한 번의 분화로 며칠 ~ 몇 주 만에 넓은 지역에 쌓입니다. 두 지역에서 <b>동시에</b> 쌓였다고 확신할 수 있는 층은?",
      "A의 응회암은 바닥에서 26 m, B의 응회암은 바닥에서 8 m 위에 있습니다."
    ],
    solution: "B 기둥을 <b>+18 m</b>(16~20 m) 올려 두 응회암을 같은 높이에 맞추세요.",
    why: "지층 대비의 기준이 되는 층을 <b>열쇠층(건층)</b>이라고 합니다. 화산재층이나 석탄층처럼 <b>짧은 기간에 넓은 지역</b>에 쌓여 특징이 뚜렷한 층이 좋습니다.<br>" +
      "암석의 종류가 같다고 같은 시기는 아닙니다. 이 예에서 B의 사암은 A의 석회암과 같은 시기에 쌓였어요 — 같은 때 한 곳은 바닷가(사암), 다른 곳은 얕은 바다(석회암)였던 것입니다. 멀리 떨어진 곳끼리는 <b>표준 화석</b>으로도 대비합니다."
  },

  /* ------------------------------------------------------------------ 2. 반감기 */
  {
    id: "c2", tag: "방사성 동위 원소 · 반감기", title: "검사용 방사성 약품 고르기", short: "반감기",
    who: "🏥", name: "핵의학과",
    say: "“뼈 사진을 찍을 때 방사성 약품을 주사해요. 촬영하는 <b>1시간 동안</b>은 처음의 85% 이상 남아 있어야 하고, <b>하루(24시간) 뒤</b>에는 처음의 <b>1/16 이하</b>로 줄어야 안전하게 일상으로 돌아갈 수 있어요. 어떤 동위 원소가 알맞을까요?”",
    predict: {
      q: "반감기가 6시간인 원소가 처음의 1/16이 되려면 몇 시간이 걸릴까요?",
      options: ["㉠ 16시간", "㉡ 24시간", "㉢ 96시간"],
      answer: 1
    },
    task: "동위 원소를 고르고, 남은 양이 <b>처음의 1/16이 되는 시각</b>에 시간 슬라이더를 맞추세요.",
    build: function (stage, api) {
      var H = api.h, cv = api.canvas(320), ctx = cv.ctx, W = cv.W;
      var ISO = { tc: { t: "테크네튬-99m", hl: 6, c: "--teal" }, i: { t: "아이오딘-131", hl: 192, c: "--violet" }, f: { t: "플루오린-18", hl: 1.83, c: "--coral" } };
      var iso = "i", t = 12;
      function rem(k, h) { return Math.pow(0.5, h / ISO[k].hl); }
      var gx0 = 70, gx1 = 560, gy0 = 50, gy1 = 280;
      function GX(h) { return gx0 + h / 48 * (gx1 - gx0); }
      function GY(p) { return gy1 - p * (gy1 - gy0); }
      function draw() {
        H.paper(ctx, W, cv.H);
        H.text(ctx, "주사 뒤 몸속에 남은 방사성 원소의 비율", 40, 28, { s: 14, w: "900" });
        H.axes(ctx, gx0, gy0, gx1, gy1);
        [0, 12, 24, 36, 48].forEach(function (h) { H.text(ctx, h + "시간", GX(h), gy1 + 16, { s: 10, a: "center", c: H.v("--mist") }); });
        [0, 0.5, 1].forEach(function (p) { H.text(ctx, (p * 100) + "%", gx0 - 6, GY(p) + 4, { s: 10, a: "right", c: H.v("--mist") }); });
        H.dash(ctx, gx0, GY(1 / 16), gx1, GY(1 / 16), H.v("--rose"));
        H.text(ctx, "1/16 (6.25%)", gx1 - 4, GY(1 / 16) - 6, { s: 10.5, w: "800", a: "right", c: H.v("--rose-700") });
        Object.keys(ISO).forEach(function (k) {
          var pts = []; for (var h = 0; h <= 48; h += 0.25) pts.push([GX(h), GY(rem(k, h))]);
          H.line(ctx, pts, H.v(ISO[k].c), k === iso ? 3.5 : 1.2);
        });
        H.line(ctx, [[GX(t), gy0], [GX(t), gy1]], H.v("--ink"), 1.5);
        var p = rem(iso, t);
        H.dot(ctx, GX(t), GY(p), 6, H.v(ISO[iso].c + "-700"));
        H.rows(ctx, 610, 60, [
          ["고른 원소 (반감기)", ISO[iso].t + " (" + (ISO[iso].hl >= 24 ? (ISO[iso].hl / 24) + "일" : ISO[iso].hl + "시간") + ")"],
          ["1시간 뒤 남은 양", (rem(iso, 1) * 100).toFixed(1) + "%", rem(iso, 1) >= 0.85 ? "--green-700" : "--rose-700"],
          ["24시간 뒤 남은 양", (rem(iso, 24) * 100).toFixed(1) + "%", rem(iso, 24) <= 1 / 16 + 1e-9 ? "--green-700" : "--rose-700"],
          [t + "시간 뒤 남은 양", (p * 100).toFixed(2) + "%", null, true]
        ], 52);
      }
      cv.canvas._redraw = draw;
      api.seg({ label: "동위 원소", value: "i", options: [{ v: "f", t: "플루오린-18 (1.83시간)" }, { v: "tc", t: "테크네튬-99m (6시간)" }, { v: "i", t: "아이오딘-131 (8일)" }],
        onPick: function (x) { iso = x; draw(); } });
      api.slider({ label: "주사 뒤 시간", min: 0, max: 48, step: 1, value: 12, fmt: function (x) { return x + " 시간"; },
        onInput: function (x) { t = x; draw(); } });
      api.info("반감기마다 남은 양이 절반이 됩니다: 1 → 1/2 → 1/4 → 1/8 → 1/16.");
      draw();
      return {
        judge: function () {
          var r1 = rem(iso, 1), r24 = rem(iso, 24);
          if (r1 < 0.85) return { ok: false, msg: ISO[iso].t + " — 1시간 만에 " + (r1 * 100).toFixed(0) + "%로 줄어 촬영 중에 너무 약해집니다." };
          if (r24 > 1 / 16 + 1e-9) return { ok: false, msg: ISO[iso].t + " — 하루 뒤에도 " + (r24 * 100).toFixed(0) + "%가 남아 너무 오래 머뭅니다." };
          if (Math.abs(rem(iso, t) - 1 / 16) > 0.002) return { ok: false, msg: "원소는 알맞습니다. 그런데 " + t + "시간 뒤에는 " + (rem(iso, t) * 100).toFixed(2) + "% — 1/16이 되는 시각을 찾으세요." };
          return { ok: true, msg: "테크네튬-99m — 촬영 1시간 동안 약 89%가 남고, 24시간(반감기 4번) 뒤 1/16로 줄어듭니다." };
        }
      };
    },
    hints: [
      "반감기가 짧으면 촬영 중에 사라지고, 길면 몸속에 오래 남습니다. 두 조건을 모두 만족하는 ‘알맞게 짧은’ 반감기를 찾으세요.",
      "1/16 = (1/2)⁴. 반감기가 네 번 지나면 됩니다."
    ],
    solution: "<b>테크네튬-99m</b>(반감기 6시간)을 고르고 시간을 <b>24시간</b>에 두세요.",
    why: "방사성 동위 원소는 주변 조건과 상관없이 <b>일정한 반감기</b>마다 절반씩 붕괴합니다. 그래서 남은 비율을 재면 지난 시간을 알 수 있어요 — 암석과 화석의 <b>절대 연령</b>을 구하는 원리입니다.<br>" +
      "재려는 시간의 길이에 맞는 ‘시계’를 골라야 한다는 점도 같습니다. 수천 년 된 뼈는 반감기 5730년의 탄소-14, 수억 년 된 암석은 반감기가 수억 ~ 수십억 년인 우라늄·칼륨으로 잽니다."
  },

  /* ------------------------------------------------------------------ 3. 시상 화석 */
  {
    id: "c3", tag: "시상 화석 · 고환경", title: "산호 화석이 말하는 옛 바다", short: "산호 시상화석",
    who: "🪸", name: "지질 박물관",
    say: "“석회암 지층에서 <b>산호 화석</b>이 무더기로 나왔어요. 오늘날 초(礁)를 만드는 산호는 까다로운 조건에서만 삽니다. 이 지층이 쌓일 당시의 바다를 복원해 전시 그림을 그리려 해요. 환경 조건을 골라 주세요.”",
    predict: {
      q: "산호 화석처럼 특정한 환경에서만 사는 생물의 화석을 무엇이라 하고, 무엇을 알려 줄까요?",
      options: ["㉠ 표준 화석 — 지층이 쌓인 시대", "㉡ 시상 화석 — 지층이 쌓인 당시의 환경", "㉢ 흔적 화석 — 생물의 이동 경로"],
      answer: 1
    },
    task: "수온, 수심, 물의 맑기, 염분을 정해 <b>초를 만드는 산호가 살 수 있는 바다</b>를 복원하세요.",
    build: function (stage, api) {
      var H = api.h, cv = api.canvas(320), ctx = cv.ctx, W = cv.W;
      var temp = "cold", depth = 80, clear = "turbid", sal = "low";
      function checks() {
        return [
          ["수온 18 ℃ 이상의 따뜻한 바다", temp === "warm"],
          ["햇빛이 닿는 얕은 바다 (수심 30 m 이하)", depth <= 30],
          ["흙탕물이 없는 맑은 물", clear === "clear"],
          ["바닷물 정도의 염분", sal === "sea"]
        ];
      }
      function draw() {
        H.paper(ctx, W, cv.H);
        H.text(ctx, "복원한 옛 바다 단면", 40, 28, { s: 14, w: "900" });
        var top = 70, sc = 2.2;
        var col = temp === "warm" ? "--teal" : "--brand";
        H.box(ctx, 60, top, 420, 230, H.v(col), clear === "clear" ? 0.25 : 0.45);
        if (clear !== "clear") for (var i = 0; i < 40; i++) H.dot(ctx, 70 + (i * 97) % 400, top + 10 + (i * 53) % 200, 2, "rgba(140,110,60,.6)");
        var by = Math.min(300, top + depth * sc);
        ctx.fillStyle = "#c9b48a"; ctx.fillRect(60, by, 420, 300 - by + 20);
        var ok = checks().every(function (c) { return c[1]; });
        H.text(ctx, ok ? "🪸🪸🐠🪸" : "·  ·  ·", 270, by - 6, { s: ok ? 26 : 18, a: "center" });
        H.text(ctx, "☀️", 90, 60, { s: 22 });
        H.text(ctx, "수심 " + depth + " m", 470, by - 8, { s: 11.5, w: "800", a: "right" });
        checks().forEach(function (c, i) {
          H.text(ctx, (c[1] ? "✓ " : "✗ ") + c[0], 520, 90 + i * 40, { s: 12.5, w: "800", c: c[1] ? H.v("--green-700") : H.v("--rose-700") });
        });
      }
      cv.canvas._redraw = draw;
      api.seg({ label: "수온", value: "cold", options: [{ v: "cold", t: "차가움 (10 ℃)" }, { v: "warm", t: "따뜻함 (25 ℃)" }], onPick: function (x) { temp = x; draw(); } });
      api.slider({ label: "수심", min: 5, max: 200, step: 5, value: 80, fmt: function (x) { return x + " m"; }, onInput: function (x) { depth = x; draw(); } });
      api.seg({ label: "물의 맑기", value: "turbid", options: [{ v: "turbid", t: "강물이 흘러드는 탁한 물" }, { v: "clear", t: "맑은 물" }], onPick: function (x) { clear = x; draw(); } });
      api.seg({ label: "염분", value: "low", options: [{ v: "low", t: "민물이 섞인 낮은 염분" }, { v: "sea", t: "보통 바닷물" }], onPick: function (x) { sal = x; draw(); } });
      api.info("초를 만드는 산호의 몸속에는 광합성을 하는 조류가 함께 삽니다. 조류에게 무엇이 필요할까요?");
      draw();
      return {
        judge: function () {
          var bad = checks().filter(function (c) { return !c[1]; });
          if (!bad.length) return { ok: true, msg: "따뜻하고 얕고 맑은 바다 — 이 지층은 오늘날 열대의 산호초 같은 곳에서 쌓였습니다." };
          return { ok: false, msg: "산호가 살 수 없는 조건: " + bad.map(function (c) { return c[0]; }).join(", ") };
        }
      };
    },
    hints: [
      "산호는 몸속 조류의 광합성에 기대어 삽니다. 햇빛이 충분히 닿으려면 물이 어때야 할까요?",
      "오늘날 산호초가 있는 곳 — 오스트레일리아 대보초, 몰디브 — 를 떠올려 보세요. 따뜻하고, 얕고, 맑고, 짠 바다입니다."
    ],
    solution: "<b>따뜻함 · 수심 30 m 이하 · 맑은 물 · 보통 바닷물</b>.",
    why: "특정한 환경에서만 사는 생물의 화석은 지층이 쌓인 당시의 환경을 알려 주는 <b>시상 화석</b>입니다. 산호는 따뜻하고 얕고 맑은 바다, 고사리는 따뜻하고 습한 육지를 가리킵니다.<br>" +
      "반대로 시대를 알려 주는 표준 화석은 <b>짧게 살고 넓게 퍼진</b> 생물이어야 하고, 시상 화석은 <b>오래 살았고 사는 환경이 좁은</b> 생물일수록 좋습니다. 오늘날의 생물이 사는 조건으로 과거를 읽는 것 — ‘현재는 과거의 열쇠’입니다."
  }
  ]
});
})();
