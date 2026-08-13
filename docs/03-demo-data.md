# Demo Data

The demo workspace is a synthetic 24/7 convenience store week. It is not personal
data and is not copied from any private workforce dataset.

## Shape

A round-the-clock corner store, staffed with three eight-hour shifts a day:

| Shift    | Time        | People |
| -------- | ----------- | ------ |
| Night    | 10pm – 6am  | 1      |
| Morning  | 6am – 2pm   | 2      |
| Evening  | 2pm – 10pm  | 1 (2 on Friday and Saturday) |

That is 21 shifts across the week covering all 168 trading hours, with the night
shift crossing midnight into the following day.

## Staff mix

Ten people, split between the two contract types the planner supports:

- **Four permanent** — a store manager, an assistant manager, a night supervisor and
  a night attendant, on contracted weekly hours with day and hours ceilings.
- **Six casual** — console operators, a student, and weekend and overnight casuals,
  each with their own weekly hours ceiling and their own availability.

Availability is deliberately imperfect. Saturday is left short-staffed and two
permanents fall below their contracted hours, so the coverage dials, the
short-of-contract warning and the "what still needs fixing" list all have something
real to show rather than a uniformly green dashboard.

## Background

The shape is based on common retail and convenience-store scheduling patterns:

- Stores commonly operate across morning, afternoon, evening and overnight coverage
  windows.
- Retail staffing demand changes by time of day and day of week.
- Real rosters balance employee availability, required coverage, contract type, and
  uncovered demand.

References used while shaping the demo:

- https://en.wikipedia.org/wiki/Shift_plan
- https://en.wikipedia.org/wiki/Shopping_hours
- https://en.wikipedia.org/wiki/Workforce_modeling
- https://arxiv.org/abs/2403.17850
- https://arxiv.org/abs/2504.17805
