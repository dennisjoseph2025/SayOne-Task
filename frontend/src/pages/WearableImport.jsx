import { useState } from "react";
import { Upload, FileCheck, Loader2 } from "lucide-react";
import api from "../api";
import { useToast } from "../ToastContext";

export default function WearableImport() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const toast = useToast();

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post("/wearable-import/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(res.data);
      toast(`Imported ${res.data.entries_imported || 0} entries`, "success");
    } catch (err) {
      toast(err.response?.data?.detail || "Import failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadMockData = async () => {
    setLoading(true);
    try {
      const res = await api.post("/wearable-import/mock-data/");
      setResult(res.data);
      toast(`Generated ${res.data.entries_imported || 0} mock entries`, "success");
    } catch (err) {
      toast(err.response?.data?.detail || "Failed to load mock data", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page import-page">
      <h1>Import Sleep Data</h1>

      <div className="import-actions animate-in">
        <div className="import-card">
          <h3>Upload File</h3>
          <p>Import CSV or JSON sleep data from your wearable device</p>
          <label className="upload-btn">
            <input type="file" accept=".csv,.json" onChange={handleUpload} hidden disabled={loading} />
            {loading ? <Loader2 size={16} className="spin" /> : <Upload size={16} />}
            Choose File
          </label>
        </div>

        <div className="import-card">
          <h3>Load Sample Data</h3>
          <p>Try the app with 30 days of realistic mock sleep data</p>
          <button className="mock-btn" onClick={loadMockData} disabled={loading}>
            {loading ? <Loader2 size={16} className="spin" /> : <FileCheck size={16} />}
            Load Mock Data
          </button>
        </div>
      </div>

      {result && (
        <div className="import-result animate-in">
          <h3>Import Complete</h3>
          <p>Entries imported: <strong>{result.entries_imported ?? 0}</strong></p>
        </div>
      )}
    </div>
  );
}
