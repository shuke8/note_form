(function () {
  "use strict";

  var OM = window.OM = window.OM || {};

  var LATIN = [["o‘", "у"], ["oʻ", "у"], ["oʼ", "у"], ["o'", "у"], ["o`", "у"], ["o’", "у"],
    ["g‘", "г"], ["gʻ", "г"], ["gʼ", "г"], ["g'", "г"], ["g`", "г"], ["g’", "г"],
    ["sh", "ш"], ["ch", "ч"], ["yo", "е"], ["yu", "ю"], ["ya", "я"], ["ye", "е"], ["ts", "ц"],
    ["a", "а"], ["b", "б"], ["c", "к"], ["d", "д"], ["e", "е"], ["f", "ф"], ["g", "г"], ["h", "х"], ["i", "и"],
    ["j", "ж"], ["k", "к"], ["l", "л"], ["m", "м"], ["n", "н"], ["o", "о"], ["p", "п"], ["q", "к"], ["r", "р"],
    ["s", "с"], ["t", "т"], ["u", "у"], ["v", "в"], ["w", "в"], ["x", "х"], ["y", "й"], ["z", "з"]];
  var FOLD = { "қ": "к", "ғ": "г", "ҳ": "х", "ў": "у", "ё": "е", "э": "е", "ъ": "", "ь": "" };
  var SEARCH_LIMIT = 40;

  function norm(s) {
    var out = String(s).toLowerCase();
    LATIN.forEach(function (pair) { out = out.split(pair[0]).join(pair[1]); });
    return out.replace(/[қғҳўёэъь]/g, function (c) { return FOLD[c]; })
      .replace(/['‘ʻʼ`’]/g, "").replace(/\s+/g, " ").trim();
  }

  function hasPop(v) { return typeof v === "number" && isFinite(v) && v > 0; }

  function decimal(v) { return v.toFixed(1).replace(/\.0$/, "").replace(".", ","); }

  function formatPop(n) {
    if (n == null) return null;
    if (n >= 1e6) return decimal(n / 1e6) + " млн";
    if (n >= 1e4) return Math.round(n / 1e3) + " минг";
    if (n >= 1e3) return decimal(n / 1e3) + " минг";
    return String(n);
  }

  function popText(n) { return hasPop(n) ? "~" + formatPop(n) : "—"; }

  function validNode(n) {
    return n && typeof n === "object" && Number.isInteger(n.id) && n.id > 0 && typeof n.name === "string" && n.name;
  }

  function listOf(value) { return Array.isArray(value) ? value.filter(validNode) : []; }

  function build(raw) {
    var regions = listOf(raw), index = { region: {}, district: {}, mahalla: {} }, rows = [];
    regions.forEach(function (r) {
      index.region[r.id] = { region: r };
      rows.push({ kind: "region", node: r, key: norm(r.name), path: { regionId: r.id } });
      listOf(r.districts).forEach(function (d) {
        index.district[d.id] = { region: r, district: d };
        rows.push({ kind: "district", node: d, key: norm(d.name), sub: r.name, path: { regionId: r.id, districtId: d.id } });
        listOf(d.mahallas).forEach(function (m) {
          index.mahalla[m.id] = { region: r, district: d, mahalla: m };
          rows.push({ kind: "mahalla", node: m, key: norm(m.name), sub: d.name + " · " + r.name,
            path: { regionId: r.id, districtId: d.id, mahallaId: m.id } });
        });
      });
    });
    var missing = regions.filter(function (r) { return !hasPop(r.pop); }).map(function (r) { return r.name; });
    var total = missing.length ? null : regions.reduce(function (s, r) { return s + r.pop; }, 0);
    return { regions: regions, index: index, rows: rows, missingPop: missing, republicPop: regions.length ? total : null };
  }

  var db = build(window.OM_GEO);

  function region(id) { var e = db.index.region[id]; return e ? e.region : null; }
  function district(id) { var e = db.index.district[id]; return e ? e.district : null; }
  function mahalla(id) { var e = db.index.mahalla[id]; return e ? e.mahalla : null; }

  function childrenOf(sel) {
    if (sel.scope === "region") return listOf((region(sel.regionId) || {}).districts);
    if (sel.scope === "district" || sel.scope === "mahalla") return listOf((district(sel.districtId) || {}).mahallas);
    return db.regions;
  }

  function search(query) {
    var q = norm(query), out = [];
    if (!q) return Object.assign([], { total: 0 });
    db.rows.forEach(function (row) { if (row.key.indexOf(q) > -1) out.push(row); });
    return Object.assign(out.slice(0, SEARCH_LIMIT), { total: out.length });
  }

  function reach(sel) {
    var v = sel.scope === "republic" ? db.republicPop
      : sel.scope === "region" ? (region(sel.regionId) || {}).pop
      : sel.scope === "district" ? (district(sel.districtId) || {}).pop
      : sel.scope === "mahalla" ? (mahalla(sel.mahallaId) || {}).pop : null;
    return hasPop(v) ? v : null;
  }

  function pathNames(sel) {
    if (!sel.scope) return null;
    if (sel.scope === "republic") return ["Ўзбекистон Республикаси"];
    var parts = [], r = region(sel.regionId), d = district(sel.districtId), m = mahalla(sel.mahallaId);
    if (r) parts.push(r.name);
    if (sel.scope !== "region" && d) parts.push(d.name);
    if (sel.scope === "mahalla" && m) parts.push(m.name);
    return parts.length ? parts : null;
  }

  function consistent(sel) {
    if (sel.scope === "republic") return true;
    var r = db.index.region[sel.regionId];
    if (!r) return false;
    if (sel.scope === "region") return true;
    var d = db.index.district[sel.districtId];
    if (!d || d.region !== r.region) return false;
    if (sel.scope === "district") return true;
    var m = db.index.mahalla[sel.mahallaId];
    return !!m && m.district === d.district && sel.scope === "mahalla";
  }

  function findPath(names) {
    var r = db.regions.filter(function (x) { return x.name === names.region; })[0];
    if (!r) return null;
    var d = names.district ? listOf(r.districts).filter(function (x) { return x.name === names.district; })[0] : null;
    var m = d && names.mahalla ? listOf(d.mahallas).filter(function (x) { return x.name === names.mahalla; })[0] : null;
    return { regionId: r.id, districtId: d ? d.id : null, mahallaId: m ? m.id : null,
      scope: m ? "mahalla" : d ? "district" : "region" };
  }

  OM.geo = {
    ready: db.regions.length > 0,
    regions: db.regions,
    missingPop: db.missingPop,
    republicPop: db.republicPop,
    region: region, district: district, mahalla: mahalla,
    childrenOf: childrenOf, search: search, reach: reach, pathNames: pathNames, findPath: findPath, consistent: consistent,
    norm: norm, hasPop: hasPop, formatPop: formatPop, popText: popText, build: build
  };
})();
