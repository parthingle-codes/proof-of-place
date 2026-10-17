/**
 * Gemma 4 inference client (Google AI Studio / Gemini API, REST).
 *
 * Documented endpoint:
 *   POST {GEMMA_API_BASE}/{model}:generateContent
 *   Header: x-goog-api-key: <GEMINI_API_KEY>
 *
 * Credentials never leave this process.
 */

export const CONFIG = {
  apiKey: process.env.GEMINI_API_KEY || "",
  model: process.env.GEMMA_MODEL || "gemma-4-26b-a4b-it",
  baseUrl: process.env.GEMMA_API_BASE || "https://generativelanguage.googleapis.com/v1beta",
  timeoutMs: Number(process.env.GEMMA_TIMEOUT_MS || 90000),
  demoMode: String(process.env.DEMO_MODE || "").toLowerCase() === "true",
};

export class GemmaError extends Error {
  constructor(message, { status = 0, kind = "unknown", detail = "" } = {}) {
    super(message);
    this.name = "GemmaError";
    this.status = status;
    this.kind = kind; // auth | quota | not_found | bad_request | network | timeout | malformed | not_configured
    this.detail = detail;
  }
}

function classify(status, bodyText, bodyJson) {
  const msg =
    bodyJson?.error?.message || bodyText?.slice(0, 300) || `HTTP ${status}`;
  // Google reports invalid keys as HTTP 400, not 401 - classify by message.
  if (status === 401 || status === 403 || /api key not valid|API_KEY_INVALID/i.test(msg)) {
    return new GemmaError(
      "Authentication failed: the configured GEMINI_API_KEY was rejected. Check the key in .env.",
      { status, kind: "auth", detail: msg }
    );
  }
  if (status === 429) {
    return new GemmaError(
      "Quota or rate limit reached for this model. This is a limit on the API key/project, not a bug. Wait and retry, request a higher quota, or deliberately switch GEMMA_MODEL to another Gemma 4 model in .env.",
      { status, kind: "quota", detail: msg }
    );
  }
  if (status === 404) {
    return new GemmaError(
      `Model "${CONFIG.model}" is not available to this API key or project. Set GEMMA_MODEL in .env to a Gemma 4 model your key can use.`,
      { status, kind: "not_found", detail: msg }
    );
  }
  if (status === 400) {
    return new GemmaError(`The API rejected the request: ${msg}`, {
      status,
      kind: "bad_request",
      detail: msg,
    });
  }
  return new GemmaError(`Inference endpoint error (HTTP ${status}): ${msg}`, {
    status,
    kind: "unknown",
    detail: msg,
  });
}

/**
 * Perform a single generateContent call.
 * @param {{role: "user"|"model", parts: Array<object>}[]} contents
 * @returns {Promise<string>} concatenated response text
 */
export async function generateContent(contents) {
  if (!CONFIG.apiKey) {
    throw new GemmaError(
      "No GEMINI_API_KEY configured. Add it to .env (see .env.example).",
      { kind: "not_configured" }
    );
  }

  const url = `${CONFIG.baseUrl}/models/${CONFIG.model}:generateContent`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CONFIG.timeoutMs);

  const postJson = () =>
    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": CONFIG.apiKey,
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.2,
          // Generous budget: a truncated JSON object was a plausible cause of
          // unparseable replies (thinking text also consumes the budget).
          maxOutputTokens: 4096,
          responseMimeType: "application/json",
        },
      }),
      signal: controller.signal,
    });

  let res;
  try {
    res = await postJson(url, contents);
    if (res.status >= 500) {
      // Provider-side transient failure: one retry, same model, no fallback.
      const retryDelay = 1500;
      await new Promise((r) => setTimeout(r, retryDelay));
      res = await postJson(url, contents);
    }
  } catch (err) {
    if (err.name === "AbortError") {
      throw new GemmaError(
        `The model did not respond within ${CONFIG.timeoutMs / 1000}s. Retry, or reduce the image size.`,
        { kind: "timeout" }
      );
    }
    if (err instanceof GemmaError) throw err;
    throw new GemmaError(`Could not reach the inference endpoint: ${err.message}`, {
      kind: "network",
      detail: String(err),
    });
  } finally {
    clearTimeout(timer);
  }

  const bodyText = await res.text();
  let bodyJson = null;
  try {
    bodyJson = JSON.parse(bodyText);
  } catch {
    /* non-JSON body handled below */
  }

  if (!res.ok) throw classify(res.status, bodyText, bodyJson);

  const candidates = bodyJson?.candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) {
    const block = bodyJson?.promptFeedback?.blockReason;
    throw new GemmaError(
      block
        ? `The model declined this input (blocked: ${block}). Rephrase the description or remove the image.`
        : "The model returned no candidates, so there is nothing to analyse.",
      { status: res.status, kind: "malformed", detail: bodyText.slice(0, 300) }
    );
  }

  const parts = candidates[0]?.content?.parts || [];
  // Gemma 4 may emit reasoning/thought parts alongside the answer - keep only
  // the parts that are actually the response.
  const answerParts = parts.filter((p) => p.thought !== true);
  const text = (answerParts.length ? answerParts : parts)
    .map((p) => (typeof p.text === "string" ? p.text : ""))
    .join("")
    .trim();

  if (!text) {
    throw new GemmaError("The model returned an empty response.", {
      status: res.status,
      kind: "malformed",
      detail: bodyText.slice(0, 300),
    });
  }
  return text;
}

/** Lightweight, honest connectivity/authentication probe used by GET /api/health. */
export async function probe() {
  if (CONFIG.demoMode) {
    return { ok: true, mode: "demo", model: CONFIG.model, message: "DEMO_MODE enabled: sample data only, no model call is made." };
  }
  if (!CONFIG.apiKey) {
    return { ok: false, mode: "live", model: CONFIG.model, message: "No GEMINI_API_KEY configured. Copy .env.example to .env and add a key." };
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(
      `${CONFIG.baseUrl}/models/${CONFIG.model}?fields=name,supportedGenerationMethods`,
      { headers: { "x-goog-api-key": CONFIG.apiKey }, signal: controller.signal }
    );
    const text = await res.text();
    if (res.ok) {
      return { ok: true, mode: "live", model: CONFIG.model, message: `Reachable. Model "${CONFIG.model}" available to this key.` };
    }
    const mapped = classify(res.status, text, safeJson(text));
    return { ok: false, mode: "live", model: CONFIG.model, message: mapped.message, kind: mapped.kind };
  } catch (err) {
    return {
      ok: false,
      mode: "live",
      model: CONFIG.model,
      kind: err.name === "AbortError" ? "timeout" : "network",
      message:
        err.name === "AbortError"
          ? "Endpoint timed out during health probe."
          : `Could not reach the endpoint: ${err.message}`,
    };
  } finally {
    clearTimeout(timer);
  }
}

function safeJson(t) {
  try {
    return JSON.parse(t);
  } catch {
    return null;
  }
}
