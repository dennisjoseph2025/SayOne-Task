import { useEffect, useState } from "react";
import api from "../api";
import { QUALITY_COLORS, getPageNumbers } from "../utils";
import "./Timeline.css";

function SkeletonRow() {
  return (
    <div className="timeline-row">
      <div className="skeleton" style={{ width: 100, height: 14, marginBottom: 10 }} />
      <div className="skeleton" style={{ height: 28, borderRadius: 8 }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
        <div className="skeleton" style={{ width: 60, height: 12 }} />
        <div className="skeleton" style={{ width: 60, height: 12 }} />
      </div>
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

export default function Timeline() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [count, setCount] = useState(0);

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

  if (loading) {
    return (
      <div className="page page-wide timeline-page">
        <h1>Sleep Timeline</h1>
        <div className="timeline">{[1,2,3].map((i) => <SkeletonRow key={i} />)}</div>
      </div>
    );
  }

  if (entries.length === 0 && page === 1) return <p className="page">No entries yet.</p>;

  const hours = ["6PM", "8PM", "10PM", "12AM", "2AM", "4AM", "6AM", "8AM", "10AM", "12PM"];

  return (
    <div className="page page-wide timeline-page">
      <h1>Sleep Timeline</h1>
      <div className="timeline-axis">
        {hours.map((h) => (
          <span key={h} className="axis-label">{h}</span>
        ))}
      </div>
      <div className="timeline">
        {entries.map((entry, i) => {
          const bed = new Date(entry.bed_time);
          const wake = new Date(entry.wake_time);
          const bedHour = bed.getHours() + bed.getMinutes() / 60;
          const left = ((bedHour + (bedHour < 12 ? 24 : 0) - 18) % 24) * (100 / 24);
          const width = entry.duration_hours * (100 / 24);
          const color = QUALITY_COLORS[entry.quality] || QUALITY_COLORS[3];

          return (
            <div key={entry.id} className={`timeline-row animate-in`} style={{ animationDelay: `${i * 0.04}s` }}>
              <div className="timeline-date">{entry.date}</div>
              <div className="timeline-track">
                <div
                  className="timeline-bar"
                  style={{
                    marginLeft: `${left}%`,
                    width: `${Math.min(width, 100 - left)}%`,
                    backgroundColor: color,
                  }}
                  title={`${entry.duration_hours}h — Quality: ${entry.quality}/5`}
                >
                  <span className="timeline-label">{entry.duration_hours}h</span>
                </div>
              </div>
              <div className="timeline-meta">
                <span className="tl-bed">{bed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                <span className="tl-wake">{wake.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="timeline-legend">
        {[1,2,3,4,5].map((q) => (
          <span key={q}><i style={{ backgroundColor: QUALITY_COLORS[q] }} /> {q}</span>
        ))}
      </div>
      {totalPages > 1 && <Pagination page={page} totalPages={totalPages} setPage={setPage} />}
      {count > 0 && <p className="pagination-info">Page {page} of {totalPages} — {count} total entries</p>}
    </div>
  );
}
