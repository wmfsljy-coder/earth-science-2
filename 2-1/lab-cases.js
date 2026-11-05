/* 지구과학 Ⅱ-1 지구의 역사 — 응용 실험실
   이야기에서 찾은 개념을 처음 보는 상황에 써 본다. 공용 엔진: ../assets/lab.js (sthLab) */
(function () {
"use strict";

window.sthLab({
  mount: "lab", key: "lab", result: "rLab",
  cases: [

  /* ------------------------------------------------------------------ 1. 열쇠층으로 지층 대비 */
  {
    id: "c1", about: "02", tag: "지층 대비 · 열쇠층", title: "두 골짜기의 지층 잇기", short: "지층 대비",
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
      /* 두 지역의 지층 기둥을 블록으로 잘라 세운다(B 블록은 위아래로 옮길 수 있다) */
      function column(ox, col, o, name) {
        var K = window.sthKit, I = K.iso({ ox: ox, oy: base - 60, s: 1, L: 76, D: 52 }), z = o * sc, labs = [];
        col.forEach(function (L) {
          var h = L[1] * sc;
          I.box(ctx, 0, 0, z, 76, 52, z + h, K.tint(L[2], 1.08), L[2], K.tint(L[2], .78));
          I.face(ctx, "front", function () { ctx.fillStyle = "rgba(255,255,255,.18)"; for (var k = 0; k < 40; k++) ctx.fillRect((k * 37) % 76, z + (k * 53) % Math.max(2, h), 1.5, 1.5); });
          labs.push([L[0], z + h / 2, h]);
          z += h;
        });
        var e = I.P(76, 52, o * sc), f = I.P(76, 52, z), g0 = I.P(0, 52, z), g1 = I.P(76, 0, z);
        ctx.strokeStyle = "rgba(255,255,255,.7)"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(f.x, f.y); ctx.moveTo(g0.x, g0.y); ctx.lineTo(f.x, f.y); ctx.lineTo(g1.x, g1.y); ctx.stroke();
        labs.forEach(function (lb) {
          var p = I.P(38, 52, lb[1]);
          if (lb[2] > 14) H.text(ctx, lb[0], p.x, p.y + 4, { s: 11, w: "900", a: "center", c: "#1b2430" });
          else { var q = I.P(76, 26, lb[1]); window.sthKit.pill(ctx, lb[0], q.x + 8, q.y + 4, { s: 11, c: "#ffc2c2" }); }
        });
        var top = I.P(0, 0, z);
        window.sthKit.pill(ctx, name, top.x, top.y - 12, { s: 12.5, a: "center", c: "#ffffff" });
        return I;
      }
      function draw() {
        var K = window.sthKit, LT = K.LT;
        H.paper(ctx, W, cv.H);
        ctx.fillStyle = "rgba(20,30,50,.16)"; ctx.beginPath(); ctx.ellipse(330, base - 10, 250, 18, 0, 0, 6.2832); ctx.fill();
        var IA = column(190, A, 0, "A 지역"), IB = column(450, B, off, "B 지역");
        var ya = (tuffTop(A) + 1.5) * sc, yb = (off + tuffTop(B) + 1.5) * sc;
        var pa = IA.P(76, 52, ya), pb = IB.P(0, 52, yb);
        ctx.save(); ctx.strokeStyle = LT.red; ctx.lineWidth = 2.4; ctx.setLineDash([7, 5]); ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke(); ctx.restore();
        var ok = Math.abs((tuffTop(A)) - (off + tuffTop(B))) <= 2;
        K.pill(ctx, "응회암끼리 잇는 선", (pa.x + pb.x) / 2 + 20, Math.max(pa.y, pb.y) + 28, { s: 11, a: "center", c: "#ffc2c2", box: [0, 610] });
        K.card(ctx, 622, 14, 264, cv.H - 28, "지층 대비");
        K.row(ctx, "B 기둥을 올린 높이", (off >= 0 ? "+" : "") + off + " m", 640, 868, 70);
        K.t(ctx, "응회암 높이 차", 640, 112, { s: 12, w: "800", c: LT.mute });
        K.t(ctx, Math.abs(tuffTop(A) - off - tuffTop(B)).toFixed(0) + " m", 640, 146, { s: 26, w: "900", c: ok ? LT.green : LT.red });
        K.tip(ctx, ok ? "같은 시기의 층이 나란히" : "응회암 높이를 맞춰 보세요", 634, 172, 240, ok);
        K.t(ctx, "※ B의 사암은 응회암 ‘위’에 있습니다", 640, 250, { s: 11, w: "700", c: LT.mute });
        K.t(ctx, "화산재는 넓은 곳에 한꺼번에 쌓인다", 640, 300, { s: 11, w: "800", c: "#1179a6" });
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
    id: "c2", about: "02", tag: "방사성 동위 원소 · 반감기", title: "검사용 방사성 약품 고르기", short: "반감기",
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
        var K = window.sthKit, LT = K.LT, COL = { tc: LT.teal, i: LT.violet, f: LT.orange };
        H.paper(ctx, W, cv.H);
        var g = K.chart(ctx, { x: 16, y: 34, w: 570, h: 276, x0: 0, x1: 48, y0: 0, y1: 1, xt: 4, yt: 2, pl: 52, light: true,
          xl: "주사 뒤 시간 →", xf: function (v) { return v + "시간"; }, yf: function (v) { return Math.round(v * 100) + "%"; } });
        K.t(ctx, "주사 뒤 몸속에 남은 방사성 원소의 비율", 22, 22, { s: 13.5, w: "900", c: LT.ink });
        ctx.save(); ctx.strokeStyle = LT.red; ctx.setLineDash([5, 4]); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(g.L, g.Y(1 / 16)); ctx.lineTo(g.R, g.Y(1 / 16)); ctx.stroke(); ctx.restore();
        K.t(ctx, "1/16 (6.25%)", g.R - 4, g.Y(1 / 16) - 6, { s: 10.5, w: "800", a: "right", c: LT.red });
        Object.keys(ISO).forEach(function (k) {
          var pts = []; for (var h = 0; h <= 48; h += 0.25) pts.push([h, rem(k, h)]);
          K.plot(ctx, g, pts, COL[k], { light: true, w: k === iso ? 3.6 : 1.4, glow: k === iso });
        });
        ctx.strokeStyle = LT.ink; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(g.X(t), g.T); ctx.lineTo(g.X(t), g.B); ctx.stroke();
        var p = rem(iso, t);
        ctx.fillStyle = "#ffffff"; ctx.strokeStyle = COL[iso]; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.arc(g.X(t), g.Y(p), 7, 0, 6.2832); ctx.fill(); ctx.stroke();
        K.card(ctx, 600, 14, 286, cv.H - 28, "고른 원소");
        K.t(ctx, ISO[iso].t, 618, 64, { s: 17, w: "900", c: COL[iso] });
        K.row(ctx, "반감기", ISO[iso].hl >= 24 ? (ISO[iso].hl / 24) + "일" : ISO[iso].hl + "시간", 618, 868, 100);
        var r1 = rem(iso, 1), r24 = rem(iso, 24);
        K.row(ctx, "1시간 뒤 남은 양", (r1 * 100).toFixed(1) + "%", 618, 868, 136, r1 >= 0.85 ? LT.green : LT.red);
        K.row(ctx, "24시간 뒤 남은 양", (r24 * 100).toFixed(1) + "%", 618, 868, 172, r24 <= 1 / 16 + 1e-9 ? LT.green : LT.red);
        K.t(ctx, t + "시간 뒤 남은 양", 618, 214, { s: 12, w: "800", c: LT.mute });
        K.t(ctx, (p * 100).toFixed(2) + "%", 618, 246, { s: 24, w: "900", c: LT.ink });
        K.bar(ctx, 618, 262, 250, p, COL[iso]);
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
    id: "c3", about: "03", tag: "시상 화석 · 고환경", title: "산호 화석이 말하는 옛 바다", short: "산호 시상화석",
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
      /* 옛 바다를 블록으로 잘라 본 모형: 수심·물빛·탁도가 조작대로 바뀐다 */
      function draw() {
        var K = window.sthKit, LT = K.LT;
        H.paper(ctx, W, cv.H);
        var I = K.iso({ ox: 300, oy: 140, s: 0.8, L: 300, D: 110 }), ZW = 150, zf = ZW - depth * 0.65;
        var warm = temp === "warm", ok = checks().every(function (c) { return c[1]; });
        ctx.fillStyle = "rgba(20,30,50,.18)"; ctx.beginPath(); ctx.ellipse(I.P(300, 110, 0).x - 100, I.P(300, 110, 0).y + 6, 230, 22, 0, 0, 6.2832); ctx.fill();
        /* 바닥 아래 퇴적물(석회질 모래) */
        ["front", "right"].forEach(function (side) {
          I.face(ctx, side, function (Lw) {
            var g = ctx.createLinearGradient(0, 0, 0, zf); g.addColorStop(0, "#a8916a"); g.addColorStop(1, "#e6d4a8");
            ctx.fillStyle = g; ctx.fillRect(0, 0, Lw, zf);
            ctx.strokeStyle = "rgba(90,70,40,.25)"; ctx.lineWidth = 1; for (var lz = 8; lz < zf; lz += 10) { ctx.beginPath(); ctx.moveTo(0, lz); ctx.lineTo(Lw, lz); ctx.stroke(); }
          });
        });
        I.shade(ctx, "right", function () { return zf; });
        I.plane(ctx, zf, "#efe0b8", null);
        if (ok) {                                           /* 초를 만드는 산호 미니어처 */
          var R = K.rng(4);
          for (var k = 0; k < 16; k++) {
            var p = I.P(20 + R() * 260, 15 + R() * 85, zf), col = ["#ff8fa3", "#ffb36b", "#c99cff", "#ff6b81"][k % 4];
            for (var b = -2; b <= 2; b++) { ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + b * 4, p.y - 10 - Math.abs(2 - Math.abs(b)) * 4); ctx.stroke(); }
          }
        }
        /* 물: 따뜻하면 청록, 차가우면 짙은 파랑. 탁하면 흙빛 */
        var top = warm ? "rgba(60,200,200,.40)" : "rgba(70,130,210,.42)", deep = warm ? "rgba(10,110,130,.62)" : "rgba(20,50,120,.66)";
        if (clear !== "clear") { top = "rgba(160,140,90,.55)"; deep = "rgba(110,90,50,.75)"; }
        I.water(ctx, ZW, function () { return zf; }, { top: top, deep: deep });
        if (clear !== "clear") { var R2 = K.rng(9); for (var q = 0; q < 50; q++) { var pp = I.P(R2() * 300, 110, zf + R2() * (ZW - zf)); ctx.fillStyle = "rgba(120,90,40,.55)"; ctx.beginPath(); ctx.arc(pp.x, pp.y, 1.6, 0, 6.2832); ctx.fill(); } }
        /* 햇빛: 깊을수록, 탁할수록 약해진다 */
        var reach = clear === "clear" ? 90 : 30;
        for (var r = 0; r < 5; r++) {
          var a = I.P(40 + r * 55, 110, ZW), b2 = I.P(40 + r * 55 + 10, 110, Math.max(zf, ZW - reach));
          var lg = ctx.createLinearGradient(a.x, a.y, b2.x, b2.y); lg.addColorStop(0, "rgba(255,240,170,.55)"); lg.addColorStop(1, "rgba(255,240,170,0)");
          ctx.strokeStyle = lg; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b2.x, b2.y); ctx.stroke();
        }
        K.sun(ctx, 70, 52, 12);
        var box = [0, 600];
        I.label(ctx, 300, 55, zf, "바닥 · 수심 " + depth + " m", 34, 30, "#f6e7c4", box);
        I.label(ctx, 300, 30, ZW, (warm ? "따뜻한 바다 25 ℃" : "차가운 바다 10 ℃") + (sal === "sea" ? " · 바닷물" : " · 민물 섞임"), 30, -18, "#bfe6ff", box);
        if (ok) I.label(ctx, 150, 60, zf + 8, "산호초", -60, -50, "#ffc2cf", box);
        K.bigText(ctx, ok ? "산호가 살 수 있는 바다" : "산호가 살 수 없다", 18, 300, 20, ok ? "#7dffa8" : "#ff9a8a");
        /* 오른쪽 판정 카드 */
        K.card(ctx, 610, 14, 276, cv.H - 28, "산호가 살려면");
        checks().forEach(function (c, i) {
          var y = 74 + i * 52;
          ctx.fillStyle = c[1] ? "#e7f7f0" : "#fdeee4"; ctx.beginPath(); ctx.roundRect(624, y - 22, 248, 40, 10); ctx.fill();
          K.t(ctx, (c[1] ? "✓ " : "✗ ") + c[0], 634, y + 3, { s: 11.5, w: "800", c: c[1] ? "#0f766e" : "#b4400c" });
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
