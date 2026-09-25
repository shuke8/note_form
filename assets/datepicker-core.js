(function () {
  "use strict";

  var MONTHS = ["Январ", "Феврал", "Март", "Апрел", "Май", "Июн",
                "Июл", "Август", "Сентябр", "Октябр", "Ноябр", "Декабр"];
  var MONTHS_OF = ["январ", "феврал", "март", "апрел", "май", "июн",
                   "июл", "август", "сентябр", "октябр", "ноябр", "декабр"];
  var WEEK = ["Ду", "Се", "Чо", "Па", "Жу", "Ша", "Як"];
  var WEEK_FULL = ["душанба", "сешанба", "чоршанба", "пайшанба", "жума", "шанба", "якшанба"];
  var PLACEHOLDER = "КК.ОО.ЙЙЙЙ";

  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function isoOf(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function displayOf(d) { return pad(d.getDate()) + "." + pad(d.getMonth() + 1) + "." + d.getFullYear(); }
  function weekIndex(d) { return (d.getDay() + 6) % 7; }
  function sameDay(a, b) { return !!a && !!b && isoOf(a) === isoOf(b); }

  function fromIso(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || "");
    return m ? build(+m[1], +m[2], +m[3]) : null;
  }
  function build(y, mo, d) {
    var date = new Date(y, mo - 1, d, 12, 0, 0);
    return date.getFullYear() === y && date.getMonth() === mo - 1 && date.getDate() === d ? date : null;
  }

  function maskDigits(raw) {
    var digits = raw.replace(/\D/g, "").slice(0, 8);
    var out = digits.slice(0, 2);
    if (digits.length > 2) out += "." + digits.slice(2, 4);
    if (digits.length > 4) out += "." + digits.slice(4);
    return out;
  }

  function readTyped(text) {
    if (!text) return { iso: "", bad: false };
    var m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(text);
    if (!m) return { iso: "", bad: false };
    var d = build(+m[3], +m[2], +m[1]);
    return d ? { iso: isoOf(d), bad: false } : { iso: "", bad: true };
  }

  function typedStart(text, min) {
    var m = /^(\d{2})\.(\d{2})/.exec(text || "");
    if (!m || +m[2] < 1 || +m[2] > 12) return null;
    var base = min || new Date();
    var year = base.getFullYear() + (+m[2] - 1 < base.getMonth() ? 1 : 0);
    var last = new Date(year, +m[2], 0).getDate();
    return new Date(year, +m[2] - 1, Math.min(Math.max(+m[1], 1), last), 12);
  }

  window.OMDateCore = {
    MONTHS: MONTHS, MONTHS_OF: MONTHS_OF, WEEK: WEEK, WEEK_FULL: WEEK_FULL, PLACEHOLDER: PLACEHOLDER,
    isoOf: isoOf, displayOf: displayOf, weekIndex: weekIndex, sameDay: sameDay,
    fromIso: fromIso, maskDigits: maskDigits, readTyped: readTyped, typedStart: typedStart
  };
})();
