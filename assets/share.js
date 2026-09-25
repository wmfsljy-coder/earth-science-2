/* =========================================================================
   우리 반 공유 탭 — theme.js 다음에 불러온다. share-config.js 가 먼저 와야 한다.

   뒷단은 선생님이 직접 배포한 Google Apps Script 웹앱 하나(구글 시트에 쌓인다).
   주소는 assets/share-config.js 의 window.STH_SHARE_URL 에 적는다. 비어 있으면 공유 없이 내 성과만 보인다.

     sthShare({
       mount: "share", unit: "is2-2-1", unitLabel: "[통합과학2 Ⅱ-1] 생태계와 환경 변화",
       rows:  [{ key: "r1", label: "① 한 나무, 두 가지 잎" }, …],   // sthState 에 저장된 이야기별 결과
       works: [{ id: "w1", label: "날씨와 기후를 가르는 것" }, …],   // sthWork 로 쓴 답안 (이야기가 없는 단원용)
       line:  { id: "all", label: "세 사건을 꿰는 한 문장" }          // (선택) 함께 올릴 수 있는 서술 한 칸
     });

   약속: 올리기는 학생이 버튼을 눌렀을 때만. 실명 대신 별명. 같은 반·같은 별명·같은 단원은 덮어쓴다.
   답안 글은 기본으로 올리지 않는다(‘작성함’ 표시만). 학생이 직접 체크해야 글이 함께 올라간다.
   ========================================================================= */
(function () {
  "use strict";
  var ME = "sth-me";

  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function me() { try { return JSON.parse(localStorage.getItem(ME) || "{}"); } catch (e) { return {}; } }
  function unitData(unit) { try { return JSON.parse(localStorage.getItem("sth-" + unit) || "{}"); } catch (e) { return {}; } }
  function clean(s, n) { return String(s || "").replace(/\s+/g, " ").trim().slice(0, n); }
  function when(t) {
    var d = new Date(t);
    if (!t || isNaN(d.getTime())) return "";
    return (d.getMonth() + 1) + "월 " + d.getDate() + "일 " + ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2);
  }

  window.sthShare = function (opt) {
    var mount = document.getElementById(opt.mount);
    if (!mount) return;
    var URL_ = (window.STH_SHARE_URL || "").trim();
    var ROWS = opt.rows || [], WORKS = opt.works || [];
    var withLine = null, withWorks = null;
    mount.classList.add("share");
    mount.innerHTML = "";

    /* 이야기 성과와 답안 칸을 한 목록으로 다룬다 */
    function allRows() {
      return ROWS.map(function (r) { return { key: r.key, label: r.label }; })
        .concat(WORKS.map(function (w) { return { key: w.id, label: w.label }; }));
    }

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
    /* forPost 일 때는 체크하지 않은 답안 글을 ‘작성함’ 으로만 바꿔 보낸다 */
    function myResults(forPost) {
      var d = unitData(opt.unit), s = d.s || {}, w = d.w || {}, r = {};
      ROWS.forEach(function (row) { if (s[row.key]) r[row.key] = clean(s[row.key], 120); });
      WORKS.forEach(function (it) {
        var t = clean(w[it.id], 300);
        if (!t) return;
        r[it.id] = (forPost && !(withWorks && withWorks.checked)) ? "작성함 (" + t.length + "자)" : t;
      });
      return r;
    }
    function myLine() { return opt.line ? clean((unitData(opt.unit).w || {})[opt.line.id], 300) : ""; }
    function paintMine() {
      var r = myResults(false);
      mine.innerHTML = "";
      mine.appendChild(el("h4", null, "내 성과"));
      allRows().forEach(function (row) {
        var d = el("div", "sm-row" + (r[row.key] ? " ok" : ""));
        d.appendChild(el("b", null, row.label));
        d.appendChild(el("span", null, r[row.key] || "아직 하지 않음"));
        mine.appendChild(d);
      });
    }

    /* ---- 올리기 ---- */
    var act = el("div", "share-act"); mount.appendChild(act);
    if (WORKS.length) {
      var lw = el("label", "sh-check"); withWorks = el("input"); withWorks.type = "checkbox";
      lw.appendChild(withWorks);
      lw.appendChild(document.createTextNode(" 내가 쓴 답안 글도 함께 올리기 (체크하지 않으면 ‘작성함’ 표시만 올라갑니다)"));
      act.appendChild(lw);
    }
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
    var logBox = el("div", "share-log"); mount.appendChild(logBox);

    function need() {
      var o = me();
      if (!URL_) { board.innerHTML = ""; board.appendChild(el("p", "sh-note", "선생님이 아직 공유 기능을 켜지 않았습니다. 지금은 내 성과만 볼 수 있습니다.")); return null; }
      if (!o.cls || !o.nick) { board.innerHTML = ""; board.appendChild(el("p", "sh-note", "반 코드와 별명을 저장하면 우리 반 친구들의 성과가 보입니다.")); return null; }
      return o;
    }

    function load() {
      paintMine();
      var o = need(); if (!o) { logBox.innerHTML = ""; return; }
      board.innerHTML = ""; board.appendChild(el("p", "sh-note", "불러오는 중…"));
      fetch(URL_ + "?action=list&cls=" + encodeURIComponent(o.cls) + "&unit=" + encodeURIComponent(opt.unit))
        .then(function (r) { return r.json(); })
        .then(function (j) { if (!j.ok) throw new Error(j.error || "오류"); paintBoard(j.items || [], o); })
        .catch(function (e) { board.innerHTML = ""; board.appendChild(el("p", "sh-note", "지금은 우리 반 화면을 불러올 수 없습니다. 선생님이 공유를 켜는 중일 수 있습니다. 잠시 뒤 ↻ 새로 고침을 눌러 보세요.")); });
      loadLog(o);
    }

    /* ---- 우리 반 활동 기록 : 이 반이 지금까지 어느 단원에서 무엇을 했는지 ---- */
    function loadLog(o) {
      logBox.innerHTML = "";
      logBox.appendChild(el("h4", null, "우리 반 활동 기록"));
      var p = el("p", "sh-note", "불러오는 중…"); logBox.appendChild(p);
      fetch(URL_ + "?action=classlog&cls=" + encodeURIComponent(o.cls))
        .then(function (r) { return r.json(); })
        .then(function (j) { if (!j.ok) throw new Error(j.error || "오류"); paintLog(j.units || [], o); })
        .catch(function (e) { p.textContent = "활동 기록은 잠시 뒤에 보입니다."; });
    }
    function paintLog(units, o) {
      logBox.innerHTML = "";
      logBox.appendChild(el("h4", null, "우리 반 활동 기록"));
      if (!units.length) {
        logBox.appendChild(el("p", "sh-note", o.cls + "반은 아직 올린 기록이 없습니다. 첫 기록을 남겨 보세요."));
        return;
      }
      var total = 0;
      units.forEach(function (u) { total += (u.n || 0); });
      logBox.appendChild(el("p", "sh-note", o.cls + "반 · 단원 " + units.length + "개 · 올린 기록 " + total + "건"));
      var list = el("div", "sh-log");
      units.forEach(function (u) {
        var row = el("div", "sh-log-row" + (u.unit === opt.unit ? " now" : ""));
        row.appendChild(el("b", null, u.label || u.unit));
        row.appendChild(el("span", null, (u.n || 0) + "명"));
        row.appendChild(el("i", null, when(u.last)));
        list.appendChild(row);
      });
      logBox.appendChild(list);
    }

    function paintBoard(items, o) {
      board.innerHTML = "";
      board.appendChild(el("h4", null, o.cls + "반 · " + items.length + "명이 올렸습니다"));
      var tally = el("div", "sh-tally");
      allRows().forEach(function (row) {
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
        allRows().forEach(function (row) {
          if (!it.results || !it.results[row.key]) return;
          var p = el("p"); p.appendChild(el("b", null, row.label + " ")); p.appendChild(document.createTextNode(it.results[row.key])); c.appendChild(p);
        });
        if (it.line) c.appendChild(el("blockquote", null, it.line));
        if (it.t) c.appendChild(el("div", "sh-when", when(it.t)));
        grid.appendChild(c);
      });
      board.appendChild(grid);
    }

    postBtn.addEventListener("click", function () {
      var o = need(); if (!o) { msg.textContent = "반 코드와 별명을 먼저 저장하세요."; return; }
      var r = myResults(true);
      if (!Object.keys(r).length) {
        msg.textContent = (WORKS.length && !ROWS.length) ? "정리하기를 한 칸이라도 쓴 뒤에 올릴 수 있습니다." : "이야기를 하나 이상 해결한 뒤에 올릴 수 있습니다.";
        return;
      }
      postBtn.disabled = true; msg.textContent = "올리는 중…";
      var body = JSON.stringify({ action: "post", cls: o.cls, nick: o.nick, unit: opt.unit, unitLabel: opt.unitLabel || "", results: r, line: withLine && withLine.checked ? myLine() : "" });
      /* 반 전체가 한꺼번에 누르면 시트에 줄이 생긴다. 뒷단이 '많습니다' 라고 하면
         조금씩 다른 시간만큼 기다렸다가 스스로 다시 보낸다(최대 세 번). */
      function send(tries) {
        return fetch(URL_, {
          method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" },      // 단순 요청이라 사전 요청(preflight)이 없다
          body: body
        }).then(function (res) { return res.json(); })
          .then(function (j) {
            if (!j.ok && /많습니다|잠시 뒤/.test(j.error || "") && tries < 3) {
              msg.textContent = "친구들이 한꺼번에 올리는 중이라 잠깐 기다립니다…";
              return new Promise(function (ok) { setTimeout(ok, 1500 + Math.random() * 3500); })
                .then(function () { return send(tries + 1); });
            }
            return j;
          });
      }
      send(1)
        .then(function (j) { if (!j.ok) throw new Error(j.error || "오류"); msg.textContent = "올렸습니다."; load(); })
        .catch(function (e) { msg.textContent = "올리지 못했습니다. (" + e.message + ")"; })
        .then(function () { postBtn.disabled = false; setTimeout(function () { msg.textContent = ""; }, 2500); });
    });
    reBtn.addEventListener("click", load);
    window.addEventListener("tab-shown", function () { if (!mount.closest("[hidden]")) load(); });
    paintMine(); need();
  };
})();
