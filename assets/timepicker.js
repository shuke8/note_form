(function () {
  "use strict";

  var P = window.OMPicker, el = P.el;
  var HOURS = [], MINUTES = [];
  for (var h = 0; h < 24; h++) HOURS.push(h);
  for (var m = 0; m < 60; m += 5) MINUTES.push(m);
  var uid = 0;

  function pad(n) { return (n < 10 ? "0" : "") + n; }

  function maskTime(raw) {
    var digits = raw.replace(/\D/g, "").slice(0, 4);
    return digits.length > 2 ? digits.slice(0, 2) + ":" + digits.slice(2) : digits;
  }

  function readTime(text) {
    var match = /^(\d{2}):(\d{2})$/.exec(text || "");
    if (!match) return { value: "", bad: false };
    return +match[1] < 24 && +match[2] < 60 ? { value: text, bad: false } : { value: "", bad: true };
  }

  function TimePicker(input) {
    var self = this;
    this.input = input;
    this.id = "tp" + (++uid);
    this.field = new P.Field(input, {
      maxLength: 5,
      placeholder: "СС:ДД",
      icon: "i-clock",
      toggleLabel: "Вақтни танлаш",
      popLabel: "Вақт танлаш",
      popClass: "time-pop",
      mask: maskTime,
      sync: function (text) { self.sync(text); },
      onOpen: function () { self.open(); }
    });
    this.build();
  }

  TimePicker.prototype.sync = function (text) {
    var r = readTime(text);
    this.input.dataset.time = r.value;
    this.input.dataset.bad = r.bad ? "true" : "false";
  };

  TimePicker.prototype.current = function () {
    var t = this.input.dataset.time;
    return t ? { h: +t.slice(0, 2), m: +t.slice(3) } : null;
  };

  TimePicker.prototype.column = function (label, kind, values) {
    var col = el("div", "time-col");
    var head = el("p", "time-col-label", label);
    head.id = this.id + "-" + kind;
    var list = el("div", "time-list");
    list.setAttribute("role", "listbox");
    list.setAttribute("aria-labelledby", head.id);
    list.setAttribute("data-kind", kind);
    values.forEach(function (v) {
      var b = el("button", "time-opt", pad(v));
      b.type = "button";
      b.tabIndex = -1;
      b.setAttribute("role", "option");
      b.setAttribute("aria-selected", "false");
      b.setAttribute("data-value", String(v));
      list.appendChild(b);
    });
    col.appendChild(head);
    col.appendChild(list);
    return { col: col, list: list };
  };

  TimePicker.prototype.build = function () {
    var self = this;
    var cols = el("div", "time-cols");
    var hours = this.column("Соат", "h", HOURS);
    var minutes = this.column("Дақиқа", "m", MINUTES);
    cols.appendChild(hours.col);
    cols.appendChild(minutes.col);
    this.field.pop.appendChild(cols);
    this.hours = hours.list;
    this.minutes = minutes.list;
    cols.addEventListener("click", function (e) {
      var opt = e.target.closest(".time-opt");
      if (!opt) return;
      var value = +opt.getAttribute("data-value");
      if (opt.parentNode === self.hours) self.pickHour(value);
      else self.pickMinute(value);
    });
    cols.addEventListener("keydown", function (e) { self.onKey(e); });
  };

  TimePicker.prototype.paint = function (list, value) {
    var target = null;
    Array.prototype.forEach.call(list.children, function (b) {
      var on = +b.getAttribute("data-value") === value;
      b.setAttribute("aria-selected", on ? "true" : "false");
      b.tabIndex = on ? 0 : -1;
      if (on) target = b;
    });
    if (!target) { target = list.children[value == null ? 0 : nearest(list, value)]; target.tabIndex = 0; }
    list.scrollTop = target.offsetTop - list.clientHeight / 2 + target.offsetHeight / 2;
    return target;
  };

  function nearest(list, value) {
    var best = 0;
    Array.prototype.forEach.call(list.children, function (b, i) {
      if (+b.getAttribute("data-value") <= value) best = i;
    });
    return best;
  }

  TimePicker.prototype.open = function () {
    var now = this.current();
    var hour = this.paint(this.hours, now ? now.h : null);
    this.paint(this.minutes, now ? now.m : null);
    hour.focus({ preventScroll: true });
  };

  TimePicker.prototype.pickHour = function (h) {
    var now = this.current();
    this.field.apply(pad(h) + ":" + pad(now ? now.m : 0));
    this.paint(this.hours, h);
    this.paint(this.minutes, now ? now.m : 0).focus({ preventScroll: true });
  };

  TimePicker.prototype.pickMinute = function (m) {
    var now = this.current();
    this.field.commit(pad(now ? now.h : 9) + ":" + pad(m));
  };

  TimePicker.prototype.onKey = function (e) {
    var opt = e.target.closest(".time-opt");
    if (!opt) return;
    var list = opt.parentNode, items = Array.prototype.slice.call(list.children), i = items.indexOf(opt);
    var next = null;
    if (e.key === "ArrowDown") next = items[Math.min(i + 1, items.length - 1)];
    else if (e.key === "ArrowUp") next = items[Math.max(i - 1, 0)];
    else if (e.key === "Home") next = items[0];
    else if (e.key === "End") next = items[items.length - 1];
    else if (e.key === "ArrowRight" && list === this.hours) next = this.minutes.querySelector('[tabindex="0"]');
    else if (e.key === "ArrowLeft" && list === this.minutes) next = this.hours.querySelector('[tabindex="0"]');
    if (!next) return;
    e.preventDefault();
    if (next.parentNode === list) {
      opt.tabIndex = -1;
      next.tabIndex = 0;
    }
    next.focus();
  };

  function init() {
    document.querySelectorAll("input[data-timepicker]").forEach(function (input) { new TimePicker(input); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
