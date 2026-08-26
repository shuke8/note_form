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
     3. YOZUV MASHINKASI
     DSS sarlavhasi oxirgi so'zni almashtirib turadi va kursor bilan tugaydi.
     Kursor FAQAT yozish paytida miltillaydi — WCAG 2.2.2 to'xtatib
     bo'lmaydigan, 5 soniyadan uzoq miltillashni taqiqlaydi.
     `prefers-reduced-motion` da birinchi so'z statik qoladi.
  ------------------------------------------------------------------------- */
  function initTypewriter() {
    var host = document.querySelector("[data-typewriter]");
    if (!host) return;

    var slot = host.querySelector("[data-tw-slot]");
    var caret = host.querySelector(".caret-el");
    var words;
    try {
      words = JSON.parse(host.getAttribute("data-typewriter"));
    } catch (e) {
      // Jim o'tib ketilsa, sarlavha ostida muzlab qolgan kursor qoladi va
      // sababi hech qayerda ko'rinmaydi.
      console.error("[motion] data-typewriter yaroqli JSON emas", e);
      words = null;
    }
    if (!slot || !Array.isArray(words) || words.length < 2) return;

    // Sarlavha kengligi so'z almashganda sakramasin: eng uzun so'z bo'yicha
    // minimal kenglik o'rnatiladi.
    var probe = document.createElement("span");
    probe.setAttribute("aria-hidden", "true");
    probe.style.cssText = "position:absolute;visibility:hidden;white-space:pre";
    slot.parentNode.appendChild(probe);
    var widest = 0;
    words.forEach(function (w) {
      probe.textContent = w;
      widest = Math.max(widest, probe.getBoundingClientRect().width);
    });
    probe.remove();
    var tail = slot.parentNode;

    /* O'lchov QO'LLANADI — va QAYTA o'lchanadi.
       Bir martalik o'lchov ikki joyda yolg'on chiqadi:
       (1) kegl breakpoint'da 56 → 40 → 32px ga tushadi, 56px da olingan
           zaxira 320px ekranda sahifani gorizontal scroll qilib yuboradi;
       (2) shrift `display=swap` bilan keyin keladi, ya'ni birinchi
           o'lchov zaxira shriftni o'lchaydi.
       Kursor kengligi ham qo'shiladi — u ham shu qutining ichida. */
    function measure() {
      if (!tail) return;
      tail.style.minWidth = "";           // eski zaxira o'lchovni cheklamasin
      var pr = document.createElement("span");
      pr.setAttribute("aria-hidden", "true");
      pr.style.cssText = "position:absolute;visibility:hidden;white-space:pre";
      tail.appendChild(pr);
      var w = 0;
      words.forEach(function (word) {
        pr.textContent = word;
        w = Math.max(w, pr.getBoundingClientRect().width);
      });
      pr.remove();
      var cw = 0;
      if (caret) {
        var cs = getComputedStyle(caret);
        cw = caret.getBoundingClientRect().width + (parseFloat(cs.marginInlineStart) || 0);
      }
      if (w > 0) tail.style.minWidth = Math.ceil(w + cw) + "px";
    }
    measure();
    void widest;

    // Shrift almashgach va ekran kengligi o'zgargach qayta o'lchaymiz.
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(measure).catch(function () {});
    }
    var resizeTimer = null;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(measure, 150);
    }, { passive: true });

    slot.textContent = words[0];
    // Ekran o'quvchi almashinuvni o'qib turmasin — u statik matnni oladi.
    slot.setAttribute("aria-hidden", "true");
    var sr = document.createElement("span");
    sr.className = "sr-only";
    sr.textContent = words[0];
    slot.parentNode.insertBefore(sr, slot.nextSibling);

    if (reduced.matches) return;

    var i = 0, chars = words[0].length, deleting = false, timer = null;

    function blink(on) { if (caret) caret.setAttribute("data-blink", on ? "on" : "off"); }

    function tick() {
      var word = words[i];
      if (deleting) {
        chars--;
        if (chars <= 0) { deleting = false; i = (i + 1) % words.length; }
      } else {
        chars++;
        if (chars >= word.length) {
          chars = word.length;
          deleting = true;
          slot.textContent = word.slice(0, chars);
          blink(true);
          timer = setTimeout(tick, 2600);   // to'liq so'z ko'rinib turadi
          return;
        }
      }
      slot.textContent = words[i].slice(0, Math.max(chars, 0));
      blink(false);
      timer = setTimeout(tick, deleting ? 34 : 62);
    }

    // Sahifa fonda bo'lsa taymer ishlamasin (batareya + Safari throttling).
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) { clearTimeout(timer); blink(false); }
      else { clearTimeout(timer); timer = setTimeout(tick, 600); }
    });

    blink(true);
    timer = setTimeout(tick, 1800);
  }

  /* ---------------------------------------------------------------------------
     4. NAVBAR: sahifa surilganda hairline paydo bo'ladi
     `scroll` hodisasi passive va `requestAnimationFrame` bilan siqiladi —
     har piksel uchun style yozish asosiy thread'ni bo'g'adi.
  ------------------------------------------------------------------------- */
  function initNav() {
    var nav = document.querySelector(".nav");
    if (!nav) return;
    var ticking = false;
    function apply() {
      nav.setAttribute("data-stuck", window.scrollY > 8 ? "true" : "false");
      ticking = false;
    }
    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(apply);
    }, { passive: true });
    apply();
  }

  /* ---------------------------------------------------------------------------
     4b. MOBIL MENYU
     Havolalar ro'yxati NUSXALANMAYDI — ayni `nav` element tor ekranda
     ochiluvchi panelga aylanadi. Shuning uchun holat `hidden` bilan emas,
     `data-open` bilan boshqariladi: `hidden` desktopda ham yashirib qo'yardi.
  ------------------------------------------------------------------------- */
  function initMenu() {
    var btn = document.getElementById("navToggle");
    var panel = document.getElementById("navLinks");
    if (!btn || !panel) return;

    function setOpen(open) {
      panel.setAttribute("data-open", open ? "true" : "false");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      btn.setAttribute("aria-label", open ? "Menyuni yopish" : "Menyuni ochish");
    }

    btn.addEventListener("click", function () {
      setOpen(panel.getAttribute("data-open") !== "true");
    });

    // Havolaga bosilganda panel ochiq qolmasin — sahifa ichida siljiydi,
    // panel esa maqsad joyni yopib turadi.
    panel.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape" || panel.getAttribute("data-open") !== "true") return;
      setOpen(false);
      btn.focus();
    });

    document.addEventListener("pointerdown", function (e) {
      if (panel.getAttribute("data-open") !== "true") return;
      if (panel.contains(e.target) || btn.contains(e.target)) return;
      setOpen(false);
    });

    // Ekran kengaysa panel desktop qatoriga qaytadi; holat "yopiq" ga
    // qaytarilmasa, keyin torayganda menyu o'z-o'zidan ochiq chiqadi.
    var wide = window.matchMedia("(min-width: 881px)");
    onMedia(wide, function (e) { if (e.matches) setOpen(false); });
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
      var label = theme === "dark" ? "Yorug‘ mavzuga o‘tish" : "Qorong‘i mavzuga o‘tish";
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
            if (window.omToast) window.omToast("Mavzu tanlovi bu brauzerda saqlanmaydi");
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

  /* Har qadam alohida o'raladi: ilgari `initTheme` dagi bitta xato
     `initReveal` ni ham olib ketardi va sahifa bo'm-bo'sh qolardi. */
  function boot() {
    var revealOk = false;
    [initTheme, initStagger, initReveal, initTypewriter, initNav, initMenu]
      .forEach(function (step) {
        try {
          step();
          if (step === initReveal) revealOk = true;
        } catch (e) {
          console.error("[motion] " + (step.name || "step") + " ishlamadi", e);
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
