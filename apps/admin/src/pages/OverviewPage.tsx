import { useEffect, useState } from 'react';

import { apiRequest } from '../api/client';

export function OverviewPage({ token }: { token: string }) {
  const [data, setData] = useState<any | null>(null);

  useEffect(() => {
    apiRequest('/admin/overview', {}, token).then(setData);
  }, [token]);

  if (!data) return <p>Loading overview...</p>;

  return (
    <div>
      <h1>Overview</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(120px, 1fr))', gap: 12 }}>
        <Card label="Ramps" value={data.ramps} />
        <Card label="Active ramps" value={data.active_ramps} />
        <Card label="Saved ramps" value={data.saved_ramps} />
        <Card label="Stations" value={data.stations} />
        <Card label="Failed jobs" value={data.failed_jobs} />
        <Card label="Recent reports" value={data.recent_reports} />
      </div>
      <h3 style={{ marginTop: 20 }}>Data source health</h3>
      <pre>{JSON.stringify(data.data_source_health, null, 2)}</pre>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 12 }}>
      <div style={{ color: '#4a5568' }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700 }}>{value}</div>
    </div>
  );
}
