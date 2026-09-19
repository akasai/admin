# Design — Ohbangit Admin

A locked design system for the standalone `admin/` application. Every admin route reads this system before visual or interaction changes. Extend this file when the system grows; do not invent route-local themes.

## Genre

modern-minimal — dense operational clarity, restrained contrast, no decorative dashboard theatre.

## Macrostructure family

- App pages: **Workbench** — persistent navigation rail, broad work canvas, route-local toolbars, data-first surfaces.
- CRUD pages: Workbench variation with a compact page heading, explicit primary action, filter/tool strip, and one dominant data plane.
- Review pages: Workbench variation with queue navigation and master/detail inspection.
- Access page: split entry within the same system; brand context on one side, one focused credential form on the other.

## Theme

Custom tuned theme: “operational precision, restrained, late-night, trustworthy”.

- `--color-paper` oklch(13.5% 0.012 240)
- `--color-paper-2` oklch(16.5% 0.014 240)
- `--color-paper-3` oklch(20.5% 0.016 240)
- `--color-ink` oklch(95% 0.008 240)
- `--color-ink-2` oklch(76% 0.010 240)
- `--color-rule` oklch(28.5% 0.015 240)
- `--color-rule-2` oklch(23.5% 0.014 240)
- `--color-muted` oklch(62% 0.012 240)
- `--color-neutral` oklch(47% 0.012 240)
- `--color-accent` oklch(79% 0.17 158)
- `--color-accent-ink` oklch(17% 0.030 158)
- `--color-focus` oklch(82% 0.20 158)

Accent is a signal, not a surface: active navigation, primary action, selected control, focus. Keep it below roughly 5% of any viewport.

## Typography

- Brand display: Koverwatch, weight 400, roman; wordmark/brand lockup only.
- Interface display: Pretendard / Inter Tight / Inter, weight 650, roman.
- Body: Pretendard / Inter, weight 400–600.
- Mono: Geist Mono / SFMono-Regular / Menlo; IDs, timestamps, versions, and technical evidence only.
- Display tracking: -0.025em.
- Page titles stay compact; the interface is a work surface, not a marketing page.

## Spacing

4-point named scale in `tokens.css`. Use named tokens or generated Tailwind utilities. Controls target a 40–44px hit area. Data density comes from hierarchy and row rhythm, never from illegibly small text.

## Motion

- Easings: `--ease-out`, `--ease-in`, `--ease-in-out` from `tokens.css`.
- Reveal pattern: none for page content. Only drawers, dialogs, and feedback may use short opacity/transform transitions.
- Reduced-motion fallback: opacity only, at most 120ms.

## Microinteractions stance

- Silent success in-place where state is visible; toast for cross-surface mutation confirmation or failure.
- Focus rings appear instantly and remain visible against every surface.
- Destructive actions remain explicit and preserve user input when a request fails.
- Loading, empty, error, stale-version, and disabled states are first-class states.
- No celebratory motion, bounce, glow carpet, or ambient animation.

## CTA voice

- Primary: compact mint fill, dark ink, 10px radius, verb-first Korean copy.
- Secondary: paper-3 fill or rule border, light ink.
- Destructive: restrained red border/fill; never reuse accent green.
- Icon-only controls require an accessible name and a 40px minimum target.

## Per-page allowances

- App pages MUST NOT use decorative enrichment; function carries the page.
- Schedule may use date grouping and sticky temporal controls.
- Streamers and categories may use thumbnail/avatar imagery only when supplied by API data.
- Crawler review may use denser evidence/diff layouts and mono text for IDs/version data.

## What pages MUST share

- The navigation rail, brand lockup, accent placement, page heading rhythm, control radii, focus ring, status vocabulary, dialog shell, toast placement, loading/error/empty grammar.
- The same dark fixed theme and the same typography roles.
- A broad work canvas with responsive collapse at tablet/mobile widths.

## What pages MAY differ on

- Schedule: temporal toolbar and day/week density.
- Streamers/categories: searchable record list with expandable/editable detail.
- Crawler: queue tabs plus master/detail workspace and conflict recovery.
- Login: split-entry composition without application navigation.

## Exports

### tokens.css

`admin/tokens.css` is the source of truth.

### Tailwind v4 `@theme`

```css
@theme {
  --color-paper: oklch(13.5% 0.012 240);
  --color-paper-2: oklch(16.5% 0.014 240);
  --color-paper-3: oklch(20.5% 0.016 240);
  --color-rule: oklch(28.5% 0.015 240);
  --color-rule-2: oklch(23.5% 0.014 240);
  --color-muted: oklch(62% 0.012 240);
  --color-neutral: oklch(47% 0.012 240);
  --color-ink-2: oklch(76% 0.010 240);
  --color-ink: oklch(95% 0.008 240);
  --color-accent: oklch(79% 0.17 158);
  --color-accent-ink: oklch(17% 0.030 158);
  --color-focus: oklch(82% 0.20 158);
  --color-accent-hover: oklch(84% 0.18 158);
  --color-danger: oklch(64% 0.18 25);
  --color-danger-soft: oklch(22% 0.045 25);
  --color-warning: oklch(78% 0.14 78);
  --color-warning-soft: oklch(22% 0.04 78);
  --color-success: oklch(76% 0.15 158);
  --color-success-soft: oklch(21% 0.04 158);
  --font-display: 'Koverwatch', 'Pretendard', sans-serif;
  --font-body: 'Pretendard', 'Inter', ui-sans-serif, system-ui, sans-serif;
  --font-outlier: 'Geist Mono', ui-monospace, 'SFMono-Regular', Menlo, monospace;
  --spacing-3xs: 0.25rem;
  --spacing-2xs: 0.5rem;
  --spacing-xs: 0.75rem;
  --spacing-sm: 1rem;
  --spacing-md: 1.5rem;
  --spacing-lg: 2rem;
  --spacing-xl: 3rem;
  --spacing-2xl: 4.5rem;
  --spacing-3xl: 7rem;
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-md: 1rem;
  --text-lg: 1.25rem;
  --text-xl: 1.5rem;
  --text-2xl: 2rem;
  --text-display: clamp(2rem, 4vw, 3rem);
  --radius-card: 12px;
  --radius-pill: 999px;
  --radius-input: 10px;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in: cubic-bezier(0.7, 0, 0.84, 0);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --dur-micro: 100ms;
  --dur-short: 180ms;
  --dur-long: 280ms;
  --rule-hair: 1px;
  --rule-fine: 2px;
  --shadow-card: 0 1px 0 oklch(8% 0.008 240 / 0.35), 0 16px 40px oklch(8% 0.008 240 / 0.18);
  --shadow-dialog: 0 24px 80px oklch(6% 0.008 240 / 0.55);
}
```

### DTCG `tokens.json`

```json
{
  "$schema": "https://design-tokens.github.io/community-group/format/",
  "color": {
    "paper": { "$value": "oklch(13.5% 0.012 240)", "$type": "color" },
    "paper-2": { "$value": "oklch(16.5% 0.014 240)", "$type": "color" },
    "paper-3": { "$value": "oklch(20.5% 0.016 240)", "$type": "color" },
    "rule": { "$value": "oklch(28.5% 0.015 240)", "$type": "color" },
    "rule-2": { "$value": "oklch(23.5% 0.014 240)", "$type": "color" },
    "muted": { "$value": "oklch(62% 0.012 240)", "$type": "color" },
    "neutral": { "$value": "oklch(47% 0.012 240)", "$type": "color" },
    "ink-2": { "$value": "oklch(76% 0.010 240)", "$type": "color" },
    "ink": { "$value": "oklch(95% 0.008 240)", "$type": "color" },
    "accent": { "$value": "oklch(79% 0.17 158)", "$type": "color" },
    "accent-hover": { "$value": "oklch(84% 0.18 158)", "$type": "color" },
    "accent-ink": { "$value": "oklch(17% 0.030 158)", "$type": "color" },
    "focus": { "$value": "oklch(82% 0.20 158)", "$type": "color" },
    "danger": { "$value": "oklch(64% 0.18 25)", "$type": "color" },
    "danger-soft": { "$value": "oklch(22% 0.045 25)", "$type": "color" },
    "warning": { "$value": "oklch(78% 0.14 78)", "$type": "color" },
    "warning-soft": { "$value": "oklch(22% 0.04 78)", "$type": "color" },
    "success": { "$value": "oklch(76% 0.15 158)", "$type": "color" },
    "success-soft": { "$value": "oklch(21% 0.04 158)", "$type": "color" }
  },
  "font": {
    "display": { "$value": "Koverwatch, Pretendard, sans-serif", "$type": "fontFamily" },
    "body": { "$value": "Pretendard, Inter, ui-sans-serif, system-ui, sans-serif", "$type": "fontFamily" },
    "outlier": { "$value": "Geist Mono, ui-monospace, SFMono-Regular, Menlo, monospace", "$type": "fontFamily" }
  },
  "size": {
    "text-xs": { "$value": "0.75rem", "$type": "dimension" },
    "text-sm": { "$value": "0.875rem", "$type": "dimension" },
    "text-md": { "$value": "1rem", "$type": "dimension" },
    "text-lg": { "$value": "1.25rem", "$type": "dimension" },
    "text-xl": { "$value": "1.5rem", "$type": "dimension" },
    "text-2xl": { "$value": "2rem", "$type": "dimension" },
    "text-display": { "$value": "3rem", "$type": "dimension" }
  },
  "space": {
    "3xs": { "$value": "0.25rem", "$type": "dimension" },
    "2xs": { "$value": "0.5rem", "$type": "dimension" },
    "xs": { "$value": "0.75rem", "$type": "dimension" },
    "sm": { "$value": "1rem", "$type": "dimension" },
    "md": { "$value": "1.5rem", "$type": "dimension" },
    "lg": { "$value": "2rem", "$type": "dimension" },
    "xl": { "$value": "3rem", "$type": "dimension" },
    "2xl": { "$value": "4.5rem", "$type": "dimension" },
    "3xl": { "$value": "7rem", "$type": "dimension" }
  },
  "duration": {
    "micro": { "$value": "100ms", "$type": "duration" },
    "short": { "$value": "180ms", "$type": "duration" },
    "long": { "$value": "280ms", "$type": "duration" }
  }
}
```

### shadcn/ui CSS variables

```css
:root {
  --background: 13.5% 0.012 240;
  --foreground: 95% 0.008 240;
  --card: 16.5% 0.014 240;
  --card-foreground: 95% 0.008 240;
  --popover: 20.5% 0.016 240;
  --popover-foreground: 95% 0.008 240;
  --primary: 79% 0.17 158;
  --primary-foreground: 17% 0.030 158;
  --secondary: 20.5% 0.016 240;
  --secondary-foreground: 95% 0.008 240;
  --muted: 23.5% 0.014 240;
  --muted-foreground: 62% 0.012 240;
  --accent: 79% 0.17 158;
  --accent-foreground: 17% 0.030 158;
  --destructive: 64% 0.18 25;
  --destructive-foreground: 96% 0.01 25;
  --border: 28.5% 0.015 240;
  --input: 28.5% 0.015 240;
  --ring: 82% 0.20 158;
  --radius: 12px;
}
```