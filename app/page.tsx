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
    if (photo) formData.append("photo", photo);

    const response = await fetch("/api/reports", { method: "POST", body: formData });
    const data = await response.json();
    if (!response.ok) {
      setStatus(data.error || "Something went wrong.");
      return;
    }
    setStatus("Report submitted. Thank you!");
    setNotes("");
    setPhoto(null);
    await loadReports();
  }

  async function loadReports(sort = sortBy) {
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
    loadReports();
  }, []);

  const levels = ["0", "1", "2", "3", "4", "5"];

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
          <input id="beach" value={beachName} onChange={(e) => setBeachName(e.target.value)} placeholder="Example: Playa Norte, Hotel Zone, Playa del Carmen" />

          <label htmlFor="date">Date observed</label>
          <input id="date" type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} />

    <label>Seaweed rating</label>
    
    <div className="ratingLegend">
      <span>0 = Great / no seaweed</span>
      <span>5 = Bad / lots of seaweed</span>
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
                    
          <input id="photo" type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] || null)} />

          <label htmlFor="notes">Notes or question <span className="optional">(optional)</span></label>
          <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} 
            placeholder="Optional: add details about smell, beach cleanup, water color, etc." />
        
          <button className="primary" onClick={submitReport}>Submit Current Conditions</button>
          <button className="secondary" onClick={loadReports}>View Community Reports</button>

          <div className="notice">{status || "Reports are public. Do not upload private or sensitive images."}</div>
        </div>

        <div className="card">
          <h2>Community reports</h2>

            <select
              className="sortSelect"
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                loadReports(e.target.value);
              }}
            >
              <option value="submitted">Newest submissions</option>
              <option value="observed">Observation date</option>
              <option value="location">Location (A-Z)</option>
              <option value="rating">Seaweed rating</option>
            </select>
          
          {stats && (
            <div className="stats">
              <div className="stat"><b>{stats.total}</b><span>Total</span></div>
              <div className="stat"><b>{stats.clear + stats.almostClear}</b><span>Clear-ish</span></div>
              <div className="stat"><b>{stats.moderate}</b><span>Moderate</span></div>
              <div className="stat"><b>{stats.high}</b><span>High</span></div>
            </div>
          )}
          {loadingReports && <p className="empty">Loading reports...</p>}
          {!loadingReports && reports.length === 0 && <p className="empty">No reports yet. Submit the first one, or search by a different beach name.</p>}
          {reports.map((report) => (
            <article className="report" key={report.id}>
              <div className="reportTop"><strong>{report.beach_name}</strong><span className="pill">{report.sargassum_level}</span></div>
              <div className="empty">
                Observed: {report.report_date}
                <br />
                Submitted: {new Date(report.created_at).toLocaleString()}
              </div>
              {report.notes && <p>{report.notes}</p>}
              {report.photo_url && <img className="photo" src={report.photo_url} alt={`Beach condition at ${report.beach_name}`} />}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
