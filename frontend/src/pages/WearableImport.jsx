import { useRef, useState } from "react";
import api from "../api";

export default function WearableImport() {
  const fileRef = useRef(null);
  const [importing, setImporting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [days, setDays] = useState(14);

  const handleFileImport = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setImporting(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post("/sleep-entries/import_wearable/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult({ type: "import", ...res.data });
    } catch (err) {
      setResult({ type: "error", detail: err.response?.data?.detail || "Import failed." });
    } finally {
      setImporting(false);
    }
  };

  const handleMockGenerate = async () => {
    setGenerating(true);
    setResult(null);
    try {
      const res = await api.post("/sleep-entries/mock_generate/", { days });
      setResult({ type: "mock", ...res.data });
    } catch (err) {
      setResult({ type: "error", detail: err.response?.data?.detail || "Generation failed." });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="page">
      <h1>Wearable Data Import</h1>

      <section style={{ marginBottom: "2rem" }}>
        <h2>Upload File</h2>
        <p style={{ color: "var(--text)", fontSize: "0.9rem", marginBottom: "0.75rem" }}>
          Import sleep data from a wearable device. Accepts CSV or JSON files with fields:
          <code> date, bed_time, wake_time, quality, caffeine, exercise, screen_time_before_bed, notes</code>
        </p>
        <div className="form">
          <input type="file" ref={fileRef} accept=".csv,.json" />
          <button type="button" onClick={handleFileImport} disabled={importing}>
            {importing ? "Importing..." : "Import File"}
          </button>
        </div>
      </section>

      <section>
        <h2>Generate Mock Data</h2>
        <p style={{ color: "var(--text)", fontSize: "0.9rem", marginBottom: "0.75rem" }}>
          Generate realistic mock wearable sleep data for demo purposes.
        </p>
        <div className="form" style={{ maxWidth: 320 }}>
          <label>
            Number of days
            <input type="number" min="1" max="90" value={days} onChange={(e) => setDays(Number(e.target.value))} />
          </label>
          <button type="button" onClick={handleMockGenerate} disabled={generating}>
            {generating ? "Generating..." : "Generate Mock Data"}
          </button>
        </div>
      </section>

      {result && (
        <div className={`alert ${result.type === "error" ? "" : "alert-success"}`} style={{ marginTop: "1rem" }}>
          {result.type === "error" && result.detail}
          {result.type === "import" && (
            <span>Imported {result.imported} entries, skipped {result.skipped}{result.errors?.length > 0 ? ` (${result.errors.length} errors)` : ""}</span>
          )}
          {result.type === "mock" && (
            <span>Generated {result.created} entries over {result.total_days} days.</span>
          )}
        </div>
      )}
    </div>
  );
}
