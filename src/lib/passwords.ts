import type { AuthError } from "@supabase/supabase-js";

// Matches `minimum_password_length` in supabase/config.toml. Supabase Auth
// enforces its own setting; this only lets the forms say so up front.
export const MIN_PASSWORD_LENGTH = 6;

// Set by /auth/callback when it signs a user in from a password reset
// email, and read by /reset-password, so the "choose a new password" form
// (which doesn't ask for the current password) only opens from that email.
// Signed-in users change their password in Settings instead.
export const PASSWORD_RECOVERY_COOKIE = "fc-password-recovery";
export const PASSWORD_RECOVERY_MAX_AGE = 15 * 60; // seconds

// Messages in auth.json under `passwordErrors`.
export type PasswordErrorKey =
  | "invalidCurrent"
  | "samePassword"
  | "weakPassword"
  | "rateLimited"
  | "generic";

// Supabase Auth error codes the password forms explain; anything else gets
// the generic message.
export function passwordErrorKey(error: AuthError): PasswordErrorKey {
  switch (error.code) {
    case "invalid_credentials":
      return "invalidCurrent";
    case "same_password":
      return "samePassword";
    case "weak_password":
      return "weakPassword";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "rateLimited";
    default:
      return error.status === 429 ? "rateLimited" : "generic";
  }
}
