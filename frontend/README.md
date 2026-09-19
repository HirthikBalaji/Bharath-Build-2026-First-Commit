# SeatRelay frontend

React 18, Vite, Tailwind 3, Framer Motion and Lenis. The design system is documented in `../DESIGN.md`.

## Run

```bash
npm install
npm run dev
```

The dev server proxies `/api`, `/demo` and `/mock-operator` to the backend on `http://localhost:4000` (see `vite.config.ts`). In Docker, `nginx.conf` does the same.

## Structure

| Path | What it holds |
|---|---|
| `src/App.tsx` | App shell: data fetching, auth session, navigation, modals, toasts |
| `src/components/HomePage.tsx` | Landing page: hero, relay rail, refund calculator, FAQ |
| `src/components/HeroScene.tsx` | Illustrated highway with the scroll-driven coach |
| `src/components/DeckPlan.tsx` | Sleeper deck plan and the manifest card |
| `src/components/SearchBuses.tsx` | Find a seat |
| `src/components/MyTickets.tsx` | My journeys: release, withdraw, boarding pass |
| `src/components/OperatorDashboard.tsx` | Dispatch: approve or decline reissues |
| `src/components/TransactionLedger.tsx` | Resale ledger |
| `src/components/ui.tsx` | Buttons, modal, pills, segmented control, text reveals |
| `src/lib/` | Theme (pull-cord switch), toasts, smooth scroll, formatting |

Departure and arrival times from the API are wall-clock times with a `Z` suffix, so `src/lib/format.ts` always reads them in UTC.
