import { useEffect, useState } from "react";
import api from "../api";
import "./Timeline.css";

export default function Timeline() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/sleep-entries/")
      .then((res) => setEntries(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="page">Loading timeline...</p>;
  if (entries.length === 0) return <p className="page">No entries yet.</p>;

  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="page page-wide timeline-page">
      <h1>Sleep Timeline</h1>
      <div className="timeline">
        {sorted.map((entry) => {
          const bed = new Date(entry.bed_time);
          const wake = new Date(entry.wake_time);
          const bedHour = bed.getHours() + bed.getMinutes() / 60;
          const wakeHour = wake.getHours() + wake.getMinutes() / 60;
          const left = ((bedHour + (bedHour < 12 ? 24 : 0) - 18) % 24) * (100 / 24);
          const width = entry.duration_hours * (100 / 24);
          const qualityColors = ["", "#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6"];

          return (
            <div key={entry.id} className="timeline-row">
              <div className="timeline-date">{entry.date}</div>
              <div className="timeline-track">
                <div
                  className="timeline-bar"
                  style={{
                    marginLeft: `${left}%`,
                    width: `${Math.min(width, 100 - left)}%`,
                    backgroundColor: qualityColors[entry.quality],
                  }}
                  title={`${entry.duration_hours}h — Quality: ${entry.quality}/5`}
                >
                  <span className="timeline-label">
                    {entry.duration_hours}h
                  </span>
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
        <span><i style={{ backgroundColor: "#ef4444" }} /> 1</span>
        <span><i style={{ backgroundColor: "#f97316" }} /> 2</span>
        <span><i style={{ backgroundColor: "#eab308" }} /> 3</span>
        <span><i style={{ backgroundColor: "#22c55e" }} /> 4</span>
        <span><i style={{ backgroundColor: "#3b82f6" }} /> 5</span>
      </div>
    </div>
  );
}
