import { useEffect, useState } from 'react';

import { apiRequest } from '../api/client';
import { Station } from '../types';

export function StationsPage({ token }: { token: string }) {
  const [stations, setStations] = useState<Station[]>([]);

  useEffect(() => {
    apiRequest<Station[]>('/admin/stations', {}, token).then(setStations);
  }, [token]);

  return (
    <div>
      <h1>Stations</h1>
      <table width="100%" cellPadding={8}>
        <thead>
          <tr style={{ textAlign: 'left' }}>
            <th>Name</th>
            <th>Provider</th>
            <th>Type</th>
          </tr>
        </thead>
        <tbody>
          {stations.map((station) => (
            <tr key={station.id}>
              <td>{station.name}</td>
              <td>{station.provider}</td>
              <td>{station.station_type}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
