"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UserButton, useUser } from "@clerk/nextjs";
import {
  Plus,
  Search,
  MessageSquare,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Pin,
  Trash2,
  Edit2,
  Sparkles,
  FolderOpen,
  MoreHorizontal,
  X,
} from "lucide-react";
import { cn, formatRelativeDate, truncate } from "@/utils/cn";
import { APP_NAME } from "@/constants";
import type { Chat } from "@/types";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useUser();
  const [search, setSearch] = useState("");
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  // Fetch chats
  const { data: chatsData, isLoading } = useQuery({
    queryKey: ["chats"],
    queryFn: async () => {
      const res = await fetch("/api/chats?limit=50");
      if (!res.ok) throw new Error("Failed to fetch chats");
      return res.json();
    },
    refetchInterval: 30000, // Refresh every 30s
  });

  const chats: Chat[] = chatsData?.data ?? [];

  // Filtered chats
  const filteredChats = useMemo(() => {
    if (!search) return chats;
    return chats.filter((c) =>
      c.title.toLowerCase().includes(search.toLowerCase())
    );
  }, [chats, search]);

  const pinnedChats = filteredChats.filter((c) => c.pinned);
  const recentChats = filteredChats.filter((c) => !c.pinned);

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (chatId: string) => {
      const res = await fetch(`/api/chats/${chatId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
      if (pathname.includes(editingChatId ?? "")) {
        router.push("/chat/new");
      }
    },
  });

  // Rename mutation
  const renameMutation = useMutation({
    mutationFn: async ({ chatId, title }: { chatId: string; title: string }) => {
      const res = await fetch(`/api/chats/${chatId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error("Failed to rename");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] });
      setEditingChatId(null);
    },
  });

  // Pin mutation
  const pinMutation = useMutation({
    mutationFn: async ({ chatId, pinned }: { chatId: string; pinned: boolean }) => {
      await fetch(`/api/chats/${chatId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinned }),
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["chats"] }),
  });

  return (
    <>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.aside
            initial={{ x: -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="sidebar"
          >
            {/* Header */}
            <div className="sidebar-header">
              <Link href="/" className="sidebar-logo">
                <div className="sidebar-logo-icon">
                  <Sparkles size={16} />
                </div>
                <span>{APP_NAME}</span>
              </Link>
              <button
                onClick={onToggle}
                className="sidebar-collapse-btn"
                title="Collapse sidebar"
              >
                <ChevronLeft size={16} />
              </button>
            </div>

            {/* New Chat */}
            <div className="sidebar-actions">
              <Link href="/chat/new" className="new-chat-btn">
                <Plus size={16} />
                <span>New Chat</span>
              </Link>
            </div>

            {/* Search */}
            <div className="sidebar-search">
              <Search size={14} className="search-icon" />
              <input
                type="text"
                placeholder="Search chats..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input"
              />
              {search && (
                <button onClick={() => setSearch("")} className="search-clear">
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav">
              <Link
                href="/chat/new"
                className={cn("nav-item", pathname === "/chat/new" && "nav-item-active")}
              >
                <MessageSquare size={15} />
                <span>Chat</span>
              </Link>
              <Link
                href="/pdfs"
                className={cn("nav-item", pathname.startsWith("/pdfs") && "nav-item-active")}
              >
                <FileText size={15} />
                <span>Documents</span>
              </Link>
              <Link
                href="/workspace"
                className={cn("nav-item", pathname.startsWith("/workspace") && "nav-item-active")}
              >
                <FolderOpen size={15} />
                <span>Workspaces</span>
              </Link>
            </nav>

            <div className="sidebar-divider" />

            {/* Chat History */}
            <div className="sidebar-history">
              {isLoading ? (
                <div className="history-loading">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="skeleton chat-skeleton" />
                  ))}
                </div>
              ) : (
                <>
                  {/* Pinned */}
                  {pinnedChats.length > 0 && (
                    <div className="history-group">
                      <div className="history-group-label">
                        <Pin size={10} />
                        <span>Pinned</span>
                      </div>
                      {pinnedChats.map((chat) => (
                        <ChatItem
                          key={chat._id}
                          chat={chat}
                          isActive={pathname === `/chat/${chat._id}`}
                          isEditing={editingChatId === chat._id}
                          editTitle={editTitle}
                          onStartEdit={() => {
                            setEditingChatId(chat._id);
                            setEditTitle(chat.title);
                          }}
                          onSaveEdit={() =>
                            renameMutation.mutate({ chatId: chat._id, title: editTitle })
                          }
                          onEditTitleChange={setEditTitle}
                          onDelete={() => deleteMutation.mutate(chat._id)}
                          onPin={() =>
                            pinMutation.mutate({ chatId: chat._id, pinned: !chat.pinned })
                          }
                        />
                      ))}
                    </div>
                  )}

                  {/* Recent */}
                  {recentChats.length > 0 && (
                    <div className="history-group">
                      {pinnedChats.length > 0 && (
                        <div className="history-group-label">
                          <span>Recent</span>
                        </div>
                      )}
                      {recentChats.map((chat) => (
                        <ChatItem
                          key={chat._id}
                          chat={chat}
                          isActive={pathname === `/chat/${chat._id}`}
                          isEditing={editingChatId === chat._id}
                          editTitle={editTitle}
                          onStartEdit={() => {
                            setEditingChatId(chat._id);
                            setEditTitle(chat.title);
                          }}
                          onSaveEdit={() =>
                            renameMutation.mutate({ chatId: chat._id, title: editTitle })
                          }
                          onEditTitleChange={setEditTitle}
                          onDelete={() => deleteMutation.mutate(chat._id)}
                          onPin={() =>
                            pinMutation.mutate({ chatId: chat._id, pinned: !chat.pinned })
                          }
                        />
                      ))}
                    </div>
                  )}

                  {filteredChats.length === 0 && (
                    <div className="history-empty">
                      <MessageSquare size={28} />
                      <p>{search ? "No chats found" : "No conversations yet"}</p>
                      <span>Start a new chat above</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="sidebar-footer">
              <Link
                href="/settings"
                className={cn("nav-item", pathname.startsWith("/settings") && "nav-item-active")}
              >
                <Settings size={15} />
                <span>Settings</span>
              </Link>
              <div className="sidebar-user">
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "w-8 h-8",
                    },
                  }}
                />
                <div className="user-info">
                  <span className="user-name">{user?.firstName ?? "User"}</span>
                  <span className="user-plan">Free Plan</span>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Toggle button when collapsed */}
      {!isOpen && (
        <button onClick={onToggle} className="sidebar-open-btn">
          <ChevronRight size={16} />
        </button>
      )}

      <style>{`
        .sidebar {
          width: 280px;
          height: 100vh;
          display: flex;
          flex-direction: column;
          background: var(--bg-subtle);
          border-right: 1px solid var(--border-subtle);
          overflow: hidden;
          flex-shrink: 0;
          position: relative;
          z-index: 30;
        }

        .sidebar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 16px 12px;
        }

        .sidebar-logo {
          display: flex; align-items: center; gap: 9px;
          font-family: 'Outfit', sans-serif;
          font-size: 0.95rem; font-weight: 700;
          color: var(--text-primary) !important;
        }

        .sidebar-logo-icon {
          width: 30px; height: 30px; border-radius: 9px;
          background: linear-gradient(135deg, var(--accent-500), var(--teal-500));
          display: flex; align-items: center; justify-content: center;
          color: white;
        }

        .sidebar-collapse-btn {
          width: 28px; height: 28px; border-radius: var(--radius-md);
          background: transparent; border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          color: var(--text-muted);
          transition: all var(--transition-fast);
        }
        .sidebar-collapse-btn:hover {
          background: var(--bg-muted); color: var(--text-primary);
        }

        .sidebar-actions { padding: 4px 12px 12px; }

        .new-chat-btn {
          display: flex; align-items: center; gap: 8px;
          width: 100%; padding: 9px 14px;
          background: var(--accent-600); color: white !important;
          border-radius: var(--radius-lg); font-size: 0.875rem;
          font-weight: 600; transition: all var(--transition-fast);
          border: none; cursor: pointer;
        }
        .new-chat-btn:hover {
          background: var(--accent-700);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }

        .sidebar-search {
          margin: 0 12px 8px;
          position: relative; display: flex; align-items: center;
        }
        .search-icon {
          position: absolute; left: 10px;
          color: var(--text-placeholder); pointer-events: none;
        }
        .search-input {
          width: 100%; padding: 8px 32px 8px 32px;
          background: var(--bg-muted);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          font-size: 0.8rem; color: var(--text-primary);
          outline: none; transition: all var(--transition-fast);
        }
        .search-input::placeholder { color: var(--text-placeholder); }
        .search-input:focus {
          border-color: var(--accent-400);
          background: var(--bg-elevated);
        }
        .search-clear {
          position: absolute; right: 8px;
          background: none; border: none; cursor: pointer;
          color: var(--text-muted); display: flex;
          align-items: center; justify-content: center;
          width: 18px; height: 18px; border-radius: 50%;
        }
        .search-clear:hover { background: var(--bg-elevated); color: var(--text-primary); }

        .sidebar-nav {
          display: flex; flex-direction: column; gap: 2px; padding: 4px 12px;
        }

        .nav-item {
          display: flex; align-items: center; gap: 9px;
          padding: 8px 10px; border-radius: var(--radius-md);
          font-size: 0.85rem; font-weight: 500;
          color: var(--text-muted) !important;
          transition: all var(--transition-fast);
        }
        .nav-item:hover {
          background: var(--bg-muted);
          color: var(--text-primary) !important;
        }
        .nav-item-active {
          background: var(--bg-muted);
          color: var(--text-primary) !important;
        }

        .sidebar-divider {
          height: 1px; background: var(--border-subtle);
          margin: 8px 12px;
        }

        .sidebar-history {
          flex: 1; overflow-y: auto; padding: 4px 8px;
        }

        .history-loading { display: flex; flex-direction: column; gap: 6px; padding: 4px; }
        .chat-skeleton { height: 40px; }

        .history-group { margin-bottom: 8px; }
        .history-group-label {
          display: flex; align-items: center; gap: 5px;
          padding: 4px 8px; margin-bottom: 2px;
          font-size: 0.7rem; font-weight: 600;
          text-transform: uppercase; letter-spacing: 0.8px;
          color: var(--text-placeholder);
        }

        .history-empty {
          display: flex; flex-direction: column; align-items: center;
          gap: 8px; padding: 40px 16px; text-align: center;
          color: var(--text-muted);
        }
        .history-empty p { font-size: 0.875rem; font-weight: 500; }
        .history-empty span { font-size: 0.78rem; color: var(--text-placeholder); }

        .sidebar-footer {
          padding: 8px 12px 16px;
          border-top: 1px solid var(--border-subtle);
          display: flex; flex-direction: column; gap: 4px;
        }

        .sidebar-user {
          display: flex; align-items: center; gap: 10px;
          padding: 10px; border-radius: var(--radius-md);
        }
        .user-info { display: flex; flex-direction: column; }
        .user-name { font-size: 0.8rem; font-weight: 600; color: var(--text-primary); }
        .user-plan { font-size: 0.7rem; color: var(--text-muted); }

        .sidebar-open-btn {
          position: fixed; top: 14px; left: 14px; z-index: 20;
          width: 34px; height: 34px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-md);
          display: flex; align-items: center; justify-content: center;
          color: var(--text-muted); cursor: pointer;
          transition: all var(--transition-fast);
          box-shadow: var(--shadow-sm);
        }
        .sidebar-open-btn:hover {
          color: var(--text-primary);
          box-shadow: var(--shadow-md);
        }
      `}</style>
    </>
  );
}

// ============================================================
// CHAT ITEM COMPONENT
// ============================================================

interface ChatItemProps {
  chat: Chat;
  isActive: boolean;
  isEditing: boolean;
  editTitle: string;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onEditTitleChange: (v: string) => void;
  onDelete: () => void;
  onPin: () => void;
}

function ChatItem({
  chat,
  isActive,
  isEditing,
  editTitle,
  onStartEdit,
  onSaveEdit,
  onEditTitleChange,
  onDelete,
  onPin,
}: ChatItemProps) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className={cn("chat-item-wrapper", isActive && "chat-item-active")}>
      {isEditing ? (
        <input
          autoFocus
          value={editTitle}
          onChange={(e) => onEditTitleChange(e.target.value)}
          onBlur={onSaveEdit}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSaveEdit();
            if (e.key === "Escape") onEditTitleChange(chat.title);
          }}
          className="chat-item-edit-input"
        />
      ) : (
        <Link href={`/chat/${chat._id}`} className="chat-item-link">
          <MessageSquare size={13} className="chat-item-icon" />
          <div className="chat-item-content">
            <span className="chat-item-title">{truncate(chat.title, 28)}</span>
            <span className="chat-item-date">
              {formatRelativeDate(chat.updatedAt)}
            </span>
          </div>
        </Link>
      )}

      <div className="chat-item-actions">
        <button
          onClick={(e) => {
            e.preventDefault();
            setShowMenu(!showMenu);
          }}
          className="chat-action-btn"
        >
          <MoreHorizontal size={13} />
        </button>

        <AnimatePresence>
          {showMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -4 }}
              transition={{ duration: 0.12 }}
              className="chat-context-menu"
              onMouseLeave={() => setShowMenu(false)}
            >
              <button
                onClick={() => { onStartEdit(); setShowMenu(false); }}
                className="context-menu-item"
              >
                <Edit2 size={12} />
                <span>Rename</span>
              </button>
              <button
                onClick={() => { onPin(); setShowMenu(false); }}
                className="context-menu-item"
              >
                <Pin size={12} />
                <span>{chat.pinned ? "Unpin" : "Pin"}</span>
              </button>
              <div className="context-menu-divider" />
              <button
                onClick={() => { onDelete(); setShowMenu(false); }}
                className="context-menu-item context-menu-danger"
              >
                <Trash2 size={12} />
                <span>Delete</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        .chat-item-wrapper {
          position: relative; display: flex; align-items: center;
          border-radius: var(--radius-md); margin-bottom: 2px;
          transition: background var(--transition-fast);
        }
        .chat-item-wrapper:hover { background: var(--bg-muted); }
        .chat-item-active { background: var(--bg-muted); }

        .chat-item-link {
          display: flex; align-items: center; gap: 9px;
          padding: 8px 10px; flex: 1; min-width: 0;
          color: var(--text-secondary) !important;
          text-decoration: none;
        }
        .chat-item-active .chat-item-link { color: var(--text-primary) !important; }

        .chat-item-icon { color: var(--text-muted); flex-shrink: 0; }
        .chat-item-content { flex: 1; min-width: 0; }
        .chat-item-title {
          display: block; font-size: 0.825rem; font-weight: 500;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .chat-item-date {
          display: block; font-size: 0.7rem; color: var(--text-placeholder);
          margin-top: 1px;
        }

        .chat-item-edit-input {
          flex: 1; padding: 7px 10px; background: var(--bg-elevated);
          border: 1px solid var(--accent-400); border-radius: var(--radius-md);
          font-size: 0.825rem; color: var(--text-primary); outline: none;
          margin: 2px;
        }

        .chat-item-actions {
          position: absolute; right: 4px; top: 50%; transform: translateY(-50%);
          opacity: 0; transition: opacity var(--transition-fast);
        }
        .chat-item-wrapper:hover .chat-item-actions { opacity: 1; }
        .chat-item-active .chat-item-actions { opacity: 1; }

        .chat-action-btn {
          width: 24px; height: 24px; border-radius: var(--radius-sm);
          background: var(--bg-elevated); border: 1px solid var(--border-subtle);
          display: flex; align-items: center; justify-content: center;
          color: var(--text-muted); cursor: pointer;
          transition: all var(--transition-fast);
        }
        .chat-action-btn:hover { color: var(--text-primary); }

        .chat-context-menu {
          position: absolute; right: 0; top: calc(100% + 4px);
          background: var(--bg-elevated);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
          padding: 4px; min-width: 140px; z-index: 100;
        }

        .context-menu-item {
          display: flex; align-items: center; gap: 8px;
          width: 100%; padding: 7px 10px;
          background: none; border: none; cursor: pointer;
          font-size: 0.8rem; color: var(--text-secondary);
          border-radius: var(--radius-sm); text-align: left;
          transition: all var(--transition-fast);
        }
        .context-menu-item:hover {
          background: var(--bg-muted); color: var(--text-primary);
        }
        .context-menu-danger { color: var(--error-500) !important; }
        .context-menu-danger:hover { background: rgba(239,68,68,0.08) !important; }

        .context-menu-divider {
          height: 1px; background: var(--border-subtle); margin: 4px 0;
        }
      `}</style>
    </div>
  );
}
