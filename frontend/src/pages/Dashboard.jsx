import { useEffect, useState } from "react";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import api from "../api";
import "./Dashboard.css";

export default function Dashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [streaks, setStreaks] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/sleep-entries/analytics/").catch(() => ({ data: null })),
      api.get("/sleep-goals/streak/").catch(() => ({ data: null })),
      api.get("/sleep-entries/").catch(() => ({ data: [] })),
    ]).then(([a, s, e]) => {
      setAnalytics(a.data);
      setStreaks(s.data);
      setEntries(e.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <p className="page">Loading dashboard...</p>;

  const hasData = analytics && analytics.total_nights_logged;

  const chartData = [...entries]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((e) => ({
      date: e.date.slice(5),
      duration: e.duration_hours,
      quality: e.quality,
    }));

  return (
    <div className="page dashboard">
      <h1>Dashboard</h1>

      {!hasData && <p>No sleep data yet. <a href="/log">Log a night</a> to see analytics.</p>}

      {hasData && (
        <>
          <div className="stats-grid">
            <StatCard label="Avg Duration" value={`${analytics.average_duration_hours}h`} />
            <StatCard label="Avg Quality" value={`${analytics.average_quality}/5`} />
            <StatCard label="Consistency" value={`${analytics.consistency_score}%`} />
            <StatCard label="Nights Logged" value={analytics.total_nights_logged} />
          </div>

          {streaks && streaks.current_streak_days !== undefined && (
            <div className="stats-grid">
              <StatCard label="Current Streak" value={`${streaks.current_streak_days}d`} />
              <StatCard label="Longest Streak" value={`${streaks.longest_streak_days}d`} />
              <StatCard label="Weekly Score" value={`${streaks.weekly_score}%`} />
            </div>
          )}

          <div className="best-worst">
            <div className="bw-card">
              <h3>Best Night</h3>
              <p>{analytics.best_night.date}</p>
              <p>{analytics.best_night.duration_hours}h — {"⭐".repeat(analytics.best_night.quality)}</p>
            </div>
            <div className="bw-card">
              <h3>Worst Night</h3>
              <p>{analytics.worst_night.date}</p>
              <p>{analytics.worst_night.duration_hours}h — {"⭐".repeat(analytics.worst_night.quality)}</p>
            </div>
          </div>

          {chartData.length > 1 && (
            <>
              <h2>Sleep Duration</h2>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis unit="h" />
                    <Tooltip />
                    <Line type="monotone" dataKey="duration" stroke="#8b5cf6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <h2>Sleep Quality</h2>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 5]} />
                    <Tooltip />
                    <Bar dataKey="quality" fill="#c084fc" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="stat-card">
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}
