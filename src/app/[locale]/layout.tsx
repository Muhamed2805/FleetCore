import type { Metadata } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { Geist_Mono, Inter, Plus_Jakarta_Sans } from "next/font/google";
import { notFound } from "next/navigation";
import "../globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { routing } from "@/i18n/routing";

// latin-ext covers č, ć, đ, š, ž and å, ä, ö.
// Not preloaded: the browser then fetches only the subsets a page uses
// (unicode-range), so latin-ext loads for bs/hr/sr text but not for en,
// de, sv or nl, instead of every page downloading both.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
  axes: ["opsz"],
  preload: false,
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin", "latin-ext"],
  preload: false,
});

// Only the invite link uses it, so it loads when shown instead of being
// preloaded on every page.
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  preload: false,
});

export const metadata: Metadata = {
  title: {
    default: "FleetCore",
    template: "%s | FleetCore",
  },
  description:
    "Fleet management and maintenance platform for cars, vans, trucks, construction machinery and forklifts.",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${inter.variable} ${jakarta.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
