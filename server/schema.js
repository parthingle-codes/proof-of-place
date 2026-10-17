/**
 * Response validation + the deterministic ticket composer.
 *
 * The model output is NEVER trusted: every field is coerced, length-capped and
 * dropped if unusable. The final ticket is composed from the validated analysis
 * plus the user's original inputs and follow-up answers - no second model call.
 */

import { CATEGORIES } from "./prompts.js";

const MAX_STR = 600;
const MAX_ARR = 8;

const str = (v) => {
  if (typeof v !== "string") return "";
  const s = v.replace(/\s+/g, " ").trim();
  return s.length > MAX_STR ? s.slice(0, MAX_STR - 1) + "…" : s;
};

const arr = (v) => {
  if (!Array.isArray(v)) {
    if (typeof v === "string" && v.trim()) return [str(v)];
    return [];
  }
  const out = [];
  for (const item of v) {
    const s = str(item);
    if (s && !out.includes(s)) out.push(s);
    if (out.length >= MAX_ARR) break;
  }
  return out;
};

/** Pull the first parseable JSON object out of a model response. */
export function extractJson(text) {
  if (typeof text !== "string" || !text.trim()) {
    throw new Error("The model returned an empty response.");
  }
  let t = text.trim();
  // strip ``` fences
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  try {
    return JSON.parse(t);
  } catch {
    /* fall through to brace extraction */
  }
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start !== -1 && end > start) {
    try {
      return JSON.parse(t.slice(start, end + 1));
    } catch (err) {
      throw new Error(
        `The model response was not valid JSON and could not be repaired: ${err.message}`
      );
    }
  }
  throw new Error("The model did not return a JSON object.");
}

/** Coerce unknown model output into a well-formed AnalysisResult. */
export function normalizeAnalysis(raw, input = {}) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("Analysis payload was not an object.");
  }

  let category = str(raw.category);
  const match = CATEGORIES.find(
    (c) => c.toLowerCase() === category.toLowerCase()
  );
  if (match) category = match;
  else if (input.category && CATEGORIES.includes(input.category))
    category = input.category;
  else category = "Other or uncertain";

  const questions = arr(raw.suggested_follow_up_questions).slice(0, 3);

  const analysis = {
    category,
    issue_title: str(raw.issue_title) || deriveTitle(input.description),
    problem_summary: str(raw.problem_summary) || str(input.description),
    observed_facts: arr(raw.observed_facts),
    user_reported_details: arr(raw.user_reported_details),
    suggested_follow_up_questions: questions,
    missing_information: arr(raw.missing_information),
    hypotheses: arr(raw.hypotheses),
    suggested_next_action: str(raw.suggested_next_action),
    urgency_indicators: arr(raw.urgency_indicators),
    uncertainties: arr(raw.uncertainties),
  };

  if (!analysis.user_reported_details.length && input.description) {
    analysis.user_reported_details = [str(input.description)].filter(Boolean);
  }
  if (!analysis.suggested_follow_up_questions.length) {
    analysis.suggested_follow_up_questions = deriveQuestions(input);
    analysis.missing_information = mergeMissing(
      analysis.missing_information,
      deriveQuestions(input)
    );
  }
  if (!analysis.missing_information.length && input.location) {
    analysis.missing_information = [];
  }
  return analysis;
}

function deriveTitle(description) {
  const d = str(description);
  if (!d) return "Maintenance request";
  const cut = d.length > 80 ? d.slice(0, 80).replace(/\s+\S*$/, "") + "…" : d;
  return cut.charAt(0).toUpperCase() + cut.slice(1);
}

function mergeMissing(existing, questions) {
  const out = [...existing];
  for (const q of questions) {
    const label = q.replace(/\?$/, "").replace(/^(is|are|does|do|has|have|can|which|where|when|what|why|how)\s+/i, "");
    const short = label.length > 60 ? label.slice(0, 60) + "…" : label;
    if (short && !out.includes(short)) out.push(short);
  }
  return out.slice(0, MAX_ARR);
}

/** Last-resort rule-based questions when the model gives none. Rule, not AI. */
function deriveQuestions(input) {
  const q = [];
  if (!input.location || !input.location.trim())
    q.push("Where exactly is it - building and room number?");
  const d = (input.description || "").toLowerCase();
  if (/(leak|drip|tap|water|pipe)/.test(d))
    q.push("Is it leaking continuously, or only when the tap is used?");
  if (d && !/\d{1,4}/.test(d) && /(room|class|lab|block)/.test(d))
    q.push("What is the room or block number?");
  if (!q.length) q.push("Since when has this been happening?");
  return q.slice(0, 3);
}

/**
 * Deterministic ticket builder. Pure function of validated analysis + user input.
 */
export function composeTicket({ analysis, input, answers = [] }) {
  const answerList = answers
    .map((a) => ({
      question: str(a.question),
      answer: str(a.answer),
      answered: !!str(a.answer),
    }))
    .filter((a) => a.question);

  const provided = answerList.filter((a) => a.answered);
  const unanswered = answerList.filter((a) => !a.answered);

  const location = str(input.location);

  return {
    issue_title: analysis.issue_title,
    category: analysis.category,
    original_description: str(input.description),
    problem_summary: analysis.problem_summary,
    location: location || "Not provided - confirm before dispatch",
    context: str(input.context),
    observed_from_photo: analysis.observed_facts,
    reported_by_user: analysis.user_reported_details,
    follow_up_answers: provided,
    open_questions: unanswered.map((a) => a.question),
    missing_information: analysis.missing_information,
    hypotheses: analysis.hypotheses,
    suggested_next_action: analysis.suggested_next_action,
    urgency_indicators: analysis.urgency_indicators,
    uncertainties: analysis.uncertainties,
    provenance: {
      model: "Gemma 4",
      generated_note:
        "AI-generated fields are suggestions. The reporter reviewed and edited this ticket before export.",
      submitted: false,
    },
    generated_at: new Date().toISOString(),
  };
}
