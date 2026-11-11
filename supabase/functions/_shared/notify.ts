const RESEND_ENDPOINT = "https://api.resend.com/emails";

const clean = (value: unknown, max: number) =>
  String(value ?? "").replace(/[\r\n\t]+/g, " ").trim().slice(0, max);

export type OwnerNotification = {
  subject: string;
  lines: Array<[label: string, value: unknown]>;
};

// Best effort: never throws and never blocks the caller's response on failure.
export async function notifyOwner(
  notification: OwnerNotification,
  env: { get(name: string): string | undefined },
  fetchImpl: typeof fetch = fetch,
): Promise<boolean> {
  const apiKey = env.get("RESEND_API_KEY")?.trim();
  const to = env.get("OWNER_NOTIFY_EMAIL")?.trim();
  const from = env.get("NOTIFY_FROM_EMAIL")?.trim();
  if (!apiKey || !to || !from) return false;

  const text = notification.lines
    .map(([label, value]) => `${label}: ${clean(value, 500) || "-"}`)
    .join("\n");

  try {
    const response = await fetchImpl(RESEND_ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [to],
        subject: clean(notification.subject, 150),
        text: `${text}\n\nOpen your dashboard: https://planetlion.com/`,
      }),
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) {
      console.error("Owner notification rejected:", response.status);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Owner notification failed:", error instanceof Error ? error.message : "unknown");
    return false;
  }
}
