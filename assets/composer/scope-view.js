(function () {
  "use strict";

  var OM = window.OM = window.OM || {};
  var ui = OM.ui, geo = OM.geo, $ = ui.$;

  function rowKey(kind, id) { return kind + ":" + id; }

  function listRows(s, query) {
    if (query) return geo.search(query);
    var kind = s.scope === "region" ? "district"
      : (s.scope === "district" || s.scope === "mahalla") ? "mahalla" : "region";
    return geo.childrenOf(s).map(function (n) { return { kind: kind, node: n, deep: kind !== "mahalla" }; });
  }

  function rowButton(s, row, idx) {
    var b = ui.node("button", "scope-row");
    b.type = "button";
    b.setAttribute("data-kind", row.kind);
    b.setAttribute("data-id", String(row.node.id));
    b.setAttribute("data-key", rowKey(row.kind, row.node.id));
    b.setAttribute("aria-describedby", "scopeError");
    if (row.path) {
      b.setAttribute("data-region", String(row.path.regionId || ""));
      b.setAttribute("data-district", String(row.path.districtId || ""));
      b.setAttribute("data-mahalla", String(row.path.mahallaId || ""));
    }
    if (row.kind === "mahalla" && s.mahallaId === row.node.id) b.setAttribute("aria-current", "true");
    b.appendChild(ui.node("span", "scope-idx", OM.time.pad2(idx)));
    var name = ui.node("span", "scope-name", row.node.name);
    if (row.sub) name.appendChild(ui.node("span", "scope-sub", row.sub));
    b.appendChild(name);
    b.appendChild(ui.node("span", "scope-pop", geo.popText(row.node.pop)));
    b.setAttribute("aria-label", row.node.name + (row.sub ? ", " + row.sub : "") +
      (geo.hasPop(row.node.pop) ? ", тахминан " + geo.formatPop(row.node.pop) + " киши" : ""));
    if (row.deep) {
      var chev = ui.icon("i-chevron-right");
      chev.setAttribute("class", "ico scope-chev");
      b.appendChild(chev);
    }
    return b;
  }

  function wholeRow(s, query) {
    var node = s.scope === "region" ? geo.region(s.regionId) : s.scope === "district" ? geo.district(s.districtId) : null;
    if (query || !node) return null;
    var li = ui.node("li", "scope-whole");
    li.appendChild(ui.icon("i-check"));
    li.appendChild(ui.node("span", "scope-whole-name", "Бутун " + node.name + " танланди"));
    li.appendChild(ui.node("span", "scope-pop", geo.popText(node.pop)));
    return li;
  }

  function renderList(s, query, rows) {
    var list = $("scopeList"), whole = wholeRow(s, query);
    list.textContent = "";
    if (whole) list.appendChild(whole);
    if (!rows.length) {
      var li = ui.node("li", "scope-empty hint", query
        ? "«" + $("scopeSearch").value.trim() + "» бўйича ҳудуд топилмади — бошқача ёзиб кўринг."
        : "Реестрда бу поғона учун ёзув йўқ — қамров юқоридаги даражада қолади.");
      list.appendChild(li);
      return;
    }
    rows.forEach(function (row, i) {
      var li = document.createElement("li");
      li.appendChild(rowButton(s, row, i + 1));
      list.appendChild(li);
    });
  }

  function crumbs(s) {
    var out = [{ up: "root", label: "Барча ҳудудлар", action: "Ҳудудлар рўйхатига қайтиш" }];
    var r = geo.region(s.regionId), d = geo.district(s.districtId), m = geo.mahalla(s.mahallaId);
    if (r) out.push({ up: "region", label: r.name, action: "Қамровни бутун " + r.name + "га ўзгартириш" });
    if (s.scope !== "region" && d) out.push({ up: "district", label: d.name, action: "Қамровни бутун " + d.name + "га ўзгартириш" });
    if (s.scope === "mahalla" && m) out.push({ label: m.name });
    return out;
  }

  function renderCrumbs(s) {
    var el = $("scopeCrumbs");
    el.textContent = "";
    if (!s.scope) { el.appendChild(ui.node("span", "scope-crumb scope-crumb-off", "Қамров ҳали танланмаган")); return; }
    var list = crumbs(s);
    list.forEach(function (c, i) {
      if (i) {
        var sep = ui.icon("i-chevron-right");
        sep.setAttribute("class", "ico scope-sep");
        el.appendChild(sep);
      }
      if (i === list.length - 1) {
        var cur = ui.node("span", "scope-crumb", c.label);
        cur.setAttribute("aria-current", "true");
        el.appendChild(cur);
        return;
      }
      var b = ui.node("button", "scope-crumb scope-crumb-btn", c.label);
      b.type = "button";
      b.setAttribute("data-up", c.up);
      b.setAttribute("aria-label", c.action);
      el.appendChild(b);
    });
  }

  function countLabel(s, query, rows) {
    if (query) return "Қидирув натижалари · " + (rows.total > rows.length ? rows.length + " / " + rows.total : rows.length);
    if (s.scope === "region") return "Туманлар ва шаҳарлар · " + rows.length;
    if (s.scope === "district" || s.scope === "mahalla") return "Маҳаллалар (МФЙ) · " + rows.length;
    return "Ҳудудлар · " + geo.regions.length;
  }

  OM.scopeView = { listRows: listRows, renderList: renderList, renderCrumbs: renderCrumbs, countLabel: countLabel };
})();
