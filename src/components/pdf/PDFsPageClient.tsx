"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  Upload,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  Search,
  Plus,
  FileUp,
} from "lucide-react";
import { PDFUploader } from "./PDFUploader";
import { cn, formatFileSize, formatRelativeDate } from "@/utils/cn";
import type { PDF } from "@/types";

interface PDFsPageClientProps {
  userId: string;
}

const STATUS_CONFIG = {
  uploading: { icon: <Loader2 size={13} className="spin" />, label: "Uploading", color: "status-uploading" },
  queued: { icon: <Clock size={13} />, label: "Queued", color: "status-queued" },
  processing: { icon: <Loader2 size={13} className="spin" />, label: "Processing", color: "status-processing" },
  ready: { icon: <CheckCircle2 size={13} />, label: "Ready", color: "status-ready" },
  failed: { icon: <AlertCircle size={13} />, label: "Failed", color: "status-failed" },
};

export function PDFsPageClient({ userId }: PDFsPageClientProps) {
  const queryClient = useQueryClient();
  const [showUploader, setShowUploader] = useState(false);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [workspaceId, setWorkspaceId] = useState("");

  // Fetch workspace
  const { data: workspacesData } = useQuery({
    queryKey: ["workspaces"],
    queryFn: async () => {
      const res = await fetch("/api/workspaces");
      const data = await res.json();
      if (data.data?.[0]?._id) setWorkspaceId(data.data[0]._id);
      return data;
    },
  });

  // Fetch PDFs
  const { data: pdfsData, isLoading } = useQuery({
    queryKey: ["pdfs"],
    queryFn: async () => {
      const res = await fetch("/api/pdfs?limit=100");
      return res.json();
    },
    refetchInterval: (query) => {
      // Poll while any PDF is processing
      const pdfs: PDF[] = query.state.data?.data ?? [];
      const hasProcessing = pdfs.some(
        (p) => p.status === "processing" || p.status === "queued"
      );
      return hasProcessing ? 3000 : false;
    },
  });

  const pdfs: PDF[] = pdfsData?.data ?? [];
  const filtered = pdfs.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  // Delete
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/pdfs/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["pdfs"] }),
  });

  // Rename
  const renameMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const res = await fetch(`/api/pdfs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error("Failed to rename");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pdfs"] });
      setEditingId(null);
    },
  });

  const stats = {
    total: pdfs.length,
    ready: pdfs.filter((p) => p.status === "ready").length,
    processing: pdfs.filter((p) => ["queued", "processing", "uploading"].includes(p.status)).length,
  };

  return (
    <div className="pdfs-page">
      {/* Header */}
      <div className="pdfs-header">
        <div>
          <h1 className="pdfs-title">Documents</h1>
          <p className="pdfs-subtitle">
            {stats.total} document{stats.total !== 1 ? "s" : ""} ·{" "}
            {stats.ready} ready · {stats.processing} processing
          </p>
        </div>
        <button
          onClick={() => setShowUploader(!showUploader)}
          className={cn("upload-toggle-btn", showUploader && "upload-toggle-btn-active")}
        >
          <Plus size={16} />
          Upload PDFs
        </button>
      </div>

      {/* Upload Section */}
      <AnimatePresence>
        {showUploader && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="uploader-section"
          >
            {workspaceId && (
              <PDFUploader
                workspaceId={workspaceId}
                onUploadComplete={() => {
                  queryClient.invalidateQueries({ queryKey: ["pdfs"] });
                }}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search */}
      <div className="pdfs-search">
        <Search size={15} />
        <input
          type="text"
          placeholder="Search documents..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* PDF Grid */}
      {isLoading ? (
        <div className="pdfs-grid">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton pdf-card-skeleton" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="pdfs-empty">
          <FileUp size={40} />
          <h3>{search ? "No documents found" : "No documents yet"}</h3>
          <p>{search ? "Try a different search" : "Upload your first PDF to get started"}</p>
          {!search && (
            <button
              onClick={() => setShowUploader(true)}
              className="upload-toggle-btn"
            >
              <Upload size={16} />
              Upload PDFs
            </button>
          )}
        </div>
      ) : (
        <div className="pdfs-grid">
          <AnimatePresence>
            {filtered.map((pdf, i) => (
              <motion.div
                key={pdf._id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.04 }}
                className="pdf-card"
              >
                {/* PDF Icon */}
                <div className={cn("pdf-card-icon", pdf.status === "ready" ? "icon-ready" : "")}>
                  <FileText size={22} />
                </div>

                {/* Info */}
                <div className="pdf-card-info">
                  {editingId === pdf._id ? (
                    <input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={() =>
                        renameMutation.mutate({ id: pdf._id, name: editName })
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter")
                          renameMutation.mutate({ id: pdf._id, name: editName });
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      className="pdf-name-input"
                    />
                  ) : (
                    <h3 className="pdf-card-name">{pdf.name}</h3>
                  )}
                  <div className="pdf-card-meta">
                    <span>{formatFileSize(pdf.size)}</span>
                    {pdf.pages > 0 && <span>{pdf.pages} pages</span>}
                    <span>{formatRelativeDate(pdf.createdAt)}</span>
                  </div>
                </div>

                {/* Status */}
                <div className={cn("pdf-status", STATUS_CONFIG[pdf.status]?.color)}>
                  {STATUS_CONFIG[pdf.status]?.icon}
                  <span>{STATUS_CONFIG[pdf.status]?.label}</span>
                </div>

                {/* Actions */}
                <div className="pdf-card-actions">
                  <button
                    onClick={() => {
                      setEditingId(pdf._id);
                      setEditName(pdf.name);
                    }}
                    className="pdf-action-btn"
                    title="Rename"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(pdf._id)}
                    className="pdf-action-btn pdf-action-delete"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <style>{`
        .pdfs-page {
          padding: 32px;
          max-width: 1100px;
          margin: 0 auto;
          overflow-y: auto;
          height: 100%;
        }

        .pdfs-header {
          display: flex; align-items: flex-start;
          justify-content: space-between; gap: 16px;
          margin-bottom: 24px;
        }

        .pdfs-title {
          font-size: 1.5rem; font-weight: 700; margin-bottom: 4px;
        }
        .pdfs-subtitle { font-size: 0.875rem; color: var(--text-muted); }

        .upload-toggle-btn {
          display: flex; align-items: center; gap: 8px;
          background: var(--accent-600); color: white;
          padding: 10px 18px; border-radius: var(--radius-lg);
          font-size: 0.875rem; font-weight: 600;
          border: none; cursor: pointer;
          transition: all var(--transition-fast); flex-shrink: 0;
        }
        .upload-toggle-btn:hover {
          background: var(--accent-700);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(99,102,241,0.3);
        }
        .upload-toggle-btn-active {
          background: var(--bg-muted) !important;
          color: var(--text-primary) !important;
          box-shadow: none !important;
          transform: none !important;
        }

        .uploader-section {
          margin-bottom: 20px; overflow: hidden;
        }

        .pdfs-search {
          display: flex; align-items: center; gap: 10px;
          background: var(--bg-elevated);
          border: 1.5px solid var(--border-default);
          border-radius: var(--radius-lg);
          padding: 10px 14px; margin-bottom: 20px;
          color: var(--text-muted);
          transition: border-color var(--transition-fast);
        }
        .pdfs-search:focus-within { border-color: var(--accent-400); }
        .pdfs-search input {
          border: none; background: none; outline: none;
          font-size: 0.9rem; color: var(--text-primary); width: 100%;
        }
        .pdfs-search input::placeholder { color: var(--text-placeholder); }

        .pdfs-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 12px;
        }

        .pdf-card-skeleton { height: 88px; }

        .pdf-card {
          display: flex; align-items: center; gap: 14px;
          padding: 16px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-xl);
          transition: all var(--transition-normal);
        }
        .pdf-card:hover {
          border-color: var(--accent-200);
          box-shadow: var(--shadow-md);
          transform: translateY(-1px);
        }

        .pdf-card-icon {
          width: 44px; height: 44px; flex-shrink: 0;
          border-radius: var(--radius-md);
          background: var(--bg-muted);
          border: 1px solid var(--border-subtle);
          display: flex; align-items: center; justify-content: center;
          color: var(--text-muted);
        }
        .icon-ready {
          background: var(--accent-50); border-color: var(--accent-100);
          color: var(--accent-600);
        }
        .dark .icon-ready { background: rgba(99,102,241,0.1); border-color: rgba(99,102,241,0.2); }

        .pdf-card-info { flex: 1; min-width: 0; }
        .pdf-card-name {
          font-size: 0.9rem; font-weight: 600; color: var(--text-primary);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          margin-bottom: 4px;
        }
        .pdf-card-meta {
          display: flex; gap: 8px; flex-wrap: wrap;
          font-size: 0.72rem; color: var(--text-muted);
        }
        .pdf-card-meta span::after { content: "·"; margin-left: 8px; }
        .pdf-card-meta span:last-child::after { content: ""; }

        .pdf-name-input {
          width: 100%; padding: 4px 8px;
          background: var(--bg-elevated);
          border: 1.5px solid var(--accent-400);
          border-radius: var(--radius-md);
          font-size: 0.9rem; color: var(--text-primary);
          outline: none;
        }

        .pdf-status {
          display: flex; align-items: center; gap: 5px;
          font-size: 0.72rem; font-weight: 500;
          padding: 3px 8px; border-radius: 999px;
          flex-shrink: 0; white-space: nowrap;
        }
        .status-ready { background: rgba(34,197,94,0.1); color: var(--success-500); }
        .status-processing, .status-uploading {
          background: rgba(99,102,241,0.08); color: var(--accent-600);
        }
        .status-queued { background: var(--bg-muted); color: var(--text-muted); }
        .status-failed { background: rgba(239,68,68,0.08); color: var(--error-500); }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .pdf-card-actions {
          display: flex; gap: 6px; flex-shrink: 0; opacity: 0;
          transition: opacity var(--transition-fast);
        }
        .pdf-card:hover .pdf-card-actions { opacity: 1; }

        .pdf-action-btn {
          width: 30px; height: 30px; border-radius: var(--radius-md);
          background: var(--bg-muted);
          border: 1px solid var(--border-subtle);
          display: flex; align-items: center; justify-content: center;
          color: var(--text-muted); cursor: pointer;
          transition: all var(--transition-fast);
        }
        .pdf-action-btn:hover {
          background: var(--bg-elevated); color: var(--text-primary);
          border-color: var(--border-default);
        }
        .pdf-action-delete:hover { color: var(--error-500); border-color: rgba(239,68,68,0.3); }

        .pdfs-empty {
          display: flex; flex-direction: column; align-items: center;
          gap: 12px; padding: 80px 24px; text-align: center;
          color: var(--text-muted);
        }
        .pdfs-empty h3 { font-size: 1.1rem; color: var(--text-primary); }
        .pdfs-empty p { font-size: 0.875rem; }
      `}</style>
    </div>
  );
}
