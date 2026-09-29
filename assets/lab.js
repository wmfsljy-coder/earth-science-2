/* =========================================================================
   응용 실험실 — theme.js 다음에 불러온다(sthState·setupCanvas·cssVar 를 쓴다).

   이야기에서 찾아낸 개념을 "처음 보는 상황"에 써 보는 곳. 사례 하나는
     ① 예측(POE 의 P) → ② 직접 조작(O) → ③ 판정 → ④ 설명(E)
   순서로만 진행된다. 예측을 고르기 전에는 조작판이 잠겨 있다.
   세 번 틀리면 '풀이 보기'가 열려, 누구도 갇히지 않는다(풀이를 본 뒤에도 직접 맞춰야 해결).

     sthLab({
       mount: "lab", key: "lab", result: "rLab",
       cases: [{
         id: "c1", tag: "자유 낙하", title: "미지의 행성에서 온 영상",
         who: "🛰️", name: "관제 센터", say: "…",
         predict: { q: "…", options: ["㉠ …", "㉡ …", "㉢ …"], answer: 1 },
         task: "…무엇을 조작해 무엇을 만들라…",
         build: function (el, api) { …; return { judge: function () { return { ok: true, msg: "…" }; } }; },
         hints: ["첫 힌트", "둘째 힌트"], solution: "…", why: "…"
       }]
     });

   api:  api.canvas(h) → { canvas, ctx, W, H }     (가로 900 논리 좌표)
         api.slider({ label, min, max, step, value, fmt, onInput }) → { el, set(v) }
         api.seg({ label, options: [{ v, t }], value, onPick }) → { set(v) }
         api.button(text, onClick) → 버튼(조작판 아래 줄)
         api.info(html)            → 조작판 아래 안내 칸
         api.changed()             → 판정 문구를 지운다(조작이 바뀌었을 때)
         api.ticker()              → run(steps, ms, onStep(t)) : setTimeout 애니메이션, 새로 부르면 앞의 것은 멈춤
         api.h                     → 그리기 도우미 { text, paper, arrow, clamp, v, FONT }
   ========================================================================= */
(function () {
  "use strict";
  var FONT = "'Gothic A1','Segoe UI',sans-serif";

  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function v(name) { return window.cssVar(name); }
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function paper(ctx, W, H) { ctx.clearRect(0, 0, W, H); ctx.fillStyle = v("--panel"); ctx.fillRect(0, 0, W, H); }
  function text(ctx, s, x, y, o) {
    o = o || {};
    ctx.font = (o.w || "500") + " " + (o.s || 12) + "px " + FONT;
    ctx.fillStyle = o.c || v("--ink"); ctx.textAlign = o.a || "left";
    ctx.fillText(s, x, y);
  }
  function arrow(ctx, x1, y1, x2, y2, col, w, head) {
    ctx.save(); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = w || 3;
    window.drawArrow(ctx, x1, y1, x2, y2, head || 10); ctx.restore();
  }
  function dash(ctx, x1, y1, x2, y2, col, w) {
    ctx.save(); ctx.strokeStyle = col || v("--mist"); ctx.lineWidth = w || 1.5; ctx.setLineDash([5, 4]);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.restore();
  }
  function line(ctx, pts, col, w) {
    ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = w || 2.5; ctx.beginPath();
    pts.forEach(function (p, i) { if (i) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); });
    ctx.stroke(); ctx.restore();
  }
  function axes(ctx, x0, y0, x1, y1) {
    ctx.save(); ctx.strokeStyle = v("--line"); ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0, y1); ctx.lineTo(x1, y1); ctx.stroke(); ctx.restore();
  }
  function box(ctx, x, y, w, h, col, a) {
    ctx.save(); ctx.globalAlpha = a == null ? 1 : a; ctx.fillStyle = col; ctx.fillRect(x, y, w, h); ctx.restore();
  }
  function dot(ctx, x, y, r, col) { ctx.save(); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
  /* 오른쪽 수치 판 : rows = [[이름, 값, 색토큰(선택), 큰글씨(선택)], …] */
  function rows(ctx, x, y, list, gap) {
    gap = gap || 34;
    list.forEach(function (r, i) {
      var yy = y + i * gap;
      text(ctx, r[0], x, yy, { s: 12, w: "800", c: v("--mist") });
      text(ctx, r[1], x, yy + 18, { s: r[3] ? 20 : 15, w: "900", c: r[2] ? v(r[2]) : v("--ink") });
    });
  }
  function log10(x) { return Math.log(x) / Math.LN10; }
  var H_ = { text: text, paper: paper, arrow: arrow, clamp: clamp, v: v, FONT: FONT,
             dash: dash, line: line, axes: axes, box: box, dot: dot, rows: rows, log10: log10 };

  window.sthLab = function (opt) {
    var mount = document.getElementById(opt.mount);
    if (!mount) return;
    var KEY = opt.key || "lab", RES = opt.result || "rLab";
    var st = window.sthState(KEY) || {};
    var cases = opt.cases || [];
    mount.classList.add("lab");
    mount.innerHTML = "";

    /* ---- 맨 위 진행판 ---- */
    var top = el("div", "lab-top");
    var topTxt = el("div", "lab-top-t");
    var chips = el("div", "lab-chips");
    top.appendChild(topTxt); top.appendChild(chips);
    mount.appendChild(top);

    function save() {
      window.sthState(KEY, st);
      var solved = cases.filter(function (c) { return st[c.id] && st[c.id].ok; });
      var s = "응용 " + solved.length + "/" + cases.length + " 해결" +
        (solved.length ? " · " + solved.map(function (c) { return c.short || c.title; }).join(", ") : "");
      window.sthState(RES, solved.length ? s.slice(0, 120) : null);
      paintTop();
    }
    function paintTop() {
      var n = cases.filter(function (c) { return st[c.id] && st[c.id].ok; }).length;
      topTxt.innerHTML = "<b>" + n + " / " + cases.length + "</b> 해결" +
        (n === cases.length ? " — 모두 풀었습니다. 정리하기 탭에 나만의 말로 적어 보세요." : "");
      chips.innerHTML = "";
      cases.forEach(function (c, i) {
        var s = st[c.id] || {};
        var ch = el("a", "lab-chip" + (s.ok ? " ok" : (s.p != null ? " go" : "")), (s.ok ? "✅ " : (i + 1) + ". ") + c.title);
        ch.href = "#lab-" + c.id;
        ch.addEventListener("click", function (e) { e.preventDefault(); var t = document.getElementById("lab-" + c.id); if (t) t.scrollIntoView({ behavior: "smooth", block: "start" }); });
        chips.appendChild(ch);
      });
    }

    cases.forEach(function (c, ci) {
      var s = st[c.id] || (st[c.id] = {});
      var card = el("section", "lab-case"); card.id = "lab-" + c.id;
      card.appendChild(el("div", "lab-head",
        "<span class='lab-no'>" + (ci + 1) + "</span><span class='lab-tag'>" + (c.tag || "") + "</span><h3>" + c.title + "</h3>"));
      if (c.say) card.appendChild(el("div", "story", "<div class='who'>" + (c.who || "🧑‍🔬") + "</div><div class='say'>" +
        (c.name ? "<span class='name'>" + c.name + "</span>" : "") + c.say + "</div>"));

      /* ① 예측 */
      var pred = el("div", "gate loose lab-pred");
      pred.innerHTML = "<h4>① 먼저 예상해 봅시다</h4><p>" + c.predict.q + "</p><div class='opts'></div>";
      var opts = pred.querySelector(".opts");
      c.predict.options.forEach(function (t, i) {
        var b = el("button", "opt", t); b.type = "button";
        if (s.p === i) b.classList.add("picked");
        b.addEventListener("click", function () {
          if (s.ok) return;                                   /* 해결한 뒤에는 예측을 바꾸지 않는다 */
          Array.prototype.forEach.call(opts.children, function (o) { o.classList.remove("picked"); });
          b.classList.add("picked"); s.p = i; save(); unlock();
        });
        opts.appendChild(b);
      });
      card.appendChild(pred);

      /* ② 조작 */
      var body = el("div", "lab-body");
      var veil = el("div", "lab-veil", "🔒 위에서 예상을 하나 고르면 실험판이 열립니다");
      body.appendChild(veil);
      var stage = el("div", "stage-card");
      body.appendChild(el("div", "lab-step", "② 직접 해 봅시다"));
      body.appendChild(stage);
      var ctrls = el("div", "controls"), btnRow = null, info = null;
      var verdictTxt;

      var api = {
        h: H_,
        canvas: function (h) {
          var wrap = el("div", "canvas-wrap"), cv = document.createElement("canvas");
          cv.width = 900; cv.height = h || 360; wrap.appendChild(cv);
          stage.insertBefore(wrap, ctrls);                       /* 그림은 늘 조작 칸 위에 */
          var ctx = window.setupCanvas(cv);
          return { canvas: cv, ctx: ctx, W: cv._w, H: cv._h };
        },
        slider: function (o) {
          var g = el("div", "ctrl-group");
          var fmt = o.fmt || function (x) { return String(x); };
          g.innerHTML = "<div class='ctrl-label'>" + o.label + "<span class='val'></span></div>";
          var r = document.createElement("input");
          r.type = "range"; r.min = o.min; r.max = o.max; r.step = o.step || 1; r.value = o.value;
          var val = g.querySelector(".val"); val.textContent = fmt(+r.value);
          r.addEventListener("input", function () { val.textContent = fmt(+r.value); api.changed(); if (o.onInput) o.onInput(+r.value); });
          g.appendChild(r); ctrls.appendChild(g);
          return { el: r, set: function (x) { r.value = x; val.textContent = fmt(+r.value); if (o.onInput) o.onInput(+r.value); } };
        },
        seg: function (o) {
          var g = el("div", "ctrl-group");
          g.innerHTML = "<div class='ctrl-label'>" + o.label + "</div>";
          var sg = el("div", "seg"), btns = [];
          o.options.forEach(function (op) {
            var b = el("button", op.v === o.value ? "on" : "", op.t); b.type = "button";
            b.addEventListener("click", function () {
              btns.forEach(function (x) { x.classList.toggle("on", x === b); });
              api.changed(); if (o.onPick) o.onPick(op.v);
            });
            btns.push(b); sg.appendChild(b);
          });
          g.appendChild(sg); ctrls.appendChild(g);
          return { set: function (vv) { btns.forEach(function (x, i) { x.classList.toggle("on", o.options[i].v === vv); }); if (o.onPick) o.onPick(vv); } };
        },
        button: function (t, fn) {
          if (!btnRow) { btnRow = el("div", "btn-row lab-btns"); stage.appendChild(btnRow); }
          var b = el("button", "btn", t); b.type = "button";
          b.addEventListener("click", function () { api.changed(); fn(b); });
          btnRow.appendChild(b); return b;
        },
        info: function (html) {
          if (!info) { info = el("div", "info-card"); stage.appendChild(info); }
          info.innerHTML = html;
        },
        changed: function () { if (verdictTxt && !s.ok) { verdictTxt.textContent = ""; verdictTxt.className = "lab-verdict"; } },
        ticker: function () {
          var box = { gen: 0 };
          return function (steps, ms, onStep) {
            var my = ++box.gen, i = 0;
            (function step() {
              if (my !== box.gen) return;
              onStep(i / steps);
              if (i++ < steps) window.setTimeout(step, ms);
            })();
          };
        }
      };
      stage.appendChild(ctrls);

      /* ③ 판정 */
      var judgeRow = el("div", "lab-task");
      judgeRow.innerHTML = "<div class='lab-task-t'><b>③ 과제</b> " + c.task + "</div>";
      var jb = el("button", "btn primary", "판정하기"); jb.type = "button";
      verdictTxt = el("span", "lab-verdict");
      var jr = el("div", "btn-row"); jr.appendChild(jb); jr.appendChild(verdictTxt);
      judgeRow.appendChild(jr);
      var hintBox = el("div", "lab-hint"); hintBox.hidden = true;
      var solBtn = el("button", "btn", "💡 풀이 보기"); solBtn.type = "button"; solBtn.hidden = true;
      var solBox = el("div", "lab-sol"); solBox.hidden = true; solBox.innerHTML = "<b>풀이</b> " + (c.solution || "");
      judgeRow.appendChild(hintBox); judgeRow.appendChild(solBtn); judgeRow.appendChild(solBox);
      body.appendChild(judgeRow);
      card.appendChild(body);

      /* ④ 설명 */
      var why = el("div", "lab-why"); why.hidden = true;
      card.appendChild(why);
      mount.appendChild(card);

      var made = c.build(stage, api) || {};
      card._judge = made.judge;                         /* 검수 도구(_tools/labcheck.js)가 부른다 */

      function showHint() {
        var n = s.n || 0;
        if (n >= 1 && c.hints && c.hints.length) {
          var k = Math.min(n, c.hints.length) - 1;
          hintBox.hidden = false;
          hintBox.innerHTML = "<b>힌트 " + (k + 1) + "</b> " + c.hints[k];
        }
        if (n >= 3 && c.solution) solBtn.hidden = false;
      }
      function showWhy() {
        var a = c.predict.answer, p = s.p;
        var cmp = (a == null || p == null) ? "" :
          (p === a ? "<p class='lab-cmp ok'>처음 예상 <b>" + c.predict.options[p] + "</b> — 맞았습니다.</p>"
                   : "<p class='lab-cmp no'>처음 예상은 <b>" + c.predict.options[p] + "</b> 였지만, 실험 결과는 <b>" + c.predict.options[a] + "</b> 였습니다. 무엇이 생각과 달랐는지 짚어 보세요.</p>");
        why.hidden = false;
        why.innerHTML = "<h4>④ 왜 그럴까 — 설명</h4>" + cmp + "<div class='lab-why-t'>" + c.why + "</div>";
        card.classList.add("ok");
        jb.disabled = true;
        verdictTxt.className = "lab-verdict ok"; verdictTxt.textContent = "✅ 해결";
        hintBox.hidden = true; solBtn.hidden = true;
      }
      function unlock() { body.classList.remove("locked"); pred.classList.add("done"); }

      jb.addEventListener("click", function () {
        if (s.p == null || s.ok) return;
        var r = made.judge ? made.judge() : { ok: false, msg: "" };
        if (r.ok) {
          s.ok = 1; save(); showWhy();
          if (r.msg) { var m = el("p", "lab-cmp", r.msg); why.insertBefore(m, why.children[1] || null); }
        } else {
          s.n = (s.n || 0) + 1; save();
          verdictTxt.className = "lab-verdict no";
          verdictTxt.textContent = "✗ " + (r.msg || "아직 아닙니다.");
          showHint();
        }
      });
      solBtn.addEventListener("click", function () { solBox.hidden = false; solBtn.hidden = true; });

      /* 저장된 상태로 되살리기 */
      if (s.p == null) body.classList.add("locked"); else unlock();
      if (s.ok) showWhy(); else showHint();
    });
    paintTop();
  };
})();
