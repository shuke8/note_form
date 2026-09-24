# «Yetkazish ma’lumotlari» variantlari — fragment kontrakti

Har variant BITTA o‘zi yetarli fayl: `design/yetkazish/y<N>-<slug>.html`.
Ular `yetkazish.html` sahifasiga qo‘yiladi va yonma-yon solishtiriladi.

Vazifa: kompozitorning 05-bo‘limida telefon ko‘rinishi YONIDA turgan ustunni
o‘qiladigan qilish. Uch fakt bor va faqat shular: **qamrov**,
**keyingi yuborish**, **ilova**.

## Fayl tuzilishi

```html
<!-- @name: Qisqa nom (o‘zbekcha, 2-4 so‘z)
     @idea: Bitta jumlada — bu yondashuv nimasi bilan boshqacha
     @best: Qaysi holatda eng yaxshi ishlaydi
     @cost: Nimasi yomon / nima yo‘qotiladi -->
<section class="y3" data-variant="3" aria-label="Yetkazish ma’lumotlari">…</section>
<style> /* HAR selektor `.y3` bilan boshlanadi */ </style>
<script>
  (function () {
    "use strict";
    var root = document.querySelector('[data-variant="3"]');
    if (!root) return;
    root.addEventListener("om:data", function (e) { render(e.detail); });
    render(null);              // ma’lumot kelmasidan oldingi holat
  })();
</script>
```

## Ma’lumot — host beradi, fragment CHIQARMAYDI

`variants.html` dagidan teskari: u yerda fragment tanlovni hodisa qilib
chiqarardi, bu yerda esa host ma’lumotni fragmentga BERADI. Manba bitta,
demak sakkiz variant ekranda ayni bir xil faktni ko‘rsatadi.

```js
root.addEventListener("om:data", function (e) { render(e.detail); });
```

`e.detail`:

| kalit | tur | izoh |
|---|---|---|
| `reach` | `"35.1M"` \| `"3 400"` \| `null` | `~` belgisini FRAGMENT qo‘yadi |
| `path` | `["Toshkent shahri", …]` \| `null` | qamrov yo‘li, tanlanmagan bo‘lsa `null` |
| `when` | `"repeat"` \| `"now"` \| `"none"` | yuborish rejimi |
| `whenLine` | satr \| `null` | naqshning bir jumlali tavsifi |
| `runs` | `[{iso, day, time, dd, mon}]` | `now` da bitta element, `iso` `null` |
| `files` | `["a.pdf"]` | bo‘sh massiv — ilova yo‘q |

`render(null)` — ma’lumot hali kelmagan holat; u BO‘SH holat bilan bir xil
ko‘rinsin, «yuklanmoqda» spinner QO‘YILMAYDI (kutish yo‘q, host darhol beradi).

## Majburiy qoidalar

1. **Tokenlarni qayta e’lon qilmang** — `assets/system.css` yuklangan.
   Yangi rang o‘ylab topilmaydi.
2. **Raqam halolligi** — aholi soni TAXMINIY: doim `~` bilan va «taxminiy»
   konteksti bilan. Reestr raqami O‘YLAB TOPILMAYDI — uni server beradi.
3. **Bo‘sh holat MAJBURIY** — `«—»` yetarli emas: ekran NIMA yetishmayotganini
   aytsin.
4. **Ikki kenglik** — 340px (kompozitordagi ustun) va to‘liq kenglik
   (mobil taxlanish). Ikkovida ham gorizontal scroll yo‘q.
5. **Light + dark** — faqat tokenlar. Sahna o‘z `data-theme` si bilan
   almashadi.
6. **Animatsiya** — 300ms dan qisqa, faqat `transform`/`opacity`,
   `ease-in` TAQIQ, `prefers-reduced-motion` hurmat qilinadi.
7. **Ikonka** — sprayt (`<use href="#i-…">`), emoji TAQIQ.
8. **Kod hajmi** — 220 qatordan oshmasin.

## TAQIQ

- `<link>`, `<script src>`, tashqi so‘rov, kutubxona — yo‘q.
- `id` — faqat `y<N>-` prefiksi bilan.
- Global `document` tinglovchisi — yo‘q, faqat `root` ichida.
- `alert`/`confirm`/`prompt` — yo‘q.
