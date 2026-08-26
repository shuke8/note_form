# «Kim oladi?» — 8 variantning qiyosi va tavsiya

**Kontekst.** Operator — mahalla rahbari yoki tuman hokimligi xodimi. 90% hollarda
o'z mahallasiga yozadi; viloyat yoki respublika darajasi — kamdan-kam. Xato qamrov
million kishiga keraksiz xabar degani. Shuning uchun ikkita mezon boshqalaridan
ustun: **odatiy holatdagi amal soni** va **keng qamrovni tasodifan tanlab qo'yish xavfi**.

**Amal hisobi.** 1 amal = bitta boshqaruv bilan bitta o'zaro ta'sir: bitta bosish,
bitta `select` dan qiymat tanlash yoki bitta so'z yozish. Klaviatura yo'li ham,
sichqoncha yo'li ham shu birlikda o'lchandi.

---

## 1. Qiyoslash jadvali

| | Odatiy: o'z mahallasi | Kam uchraydigan: viloyat / respublika | Klaviatura | 320px | O'rganish narxi | Xato qilish xavfi |
|---|---|---|---|---|---|---|
| **v1 Narvon** | **3** (viloyat → tuman → MFY; daraja o'zi pastga tushadi) | 1 / 1 (radio yoki select) | **Yaxshi.** Native radio + native select, hech qanday maxsus mantiq yo'q | Har qator ikki satrga bo'linadi; 4 qator + futer doim ~270px+ egallaydi | O'rta-past. Radio va select ikkita alohida boshqaruv ekani birinchi safar tushuntirish talab qiladi | **O'rta-past.** To'rt daraja raqami yonma-yon turadi — xato darhol ko'rinadi. Lekin radio guruhida bitta o'q bosishi darajani mahalladan respublikaga ko'taradi (native xatti-harakat, tasdiq yo'q) |
| **v2 Qidiruv** | **2** (nom bo'lagini yozish → ro'yxatdan tanlash) | 2 / 2 | **A'lo.** To'liq combobox: o'q/Enter/Escape, `focusout` tiklash, faol qator o'zi yoritiladi | **Eng yaxshi.** Bitta maydon + to'liq kenglikdagi panel | Past — agar nomni bilsa. Tuzilma ko'rinmagani uchun «qanday darajalar bor» savoli javobsiz qoladi | **Past.** Daraja tanlangan natijadan chiqadi, yakun kartasi darajani, yo'lni va raqamni birga ko'rsatadi. Bo'sh so'rovda hech nima yoritilmaydi — yalang'och Enter respublikani tanlab qo'ymaydi |
| **v3 Tezkor** | **1** (tayyor karta) — profil/tarix bo'lsa. Aks holda **5** (panel + 3 select + tasdiq) | 3 / 3 (panel orqali) yoki 1 (tarixda bo'lsa) | Yaxshi. Kartalar orasida o'q faqat fokusni suradi, chegarada to'xtaydi; panel ichi native | Kartalar bitta ustunga tushadi, konteyner so'rovi CTA ni to'liq kenglikka chiqaradi | **Eng past.** Bitta tugma | **Past** takroriy holatda: karta mahallaning nomini o'zi yozib turadi. Kartalar bir xil ko'rinadi, darajani faqat yorliq ajratadi |
| **v4 Xarita** | **3** (viloyat → tuman → MFY) | 1 / 1 | Yaxshi. Ro'yxat xaritaning to'liq ekvivalenti, xarita `aria-hidden` | **Eng yomon degradatsiya.** Ustun 504px dan tor bo'lsa xarita bosilmaydigan rasmga aylanadi — variantning bosh g'oyasi mobil'da yo'q | O'rta. Xarita chaqiradi, lekin faqat viloyat darajasida gapiradi — bu kutilmani buzadi | **Eng yuqori.** «Turgan joying = qamroving»: tumanlarni KO'RISH uchun viloyatni bosasiz — va shu zahoti 3.3M ga qamrov qo'yiladi. Chuqurlashishning o'zi tasdiq |
| **v5 Ustunlar** | **3** | 1 / 1 | Kuchli, lekin xavfli: **tanlov fokusga ergashadi** — ustunda har o'q bosishi yangi `scopechange` otadi | ≤880px da akkordeon: uch ustun yonma-yon turishi — asosiy afzallik — yo'qoladi | **Eng yuqori.** Finder ustunlari va «qayerda to'xtasang — qamroving shu» modeli hech qayerda yozilmagan | **Yuqori.** v4 dagi model + klaviatura bilan yurishning o'zi tanlov. Qidiruvi yo'q |
| **v6 Savat** | **4** (3 select + «Savatga qo'shish») | 1 / 2 | O'rta. 12 ta ✕ ning hammasi Tab zanjirida (12 ta ortiqcha to'xtash), `Delete` bilan o'chirish | Ishlaydi (raqam nom tagiga tushadi), lekin 3 select + 12 qatorli ro'yxat juda uzun | O'rta-yuqori: savat, «yutilgan» qator, `≥` belgisi — uchta yangi tushuncha | Bir hudud uchun **past**, lekin **integratsiya xavfi yuqori**: bir nechta element bo'lsa `region/district/mahalla` `null` bo'ladi va `level` eng KENG elementdan olinadi — `items[]` ni o'qimagan host xabarni keng qamrovga yuboradi |
| **v7 Bosqich** | **4** (daraja + viloyat + tuman + MFY) | 1 / 2 | **Eng to'g'ri.** `radiogroup` + roving tabindex; o'q faqat fokusni suradi, tanlash Enter/Space bilan — ataylab | **Eng yaxshi struktura:** bir vaqtda bitta savol | **Eng past** birinchi marta kirgan uchun | **Eng past.** Daraja — birinchi ATAYLAB berilgan javob; oqim tugamaguncha `reach` uzatilmaydi; crumb faqat o'zidan keyingi javoblarni tozalaydi |
| **v8 Tarozi** | **4** (daraja + 3 select) | 1 / 2 | Yaxshi, lekin segmentda o'q bosishi darajani darhol almashtiradi (raqam esa select to'lmaguncha `null`) | Ishlaydi; ekranning yuqori uchdan biri natijaga ketadi, tanlash pastga siljiydi | O'rta. Logarifmik tarozini o'qishni o'rganish kerak | **Past.** Daraja ochiq tanlanadi, katta raqam tasdiq vazifasini bajaradi |

**Ko'p mahallaga birga xabar (c stsenariysi)** jadvalga sig'maydi, chunki 8 tadan
faqat **bittasi** buni umuman qila oladi:

| Variant | Uch mahallaga birga | Natija shakli |
|---|---|---|
| **v6 Savat** | 3 × 4 = **12 amal**, bitta ekranda | Halol jami, ichma-ich tushgani ikki marta sanalmaydi |
| Qolgan 7 tasi | **Mumkin emas** | Uchta alohida xabar yuborish kerak |

---

## 2. Har variantning bitta jumlalik mag'zi

1. **Narvon** — to'rt darajaning raqami bir vaqtda ko'rinadi, shuning uchun «mahalla ozmi yoki tuman yetarlimi» degan qaror boshqa ekranga o'tmasdan qabul qilinadi.
2. **Qidiruv-birinchi** — nomni bilgan operator uchun eng qisqa yo'l: yozasiz, tanlaysiz, daraja tanlovning turidan o'zi chiqadi.
3. **Tezkor tanlov** — kundalik 90% holat bitta bosishga tushadi, qolgani yig'ilgan panelda kutadi.
4. **Xarita** — hududni nomi bilan emas, joylashuvi bilan eslaydigan operator uchun, lekin xarita faqat viloyat darajasida gapiradi.
5. **Ustunli drill-down** — butun ierarxiya yonma-yon ko'rinadi va qamrov siz to'xtagan ustunda aniqlanadi.
6. **Ko'p tanlov savati** — bitta voqea bir nechta hududga tegsa, ular bitta ekranda halol jamlanadi.
7. **Bosqichma-bosqich** — har ekranda bitta savol, adashadigan joy yo'q, lekin taqqoslaydigan joy ham yo'q.
8. **Qamrov tarozisi** — tanlov emas, natija bosh qahramon: «men mahalla bilan respublika orasida qayerdaman» savoliga bir qarashda javob.

---

## 3. Uch stsenariy bo'yicha g'olib

### (a) O'z mahallasiga tez xabar — 90% holat

**G'olib: v3 Tezkor tanlov (1 amal).** Ikkinchi: **v2 Qidiruv (2 amal).**

v3 shu stsenariy uchun maxsus qurilgan va uni 1 amalga tushiradigan yagona variant.
Lekin g'alaba ikkita shartga bog'liq va ikkalasi ham hozir bajarilmagan:

- `window.OM_PROFILE` **loyihada umuman yo'q** (`grep` bo'yicha faqat v3 ning o'z
  faylida eslatiladi) — «Mening mahallam» kartasi hozir qattiq yozilgan namunadan
  chiqadi. Profil ulanmasa asosiy afzallik yo'q.
- Tarix `localStorage` da: brauzer xotirasi tozalansa yoki operator boshqa
  kompyuterga o'tsa, hamma narsa 5 amallik panelga qaytadi.

Shuning uchun **v2 — ishonchliroq asos**: u hech qanday qo'shimcha infratuzilmasiz
2 amalda ishlaydi va qurilmaga bog'liq emas. To'g'ri yechim — ikkalasini birga
olish (4-bo'limga qarang).

### (b) Notanish tumanni topish

**G'olib: v2 Qidiruv (2 amal).** Farq katta, boshqalar bilan solishtirib bo'lmaydi.

Notanish tuman muammosi aslida ikkita: nomni topish **va** u qaysi viloyatga
qarashli ekanini bilish. v2 ikkalasini bitta amalda hal qiladi — natija qatorining
o'zi yo'lni («Tuman · Viloyat») yozib turadi. Qolgan yettitasida avval **viloyatni
to'g'ri taxmin qilish shart**: taxmin xato bo'lsa, operator yopiq `select` larni
birma-bir ochib chiqadi (amaliyotda 3–15 amal), chunki hech birida qidiruv yo'q.

Istisno: savol geografik bo'lsa («qaysi chekkada», «qo'shni tumani qaysi») —
u holda **v4 Xarita** yoki **v5 Ustunlar** tezroq. Lekin tuman NOMI berilgan
odatiy holatda bu istisno kam ishlaydi.

### (c) Bir nechta mahallaga birga xabar

**G'olib: v6 Savat — raqobatchisiz.**

Qolgan yettitasi bitta tugun tanlaydi; ko'p mahalla uchun operator xabarni bir necha
marta qaytadan yozishi kerak. v6 ustunligi faqat qulaylikda emas, **raqam
halolligida**: ichma-ich tushgan tanlov jamidan chiqariladi, ya'ni bitta odam ikki
marta sanalmaydi. Bu qo'lda hisoblab bo'lmaydigan narsa.

---

## 4. TAVSIYA

### Asosiy: **v3 ning qobig'i + v2 ning dvigateli**

Bitta variant o'zi yetmaydi — chunki (a) va (b) stsenariylari bir-biriga qarama-qarshi
narsani talab qiladi: (a) hech qanday tanlovsiz bitta tugma, (b) esa erkin qidiruv.
v3 birinchisini beradi, ikkinchisini esa uch bosqichli panel bilan **yomon** hal qiladi.
v2 aksincha. Aynan quyidagi qismlar birlashtiriladi:

1. **Yuqori qator — v3 ning tayyor kartalari** (`v3-tezkor.html`, `renderPicks`/`card`):
   «Mening mahallam» + so'nggi 3 ta qamrov. Bu 90% holatni 1 amalga tushiradi.
   Shart: `OM_PROFILE` haqiqatan ulansin, aks holda karta ko'rsatilmasin — v3 da
   bu mantiq allaqachon to'g'ri yozilgan (`homeOk`).
2. **Uning ostida — v2 ning bitta qidiruv maydoni**, v3 ning uch bosqichli
   panelining **o'rniga** (uni butunlay olib tashlash kerak, yonida qoldirish emas).
   v2 ning ichidan aynan: apostrofga befarq `fold()`, uch daraja bo'ylab
   bitta indeks, natijada `<mark>` bilan moslik joyi va **yo'l qatori** — (b)
   stsenariysining javobi shu qatorda.
3. **Tasdiq bloki — v2 ning yakun kartasi**, lekin ulushi **v1 ning matni bilan**:
   «reestrdagi N hudud jamidan ~X%». v1 dagi formulirovka yagona to'g'risi —
   maxraj o'zini nomlaydi, ya'ni chala reestrda ham yolg'on bo'lmaydi.
   Ulush chizig'i (`v1-track`) shu yerga tushadi: keng qamrov ko'z bilan ko'rinadi.
4. **Ko'p tanlov — v6 ning savati alohida rejim sifatida**: qidiruv maydoni yonida
   «yana hudud qo'shish» tugmasi. **Standart rejim bo'lmasin** — v6 ning o'zi
   bir hududlik xabarga 4 amal talab qiladi, bu 90% holatni jazolaydi.
   v6 dan olinadigan mantiq: `swallows()` (ichma-ich tushgani jamidan chiqariladi)
   va `items[]` bilan hodisa.
5. **Xavfsizlik qoidasi — v7 dan**: tanlov TUGAMAGUNCHA `reach` uzatilmasin va
   oraliq holat host'ga «tayyor qamrov» bo'lib ko'rinmasin (`emit()` da
   `shown === st.length` sharti). Bu «xato qamrov = million kishi» talabining
   kod darajasidagi ifodasi.

**Nega asos v2, v7 emas.** v7 xato xavfi bo'yicha eng yaxshisi va klaviaturasi eng
to'g'risi, lekin odatiy holatga **4 amal** qo'yadi — kuniga bir necha marta shu bir
mahallaga yozadigan operator uchun bu har safar to'lanadigan soliq. v7 ning kuchi —
bir vaqtda bitta savol — 320px da va tayyorgarliksiz foydalanuvchi uchun qimmatli;
uni **mobil ko'rinish** sifatida saqlash mumkin. Lekin desktop asosi bo'la olmaydi.

**Nega asos v1 emas.** v1 halol va bashoratli, xatosi ko'rinadigan variant, lekin
to'rt qator doimo ~270px joy egallab, **operator yiliga bir marta qiladigan
taqqoslashni** har safar ekranga chiqaradi. 90% holatda bu joy bekorga ketadi.
v1 dan saqlanishi kerak bo'lgan narsa — ulush chizig'i va maxraj matni (yuqorida 3-band).

---

## 5. Nimadan VOZ KECHISH kerak

### v4 Xarita — qiziq ko'rinadi, amalda eng xavflisi

Uchta mustaqil sabab, har biri o'zi yetarli:

1. **Chuqurlashish = tasdiqlash.** Tumanlar ro'yxatini KO'RISH uchun viloyatni
   bosish shart, bosish esa qamrovni o'sha zahoti 3.3 million kishiga qo'yadi.
   Bu «xato qamrov = million kishiga keraksiz xabar» degan mahsulot talabining
   to'g'ridan-to'g'ri aksi. Muallif buni bug emas, «e'lon qilingan model» deb
   himoya qiladi — modelning o'zi shu mahsulotga to'g'ri kelmaydi.
2. **Xarita faqat viloyat darajasida gapiradi.** Tuman ham, mahalla ham unda yo'q.
   Ya'ni 90% holat — mahalla — xaritadan umuman foyda ko'rmaydi; xarita faqat
   kamdan-kam ishlatiladigan 10% ga xizmat qiladi.
3. **Mobil'da g'oya butunlay yo'qoladi.** Ustun 504px dan tor bo'lsa xarita
   bosilmaydigan ko'rsatkichga aylanadi va oddiy ro'yxatdan farqi qolmaydi.

Xaritani **ixtiyoriy ko'rgazmali qatlam** sifatida keyinroq qaytarish mumkin
(tanlangan hududni yoritib turadigan, tanlamaydigan rasm) — lekin tanlash asbobi
sifatida emas.

### v5 Ustunlar — eng qimmat, eng kam foydali

v4 ning barcha xavfini takrorlaydi va ustiga o'zinikini qo'shadi: **tanlov fokusga
ergashadi**, ya'ni ro'yxatni klaviatura bilan ko'zdan kechirishning o'zi har qadamda
yangi qamrov tasdiqlaydi. Bunga qo'shib: qidiruv yo'q, desktopda ~500px balandlik,
≤880px da uch ustun akkordeonga aylanadi — ya'ni yagona afzallik («hammasi yonma-yon»)
aynan mobil'da yo'qoladi. Finder ustunlari mahalla rahbari uchun tanish idioma emas.

### v8 Tarozi — g'oyasi to'g'ri, shakli qimmat

Logarifmik tarozidan voz kechish kerak: u faqat chiqish (u bilan tanlab bo'lmaydi),
ikki yaqin tumanni ko'z ajratmaydi, MFY raqamlari bo'lmasa butunlay yo'qoladi va
ekranning yuqori uchdan birini egallab, tanlash boshqaruvlarini pastga suradi.
**Saqlash kerak bo'lgan qismi — katta raqam va yo'l qatori** (masshtab hissi), u
tavsiya etilgan tasdiq blokiga sig'adi.

### v1 va v7 — voz kechilmaydi, lekin asosiy bo'lmaydi

v1 ning ulush chizig'i va maxraj matni tavsiyaga kiritildi. v7 mobil ko'rinish va
tayyorgarliksiz foydalanuvchi yo'li sifatida saqlanadi. Ikkalasi ham desktop asosi
sifatida 90% holatga ortiqcha amal qo'yadi.

---

## 6. Yig'ish paytida tuzatilishi shart bo'lgan qoldiq xatolar

Bu topilmalar variant mualliflarining hisobotlarida **yo'q** — kod bo'yicha
tekshirildi. Qismlar birlashtirilganda ular ham ko'chib o'tadi:

1. **`pop: 0` uchta variantda hamon «~0 kishi» deb chiqadi** — bu aynan kontrakt
   3-bandi taqiqlagan yolg'on («nol» = «hech kim»). O'lchandi:

   | v1 | v2 | v3 | v4 | v5 | v6 | v7 | v8 |
   |---|---|---|---|---|---|---|---|
   | `—` | **`~0`** | `—` | **`~0`** | `—` | **`~0`** | `—` | `—` |

   Sabab — qorovul shartidagi farq: v2 `v >= 0`, v4 `typeof v === "number"`,
   v6 `isFinite(v)`. To'g'risi v1/v5/v7/v8 dagidek `isFinite(v) && v > 0`.
   **v2 ni asos qilib olayotganimiz uchun bu birinchi navbatda tuzatiladi.**

2. **v3 respublika jamini jimgina kam ko'rsatadi:**
   `TOTAL = REGIONS.reduce(..., a + (GEO[r].pop || 0), 0)` — bitta viloyatning
   raqami yo'q bo'lsa jami kamayadi, lekin ekran buni aytmaydi. v1, v2, v4, v6, v7
   bunday holatda jamini butunlay `null` qiladi. v3 ning kartalari ko'chirilayotganda
   shu qator ham to'g'rilanadi.

3. **`window.OM_PROFILE` mavjud emas.** v3 ning «Mening mahallam» kartasi —
   tavsiyaning 1-bandi — profil manbasi ulanmaguncha ishlamaydi. Bu alohida
   backend/sessiya vazifasi, UI ishi emas.

4. **`assets/variants.js:readMeta()`** izohni `-->` da to'xtatmaydi va har
   kartaning «Narxi» katagiga ~800 belgilik xom markup to'kadi. 8 tadan 6–7 tasida
   ko'rinadi (v2 va v3 mualliflari o'z faylida yopuvchi tegni alohida qatorga
   chiqarib chetlab o'tgan). Bitta qatorlik tuzatish, host faylida.

5. **v7 fayli 237 qator** — kontrakt chegarasi 220. Agar v7 mobil ko'rinish
   sifatida saqlansa, bu chegara qayta ko'rib chiqilishi kerak: uchta qatlam
   (status mintaqasi, roving tabindex li radiogruppa, halollik qorovullari)
   220 qatorga sig'maydi.
