/* =========================================================================
   근거 카드 토론 (선택 활동) — theme.js · link.js 다음에 불러온다.
   찬반이 갈리는 쟁점에서, 주장마다 실제 자료(그래프·원본·현장)를 근거로 붙인다.
   ① 내 입장 → ② 근거 카드를 열어 ‘이 자료가 보여 주는 것’을 한 줄로, 누구의 주장을 받쳐 주는지 고르기
   → ③ 주장 · 근거 · 근거의 한계 · 예상 반론과 답. 기록은 이 기기에만(sthState), 채점은 없다.

     sthDebate({
       mount: "debate", key: "db1", title: "…", issue: "쟁점 한 줄",
       sides: [{ k: "a", label: "늘려야 한다", say: "…" }, { k: "b", label: "줄여야 한다", say: "…" }],
       cards: [{ id: "c1", title: "에너지원별 사망률", view: 'owid:death-rates-from-energy-production-per-twh|…', hint: "읽을 것" }, …],
       note: "그래프 읽는 요령(선택)"
     });
   카드의 view 는 link.js 의 data-view 값(또는 place: 로 시작하면 data-place 값)이다.
   ========================================================================= */
(function () {
  "use strict";
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  var CSS_DONE = false;
  function css() {
    if (CSS_DONE) return; CSS_DONE = true;
    var st = document.createElement("style");
    st.textContent = ""
      + ".db-box{border:3px dashed var(--line);border-radius:26px;padding:18px 20px 20px;margin:28px 0 8px;background:var(--panel)}"
      + ".db-box .db-tag{display:inline-block;font-size:11.5px;font-weight:900;letter-spacing:.06em;color:var(--violet-700);background:var(--violet-100);border-radius:999px;padding:3px 10px;margin-bottom:6px}"
      + ".db-box h3{margin:2px 0 6px;font-size:18px}"
      + ".db-issue{font-size:15px;font-weight:800;color:var(--ink);margin:4px 0 10px}"
      + ".db-step{font-size:13.5px;font-weight:900;color:var(--ink);margin:16px 0 8px}"
      + ".db-sides{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr));gap:10px}"
      + ".db-side{border:2px solid var(--line);border-radius:16px;padding:10px 14px;background:var(--card);text-align:left;font:inherit;color:var(--ink);cursor:pointer}"
      + ".db-side b{display:block;font-size:14.5px;margin-bottom:4px}.db-side span{font-size:12.5px;color:var(--mist);line-height:1.6}"
      + ".db-side.on{border-color:var(--brand);background:var(--brand-100)}"
      + ".db-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr));gap:10px}"
      + ".db-card{border:2px solid var(--line);border-radius:16px;padding:10px 14px;background:var(--card)}"
      + ".db-card.mine{border-color:var(--brand)}.db-card.other{border-color:var(--coral)}"
      + ".db-card h4{margin:0 0 4px;font-size:14px}.db-card .db-open{font-size:13.5px;margin:2px 0 6px}"
      + ".db-card .db-hint{font-size:12.5px;color:var(--mist);margin:0 0 6px;line-height:1.6}"
      + ".db-card input,.db-box textarea{width:100%;box-sizing:border-box;border:2px solid var(--line);border-radius:10px;padding:7px 10px;font:inherit;font-size:13.5px;background:var(--card-2);color:var(--ink)}"
      + ".db-use{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}.db-use button{font-size:12px;padding:5px 10px}"
      + ".db-use button.on{background:var(--brand);border-color:var(--brand);color:var(--on-accent)}"
      + ".db-use button.on.o{background:var(--coral);border-color:var(--coral)}"
      + ".db-box textarea{min-height:56px;margin:4px 0 8px}"
      + ".db-box label{display:block;font-size:12.5px;font-weight:800;color:var(--mist);margin-top:6px}"
      + ".db-chosen{font-size:13px;color:var(--ink);line-height:1.7;margin:2px 0 6px}"
      + ".db-note{font-size:12.5px;color:var(--mist);line-height:1.7;margin:10px 0 0}";
    document.head.appendChild(st);
  }

  window.sthDebate = function (opt) {
    var mount = document.getElementById(opt.mount);
    if (!mount) return;
    css();
    var SK = "db-" + opt.key;
    var S = (window.sthState && window.sthState(SK)) || {};
    S.c = S.c || {};
    function save() { if (window.sthState) window.sthState(SK, S); paintChosen(); }

    var box = el("div", "db-box");
    box.appendChild(el("span", "db-tag", "선택 활동 · 근거 카드 토론"));
    box.appendChild(el("h3", "display", opt.title));
    box.appendChild(el("p", "db-issue", "쟁점 — " + opt.issue));

    /* ① 내 입장 */
    box.appendChild(el("p", "db-step", "① 지금 내 입장은? (근거를 다 본 뒤 바꿔도 됩니다)"));
    var sides = el("div", "db-sides"), sideBtns = [];
    opt.sides.concat([{ k: "u", label: "아직 정하지 못했다", say: "근거를 먼저 살펴본 뒤 정하겠다" }]).forEach(function (sd) {
      var b = el("button", "db-side"); b.type = "button";
      b.appendChild(el("b", null, sd.label)); b.appendChild(el("span", null, sd.say || ""));
      b.addEventListener("click", function () { S.side = sd.k; save(); paintSides(); });
      b._k = sd.k; sideBtns.push(b); sides.appendChild(b);
    });
    function paintSides() { sideBtns.forEach(function (b) { b.classList.toggle("on", S.side === b._k); }); }
    box.appendChild(sides);

    /* ② 근거 카드 */
    box.appendChild(el("p", "db-step", "② 근거 카드를 열어 실제 자료를 보고, 이 자료가 보여 주는 것을 한 줄로 적으세요"));
    var grid = el("div", "db-cards"), cardEls = {};
    opt.cards.forEach(function (c) {
      var R = S.c[c.id] || (S.c[c.id] = {});
      var d = el("div", "db-card"); cardEls[c.id] = d;
      d.appendChild(el("h4", null, c.title));
      var op = el("p", "db-open"); var sp = document.createElement("span");
      if (/^place:/.test(c.view)) sp.setAttribute("data-place", c.view.slice(6)); else sp.setAttribute("data-view", c.view);
      sp.textContent = c.open || "자료 열기"; op.appendChild(sp); d.appendChild(op);
      if (c.hint) d.appendChild(el("p", "db-hint", "읽을 것: " + c.hint));
      var inp = document.createElement("input"); inp.type = "text"; inp.maxLength = 160; inp.placeholder = "이 자료가 보여 주는 것 (숫자를 직접 읽어 적기)"; inp.value = R.note || "";
      inp.addEventListener("change", function () { R.note = inp.value.trim(); save(); });
      d.appendChild(inp);
      var use = el("div", "db-use");
      [["mine", "내 주장을 받쳐 준다"], ["other", "상대 주장을 받쳐 준다"], ["no", "이 쟁점과 상관없다"]].forEach(function (u) {
        var b = el("button", "btn" + (u[0] === "other" ? " o" : ""), u[1]); b.type = "button";
        b.addEventListener("click", function () { R.use = R.use === u[0] ? null : u[0]; save(); paintCard(c.id); });
        b._u = u[0]; use.appendChild(b);
      });
      d.appendChild(use); grid.appendChild(d);
    });
    function paintCard(id) {
      var d = cardEls[id], R = S.c[id] || {};
      d.classList.toggle("mine", R.use === "mine"); d.classList.toggle("other", R.use === "other");
      Array.prototype.forEach.call(d.querySelectorAll(".db-use button"), function (b) { b.classList.toggle("on", R.use === b._u); });
    }
    box.appendChild(grid);
    if (window.sthLinkScan) window.sthLinkScan(grid);

    /* ③ 주장문 */
    box.appendChild(el("p", "db-step", "③ 근거를 붙여 내 주장을 쓰세요"));
    var chosen = el("div", "db-chosen"); box.appendChild(chosen);
    function field(k, label, ph) {
      var l = el("label", null, label); box.appendChild(l);
      var t = el("textarea"); t.maxLength = 400; t.placeholder = ph; t.value = S[k] || "";
      t.addEventListener("change", function () { S[k] = t.value.trim(); save(); });
      box.appendChild(t);
    }
    field("claim", "내 주장 (한두 문장)", "나는 … 라고 생각한다. 왜냐하면 …");
    field("limit", "내 근거의 한계 — 이 자료로는 말할 수 없는 것", "예: 이 그래프는 세계 평균이라 우리나라 사정은 다를 수 있다");
    field("rebut", "예상되는 반론과 내 답", "상대는 ‘…’ 라는 근거를 들 것이다. 나는 … 라고 답하겠다");
    function paintChosen() {
      var mine = [], other = [];
      opt.cards.forEach(function (c) { var R = S.c[c.id] || {}; var t = c.title + (R.note ? " — " + R.note : " (한 줄을 아직 적지 않음)"); if (R.use === "mine") mine.push(t); else if (R.use === "other") other.push(t); });
      chosen.innerHTML = "";
      chosen.appendChild(el("div", null, "내 주장을 받쳐 주는 근거: " + (mine.length ? mine.join(" / ") : "아직 고르지 않음")));
      chosen.appendChild(el("div", null, "상대 주장을 받쳐 주는 근거(반론에 대비할 것): " + (other.length ? other.join(" / ") : "아직 고르지 않음")));
    }
    var row = el("div", "btn-row"); row.style.marginTop = "6px";
    var cp = el("button", "btn primary", "📋 토론 카드 복사"); cp.type = "button";
    var msg = el("span", "db-note"); msg.style.margin = "0";
    cp.addEventListener("click", function () {
      var side = opt.sides.filter(function (s2) { return s2.k === S.side; })[0];
      var L = ["[근거 카드 토론] " + opt.title, "쟁점: " + opt.issue, "내 입장: " + (side ? side.label : "아직 정하지 못함"), "주장: " + (S.claim || "")];
      opt.cards.forEach(function (c) { var R = S.c[c.id] || {}; if (R.use === "mine" || R.use === "other") L.push((R.use === "mine" ? "· 내 근거 — " : "· 상대 근거 — ") + c.title + (R.note ? ": " + R.note : "")); });
      L.push("근거의 한계: " + (S.limit || ""), "예상 반론과 답: " + (S.rebut || ""));
      var txt = L.join("\n");
      try { navigator.clipboard.writeText(txt); msg.textContent = "복사했습니다. 정리하기나 모둠 게시판에 붙여 넣으세요."; }
      catch (e) { window.prompt("복사하세요", txt); }
    });
    row.appendChild(cp); row.appendChild(msg); box.appendChild(row);
    if (opt.note) { var nt = el("p", "db-note"); nt.innerHTML = opt.note; box.appendChild(nt); }
    mount.appendChild(box);
    paintSides(); opt.cards.forEach(function (c) { paintCard(c.id); }); paintChosen();
  };
})();
