# Tintfield — Color System Generator

OKLCH color scale generator with contrast-ladder presets (Tailwind, Radix, Material, …). Marketing site + app as Astro with React islands.

## Stack

- Astro + React + TypeScript (base `/tintfield`)
- Tailwind CSS + shadcn/ui-style primitives
- [culori](https://culorijs.org/) for OKLCH / contrast math

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:4321/tintfield/` (Astro base path).

```bash
npm run build   # production → dist/
npm run preview # preview the build
npm test        # vitest
```

## Routes

| Path | Content |
|---|---|
| `/tintfield/` | Landing (EN) |
| `/tintfield/de/` | Landing (DE) |
| `/tintfield/app` | Generator |
| `/tintfield/de/app` | Generator (DE shell) |

## Publish

Remote: `https://github.com/schroepa/Color-Ramp-Generator-`.

Parent site should rewrite `/tintfield/*` to this deployment.