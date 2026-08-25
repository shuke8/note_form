/* =============================================================================
   KOMPOZITOR — forma mantiqi
   Server yo'q. Shuning uchun "Navbatga qo'yish" HECH QACHON yuborildi
   demaydi: u ogohlantirish bannerli demo panelini ochadi va reestr raqamini
   O'YLAB TOPMAYDI — raqamni faqat server beradi.
   ========================================================================== */
(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };
  var GEO = window.OM_GEO || {};
  var TEMPLATES = window.OM_TEMPLATES || {};

  /* Push bildirishnomasi ko'rsatadigan chegara. Sarlavha bir qator,
     matn ikki qator — o'rtacha qurilmada shuncha belgi sig'adi. */
  var LIMIT = { title: 60, body: 180 };

  var state = {
    scope: null,          // republic | region | district | mahalla
    region: "", district: "", mahalla: "",
    when: "now",
    days: [],
    files: [],
    previewLang: "uz",
    submitted: false      // tekshiruv xatolari faqat urinishdan keyin ko'rinadi
  };

  /* ---------------------------------------------------------------------------
     RADIOGROUP — o'q tugmalar bilan yurish, roving tabindex.
     `role="radio"` va'da bergan xulqni bermasak, klaviatura foydalanuvchisi
     guruh ichida qamalib qoladi.
  ------------------------------------------------------------------------- */
  function wireRadioGroup(group, onSelect) {
    var items = Array.prototype.slice.call(group.querySelectorAll('[role="radio"]'));
    if (!items.length) return;

    function focusIndex(i) {
      var next = items[(i + items.length) % items.length];
      select(next);
      next.focus();
    }
    function select(el) {
      items.forEach(function (it) {
        var on = it === el;
        it.setAttribute("aria-checked", on ? "true" : "false");
        it.tabIndex = on ? 0 : -1;
      });
      onSelect(el);
    }
    function syncTabStops() {
      var checked = items.filter(function (i) { return i.getAttribute("aria-checked") === "true"; })[0];
      items.forEach(function (it) { it.tabIndex = it === (checked || items[0]) ? 0 : -1; });
    }

    items.forEach(function (item, i) {
      item.addEventListener("click", function () { select(item); });
      item.addEventListener("keydown", function (e) {
        if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); focusIndex(i + 1); }
        else if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); focusIndex(i - 1); }
        else if (e.key === " " || e.key === "Enter") { e.preventDefault(); select(item); }
      });
    });
    syncTabStops();
  }

  /* ---------------------------------------------------------------------------
     01 QAMROV
  ------------------------------------------------------------------------- */
  var LEVEL_LABEL = { republic: "Respublika", region: "Viloyat", district: "Tuman", mahalla: "Mahalla" };

  function fillSelect(sel, items, placeholder) {
    sel.innerHTML = "";
    var opt = document.createElement("option");
    opt.value = ""; opt.textContent = placeholder;
    sel.appendChild(opt);
    items.forEach(function (name) {
      var o = document.createElement("option");
      o.value = name; o.textContent = name;
      sel.appendChild(o);
    });
  }

  function initScope() {
    fillSelect($("fRegion"), Object.keys(GEO), "Viloyatni tanlang");

    wireRadioGroup($("scopeGroup"), function (el) {
      state.scope = el.getAttribute("data-scope");
      state.region = state.district = state.mahalla = "";
      $("fRegion").value = ""; $("fDistrict").value = ""; $("fMahalla").value = "";
      $("fDistrict").disabled = true; $("fMahalla").disabled = true;

      var needsGeo = state.scope !== "republic";
      $("cascade").hidden = !needsGeo;
      $("wrapDistrict").hidden = state.scope === "region";
      $("wrapMahalla").hidden = state.scope !== "mahalla";
      $("scopeError").hidden = true;
      refresh();
    });

    $("fRegion").addEventListener("change", function () {
      state.region = this.value;
      state.district = state.mahalla = "";
      var d = $("fDistrict");
      if (state.region && GEO[state.region]) {
        fillSelect(d, Object.keys(GEO[state.region].districts), "Tumanni tanlang");
        d.disabled = false;
      } else {
        fillSelect(d, [], "Avval viloyatni tanlang");
        d.disabled = true;
      }
      $("fMahalla").disabled = true;
      fillSelect($("fMahalla"), [], "Avval tumanni tanlang");
      refresh();
    });

    $("fDistrict").addEventListener("change", function () {
      state.district = this.value;
      state.mahalla = "";
      var m = $("fMahalla");
      if (state.region && state.district) {
        fillSelect(m, GEO[state.region].districts[state.district] || [], "Mahallani tanlang");
        m.disabled = false;
      } else {
        fillSelect(m, [], "Avval tumanni tanlang");
        m.disabled = true;
      }
      refresh();
    });

    $("fMahalla").addEventListener("change", function () {
      state.mahalla = this.value;
      refresh();
    });
  }

  function scopePathText() {
    if (!state.scope) return null;
    if (state.scope === "republic") return ["O‘zbekiston Respublikasi"];
    var parts = [];
    if (state.region) parts.push(state.region);
    if (state.scope !== "region" && state.district) parts.push(state.district);
    if (state.scope === "mahalla" && state.mahalla) parts.push(state.mahalla);
    return parts.length ? parts : null;
  }

  function scopeReachText() {
    var checked = $("scopeGroup").querySelector('[aria-checked="true"]');
    return checked ? checked.getAttribute("data-reach") : null;
  }

  /* ---------------------------------------------------------------------------
     02 MATN
  ------------------------------------------------------------------------- */
  var TEXT_FIELDS = [
    { id: "uzTitle", count: "uzTitleCount", limit: LIMIT.title },
    { id: "uzBody",  count: "uzBodyCount",  limit: LIMIT.body },
    { id: "ruTitle", count: "ruTitleCount", limit: LIMIT.title },
    { id: "ruBody",  count: "ruBodyCount",  limit: LIMIT.body }
  ];

  function initText() {
    TEXT_FIELDS.forEach(function (f) {
      $(f.id).addEventListener("input", function () {
        // Matn qo'lda o'zgargach ssenariy tugmasi bosilgan bo'lib
        // qolmasin: ekran endi o'sha ssenariyni ko'rsatmayapti.
        document.querySelectorAll('[data-tpl][aria-pressed="true"]').forEach(function (b) {
          b.setAttribute("aria-pressed", "false");
        });
        refresh();
      });
    });

    document.querySelectorAll("[data-tpl]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var t = TEMPLATES[btn.getAttribute("data-tpl")];
        if (!t) return;
        var replacing = TEXT_FIELDS.some(function (f) { return $(f.id).value.trim(); });
        if (replacing && !window.confirm("Yozilgan matn ssenariy matni bilan almashtiriladi. Davom etamizmi?")) return;
        $("uzTitle").value = t.uzTitle; $("uzBody").value = t.uzBody;
        $("ruTitle").value = t.ruTitle; $("ruBody").value = t.ruBody;
        document.querySelectorAll("[data-tpl]").forEach(function (b) {
          b.setAttribute("aria-pressed", b === btn ? "true" : "false");
        });
        refresh();
        if (window.omToast) window.omToast("Ssenariy matni qo‘yildi — tahrirlashingiz mumkin");
      });
    });

    $("pvUz").addEventListener("click", function () { setPreviewLang("uz"); });
    $("pvRu").addEventListener("click", function () { setPreviewLang("ru"); });
  }

  function setPreviewLang(lang) {
    state.previewLang = lang;
    $("pvUz").setAttribute("aria-pressed", lang === "uz" ? "true" : "false");
    $("pvRu").setAttribute("aria-pressed", lang === "ru" ? "true" : "false");
    refresh();
  }

  function levelFor(len, limit) {
    if (len > limit) return "crit";
    if (len > limit * 0.85) return "warn";
    return "ok";
  }

  /* ---------------------------------------------------------------------------
     03 VAQT
  ------------------------------------------------------------------------- */
  function initWhen() {
    wireRadioGroup($("whenGroup"), function (el) {
      state.when = el.getAttribute("data-when");
      $("whenLater").hidden = state.when !== "later";
      $("whenRepeat").hidden = state.when !== "repeat";
      refresh();
    });

    $("dayRow").querySelectorAll("[data-day]").forEach(function (chip) {
      chip.addEventListener("click", function () {
        var day = chip.getAttribute("data-day");
        var on = chip.getAttribute("aria-pressed") === "true";
        chip.setAttribute("aria-pressed", on ? "false" : "true");
        // `aria-pressed` toggle tugmasi — `aria-checked` emas: bir nechta
        // kun birga tanlanadi, bu radiogroup emas.
        chip.setAttribute("aria-checked", on ? "false" : "true");
        state.days = on ? state.days.filter(function (d) { return d !== day; }) : state.days.concat(day);
        refresh();
      });
    });

    ["fDate", "fTime", "fRepeatTime"].forEach(function (id) {
      $(id).addEventListener("change", refresh);
    });

    // Eng erta sana — bugun: o'tgan kunga xabar rejalashtirib bo'lmaydi.
    var today = new Date();
    var iso = today.getFullYear() + "-" +
      String(today.getMonth() + 1).padStart(2, "0") + "-" +
      String(today.getDate()).padStart(2, "0");
    $("fDate").min = iso;
  }

  function whenText() {
    if (state.when === "now") return "Hoziroq";
    if (state.when === "later") {
      var d = $("fDate").value, t = $("fTime").value;
      return d && t ? d + " · " + t : "Sana tanlanmagan";
    }
    var names = { "1": "Du", "2": "Se", "3": "Ch", "4": "Pa", "5": "Ju", "6": "Sh", "0": "Ya" };
    if (!state.days.length) return "Kunlar tanlanmagan";
    var order = ["1", "2", "3", "4", "5", "6", "0"];
    var picked = order.filter(function (d) { return state.days.indexOf(d) > -1; });
    return picked.map(function (d) { return names[d]; }).join(", ") + " · " + $("fRepeatTime").value;
  }

  /* ---------------------------------------------------------------------------
     04 ILOVA
  ------------------------------------------------------------------------- */
  var MAX_FILES = 5, MAX_BYTES = 10 * 1024 * 1024;

  function initFiles() {
    var input = $("fFiles"), drop = $("drop");

    input.addEventListener("change", function () { addFiles(input.files); input.value = ""; });

    ["dragenter", "dragover"].forEach(function (ev) {
      drop.addEventListener(ev, function (e) { e.preventDefault(); drop.setAttribute("data-over", "true"); });
    });
    ["dragleave", "drop"].forEach(function (ev) {
      drop.addEventListener(ev, function (e) { e.preventDefault(); drop.setAttribute("data-over", "false"); });
    });
    drop.addEventListener("drop", function (e) {
      if (e.dataTransfer && e.dataTransfer.files) addFiles(e.dataTransfer.files);
    });
  }

  function addFiles(list) {
    var problems = [];
    Array.prototype.forEach.call(list, function (file) {
      if (state.files.length >= MAX_FILES) { problems.push("5 tadan ortiq fayl qo‘shib bo‘lmaydi"); return; }
      if (file.size > MAX_BYTES) { problems.push("“" + file.name + "” 10 MB dan katta"); return; }
      if (!/\.(pdf|jpe?g|png)$/i.test(file.name)) { problems.push("“" + file.name + "” — faqat PDF, JPG yoki PNG"); return; }
      state.files.push({ name: file.name, size: file.size });
    });
    var err = $("errFiles");
    if (problems.length) {
      err.textContent = problems[0];
      err.hidden = false;
    } else {
      err.hidden = true;
    }
    renderFiles();
    refresh();
  }

  function humanSize(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  }

  function renderFiles() {
    var host = $("fileList");
    host.innerHTML = "";
    host.hidden = state.files.length === 0;
    state.files.forEach(function (f, i) {
      var row = document.createElement("div");
      row.className = "file-row";
      row.innerHTML =
        '<span class="file-ico" aria-hidden="true">' +
          '<svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' +
          '<path d="M11.5 2H5.5A1.5 1.5 0 0 0 4 3.5v13A1.5 1.5 0 0 0 5.5 18h9a1.5 1.5 0 0 0 1.5-1.5V6.5L11.5 2Z"/><path d="M11.5 2v4.5H16"/></svg>' +
        "</span>" +
        '<span class="file-name"></span>' +
        '<span class="file-size"></span>';
      row.querySelector(".file-name").textContent = f.name;
      row.querySelector(".file-size").textContent = humanSize(f.size);

      var del = document.createElement("button");
      del.type = "button";
      del.className = "icon-btn";
      del.setAttribute("aria-label", "“" + f.name + "” faylini olib tashlash");
      del.innerHTML = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M6 6l8 8M14 6l-8 8"/></svg>';
      del.addEventListener("click", function () {
        state.files.splice(i, 1);
        renderFiles();
        refresh();
        if (window.omToast) window.omToast("Fayl olib tashlandi");
        // Fokus yo'qolmasin: ro'yxat bo'shasa tanlash tugmasiga qaytamiz.
        var next = $("fileList").querySelector(".icon-btn");
        (next || document.querySelector('label[for="fFiles"]')).focus();
      });
      row.appendChild(del);
      host.appendChild(row);
    });
  }

  /* ---------------------------------------------------------------------------
     TEKSHIRUV
     Xato matni MUAMMONI emas, NIMA QILISH KERAKLIGINI aytadi.
  ------------------------------------------------------------------------- */
  function validate() {
    var errors = [];

    if (!state.scope) errors.push({ el: $("scopeGroup").querySelector('[role="radio"]'), box: $("scopeError"), msg: null });

    if (state.scope && state.scope !== "republic") {
      if (!state.region) errors.push({ el: $("fRegion"), box: $("errRegion"), msg: "Viloyatni tanlang." });
      if (state.scope !== "region" && !state.district) errors.push({ el: $("fDistrict"), box: $("errDistrict"), msg: "Tumanni tanlang." });
      if (state.scope === "mahalla" && !state.mahalla) errors.push({ el: $("fMahalla"), box: $("errMahalla"), msg: "Mahallani tanlang." });
    }

    var textRules = [
      { id: "uzTitle", box: "errUzTitle", empty: "O‘zbekcha sarlavhani yozing.", limit: LIMIT.title, over: "Sarlavha bir qatorga sig‘maydi — {n} ta belgi ortiqcha." },
      { id: "uzBody",  box: "errUzBody",  empty: "O‘zbekcha matnni yozing.",     limit: LIMIT.body,  over: "Matn ikki qatorga sig‘maydi — {n} ta belgi ortiqcha." },
      { id: "ruTitle", box: "errRuTitle", empty: "Ruscha sarlavhani yozing.",    limit: LIMIT.title, over: "Sarlavha bir qatorga sig‘maydi — {n} ta belgi ortiqcha." },
      { id: "ruBody",  box: "errRuBody",  empty: "Ruscha matnni yozing.",        limit: LIMIT.body,  over: "Matn ikki qatorga sig‘maydi — {n} ta belgi ortiqcha." }
    ];
    textRules.forEach(function (r) {
      var v = $(r.id).value.trim();
      if (!v) errors.push({ el: $(r.id), box: $(r.box), msg: r.empty });
      else if (v.length > r.limit) errors.push({ el: $(r.id), box: $(r.box), msg: r.over.replace("{n}", v.length - r.limit) });
    });

    if (state.when === "later") {
      var date = $("fDate").value, time = $("fTime").value;
      if (!date) errors.push({ el: $("fDate"), box: $("errDate"), msg: "Yuborish sanasini tanlang." });
      if (!time) errors.push({ el: $("fTime"), box: $("errTime"), msg: "Yuborish vaqtini tanlang." });
      if (date && time) {
        // `min` atributi faqat tanlagichni cheklaydi — qo'lda yozilgan
        // yoki eski qoralamadan qolgan sanani u to'xtatmaydi.
        var when = new Date(date + "T" + time);
        if (!isNaN(when) && when.getTime() < Date.now()) {
          errors.push({ el: $("fDate"), box: $("errDate"), msg: "Bu vaqt allaqachon o'tib ketgan — kelgusi sana va vaqtni tanlang." });
        }
      }
    }
    if (state.when === "repeat" && !state.days.length) {
      errors.push({ el: $("dayRow").querySelector("[data-day]"), box: $("errDays"), msg: "Kamida bitta kunni tanlang." });
    }
    return errors;
  }

  function clearErrors() {
    document.querySelectorAll(".field-error").forEach(function (b) { if (b.id !== "errFiles") b.hidden = true; });
    document.querySelectorAll("[aria-invalid]").forEach(function (f) { f.removeAttribute("aria-invalid"); });
  }

  function showErrors(errors) {
    clearErrors();
    errors.forEach(function (e) {
      if (e.box) {
        if (e.msg) {
          e.box.textContent = "";
          var icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
          icon.setAttribute("viewBox", "0 0 16 16");
          icon.setAttribute("fill", "none");
          icon.setAttribute("stroke", "currentColor");
          icon.setAttribute("stroke-width", "1.6");
          icon.setAttribute("aria-hidden", "true");
          icon.innerHTML = '<circle cx="8" cy="8" r="6.5"/><path d="M8 5v3.6M8 11h.01" stroke-linecap="round"/>';
          e.box.appendChild(icon);
          e.box.appendChild(document.createTextNode(e.msg));
        }
        e.box.hidden = false;
      }
      if (e.el && e.el.tagName !== "BUTTON") e.el.setAttribute("aria-invalid", "true");
    });
  }

  /* ---------------------------------------------------------------------------
     YANGILASH — bitta funksiya butun ko'rinishni state'dan qayta chizadi.
     Har boshqaruv o'z bo'lagini alohida yangilasa, ular vaqt o'tib
     bir-biridan uzilib qoladi.
  ------------------------------------------------------------------------- */
  function refresh() {
    // --- qamrov ---
    var path = scopePathText();
    var pathHost = $("scopePath");
    pathHost.innerHTML = "";
    if (!path) {
      pathHost.textContent = "Qamrov tanlanmagan";
      pathHost.style.color = "var(--ink-2)";
    } else {
      pathHost.style.color = "";
      path.forEach(function (p, i) {
        if (i) {
          var sep = document.createElement("span");
          sep.className = "sep"; sep.textContent = "·";
          pathHost.appendChild(sep);
        }
        var s = document.createElement("span");
        s.textContent = p;
        pathHost.appendChild(s);
      });
    }
    var reach = scopeReachText();
    $("scopeReach").textContent = reach ? "~" + reach + " aholi" : "— aholi";

    // --- matn hisoblagichlari ---
    TEXT_FIELDS.forEach(function (f) {
      var len = $(f.id).value.trim().length;
      var c = $(f.count);
      c.textContent = len + "/" + f.limit;
      c.setAttribute("data-level", levelFor(len, f.limit));
    });

    var uzOk = $("uzTitle").value.trim() && $("uzBody").value.trim();
    var ruOk = $("ruTitle").value.trim() && $("ruBody").value.trim();
    $("uzState").textContent = uzOk ? "To‘liq" : "To‘liq emas";
    $("ruState").textContent = ruOk ? "To‘liq" : "To‘liq emas";

    // --- ko'rinish ---
    var lang = state.previewLang;
    var title = $(lang + "Title").value.trim();
    var body = $(lang + "Body").value.trim();
    $("pvTitle").textContent = title;
    $("pvText").textContent = body;
    $("pvTime").textContent =
      state.when === "now"    ? "hozir" :
      state.when === "repeat" ? ($("fRepeatTime").value || "09:00")
                              : ($("fTime").value || "09:00");

    var fit = $("pvFit"), fitText = $("pvFitText");
    fit.className = "chip";
    if (!title && !body) {
      fit.classList.add("chip-mono"); fitText.textContent = "Matn kiritilmagan";
    } else if (title.length > LIMIT.title || body.length > LIMIT.body) {
      fit.classList.add("chip-crit"); fitText.textContent = "Matn kesiladi";
    } else if (title.length > LIMIT.title * 0.85 || body.length > LIMIT.body * 0.85) {
      fit.classList.add("chip-warn"); fitText.textContent = "Chegaraga yaqin";
    } else {
      fit.classList.add("chip-ok"); fitText.textContent = "To‘liq sig‘adi";
    }

    $("sideScope").textContent = path ? path[path.length - 1] : "—";
    $("sideReach").textContent = reach ? "~" + reach : "—";
    $("sideWhen").textContent = whenText();

    // --- yakun ---
    function setRecap(id, value, fallback) {
      var el = $(id);
      el.textContent = value || fallback;
      el.setAttribute("data-empty", value ? "false" : "true");
    }
    setRecap("rcScope", path ? path.join(" · ") : "", "tanlanmagan");
    setRecap("rcReach", reach ? "~" + reach : "", "—");
    setRecap("rcUz", $("uzTitle").value.trim(), "yozilmagan");
    setRecap("rcRu", $("ruTitle").value.trim(), "yozilmagan");
    $("rcWhen").textContent = whenText();
    setRecap("rcFiles", state.files.length ? state.files.length + " ta fayl" : "", "yo‘q");

    // --- holat qatori ---
    var errors = validate();
    var status = $("status"), text = $("statusText");
    if (!errors.length) {
      status.setAttribute("data-tone", "ok");
      text.textContent = "Hammasi to‘ldirilgan";
    } else {
      status.setAttribute("data-tone", state.submitted ? "crit" : "");
      text.textContent = errors.length + " ta maydon to‘ldirilishi kerak";
    }
    if (state.submitted) showErrors(errors);
    return errors;
  }

  /* ---------------------------------------------------------------------------
     YUBORISH — server yo'q, shuning uchun MUVAFFAQIYAT DA'VO QILINMAYDI.
  ------------------------------------------------------------------------- */
  function initSubmit() {
    $("submitBtn").addEventListener("click", function () {
      state.submitted = true;
      var errors = refresh();
      if (errors.length) {
        var first = errors[0].el;
        if (first) { first.focus(); first.scrollIntoView({ block: "center", behavior: "smooth" }); }
        if (window.omToast) window.omToast(errors.length + " ta maydon to‘ldirilmagan");
        return;
      }
      runSubmit();
    });

    $("resetBtn").addEventListener("click", function () {
      if (!window.confirm("Barcha kiritilgan ma’lumot o‘chiriladi. Davom etamizmi?")) return;
      window.location.reload();
    });
  }

  function runSubmit() {
    var btn = $("submitBtn"), label = $("submitLabel");
    btn.setAttribute("aria-busy", "true");
    btn.disabled = true;
    var original = label.textContent;
    label.textContent = "Tekshirilmoqda";
    var spin = document.createElement("span");
    spin.className = "spinner";
    btn.insertBefore(spin, label);

    // Bu kechikish TAQLID emas, tekshiruvning ko'rinadigan bosqichi:
    // tugma darhol "tayyor" bo'lib qolsa, bosildimi-yo'qmi bilinmaydi.
    setTimeout(function () {
      spin.remove();
      label.textContent = original;
      btn.removeAttribute("aria-busy");
      btn.disabled = false;
      renderDemoResult();
      $("resultSlot").scrollIntoView({ block: "center", behavior: "smooth" });
    }, 700);
  }

  function renderDemoResult() {
    var payload = {
      scope_level: state.scope,
      region: state.region || null,
      district: state.district || null,
      mahalla: state.mahalla || null,
      body: {
        uz: { title: $("uzTitle").value.trim(), text: $("uzBody").value.trim() },
        ru: { title: $("ruTitle").value.trim(), text: $("ruBody").value.trim() }
      },
      schedule: state.when === "now" ? { mode: "now" }
        : state.when === "later" ? { mode: "at", date: $("fDate").value, time: $("fTime").value }
        : { mode: "weekly", days: state.days.slice().sort(), time: $("fRepeatTime").value },
      attachments: state.files.map(function (f) { return f.name; })
    };

    var host = $("resultSlot");
    host.innerHTML = "";
    var box = document.createElement("div");
    box.className = "result";
    box.innerHTML =
      '<div class="result-head">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
          '<path d="M10.3 3.6 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/></svg>' +
        '<div>' +
          '<p class="result-title">Xabar YUBORILMADI — bu demo</p>' +
          '<p class="result-body">Bu sahifada server ulanmagan. Forma to‘g‘ri to‘ldirildi va quyidagi ' +
          'so‘rov tanasi yig‘ildi, lekin u hech qayerga ketmadi. Reestr raqami ham berilmadi — ' +
          'uni faqat server beradi.</p>' +
        "</div>" +
      "</div>" +
      '<div class="result-payload"><pre></pre></div>';
    box.querySelector("pre").textContent = JSON.stringify(payload, null, 2);
    host.appendChild(box);
    if (window.omToast) window.omToast("Demo: so‘rov tanasi yig‘ildi, yuborilmadi");
  }

  /* ------------------------------------------------------------------------ */
  function boot() {
    initScope();
    initText();
    initWhen();
    initFiles();
    initSubmit();
    refresh();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
