import { useEffect, useState } from "react";
import "@xyflow/react/dist/style.css";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { CreateWorkflow } from "./pages/CreateWorkflow";
import { CreateWorkflowOnboarding } from "./pages/CreateWorkflowOnboarding";
import { Auth } from "./pages/Auth";
import { Landing } from "./pages/Landing";
import { Dashboard } from "./pages/Dashboard";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Profile from "./pages/Profile";
import { Executions } from "./pages/Executions";
import { ComingSoon } from "./pages/ComingSoon";
import { StaticContentPage } from "./pages/StaticContentPage";
import { Blog } from "./pages/Blog";
import { About } from "./pages/About";
import { Notifications } from "./pages/Notifications";
import { VerifyEmail } from "./pages/VerifyEmail";
import { Examples } from "./pages/Examples";
import { Algorithms } from "./pages/Algorithms";
import { AiStrategyChatBuilder } from "./pages/AiStrategyChatBuilder";
import { BillingUsage } from "./pages/BillingUsage";
import { MAINTENANCE_EVENT, isMaintenanceMode } from "./http";

function MaintenanceGuard({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [maintenance, setMaintenance] = useState(isMaintenanceMode());

  useEffect(() => {
    const handler = () => setMaintenance(true);
    window.addEventListener(MAINTENANCE_EVENT, handler);
    return () => window.removeEventListener(MAINTENANCE_EVENT, handler);
  }, []);

  if (maintenance && location.pathname !== "/") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/signin" element={<Auth mode="signin" />} />
      <Route path="/signup" element={<Auth mode="signup" />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/coming-soon/:feature" element={<ComingSoon />} />
      <Route
        path="/pricing"
        element={<StaticContentPage pageKey="pricing" />}
      />
      <Route path="/about" element={<About />} />
      <Route
        path="/careers"
        element={<StaticContentPage pageKey="careers" />}
      />
      <Route path="/blog" element={<Blog />} />
      <Route path="/docs" element={<StaticContentPage pageKey="docs" />} />
      <Route
        path="/changelog"
        element={<StaticContentPage pageKey="changelog" />}
      />
      <Route
        path="/contact"
        element={<StaticContentPage pageKey="contact" />}
      />
      <Route
        path="/privacy-policy"
        element={<StaticContentPage pageKey="privacy" />}
      />
      <Route
        path="/terms-of-service"
        element={<StaticContentPage pageKey="terms" />}
      />
      <Route
        path="/cookie-policy"
        element={<StaticContentPage pageKey="cookie" />}
      />
      <Route path="/examples" element={<Examples />} />
      <Route
        path="/algorithms"
        element={
          <MaintenanceGuard>
            <ProtectedRoute>
              <Algorithms />
            </ProtectedRoute>
          </MaintenanceGuard>
        }
      />
      <Route
        path="/dashboard"
        element={
          <MaintenanceGuard>
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          </MaintenanceGuard>
        }
      />
      <Route
        path="/create"
        element={
          <MaintenanceGuard>
            <ProtectedRoute>
              <CreateWorkflowOnboarding />
            </ProtectedRoute>
          </MaintenanceGuard>
        }
      />
      <Route
        path="/create/onboarding"
        element={
          <MaintenanceGuard>
            <ProtectedRoute>
              <CreateWorkflowOnboarding />
            </ProtectedRoute>
          </MaintenanceGuard>
        }
      />
      <Route
        path="/create/builder"
        element={
          <MaintenanceGuard>
            <ProtectedRoute>
              <CreateWorkflow />
            </ProtectedRoute>
          </MaintenanceGuard>
        }
      />
      <Route
        path="/create/ai-chat"
        element={
          <MaintenanceGuard>
            <ProtectedRoute>
              <AiStrategyChatBuilder />
            </ProtectedRoute>
          </MaintenanceGuard>
        }
      />
      <Route
        path="/workflow/:workflowId"
        element={
          <MaintenanceGuard>
            <ProtectedRoute>
              <CreateWorkflow />
            </ProtectedRoute>
          </MaintenanceGuard>
        }
      />
      <Route
        path="/notifications"
        element={
          <MaintenanceGuard>
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          </MaintenanceGuard>
        }
      />
      <Route
        path="/billing"
        element={
          <MaintenanceGuard>
            <ProtectedRoute>
              <BillingUsage defaultTab="billing" />
            </ProtectedRoute>
          </MaintenanceGuard>
        }
      />
      <Route
        path="/usage"
        element={
          <MaintenanceGuard>
            <ProtectedRoute>
              <BillingUsage defaultTab="usage" />
            </ProtectedRoute>
          </MaintenanceGuard>
        }
      />
      <Route
        path="/profile"
        element={
          <MaintenanceGuard>
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          </MaintenanceGuard>
        }
      />
      <Route
        path="/workflow/:workflowId/executions"
        element={
          <MaintenanceGuard>
            <ProtectedRoute>
              <Executions />
            </ProtectedRoute>
          </MaintenanceGuard>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
