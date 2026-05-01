import { Link, Outlet } from 'react-router-dom';

export function Layout() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      <aside style={{ borderRight: '1px solid #e2e8f0', padding: 16 }}>
        <h2>RampReady Admin</h2>
        <nav style={{ display: 'grid', gap: 8 }}>
          <Link to="/">Overview</Link>
          <Link to="/ramps">Ramps</Link>
          <Link to="/reports">Reports</Link>
          <Link to="/jobs">Jobs</Link>
          <Link to="/stations">Stations</Link>
        </nav>
      </aside>
      <main style={{ padding: 20 }}>
        <Outlet />
      </main>
    </div>
  );
}
