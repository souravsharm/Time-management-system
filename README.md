# Time Management System

A staff rostering and meeting-scheduling planner for small teams. Tell it when your
people can work and what shifts you need covered, and it builds the roster — filling
contracted hours first, never double-booking anyone, and flagging every gap it
couldn't fill.

Runs entirely in the browser. No account, no server, no data leaves the device.

## What it does

### Staff roster

- **Store hours** — 24/7 trading, or your own opening and closing times per day
  (including days you're closed).
- **Overnight shifts** — a 10pm–6am shift is understood as one shift that finishes
  the next morning, and is matched, counted and drawn as such.
- **Contract types** — permanent staff have contracted weekly hours the roster fills
  first; casuals pick up what's left, only within the hours they're free for.
- **Per-person limits** — contracted hours, a weekly hours ceiling, and a maximum
  number of days a week.
- **Company rules** — a maximum length for any single shift (10 hours by default),
  enforced when a shift is added or edited.
- **Approvals** — hours a team member sends back sit in a queue until a manager
  approves them. Nothing reaches the roster unreviewed.
- **Visual answers** — two coverage dials, a share-of-hours donut with a ranked
  breakdown, per-day coverage rings, and a day ribbon showing exactly which slice of
  the trading day belongs to whom.
- **Export** — copy the week as text or download it as CSV.

### Find a time to meet

Add a group, shade in when each person is free, and get a ranked list of slots that
work — with the names of who can and can't make each one, plus a heatmap of when the
group is most available.

### Collecting availability

Generate a share link from **Ask the team**. Each person opens it, drags across a
grid to shade their free hours, and gets a link to send back. Opening that link drops
their submission into the manager's approval queue.

## Running it

```bash
npm install
npm run dev
```

Open http://localhost:3000.

### Checks

```bash
npm run test       # Vitest — scheduling engine and shift rules
npm run typecheck  # tsc --noEmit
npm run build      # static export into out/
```

## How it's built

Next.js (App Router) and TypeScript, styled with Tailwind. The scheduling engine is
plain TypeScript with no React or browser dependencies, which keeps it directly
testable.

```
app/                     routes: the planner, and the participant fill page
components/
  charts/                donut and dial primitives
  grid/                  drag-to-shade availability grid, availability heatmap
  roster/                roster tabs: overview, store, team, shifts, schedule, approvals
  availability/          meeting-mode tabs and the shared availability editor
  ui/                    buttons, cards, tabs, theme toggle
lib/
  scheduling/            the engine — roster building, overnight maths, shift rules
  roster/analytics.ts    derived numbers for the charts and summaries
  theme/palette.ts       chart colour tokens
  workspace.ts           persistence and migration of saved workspaces
db/                      SQL schema and seed data, for a future hosted version
docs/                    architecture, deployment, demo data notes
tests/                   Vitest suites
```

### Overnight shifts

A shift stores the day it *starts* on plus a start and end in minutes. An end past
1440 means it finishes the next day, so a 10pm–6am shift is `startMinutes: 1320,
endMinutes: 1800`. `lib/scheduling/shiftTime.ts` splits that into per-day segments,
and availability matching, clash detection, coverage sweeps and the day view all work
on segments — so midnight is never a special case.

### Roster building

`buildRoster` sorts shifts hardest-to-fill first so scarce availability isn't spent on
easy shifts. For each shift it filters to people who are free for every segment, drops
anyone with a clash or who would break an hours or days limit, then ranks: permanent
staff still short of their contract come first, ordered by how far short they are;
after that it spreads hours evenly.

### Theming

Light and dark are both explicitly chosen sets of colours defined as CSS custom
properties in `app/globals.css`, surfaced to Tailwind as semantic tokens
(`bg-surface`, `text-ink`, `border-line`) in `tailwind.config.ts`. Dark is the
default. The chart palette has separate steps per mode, each checked for
colour-blind separation and contrast against its own background rather than being
flipped automatically.

### Storage

The workspace is saved to `localStorage` under
`availability-roster-planner.workspace.v3`. `lib/workspace.ts` normalises older saved
data, so a workspace from a previous version loads with sensible defaults rather than
breaking.

## Deployment

`next.config.mjs` sets `output: "export"`, so `npm run build` produces a static site
in `out/` that can be hosted on any static host. See
[docs/02-free-deployment.md](docs/02-free-deployment.md).

## Licence

MIT.
