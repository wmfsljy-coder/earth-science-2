/* =========================================================================
   science-teacher-hub 공용 스크립트 — 정본 (v2)
   저장소 12곳에 흩어져 있던 theme.js 두 버전을 하나로 합침.

   바뀐 것 하나: setupCanvas 가 캔버스를 900px에 고정하지 않고
   컨테이너 폭에 맞춰 줄어들게 한다. 그리기 좌표계는 그대로 900 기준이라
   44개 단원의 그리기 코드는 한 줄도 고치지 않아도 된다.
   ========================================================================= */
(function () {
  "use strict";
  var root = document.documentElement;

  /* ---------- 테마 ---------- */
  var STORE = "sth-theme";
  function saved() {
    try { return localStorage.getItem(STORE); } catch (e) { return null; }
  }
  function persist(v) {
    try { localStorage.setItem(STORE, v); } catch (e) { /* 시크릿 모드 등 */ }
  }
  function current() {
    var attr = root.getAttribute("data-theme");
    if (attr) return attr;
    return (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) ? "dark" : "light";
  }
  function label(mode) { return mode === "dark" ? "라이트 모드" : "다크 모드"; }

  var pref = saved();
  if (pref === "dark" || pref === "light") root.setAttribute("data-theme", pref);

  var themeBtn = document.getElementById("themeToggle");
  if (themeBtn) {
    themeBtn.textContent = label(current());
    themeBtn.addEventListener("click", function () {
      var next = current() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      persist(next);
      themeBtn.textContent = label(next);
      redrawAll();
      window.dispatchEvent(new Event("theme-changed"));
    });
  }
  if (window.matchMedia) {
    var mq = window.matchMedia("(prefers-color-scheme: dark)");
    var onScheme = function () {
      if (root.getAttribute("data-theme")) return;   // 사용자가 직접 고른 값은 건드리지 않는다
      if (themeBtn) themeBtn.textContent = label(current());
      redrawAll();
      window.dispatchEvent(new Event("theme-changed"));
    };
    if (mq.addEventListener) mq.addEventListener("change", onScheme);
    else if (mq.addListener) mq.addListener(onScheme);
  }

  /* ---------- 탭 ---------- */
  var tabBtns = document.querySelectorAll(".tab-btn");
  var panels = document.querySelectorAll(".tab-panel");
  tabBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var idx = btn.getAttribute("data-tab");
      tabBtns.forEach(function (b) { b.classList.toggle("active", b === btn); });
      panels.forEach(function (p) { p.hidden = p.getAttribute("data-panel") !== idx; });
      window.dispatchEvent(new CustomEvent("tab-shown", { detail: idx }));
    });
  });

  /* ---------- 유틸 ---------- */
  window.cssVar = function (name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  };

  /* ---------- 캔버스 ----------------------------------------------------
     예전 방식은 canvas.style.width 를 900px 로 못박아, 폰에서 그림의 3분의 2가
     화면 밖으로 나갔다. 이제는 표시 크기를 CSS(100%)에 맡기고,
     내부 픽셀 버퍼만 900×H(×화면배율)로 유지한다.
       · 그리기 코드는 계속 가로 900 좌표계를 쓰면 된다
       · 창 크기가 바뀌어도 다시 그릴 필요가 없다 (브라우저가 축소해 준다)
       · 마우스/터치 좌표 변환에 쓰는 canvas._w, canvas._h 도 그대로 유지
     한 번만 그리는 화면에서 테마 전환에도 색을 따라가게 하려면
     canvas._redraw = 그리기함수  로 등록해 두면 된다. --------------------- */
  var canvases = [];

  window.setupCanvas = function (canvas) {
    var ctx = canvas.getContext("2d");
    if (canvas._dprSet) return ctx;

    var W = canvas.width, H = canvas.height;          // 논리 좌표계 (지금까지의 900×H)
    var dpr = Math.min(window.devicePixelRatio || 1, 2);   // 저사양 태블릿 메모리 보호

    canvas.style.width = "100%";                      // 표시 크기는 컨테이너가 정한다
    canvas.style.height = "auto";
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.scale(dpr, dpr);

    canvas._dprSet = true;
    canvas._w = W;
    canvas._h = H;
    canvases.push(canvas);
    return ctx;
  };

  function redrawAll() {
    for (var i = 0; i < canvases.length; i++) {
      if (typeof canvases[i]._redraw === "function") canvases[i]._redraw();
    }
  }
  window.redrawCanvases = redrawAll;

  /* ---------- 그리기 도우미 ---------- */
  window.drawArrow = function (ctx, x1, y1, x2, y2, head) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    var ang = Math.atan2(y2 - y1, x2 - x1);
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - head * Math.cos(ang - 0.45), y2 - head * Math.sin(ang - 0.45));
    ctx.lineTo(x2 - head * Math.cos(ang + 0.45), y2 - head * Math.sin(ang + 0.45));
    ctx.closePath();
    ctx.fill();
  };

  window.roundRect = function (ctx, x, y, w, h, r) {
    if (typeof r === "undefined") r = 6;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };

  /* 구형 기기(크롬 98 이하 등)에는 ctx.roundRect 가 없다 */
  if (window.CanvasRenderingContext2D && !CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
      if (typeof r === "undefined") r = 6;
      if (Array.isArray(r)) r = r.length ? r[0] : 6;
      window.roundRect(this, x, y, w, h, r);
      return this;
    };
  }
})();
