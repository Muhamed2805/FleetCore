"use client";

import { useState, type FormEvent } from "react";

import { updateReminderSettings } from "@/app/dashboard/reminders/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DEFAULT_THRESHOLDS = [30, 15, 7, 1];

export function ReminderSettingsForm({
  companyId,
  thresholdsDays,
  emailEnabled: initialEmailEnabled,
}: {
  companyId: string;
  thresholdsDays: number[];
  emailEnabled: boolean;
}) {
  const [checked, setChecked] = useState<Record<number, boolean>>(
    Object.fromEntries(
      DEFAULT_THRESHOLDS.map((day) => [day, thresholdsDays.includes(day)])
    )
  );
  const [customDays, setCustomDays] = useState(
    thresholdsDays
      .filter((day) => !DEFAULT_THRESHOLDS.includes(day))
      .join(", ")
  );
  const [emailEnabled, setEmailEnabled] = useState(initialEmailEnabled);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus("saving");
    setError(null);

    const selected = DEFAULT_THRESHOLDS.filter((day) => checked[day]);
    const custom = customDays
      .split(",")
      .map((value) => Number(value.trim()))
      .filter((value) => Number.isInteger(value) && value > 0);

    const result = await updateReminderSettings(
      companyId,
      [...selected, ...custom],
      emailEnabled
    );

    if (result?.error) {
      setStatus("error");
      setError(result.error);
    } else {
      setStatus("saved");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Remind before expiration</span>
        <div className="flex flex-wrap gap-4">
          {DEFAULT_THRESHOLDS.map((day) => (
            <label key={day} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={checked[day] ?? false}
                onChange={(event) =>
                  setChecked((prev) => ({
                    ...prev,
                    [day]: event.target.checked,
                  }))
                }
                className="size-4 rounded border-input"
              />
              {day} day{day === 1 ? "" : "s"}
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="custom_days">Custom (comma-separated days)</Label>
        <Input
          id="custom_days"
          value={customDays}
          onChange={(event) => setCustomDays(event.target.value)}
          placeholder="e.g. 60, 45"
          className="max-w-xs"
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={emailEnabled}
          onChange={(event) => setEmailEnabled(event.target.checked)}
          className="size-4 rounded border-input"
        />
        Also send email reminders
      </label>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={status === "saving"}>
          {status === "saving" ? "Saving…" : "Save settings"}
        </Button>
        {status === "saved" ? (
          <span className="text-sm text-muted-foreground">Saved.</span>
        ) : null}
        {error ? <span className="text-sm text-destructive">{error}</span> : null}
      </div>
    </form>
  );
}
