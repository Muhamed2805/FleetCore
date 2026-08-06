export type CalendarEventType =
  | "registration"
  | "insurance"
  | "inspection"
  | "maintenance";

export type CalendarEvent = {
  id: string;
  date: string;
  type: CalendarEventType;
  title: string;
  href: string;
};

type Translate = (key: string) => string;

export function getCalendarEventLabels(
  t: Translate
): Record<CalendarEventType, string> {
  return {
    registration: t("eventTypeLabels.registration"),
    insurance: t("eventTypeLabels.insurance"),
    inspection: t("eventTypeLabels.inspection"),
    maintenance: t("eventTypeLabels.maintenance"),
  };
}

export const calendarEventColors: Record<CalendarEventType, string> = {
  registration: "var(--chart-1)",
  insurance: "var(--chart-2)",
  inspection: "var(--chart-3)",
  maintenance: "var(--chart-4)",
};
