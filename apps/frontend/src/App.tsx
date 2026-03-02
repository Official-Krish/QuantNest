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

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/signin" element={<Auth mode="signin" />} />
      <Route path="/signup" element={<Auth mode="signup" />} />
      <Route path="/coming-soon/:feature" element={<ComingSoon />} />
      <Route path="/pricing" element={<Navigate to="/coming-soon/pricing" replace />} />
      <Route path="/about" element={<Navigate to="/coming-soon/about" replace />} />
      <Route path="/careers" element={<Navigate to="/coming-soon/careers" replace />} />
      <Route path="/blog" element={<Navigate to="/coming-soon/blog" replace />} />
      <Route path="/docs" element={<Navigate to="/coming-soon/docs" replace />} />
      <Route path="/changelog" element={<Navigate to="/coming-soon/changelog" replace />} />
      <Route path="/contact" element={<Navigate to="/coming-soon/contact" replace />} />
      <Route path="/privacy-policy" element={<Navigate to="/coming-soon/privacy" replace />} />
      <Route path="/terms-of-service" element={<Navigate to="/coming-soon/terms" replace />} />
      <Route path="/cookie-policy" element={<Navigate to="/coming-soon/cookie" replace />} />
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
      <Route path="*" element={<Navigate to="/coming-soon/docs" replace />} />
    </Routes>
    
  );
}

export default App;
