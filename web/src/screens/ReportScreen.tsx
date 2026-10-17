import { useRef, useState } from "react";
import { analyze, ApiError } from "../api";
import { CATEGORIES, type Analysis, type ComplaintInput, type Health } from "../types";

interface Props {
  input: ComplaintInput;
  setInput: (v: ComplaintInput) => void;
  image: File | null;
  setImage: (f: File | null) => void;
  health: Health | null;
  onAnalyzed: (a: Analysis, sample: boolean) => void;
}

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 6 * 1024 * 1024;

const SAMPLE: ComplaintInput = {
  description: "The tap outside Room 204 keeps leaking.",
  location: "Block C, second floor, outside Room 204",
  category: "Plumbing",
  context: "It drips onto the floor and the floor gets slippery.",
};

/** Downscale client-side to keep payloads small. */
async function shrink(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const max = 1024;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  if (scale === 1) return file;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.85));
  if (!blob) return file;
  return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
}

export default function ReportScreen({
  input,
  setInput,
  image,
  setImage,
  health,
  onAnalyzed,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const set = (k: keyof ComplaintInput, v: string) =>
    setInput({ ...input, [k]: v });

  const pickFile = async (file: File | undefined | null) => {
    setError(null);
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) {
      setError("Unsupported file type. Please use a JPEG, PNG or WebP image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(`Image is ${(file.size / 1024 / 1024).toFixed(1)} MB - the limit is 6 MB.`);
      return;
    }
    try {
      const small = await shrink(file);
      setImage(small);
      setPreview(URL.createObjectURL(small));
    } catch {
      setError("That file could not be read as an image.");
    }
  };

  const submit = async () => {
    setError(null);
    if (!input.description.trim()) {
      setError("Please describe the problem first - even one sentence is enough.");
      return;
    }
    setBusy(true);
    try {
      const res = await analyze(input, image);
      onAnalyzed(res.analysis, res.sample);
    } catch (e) {
      const err = e as ApiError;
      setError(err.message + (err.detail ? ` (${err.detail.slice(0, 200)})` : ""));
    } finally {
      setBusy(false);
    }
  };

  const loadSample = () => {
    setInput(SAMPLE);
    setError(null);
  };

  const blocked = health?.mode === "live" && !health.ok;

  return (
    <div className="card">
      <h2>Report an issue</h2>
      <p className="sub">
        Give whatever you know. Nothing here is mandatory except the description - the assistant
        will ask for anything important that is missing.
      </p>

      <div className="field">
        <label htmlFor="photo">Photo <span className="hint">(optional)</span></label>
        {!image ? (
          <div
            className="drop"
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              pickFile(e.dataTransfer.files?.[0]);
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && fileRef.current?.click()}
          >
            Click to choose, or drop an image here.
            <div className="hint">JPEG, PNG or WebP - up to 6 MB. Downscaled in your browser.</div>
          </div>
        ) : (
          <div className="preview">
            {preview && <img src={preview} alt="Uploaded evidence preview" />}
            <div className="meta">
              <strong>{image.name}</strong>
              <div>{(image.size / 1024).toFixed(0)} KB · {image.type}</div>
              <button
                className="btn small"
                onClick={() => {
                  setImage(null);
                  setPreview(null);
                  if (fileRef.current) fileRef.current.value = "";
                }}
              >
                Remove photo
              </button>
            </div>
          </div>
        )}
        <input
          ref={fileRef}
          id="photo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display: "none" }}
          onChange={(e) => pickFile(e.target.files?.[0])}
        />
      </div>

      <div className="field">
        <label htmlFor="desc">
          What is wrong? <span className="hint">(required - ordinary words are fine)</span>
        </label>
        <textarea
          id="desc"
          placeholder="e.g. The tap outside Room 204 keeps leaking."
          value={input.description}
          onChange={(e) => set("description", e.target.value)}
          maxLength={2000}
        />
      </div>

      <div className="row">
        <div className="field">
          <label htmlFor="loc">
            Where? <span className="hint">(optional - building, room or landmark)</span>
          </label>
          <input
            id="loc"
            type="text"
            placeholder="e.g. Block C, second floor, outside Room 204"
            value={input.location}
            onChange={(e) => set("location", e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="cat">
            Category <span className="hint">(optional - AI can suggest one)</span>
          </label>
          <select id="cat" value={input.category} onChange={(e) => set("category", e.target.value)}>
            <option value="">Let the assistant decide</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="field">
        <label htmlFor="ctx">
          Anything else? <span className="hint">(optional context)</span>
        </label>
        <textarea
          id="ctx"
          placeholder="e.g. It drips onto the floor and the floor gets slippery."
          value={input.context}
          onChange={(e) => set("context", e.target.value)}
          maxLength={1000}
        />
      </div>

      {error && (
        <div className="notice error" role="alert">
          <strong>Problem:</strong> {error}
        </div>
      )}

      <div className="actions">
        <button className="btn primary" onClick={submit} disabled={busy}>
          {busy ? "Analysing…" : "Analyze complaint"}
        </button>
        <button className="btn" onClick={loadSample} disabled={busy}>
          Load sample complaint
        </button>
      </div>

      {busy && (
        <div className="loading">
          <span className="spinner" />
          Sending the complaint{image ? " and photo" : ""} to Gemma 4 for analysis…
        </div>
      )}

      {blocked && (
        <div className="notice warn" style={{ marginTop: 14 }}>
          Heads up: the model is currently not reachable (see the banner above), so{" "}
          <strong>Analyze complaint</strong> will return an error instead of an analysis.
        </div>
      )}
    </div>
  );
}
