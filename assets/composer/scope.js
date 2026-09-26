(function () {
  "use strict";

  var OM = window.OM = window.OM || {};
  var ui = OM.ui, geo = OM.geo, view = OM.scopeView, $ = ui.$;

  var ctx = null, sig = null, wantFocus = false, preRow = null;
  var areaMode = false, query = "", stash = null;
  var SEARCH_DEBOUNCE_MS = 90;

  function sel() { return ctx.state; }

  function upButton() {
    var b = $("scopeCrumbs").querySelectorAll(".scope-crumb-btn");
    return b.length ? b[b.length - 1] : $("scopeAll");
  }

  function restoreFocus(keep) {
    var list = $("scopeList"), s = sel();
    var target = keep ? list.querySelector('.scope-row[data-key="' + keep + '"]') : null;
    if (!target) {
      target = list.querySelector('.scope-row[aria-current="true"]') ||
        (s.scope === "republic" ? $("scopeAll") : null) || list.querySelector(".scope-row") || upButton();
    }
    if (target) target.focus();
  }

  function render() {
    var s = sel();
    if (s.dataFailed) return;
    var next = [s.scope, s.regionId, s.districtId, s.mahallaId, query, areaMode].join("|");
    if (next === sig && !wantFocus) return;
    var changed = next !== sig;
    sig = next;
    var list = $("scopeList");
    var active = document.activeElement === document.body && preRow ? preRow : document.activeElement;
    var keep = list.contains(active) ? active.getAttribute("data-key") : null;
    var rows = view.listRows(s, query);
    if (changed) { view.renderCrumbs(s); view.renderList(s, query, rows); }
    var area = areaMode || (!!s.scope && s.scope !== "republic");
    ui.checkRadio($("scopeGroup"), function (it) { return it.id === "scopeAll" ? s.scope === "republic" : area; });
    ui.reveal($("scopeAreaBody"), area);
    var count = view.countLabel(s, query, rows);
    $("scopeLvl").textContent = count;
    var reach = geo.reach(s), path = geo.pathNames(s);
    ui.setLive("scopeLive", path
      ? path.join(" / ") + " танланди. Тахминий қамров " + (reach == null ? "номаълум" : geo.popText(reach) + " киши") + ". " + count + "."
      : "Қамров танланмаган. " + count + ".");
    if (wantFocus || keep != null) restoreFocus(keep);
    wantFocus = false;
  }

  var NEEDS = { region: "regionId", district: "districtId", mahalla: "mahallaId" };

  function apply(next, moveFocus) {
    var s = sel();
    if (NEEDS[next.scope] && !next[NEEDS[next.scope]]) return;
    s.scope = next.scope;
    s.regionId = next.regionId || null;
    s.districtId = next.districtId || null;
    s.mahallaId = next.mahallaId || null;
    areaMode = next.scope !== "republic";
    $("scopeError").hidden = true;
    wantFocus = !!moveFocus;
    ctx.refresh();
  }

  function go(kind, id, moveFocus) {
    var s = sel();
    if (kind === "republic") return apply({ scope: "republic" }, moveFocus);
    if (kind === "region") return apply({ scope: "region", regionId: id || s.regionId }, moveFocus);
    if (kind === "district") return apply({ scope: "district", regionId: s.regionId, districtId: id || s.districtId }, moveFocus);
    apply({ scope: "mahalla", regionId: s.regionId, districtId: s.districtId, mahallaId: id }, moveFocus);
  }

  function pickPath(row) {
    query = "";
    $("scopeSearch").value = "";
    apply({ scope: row.getAttribute("data-kind"), regionId: +row.getAttribute("data-region") || null,
      districtId: +row.getAttribute("data-district") || null, mahallaId: +row.getAttribute("data-mahalla") || null }, true);
  }

  function activate(row) {
    if (row.hasAttribute("data-region")) return pickPath(row);
    go(row.getAttribute("data-kind"), +row.getAttribute("data-id"), true);
  }

  function toRoot() {
    stash = null;
    apply({ scope: null }, true);
  }

  function onModeSelect(el) {
    var s = sel();
    if (el.id === "scopeAll") {
      if (s.scope && s.scope !== "republic") stash = { scope: s.scope, regionId: s.regionId, districtId: s.districtId, mahallaId: s.mahallaId };
      return apply({ scope: "republic" }, false);
    }
    if (s.scope === "republic") s.scope = null;
    if (stash && !s.scope) return apply(stash, false);
    areaMode = true;
    ctx.refresh();
  }

  function onKey(e) {
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
    else if (k === "ArrowRight" && row.querySelector(".scope-chev")) { e.preventDefault(); activate(row); return; }
    else if (k === "ArrowLeft") { var b = upButton(); if (b) { e.preventDefault(); b.focus(); } return; }
    else return;
    e.preventDefault();
    all[to].focus();
  }

  function onClick(e) {
    var t = e.target;
    var row = t.closest && t.closest(".scope-row");
    var up = t.closest && t.closest(".scope-crumb-btn");
    if (row) activate(row);
    else if (up && up.getAttribute("data-up") === "root") toRoot();
    else if (up) go(up.getAttribute("data-up"), null, true);
  }

  function reportFailure() {
    var box = $("scopeError");
    ctx.state.dataFailed = true;
    box.textContent = "";
    box.appendChild(ui.icon("i-circle-alert"));
    box.appendChild(document.createTextNode("Ҳудуд маълумотлари юкланмади. Саҳифани янгиланг; муаммо қолса администраторга хабар беринг."));
    box.hidden = false;
    $("scope").setAttribute("data-failed", "true");
  }

  function reportGaps() {
    if (!geo.missingPop.length) return;
    var p = ui.node("p", "note note-warn");
    p.appendChild(ui.icon("i-triangle-alert"));
    p.appendChild(ui.node("span", null, "Реестр тўлиқ эмас: аҳоли сони йўқ — " + geo.missingPop.join(", ") +
      ". Бу ҳудудлар учун тахминий рақам ҳам, республика йиғиндиси ҳам кўрсатилмайди."));
    $("scopeCrumbs").before(p);
  }

  function init(context) {
    ctx = context;
    if (!geo.ready) { reportFailure(); return; }
    reportGaps();
    $("scopeAllPop").textContent = geo.popText(geo.republicPop);
    $("scopeAllSub").textContent = "Реестрдаги барча " + geo.regions.length + " ҳудуд" +
      (geo.republicPop == null ? " · жами сон номаълум" : "");
    ui.wireRadioGroup($("scopeGroup"), onModeSelect);
    var pending = 0;
    $("scopeSearch").addEventListener("input", function () {
      var value = this.value;
      clearTimeout(pending);
      pending = setTimeout(function () { query = geo.norm(value); ctx.refresh(); }, SEARCH_DEBOUNCE_MS);
    });
    var root = $("scope");
    root.addEventListener("pointerdown", function () {
      preRow = $("scopeList").contains(document.activeElement) ? document.activeElement : null;
    });
    root.addEventListener("click", onClick);
    root.addEventListener("keydown", onKey);
  }

  function focusTarget() { return areaMode ? $("scopeSearch") : $("scopeAll"); }

  OM.scope = { init: init, render: render, apply: apply, focusTarget: focusTarget };
})();
