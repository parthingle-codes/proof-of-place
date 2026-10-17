import type {
  AnalyzeResponse,
  ComplaintInput,
  Health,
  Ticket,
  Answer,
  Analysis,
  QueueResponse,
  QueueListResponse,
} from "./types";

export class ApiError extends Error {
  kind: string;
  detail?: string;
  constructor(message: string, kind = "unknown", detail?: string) {
    super(message);
    this.kind = kind;
    this.detail = detail;
  }
}

/** fetch with a deadline + friendly error wrapping (never leaves a spinner forever). */
async function request(url: string, init: RequestInit = {}, timeoutMs = 15000): Promise<any> {
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (e: any) {
    if (e?.name === "TimeoutError" || e?.name === "AbortError") {
      throw new ApiError(
        `The request timed out after ${Math.round(timeoutMs / 1000)}s. The server may be busy - try again.`,
        "timeout"
      );
    }
    throw new ApiError(
      `Could not reach the server (${e?.message || "network error"}).`,
      "network"
    );
  }
  let body: any = null;
  try {
    body = await res.json();
  } catch {
    if (!res.ok) {
      throw new ApiError(`Request failed (HTTP ${res.status}).`, "unknown");
    }
  }
  if (!res.ok) {
    throw new ApiError(
      body?.error || `Request failed (HTTP ${res.status}).`,
      body?.kind || "unknown",
      body?.detail
    );
  }
  if (body === null) {
    throw new ApiError("The server returned an empty response.", "malformed");
  }
  return body;
}

export async function getHealth(): Promise<Health> {
  return request("/api/health", {}, 12000);
}

export async function analyze(
  input: ComplaintInput,
  image: File | null
): Promise<AnalyzeResponse> {
  const form = new FormData();
  form.append("description", input.description);
  form.append("location", input.location);
  form.append("category", input.category);
  form.append("context", input.context);
  if (image) form.append("image", image);
  // Generous: includes one corrective retry inside the server.
  return request("/api/analyze", { method: "POST", body: form }, 180000);
}

export async function makeTicket(
  analysis: Analysis,
  input: ComplaintInput,
  answers: Answer[]
): Promise<Ticket> {
  const body = await request(
    "/api/ticket",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ analysis, input, answers }),
    },
    30000
  );
  if (!body.ticket) {
    throw new ApiError(
      "The server returned an unexpected ticket payload.",
      "malformed"
    );
  }
  return body.ticket as Ticket;
}

/** Campus Maintenance Desk - demonstration queue (never a real college system). */
export async function addToQueue(ticket: Ticket): Promise<QueueResponse> {
  return request(
    "/api/queue",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticket }),
    },
    15000
  );
}

export async function getQueue(): Promise<QueueListResponse> {
  return request("/api/queue", {}, 12000);
}
