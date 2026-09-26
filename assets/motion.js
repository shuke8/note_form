(function () {
  "use strict";

  var THEME_KEY = "om-theme";
  var storageWarned = false;
  var toastArea = null;

  function onMedia(mq, fn) {
    if (typeof mq.addEventListener === "function") mq.addEventListener("change", fn);
    else if (typeof mq.addListener === "function") mq.addListener(fn);
  }

  function readStored() {
    try { return localStorage.getItem(THEME_KEY); } catch (e) { return null; }
  }

  function syncMeta() {
    var meta = document.querySelector('meta[name="theme-color"]:not([media])');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "theme-color";
      document.head.appendChild(meta);
    }
    var probe = document.createElement("div");
    probe.style.cssText = "position:absolute;visibility:hidden;transition:none";
    document.body.appendChild(probe);
    probe.style.background = getComputedStyle(document.documentElement).getPropertyValue("--paper").trim();
    meta.setAttribute("content", getComputedStyle(probe).backgroundColor);
    probe.remove();
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    document.querySelectorAll("[data-theme-toggle]").forEach(function (b) {
      var label = theme === "dark" ? "Ёруғ мавзуга ўтиш" : "Қоронғи мавзуга ўтиш";
      b.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
      b.setAttribute("aria-label", label);
      b.setAttribute("title", label);
      var use = b.querySelector("[data-theme-icon]");
      if (use) use.setAttribute("href", theme === "dark" ? "#i-moon" : "#i-sun");
    });
    syncMeta();
  }

  function saveTheme(next) {
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch (e) {
      if (storageWarned) return;
      storageWarned = true;
      if (window.omToast) window.omToast("Мавзу танлови бу браузерда сақланмайди", "warn");
    }
  }

  function initTheme() {
    var system = window.matchMedia("(prefers-color-scheme: dark)");
    applyTheme(readStored() || (system.matches ? "dark" : "light"));
    onMedia(system, function (e) { if (!readStored()) applyTheme(e.matches ? "dark" : "light"); });
    document.querySelectorAll("[data-theme-toggle]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
        applyTheme(next);
        saveTheme(next);
      });
    });
  }

  window.omToast = function (message, tone) {
    if (!toastArea) {
      toastArea = document.createElement("div");
      toastArea.className = "toast-area";
      toastArea.setAttribute("role", "status");
      toastArea.setAttribute("aria-live", "polite");
      document.body.appendChild(toastArea);
    }
    var same = Array.prototype.filter.call(toastArea.children, function (t) {
      return t.textContent === message && t.getAttribute("data-leaving") !== "true";
    })[0];
    var el = same || document.createElement("div");
    if (!same) {
      el.className = "toast";
      el.textContent = message;
      if (tone) el.setAttribute("data-tone", tone);
      toastArea.appendChild(el);
    }
    clearTimeout(el.omTimer);
    el.omTimer = setTimeout(function () {
      el.setAttribute("data-leaving", "true");
      setTimeout(function () { el.remove(); }, 200);
    }, 3600);
  };

  function initActions() {
    var bar = document.getElementById("actions");
    if (!bar) return;
    function sync() { document.documentElement.style.setProperty("--actions-h", bar.offsetHeight + "px"); }
    sync();
    if (window.ResizeObserver) new ResizeObserver(sync).observe(bar);
    else window.addEventListener("resize", sync);
  }

  function boot() {
    [initTheme, initActions].forEach(function (step) {
      try { step(); } catch (e) { console.error("[motion]", step.name, e); }
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
