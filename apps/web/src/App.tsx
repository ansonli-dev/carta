import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ProjectApiPage } from "./pages/ProjectApiPage";
import { ProjectsPage } from "./pages/ProjectsPage";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/projects" replace />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:projectId/apis" element={<ProjectApiPage />} />
        <Route path="*" element={<Navigate to="/projects" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
