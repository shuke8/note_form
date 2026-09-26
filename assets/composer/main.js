(function () {
  "use strict";

  var OM = window.OM;
  var ui = OM.ui, $ = ui.$;

  var state = {
    scope: null, regionId: null, districtId: null, mahallaId: null,
    severity: "warning", expiry: "1d",
    previewLang: "uz", submitted: false, dataFailed: false, dispatched: false
  };
  var touched = {};
  var allowLeave = false;

  function selection() {
    return { scope: state.scope, regionId: state.regionId, districtId: state.districtId, mahallaId: state.mahallaId };
  }

  function visible(e) {
    return !!e.always || !!(e.box && touched[e.box.id]) || state.submitted;
  }

  function refresh() {
    var now = Date.now();
    OM.fields.syncBounds(now);
    OM.fields.paintPresets(now);
    OM.scope.render();
    var expiresAt = OM.fields.expiresAt(now);
    OM.preview.paint(state, expiresAt, now);
    var errors = OM.check.validate(state, now);
    $("status").setAttribute("data-tone", !errors.length ? "ok" : state.submitted ? "crit" : "");
    $("statusText").textContent = errors.length ? OM.check.statusText(errors, state.submitted) : "Хабар юборишга тайёр";
    OM.check.showErrors(errors.filter(visible));
    paintSent(errors);
    OM.draft.save(state, hasDraft);
    return errors;
  }

  function paintSent(errors) {
    var data = errors.length ? null : input();
    state.dispatched = !!data && OM.payload.complete(data) && OM.submit.sentFor(OM.payload.build(data), state.expiry);
    $("draftBadge").textContent = state.dispatched ? "Юборилди" : "Қоралама";
    $("draftBadge").setAttribute("data-state", state.dispatched ? "sent" : "draft");
    if (state.dispatched) $("statusText").textContent = "Бу хабар юборилган — янгисини юбориш учун матн ёки қамровни ўзгартиринг";
  }

  function forget(ids) { ids.forEach(function (id) { delete touched[id]; }); }

  function input() {
    return {
      selection: selection(),
      orgType: OM.payload.orgTypeOf($("orgType").value),
      severity: state.severity,
      expiresAt: OM.fields.expiresAt(Date.now()),
      texts: {
        uz: { title: $("uzTitle").value, body: $("uzBody").value },
        ru: { title: $("ruTitle").value, body: $("ruBody").value }
      }
    };
  }

  function onSubmit() {
    if (OM.submit.busy()) return;
    state.submitted = true;
    var errors = refresh();
    if (errors.length) {
      var first = errors[0];
      ui.focusField(first.el || $("h-sec-" + (OM.check.sectionOf(first) || 1)));
      return;
    }
    var data = input();
    if (!OM.payload.complete(data)) {
      if (window.omToast) window.omToast("Маълумот тўлиқ эмас — саҳифани янгилаб қайта уриниб кўринг", "crit");
      return;
    }
    OM.submit.open(OM.payload.build(data), data.selection, state.expiry);
  }

  function hasDraft() {
    if (state.dispatched) return false;
    var typed = ["uzTitle", "uzBody", "ruTitle", "ruBody"].some(function (id) { return OM.payload.clean($(id).value) !== ""; });
    return typed || !!state.scope;
  }

  function initActions() {
    $("submitBtn").addEventListener("click", onSubmit);
    $("resetBtn").addEventListener("click", function () {
      if (!window.confirm("Барча киритилган маълумот ўчирилади. Давом этамизми?")) return;
      allowLeave = true;
      OM.draft.clear();
      window.location.reload();
    });
    window.addEventListener("beforeunload", function (e) {
      if (allowLeave || !hasDraft()) return;
      e.preventDefault();
      e.returnValue = "";
    });
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" || !(e.metaKey || e.ctrlKey)) return;
      if (document.body.getAttribute("data-modal") != null) return;
      e.preventDefault();
      onSubmit();
    });
    setInterval(function () { if (!document.hidden) refresh(); }, 30000);
    document.addEventListener("visibilitychange", function () { if (!document.hidden) refresh(); });
  }

  function copiedDraft() {
    var raw = null, d = null;
    try { raw = sessionStorage.getItem("om-draft"); } catch (err) { raw = null; }
    if (!raw) return null;
    try { d = JSON.parse(raw); } catch (err) { d = null; }
    try { sessionStorage.removeItem("om-draft"); } catch (err) { d = d || null; }
    return d && typeof d === "object" ? d : null;
  }

  function applyDraft() {
    var d = copiedDraft();
    if (!d) {
      if (OM.draft.restore(state) && window.omToast) window.omToast("Қоралама тикланди", "ok");
      return;
    }
    ["uzTitle", "uzBody", "ruTitle", "ruBody"].forEach(function (k) { if (typeof d[k] === "string") $(k).value = d[k]; });
    var path = d.scope && typeof d.scope.region === "string" ? OM.geo.findPath(d.scope) : null;
    if (path) OM.scope.apply(path, false);
    var lost = d.scope && d.scope.region && !path;
    if (window.omToast) {
      window.omToast(lost ? "Матн кўчирилди, ҳудуд реестрда топилмади — уни қайта танланг"
        : "Матн кўчирилди — бу ЯНГИ хабар, эскиси ўзгармайди. Муддатни текширинг", "warn");
    }
  }

  function boot() {
    var ctx = { state: state, refresh: refresh, forget: forget,
      serverErrors: function (list) { OM.check.setServerErrors(list, state); } };
    OM.scope.init(ctx);
    OM.fields.init(ctx);
    OM.preview.init(ctx);
    OM.submit.init(ctx);
    OM.check.initTouch(touched, refresh);
    initActions();
    applyDraft();
    refresh();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
