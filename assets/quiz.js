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
   이야기 탭(.episode)이 있는 소단원에는 그 소단원 문제 가운데 기본 2·발전 2개를 ‘소단원 확인 문제’로 이야기 끝에 함께 보여 준다.
   끄려면 sthQuiz({ …, secQuiz: false }).
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
      .replace(/(\d)\.(?=\d)/g, "$1․").replace(/[\s·ㆍ\-_,.()（）'"`~]/g, "").toLowerCase();   /* 숫자 사이 소수점은 남김(․ 로 바꿔 둠) */
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
    var MINI = !!opt.mini;                                   /* 소단원 확인 문제(이야기 탭 끝에 붙는 작은 묶음) */
    var st = opt._st || window.sthState(KEY) || {};
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
      if (MINI) { if (opt.onSave) opt.onSave(); else window.sthState(KEY, st); return; }
      window.sthState(KEY, st);
      var any = items.some(tried);
      var parts = [1, 2, 3].filter(function (l) { return byLv(l).length; }).map(function (l) {
        return LV[l].name + " " + byLv(l).filter(solved).length + "/" + byLv(l).length;
      });
      window.sthState(RES, any ? parts.join(" · ") : null);
      paintTop();
      exPainters.forEach(function (f) { f(); });
    }

    /* ---- 맨 위: 단계 고르기 + 학습 목표별 달성도 ---- */
    var top = el("div", "qz-top");
    var lvRow = el("div", "qz-levels");
    var goal = el("details", "qz-goals");
    var overBox = el("div", "qz-over"); overBox.hidden = true;
    top.appendChild(lvRow); top.appendChild(overBox); top.appendChild(goal);
    var exPainters = [];
    var WK = !MINI && window.STH_WORKED ? window.STH_WORKED : {};
    if (!MINI) mount.appendChild(top);
    else {
      var head = el("div", "qz-mini-head", opt.headHtml || "<b>📝 소단원 확인 문제</b><span>이야기에서 찾아낸 것을 바로 확인해요. 더 많은 문제는 <a href='#quiz' class='qz-go'>수준별 문제</a> 탭에 있어요.</span>");
      if (head.querySelector(".qz-go")) head.querySelector(".qz-go").addEventListener("click", function (e) {
        e.preventDefault();
        var t = Array.prototype.slice.call(document.querySelectorAll(".tab-btn")).filter(function (b) { return /수준별/.test(b.textContent); })[0];
        if (t) { t.click(); window.scrollTo(0, 0); }
      });
      mount.appendChild(head);
    }
    if (!document.getElementById("qz-cf-css")) { var cc = document.createElement("style"); cc.id = "qz-cf-css"; cc.textContent = ".qz-cf{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin:6px 0 8px;font-size:12.5px;color:var(--mist)}.qz-cf-b{font:inherit;font-size:12.5px;font-weight:800;border:1px solid var(--line);border-radius:999px;background:var(--panel);color:var(--ink);padding:3px 11px;cursor:pointer}.qz-cf-b.on{background:var(--brand,#0ea5e9);border-color:var(--brand,#0ea5e9);color:#fff}.qz-cf-b:disabled{cursor:default;opacity:.75}.qz-over{margin:10px 0;padding:10px 14px;border:2px solid var(--line);border-radius:14px;background:var(--card);font-size:13px;color:var(--mist);display:flex;flex-wrap:wrap;gap:4px 10px;align-items:baseline}.qz-over>b{font-family:'Jua',sans-serif;font-weight:400;font-size:16px;color:var(--ink)}.qz-over span b{color:var(--ink)}.qz-over-w{flex-basis:100%;display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-top:4px}.qz-over-b{font:inherit;font-size:12px;font-weight:800;border:1px solid var(--coral-700,#c2410c);color:var(--coral-700,#c2410c);background:var(--panel);border-radius:999px;padding:2px 10px;cursor:pointer}.qz-ex{margin:8px 0 10px;padding:10px 14px;border-left:4px solid var(--amber-700,#b45309);background:var(--panel);border-radius:0 12px 12px 0}.qz-ex-h{display:flex;flex-wrap:wrap;gap:4px 10px;align-items:baseline;font-size:12.5px;color:var(--mist)}.qz-ex-h b{color:var(--ink);font-size:14px}.qz-ex-q{margin:6px 0;font-size:14px}.qz-ex-s{margin:4px 0 0 20px;padding:0;font-size:14px;line-height:1.7}.qz-ex-gap input{width:90px;padding:3px 8px;border:1px solid var(--line);border-radius:8px;font:inherit}.qz-ex-m{font-size:12px;color:var(--mist)}.qz-ex-ok{margin:6px 0 0;font-weight:800;color:var(--green-700,#15803d)}.qz-ex-open{font-size:13px}"; document.head.appendChild(cc); }
    if (!MINI && !document.getElementById("qz-retry-css")) { var rc = document.createElement("style"); rc.id = "qz-retry-css"; rc.textContent = ".qz-retry{margin:0 0 16px;padding:12px 16px;border:2px dashed var(--line);border-radius:18px;background:var(--card)}.qz-retry-h{display:flex;flex-wrap:wrap;gap:4px 10px;align-items:baseline;font-size:13px;color:var(--mist);margin-bottom:8px}.qz-retry-h b{font-family:'Jua',sans-serif;font-weight:400;font-size:17px;color:var(--ink)}.qz-retry-h span b{font-family:inherit;font-size:inherit;color:var(--brand-700)}.qz-retry .sec-quiz,.qz-retry>div>.qz{margin-top:12px}"; document.head.appendChild(rc); }
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
      goal.innerHTML = html + "</ul><p class='qz-note'>1단계에서 80% 이상 풀면 다음 단계를 추천해요. 어느 단계부터 시작해도 괜찮아요.</p>";
      paintOver();
    }
    /* 🎯 내 확신 점검 — 답하기 전에 고른 확신도(확실 2 · 아마 1 · 찍음 0)와 첫 시도 결과를 견준다 */
    function firstOk(x) { return x.r === 1 && !x.n && !x.sh; }
    function ended(x) { return !!x && (x.r === 1 || x.sh || x.end); }
    function paintOver() {
      if (MINI || !overBox) return;
      var C = { 2: [0, 0], 1: [0, 0], 0: [0, 0] }, wrongSure = [];
      items.forEach(function (it) { var x = st[it.id]; if (!x || x.cf == null || !ended(x)) return; C[x.cf][1]++; if (firstOk(x)) C[x.cf][0]++; else if (x.cf === 2) wrongSure.push(it); });
      var tot = C[2][1] + C[1][1] + C[0][1];
      if (!tot) { overBox.hidden = true; return; }
      overBox.hidden = false;
      var nm = { 2: "‘확실’이라고", 1: "‘아마’라고", 0: "‘찍음’이라고" };
      overBox.innerHTML = "<b>🎯 내 확신 점검</b><span>" + [2, 1, 0].filter(function (k) { return C[k][1]; }).map(function (k) { return nm[k] + " 한 " + C[k][1] + "문항 가운데 <b>" + C[k][0] + "</b>문항을 한 번에 맞힘"; }).join(" · ") + "</span>";
      if (wrongSure.length) {
        var w = el("div", "qz-over-w", "<span>⚠️ 확실하다고 했는데 틀린 문항 — 가장 먼저 다시 볼 곳입니다(오늘의 복습에도 먼저 나옵니다):</span>");
        wrongSure.forEach(function (it) {
          var b = el("button", "qz-over-b", it.lv + "단계 " + (items.filter(function (x) { return x.lv === it.lv; }).indexOf(it) + 1) + "번"); b.type = "button";
          b.addEventListener("click", function () { cur = it.lv; st._lv = it.lv; show(); var c = document.getElementById("qz-" + it.id); if (c) c.scrollIntoView({ block: "center", behavior: "smooth" }); });
          w.appendChild(b);
        });
        overBox.appendChild(w);
      } else if (tot >= 3 && C[2][1] && C[2][0] === C[2][1]) overBox.appendChild(el("p", "qz-note", "확실하다고 한 문항은 모두 맞혔어요. 내가 무엇을 아는지 잘 알고 있습니다."));
    }

    var cards = [];
    function show() {
      cards.forEach(function (c) { c.hidden = !MINI && c._item.lv !== cur; });
      var n = 0; cards.forEach(function (c) { if (!c.hidden) c.querySelector(".qz-no").textContent = ++n; });
      paintTop();
    }

    /* ---- 문제 카드 ---- */
    items.forEach(function (it) {
      var s = st[it.id];
      var card = el("section", "qz-card" + (MINI ? " qz-mini" : "")); card._item = it; if (!MINI) card.id = "qz-" + it.id;
      var sec = it.sec && SEC[it.sec] ? it.sec + " · " + SEC[it.sec] : "";
      card.appendChild(el("div", "qz-head",
        "<span class='qz-no'></span><span class='qz-type'>" + TYPE[it.t] + "</span>" +
        (sec ? "<span class='qz-sec'>" + sec + "</span>" : "") +
        (it.std ? "<span class='qz-std' title='" + (STD[it.std] || "").replace(/'/g, "’") + "'>" + it.std + "</span>" : "")));
      card.appendChild(el("div", "qz-q", String(it.q)
        .replace(/\(\s{2,}\)/g, "<span class='qz-gap'>&nbsp;</span>")
        .replace(/\(\s*([가나다라마])\s*\)/g, "<span class='qz-gap'>$1</span>")));
      if (it.fig) card.appendChild(el("div", "qz-fig", it.fig));
      var ex = WK[it.id] && it.t === "num" ? WK[it.id] : null, exBox = null;
      if (ex) { exBox = el("div", "qz-ex"); card.appendChild(exBox); exPainters.push(paintEx); }
      var cf = null;
      if (!opt.noConf && it.t !== "essay") {
        cf = el("div", "qz-cf", "<span>답하기 전에 — 얼마나 확실해요?</span>");
        [[2, "확실"], [1, "아마"], [0, "찍음"]].forEach(function (pr) {
          var cb = el("button", "qz-cf-b", pr[1]); cb.type = "button"; cb.setAttribute("data-v", pr[0]);
          cb.addEventListener("click", function () { var S = state(); if (S.end || S.r === 1 || S.n || S.sh) return; S.cf = pr[0]; paintCf(); save(); });
          cf.appendChild(cb);
        });
        card.appendChild(cf);
      }
      function paintCf() {
        if (!cf) return;
        var S = st[it.id] || {}, lockd = !!(S.end || S.r === 1 || S.n || S.sh);
        Array.prototype.forEach.call(cf.querySelectorAll("button"), function (b) { b.classList.toggle("on", +b.getAttribute("data-v") === S.cf); b.disabled = lockd; });
        cf.hidden = lockd && S.cf == null;
      }
      /* 풀이 예제: 계산 문항을 처음 풀 때는 쌍둥이 문제의 풀이를 다 보여 주고, 하나를 끝내면 다음엔 마지막 줄을 비우고, 그다음부터는 접어 둔다 */
      var exOpen = false, exDone = false;
      function paintEx() {
        if (!ex) return;
        var k = 0; items.forEach(function (x) { if (x !== it && x.t === "num" && WK[x.id] && ended(st[x.id])) k++; });
        var mine = ended(st[it.id]), mode = mine ? "fold" : (k === 0 ? "full" : (k === 1 ? "fade" : "fold"));
        if (exOpen) mode = "full";
        var steps = ex.steps || [], head = "<div class='qz-ex-h'><b>💡 풀이 예제</b><span>숫자만 다른 쌍둥이 문제입니다. 같은 방법으로 아래 문제를 풀어 보세요.</span></div><p class='qz-ex-q'>" + ex.q + "</p>";
        if (mode === "fold") {
          exBox.innerHTML = "";
          var ob = el("button", "btn qz-ex-open", "💡 풀이 예제 보기"); ob.type = "button";
          ob.addEventListener("click", function () { exOpen = true; paintEx(); });
          exBox.appendChild(ob); return;
        }
        if (mode === "full" || exDone) { exBox.innerHTML = head + "<ol class='qz-ex-s'>" + steps.map(function (x) { return "<li>" + x + "</li>"; }).join("") + "</ol>"; return; }
        exBox.innerHTML = head + "<ol class='qz-ex-s'>" + steps.slice(0, -1).map(function (x) { return "<li>" + x + "</li>"; }).join("") + "<li class='qz-ex-gap'>= <input type='text' inputmode='decimal' autocomplete='off'> " + (ex.unit || "") + " <button type='button' class='btn'>확인</button> <span class='qz-ex-m'>마지막 줄은 직접 채워 보세요.</span></li></ol>";
        var gi = exBox.querySelector("input"), gb = exBox.querySelector(".qz-ex-gap button"), gm = exBox.querySelector(".qz-ex-m");
        function chk() { var v = num(gi.value); if (isNaN(v)) { gm.textContent = "숫자로 적어 주세요."; return; } if (Math.abs(v - ex.a) <= Math.abs(ex.a) * 0.01 + 1e-9) { exDone = true; paintEx(); exBox.appendChild(el("p", "qz-ex-ok", "✓ 맞았습니다. 이제 아래 문제를 혼자 풀어 보세요.")); } else gm.textContent = "다시 계산해 보세요. 위 줄의 식을 그대로 이어 가면 됩니다."; }
        gb.addEventListener("click", chk); gi.addEventListener("keydown", function (e) { if (e.key === "Enter") chk(); });
      }
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
        save(); paintCf();
      }
      function wrong(msg) {
        var S = state(); S.n = (S.n || 0) + 1; save(); paintCf();
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
        var mix = it.t === "mc" && window.sthShuffle ? window.sthShuffle(opts, it.id + "|" + it.q, it.keepOrder || window.sthHasRef([it.why, it.hint, it.q])) : null;
        var pos = []; (mix ? mix.order : opts.map(function (x, i) { return i; })).forEach(function (o, k) { pos[o] = k; });
        var btns = opts.map(function (o, i) {
          var b = el("button", "opt", it.t === "mc" ? "<span class='qz-k'>" + "①②③④⑤"[pos[i]] + "</span> " + o : o); b.type = "button"; b.setAttribute("data-i", i);
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
          return b;
        });
        (mix ? mix.order : btns.map(function (x, i) { return i; })).forEach(function (o) { wrap.appendChild(btns[o]); });
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
      paintCf(); paintEx();
    });
    show();
    if (!MINI) retry();
    if (!MINI && opt.secQuiz !== false) secQuiz();

    /* ---- 🔁 다시 풀기(인출 연습): 처음에 틀린(또는 해설부터 본) 문항, 우리 반이 많이 틀린 문항을 며칠 뒤 다시 푼다.
       풀이는 따로(KEY + "Retry") 적어, 첫 시도 기록(수업 효과·달성도)은 그대로 둔다. ---- */
    function retry() {
      var RK = KEY + "Retry", rst = window.sthState(RK) || {};
      var wrap = el("div", "qz-retry"); mount.insertBefore(wrap, list);
      var hdr = el("div"); wrap.appendChild(hdr);
      var area = el("div"); area.id = (mount.id || "quiz") + "-retry-q"; wrap.appendChild(area);
      var cls = null;
      function firstMiss(x) { return !!x && (x.r === 1 || x.n || x.sh) && !(x.r === 1 && !x.n && !x.sh); }
      function mine() { return items.filter(function (it) { return firstMiss(st[it.id]); }); }
      function round(list2, label) {
        list2.forEach(function (it) { delete rst[it.id]; });
        window.sthState(RK, rst);
        area.innerHTML = "";
        window.sthQuiz({ mount: area.id, key: RK, mini: true, noConf: true, _st: rst, items: list2, onSave: function () { window.sthState(RK, rst); paintR(); },
          headHtml: "<b>🔁 " + label + "</b><span>정답을 보기 전에 먼저 떠올려 보세요. 여기서 푼 것은 처음 기록을 바꾸지 않습니다.</span>" });
        area.scrollIntoView({ block: "start", behavior: "smooth" });
      }
      function paintR() {
        var m = mine(), done = Object.keys(rst).filter(function (id) { var x = rst[id]; return x && (x.r === 1 || x.n || x.sh); });
        var ok = done.filter(function (id) { var x = rst[id]; return x.r === 1 && !x.n && !x.sh; }).length;
        var h = "<div class='qz-retry-h'><b>🔁 다시 풀기</b><span>처음에 틀린 문항을 며칠 뒤 다시 떠올리면 훨씬 오래 남습니다." +
          (done.length ? " 지금까지 다시 푼 " + done.length + "문항 가운데 <b>" + ok + "문항</b>을 한 번에 맞혔어요." : "") + "</span></div><div class='btn-row qz-retry-b'></div>";
        hdr.innerHTML = h;
        var row = hdr.querySelector(".qz-retry-b");
        var b1 = el("button", "btn", "내가 처음 틀린 문항 (" + m.length + ")"); b1.type = "button"; b1.disabled = !m.length;
        b1.addEventListener("click", function () { round(m, "내가 처음 틀린 문항 다시 풀기"); });
        row.appendChild(b1);
        if (cls && cls.length) {
          var b2 = el("button", "btn", "우리 반이 많이 틀린 문항 (" + cls.length + ")"); b2.type = "button";
          b2.addEventListener("click", function () { round(cls, "우리 반이 처음에 많이 틀린 문항"); });
          row.appendChild(b2);
        }
        if (!m.length && !(cls && cls.length)) row.appendChild(el("span", "qz-note", "아직 처음에 틀린 문항이 없습니다. 문제를 풀고 나서 며칠 뒤에 다시 와 보세요."));
      }
      paintR();
      /* 우리 반이 많이 틀린 문항 — 반 코드·별명을 저장했고 공유가 켜져 있을 때만(별명 없이 문항별 인원만 받는다) */
      try {
        var me = JSON.parse(localStorage.getItem("sth-me") || "{}"), url = String(window.STH_SHARE_URL || "").trim(), hosts = window.STH_SHARE_HOSTS;
        if (url && hosts && hosts.length && hosts.indexOf(location.hostname) < 0 && location.protocol !== "file:") url = "";
        var uid = window.sthUnitId ? window.sthUnitId() : "";
        if (url && me.cls && uid) fetch(url + "?action=classmiss&cls=" + encodeURIComponent(me.cls) + "&unit=" + encodeURIComponent(uid))
          .then(function (r) { return r.json(); })
          .then(function (j) {
            if (!j.ok) return;
            var by = {}; items.forEach(function (it) { by[it.id] = it; });
            cls = (j.items || []).filter(function (x) { return by[x.id] && x.n >= 2; }).slice(0, 5).map(function (x) { return by[x.id]; });
            paintR();
          }).catch(function () {});
      } catch (e) {}
    }

    /* ---- 소단원 확인 문제: 이야기 탭마다 그 소단원(sec) 문제 가운데 기본 2·발전 2개를 이야기 끝에 붙인다.
       풀이 기록은 수준별 문제와 같은 곳에 저장되어, 어디서 풀든 달성도에 함께 셈된다. ---- */
    function secQuiz() {
      if (!document.getElementById("qz-mini-css")) {
        var css = document.createElement("style"); css.id = "qz-mini-css";
        css.textContent = ".sec-quiz{margin:24px 0 8px;padding:16px 18px 6px;border:2px dashed var(--line);border-radius:18px;background:var(--card)}" +
          ".qz-mini-head{display:flex;flex-wrap:wrap;gap:4px 10px;align-items:baseline;margin:0 2px 12px}" +
          ".qz-mini-head b{font-family:'Jua',sans-serif;font-weight:400;font-size:18px;color:var(--ink)}" +
          ".qz-mini-head span{font-size:12.5px;color:var(--mist)}.qz-mini-head a{color:var(--brand-700);font-weight:800}";
        document.head.appendChild(css);
      }
      Array.prototype.forEach.call(document.querySelectorAll(".tab-btn"), function (b) {
        var n = b.querySelector(".num"); if (!n) return;
        var sec = n.textContent.trim();
        var panel = document.querySelector('.tab-panel[data-panel="' + b.getAttribute("data-tab") + '"]');
        if (!panel || panel.querySelector(".sec-quiz")) return;
        var epi = panel.querySelectorAll(".episode"); if (!epi.length) return;
        var pick = [];
        [1, 2].forEach(function (l) { pick = pick.concat(items.filter(function (it) { return it.sec === sec && it.lv === l; }).slice(0, 2)); });
        if (!pick.length) return;
        var box = el("div", "sec-quiz"); box.id = "secq-" + sec;
        var last = epi[epi.length - 1]; last.parentNode.insertBefore(box, last.nextSibling);
        window.sthQuiz({ mount: box.id, key: KEY, mini: true, _st: st, items: pick, onSave: save });
      });
    }
  };
})();
