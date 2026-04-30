import { useState } from "react";
import { useAdminStore } from "../../stores/adminStore";

export default function AdminLogin() {
  const login = useAdminStore((s) => s.login);
  const loginError = useAdminStore((s) => s.loginError);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await login(password);
    setLoading(false);
  }

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", padding: "2rem" }}>
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          width: "100%",
          maxWidth: "320px",
        }}
      >
        <div>
          <h2 style={{ margin: "0 0 0.25rem", fontSize: "1.1rem", fontWeight: 600 }}>Study Monitor</h2>
          <p style={{ margin: 0, fontSize: "0.85rem", opacity: 0.6 }}>Admin access required</p>
        </div>

        <input
          type="password"
          placeholder="Admin password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          required
          style={{
            padding: "0.6rem 0.75rem",
            fontSize: "0.9rem",
            border: "1px solid var(--border, #e0e0e0)",
            borderRadius: "6px",
            outline: "none",
            width: "100%",
            boxSizing: "border-box",
          }}
        />

        {loginError && (
          <p style={{ margin: 0, fontSize: "0.8rem", color: "#c0392b" }}>{loginError}</p>
        )}

        <button
          type="submit"
          disabled={loading || !password}
          className="pi-pill-btn"
          style={{ alignSelf: "stretch" }}
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}
