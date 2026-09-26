(function () {
  "use strict";

  var OM = window.OM = window.OM || {};

  var OFFSET_MS = 5 * 3600000;
  var MINUTE = 60000;
  var DAY = 86400000;
  var MONTHS = ["январ", "феврал", "март", "апрел", "май", "июн",
    "июл", "август", "сентябр", "октябр", "ноябр", "декабр"];
  var WEEKDAYS = ["якшанба", "душанба", "сешанба", "чоршанба", "пайшанба", "жума", "шанба"];

  function pad2(n) { return (n < 10 ? "0" : "") + n; }

  function parts(ms) {
    var d = new Date(ms + OFFSET_MS);
    return { y: d.getUTCFullYear(), mo: d.getUTCMonth() + 1, d: d.getUTCDate(),
      h: d.getUTCHours(), mi: d.getUTCMinutes(), wd: d.getUTCDay() };
  }

  function todayIso(ms) {
    var p = parts(ms);
    return p.y + "-" + pad2(p.mo) + "-" + pad2(p.d);
  }

  function fromWall(dateIso, time) {
    var dm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateIso || ""));
    var tm = /^(\d{2}):(\d{2})$/.exec(String(time || ""));
    if (!dm || !tm) return null;
    var y = +dm[1], mo = +dm[2], d = +dm[3], h = +tm[1], mi = +tm[2];
    if (mo < 1 || mo > 12 || d < 1 || h > 23 || mi > 59) return null;
    var ms = Date.UTC(y, mo - 1, d, h, mi, 0, 0);
    if (new Date(ms).getUTCDate() !== d) return null;
    return ms - OFFSET_MS;
  }

  function floorMinute(ms) { return Math.floor(ms / MINUTE) * MINUTE; }

  function isoZ(ms) { return new Date(ms).toISOString().replace(/\.\d{3}Z$/, "Z"); }

  function dateLabel(ms, nowMs) {
    var p = parts(ms), label = p.d + " " + MONTHS[p.mo - 1];
    return p.y === parts(nowMs).y ? label : label + " " + p.y;
  }

  function clock(ms) { var p = parts(ms); return pad2(p.h) + ":" + pad2(p.mi); }

  function weekday(ms) { return WEEKDAYS[parts(ms).wd]; }

  function moment(ms, nowMs) { return dateLabel(ms, nowMs) + ", " + clock(ms); }

  OM.time = {
    MINUTE: MINUTE, DAY: DAY,
    parts: parts, todayIso: todayIso, fromWall: fromWall, floorMinute: floorMinute, isoZ: isoZ,
    dateLabel: dateLabel, clock: clock, weekday: weekday, moment: moment, pad2: pad2
  };
})();
