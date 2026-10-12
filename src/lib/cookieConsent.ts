export type CookieConsentValue = "accepted" | "rejected";

export const COOKIE_CONSENT_KEY = "iwm_cookie_consent";
export const COOKIE_CONSENT_EVENT = "iwm:cookie-consent";
export const COOKIE_SETTINGS_EVENT = "iwm:cookie-settings";

export function getCookieConsent(): CookieConsentValue | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(COOKIE_CONSENT_KEY);
    if (raw === "accepted" || raw === "rejected") return raw;
  } catch {
    /* private mode / blocked storage */
  }
  return null;
}

export function setCookieConsent(value: CookieConsentValue): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(COOKIE_CONSENT_KEY, value);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(
    new CustomEvent(COOKIE_CONSENT_EVENT, { detail: { value } })
  );
}

/** Re-open the cookie banner so visitors can change their choice. */
export function openCookieSettings(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(COOKIE_SETTINGS_EVENT));
}

export function isAnalyticsAllowed(): boolean {
  return getCookieConsent() === "accepted";
}
