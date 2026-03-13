import "@xyflow/react/dist/style.css";
import { Navigate, Route, Routes } from "react-router-dom";
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

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/signin" element={<Auth mode="signin" />} />
      <Route path="/signup" element={<Auth mode="signup" />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/coming-soon/:feature" element={<ComingSoon />} />
      <Route path="/pricing" element={<StaticContentPage pageKey="pricing" />} />
      <Route path="/about" element={<About />} />
      <Route path="/careers" element={<StaticContentPage pageKey="careers" />} />
      <Route path="/blog" element={<Blog />} />
      <Route path="/docs" element={<StaticContentPage pageKey="docs" />} />
      <Route path="/changelog" element={<StaticContentPage pageKey="changelog" />} />
      <Route path="/contact" element={<StaticContentPage pageKey="contact" />} />
      <Route path="/privacy-policy" element={<StaticContentPage pageKey="privacy" />} />
      <Route path="/terms-of-service" element={<StaticContentPage pageKey="terms" />} />
      <Route path="/cookie-policy" element={<StaticContentPage pageKey="cookie" />} />
      <Route path="/examples" element={<Navigate to="/coming-soon/example-workflows" replace />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/create"
        element={
          <ProtectedRoute>
            <CreateWorkflowOnboarding />
          </ProtectedRoute>
        }
      />
      <Route
        path="/create/onboarding"
        element={
          <ProtectedRoute>
            <CreateWorkflowOnboarding />
          </ProtectedRoute>
        }
      />
      <Route
        path="/create/builder"
        element={
          <ProtectedRoute>
            <CreateWorkflow />
          </ProtectedRoute>
        }
      />
      <Route
        path="/workflow/:workflowId"
        element={
          <ProtectedRoute>
            <CreateWorkflow />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <Notifications />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/workflow/:workflowId/executions"
        element={
          <ProtectedRoute>
            <Executions />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    
  );
}

export default App;
