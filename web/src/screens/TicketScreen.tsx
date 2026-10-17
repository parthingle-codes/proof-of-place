import { useState, type ReactNode } from "react";
import type { Ticket, QueueEntry } from "../types";
import { CATEGORIES } from "../types";
import { toMarkdown, copyText, downloadMarkdown, type ExportOptions } from "../lib/ticket";
import { addToQueue, getQueue, ApiError } from "../api";
import {
  IconAlert,
  IconCheck,
  IconClipboard,
  IconDoc,
  IconDownload,
  IconEye,
  IconFlag,
  IconInfo,
  IconList,
  IconPin,
  IconReset,
  IconSpark,
  IconUser,
} from "../components/icons";

/**
 * Investigated on 2026-10-17 as a POSSIBLE manual handoff channel.
 * Reachable (HTTP 200): "GCoE, Nagpur - Grievance Submission Form", general
 * grievance fields + one file attachment, submits via JS to handler.php.
 * NOT confirmed as the approved channel for facilities maintenance, and this
 * app never posts to it - the reporter opens it and pastes the ticket themselves.
 */
const GCOEN_FORM_URL = "https://gcoen.ac.in/gform/";

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

  const [queueId, setQueueId] = useState<number | null>(null);
  const [queueBusy, setQueueBusy] = useState(false);
  const [queueError, setQueueError] = useState<string | null>(null);
  const [queueEntries, setQueueEntries] = useState<QueueEntry[] | null>(null);

  const exportOpts: ExportOptions = { isSample, approved, queueId };

  const set = <K extends keyof Ticket>(k: K, v: Ticket[K]) => {
    setTicket({ ...ticket, [k]: v });
    setApproved(false);
  };

  const addDemoEntry = async () => {
    setQueueError(null);
    setQueueBusy(true);
    try {
      const res = await addToQueue(ticket);
      setQueueId(res.entry.queue_id);
      const list = await getQueue();
      setQueueEntries(list.entries);
    } catch (e) {
      setQueueError((e as ApiError).message);
    } finally {
      setQueueBusy(false);
    }
  };

  const removeItem = (key: ListKey, i: number) =>
    set(key, (ticket[key] as string[]).filter((_, idx) => idx !== i));

  const addDetail = () => {
    const v = newDetail.trim();
    if (!v) return;
    set("reported_by_user", [...ticket.reported_by_user, v]);
    setNewDetail("");
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

  const list = (key: ListKey, title: string, empty: string, ico: ReactNode) => (
    <section>
      <h4>
        {ico} {title}
      </h4>
      {ticket[key].length === 0 ? (
        <p className="empty">{empty}</p>
      ) : (
        <ul>
          {(ticket[key] as string[]).map((item, i) => (
            <li key={i}>
              {item}
              <button
                className="li-remove"
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
    const ok = await copyText(toMarkdown(ticket, exportOpts));
    setCopyState(ok ? "ok" : "fail");
    setTimeout(() => setCopyState("idle"), 4000);
  };

  return (
    <>
      <div className="card">
        <div className="card-head">
          <span className="card-icon amber">
            <IconCheck size={19} />
          </span>
          <div>
            <h2>Review and correct the ticket</h2>
            <p className="sub">
              You are in control. Edit anything, delete any AI statement you disagree with, then
              approve. Original wording is preserved for comparison.
            </p>
          </div>
        </div>

        {isSample && (
          <div className="notice sample">
            <span className="n-ico">
              <IconInfo size={17} />
            </span>
            <span>
              <strong>Sample data.</strong> The analysis behind this ticket was produced locally
              for demonstration and is <strong>not</strong> output from Gemma 4.
            </span>
          </div>
        )}

        <div className="notice">
          <span className="n-ico">
            <IconSpark size={16} />
          </span>
          <span>
            <strong>Generated with {ticket.provenance.model}</strong> at{" "}
            {new Date(ticket.generated_at).toLocaleString()}. AI fields are suggestions until you
            approve them.
          </span>
        </div>

        {editable("issue_title", "Issue title")}
        <div className="row">
          <div className="field">
            <label htmlFor="f-category">Category</label>
            <select
              id="f-category"
              value={ticket.category}
              onChange={(e) => set("category", e.target.value)}
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

      <div className="divider-label">Ticket preview</div>

      <div className="ticket">
        <div className="ticket-head">
          <div>
            <h3 className="t-title">{ticket.issue_title || "Untitled request"}</h3>
            <div className="t-sub">
              {ticket.category} · {ticket.location}
            </div>
          </div>
          <span className="ticket-status">
            {queueId ? `Demo queue entry #${queueId} · not received` : "Prepared · not received"}
          </span>
        </div>

        <div className="ticket-body">
          <dl className="grid">
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
              <strong>Prepared in Proof-of-Place</strong> - not received by college staff
              {queueId !== null && (
                <>
                  {" "}
                  · recorded as demo entry #{queueId} (demonstration queue only)
                </>
              )}
              .
            </dd>
          </dl>

          <section>
            <h4>
              <IconSpark size={13} /> Problem summary <span className="badge ai">AI-drafted</span>
            </h4>
            <p>{ticket.problem_summary}</p>
          </section>

          <section>
            <h4>
              <IconEye size={13} /> Visible evidence (from photo)
            </h4>
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
            <h4>
              <IconUser size={13} /> Reported by the user
            </h4>
            <ul>
              {ticket.reported_by_user.map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          </section>

          {ticket.follow_up_answers.length > 0 && (
            <section>
              <h4>
                <IconList size={13} /> Follow-up answers
              </h4>
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
              <h4>
                <IconAlert size={13} /> Open questions / missing information
              </h4>
              <ul>
                {[...ticket.open_questions, ...ticket.missing_information].map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </section>
          )}

          {list("hypotheses", "Possible causes (hypotheses - not confirmed)", "None recorded.", <IconInfo size={13} />)}
          {list("uncertainties", "Uncertainties", "None recorded.", <IconInfo size={13} />)}
          {list(
            "urgency_indicators",
            "Flagged for human review (not a safety verdict)",
            "Nothing flagged.",
            <IconFlag size={13} />
          )}
        </div>
      </div>

      {approved && (
        <div className="notice success" role="status">
          <span className="n-ico">
            <IconCheck size={17} />
          </span>
          <span>
            <strong>Ticket prepared and approved.</strong> Download it or copy it, then submit it
            through whatever channel your maintenance team actually uses.{" "}
            <strong>No system has been contacted</strong> - this application does not send
            tickets anywhere.
          </span>
        </div>
      )}

      {copyState === "ok" && (
        <div className="notice success" role="status">
          <span className="n-ico">
            <IconClipboard size={16} />
          </span>
          <span>Markdown ticket copied to your clipboard.</span>
        </div>
      )}
      {copyState === "fail" && (
        <div className="notice error" role="alert">
          <span className="n-ico">
            <IconAlert size={17} />
          </span>
          <span>Could not access the clipboard - use Download Markdown instead.</span>
        </div>
      )}

      <div className="divider-label">Hand off</div>

      <div className="card">
        <div className="card-head">
          <span className="card-icon amber">
            <IconPin size={19} />
          </span>
          <div>
            <h2>Campus Maintenance Desk</h2>
            <p className="sub">
              This ticket is <strong>prepared</strong> - not yet received by anyone. Choose how
              to hand it off yourself.
            </p>
          </div>
        </div>

        <div className="notice warn">
          <span className="n-ico">
            <IconAlert size={17} />
          </span>
          <span>
            <strong>Prepared ≠ received.</strong> Proof-of-Place holds no connection to any
            college system. Nothing here has reached maintenance staff unless you hand it over
            through a channel you have confirmed with your department.
          </span>
        </div>

        <div className="actions">
          <button className="btn" onClick={addDemoEntry} disabled={queueBusy || queueId !== null}>
            <span className="ico">
              <IconList size={16} />
            </span>
            {queueId
              ? `In demo queue (#${queueId})`
              : queueBusy
                ? "Adding…"
                : "Add to demo queue"}
          </button>
          <a
            className="btn"
            href={GCOEN_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: "none" }}
          >
            <span className="ico">
              <IconDownload size={15} />
            </span>
            Open GCOEN grievance form ↗
          </a>
        </div>

        <p className="hint" style={{ display: "block", marginTop: 10 }}>
          <strong>Demo queue</strong> = a local demonstration list for this showcase. It is{" "}
          <strong>not a college system</strong>, stores tickets in server memory until restart,
          and notifies nobody. The GCOEN link opens the official form in a new tab so{" "}
          <strong>you</strong> can submit manually.
        </p>

        {queueBusy && (
          <div className="loading">
            <span className="spinner" />
            Recording in the demonstration queue…
            <span className="bar" />
          </div>
        )}

        {queueError && (
          <div className="notice error" role="alert">
            <span className="n-ico">
              <IconAlert size={17} />
            </span>
            <span>
              <strong>Could not add to the demo queue:</strong> {queueError}
            </span>
          </div>
        )}

        {queueId !== null && (
          <div className="notice sample" role="status">
            <span className="n-ico">
              <IconInfo size={17} />
            </span>
            <span>
              <strong>Entry #{queueId} added to the demonstration queue.</strong> This is a
              local, in-memory demo list for the presentation - it is{" "}
              <strong>not a college system</strong>, persists only until the server restarts,
              and <strong>notifies no staff member</strong>.
            </span>
          </div>
        )}

        <div className="notice">
          <span className="n-ico">
            <IconInfo size={16} />
          </span>
          <span>
            <strong>Manual handoff (possible, unconfirmed):</strong> the link above opens
            GCOEN's public grievance form, inspected on 17 Oct 2026 - reachable, with name,
            branch, message (6000 chars) and one file attachment. It is a{" "}
            <em>general</em> grievance form: we could not verify it is the approved channel for
            facilities maintenance, so confirm with your department first. Proof-of-Place never
            posts to it - you paste the ticket yourself.
          </span>
        </div>

        {queueEntries && queueEntries.length > 0 && (
          <div className="block" style={{ marginTop: 14 }}>
            <h3>
              Demonstration queue (local, not a real system){" "}
              <span className="badge rule">demo</span>
            </h3>
            <ul>
              {queueEntries.map((e) => (
                <li key={e.queue_id}>
                  <strong>#{e.queue_id}</strong> · {e.issue_title} · {e.category} ·{" "}
                  <span className="hint">{e.location}</span>
                </li>
              ))}
            </ul>
            <span className="hint">
              Stored in server memory only - cleared on restart, never forwarded.
            </span>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-head">
          <span className="card-icon">
            <IconDoc size={19} />
          </span>
          <div>
            <h2>Export</h2>
            <p className="sub">Take the ticket into whatever system your team already uses.</p>
          </div>
        </div>

        <div className="actions">
          <button className="btn primary" onClick={() => setApproved(true)} disabled={approved}>
            <span className="ico">
              <IconCheck size={16} />
            </span>
            {approved ? "Approved ✓" : "Approve and prepare ticket"}
          </button>
          <button className="btn" onClick={doCopy}>
            <span className="ico">
              <IconClipboard size={16} />
            </span>
            Copy ticket
          </button>
          <button
            className="btn"
            onClick={() => downloadMarkdown(toMarkdown(ticket, exportOpts), ticket.issue_title)}
          >
            <span className="ico">
              <IconDownload size={16} />
            </span>
            Download Markdown
          </button>
          <button className="btn ghost" onClick={onRestart}>
            <span className="ico">
              <IconReset size={15} />
            </span>
            Start a new complaint
          </button>
        </div>

        <div className="divider-label">Markdown output</div>
        <textarea
          readOnly
          className="md-preview"
          value={toMarkdown(ticket, exportOpts)}
          onFocus={(e) => e.currentTarget.select()}
          aria-label="Markdown preview of the ticket"
        />
      </div>
    </>
  );
}
