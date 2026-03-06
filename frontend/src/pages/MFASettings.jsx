import React, { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import AlertBanner from '../components/AlertBanner';
import FormField from '../components/FormField';
import api, { getApiErrorMessage } from '../services/api';

const MFASettings = ({ embedded = false }) => {
  const [secret, setSecret] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  const loadSetup = async () => {
    setLoading(true);
    try {
      const response = await api.post('/auth/mfa/setup');
      const payload = response?.data?.data || response?.data || {};
      setSecret(payload.secret || '');
      setEnabled(Boolean(payload.enabled));
    } catch (err) {
      setFeedback({ type: 'error', text: getApiErrorMessage(err, 'Failed to load MFA setup.') });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSetup();
  }, []);

  const handleVerify = async (event) => {
    event.preventDefault();
    setFeedback(null);
    try {
      const response = await api.post('/auth/mfa/verify', { code });
      const message = response?.data?.message || 'MFA enabled.';
      setFeedback({ type: 'success', text: message });
      setEnabled(true);
    } catch (err) {
      setFeedback({ type: 'error', text: getApiErrorMessage(err, 'Verification failed.') });
    }
  };

  const handleDisable = async () => {
    setFeedback(null);
    try {
      const response = await api.post('/auth/mfa/disable');
      const message = response?.data?.message || 'MFA disabled.';
      setFeedback({ type: 'success', text: message });
      setEnabled(false);
    } catch (err) {
      setFeedback({ type: 'error', text: getApiErrorMessage(err, 'Disable failed.') });
    }
  };

  return (
    <div className={embedded ? 'space-y-6' : 'space-y-8'}>
      {!embedded && (
        <PageHeader title="MFA Settings" subtitle="Set up time-based one-time passwords for your account." />
      )}

      {embedded && (
        <div>
          <p className="text-xs uppercase tracking-[0.3em] brand-gold">MFA Settings</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">Secure your account</h2>
          <p className="mt-2 text-sm text-haze">Use an authenticator app for time-based codes.</p>
        </div>
      )}

      {feedback && (
        <AlertBanner
          tone={feedback.type === 'error' ? 'error' : 'info'}
          title={feedback.type === 'error' ? 'Action failed' : 'Success'}
          description={feedback.text}
        />
      )}

      <div className={embedded ? 'space-y-4' : 'glass-panel rounded-2xl p-6 space-y-4'}>
        <p className="text-sm text-haze">
          Use any authenticator app. Add the secret below, then verify with a 6-digit code.
        </p>
        {loading ? (
          <p className="text-sm text-haze">Loading setup...</p>
        ) : (
          <div className="rounded-xl border border-cyan/10 bg-midnight/70 px-4 py-3">
            <p className="text-xs uppercase tracking-wider text-haze">Secret</p>
            <p className="mt-2 font-mono text-sm text-cyan break-all">{secret || 'N/A'}</p>
            <p className="mt-2 text-xs text-haze">Status: {enabled ? 'Enabled' : 'Disabled'}</p>
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <FormField
            label="Verification Code"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="123456"
            required
          />
          <button type="submit" className="button-primary w-full">Enable MFA</button>
        </form>

        {enabled && (
          <button type="button" className="button-secondary w-full" onClick={handleDisable}>
            Disable MFA
          </button>
        )}
      </div>
    </div>
  );
};

export default MFASettings;
