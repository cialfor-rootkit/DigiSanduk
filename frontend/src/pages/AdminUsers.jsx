import React, { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import AlertBanner from '../components/AlertBanner';
import DataTable from '../components/DataTable';
import api, { getApiErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatDisplayId } from '../utils/idFormat';

const AdminUsers = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.is_super_admin || user?.email === 'admin@digisanduk';
  const [groups, setGroups] = useState([]);
  const [feedback, setFeedback] = useState(null);

  const loadGroups = async () => {
    try {
      const response = await api.get('/admin/org-users');
      const payload = response?.data?.data || response?.data || [];
      setGroups(Array.isArray(payload) ? payload : payload.items || []);
    } catch (err) {
      setFeedback({ type: 'error', text: getApiErrorMessage(err, 'Failed to load users.') });
    }
  };

  useEffect(() => {
    if (!isSuperAdmin) return;
    loadGroups();
  }, [isSuperAdmin]);

  const assignAdmin = async (orgId, userId) => {
    setFeedback(null);
    try {
      await api.post('/admin/assign-org-admin', { org_id: orgId, user_id: userId });
      setFeedback({ type: 'success', text: 'Organization admin assigned.' });
      loadGroups();
    } catch (err) {
      setFeedback({ type: 'error', text: getApiErrorMessage(err, 'Failed to assign admin.') });
    }
  };

  const deleteUser = async (userId) => {
    setFeedback(null);
    try {
      await api.delete(`/admin/users/${userId}`);
      setFeedback({ type: 'success', text: 'User deleted.' });
      loadGroups();
    } catch (err) {
      setFeedback({ type: 'error', text: getApiErrorMessage(err, 'Failed to delete user.') });
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="space-y-8">
        <PageHeader title="User Administration" subtitle="Super admin only." />
        <AlertBanner tone="warning" title="Access denied" description="Only the super admin can manage users." />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader title="User Administration" subtitle="Manage users by organization." />

      {feedback && (
        <AlertBanner
          tone={feedback.type === 'error' ? 'error' : 'info'}
          title={feedback.type === 'error' ? 'Action failed' : 'Success'}
          description={feedback.text}
        />
      )}

      {groups.map((group) => {
        const columns = [
          { key: 'id', label: 'User ID', render: (row) => formatDisplayId(row.id, 'User') },
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
              <p className="text-sm text-haze">
                Current Admin: {group.admin_user_id ? formatDisplayId(group.admin_user_id, 'User') : 'None'}
              </p>
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

export default AdminUsers;
