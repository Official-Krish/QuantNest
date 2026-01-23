import "@xyflow/react/dist/style.css";
import { Route, Routes } from "react-router-dom";
import { CreateWorkflow } from "./components/CreateWorkflow";
import { Auth } from "./components/Auth";
import { Landing } from "./components/Landing";
import { Dashboard } from "./components/Dashboard";
import { ProtectedRoute } from "./components/ProtectedRoute";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/signin" element={<Auth mode="signin" />} />
      <Route path="/signup" element={<Auth mode="signup" />} />
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
    </Routes>
  );
}

export default App;