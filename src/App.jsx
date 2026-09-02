import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import { ProtectedRoute, PublicOnlyRoute } from './components/ProtectedRoute';
import BaseSettings from './pages/BaseSettings';
import Login from './pages/Login';
import NewPlanRedirect from './pages/NewPlanRedirect';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import QuickReference from './pages/QuickReference';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<PublicOnlyRoute />}>
            <Route path="/login" element={<Login />} />
          </Route>

          <Route path="/app" element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route index element={<Projects />} />
              <Route path="nuevo" element={<NewPlanRedirect />} />
              <Route path="configuracion" element={<BaseSettings />} />
              <Route path="precios" element={<Navigate to="/app/configuracion" replace />} />
              <Route path="referencia" element={<QuickReference />} />
              <Route path="projects/:projectId" element={<ProjectDetail />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/app" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
