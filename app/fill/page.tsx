"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, Copy, Link2Off, MousePointerClick } from "lucide-react";
import { AvailabilityGrid } from "@/components/grid/AvailabilityGrid";
import { Button } from "@/components/ui/Button";
import { parseSlotKey } from "@/lib/grid";
import { decodeFillSession, encodeFillResponse } from "@/lib/session";
import { orderedWeek } from "@/lib/scheduling/time";
import { seriesColors } from "@/lib/theme/palette";
import type { DayOfWeek } from "@/lib/scheduling/types";

const FILL_COLOR = seriesColors[0];

function FillContent() {
  const params = useSearchParams();
  const sessionEncoded = params.get("s");
  const config = sessionEncoded ? decodeFillSession(sessionEncoded) : null;

  const [name, setName] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [responseUrl, setResponseUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const days = (config?.days as DayOfWeek[]) ?? orderedWeek;
  const startHour = config?.startHour ?? 6;
  const endHour = config?.endHour ?? 23;

  function handleSubmit() {
    if (!name.trim() || selected.size === 0) return;

    const slotsByDay: Record<string, number[]> = {};
    for (const key of selected) {
      const { day, slotIndex } = parseSlotKey(key);
      const dayKey = String(day);
      if (!slotsByDay[dayKey]) slotsByDay[dayKey] = [];
      slotsByDay[dayKey].push(slotIndex);
    }

    setResponseUrl(
      `${window.location.origin}/?add=${encodeFillResponse({
        name: name.trim(),
        slots: slotsByDay
      })}`
    );
    setSubmitted(true);
  }

  async function copyUrl() {
    await navigator.clipboard.writeText(responseUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  }

  if (!config) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-fill p-4">
        <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-8 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-bad-soft text-bad-strong">
            <Link2Off className="h-5 w-5" aria-hidden="true" />
          </div>
          <h1 className="text-lg font-bold text-ink">This link doesn&rsquo;t work</h1>
          <p className="mt-2 text-sm text-ink-soft">
            Ask whoever sent it to you for a fresh one.
          </p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-fill p-4">
        <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-8">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-good-soft text-good-strong">
            <Check className="h-5 w-5" aria-hidden="true" />
          </div>
          <h1 className="text-center text-xl font-bold text-ink">
            All done, {name}!
          </h1>
          <p className="mt-2 text-center text-sm text-ink-soft">
            One last step: send this link back to whoever asked you.
          </p>
          <code className="mt-4 block max-h-24 overflow-y-auto break-all rounded-xl border border-line bg-subtle p-3 text-xs text-ink-soft">
            {responseUrl}
          </code>
          <Button
            variant="primary"
            size="lg"
            className="mt-3 w-full"
            icon={<Copy className="h-4 w-4" />}
            onClick={copyUrl}
          >
            {copied ? "Copied!" : "Copy my link"}
          </Button>
          <p className="mt-4 text-center text-xs text-ink-muted">
            They&rsquo;ll open it and your hours drop straight into the planner.
          </p>
        </div>
      </div>
    );
  }

  const slotCount = selected.size;
  const hoursMarked = (slotCount * 30) / 60;

  return (
    <div className="min-h-screen bg-fill">
      <header className="border-b border-line bg-surface px-4 py-5 sm:px-6">
        <div className="mx-auto max-w-2xl">
          <p className="text-sm font-semibold text-ink-muted">When can you work?</p>
          <h1 className="text-xl font-bold tracking-tight text-ink">{config.title}</h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-5 sm:px-6">
        <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
          <label className="mb-5 grid gap-1.5 text-sm font-medium text-ink-soft">
            Your name
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Sarah"
              className="h-11 rounded-xl border border-line-strong bg-surface px-3 text-base text-ink outline-none placeholder:text-ink-faint focus:border-accent focus:ring-2 focus:ring-line"
            />
          </label>

          <div className="mb-3 flex items-start gap-2.5 rounded-xl bg-subtle px-4 py-3">
            <MousePointerClick
              className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted"
              aria-hidden="true"
            />
            <p className="text-sm text-ink-soft">
              <span className="font-semibold">Click and drag</span> down a column to shade in
              the hours you can work. Drag over a shaded block to rub it out.
              {slotCount > 0 && (
                <span className="font-semibold"> {hoursMarked} hours marked so far.</span>
              )}
            </p>
          </div>

          <AvailabilityGrid
            selected={selected}
            onChange={setSelected}
            days={days}
            startHour={startHour}
            endHour={endHour}
            color={FILL_COLOR}
          />

          <Button
            variant="primary"
            size="lg"
            className="mt-5 w-full"
            onClick={handleSubmit}
            disabled={!name.trim() || selected.size === 0}
          >
            {!name.trim()
              ? "Type your name first"
              : selected.size === 0
                ? "Shade in at least one hour"
                : "Done — get my link"}
          </Button>
        </div>
      </main>
    </div>
  );
}

export default function FillPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-fill">
          <p className="text-sm text-ink-muted">Loading…</p>
        </div>
      }
    >
      <FillContent />
    </Suspense>
  );
}
