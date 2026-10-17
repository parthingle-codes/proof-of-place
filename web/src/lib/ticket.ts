import type { Ticket } from "../types";

const bullet = (items: string[], empty = "_None recorded._") =>
  items.length ? items.map((i) => `- ${i}`).join("\n") : empty;

export function toMarkdown(t: Ticket): string {
  const lines: string[] = [];
  lines.push(`# ${t.issue_title || "Maintenance request"}`, "");
  lines.push(`**Category:** ${t.category}`);
  lines.push(`**Location:** ${t.location}`);
  lines.push(`**Prepared:** ${new Date(t.generated_at).toLocaleString()}`);
  lines.push(`**Status:** Prepared for submission - not sent to any system.`);
  lines.push("");

  lines.push("## Original report (as stated by the reporter)", "", `> ${t.original_description}`, "");
  if (t.context) lines.push("**Additional context provided:**", "", `> ${t.context}`, "");

  lines.push("## Problem summary (AI-generated, reviewed by the reporter)", "", t.problem_summary, "");

  lines.push("## Visible evidence (from photo, AI-observed)", "", bullet(t.observed_from_photo), "");
  lines.push(
    "## Reported by the user (user-provided facts)",
    "",
    bullet(t.reported_by_user),
    ""
  );

  if (t.follow_up_answers.length) {
    lines.push("## Follow-up answers", "");
    for (const a of t.follow_up_answers) lines.push(`- **Q:** ${a.question}  \n  **A:** ${a.answer}`);
    lines.push("");
  }

  if (t.open_questions.length || t.missing_information.length) {
    lines.push("## Open questions / missing information", "");
    for (const q of t.open_questions) lines.push(`- ${q}`);
    for (const m of t.missing_information) lines.push(`- ${m}`);
    lines.push("");
  }

  if (t.hypotheses.length) {
    lines.push("## Possible causes (hypotheses - NOT confirmed)", "", bullet(t.hypotheses), "");
  }
  if (t.uncertainties.length) {
    lines.push("## Uncertainties", "", bullet(t.uncertainties), "");
  }
  if (t.urgency_indicators.length) {
    lines.push("## Flagged for human review (urgency indicators - not a safety verdict)", "", bullet(t.urgency_indicators), "");
  }

  lines.push("## Suggested next action", "", t.suggested_next_action || "_Not specified._", "");
  lines.push("---", "");
  lines.push(
    `_Generated with ${t.provenance.model} and reviewed by the reporter. ${t.provenance.generated_note}_`
  );
  return lines.join("\n");
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

export function downloadMarkdown(text: string, title: string) {
  const slug =
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "maintenance-ticket";
  const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${slug}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
