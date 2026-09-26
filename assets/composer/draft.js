(function () {
  "use strict";

  var OM = window.OM = window.OM || {};
  var ui = OM.ui, $ = ui.$;

  var KEY = "om-composer-draft-v2";
  var TEXT_IDS = ["uzTitle", "uzBody", "ruTitle", "ruBody"];
  var timer = 0;

  function read() {
    try {
      var raw = localStorage.getItem(KEY);
      var d = raw ? JSON.parse(raw) : null;
      return d && typeof d === "object" ? d : null;
    } catch (err) { return null; }
  }

  function write(d) {
    try { localStorage.setItem(KEY, JSON.stringify(d)); return true; } catch (err) { return false; }
  }

  function clear() {
    clearTimeout(timer);
    try { localStorage.removeItem(KEY); } catch (err) { return; }
  }

  function snapshot(state) {
    var d = { v: 2, texts: {}, orgType: $("orgType").value, severity: state.severity, expiry: state.expiry,
      date: $("fDate").dataset.iso || "", time: $("fTime").dataset.time || "",
      scope: { scope: state.scope, regionId: state.regionId, districtId: state.districtId, mahallaId: state.mahallaId } };
    TEXT_IDS.forEach(function (id) { d.texts[id] = $(id).value; });
    return d;
  }

  function save(state, hasDraft) {
    clearTimeout(timer);
    timer = setTimeout(function () {
      if (state.dispatched || !hasDraft()) { clear(); return; }
      write(snapshot(state));
    }, 400);
  }

  function pickRadio(groupId, attr, value) {
    var btn = document.querySelector("#" + groupId + ' [' + attr + '="' + value + '"]');
    if (btn) btn.click();
  }

  function setField(id, value) {
    if (typeof value !== "string" || !value) return;
    $(id).value = value;
    $(id).dispatchEvent(new Event("input", { bubbles: true }));
  }

  function restore(state) {
    var d = read();
    if (!d || d.v !== 2) return false;
    var texts = d.texts && typeof d.texts === "object" ? d.texts : {};
    TEXT_IDS.forEach(function (id) { if (typeof texts[id] === "string") $(id).value = texts[id]; });
    if (typeof d.orgType === "string") $("orgType").value = d.orgType;
    if (OM.payload.SEVERITIES.indexOf(d.severity) > -1) pickRadio("sevGroup", "data-sev", d.severity);
    if (/^(1d|3d|7d|custom)$/.test(d.expiry || "")) pickRadio("expiryGroup", "data-expiry", d.expiry);
    if (d.expiry === "custom") {
      setField("fDate", /^\d{4}-\d{2}-\d{2}$/.test(d.date || "") ? d.date.split("-").reverse().join(".") : "");
      setField("fTime", /^\d{2}:\d{2}$/.test(d.time || "") ? d.time : "");
    }
    var sc = d.scope && typeof d.scope === "object" ? d.scope : null;
    var sel = sc ? { scope: sc.scope, regionId: sc.regionId, districtId: sc.districtId, mahallaId: sc.mahallaId } : null;
    if (sel && OM.payload.LEVEL[sel.scope] && OM.geo.consistent(sel)) OM.scope.apply(sel, false);
    return true;
  }

  OM.draft = { save: save, restore: restore, clear: clear };
})();
