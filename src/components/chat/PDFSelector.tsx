"use client";

import { useState } from "react";
import { FileText, Check, X, Search } from "lucide-react";
import { cn, formatFileSize } from "@/utils/cn";
import type { PDF } from "@/types";

interface PDFSelectorProps {
  pdfs: PDF[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  onClose: () => void;
}

export function PDFSelector({
  pdfs,
  selectedIds,
  onChange,
  onClose,
}: PDFSelectorProps) {
  const [search, setSearch] = useState("");

  const readyPDFs = pdfs.filter((p) => p.status === "ready");
  const filtered = readyPDFs.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (id: string) => {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((i) => i !== id)
        : [...selectedIds, id]
    );
  };

  const selectAll = () => onChange(readyPDFs.map((p) => p._id));
  const clearAll = () => onChange([]);

  return (
    <div className="pdf-selector">
      <div className="selector-header">
        <div className="selector-search">
          <Search size={12} />
          <input
            type="text"
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="selector-actions">
          <button onClick={selectAll} className="selector-action-btn">
            All
          </button>
          <button onClick={clearAll} className="selector-action-btn">
            None
          </button>
          <button onClick={onClose} className="selector-close">
            <X size={14} />
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="selector-empty">
          {readyPDFs.length === 0
            ? "No processed documents. Upload PDFs first."
            : "No documents match your search"}
        </div>
      ) : (
        <div className="selector-list">
          {filtered.map((pdf) => {
            const selected = selectedIds.includes(pdf._id);
            return (
              <button
                key={pdf._id}
                onClick={() => toggle(pdf._id)}
                className={cn("selector-item", selected && "selector-item-selected")}
              >
                <div className="selector-check">
                  {selected ? <Check size={11} /> : null}
                </div>
                <FileText size={14} className="pdf-icon" />
                <div className="selector-info">
                  <span className="selector-name">{pdf.name}</span>
                  <span className="selector-meta">
                    {pdf.pages} pages · {formatFileSize(pdf.size)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <style>{`
        .pdf-selector {
          background: var(--bg-elevated);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-lg);
          overflow: hidden;
          max-height: 300px;
          display: flex; flex-direction: column;
        }

        .selector-header {
          display: flex; align-items: center; gap: 8px;
          padding: 10px 12px;
          border-bottom: 1px solid var(--border-subtle);
        }

        .selector-search {
          flex: 1; display: flex; align-items: center; gap: 7px;
          background: var(--bg-muted); border-radius: var(--radius-md);
          padding: 5px 10px;
        }
        .selector-search svg { color: var(--text-placeholder); flex-shrink: 0; }
        .selector-search input {
          border: none; background: none; outline: none;
          font-size: 0.8rem; color: var(--text-primary); width: 100%;
        }
        .selector-search input::placeholder { color: var(--text-placeholder); }

        .selector-actions { display: flex; align-items: center; gap: 6px; }
        .selector-action-btn {
          background: none; border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm); padding: 4px 8px;
          font-size: 0.72rem; color: var(--text-muted); cursor: pointer;
          transition: all var(--transition-fast);
        }
        .selector-action-btn:hover {
          background: var(--bg-muted); color: var(--text-primary);
        }
        .selector-close {
          background: none; border: none; cursor: pointer;
          color: var(--text-muted); display: flex; align-items: center;
          padding: 4px;
          transition: color var(--transition-fast);
        }
        .selector-close:hover { color: var(--text-primary); }

        .selector-list {
          overflow-y: auto; padding: 6px;
        }

        .selector-item {
          display: flex; align-items: center; gap: 10px;
          width: 100%; padding: 8px 10px;
          background: none; border: none; cursor: pointer;
          border-radius: var(--radius-md); text-align: left;
          transition: background var(--transition-fast);
        }
        .selector-item:hover { background: var(--bg-muted); }
        .selector-item-selected { background: var(--accent-50) !important; }
        .dark .selector-item-selected { background: rgba(99,102,241,0.08) !important; }

        .selector-check {
          width: 16px; height: 16px;
          border: 1.5px solid var(--border-default);
          border-radius: 4px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
        }
        .selector-item-selected .selector-check {
          background: var(--accent-600); border-color: var(--accent-600); color: white;
        }

        .pdf-icon { color: var(--text-muted); flex-shrink: 0; }
        .selector-item-selected .pdf-icon { color: var(--accent-600); }

        .selector-info { flex: 1; min-width: 0; }
        .selector-name {
          display: block; font-size: 0.825rem; font-weight: 500;
          color: var(--text-primary);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .selector-meta {
          font-size: 0.72rem; color: var(--text-muted);
        }

        .selector-empty {
          padding: 20px; text-align: center;
          font-size: 0.825rem; color: var(--text-muted);
        }
      `}</style>
    </div>
  );
}
