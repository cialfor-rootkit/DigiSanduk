import React, { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import AlertBanner from '../components/AlertBanner';
import DataTable from '../components/DataTable';
import LoadingSpinner from '../components/LoadingSpinner';
import api, { getApiErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatDisplayId } from '../utils/idFormat';

const fallbackLogs = [
  {
    id: 'AUD-4012',
    action: 'DATA_SHARED',
    performed_by: 'operator@digisanduk.io',
    timestamp: '2026-02-03T14:10:11Z',
    resource: 'SHR-2201'
  },
  {
    id: 'AUD-3998',
    action: 'DATA_RECEIVED',
    performed_by: 'system',
    timestamp: '2026-02-02T21:08:45Z',
    resource: 'RCV-7709'
  }
];

const AuditLogs = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.is_super_admin || user?.email === 'admin@digisanduk';
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [placeholder, setPlaceholder] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!isSuperAdmin) {
      setLoading(false);
      setLogs([]);
      return;
    }
    const loadLogs = async () => {
      setLoading(true);
      setPlaceholder(false);
      setNotice('');
      try {
        const response = await api.get('/audit/logs');
        const payload = response?.data?.data || response?.data || [];
        setLogs(Array.isArray(payload) ? payload : payload.items || []);
      } catch (err) {
        setLogs(fallbackLogs);
        setPlaceholder(true);
        setNotice(getApiErrorMessage(err, 'Live audit feed unavailable.'));
      } finally {
        setLoading(false);
      }
    };

    loadLogs();
  }, [isSuperAdmin]);

  const columns = [
    { key: 'id', label: 'Log ID', render: (row) => formatDisplayId(row.id, 'Audit') },
    { key: 'action', label: 'Action' },
    { key: 'performed_by', label: 'Performed By' },
    { key: 'timestamp', label: 'Timestamp' },
    {
      key: 'resource',
      label: 'Resource',
      render: (row) => {
        const resource = row.resource || '--';
        if (resource === '--') return resource;
        return String(resource)
          .replace(/org:(\d+)/g, (_, id) => `org:${formatDisplayId(id, 'Org')}`)
          .replace(/user:(\d+)/g, (_, id) => `user:${formatDisplayId(id, 'User')}`)
          .replace(/request:(\d+)/g, (_, id) => `request:${formatDisplayId(id, 'Request')}`)
          .replace(/data:(\d+)/g, (_, id) => `data:${formatDisplayId(id, 'Data')}`)
          .replace(/share:(\d+)/g, (_, id) => `share:${formatDisplayId(id, 'Share')}`)
          .replace(/connection:(\d+)/g, (_, id) => `connection:${formatDisplayId(id, 'Connection')}`)
          .replace(/integration:(\d+)/g, (_, id) => `integration:${formatDisplayId(id, 'Integration')}`);
      }
    }
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Audit Logs"
        subtitle="Immutable chain-of-custody records for every action on DigiSanduk."
      />

      {!isSuperAdmin && (
        <AlertBanner
          tone="warning"
          title="Super admin only"
          description="Audit logs are restricted to the super admin account."
        />
      )}

      {placeholder && (
        <AlertBanner
          tone="warning"
          title="Showing placeholder audit logs"
          description={notice || 'Connect the backend to load your audit log feed.'}
        />
      )}

      {loading ? (
        <LoadingSpinner label="Loading audit logs" />
      ) : (
        <DataTable columns={columns} rows={logs} emptyMessage="No audit events yet." />
      )}
    </div>
  );
};

export default AuditLogs;
