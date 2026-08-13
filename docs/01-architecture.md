# Architecture

A static-export-friendly Next.js app. The scheduling engine lives in pure TypeScript
functions under `lib/scheduling`, and React renders editable planner state on top of
it.

```text
Browser
  -> Next.js static app
  -> React planner state and localStorage
  -> Pure scheduling functions
  -> CSV / clipboard export
```

Browser storage keeps the app deployable to free static hosts. Supabase can be added
later using the schema in `db/schema.sql`.

## Core folders

- `app` — App Router entry points: the planner, and the participant fill page.
- `components` — roster and meeting tabs, chart primitives, shared UI.
- `lib/scheduling` — the engine: roster building, overnight shift maths, shift rules,
  common-time search.
- `lib/roster/analytics.ts` — every derived number the charts and summaries need,
  computed once per render from the raw workspace.
- `lib/theme/palette.ts` — chart colour tokens for both themes.
- `lib/workspace.ts` — persistence, plus migration of workspaces saved by older
  versions.
- `lib/validation` — Zod schemas for form boundaries.
- `db` — Supabase-ready SQL schema and seed data.
- `tests` — Vitest coverage for the scheduling engine.

## Data flow

1. The user edits store hours, people, availability and shift requirements.
2. The workspace draft is persisted to localStorage.
3. `analyseRoster` derives coverage, per-person load, per-day statistics and the gap
   list from that draft.
4. Views render from those derived numbers; the user copies or downloads the output.

Keeping the algorithms pure makes them straightforward to test and to replace when
server-side persistence is added.

## Time model

`ShiftRequirement` stores the day a shift *starts* on plus start and end offsets in
minutes from that day's midnight. An end greater than 1440 means the shift finishes
on the following day.

`lib/scheduling/shiftTime.ts` owns this. `shiftSegments` splits a shift into one or
two single-day segments, and availability matching, clash detection, the coverage
sweep and the day ribbon all consume segments. Clash detection converts shifts to
absolute week-minutes and tests three offsets so a Sunday-night shift wrapping into
Monday is still caught.

## Approval queue

Availability arriving from a share link is stored as an `AvailabilitySubmission` with
`status: "pending"`. It is not merged into `availability` until a manager approves it,
at which point the windows are written against the matched person (creating them if
the name is new). Declined and approved submissions are retained so decisions can be
reversed.

## Theming

`app/globals.css` defines both themes as CSS custom properties holding bare RGB
channels; `tailwind.config.ts` exposes them as semantic colour names so Tailwind's
opacity modifiers keep working. Dark is the default, applied by an inline script in
`app/layout.tsx` before first paint to avoid a flash. Chart colours are tokens too,
so SVG marks re-theme without any JavaScript.
