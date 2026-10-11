# Just Korean design system — "Paper & cut-outs"

Date: 2026-10-11 · Status: approved in conversation, pending spec review

## Why

The Phase 1 skeleton reads as a generic template. The site should feel personal and carry
the author's character, while staying, first of all, an excellent surface for reading
learning material. Site structure and content model are still open and may change
completely, so this work covers the **design system only** (tokens, details, components as
visual patterns), demonstrated on a `/styleguide` page. No content collections or feature
structure.

## Source of personality

- **Channel intro** (first seconds of every video): cut-paper collage, hand-made textures
  (square grid, hatching, scribbled waves, zigzags), cool palette: denim logo blue, teal,
  deep indigo, cobalt, on pale lavender-grey "paper". No pink.
- **JiEun on camera:** calm, direct, natural light, no glamour. On-screen text: large Korean
  line with a smaller English translation beneath.
- **Profile:** MA in Korean Language Education, certified teacher, taught in HK, NL, ES.
  Reads as calm expertise, not "influencer".

Personality = calm academic precision + one hand-made artistic layer, used sparingly.

## Direction

"Paper & cut-outs" with a pinch of 원고지 (Korean manuscript grid paper). The intro's grid
texture and 원고지 are treated as one motif. Expressiveness level: moderate, closer to
minimal but not sterile. Learning text always sits on clean paper, never on decoration.

Textures and shapes are drawn by us "in the spirit of" the intro (no source files exist);
not a copy. They are SVG, so they can be replaced later without touching components.

## 1. Color

### Raw scales (in `@theme`, never used directly by components)

**Brand (denim)** — unchanged, from `#5C7EBE`:
50 `#F1F4FA` · 100 `#E2E8F4` · 200 `#C5D1E8` · 300 `#9DB0D6` · 400 `#7792C8` ·
500 `#5C7EBE` · 600 `#4A68A6` · 700 `#3F5F9E` · 800 `#334C7E` · 900 `#2A3E66` · 950 `#1A2740`

**Teal** — new, from the intro teal `#56A8A3`:
50 `#EEF7F6` · 100 `#D6EDEB` · 200 `#AEDAD6` · 300 `#7FC6C0` · 400 `#56A8A3` ·
500 `#3E8E89` · 600 `#337A76` · 700 `#2A6965` · 800 `#22524F` · 900 `#1A3E3C` · 950 `#102826`

**Indigo** (dark theme base): `#111733` (bg) · `#1A2246` (surface) · `#2C3763` (border)

The warm coral accent from the original brief is **removed**; the system is fully cool.

### Roles

- **Brand (denim):** actions, links, logo.
- **Teal:** learning moments — key-expression highlights, "correct", progress, focus ring.
- **Danger (muted red):** errors and "wrong" quiz state only.

### Semantic tokens (per theme)

| token                             | light                 | dark                  |
| --------------------------------- | --------------------- | --------------------- |
| `bg`                              | `#FBFBFD`             | `#111733`             |
| `surface` ("paper")               | `#EEF0F8`             | `#1A2246`             |
| `border`                          | `#DEE2EF`             | `#2C3763`             |
| `text` ("ink")                    | `#1D2340`             | `#E8EDFB`             |
| `muted`                           | `#4A5170`             | `#A3ADCF`             |
| `brand` (text/links)              | brand-700             | brand-300             |
| `brand-strong` (fill, white text) | brand-700             | brand-700             |
| `brand-strong-hover`              | brand-800             | brand-600             |
| `brand-tint`                      | brand-50              | `#1F2A55`             |
| `teal` (text/marks)               | teal-700              | teal-300              |
| `teal-strong` (fill, white text)  | teal-700              | teal-700              |
| `teal-tint`                       | teal-50               | `#173A44`             |
| `danger`                          | `#B03A3A`             | `#E58A8A`             |
| `danger-tint`                     | `#FBEDED`             | `#3A1F2A`             |
| `focus`                           | teal-500              | teal-300              |
| `logo` / `logo-secondary`         | brand-500 / brand-700 | brand-300 / brand-500 |

Measured contrast (WCAG): ink/bg 14.9, ink/paper 13.5, muted/paper 6.8, brand-700/paper 5.5,
teal-700/paper 5.6, white on brand-700 6.3, white on teal-700 6.4, danger/bg 5.8; dark:
text/surface 13.2, muted/surface 6.9, brand-300/surface 7.1, teal-300/surface 7.9,
danger/bg 7.0. Focus ring teal-500 on bg 3.7 (≥ 3:1 for non-text). All body text ≥ 4.5:1.

Rule kept: white text never on brand-400/500 or teal-400/500.

## 2. Typography and shape

- **Latin:** Outfit Variable (close to the rounded logo wordmark). **Korean:** Pretendard
  Variable, dynamic subset. Korean pages use Pretendard for all text.
- **Body:** 17px (`1.0625rem`), line-height 1.65, measure ≤ ~68ch.
- **Korean examples:** 22px (`1.375rem`), line-height 1.7, weight 500.
- **Headings:** Outfit 600–700, slight negative tracking, `text-wrap: balance`.
- **Type scale (rem):** 0.8125 · 0.9375 · 1.0625 · 1.25 · 1.5 · 1.875 · 2.5 · 3.25.
- **Signature component — bilingual pair:** Korean line (example size), translation below in
  `muted`, optional romanization in smaller muted text; thin teal rule on the left.
- **Shape:** controls 12px radius, cards 18px, 1px borders, no soft drop-shadow clouds.
  Irregular edges appear **only** in decorative shapes, never in UI controls.
- Touch targets ≥ 44px.

## 3. Signature details

1. **Links:** thin underline (offset, 1px, `brand` at reduced opacity); on hover the underline
   becomes a short teal diagonal hatch band.
2. **Key expression mark:** teal hatch band behind the lower ~40% of the Korean text, like a
   pencil mark. Must keep text contrast (band is a light tint, text stays ink).
3. **Section mark:** small cut-paper shape before section headings / eyebrows.
4. **Shape library (5):** arch, blob, zigzag strip, grid square, scribble wave. Clean,
   smooth edges; the hand-cut feel comes from slightly asymmetric geometry only (no
   displacement filters: they made contours and textures look ragged). Each is an SVG component with `tone` (brand / teal / indigo /
   paper) and optional texture fill (hatch / grid / scribble / solid).
5. **Example block:** faint 원고지 grid (~6% opacity) under example sentences.
6. **Collage:** composition of 5–6 shapes with textures, used **only** in the home hero,
   404 and empty states. Toned down in dark theme. Decorative: `aria-hidden`.
7. **Motion:** 150–200ms ease-out. Card hover nudges its shape a few px. No springs or
   bounces. `prefers-reduced-motion: reduce` disables movement.
8. **Selection:** teal-100 background, ink text (dark: teal-800 / text).
9. **Buttons:** primary (brand-strong), learning (teal-strong, e.g. "Check answer"),
   ghost (border), and link-style. Pressed state moves 1px down.

## 4. `/styleguide` page

English only, `noindex`, excluded from the sitemap, not linked from navigation.
Sections:

1. Colors: raw scales and semantic tokens, both themes, with contrast ratios computed at
   build time from the token values.
2. Typography: scale in EN and KO, body paragraph, Korean example size.
3. Links, buttons (all variants and states: default, hover, focus, pressed, disabled),
   text input.
4. Cards, level badges, notes/callouts (tip, attention).
5. Learning patterns: bilingual pair, key expression mark, example block on grid.
6. Quiz option states: default, selected, correct, wrong.
7. Shape library and a sample collage.
8. Logo variants A / B / C, with and without wordmark.

All copy on the styleguide is developer-facing sample text, so it is exempt from the
"all UI strings through i18n" rule; this exemption is documented in the page file.

## Also in scope

- Existing pages pick up the new tokens automatically (they use semantic tokens only).
- Home hero gets a collage; 404 gets its own small collage.
- Header, footer, buttons and links updated to the new details where relevant.
- `CLAUDE.md` design rules updated: coral removed, teal added, signature details listed.

## Out of scope

Content collections, feature pages, real content, deployment, Svelte islands.

## Verification

- `npm run check` and `npm run build` clean.
- Visual check of `/styleguide`, home and 404 in light and dark, desktop and 375px width,
  no horizontal scroll.
- Contrast table on the styleguide shows every text pair ≥ 4.5:1 (focus ≥ 3:1).
- Keyboard: every interactive sample reachable with a visible teal focus ring.
