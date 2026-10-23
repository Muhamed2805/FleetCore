import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Avatar text: the first letters of up to two words of the name, or the
// start of the email when there's no name.
export function initials(name: string | null, email: string | null | undefined) {
  if (name) {
    return name
      .split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase()
  }
  return (email ?? "?").slice(0, 2).toUpperCase()
}
