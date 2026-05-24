"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";
import { Copy, Check, RotateCcw, User, Sparkles } from "lucide-react";
import { cn } from "@/utils/cn";

// Use a plain type that matches both AI SDK message shapes
interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
}

interface MessageBubbleProps {
  message: ChatMessage;
  isLast: boolean;
  isStreaming?: boolean;
  onRegenerate?: () => void;
}

export function MessageBubble({
  message,
  isLast,
  isStreaming,
  onRegenerate,
}: MessageBubbleProps) {
  const isUser = message.role === "user";
  const content = typeof message.content === "string" 
    ? message.content 
    : "";

  return (
    <div className={cn("message-row", isUser && "message-row-user")}>
      {!isUser && (
        <div className="message-avatar assistant-avatar">
          <Sparkles size={14} />
        </div>
      )}

      <div className={cn("message-bubble", isUser ? "bubble-user" : "bubble-assistant")}>
        {isUser ? (
          <p className="user-text">{content}</p>
        ) : (
          <>
            <div className="chat-content">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code(props) {
                    const { className, children, ...rest } = props;
                    const match = /language-(\w+)/.exec(className || "");
                    const isBlock = Boolean(match);
                    return isBlock ? (
                      <CodeBlock
                        language={match?.[1]}
                        code={String(children).replace(/\n$/, "")}
                      />
                    ) : (
                      <code className={className} {...rest}>
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {content}
              </ReactMarkdown>
            </div>

            {isStreaming && <span className="streaming-cursor" />}

            {!isStreaming && isLast && (
              <div className="message-actions">
                <CopyButton text={content} />
                {onRegenerate && (
                  <button
                    onClick={onRegenerate}
                    className="msg-action-btn"
                    title="Regenerate response"
                  >
                    <RotateCcw size={13} />
                    <span>Regenerate</span>
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {isUser && (
        <div className="message-avatar user-avatar">
          <User size={14} />
        </div>
      )}

      <style>{`
        .message-row { display: flex; align-items: flex-start; gap: 12px; padding: 12px 0; max-width: 100%; }
        .message-row-user { flex-direction: row-reverse; }
        .message-avatar {
          width: 32px; height: 32px; border-radius: var(--radius-md);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; margin-top: 2px;
        }
        .assistant-avatar { background: linear-gradient(135deg, var(--accent-500), var(--teal-500)); color: white; }
        .user-avatar { background: var(--bg-muted); border: 1px solid var(--border-subtle); color: var(--text-muted); }
        .message-bubble { flex: 1; max-width: calc(100% - 56px); }
        .bubble-user {
          background: var(--accent-600);
          border-radius: var(--radius-xl) var(--radius-xl) var(--radius-sm) var(--radius-xl);
          padding: 12px 16px; max-width: 72%; align-self: flex-end;
        }
        .bubble-assistant { background: transparent; max-width: 100%; }
        .user-text { color: white !important; font-size: 0.9375rem; line-height: 1.5; white-space: pre-wrap; }
        .streaming-cursor {
          display: inline-block; width: 2px; height: 18px;
          background: var(--accent-500); margin-left: 2px;
          vertical-align: middle; animation: blink 1s step-end infinite;
        }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        .message-actions {
          display: flex; align-items: center; gap: 6px; margin-top: 10px;
          opacity: 0; transition: opacity var(--transition-fast);
        }
        .message-row:hover .message-actions { opacity: 1; }
        .msg-action-btn {
          display: flex; align-items: center; gap: 5px;
          background: none; border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md); padding: 4px 8px; cursor: pointer;
          font-size: 0.75rem; color: var(--text-muted);
          transition: all var(--transition-fast);
        }
        .msg-action-btn:hover { background: var(--bg-muted); color: var(--text-primary); border-color: var(--border-default); }
      `}</style>
    </div>
  );
}

// ============================================================
// CODE BLOCK WITH COPY
// ============================================================

function CodeBlock({ code, language }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="code-block">
      <div className="code-header">
        <span className="code-language">{language ?? "code"}</span>
        <button onClick={handleCopy} className="copy-btn">
          {copied ? <Check size={12} /> : <Copy size={12} />}
          <span>{copied ? "Copied!" : "Copy"}</span>
        </button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={oneDark}
        customStyle={{ margin: 0, borderRadius: "0 0 8px 8px", fontSize: "0.8rem", background: "#1a1a2e" }}
        showLineNumbers
      >
        {code}
      </SyntaxHighlighter>
      <style>{`
        .code-block { border-radius: var(--radius-md); overflow: hidden; border: 1px solid var(--border-subtle); margin: 8px 0; }
        .code-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 8px 14px; background: #1a1a2e;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .code-language { font-size: 0.72rem; font-family: monospace; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 0.5px; }
        .copy-btn {
          display: flex; align-items: center; gap: 5px;
          background: rgba(255,255,255,0.08); border: none;
          border-radius: var(--radius-sm); padding: 4px 8px; cursor: pointer;
          font-size: 0.72rem; color: rgba(255,255,255,0.5);
          transition: all var(--transition-fast);
        }
        .copy-btn:hover { background: rgba(255,255,255,0.15); color: rgba(255,255,255,0.9); }
      `}</style>
    </div>
  );
}

// ============================================================
// COPY BUTTON
// ============================================================

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button onClick={handleCopy} className="msg-action-btn" title="Copy response">
      {copied ? <Check size={13} /> : <Copy size={13} />}
      <span>{copied ? "Copied" : "Copy"}</span>
    </button>
  );
}
