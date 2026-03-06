import React, { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import AlertBanner from '../components/AlertBanner';
import FormField from '../components/FormField';
import DataTable from '../components/DataTable';
import LoadingSpinner from '../components/LoadingSpinner';
import api, { getApiErrorMessage } from '../services/api';
import { formatDisplayId } from '../utils/idFormat';

const trustOptions = ['low', 'medium', 'high'];

const AdminTrust = () => {
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [formState, setFormState] = useState({ org_id: '', trust_level: 'medium' });

  const loadOrgs = async () => {
    setLoading(true);
    try {
      const response = await api.get('/org/list');
      const payload = response?.data?.data || response?.data || [];
      const list = Array.isArray(payload) ? payload : payload.items || [];
      setOrgs(list);
      if (list.length > 0 && !formState.org_id) {
        setFormState((prev) => ({ ...prev, org_id: String(list[0].id) }));
      }
    } catch (err) {
      setOrgs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrgs();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFeedback(null);
    setSaving(true);
    try {
      const response = await api.put('/org/set-trust', {
        org_id: Number(formState.org_id),
        trust_level: formState.trust_level
      });
      const message = response?.data?.message || 'Trust level updated.';
      setFeedback({ type: 'success', text: message });
      loadOrgs();
    } catch (err) {
      setFeedback({ type: 'error', text: getApiErrorMessage(err, 'Failed to update trust level.') });
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: 'id', label: 'Org ID', render: (row) => formatDisplayId(row.id, 'Org') },
    { key: 'name', label: 'Organization' },
    { key: 'trust_level', label: 'Trust Level' }
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Admin Trust Management"
        subtitle="Assign trust levels to organizations so data can be shared securely."
      />

      {feedback && (
        <AlertBanner
          tone={feedback.type === 'error' ? 'error' : 'info'}
          title={feedback.type === 'error' ? 'Update failed' : 'Updated'}
          description={feedback.text}
        />
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="glass-panel rounded-2xl p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-white">Set trust level</h3>
          <p className="mt-1 text-sm text-haze">Only admin can update trust levels.</p>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-haze">Organization</span>
              <select
                className="input-field mt-2"
                value={formState.org_id}
                onChange={(event) => setFormState((prev) => ({ ...prev, org_id: event.target.value }))}
                required
                disabled={loading}
              >
                <option value="" disabled>
                  {loading ? 'Loading organizations...' : 'Select organization'}
                </option>
                {orgs.map((org) => (
                  <option key={org.id || org.name} value={String(org.id)}>
                    {org.name} ({formatDisplayId(org.id, 'Org')})
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-haze">Trust Level</span>
              <select
                className="input-field mt-2"
                value={formState.trust_level}
                onChange={(event) => setFormState((prev) => ({ ...prev, trust_level: event.target.value }))}
                required
              >
                {trustOptions.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </label>

            <button type="submit" className="button-primary w-full" disabled={saving}>
              {saving ? 'Updating...' : 'Update Trust Level'}
            </button>
          </form>
        </div>

        <div className="glass-panel rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white">Guidance</h3>
          <p className="mt-1 text-sm text-haze">Set to medium/high for sharing to succeed.</p>
          <div className="mt-4 space-y-3 text-sm text-white">
            <div className="rounded-xl border border-cyan/10 bg-midnight/70 px-4 py-3">
              Low: sharing blocked
            </div>
            <div className="rounded-xl border border-cyan/10 bg-midnight/70 px-4 py-3">
              Medium: trusted partners
            </div>
            <div className="rounded-xl border border-cyan/10 bg-midnight/70 px-4 py-3">
              High: critical exchanges
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner label="Loading organizations" />
      ) : (
        <DataTable columns={columns} rows={orgs} emptyMessage="No organizations yet." />
      )}
    </div>
  );
};

export default AdminTrust;
