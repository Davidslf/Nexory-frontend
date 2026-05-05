import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { SidebarProvider } from '@/context/SidebarContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { LoginPage } from '@/features/auth/LoginPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { ClientsPage } from '@/features/clients/ClientsPage';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { SupportPage } from '@/features/support/SupportPage';
import { CutsPage } from '@/features/cuts/CutsPage';
import { CommunicationsPage } from '@/features/communications/CommunicationsPage';

function App() {
  return (
    <ThemeProvider>
    <AuthProvider>
      <SidebarProvider>
        <NotificationProvider>
          <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route
              path="dashboard"
              element={
                <ProtectedRoute requiredPermission="/dashboard">
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="clients"
              element={
                <ProtectedRoute requiredPermission="/clients">
                  <ClientsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="support"
              element={
                <ProtectedRoute requiredPermission="/support">
                  <SupportPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="cuts"
              element={
                <ProtectedRoute requiredPermission="/cuts">
                  <CutsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="communications"
              element={
                <ProtectedRoute requiredPermission="/communications">
                  <CommunicationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="settings"
              element={
                <ProtectedRoute requiredPermission="/settings">
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
        </NotificationProvider>
      </SidebarProvider>
    </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
