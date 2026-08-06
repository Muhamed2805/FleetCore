import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";

import { routing } from "@/i18n/routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  const [
    common,
    auth,
    landing,
    dashboardShell,
    vehicles,
    maintenance,
    expenses,
    damageReports,
    reminders,
    calendar,
  ] = await Promise.all([
    import(`../../messages/${locale}/common.json`),
    import(`../../messages/${locale}/auth.json`),
    import(`../../messages/${locale}/landing.json`),
    import(`../../messages/${locale}/dashboard-shell.json`),
    import(`../../messages/${locale}/vehicles.json`),
    import(`../../messages/${locale}/maintenance.json`),
    import(`../../messages/${locale}/expenses.json`),
    import(`../../messages/${locale}/damage-reports.json`),
    import(`../../messages/${locale}/reminders.json`),
    import(`../../messages/${locale}/calendar.json`),
  ]);

  return {
    locale,
    messages: {
      common: common.default,
      auth: auth.default,
      landing: landing.default,
      dashboardShell: dashboardShell.default,
      vehicles: vehicles.default,
      maintenance: maintenance.default,
      expenses: expenses.default,
      damageReports: damageReports.default,
      reminders: reminders.default,
      calendar: calendar.default,
    },
  };
});
