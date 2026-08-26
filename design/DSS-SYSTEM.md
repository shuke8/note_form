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

---

# Mustaqil verifikatsiya va tuzatishlar (2026-08-26)

Ikkita alohida, toza kontekstli agent kod ko'rib chiqdi (implementer o'zini
verify qila olmaydi): biri arxitektura/xatolik/a11y bo'yicha, ikkinchisi
faqat «jim ishlamay qolish» va yolg'on holatlarni ovladi. 13 ta tasdiqlangan
kamchilik topildi, hammasi tuzatildi.

## Kritik

**1. Narvon torayganda so'rov tanasi torayardi.** Mahalla darajasigacha
tushib, keyin «Viloyat» radiosini bosgan operator ekranda «Andijon viloyati»
ni ko'rardi, so'rov tanasida esa `scope_level: "region"` bilan birga
`district: "Asaka tumani"` va `mahalla: "Asaka MFY"` qolib ketardi.
Eng aniq maydonni hurmat qiladigan server ~2 500 kishiga, `scope_level` ga
qaraydigani 3.3 millionga yuborardi. Ikki himoya qo'yildi: `setLevel()`
yuqoriga chiqilganda pastdagi tanlovlarni tozalaydi, `renderDemoResult()`
esa tanani darajaga qarab kesadi.

**2. `no-js` zaxirasi kontent ko'rinishidan OLDIN olib tashlanardi.**
`motion.js` boshida `classList.remove("no-js")` turardi; `initReveal()` esa
uchinchi bo'lib ishga tushardi. Boot'dagi har qanday xato butun
`[data-reveal]` kontentini ko'rinmas qoldirardi — CSS zaxirasi esa
allaqachon o'chirilgan bo'lardi. Real trigger ham topildi: Safari 14 dan
past va eski Android'da `MediaQueryList.addEventListener` yo'q, faqat
`addListener` bor; `initTheme()` shu qatorda otilardi.

Uchta tuzatish: eski media API uchun `onMedia()` moslashtiruvchisi;
`no-js` faqat kuzatuvchi ulangandan keyin olinadi; har boot qadami alohida
`try/catch` ichida — biri yiqilsa qolgani ishlaydi.

Sinov: `matchMedia` eski API ga qaytarildi, `localStorage` otiladigan
qilindi va `IntersectionObserver` butunlay o'chirildi. Natija: 4/4 reveal
elementi ko'rinadi, mavzu tugmasi ishlaydi.

## Yuqori

**3. `fRegn`… kechikkan majburiy maydon.** `fRepeatTime` yulduzcha bilan
majburiy deb belgilangan, lekin hech qayerda tekshirilmasdi. Uni tozalab
qo'yilsa: holat «Hammasi to'ldirilgan», yakunda osilib qolgan `Du · `,
ko'rinishda esa operator kiritmagan **09:00**. Endi tekshiriladi, ikkala
`|| "09:00"` zaxirasi olib tashlandi (`—` chiqadi) va matn «vaqt
tanlanmagan» deydi.

**4. Yuklanmagan ma'lumot fakt sifatida ko'rsatilardi.** `composer-data.js`
so'rovi bekor bo'lsa `window.OM_GEO || {}` uni jimgina yutardi va sahifa
«~0 · butun respublika aholisi» deb yozardi — ya'ni O'zbekistonda nol odam
yashashini **da'vo qilardi**. Ssenariy tugmalari ham jimgina o'lardi.
Endi: qadam bloklanadi, sabab aytiladi («Hudud ma'lumotlari yuklanmadi…»),
raqamlar `—`, yuborish to'xtatiladi, tugma bosilganda toast chiqadi.
Real 404 bilan sinaldi.

## O'rta

**5. Demo panel eskirardi.** Yuborilgandan keyin formani tahrirlasangiz,
sahifa bir vaqtda «1 ta maydon to'ldirilishi kerak» va eski to'liq so'rov
tanasini ko'rsatib turardi. Endi `refresh()` panelni tozalaydi.

**6. Rad etilgan fayllarning faqat BIRINCHISI aytilardi.** 6 ta fayl
tashlansa qaysilari o'tmagani bilinmasdi. Endi: «1 ta qo'shildi, 3 tasi rad
etildi: …» — hammasi nomi bilan, takroriy sabab birlashtiriladi.

**7. Fayl xatosi hech qachon tozalanmasdi.** «5 tadan ortiq…» xabari
fayllar o'chirilgandan keyin ham turardi — mavjud bo'lmagan chegarani
da'vo qilardi. Endi o'chirishda ham, yangi urinishda ham tozalanadi.

**8. «Tekshirilmoqda» soxta ish edi.** Tekshiruv `click` ichida sinxron
tugaydi; 700ms lik kechikish va spinner davomida hech narsa qilinmasdi.
Kechikish olib tashlandi — javob darhol chiqadi.

**9. Mavzu tanlovi jimgina yo'qolardi.** Private rejimda `setItem` otiladi,
`catch` uni yutardi va foydalanuvchi sahifa almashganda tema «o'z-o'zidan
qaytdi» deb o'ylardi. Endi bir marta aytiladi.

**9b. Mavzu birinchi bo'yoqdan keyin qo'yilardi.** `motion.js` `defer`
bilan yuklanadi, shuning uchun saqlangan qorong'i mavzu har ochilishda oq
bo'lib yonib ketardi. Ikkala sahifa `&lt;head&gt;` iga inline snippet qo'shildi.

## Past

**10. Yozuv mashinkasi kengligi hisoblanib TASHLAB YUBORILARDI.** Izoh
«sarlavha sakramasin» deb va'da berardi, `widest` esa hech qayerda
ishlatilmasdi. Endi qo'llanadi — kursor kengligi bilan birga, aks holda
quti eng uzun so'zda baribir kengayardi. O'lchov: 18 ta namunada sarlavha
balandligi ham, qutining kengligi ham o'zgarmadi (123px / 326px).

**11. `data-typewriter` JSON xatosi ko'rinmasdi** — endi `console.error`.

**12. Kun chiplarida yaroqsiz ARIA.** `role=button` da `aria-checked`
ruxsat etilmaydi; u faqat CSS ilgagi bo'lgani uchun qo'shilgandi.
`components.css` ga `[aria-pressed="true"]` qoidasi qo'shildi, atribut
olib tashlandi.

**13. Qamrov xatosi radiolarga bog'lanmagandi.** `role="alert"` bir marta
o'qiladi; fokus qaytganda sabab qolmasdi. Endi har radioning
`aria-describedby` sida `scopeError` bor.

Shuningdek o'lik `.step-sec .pick` selektori `.rung-pick` ga to'g'rilandi.

## Tekshiruvchilar tasdiqlagan, kamchilik topilmagan

Yuborish yo'lida muvaffaqiyat da'vosi yoki o'ylab topilgan reestr raqami
yo'q (bo'sh joyli matn, takroriy bosish, reset'dan keyingi yuborish —
hammasi sinaldi); `state.files` va ro'yxat sinxron; ochilgan-yopilgan
select'dan qolgan qiymat tanaga tushmaydi; mobil menyuda focus trap
kerak emas (modal emas); `refresh()` da layout thrash yo'q; kuzatuvchi
sizmaydi.

## Yakuniy o'lchov (2026-08-26)

| Tekshiruv | landing | composer |
|---|---|---|
| Kontrast (AA), light + dark | 0 xato | 0 xato |
| Overflow: 320 / 1440 | 0 | 0 |
| Konsol | 0 | 0 |
| Boot chidamliligi (3 ta buzilish birga) | 4/4 element ko'rinadi | — |
| Ma'lumot yo'q holati | — | bloklanadi, sabab aytiladi |

## Uchinchi tekshiruv: tuzatishlarning o'zi (2026-08-26)

Yana bir toza kontekstli agent 13 ta tuzatishni qayta ko'rdi. 9 tasi
to'g'ri deb tasdiqlandi, **tuzatishlarning o'zida 4 ta yangi kamchilik**
topildi — ular ham tuzatildi.

**A. Ma'lumot yo'q xabari submit'da o'chib ketardi.** `#scopeError` ham
`.field-error`; `clearErrors()` har `.field-error` ni yashiradi. Xato
`box: null` bilan qo'yilgani uchun `showErrors()` uni qayta chizmasdi.
Natija: foydalanuvchi «Navbatga qo'yish» ni bosishi bilan sahifadagi
yagona tushuntirish yo'qolardi, toast esa mavjud bo'lmagan maydonlarni
ko'rsatardi. Endi xato haqiqiy `box` va `msg` bilan qo'yiladi, toast
alohida matn beradi.

**B. «N tasi rad etildi» xabarlarni sanardi, fayllarni emas.** 8 ta PDF
tashlansa 5 tasi qabul, 3 tasi rad etilardi — lekin uchalasining sababi
bir xil bo'lgani uchun dedup ularni bittaga aylantirardi va ekran
«1 tasi rad etildi» derdi. Endi `rejected` alohida sanaladi
(`problems` faqat sabablar ro'yxati). O'lchov: «5 ta qo'shildi,
**3 tasi** rad etildi».

**C. `onMedia` shim ikkinchi chaqiruv joyida qo'llanmagandi.**
`initTheme` moslashtirildi, `initMenu` esa hali ham to'g'ridan-to'g'ri
`addEventListener` chaqirardi — ya'ni tuzatish o'zi tavsiflagan
brauzerda otilardi. `try/catch` sahifani saqlab qolardi, lekin menyu
ekran kengayganda yopilmay qolardi. O'lchov: 320px da menyu ochilib,
1440px ga kengaytirilgach `data-open="false"`.

**D. Sarlavha kengligi bir marta o'lchanardi.** Kegl 56 → 40 → 32px ga
tushadi; 56px da olingan zaxira 320px ekranda sahifani ~75px gorizontal
scroll qilib yuborardi. Shrift ham `display=swap` bilan keyin keladi,
ya'ni birinchi o'lchov zaxira shriftni o'lchagandi. Endi o'lchov
`document.fonts.ready` da va `resize` da (150ms debounce) qaytariladi.
O'lchov: 1440px da 326px → 320px ga siljitilganda 189px, overflow yo'q;
qaytib kengaytirilganda yana 326px.

Shuningdek: `no-js` endi FAQAT `initReveal` muvaffaqiyatli tugagandagina
olib tashlanadi (shartsiz olib tashlash «kontent yashirin turganda
olinmasin» kafolatini yo'qotardi); demo panel endi faqat **so'rov
tanasiga kiradigan** holat o'zgarganda tozalanadi (ko'rinish tilini
almashtirish uni o'chirmaydi); o'lik `.spinner` CSS olib tashlandi.

Verify: ikkala sahifa, ikkala temada 0 kontrast xatosi, 1440 va 320 da
overflow yo'q (resize'dan keyin ham).

---

## Uchinchi to'lqin — brauzerda ishga tushirilganda topilgan 11 kamchilik

Sakkiz variant fragmentini 24 ta statik tekshiruvchi agent «toza» dedi.
Keyin ularni **brauzerda ochib, har birini bosib chiqqan** tekshiruvchi
11 ta kamchilik topdi. Bu bo'lim har birini va uni qanday takrorlashni
yozib qo'yadi — asosiy saboq: *statik o'qish ishga tushirishning o'rnini
bosmaydi*.

### Mezbon (`variants.html` / `assets/variants.js`)

**F1. `try/catch` otiladigan inline skriptni ushlay olmaydi.**
Fragment skriptini qayta yaratish `document.head.appendChild(el)` orqali
sinxron bajariladi, lekin xato `window` ga chiqadi — chaqiruv steki
emas. `try { appendChild } catch {}` hech qachon ishlamasdi va otilgan
fragment jimgina yarim yuklangan qolardi, mezbon esa «8/8 yuklandi»
derdi. Endi `runScripts` skript ishga tushishidan oldin capture fazasida
`window.addEventListener("error", …, true)` qo'yadi va birinchi xabarni
qaytaradi. O'lchov: ataylab otiladigan fragment → «skript otildi:
Uncaught Err…» kartasi va `7/8 variant yuklandi`.

**F2. 200 javob bo'sh yoki begona tana bilan ham «yuklandi» sanalardi.**
`fetch` `ok` bo'lsa yetarli deb hisoblanardi. Endi `mountedOk()`
o'rnatishdan keyin `[data-variant]` ildizini va uning ichida kamida
bitta bola borligini tekshiradi; yo'q bo'lsa mount tozalanadi va sabab
kartasi qo'yiladi. O'lchov: bo'sh tana → «javob fragment emas
(data-variant topilmadi)», begona HTML → o'sha xabar va `leaked: false`.

**F3. Reestrda bitta `null` yozuv uchta variantni o'ldirardi.**
`window.OM_GEO` dagi buzuq yozuv v4/v6/v7 ni to'xtatardi, lekin
hisoblagich baribir `8/8` derdi. Endi har fragment reestrni o'qishdan
oldin shaklini tekshiradi va buzuq yozuvni **o'tkazib yuboradi**, jami
esa faqat haqiqatan o'qilgan yozuvlardan yig'iladi.

**F4. Meta parseri notanish `@key` ni yutardi.** `@name/@idea/@best/@cost`
dan boshqasi oldingi kalitning qiymatiga qo'shilib ketardi — v3 ning
`@note` i ekranda «narx» matnining oxirida chiqib turardi. Endi regex
keyingi `@[a-z]+:` da to'xtaydi. O'lchov: v3 `cost` 162 belgi,
`hasNote: false`.

**F5. Mezbon hodisaga skript ishga tushgandan KEYIN obuna bo'lardi.**
Init paytida chiqadigan birinchi `scopechange` yo'qolardi va yonidagi
panel bo'sh turardi. Endi obuna `runScripts` dan oldin. O'lchov:
yuklangan zahoti `level=region · region=Andijon viloyati …`,
`data-empty: "false"`.

### Fragmentlar

**F6–F7. Nol aholi soni yana fakt sifatida chiqardi.** v3 da mahalla
`pop: 0` bo'lsa `~0`, `undefined` bo'lsa `~NaN`; v4 da `num()` o'zining
nol qorovulini chetlab o'tardi. Ikkalasida ham raqam yo'qligi endi
raqam emas — `—` va sababi yoziladi.

**F8. v5 noma'lumlarni tashlab, to'liq hudud sonini da'vo qilardi.**
Uch hududdan bittasida raqam bo'lmasa, jami qolgan ikkitasining
yig'indisi bo'lardi-yu, ekran uni «3 hudud qamrovi» deb ko'rsatardi.
Endi bitta noma'lum bo'lsa jami `—` ga tushadi va yo'l qatori
«3 hududdan bir qismida son yo'q» deydi; ARIA matni ham,
`scopechange` tanasidagi `reach` ham xuddi shuni aytadi — to'rt joy bir
xil gapiradi.

**F9. v1 chipi raqam qamragandan ko'proq hududni sanardi.** Endi chip
«2/3 hududda raqam bor» deydi.

**F10. v2 `~—` chiqarardi** — `~` prefiksi noma'lum qiymatga ham
yopishtirilardi.

**F11. Buzuq `localStorage` oxirgi tanlovlarni jimgina o'chirardi.**
v3 `JSON.parse` xatosini yutib, ro'yxatni bo'shatardi — foydalanuvchi
tanlovlari sababsiz yo'qolardi. Endi buzuq yoki begona shakldagi qiymat
tozalanadi va ekranda «Saqlangan tanlovlar o'qib bo'lmadi va tozalandi —
panel orqali qayta tanlang» deb aytiladi; bo'sh holat esa o'z matnini
saqlab qoladi.

### Verify (Playwright, real brauzer)

- 1440 va 320px × light va dark: **0 kontrast xatosi**, sahifada
  gorizontal scroll yo'q (`scrollWidth == clientWidth`), `pageerror`
  va `console.error` bo'sh — har sakkiz variantda tanlov qilingandan
  keyin o'lchandi.
- Buzuq reestr (null yozuv + `pop:0` + `pop` siz hudud): ko'rinadigan
  matnda `~0`/`~NaN` yo'q, o'lik variant yo'q.
- `.v8-shift` ataylab yo'lakdan chiqadi (siljitgichni JS da o'lchamaslik
  uchun) va `.v8-scale { overflow:hidden }` uni kesadi — ichida
  fokuslanadigan element yo'q, sahifa scrolliga ta'sir qilmaydi.

### Sabab va qoida

Statik tekshiruvchi ko'ra olmaydigan narsalar: hisoblangan qiymat
ekranga qanday chiqishi (`0`/`NaN`/`undefined`), kaskad natijasi,
haqiqiy `scrollWidth`, hodisa tanasining ekranga mosligi, bir
sahifadagi mustaqil bo'laklarning bir-biriga ta'siri. Shuning uchun
ishga tushadigan artefakt chiqaradigan har workflow da **bajarish**
bosqichi bo'lishi shart; statik bosqich «Statik ko'rib chiqish» deb
nomlanadi, «Tekshirish» emas.

---

## Qamrov: narvon → xarita (tanlangan yechim)

Sakkiz variantdan foydalanuvchi **xarita** ni tanladi va bitta shart qo‘ydi:
butun respublikani tanlash qulay bo‘lsin. Kompozitordagi eski narvon
(to‘rtta daraja radiosi + uchta select) shu bilan almashtirildi.

### Nega narvon olib tashlandi

Narvonda «daraja» va «joy» ikki xil boshqaruv edi va ular bir-biridan
uzilib qolardi: ekran «Viloyat» deb turib, `state` ichida eski mahalla
qolib ketardi. Xaritada bunday holat MAVJUD EMAS — `goScope()` darajani
va joyni bir vaqtda o‘rnatadi va joyi bo‘sh darajani umuman rad etadi.
Shu sababli `validate()` dagi uchta «viloyatni tanlang / tumanni tanlang /
mahallani tanlang» tekshiruvi o‘lik kodga aylandi va o‘chirildi.

### Butun respublikani tanlashning uch yo‘li

1. **Doimiy tugma.** Ro‘yxat qatori emas — panel tepasidagi tugma. Qator
   bo‘lganida u tumanga kirilishi bilan yo‘qolardi va qaytish yo‘li faqat
   kichkina yo‘l tugmasi edi: eng ko‘p ishlatiladigan qamrov eng chuqur
   ko‘milgani bo‘lardi. Endi eng chuqur pog‘onadan ham **bir bosish**.
   Tanlanganda u xaritadagi «on» katak bilan aynan bir xil gapiradi
   (yumshoq alanga + qalin kontur), demak ko‘z ikkisini bitta holat deb
   o‘qiydi.
2. **Xarita foni.** Hududlar tashqarisidagi bo‘sh joy bosiladi. Kursor
   ustiga kelganda butun xarita yumshoq alangaga bo‘yaladi va yuqorida
   «BUTUN RESPUBLIKA» yorlig‘i chiqadi — gesture ko‘rinmas emas.
   Fon `pointer-events` ni `.scope-map` dan meros qiladi, ya‘ni xarita
   bosilmaydigan kenglikda (katak 44px dan kichik) u ham bosilmaydi va
   izoh o‘sha holatda boshqa gap aytadi.
3. **Yo‘l qatori va ArrowLeft.** «O‘zbekiston» crumb’i qamrovni
   ko‘taradi; eng yuqori pog‘onada crumb tugmasi bo‘lmagani uchun
   `upButton()` doimiy tugmaga tushadi — ArrowLeft hech qachon hech
   qayerga olib bormay qolmaydi.

Tugma bosilganda fokus ro‘yxatga **uloqtirilmaydi**: tugma o‘z joyida
qoladi va `aria-current` bilan tanlovni o‘zi tasdiqlaydi.

### Ikkinchi darajali, lekin muhim tuzatish

Eski `REPUBLIC_POP` `|| 0` bilan yig‘ilardi: bitta hududda son bo‘lmasa
qisman yig‘indi «butun respublika aholisi» deb ko‘rsatilardi — o‘ylab
topilgan fakt. Endi bitta noma’lum bo‘lsa jami `—` ga tushadi, tugma
«jami son noma’lum» deb yozadi va reestrdagi bo‘shliq ogohlantirishda
nomi bilan aytiladi. Buzuq (null) yozuv butun qadamni o‘ldirmaydi —
o‘tkazib yuboriladi.

### Tor ekran

Xarita 504px dan tor ustunda bosilmaydi (eng past katak 44px ga
chiqmaydi). Shunday ekan u boshqaruvni 410px pastga surib turishi ham
mumkin emas: 880px dan tor ekranda **panel birinchi**, xarita uning
ostida tasdiq sifatida qoladi. Fokus tartibiga ta’sir qilmaydi — xarita
`aria-hidden` va fokuslanmaydi.

### Verify (real brauzer)

- 8 viewport (1920…320) × light/dark: **0 kontrast xatosi**, overflow yo‘q,
  `pageerror`/`console.error` yo‘q — respublika tanlangan va viloyat
  ichiga kirilgan ikkala holatda ham o‘lchandi.
- Torayish → kengayish: mahalla darajasidan viloyatga chiqilganda so‘rov
  tanasida `district: null, mahalla: null` — ekran bilan tana bir xil.
- Buzuq reestr (null yozuv + `pop` siz hudud): ekranda `~0`/`NaN` yo‘q,
  o‘lik boshqaruv yo‘q. Reestr umuman yuklanmasa xarita ham, panel ham
  yashiriladi — so‘ngan boshqaruv «bosib ko‘ring» deb aldaydi.
- Faqat klaviatura: Enter tugmada → respublika; ArrowDown/ArrowRight →
  viloyat ichiga; ArrowLeft → «Qamrovni butun respublikaga o‘zgartirish»
  tugmasi; Enter → respublika va fokus doimiy tugmada.
- Matn yozilganda ro‘yxat qayta qurilmaydi va fokus o‘g‘irlanmaydi
  (`renderScope()` qamrov imzosi o‘zgarmasa chiqib ketadi).

Kadrlar: `.screenshots/qamrov-xarita-*.png`

---

## Sxematik chizma → HAQIQIY chegaralar

Foydalanuvchi: «real O'zbekiston mapini ishlat». Qo'lda yozilgan 14 ta
ko'pburchak o'rniga haqiqiy ma'muriy chegaralar qo'yildi.

### Manba va proyeksiya

- **Natural Earth 10m admin-1** (jamoat mulki — atributsiya majburiyati
  yo'q, lekin manba ekranda ataladi). `adm0_a3 = UZB` bo'yicha 14 ta
  yozuv, reestrdagi 14 hudud bilan bir-biriga to'liq tushadi. Ikkita
  «Tashkent» yozuvi yuzasi bo'yicha ajratiladi (shahar — kichigi),
  nomi bo'yicha emas.
- **Albers TENG-YUZALI konus** proyeksiyasi, standart parallellar
  38,5°N va 44,5°N. Bu ataylab: xaritada hududning kattaligi ko'z uchun
  «qancha joy» degani. Merkator Qoraqalpog'istonni shimolda bo'rttirib,
  Surxondaryoni janubda kichraytirib yuborardi — yonidagi raqam to'g'ri
  turib, chizmaning o'zi yolg'on gapirardi.
- Duglas-Peyker bilan 0,42 birlik dopuskda soddalashtirildi (540px enida
  ~0,5px — ko'z ilg'amaydi). Natija: 14 hudud uchun **11 KB** path,
  tashqi so'rovsiz, JS ichida.
- geoBoundaries/OSM ham ko'rildi (ODbL): ishlaydi, lekin share-alike va
  atributsiya majburiyati qo'shiladi. Natural Earth tanlandi.

Izohda **rasmiy chegara hujjati emas** deb yozib qo'yilgan: 1:10 mln
umumiy ma'lumot to'plami rasmiy kadastr o'rnini bosmaydi.

### Nima o'zgardi va nega

**Shakl ichidagi raqam olib tashlandi.** Haqiqiy geometriyada Toshkent
shahri 537px lik xaritada **6,9×7,5px** — unga 12px lik raqam sig'maydi,
Farg'ona vodiysida esa raqamlar bir-birining ustiga chiqardi. Endi nom
xaritaning burchagidagi **bitta suzuvchi yorliqda** chiqadi: «14 ·
Toshkent shahri». To'qnashuv yo'q, eng kichik hudud ham nomsiz qolmaydi.
Xuddi shu yorliq fon ustida «Butun respublika» deydi — bitta komponent,
ikkita vazifa.

**Kichik hudud uchun ko'rinadigan nishon.** Shakli 14 birlikdan kichik
hududga (bugun faqat Toshkent shahri) ko'rinadigan halqa va r=11 birlik
bosish doirasi beriladi — 537px da **24,6px**, ya'ni WCAG 2.5.8 (24×24)
bo'yicha yetarli. Halqa MAJBURIY: ko'rinmas kattalashtirilgan nishon
«nega bu yerni bosganda shahar chiqdi?» degan savol tug'dirardi.

**Kengaytirilgan bosish yo'lagi RAD ETILDI.** Har shakl atrofiga shaffof
`stroke` qo'yish har bir hududning nishonini kattalashtirardi, lekin
yo'laklar ustma-ust tushib, chegaradan 13px ichkarida turgan bosish
qo'shni hududga ketardi — ya'ni aniq ko'rinib turgan joyni bosganda
boshqa narsa tanlanardi. O'lchangan yechim: shaklning o'zi + kichiklar
uchun doira.

**Chizish tartibi kattadan kichikka.** SVG da keyingi element ustki
bo'ladi, demak kichik hudud kattaning ustida qoladi va bosish
o'g'irlanmaydi. 14/14 hudud o'z markazida to'g'ri tanlanishi o'lchandi.

### Nishon o'lchamlari (537px lik ustunda, 1,119px/birlik)

Eng kichik bbox: Toshkent shahri 6,9×7,5px → nishon doirasi 24,6px.
Keyingilari: Andijon 47,9×27,7 · Sirdaryo 31,3×45,4 · Farg'ona 57,5×37,6
· Namangan 55,7×38,5. Qolgan 9 tasi 53px dan katta.
Shakli ingichka bo'lgan hududlarda ham **ro'yxatdagi 44px lik qator**
teng qiymatli boshqaruv bo'lib qoladi — xarita hech qachon yagona yo'l
emas.

### Verify (real brauzer)

- 14/14 hudud o'z markazidan bosilganda AYNAN o'zi tanlanadi
  (`elementFromPoint` bilan o'lchandi) — qo'shni o'g'irlamaydi.
- Chegara kontrasti: hudud konturi to'ldirishga nisbatan **4,55:1**
  (light) va **4,05:1** (dark) — 1.4.11 talabi 3:1 dan yuqori.
  Kichik hudud halqasi 5,44:1 / 8,02:1.
- 8 viewport × 2 tema: 0 kontrast xatosi, overflow yo'q, xato yo'q.
- Yorliq: hudud ustida «NN · nom», fon ustida «Butun respublika»,
  ro'yxatdagi mos qator bir vaqtda yonadi.

Kadrlar: `.screenshots/qamrov-xarita-*.png`
Generator: `scratchpad/mkmap.py` (Natural Earth → path; qayta ishlatish
uchun repoga ko'chirilmagan — chiqishi `composer.js` ichida qotgan).
