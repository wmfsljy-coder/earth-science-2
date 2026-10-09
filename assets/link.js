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
    + "[data-place],[data-view]{cursor:pointer;border-bottom:1.5px dotted var(--brand);white-space:nowrap}"
    + "[data-place]::after{content:'📍';font-size:.82em;margin-left:2px}"
    + "[data-sp=sky]::after{content:'🔭';font-size:.82em;margin-left:2px}"
    + "[data-sp=eyes]::after{content:'🪐';font-size:.82em;margin-left:2px}"
    + "[data-sp=earth]::after{content:'🌐';font-size:.82em;margin-left:2px}"
    + "[data-sp=sun]::after{content:'☀️';font-size:.82em;margin-left:2px}"
    + "[data-sp=mymap]::after{content:'🗺';font-size:.82em;margin-left:2px}"
    + "[data-place]:hover,[data-place]:focus-visible,[data-view]:hover,[data-view]:focus-visible{background:var(--brand-100);outline:none;border-radius:4px}"
    + ".sth-place-pop iframe.tall{height:420px}"
    + ".sth-place-pop img{display:block;max-width:min(100%,520px);margin:0 auto;border-radius:10px}"
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
  /* ---- 이야기 속 지명 📍 · 천체 🔭 · 지금의 지구 🌐 ----
     <span data-place=위도,경도,줌,종류>지명</span>   종류 s 위성·핀, r 지도·핀, sv 위성(핀 없이), rv 지도(핀 없이)
     <span data-view="종류:값">이름</span>
       sky:대상|시야(도)|사진   알라딘 하늘 지도(CDS) — 별·성운·은하의 실제 사진(기본 DSS, 넓은 하늘은 P/Mellinger/color)
       star:대상          스텔라리움 웹 — 오늘 밤 우리 하늘에서 그 별이 어디 있는지
       eyes:대상          NASA Eyes on the Solar System — 행성·소행성·탐사선 3D
       exo:행성           NASA Eyes on Exoplanets — 외계 행성계 3D
       earth:주소#뒤      earth.nullschool.net — 지금의 바람·해류·수온(몇 시간마다 새 자료)
       mymap:지도ID|위도,경도|줌|출처   구글 내 지도(My Maps) — 예: 판 경계·판 이름·해구 지도(키 필요 없음)
       sun:hmi|171|c3|aurora   오늘의 태양(SDO 흑점 / 코로나) · SOHO 코로나그래프 · NOAA 오로라 예보 */
  var VIEW = {
    sky: function (v) { var a = v.split("|"); var u = "https://aladin.cds.unistra.fr/AladinLite/?target=" + encodeURIComponent(a[0]) + "&fov=" + (a[1] || 2) + "&survey=" + encodeURIComponent(a[2] || "P/DSS2/color");
      return { ico: "🔭", src: "알라딘 하늘 지도 · CDS · DSS 사진", url: u, embed: u }; },
    star: function (v) { var u = "https://stellarium-web.org/skysource/" + encodeURIComponent(v);
      return { ico: "🔭", src: "스텔라리움 웹 · 오늘 밤 하늘", url: u, embed: u }; },
    eyes: function (v) { var u = "https://eyes.nasa.gov/apps/solar-system/#/" + v;
      return { ico: "🪐", src: "NASA Eyes on the Solar System", url: u, embed: u }; },
    exo: function (v) { var u = "https://eyes.nasa.gov/apps/exo/#/planet/" + v;
      return { ico: "🪐", src: "NASA Eyes on Exoplanets", url: u, embed: u }; },
    earth: function (v) { var u = "https://earth.nullschool.net/#" + v;
      return { ico: "🌐", src: "earth.nullschool.net · 지금의 지구(몇 시간마다 새 자료)", url: u, embed: u }; },
    mymap: function (v) { var a = v.split("|"), q = "mid=" + encodeURIComponent(a[0]) + (a[1] ? "&ll=" + a[1] : "") + (a[2] ? "&z=" + a[2] : "");
      return { ico: "🗺", src: a[3] || "구글 내 지도", url: "https://www.google.com/maps/d/viewer?" + q, embed: "https://www.google.com/maps/d/embed?" + q }; },
    sun: function (v) {
      if (v === "c3") { var c = "https://soho.nascom.nasa.gov/data/realtime/c3/512/latest.jpg";
        return { ico: "☀️", src: "SOHO 코로나그래프 LASCO C3 · 가장 최근 사진(가운데 원판이 해를 가린다)", url: c, img: c }; }
      if (v === "aurora") { var o = "https://services.swpc.noaa.gov/images/animations/ovation/north/latest.jpg";
        return { ico: "☀️", src: "NOAA 우주기상예보센터 · 지금의 북반구 오로라 예보", url: o, img: o }; }
      var u = "https://sdo.gsfc.nasa.gov/assets/img/latest/latest_512_" + (v === "171" ? "0171" : "HMIIF") + ".jpg";
      return { ico: "☀️", src: "NASA SDO · 오늘의 태양" + (v === "171" ? "(코로나, 자외선 171 Å)" : "(가시광선, 흑점)"), url: u, img: u }; }
  };
  function viewOf(n) {
    var name = (n.textContent || "").replace(/\s+/g, " ").trim(), v;
    if (n.hasAttribute("data-place")) {
      var a = String(n.getAttribute("data-place") || "").split(",");
      var p = { lat: +a[0], lng: +a[1], zoom: +a[2] || 12, k: a[3] || "s" };
      if (!isFinite(p.lat) || !isFinite(p.lng)) return null;
      var t = p.k.charAt(0) === "r" ? "roadmap" : "satellite", key = String(window.STH_MAPS_KEY || "").trim(), view = /v$/.test(p.k);
      return { ico: "📍", name: name, src: ll(p), btn: "구글 지도에서 열기 ↗",
        url: view ? mapsUrl({ lat: p.lat, lng: p.lng, zoom: p.zoom, type: t }) : "https://www.google.com/maps/search/?api=1&query=" + p.lat + "," + p.lng,
        embed: !key ? null : "https://www.google.com/maps/embed/v1/" + (view ? "view" : "place") + "?key=" + encodeURIComponent(key) + (view ? "&center=" : "&q=") + p.lat + "," + p.lng + "&zoom=" + p.zoom + "&maptype=" + t + "&language=ko" };
    }
    var s = String(n.getAttribute("data-view") || ""), i = s.indexOf(":");
    if (i < 0 || !VIEW[s.slice(0, i)]) return null;
    v = VIEW[s.slice(0, i)](s.slice(i + 1)); v.name = name; v.btn = "새 창에서 크게 보기 ↗";
    return v;
  }
  function placeToggle(n) {
    var p = viewOf(n); if (!p) return;
    if (!p.embed && !p.img) { window.open(p.url, "_blank", "noopener"); return; }
    if (n._pop && n._pop.parentNode) { n._pop.parentNode.removeChild(n._pop); n._pop = null; n.setAttribute("aria-expanded", "false"); return; }
    /* 지도는 지명이 든 문단(블록) 바로 아래에 편다 — 굵은 글씨 같은 줄 안 요소 안에 끼우면 문장이 갈라진다 */
    var host = n.parentNode;
    while (host && host !== document.body && /^inline/.test(getComputedStyle(host).display)) host = host.parentNode;
    /* 말풍선처럼 옆으로 늘어선 줄(flex·grid) 안이면 그 줄 전체 아래로 */
    while (host && host.parentNode && host.parentNode !== document.body && /flex|grid/.test(getComputedStyle(host.parentNode).display)) host = host.parentNode;
    if (!host || host === document.body) host = n.parentNode;
    var pop = el("div", "sth-place-pop");
    var top = el("div", "sp-top");
    var t = el("span", "sp-t"); t.textContent = p.ico + " " + p.name; top.appendChild(t);
    var s = el("span", "sl-src"); s.textContent = p.src; top.appendChild(s);
    var a = el("a", "btn"); a.href = p.url; a.target = "_blank"; a.rel = "noopener"; a.textContent = p.btn; top.appendChild(a);
    var x = el("button", "btn"); x.type = "button"; x.textContent = "닫기"; x.addEventListener("click", function () { placeToggle(n); n.focus && n.focus(); }); top.appendChild(x);
    pop.appendChild(top);
    if (p.img) {
      var im = document.createElement("img"); im.src = p.img; im.alt = p.name + " — " + p.src; im.loading = "lazy";
      pop.appendChild(im);
    } else {
      var f = document.createElement("iframe");
      f.src = p.embed; f.loading = "lazy"; f.referrerPolicy = "no-referrer-when-downgrade";
      f.title = p.name + " — " + p.src; f.setAttribute("allowfullscreen", "");
      if (p.ico !== "📍") f.className = "tall";
      pop.appendChild(f);
    }
    host.parentNode.insertBefore(pop, host.nextSibling);
    n._pop = pop; n.setAttribute("aria-expanded", "true");
  }
  var SEL = "[data-place],[data-view]";
  document.addEventListener("click", function (e) {
    var n = e.target && e.target.closest ? e.target.closest(SEL) : null;
    if (!n) return;
    e.preventDefault(); e.stopPropagation(); placeToggle(n);
  }, true);
  document.addEventListener("keydown", function (e) {
    var n = e.target && e.target.matches && e.target.matches(SEL) ? e.target : null;
    if (n && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); placeToggle(n); }
  });
  function tagPlaces(root) {
    Array.prototype.forEach.call(root.querySelectorAll("[data-place]:not([data-sp]),[data-view]:not([data-sp])"), function (n) {
      var v = n.getAttribute("data-view") || "";
      n.setAttribute("data-sp", /^(sky|star)/.test(v) ? "sky" : /^(eyes|exo)/.test(v) ? "eyes" : /^earth/.test(v) ? "earth" : /^sun/.test(v) ? "sun" : /^mymap/.test(v) ? "mymap" : "1");
      n.setAttribute("role", "button"); n.setAttribute("tabindex", "0");
      n.setAttribute("aria-expanded", "false");
      n.setAttribute("aria-label", (n.textContent || "").trim() + (n.hasAttribute("data-place") ? " — 지도 보기" : " — 실제 모습 보기"));
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
