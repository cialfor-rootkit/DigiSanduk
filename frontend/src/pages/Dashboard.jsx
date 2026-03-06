import React, { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import AlertBanner from '../components/AlertBanner';
import LoadingSpinner from '../components/LoadingSpinner';
import api, { getApiErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.is_super_admin || user?.email === 'admin@digisanduk';
  const isOrgAdmin = user?.is_org_admin;
  const showStats = isSuperAdmin || isOrgAdmin;

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [placeholder, setPlaceholder] = useState(false);
  const [notice, setNotice] = useState('');

  const loadStats = async () => {
    if (!showStats) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setNotice('');
    setPlaceholder(false);
    try {
      const response = await api.get('/dashboard/summary');
      const payload = response?.data?.data || response?.data || {};
      const resolved = {
        activeShares: payload.active_shares ?? payload.activeShares ?? 0,
        dataReceived: payload.data_received ?? payload.dataReceived ?? 0,
        pendingApprovals: payload.pending_approvals ?? payload.pendingApprovals ?? 0,
        securityAlerts: payload.security_alerts ?? payload.securityAlerts ?? 0
      };
      setStats(resolved);
    } catch (err) {
      setStats({ activeShares: 0, dataReceived: 0, pendingApprovals: 0, securityAlerts: 0 });
      setPlaceholder(true);
      setNotice(getApiErrorMessage(err, 'Live dashboard data unavailable.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    if (!showStats) return undefined;
    const timer = setInterval(loadStats, 15000);
    return () => clearInterval(timer);
  }, [showStats]);

  return (
    <div className="space-y-8">
      <div className="animate-fade-up">
        <PageHeader
          title="Security Posture Overview"
          subtitle="Monitor live sharing activity, approvals, and security alerts across your organization."
        />
      </div>

      {showStats && placeholder && (
        <AlertBanner
          tone="warning"
          title="Showing placeholder metrics"
          description={notice || 'Connect the backend endpoint for real-time statistics.'}
        />
      )}

      {showStats && (loading ? (
        <LoadingSpinner label="Loading dashboard metrics" />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4 animate-fade-up-delay">
          <StatCard label="Active Shares" value={stats?.activeShares ?? 0} detail="Outbound payloads in motion" tone="cyan" />
          <StatCard label="Data Received" value={stats?.dataReceived ?? 0} detail="Verified incoming bundles" tone="neon" />
          <StatCard label="Pending Approvals" value={stats?.pendingApprovals ?? 0} detail="Awaiting authorization" tone="gold" />
          <StatCard label="Security Alerts" value={stats?.securityAlerts ?? 0} detail="Critical events" tone="ember" />
        </div>
      ))}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="glass-panel rounded-2xl p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-white">Operational Pulse</h3>
          <p className="mt-1 text-sm text-haze">Recent actions across the DigiSanduk network.</p>
          <div className="mt-4 space-y-3">
            <div className="rounded-2xl border border-cyan/10 bg-midnight/70 px-4 py-3">
              <p className="text-sm text-white">Live metrics refresh every 15 seconds</p>
              <p className="text-xs text-haze">Real-time counters pulled from the backend</p>
            </div>
          </div>
        </div>
        <div className="glass-panel rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white">Risk Controls</h3>
          <p className="mt-1 text-sm text-haze">Keep your sharing posture locked down.</p>
          <div className="mt-4 space-y-4 text-sm text-white">
            <div className="flex items-center justify-between">
              <span>Policy engine</span>
              <span className="text-neon">Active</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Encryption level</span>
              <span className="text-cyan">AES-256</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Audit retention</span>
              <span className="text-gold">365 days</span>
            </div>
          </div>
          <button type="button" className="button-secondary mt-6 w-full">
            Review security posture
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
