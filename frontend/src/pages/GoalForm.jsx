import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function GoalForm() {
  const navigate = useNavigate();
  const [goal, setGoal] = useState(null);
  const [form, setForm] = useState({
    target_bed_time: "23:00",
    target_wake_time: "07:00",
    target_duration_hours: "8",
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/sleep-goals/").then((res) => {
      if (res.data.length > 0) {
        const g = res.data[0];
        setGoal(g);
        setForm({
          target_bed_time: g.target_bed_time,
          target_wake_time: g.target_wake_time,
          target_duration_hours: String(g.target_duration_hours),
        });
      }
    }).catch(() => {});
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload = {
        ...form,
        target_duration_hours: parseFloat(form.target_duration_hours),
      };
      if (goal) {
        await api.patch(`/sleep-goals/${goal.id}/`, payload);
      } else {
        await api.post("/sleep-goals/", payload);
      }
      navigate("/dashboard");
    } catch (err) {
      const data = err.response?.data;
      if (data) {
        const key = Object.keys(data)[0];
        if (key) {
          const val = data[key];
          setError(Array.isArray(val) ? val[0] : val);
        } else {
          setError(data.detail || "Something went wrong.");
        }
      } else {
        setError("Something went wrong.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!goal || !window.confirm("Delete your sleep goal?")) return;
    await api.delete(`/sleep-goals/${goal.id}/`);
    setGoal(null);
    setForm({ target_bed_time: "23:00", target_wake_time: "07:00", target_duration_hours: "8" });
  };

  return (
    <div className="page">
      <h1>{goal ? "Edit Sleep Goal" : "Set Sleep Goal"}</h1>
      {error && <div className="alert">{error}</div>}
      <form onSubmit={handleSubmit} className="form">
        <label>
          Target Bed Time
          <input type="time" name="target_bed_time" value={form.target_bed_time} onChange={handleChange} required />
        </label>
        <label>
          Target Wake Time
          <input type="time" name="target_wake_time" value={form.target_wake_time} onChange={handleChange} required />
        </label>
        <label>
          Target Duration (hours)
          <input type="number" name="target_duration_hours" min="1" max="12" step="0.5" value={form.target_duration_hours} onChange={handleChange} required />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? "Saving..." : goal ? "Update Goal" : "Create Goal"}
        </button>
        {goal && (
          <button type="button" className="delete-btn" onClick={handleDelete}>
            Delete Goal
          </button>
        )}
      </form>
    </div>
  );
}
