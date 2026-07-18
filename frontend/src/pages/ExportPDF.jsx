import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import api from "../api";
import { useToast } from "../ToastContext";

export default function ExportPDF() {
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState(null);
  const toast = useToast();

  const handleExport = async () => {
    setLoading(true);
    try {
      const res = await api.get("/sleep-entries/?page_size=500");
      const entries = res.data.results || res.data || [];
      if (entries.length === 0) {
        toast("No entries to export", "error");
        return;
      }

      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text("SleepSync — Sleep Report", 14, 22);

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Exported ${new Date().toLocaleDateString()} · ${entries.length} nights`, 14, 30);

      const rows = entries.map((e) => [
        e.date,
        e.duration_hours + "h",
        e.quality + "/5",
        new Date(e.bed_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        new Date(e.wake_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        e.caffeine || "—",
        e.exercise ? "Yes" : "No",
        e.screen_time_before_bed ? "Yes" : "No",
        (e.notes || "").slice(0, 40),
      ]);

      autoTable(doc, {
        startY: 36,
        head: [["Date", "Duration", "Quality", "Bed", "Wake", "Caffeine", "Exercise", "Screen", "Notes"]],
        body: rows,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [124, 107, 240] },
        alternateRowStyles: { fillColor: [245, 243, 255] },
      });

      const avgDur = (entries.reduce((s, e) => s + e.duration_hours, 0) / entries.length).toFixed(1);
      const avgQual = (entries.reduce((s, e) => s + e.quality, 0) / entries.length).toFixed(1);
      const y = doc.lastAutoTable.finalY + 14;
      doc.setFontSize(11);
      doc.setTextColor(0);
      doc.text(`Average Duration: ${avgDur}h  ·  Average Quality: ${avgQual}/5`, 14, y);

      doc.save("sleep-report.pdf");
      setCount(entries.length);
      toast(`PDF exported — ${entries.length} nights`, "success");
    } catch (err) {
      toast("Failed to generate PDF", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page export-page">
      <h1>Export Sleep Report</h1>
      <p>Download a PDF of your sleep history, including averages and per-night details.</p>

      <button className="export-btn animate-in animate-in-delay-1" onClick={handleExport} disabled={loading}>
        {loading ? (
          <><Loader2 size={16} className="spin" /> Generating…</>
        ) : (
          <><FileDown size={16} /> Export PDF</>
        )}
      </button>

      {count !== null && <p className="export-done animate-in">Exported {count} entries ✓</p>}
    </div>
  );
}
