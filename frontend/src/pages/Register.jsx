import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../layout/AuthLayout';
import FormField from '../components/FormField';
import AlertBanner from '../components/AlertBanner';
import api, { getApiErrorMessage } from '../services/api';

const Register = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orgs, setOrgs] = useState([]);
  const [orgChoice, setOrgChoice] = useState('');
  const [newOrgName, setNewOrgName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [orgLoading, setOrgLoading] = useState(true);

  useEffect(() => {
    const loadOrgs = async () => {
      setOrgLoading(true);
      try {
        const response = await api.get('/org/list');
        const payload = response?.data?.data || response?.data || [];
        const list = Array.isArray(payload) ? payload : payload.items || [];
        setOrgs(list);
      } catch (err) {
        setOrgs([]);
      } finally {
        setOrgLoading(false);
      }
    };

    loadOrgs();
  }, []);

  useEffect(() => {
    if (!orgLoading && !orgChoice) {
      if (orgs.length > 0) {
        setOrgChoice(orgs[0].name);
      } else {
        setOrgChoice('new');
      }
    }
  }, [orgLoading, orgs, orgChoice]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const organization_name = orgChoice === 'new' ? newOrgName.trim() : orgChoice;
      await api.post('/auth/create-user', { email, password, organization_name });
      setSuccess('Account created successfully. Redirecting to login...');
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 1200);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Registration failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const orgSelectDisabled = orgLoading;

  return (
    <AuthLayout>
      <div className="glass-panel rounded-3xl p-8">
        <p className="text-xs uppercase tracking-[0.4em] text-haze">New Account</p>
        <h2 className="mt-4 text-2xl font-semibold text-white">
          Create your <span className="brand-gold">DigiSanduk</span> access
        </h2>
        <p className="mt-2 text-sm text-haze">Set up credentials for secure data sharing.</p>

        {error && (
          <div className="mt-6">
            <AlertBanner tone="error" title="Registration failed" description={error} />
          </div>
        )}
        {success && (
          <div className="mt-6">
            <AlertBanner tone="info" title="Success" description={success} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <FormField
            label="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="operator@digisanduk.io"
            required
          />
          <FormField
            label="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Use 12+ characters"
            required
          />

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-haze">Organization</span>
            <select
              className="input-field mt-2"
              value={orgChoice}
              onChange={(event) => setOrgChoice(event.target.value)}
              required
              disabled={orgSelectDisabled}
            >
              <option value="" disabled>
                {orgLoading ? 'Loading organizations...' : 'Select an organization'}
              </option>
              {orgs.map((org) => (
                <option key={org.id || org.name} value={org.name}>
                  {org.name}
                </option>
              ))}
              <option value="new">Other (create new)</option>
            </select>
          </label>

          {orgChoice === 'new' && (
            <FormField
              label="New Organization Name"
              value={newOrgName}
              onChange={(event) => setNewOrgName(event.target.value)}
              placeholder="Your organization name"
              required
            />
          )}

          <button type="submit" className="button-primary w-full" disabled={loading}>
            {loading ? 'Provisioning...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-haze">
          Already have access?{' '}
          <Link className="text-cyan hover:text-neon" to="/login">
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default Register;
