import { useEffect, useState } from "react";
import { getHealth, ApiError } from "./api";
import type { Analysis, Answer, ComplaintInput, Health, Ticket } from "./types";
import ReportScreen from "./screens/ReportScreen";
import IntakeScreen from "./screens/IntakeScreen";
import TicketScreen from "./screens/TicketScreen";
import ErrorBoundary from "./components/ErrorBoundary";
import { IconAlert, IconInfo, IconWrench } from "./components/icons";

type Step = "report" | "intake" | "ticket";

const EMPTY_INPUT: ComplaintInput = {
  description: "",
  location: "",
  category: "",
  context: "",
};

const STEP_LABELS: Record<Step, { n: number; label: string }> = {
  report: { n: 1, label: "Report the issue" },
  intake: { n: 2, label: "AI-assisted intake" },
  ticket: { n: 3, label: "Review the ticket" },
};

export default function App() {
  const [step, setStep] = useState<Step>("report");
  const [health, setHealth] = useState<Health | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);

  const [input, setInput] = useState<ComplaintInput>(EMPTY_INPUT);
  const [image, setImage] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [isSample, setIsSample] = useState(false);

  useEffect(() => {
    getHealth()
      .then(setHealth)
      .catch((e: ApiError) => setHealthError(e.message));
  }, []);

  const reset = () => {
    setStep("report");
    setInput(EMPTY_INPUT);
    setImage(null);
    setAnalysis(null);
    setAnswers([]);
    setTicket(null);
    setIsSample(false);
  };

  const status = healthError
    ? { cls: "", text: "API unreachable" }
    : !health
      ? { cls: "", text: "Checking model…" }
      : health.mode === "demo"
        ? { cls: "demo", text: `Sample mode · no model call` }
        : health.ok
          ? { cls: "ok", text: `Gemma 4 connected · ${health.model}` }
          : { cls: "bad", text: "Model not connected" };

  const order: Step[] = ["report", "intake", "ticket"];

  return (
    <div className="app">
      <header className="topbar">
        <div className="lockup">
          <div className="mark">
            <IconWrench size={22} />
          </div>
          <div>
            <h1 className="brand">
              Proof<em>-of-</em>Place
            </h1>
            <p className="tagline">From vague complaints to maintenance-ready tickets.</p>
          </div>
        </div>
        <div className="status" title={health?.message || healthError || ""}>
          <span className={`dot ${status.cls}`} />
          {status.text}
        </div>
      </header>

      <ol className="steps">
        {order.map((s) => (
          <li
            key={s}
            className={
              step === s ? "active" : order.indexOf(s) < order.indexOf(step) ? "done" : ""
            }
          >
            <span className="step-num">{STEP_LABELS[s].n}</span>
            {STEP_LABELS[s].label}
          </li>
        ))}
      </ol>

      {health && !health.ok && health.mode === "live" && (
        <div className="notice warn">
          <span className="n-ico">
            <IconAlert size={17} />
          </span>
          <span>
            <strong>Model integration not verified.</strong> {health.message}
            {" "}The rest of the workflow is usable; analysis calls will fail until this is fixed.
          </span>
        </div>
      )}
      {health?.mode === "demo" && (
        <div className="notice sample">
          <span className="n-ico">
            <IconInfo size={17} />
          </span>
          <span>
            <strong>DEMO_MODE is on.</strong> {health.message} Every analysis below is visibly
            marked as sample data and is <em>not</em> output from Gemma 4.
          </span>
        </div>
      )}
      {healthError && (
        <div className="notice error">
          <span className="n-ico">
            <IconAlert size={17} />
          </span>
          <span>
            <strong>Cannot reach the API server.</strong> {healthError} Start it with{" "}
            <code>npm run dev</code>.
          </span>
        </div>
      )}

      <ErrorBoundary key={step}>
      {step === "report" && (
        <ReportScreen
          input={input}
          setInput={setInput}
          image={image}
          setImage={setImage}
          health={health}
          onAnalyzed={(a, sample) => {
            setAnalysis(a);
            setAnswers(
              a.suggested_follow_up_questions.map((question) => ({ question, answer: "" }))
            );
            setIsSample(sample);
            setStep("intake");
          }}
        />
      )}

      {step === "intake" && analysis && (
        <IntakeScreen
          input={input}
          analysis={analysis}
          answers={answers}
          setAnswers={setAnswers}
          isSample={isSample}
          onBack={() => setStep("report")}
          onGenerated={(t) => {
            setTicket(t);
            setStep("ticket");
          }}
        />
      )}

      {step === "ticket" && ticket && (
        <TicketScreen
          ticket={ticket}
          setTicket={setTicket}
          isSample={isSample}
          onRestart={reset}
        />
      )}
      </ErrorBoundary>

      <footer className="foot">
        <p>
          <strong>Privacy:</strong>{" "}
          {health?.privacy ??
            "Descriptions and photos are sent to the configured model provider for analysis and are not stored by this application."}
        </p>
        <p>
          Do not include passwords, access tokens, faces or unnecessary personal information in
          descriptions or photos. Urgent hazards (exposed wiring, flooding, gas) must be reported
          through your institution's emergency channel first - do not wait for this form.
        </p>
        <p>
          This assistant suggests; people decide. Nothing here is submitted to any maintenance
          system unless you export it yourself.
        </p>
      </footer>
    </div>
  );
}
