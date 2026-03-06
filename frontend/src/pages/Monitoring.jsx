import React, { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import AlertBanner from '../components/AlertBanner';
import DataTable from '../components/DataTable';
import api, { getApiErrorMessage } from '../services/api';
import { formatDisplayId } from '../utils/idFormat';

const Monitoring = () => {
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get('/monitoring/alerts');
        const payload = response?.data?.data || response?.data || [];
        const list = Array.isArray(payload) ? payload : payload.items || [];
        setAlerts(list);
      } catch (err) {
        setError(getApiErrorMessage(err, 'Failed to load alerts.'));
      }
    };

    load();
  }, []);

  const columns = [
    { key: 'id', label: 'Alert ID', render: (row) => formatDisplayId(row.id, 'Alert') },
    { key: 'title', label: 'Title' },
    { key: 'severity', label: 'Severity' },
    { key: 'message', label: 'Message' }
  ];

  return (
    <div className="space-y-8">
      <PageHeader title="Monitoring" subtitle="Real-time alerts and notifications." />

      {error && <AlertBanner tone="error" title="Alerts unavailable" description={error} />}

      <DataTable columns={columns} rows={alerts} emptyMessage="No alerts yet." />
    </div>
  );
};

export default Monitoring;
