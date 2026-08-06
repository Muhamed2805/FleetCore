"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import {
  calendarEventColors,
  getCalendarEventLabels,
  type CalendarEvent,
} from "@/lib/calendar";
import { cn } from "@/lib/utils";

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

const WEEKDAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
const MAX_VISIBLE_EVENTS = 3;

export function CalendarView({ events }: { events: CalendarEvent[] }) {
  const t = useTranslations("calendar");
  const weekdays = WEEKDAY_KEYS.map((key) => t(`weekdays.${key}`));
  const calendarEventLabels = getCalendarEventLabels(t);
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(toDateKey(today));

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of events) {
      const list = map.get(event.date) ?? [];
      list.push(event);
      map.set(event.date, list);
    }
    return map;
  }, [events]);

  const days = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = firstDay.getDay();
    const gridStart = new Date(year, month, 1 - startOffset);

    return Array.from({ length: 42 }, (_, i) => {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + i);
      return date;
    });
  }, [cursor]);

  const selectedEvents = eventsByDate.get(selectedDate) ?? [];

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <Card>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">
              {cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
            </h2>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() =>
                  setCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
                }
              >
                <ChevronLeft className="size-4" />
                <span className="sr-only">{t("nav.previousMonth")}</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCursor(new Date(today.getFullYear(), today.getMonth(), 1));
                  setSelectedDate(toDateKey(today));
                }}
              >
                {t("nav.today")}
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() =>
                  setCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
                }
              >
                <ChevronRight className="size-4" />
                <span className="sr-only">{t("nav.nextMonth")}</span>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
            {weekdays.map((day) => (
              <div key={day} className="py-1">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((date) => {
              const key = toDateKey(date);
              const dayEvents = eventsByDate.get(key) ?? [];
              const isCurrentMonth = date.getMonth() === cursor.getMonth();
              const isToday = key === toDateKey(today);
              const isSelected = key === selectedDate;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedDate(key)}
                  aria-current={isToday ? "date" : undefined}
                  aria-pressed={isSelected}
                  aria-label={`${date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}${dayEvents.length ? t("dayCell.eventsSuffix", { count: dayEvents.length }) : ""}`}
                  className={cn(
                    "flex min-h-20 flex-col items-start gap-1 rounded-md border p-1.5 text-left text-xs transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50",
                    !isCurrentMonth && "text-muted-foreground/50",
                    isSelected && "border-primary",
                    !isSelected && "border-transparent"
                  )}
                >
                  <span
                    className={cn(
                      "flex size-5 items-center justify-center rounded-full",
                      isToday && "bg-primary text-primary-foreground"
                    )}
                  >
                    {date.getDate()}
                  </span>
                  <div className="flex w-full flex-col gap-0.5">
                    {dayEvents.slice(0, MAX_VISIBLE_EVENTS).map((event) => (
                      <div key={event.id} className="flex items-center gap-1 truncate">
                        <span
                          className="size-1.5 shrink-0 rounded-full"
                          style={{ background: calendarEventColors[event.type] }}
                        />
                        <span className="truncate">{event.title}</span>
                      </div>
                    ))}
                    {dayEvents.length > MAX_VISIBLE_EVENTS ? (
                      <span className="text-muted-foreground">
                        {t("dayCell.moreEvents", {
                          count: dayEvents.length - MAX_VISIBLE_EVENTS,
                        })}
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-4 border-t pt-3 text-xs text-muted-foreground">
            {Object.entries(calendarEventLabels).map(([type, label]) => (
              <div key={type} className="flex items-center gap-1.5">
                <span
                  className="size-2 rounded-full"
                  style={{ background: calendarEventColors[type as keyof typeof calendarEventColors] }}
                />
                {label}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-3">
          <h2 className="text-sm font-medium">
            {new Date(selectedDate).toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </h2>
          {selectedEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("agenda.empty")}</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {selectedEvents.map((event) => (
                <li key={event.id}>
                  <Link
                    href={event.href}
                    className="flex items-start gap-2 text-sm hover:underline"
                  >
                    <span
                      className="mt-1.5 size-2 shrink-0 rounded-full"
                      style={{ background: calendarEventColors[event.type] }}
                    />
                    <span>
                      {event.title}
                      <span className="block text-xs text-muted-foreground">
                        {calendarEventLabels[event.type]}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
