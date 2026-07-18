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
      api.get("/sleep-entries/?page_size=100").catch(() => ({ data: { results: [] } })),
    ]).then(([a, s, e]) => {
      setAnalytics(a.data);
      setStreaks(s.data);
      setEntries(e.data.results || e.data || []);
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
    <div className="page page-wide dashboard">
      <h1>Dashboard</h1>

      {!hasData && <p>No sleep data yet. <a href="/log">Log a night</a> to see analytics.</p>}

      {hasData && (
        <>
          <div className="stats-grid">
            <StatCard
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
              label="Avg. Sleep"
              value={`${analytics.average_duration_hours}h`}
              hint="per night"
            />
            <StatCard
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>}
              label="Avg. Quality"
              value={`${analytics.average_quality}/5`}
              hint="out of 5"
            />
            <StatCard
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>}
              label="Consistency"
              value={`${analytics.consistency_score}%`}
              hint="bedtime regularity"
            />
            <StatCard
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
              label="Nights"
              value={analytics.total_nights_logged}
              hint="total logged"
            />
          </div>

          {streaks && streaks.current_streak_days !== undefined && (
            <div className="stats-grid">
              <StatCard
                icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>}
                label="Current Streak"
                value={`${streaks.current_streak_days}d`}
                hint="consecutive goal met"
              />
              <StatCard
                icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>}
                label="Best Streak"
                value={`${streaks.longest_streak_days}d`}
                hint="all time record"
              />
              <StatCard
                icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>}
                label="This Week"
                value={`${streaks.weekly_score}%`}
                hint="goal hit rate"
              />
            </div>
          )}

          <div className="best-worst">
            <div className="bw-card">
              <h3>Best Night</h3>
              <p className="bw-date">{analytics.best_night.date}</p>
              <p className="bw-detail">{analytics.best_night.duration_hours}h sleep &middot; Quality {analytics.best_night.quality}/5</p>
            </div>
            <div className="bw-card">
              <h3>Worst Night</h3>
              <p className="bw-date">{analytics.worst_night.date}</p>
              <p className="bw-detail">{analytics.worst_night.duration_hours}h sleep &middot; Quality {analytics.worst_night.quality}/5</p>
            </div>
          </div>

          {chartData.length > 1 && (
            <>
              <h2>Sleep Duration</h2>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0d8f5" />
                    <XAxis dataKey="date" stroke="#6e6494" fontSize={12} />
                    <YAxis unit="h" stroke="#6e6494" fontSize={12} />
                    <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e0d8f5', borderRadius: 10, boxShadow: '0 4px 12px rgba(90,60,150,0.1)' }} />
                    <Line type="monotone" dataKey="duration" stroke="#7c6bf0" strokeWidth={2.5} dot={{ r: 4, fill: '#7c6bf0' }} activeDot={{ r: 6, fill: '#a78bfa' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <h2>Sleep Quality</h2>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0d8f5" />
                    <XAxis dataKey="date" stroke="#6e6494" fontSize={12} />
                    <YAxis domain={[0, 5]} stroke="#6e6494" fontSize={12} />
                    <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e0d8f5', borderRadius: 10, boxShadow: '0 4px 12px rgba(90,60,150,0.1)' }} />
                    <Bar dataKey="quality" fill="#7c6bf0" radius={[6, 6, 0, 0]} />
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

function StatCard({ icon, label, value, hint }) {
  return (
    <div className="stat-card">
      <span className="stat-icon">{icon}</span>
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
      {hint && <span className="stat-hint">{hint}</span>}
    </div>
  );
}
