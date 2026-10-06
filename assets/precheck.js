/* =========================================================================
   내 생각 점검(사전·사후 오개념 진단) — theme.js 다음, 단원의 episodes.js·quiz-items.js 다음에 불러온다.

     sthPrecheck({ items: [
       { id: "p1", sec: "01", a: false, s: "진술문", why: "이야기를 마친 뒤 보여 줄 해설" }, …
     ] });

   1) 탭 맨 앞에 ‘00 들어가기’ 탭을 만들고 단원의 진술을 모두 싣는다. 진술마다 맞다/틀리다/잘 모르겠다 + 확신도.
      정답은 이때 알려 주지 않는다. 이야기 탭에는 그 이야기의 진술에 아직 답하지 않았을 때만 들어가기로 가는 안내가 붙는다.
   2) 이야기(소단원)를 끝까지 풀면 그 탭의 이야기 아래에 같은 진술이 다시 나온다(사후). 답하면 정답과 해설이 열린다.
      이때부터 처음 생각은 고정된다.
   3) 정리하기 탭(#wk 가 있는 탭) 위에 ‘처음 생각 → 지금 생각’ 표가 붙는다.
   4) 정리하기 표 위에 ‘오개념 변화 측정’이 붙는다. 두 번 모두 답한 문장만으로
      처음·이야기 뒤 정답 수, 확신하고 틀린 문장(굳은 오개념) 수, 정규화 향상도 g = (사후−사전)/(전체−사전),
      변화 유형(오개념→바른 개념 · 처음부터 바름 · 흔들림 · 남은 오개념)을 보여 준다.
   기록은 sthState("pc") 에 { f: { id: { v: 1|0|-1, c: "s"|"h" } }, a: { id: { v: 1|0, c: "s"|"h" } } } 로 저장된다.
   우리 반 올리기(share.js)의 수업 효과 기록에 p:id=처음>나중 으로 함께 실린다.
     처음: 2 맞음·확실, 1 맞음·반반, 0 모름, -1 틀림·반반, -2 틀림·확실, n 답하지 않음 / 나중: 2·1·-1·-2 (같은 뜻)
   주소에 ?open=1 을 붙이면(교사용) 사후 문항도 바로 열린다.
   ========================================================================= */
(function () {
  "use strict";
  var OPEN_ALL = /[?&]open=1/.test(location.search);
  var KEY = "pc";

  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  /* 상태가 바뀔 때마다 알림을 받는다(이야기를 끝낸 순간 사후 문항을 연다) */
  if (window.sthState && !window.sthState._pcWrapped) {
    var orig = window.sthState, timer = null;
    window.sthState = function (k, v) {
      var r = arguments.length === 1 ? orig(k) : orig(k, v);
      if (arguments.length > 1 && k !== KEY) { clearTimeout(timer); timer = setTimeout(function () { window.dispatchEvent(new Event("sth-state")); }, 60); }
      return r;
    };
    window.sthState._pcWrapped = true;
  }

  function css() {
    if (document.getElementById("pc-css")) return;
    var s = document.createElement("style"); s.id = "pc-css";
    s.textContent =
      ".pc-card{margin:18px 0 22px;padding:18px 20px 12px;border:3px solid var(--brand);border-radius:22px;background:var(--card);box-shadow:var(--shadow-card)}" +
      ".pc-card.re{border-style:dashed;border-color:var(--violet);margin-top:24px}" +
      ".pc-card.sum{border-color:var(--teal)}" +
      ".pc-head>b{font-family:'Jua',sans-serif;font-weight:400;font-size:20px;color:var(--ink)}" +
      ".pc-head p{margin:4px 0 12px;font-size:13px;line-height:1.65;color:var(--mist)}" +
      ".pc-head p b{color:var(--ink)}" +
      ".pc-item{border-top:1.5px solid var(--line);padding:12px 2px 10px}" +
      ".pc-item:first-of-type{border-top:0}" +
      ".pc-s{font-size:15px;line-height:1.6;color:var(--ink);font-weight:700}" +
      ".pc-s .pc-sec{display:inline-block;font-size:11.5px;font-weight:800;color:var(--brand-700);background:var(--brand-100);border-radius:999px;padding:1px 8px;margin-right:6px;vertical-align:2px}" +
      ".pc-row{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-top:8px}" +
      ".pc-row .lbl{font-size:12.5px;color:var(--mist);margin-right:2px}" +
      ".pc-row .chip:disabled{cursor:default;opacity:.55}" +
      ".pc-row .chip.on:disabled{opacity:1}" +
      ".pc-first{font-size:12.5px;color:var(--mist);margin-top:6px}" +
      ".pc-ans{margin-top:10px;padding:10px 12px;border-radius:14px;background:var(--card-2);font-size:13.5px;line-height:1.7;color:var(--ink)}" +
      ".pc-ans .tag{font-weight:800;margin-right:6px}" +
      ".pc-ans .tag.ok{color:var(--green-700)}.pc-ans .tag.no{color:var(--rose-700)}.pc-ans .tag.new{color:var(--brand-700)}" +
      ".pc-lock{font-size:13px;color:var(--mist);padding:6px 2px 8px}" +
      ".pc-foot{font-size:12.5px;color:var(--mist);padding:8px 2px 4px}" +
      ".pc-nudge{display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center;margin:14px 0 18px;padding:12px 16px;border:2px dashed var(--brand);border-radius:16px;background:var(--brand-100);font-size:13.5px;line-height:1.6;color:var(--ink)}" +
      ".pc-nudge span{flex:1 1 260px}" +
      ".pc-tbl{width:100%;border-collapse:collapse;font-size:13.5px;margin:4px 0 6px}" +
      ".pc-tbl th,.pc-tbl td{border-top:1.5px solid var(--line);padding:8px 6px;text-align:left;vertical-align:top;line-height:1.55}" +
      ".pc-tbl th{font-size:12px;color:var(--mist);border-top:0}" +
      ".pc-tbl td.r{white-space:nowrap}" +
      ".pc-m{margin:2px 0 14px;padding:12px 14px;border-radius:16px;background:var(--card-2)}" +
      ".pc-m h4{margin:0 0 8px;font-size:15px;color:var(--ink)}" +
      ".pc-bar{display:grid;grid-template-columns:150px 1fr 64px;gap:8px;align-items:center;font-size:13px;color:var(--ink);margin:5px 0}" +
      ".pc-bar i{display:block;height:12px;border-radius:999px;background:var(--line);overflow:hidden}" +
      ".pc-bar i b{display:block;height:100%;border-radius:999px;background:var(--brand)}" +
      ".pc-bar.post i b{background:var(--teal)}" +
      ".pc-bar span:last-child{text-align:right;font-weight:800}" +
      ".pc-m p{margin:8px 0 0;font-size:13.5px;line-height:1.7;color:var(--ink)}" +
      ".pc-types{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}" +
      ".pc-types span{font-size:12.5px;font-weight:800;padding:4px 10px;border-radius:999px;background:var(--card);border:1.5px solid var(--line);color:var(--ink)}" +
      "@media (max-width:560px){.pc-bar{grid-template-columns:110px 1fr 54px}}";
    document.head.appendChild(s);
  }

  window.sthPrecheck = function (opt) {
    var items = (opt && opt.items) || [];
    if (!items.length || !window.sthState) return;
    css();
    window.STH_PRECHECK_ITEMS = {};
    items.forEach(function (it) { window.STH_PRECHECK_ITEMS[it.id] = !!it.a; });

    function st() { var o = window.sthState(KEY) || {}; o.f = o.f || {}; o.a = o.a || {}; return o; }
    function save(o) { window.sthState(KEY, o); }

    /* 소단원 번호 → 탭 패널 · 이야기 키 · 이름 */
    var SEC = {};
    Array.prototype.forEach.call(document.querySelectorAll(".tab-btn"), function (b) {
      var n = b.querySelector(".num"); if (!n) return;
      var sec = n.textContent.trim();
      var panel = document.querySelector('.tab-panel[data-panel="' + b.getAttribute("data-tab") + '"]');
      if (!panel) return;
      var eps = panel.querySelectorAll(".episode");
      SEC[sec] = { panel: panel, ep: eps.length ? eps[eps.length - 1] : null, name: b.textContent.replace(sec, "").trim() };
    });
    function done(sec) {
      var S = SEC[sec]; if (!S || !S.ep) return true;
      var v = window.sthState(S.ep.id);
      return !!(v && v.done) || OPEN_ALL;
    }
    function firstText(f) {
      if (!f) return "답하지 않음";
      if (f.v === -1) return "잘 모르겠다";
      return (f.v === 1 ? "맞다" : "틀리다") + (f.c === "h" ? " (반반)" : f.c === "s" ? " (확실)" : "");
    }
    /* 이야기 뒤 답: { v: 1|0, c: "s"|"h" } (예전 기록은 숫자 1|0) */
    function aft(o, id) { var a = o.a[id]; if (a == null) return null; return typeof a === "number" ? { v: a, c: null, old: true } : a; }
    function aftDone(o, id) { var a = aft(o, id); return !!a && (a.old || !!a.c); }
    function verdict(it, o) {
      var f = o.f[it.id], a = aft(o, it.id);
      if (!aftDone(o, it.id)) return null;
      var nowOk = (a.v === 1) === !!it.a;
      var firstOk = f && f.v !== -1 && (f.v === 1) === !!it.a;
      if (!nowOk) return { cls: "no", t: a.c === "s" ? "⚠️ 아직 굳게 믿고 있는 오개념" : "⚠️ 아직 헷갈리는 문장" };
      if (firstOk) return { cls: "ok", t: "✓ 처음부터 맞게 생각했어요" };
      if (f && f.v === -1) return { cls: "new", t: "💡 새로 알게 되었어요" };
      if (!f) return { cls: "ok", t: "✓ 맞았어요" };
      return { cls: "new", t: f.c === "s" ? "🔄 확신했던 생각이 바뀌었어요" : "🔄 생각이 바뀌었어요" };
    }

    /* ---------- 사전 문항 하나 ---------- */
    function preItem(it, showSec) {
      var box = el("div", "pc-item");
      function paint() {
        var o = st(), f = o.f[it.id], locked = done(it.sec) && !OPEN_ALL || aftDone(o, it.id);
        box.innerHTML = "<div class='pc-s'>" + (showSec && SEC[it.sec] ? "<span class='pc-sec'>" + it.sec + " " + esc(SEC[it.sec].name) + "</span>" : "") + esc(it.s) + "</div>";
        var r1 = el("div", "pc-row");
        r1.appendChild(el("span", "lbl", "내 생각"));
        [[1, "맞다"], [0, "틀리다"], [-1, "잘 모르겠다"]].forEach(function (p) {
          var b = el("button", "chip" + (f && f.v === p[0] ? " on" : ""), p[1]); b.type = "button"; b.disabled = locked;
          b.addEventListener("click", function () {
            var o2 = st(), cur = o2.f[it.id] || {};
            o2.f[it.id] = { v: p[0], c: p[0] === -1 ? undefined : cur.c };
            save(o2); refresh();
          });
          r1.appendChild(b);
        });
        box.appendChild(r1);
        if (f && f.v !== -1) {
          var r2 = el("div", "pc-row");
          r2.appendChild(el("span", "lbl", "얼마나 확실한가요?"));
          [["s", "확실해요"], ["h", "반반이에요"]].forEach(function (p) {
            var b = el("button", "chip" + (f.c === p[0] ? " on" : ""), p[1]); b.type = "button"; b.disabled = locked;
            b.addEventListener("click", function () { var o2 = st(); o2.f[it.id].c = p[0]; save(o2); refresh(); });
            r2.appendChild(b);
          });
          box.appendChild(r2);
        }
        if (locked) box.appendChild(el("div", "pc-first", "🔒 이야기를 끝냈으니 처음 생각은 그대로 둘게요. 이야기 아래에서 다시 답해 보세요."));
      }
      box._paint = paint; paint();
      return box;
    }
    function answered(it, o) { var f = o.f[it.id]; return !!f && (f.v === -1 || !!f.c); }

    /* ---------- 맨 앞 탭 ‘00 들어가기’: 단원 전체 진술 ----------
       생각 점검을 이야기 탭과 떼어 단원의 첫 탭으로 둔다. 탭 버튼과 화면은 여기서 만들고,
       theme.js 의 탭 전환은 처음 있던 탭만 알므로 이 탭을 여닫는 일은 여기서 맞춰 준다. */
    var cards = [];
    function preCard(list) {
      var c = el("div", "pc-card pre");
      c.appendChild(el("div", "pc-head", "<b>🧭 시작하기 전에 — 내 생각 점검</b><p>"
        + "이 단원에서 다룰 문장이에요. <b>정답은 아직 알려 주지 않아요.</b> 지금 생각나는 대로 골라 보세요. 틀려도 괜찮아요. "
        + "이야기를 하나 끝낼 때마다 그 이야기에 나온 문장을 다시 묻고, 그때 정답과 까닭을 알려 줄게요.</p>"));
      var rows = list.map(function (it) { var r = preItem(it, true); c.appendChild(r); return r; });
      var foot = el("div", "pc-foot"); c.appendChild(foot);
      c._paint = function () {
        rows.forEach(function (r) { r._paint(); });
        var o = st(), n = list.filter(function (it) { return answered(it, o); }).length;
        foot.textContent = n === list.length ? "✅ 모두 답했어요. 이제 첫 이야기를 시작해 보세요." : n + " / " + list.length + " 답함";
      };
      return c;
    }
    var btns = Array.prototype.slice.call(document.querySelectorAll(".tab-btn"));
    var firstBtn = btns[0], firstPanel = document.querySelector(".tab-panel");
    var introBtn = null, introPanel = null;
    function openIntro() {
      btns.forEach(function (b) { b.classList.remove("active"); });
      Array.prototype.forEach.call(document.querySelectorAll(".tab-panel"), function (p) { p.hidden = p !== introPanel; });
      introBtn.classList.add("active");
      window.dispatchEvent(new CustomEvent("tab-shown", { detail: "pc" }));
    }
    if (firstBtn && firstPanel) {
      introBtn = el("button", "tab-btn", "<span class='num'>00</span> 들어가기");
      introBtn.type = "button"; introBtn.setAttribute("data-tab", "pc");
      firstBtn.parentNode.insertBefore(introBtn, firstBtn);
      introPanel = el("section", "tab-panel"); introPanel.setAttribute("data-panel", "pc"); introPanel.hidden = true;
      introPanel.appendChild(el("div", "stage-head", "<div class='eyebrow'>00 · 들어가기</div><h2 class='display'>이야기를 시작하기 전에</h2>"
        + "<p>이 단원에 나오는 문장 " + items.length + "개를 먼저 읽고, 지금 내 생각을 골라 두세요. 단원을 마치고 정리하기 탭에 가면 처음 생각과 끝난 뒤의 생각을 견주어 볼 수 있어요.</p>"));
      var main = preCard(items);
      introPanel.appendChild(main); cards.push(main);
      var go = el("button", "btn primary", "첫 이야기 시작하기 →"); go.type = "button"; go.style.margin = "4px 0 30px";
      go.addEventListener("click", function () { firstBtn.click(); window.scrollTo(0, 0); });
      introPanel.appendChild(go);
      firstPanel.parentNode.insertBefore(introPanel, firstPanel);
      introBtn.addEventListener("click", openIntro);
      btns.forEach(function (b) { b.addEventListener("click", function () { introBtn.classList.remove("active"); introPanel.hidden = true; }); });
      /* 아직 답하지 않은 문장이 있고, 이야기를 하나도 끝내지 않았으면 들어가기부터 연다 */
      var o0 = st(), fresh = !Object.keys(SEC).some(function (k) { return SEC[k].ep && done(k) && !OPEN_ALL; });
      if (fresh && !items.every(function (it) { return answered(it, o0); })) openIntro();
    }
    /* 이야기 탭: 그 이야기의 문장에 아직 답하지 않았으면 들어가기로 가는 안내만 */
    Object.keys(SEC).forEach(function (sec) {
      if (!SEC[sec].ep || !introBtn) return;
      var list = items.filter(function (it) { return it.sec === sec; });
      if (!list.length) return;
      var P2 = SEC[sec].panel, h2 = P2.querySelector(".stage-head");
      var c = el("div", "pc-nudge");
      if (h2 && h2.nextSibling) P2.insertBefore(c, h2.nextSibling); else P2.insertBefore(c, P2.firstChild);
      c._paint = function () {
        var o = st(), left = list.filter(function (it) { return !answered(it, o); }).length;
        c.hidden = !left || done(sec);
        c.innerHTML = "";
        if (c.hidden) return;
        c.appendChild(el("span", null, "🧭 이 이야기에 나오는 생각 점검 문장 <b>" + left + "개</b>에 아직 답하지 않았어요. 이야기를 끝내면 처음 생각은 더 고칠 수 없어요."));
        var b = el("button", "btn", "00 들어가기에서 답하기"); b.type = "button";
        b.addEventListener("click", function () { openIntro(); window.scrollTo(0, 0); });
        c.appendChild(b);
      };
      cards.push(c);
    });

    /* ---------- 이야기 아래: 사후 문항 ---------- */
    Object.keys(SEC).forEach(function (sec) {
      var S = SEC[sec], list = items.filter(function (it) { return it.sec === sec; });
      if (!S.ep || !list.length) return;
      var c = el("div", "pc-card re");
      c.appendChild(el("div", "pc-head", "<b>🔁 처음 생각 다시 보기</b><p>이야기를 시작하기 전에 답했던 문장이에요. 지금은 어떻게 생각하나요?</p>"));
      var body = el("div"); c.appendChild(body);
      S.ep.parentNode.insertBefore(c, S.ep.nextSibling);
      c._paint = function () {
        body.innerHTML = "";
        if (!done(sec)) { body.appendChild(el("div", "pc-lock", "🔒 위의 이야기를 끝까지 풀면 열려요.")); return; }
        var o = st();
        list.forEach(function (it) {
          var box = el("div", "pc-item");
          box.appendChild(el("div", "pc-s", esc(it.s)));
          box.appendChild(el("div", "pc-first", "처음 생각: " + firstText(o.f[it.id])));
          var a = aft(o, it.id), fin = aftDone(o, it.id), r = el("div", "pc-row");
          r.appendChild(el("span", "lbl", "지금 생각"));
          [[1, "맞다"], [0, "틀리다"]].forEach(function (p) {
            var b = el("button", "chip" + (a && a.v === p[0] ? " on" : ""), p[1]); b.type = "button"; b.disabled = fin;
            b.addEventListener("click", function () { var o2 = st(); o2.a[it.id] = { v: p[0], c: null }; save(o2); refresh(); });
            r.appendChild(b);
          });
          box.appendChild(r);
          if (a && !a.old) {
            var r2 = el("div", "pc-row");
            r2.appendChild(el("span", "lbl", "얼마나 확실한가요?"));
            [["s", "확실해요"], ["h", "반반이에요"]].forEach(function (p) {
              var b = el("button", "chip" + (a.c === p[0] ? " on" : ""), p[1]); b.type = "button"; b.disabled = fin;
              b.addEventListener("click", function () { var o2 = st(); o2.a[it.id] = { v: a.v, c: p[0] }; save(o2); refresh(); });
              r2.appendChild(b);
            });
            box.appendChild(r2);
          }
          var v = verdict(it, o);
          if (v) {
            var ans = el("div", "pc-ans");
            ans.innerHTML = "<span class='tag " + v.cls + "'>" + v.t + "</span>이 문장은 <b>" + (it.a ? "맞습니다" : "틀립니다") + "</b>. " + esc(it.why);
            box.appendChild(ans);
          }
          body.appendChild(box);
        });
      };
      cards.push(c);
    });

    /* ---------- 정리하기 탭: 처음 → 지금 ---------- */
    var wk = document.getElementById("wk"), sumCard = null;
    var wkPanel = wk && wk.closest ? wk.closest(".tab-panel") : null;
    if (wkPanel) {
      sumCard = el("div", "pc-card sum");
      sumCard.appendChild(el("div", "pc-head", "<b>🧭 내 생각은 어떻게 바뀌었을까</b><p>단원을 시작할 때의 생각과 이야기를 끝낸 뒤의 생각을 나란히 놓았어요. ‘아직 헷갈리는 문장’은 해설을 한 번 더 읽어 보세요.</p>"));
      var tb = el("div"); sumCard.appendChild(tb);
      var hd = wkPanel.querySelector(".stage-head");
      if (hd && hd.nextSibling) wkPanel.insertBefore(sumCard, hd.nextSibling); else wkPanel.insertBefore(sumCard, wkPanel.firstChild);
      var mBox = el("div", "pc-m"); sumCard.insertBefore(mBox, tb);
      sumCard._paint = function () {
        paintMeasure(mBox, st());
        var o = st(), cnt = { new: 0, ok: 0, no: 0, wait: 0 };
        var h = "<table class='pc-tbl'><thead><tr><th>문장</th><th>처음</th><th>이야기 뒤</th></tr></thead><tbody>";
        items.forEach(function (it) {
          var v = verdict(it, o);
          if (!v) cnt.wait++; else cnt[v.cls]++;
          h += "<tr><td><span class='pc-s' style='font-weight:600;font-size:13.5px'>" + esc(it.s) + "</span></td><td class='r'>" + esc(firstText(o.f[it.id]))
            + "</td><td>" + (v ? "<span class='pc-ans' style='display:inline;padding:0;background:none'><span class='tag " + v.cls + "'>" + v.t + "</span></span>" : "<span style='color:var(--mist)'>아직 답하지 않음</span>") + "</td></tr>";
        });
        h += "</tbody></table>";
        tb.innerHTML = h;
        tb.appendChild(el("div", "pc-foot", "생각이 바뀌었거나 새로 안 문장 " + cnt.new + " · 처음부터 맞힌 문장 " + cnt.ok + " · 아직 헷갈리는 문장 " + cnt.no + (cnt.wait ? " · 아직 다시 답하지 않은 문장 " + cnt.wait : "")));
      };
      cards.push(sumCard);
    }

    /* ---------- 오개념 변화 측정 ---------- */
    function measure(o) {
      var m = { N: 0, pre: 0, post: 0, preSW: 0, postSW: 0, fix: 0, keep: 0, slip: 0, stay: 0, wait: 0 };
      items.forEach(function (it) {
        var f = o.f[it.id];
        if (!answered(it, o) || !aftDone(o, it.id)) { m.wait++; return; }
        var a = aft(o, it.id), p0 = f.v !== -1 && (f.v === 1) === !!it.a, p1 = (a.v === 1) === !!it.a;
        m.N++; if (p0) m.pre++; if (p1) m.post++;
        if (!p0 && f.v !== -1 && f.c === "s") m.preSW++;
        if (!p1 && a.c === "s") m.postSW++;
        if (!p0 && p1) m.fix++; else if (p0 && p1) m.keep++; else if (p0 && !p1) m.slip++; else m.stay++;
      });
      m.g = m.N - m.pre > 0 ? (m.post - m.pre) / (m.N - m.pre) : null;
      return m;
    }
    function bar(cls, label, n, N) {
      var w = N ? Math.round(n / N * 100) : 0;
      return "<div class='pc-bar " + cls + "'><span>" + label + "</span><i><b style='width:" + w + "%'></b></i><span>" + n + " / " + N + "</span></div>";
    }
    function paintMeasure(box, o) {
      var m = measure(o);
      var h = "<h4>📊 오개념 변화 측정</h4>";
      if (!m.N) {
        box.innerHTML = h + "<p>아직 잴 수 있는 문장이 없어요. 단원 첫머리에서 답하고 이야기를 끝낸 뒤 다시 답한 문장이 생기면 여기에 나타나요.</p>";
        return;
      }
      h += bar("pre", "처음 맞힌 문장", m.pre, m.N) + bar("post", "이야기 뒤 맞힌 문장", m.post, m.N);
      h += "<p>확신하고 틀린 문장(굳은 오개념): 처음 <b>" + m.preSW + "개</b> → 이야기 뒤 <b>" + m.postSW + "개</b>";
      if (m.preSW) h += m.postSW < m.preSW ? " — 굳은 오개념이 줄었어요." : m.postSW === m.preSW ? " — 아직 그대로예요." : " — 오히려 늘었어요. 해설을 다시 읽어 보세요.";
      h += "</p>";
      if (m.g === null) h += "<p>처음부터 모든 문장을 맞혔어요. 바로잡을 오개념이 없었어요.</p>";
      else {
        var gp = Math.round(m.g * 100), lv = m.g >= 0.7 ? "크게 바뀜" : m.g >= 0.3 ? "어느 정도 바뀜" : m.g > 0 ? "조금 바뀜" : "바뀌지 않음";
        h += "<p>정규화 향상도 <b>g = " + m.g.toFixed(2) + "</b> (" + lv + ") — "
          + (gp < 0 ? "처음보다 오히려 맞힌 문장이 줄었어요." : "처음에 틀렸거나 몰랐던 문장 " + (m.N - m.pre) + "개 가운데 " + gp + "%를 바로잡았어요.") + "</p>";
      }
      h += "<div class='pc-types'><span>🔄 오개념 → 바른 개념 " + m.fix + "</span><span>✓ 처음부터 맞음 " + m.keep + "</span><span>↘ 맞았다가 틀림 " + m.slip + "</span><span>⚠️ 남은 오개념 " + m.stay + "</span></div>";
      if (m.wait) h += "<p style='color:var(--mist);font-size:12.5px'>두 번 모두 답한 문장 " + m.N + "개만 셌어요. 나머지 " + m.wait + "개는 처음이나 이야기 뒤 가운데 한쪽 답이 아직 없어요.</p>";
      box.innerHTML = h;
    }

    function refresh() { cards.forEach(function (c) { c._paint(); }); }
    window.addEventListener("sth-state", refresh);
    window.addEventListener("tab-shown", refresh);
    refresh();
  };

  /* 우리 반 올리기에 실을 요약: id=처음>나중 */
  window.sthPrecheckEv = function (s) {
    var o = (s || {})[KEY]; if (!o) return "";
    var f = o.f || {}, a = o.a || {}, ids = {};
    Object.keys(f).concat(Object.keys(a)).forEach(function (k) { ids[k] = 1; });
    var items = window.STH_PRECHECK_ITEMS || {};
    return Object.keys(ids).sort().map(function (k) {
      var x = f[k], ans = items[k], code = "n";
      if (x && x.v === -1) code = "0";
      else if (x && x.v != null && ans != null) code = String(((x.v === 1) === ans ? 1 : -1) * (x.c === "s" ? 2 : 1));
      var y = a[k], tail = "";
      if (y != null && ans != null) {
        if (typeof y === "number") tail = ">" + ((y === 1) === ans ? 1 : -1);
        else if (y.c) tail = ">" + ((y.v === 1) === ans ? 1 : -1) * (y.c === "s" ? 2 : 1);
      }
      return k + "=" + code + tail;
    }).join(",");
  };
})();
