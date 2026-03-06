import React, { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import FormField from '../components/FormField';
import AlertBanner from '../components/AlertBanner';
import DataTable from '../components/DataTable';
import api, { getApiErrorMessage } from '../services/api';
import { formatDisplayId } from '../utils/idFormat';

const Integrations = () => {
  const [integrations, setIntegrations] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [formState, setFormState] = useState({
    vendor: 'Splunk HEC',
    endpoint_url: '',
    token: '',
    index: '',
    sourcetype: '',
    verify_ssl: true
  });
  const [feedback, setFeedback] = useState(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const loadIntegrations = async () => {
    try {
      const response = await api.get('/integrations');
      const payload = response?.data?.data || response?.data || [];
      const list = Array.isArray(payload) ? payload : payload.items || [];
      setIntegrations(list);
    } catch (err) {
      setFeedback({ type: 'error', text: getApiErrorMessage(err, 'Failed to load integrations.') });
    }
  };

  useEffect(() => {
    loadIntegrations();
  }, []);

  const handleSave = async (event) => {
    event.preventDefault();
    setFeedback(null);
    setSaving(true);
    try {
      const config = {
        vendor: 'Splunk HEC',
        endpoint_url: formState.endpoint_url,
        token: formState.token,
        index: formState.index || null,
        sourcetype: formState.sourcetype || null,
        verify_ssl: Boolean(formState.verify_ssl)
      };

      if (editingId) {
        await api.put(`/integrations/${editingId}`, {
          name: 'Splunk HEC',
          type: 'siem',
          config: JSON.stringify(config)
        });
        setFeedback({ type: 'success', text: 'SIEM integration updated.' });
      } else {
        await api.post('/integrations/siem', config);
        setFeedback({ type: 'success', text: 'SIEM integration saved.' });
      }

      setEditingId(null);
      loadIntegrations();
    } catch (err) {
      setFeedback({ type: 'error', text: getApiErrorMessage(err, 'Failed to save SIEM integration.') });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setFeedback(null);
    setTesting(true);
    try {
      await api.post('/integrations/siem/test', {
        vendor: 'Splunk HEC',
        endpoint_url: formState.endpoint_url,
        token: formState.token,
        index: formState.index || null,
        sourcetype: formState.sourcetype || null,
        verify_ssl: Boolean(formState.verify_ssl)
      });
      setFeedback({ type: 'success', text: 'Test event sent to Splunk.' });
    } catch (err) {
      setFeedback({ type: 'error', text: getApiErrorMessage(err, 'Failed to send Splunk test event.') });
    } finally {
      setTesting(false);
    }
  };

  const handleEdit = (integration) => {
    let parsed = null;
    try {
      parsed = integration.config ? JSON.parse(integration.config) : null;
    } catch {
      parsed = null;
    }
    setEditingId(integration.id);
    setFormState({
      vendor: 'Splunk HEC',
      endpoint_url: parsed?.endpoint_url || '',
      token: parsed?.token || '',
      index: parsed?.index || '',
      sourcetype: parsed?.sourcetype || '',
      verify_ssl: parsed?.verify_ssl !== false
    });
  };

  const handleDelete = async (integrationId) => {
    setFeedback(null);
    try {
      await api.delete(`/integrations/${integrationId}`);
      setFeedback({ type: 'success', text: 'Integration deleted.' });
      if (editingId === integrationId) {
        setEditingId(null);
      }
      loadIntegrations();
    } catch (err) {
      setFeedback({ type: 'error', text: getApiErrorMessage(err, 'Failed to delete integration.') });
    }
  };

  const columns = [
    { key: 'id', label: 'ID', render: (row) => formatDisplayId(row.id, 'Integration') },
    { key: 'name', label: 'Name' },
    { key: 'type', label: 'Type' },
    { key: 'status', label: 'Status' },
    {
      key: 'config',
      label: 'Endpoint',
      render: (row) => {
        try {
          const parsed = row.config ? JSON.parse(row.config) : null;
          return parsed?.endpoint_url || '--';
        } catch {
          return '--';
        }
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          <button type="button" className="button-secondary" onClick={() => handleEdit(row)}>
            Edit
          </button>
          <button type="button" className="button-secondary" onClick={() => handleDelete(row.id)}>
            Delete
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-8">
      <PageHeader title="Integrations" subtitle="Connect DigiSanduk to Splunk via HTTP Event Collector (HEC)." />

      {feedback && (
        <AlertBanner
          tone={feedback.type === 'error' ? 'error' : 'info'}
          title={feedback.type === 'error' ? 'Action failed' : 'Success'}
          description={feedback.text}
        />
      )}

      <div className="glass-panel rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white">Splunk HEC Integration</h3>
        <p className="mt-1 text-sm text-haze">Use your Splunk HEC endpoint to receive DigiSanduk events.</p>
        <form onSubmit={handleSave} className="mt-4 space-y-4">
          <FormField
            label="HEC Endpoint URL"
            value={formState.endpoint_url}
            onChange={(event) => setFormState((prev) => ({ ...prev, endpoint_url: event.target.value }))}
            placeholder="https://<splunk-host>:8088/services/collector"
            required
          />
          <FormField
            label="HEC Token"
            value={formState.token}
            onChange={(event) => setFormState((prev) => ({ ...prev, token: event.target.value }))}
            placeholder="Your HEC token"
            required
          />
          <FormField
            label="Index (optional)"
            value={formState.index}
            onChange={(event) => setFormState((prev) => ({ ...prev, index: event.target.value }))}
            placeholder="main"
          />
          <FormField
            label="Sourcetype (optional)"
            value={formState.sourcetype}
            onChange={(event) => setFormState((prev) => ({ ...prev, sourcetype: event.target.value }))}
            placeholder="digisanduk:event"
          />
          <label className="flex items-center gap-2 text-sm text-haze">
            <input
              type="checkbox"
              className="h-4 w-4 accent-cyan"
              checked={formState.verify_ssl}
              onChange={(event) => setFormState((prev) => ({ ...prev, verify_ssl: event.target.checked }))}
            />
            Verify SSL certificates
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button type="submit" className="button-primary w-full" disabled={saving}>
              {saving ? 'Saving...' : (editingId ? 'Update Integration' : 'Save Integration')}
            </button>
            <button type="button" className="button-secondary w-full" onClick={handleTest} disabled={testing}>
              {testing ? 'Testing...' : 'Send Test Event'}
            </button>
            {editingId && (
              <button
                type="button"
                className="button-secondary w-full"
                onClick={() => {
                  setEditingId(null);
                  setFormState({
                    vendor: 'Splunk HEC',
                    endpoint_url: '',
                    token: '',
                    index: '',
                    sourcetype: '',
                    verify_ssl: true
                  });
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <DataTable columns={columns} rows={integrations} emptyMessage="No integrations configured." />
    </div>
  );
};

export default Integrations;
