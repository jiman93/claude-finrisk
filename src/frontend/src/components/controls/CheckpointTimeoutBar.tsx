import { useEffect, useState } from "react";

interface CheckpointTimeoutBarProps {
  timeoutSeconds: number;
  startedAt: string;
  onTimeout: () => void;
  paused?: boolean;
}

export default function CheckpointTimeoutBar({
  timeoutSeconds,
  startedAt,
  onTimeout,
  paused,
}: CheckpointTimeoutBarProps) {
  const [remaining, setRemaining] = useState(timeoutSeconds);

  useEffect(() => {
    if (paused) return;

    const elapsed = (Date.now() - new Date(startedAt).getTime()) / 1000;
    const initial = Math.max(0, timeoutSeconds - elapsed);
    setRemaining(initial);

    if (initial <= 0) {
      onTimeout();
      return;
    }

    const timer = window.setInterval(() => {
      setRemaining((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          window.clearInterval(timer);
          onTimeout();
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [timeoutSeconds, startedAt, onTimeout, paused]);

  const fraction = remaining / timeoutSeconds;
  const minutes = Math.floor(remaining / 60);
  const seconds = Math.floor(remaining % 60);
  const display = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  const urgencyClass =
    fraction <= 0.15 ? "critical" : fraction <= 0.35 ? "warning" : "";

  return (
    <div className={`cp-timeout-bar ${urgencyClass}`}>
      <div className="cp-timeout-track">
        <div
          className="cp-timeout-fill"
          style={{ width: `${fraction * 100}%` }}
        />
      </div>
      <span className="cp-timeout-label">{display} remaining</span>
    </div>
  );
}
