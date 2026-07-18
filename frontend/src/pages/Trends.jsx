import { useEffect, useState } from "react";
import api from "../api";
import "./Trends.css";

export default function Trends() {
  const [trends, setTrends] = useState(null);
  const [windDown, setWindDown] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/sleep-entries/trends/").catch(() => ({ data: null })),
      api.get("/sleep-entries/wind_down/").catch(() => ({ data: null })),
    ]).then(([t, w]) => {
      setTrends(t.data);
      setWindDown(w.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <p className="page">Analyzing sleep data...</p>;

  return (
    <div className="page trends">
      <h1>Sleep Trends & Insights</h1>

      {windDown && (
        <div className="insight-card wind-down">
          <h3>Optimal Wind-Down Time</h3>
          <div className="big-value">{windDown.recommended_wind_down_time}</div>
          <p>{windDown.reasoning}</p>
        </div>
      )}

      {trends && (
        <>
          {trends.note && <p className="trends-note">{trends.note}</p>}

          {trends.patterns && trends.patterns.length > 0 && (
            <div className="insight-card">
              <h3>Patterns</h3>
              <ul>
                {trends.patterns.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            </div>
          )}

          {trends.mood_factors && trends.mood_factors.length > 0 && (
            <div className="insight-card">
              <h3>Mood Factors</h3>
              <ul>
                {trends.mood_factors.map((m, i) => <li key={i}>{m}</li>)}
              </ul>
            </div>
          )}

          {trends.correlations && trends.correlations.length > 0 && (
            <div className="insight-card">
              <h3>Factor Correlations</h3>
              <div className="corr-list">
                {trends.correlations.map((c, i) => (
                  <div key={i} className="corr-item">
                    <span className="corr-factor">{c.factor}</span>
                    <span className={`corr-impact ${c.impact}`}>{c.impact}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
