# «Yetkazish ma’lumotlari» — sakkiz variant, taqqoslash

Jonli sahifa: `yetkazish.html` (uch holat × ikki kenglik × ikki mavzu almashtirgichi bilan).
Fragmentlar: `design/yetkazish/y1…y8`. Kontrakt: `CONTRACT.md`.

## Nima uchun qayta qurildi

05-bo‘limdagi `.dispatch-meta` ustuni uchta `<p>` yorlig‘i va uchta qiymat
qatoridan iborat edi. Muammo bezakda emas, TUZILISHDA:

- uch blok bir xil vizual og‘irlikda — ko‘z qaysi biri muhimligini bilmaydi;
- yorliq bilan qiymat orasida faqat 6px — juftlik ko‘rinmaydi, qatorlar
  bitta uzluksiz matn bo‘lib o‘qiladi;
- ustunning o‘z yuzasi yo‘q: u telefon sahnasining yonida fonda «suzib»
  turadi, chegara ham, sarlavha ham yo‘q;
- «ILOVA / yo‘q» — ikki qator joy egallab, hech narsa demaydi;
- pastda katta bo‘sh maydon qoladi, chunki ustun kontenti telefon
  sahnasidan ancha past tugaydi.

## Tanlov

**03 — Fakt plitalari** (foydalanuvchi qarori, 2026-08-27). Kompozitorga
olib kirildi: `composer.html` `.dispatch-facts` + `.fact-grid`,
`assets/composer.css` «YETKAZISH FAKTLARI», `assets/composer.js`
`renderDispatchDates()` va `renderDispatchFiles()`.

Integratsiyada topilgan kamchilik: `container-type` va
`grid-template-columns` bitta elementda edi — `@container` so'rovi faqat
AJDODGA yo'naltiriladi, shuning uchun ikki ustunli holat 653px kenglikda
ham yonmasdi. Konteyner (`.dispatch-facts`) va setka (`.fact-grid`)
ajratildi.

## Sakkiz yondashuv

| № | Nom | Asosiy g‘oya | Eng kuchli joyi | Narxi |
|---|---|---|---|---|
| 01 | Jo‘natma varaqasi | Oq hujjat, hairline bilan ajratilgan uch qator: ikonka + yorliq + qiymat | Uch fakt ham to‘lgan holat; 340px da sinmaydi | Qamrov soni endi eng katta raqam emas |
| 02 | Marshrut | Vertikal chiziq: kimga → qachon → nima bilan → yuborish | «Hali ketmagan» ekanini tuzilishning o‘zi aytadi | Ixtiyoriy ilova majburiy bo‘g‘in bo‘lib ko‘rinadi; baland |
| 03 | Fakt plitalari | Har fakt o‘z chegarali plitasida, qamrov keng plitada | Ustun kengaygan holatda joyni to‘ldiradi | Kompozitorda uch qavat quti hosil bo‘ladi |
| 04 | Raqamlangan qatorlar | Quti yo‘q: mono indeks + to‘liq enlik hairline | Halqali kartaga yana bir quti qo‘shmaydi | Chegarasiz — «suzish» hissi qisman qoladi |
| 05 | Pochta yorlig‘i | Qalin kontur, mono katta harflar, punktir, shtrix-kod chizig‘i | Ohangni bir zumda uzatadi | Neytral mahsulot UI oilasidan chiqadi |
| 06 | Kalendar boshchiligida | Uch sana kalendar varaqchasi bo‘lib tepada | Takroriy jadvalda savol bir qarashda javob oladi | «Hoziroq» rejimida ierarxiya o‘zgaradi |
| 07 | Bitta jumla + tafsilot | Hammasi bitta jumlada, tafsilot ochiladigan panelda | Ko‘p yuboradigan operator uchun eng jim ekran | Sanalar sukut holatda ko‘rinmaydi |
| 08 | Chek va uzmasi | Karta ikkiga bo‘linadi: qamrov tepada, qolgani uzmada | Qamrov o‘z maydonida yolg‘iz turadi | `mask` yo‘q brauzerda o‘yiqlar yo‘qoladi |

## Uch holatda sinaldi

1. **To‘liq** — respublika, takroriy jadval, ikkita ilova.
2. **Tor qamrov** — bitta mahalla (uzun yo‘l), «hoziroq», ilovasiz.
3. **Bo‘sh** — hech narsa tanlanmagan.

Bo‘sh holatda birortasi `«—»` chiqarmaydi: har biri NIMA yetishmayotganini
va qaysi bo‘limdan tuzatilishini aytadi.

## Real brauzerda topilgan va tuzatilgan kamchiliklar

- **Sahna qorong‘i mavzuda oq qolardi.** `--accent-soft` qorong‘ida SHAFFOF
  ko‘k (`rgba(59,130,246,.14)`), ya‘ni yolg‘iz berilganda ostidagi oq sahifa
  ko‘rinardi va sahna ichidagi oq matn yorug‘ fonda yo‘qolardi. 04-variant
  (o‘z kartasi yo‘q) butunlay o‘qilmas bo‘lib qolgandi. Yechim: fon ikki
  qatlam — qattiq `--paper`, ustiga `--accent-soft`.
- **«3 ta yaqin sana»** (01 va 05) — sarlavha pastdagi ro‘yxatning
  uzunligini takrorlardi va «keyingi yuborish» yorlig‘iga javob bermasdi.
  Endi sarlavhada ENG YAQIN sana turadi, qolganlari «Keyin» ostida.
- **`--ink-3` matnda** (04 indeksi, 06 vaqt mintaqasi, 08 pastki izohi) —
  bu token dekorativ (3.35:1). Hammasi `--ink-2` ga o‘tkazildi.
- **Ilova katta mono raqamda** (01 va 05) — ixtiyoriy fakt qamrov bilan teng
  og‘irlik olardi. Sans va bir pog‘ona pastga tushirildi.
- **08 da sana kesilardi** — ikki ustunli setkada kun nomi bilan soat bitta
  yacheykaga tiqilib, ellipsis `09:…` bo‘lib chiqqandi. Uch ustunga o‘tdi.
- **`~3 400`** namunasi oddiy probel bilan yozilgandi va tor ustunda ikki
  qatorga bo‘linardi — uzilmas probelga o‘tkazildi.

## Verify (real brauzer, `python3 ~/.claude/scripts/verify-serve.py`)

- 8/8 fragment yuklandi, `pageerror` 0, konsol xatosi 0.
- 320 · 375 · 1440 — gorizontal scroll yo‘q (`documentElement.scrollWidth`
  oynadan kichik), fragment ichida kesilgan element yo‘q.
- Uch holat × ikki kenglik × ikki mavzu almashtirgichi ishlaydi; ma‘lumot
  bitta manbadan kelgani uchun sakkiz variant bir xil faktni ko‘rsatadi.
- 07 dagi ochish/yopish: `aria-expanded` va `hidden` mos, yopilgach panel
  `hidden` bo‘ladi (nol balandlikdagi ochiq konteyner qolmaydi).

Kadrlar: `.screenshots/yx-sheet-*.png`
