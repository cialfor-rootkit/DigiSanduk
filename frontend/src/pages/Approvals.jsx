import React, { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import AlertBanner from '../components/AlertBanner';
import DataTable from '../components/DataTable';
import api, { getApiErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatDisplayId } from '../utils/idFormat';

const Approvals = () => {
  const { user } = useAuth();
  const isOrgAdmin = user?.is_org_admin;
  const [incoming, setIncoming] = useState([]);
  const [connections, setConnections] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [decisionMap, setDecisionMap] = useState({});
  const [toggleMap, setToggleMap] = useState({});

  const loadIncoming = async () => {
    try {
      const response = await api.get('/data/requests/incoming');
      const payload = response?.data?.data || response?.data || [];
      const list = Array.isArray(payload) ? payload : payload.items || [];
      setIncoming(list);
    } catch (err) {
      setFeedback({ type: 'error', text: getApiErrorMessage(err, 'Failed to load requests.') });
    }
  };

  const loadConnections = async () => {
    try {
      const response = await api.get('/data/connections');
      const payload = response?.data?.data || response?.data || [];
      const list = Array.isArray(payload) ? payload : payload.items || [];
      setConnections(list);
      const nextMap = {};
      list.forEach((item) => {
        nextMap[item.connection_id] = Boolean(item.enabled);
      });
      setToggleMap(nextMap);
    } catch (err) {
      setFeedback({ type: 'error', text: getApiErrorMessage(err, 'Failed to load connections.') });
    }
  };

  useEffect(() => {
    if (!isOrgAdmin) return;
    loadIncoming();
    loadConnections();
  }, [isOrgAdmin]);

  const handleReview = async (requestId, approve) => {
    setFeedback(null);
    try {
      await api.post(`/data/requests/${requestId}/review`, { approve });
      setFeedback({ type: 'success', text: approve ? 'Request accepted.' : 'Request rejected.' });
      loadIncoming();
      loadConnections();
    } catch (err) {
      setFeedback({ type: 'error', text: getApiErrorMessage(err, 'Failed to update request.') });
    }
  };

  const handleToggle = async (connectionId, enabled) => {
    setFeedback(null);
    try {
      await api.post(`/data/connections/${connectionId}/toggle`, { enabled });
      setToggleMap((prev) => ({ ...prev, [connectionId]: enabled }));
      setFeedback({ type: 'success', text: enabled ? 'Data sharing enabled.' : 'Data sharing disabled.' });
      loadConnections();
    } catch (err) {
      setFeedback({ type: 'error', text: getApiErrorMessage(err, 'Failed to toggle connection.') });
    }
  };

  const requestColumns = [
    { key: 'id', label: 'Request ID', render: (row) => formatDisplayId(row.id, 'Request') },
    {
      key: 'requester_org_id',
      label: 'Requester Org',
      render: (row) => row.requester_org_name
        ? `${row.requester_org_name} (${formatDisplayId(row.requester_org_id, 'Org')})`
        : formatDisplayId(row.requester_org_id, 'Org')
    },
    { key: 'data_type', label: 'Data Type' },
    { key: 'reason', label: 'Reason' },
    {
      key: 'status',
      label: 'Request Status',
      render: (row) => {
        const isPending = row.status === 'pending';
        const approveValue = decisionMap[row.id]?.approve ?? true;
        return (
          <div className="flex flex-col gap-2">
            <span className="text-sm text-white capitalize">{row.status}</span>
            <label className="flex items-center gap-3 text-sm text-haze">
              <input
                type="checkbox"
                className="h-4 w-4 accent-cyan"
                checked={approveValue}
                onChange={(event) =>
                  setDecisionMap((prev) => ({
                    ...prev,
                    [row.id]: { ...(prev[row.id] || {}), approve: event.target.checked }
                  }))
                }
                disabled={!isPending}
              />
              {approveValue ? 'Accept' : 'Reject'}
            </label>
          </div>
        );
      }
    },
    {
      key: 'actions',
      label: 'Submit',
      render: (row) => (
        <button
          type="button"
          className="button-primary"
          onClick={() => handleReview(row.id, decisionMap[row.id]?.approve ?? true)}
          disabled={row.status !== 'pending'}
        >
          Submit
        </button>
      )
    }
  ];

  const connectionColumns = [
    { key: 'connection_id', label: 'Connection ID', render: (row) => formatDisplayId(row.connection_id, 'Connection') },
    {
      key: 'other_org_id',
      label: 'Connected Org',
      render: (row) => row.other_org_name
        ? `${row.other_org_name} (${formatDisplayId(row.other_org_id, 'Org')})`
        : formatDisplayId(row.other_org_id, 'Org')
    },
    {
      key: 'request_status',
      label: 'Request Status',
      render: (row) => row.request_status ? row.request_status : 'accepted'
    },
    {
      key: 'enabled',
      label: 'Sharing Toggle',
      render: (row) => (
        <label className="flex items-center gap-3 text-sm text-haze">
          <input
            type="checkbox"
            className="h-4 w-4 accent-cyan"
            checked={toggleMap[row.connection_id] ?? Boolean(row.enabled)}
            onChange={(event) => handleToggle(row.connection_id, event.target.checked)}
          />
          {toggleMap[row.connection_id] ?? Boolean(row.enabled) ? 'Enabled' : 'Disabled'}
        </label>
      )
    }
  ];

  if (!isOrgAdmin) {
    return (
      <div className="space-y-8">
        <PageHeader title="Manage Data Share Requests" subtitle="Only organization admins can manage requests." />
        <AlertBanner tone="warning" title="Admin access required" description="Contact your org admin to manage sharing requests." />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Manage Data Share Requests" subtitle="Accept requests and control data sharing connections." />

      {feedback && (
        <AlertBanner
          tone={feedback.type === 'error' ? 'error' : 'info'}
          title={feedback.type === 'error' ? 'Action failed' : 'Success'}
          description={feedback.text}
        />
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Incoming Requests</h3>
        <DataTable columns={requestColumns} rows={incoming} emptyMessage="No incoming requests yet." />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Active Share Connections</h3>
        <DataTable columns={connectionColumns} rows={connections} emptyMessage="No active connections yet." />
      </div>
    </div>
  );
};

export default Approvals;
