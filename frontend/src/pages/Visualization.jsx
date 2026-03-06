import React, { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import AlertBanner from '../components/AlertBanner';
import api, { getApiErrorMessage } from '../services/api';

const Visualization = () => {
  const [graph, setGraph] = useState({ nodes: [], links: [] });
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get('/visualization/graph');
        const payload = response?.data?.data || response?.data || {};
        setGraph({ nodes: payload.nodes || [], links: payload.links || [] });
      } catch (err) {
        setError(getApiErrorMessage(err, 'Failed to load graph data.'));
      }
    };

    load();
  }, []);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Graph Visualization"
        subtitle="Relationship graph of organization sharing activity."
      />

      {error && <AlertBanner tone="error" title="Graph unavailable" description={error} />}

      <div className="glass-panel rounded-2xl p-6">
        <p className="text-sm text-haze">Nodes: {graph.nodes.length}</p>
        <p className="text-sm text-haze">Links: {graph.links.length}</p>
        <div className="mt-4 grid gap-3">
          {graph.links.map((link, index) => (
            <div key={index} className="rounded-xl border border-cyan/10 bg-midnight/70 px-4 py-3 text-sm text-white">
              {link.source} → {link.target} ({link.label})
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Visualization;
