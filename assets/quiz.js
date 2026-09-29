/* =========================================================================
   수준별 문제 — theme.js 다음에 불러온다(sthState 를 쓴다).

   한 단원의 문제를 세 단계로 나눈다.
     1 기본 : 용어와 핵심 개념 확인 (OX · 빈칸 · 짝짓기 · 고르기)
     2 발전 : 자료 해석과 계산      (보기 고르기 · 계산 · 순서 · 자료 읽기)
     3 심화 : 새 상황에 적용과 논증  (처음 보는 상황 · 서술형 자기 평가)
   문제마다 그 소단원의 성취기준(학습 목표)을 붙여, 목표별 달성도를 보여 준다.
   학습 목표 문장은 페이지의 .std-note 에서 그대로 읽어 온다(두 번 적지 않는다).

     sthQuiz({ mount: "quiz", key: "quiz", result: "rQuiz", items: [
       { id: "q1", lv: 1, sec: "01", std: "10통과2-01-01", t: "ox", q: "…", a: true, why: "…" },
       { t: "mc",    q, options: [..], a: 0 },
       { t: "bogi",  q, items: ["ㄱ 문장", ..], a: [0, 2] },          // 옳은 것을 모두
       { t: "blank", q: "…( 가 )…( 나 )…", a: [["답", "다른 표기"], ["답"]] },
       { t: "num",   q, a: 3.7, tol: 0.1, unit: "m/s²" },
       { t: "order", q, items: ["처음", "다음", "끝"] },                // 바른 순서로 적는다
       { t: "match", q, pairs: [["왼쪽", "짝"], ..] },
       { t: "essay", q, model: "모범 답안", rubric: ["채점 기준", ..] }
     ]});
   공통 선택 항목: fig (문제 아래 자료 HTML), hint (한 번 틀리면 보이는 도움말), why (해설)
   ========================================================================= */
(function () {
  "use strict";

  var LV = {
    1: { name: "기본", sub: "개념 확인", desc: "용어와 핵심 개념을 확인합니다" },
    2: { name: "발전", sub: "해석과 계산", desc: "자료를 읽고, 계산하고, 순서를 세웁니다" },
    3: { name: "심화", sub: "적용과 논증", desc: "처음 보는 상황에 개념을 쓰고 근거를 들어 설명합니다" }
  };
  var TYPE = { ox: "OX", mc: "고르기", bogi: "보기 고르기", blank: "빈칸", num: "계산", order: "순서", match: "짝짓기", essay: "서술" };
  var KOR = ["ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ"], GANA = ["가", "나", "다", "라", "마"];

  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function norm(s) {
    return String(s == null ? "" : s)
      .replace(/[₀-₉]/g, function (c) { return String(c.charCodeAt(0) - 8320); })
      .replace(/[⁰¹²³⁴-⁹]/g, function (c) { return "⁰¹²³⁴⁵⁶⁷⁸⁹".indexOf(c) + ""; })
      .replace(/[\s·ㆍ\-_,.()（）'"`~]/g, "").toLowerCase();
  }
  function num(s) {
    s = String(s || "").replace(/,/g, "").replace(/\s/g, "").replace(/×10\^?/, "e").replace(/x10\^?/i, "e");
    if (!/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(s)) return NaN;
    return parseFloat(s);
  }
  function seedPerm(id, n) {
    var h = 0, i; for (i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
    var p = []; for (i = 0; i < n; i++) p.push(i);
    for (i = n - 1; i > 0; i--) { h = (h * 1103515245 + 12345) >>> 0; var j = h % (i + 1), t = p[i]; p[i] = p[j]; p[j] = t; }
    var same = true; for (i = 0; i < n; i++) if (p[i] !== i) same = false;
    if (same && n > 1) p.push(p.shift());
    return p;
  }

  window.sthQuiz = function (opt) {
    var mount = document.getElementById(opt.mount || "quiz");
    if (!mount) return;
    var KEY = opt.key || "quiz", RES = opt.result || "rQuiz";
    var items = opt.items || [];
    var st = window.sthState(KEY) || {};
    mount.classList.add("qz"); mount.innerHTML = "";

    /* 소단원 이름·학습 목표는 페이지에서 읽는다 */
    var SEC = {};
    Array.prototype.forEach.call(document.querySelectorAll(".tab-btn"), function (b) {
      var n = b.querySelector(".num"); if (n) SEC[n.textContent.trim()] = b.textContent.replace(n.textContent, "").trim();
    });
    var STD = {}, stdOrder = [];
    Array.prototype.forEach.call(document.querySelectorAll(".std-note"), function (d) {
      var re = /\[([^\]]+)\]<\/b>\s*([^<]*)/g, m;
      while ((m = re.exec(d.innerHTML))) { if (!STD[m[1]]) { STD[m[1]] = m[2].trim(); stdOrder.push(m[1]); } }
    });

    function solved(it) { var s = st[it.id]; return !!(s && s.r === 1 && !s.sh); }
    function tried(it) { return !!st[it.id]; }
    function byLv(l) { return items.filter(function (it) { return it.lv === l; }); }

    function save() {
      window.sthState(KEY, st);
      var any = items.some(tried);
      var parts = [1, 2, 3].filter(function (l) { return byLv(l).length; }).map(function (l) {
        return LV[l].name + " " + byLv(l).filter(solved).length + "/" + byLv(l).length;
      });
      window.sthState(RES, any ? parts.join(" · ") : null);
      paintTop();
    }

    /* ---- 맨 위: 단계 고르기 + 학습 목표별 달성도 ---- */
    var top = el("div", "qz-top");
    var lvRow = el("div", "qz-levels");
    var goal = el("details", "qz-goals");
    top.appendChild(lvRow); top.appendChild(goal);
    mount.appendChild(top);
    var list = el("div", "qz-list");
    mount.appendChild(list);

    var cur = st._lv || 1;
    var lvBtns = {};
    [1, 2, 3].forEach(function (l) {
      if (!byLv(l).length) return;
      var b = el("button", "qz-lv lv" + l); b.type = "button";
      b.addEventListener("click", function () { cur = l; st._lv = l; window.sthState(KEY, st); show(); });
      lvBtns[l] = b; lvRow.appendChild(b);
    });

    function paintTop() {
      var rec = null;
      [1, 2, 3].forEach(function (l) {
        var b = lvBtns[l]; if (!b) return;
        var all = byLv(l), n = all.filter(solved).length, pct = Math.round(n / all.length * 100);
        if (rec === null && n / all.length < 0.8) rec = l;
        b.innerHTML = "<span class='qz-lv-k'>" + l + "단계</span><b>" + LV[l].name + "</b><span class='qz-lv-s'>" + LV[l].sub + "</span>" +
          "<span class='qz-bar'><i style='width:" + pct + "%'></i></span><span class='qz-lv-n'>" + n + " / " + all.length + " 해결</span>" +
          "<span class='qz-rec'>지금 추천</span>";
        b.classList.toggle("on", cur === l);
      });
      [1, 2, 3].forEach(function (l) { if (lvBtns[l]) lvBtns[l].classList.toggle("rec", l === rec); });
      /* 학습 목표 */
      var html = "<summary>🎯 이 단원의 학습 목표와 달성도</summary><ul>";
      stdOrder.forEach(function (c) {
        var mine = items.filter(function (it) { return it.std === c; });
        if (!mine.length) return;
        var n = mine.filter(solved).length, pct = Math.round(n / mine.length * 100);
        html += "<li><span class='qz-std'>" + c + "</span> " + STD[c] +
          "<span class='qz-bar sm'><i style='width:" + pct + "%'></i></span><span class='qz-lv-n'>" + n + " / " + mine.length + "</span></li>";
      });
      goal.innerHTML = html + "</ul><p class='qz-note'>1단계에서 80% 이상 풀면 다음 단계를 추천합니다. 어느 단계부터 시작해도 괜찮아요.</p>";
    }

    var cards = [];
    function show() {
      cards.forEach(function (c) { c.hidden = c._item.lv !== cur; });
      var n = 0; cards.forEach(function (c) { if (!c.hidden) c.querySelector(".qz-no").textContent = ++n; });
      paintTop();
    }

    /* ---- 문제 카드 ---- */
    items.forEach(function (it) {
      var s = st[it.id];
      var card = el("section", "qz-card"); card._item = it; card.id = "qz-" + it.id;
      var sec = it.sec && SEC[it.sec] ? it.sec + " · " + SEC[it.sec] : "";
      card.appendChild(el("div", "qz-head",
        "<span class='qz-no'></span><span class='qz-type'>" + TYPE[it.t] + "</span>" +
        (sec ? "<span class='qz-sec'>" + sec + "</span>" : "") +
        (it.std ? "<span class='qz-std' title='" + (STD[it.std] || "").replace(/'/g, "’") + "'>" + it.std + "</span>" : "")));
      card.appendChild(el("div", "qz-q", String(it.q)
        .replace(/\(\s{2,}\)/g, "<span class='qz-gap'>&nbsp;</span>")
        .replace(/\(\s*([가나다라마])\s*\)/g, "<span class='qz-gap'>$1</span>")));
      if (it.fig) card.appendChild(el("div", "qz-fig", it.fig));
      var box = el("div", "qz-ans"); card.appendChild(box);
      var row = el("div", "qz-row"); card.appendChild(row);
      var verdict = el("span", "qz-verdict");
      var fb = el("div", "qz-fb"); fb.hidden = true;
      card.appendChild(fb);
      var check = null, auto = null, lock = function () {};

      function state() { return st[it.id] || (st[it.id] = { r: 0, n: 0 }); }
      function answerText() {
        switch (it.t) {
          case "ox": return it.a ? "O" : "X";
          case "mc": return it.options[it.a];
          case "bogi": return it.a.map(function (i) { return KOR[i]; }).join(", ");
          case "blank": return it.a.map(function (x, i) { return (it.a.length > 1 ? "(" + GANA[i] + ") " : "") + x[0]; }).join(" · ");
          case "num": return it.a + (it.unit ? " " + it.unit : "");
          case "order": return it.items.join(" → ");
          case "match": return it.pairs.map(function (p) { return p[0] + " — " + p[1]; }).join(" / ");
        }
        return "";
      }
      function done(ok, shown) {
        var S = state();
        if (ok) S.r = 1; if (shown) S.sh = 1; S.end = 1;
        card.classList.add(ok && !shown ? "ok" : "seen");
        verdict.className = "qz-verdict " + (ok && !shown ? "ok" : "no");
        verdict.textContent = ok && !shown ? (S.n ? "✅ 맞았습니다 (" + (S.n + 1) + "번째 시도)" : "✅ 한 번에 맞았습니다") : (shown ? "📖 정답을 확인했습니다" : "✗ 틀렸습니다 — 정답과 해설을 확인하세요");
        fb.hidden = false;
        fb.innerHTML = (shown || it.t === "ox" && !ok ? "<p class='qz-a'><b>정답</b> " + answerText() + "</p>" : "") + (it.why ? "<div class='qz-why'><b>해설</b> " + it.why + "</div>" : "");
        lock();
        if (checkBtn) checkBtn.disabled = true; showBtn.hidden = true;
        save();
      }
      function wrong(msg) {
        var S = state(); S.n = (S.n || 0) + 1; save();
        verdict.className = "qz-verdict no";
        verdict.textContent = "✗ " + (msg || "다시 생각해 보세요.");
        if (it.hint) { fb.hidden = false; fb.innerHTML = "<div class='qz-hint'><b>도움말</b> " + it.hint + "</div>"; }
        if (S.n >= 2) showBtn.hidden = false;
      }
      var checkBtn = null;
      var showBtn = el("button", "btn qz-show", "정답 보기"); showBtn.type = "button"; showBtn.hidden = true;
      showBtn.addEventListener("click", function () { done(false, true); });

      /* ---- 형식별 입력 ---- */
      if (it.t === "ox" || it.t === "mc") {
        var opts = it.t === "ox" ? ["O", "X"] : it.options;
        var wrap = el("div", "qz-opts" + (it.t === "ox" ? " ox" : ""));
        var btns = opts.map(function (o, i) {
          var b = el("button", "opt", it.t === "mc" ? "<span class='qz-k'>" + "①②③④⑤"[i] + "</span> " + o : o); b.type = "button";
          b.addEventListener("click", function () {
            if (card.classList.contains("ok") || card.classList.contains("seen")) return;
            var ok = it.t === "ox" ? (i === 0) === it.a : i === it.a;
            if (ok) { b.classList.add("right"); done(true); }
            else {
              b.classList.add("wrong");
              if (it.t === "ox") { state().n = 1; done(false, false); }
              else wrong();
            }
          });
          wrap.appendChild(b); return b;
        });
        box.appendChild(wrap);
        lock = function () { btns.forEach(function (b, i) { b.disabled = true; if (it.t === "ox" ? (i === 0) === it.a : i === it.a) b.classList.add("right"); }); };
        auto = function (good) {
          var i = it.t === "ox" ? (it.a ? (good ? 0 : 1) : (good ? 1 : 0)) : (good ? it.a : (it.a + 1) % opts.length);
          btns[i].click();
        };
      } else if (it.t === "bogi") {
        var bl = el("div", "qz-bogi");
        var chk = it.items.map(function (tx, i) {
          var lab = el("label", "qz-bogi-i", "<input type='checkbox'> <b>" + KOR[i] + ".</b> " + tx);
          bl.appendChild(lab); return lab.querySelector("input");
        });
        box.appendChild(el("div", "qz-bogi-h", "&lt;보기&gt; 옳은 것을 모두 고르세요"));
        box.appendChild(bl);
        check = function () {
          var pick = []; chk.forEach(function (c, i) { if (c.checked) pick.push(i); });
          if (!pick.length) return { soft: "고른 것이 없습니다." };
          return pick.join() === it.a.slice().sort().join() ? true : "고른 것 가운데 틀린 것이 있거나, 빠진 것이 있습니다.";
        };
        lock = function () { chk.forEach(function (c) { c.disabled = true; }); };
        auto = function (good) { chk.forEach(function (c, i) { c.checked = it.a.indexOf(i) >= 0; }); if (!good) chk[0].checked = !chk[0].checked; };
      } else if (it.t === "blank") {
        var ins = it.a.map(function (x, i) {
          var g = el("label", "qz-blank", (it.a.length > 1 ? "(" + GANA[i] + ") " : "답 ") + "<input type='text' autocomplete='off'>");
          box.appendChild(g); return g.querySelector("input");
        });
        check = function () {
          var empty = ins.some(function (x) { return !x.value.trim(); });
          if (empty) return { soft: "빈칸을 모두 채우세요." };
          var bad = [];
          ins.forEach(function (x, i) { var v = norm(x.value); if (!it.a[i].some(function (a) { return norm(a) === v; })) bad.push(it.a.length > 1 ? "(" + GANA[i] + ")" : "답"); });
          return bad.length ? bad.join(", ") + " 이(가) 맞지 않습니다." : true;
        };
        lock = function () { ins.forEach(function (x) { x.disabled = true; }); };
        auto = function (good) { ins.forEach(function (x, i) { x.value = good ? it.a[i][0] : "모름"; }); };
        ins.forEach(function (x) { x.addEventListener("keydown", function (e) { if (e.key === "Enter" && checkBtn) checkBtn.click(); }); });
      } else if (it.t === "num") {
        var g = el("label", "qz-blank", "답 <input type='text' inputmode='decimal' autocomplete='off'> " + (it.unit || ""));
        box.appendChild(g); var inp = g.querySelector("input");
        var tol = it.tol != null ? it.tol : Math.abs(it.a) * 0.02;
        check = function () {
          var v = num(inp.value);
          if (isNaN(v)) return { soft: "숫자로 적어 주세요." };
          if (Math.abs(v - it.a) <= tol + 1e-12) return true;
          return v > it.a ? "값이 너무 큽니다." : "값이 너무 작습니다.";
        };
        lock = function () { inp.disabled = true; };
        auto = function (good) { inp.value = good ? String(it.a) : String(it.a * 3 + 7); };
        inp.addEventListener("keydown", function (e) { if (e.key === "Enter" && checkBtn) checkBtn.click(); });
      } else if (it.t === "order") {
        var perm = seedPerm(it.id, it.items.length), seq = [];
        var pool = el("div", "qz-pool"), line = el("div", "qz-seq");
        box.appendChild(el("div", "qz-sub", "차례대로 누르세요"));
        box.appendChild(pool); box.appendChild(line);
        var chips = perm.map(function (k) {
          var c = el("button", "qz-chip", it.items[k]); c.type = "button"; c._k = k;
          c.addEventListener("click", function () { if (c.disabled) return; seq.push(k); c.disabled = true; paintSeq(); });
          pool.appendChild(c); return c;
        });
        var reset = el("button", "btn qz-reset", "↺ 다시"); reset.type = "button";
        reset.addEventListener("click", function () { seq = []; chips.forEach(function (c) { c.disabled = false; }); paintSeq(); });
        row.appendChild(reset);
        function paintSeq() { line.innerHTML = seq.length ? seq.map(function (k, i) { return "<span>" + (i + 1) + ". " + it.items[k] + "</span>"; }).join("") : "<em>아직 고른 것이 없습니다</em>"; }
        paintSeq();
        check = function () {
          if (seq.length < it.items.length) return { soft: "모두 차례대로 골라 주세요." };
          for (var i = 0; i < seq.length; i++) if (seq[i] !== i) return (i + 1) + "번째부터 순서가 어긋납니다.";
          return true;
        };
        lock = function () { chips.forEach(function (c) { c.disabled = true; }); reset.disabled = true; };
        auto = function (good) { reset.click(); var o = it.items.map(function (_, i) { return i; }); if (!good) o.reverse(); o.forEach(function (k) { chips.filter(function (c) { return c._k === k; })[0].click(); }); };
      } else if (it.t === "match") {
        var rp = seedPerm(it.id, it.pairs.length);
        var sels = it.pairs.map(function (p, i) {
          var r = el("label", "qz-match", "<span>" + p[0] + "</span>");
          var sel = document.createElement("select");
          sel.innerHTML = "<option value=''>— 고르기 —</option>" + rp.map(function (k) { return "<option value='" + k + "'>" + it.pairs[k][1] + "</option>"; }).join("");
          r.appendChild(sel); box.appendChild(r); return sel;
        });
        check = function () {
          if (sels.some(function (s2) { return s2.value === ""; })) return { soft: "모두 짝을 지어 주세요." };
          var bad = 0; sels.forEach(function (s2, i) { if (it.pairs[+s2.value][1] !== it.pairs[i][1]) bad++; });
          return bad ? bad + "개의 짝이 맞지 않습니다." : true;
        };
        lock = function () { sels.forEach(function (s2) { s2.disabled = true; }); };
        auto = function (good) { sels.forEach(function (s2, i) { s2.value = String(good ? i : (i + 1) % it.pairs.length); }); };
      } else if (it.t === "essay") {
        var ta = document.createElement("textarea"); ta.className = "qz-ta"; ta.rows = 4; ta.maxLength = 600;
        ta.placeholder = "근거를 들어 두세 문장으로 적어 보세요.";
        if (s && s.a) ta.value = s.a;
        box.appendChild(ta);
        var rub = el("div", "qz-rub"); rub.hidden = true; box.appendChild(rub);
        var sub = el("button", "btn primary", "제출하고 모범 답안과 비교하기"); sub.type = "button";
        var fin = el("button", "btn primary", "자기 평가 저장"); fin.type = "button"; fin.hidden = true;
        row.appendChild(sub); row.appendChild(fin); row.appendChild(verdict);
        function openRub() {
          rub.hidden = false; sub.hidden = true; ta.disabled = true;
          var S = state();
          rub.innerHTML = "<div class='qz-model'><b>모범 답안</b> " + it.model + "</div><div class='qz-sub'>내 답에 들어 있는 것을 체크하세요</div>" +
            it.rubric.map(function (r, i) { return "<label class='qz-bogi-i'><input type='checkbox'" + (S.c && S.c.indexOf(i) >= 0 ? " checked" : "") + "> " + r + "</label>"; }).join("");
          if (!S.sc && S.sc !== 0) fin.hidden = false;
        }
        sub.addEventListener("click", function () {
          if (ta.value.trim().length < 15) { verdict.className = "qz-verdict no"; verdict.textContent = "✗ 조금 더 자세히 적어 주세요(15자 이상)."; return; }
          var S = state(); S.a = ta.value.trim().slice(0, 600); save(); verdict.textContent = ""; openRub();
        });
        fin.addEventListener("click", function () {
          var S = state(), boxes = rub.querySelectorAll("input"), c = [];
          Array.prototype.forEach.call(boxes, function (b, i) { if (b.checked) c.push(i); b.disabled = true; });
          S.c = c; S.sc = c.length; fin.hidden = true;
          var need = Math.ceil(it.rubric.length * 2 / 3);
          done(c.length >= need, false);
          verdict.className = "qz-verdict " + (c.length >= need ? "ok" : "no");
          verdict.textContent = "자기 평가 " + c.length + " / " + it.rubric.length + (c.length >= need ? " — 잘 썼습니다" : " — 모범 답안을 참고해 고쳐 써 보세요");
        });
        auto = function () { ta.value = "자동 검사용 답안입니다. 근거를 들어 설명합니다."; sub.click(); Array.prototype.forEach.call(rub.querySelectorAll("input"), function (b) { b.checked = true; }); fin.click(); };
        if (s && s.a) { openRub(); if (s.sc != null) { Array.prototype.forEach.call(rub.querySelectorAll("input"), function (b) { b.disabled = true; }); card.classList.add(s.r ? "ok" : "seen");
          verdict.className = "qz-verdict " + (s.r ? "ok" : "no"); verdict.textContent = "자기 평가 " + s.sc + " / " + it.rubric.length;
          if (it.why) { fb.hidden = false; fb.innerHTML = "<div class='qz-why'><b>해설</b> " + it.why + "</div>"; } } }
      }
      if (check) {
        checkBtn = el("button", "btn primary", "확인"); checkBtn.type = "button";
        checkBtn.addEventListener("click", function () {
          if (card.classList.contains("ok") || card.classList.contains("seen")) return;
          var r = check();
          if (r === true) done(true);
          else if (r && r.soft) { verdict.className = "qz-verdict no"; verdict.textContent = "✗ " + r.soft; }
          else wrong(r);
        });
        row.appendChild(checkBtn); row.appendChild(verdict);
      } else if (it.t !== "essay") row.appendChild(verdict);
      row.appendChild(showBtn);
      card._auto = auto;                                      /* 검수 도구(_tools/quizcheck.js)가 부른다 */
      list.appendChild(card); cards.push(card);

      /* 저장된 상태 되살리기 */
      if (s && it.t !== "essay") {
        if (s.r === 1 || s.sh || s.end) {
          var S0 = s; card.classList.add(s.r === 1 && !s.sh ? "ok" : "seen");
          verdict.className = "qz-verdict " + (s.r === 1 && !s.sh ? "ok" : "no");
          verdict.textContent = s.r === 1 && !s.sh ? "✅ 해결" : (s.sh ? "📖 정답을 확인했습니다" : "✗ 틀렸던 문제 — 해설을 다시 읽어 보세요");
          fb.hidden = false;
          fb.innerHTML = (S0.sh || (it.t === "ox" && S0.r !== 1) ? "<p class='qz-a'><b>정답</b> " + answerText() + "</p>" : "") + (it.why ? "<div class='qz-why'><b>해설</b> " + it.why + "</div>" : "");
          lock(); if (checkBtn) checkBtn.disabled = true;
        } else if (s.n >= 2) showBtn.hidden = false;
      }
    });
    show();
  };
})();
