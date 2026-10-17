import { useState } from "react";
import type { Ticket } from "../types";
import { CATEGORIES } from "../types";
import { toMarkdown, copyText, downloadMarkdown } from "../lib/ticket";

interface Props {
  ticket: Ticket;
  setTicket: (t: Ticket) => void;
  isSample: boolean;
  onRestart: () => void;
}

type ListKey =
  | "observed_from_photo"
  | "reported_by_user"
  | "missing_information"
  | "hypotheses"
  | "uncertainties"
  | "urgency_indicators";

export default function TicketScreen({ ticket, setTicket, isSample, onRestart }: Props) {
  const [approved, setApproved] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "ok" | "fail">("idle");
  const [newDetail, setNewDetail] = useState("");

  const set = <K extends keyof Ticket>(k: K, v: Ticket[K]) =>
    setTicket({ ...ticket, [k]: v });

  const removeItem = (key: ListKey, i: number) =>
    set(key, (ticket[key] as string[]).filter((_, idx) => idx !== i));

  const addDetail = () => {
    const v = newDetail.trim();
    if (!v) return;
    set("reported_by_user", [...ticket.reported_by_user, v]);
    setNewDetail("");
    setApproved(false);
  };

  const editable = <K extends keyof Ticket>(k: K, label: string, multiline = false) => (
    <div className="field">
      <label htmlFor={`f-${String(k)}`}>{label}</label>
      {multiline ? (
        <textarea
          id={`f-${String(k)}`}
          value={String(ticket[k])}
          onChange={(e) => set(k, e.target.value as Ticket[K])}
        />
      ) : (
        <input
          id={`f-${String(k)}`}
          type="text"
          value={String(ticket[k])}
          onChange={(e) => set(k, e.target.value as Ticket[K])}
        />
      )}
    </div>
  );

  const list = (key: ListKey, title: string, empty: string) => (
    <section>
      <h4>{title}</h4>
      {ticket[key].length === 0 ? (
        <p className="empty">{empty}</p>
      ) : (
        <ul>
          {(ticket[key] as string[]).map((item, i) => (
            <li key={i}>
              {item}{" "}
              <button
                className="btn small"
                style={{ padding: "2px 8px", fontSize: "0.72rem" }}
                onClick={() => removeItem(key, i)}
                title="Remove this statement"
                aria-label={`Remove: ${item}`}
              >
                remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );

  const doCopy = async () => {
    const ok = await copyText(toMarkdown(ticket));
    setCopyState(ok ? "ok" : "fail");
    setTimeout(() => setCopyState("idle"), 4000);
  };

  return (
    <>
      <div className="card">
        <h2>Review and correct the ticket</h2>
        <p className="sub">
          You are in control. Edit anything, delete any AI statement you disagree with, then
          approve. Original wording is preserved for comparison.
        </p>

        {isSample && (
          <div className="notice sample">
            <strong>Sample data.</strong> The analysis behind this ticket was produced locally for
            demonstration and is <strong>not</strong> output from Gemma 4.
          </div>
        )}

        <div className="notice">
          <strong>Generated with {ticket.provenance.model}</strong> at{" "}
          {new Date(ticket.generated_at).toLocaleString()}. AI fields are suggestions until you
          approve them.
        </div>

        {editable("issue_title", "Issue title")}
        <div className="row">
          <div className="field">
            <label htmlFor="f-category">Category</label>
            <select
              id="f-category"
              value={ticket.category}
              onChange={(e) => {
                set("category", e.target.value);
                setApproved(false);
              }}
            >
              {[...new Set([...CATEGORIES, ticket.category])].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          {editable("location", "Location")}
        </div>
        {editable("problem_summary", "Problem summary", true)}
        {editable("suggested_next_action", "Suggested next action", true)}

        <div className="field">
          <label htmlFor="f-add">Add missing information</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              id="f-add"
              type="text"
              placeholder="e.g. Leak is continuous; reported by caretaker"
              value={newDetail}
              onChange={(e) => setNewDetail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addDetail()}
            />
            <button className="btn small" onClick={addDetail}>
              Add
            </button>
          </div>
        </div>
      </div>

      <div className="ticket">
        <div className="grid">
          <dt>Title</dt>
          <dd>{ticket.issue_title || <span className="empty">untitled</span>}</dd>
          <dt>Category</dt>
          <dd>{ticket.category}</dd>
          <dt>Location</dt>
          <dd>{ticket.location}</dd>
          <dt>Original report</dt>
          <dd>
            <em>"{ticket.original_description}"</em>
          </dd>
          {ticket.context && (
            <>
              <dt>Extra context</dt>
              <dd>{ticket.context}</dd>
            </>
          )}
          <dt>Status</dt>
          <dd>
            <strong>Prepared for submission</strong> - not sent to any system.
          </dd>
        </div>

        <section>
          <h4>Problem summary (AI-drafted, reviewed by you)</h4>
          <p>{ticket.problem_summary}</p>
        </section>

        <section>
          <h4>Visible evidence (from photo, AI-observed)</h4>
          {ticket.observed_from_photo.length ? (
            <ul>
              {ticket.observed_from_photo.map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          ) : (
            <p className="empty">No photo evidence recorded.</p>
          )}
        </section>

        <section>
          <h4>Reported by the user</h4>
          <ul>
            {ticket.reported_by_user.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        </section>

        {ticket.follow_up_answers.length > 0 && (
          <section>
            <h4>Follow-up answers</h4>
            <ul>
              {ticket.follow_up_answers.map((a, i) => (
                <li key={i}>
                  <strong>{a.question}</strong> - {a.answer}
                </li>
              ))}
            </ul>
          </section>
        )}

        {(ticket.open_questions.length > 0 || ticket.missing_information.length > 0) && (
          <section>
            <h4>Open questions / missing information</h4>
            <ul>
              {[...ticket.open_questions, ...ticket.missing_information].map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ul>
          </section>
        )}

        {list("hypotheses", "Possible causes (hypotheses - not confirmed)", "None recorded.")}
        {list("uncertainties", "Uncertainties", "None recorded.")}
        {list(
          "urgency_indicators",
          "Flagged for human review (not a safety verdict)",
          "Nothing flagged."
        )}
      </div>

      {approved && (
        <div className="notice" role="status" style={{ borderColor: "#bfe0d1", background: "#eef8f3" }}>
          <strong>Ticket prepared and approved.</strong> Download it or copy it, then submit it
          through whatever channel your maintenance team actually uses.{" "}
          <strong>No system has been contacted</strong> - this application does not send tickets
          anywhere.
        </div>
      )}

      {copyState === "ok" && (
        <div className="notice" role="status">
          Markdown ticket copied to your clipboard.
        </div>
      )}
      {copyState === "fail" && (
        <div className="notice error" role="alert">
          Could not access the clipboard - use Download Markdown instead.
        </div>
      )}

      <div className="card">
        <div className="actions">
          <button
            className="btn primary"
            onClick={() => setApproved(true)}
            disabled={approved}
          >
            {approved ? "Approved ✓" : "Approve and prepare ticket"}
          </button>
          <button className="btn" onClick={doCopy}>
            Copy ticket
          </button>
          <button
            className="btn"
            onClick={() => downloadMarkdown(toMarkdown(ticket), ticket.issue_title)}
          >
            Download Markdown
          </button>
          <button className="btn" onClick={onRestart}>
            Start a new complaint
          </button>
        </div>
        <p className="hint" style={{ marginTop: 12 }}>
          Markdown preview:
        </p>
        <textarea
          readOnly
          style={{ minHeight: 160, fontFamily: "ui-monospace, Consolas, monospace", fontSize: "0.82rem" }}
          value={toMarkdown(ticket)}
          onFocus={(e) => e.currentTarget.select()}
          aria-label="Markdown preview of the ticket"
        />
      </div>
    </>
  );
}
