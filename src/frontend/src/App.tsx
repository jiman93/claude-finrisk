import { useState } from "react";

import CheckpointDashboard from "./components/admin/CheckpointDashboard";
import StudyChatGate from "./components/study/StudyChatGate";
import StudyControlPanel from "./components/study/StudyControlPanel";

type AppPage = "chat" | "dashboard" | "study";

export default function App() {
  const [page, setPage] = useState<AppPage>("chat");
  const [chatKey, setChatKey] = useState(0);
  const [chatHistory, setChatHistory] = useState<string[]>([
    "Financial risk related to supply...",
    "How does the Fed assess...",
  ]);
  const [activeChat, setActiveChat] = useState<string>("Financial risk related to supply...");

  function handlePromptLogged(prompt: string) {
    const trimmed = prompt.trim();
    if (!trimmed) {
      return;
    }
    const title = trimmed.length > 32 ? `${trimmed.slice(0, 32)}...` : trimmed;
    setChatHistory((prev) => {
      const next = [title, ...prev.filter((item) => item !== title)];
      return next.slice(0, 10);
    });
    setActiveChat(title);
  }

  return (
    <main className="pi-layout">
      <aside className="pi-sidebar">
        <div className="pi-logo">Y</div>
        <nav className="pi-nav">
          <button
            className={`pi-nav-item ${page === "chat" ? "active" : ""}`}
            onClick={() => {
              setPage("chat");
              setChatKey((prev) => prev + 1);
              setActiveChat("New Chat");
            }}
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
          {chatHistory.map((item) => (
            <button
              key={item}
              className={`pi-chat-item ${activeChat === item && page === "chat" ? "active" : ""}`}
              onClick={() => {
                setActiveChat(item);
                setPage("chat");
              }}
            >
              {item}
            </button>
          ))}
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
                  : activeChat}
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
              key={chatKey}
              onPromptLogged={handlePromptLogged}
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
