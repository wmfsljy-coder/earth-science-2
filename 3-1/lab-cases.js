/* 지구과학 Ⅲ-1 태양계 행성의 겉보기 운동 — 응용 실험실
   이야기에서 찾은 개념을 처음 보는 상황에 써 본다. 공용 엔진: ../assets/lab.js (sthLab) */
(function () {
"use strict";

window.sthLab({
  mount: "lab", key: "lab", result: "rLab",
  cases: [

  /* ------------------------------------------------------------------ 1. 회합 주기 */
  {
    id: "c1", tag: "외행성 · 충 · 회합 주기", title: "다음 토성 관측의 밤", short: "회합 주기",
    who: "🪐", name: "천문대 관측 계획팀",
    say: "“오늘 밤 토성이 <b>충</b>이에요. 밤새 보이고 가장 밝습니다. 다음 충에 맞춰 공개 관측회를 또 열고 싶은데, 토성은 <b>29.5년</b>에 태양을 한 바퀴 돌아요. 다음 충은 며칠 뒤일까요?”",
    predict: {
      q: "토성의 공전 주기는 29.5년입니다. 다음 충까지 걸리는 시간은?",
      options: ["㉠ 약 29.5년", "㉡ 1년보다 조금 더 길다", "㉢ 정확히 1년"],
      answer: 1
    },
    task: "시간을 흘려 <b>태양 – 지구 – 토성이 다시 한 줄</b>(충)이 되는 날을 찾으세요(± 3일).",
    build: function (stage, api) {
      var H = api.h, cv = api.canvas(330), ctx = cv.ctx, W = cv.W;
      var d = 200, PS = 29.46 * 365.25;
      function angE(t) { return 2 * Math.PI * t / 365.25; }
      function angS(t) { return 2 * Math.PI * t / PS; }
      function sep(t) { var x = (angE(t) - angS(t)) % (2 * Math.PI); if (x > Math.PI) x -= 2 * Math.PI; return x * 180 / Math.PI; }
      function draw() {
        H.paper(ctx, W, cv.H);
        H.text(ctx, "위에서 본 태양계 (크기 비율은 무시)", 40, 26, { s: 13.5, w: "900" });
        var cx = 230, cy = 180, rE = 60, rS = 140;
        ctx.strokeStyle = H.v("--line"); ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(cx, cy, rE, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(cx, cy, rS, 0, Math.PI * 2); ctx.stroke();
        H.text(ctx, "☀️", cx, cy + 9, { s: 24, a: "center" });
        var e = [cx + rE * Math.cos(-angE(d)), cy + rE * Math.sin(-angE(d))];
        var s = [cx + rS * Math.cos(-angS(d)), cy + rS * Math.sin(-angS(d))];
        H.dash(ctx, cx, cy, s[0], s[1], H.v("--amber"));
        H.dot(ctx, e[0], e[1], 7, H.v("--brand")); H.text(ctx, "지구", e[0], e[1] - 12, { s: 11, w: "800", a: "center", c: H.v("--brand-700") });
        H.dot(ctx, s[0], s[1], 8, H.v("--amber")); H.text(ctx, "토성", s[0] + 12, s[1] + 4, { s: 11, w: "800", c: H.v("--amber-700") });
        H.line(ctx, [[cx + rS + 4, cy], [cx + rS + 22, cy]], H.v("--mist"), 1.5);
        H.text(ctx, "처음 충의 방향", cx + rS + 26, cy + 26, { s: 10.5, a: "right", c: H.v("--mist") });
        var g = sep(d);
        H.rows(ctx, 520, 60, [
          ["충 이후 지난 날", d + " 일"],
          ["지구가 돈 각도", (angE(d) * 180 / Math.PI).toFixed(0) + "°"],
          ["토성이 돈 각도", (angS(d) * 180 / Math.PI).toFixed(1) + "°"],
          ["지구가 토성을 앞선 각도", (((angE(d) - angS(d)) * 180 / Math.PI) % 360).toFixed(1) + "°", Math.abs(g) < 3 && d > 30 ? "--green-700" : null, true]
        ], 56);
      }
      cv.canvas._redraw = draw;
      api.slider({ label: "충 이후 지난 날", min: 0, max: 800, step: 1, value: 200, fmt: function (x) { return x + " 일"; }, onInput: function (x) { d = x; draw(); } });
      api.info("지구는 1년에 360°, 토성은 1년에 약 12° 돕니다. 지구가 토성을 한 바퀴 ‘따라잡는’ 순간이 다음 충이에요.");
      draw();
      return {
        judge: function () {
          if (Math.abs(d - 378) <= 3) return { ok: true, msg: d + "일 뒤 — 지구가 360° 더 돌아 토성을 다시 따라잡았습니다. 회합 주기 약 378일." };
          return { ok: false, msg: d + "일 뒤에는 세 천체가 한 줄이 아닙니다(지구가 앞선 각도를 보세요)." };
        }
      };
    },
    hints: [
      "지구가 한 바퀴(365일) 돌았을 때 토성도 약 12° 앞으로 가 있습니다. 그만큼 지구가 더 가야 해요.",
      "1/S = 1/(지구 공전 주기) − 1/(토성 공전 주기) = 1/1 − 1/29.46 (년)."
    ],
    solution: "약 <b>378일</b> 뒤(375 ~ 381일).",
    why: "외행성의 <b>회합 주기</b>는 ‘지구가 그 행성을 한 바퀴 따라잡는 시간’입니다. 1/S = 1/E − 1/P. 토성처럼 느린 행성은 거의 제자리라 1년보다 조금 더 걸리고, 화성처럼 지구와 빠르기가 비슷한 행성은 약 780일이나 걸려요.<br>" +
      "지구가 외행성을 추월하는 충 무렵에는 행성이 하늘에서 거꾸로(서쪽으로) 움직이는 <b>역행</b>이 나타납니다 — 역행은 추월입니다."
  },

  /* ------------------------------------------------------------------ 2. 최대 이각 */
  {
    id: "c2", tag: "내행성 · 최대 이각", title: "화성에서 본 샛별, 지구", short: "최대 이각",
    who: "🔴", name: "화성 기지 천문 동아리",
    say: "“화성 기지에서 보면 지구는 <b>내행성</b>이에요. 저녁 하늘에 파란 샛별로 떠요! 지구가 태양에서 가장 멀리 떨어져 보이는 날(동방 최대 이각)을 찾아 관측 행사를 열려 해요. 화성의 공전 궤도 반지름은 1.52 AU 입니다.”",
    predict: {
      q: "화성 기지에서 한밤중(자정)에 남쪽 하늘 높이 뜬 지구를 볼 수 있을까요?",
      options: ["㉠ 볼 수 있다 — 충일 때", "㉡ 볼 수 없다 — 내행성은 태양에서 일정한 각도 이상 떨어져 보이지 않으므로", "㉢ 날마다 볼 수 있다"],
      answer: 1
    },
    task: "지구의 위치를 옮겨 화성에서 본 <b>지구와 태양 사이의 각(이각)이 가장 커지는</b> 순간을 찾으세요(최대 이각 − 0.5° 이내).",
    build: function (stage, api) {
      var H = api.h, cv = api.canvas(330), ctx = cv.ctx, W = cv.W;
      var th = 150, RM = 1.52;
      function elong(t) {
        var a = t * Math.PI / 180, ex = Math.cos(a), ey = Math.sin(a), mx = RM, my = 0;
        var v1x = -mx, v1y = -my, v2x = ex - mx, v2y = ey - my;
        var c = (v1x * v2x + v1y * v2y) / (Math.hypot(v1x, v1y) * Math.hypot(v2x, v2y));
        return Math.acos(Math.max(-1, Math.min(1, c))) * 180 / Math.PI;
      }
      var MAX = Math.asin(1 / RM) * 180 / Math.PI;
      function draw() {
        H.paper(ctx, W, cv.H);
        H.text(ctx, "위에서 본 모습 (화성 고정)", 40, 26, { s: 13.5, w: "900" });
        var cx = 200, cy = 180, sc = 90;
        ctx.strokeStyle = H.v("--line"); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cy, sc, 0, Math.PI * 2); ctx.stroke();
        H.text(ctx, "☀️", cx, cy + 9, { s: 22, a: "center" });
        var mx = cx + RM * sc, my = cy;
        H.dot(ctx, mx, my, 8, H.v("--rose")); H.text(ctx, "화성", mx + 12, my + 4, { s: 11, w: "800", c: H.v("--rose-700") });
        var a = th * Math.PI / 180, ex = cx + sc * Math.cos(a), ey = cy - sc * Math.sin(a);
        H.dot(ctx, ex, ey, 7, H.v("--brand")); H.text(ctx, "지구", ex, ey - 12, { s: 11, w: "800", a: "center", c: H.v("--brand-700") });
        H.line(ctx, [[mx, my], [cx, cy]], H.v("--amber"), 1.5);
        H.line(ctx, [[mx, my], [ex, ey]], H.v("--brand"), 1.5);
        var el = elong(th);
        H.rows(ctx, 470, 60, [
          ["지구의 위치 (태양 둘레 각)", th + "°"],
          ["화성에서 본 이각", el.toFixed(1) + "°", el >= MAX - 0.5 ? "--green-700" : null, true],
          ["이때 태양 – 지구 – 화성이 이루는 각", (180 - el - th).toFixed(0) + "°"]
        ], 62);
      }
      cv.canvas._redraw = draw;
      api.slider({ label: "지구의 위치", min: 0, max: 180, step: 1, value: 150, fmt: function (x) { return x + "°"; }, onInput: function (x) { th = x; draw(); } });
      api.info("0° 는 지구가 태양과 화성 사이에 있는 때(내합), 180° 는 태양 너머에 있는 때(외합)입니다. 그 사이 어딘가에서 이각이 가장 커져요.");
      draw();
      return {
        judge: function () {
          var el = elong(th);
          if (el >= MAX - 0.5) return { ok: true, msg: "이각 " + el.toFixed(1) + "° — 화성에서 본 지구의 최대 이각(약 " + MAX.toFixed(0) + "°)입니다. 이때 화성에서 지구로 그은 선이 지구 궤도에 접합니다." };
          return { ok: false, msg: "이각 " + el.toFixed(1) + "° — 아직 더 커질 수 있습니다." };
        }
      };
    },
    hints: [
      "이각이 가장 클 때는 화성 → 지구 시선이 지구 궤도(원)에 <b>접선</b>이 됩니다. 태양 – 지구 – 화성의 각이 몇 도일 때일까요?",
      "직각삼각형에서 sin(최대 이각) = 지구 궤도 반지름 ÷ 화성 궤도 반지름 = 1 ÷ 1.52."
    ],
    solution: "태양 – 지구 – 화성이 <b>직각</b>을 이루는 위치(슬라이더 약 49°)에서 최대 이각 약 <b>41°</b>.",
    why: "내행성은 태양에서 최대 이각보다 멀리 떨어져 보일 수 없습니다. 그래서 금성은 초저녁 서쪽(개밥바라기)이나 새벽 동쪽(샛별)에만 보이고 한밤중에는 뜨지 않지요. 최대 이각은 sin⁻¹(내행성 궤도 반지름 ÷ 관측자 행성 궤도 반지름)으로 구합니다 — 지구에서 본 금성은 약 46°, 수성은 약 28°.<br>" +
      "코페르니쿠스는 이 관계를 거꾸로 써서 내행성의 궤도 반지름을 처음으로 계산했습니다."
  },

  /* ------------------------------------------------------------------ 3. 개기 일식의 조건 */
  {
    id: "c3", tag: "일식 · 시지름", title: "포보스는 태양을 가릴 수 있을까", short: "포보스 일식",
    who: "🌘", name: "화성 탐사 로버 팀",
    say: "“로버가 찍은 영상에서 화성의 위성 <b>포보스</b>(반지름 약 11 km)가 태양 앞을 지나가는데, 가운데가 뚫린 채 지나갔어요. 포보스는 조금씩 화성에 가까워지고 있답니다. 언젠가 <b>개기 일식</b>이 되려면 화성 표면에서 몇 km 까지 가까워져야 할까요? 태양이 가장 커 보이는 <b>근일점</b>에서도 개기 일식이 되어야 합니다.”",
    predict: {
      q: "위성이 태양을 완전히 가리는 개기 일식이 되려면 무엇이 같거나 커야 할까요?",
      options: ["㉠ 위성의 실제 크기가 태양보다 커야 한다", "㉡ 하늘에서 보이는 위성의 겉보기 크기(시지름)가 태양의 시지름 이상이어야 한다", "㉢ 위성이 태양보다 밝아야 한다"],
      answer: 1
    },
    task: "화성의 위치를 고르고 포보스의 고도를 정해, <b>근일점에서도 개기 일식이 되는 가장 먼 고도</b>를 찾으세요(± 150 km).",
    build: function (stage, api) {
      var H = api.h, cv = api.canvas(300), ctx = cv.ctx, W = cv.W;
      var R_SUN = 696000, RP = 11.1, pos = "avg", alt = 6000;
      var DIST = { peri: 2.066e8, avg: 2.279e8, aph: 2.492e8 };
      function sunA() { return R_SUN / DIST[pos]; }
      function phoA() { return RP / alt; }
      function limit(p) { return RP / (R_SUN / DIST[p]); }
      function draw() {
        H.paper(ctx, W, cv.H);
        H.text(ctx, "화성 표면에서 올려다본 하늘", 40, 26, { s: 13.5, w: "900" });
        var cx = 220, cy = 160, k = 40000;
        var rs = sunA() * k, rp = phoA() * k;
        ctx.fillStyle = "#ffcf5a"; ctx.beginPath(); ctx.arc(cx, cy, rs, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#3b3530"; ctx.beginPath(); ctx.arc(cx, cy, rp, 0, Math.PI * 2); ctx.fill();
        var tot = phoA() >= sunA();
        H.text(ctx, tot ? "개기 일식 — 태양이 완전히 가려짐" : "태양 가장자리가 고리처럼 남음", cx, 280, { s: 13, w: "900", a: "center", c: tot ? H.v("--green-700") : H.v("--amber-700") });
        H.rows(ctx, 480, 60, [
          ["태양의 시반지름", (sunA() * 180 / Math.PI * 60).toFixed(2) + " ′"],
          ["포보스의 시반지름", (phoA() * 180 / Math.PI * 60).toFixed(2) + " ′", tot ? "--green-700" : "--rose-700"],
          ["포보스 고도", alt + " km", null, true]
        ], 62);
        H.text(ctx, "※ 지금 포보스의 고도는 약 6000 km", 480, 260, { s: 11, c: H.v("--mist") });
      }
      cv.canvas._redraw = draw;
      api.seg({ label: "화성의 위치", value: "avg", options: [{ v: "peri", t: "근일점 (태양 가까움)" }, { v: "avg", t: "평균 거리" }, { v: "aph", t: "원일점 (태양 멂)" }], onPick: function (x) { pos = x; draw(); } });
      api.slider({ label: "포보스의 고도 (화성 표면에서)", min: 1000, max: 8000, step: 100, value: 6000, fmt: function (x) { return x + " km"; }, onInput: function (x) { alt = x; draw(); } });
      api.info("시반지름(각) ≈ 실제 반지름 ÷ 거리. 포보스가 가까워질수록 크게 보이고, 화성이 태양에 가까울수록 태양도 크게 보입니다.");
      draw();
      return {
        judge: function () {
          var L = limit("peri");
          if (pos !== "peri") return { ok: false, msg: "근일점에서도 개기 일식이 되어야 합니다. 태양이 가장 크게 보이는 위치를 고르세요." };
          if (phoA() < sunA()) return { ok: false, msg: "고도 " + alt + " km — 아직 태양 가장자리가 남습니다." };
          if (alt < L - 150) return { ok: false, msg: "개기 일식은 되지만 더 먼 고도에서도 가능합니다. 가장 먼 고도를 찾으세요." };
          return { ok: true, msg: "근일점 · 고도 " + alt + " km — 포보스의 시지름이 태양 이상이 됩니다(한계 약 " + L.toFixed(0) + " km)." };
        }
      };
    },
    hints: [
      "태양이 가장 크게 보이는 근일점을 먼저 고르세요. 그다음 포보스를 조금씩 가까이 가져가며 가장자리가 사라지는 순간을 찾으세요.",
      "11.1 ÷ 고도 = 696 000 ÷ (2.07 × 10⁸) 이 되는 고도를 계산해 보세요."
    ],
    solution: "<b>근일점</b>을 고르고 고도를 <b>3200 km</b>로 하세요. 한계는 약 3300 km 입니다.",
    why: "일식의 종류는 실제 크기가 아니라 <b>겉보기 크기(시지름)</b>로 정해집니다. 지구의 달은 태양보다 400배 작지만 400배 가까워 시지름이 거의 같고, 그래서 개기 일식과 금환 일식이 번갈아 일어나지요. 달이 원지점 근처면 금환 일식, 근지점 근처면 개기 일식입니다.<br>" +
      "포보스는 지금 너무 작게 보여 태양을 다 가리지 못합니다(‘고리 모양’ 통과). 포보스는 해마다 약 2 cm 씩 화성에 가까워지고 있어, 먼 미래에는 조석력에 부서질 것으로 예상돼요."
  }
  ]
});
})();
