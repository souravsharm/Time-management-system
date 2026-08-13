"use client";

import {
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  ClipboardList,
  Inbox,
  LayoutDashboard,
  Link2,
  ListChecks,
  MoonStar,
  Sparkles,
  Store,
  Users,
  X
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { CoverageDial } from "@/components/charts/CoverageDial";
import { Button } from "@/components/ui/Button";
import { personColor, statusColors } from "@/lib/theme/palette";
import type { RosterTab } from "@/components/roster/RosterWorkspace";
import { cn } from "@/lib/utils";

type Props = {
  onClose: () => void;
  /** Jumps the app to a roster tab and closes the guide. */
  onJumpTo: (tab: RosterTab) => void;
  onLoadExample: () => void;
};

type Step = {
  id: string;
  navLabel: string;
  icon: ReactNode;
  title: string;
  body: ReactNode;
  demo: ReactNode;
  jumpTo?: RosterTab;
  jumpLabel?: string;
};

export function HowToGuide({ onClose, onJumpTo, onLoadExample }: Props) {
  const [index, setIndex] = useState(0);
  const steps = buildSteps();
  const step = steps[index];

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/50 p-0 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="How to use this planner"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-2xl bg-surface sm:rounded-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
          <div>
            <p className="text-sm font-semibold text-ink-muted">Quick tour</p>
            <h2 className="text-xl font-bold tracking-tight text-ink">
              How to use this planner
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Close the tour"
            icon={<X className="h-5 w-5" />}
            onClick={onClose}
          />
        </div>

        <div className="grid min-h-0 flex-1 sm:grid-cols-[210px_1fr]">
          {/* Step list */}
          <nav className="shrink-0 overflow-x-auto border-b border-line bg-subtle p-3 sm:overflow-y-auto sm:border-b-0 sm:border-r">
            <ol className="flex gap-2 sm:grid sm:gap-1">
              {steps.map((entry, entryIndex) => {
                const active = entryIndex === index;
                return (
                  <li key={entry.id}>
                    <button
                      type="button"
                      onClick={() => setIndex(entryIndex)}
                      className={cn(
                        "flex w-full items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                        active
                          ? "bg-accent text-on-accent"
                          : "text-ink-soft hover:bg-line/60 hover:text-ink"
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                          active ? "bg-surface/20 text-white" : "bg-line text-ink-soft"
                        )}
                      >
                        {entryIndex + 1}
                      </span>
                      {entry.navLabel}
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>

          {/* Step body */}
          <div className="min-h-0 overflow-y-auto px-5 py-5 sm:px-6">
            <div className="flex items-center gap-2 text-ink-faint">{step.icon}</div>
            <h3 className="mt-2 text-lg font-bold tracking-tight text-ink">
              {step.title}
            </h3>
            <div className="mt-2 grid gap-2.5 text-sm leading-relaxed text-ink-soft">
              {step.body}
            </div>
            <div className="mt-4">{step.demo}</div>

            {step.jumpTo && (
              <Button
                variant="primary"
                className="mt-4"
                icon={<ArrowRight className="h-4 w-4" />}
                onClick={() => onJumpTo(step.jumpTo as RosterTab)}
              >
                {step.jumpLabel ?? "Take me there"}
              </Button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-3.5 sm:px-6">
          <Button
            variant="ghost"
            icon={<ArrowLeft className="h-4 w-4" />}
            onClick={() => setIndex((current) => Math.max(0, current - 1))}
            disabled={index === 0}
          >
            Back
          </Button>

          <span className="text-sm font-medium text-ink-muted tabular-nums">
            {index + 1} of {steps.length}
          </span>

          {index === steps.length - 1 ? (
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  onLoadExample();
                  onClose();
                }}
              >
                Load example
              </Button>
              <Button variant="primary" onClick={onClose}>
                Got it
              </Button>
            </div>
          ) : (
            <Button
              variant="primary"
              icon={<ArrowRight className="h-4 w-4" />}
              onClick={() => setIndex((current) => Math.min(steps.length - 1, current + 1))}
            >
              Next
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function buildSteps(): Step[] {
  return [
    {
      id: "what",
      navLabel: "The idea",
      icon: <Sparkles className="h-5 w-5" aria-hidden="true" />,
      title: "What this does",
      body: (
        <>
          <p>
            You tell it two things: <strong>when your people can work</strong>, and{" "}
            <strong>what shifts the store needs covering</strong>.
          </p>
          <p>
            It then works out who goes where — spreading the hours fairly, never
            double-booking anyone, and flagging any shift it couldn&rsquo;t fill.
          </p>
          <p>
            Everything is saved on this device automatically. Nothing is sent anywhere.
          </p>
        </>
      ),
      demo: (
        <div className="grid gap-2 rounded-xl bg-subtle p-4 text-sm sm:grid-cols-[1fr_auto_1fr] sm:items-center">
          <div className="rounded-lg bg-surface px-3 py-2.5 text-center font-semibold text-ink-soft ring-1 ring-line">
            Who&rsquo;s free
            <span className="mt-0.5 block text-xs font-normal text-ink-muted">
              + what shifts you need
            </span>
          </div>
          <ArrowRight
            className="mx-auto h-5 w-5 rotate-90 text-ink-faint sm:rotate-0"
            aria-hidden="true"
          />
          <div className="rounded-lg bg-surface px-3 py-2.5 text-center font-semibold text-ink-soft ring-1 ring-line">
            A finished roster
            <span className="mt-0.5 block text-xs font-normal text-ink-muted">
              with the gaps called out
            </span>
          </div>
        </div>
      )
    },
    {
      id: "store",
      navLabel: "Store hours",
      icon: <Store className="h-5 w-5" aria-hidden="true" />,
      title: "Step 1 — Tell it when you're open",
      body: (
        <>
          <p>
            On the <strong>Store hours</strong> tab, pick <strong>Open 24 hours, 7 days</strong>{" "}
            if you never close, or set your own opening and closing times per day.
          </p>
          <p>
            This decides two things: the hours the coverage charts measure against, and how
            far the availability grid stretches. A 24/7 store gets the full midnight-to-midnight
            grid, so overnight staff can actually mark themselves free.
          </p>
          <p>
            Same tab holds your <strong>company rule</strong> for the longest a single shift
            can be — 10 hours by default. Anything longer gets blocked when you try to add it.
          </p>
        </>
      ),
      demo: (
        <div className="grid gap-2 rounded-xl bg-subtle p-4 text-sm sm:grid-cols-2">
          <div className="rounded-lg bg-surface px-3 py-2.5 ring-1 ring-line">
            <span className="block font-bold text-ink">Open 24/7</span>
            <span className="block text-xs text-ink-muted">
              Night, morning and evening shifts
            </span>
          </div>
          <div className="rounded-lg bg-surface px-3 py-2.5 ring-1 ring-line">
            <span className="block font-bold text-ink">Set your own hours</span>
            <span className="block text-xs text-ink-muted">
              Different per day, closed Sundays
            </span>
          </div>
        </div>
      ),
      jumpTo: "store",
      jumpLabel: "Open the Store hours tab"
    },
    {
      id: "team",
      navLabel: "Add people",
      icon: <Users className="h-5 w-5" aria-hidden="true" />,
      title: "Step 2 — Add your team",
      body: (
        <>
          <p>
            Go to the <strong>Team</strong> tab and type in everyone who could work a
            shift. Then say whether each one is permanent or casual:
          </p>
          <p>
            <strong>Permanent</strong> staff have contracted hours — a manager on 38 hours
            over 5 days. The roster fills their contract first.{" "}
            <strong>Casuals</strong> pick up whatever is left, only in the hours
            they&rsquo;ve marked themselves free for.
          </p>
          <p>
            Hit <strong>Edit</strong> on anyone to set their contracted hours, a weekly
            hours ceiling, or a maximum number of days a week.
          </p>
          <p>
            Each person also gets their own colour, and it follows them everywhere — the
            charts, the grid, the schedule.
          </p>
        </>
      ),
      demo: (
        <div className="grid gap-2 rounded-xl bg-subtle p-4 sm:grid-cols-2">
          {[
            { name: "Maya Chen", kind: "Permanent · 40h" },
            { name: "Noah Williams", kind: "Permanent · 40h" },
            { name: "Priya Shah", kind: "Casual · max 20h" },
            { name: "Ben Martin", kind: "Casual · max 25h" }
          ].map((entry, index) => (
            <div
              key={entry.name}
              className="flex items-center gap-2.5 rounded-lg bg-surface px-3 py-2 ring-1 ring-line"
            >
              <span
                aria-hidden="true"
                className="h-6 w-6 shrink-0 rounded-full"
                style={{ backgroundColor: personColor(index) }}
              />
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-ink">
                  {entry.name}
                </span>
                <span className="block truncate text-xs text-ink-muted">{entry.kind}</span>
              </span>
            </div>
          ))}
        </div>
      ),
      jumpTo: "team",
      jumpLabel: "Open the Team tab"
    },
    {
      id: "hours",
      navLabel: "Free hours",
      icon: <CalendarClock className="h-5 w-5" aria-hidden="true" />,
      title: "Step 3 — Mark when each person can work",
      body: (
        <>
          <p>
            On the <strong>Free hours</strong> tab, pick a person, then{" "}
            <strong>click and drag down a column</strong> to shade the hours they&rsquo;re
            available. Drag back over a shaded block to rub it out.
          </p>
          <p>
            For overnight staff, shade the late hours on one day <em>and</em> the early
            hours on the next — that&rsquo;s what an overnight shift needs to match.
          </p>
          <p>
            Don&rsquo;t want to do this yourself? Hit{" "}
            <strong className="whitespace-nowrap">
              <Link2 className="mb-0.5 inline h-3.5 w-3.5" aria-hidden="true" /> Ask the
              team
            </strong>{" "}
            at the top. Everyone gets a link and fills in their own hours.
          </p>
        </>
      ),
      demo: (
        <div className="rounded-xl bg-subtle p-4">
          <div className="mx-auto grid w-fit grid-cols-5 gap-1">
            {["Mon", "Tue", "Wed", "Thu", "Fri"].map((day) => (
              <span
                key={day}
                className="w-11 text-center text-[11px] font-bold uppercase text-ink-muted"
              >
                {day}
              </span>
            ))}
            {Array.from({ length: 30 }, (_, cell) => {
              const column = cell % 5;
              const row = Math.floor(cell / 5);
              const shaded = (column < 3 && row > 1) || (column === 4 && row > 3);
              return (
                <span
                  key={cell}
                  className="h-3.5 w-11 rounded-[3px] ring-1 ring-line"
                  style={{ backgroundColor: shaded ? personColor(0) : "rgb(var(--surface))" }}
                />
              );
            })}
          </div>
          <p className="mt-3 text-center text-xs text-ink-muted">
            Shaded = available. Empty = not available.
          </p>
        </div>
      ),
      jumpTo: "availability",
      jumpLabel: "Open the Free hours tab"
    },
    {
      id: "approve",
      navLabel: "Approvals",
      icon: <Inbox className="h-5 w-5" aria-hidden="true" />,
      title: "Step 4 — You approve what comes back",
      body: (
        <>
          <p>
            When someone sends their link back, their hours <strong>don&rsquo;t</strong> go
            straight into the roster. They land in <strong>Requests</strong> and wait for
            you.
          </p>
          <p>
            Each one shows who sent it, how many hours they&rsquo;ve offered, and whether
            it replaces hours they gave you before. Hit <strong>See hours</strong> for a
            read-only look at exactly what they shaded in.
          </p>
          <p>
            <strong>Approve</strong> and it goes live. <strong>Decline</strong> and nothing
            changes. Either way it&rsquo;s recorded, and you can move a decision back into
            the queue if you change your mind.
          </p>
        </>
      ),
      demo: (
        <div className="grid gap-2 rounded-xl bg-subtle p-4 text-sm">
          <div className="flex flex-wrap items-center gap-2 rounded-lg bg-surface px-3 py-2.5 ring-1 ring-line">
            <span className="min-w-0 flex-1">
              <span className="block font-bold text-ink">Priya Shah</span>
              <span className="block text-xs text-ink-muted">
                18h across 4 days · replaces her current 12h
              </span>
            </span>
            <span className="rounded-lg bg-accent px-2.5 py-1 text-xs font-bold text-white">
              Approve
            </span>
            <span className="rounded-lg border border-bad-strong/40 px-2.5 py-1 text-xs font-bold text-bad-strong">
              Decline
            </span>
          </div>
        </div>
      ),
      jumpTo: "requests",
      jumpLabel: "Open the Requests tab"
    },
    {
      id: "shifts",
      navLabel: "Set shifts",
      icon: <ClipboardList className="h-5 w-5" aria-hidden="true" />,
      title: "Step 5 — Say what the store needs",
      body: (
        <>
          <p>
            On the <strong>Shifts</strong> tab you describe the coverage you want, not who
            works it. Three quick choices:
          </p>
          <p>
            <strong>1.</strong> Tick the days — several at once, or use the{" "}
            <em>Mon–Fri</em> shortcut. <strong>2.</strong> Pick the time, or tap a preset.
            An <em>Overnight</em> preset runs 10pm to 6am and the planner knows it finishes
            the next morning. <strong>3.</strong> Set how many people on at once.
          </p>
          <p>
            Got something wrong? Every shift has an <strong>Edit</strong> button — change
            the day, the times, or the headcount without deleting and starting again.
          </p>
          <p>
            If you try to add something silly like midnight to 11:59pm, it gets blocked:
            no single shift can run past your company limit.
          </p>
        </>
      ),
      demo: (
        <div className="grid gap-2 rounded-xl bg-subtle p-4 text-sm">
          {[
            { time: "10pm – 6am", need: "1 person", night: true },
            { time: "6am – 2pm", need: "2 people", night: false },
            { time: "2pm – 10pm", need: "1 person", night: false }
          ].map((row) => (
            <div
              key={row.time}
              className="flex items-center justify-between rounded-lg bg-surface px-3 py-2 ring-1 ring-line"
            >
              <span className="flex items-center gap-1.5 font-bold text-ink tabular-nums">
                {row.night && (
                  <MoonStar className="h-3.5 w-3.5 text-ink-muted" aria-hidden="true" />
                )}
                {row.time}
              </span>
              <span className="text-ink-muted">{row.need} needed</span>
            </div>
          ))}
          <p className="text-xs text-ink-muted">
            Three 8-hour shifts covering a full 24 hours.
          </p>
        </div>
      ),
      jumpTo: "shifts",
      jumpLabel: "Open the Shifts tab"
    },
    {
      id: "overview",
      navLabel: "Read the dials",
      icon: <LayoutDashboard className="h-5 w-5" aria-hidden="true" />,
      title: "Step 6 — Read the Overview",
      body: (
        <>
          <p>The two dials at the top answer the two questions that actually matter:</p>
          <p>
            <strong>Store hours with someone on</strong>{" "}
            — of all the hours you&rsquo;re open, how many have at least one person
            rostered. If this isn&rsquo;t 100%, the store is empty at some point.
          </p>
          <p>
            <strong>Staffing you asked for</strong> — of all the people-spots your shifts
            asked for, how many got filled. 100% here means every shift has its full
            crew.
          </p>
          <p>
            Below them, the <strong>Who is doing the work</strong> donut splits the
            rostered hours by person, so you can see straight away if someone is carrying
            too much or getting nothing.
          </p>
        </>
      ),
      demo: (
        <div className="rounded-xl bg-subtle p-4">
          <div className="flex flex-wrap items-center justify-center gap-6">
            {[
              { value: 100, label: "All good" },
              { value: 82, label: "A few gaps" },
              { value: 44, label: "Needs work" }
            ].map((item) => (
              <div key={item.label} className="text-center">
                <CoverageDial value={item.value} size={78} thickness={16} />
                <p className="mt-1 text-xs font-medium text-ink-soft">{item.label}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-center text-xs text-ink-muted">
            Green means sorted, amber means partly covered, red means trouble.
          </p>
        </div>
      ),
      jumpTo: "overview",
      jumpLabel: "Open the Overview tab"
    },
    {
      id: "schedule",
      navLabel: "The schedule",
      icon: <ListChecks className="h-5 w-5" aria-hidden="true" />,
      title: "Step 7 — Check the day-by-day schedule",
      body: (
        <>
          <p>
            The <strong>Schedule</strong> tab shows one day at a time. The top bar is the
            store&rsquo;s trading day, coloured by how well it&rsquo;s covered. Under it,
            each person gets their own row showing exactly which slice of the day is
            theirs.
          </p>
          <p>
            If any part of the day has nobody on, you get a plain-English warning telling
            you which hours are exposed.
          </p>
          <p>
            Happy with it? <strong>Copy week</strong> puts the whole roster on your
            clipboard, and <strong>Download</strong> saves it as a spreadsheet.
          </p>
        </>
      ),
      demo: (
        <div className="rounded-xl bg-subtle p-4">
          <div className="grid gap-1.5">
            <div className="grid grid-cols-[70px_1fr] items-center gap-2">
              <span className="text-xs font-bold text-ink-soft">Store open</span>
              <div className="flex h-5 gap-0.5 overflow-hidden rounded-md">
                <span className="flex-[5]" style={{ backgroundColor: statusColors.good }} />
                <span className="flex-[2]" style={{ backgroundColor: statusColors.warning }} />
                <span className="flex-[1]" style={{ backgroundColor: statusColors.critical }} />
              </div>
            </div>
            {[
              { name: "Maya", index: 0, start: 0, width: 45 },
              { name: "Jordan", index: 1, start: 30, width: 40 },
              { name: "Priya", index: 2, start: 62, width: 38 }
            ].map((lane) => (
              <div key={lane.name} className="grid grid-cols-[70px_1fr] items-center gap-2">
                <span className="flex items-center gap-1.5 text-xs font-medium text-ink-soft">
                  <span
                    aria-hidden="true"
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: personColor(lane.index) }}
                  />
                  {lane.name}
                </span>
                <div className="relative h-5 rounded-md bg-surface ring-1 ring-line">
                  <span
                    className="absolute inset-y-0 rounded-[4px]"
                    style={{
                      left: `${lane.start}%`,
                      width: `${lane.width}%`,
                      backgroundColor: personColor(lane.index)
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
      jumpTo: "schedule",
      jumpLabel: "Open the Schedule tab"
    },
    {
      id: "meet",
      navLabel: "Meetings",
      icon: <Sparkles className="h-5 w-5" aria-hidden="true" />,
      title: "The other mode — finding a time to meet",
      body: (
        <>
          <p>
            Switch to <strong>Find a time to meet</strong> at the top when you&rsquo;re not
            building a roster — you just want one slot that suits a group.
          </p>
          <p>
            Same idea: add the people, shade in when they&rsquo;re free, and the{" "}
            <strong>Best times</strong> tab ranks the slots that work, telling you exactly
            who can and can&rsquo;t make each one.
          </p>
          <p>
            Not sure where to start? Load the example below — it fills the planner with a
            real-looking shop roster you can poke at without breaking anything.
          </p>
        </>
      ),
      demo: (
        <div className="grid gap-2 rounded-xl bg-subtle p-4 text-sm">
          {[
            { when: "Tuesday 2pm – 4pm", free: "8 of 8 free", tone: "good" },
            { when: "Thursday 10am – 12pm", free: "6 of 8 free", tone: "ok" }
          ].map((row) => (
            <div
              key={row.when}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-surface px-3 py-2 ring-1 ring-line"
            >
              <span className="font-bold text-ink">{row.when}</span>
              <span
                className={cn(
                  "rounded-lg px-2 py-0.5 text-xs font-bold",
                  row.tone === "good"
                    ? "bg-good-soft text-good-strong"
                    : "bg-warn-soft text-warn-strong"
                )}
              >
                {row.free}
              </span>
            </div>
          ))}
        </div>
      )
    }
  ];
}
