/* =============================================================================
   KOMPOZITOR — forma mantiqi
   Server yo'q. Shuning uchun "Navbatga qo'yish" HECH QACHON yuborildi
   demaydi: u ogohlantirish bannerli demo panelini ochadi va reestr raqamini
   O'YLAB TOPMAYDI — raqamni faqat server beradi.
   ========================================================================== */
(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };
  var GEO = window.OM_GEO || {};
  var TEMPLATES = window.OM_TEMPLATES || {};

  /* Push bildirishnomasi ko'rsatadigan chegara. Sarlavha bir qator,
     matn ikki qator — o'rtacha qurilmada shuncha belgi sig'adi. */
  var LIMIT = { title: 60, body: 180 };

  var state = {
    scope: null,          // republic | region | district | mahalla
    region: "", district: "", mahalla: "",
    dataFailed: false,    // `composer-data.js` yuklanmadi
    when: "now",
    days: [],
    files: [],
    previewLang: "uz",
    submitted: false      // tekshiruv xatolari faqat urinishdan keyin ko'rinadi
  };

  /* ---------------------------------------------------------------------------
     RADIOGROUP — o'q tugmalar bilan yurish, roving tabindex.
     `role="radio"` va'da bergan xulqni bermasak, klaviatura foydalanuvchisi
     guruh ichida qamalib qoladi.
  ------------------------------------------------------------------------- */
  function wireRadioGroup(group, onSelect) {
    var items = Array.prototype.slice.call(group.querySelectorAll('[role="radio"]'));
    if (!items.length) return;

    function focusIndex(i) {
      var next = items[(i + items.length) % items.length];
      select(next);
      next.focus();
    }
    function select(el) {
      items.forEach(function (it) {
        var on = it === el;
        it.setAttribute("aria-checked", on ? "true" : "false");
        it.tabIndex = on ? 0 : -1;
      });
      onSelect(el);
    }
    function syncTabStops() {
      var checked = items.filter(function (i) { return i.getAttribute("aria-checked") === "true"; })[0];
      items.forEach(function (it) { it.tabIndex = it === (checked || items[0]) ? 0 : -1; });
    }

    items.forEach(function (item, i) {
      item.addEventListener("click", function () { select(item); });
      item.addEventListener("keydown", function (e) {
        if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); focusIndex(i + 1); }
        else if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); focusIndex(i - 1); }
        else if (e.key === " " || e.key === "Enter") { e.preventDefault(); select(item); }
      });
    });
    syncTabStops();
  }

  /* ---------------------------------------------------------------------------
     01 QAMROV — NARVON
     To'rt daraja bitta boshqaruvda: radio «shu yerda to'xtat» degani,
     yonidagi select esa o'sha darajaning hududini beradi.
  ------------------------------------------------------------------------- */
  var LEVELS = ["republic", "region", "district", "mahalla"];

  /* Reestrda buzuq yozuv (null, satr) bo'lsa u BUTUN qadamni o'ldirmasin —
     o'tkazib yuboriladi va yig'indi faqat haqiqatan o'qilganidan yig'iladi. */
  var NAMES = Object.keys(GEO).filter(function (k) { return GEO[k] && typeof GEO[k] === "object"; });

  function hasPop(v) { return typeof v === "number" && isFinite(v) && v > 0; }

  /* Bitta hududning soni yetishmasa respublika yig'indisi ham YO'Q.
     `|| 0` qisman yig'indini «butun respublika aholisi» deb ko'rsatardi —
     o'ylab topilgan fakt: ekran bilmagan narsasini biladi deb da'vo qilardi. */
  var NO_POP = NAMES.filter(function (n) { return !hasPop(GEO[n].pop); });
  var REPUBLIC_POP = NO_POP.length ? null : NAMES.reduce(function (s, n) { return s + GEO[n].pop; }, 0);

  /* Raqam o'qiladigan bo'lsin: 35 100 000 emas, 35.1M. Yaxlitlash darajasi
     kattalikka qarab — 2.4K va 2.44K orasida farq operatorga kerak emas. */
  function formatPop(n) {
    if (n == null) return null;
    if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
    // 10K dan past qiymatda o'nlik saqlanadi: mahalla 2 400 kishi bo'lsa
    // «~2K» uni chorak qismga yaxlitlab yuborardi.
    if (n >= 1e4) return Math.round(n / 1e3) + "K";
    if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
    return String(n);
  }
  /* Son yo'q bo'lsa «~0» emas, «—»: nol «hech kim» degani, tire «reestr aytmagan» degani. */
  function popText(n) { return hasPop(n) ? "~" + formatPop(n) : "—"; }

  function districtsOf(region) { return (GEO[region] && GEO[region].districts) || {}; }
  function mahallasOf(region, district) {
    var d = districtsOf(region)[district];
    return (d && d.mahallas) || {};
  }

  /* Har darajaning taxminiy qamrovi. Tanlanmagan yoki reestrda yo'q bo'lsa
     null — ekranda «—» chiqadi, nol EMAS: nol «hech kim» degan ma'noni berardi. */
  function reachOf(level) {
    var v = level === "republic" ? REPUBLIC_POP
      : level === "region" ? (state.region ? GEO[state.region].pop : null)
      : level === "district" ? (state.region && state.district ? districtsOf(state.region)[state.district].pop : null)
      : (state.region && state.district && state.mahalla ? mahallasOf(state.region, state.district)[state.mahalla] : null);
    return hasPop(v) ? v : null;
  }

  function currentReach() {
    if (state.dataFailed) return null;
    return state.scope ? reachOf(state.scope) : null;
  }

  function scopePath() {
    if (!state.scope) return null;
    if (state.scope === "republic") return ["O‘zbekiston Respublikasi"];
    var parts = [];
    if (state.region) parts.push(state.region);
    if (state.scope !== "region" && state.district) parts.push(state.district);
    if (state.scope === "mahalla" && state.mahalla) parts.push(state.mahalla);
    return parts.length ? parts : null;
  }

  /* ---------------------------------------------------------------------------
     01 QAMROV — XARITA
     Qamrov = TURGAN JOYING. Daraja alohida tanlanmaydi: `goScope` darajani va
     joyni BIR VAQTDA o'rnatadi, shuning uchun ekran bilan so'rov tanasi
     bir-biridan uzilib qololmaydi.
  ------------------------------------------------------------------------- */
  /* [reestr nomining boshlanishi, path, raqam X, raqam Y] — soddalashtirilgan chizma, rasmiy karta emas. */
  var MAP_SHAPES = [
    ["Qoraqalpog", "M14 16 152 16 152 92 120 128 58 148 14 116Z", 80, 74],
    ["Xorazm", "M50 158 110 138 126 164 104 196 58 192Z", 88, 168],
    ["Navoiy", "M156 18 268 30 288 82 278 96 242 130 188 140 156 102Z", 216, 80],
    ["Buxoro", "M128 162 182 144 238 138 250 192 204 224 144 208Z", 192, 182],
    ["Samarqand", "M252 138 298 128 330 156 320 188 282 196 248 172Z", 288, 162],
    ["Jizzax", "M296 80 332 66 352 104 336 142 302 118 292 94Z", 322, 104],
    ["Qashqadaryo", "M244 208 296 202 338 222 330 262 272 266 240 238Z", 288, 236],
    ["Surxondaryo", "M342 232 378 216 408 246 398 292 352 288 338 262Z", 372, 258],
    ["Toshkent viloyati", "M344 16 440 12 464 56 440 100 398 94 390 58 346 54Z", 424, 48],
    ["Toshkent shahri", "M352 58 394 60 398 96 360 100 344 80Z", 372, 82],
    ["Sirdaryo", "M352 108 396 100 410 130 378 150 352 138Z", 378, 126],
    ["Namangan", "M414 106 462 100 472 136 432 148 410 132Z", 440, 126],
    ["Farg", "M398 152 432 158 436 186 406 200 384 176Z", 412, 176],
    ["Andijon", "M440 152 474 146 478 180 444 190 434 172Z", 456, 172]
  ];
  var CHEV = '<svg class="scope-chev" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M6 3.5 10.5 8 6 12.5"></path></svg>';
  var SVG_NS = "http://www.w3.org/2000/svg";
  var cells = {};
  var scopeSig = null;      // oxirgi chizilgan qamrov holati
  var wantFocus = false;    // fokus faqat QAMROV bilan ishlaganda ko'chadi
  var preRow = null;        // sichqoncha bosishi fokusni blur qiladi — kim turganini eslaymiz

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function mkSvg(tag, attrs) {
    var el = document.createElementNS(SVG_NS, tag);
    for (var k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  }

  function buildMap() {
    var svg = $("scopeSvg");
    /* Bosiladigan fon kataklardan OLDIN qo'yiladi: SVG da ustki element bosiladi,
       demak katak ustidagi bosish hududni, tashqarisidagi bosish respublikani beradi. */
    svg.appendChild(mkSvg("rect", { "class": "scope-back", x: "0", y: "0", width: "480", height: "300" }));
    MAP_SHAPES.forEach(function (shape) {
      var name = null, i;
      for (i = 0; i < NAMES.length; i++) if (NAMES[i].indexOf(shape[0]) === 0) { name = NAMES[i]; break; }
      // Nom reestrda topilmasa shakl chizilmaydi — hech qayerga olib bormaydigan hudud bosilmasin.
      if (!name || cells[name]) return;
      var g = mkSvg("g", { "class": "scope-cell", "data-r": name, "data-state": "idle" });
      var path = mkSvg("path", { "class": "scope-rg", d: shape[1] });
      var num = mkSvg("text", { "class": "scope-num", x: shape[2], y: shape[3] });
      var title = mkSvg("title", {});
      title.textContent = name + " · " + popText(GEO[name].pop) + " kishi (taxminiy)";
      num.textContent = pad(NAMES.indexOf(name) + 1);
      path.appendChild(title); g.appendChild(path); g.appendChild(num);
      svg.appendChild(g); cells[name] = g;
    });
  }

  /* Reestrdagi bo'shliq JIM qolmasin: ekran «hammasi shu yerda» degan taassurot bermasin. */
  function reportGaps() {
    var gaps = [], noCell = NAMES.filter(function (n) { return !cells[n]; });
    if (NO_POP.length) gaps.push("aholi soni yo‘q — " + NO_POP.join(", "));
    if (noCell.length) gaps.push("xaritada ko‘rsatilmagan — " + noCell.join(", "));
    if (!gaps.length) return;
    $("scopeCrumbs").insertAdjacentHTML("beforebegin",
      '<p class="note note-warn"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M10 2.9 18.6 17.4H1.4Z"></path><path d="M10 8.4v3.6M10 14.6h.01"></path></svg>' +
      '<span>Reestr to‘liq emas: ' + esc(gaps.join("; ")) + '. Bu hududlar uchun taxminiy raqam ham, respublika yig‘indisi ham ko‘rsatilmaydi.</span></p>');
  }

  function scopeRows() {
    if (state.scope === "region") {
      var ds = districtsOf(state.region);
      return Object.keys(ds).map(function (n, i) { return { kind: "district", name: n, pop: ds[n].pop, idx: i + 1, deep: true }; });
    }
    if (state.scope === "district" || state.scope === "mahalla") {
      var ms = mahallasOf(state.region, state.district);
      return Object.keys(ms).map(function (n, i) { return { kind: "mahalla", name: n, pop: ms[n], idx: i + 1 }; });
    }
    return NAMES.map(function (n, i) { return { kind: "region", name: n, pop: GEO[n].pop, idx: i + 1, deep: true }; });
  }

  /* `aria-current` — `aria-pressed` EMAS: qator «bosilgan/bo'shatilgan» emas,
     «hozirgi tanlov». Qayta bosish holatni o'zgartirmaydi, demak o'chirilishini
     va'da qilish yolg'on bo'lardi. */
  function renderScopeList() {
    var rows = scopeRows(), list = $("scopeList");
    if (!rows.length) {
      list.innerHTML = '<li class="scope-empty hint">Reestrda bu pog‘ona uchun yozuv yo‘q — qamrov yuqoridagi darajada qoladi.</li>';
      return rows;
    }
    list.innerHTML = rows.map(function (it) {
      var on = it.kind === "mahalla" && state.mahalla === it.name;
      return '<li><button type="button" class="scope-row" data-kind="' + it.kind + '" data-name="' + esc(it.name) + '"' +
        ' aria-describedby="scopeError"' + (on ? ' aria-current="true"' : "") + ">" +
        '<span class="scope-idx">' + pad(it.idx) + "</span>" +
        '<span class="scope-name">' + esc(it.name) + "</span>" +
        '<span class="scope-pop">' + popText(it.pop) + "</span>" + (it.deep ? CHEV : "") + "</button></li>";
    }).join("");
    return rows;
  }

  /* Crumb sof navigatsiya EMAS — u qamrovni o'sha darajaga KO'TARADI, shuning
     uchun label harakatni aytadi: «qaytish» desa, ko'r foydalanuvchi 450 ming
     o'rniga 35 millionni tasdiqlab qo'yardi. */
  function renderScopeCrumbs() {
    var el = $("scopeCrumbs");
    if (!state.scope) { el.innerHTML = '<span class="scope-crumb scope-crumb-off">Qamrov hali tanlanmagan</span>'; return; }
    var cr = [{ up: "republic", label: "O‘zbekiston", action: "Qamrovni butun respublikaga o‘zgartirish" }];
    if (state.region) cr.push({ up: "region", label: state.region, action: "Qamrovni butun " + state.region + "ga o‘zgartirish" });
    if (state.scope !== "region" && state.district) cr.push({ up: "district", label: state.district, action: "Qamrovni butun " + state.district + "ga o‘zgartirish" });
    if (state.scope === "mahalla" && state.mahalla) cr.push({ label: state.mahalla });
    el.innerHTML = cr.map(function (c, i) {
      var sep = i ? '<span class="scope-sep" aria-hidden="true">/</span>' : "";
      return sep + (i === cr.length - 1
        ? '<span class="scope-crumb" aria-current="true">' + esc(c.label) + "</span>"
        : '<button type="button" class="scope-crumb scope-crumb-btn" data-up="' + c.up + '" aria-label="' + esc(c.action) + '">' + esc(c.label) + "</button>");
    }).join("");
  }

  function renderScopeSum() {
    var sum = $("scopeSum");
    if (!state.scope) {
      sum.innerHTML = '<div class="empty"><span class="empty-icon"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M10 17.6S15.4 12.9 15.4 8.7A5.4 5.4 0 0 0 4.6 8.7C4.6 12.9 10 17.6 10 17.6Z"></path><circle cx="10" cy="8.6" r="2"></circle></svg></span>' +
        '<p class="empty-title">Qamrov tanlanmagan</p><p>Butun respublika uchun yuqoridagi tugmani bosing; tor qamrov uchun xaritadan hududni yoki ro‘yxatdan qatorni tanlang. Xabar kimga ketishini tizim o‘zi taxmin qilmaydi.</p></div>';
      return;
    }
    var reach = currentReach();
    var share = (reach == null || REPUBLIC_POP == null) ? null : (reach / REPUBLIC_POP) * 100;
    var tail = reach == null ? "reestrda bu pog‘ona uchun son yo‘q"
      : "kishi" + (state.scope === "republic" ? " · reestrdagi barcha hududlar"
        : share == null ? "" : " · reestrdagi jami aholining " + (share < 0.1 ? "0,1% dan kam" : "~" + share.toFixed(1).replace(".", ",") + "%"));
    sum.innerHTML = '<p class="eyebrow eyebrow-sm">Taxminiy qamrov</p>' +
      '<p class="scope-reach"><b>' + popText(reach) + "</b><span>" + tail + "</span></p>" +
      '<p class="scope-path">' + esc(scopePath().join(" / ")) + "</p>" +
      '<p class="hint">Raqam namuna reestridan olingan taxmin — aniq son emas; yuborishdan oldin reestrdan yangilanadi.</p>';
  }

  function rowByName(name) {
    var rows = $("scopeList").querySelectorAll(".scope-row"), i;
    for (i = 0; i < rows.length; i++) if (rows[i].getAttribute("data-name") === name) return rows[i];
    return null;
  }
  /* Yuqoriga chiqish tugmasi bo'lmasa (eng yuqori pog'ona) — doimiy tugma.
     ArrowLeft hech qachon hech qayerga olib bormay qolmaydi. */
  function upButton() {
    var b = $("scopeCrumbs").querySelectorAll(".scope-crumb-btn");
    return b.length ? b[b.length - 1] : $("scopeAll");
  }

  function renderScope() {
    if (state.dataFailed) return;
    var sig = [state.scope, state.region, state.district, state.mahalla].join("|");
    // Matn yozilayotganda `refresh()` sekundiga o'nlab marta chaqiriladi —
    // qamrov o'zgarmagan bo'lsa ro'yxatni qayta qurish bekorga DOM churn va
    // fokusni ushlab turgan qatorni yo'q qilish xavfi.
    if (sig === scopeSig && !wantFocus) return;
    var changed = sig !== scopeSig;
    scopeSig = sig;

    var list = $("scopeList");
    var active = document.activeElement === document.body && preRow ? preRow : document.activeElement;
    var keep = list.contains(active) ? active.getAttribute("data-name") : null;

    if (changed) { renderScopeCrumbs(); renderScopeSum(); }
    var rows = changed ? renderScopeList() : scopeRows();

    Object.keys(cells).forEach(function (n) {
      cells[n].setAttribute("data-state",
        state.scope === "republic" ? "on" : !state.region ? "idle" : n === state.region ? "on" : "dim");
    });
    var all = $("scopeAll");
    if (state.scope === "republic") all.setAttribute("aria-current", "true"); else all.removeAttribute("aria-current");

    var count = state.scope === "region" ? "Tumanlar va shaharlar · " + rows.length
      : (state.scope === "district" || state.scope === "mahalla") ? "Mahallalar (MFY) · " + rows.length
      : "Hududlar · " + NAMES.length;
    $("scopeLvl").textContent = count;
    /* Ekran o'quvchi uchun HAL QILUVCHI raqam — qamrov; yo'lning o'zi tanlov bo'lganini ham aytadi. */
    var reach = currentReach();
    $("scopeLive").textContent = state.scope
      ? scopePath().join(" / ") + " tanlandi. Taxminiy qamrov " + (reach == null ? "noma’lum" : popText(reach) + " kishi") + ". " + count + "."
      : "Qamrov tanlanmagan. " + count + ".";

    /* `innerHTML` fokusdagi tugmani yo'q qiladi — fokus <body> ga tushsa, keyingi
       Tab butun hujjat boshidan boshlanardi. Shuning uchun: o'sha nomli qator
       qolgan bo'lsa — o'sha; ro'yxat almashgan bo'lsa — birinchi qator;
       respublikaga chiqilgan bo'lsa — doimiy tugma. */
    if (wantFocus || keep != null) {
      var target = keep == null ? null : rowByName(keep);
      if (!target) {
        target = list.querySelector('.scope-row[aria-current="true"]') ||
          (state.scope === "republic" ? all : null) ||
          list.querySelector(".scope-row") || upButton();
      }
      if (target) target.focus();
    }
    wantFocus = false;
  }

  /* Turgan joying = qamroving. Yuqoriga chiqqanda pastdagi tanlov TOZALANADI —
     aks holda ekran «viloyat» deb turib, `state` ichida eski mahallani ushlab
     qolardi va u so'rov tanasiga tushardi. */
  function goScope(level, name, moveFocus) {
    if (level === "republic") { state.region = state.district = state.mahalla = ""; }
    else if (level === "region") { if (name) state.region = name; state.district = state.mahalla = ""; }
    else if (level === "district") { if (name) state.district = name; state.mahalla = ""; }
    else if (name) state.mahalla = name;
    // Joyi yo'q daraja O'RNATILMAYDI: «Tuman» deb turib tumani bo'sh qolgan
    // holat ekranni ham, so'rov tanasini ham yolg'onchi qilardi.
    if (level !== "republic" && !state[level]) return;
    state.scope = level;
    $("scopeError").hidden = true;
    wantFocus = !!moveFocus;
    refresh();
  }

  /* Xarita va ro'yxat bir-birini yoritadi — sichqoncha ostida ham, klaviatura fokusida ham. */
  function hotlight(target) {
    var near = target && target.closest && (target.closest(".scope-cell") || target.closest('.scope-row[data-kind="region"]'));
    var name = near ? near.getAttribute("data-r") || near.getAttribute("data-name") : null;
    /* Fon yoki doimiy tugma ustidagi kursor «hammasi» ni OLDINDAN ko'rsatadi:
       butun xarita yumshoq alangaga bo'yaladi va yorliq chiqadi. */
    var all = !near && !!(target && target.closest && (target.closest(".scope-back") || target.closest(".scope-all")));
    $("scope").setAttribute("data-allhot", all ? "true" : "false");
    $("scopeAll").setAttribute("data-hot", all ? "true" : "false");
    Object.keys(cells).forEach(function (k) { cells[k].setAttribute("data-hot", k === name ? "true" : "false"); });
    $("scopeList").querySelectorAll('.scope-row[data-kind="region"]').forEach(function (b) {
      b.setAttribute("data-hot", b.getAttribute("data-name") === name ? "true" : "false");
    });
  }

  /* `composer-data.js` yuklanmasa (deploy nomi o'zgargan, so'rov bloklangan)
     GEO bo'sh qoladi. Ilgari sahifa buni jimgina yutib, «~0 · butun respublika
     aholisi» deb yozardi va bu raqamni FAKT sifatida ko'rsatardi.
     Endi qadam bloklanadi va sabab aytiladi — so'ngan boshqaruv qoldirilmaydi,
     chunki u «bosib ko'ring» deb aldaydi. */
  function reportDataFailure() {
    state.dataFailed = true;
    var box = $("scopeError");
    box.textContent = "";
    var icon = document.createElementNS(SVG_NS, "svg");
    icon.setAttribute("viewBox", "0 0 16 16");
    icon.setAttribute("fill", "none");
    icon.setAttribute("stroke", "currentColor");
    icon.setAttribute("stroke-width", "1.6");
    icon.setAttribute("aria-hidden", "true");
    icon.innerHTML = '<circle cx="8" cy="8" r="6.5"/><path d="M8 5v3.6M8 11h.01" stroke-linecap="round"/>';
    box.appendChild(icon);
    box.appendChild(document.createTextNode(
      "Hudud ma’lumotlari yuklanmadi. Sahifani yangilang; muammo qolsa administratorga xabar bering."));
    box.hidden = false;
    $("scope").setAttribute("data-failed", "true");
    console.error("[composer] OM_GEO bo‘sh — composer-data.js yuklanmadi");
  }

  function initScope() {
    if (!NAMES.length) { reportDataFailure(); return; }
    buildMap();
    reportGaps();
    /* Tugma yozuvi bir marta yoziladi va boshqa o'zgarmaydi: respublika
       yig'indisi ham, hudud soni ham reestr bilan qotgan. Shu sababli
       `renderScope()` tugmani QAYTA YARATMAYDI — faqat holat atributini
       almashtiradi, demak undagi fokus saqlanadi. */
    $("scopeAllPop").textContent = popText(REPUBLIC_POP);
    $("scopeAllSub").textContent = "Reestrdagi barcha " + NAMES.length + " hudud" +
      (REPUBLIC_POP == null ? " · jami son noma’lum" : "");

    var root = $("scope");
    root.addEventListener("pointerdown", function () {
      preRow = $("scopeList").contains(document.activeElement) ? document.activeElement : null;
    });
    root.addEventListener("click", function (e) {
      var t = e.target;
      var row = t.closest && t.closest(".scope-row");
      var up = t.closest && t.closest(".scope-crumb-btn");
      var all = t.closest && t.closest(".scope-all");
      var cell = t.closest && t.closest(".scope-cell");
      var back = t.closest && t.closest(".scope-back");
      if (row) goScope(row.getAttribute("data-kind"), row.getAttribute("data-name"), true);
      else if (up) goScope(up.getAttribute("data-up"), null, true);
      /* Doimiy tugmada `moveFocus` YO'Q: tugma o'z joyida qoladi va `aria-current`
         bilan tanlovni o'zi tasdiqlaydi — fokusni ro'yxatga uloqtirish kerak emas. */
      else if (all) goScope("republic", null, false);
      else if (cell) goScope("region", cell.getAttribute("data-r"), false);
      else if (back) goScope("republic", null, false);
    });
    root.addEventListener("keydown", function (e) {
      var row = e.target.closest && e.target.closest(".scope-row");
      if (!row) return;
      var all = Array.prototype.slice.call($("scopeList").querySelectorAll(".scope-row"));
      var i = all.indexOf(row), to = -1, k = e.key;
      if (k === "ArrowDown") to = Math.min(i + 1, all.length - 1);
      else if (k === "ArrowUp") to = Math.max(i - 1, 0);
      else if (k === "Home") to = 0;
      else if (k === "End") to = all.length - 1;
      else if (k === "ArrowRight" && row.querySelector(".scope-chev")) {
        e.preventDefault();
        return goScope(row.getAttribute("data-kind"), row.getAttribute("data-name"), true);
      }
      /* ArrowLeft faqat FOKUSNI yuqoriga ko'chiradi: o'q tugmasi qamrovni
         tasdiqlamasin — tasdiq Enter/Space/bosish bilan, ataylab bo'ladi. */
      else if (k === "ArrowLeft") { var b = upButton(); if (b) { e.preventDefault(); b.focus(); } return; }
      else return;
      e.preventDefault();
      all[to].focus();
    });
    ["pointerover", "focusin"].forEach(function (t) {
      root.addEventListener(t, function (e) { hotlight(e.target); });
    });
    ["pointerleave", "focusout"].forEach(function (t) {
      root.addEventListener(t, function () { hotlight(null); });
    });
  }


  /* ---------------------------------------------------------------------------
     02 MATN
  ------------------------------------------------------------------------- */
  var TEXT_FIELDS = [
    { id: "uzTitle", count: "uzTitleCount", limit: LIMIT.title },
    { id: "uzBody",  count: "uzBodyCount",  limit: LIMIT.body },
    { id: "ruTitle", count: "ruTitleCount", limit: LIMIT.title },
    { id: "ruBody",  count: "ruBodyCount",  limit: LIMIT.body }
  ];

  function initText() {
    TEXT_FIELDS.forEach(function (f) {
      $(f.id).addEventListener("input", function () {
        // Matn qo'lda o'zgargach ssenariy tugmasi bosilgan bo'lib
        // qolmasin: ekran endi o'sha ssenariyni ko'rsatmayapti.
        document.querySelectorAll('[data-tpl][aria-pressed="true"]').forEach(function (b) {
          b.setAttribute("aria-pressed", "false");
        });
        refresh();
      });
    });

    document.querySelectorAll("[data-tpl]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var key = btn.getAttribute("data-tpl");
        var t = TEMPLATES[key];
        if (!t) {
          // Ilgari bu jim `return` edi: tugma bosilardi va HECH NIMA
          // bo'lmasdi — na matn, na xabar, na konsolda iz.
          console.error("[composer] ssenariy topilmadi: " + key);
          if (window.omToast) window.omToast("Ssenariy matni yuklanmadi — sahifani yangilang");
          return;
        }
        var replacing = TEXT_FIELDS.some(function (f) { return $(f.id).value.trim(); });
        if (replacing && !window.confirm("Yozilgan matn ssenariy matni bilan almashtiriladi. Davom etamizmi?")) return;
        $("uzTitle").value = t.uzTitle; $("uzBody").value = t.uzBody;
        $("ruTitle").value = t.ruTitle; $("ruBody").value = t.ruBody;
        document.querySelectorAll("[data-tpl]").forEach(function (b) {
          b.setAttribute("aria-pressed", b === btn ? "true" : "false");
        });
        refresh();
        if (window.omToast) window.omToast("Ssenariy matni qo‘yildi — tahrirlashingiz mumkin");
      });
    });

    $("pvUz").addEventListener("click", function () { setPreviewLang("uz"); });
    $("pvRu").addEventListener("click", function () { setPreviewLang("ru"); });
  }

  function setPreviewLang(lang) {
    state.previewLang = lang;
    $("pvUz").setAttribute("aria-pressed", lang === "uz" ? "true" : "false");
    $("pvRu").setAttribute("aria-pressed", lang === "ru" ? "true" : "false");
    refresh();
  }

  function levelFor(len, limit) {
    if (len > limit) return "crit";
    if (len > limit * 0.85) return "warn";
    return "ok";
  }

  /* ---------------------------------------------------------------------------
     03 VAQT
  ------------------------------------------------------------------------- */
  function initWhen() {
    wireRadioGroup($("whenGroup"), function (el) {
      state.when = el.getAttribute("data-when");
      $("whenLater").hidden = state.when !== "later";
      $("whenRepeat").hidden = state.when !== "repeat";
      refresh();
    });

    $("dayRow").querySelectorAll("[data-day]").forEach(function (chip) {
      chip.addEventListener("click", function () {
        var day = chip.getAttribute("data-day");
        var on = chip.getAttribute("aria-pressed") === "true";
        // `aria-pressed` — `aria-checked` EMAS: bir nechta kun birga
        // tanlanadi, bu radiogroup emas. `role=button` da `aria-checked`
        // umuman ruxsat etilmaydi, u faqat CSS ilgagi bo'lib qolgandi.
        chip.setAttribute("aria-pressed", on ? "false" : "true");
        state.days = on ? state.days.filter(function (d) { return d !== day; }) : state.days.concat(day);
        refresh();
      });
    });

    ["fDate", "fTime", "fRepeatTime"].forEach(function (id) {
      $(id).addEventListener("change", refresh);
    });

    // Eng erta sana — bugun: o'tgan kunga xabar rejalashtirib bo'lmaydi.
    var today = new Date();
    var iso = today.getFullYear() + "-" +
      String(today.getMonth() + 1).padStart(2, "0") + "-" +
      String(today.getDate()).padStart(2, "0");
    $("fDate").min = iso;
  }

  function whenText() {
    if (state.when === "now") return "Hoziroq";
    if (state.when === "later") {
      var d = $("fDate").value, t = $("fTime").value;
      if (!d) return "Sana tanlanmagan";
      if (!t) return d + " · vaqt tanlanmagan";
      return d + " · " + t;
    }
    var names = { "1": "Du", "2": "Se", "3": "Ch", "4": "Pa", "5": "Ju", "6": "Sh", "0": "Ya" };
    if (!state.days.length) return "Kunlar tanlanmagan";
    var order = ["1", "2", "3", "4", "5", "6", "0"];
    var picked = order.filter(function (d) { return state.days.indexOf(d) > -1; });
    var rt = $("fRepeatTime").value;
    // Osilib qolgan ajratkich («Du · ») chiqmasin.
    return picked.map(function (d) { return names[d]; }).join(", ") + (rt ? " · " + rt : " · vaqt tanlanmagan");
  }

  /* ---------------------------------------------------------------------------
     04 ILOVA
  ------------------------------------------------------------------------- */
  var MAX_FILES = 5, MAX_BYTES = 10 * 1024 * 1024;

  function initFiles() {
    var input = $("fFiles"), drop = $("drop");

    input.addEventListener("change", function () { addFiles(input.files); input.value = ""; });

    ["dragenter", "dragover"].forEach(function (ev) {
      drop.addEventListener(ev, function (e) { e.preventDefault(); drop.setAttribute("data-over", "true"); });
    });
    ["dragleave", "drop"].forEach(function (ev) {
      drop.addEventListener(ev, function (e) { e.preventDefault(); drop.setAttribute("data-over", "false"); });
    });
    drop.addEventListener("drop", function (e) {
      if (e.dataTransfer && e.dataTransfer.files) addFiles(e.dataTransfer.files);
    });
  }

  function addFiles(list) {
    var problems = [], added = 0, rejected = 0;
    // `problems` — sabablar RO'YXATI (takrorlanmaydi), `rejected` — rad
    // etilgan FAYLLAR soni. Ikkisi bir xil emas: 3 ta fayl bitta sabab
    // bilan rad etilsa, ro'yxatda bitta qator, lekin fayl uchta.
    function pushProblem(msg) {
      rejected++;
      if (problems.indexOf(msg) === -1) problems.push(msg);
    }
    $("errFiles").hidden = true;      // eski xabar yangi urinishga qolib ketmasin
    Array.prototype.forEach.call(list, function (file) {
      // Bir xil sabab takrorlanmasin: 3 ta fayl chegaradan oshsa,
      // «5 tadan ortiq…» jumlasi uch marta yozilib chiqardi.
      if (state.files.length >= MAX_FILES) { pushProblem("5 tadan ortiq fayl qo‘shib bo‘lmaydi"); return; }
      if (file.size > MAX_BYTES) { pushProblem("“" + file.name + "” 10 MB dan katta"); return; }
      if (!/\.(pdf|jpe?g|png)$/i.test(file.name)) { pushProblem("“" + file.name + "” — faqat PDF, JPG yoki PNG"); return; }
      state.files.push({ name: file.name, size: file.size });
      added++;
    });
    var err = $("errFiles");
    if (problems.length) {
      // Ilgari faqat BIRINCHI muammo ko'rsatilardi: 6 ta fayl tashlansa
      // qaysilari rad etilgani bilinmasdi.
      err.textContent = "";
      var icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      icon.setAttribute("viewBox", "0 0 16 16");
      icon.setAttribute("fill", "none");
      icon.setAttribute("stroke", "currentColor");
      icon.setAttribute("stroke-width", "1.6");
      icon.setAttribute("aria-hidden", "true");
      icon.innerHTML = '<circle cx="8" cy="8" r="6.5"/><path d="M8 5v3.6M8 11h.01" stroke-linecap="round"/>';
      err.appendChild(icon);
      err.appendChild(document.createTextNode(
        added + " ta qo‘shildi, " + rejected + " tasi rad etildi: " + problems.join(" · ")));
      err.hidden = false;
    } else {
      err.hidden = true;
    }
    renderFiles();
    refresh();
  }

  function humanSize(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  }

  function renderFiles() {
    var host = $("fileList");
    host.innerHTML = "";
    host.hidden = state.files.length === 0;
    state.files.forEach(function (f, i) {
      var row = document.createElement("div");
      row.className = "file-row";
      row.innerHTML =
        '<span class="file-ico" aria-hidden="true">' +
          '<svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' +
          '<path d="M11.5 2H5.5A1.5 1.5 0 0 0 4 3.5v13A1.5 1.5 0 0 0 5.5 18h9a1.5 1.5 0 0 0 1.5-1.5V6.5L11.5 2Z"/><path d="M11.5 2v4.5H16"/></svg>' +
        "</span>" +
        '<span class="file-name"></span>' +
        '<span class="file-size"></span>';
      row.querySelector(".file-name").textContent = f.name;
      row.querySelector(".file-size").textContent = humanSize(f.size);

      var del = document.createElement("button");
      del.type = "button";
      del.className = "icon-btn";
      del.setAttribute("aria-label", "“" + f.name + "” faylini olib tashlash");
      del.innerHTML = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M6 6l8 8M14 6l-8 8"/></svg>';
      del.addEventListener("click", function () {
        // «5 tadan ortiq» xabari o'chirishdan keyin ham turib qolardi —
        // ya'ni u endi mavjud bo'lmagan chegarani da'vo qilardi.
        $("errFiles").hidden = true;
        state.files.splice(i, 1);
        renderFiles();
        refresh();
        if (window.omToast) window.omToast("Fayl olib tashlandi");
        // Fokus yo'qolmasin: ro'yxat bo'shasa tanlash tugmasiga qaytamiz.
        var next = $("fileList").querySelector(".icon-btn");
        (next || document.querySelector('label[for="fFiles"]')).focus();
      });
      row.appendChild(del);
      host.appendChild(row);
    });
  }

  /* ---------------------------------------------------------------------------
     TEKSHIRUV
     Xato matni MUAMMONI emas, NIMA QILISH KERAKLIGINI aytadi.
  ------------------------------------------------------------------------- */
  function validate() {
    var errors = [];

    // Ma'lumot yo'q bo'lsa forma umuman yuborilmaydi; xabar `scopeError`
    // da allaqachon turibdi, uni bosib ketmaymiz.
    if (state.dataFailed) {
      errors.push({
        el: null, box: $("scopeError"),
        msg: "Hudud ma’lumotlari yuklanmadi. Sahifani yangilang; muammo qolsa administratorga xabar bering."
      });
    }
    else if (!state.scope) errors.push({ el: $("scopeAll"), box: $("scopeError"), msg: null });

    var textRules = [
      { id: "uzTitle", box: "errUzTitle", empty: "O‘zbekcha sarlavhani yozing.", limit: LIMIT.title, over: "Sarlavha bir qatorga sig‘maydi — {n} ta belgi ortiqcha." },
      { id: "uzBody",  box: "errUzBody",  empty: "O‘zbekcha matnni yozing.",     limit: LIMIT.body,  over: "Matn ikki qatorga sig‘maydi — {n} ta belgi ortiqcha." },
      { id: "ruTitle", box: "errRuTitle", empty: "Ruscha sarlavhani yozing.",    limit: LIMIT.title, over: "Sarlavha bir qatorga sig‘maydi — {n} ta belgi ortiqcha." },
      { id: "ruBody",  box: "errRuBody",  empty: "Ruscha matnni yozing.",        limit: LIMIT.body,  over: "Matn ikki qatorga sig‘maydi — {n} ta belgi ortiqcha." }
    ];
    textRules.forEach(function (r) {
      var v = $(r.id).value.trim();
      if (!v) errors.push({ el: $(r.id), box: $(r.box), msg: r.empty });
      else if (v.length > r.limit) errors.push({ el: $(r.id), box: $(r.box), msg: r.over.replace("{n}", v.length - r.limit) });
    });

    if (state.when === "later") {
      var date = $("fDate").value, time = $("fTime").value;
      if (!date) errors.push({ el: $("fDate"), box: $("errDate"), msg: "Yuborish sanasini tanlang." });
      if (!time) errors.push({ el: $("fTime"), box: $("errTime"), msg: "Yuborish vaqtini tanlang." });
      if (date && time) {
        // `min` atributi faqat tanlagichni cheklaydi — qo'lda yozilgan
        // yoki eski qoralamadan qolgan sanani u to'xtatmaydi.
        var when = new Date(date + "T" + time);
        if (!isNaN(when) && when.getTime() < Date.now()) {
          errors.push({ el: $("fDate"), box: $("errDate"), msg: "Bu vaqt allaqachon o'tib ketgan — kelgusi sana va vaqtni tanlang." });
        }
      }
    }
    if (state.when === "repeat") {
      if (!state.days.length) {
        errors.push({ el: $("dayRow").querySelector("[data-day]"), box: $("errDays"), msg: "Kamida bitta kunni tanlang." });
      }
      // Maydon yulduzcha bilan majburiy deb belgilangan edi, lekin hech
      // qayerda tekshirilmasdi: bo'sh qoldirilsa ekran «Hammasi
      // to'ldirilgan» deb turardi va ko'rinishda 09:00 paydo bo'lardi.
      if (!$("fRepeatTime").value) {
        errors.push({ el: $("fRepeatTime"), box: $("errRepeatTime"), msg: "Takroriy yuborish vaqtini tanlang." });
      }
    }
    return errors;
  }

  function clearErrors() {
    document.querySelectorAll(".field-error").forEach(function (b) { if (b.id !== "errFiles") b.hidden = true; });
    document.querySelectorAll("[aria-invalid]").forEach(function (f) { f.removeAttribute("aria-invalid"); });
  }

  function showErrors(errors) {
    clearErrors();
    errors.forEach(function (e) {
      if (e.box) {
        if (e.msg) {
          e.box.textContent = "";
          var icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
          icon.setAttribute("viewBox", "0 0 16 16");
          icon.setAttribute("fill", "none");
          icon.setAttribute("stroke", "currentColor");
          icon.setAttribute("stroke-width", "1.6");
          icon.setAttribute("aria-hidden", "true");
          icon.innerHTML = '<circle cx="8" cy="8" r="6.5"/><path d="M8 5v3.6M8 11h.01" stroke-linecap="round"/>';
          e.box.appendChild(icon);
          e.box.appendChild(document.createTextNode(e.msg));
        }
        e.box.hidden = false;
      }
      if (e.el && e.el.tagName !== "BUTTON") e.el.setAttribute("aria-invalid", "true");
    });
  }

  /* ---------------------------------------------------------------------------
     YANGILASH — bitta funksiya butun ko'rinishni state'dan qayta chizadi.
     Har boshqaruv o'z bo'lagini alohida yangilasa, ular vaqt o'tib
     bir-biridan uzilib qoladi.
  ------------------------------------------------------------------------- */
  function refresh() {
    // Forma o'zgardi — pastdagi so'rov tanasi endi ekranga mos emas.
    // Uni qoldirish sahifani bir vaqtda «to'ldirilmagan» va «mana
    // tayyor tanangiz» deb turishga majbur qilardi.
    // Lekin TANAGA kirmaydigan o'zgarish (ko'rinish tili) panelni
    // o'chirmasligi kerak, shuning uchun imzo bo'yicha solishtiriladi.
    var slot = $("resultSlot");
    if (slot.firstChild && payloadSignature() !== renderedSignature) slot.innerHTML = "";

    // --- qamrov ---
    renderScope();
    var path = scopePath();
    var reachNum = currentReach();
    var reach = reachNum == null ? null : formatPop(reachNum);

    // --- matn hisoblagichlari ---
    TEXT_FIELDS.forEach(function (f) {
      var len = $(f.id).value.trim().length;
      var c = $(f.count);
      c.textContent = len + "/" + f.limit;
      c.setAttribute("data-level", levelFor(len, f.limit));
    });

    var uzOk = $("uzTitle").value.trim() && $("uzBody").value.trim();
    var ruOk = $("ruTitle").value.trim() && $("ruBody").value.trim();
    $("uzState").textContent = uzOk ? "To‘liq" : "To‘liq emas";
    $("ruState").textContent = ruOk ? "To‘liq" : "To‘liq emas";

    // --- ko'rinish ---
    var lang = state.previewLang;
    var title = $(lang + "Title").value.trim();
    var body = $(lang + "Body").value.trim();
    $("pvTitle").textContent = title;
    $("pvText").textContent = body;
    // Tanlanmagan vaqt o'rniga 09:00 QO'YILMAYDI — ilgari ko'rinish
    // operator kiritmagan vaqtni ko'rsatib turardi.
    var pvTime = state.when === "now" ? "hozir"
      : state.when === "repeat" ? $("fRepeatTime").value
      : $("fTime").value;
    $("pvTime").textContent = pvTime || "—";

    var fit = $("pvFit"), fitText = $("pvFitText");
    fit.className = "chip";
    if (!title && !body) {
      fit.classList.add("chip-mono"); fitText.textContent = "Matn kiritilmagan";
    } else if (title.length > LIMIT.title || body.length > LIMIT.body) {
      fit.classList.add("chip-crit"); fitText.textContent = "Matn kesiladi";
    } else if (title.length > LIMIT.title * 0.85 || body.length > LIMIT.body * 0.85) {
      fit.classList.add("chip-warn"); fitText.textContent = "Chegaraga yaqin";
    } else {
      fit.classList.add("chip-ok"); fitText.textContent = "To‘liq sig‘adi";
    }

    $("sideScope").textContent = path ? path[path.length - 1] : "—";
    $("sideReach").textContent = reach ? "~" + reach : "—";
    $("sideWhen").textContent = whenText();

    // --- yakun ---
    function setRecap(id, value, fallback) {
      var el = $(id);
      el.textContent = value || fallback;
      el.setAttribute("data-empty", value ? "false" : "true");
    }
    setRecap("rcScope", path ? path.join(" · ") : "", "tanlanmagan");
    setRecap("rcReach", reach ? "~" + reach : "", "—");
    setRecap("rcUz", $("uzTitle").value.trim(), "yozilmagan");
    setRecap("rcRu", $("ruTitle").value.trim(), "yozilmagan");
    $("rcWhen").textContent = whenText();
    setRecap("rcFiles", state.files.length ? state.files.length + " ta fayl" : "", "yo‘q");

    // --- holat qatori ---
    var errors = validate();
    var status = $("status"), text = $("statusText");
    if (!errors.length) {
      status.setAttribute("data-tone", "ok");
      text.textContent = "Hammasi to‘ldirilgan";
    } else {
      status.setAttribute("data-tone", state.submitted ? "crit" : "");
      text.textContent = errors.length + " ta maydon to‘ldirilishi kerak";
    }
    if (state.submitted) showErrors(errors);
    return errors;
  }

  /* So'rov tanasiga KIRADIGAN holatning imzosi. Ko'rinish tili, fokus,
     ochiq-yopiq bo'limlar bu yerga kirmaydi. */
  var renderedSignature = null;
  function payloadSignature() {
    return [
      state.scope, state.region, state.district, state.mahalla,
      $("uzTitle").value, $("uzBody").value, $("ruTitle").value, $("ruBody").value,
      state.when, $("fDate").value, $("fTime").value, $("fRepeatTime").value,
      state.days.slice().sort().join(","),
      state.files.map(function (f) { return f.name + ":" + f.size; }).join(",")
    ].join("|");
  }

  /* ---------------------------------------------------------------------------
     YUBORISH — server yo'q, shuning uchun MUVAFFAQIYAT DA'VO QILINMAYDI.
  ------------------------------------------------------------------------- */
  function initSubmit() {
    $("submitBtn").addEventListener("click", function () {
      state.submitted = true;
      var errors = refresh();
      if (errors.length) {
        var first = errors[0].el;
        if (first) { first.focus(); first.scrollIntoView({ block: "center", behavior: "smooth" }); }
        if (window.omToast) {
          window.omToast(state.dataFailed
            ? "Hudud ma’lumotlari yuklanmadi — yuborib bo‘lmaydi"
            : errors.length + " ta maydon to‘ldirilmagan");
        }
        return;
      }
      runSubmit();
    });

    $("resetBtn").addEventListener("click", function () {
      if (!window.confirm("Barcha kiritilgan ma’lumot o‘chiriladi. Davom etamizmi?")) return;
      window.location.reload();
    });
  }

  /* Bu yerda kutiladigan hech narsa yo'q: tekshiruv `click` ichida
     sinxron tugaydi, tana esa darhol yig'iladi. Ilgari 700ms lik
     kechikish va «Tekshirilmoqda» yozuvi bor edi — ular bo'lmagan
     ishni bo'layotgandek ko'rsatardi. Javob endi darhol chiqadi;
     tugma bosilganini panelning o'zi va toast tasdiqlaydi. */
  function runSubmit() {
    renderDemoResult();
    $("resultSlot").scrollIntoView({ block: "center", behavior: "smooth" });
  }

  function renderDemoResult() {
    // Daraja bo'yicha kesish — `goScope` bilan birga ikkinchi himoya.
    // Tana HECH QACHON o'z `scope_level` idan chuqurroq hudud ko'rsatmasin.
    var depth = LEVELS.indexOf(state.scope);
    var payload = {
      scope_level: state.scope,
      region:   depth >= 1 ? (state.region || null) : null,
      district: depth >= 2 ? (state.district || null) : null,
      mahalla:  depth >= 3 ? (state.mahalla || null) : null,
      body: {
        uz: { title: $("uzTitle").value.trim(), text: $("uzBody").value.trim() },
        ru: { title: $("ruTitle").value.trim(), text: $("ruBody").value.trim() }
      },
      schedule: state.when === "now" ? { mode: "now" }
        : state.when === "later" ? { mode: "at", date: $("fDate").value, time: $("fTime").value }
        : { mode: "weekly", days: state.days.slice().sort(), time: $("fRepeatTime").value },
      attachments: state.files.map(function (f) { return f.name; })
    };

    var host = $("resultSlot");
    host.innerHTML = "";
    var box = document.createElement("div");
    box.className = "result";
    box.innerHTML =
      '<div class="result-head">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
          '<path d="M10.3 3.6 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/></svg>' +
        '<div>' +
          '<p class="result-title">Xabar YUBORILMADI — bu demo</p>' +
          '<p class="result-body">Bu sahifada server ulanmagan. Forma to‘g‘ri to‘ldirildi va quyidagi ' +
          'so‘rov tanasi yig‘ildi, lekin u hech qayerga ketmadi. Reestr raqami ham berilmadi — ' +
          'uni faqat server beradi.</p>' +
        "</div>" +
      "</div>" +
      '<div class="result-payload"><pre></pre></div>';
    box.querySelector("pre").textContent = JSON.stringify(payload, null, 2);
    host.appendChild(box);
    renderedSignature = payloadSignature();
    if (window.omToast) window.omToast("Demo: so‘rov tanasi yig‘ildi, yuborilmadi");
  }

  /* ------------------------------------------------------------------------ */
  function boot() {
    initScope();
    initText();
    initWhen();
    initFiles();
    initSubmit();
    refresh();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
