import React, { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import FormField from '../components/FormField';
import AlertBanner from '../components/AlertBanner';
import DataTable from '../components/DataTable';
import api, { getApiErrorMessage } from '../services/api';
import { formatDisplayId } from '../utils/idFormat';

const Automation = () => {
  const [playbooks, setPlaybooks] = useState([]);
  const [formState, setFormState] = useState({ name: '', description: '' });
  const [feedback, setFeedback] = useState(null);

  const loadPlaybooks = async () => {
    try {
      const response = await api.get('/automation/playbooks');
      const payload = response?.data?.data || response?.data || [];
      const list = Array.isArray(payload) ? payload : payload.items || [];
      setPlaybooks(list);
    } catch (err) {
      setFeedback({ type: 'error', text: getApiErrorMessage(err, 'Failed to load playbooks.') });
    }
  };

  useEffect(() => {
    loadPlaybooks();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFeedback(null);
    try {
      await api.post('/automation/playbooks', formState);
      setFormState({ name: '', description: '' });
      loadPlaybooks();
    } catch (err) {
      setFeedback({ type: 'error', text: getApiErrorMessage(err, 'Failed to create playbook.') });
    }
  };

  const runPlaybook = async (playbookId) => {
    try {
      await api.post(`/automation/playbooks/${playbookId}/run`);
      setFeedback({ type: 'success', text: 'Playbook run queued.' });
    } catch (err) {
      setFeedback({ type: 'error', text: getApiErrorMessage(err, 'Failed to run playbook.') });
    }
  };

  const columns = [
    { key: 'id', label: 'Playbook ID', render: (row) => formatDisplayId(row.id, 'Playbook') },
    { key: 'name', label: 'Name' },
    { key: 'status', label: 'Status' },
    {
      key: 'action',
      label: 'Action',
      render: (row) => (
        <button type="button" className="button-secondary" onClick={() => runPlaybook(row.id)}>
          Run
        </button>
      )
    }
  ];

  return (
    <div className="space-y-8">
      <PageHeader title="Automation" subtitle="Incident response playbooks and automation." />

      {feedback && (
        <AlertBanner
          tone={feedback.type === 'error' ? 'error' : 'info'}
          title={feedback.type === 'error' ? 'Action failed' : 'Success'}
          description={feedback.text}
        />
      )}

      <div className="glass-panel rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white">Create Playbook</h3>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <FormField
            label="Name"
            value={formState.name}
            onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
            required
          />
          <FormField
            label="Description"
            as="textarea"
            rows={3}
            value={formState.description}
            onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))}
          />
          <button type="submit" className="button-primary w-full">Create Playbook</button>
        </form>
      </div>

      <DataTable columns={columns} rows={playbooks} emptyMessage="No playbooks yet." />
    </div>
  );
};

export default Automation;
