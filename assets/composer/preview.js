(function () {
  "use strict";

  var OM = window.OM = window.OM || {};
  var ui = OM.ui, geo = OM.geo, time = OM.time, $ = ui.$;

  function paintLock(nowMs) {
    var day = time.weekday(nowMs);
    $("lockTime").textContent = time.clock(nowMs);
    $("lockDate").textContent = day.charAt(0).toUpperCase() + day.slice(1) + ", " + time.dateLabel(nowMs, nowMs);
  }

  function paintText(lang) {
    var code = lang === "ru" ? "ru" : "uz-Cyrl";
    $("pvTitle").setAttribute("lang", code);
    $("pvText").setAttribute("lang", code);
    $("pvTitle").textContent = OM.payload.clean($(lang + "Title").value);
    $("pvText").textContent = OM.payload.clean($(lang + "Body").value);
  }

  function paintLangState() {
    ["uz", "ru"].forEach(function (k) {
      var ok = !!(OM.payload.clean($(k + "Title").value) && OM.payload.clean($(k + "Body").value));
      $(k + "State").textContent = ok ? "Тўлиқ" : "Тўлиқ эмас";
      $(k + "State").setAttribute("data-full", ok ? "true" : "false");
    });
    ["uzTitle", "uzBody", "ruTitle", "ruBody"].forEach(function (id) {
      var n = OM.payload.clean($(id).value).length, max = OM.payload.LIMIT[/Title$/.test(id) ? "title" : "body"];
      $(id + "Count").textContent = n + " / " + max;
      $(id + "Count").setAttribute("data-over", n > max ? "true" : "false");
    });
  }

  function paintReach(state) {
    var path = geo.pathNames(state), n = state.dataFailed ? null : geo.reach(state);
    var reach = n == null ? null : geo.formatPop(n);
    $("rcReachTile").setAttribute("data-empty", path ? "false" : "true");
    $("rcReach").setAttribute("data-num", reach ? "true" : "false");
    $("rcReach").textContent = reach ? "~" + reach : path ? "Аҳоли сони йўқ" : "Қамров танланмаган";
    $("rcScope").textContent = path ? (reach ? "киши · " : "") + path.join(" / ") : "«Ким олади» бўлимида ҳудудни танланг";
    $("rcReachNote").hidden = !reach;
  }

  function paintSeverity(state) {
    var s = OM.fields.SEVERITY[state.severity];
    $("rcSev").textContent = s ? s.name : "Танланмаган";
    $("rcSevNote").textContent = s ? s.sub : "«Муҳимлиги» бўлимида танланг";
  }

  function paintExpiry(expiresAt, nowMs) {
    var ok = expiresAt != null && expiresAt > nowMs;
    $("rcExpTile").setAttribute("data-empty", ok ? "false" : "true");
    $("rcExp").textContent = ok ? time.moment(expiresAt, nowMs) + " гача" : "Муддат танланмаган";
    $("rcExpNote").textContent = ok ? "Тошкент вақти · UTC+5" : "«Амал қилиш муддати» бўлимида танланг";
  }

  function paint(state, expiresAt, nowMs) {
    paintLangState();
    paintText(state.previewLang);
    paintLock(nowMs);
    paintReach(state);
    paintSeverity(state);
    paintExpiry(expiresAt, nowMs);
  }

  function setLang(state, lang) {
    state.previewLang = lang;
    $("pvUz").setAttribute("aria-pressed", lang === "uz" ? "true" : "false");
    $("pvRu").setAttribute("aria-pressed", lang === "ru" ? "true" : "false");
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

  function init(ctx) {
    $("pvUz").addEventListener("click", function () { setLang(ctx.state, "uz"); ctx.refresh(); });
    $("pvRu").addEventListener("click", function () { setLang(ctx.state, "ru"); ctx.refresh(); });
    [["uz", "uzTitle", "uzBody"], ["ru", "ruTitle", "ruBody"]].forEach(function (g) {
      [g[1], g[2]].forEach(function (id) {
        $(id).addEventListener("input", ctx.refresh);
        $(id).addEventListener("focus", function () {
          if (ctx.state.previewLang !== g[0]) { setLang(ctx.state, g[0]); ctx.refresh(); }
        });
      });
    });
    initSideScroll();
  }

  OM.preview = { init: init, paint: paint, paintLock: paintLock };
})();
