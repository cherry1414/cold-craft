import type { SSEEvent } from "./types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Stream the full 3-agent generation pipeline via Server-Sent Events.
 * Calls `onEvent` for each SSE frame received.
 */
export async function generateCampaign(
  payload: { company_name: string; target_role: string; sender_name: string },
  onEvent: (event: SSEEvent) => void
): Promise<void> {
  const response = await fetch(`${API_BASE}/api/generate-stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "Unknown error");
    throw new Error(`API error ${response.status}: ${text}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body from server");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          const event: SSEEvent = JSON.parse(line.slice(6));
          onEvent(event);
        } catch {
          // Ignore malformed SSE frames
        }
      }
    }
  }
}

/** Fetch all saved campaigns. */
export async function getCampaigns() {
  const res = await fetch(`${API_BASE}/api/campaigns`);
  if (!res.ok) throw new Error("Failed to fetch campaigns");
  return res.json();
}

/** Fetch a single campaign by ID. */
export async function getCampaign(id: string) {
  const res = await fetch(`${API_BASE}/api/campaigns/${id}`);
  if (!res.ok) throw new Error("Failed to fetch campaign");
  return res.json();
}

/** Delete a campaign by ID. */
export async function deleteCampaign(id: string) {
  const res = await fetch(`${API_BASE}/api/campaigns/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete campaign");
  return res.json();
}
