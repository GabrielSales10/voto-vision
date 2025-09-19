export const FAKE_EMAIL_DOMAIN =
  (import.meta as any)?.env?.VITE_AUTH_FAKE_EMAIL_DOMAIN || "example.com";

export function loginToEmail(login: string, domain = FAKE_EMAIL_DOMAIN) {
  const normalized = String(login || "").trim().toLowerCase().replace(/\s+/g, "");
  return `${normalized}@${domain}`;
}
