import { useState } from "react";

import CheckpointDashboard from "./components/admin/CheckpointDashboard";
import StudyChatGate from "./components/study/StudyChatGate";
import StudyControlPanel from "./components/study/StudyControlPanel";
import { useStudyStore } from "./stores/studyStore";

type AppPage = "chat" | "dashboard" | "study";

export default function App() {
  const [page, setPage] = useState<AppPage>("chat");

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
    <main className="pi-layout">
      <aside className="pi-sidebar">
        <div className="pi-logo">Y</div>
        <nav className="pi-nav">
          <button
            className={`pi-nav-item ${page === "chat" && !activeChatId ? "active" : ""}`}
            onClick={handleNewChat}
          >
            New Chat
          </button>
          <button className="pi-nav-item">Documents</button>
          <button className="pi-nav-item">Library</button>
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
            <button className="pi-collapse-btn">&#9646;</button>
            <span className="pi-chat-title">
              {page === "dashboard"
                ? "HITL Checkpoint Manager"
                : page === "study"
                  ? "Study Control Panel"
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
            <div className="pi-user-chip">Zul Hafiz</div>
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
        </div>
      </section>
    </main>
  );
}
