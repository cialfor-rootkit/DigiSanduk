import React, { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import AlertBanner from '../components/AlertBanner';
import DataTable from '../components/DataTable';
import LoadingSpinner from '../components/LoadingSpinner';
import api, { getApiErrorMessage } from '../services/api';
import { formatDisplayId } from '../utils/idFormat';

const fallbackReceived = [
  {
    id: 'RCV-7721',
    source_org_id: 'ORG-114',
    data_type: 'Critical CVE Briefing',
    encrypted_payload: 'ENCRYPTED_SAMPLE',
    severity: 'high',
    sector: 'Finance',
    tags: ['cve', 'urgent']
  }
];

const ReceivedData = () => {
  const [received, setReceived] = useState([]);
  const [loading, setLoading] = useState(true);
  const [placeholder, setPlaceholder] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const loadReceived = async () => {
      setLoading(true);
      setPlaceholder(false);
      setNotice('');
      try {
        const response = await api.get('/data/shared-with-me');
        const payload = response?.data?.data || response?.data || [];
        const list = Array.isArray(payload) ? payload : payload.items || [];
        setReceived(
          list.map((item) => ({
            id: item.share_id ?? item.id ?? item.data_id ?? 'N/A',
            source_org_id: item.owner_org_id ?? item.source_org_id ?? 'Unknown',
            data_type: item.data_type ?? item.title ?? 'Security Data',
            encrypted_payload: item.encrypted_payload ?? item.content ?? '--',
            severity: item.severity ?? '--',
            sector: item.sector ?? '--',
            tags: item.tags ?? []
          }))
        );
      } catch (err) {
        setReceived(fallbackReceived);
        setPlaceholder(true);
        setNotice(getApiErrorMessage(err, 'Live received data feed unavailable.'));
      } finally {
        setLoading(false);
      }
    };

    loadReceived();
  }, []);

  const columns = [
    { key: 'id', label: 'Receipt ID', render: (row) => formatDisplayId(row.id, 'Receipt') },
    { key: 'source_org_id', label: 'Source Org', render: (row) => formatDisplayId(row.source_org_id, 'Org') },
    { key: 'data_type', label: 'Data Type' },
    { key: 'severity', label: 'Severity' },
    { key: 'sector', label: 'Sector' },
    {
      key: 'tags',
      label: 'Tags',
      render: (row) => (
        <span className="text-xs text-haze">{(row.tags || []).join(', ') || '--'}</span>
      )
    },
    {
      key: 'encrypted_payload',
      label: 'Encrypted Data',
      render: (row) => (
        <span className="font-mono text-xs text-cyan">
          {String(row.encrypted_payload).slice(0, 48)}
          {String(row.encrypted_payload).length > 48 ? '…' : ''}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Shared With Me"
        subtitle="Review inbound encrypted datasets shared with your organization."
      />

      {placeholder && (
        <AlertBanner
          tone="warning"
          title="Showing placeholder received data"
          description={notice || 'Connect the backend to load live inbound data.'}
        />
      )}

      {loading ? (
        <LoadingSpinner label="Loading inbound shares" />
      ) : (
        <DataTable columns={columns} rows={received} emptyMessage="No inbound shares yet." />
      )}
    </div>
  );
};

export default ReceivedData;
