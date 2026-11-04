/* =========================================================================
   수업 범위(소단원 골라 쓰기)와 소단원 잇기 카드 — theme.js 바로 다음에 불러온다.
   모든 과목 저장소에 같은 사본. 단원마다 따로 설정하지 않아도 된다.

   1) 수업 범위: 주소 끝에 ?sec=01,03 처럼 붙이면
      · 그 밖의 이야기 탭을 숨기고
      · 수준별 문제·들어가기·교과서 실험·응용 실험실·실제 자료에서 빠진 소단원(sec) 문항을 빼고
      · 정리하기·우리 반의 기록 줄(r1, r2 …)과 '네 사건' 같은 말을 남은 수에 맞춘다.
      sec(응용 실험실 사례는 about — lab.js 는 sec 가 있으면 사례를 이야기 탭으로 옮기므로) 가 없는 문항은 늘 남는다. 이야기 탭은 안에 .episode 가 있는 탭이고,
      소단원 번호는 탭 단추의 .num(01, 02 …), 기록 키는 r1 ↔ 01, r2 ↔ 02 … 로 본다.
      교사 화면(?open=1 또는 ?teacher=1)에는 범위를 골라 학생 주소를 복사하는 상자가 뜬다.

   2) 소단원 잇기(단원의 handoff.js 에서 부른다, episodes.js 다음):
      sthHandoff({ ep: "epB", lines: ["…", "…"], note: "…" })
         → 그 이야기 결말(.ending) 아래에 '넘겨주기 카드'(이 이야기에서 챙겨 갈 것)
      sthBridge({ ep: "epC", need: "02", doneKey: "epB", lines: […], check: { q, options, a, why } })
         → 그 이야기 맨 앞에 '이어받기 카드'. 앞 소단원을 건너뛰었거나(?sec=) 아직 안 끝냈으면 펼치고, 끝냈으면 접는다.
      sthBridge({ ep: "epB", always: true, title: "시작 전 1분 · …", lines: […] })
         → 늘 펼친 '시작 전' 카드(그 이야기에 필요한 선수 개념)
   ========================================================================= */
(function () {
  "use strict";
  var NUM = { 1: "한", 2: "두", 3: "세", 4: "네", 5: "다섯", 6: "여섯" };
  var NUMRE = /(한|두|세|네|다섯|여섯) (사건|이야기)/g;
  var SECS = {}, ALL = [], ON = [], SKIPPED = [], N = 0, ready = false;
  var TEACHER = /[?&](open|teacher)=1/.test(location.search);
  var m = /[?&]sec=([0-9,]+)/.exec(location.search);
  var ASKED = m ? m[1].split(",") : null;

  function josa(w, a, b) { var c = w.charCodeAt(w.length - 1); return (c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28) ? a : b; }

  /* 이야기 탭 읽기 — 스크립트가 body 끝에 있으므로 DOM 은 이미 있다 */
  function scan() {
    if (ready) return;
    ready = true;
    Array.prototype.forEach.call(document.querySelectorAll(".tab-btn[data-tab]"), function (b) {
      var p = document.querySelector('.tab-panel[data-panel="' + b.getAttribute("data-tab") + '"]');
      var num = b.querySelector(".num");
      if (!p || !num || !p.querySelector(".episode")) return;
      var s = num.textContent.trim();
      SECS[s] = b.textContent.replace(num.textContent, "").trim();
      b.setAttribute("data-sec", s);
      p.setAttribute("data-sec", s);
      ALL.push(s);
    });
    ON = ASKED ? ASKED.filter(function (s) { return SECS[s]; }) : ALL.slice();
    if (!ON.length) ON = ALL.slice();
    SKIPPED = ALL.filter(function (s) { return ON.indexOf(s) < 0; });
    N = ON.length;
    window.sthScope = { all: ALL.slice(), on: ON.slice(), skipped: SKIPPED.slice(), names: SECS, has: function (s) { return ON.indexOf(s) >= 0; } };
  }
  function rkeySec(k) { var mm = /^r(\d)$/.exec(k || ""); return mm ? "0" + mm[1] : null; }
  function keepItem(it) { var s = it && (it.sec || it.about); return !s || ON.indexOf(s) >= 0; }
  function keepKey(r) { var s = r && rkeySec(r.key); return !s || !SECS[s] || ON.indexOf(s) >= 0; }
  function words(s) { return (!SKIPPED.length || typeof s !== "string") ? s : s.replace(NUMRE, function (all, n, w) { return NUM[N] + " " + w; }); }
  function fixLabels(arr) {
    return arr.map(function (x) {
      if (!x || typeof x !== "object") return x;
      var y = {}; for (var k in x) y[k] = x[k];
      if (typeof y.label === "string") y.label = words(y.label);
      if (typeof y.hint === "string") y.hint = words(y.hint);
      return y;
    });
  }

  /* 공용 엔진 감싸기 — 이미 있는 것(theme.js 의 sthWork 등)과 나중에 정의되는 것 모두 */
  ["sthQuiz", "sthPrecheck", "sthInquiry", "sthLab", "sthWork", "sthShare"].forEach(function (name) {
    var real = typeof window[name] === "function" ? window[name] : null;
    function wrapped(opt) {
      scan();
      if (SKIPPED.length && opt && typeof opt === "object") {
        var o = {}; for (var k in opt) o[k] = opt[k];
        if (Array.isArray(o.items)) o.items = fixLabels(o.items.filter(keepItem));
        if (Array.isArray(o.cases)) o.cases = o.cases.filter(keepItem);
        if (Array.isArray(o.recap)) o.recap = o.recap.filter(keepKey);
        if (Array.isArray(o.rows)) o.rows = o.rows.filter(keepKey);
        if (o.line && typeof o.line.label === "string") o.line = { id: o.line.id, label: words(o.line.label) };
        opt = o;
      }
      return real.apply(this, [opt].concat([].slice.call(arguments, 1)));
    }
    Object.defineProperty(window, name, {
      configurable: true,
      get: function () { return real ? wrapped : undefined; },
      set: function (fn) { real = fn; }
    });
  });

  function applyTabs() {
    scan();
    Array.prototype.forEach.call(document.querySelectorAll(".tab-btn[data-sec]"), function (b) {
      if (ON.indexOf(b.getAttribute("data-sec")) < 0) { b.hidden = true; b.classList.add("scope-off"); }
    });
    /* ?sec= 로 들어오면(소단원 QR) 그 범위의 첫 소단원을 바로 연다 — 00 들어가기는 메뉴에 남고, 이야기 머리의 안내로도 갈 수 있다 */
    var act = document.querySelector(".tab-btn.active"), asked = ASKED && SKIPPED.length ? document.querySelector('.tab-btn[data-sec="' + ON[0] + '"]') : null;
    if (asked) asked.click();
    else if (act && act.hidden) { var first = document.querySelector(".tab-btn:not([hidden])"); if (first) first.click(); }
    /* 교사 기기: 이야기 탭 머리마다 그 소단원 QR */
    if (window.STH_TEACHER && window.sthSecQR) ON.forEach(function (s) {
      var p = document.querySelector('.tab-panel[data-sec="' + s + '"]'), h = p && p.querySelector(".stage-head");
      if (!h || h.querySelector(".qr-btn")) return;
      var q = document.createElement("button"); q.type = "button"; q.className = "qr-btn"; q.textContent = "📱 이 소단원 QR";
      q.addEventListener("click", function () { window.sthSecQR(s, s + " " + SECS[s]); });
      h.appendChild(q);
    });
    var brand = document.querySelector("#rail .brand") || document.querySelector(".rail .brand");
    if (!brand || !ALL.length) return;
    if (SKIPPED.length) {
      var band = document.createElement("div");
      band.className = "scope-band";
      band.innerHTML = "<b>이번 수업 범위</b> " + ON.map(function (s) { return s + " " + SECS[s]; }).join(" · ") +
        "<br><span>건너뜀: " + SKIPPED.map(function (s) { return s + " " + SECS[s]; }).join(" · ") + "</span>";
      brand.appendChild(band);
    }
    if (TEACHER && ALL.length > 1) {
      var box = document.createElement("details");
      box.className = "scope-box";
      box.innerHTML = "<summary>교사용 · 수업 범위 고르기</summary>" +
        ALL.map(function (s) { return "<label><input type='checkbox' value='" + s + "'" + (ON.indexOf(s) >= 0 ? " checked" : "") + "> " + s + " " + SECS[s] + "</label>"; }).join("") +
        "<button type='button' class='btn sm'>학생 주소 복사</button> <button type='button' class='btn sm scope-qr'>📱 QR 띄우기</button><div class='scope-url'></div>";
      brand.appendChild(box);
      var url = box.querySelector(".scope-url");
      var make = function () {
        var on = [].map.call(box.querySelectorAll("input:checked"), function (i) { return i.value; });
        var u = location.origin + location.pathname + (on.length && on.length < ALL.length ? "?sec=" + on.join(",") : "");
        url.textContent = u; return u;
      };
      box.addEventListener("change", make); make();
      box.querySelector(".scope-qr").addEventListener("click", function () { if (window.sthQR) window.sthQR(make(), "이번 수업 범위", [].map.call(box.querySelectorAll("input:checked"), function (i) { return i.value + " " + SECS[i.value]; }).join(" · ")); });
      box.querySelector("button").addEventListener("click", function () {
        var u = make(), b = this;
        if (navigator.clipboard) navigator.clipboard.writeText(u);
        b.textContent = "복사했어요";
        setTimeout(function () { b.textContent = "학생 주소 복사"; }, 1500);
      });
    }
  }
  function applyWords() {
    if (!SKIPPED.length) return;
    var root = document.querySelector("main") || document.body;
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), n;
    while ((n = w.nextNode())) { if (NUMRE.test(n.nodeValue)) { NUMRE.lastIndex = 0; n.nodeValue = words(n.nodeValue); } NUMRE.lastIndex = 0; }
  }

  function ul(lines) { return "<ul>" + (lines || []).map(function (s) { return "<li>" + s + "</li>"; }).join("") + "</ul>"; }
  function checkBox(box, c) {
    if (!c) return;
    var q = document.createElement("div");
    q.className = "bq";
    q.innerHTML = "<div class='bq-q'>✔ 확인 한 문제 · " + c.q + "</div><div class='bq-o'></div><div class='bq-w' aria-live='polite'></div>";
    box.querySelector(".b-body").appendChild(q);
    var oo = q.querySelector(".bq-o"), ww = q.querySelector(".bq-w");
    c.options.forEach(function (t, i) {
      var b = document.createElement("button"); b.type = "button"; b.className = "btn sm"; b.textContent = t;
      b.addEventListener("click", function () {
        var ok = i === c.a;
        b.classList.add(ok ? "right" : "wrong");
        ww.innerHTML = ok ? "✅ " + c.why : "❌ 다시 생각해 보세요." + (c.hint ? " " + c.hint : "");
      });
      oo.appendChild(b);
    });
  }

  /* 이어받기 카드 */
  window.sthBridge = function (o) {
    scan();
    var ep = document.getElementById(o.ep);
    if (!ep) return;
    var skipped = !!(o.need && SKIPPED.indexOf(o.need) >= 0);
    var st = o.doneKey && window.sthState ? window.sthState(o.doneKey) : null;
    var finished = !!(st && st.done);
    var open = !!(o.always || skipped || !finished);
    var nm = o.need ? (SECS[o.need] || o.needName || "") : "";
    var head = o.always ? (o.title || "시작 전 1분") :
      skipped ? "이번 수업에서 " + o.need + " 「" + nm + "」" + josa(nm, "을", "를") + " 건너뛰었어요. 이 카드만 보고 시작해도 됩니다." :
      !finished ? o.need + " 「" + nm + "」" + josa(nm, "을", "를") + " 아직 끝내지 않았다면, 이것만 먼저 확인하세요." :
      o.need + " 「" + nm + "」에서 가져온 것 다시 보기";
    var box = document.createElement("div");
    box.className = "bridge" + (open ? " open" : "");
    var body = "<div class='b-body'>" + (o.html || ul(o.lines)) + (o.note ? "<p class='b-note'>" + o.note + "</p>" : "") + "</div>";
    box.innerHTML = open ? "<div class='b-tag'>" + (o.always ? "시작 전" : "이어받기") + "</div><h4>" + head + "</h4>" + body
      : "<details><summary>↩ " + head + "</summary>" + body + "</details>";
    ep.parentNode.insertBefore(box, ep);
    checkBox(box, o.check);
  };
  /* 넘겨주기 카드 */
  window.sthHandoff = function (o) {
    var ep = document.getElementById(o.ep);
    if (!ep) return;
    var scenes = ep.querySelectorAll(":scope > .scene"), last = scenes[scenes.length - 1];
    if (!last) return;
    var end = last.querySelector(".ending");
    var box = document.createElement("div");
    box.className = "handoff";
    box.innerHTML = "<div class='b-tag'>넘겨주기</div><h4>" + (o.title || "이 이야기에서 챙겨 갈 것") + "</h4>" + ul(o.lines) +
      (o.note ? "<p class='b-note'>" + o.note + "</p>" : "");
    if (end && end.parentNode) end.parentNode.insertBefore(box, end.nextSibling);
    else last.insertBefore(box, last.querySelector(".scene-foot"));
  };

  function boot() { applyTabs(); applyWords(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
