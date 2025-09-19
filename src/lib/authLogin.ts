export function loginToEmail(login: string) {
  const domain = (import.meta as any)?.env?.VITE_AUTH_FAKE_EMAIL_DOMAIN || "example.com";
  const normalized = String(login || "").trim().toLowerCase().replace(/\s+/g, "");
  return `${normalized}@${domain}`;
}
