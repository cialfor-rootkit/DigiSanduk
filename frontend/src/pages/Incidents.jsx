import React, { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import FormField from '../components/FormField';
import AlertBanner from '../components/AlertBanner';
import DataTable from '../components/DataTable';
import api, { getApiErrorMessage } from '../services/api';
import { formatDisplayId } from '../utils/idFormat';

const Incidents = () => {
  const [incidents, setIncidents] = useState([]);
  const [formState, setFormState] = useState({ title: '', description: '', severity: 'medium' });
  const [feedback, setFeedback] = useState(null);

  const loadIncidents = async () => {
    try {
      const response = await api.get('/incidents');
      const payload = response?.data?.data || response?.data || [];
      const list = Array.isArray(payload) ? payload : payload.items || [];
      setIncidents(list);
    } catch (err) {
      setFeedback({ type: 'error', text: getApiErrorMessage(err, 'Failed to load incidents.') });
    }
  };

  useEffect(() => {
    loadIncidents();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFeedback(null);
    try {
      const response = await api.post('/incidents', formState);
      const message = response?.data?.message || 'Incident reported.';
      setFeedback({ type: 'success', text: message });
      setFormState({ title: '', description: '', severity: 'medium' });
      loadIncidents();
    } catch (err) {
      setFeedback({ type: 'error', text: getApiErrorMessage(err, 'Failed to report incident.') });
    }
  };

  const columns = [
    { key: 'id', label: 'Incident ID', render: (row) => formatDisplayId(row.id, 'Incident') },
    { key: 'title', label: 'Title' },
    { key: 'severity', label: 'Severity' },
    { key: 'status', label: 'Status' },
    { key: 'created_at', label: 'Reported At' }
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Incident Reporting"
        subtitle="Report and track security incidents with your team."
      />

      {feedback && (
        <AlertBanner
          tone={feedback.type === 'error' ? 'error' : 'info'}
          title={feedback.type === 'error' ? 'Action failed' : 'Success'}
          description={feedback.text}
        />
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="glass-panel rounded-2xl p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-white">Report an incident</h3>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <FormField
              label="Title"
              value={formState.title}
              onChange={(event) => setFormState((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="Unauthorized access detected"
              required
            />
            <FormField
              label="Description"
              as="textarea"
              rows={4}
              value={formState.description}
              onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))}
              placeholder="Describe the incident and impact"
              required
            />
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-haze">Severity</span>
              <select
                className="input-field mt-2"
                value={formState.severity}
                onChange={(event) => setFormState((prev) => ({ ...prev, severity: event.target.value }))}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </label>
            <button type="submit" className="button-primary w-full">Report Incident</button>
          </form>
        </div>
        <div className="glass-panel rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white">Guidance</h3>
          <p className="mt-1 text-sm text-haze">Keep timelines and evidence clear.</p>
          <div className="mt-4 space-y-3 text-sm text-white">
            <div className="rounded-xl border border-cyan/10 bg-midnight/70 px-4 py-3">Include impact scope</div>
            <div className="rounded-xl border border-cyan/10 bg-midnight/70 px-4 py-3">Attach indicators where possible</div>
            <div className="rounded-xl border border-cyan/10 bg-midnight/70 px-4 py-3">Update status as resolved</div>
          </div>
        </div>
      </div>

      <DataTable columns={columns} rows={incidents} emptyMessage="No incidents reported yet." />
    </div>
  );
};

export default Incidents;
