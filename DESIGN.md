# SeatRelay design system

The site is drawn as a sleeper coach's deck plan. One berth, U12, changes hands through the operator, and every screen keeps the name on the ticket in view. Tokens live in `frontend/src/index.css`, and Tailwind maps them in `frontend/tailwind.config.js`.

## Colour

Two themes share one set of tokens. "Lights on" is light mode and "lights off" is dark mode. Switch them with the pull cord, the command menu, or the system setting.

| Token | Lights on | Lights off | Use |
|---|---|---|---|
| `bg` | #F3F4F0 porcelain | #080E0C night cabin | Page ground |
| `surface` / `surface2` | #FFFFFF / #E9ECE7 | #0E1613 / #151F1B | Cards, fields, quiet panels |
| `ink` / `ink2` / `ink3` | #0E1A15 / #3A4842 / #5A6761 | #E8EEE9 / #B2BEB7 / #86958D | Text, three steps |
| `line` / `linestrong` | #D6DCD5 / #BAC4BC | #212E28 / #35463E | Hairlines and borders |
| `coach` / `coach2` / `coachink` | #0D4A38 / #14644C / #EEF4EF | #103E30 / #185844 / #E8EEE9 | Brand field, primary buttons, footer |
| `accent` | #0D6E50 | #68CCA0 | Coach green as text |
| `marigold` / `marigoldink` | #F0A41A / #1C1303 | #F7B437 / #1C1303 | The relay signal, the reading lamp, the closing call to action |
| `danger` / `success` | #B22828 / #107654 | #F47068 / #68CCA0 | States |

Rules:
- Marigold always means "released or in transfer". Never use marigold as text on a light ground. Use it as a fill with `marigoldink` on top.
- Coach green owns whole regions: the relay rail, checkout summary, footer and mobile menu.

## Type

- **Archivo**, a variable font with a width axis. `.display` sets it at 122% width and weight 780, like the lettering on a bus. `.display-md` is 112% width and weight 720. Body and UI text use normal width.
- **Martian Mono** only for seat codes, PNRs and ticket numbers, times, and `.kicker` labels. Never use it for decoration.
- The largest display size is 6rem. Keep letter spacing between -0.03em and -0.02em.

## Components

- `DeckPlan`: an SVG upper deck with berths U1 to U12. The `phase` prop takes `booked`, `released`, `claimed` or `reissued`.
- `ManifestSlip`: the paper record for U12. The name gets struck through and replaced, and the operator stamp lands.
- `BerthGlyph`: the icon version of a berth, used in place of generic icons.
- `ui.tsx`: `Button` (with a magnetic option), `Modal`, `Pill`, `Segmented`, `RevealText`, `Rise`, `CountUp`, `PageHeader`, `EmptyState`.
- `LightCord`: the theme switch. Pull or click it, and the new theme is revealed by a view transition clipped to a circle from the bead. Turning the lights on flickers like a tube light.
- `Navbar` (Platform mega-menu, updates popover, account menu, full-screen mobile menu), `Footer`, `CommandPalette` (Ctrl K), `Preloader` (berth curtains, once per session).

## Motion

- The main moment is the reissue on the hero deck plan, looping only while it is on screen.
- The relay section turns vertical scroll into a horizontal rail through four stops on desktop, and stacks the stops on phones.
- Headings arrive word by word from behind a mask and leave the same way. Body text de-blurs into place once.
- Page changes animate in only, with no exit, so a view can never be left blank.
- Smooth scrolling uses Lenis. `prefers-reduced-motion` turns off Lenis, the intro, the loops and the reveals.

## Truth rules

- Mark illustrative numbers and names as illustrative. The platform fee is ₹0 in this build.
- The operator system and payments are simulated, and the footer says so.
- The AWS section describes the target architecture, not the current Express and SQLite backend.
