/* =============================================================================
   «YETKAZISH MA'LUMOTLARI» VARIANTLARI — fragmentlarni yuklab sahnaga qo'yadi.

   `variants.js` bilan bir xil yuklash mexanikasi (`innerHTML` qo'ygan
   `<script>` ishga tushmaydi — nusxasi yaratiladi), lekin natija boshqacha:
   bu yerda fragment hodisa CHIQARMAYDI, aksincha ma'lumotni QABUL qiladi.
   Uch holat bitta joydan beriladi, ya'ni sakkizta variant ekranda ayni bir
   xil faktni ko'rsatishi tuzilish darajasida kafolatlangan.
   ========================================================================== */
(function () {
  "use strict";

  var FILES = [
    "y1-varaqa", "y2-marshrut", "y3-plita", "y4-raqamli",
    "y5-yorliq", "y6-kalendar", "y7-jumla", "y8-chek"
  ];

  /* Uch holat. Variantlar ayni shu yerda ajraladi: biri to'la ma'lumotda
     chiroyli, lekin bo'sh holatda quruq quti bo'lib qoladi. */
  var STATES = [
    {
      id: "toliq", label: "To‘liq",
      note: "Respublika bo‘yicha, takroriy jadval, ikkita ilova — ustunning eng og‘ir holati.",
      data: {
        reach: "35.1M",
        path: ["O‘zbekiston Respublikasi"],
        when: "repeat",
        whenLine: "Har dushanba va payshanba, soat 09:00",
        runs: [
          { iso: "2026-09-03", day: "payshanba", time: "09:00", dd: "03", mon: "sen" },
          { iso: "2026-09-07", day: "dushanba",  time: "09:00", dd: "07", mon: "sen" },
          { iso: "2026-09-10", day: "payshanba", time: "09:00", dd: "10", mon: "sen" }
        ],
        files: ["suv-jadval.pdf", "chilonzor-xarita.png"]
      }
    },
    {
      id: "tor", label: "Tor qamrov",
      note: "Bitta mahalla, «hoziroq» yuborish, ilovasiz — qiymatlar qisqa, blok bo‘shab qoladimi?",
      data: {
        /* Ming ajratkichi — uzilmas probel: oddiy probelda «~3» bilan «400»
           tor ustunda ikki qatorga bo'linib ketardi. */
        reach: "3\u00a0400",
        path: ["Toshkent shahri", "Chilonzor tumani", "Oqtepa MFY"],
        when: "now",
        whenLine: "Navbatga qo‘yilgan zahoti",
        runs: [{ iso: null, day: "hoziroq", time: null, dd: null, mon: null }],
        files: []
      }
    },
    {
      id: "bosh", label: "Bo‘sh",
      note: "Hech narsa tanlanmagan. Variant shu yerda NIMA deyishini ko‘ring — «—» yetarli emas.",
      data: {
        reach: null,
        path: null,
        when: "none",
        whenLine: null,
        runs: [],
        files: []
      }
    }
  ];

  var WIDTHS = [
    { id: "column", label: "Ustun · 340px", note: "Kompozitordagi haqiqiy kenglik (1440px da)." },
    { id: "full",   label: "Kenglik bo‘ylab", note: "Mobil taxlanish — ustun telefon ko‘rinishi ostiga tushadi." }
  ];

  var THEMES = [
    { id: "light", label: "Yorug‘" },
    { id: "dark",  label: "Qorong‘i" }
  ];

  var host = document.getElementById("yxList");
  var index = document.getElementById("yxIndex");
  if (!host || !index) return;

  var current = { state: STATES[0], width: WIDTHS[0], theme: THEMES[0] };
  var stages = [];

  /* --- fragment meta (izoh blokidan) ------------------------------------- */
  function readMeta(text) {
    var meta = {};
    var block = text.match(/<!--([\s\S]*?)-->/);
    if (!block) return meta;
    var head = block[1];
    ["name", "idea", "best", "cost"].forEach(function (key) {
      var m = head.match(new RegExp("@" + key + ":([\\s\\S]*?)(?=\\s@[a-z]+:|$)", "i"));
      if (m) meta[key] = m[1].replace(/\s+/g, " ").trim();
    });
    return meta;
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function failCard(slug, why) {
    var box = el("div", "vx-fail");
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 20 20");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "1.6");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("aria-hidden", "true");
    svg.innerHTML = '<path d="M10 3 1.8 17h16.4L10 3Z"/><path d="M10 8v4M10 15h.01"/>';
    box.appendChild(svg);
    var body = el("div");
    body.appendChild(el("b", null, "Variant yuklanmadi"));
    body.appendChild(document.createElement("br"));
    body.appendChild(el("code", null, "design/yetkazish/" + slug + ".html"));
    body.appendChild(document.createTextNode(" — " + why));
    box.appendChild(body);
    return box;
  }

  /* Inline skript SINXRON bajariladi, lekin ichidagi xato spetsifikatsiya
     bo'yicha `window.onerror` ga beriladi — `try/catch` ushlamaydi. */
  function runScripts(scope) {
    var caught = null;
    function onErr(e) { caught = caught || (e.message || "skriptda xato"); }
    window.addEventListener("error", onErr, true);
    try {
      scope.querySelectorAll("script").forEach(function (old) {
        var fresh = document.createElement("script");
        for (var i = 0; i < old.attributes.length; i++) {
          fresh.setAttribute(old.attributes[i].name, old.attributes[i].value);
        }
        fresh.textContent = old.textContent;
        old.replaceWith(fresh);
      });
    } finally {
      window.removeEventListener("error", onErr, true);
    }
    return caught;
  }

  /* HTTP 200 yetarli emas: bo'sh tana ham 200 bilan keladi. */
  function mountedOk(mount) {
    var root = mount.querySelector("[data-variant]");
    if (!root) return "javob fragment emas (data-variant topilmadi)";
    if (!root.querySelector("*")) return "fragment bo‘sh keldi";
    return null;
  }

  /* --- global boshqaruvlar ------------------------------------------------ */
  function segRow(container, items, pick, onPick) {
    container.innerHTML = "";
    items.forEach(function (it) {
      var b = el("button", "yx-seg", it.label);
      b.type = "button";
      b.setAttribute("aria-pressed", it.id === pick.id ? "true" : "false");
      b.addEventListener("click", function () {
        onPick(it);
        [].forEach.call(container.children, function (c) {
          c.setAttribute("aria-pressed", c === b ? "true" : "false");
        });
      });
      container.appendChild(b);
    });
  }

  /* Ma'lumot fragmentga O'Z ildizi orqali beriladi — global hodisa yo'q,
     ya'ni bir variant ikkinchisini eshitib qolmaydi. */
  function pushData() {
    stages.forEach(function (st) {
      st.stage.setAttribute("data-width", current.width.id);
      st.stage.setAttribute("data-theme", current.theme.id);
      if (st.root) {
        st.root.dispatchEvent(new CustomEvent("om:data", {
          detail: JSON.parse(JSON.stringify(current.state.data))
        }));
      }
    });
  }

  function buildControls() {
    var row = document.getElementById("yxStateRow");
    var note = document.getElementById("yxStateNote");
    if (!row) return;

    var wrap = el("div", "yx-state-row");
    row.replaceWith(wrap);
    wrap.id = "yxStateRow";

    function refreshNote() {
      if (note) note.textContent = current.state.note + " · " + current.width.note;
    }

    segRow(wrap, STATES, current.state, function (it) {
      current.state = it; refreshNote(); pushData();
    });

    var row2 = el("div", "yx-state-row");
    segRow(row2, WIDTHS, current.width, function (it) {
      current.width = it; refreshNote(); pushData();
    });
    wrap.after(row2);

    var row3 = el("div", "yx-state-row");
    segRow(row3, THEMES, current.theme, function (it) {
      current.theme = it; pushData();
    });
    row2.after(row3);

    refreshNote();
  }

  /* --- karta -------------------------------------------------------------- */
  function render(slug, text, order) {
    var meta = readMeta(text);
    var card = el("article", "vx-card");
    card.id = "yx-" + slug;

    var head = el("div", "vx-card-head");
    head.appendChild(el("span", "vx-num", String(order + 1).padStart(2, "0")));
    head.appendChild(el("h2", "vx-name", meta.name || slug));
    card.appendChild(head);

    if (meta.idea) card.appendChild(el("p", "vx-idea", meta.idea));

    if (meta.best || meta.cost) {
      var notes = el("div", "vx-notes");
      [["Kuchi", meta.best], ["Narxi", meta.cost]].forEach(function (pair) {
        if (!pair[1]) return;
        var dl = el("dl", "vx-note");
        dl.appendChild(el("dt", null, pair[0]));
        dl.appendChild(el("dd", null, pair[1]));
        notes.appendChild(dl);
      });
      card.appendChild(notes);
    }

    var stage = el("div", "yx-stage");
    stage.setAttribute("data-width", current.width.id);
    stage.setAttribute("data-theme", current.theme.id);
    stage.innerHTML = text.replace(/<!--[\s\S]*?-->/, "");
    card.appendChild(stage);
    host.appendChild(card);

    var thrown = runScripts(stage);
    var why = thrown ? ("skript otildi: " + thrown) : mountedOk(stage);
    if (why) {
      stage.innerHTML = "";
      stage.removeAttribute("data-theme");
      stage.appendChild(failCard(slug, why));
      return false;
    }

    stages.push({ stage: stage, root: stage.querySelector("[data-variant]") });

    var jump = el("a", "vx-jump");
    jump.href = "#yx-" + slug;
    jump.appendChild(el("b", null, String(order + 1).padStart(2, "0")));
    jump.appendChild(document.createTextNode(meta.name || slug));
    index.appendChild(jump);
    return true;
  }

  function markCurrent() {
    var links = [].slice.call(index.querySelectorAll(".vx-jump"));
    var cards = [].slice.call(host.querySelectorAll(".vx-card"));
    if (!("IntersectionObserver" in window) || !cards.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var i = cards.indexOf(en.target);
        links.forEach(function (l, k) { l.setAttribute("aria-current", k === i ? "true" : "false"); });
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    cards.forEach(function (c) { io.observe(c); });
  }

  buildControls();

  var loaded = 0;
  var chain = Promise.resolve();
  FILES.forEach(function (slug, i) {
    chain = chain.then(function () {
      return fetch("design/yetkazish/" + slug + ".html", { cache: "no-store" })
        .then(function (r) {
          if (!r.ok) throw new Error("HTTP " + r.status);
          return r.text();
        })
        .then(function (text) { if (render(slug, text, i)) loaded++; })
        .catch(function (err) {
          var card = el("article", "vx-card");
          card.id = "yx-" + slug;
          var h = el("div", "vx-card-head");
          h.appendChild(el("span", "vx-num", String(i + 1).padStart(2, "0")));
          h.appendChild(el("h2", "vx-name", slug));
          card.appendChild(h);
          card.appendChild(failCard(slug, String(err.message || err)));
          host.appendChild(card);
          console.error("[yetkazish] " + slug + " yuklanmadi", err);
        });
    });
  });

  chain.then(function () {
    markCurrent();
    pushData();
    var status = document.getElementById("yxStatus");
    if (status) {
      status.textContent = loaded === FILES.length
        ? loaded + " ta variant yuklandi"
        : loaded + "/" + FILES.length + " variant yuklandi — qolgani topilmadi";
      status.setAttribute("data-tone", loaded === FILES.length ? "ok" : "warn");
    }
  });
})();
