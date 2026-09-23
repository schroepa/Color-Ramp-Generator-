# Tintfield — Color System Generator

Responsive OKLCH color ramp generator. One HEX base becomes **19 perceptually even steps** (9 lighter, base, 9 darker) with Saturated / Fade / Pale systems.

## Stack

- Vite + React + TypeScript
- Tailwind CSS + shadcn/ui-style primitives
- lucide-react
- [culori](https://culorijs.org/) for all color math in OKLCH

## Run

```bash
npm install
npm run dev
```

Then open the local URL Vite prints (usually `http://localhost:5173`).

```bash
npm run build   # production build
npm run preview # preview the build
```

## Publish (from this checkout)

Remote is already set to `https://github.com/schroepa/Color-Ramp-Generator-`.

```bash
git push -u origin main
git push -u origin cursor/color-system-generator-40d2
gh pr create --base main --head cursor/color-system-generator-40d2 \
  --title "Add Tintfield OKLCH color system generator" \
  --body "Full Color System Generator: Vite/React/TS/Tailwind/culori, 19-step OKLCH scales, Saturated/Fade/Pale."
```

Local branches: `main` (README) → `cursor/color-system-generator-40d2` (app).

## Features

- Infinite scales: add / delete, edit base color & system per row
- Mobile snap-x swatch ribbon; desktop flex + hover scale
- Click a swatch to copy HEX (icon feedback + vibrate when available)
- Copy full scale as Tailwind-style `step-50`…`step-950` JSON or CSS variables
- Base (10th) swatch marked with a `mix-blend-difference` dot
