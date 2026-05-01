import { useEffect, useState } from 'react';

import { apiRequest } from '../api/client';

export function ReportsPage({ token }: { token: string }) {
  const [reports, setReports] = useState<any[]>([]);

  const load = () => apiRequest<any[]>('/admin/reports', {}, token).then(setReports);

  useEffect(() => {
    load();
  }, [token]);

  const update = async (id: string, status: string) => {
    await apiRequest(`/admin/reports/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }, token);
    load();
  };

  return (
    <div>
      <h1>Reports</h1>
      <table width="100%" cellPadding={8}>
        <thead>
          <tr style={{ textAlign: 'left' }}>
            <th>Type</th>
            <th>Status</th>
            <th>Message</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => (
            <tr key={report.id}>
              <td>{report.report_type}</td>
              <td>{report.status}</td>
              <td>{report.message}</td>
              <td>
                <button onClick={() => update(report.id, 'reviewed')}>Reviewed</button>
                <button onClick={() => update(report.id, 'resolved')}>Resolved</button>
                <button onClick={() => update(report.id, 'rejected')}>Rejected</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
