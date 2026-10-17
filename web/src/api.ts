import type { AnalyzeResponse, ComplaintInput, Health, Ticket, Answer, Analysis } from "./types";

export class ApiError extends Error {
  kind: string;
  detail?: string;
  constructor(message: string, kind = "unknown", detail?: string) {
    super(message);
    this.kind = kind;
    this.detail = detail;
  }
}

async function handle(res: Response) {
  let body: any = null;
  try {
    body = await res.json();
  } catch {
    /* empty body */
  }
  if (!res.ok) {
    throw new ApiError(
      body?.error || `Request failed (HTTP ${res.status}).`,
      body?.kind || "unknown",
      body?.detail
    );
  }
  return body;
}

export async function getHealth(): Promise<Health> {
  return handle(await fetch("/api/health"));
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
  return handle(
    await fetch("/api/analyze", { method: "POST", body: form })
  );
}

export async function makeTicket(
  analysis: Analysis,
  input: ComplaintInput,
  answers: Answer[]
): Promise<Ticket> {
  return handle(
    await fetch("/api/ticket", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ analysis, input, answers }),
    })
  );
}
