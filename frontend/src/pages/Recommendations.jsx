import { useState } from "react";
import { Loader2, Sparkles, Moon, Bed, Activity, Clock } from "lucide-react";
import api from "../api";
import "./Recommendations.css";

export default function Recommendations() {
  const [recommendations, setRecommendations] = useState([]);
  const [summary, setSummary] = useState("");
  const [windDown, setWindDown] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loaded, setLoaded] = useState(false);

  const getRecommendations = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post("/sleep-entries/generate_recommendations/");
      setRecommendations(res.data.recommendations || []);
      setSummary(res.data.summary || "");
      setWindDown(res.data.wind_down_suggestion || null);
      setLoaded(true);
    } catch (e) {
      setError(e.response?.data?.detail || e.message || "Failed to generate recommendations");
    } finally {
      setLoading(false);
    }
  };

  const icons = [
    <Moon size={18} strokeWidth={2} />,
    <Bed size={18} strokeWidth={2} />,
    <Activity size={18} strokeWidth={2} />,
    <Clock size={18} strokeWidth={2} />,
  ];

  return (
    <div className="page recommend-page">
      <div className="rec-hero animate-in">
        <div className="hero-icon"><Sparkles size={32} strokeWidth={1.5} /></div>
        <h1>Sleep Recommendations</h1>
        <p>AI-powered insights based on your sleep data</p>
      </div>

      <button
        className="recommend-btn animate-in animate-in-delay-1"
        onClick={getRecommendations}
        disabled={loading}
        aria-label="Get personalized sleep recommendations"
      >
        {loading ? (
          <>
            <Loader2 size={16} className="spin" />
            Analyzing your sleep data…
          </>
        ) : (
          <>
            <Sparkles size={16} />
            {loaded ? "Refresh Recommendations" : "Get Recommendations"}
          </>
        )}
      </button>

      {error && <p className="rec-error animate-in">{error}</p>}

      {!loading && loaded && recommendations.length === 0 && !error && (
        <div className="rec-empty animate-in">
          <Moon size={40} strokeWidth={1.5} />
          <h3>Not enough data yet</h3>
          <p>Log at least 3 nights of sleep to unlock personalized insights.</p>
        </div>
      )}

      {!loading && loaded && recommendations.length > 0 && (
        <div className="rec-result animate-in">
          {summary && <p className="rec-summary">{summary}</p>}

          <div className="rec-list">
            {recommendations.map((rec, i) => (
              <div key={i} className="rec-card animate-in" style={{ animationDelay: `${i * 0.07}s` }}>
                <span className="rec-icon">{icons[i % icons.length]}</span>
                <p>{rec}</p>
              </div>
            ))}
          </div>

          {windDown && (
            <div className="rec-card wind-down animate-in">
              <span className="rec-icon"><Clock size={18} strokeWidth={2} /></span>
              <p><strong>Optimal wind-down:</strong> {windDown.time} — {windDown.reason}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
