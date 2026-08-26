/* =============================================================================
   VARIANTLAR SAHIFASI — fragmentlarni yuklab, o'z qutisiga o'rnatadi.

   Fragment — mustaqil HTML bo'lak: markup + style + script. `innerHTML`
   bilan qo'yilgan `<script>` ISHGA TUSHMAYDI (HTML spetsifikatsiyasi),
   shuning uchun har skript qayta yaratiladi.
   ========================================================================== */
(function () {
  "use strict";

  var FILES = [
    "v1-narvon", "v2-qidiruv", "v3-tezkor", "v4-xarita",
    "v5-ustunlar", "v6-savat", "v7-bosqich", "v8-qamrov-tarozi"
  ];

  var host = document.getElementById("vxList");
  var index = document.getElementById("vxIndex");
  if (!host || !index) return;

  /* Fragment boshidagi izohdan metama'lumot: @name / @idea / @best / @cost

     Avval BIRINCHI izoh blokining ichi ajratiladi, keyin kalitlar faqat
     shu ichkarida qidiriladi. Ilgari qidiruv butun matnda ketardi va
     izoh oxiri qatorning O'RTASIDA tugasa (`--> <section ...`) oxirgi
     kalit butun fragment kodini yutib yuborardi. */
  function readMeta(text) {
    var meta = {};
    var block = text.match(/<!--([\s\S]*?)-->/);
    if (!block) return meta;
    var head = block[1];
    ["name", "idea", "best", "cost"].forEach(function (key) {
      var m = head.match(new RegExp("@" + key + ":([\\s\\S]*?)(?=@(?:name|idea|best|cost):|$)"));
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

  function icon(paths) {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 20 20");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "1.6");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("aria-hidden", "true");
    svg.innerHTML = paths;
    return svg;
  }

  function failCard(slug, why) {
    var box = el("div", "vx-fail");
    box.appendChild(icon('<path d="M10 3 1.8 17h16.4L10 3Z"/><path d="M10 8v4M10 15h.01"/>'));
    var body = el("div");
    body.appendChild(el("b", null, "Variant yuklanmadi"));
    body.appendChild(document.createElement("br"));
    var code = el("code", null, "design/variants/" + slug + ".html");
    body.appendChild(code);
    body.appendChild(document.createTextNode(" — " + why));
    box.appendChild(body);
    return box;
  }

  /* `innerHTML` qo'ygan skript ishga tushmaydi — nusxasini yaratamiz.
     Xatoni yutmaymiz: buzuq fragment jimgina "bo'sh quti" bo'lib
     qolsa, uning o'rniga sabab ko'rsatiladi. */
  function runScripts(scope, slug) {
    var ok = true;
    scope.querySelectorAll("script").forEach(function (old) {
      var fresh = document.createElement("script");
      for (var i = 0; i < old.attributes.length; i++) {
        fresh.setAttribute(old.attributes[i].name, old.attributes[i].value);
      }
      fresh.textContent = old.textContent;
      try {
        old.replaceWith(fresh);
      } catch (e) {
        ok = false;
        console.error("[variants] " + slug + " skripti ishlamadi", e);
      }
    });
    return ok;
  }

  function render(slug, text, order) {
    var meta = readMeta(text);
    var card = el("article", "vx-card");
    card.id = "vx-" + slug;

    var head = el("div", "vx-card-head");
    head.appendChild(el("span", "vx-num", String(order + 1).padStart(2, "0")));
    var h2 = el("h2", "vx-name", meta.name || slug);
    head.appendChild(h2);
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

    var mount = el("div", "vx-mount");
    mount.innerHTML = text.replace(/<!--[\s\S]*?-->/, "");
    card.appendChild(mount);

    // Fragment chiqargan hodisa — ekranda ko'rinayotgan narsaning o'lchovi
    var out = el("div", "vx-out");
    out.setAttribute("data-empty", "true");
    out.appendChild(el("span", "vx-out-label", "Natija"));
    var body = el("div", "vx-out-body", "hali tanlanmadi");
    body.setAttribute("aria-live", "polite");
    out.appendChild(body);
    card.appendChild(out);

    host.appendChild(card);

    if (!runScripts(mount, slug)) {
      mount.appendChild(failCard(slug, "skriptida xato bor, konsolga qarang"));
    }

    mount.addEventListener("scopechange", function (e) {
      var d = e.detail || {};
      var parts = [
        "level=" + (d.level == null ? "—" : d.level),
        "region=" + (d.region == null ? "—" : d.region),
        "district=" + (d.district == null ? "—" : d.district),
        "mahalla=" + (d.mahalla == null ? "—" : d.mahalla),
        "reach=" + (d.reach == null ? "—" : "~" + d.reach)
      ];
      /* Ko'p tanlovli variant bitta manzilga sig'maydi: u pog'onalarni
         ataylab bo'sh qoldirib, to'liq holatni `items` da beradi. Buni
         ko'rsatmasak, variant ekranda savat to'la turganda ham «hech nima
         tanlanmagan» deb ko'ringan bo'lardi. */
      if (d.items && d.items.length) {
        parts.push("items=" + d.items.length);
        var lines = d.items.map(function (it) {
          var path = [it.region, it.district, it.mahalla].filter(Boolean).join(" · ") || "O‘zbekiston Respublikasi";
          return "  " + (it.counted === false ? "(sanalmaydi) " : "") + path +
                 " · " + it.level + (it.reach == null ? "" : " · ~" + it.reach);
        });
        body.textContent = parts.join("  ·  ") + "\n" + lines.join("\n");
        body.style.whiteSpace = "pre";
      } else {
        body.textContent = parts.join("  ·  ");
        body.style.whiteSpace = "";
      }
      out.setAttribute("data-empty", "false");
    });

    var jump = el("a", "vx-jump");
    jump.href = "#vx-" + slug;
    jump.appendChild(el("b", null, String(order + 1).padStart(2, "0")));
    jump.appendChild(document.createTextNode(meta.name || slug));
    index.appendChild(jump);
  }

  function markCurrent() {
    var links = [].slice.call(index.querySelectorAll(".vx-jump"));
    var cards = [].slice.call(host.querySelectorAll(".vx-card"));
    if (!("IntersectionObserver" in window) || !cards.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var i = cards.indexOf(en.target);
        links.forEach(function (l, k) {
          l.setAttribute("aria-current", k === i ? "true" : "false");
        });
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    cards.forEach(function (c) { io.observe(c); });
  }

  var loaded = 0;
  var chain = Promise.resolve();
  FILES.forEach(function (slug, i) {
    chain = chain.then(function () {
      // Ketma-ket: fragmentlar bir-biriga bog'liq emas, lekin tartib
      // saqlanishi kerak (raqamlar sahifada aralashib ketmasin).
      return fetch("design/variants/" + slug + ".html", { cache: "no-store" })
        .then(function (r) {
          if (!r.ok) throw new Error("HTTP " + r.status);
          return r.text();
        })
        .then(function (text) { render(slug, text, i); loaded++; })
        .catch(function (err) {
          var card = el("article", "vx-card");
          card.id = "vx-" + slug;
          var head = el("div", "vx-card-head");
          head.appendChild(el("span", "vx-num", String(i + 1).padStart(2, "0")));
          head.appendChild(el("h2", "vx-name", slug));
          card.appendChild(head);
          card.appendChild(failCard(slug, String(err.message || err)));
          host.appendChild(card);
          console.error("[variants] " + slug + " yuklanmadi", err);
        });
    });
  });

  chain.then(function () {
    markCurrent();
    var status = document.getElementById("vxStatus");
    if (status) {
      status.textContent = loaded === FILES.length
        ? loaded + " ta variant yuklandi"
        : loaded + "/" + FILES.length + " variant yuklandi — qolgani topilmadi";
      status.setAttribute("data-tone", loaded === FILES.length ? "ok" : "warn");
    }
  });
})();
