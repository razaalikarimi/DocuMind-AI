"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { useUploadThing } from "@/lib/uploadthing-client";
import { useQueryClient } from "@tanstack/react-query";
import {
  Upload,
  FileText,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  CloudUpload,
} from "lucide-react";
import { cn, formatFileSize } from "@/utils/cn";

interface UploadFile {
  id: string;
  file: File;
  status: "pending" | "uploading" | "processing" | "done" | "error";
  progress: number;
  error?: string;
}

interface PDFUploaderProps {
  workspaceId: string;
  onUploadComplete?: () => void;
}

export function PDFUploader({ workspaceId, onUploadComplete }: PDFUploaderProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const queryClient = useQueryClient();

  const { startUpload, isUploading } = useUploadThing("pdfUploader" as never, {
    onUploadProgress: (p) => {
      // Update progress
      setFiles((prev) =>
        prev.map((f) => (f.status === "uploading" ? { ...f, progress: p } : f))
      );
    },
    onClientUploadComplete: async (res) => {
      if (!res) return;

      // Create PDF records in our DB
      for (const uploadedFile of res) {
        try {
          setFiles((prev) =>
            prev.map((f) =>
              f.file.name === uploadedFile.name
                ? { ...f, status: "processing", progress: 100 }
                : f
            )
          );

          await fetch("/api/pdfs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              workspaceId,
              name: uploadedFile.name.replace(".pdf", ""),
              originalName: uploadedFile.name,
              fileUrl: uploadedFile.ufsUrl,
              fileKey: uploadedFile.key,
              size: uploadedFile.size,
            }),
          });

          setFiles((prev) =>
            prev.map((f) =>
              f.file.name === uploadedFile.name
                ? { ...f, status: "done" }
                : f
            )
          );
        } catch {
          setFiles((prev) =>
            prev.map((f) =>
              f.file.name === uploadedFile.name
                ? { ...f, status: "error", error: "Failed to save PDF" }
                : f
            )
          );
        }
      }

      queryClient.invalidateQueries({ queryKey: ["pdfs"] });
      onUploadComplete?.();
    },
    onUploadError: (error) => {
      setFiles((prev) =>
        prev.map((f) =>
          f.status === "uploading"
            ? { ...f, status: "error", error: error.message }
            : f
        )
      );
    },
  });

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const newFiles: UploadFile[] = acceptedFiles.map((file) => ({
        id: Math.random().toString(36).slice(2),
        file,
        status: "uploading",
        progress: 0,
      }));

      setFiles((prev) => [...prev, ...newFiles]);

      try {
        await startUpload(acceptedFiles, undefined as never);
      } catch (error) {
        setFiles((prev) =>
          prev.map((f) =>
            newFiles.find((nf) => nf.id === f.id)
              ? { ...f, status: "error", error: "Upload failed" }
              : f
          )
        );
      }
    },
    [startUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 10,
    maxSize: 100 * 1024 * 1024, // 100MB
    disabled: isUploading,
  });

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <div className="uploader">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          "dropzone",
          isDragActive && "dropzone-active",
          isUploading && "dropzone-disabled"
        )}
      >
        <input {...getInputProps()} />
        <motion.div
          animate={{ scale: isDragActive ? 1.05 : 1 }}
          transition={{ duration: 0.2 }}
          className="dropzone-content"
        >
          <div className="dropzone-icon">
            <CloudUpload size={32} />
          </div>
          <div>
            <p className="dropzone-title">
              {isDragActive
                ? "Drop your PDFs here"
                : "Drag & drop PDFs here"}
            </p>
            <p className="dropzone-subtitle">
              or <span className="dropzone-link">browse files</span> · Up to 10
              PDFs, 100MB each
            </p>
          </div>
        </motion.div>
      </div>

      {/* File List */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="file-list"
          >
            {files.map((f) => (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                className="file-item"
              >
                <div className="file-icon">
                  <FileText size={16} />
                </div>
                <div className="file-info">
                  <span className="file-name">{f.file.name}</span>
                  <span className="file-size">{formatFileSize(f.file.size)}</span>
                  {/* Progress bar */}
                  {(f.status === "uploading" || f.status === "processing") && (
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${f.status === "processing" ? 90 : f.progress}%`,
                        }}
                      />
                    </div>
                  )}
                  {f.error && (
                    <span className="file-error">{f.error}</span>
                  )}
                </div>
                <div className="file-status">
                  {f.status === "uploading" && (
                    <Loader2 size={16} className="status-spinner" />
                  )}
                  {f.status === "processing" && (
                    <span className="status-processing">Processing...</span>
                  )}
                  {f.status === "done" && (
                    <CheckCircle2 size={16} className="status-done" />
                  )}
                  {f.status === "error" && (
                    <AlertCircle size={16} className="status-error" />
                  )}
                  {(f.status === "done" || f.status === "error") && (
                    <button
                      onClick={() => removeFile(f.id)}
                      className="file-remove"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .uploader { display: flex; flex-direction: column; gap: 16px; }

        .dropzone {
          border: 2px dashed var(--border-default);
          border-radius: var(--radius-xl);
          padding: 40px 24px;
          cursor: pointer;
          transition: all var(--transition-normal);
          background: var(--bg-base);
        }
        .dropzone:hover, .dropzone-active {
          border-color: var(--accent-400);
          background: var(--accent-50);
        }
        .dark .dropzone:hover, .dark .dropzone-active {
          background: rgba(99,102,241,0.05);
        }
        .dropzone-disabled {
          opacity: 0.6; cursor: not-allowed; pointer-events: none;
        }
        .dropzone-content {
          display: flex; flex-direction: column; align-items: center;
          gap: 14px; text-align: center;
        }
        .dropzone-icon {
          width: 60px; height: 60px;
          border-radius: var(--radius-xl);
          background: var(--bg-muted);
          border: 1px solid var(--border-subtle);
          display: flex; align-items: center; justify-content: center;
          color: var(--text-muted);
        }
        .dropzone-active .dropzone-icon {
          background: var(--accent-100);
          border-color: var(--accent-300);
          color: var(--accent-600);
        }
        .dark .dropzone-active .dropzone-icon {
          background: rgba(99,102,241,0.15);
          border-color: rgba(99,102,241,0.3);
        }
        .dropzone-title {
          font-size: 1rem; font-weight: 600; color: var(--text-primary);
          margin-bottom: 4px;
        }
        .dropzone-subtitle { font-size: 0.85rem; color: var(--text-muted); }
        .dropzone-link { color: var(--accent-600); font-weight: 500; }

        /* File List */
        .file-list {
          display: flex; flex-direction: column; gap: 8px;
          overflow: hidden;
        }

        .file-item {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 16px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
        }

        .file-icon {
          width: 36px; height: 36px;
          border-radius: var(--radius-md);
          background: var(--accent-50);
          border: 1px solid var(--accent-100);
          display: flex; align-items: center; justify-content: center;
          color: var(--accent-600); flex-shrink: 0;
        }
        .dark .file-icon { background: rgba(99,102,241,0.1); border-color: rgba(99,102,241,0.2); }

        .file-info { flex: 1; min-width: 0; }
        .file-name {
          display: block; font-size: 0.875rem; font-weight: 500;
          color: var(--text-primary);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .file-size { font-size: 0.75rem; color: var(--text-muted); }
        .file-error { font-size: 0.75rem; color: var(--error-500); display: block; }

        .progress-bar {
          height: 3px; background: var(--bg-muted);
          border-radius: 999px; margin-top: 6px; overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--accent-500), var(--teal-500));
          border-radius: 999px;
          transition: width 0.3s ease;
        }

        .file-status { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .status-spinner { color: var(--accent-500); animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .status-processing { font-size: 0.75rem; color: var(--text-muted); }
        .status-done { color: var(--success-500); }
        .status-error { color: var(--error-500); }
        .file-remove {
          background: none; border: none; cursor: pointer;
          color: var(--text-muted);
          display: flex; align-items: center; justify-content: center;
          width: 22px; height: 22px; border-radius: 50%;
          transition: all var(--transition-fast);
        }
        .file-remove:hover { background: var(--bg-muted); color: var(--error-500); }
      `}</style>
    </div>
  );
}
