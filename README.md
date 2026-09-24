# Tintfield — Color System Generator

OKLCH color scale generator with contrast-ladder presets (Tailwind, Radix, Material, …). Marketing site + app as Astro with React islands.

## Stack

- Astro + React + TypeScript
- Tailwind CSS + shadcn/ui-style primitives
- [culori](https://culorijs.org/) for OKLCH / contrast math

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:4321/`.

```bash
npm run build   # production → dist/
npm run preview # preview the build
npm test        # vitest
```

## Routes

| Path | Content |
|---|---|
| `/` | Landing (EN) |
| `/de/` | Landing (DE) |
| `/app` | Generator |
| `/de/app` | Generator (DE shell) |

## Publish

Live: `https://tintfield.ptrckschrdtr.de`  
Remote: `https://github.com/schroepa/Color-Ramp-Generator-`.
