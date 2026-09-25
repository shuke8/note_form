(function () {
  "use strict";

  var C = window.OMDateCore;
  var MONTHS = C.MONTHS, MONTHS_OF = C.MONTHS_OF, WEEK = C.WEEK, WEEK_FULL = C.WEEK_FULL;
  var isoOf = C.isoOf, displayOf = C.displayOf, weekIndex = C.weekIndex, sameDay = C.sameDay;
  var fromIso = C.fromIso, maskDigits = C.maskDigits, readTyped = C.readTyped, typedStart = C.typedStart;
  var uid = 0;

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }
  function icon(name) {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "ico");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    svg.innerHTML = '<use href="#' + name + '"/>';
    return svg;
  }
  function iconButton(cls, name, label) {
    var b = el("button", cls);
    b.type = "button";
    b.setAttribute("aria-label", label);
    b.appendChild(icon(name));
    return b;
  }

  function DatePicker(input) {
    this.input = input;
    this.id = "dp" + (++uid);
    this.view = null;
    this.focusDay = null;
    this.buildField();
    this.buildPopover();
    this.bind();
    this.sync(input.getAttribute("value") ? displayOf(fromIso(input.getAttribute("value"))) : "");
  }

  DatePicker.prototype.buildField = function () {
    var input = this.input;
    input.type = "text";
    input.inputMode = "numeric";
    input.maxLength = 10;
    input.placeholder = C.PLACEHOLDER;
    input.setAttribute("spellcheck", "false");
    this.wrap = el("div", "date-field");
    input.parentNode.insertBefore(this.wrap, input);
    this.wrap.appendChild(input);
    this.toggle = iconButton("date-toggle", "i-calendar", "Календарни очиш");
    this.toggle.setAttribute("aria-haspopup", "dialog");
    this.toggle.setAttribute("aria-expanded", "false");
    this.toggle.setAttribute("aria-controls", this.id);
    this.wrap.appendChild(this.toggle);
  };

  DatePicker.prototype.buildPopover = function () {
    var pop = el("div", "date-pop");
    pop.id = this.id;
    pop.hidden = true;
    pop.setAttribute("role", "dialog");
    pop.setAttribute("aria-label", "Сана танлаш");
    var head = el("div", "date-head");
    this.prev = iconButton("date-nav", "i-chevron-left", "Олдинги ой");
    this.next = iconButton("date-nav", "i-chevron-right", "Кейинги ой");
    this.title = el("p", "date-title");
    this.title.setAttribute("aria-live", "polite");
    head.appendChild(this.prev); head.appendChild(this.title); head.appendChild(this.next);
    this.grid = el("div", "date-grid");
    this.grid.setAttribute("role", "grid");
    var foot = el("div", "date-foot");
    this.today = el("button", "btn btn-ghost btn-sm", "Бугун");
    this.today.type = "button";
    foot.appendChild(this.today);
    pop.appendChild(head); pop.appendChild(this.grid); pop.appendChild(foot);
    this.wrap.appendChild(pop);
    this.pop = pop;
  };

  DatePicker.prototype.bind = function () {
    var self = this;
    this.input.addEventListener("input", function () {
      var masked = maskDigits(self.input.value);
      if (masked !== self.input.value) self.input.value = masked;
      self.sync(masked);
    }, true);
    this.toggle.addEventListener("click", function () { self.isOpen() ? self.close(true) : self.open(); });
    this.prev.addEventListener("click", function () { self.shiftMonth(-1); });
    this.next.addEventListener("click", function () { self.shiftMonth(1); });
    this.today.addEventListener("click", function () { self.pick(new Date()); });
    this.grid.addEventListener("click", function (e) {
      var b = e.target.closest("[data-iso]");
      if (b && b.getAttribute("aria-disabled") !== "true") self.pick(fromIso(b.getAttribute("data-iso")));
    });
    this.grid.addEventListener("keydown", function (e) { self.onKey(e); });
    this.pop.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { e.stopPropagation(); e.preventDefault(); self.close(true); }
    });
    document.addEventListener("pointerdown", function (e) {
      if (self.isOpen() && !self.wrap.contains(e.target)) self.close(false);
    });
    this.wrap.addEventListener("focusout", function (e) {
      if (self.isOpen() && e.relatedTarget && !self.wrap.contains(e.relatedTarget)) self.close(false);
    });
  };

  DatePicker.prototype.sync = function (text) {
    var r = readTyped(text);
    this.input.dataset.iso = r.iso;
    this.input.dataset.bad = r.bad ? "true" : "false";
  };

  DatePicker.prototype.minDate = function () { return fromIso(this.input.dataset.min); };
  DatePicker.prototype.isOpen = function () { return !this.pop.hidden; };

  DatePicker.prototype.open = function () {
    var chosen = fromIso(this.input.dataset.iso);
    var min = this.minDate();
    var start = chosen || typedStart(this.input.value, min) || (min && min > new Date() ? min : new Date());
    this.focusDay = start;
    this.view = new Date(start.getFullYear(), start.getMonth(), 1, 12);
    this.pop.hidden = false;
    this.toggle.setAttribute("aria-expanded", "true");
    this.render(true);
    this.reveal();
  };

  DatePicker.prototype.reveal = function () {
    var gap = 16;
    var bottom = this.pop.getBoundingClientRect().bottom + window.scrollY + gap;
    if (bottom > document.body.offsetHeight) document.body.style.minHeight = Math.ceil(bottom) + "px";
    var overflow = this.pop.getBoundingClientRect().bottom + gap - window.innerHeight;
    if (overflow > 0) window.scrollBy(0, overflow);
  };

  DatePicker.prototype.close = function (refocus) {
    this.pop.hidden = true;
    this.toggle.setAttribute("aria-expanded", "false");
    document.body.style.minHeight = "";
    if (refocus) this.toggle.focus();
  };

  DatePicker.prototype.shiftMonth = function (step) {
    this.view = new Date(this.view.getFullYear(), this.view.getMonth() + step, 1, 12);
    var day = Math.min(this.focusDay.getDate(), new Date(this.view.getFullYear(), this.view.getMonth() + 1, 0).getDate());
    this.focusDay = new Date(this.view.getFullYear(), this.view.getMonth(), day, 12);
    this.render(false);
  };

  DatePicker.prototype.render = function (moveFocus) {
    var y = this.view.getFullYear(), m = this.view.getMonth();
    var min = this.minDate(), chosen = fromIso(this.input.dataset.iso), now = new Date();
    this.title.textContent = MONTHS[m] + " " + y;
    this.prev.disabled = !!min && new Date(y, m, 0, 12) < min;
    this.grid.textContent = "";
    var headRow = el("div", "date-row");
    headRow.setAttribute("role", "row");
    WEEK.forEach(function (w, i) {
      var h = el("span", "date-wd", w);
      h.setAttribute("role", "columnheader");
      h.setAttribute("aria-label", WEEK_FULL[i]);
      headRow.appendChild(h);
    });
    this.grid.appendChild(headRow);
    var first = new Date(y, m, 1, 12), cursor = new Date(y, m, 1 - weekIndex(first), 12), row, target = null;
    for (var i = 0; i < 42; i++) {
      if (i % 7 === 0) { row = el("div", "date-row"); row.setAttribute("role", "row"); this.grid.appendChild(row); }
      var b = el("button", "date-day", String(cursor.getDate()));
      b.type = "button";
      b.setAttribute("role", "gridcell");
      b.setAttribute("data-iso", isoOf(cursor));
      b.setAttribute("aria-label", cursor.getDate() + " " + MONTHS_OF[cursor.getMonth()] + " " + cursor.getFullYear() + ", " + WEEK_FULL[weekIndex(cursor)]);
      b.tabIndex = -1;
      if (cursor.getMonth() !== m) b.classList.add("is-out");
      if (sameDay(cursor, now)) b.setAttribute("aria-current", "date");
      if (sameDay(cursor, chosen)) b.setAttribute("aria-selected", "true");
      if (min && cursor < min && !sameDay(cursor, min)) b.setAttribute("aria-disabled", "true");
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
    this.input.value = displayOf(d);
    this.sync(this.input.value);
    this.close(false);
    this.input.focus();
    this.input.dispatchEvent(new Event("input", { bubbles: true }));
    this.input.dispatchEvent(new Event("change", { bubbles: true }));
  };

  function init() {
    document.querySelectorAll("input[data-datepicker]").forEach(function (input) { new DatePicker(input); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
