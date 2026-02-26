import { useEffect, useRef } from "react";

import { useAdminStore } from "../../stores/adminStore";
import OverviewPanel from "./OverviewPanel";
import SessionDetailPanel from "./SessionDetailPanel";
import TaskDetailModal from "./TaskDetailModal";

const REFRESH_INTERVAL = 30_000;

export default function StudyMonitor() {
  const currentView = useAdminStore((s) => s.currentView);
  const fetchOverview = useAdminStore((s) => s.fetchOverview);
  const fetchActivity = useAdminStore((s) => s.fetchActivity);
  const autoRefresh = useAdminStore((s) => s.autoRefresh);
  const selectedTask = useAdminStore((s) => s.selectedTask);
  const goBack = useAdminStore((s) => s.goBack);

  // Initial load
  useEffect(() => {
    fetchOverview();
    fetchActivity();
  }, [fetchOverview, fetchActivity]);

  // Auto-refresh polling
  const intervalRef = useRef<number | null>(null);
  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = window.setInterval(() => {
        fetchOverview();
        fetchActivity();
      }, REFRESH_INTERVAL);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefresh, fetchOverview, fetchActivity]);

  return (
    <div className="adm-container">
      {currentView === "overview" && <OverviewPanel />}
      {currentView === "session" && <SessionDetailPanel />}
      {currentView === "task" && selectedTask && (
        <TaskDetailModal task={selectedTask} onClose={goBack} />
      )}
    </div>
  );
}
