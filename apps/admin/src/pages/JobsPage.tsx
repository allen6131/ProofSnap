import { useEffect, useState } from 'react';

import { apiRequest } from '../api/client';

export function JobsPage({ token }: { token: string }) {
  const [jobs, setJobs] = useState<any[]>([]);

  const load = () => apiRequest<any[]>('/admin/job-runs', {}, token).then(setJobs);

  useEffect(() => {
    load();
  }, [token]);

  const runImport = async () => {
    await apiRequest('/admin/import/fwc', { method: 'POST' }, token);
    load();
  };

  const runRecompute = async () => {
    await apiRequest('/admin/recompute-scores', { method: 'POST' }, token);
    load();
  };

  return (
    <div>
      <h1>Jobs</h1>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button onClick={runImport}>Run FWC import</button>
        <button onClick={runRecompute}>Recompute scores</button>
      </div>
      <table width="100%" cellPadding={8}>
        <thead>
          <tr style={{ textAlign: 'left' }}>
            <th>Job</th>
            <th>Status</th>
            <th>Started</th>
            <th>Error</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr key={job.id}>
              <td>{job.job_name}</td>
              <td>{job.status}</td>
              <td>{job.started_at}</td>
              <td>{job.error || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
