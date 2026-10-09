/* =========================================================================
   🔁 익명 돌려 읽기 — 정리하기의 ‘한 문장’을 이름 없이 서로 읽고 평가한다. share.js 다음에 불러온다.

   1) 내 글 내기: 학생이 단추를 눌렀을 때만 그 글을 올린다(peerPut). 다시 내면 고친 글로 바뀐다.
   2) 친구 글 두 편 받기(peerGet): 평가를 적게 받은 글부터, 내 글과 이미 평가한 글은 빼고. 이름은 오지 않는다.
   3) 평가(peerRate): 점검 세 가지 + 좋은 점·고칠 점 한 줄씩.
   4) 내 글이 받은 평가: 점검별 인원과 친구들의 한 줄(누가 썼는지는 보이지 않는다).
   누구인지: ‘우리 반’에 저장한 반·별명, 없으면 로그인(‘@학번’ + 토큰). 뒷단은 community.gs.
   ========================================================================= */
(function () {
  "use strict";
  var UID = window.sthUnitId ? window.sthUnitId() : "";
  var CFG = window.STH_SHARE_LINE || null;
  var host = CFG && document.getElementById(CFG.mount);
  if (!UID || !host) return;
  var FIELD = CFG.id || "all", LABEL = CFG.label || "한 문장";
  var RUBRIC = ["핵심 개념어를 바르게 썼다", "이야기(사례)와 이어서 설명했다", "까닭이나 근거가 들어 있다"];

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
    var li = window.sthAccount && window.sthAccount.ident ? window.sthAccount.ident(UID) : null;
    return li || null;
  }
  function myText() { try { return String(((JSON.parse(localStorage.getItem("sth-" + UID) || "{}").w || {})[FIELD]) || "").replace(/\s+/g, " ").trim(); } catch (e) { return ""; } }
  function call(body) {
    var who = me(); body.cls = who.cls; body.nick = who.nick; body.t = who.t || ""; body.unit = UID;
    return fetch(url(), { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(body) })
      .then(function (r) { return r.json(); });
  }

  if (!document.getElementById("peer-css")) {
    var css = document.createElement("style"); css.id = "peer-css";
    css.textContent = ".peer{margin:22px 0 8px;padding:16px 18px;border:2px dashed var(--line);border-radius:18px;background:var(--card)}"
      + ".peer h4{margin:0 0 4px;font-family:'Jua',sans-serif;font-weight:400;font-size:19px}.peer .pr-sub{font-size:13px;color:var(--mist);margin:0 0 12px}"
      + ".pr-mine,.pr-card,.pr-got{border:1px solid var(--line);border-radius:14px;background:var(--panel);padding:12px 14px;margin:10px 0}"
      + ".pr-txt{font-size:15px;line-height:1.6;margin:0 0 10px;white-space:pre-wrap}.pr-card label{display:block;font-size:13.5px;margin:3px 0}"
      + ".pr-card input[type=text]{width:100%;box-sizing:border-box;margin:4px 0;padding:7px 10px;border:1px solid var(--line);border-radius:10px;font:inherit;font-size:13.5px;background:var(--card);color:var(--ink)}"
      + ".pr-msg{font-size:13px;color:var(--mist);margin-left:8px}.pr-bar{display:flex;gap:8px;align-items:center;font-size:13px;margin:3px 0}.pr-bar i{flex:1;height:8px;border-radius:99px;background:var(--line);overflow:hidden}.pr-bar b{display:block;height:100%;background:var(--teal,#14b8a6)}"
      + ".pr-got ul{margin:6px 0 0 18px;padding:0;font-size:13.5px}.pr-got li{margin:3px 0}";
    document.head.appendChild(css);
  }
  var box = el("div", "peer"); host.parentNode.insertBefore(box, host.nextSibling);

  function paint(state) {
    state = state || {};
    var who = me(), U = url(), mt = myText();
    box.innerHTML = "<h4>🔁 익명 돌려 읽기</h4><p class='pr-sub'>‘" + esc(LABEL) + "’을 이름 없이 친구들과 돌려 읽습니다. 친구 글 두 편을 읽고 점검한 뒤, 좋은 점과 고칠 점을 한 줄씩 남겨 주세요. 내 글이 받은 평가도 여기에서 봅니다.</p>";
    if (!U) { box.appendChild(el("p", "pr-sub", "선생님이 아직 공유 기능을 켜지 않았습니다.")); return; }
    if (!who) { box.appendChild(el("p", "pr-sub", "위에서 반과 별명을 저장하거나 로그인하면 쓸 수 있어요.")); return; }

    /* 1) 내 글 */
    var mine = el("div", "pr-mine");
    mine.appendChild(el("p", null, "<b>내 글</b>"));
    var sent = state.mine && state.mine.text ? String(state.mine.text) : "";
    mine.appendChild(el("p", "pr-txt", mt ? esc(mt) : (sent ? esc(sent) : "<span class='pr-sub'>정리하기 탭에서 ‘" + esc(LABEL) + "’을 먼저 써 주세요.</span>")));
    if (!mt && sent) mine.appendChild(el("p", "pr-sub", "돌려 읽기에 냈던 글입니다. 고치려면 정리하기 탭에서 다시 쓴 뒤 여기서 다시 내세요."));
    else if (mt && sent && mt !== sent) mine.appendChild(el("p", "pr-sub", "정리하기 글이 낸 글과 다릅니다. ‘고친 글로 다시 내기’를 누르면 친구들에게 새 글이 보입니다."));
    var put = el("button", "btn primary", state.put ? "고친 글로 다시 내기" : "돌려 읽기에 내 글 내기"); put.type = "button"; put.disabled = mt.length < 10;
    var pm = el("span", "pr-msg", state.put ? "✓ 냈습니다 — 친구들이 이름 없이 읽습니다." : (mt && mt.length < 10 ? "10자 이상 써야 낼 수 있어요." : ""));
    put.addEventListener("click", function () {
      put.disabled = true; pm.textContent = "보내는 중…";
      call({ action: "peerPut", text: mt }).then(function (j) { if (!j.ok) throw new Error(j.error || "오류"); state.put = 1; refresh(state); })
        .catch(function (e) { pm.textContent = "보내지 못했습니다 (" + e.message + ")"; put.disabled = false; });
    });
    var r1 = el("div", "btn-row"); r1.appendChild(put); r1.appendChild(pm); mine.appendChild(r1);
    box.appendChild(mine);

    /* 2) 친구 글 */
    var area = el("div"); box.appendChild(area);
    var get = el("button", "btn", state.items ? "다른 글 받기" : "친구 글 두 편 받기"); get.type = "button";
    var gm = el("span", "pr-msg", state.rated ? "지금까지 " + state.rated + "편을 평가했어요." : "");
    get.addEventListener("click", function () { get.disabled = true; gm.textContent = "불러오는 중…"; refresh(state, true); });
    var r2 = el("div", "btn-row"); r2.appendChild(get); r2.appendChild(gm); area.appendChild(r2);
    (state.items || []).forEach(function (it) {
      var c = el("div", "pr-card");
      c.appendChild(el("p", "pr-txt", esc(it.text)));
      var chk = RUBRIC.map(function (t) { var l = el("label", null, "<input type='checkbox'> " + esc(t)); c.appendChild(l); return l.querySelector("input"); });
      var g = el("input"); g.type = "text"; g.maxLength = 120; g.placeholder = "👍 좋은 점 한 줄";
      var f = el("input"); f.type = "text"; f.maxLength = 120; f.placeholder = "🔧 고칠 점 한 줄 (이렇게 고치면 더 좋겠다)";
      c.appendChild(g); c.appendChild(f);
      var sb = el("button", "btn primary", "평가 보내기"); sb.type = "button"; var sm = el("span", "pr-msg");
      sb.addEventListener("click", function () {
        if (!g.value.trim() && !f.value.trim()) { sm.textContent = "좋은 점이나 고칠 점을 한 줄 써 주세요."; return; }
        sb.disabled = true; sm.textContent = "보내는 중…";
        call({ action: "peerRate", id: it.id, c: chk.map(function (x) { return x.checked ? 1 : 0; }), good: g.value.trim(), fix: f.value.trim() })
          .then(function (j) { if (!j.ok) throw new Error(j.error || "오류"); sm.textContent = "✓ 보냈습니다. 고마워요!"; chk.concat([g, f]).forEach(function (x) { x.disabled = true; }); state.rated = (state.rated || 0) + 1; })
          .catch(function (e) { sm.textContent = "보내지 못했습니다 (" + e.message + ")"; sb.disabled = false; });
      });
      var r3 = el("div", "btn-row"); r3.appendChild(sb); r3.appendChild(sm); c.appendChild(r3);
      area.appendChild(c);
    });
    if (state.items && !state.items.length) area.appendChild(el("p", "pr-sub", "지금은 읽을 친구 글이 없습니다. 친구들이 글을 내면 다시 눌러 보세요."));

    /* 3) 내 글이 받은 평가 */
    if (state.mine && state.mine.got) {
      var G = state.mine.got, gb = el("div", "pr-got");
      gb.appendChild(el("p", null, "<b>내 글이 받은 평가</b> · " + G.length + "명"));
      if (G.length) {
        RUBRIC.forEach(function (t, i) { var n = G.filter(function (x) { return x.c && x.c[i]; }).length; gb.appendChild(el("div", "pr-bar", "<span>" + esc(t) + "</span><i><b style='width:" + Math.round(n / G.length * 100) + "%'></b></i><span>" + n + "명</span>")); });
        var goods = G.filter(function (x) { return x.good; }), fixes = G.filter(function (x) { return x.fix; });
        if (goods.length) gb.appendChild(el("div", null, "<p style='margin:8px 0 0'><b>👍 좋은 점</b></p><ul>" + goods.map(function (x) { return "<li>" + esc(x.good) + "</li>"; }).join("") + "</ul>"));
        if (fixes.length) gb.appendChild(el("div", null, "<p style='margin:8px 0 0'><b>🔧 고칠 점</b></p><ul>" + fixes.map(function (x) { return "<li>" + esc(x.fix) + "</li>"; }).join("") + "</ul>"));
        gb.appendChild(el("p", "pr-sub", "고칠 점을 보고 정리하기 탭에서 글을 고친 뒤 ‘고친 글로 다시 내기’를 눌러 보세요."));
      } else gb.appendChild(el("p", "pr-sub", "아직 받은 평가가 없습니다."));
      box.appendChild(gb);
    }
  }
  function refresh(state, fetchItems) {
    if (!url() || !me()) { paint(state); return; }
    call({ action: "peerGet", n: 2 }).then(function (j) {
      if (!j.ok) throw new Error(j.error || "오류");
      state.mine = j.mine; state.put = j.mine ? 1 : 0; state.rated = j.rated;
      if (fetchItems) state.items = j.items || [];
      paint(state);
    }).catch(function (e) { paint(state); var p = el("p", "pr-sub", "지금은 불러올 수 없습니다 (" + esc(e.message) + "). 잠시 뒤 다시 해 보세요."); box.appendChild(p); });
  }
  var S = {};
  paint(S);
  var loaded = false;
  window.addEventListener("tab-shown", function () { if (!box.closest("[hidden]")) { refresh(S, false); loaded = true; } });
  if (!box.closest("[hidden]")) refresh(S, false);
})();
