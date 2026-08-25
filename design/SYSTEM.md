# Dizayn tizimi — holat va kontekst

AI-ready Design System Roadmap (designsystems.surf) bo'yicha audit, 2026-08-25.
Bu bitta operator uchun bitta sahifa — 20 sohaning bir qismi ko'p mahsulotli tizimga
mo'ljallangan va bu yerda qo'llanilmaydi. Ular «tegishli emas» deb belgilandi, «yomon»
deb emas.

## Baholash

| Soha | Holat | Dalil |
|---|---|---|
| **Goals** | unclear | `HANDOFF.md` nima qilishini aytadi, nega kerakligini emas: qaysi muammo, qanday dalil bilan |
| **Principles** | amalda bor, yozilmagan | Kod izohlari izchil qaror mantiqini ko'rsatadi (`ease-in` yo'q, `transition:all` yo'q, hover faqat `@media (hover:hover)`), lekin bir joyda sanab o'tilmagan |
| **Scope** | ready | Payload sxemasi, qamrov mantiqi (level 1-4), `expires_at` olib tashlangani sababi bilan yozilgan |
| **Architecture** | unclear | 51 CSS o'zgaruvchi rol bo'yicha to'g'ri ajratilgan, lekin qatlam qoidasi hech qayerda aytilmagan |
| **Ownership** | tegishli emas | Bitta muallif |
| **Foundations** | ready | Inter + IBM Plex Mono (kirill sababi bilan), radius/duration shkalalari, `font-synthesis: none` |
| **Tokens** | ready | Semantik rollar: `--bg-app/panel/field/raise`, `--text-main/body/muted`, `--accent-*`, `--ok/warn/crit`. Primitiv qiymat komponentda qo'lda yozilmagan |
| **Components** | unclear | CSS klasslar izchil (`.devin-input`, `.btn-devin-*`, `.sc-card`), lekin inventar yo'q — nima bor, qaysi holatlar qo'llab-quvvatlanadi |
| **Design–Code Alignment** | disconnected | `design/*.dc.html` kanvasi bor, README «Variant C qo'llangan» deydi, lekin qaysi qaror qaysi CSS'ga aylanganini hech narsa bog'lamaydi |
| **Documentation** | unclear | `HANDOFF.md` batafsil va aniq, lekin `.claude-state/` ichida — kod yonida emas, git'ga chiqmaydi |
| **Release** | unclear | Vercel'da, git tarixi mazmunli. CHANGELOG yo'q, versiya yo'q |
| **Communication / Enablement / Contribution / Governance** | tegishli emas | Bitta muallif, ichki asbob |
| **Metrics / Feedback** | yo'q | Hech narsa o'lchanmaydi. Bitta operator uchun bu maqbul |
| **Maintenance** | ready | Git tarixi har o'zgarishning sababini yozadi; kod izohlari «nega» ni tushuntiradi |
| **Deprecation** | tegishli emas | Iste'moldan chiqariladigan umumiy asset yo'q |
| **Prioritization** | ready | `.claude-state/TASKS.md` |

## Nima tuzatildi (2026-08-25)

Auditda topilgan va shu kuni tuzatilgan kamchiliklar — hammasi o'lchov bilan:

1. **Ichma-ich scroll** — `HANDOFF.md` «ichma-ich scroll konteynerlar YO'Q» deb yozgan,
   kod esa `height:100vh` + `.workspace-container{overflow-y:auto}` edi. O'lchov: kontent
   1607px, ko'rinadigan joy 904px. Sahifada scrollbar yo'q edi (kontent davomi borligi
   bilinmasdi), sichqoncha g'ildiragi kursor qayerdaligiga qarab boshqa ustunni surardi,
   Ctrl+F va print yashiringan qismni olmasdi. → hujjat qaroriga qaytarildi: sahifa bitta
   scroll, o'ng ustun `sticky`.

2. **Mobilda amal qatori yo'qolardi** — `stepper-foot` `sticky` bo'lgani uchun bitta
   ustunda `composer-pane` tugagan joyda yuqorida qolib ketardi. O'lchov: 390px da sahifa
   pastida `y = -322`, ya'ni «Navbatga qo'yish» ekrandan tashqarida. `HANDOFF.md` bu yerda
   ham «fixed bar» degan edi. → mobilda `position: fixed`.

3. **Safe-area inset ishlatilmagan** — `viewport-fit=cover` meta bor edi, `env(safe-area-inset-*)`
   esa butun faylda 0 marta uchraydi: iPhone'da mixlangan qator home indikatori ostiga
   tushardi. → amal qatoriga va ikkala ustun pastki padding'iga qo'shildi.

4. **Preview bo'sh holat matni o'qilmasdi** — `#8b95a3` bildirishnoma kartasining oq
   shaffof foniga nisbatan 2.91:1 (AA uchun 4.5 kerak). Operatorga nima yozilishi
   kerakligini aytadigan yagona qator shu. → `#6b7280`, 4.64:1 light, 4.83:1 dark.

5. **Mixlangan qator tor ekranda kontentni yopardi** — 320px da tugmalar ikki qatorga
   o'raladi va bar 91px dan 139px ga o'sadi, pastki bo'sh joy esa qat'iy raqam edi.
   O'lchov: «Hoziroq (Darhol)» tanlovi 9px kesilgan. → `--foot-h` ni `ResizeObserver`
   real balandlikdan yozadi, ikkala ustun padding'i shundan hisoblanadi.

6. **`theme-color` qo'lda tanlangan temaga ergashmasdi** — meta'lar faqat
   `prefers-color-scheme` ga bog'langan edi, sahifada esa qo'lda tema tugmasi bor:
   tizim light, tanlov dark bo'lsa status bar oq qolardi. Qiymat ham `--bg-app` dan
   olingan edi, holbuki status bar navbar ustida turadi. → `syncThemeColor()` har
   almashtirishda `--bg-rail` ni yozadi; media'li meta'lar JS'siz zaxira bo'lib qoladi.

7. **Bo'lim sarlavhasi 320px da kartadan chiqib ketardi** — sarlavha + o'ngdagi meta
   flex row'da sig'masdi (o'lchov: konteyner `right 296`, meta `right 309`).
   → 620px dan pastda ustma-ust.

Har biri real brauzerda o'lchandi va tuzatilgach qayta o'lchandi.

## Viewport matritsasi (2026-08-25, kesh chetlab o'tilgan)

320×568 · 390×844 · 414×896 · 896×414 (yotiq) · 768×1024 (planshet tik) ·
1024×768 (planshet yotiq) · 1440×960 · 1920×1080 — hammasida gorizontal overflow yo'q,
konteynerdan chiqqan element yo'q, mixlangan qator ostida yopilgan kontent yo'q.

## Nima allaqachon joyida edi

Audit paytida noto'g'ri «kamchilik» deb belgilanib, keyin tekshiruvda rad etilgan narsalar —
ular kodda to'g'ri hal qilingan:

- **iOS zoom** — `@media (pointer: coarse)` da input'lar 16px. `max-width` emas, `pointer`
  bo'yicha — planshet va yotiq telefon ham tushadi. Desktop brauzerda bu qoida yonmaydi,
  shuning uchun oddiy o'lchov uni «14px» deb ko'rsatadi.
- **Tegish maydoni** — o'sha blokda tugmalar 44px ga ko'tariladi; kichik matn tugmalarida
  `::after` bilan 40px ko'rinmas hit-area.
- **Fokus** — 30 ta interaktiv elementning hammasida `:focus-visible` izi bor.
- **Animatsiya** — `transition: all` yo'q, `ease-in` yo'q, layout xossalari animatsiya
  qilinmaydi (faqat transform/opacity).
- **Uzun matn** — 1710 belgi kiritilganda telefon o'lchami o'zgarmadi, matn clamp bo'ldi,
  «Matn uzun» ogohlantirishi `crit` holatga o'tdi, gorizontal overflow chiqmadi.

## Interaktiv holat matritsasi (2026-08-25)

Har holat real bosilib/yozilib o'lchandi (bir kadr = bir holat, `requestAnimationFrame`
bilan render kutilgan — aks holda click'dan keyingi o'lchov eski stilni qaytaradi):

| Holat | Natija |
|---|---|
| 3 radiogroup × 13 variant | Har birida `aria-checked` faqat bittada, tanlangan variant qolganlaridan vizual farq qiladi (qora ramka + to'ldirilgan doira) |
| Matn maydoni bo'sh | Placeholder `::before` orqali, balandlik 156px |
| Matn maydoni to'la | Matn TEPADAN boshlanadi (birinchi qator 15px, padding-top 13px), balandlik o'zgarmaydi |
| Fokus | `.wysiwyg-editor` o'zida iz yo'q, lekin `.wysiwyg-wrapper` `:focus-within` bilan ko'k ring beradi; boshqa 8 element real `.focus()` da 2px `rgb(0,112,247)` outline yoki ring |
| Select bo'sh | `data-empty="true"` + `error` klass + qizil ramka |
| Select to'la | Neytral ramka, `data-empty="false"` |
| Xato (to'liqsiz submit) | Maydonlarda qizil ramka + `aria-invalid="true"`, har biriga inline sabab («O'zbekcha sarlavhani yozing»), til nishonida `!`, pastdagi holat qizil va sonini aytadi |
| Muvaffaqiyat | Matn sig'sa yashil «Push bildirishnomada to'liq va chiroyli sig'adi» |

Yashirin `role="alert"` bloklari `display:none` — ekran o'quvchi ularni holat kelmaguncha
o'qimaydi.

**Eslatma:** «Qanchalik muhim?» (severity) bo'limi hozirgi UI'da yo'q — u oldingi
redizaynda olib tashlangan. `.sev-btn` klass nomi «Yuborish tartibi» tugmalarida qolgan;
funksional muammo emas, lekin nom eskirgan.

## Keyingi 3 ta ish

Og'irlik bo'yicha emas — bog'liqlik bo'yicha. Har biri tugatib bo'ladigan hajmda.

| Soha | Nega hozir | Keyingi qadam | Checkpoint |
|---|---|---|---|
| **Documentation** | `HANDOFF.md` — yagona tizim hujjati, lekin `.claude-state/` ichida va git'ga chiqmaydi; loyiha boshqa mashinaga ko'chsa yo'qoladi | Dizayn tizimi qismini shu faylga (`design/SYSTEM.md`) ko'chirish, `HANDOFF.md` da havola qoldirish | Yangi sessiya faqat repo'dan tizim qarorlarini o'qiy oladi |
| **Architecture** | 51 token to'g'ri, lekin qatlam qoidasi yozilmagan — keyingi o'zgarish primitiv qiymatni komponentga qo'lda yozib qo'yishi hech narsa bilan to'silmagan | Quyidagi «Token qatlamlari» bo'limini to'ldirish (10 qator) | Yangi rang kerak bo'lganda uni qayerga qo'yish savol tug'dirmaydi |
| **Design–Code Alignment** | `design/` kanvasi va `index.html` bir-birini bilmaydi — kanvas eskirsa buni hech narsa ko'rsatmaydi | `design/README.md` ga qaysi variantning qaysi qarori kodga o'tgani va qaysi biri o'tmagani yozilsin | Kanvasga qarab kod holatini aytish mumkin |

Qolganlari (Metrics, Feedback, Governance, Deprecation) bu loyiha o'lchamida ish
qo'shadi, foyda bermaydi — ataylab ochiq qoldirildi.

---

# AI kontekst paketi

Bu bo'lim shu loyihada UI o'zgartirmoqchi bo'lgan har qanday AI uchun. Maqsadi bitta:
mavjud qarorlarni **qo'llash**, yangisini o'ylab topmaslik.

## Yo'nalish

Bitta ekran: tizim xabarnomasi kompozitori. Foydalanuvchi — mahalla operatori, kuniga
bir necha marta ishlatadi, mobil va desktopdan. Xabar ikki tilda (uz/ru) ketadi va
telefon lockscreen'ida bildirishnoma bo'lib chiqadi — shuning uchun preview haqiqiy
iOS ko'rinishini taqlid qiladi va matn uzunligi jonli baholanadi.

**Non-goal:** bu ko'p mahsulotli dizayn tizimi emas. Komponentlar shu sahifa uchun,
qayta ishlatish uchun emas.

## Token qatlamlari

Ikki qatlam, ikkalasi ham `:root` da, `[data-theme="dark"]` da qayta ta'riflanadi:

- **Rol tokenlari** — komponentda ishlatiladigan yagona narsa:
  `--bg-app` (sahifa foni) → `--bg-panel` (karta) → `--bg-field` (kiritish maydoni) →
  `--bg-raise` (ustidagi qatlam) · `--bg-rail` (navbar/yon panel) · `--bg-hover`
  `--text-main` (sarlavha) · `--text-body` (asosiy matn) · `--text-muted` (izoh, label)
  `--line` → `--line-2` → `--line-3` (ajratkichning uch darajasi)
  `--accent`, `--accent-soft`, `--accent-text`, `--accent-press`, `--accent-line`, `--on-accent`
  `--ok`, `--warn`, `--crit` + har birining `-soft`/`-ring` varianti
- **Shkalalar** — `--r-sm/md/lg/xl/pill` (radius), `--fs-micro/tiny/sm/base/lg/xl/2xl/clock`
  (kegl), `--dur-1..5` + `--ease` (motion), `--font-ui`/`--font-mono`

**Qoida:** komponentda xom `#hex` yoki `px` rang/radius yozilmaydi — rol tokeni tanlanadi.
Mos rol yo'q bo'lsa, yangi rol qo'shiladi, primitiv qiymat emas. Yagona istisno — telefon
preview ichi: u iOS ko'rinishini taqlid qiladi va ataylab tema tokenlaridan mustaqil
(`#2b3542`, `#6b7280` — o'lchangan qiymatlar, tasodifiy emas).

## Tipografika

Inter (o'zgaruvchan, `opsz 14..32`) + IBM Plex Mono. Instrument Sans'da kirill yo'q edi —
ruscha matn tizim shriftiga tushib ikki xil ko'rinardi, shuning uchun almashtirilgan.
Mono faqat metadata va label uchun: uppercase, `letter-spacing: .08-.12em`, `--fs-micro`.
Raqamlarda `tabular-nums`, `font-synthesis-weight: none`.

## Komponent qoidalari

- **Karta** — oq tana, kul sarlavha yo'q (Pinterest naqshi): sarlavha 16.5px/620, izoh
  13px muted, `.card-body` padding 2/20/20
- **Tanlov** — radio-karta: ikonka + nom + tavsif + o'ngda holat doirasi; tanlanganda
  qora ramka va to'ldirilgan doira
- **Bo'lim sarlavhalari savol shaklida** — «Kim oladi?», «Nima yoziladi?»; raqamli nishon chapda
- **Majburiy maydon** `*` bilan; bo'lim to'lganda «Tayyor» nishoni avtomatik chiqadi
- **Amal qatori** — desktopda `sticky bottom`, mobilda `fixed` + safe-area; holat nuqtasi +
  matn + Test yuborish + asosiy CTA

## Motion

Faqat `transform` va `opacity`. Davomiylik 110-260ms (`--dur-1..5`), `--ease`.
`transition: all` va `ease-in` ishlatilmaydi. Hover qoidalari `@media (hover: hover)` ichida —
touch'da tap'dan keyin hover yopishib qolmasin.

## Layout

Desktop: `grid` 2 ustun (`minmax(0,1fr)` + 420px), sahifa **bitta** scroll qiladi, navbar
va o'ng ustun `sticky`. 1080px dan pastda bitta ustun, preview forma ostiga tushadi.
`pointer: coarse` da tegish maydonlari 44px, input'lar 16px.

## Qaerda tizimda javob yo'q

Bularni o'ylab topmang — to'xtang va so'rang:

- Yangi semantik rang roli (mavjud `ok/warn/crit` dan tashqari)
- Yangi radius yoki kegl qiymati (shkalada yo'q)
- Yangi komponent turi — bu sahifada 4 bo'lim bor, beshinchisi mahsulot qarori
- Payload sxemasini o'zgartirish (`HANDOFF.md` da qat'iy)

## Har promptga qo'shiladigan qator

> Yuqoridagi qarorlarni qo'lla. Token, komponent, variant, qiymat yoki qoida
> **o'ylab topma**. Kontekst javob bermasa — nima yetishmayotganini ayt va to'xta.

---

# Rebrend (2026-08-25) — my.gov.uz + designsystems.surf

Ikkala referens real ochilib **o'lchandi**, ko'z bilan chamalanmadi.

## my.gov.uz dan olingan (brend qatlami)

| Nima | O'lchangan qiymat |
|---|---|
| Asosiy ko'k | `#0068E0` — oq ustida 5.18:1 |
| Chuqur ko'k | `#0153B2` — 7.29:1, matn va bosilgan holat |
| Imzo gradienti | `linear-gradient(66deg, #0068E0 34%, #00DC82 122%)` |
| Yumshoq yuzasi | `#F2F7FF` |
| Rangli CTA soyasi | `rgba(0,104,224,.35) 0 4px 14px` |
| Shrift | Montserrat — **olinmadi** (kirill qamrovi va mavjud Inter sababli) |

## designsystems.surf dan olingan (struktura qatlami)

| Nima | O'lchangan qiymat |
|---|---|
| Radius | `100px` (pill) — 1201 elementdan 293 tasida, tizimning imzosi |
| Yuza | oq → `#fafafa` → `#f5f5f5`, soya deyarli yo'q |
| Mono label | IBM Plex Mono, 12px, uppercase, `rgba(0,0,0,.6)` |
| Urg'u gradienti | radial amber→orange — **olinmadi**, brend ko'ki bilan raqobatlashardi |

Loyihada mono label, oq havo va minimal soya allaqachon bor edi — bu qatlamdan
faqat **pill radius** qo'shildi.

## Gradient qayerda ishlatiladi va nega tugmada emas

CTA'da gradient sinaldi va **rad etildi**: 170px li tugmada 66° gradient chizig'i
bo'ylab oq matn kontrasti hisoblab chiqildi — 15% da 5.18, 50% da 4.34, 85% da
**2.84**. AA 4.5 talab qiladi. my.gov.uz o'sha gradientni katta hero yuzasida
ishlatadi, tor tugmada emas.

Gradient matnsiz yuzalarga ko'chirildi:
- navbar ostidagi 2px brend chizig'i (davlat platformasi imzosi)
- tanlangan qamrov kartasining ko'lam chizig'i (ko'kdan yashilga o'tish qamrov
  kengayishini ko'rsatadi)

Tugma esa tekis `--accent` + brend soyasi: soya gradient emas, matn ostida turmaydi,
shuning uchun xavfsiz.

## Yashil rangning ikki roli

`#00DC82` oq ustida 1.82:1 — matn uchun yaroqsiz, faqat gradientda. Muvaffaqiyat
holati uchun o'sha oiladan o'qiladigan bosqich olindi: light `#0E7A48` (5.39:1),
dark `#00DC82` (qora ustida 9.5:1).

## Verify

Kesh chetlab o'tilgan holda: light 0 kontrast xatosi, dark 0. Fokus halqasi endi
brend ko'kida (`rgb(0,104,224)`), 6/6 elementda ishlaydi.

Rebrenddan keyingi viewport matritsasi — 320×568 · 390×844 · 896×414 (yotiq) ·
768×1024 (planshet tik) · 1024×768 (planshet yotiq) · 1920×1080: hech qayerda
gorizontal overflow yo'q, konteynerdan chiqqan element yo'q, mixlangan qator
ostida yopilgan kontent yo'q, CTA hamma joyda pill (`9999px`), navbar ostidagi
brend chizig'i 2px va gradient saqlangan.

`theme-color` ikkala temada `--bg-rail` bilan bir xil qoldi (light `#fafafa`,
dark `#0a0a0a`) — brend ranglari yuza tokenlariga tegmagani uchun status bar
sozlamasi rebrenddan ta'sirlanmadi.

---

# Vizual til: designsystems.surf (2026-08-25)

Ilgari bu fayl designsystems.surf ni faqat **metodologiya** manbasi sifatida
ishlatgan (AI-ready roadmap, 20 soha). Bu bo'lim uning **vizual tilini** ham
oladi: tipografika, geometriya, chuqurlik va matn ierarxiyasi.

Qiymatlar taxmin qilinmadi — jonli sahifada `getComputedStyle` bilan o'lchandi
(Playwright, 1440×900, 2026-08-25).

## O'lchangan tizim

**Tipografika** — uch oila:

| Rol | DSS da | Bu yerda | Sabab |
|---|---|---|---|
| Sarlavha | `Inter Display` (Framer, yopiq) | `Inter Tight` | Google Fonts'dagi ochiq ekvivalent, kirill qamrovi bor |
| Matn | `Inter` | `Inter` | aynan |
| Yorliq | `IBM Plex Mono` | `IBM Plex Mono` | aynan; kirill qamrovi bor |

O'lchangan qadamlar: `56/61.6 ls-1.68px` · `40/50 ls-0.8px` · `32/40 ls-0.32px` ·
`20/30 ls-0.6px` · `16/24 ls-0.32px` · `14/21 ls 0` · `12/18 ls-0.24px` ·
mono `10/15` va `12/18` UPPERCASE.

Bu yerda eng katta qadam `32/40` (`--fs-2xl`) — DSS ning eng kichik display
qadami. 40 va 56 marketing sahifasining qadamlari, asbob sahifasida joyi yo'q.
Mono `10px` ham olinmadi: kirill katta harflari lotinnikidan zichroq ko'rinadi,
eng kichik qadam `11px` (`--fs-micro`) da qoldirildi.

**Geometriya** — radius taqsimoti o'lchandi: `100px` 308 marta, `6px` 30,
`8px` 10, `4px` 9, `12px` 3, `16px` 1. Ya'ni pill tasodifiy emas, tizimning
imzosi. Shkala shunga ko'chirildi:

| Token | Oldin | Endi | Qayerda |
|---|---|---|---|
| `--r-sm` | 4px | 6px | badge, ikonka joyi |
| `--r-md` | 6px | 8px | bar, inline izoh |
| `--r-lg` | 8px | 12px | maydon, karta |
| `--r-xl` | 12px | 16px | maydon konteyneri, modal |
| `--r-pill` | 9999px | 100px | tugma, chip, segment |

Pillga o'tganlar: `.sev-btn`, `.day-chip`, `.template-pill`, `.format-tag-pill`,
`.preset-pill`, `.month-preset-chip`. Tugmalar allaqachon pill edi.

Ichma-ich radius qoidasi: **tashqi = ichki + padding**. `.geo-cascade` shuning
uchun `--r-md` (8px) dan `--r-xl` (16px) ga ko'tarildi — ichida 12px li select
va 14px padding bor, 8px li konteyner ichidagi 12px li maydon teskari ko'rinadi.

**Chuqurlik** — DSS chegara bilan emas, ko'p qatlamli yumshoq soya bilan
ishlaydi. Ikkala qiymat aynan ko'chirildi:

    --shadow-card:  0 .602px .602px  -1.25px  rgba(0,0,0,.18),
                    0 2.289px 2.289px -2.5px  rgba(0,0,0,.16),
                    0 10px 10px      -3.75px  rgba(0,0,0,.06)
    --shadow:       0 .637px 1.147px -.875px  rgba(0,0,0,.17),
                    0 1.932px 3.477px -1.75px rgba(0,0,0,.16),
                    0 5.106px 9.191px -2.625px rgba(0,0,0,.14),
                    0 16px 28.8px    -3.5px   rgba(0,0,0,.08)

Dark'da bu qiymatlar quyuqlashtirildi va `--shadow` ga 1px halqa qo'shildi:
qora ustidagi qora soya ko'rinmaydi, chekkani faqat halqa ajratadi.

**Rang** — DSS monoxrom: `#fff` sahifa, `#fafafa` bo'lim, `#f5f5f5` ikkinchi
yuza, `#000` matn, `rgba(0,0,0,.6)` ikkilamchi, `rgba(0,0,0,.08)` hairline.
`--bg-raise` `#f2f2f2` dan `#f5f5f5` ga, `--bg-hover` `.05` dan `.04` ga,
`--text-main` `#171717` dan `#000000` ga o'tdi; dark'da `--text-main`
`#ededed` dan `#ffffff` ga.

DSS ning uchinchi matn qadami — `rgba(0,0,0,.45)` = `#8c8c8c` — **olinmadi**:
oq ustida 3.5:1, AA matn uchun 4.5 talab qiladi. O'rniga DSS ning ikkinchi
qadami (`#666`, 5.74:1) eng past bosqich qilib olindi, orasiga `#525252`
(7.5:1) qo'yildi.

## Nima OLINMADI va nega

**To'q sariq aksent.** DSS birlamchi tugmasi
`radial-gradient(75% 150% at 100% 114.2%, #ffb70f, #ff5400)`. Bu yerda aksent
my.gov.uz davlat ko'ki (`#0068E0`) bo'lib qoldi: davlat platformasi brend
rangini referens uchun almashtira olmaydi. DSS dan **tuzilma** olindi,
brenddan **rang**.

**Tugma soyasi.** DSS tugmalarida `box-shadow: none`. Bu yerda `--brand-shadow`
1px lik izgacha kamaytirildi, nolga emas: birlamchi tugma mixlangan qatorda
turadi, orqasida `backdrop-filter: blur(12px)` bor — mutlaqo tekis bo'lsa
yuzadan ajralmaydi.

**Mono tracking.** DSS da `letter-spacing: normal` — Plex Mono ning tabiiy
kengligi ishni bajaradi. Bu yerda `--ls-mono: 0.02em`, chunki kirill katta
harflari 11px da zichroq ko'rinadi. Ilgari 11 ta joyda qo'lda yozilgan
`0.04em`–`0.12em` qiymatlar shu bitta tokenga yig'ildi.

**Marketing qadamlari.** 40px va 56px sarlavha, to'liq kenglikdagi mesh-gradient
bo'limlar, `16px 16px 6px 6px` assimetrik karta burchagi — bular sotuv
sahifasining vositalari, forma asbobiga kirmadi.

## Imzo motivi

DSS sarlavhasi terminal kursori bilan tugaydi: `…component library_`. Bu yerda
`.page-title::after` chizilgan blok (0.46em × 0.075em), matn EMAS — ekran
o'quvchi `::after` kontentini o'qiydi va sarlavhaga «pastki chiziq» so'zini
qo'shib yuborardi. Miltillamaydi: WCAG 2.2.2 5 soniyadan uzoq miltillashni
taqiqlaydi va kursorni to'xtatib bo'lmaydi.

## Verify (2026-08-25, kesh chetlab o'tilgan)

| Tekshiruv | Natija |
|---|---|
| Kontrast, light | 0 xato (barg elementlar, telefon simulyatsiyasi tashqarida) |
| Kontrast, dark | 0 xato |
| Fokus izi | 27/27 interaktiv elementda |
| Nishon o'lchami | 2 ta istisno: `.link-btn` (jumla ICHIDAGI havola — WCAG 2.5.8 inline istisnosi), `.visually-hidden` (SR-only, vizual nishon emas) |
| Gorizontal overflow | 1440 · 768 · 390 · 320 — hech qayerda yo'q |
| Mixlangan qator ostida yopilgan kontent | 320×568 da 0 element |
| Shrift yuklanishi | `Inter Tight` · `Inter` · `IBM Plex Mono` — uchalasi `document.fonts.check` dan o'tdi |
| Geist qoldig'i | 0 element |

O'lchov eslatmasi: tema almashtirilgandan keyin `getComputedStyle` DARHOL
o'qilsa o'tish davridagi qiymatni qaytaradi. Har o'lchovdan oldin 450ms +
`requestAnimationFrame` kutilgan.
