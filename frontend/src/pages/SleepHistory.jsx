import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";

export default function SleepHistory() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/sleep-entries/")
      .then((res) => setEntries(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this entry?")) return;
    await api.delete(`/sleep-entries/${id}/`);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  if (loading) return <p className="page">Loading...</p>;

  return (
    <div className="page">
      <h1>Sleep History</h1>
      {entries.length === 0 && (
        <p>
          No entries yet. <Link to="/log">Log your first night</Link>
        </p>
      )}
      <div className="entry-list">
        {entries.map((entry) => (
          <div key={entry.id} className="entry-card">
            <div className="entry-header">
              <span className="entry-date">{entry.date}</span>
              <span className="entry-duration">{entry.duration_hours}h</span>
            </div>
            <div className="entry-meta">
              <span>{"⭐".repeat(entry.quality)}</span>
              <span>
                {new Date(entry.bed_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} –{" "}
                {new Date(entry.wake_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            {entry.notes && <p className="entry-notes">{entry.notes}</p>}
            <div className="entry-tags">
              {entry.caffeine && <span className="tag">Caffeine</span>}
              {entry.exercise && <span className="tag">Exercise</span>}
              {entry.screen_time_before_bed > 0 && (
                <span className="tag">Screen {entry.screen_time_before_bed}m</span>
              )}
            </div>
            <button className="delete-btn" onClick={() => handleDelete(entry.id)}>
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
