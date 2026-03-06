import React, { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import FormField from '../components/FormField';
import AlertBanner from '../components/AlertBanner';
import DataTable from '../components/DataTable';
import api, { getApiErrorMessage } from '../services/api';
import { formatDisplayId } from '../utils/idFormat';

const ThreatIntel = () => {
  const [feeds, setFeeds] = useState([]);
  const [intel, setIntel] = useState([]);
  const [feedForm, setFeedForm] = useState({ name: '', source_url: '', description: '' });
  const [intelForm, setIntelForm] = useState({ feed_id: '', title: '', description: '', severity: 'medium', indicator: '' });
  const [feedback, setFeedback] = useState(null);

  const loadData = async () => {
    try {
      const feedResponse = await api.get('/threat/feeds');
      const feedPayload = feedResponse?.data?.data || feedResponse?.data || [];
      const feedList = Array.isArray(feedPayload) ? feedPayload : feedPayload.items || [];
      setFeeds(feedList);
      if (feedList.length > 0 && !intelForm.feed_id) {
        setIntelForm((prev) => ({ ...prev, feed_id: String(feedList[0].id) }));
      }

      const intelResponse = await api.get('/threat/intel');
      const intelPayload = intelResponse?.data?.data || intelResponse?.data || [];
      setIntel(Array.isArray(intelPayload) ? intelPayload : intelPayload.items || []);
    } catch (err) {
      setFeedback({ type: 'error', text: getApiErrorMessage(err, 'Failed to load threat intelligence.') });
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFeedSubmit = async (event) => {
    event.preventDefault();
    setFeedback(null);
    try {
      await api.post('/threat/feeds', feedForm);
      setFeedForm({ name: '', source_url: '', description: '' });
      loadData();
    } catch (err) {
      setFeedback({ type: 'error', text: getApiErrorMessage(err, 'Failed to add feed.') });
    }
  };

  const handleIntelSubmit = async (event) => {
    event.preventDefault();
    setFeedback(null);
    try {
      await api.post('/threat/intel', {
        ...intelForm,
        feed_id: Number(intelForm.feed_id)
      });
      setIntelForm({ feed_id: intelForm.feed_id, title: '', description: '', severity: 'medium', indicator: '' });
      loadData();
    } catch (err) {
      setFeedback({ type: 'error', text: getApiErrorMessage(err, 'Failed to add intel item.') });
    }
  };

  const feedColumns = [
    { key: 'id', label: 'Feed ID', render: (row) => formatDisplayId(row.id, 'Feed') },
    { key: 'name', label: 'Name' },
    { key: 'source_url', label: 'Source URL' }
  ];

  const intelColumns = [
    { key: 'id', label: 'Intel ID', render: (row) => formatDisplayId(row.id, 'Intel') },
    { key: 'title', label: 'Title' },
    { key: 'severity', label: 'Severity' },
    { key: 'indicator', label: 'Indicator' }
  ];

  return (
    <div className="space-y-8">
      <PageHeader title="Threat Intelligence" subtitle="Manage threat feeds and intelligence items." />

      {feedback && (
        <AlertBanner
          tone={feedback.type === 'error' ? 'error' : 'info'}
          title={feedback.type === 'error' ? 'Action failed' : 'Success'}
          description={feedback.text}
        />
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass-panel rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white">Add Feed</h3>
          <form onSubmit={handleFeedSubmit} className="mt-4 space-y-4">
            <FormField
              label="Feed Name"
              value={feedForm.name}
              onChange={(event) => setFeedForm((prev) => ({ ...prev, name: event.target.value }))}
              required
            />
            <FormField
              label="Source URL"
              value={feedForm.source_url}
              onChange={(event) => setFeedForm((prev) => ({ ...prev, source_url: event.target.value }))}
            />
            <FormField
              label="Description"
              as="textarea"
              rows={3}
              value={feedForm.description}
              onChange={(event) => setFeedForm((prev) => ({ ...prev, description: event.target.value }))}
            />
            <button type="submit" className="button-primary w-full">Add Feed</button>
          </form>
        </div>

        <div className="glass-panel rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white">Add Intel Item</h3>
          <form onSubmit={handleIntelSubmit} className="mt-4 space-y-4">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-haze">Feed</span>
              <select
                className="input-field mt-2"
                value={intelForm.feed_id}
                onChange={(event) => setIntelForm((prev) => ({ ...prev, feed_id: event.target.value }))}
                required
              >
                <option value="" disabled>
                  Select a feed
                </option>
                {feeds.map((feed) => (
                  <option key={feed.id} value={String(feed.id)}>
                    {feed.name} ({formatDisplayId(feed.id, 'Feed')})
                  </option>
                ))}
              </select>
            </label>
            <FormField
              label="Title"
              value={intelForm.title}
              onChange={(event) => setIntelForm((prev) => ({ ...prev, title: event.target.value }))}
              required
            />
            <FormField
              label="Severity"
              value={intelForm.severity}
              onChange={(event) => setIntelForm((prev) => ({ ...prev, severity: event.target.value }))}
            />
            <FormField
              label="Indicator"
              value={intelForm.indicator}
              onChange={(event) => setIntelForm((prev) => ({ ...prev, indicator: event.target.value }))}
            />
            <FormField
              label="Description"
              as="textarea"
              rows={3}
              value={intelForm.description}
              onChange={(event) => setIntelForm((prev) => ({ ...prev, description: event.target.value }))}
            />
            <button type="submit" className="button-primary w-full">Add Intel</button>
          </form>
        </div>
      </div>

      <DataTable columns={feedColumns} rows={feeds} emptyMessage="No feeds yet." />
      <DataTable columns={intelColumns} rows={intel} emptyMessage="No intel items yet." />
    </div>
  );
};

export default ThreatIntel;
