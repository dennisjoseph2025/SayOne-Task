import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function SleepLogForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    bed_time: "",
    wake_time: "",
    quality: 3,
    notes: "",
    caffeine: "NONE",
    exercise: false,
    screen_time_before_bed: false,
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload = {
        ...form,
        quality: Number(form.quality),
        bed_time: form.bed_time.length === 16 ? form.bed_time + ":00" : form.bed_time,
        wake_time: form.wake_time.length === 16 ? form.wake_time + ":00" : form.wake_time,
      };
      await api.post("/sleep-entries/", payload);
      navigate("/history");
    } catch (err) {
      const data = err.response?.data;
      if (data) {
        const firstKey = Object.keys(data)[0];
        if (firstKey) {
          const val = data[firstKey];
          setError(Array.isArray(val) ? val[0] : val);
        } else if (data.detail) {
          setError(data.detail);
        } else {
          setError("Something went wrong. Please check your input.");
        }
      } else {
        setError("Something went wrong. Please check your input.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <h1>Log Sleep</h1>
      {error && <div className="alert">{error}</div>}
      <form onSubmit={handleSubmit} className="form">
        <label>
          Date
          <input type="date" name="date" value={form.date} onChange={handleChange} required />
        </label>
        <label>
          Bed Time
          <input type="datetime-local" name="bed_time" value={form.bed_time} onChange={handleChange} required />
        </label>
        <label>
          Wake Time
          <input type="datetime-local" name="wake_time" value={form.wake_time} onChange={handleChange} required />
        </label>
        <label>
          Quality (1–5)
          <input type="range" name="quality" min="1" max="5" value={form.quality} onChange={handleChange} />
          <span>{form.quality}</span>
        </label>
        <label>
          Caffeine
          <select name="caffeine" value={form.caffeine} onChange={handleChange}>
            <option value="NONE">None</option>
            <option value="MORNING">Morning</option>
            <option value="AFTERNOON">Afternoon</option>
            <option value="EVENING">Evening</option>
          </select>
        </label>
        <div className="checkbox-row">
          <label>
            <input type="checkbox" name="exercise" checked={form.exercise} onChange={handleChange} />
            Exercise
          </label>
          <label>
            <input type="checkbox" name="screen_time_before_bed" checked={form.screen_time_before_bed} onChange={handleChange} />
            Screen time before bed
          </label>
        </div>
        <label>
          Notes
          <textarea name="notes" value={form.notes} onChange={handleChange} rows="3" />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save Entry"}
        </button>
      </form>
    </div>
  );
}
