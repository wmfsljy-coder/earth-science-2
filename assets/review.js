/* =========================================================================
   🧠 오늘의 복습 — 간격 두고 다시 꺼내기 + 섞어 풀기. quiz.js 다음에 불러온다.

   - 수준별 문제에서 한 번 손댄 문항이, 같은 과목의 다른 단원 문항과 섞여 며칠 뒤 다시 나온다.
     처음에 틀린 문항은 하루 뒤, 맞힌 문항은 사흘 뒤. 다시 풀 때 바로 떠올리면 다음 간격이 길어지고
     (1 → 3 → 7 → 14 → 30 → 60일), 틀리면 다음 날 다시 나온다(라이트너 상자).
   - 문제는 /science-teacher-hub/assets/review-<묶음>.js (make_review_bank.js 가 만든 은행)에서 읽는다.
   - 기록은 localStorage 'sth-rv-<묶음>' = { s: { rv: { "단원.문항": { b: 상자, d: 다음 날(ms), n: 푼 횟수, k: 바로 떠올린 횟수 } } } }.
     로그인한 학생은 account.js 가 이 기록도 함께 올린다(다른 기기에서 이어서).
   - 수준별 문제 탭 맨 위에 붙고, 탭 단추에 오늘 할 문항 수를 작게 보인다.
   ========================================================================= */
(function () {
  "use strict";
  var DAY = 864e5, GAP = [1, 3, 7, 14, 30, 60], PER = 3;
  var UID = window.sthUnitId ? window.sthUnitId() : "";
  if (!UID || UID === "unit") return;
  var GRP = UID.replace(/[0-9]*-.*$/, "").replace(/[0-9]+$/, "");
  var RK = "sth-rv-" + GRP;
  var quiz = document.getElementById("quiz");
  if (!quiz || !window.sthQuiz) return;

  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function get(k) { try { return JSON.parse(localStorage.getItem(k) || "{}"); } catch (e) { return {}; } }
  function load() { var o = get(RK); o.s = o.s || {}; o.w = o.w || {}; o.s.rv = o.s.rv || {}; return o; }
  function save(o) {
    try { localStorage.setItem(RK, JSON.stringify(o)); } catch (e) {}
    if (window.sthOnStore) { try { window.sthOnStore(RK); } catch (e) {} }
  }
  function md(t) { var d = new Date(t); return (d.getMonth() + 1) + "월 " + d.getDate() + "일"; }
  function today0() { var d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); }

  /* ---- 문제 은행 ---- */
  var BANK = null, waiters = [];
  function bank(cb) {
    if (BANK) return cb(BANK);
    waiters.push(cb); if (waiters.length > 1) return;
    var s = document.createElement("script");
    s.src = "/science-teacher-hub/assets/review-" + GRP + ".js";
    s.onload = function () { BANK = (window.STH_REVIEW_BANK || {})[GRP] || { units: {}, items: [] }; var w = waiters; waiters = []; w.forEach(function (f) { f(BANK); }); };
    s.onerror = function () { BANK = { units: {}, items: [] }; var w = waiters; waiters = []; w.forEach(function (f) { f(BANK); }); };
    document.head.appendChild(s);
  }

  /* ---- 수준별 문제에서 손댄 문항을 상자에 넣는다(처음 한 번) ---- */
  function seed(B, R) {
    var now = Date.now(), added = 0, by = {};
    B.items.forEach(function (it) { (by[it.u] || (by[it.u] = {}))[it.id] = 1; });
    Object.keys(B.units).forEach(function (u) {
      var q = ((get("sth-" + u).s || {}).quiz) || {};
      Object.keys(q).forEach(function (id) {
        var x = q[id] || {}, key = u + "." + id;
        if (!by[u] || !by[u][id] || R.s.rv[key]) return;
        if (!(x.r === 1 || x.n || x.sh)) return;
        var first = x.r === 1 && !x.n && !x.sh;
        R.s.rv[key] = { b: first ? 1 : 0, d: today0() + (first ? 3 : 1) * DAY, n: 0, k: 0 };
        if (!first && x.cf === 2) R.s.rv[key].o = 1;          /* 확실하다고 했는데 틀린 문항 — 먼저 낸다 */
        added++;
      });
    });
    return added;
  }
  function due(B, R) {
    var now = Date.now(), byKey = {}, list = [];
    B.items.forEach(function (it) { byKey[it.u + "." + it.id] = it; });
    Object.keys(R.s.rv).forEach(function (k) { var x = R.s.rv[k]; if (byKey[k] && x.d <= now) list.push({ k: k, it: byKey[k], x: x }); });
    list.sort(function (a, b) { return (b.x.o ? 1 : 0) - (a.x.o ? 1 : 0) || a.x.d - b.x.d || a.x.b - b.x.b; });
    return list;
  }
  /* 섞어 풀기: 단원을 번갈아 고르고, 지금 단원이 아닌 것부터 */
  function pick(list, n) {
    var groups = {}, order = [];
    list.forEach(function (o) { if (!groups[o.it.u]) { groups[o.it.u] = []; order.push(o.it.u); } groups[o.it.u].push(o); });
    order.sort(function (a, b) { return (a === UID) - (b === UID); });
    var out = [];
    while (out.length < n && order.some(function (u) { return groups[u].length; })) order.forEach(function (u) { if (out.length < n && groups[u].length) out.push(groups[u].shift()); });
    return out;
  }
  function nextDue(R) { var m = null, c = 0; Object.keys(R.s.rv).forEach(function (k) { var d = R.s.rv[k].d; if (d > Date.now() && (m === null || d < m)) m = d; }); if (m !== null) { var day = new Date(m); day.setHours(0, 0, 0, 0); Object.keys(R.s.rv).forEach(function (k) { var d = new Date(R.s.rv[k].d); d.setHours(0, 0, 0, 0); if (d.getTime() === day.getTime()) c++; }); } return m === null ? null : { t: m, n: c }; }

  /* ---- 화면 ---- */
  if (!document.getElementById("rv-css")) {
    var css = document.createElement("style"); css.id = "rv-css";
    css.textContent = ".rv-box{margin:0 0 18px;padding:14px 18px;border:2px solid var(--brand,#0ea5e9);border-radius:18px;background:var(--card)}"
      + ".rv-h{display:flex;flex-wrap:wrap;gap:4px 12px;align-items:baseline}.rv-h b{font-family:'Jua',sans-serif;font-weight:400;font-size:19px;color:var(--ink)}"
      + ".rv-h span{font-size:13px;color:var(--mist)}.rv-boxes{display:flex;gap:6px;margin:10px 0 4px;flex-wrap:wrap}"
      + ".rv-boxes i{font-style:normal;font-size:12px;font-weight:800;padding:3px 9px;border-radius:999px;background:var(--panel);color:var(--mist);border:1px solid var(--line)}"
      + ".rv-boxes i.on{color:var(--ink)}.rv-unit{display:inline-block;font-size:11.5px;font-weight:800;color:var(--brand-700,#0369a1);background:var(--panel);border:1px solid var(--line);border-radius:999px;padding:1px 8px;margin-right:6px;vertical-align:1px}"
      + ".rv-done{margin:10px 0 2px;font-weight:800;color:var(--ink)}.rv-tag{display:inline-block;margin-left:6px;font-size:11px;font-weight:900;color:#fff;background:var(--coral-700,#c2410c);border-radius:999px;padding:0 7px;vertical-align:2px}"
      + ".rv-box .sec-quiz,.rv-box>div>.qz{margin-top:12px}";
    document.head.appendChild(css);
  }
  var box = el("div", "rv-box"); quiz.parentNode.insertBefore(box, quiz);
  var tabBtn = null;
  Array.prototype.forEach.call(document.querySelectorAll(".tab-btn"), function (b) { if (/수준별 문제/.test(b.textContent)) tabBtn = b; });

  var session = null;      /* 지금 풀고 있는 묶음 */
  function paint() {
    bank(function (B) {
      var R = load(); if (seed(B, R)) save(R);
      var D = due(B, R), total = Object.keys(R.s.rv).length;
      if (tabBtn) { var old = tabBtn.querySelector(".rv-tag"); if (old) old.remove(); if (D.length) tabBtn.appendChild(el("span", "rv-tag", "🧠" + D.length)); }
      if (session) return;
      var cnt = [0, 0, 0, 0, 0, 0]; Object.keys(R.s.rv).forEach(function (k) { cnt[Math.min(5, R.s.rv[k].b || 0)]++; });
      var h = "<div class='rv-h'><b>🧠 오늘의 복습</b><span>며칠 전에 배운 것을 다시 떠올리면 오래 남습니다. 같은 과목의 다른 단원 문제도 섞여 나와요.</span></div>";
      if (total) h += "<div class='rv-boxes'>" + ["하루 뒤", "3일 뒤", "1주 뒤", "2주 뒤", "한 달 뒤", "두 달 뒤"].map(function (t, i) { return "<i class='" + (cnt[i] ? "on" : "") + "'>" + t + " " + cnt[i] + "</i>"; }).join("") + "</div>";
      box.innerHTML = h;
      var row = el("div", "btn-row"); box.appendChild(row);
      if (D.length) {
        var go = el("button", "btn primary", "오늘의 " + Math.min(PER, D.length) + "문제 풀기" + (D.length > PER ? " (남은 " + D.length + ")" : "")); go.type = "button";
        go.addEventListener("click", function () { start(B, pick(D, PER)); });
        row.appendChild(go);
      } else {
        var nx = nextDue(R);
        row.appendChild(el("span", "qz-note", !total ? "아래 수준별 문제를 풀면, 며칠 뒤 이곳에 다시 나와요." : "오늘은 복습할 문제가 없어요." + (nx ? " 다음 복습: <b>" + md(nx.t) + "</b> (" + nx.n + "문제)" : "")));
      }
    });
  }
  function start(B, list) {
    var R = load(), st = {}, map = {};
    var items = list.map(function (o, i) {
      var it = JSON.parse(JSON.stringify(o.it)), nid = "rv" + i + "_" + it.id;
      map[nid] = o.k;
      it.id = nid; delete it.u;
      it.q = "<span class='rv-unit'>" + (B.units[o.it.u] || o.it.u) + "</span>" + it.q;
      return it;
    });
    session = { left: items.length, ok: 0 };
    box.innerHTML = "<div class='rv-h'><b>🧠 오늘의 복습</b><span>정답을 보기 전에 먼저 떠올려 보세요.</span></div>";
    var area = el("div"); area.id = "rv-q"; box.appendChild(area);
    var recorded = {};
    window.sthQuiz({ mount: "rv-q", key: "rvTmp", mini: true, noConf: true, _st: st, items: items,
      headHtml: "<b>📝 " + items.length + "문제</b><span>여기서 푼 것은 수준별 문제 기록을 바꾸지 않습니다.</span>",
      onSave: function () {
        var R2 = load(), changed = false;
        Object.keys(st).forEach(function (nid) {
          var x = st[nid]; if (!x || recorded[nid] || !map[nid]) return;
          if (!(x.r === 1 || x.sh || x.end)) return;
          recorded[nid] = 1;
          var first = x.r === 1 && !x.n && !x.sh, e = R2.s.rv[map[nid]] || { b: 0, n: 0, k: 0 };
          e.b = first ? Math.min(5, (e.b || 0) + 1) : 0; if (first) delete e.o;
          e.d = today0() + GAP[e.b] * DAY; e.n = (e.n || 0) + 1; if (first) { e.k = (e.k || 0) + 1; session.ok++; }
          R2.s.rv[map[nid]] = e; changed = true; session.left--;
        });
        if (changed) save(R2);
        if (session.left <= 0) finish(B);
      } });
  }
  function finish(B) {
    var s = session; session = null;
    var R = load(), D = due(B, R);
    var msg = el("p", "rv-done", "오늘 복습 끝! " + (s.ok ? s.ok + "문제를 바로 떠올렸어요. 그 문제는 더 긴 간격 뒤에 다시 나옵니다." : "틀린 문제는 내일 다시 나옵니다. 해설을 한 번 더 읽어 두세요."));
    box.appendChild(msg);
    var row = el("div", "btn-row"); box.appendChild(row);
    if (D.length) { var more = el("button", "btn", "🧠 " + Math.min(PER, D.length) + "문제 더"); more.type = "button"; more.addEventListener("click", function () { start(B, pick(D, PER)); }); row.appendChild(more); }
    var back = el("button", "btn", "닫기"); back.type = "button"; back.addEventListener("click", paint); row.appendChild(back);
    if (tabBtn) { var old = tabBtn.querySelector(".rv-tag"); if (old) old.remove(); if (D.length) tabBtn.appendChild(el("span", "rv-tag", "🧠" + D.length)); }
  }

  paint();
  window.addEventListener("tab-shown", function () { if (!box.closest("[hidden]")) paint(); });
  window.addEventListener("sth-pulled", function (e) { if (e.detail === "rv-" + GRP) paint(); });
})();
