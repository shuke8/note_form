# Redizayn — online-mahalla.uz dizayn tili

**Sana:** 2026-08-27 · **Manba:** https://online-mahalla.uz/ va /login
**Usul:** jonli sahifada `getComputedStyle` bilan O'LCHANDI. Taxmin qilinmadi.
**Kadrlar:** `.screenshots/ref-om-*.png` (manba) · `.screenshots/rd-*.png` (natija)

Ilgari loyiha designsystems.surf o'lchoviga qurilgan MONOXROM tizimda edi
(sof qora/oq, hairline to'r, mono shrift, ko'p qatlamli soya). Endi u
online-mahalla.uz ning o'z tiliga o'tkazildi.

## O'lchangan tokenlar

| Rol | Qiymat | Qayerdan olindi |
|---|---|---|
| root kegl | 15px | `html` (shuning uchun 22.5 / 16.875 kabi kasrlar chiqadi) |
| konteyner | 1300px | `nav.container` |
| navigatsiya | oq, radius **100px**, balandlik 76, chekka 10, tepadan 40 | `nav.container` |
| matn | `#171717` / `#5c5c5c` / `#56678f` | sarlavha / ikkilamchi / ko'k-kul |
| aksent | **`#0060fe`** — TEKIS, gradient emas | `/login` tugmasi |
| to'q navy | `#100448` | «ЭРИ билан кириш» |
| to'ldirilgan karta | `#ebf1ff`, radius **24**, chekka 24 | `.showcase__box` |
| oq karta | radius **28**, chekka 24, pastida **3px** rangli chiziq | `.biznesNavigator__box` |
| chiziq ranglari | `#1fc16b` · `#fa7319` · `#7d52f4` | uch karta |
| forma maydoni | oq, `1px solid #e1edf7`, radius **5px** | `/login` |
| soya | butun landingda BITTA: `0 1px 2px rgba(10,13,20,.03)` | — |
| tipografika | 60/500 · 30/500 · 22.5/400 · 15/400 · 16/600 | h1 / h2 / lead / body / label |
| tracking | hamma joyda `normal` | manfiy tracking yo'q |
| qahramon foni | `#C0D5FF`→oq gradient + (960,960) markazli r 960/830/680 doiralar | `heroBg1.svg` |

## Nusxa olinMAGAN uchta narsa (ular saytning kamchiligi)

1. **Sarlavha shrifti.** Sayt Rubik va PT Sans Caption ni YUKLAYDI, lekin
   `h1` hech qaysisini olmay `sans-serif` (Arial) bo'lib qolgan. Bu yerda
   hamma joyda **Rubik** — saytning o'z shrifti, lotin+kirill qamrovi va
   300–900 og'irliklari bor. PT Sans Caption olib o'tilmadi: u caption
   uchun chizilgan va faqat ikki og'irligi bor.
2. **Lead qator balandligi 1.1** (22.5px/24.75px). Ikki qatorli xatboshi
   uchun bu juda zich — bu yerda 1.45.
3. **Mobil.** Saytning 390px ko'rinishi buzilgan: kartalar bir-birining
   ustiga chiqadi, matn illyustratsiya bilan to'qnashadi, gorizontal
   siljish bor. Bu yerdagi barcha sahifada 320–1440 oralig'ida gorizontal
   siljish YO'Q.

Yana ikkita ataylab qilingan chekinish: **fokus izi** (saytda ko'rinadigan
fokus uslubi yo'q — bu yerda `#0060fe` halqa) va **qorong'i tema** (saytda
umuman yo'q, bu yerda esa allaqachon ishlaydi va olib tashlanmadi —
saytning `#100448` qiymati bilan bir tomirdagi ko'k-navy oilaga o'tkazildi).

## Kontrast — ikki qadamli semantik ranglar

Saytning yashili `#1fc16b` va to'q sarig'i `#fa7319` — ular **to'ldirish**
uchun (3px chiziq, nuqta, badge). Matn sifatida ular oq ustida 2.37:1 va
2.79:1, ya'ni AA dan o'tmaydi. Shuning uchun har rangda ikki token:
`--ok-fill` / `--warn-fill` — saytning qiymati; `--ok` / `--warn` — matn
uchun to'qlashtirilgani (5.25:1 va 5.02:1).

Aksentda esa TESKARI muammo qorong'i temada chiqdi: `--accent-solid`
ustida OQ matn turadi, ya'ni u yorug' bo'lsa bo'lmaydi (`#2b7bff` da oq
3.90:1). To'ldirish ikkala temada ham `#0060fe` (oq matn 5.16:1), MATN
uchun esa qorong'ida alohida `--accent-ink: #8ab4ff` (8.9:1).

## Yo'l-yo'lakay tuzatilgan uchta narsa

- **Gradient-matn hiylasi olib tashlandi** (`.fact-big`, `.y3-big`):
  `background-clip: text` + `color: transparent` `--accent-text` GRADIENT
  bo'lganida kerak edi. Yangi tizimda aksent tekis, ya'ni hiyla bir xil
  natija berib matnni «ko'rinmas» holatda qoldirardi.
- **Qahramondagi kenglik zaxirasi** (`motion.js`): eng uzun so'z bo'yicha
  olingan `min-width` chapdan tekislangan sarlavhada ko'rinmasdi, lekin
  sarlavha markazlashgach tire bilan so'z orasida 70px bo'shliq bo'lib
  chiqdi (quti 406px, so'z 265px). Zaxira o'chirildi.
- **Burchak nishonlari** (`.tick`) va nuqtali to'r foni chizilmaydi —
  ular boshqa tizimning chizma tili edi.

## Verify (real brauzer, `no-store` server)

`landing` · `composer` · `yuborilganlar` · `natija` · `yetkazish` —
1440 va 390 · yorug' va qorong'i:
- WCAG AA fail **0** (matn 4.5, katta matn 3.0 bo'yicha o'lchandi)
- gorizontal siljish **yo'q** (sahifada ham, jadval ichida ham)
- console **0 xato, 0 ogohlantirish**
- jadvaldagi sanalar `tabular-nums` bilan tekis tushadi (Rubik'da ham)

⚠️ Kesh tuzog'i: `python3 -m http.server` CSS ni keshlaydi va o'zgarish
ko'rinmay qolib, «qoida qo'llanmadi» degan yolg'on xulosa beradi. Verify
`no-store` sarlavhali server bilan qilindi (port 4174).

## Redizayndan keyin topilgan ikki kamchilik (2026-08-27, foydalanuvchi ko'rsatdi)

### 1. Xarita paneli bilan xaritaning O'ZI bir xil rangda edi

Yangi palitrada `--paper-sunk` ham, `--accent-soft` ham `#ebf1ff` — bu
saytda AYNAN shunday va o'zi to'g'ri. Lekin kompozitordagi xarita ikkalasini
bir vaqtda ishlatardi: panel (`.scope-mapwrap.tile`) `--paper-sunk` da,
kataklarning tinch foni ham `--paper-sunk` da, TANLANGAN katak esa
`--accent-soft` da. Natijada uchala yuza bir xil rang bo'lib, xarita faqat
konturdan iborat chizmaga aylandi va tanlov umuman ko'rinmasdi.

Endi to'rt yuza to'rt xil: panel `#ebf1ff` · tinch katak `--paper` (oq) ·
so'ngan katak fonsiz (panel rangi) · tanlangan katak to'ldirilgan `#0060fe`,
ustida oq raqam (5.16:1).

So'ngan katakning konturi uchun `--hairline-2` ham, `color-mix(--edge …)` ham
yaroqsiz chiqdi: birinchisi panel ustida 1.15:1, ikkinchisi QORONG'IDA
1.27:1 berdi (`--edge` u yerda shaffof va aralashtirilganda alfa ham
aralashadi). Bosiladigan element chegarasi WCAG 1.4.11 bo'yicha 3:1 talab
qiladi — shuning uchun bitta aniq qiymat `#6b7ba6` (yorug'da 3.74:1,
qorong'ida 3.62:1).

Yangi token: `--accent-soft-2` — `--accent-soft` ning O'ZI lavanda yuza
ustida turgan holat uchun.

### 2. Jadvalda ma'lumot juft-juft bo'lib ustma-ust turardi

Sarlavha ustida turi va hudud, sana ustida esa «keyingi»/«rejada» qatori
turardi. Ikki xil ma'nodagi qator bitta katakda bo'lgani uchun ko'z qaysi
biri ustun sarlavhasiga tegishli ekanini ajrata olmasdi.

**Endi har fakt O'Z ustunida, hech qayerda ustma-ust juftlik yo'q:**
`Xabar · Turi · Hudud · Holat · Yuborilgan · Keyingi · Yuborishlar · ⋯`

- kataklar `vertical-align: middle` — bir qatorli va ikki qatorli sarlavhali
  qatorlar bir-biriga nisbatan qiyshiq ko'rinmaydi (61 / 70px);
- `Yaratilgan` oynadagi faktlarga ko'chdi (`Boshlangan` yonida) — jadvalga
  to'qqizinchi ustun qo'shilmasin;
- ≤1200px da jadval qatorlarga yoyiladi (sakkiz ustun siqilgan holatda ham
  ~1050px so'raydi), 641–1200px oralig'ida kartadagi maydonlar IKKI ustunga
  tiziladi — aks holda keng ekranda kartaning o'ng yarmi bo'sh qolardi;
- ≤480px da yorliq ustuni 104px dan 86px ga toraydi: 305px lik kartada
  «8-mahalla "Do'stlik"» chekkaga yopishib qolardi.

Yo'l-yo'lakay: yashirilgan `thead` ning BUTUN zanjiri (`thead`/`tr`/`th`)
`display: block` qilindi — `overflow: hidden` jadval guruhiga qo'llanmaydi
va ichkaridagi kataklar 726px ga cho'zilib qolardi.

Verify: 320 · 390 · 1024 · 1440 × light/dark — kataklar kesishuvi 0,
haqiqiy gorizontal siljish yo'q, qirqilgan matn yo'q, AA fail 0,
console 0 xato, filtr/qidiruv/bo'sh holat/oyna/menyu ishlaydi.
Kadrlar: `.screenshots/tb2-*.png`, `.screenshots/rd-map-*.png`

### 3. Qator ichidagi ustunlar bir-biriga qo'shilib ketardi

Kataklar orasida faqat ichki chekka bor edi va ko'z «BIR MARTALIK» bilan
«Urganch shahri» ni bitta uzun matn deb o'qirdi. Endi har ustun o'z 1px
chizig'i bilan ajraladi.

Chiziq UCHINCHI katakdan boshlanadi (`td + td + td`): ikkinchi katakning
chap chekkasida yopishqoq sarlavha ustunining O'Z chizig'i (`::after`)
allaqachon turibdi va ikkalasi qo'shilib 2px qalin chiziq berardi
(o'lchandi: har chegarada aniq 1px qolgani tasdiqlandi).

Yoyilgan holatda vertikal chiziq ma'nosini yo'qotadi — kataklar yonma-yon
emas, ustma-ust turadi. U yerda har maydon GORIZONTAL chiziq bilan
ajraladi, oxirgi qatorники esa olib tashlanadi (bitta ustunli kartada
«Yuborishlar», ikki ustunlida «Keyingi» + «Yuborishlar») — aks holda chiziq
kartaning o'z chekkasi bilan qo'shilib ikki qavat bo'lib ko'rinardi.

Verify: 390 · 1024 · 1440 × light/dark — har chegarada 1px, ikki qavat
chiziq yo'q, AA fail 0, haqiqiy gorizontal siljish yo'q, console 0 xato.
Kadrlar: `.screenshots/tb3-*.png`

## Burchak va boshqaruv tizimi birlashtirildi (2026-08-27)

Foydalanuvchi: «hamma buttonlar bir xil designda emas · border radiuslarda
umumiylik yo'q, qayerdadur pill, qayerdadur rounded».

**Sabab tokenlarning NOMIDA edi.** `--r-1..--r-6` KATTALIK bo'yicha
nomlangandi (1 kichik, 6 katta) — ya'ni har kim o'ziga yoqqan qadamni
tanlardi. O'lchov shuni ko'rsatdi: tugma 5px, ikonka tugmasi pill, chip
pill, segment pill, menyu bandi 8px, toggle pill, tab pill — jami
**26 ta pill va 6 xil boshqaruv balandligi** (32/34/36/38/40/44).

### Endi burchakni ELEMENTNING ROLI belgilaydi

| Token | Qiymat | Kim |
|---|---|---|
| `--r-control` | **8px** | bosiladigan yoki yoziladigan HAMMA narsa: tugma, ikonka tugmasi, maydon, select, textarea, chip, belgi, segment, toggle, menyu bandi, tab, ro'yxat qatori |
| `--r-panel` | **16px** | suzuvchi qatlam: menyu, toast, ichki panel |
| `--r-card` | **24px** | karta, media, to'ldirilgan quti |
| `--r-container` | **28px** | oyna, jadval qobig'i, katta konteyner |
| `--r-full` | **999px** | RADIUS emas, SHAKL: nuqta, progress chizig'i, kvadrat medalion va navigatsiya tasmasi |

Balandlik ham uch qadamga tushdi: `--h-control` 44px (asosiy nishon,
WCAG 2.5.8) · `--h-control-sm` 36px (ikkilamchi) · `--h-badge` 28px
(bosilmaydigan belgi).

**Ichma-ich burchak** = tashqi burchak − ichki chekka (segmentda 8−4=4px,
toggle'da 8−3=5px). Teng radius bergan ichki element tashqi egri chiziqdan
«chiqib» turgandek ko'rinadi.

`--r-control` manbada 5px (o'lchangan, `/login`). 8px olindi, chunki bu
interfeysda manbada YO'Q elementlar bor — 28px lik belgi, 36px lik ikonka
tugmasi — va bitta qiymat hammasiga xizmat qilishi kerak: 5px 28px lik
belgida umuman sezilmaydi.

**Eski `--r-1..--r-6` va `--r-pill` nomlari BUTUNLAY olib tashlandi** —
aks holda burchaklar yana o'sha yo'l bilan tarqab ketardi. Jami 7 CSS va
14 dizayn fragmenti yangilandi.

Verify: `landing · composer · yuborilganlar · natija · variants` —
CSS dagi barcha radius endi rol tokeni (yoki hujjatlangan ichma-ich
`calc`); tugmalar hamma sahifada 44/36px va 8px; pill FAQAT navigatsiya
tasmasida; AA fail 0; 24px dan kichik nishon 0; console 0 xato.
Kadrlar: `.screenshots/tb4-*.png`

## Tanlangan holat: qora → brend ko'ki (2026-08-27)

Foydalanuvchi: «"Qachon ketadi?" bo'limi buttonlari qora bo'lgan, lekin
primary color ko'k bizda».

To'g'ri, va muammo bitta bo'limdan kengroq edi. Auditda «tanlangan» ma'nosi
uchun **uchta har xil til** yonma-yon yashagani chiqdi:

| Ilgari | Qayerda |
|---|---|
| qora to'ldirish `#171717` | `.seg-btn` (rejim, kun, oy chiplari), `.scope-row`, `.yx-seg` |
| yumshoq ko'k + 2px halqa | `.scope-all` |
| qora tagchiziq / qora matn | `.yb-sum`, `.yb-segment-btn`, `.toggle-btn`, `.vx-jump` |

**Endi qoida bitta: tanlov brend ko'kida.** Ikki shakl — element vazniga
qarab:
- **To'ldirish** (ixcham boshqaruv): `--accent-solid` + oq matn (5.12:1)
- **Halqa** (katta karta-nishon, `.scope-all`): `--accent-soft` fon +
  2px `--accent-solid` halqa + `--accent-ink` matn — solid ko'k bo'lsa
  blok butun bo'limni bosib ketardi

Ko'rsatkich shakllari (tagchiziq, suzuvchi thumb) ham qora emas, aksentda.

Qora `--ink` to'ldirish QOLGAN joylar — ular tanlov EMAS, konvensiya:
telefon bildirishnomasi ikonkasi, xarita ustidagi hint, toast va skip-link.

**Yo'l-yo'lakay tuzatilgan AA buzilishi:** `.scope-row[aria-current]` ning
ichki yorliqlarida `opacity: .86` bor edi. Qora fonda u sezilmasdi, ko'k
fonda esa AA ni buzadi: oq `#0060fe` ustida 5.12:1, 0.86 alfada esa
4.12 ga tushadi (o'lchandi). Opacity olib tashlandi — ierarxiya kegl va
og'irlikdan keladi.

Verify: composer (01 va 03 bo'limlari, tanlangan holatlar majburan
yoqilgan) × light/dark — AA fail **0** (o'lchov `opacity` ni ham
hisobga oladi), console 0 xato. Kadrlar: `.screenshots/seg-*.png`

## «Doimiy» varianti olib tashlandi (2026-08-27)

Foydalanuvchi qarori: «Qachon ketadi?» → «Takroriy» → «Qaysi davrda amal
qiladi?» dan **Doimiy** olib tashlandi. Qoldi: `Tanlangan oylar` va
`Sana oralig'i`; sukut — birinchisi, oy qatori bo'lim ochilishi bilan
ko'rinadi.

**Imkoniyat yo'qolmadi:** muddatsiz takrorlanish endi 12 oyni belgilash
bilan ifodalanadi (ekran buni ochiq aytadi: «12 oyning hammasi tanlangan —
jadval to'xtatilmaguncha har hafta qaytaveradi»).

⚠️ **Bitta narxi bor va u yozib qo'yiladi:** markupdagi eski izoh «Doimiy»
ni eng ko'p uchraydigan holat deb atagan edi («har dushanba, doimiy» —
hech qanday qo'shimcha bosish talab qilmaydi). Endi o'sha holat 12 ta oy
chipini bosishni talab qiladi. Agar bu og'ir bo'lsa, eng arzon yechim —
oy qatoriga «Barchasi» tugmasi (bitta bosish, aniq va yashirin sukut
emas). Buyurtma bo'lmagani uchun qo'shilmadi.

**Kodda `always` tarmog'i shunchaki o'chirilmadi.** `scheduleRule()` da
ilgari `default: w = { kind: "always" }` turardi — uni qoldirish xavfli
bo'lardi: `state.span` biror sabab bilan noma'lum qiymat olsa, ekran ikki
variantdan birini ko'rsatib turib, tanaga olib tashlangan uchinchisini
JIMGINA jo'natardi. Endi u `throw` qiladi. Shu bilan birga `spanText()`,
`scheduleReady()` va xulosa jumlasidagi «to'xtatilmaguncha har hafta»
tarmoqlari ham olib tashlandi — ular endi erishib bo'lmaydigan kod edi.

Yo'l-yo'lakay: `i-infinity` ikonkasi endi hech qayerda ishlatilmaydi —
oltita sahifaning sprite'idan olib tashlandi.

Verify (real brauzer): Takroriy → Sh → Sen+Okt → keyingi uchta yuborish
2026-09-05 / 09-12 / 09-19 to'g'ri hisoblandi · holat chipi «Sh · 09:00 ·
har yili Sen, Okt» · ikki variant orasida o'q tugmalari o'raladi va
`aria-checked` ergashadi · «Sana oralig'i» ga o'tganda oy qatori
yopiladi · AA fail 0 · console 0 xato. Kadr: `.screenshots/span-no-always.png`

## «Yakuniy ko'rinish» bo'limi qayta ishlandi (2026-08-27)

Foydalanuvchi: «"Xabar hali yuborishga tayyor emas." qismini va qolgan
bo'limlarni yaxshilab chiroyli qilib ko'rsatish kerak».

Auditda oltita aniq kamchilik chiqdi — hammasi o'lchandi:

1. **Verdikt bo'limdagi ENG KUCHSIZ matn edi.** `.sum-line` faqat
   `[data-ready="true"]` holatida `--ink` + 500 olardi; «tayyor emas»
   esa `--ink-2` + 400 bo'lib qolardi. Ya'ni javob berishi kerak bo'lgan
   qator o'zini yashirib turardi. Endi jumla ikkala holatda ham to'q va
   og'ir; holat farqi BELGIDA (ro'yxat ↔ tik) va chipda.
2. **Belgi qo'shildi** — 36px lik medalion, tugma bilan bir xil burchakda.
   U OGOHLANTIRISH EMAS: to'ldirilmagan maydon xato emas, shuning uchun
   qizil uchburchak yo'q (bu qaror kodda ilgaridan yozilgan edi va
   saqlandi). Tayyor holatda medalion yashil to'ldirish oladi.
3. **Osilib qolgan ajratkich.** `.dispatch-when` da `border-top` bor edi,
   lekin kataning eni `max-width: 62ch` bilan cheklangan — chiziq 640px
   da tugab, karta 1240px da davom etardi. Chiziq endi to'liq enli
   `.dispatch-title` ga ko'chdi va FAQAT tayyor holatda chiqadi (u yerda
   ikkita mustaqil jumla bor: «kimga» va «qachon»).
4. **Son ikki joyda takrorlanardi** — chipda ham, ro'yxat yorlig'ida ham
   «5 ta narsa qoldi». Endi chip SONNI, yorliq esa NIMA QILISH KERAKLIGINI
   aytadi.
5. **Bo'lim raqami har qatorda takrorlanardi** — ro'yxat «01 02 02 02 02»
   bo'lib ko'rinardi. Raqam endi guruhning faqat birinchi qatorida
   chiqadi; slot eni qat'iy, ya'ni matnlar bir vertikal chiziqda qoladi.
6. **O'q matndan ~900px uzoqda edi.** Ro'yxat 620px, quti 700px bilan
   cheklandi — quti endi kontentini o'raydi, qolgani kartaning o'z yuzasi.

Yo'l-yo'lakay: telefon sahnasi `.media` ning ko'p qatlamli mesh
gradientidan tekis brend ko'kiga o'tdi — yangi tizimda gradientli yuza
boshqa hech qayerda yo'q va u shu bo'limda yolg'iz qolgandi.

Verify: tayyor emas va TAYYOR holatlar × light/dark — `#step-5` ichida
AA fail 0 (o'lchov `opacity` ni ham hisobga oladi), gorizontal siljish
yo'q, console 0 xato. Kadrlar: `.screenshots/sum-before.png` ↔
`sum-final.png` · `sum-ready2.png` · `sum-dark.png`

### «Nima qilish kerak» — maydon ro'yxatidan bo'lim ro'yxatiga

Birinchi urinishdan keyin ro'yxat hamon devor bo'lib turardi: har BO'SH
MAYDON o'z qatorini olardi va 02-bo'lim to'rtta bir xil ko'rinishdagi
qator berardi («O'zbekcha sarlavhani yozing», «O'zbekcha matnni yozing»,
«Ruscha sarlavhani yozing», «Ruscha matnni yozing»). Bo'lim raqamining
takrorini yashirish yordam bermadi — muammo raqamda emas, DONALIKDA edi.

**Endi bir bo'lim = bir qator.** Foydalanuvchi baribir bo'limga BIR MARTA
o'tib, u yerdagi hammasini to'ldiradi — ro'yxat ham shu tartibda gapiradi:

| Ilgari (5 qator) | Endi (2 qator) |
|---|---|
| 01 Qamrovni tanlang… | **Kim oladi** · Qamrovni tanlang — … |
| 02 O'zbekcha sarlavhani yozing. | **Nima yoziladi** · 4 ta maydon to'ldirilmagan |
| 02 O'zbekcha matnni yozing. | |
| 02 Ruscha sarlavhani yozing. | |
| 02 Ruscha matnni yozing. | |

Bo'limda BITTA xato bo'lsa uning matni, bir nechta bo'lsa soni yoziladi —
«4 ta maydon» degan qator to'rtta qatordan aniqroq va qisqaroq.

Qatorning o'zi ham qayta chizildi: raqam endi yalang'och matn emas,
to'ldirilgan yumaloq-kvadrat nishon (tugma bilan bir xil burchakda);
uning yonida bo'lim NOMI (nima uchun borish kerak) va ostida NIMA
qilinishi; o'q hoverda 3px siljiydi (`transform`, layout tegilmaydi).
Qatorlar hairline bilan ajraladi — ular alohida kartalar emas, bitta
ro'yxatning bandlari.

Nishon o'zgarmadi: qator bosilganda o'sha bo'limning BIRINCHI bo'sh
maydoni fokus oladi (tekshirildi: «Nima yoziladi» → `uzTitle`,
scroll 2414px).

Verify: 1440 va 390 × light/dark — qator balandligi 64px (390px da 84–103,
ya'ni WCAG 2.5.8 dan yuqori) · AA fail 0 · gorizontal siljish yo'q ·
console 0 xato. Kadrlar: `.screenshots/todo-final.png`, `todo-390.png`,
`todo-dark.png`

#### Ro'yxat IKKI USTUNGA o'tdi

Bir ustunli ro'yxat kartaning chap yarmini egallab, o'ng tomonda ~640px
bo'sh joy qoldirardi. Ro'yxatni tor qutiga solish (`max-width: 600px`)
muammoni HAL QILMADI — u bo'shliqni faqat quti tashqarisiga ko'chirdi.

Bo'limlar soni 1 dan 4 gacha, ya'ni to'r hech qachon uzun bo'lmaydi.
Ikki ustun + `:last-child:nth-child(odd) { grid-column: 1 / -1 }` qoidasi
bilan TO'RTALA holat ham enni to'liq to'ldiradi (o'lchandi, ro'yxat eni
1160px):

| Bandlar | Joylashuv |
|---|---|
| 1 | bitta band butun enni oladi |
| 2 | ikki teng ustun |
| 3 | ikki ustun + oxirgisi butun enda |
| 4 | 2×2 |

Ajratkich `border-top` dan har bandning O'Z chegarasiga o'tdi: to'rda
gorizontal chiziq ustunlar orasida uzilib qolardi. 880px dan tor ekranda
to'r bitta ustunga tushadi.

Verify: 1440 (1/2/3/4 band holatlari o'lchandi) va 390 × light/dark —
AA fail 0, gorizontal siljish yo'q, nishon balandligi 88px, console 0
xato. Kadrlar: `.screenshots/todo-2col.png`, `todo-2col-390.png`

## Yozuv oynasi (`.yb-modal`) qayta ishlandi (2026-08-28)

### Yetkazish: to'rtta plita → bitta blok

Ilgari bu yerda to'rtta teng plita turardi — qamrov · yetkazildi ·
yetkazilmadi · keyingi yuborish. Uchta muammosi bor edi:

1. **To'rtinchi plita boshqa TURDAGI qiymat edi** — uchtasi katta son,
   to'rtinchisi sana (20px son yonida 12px sana). Bir qatorda ikki xil
   o'lchov turgani uchun ko'z naqshni yo'qotardi.
2. **Uchta son bir-biriga bog'liq**, lekin alohida qutilarda turib bu
   bog'liqlikni yashirardi. Eng muhim fakt — yetkazish ULUSHI — ekranda
   umuman yo'q edi, garchi uning ikkala qismi ham shu yerda turgan bo'lsa
   ham.
3. «Taxminiy qamrov» yorlig'i ikki qatorga o'ralib, qo'shnilaridan baland
   bo'lib qolardi.

Endi bitta blok: katta son + `/ ~qamrov`, o'ngda ulush foizi, ostida
chiziq va bir qatorli izoh. Ulush **pastga** yaxlitlanadi — 99,95% ni
«100%» deb ko'rsatish tugagan tarqatish degan yolg'on bo'lardi.

**Chiziq rangi HOLATDAN keladi:** xatolikda qizil (bannerdagi sabab bilan
bir xil rang), operator to'xtatganda neytral kul, aks holda brend ko'ki.
To'xtagan tarqatishning chizig'i ko'k turishi «hammasi joyida» degan
yolg'on signal bo'lardi.

**Tarqatish boshlanmagan holatda chiziq ham, ulush ham YO'Q** — nolinchi
chiziq «boshlandi-yu, hech kimga yetmadi» deb o'qilardi. O'rniga
taxminiy qamrov va «Tarqatish hali boshlanmagan».

### Faktlar: takror olib tashlandi, vaqt ro'yxatiga aylandi

- **«Qamrov»** olib tashlandi — u sarlavha ostidagi hudud yo'lini
  so'zma-so'z takrorlardi (bitta oynada bir xil uzun satr ikki marta).
- **«Tillar — O'zbekcha va ruscha»** olib tashlandi — ikkala til
  yuqorida to'liq matni bilan turibdi.
- Qolgani bitta savolga javob beradigan oila: **Jadval · Yaratilgan ·
  Boshlangan · Oxirgi yuborish · Keyingi yuborish**.
- Shart ham tuzatildi: ilgari «Oxirgi yuborish» faqat `next` BOR
  bo'lganda chiqardi, ya'ni bir martalik yuborilgan yozuvda sana
  ro'yxatdan tushib qolardi. Endi qator doim bor, qiymati yo'q bo'lsa
  tire.
- Navbatdagi BIR MARTALIK yozuvning reja sanasi ilgari oynada umuman
  yo'q edi (jadvalda «rejada» bo'lib turardi) — endi «Rejalashtirilgan»
  qatori bor.

### Amal qatori

«O'chirish faqat shu brauzerda ishlaydi» izohi tugmalar bilan bir
qatorda turardi va tugmaning yorlig'i bo'lib ko'rinib, «O'chirish» ni
o'chirilgan tugmaday ko'rsatardi. Endi u qatorning ostida, o'z qatorida.

Verify: to'rtta holat — yuborilgan (99,5%) · xatolik (33,6%, qizil
chiziq) · to'xtatilgan (98,4%, neytral chiziq) · navbatda (chiziqsiz) —
× light/dark × 1440/390. Oyna ichida AA fail 0, chetdan chiqqan element
0, console 0 xato. Kadrlar: `.screenshots/modal-before.png` ↔
`modal-after.png` · `modal-failed.png` · `modal-queued.png` ·
`modal-dark.png` · `modal-390.png`
