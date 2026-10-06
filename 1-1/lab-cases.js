/* 지구과학 Ⅰ-1 해수의 순환과 대기의 변화 — 응용 실험실
   이야기에서 찾은 개념을 처음 보는 상황에 써 본다. 공용 엔진: ../assets/lab.js (sthLab) */
(function () {
"use strict";

window.sthLab({
  mount: "lab", key: "lab", result: "rLab",
  cases: [

  /* ------------------------------------------------------------------ 1. 수온 염분도로 수괴 섞기 */
  {
    id: "c1", tag: "수온 염분도 · 수괴", title: "이 물은 어디서 왔나", short: "수괴 섞기",
    who: "🌊", name: "해양 조사선",
    say: "“수심 800 m에서 떠 올린 물이 <b>수온 7.0 ℃, 염분 34.70 psu</b>로 나왔어요. 이 해역에는 수괴가 세 개 흘러듭니다. 이 물이 어느 두 수괴가 <b>몇 대 몇</b>으로 섞인 것인지 밝혀 주세요.”",
    predict: {
      q: "두 수괴가 섞이면, 섞인 물의 점은 수온 염분도 위 어디에 찍힐까요?",
      options: ["㉠ 두 수괴의 점을 잇는 선분 위, 더 많이 섞인 쪽에 가깝게", "㉡ 언제나 두 점의 한가운데", "㉢ 두 점을 잇는 선분 바깥"],
      answer: 0
    },
    task: "섞인 두 수괴와 비율을 골라 <b>섞인 물의 점이 시료와 겹치게</b>(수온 ±0.3 ℃, 염분 ±0.03 psu) 만드세요.",
    build: function (stage, api) {
      var H = api.h, cv = api.canvas(340), ctx = cv.ctx, W = cv.W;
      var WM = { A: { t: "A 남극 중층수", T: 4, S: 35.0, c: "--brand" }, B: { t: "B 북태평양 중층수", T: 14, S: 34.0, c: "--violet" }, C: { t: "C 아열대 모드수", T: 20, S: 35.5, c: "--coral" } };
      var pair = "AC", f = 50, SAMPLE = { T: 7.0, S: 34.70 };
      var x0 = 90, x1 = 560, y0 = 40, y1 = 300;
      function X(s) { return x0 + (s - 33.8) / 2.0 * (x1 - x0); }
      function Y(t) { return y1 - (t - 0) / 24 * (y1 - y0); }
      function rho(t, s) { return 1027 - 0.17 * (t - 10) + 0.78 * (s - 35); }
      function mix() { var p = WM[pair[0]], q = WM[pair[1]], k = f / 100; return { T: p.T * (1 - k) + q.T * k, S: p.S * (1 - k) + q.S * k }; }
      function draw() {
        H.paper(ctx, W, cv.H);
        H.text(ctx, "수온 염분도", 610, 28, { s: 14, w: "900" });
        H.axes(ctx, x0, y0, x1, y1);
        [34.0, 34.5, 35.0, 35.5].forEach(function (s) { H.text(ctx, s.toFixed(1), X(s), y1 + 16, { s: 10, a: "center", c: H.v("--mist") }); });
        H.text(ctx, "염분 (psu)", x1, y1 + 32, { s: 10.5, a: "right", c: H.v("--mist") });
        [0, 5, 10, 15, 20].forEach(function (t) { H.text(ctx, t + "", x0 - 8, Y(t) + 4, { s: 10, a: "right", c: H.v("--mist") }); });
        H.text(ctx, "수온(℃)", x0 - 8, y0 - 8, { s: 10.5, a: "right", c: H.v("--mist") });
        [1025.5, 1026.5, 1027.5].forEach(function (r) {
          var pts = []; for (var t = 0; t <= 24; t += 0.5) { var s = 35 + (r - 1027 + 0.17 * (t - 10)) / 0.78; if (s >= 33.8 && s <= 35.8) pts.push([X(s), Y(t)]); }
          if (pts.length > 1) { ctx.save(); ctx.setLineDash([4, 4]); H.line(ctx, pts, H.v("--line"), 1.2); ctx.restore(); var lp = pts[pts.length - 1]; H.text(ctx, "밀도 " + r.toFixed(1), lp[0] - 4, lp[1] - 6, { s: 9.5, a: "right", c: H.v("--mist") }); }
        });
        var p = WM[pair[0]], q = WM[pair[1]];
        H.line(ctx, [[X(p.S), Y(p.T)], [X(q.S), Y(q.T)]], H.v("--teal"), 2);
        Object.keys(WM).forEach(function (k) {
          var w = WM[k]; H.dot(ctx, X(w.S), Y(w.T), 7, H.v(w.c));
          H.text(ctx, k, X(w.S) + 10, Y(w.T) + 4, { s: 13, w: "900", c: H.v(w.c + "-700") });
        });
        H.text(ctx, "✕", X(SAMPLE.S), Y(SAMPLE.T) + 5, { s: 16, w: "900", a: "center", c: H.v("--rose-700") });
        var m = mix();
        H.dot(ctx, X(m.S), Y(m.T), 6, H.v("--teal-700"));
        H.rows(ctx, 610, 60, [
          ["섞은 물", "수온 " + m.T.toFixed(2) + " ℃ · 염분 " + m.S.toFixed(2)],
          ["시료 (✕)", "수온 7.00 ℃ · 염분 34.70"],
          ["섞은 물의 밀도", rho(m.T, m.S).toFixed(2) + " kg/m³"]
        ], 56);
        H.text(ctx, "A " + WM.A.T + "℃ " + WM.A.S + " · B " + WM.B.T + "℃ " + WM.B.S + " · C " + WM.C.T + "℃ " + WM.C.S, 610, 250, { s: 11, c: H.v("--mist") });
      }
      cv.canvas._redraw = draw;
      api.seg({ label: "섞인 두 수괴", value: "AC", options: [{ v: "AB", t: "A + B" }, { v: "AC", t: "A + C" }, { v: "BC", t: "B + C" }],
        onPick: function (x) { pair = x; draw(); } });
      api.slider({ label: "뒤쪽 수괴의 비율", min: 0, max: 100, step: 5, value: 50, fmt: function (x) { return x + "%"; },
        onInput: function (x) { f = x; draw(); } });
      api.info("‘뒤쪽 수괴’는 A + B 에서는 B, A + C 에서는 C, B + C 에서는 C입니다. 청록 점이 섞은 물입니다.");
      draw();
      return {
        judge: function () {
          var m = mix(), okP = Math.abs(m.T - SAMPLE.T) <= 0.3 && Math.abs(m.S - SAMPLE.S) <= 0.03;
          if (okP) return { ok: true, msg: WM[pair[0]].t + " " + (100 - f) + "% + " + WM[pair[1]].t + " " + f + "% → " + m.T.toFixed(2) + " ℃, " + m.S.toFixed(2) + " psu — 시료와 같습니다." };
          return { ok: false, msg: "섞은 물 " + m.T.toFixed(2) + " ℃, " + m.S.toFixed(2) + " psu — 시료(✕)와 맞지 않습니다." };
        }
      };
    },
    hints: [
      "먼저 <b>시료(✕)를 지나는 선분</b>을 만드는 두 수괴를 찾으세요. 선분이 ✕ 를 지나지 않으면 비율을 아무리 바꿔도 맞지 않습니다.",
      "A(4 ℃)와 B(14 ℃)를 섞어 7 ℃가 되려면, 4 ℃에서 10 ℃ 거리 가운데 3 ℃ 만큼 B 쪽으로 가야 합니다."
    ],
    solution: "<b>A + B</b>, B의 비율 <b>30%</b> (A 70%). 수온 4 × 0.7 + 14 × 0.3 = 7.0 ℃, 염분 35.0 × 0.7 + 34.0 × 0.3 = 34.70.",
    why: "두 수괴가 섞이면 수온과 염분이 모두 <b>섞인 비율대로</b> 변하므로, 섞인 물은 수온 염분도에서 두 점을 잇는 선분 위에 놓입니다. 더 많이 섞인 수괴 쪽에 가깝습니다.<br>" +
      "그래서 해양학자는 깊은 곳의 물 한 병으로도 <b>어느 바다에서 온 물이 얼마나 섞였는지</b> 알아냅니다. 수괴는 고향의 수온·염분을 오래 간직하는 ‘물의 지문’입니다. ※ 수괴의 값은 수업용으로 어림한 값입니다."
  },

  /* ------------------------------------------------------------------ 2. 온대 저기압의 이동과 날씨 */
  {
    id: "c2", tag: "온대 저기압 · 전선", title: "모레의 야외 행사", short: "저기압 통과",
    who: "⛺", name: "학교 축제 준비위원회",
    say: "“모레 우리 지역에서 <b>6시간짜리 야외 공연</b>을 해요. 오전 9시부터 오후 6시 사이에 해야 하고, 비가 오면 안 됩니다. 서쪽에서 온대 저기압이 다가오고 있어요. 두 장의 일기도로 저기압이 움직이는 빠르기를 구하고, 비를 피할 시작 시각을 정해 주세요.”",
    predict: {
      q: "온대 저기압의 남쪽(전선이 지나는 쪽)에 있는 지역에서, 저기압이 지나가는 동안 날씨는 어떤 순서로 바뀔까요?",
      options: ["㉠ 넓은 비(온난 전선 앞) → 잠시 맑고 포근함 → 짧은 소나기(한랭 전선) → 맑고 쌀쌀함", "㉡ 짧은 소나기 → 넓은 비 → 맑음", "㉢ 저기압 중심이 지날 때만 비가 온다"],
      answer: 0
    },
    task: "일기도로 <b>저기압의 이동 속력</b>을 맞추고(± 2 km/h), 모레 <b>오전 9시 ~ 오후 6시</b> 사이에 비를 맞지 않을 공연 시작 시각을 정하세요.",
    build: function (stage, api) {
      var H = api.h, cv = api.canvas(350), ctx = cv.ctx, W = cv.W;
      var TRUE_V = 30, v = 50, start = 60;
      function xc(t, vv) { return -1500 + vv * t; }
      function wx(t, vv) {
        var c = xc(t, vv);
        if (c >= -600 && c <= -300) return "rain";
        if (c > -300 && c < 200) return "warm";
        if (c >= 200 && c <= 300) return "shower";
        return c < -600 ? "before" : "after";
      }
      var COL = { rain: "--brand", warm: "--amber", shower: "--violet", before: "--card-2", after: "--teal" };
      var NAME = { rain: "넓은 비", warm: "맑고 포근", shower: "소나기", before: "맑음(저기압 전)", after: "맑고 쌀쌀" };
      function draw() {
        H.paper(ctx, W, cv.H);
        H.text(ctx, "일기도 두 장 — 저기압 중심의 위치 (우리 지역 = 0 km)", 40, 26, { s: 13.5, w: "900" });
        var gx0 = 60, gx1 = 840;
        function GX(k) { return gx0 + (k + 1800) / 2400 * (gx1 - gx0); }
        H.axes(ctx, gx0, 40, gx1, 110);
        [-1500, -1000, -500, 0, 500].forEach(function (k) { H.text(ctx, k + "", GX(k), 126, { s: 10, a: "center", c: H.v("--mist") }); });
        H.line(ctx, [[GX(0), 40], [GX(0), 110]], H.v("--green-700"), 2);
        H.text(ctx, "우리 지역", GX(0) + 4, 52, { s: 11, w: "800", c: H.v("--green-700") });
        H.text(ctx, "L", GX(-1500), 78, { s: 20, w: "900", a: "center", c: H.v("--rose-700") });
        H.text(ctx, "오늘 09시", GX(-1500), 100, { s: 10.5, a: "center", c: H.v("--mist") });
        H.text(ctx, "L", GX(-1140), 78, { s: 20, w: "900", a: "center", c: H.v("--rose-700") });
        H.text(ctx, "오늘 21시", GX(-1140), 100, { s: 10.5, a: "center", c: H.v("--mist") });
        /* 내 예측 시간표 */
        var tx0 = 60, tx1 = 840, ty = 190;
        function TX(t) { return tx0 + t / 72 * (tx1 - tx0); }
        H.text(ctx, "내가 정한 속력(" + v + " km/h)으로 예측한 우리 지역 날씨", 40, 160, { s: 12.5, w: "800" });
        for (var t = 0; t < 72; t += 0.5) H.box(ctx, TX(t), ty, TX(0.5) - TX(0) + 0.5, 26, H.v(COL[wx(t, v)]), 0.75);
        ["오늘 09시", "내일 09시", "모레 09시", "글피 09시"].forEach(function (s, i) { H.text(ctx, s, TX(i * 24), ty + 44, { s: 10, a: "center", c: H.v("--mist") }); });
        H.box(ctx, TX(48), ty - 8, TX(57) - TX(48), 3, H.v("--green"), 0.9);
        H.text(ctx, "행사 가능 (모레 09~18시)", TX(48), ty - 14, { s: 10.5, w: "800", c: H.v("--green-700") });
        ctx.strokeStyle = H.v("--ink"); ctx.lineWidth = 2.5; ctx.strokeRect(TX(start), ty - 4, TX(start + 6) - TX(start), 34);
        var hh = (start % 24) + 9; var dd = Math.floor((start + 9) / 24);
        H.text(ctx, "공연 " + ["오늘", "내일", "모레", "글피"][dd] + " " + ((start + 9) % 24) + "시 시작", TX(start), ty + 64, { s: 12, w: "900" });
        var lx = 60; ["rain", "warm", "shower", "after"].forEach(function (k) { H.box(ctx, lx, 300, 14, 14, H.v(COL[k]), 0.8); H.text(ctx, NAME[k], lx + 20, 312, { s: 11, c: H.v("--mist") }); lx += 130; });
      }
      cv.canvas._redraw = draw;
      api.slider({ label: "저기압의 이동 속력 (일기도로 구하기)", min: 10, max: 60, step: 1, value: 50, fmt: function (x) { return x + " km/h"; },
        onInput: function (x) { v = x; draw(); } });
      api.slider({ label: "공연 시작 (오늘 09시부터 몇 시간 뒤)", min: 0, max: 66, step: 1, value: 60, fmt: function (x) { return x + " 시간 뒤"; },
        onInput: function (x) { start = x; draw(); } });
      api.info("이 저기압은 전선 구조가 일정한 채로 동쪽으로 움직인다고 봅니다. 온난 전선 앞 300 km는 넓은 비, 한랭 전선 뒤 100 km는 소나기 구역입니다.");
      draw();
      return {
        judge: function () {
          if (Math.abs(v - TRUE_V) > 2) return { ok: false, msg: "속력 " + v + " km/h — 두 일기도에서 중심이 12시간 동안 움직인 거리를 다시 재 보세요." };
          if (start < 48 || start + 6 > 57) return { ok: false, msg: "공연이 모레 09~18시 안에 들어가지 않습니다." };
          for (var t = start; t <= start + 6; t += 0.25) { var w = wx(t, TRUE_V); if (w === "rain" || w === "shower") return { ok: false, msg: "공연 도중 " + NAME[w] + " 구역이 지나갑니다." }; }
          return { ok: true, msg: "30 km/h로 다가오는 저기압 — 모레 " + (start - 39) + "시에 시작하면 온난 전선의 비가 그친 뒤, 한랭 전선의 소나기가 오기 전 ‘따뜻한 구역’에서 공연을 마칩니다." };
        }
      };
    },
    hints: [
      "두 일기도에서 중심이 −1500 km에서 −1140 km로 12시간 동안 움직였습니다. 1시간에 몇 km 일까요?",
      "속력을 맞추면 모레 아침에는 온난 전선의 비가 그치고, 오후에 한랭 전선 소나기가 옵니다. 그 사이 ‘맑고 포근한’ 틈을 노리세요."
    ],
    solution: "속력 <b>30 km/h</b>, 공연 시작 <b>모레 09~11시</b>(슬라이더 48~50시간 뒤).",
    why: "온대 저기압은 편서풍을 타고 서쪽에서 동쪽으로 이동하며, 남쪽 지역에는 <b>온난 전선 → 따뜻한 구역 → 한랭 전선</b>이 차례로 지나갑니다. 온난 전선 앞은 넓고 약한 비, 한랭 전선 부근은 좁고 강한 소나기가 특징입니다.<br>" +
      "일기도 두 장으로 이동 속력을 구하면, 전선이 언제 우리 지역을 지날지 <b>예측</b>할 수 있습니다. 일기 예보의 가장 기본적인 방법입니다. ※ 전선의 거리와 폭은 수업용 모형 값입니다."
  },

  /* ------------------------------------------------------------------ 3. 태풍의 위험 반원 */
  {
    id: "c3", tag: "태풍 · 위험 반원", title: "어선은 어디로 피하나", short: "태풍 피항",
    who: "🚢", name: "수협 어업 정보 통신국",
    say: "“태풍이 남쪽에서 <b>시속 36 km(10 m/s)</b>로 곧장 북상하고 있어요. 먼바다 어선들이 태풍 진로에서 벗어나 피해야 합니다. 배가 견딜 수 있는 바람은 <b>20 m/s</b>까지, 남은 연료로는 진로에서 <b>250 km</b>까지만 벗어날 수 있어요.”",
    predict: {
      q: "북상하는 태풍의 진로 오른쪽(동쪽)과 왼쪽(서쪽) 가운데, 같은 거리에서 바람이 더 센 쪽은?",
      options: ["㉠ 오른쪽 — 태풍 자체의 바람과 이동 방향이 같아 더해진다", "㉡ 왼쪽 — 태풍이 왼쪽으로 휘기 때문이다", "㉢ 양쪽이 같다"],
      answer: 0
    },
    task: "피할 방향과 진로에서 떨어진 거리를 정해 <b>바람 20 m/s 이하</b>인 곳을 찾으세요(250 km 이내).",
    build: function (stage, api) {
      var H = api.h, cv = api.canvas(340), ctx = cv.ctx, W = cv.W;
      var side = "R", r = 100, VT = 10, VMAX = 45, RMAX = 40;
      function vrot(d) { return d < RMAX ? VMAX * d / RMAX : VMAX * Math.pow(RMAX / d, 0.6); }
      function wind(sd, d) { return Math.max(0, vrot(d) + (sd === "R" ? VT : -VT)); }
      function draw() {
        H.paper(ctx, W, cv.H);
        H.text(ctx, "위에서 본 태풍 (북반구, 시계 반대 방향으로 부는 바람)", 40, 26, { s: 13.5, w: "900" });
        var cx = 260, cy = 185, sc = 0.55;
        for (var k = 1; k <= 4; k++) { ctx.strokeStyle = H.v("--line"); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, k * 60, 0, Math.PI * 2); ctx.stroke(); }
        H.box(ctx, cx, cy - 150, 150, 300, H.v("--rose"), 0.1);
        H.box(ctx, cx - 150, cy - 150, 150, 300, H.v("--teal"), 0.1);
        H.text(ctx, "위험 반원", cx + 75, 60, { s: 12, w: "900", a: "center", c: H.v("--rose-700") });
        H.text(ctx, "안전(가항) 반원", cx - 75, 60, { s: 12, w: "900", a: "center", c: H.v("--teal-700") });
        H.arrow(ctx, cx, cy + 40, cx, cy - 60, H.v("--ink"), 3, 12);
        H.text(ctx, "진로 (북상)", cx + 8, cy - 64, { s: 11, w: "800" });
        H.text(ctx, "🌀", cx, cy + 12, { s: 30, a: "center" });
        H.arrow(ctx, cx + 110, cy + 30, cx + 110, cy - 30, H.v("--rose"), 3, 10);
        H.arrow(ctx, cx - 110, cy - 30, cx - 110, cy + 30, H.v("--teal"), 3, 10);
        var bx = cx + (side === "R" ? 1 : -1) * Math.min(r * sc, 240);
        H.text(ctx, "🚢", bx, cy + 80, { s: 22, a: "center" });
        H.text(ctx, r + " km", bx, cy + 102, { s: 11, w: "800", a: "center" });
        var gx0 = 560, gx1 = 860, gy0 = 60, gy1 = 280;
        function GX(d) { return gx0 + d / 300 * (gx1 - gx0); }
        function GY(w) { return gy1 - w / 60 * (gy1 - gy0); }
        H.axes(ctx, gx0, gy0, gx1, gy1);
        H.text(ctx, "진로에서 떨어진 거리 → 풍속", gx0, gy0 - 12, { s: 11.5, w: "800", c: H.v("--mist") });
        [["R", "--rose"], ["L", "--teal"]].forEach(function (s) {
          var pts = []; for (var d = 0; d <= 300; d += 5) pts.push([GX(d), GY(wind(s[0], d))]);
          H.line(ctx, pts, H.v(s[1]), 2.5);
        });
        H.dash(ctx, gx0, GY(20), gx1, GY(20), H.v("--ink"));
        H.text(ctx, "20 m/s", gx1 - 2, GY(20) - 5, { s: 10.5, w: "800", a: "right" });
        [0, 100, 200, 300].forEach(function (d) { H.text(ctx, d + "", GX(d), gy1 + 14, { s: 10, a: "center", c: H.v("--mist") }); });
        var w = wind(side, r);
        H.dot(ctx, GX(r), GY(w), 6, H.v("--ink"));
        H.text(ctx, "배가 받는 바람 " + w.toFixed(1) + " m/s", gx0, 318, { s: 14, w: "900", c: w <= 20 ? H.v("--green-700") : H.v("--rose-700") });
      }
      cv.canvas._redraw = draw;
      api.seg({ label: "피할 방향", value: "R", options: [{ v: "R", t: "진로 오른쪽 (동쪽)" }, { v: "L", t: "진로 왼쪽 (서쪽)" }],
        onPick: function (x) { side = x; draw(); } });
      api.slider({ label: "진로에서 떨어진 거리", min: 0, max: 300, step: 10, value: 100, fmt: function (x) { return x + " km"; },
        onInput: function (x) { r = x; draw(); } });
      api.info("배가 받는 바람 = 태풍이 도는 바람 ± 태풍이 움직이는 빠르기(10 m/s). 오른쪽은 더해지고 왼쪽은 빼집니다.");
      draw();
      return {
        judge: function () {
          var w = wind(side, r);
          if (r > 250) return { ok: false, msg: r + " km — 남은 연료로 갈 수 없습니다." };
          if (w <= 20) return { ok: true, msg: (side === "L" ? "왼쪽(안전 반원)" : "오른쪽") + " " + r + " km — 바람 " + w.toFixed(1) + " m/s로 견딜 수 있습니다." };
          return { ok: false, msg: "바람 " + w.toFixed(1) + " m/s — 배가 견디기 어렵습니다." + (side === "R" ? " 오른쪽은 250 km 안에서는 20 m/s 아래로 내려가지 않아요." : "") };
        }
      };
    },
    hints: [
      "북반구 태풍은 시계 반대 방향으로 돕니다. 북상하는 태풍의 오른쪽에서는 도는 바람이 북쪽으로 불어 이동 방향과 <b>같아요</b>.",
      "오른쪽 곡선은 250 km 까지도 20 m/s 위에 있습니다. 왼쪽으로 피하면 몇 km부터 괜찮아지나요?"
    ],
    solution: "<b>진로 왼쪽(서쪽)</b>으로 <b>80 km 이상</b>(250 km 이내) 피하세요.",
    why: "태풍 진로의 오른쪽은 태풍이 도는 바람과 태풍의 이동 방향이 같아 <b>바람이 더해지는 위험 반원</b>, 왼쪽은 서로 반대여서 약해지는 <b>안전(가항) 반원</b>입니다. 게다가 오른쪽 바람은 배를 태풍 진로 앞쪽으로 밀어 넣습니다.<br>" +
      "2003년 태풍 매미 때 진로 오른쪽이던 부산·경남 해안의 피해가 유난히 컸던 까닭입니다. 그래서 선박은 태풍이 북상할 때 <b>왼쪽 반원</b>으로 피항합니다. ※ 풍속 계산은 수업용 모형입니다."
  }
  ]
});
})();
