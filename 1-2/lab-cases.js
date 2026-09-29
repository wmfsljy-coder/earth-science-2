/* 지구과학 Ⅰ-2 대기와 해양의 상호작용과 기후 변화 — 응용 실험실
   이야기에서 찾은 개념을 처음 보는 상황에 써 본다. 공용 엔진: ../assets/lab.js (sthLab) */
(function () {
"use strict";

window.sthLab({
  mount: "lab", key: "lab", result: "rLab",
  cases: [

  /* ------------------------------------------------------------------ 1. 적도 용승 */
  {
    id: "c1", tag: "용승 · 에크만 수송", title: "적도 바다가 차가운 까닭", short: "적도 용승",
    who: "🐟", name: "갈라파고스 연구소",
    say: "“적도 바로 위인데도 갈라파고스 앞바다는 수온이 <b>22 ℃ 아래</b>로 차갑고, 그 덕에 영양염이 풍부해 펭귄까지 삽니다. 적도에 부는 바람이 이 찬물을 끌어올린다는데… 어떤 바람이 얼마나 세게 불어야 할까요?”",
    predict: {
      q: "적도에서 동풍(동쪽에서 서쪽으로 부는 바람)이 불면, 적도 바로 북쪽의 표층 해수는 어느 쪽으로 이동할까요?",
      options: ["㉠ 북쪽 — 북반구에서는 바람의 오른쪽으로 수송되므로", "㉡ 남쪽", "㉢ 서쪽으로만 흘러간다"],
      answer: 0
    },
    task: "바람의 방향과 세기를 정해 <b>적도 동태평양의 표층 수온을 22 ℃ 이하</b>로 만드세요(평소 무역풍은 10 m/s 를 넘지 않습니다).",
    build: function (stage, api) {
      var H = api.h, cv = api.canvas(330), ctx = cv.ctx, W = cv.W;
      var dir = "W", u = 4;
      function sst() { return dir === "E2W" ? 27 - 0.6 * u : 27 + 0.2 * u; }
      function draw() {
        H.paper(ctx, W, cv.H);
        H.text(ctx, "적도를 남북으로 자른 단면 (왼쪽 남, 오른쪽 북)", 40, 26, { s: 13.5, w: "900" });
        var cx = 300, sy = 110, k = u / 10;
        H.box(ctx, 60, sy, 480, 200, H.v("--brand"), 0.22);
        H.line(ctx, [[cx, 50], [cx, 310]], H.v("--line"), 1.5);
        H.text(ctx, "적도", cx, 46, { s: 11, w: "800", a: "center", c: H.v("--mist") });
        H.text(ctx, "남반구", 120, 90, { s: 12, w: "800", a: "center", c: H.v("--mist") });
        H.text(ctx, "북반구", 480, 90, { s: 12, w: "800", a: "center", c: H.v("--mist") });
        if (u > 0) {
          H.text(ctx, dir === "E2W" ? "⊙ 동풍 (지면에서 나오는 쪽으로 서진)" : "⊗ 서풍 (지면으로 들어가는 쪽으로 동진)", cx, 74, { s: 11.5, w: "800", a: "center" });
          var outward = dir === "E2W";
          var len = 40 + 90 * k;
          if (outward) { H.arrow(ctx, cx + 20, sy + 12, cx + 20 + len, sy + 12, H.v("--teal-700"), 3, 10); H.arrow(ctx, cx - 20, sy + 12, cx - 20 - len, sy + 12, H.v("--teal-700"), 3, 10);
            H.arrow(ctx, cx, sy + 150, cx, sy + 30, H.v("--brand-700"), 3 + 3 * k, 12); H.text(ctx, "용승", cx + 10, sy + 100, { s: 12, w: "900", c: H.v("--brand-700") }); }
          else { H.arrow(ctx, cx + 20 + len, sy + 12, cx + 20, sy + 12, H.v("--coral-700"), 3, 10); H.arrow(ctx, cx - 20 - len, sy + 12, cx - 20, sy + 12, H.v("--coral-700"), 3, 10);
            H.arrow(ctx, cx, sy + 30, cx, sy + 130, H.v("--coral-700"), 3, 12); H.text(ctx, "침강", cx + 10, sy + 100, { s: 12, w: "900", c: H.v("--coral-700") }); }
          H.text(ctx, "에크만 수송", cx + 30, sy + 32, { s: 10.5, c: H.v("--mist") });
        }
        var t = sst();
        H.rows(ctx, 600, 70, [
          ["바람", u === 0 ? "없음" : (dir === "E2W" ? "동풍 " : "서풍 ") + u.toFixed(1) + " m/s"],
          ["적도 동태평양 표층 수온", t.toFixed(1) + " ℃", t <= 22 ? "--green-700" : "--rose-700", true],
          ["영양염", t <= 22 ? "풍부 🐟" : "부족"]
        ], 62);
      }
      cv.canvas._redraw = draw;
      api.seg({ label: "바람의 방향", value: "W", options: [{ v: "E2W", t: "동풍 (무역풍 방향)" }, { v: "W", t: "서풍" }],
        onPick: function (x) { dir = x; draw(); } });
      api.slider({ label: "바람의 세기", min: 0, max: 10, step: 0.5, value: 4, fmt: function (x) { return x.toFixed(1) + " m/s"; },
        onInput: function (x) { u = x; draw(); } });
      api.info("적도를 경계로 북반구에서는 바람의 <b>오른쪽</b>, 남반구에서는 <b>왼쪽</b>으로 표층 해수가 수송됩니다.");
      draw();
      return {
        judge: function () {
          var t = sst();
          if (t <= 22) return { ok: true, msg: "동풍 " + u.toFixed(1) + " m/s → " + t.toFixed(1) + " ℃ — 표층수가 양쪽으로 갈라지며 아래의 찬물이 올라옵니다." };
          return { ok: false, msg: "표층 수온 " + t.toFixed(1) + " ℃ — " + (dir === "W" ? "서풍은 표층수를 적도로 모읍니다." : "용승이 아직 약합니다.") };
        }
      };
    },
    hints: [
      "동풍이 불면 적도 북쪽 물은 바람의 오른쪽(북), 남쪽 물은 바람의 왼쪽(남)으로 갑니다. 적도에서 물이 <b>갈라지면</b> 빈자리는 어디서 채워질까요?",
      "동풍일 때 수온은 바람 1 m/s 마다 약 0.6 ℃ 내려갑니다. 27 ℃ 에서 22 ℃ 까지 내리려면?"
    ],
    solution: "<b>동풍</b>을 <b>8.5 m/s 이상</b>으로 하세요.",
    why: "적도에서 동풍(무역풍)이 불면 에크만 수송이 북반구에서는 북쪽, 남반구에서는 남쪽으로 일어나 표층수가 <b>갈라집니다(발산)</b>. 그 빈자리를 아래의 차갑고 영양염이 풍부한 물이 채우는 것이 <b>적도 용승</b>이에요.<br>" +
      "무역풍이 약해지면 용승이 약해져 동태평양이 따뜻해지는데, 이것이 <b>엘니뇨</b>입니다. 멸치가 사라진 해의 페루 앞바다처럼요. ※ 수온 계산은 수업용 모형입니다."
  },

  /* ------------------------------------------------------------------ 2. 밀란코비치 주기 */
  {
    id: "c2", tag: "기후 변화의 자연적 요인", title: "빙하기가 시작되는 조건", short: "빙하기 조건",
    who: "🧊", name: "고기후 연구실",
    say: "“북반구 고위도(65°N)의 <b>여름 햇빛</b>이 약해 겨울눈이 여름에 다 녹지 않고 쌓이기 시작하면 빙하기가 옵니다. 기준은 여름 일사량 <b>440 W/m² 이하</b>. 지금 지구는 약 464 W/m² 예요. 지구 궤도가 어떻게 바뀌어야 빙하기가 시작될까요?”",
    predict: {
      q: "지금 지구는 1월 초에 태양과 가장 가깝습니다(근일점). 그렇다면 북반구의 여름(7월)은?",
      options: ["㉠ 태양에서 먼 때이므로 조금 덜 뜨겁다", "㉡ 태양에서 가까운 때라 더 뜨겁다", "㉢ 태양과의 거리는 계절과 전혀 상관없다"],
      answer: 0
    },
    task: "자전축 기울기, 이심률, 근일점 시기를 조절해 <b>65°N 여름 일사량을 440 W/m² 이하</b>로 만드세요.",
    build: function (stage, api) {
      var H = api.h, cv = api.canvas(320), ctx = cv.ctx, W = cv.W;
      var tilt = 23.4, e = 0.015, peri = "jan";
      function ins() { return 480 * (1 + 0.04 * (tilt - 23.44)) * (peri === "jan" ? 1 - 2 * e : 1 + 2 * e); }
      function draw() {
        H.paper(ctx, W, cv.H);
        H.text(ctx, "지구 공전 궤도 (위에서 본 모습, 이심률 과장)", 40, 26, { s: 13.5, w: "900" });
        var cx = 230, cy = 175, a = 150, b = a * Math.sqrt(1 - Math.min(0.9, e * 10) * Math.min(0.9, e * 10)), c = Math.sqrt(a * a - b * b);
        ctx.strokeStyle = H.v("--line"); ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(cx, cy, a, b, 0, 0, Math.PI * 2); ctx.stroke();
        var sx = cx + c; H.text(ctx, "☀️", sx, cy + 10, { s: 26, a: "center" });
        var pe = [cx + a, cy], ap = [cx - a, cy];
        var jan = peri === "jan" ? pe : ap, jul = peri === "jan" ? ap : pe;
        H.dot(ctx, jan[0], jan[1], 9, H.v("--brand")); H.text(ctx, "1월", jan[0], jan[1] - 16, { s: 12, w: "900", a: "center", c: H.v("--brand-700") });
        H.dot(ctx, jul[0], jul[1], 9, H.v("--coral")); H.text(ctx, "7월 (북반구 여름)", jul[0], jul[1] - 16, { s: 12, w: "900", a: "center", c: H.v("--coral-700") });
        H.text(ctx, "기울기 " + tilt.toFixed(1) + "°", 60, 300, { s: 12, w: "800", c: H.v("--mist") });
        var I = ins(), gx = 520, gy0 = 60, gy1 = 280;
        function GY(v) { return gy1 - (v - 380) / 160 * (gy1 - gy0); }
        H.axes(ctx, gx, gy0, gx + 60, gy1);
        H.box(ctx, gx + 10, GY(I), 40, gy1 - GY(I), I <= 440 ? H.v("--brand") : H.v("--amber"), 0.8);
        H.line(ctx, [[gx - 6, GY(440)], [gx + 70, GY(440)]], H.v("--rose"), 2);
        H.text(ctx, "440 (빙하기 문턱)", gx + 76, GY(440) + 4, { s: 11, w: "800", c: H.v("--rose-700") });
        H.dash(ctx, gx - 6, GY(464), gx + 70, GY(464), H.v("--mist"));
        H.text(ctx, "지금 지구 464", gx + 76, GY(464) + 4, { s: 11, c: H.v("--mist") });
        H.text(ctx, "65°N 여름 일사량", gx - 6, gy0 - 12, { s: 11.5, w: "800", c: H.v("--mist") });
        H.text(ctx, I.toFixed(0) + " W/m²", gx + 30, gy1 + 22, { s: 16, w: "900", a: "center", c: I <= 440 ? H.v("--brand-700") : H.v("--amber-700") });
      }
      cv.canvas._redraw = draw;
      api.slider({ label: "자전축 기울기", min: 22.0, max: 24.5, step: 0.1, value: 23.4, fmt: function (x) { return x.toFixed(1) + "°"; },
        onInput: function (x) { tilt = x; draw(); } });
      api.slider({ label: "공전 궤도 이심률", min: 0, max: 0.06, step: 0.005, value: 0.015, fmt: function (x) { return x.toFixed(3); },
        onInput: function (x) { e = x; draw(); } });
      api.seg({ label: "근일점 (태양과 가장 가까운 때)", value: "jan", options: [{ v: "jan", t: "1월 (지금)" }, { v: "jul", t: "7월 (약 1만 1천 년 뒤)" }],
        onPick: function (x) { peri = x; draw(); } });
      api.info("기울기가 작을수록 여름이 덜 덥고, 북반구 여름이 원일점 무렵일수록, 궤도가 찌그러질수록(이심률이 클수록) 여름 햇빛이 약해집니다.");
      draw();
      return {
        judge: function () {
          var I = ins();
          if (I <= 440) return { ok: true, msg: "기울기 " + tilt.toFixed(1) + "° · 이심률 " + e.toFixed(3) + " · 근일점 " + (peri === "jan" ? "1월" : "7월") + " → " + I.toFixed(0) + " W/m² — 여름에도 눈이 남아 빙하가 자라기 시작합니다." };
          return { ok: false, msg: "여름 일사량 " + I.toFixed(0) + " W/m² — 여름 햇빛이 아직 강해 눈이 다 녹습니다." };
        }
      };
    },
    hints: [
      "근일점이 7월이면 북반구 여름이 태양과 가까워 오히려 더 뜨거워집니다. 어느 쪽이어야 할까요?",
      "근일점을 1월로 두고, 이심률을 키우고(원일점이 더 멀어짐), 기울기를 작게 해 보세요."
    ],
    solution: "예: <b>근일점 1월 · 이심률 0.05 · 기울기 22.5°</b>. 여러 조합이 가능하지만, 근일점은 반드시 1월(북반구 여름이 원일점)이어야 합니다.",
    why: "지구 궤도의 세 요소 — <b>이심률</b>(약 10만 년), <b>자전축 기울기</b>(약 4만 1천 년), <b>세차 운동</b>에 따른 근일점 시기(약 2만 6천 년) — 가 겹치며 고위도 여름 햇빛을 바꿉니다(밀란코비치 주기).<br>" +
      "빙하기는 겨울이 추워서가 아니라 <b>여름이 덜 더워 눈이 살아남을 때</b> 시작돼요. 다만 이 자연적 요인은 수천 ~ 수만 년에 걸친 느린 변화라, 최근 100년의 빠른 온난화는 설명하지 못합니다. ※ 일사량 식은 수업용 모형입니다."
  },

  /* ------------------------------------------------------------------ 3. 해수면 상승의 수지 */
  {
    id: "c3", tag: "지구 온난화 · 해수면", title: "30년 동안 오른 10 cm", short: "해수면 수지",
    who: "📡", name: "해수면 관측 위성팀",
    say: "“위성으로 재 보니 1993 ~ 2023년 30년 동안 전 세계 해수면이 약 <b>10 cm</b> 올랐어요. 그 원인을 하나하나 더해 10 cm 를 맞춰 보고서를 써야 합니다. 바닷물은 1 ℃ 오를 때마다 부피가 <b>0.02%</b> 늘고, 이 기간 데워진 층은 평균 <b>0.2 ℃</b> 올랐어요.”",
    predict: {
      q: "북극 바다에 떠 있는 얼음(해빙)이 녹는 것은 해수면 상승에 얼마나 기여할까요?",
      options: ["㉠ 가장 큰 원인이다", "㉡ 거의 기여하지 않는다 — 이미 물에 떠 있으므로", "㉢ 오히려 해수면을 낮춘다"],
      answer: 1
    },
    task: "해수면을 올린 원인을 모두 고르고, 바닷물이 데워진 <b>깊이</b>를 정해 합계가 <b>10 ± 0.5 cm</b> 가 되게 하세요.",
    build: function (stage, api) {
      var H = api.h, cv = api.canvas(320), ctx = cv.ctx, W = cv.W;
      var depth = 300, on = { gl: false, gr: false, an: false, lw: false, si: true };
      var SRC = [["gl", "산악 빙하", 2.0, "--teal"], ["gr", "그린란드 빙상", 2.0, "--brand"], ["an", "남극 빙상", 1.0, "--violet"], ["lw", "육지의 물 저장 변화", 1.0, "--amber"], ["si", "북극 해빙", 0.0, "--mist"]];
      function thermal() { return 0.0002 * 0.2 * depth * 100; }
      function total() { var s = thermal(); SRC.forEach(function (x) { if (on[x[0]]) s += x[2]; }); return s; }
      function draw() {
        H.paper(ctx, W, cv.H);
        H.text(ctx, "해수면 상승 수지 (cm)", 40, 26, { s: 14, w: "900" });
        var bx = 80, by = 280, sc = 20, y = by;
        var parts = [["열팽창 (" + depth + " m 깊이까지)", thermal(), "--coral"]];
        SRC.forEach(function (x) { if (on[x[0]]) parts.push([x[1], x[2], x[3]]); });
        parts.forEach(function (p) {
          var h = p[1] * sc; if (h <= 0) return;
          H.box(ctx, bx, y - h, 90, h, H.v(p[2]), 0.75);
          H.text(ctx, p[0] + " " + p[1].toFixed(1), bx + 100, y - h / 2 + 4, { s: 11.5, w: "800" });
          y -= h;
        });
        H.axes(ctx, bx - 10, 60, bx + 100, by);
        H.line(ctx, [[bx - 20, by - 10 * sc], [bx + 110, by - 10 * sc]], H.v("--rose"), 2);
        H.text(ctx, "관측 10 cm", bx - 24, by - 10 * sc + 4, { s: 11, w: "800", a: "right", c: H.v("--rose-700") });
        var T = total();
        H.rows(ctx, 620, 80, [
          ["원인을 더한 합계", T.toFixed(1) + " cm", Math.abs(T - 10) <= 0.5 ? "--green-700" : "--rose-700", true],
          ["열팽창 = 0.0002 × 0.2 ℃ × 깊이", thermal().toFixed(1) + " cm"]
        ], 70);
      }
      cv.canvas._redraw = draw;
      api.slider({ label: "바닷물이 데워진 깊이", min: 0, max: 2000, step: 100, value: 300, fmt: function (x) { return x + " m"; },
        onInput: function (x) { depth = x; draw(); } });
      SRC.forEach(function (x) {
        api.seg({ label: x[1] + " (" + x[2].toFixed(1) + " cm)", value: on[x[0]] ? 1 : 0, options: [{ v: 1, t: "포함" }, { v: 0, t: "빼기" }],
          onPick: function (v) { on[x[0]] = v === 1; draw(); } });
      });
      api.info("각 원인 옆의 숫자는 이 기간에 관측된 기여량입니다. 실제로 해수면을 올린 것만 넣어야 해요.");
      draw();
      return {
        judge: function () {
          var T = total(), miss = SRC.filter(function (x) { return x[2] > 0 && !on[x[0]]; });
          if (miss.length) return { ok: false, msg: miss.map(function (x) { return x[1]; }).join(", ") + " — 관측된 기여를 빠뜨렸습니다." };
          if (Math.abs(T - 10) <= 0.5) return { ok: true, msg: "합계 " + T.toFixed(1) + " cm — 바다가 약 " + depth + " m 까지 데워진 열팽창이 약 " + thermal().toFixed(1) + " cm 로 가장 큰 몫입니다." };
          return { ok: false, msg: "합계 " + T.toFixed(1) + " cm — 관측값 10 cm 와 맞지 않습니다. 열팽창의 깊이를 다시 보세요." };
        }
      };
    },
    hints: [
      "땅 위의 얼음과 물(빙하·빙상·육지의 물)은 모두 바다로 새로 들어온 물입니다. 떠 있는 해빙은 어떨까요?",
      "나머지 원인을 모두 더하면 6 cm. 열팽창이 4 cm 가 되려면 0.0002 × 0.2 × 깊이 = 0.04 m → 깊이는?"
    ],
    solution: "빙하·그린란드·남극·육지의 물을 <b>모두 포함</b>하고(해빙은 넣든 빼든 0), 깊이를 <b>약 1000 m</b>(900 ~ 1100 m)로 하세요.",
    why: "해수면 상승의 두 축은 <b>바닷물의 열팽창</b>과 <b>육지 얼음의 융해</b>입니다. 바다는 온난화로 늘어난 열의 90% 이상을 흡수해 깊은 곳까지 데워지고, 그만큼 부피가 늘어요.<br>" +
      "떠 있는 해빙은 녹아도 해수면을 거의 올리지 않지만, 햇빛 반사를 줄여 온난화를 부추깁니다. 해수면은 온실 기체를 줄여도 수백 년 동안 계속 오르므로 <b>완화와 적응</b>이 함께 필요해요. ※ 기여량은 관측을 어림한 수업용 값입니다."
  }
  ]
});
})();
