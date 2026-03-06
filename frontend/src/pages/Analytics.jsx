import React, { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import AlertBanner from '../components/AlertBanner';
import api, { getApiErrorMessage } from '../services/api';

const Analytics = () => {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get('/analytics/summary');
        const payload = response?.data?.data || response?.data || {};
        setStats(payload);
      } catch (err) {
        setError(getApiErrorMessage(err, 'Failed to load analytics.'));
      }
    };

    load();
  }, []);

  return (
    <div className="space-y-8">
      <PageHeader title="Analytics" subtitle="Operational insights across your data-sharing network." />

      {error && (
        <AlertBanner tone="error" title="Analytics unavailable" description={error} />
      )}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Data" value={stats?.total_data ?? 0} tone="cyan" />
        <StatCard label="Total Shares" value={stats?.total_shares ?? 0} tone="neon" />
        <StatCard label="Incidents" value={stats?.total_incidents ?? 0} tone="gold" />
        <StatCard label="Audit Events" value={stats?.audit_events ?? 0} tone="ember" />
      </div>
    </div>
  );
};

export default Analytics;
