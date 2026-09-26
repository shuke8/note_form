(function () {
  "use strict";

  var OM = window.OM = window.OM || {};
  var SVG_NS = "http://www.w3.org/2000/svg";

  function $(id) { return document.getElementById(id); }

  function radiosOf(group) {
    return Array.prototype.slice.call(group.querySelectorAll('[role="radio"]')).filter(function (it) {
      return it.closest('[role="radiogroup"]') === group;
    });
  }

  function wireRadioGroup(group, onSelect) {
    var items = radiosOf(group);
    if (!items.length) return;
    function select(el) {
      items.forEach(function (it) {
        var on = it === el;
        it.setAttribute("aria-checked", on ? "true" : "false");
        it.tabIndex = on ? 0 : -1;
      });
      onSelect(el);
    }
    function focusIndex(i) {
      var next = items[(i + items.length) % items.length];
      select(next);
      next.focus();
    }
    items.forEach(function (item, i) {
      item.addEventListener("click", function () { select(item); });
      item.addEventListener("keydown", function (e) {
        var k = e.key;
        if (k === "Home") { e.preventDefault(); focusIndex(0); }
        else if (k === "End") { e.preventDefault(); focusIndex(items.length - 1); }
        else if (k === "ArrowRight" || k === "ArrowDown") { e.preventDefault(); focusIndex(i + 1); }
        else if (k === "ArrowLeft" || k === "ArrowUp") { e.preventDefault(); focusIndex(i - 1); }
        else if (k === " " || k === "Enter") { e.preventDefault(); select(item); }
      });
    });
    syncRadios(group);
  }

  function syncRadios(group) {
    var items = radiosOf(group);
    var checked = items.filter(function (i) { return i.getAttribute("aria-checked") === "true"; })[0];
    items.forEach(function (it) { it.tabIndex = it === (checked || items[0]) ? 0 : -1; });
  }

  function checkRadio(group, predicate) {
    radiosOf(group).forEach(function (it) { it.setAttribute("aria-checked", predicate(it) ? "true" : "false"); });
    syncRadios(group);
  }

  function reveal(el, show) {
    var wasHidden = el.hidden;
    el.hidden = !show;
    if (!show || !wasHidden) return;
    el.removeAttribute("data-enter");
    void el.offsetWidth;
    el.setAttribute("data-enter", "1");
  }

  function icon(name) {
    var svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("class", "ico");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    var use = document.createElementNS(SVG_NS, "use");
    use.setAttribute("href", "#" + name);
    svg.appendChild(use);
    return svg;
  }

  function node(tag, cls, text) {
    var el = document.createElement(tag);
    if (cls) el.className = cls;
    if (text != null) el.textContent = text;
    return el;
  }

  var liveLast = {};
  function setLive(id, text) {
    if (liveLast[id] === text) return;
    liveLast[id] = text;
    $(id).textContent = text;
  }

  function focusField(el) {
    if (!el) return;
    requestAnimationFrame(function () {
      try { el.focus({ preventScroll: true }); } catch (err) { el.focus(); }
      var calm = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (el.scrollIntoView) el.scrollIntoView({ block: "center", behavior: calm ? "auto" : "smooth" });
    });
  }

  OM.ui = {
    $: $, wireRadioGroup: wireRadioGroup, checkRadio: checkRadio, reveal: reveal,
    icon: icon, node: node, setLive: setLive, focusField: focusField
  };
})();
