/* =============================================================================
   MOTION — designsystems.surf o'lchoviga ko'ra
   Reveal egri chizig'i jonli sahifada kadrma-kadr o'lchandi:
   opacity 0→1, translateY(10px)→0, 417 ms, ortiqcha sakrashsiz.
   Bu yerda CSS transition qiladi, JS faqat "qachon" ni hal qiladi.
   ========================================================================== */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* Safari 14 dan past va eski Android'da `MediaQueryList.addEventListener`
     yo'q — faqat eski `addListener` bor. Uni to'g'ridan-to'g'ri chaqirish
     butun boot'ni yiqitardi. */
  function onMedia(mq, fn) {
    if (typeof mq.addEventListener === "function") mq.addEventListener("change", fn);
    else if (typeof mq.addListener === "function") mq.addListener(fn);
  }

  /* ---------------------------------------------------------------------------
     1. SCROLL REVEAL
     Bitta IntersectionObserver butun sahifa uchun — har element uchun
     alohida observer yaratish 100+ obyekt degani.
     `rootMargin` pastdan -10%: element ekranga to'liq kirmasdan, o'ninchi
     qismi ko'ringanda boshlanadi. Aks holda pastki qatordagi kartalar
     foydalanuvchi ularni ko'rgandan keyin "paydo bo'lib" qoladi.
  ------------------------------------------------------------------------- */
  function initReveal() {
    var nodes = document.querySelectorAll("[data-reveal]");
    if (!nodes.length) return;

    if (reduced.matches || !("IntersectionObserver" in window)) {
      nodes.forEach(function (n) { n.classList.add("is-in", "is-done"); });
      document.documentElement.classList.remove("no-js");
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        el.classList.add("is-in");
        io.unobserve(el);
        // Animatsiya tugagach kompozitor qatlamini bo'shatamiz.
        el.addEventListener("transitionend", function once(e) {
          if (e.propertyName !== "opacity") return;
          el.classList.add("is-done");
          el.removeEventListener("transitionend", once);
        });
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.01 });

    nodes.forEach(function (n) { io.observe(n); });
    // Kuzatuvchi ULANGANDAN keyingina zaxirani olib tashlaymiz.
    document.documentElement.classList.remove("no-js");
  }

  /* ---------------------------------------------------------------------------
     2. STAGGER
     `data-stagger` bo'lgan konteynerning bevosita bolalariga ketma-ket
     kechikish beriladi. Kechikish 6-elementda to'xtaydi: 10 ta kartaga
     10x60ms = 600ms bo'lsa, oxirgisi kech qoladi va ro'yxat "cho'zilib"
     ochilayotganday tuyuladi.
  ------------------------------------------------------------------------- */
  function initStagger() {
    document.querySelectorAll("[data-stagger]").forEach(function (group) {
      var step = parseInt(group.getAttribute("data-stagger"), 10) || 60;
      var kids = Array.prototype.filter.call(group.children, function (c) {
        return c.hasAttribute("data-reveal");
      });
      kids.forEach(function (kid, i) {
        kid.style.setProperty("--reveal-delay", Math.min(i, 5) * step + "ms");
      });
    });
  }

  /* ---------------------------------------------------------------------------
     5. TEMA
     Tanlov `localStorage` da; yo'q bo'lsa tizim sozlamasi. `theme-color`
     navbar rangiga tenglashtiriladi — status bar aynan navbar ustida
     turadi, sahifa foni ustida emas.
  ------------------------------------------------------------------------- */
  var THEME_KEY = "om-theme";
  var storageWarned = false;

  function readStored() {
    try { return localStorage.getItem(THEME_KEY); } catch (e) { return null; }
  }

  function syncMeta(theme) {
    var meta = document.querySelector('meta[name="theme-color"]:not([media])');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "theme-color";
      document.head.appendChild(meta);
    }
    var probe = document.createElement("div");
    probe.style.cssText = "position:absolute;visibility:hidden";
    document.body.appendChild(probe);
    probe.style.background = getComputedStyle(document.documentElement).getPropertyValue("--paper").trim();
    meta.setAttribute("content", getComputedStyle(probe).backgroundColor);
    probe.remove();
    void theme;
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    document.querySelectorAll("[data-theme-toggle]").forEach(function (b) {
      b.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
      var label = theme === "dark" ? "Ёруғ мавзуга ўтиш" : "Қоронғи мавзуга ўтиш";
      b.setAttribute("aria-label", label);
      b.setAttribute("title", label);
    });
    syncMeta(theme);
  }

  function initTheme() {
    var stored = readStored();
    var system = window.matchMedia("(prefers-color-scheme: dark)");
    applyTheme(stored || (system.matches ? "dark" : "light"));

    onMedia(system, function (e) {
      if (!readStored()) applyTheme(e.matches ? "dark" : "light");
    });

    document.querySelectorAll("[data-theme-toggle]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
        applyTheme(next);
        try {
          localStorage.setItem(THEME_KEY, next);
        } catch (e) {
          // Private rejimda saqlash ishlamaydi. Tanlov shu sahifada
          // qoladi, lekin keyingi sahifada yo'qoladi — buni bir marta
          // aytamiz, aks holda foydalanuvchi tema "o'z-o'zidan qaytdi"
          // deb o'ylaydi.
          if (!storageWarned) {
            storageWarned = true;
            if (window.omToast) window.omToast("Мавзу танлови бу браузерда сақланмайди", "warn");
          }
        }
      });
    });
  }

  /* ---------------------------------------------------------------------------
     6. TOAST
  ------------------------------------------------------------------------- */
  var toastArea = null;
  window.omToast = function (message, tone) {
    if (!toastArea) {
      toastArea = document.createElement("div");
      toastArea.className = "toast-area";
      // `status` — assertive emas: toast ish oqimini to'xtatmaydi.
      toastArea.setAttribute("role", "status");
      toastArea.setAttribute("aria-live", "polite");
      document.body.appendChild(toastArea);
    }
    var el = document.createElement("div");
    el.className = "toast";
    el.textContent = message;
    if (tone) el.setAttribute("data-tone", tone);
    toastArea.appendChild(el);
    setTimeout(function () {
      el.setAttribute("data-leaving", "true");
      setTimeout(function () { el.remove(); }, 200);
    }, 3600);
  };

  /* ---------------------------------------------------------------------------
     AMAL PANELI — pastda mixlangan
     Panel `position: fixed` bo'lgani uchun oqimdan chiqadi va oxirgi kartani
     yopib qo'yishi mumkin. Balandligi o'zgaruvchan: holat matni o'ralsa yoki
     tor ekranda tugmalar ustma-ust tushsa boshqacha bo'ladi — shuning uchun
     u O'LCHANADI, qo'lda yozilmaydi.
  ------------------------------------------------------------------------- */
  function initActions() {
    var bar = document.getElementById("actions");
    if (!bar) return;
    function sync() {
      document.documentElement.style.setProperty("--actions-h", bar.offsetHeight + "px");
    }
    sync();
    if (window.ResizeObserver) new ResizeObserver(sync).observe(bar);
    else window.addEventListener("resize", sync);
  }

  /* «So'nggi yuborilganlar» ochiladigan kartasi va filtri bu yerdan OLIB
     TASHLANDI: ro'yxat `landing.html` dan `yuborilganlar.html` ga ko'chdi va
     u yerda kartalar JS bilan quriladi, ya'ni `motion.js` boot paytida ularni
     topmaydi. Ochish/yopish mantiqi `yuborilganlar.js` ning `card()` ida —
     element yaratilgan joyda ulanadi.
     `.feed-*` KOMPONENTI (`components.css`) o'z joyida qoladi. */

  /* Har qadam alohida o'raladi: ilgari `initTheme` dagi bitta xato
     `initReveal` ni ham olib ketardi va sahifa bo'm-bo'sh qolardi. */
  function boot() {
    var revealOk = false;
    [initTheme, initStagger, initReveal, initActions]
      .forEach(function (step) {
        try {
          step();
          if (step === initReveal) revealOk = true;
        } catch (e) {
          console.error("[motion] " + (step.name || "step") + " ишламади", e);
        }
      });
    /* `no-js` ni FAQAT reveal muvaffaqiyatli tugagandagina olamiz.
       Shartsiz olib tashlash «hech qachon qolib ketmasin» ni beradi-yu,
       «kontent yashirin turganda olinmasin» ni yo'qotadi: `initReveal`
       otilsa CSS zaxirasi ham ketib, sahifa bo'm-bo'sh qolardi. */
    if (revealOk) document.documentElement.classList.remove("no-js");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
