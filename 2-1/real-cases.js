/* 지구과학 Ⅱ-1 지구의 역사 — 실제 자료
   r1 화석 기록에서 가장 큰 대멸종 찾기 — 고생물학 데이터베이스의 동물 속(genus) 기록
   r2 공룡이 사라진 때, 생물 속은 몇 % 줄었나 — 백악기 말 대멸종
   자료: data/pbdb-diversity.js (Paleobiology Database, CC BY 4.0) */
(function () {
"use strict";
var P = (window.REAL_PBDB || { rows: [] }).rows;                    /* [세 이름, 시작, 끝, 속 수, 마지막 출현(아래 경계 넘어온), 위아래 다 넘은] */
var KO = { Cambrian: "캄브리아기", Ordovician: "오르도비스기", Silurian: "실루리아기", Devonian: "데본기", Carboniferous: "석탄기", Permian: "페름기", Triassic: "트라이아스기", Jurassic: "쥐라기", Cretaceous: "백악기", Paleogene: "고제3기", Neogene: "신제3기" };
var BND = [[538.8, "캄브리아기"], [485.4, "오르도비스기"], [443.8, "실루리아기"], [419.2, "데본기"], [358.9, "석탄기"], [298.9, "페름기"], [251.9, "트라이아스기"], [201.4, "쥐라기"], [145, "백악기"], [66, "고제3기"], [23.03, "신제3기"]];
function period(ma) { for (var i = BND.length - 1; i >= 0; i--) if (ma <= BND[i][0] + 1e-6 && (i === BND.length - 1 || ma > BND[i + 1][0] - 1e-6)) return BND[i][1]; return ""; }
function ext(r) { return r[4] + r[5] ? r[4] / (r[4] + r[5]) : 0; }
var USE = P.filter(function (r) { return r[1] < 500 && r[4] + r[5] >= 300; });          /* 자료가 너무 적은 캄브리아기 초는 뺌 */
var TOP = USE.reduce(function (b, r) { return ext(r) > ext(b) ? r : b; }, USE[0] || ["", 0, 0, 0, 0, 1]);
function byName(n) { return P.filter(function (r) { return r[0] === n; })[0]; }
var MA = byName("Maastrichtian") || ["Maastrichtian", 72.2, 66, 3360], DA = byName("Danian") || ["Danian", 66, 61.6, 2661];
var DROP = (1 - DA[3] / MA[3]) * 100;
var SRC = "<small>출처: 고생물학 데이터베이스(PBDB) — 동물(Metazoa) 화석 기록에서 세(stage)마다 센 속(genus) 수와, 그 세에서 마지막으로 나온 속의 비율(앞 세에서 넘어온 속 기준). 화석이 잘 남고 많이 연구된 시기일수록 수가 많아지는 치우침이 있습니다. 사본은 data/pbdb-diversity.js.</small>";

function chart(H, ctx, W, CH, what, pick) {
  H.paper(ctx, W, CH);
  var x0 = 60, x1 = 640, y0 = 30, y1 = CH - 50;
  function X(ma) { return x0 + (500 - ma) / (500 - 2.6) * (x1 - x0); }
  var top = what === "e" ? 0.6 : 7000;
  function Y(v) { return y1 - v / top * (y1 - y0); }
  H.axes(ctx, x0, y0, x1, y1);
  (what === "e" ? [0, 0.2, 0.4, 0.6] : [0, 2000, 4000, 6000]).forEach(function (v) { H.text(ctx, what === "e" ? Math.round(v * 100) + "%" : v.toLocaleString(), x0 - 6, Y(v) + 4, { s: 10, a: "right", c: H.v("--mist") }); });
  BND.forEach(function (b, i) { if (b[0] > 500) return; H.dash(ctx, X(b[0]), y0, X(b[0]), y1, H.v("--line"), 0.8); var nx = i + 1 < BND.length ? BND[i + 1][0] : 2.6; H.text(ctx, b[1].replace("기", ""), (X(b[0]) + X(Math.max(nx, 2.6))) / 2, y1 + 15, { s: 9, a: "center", c: H.v("--mist") }); });
  H.text(ctx, "← 오래전                 (백만 년 전)                 최근 →", (x0 + x1) / 2, y1 + 32, { s: 10, a: "center", c: H.v("--mist") });
  P.forEach(function (r) {
    if (r[1] > 500) return;
    var v = what === "e" ? ext(r) : r[3], on = pick && r[0] === pick[0];
    H.box(ctx, X(r[1]), Y(v), Math.max(1.5, X(r[2]) - X(r[1]) - 0.5), y1 - Y(v), on ? H.v("--amber-700") : (what === "e" ? H.v("--coral-700") : H.v("--brand")), on ? 0.95 : 0.7);
  });
  H.text(ctx, what === "e" ? "그 시기에 사라진 속의 비율" : "그 시기의 동물 속 수", x0 + 6, y0 - 10, { s: 11, w: "700", c: H.v("--mist") });
  return { X: X, Y: Y };
}

window.sthLab({
  mount: "real", key: "real", result: "rReal", label: "실제 자료",
  doneNote: "정리하기 탭에서 실제 화석 자료로 대멸종과 지질 시대의 경계를 설명해 보세요.",
  cases: [
  {
    id: "r1", tag: "실제 자료 · 대멸종", title: "화석 기록에서 가장 큰 대멸종 찾기", short: "가장 큰 대멸종",
    who: "🦴", name: "고생물학 데이터베이스",
    say: "“전 세계 고생물학자들이 찾은 화석 수백만 건을 모은 데이터베이스가 있어요. 아래는 지질 시대를 잘게 나눈 시기(세)마다 <b>그 시기에 마지막으로 나온 동물 속(genus)의 비율</b>입니다. 비율이 치솟은 곳이 대멸종이에요. <b>가장 많이 사라진 시기</b>를 찾아 주세요.”",
    predict: {
      q: "지구 역사에서 생물이 가장 많이 사라진 대멸종은 언제일까요?",
      options: ["㉠ 공룡이 사라진 백악기 말", "㉡ 고생대가 끝난 페름기 말", "㉢ 빙하기가 오갔던 신생대 제4기"],
      answer: 1
    },
    task: "시기를 옮겨 사라진 속의 비율이 <b>가장 높은 시기</b>를 고르세요.",
    build: function (stage, api) {
      var H = api.h, cv = api.canvas(300), ctx = cv.ctx, W = cv.W, k = 0;
      function draw() {
        var r = USE[k];
        chart(H, ctx, W, cv.H, "e", r);
        H.rows(ctx, 670, 40, [["고른 시기", r[0], "--amber-700"], ["지질 시대", period((r[1] + r[2]) / 2)], ["때", r[1].toFixed(1) + " ~ " + r[2].toFixed(1) + " 백만 년 전"], ["사라진 속의 비율", Math.round(ext(r) * 100) + " %", null, true]], 54);
      }
      cv.canvas._redraw = draw;
      api.slider({ label: "시기", min: 0, max: USE.length - 1, step: 1, value: 0, fmt: function (x) { var r = USE[x]; return Math.round(r[1]) + " 백만 년 전"; }, onInput: function (x) { k = x; api.changed(); draw(); } });
      api.info("자료가 너무 적은 시기(앞 세에서 넘어온 속이 300개 아래)와 캄브리아기 초는 슬라이더에서 뺐습니다. " + SRC
        + "<div data-link='{\"id\":\"pbdb\",\"title\":\"고생물학 데이터베이스 탐색기\",\"src\":\"Paleobiology Database\",\"url\":\"https://paleobiodb.org/navigator/\",\"ask\":\"지도에서 우리나라(한반도) 둘레를 확대해, 어느 지질 시대의 화석 기록이 많이 찍혀 있는지 한 가지 적어 오세요.\"}'></div>");
      draw();
      return {
        judge: function () {
          var r = USE[k];
          if (r === TOP) return { ok: true, msg: r[0] + "(" + period((r[1] + r[2]) / 2) + " 말, 약 " + Math.round(r[2]) + " 백만 년 전) — 넘어온 속의 약 " + Math.round(ext(r) * 100) + "% 가 사라졌습니다. 고생대를 끝낸 가장 큰 대멸종이에요." };
          return { ok: false, msg: r[0] + " 은 " + Math.round(ext(r) * 100) + "% 입니다. 더 높은 막대가 있어요." };
        }
      };
    },
    hints: ["가장 높은 빨간 막대 두 개는 오르도비스기 말과 페름기 말 근처에 있습니다.", "약 2억 5200만 년 전입니다."],
    solution: "<b>" + TOP[0] + "</b> — " + period((TOP[1] + TOP[2]) / 2) + " 말(약 " + Math.round(TOP[2]) + " 백만 년 전), 약 " + Math.round(ext(TOP) * 100) + "%.",
    why: "페름기 말 대멸종(약 2억 5200만 년 전)은 시베리아의 거대한 화산 분출로 온실 기체가 늘고 바다가 데워지며 산소가 부족해지고 산성화된 것이 원인으로 여겨집니다. 바다 생물 종의 80 ~ 90% 가 사라졌다고 추정되며(속 단위로는 이 자료처럼 절반 남짓), 이 사건이 고생대와 중생대의 경계가 되었어요. 오르도비스기 말, 데본기 후기, 트라이아스기 말, 백악기 말과 함께 ‘5대 대멸종’으로 꼽힙니다.<br>"
      + "지질 시대의 큰 경계는 대부분 이렇게 화석으로 남은 생물이 크게 바뀐 때에 그어졌습니다. ※ 속(genus) 은 종보다 큰 묶음이라, 종 단위의 멸종 비율은 더 높습니다."
  },
  {
    id: "r2", tag: "실제 자료 · 백악기 말 대멸종", title: "공룡이 사라진 때, 생물 속은 몇 % 줄었나", short: "백악기 말",
    who: "☄️", name: "운석 충돌 연구팀",
    say: "“6600만 년 전, 지름 10 km 쯤 되는 소행성이 지금의 멕시코 유카탄 반도에 떨어졌어요. 같은 자료로 <b>백악기 마지막 세(마스트리흐트절)</b>와 <b>신생대 첫 세(다니절)</b>의 동물 속 수를 비교해, <b>몇 % 줄었는지</b> 구해 주세요.”",
    predict: {
      q: "백악기 말 대멸종 뒤 동물의 속 수는?",
      options: ["㉠ 거의 줄지 않았다", "㉡ 크게 줄었다가, 신생대에 다시 늘어 이전보다 많아졌다", "㉢ 줄어든 뒤 다시는 늘지 않았다"],
      answer: 1
    },
    task: "두 시기의 속 수를 읽고 줄어든 비율을 슬라이더로 맞추세요(± 3 %).",
    build: function (stage, api) {
      var H = api.h, cv = api.canvas(300), ctx = cv.ctx, W = cv.W, g = 0;
      function draw() {
        var p = chart(H, ctx, W, cv.H, "n", null);
        [MA, DA].forEach(function (r) { H.dot(ctx, p.X((r[1] + r[2]) / 2), p.Y(r[3]) - 6, 6, H.v("--amber-700")); });
        H.rows(ctx, 670, 40, [["마스트리흐트절 (백악기 끝)", MA[3].toLocaleString() + " 속"], ["다니절 (신생대 처음)", DA[3].toLocaleString() + " 속"], ["내 답 (줄어든 비율)", g + " %", null, true]], 58);
      }
      cv.canvas._redraw = draw;
      api.slider({ label: "줄어든 비율", min: 0, max: 80, step: 1, value: 0, fmt: function (x) { return x + " %"; }, onInput: function (x) { g = x; api.changed(); draw(); } });
      api.info("줄어든 비율(%) = (처음 − 나중) ÷ 처음 × 100. 노란 점 두 개가 비교할 시기입니다. " + SRC
        + "<div data-map='{\"id\":\"chicxulub\",\"name\":\"칙술루브 충돌구 (멕시코 유카탄 반도)\",\"lat\":21.3,\"lng\":-89.5,\"zoom\":8,\"ask\":\"지름 약 180 km 의 충돌구는 지금 땅속에 묻혀 있습니다. 위성 사진에서 반원 모양으로 늘어선 둥근 연못(세노테)들의 줄을 찾아보세요.\"}'></div>");
      draw();
      return {
        judge: function () {
          if (Math.abs(g - DROP) <= 3) return { ok: true, msg: "(" + MA[3].toLocaleString() + " − " + DA[3].toLocaleString() + ") ÷ " + MA[3].toLocaleString() + " ≈ " + DROP.toFixed(0) + "% — 화석 기록으로 본 속 수가 크게 줄었습니다." };
          return { ok: false, msg: g + "% 는 " + (g < DROP ? "작습니다" : "큽니다") + ". 줄어든 수를 처음 수로 나누세요." };
        }
      };
    },
    hints: [MA[3].toLocaleString() + " − " + DA[3].toLocaleString() + " = " + (MA[3] - DA[3]).toLocaleString(), (MA[3] - DA[3]).toLocaleString() + " ÷ " + MA[3].toLocaleString() + " × 100 ≈ ?"],
    solution: "약 <b>" + DROP.toFixed(0) + "%</b>.",
    why: "소행성 충돌로 하늘을 덮은 먼지와 그을음이 햇빛을 가려 광합성이 멈추고 먹이 사슬이 무너졌습니다. 공룡(새를 뺀)과 암모나이트가 사라졌고, 그 빈자리를 포유류와 새가 채우며 신생대에 다시 다양해졌어요. 세계 곳곳의 이 경계 지층에서 이리듐이 많은 얇은 점토층이 발견되는 것이 충돌의 증거입니다.<br>"
      + "※ 이 자료의 속 수는 화석이 남은 정도와 연구된 정도에 따라서도 달라집니다. 백악기 말 지층은 특히 많이 연구되어, 앞뒤 시기와 단순 비교할 때는 조심해야 해요."
  }
  ]
});
})();
