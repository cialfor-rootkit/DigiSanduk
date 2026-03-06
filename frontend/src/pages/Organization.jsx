import React, { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import AlertBanner from '../components/AlertBanner';
import LoadingSpinner from '../components/LoadingSpinner';
import api, { getApiErrorMessage } from '../services/api';
import { formatDisplayId } from '../utils/idFormat';

const fallbackOrg = {
  id: 'ORG-1294',
  name: 'DigiSanduk Security Unit',
  domain: 'digisanduk.io',
  description: 'Threat intelligence response team covering strategic partners.',
  created_at: '2025-11-02T10:14:00Z'
};

const Organization = () => {
  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [placeholder, setPlaceholder] = useState(false);
  const [notice, setNotice] = useState('');

  const loadOrg = async () => {
    setLoading(true);
    setNotice('');
    setPlaceholder(false);
    try {
      const response = await api.get('/org/me');
      const payload = response?.data?.data || response?.data || {};
      setOrg({
        id: payload.id || payload.org_id || fallbackOrg.id,
        name: payload.name || payload.org_name || fallbackOrg.name,
        domain: payload.domain || payload.email_domain || fallbackOrg.domain,
        description: payload.description || fallbackOrg.description,
        created_at: payload.created_at || payload.createdAt || fallbackOrg.created_at
      });
    } catch (err) {
      setOrg(fallbackOrg);
      setPlaceholder(true);
      setNotice(getApiErrorMessage(err, 'Live organization details are unavailable.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrg();
  }, []);


  return (
    <div className="space-y-8">
      <PageHeader
        title="Organization Control"
        subtitle="Review your organization identity for secure data exchange."
      />

      {placeholder && (
        <AlertBanner
          tone="warning"
          title="Showing placeholder organization"
          description={notice || 'Connect the backend to load your real organization details.'}
        />
      )}

      {loading ? (
        <LoadingSpinner label="Loading organization profile" />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="glass-panel rounded-2xl p-6 lg:col-span-3">
            <h3 className="text-lg font-semibold text-white">Organization Profile</h3>
            <p className="mt-1 text-sm text-haze">Current organization metadata tied to your account.</p>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wider text-haze">Organization ID</p>
                <p className="mt-2 text-sm text-white">{formatDisplayId(org?.id, 'Org')}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-haze">Name</p>
                <p className="mt-2 text-sm text-white">{org?.name}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-haze">Domain</p>
                <p className="mt-2 text-sm text-white">{org?.domain}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-haze">Created At</p>
                <p className="mt-2 text-sm text-white">{org?.created_at}</p>
              </div>
            </div>
            <div className="mt-6">
              <p className="text-xs uppercase tracking-wider text-haze">Description</p>
              <p className="mt-2 text-sm text-white">{org?.description}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Organization;
