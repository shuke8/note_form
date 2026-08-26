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
    dataFailed: false,    // `composer-data.js` yuklanmadi
    when: "now",
    days: [],           // "0".."6" — JS getDay() konvensiyasi
    span: "always",     // always | months | range — takrorlanish QAYSI DAVRDA amal qiladi
    months: [],         // 1..12, faqat span === "months" da ma'noga ega
    /* Rejim almashganda `false` ga tushadi: endi ochilgan panel qizil bo'lib
       qarshi olmasin, o'q tugma bilan segmentdan o'tayotganda oraliq
       rejimning xatolari chaqnab o'tmasin. */
    whenTouched: false,
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
        if (e.key === "Home") { e.preventDefault(); return focusIndex(0); }
        if (e.key === "End") { e.preventDefault(); return focusIndex(items.length - 1); }
        if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); focusIndex(i + 1); }
        else if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); focusIndex(i - 1); }
        else if (e.key === " " || e.key === "Enter") { e.preventDefault(); select(item); }
      });
    });
    syncTabStops();
  }

  /* ---------------------------------------------------------------------------
     01 QAMROV — NARVON
     To'rt daraja bitta boshqaruvda: radio «shu yerda to'xtat» degani,
     yonidagi select esa o'sha darajaning hududini beradi.
  ------------------------------------------------------------------------- */
  var LEVELS = ["republic", "region", "district", "mahalla"];

  /* Reestrda buzuq yozuv (null, satr) bo'lsa u BUTUN qadamni o'ldirmasin —
     o'tkazib yuboriladi va yig'indi faqat haqiqatan o'qilganidan yig'iladi. */
  var NAMES = Object.keys(GEO).filter(function (k) { return GEO[k] && typeof GEO[k] === "object"; });

  function hasPop(v) { return typeof v === "number" && isFinite(v) && v > 0; }

  /* Bitta hududning soni yetishmasa respublika yig'indisi ham YO'Q.
     `|| 0` qisman yig'indini «butun respublika aholisi» deb ko'rsatardi —
     o'ylab topilgan fakt: ekran bilmagan narsasini biladi deb da'vo qilardi. */
  var NO_POP = NAMES.filter(function (n) { return !hasPop(GEO[n].pop); });
  var REPUBLIC_POP = NO_POP.length ? null : NAMES.reduce(function (s, n) { return s + GEO[n].pop; }, 0);

  /* Raqam o'qiladigan bo'lsin: 35 100 000 emas, 35.1M. Yaxlitlash darajasi
     kattalikka qarab — 2.4K va 2.44K orasida farq operatorga kerak emas. */
  function formatPop(n) {
    if (n == null) return null;
    if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
    // 10K dan past qiymatda o'nlik saqlanadi: mahalla 2 400 kishi bo'lsa
    // «~2K» uni chorak qismga yaxlitlab yuborardi.
    if (n >= 1e4) return Math.round(n / 1e3) + "K";
    if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
    return String(n);
  }
  /* Son yo'q bo'lsa «~0» emas, «—»: nol «hech kim» degani, tire «reestr aytmagan» degani. */
  function popText(n) { return hasPop(n) ? "~" + formatPop(n) : "—"; }

  function districtsOf(region) { return (GEO[region] && GEO[region].districts) || {}; }
  function mahallasOf(region, district) {
    var d = districtsOf(region)[district];
    return (d && d.mahallas) || {};
  }

  /* Har darajaning taxminiy qamrovi. Tanlanmagan yoki reestrda yo'q bo'lsa
     null — ekranda «—» chiqadi, nol EMAS: nol «hech kim» degan ma'noni berardi. */
  function reachOf(level) {
    var v = level === "republic" ? REPUBLIC_POP
      : level === "region" ? (state.region ? GEO[state.region].pop : null)
      : level === "district" ? (state.region && state.district ? districtsOf(state.region)[state.district].pop : null)
      : (state.region && state.district && state.mahalla ? mahallasOf(state.region, state.district)[state.mahalla] : null);
    return hasPop(v) ? v : null;
  }

  function currentReach() {
    if (state.dataFailed) return null;
    return state.scope ? reachOf(state.scope) : null;
  }

  function scopePath() {
    if (!state.scope) return null;
    if (state.scope === "republic") return ["O‘zbekiston Respublikasi"];
    var parts = [];
    if (state.region) parts.push(state.region);
    if (state.scope !== "region" && state.district) parts.push(state.district);
    if (state.scope === "mahalla" && state.mahalla) parts.push(state.mahalla);
    return parts.length ? parts : null;
  }

  /* ---------------------------------------------------------------------------
     01 QAMROV — XARITA
     Qamrov = TURGAN JOYING. Daraja alohida tanlanmaydi: `goScope` darajani va
     joyni BIR VAQTDA o'rnatadi, shuning uchun ekran bilan so'rov tanasi
     bir-biridan uzilib qololmaydi.
  ------------------------------------------------------------------------- */
  /* O'zbekistonning HAQIQIY chegaralari: Natural Earth 10m admin-1 (jamoat
     mulki) dan olinib, Albers TENG-YUZALI konus proyeksiyasida (standart
     parallellar 38.5°N va 44.5°N) 480×320 viewBox ga tushirilgan va
     Duglas-Peyker bilan 0.42 birlik dopuskda soddalashtirilgan.
     Teng-yuzali proyeksiya ataylab: xaritada hududning KATTALIGI «qancha
     joy» degan ma'noni beradi, Merkator esa Qoraqalpog'istonni bo'rttirib,
     Surxondaryoni kichraytirib, raqam to'g'ri turib chizmani yolg'onchi
     qilardi. Bu umumiy ma'lumot to'plami — RASMIY chegara hujjati emas.
     Tartib: katta hudud OLDIN. SVG da keyingi element ustki bo'ladi, demak
     kichik hudud kattaning ustida qoladi va bosish o'g'irlanmaydi.
     [reestrdagi nom, path, yorliq X, yorliq Y, eng kichik o'lcham] */
  var MAP_VIEWBOX = "0 0 480 320";
  var MAP_SHAPES = [
    ["Qoraqalpog‘iston Respublikasi", "M98.5 15.4 147.6 52.0 148.7 53.8 149.2 57.4 150.6 60.0 171.3 85.1 172.4 85.6 175.1 90.5 176.4 91.8 183.8 94.2 167.3 124.8 166.5 132.8 170.0 140.1 163.0 144.2 181.8 173.0 174.1 176.3 165.6 165.2 162.9 163.1 155.0 161.0 153.5 161.7 151.4 164.6 149.5 164.0 147.5 160.7 144.8 159.8 135.6 151.2 133.5 146.8 130.7 146.0 128.8 142.0 128.2 138.7 124.3 137.4 122.2 138.9 120.3 139.3 120.6 140.8 119.9 141.9 118.6 140.2 114.0 138.8 114.1 137.4 116.3 136.8 116.2 131.9 117.8 130.5 114.8 128.1 113.3 126.0 108.6 125.5 101.5 125.9 99.9 124.4 97.9 123.9 96.8 122.8 96.5 119.3 94.6 116.8 93.9 116.3 90.9 116.8 87.9 115.6 80.4 106.2 78.6 111.1 76.1 111.2 71.3 109.3 67.5 111.4 68.1 112.6 72.2 115.2 76.5 123.9 74.0 124.1 73.9 120.5 72.5 118.8 69.3 117.2 67.4 117.6 66.1 115.9 64.4 115.7 61.4 118.0 61.9 120.8 60.3 124.1 58.6 125.2 59.1 126.5 52.8 127.6 46.5 126.5 43.9 127.6 41.6 129.5 38.7 133.6 34.9 135.3 34.0 136.3 34.2 140.6 33.6 144.3 34.7 147.6 34.6 150.9 35.9 153.6 38.2 154.8 35.8 156.3 34.3 158.3 28.0 156.8 6.0 153.6 19.0 20.9 85.8 6.0Z", 66.6, 60.2, 170.3],
    ["Navoiy viloyati", "M247.6 77.8 249.3 78.7 257.7 88.8 264.2 93.1 271.7 108.2 279.8 104.0 278.9 123.9 277.8 125.3 278.0 139.9 291.3 139.9 292.4 149.1 297.0 168.6 298.9 170.3 295.6 171.8 295.1 172.9 295.7 177.9 296.3 179.0 299.4 179.9 299.5 182.1 300.5 183.9 295.7 194.2 294.7 193.0 294.7 191.5 292.6 189.6 289.6 191.4 286.2 190.3 285.2 191.1 284.3 193.5 284.9 195.6 283.8 196.7 284.3 199.1 283.7 201.0 284.3 202.1 282.1 207.2 283.8 207.4 284.0 208.2 281.9 210.5 275.6 212.1 272.6 211.3 270.4 210.2 269.3 208.8 265.4 207.4 263.8 211.4 264.6 212.4 263.3 216.2 261.2 216.4 259.2 215.5 258.3 217.1 254.7 218.0 256.7 220.7 257.6 224.0 256.6 227.2 258.5 231.3 255.2 232.3 254.5 229.5 251.9 227.6 250.8 223.8 247.2 221.8 244.7 222.1 244.4 221.2 242.3 220.0 239.9 216.3 242.1 212.3 244.8 210.7 246.5 207.5 248.6 206.7 246.9 204.3 247.7 202.6 247.0 201.9 247.0 200.2 249.3 199.4 251.6 200.6 254.9 200.7 257.9 193.6 260.5 193.7 260.4 190.2 261.1 187.0 251.5 186.9 248.8 186.3 246.9 184.9 245.1 178.4 243.3 180.0 237.0 181.0 235.6 184.9 228.2 184.0 227.0 183.5 226.5 179.1 224.9 177.7 223.3 179.0 219.6 185.3 216.4 186.5 214.8 183.6 206.6 178.4 202.5 176.0 195.8 173.6 192.3 166.9 187.8 161.4 186.3 158.2 184.1 158.1 174.4 161.5 163.0 144.7 163.6 143.7 170.0 140.1 166.5 132.8 167.3 124.8 183.8 94.6 183.4 94.0 176.4 91.8 172.4 85.6 203.5 81.0 235.4 84.2Z", 225.5, 130.4, 137.4],
    ["Buxoro viloyati", "M228.3 251.2 226.7 250.6 215.2 242.2 208.7 234.4 184.4 216.3 180.6 211.9 179.8 208.1 180.3 205.2 178.2 196.6 173.7 193.7 179.6 186.7 181.1 183.6 179.9 181.0 175.6 175.9 181.8 173.0 181.8 172.5 174.4 161.5 184.1 158.1 186.3 158.2 187.8 161.4 192.3 166.9 195.8 173.6 202.5 176.0 206.6 178.4 214.8 183.6 216.4 186.5 219.6 185.3 223.3 179.0 224.9 177.7 226.5 179.1 227.0 183.5 228.2 184.0 235.6 184.9 237.0 181.0 243.3 180.0 245.1 178.4 246.9 184.9 248.8 186.3 251.5 186.9 261.1 187.0 260.4 190.2 260.5 193.7 257.9 193.6 254.9 200.7 251.6 200.6 249.3 199.4 247.0 200.2 247.0 201.9 247.7 202.6 246.9 204.3 248.6 206.7 246.5 207.5 244.8 210.7 242.1 212.3 239.9 216.3 242.3 220.0 244.4 221.2 244.7 222.1 247.2 221.8 250.8 223.8 251.9 227.6 254.5 229.5 255.2 232.3 250.7 236.4 249.4 236.8 247.1 239.5 248.2 243.2 238.0 247.2 233.6 251.4 232.1 249.8Z", 217.4, 211.1, 87.4],
    ["Qashqadaryo viloyati", "M317.5 237.4 317.4 239.9 318.2 240.6 321.6 241.7 323.9 241.7 326.7 243.2 326.7 247.5 323.4 248.3 322.3 249.5 323.6 253.5 323.8 256.0 323.1 258.4 320.8 257.5 319.2 258.2 317.2 262.2 314.9 263.5 312.8 266.3 311.9 270.3 308.5 273.3 305.3 274.8 303.8 278.3 300.1 281.9 299.7 284.5 298.5 285.9 297.1 284.3 291.9 283.3 288.9 282.0 286.7 279.6 276.6 275.3 274.8 275.5 272.7 277.1 268.8 276.7 257.4 269.1 250.9 263.2 241.2 258.5 235.2 253.5 233.6 251.4 238.0 247.2 248.2 243.2 247.1 239.5 249.4 236.8 250.7 236.4 255.2 232.3 258.5 231.3 270.4 231.4 272.1 230.4 272.8 228.8 274.2 229.0 275.4 231.5 278.4 234.0 278.8 236.6 280.9 237.2 285.6 235.3 290.2 234.2 293.7 236.2 295.8 235.3 297.1 233.4 298.6 232.8 303.8 233.6 304.5 235.2 304.4 237.0 305.0 237.5 308.9 237.3 309.3 235.8Z", 290.8, 257.3, 57.2],
    ["Jizzax viloyati", "M352.0 203.5 350.3 204.3 353.6 206.1 352.0 208.9 352.8 211.8 352.7 213.2 351.8 213.2 352.7 214.0 351.8 216.4 351.7 223.2 349.2 226.0 349.6 226.7 344.6 227.7 327.1 224.9 323.6 227.3 321.4 227.7 320.8 228.3 321.0 230.0 319.5 230.2 315.7 226.9 315.4 223.8 315.6 223.2 317.4 222.7 317.6 219.6 320.8 218.1 320.0 214.5 319.6 213.8 308.6 211.9 307.6 210.9 307.4 209.4 305.2 209.6 304.8 207.5 305.8 206.8 305.9 205.6 303.9 202.6 303.3 195.0 295.7 194.2 300.5 183.9 299.5 182.1 299.4 179.9 296.7 179.2 295.7 178.1 295.1 172.9 295.6 171.8 298.9 170.3 300.5 170.6 325.9 168.3 328.3 169.2 331.0 167.5 333.9 173.1 334.5 172.6 335.2 173.1 336.1 172.1 336.5 173.5 335.7 174.1 336.3 175.8 335.4 179.2 333.0 181.6 335.1 182.3 340.8 186.6 340.4 188.5 338.3 189.3 338.2 191.7 339.6 191.5 339.7 192.0 336.7 199.6 336.9 202.0 337.9 202.5 344.2 202.4 352.5 199.9 351.6 202.9Z", 320.3, 193.1, 58.5],
    ["Surxondaryo viloyati", "M326.7 247.5 330.8 248.4 334.5 247.2 336.5 247.9 338.1 247.3 338.8 247.9 341.0 252.6 340.0 254.1 338.1 254.8 338.5 257.0 337.4 258.4 338.2 264.0 339.8 268.2 342.6 271.6 346.5 274.2 347.4 276.7 344.6 285.0 341.0 286.6 339.2 292.1 333.2 300.7 332.4 304.5 333.2 308.9 332.2 313.1 331.2 311.6 327.9 310.9 325.9 312.2 324.1 310.0 320.9 312.3 317.2 313.7 315.0 311.1 313.1 310.3 312.3 308.2 309.6 306.7 301.8 307.7 300.7 308.5 297.6 307.6 295.6 307.8 294.9 306.6 296.3 304.7 294.7 302.1 295.4 298.4 295.2 292.7 298.7 286.7 298.5 285.9 299.7 284.5 300.1 281.9 303.8 278.3 305.3 274.8 308.5 273.3 311.9 270.3 312.8 266.3 314.9 263.5 317.2 262.2 319.4 258.1 321.3 257.6 323.0 258.6 323.8 255.8 322.4 249.2 323.4 248.3Z", 318.7, 289.5, 52.7],
    ["Samarqand viloyati", "M319.5 230.2 318.1 237.3 309.3 235.8 308.9 237.3 305.0 237.5 304.4 237.0 304.5 235.2 303.8 233.6 298.6 232.8 297.1 233.4 295.8 235.3 293.7 236.2 290.2 234.2 285.6 235.3 280.9 237.2 278.8 236.6 278.4 234.0 275.4 231.5 273.9 228.8 272.2 229.0 272.1 230.4 270.4 231.4 258.5 231.3 256.6 227.2 257.6 224.0 256.7 220.7 254.6 218.2 258.3 217.1 259.2 215.5 261.2 216.4 263.3 216.2 264.6 212.4 263.8 211.4 265.4 207.4 269.3 208.8 270.4 210.2 272.6 211.3 275.6 212.1 281.9 210.5 284.0 208.2 283.8 207.4 282.1 207.2 284.3 202.1 283.7 201.0 284.3 199.1 283.8 196.7 284.9 195.6 284.3 193.5 284.9 191.5 286.2 190.3 289.6 191.4 292.6 189.6 294.7 191.5 294.8 193.1 296.0 194.4 303.3 195.0 303.9 202.6 305.9 205.6 305.8 206.8 304.8 207.5 305.2 209.6 307.4 209.4 307.6 210.9 308.6 211.9 319.6 213.8 320.0 214.5 320.8 218.1 317.6 219.6 317.4 222.7 315.6 223.2 315.4 223.8 315.7 226.9Z", 293.7, 219.0, 48.0],
    ["Toshkent viloyati", "M418.3 126.1 418.0 127.5 414.9 129.1 411.4 132.2 407.9 133.0 407.3 137.0 403.0 138.5 399.4 142.5 398.2 145.2 390.8 150.6 390.3 151.6 391.9 153.2 395.8 153.3 399.4 156.3 397.6 160.0 397.9 161.2 398.9 161.7 398.3 164.0 399.7 166.1 400.0 170.5 398.4 169.7 397.4 170.0 396.9 173.9 395.5 175.8 388.4 180.6 382.9 182.9 379.9 185.8 378.7 185.2 374.7 180.8 372.6 179.9 370.8 180.5 369.4 182.8 369.5 187.6 366.6 188.9 370.1 196.8 370.0 198.6 367.4 198.6 367.5 199.6 369.6 201.3 369.7 202.2 367.3 202.8 363.8 201.7 364.2 199.8 363.5 198.0 364.7 192.8 363.9 191.1 364.4 190.8 363.3 190.6 364.4 188.2 362.9 188.4 363.5 187.4 362.4 185.7 360.8 186.0 361.0 184.7 359.4 185.1 359.6 184.1 358.1 183.2 357.6 181.7 355.1 179.5 353.5 179.4 352.5 177.2 350.8 175.7 352.4 174.4 354.0 170.6 355.8 169.7 356.7 168.0 358.4 167.5 360.7 165.8 361.2 161.9 360.6 159.8 363.0 158.9 365.3 156.4 370.3 155.6 369.6 154.1 369.9 153.1 372.1 151.9 375.9 148.3 383.6 146.2 385.1 144.2 388.7 141.7 390.9 137.6 392.6 136.4 394.7 132.7 397.7 131.5 399.5 133.8 400.8 134.0 401.6 133.5 404.5 127.1 407.4 127.1 411.7 123.3 413.4 123.4Z", 381.5, 166.6, 67.4],
    ["Namangan viloyati", "M399.4 156.3 404.6 153.6 407.6 157.7 407.9 161.8 409.5 161.3 412.0 163.1 415.0 163.0 417.7 164.0 419.4 165.7 419.4 163.1 419.9 162.7 420.9 163.1 422.0 165.3 423.2 163.6 425.2 165.0 425.8 163.2 425.2 156.5 428.2 158.1 429.8 157.0 430.9 153.0 429.6 150.8 430.3 149.0 431.5 148.7 432.1 150.6 431.9 153.1 432.4 152.3 433.2 153.0 433.8 152.0 436.9 155.7 438.0 161.0 440.8 160.7 442.5 162.0 444.4 160.4 445.8 160.6 446.9 165.1 446.6 167.4 447.4 167.1 446.9 170.7 443.9 171.6 437.8 171.2 432.7 172.6 431.2 174.5 432.1 176.0 426.8 179.3 423.9 183.1 417.4 180.8 419.0 178.3 415.9 178.7 413.6 178.3 412.4 179.5 410.4 179.9 409.0 181.5 409.2 179.9 405.1 178.5 405.2 177.4 407.3 178.2 407.3 177.5 400.0 170.5 399.7 166.1 398.3 164.0 398.9 161.7 397.9 161.2 397.6 160.0Z", 413.5, 170.6, 34.4],
    ["Farg‘ona viloyati", "M439.3 204.8 438.8 208.0 436.5 207.4 436.5 206.3ZM444.8 194.4 445.1 194.8 444.6 195.3 439.9 195.3 438.5 197.9 436.3 199.5 435.7 199.3 435.1 196.6 434.2 195.4 433.4 197.7 431.4 197.7 429.0 195.8 426.8 194.7 424.5 194.8 423.7 193.9 422.4 196.2 418.3 196.1 416.7 196.5 415.8 197.6 406.6 199.7 405.4 199.0 403.5 194.7 401.3 194.8 399.3 194.2 399.5 192.9 398.6 190.9 399.7 189.6 401.8 188.9 403.0 186.9 410.4 179.9 412.4 179.5 413.6 178.3 415.9 178.7 419.0 178.3 417.4 180.8 423.3 183.3 426.8 179.3 431.4 176.9 433.4 179.6 433.5 178.8 436.1 179.1 437.9 179.6 439.9 181.7 445.1 182.1 446.1 181.4 447.3 182.5 449.5 183.1 450.0 186.7 446.6 188.3 446.0 190.4 443.0 192.6 443.2 193.7ZM417.4 200.4 420.3 203.6 422.1 204.3 423.6 203.6 424.2 204.0 422.4 206.0 423.9 208.2 423.6 209.7 420.6 210.5 419.5 209.5 418.1 210.3 418.8 206.4 417.4 205.9 416.0 203.4 416.5 201.0Z", 413.8, 188.3, 33.6],
    ["Xorazm viloyati", "M122.0 146.0 122.7 145.5 122.5 144.5 119.9 141.9 120.6 140.8 120.3 139.3 124.7 137.4 128.2 138.7 128.8 142.0 130.7 146.0 133.5 146.8 135.6 151.2 144.8 159.8 147.5 160.7 149.5 164.0 151.4 164.6 153.5 161.7 155.0 161.0 161.6 162.5 164.1 163.9 170.1 170.5 173.3 175.9 175.6 175.9 179.9 181.0 181.1 183.6 179.6 186.7 173.7 193.7 171.4 188.0 170.0 186.0 168.5 179.8 168.5 175.7 166.4 171.6 159.9 166.3 157.6 165.2 153.3 164.5 152.6 166.5 149.6 169.3 147.5 168.8 144.8 166.7 142.7 166.8 142.4 166.1 141.4 167.3 140.2 165.9 138.3 165.4 132.8 165.5 129.5 166.4 126.9 166.1 123.2 162.6 117.0 158.6 117.6 154.3 120.0 152.4 117.2 146.2 118.7 144.7Z", 128.7, 156.6, 56.3],
    ["Sirdaryo viloyati", "M363.8 201.7 362.3 201.2 356.3 203.0 352.0 203.5 351.6 202.9 352.4 199.9 344.2 202.4 337.9 202.5 336.9 202.0 336.7 199.6 339.7 192.0 339.6 191.5 338.2 191.7 338.3 189.1 340.4 188.5 340.8 186.6 346.3 189.2 347.7 187.9 349.9 188.5 350.4 188.1 350.0 187.4 350.7 186.0 350.1 184.3 348.9 183.7 348.3 180.0 348.7 177.1 349.2 177.4 350.2 175.9 350.8 175.7 352.2 176.9 353.5 179.4 355.1 179.5 357.6 181.7 358.1 183.2 359.6 184.1 359.4 185.1 361.0 184.7 360.8 186.0 362.4 185.7 363.5 187.4 362.9 188.4 364.4 188.2 363.3 190.6 364.4 190.8 363.9 191.1 364.7 192.8 363.5 198.0 364.2 199.8ZM360.0 204.5 361.3 205.3 361.4 207.4 358.8 207.3 356.9 208.5 355.8 207.1 355.5 207.8 359.1 214.3 357.9 214.8 355.5 210.7 356.5 214.3 355.5 216.3 353.7 214.9 352.5 215.7 352.7 214.0 351.8 213.2 352.8 213.0 352.0 209.2 352.5 207.7 353.6 206.1Z", 355.8, 193.4, 28.0],
    ["Andijon viloyati", "M450.9 164.3 452.8 166.0 455.2 166.3 455.3 167.6 457.1 168.0 459.3 170.6 460.4 170.9 466.2 170.5 466.4 172.1 469.8 169.9 471.3 171.0 473.8 170.8 474.0 171.6 472.1 173.6 464.6 177.7 463.9 181.3 461.6 181.4 460.8 183.9 459.7 184.1 455.7 182.6 453.7 180.9 453.0 181.3 453.6 184.5 455.5 186.3 455.3 188.1 454.2 189.1 451.3 187.9 449.7 188.0 451.0 186.9 450.0 186.7 449.1 182.8 447.3 182.5 446.1 181.4 445.1 182.1 439.9 181.7 437.9 179.6 436.1 179.1 433.5 178.8 433.4 179.6 431.4 176.9 432.1 176.0 431.2 174.5 432.7 172.6 437.8 171.2 443.9 171.6 446.6 171.0 447.4 167.1 449.9 166.2Z", 452.6, 173.9, 24.8],
    ["Toshkent shahri", "M366.5 158.4 369.0 159.5 368.8 160.8 369.6 162.1 366.5 165.1 365.7 165.0 365.4 163.9 365.0 164.3 364.0 162.8 363.4 163.0 364.2 160.0 365.6 158.5Z", 366.4, 161.5, 6.2]
  ];
  var CHEV = '<svg class="scope-chev" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M6 3.5 10.5 8 6 12.5"></path></svg>';
  var SVG_NS = "http://www.w3.org/2000/svg";
  var cells = {};
  var scopeSig = null;      // oxirgi chizilgan qamrov holati
  var wantFocus = false;    // fokus faqat QAMROV bilan ishlaganda ko'chadi
  var preRow = null;        // sichqoncha bosishi fokusni blur qiladi — kim turganini eslaymiz

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function mkSvg(tag, attrs) {
    var el = document.createElementNS(SVG_NS, tag);
    for (var k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  }

  /* Shakli shundan kichik hudud ko'z bilan topilmaydi va aniq bosilmaydi.
     Bunday hududga KO'RINADIGAN halqa va kattaroq bosish nishoni beriladi —
     Toshkent shahri viloyat ichida 7px lik dog' bo'lib qolardi.
     WCAG 2.5.8 (24×24) shu bilan qoplanadi; undan ham kichik qolsa
     ro'yxatdagi 44px lik qator TENG QIYMATLI boshqaruv bo'lib xizmat qiladi. */
  var TINY = 14;        // viewBox birligi
  var TINY_HIT = 11;    // nishon radiusi: 504px lik ustunda ~23px, 537px da ~24.6px

  function buildMap() {
    var svg = $("scopeSvg");
    svg.setAttribute("viewBox", MAP_VIEWBOX);
    var box = MAP_VIEWBOX.split(" ");
    /* Bosiladigan fon kataklardan OLDIN qo'yiladi: SVG da ustki element bosiladi,
       demak katak ustidagi bosish hududni, tashqarisidagi bosish respublikani beradi. */
    svg.appendChild(mkSvg("rect", { "class": "scope-back", x: "0", y: "0", width: box[2], height: box[3] }));
    MAP_SHAPES.forEach(function (shape) {
      var name = shape[0];
      // Nom reestrda topilmasa shakl chizilmaydi — hech qayerga olib bormaydigan hudud bosilmasin.
      if (NAMES.indexOf(name) < 0 || cells[name]) return;
      var g = mkSvg("g", { "class": "scope-cell", "data-r": name, "data-state": "idle" });
      var path = mkSvg("path", { "class": "scope-rg", d: shape[1] });
      var title = mkSvg("title", {});
      title.textContent = name + " · " + popText(GEO[name].pop) + " kishi (taxminiy)";
      path.appendChild(title); g.appendChild(path);
      if (shape[4] < TINY) {
        g.appendChild(mkSvg("circle", { "class": "scope-mark", cx: shape[2], cy: shape[3], r: 6.5 }));
        g.appendChild(mkSvg("circle", { "class": "scope-tap", cx: shape[2], cy: shape[3], r: TINY_HIT }));
      }
      svg.appendChild(g); cells[name] = g;
    });
  }

  /* Reestrdagi bo'shliq JIM qolmasin: ekran «hammasi shu yerda» degan taassurot bermasin. */
  function reportGaps() {
    var gaps = [], noCell = NAMES.filter(function (n) { return !cells[n]; });
    if (NO_POP.length) gaps.push("aholi soni yo‘q — " + NO_POP.join(", "));
    if (noCell.length) gaps.push("xaritada ko‘rsatilmagan — " + noCell.join(", "));
    if (!gaps.length) return;
    $("scopeCrumbs").insertAdjacentHTML("beforebegin",
      '<p class="note note-warn"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M10 2.9 18.6 17.4H1.4Z"></path><path d="M10 8.4v3.6M10 14.6h.01"></path></svg>' +
      '<span>Reestr to‘liq emas: ' + esc(gaps.join("; ")) + '. Bu hududlar uchun taxminiy raqam ham, respublika yig‘indisi ham ko‘rsatilmaydi.</span></p>');
  }

  function scopeRows() {
    if (state.scope === "region") {
      var ds = districtsOf(state.region);
      return Object.keys(ds).map(function (n, i) { return { kind: "district", name: n, pop: ds[n].pop, idx: i + 1, deep: true }; });
    }
    if (state.scope === "district" || state.scope === "mahalla") {
      var ms = mahallasOf(state.region, state.district);
      return Object.keys(ms).map(function (n, i) { return { kind: "mahalla", name: n, pop: ms[n], idx: i + 1 }; });
    }
    return NAMES.map(function (n, i) { return { kind: "region", name: n, pop: GEO[n].pop, idx: i + 1, deep: true }; });
  }

  /* `aria-current` — `aria-pressed` EMAS: qator «bosilgan/bo'shatilgan» emas,
     «hozirgi tanlov». Qayta bosish holatni o'zgartirmaydi, demak o'chirilishini
     va'da qilish yolg'on bo'lardi. */
  function renderScopeList() {
    var rows = scopeRows(), list = $("scopeList");
    if (!rows.length) {
      list.innerHTML = '<li class="scope-empty hint">Reestrda bu pog‘ona uchun yozuv yo‘q — qamrov yuqoridagi darajada qoladi.</li>';
      return rows;
    }
    list.innerHTML = rows.map(function (it) {
      var on = it.kind === "mahalla" && state.mahalla === it.name;
      return '<li><button type="button" class="scope-row" data-kind="' + it.kind + '" data-name="' + esc(it.name) + '"' +
        ' aria-describedby="scopeError"' + (on ? ' aria-current="true"' : "") + ">" +
        '<span class="scope-idx">' + pad(it.idx) + "</span>" +
        '<span class="scope-name">' + esc(it.name) + "</span>" +
        '<span class="scope-pop">' + popText(it.pop) + "</span>" + (it.deep ? CHEV : "") + "</button></li>";
    }).join("");
    return rows;
  }

  /* Crumb sof navigatsiya EMAS — u qamrovni o'sha darajaga KO'TARADI, shuning
     uchun label harakatni aytadi: «qaytish» desa, ko'r foydalanuvchi 450 ming
     o'rniga 35 millionni tasdiqlab qo'yardi. */
  function renderScopeCrumbs() {
    var el = $("scopeCrumbs");
    if (!state.scope) { el.innerHTML = '<span class="scope-crumb scope-crumb-off">Qamrov hali tanlanmagan</span>'; return; }
    var cr = [{ up: "republic", label: "O‘zbekiston", action: "Qamrovni butun respublikaga o‘zgartirish" }];
    if (state.region) cr.push({ up: "region", label: state.region, action: "Qamrovni butun " + state.region + "ga o‘zgartirish" });
    if (state.scope !== "region" && state.district) cr.push({ up: "district", label: state.district, action: "Qamrovni butun " + state.district + "ga o‘zgartirish" });
    if (state.scope === "mahalla" && state.mahalla) cr.push({ label: state.mahalla });
    el.innerHTML = cr.map(function (c, i) {
      var sep = i ? '<span class="scope-sep" aria-hidden="true">/</span>' : "";
      return sep + (i === cr.length - 1
        ? '<span class="scope-crumb" aria-current="true">' + esc(c.label) + "</span>"
        : '<button type="button" class="scope-crumb scope-crumb-btn" data-up="' + c.up + '" aria-label="' + esc(c.action) + '">' + esc(c.label) + "</button>");
    }).join("");
  }

  function renderScopeSum() {
    var sum = $("scopeSum");
    if (!state.scope) {
      sum.innerHTML = '<div class="empty"><span class="empty-icon"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M10 17.6S15.4 12.9 15.4 8.7A5.4 5.4 0 0 0 4.6 8.7C4.6 12.9 10 17.6 10 17.6Z"></path><circle cx="10" cy="8.6" r="2"></circle></svg></span>' +
        '<p class="empty-title">Qamrov tanlanmagan</p><p>Butun respublika uchun yuqoridagi tugmani bosing; tor qamrov uchun xaritadan hududni yoki ro‘yxatdan qatorni tanlang. Xabar kimga ketishini tizim o‘zi taxmin qilmaydi.</p></div>';
      return;
    }
    var reach = currentReach();
    var share = (reach == null || REPUBLIC_POP == null) ? null : (reach / REPUBLIC_POP) * 100;
    var tail = reach == null ? "reestrda bu pog‘ona uchun son yo‘q"
      : "kishi" + (state.scope === "republic" ? " · reestrdagi barcha hududlar"
        : share == null ? "" : " · reestrdagi jami aholining " + (share < 0.1 ? "0,1% dan kam" : "~" + share.toFixed(1).replace(".", ",") + "%"));
    sum.innerHTML = '<p class="eyebrow eyebrow-sm">Taxminiy qamrov</p>' +
      '<p class="scope-reach"><b>' + popText(reach) + "</b><span>" + tail + "</span></p>" +
      '<p class="scope-path">' + esc(scopePath().join(" / ")) + "</p>" +
      '<p class="hint">Raqam namuna reestridan olingan taxmin — aniq son emas; yuborishdan oldin reestrdan yangilanadi.</p>';
  }

  function rowByName(name) {
    var rows = $("scopeList").querySelectorAll(".scope-row"), i;
    for (i = 0; i < rows.length; i++) if (rows[i].getAttribute("data-name") === name) return rows[i];
    return null;
  }
  /* Yuqoriga chiqish tugmasi bo'lmasa (eng yuqori pog'ona) — doimiy tugma.
     ArrowLeft hech qachon hech qayerga olib bormay qolmaydi. */
  function upButton() {
    var b = $("scopeCrumbs").querySelectorAll(".scope-crumb-btn");
    return b.length ? b[b.length - 1] : $("scopeAll");
  }

  function renderScope() {
    if (state.dataFailed) return;
    var sig = [state.scope, state.region, state.district, state.mahalla].join("|");
    // Matn yozilayotganda `refresh()` sekundiga o'nlab marta chaqiriladi —
    // qamrov o'zgarmagan bo'lsa ro'yxatni qayta qurish bekorga DOM churn va
    // fokusni ushlab turgan qatorni yo'q qilish xavfi.
    if (sig === scopeSig && !wantFocus) return;
    var changed = sig !== scopeSig;
    scopeSig = sig;

    var list = $("scopeList");
    var active = document.activeElement === document.body && preRow ? preRow : document.activeElement;
    var keep = list.contains(active) ? active.getAttribute("data-name") : null;

    if (changed) { renderScopeCrumbs(); renderScopeSum(); }
    var rows = changed ? renderScopeList() : scopeRows();

    Object.keys(cells).forEach(function (n) {
      cells[n].setAttribute("data-state",
        state.scope === "republic" ? "on" : !state.region ? "idle" : n === state.region ? "on" : "dim");
    });
    var all = $("scopeAll");
    if (state.scope === "republic") all.setAttribute("aria-current", "true"); else all.removeAttribute("aria-current");

    var count = state.scope === "region" ? "Tumanlar va shaharlar · " + rows.length
      : (state.scope === "district" || state.scope === "mahalla") ? "Mahallalar (MFY) · " + rows.length
      : "Hududlar · " + NAMES.length;
    $("scopeLvl").textContent = count;
    /* Ekran o'quvchi uchun HAL QILUVCHI raqam — qamrov; yo'lning o'zi tanlov bo'lganini ham aytadi. */
    var reach = currentReach();
    $("scopeLive").textContent = state.scope
      ? scopePath().join(" / ") + " tanlandi. Taxminiy qamrov " + (reach == null ? "noma’lum" : popText(reach) + " kishi") + ". " + count + "."
      : "Qamrov tanlanmagan. " + count + ".";

    /* `innerHTML` fokusdagi tugmani yo'q qiladi — fokus <body> ga tushsa, keyingi
       Tab butun hujjat boshidan boshlanardi. Shuning uchun: o'sha nomli qator
       qolgan bo'lsa — o'sha; ro'yxat almashgan bo'lsa — birinchi qator;
       respublikaga chiqilgan bo'lsa — doimiy tugma. */
    if (wantFocus || keep != null) {
      var target = keep == null ? null : rowByName(keep);
      if (!target) {
        target = list.querySelector('.scope-row[aria-current="true"]') ||
          (state.scope === "republic" ? all : null) ||
          list.querySelector(".scope-row") || upButton();
      }
      if (target) target.focus();
    }
    wantFocus = false;
  }

  /* Turgan joying = qamroving. Yuqoriga chiqqanda pastdagi tanlov TOZALANADI —
     aks holda ekran «viloyat» deb turib, `state` ichida eski mahallani ushlab
     qolardi va u so'rov tanasiga tushardi. */
  function goScope(level, name, moveFocus) {
    if (level === "republic") { state.region = state.district = state.mahalla = ""; }
    else if (level === "region") { if (name) state.region = name; state.district = state.mahalla = ""; }
    else if (level === "district") { if (name) state.district = name; state.mahalla = ""; }
    else if (name) state.mahalla = name;
    // Joyi yo'q daraja O'RNATILMAYDI: «Tuman» deb turib tumani bo'sh qolgan
    // holat ekranni ham, so'rov tanasini ham yolg'onchi qilardi.
    if (level !== "republic" && !state[level]) return;
    state.scope = level;
    $("scopeError").hidden = true;
    wantFocus = !!moveFocus;
    refresh();
  }

  /* Xarita va ro'yxat bir-birini yoritadi — sichqoncha ostida ham, klaviatura fokusida ham. */
  function hotlight(target) {
    var near = target && target.closest && (target.closest(".scope-cell") || target.closest('.scope-row[data-kind="region"]'));
    var name = near ? near.getAttribute("data-r") || near.getAttribute("data-name") : null;
    /* Fon yoki doimiy tugma ustidagi kursor «hammasi» ni OLDINDAN ko'rsatadi:
       butun xarita yumshoq alangaga bo'yaladi va yorliq chiqadi. */
    var all = !near && !!(target && target.closest && (target.closest(".scope-back") || target.closest(".scope-all")));
    $("scope").setAttribute("data-allhot", all ? "true" : "false");
    $("scopeAll").setAttribute("data-hot", all ? "true" : "false");
    /* Shakl ichiga raqam sig'maydi — haqiqiy chegaralarda Toshkent shahri 7px.
       Shuning uchun ism xaritaning burchagidagi BITTA yorliqda chiqadi:
       to'qnashuv ham yo'q, kichik hudud ham nomsiz qolmaydi. */
    var hint = $("scopeHint"), label = all ? "Butun respublika"
      : name ? pad(NAMES.indexOf(name) + 1) + " · " + name : "";
    if (label) hint.textContent = label;
    hint.setAttribute("data-show", label ? "true" : "false");
    Object.keys(cells).forEach(function (k) { cells[k].setAttribute("data-hot", k === name ? "true" : "false"); });
    $("scopeList").querySelectorAll('.scope-row[data-kind="region"]').forEach(function (b) {
      b.setAttribute("data-hot", b.getAttribute("data-name") === name ? "true" : "false");
    });
  }

  /* `composer-data.js` yuklanmasa (deploy nomi o'zgargan, so'rov bloklangan)
     GEO bo'sh qoladi. Ilgari sahifa buni jimgina yutib, «~0 · butun respublika
     aholisi» deb yozardi va bu raqamni FAKT sifatida ko'rsatardi.
     Endi qadam bloklanadi va sabab aytiladi — so'ngan boshqaruv qoldirilmaydi,
     chunki u «bosib ko'ring» deb aldaydi. */
  function reportDataFailure() {
    state.dataFailed = true;
    var box = $("scopeError");
    box.textContent = "";
    var icon = document.createElementNS(SVG_NS, "svg");
    icon.setAttribute("viewBox", "0 0 16 16");
    icon.setAttribute("fill", "none");
    icon.setAttribute("stroke", "currentColor");
    icon.setAttribute("stroke-width", "1.6");
    icon.setAttribute("aria-hidden", "true");
    icon.innerHTML = '<circle cx="8" cy="8" r="6.5"/><path d="M8 5v3.6M8 11h.01" stroke-linecap="round"/>';
    box.appendChild(icon);
    box.appendChild(document.createTextNode(
      "Hudud ma’lumotlari yuklanmadi. Sahifani yangilang; muammo qolsa administratorga xabar bering."));
    box.hidden = false;
    $("scope").setAttribute("data-failed", "true");
    console.error("[composer] OM_GEO bo‘sh — composer-data.js yuklanmadi");
  }

  function initScope() {
    if (!NAMES.length) { reportDataFailure(); return; }
    buildMap();
    reportGaps();
    /* Tugma yozuvi bir marta yoziladi va boshqa o'zgarmaydi: respublika
       yig'indisi ham, hudud soni ham reestr bilan qotgan. Shu sababli
       `renderScope()` tugmani QAYTA YARATMAYDI — faqat holat atributini
       almashtiradi, demak undagi fokus saqlanadi. */
    $("scopeAllPop").textContent = popText(REPUBLIC_POP);
    $("scopeAllSub").textContent = "Reestrdagi barcha " + NAMES.length + " hudud" +
      (REPUBLIC_POP == null ? " · jami son noma’lum" : "");

    var root = $("scope");
    root.addEventListener("pointerdown", function () {
      preRow = $("scopeList").contains(document.activeElement) ? document.activeElement : null;
    });
    root.addEventListener("click", function (e) {
      var t = e.target;
      var row = t.closest && t.closest(".scope-row");
      var up = t.closest && t.closest(".scope-crumb-btn");
      var all = t.closest && t.closest(".scope-all");
      var cell = t.closest && t.closest(".scope-cell");
      var back = t.closest && t.closest(".scope-back");
      if (row) goScope(row.getAttribute("data-kind"), row.getAttribute("data-name"), true);
      else if (up) goScope(up.getAttribute("data-up"), null, true);
      /* Doimiy tugmada `moveFocus` YO'Q: tugma o'z joyida qoladi va `aria-current`
         bilan tanlovni o'zi tasdiqlaydi — fokusni ro'yxatga uloqtirish kerak emas. */
      else if (all) goScope("republic", null, false);
      else if (cell) goScope("region", cell.getAttribute("data-r"), false);
      else if (back) goScope("republic", null, false);
    });
    root.addEventListener("keydown", function (e) {
      var row = e.target.closest && e.target.closest(".scope-row");
      if (!row) return;
      var all = Array.prototype.slice.call($("scopeList").querySelectorAll(".scope-row"));
      var i = all.indexOf(row), to = -1, k = e.key;
      if (k === "ArrowDown") to = Math.min(i + 1, all.length - 1);
      else if (k === "ArrowUp") to = Math.max(i - 1, 0);
      else if (k === "Home") to = 0;
      else if (k === "End") to = all.length - 1;
      else if (k === "ArrowRight" && row.querySelector(".scope-chev")) {
        e.preventDefault();
        return goScope(row.getAttribute("data-kind"), row.getAttribute("data-name"), true);
      }
      /* ArrowLeft faqat FOKUSNI yuqoriga ko'chiradi: o'q tugmasi qamrovni
         tasdiqlamasin — tasdiq Enter/Space/bosish bilan, ataylab bo'ladi. */
      else if (k === "ArrowLeft") { var b = upButton(); if (b) { e.preventDefault(); b.focus(); } return; }
      else return;
      e.preventDefault();
      all[to].focus();
    });
    ["pointerover", "focusin"].forEach(function (t) {
      root.addEventListener(t, function (e) { hotlight(e.target); });
    });
    ["pointerleave", "focusout"].forEach(function (t) {
      root.addEventListener(t, function () { hotlight(null); });
    });
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
        var key = btn.getAttribute("data-tpl");
        var t = TEMPLATES[key];
        if (!t) {
          // Ilgari bu jim `return` edi: tugma bosilardi va HECH NIMA
          // bo'lmasdi — na matn, na xabar, na konsolda iz.
          console.error("[composer] ssenariy topilmadi: " + key);
          if (window.omToast) window.omToast("Ssenariy matni yuklanmadi — sahifani yangilang");
          return;
        }
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
  /* ---------------------------------------------------------------------------
     03 QACHON — takrorlanish va uning DAVRI
     Ekrandagi jumla, keyingi yuborish sanalari va so'rov tanasi BITTA
     manbadan chiqadi: `schedulePayload()` va `runs()`. Ular ajralib
     qololmaydi, chunki ekran ham, tana ham o'sha bitta hisobni o'qiydi.
  ------------------------------------------------------------------------- */
  /* 03-bo'limga tegishli xato qutilari — ular faqat bo'limga teginilgandan
     keyin ko'rsatiladi. */
  var WHEN_BOXES = ["errDate", "errTime", "errDays", "errRepeatTime", "errMonths", "errFrom", "errTo", "errRuns"];
  var ORDER = ["1", "2", "3", "4", "5", "6", "0"];          // Du..Ya — ekranda ham, tanada ham shu tartib
  var DAY_CODE = { "0": "SU", "1": "MO", "2": "TU", "3": "WE", "4": "TH", "5": "FR", "6": "SA" };
  var DAY_SHORT = { "1": "Du", "2": "Se", "3": "Ch", "4": "Pa", "5": "Ju", "6": "Sh", "0": "Ya" };
  var DAY_FULL = { "1": "dushanba", "2": "seshanba", "3": "chorshanba", "4": "payshanba",
                   "5": "juma", "6": "shanba", "0": "yakshanba" };
  var MONTH_SHORT = ["Yan", "Fev", "Mar", "Apr", "May", "Iyun", "Iyul", "Avg", "Sen", "Okt", "Noy", "Dek"];
  var TZID = "Asia/Tashkent";
  var TZ_OFFSET_MIN = 300;      // Asia/Tashkent butun yil qat'iy +05:00, yozgi vaqt yo'q
  var MAX_SCAN_DAYS = 4000;
  var MAX_RUNS = 500;

  /* Brauzer boshqa mintaqada bo'lsa ham hisob TOSHKENT devor soatida yuradi:
     bo'lim sarlavhasi «Toshkent vaqti · UTC+5» deb turibdi, demak ekrandagi
     har sana shu vaqtda o'qilishi kerak. Berlin yoki Tokioda ochilgan sahifa
     boshqa kunni ko'rsatsa, sarlavha yolg'on bo'lardi. */
  function tashNow() {
    var n = new Date();
    return new Date(n.getTime() + (n.getTimezoneOffset() + TZ_OFFSET_MIN) * 60000);
  }
  function pad2(n) { return (n < 10 ? "0" : "") + n; }
  /* `toISOString()` bu bo'limda TAQIQ: u UTC ga o'tkazadi va Toshkentda
     soat 05:00 gacha bir kun ORQAGA beradi. */
  function isoOf(d) { return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate()); }
  /* ISO satr HECH QACHON `new Date(str)` ga berilmaydi — u UTC deb o'qiladi va
     hafta kunini siljitadi. Komponentlar bo'yicha, soat 12:00 da quriladi:
     hech qanday ofset sanani boshqa kunga o'tkaza olmaydi. */
  function ymd(str) {
    var p = String(str).split("-");
    if (p.length !== 3) return null;
    var d = new Date(+p[0], +p[1] - 1, +p[2], 12, 0, 0);
    return isNaN(d) ? null : d;
  }

  /* Takrorlanish qoidasining SOF ko'rinishi — ekran ham, tana ham shundan
     oziqlanadi. Faol bo'lmagan tarmoq bu yerga tushmaydi. */
  function scheduleRule() {
    var days = ORDER.filter(function (d) { return state.days.indexOf(d) > -1; });
    var w;
    switch (state.span) {
      case "months": w = { kind: "months", months: state.months.slice().sort(function (a, b) { return a - b; }) }; break;
      case "range":  w = { kind: "range", from: $("fFrom").value || null, to: $("fTo").value || null }; break;
      default:       w = { kind: "always" };
    }
    // Ikki tarmoq birga chiqsa tana bilan ekran ajralgan bo'lardi — bu holat
    // tuzilish darajasida imkonsiz, lekin jimgina o'tib ketmasin.
    if (w.months && (w.from || w.to)) throw new Error("window ikki tarmoq");
    return { days: days, time: $("fRepeatTime").value || null, window: w };
  }

  /* Keyingi yuborish vaqtlari. Kalendar bo'ylab KUN-KUN yuriladi
     (`setDate(+1)`): millisekund qo'shish yozgi vaqtli mintaqada soatni
     siljitadi, `setMonth(+1)` esa 31-kunda oyni sakrab o'tadi. */
  function computeRuns(limit) {
    var rule = scheduleRule();
    if (!rule.days.length || !rule.time) return { list: [], capped: false };
    var w = rule.window;
    if (w.kind === "range" && (!w.from || !w.to)) return { list: [], capped: false };

    var hm = rule.time.split(":");
    var hh = +hm[0], mm = +hm[1];
    if (!isFinite(hh) || !isFinite(mm)) return { list: [], capped: false };

    var now = tashNow(), nowTs = now.getTime();
    var start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
    var stop = null;
    if (w.kind === "range") {
      var from = ymd(w.from), to = ymd(w.to);
      if (!from || !to) return { list: [], capped: false };
      if (from.getTime() > start.getTime()) start = from;
      stop = to;
    }
    var out = [], cursor = new Date(start.getTime()), scanned = 0;
    while (out.length < limit && scanned < MAX_SCAN_DAYS) {
      if (stop && cursor.getTime() > stop.getTime()) break;
      var dow = String(cursor.getDay());
      var monthOk = w.kind !== "months" || w.months.indexOf(cursor.getMonth() + 1) > -1;
      if (monthOk && rule.days.indexOf(dow) > -1) {
        var at = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate(), hh, mm, 0);
        // Chegara holati (aynan hozir) o'tgan deb hisoblanadi.
        if (at.getTime() > nowTs) out.push(at);
      }
      cursor.setDate(cursor.getDate() + 1);
      scanned++;
    }
    return { list: out, capped: scanned >= MAX_SCAN_DAYS && out.length < limit };
  }

  /* Hisob natijasi qoida + bugungi sana bo'yicha keshlanadi: matn yozilganda
     `refresh()` o'nlab marta chaqiriladi, ekspander esa qayta yurmasligi kerak. */
  var runsCache = { key: null, value: null };
  function runs(limit) {
    var key = JSON.stringify(scheduleRule()) + "|" + isoOf(tashNow()) + "|" + limit;
    if (runsCache.key !== key) runsCache = { key: key, value: computeRuns(limit) };
    return runsCache.value;
  }
  /* Faqat XATO MATNINI tanlash uchun: oraliqda umuman mos kun bormi, yoki
     bor-u hammasi o'tib ketganmi. Ikki sabab — ikki xil tuzatish. */
  function rangeHasAnyDay() {
    var rule = scheduleRule(), w = rule.window;
    if (w.kind !== "range" || !w.from || !w.to || !rule.days.length) return false;
    var from = ymd(w.from), to = ymd(w.to);
    if (!from || !to) return false;
    var cursor = new Date(from.getTime()), scanned = 0;
    while (cursor.getTime() <= to.getTime() && scanned < MAX_SCAN_DAYS) {
      if (rule.days.indexOf(String(cursor.getDay())) > -1) return true;
      cursor.setDate(cursor.getDate() + 1);
      scanned++;
    }
    return false;
  }

  /* Oraliqning O'ZI buzuq bo'lsa (teskari yoki mavjud bo'lmagan sana) hisob
     natijasi bo'sh chiqadi — lekin sabab «bu kun uchramaydi» EMAS. O'sha
     sababni aytish foydalanuvchini to'g'ri kun chipini almashtirishga
     majburlardi. Shuning uchun bunday holatda nol-natija tahlili umuman
     ishga tushmaydi. */
  function rangeBroken() {
    if (state.when !== "repeat" || state.span !== "range") return null;
    var from = $("fFrom"), to = $("fTo");
    if (from.validity.badInput || to.validity.badInput) return "badInput";
    if (from.value && to.value && to.value < from.value) return "inverted";
    return null;
  }

  function dayListText() {
    var picked = ORDER.filter(function (d) { return state.days.indexOf(d) > -1; });
    return picked.length ? picked.map(function (d) { return DAY_SHORT[d]; }).join(", ") : null;
  }
  function monthListText() {
    var m = state.months.slice().sort(function (a, b) { return a - b; });
    return m.length ? m.map(function (n) { return MONTH_SHORT[n - 1]; }).join(", ") : null;
  }
  /* Davr bo'lagi — o'z holicha. Kunlar tanlanmagan bo'lsa ham TUSHIB
     QOLMAYDI: ekranda ikki oy chipi bosilib turib, xulosada ular yo'q
     bo'lsa, ekran o'z tanlovini yashirgan bo'lardi. */
  function spanText() {
    if (state.span === "months") {
      var m = monthListText();
      return m ? "har yili " + m : "oylar tanlanmagan";
    }
    if (state.span === "range") {
      var f = $("fFrom").value, t = $("fTo").value;
      return (f && t) ? f + " — " + t : "oraliq tanlanmagan";
    }
    return "har hafta";
  }

  function whenText() {
    if (state.when === "now") return "Hoziroq";
    if (state.when === "later") {
      var d = $("fDate").value, t = $("fTime").value;
      if (!d) return "Sana tanlanmagan";
      if (!t) return d + " · vaqt tanlanmagan";
      return d + " · " + t;
    }
    /* Uch mustaqil bo'lak, erta `return` YO'Q: ilgari kunlar bo'sh bo'lsa
       funksiya shu yerda chiqib ketib, ekranda turgan davr tanlovini
       xulosadan butunlay yutib yuborardi. */
    var parts = [dayListText() || "Kunlar tanlanmagan"];
    parts.push($("fRepeatTime").value || "vaqt tanlanmagan");
    parts.push(spanText());
    if (scheduleReady() && !rangeBroken()) {
      var r = runs(1);
      if (!r.capped && !r.list.length) parts.push("hech qachon yuborilmaydi");
    }
    return parts.join(" · ");
  }

  /* Jadval bo'lagining o'zi to'liqmi — `#rcWhen` ning `data-empty` si va
     status matni shundan hal bo'ladi. */
  function scheduleReady() {
    if (state.when !== "repeat") return true;
    if (!state.days.length || !$("fRepeatTime").value) return false;
    if (state.span === "months") return state.months.length > 0;
    if (state.span === "range") return !!($("fFrom").value && $("fTo").value);
    return true;
  }

  /* So'rov tanasidagi `schedule` obyekti. `days` o'rniga `byday`: qiymat
     formati o'zgardi, demak NOM ham o'zgaradi — bir xil nom ostida boshqa
     format jim noto'g'ri o'qishga olib boradi. */
  function schedulePayload() {
    if (state.when === "now") return { mode: "now" };
    if (state.when === "later") {
      return { mode: "at", date: $("fDate").value || null, time: $("fTime").value || null, tzid: TZID };
    }
    var rule = scheduleRule();
    var first = runs(1).list[0] || null;
    var body = {
      mode: "weekly",
      tzid: TZID,
      byday: rule.days.map(function (d) { return DAY_CODE[d]; }),
      time: rule.time,
      window: rule.window,
      // `dtstart` TAXMIN emas: u ekrandagi BIRINCHI chipning aynan o'zi.
      dtstart: first ? isoOf(first) + "T" + pad2(first.getHours()) + ":" + pad2(first.getMinutes()) + ":00" : null,
      until: null
    };
    if (rule.window.kind === "range" && rule.window.to) {
      /* Sof SATR arifmetikasi: mahalliy 23:59:59 − 5 soat = O'SHA kunning
         18:59:59Z si. `Date` bilan hisoblash yil chegarasida kunni surib
         yuborardi. RFC 5545: DTSTART — TZID bilan, UNTIL — UTC. */
      body.until = rule.window.to.replace(/-/g, "") + "T185959Z";
    }
    body.rrule = buildRrule(body);
    return body;
  }

  function buildRrule(body) {
    if (!body.dtstart || !body.byday.length) return null;
    var parts = ["FREQ=WEEKLY", "BYDAY=" + body.byday.join(",")];
    if (body.window.kind === "months" && body.window.months.length) {
      parts.push("BYMONTH=" + body.window.months.join(","));
    }
    if (body.until) parts.push("UNTIL=" + body.until);
    return "DTSTART;TZID=" + TZID + ":" + body.dtstart.replace(/[-:]/g, "") + "\n" +
      "RRULE:" + parts.join(";");
  }

  /* ---------------------------------------------------------------------------
     KEYINGI YUBORISHLAR — ekranning eng halol qismi.
     `refresh()` da HAR SAFAR to'liq qayta chiziladi: avval hammasi yopiladi,
     keyin joriy holatga mos BITTASI ochiladi. Erta `return` bo'lsa rejim
     almashgach eski ogohlantirish qotib qolardi.
  ------------------------------------------------------------------------- */
  function renderRuns() {
    var chips = $("runsChips"), empty = $("runsEmpty"), sum = $("runsSum"), box = $("runs");
    chips.innerHTML = ""; chips.hidden = true;
    empty.hidden = true;
    sum.textContent = ""; sum.removeAttribute("data-tone");
    box.hidden = state.when !== "repeat";
    if (state.when !== "repeat") return;

    if (!scheduleReady()) {
      sum.textContent = "Kunlar, vaqt va davr tanlangach keyingi yuborish sanalari shu yerda chiqadi.";
      return;
    }
    var broken = rangeBroken();
    if (broken) {
      sum.textContent = broken === "inverted"
        ? "Oraliq teskari — sanalar to‘g‘rilangach keyingi yuborishlar shu yerda chiqadi."
        : "Sana to‘liq emas — to‘g‘rilangach keyingi yuborishlar shu yerda chiqadi.";
      return;
    }
    var r = runs(3);
    if (r.capped) {
      // Chegara urilgani «hech qachon» DEGANI EMAS — bilmaganimizni aytamiz.
      sum.textContent = "Hisoblash chegarasi: birinchi yuborish juda uzoqda, sanalar ko‘rsatilmadi.";
      return;
    }
    if (!r.list.length) {
      empty.hidden = false;
      $("runsEmptyBody").textContent = rangeHasAnyDay()
        ? "Bu oraliqdagi barcha yuborish vaqtlari allaqachon o‘tib ketgan."
        : "Tanlangan oraliqda " + (dayListText() || "tanlangan kun") + " kuni umuman uchramaydi.";
      return;
    }
    chips.hidden = false;
    chips.innerHTML = r.list.map(function (d) {
      return '<span class="run-chip" role="listitem"><b>' + isoOf(d) + "</b><span>" +
        DAY_FULL[String(d.getDay())] + ", " + pad2(d.getHours()) + ":" + pad2(d.getMinutes()) + "</span></span>";
    }).join("");

    var first = r.list[0];
    var days = Math.round((first.getTime() - tashNow().getTime()) / 86400000);
    if (state.span === "months" && state.months.length === 12) {
      sum.textContent = "12 oyning hammasi tanlangan — bu «Doimiy» bilan bir xil natija beradi.";
      sum.setAttribute("data-tone", "warn");
    } else if (days > 60) {
      sum.textContent = "Birinchi yuborish " + isoOf(first) + ", " + DAY_FULL[String(first.getDay())] +
        " — taxminan " + Math.round(days / 30) + " oydan keyin. Shu yil kerak bo‘lsa, bugundan keyingi oylardan birini ham belgilang.";
      sum.setAttribute("data-tone", "warn");
    } else if (state.span === "range") {
      var all = runs(MAX_RUNS);
      // Son FORMULA bilan chiqarilmaydi — u chiplarni bergan ekspanderning o'zi.
      var n = all.list.length;
      sum.textContent = n === 1
        ? "Bu oraliqda atigi bir marta yuboriladi — «Belgilangan vaqtda» rejimi shunga mos keladi."
        : "Bu oraliqda jami " + n + (all.capped ? "+" : "") + " marta yuboriladi.";
      if (n === 1) sum.setAttribute("data-tone", "warn");
    } else {
      sum.textContent = "Birinchi yuborish " + isoOf(first) + ", " + DAY_FULL[String(first.getDay())] + ".";
    }
  }

  /* Jonli soha: bir xil satrni qayta yozish ham e'lon qo'zg'atadi, shuning
     uchun faqat HAQIQATAN o'zgargan matn yoziladi. */
  var liveLast = {};
  function setLive(id, text) {
    if (liveLast[id] === text) return;
    liveLast[id] = text;
    $(id).textContent = text;
  }

  /* Ikkala chip qatori (kunlar va oylar) BIR XIL klaviatura modeli:
     ←/→ faqat fokusni ko'chiradi, Space/Enter tanlaydi, Home/End chekkaga.
     Ilgari 7 ta kun chipi 7 ta alohida Tab to'xtashi edi. */
  function wireToggleRow(row, attr, onToggle) {
    var items = Array.prototype.slice.call(row.querySelectorAll("[" + attr + "]"));
    function syncStops() {
      var on = items.filter(function (i) { return i.getAttribute("aria-pressed") === "true"; })[0];
      items.forEach(function (i) { i.tabIndex = i === (on || items[0]) ? 0 : -1; });
    }
    row.addEventListener("click", function (e) {
      var btn = e.target.closest ? e.target.closest("[" + attr + "]") : null;
      if (!btn || !row.contains(btn)) return;
      var on = btn.getAttribute("aria-pressed") === "true";
      btn.setAttribute("aria-pressed", on ? "false" : "true");
      onToggle(btn.getAttribute(attr), !on);
      syncStops();
    });
    row.addEventListener("keydown", function (e) {
      var btn = e.target.closest ? e.target.closest("[" + attr + "]") : null;
      if (!btn) return;
      var i = items.indexOf(btn), to = -1;
      if (e.key === "ArrowRight") to = Math.min(i + 1, items.length - 1);
      else if (e.key === "ArrowLeft") to = Math.max(i - 1, 0);
      else if (e.key === "Home") to = 0;
      else if (e.key === "End") to = items.length - 1;
      else return;
      e.preventDefault();
      items[to].focus();
    });
    syncStops();
  }

  function initWhen() {
    wireRadioGroup($("whenGroup"), function (el) {
      state.when = el.getAttribute("data-when");
      $("whenLater").hidden = state.when !== "later";
      $("whenRepeat").hidden = state.when !== "repeat";
      // Rejim almashdi — endi ochilgan panel qizil bo'lib qarshi olmasin.
      state.whenTouched = false;
      refresh();
    });

    wireRadioGroup($("spanGroup"), function (el) {
      state.span = el.getAttribute("data-span");
      $("spanMonths").hidden = state.span !== "months";
      $("spanRange").hidden = state.span !== "range";
      $("spanHint").textContent = state.span === "months"
        ? "Har yili faqat tanlangan oylarda qaytadi. Faqat shu yilgi bo‘lsa, «Sana oralig‘i» ni tanlang."
        : state.span === "range"
          ? "Oraliq tugagach butunlay to‘xtaydi. Har yili qaytarish uchun «Tanlangan oylar» ni tanlang."
          : "To‘xtatilmaguncha har hafta takrorlanadi.";
      state.whenTouched = false;
      refresh();
    });

    wireToggleRow($("dayRow"), "data-day", function (day, on) {
      state.days = on ? state.days.concat(day) : state.days.filter(function (d) { return d !== day; });
      state.whenTouched = true;
      refresh();
    });
    wireToggleRow($("monthRow"), "data-month", function (month, on) {
      var n = +month;
      state.months = on ? state.months.concat(n) : state.months.filter(function (m) { return m !== n; });
      state.whenTouched = true;
      refresh();
    });

    /* Maydonlar qo'lda sanalmaydi: 03-bo'limga kelajakda qo'shiladigan har
       qanday input avtomatik ulanadi. `input` ham, `change` ham kerak —
       `type=date` klaviaturadan yozilganda `change` kech keladi. */
    document.querySelectorAll("#whenLater input, #whenRepeat input").forEach(function (el) {
      ["input", "change"].forEach(function (ev) {
        el.addEventListener(ev, function () { state.whenTouched = true; refresh(); });
      });
    });

    syncDateBounds();
    /* Sahifa yarim tundan oshib ochiq qolsa «bugun» eskirib qoladi.
       Ko'rinishga qaytilganda va kun almashganda qayta hisoblanadi. */
    document.addEventListener("visibilitychange", function () { if (!document.hidden) refresh(); });
  }

  /* `min` FAQAT qulaylik: qo'lda yozilgan sanani u to'xtatmaydi, shuning
     uchun tekshiruv qoidalari unga umuman tayanmaydi. */
  function syncDateBounds() {
    var today = isoOf(tashNow());
    $("fDate").min = today;
    $("fFrom").min = today;
    $("fTo").min = $("fFrom").value || today;
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
    var problems = [], added = 0, rejected = 0;
    // `problems` — sabablar RO'YXATI (takrorlanmaydi), `rejected` — rad
    // etilgan FAYLLAR soni. Ikkisi bir xil emas: 3 ta fayl bitta sabab
    // bilan rad etilsa, ro'yxatda bitta qator, lekin fayl uchta.
    function pushProblem(msg) {
      rejected++;
      if (problems.indexOf(msg) === -1) problems.push(msg);
    }
    $("errFiles").hidden = true;      // eski xabar yangi urinishga qolib ketmasin
    Array.prototype.forEach.call(list, function (file) {
      // Bir xil sabab takrorlanmasin: 3 ta fayl chegaradan oshsa,
      // «5 tadan ortiq…» jumlasi uch marta yozilib chiqardi.
      if (state.files.length >= MAX_FILES) { pushProblem("5 tadan ortiq fayl qo‘shib bo‘lmaydi"); return; }
      if (file.size > MAX_BYTES) { pushProblem("“" + file.name + "” 10 MB dan katta"); return; }
      if (!/\.(pdf|jpe?g|png)$/i.test(file.name)) { pushProblem("“" + file.name + "” — faqat PDF, JPG yoki PNG"); return; }
      state.files.push({ name: file.name, size: file.size });
      added++;
    });
    var err = $("errFiles");
    if (problems.length) {
      // Ilgari faqat BIRINCHI muammo ko'rsatilardi: 6 ta fayl tashlansa
      // qaysilari rad etilgani bilinmasdi.
      err.textContent = "";
      var icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      icon.setAttribute("viewBox", "0 0 16 16");
      icon.setAttribute("fill", "none");
      icon.setAttribute("stroke", "currentColor");
      icon.setAttribute("stroke-width", "1.6");
      icon.setAttribute("aria-hidden", "true");
      icon.innerHTML = '<circle cx="8" cy="8" r="6.5"/><path d="M8 5v3.6M8 11h.01" stroke-linecap="round"/>';
      err.appendChild(icon);
      err.appendChild(document.createTextNode(
        added + " ta qo‘shildi, " + rejected + " tasi rad etildi: " + problems.join(" · ")));
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
        // «5 tadan ortiq» xabari o'chirishdan keyin ham turib qolardi —
        // ya'ni u endi mavjud bo'lmagan chegarani da'vo qilardi.
        $("errFiles").hidden = true;
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

    // Ma'lumot yo'q bo'lsa forma umuman yuborilmaydi; xabar `scopeError`
    // da allaqachon turibdi, uni bosib ketmaymiz.
    if (state.dataFailed) {
      errors.push({
        el: null, box: $("scopeError"),
        msg: "Hudud ma’lumotlari yuklanmadi. Sahifani yangilang; muammo qolsa administratorga xabar bering."
      });
    }
    else if (!state.scope) errors.push({ el: $("scopeAll"), box: $("scopeError"), msg: null });

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
    if (state.when === "repeat") {
      if (!state.days.length) {
        errors.push({ el: $("dayRow").querySelector("[data-day]"), invalid: $("dayRow"),
          box: $("errDays"), msg: "Kamida bitta kunni tanlang." });
      }
      // Maydon yulduzcha bilan majburiy deb belgilangan edi, lekin hech
      // qayerda tekshirilmasdi: bo'sh qoldirilsa ekran «Hammasi
      // to'ldirilgan» deb turardi va ko'rinishda 09:00 paydo bo'lardi.
      if (!$("fRepeatTime").value) {
        errors.push({ el: $("fRepeatTime"), box: $("errRepeatTime"), msg: "Takroriy yuborish vaqtini tanlang." });
      }

      if (state.span === "months" && !state.months.length) {
        errors.push({ el: $("monthRow").querySelector("[data-month]"), invalid: $("monthRow"),
          box: $("errMonths"), msg: "Kamida bitta oyni tanlang — masalan Sen va Okt." });
      }

      if (state.span === "range") {
        var from = $("fFrom"), to = $("fTo");
        var today = isoOf(tashNow());
        /* `badInput` — mavjud bo'lmagan sana (29.02.2027): brauzer `.value` ni
           BO'SH qaytaradi, lekin maydonda raqamlar ko'rinib turadi. «Sanani
           tanlang» deyish foydalanuvchini adashtirardi — u sanani ko'rib turibdi. */
        if (from.validity.badInput) {
          errors.push({ el: from, box: $("errFrom"), kind: "rule", msg: "Bu sana mavjud emas — mavjud sanani tanlang (masalan 2027-02-28)." });
        } else if (!from.value) {
          errors.push({ el: from, box: $("errFrom"), msg: "Boshlanish sanasini tanlang." });
        } else if (from.value < today) {
          errors.push({ el: from, box: $("errFrom"), kind: "rule", msg: "Boshlanish sanasi o‘tib ketgan — bugungi yoki kelgusi sanani tanlang." });
        }

        if (to.validity.badInput) {
          errors.push({ el: to, box: $("errTo"), kind: "rule", msg: "Bu sana mavjud emas — mavjud sanani tanlang." });
        } else if (!to.value) {
          errors.push({ el: to, box: $("errTo"), msg: "Tugash sanasini tanlang yoki «Doimiy» ni belgilang." });
        } else if (from.value && to.value < from.value) {
          /* Teskari oraliqda nol-natija tahlili UMUMAN ishga tushmaydi:
             «bu kun uchramaydi» deyish YOLG'ON sabab bo'lardi va foydalanuvchini
             to'g'ri kun chipini almashtirishga majburlardi. */
          errors.push({ el: to, box: $("errTo"), kind: "rule",
            msg: "Tugash sanasini boshlanish sanasidan keyinga qo‘ying — " + from.value + " dan keyingi sanani tanlang." });
        }
      }

      /* Nol natija — MAYDON bo'sh emas, QOIDA ishlamaydi. Shuning uchun
         `kind: "rule"`: status qatori «N ta maydon to'ldirilishi kerak»
         deb yozsa, u ochiq yolg'on bo'lardi. */
      if (!errors.length && scheduleReady() && !rangeBroken()) {
        var r = runs(1);
        if (!r.capped && !r.list.length) {
          errors.push({ el: state.span === "range" ? $("fTo") : $("dayRow").querySelector("[data-day]"),
            box: $("errRuns"), kind: "rule",
            msg: rangeHasAnyDay()
              ? "Bu oraliqdagi barcha yuborish vaqtlari o‘tib ketgan — tugash sanasini uzaytiring yoki kechroq vaqt qo‘ying."
              : ($("fFrom").value + " — " + $("fTo").value + " oralig‘ida " + (dayListText() || "tanlangan kun") +
                 " kuni uchramaydi — tugash sanasini uzaytiring yoki boshqa kun tanlang.") });
        }
      }
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
      /* Chip qatorlarida nishon — `role="toolbar"` konteyner: chipning o'ziga
         `aria-invalid` qo'yib bo'lmaydi, konteynersiz esa fokus chipga
         qaytganda xato holati butunlay yo'qolardi. */
      var invalidTarget = e.invalid || (e.el && e.el.tagName !== "BUTTON" ? e.el : null);
      if (invalidTarget) invalidTarget.setAttribute("aria-invalid", "true");
    });
  }

  /* ---------------------------------------------------------------------------
     YANGILASH — bitta funksiya butun ko'rinishni state'dan qayta chizadi.
     Har boshqaruv o'z bo'lagini alohida yangilasa, ular vaqt o'tib
     bir-biridan uzilib qoladi.
  ------------------------------------------------------------------------- */
  function refresh() {
    // Forma o'zgardi — pastdagi so'rov tanasi endi ekranga mos emas.
    // Uni qoldirish sahifani bir vaqtda «to'ldirilmagan» va «mana
    // tayyor tanangiz» deb turishga majbur qilardi.
    // Lekin TANAGA kirmaydigan o'zgarish (ko'rinish tili) panelni
    // o'chirmasligi kerak, shuning uchun imzo bo'yicha solishtiriladi.
    var slot = $("resultSlot");
    if (slot.firstChild && payloadSignature() !== renderedSignature) slot.innerHTML = "";

    // --- jadval ---
    // `min` HAR SAFAR qayta yoziladi: sahifa yarim tundan oshib ochiq qolsa
    // boot da bir marta yozilgan «bugun» eskirib qolardi.
    syncDateBounds();
    renderRuns();

    // --- qamrov ---
    renderScope();
    var path = scopePath();
    var reachNum = currentReach();
    var reach = reachNum == null ? null : formatPop(reachNum);

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
    // Tanlanmagan vaqt o'rniga 09:00 QO'YILMAYDI — ilgari ko'rinish
    // operator kiritmagan vaqtni ko'rsatib turardi.
    var pvTime = state.when === "now" ? "hozir"
      : state.when === "repeat" ? $("fRepeatTime").value
      : $("fTime").value;
    $("pvTime").textContent = pvTime || "—";

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
    /* To'liq bo'lmagan yoki nol natijali jadval matni KO'RINIB turadi, lekin
       `data-empty="true"` bilan bo'zaradi va qolgan besh qator bilan bir xil
       qoidaga bo'ysunadi. */
    setRecap("rcWhen", scheduleReady() ? whenText() : "", whenText());
    setRecap("rcFiles", state.files.length ? state.files.length + " ta fayl" : "", "yo‘q");

    // --- holat qatori ---
    var errors = validate();
    var status = $("status"), text = $("statusText");
    if (!errors.length) {
      status.setAttribute("data-tone", "ok");
      text.textContent = "Hammasi to‘ldirilgan";
    } else {
      status.setAttribute("data-tone", state.submitted ? "crit" : "");
      /* Nol natijali jadval xatosi «1 ta maydon to'ldirilishi kerak» deb
         yozilardi, holbuki BIRORTA maydon bo'sh emas edi. */
      var hasRule = errors.some(function (e) { return e.kind === "rule"; });
      text.textContent = hasRule
        ? errors.length + " ta muammo bor — 03-bo‘limni tekshiring"
        : errors.length + " ta maydon to‘ldirilishi kerak";
    }
    /* 03-bo'limga tegishli xatolar faqat foydalanuvchi o'sha bo'limga
       TEGGANDAN keyin (yoki «Navbatga qo'yish» bosilgandan keyin) ko'rsatiladi:
       rejim almashtirilgan zahoti panel qip-qizil ochilib qarshi olardi. */
    var shown = state.whenTouched ? errors : errors.filter(function (e) {
      return !e.box || WHEN_BOXES.indexOf(e.box.id) < 0;
    });
    if (state.submitted) showErrors(shown);
    return errors;
  }

  /* So'rov tanasiga KIRADIGAN holatning imzosi. Ko'rinish tili, fokus,
     ochiq-yopiq bo'limlar bu yerga kirmaydi. */
  var renderedSignature = null;
  function payloadSignature() {
    return [
      state.scope, state.region, state.district, state.mahalla,
      $("uzTitle").value, $("uzBody").value, $("ruTitle").value, $("ruBody").value,
      /* Jadval qismi tananing O'ZIDAN olinadi — yangi maydonni imzoga
         qo'shishni unutib bo'lmaydi. Qolgan qismlar (qamrov, matn, fayl)
         SAQLANADI: ularni tashlab yuborish sarlavha tahrirlanganda panelni
         eskirtirib qo'yardi. */
      JSON.stringify(schedulePayload()),
      /* `badInput` da `.value` bo'sh bo'lib qoladi, ya'ni imzo o'zgarmasdi
         va eski JSON paneli ekranda qolib ketardi. */
      $("fDate").validity.badInput, $("fFrom").validity.badInput, $("fTo").validity.badInput,
      isoOf(tashNow()),
      state.files.map(function (f) { return f.name + ":" + f.size; }).join(",")
    ].join("|");
  }

  /* ---------------------------------------------------------------------------
     YUBORISH — server yo'q, shuning uchun MUVAFFAQIYAT DA'VO QILINMAYDI.
  ------------------------------------------------------------------------- */
  function initSubmit() {
    $("submitBtn").addEventListener("click", function () {
      state.submitted = true;
      state.whenTouched = true;   // yuborishga urinildi — endi 03 xatolari ham ko'rinadi
      var errors = refresh();
      if (errors.length) {
        var first = errors[0].el;
        if (first) { first.focus(); first.scrollIntoView({ block: "center", behavior: "smooth" }); }
        if (window.omToast) {
          window.omToast(state.dataFailed
            ? "Hudud ma’lumotlari yuklanmadi — yuborib bo‘lmaydi"
            : errors.length + " ta maydon to‘ldirilmagan");
        }
        return;
      }
      runSubmit();
    });

    $("resetBtn").addEventListener("click", function () {
      if (!window.confirm("Barcha kiritilgan ma’lumot o‘chiriladi. Davom etamizmi?")) return;
      window.location.reload();
    });
  }

  /* Bu yerda kutiladigan hech narsa yo'q: tekshiruv `click` ichida
     sinxron tugaydi, tana esa darhol yig'iladi. Ilgari 700ms lik
     kechikish va «Tekshirilmoqda» yozuvi bor edi — ular bo'lmagan
     ishni bo'layotgandek ko'rsatardi. Javob endi darhol chiqadi;
     tugma bosilganini panelning o'zi va toast tasdiqlaydi. */
  function runSubmit() {
    renderDemoResult();
    $("resultSlot").scrollIntoView({ block: "center", behavior: "smooth" });
  }

  function renderDemoResult() {
    // Daraja bo'yicha kesish — `goScope` bilan birga ikkinchi himoya.
    // Tana HECH QACHON o'z `scope_level` idan chuqurroq hudud ko'rsatmasin.
    var depth = LEVELS.indexOf(state.scope);
    var payload = {
      scope_level: state.scope,
      region:   depth >= 1 ? (state.region || null) : null,
      district: depth >= 2 ? (state.district || null) : null,
      mahalla:  depth >= 3 ? (state.mahalla || null) : null,
      body: {
        uz: { title: $("uzTitle").value.trim(), text: $("uzBody").value.trim() },
        ru: { title: $("ruTitle").value.trim(), text: $("ruBody").value.trim() }
      },
      schedule: schedulePayload(),
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
    renderedSignature = payloadSignature();
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
