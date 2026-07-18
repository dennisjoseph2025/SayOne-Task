import { useState } from "react";
import api from "../api";
import "./Recommendations.css";

export default function Recommendations() {
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRecommendation = async () => {
    setLoading(true);
    setError(null);
    setRecommendation(null);
    try {
      const res = await api.post("/sleep-entries/recommend/");
      setRecommendation(res.data.recommendation);
    } catch (err) {
      const msg = err.response?.data?.detail;
      setError(msg || "Failed to get recommendation. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page recommendations">
      <h1>AI Recommendations</h1>
      <p className="subtitle">
        Get a personalized sleep recommendation based on your recent data.
      </p>
      <button onClick={fetchRecommendation} disabled={loading}>
        {loading ? "Analyzing..." : "Get Recommendation"}
      </button>
      {error && <div className="alert">{error}</div>}
      {recommendation && (
        <div className="rec-card">
          <h3>Recommendation</h3>
          <p>{recommendation}</p>
        </div>
      )}
    </div>
  );
}
