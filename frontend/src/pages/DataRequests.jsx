import React, { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import FormField from '../components/FormField';
import AlertBanner from '../components/AlertBanner';
import DataTable from '../components/DataTable';
import api, { getApiErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatDisplayId } from '../utils/idFormat';

const DataRequests = () => {
  const { user } = useAuth();
  const isOrgAdmin = user?.is_org_admin;
  const [orgs, setOrgs] = useState([]);
  const [formState, setFormState] = useState({ target_org_id: '', data_type: '', reason: '' });
  const [outgoing, setOutgoing] = useState([]);
  const [feedback, setFeedback] = useState(null);

  const loadOrgs = async () => {
    try {
      const response = await api.get('/org/list');
      const payload = response?.data?.data || response?.data || [];
      const list = Array.isArray(payload) ? payload : payload.items || [];
      setOrgs(list);
      if (list.length > 0 && !formState.target_org_id) {
        setFormState((prev) => ({ ...prev, target_org_id: String(list[0].id) }));
      }
    } catch {
      setOrgs([]);
    }
  };

  const loadOutgoing = async () => {
    try {
      const response = await api.get('/data/requests/outgoing');
      const payload = response?.data?.data || response?.data || [];
      const list = Array.isArray(payload) ? payload : payload.items || [];
      setOutgoing(list);
    } catch (err) {
      setFeedback({ type: 'error', text: getApiErrorMessage(err, 'Failed to load requests.') });
    }
  };

  useEffect(() => {
    if (!isOrgAdmin) return;
    loadOrgs();
    loadOutgoing();
  }, [isOrgAdmin]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFeedback(null);
    try {
      await api.post('/data/requests', {
        target_org_id: Number(formState.target_org_id),
        data_type: formState.data_type,
        reason: formState.reason
      });
      setFeedback({ type: 'success', text: 'Request submitted.' });
      setFormState((prev) => ({ ...prev, data_type: '', reason: '' }));
      loadOutgoing();
    } catch (err) {
      setFeedback({ type: 'error', text: getApiErrorMessage(err, 'Failed to submit request.') });
    }
  };

  const columns = [
    { key: 'id', label: 'Request ID', render: (row) => formatDisplayId(row.id, 'Request') },
    {
      key: 'target_org_id',
      label: 'Target Org',
      render: (row) => row.target_org_name
        ? `${row.target_org_name} (${formatDisplayId(row.target_org_id, 'Org')})`
        : formatDisplayId(row.target_org_id, 'Org')
    },
    { key: 'data_type', label: 'Data Type' },
    { key: 'reason', label: 'Reason' },
    { key: 'status', label: 'Status' }
  ];

  if (!isOrgAdmin) {
    return (
      <div className="space-y-8">
        <PageHeader title="Data Requests" subtitle="Only organization admins can request data." />
        <AlertBanner tone="warning" title="Admin access required" description="Contact your org admin to request data." />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Data Requests" subtitle="Request data sharing access from partner organizations." />

      {feedback && (
        <AlertBanner
          tone={feedback.type === 'error' ? 'error' : 'info'}
          title={feedback.type === 'error' ? 'Action failed' : 'Success'}
          description={feedback.text}
        />
      )}

      <div className="glass-panel rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white">Create request</h3>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-haze">Target Organization</span>
            <select
              className="input-field mt-2"
              value={formState.target_org_id}
              onChange={(event) => setFormState((prev) => ({ ...prev, target_org_id: event.target.value }))}
              required
            >
              <option value="" disabled>
                Select organization
              </option>
              {orgs.map((org) => (
                <option key={org.id || org.name} value={String(org.id)}>
                  {org.name} ({formatDisplayId(org.id, 'Org')})
                </option>
              ))}
            </select>
          </label>
          <FormField
            label="Data Type"
            value={formState.data_type}
            onChange={(event) => setFormState((prev) => ({ ...prev, data_type: event.target.value }))}
            required
          />
          <FormField
            label="Reason"
            as="textarea"
            rows={3}
            value={formState.reason}
            onChange={(event) => setFormState((prev) => ({ ...prev, reason: event.target.value }))}
          />
          <button type="submit" className="button-primary w-full">Submit Request</button>
        </form>
      </div>

      <DataTable columns={columns} rows={outgoing} emptyMessage="No outgoing requests yet." />
    </div>
  );
};

export default DataRequests;
