/* =========================================================================
   바깥 자료 카드 — sthLink  (theme.js 다음에 불러온다. sthState 를 쓴다.)

   교과서 밖의 진짜 자료(기관 누리집, 관측소 위성 사진)를 수업에 들이되,
   '눌러 보고 끝'이 되지 않게 한다.
     ① 가기 전에 질문(찾아올 것) → ② 새 창에서 다녀오기 → ③ 찾아온 것을 한 문장으로
   한 문장은 학습 기록(sthState)에 남아 정리하기·우리 반 공유로 이어진다.

   쓰는 법 — 쪽 안 어디든:
     <div data-link='{"id":"mlo","title":"마우나로아 이산화 탄소 그래프","src":"NOAA 지구감시연구소",
          "url":"https://gml.noaa.gov/ccgg/trends/","ask":"가장 최근 달의 농도는 몇 ppm 인가요?"}'></div>
     <div data-map='{"id":"mlo-map","name":"마우나로아 관측소","lat":19.536,"lng":-155.576,"zoom":15,
          "ask":"관측소는 섬의 어디에, 얼마나 높은 곳에 있나요?"}'></div>
   · min (선택): 한 문장의 최소 글자 수(기본 8). 이보다 짧으면 '다녀옴'으로 치지 않는다.
   · 지도: assets/share-config.js 에 window.STH_MAPS_KEY 가 있으면 공식 Maps Embed API 로
     쪽 안에 위성 사진을 띄운다(눌렀을 때만 불러옴). 키는 Google Cloud 에서
     'Maps Embed API' 만 허용하고, HTTP 리퍼러를 내 Pages 주소로 제한해 둔다.
     키가 없으면 구글 지도 공식 주소를 새 창으로 연다.
   · 다녀왔는지 알고 싶으면: window.sthLinkOn("mlo", function (note) { … })  /  window.sthLinkIsDone("mlo")
   · 페이지는 학생이 바깥에서 무엇을 봤는지 알 수 없다. 판정은 늘 문항·조작값으로 하고, 한 문장은 기록용이다.
   · 이야기 속 지명: <span data-place=위도,경도,줌,종류>지명</span>  종류 s 위성·핀, r 지도·핀, sv 위성(핀 없이), rv 지도(핀 없이)
     지명 옆에 📍 가 붙고, 누르면 그 문단 아래에 지도가 펼쳐진다(키가 없으면 구글 지도를 새 창으로). 기록·판정은 없다.
   ========================================================================= */
(function () {
  "use strict";
  if (window.sthLinkScan) return;
  var css = ".sth-link{margin:12px 0;border:1px solid var(--line);border-left:4px solid var(--brand);border-radius:14px;background:var(--card);padding:12px 14px}"
    + ".sth-link .sl-top{display:flex;flex-wrap:wrap;gap:6px 10px;align-items:baseline}"
    + ".sth-link .sl-k{font-size:11.5px;font-weight:800;color:var(--brand-700)}"
    + ".sth-link .sl-t{font-size:14.5px;font-weight:800;color:var(--ink)}"
    + ".sth-link .sl-src{font-size:11.5px;color:var(--mist)}"
    + ".sth-link .sl-ask{margin:8px 0 10px;font-size:13.5px;color:var(--ink)}"
    + "[data-place]{cursor:pointer;border-bottom:1.5px dotted var(--brand);white-space:nowrap}"
    + "[data-place]::after{content:'📍';font-size:.82em;margin-left:2px}"
    + "[data-place]:hover,[data-place]:focus-visible{background:var(--brand-100);outline:none;border-radius:4px}"
    + ".sth-place-pop{margin:8px 0 12px;border:1px solid var(--line);border-left:4px solid var(--brand);border-radius:14px;background:var(--card);padding:10px 12px}"
    + ".sth-place-pop .sp-top{display:flex;flex-wrap:wrap;gap:6px 10px;align-items:center;margin-bottom:8px}"
    + ".sth-place-pop .sp-t{font-size:14px;font-weight:800;color:var(--ink)}"
    + ".sth-place-pop .btn{padding:5px 12px;font-size:12.5px}"
    + ".sth-place-pop iframe{display:block;width:100%;height:300px;border:0;border-radius:10px}"
    + ".sth-link .sl-ask b{color:var(--brand-700)}"
    + ".sth-link .sl-btns{display:flex;flex-wrap:wrap;gap:8px}"
    + ".sth-link .sl-btns a.btn{text-decoration:none}"
    + ".sth-link iframe{display:block;width:100%;height:320px;border:0;border-radius:10px;margin-top:10px}"
    + ".sth-link .sl-note{margin-top:10px}"
    + ".sth-link .sl-note label{display:block;font-size:12.5px;font-weight:700;color:var(--mist);margin-bottom:4px}"
    + ".sth-link .sl-note textarea{width:100%;min-height:52px;box-sizing:border-box;border:1px solid var(--line);border-radius:10px;padding:8px 10px;font:inherit;font-size:13.5px;background:var(--panel);color:var(--ink)}"
    + ".sth-link .sl-st{font-size:12px;margin-top:4px;color:var(--mist)}"
    + ".sth-link.done{border-left-color:var(--green-700)}"
    + ".sth-link.done .sl-st{color:var(--green-700);font-weight:700}";
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  var HOOK = {};
  function rec(id) { var r = window.sthState ? window.sthState("link_" + id) : null; return r && typeof r === "object" ? r : null; }
  window.sthLinkIsDone = function (id) { var r = rec(id); return !!(r && r.ok); };
  window.sthLinkOn = function (id, fn) { (HOOK[id] = HOOK[id] || []).push(fn); var r = rec(id); if (r && r.ok) { try { fn(r.note); } catch (e) {} } };
  function fire(id, note) { (HOOK[id] || []).forEach(function (fn) { try { fn(note); } catch (e) {} }); }

  function mapsUrl(p) {
    return "https://www.google.com/maps/@?api=1&map_action=map&center=" + p.lat + "," + p.lng + "&zoom=" + (p.zoom || 12) + "&basemap=" + (p.type === "roadmap" ? "roadmap" : "satellite");
  }
  function embedUrl(p, key) {
    return "https://www.google.com/maps/embed/v1/view?key=" + encodeURIComponent(key) + "&center=" + p.lat + "," + p.lng + "&zoom=" + (p.zoom || 12) + "&maptype=" + (p.type === "roadmap" ? "roadmap" : "satellite") + "&language=ko";
  }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function ll(p) { return (p.lat >= 0 ? "북위 " : "남위 ") + Math.abs(p.lat).toFixed(2) + "° · " + (p.lng >= 0 ? "동경 " : "서경 ") + Math.abs(p.lng).toFixed(2) + "°"; }

  function render(node, isMap) {
    if (node.getAttribute("data-sl-done")) return;
    var p; try { p = JSON.parse(node.getAttribute(isMap ? "data-map" : "data-link")); } catch (e) { return; }
    if (!p || !p.id) return;
    node.setAttribute("data-sl-done", "1");
    node.className += " sth-link";
    var min = p.min || 8, r = rec(p.id) || {};
    var top = el("div", "sl-top");
    top.appendChild(el("span", "sl-k", isMap ? "🛰 현장 보기" : "🔗 진짜 자료"));
    var t = el("span", "sl-t"); t.textContent = isMap ? p.name : p.title; top.appendChild(t);
    var src = el("span", "sl-src"); src.textContent = isMap ? ll(p) : (p.src || ""); top.appendChild(src);
    node.appendChild(top);
    if (p.ask) node.appendChild(el("div", "sl-ask", "<b>가서 찾아올 것</b> " + p.ask));
    var btns = el("div", "sl-btns"); node.appendChild(btns);
    var key = String(window.STH_MAPS_KEY || "").trim();
    var opened = !!r.at;
    function markOpen() { if (!opened) { opened = true; save(ta.value, true); } ta.disabled = false; }
    var a = el("a", "btn"); a.target = "_blank"; a.rel = "noopener";
    a.href = isMap ? mapsUrl(p) : p.url;
    a.textContent = isMap ? "구글 지도에서 열기 ↗" : "새 창에서 열기 ↗";
    a.setAttribute("aria-label", (isMap ? p.name + " 위성 사진을 " : (p.title || "") + " 자료를 ") + "새 창에서 엽니다");
    a.addEventListener("click", markOpen);
    if (isMap && key) {
      var show = el("button", "btn"); show.type = "button"; show.textContent = "여기서 위성 사진 보기";
      show.addEventListener("click", function () {
        var f = node.querySelector("iframe");
        if (f) { f.parentNode.removeChild(f); show.textContent = "여기서 위성 사진 보기"; return; }
        f = document.createElement("iframe");
        f.src = embedUrl(p, key); f.loading = "lazy"; f.referrerPolicy = "no-referrer-when-downgrade";
        f.title = p.name + " 위성 사진"; f.setAttribute("allowfullscreen", "");
        node.insertBefore(f, note); show.textContent = "위성 사진 닫기"; markOpen();
      });
      btns.appendChild(show);
    }
    btns.appendChild(a);
    var note = el("div", "sl-note");
    var lb = el("label", null, "다녀와서 한 문장"); var ta = document.createElement("textarea");
    var tid = "sl-" + p.id; ta.id = tid; lb.setAttribute("for", tid);
    ta.placeholder = opened ? "찾아온 것을 한 문장으로 적어 보세요." : "먼저 자료를 열어 보세요.";
    ta.value = r.note || ""; ta.disabled = !opened;
    var stx = el("div", "sl-st"); stx.setAttribute("aria-live", "polite");
    note.appendChild(lb); note.appendChild(ta); note.appendChild(stx); node.appendChild(note);
    function paint(ok) { node.classList.toggle("done", !!ok); stx.textContent = ok ? "✓ 기록했습니다" : (opened ? "한 문장(" + min + "자 이상)을 적으면 기록됩니다." : ""); }
    function save(v, quiet) {
      v = String(v || "").trim();
      var ok = opened && v.length >= min, was = !!(rec(p.id) || {}).ok;
      if (window.sthState) window.sthState("link_" + p.id, { at: (rec(p.id) || {}).at || Date.now(), note: v.slice(0, 200), ok: ok ? 1 : 0 });
      paint(ok); ta.placeholder = "찾아온 것을 한 문장으로 적어 보세요.";
      if (ok && !was && !quiet) fire(p.id, v);
    }
    var tmr = null;
    ta.addEventListener("input", function () { clearTimeout(tmr); tmr = setTimeout(function () { save(ta.value); }, 400); });
    ta.addEventListener("blur", function () { clearTimeout(tmr); save(ta.value); });
    paint(r.ok);
  }
  /* ---- 이야기 속 지명 📍 ---- */
  function placeOf(n) {
    var a = String(n.getAttribute("data-place") || "").split(",");
    var p = { lat: +a[0], lng: +a[1], zoom: +a[2] || 12, k: a[3] || "s", name: (n.textContent || "").replace(/\s+/g, " ").trim() };
    return isFinite(p.lat) && isFinite(p.lng) ? p : null;
  }
  function placeOpenUrl(p) {
    if (/v$/.test(p.k)) return mapsUrl({ lat: p.lat, lng: p.lng, zoom: p.zoom, type: p.k.charAt(0) === "r" ? "roadmap" : "satellite" });
    return "https://www.google.com/maps/search/?api=1&query=" + p.lat + "," + p.lng;
  }
  function placeEmbed(p, key) {
    var t = p.k.charAt(0) === "r" ? "roadmap" : "satellite";
    if (/v$/.test(p.k)) return "https://www.google.com/maps/embed/v1/view?key=" + encodeURIComponent(key) + "&center=" + p.lat + "," + p.lng + "&zoom=" + p.zoom + "&maptype=" + t + "&language=ko";
    return "https://www.google.com/maps/embed/v1/place?key=" + encodeURIComponent(key) + "&q=" + p.lat + "," + p.lng + "&zoom=" + p.zoom + "&maptype=" + t + "&language=ko";
  }
  function placeToggle(n) {
    var p = placeOf(n); if (!p) return;
    var key = String(window.STH_MAPS_KEY || "").trim();
    if (!key) { window.open(placeOpenUrl(p), "_blank", "noopener"); return; }
    if (n._pop && n._pop.parentNode) { n._pop.parentNode.removeChild(n._pop); n._pop = null; n.setAttribute("aria-expanded", "false"); return; }
    /* 지도는 지명이 든 문단(블록) 바로 아래에 편다 — 굵은 글씨 같은 줄 안 요소 안에 끼우면 문장이 갈라진다 */
    var host = n.parentNode;
    while (host && host !== document.body && /^inline/.test(getComputedStyle(host).display)) host = host.parentNode;
    /* 말풍선처럼 옆으로 늘어선 줄(flex·grid) 안이면 그 줄 전체 아래로 */
    while (host && host.parentNode && host.parentNode !== document.body && /flex|grid/.test(getComputedStyle(host.parentNode).display)) host = host.parentNode;
    if (!host || host === document.body) host = n.parentNode;
    var pop = el("div", "sth-place-pop");
    var top = el("div", "sp-top");
    var t = el("span", "sp-t"); t.textContent = "📍 " + p.name; top.appendChild(t);
    var s = el("span", "sl-src"); s.textContent = ll(p); top.appendChild(s);
    var a = el("a", "btn"); a.href = placeOpenUrl(p); a.target = "_blank"; a.rel = "noopener"; a.textContent = "구글 지도에서 열기 ↗"; top.appendChild(a);
    var x = el("button", "btn"); x.type = "button"; x.textContent = "닫기"; x.addEventListener("click", function () { placeToggle(n); n.focus && n.focus(); }); top.appendChild(x);
    pop.appendChild(top);
    var f = document.createElement("iframe");
    f.src = placeEmbed(p, key); f.loading = "lazy"; f.referrerPolicy = "no-referrer-when-downgrade";
    f.title = p.name + " 지도"; f.setAttribute("allowfullscreen", "");
    pop.appendChild(f);
    host.parentNode.insertBefore(pop, host.nextSibling);
    n._pop = pop; n.setAttribute("aria-expanded", "true");
  }
  document.addEventListener("click", function (e) {
    var n = e.target && e.target.closest ? e.target.closest("[data-place]") : null;
    if (!n) return;
    e.preventDefault(); e.stopPropagation(); placeToggle(n);
  }, true);
  document.addEventListener("keydown", function (e) {
    var n = e.target && e.target.getAttribute && e.target.getAttribute("data-place") != null ? e.target : null;
    if (n && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); placeToggle(n); }
  });
  function tagPlaces(root) {
    Array.prototype.forEach.call(root.querySelectorAll("[data-place]:not([data-sp])"), function (n) {
      n.setAttribute("data-sp", "1"); n.setAttribute("role", "button"); n.setAttribute("tabindex", "0");
      n.setAttribute("aria-expanded", "false");
      n.setAttribute("aria-label", (n.textContent || "").trim() + " — 지도 보기");
    });
  }
  window.sthLinkScan = function (root) {
    tagPlaces(root || document);
    root = root || document;
    Array.prototype.forEach.call(root.querySelectorAll("[data-link]"), function (n) { render(n, false); });
    Array.prototype.forEach.call(root.querySelectorAll("[data-map]"), function (n) { render(n, true); });
  };
  function go() { window.sthLinkScan(document); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", go); else go();
  /* 실험실·문항처럼 나중에 그려지는 부분도 잡는다 */
  try { new MutationObserver(function () { go(); }).observe(document.body || document.documentElement, { childList: true, subtree: true }); } catch (e) {}
})();
