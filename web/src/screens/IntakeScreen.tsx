import { useState } from "react";
import { makeTicket, ApiError } from "../api";
import type { Analysis, Answer, ComplaintInput, Ticket } from "../types";
import {
  IconAlert,
  IconArrowRight,
  IconEye,
  IconFlag,
  IconHelp,
  IconInfo,
  IconList,
  IconQuestion,
  IconSearch,
  IconSpark,
  IconUser,
} from "../components/icons";

interface Props {
  input: ComplaintInput;
  analysis: Analysis;
  answers: Answer[];
  setAnswers: (a: Answer[]) => void;
  isSample: boolean;
  onBack: () => void;
  onGenerated: (t: Ticket) => void;
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
    setAnswers(answers.map((a, idx) => (idx === i ? { ...a, answer: value } : a)));
  };

  const generate = async () => {
    setError(null);
    setBusy(true);
    try {
      const t = await makeTicket(analysis, input, answers);
      onGenerated(t);
    } catch (e) {
      setError((e as ApiError).message);
    } finally {
      setBusy(false);
    }
  };

  const answered = answers.filter((a) => a.answer.trim()).length;

  return (
    <>
      <div className="card">
        <div className="card-head">
          <span className="card-icon violet">
            <IconSpark size={19} />
          </span>
          <div>
            <h2>AI-assisted intake</h2>
            <p className="sub">
              {isSample
                ? "Sample analysis produced locally in DEMO_MODE (no model ran). Everything below is example data, not Gemma 4 output. "
                : "Gemma 4 read your complaint"}
              {!isSample && analysis.observed_facts.length ? " and photo" : ""}
              {!isSample && " and produced the following. "}
              Everything marked <span className="badge ai">AI</span> is a suggestion - correct it
              if it is wrong.
            </p>
          </div>
        </div>

        {isSample && (
          <div className="notice sample">
            <span className="n-ico">
              <IconInfo size={17} />
            </span>
            <span>
              <strong>Sample data.</strong> This analysis was generated locally for demonstration
              and is <strong>not</strong> output from Gemma 4.
            </span>
          </div>
        )}

        {analysis.urgency_indicators.length > 0 && (
          <div className="notice warn">
            <span className="n-ico">
              <IconAlert size={17} />
            </span>
            <span>
              <strong>Flagged for human review - not a verdict.</strong> Possible urgency signs
              were noticed. This assistant cannot assess safety: if there is exposed wiring,
              flooding, gas smell or immediate risk to people, use your institution's emergency
              reporting channel now and do not wait for this ticket.
            </span>
          </div>
        )}

        <div className="block">
          <h3>
            Suggested category <span className="badge ai">AI</span>
          </h3>
          <div className="tag-row">
            <span className="category-pill">{analysis.category}</span>
          </div>
          <span className="hint">
            Changeable later on the ticket - the maintenance team's taxonomy may differ.
          </span>
        </div>

        <div className="block">
          <h3>
            <span className="h-ico">
              <IconList size={14} />
            </span>
            Problem summary <span className="badge ai">AI</span>
          </h3>
          <p>{analysis.problem_summary}</p>
        </div>

        <div className="block">
          <h3>
            <span className="h-ico">
              <IconEye size={14} />
            </span>
            Observed from your photo <span className="badge ai">AI</span>
          </h3>
          {analysis.observed_facts.length ? (
            <ul>
              {analysis.observed_facts.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          ) : (
            <p className="empty">
              Nothing extracted - either no photo was supplied or nothing relevant was visible.
            </p>
          )}
        </div>

        <div className="block">
          <h3>
            <span className="h-ico">
              <IconUser size={14} />
            </span>
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
            <span className="h-ico">
              <IconSearch size={14} />
            </span>
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
              <span className="h-ico">
                <IconHelp size={14} />
              </span>
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
              <span className="h-ico">
                <IconInfo size={14} />
              </span>
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
        <div className="card-head">
          <span className="card-icon">
            <IconQuestion size={19} />
          </span>
          <div>
            <h2>Answer what matters</h2>
            <p className="sub">
              Only the most useful questions were asked ({answered} of {answers.length} answered).
              Skip anything you do not know.
            </p>
          </div>
        </div>

        {answers.length === 0 && (
          <div className="notice">
            <span className="n-ico">
              <IconInfo size={17} />
            </span>
            <span>The assistant did not need to ask anything further.</span>
          </div>
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
            <span className="n-ico">
              <IconAlert size={17} />
            </span>
            <span>
              <strong>Problem:</strong> {error}
            </span>
          </div>
        )}

        <div className="actions">
          <button className="btn primary" onClick={generate} disabled={busy}>
            <span className="ico">
              <IconArrowRight size={16} />
            </span>
            {busy ? "Preparing…" : "Generate maintenance ticket"}
          </button>
          <button className="btn ghost" onClick={onBack} disabled={busy}>
            Back to complaint
          </button>
        </div>

        {busy && (
          <div className="loading" aria-live="polite">
            <span className="spinner" />
            Combining your answers with the analysis…
            <span className="bar" />
          </div>
        )}

        <div className="divider-label">What happens next</div>
        <p className="hint" style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <IconFlag size={15} /> Your answers are merged deterministically with the analysis -
          no second model call, no invention.
        </p>
      </div>
    </>
  );
}
