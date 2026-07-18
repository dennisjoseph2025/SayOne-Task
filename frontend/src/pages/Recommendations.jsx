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
      <div className="rec-hero">
        <div className="rec-hero-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a7 7 0 0 1 7 7c0 2.5-1.5 4.5-3 6H8c-1.5-1.5-3-3.5-3-6a7 7 0 0 1 7-7z"/>
            <path d="M9 14h6"/>
            <path d="M9 18h6"/>
            <path d="M10 22h4"/>
          </svg>
        </div>
        <h1>AI Sleep Advisor</h1>
        <p className="subtitle">
          Analyze your sleep patterns and get personalized, data-driven recommendations
          to improve your sleep quality.
        </p>
        <button className="rec-action-btn" onClick={fetchRecommendation} disabled={loading}>
          {loading ? (
            <>
              <span className="rec-spinner" />
              Analyzing your data...
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
              Get Recommendation
            </>
          )}
        </button>
      </div>

      {error && <div className="alert">{error}</div>}

      {recommendation && (
        <div className="rec-result">
          <div className="rec-result-header">
            <div className="rec-result-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </div>
            <h3>Your Personalized Recommendation</h3>
          </div>
          <div className="rec-result-body">
            <p>{recommendation}</p>
          </div>
          <div className="rec-result-footer">
            <span className="rec-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              Generated just now
            </span>
            <button className="rec-refresh-btn" onClick={fetchRecommendation} disabled={loading}>
              Refresh
            </button>
          </div>
        </div>
      )}

      {!recommendation && !loading && !error && (
        <div className="rec-empty">
          <div className="rec-empty-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <p>Click the button above to generate your first AI sleep recommendation.</p>
          <div className="rec-empty-features">
            <div className="rec-empty-feature">
              <span className="rec-feat-dot rec-feat-dot-1" />
              Pattern detection
            </div>
            <div className="rec-empty-feature">
              <span className="rec-feat-dot rec-feat-dot-2" />
              Lifestyle factor analysis
            </div>
            <div className="rec-empty-feature">
              <span className="rec-feat-dot rec-feat-dot-3" />
              Personalized tips
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
