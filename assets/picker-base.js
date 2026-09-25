(function () {
  "use strict";

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

  function Field(input, o) {
    this.input = input;
    this.o = o;
    this.id = "pk" + (++uid);
    this.buildField();
    this.buildPopover();
    this.bind();
    this.o.sync(input.value);
  }

  Field.prototype.buildField = function () {
    var input = this.input;
    input.type = "text";
    input.inputMode = "numeric";
    input.maxLength = this.o.maxLength;
    input.placeholder = this.o.placeholder;
    input.setAttribute("spellcheck", "false");
    this.wrap = el("div", "pick-field");
    input.parentNode.insertBefore(this.wrap, input);
    this.wrap.appendChild(input);
    this.toggle = iconButton("pick-toggle", this.o.icon, this.o.toggleLabel);
    this.toggle.setAttribute("aria-haspopup", "dialog");
    this.toggle.setAttribute("aria-expanded", "false");
    this.toggle.setAttribute("aria-controls", this.id);
    this.wrap.appendChild(this.toggle);
  };

  Field.prototype.buildPopover = function () {
    this.pop = el("div", "pick-pop " + this.o.popClass);
    this.pop.id = this.id;
    this.pop.hidden = true;
    this.pop.setAttribute("role", "dialog");
    this.pop.setAttribute("aria-label", this.o.popLabel);
    this.wrap.appendChild(this.pop);
  };

  Field.prototype.bind = function () {
    var self = this;
    this.input.addEventListener("input", function () {
      var masked = self.o.mask(self.input.value);
      if (masked !== self.input.value) self.input.value = masked;
      self.o.sync(masked);
    }, true);
    this.toggle.addEventListener("click", function () { self.isOpen() ? self.close(true) : self.open(); });
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

  Field.prototype.isOpen = function () { return !this.pop.hidden; };

  Field.prototype.open = function () {
    this.pop.hidden = false;
    this.toggle.setAttribute("aria-expanded", "true");
    this.o.onOpen();
    this.reveal();
  };

  Field.prototype.close = function (refocus) {
    this.pop.hidden = true;
    this.toggle.setAttribute("aria-expanded", "false");
    document.body.style.minHeight = "";
    if (refocus) this.toggle.focus();
  };

  function reservedBottom() {
    var bar = document.getElementById("actions");
    return bar && getComputedStyle(bar).position === "fixed" ? bar.offsetHeight : 0;
  }

  Field.prototype.reveal = function () {
    var gap = 16 + reservedBottom();
    var bottom = this.pop.getBoundingClientRect().bottom + window.scrollY + gap;
    if (bottom > document.body.offsetHeight) document.body.style.minHeight = Math.ceil(bottom) + "px";
    var overflow = this.pop.getBoundingClientRect().bottom + gap - window.innerHeight;
    if (overflow > 0) window.scrollBy(0, overflow);
  };

  Field.prototype.apply = function (text) {
    this.input.value = text;
    this.o.sync(text);
    this.input.dispatchEvent(new Event("input", { bubbles: true }));
    this.input.dispatchEvent(new Event("change", { bubbles: true }));
  };

  Field.prototype.commit = function (text) {
    this.apply(text);
    this.close(false);
    this.input.focus();
  };

  window.OMPicker = { el: el, icon: icon, iconButton: iconButton, Field: Field };
})();
