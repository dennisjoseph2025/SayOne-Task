import { useState, useEffect } from "react";
import { Loader2, Save, Calendar } from "lucide-react";
import api from "../api";
import { useToast } from "../ToastContext";

const today = new Date().toISOString().split("T")[0];

const defaultState = {
  date: today,
  bed_time: "",
  wake_time: "",
  quality: 3,
  caffeine: "NONE",
  exercise: false,
  screen_time_before_bed: false,
  notes: "",
};

export default function SleepLogForm({ onComplete }) {
  const [form, setForm] = useState(defaultState);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const toast = useToast();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validate = () => {
    const errs = {};
    if (!form.bed_time) errs.bed_time = "Required";
    if (!form.wake_time) errs.wake_time = "Required";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      await api.post("/sleep-entries/", {
        ...form,
        bed_time: form.bed_time + ":00",
        wake_time: form.wake_time + ":00",
      });
      toast("Sleep entry saved", "success");
      setForm(defaultState);
      if (onComplete) onComplete();
    } catch (err) {
      const msg = err.response?.data?.detail || "Error saving entry";
      toast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  const setToday = () => setForm((prev) => ({ ...prev, date: today }));

  return (
    <form onSubmit={handleSubmit} className="form-card animate-in">
      <h2><Calendar size={18} /> Log Sleep</h2>

      <div className="form-field">
        <label htmlFor="date">Date</label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="date" id="date" name="date" value={form.date} onChange={handleChange} />
          <button type="button" onClick={setToday} className="small-btn">Today</button>
        </div>
      </div>

      <div className="form-field">
        <label htmlFor="bed_time">Bed Time</label>
        <input
          type="datetime-local"
          id="bed_time"
          name="bed_time"
          value={form.bed_time}
          onChange={handleChange}
          required
          aria-invalid={!!errors.bed_time}
        />
        {errors.bed_time && <span className="field-error">{errors.bed_time}</span>}
      </div>

      <div className="form-field">
        <label htmlFor="wake_time">Wake Time</label>
        <input
          type="datetime-local"
          id="wake_time"
          name="wake_time"
          value={form.wake_time}
          onChange={handleChange}
          required
          aria-invalid={!!errors.wake_time}
        />
        {errors.wake_time && <span className="field-error">{errors.wake_time}</span>}
      </div>

      <div className="form-field">
        <label htmlFor="quality">Quality: {form.quality}/5</label>
        <div className="range-container">
          <span className="range-labels">
            <span className="range-label">{form.quality === 1 ? "Terrible" : form.quality === 2 ? "Poor" : form.quality === 3 ? "Average" : form.quality === 4 ? "Good" : "Excellent"}</span>
          </span>
          <input
            type="range"
            id="quality"
            name="quality"
            min="1"
            max="5"
            step="1"
            value={form.quality}
            onChange={handleChange}
          />
          <div className="range-ticks">
            {[1,2,3,4,5].map((v) => (
              <span key={v} className={form.quality == v ? "active" : ""}>{v}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="form-field">
        <label htmlFor="caffeine">Caffeine Intake</label>
        <select id="caffeine" name="caffeine" value={form.caffeine} onChange={handleChange}>
          <option value="NONE">None</option>
          <option value="MORNING">Morning</option>
          <option value="AFTERNOON">Afternoon</option>
          <option value="EVENING">Evening</option>
        </select>
      </div>

      <label className="check-field animate-in animate-in-delay-1">
        <input type="checkbox" name="exercise" checked={form.exercise} onChange={handleChange} />
        <span>Exercise today</span>
      </label>

      <label className="check-field animate-in animate-in-delay-2">
        <input type="checkbox" name="screen_time_before_bed" checked={form.screen_time_before_bed} onChange={handleChange} />
        <span>Screen time before bed</span>
      </label>

      <div className="form-field">
        <label htmlFor="notes">Notes</label>
        <textarea
          id="notes"
          name="notes"
          placeholder="How did you feel? Any unusual factors?"
          value={form.notes}
          onChange={handleChange}
          rows={3}
        />
      </div>

      <button type="submit" className="submit-btn" disabled={saving}>
        {saving ? (
          <><Loader2 size={16} className="spin" /> Saving…</>
        ) : (
          <><Save size={16} /> Save Entry</>
        )}
      </button>
    </form>
  );
}
