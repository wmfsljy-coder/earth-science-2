/* 지구과학 Ⅰ-1 해수의 순환과 대기의 변화 — 실제 자료
   r1 여름 동해, 수온은 깊이에 따라 어떻게 바뀔까 — 아르고 플로트가 잰 연직 분포
   r2 동해 깊은 곳의 물은 몇 도일까 — 동해 고유수
   자료: data/argo-east.js (국제 아르고 계획, 2024년 8월 동해) */
(function () {
"use strict";
var AR = window.REAL_ARGO || { profiles: [] };
var P = AR.profiles[0] || { date: "", rows: [] };                     /* [압력 dbar, 수온, 염분] */
function tAt(z) { var r = P.rows; for (var i = 1; i < r.length; i++) if (r[i][0] >= z) { var a = r[i - 1], b = r[i], f = (z - a[0]) / (b[0] - a[0]); return [a[1] + f * (b[1] - a[1]), a[2] + f * (b[2] - a[2])]; } var l = r[r.length - 1]; return [l[1], l[2]]; }
var Z1 = (function () { var r = P.rows; for (var i = 1; i < r.length; i++) if (r[i][1] < 1) { var a = r[i - 1], b = r[i]; return a[0] + (1 - a[1]) / (b[1] - a[1]) * (b[0] - a[0]); } return 400; })();
var TOP = P.rows.length ? P.rows[0] : [10, 25, 32], DEEP = P.rows.length ? P.rows[P.rows.length - 1] : [800, 0.5, 34];
var SRC = "<small>출처: 국제 아르고 계획(Argo) 프로파일링 플로트 " + AR.float + ", 동해 북위 " + (AR.lat || 36.15).toFixed(2) + "°·동경 " + (AR.lng || 131.33).toFixed(2) + "° 부근, " + P.date + " 관측(Ifremer ERDDAP). 압력 1 dbar ≈ 깊이 1 m. 사본은 data/argo-east.js.</small>";

function prof(H, ctx, W, CH, z, what) {
  H.paper(ctx, W, CH);
  var x0 = 70, x1 = 560, y0 = 34, y1 = CH - 20;
  var lo = what === "s" ? 32 : 0, hi = what === "s" ? 34.5 : 28;
  function X(v) { return x0 + (v - lo) / (hi - lo) * (x1 - x0); }
  function Y(d) { return y0 + d / 850 * (y1 - y0); }                  /* 아래로 갈수록 깊음 */
  ctx.save(); ctx.strokeStyle = H.v("--line"); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y0); ctx.moveTo(x0, y0); ctx.lineTo(x0, y1); ctx.stroke(); ctx.restore();
  [0, 200, 400, 600, 800].forEach(function (d) { H.text(ctx, d + " m", x0 - 6, Y(d) + 4, { s: 10, a: "right", c: H.v("--mist") }); });
  (what === "s" ? [32, 33, 34] : [0, 5, 10, 15, 20, 25]).forEach(function (v) { H.text(ctx, v, X(v), y0 - 8, { s: 10, a: "center", c: H.v("--mist") }); });
  H.text(ctx, what === "s" ? "염분 (psu)" : "수온 (°C)", x1, y0 - 22, { s: 11, w: "700", a: "right", c: H.v("--mist") });
  H.line(ctx, P.rows.map(function (r) { return [X(what === "s" ? r[2] : r[1]), Y(r[0])]; }), what === "s" ? H.v("--teal") : H.v("--coral-700"), 2.5);
  P.rows.forEach(function (r) { H.dot(ctx, X(what === "s" ? r[2] : r[1]), Y(r[0]), 3, H.v("--brand")); });
  if (z != null) { H.dash(ctx, x0, Y(z), x1, Y(z), H.v("--amber-700"), 1.5); }
  return { X: X, Y: Y };
}

window.sthLab({
  mount: "real", key: "real", result: "rReal", label: "실제 자료",
  doneNote: "정리하기 탭에서 실제 자료로 해수의 층 구조와 동해의 심층수를 설명해 보세요.",
  cases: [
  {
    id: "r1", tag: "실제 자료 · 수온의 연직 분포", title: "여름 동해, 깊어질수록 수온은?", short: "수온 연직 분포",
    who: "🌊", name: "해양 관측 연구소",
    say: "“아르고 플로트는 바다를 오르내리며 수온과 염분을 재고 위성으로 보내는 자동 관측 장비예요. 아래는 " + P.date + " 동해 한가운데에서 한 플로트가 잰 <b>실제 수온</b>입니다. 깊이를 옮겨 가며 읽고, 수온이 처음으로 <b>1 °C 아래</b>로 떨어지는 깊이를 찾아 주세요.”",
    predict: {
      q: "여름 동해에서 깊이에 따라 수온은 어떻게 변할까요?",
      options: ["㉠ 깊이와 관계없이 고르다", "㉡ 표층은 따뜻하고, 어느 깊이에서 빠르게 낮아진 뒤 깊은 곳은 매우 차갑다", "㉢ 깊을수록 따뜻해진다"],
      answer: 1
    },
    task: "깊이를 옮겨 수온을 읽고, 수온이 1 °C 아래로 떨어지는 가장 얕은 깊이를 맞추세요(± 40 m).",
    build: function (stage, api) {
      var H = api.h, cv = api.canvas(330), ctx = cv.ctx, W = cv.W, z = 100, what = "t";
      function draw() {
        prof(H, ctx, W, cv.H, z, what);
        var v = tAt(z);
        H.rows(ctx, 610, 60, [["고른 깊이", z + " m", "--amber-700", true], ["수온", v[0].toFixed(2) + " °C"], ["염분", v[1].toFixed(2) + " psu"]], 62);
      }
      cv.canvas._redraw = draw;
      api.seg({ label: "보기", value: "t", options: [{ v: "t", t: "수온" }, { v: "s", t: "염분" }], onPick: function (x) { what = x; draw(); } });
      api.slider({ label: "깊이", min: 10, max: 800, step: 10, value: 100, fmt: function (x) { return x + " m"; }, onInput: function (x) { z = x; api.changed(); draw(); } });
      api.info("점은 플로트가 실제로 잰 깊이, 선은 그 사이를 이은 것입니다. " + SRC
        + "<div data-link='{\"id\":\"kma-argo\",\"title\":\"국립기상과학원 아르고 자료 (교과서 연결 자료)\",\"src\":\"국립기상과학원 · 비상교육 지구과학 5 · 25쪽\",\"url\":\"https://argo.nims.go.kr/argo3\",\"ask\":\"우리나라 둘레 바다에서 지금 움직이고 있는 아르고 플로트 하나를 골라, 가장 최근 관측의 표층 수온과 가장 깊은 곳의 수온을 적어 오세요.\"}'></div>"
        + "<div data-map='{\"id\":\"argo-east\",\"name\":\"동해 울릉 분지 부근 (플로트 위치)\",\"lat\":" + (AR.lat || 36.15) + ",\"lng\":" + (AR.lng || 131.33) + ",\"zoom\":7,\"ask\":\"플로트가 있던 곳은 울릉도·독도와 어떤 위치에 있나요? 둘레 바다의 색(깊이)도 보세요.\"}'></div>");
      draw();
      return {
        judge: function () {
          if (Math.abs(z - Z1) <= 40) return { ok: true, msg: "약 " + Math.round(Z1) + " m 에서 1 °C 아래로 떨어집니다. 표층(" + TOP[1].toFixed(1) + " °C)에서 수백 m 사이에 20 °C 넘게 낮아져요." };
          return { ok: false, msg: z + " m 의 수온은 " + tAt(z)[0].toFixed(2) + " °C 입니다. " + (tAt(z)[0] >= 1 ? "더 깊이 내려가 보세요." : "더 얕은 곳에서 이미 1 °C 아래로 떨어졌어요.") };
        }
      };
    },
    hints: ["130 ~ 230 m 사이에서 수온이 가장 빠르게 떨어집니다.", "400 m 근처를 보세요."],
    solution: "약 <b>" + Math.round(Z1) + " m</b>.",
    why: "해수는 수온에 따라 세 층으로 나뉩니다. 바람이 섞어 주는 따뜻한 <b>혼합층</b>, 깊이에 따라 수온이 빠르게 낮아지는 <b>수온 약층</b>, 차갑고 수온 변화가 거의 없는 <b>심해층</b>입니다. 여름에는 표층이 강하게 데워져 혼합층이 얇고, 수온 약층이 뚜렷합니다. 수온 약층은 위아래 물이 섞이는 것을 막는 덮개 노릇을 해요.<br>"
      + "‘염분’ 보기를 켜면 표층은 비와 강물 때문에 조금 싱겁고, 깊은 곳은 34 psu 남짓으로 고르다는 것도 보입니다."
  },
  {
    id: "r2", tag: "실제 자료 · 동해 심층수", title: "동해 깊은 곳의 물은 몇 도일까", short: "동해 고유수",
    who: "🧊", name: "동해 연구소",
    say: "“같은 관측에서 가장 깊이 내려간 곳은 약 " + Math.round(DEEP[0]) + " m 예요. 그 깊이의 <b>수온</b>을 읽고, 표층과 몇 °C 차이가 나는지 구해 주세요. 한여름 바다 밑에 이런 물이 있다는 게 놀랍지 않나요?”",
    predict: {
      q: "한여름 동해 800 m 깊이의 수온은?",
      options: ["㉠ 표층과 비슷한 20 °C 남짓", "㉡ 10 °C 쯤", "㉢ 0 ~ 1 °C 로 거의 얼음물"],
      answer: 2
    },
    task: "가장 깊은 곳의 수온을 읽고, 표층과의 차이를 슬라이더로 맞추세요(± 0.5 °C).",
    build: function (stage, api) {
      var H = api.h, cv = api.canvas(330), ctx = cv.ctx, W = cv.W, g = 10;
      var D = TOP[1] - DEEP[1];
      function draw() {
        var p = prof(H, ctx, W, cv.H, null, "t");
        H.dot(ctx, p.X(TOP[1]), p.Y(TOP[0]), 7, H.v("--coral-700")); H.dot(ctx, p.X(DEEP[1]), p.Y(DEEP[0]), 7, H.v("--brand-700"));
        H.rows(ctx, 610, 50, [["표층 (" + Math.round(TOP[0]) + " m)", TOP[1].toFixed(2) + " °C"], ["가장 깊은 곳 (" + Math.round(DEEP[0]) + " m)", DEEP[1].toFixed(2) + " °C"], ["내 답 (차이)", g.toFixed(1) + " °C", null, true]], 62);
      }
      cv.canvas._redraw = draw;
      api.slider({ label: "표층과 깊은 곳의 수온 차이", min: 0, max: 30, step: 0.1, value: 10, fmt: function (x) { return x.toFixed(1) + " °C"; }, onInput: function (x) { g = x; api.changed(); draw(); } });
      api.info("오른쪽 판의 두 값을 빼세요. " + SRC);
      draw();
      return {
        judge: function () {
          if (Math.abs(g - D) <= 0.5) return { ok: true, msg: TOP[1].toFixed(2) + " − " + DEEP[1].toFixed(2) + " ≈ " + D.toFixed(1) + " °C — 한여름에도 동해 깊은 곳은 1 °C 아래입니다." };
          return { ok: false, msg: g.toFixed(1) + " °C 는 " + (g < D ? "작습니다" : "큽니다") + ". 표층 수온에서 깊은 곳 수온을 빼세요." };
        }
      };
    },
    hints: ["깊은 곳 수온은 약 0.5 °C 입니다.", "표층 약 24.6 °C − 0.5 °C = ?"],
    solution: "약 <b>" + (TOP[1] - DEEP[1]).toFixed(1) + " °C</b> 차이.",
    why: "동해 수백 m 아래에는 수온 0 ~ 1 °C, 염분 34 psu 남짓으로 매우 고른 물이 차 있는데, 이를 <b>동해 고유수</b>라고 합니다. 겨울에 동해 북쪽(블라디보스토크 앞바다)에서 차가운 바람에 식어 무거워진 표층수가 가라앉아 만들어집니다. 동해는 바깥 대양과 얕은 해협으로만 이어져 있어, 자기만의 작은 심층 순환을 가진 ‘작은 대양’이라고 불려요.<br>"
      + "최근에는 겨울이 따뜻해져 가라앉는 물이 줄고, 동해 심층수의 온도가 조금씩 오르고 산소가 줄어든다는 관측도 나오고 있습니다."
  }
  ]
});
})();
