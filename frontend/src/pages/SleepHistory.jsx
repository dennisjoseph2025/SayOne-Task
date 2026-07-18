import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Trash2 } from "lucide-react";
import api from "../api";
import { useToast } from "../ToastContext";
import { getPageNumbers } from "../utils";

export default function SleepHistory() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [count, setCount] = useState(0);
  const toast = useToast();

  useEffect(() => {
    setLoading(true);
    api.get(`/sleep-entries/?page=${page}`)
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
    toast("Entry deleted", "success");
  };

  if (loading) {
    return (
      <div className="page">
        <h1>Sleep History</h1>
        <div className="entry-list">
          {[1,2,3].map((i) => (
            <div key={i} className="entry-card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <div className="skeleton" style={{ width: 100, height: 18 }} />
                <div className="skeleton" style={{ width: 50, height: 24, borderRadius: 8 }} />
              </div>
              <div className="skeleton" style={{ width: 180, height: 16, marginBottom: 12 }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <div className="skeleton" style={{ width: 60, height: 22, borderRadius: 99 }} />
                <div className="skeleton" style={{ width: 80, height: 22, borderRadius: 99 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <h1>Sleep History</h1>
      {entries.length === 0 && (
        <p>No entries yet. <Link to="/log">Log your first night</Link></p>
      )}
      <div className="entry-list">
        {entries.map((entry, i) => (
          <div key={entry.id} className={`entry-card animate-in`} style={{ animationDelay: `${i * 0.04}s` }}>
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
              {entry.screen_time_before_bed && <span className="tag">Screen time</span>}
            </div>
            <button className="delete-btn" onClick={() => handleDelete(entry.id)} aria-label={`Delete entry for ${entry.date}`}>
              <Trash2 size={13} /> Delete
            </button>
          </div>
        ))}
      </div>
      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} setPage={setPage} />
      )}
      {count > 0 && <p className="pagination-info">Showing {entries.length} of {count} entries</p>}
    </div>
  );
}

function Pagination({ page, totalPages, setPage }) {
  const pages = getPageNumbers(page, totalPages);
  return (
    <div className="pagination">
      <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label="Previous page">‹ Prev</button>
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`e${i}`} className="pagination-ellipsis">…</span>
        ) : (
          <button key={p} className={p === page ? "active" : ""} onClick={() => setPage(p)}>{p}</button>
        )
      )}
      <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} aria-label="Next page">Next ›</button>
    </div>
  );
}
