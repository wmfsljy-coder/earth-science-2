/* =========================================================================
   이야기형 소단원(에피소드) 부품 — theme.js 다음에 불러온다.

   한 탭(소단원) = 한 에피소드. 장면이 차례로 열리고 마지막 장면(결말)에서 끝난다.
     <div class="episode" id="ep1">
       <section class="scene" data-title="사건 접수" data-auto> … </section>
       <section class="scene" data-title="현장 조사"> … </section>
     </div>
     var ep = sthStory({ root: "ep1", key: "ep1", name: "사건 파일 ①" });
     ep.clear(1);            // 그 장면의 미션을 끝냈을 때 부른다 → '다음 장면' 버튼이 열린다

   data-auto 가 붙은 장면은 읽기만 하면 넘어갈 수 있다.
   주소에 ?open=1 을 붙이면(교사용) 모든 장면이 열린다.
   진행 상황은 sthState 로 단원 기록에 함께 저장된다. sthUnit() 을 먼저 불러야 한다.
   ========================================================================= */
(function () {
  "use strict";

  var OPEN_ALL = /[?&]open=1/.test(location.search);

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /* ---------------------------------------------------------------- 에피소드 */
  window.sthStory = function (opt) {
    var root = document.getElementById(opt.root);
    if (!root) return null;
    var scenes = Array.prototype.slice.call(root.querySelectorAll(":scope > .scene"));
    var saved = window.sthState(opt.key) || {};
    var cleared = (saved.c || []).slice(0, scenes.length);
    var at = Math.min(saved.at || 0, scenes.length - 1);
    var showHooks = [];

    function persist() { window.sthState(opt.key, { c: cleared, at: at, done: isDone() }); }
    function isDone() { for (var i = 0; i < scenes.length; i++) if (!cleared[i]) return false; return true; }
    function reach() {                       // 들어갈 수 있는 마지막 장면 번호
      if (OPEN_ALL) return scenes.length - 1;
      var r = 0;
      while (r < scenes.length - 1 && cleared[r]) r++;
      return r;
    }

    /* 진행 막대 */
    var bar = el("div", "ep-bar");
    bar.appendChild(el("span", "ep-name", opt.name || "이야기"));
    var dots = scenes.map(function (s, i) {
      var d = el("button", "ep-dot", (i + 1) + "<span class='t'> " + (s.getAttribute("data-title") || "") + "</span>");
      d.type = "button";
      d.addEventListener("click", function () { go(i); });
      bar.appendChild(d);
      return d;
    });
    var reset = el("button", "ep-reset", "처음부터 다시");
    reset.type = "button";
    reset.addEventListener("click", function () {
      if (!window.confirm("이 이야기의 진행 기록을 지우고 처음부터 다시 할까요?")) return;
      window.sthState(opt.key, null);
      location.reload();
    });
    bar.appendChild(reset);
    root.insertBefore(bar, root.firstChild);

    /* 장면 머리말 · 꼬리말 */
    var nexts = scenes.map(function (s, i) {
      var head = el("div", "scene-head",
        "<div class='eyebrow'>장면 " + (i + 1) + " / " + scenes.length + "</div><h3>" + (s.getAttribute("data-title") || "") + "</h3>");
      s.insertBefore(head, s.firstChild);
      var foot = el("div", "scene-foot");
      var last = i === scenes.length - 1;
      var btn = null;
      if (!last) {
        btn = el("button", "btn primary next", "다음 장면 →");
        btn.type = "button";
        btn.addEventListener("click", function () { go(i + 1); });
        foot.appendChild(btn);
        foot.appendChild(el("span", "lock-note", ""));
      }
      s.appendChild(foot);
      return btn;
    });

    function paint() {
      var r = reach();
      scenes.forEach(function (s, i) {
        s.hidden = i !== at;
        dots[i].disabled = i > r;
        dots[i].className = "ep-dot" + (cleared[i] ? " cleared" : "") + (i === at ? " now" : "");
        if (nexts[i]) {
          var okay = !!cleared[i] || OPEN_ALL;
          nexts[i].disabled = !okay;
          nexts[i].parentNode.querySelector(".lock-note").textContent = okay ? "" : "🔒 이 장면의 미션을 끝내면 열립니다";
        }
      });
    }

    function go(i) {
      if (i < 0 || i >= scenes.length || i > reach()) return;
      at = i;
      if (scenes[i].hasAttribute("data-auto") && !cleared[i]) cleared[i] = true;
      persist(); paint();
      showHooks.forEach(function (fn) { fn(i); });
      if (window.redrawCanvases) window.redrawCanvases();
      var y = root.getBoundingClientRect().top + window.pageYOffset - 8;
      if (window.pageYOffset > y) window.scrollTo({ top: y, behavior: "smooth" });
    }

    var api = {
      clear: function (i) {
        if (cleared[i]) return;
        cleared[i] = true; persist(); paint();
        if (isDone() && typeof opt.onDone === "function") opt.onDone();
      },
      cleared: function (i) { return !!cleared[i]; },
      done: isDone,
      at: function () { return at; },
      onShow: function (fn) { showHooks.push(fn); }
    };

    if (scenes[at].hasAttribute("data-auto") && !cleared[at]) { cleared[at] = true; persist(); }
    paint();
    return api;
  };

  /* 미션 상자 상태 바꾸기 : sthMission("id", true, "문구") */
  window.sthMission = function (id, ok, html) {
    var m = document.getElementById(id);
    if (!m) return;
    m.classList.toggle("ok", !!ok);
    if (html != null) m.innerHTML = html;
  };

  /* ---------------------------------------------------------------- 분류 놀이
     opt = { mount, items:[{t:'낙엽', a:'abio', why:'…'}], buckets:[{id,label,sub}], onDone }
     토막을 누르고 → 상자를 누른다. 틀리면 되돌아오고 까닭을 알려 준다. */
  window.sthSort = function (opt) {
    var mount = document.getElementById(opt.mount);
    if (!mount) return;
    mount.classList.add("sort");
    var pool = el("div", "pool"), bucketsEl = el("div", "buckets"), msg = el("div", "msg", "토막을 하나 고른 뒤, 들어갈 상자를 누르세요.");
    mount.appendChild(pool); mount.appendChild(bucketsEl); mount.appendChild(msg);
    var held = null, left = opt.items.length, tries = 0;

    var bEls = {};
    opt.buckets.forEach(function (b) {
      var be = el("button", "bucket", "<span class='b-name'>" + b.label + "</span>" + (b.sub ? "<span class='b-sub'>" + b.sub + "</span>" : ""));
      be.type = "button";
      be.addEventListener("click", function () { drop(b); });
      bucketsEl.appendChild(be); bEls[b.id] = be;
    });

    shuffle(opt.items).forEach(function (it) {
      var t = el("button", "tok", it.t);
      t.type = "button";
      t.addEventListener("click", function () {
        if (held) held.el.classList.remove("held");
        held = { it: it, el: t }; t.classList.remove("bad"); t.classList.add("held");
        msg.textContent = "‘" + it.t.replace(/<[^>]+>/g, "") + "’ — 어느 상자일까요?";
      });
      pool.appendChild(t);
    });

    function drop(b) {
      if (!held) { msg.textContent = "먼저 위에서 토막을 하나 고르세요."; return; }
      tries++;
      var h = held;
      if (h.it.a === b.id) {
        pool.removeChild(h.el);
        bEls[b.id].appendChild(el("span", "in", h.it.t));
        msg.innerHTML = "✅ " + (h.it.why || "맞았습니다.");
        left--;
        if (left === 0) {
          msg.innerHTML = "🎉 모두 분류했습니다. (시도 " + tries + "번)" + (opt.doneText ? " " + opt.doneText : "");
          if (typeof opt.onDone === "function") opt.onDone(tries);
        }
      } else {
        h.el.classList.remove("held"); h.el.classList.add("bad");
        msg.innerHTML = "❌ 다시 생각해 보세요. " + (h.it.hint || "");
      }
      held = null;
    }
  };

  /* ---------------------------------------------------------------- 순서 맞추기
     opt = { mount, steps:['첫째','둘째',…] (정답 순서), onDone } */
  window.sthOrder = function (opt) {
    var mount = document.getElementById(opt.mount);
    if (!mount) return;
    mount.classList.add("order"); mount.classList.add("sort");
    var slots = el("div", "slots"), pool = el("div", "pool"), msg = el("div", "msg", "일어나는 순서대로 하나씩 누르세요.");
    mount.appendChild(slots); mount.appendChild(pool); mount.appendChild(msg);
    var slotEls = opt.steps.map(function () { var s = el("div", "slot", ""); slots.appendChild(s); return s; });
    var next = 0;
    shuffle(opt.steps.map(function (t, i) { return { t: t, i: i }; })).forEach(function (o) {
      var b = el("button", "tok", o.t);
      b.type = "button";
      b.addEventListener("click", function () {
        if (o.i === next) {
          slotEls[next].textContent = o.t; slotEls[next].classList.add("filled");
          pool.removeChild(b); next++;
          msg.textContent = next === opt.steps.length ? "🎉 순서를 모두 맞혔습니다." : "✅ 좋아요. 그다음은?";
          if (next === opt.steps.length && typeof opt.onDone === "function") opt.onDone();
        } else {
          b.classList.add("bad"); setTimeout(function () { b.classList.remove("bad"); }, 700);
          msg.textContent = "❌ 그 일은 아직 일어날 차례가 아닙니다. 바로 앞 단계의 결과로 무엇이 달라지는지 생각해 보세요.";
        }
      });
      pool.appendChild(b);
    });
  };

  /* ---------------------------------------------------------------- 한 문제
     opt = { mount, q, options:['…'], answer:0, why:['보기별 해설'] 또는 '해설', onDone } */
  window.sthPick = function (opt) {
    var mount = document.getElementById(opt.mount);
    if (!mount) return;
    mount.classList.add("pick");
    mount.innerHTML = "<p class='q'>" + opt.q + "</p><div class='opts'></div><div class='why'></div>";
    var box = mount.querySelector(".opts"), why = mount.querySelector(".why"), solved = false;
    opt.options.forEach(function (t, i) {
      var b = el("button", "opt", t);
      b.type = "button";
      b.addEventListener("click", function () {
        if (solved) return;
        var w = Array.isArray(opt.why) ? opt.why[i] : (i === opt.answer ? opt.why : "");
        if (i === opt.answer) {
          solved = true; b.classList.add("right");
          why.innerHTML = "✅ " + (w || "맞았습니다.");
          if (typeof opt.onDone === "function") opt.onDone();
        } else {
          b.classList.add("wrong");
          why.innerHTML = "❌ " + (w || "다시 생각해 보세요.");
        }
      });
      box.appendChild(b);
    });
  };
})();
