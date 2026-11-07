/* =========================================================================
   우리 반 측정값 (선택 활동) — theme.js · share-config.js 다음에 불러온다.
   학생이 교실에서 직접 잰 값(1~3번)을 올리고, 반 친구들의 값과 한 줄 그림·통계로 견주어 본다.
   이야기·문제 흐름과는 따로 논다: 하지 않아도 단원 진행·채점에 아무 영향이 없다.

     sthMeasure({
       mount: "measure", unit: "is1-1-2", key: "a4",             // 단원 코드 · 측정 이름(영문·숫자)
       title: "A4 종이의 긴 변", u: "mm", digits: 0,              // 제목 · 단위 · 보여 줄 소수 자릿수
       min: 250, max: 350, step: 1, tries: 3,                    // 받을 범위 · 칸 수(1~3)
       how: "준비물과 재는 방법(HTML)",
       ref: { v: 297, label: "규격값" },                          // (선택) 참값 — 정확도를 볼 수 있을 때
       group: { label: "잰 자리", options: ["창가", "가운데", "복도 쪽"] },   // (선택) 무리로 나눠 보기
       calc: { label: "반응 시간", u: "s", digits: 2, f: function (x) { … } }, // (선택) 잰 값으로 셈한 값
       ask: ["생각할 거리 1", "생각할 거리 2"]
     });

   약속: 별명과 숫자만 올린다. 올리기는 학생이 버튼을 눌렀을 때만. 같은 반·별명·단원·측정은 덮어쓴다.
   반·별명은 ‘우리 반’ 탭에서 저장한 것을 같이 쓴다(sth-me).
   ========================================================================= */
(function () {
  "use strict";
  var ME = "sth-me";
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function me() { try { return JSON.parse(localStorage.getItem(ME) || "{}"); } catch (e) { return {}; } }
  function mean(a) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i]; return a.length ? s / a.length : NaN; }
  function median(a) { var b = a.slice().sort(function (x, y) { return x - y; }), n = b.length; return n ? (n % 2 ? b[(n - 1) / 2] : (b[n / 2 - 1] + b[n / 2]) / 2) : NaN; }
  function sd(a) { if (a.length < 2) return NaN; var m = mean(a), s = 0; for (var i = 0; i < a.length; i++) s += (a[i] - m) * (a[i] - m); return Math.sqrt(s / (a.length - 1)); }

  var CSS_DONE = false;
  function css() {
    if (CSS_DONE) return; CSS_DONE = true;
    var st = document.createElement("style");
    st.textContent = ""
      + ".ms-box{border:3px dashed var(--line);border-radius:26px;padding:18px 20px 20px;margin:28px 0 8px;background:var(--panel)}"
      + ".ms-box .ms-tag{display:inline-block;font-size:11.5px;font-weight:900;letter-spacing:.06em;color:var(--violet-700);background:var(--violet-100);border-radius:999px;padding:3px 10px;margin-bottom:6px}"
      + ".ms-box h3{margin:2px 0 6px;font-size:18px}"
      + ".ms-box .ms-how{font-size:13.5px;line-height:1.8;color:var(--ink);margin:0 0 12px}"
      + ".ms-row{display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end;margin:8px 0}"
      + ".ms-row label{display:flex;flex-direction:column;gap:4px;font-size:12px;font-weight:800;color:var(--mist)}"
      + ".ms-row input,.ms-row select{border:2px solid var(--line);border-radius:12px;padding:8px 10px;font:inherit;font-size:14px;background:var(--card-2);color:var(--ink);width:110px}"
      + ".ms-row select{width:auto}"
      + ".ms-msg{font-size:12.5px;color:var(--mist);margin-left:4px}"
      + ".ms-msg.bad{color:var(--rose-700)}"
      + ".ms-mine{font-size:13px;color:var(--ink);margin:6px 0}"
      + ".ms-plot{width:100%;height:auto;display:block;margin:10px 0 4px}"
      + ".ms-stats{display:flex;flex-wrap:wrap;gap:6px 16px;font-size:12.5px;color:var(--mist);margin:4px 0 10px}"
      + ".ms-stats b{color:var(--ink)}"
      + ".ms-ask{margin:10px 0 0;padding-left:20px;font-size:13.5px;line-height:1.8;color:var(--ink)}"
      + ".ms-note{font-size:12.5px;color:var(--mist);line-height:1.7;margin:6px 0 0}";
    document.head.appendChild(st);
  }

  window.sthMeasure = function (opt) {
    var mount = document.getElementById(opt.mount);
    if (!mount) return;
    css();
    var URL_ = (window.STH_SHARE_URL || "").trim(), HOSTS_ = window.STH_SHARE_HOSTS;
    if (URL_ && HOSTS_ && HOSTS_.length && HOSTS_.indexOf(location.hostname) < 0 && location.protocol !== "file:") URL_ = "";
    var D = opt.digits == null ? 1 : opt.digits, U = opt.u || "", N = Math.max(1, Math.min(3, opt.tries || 1));
    var SK = "ms-" + opt.key;
    function fmt(x, d) { return isFinite(x) ? (+x).toFixed(d == null ? D : d) : "–"; }
    function mine() { var s = window.sthState ? window.sthState(SK) : null; return s && s.v ? s : { v: [], g: "" }; }

    var box = el("div", "ms-box");
    box.appendChild(el("span", "ms-tag", "선택 활동 · 우리 반 측정값"));
    box.appendChild(el("h3", "display", opt.title));
    var how = el("p", "ms-how"); how.innerHTML = opt.how || ""; box.appendChild(how);

    /* 내 값 */
    var row = el("div", "ms-row"), ins = [], m0 = mine();
    for (var i = 0; i < N; i++) {
      var lb = el("label", null, (N > 1 ? (i + 1) + "번째 " : "내 값 ") + "(" + U + ")"), inp = el("input");
      inp.type = "number"; inp.inputMode = "decimal"; inp.step = opt.step || "any";
      if (opt.min != null) inp.min = opt.min; if (opt.max != null) inp.max = opt.max;
      if (m0.v[i] != null) inp.value = m0.v[i];
      lb.appendChild(inp); row.appendChild(lb); ins.push(inp);
    }
    var gsel = null;
    if (opt.group) {
      var gl = el("label", null, opt.group.label); gsel = el("select");
      gsel.appendChild(new Option("— 고르기 —", ""));
      opt.group.options.forEach(function (o) { var op = new Option(o, o); if (m0.g === o) op.selected = true; gsel.appendChild(op); });
      gl.appendChild(gsel); row.appendChild(gl);
    }
    var post = el("button", "btn primary", "📏 우리 반에 올리기"); post.type = "button";
    var re = el("button", "btn", "↻ 새로 고침"); re.type = "button";
    var msg = el("span", "ms-msg");
    row.appendChild(post); row.appendChild(re); row.appendChild(msg);
    box.appendChild(row);
    var mineLine = el("p", "ms-mine"); box.appendChild(mineLine);
    var plot = el("div"); box.appendChild(plot);
    if (opt.ask && opt.ask.length) {
      var h = el("p", "ms-note"); h.innerHTML = "<b>생각할 거리</b>"; box.appendChild(h);
      var ol = el("ol", "ms-ask"); opt.ask.forEach(function (a) { var li = el("li"); li.innerHTML = a; ol.appendChild(li); }); box.appendChild(ol);
    }
    mount.appendChild(box);

    function read() {
      var v = [], bad = "";
      ins.forEach(function (x) {
        var t = String(x.value || "").replace(",", ".").trim(); if (!t) return;
        var n = +t;
        if (!isFinite(n)) { bad = "숫자만 넣어 주세요."; return; }
        if ((opt.min != null && n < opt.min) || (opt.max != null && n > opt.max)) { bad = opt.min + " ~ " + opt.max + " " + U + " 사이의 값만 받습니다. 단위를 확인해 보세요."; return; }
        v.push(n);
      });
      return { v: v, bad: bad };
    }
    function paintMine() {
      var m = mine();
      if (!m.v.length) { mineLine.textContent = "아직 올린 값이 없습니다. 재고 나서 칸에 넣고 올리세요."; return; }
      var a = mean(m.v);
      mineLine.innerHTML = "<b>내 값</b> " + m.v.map(function (x) { return fmt(x); }).join(", ") + " " + U
        + (m.v.length > 1 ? " → 평균 <b>" + fmt(a, D + 1) + " " + U + "</b>" : "")
        + (opt.calc ? " · " + opt.calc.label + " <b>" + fmt(opt.calc.f(a), opt.calc.digits) + " " + opt.calc.u + "</b>" : "")
        + (m.g ? " · " + m.g : "");
    }

    /* 반 그림: 한 사람 = 점 하나(그 사람의 평균). 나는 크게, 참값은 세로 점선 */
    function paintPlot(items, o) {
      plot.innerHTML = "";
      var pts = items.map(function (it) { return { nick: it.nick, a: mean(it.v || []), g: it.g || "", me: it.nick === o.nick }; })
        .filter(function (p) { return isFinite(p.a); });
      if (!pts.length) { plot.appendChild(el("p", "ms-note", o.cls + "반에서 아직 올린 값이 없습니다. 첫 값을 올려 보세요.")); return; }
      var vals = pts.map(function (p) { return p.a; }), lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
      if (opt.ref) { lo = Math.min(lo, opt.ref.v); hi = Math.max(hi, opt.ref.v); }
      if (hi - lo < 1e-9) { lo -= 1; hi += 1; }
      var pad = (hi - lo) * 0.08; lo -= pad; hi += pad;
      var GR = opt.group ? opt.group.options : [""], gi = function (g) { var k = GR.indexOf(g); return k < 0 ? GR.length : k; };
      var rows = opt.group ? GR.length + (pts.some(function (p) { return gi(p.g) === GR.length; }) ? 1 : 0) : 1;
      var W = Math.max(300, Math.min(640, Math.round(plot.clientWidth || box.clientWidth - 46 || 640))), X0 = opt.group ? 92 : 20, X1 = W - 20, RH = 38, H = 34 + rows * RH + 30;
      var COLS = ["--brand", "--coral", "--violet", "--teal", "--amber"];
      function X(x) { return X0 + (x - lo) / (hi - lo) * (X1 - X0); }
      var s = '<svg class="ms-plot" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="우리 반 측정값 분포">';
      var yb = 34 + rows * RH;
      s += '<line x1="' + X0 + '" y1="' + yb + '" x2="' + X1 + '" y2="' + yb + '" stroke="var(--line)" stroke-width="2"/>';
      for (var t = 0; t <= 4; t++) {
        var xv = lo + (hi - lo) * t / 4, xx = X(xv);
        s += '<line x1="' + xx + '" y1="' + yb + '" x2="' + xx + '" y2="' + (yb + 5) + '" stroke="var(--line)" stroke-width="2"/>'
          + '<text x="' + xx + '" y="' + (yb + 20) + '" font-size="12" fill="var(--mist)" text-anchor="middle">' + fmt(xv, D) + "</text>";
      }
      if (opt.ref) {
        var rx = X(opt.ref.v);
        s += '<line x1="' + rx + '" y1="18" x2="' + rx + '" y2="' + yb + '" stroke="var(--amber)" stroke-width="2" stroke-dasharray="5 4"/>'
          + '<text x="' + rx + '" y="13" font-size="12" font-weight="800" fill="var(--amber-700)" text-anchor="middle">' + (opt.ref.label || "참값") + " " + fmt(opt.ref.v) + "</text>";
      }
      var mx = X(mean(vals));
      s += '<line x1="' + mx + '" y1="24" x2="' + mx + '" y2="' + yb + '" stroke="var(--ink)" stroke-width="1.5" opacity=".55"/>';
      for (var r = 0; r < rows; r++) {
        var cy = 34 + r * RH + RH / 2;
        if (opt.group) s += '<text x="8" y="' + (cy + 4) + '" font-size="12.5" font-weight="800" fill="var(--mist)">' + (GR[r] || "고르지 않음") + "</text>";
        var inRow = pts.filter(function (p) { return (opt.group ? gi(p.g) : 0) === r; });
        inRow.sort(function (a, b) { return a.a - b.a; });
        var lastX = -99, lift = 0;
        inRow.forEach(function (p) {
          var px = X(p.a); lift = px - lastX < 9 ? (lift + 1) % 3 : 0; lastX = px;
          var py = cy + (lift === 1 ? -9 : lift === 2 ? 9 : 0), col = "var(" + COLS[opt.group ? r % COLS.length : 0] + ")";
          s += '<circle cx="' + px.toFixed(1) + '" cy="' + py + '" r="' + (p.me ? 8 : 5.5) + '" fill="' + col + '" fill-opacity="' + (p.me ? 1 : .7) + '"' + (p.me ? ' stroke="var(--ink)" stroke-width="2.5"' : "") + "><title>" + p.nick.replace(/[<>&]/g, "") + " " + fmt(p.a, D + 1) + "</title></circle>";
          if (p.me) s += '<text x="' + px.toFixed(1) + '" y="' + (py - 13) + '" font-size="12" font-weight="900" fill="var(--ink)" text-anchor="middle">나</text>';
        });
      }
      s += "</svg>";
      plot.innerHTML = s;
      var stt = el("div", "ms-stats"), m = mean(vals), sdv = sd(vals);
      var parts = [["인원", pts.length + "명"], ["평균", fmt(m, D + 1) + " " + U], ["중앙값", fmt(median(vals), D + 1) + " " + U],
        ["가장 작은 값 ~ 큰 값", fmt(Math.min.apply(null, vals)) + " ~ " + fmt(Math.max.apply(null, vals)) + " " + U],
        ["표준 편차", isFinite(sdv) ? fmt(sdv, D + 1) + " " + U : "두 명 이상일 때"]];
      if (opt.ref) parts.push(["평균 − " + (opt.ref.label || "참값"), (m - opt.ref.v >= 0 ? "+" : "−") + fmt(Math.abs(m - opt.ref.v), D + 1) + " " + U]);
      if (opt.calc) parts.push(["평균으로 셈한 " + opt.calc.label, fmt(opt.calc.f(m), opt.calc.digits) + " " + opt.calc.u]);
      parts.forEach(function (p2) { var sp = el("span"); sp.appendChild(document.createTextNode(p2[0] + " ")); sp.appendChild(el("b", null, p2[1])); stt.appendChild(sp); });
      plot.appendChild(stt);
      if (opt.group) {
        var gs = el("div", "ms-stats");
        GR.forEach(function (g) { var a = pts.filter(function (p) { return p.g === g; }).map(function (p) { return p.a; }); if (!a.length) return; var sp = el("span"); sp.appendChild(document.createTextNode(g + " ")); sp.appendChild(el("b", null, fmt(mean(a), D + 1) + " " + U + " (" + a.length + "명)")); gs.appendChild(sp); });
        plot.appendChild(gs);
      }
      plot.appendChild(el("p", "ms-note", "점 하나가 한 사람의 평균입니다. 굵은 점이 나, 옅은 세로선이 반 평균" + (opt.ref ? ", 노란 점선이 " + (opt.ref.label || "참값") : "") + "입니다."));
    }

    function who() {
      var o = me();
      if (!URL_) { plot.innerHTML = ""; plot.appendChild(el("p", "ms-note", "선생님이 공유를 켜지 않아 내 값만 기록됩니다.")); return null; }
      if (!o.cls || !o.nick) { plot.innerHTML = ""; plot.appendChild(el("p", "ms-note", "‘우리 반’ 탭에서 반과 별명을 먼저 저장하면 반 친구들의 값과 견주어 볼 수 있습니다.")); return null; }
      return o;
    }
    function load() {
      paintMine();
      var o = who(); if (!o) return;
      plot.innerHTML = ""; plot.appendChild(el("p", "ms-note", "불러오는 중…"));
      fetch(URL_ + "?action=measures&cls=" + encodeURIComponent(o.cls) + "&unit=" + encodeURIComponent(opt.unit) + "&key=" + encodeURIComponent(opt.key))
        .then(function (r) { return r.json(); })
        .then(function (j) { if (!j.ok) throw new Error(j.error || "오류"); paintPlot(j.items || [], o); })
        .catch(function () { plot.innerHTML = ""; plot.appendChild(el("p", "ms-note", "지금은 반 값을 불러올 수 없습니다. 잠시 뒤 ↻ 새로 고침을 눌러 보세요.")); });
    }
    post.addEventListener("click", function () {
      var r = read(); msg.className = "ms-msg";
      if (r.bad) { msg.textContent = r.bad; msg.className = "ms-msg bad"; return; }
      if (!r.v.length) { msg.textContent = "잰 값을 한 칸 이상 넣어 주세요."; msg.className = "ms-msg bad"; return; }
      if (gsel && !gsel.value) { msg.textContent = "‘" + opt.group.label + "’ 칸에서 하나를 골라 주세요."; msg.className = "ms-msg bad"; return; }
      var m = { v: r.v, g: gsel ? gsel.value : "" };
      if (window.sthState) window.sthState(SK, m);
      paintMine();
      var o = who(); if (!o) { msg.textContent = "내 기기에 저장했습니다."; return; }
      post.disabled = true; msg.textContent = "올리는 중…";
      var body = JSON.stringify({ action: "measure", cls: o.cls, nick: o.nick, unit: opt.unit, key: opt.key, v: m.v, g: m.g });
      function send(tries) {
        return fetch(URL_, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: body })
          .then(function (res) { return res.json(); })
          .then(function (j) {
            if (!j.ok && /많습니다|잠시 뒤/.test(j.error || "") && tries < 3)
              return new Promise(function (ok) { setTimeout(ok, 1500 + Math.random() * 3500); }).then(function () { return send(tries + 1); });
            if (!j.ok) throw new Error(j.error || "오류");
            return j;
          });
      }
      send(0).then(function (j) { msg.textContent = j.updated ? "고쳐 올렸습니다." : "올렸습니다."; load(); })
        .catch(function (e) { msg.textContent = "올리지 못했습니다 (" + e.message + "). 잠시 뒤 다시 눌러 보세요."; msg.className = "ms-msg bad"; })
        .then(function () { post.disabled = false; });
    });
    re.addEventListener("click", load);
    /* 반 값은 상자가 처음 화면에 보일 때 한 번 불러온다(탭을 열지 않은 학생까지 뒷단을 부르지 않게) */
    paintMine();
    if (window.IntersectionObserver) {
      var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { io.disconnect(); load(); } });
      io.observe(box);
    } else load();
  };
})();
