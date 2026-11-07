/* =========================================================================
   AI 글 오류 찾기 (선택 활동) — theme.js 다음에 불러온다.
   ‘AI에게 이렇게 물으면 나올 법한 답’을 본떠 만든 예시 글에서 틀린 문장을 찾는다.
   실제 AI를 부르지 않는다(학생 기기에서 바깥 서비스로 아무것도 보내지 않는다).
   이야기·문제 흐름과는 따로 논다: 하지 않아도 단원 진행·채점에 아무 영향이 없다.

     sthAiCheck({
       mount: "aicheck", key: "ai1",
       title: "…", ask: "AI에게 한 질문",
       lines: [ { s: "문장", bad: true, why: "왜 틀렸는지 / 바르게 고치면" }, { s: "…", bad: false, why: "맞는 까닭(의심했을 때 보여 줌)" } ],
       tryIt: "직접 해 볼 때 쓸 질문(선택)"
     });
   ========================================================================= */
(function () {
  "use strict";
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  var CSS_DONE = false;
  function css() {
    if (CSS_DONE) return; CSS_DONE = true;
    var st = document.createElement("style");
    st.textContent = ""
      + ".ai-box{border:3px dashed var(--line);border-radius:26px;padding:18px 20px 20px;margin:28px 0 8px;background:var(--panel)}"
      + ".ai-box .ai-tag{display:inline-block;font-size:11.5px;font-weight:900;letter-spacing:.06em;color:var(--violet-700);background:var(--violet-100);border-radius:999px;padding:3px 10px;margin-bottom:6px}"
      + ".ai-box h3{margin:2px 0 6px;font-size:18px}"
      + ".ai-box .ai-intro{font-size:13.5px;line-height:1.8;color:var(--ink);margin:0 0 12px}"
      + ".ai-q{border-radius:16px;background:var(--card-2);border:2px solid var(--line);padding:10px 14px;font-size:13.5px;margin:0 0 10px}"
      + ".ai-q b{color:var(--mist);font-size:12px;margin-right:6px}"
      + ".ai-ans{border-radius:16px;border:2px solid var(--violet-100);background:var(--card);padding:6px 8px}"
      + ".ai-ans .ai-who{font-size:12px;font-weight:900;color:var(--violet-700);padding:4px 6px}"
      + ".ai-line{display:flex;gap:10px;align-items:flex-start;width:100%;text-align:left;border:2px solid transparent;border-radius:12px;background:none;padding:8px 10px;font:inherit;font-size:14.5px;line-height:1.7;color:var(--ink);cursor:pointer}"
      + ".ai-line:hover{background:var(--card-2)}"
      + ".ai-line .n{flex:none;font-size:12px;font-weight:900;color:var(--mist);min-width:20px;padding-top:3px}"
      + ".ai-line.pick{border-color:var(--rose);background:var(--rose-100)}"
      + ".ai-line.pick .t{text-decoration:underline wavy var(--rose);text-underline-offset:4px}"
      + ".ai-line.hit{border-color:var(--green);background:var(--green-100)}"
      + ".ai-line.miss{border-color:var(--amber);background:var(--amber-100)}"
      + ".ai-line.false{border-color:var(--line);background:var(--card-2)}"
      + ".ai-line:disabled{cursor:default}"
      + ".ai-why{font-size:13px;line-height:1.75;margin:2px 0 8px 40px;color:var(--ink)}"
      + ".ai-why .k{font-weight:900;margin-right:4px}"
      + ".ai-row{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin:12px 0 0}"
      + ".ai-msg{font-size:13px;color:var(--ink);font-weight:800}"
      + ".ai-fix{width:100%;min-height:64px;border:2px solid var(--line);border-radius:14px;padding:10px 12px;font:inherit;font-size:14px;background:var(--card-2);color:var(--ink);box-sizing:border-box;margin-top:6px}"
      + ".ai-check{margin:8px 0 0;padding-left:20px;font-size:13px;line-height:1.85;color:var(--ink)}"
      + ".ai-note{font-size:12.5px;color:var(--mist);line-height:1.7;margin:12px 0 0}"
      + ".ai-sub{font-size:13.5px;font-weight:900;margin:16px 0 0}";
    document.head.appendChild(st);
  }

  window.sthAiCheck = function (opt) {
    var mount = document.getElementById(opt.mount);
    if (!mount) return;
    css();
    var SK = "ai-" + opt.key, L = opt.lines || [];
    function st() { var s = window.sthState ? window.sthState(SK) : null; return s && s.p ? s : { p: [], done: false, fix: "" }; }
    function save(s) { if (window.sthState) window.sthState(SK, s); }
    var S = st();

    var box = el("div", "ai-box");
    box.appendChild(el("span", "ai-tag", "선택 활동 · AI 글 오류 찾기"));
    box.appendChild(el("h3", "display", opt.title));
    var intro = el("p", "ai-intro");
    intro.innerHTML = "아래 답은 <b>AI에게 이렇게 물으면 나올 법한 답을 본떠 만든 예시</b>입니다. 실제 AI가 쓴 글은 아니며, "
      + "AI가 자주 내는 종류의 오류를 <b>일부러 몇 문장</b> 섞어 두었습니다. 틀렸다고 생각하는 문장을 눌러 표시한 뒤 <b>확인</b>을 누르세요.";
    box.appendChild(intro);
    var q = el("div", "ai-q"); q.appendChild(el("b", null, "질문")); q.appendChild(document.createTextNode(opt.ask)); box.appendChild(q);
    var ans = el("div", "ai-ans"); ans.appendChild(el("div", "ai-who", "🤖 예시 답")); box.appendChild(ans);
    var btns = [], whys = [];
    L.forEach(function (ln, i) {
      var b = el("button", "ai-line"); b.type = "button";
      b.appendChild(el("span", "n", (i + 1) + ""));
      b.appendChild(el("span", "t", ln.s));
      b.addEventListener("click", function () {
        if (S.done) return;
        var k = S.p.indexOf(i); if (k < 0) S.p.push(i); else S.p.splice(k, 1);
        save(S); paint();
      });
      var w = el("div", "ai-why"); w.hidden = true;
      ans.appendChild(b); ans.appendChild(w); btns.push(b); whys.push(w);
    });
    var row = el("div", "ai-row");
    var go = el("button", "btn primary", "확인"); go.type = "button";
    var again = el("button", "btn", "다시 하기"); again.type = "button";
    var msg = el("span", "ai-msg");
    row.appendChild(go); row.appendChild(again); row.appendChild(msg); box.appendChild(row);

    /* 확인한 뒤: 고쳐 쓰기 · 점검표 · 직접 해 보기 */
    var after = el("div"); after.hidden = true;
    after.appendChild(el("p", "ai-sub", "✏️ 틀린 문장 하나를 골라 바르게 고쳐 써 보세요 (이 기기에만 저장)"));
    var fix = el("textarea", "ai-fix"); fix.maxLength = 300; fix.placeholder = "예: ○번 문장은 … 이므로 … 로 고쳐야 한다.";
    fix.value = S.fix || "";
    fix.addEventListener("input", function () { S.fix = fix.value; save(S); });
    after.appendChild(fix);
    after.appendChild(el("p", "ai-sub", "🔎 AI 답을 볼 때 확인할 것"));
    var ck = el("ol", "ai-check");
    ["숫자와 단위가 교과서나 믿을 만한 기관의 자료와 맞는가?",
     "원인과 결과를 뒤바꾸거나, 생물·자연이 ‘목적을 가지고’ 움직이는 것처럼 설명하지 않는가?",
     "이름이 비슷한 다른 개념을 섞어 쓰지 않았는가?",
     "‘언제나’, ‘반드시’, ‘~만’처럼 너무 단정하는 말이 있지 않은가?",
     "그 말의 출처를 찾아 확인할 수 있는가? 찾을 수 없다면 그대로 믿지 않는다."].forEach(function (t) { ck.appendChild(el("li", null, t)); });
    after.appendChild(ck);
    if (opt.tryIt) {
      after.appendChild(el("p", "ai-sub", "🧪 직접 해 보기 (선생님 안내가 있을 때만)"));
      var tp = el("p", "ai-note");
      tp.innerHTML = "선생님이 허락한 AI 도구로 <b>“" + opt.tryIt + "”</b>라고 물어보고, 답에서 위 점검표에 걸리는 문장을 찾아 교과서와 견주어 보세요. "
        + "AI 서비스는 나이 제한(보통 만 13·14세 이상, 그보다 어리면 보호자 동의)이 있고, 개인 정보는 넣지 않습니다.";
      after.appendChild(tp);
    }
    box.appendChild(after);
    mount.appendChild(box);

    function paint() {
      var nb = 0, hit = 0, fa = 0;
      L.forEach(function (ln, i) {
        var b = btns[i], w = whys[i], p = S.p.indexOf(i) >= 0;
        if (ln.bad) nb++;
        b.className = "ai-line"; b.disabled = S.done; w.hidden = true; w.innerHTML = "";
        if (!S.done) { if (p) b.className += " pick"; return; }
        if (ln.bad && p) { hit++; b.className += " hit"; w.innerHTML = "<span class='k'>✅ 찾았습니다.</span>" + ln.why; }
        else if (ln.bad) { b.className += " miss"; w.innerHTML = "<span class='k'>⚠️ 놓친 오류</span>" + ln.why; }
        else if (p) { fa++; b.className += " false"; w.innerHTML = "<span class='k'>🙆 이 문장은 맞습니다.</span>" + (ln.why || ""); }
        w.hidden = !w.innerHTML;
      });
      go.disabled = S.done; after.hidden = !S.done;
      msg.textContent = S.done
        ? "틀린 문장 " + nb + "개 가운데 " + hit + "개를 찾았습니다." + (fa ? " 맞는 문장 " + fa + "개를 의심했습니다." : "") + (hit === nb && !fa ? " 완벽합니다!" : "")
        : (S.p.length ? S.p.length + "문장을 표시했습니다." : "");
    }
    go.addEventListener("click", function () {
      if (!S.p.length) { msg.textContent = "틀렸다고 생각하는 문장을 하나 이상 눌러 주세요."; return; }
      S.done = true; save(S); paint();
    });
    again.addEventListener("click", function () { S.p = []; S.done = false; save(S); paint(); });
    paint();
  };
})();
