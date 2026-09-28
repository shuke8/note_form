(function () {
  "use strict";

  var OM = window.OM = window.OM || {};
  var ui = OM.ui, time = OM.time, $ = ui.$;

  var TZ = "Asia/Tashkent";
  var DAY_NAME = { 1: "душанба", 2: "сешанба", 3: "чоршанба", 4: "пайшанба", 5: "жума", 6: "шанба", 7: "якшанба" };
  var DAY_SHORT = { 1: "Ду", 2: "Се", 3: "Чо", 4: "Па", 5: "Жу", 6: "Ша", 7: "Як" };
  var ctx = null;
  var rule = { freq: "weekly", days: [] };

  function val(id, key) { var el = $(id); return el.dataset[key] != null ? el.dataset[key] : el.value; }
  function bad(id) { var el = $(id); return el.dataset.bad === "true" || !!(el.validity && el.validity.badInput); }
  function unique(days) { return days.filter(function (d, i) { return days.indexOf(d) === i; }); }
  function sortedDays() { return rule.days.slice().sort(function (a, b) { return a - b; }); }

  function dayNum(iso) { var p = iso.split("-"); return Date.UTC(+p[0], +p[1] - 1, +p[2]) / time.DAY; }
  function isoOf(n) {
    var d = new Date(n * time.DAY);
    return d.getUTCFullYear() + "-" + time.pad2(d.getUTCMonth() + 1) + "-" + time.pad2(d.getUTCDate());
  }
  function isoWeekday(n) { var wd = new Date(n * time.DAY).getUTCDay(); return wd === 0 ? 7 : wd; }

  function plan(r, at, end, nowMs, limit) {
    var none = { list: [], count: 0 };
    if (end == null || !isFinite(end) || !/^\d{2}:\d{2}$/.test(at || "")) return none;
    var weekly = r.freq === "weekly";
    if (weekly && !r.days.length) return none;
    var runAt = function (n) { return time.fromWall(isoOf(n), at); };
    var first = dayNum(time.todayIso(nowMs)), last = dayNum(time.todayIso(end));
    var from = runAt(first) > nowMs ? first : first + 1;
    var to = runAt(last) <= end ? last : last - 1;
    if (to < from) return none;
    var hit = function (n) { return !weekly || r.days.indexOf(isoWeekday(n)) > -1; };
    var span = to - from + 1, count = span;
    if (weekly) {
      var full = Math.floor(span / 7);
      count = full * r.days.length;
      for (var n = from + full * 7; n <= to; n++) if (hit(n)) count++;
    }
    var list = [];
    for (var k = from; k <= to && list.length < limit; k++) if (hit(k)) list.push(runAt(k));
    return { list: list, count: count };
  }

  function endAt() {
    if (bad("fEndDate") || bad("fEndTime")) return null;
    return time.fromWall(val("fEndDate", "iso"), val("fEndTime", "time"));
  }

  function sendTime() { return bad("fRepeatTime") ? "" : val("fRepeatTime", "time"); }

  function runs(nowMs, limit) { return plan(rule, sendTime(), endAt(), nowMs, limit); }

  function planFor(payload, nowMs, limit) {
    var r = payload && payload.recurrence;
    if (!r) return { list: [], count: 0 };
    return plan({ freq: r.freq, days: r.weekdays || [] }, r.time, Date.parse(payload.expires_at), nowMs, limit);
  }

  function totalText(count) {
    return "жами " + String(count).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " марта";
  }

  function recurrence() {
    var r = { freq: rule.freq, time: sendTime(), timezone: TZ };
    if (rule.freq === "weekly") r.weekdays = sortedDays();
    return r;
  }

  function describe() {
    var at = sendTime() || "—";
    if (rule.freq === "daily") return "Ҳар куни " + at;
    var days = sortedDays().map(function (d) { return DAY_SHORT[d]; }).join(", ");
    return (days || "Кунлар танланмаган") + " · " + at;
  }

  function errors(nowMs) {
    if (ctx.state.expiry !== "repeat") return [];
    var out = [], firstChip = $("dayRow").querySelector("[data-day]");
    if (rule.freq === "weekly" && !rule.days.length) {
      out.push({ el: firstChip, box: $("errDays"), msg: "Камида битта кунни танланг." });
    }
    if (bad("fRepeatTime")) out.push({ el: $("fRepeatTime"), box: $("errRepeatTime"), kind: "rule", msg: "Бу вақт мавжуд эмас — масалан 09:00." });
    else if (!sendTime()) out.push({ el: $("fRepeatTime"), box: $("errRepeatTime"), msg: "Юбориш вақтини танланг." });
    if (bad("fEndDate")) out.push({ el: $("fEndDate"), box: $("errEndDate"), kind: "rule", msg: "Бу сана мавжуд эмас — мавжуд санани танланг." });
    else if (!val("fEndDate", "iso")) out.push({ el: $("fEndDate"), box: $("errEndDate"), msg: "Тугаш санасини танланг." });
    if (bad("fEndTime")) out.push({ el: $("fEndTime"), box: $("errEndTime"), kind: "rule", msg: "Бу вақт мавжуд эмас — масалан 23:59." });
    else if (!val("fEndTime", "time")) out.push({ el: $("fEndTime"), box: $("errEndTime"), msg: "Тугаш вақтини танланг." });
    if (out.length) return out;
    var end = endAt();
    if (end == null || end <= nowMs + time.MINUTE) {
      out.push({ el: $("fEndDate"), box: $("errEndDate"), kind: "rule", msg: "Тугаш вақти ўтиб кетган ёки жуда яқин — келгуси санани танланг." });
    } else if (!runs(nowMs, 1).count) {
      out.push({ el: $("fEndDate"), box: $("errEndDate"), kind: "rule", msg: "Тугаш санасигача бирорта юбориш йўқ — санани кечроққа суринг ёки бошқа кун танланг." });
    }
    return out;
  }

  function paintRuns(nowMs) {
    var list = $("runsList"), sum = $("runsSum"), r = runs(nowMs, 3);
    list.textContent = "";
    r.list.forEach(function (ms) {
      var n = dayNum(time.todayIso(ms)), li = ui.node("li", "run-chip");
      li.appendChild(ui.node("b", null, time.dateLabel(ms, nowMs)));
      li.appendChild(ui.node("span", null, DAY_NAME[isoWeekday(n)] + ", " + time.clock(ms)));
      list.appendChild(li);
    });
    list.hidden = !r.list.length;
    sum.textContent = r.count
      ? "Муддат тугагунча " + totalText(r.count) + " юборилади."
      : "Кунлар, вақт ва тугаш санаси танлангач кейинги юборишлар шу ерда чиқади.";
  }

  function paintFreq() {
    ui.checkRadio($("freqGroup"), function (b) { return b.getAttribute("data-freq") === rule.freq; });
    $("daysField").hidden = rule.freq !== "weekly";
  }

  function paintDays() {
    Array.prototype.forEach.call($("dayRow").querySelectorAll("[data-day]"), function (b) {
      b.setAttribute("aria-pressed", rule.days.indexOf(+b.getAttribute("data-day")) > -1 ? "true" : "false");
    });
  }

  function wireDays() {
    var row = $("dayRow"), items = Array.prototype.slice.call(row.querySelectorAll("[data-day]"));
    items.forEach(function (b, i) { b.tabIndex = i ? -1 : 0; });
    row.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest("[data-day]");
      if (!b) return;
      var d = +b.getAttribute("data-day");
      rule.days = rule.days.indexOf(d) > -1 ? rule.days.filter(function (x) { return x !== d; }) : rule.days.concat(d);
      items.forEach(function (x) { x.tabIndex = x === b ? 0 : -1; });
      paintDays();
      ctx.refresh();
    });
    row.addEventListener("keydown", function (e) {
      var i = items.indexOf(e.target), to = -1;
      if (i < 0) return;
      if (e.key === "ArrowRight") to = Math.min(i + 1, items.length - 1);
      else if (e.key === "ArrowLeft") to = Math.max(i - 1, 0);
      else if (e.key === "Home") to = 0;
      else if (e.key === "End") to = items.length - 1;
      else return;
      e.preventDefault();
      items.forEach(function (x, k) { x.tabIndex = k === to ? 0 : -1; });
      items[to].focus();
    });
  }

  function set(next) {
    if (!next || typeof next !== "object") return;
    if (next.freq === "daily" || next.freq === "weekly") rule.freq = next.freq;
    if (Array.isArray(next.days)) rule.days = unique(next.days.filter(function (d) { return Number.isInteger(d) && d >= 1 && d <= 7; }));
    paintFreq();
    paintDays();
  }

  function init(context) {
    ctx = context;
    ui.wireRadioGroup($("freqGroup"), function (el) { rule.freq = el.getAttribute("data-freq"); paintFreq(); ctx.refresh(); });
    wireDays();
    ["fRepeatTime", "fEndDate", "fEndTime"].forEach(function (id) {
      ["input", "change"].forEach(function (ev) { $(id).addEventListener(ev, function () { ctx.refresh(); }); });
    });
    paintFreq();
  }

  OM.recur = {
    init: init, endAt: endAt, runs: runs, planFor: planFor, totalText: totalText, recurrence: recurrence, describe: describe,
    errors: errors, paintRuns: paintRuns, set: set, get: function () { return { freq: rule.freq, days: sortedDays() }; }
  };
})();
