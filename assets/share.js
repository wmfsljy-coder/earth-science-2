/* =========================================================================
   우리 반 공유 탭 — theme.js 다음에 불러온다. share-config.js 가 먼저 와야 한다.

   뒷단은 선생님이 직접 배포한 Google Apps Script 웹앱 하나(구글 시트에 쌓인다).
   주소는 assets/share-config.js 의 window.STH_SHARE_URL 에 적는다. 비어 있으면 공유 없이 내 성과만 보인다.

     sthShare({
       mount: "share", unit: "is2-2-1", unitLabel: "[통합과학2 Ⅱ-1] 생태계와 환경 변화",
       rows: [{ key: "r1", label: "① 한 나무, 두 가지 잎" }, …],     // sthState 에 저장된 이야기별 결과 문자열
       line: { id: "all", label: "세 사건을 꿰는 한 문장" }            // (선택) 함께 올릴 수 있는 서술 한 칸
     });

   약속: 올리기는 학생이 버튼을 눌렀을 때만. 실명 대신 별명. 같은 반·같은 별명·같은 단원은 덮어쓴다.
   ========================================================================= */
(function () {
  "use strict";
  var ME = "sth-me";

  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function me() { try { return JSON.parse(localStorage.getItem(ME) || "{}"); } catch (e) { return {}; } }
  function unitData(unit) { try { return JSON.parse(localStorage.getItem("sth-" + unit) || "{}"); } catch (e) { return {}; } }
  function clean(s, n) { return String(s || "").replace(/\s+/g, " ").trim().slice(0, n); }

  window.sthShare = function (opt) {
    var mount = document.getElementById(opt.mount);
    if (!mount) return;
    var URL_ = (window.STH_SHARE_URL || "").trim();
    mount.classList.add("share");
    mount.innerHTML = "";

    /* ---- 내 정보 ---- */
    var idBox = el("div", "share-id");
    idBox.innerHTML = "<label>반 코드 <input id='sh-cls' maxlength='12' placeholder='예: 1-3' autocomplete='off'></label>"
      + "<label>별명 <input id='sh-nick' maxlength='12' placeholder='실명 대신 별명' autocomplete='off'></label>"
      + "<button class='btn' type='button' id='sh-save'>저장</button><span class='saved' id='sh-idmsg'></span>";
    mount.appendChild(idBox);
    var cls = idBox.querySelector("#sh-cls"), nick = idBox.querySelector("#sh-nick"), idmsg = idBox.querySelector("#sh-idmsg");
    var m = me(); cls.value = m.cls || ""; nick.value = m.nick || "";
    idBox.querySelector("#sh-save").addEventListener("click", function () {
      var o = { cls: clean(cls.value, 12), nick: clean(nick.value, 12) };
      try { localStorage.setItem(ME, JSON.stringify(o)); } catch (e) { /* 저장이 막힌 기기 */ }
      idmsg.textContent = "저장했습니다."; setTimeout(function () { idmsg.textContent = ""; }, 1500);
      load();
    });

    /* ---- 내 성과 ---- */
    var mine = el("div", "share-mine"); mount.appendChild(mine);
    function myResults() {
      var s = unitData(opt.unit).s || {}, r = {};
      opt.rows.forEach(function (row) { if (s[row.key]) r[row.key] = clean(s[row.key], 120); });
      return r;
    }
    function myLine() { return opt.line ? clean((unitData(opt.unit).w || {})[opt.line.id], 300) : ""; }
    function paintMine() {
      var r = myResults();
      mine.innerHTML = "";
      mine.appendChild(el("h4", null, "내 성과"));
      opt.rows.forEach(function (row) {
        var d = el("div", "sm-row" + (r[row.key] ? " ok" : ""));
        d.appendChild(el("b", null, row.label));
        d.appendChild(el("span", null, r[row.key] || "아직 해결하지 못함"));
        mine.appendChild(d);
      });
    }

    /* ---- 올리기 ---- */
    var act = el("div", "share-act"); mount.appendChild(act);
    var withLine = null;
    if (opt.line) {
      var lab = el("label", "sh-check"); withLine = el("input"); withLine.type = "checkbox";
      lab.appendChild(withLine); lab.appendChild(document.createTextNode(" ‘" + opt.line.label + "’도 함께 올리기"));
      act.appendChild(lab);
    }
    var postBtn = el("button", "btn primary", "📣 우리 반에 올리기"); postBtn.type = "button";
    var reBtn = el("button", "btn", "↻ 새로 고침"); reBtn.type = "button";
    var msg = el("span", "saved");
    act.appendChild(postBtn); act.appendChild(reBtn); act.appendChild(msg);

    var board = el("div", "share-board"); mount.appendChild(board);

    function need() {
      var o = me();
      if (!URL_) { board.innerHTML = ""; board.appendChild(el("p", "sh-note", "선생님이 아직 공유 기능을 켜지 않았습니다. 지금은 내 성과만 볼 수 있습니다.")); return null; }
      if (!o.cls || !o.nick) { board.innerHTML = ""; board.appendChild(el("p", "sh-note", "반 코드와 별명을 저장하면 우리 반 친구들의 성과가 보입니다.")); return null; }
      return o;
    }

    function load() {
      paintMine();
      var o = need(); if (!o) return;
      board.innerHTML = ""; board.appendChild(el("p", "sh-note", "불러오는 중…"));
      fetch(URL_ + "?action=list&cls=" + encodeURIComponent(o.cls) + "&unit=" + encodeURIComponent(opt.unit))
        .then(function (r) { return r.json(); })
        .then(function (j) { if (!j.ok) throw new Error(j.error || "오류"); paintBoard(j.items || [], o); })
        .catch(function (e) { board.innerHTML = ""; board.appendChild(el("p", "sh-note", "불러오지 못했습니다. (" + e.message + ")")); });
    }

    function paintBoard(items, o) {
      board.innerHTML = "";
      board.appendChild(el("h4", null, o.cls + "반 · " + items.length + "명이 올렸습니다"));
      var tally = el("div", "sh-tally");
      opt.rows.forEach(function (row) {
        var n = items.filter(function (it) { return it.results && it.results[row.key]; }).length;
        var t = el("div", "sh-bar"); t.appendChild(el("span", null, row.label + " — " + n + "명"));
        var track = el("i"); var fill = el("b"); fill.style.width = (items.length ? n / items.length * 100 : 0) + "%"; track.appendChild(fill); t.appendChild(track);
        tally.appendChild(t);
      });
      board.appendChild(tally);
      var grid = el("div", "sh-grid");
      items.forEach(function (it) {
        var c = el("div", "sh-card" + (it.nick === o.nick ? " me" : ""));
        c.appendChild(el("div", "sh-nick", it.nick + (it.nick === o.nick ? " (나)" : "")));
        opt.rows.forEach(function (row) {
          if (!it.results || !it.results[row.key]) return;
          var p = el("p"); p.appendChild(el("b", null, row.label + " ")); p.appendChild(document.createTextNode(it.results[row.key])); c.appendChild(p);
        });
        if (it.line) c.appendChild(el("blockquote", null, it.line));
        grid.appendChild(c);
      });
      board.appendChild(grid);
    }

    postBtn.addEventListener("click", function () {
      var o = need(); if (!o) { msg.textContent = "반 코드와 별명을 먼저 저장하세요."; return; }
      var r = myResults();
      if (!Object.keys(r).length) { msg.textContent = "이야기를 하나 이상 해결한 뒤에 올릴 수 있습니다."; return; }
      postBtn.disabled = true; msg.textContent = "올리는 중…";
      fetch(URL_, {
        method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" },      // 단순 요청이라 사전 요청(preflight)이 없다
        body: JSON.stringify({ action: "post", cls: o.cls, nick: o.nick, unit: opt.unit, unitLabel: opt.unitLabel || "", results: r, line: withLine && withLine.checked ? myLine() : "" })
      }).then(function (res) { return res.json(); })
        .then(function (j) { if (!j.ok) throw new Error(j.error || "오류"); msg.textContent = "올렸습니다."; load(); })
        .catch(function (e) { msg.textContent = "올리지 못했습니다. (" + e.message + ")"; })
        .then(function () { postBtn.disabled = false; setTimeout(function () { msg.textContent = ""; }, 2500); });
    });
    reBtn.addEventListener("click", load);
    window.addEventListener("tab-shown", function () { if (!mount.closest("[hidden]")) load(); });
    paintMine(); need();
  };
})();
