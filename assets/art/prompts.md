# Generated artwork — prompts and provenance

Produced 2026-10-12 with the built-in OpenAI `image_gen` tool using the imagegen skill, with `transparent_background: true`. No CLI/API-key pipeline was used. Five source exports were copied into this folder; originals remain in the tool's generated-images directory. The Developer's approved [character reference](<../../project-3-character/character and wardrobe reference.png>) is unchanged.

The original reference was attached for the master/icons. Wardrobe/hats used the generated master as fitting reference and original sheet as style reference, in that order. No source art is hand-replaced with geometric shapes. Actual alpha was inspected; RGB colors in fully transparent pixels may still contain the tool's former background, which does not display when correctly composited.

Preparation: `scripts/prepare-art.ps1` crops the supplied atlas cells, cleans isolated jacket-cell slivers, and derives the illustrated base from the master. Runtime `js/art.js` fits the original PNG pixels to shared neck/waist/wrist landmarks, clips shirt sleeves under outerwear, and maps original luminance through warm ink, navy/olive/rust fabric, and highlights. After the integration correction, hands stay behind sleeves in the base; the unused separate hand mask was removed in Checkpoint 5 and remains recoverable from Git history. The illustrated neck overlays rear collars, and trousers cover boot shafts. Counts are owned by `spec.md`. Source exports are retained for reproducible preparation; they are not downloaded by the running app. No additional images were generated for this correction. The app needs no build step or image-generation service.

## Master

Saved source: [character-master.png](character-master.png). Original generated filename: `exec-6713cf21-d30a-48f7-8de0-9c75290aee0c.png`.

Exact submitted prompt:

```text
Create production artwork for a weather outfit web app using the attached approved character reference as the strict identity and visual style reference. ONE full-body young adult male character, front-facing, same tousled dark brown hair, warm expressive simple face, relaxed slender proportions, loose ink linework, textured hand-painted fabric and subtle paper/grain shading from the reference. Preserve the indie editorial illustration quality; no geometric cartoon simplification. Relaxed neutral standing pose, hands visible and down slightly away from hips, arms gently separated from torso, feet spaced slightly apart. Wear a plain neutral mid-gray T-shirt, above-knee neutral mid-gray shorts, and simple unbranded low-top sneakers. Hair, skin and shading retain warm reference colors. No logos, scenery, labels, ground shadow or props. Entire figure visible with clear margins, centered portrait 2:3 composition. GENUINE transparent background. This is the master for independently layered clothing later, so shoulders/arms/legs should be easy to cover consistently. Save production PNG.
```

## Upper wardrobe

Saved source: [source/wardrobe-upper.png](source/wardrobe-upper.png). Original generated filename: `exec-48d0d352-6414-4236-8525-88551a63c66b.png`.

Exact submitted prompt:

```text
Production wardrobe atlas for the attached master character (image 1); image 2 supplies approved textured hand-drawn indie style. ONE transparent PNG sprite sheet, exactly 3 columns by 2 rows with equal cells, six clearly separated cells. Five isolated front-facing WORN garment layers; no character/body/mannequin, no skin, no head, no hands, no legs, no text. Top row left to right: short-sleeve T-shirt; lightweight long-sleeve crewneck shirt; thicker knit sweater with ribbed neck and cuffs. Bottom row left: lightweight hooded waterproof rain shell; bottom middle: insulated padded waterproof winter coat; bottom right EMPTY TRANSPARENT. Every garment fits the SAME master character pose: shoulders relaxed, arms down and slightly away from torso, sleeves follow the master arms. Neutral mid-gray fabrics, loose dark ink outlines, hand-painted folds, rich visible fabric grain and soft nuanced shading, matching the reference rather than geometric vector art. Each garment completely inside its own cell with generous transparent margins. Neck and cuff holes genuinely transparent. The rain shell and padded coat are open at the front, with parted front panels so the underlying shirt is visibly exposed from chest to hem; no baked-in inner shirt. The insulated coat has distinctly thicker padding and collar than the shell. Keep outerwear approximately hip-length so trousers remain visibly distinct. NO shoes, flat-lay product perspective, shadows outside garments, background, labels, logos, grid lines or checkerboard. GENUINE transparent alpha. High-resolution landscape sprite sheet.
```

## Lower wardrobe

Saved source: [source/wardrobe-lower.png](source/wardrobe-lower.png). Original generated filename: `exec-046ee708-ba8f-440a-8f54-65e6ce31ea17.png`.

Exact submitted prompt:

```text
Create ONE production wardrobe sprite atlas, genuine transparent PNG, landscape 3 equal columns by 2 equal rows. Image 1 is the character fitting reference; image 2 is the exact indie illustration style. SIX separate clothing pieces for the same front-facing character, posed AS WORN rather than angled product photos; no mannequin/body/skin/heads/hands. Top row left: above-knee shorts with straight hems; top middle: full-length straight-leg chinos with distinct trouser seams and plain hems; top right: full-length joggers with drawstring waist and visibly gathered elastic ankle cuffs. Bottom row left: a PAIR of everyday unbranded low-top sneakers; bottom middle: a PAIR of waterproof ankle boots with medium-height plain shafts; bottom right: a PAIR of insulated winter boots with taller padded shafts and rugged soles. Pants legs and shoe pairs match the master's relaxed front-facing stance: two feet slightly apart, toes turned slightly out, neither side view nor three-quarter product view. Each piece centered fully inside its own equal cell with clear transparent space between pieces. Neutral medium gray fabric/leather and dark warm ink outlines. Preserve rich hand-painted folds, textured grain, nuanced shading and loose hand-drawn linework of the original illustration. No logos or text. No labels, borders, gridlines, scenery, shadows outside objects, or checkerboard. Background and all spaces between legs/shoes genuinely transparent. Maintain clear visible shape differences between chinos and joggers and between all three footwear types. High resolution.
```

## Hats

Saved source: [source/wardrobe-hats.png](source/wardrobe-hats.png). Original generated filename: `exec-792a929d-b08f-401e-9f2e-0a455e4fca02.png`.

Exact submitted prompt:

```text
Create ONE transparent PNG accessory atlas containing exactly TWO separate hats side by side in equal left/right halves, no text. Use attached character master for exact front-facing head shape and original sheet for indie hand-drawn illustration style. LEFT: a soft wide-brimmed sun hat, seen front-on as worn on this head, crown sized for tousled hair and broad gently curved brim. RIGHT: a warm knit beanie, front-on, rounded top and clearly ribbed folded cuff, no logo. Both neutral mid-gray ready for recoloring, loose warm dark ink outlines, hand-painted textile grain, soft nuanced textured shading matching the character. No heads, hair, faces, mannequins, hat stands or other body parts. Each hat fully visible and separated with generous transparent margins, no overlap. Hat interiors may have natural dark shading, but the background outside must be genuinely transparent. No ground shadow, checkerboard, labels, borders, scenery, chin straps or logos. High-resolution landscape composition.
```

## Weather and reminders

Saved source: [source/weather-reminders.png](source/weather-reminders.png). Original generated filename: `exec-e29b50b7-5910-4f2f-905c-e3623314ad84.png`.

Exact submitted prompt:

```text
Create ONE icon atlas for a weather-outfit app in exactly THREE columns and THREE rows, nine equal cells, each object centered with generous transparent separation. Match attached original indie reference: warm loose ink outlines, painterly paper grain and textured soft shading; polished editorial illustration, legible distinctive silhouettes at small sizes. TOP ROW left to right: golden sun with rays; soft gray cloud; gray rain cloud with blue raindrops. MIDDLE ROW left to right: blue six-armed snowflake; dark storm cloud with yellow lightning bolt; open navy umbrella. BOTTOM ROW left to right: sunscreen bottle with a simple sun emblem and NO LETTERS; reusable blue water bottle; warm rust scarf folded as a cold-weather reminder. All nine objects visually independent, fully inside their own cells. Strong dark contour for small-scale readability. GENUINE transparent PNG background, including spaces between rays and rain drops. No words, labels, numerals, logos, borders, grid lines, scenery, ground shadow or checkerboard. Square high-resolution composition. These are app icons, not another character sheet.
```

## Integration and verification

Generated pieces are deliberately neutral for independent browser colorways. PNG fitting/masks were inspected in the app: hats raised to leave the eyes visible, shirt hem extended to overlap the waist, underlying sleeves clipped beneath shell/coat, and joggers fitted wider than chinos. All shape/texture pixels remain sourced from the generated illustration.

The art/export browser suite verifies transparency and tonal detail, same-color garment differences (including through outerwear), three palettes, identical DOM/export art composition within pixel-rounding tolerance, and actual PNG download. Native-share calls are instrumented; the Developer still verifies the OS share sheet on a real supported phone. Evidence is in `verification/checkpoint-4-*.png`; commands/results belong to `plan.md`.
