import React, { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import FormField from '../components/FormField';
import AlertBanner from '../components/AlertBanner';
import DataTable from '../components/DataTable';
import api, { getApiErrorMessage } from '../services/api';
import { formatDisplayId } from '../utils/idFormat';

const Compliance = () => {
  const [policies, setPolicies] = useState([]);
  const [formState, setFormState] = useState({ name: '', framework: '', description: '' });
  const [feedback, setFeedback] = useState(null);

  const loadPolicies = async () => {
    try {
      const response = await api.get('/compliance/policies');
      const payload = response?.data?.data || response?.data || [];
      const list = Array.isArray(payload) ? payload : payload.items || [];
      setPolicies(list);
    } catch (err) {
      setFeedback({ type: 'error', text: getApiErrorMessage(err, 'Failed to load policies.') });
    }
  };

  useEffect(() => {
    loadPolicies();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFeedback(null);
    try {
      await api.post('/compliance/policies', formState);
      setFormState({ name: '', framework: '', description: '' });
      loadPolicies();
    } catch (err) {
      setFeedback({ type: 'error', text: getApiErrorMessage(err, 'Failed to add policy.') });
    }
  };

  const columns = [
    { key: 'id', label: 'Policy ID', render: (row) => formatDisplayId(row.id, 'Policy') },
    { key: 'name', label: 'Name' },
    { key: 'framework', label: 'Framework' },
    { key: 'status', label: 'Status' }
  ];

  return (
    <div className="space-y-8">
      <PageHeader title="Compliance" subtitle="Manage regulatory frameworks and policies." />

      {feedback && (
        <AlertBanner
          tone={feedback.type === 'error' ? 'error' : 'info'}
          title={feedback.type === 'error' ? 'Action failed' : 'Success'}
          description={feedback.text}
        />
      )}

      <div className="glass-panel rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white">Add Policy</h3>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <FormField
            label="Policy Name"
            value={formState.name}
            onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
            required
          />
          <FormField
            label="Framework (GDPR, HIPAA, ISO 27001)"
            value={formState.framework}
            onChange={(event) => setFormState((prev) => ({ ...prev, framework: event.target.value }))}
            required
          />
          <FormField
            label="Description"
            as="textarea"
            rows={3}
            value={formState.description}
            onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))}
          />
          <button type="submit" className="button-primary w-full">Add Policy</button>
        </form>
      </div>

      <DataTable columns={columns} rows={policies} emptyMessage="No policies yet." />
    </div>
  );
};

export default Compliance;
