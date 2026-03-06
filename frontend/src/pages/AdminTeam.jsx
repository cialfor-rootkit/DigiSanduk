import React, { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import FormField from '../components/FormField';
import AlertBanner from '../components/AlertBanner';
import DataTable from '../components/DataTable';
import api, { getApiErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatDisplayId } from '../utils/idFormat';

const AdminTeam = () => {
  const { user } = useAuth();
  const isOrgAdmin = user?.is_org_admin;
  const [users, setUsers] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [formState, setFormState] = useState({ name: '', email: '', password: '' });
  const [togglingId, setTogglingId] = useState(null);

  const loadUsers = async () => {
    try {
      const response = await api.get('/org/admin/users');
      const payload = response?.data?.data || response?.data || [];
      const list = Array.isArray(payload) ? payload : payload.users || payload.items || [];
      setUsers(list);
    } catch (err) {
      setFeedback({ type: 'error', text: getApiErrorMessage(err, 'Failed to load team.') });
    }
  };

  useEffect(() => {
    if (!isOrgAdmin) return;
    loadUsers();
  }, [isOrgAdmin]);

  const createUser = async (event) => {
    event.preventDefault();
    setFeedback(null);
    try {
      await api.post('/org/admin/users', formState);
      setFeedback({ type: 'success', text: 'Employee created.' });
      setFormState({ name: '', email: '', password: '' });
      loadUsers();
    } catch (err) {
      setFeedback({ type: 'error', text: getApiErrorMessage(err, 'Failed to create employee.') });
    }
  };

  const toggleUserStatus = async (userId, nextStatus) => {
    setFeedback(null);
    setTogglingId(userId);
    try {
      await api.put('/org/admin/users/status', { user_id: userId, is_active: nextStatus });
      setFeedback({ type: 'success', text: `User ${nextStatus ? 'enabled' : 'disabled'}.` });
      loadUsers();
    } catch (err) {
      setFeedback({ type: 'error', text: getApiErrorMessage(err, 'Failed to update user status.') });
    } finally {
      setTogglingId(null);
    }
  };

  const columns = [
    { key: 'id', label: 'User ID', render: (row) => formatDisplayId(row.id, 'User') },
    {
      key: 'name',
      label: 'Name',
      render: (row) => (
        <div className="flex items-center gap-2">
          <span>{row.name || '--'}</span>
          {row.is_org_admin && (
            <span className="rounded-full border border-gold/40 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-gold">
              Org Admin
            </span>
          )}
        </div>
      )
    },
    { key: 'email', label: 'Email' },
    {
      key: 'status',
      label: 'Access',
      render: (row) => {
        const isActive = row.is_active !== false;
        const disabled = togglingId === row.id;
        if (row.is_org_admin) {
          return <span className="text-sm text-haze">—</span>;
        }
        return (
          <div className={`toggle-container compact ${isActive ? 'is-on' : ''}`}>
            <label className="toggle-wrap">
              <input
                id={`user-toggle-${row.id}`}
                className="toggle-input"
                type="checkbox"
                checked={isActive}
                disabled={disabled}
                onChange={(event) => toggleUserStatus(row.id, event.target.checked)}
              />
              <div className="toggle-track">
                <div className="track-lines">
                  <div className="track-line" />
                </div>
                <div className="toggle-thumb">
                  <div className="thumb-core">
                    <div className="thumb-inner" />
                  </div>
                  <div className="thumb-scan" />
                  <div className="thumb-particles">
                    <span className="thumb-particle" />
                    <span className="thumb-particle" />
                    <span className="thumb-particle" />
                    <span className="thumb-particle" />
                    <span className="thumb-particle" />
                  </div>
                </div>
                <div className="toggle-data">
                  <span className="data-text off">Disabled</span>
                  <span className="data-text on">Enabled</span>
                  <span className="status-indicator off" />
                  <span className="status-indicator on" />
                </div>
                <div className="energy-rings">
                  <span className="energy-ring" />
                  <span className="energy-ring" />
                  <span className="energy-ring" />
                </div>
                <div className="interface-lines">
                  <span className="interface-line" />
                  <span className="interface-line" />
                  <span className="interface-line" />
                  <span className="interface-line" />
                  <span className="interface-line" />
                  <span className="interface-line" />
                </div>
                <div className="holo-glow" />
              </div>
            </label>
            <div className="toggle-label">Access</div>
          </div>
        );
      }
    }
  ];

  if (!isOrgAdmin) {
    return (
      <div className="space-y-8">
        <PageHeader title="Team Management" subtitle="Organization admins only." />
        <AlertBanner tone="warning" title="Access denied" description="Only org admins can manage employees." />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Team Management" subtitle="Add employees to your organization." />

      {feedback && (
        <AlertBanner
          tone={feedback.type === 'error' ? 'error' : 'info'}
          title={feedback.type === 'error' ? 'Action failed' : 'Success'}
          description={feedback.text}
        />
      )}

      <div className="glass-panel rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white">Add Employee</h3>
        <form onSubmit={createUser} className="mt-4 space-y-4">
          <FormField
            label="Name"
            value={formState.name}
            onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
          />
          <FormField
            label="Email"
            value={formState.email}
            onChange={(event) => setFormState((prev) => ({ ...prev, email: event.target.value }))}
            required
          />
          <FormField
            label="Password"
            type="password"
            value={formState.password}
            onChange={(event) => setFormState((prev) => ({ ...prev, password: event.target.value }))}
            required
          />
          <button type="submit" className="button-primary w-full">Create Employee</button>
        </form>
      </div>

      <DataTable columns={columns} rows={users} emptyMessage="No employees yet." />
    </div>
  );
};

export default AdminTeam;
