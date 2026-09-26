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

  /* Push bildirishnomasi ko'rsatadigan chegara. Sarlavha bir qator,
     matn ikki qator — o'rtacha qurilmada shuncha belgi sig'adi. */

  var state = {
    scope: null,          // republic | region | district | mahalla
    region: "", district: "", mahalla: "",
    dataFailed: false,    // `composer-data.js` yuklanmadi
    when: "now",
    days: [],           // "0".."6" — JS getDay() konvensiyasi
    span: "months",     // months | range — takrorlanish QAYSI DAVRDA amal qiladi
                        // («always» OLIB TASHLANDI: muddatsizlik endi 12 oyni belgilash bilan)
    months: [],         // 1..12, faqat span === "months" da ma'noga ega
    /* Rejim almashganda `false` ga tushadi: endi ochilgan panel qizil bo'lib
       qarshi olmasin, o'q tugma bilan segmentdan o'tayotganda oraliq
       rejimning xatolari chaqnab o'tmasin. */
    whenTouched: false,
    files: [],
    previewLang: "uz",
    submitted: false      // tekshiruv xatolari faqat urinishdan keyin ko'rinadi
  };

  var touched = {};
  var REQUIRED_SECTIONS = [2, 1, 3];
  var SECTION_NAME = { 1: "Ким олади", 2: "Хабар матни", 3: "Қачон кетади", 4: "Илова" };

  /* ---------------------------------------------------------------------------
     RADIOGROUP — o'q tugmalar bilan yurish, roving tabindex.
     `role="radio"` va'da bergan xulqni bermasak, klaviatura foydalanuvchisi
     guruh ichida qamalib qoladi.
  ------------------------------------------------------------------------- */
  function wireRadioGroup(group, onSelect) {
    var items = Array.prototype.slice.call(group.querySelectorAll('[role="radio"]')).filter(function (it) {
      return it.closest('[role="radiogroup"]') === group;
    });
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
        if (e.key === "Home") { e.preventDefault(); return focusIndex(0); }
        if (e.key === "End") { e.preventDefault(); return focusIndex(items.length - 1); }
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
    if (state.scope === "republic") return ["Ўзбекистон Республикаси"];
    var parts = [];
    if (state.region) parts.push(state.region);
    if (state.scope !== "region" && state.district) parts.push(state.district);
    if (state.scope === "mahalla" && state.mahalla) parts.push(state.mahalla);
    return parts.length ? parts : null;
  }

  var CHEV = '<svg class="ico scope-chev" aria-hidden="true" focusable="false"><use href="#i-chevron-right"/></svg>';
  var SVG_NS = "http://www.w3.org/2000/svg";
  var scopeSig = null;
  var wantFocus = false;
  var preRow = null;
  var areaMode = false;
  var scopeQuery = "";
  var areaStash = null;

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  var LATIN = [["o‘", "у"], ["oʻ", "у"], ["oʼ", "у"], ["o'", "у"], ["o`", "у"], ["o’", "у"], ["g‘", "г"], ["gʻ", "г"], ["gʼ", "г"], ["g'", "г"], ["g`", "г"], ["g’", "г"],
    ["sh", "ш"], ["ch", "ч"], ["yo", "е"], ["yu", "ю"], ["ya", "я"], ["ye", "е"], ["ts", "ц"],
    ["a", "а"], ["b", "б"], ["c", "к"], ["d", "д"], ["e", "е"], ["f", "ф"], ["g", "г"], ["h", "х"], ["i", "и"],
    ["j", "ж"], ["k", "к"], ["l", "л"], ["m", "м"], ["n", "н"], ["o", "о"], ["p", "п"], ["q", "к"], ["r", "р"],
    ["s", "с"], ["t", "т"], ["u", "у"], ["v", "в"], ["w", "в"], ["x", "х"], ["y", "й"], ["z", "з"]];
  var FOLD = { "қ": "к", "ғ": "г", "ҳ": "х", "ў": "у", "ё": "е", "э": "е", "ъ": "", "ь": "" };
  function norm(s) {
    var out = String(s).toLowerCase();
    LATIN.forEach(function (pair) { out = out.split(pair[0]).join(pair[1]); });
    return out.replace(/[қғҳўёэъь]/g, function (c) { return FOLD[c]; }).replace(/['‘ʻʼ`’]/g, "").replace(/\s+/g, " ");
  }

  function reportGaps() {
    if (!NO_POP.length) return;
    $("scopeCrumbs").insertAdjacentHTML("beforebegin",
      '<p class="note note-warn"><svg class="ico" aria-hidden="true" focusable="false"><use href="#i-triangle-alert"/></svg>' +
      '<span>Реестр тўлиқ эмас: аҳоли сони йўқ — ' + esc(NO_POP.join(", ")) + '. Бу ҳудудлар учун тахминий рақам ҳам, республика йиғиндиси ҳам кўрсатилмайди.</span></p>');
  }

  function searchRows(q) {
    var out = [];
    NAMES.forEach(function (r) {
      if (norm(r).indexOf(q) > -1) out.push({ kind: "region", name: r, pop: GEO[r].pop, region: r });
      var ds = districtsOf(r);
      Object.keys(ds).forEach(function (d) {
        if (norm(d).indexOf(q) > -1) out.push({ kind: "district", name: d, pop: ds[d].pop, region: r, district: d, sub: r });
        var ms = mahallasOf(r, d);
        Object.keys(ms).forEach(function (m) {
          if (norm(m).indexOf(q) > -1) out.push({ kind: "mahalla", name: m, pop: ms[m], region: r, district: d, mahalla: m, sub: d + " · " + r });
        });
      });
    });
    var shown = out.slice(0, 40).map(function (it, i) { it.idx = i + 1; return it; });
    shown.total = out.length;
    return shown;
  }

  function scopeRows() {
    if (scopeQuery) return searchRows(scopeQuery);
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
      list.innerHTML = scopeQuery
        ? '<li class="scope-empty hint">«' + esc($("scopeSearch").value.trim()) + '» бўйича ҳудуд топилмади — бошқача ёзиб кўринг.</li>'
        : '<li class="scope-empty hint">Реестрда бу поғона учун ёзув йўқ — қамров юқоридаги даражада қолади.</li>';
      return rows;
    }
    list.innerHTML = rows.map(function (it) {
      var on = it.kind === "mahalla" && state.mahalla === it.name;
      var path = it.region ? ' data-region="' + esc(it.region) + '" data-district="' + esc(it.district || "") + '" data-mahalla="' + esc(it.mahalla || "") + '"' : "";
      return '<li><button type="button" class="scope-row" data-kind="' + it.kind + '" data-name="' + esc(it.name) + '"' + path +
        ' aria-describedby="scopeError"' + (on ? ' aria-current="true"' : "") + ">" +
        '<span class="scope-idx">' + pad(it.idx) + "</span>" +
        '<span class="scope-name">' + esc(it.name) + (it.sub ? '<span class="scope-sub">' + esc(it.sub) + "</span>" : "") + "</span>" +
        '<span class="scope-pop">' + popText(it.pop) + "</span>" + (it.deep ? CHEV : "") + "</button></li>";
    }).join("");
    return rows;
  }

  /* Crumb sof navigatsiya EMAS — u qamrovni o'sha darajaga KO'TARADI, shuning
     uchun label harakatni aytadi: «qaytish» desa, ko'r foydalanuvchi 450 ming
     o'rniga 35 millionni tasdiqlab qo'yardi. */
  function renderScopeCrumbs() {
    var el = $("scopeCrumbs");
    if (!state.scope) { el.innerHTML = '<span class="scope-crumb scope-crumb-off">Қамров ҳали танланмаган</span>'; return; }
    var cr = [{ up: "root", label: "Барча ҳудудлар", action: "Ҳудудлар рўйхатига қайтиш" }];
    if (state.region) cr.push({ up: "region", label: state.region, action: "Қамровни бутун " + state.region + "га ўзгартириш" });
    if (state.scope !== "region" && state.district) cr.push({ up: "district", label: state.district, action: "Қамровни бутун " + state.district + "га ўзгартириш" });
    if (state.scope === "mahalla" && state.mahalla) cr.push({ label: state.mahalla });
    el.innerHTML = cr.map(function (c, i) {
      var sep = i ? '<span class="scope-sep" aria-hidden="true">/</span>' : "";
      return sep + (i === cr.length - 1
        ? '<span class="scope-crumb" aria-current="true">' + esc(c.label) + "</span>"
        : '<button type="button" class="scope-crumb scope-crumb-btn" data-up="' + c.up + '" aria-label="' + esc(c.action) + '">' + esc(c.label) + "</button>");
    }).join("");
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
    var sig = [state.scope, state.region, state.district, state.mahalla, scopeQuery, areaMode].join("|");
    // Matn yozilayotganda `refresh()` sekundiga o'nlab marta chaqiriladi —
    // qamrov o'zgarmagan bo'lsa ro'yxatni qayta qurish bekorga DOM churn va
    // fokusni ushlab turgan qatorni yo'q qilish xavfi.
    if (sig === scopeSig && !wantFocus) return;
    var changed = sig !== scopeSig;
    scopeSig = sig;

    var list = $("scopeList");
    var active = document.activeElement === document.body && preRow ? preRow : document.activeElement;
    var keep = list.contains(active) ? active.getAttribute("data-name") : null;

    if (changed) renderScopeCrumbs();
    var rows = changed ? renderScopeList() : scopeRows();

    var all = $("scopeAll"), areaBtn = $("scopeArea");
    var area = areaMode || (!!state.scope && state.scope !== "republic");
    all.setAttribute("aria-checked", state.scope === "republic" ? "true" : "false");
    areaBtn.setAttribute("aria-checked", area ? "true" : "false");
    all.tabIndex = area ? -1 : 0;
    areaBtn.tabIndex = area ? 0 : -1;
    reveal($("scopeAreaBody"), area);

    var count = scopeQuery ? "Қидирув натижалари · " + (rows.total > rows.length ? rows.length + " / " + rows.total : rows.length)
      : state.scope === "region" ? "Туманлар ва шаҳарлар · " + rows.length
      : (state.scope === "district" || state.scope === "mahalla") ? "Маҳаллалар (МФЙ) · " + rows.length
      : "Ҳудудлар · " + NAMES.length;
    $("scopeLvl").textContent = count;
    /* Ekran o'quvchi uchun HAL QILUVCHI raqam — qamrov; yo'lning o'zi tanlov bo'lganini ham aytadi. */
    var reach = currentReach();
    $("scopeLive").textContent = state.scope
      ? scopePath().join(" / ") + " танланди. Тахминий қамров " + (reach == null ? "номаълум" : popText(reach) + " киши") + ". " + count + "."
      : "Қамров танланмаган. " + count + ".";

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
    areaMode = level !== "republic";
    $("scopeError").hidden = true;
    wantFocus = !!moveFocus;
    refresh();
  }

  function pickPath(row) {
    state.region = row.getAttribute("data-region") || "";
    state.district = row.getAttribute("data-district") || "";
    state.mahalla = row.getAttribute("data-mahalla") || "";
    state.scope = row.getAttribute("data-kind");
    areaMode = true;
    scopeQuery = "";
    $("scopeSearch").value = "";
    $("scopeError").hidden = true;
    wantFocus = true;
    refresh();
  }

  function scopeRoot() {
    areaStash = null;
    state.scope = null;
    state.region = state.district = state.mahalla = "";
    areaMode = true;
    wantFocus = true;
    refresh();
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
    /* Ikonka spraytdan: qalinlik va uch shakli `.ico` sinfida bir joyda.
       Ilgari SVG shu yerda qo'lda qurilib, atributlari qolgan
       ikonkalardan mustaqil ravishda yozilardi. */
    var icon = document.createElementNS(SVG_NS, "svg");
    icon.setAttribute("class", "ico");
    icon.setAttribute("aria-hidden", "true");
    icon.setAttribute("focusable", "false");
    icon.innerHTML = '<use href="#i-circle-alert"/>';
    box.appendChild(icon);
    box.appendChild(document.createTextNode(
      "Ҳудуд маълумотлари юкланмади. Саҳифани янгиланг; муаммо қолса администраторга хабар беринг."));
    box.hidden = false;
    $("scope").setAttribute("data-failed", "true");
    console.error("[composer] OM_GEO bo‘sh — composer-data.js yuklanmadi");
  }

  function initScope() {
    if (!NAMES.length) { reportDataFailure(); return; }
    reportGaps();
    /* Tugma yozuvi bir marta yoziladi va boshqa o'zgarmaydi: respublika
       yig'indisi ham, hudud soni ham reestr bilan qotgan. Shu sababli
       `renderScope()` tugmani QAYTA YARATMAYDI — faqat holat atributini
       almashtiradi, demak undagi fokus saqlanadi. */
    $("scopeAllPop").textContent = popText(REPUBLIC_POP);
    $("scopeAllSub").textContent = "Реестрдаги барча " + NAMES.length + " ҳудуд" +
      (REPUBLIC_POP == null ? " · жами сон номаълум" : "");

    var root = $("scope");
    wireRadioGroup($("scopeGroup"), function (el) {
      if (el.id === "scopeAll") {
        if (state.scope && state.scope !== "republic") {
          areaStash = { scope: state.scope, region: state.region, district: state.district, mahalla: state.mahalla };
        }
        return goScope("republic", null, false);
      }
      if (state.scope === "republic") state.scope = null;
      if (areaStash && !state.scope) {
        state.scope = areaStash.scope; state.region = areaStash.region;
        state.district = areaStash.district; state.mahalla = areaStash.mahalla;
      }
      areaMode = true;
      refresh();
    });
    $("scopeSearch").addEventListener("input", function () {
      scopeQuery = norm(this.value.trim());
      refresh();
    });
    root.addEventListener("pointerdown", function () {
      preRow = $("scopeList").contains(document.activeElement) ? document.activeElement : null;
    });
    root.addEventListener("click", function (e) {
      var t = e.target;
      var row = t.closest && t.closest(".scope-row");
      var up = t.closest && t.closest(".scope-crumb-btn");
      if (row && row.hasAttribute("data-region")) pickPath(row);
      else if (row) goScope(row.getAttribute("data-kind"), row.getAttribute("data-name"), true);
      else if (up && up.getAttribute("data-up") === "root") scopeRoot();
      else if (up) goScope(up.getAttribute("data-up"), null, true);
    });
    root.addEventListener("keydown", function (e) {
      if (e.target.id === "scopeSearch" && e.key === "ArrowDown") {
        var first = $("scopeList").querySelector(".scope-row");
        if (first) { e.preventDefault(); first.focus(); }
        return;
      }
      var row = e.target.closest && e.target.closest(".scope-row");
      if (!row) return;
      var all = Array.prototype.slice.call($("scopeList").querySelectorAll(".scope-row"));
      var i = all.indexOf(row), to = -1, k = e.key;
      if (k === "ArrowDown") to = Math.min(i + 1, all.length - 1);
      else if (k === "ArrowUp" && i === 0) { e.preventDefault(); $("scopeSearch").focus(); return; }
      else if (k === "ArrowUp") to = Math.max(i - 1, 0);
      else if (k === "Home") to = 0;
      else if (k === "End") to = all.length - 1;
      else if (k === "ArrowRight" && row.querySelector(".scope-chev")) {
        e.preventDefault();
        return row.hasAttribute("data-region") ? pickPath(row) : goScope(row.getAttribute("data-kind"), row.getAttribute("data-name"), true);
      }
      /* ArrowLeft faqat FOKUSNI yuqoriga ko'chiradi: o'q tugmasi qamrovni
         tasdiqlamasin — tasdiq Enter/Space/bosish bilan, ataylab bo'ladi. */
      else if (k === "ArrowLeft") { var b = upButton(); if (b) { e.preventDefault(); b.focus(); } return; }
      else return;
      e.preventDefault();
      all[to].focus();
    });
  }


  /* ---------------------------------------------------------------------------
     02 MATN
  ------------------------------------------------------------------------- */
  /* Belgi CHEGARASI yo'q. Push bildirishnomasi matnni operatsion tizim
     darajasida qisqartiradi, lekin bu bizning cheklovimiz emas: foydalanuvchi
     xabarni ochib to'lig'ini o'qiydi. Shuning uchun hisoblagichda maxraj yo'q,
     `maxlength` yo'q va uzunlik uchun xato ham yo'q — ekran faqat push'da
     nechta qator ko'rinishini AYTADI. */
  var TEXT_FIELDS = [
    { id: "uzTitle", count: "uzTitleCount" },
    { id: "uzBody",  count: "uzBodyCount" },
    { id: "ruTitle", count: "ruTitleCount" },
    { id: "ruBody",  count: "ruBodyCount" }
  ];

  function initText() {
    TEXT_FIELDS.forEach(function (f) {
      $(f.id).addEventListener("input", refresh);
    });

    $("pvUz").addEventListener("click", function () { setPreviewLang("uz"); });
    $("pvRu").addEventListener("click", function () { setPreviewLang("ru"); });
    [["uz", "uzTitle", "uzBody"], ["ru", "ruTitle", "ruBody"]].forEach(function (group) {
      [group[1], group[2]].forEach(function (id) {
        $(id).addEventListener("focus", function () {
          if (state.previewLang !== group[0]) setPreviewLang(group[0]);
        });
      });
    });
  }

  function setPreviewLang(lang) {
    state.previewLang = lang;
    $("pvUz").setAttribute("aria-pressed", lang === "uz" ? "true" : "false");
    $("pvRu").setAttribute("aria-pressed", lang === "ru" ? "true" : "false");
    refresh();
  }

  /* ---------------------------------------------------------------------------
     03 VAQT
  ------------------------------------------------------------------------- */
  /* ---------------------------------------------------------------------------
     03 QACHON — takrorlanish va uning DAVRI
     Ekrandagi jumla, keyingi yuborish sanalari va so'rov tanasi BITTA
     manbadan chiqadi: `schedulePayload()` va `runs()`. Ular ajralib
     qololmaydi, chunki ekran ham, tana ham o'sha bitta hisobni o'qiydi.
  ------------------------------------------------------------------------- */
  /* 03-bo'limga tegishli xato qutilari — ular faqat bo'limga teginilgandan
     keyin ko'rsatiladi. */
  var WHEN_BOXES = ["errDate", "errTime", "errDays", "errRepeatTime", "errMonths", "errFrom", "errTo", "errRuns"];
  var ORDER = ["1", "2", "3", "4", "5", "6", "0"];          // Du..Ya — ekranda ham, tanada ham shu tartib
  var DAY_CODE = { "0": "SU", "1": "MO", "2": "TU", "3": "WE", "4": "TH", "5": "FR", "6": "SA" };
  var DAY_SHORT = { "1": "Ду", "2": "Се", "3": "Чо", "4": "Па", "5": "Жу", "6": "Ша", "0": "Як" };
  var DAY_FULL = { "1": "душанба", "2": "сешанба", "3": "чоршанба", "4": "пайшанба",
                   "5": "жума", "6": "шанба", "0": "якшанба" };
  var MONTH_SHORT = ["Ян", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ной", "Дек"];
  var MONTH_FULL = ["январ", "феврал", "март", "апрел", "май", "июн",
                    "июл", "август", "сентябр", "октябр", "ноябр", "декабр"];
  var TZID = "Asia/Tashkent";
  var TZ_OFFSET_MIN = 300;      // Asia/Tashkent butun yil qat'iy +05:00, yozgi vaqt yo'q
  var MAX_SCAN_DAYS = 4000;
  var MAX_RUNS = 500;

  /* Brauzer boshqa mintaqada bo'lsa ham hisob TOSHKENT devor soatida yuradi:
     bo'lim sarlavhasi «Toshkent vaqti · UTC+5» deb turibdi, demak ekrandagi
     har sana shu vaqtda o'qilishi kerak. Berlin yoki Tokioda ochilgan sahifa
     boshqa kunni ko'rsatsa, sarlavha yolg'on bo'lardi. */
  function tashNow() {
    var n = new Date();
    return new Date(n.getTime() + (n.getTimezoneOffset() + TZ_OFFSET_MIN) * 60000);
  }
  function pad2(n) { return (n < 10 ? "0" : "") + n; }
  /* `toISOString()` bu bo'limda TAQIQ: u UTC ga o'tkazadi va Toshkentda
     soat 05:00 gacha bir kun ORQAGA beradi. */
  function isoOf(d) { return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate()); }
  function dateLabel(d) {
    var label = d.getDate() + " " + MONTH_FULL[d.getMonth()];
    return d.getFullYear() === tashNow().getFullYear() ? label : label + " " + d.getFullYear();
  }
  /* ISO satr HECH QACHON `new Date(str)` ga berilmaydi — u UTC deb o'qiladi va
     hafta kunini siljitadi. Komponentlar bo'yicha, soat 12:00 da quriladi:
     hech qanday ofset sanani boshqa kunga o'tkaza olmaydi. */
  function ymd(str) {
    var p = String(str).split("-");
    if (p.length !== 3) return null;
    var d = new Date(+p[0], +p[1] - 1, +p[2], 12, 0, 0);
    return isNaN(d) ? null : d;
  }

  function dateIso(id) {
    var el = $(id);
    return el.dataset.iso != null ? el.dataset.iso : el.value;
  }
  function dateBad(id) {
    var el = $(id);
    return el.dataset.bad === "true" || !!(el.validity && el.validity.badInput);
  }
  function timeVal(id) {
    var el = $(id);
    return el.dataset.time != null ? el.dataset.time : el.value;
  }
  function timeBad(id) { return $(id).dataset.bad === "true"; }
  function dateText(id) {
    var d = ymd(dateIso(id));
    return d ? dateLabel(d) : "";
  }

  /* Takrorlanish qoidasining SOF ko'rinishi — ekran ham, tana ham shundan
     oziqlanadi. Faol bo'lmagan tarmoq bu yerga tushmaydi. */
  function scheduleRule() {
    var days = ORDER.filter(function (d) { return state.days.indexOf(d) > -1; });
    var w;
    switch (state.span) {
      case "months": w = { kind: "months", months: state.months.slice().sort(function (a, b) { return a - b; }) }; break;
      case "range":  w = { kind: "range", from: dateIso("fFrom") || null, to: dateIso("fTo") || null }; break;
      /* Ilgari bu yerda `default: w = { kind: "always" }` turardi. «Doimiy»
         olib tashlangach uni qoldirish XAVFLI bo'lardi: `state.span` biror
         sabab bilan noma'lum qiymat olsa, ekran ikki variantdan birini
         ko'rsatib turib, tanaga olib tashlangan uchinchisini jimgina
         jo'natardi. Endi bu holat baland ovozda yiqiladi. */
      default: throw new Error("номаълум спан: " + state.span);
    }
    // Ikki tarmoq birga chiqsa tana bilan ekran ajralgan bo'lardi — bu holat
    // tuzilish darajasida imkonsiz, lekin jimgina o'tib ketmasin.
    if (w.months && (w.from || w.to)) throw new Error("виндов икки тармоқ");
    return { days: days, time: timeVal("fRepeatTime") || null, window: w };
  }

  /* Keyingi yuborish vaqtlari. Kalendar bo'ylab KUN-KUN yuriladi
     (`setDate(+1)`): millisekund qo'shish yozgi vaqtli mintaqada soatni
     siljitadi, `setMonth(+1)` esa 31-kunda oyni sakrab o'tadi. */
  function computeRuns(limit) {
    var rule = scheduleRule();
    if (!rule.days.length || !rule.time) return { list: [], capped: false };
    var w = rule.window;
    if (w.kind === "range" && (!w.from || !w.to)) return { list: [], capped: false };

    var hm = rule.time.split(":");
    var hh = +hm[0], mm = +hm[1];
    if (!isFinite(hh) || !isFinite(mm)) return { list: [], capped: false };

    var now = tashNow(), nowTs = now.getTime();
    var start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
    var stop = null;
    if (w.kind === "range") {
      var from = ymd(w.from), to = ymd(w.to);
      if (!from || !to) return { list: [], capped: false };
      if (from.getTime() > start.getTime()) start = from;
      stop = to;
    }
    var out = [], cursor = new Date(start.getTime()), scanned = 0;
    while (out.length < limit && scanned < MAX_SCAN_DAYS) {
      if (stop && cursor.getTime() > stop.getTime()) break;
      var dow = String(cursor.getDay());
      var monthOk = w.kind !== "months" || w.months.indexOf(cursor.getMonth() + 1) > -1;
      if (monthOk && rule.days.indexOf(dow) > -1) {
        var at = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate(), hh, mm, 0);
        // Chegara holati (aynan hozir) o'tgan deb hisoblanadi.
        if (at.getTime() > nowTs) out.push(at);
      }
      cursor.setDate(cursor.getDate() + 1);
      scanned++;
    }
    return { list: out, capped: scanned >= MAX_SCAN_DAYS && out.length < limit };
  }

  /* Hisob natijasi qoida + bugungi sana bo'yicha keshlanadi: matn yozilganda
     `refresh()` o'nlab marta chaqiriladi, ekspander esa qayta yurmasligi kerak. */
  var runsCache = { key: null, value: null };
  function runs(limit) {
    var key = JSON.stringify(scheduleRule()) + "|" + isoOf(tashNow()) + "|" + limit;
    if (runsCache.key !== key) runsCache = { key: key, value: computeRuns(limit) };
    return runsCache.value;
  }
  /* Faqat XATO MATNINI tanlash uchun: oraliqda umuman mos kun bormi, yoki
     bor-u hammasi o'tib ketganmi. Ikki sabab — ikki xil tuzatish. */
  function rangeHasAnyDay() {
    var rule = scheduleRule(), w = rule.window;
    if (w.kind !== "range" || !w.from || !w.to || !rule.days.length) return false;
    var from = ymd(w.from), to = ymd(w.to);
    if (!from || !to) return false;
    var cursor = new Date(from.getTime()), scanned = 0;
    while (cursor.getTime() <= to.getTime() && scanned < MAX_SCAN_DAYS) {
      if (rule.days.indexOf(String(cursor.getDay())) > -1) return true;
      cursor.setDate(cursor.getDate() + 1);
      scanned++;
    }
    return false;
  }

  /* Oraliqning O'ZI buzuq bo'lsa (teskari yoki mavjud bo'lmagan sana) hisob
     natijasi bo'sh chiqadi — lekin sabab «bu kun uchramaydi» EMAS. O'sha
     sababni aytish foydalanuvchini to'g'ri kun chipini almashtirishga
     majburlardi. Shuning uchun bunday holatda nol-natija tahlili umuman
     ishga tushmaydi. */
  function rangeBroken() {
    if (state.when !== "repeat" || state.span !== "range") return null;
    if (dateBad("fFrom") || dateBad("fTo")) return "badInput";
    var from = dateIso("fFrom"), to = dateIso("fTo");
    if (from && to && to < from) return "inverted";
    return null;
  }

  function dayListText() {
    var picked = ORDER.filter(function (d) { return state.days.indexOf(d) > -1; });
    return picked.length ? picked.map(function (d) { return DAY_SHORT[d]; }).join(", ") : null;
  }
  function monthListText() {
    var m = state.months.slice().sort(function (a, b) { return a - b; });
    return m.length ? m.map(function (n) { return MONTH_SHORT[n - 1]; }).join(", ") : null;
  }
  /* Davr bo'lagi — o'z holicha. Kunlar tanlanmagan bo'lsa ham TUSHIB
     QOLMAYDI: ekranda ikki oy chipi bosilib turib, xulosada ular yo'q
     bo'lsa, ekran o'z tanlovini yashirgan bo'lardi. */
  function spanText() {
    if (state.span === "months") {
      var m = monthListText();
      return m ? "ҳар йили " + m : "ойлар танланмаган";
    }
    var f = dateText("fFrom"), t = dateText("fTo");
    return (f && t) ? f + " — " + t : "оралиқ танланмаган";
  }

  function whenText() {
    if (state.when === "now") return "Ҳозироқ";
    if (state.when === "later") {
      var d = dateText("fDate"), t = timeVal("fTime");
      if (!d) return "Сана танланмаган";
      if (!t) return d + " · вақт танланмаган";
      return d + " · " + t;
    }
    /* Uch mustaqil bo'lak, erta `return` YO'Q: ilgari kunlar bo'sh bo'lsa
       funksiya shu yerda chiqib ketib, ekranda turgan davr tanlovini
       xulosadan butunlay yutib yuborardi. */
    var parts = [dayListText() || "Кунлар танланмаган"];
    parts.push(timeVal("fRepeatTime") || "вақт танланмаган");
    parts.push(spanText());
    if (scheduleReady() && !rangeBroken()) {
      var r = runs(1);
      if (!r.capped && !r.list.length) parts.push("ҳеч қачон юборилмайди");
    }
    return parts.join(" · ");
  }

  /* Jadval bo'lagining o'zi to'liqmi — `#rcWhen` ning `data-empty` si va
     status matni shundan hal bo'ladi. */
  function scheduleReady() {
    if (state.when !== "repeat") return true;
    if (!state.days.length || !timeVal("fRepeatTime")) return false;
    if (state.span === "months") return state.months.length > 0;
    return !!(dateIso("fFrom") && dateIso("fTo"));
  }

  /* So'rov tanasidagi `schedule` obyekti. `days` o'rniga `byday`: qiymat
     formati o'zgardi, demak NOM ham o'zgaradi — bir xil nom ostida boshqa
     format jim noto'g'ri o'qishga olib boradi. */
  function schedulePayload() {
    if (state.when === "now") return { mode: "now" };
    if (state.when === "later") {
      return { mode: "at", date: dateIso("fDate") || null, time: timeVal("fTime") || null, tzid: TZID };
    }
    var rule = scheduleRule();
    var first = runs(1).list[0] || null;
    var body = {
      mode: "weekly",
      tzid: TZID,
      byday: rule.days.map(function (d) { return DAY_CODE[d]; }),
      time: rule.time,
      window: rule.window,
      // `dtstart` TAXMIN emas: u ekrandagi BIRINCHI chipning aynan o'zi.
      dtstart: first ? isoOf(first) + "T" + pad2(first.getHours()) + ":" + pad2(first.getMinutes()) + ":00" : null,
      until: null
    };
    if (rule.window.kind === "range" && rule.window.to) {
      /* Sof SATR arifmetikasi: mahalliy 23:59:59 − 5 soat = O'SHA kunning
         18:59:59Z si. `Date` bilan hisoblash yil chegarasida kunni surib
         yuborardi. RFC 5545: DTSTART — TZID bilan, UNTIL — UTC. */
      body.until = rule.window.to.replace(/-/g, "") + "T185959Z";
    }
    body.rrule = buildRrule(body);
    return body;
  }

  function buildRrule(body) {
    if (!body.dtstart || !body.byday.length) return null;
    var parts = ["FREQ=WEEKLY", "BYDAY=" + body.byday.join(",")];
    if (body.window.kind === "months" && body.window.months.length) {
      parts.push("BYMONTH=" + body.window.months.join(","));
    }
    if (body.until) parts.push("UNTIL=" + body.until);
    return "DTSTART;TZID=" + TZID + ":" + body.dtstart.replace(/[-:]/g, "") + "\n" +
      "RRULE:" + parts.join(";");
  }

  /* ---------------------------------------------------------------------------
     KEYINGI YUBORISHLAR — ekranning eng halol qismi.
     `refresh()` da HAR SAFAR to'liq qayta chiziladi: avval hammasi yopiladi,
     keyin joriy holatga mos BITTASI ochiladi. Erta `return` bo'lsa rejim
     almashgach eski ogohlantirish qotib qolardi.
  ------------------------------------------------------------------------- */
  function renderRuns() {
    var chips = $("runsChips"), empty = $("runsEmpty"), sum = $("runsSum"), box = $("runs");
    chips.innerHTML = ""; chips.hidden = true;
    empty.hidden = true;
    sum.textContent = ""; sum.removeAttribute("data-tone");
    box.hidden = state.when !== "repeat";
    if (state.when !== "repeat") return;

    if (!scheduleReady()) {
      sum.textContent = "Кунлар, вақт ва давр танлангач кейинги юбориш саналари шу ерда чиқади.";
      return;
    }
    var broken = rangeBroken();
    if (broken) {
      sum.textContent = broken === "inverted"
        ? "Оралиқ тескари — саналар тўғрилангач кейинги юборишлар шу ерда чиқади."
        : "Сана тўлиқ эмас — тўғрилангач кейинги юборишлар шу ерда чиқади.";
      return;
    }
    var r = runs(3);
    if (r.capped) {
      // Chegara urilgani «hech qachon» DEGANI EMAS — bilmaganimizni aytamiz.
      sum.textContent = "Ҳисоблаш чегараси: биринчи юбориш жуда узоқда, саналар кўрсатилмади.";
      return;
    }
    if (!r.list.length) {
      empty.hidden = false;
      $("runsEmptyBody").textContent = rangeHasAnyDay()
        ? "Бу оралиқдаги барча юбориш вақтлари аллақачон ўтиб кетган."
        : "Танланган оралиқда " + (dayListText() || "танланган кун") + " куни умуман учрамайди.";
      return;
    }
    chips.hidden = false;
    chips.innerHTML = r.list.map(function (d) {
      return '<span class="run-chip" role="listitem"><b>' + dateLabel(d) + "</b><span>" +
        DAY_FULL[String(d.getDay())] + ", " + pad2(d.getHours()) + ":" + pad2(d.getMinutes()) + "</span></span>";
    }).join("");

    var first = r.list[0];
    var days = Math.round((first.getTime() - tashNow().getTime()) / 86400000);
    if (state.span === "months" && state.months.length === 12) {
      sum.textContent = "12 ойнинг ҳаммаси танланган — жадвал тўхтатилмагунча ҳар ҳафта қайтаверади.";
      sum.setAttribute("data-tone", "warn");
    } else if (days > 60) {
      sum.textContent = "Биринчи юбориш " + dateLabel(first) + ", " + DAY_FULL[String(first.getDay())] +
        " — тахминан " + Math.round(days / 30) + " ойдан кейин. Шу йил керак бўлса, бугундан кейинги ойлардан бирини ҳам белгиланг.";
      sum.setAttribute("data-tone", "warn");
    } else if (state.span === "range") {
      var all = runs(MAX_RUNS);
      // Son FORMULA bilan chiqarilmaydi — u chiplarni bergan ekspanderning o'zi.
      var n = all.list.length;
      sum.textContent = n === 1
        ? "Бу оралиқда атиги бир марта юборилади — «Белгиланган вақтда» режими шунга мос келади."
        : "Бу оралиқда жами " + n + (all.capped ? "+" : "") + " марта юборилади.";
      if (n === 1) sum.setAttribute("data-tone", "warn");
    } else {
      sum.textContent = "Биринчи юбориш " + dateLabel(first) + ", " + DAY_FULL[String(first.getDay())] + ".";
    }
  }

  /* Jonli soha: bir xil satrni qayta yozish ham e'lon qo'zg'atadi, shuning
     uchun faqat HAQIQATAN o'zgargan matn yoziladi. */
  var liveLast = {};
  function setLive(id, text) {
    if (liveLast[id] === text) return;
    liveLast[id] = text;
    $(id).textContent = text;
  }

  /* Ikkala chip qatori (kunlar va oylar) BIR XIL klaviatura modeli:
     ←/→ faqat fokusni ko'chiradi, Space/Enter tanlaydi, Home/End chekkaga.
     Ilgari 7 ta kun chipi 7 ta alohida Tab to'xtashi edi. */
  function wireToggleRow(row, attr, onToggle) {
    var items = Array.prototype.slice.call(row.querySelectorAll("[" + attr + "]"));
    function syncStops() {
      var on = items.filter(function (i) { return i.getAttribute("aria-pressed") === "true"; })[0];
      items.forEach(function (i) { i.tabIndex = i === (on || items[0]) ? 0 : -1; });
    }
    row.addEventListener("click", function (e) {
      var btn = e.target.closest ? e.target.closest("[" + attr + "]") : null;
      if (!btn || !row.contains(btn)) return;
      var on = btn.getAttribute("aria-pressed") === "true";
      btn.setAttribute("aria-pressed", on ? "false" : "true");
      onToggle(btn.getAttribute(attr), !on);
      syncStops();
    });
    row.addEventListener("keydown", function (e) {
      var btn = e.target.closest ? e.target.closest("[" + attr + "]") : null;
      if (!btn) return;
      var i = items.indexOf(btn), to = -1;
      if (e.key === "ArrowRight") to = Math.min(i + 1, items.length - 1);
      else if (e.key === "ArrowLeft") to = Math.max(i - 1, 0);
      else if (e.key === "Home") to = 0;
      else if (e.key === "End") to = items.length - 1;
      else return;
      e.preventDefault();
      items[to].focus();
    });
    syncStops();
  }

  function reveal(el, show) {
    var wasHidden = el.hidden;
    el.hidden = !show;
    if (!show || !wasHidden) return;
    el.removeAttribute("data-enter");
    void el.offsetWidth;
    el.setAttribute("data-enter", "1");
  }

  function initWhen() {
    wireRadioGroup($("whenGroup"), function (el) {
      state.when = el.getAttribute("data-when");
      reveal($("whenLater"), state.when === "later");
      reveal($("whenRepeat"), state.when === "repeat");
      WHEN_BOXES.forEach(function (id) { delete touched[id]; });
      // Rejim almashdi — endi ochilgan panel qizil bo'lib qarshi olmasin.
      state.whenTouched = false;
      refresh();
    });

    wireRadioGroup($("spanGroup"), function (el) {
      state.span = el.getAttribute("data-span");
      $("spanMonths").hidden = state.span !== "months";
      $("spanRange").hidden = state.span !== "range";
      $("spanHint").textContent = state.span === "months"
        ? "Ҳар йили фақат танланган ойларда қайтади. Фақат шу йилги бўлса, «Сана оралиғи» ни танланг."
        : "Оралиқ тугагач бутунлай тўхтайди. Ҳар йили қайтариш учун «Танланган ойлар» ни танланг.";
      state.whenTouched = false;
      refresh();
    });

    wireToggleRow($("dayRow"), "data-day", function (day, on) {
      state.days = on ? state.days.concat(day) : state.days.filter(function (d) { return d !== day; });
      state.whenTouched = true;
      refresh();
    });
    wireToggleRow($("monthRow"), "data-month", function (month, on) {
      var n = +month;
      state.months = on ? state.months.concat(n) : state.months.filter(function (m) { return m !== n; });
      state.whenTouched = true;
      refresh();
    });

    /* Maydonlar qo'lda sanalmaydi: 03-bo'limga kelajakda qo'shiladigan har
       qanday input avtomatik ulanadi. `input` ham, `change` ham kerak —
       `type=date` klaviaturadan yozilganda `change` kech keladi. */
    document.querySelectorAll("#whenLater input, #whenRepeat input").forEach(function (el) {
      ["input", "change"].forEach(function (ev) {
        el.addEventListener(ev, function () { state.whenTouched = true; refresh(); });
      });
    });

    syncDateBounds();
    /* Sahifa yarim tundan oshib ochiq qolsa «bugun» eskirib qoladi.
       Ko'rinishga qaytilganda va kun almashganda qayta hisoblanadi. */
    document.addEventListener("visibilitychange", function () { if (!document.hidden) refresh(); });
  }

  /* `min` FAQAT qulaylik: qo'lda yozilgan sanani u to'xtatmaydi, shuning
     uchun tekshiruv qoidalari unga umuman tayanmaydi. */
  function syncDateBounds() {
    var today = isoOf(tashNow());
    $("fDate").dataset.min = today;
    $("fFrom").dataset.min = today;
    $("fTo").dataset.min = dateIso("fFrom") || today;
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
      if (state.files.length >= MAX_FILES) { pushProblem("5 тадан ортиқ файл қўшиб бўлмайди"); return; }
      if (file.size > MAX_BYTES) { pushProblem("“" + file.name + "” 10 MB дан катта"); return; }
      if (!/\.(pdf|jpe?g|png)$/i.test(file.name)) { pushProblem("“" + file.name + "” — фақат PDF, JPG ёки PNG"); return; }
      state.files.push({ name: file.name, size: file.size });
      added++;
    });
    var err = $("errFiles");
    if (problems.length) {
      // Ilgari faqat BIRINCHI muammo ko'rsatilardi: 6 ta fayl tashlansa
      // qaysilari rad etilgani bilinmasdi.
      err.textContent = "";
      /* Ikonka spraytdan: qalinlik va uch shakli `.ico` sinfida bir joyda.
         Ilgari SVG shu yerda qo'lda qurilib, atributlari qolgan
         ikonkalardan mustaqil ravishda yozilardi. */
      var icon = document.createElementNS(SVG_NS, "svg");
      icon.setAttribute("class", "ico");
      icon.setAttribute("aria-hidden", "true");
      icon.setAttribute("focusable", "false");
      icon.innerHTML = '<use href="#i-circle-alert"/>';
      err.appendChild(icon);
      err.appendChild(document.createTextNode(
        added + " та қўшилди, " + rejected + " таси рад этилди: " + problems.join(" · ")));
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
          '<svg class="ico" width="16" height="16" aria-hidden="true" focusable="false"><use href="#i-file-text"/></svg>' +
        "</span>" +
        '<span class="file-name"></span>' +
        '<span class="file-size"></span>';
      row.querySelector(".file-name").textContent = f.name;
      row.querySelector(".file-size").textContent = humanSize(f.size);

      var del = document.createElement("button");
      del.type = "button";
      del.className = "icon-btn";
      del.setAttribute("aria-label", "“" + f.name + "” файлини олиб ташлаш");
      del.innerHTML = '<svg class="ico" aria-hidden="true" focusable="false"><use href="#i-x"/></svg>';
      del.addEventListener("click", function () {
        // «5 tadan ortiq» xabari o'chirishdan keyin ham turib qolardi —
        // ya'ni u endi mavjud bo'lmagan chegarani da'vo qilardi.
        $("errFiles").hidden = true;
        state.files.splice(i, 1);
        renderFiles();
        refresh();
        if (window.omToast) window.omToast("Файл олиб ташланди", "ok");
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

    /* Yagona qoida — maydon BO'SH emasmi. Uzunlik uchun xato yo'q: uzun matn
       xato emas, u shunchaki push'da qisqarib ko'rinadi va foydalanuvchi
       xabarni ochib o'qiydi. */
    var textRules = [
      { id: "uzTitle", box: "errUzTitle", empty: "Ўзбекча сарлавҳани ёзинг." },
      { id: "uzBody",  box: "errUzBody",  empty: "Ўзбекча матнни ёзинг." },
      { id: "ruTitle", box: "errRuTitle", empty: "Русча сарлавҳани ёзинг." },
      { id: "ruBody",  box: "errRuBody",  empty: "Русча матнни ёзинг." }
    ];
    textRules.forEach(function (r) {
      if (!$(r.id).value.trim()) errors.push({ el: $(r.id), box: $(r.box), msg: r.empty });
    });

    if (state.dataFailed) {
      errors.push({
        el: null, box: $("scopeError"),
        msg: "Ҳудуд маълумотлари юкланмади. Саҳифани янгиланг; муаммо қолса администраторга хабар беринг."
      });
    }
    else if (!state.scope) errors.push({ el: areaMode ? $("scopeSearch") : $("scopeAll"), box: $("scopeError"), msg: null });

    if (state.when === "later") {
      var date = dateIso("fDate"), time = timeVal("fTime");
      if (!date) errors.push({ el: $("fDate"), box: $("errDate"), msg: "Юбориш санасини танланг." });
      if (timeBad("fTime")) errors.push({ el: $("fTime"), box: $("errTime"), kind: "rule", msg: "Бу вақт мавжуд эмас — масалан 09:30." });
      else if (!time) errors.push({ el: $("fTime"), box: $("errTime"), msg: "Юбориш вақтини танланг." });
      if (date && time) {
        // `min` atributi faqat tanlagichni cheklaydi — qo'lda yozilgan
        // yoki eski qoralamadan qolgan sanani u to'xtatmaydi.
        var when = new Date(date + "T" + time);
        if (!isNaN(when) && when.getTime() < Date.now()) {
          errors.push({ el: $("fDate"), box: $("errDate"), msg: "Бу вақт аллақачон ўтиб кетган — келгуси сана ва вақтни танланг." });
        }
      }
    }
    if (state.when === "repeat") {
      if (!state.days.length) {
        errors.push({ el: $("dayRow").querySelector("[data-day]"), invalid: $("dayRow"),
          box: $("errDays"), msg: "Камида битта кунни танланг." });
      }
      // Maydon yulduzcha bilan majburiy deb belgilangan edi, lekin hech
      // qayerda tekshirilmasdi: bo'sh qoldirilsa ekran «Hammasi
      // to'ldirilgan» deb turardi va ko'rinishda 09:00 paydo bo'lardi.
      if (timeBad("fRepeatTime")) {
        errors.push({ el: $("fRepeatTime"), box: $("errRepeatTime"), kind: "rule", msg: "Бу вақт мавжуд эмас — масалан 09:30." });
      } else if (!timeVal("fRepeatTime")) {
        errors.push({ el: $("fRepeatTime"), box: $("errRepeatTime"), msg: "Такрорий юбориш вақтини танланг." });
      }

      if (state.span === "months" && !state.months.length) {
        errors.push({ el: $("monthRow").querySelector("[data-month]"), invalid: $("monthRow"),
          box: $("errMonths"), msg: "Камида битта ойни танланг — масалан Сен ва Окт." });
      }

      if (state.span === "range") {
        var from = $("fFrom"), to = $("fTo");
        var fromIso = dateIso("fFrom"), toIso = dateIso("fTo");
        var today = isoOf(tashNow());
        /* `badInput` — mavjud bo'lmagan sana (29.02.2027): brauzer `.value` ni
           BO'SH qaytaradi, lekin maydonda raqamlar ko'rinib turadi. «Sanani
           tanlang» deyish foydalanuvchini adashtirardi — u sanani ko'rib turibdi. */
        if (dateBad("fFrom")) {
          errors.push({ el: from, box: $("errFrom"), kind: "rule", msg: "Бу сана мавжуд эмас — мавжуд санани танланг (масалан 28.02.2027)." });
        } else if (!fromIso) {
          errors.push({ el: from, box: $("errFrom"), msg: "Бошланиш санасини танланг." });
        } else if (fromIso < today) {
          errors.push({ el: from, box: $("errFrom"), kind: "rule", msg: "Бошланиш санаси ўтиб кетган — бугунги ёки келгуси санани танланг." });
        }

        if (dateBad("fTo")) {
          errors.push({ el: to, box: $("errTo"), kind: "rule", msg: "Бу сана мавжуд эмас — мавжуд санани танланг." });
        } else if (!toIso) {
          errors.push({ el: to, box: $("errTo"), msg: "Тугаш санасини танланг." });
        } else if (fromIso && toIso < fromIso) {
          /* Teskari oraliqda nol-natija tahlili UMUMAN ishga tushmaydi:
             «bu kun uchramaydi» deyish YOLG'ON sabab bo'lardi va foydalanuvchini
             to'g'ri kun chipini almashtirishga majburlardi. */
          errors.push({ el: to, box: $("errTo"), kind: "rule",
            msg: "Тугаш санасини бошланиш санасидан кейинга қўйинг — " + fromIso + " дан кейинги санани танланг." });
        }
      }

      /* Nol natija — MAYDON bo'sh emas, QOIDA ishlamaydi. Shuning uchun
         `kind: "rule"`: status qatori «N ta maydon to'ldirilishi kerak»
         deb yozsa, u ochiq yolg'on bo'lardi. */
      if (!errors.length && scheduleReady() && !rangeBroken()) {
        var r = runs(1);
        if (!r.capped && !r.list.length) {
          errors.push({ el: state.span === "range" ? $("fTo") : $("dayRow").querySelector("[data-day]"),
            box: $("errRuns"), kind: "rule",
            msg: rangeHasAnyDay()
              ? "Бу оралиқдаги барча юбориш вақтлари ўтиб кетган — тугаш санасини узайтиринг ёки кечроқ вақт қўйинг."
              : (dateText("fFrom") + " — " + dateText("fTo") + " оралиғида " + (dayListText() || "танланган кун") +
                 " куни учрамайди — тугаш санасини узайтиринг ёки бошқа кун танланг.") });
        }
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
          /* Ikonka spraytdan: qalinlik va uch shakli `.ico` sinfida bir joyda.
             Ilgari SVG shu yerda qo'lda qurilib, atributlari qolgan
             ikonkalardan mustaqil ravishda yozilardi. */
          var icon = document.createElementNS(SVG_NS, "svg");
          icon.setAttribute("class", "ico");
          icon.setAttribute("aria-hidden", "true");
          icon.setAttribute("focusable", "false");
          icon.innerHTML = '<use href="#i-circle-alert"/>';
          e.box.appendChild(icon);
          e.box.appendChild(document.createTextNode(e.msg));
        }
        e.box.hidden = false;
      }
      /* Chip qatorlarida nishon — `role="toolbar"` konteyner: chipning o'ziga
         `aria-invalid` qo'yib bo'lmaydi, konteynersiz esa fokus chipga
         qaytganda xato holati butunlay yo'qolardi. */
      var invalidTarget = e.invalid || (e.el && e.el.tagName !== "BUTTON" ? e.el : null);
      if (invalidTarget) invalidTarget.setAttribute("aria-invalid", "true");
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
    if (slot.firstChild && payloadSignature() !== renderedSignature) {
      slot.innerHTML = "";
      state.dispatched = false;
    }

    // --- jadval ---
    // `min` HAR SAFAR qayta yoziladi: sahifa yarim tundan oshib ochiq qolsa
    // boot da bir marta yozilgan «bugun» eskirib qolardi.
    syncDateBounds();
    renderRuns();

    // --- qamrov ---
    renderScope();
    var path = scopePath();
    var reachNum = currentReach();
    var reach = reachNum == null ? null : formatPop(reachNum);

    // --- matn hisoblagichlari ---
    TEXT_FIELDS.forEach(function (f) {
      $(f.count).textContent = $(f.id).value.trim().length + " белги";
    });

    var uzOk = $("uzTitle").value.trim() && $("uzBody").value.trim();
    var ruOk = $("ruTitle").value.trim() && $("ruBody").value.trim();
    $("uzState").textContent = uzOk ? "Тўлиқ" : "Тўлиқ эмас";
    $("ruState").textContent = ruOk ? "Тўлиқ" : "Тўлиқ эмас";
    $("uzState").setAttribute("data-full", uzOk ? "true" : "false");
    $("ruState").setAttribute("data-full", ruOk ? "true" : "false");

    // --- ko'rinish ---
    var lang = state.previewLang;
    var title = $(lang + "Title").value.trim();
    var body = $(lang + "Body").value.trim();
    $("pvTitle").textContent = title;
    $("pvText").textContent = body;
    paintLock();

    // --- yakun ---
    /* Qamrov plitasi. `data-num` — bu qiymat RAQAMMI degan savol, bo'shlik
       emas: aholi soni yo'q hududda yo'l tanlangan bo'lsa ham katta mono
       tipografiya berilmaydi (u yerda raqam yo'q). Birlik raqamdan
       AJRALMAYDI: yolg'iz «~35.1M» nimaning soni ekanini aytmasdi. */
    $("rcReachTile").setAttribute("data-empty", path ? "false" : "true");
    var reachEl = $("rcReach");
    reachEl.setAttribute("data-num", reach ? "true" : "false");
    reachEl.textContent = reach ? "~" + reach
      : path ? "Аҳоли сони йўқ" : "Қамров танланмаган";
    $("rcScope").textContent = path
      ? (reach ? "киши · " : "") + path.join(" / ")
      : "«Ким олади» бўлимида ҳудудни танланг";
    $("rcReachNote").hidden = !reach;
    renderDispatchFiles();
    renderDispatchDates();

    // --- holat qatori ---
    var errors = validate();
    var status = $("status"), text = $("statusText");
    status.setAttribute("data-tone", !errors.length ? "ok" : state.submitted ? "crit" : "");
    text.textContent = errors.length ? statusText(errors) : "Хабар юборишга тайёр";

    /* 03-bo'limga tegishli xatolar faqat foydalanuvchi o'sha bo'limga
       TEGGANDAN keyin (yoki «Navbatga qo'yish» bosilgandan keyin) ko'rsatiladi:
       rejim almashtirilgan zahoti panel qip-qizil ochilib qarshi olardi. */
    showErrors(errors.filter(function (e) {
      if (e.box && touched[e.box.id]) return true;
      if (!state.submitted) return false;
      return state.whenTouched || !e.box || WHEN_BOXES.indexOf(e.box.id) < 0;
    }));
    return errors;
  }

  /* ---------------------------------------------------------------------------
     05 YAKUNIY KO'RINISH
     Bitta jumla + nima qolgani. Ilgari bu yerda olti qatorli kalit-qiymat
     jadvali turardi: u ma'lumotni ko'rsatardi, lekin «bu xabar kimga, qachon
     va nima deb ketadi?» degan savolga javob bermasdi.
  ------------------------------------------------------------------------- */
  var SECTION_OF = {
    scopeError: 1,
    errUzTitle: 2, errUzBody: 2, errRuTitle: 2, errRuBody: 2,
    errDate: 3, errTime: 3, errDays: 3, errRepeatTime: 3,
    errMonths: 3, errFrom: 3, errTo: 3, errRuns: 3,
    errFiles: 4
  };

  function errorSection(e) {
    return e && e.box ? (SECTION_OF[e.box.id] || 0) : 0;
  }
  function sectionValid(section, errors) {
    return !errors.some(function (e) { return errorSection(e) === section; });
  }
  function statusText(errors) {
    var wrong = {}, missing = [], broken = [];
    errors.forEach(function (e) { if (e.kind === "rule") wrong[errorSection(e)] = true; });
    REQUIRED_SECTIONS.forEach(function (i) {
      if (sectionValid(i, errors)) return;
      (wrong[i] ? broken : missing).push("«" + SECTION_NAME[i] + "»");
    });
    var parts = [];
    if (missing.length) parts.push((state.submitted ? "Тўлдирилмаган: " : "Тўлдириш керак: ") + missing.join(", "));
    if (broken.length) parts.push("Тузатиш керак: " + broken.join(", "));
    return parts.length ? parts.join(" · ") : errors.length + " та майдонни текширинг";
  }
  function focusField(el) {
    if (!el) return;
    requestAnimationFrame(function () {
      try { el.focus({ preventScroll: true }); } catch (err) { return; }
      if (el.scrollIntoView) el.scrollIntoView({ block: "center", behavior: "smooth" });
    });
  }

  function lockMoment() {
    if (state.when === "later") {
      var d = ymd(dateIso("fDate")), t = timeVal("fTime");
      if (d && t) { d.setHours(+t.slice(0, 2), +t.slice(3), 0, 0); return d; }
    }
    if (state.when === "repeat" && scheduleReady() && !rangeBroken()) {
      var next = runs(1).list[0];
      if (next) return next;
    }
    return tashNow();
  }

  function paintLock() {
    var at = lockMoment();
    var day = DAY_FULL[String(at.getDay())];
    $("lockTime").textContent = pad2(at.getHours()) + ":" + pad2(at.getMinutes());
    $("lockDate").textContent = day.charAt(0).toUpperCase() + day.slice(1) + ", " + dateLabel(at);
  }

  function touchHost(target) {
    var wrap = target.closest ? target.closest(".pick-field, .chip-row") : null;
    if (!wrap) return target.hasAttribute && target.hasAttribute("aria-describedby") ? { host: target, wrap: target } : null;
    var host = wrap.hasAttribute("aria-describedby") ? wrap : wrap.querySelector("[aria-describedby]");
    return host ? { host: host, wrap: wrap } : null;
  }

  function initTouch() {
    var pressing = false, pressedAt = 0, pending = false, fallback = 0;
    function flush() {
      clearTimeout(fallback);
      pending = false;
      setTimeout(refresh, 0);
    }
    function release() {
      pressing = false;
      if (pending) flush();
    }
    document.addEventListener("pointerdown", function (e) {
      pressing = e.pointerType !== "touch";
      pressedAt = Date.now();
    }, true);
    document.addEventListener("pointerup", release, true);
    document.addEventListener("pointercancel", release, true);
    window.addEventListener("blur", release);
    document.querySelector(".page-grid").addEventListener("focusout", function (e) {
      var hit = touchHost(e.target);
      if (!hit || (e.relatedTarget && hit.wrap.contains(e.relatedTarget))) return;
      var fresh = hit.host.getAttribute("aria-describedby").split(/\s+/).filter(function (id) {
        return id.indexOf("err") === 0 && !touched[id];
      });
      if (!fresh.length) return;
      fresh.forEach(function (id) { touched[id] = true; });
      if (!pressing || Date.now() - pressedAt > 2000) return setTimeout(refresh, 0);
      pending = true;
      clearTimeout(fallback);
      fallback = setTimeout(flush, 2000);
    });
  }

  function initSideScroll() {
    var grid = document.querySelector(".side-card .fact-grid");
    function sync() {
      var overflow = grid.scrollHeight > grid.clientHeight + 1;
      if (overflow) grid.tabIndex = 0;
      else grid.removeAttribute("tabindex");
      grid.setAttribute("data-more", overflow && grid.scrollTop + grid.clientHeight < grid.scrollHeight - 1 ? "true" : "false");
    }
    grid.addEventListener("scroll", sync, { passive: true });
    if (window.ResizeObserver) {
      var watch = new ResizeObserver(sync);
      watch.observe(grid);
      Array.prototype.forEach.call(grid.children, function (tile) { watch.observe(tile); });
    }
    window.addEventListener("resize", sync);
    sync();
  }

  function initShortcuts() {
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" || !(e.metaKey || e.ctrlKey)) return;
      if (document.body.getAttribute("data-modal") != null) return;
      e.preventDefault();
      $("submitBtn").click();
    });
    setInterval(function () { if (!document.hidden) paintLock(); }, 30000);
  }

  /* «Keyingi yuborish» — hisoblangan sanalar, jadval bo'limidagi AYNAN
     o'sha ekspanderdan. Ikki joyda ikki xil sana chiqishi mumkin emas. */
  function renderDispatchDates() {
    var box = $("rcDates"), tile = $("rcWhenTile");
    box.innerHTML = "";
    /* Bo'sh holatda `«—»` YOZILMAYDI: u nima yetishmayotganini ham, qayerdan
       tuzatilishini ham aytmasdi. Har holat o'z sababini ko'rsatadi. */
    function line(text, hint, empty) {
      tile.setAttribute("data-empty", empty ? "true" : "false");
      var p = document.createElement("p");
      p.className = "fact-value";
      p.setAttribute("data-empty", empty ? "true" : "false");
      p.textContent = text;
      box.appendChild(p);
      if (!hint) return;
      var h = document.createElement("p");
      h.className = "fact-hint";
      h.textContent = hint;
      box.appendChild(h);
    }
    if (state.when === "now") return line("Ҳозироқ", "Юборилган заҳоти", false);
    if (state.when === "later") {
      var d = dateIso("fDate"), t = timeVal("fTime");
      if (!d || !t) return line("Вақт танланмаган", "«Қачон кетади» бўлимида сана ва соатни белгиланг", true);
      return line(dateText("fDate") + " · " + t, null, false);
    }
    if (!scheduleReady() || rangeBroken()) return line("Вақт танланмаган", "Жадвал тўлиқ эмас", true);
    var r = runs(3);
    if (r.capped) return line("Сана топилмади", "Биринчи юбориш жуда узоқда", true);
    if (!r.list.length) return line("Сана топилмади", "Бу қоида бўйича ҳеч қачон юборилмайди", true);

    tile.setAttribute("data-empty", "false");
    var ul = document.createElement("ul");
    ul.className = "fact-runs";
    r.list.forEach(function (d) {
      var li = document.createElement("li");
      li.className = "fact-run";
      var b = document.createElement("b"); b.textContent = dateLabel(d);
      var day = document.createElement("span"); day.textContent = DAY_FULL[String(d.getDay())];
      var at = document.createElement("i"); at.textContent = pad2(d.getHours()) + ":" + pad2(d.getMinutes());
      li.appendChild(b); li.appendChild(day); li.appendChild(at);
      ul.appendChild(li);
    });
    box.appendChild(ul);
  }

  /* Fayl SONI o'zi hech narsa demaydi — «2 ta fayl» to'g'ri fayllar ekanini
     tasdiqlamaydi. Nomlar ko'rinib tursin. */
  function renderDispatchFiles() {
    var box = $("rcFiles"), tile = $("rcFilesTile");
    box.innerHTML = "";
    if (!state.files.length) {
      tile.setAttribute("data-empty", "true");
      var p = document.createElement("p");
      p.className = "fact-value";
      p.setAttribute("data-empty", "true");
      p.textContent = "Файл йўқ";
      var h = document.createElement("p");
      h.className = "fact-hint";
      h.textContent = "Ихтиёрий — хабар иловасиз ҳам кетади";
      box.appendChild(p); box.appendChild(h);
      return;
    }
    tile.setAttribute("data-empty", "false");
    var ul = document.createElement("ul");
    ul.className = "fact-files";
    state.files.forEach(function (f) {
      var li = document.createElement("li");
      li.textContent = f.name;
      ul.appendChild(li);
    });
    box.appendChild(ul);
  }

  /* Ro'yxat har chizilganda qayta quriladi, shuning uchun tugma bosilganda
     nishon INDEKS bo'yicha topiladi — DOM ga element bog'lab qo'yish
     qayta chizilgandan keyin o'lik havolaga aylanardi. */
  /* So'rov tanasiga KIRADIGAN holatning imzosi. Ko'rinish tili, fokus,
     ochiq-yopiq bo'limlar bu yerga kirmaydi. */
  var renderedSignature = null;
  function payloadSignature() {
    return [
      state.scope, state.region, state.district, state.mahalla,
      $("uzTitle").value, $("uzBody").value, $("ruTitle").value, $("ruBody").value,
      /* Jadval qismi tananing O'ZIDAN olinadi — yangi maydonni imzoga
         qo'shishni unutib bo'lmaydi. Qolgan qismlar (qamrov, matn, fayl)
         SAQLANADI: ularni tashlab yuborish sarlavha tahrirlanganda panelni
         eskirtirib qo'yardi. */
      JSON.stringify(schedulePayload()),
      /* `badInput` da `.value` bo'sh bo'lib qoladi, ya'ni imzo o'zgarmasdi
         va eski JSON paneli ekranda qolib ketardi. */
      dateBad("fDate"), dateBad("fFrom"), dateBad("fTo"), timeBad("fTime"), timeBad("fRepeatTime"),
      isoOf(tashNow()),
      state.files.map(function (f) { return f.name + ":" + f.size; }).join(",")
    ].join("|");
  }

  /* ---------------------------------------------------------------------------
     YUBORISH — server yo'q, shuning uchun MUVAFFAQIYAT DA'VO QILINMAYDI.
  ------------------------------------------------------------------------- */
  function initSubmit() {
    $("submitBtn").addEventListener("click", function () {
      state.submitted = true;
      state.whenTouched = true;   // yuborishga urinildi — endi 03 xatolari ham ko'rinadi
      var errors = refresh();
      if (errors.length) {
        var first = errors[0];
        focusField(first.el || $("h-sec-" + (errorSection(first) || 1)));
        if (window.omToast) {
          window.omToast(state.dataFailed
            ? "Ҳудуд маълумотлари юкланмади — юбориб бўлмайди"
            : errors.length + " та майдон тўлдирилмаган", "crit");
        }
        return;
      }
      runSubmit();
    });

    /* --- Natija modalini yopish -----------------------------------------
       Escape ni brauzerning o'zi ulaydi (`showModal`), lekin `close`
       hodisasi HAR yopilishda otiladi — `body[data-modal]` shu yerda
       tozalanadi, aks holda Escape dan keyin nav blur o'chgan holida
       qolib ketardi. */
    var dlg = $("resultDialog");
    dlg.addEventListener("close", function () {
      /* Ko'rinmayotgan karta uchun taymer ishlab turishi jim resurs sarfi;
         yopib-qayta ochilganda esa ikkita taymer qolib ketardi. */
      stopDemoDelivery();
      document.body.removeAttribute("data-modal");
      /* Fokus TUGMAGA qaytadi: modal yopilgach fokus `body` ga tushib,
         klaviatura foydalanuvchisi sahifa boshidan qayta yurishga
         majbur bo'lardi. */
      $("submitBtn").focus({ preventScroll: true });
    });
    $("resultClose").addEventListener("click", function () { dlg.close(); });
    /* Orqa fonga bosish — `<dialog>` ning o'zi `::backdrop` ni bola qilib
       bermaydi, shuning uchun bosish NUQTASI quti chegarasi bilan
       solishtiriladi. */
    dlg.addEventListener("click", function (e) {
      if (e.target !== dlg) return;
      var r = dlg.getBoundingClientRect();
      var inside = e.clientX >= r.left && e.clientX <= r.right &&
                   e.clientY >= r.top && e.clientY <= r.bottom;
      if (!inside) dlg.close();
    });

    $("resetBtn").addEventListener("click", function () {
      if (!window.confirm("Барча киритилган маълумот ўчирилади. Давом этамизми?")) return;
      allowLeave = true;
      window.location.reload();
    });
    window.addEventListener("beforeunload", function (e) {
      if (allowLeave || !hasDraft()) return;
      e.preventDefault();
      e.returnValue = "";
    });
  }

  var allowLeave = false;
  function hasDraft() {
    if (state.dispatched) return false;
    var typed = ["uzTitle", "uzBody", "ruTitle", "ruBody"].some(function (id) { return $(id).value.trim() !== ""; });
    return typed || !!state.scope || state.files.length > 0;
  }

  /* Bu yerda kutiladigan hech narsa yo'q: tekshiruv `click` ichida
     sinxron tugaydi, tana esa darhol yig'iladi. Ilgari 700ms lik
     kechikish va «Tekshirilmoqda» yozuvi bor edi — ular bo'lmagan
     ishni bo'layotgandek ko'rsatardi. Javob endi darhol chiqadi;
     tugma bosilganini panelning o'zi va toast tasdiqlaydi. */
  function runSubmit() {
    state.dispatched = true;
    renderDemoResult();
    var dlg = $("resultDialog");
    /* `showModal()` — `show()` EMAS: faqat u orqa fonni inert qiladi, fokus
       tuzog'ini quradi va Escape ni ulaydi. Qo'lda yozilgan modal shu uchtasini
       deyarli har doim yarim qoldiradi. */
    if (typeof dlg.showModal === "function") dlg.showModal();
    else dlg.setAttribute("open", "");
    /* Nav `backdrop-filter` bilan blur qiladi va u modal scrimini YORITADI —
       dialog top-layer da bo'lsa ham blur ostidagi rasm o'tib ketadi. */
    document.body.setAttribute("data-modal", "true");
  }

  /* Natija kartasidagi faktlar. Hammasi FORMADAN o'qiladi — bu yerda hech
     narsa o'ylab topilmaydi. Reestr raqami umuman YO'Q — u serverdan
     keladi va bu bannerda bir marta aytilgan. */
  function resultRows() {
    var reach = currentReach();
    var path = scopePath();
    return [
      ["Қамров", path ? path.join(" / ") : "—"],
      ["Тахминий қамров", reach == null ? "—" : "~" + formatPop(reach) + " киши"],
      ["Жадвал", whenText()],
      ["Тиллар", "Ўзбекча ва русча"],
      ["Илова", state.files.length
        ? state.files.map(function (f) { return f.name; }).join(", ")
        : "Йўқ"]
    ];
  }

  /* Kartaning ostki jumlasi — «qachon boshlanadi». Tanlanmagan vaqt o'rniga
     hech qanday sana QO'YILMAYDI. */
  function startSentence() {
    if (state.when === "now") return "Тарқатиш дарҳол бошланади.";
    if (state.when === "later") {
      var d = dateIso("fDate"), t = timeVal("fTime");
      return d && t
        ? "Хабар тарқатиш навбатида. Юбориш " + dateText("fDate") + ", " + t + " да бошланади."
        : "Хабар тарқатиш навбатида.";
    }
    var r = runs(1);
    if (!r.list.length) return "Хабар тарқатиш навбатида.";
    var f = r.list[0];
    return "Хабар тарқатиш навбатида. Биринчи юбориш " + dateLabel(f) + ", " +
           pad2(f.getHours()) + ":" + pad2(f.getMinutes()) + " да бошланади.";
  }

  /* Uch xonali guruhlash — uzilmas probel bilan: oddiy probelda tor ustunda
     son ikkiga bo'linib ketardi. */
  function groupNum(n) {
    return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  }

  /* Demo tarqatish. Sonlar NAMUNA va buni banner ham, raqamlar ostidagi
     qator ham ochiq aytadi — ular serverdan kelmaydi. Simulyatsiya faqat
     «hoziroq» rejimida ishlaydi: rejalashtirilgan xabar hali ketmaydi,
     demak unda ko'rsatiladigan son ham yo'q. */
  var DEMO_FAIL_RATE = 0.008;   // ~0,8% — qurilma o'chiq yoki bildirishnoma yopiq
  var demoTimer = null;

  function stopDemoDelivery() {
    if (demoTimer) { clearInterval(demoTimer); demoTimer = null; }
  }

  function renderDemoResult() {
    stopDemoDelivery();
    var host = $("resultSlot");
    host.innerHTML = "";

    var live = state.when === "now";
    var total = currentReach();

    var box = document.createElement("div");
    box.className = "result";
    box.innerHTML =
      /* Banner BIRINCHI va doim ko'rinadi — ekran nusxasi olinsa u ham
         birga ketadi. */
      '<div class="specimen-banner">' +
        '<svg class="ico" aria-hidden="true" focusable="false"><use href="#i-triangle-alert"/></svg>' +
        '<span class="specimen-text"></span>' +
      "</div>" +

      '<div class="result-real" data-state="queued">' +
        '<div class="real-head">' +
          '<span class="real-mark" aria-hidden="true">' +
            '<svg class="ico" aria-hidden="true" focusable="false"><use href="#i-clock"/></svg></span>' +
          '<div>' +
            '<p class="real-title" id="resultTitle"></p>' +
            '<p class="real-sub"></p>' +
          "</div>" +
          '<span class="chip real-badge"></span>' +
        "</div>" +

        /* Ko'rsatkich `width` bilan EMAS, `transform: scaleX()` bilan
           yuradi: `width` animatsiyasi har kadrda layout hisoblatadi. */
        '<div class="real-progress" hidden>' +
          '<div class="real-bar"><span data-live style="transform:scaleX(0)"></span></div>' +
          '<p class="real-counts"></p>' +
        "</div>" +

        '<div class="real-figures" hidden>' +
          '<div class="real-figure"><p class="eyebrow eyebrow-sm">Етказилди</p>' +
            '<p class="real-num" data-ok>0</p></div>' +
          '<div class="real-figure"><p class="eyebrow eyebrow-sm">Етказилмади</p>' +
            '<p class="real-num real-num-warn" data-fail>0</p>' +
            '<p class="real-why">қурилма ўчиқ ёки билдиришнома ёпиқ</p></div>' +
          '<div class="real-figure"><p class="eyebrow eyebrow-sm">Қолди</p>' +
            '<p class="real-num" data-left>0</p></div>' +
        "</div>" +
        '<p class="real-hint demo-nums" hidden>Сонлар — НАМУНА. Сервер уланганда улар ҳақиқий ҳисобдан келади.</p>' +

        '<dl class="real-grid"></dl>' +

        '<div class="real-actions">' +
          '<button type="button" class="btn btn-ghost btn-sm" disabled>' +
            '<svg class="ico" aria-hidden="true" focusable="false"><use href="#i-x"/></svg>' +
            "<span>Бекор қилиш</span></button>" +
          '<button type="button" class="btn btn-ghost btn-sm" disabled>' +
            '<svg class="ico" aria-hidden="true" focusable="false"><use href="#i-file-text"/></svg>' +
            "<span>Нусха олиб таҳрирлаш</span></button>" +
          /* O'chirilgan tugmada tooltip YO'Q — sabab yonidagi ko'rinadigan
             qatorda (interface-craft). Matn `natija.html` dagisi bilan
             AYNAN bir xil: ikki ekranda ikki xil sabab yozilmasin. */
          '<p class="real-hint">Тугмалар серверга мурожаат қилади — сервер уланмагани учун ишламайди.</p>' +
        "</div>" +
      "</div>";

    var dl = box.querySelector(".real-grid");
    resultRows().forEach(function (row) {
      var wrap = document.createElement("div");
      var dt = document.createElement("dt"); dt.textContent = row[0];
      var dd = document.createElement("dd"); dd.textContent = row[1];
      wrap.appendChild(dt); wrap.appendChild(dd); dl.appendChild(wrap);
    });

    host.appendChild(box);
    renderedSignature = payloadSignature();

    if (live && total) startDemoDelivery(box, total);
    else setPhase(box, "queued", null);
  }

  /* Kartaning holati BITTA joydan yoziladi: sarlavha, ikonka, chip va
     jumla hech qachon bir-biriga zid gap ayta olmaydi. */
  /* Sarlavhalar `natija.html` dagi holat nomlarini AYNAN takrorlaydi
     («Navbatga qo'yildi» / «Yuborilmoqda» / «Yuborildi») — ilgari bu yerda
     «Xabar qabul qilindi» turardi va bitta holat ikki nom bilan atalardi.
     Har birining oldida «Namuna:» — demo ekrani BAJARILGAN ish haqida
     da'vo qilmasin: server ulanmagan, xabar hech qayerga ketmadi. Bu
     ajratish bannerdan TASHQARI, uning o'rniga emas. */
  var PHASES = {
    queued: {
      icon: "i-clock", title: "Намуна: навбатга қўйилди", badge: "Навбатда", badgeClass: "chip-accent",
      banner: "<b>Бу — демо.</b> Сервер уланмаган: хабар ҳеч қаерга кетмади. " +
              "Қуйида сервер уланганда экран айнан шундай кўринади."
    },
    sending: {
      icon: "i-repeat", title: "Намуна: юборилмоқда", badge: "Жараёнда", badgeClass: "chip-accent",
      banner: "<b>Бу — демо.</b> Сервер уланмаган: ҳеч кимга хабар кетмади. " +
              "Қуйидаги тарқатиш ҳам, сонлар ҳам НАМУНА."
    },
    sent: {
      icon: "i-check", title: "Намуна: юборилди", badge: "Якунланди", badgeClass: "chip-ok",
      banner: "<b>Бу — демо.</b> Сервер уланмаган: ҳеч кимга хабар кетмади. " +
              "Юқоридаги сонлар НАМУНА — улар сервер уланганда ҳақиқий ҳисобдан келади."
    }
  };

  function setPhase(box, phase, sub) {
    var p = PHASES[phase];
    box.querySelector(".result-real").setAttribute("data-state", phase);
    box.querySelector(".real-mark use").setAttribute("href", "#" + p.icon);
    box.querySelector(".real-title").textContent = p.title;
    box.querySelector(".real-sub").textContent = sub || startSentence();
    var badge = box.querySelector(".real-badge");
    badge.className = "chip real-badge " + p.badgeClass;
    badge.textContent = p.badge;
    box.querySelector(".specimen-text").innerHTML = p.banner;

    /* Ko'rsatkich FAQAT «yuborilmoqda» holatida turadi. Ilgari u bir marta
       ochilgandan keyin hech qachon yopilmasdi va tarqatish tugagach ekranda
       TO'LA chiziq qolib ketardi — yakuniy sonlar yonida u hech nima
       aytmaydi, aksincha «hali yuryapti» degan taassurot berardi.
       `natija.html` da ham ko'rsatkich faqat `sending` kartasida bor. */
    var progress = box.querySelector(".real-progress");
    if (progress) progress.hidden = phase !== "sending";
  }

  function startDemoDelivery(box, total) {
    var figures = box.querySelector(".real-figures");
    var nums = box.querySelector(".demo-nums");
    var bar = box.querySelector("[data-live]");
    var counts = box.querySelector(".real-counts");
    /* `.real-progress` bu yerda OCHILMAYDI — uni `setPhase` boshqaradi
       (pastdagi `setPhase(box, "sending", …)` chaqiruvi ochadi). Sonlar
       esa tarqatish tugagach ham ekranda qoladi. */
    figures.hidden = false; nums.hidden = false;

    /* `prefers-reduced-motion` da ko'rsatkich SAKRAYDI — sonlar baribir
       yangilanadi, chunki ular ma'lumot, bezak emas. */
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduce) bar.style.transition = "transform 300ms linear";

    setPhase(box, "sending", "Тарқатиш бошланди. Саҳифани ёпсангиз ҳам давом этади.");

    var STEPS = 12, step = 0;
    function paint(t) {
      /* Oxiriga yaqin sekinlashadi — bir tekis chiziq «hisob emas, taymer»
         bo'lib ko'rinardi. */
      var done = Math.round(total * (1 - Math.pow(1 - t, 2)));
      var fail = Math.round(done * DEMO_FAIL_RATE);
      var ok = done - fail;
      bar.style.transform = "scaleX(" + (done / total) + ")";
      counts.innerHTML = "<b>" + groupNum(done) + "</b> / " + groupNum(total) + " ишланди";
      box.querySelector("[data-ok]").textContent = groupNum(ok);
      box.querySelector("[data-fail]").textContent = groupNum(fail);
      box.querySelector("[data-left]").textContent = groupNum(total - done);
    }
    paint(0);

    demoTimer = setInterval(function () {
      step++;
      paint(step / STEPS);
      if (step < STEPS) return;
      stopDemoDelivery();
      setPhase(box, "sent", "Тарқатиш якунланди.");
      /* «Qoldi 0» yolg'iz turganda «nimadir qolib ketdimi?» degan savol
         tug'dirardi — sabab yoniga yoziladi. */
      var left = box.querySelector("[data-left]");
      if (!left.nextElementSibling) {
        var why = document.createElement("p");
        why.className = "real-why";
        why.textContent = "тарқатиш якунланди";
        left.after(why);
      }
    }, 300);
  }

  /* ------------------------------------------------------------------------ */
  /* «Nusxa olib tahrirlash» — `yuborilganlar.html` dan keladigan qoralama.
     Serverga hech qanday aloqasi yo'q: ro'yxat sahifasi `sessionStorage` ga
     yozadi, kompozitor esa BIR MARTA o'qib darhol o'chiradi — aks holda
     keyingi «Yangi xabar» ham to'lgan holda ochilardi. */
  function applyDraft() {
    var raw = null;
    try {
      raw = sessionStorage.getItem("om-draft");
      if (raw) sessionStorage.removeItem("om-draft");
    } catch (e) { return; }          // private rejim — qoralama yo'q, xato ham yo'q
    if (!raw) return;

    var d;
    try { d = JSON.parse(raw); } catch (e) { return; }
    if (!d) return;

    ["uzTitle", "uzBody", "ruTitle", "ruBody"].forEach(function (k) {
      if (d[k]) $(k).value = d[k];
    });

    /* Qamrov POG'ONA-POG'ONA tiklanadi: `goScope` ota daraja o'rnatilmagan
       bo'lsa ataylab qaytib ketadi, ya'ni to'g'ridan-to'g'ri «mahalla» deb
       yozib bo'lmaydi. */
    var sc = d.scope;
    if (sc) {
      if (sc.region) goScope("region", sc.region);
      if (sc.district) goScope("district", sc.district);
      if (sc.mahalla) goScope("mahalla", sc.mahalla);
    }

    /* Vaqt KO'CHIRILMAYDI: eski xabarning sanasi yangi yuborish uchun
       to'g'ri bo'lishi shart emas va uni jim qo'yish operatorni o'sha
       vaqtga rozi bo'lgan holga keltirardi.

       Xabar HAM o'zgarmaydi: ro'yxatdagi tugma «Tahrirlash» deb atalgan
       bo'lsa-da, yuborilgan xabarni qaytarib bo'lmaydi — bu YANGI xabar.
       Ekran buni oxirgi paytda, ya'ni kompozitor ochilganda aytadi. */
    if (window.omToast) {
      window.omToast("Матн кўчирилди — бу ЯНГИ хабар, эскиси ўзгармайди. Вақтни қайтадан танланг", "warn");
    }
  }

  function boot() {
    initScope();
    initText();
    initWhen();
    initFiles();
    initSubmit();
    initTouch();
    initShortcuts();
    initSideScroll();
    applyDraft();
    refresh();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
