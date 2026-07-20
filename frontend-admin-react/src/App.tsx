import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminLayout } from './components/AdminLayout';
import { PermissionRoute } from './components/PermissionRoute';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { MenusPage } from './pages/MenusPage';
import { ResumesPage } from './pages/ResumesPage';
import { RolesPage } from './pages/RolesPage';
import { UsersPage } from './pages/UsersPage';
import { WorkflowRunsPage } from './pages/WorkflowRunsPage';
import { WorkflowsPage } from './pages/WorkflowsPage';

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={(
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        )}
      >
        <Route
          path="/"
          element={(
            <PermissionRoute permission="dashboard:view">
              <DashboardPage />
            </PermissionRoute>
          )}
        />
        <Route
          path="/users"
          element={(
            <PermissionRoute permission="front-user:list">
              <UsersPage />
            </PermissionRoute>
          )}
        />
        <Route
          path="/resumes"
          element={(
            <PermissionRoute permission="resume:list">
              <ResumesPage />
            </PermissionRoute>
          )}
        />
        <Route
          path="/workflows"
          element={(
            <PermissionRoute permission="workflow:list">
              <WorkflowsPage />
            </PermissionRoute>
          )}
        />
        <Route
          path="/workflow-runs"
          element={(
            <PermissionRoute permission="workflow-run:list">
              <WorkflowRunsPage />
            </PermissionRoute>
          )}
        />
        <Route
          path="/system/admins"
          element={(
            <PermissionRoute permission="admin-user:list">
              <AdminUsersPage />
            </PermissionRoute>
          )}
        />
        <Route
          path="/system/roles"
          element={(
            <PermissionRoute permission="role:list">
              <RolesPage />
            </PermissionRoute>
          )}
        />
        <Route
          path="/system/menus"
          element={(
            <PermissionRoute permission="menu:list">
              <MenusPage />
            </PermissionRoute>
          )}
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
