# «Kim oladi?» variantlari — fragment kontrakti

Har variant BITTA o'zi yetarli fayl: `design/variants/v<N>-<slug>.html`.
Ular `variants.html` sahifasiga qo'yiladi va yonma-yon solishtiriladi.

## Fayl tuzilishi (aynan shu tartibda, boshqa hech nima yo'q)

```html
<!-- @name: Qisqa nom (o'zbekcha, 2-4 so'z)
     @idea: Bitta jumlada — bu yondashuv nimasi bilan boshqacha
     @best:  Qaysi holatda eng yaxshi ishlaydi
     @cost:  Nimasi yomon / nima yo'qotiladi -->
<section class="v3" data-variant="3" aria-labelledby="v3-title">
  <h3 class="v3-title" id="v3-title" hidden>…</h3>   <!-- host sarlavha qo'yadi, bu yashirin qoladi -->
  …markup…
</section>
<style>
  /* HAR selektor `.v3` bilan boshlanadi — boshqa variantga sizmaydi */
  .v3 { … }
</style>
<script>
  (function () {
    "use strict";
    var root = document.querySelector('[data-variant="3"]');
    if (!root) return;
    …
  })();
</script>
```

`<N>` — sizga berilgan raqam. Sinf prefiksi `.v<N>`, `data-variant="<N>"`.

## Majburiy qoidalar

1. **Tokenlarni QAYTA E'LON QILMANG.** Host sahifa `assets/system.css` va
   `assets/components.css` ni yuklaydi. `--ink`, `--paper`, `--accent`,
   `--hairline`, `--r-pill`, `--t-ui`, `--mono`, `--ease-out`, `--d-hover`
   va h.k. tayyor. Yangi rang O'YLAB TOPMANG.
2. **Ma'lumot** — `window.OM_GEO`. Tuzilishi:
   `{"Viloyat nomi": {pop: 3300000, districts: {"Tuman": {pop: 450000,
   mahallas: {"MFY nomi": 3400}}}}}`. 14 hudud · 35 tuman · 76 mahalla.
   `OM_GEO` bo'sh bo'lsa — sabab ko'rsatib bloklang, «0» deb YOZMANG.
3. **Raqam halolligi.** Aholi soni TAXMINIY: doim `~` bilan va
   «taxminiy» konteksti bilan chiqadi. O'ylab topilgan aniq son YO'Q.
4. **Natija shakli.** Variant tanlov qilingach `root` da CustomEvent
   otadi: `root.dispatchEvent(new CustomEvent('scopechange', {bubbles:true,
   detail:{level, region, district, mahalla, reach}}))` — `level` ∈
   `republic|region|district|mahalla`, tanlanmagan pog'onalar `null`,
   `reach` — son yoki `null`. Host buni yozib ko'rsatadi.
5. **Klaviatura** — har boshqaruv Tab bilan yetib boradi, fokus izi
   ko'rinadi (global `:focus-visible` bor, o'chirmang). Ro'yxatlarda
   o'q tugmalar ishlasin. `role`/`aria-*` yolg'on gapirmasin.
6. **Light + dark** — faqat tokenlar bilan ishlang, qattiq rang yozmang.
   Istisno: tasvir/gradient yuzalar.
7. **320px** — gorizontal scroll YO'Q. Tegish nishoni ≥ 24px
   (mobil ≥ 44px).
8. **Animatsiya** — 300ms dan qisqa, faqat `transform`/`opacity`,
   `ease-in` TAQIQ (`var(--ease-out)` bor), `prefers-reduced-motion`
   hurmat qilinadi.
9. **Bo'sh holat MAJBURIY** — hech narsa tanlanmaganda ekran nima
   qilish kerakligini aytadi.
10. **Kod hajmi** — fragment 220 qatordan oshmasin. Izoh WHY uchun.

## TAQIQ

- `<link>`, `<script src>`, tashqi so'rov, kutubxona — yo'q.
- `id` — faqat `v<N>-` prefiksi bilan (host sahifada takrorlanmasin).
- Global `document.addEventListener` — faqat `root` ichida
  (`keydown`/`click` uchun `root.addEventListener` ishlating);
  `Escape` va tashqariga bosish uchun `document` ga ulasangiz,
  boshqa variantlarga ta'sir qilmasligini tekshiring.
- `alert`/`confirm`/`prompt` — yo'q.
- Emoji ikonka — yo'q. SVG stroke 1.6, `currentColor`.
