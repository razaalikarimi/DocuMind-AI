"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Square,
  RotateCcw,
  FileText,
  Sparkles,
  Paperclip,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { PDFSelector } from "./PDFSelector";
import type { Chat, PDF, MessageSource } from "@/types";

interface ChatInterfaceProps {
  chatId?: string;
  initialChat?: Chat;
  workspaceId: string;
  availablePDFs: PDF[];
}

// Helper to extract text from a UIMessage parts
const getMessageContent = (message: any): string => {
  if (typeof message.content === "string") return message.content;
  if (Array.isArray(message.parts)) {
    return message.parts
      .map((part: any) => (part.type === "text" ? part.text : ""))
      .join("");
  }
  return "";
};

export function ChatInterface({
  chatId,
  initialChat,
  workspaceId,
  availablePDFs,
}: ChatInterfaceProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [selectedPDFIds, setSelectedPDFIds] = useState<string[]>([]);
  const [showPDFSelector, setShowPDFSelector] = useState(false);
  const [activeChatId, setActiveChatId] = useState(chatId);
  const [input, setInput] = useState("");

  const activeChatIdRef = useRef(activeChatId);
  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  const selectedPDFIdsRef = useRef(selectedPDFIds);
  useEffect(() => {
    selectedPDFIdsRef.current = selectedPDFIds;
  }, [selectedPDFIds]);

  // Load chat messages via query
  const { data: chatData } = useQuery({
    queryKey: ["chat", activeChatId],
    queryFn: async () => {
      if (!activeChatId) return null;
      const res = await fetch(`/api/chats/${activeChatId}`);
      if (!res.ok) throw new Error("Failed to fetch chat");
      const json = await res.json();
      return json.data as { chat: Chat; messages: any[] };
    },
    enabled: !!activeChatId,
  });

  const initialMessages = chatData?.messages
    ? chatData.messages.map((msg) => ({
        id: msg._id?.toString() || msg.id,
        role: msg.role,
        parts: [{ type: "text" as const, text: msg.content }],
      }))
    : [];

  const transport = new DefaultChatTransport({
    api: "/api/chat",
    body: () => ({
      chatId: activeChatIdRef.current,
      workspaceId,
      pdfIds: selectedPDFIdsRef.current,
    }),
    fetch: async (reqInput, reqInit) => {
      const response = await fetch(reqInput, reqInit);
      const newChatId = response.headers.get("X-Chat-Id");
      if (newChatId && !activeChatIdRef.current) {
        setActiveChatId(newChatId);
        router.replace(`/chat/${newChatId}`, { scroll: false });
        queryClient.invalidateQueries({ queryKey: ["chats"] });
      }
      return response;
    },
  });

  const {
    messages,
    sendMessage,
    status,
    stop,
    regenerate,
    error,
  } = useChat({
    id: activeChatId,
    messages: initialMessages as any,
    transport,
    onFinish: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });

  const isLoading = status === "streaming" || status === "submitted";

  // Auto-scroll to bottom
  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? "smooth" : "instant",
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Textarea auto-resize
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
  };

  const handleSubmit = (e?: React.FormEvent | { preventDefault?: () => void }) => {
    e?.preventDefault?.();
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input });
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "52px";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        handleSubmit(e);
      }
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="chat-interface">
      {/* Messages Area */}
      <div className="messages-area">
        {isEmpty ? (
          <EmptyState
            workspaceName="My Workspace"
            pdfCount={availablePDFs.length}
            onSuggestionClick={(suggestion) => {
              setInput(suggestion);
              inputRef.current?.focus();
            }}
          />
        ) : (
          <div className="messages-list">
            <AnimatePresence initial={false}>
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <MessageBubble
                    message={{
                      id: message.id,
                      role: message.role,
                      content: getMessageContent(message),
                    }}
                    isLast={index === messages.length - 1}
                    isStreaming={isLoading && index === messages.length - 1}
                    onRegenerate={
                      message.role === "assistant" &&
                      index === messages.length - 1
                        ? regenerate
                        : undefined
                    }
                  />
                </motion.div>
              ))}
            </AnimatePresence>

            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <TypingIndicator />
              </motion.div>
            )}

            {error && (
              <div className="chat-error">
                <p>Something went wrong. Please try again.</p>
                <button onClick={() => regenerate()} className="retry-btn">
                  <RotateCcw size={14} />
                  Retry
                </button>
              </div>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* PDF Selector */}
      <AnimatePresence>
        {showPDFSelector && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="pdf-selector-wrapper"
          >
            <PDFSelector
              pdfs={availablePDFs}
              selectedIds={selectedPDFIds}
              onChange={setSelectedPDFIds}
              onClose={() => setShowPDFSelector(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="input-area">
        {selectedPDFIds.length > 0 && (
          <div className="selected-pdfs">
            {selectedPDFIds.map((id) => {
              const pdf = availablePDFs.find((p) => p._id === id);
              if (!pdf) return null;
              return (
                <div key={id} className="pdf-chip">
                  <FileText size={11} />
                  <span>{pdf.name}</span>
                  <button
                    onClick={() =>
                      setSelectedPDFIds((prev) => prev.filter((i) => i !== id))
                    }
                    className="chip-remove"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div className="input-box">
          <button
            onClick={() => setShowPDFSelector(!showPDFSelector)}
            className={cn(
              "input-action-btn",
              showPDFSelector && "input-action-btn-active"
            )}
            title="Select documents"
          >
            <Paperclip size={16} />
            {selectedPDFIds.length > 0 && (
              <span className="pdf-count">{selectedPDFIds.length}</span>
            )}
          </button>

          <textarea
            ref={inputRef}
            value={input}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder={
              selectedPDFIds.length > 0
                ? `Ask anything about your ${selectedPDFIds.length} selected document${selectedPDFIds.length > 1 ? "s" : ""}...`
                : "Ask anything about your documents..."
            }
            disabled={isLoading}
            rows={1}
            className="chat-textarea"
          />

          {isLoading ? (
            <button onClick={stop} className="stop-btn" title="Stop generation">
              <Square size={14} fill="currentColor" />
            </button>
          ) : (
            <button
              onClick={(e) => handleSubmit(e)}
              disabled={!input.trim()}
              className={cn(
                "send-btn",
                !input.trim() && "send-btn-disabled"
              )}
              title="Send message (Enter)"
            >
              <Send size={15} />
            </button>
          )}
        </div>

        <p className="input-hint">
          Press <kbd>Enter</kbd> to send · <kbd>Shift+Enter</kbd> for new line
        </p>
      </div>

      <style>{`
        .chat-interface {
          display: flex; flex-direction: column;
          height: 100%; max-width: 860px;
          margin: 0 auto; width: 100%;
        }
        .messages-area { flex: 1; overflow-y: auto; padding: 24px 24px 0; }
        .messages-list { display: flex; flex-direction: column; gap: 0; padding-bottom: 24px; }
        .pdf-selector-wrapper { padding: 0 24px 8px; }
        .input-area {
          padding: 12px 24px 20px;
          border-top: 1px solid var(--border-subtle);
          background: var(--bg-base);
        }
        .selected-pdfs { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
        .pdf-chip {
          display: inline-flex; align-items: center; gap: 5px;
          background: var(--accent-50); border: 1px solid var(--accent-200);
          padding: 3px 8px 3px 6px; border-radius: 999px;
          font-size: 0.75rem; color: var(--accent-700);
        }
        .dark .pdf-chip { background: rgba(99,102,241,0.1); border-color: rgba(99,102,241,0.2); color: var(--accent-400); }
        .chip-remove { background: none; border: none; cursor: pointer; color: var(--accent-500); font-size: 1rem; line-height: 1; padding: 0 0 0 2px; }
        .chip-remove:hover { color: var(--error-500); }
        .input-box {
          display: flex; align-items: flex-end; gap: 8px;
          background: var(--bg-elevated);
          border: 1.5px solid var(--border-default);
          border-radius: var(--radius-xl);
          padding: 10px 10px 10px 14px;
          transition: border-color var(--transition-fast);
        }
        .input-box:focus-within { border-color: var(--accent-400); }
        .input-action-btn {
          position: relative; width: 32px; height: 32px;
          border-radius: var(--radius-md); background: none; border: none;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          color: var(--text-muted); flex-shrink: 0;
          transition: all var(--transition-fast); align-self: flex-end;
        }
        .input-action-btn:hover { background: var(--bg-muted); color: var(--text-primary); }
        .input-action-btn-active { color: var(--accent-600); background: var(--accent-50); }
        .pdf-count {
          position: absolute; top: -2px; right: -2px;
          width: 14px; height: 14px; border-radius: 50%;
          background: var(--accent-600); color: white;
          font-size: 0.6rem; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
        }
        .chat-textarea {
          flex: 1; background: none; border: none; outline: none;
          resize: none; font-size: 0.9375rem; color: var(--text-primary);
          line-height: 1.5; min-height: 24px; max-height: 200px;
          font-family: inherit;
        }
        .chat-textarea::placeholder { color: var(--text-placeholder); }
        .chat-textarea:disabled { opacity: 0.6; }
        .send-btn {
          width: 36px; height: 36px; border-radius: var(--radius-lg);
          background: var(--accent-600); color: white; border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; align-self: flex-end;
          transition: all var(--transition-fast);
        }
        .send-btn:hover { background: var(--accent-700); transform: scale(1.05); }
        .send-btn-disabled { background: var(--border-default); color: var(--text-placeholder); cursor: not-allowed; }
        .send-btn-disabled:hover { transform: none; }
        .stop-btn {
          width: 36px; height: 36px; border-radius: var(--radius-lg);
          background: var(--bg-muted); color: var(--text-primary);
          border: 1.5px solid var(--border-default); cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; align-self: flex-end;
          transition: all var(--transition-fast);
        }
        .stop-btn:hover { background: var(--error-500); color: white; border-color: var(--error-500); }
        .input-hint { font-size: 0.72rem; color: var(--text-placeholder); text-align: center; margin-top: 8px; }
        .input-hint kbd {
          display: inline-block; background: var(--bg-muted);
          border: 1px solid var(--border-default); border-radius: 4px;
          padding: 1px 5px; font-size: 0.68rem; font-family: monospace;
        }
        .chat-error {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 16px; border-radius: var(--radius-lg);
          background: rgba(239,68,68,0.05); border: 1px solid rgba(239,68,68,0.2);
          color: var(--error-500); font-size: 0.875rem; margin: 8px 0;
        }
        .retry-btn {
          display: flex; align-items: center; gap: 6px;
          background: none; border: 1px solid var(--error-500);
          color: var(--error-500); padding: 4px 10px;
          border-radius: var(--radius-md); cursor: pointer;
          font-size: 0.8rem; font-weight: 500;
          transition: all var(--transition-fast);
        }
        .retry-btn:hover { background: var(--error-500); color: white; }

        /* Empty State */
        .empty-state {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; height: 100%;
          text-align: center; padding: 60px 24px; gap: 24px;
        }
        .empty-icon {
          width: 56px; height: 56px;
          background: linear-gradient(135deg, var(--accent-500), var(--teal-500));
          border-radius: var(--radius-xl);
          display: flex; align-items: center; justify-content: center; color: white;
        }
        .empty-title { font-size: 1.25rem; font-weight: 600; margin-bottom: 6px; }
        .empty-subtitle { font-size: 0.875rem; color: var(--text-muted); }
        .suggestions-grid {
          display: grid; grid-template-columns: repeat(2, 1fr);
          gap: 10px; max-width: 560px; width: 100%; margin-top: 8px;
        }
        .suggestion-card {
          background: var(--bg-elevated); border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg); padding: 14px 16px;
          text-align: left; cursor: pointer;
          transition: all var(--transition-fast);
          font-size: 0.8rem; color: var(--text-secondary); line-height: 1.4;
        }
        .suggestion-card:hover {
          border-color: var(--accent-300); background: var(--accent-50);
          color: var(--text-primary); transform: translateY(-1px); box-shadow: var(--shadow-sm);
        }
        .dark .suggestion-card:hover { background: rgba(99,102,241,0.08); border-color: rgba(99,102,241,0.3); }
      `}</style>
    </div>
  );
}

function EmptyState({
  workspaceName,
  pdfCount,
  onSuggestionClick,
}: {
  workspaceName: string;
  pdfCount: number;
  onSuggestionClick: (s: string) => void;
}) {
  const suggestions = [
    "Summarize the key points of this document",
    "What are the main conclusions?",
    "List all action items and deadlines",
    "Explain the methodology used",
  ];

  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Sparkles size={26} />
      </div>
      <div>
        <h2 className="empty-title">How can I help you today?</h2>
        <p className="empty-subtitle">
          {pdfCount > 0
            ? "Select documents and start asking questions"
            : "Upload PDFs to start chatting with your documents"}
        </p>
      </div>
      {pdfCount > 0 && (
        <div className="suggestions-grid">
          {suggestions.map((s) => (
            <button key={s} onClick={() => onSuggestionClick(s)} className="suggestion-card">
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
