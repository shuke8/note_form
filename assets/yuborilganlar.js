/* =============================================================================
   YUBORILGAN XABARNOMALAR — ro'yxat sahifasi

   Bu sahifa `landing.html` dagi qisqa lentaning O'RNIGA keldi: lenta u yerda
   to'rtta kartadan iborat ko'rgazma edi, bu yerda esa ish qilinadigan ekran —
   qidiruv, turi va holati bo'yicha filtr, tartib va har yozuv ustidagi amallar.

   ⚠️ SERVER YO'Q. Shuning uchun:
   - yozuvlar ham, yetkazish sonlari ham NAMUNA va ekran buni ochiq aytadi;
   - serverga murojaat qiladigan amallar (to'xtatish, o'chirish, hisobot)
     O'CHIRILGAN holda turadi va sababi yonida yozilgan — bosilganda «bajarildi»
     deb yolg'on aytadigan tugma qo'yilmaydi;
   - «Nusxa olib tahrirlash» esa HAQIQATAN ishlaydi: u serverga tegmaydi,
     qoralamani `sessionStorage` ga yozib kompozitorni ochadi.
   ========================================================================== */
(function () {
  "use strict";

  var DRAFT_KEY = "om-draft";

  /* Qamrov sonlari `composer-data.js` dagi AYNAN o'sha qiymatlar — ikki
     ekranda ikki xil son chiqmasin. */
  var ITEMS = [
    {
      id: "suv", created: "2026-08-26 18:20", startedAt: "2026-08-27 07:10", runs: 1, kind: "once", status: "sent",
      title: "Suv ta’minoti 09:00–15:00 oralig‘ida to‘xtatiladi",
      uz: ["Suv ta’minoti vaqtincha to‘xtatiladi",
           "Ertaga soat 09:00 dan 15:00 gacha suv bo‘lmaydi. Zaxira suv g‘amlab qo‘ying."],
      ru: ["Временное отключение воды",
           "Завтра с 09:00 до 15:00 воды не будет. Запаситесь водой заранее."],
      scope: { region: "Xorazm viloyati", district: "Qo‘shko‘pir tumani", mahalla: "8-mahalla “Do‘stlik”" },
      reach: 2400, ok: 2381, fail: 19,
      sent: "2026-08-27 07:10",
      plan: "Hoziroq yuborilgan", next: null
    },
    {
      id: "elektr", created: "2026-08-25 09:15", startedAt: "2026-08-26 16:40", runs: 1, kind: "once", status: "sent",
      title: "Elektr tarmog‘ida ta’mirlash ishlari boshlanadi",
      uz: ["Elektr tarmog‘ida ta’mirlash",
           "Chorshanba kuni 10:00–16:00 oralig‘ida elektr uziladi. Ish tugagach darhol ulanadi."],
      ru: ["Ремонт электросети",
           "В среду с 10:00 до 16:00 электричество будет отключено. Подключение сразу после работ."],
      scope: { region: "Xorazm viloyati", district: "Qo‘shko‘pir tumani" },
      reach: 125000, ok: 123980, fail: 1020,
      sent: "2026-08-26 16:40",
      plan: "Belgilangan vaqtda yuborilgan", next: null
    },
    {
      id: "gaz", created: "2026-08-27 08:05", startedAt: "2026-08-27 08:40", runs: 1, kind: "once", status: "sending",
      title: "Tabiiy gaz bosimi vaqtincha pasayadi",
      uz: ["Gaz bosimi pasayadi",
           "Bugun 14:00 dan 18:00 gacha gaz bosimi past bo‘ladi. Isitish uskunalarini tekshiring."],
      ru: ["Давление газа снизится",
           "Сегодня с 14:00 до 18:00 давление газа будет пониженным. Проверьте отопительные приборы."],
      scope: { region: "Xorazm viloyati" },
      reach: 1900000, ok: 812400, fail: 6510,
      sent: "2026-08-27 08:40",
      plan: "Hoziroq yuborilgan", next: null
    },
    {
      id: "maktab", created: "2026-08-26 11:40", startedAt: null, runs: 0, kind: "once", status: "queued",
      title: "Maktablarda o‘quv yili 2-sentyabrda boshlanadi",
      uz: ["O‘quv yili 2-sentyabrda boshlanadi",
           "Birinchi qo‘ng‘iroq marosimi soat 08:00 da. Hujjatlarni oldindan topshiring."],
      ru: ["Учебный год начнётся 2 сентября",
           "Торжественная линейка в 08:00. Документы сдайте заранее."],
      scope: { region: "Xorazm viloyati", district: "Urganch shahri" },
      reach: 155000, ok: null, fail: null,
      /* Yuborilmagan yozuvda `sent` YO'Q — rejalashtirilgan sana sonlar
         tasmasida turadi. */
      sent: null,
      plan: "Belgilangan vaqt", next: "2026-08-28 08:00"
    },
    {
      id: "vaksina", created: "2026-08-20 10:30", startedAt: "2026-08-20 11:05", runs: 1, kind: "once", status: "failed",
      title: "Bepul vaksinatsiya punktlari ochildi",
      uz: ["Bepul vaksinatsiya",
           "Mahalla punktlarida bepul vaksinatsiya boshlandi. Pasport bilan keling."],
      ru: ["Бесплатная вакцинация",
           "В пунктах махалли началась бесплатная вакцинация. Приходите с паспортом."],
      scope: { region: "Xorazm viloyati", district: "Qo‘shko‘pir tumani", mahalla: "Yangiariq MFY" },
      reach: 1900, ok: 640, fail: 12,
      sent: "2026-08-20 11:05",
      plan: "Hoziroq yuborilgan", next: null,
      failWhy: "Tarqatish 34% da to‘xtadi — bildirishnoma xizmati javob bermadi."
    },
    {
      id: "yigin", created: "2026-06-12 14:00", startedAt: "2026-06-13 09:00", runs: 11, kind: "repeat", status: "sent",
      title: "Mahalla umumiy yig‘ini shanba kuni o‘tkaziladi",
      uz: ["Umumiy yig‘in — shanba, 15:00",
           "Mahalla markazida umumiy yig‘in bo‘ladi. Kun tartibi: obodonlashtirish va qish tayyorgarligi."],
      ru: ["Общее собрание — суббота, 15:00",
           "В центре махалли состоится общее собрание. Повестка: благоустройство и подготовка к зиме."],
      scope: { region: "Xorazm viloyati", district: "Qo‘shko‘pir tumani", mahalla: "8-mahalla “Do‘stlik”" },
      reach: 2400, ok: 2389, fail: 11,
      sent: "2026-08-22 09:00",
      plan: "Har shanba · 09:00 · to‘xtatilmaguncha", next: "2026-08-29 09:00"
    },
    {
      id: "korik", created: "2026-08-01 09:20", startedAt: "2026-08-03 09:00", runs: 7, kind: "repeat", status: "sent",
      title: "Bepul tibbiy ko‘rik jadvali e’lon qilindi",
      uz: ["Bepul tibbiy ko‘rik",
           "Sentyabr oyi davomida tumanlar bo‘ylab bepul ko‘rik o‘tkaziladi. Jadval mahalla punktlarida."],
      ru: ["Бесплатный медосмотр",
           "В течение сентября в районах пройдёт бесплатный медосмотр. Расписание — в пунктах махалли."],
      scope: { region: "Xorazm viloyati" },
      reach: 1900000, ok: 1884780, fail: 15220,
      sent: "2026-08-24 09:00",
      plan: "Har dushanba va payshanba · 09:00 · 2026-09-30 gacha", next: "2026-08-27 09:00"
    },
    {
      id: "suvhaq", created: "2026-01-15 10:00", startedAt: "2026-02-01 09:00", runs: 6, kind: "repeat", status: "stopped",
      title: "Suv haqi to‘lovi eslatmasi",
      uz: ["Suv haqi to‘lovini unutmang",
           "Har oyning 5-sanasigacha to‘lov qilinsa, jarima hisoblanmaydi."],
      ru: ["Не забудьте оплатить воду",
           "Если оплатить до 5 числа, пеня не начисляется."],
      scope: { region: "Xorazm viloyati", district: "Qo‘shko‘pir tumani" },
      reach: 125000, ok: 123110, fail: 1890,
      sent: "2026-07-30 09:00",
      plan: "Har oyning 1-sanasi · 09:00", next: null,
      stopWhy: "Operator to‘xtatgan — 2026-08-01."
    }
  ];

  /* Tur — IKONKA + matn, chipsiz. Ilgari u ham chip edi va holat chipi bilan
     yonma-yon turganda ikkalasi bir xil og'irlikda ko'rinardi: qaysi biri
     «bu nima» va qaysi biri «hozir qayerda» ekani ajralmasdi. Ikonka esa
     turni o'qimasdan ham aytadi — ↻ qaytadi, → bir marta ketadi. */
  var KIND = {
    once:   { label: "Bir martalik", icon: "i-arrow-right", note: "yuborilib bo‘lgan, qaytmaydi" },
    repeat: { label: "Davomiy",      icon: "i-repeat",      note: "jadval bo‘yicha qaytadi" }
  };
  /* Holat — NUQTALI chip. Fon hamma holatda neytral, rang faqat NUQTADA:
     to'rt xil rangli chip yonma-yon turganda ro'yxat svetofor bo'lib
     qolardi. Yagona istisno — xatolik: uni ko'rmay o'tib ketish mumkin
     emas, shuning uchun u to'liq bo'yaladi. */
  var STATUS = {
    sent:    { label: "Yuborildi",    tone: "ok" },
    sending: { label: "Yuborilmoqda", tone: "run" },
    queued:  { label: "Navbatda",     tone: "run" },
    stopped: { label: "To‘xtatilgan", tone: "off" },
    failed:  { label: "Xatolik",      tone: "crit" }
  };

  function tagsHtml(it) {
    var k = KIND[it.kind], st = STATUS[it.status];
    return '<span class="yb-tags">' +
      '<span class="kind-tag" data-kind="' + it.kind + '">' +
        '<svg class="ico" aria-hidden="true" focusable="false"><use href="#' + k.icon + '"/></svg>' +
        esc(k.label) +
      "</span>" +
      '<span class="yb-state" data-tone="' + st.tone + '">' +
        '<span class="dot" aria-hidden="true"></span>' + esc(st.label) +
      "</span>" +
    "</span>";
  }

  var KIND_TABS = [
    { id: "all", label: "Hammasi" },
    { id: "once", label: "Bir martalik" },
    { id: "repeat", label: "Davomiy" }
  ];
  var STATUS_TABS = [
    { id: "all", label: "Barcha holatlar" },
    { id: "sent", label: "Yuborildi" },
    { id: "sending", label: "Jarayonda" },
    { id: "queued", label: "Navbatda" },
    { id: "stopped", label: "To‘xtatilgan" },
    { id: "failed", label: "Xatolik" }
  ];

  var view = { kind: "all", status: "all", q: "", sort: "new" };
  /* Kirish animatsiyasi FAQAT birinchi chizishda. Filtr bosilganda ro'yxat
     qayta uchib kirsa, u tez-tez bajariladigan amalda charchatardi
     (interface-craft: 100+/kun amalda animatsiya yo'q). */
  var firstPaint = true;

  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  /* Uzilmas probel bilan guruhlash — oddiy probelda tor ustunda son ikkiga
     bo'linib ketardi. */
  function num(n) {
    return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  }
  function scopePath(sc) {
    return [sc.region, sc.district, sc.mahalla].filter(Boolean).join(" / ");
  }
  /* Tartiblash uchun sana. Yuborilmagan yozuvda `sent` yo'q — o'rniga
     REJALASHTIRILGAN sana olinadi, aks holda u ro'yxat tubiga tushib
     ketardi va operator uni ko'rmasdi. */
  function timeKey(it) {
    return (it.sent || it.next || "").replace(/[^0-9]/g, "");
  }

  /* --- filtr --------------------------------------------------------------- */
  function match(it) {
    if (view.kind !== "all" && it.kind !== view.kind) return false;
    if (view.status !== "all" && it.status !== view.status) return false;
    if (!view.q) return true;
    var hay = (it.title + " " + scopePath(it.scope) + " " +
               it.uz.join(" ") + " " + it.ru.join(" ")).toLowerCase();
    return hay.indexOf(view.q) >= 0;
  }
  function visible() {
    var list = ITEMS.filter(match);
    list.sort(function (a, b) {
      if (view.sort === "reach") return b.reach - a.reach;
      var d = timeKey(b).localeCompare(timeKey(a));
      return view.sort === "old" ? -d : d;
    });
    return list;
  }

  /* --- amallar ------------------------------------------------------------- */
  /* HAQIQATAN ishlaydigan yagona amal: serverga tegmaydi, qoralamani
     brauzerda qoldirib kompozitorni ochadi. */
  function duplicate(it) {
    var draft = {
      uzTitle: it.uz[0], uzBody: it.uz[1],
      ruTitle: it.ru[0], ruBody: it.ru[1],
      scope: it.scope
    };
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch (e) {
      /* Private rejimda `sessionStorage` otiladi — jim o'tib ketish
         «nusxa oldim» degan yolg'on bo'lardi. */
      if (window.omToast) window.omToast("Brauzer xotirasi yopiq — nusxa ko‘chirilmadi", "crit");
      return;
    }
    document.body.removeAttribute("data-modal");
    window.location.href = "./composer.html";
  }

  /* O'chirish — HAQIQATAN ishlaydi, lekin faqat shu brauzerda: `ITEMS` dan
     olib tashlanadi va ro'yxat qayta chiziladi. Server yo'q, shuning uchun
     sahifa yangilanganda yozuv qaytadi — ekran buni toastda ochiq aytadi.
     «O'chirildi» deb yozib, keyin qaytib kelishi jim yolg'on bo'lardi. */
  function removeRecord(it) {
    var i = ITEMS.indexOf(it);
    if (i < 0) return;
    ITEMS.splice(i, 1);
    $("ybDialog").close();
    summary();          // umumiy raqamlar ham o'zgaradi
    render();
    if (window.omToast) {
      window.omToast("Yozuv ro‘yxatdan olib tashlandi — faqat shu brauzerda; " +
                     "sahifa yangilanganda qaytadi", "ok");
    }
  }

  /* Ikki amal — shu yetadi. Ilgari bu yerda beshtagacha tugma turardi
     («To'xtatish», «Hisobot», «Navbatdan olish», «O'chirish» va nusxa
     olish); to'rttasi o'chirilgan holda turgani uchun qator amal qatoridan
     ko'ra ISHLAMAYDIGAN narsalar ro'yxatiga o'xshab qolgandi. */
  function actionRow(it) {
    var wrap = el("div", "yb-actions");

    /* Yorliq «Tahrirlash» EMAS: tugma yuborilgan xabarni o'zgartirmaydi,
       u matnni nusxalab YANGI xabar ochadi. Eski nom va'da berardi,
       vazifani esa faqat kompozitorda chiqadigan toast tushuntirardi —
       ya'ni haqiqat amal BAJARILGANDAN keyin aytilardi. */
    var edit = el("button", "btn btn-ghost btn-sm yb-act-main");
    edit.type = "button";
    edit.innerHTML = '<svg class="ico" aria-hidden="true" focusable="false"><use href="#i-file-text"/></svg>' +
                     "<span>Nusxa olib tahrirlash</span>";
    edit.addEventListener("click", function () { duplicate(it); });

    var del = el("button", "btn btn-ghost btn-sm yb-act-del");
    del.type = "button";
    del.innerHTML = '<svg class="ico" aria-hidden="true" focusable="false"><use href="#i-x"/></svg>' +
                    "<span>O‘chirish</span>";

    /* Izoh tugmalar bilan BIR QATORDA emas: u yerda u tugmalarning
       yorlig'i bo'lib ko'rinib, «O'chirish» ni o'chirilgan tugmaday
       ko'rsatardi. Endi u qatorning ostida, o'z qatorida. */
    var note = el("p", "yb-actions-why",
      "O‘chirish faqat shu brauzerda ishlaydi — server ulanmagan.");

    /* Tasdiq QATORNING O'ZIDA, `window.confirm` bilan emas: modal ichida
       brauzer oynasi ochilishi qatlamni ikkiga bo'lardi, qolaversa
       `confirm` matni tahrirlanmaydi va uslubga bo'ysunmaydi. */
    function askConfirm() {
      wrap.innerHTML = "";
      wrap.setAttribute("data-confirm", "true");

      var q = el("p", "yb-confirm-q", "Yozuv ro‘yxatdan olib tashlansinmi?");
      var yes = el("button", "btn btn-crit btn-sm");
      yes.type = "button";
      yes.innerHTML = '<svg class="ico" aria-hidden="true" focusable="false"><use href="#i-x"/></svg>' +
                      "<span>Ha, o‘chirish</span>";
      yes.addEventListener("click", function () { removeRecord(it); });

      var no = el("button", "btn btn-ghost btn-sm", "Bekor qilish");
      no.type = "button";
      no.addEventListener("click", function () {
        wrap.removeAttribute("data-confirm");
        build();
        /* Fokus «O'chirish» ga QAYTADI: bekor qilgandan keyin u `body` ga
           tushib, klaviatura foydalanuvchisi oyna boshidan yurishga majbur
           bo'lardi. */
        wrap.querySelector(".yb-act-del").focus();
      });

      wrap.appendChild(q);
      wrap.appendChild(yes);
      wrap.appendChild(no);
      yes.focus();
    }
    del.addEventListener("click", askConfirm);

    function build() {
      wrap.innerHTML = "";
      wrap.appendChild(edit);
      wrap.appendChild(del);
      wrap.appendChild(note);
    }
    build();
    return wrap;
  }

  /* --- karta --------------------------------------------------------------- */
  /* Yopiq qatorning O'ZI yozuv haqidagi to'rt savolga javob beradi: kimga,
     nechtasiga yetdi, nechtasiga yetmadi, qachon. Ilgari bu yerda faqat
     sarlavha va ikonka turardi — ikonka esa yangi ma'lumot bermasdi
     (sakkiz yozuvda olti xil rasm, hech biri holatni ham, turni ham
     aytmasdi), sonlarni ko'rish uchun esa har kartani ochish kerak edi. */
  /* --- Yetkazish bloki -------------------------------------------------------
     Ilgari bu yerda TO'RTTA teng plita turardi: qamrov · yetkazildi ·
     yetkazilmadi · keyingi yuborish. Uchta muammosi bor edi:

     1. To'rtinchi plita boshqa TURDAGI qiymat edi — uchtasi katta son,
        to'rtinchisi sana. Bir qatorda ikki xil o'lchov turgani uchun ko'z
        naqshni yo'qotardi.
     2. Uchta son bir-biriga BOG'LIQ (2 389 ning ~2 400 dan ekani), lekin
        ular alohida qutilarda turib, bu bog'liqlikni yashirardi. Eng
        muhim fakt — yetkazish ULUSHI — ekranda umuman yo'q edi, garchi
        uning ikkala qismi ham shu yerda turgan bo'lsa ham.
     3. «Taxminiy qamrov» yorlig'i ikki qatorga o'ralib, qo'shnilaridan
        baland bo'lib qolardi.

     Endi bitta blok: katta son, uning ostida ulush chizig'i va bir
     qatorli izoh. Sana esa quyidagi VAQT ro'yxatiga ko'chdi — u yerda
     qolgan sanalar bilan bir ustunda turadi. */
  function deliverBlock(it) {
    var started = it.ok != null;
    if (!started) {
      return '<div class="yb-deliver" data-empty="true">' +
        '<p class="eyebrow eyebrow-sm">Taxminiy qamrov</p>' +
        '<p class="yb-deliver-num">~' + num(it.reach) + '</p>' +
        '<p class="yb-deliver-foot"><span>Tarqatish hali boshlanmagan</span></p>' +
      "</div>";
    }
    /* Ulush PASTGA yaxlitlanadi: 99,95% ni «100%» deb ko'rsatish tugagan
       tarqatish degan yolg'on bo'lardi. */
    var pct = it.reach ? Math.floor((it.ok / it.reach) * 1000) / 10 : 0;
    if (pct > 100) pct = 100;
    /* Chiziq rangi HOLATDAN keladi: to'xtagan tarqatishning chizig'i brend
       ko'kida turishi «hammasi joyida» degan yolg'on signal bo'lardi.
       Xatolikda — qizil (bannerdagi sabab bilan bir xil rang), operator
       to'xtatganda — neytral. */
    var tone = it.status === "failed" ? "crit" : it.status === "stopped" ? "off" : "run";
    return '<div class="yb-deliver" data-tone="' + tone + '">' +
      '<div class="yb-deliver-head">' +
        '<div class="yb-deliver-main">' +
          '<p class="eyebrow eyebrow-sm">Yetkazildi</p>' +
          '<p class="yb-deliver-num">' + num(it.ok) +
            '<span class="yb-deliver-of">/ ~' + num(it.reach) + "</span></p>" +
        "</div>" +
        '<span class="yb-deliver-pct">' + String(pct).replace(".", ",") + "%</span>" +
      "</div>" +
      /* Chiziq DEKORATIV emas, lekin sonni ham takrorlamaydi — u ulushni
         KO'RSATADI. Ekran o'quvchisi uchun qiymat yuqoridagi matnda. */
      '<div class="yb-deliver-bar" aria-hidden="true"><span style="width:' + pct + '%"></span></div>' +
      '<p class="yb-deliver-foot">' +
        '<span class="yb-deliver-fail"><span class="dot" aria-hidden="true"></span>' +
          num(it.fail) + " ta yetkazilmadi</span>" +
        '<span>Taxminiy qamrov ~' + num(it.reach) + " kishi</span>" +
      "</p>" +
    "</div>";
  }

  /* --- Qator menyusi --------------------------------------------------------
     Ikki ikonka har qatorda takrorlanib, sakkiz qatorda o'n olti nishon
     berardi — ular ma'lumotdan ko'ra ko'proq joy egallardi. Endi bitta `…`
     va uning ostidagi menyu (Customer.io, Podia ham shu naqshda).

     Menyu SAHIFA darajasida va `position: fixed`: `.yb-table-wrap` da
     `overflow-x: auto` bor, ichkaridagi menyu esa qirqilib ketardi.
     -------------------------------------------------------------------------- */
  var menuState = { item: null, trigger: null };

  function menuEl() { return $("ybMenu"); }

  function closeMenu(returnFocus) {
    var m = menuEl();
    if (m.hidden) return;
    m.hidden = true;
    m.removeAttribute("data-open");
    if (menuState.trigger) {
      menuState.trigger.setAttribute("aria-expanded", "false");
      if (returnFocus) menuState.trigger.focus();
    }
    menuState.item = null;
    menuState.trigger = null;
  }

  /* Joylashuv tugmadan hisoblanadi. Pastda joy yetmasa — TEPAGA ochiladi;
     `transform-origin` ham shunga qarab almashadi, ya'ni menyu o'z
     markazidan emas, TUGMADAN o'sib chiqadi. */
  function placeMenu() {
    var m = menuEl(), trigger = menuState.trigger;
    if (!trigger || m.hidden) return;
    var r = trigger.getBoundingClientRect();
    var h = m.offsetHeight, w = m.offsetWidth;
    var gap = 6;
    var below = window.innerHeight - r.bottom > h + gap + 8;
    m.style.top = Math.round(below ? r.bottom + gap : r.top - h - gap) + "px";
    m.style.left = Math.round(Math.min(Math.max(8, r.right - w), window.innerWidth - w - 8)) + "px";
    m.style.transformOrigin = (below ? "top" : "bottom") + " right";
  }

  function openMenu(trigger, it) {
    var m = menuEl();
    /* Ayni tugma qayta bosilsa — yopiladi. Menyu ochiq turganda tugmani
       bosish uni qayta ochishi «hech nima bo'lmadi» degan taassurot
       berardi. */
    if (!m.hidden && menuState.trigger === trigger) { closeMenu(true); return; }

    menuState.item = it;
    menuState.trigger = trigger;
    trigger.setAttribute("aria-expanded", "true");
    m.hidden = false;

    placeMenu();
    /* `data-open` KEYINGI kadrda qo'yiladi: `hidden` olib tashlangan zahoti
       qo'yilsa, brauzer boshlang'ich holatni chizmasdan yakuniy holatga
       o'tadi va o'tish ko'rinmaydi. */
    requestAnimationFrame(function () { m.setAttribute("data-open", "true"); });
    /* `preventScroll` MAJBURIY: `position: fixed` element ichidagi
       elementga fokus berilganda brauzer uni "ko'rinadigan joyga" surib,
       scroll hodisasini otadi — u esa quyidagi `scroll` tinglovchisini
       ishga tushirib, menyuni ochilgan zahoti YOPIB qo'yardi. Real
       brauzerda topildi. */
    m.querySelector(".yb-menu-item").focus({ preventScroll: true });
  }

  function initMenu() {
    var m = menuEl();

    m.addEventListener("click", function (e) {
      var b = e.target.closest(".yb-menu-item");
      if (!b) return;
      var it = menuState.item;
      closeMenu(false);
      if (!it) return;
      if (b.getAttribute("data-act") === "edit") duplicate(it);
      /* «O'chirish» oynani TASDIQ holatida ochadi: bitta tasdiq mexanikasi
         va bitta ko'rinish — menyuda ikkinchi variantini yasash ikki xil
         xulq berardi. */
      else openRecord(it, true);
    });

    /* Klaviatura: o'q tugmalari bilan yurish, Escape bilan yopish.
       `isComposing` qo'riqchisi — IME faol paytda o'q tugmasi harf
       tanlash uchun ishlatiladi va menyu uni o'g'irlab ketmasin. */
    m.addEventListener("keydown", function (e) {
      if (e.isComposing || e.keyCode === 229) return;
      var items = [].slice.call(m.querySelectorAll(".yb-menu-item"));
      var i = items.indexOf(document.activeElement);
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        var next = e.key === "ArrowDown" ? i + 1 : i - 1;
        items[(next + items.length) % items.length].focus();
      } else if (e.key === "Escape") {
        e.preventDefault();
        closeMenu(true);
      } else if (e.key === "Tab") {
        /* Tab menyudan CHIQADI — u modal emas, oddiy menyu. */
        closeMenu(false);
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMenu(true);
    });
    document.addEventListener("click", function (e) {
      if (menuEl().hidden) return;
      if (e.target.closest(".yb-menu") || e.target.closest(".yb-dots")) return;
      closeMenu(false);
    });
    /* Sahifa yoki jadval siljisa menyu YOPILMAYDI, qayta joylashadi.
       Yopish sinab ko'rildi va noto'g'ri chiqdi: `html` da
       `scroll-behavior: smooth` bor, ya'ni har bir yumshoq siljish yuzlab
       millisekund davomida scroll hodisasi otadi va menyu ochilgan zahoti
       yopilib qolardi (real brauzerda o'lchandi).

       Qayta hisob ARZON — bitta `getBoundingClientRect` va ikkita style
       yozuvi — va `requestAnimationFrame` bilan kadrga bir marta siqiladi. */
    var ticking = false;
    function reflow() {
      if (ticking || menuEl().hidden) return;
      ticking = true;
      requestAnimationFrame(function () { placeMenu(); ticking = false; });
    }
    window.addEventListener("scroll", reflow, true);
    window.addEventListener("resize", reflow);
  }

  /* --- Jadval qatori --------------------------------------------------------
     Referens: Customer.io «Campaigns» — nom + qisqa mazmun BITTA katakda,
     holat esa nomning yonida nuqta bo'lib turadi (alohida ustun ochmaydi);
     Intercom «Messages» — tinch hairline qatorlar, kichik state.
     -------------------------------------------------------------------------- */
  /* Sana — YIL har qatorda AYNAN bir xil («2026-») va shuning uchun hech
     narsani ajratmaydi; kun-oy esa qatorlar orasidagi asosiy farq. Uchala
     bo'lak ham qoladi (ma'lumot yo'qolmaydi), lekin OG'IRLIGI har xil:
     yil so'nadi, kun-oy to'q, vaqt o'rtada. Mono va `tabular-nums`
     saqlanadi — ustun bo'ylab yurgan ko'z raqamni bir joyda ko'radi. */
  function stamp(v) {
    var m = /^(\d{4})-(\d{2}-\d{2})\s+(\d{2}:\d{2})$/.exec(String(v || ""));
    if (!m) return esc(v);
    return '<span class="yb-yr">' + m[1] + '-</span>' +
           '<span class="yb-md">' + m[2] + "</span>" +
           '<span class="yb-hm">' + m[3] + "</span>";
  }
  function dash() { return '<span class="yb-dash">—</span>'; }

  /* «Yuborish» — ilgari ikkita ustun edi: «Boshlangan» va «Oxirgi yuborish».
     Bir martalik yozuvda ular AYNAN bir xil sana ko'rsatardi (namunadagi
     beshta bir martalik yozuvning beshtasida ham), ya'ni bir xil
     ko'rinishdagi ikki mono ustun bir-birini takrorlardi.

     Endi bitta ustun va ikkinchi qator FAQAT yangi narsa aytganda chiqadi:
     davomiy yozuvda «keyingi», hali yuborilmaganda «rejada». `next` ilgari
     jadvalda umuman ko'rinmasdi — holbuki ishlab turgan davomiy xabar uchun
     eng amaliy sana aynan o'sha. */
  /* Har fakt O'Z ustunida. Ilgari ular JUFT-JUFT bo'lib bir katakning
     ichida ustma-ust turardi (sarlavha ustida turi+hudud, sana ustida
     «keyingi»/«rejada») va foydalanuvchi ularni «ustma-ust, tushunarsiz»
     deb qaytardi: bir katakda ikki xil ma'nodagi qator turganda ko'z
     qaysi biri ustun sarlavhasiga tegishli ekanini ajrata olmasdi. */
  function dateCell(cls, label, v) {
    return '<td class="yb-td-date ' + cls + '" data-label="' + label + '">' +
             (v ? stamp(v) : dash()) +
           "</td>";
  }

  /* Hududning ENG ANIQ pog'onasi. To'liq yo'l («Xorazm viloyati /
     Qo'shko'pir tumani / 8-mahalla») sakkiz qatorda bir xil boshlanardi va
     farq faqat oxirida ko'rinardi — takrorlanuvchi bosh qismi shovqin.
     To'liq yo'l oynada qoladi. */
  function scopeTip(sc) { return sc.mahalla || sc.district || sc.region; }

  function row(it) {
    var tr = el("tr", "yb-tr");
    /* Rol ATAYLAB: tor ekranda jadval `display: block` ga o'tadi va brauzer
       shu payt tug'ma jadval semantikasini tashlab yuboradi. */
    tr.setAttribute("role", "row");
    tr.setAttribute("data-kind", it.kind);
    tr.setAttribute("data-status", it.status);
    var k = KIND[it.kind], st = STATUS[it.status];

    tr.innerHTML =
      /* Sarlavha — HAQIQIY tugma: qator bosilishi sichqoncha uchun qulay,
         lekin klaviatura uchun alohida nishon kerak. Katakda BOSHQA hech
         nima yo'q: ilgari uning ostida turi va hudud ustma-ust turardi va
         ular qaysi ustun sarlavhasiga tegishli ekani ko'rinmasdi. */
      '<td class="yb-td-msg" data-label="Xabar">' +
        '<button type="button" class="yb-open" aria-haspopup="dialog">' +
          esc(it.title) +
        "</button>" +
      "</td>" +

      /* `.kind-tag` — `components.css` dagi UMUMIY komponent; oynada va
         `landing.html` da ham shu ishlatiladi. */
      '<td class="yb-td-kind" data-label="Turi">' +
        '<span class="kind-tag" data-kind="' + it.kind + '">' +
          '<svg class="ico" aria-hidden="true" focusable="false"><use href="#' + k.icon + '"/></svg>' +
          esc(k.label) +
        "</span>" +
      "</td>" +

      /* Matn ALOHIDA span da: `text-overflow: ellipsis` flex konteynerning
         O'ZIDA ishlamaydi — u yerda yalang'och matn anonim flex elementga
         aylanadi va uch nuqtasiz qirqiladi (861px da o'lchangan edi). */
      '<td class="yb-td-place" data-label="Hudud">' +
        '<span class="yb-place">' +
          '<svg class="ico" aria-hidden="true" focusable="false"><use href="#i-map-pin"/></svg>' +
          '<span class="yb-place-t">' + esc(scopeTip(it.scope)) + "</span>" +
        "</span>" +
      "</td>" +

      '<td class="yb-td-state" data-label="Holat">' +
        '<span class="yb-state" data-tone="' + st.tone + '">' +
          '<span class="dot" aria-hidden="true"></span>' + esc(st.label) +
        "</span>" +
      "</td>" +

      /* Ikki sana — IKKI ustun. Ilgari ular bitta katakda ustma-ust
         turardi va ikkinchi qatorning yorlig'i («keyingi» / «rejada»)
         qiymatning o'zi bilan bir qatorda o'qilardi. */
      dateCell("yb-td-sent", "Yuborilgan", it.sent) +
      dateCell("yb-td-next", "Keyingi", it.next) +

      /* Sonlar O'NGGA tekislanadi va `tabular-nums` bilan: ustun bo'ylab
         yurgan ko'z birlik xonasini bir joyda ko'radi. */
      '<td class="yb-td-num" data-label="Yuborishlar"' + (it.runs ? "" : ' data-empty="true"') + ">" +
        (it.runs ? num(it.runs) : "—") +
      "</td>" +

      '<td class="yb-td-act">' +
        '<button type="button" class="icon-btn yb-dots" aria-haspopup="menu" aria-expanded="false"' +
          ' aria-label="Amallar" title="Amallar">' +
          '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
            '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>' +
          "</svg>" +
        "</button>" +
      "</td>";

    [].forEach.call(tr.children, function (td) { td.setAttribute("role", "cell"); });

    tr.querySelector(".yb-open").addEventListener("click", function () { openRecord(it); });
    tr.querySelector(".yb-dots").addEventListener("click", function (e) {
      e.stopPropagation();
      openMenu(this, it);
    });
    /* Sichqoncha uchun butun qator nishon; tugmalar o'z ishini qiladi. */
    tr.addEventListener("click", function (e) {
      if (e.target.closest("button")) return;
      openRecord(it);
    });
    return tr;
  }

  /* --- Yozuv oynasi ---------------------------------------------------------
     Ilgari tafsilot kartaning ICHIDA ochilardi: uzun ro'yxatda ochilgan yozuv
     qolganlarini pastga surib yuborardi va ikkitasini solishtirish uchun
     aylantirib yurish kerak edi. Modal ro'yxatni joyida qoldiradi.
     -------------------------------------------------------------------------- */
  function openRecord(it, straightToConfirm) {
    var why = it.failWhy || it.stopWhy;
    var host = $("ybDialogBody");
    host.innerHTML =
      '<div class="yb-modal-head">' +
        tagsHtml(it) +
        '<h2 class="d3" id="ybDialogTitle">' + esc(it.title) + "</h2>" +
        '<p class="yb-scope">' + esc(scopePath(it.scope)) + "</p>" +
      "</div>" +

      (why ? '<p class="yb-why" data-tone="' + (it.failWhy ? "crit" : "quiet") + '">' + esc(why) + "</p>" : "") +

      /* Sonlar oynada ham turadi: ro'yxatdan uzilib qolmasin — operator
         qatorda ko'rgan raqamni oynada qidirishga majbur bo'lmaydi. */
      '<div class="yb-strip yb-modal-strip">' + deliverBlock(it) + "</div>" +

      /* Xabarning O'ZI — oynaning bosh mazmuni. Ikki til yonma-yon: ular
         bir-birining tarjimasi, ustma-ust turganda solishtirish uchun ko'z
         pastga-yuqoriga yurardi. */
      '<div class="yb-langs">' +
        '<div class="yb-lang"><p class="eyebrow eyebrow-sm">O‘zbekcha</p>' +
          '<p class="feed-strong">' + esc(it.uz[0]) + "</p>" +
          '<p class="feed-text">' + esc(it.uz[1]) + "</p></div>" +
        '<div class="yb-lang"><p class="eyebrow eyebrow-sm">Ruscha</p>' +
          '<p class="feed-strong">' + esc(it.ru[0]) + "</p>" +
          '<p class="feed-text">' + esc(it.ru[1]) + "</p></div>" +
      "</div>" +

      /* Faktlar tasmani TAKRORLAMAYDI: tasma `next` ni ko'rsatsa, bu yerda
         `sent` turadi va aksincha. */
      /* VAQT ro'yxati. «Qamrov» va «Tillar» OLIB TASHLANDI: birinchisi
         sarlavha ostidagi hudud yo'lini so'zma-so'z takrorlardi, ikkinchisi
         esa yuqorida ikkala til to'liq matni bilan turgani holda «O'zbekcha
         va ruscha» deb qayta aytardi. Qolgani — bitta savolga javob
         beradigan bir oila: bu yozuv QACHON nima qildi.

         Shartlar ham soddalashdi: ilgari «Oxirgi yuborish» faqat `next`
         BOR bo'lganda chiqardi, ya'ni bir martalik yozuvda yuborilgan sana
         ro'yxatdan tushib qolardi. Endi har qator doim bor, qiymati
         yo'q bo'lsa tire turadi. */
      '<dl class="feed-facts yb-facts">' +
        '<div><dt>Jadval</dt><dd>' + esc(it.plan) + "</dd></div>" +
        '<div><dt>Yaratilgan</dt><dd>' + esc(it.created) + "</dd></div>" +
        '<div><dt>Boshlangan</dt><dd>' + esc(it.startedAt || "—") + "</dd></div>" +
        '<div><dt>Oxirgi yuborish</dt><dd>' + esc(it.sent || "—") + "</dd></div>" +
        /* Davomiy yozuvda qator DOIM bor (qiymati bo'lmasa tire), bir
           martalikda esa faqat REJA bo'lsa: yuborilib bo'lgan bir martalik
           xabarda «keyingi yuborish» degan tushuncha yo'q. Yorliq ham
           boshqacha — u qaytish emas, bir martalik reja. */
        (it.kind === "repeat"
          ? '<div><dt>Keyingi yuborish</dt><dd>' + esc(it.next || "—") + "</dd></div>"
          : it.next
            ? '<div><dt>Rejalashtirilgan</dt><dd>' + esc(it.next) + "</dd></div>"
            : "") +
      "</dl>";

    var actions = actionRow(it);
    host.appendChild(actions);

    var dlg = $("ybDialog");
    if (typeof dlg.showModal === "function") dlg.showModal();
    else dlg.setAttribute("open", "");
    document.body.setAttribute("data-modal", "true");
    if (straightToConfirm) actions.querySelector(".yb-act-del").click();
  }

  /* --- Turi segmenti --------------------------------------------------------
     Ilgari turi ham, holat ham PILL qatori edi — jami to'qqizta tugma, va
     keraklisini topish uchun hammasini o'qib chiqish kerak edi. Endi bu yerda
     faqat sahifaning asosiy farqi turadi (bir martalik ↔ davomiy), holat esa
     ro'yxatga yig'ildi.
     -------------------------------------------------------------------------- */
  function kindSegment() {
    var host = $("ybKind");
    var thumb = $("ybKindThumb");
    [].slice.call(host.querySelectorAll("button")).forEach(function (b) { b.remove(); });

    KIND_TABS.forEach(function (t) {
      var n = t.id === "all" ? ITEMS.length
        : ITEMS.filter(function (i) { return i.kind === t.id; }).length;
      var b = el("button", "yb-segment-btn");
      b.type = "button";
      b.setAttribute("data-value", t.id);
      b.setAttribute("aria-pressed", view.kind === t.id ? "true" : "false");
      b.appendChild(el("span", "yb-segment-label", t.label));
      b.appendChild(el("span", "yb-segment-count", String(n)));
      b.addEventListener("click", function () {
        if (view.kind === t.id) return;
        view.kind = t.id;
        render();
      });
      host.appendChild(b);
    });
    moveThumb(host, thumb);
  }

  /* Ko'rsatkich FAQAT `translateX` bilan yuradi. Segmentlar teng kenglikda,
     shuning uchun `width` umuman o'zgarmaydi — `width` animatsiyasi har
     kadrda layout hisoblatardi. */
  function moveThumb(host, thumb) {
    var active = host.querySelector('[aria-pressed="true"]');
    if (!active) { thumb.style.opacity = "0"; return; }
    thumb.style.opacity = "1";
    thumb.style.width = active.offsetWidth + "px";
    thumb.style.transform = "translateX(" + active.offsetLeft + "px)";
  }

  /* --- Holat ro'yxati -------------------------------------------------------
     Olti pill o'rniga bitta boshqaruv. Sonlar variant matnida qoladi — ular
     «bu yerda nima bor?» degan savolga ro'yxat ochilishi bilan javob beradi.
     -------------------------------------------------------------------------- */
  function statusSelect() {
    var sel = $("ybStatus");
    sel.innerHTML = "";
    STATUS_TABS.forEach(function (t) {
      var o = document.createElement("option");
      o.value = t.id;
      /* «Barcha holatlar» yonida son ortiqcha: u jami bilan bir xil va
         pastdagi natija qatorida allaqachon turibdi. */
      o.textContent = t.id === "all" ? t.label
        : t.label + " · " + ITEMS.filter(function (i) { return i.status === t.id; }).length;
      /* Nol natijali holat O'CHIRILMAYDI: uni tanlab «bu yerda hech nima
         yo'q» javobini ko'rish halol, variantni jim o'chirib qo'yish esa
         «bunday holat yo'q» degan boshqa gap. */
      if (view.status === t.id) o.selected = true;
      sel.appendChild(o);
    });
  }

  /* Umumiy holat tasmasi. Uch alohida quti o'rniga BITTA tasma: ular bitta
     savolning uch bo'lagi, uchta mustaqil karta emas.

     Har bo'lak BOSILADI va ro'yxatni filtrlaydi — «nechta davomiy xabar
     ishlab turibdi?» degan savolning javobi ko'pincha keyingi harakat ham
     bo'ladi: «ko'rsat». Ilgari raqamni ko'rgan operator uni topish uchun
     pastdagi filtrga qaytib borishga majbur edi. */
  var SUMMARY = [
    {
      id: "active", label: "Davomiy · faol", why: "jadval bo‘yicha qaytadi",
      test: function (i) { return i.kind === "repeat" && i.status !== "stopped"; },
      view: { kind: "repeat", status: "all" }
    },
    {
      id: "once", label: "Bir martalik", why: "yuborilib bo‘lgan",
      test: function (i) { return i.kind === "once"; },
      view: { kind: "once", status: "all" }
    },
    {
      id: "failed", label: "Xatolik", why: "tekshirish kerak", quiet: "muammo yo‘q",
      test: function (i) { return i.status === "failed"; },
      view: { kind: "all", status: "failed" }
    }
  ];

  function summary() {
    var box = $("ybSummary");
    box.innerHTML = "";
    SUMMARY.forEach(function (row) {
      var n = ITEMS.filter(row.test).length;
      var b = el("button", "yb-sum");
      b.type = "button";
      b.setAttribute("data-id", row.id);
      /* Nol qiymatli bo'lak BOSILMAYDI: bosib bo'sh ro'yxatni ko'rish
         foydasiz, tugmani esa jim qoldirish «bu yerda hech nima yo'q»
         degan halol javob. */
      b.disabled = n === 0;
      b.appendChild(el("span", "eyebrow eyebrow-sm", row.label));
      var num = el("span", "yb-sum-num", String(n));
      if (row.id === "failed" && n) num.setAttribute("data-tone", "crit");
      b.appendChild(num);
      b.appendChild(el("span", "yb-sum-why", n === 0 && row.quiet ? row.quiet : row.why));
      b.addEventListener("click", function () {
        view.kind = row.view.kind;
        view.status = row.view.status;
        view.q = "";
        $("ybSearch").value = "";
        render();
        /* Ro'yxat boshiga olib boriladi: filtr yuqorida bosilgani uchun
           natija ekrandan tashqarida qolib, «hech nima bo'lmadi» degan
           taassurot berardi. */
        $("ybList").scrollIntoView({ block: "nearest", behavior: "smooth" });
      });
      box.appendChild(b);
    });
    markSummary();
  }

  /* Qaysi bo'lak HOZIR yoqiq ekani ko'rinib tursin — aks holda tasma
     ro'yxat holatidan ajralib qolardi. */
  function markSummary() {
    var box = $("ybSummary");
    SUMMARY.forEach(function (row) {
      var b = box.querySelector('[data-id="' + row.id + '"]');
      if (!b) return;
      var on = view.kind === row.view.kind && view.status === row.view.status;
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  function render() {
    kindSegment();
    statusSelect();

    var list = visible();
    var host = $("ybList");
    host.innerHTML = "";
    list.forEach(function (it, i) {
      var r = row(it);
      if (firstPaint) {
        r.setAttribute("data-enter", "true");
        r.style.setProperty("--i", String(i));
      }
      host.appendChild(r);
    });
    firstPaint = false;

    var empty = $("ybEmpty");
    empty.hidden = list.length > 0;
    /* Jadvalning O'ZI yashiriladi — `tbody` emas: bo'sh sarlavha qatori
       yolg'iz qolib, «yuklanmoqda» taassurotini berardi. */
    $("ybTableWrap").hidden = list.length === 0;
    /* Filtr tavsifi IKKI joyda kerak — bo'sh holatda ham, natija qatorida
       ham — shuning uchun u shartdan TASHQARIDA hisoblanadi. */
    var parts = [];
    if (view.q) parts.push("«" + view.q + "» so‘rovi");
    if (view.kind !== "all") parts.push(KIND[view.kind].label.toLowerCase());
    if (view.status !== "all") parts.push(STATUS[view.status].label.toLowerCase());
    var on = parts.length > 0;

    if (!list.length) {
      /* Bo'shlikning IKKI sababi bor va ular boshqa-boshqa javob talab
         qiladi: filtr juda tor (tozalash kerak) yoki ro'yxatning o'zi bo'sh
         (tozalanadigan narsa yo'q). */
      /* Sarlavha ham sababga qarab o'zgaradi: «bu shartlarga mos xabar
         yo'q» filtr tili, o'chirib bo'lingan ro'yxatda esa u yolg'on
         yo'nalish berardi. */
      $("ybEmptyTitle").textContent = on
        ? "Bu shartlarga mos xabar yo‘q"
        : "Ro‘yxat bo‘sh";
      $("ybEmptyWhy").textContent = on
        ? "Filtr: " + parts.join(" · ") + ". Shartlardan birini olib tashlab ko‘ring."
        : "Barcha yozuv o‘chirildi. Sahifani yangilasangiz namuna yozuvlar qaytadi — " +
          "server ulanmagani uchun o‘chirish faqat shu brauzerda saqlanadi.";

      /* Ikonka ham ajratiladi: ilgari ikkala holat ham LUPA ko'rsatardi —
         matn «hech narsa qidirilmagan» desa ham, rasm «qidiruv natijasi
         bo'sh» derdi. Bo'sh ro'yxat — ro'yxat belgisi, tor filtr — lupa. */
      $("ybEmptyIcon").setAttribute("href", on ? "#i-search" : "#i-list");

      /* Tugma HECH QACHON yo'qolmaydi. Ilgari `hidden = !parts.length`
         edi va aynan eng chorasiz holatda — ro'yxat butunlay bo'shaganda —
         kartada birorta amal qolmasdi. Endi tugma VAZIFASINI almashtiradi:
         filtr bor bo'lsa uni tozalaydi, bo'lmasa namuna yozuvlarni
         qaytaradi (sahifani yangilaydi — o'chirish faqat xotirada edi). */
      var reset = $("ybReset");
      reset.hidden = false;
      reset.textContent = on ? "Filtrni tozalash" : "Namuna yozuvlarni qaytarish";
      reset.dataset.action = on ? "clear" : "reload";
    }

    /* Qator FILTRNI ham aytadi: «8 ta yozuv» yolg'iz turganda «hammasi
       shumi yoki filtr yoqiqmi?» degan savol qolardi. Ilgari qator faqat
       SANARDI — filtr nomi faqat bo'sh holat ichida aytilardi, ya'ni
       natija bor paytda foydalanuvchi nima bo'yicha filtrlanganini
       ekranning o'zidan o'qiy olmasdi. */
    $("ybCount").textContent = on
      ? list.length + " ta yozuv · jami " + ITEMS.length + " tadan · filtr: " + parts.join(" · ")
      : list.length + " ta yozuv";
    /* Bo'sh holat ochiq bo'lsa, «Tozalash» FAQAT o'sha yerda qoladi: ikkita
       bir xil amal ikki joyda turganda qaysi biri «asosiy» ekani noaniq
       bo'lardi. */
    $("ybClear").hidden = !on || !list.length;
    markSummary();
    $("ybSearchClear").hidden = !view.q;
  }

  function boot() {
    summary();
    initMenu();

    var search = $("ybSearch");
    search.addEventListener("input", function () {
      view.q = search.value.trim().toLowerCase();
      render();
    });
    $("ybSearchClear").addEventListener("click", function () {
      search.value = ""; view.q = ""; render(); search.focus();
    });
    $("ybSort").addEventListener("change", function () {
      view.sort = $("ybSort").value;
      render();
    });
    $("ybClear").addEventListener("click", function () {
      view = { kind: "all", status: "all", q: "", sort: view.sort };
      search.value = "";
      render();
    });
    $("ybStatus").addEventListener("change", function () {
      view.status = $("ybStatus").value;
      render();
    });
    /* Oyna kengligi o'zgarsa segment kengligi ham o'zgaradi — ko'rsatkich
       eski joyida qolib ketmasin. */
    if (window.ResizeObserver) {
      new ResizeObserver(function () { moveThumb($("ybKind"), $("ybKindThumb")); })
        .observe($("ybKind"));
    }

    $("ybReset").addEventListener("click", function () {
      /* Tugmaning vazifasi bo'sh holatga qarab o'zgaradi — `render()` uni
         `data-action` bilan belgilaydi. */
      if ($("ybReset").dataset.action === "reload") { window.location.reload(); return; }
      view = { kind: "all", status: "all", q: "", sort: view.sort };
      search.value = "";
      render();
      search.focus();
    });

    var dlg = $("ybDialog");
    /* Escape ni brauzerning o'zi ulaydi (`showModal`), lekin `close` hodisasi
       HAR yopilishda otiladi — `body[data-modal]` shu yerda tozalanadi. */
    dlg.addEventListener("close", function () {
      document.body.removeAttribute("data-modal");
    });
    $("ybDialogClose").addEventListener("click", function () { dlg.close(); });
    /* Orqa fonga bosish — `<dialog>` `::backdrop` ni bola qilib bermaydi,
       shuning uchun bosish NUQTASI quti chegarasi bilan solishtiriladi. */
    dlg.addEventListener("click", function (e) {
      if (e.target !== dlg) return;
      var r = dlg.getBoundingClientRect();
      var inside = e.clientX >= r.left && e.clientX <= r.right &&
                   e.clientY >= r.top && e.clientY <= r.bottom;
      if (!inside) dlg.close();
    });

    render();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
