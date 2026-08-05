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

export const calendarEventLabels: Record<CalendarEventType, string> = {
  registration: "Registration",
  insurance: "Insurance",
  inspection: "Inspection",
  maintenance: "Maintenance",
};

export const calendarEventColors: Record<CalendarEventType, string> = {
  registration: "var(--chart-1)",
  insurance: "var(--chart-2)",
  inspection: "var(--chart-3)",
  maintenance: "var(--chart-4)",
};
