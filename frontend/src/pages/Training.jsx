import React, { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import FormField from '../components/FormField';
import AlertBanner from '../components/AlertBanner';
import DataTable from '../components/DataTable';
import api, { getApiErrorMessage } from '../services/api';
import { formatDisplayId } from '../utils/idFormat';

const Training = () => {
  const [resources, setResources] = useState([]);
  const [formState, setFormState] = useState({ title: '', type: '', content: '' });
  const [feedback, setFeedback] = useState(null);

  const loadResources = async () => {
    try {
      const response = await api.get('/training/resources');
      const payload = response?.data?.data || response?.data || [];
      const list = Array.isArray(payload) ? payload : payload.items || [];
      setResources(list);
    } catch (err) {
      setFeedback({ type: 'error', text: getApiErrorMessage(err, 'Failed to load resources.') });
    }
  };

  useEffect(() => {
    loadResources();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFeedback(null);
    try {
      await api.post('/training/resources', formState);
      setFormState({ title: '', type: '', content: '' });
      loadResources();
    } catch (err) {
      setFeedback({ type: 'error', text: getApiErrorMessage(err, 'Failed to add resource.') });
    }
  };

  const columns = [
    { key: 'id', label: 'Resource ID', render: (row) => formatDisplayId(row.id, 'Resource') },
    { key: 'title', label: 'Title' },
    { key: 'type', label: 'Type' }
  ];

  return (
    <div className="space-y-8">
      <PageHeader title="Training & Support" subtitle="Publish training materials and guides." />

      {feedback && (
        <AlertBanner
          tone={feedback.type === 'error' ? 'error' : 'info'}
          title={feedback.type === 'error' ? 'Action failed' : 'Success'}
          description={feedback.text}
        />
      )}

      <div className="glass-panel rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white">Add Resource</h3>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <FormField
            label="Title"
            value={formState.title}
            onChange={(event) => setFormState((prev) => ({ ...prev, title: event.target.value }))}
            required
          />
          <FormField
            label="Type (Guide, Video, FAQ)"
            value={formState.type}
            onChange={(event) => setFormState((prev) => ({ ...prev, type: event.target.value }))}
            required
          />
          <FormField
            label="Content"
            as="textarea"
            rows={3}
            value={formState.content}
            onChange={(event) => setFormState((prev) => ({ ...prev, content: event.target.value }))}
          />
          <button type="submit" className="button-primary w-full">Add Resource</button>
        </form>
      </div>

      <DataTable columns={columns} rows={resources} emptyMessage="No resources yet." />
    </div>
  );
};

export default Training;
