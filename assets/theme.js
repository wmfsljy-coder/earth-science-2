(function () {
  "use strict";
  var root = document.documentElement;
  var themeBtn = document.getElementById("themeToggle");
  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      var cur = root.getAttribute("data-theme");
      var next = cur === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      themeBtn.textContent = next === "dark" ? "라이트 모드" : "다크 모드";
    });
  }

  var tabBtns = document.querySelectorAll(".tab-btn");
  var panels = document.querySelectorAll(".tab-panel");
  tabBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var idx = btn.getAttribute("data-tab");
      tabBtns.forEach(function (b) { b.classList.toggle("active", b === btn); });
      panels.forEach(function (p) { p.hidden = p.getAttribute("data-panel") !== idx; });
    });
  });

  window.cssVar = function (name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  };

  window.setupCanvas = function (canvas) {
    var dpr = window.devicePixelRatio || 1;
    var w = canvas.width, h = canvas.height;
    if (canvas._dprSet) return canvas.getContext("2d");
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    var ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    canvas._dprSet = true;
    canvas._w = w; canvas._h = h;
    return ctx;
  };

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
})();
