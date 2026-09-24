# Paper kanvasi — dizayn tizimi va ekranlar

**Fayl:** https://app.paper.design/file/01M13CF7X3QZXZZ3SCBJ1Y7270
**Sana:** 2026-08-28 · **Artbord:** 25 · **Tugun:** ~6 230

Butun mahsulot dizayni Paper'da chizildi. Manba — loyihaning O'Z kodi:
har artbord `note_form/` dagi haqiqiy sahifa va CSS'dan olingan matn,
o'lchov va tuzilish bilan qurilgan. Hech narsa o'ylab topilmagan.

## Dizayn tokenlari

54 ta token faylga yozildi (Tailwind v4 nomlash): `--color-*` (22),
`--font-*`, `--text-*` (8), `--font-weight-*`, `--tracking-*`,
`--leading-*`, `--radius-*` (5), `--spacing-*` (9), `--container-*`,
`--breakpoint-*`. Qiymatlar `assets/system.css` dan, ya'ni
online-mahalla.uz da o'lchanganlaridan.

**Qorong'i tema uchun token YO'Q** — qorong'i artbordlarda qiymatlar
`system.css` ning `[data-theme="dark"]` blokidan o'qilib, shaffof `rgba`
lar o'z ota-yuzasiga tekislanib qattiq hex bilan yozilgan.

## Kanvas xaritasi (tartiblangan 2026-08-28)

Ilgari artbordlar tarqoq turardi: 1-to'lqin — zinapoyasimon sochilma,
2-to'lqin — 21 500px enidagi BITTA qator; 17 xil `x`, 10 xil `y`, gutterlar
tasodifiy, mavzu bo'yicha guruh yo'q. Endi kanvas **yetti qatorga** bo'lingan,
har qator bitta mahsulot sohasi va o'z sarlavhasi bilan.

| Qator | Sarlavha | y | Artbordlar (chapdan o'ngga) |
|---|---|---|---|
| 01 | Asos | 1800 | Dizayn tizimi · Ikonkalar · Holatlar to'plami · Menyu/toast/tasdiq |
| 02 | Landing | 4900 | Landing desktop · Qorong'i landing |
| 03 | Kompozitor — bosqichlar | 9500 | 01 Kim oladi · 02 Nima yoziladi · 03 Qachon ketadi · 04 Ilova · 05 Yakuniy |
| 04 | Kompozitor — to'liq sahifa | 11200 | To'liq sahifa · Xato va validatsiya · Qorong'i kompozitor · Natija |
| 05 | Yuborilganlar | 16900 | Jadval · Bo'sh va filtr · Yozuv oynasi · Oyna holatlari · Qorong'i jadval |
| 06 | Tadqiqot | 19000 | Foydalanuvchi oqimi · «Kim oladi?» 8 variant · «Yetkazish» 8 variant |
| 07 | Arxiv (mobil) | 21300 | arxiv · Landing mobil · arxiv · Yuborilganlar mobil |

**Grid qoidalari:** chap tayanch `x = 2000` (barcha qatorlar bir chiziqda) ·
artbordlar orasida `160px` · qatorlar orasida `440px+` (441-523) · qator
sarlavhasi qator tepasidan `260px` yuqorida, undan `146px` bo'shliq bilan.
Kesishuv YO'Q (mexanik tekshirildi). Umumiy o'lcham: **7 840 × 22 320**
(ilgari 21 530 × 15 200).

**Qator sarlavhalari** — kanvasdagi alohida tugunlar (`Bo'lim 01…07`),
artbord EMAS. Uslub: 4px ko'k chiziq + `Bo'lim NN` (Rubik 500, 13px,
uppercase, 0.09em) + nom (Rubik 600, 46px) + tavsif (Rubik 400, 19px).
Ranglar KANVAS foni uchun tanlangan — Paper kanvasi TO'Q (~#1E1E1E),
shuning uchun matn OCH: `#5B8CFF` yorliq (5.3:1), `#FFFFFF` nom (15:1),
`#A8A8A8` tavsif (7:1). Loyihaning `--ink` (#171717) qiymati bu yerda
ishlamaydi — u kanvas fonida deyarli ko'rinmaydi (sinaldi).
Arxiv qatori ataylab KUL (`#8A8A8A`/`#7A7A7A`): u faol emas.

## Artbordlar

### 1-to'lqin (2026-08-28, 12 agent)

| Artbord | Node | O'lcham |
|---|---|---|
| Dizayn tizimi | 1-0 | 1440×1335 |
| Landing — desktop | 3J-0 | 1440×2562 |
| ~~Landing — mobil 390~~ → **arxiv** | 3K-0 | 390×2637 |
| Kompozitor — 01 Kim oladi | 3L-0 | 1440×1219 |
| Kompozitor — 02 Nima yoziladi | 3M-0 | 1440×789 |
| Kompozitor — 03 Qachon ketadi | 3N-0 | 1440×926 |
| Kompozitor — 05 Yakuniy ko'rinish | 3O-0 | 1440×709 |
| Yuborilganlar — jadval | 3P-0 | 1440×1103 |
| ~~Yuborilganlar — mobil kartalar~~ → **arxiv** | 3Q-0 | 390×2185 |
| Yozuv oynasi | 3R-0 | 900×977 |
| Natija — yuborish holatlari | 3S-0 | 1440×2641 |
| Holatlar to'plami (8 state) | 3T-0 | 1440×1289 |
| Qorong'i tema — jadval va oyna | 3U-0 | 1440×892 |

### 2-to'lqin (2026-08-28, 12 agent) — FAQAT DESKTOP

Foydalanuvchi qarori: mobil ekran Paper'da chizilmaydi. Boshlangan uchta
mobil artbord (kompozitor 390, oyna 390, natija 390) o'chirilib, o'rniga
uchta desktop artbord qo'yildi.

**1-to'lqindagi ikki mobil artbord ARXIVDA** (foydalanuvchi qarori,
2026-08-28): o'chirilmadi, chunki 1-to'lqin ishi referens sifatida kerak.
Nomiga «arxiv · » prefiksi qo'yildi va ikkalasi desktop tarmog'idan
PASTGA ko'chirildi (y = 14200, x = 2230 va 2830). Ular YANGILANMAYDI —
kod o'zgarsa ular eskiradi va shu holicha qoladi.

| Artbord | Node | O'lcham |
|---|---|---|
| Kompozitor — 04 Ilova qo'shish | 33F-0 | 1440×1168 |
| Kompozitor — to'liq sahifa | 35C-0 | 1440×3696 |
| Kompozitor — xato va validatsiya | 35E-0 | 1440×5259 |
| Yuborilganlar — bo'sh va filtr holatlari | 35D-0 | 1440×1600 |
| Yozuv oynasi — yuborish holatlari (4 holat) | 33H-0 | 1240×1624 |
| Amal menyusi, toast va tasdiq | 33M-0 | 1440×2577 |
| Ikonkalar to'plami (32 ikonka) | 33N-0 | 1440×1518 |
| Foydalanuvchi oqimi (22 o'tish) | 33O-0 | 1600×1784 |
| «Kim oladi?» — 8 variant | 33P-0 | 1600×1450 |
| «Yetkazish» — 8 variant | 33Q-0 | 1600×1524 |
| Qorong'i tema — landing | 33K-0 | 1440×4106 |
| Qorong'i tema — kompozitor | 33L-0 | 1440×3071 |

## Qanday qilindi

**Har artbord uchun BITTA agent.** Artbordlarni AGENTLAR EMAS, oldindan
serial yaratdim: `create_artboard` «kanvadagi eng bo'sh joyni» o'zi tanlaydi,
ya'ni parallel chaqiruvlar artbordlarni ustma-ust qo'yish xavfi bor. Yaratish
serial (keyin `update_styles` bilan `left`/`top` aniq berildi), to'ldirish
parallel — har agent faqat o'z `nodeId` siga yozdi.

2-to'lqinda har agent kodni o'zi o'qidi (spec bosqichi kerak bo'lmadi),
jonli sahifa ham ochiq turdi: `http://127.0.0.1:8931/` (keshsiz).

## Paper cheklovlari (real uchraganlari)

- Bo'sh `<div>` Rectangle bo'lib qoladi va bola qabul qilmaydi
  («Rectangle cannot have children») — qobiqni kontenti bilan birga
  bitta yozuvda qurish kerak.
- **Rubik jim tushib qoladi:** root'da `font-family` bo'lsa ham matn
  tugunlari `system-ui` ga tushadi. To'lqin oxirida 582 tugun markaziy
  `find_nodes` + `update_styles` bilan Rubik'ga o'tkazildi; yakuniy
  tekshiruvda `system-ui, sans-serif` tugun 0.
- `background-image: url("data:image/svg+xml,…")` **buzilgan rasm** bo'lib
  chiqadi — SVG faylga yozilib `paper-asset://` bilan berilishi kerak.
  CSS `linear-gradient`/`radial-gradient` to'g'ridan-to'g'ri ishlaydi.
- `text-wrap: balance` yo'q — sarlavha qatorini qo'lda kenglik bilan boshqarish.
- `display:grid`, `margin`, `<table>` yo'q — flex + padding + gap.
  `position:absolute` ko'rsatkichlari (`.yb-segment-thumb`) qayta yasaladi.
- **Render bir chaqiruv orqada qolishi mumkin** — bitta kadrga ishonmay,
  `get_tree_summary` bilan tugun o'lchamlarini ham tekshirish kerak.
- Qat'iy `height` kontentni kesadi — `height: fit-content` (piksel TAXMIN
  QILINMAYDI, guide talabi).
- `update_styles` shakli: `{"updates":[{"nodeIds":[…],"styles":{…}}]}`.

## MCP ulanishi

`mcp__pencil__*` tool'lari «transport not connected to app: desktop» beradi,
lekin serverning o'zi tirik: `127.0.0.1:29979/mcp`. Ko'prik skript
(`scratchpad/paper.py`) to'g'ridan-to'g'ri MCP HTTP endpointiga yozadi.
Kadrlar HAR chaqiruvda NOYOB nomga saqlanadi (`PAPER_OUT` + pid) —
parallel agentlar bir-birining kadrini qayta yozmaydi.

## Agentlar kodda topgan ziddiyatlar

30 ta topilma `.claude-state/CONTEXT.md` da. Eng jiddiylari:
`natija.html` oqimga umuman ulanmagan (tupik) · qorong'ida `.btn-ink`
ko'rinmaydi (1.03:1) · `.toast[data-tone]` uchun CSS qoidasi yo'q ·
`.sum-line` yetim qoida · `.skeleton` hech qayerda ishlatilmagan.
