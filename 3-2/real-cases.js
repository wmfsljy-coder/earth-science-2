/* 지구과학 Ⅲ-2 별과 우주의 진화 — 실제 자료
   r1 별의 색으로 표면 온도 어림하기 — 히파르코스 별 5천여 개의 색지수
   r2 우주는 얼마나 빨리 팽창할까 — Ia형 초신성 499개의 거리와 후퇴 속도
   자료: data/hr-stars.js (ESA 히파르코스), data/hubble-sn.js (Pantheon+) */
(function () {
"use strict";
var HR = window.REAL_HR || { rows: [], named: [] };
var HB = (window.REAL_HUBBLE || { rows: [] }).rows;
function temp(bv) { return 4600 * (1 / (0.92 * bv + 1.7) + 1 / (0.92 * bv + 0.62)); }   /* Ballesteros(2012) 식 */
function star(id) { return HR.named.filter(function (n) { return n[0] === id; })[0]; }
var ARC = star("69673") || ["69673", "아크투루스", -0.05, 88.85, 1.239], SIR = star("32349") || ["32349", "시리우스", -1.44, 379.21, 0.009];
var T_ARC = temp(ARC[4]), T_SIR = temp(SIR[4]);
var H0 = (function () { var a = 0, b = 0; HB.forEach(function (r) { a += r[0] * r[1]; b += r[0] * r[0]; }); return b ? a / b : 70; })();
var SRC1 = "<small>출처: ESA 히파르코스 목록(1997, CDS VizieR I/239)의 B−V 색지수와 시차로 구한 절대 등급, 별 " + HR.rows.length.toLocaleString() + "개. 색지수 → 온도는 Ballesteros(2012) 근사식 T ≈ 4600 × [1/(0.92(B−V)+1.7) + 1/(0.92(B−V)+0.62)] K. 사본은 data/hr-stars.js.</small>";
var SRC2 = "<small>출처: Pantheon+ Ia형 초신성 자료(Scolnic 외 2022) — 적색 편이 0.01 ~ 0.08 인 " + HB.length + "개. 사본은 data/hubble-sn.js.</small>";

window.sthLab({
  mount: "real", key: "real", result: "rReal", label: "실제 자료",
  doneNote: "정리하기 탭에서 실제 자료로 별의 물리량과 우주의 팽창을 설명해 보세요.",
  cases: [
  {
    id: "r1", tag: "실제 자료 · 별의 색과 온도", title: "별의 색으로 표면 온도 어림하기", short: "색과 온도",
    who: "🌈", name: "분광 관측실",
    say: "“별의 색은 표면 온도를 알려 줘요. 파란 필터(B)와 노란 필터(V)로 잰 밝기 차이인 <b>색지수 B−V</b> 가 클수록 붉고 차갑습니다. 히파르코스가 잰 실제 색지수로, 주황색 거성 <b>아크투루스(B−V = " + ARC[4] + ")</b>의 표면 온도를 어림해 주세요. 막대 아래의 식을 쓰면 됩니다.”",
    predict: {
      q: "시리우스(B−V ≈ 0)와 아크투루스(B−V ≈ 1.24) 가운데 표면 온도가 높은 별은?",
      options: ["㉠ 시리우스", "㉡ 아크투루스", "㉢ 같다"],
      answer: 0
    },
    task: "색지수를 식에 넣어 아크투루스의 표면 온도를 슬라이더로 맞추세요(± 200 K).",
    build: function (stage, api) {
      var H = api.h, cv = api.canvas(280), ctx = cv.ctx, W = cv.W, g = 6000;
      function draw() {
        H.paper(ctx, W, cv.H);
        var x0 = 60, x1 = 600, y0 = 24, y1 = cv.H - 40;
        function X(b) { return x0 + (b + 0.3) / 2.3 * (x1 - x0); }
        var bins = []; for (var b = -0.3; b < 2; b += 0.1) bins.push([b, HR.rows.filter(function (r) { return r[0] >= b && r[0] < b + 0.1; }).length]);
        var mx = Math.max.apply(null, bins.map(function (q) { return q[1]; }));
        bins.forEach(function (q) { var h = q[1] / mx * (y1 - y0 - 30), t = temp(q[0] + 0.05), c = t > 9000 ? "#7ea6ff" : (t > 6500 ? "#d8e4ff" : (t > 5300 ? "#ffe9a8" : (t > 4200 ? "#ffbe73" : "#ff8a5c"))); ctx.fillStyle = c; ctx.fillRect(X(q[0]) + 1, y1 - h, X(q[0] + 0.1) - X(q[0]) - 2, h); });
        H.axes(ctx, x0, y0, x1, y1);
        [0, 0.5, 1, 1.5].forEach(function (b) { H.text(ctx, b.toFixed(1), X(b), y1 + 14, { s: 10, a: "center", c: H.v("--mist") }); H.text(ctx, Math.round(temp(b) / 100) * 100 + " K", X(b), y1 + 28, { s: 9.5, a: "center", c: H.v("--mist") }); });
        H.text(ctx, "색지수 B−V 별 수 (막대 색 = 그 온도의 별빛 색)", x0 + 6, y0 - 6, { s: 11, w: "700", c: H.v("--mist") });
        [[SIR, "--brand-700"], [ARC, "--coral-700"]].forEach(function (s) { H.dash(ctx, X(s[0][4]), y0, X(s[0][4]), y1, H.v(s[1]), 1.5); H.text(ctx, s[0][1], X(s[0][4]) + 4, y0 + 12, { s: 11, w: "800", c: H.v(s[1]) }); });
        H.rows(ctx, 640, 40, [["시리우스 B−V", SIR[4].toFixed(3)], ["아크투루스 B−V", ARC[4].toFixed(3)], ["내 답 (아크투루스 온도)", g.toLocaleString() + " K", null, true]], 60);
      }
      cv.canvas._redraw = draw;
      api.slider({ label: "아크투루스의 표면 온도", min: 2500, max: 12000, step: 50, value: 6000, fmt: function (x) { return x.toLocaleString() + " K"; }, onInput: function (x) { g = x; api.changed(); draw(); } });
      api.info("T ≈ 4600 × [1/(0.92 × B−V + 1.7) + 1/(0.92 × B−V + 0.62)] K. 아래 눈금의 K 값도 참고하세요. " + SRC1);
      draw();
      return {
        judge: function () {
          if (Math.abs(g - T_ARC) <= 200) return { ok: true, msg: "약 " + Math.round(T_ARC / 10) * 10 + " K — 태양(약 5800 K)보다 차가운 K 형 별입니다. 시리우스는 약 " + Math.round(T_SIR / 100) * 100 + " K 로 계산돼요." };
          return { ok: false, msg: g.toLocaleString() + " K 는 " + (g < T_ARC ? "너무 낮습니다" : "너무 높습니다") + ". 0.92 × 1.239 ≈ 1.14 를 식에 넣어 보세요." };
        }
      };
    },
    hints: ["0.92 × 1.239 ≈ 1.14 → 1/(1.14 + 1.7) + 1/(1.14 + 0.62) = ?", "0.352 + 0.568 ≈ 0.92, × 4600 ≈ ?"],
    solution: "약 <b>" + Math.round(T_ARC / 10) * 10 + " K</b>.",
    why: "뜨거운 별일수록 짧은 파장(파란빛)을 많이 내므로 B 필터로 더 밝게 보이고 B−V 가 작아집니다(빈의 변위 법칙). 그래서 색지수만 재도 표면 온도를 어림할 수 있어요. 하버드 천문대의 여성 연구자들(애니 점프 캐넌 등)은 수십만 개 별의 스펙트럼을 O·B·A·F·G·K·M 으로 분류했는데, 이 순서가 곧 온도 순서입니다.<br>"
      + "※ 이 식은 근사식이고, 성간 티끌이 별빛을 붉게 만들면(성간 적색화) 실제보다 차갑게 계산됩니다. 아크투루스의 분광 관측 온도는 약 4300 K 입니다."
  },
  {
    id: "r2", tag: "실제 자료 · 우주의 팽창", title: "우주는 얼마나 빨리 팽창할까", short: "허블 상수",
    who: "💥", name: "초신성 탐사팀",
    say: "“Ia형 초신성은 진짜 밝기가 거의 같아 거리를 잴 수 있어요(표준 촛불). 실제로 관측된 초신성 " + HB.length + "개가 있는 은하의 거리와 멀어지는 속도로, 원점을 지나는 직선의 기울기 <b>허블 상수 H₀</b> 를 구해 주세요.”",
    predict: {
      q: "먼 은하일수록 멀어지는 속도는?",
      options: ["㉠ 거리와 관계없다", "㉡ 거리에 비례해 빨라진다", "㉢ 먼 은하일수록 느려진다"],
      answer: 1
    },
    task: "직선의 기울기(H₀, km/s/Mpc)를 바꿔 점들에 가장 잘 맞추세요(± 3).",
    build: function (stage, api) {
      var H = api.h, cv = api.canvas(280), ctx = cv.ctx, W = cv.W, k = 40;
      function draw() {
        H.paper(ctx, W, cv.H);
        var x0 = 70, x1 = 620, y0 = 24, y1 = cv.H - 36;
        function X(d) { return x0 + d / 420 * (x1 - x0); }
        function Y(v) { return y1 - v / 25000 * (y1 - y0); }
        H.axes(ctx, x0, y0, x1, y1);
        [0, 10000, 20000].forEach(function (v) { H.text(ctx, v.toLocaleString(), x0 - 6, Y(v) + 4, { s: 10, a: "right", c: H.v("--mist") }); });
        [0, 100, 200, 300, 400].forEach(function (d) { H.text(ctx, d + " Mpc", X(d), y1 + 15, { s: 10, a: "center", c: H.v("--mist") }); });
        HB.forEach(function (r) { H.dot(ctx, X(r[0]), Y(r[1]), 2.4, H.v("--brand")); });
        H.line(ctx, [[X(0), Y(0)], [X(Math.min(420, 25000 / k)), Y(Math.min(25000, k * 420))]], H.v("--amber-700"), 2.5);
        H.rows(ctx, 660, 60, [["내 H₀", k + " km/s/Mpc", null, true], ["1/H₀", (977.8 / k).toFixed(1) + " 십억 년"]], 60);
      }
      cv.canvas._redraw = draw;
      api.slider({ label: "허블 상수 H₀", min: 30, max: 120, step: 1, value: 40, fmt: function (x) { return x + " km/s/Mpc"; }, onInput: function (x) { k = x; api.changed(); draw(); } });
      api.info("1 Mpc ≈ 326만 광년. " + SRC2);
      draw();
      return {
        judge: function () {
          if (Math.abs(k - H0) <= 3) return { ok: true, msg: "약 " + H0.toFixed(1) + " km/s/Mpc, 1/H₀ ≈ " + (977.8 / H0).toFixed(1) + " 십억 년 — 우주의 나이(약 138억 년)와 비슷한 크기입니다." };
          return { ok: false, msg: k + " 는 " + (k < H0 ? "너무 완만합니다" : "너무 가파릅니다") + "." };
        }
      };
    },
    hints: ["300 Mpc 의 점들은 대략 2만 1천 km/s 입니다.", "21000 ÷ 300 ≈ ?"],
    solution: "약 <b>" + H0.toFixed(0) + " km/s/Mpc</b>.",
    why: "은하가 거리에 비례하는 속도로 멀어진다는 것은 공간 자체가 고르게 늘어나고 있다는 뜻이고, 시간을 거꾸로 돌리면 우주가 한 점에서 시작했다는 빅뱅 우주론으로 이어집니다. 1/H₀ 는 우주의 나이를 어림하는 잣대가 됩니다.<br>"
      + "1998년 더 먼 초신성들을 재어 보니 예상보다 어두워, 우주의 팽창이 오히려 빨라지고 있다는 것(가속 팽창, 암흑 에너지)이 밝혀졌습니다."
  }
  ]
});
})();
