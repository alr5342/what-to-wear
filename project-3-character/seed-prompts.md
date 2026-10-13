# Character seed prompts

> Historical manual-generation instructions, superseded on 2026-10-12 when the Developer authorized Agent-owned artwork production. No image generation/transfer is now required from the Developer. Actual production prompts and saved outputs are documented in [assets/art/prompts.md](../assets/art/prompts.md).

Use the existing `character and wardrobe reference.png` as the visual reference. Generate only these two seed images first; the Agent will inspect them before the remaining wardrobe is generated. Technical acceptance requirements belong to [spec.md → Assets](../spec.md#assets); checkpoint sequencing belongs to [plan.md](../plan.md#six-checkpoint-schedule).

## 1. Master character

Attach the original reference to the image-generation conversation and use this prompt:

> Create one production-ready full-body illustration of the character in the attached reference. Match his identity and indie illustration style closely: tousled dark brown hair, expressive simple face, relaxed proportions, loose dark linework, textured fabric, soft painted shading, and warm muted colors. Use the first, front-facing full-body character as the pose basis. Keep both hands visible, relaxed, and slightly clear of the torso rather than in pockets; leave a small gap between each arm and the body so clothing layers can be changed. Keep the feet separate and fully visible. Dress him in a simple light neutral T-shirt, above-knee shorts, and plain unbranded low-top sneakers. No hat, props, logos, lettering, scenery, or ground shadow. Deliver a single character centered on a 1024×1536 PNG canvas with genuine transparent background and comfortable clear margins around hair, hands, and shoes. Do not crop the figure or draw a checkerboard. Preserve the reference's illustration texture and polish; do not simplify it into geometric shapes or a flat generic cartoon.

Download the PNG as `assets/art/character-master.png`. Keep this exact image as the reference for the second generation; do not generate a separate redesigned character.

## 2. Long-sleeve seed layer

Use the downloaded master as the edit/reference image; also attach the original style reference if needed. Use this prompt:

> Using this exact master character as the fitting template, produce only a lightweight long-sleeve crew-neck shirt as a transparent clothing layer. Draw it as worn by this character, preserving his exact shoulder position, torso shape, arm angles, and wrist positions. Keep the original 1024×1536 canvas and put the shirt at the exact coordinates where it belongs on the master; do not move it to the center of a tightly cropped product image or change its scale. Match the original indie linework, fabric texture, folds, and soft painted shading. Use neutral mid-gray fabric so the app can recolor it while preserving shading. Include the shirt front and sleeves only. Remove all character/body/face/hair/hands, shorts, shoes, and background pixels; the neckline and sleeve openings must be transparent, without skin, a mannequin, or visible rear/interior fabric blocking the openings. No labels, logos, props, ground shadow, or checkerboard. Deliver a genuine transparent PNG with the same canvas and unchanged garment placement.

Download the PNG as `assets/art/longsleeve-seed.png`. Keep the surrounding transparent canvas rather than cropping it down to the shirt. If the generator returns a different size or imperfect alignment, supply the original downloaded output for inspection; do not spend time manually resizing/aligning it or repeatedly regenerating it before the seed review.

## What the Agent will check

Actual transparency; faithful illustration style; alignment/occlusion at collar, shoulders, sleeves, and wrists; navy/olive/rust recoloring without tinting skin/hair; preservation of folds/texture; and readability at phone/laptop sizes. The master may need derived base/hand masks and the shirt may need cleanup. These are preparation tasks within Checkpoint 4. No further garment sheets are needed until this seed result passes review.
