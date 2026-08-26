# Dizayn tizimi — designsystems.surf o‘lchovi bo‘yicha

Bu tizim `landing.html` va `composer.html` uchun noldan qurildi. Eski
`index.html` dan bitta qator ham ko‘chirilmadi — u tegilmagan holda qoladi.

Har qiymat 2026-08-25 da designsystems.surf ning jonli sahifasida
Playwright + `getComputedStyle` bilan **o‘lchandi**. Ko‘z bilan chamalab
olingan bitta ham raqam yo‘q.

| Fayl | Nima |
|---|---|
| `assets/system.css` | Tokenlar, reset, tipografika, layout, motion primitivlari |
| `assets/components.css` | Navbar, tugma, chip, plitka, media, karta, maydon, banner, marquee, footer, toast |
| `assets/motion.js` | Reveal observer, stagger, yozuv mashinkasi, navbar, mavzu, mobil menyu, toast |
| `assets/landing.css` · `landing.html` | Platforma sahifasi |
| `assets/composer.css` · `composer.js` · `composer-data.js` · `composer.html` | Xabarnoma kompozitori |
| `assets/mark.svg` · `assets/favicon.svg` | Brend belgisi (piksel to‘ri — xabarning mahalladan hududga tarqalishi) |

---

## 1. Referensdan nima olindi

### Servislar va stek (o‘lchangan)

Referens **Framer** da qurilgan (`meta[name=generator]` → `Framer 27dd866`).
Shriftlar `fonts.gstatic.com` va `framerusercontent.com` dan, mesh-gradient
yuzalar 1136×540 PNG sifatida. Analitika: GTM, Clarity, Meta Pixel, Ahrefs,
ConvertKit.

Bu yerda **hech qanday tashqi platforma ishlatilmadi**: sof HTML + CSS + JS,
bitta ham bog‘liqlik yo‘q. Mesh-gradientlar PNG emas, CSS `radial-gradient`
qatlamlari — ular ixtiyoriy o‘lchamda toza qoladi, dark temada moslashadi
va tarmoqdan hech nima yuklamaydi.

### Tipografika

| Rol | Referens | Bu yerda | Sabab |
|---|---|---|---|
| Sarlavha | `Inter Display` (Framer, yopiq) | `Inter Tight` | Ochiq ekvivalenti; kirill qamrovi bor |
| Matn | `Inter` | `Inter` | aynan |
| Yorliq | `IBM Plex Mono` | `IBM Plex Mono` | aynan |

O‘lchangan qadamlar — kegl / qator balandligi / tracking:

    56 / 61.6 / -1.68px      →  --t-d1   (1.1, -0.03em)
    40 / 50   / -0.8px       →  --t-d2   (1.25, -0.02em)
    32 / 40   / -0.32px      →  --t-d3   (1.25, -0.01em)
    20 / 30   / -0.6px       →  --t-lead (1.5, -0.03em)
    16 / 24   / -0.32px      →  --t-body (1.5, -0.02em)
    14 / 21   /  0           →  --t-ui   (1.5, 0)
    12 / 18   / -0.24px      →  --t-sm   (1.5, -0.02em)
    mono 12/18 va 10/15, UPPERCASE, tracking `normal`

Ikki chekinish:
- **mono 10px olinmadi.** Eng kichik mono qadam 11px (`--t-mono-sm`) —
  kirill katta harflari lotinnikidan zichroq, 10px da yorliq o‘qilmaydi.
- **mono tracking 0 emas, 0.02em.** Shu sababdan.

### Rang

Referens monoxrom: `#FFFFFF` sahifa · `#FAFAFA` bo‘lim · `#F5F5F5` ikkinchi
yuza · `#000000` matn · `rgba(0,0,0,.6)` ikkilamchi · `rgba(0,0,0,.45)`
uchinchi · `rgba(0,0,0,.08)` hairline · `rgba(0,0,0,.04)` ghost.

Aksent — **aynan o‘lchangan gradient**:

    radial-gradient(75% 150% at 100% 114.2%, #ffb70f 0%, #ff5400 100%)

Uchinchi matn qadami (`rgba(0,0,0,.45)` = `#8C8C8C`) **matn uchun
ishlatilmaydi**: oq ustida 3.5:1, AA 4.5 talab qiladi. U `--ink-3` nomi
bilan faqat dekorativ rolda qoladi; o‘qiladigan eng past qadam
`--ink-2` (`rgba(0,0,0,.6)` = 5.74:1).

Referensda **semantik palitra yo‘q** (u marketing sayti). Asbob sahifasiga
kerak, shuning uchun issiq aksentga hue jihatdan qo‘shni oila tanlandi va
har biri AA dan o‘tkazildi: `--ok #0A7D55` (4.83:1), `--warn #8A5300`
(6.06:1), `--crit #C11B1B` (5.94:1).

Dark tema — referensning qora bo‘limlari mantiqi: sof qora yuza, sof oq
matn, halqali soya.

### Geometriya

O‘lchangan radius taqsimoti: **100px — 308 marta**, 6px — 30, 8px — 10,
4px — 9, 12px — 3, 10px — 2, 16px — 1. Pill tasodif emas, tizimning imzosi.

Shkala: `--r-1 4` · `--r-2 6` · `--r-3 8` · `--r-4 10` · `--r-5 12` ·
`--r-6 16` · `--r-pill 100px` · `--r-dock 16px 16px 6px 6px` (referensning
assimetrik karta burchagi — media ustida turgan panel uchun).

### Chuqurlik

Referens chegara bilan emas, ko‘p qatlamli yumshoq soya bilan ishlaydi.
Ikkala qiymat aynan ko‘chirildi:

    --lift-1  0 .602px .602px  -1.25px  rgba(0,0,0,.18)
              0 2.289px 2.289px -2.5px  rgba(0,0,0,.16)
              0 10px 10px      -3.75px  rgba(0,0,0,.06)
              0 0 0 .5px                rgba(0,0,0,.05)

    --lift-2  0 .637px 1.147px -.875px  rgba(0,0,0,.17)
              0 1.932px 3.477px -1.75px rgba(0,0,0,.16)
              0 5.106px 9.191px -2.625px rgba(0,0,0,.14)
              0 16px 28.8px    -3.5px   rgba(0,0,0,.08)

Hairline ham soya orqali: `0 .5px 0 0 rgba(0,0,0,.08)`.

### Layout va ritm

O‘lchangan: kontent kengligi **1136px**, bo‘limlar orasi **96px**, ichki
oraliqlar 56 / 48 / 32 / 22 / 16. Navbar `sticky`, balandligi **68px**,
foni SHAFFOF, soyasi yo‘q, `z-index: 5`.

Bu yerda navbarga bitta qo‘shimcha bor: sahifa surilganda yupqa hairline
paydo bo‘ladi (`[data-stuck]`). Shaffof navbar oq kontent ustida chegarasiz
«yopishib» qolardi.

### Animatsiya

Reveal jonli sahifada **kadrma-kadr o‘lchandi** (`requestAnimationFrame`
bilan 26 nuqta):

    opacity 0 → 1,  translateY(10px) → 0,  417 ms,  ortiqcha sakrashsiz

    t=44ms  → 14.5%      t=144ms → 79.8%
    t=94ms  → 54.4%      t=194ms → 91.8%

Bu Framer Motion spring’i. CSS ekvivalenti sifatida **easeOutQuart**
(`cubic-bezier(0.25, 1, 0.5, 1)`) tanlandi — o‘lchovga 5% ichida to‘g‘ri
keladi (0.2t da 0.59 vs 0.544; 0.32t da 0.786 vs 0.798).

Referensdagi boshqa harakatlar: kattaroq bloklar `translateY(20px)` dan,
kichik nishonlar `scale(0)` dan, logo lentasi sekin gorizontal siljish,
sarlavhaning oxirgi so‘zi yozuv mashinkasi bilan almashadi va kursor bilan
tugaydi. Hammasi qayta qurildi.

---

## 2. Nima OLINMADI va nega

**Marketing qadamlari.** 40px va 56px sarlavha faqat landing’da; kompozitor
32px dan oshmaydi — u asbob, e’lon emas.

**`rgba(0,0,0,.45)` matn qadami.** AA dan o‘tmaydi (yuqorida).

**Tashqi PNG mesh-gradientlar.** CSS qatlamlari bilan almashtirildi.

**Framer va analitika.** Bu sahifalarda tashqi so‘rov faqat Google Fonts’ga.

**Reveal kompozitorda.** Forma boshqaruvlari «paydo bo‘lib» turmaydi:
operator ekranni ochganda hammasi joyida bo‘lishi kerak. Reveal faqat
landing’da.

---

## 3. Nima QO‘SHILDI (referensda yo‘q)

| Narsa | Nega kerak |
|---|---|
| Mobil menyu | Referens navbar’i 880px dan pastda 724px ga cho‘zilib, sahifani gorizontal scroll qilardi |
| Semantik holat ranglari | Referens marketing sayti, formasi yo‘q |
| Maydon qatlami (`.input/.select/.textarea`) | Tizim geometriyasi va rangidan qurildi; chegara rangi `--edge` — WCAG 1.4.11 boshqaruv chegarasi uchun 3:1 (hairline 1.1:1 beradi) |
| Yopishqoq ko‘rinish tasmasi | Operator yozayotganda push chegarasini ko‘rib turishi kerak |
| `--r-dock` ostidagi bildirishnoma clamp’i | Push sarlavhaning 1, matnning 2 qatorini ko‘rsatadi — ko‘rinish shuni aynan takrorlaydi |

---

## 4. Kompozitor — tuzilma qarori

Eski `index.html` ikki panelli ish maydoni edi (chapda forma, o‘ngda
telefon). Yangi kompozitor **bitta ustun**: bo‘limlar mono yorliq va
hairline bilan ajraladi, sarlavhalar 32px, ritm landing bilan bir xil.

Jonli ko‘rinish esa **02-bo‘lim ichida navbar ostiga yopishadigan media
tasma**. U:
- yozayotganda doim ko‘rinib turadi (ikki panel kerak emas),
- bo‘lim tugagach o‘zi ketadi (sahifani band qilmaydi),
- 880px dan pastda oddiy blokka aylanadi (tor ekranda tasma ekranning
  yarmini yeb qo‘yardi).

### Server yo‘q — muvaffaqiyat DA’VO QILINMAYDI

«Navbatga qo‘yish» to‘g‘ri to‘ldirilgan formada **demo panelini** ochadi:
boshqa sarlavha (*«Xabar YUBORILMADI — bu demo»*), ogohlantirish ikonkasi,
sariq banner va yig‘ilgan so‘rov tanasining o‘zi. **Reestr raqami
generatsiya qilinmaydi** — uni faqat server beradi. Sahifa boshidagi chip
ham buni oldindan aytadi: «Reestr raqami — serverdan keladi».

---

## 5. Verify (2026-08-25)

O‘lchov eslatmasi: mavzu almashtirilgandan keyin `getComputedStyle`
DARHOL o‘qilsa o‘tish davridagi qiymatni qaytaradi. Har o‘lchovdan oldin
450ms + `requestAnimationFrame` kutildi.

Kontrast hisoblagichi shaffof fonlarni ota-ona zanjiri ustiga QO‘YIB
chiqadi va `color(srgb r g b / a)` formatini 0..1 shkalasida o‘qiydi —
ikkalasisiz `rgba(255,255,255,.07)` sof oq, `color(srgb 1 1 1 / .82)` esa
deyarli qora deb hisoblanib, o‘nlab soxta xato beradi.

| Tekshiruv | landing.html | composer.html |
|---|---|---|
| Kontrast (AA), light | 0 xato | 0 xato |
| Kontrast (AA), dark | 0 xato | 0 xato |
| Gorizontal overflow: 320 / 390 / 768 / 1024 / 1440 / 1920 | 0 | 0 |
| Fokus izi | 19/19 boshqaruvda | 30/30 boshqaruvda |
| Nishon o‘lchami (WCAG 2.5.8) | 0 xato | 0 xato |
| Sarlavha ierarxiyasi | h1→h2→h3, sakrash yo‘q | h1→h2, sakrash yo‘q |
| Landmark | header / nav / main / footer | header / nav / main |
| Nomsiz boshqaruv | 0 | 0 |
| Konsol xatosi | 0 | 0 |
| Mixlangan qator ostida yopilgan kontent | — | 0 element |

**Klaviatura** (kompozitor): `scopeGroup` va `whenGroup` da o‘q tugmalar
o‘tadi va tanlaydi, roving tabindex faqat tanlangan elementda `0`,
`aria-checked` doim bittada. Kun chiplari `aria-pressed` toggle (bu
radiogroup emas — bir nechta kun birga tanlanadi). Skip-link fokusda
chiqadi.

**`prefers-reduced-motion`** (media qoidalari vaqtincha `all` ga aylantirib
o‘lchandi): reveal darhol ko‘rinadi, transition 0.00001s, marquee to‘xtaydi
va o‘raladi (ikkinchi nusxa yashiriladi), kursor miltillamaydi, skeleton
bitta kadrga tushadi.

**Forma oqimi**: bo‘sh submit → 5 ta inline xato + birinchi maydonga fokus +
qizil holat qatori. To‘liq submit → demo paneli, «yuborildi» so‘zi yo‘q,
soxta ID yo‘q.

---

## 6. Yo‘l qo‘yilgan va tuzatilgan xatolar

Ish davomida topilgan va shu yerda tuzatilganlar — hammasi o‘lchov bilan:

1. **Kulrang plita.** `.tile-grid` to‘r chiziqlarini konteyner FONIDAN
   olardi; plitkalar `data-reveal` bilan yashirin turganda blok butunlay
   kulrang plitaga aylanardi. To‘r chiziqlari har plitkaning o‘z
   chegarasiga ko‘chirildi.
2. **Maydonlarda fokus izi yo‘q edi.** `.input { outline: none }` global
   `:focus-visible` qoidasini yengardi (aniqlik bir xil, keyingi fayl
   yutadi). Maydonlar endi qolgan boshqaruvlar bilan bir xil 2px halqa
   oladi.
3. **Navbar 320px da 23px chiqardi.** 28px lik oraliq + `flex: none`
   brend. Tor ekranda oraliq 12px, brend qisqarishga ruxsat oldi.
4. **Mobil panel 16px chiqardi.** `left/right` mutlaq joylashuvda ota-ona
   PADDING qutisiga nisbatan o‘lchanadi; qo‘shilgan manfiy margin ortiqcha
   edi.
5. **Gamburger desktopda ko‘rinardi.** `.nav-toggle` ayni paytda
   `.icon-btn` ham; ko‘rinish qoidalari komponent qoidalaridan OLDIN
   turgani uchun `display: grid` qaytib kelardi. Ular fayl oxiriga
   ko‘chirildi.
6. **Landing CTA 320px da chiqardi.** Desktop nusxasi ≤880px da
   yashiriladi, mobil panelga alohida CTA qo‘yildi — `display: none`
   yordamchi texnologiyadan ham olib tashlaydi, shuning uchun takror
   e’lon qilinmaydi.
7. **Footer havolalari 21px edi.** WCAG 2.5.8 uchun 24px kerak; ustun
   oralig‘i qisqartirilib, farq padding’ga o‘tkazildi.
8. **Yopishqoq tasma maydonni yopardi.** Tab bilan yurganda brauzer
   elementni eng kam siljish bilan ko‘rsatadi va u tasma ostida qolardi —
   matn ustuniga `scroll-margin-top: 300px` berildi.
9. **`span` lar ichida 3px lik chiziq 14px lik plita bo‘lardi.** Inline
   elementda `height` qator balandligiga bo‘ysunadi; `display: block`
   qo‘shildi.
10. **Bildirishnoma sarlavhasi va matni bir qatorga yopishardi.** Ular
    `span` edi — blok elementlarga aylantirildi.

---

# «Kim oladi?» — qamrov narvoni (2026-08-26)

## Nima almashtirildi

Oldin bu bo'lim uchta ayri boshqaruvdan iborat edi: yuqorida qamrov yo'li
yozilgan chiziq, ostida to'rtta tanlov kartasi (Respublika / Viloyat /
Tuman / Mahalla), ularning ostida esa daraja tanlanganda ochilib-yopiladigan
uchta select. Uchta muammosi bor edi:

1. **Ikki xil model.** Karta «daraja» ni, select «hudud» ni so'raydi — lekin
   ular bir-biriga bog'liq, ekranda esa bog'liqlik ko'rinmasdi.
2. **330px joy.** Karta to'ri + kaskad + xulosa chizig'i.
3. **Sakrash.** Daraja almashganda kaskad paydo bo'lardi/yo'qolardi va
   ostidagi butun sahifa siljirdi.

Endi bitta boshqaruv — **narvon**. Har qator bitta daraja:

    DARAJA        HUDUD                      TAXMINIY QAMROV
    ○ Respublika  O‘zbekiston Respublikasi   ·············  ~35.1M
      ○ Viloyat   [Xorazm viloyati      ▾]   ·············   ~1.9M
        ◉ Tuman   [Qo‘shko‘pir tumani   ▾]   ·············   ~125K
          ○ Mahalla [8-mahalla …        ▾]   ·············   ~2.4K
    ▓·····························  ~125K · respublika aholisining 0.36%

- **Radio = «shu yerda to'xtat».** Daraja va hudud endi bir qatorda.
- **Otstup.** Har chuqurroq daraja 14px o'ngga suriladi — narvon daraxt
  bo'lib o'qiladi, ustun sarlavhasiz ham ierarxiya ko'rinadi.
- **Nuqtali yetaklovchi.** Raqamlar o'ngga tekislanadi (to'rttasini
  vertikal solishtirish uchun), qiymat bilan raqam orasidagi bo'sh joy
  esa chizma tilidagi yetaklovchi bilan bog'lanadi.
- **Ulush chizig'i.** «~2.4K» yolg'iz turganda katta ham, kichik ham
  tuyulishi mumkin; chiziq uni respublika miqyosiga qo'yib beradi.
- **Sakrash yo'q.** Barcha to'rt qator doim joyida turadi.

Balandlik 330px dan ~250px ga tushdi va ikkita boshqaruv o'rniga bitta
qoldi.

## Xulq qoidalari

- Qiymat tanlanganda daraja o'sha qatorga ko'chadi — **faqat pastga**.
  Operator «Mahalla» ni tanlab qo'yib keyin viloyatni ko'rsatsa, daraja
  viloyatga qaytib ketmaydi.
- Select faqat ota-onasi tanlangandagina ochiladi. Bo'sh ro'yxatni ochib
  qo'yish «tanlov yo'q» degan noto'g'ri xabar beradi.
- Tanlanmagan daraja qamrovi `—`, **nol emas**: nol «hech kim» degan
  ma'noni berardi.

## Semantika

`fieldset` + `legend` + **native `input[type=radio]`**. Ilgari bu
`role="radiogroup"` va `role="radio"` bo'lgan tugmalar edi, roving
tabindex qo'lda yozilgandi. Native radio bilan o'q tugmalar, guruhlash va
«4 tadan 3-si» e'loni brauzerdan tekinga keladi — va guruh ichida select
turgani a'zolikni buzmaydi. Real klaviatura bilan tekshirildi: ArrowDown
Respublika → Viloyat ga o'tdi, `change` otildi, qator va ulush chizig'i
yangilandi.

## Ma'lumot

`composer-data.js` qayta yozildi: har tuman va har mahallaga aniq aholi
raqami qo'yildi (ilgari faqat viloyat darajasida bor edi va tuman raqami
umuman yo'q edi). 14 hudud · 35 tuman · 76 mahalla · jami ~35.1M.

Raqamlar — namuna to'plami, fayl boshida shunday yozilgan; ekranda ular
doim `~` bilan va «TAXMINIY QAMROV» yorlig'i ostida chiqadi. Real qiymat
reestrdan keladi.

## Tuzatilgan tizim xatosi

Bu ish paytida **butun tizimga taalluqli** xato topildi:

    :focus-visible { …; border-radius: var(--r-2); }
    .shell :focus-visible { border-radius: inherit; }

Bu qoida fokusdagi elementning O'Z radiusini qayta yozib yuborardi.
Natijada: dumaloq radio kvadratga aylanardi, pill tugma 100px dan 0 ga
tushardi, 12px li input ham 0 bo'lardi — `.shell` ichidagi **har bir**
fokuslanadigan element. Ikkala sahifada, birinchi kundan beri.

Sabab: outline elementning radiusiga ergashsin deb yozilgan edi — holbuki
zamonaviy brauzerlarda u allaqachon shunday qiladi. Ikkala qator ham
o'chirildi. Tekshirildi: radio 50%, pill 100px, select 8px, input 12px —
hammasida fokus halqasi bor va shakl buzilmaydi.

**O'lchov eslatmasi:** bu xato uzoq vaqt ko'rinmadi, chunki
`python3 -m http.server` `Cache-Control` yubormaydi va brauzer tahrirlangan
CSS ni eski holida ko'rsatib turadi. Tekshiruv serveri `no-store` bilan
qayta ishga tushirildi; shundan keyin ham brauzer xotira keshini ushlab
qolgani uchun o'lchovdan oldin `<link>` href'lari yangi so'rov bilan
almashtirildi.

## Verify (2026-08-26)

| Tekshiruv | Natija |
|---|---|
| Kontrast (AA), light + dark | 0 xato |
| Gorizontal overflow: 320 / 390 / 1440 | 0 |
| Fokus izi (narvon radiolari) | 4/4, shakl buzilmagan |
| Klaviatura | ArrowDown/Up darajani almashtiradi (native) |
| Tekshiruv oqimi | Mahalla darajasi + bo'sh hudud → 7 xato, birinchi maydonga fokus, natija paneli OCHILMAYDI |
| Tuzatgandan keyin | 3 ta geo xatosi yo'qoladi, ulush chizig'i va yakun yangilanadi |
