import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider }    from './context/AuthContext';
import { ProjectProvider } from './context/ProjectContext';
import { HouseProvider }   from './context/HouseContext';

import Navbar          from './components/Navbar';
import ProtectedRoute  from './components/ProtectedRoute';

import HomePage            from './pages/HomePage';
import LoginPage           from './pages/LoginPage';
import RegisterPage        from './pages/RegisterPage';
import DashboardPage       from './pages/DashboardPage';
import DesignerPage        from './pages/DesignerPage';
import HouseDashboardPage  from './pages/HouseDashboardPage';
import HouseDesignerPage   from './pages/HouseDesignerPage';
import ARViewerPage        from './pages/ARViewerPage';
import ProfilePage         from './pages/ProfilePage';

function App() {
  return (
    <AuthProvider>
      <ProjectProvider>
        <HouseProvider>
          <BrowserRouter>
            <Navbar />
            <Routes>
              {/* Public */}
              <Route path="/"         element={<HomePage />} />
              <Route path="/login"    element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Protected */}
              <Route path="/dashboard"    element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
              <Route path="/designer"     element={<ProtectedRoute><DesignerPage /></ProtectedRoute>} />
              <Route path="/designer/:id" element={<ProtectedRoute><DesignerPage /></ProtectedRoute>} />

              {/* Houses */}
              <Route path="/houses"     element={<ProtectedRoute><HouseDashboardPage /></ProtectedRoute>} />
              <Route path="/houses/:id" element={<ProtectedRoute><HouseDesignerPage /></ProtectedRoute>} />

              {/* AR viewer
                  /ar/:id           → project (standalone room)
                  /ar/:id?source=room → house room sub-document     */}
              <Route path="/ar/:id" element={<ProtectedRoute><ARViewerPage /></ProtectedRoute>} />

              {/* Profile */}
              <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </HouseProvider>
      </ProjectProvider>
    </AuthProvider>
  );
}

export default App;
