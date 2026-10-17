import { useState } from "react";
import { makeTicket, ApiError } from "../api";
import type { Analysis, Answer, ComplaintInput } from "../types";

interface Props {
  input: ComplaintInput;
  analysis: Analysis;
  answers: Answer[];
  setAnswers: (a: Answer[]) => void;
  isSample: boolean;
  onBack: () => void;
  onGenerated: (t: import("../types").Ticket) => void;
}

export default function IntakeScreen({
  input,
  analysis,
  answers,
  setAnswers,
  isSample,
  onBack,
  onGenerated,
}: Props) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const setAnswer = (i: number, value: string) => {
    const next = answers.map((a, idx) => (idx === i ? { ...a, answer: value } : a));
    setAnswers(next);
  };

  const generate = async () => {
    setError(null);
    setBusy(true);
    try {
      const t = await makeTicket(analysis, input, answers);
      onGenerated(t);
    } catch (e) {
      const err = e as ApiError;
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const answered = answers.filter((a) => a.answer.trim()).length;

  return (
    <>
      <div className="card">
        <h2>AI-assisted intake</h2>
        <p className="sub">
          Gemma 4 read your complaint{input && analysis.observed_facts.length ? " and photo" : ""}
          {" "}and produced the following. Everything marked <span className="badge ai">AI</span> is
          a suggestion - correct it if it is wrong.
        </p>

        {isSample && (
          <div className="notice sample">
            <strong>Sample data.</strong> This analysis was generated locally for demonstration
            and is <strong>not</strong> output from Gemma 4.
          </div>
        )}

        {analysis.urgency_indicators.length > 0 && (
          <div className="notice warn">
            <strong>Flagged for human review - not a verdict.</strong> Possible urgency signs were
            noticed. This assistant cannot assess safety: if there is exposed wiring, flooding, gas
            smell or immediate risk to people, use your institution's emergency reporting channel
            now and do not wait for this ticket.
          </div>
        )}

        <div className="block">
          <h3>
            Suggested category <span className="badge ai">AI</span>
          </h3>
          <div className="tag-row">
            <strong style={{ fontSize: "1.05rem" }}>{analysis.category}</strong>
          </div>
          <span className="hint">Changeable later on the ticket - the maintenance team's taxonomy may differ.</span>
        </div>

        <div className="block">
          <h3>
            Problem summary <span className="badge ai">AI</span>
          </h3>
          <p>{analysis.problem_summary}</p>
        </div>

        <div className="block">
          <h3>
            Observed from your photo <span className="badge ai">AI</span>
          </h3>
          {analysis.observed_facts.length ? (
            <ul>
              {analysis.observed_facts.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          ) : (
            <p className="empty">Nothing extracted - either no photo was supplied or nothing relevant was visible.</p>
          )}
        </div>

        <div className="block">
          <h3>
            What you reported <span className="badge user">User</span>
          </h3>
          <ul>
            {analysis.user_reported_details.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </div>

        <div className="block">
          <h3>
            Missing information <span className="badge ai">AI</span>
          </h3>
          {analysis.missing_information.length ? (
            <ul>
              {analysis.missing_information.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          ) : (
            <p className="empty">No important gaps were detected.</p>
          )}
        </div>

        {analysis.hypotheses.length > 0 && (
          <div className="block">
            <h3>
              Possible causes - hypotheses, not facts <span className="badge ai">AI</span>
            </h3>
            <ul>
              {analysis.hypotheses.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          </div>
        )}

        {analysis.uncertainties.length > 0 && (
          <div className="block">
            <h3>
              Uncertainties <span className="badge ai">AI</span>
            </h3>
            <ul>
              {analysis.uncertainties.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="card">
        <h2>Answer what matters</h2>
        <p className="sub">
          Only the most useful questions were asked ({answered} of {answers.length} answered).
          Skip anything you do not know.
        </p>

        {answers.length === 0 && (
          <div className="notice">The assistant did not need to ask anything further.</div>
        )}

        {answers.map((a, i) => (
          <div className="qa" key={i}>
            <div className="q">
              <span className="qnum">Q{i + 1}</span>
              <span>{a.question}</span>
            </div>
            <input
              type="text"
              placeholder="Your answer (leave blank to skip)"
              value={a.answer}
              onChange={(e) => setAnswer(i, e.target.value)}
              aria-label={`Answer to: ${a.question}`}
            />
          </div>
        ))}

        {error && (
          <div className="notice error" role="alert">
            <strong>Problem:</strong> {error}
          </div>
        )}

        <div className="actions">
          <button className="btn primary" onClick={generate} disabled={busy}>
            {busy ? "Preparing…" : "Generate maintenance ticket"}
          </button>
          <button className="btn" onClick={onBack} disabled={busy}>
            Back to complaint
          </button>
        </div>

        {busy && (
          <div className="loading">
            <span className="spinner" />
            Combining your answers with the analysis…
          </div>
        )}
      </div>
    </>
  );
}
