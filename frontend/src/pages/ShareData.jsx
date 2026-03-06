import React, { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import FormField from '../components/FormField';
import AlertBanner from '../components/AlertBanner';
import DataTable from '../components/DataTable';
import LoadingSpinner from '../components/LoadingSpinner';
import api, { getApiErrorMessage } from '../services/api';
import { formatDisplayId } from '../utils/idFormat';

const fallbackShares = [
  {
    id: 'SHR-2201',
    target_org_id: 'ORG-982',
    data_type: 'Malware IOC Bundle',
    status: 'Delivered',
    created_at: '2026-02-03T16:04:00Z'
  },
  {
    id: 'SHR-2188',
    target_org_id: 'ORG-473',
    data_type: 'Phishing Campaign Report',
    status: 'Pending',
    created_at: '2026-02-02T09:17:00Z'
  }
];

const ShareData = () => {
  const [formState, setFormState] = useState({
    target_org_id: '',
    data_type: '',
    encrypted_payload: '',
    threat_type: '',
    severity: 'medium',
    sector: '',
    tags: '',
    anonymize_source: false
  });
  const [shares, setShares] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [placeholder, setPlaceholder] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);
  const [orgLoading, setOrgLoading] = useState(true);
  const [blockReason, setBlockReason] = useState('');

  const loadShares = async () => {
    setLoading(true);
    setNotice('');
    setPlaceholder(false);
    try {
      const response = await api.get('/data/shared');
      const payload = response?.data?.data || response?.data || [];
      setShares(Array.isArray(payload) ? payload : payload.items || []);
    } catch (err) {
      setShares(fallbackShares);
      setPlaceholder(true);
      setNotice(getApiErrorMessage(err, 'Live shared data feed unavailable.'));
    } finally {
      setLoading(false);
    }
  };

  const loadConnections = async () => {
    setOrgLoading(true);
    try {
      const response = await api.get('/data/connections/active');
      const payload = response?.data?.data || response?.data || [];
      const list = Array.isArray(payload) ? payload : payload.items || [];
      const mapped = list.map((item) => ({ id: item.other_org_id, name: item.other_org_name || `Org ${item.other_org_id}` }));
      setOrgs(mapped);
      setBlockReason(mapped.length === 0 ? 'No active data sharing connections.' : '');
      if (mapped.length > 0 && !formState.target_org_id) {
        setFormState((prev) => ({ ...prev, target_org_id: String(mapped[0].id) }));
      }
    } catch (err) {
      setOrgs([]);
      setBlockReason('No active data sharing connections.');
    } finally {
      setOrgLoading(false);
    }
  };

  useEffect(() => {
    loadShares();
    loadConnections();
  }, []);

  useEffect(() => {
    if (orgs.length > 0 && blockReason) {
      setBlockReason('');
    }
  }, [formState.target_org_id, orgs.length, blockReason]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFeedback(null);
    setSaving(true);
    try {
      const response = await api.post('/data/share', {
        target_org_id: Number(formState.target_org_id),
        data_type: formState.data_type,
        encrypted_payload: formState.encrypted_payload,
        threat_type: formState.threat_type || null,
        severity: formState.severity || null,
        sector: formState.sector || null,
        tags: formState.tags
          ? formState.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
          : [],
        anonymize_source: Boolean(formState.anonymize_source)
      });
      const message =
        response?.data?.message ||
        response?.data?.data?.message ||
        'Secure data payload shared successfully.';
      setFeedback({ type: 'success', text: message });
      setFormState((prev) => ({
        ...prev,
        data_type: '',
        encrypted_payload: '',
        threat_type: '',
        severity: 'medium',
        sector: '',
        tags: '',
        anonymize_source: false
      }));
      loadShares();
    } catch (err) {
      const detail = getApiErrorMessage(err, '');
      if (detail.toLowerCase().includes('not trusted')) {
        setBlockReason('Sharing blocked: target organization is not trusted.');
      } else if (detail.toLowerCase().includes('no active data sharing connection')) {
        setBlockReason('Sharing blocked: no active connection with that organization.');
      } else if (detail.toLowerCase().includes('cannot share with your own organization')) {
        setBlockReason('Sharing blocked: cannot share with your own organization.');
      }
      setFeedback({
        type: 'error',
        text: getApiErrorMessage(err, 'Failed to share data. Please verify the payload.')
      });
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: 'id', label: 'Share ID', render: (row) => formatDisplayId(row.id, 'Share') },
    { key: 'target_org_id', label: 'Target Org', render: (row) => formatDisplayId(row.target_org_id, 'Org') },
    { key: 'data_type', label: 'Data Type' },
    { key: 'status', label: 'Status' },
    { key: 'created_at', label: 'Timestamp' }
  ];

  const sharingDisabled = orgs.length === 0;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Share Security Data"
        subtitle="Dispatch encrypted security intelligence to trusted partner organizations."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="glass-panel rounded-2xl p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-white">Create a new share</h3>
          <p className="mt-1 text-sm text-haze">Encrypt the payload before submission to DigiSanduk.</p>
      {(sharingDisabled || blockReason) && (
        <div className="mt-4">
          <AlertBanner
            tone="warning"
            title="Sharing blocked"
            description={blockReason || 'Request access from a partner org and enable the sharing switch to send data.'}
          />
        </div>
      )}
          {feedback && (
            <div className="mt-4">
              <AlertBanner
                tone={feedback.type === 'error' ? 'error' : 'info'}
                title={feedback.type === 'error' ? 'Share failed' : 'Share dispatched'}
                description={feedback.text}
              />
            </div>
          )}
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-haze">Target Organization</span>
              <select
                className="input-field mt-2"
                value={formState.target_org_id}
                onChange={(event) => setFormState((prev) => ({ ...prev, target_org_id: event.target.value }))}
                required
                disabled={orgLoading || sharingDisabled}
              >
                <option value="" disabled>
                  {orgLoading ? 'Loading organizations...' : 'Select organization'}
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
              placeholder="Malware IOC Bundle"
              required
            />
            <FormField
              label="Threat Type"
              value={formState.threat_type}
              onChange={(event) => setFormState((prev) => ({ ...prev, threat_type: event.target.value }))}
              placeholder="Ransomware, Phishing, APT"
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
            <FormField
              label="Sector"
              value={formState.sector}
              onChange={(event) => setFormState((prev) => ({ ...prev, sector: event.target.value }))}
              placeholder="Finance, Healthcare, Telecom"
            />
            <FormField
              label="Tags (comma separated)"
              value={formState.tags}
              onChange={(event) => setFormState((prev) => ({ ...prev, tags: event.target.value }))}
              placeholder="malware, ioc, urgent"
            />
            <FormField
              label="Encrypted Payload"
              as="textarea"
              rows={5}
              value={formState.encrypted_payload}
              onChange={(event) => setFormState((prev) => ({ ...prev, encrypted_payload: event.target.value }))}
              placeholder="Paste the encrypted payload or reference token"
              required
            />
            <label className="flex items-center gap-2 text-sm text-haze">
              <input
                type="checkbox"
                className="h-4 w-4 accent-cyan"
                checked={formState.anonymize_source}
                onChange={(event) => setFormState((prev) => ({ ...prev, anonymize_source: event.target.checked }))}
              />
              Share anonymously (hide your org ID from recipient)
            </label>
            <button type="submit" className="button-primary w-full" disabled={saving || sharingDisabled}>
              {saving ? 'Sending...' : 'Send Secure Payload'}
            </button>
          </form>
        </div>

        <div className="glass-panel rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white">Sharing guidance</h3>
          <p className="mt-1 text-sm text-haze">Ensure data complies with policy and encryption standards.</p>
          <div className="mt-4 space-y-3 text-sm text-white">
            <div className="rounded-xl border border-cyan/10 bg-midnight/70 px-4 py-3">
              Use approved encryption keys.
            </div>
            <div className="rounded-xl border border-cyan/10 bg-midnight/70 px-4 py-3">
              Tag data type consistently for routing.
            </div>
            <div className="rounded-xl border border-cyan/10 bg-midnight/70 px-4 py-3">
              Validate recipient organization ID.
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-2">
          <h3 className="text-lg font-semibold text-white">Outbound shares</h3>
          <p className="text-sm text-haze">Track payloads you have dispatched.</p>
        </div>

        {placeholder && (
          <AlertBanner
            tone="warning"
            title="Showing placeholder shares"
            description={notice || 'Connect the backend to load your live share history.'}
          />
        )}

        {loading ? (
          <LoadingSpinner label="Loading outbound shares" />
        ) : (
          <DataTable columns={columns} rows={shares} emptyMessage="No outbound shares yet." />
        )}
      </div>
    </div>
  );
};

export default ShareData;
