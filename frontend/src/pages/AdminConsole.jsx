import React, { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import AlertBanner from '../components/AlertBanner';
import FormField from '../components/FormField';
import DataTable from '../components/DataTable';
import api, { getApiErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatDisplayId } from '../utils/idFormat';

const AdminConsole = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.is_super_admin || user?.email === 'admin@digisanduk';
  const [groups, setGroups] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', org_id: '' });
  const [orgForm, setOrgForm] = useState({ name: '' });
  const [trustForm, setTrustForm] = useState({ org_id: '', trust_level: 'medium' });

  const load = async () => {
    try {
      const response = await api.get('/admin/org-users');
      const payload = response?.data?.data || response?.data || [];
      const list = Array.isArray(payload) ? payload : payload.items || [];
      setGroups(list);
      const orgList = list.map((group) => ({ id: group.org_id, name: group.org_name }));
      setOrgs(orgList);
      if (!userForm.org_id && orgList.length > 0) {
        setUserForm((prev) => ({ ...prev, org_id: String(orgList[0].id) }));
        setTrustForm((prev) => ({ ...prev, org_id: String(orgList[0].id) }));
      }
    } catch (err) {
      setFeedback({ type: 'error', text: getApiErrorMessage(err, 'Failed to load users.') });
    }
  };

  useEffect(() => {
    if (!isSuperAdmin) return;
    load();
  }, [isSuperAdmin]);

  const assignAdmin = async (orgId, userId) => {
    setFeedback(null);
    try {
      await api.post('/admin/assign-org-admin', { org_id: orgId, user_id: userId });
      setFeedback({ type: 'success', text: 'Organization admin assigned.' });
      load();
    } catch (err) {
      setFeedback({ type: 'error', text: getApiErrorMessage(err, 'Failed to assign admin.') });
    }
  };

  const clearAdmin = async (orgId) => {
    setFeedback(null);
    try {
      await api.post('/admin/clear-org-admin', { org_id: orgId });
      setFeedback({ type: 'success', text: 'Organization admin cleared.' });
      load();
    } catch (err) {
      setFeedback({ type: 'error', text: getApiErrorMessage(err, 'Failed to clear admin.') });
    }
  };

  const deleteUser = async (userId) => {
    setFeedback(null);
    try {
      await api.delete(`/admin/users/${userId}`);
      setFeedback({ type: 'success', text: 'User deleted.' });
      load();
    } catch (err) {
      setFeedback({ type: 'error', text: getApiErrorMessage(err, 'Failed to delete user.') });
    }
  };

  const createUser = async (event) => {
    event.preventDefault();
    setFeedback(null);
    try {
      await api.post('/admin/users', {
        name: userForm.name || null,
        email: userForm.email,
        password: userForm.password,
        org_id: Number(userForm.org_id)
      });
      setFeedback({ type: 'success', text: 'User created.' });
      setUserForm({ name: '', email: '', password: '', org_id: userForm.org_id });
      load();
    } catch (err) {
      setFeedback({ type: 'error', text: getApiErrorMessage(err, 'Failed to create user.') });
    }
  };

  const createOrg = async (event) => {
    event.preventDefault();
    setFeedback(null);
    try {
      await api.post('/admin/orgs', { name: orgForm.name });
      setFeedback({ type: 'success', text: 'Organization created.' });
      setOrgForm({ name: '' });
      load();
    } catch (err) {
      setFeedback({ type: 'error', text: getApiErrorMessage(err, 'Failed to create organization.') });
    }
  };

  const updateTrust = async (event) => {
    event.preventDefault();
    setFeedback(null);
    try {
      await api.put('/org/set-trust', {
        org_id: Number(trustForm.org_id),
        trust_level: trustForm.trust_level
      });
      setFeedback({ type: 'success', text: 'Trust level updated.' });
      load();
    } catch (err) {
      setFeedback({ type: 'error', text: getApiErrorMessage(err, 'Failed to update trust level.') });
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="space-y-8">
        <PageHeader title="Super Admin Console" subtitle="Super admin only." />
        <AlertBanner tone="warning" title="Access denied" description="Only the super admin can manage users." />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Super Admin Console" subtitle="Manage orgs, users, admins, and trust levels." />

      {feedback && (
        <AlertBanner
          tone={feedback.type === 'error' ? 'error' : 'info'}
          title={feedback.type === 'error' ? 'Action failed' : 'Success'}
          description={feedback.text}
        />
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="glass-panel rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white">Add Organization</h3>
          <form onSubmit={createOrg} className="mt-4 space-y-4">
            <FormField
              label="Organization Name"
              value={orgForm.name}
              onChange={(event) => setOrgForm({ name: event.target.value })}
              required
            />
            <button type="submit" className="button-primary w-full">Create Organization</button>
          </form>
        </div>

        <div className="glass-panel rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white">Add Employee</h3>
          <form onSubmit={createUser} className="mt-4 space-y-4">
            <FormField
              label="Name"
              value={userForm.name}
              onChange={(event) => setUserForm((prev) => ({ ...prev, name: event.target.value }))}
            />
            <FormField
              label="Email"
              value={userForm.email}
              onChange={(event) => setUserForm((prev) => ({ ...prev, email: event.target.value }))}
              required
            />
            <FormField
              label="Password"
              type="password"
              value={userForm.password}
              onChange={(event) => setUserForm((prev) => ({ ...prev, password: event.target.value }))}
              required
            />
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-haze">Organization</span>
              <select
                className="input-field mt-2"
                value={userForm.org_id}
                onChange={(event) => setUserForm((prev) => ({ ...prev, org_id: event.target.value }))}
                required
              >
                <option value="" disabled>
                  Select organization
                </option>
                {orgs.map((org) => (
                  <option key={org.id} value={String(org.id)}>
                    {org.name} ({formatDisplayId(org.id, 'Org')})
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" className="button-primary w-full">Create Employee</button>
          </form>
        </div>

        <div className="glass-panel rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white">Set Trust Level</h3>
          <form onSubmit={updateTrust} className="mt-4 space-y-4">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-haze">Organization</span>
              <select
                className="input-field mt-2"
                value={trustForm.org_id}
                onChange={(event) => setTrustForm((prev) => ({ ...prev, org_id: event.target.value }))}
                required
              >
                <option value="" disabled>
                  Select organization
                </option>
                {orgs.map((org) => (
                  <option key={org.id} value={String(org.id)}>
                    {org.name} ({formatDisplayId(org.id, 'Org')})
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-haze">Trust Level</span>
              <select
                className="input-field mt-2"
                value={trustForm.trust_level}
                onChange={(event) => setTrustForm((prev) => ({ ...prev, trust_level: event.target.value }))}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
            <button type="submit" className="button-primary w-full">Update Trust</button>
          </form>
        </div>
      </div>

      {groups.map((group) => {
        const columns = [
          { key: 'id', label: 'User ID', render: (row) => formatDisplayId(row.id, 'User') },
          { key: 'name', label: 'Name' },
          { key: 'email', label: 'Email' },
          {
            key: 'actions',
            label: 'Actions',
            render: (row) => (
              <div className="flex gap-2">
                <button
                  type="button"
                  className="button-secondary"
                  onClick={() => assignAdmin(group.org_id, row.id)}
                  disabled={group.admin_user_id === row.id}
                >
                  {group.admin_user_id === row.id ? 'Org Admin' : 'Make Admin'}
                </button>
                <button type="button" className="button-secondary" onClick={() => deleteUser(row.id)}>
                  Delete
                </button>
              </div>
            )
          }
        ];

        return (
          <div key={group.org_id} className="glass-panel rounded-2xl p-6">
            <div className="flex flex-col gap-2">
              <h3 className="text-lg font-semibold text-white">{group.org_name}</h3>
              <p className="text-sm text-haze">Org ID: {formatDisplayId(group.org_id, 'Org')}</p>
              <p className="text-sm text-haze">Trust: {group.trust_level || 'low'}</p>
              <div className="flex items-center gap-3">
                <p className="text-sm text-haze">
                  Current Admin: {group.admin_user_id ? formatDisplayId(group.admin_user_id, 'User') : 'None'}
                </p>
                <button type="button" className="button-secondary" onClick={() => clearAdmin(group.org_id)}>
                  Clear Admin
                </button>
              </div>
            </div>
            <div className="mt-4">
              <DataTable columns={columns} rows={group.users || []} emptyMessage="No users in org." />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AdminConsole;
