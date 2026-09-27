import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppLayout } from './components/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { IntelligencePage } from './pages/IntelligencePage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { TopicsPage } from './pages/TopicsPage';
import { DataQualityPage } from './pages/DataQualityPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Authentication Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Application Shell Routes */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/intelligence" element={<IntelligencePage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/topics" element={<TopicsPage />} />
            <Route path="/validation" element={<DataQualityPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
