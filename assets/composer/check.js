(function () {
  "use strict";

  var OM = window.OM = window.OM || {};
  var ui = OM.ui, $ = ui.$;

  var SECTION_NAME = { 1: "Ким олади", 2: "Хабар матни", 3: "Муҳимлиги", 4: "Амал қилиш муддати" };
  var REQUIRED_SECTIONS = [2, 1, 3, 4];
  var SECTION_OF = {
    scopeError: 1, errOrgType: 1,
    errUzTitle: 2, errUzBody: 2, errRuTitle: 2, errRuBody: 2,
    errDate: 4, errTime: 4
  };
  var TEXT_RULES = [
    { id: "uzTitle", box: "errUzTitle", kind: "title", empty: "Ўзбекча сарлавҳани ёзинг.", what: "Сарлавҳа" },
    { id: "uzBody", box: "errUzBody", kind: "body", empty: "Ўзбекча матнни ёзинг.", what: "Матн" },
    { id: "ruTitle", box: "errRuTitle", kind: "title", empty: "Русча сарлавҳани ёзинг.", what: "Сарлавҳа" },
    { id: "ruBody", box: "errRuBody", kind: "body", empty: "Русча матнни ёзинг.", what: "Матн" }
  ];

  function textErrors() {
    var out = [];
    TEXT_RULES.forEach(function (r) {
      var v = OM.payload.clean($(r.id).value), max = OM.payload.LIMIT[r.kind];
      if (!v) out.push({ el: $(r.id), box: $(r.box), msg: r.empty });
      else if (OM.payload.size(v) > max) {
        var n = OM.payload.size(v);
        out.push({ el: $(r.id), box: $(r.box), kind: "rule",
          msg: r.what + " " + max + " белгидан ошмасин — ҳозир " + n + ". " + (n - max) + " белгини қисқартиринг." });
      }
    });
    return out;
  }

  function validate(state, nowMs) {
    var errors = textErrors();
    if (state.dataFailed) {
      errors.push({ el: null, box: $("scopeError"), kind: "rule", always: true,
        msg: "Ҳудуд маълумотлари юкланмади. Саҳифани янгиланг; муаммо қолса администраторга хабар беринг." });
    } else if (!state.scope) {
      errors.push({ el: OM.scope.focusTarget(), box: $("scopeError"), msg: null });
    } else if (!OM.geo.consistent(state)) {
      errors.push({ el: OM.scope.focusTarget(), box: $("scopeError"), kind: "rule",
        msg: "Танланган ҳудуд реестрда топилмади — ҳудудни рўйхатдан қайта танланг." });
    }
    var org = OM.fields.orgTypeError();
    if (org) errors.push(org);
    return errors.concat(OM.fields.expiryErrors(nowMs));
  }

  function sectionOf(e) { return e && e.box ? (SECTION_OF[e.box.id] || 0) : 0; }

  function statusText(errors, submitted) {
    var wrong = {}, missing = [], broken = [];
    errors.forEach(function (e) { if (e.kind === "rule") wrong[sectionOf(e)] = true; });
    REQUIRED_SECTIONS.forEach(function (i) {
      if (!errors.some(function (e) { return sectionOf(e) === i; })) return;
      (wrong[i] ? broken : missing).push("«" + SECTION_NAME[i] + "»");
    });
    var parts = [];
    if (missing.length) parts.push((submitted ? "Тўлдирилмаган: " : "Тўлдириш керак: ") + missing.join(", "));
    if (broken.length) parts.push("Тузатиш керак: " + broken.join(", "));
    return parts.length ? parts.join(" · ") : errors.length + " та майдонни текширинг";
  }

  function writeBox(box, msg) {
    if (!msg || box.getAttribute("data-msg") === msg) return;
    box.textContent = "";
    box.appendChild(ui.icon("i-circle-alert"));
    box.appendChild(document.createTextNode(msg));
    box.setAttribute("data-msg", msg);
  }

  function showErrors(errors) {
    var boxes = [], fields = [];
    errors.forEach(function (e) {
      if (e.box) { writeBox(e.box, e.msg); boxes.push(e.box); }
      if (e.el && e.el.tagName !== "BUTTON") fields.push(e.el);
    });
    document.querySelectorAll(".field-error").forEach(function (b) {
      var on = boxes.indexOf(b) > -1;
      if (b.hidden === on) b.hidden = !on;
    });
    document.querySelectorAll("[aria-invalid]").forEach(function (f) {
      if (fields.indexOf(f) < 0) f.removeAttribute("aria-invalid");
    });
    fields.forEach(function (f) { if (f.getAttribute("aria-invalid") !== "true") f.setAttribute("aria-invalid", "true"); });
  }

  function touchHost(target) {
    var wrap = target.closest ? target.closest(".pick-field") : null;
    if (!wrap) return target.hasAttribute && target.hasAttribute("aria-describedby") ? { host: target, wrap: target } : null;
    var host = wrap.hasAttribute("aria-describedby") ? wrap : wrap.querySelector("[aria-describedby]");
    return host ? { host: host, wrap: wrap } : null;
  }

  function initTouch(touched, refresh) {
    var pressing = false, pressedAt = 0, pending = false, fallback = 0;
    function flush() { clearTimeout(fallback); pending = false; setTimeout(refresh, 0); }
    function release() { pressing = false; if (pending) flush(); }
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
      if (!pressing || Date.now() - pressedAt > 2000) { setTimeout(refresh, 0); return; }
      pending = true;
      clearTimeout(fallback);
      fallback = setTimeout(flush, 2000);
    });
  }

  OM.check = {
    SECTION_NAME: SECTION_NAME, validate: validate, sectionOf: sectionOf, statusText: statusText,
    showErrors: showErrors, initTouch: initTouch
  };
})();
