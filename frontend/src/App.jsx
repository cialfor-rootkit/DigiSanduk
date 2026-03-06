import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import RequireAuth from './components/RequireAuth';
import AppShell from './layout/AppShell';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import MFASettings from './pages/MFASettings';
import PrivacySettings from './pages/PrivacySettings';
import Organization from './pages/Organization';
import ShareData from './pages/ShareData';
import ReceivedData from './pages/ReceivedData';
import AuditLogs from './pages/AuditLogs';
import Incidents from './pages/Incidents';
import ThreatIntel from './pages/ThreatIntel';
import Integrations from './pages/Integrations';
import Analytics from './pages/Analytics';
import Monitoring from './pages/Monitoring';
import Visualization from './pages/Visualization';
import Compliance from './pages/Compliance';
import Training from './pages/Training';
import Marketplace from './pages/Marketplace';
import Automation from './pages/Automation';
import DataRequests from './pages/DataRequests';
import Approvals from './pages/Approvals';
import AdminConsole from './pages/AdminConsole';
import AdminTeam from './pages/AdminTeam';

const App = () => {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<RequireAuth />}>
          <Route element={<AppShell />}>
            <Route index element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/mfa" element={<MFASettings />} />
            <Route path="/privacy" element={<PrivacySettings />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/monitoring" element={<Monitoring />} />
            <Route path="/visualization" element={<Visualization />} />
            <Route path="/automation" element={<Automation />} />
            <Route path="/incidents" element={<Incidents />} />
            <Route path="/threat-intel" element={<ThreatIntel />} />
            <Route path="/integrations" element={<Integrations />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/compliance" element={<Compliance />} />
            <Route path="/training" element={<Training />} />
            <Route path="/organization" element={<Organization />} />
            <Route path="/share" element={<ShareData />} />
            <Route path="/received" element={<ReceivedData />} />
            <Route path="/audit" element={<AuditLogs />} />
            <Route path="/requests" element={<DataRequests />} />
            <Route path="/approvals" element={<Approvals />} />
            <Route path="/admin" element={<AdminConsole />} />
            <Route path="/admin/team" element={<AdminTeam />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
};

export default App;
