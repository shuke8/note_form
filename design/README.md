# Kompozitor redizayn kanvasi

Claude Design kanvasining manba fayllari. Yig'ilgan sahifa (2.3 MB) git'ga
kirmaydi — u `seed-canvas.mjs` bilan qayta yig'iladi.

| Fayl | Nima |
|---|---|
| `Main.dc.html` | Funksiyalar chastotasi tahlili — nima tez-tez, nima kamdan-kam ishlatiladi |
| `Variant-A.dc.html` | A — bitta varaq: kam ishlatiladigan sozlamalar chip qatorida |
| `Variant-B.dc.html` | B — chapda yozish, o'ngda chastota bo'yicha tartiblangan sozlamalar |
| `Variant-C.dc.html` | C — ssenariydan boshlanadi, matn bo'shliqlardan yig'iladi |
| `canvas.json` | Artbordlar joylashuvi va yopishqoq izohlar |

**Qo'llangan variant: C** (`index.html`, commit `997f387`).
A va B maket bo'lib qoldi.

Qayta yig'ish:

    node "<skill>/seed-canvas.mjs" --template "<skill>/payload.template.html" \
      --out kompozitor-chastota-redizayn.html --title "Kompozitor Chastota Redizayni" \
      --artboard Main.dc.html --artboard Variant-A.dc.html \
      --artboard Variant-B.dc.html --artboard Variant-C.dc.html \
      --image logo.svg --canvas canvas.json
