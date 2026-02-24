import { useState } from "react";

import CheckpointDashboard from "./components/admin/CheckpointDashboard";
import DocumentsPanel from "./components/DocumentsPanel";
import StudyChatGate from "./components/study/StudyChatGate";
import StudyControlPanel from "./components/study/StudyControlPanel";
import { useStudyStore } from "./stores/studyStore";

type AppPage = "chat" | "dashboard" | "study" | "documents";

export default function App() {
  const [page, setPage] = useState<AppPage>("chat");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const activeChatId = useStudyStore((s) => s.activeChatId);
  const chatOrder = useStudyStore((s) => s.chatOrder);
  const chatSnapshots = useStudyStore((s) => s.chatSnapshots);
  const loadChat = useStudyStore((s) => s.loadChat);
  const clearForNewChat = useStudyStore((s) => s.clearForNewChat);
  const saveChat = useStudyStore((s) => s.saveChat);
  // Derive title for the topbar
  const activeTitle = activeChatId
    ? chatSnapshots[activeChatId]?.title ?? "Study Session"
    : "New Chat";

  function handleNewChat() {
    // Save current session before clearing (if it has content)
    clearForNewChat();
    setPage("chat");
  }

  function handleSelectChat(chatId: string) {
    loadChat(chatId);
    setPage("chat");
  }

  return (
    <main className={`pi-layout ${sidebarOpen ? "" : "sidebar-collapsed"}`}>
      <aside className="pi-sidebar">
        <div className="pi-logo">Y</div>
        <nav className="pi-nav">
          <button
            className={`pi-nav-item ${page === "chat" && !activeChatId ? "active" : ""}`}
            onClick={handleNewChat}
          >
            New Chat
          </button>
          <button
            className={`pi-nav-item ${page === "documents" ? "active" : ""}`}
            onClick={() => setPage("documents")}
          >
            Documents
          </button>
          <button
            className={`pi-nav-item ${page === "dashboard" ? "active" : ""}`}
            onClick={() => setPage("dashboard")}
          >
            Checkpoints
          </button>
          <button
            className={`pi-nav-item ${page === "study" ? "active" : ""}`}
            onClick={() => setPage("study")}
          >
            Study Setup
          </button>
        </nav>

        <div className="pi-sidebar-section">
          <div className="pi-sidebar-label">Chats</div>
          {chatOrder.map((chatId) => {
            const snap = chatSnapshots[chatId];
            if (!snap) return null;
            return (
              <button
                key={chatId}
                className={`pi-chat-item ${activeChatId === chatId && page === "chat" ? "active" : ""}`}
                onClick={() => handleSelectChat(chatId)}
              >
                {snap.title}
              </button>
            );
          })}
        </div>

        <div className="pi-sidebar-footer">
          <button className="pi-icon-btn" title="Settings">&#9881;</button>
          <button className="pi-icon-btn" title="Inbox">&#9993;</button>
          <button className="pi-icon-btn" title="Help">&#8984;</button>
        </div>
      </aside>

      <section className="pi-main">
        <header className="pi-topbar">
          <div className="pi-topbar-left">
            <button className="pi-collapse-btn" onClick={() => setSidebarOpen((v) => !v)}>&#9776;</button>
            <span className="pi-chat-title">
              {page === "dashboard"
                ? "HITL Checkpoint Manager"
                : page === "study"
                  ? "Study Control Panel"
                  : page === "documents"
                    ? "10-K Documents"
                    : activeTitle}
            </span>
          </div>
          <div className="pi-topbar-right">
            {page === "chat" && (
              <>
                <button
                  className="pi-pill-btn accent"
                  onClick={() => setPage("dashboard")}
                >
                  Checkpoint Dashboard
                </button>
                <button
                  className="pi-pill-btn"
                  onClick={() => setPage("study")}
                >
                  Study Setup
                </button>
              </>
            )}
            {page === "dashboard" && (
              <button
                className="pi-pill-btn"
                onClick={() => setPage("chat")}
              >
                Back to Chat
              </button>
            )}
            {page === "study" && (
              <button
                className="pi-pill-btn"
                onClick={() => setPage("chat")}
              >
                Back to Chat
              </button>
            )}
            {page === "documents" && (
              <button
                className="pi-pill-btn"
                onClick={() => setPage("chat")}
              >
                Back to Chat
              </button>
            )}
          </div>
        </header>

        <div className="pi-canvas">
          {page === "chat" && (
            <StudyChatGate
              onSaveChat={saveChat}
            />
          )}
          {page === "dashboard" && (
            <CheckpointDashboard onBack={() => setPage("chat")} />
          )}
          {page === "study" && (
            <StudyControlPanel onBack={() => setPage("chat")} />
          )}
          {page === "documents" && <DocumentsPanel />}
        </div>
      </section>
    </main>
  );
}
