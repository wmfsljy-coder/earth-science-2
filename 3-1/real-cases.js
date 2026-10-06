/* 지구과학 Ⅲ-1 태양계 행성의 겉보기 운동 — 실제 자료
   r1 2024~2025년 화성은 며칠 동안 거꾸로 갔을까 — 실제 적경으로 역행 기간 재기
   r2 화성이 가장 가까웠던 날은 역행의 어디쯤일까 — 거리와 밝기
   자료: data/mars-2024.js (NASA JPL Horizons, 지구 중심, 5일 간격) */
(function () {
"use strict";
var M = (window.REAL_MARS || { rows: [] }).rows;                  /* [날짜, 적경°, 적위°, 등급, 거리 au] */
var MON = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };
function day(s) { var p = s.split("-"); return (Date.UTC(+p[0], MON[p[1]] - 1, +p[2]) - Date.UTC(2024, 6, 1)) / 864e5; }
function label(d) { var t = new Date(Date.UTC(2024, 6, 1) + d * 864e5); return t.getUTCFullYear() + "." + (t.getUTCMonth() + 1) + "." + t.getUTCDate(); }
var D = M.map(function (r) { return [day(r[0]), r[1], r[2], r[3], r[4], r[0]]; });
/* 멈춤점: 적경 변화의 부호가 바뀌는 곳 — 이웃한 세 점에 포물선을 맞춰 날짜를 어림한다 */
function turn(i) { var a = D[i - 1], b = D[i], c = D[i + 1], h = b[0] - a[0], den = a[1] - 2 * b[1] + c[1]; return den ? b[0] + h * (a[1] - c[1]) / (2 * den) : b[0]; }
var ST = []; for (var i = 1; i < D.length - 1; i++) if ((D[i][1] - D[i - 1][1]) * (D[i + 1][1] - D[i][1]) < 0) ST.push(turn(i));
var DUR = ST.length > 1 ? ST[1] - ST[0] : 80;
var CL = D.reduce(function (b, r) { return r[4] < b[4] ? r : b; }, D[0] || [0, 0, 0, 0, 1, ""]);
var BR = D.reduce(function (b, r) { return r[3] < b[3] ? r : b; }, D[0] || [0, 0, 0, 0, 1, ""]);
var SRC = "<small>출처: NASA 제트추진연구소(JPL) Horizons 시스템 — 지구 중심에서 본 화성의 적경·적위·겉보기 등급·거리, 2024-07-01~2025-07-01(5일 간격). 사본은 data/mars-2024.js.</small>";

function sky(H, ctx, W, CH, from, to, hi) {
  H.paper(ctx, W, CH);
  var x0 = 60, x1 = 640, y0 = 24, y1 = CH - 36;
  /* 하늘을 올려다본 모양: 동쪽(적경이 큰 쪽)이 왼쪽 */
  function X(ra) { return x1 - (ra - 35) / (170 - 35) * (x1 - x0); }
  function Y(de) { return y1 - (de - 8) / 20 * (y1 - y0); }
  H.axes(ctx, x0, y0, x1, y1);
  [40, 70, 100, 130, 160].forEach(function (ra) { H.text(ctx, "적경 " + ra + "°", X(ra), y1 + 15, { s: 10, a: "center", c: H.v("--mist") }); });
  [10, 15, 20, 25].forEach(function (de) { H.text(ctx, de + "°", x0 - 6, Y(de) + 4, { s: 10, a: "right", c: H.v("--mist") }); });
  H.text(ctx, "← 동쪽          화성이 지나간 길(5일마다 한 점)          서쪽 →", (x0 + x1) / 2, y0 - 6, { s: 11, w: "800", a: "center", c: H.v("--mist") });
  D.forEach(function (r) { var on = r[0] >= from && r[0] <= to; H.dot(ctx, X(r[1]), Y(r[2]), on ? 4.2 : 2.6, on ? H.v("--coral-700") : H.v("--brand")); });
  if (hi) H.dot(ctx, X(hi[1]), Y(hi[2]), 8, H.v("--amber-700"));
  return { X: X, Y: Y };
}

window.sthLab({
  mount: "real", key: "real", result: "rReal", label: "실제 자료",
  doneNote: "정리하기 탭에서 실제 자료로 행성의 역행을 설명해 보세요.",
  cases: [
  {
    id: "r1", tag: "실제 자료 · 순행과 역행", title: "2024~2025년, 화성은 며칠 동안 거꾸로 갔을까", short: "역행 기간",
    who: "🔴", name: "아마추어 천문 동아리",
    say: "“NASA가 계산한 화성의 실제 위치를 5일마다 별자리 사이에 찍었어요. 화성은 대부분 서쪽에서 동쪽으로(그림에서 오른쪽에서 왼쪽으로) 가지만, 한동안 <b>거꾸로(서쪽으로)</b> 갑니다. 범위를 조절해 <b>역행이 시작되고 끝난 날</b>을 찾고, 역행이 며칠 동안이었는지 구해 주세요.”",
    predict: {
      q: "화성이 거꾸로 가는 것처럼 보이는 까닭은?",
      options: ["㉠ 화성이 실제로 공전 방향을 바꾸기 때문에", "㉡ 더 빠르게 도는 지구가 화성을 앞지르면서, 지구에서 본 방향이 거꾸로 바뀌기 때문에", "㉢ 화성의 자전 때문에"],
      answer: 1
    },
    task: "빨간 점 구간이 <b>역행 구간과 딱 맞게</b> 시작일과 끝날을 옮기고, 역행 기간을 맞추세요(시작·끝 ± 10일).",
    build: function (stage, api) {
      var H = api.h, cv = api.canvas(290), ctx = cv.ctx, W = cv.W, a = 100, b = 150;
      function draw() {
        sky(H, ctx, W, cv.H, a, b, null);
        H.rows(ctx, 680, 50, [["시작", label(a)], ["끝", label(b)], ["기간", Math.round(b - a) + " 일", null, true]], 60);
      }
      cv.canvas._redraw = draw;
      api.slider({ label: "역행 시작일", min: 0, max: 365, step: 5, value: 100, fmt: function (x) { return label(x); }, onInput: function (x) { a = x; api.changed(); draw(); } });
      api.slider({ label: "역행 끝날", min: 0, max: 365, step: 5, value: 150, fmt: function (x) { return label(x); }, onInput: function (x) { b = x; api.changed(); draw(); } });
      api.info("점이 왼쪽(동쪽)으로 가다가 멈춰 서고, 오른쪽(서쪽)으로 갔다가 다시 멈춰 서는 곳이 역행의 시작과 끝입니다. " + SRC
        + "<div data-link='{\"id\":\"horizons\",\"title\":\"NASA JPL Horizons 웹 화면\",\"src\":\"NASA 제트추진연구소\",\"url\":\"https://ssd.jpl.nasa.gov/horizons/app.html\",\"ask\":\"Target Body를 Mars로 두고 다음 화성 역행(2027년 1~4월, 충은 2027년 2월 19일) 무렵의 위치를 찾아 보거나, 화면에서 바꿀 수 있는 항목(관측 위치·기간·간격) 세 가지를 적어 오세요.\"}'></div>");
      draw();
      return {
        judge: function () {
          if (Math.abs(a - ST[0]) <= 10 && Math.abs(b - ST[1]) <= 10) return { ok: true, msg: "역행은 약 " + label(ST[0]) + " 부터 " + label(ST[1]) + " 까지, 약 " + Math.round(DUR) + "일 동안이었습니다." };
          if (Math.abs(a - ST[0]) > 10) return { ok: false, msg: "시작일이 맞지 않습니다. 점들이 왼쪽으로 가다가 멈추는 곳을 찾으세요." };
          return { ok: false, msg: "시작은 맞았습니다. 오른쪽으로 가던 점들이 다시 멈추는 곳을 찾으세요." };
        }
      };
    },
    hints: ["2024년 12월 초에 화성이 멈춰 섭니다.", "2025년 2월 말에 다시 멈춰 섭니다."],
    solution: "약 <b>" + label(ST[0]) + " ~ " + label(ST[1]) + "</b>, <b>" + Math.round(DUR) + "일</b>.",
    why: "지구는 화성보다 안쪽에서 더 빨리 돕니다. 지구가 화성을 따라잡아 앞지르는 동안, 지구에서 화성을 바라보는 방향이 거꾸로 돌아가 화성이 별자리 사이를 서쪽으로 거슬러 가는 것처럼 보입니다(역행). 화성은 약 2년 2개월(780일)마다 지구에 따라잡혀, 그때마다 두 달 남짓 역행합니다.<br>"
      + "프톨레마이오스는 이 고리 모양을 주전원과 이심원을 써서 설명했고, 코페르니쿠스는 지구가 움직인다고 보면 훨씬 간단히 설명된다는 것을 보였습니다."
  },
  {
    id: "r2", tag: "실제 자료 · 거리와 밝기", title: "화성이 가장 가까웠던 날은 역행의 어디쯤?", short: "가장 가까운 날",
    who: "🔭", name: "천문대 해설사",
    say: "“같은 자료에는 화성까지의 <b>거리</b>와 <b>밝기(등급)</b>도 있어요. 화성이 지구에 <b>가장 가까웠던 날</b>을 찾고, 그날이 역행 구간의 어디쯤인지 보세요.”",
    predict: {
      q: "화성이 지구에 가장 가까운 때는 역행의 어느 무렵일까요?",
      options: ["㉠ 역행이 시작될 때", "㉡ 역행의 한가운데 무렵", "㉢ 역행이 끝나고 한참 뒤"],
      answer: 1
    },
    task: "날짜를 옮겨 화성이 <b>가장 가까운 날</b>을 찾으세요(± 10일).",
    build: function (stage, api) {
      var H = api.h, cv = api.canvas(290), ctx = cv.ctx, W = cv.W, d = 60;
      function at(x) { return D.reduce(function (b, r) { return Math.abs(r[0] - x) < Math.abs(b[0] - x) ? r : b; }, D[0]); }
      function draw() {
        var r = at(d);
        sky(H, ctx, W, cv.H, ST[0], ST[1], r);
        H.rows(ctx, 680, 40, [["날짜", label(r[0])], ["지구와의 거리", r[4].toFixed(3) + " au", null, true], ["밝기", r[3].toFixed(2) + " 등급"], ["빨간 점", "역행 구간"]], 52);
      }
      cv.canvas._redraw = draw;
      api.slider({ label: "날짜", min: 0, max: 365, step: 5, value: 60, fmt: function (x) { return label(x); }, onInput: function (x) { d = x; api.changed(); draw(); } });
      api.info("등급은 숫자가 작을수록 밝습니다(−1 등급은 1 등급보다 밝음). " + SRC);
      draw();
      return {
        judge: function () {
          if (Math.abs(d - CL[0]) <= 10) return { ok: true, msg: label(CL[0]) + " 무렵 " + CL[4].toFixed(3) + " au로 가장 가깝고, 가장 밝은 때(" + label(BR[0]) + ", " + BR[3].toFixed(2) + " 등급)도 이 무렵 — 역행 구간의 한가운데입니다(충은 1월 16일, 가장 가까운 날은 1월 12일 — 궤도가 타원이라 며칠 어긋남)." };
          return { ok: false, msg: label(d) + " 의 거리는 " + at(d)[4].toFixed(3) + " au입니다. 더 가까운 날이 있습니다." };
        }
      };
    },
    hints: ["거리가 가장 작은 숫자가 되는 날을 찾으세요.", "2025년 1월 중순입니다."],
    solution: "약 <b>" + label(CL[0]) + "</b> (" + CL[4].toFixed(3) + " au) — 역행의 한가운데.",
    why: "지구가 화성을 앞지르는 순간, 곧 태양-지구-화성이 한 줄로 서는 <b>충</b> 무렵에 화성은 지구에 가장 가깝고 가장 밝으며, 역행의 한가운데에 있습니다. 해가 질 때 동쪽에서 떠서 밤새 보이니 관측하기에도 가장 좋은 때입니다.<br>"
      + "화성의 궤도가 찌그러진 타원이라 충 때의 거리도 해마다 다릅니다. 2003년 충에는 0.37 au까지 가까워졌지만, 2025년 1월에는 0.64 au 였습니다."
  }
  ]
});
})();
