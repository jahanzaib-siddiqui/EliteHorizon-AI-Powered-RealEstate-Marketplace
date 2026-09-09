import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLogin from './pages/AdminLogin';
import AdminLayout from './components/AdminLayout';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Listings from './pages/Listings';
import Properties from './pages/Properties';
import Settings from './pages/Settings';
import Approvals from './pages/Approvals';
import AdminChats from './pages/AdminChats';
import TrainingPanel from './pages/TrainingPanel';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('adminToken');
  return token ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<AdminLogin />} />
      <Route path="/" element={
        <ProtectedRoute>
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="users" element={<Users />} />
        <Route path="listings" element={<Listings />} />
        <Route path="approvals" element={<Approvals />} />
        <Route path="properties" element={<Properties />} />
        <Route path="chats" element={<AdminChats />} />
        <Route path="settings" element={<Settings />} />
        <Route path="training" element={<TrainingPanel />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
