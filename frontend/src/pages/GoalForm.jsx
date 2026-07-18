import { useState, useEffect } from "react";
import { Target, Loader2, Save } from "lucide-react";
import api from "../api";
import { useToast } from "../ToastContext";

export default function GoalForm() {
  const [form, setForm] = useState({ target_sleep_hours: 8, target_bed_time: "22:00" });
  const [streaks, setStreaks] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    Promise.all([
      api.get("/sleep-goals/current/").catch(() => ({ data: null })),
      api.get("/sleep-goals/streak/").catch(() => ({ data: null })),
    ]).then(([g, s]) => {
      if (g.data && g.data.id) {
        setForm({
          target_sleep_hours: g.data.target_sleep_hours,
          target_bed_time: g.data.target_bed_time,
        });
      }
      setStreaks(s.data);
      setLoading(false);
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const goal = {
        target_sleep_hours: Number(form.target_sleep_hours),
        target_bed_time: form.target_bed_time,
      };
      await api.post("/sleep-goals/", goal);
      toast("Goal saved", "success");
    } catch (err) {
      toast(err.response?.data?.detail || "Error saving goal", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <h1>Goal</h1>
        <div className="skeleton" style={{ height: 200, borderRadius: 14 }} />
      </div>
    );
  }

  return (
    <div className="page">
      <form onSubmit={handleSubmit} className="form-card animate-in">
        <h2><Target size={18} /> Sleep Goal</h2>

        <div className="form-field">
          <label htmlFor="target_sleep_hours">Target sleep (hours)</label>
          <input
            type="number"
            id="target_sleep_hours"
            min="1"
            max="12"
            step="0.5"
            value={form.target_sleep_hours}
            onChange={(e) => setForm({ ...form, target_sleep_hours: e.target.value })}
          />
        </div>

        <div className="form-field">
          <label htmlFor="target_bed_time">Target bedtime</label>
          <input
            type="time"
            id="target_bed_time"
            value={form.target_bed_time}
            onChange={(e) => setForm({ ...form, target_bed_time: e.target.value })}
          />
        </div>

        <button type="submit" className="submit-btn" disabled={saving}>
          {saving ? <><Loader2 size={16} className="spin" /> Saving…</> : <><Save size={16} /> Save Goal</>}
        </button>
      </form>

      {streaks && streaks.current_streak_days !== undefined && (
        <div className="insight-card animate-in animate-in-delay-1" style={{ marginTop: 24 }}>
          <h3>Streaks</h3>
          <p>Current: {streaks.current_streak_days} days · Longest: {streaks.longest_streak_days} days</p>
          <p>This week: {streaks.weekly_score}% goal hit rate</p>
        </div>
      )}
    </div>
  );
}
