import { useEffect, useState } from "react";

import { useStudyStore } from "../stores/studyStore";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

interface DocumentRecord {
  ticker: string;
  filing_date: string;
  report_date: string;
  form: string;
  pdf_url: string;
  pdf_filename: string;
}

export default function DocumentsPanel() {
  const [docs, setDocs] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const openPdfViewer = useStudyStore((s) => s.openPdfViewer);

  useEffect(() => {
    fetch(`${BASE_URL}/api/documents`)
      .then((res) => res.json())
      .then((data) => {
        setDocs(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="documents-panel">
        <div className="documents-loading">Loading documents...</div>
      </div>
    );
  }

  if (docs.length === 0) {
    return (
      <div className="documents-panel">
        <div className="documents-empty">No 10-K documents found.</div>
      </div>
    );
  }

  return (
    <div className="documents-panel">
      <div className="documents-header">
        <h2 className="documents-title">10-K Annual Reports</h2>
        <span className="documents-count">{docs.length} filings</span>
      </div>
      <div className="documents-grid">
        {docs.map((doc) => (
          <button
            key={doc.ticker}
            type="button"
            className="documents-card"
            onClick={() => openPdfViewer({ url: `${BASE_URL}${doc.pdf_url}`, page: 1, ticker: doc.ticker })}
          >
            <div className="documents-card-ticker">{doc.ticker}</div>
            <div className="documents-card-form">{doc.form}</div>
            <div className="documents-card-dates">
              <span>Filed: {doc.filing_date}</span>
              <span>Period: {doc.report_date}</span>
            </div>
            <div className="documents-card-action">View PDF</div>
          </button>
        ))}
      </div>
    </div>
  );
}

/** Fetch the documents manifest and return a ticker→pdf_url map. */
export async function fetchDocumentsMap(): Promise<Record<string, string>> {
  try {
    const res = await fetch(`${BASE_URL}/api/documents`);
    if (!res.ok) return {};
    const docs: DocumentRecord[] = await res.json();
    const map: Record<string, string> = {};
    for (const doc of docs) {
      map[doc.ticker] = `${BASE_URL}${doc.pdf_url}`;
    }
    return map;
  } catch {
    return {};
  }
}
