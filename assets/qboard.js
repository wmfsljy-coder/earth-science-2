/* =========================================================================
   ❓ 궁금한 것 게시판 — 단원을 시작하며 궁금해진 것을 우리 반이 함께 모으고, 끝에서 다시 본다.
   episodes.js 다음에 불러온다. 뒷단은 community.gs (qAdd · qList · qMark).

   - 첫 이야기 탭의 첫 이야기 끝: 궁금한 것 한 줄 남기기 + 우리 반 질문(이름 없이)에 ‘나도 궁금해요’.
   - 정리하기 탭 맨 위: 같은 질문 목록에서 ‘이제 답할 수 있어요’를 누른다 → 해결한 질문 / 아직 남은 질문.
   - 선생님은 선생님 화면(class/)에서 질문을 모아 보고, 알맞지 않은 글은 숨긴다.
   누구인지: ‘우리 반’에 저장한 반·별명, 없으면 로그인(‘@학번’ + 토큰).
   ========================================================================= */
(function () {
  "use strict";
  var UID = window.sthUnitId ? window.sthUnitId() : "";
  if (!UID || UID === "unit") return;

  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function url() {
    var u = String(window.STH_SHARE_URL || "").trim(), h = window.STH_SHARE_HOSTS;
    if (u && h && h.length && h.indexOf(location.hostname) < 0 && location.protocol !== "file:") u = "";
    return u;
  }
  function me() {
    var m = {}; try { m = JSON.parse(localStorage.getItem("sth-me") || "{}"); } catch (e) {}
    if (m.cls && m.nick) return { cls: m.cls, nick: m.nick };
    return window.sthAccount && window.sthAccount.ident ? window.sthAccount.ident(UID) : null;
  }
  function call(body) {
    var who = me(); body.cls = who.cls; body.nick = who.nick; body.t = who.t || ""; body.unit = UID;
    return fetch(url(), { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(body) })
      .then(function (r) { return r.json(); });
  }

  /* 붙일 자리: 첫 이야기(.episode)가 든 탭의 첫 이야기 끝, 정리하기 탭(#wk 앞) */
  var firstEp = document.querySelector(".tab-panel .episode");
  var wk = document.getElementById("wk");
  if (!firstEp && !wk) return;

  if (!document.getElementById("qb-css")) {
    var css = document.createElement("style"); css.id = "qb-css";
    css.textContent = ".qb{margin:22px 0 10px;padding:16px 18px;border:2px dashed var(--line);border-radius:18px;background:var(--card)}"
      + ".qb h4{margin:0 0 4px;font-family:'Jua',sans-serif;font-weight:400;font-size:19px}.qb .qb-sub{font-size:13px;color:var(--mist);margin:0 0 10px}"
      + ".qb-in{display:flex;gap:8px;flex-wrap:wrap}.qb-in input{flex:1;min-width:200px;padding:8px 12px;border:1px solid var(--line);border-radius:12px;font:inherit;background:var(--panel);color:var(--ink)}"
      + ".qb-list{list-style:none;margin:12px 0 0;padding:0}.qb-list li{display:flex;gap:10px;align-items:center;justify-content:space-between;border-top:1px solid var(--line);padding:8px 2px;font-size:14.5px}"
      + ".qb-list li span.t{flex:1}.qb-list li.solved span.t{color:var(--mist)}.qb-list li em{font-style:normal;font-size:11.5px;font-weight:800;color:var(--brand-700,#0369a1);margin-left:6px}"
      + ".qb-list button{flex:none;font:inherit;font-size:12.5px;font-weight:800;border:1px solid var(--line);border-radius:999px;background:var(--panel);color:var(--ink);padding:4px 10px;cursor:pointer}"
      + ".qb-list button.on{background:var(--teal,#14b8a6);border-color:var(--teal,#14b8a6);color:#fff}.qb-msg{font-size:13px;color:var(--mist)}.qb-sum{font-weight:800;margin:6px 0 0}";
    document.head.appendChild(css);
  }
  var A = firstEp ? el("div", "qb") : null, B = wk ? el("div", "qb") : null;
  if (A) firstEp.parentNode.insertBefore(A, firstEp.nextSibling);
  if (B) wk.parentNode.insertBefore(B, wk);

  var ITEMS = null, ERR = "";
  function head(box, end) {
    box.innerHTML = end
      ? "<h4>❓ 우리 반 질문 돌아보기</h4><p class='qb-sub'>단원을 시작할 때 우리 반이 궁금해한 것들입니다. 이제 답할 수 있는 질문에 <b>✓ 이제 답할 수 있어요</b>를 누르고, 아직 남은 질문은 선생님께 가져가세요.</p>"
      : "<h4>❓ 궁금한 것 게시판</h4><p class='qb-sub'>이야기를 시작하며 궁금해진 것을 한 줄로 남겨 주세요. 이름 없이 우리 반에 보이고, 같은 것이 궁금하면 <b>🙋 나도</b>를 누르면 됩니다. 단원 끝(정리하기)에서 다시 봅니다.</p>";
  }
  function paint() {
    [A, B].forEach(function (box, bi) {
      if (!box) return;
      var end = bi === 1; head(box, end);
      if (!url()) { box.appendChild(el("p", "qb-sub", "선생님이 아직 공유 기능을 켜지 않았습니다.")); return; }
      if (!me()) { box.appendChild(el("p", "qb-sub", "‘우리 반’ 탭에서 반과 별명을 저장하거나 로그인하면 쓸 수 있어요.")); return; }
      if (!end) {
        var row = el("div", "qb-in"), inp = el("input"); inp.maxLength = 160; inp.placeholder = "예: 왜 하필 이 단위를 기준으로 정했을까?";
        var add = el("button", "btn primary", "남기기"); add.type = "button"; var msg = el("span", "qb-msg");
        function send() {
          var t = inp.value.trim(); if (t.length < 5) { msg.textContent = "5자 이상 써 주세요."; return; }
          add.disabled = true; msg.textContent = "보내는 중…";
          call({ action: "qAdd", text: t }).then(function (j) { if (!j.ok) throw new Error(j.error || "오류"); ITEMS = j.items || []; inp.value = ""; paint(); })
            .catch(function (e) { msg.textContent = "보내지 못했습니다 (" + e.message + ")"; add.disabled = false; });
        }
        add.addEventListener("click", send); inp.addEventListener("keydown", function (e) { if (e.key === "Enter") send(); });
        row.appendChild(inp); row.appendChild(add); row.appendChild(msg); box.appendChild(row);
      }
      if (ERR) { box.appendChild(el("p", "qb-msg", ERR)); return; }
      if (!ITEMS) { box.appendChild(el("p", "qb-msg", "불러오는 중…")); return; }
      if (!ITEMS.length) { box.appendChild(el("p", "qb-msg", end ? "이 단원에서 우리 반이 남긴 질문이 없습니다." : "아직 우리 반 질문이 없습니다. 첫 질문을 남겨 보세요.")); return; }
      var list = ITEMS.slice().sort(function (x, y) { return (y.same - x.same) || (x.t - y.t); });
      if (end) {
        var done = list.filter(function (q) { return q.solved > 0 && q.solved >= Math.max(1, Math.ceil((q.same + 1) / 2)); }).length;
        box.appendChild(el("p", "qb-sum", "해결한 질문 " + done + " · 아직 남은 질문 " + (list.length - done)));
      }
      var ul = el("ul", "qb-list");
      list.forEach(function (q) {
        var solvedNow = q.solved > 0 && q.solved >= Math.max(1, Math.ceil((q.same + 1) / 2));
        var li = el("li", end && solvedNow ? "solved" : "");
        li.appendChild(el("span", "t", esc(q.text) + (q.mine ? "<em>내 질문</em>" : "")));
        var b = el("button", end ? (q.meSolved ? "on" : "") : (q.meSame ? "on" : ""), end ? "✓ 이제 답할 수 있어요 " + q.solved : "🙋 나도 " + (q.same + 1)); b.type = "button";
        if (!end && q.mine) b.disabled = true;
        b.addEventListener("click", function () {
          b.disabled = true;
          call({ action: "qMark", id: q.id, kind: end ? "solved" : "same", on: end ? !q.meSolved : !q.meSame })
            .then(function (j) { if (!j.ok) throw new Error(j.error || "오류"); ITEMS = j.items || []; paint(); })
            .catch(function () { b.disabled = false; });
        });
        li.appendChild(b); ul.appendChild(li);
      });
      box.appendChild(ul);
    });
  }
  function load() {
    if (!url() || !me()) { paint(); return; }
    call({ action: "qList" }).then(function (j) { if (!j.ok) throw new Error(j.error || "오류"); ITEMS = j.items || []; ERR = ""; paint(); })
      .catch(function (e) { ERR = "지금은 불러올 수 없습니다 (" + e.message + ")."; paint(); });
  }
  paint();
  var last = 0;
  function maybe() { var vis = [A, B].some(function (x) { return x && !x.closest("[hidden]"); }); if (vis && Date.now() - last > 20000) { last = Date.now(); load(); } }
  window.addEventListener("tab-shown", maybe);
  maybe();
})();
