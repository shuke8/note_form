/* =============================================================================
   GEOGRAFIYA — 14 hudud. Tumanlar real nomlar; mahallalar namuna ro'yxati.
   Aholi taxminlari yaxlitlangan va FAQAT qamrov hajmini ko'rsatish uchun.
   ========================================================================== */
window.OM_GEO = {
  "Qoraqalpog‘iston Respublikasi": { pop: 1900000, districts: {
    "Nukus shahri": ["1-mahalla", "Bereke MFY", "Do‘stlik MFY"],
    "Xo‘jayli tumani": ["Markaz MFY", "Yangiobod MFY"],
    "Chimboy tumani": ["Chimboy MFY", "Oqdaryo MFY"] } },
  "Andijon viloyati": { pop: 3300000, districts: {
    "Andijon shahri": ["Bog‘ishamol MFY", "Navbahor MFY", "Yangiobod MFY"],
    "Asaka tumani": ["Asaka MFY", "Mustaqillik MFY"],
    "Xonobod shahri": ["Xonobod MFY", "Guliston MFY"] } },
  "Buxoro viloyati": { pop: 2000000, districts: {
    "Buxoro shahri": ["Registon MFY", "Sitorai MFY", "Xoja MFY"],
    "G‘ijduvon tumani": ["G‘ijduvon MFY", "Damashqon MFY"],
    "Kogon shahri": ["Kogon MFY", "Temiryo‘l MFY"] } },
  "Farg‘ona viloyati": { pop: 3800000, districts: {
    "Farg‘ona shahri": ["Yangi Farg‘ona MFY", "Sanoat MFY"],
    "Marg‘ilon shahri": ["Marg‘ilon MFY", "Hunarmand MFY"],
    "Qo‘qon shahri": ["Qo‘qon MFY", "Xonqadam MFY"] } },
  "Jizzax viloyati": { pop: 1400000, districts: {
    "Jizzax shahri": ["Sharq MFY", "Yangihayot MFY"],
    "Zomin tumani": ["Zomin MFY", "Tog‘li MFY"] } },
  "Xorazm viloyati": { pop: 1900000, districts: {
    "Urganch shahri": ["Urganch MFY", "Al-Xorazmiy MFY"],
    "Xiva shahri": ["Ichan qal’a MFY", "Dishan qal’a MFY"],
    "Qo‘shko‘pir tumani": ["8-mahalla “Do‘stlik”", "Yangiariq MFY", "Bog‘ot MFY"] } },
  "Namangan viloyati": { pop: 2900000, districts: {
    "Namangan shahri": ["Davlatobod MFY", "Yangi Namangan MFY"],
    "Chust tumani": ["Chust MFY", "Yorqo‘rg‘on MFY"] } },
  "Navoiy viloyati": { pop: 1000000, districts: {
    "Navoiy shahri": ["Navoiy MFY", "Sanoat MFY"],
    "Zarafshon shahri": ["Zarafshon MFY", "Konchi MFY"] } },
  "Qashqadaryo viloyati": { pop: 3400000, districts: {
    "Qarshi shahri": ["Qarshi MFY", "Yangiobod MFY"],
    "Shahrisabz shahri": ["Shahrisabz MFY", "Oqsaroy MFY"] } },
  "Samarqand viloyati": { pop: 4000000, districts: {
    "Samarqand shahri": ["Registon MFY", "Siyob MFY", "Universitet MFY"],
    "Kattaqo‘rg‘on shahri": ["Kattaqo‘rg‘on MFY", "Payariq MFY"] } },
  "Sirdaryo viloyati": { pop: 900000, districts: {
    "Guliston shahri": ["Guliston MFY", "Yangiyer MFY"],
    "Shirin shahri": ["Shirin MFY", "Energetik MFY"] } },
  "Surxondaryo viloyati": { pop: 2700000, districts: {
    "Termiz shahri": ["Termiz MFY", "Amudaryo MFY"],
    "Denov tumani": ["Denov MFY", "Sho‘rchi MFY"] } },
  "Toshkent viloyati": { pop: 3000000, districts: {
    "Nurafshon shahri": ["Nurafshon MFY", "Yangiobod MFY"],
    "Chirchiq shahri": ["Chirchiq MFY", "Kimyogar MFY"],
    "Zangiota tumani": ["Zangiota MFY", "Eshonguzar MFY"] } },
  "Toshkent shahri": { pop: 2900000, districts: {
    "Yunusobod tumani": ["12-mahalla", "Bodomzor MFY", "Shifokorlar MFY"],
    "Chilonzor tumani": ["Chilonzor MFY", "Qatortol MFY"],
    "Mirobod tumani": ["Mirobod MFY", "Salar MFY"] } }
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
