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
    + "[data-sp=mol]::after{content:'🧬';font-size:.82em;margin-left:2px}"
    + "[data-sp=sim]::after{content:'🧪';font-size:.82em;margin-left:2px}"
    + "[data-sp=data]::after{content:'📈';font-size:.82em;margin-left:2px}"
    + "[data-sp=elem]::after{content:'⚗️';font-size:.82em;margin-left:2px}"
    + "[data-sp=fossil]::after{content:'🦴';font-size:.82em;margin-left:2px}"
    + "[data-sp=doc]::after{content:'📜';font-size:.82em;margin-left:2px}"
    + "[data-sp=out]::after{content:'🔗';font-size:.82em;margin-left:2px}"
    + "[data-place]:hover,[data-place]:focus-visible,[data-view]:hover,[data-view]:focus-visible{background:var(--brand-100);outline:none;border-radius:4px}"
    + ".sth-place-pop iframe.tall{height:420px}"
    + ".try-box{margin:10px 0 14px;padding:12px 16px;border:2px dashed var(--teal-dim);border-radius:16px;background:var(--card)}"
    + ".try-h{font-size:14px;color:var(--ink)}.try-h span{font-size:12.5px;color:var(--mist)}"
    + ".try-t{margin:8px 0 6px;padding-left:20px;font-size:13.5px;line-height:1.75;color:var(--ink)}"
    + ".try-q{font-size:13.5px;font-weight:800;color:var(--ink);margin:4px 0 8px}"
    + ".try-b{display:flex;flex-wrap:wrap;gap:6px}.try-b .btn{padding:6px 13px;font-size:12.5px}"
    + ".try-box iframe{display:block;width:100%;height:440px;border:0;border-radius:10px;margin-top:10px;background:#000}"
    + ".try-n label{display:flex;flex-direction:column;gap:4px;font-size:12px;font-weight:800;color:var(--mist);margin-top:10px}"
    + ".try-n input{border:2px solid var(--line);border-radius:10px;padding:7px 10px;font:inherit;font-size:13.5px;background:var(--card-2);color:var(--ink)}"
    + ".try-s{font-size:11px;color:var(--mist);margin:6px 0 0}"
    + ".try-box.mini{border-style:solid;border-width:1px;padding:8px 12px;margin:8px 0 12px;background:var(--card-2)}.try-box.mini .try-s{display:none}.try-box.mini.ext .try-s{display:block}"
    + ".try-crop{position:relative;overflow:hidden;margin:10px auto 0;max-width:100%;border-radius:10px;background:#fff}.try-crop iframe{position:absolute;left:0;top:0;border:0;margin:0;border-radius:0;transform-origin:0 0;background:#fff}"
    + "[data-sp=who]::after{content:'📇';font-size:.82em;margin-left:2px}[data-sp=law]::after{content:'📐';font-size:.82em;margin-left:2px}"
    + ".pc{display:grid;grid-template-columns:96px 1fr;gap:12px;margin:4px 0}.pc.law{grid-template-columns:1fr}"
    + ".pc img{width:96px;height:118px;object-fit:cover;border-radius:10px;background:var(--card-2)}"
    + ".pc-nm{font-size:16px;font-weight:900;color:var(--ink)}"
    + ".pc-meta{font-size:12.5px;color:var(--mist);margin:2px 0 6px;display:flex;flex-wrap:wrap;gap:4px 12px}.pc-meta b{color:var(--ink)}"
    + ".pc-nobel{font-size:11.5px;font-weight:900;color:var(--amber-700);background:var(--amber-100);border-radius:999px;padding:1px 8px}"
    + ".pc-sum{font-size:13.5px;line-height:1.75;color:var(--ink);margin:0 0 8px}"
    + ".pc-warn{font-size:12.5px;font-weight:800;color:var(--rose-700);margin:0 0 8px}"
    + ".pc-btns{display:flex;flex-wrap:wrap;gap:6px}.pc-btns .btn{padding:5px 12px;font-size:12.5px}"
    + ".pc-src{font-size:11.5px;color:var(--mist);margin:6px 0 0}"
    + ".pc-pop{position:relative}.pc-pop .pc-x{position:absolute;top:8px;right:10px;padding:4px 10px;font-size:12px}"
    + ".tl-box{border:2px solid var(--line);border-radius:18px;padding:14px 16px 12px;background:var(--panel);margin:0 0 18px}"
    + ".tl-h{font-size:16px;margin:0 0 8px}.tl-area{position:relative;margin:0 4px}"
    + ".tl-row{position:relative;height:28px}"
    + ".tl-bar{position:absolute;top:4px;height:20px;min-width:8px;border-radius:999px;background:var(--brand-100);border:2px solid var(--brand);font:inherit;font-size:11.5px;font-weight:800;color:var(--ink);white-space:nowrap;padding:0;line-height:15px;cursor:pointer;overflow:visible;text-align:left}"
    + ".tl-lb{position:absolute;left:calc(100% + 6px);top:0;white-space:nowrap}.tl-bar.flip .tl-lb{left:auto;right:calc(100% + 6px)}"
    + ".tl-bar.kor{background:var(--coral-100);border-color:var(--coral)}.tl-bar.guess{border-style:dashed}"
    + ".tl-axis{position:relative;height:20px;border-top:2px solid var(--line);margin-top:4px}.tl-axis span{position:absolute;top:3px;font-size:11px;color:var(--mist);transform:translateX(-50%);white-space:nowrap}"
    + ".tl-note{font-size:12px;color:var(--mist);margin:8px 0 0}.tl-box .pc{margin-top:10px;padding-top:10px;border-top:1px dashed var(--line)}"
    + ".sp-ask{display:flex;flex-wrap:wrap;gap:6px 8px;align-items:center;margin:2px 0 10px;padding:10px 12px;border-radius:12px;background:var(--amber-100);font-size:13.5px;color:var(--ink)}"
    + ".sp-ask input{flex:1 1 220px;border:2px solid var(--line);border-radius:10px;padding:6px 10px;font:inherit;font-size:13.5px;background:var(--card);color:var(--ink)}"
    + ".sp-ask.done{background:var(--card-2)}"
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
       mol:PDB번호|설명    RCSB PDB 의 실제 분자 구조를 Mol* 로 3D 회전
       phet:시뮬레이션|설명 PhET 한국어 시뮬레이션
       owid:그래프|설명    Our World in Data 실제 자료 그래프
       ptable:            Ptable 주기율표(원소 실물 사진)
       commons:파일명|라이선스|출처   위키미디어 공용의 원본 자료 사진(옛 지도·원고·초판 등)
       hubble:사진번호|설명  ESA/Hubble 사진
       model:Sketchfab번호|소장처   박물관 3D 화석·표본
       web:주소|출처 (쪽 안에) · out:주소|출처 (새 창만)
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
    mol: function (v) { var a = v.split("|"), id = a[0];
      return { ico: "🧬", src: "RCSB PDB " + id + " · 실제로 밝혀낸 분자 구조" + (a[1] ? " — " + a[1] : "") + " · 끌어서 돌려 보세요",
        url: "https://www.rcsb.org/structure/" + id, embed: "https://molstar.org/viewer/?pdb=" + id + "&hide-controls=1&collapse-left-panel=1" }; },
    phet: function (v) { var a = v.split("|"), u = "https://phet.colorado.edu/sims/html/" + a[0] + "/latest/" + a[0] + "_ko.html";
      return { ico: "🧪", src: "PhET 시뮬레이션(콜로라도 대학교) · 한국어" + (a[1] ? " — " + a[1] : ""), url: u, embed: u }; },
    owid: function (v) { var a = v.split("|"), u = "https://ourworldindata.org/grapher/" + a[0] + "?tab=chart";
      return { ico: "📈", src: "Our World in Data · 실제 자료 그래프(영어)" + (a[1] ? " — " + a[1] : ""), url: u, embed: u }; },
    ptable: function () { var u = "https://ptable.com/?lang=ko";
      return { ico: "⚗️", src: "Ptable · 원소마다 실물 사진·성질(한국어) — 원소를 눌러 보세요", url: u, embed: u }; },
    commons: function (v) { var a = v.split("|"), f = a[0].replace(/ /g, "_");
      return { ico: "📜", src: "원본 자료 · 위키미디어 공용 · " + (a[1] || "") + (a[2] ? " · " + a[2] : ""),
        url: "https://commons.wikimedia.org/wiki/File:" + encodeURIComponent(f), img: "https://commons.wikimedia.org/wiki/Special:FilePath/" + encodeURIComponent(f) + "?width=900" }; },
    hubble: function (v) { var a = v.split("|");
      return { ico: "🔭", src: "ESA/Hubble 사진 · CC BY 4.0" + (a[1] ? " — " + a[1] : ""),
        url: "https://esahubble.org/images/" + a[0] + "/", img: "https://cdn.esahubble.org/archives/images/screen/" + a[0] + ".jpg" }; },
    model: function (v) { var a = v.split("|");
      return { ico: "🦴", src: "박물관 3D 모형 · " + (a[1] || "Sketchfab") + " · 끌어서 돌려 보세요",
        url: "https://sketchfab.com/3d-models/" + a[0], embed: "https://sketchfab.com/models/" + a[0] + "/embed?autostart=1&ui_theme=dark" }; },
    web: function (v) { var a = v.split("|");
      return { ico: "📜", src: a[1] || "", url: a[0], embed: a[0] }; },
    out: function (v) { var a = v.split("|");
      return { ico: "🔗", src: a[1] || "", url: a[0] }; },
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
  /* ---- 📇 인물·📐 법칙 카드: data-view="who:위키백과 제목" / "law:제목". 자료는 ../assets/people-data.js(미리 받아 검토한 것) ---- */
  var PD_ = null, PDwait = [];
  function people(cb) {
    if (window.STH_PEOPLE) { cb(window.STH_PEOPLE); return; }
    PDwait.push(cb); if (PD_) return; PD_ = 1;
    var sc = document.createElement("script"); sc.src = "../assets/people-data.js";
    sc.onload = sc.onerror = function () { var d = window.STH_PEOPLE || {}; PDwait.splice(0).forEach(function (f) { f(d); }); };
    document.head.appendChild(sc);
  }
  function yn(y) { return y < 0 ? "기원전 " + (-y) : y + ""; }
  /* 위키데이터 정밀도: 9 해, 8 십 년, 7 백 년(기원전 650 → 기원전 7세기) */
  function yt(o) { if (!o) return "?"; return o[1] >= 9 ? yn(o[0]) : o[1] === 8 ? yn(o[0]) + "년대" : o[0] < 0 ? "기원전 " + (Math.floor((-o[0] - 1) / 100) + 1) + "세기" : Math.ceil(o[0] / 100) + "세기"; }
  /* 만 나이 — 생일·기일의 월·일을 알면 그날 기준, 해만 알면 해의 차 */
  function age(b, d) { var a = d[0] - b[0]; if (b[0] < 0 && d[0] > 0) a--; if (b.length > 3 && d.length > 3 && (d[2] < b[2] || (d[2] === b[2] && d[3] < b[3]))) a--; return a; }
  function personCard(e, phet) {
    var c = el("div", "pc" + (e.k === "l" ? " law" : ""));
    if (e.img) { var im = document.createElement("img"); im.src = e.img; im.alt = e.t + " 사진"; im.loading = "lazy"; c.appendChild(im); }
    var r = el("div");
    var nm = el("div", "pc-nm"); nm.textContent = (e.k === "l" ? "📐 " : "📇 ") + e.t; r.appendChild(nm);
    var m = el("div", "pc-meta");
    if (e.d) m.appendChild(el("span", null, null)).textContent = e.d;
    if (e.k === "p" && (e.b || e.e)) { var sp = el("span"); sp.innerHTML = "<b>" + yt(e.b) + " ~ " + yt(e.e) + "</b>" + (e.b && e.e && e.b[1] >= 9 && e.e[1] >= 9 ? " (" + age(e.b, e.e) + "세)" : ""); m.appendChild(sp); }
    if (e.c && e.c.length) m.appendChild(el("span", null, null)).textContent = e.c.join(" · ");
    if (e.nobel) m.appendChild(el("span", "pc-nobel", "노벨상"));
    r.appendChild(m);
    r.appendChild(el("p", "pc-sum", null)).textContent = e.x || "";
    if (e.warn) { var w = el("p", "pc-warn"); w.textContent = "⚠ " + e.warn + " — 어느 쪽이 맞는지 확인해 보세요. 이 카드의 생몰년은 위키데이터 값입니다."; r.appendChild(w); }
    var bt = el("div", "pc-btns");
    function a(href, txt) { var x = el("a", "btn"); x.href = href; x.target = "_blank"; x.rel = "noopener"; x.textContent = txt; bt.appendChild(x); }
    a(e.url, "위키백과에서 전체 읽기 ↗");
    if (e.mt) a("https://mathshistory.st-andrews.ac.uk/Biographies/" + e.mt + "/", "MacTutor 전기(영어) ↗");
    if (e.nobel) a("https://www.nobelprize.org/search/?s=" + encodeURIComponent(e.t), "노벨상 공식 소개 ↗");
    if (e.ek) a("https://encykorea.aks.ac.kr/Search/List?keyword=" + encodeURIComponent(e.t), "한국민족문화대백과 ↗");
    var ph = phet || e.phet;
    if (ph) a("https://phet.colorado.edu/sims/html/" + ph + "/latest/" + ph + "_ko.html", "🧪 시뮬레이션으로 확인 ↗");
    r.appendChild(bt);
    r.appendChild(el("p", "pc-src", "출처: 한국어 위키백과 요약(" + (e.at || "") + " 받음)·위키데이터. 위키백과는 누구나 고칠 수 있는 백과사전이므로 교과서와 견주어 읽으세요."));
    c.appendChild(r);
    return c;
  }
  /* 🕰 이 단원의 과학자 연표 — 쪽에 <div id="timeline"></div> 가 있으면, 쪽에 나오는 📇 인물을 태어난 순서로 한 줄에 */
  function timeline() {
    var mount = document.getElementById("timeline"); if (!mount || mount._done) return;
    var keys = []; Array.prototype.forEach.call(document.querySelectorAll('[data-view^="who:"]'), function (n) { var k = n.getAttribute("data-view").slice(4); if (keys.indexOf(k) < 0) keys.push(k); });
    if (keys.length < 2) return;
    mount._done = 1;
    people(function (D) {
      var P = keys.map(function (k) { return D[k]; }).filter(function (e) { return e && e.b; }).map(function (e) {
        var g = e.b[1] < 9 || (e.e && e.e[1] < 9), b = e.b[1] === 7 ? e.b[0] - 50 : e.b[0], d = e.e ? (e.e[1] === 7 ? e.e[0] - 50 : e.e[0]) : null;
        return { e: e, g: g, b: b, d: d };
      }).sort(function (x, y) { return x.b - y.b; });
      if (P.length < 2) return;
      var lo = Math.floor((P[0].b - 20) / 100) * 100, hi = Math.max.apply(null, P.map(function (p) { return p.d || p.b + 60; })); hi = Math.min(2030, Math.ceil((hi + 10) / 100) * 100);
      var W = function (y) { return ((y - lo) / (hi - lo) * 100) + "%"; };
      var box = el("div", "tl-box");
      box.appendChild(el("h3", "tl-h", "🕰 이 단원의 과학자 연표"));
      var area = el("div", "tl-area");
      P.forEach(function (p) {
        var row = el("div", "tl-row"), bar = el("button", "tl-bar" + (p.e.ek ? " kor" : "") + (p.g ? " guess" : "")); bar.type = "button";
        bar.style.left = W(p.b); bar.style.width = "calc(" + W(p.d || p.b + 60) + " - " + W(p.b) + ")";
        var lb = p.e.t.replace(/^.* /, "") + " " + (p.g ? yt(p.e.b) + " 무렵" : yn(p.b) + "–" + (p.d == null ? "" : p.b < 0 && p.d < 0 ? -p.d : yn(p.d)));
        bar.appendChild(el("span", "tl-lb", lb)); bar.setAttribute("aria-label", lb + " — 카드 보기");
        if (((p.d || p.b + 60) - lo) / (hi - lo) > 0.62) bar.className += " flip";   /* 오른쪽 끝 막대는 이름을 왼쪽에 */
        bar.addEventListener("click", function () {
          var old = box.querySelector(".pc"); if (old) old.parentNode.removeChild(old);
          box.appendChild(personCard(p.e));
        });
        row.appendChild(bar); area.appendChild(row);
      });
      var ax = el("div", "tl-axis"), step = hi - lo > 1200 ? 500 : hi - lo > 500 ? 100 : 50;
      for (var y = Math.ceil(lo / step) * step; y <= hi; y += step) { var t = el("span", null, y < 0 ? "기원전 " + (-y) : y + ""); t.style.left = W(y); ax.appendChild(t); }
      area.appendChild(ax); box.appendChild(area);
      box.appendChild(el("p", "tl-note", "막대를 누르면 그 사람의 카드가 아래에 나옵니다. 점선 막대는 생몰년이 정확히 알려지지 않은 사람, 붉은 막대는 우리나라 과학자입니다."));
      mount.appendChild(box);
    });
  }
  /* ---- 🧪 더 해 보기: 단원 try-items.js 가 window.sthTry([{ near, sim, ko, tasks, q, why }]) 를 부른다.
     near(본문 글귀)가 든 문단을 찾아 그 바로 아래에 상자를 둔다. 시뮬레이션은 ‘열기’를 눌렀을 때만 불러온다. ---- */
  /* 받침 따라 '로/으로' (ㄹ 받침은 '로') */
  function ro(w) { var c = String(w).charCodeAt(String(w).length - 1) - 0xAC00; return c >= 0 && c < 11172 && c % 28 && c % 28 !== 8 ? "으로" : "로"; }
  function normT(s) { return String(s || "").replace(/\s+/g, " ").trim(); }
  window.sthTry = function (list) {
    function place() {
      (list || []).forEach(function (it, idx) {
        if (it._done) return;
        var best = null;
        Array.prototype.forEach.call(document.querySelectorAll(".tab-panel p, .tab-panel li, .tab-panel .say, .tab-panel .case-file, .tab-panel div"), function (e) {
          if (e.closest(".try-box, .sth-place-pop, button, .tab-btn")) return;
          if (normT(e.textContent).indexOf(it.near) < 0) return;
          if (!best || best.contains(e)) best = e;
        });
        if (!best) return;
        it._done = 1;
        var h = best;
        while (h && h !== document.body && /^inline/.test(getComputedStyle(h).display)) h = h.parentNode;
        while (h && h.parentNode && h.parentNode !== document.body && /flex|grid/.test(getComputedStyle(h.parentNode).display)) h = h.parentNode;
        /* mini: 이 장면에 이미 같은 일을 하는 우리 시뮬레이션이 있으면 큰 상자 대신, 그 시뮬레이션 바로 아래에 한 줄로(과제는 열면 보인다) */
        if (it.mini) {
          var scn = best.closest(".scene"), sc = null;
          if (scn) Array.prototype.forEach.call(scn.querySelectorAll(".stage-card"), function (x) { if (!sc && x.querySelector("canvas")) sc = x; });
          if (sc) h = sc;
        }
        var S = it.src || null, site = S ? S.site : "PhET";
        var SK = "try_" + it.sim + "_" + idx, st = (window.sthState && window.sthState(SK)) || {};
        var box = el("div", "try-box" + (it.mini ? " mini" : "") + (S ? " ext" : ""));
        var hd = el("div", "try-h");
        hd.innerHTML = it.mini ? "🧪 이 실험을 " + site + " <b>「" + (it.ko || it.sim) + "」</b>" + ro(it.ko || it.sim) + "도 해 보기" + (it.why ? " <span>— " + it.why + "</span>" : "")
                               : "🧪 <b>더 해 보기</b> · " + (S ? site + " 「" + it.ko + "」" : (it.ko || it.sim)) + (it.why ? " <span>— " + it.why + "</span>" : "");
        box.appendChild(hd);
        var ol = el("ol", "try-t"); (it.tasks || []).forEach(function (t) { ol.appendChild(el("li", null, null)).textContent = t; }); box.appendChild(ol);
        if (it.q) { var q = el("p", "try-q"); q.textContent = "🤔 " + it.q; box.appendChild(q); }
        if (it.mini && !(S && S.tab)) { ol.hidden = true; if (q) q.hidden = true; }
        var url = S ? S.url : "https://phet.colorado.edu/sims/html/" + it.sim + "/latest/" + it.sim + "_ko.html";
        var row = el("div", "try-b");
        var op = el("button", "btn primary"); op.type = "button"; op.textContent = "시뮬레이션 열기";
        var nw = el("a", "btn"); nw.href = url; nw.target = "_blank"; nw.rel = "noopener"; nw.textContent = "새 창에서 크게 ↗";
        /* 끼울 수 없는 곳(S.tab)은 새 창 단추 하나만 */
        if (S && S.tab) { nw.className = "btn primary"; nw.textContent = "새 창에서 열기 ↗"; row.appendChild(nw); } else { row.appendChild(op); row.appendChild(nw); }
        box.appendChild(row);
        var fr = null;
        op.addEventListener("click", function () {
          if (fr) { fr.parentNode.removeChild(fr); fr = null; op.textContent = "시뮬레이션 열기"; return; }
          var f = document.createElement("iframe"); f.src = url; f.title = (it.ko || it.sim) + " — " + site + " 시뮬레이션"; f.setAttribute("allowfullscreen", ""); f.setAttribute("allow", "fullscreen"); f.loading = "lazy";
          if (S && S.sandbox) f.setAttribute("sandbox", S.sandbox);
          if (S && S.h && !S.crop) f.style.height = S.h + "px";
          fr = f;
          /* crop: 그 사이트 쪽을 정해진 폭으로 열고, 시뮬레이션 부분만 상자 폭에 맞게 줄여 보인다(머리말·광고는 잘라 냄) */
          if (S && S.crop) {
            fr = el("div", "try-crop"); fr.appendChild(f);
            f.style.width = S.crop[0] + "px"; f.style.height = (S.crop[1] + S.crop[2]) + "px";
            var fit = function () { if (!fr || !fr.parentNode) { window.removeEventListener("resize", fit); return; } var k = Math.min((box.clientWidth - 36) / S.crop[0], 1, 760 / S.crop[2]); fr.style.width = Math.round((S.crop[0] - 18) * k) + "px";   /* 오른쪽 18px 는 그 쪽 스크롤 막대 — 가린다 */ fr.style.height = Math.round(S.crop[2] * k) + "px"; f.style.transform = "scale(" + k + ") translateY(-" + S.crop[1] + "px)"; };
            box.insertBefore(fr, note); fit(); window.addEventListener("resize", fit);
          } else box.insertBefore(fr, note);
          op.textContent = "시뮬레이션 닫기";
          if (it.mini) { ol.hidden = false; if (q) q.hidden = false; note.hidden = false; }
        });
        var note = el("div", "try-n");
        var lb = el("label"); lb.appendChild(el("span", null, "찾아낸 것 한 줄 (이 기기에만 저장)")); var inp = document.createElement("input"); inp.type = "text"; inp.maxLength = 160; inp.value = st.n || "";
        inp.placeholder = "예: 각도를 바꿨더니 …"; inp.addEventListener("change", function () { st.n = inp.value.trim(); if (window.sthState) window.sthState(SK, st); });
        lb.appendChild(inp); note.appendChild(lb); box.appendChild(note);
        if (it.mini && !st.n) note.hidden = true;
        box.appendChild(el("p", "try-s", S ? "출처: " + (S.credit || site + " – " + it.ko + ", " + url) : "PhET 인터랙티브 시뮬레이션(콜로라도 대학교, CC BY 4.0) · 한국어판"));
        h.parentNode.insertBefore(box, h.nextSibling);
      });
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", place); else place();
  };
  function placeToggle(n) {
    var cv = String(n.getAttribute("data-view") || "");
    if (/^(who|law):/.test(cv)) {
      if (n._pop && n._pop.parentNode) { n._pop.parentNode.removeChild(n._pop); n._pop = null; n.setAttribute("aria-expanded", "false"); return; }
      people(function (D) {
        var e = D[cv.slice(4)]; if (!e) return;
        var h = n.parentNode;
        while (h && h !== document.body && /^inline/.test(getComputedStyle(h).display)) h = h.parentNode;
        while (h && h.parentNode && h.parentNode !== document.body && /flex|grid/.test(getComputedStyle(h.parentNode).display)) h = h.parentNode;
        var pop = el("div", "sth-place-pop pc-pop");
        var x = el("button", "btn pc-x"); x.type = "button"; x.textContent = "닫기"; x.addEventListener("click", function () { placeToggle(n); });
        pop.appendChild(personCard(e, n.getAttribute("data-phet"))); pop.appendChild(x);
        h.parentNode.insertBefore(pop, h.nextSibling); n._pop = pop; n.setAttribute("aria-expanded", "true");
      });
      return;
    }
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
    /* 먼저 예측하고 보기 — data-ask 가 있으면 한 줄 예측을 먼저 받는다(기록은 이 기기에만, 판정 없음) */
    var ask = n.getAttribute("data-ask"), PK = "pv_" + (n.getAttribute("data-view") || n.getAttribute("data-place") || p.name).replace(/[^\w가-힣]/g, "").slice(0, 40);
    var pv = (window.sthState && window.sthState(PK)) || {};
    if (ask && !pv.p && !n._skipAsk) {
      var q = el("div", "sp-ask"); q.appendChild(el("b", null, "🤔 먼저 예측해 보세요 "));
      q.appendChild(document.createTextNode(ask));
      var inp = document.createElement("input"); inp.type = "text"; inp.maxLength = 120; inp.placeholder = "내 예측 한 줄";
      var go = el("button", "btn primary"); go.type = "button"; go.textContent = "예측하고 보기";
      var skip = el("button", "btn"); skip.type = "button"; skip.textContent = "그냥 보기";
      var reveal = function (save) {
        if (save) { pv.p = inp.value.trim(); if (window.sthState) window.sthState(PK, pv); }
        n._skipAsk = !save; pop.parentNode.removeChild(pop); n._pop = null; placeToggle(n); n._skipAsk = false;
      };
      go.addEventListener("click", function () { if (!inp.value.trim()) { inp.focus(); inp.placeholder = "한 줄이라도 적어 보세요"; return; } reveal(true); });
      inp.addEventListener("keydown", function (e) { if (e.key === "Enter") go.click(); });
      skip.addEventListener("click", function () { reveal(false); });
      q.appendChild(inp); q.appendChild(go); q.appendChild(skip);
      pop.appendChild(q);
      host.parentNode.insertBefore(pop, host.nextSibling);
      n._pop = pop; n.setAttribute("aria-expanded", "true");
      setTimeout(function () { try { inp.focus(); } catch (e) {} }, 30);
      return;
    }
    if (ask && pv.p) {
      var mine = el("div", "sp-ask done");
      mine.appendChild(el("b", null, "🤔 내 예측 ")); mine.appendChild(document.createTextNode(pv.p));
      var cmp = document.createElement("input"); cmp.type = "text"; cmp.maxLength = 120; cmp.placeholder = "실제로 보니 어땠나요? (예측과 같은 점·다른 점 한 줄)"; cmp.value = pv.c || "";
      cmp.addEventListener("change", function () { pv.c = cmp.value.trim(); if (window.sthState) window.sthState(PK, pv); });
      var again = el("button", "btn"); again.type = "button"; again.textContent = "예측 다시 하기";
      again.addEventListener("click", function () { pv = {}; if (window.sthState) window.sthState(PK, null); pop.parentNode.removeChild(pop); n._pop = null; placeToggle(n); });
      mine.appendChild(cmp); mine.appendChild(again); pop.appendChild(mine);
    }
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
      n.setAttribute("data-sp", /^who:/.test(v) ? "who" : /^law:/.test(v) ? "law" : /^(sky|star|hubble)/.test(v) ? "sky" : /^(eyes|exo)/.test(v) ? "eyes" : /^earth/.test(v) ? "earth" : /^sun/.test(v) ? "sun" : /^mymap/.test(v) ? "mymap"
        : /^mol/.test(v) ? "mol" : /^phet/.test(v) ? "sim" : /^owid/.test(v) ? "data" : /^ptable/.test(v) ? "elem" : /^model/.test(v) ? "fossil" : /^(commons|web)/.test(v) ? "doc" : /^out/.test(v) ? "out" : "1");
      n.setAttribute("role", "button"); n.setAttribute("tabindex", "0");
      n.setAttribute("aria-expanded", "false");
      n.setAttribute("aria-label", (n.textContent || "").trim() + (n.hasAttribute("data-place") ? " — 지도 보기" : " — 실제 모습 보기"));
    });
  }
  window.sthLinkScan = function (root) {
    tagPlaces(root || document); timeline();
    root = root || document;
    Array.prototype.forEach.call(root.querySelectorAll("[data-link]"), function (n) { render(n, false); });
    Array.prototype.forEach.call(root.querySelectorAll("[data-map]"), function (n) { render(n, true); });
  };
  function go() { window.sthLinkScan(document); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", go); else go();
  /* 실험실·문항처럼 나중에 그려지는 부분도 잡는다 */
  try { new MutationObserver(function () { go(); }).observe(document.body || document.documentElement, { childList: true, subtree: true }); } catch (e) {}
})();
