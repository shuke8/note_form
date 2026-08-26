/* =============================================================================
   GEOGRAFIYA — 14 hudud.

   Hudud va tuman nomlari real. Aholi raqamlari — NAMUNA to'plami:
   viloyat darajasi ochiq statistikaga yaqin yaxlitlangan qiymat, tuman va
   mahalla darajasi esa interfeys qamrov hajmini ko'rsata olishi uchun
   ko'rsatma raqamlar. Real qiymatlar reestrdan keladi; shuning uchun
   ekranda ular doim "~" bilan va "taxminiy" yorlig'i ostida chiqadi.

   Har tuman ro'yxatida bir nechta MFY namunasi bor — to'liq ro'yxat emas.
   ========================================================================== */
window.OM_GEO = {
  "Qoraqalpog‘iston Respublikasi": { pop: 1900000, districts: {
    "Nukus shahri":     { pop: 330000, mahallas: { "1-mahalla": 3100, "Bereke MFY": 2600, "Do‘stlik MFY": 2900 } },
    "Xo‘jayli tumani":  { pop: 120000, mahallas: { "Markaz MFY": 2400, "Yangiobod MFY": 1900 } },
    "Chimboy tumani":   { pop: 105000, mahallas: { "Chimboy MFY": 2200, "Oqdaryo MFY": 1700 } } } },

  "Andijon viloyati": { pop: 3300000, districts: {
    "Andijon shahri":   { pop: 450000, mahallas: { "Bog‘ishamol MFY": 3400, "Navbahor MFY": 2800, "Yangiobod MFY": 3100 } },
    "Asaka tumani":     { pop: 175000, mahallas: { "Asaka MFY": 2500, "Mustaqillik MFY": 2100 } },
    "Xonobod shahri":   { pop:  95000, mahallas: { "Xonobod MFY": 2300, "Guliston MFY": 1800 } } } },

  "Buxoro viloyati": { pop: 2000000, districts: {
    "Buxoro shahri":    { pop: 290000, mahallas: { "Registon MFY": 2700, "Sitorai MFY": 2200, "Xoja MFY": 2500 } },
    "G‘ijduvon tumani": { pop: 190000, mahallas: { "G‘ijduvon MFY": 2600, "Damashqon MFY": 2000 } },
    "Kogon shahri":     { pop:  65000, mahallas: { "Kogon MFY": 2100, "Temiryo‘l MFY": 1600 } } } },

  "Farg‘ona viloyati": { pop: 3800000, districts: {
    "Farg‘ona shahri":  { pop: 290000, mahallas: { "Yangi Farg‘ona MFY": 3000, "Sanoat MFY": 2400 } },
    "Marg‘ilon shahri": { pop: 230000, mahallas: { "Marg‘ilon MFY": 2800, "Hunarmand MFY": 2300 } },
    "Qo‘qon shahri":    { pop: 260000, mahallas: { "Qo‘qon MFY": 2900, "Xonqadam MFY": 2200 } } } },

  "Jizzax viloyati": { pop: 1400000, districts: {
    "Jizzax shahri":    { pop: 190000, mahallas: { "Sharq MFY": 2500, "Yangihayot MFY": 2000 } },
    "Zomin tumani":     { pop: 100000, mahallas: { "Zomin MFY": 2200, "Tog‘li MFY": 1400 } } } },

  "Xorazm viloyati": { pop: 1900000, districts: {
    "Urganch shahri":     { pop: 155000, mahallas: { "Urganch MFY": 2600, "Al-Xorazmiy MFY": 2100 } },
    "Xiva shahri":        { pop:  95000, mahallas: { "Ichan qal’a MFY": 1800, "Dishan qal’a MFY": 2000 } },
    "Qo‘shko‘pir tumani": { pop: 125000, mahallas: { "8-mahalla “Do‘stlik”": 2400, "Yangiariq MFY": 1900, "Bog‘ot MFY": 2100 } } } },

  "Namangan viloyati": { pop: 2900000, districts: {
    "Namangan shahri":  { pop: 640000, mahallas: { "Davlatobod MFY": 3300, "Yangi Namangan MFY": 2900 } },
    "Chust tumani":     { pop: 155000, mahallas: { "Chust MFY": 2400, "Yorqo‘rg‘on MFY": 1900 } } } },

  "Navoiy viloyati": { pop: 1000000, districts: {
    "Navoiy shahri":     { pop: 145000, mahallas: { "Navoiy MFY": 2500, "Sanoat MFY": 2000 } },
    "Zarafshon shahri":  { pop:  85000, mahallas: { "Zarafshon MFY": 2200, "Konchi MFY": 1700 } } } },

  "Qashqadaryo viloyati": { pop: 3400000, districts: {
    "Qarshi shahri":     { pop: 275000, mahallas: { "Qarshi MFY": 2800, "Yangiobod MFY": 2300 } },
    "Shahrisabz shahri": { pop: 110000, mahallas: { "Shahrisabz MFY": 2400, "Oqsaroy MFY": 1900 } } } },

  "Samarqand viloyati": { pop: 4000000, districts: {
    "Samarqand shahri":     { pop: 560000, mahallas: { "Registon MFY": 3200, "Siyob MFY": 2700, "Universitet MFY": 2500 } },
    "Kattaqo‘rg‘on shahri": { pop:  90000, mahallas: { "Kattaqo‘rg‘on MFY": 2300, "Payariq MFY": 1800 } } } },

  "Sirdaryo viloyati": { pop: 900000, districts: {
    "Guliston shahri":  { pop:  85000, mahallas: { "Guliston MFY": 2200, "Yangiyer MFY": 1700 } },
    "Shirin shahri":    { pop:  30000, mahallas: { "Shirin MFY": 1600, "Energetik MFY": 1300 } } } },

  "Surxondaryo viloyati": { pop: 2700000, districts: {
    "Termiz shahri":    { pop: 185000, mahallas: { "Termiz MFY": 2600, "Amudaryo MFY": 2100 } },
    "Denov tumani":     { pop: 265000, mahallas: { "Denov MFY": 2800, "Sho‘rchi MFY": 2200 } } } },

  "Toshkent viloyati": { pop: 3000000, districts: {
    "Nurafshon shahri": { pop:  55000, mahallas: { "Nurafshon MFY": 2000, "Yangiobod MFY": 1600 } },
    "Chirchiq shahri":  { pop: 170000, mahallas: { "Chirchiq MFY": 2500, "Kimyogar MFY": 2000 } },
    "Zangiota tumani":  { pop: 195000, mahallas: { "Zangiota MFY": 2600, "Eshonguzar MFY": 2100 } } } },

  "Toshkent shahri": { pop: 2900000, districts: {
    "Yunusobod tumani": { pop: 300000, mahallas: { "12-mahalla": 3000, "Bodomzor MFY": 2600, "Shifokorlar MFY": 2400 } },
    "Chilonzor tumani": { pop: 265000, mahallas: { "Chilonzor MFY": 2900, "Qatortol MFY": 2500 } },
    "Mirobod tumani":   { pop: 145000, mahallas: { "Mirobod MFY": 2300, "Salar MFY": 1900 } } } }
};

/* Tayyor ssenariylar — matn ikkala tilda, bo'shliqlari bilan. */
window.OM_TEMPLATES = {
  water: {
    uzTitle: "Suv ta’minoti vaqtincha to‘xtatiladi",
    uzBody:  "25-avgust kuni soat 09:00 dan 15:00 gacha suv ta’minoti to‘xtatiladi. Sabab — tarmoqda ta’mirlash ishlari.",
    ruTitle: "Водоснабжение будет временно отключено",
    ruBody:  "25 августа с 09:00 до 15:00 водоснабжение будет отключено. Причина — ремонтные работы на сети."
  },
  power: {
    uzTitle: "Elektr tarmog‘ida ta’mirlash ishlari",
    uzBody:  "26-avgust kuni 08:00–13:00 oralig‘ida elektr uzatiladi. Ishlar tugagach ta’minot tiklanadi.",
    ruTitle: "Ремонтные работы на электросети",
    ruBody:  "26 августа с 08:00 до 13:00 электроснабжение будет отключено. После работ подача восстановится."
  },
  meeting: {
    uzTitle: "Mahalla umumiy yig‘ini o‘tkaziladi",
    uzBody:  "Shanba kuni soat 10:00 da mahalla binosida umumiy yig‘in bo‘ladi. Barcha xonadon vakillari taklif etiladi.",
    ruTitle: "Состоится общее собрание махалли",
    ruBody:  "В субботу в 10:00 в здании махалли пройдёт общее собрание. Приглашаются представители всех домов."
  }
};
