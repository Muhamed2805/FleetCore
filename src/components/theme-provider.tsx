"use client";

import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import { useEffect, type ComponentProps } from "react";

// next-themes only ever applies the *resolved* light/dark class, so
// picking "System" is visually indistinguishable from explicitly picking
// whichever one the OS currently resolves to. This mirrors the raw
// selection onto a data attribute so globals.css can give System its own
// palette (see the `[data-theme-source="system"]` blocks there).
function ThemeSourceSync() {
  const { theme } = useTheme();

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "system") {
      root.setAttribute("data-theme-source", "system");
    } else {
      root.removeAttribute("data-theme-source");
    }
  }, [theme]);

  return null;
}

export function ThemeProvider({
  children,
  ...props
}: ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider {...props}>
      <ThemeSourceSync />
      {children}
    </NextThemesProvider>
  );
}
