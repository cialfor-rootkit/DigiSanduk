import React, { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import AlertBanner from '../components/AlertBanner';
import api, { getApiErrorMessage } from '../services/api';

const PrivacySettings = () => {
  const [allowAnon, setAllowAnon] = useState(false);
  const [consented, setConsented] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get('/privacy/me');
        const payload = response?.data?.data || response?.data || {};
        setAllowAnon(Boolean(payload.allow_anonymous_sharing));
        setConsented(Boolean(payload.consented));
      } catch (err) {
        setFeedback({ type: 'error', text: getApiErrorMessage(err, 'Failed to load privacy settings.') });
      }
    };

    load();
  }, []);

  const handleSave = async () => {
    setFeedback(null);
    try {
      const response = await api.post('/privacy/me', {
        allow_anonymous_sharing: allowAnon,
        consented
      });
      const message = response?.data?.message || 'Privacy settings updated.';
      setFeedback({ type: 'success', text: message });
    } catch (err) {
      setFeedback({ type: 'error', text: getApiErrorMessage(err, 'Failed to update privacy settings.') });
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Privacy & Consent"
        subtitle="Manage anonymity and data-sharing consent for compliance."
      />

      {feedback && (
        <AlertBanner
          tone={feedback.type === 'error' ? 'error' : 'info'}
          title={feedback.type === 'error' ? 'Update failed' : 'Saved'}
          description={feedback.text}
        />
      )}

      <div className="glass-panel rounded-2xl p-6 space-y-4">
        <label className="flex items-center gap-3 text-sm text-haze">
          <input
            type="checkbox"
            className="h-4 w-4 accent-cyan"
            checked={consented}
            onChange={(event) => setConsented(event.target.checked)}
          />
          I consent to data sharing under platform policies.
        </label>
        <label className="flex items-center gap-3 text-sm text-haze">
          <input
            type="checkbox"
            className="h-4 w-4 accent-cyan"
            checked={allowAnon}
            onChange={(event) => setAllowAnon(event.target.checked)}
          />
          Allow anonymous sharing (hide my organization identity).
        </label>
        <button type="button" className="button-primary w-full" onClick={handleSave}>
          Save Privacy Settings
        </button>
      </div>
    </div>
  );
};

export default PrivacySettings;
