(function () {
  "use strict";

  var C = window.OMDateCore, P = window.OMPicker;
  var MONTHS = C.MONTHS, MONTHS_OF = C.MONTHS_OF, WEEK = C.WEEK, WEEK_FULL = C.WEEK_FULL;
  var isoOf = C.isoOf, displayOf = C.displayOf, weekIndex = C.weekIndex, sameDay = C.sameDay;
  var fromIso = C.fromIso, maskDigits = C.maskDigits, readTyped = C.readTyped, typedStart = C.typedStart;
  var el = P.el;

  function DatePicker(input) {
    var self = this;
    this.input = input;
    this.view = null;
    this.focusDay = null;
    this.field = new P.Field(input, {
      maxLength: 10,
      placeholder: C.PLACEHOLDER,
      icon: "i-calendar",
      toggleLabel: "Календарни очиш",
      popLabel: "Сана танлаш",
      popClass: "date-pop",
      mask: maskDigits,
      sync: function (text) { self.sync(text); },
      onOpen: function () { self.open(); }
    });
    this.build();
  }

  DatePicker.prototype.sync = function (text) {
    var r = readTyped(text);
    this.input.dataset.iso = r.iso;
    this.input.dataset.bad = r.bad ? "true" : "false";
  };

  DatePicker.prototype.build = function () {
    var self = this, pop = this.field.pop;
    var head = el("div", "date-head");
    this.prev = P.iconButton("date-nav", "i-chevron-left", "Олдинги ой");
    this.next = P.iconButton("date-nav", "i-chevron-right", "Кейинги ой");
    this.title = el("p", "date-title");
    this.title.setAttribute("aria-live", "polite");
    head.appendChild(this.prev); head.appendChild(this.title); head.appendChild(this.next);
    this.grid = el("div", "date-grid");
    this.grid.setAttribute("role", "grid");
    var foot = el("div", "pick-foot");
    var today = el("button", "btn btn-ghost btn-sm", "Бугун");
    today.type = "button";
    foot.appendChild(today);
    pop.appendChild(head); pop.appendChild(this.grid); pop.appendChild(foot);

    this.prev.addEventListener("click", function () { self.shiftMonth(-1); });
    this.next.addEventListener("click", function () { self.shiftMonth(1); });
    today.addEventListener("click", function () { self.pick(C.today()); });
    this.grid.addEventListener("click", function (e) {
      var b = e.target.closest("[data-iso]");
      if (b && b.getAttribute("aria-disabled") !== "true") self.pick(fromIso(b.getAttribute("data-iso")));
    });
    this.grid.addEventListener("keydown", function (e) { self.onKey(e); });
  };

  DatePicker.prototype.minDate = function () { return fromIso(this.input.dataset.min); };

  DatePicker.prototype.open = function () {
    var chosen = fromIso(this.input.dataset.iso);
    var min = this.minDate();
    var start = chosen || typedStart(this.input.value, min) || (min && min > C.today() ? min : C.today());
    this.focusDay = start;
    this.view = new Date(start.getFullYear(), start.getMonth(), 1, 12);
    this.render(true);
  };

  DatePicker.prototype.shiftMonth = function (step) {
    this.view = new Date(this.view.getFullYear(), this.view.getMonth() + step, 1, 12);
    var day = Math.min(this.focusDay.getDate(), new Date(this.view.getFullYear(), this.view.getMonth() + 1, 0).getDate());
    this.focusDay = new Date(this.view.getFullYear(), this.view.getMonth(), day, 12);
    this.render(false);
  };

  DatePicker.prototype.headRow = function () {
    var row = el("div", "date-row");
    row.setAttribute("role", "row");
    WEEK.forEach(function (w, i) {
      var h = el("span", "date-wd", w);
      h.setAttribute("role", "columnheader");
      h.setAttribute("aria-label", WEEK_FULL[i]);
      row.appendChild(h);
    });
    return row;
  };

  DatePicker.prototype.dayButton = function (d, month, min, chosen, now) {
    var b = el("button", "date-day", String(d.getDate()));
    b.type = "button";
    b.tabIndex = -1;
    b.setAttribute("role", "gridcell");
    b.setAttribute("data-iso", isoOf(d));
    b.setAttribute("aria-label", d.getDate() + " " + MONTHS_OF[d.getMonth()] + " " + d.getFullYear() + ", " + WEEK_FULL[weekIndex(d)]);
    if (d.getMonth() !== month) b.classList.add("is-out");
    if (sameDay(d, now)) b.setAttribute("aria-current", "date");
    if (sameDay(d, chosen)) b.setAttribute("aria-selected", "true");
    if (min && d < min && !sameDay(d, min)) b.setAttribute("aria-disabled", "true");
    return b;
  };

  DatePicker.prototype.render = function (moveFocus) {
    var y = this.view.getFullYear(), m = this.view.getMonth();
    var min = this.minDate(), chosen = fromIso(this.input.dataset.iso), now = C.today();
    this.title.textContent = MONTHS[m] + " " + y;
    this.prev.disabled = !!min && new Date(y, m, 0, 12) < min;
    this.grid.textContent = "";
    this.grid.appendChild(this.headRow());
    var first = new Date(y, m, 1, 12), cursor = new Date(y, m, 1 - weekIndex(first), 12), row, target = null;
    for (var i = 0; i < 42; i++) {
      if (i % 7 === 0) { row = el("div", "date-row"); row.setAttribute("role", "row"); this.grid.appendChild(row); }
      var b = this.dayButton(cursor, m, min, chosen, now);
      if (sameDay(cursor, this.focusDay)) { b.tabIndex = 0; target = b; }
      row.appendChild(b);
      cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1, 12);
    }
    if (moveFocus !== false && target) target.focus({ preventScroll: true });
  };

  DatePicker.prototype.onKey = function (e) {
    var step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key];
    var d = this.focusDay;
    if (step) d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + step, 12);
    else if (e.key === "Home") d = new Date(d.getFullYear(), d.getMonth(), d.getDate() - weekIndex(d), 12);
    else if (e.key === "End") d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 6 - weekIndex(d), 12);
    else if (e.key === "PageUp" || e.key === "PageDown") {
      e.preventDefault();
      this.shiftMonth(e.key === "PageUp" ? -1 : 1);
      this.render(true);
      return;
    } else return;
    e.preventDefault();
    this.focusDay = d;
    this.view = new Date(d.getFullYear(), d.getMonth(), 1, 12);
    this.render(true);
  };

  DatePicker.prototype.pick = function (d) {
    var min = this.minDate();
    if (!d || (min && d < min && !sameDay(d, min))) return;
    this.field.commit(displayOf(d));
  };

  function init() {
    document.querySelectorAll("input[data-datepicker]").forEach(function (input) { new DatePicker(input); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
