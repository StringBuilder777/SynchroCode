# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SynchroCode is a web application built with Astro 5 + React 19 + Tailwind CSS v4 + Shadcn/ui. It uses TypeScript with strict mode.

## Commands

```bash
npm run dev       # Start dev server on localhost:4321
npm run build     # Production build to ./dist/
npm run preview   # Preview production build locally
npx shadcn add <component>  # Add a Shadcn/ui component
```

No test runner or linter is configured yet.

## Architecture

- **Framework**: Astro 5 with file-based routing (`src/pages/`)
- **Interactive components**: React 19 via `@astrojs/react` integration
- **Styling**: Tailwind CSS v4 via Vite plugin, theme defined in `src/styles/global.css` using OKLCH color space with CSS custom properties
- **Component library**: Shadcn/ui (New York style, neutral base color) with Radix UI primitives and Lucide icons
- **Path alias**: `@/*` maps to `./src/*`

### Key directories

- `src/pages/` — Astro pages (each file = a route)
- `src/layouts/` — HTML document wrappers
- `src/components/` — Reusable components (Astro and React)
- `src/components/ui/` — Shadcn/ui components (added via `npx shadcn add`)
- `src/lib/utils.ts` — `cn()` helper for merging Tailwind classes
- `src/styles/global.css` — Tailwind imports + theme variables (light/dark)
- `Pantallas/` — Pre-designed screen mockups (HTML + PNG) from Stitch, to be implemented as actual components
- `Contexto/` — Project requirements/specification documents (.docx)

### Shadcn/ui configuration (`components.json`)

- Style: `new-york`
- Aliases: components → `@/components`, ui → `@/components/ui`, utils → `@/lib/utils`, hooks → `@/hooks`
- RSC disabled, TSX enabled, CSS variables enabled

### Dark mode

Dark mode is supported via `.dark` class on the root element. Theme variables are defined in `src/styles/global.css` with separate light/dark palettes.

### React in Astro

When creating interactive React components, use Astro's `client:*` directives to hydrate them (e.g., `client:load`, `client:visible`). Static components don't need hydration.
