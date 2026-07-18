import { useEffect, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import api from "../api";

export default function ExportPDF() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("week");

  useEffect(() => {
    api.get("/sleep-entries/")
      .then((res) => setEntries(res.data))
      .finally(() => setLoading(false));
  }, []);

  const getFiltered = () => {
    const now = new Date();
    const cutoff = new Date();
    if (period === "week") cutoff.setDate(now.getDate() - 7);
    else if (period === "month") cutoff.setDate(now.getDate() - 30);
    else cutoff.setFullYear(2000);

    return entries.filter((e) => new Date(e.date) >= cutoff);
  };

  const generatePDF = () => {
    const filtered = getFiltered().sort((a, b) => a.date.localeCompare(b.date));
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text("SleepSync Report", 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    const label = period === "week" ? "Last 7 Days" : period === "month" ? "Last 30 Days" : "All Time";
    doc.text(`${label} — Generated ${new Date().toLocaleDateString()}`, 14, 30);

    const avgDuration = filtered.length
      ? (filtered.reduce((s, e) => s + e.duration_hours, 0) / filtered.length).toFixed(1)
      : "N/A";
    const avgQuality = filtered.length
      ? (filtered.reduce((s, e) => s + e.quality, 0) / filtered.length).toFixed(1)
      : "N/A";

    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Nights logged: ${filtered.length}`, 14, 42);
    doc.text(`Avg duration: ${avgDuration}h`, 14, 50);
    doc.text(`Avg quality: ${avgQuality}/5`, 14, 58);

    if (filtered.length > 0) {
      const tableData = filtered.map((e) => [
        e.date,
        new Date(e.bed_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        new Date(e.wake_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        `${e.duration_hours}h`,
        `${e.quality}/5`,
        e.caffeine,
        e.exercise ? "Yes" : "No",
        e.screen_time_before_bed ? "Yes" : "No",
      ]);

      autoTable(doc, {
        startY: 65,
        head: [["Date", "Bed", "Wake", "Duration", "Quality", "Caffeine", "Exercise", "Screen"]],
        body: tableData,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [139, 92, 246] },
      });
    }

    doc.save(`sleepsync-report-${period}.pdf`);
  };

  if (loading) return <p className="page">Loading...</p>;

  return (
    <div className="page">
      <h1>Export Sleep Report</h1>
      <p style={{ color: "var(--text)", marginBottom: "1rem" }}>
        Generate a PDF report of your sleep data.
      </p>
      <div className="form" style={{ maxWidth: 320 }}>
        <label>
          Period
          <select value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="all">All Time</option>
          </select>
        </label>
        <button type="button" onClick={generatePDF}>
          Download PDF
        </button>
      </div>
    </div>
  );
}
