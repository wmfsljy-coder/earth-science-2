/* 지구과학 Ⅰ-2 대기와 해양의 상호작용과 기후 변화 — 실제 자료
   r1 1950년 이후 가장 강했던 엘니뇨 겨울은? — NOAA 해양 엘니뇨 지수(ONI)
   r2 지금 열대 태평양은 엘니뇨일까 라니냐일까 — 가장 최근 값 읽기
   자료: data/oni.js (NOAA CPC, Niño 3.4 해역 수온 편차의 3개월 평균) */
(function () {
"use strict";
var O = (window.REAL_ONI || { rows: [] }).rows;                    /* [묶음, 연도, 편차] */
var SEAS = ["DJF", "JFM", "FMA", "MAM", "AMJ", "MJJ", "JJA", "JAS", "ASO", "SON", "OND", "NDJ"];
var KS = { DJF: "12~2월", JFM: "1~3월", FMA: "2~4월", MAM: "3~5월", AMJ: "4~6월", MJJ: "5~7월", JJA: "6~8월", JAS: "7~9월", ASO: "8~10월", SON: "9~11월", OND: "10~12월", NDJ: "11~1월" };
function t(r) { return r[1] + (SEAS.indexOf(r[0]) + 0.5) / 12; }
var NDJ = O.filter(function (r) { return r[0] === "NDJ"; });
var TOP = NDJ.reduce(function (b, r) { return r[2] > b[2] ? r : b; }, NDJ[0] || ["NDJ", 2015, 2.6]);
var LAST = O[O.length - 1] || ["JJA", 2026, 1.8];
function state(v) { return v >= 0.5 ? "nino" : (v <= -0.5 ? "nina" : "neutral"); }
var SRC = "<small>출처: 미국 해양대기청(NOAA) 기후예측센터(CPC) 해양 엘니뇨 지수(ONI) — 열대 동태평양 Niño 3.4 해역(남위 5° ~ 북위 5°, 서경 120~170°) 해수면 온도 편차의 3개월 이동 평균, 1950 ~ " + LAST[1] + ". 사본은 data/oni.js.</small>";

function chart(H, ctx, W, CH, mark) {
  H.paper(ctx, W, CH);
  var x0 = 60, x1 = 640, y0 = 24, y1 = CH - 36;
  function X(y) { return x0 + (y - 1950) / (LAST[1] + 1 - 1950) * (x1 - x0); }
  function Y(v) { return y1 - (v + 2.5) / 5.5 * (y1 - y0); }
  H.axes(ctx, x0, y0, x1, y1);
  [-2, -1, 0, 1, 2, 3].forEach(function (v) { H.text(ctx, (v > 0 ? "+" : "") + v + "°C", x0 - 6, Y(v) + 4, { s: 10, a: "right", c: H.v("--mist") }); });
  [1960, 1980, 2000, 2020].forEach(function (y) { H.text(ctx, y, X(y), y1 + 15, { s: 10, a: "center", c: H.v("--mist") }); });
  H.dash(ctx, x0, Y(0.5), x1, Y(0.5), H.v("--coral-700"), 1); H.dash(ctx, x0, Y(-0.5), x1, Y(-0.5), H.v("--brand"), 1);
  O.forEach(function (r) { var v = r[2]; H.box(ctx, X(t(r)), v >= 0 ? Y(v) : Y(0), Math.max(1, (x1 - x0) / (O.length)), Math.abs(Y(v) - Y(0)), v >= 0.5 ? H.v("--coral-700") : (v <= -0.5 ? H.v("--brand") : H.v("--line")), 0.9); });
  if (mark) H.dash(ctx, X(mark + 0.9), y0, X(mark + 0.9), y1, H.v("--amber-700"), 2);
  H.text(ctx, "빨강 = 엘니뇨(+0.5 이상), 파랑 = 라니냐(−0.5 이하)", x0 + 8, y0 + 4, { s: 10.5, w: "800", c: H.v("--mist") });
  return { X: X, Y: Y };
}

window.sthLab({
  mount: "real", key: "real", result: "rReal", label: "실제 자료",
  doneNote: "정리하기 탭에서 실제 자료로 엘니뇨와 라니냐를 설명해 보세요.",
  cases: [
  {
    id: "r1", tag: "실제 자료 · 엔소", title: "1950년 이후 가장 강했던 엘니뇨 겨울은?", short: "가장 강한 엘니뇨",
    who: "🐟", name: "페루 어업 연구소",
    say: "“열대 동태평양의 바닷물 온도가 평소보다 0.5 °C 이상 높은 3개월 평균이 다섯 묶음 이상 연달아 이어지면 엘니뇨, 0.5 °C 이상 낮으면 라니냐라고 해요. 아래는 NOAA가 1950년부터 잰 <b>실제 수온 편차</b>입니다. 엘니뇨는 대개 늦가을 ~ 겨울(11~1월)에 가장 강해져요. <b>가장 강했던 엘니뇨 겨울</b>의 해를 찾아 주세요.”",
    predict: {
      q: "엘니뇨가 일어나면 페루 앞바다는 어떻게 될까요?",
      options: ["㉠ 용승이 강해져 차가운 바닷물과 영양염이 많이 올라온다", "㉡ 용승이 약해져 바닷물이 따뜻해지고 멸치 같은 물고기가 줄어든다", "㉢ 아무 변화가 없다"],
      answer: 1
    },
    task: "연도를 옮겨 11~1월 값이 <b>가장 높은 해</b>를 고르세요(그해 11월 ~ 이듬해 1월).",
    build: function (stage, api) {
      var H = api.h, cv = api.canvas(280), ctx = cv.ctx, W = cv.W, y = 1970;
      function val(yy) { for (var i = 0; i < NDJ.length; i++) if (NDJ[i][1] === yy) return NDJ[i][2]; return null; }
      function draw() {
        chart(H, ctx, W, cv.H, y);
        var v = val(y);
        H.rows(ctx, 680, 50, [["고른 해", y + "년 11월 ~ " + (y + 1) + "년 1월", "--amber-700"], ["수온 편차", v == null ? "자료 없음" : (v > 0 ? "+" : "") + v.toFixed(2) + " °C", null, true], ["상태", v == null ? "-" : ({ nino: "엘니뇨", nina: "라니냐", neutral: "평상" })[state(v)]]], 60);
      }
      cv.canvas._redraw = draw;
      api.slider({ label: "연도", min: 1950, max: NDJ[NDJ.length - 1][1], step: 1, value: 1970, fmt: function (x) { return x + "년"; }, onInput: function (x) { y = x; api.changed(); draw(); } });
      api.info("빨간 막대가 가장 높이 솟은 곳을 찾으세요. 노란 선이 고른 해입니다. " + SRC
        + "<div data-link='{\"id\":\"cpc-enso\",\"title\":\"NOAA 기후예측센터 — ENSO 현황\",\"src\":\"미국 해양대기청\",\"url\":\"https://www.cpc.ncep.noaa.gov/products/analysis_monitoring/enso_advisory/ensodisc.shtml\",\"ask\":\"가장 최근 ENSO 진단 토론에서 지금 상태(ENSO Alert System Status)가 무엇인지, 앞으로 몇 달의 전망이 어떤지 한 문장으로 적어 오세요.\"}'></div>");
      draw();
      return {
        judge: function () {
          if (y === TOP[1]) return { ok: true, msg: TOP[1] + "년 11월 ~ " + (TOP[1] + 1) + "년 1월, +" + TOP[2].toFixed(2) + " °C — 1950년 이후 ONI 기준으로 가장 강한 엘니뇨였습니다." };
          var v = val(y); return { ok: false, msg: y + "년은 " + (v == null ? "자료가 없습니다" : (v > 0 ? "+" : "") + v.toFixed(2) + " °C입니다") + ". 더 높은 해가 있어요." };
        }
      };
    },
    hints: ["+2 °C를 넘은 겨울은 " + NDJ.filter(function (r) { return r[2] > 2; }).map(function (r) { return r[1]; }).join(" · ") + " 입니다.", "그 가운데 가장 높은 것을 고르세요."],
    solution: "<b>" + TOP[1] + "년</b> (11~1월 +" + TOP[2].toFixed(2) + " °C).",
    why: "평소에는 무역풍이 따뜻한 표층 바닷물을 서태평양으로 밀어내, 페루 앞바다에서는 차가운 심층수가 올라옵니다(용승). 무역풍이 약해지면 따뜻한 물이 동쪽으로 되돌아와 용승이 약해지고 동태평양 수온이 오르는데, 이것이 엘니뇨입니다. 영양염이 줄어 멸치가 사라지고, 페루에는 큰비가, 인도네시아·호주에는 가뭄이 옵니다.<br>"
      + "1982~83, 1997~98, 2015~16년은 ‘슈퍼 엘니뇨’라 불리며 전 세계 날씨를 흔들었습니다. 엘니뇨가 강한 해에는 지구 평균 기온도 함께 올라, 2016년과 2024년이 기록적으로 더웠습니다."
  },
  {
    id: "r2", tag: "실제 자료 · 지금의 엔소", title: "지금 열대 태평양은 엘니뇨일까", short: "지금 상태",
    who: "📡", name: "기상청 해양 기후 팀",
    say: "“자료의 맨 끝은 가장 최근 값이에요(" + LAST[1] + "년 " + KS[LAST[0]] + "). 최근 1년 동안 수온 편차가 어떻게 변했는지 보고, <b>지금 상태</b>와 그 <b>값</b>을 읽어 주세요.”",
    predict: {
      q: "엘니뇨와 라니냐는 어떻게 바뀌어 갈까요?",
      options: ["㉠ 한 번 시작되면 수십 년 이어진다", "㉡ 몇 달 ~ 1~2년 동안 이어지다 바뀌며, 2~7년마다 되풀이된다", "㉢ 해마다 정확히 번갈아 온다"],
      answer: 1
    },
    task: "가장 최근 값으로 지금 상태를 고르고, 그 값을 슬라이더로 맞추세요(± 0.1 °C).",
    build: function (stage, api) {
      var H = api.h, cv = api.canvas(280), ctx = cv.ctx, W = cv.W, pick = "neutral", v = 0;
      var REC = O.slice(-15);
      function draw() {
        H.paper(ctx, W, cv.H);
        var x0 = 60, x1 = 640, y0 = 24, y1 = cv.H - 46;
        function Y(z) { return y1 - (z + 2) / 4.5 * (y1 - y0); }
        H.axes(ctx, x0, y0, x1, y1);
        [-1.5, -0.5, 0.5, 1.5, 2.5].forEach(function (z) { H.text(ctx, (z > 0 ? "+" : "") + z, x0 - 6, Y(z) + 4, { s: 10, a: "right", c: H.v("--mist") }); });
        H.dash(ctx, x0, Y(0.5), x1, Y(0.5), H.v("--coral-700"), 1); H.dash(ctx, x0, Y(-0.5), x1, Y(-0.5), H.v("--brand"), 1);
        var bw = (x1 - x0) / REC.length;
        REC.forEach(function (r, i) {
          var z = r[2], x = x0 + i * bw + 4;
          H.box(ctx, x, z >= 0 ? Y(z) : Y(0), bw - 8, Math.abs(Y(z) - Y(0)), z >= 0.5 ? H.v("--coral-700") : (z <= -0.5 ? H.v("--brand") : H.v("--line")), 0.9);
          H.text(ctx, r[0], x + (bw - 8) / 2, y1 + 14, { s: 9.5, a: "center", c: H.v("--mist") });
          if (i === 0 || r[0] === "DJF") H.text(ctx, r[1], x + (bw - 8) / 2, y1 + 28, { s: 9.5, w: "800", a: "center", c: H.v("--mist") });
        });
        H.rows(ctx, 680, 50, [["내 답 (상태)", ({ nino: "엘니뇨", nina: "라니냐", neutral: "평상" })[pick], null, true], ["내 답 (값)", (v > 0 ? "+" : "") + v.toFixed(1) + " °C"]], 60);
      }
      cv.canvas._redraw = draw;
      api.seg({ label: "지금 상태", value: "neutral", options: [{ v: "nino", t: "엘니뇨" }, { v: "neutral", t: "평상" }, { v: "nina", t: "라니냐" }], onPick: function (x) { pick = x; api.changed(); draw(); } });
      api.slider({ label: "가장 최근 값", min: -2.5, max: 3, step: 0.1, value: 0, fmt: function (x) { return (x > 0 ? "+" : "") + x.toFixed(1) + " °C"; }, onInput: function (x) { v = x; api.changed(); draw(); } });
      api.info("막대 아래 글자는 3개월 묶음입니다(JJA = 6~8월). 맨 오른쪽이 가장 최근입니다. " + SRC);
      draw();
      return {
        judge: function () {
          var s = state(LAST[2]);
          if (pick === s && Math.abs(v - LAST[2]) <= 0.1 + 1e-9) return { ok: true, msg: LAST[1] + "년 " + KS[LAST[0]] + " " + (LAST[2] > 0 ? "+" : "") + LAST[2].toFixed(2) + " °C — " + ({ nino: "엘니뇨", nina: "라니냐", neutral: "평상" })[s] + " 상태입니다." };
          if (pick !== s) return { ok: false, msg: "맨 오른쪽 막대의 값이 ±0.5 °C 선의 어느 쪽에 있는지 보세요." };
          return { ok: false, msg: "상태는 맞았습니다. 맨 오른쪽 막대의 높이를 다시 읽으세요." };
        }
      };
    },
    hints: ["맨 오른쪽 막대가 가장 최근입니다.", "+0.5 °C 선보다 위면 엘니뇨, −0.5 °C 선보다 아래면 라니냐."],
    solution: LAST[1] + "년 " + KS[LAST[0]] + ": <b>" + ({ nino: "엘니뇨", nina: "라니냐", neutral: "평상" })[state(LAST[2])] + "</b>, " + (LAST[2] > 0 ? "+" : "") + LAST[2].toFixed(2) + " °C.",
    why: "엘니뇨와 라니냐는 대기(무역풍)와 해양(수온)이 서로를 키우거나 약하게 하며 2~7년마다 오가는 현상이라 ‘엘니뇨-남방 진동(ENSO)’이라고 부릅니다. 그래서 과학자들은 매달 수온과 바람을 재어 몇 달 뒤를 예보합니다.<br>"
      + "엘니뇨가 발달하면 우리나라는 겨울이 따뜻하고 여름 강수가 많아지는 경향이 있지만, 늘 그렇지는 않습니다. 기후는 여러 요인이 겹쳐 정해지기 때문입니다. 값 하나가 +0.5를 넘으면 ‘엘니뇨 상태’이고, 다섯 묶음 이상 연달아 이어져야 기록에 ‘엘니뇨’로 남습니다. ※ 가장 최근 값은 나중에 조금 고쳐질 수 있습니다."
  }
  ]
});
})();
