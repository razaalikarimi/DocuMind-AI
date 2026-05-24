"use client";

export function TypingIndicator() {
  return (
    <div className="typing-row">
      <div className="typing-avatar">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
          <path d="M7 0.5L8.5 5.5H13.5L9.5 8.5L11 13.5L7 10.5L3 13.5L4.5 8.5L0.5 5.5H5.5L7 0.5Z" />
        </svg>
      </div>
      <div className="typing-bubble">
        <div className="typing-dots">
          <span className="dot" style={{ animationDelay: "0ms" }} />
          <span className="dot" style={{ animationDelay: "150ms" }} />
          <span className="dot" style={{ animationDelay: "300ms" }} />
        </div>
      </div>

      <style>{`
        .typing-row {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px 0;
        }

        .typing-avatar {
          width: 32px; height: 32px;
          border-radius: var(--radius-md);
          background: linear-gradient(135deg, var(--accent-500), var(--teal-500));
          display: flex; align-items: center; justify-content: center;
          color: white; flex-shrink: 0;
        }

        .typing-bubble {
          background: var(--bg-muted);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-xl);
          padding: 14px 18px;
          display: inline-flex;
        }

        .typing-dots {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: var(--text-muted);
          animation: typing-dot 1.2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
