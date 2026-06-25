"use client";

import { useEffect, useState } from "react";

type Report = {
  id: string;
  beach_name: string;
  report_date: string;
  sargassum_level: string;
  notes: string | null;
  photo_url: string | null;
  created_at: string;
};

type Stats = { total: number; clear: number; almostClear: number; moderate: number; high: number };

export default function Home() {
  const [beachName, setBeachName] = useState("");
  const [reportDate, setReportDate] = useState("");
  const [level, setLevel] = useState("0");
  const [notes, setNotes] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loadingReports, setLoadingReports] = useState(false);
  const [sortBy, setSortBy] = useState("submitted");

  async function submitReport() {
    if (!beachName.trim() || !reportDate.trim()) {
      setStatus("Please enter the beach name and date.");
      return;
    }

    if (!photo) {
      setStatus("Please upload a beach photo.");
      return;
    }

    setStatus("Submitting report...");

    const formData = new FormData();
    formData.append("beachName", beachName);
    formData.append("reportDate", reportDate);
    formData.append("level", level);
    formData.append("notes", notes);
    formData.append("photo", photo);

    const response = await fetch("/api/reports", { method: "POST", body: formData });
    const data = await response.json();

    if (!response.ok) {
      setStatus(data.error || "Something went wrong.");
      return;
    }

    setStatus("Report submitted. Thank you!");
    setNotes("");
    setPhoto(null);
    await loadReports(sortBy);
  }

  async function loadReports(sort = "submitted") {
    setLoadingReports(true);

    const query = `/api/reports?sort=${sort}`;
    const response = await fetch(query);
    const data = await response.json();

    if (response.ok) {
      setReports(data.reports || []);
      setStats(data.stats || null);
    } else {
      setStatus(data.error || "Could not load reports.");
    }

    setLoadingReports(false);
  }

  useEffect(() => {
    setReportDate(new Date().toISOString().slice(0, 10));
    loadReports("submitted");
  }, []);

  const levels = ["0", "1", "2", "3", "4"];

  return (
    <main className="page">
      <section className="hero">
        <h1>Cancun Sargassum Report</h1>
        <p className="subtitle">
          Help travelers by posting current beach conditions. Submit a quick report, then view community updates and beach-level statistics.
        </p>
      </section>

      <section className="grid">
        <div className="card">
          <label htmlFor="beach">Beach or Resort</label>
          <input
            id="beach"
            value={beachName}
            onChange={(e) => setBeachName(e.target.value)}
            placeholder="Example: Playa Norte, Hotel Zone, Playa del Carmen"
          />

          <label htmlFor="date">Date observed</label>
          <input
            id="date"
            type="date"
            value={reportDate}
            onChange={(e) => setReportDate(e.target.value)}
          />

          <label>Seaweed rating</label>

          <div className="ratingLegend">
            <span>0 = Great / no seaweed</span>
            <span>4 = Bad / lots of seaweed</span>
          </div>

          <div className="ratingButtons">
            {levels.map((item) => (
              <button
                key={item}
                type="button"
                className={`ratingButton rating-${item} ${level === item ? "active" : ""}`}
                onClick={() => setLevel(item)}
              >
                {item}
              </button>
            ))}
          </div>

          <label htmlFor="photo">
            Upload beach photo <span className="required">Required</span>
          </label>

          <input
            id="photo"
            type="file"
            accept="image/*"
            onChange={(e) => setPhoto(e.target.files?.[0] || null)}
          />

          <label htmlFor="notes">
            Notes or question <span className="optional">(optional)</span>
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional: add details about smell, beach cleanup, water color, etc."
          />

          <button className="primary" onClick={submitReport}>
            Submit Current Conditions
          </button>
          <button className="secondary" onClick={() => loadReports(sortBy)}>
            View Community Reports
          </button>

          <div className="notice">{status || "Reports are public. Do not upload private or sensitive images."}</div>
        </div>

        <div className="card">
          <h2>Community reports</h2>

<div className="sortBar">
  <span className="sortLabel">Sort by</span>

  {[
    
    { value: "location", label: "Location" },
    { value: "rating", label: "Rating" },
    { value: "observed", label: "Observed" },
    { value: "submitted", label: "Submitted" },
  
  ].map((item) => (
    <button
      key={item.value}
      className={`sortPill ${sortBy === item.value ? "active" : ""}`}
      onClick={() => {
        setSortBy(item.value);
        loadReports(item.value);
      }}
    >
      {item.label}
    </button>
  ))}
</div>

          {stats && (
            <div className="stats">
<div className="stat"><b>{stats.total}</b><span>Total reports</span></div>
<div className="stat"><b>{reports.length ? (reports.reduce((sum, r) => sum + Number(r.sargassum_level), 0) / reports.length).toFixed(1) : "0"}</b><span>Avg rating</span></div>
<div className="stat"><b>{Math.min(...reports.map(r => Number(r.sargassum_level)))}</b><span>Best rating</span></div>
<div className="stat"><b>{Math.max(...reports.map(r => Number(r.sargassum_level)))}</b><span>Worst rating</span></div>
            </div>
          )}

          {loadingReports && <p className="empty">Loading reports...</p>}

          {!loadingReports && reports.length === 0 && (
            <p className="empty">No reports yet. Submit the first one, or search by a different beach name.</p>
          )}

          {reports.map((report) => (
            <article className="report" key={report.id}>
              <div className="reportTop">
                <strong>{report.beach_name}</strong>
                <span className={`miniRating rating-${report.sargassum_level}`}>
                  {report.sargassum_level}
                </span>
              </div>

              <div className="empty">
                Observed: {report.report_date}
                <br />
                Submitted: {new Date(report.created_at).toLocaleString()}
              </div>

              {report.notes && <p>{report.notes}</p>}

              {report.photo_url && (
                <img
                  className="photo"
                  src={report.photo_url}
                  alt={`Beach condition at ${report.beach_name}`}
                />
              )}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
