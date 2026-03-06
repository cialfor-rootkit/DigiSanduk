import React, { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import FormField from '../components/FormField';
import AlertBanner from '../components/AlertBanner';
import api, { getApiErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import MFASettings from './MFASettings';

const Profile = () => {
  const { user } = useAuth();
  const [formState, setFormState] = useState({ name: '', email: '', current_password: '', password: '' });
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    if (!user) return;
    setFormState({ name: user.name || '', email: user.email || '', current_password: '', password: '' });
  }, [user]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFeedback(null);
    try {
      await api.put('/auth/me', {
        name: formState.name || null,
        email: formState.email || null,
        password: formState.password || null,
        current_password: formState.current_password || null
      });
      setFeedback({ type: 'success', text: 'Profile updated.' });
      setFormState((prev) => ({ ...prev, current_password: '', password: '' }));
    } catch (err) {
      setFeedback({ type: 'error', text: getApiErrorMessage(err, 'Failed to update profile.') });
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="User Profile"
        subtitle="Edit your identity and access credentials."
      />

      {feedback && (
        <AlertBanner
          tone={feedback.type === 'error' ? 'error' : 'info'}
          title={feedback.type === 'error' ? 'Action failed' : 'Success'}
          description={feedback.text}
        />
      )}

      <div className="glass-panel rounded-2xl p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField
            label="Name"
            value={formState.name}
            onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
          />
          <FormField
            label="Email"
            type="email"
            value={formState.email}
            onChange={(event) => setFormState((prev) => ({ ...prev, email: event.target.value }))}
            required
          />
          <FormField
            label="Current Password"
            type="password"
            value={formState.current_password}
            onChange={(event) => setFormState((prev) => ({ ...prev, current_password: event.target.value }))}
            placeholder="Required to change password"
          />
          <FormField
            label="New Password"
            type="password"
            value={formState.password}
            onChange={(event) => setFormState((prev) => ({ ...prev, password: event.target.value }))}
            placeholder="Leave blank to keep current"
          />
          <button type="submit" className="button-primary w-full">Save Profile</button>
        </form>
      </div>

      <div className="glass-panel rounded-2xl p-6">
        <MFASettings embedded />
      </div>
    </div>
  );
};

export default Profile;
