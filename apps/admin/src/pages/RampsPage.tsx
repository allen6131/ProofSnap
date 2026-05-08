import { useEffect, useMemo, useState } from 'react';

import { apiRequest } from '../api/client';
import { Ramp } from '../types';

export function RampsPage({ token }: { token: string }) {
  const [ramps, setRamps] = useState<Ramp[]>([]);
  const [selected, setSelected] = useState<Ramp | null>(null);
  const [search, setSearch] = useState('');

  const load = () => apiRequest<Ramp[]>('/admin/ramps', {}, token).then(setRamps);

  useEffect(() => {
    load();
  }, [token]);

  const filtered = useMemo(() => ramps.filter((r) => r.name.toLowerCase().includes(search.toLowerCase())), [ramps, search]);

  const verify = async (rampId: string) => {
    await apiRequest(`/admin/ramps/${rampId}/verify`, { method: 'POST' }, token);
    load();
  };

  const refreshRamp = async (rampId: string) => {
    await apiRequest(`/admin/refresh-ramp/${rampId}`, { method: 'POST' }, token);
    load();
  };

  const saveEdit = async () => {
    if (!selected) return;
    await apiRequest(`/admin/ramps/${selected.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        status: selected.status,
        confidence_score: selected.confidence_score,
      }),
    }, token);
    load();
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 16 }}>
      <div>
        <h1>Ramps</h1>
        <input placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} style={{ marginBottom: 12, width: '100%' }} />
        <table width="100%" cellPadding={8} style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
              <th>Name</th>
              <th>Source</th>
              <th>Status</th>
              <th>Confidence</th>
              <th>Verified</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((ramp) => (
              <tr key={ramp.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td>{ramp.name}</td>
                <td>{ramp.source}</td>
                <td>{ramp.status}</td>
                <td>{ramp.confidence_score}</td>
                <td>{ramp.manually_verified_at ? 'Yes' : 'No'}</td>
                <td style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => setSelected(ramp)}>Edit</button>
                  <button onClick={() => verify(ramp.id)}>Verify</button>
                  <button onClick={() => refreshRamp(ramp.id)}>Refresh</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 12 }}>
        <h2>Ramp edit</h2>
        {!selected ? <p>Select a ramp.</p> : (
          <>
            <p><strong>{selected.name}</strong></p>
            <label>Status</label>
            <input value={selected.status} onChange={(e) => setSelected({ ...selected, status: e.target.value })} />
            <label>Confidence</label>
            <input value={selected.confidence_score} onChange={(e) => setSelected({ ...selected, confidence_score: Number(e.target.value) })} />
            <button onClick={saveEdit}>Save</button>
          </>
        )}
      </div>
    </div>
  );
}
