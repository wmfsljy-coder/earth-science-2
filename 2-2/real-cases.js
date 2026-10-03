/* 지구과학Ⅱ 한반도의 암석 — 실제 자료
   r1 사라진 1억 년 — 우리나라 화석 기록이 하나도 없는 고생대의 시대(대결층)
   r2 바다에서 호수로 — 고생대 초와 중생대 백악기 화석이 나온 환경 비교
   자료: data/pbdb-korea.js (고생물학 데이터베이스 PBDB, 대한민국 화석 산출 기록) */
(function () {
"use strict";
var P = window.REAL_PBDBKR || { total: 0, rows: [] };
var R = P.rows;                                         /* [시대, 시작, 끝, 기록, 바다, 육지, 모름, 많이 나온 무리] */
function row(n) { for (var i = 0; i < R.length; i++) if (R[i][0] === n) return R[i]; return [n, 0, 0, 0, 0, 0, 0, []]; }
var PALEO = ["캄브리아기", "오르도비스기", "실루리아기", "데본기", "석탄기", "페름기"];
var GAP = PALEO.filter(function (n) { return row(n)[3] === 0; });
var EP = [row("캄브리아기"), row("오르도비스기")], CR = row("백악기");
var EPM = EP[0][4] + EP[1][4], EPK = EP[0][4] + EP[0][5] + EP[1][4] + EP[1][5];
var CRK = CR[4] + CR[5], CRL = CRK ? CR[5] / CRK * 100 : 98;
var SRC = "<small>출처: 고생물학 데이터베이스(PBDB) — 대한민국에서 보고된 화석 산출 기록 " + P.total.toLocaleString() + "건을 지질 시대(기)별로 센 값(산출 연대의 가운데 값 기준). 연구가 많이 된 곳일수록 기록이 많아지는 치우침이 있습니다. 사본은 data/pbdb-korea.js.</small>";

function chart(H, ctx, W, CH, pick, env) {
  H.paper(ctx, W, CH);
  var x0 = 60, x1 = 620, y0 = 30, y1 = CH - 52, bw = (x1 - x0) / Math.max(1, R.length);
  var mx = Math.max.apply(null, R.map(function (r) { return r[3]; })) * 1.1 || 1;
  function Y(v) { return y1 - v / mx * (y1 - y0); }
  H.axes(ctx, x0, y0, x1, y1);
  [0, 200, 400, 600].forEach(function (v) { if (v < mx) H.text(ctx, v, x0 - 6, Y(v) + 4, { s: 10, a: "right", c: H.v("--mist") }); });
  R.forEach(function (r, i) {
    var x = x0 + i * bw + 4, w = bw - 8, on = pick === i;
    if (env) {
      var a = Y(r[4]), b = Y(r[4] + r[5]), c = Y(r[3]);
      H.box(ctx, x, a, w, y1 - a, H.v("--brand"), 0.85); H.box(ctx, x, b, w, a - b, H.v("--amber-700"), 0.85); H.box(ctx, x, c, w, b - c, H.v("--mist"), 0.55);
    } else H.box(ctx, x, Y(r[3]), w, y1 - Y(r[3]), on ? H.v("--amber-700") : H.v("--brand"), on ? 1 : 0.8);
    if (r[3] === 0) H.text(ctx, "0", x + w / 2, y1 - 6, { s: 10, w: "800", a: "center", c: H.v("--rose-700") });
    H.text(ctx, r[0].replace("기", ""), x + w / 2, y1 + 14 + (i % 2) * 13, { s: 9.5, a: "center", c: on ? H.v("--ink") : H.v("--mist") });
    if (on) { ctx.save(); ctx.strokeStyle = H.v("--amber-700"); ctx.lineWidth = 2; ctx.strokeRect(x - 3, y0, w + 6, y1 - y0); ctx.restore(); }
  });
  H.dash(ctx, x0 + 6 * bw, y0, x0 + 6 * bw, y1, H.v("--line"), 1); H.dash(ctx, x0 + 9 * bw, y0, x0 + 9 * bw, y1, H.v("--line"), 1);
  H.text(ctx, "고생대", x0 + 3 * bw, y0 + 4, { s: 10.5, w: "800", a: "center", c: H.v("--mist") });
  H.text(ctx, "중생대", x0 + 7.5 * bw, y0 + 4, { s: 10.5, w: "800", a: "center", c: H.v("--mist") });
  H.text(ctx, "신생대", x0 + 10.5 * bw, y0 + 4, { s: 10.5, w: "800", a: "center", c: H.v("--mist") });
  H.text(ctx, env ? "우리나라 화석 기록 — 파랑: 바다, 주황: 육지(호수·강), 회색: 모름" : "우리나라에서 보고된 화석 기록 수", x0 + 6, y0 - 12, { s: 11, w: "700", c: H.v("--mist") });
}

window.sthLab({
  mount: "real", key: "real", result: "rReal", label: "실제 자료",
  doneNote: "정리하기 탭에서 실제 자료로 한반도의 지층이 언제, 어떤 환경에서 쌓였는지 설명해 보세요.",
  cases: [
  {
    id: "r1", tag: "실제 자료 · 대결층", title: "사라진 1억 년", short: "대결층",
    who: "🪨", name: "지질공원 해설사",
    say: "“세계 고생물학자들이 모은 데이터베이스에서 <b>우리나라 화석 기록</b>을 시대별로 세어 봤어요. 고생대(캄브리아기 ~ 페름기) 가운데 기록이 <b>하나도 없는 시대</b>가 있습니다. 그 시대를 찾고, 그때 한반도에 무슨 일이 있었는지 골라 주세요.”",
    predict: {
      q: "어떤 시대의 지층과 화석이 한 지역에서 통째로 없다면, 어떤 까닭을 먼저 생각해 볼 수 있을까요?",
      options: ["㉠ 그 시대에는 지구에 생물이 없었다", "㉡ 그 지역이 땅 위로 올라와 퇴적이 멈추거나 깎여 나갔다", "㉢ 그 시대에는 시간이 흐르지 않았다"],
      answer: 1
    },
    task: "고생대 가운데 기록이 0 인 시대를 고르고, 그때 한반도의 모습을 고르세요.",
    build: function (stage, api) {
      var H = api.h, cv = api.canvas(300), ctx = cv.ctx, W = cv.W, i = 0, why = "none";
      function draw() {
        chart(H, ctx, W, cv.H, i, false);
        var r = R[i] || ["", 0, 0, 0, 0, 0, 0, []];
        H.rows(ctx, 650, 30, [["고른 시대", r[0], "--amber-700"], ["연대", r[1] + " ~ " + r[2] + " 백만 년 전"], ["화석 기록", r[3] + " 건", null, true], ["많이 나온 무리", r[7].length ? r[7].map(function (t) { return t[0]; }).join(", ") : "—"]], 56);
      }
      cv.canvas._redraw = draw;
      api.slider({ label: "시대", min: 0, max: Math.max(0, R.length - 1), step: 1, value: 0, fmt: function (x) { return R[x] ? R[x][0] : ""; }, onInput: function (x) { i = x; api.changed(); draw(); } });
      api.seg({ label: "그때 한반도는", value: "none", options: [{ v: "up", t: "땅 위로 올라와 퇴적이 멈추고 깎였다" }, { v: "deep", t: "아주 깊은 바다 밑이었다" }, { v: "ice", t: "두꺼운 얼음에 덮여 있었다" }], onPick: function (x) { why = x; api.changed(); } });
      api.info("캄브리아기·오르도비스기의 바다 지층을 조선 누층군, 석탄기 후기 ~ 트라이아스기의 지층을 평안 누층군이라고 해요. " + SRC
        + "<div data-map='{\"id\":\"gumunso\",\"name\":\"태백 구문소 (강원 태백, 국가지질공원)\",\"lat\":37.0893,\"lng\":129.0537,\"zoom\":15,\"ask\":\"강물이 석회암 절벽을 뚫고 지나가는 구문소를 위성 사진으로 찾아보세요. 이 석회암은 어느 시대, 어떤 환경(바다·육지)에서 쌓였을지 위 자료를 근거로 적어 오세요.\"}'></div>");
      draw();
      return {
        judge: function () {
          var r = R[i] || ["", 0, 0, 1];
          if (PALEO.indexOf(r[0]) < 0) return { ok: false, msg: r[0] + " 은 고생대가 아닙니다. 고생대는 캄브리아기 ~ 페름기예요." };
          if (r[3] !== 0) return { ok: false, msg: r[0] + " 에는 기록이 " + r[3] + " 건 있습니다. 0 인 시대를 찾으세요." };
          if (why !== "up") return { ok: false, msg: "시대는 맞았습니다. 생물이 사라졌다면 다른 나라에도 그 시대 화석이 없어야 하는데, 실루리아기·데본기 화석은 세계 곳곳에 많아요. 한반도에서만 없다면?" };
          return { ok: true, msg: GAP.join("·") + " 기록이 0 — 오르도비스기 중기부터 석탄기 후기까지 1억 년 넘게 한반도의 지층이 거의 없습니다. 이 시간 공백을 ‘대결층’이라고 해요." };
        }
      };
    },
    hints: ["막대 아래 빨간 ‘0’ 이 있는 시대를 찾으세요(고생대 안에서).", "그 시대 화석은 다른 대륙에서는 흔합니다. 한반도에서만 지층이 없다면 쌓이지 않았거나 깎여 나간 것입니다."],
    solution: "<b>" + GAP.join(" · ") + "</b>, 한반도가 땅 위로 올라와 퇴적이 멈추고 깎였다.",
    why: "조선 누층군은 따뜻하고 얕은 바다에서 쌓인 석회암·셰일로, 삼엽충과 코노돈트·두족류 화석이 많이 나옵니다(태백·영월·단양). 그 위에는 석탄기 후기부터 쌓인 평안 누층군이 바로 놓이고, 그 사이 1억 년이 넘는 기간의 지층이 빠져 있어요. 이 기간 한반도는 땅 위로 솟아 퇴적이 멈추었거나 쌓인 것이 깎여 나갔다고 봅니다.<br>"
      + "지층이 빠진 부분은 부정합으로 나타나며, ‘무엇이 없는가’도 지구의 역사를 알려 주는 중요한 증거입니다. 다만 기록 수 0 은 ‘아직 찾지 못했다’는 뜻일 수도 있으니, 지층 자체가 없는지 함께 확인해야 해요."
  },
  {
    id: "r2", tag: "실제 자료 · 퇴적 환경", title: "바다에서 호수로", short: "퇴적 환경",
    who: "🦕", name: "공룡 발자국 탐사대",
    say: "“같은 자료에서 화석이 나온 <b>환경</b>을 나누어 봤어요. 고생대 초(캄브리아기·오르도비스기)와 중생대 <b>백악기</b>를 비교해 봅시다. 환경이 알려진 백악기 기록 가운데 <b>육지(호수·강·선상지)</b>에서 나온 것은 <b>몇 %</b>일까요?”",
    predict: {
      q: "경상도 일대의 백악기 지층에서 공룡 발자국이 많이 나오는 것은 무엇을 뜻할까요?",
      options: ["㉠ 그때 그곳이 깊은 바다였다", "㉡ 그때 그곳이 호숫가·강가 같은 육지였다", "㉢ 그때 그곳이 빙하였다"],
      answer: 1
    },
    task: "백악기 기록 가운데 육지 환경의 비율(%)을 슬라이더로 맞추세요(± 2%).",
    build: function (stage, api) {
      var H = api.h, cv = api.canvas(300), ctx = cv.ctx, W = cv.W, g = 50;
      function draw() {
        chart(H, ctx, W, cv.H, null, true);
        H.rows(ctx, 650, 30, [["캄브리아 · 오르도비스", "바다 " + EPM + " / 환경 알려진 " + EPK], ["백악기", "바다 " + CR[4] + " · 육지 " + CR[5]], ["내 답 (백악기 육지 비율)", g + "%", null, true]], 62);
      }
      cv.canvas._redraw = draw;
      api.slider({ label: "백악기 육지 비율", min: 0, max: 100, step: 1, value: 50, fmt: function (x) { return x + "%"; }, onInput: function (x) { g = x; api.changed(); draw(); } });
      api.info("육지 비율 = 육지 ÷ (바다 + 육지) × 100. ‘모름’은 빼고 셉니다. " + SRC
        + "<div data-link='{\"id\":\"koreageoparks\",\"title\":\"국가지질공원\",\"src\":\"환경부 국가지질공원 사무국\",\"url\":\"https://www.koreageoparks.kr/\",\"ask\":\"국가지질공원 가운데 공룡 발자국이나 백악기 지층을 볼 수 있는 곳을 하나 골라, 그곳의 암석 이름과 그 암석이 쌓인 환경을 적어 오세요.\"}'></div>");
      draw();
      return {
        judge: function () {
          if (Math.abs(g - CRL) <= 2) return { ok: true, msg: CR[5] + " ÷ " + CRK + " ≈ " + CRL.toFixed(1) + "% — 고생대 초에는 " + EPK + " 건 모두 바다였는데, 백악기에는 거의 모두 육지입니다. 한반도가 바다에서 큰 호수·강이 있는 땅으로 바뀌었어요." };
          return { ok: false, msg: g + "% 는 " + (g < CRL ? "작습니다" : "큽니다") + ". 백악기 육지 ÷ (바다 + 육지) × 100." };
        }
      };
    },
    hints: ["백악기: 바다 " + CR[4] + ", 육지 " + CR[5] + ".", CR[5] + " ÷ " + CRK + " × 100 ≈ ?"],
    solution: "약 <b>" + Math.round(CRL) + "%</b>.",
    why: "백악기 한반도 남동부에는 넓은 호수와 강이 있는 경상 분지가 생겨 자갈·모래·진흙이 두껍게 쌓였습니다(경상 누층군). 붉은 이암, 연흔, 건열, 공룡 발자국과 알 화석은 물이 얕고 때때로 마르던 호숫가 환경을 알려 줘요. 고성·해남·화순 같은 곳이 세계적인 공룡 발자국 산지인 까닭입니다.<br>"
      + "이 시기에는 화산 활동도 활발해 응회암·안산암이 쌓이고, 땅속에서는 마그마가 굳어 불국사 화강암이 만들어졌습니다. 화석과 암석이 함께 지질 시대의 환경을 복원하는 증거가 됩니다."
  }
  ]
});
})();
