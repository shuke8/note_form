(function () {
  "use strict";

  var OM = window.OM = window.OM || {};
  var ui = OM.ui, time = OM.time, $ = ui.$;

  var PRESET_DAYS = { "1d": 1, "3d": 3, "7d": 7 };
  var SEVERITY = {
    info: { name: "Маълумот", sub: "Оддий хабар" },
    warning: { name: "Огоҳлантириш", sub: "Диққат талаб қилади" },
    critical: { name: "Критик", sub: "Зудлик билан" }
  };
  var ctx = null;

  function dateIso() { var el = $("fDate"); return el.dataset.iso != null ? el.dataset.iso : el.value; }
  function dateBad() { var el = $("fDate"); return el.dataset.bad === "true" || !!(el.validity && el.validity.badInput); }
  function timeVal() { var el = $("fTime"); return el.dataset.time != null ? el.dataset.time : el.value; }
  function timeBad() { return $("fTime").dataset.bad === "true"; }

  function expiresAt(nowMs) {
    var days = PRESET_DAYS[ctx.state.expiry];
    if (days) return time.floorMinute(nowMs) + days * time.DAY;
    if (dateBad() || timeBad()) return null;
    return time.fromWall(dateIso(), timeVal());
  }

  function expiryErrors(nowMs) {
    if (ctx.state.expiry !== "custom") return [];
    var out = [], date = dateIso(), t = timeVal();
    if (dateBad()) out.push({ el: $("fDate"), box: $("errDate"), kind: "rule", msg: "Бу сана мавжуд эмас — мавжуд санани танланг." });
    else if (!date) out.push({ el: $("fDate"), box: $("errDate"), msg: "Тугаш санасини танланг." });
    if (timeBad()) out.push({ el: $("fTime"), box: $("errTime"), kind: "rule", msg: "Бу вақт мавжуд эмас — масалан 18:00." });
    else if (!t) out.push({ el: $("fTime"), box: $("errTime"), msg: "Тугаш вақтини танланг." });
    if (out.length) return out;
    var at = time.fromWall(date, t);
    if (at == null) out.push({ el: $("fDate"), box: $("errDate"), kind: "rule", msg: "Бу сана мавжуд эмас — мавжуд санани танланг." });
    else if (at <= nowMs) out.push({ el: $("fDate"), box: $("errDate"), kind: "rule", msg: "Бу вақт ўтиб кетган — келгуси сана ва вақтни танланг." });
    return out;
  }

  function orgTypeError() {
    var raw = $("orgType").value.trim();
    if (!raw) return { el: $("orgType"), box: $("errOrgType"), msg: "Ташкилот тури кодини киритинг — масалан 100." };
    if (OM.payload.orgTypeOf(raw) == null) {
      return { el: $("orgType"), box: $("errOrgType"), kind: "rule", msg: "Код — 1 дан бошланадиган бутун сон, 6 хонагача (масалан 100)." };
    }
    return null;
  }

  function paintPresets(nowMs) {
    document.querySelectorAll("#expiryGroup [data-expiry]").forEach(function (btn) {
      var days = PRESET_DAYS[btn.getAttribute("data-expiry")];
      if (!days) return;
      var sub = btn.querySelector(".choice-sub");
      sub.textContent = time.moment(time.floorMinute(nowMs) + days * time.DAY, nowMs) + " гача";
    });
  }

  function syncBounds(nowMs) { $("fDate").dataset.min = time.todayIso(nowMs); }

  function initSeverity() {
    ui.wireRadioGroup($("sevGroup"), function (el) {
      ctx.state.severity = el.getAttribute("data-sev");
      ctx.refresh();
    });
  }

  function initExpiry() {
    ui.wireRadioGroup($("expiryGroup"), function (el) {
      ctx.state.expiry = el.getAttribute("data-expiry");
      ui.reveal($("expiryCustom"), ctx.state.expiry === "custom");
      ctx.forget(["errDate", "errTime"]);
      ctx.refresh();
    });
    ["fDate", "fTime"].forEach(function (id) {
      ["input", "change"].forEach(function (ev) { $(id).addEventListener(ev, function () { ctx.refresh(); }); });
    });
    var lastDate = $("fDate").value;
    $("fDate").addEventListener("input", function () {
      var el = this, filled = el.value.length === 10 && lastDate.length < 10;
      lastDate = el.value;
      if (filled && document.activeElement === el && el.dataset.bad !== "true" && el.dataset.iso) $("fTime").focus();
    });
  }

  function initOrgType() {
    $("orgType").addEventListener("input", function () { ctx.refresh(); });
  }

  function init(context) {
    ctx = context;
    initSeverity();
    initExpiry();
    initOrgType();
  }

  OM.fields = {
    SEVERITY: SEVERITY, init: init, expiresAt: expiresAt, expiryErrors: expiryErrors,
    orgTypeError: orgTypeError, paintPresets: paintPresets, syncBounds: syncBounds
  };
})();
