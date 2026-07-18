import { useEffect, useState } from "react";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Moon, Star, Activity, Calendar, Zap, BarChart3, Award } from "lucide-react";
import api from "../api";
import { QUALITY_COLORS } from "../utils";
import "./Dashboard.css";

const chartTooltipStyle = {
  background: '#fff',
  border: '1px solid #e0d8f5',
  borderRadius: 10,
  boxShadow: '0 4px 12px rgba(90,60,150,0.1)',
  fontSize: '0.82rem',
  fontFamily: "'Inter', sans-serif",
};

function SkeletonCard() {
  return (
    <div className="stat-card">
      <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 12, marginBottom: 8 }} />
      <div className="skeleton" style={{ width: 60, height: 28, marginBottom: 4 }} />
      <div className="skeleton" style={{ width: 80, height: 14 }} />
    </div>
  );
}

function StatCard({ icon, label, value, hint, delay }) {
  return (
    <div className={`stat-card animate-in animate-in-delay-${delay}`}>
      <span className="stat-icon">{icon}</span>
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
      {hint && <span className="stat-hint">{hint}</span>}
    </div>
  );
}

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

  if (loading) {
    return (
      <div className="page page-wide dashboard">
        <h1>Dashboard</h1>
        <div className="stats-grid">
          {[1,2,3,4].map((i) => <SkeletonCard key={i} />)}
        </div>
        <div className="stats-grid">
          {[1,2,3].map((i) => <SkeletonCard key={i} />)}
        </div>
        <div className="best-worst">
          <div className="skeleton" style={{ height: 100, borderRadius: 14 }} />
          <div className="skeleton" style={{ height: 100, borderRadius: 14 }} />
        </div>
        <div className="skeleton" style={{ height: 290, borderRadius: 14 }} />
        <div className="skeleton" style={{ height: 290, borderRadius: 14 }} />
      </div>
    );
  }

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
            <StatCard delay={1} icon={<Moon size={20} strokeWidth={2} />} label="Avg. Sleep" value={`${analytics.average_duration_hours}h`} hint="per night" />
            <StatCard delay={2} icon={<Star size={20} strokeWidth={2} />} label="Avg. Quality" value={`${analytics.average_quality}/5`} hint="out of 5" />
            <StatCard delay={3} icon={<Activity size={20} strokeWidth={2} />} label="Consistency" value={`${analytics.consistency_score}%`} hint="bedtime regularity" />
            <StatCard delay={4} icon={<Calendar size={20} strokeWidth={2} />} label="Nights" value={analytics.total_nights_logged} hint="total logged" />
          </div>

          {streaks && streaks.current_streak_days !== undefined && (
            <div className="stats-grid">
              <StatCard delay={1} icon={<Zap size={20} strokeWidth={2} />} label="Current Streak" value={`${streaks.current_streak_days}d`} hint="goal met in a row" />
              <StatCard delay={2} icon={<BarChart3 size={20} strokeWidth={2} />} label="Best Streak" value={`${streaks.longest_streak_days}d`} hint="all time record" />
              <StatCard delay={3} icon={<Award size={20} strokeWidth={2} />} label="This Week" value={`${streaks.weekly_score}%`} hint="goal hit rate" />
            </div>
          )}

          <div className="best-worst animate-in animate-in-delay-2">
            <div className="bw-card">
              <h3>Best Night</h3>
              <p className="bw-date">{analytics.best_night.date}</p>
              <p className="bw-detail">{analytics.best_night.duration_hours}h sleep · Quality {analytics.best_night.quality}/5</p>
            </div>
            <div className="bw-card">
              <h3>Worst Night</h3>
              <p className="bw-date">{analytics.worst_night.date}</p>
              <p className="bw-detail">{analytics.worst_night.duration_hours}h sleep · Quality {analytics.worst_night.quality}/5</p>
            </div>
          </div>

          {chartData.length > 1 && (
            <>
              <h2>Sleep Duration</h2>
              <div className="chart-container animate-in animate-in-delay-3">
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0d8f5" />
                    <XAxis dataKey="date" stroke="#6e6494" fontSize={12} />
                    <YAxis unit="h" stroke="#6e6494" fontSize={12} />
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Line type="monotone" dataKey="duration" stroke={QUALITY_COLORS[5]} strokeWidth={2.5} dot={{ r: 4, fill: QUALITY_COLORS[5] }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <h2>Sleep Quality</h2>
              <div className="chart-container animate-in animate-in-delay-4">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0d8f5" />
                    <XAxis dataKey="date" stroke="#6e6494" fontSize={12} />
                    <YAxis domain={[0, 5]} stroke="#6e6494" fontSize={12} />
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Bar dataKey="quality" radius={[6, 6, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <rect key={index} fill={QUALITY_COLORS[entry.quality] || QUALITY_COLORS[3]} />
                      ))}
                    </Bar>
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
