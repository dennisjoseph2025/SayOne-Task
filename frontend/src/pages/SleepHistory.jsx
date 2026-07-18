import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";

export default function SleepHistory() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [count, setCount] = useState(0);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/sleep-entries/?page=${page}`)
      .then((res) => {
        setEntries(res.data.results);
        setCount(res.data.count);
        setTotalPages(Math.ceil(res.data.count / 10));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this entry?")) return;
    await api.delete(`/sleep-entries/${id}/`);
    setEntries((prev) => prev.filter((e) => e.id !== id));
    setCount((c) => c - 1);
    setTotalPages(Math.ceil((count - 1) / 10));
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
              <span className={`quality-badge q${entry.quality}`}>{entry.quality}/5</span>
              <span>
                {new Date(entry.bed_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} –{" "}
                {new Date(entry.wake_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            {entry.notes && <p className="entry-notes">{entry.notes}</p>}
            <div className="entry-tags">
              {entry.caffeine && entry.caffeine !== "NONE" && <span className="tag">Caffeine: {entry.caffeine}</span>}
              {entry.exercise && <span className="tag">Exercise</span>}
              {entry.screen_time_before_bed && (
                <span className="tag">Screen time</span>
              )}
            </div>
            <button className="delete-btn" onClick={() => handleDelete(entry.id)}>
              Delete
            </button>
          </div>
        ))}
      </div>
      {totalPages > 1 && (
        <div className="pagination">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            ‹ Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              className={p === page ? "active" : ""}
              onClick={() => setPage(p)}
            >
              {p}
            </button>
          ))}
          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Next ›
          </button>
        </div>
      )}
      {count > 0 && (
        <p className="pagination-info">
          Showing {entries.length} of {count} entries
        </p>
      )}
    </div>
  );
}
