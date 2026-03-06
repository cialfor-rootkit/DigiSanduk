import React, { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import AuthLayout from '../layout/AuthLayout';
import FormField from '../components/FormField';
import AlertBanner from '../components/AlertBanner';
import api, { getApiErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { login } = useAuth();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const baseUrl = useMemo(() => import.meta.env.VITE_API_BASE_URL || '', []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password, mfa_code: mfaCode || null });
      const token =
        response?.data?.access_token ||
        response?.data?.token ||
        response?.data?.data?.access_token ||
        response?.data?.data?.token;

      if (!token) {
        throw new Error('No access token returned by the server.');
      }

      login(token, { email }, redirectTo);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Login failed. Please verify your credentials and try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="glass-panel rounded-3xl p-8">
        <p className="text-xs uppercase tracking-[0.4em] text-haze">Operator Access</p>
        <h2 className="mt-4 text-2xl font-semibold text-white">
          Sign in to <span className="brand-gold">DigiSanduk</span>
        </h2>
        <p className="mt-2 text-sm text-haze">Authenticate with your organization-issued credentials.</p>

        {!baseUrl && (
          <div className="mt-6">
            <AlertBanner
              tone="warning"
              title="API base URL missing"
              description="Set VITE_API_BASE_URL in your environment to connect to the FastAPI backend."
            />
          </div>
        )}

        {error && (
          <div className="mt-6">
            <AlertBanner tone="error" title="Authentication failed" description={error} />
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
            placeholder="••••••••"
            required
          />
          <FormField
            label="MFA Code (if enabled)"
            value={mfaCode}
            onChange={(event) => setMfaCode(event.target.value)}
            placeholder="123456"
          />
          <button type="submit" className="button-primary w-full" disabled={loading}>
            {loading ? 'Authenticating...' : 'Access Console'}
          </button>
        </form>
      </div>
    </AuthLayout>
  );
};

export default Login;
