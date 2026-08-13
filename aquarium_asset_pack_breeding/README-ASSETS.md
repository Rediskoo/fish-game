# Pocket Aquarium Asset Pack

Production-ready visual assets for the Telegram Mini App «Карманный аквариум».

## Use

```ts
import manifest from './assets-manifest.json';
const goldfish = manifest.assets['fish.goldfish'].files.webp2x;
const shopFishCases = manifest.assets['categories.shop.fish-cases'].files.webp1x;
```

Use `srcset` with the 1x and 2x WebP files. PNG @2x files are supplied for tools or runtimes where alpha WebP is inconvenient. Fish face right and may be mirrored with `transform: scaleX(-1)`. Do not mirror asymmetric UI icons.

## Rules

- Designed for narrow mobile cards: icons 24 px, meta/items 96–192 px, categories/fish 128–256 px, backgrounds 360×640 / 720×1280.
- Storage illustrations communicate owned inventory; shop illustrations communicate purchase/value. They are separate artwork and must not be interchanged.
- Backgrounds contain no UI or fish; central swim area is intentionally calmer.
- Telegram system controls (Close, Telegram chevron, overflow menu) are intentionally excluded.
- Sprite sheets are horizontal. Read fps, frame count, loop and frame size from the manifest.

## Folders

- `assets/icons/navigation`: active/inactive navigation SVGs
- `assets/icons/ui`: semantic monochrome UI SVGs
- `assets/categories/storage`, `assets/categories/shop`: distinct category art
- `assets/items/care`, `assets/items/decor`: usable inventory objects
- `assets/fish`: right-facing fish and rarity metadata
- `assets/backgrounds`: six portrait scenes
- `assets/rewards`, `assets/achievements`, `assets/profile`: meta-game assets
- `assets/animations`: web-friendly WebP sprite sheets

## Animation CSS example

```css
.reward-reveal {
  width: 192px; height: 192px;
  background-image: url('./assets/animations/reward-reveal.webp');
  animation: reward 857ms steps(12) 1;
}
@keyframes reward { to { background-position-x: -2304px; } }
```

## Naming and visual QA

All filenames are ASCII kebab-case. Raster cutouts have transparent corners, consistent upper-left light, generous padding, and no embedded text. The manifest is the source of truth for file paths and sizes.

## Swimming fish

Every fish has a matching `fish-swim-<name>.webp` horizontal sprite sheet: 20 transparent 256×256 frames at 10–12 fps. The motion combines a tail sweep, subtle body rock and vertical drift. Use the fps from the manifest; mirror the element in CSS for left-facing movement. Move the sprite container across the aquarium with CSS/JS while the sprite sheet handles local swimming motion.


## Breeding system

Use `breeding-genetics.json` for deterministic parent combinations. Eggs, embryos and generic fry are shared visuals for every pairing; inherited traits become visible at the baby stage. Each hybrid baby has a static asset plus sprite-sheet and animated WebP swimming files. Store the selected hybrid key/genome with the fish record so appearance remains stable through growth.
