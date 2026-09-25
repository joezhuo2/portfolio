# Portfolio

Joe Zhuo (crystalflux). A single scroll-driven page: black-hole hero, then Anamnesis, ObjectPoolLinter and Crystal OS, each over its own nebula, then a closing black hole with socials.

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # timeline math
npm run build
```

## Editing

- **Content** (name, socials, projects, links, backdrop paths): `src/data/content.ts`. Set `icon` on a project to replace its monogram tile.
- **Pacing**: `LENGTHS` in `src/lib/timeline.ts` sets how much scroll each section takes (in viewport heights); `BEATS` sets where fades happen inside a section.
- **Backdrops**: source renders live in `art/` (Higgsfield `z_image`, 2048x1152). Drop replacements there with the same names and run `node scripts/optimize-images.mjs` to regenerate `public/images/*.webp`. You need `projects.length + 2` images.

## How it works

`ScrollStage` is one tall container with a pinned full-screen stage. Motion's `useScroll` gives page progress (0 to 1) and every layer maps it through the timeline. Every scroll range is padded to the full 0..1 (`useScrollValue` in `src/lib/useFade.ts`) because Motion's hardware-accelerated scroll timeline otherwise lets values drift back outside the keyframes. Backdrops stack in order; each new one fades in over the previous (smootherstep) while the old one stays fully opaque underneath, then drops out once covered. Visitors with reduced motion get `StaticPage`, the same content as plain stacked sections.
