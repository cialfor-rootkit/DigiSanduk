import React, { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import FormField from '../components/FormField';
import AlertBanner from '../components/AlertBanner';
import DataTable from '../components/DataTable';
import api, { getApiErrorMessage } from '../services/api';
import { formatDisplayId } from '../utils/idFormat';

const Marketplace = () => {
  const [items, setItems] = useState([]);
  const [formState, setFormState] = useState({ name: '', provider: '', category: '', description: '' });
  const [feedback, setFeedback] = useState(null);

  const loadItems = async () => {
    try {
      const response = await api.get('/marketplace/items');
      const payload = response?.data?.data || response?.data || [];
      const list = Array.isArray(payload) ? payload : payload.items || [];
      setItems(list);
    } catch (err) {
      setFeedback({ type: 'error', text: getApiErrorMessage(err, 'Failed to load marketplace items.') });
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFeedback(null);
    try {
      await api.post('/marketplace/items', formState);
      setFormState({ name: '', provider: '', category: '', description: '' });
      loadItems();
    } catch (err) {
      setFeedback({ type: 'error', text: getApiErrorMessage(err, 'Failed to add item.') });
    }
  };

  const columns = [
    { key: 'id', label: 'Item ID', render: (row) => formatDisplayId(row.id, 'Item') },
    { key: 'name', label: 'Name' },
    { key: 'provider', label: 'Provider' },
    { key: 'category', label: 'Category' }
  ];

  return (
    <div className="space-y-8">
      <PageHeader title="Threat Intel Marketplace" subtitle="Catalog and share third-party intel feeds." />

      {feedback && (
        <AlertBanner
          tone={feedback.type === 'error' ? 'error' : 'info'}
          title={feedback.type === 'error' ? 'Action failed' : 'Success'}
          description={feedback.text}
        />
      )}

      <div className="glass-panel rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white">Add Marketplace Item</h3>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <FormField
            label="Name"
            value={formState.name}
            onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
            required
          />
          <FormField
            label="Provider"
            value={formState.provider}
            onChange={(event) => setFormState((prev) => ({ ...prev, provider: event.target.value }))}
            required
          />
          <FormField
            label="Category"
            value={formState.category}
            onChange={(event) => setFormState((prev) => ({ ...prev, category: event.target.value }))}
          />
          <FormField
            label="Description"
            as="textarea"
            rows={3}
            value={formState.description}
            onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))}
          />
          <button type="submit" className="button-primary w-full">Add Item</button>
        </form>
      </div>

      <DataTable columns={columns} rows={items} emptyMessage="No marketplace items yet." />
    </div>
  );
};

export default Marketplace;
