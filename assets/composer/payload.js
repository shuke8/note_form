(function () {
  "use strict";

  var OM = window.OM = window.OM || {};

  var TYPE = "system.announcement";
  var LEVEL = { republic: 1, region: 2, district: 3, mahalla: 4 };
  var SEVERITIES = ["info", "warning", "critical"];
  var ORG_TYPE_RE = /^[1-9]\d{0,5}$/;
  var LIMIT = { title: 120, body: 600 };

  function clean(s) { return String(s == null ? "" : s).replace(/[\u200B-\u200D\u2060\uFEFF]/g, "").trim(); }

  function orgTypeOf(raw) {
    var s = String(raw == null ? "" : raw).trim();
    return ORG_TYPE_RE.test(s) ? Number(s) : null;
  }

  function audience(sel, orgType) {
    var level = LEVEL[sel.scope];
    var a = { org_type: orgType, level: level };
    if (level >= 2) a.region_id = sel.regionId;
    if (level >= 3) a.district_id = sel.districtId;
    if (level >= 4) a.mahalla_id = sel.mahallaId;
    return a;
  }

  function text(lang) {
    return { title: clean(lang.title), body: clean(lang.body) };
  }

  function build(input) {
    return {
      type: TYPE,
      payload: {
        audience: audience(input.selection, input.orgType),
        severity: input.severity,
        expires_at: OM.time.isoZ(input.expiresAt),
        texts: { uz: text(input.texts.uz), ru: text(input.texts.ru) }
      }
    };
  }

  function complete(input) {
    var sel = input.selection || {};
    var level = LEVEL[sel.scope];
    if (!level || input.orgType == null) return false;
    if (level >= 2 && !sel.regionId) return false;
    if (level >= 3 && !sel.districtId) return false;
    if (level >= 4 && !sel.mahallaId) return false;
    if (SEVERITIES.indexOf(input.severity) < 0) return false;
    if (typeof input.expiresAt !== "number" || !isFinite(input.expiresAt)) return false;
    return ["uz", "ru"].every(function (k) {
      var t = text(input.texts[k] || {});
      return t.title !== "" && t.body !== "" && t.title.length <= LIMIT.title && t.body.length <= LIMIT.body;
    });
  }

  OM.payload = {
    TYPE: TYPE, LEVEL: LEVEL, SEVERITIES: SEVERITIES, LIMIT: LIMIT, clean: clean,
    orgTypeOf: orgTypeOf, audience: audience, build: build, complete: complete
  };
})();
