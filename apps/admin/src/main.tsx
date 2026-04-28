import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { Layout } from './components/Layout';
import { JobsPage } from './pages/JobsPage';
import { LoginPage } from './pages/LoginPage';
import { OverviewPage } from './pages/OverviewPage';
import { RampsPage } from './pages/RampsPage';
import { ReportsPage } from './pages/ReportsPage';
import { StationsPage } from './pages/StationsPage';

import './styles.css';

function App() {
  const [token, setToken] = useState<string | null>(null);

  if (!token) {
    return <LoginPage onAuth={setToken} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<OverviewPage token={token} />} />
          <Route path="ramps" element={<RampsPage token={token} />} />
          <Route path="reports" element={<ReportsPage token={token} />} />
          <Route path="jobs" element={<JobsPage token={token} />} />
          <Route path="stations" element={<StationsPage token={token} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
