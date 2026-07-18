import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown, ArrowRight, AlertCircle } from "lucide-react";
import api from "../api";
import { QUALITY_COLORS } from "../utils";
import "./Trends.css";

export default function Trends() {
  const [trends, setTrends] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get("/sleep-entries/trends/").catch((e) => ({ data: null, error: e })),
      api.get("/sleep-entries/analytics/").catch((e) => ({ data: null, error: e })),
    ]).then(([t, a]) => {
      setTrends(t.data);
      setAnalytics(a.data);
      if (!t.data && t.error) setError(t.error?.response?.data?.detail || "Failed to load trends");
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="page trends-page">
        <h1>Sleep Trends</h1>
        <div className="skeleton" style={{ height: 36, width: 220, borderRadius: 8, marginBottom: 20 }} />
        <div className="skeleton" style={{ height: 220, borderRadius: 14 }} />
        <div className="insight-grid">
          {[1,2,3].map((i) => (
            <div key={i} className="insight-card">
              <div className="skeleton" style={{ width: 100, height: 18, marginBottom: 8 }} />
              <div className="skeleton" style={{ width: 160, height: 14 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) return <p className="page">{error}</p>;

  const hasTrends = trends && trends.correlations && trends.correlations.length;
  const hasData = analytics && analytics.total_nights_logged > 0;

  return (
    <div className="page trends-page">
      <h1>Sleep Trends</h1>

      {!hasData && <p className="animate-in">No data yet. <Link to="/log">Log sleep</Link> to see trends.</p>}

      {hasData && (
        <>
          {trends && trends.wind_down_suggestion && (
            <div className="insight-card animate-in" style={{ marginBottom: 24 }}>
              <h3><span className="insight-icon">Wind-down</span></h3>
              <div className="wind-down">
                <p className="wd-time">{trends.wind_down_suggestion.time}</p>
                <span>{trends.wind_down_suggestion.reason}</span>
              </div>
            </div>
          )}

          {trends && trends.weekly_pattern && (
            <>
              <h2>Quality by Day</h2>
              <div className="chart-container animate-in">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={trends.weekly_pattern}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0d8f5" />
                    <XAxis dataKey="day" stroke="#6e6494" fontSize={12} />
                    <YAxis domain={[0, 5]} stroke="#6e6494" fontSize={12} />
                    <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e0d8f5', borderRadius: 10, boxShadow: '0 4px 12px rgba(90,60,150,0.1)', fontSize: '0.82rem' }} />
                    <Bar dataKey="avg_quality" radius={[6, 6, 0, 0]}>
                      {trends.weekly_pattern.map((entry, idx) => (
                        <rect key={idx} fill={QUALITY_COLORS[Math.round(entry.avg_quality)] || QUALITY_COLORS[3]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}

          {hasTrends && (
            <>
              <h2>Correlations</h2>
              <div className="insight-grid animate-in">
                {trends.correlations.map((c, i) => {
                  const isPositive = c.impact === "positive" || c.impact > 0;
                  const isMixed = c.impact === "mixed";
                  return (
                    <div key={i} className={`insight-card corr-item ${isMixed ? "" : isPositive ? "positive" : "negative"}`}>
                      <span className={`corr-strength ${isMixed ? "" : isPositive ? "positive" : "negative"}`}>
                        {isMixed ? null : isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        {isMixed ? "Mixed" : isPositive ? "Positive" : "Negative"}
                      </span>
                      <h4>{c.factor}</h4>
                      <span className="corr-desc">
                        <ArrowRight size={13} />
                        {isMixed ? "Varied" : isPositive ? "Better" : "Worse"} sleep when <em>{c.description || c.factor}</em>
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {!hasTrends && hasData && (
            <p className="animate-in">
              <AlertCircle size={16} /> Log 7+ nights to unlock detailed trend analysis.
            </p>
          )}
        </>
      )}
    </div>
  );
}
