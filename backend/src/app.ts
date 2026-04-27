import express from 'express';

import { errorHandler } from './middleware/errorHandler';
import { createReportRouter } from './routes/reportRoutes';
import { getStores } from './stores/factory';

export const createApp = (): express.Express => {
  const app = express();

  app.use(express.json({ limit: '6mb' }));

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  const stores = getStores();
  app.use('/api/report', createReportRouter(stores));
  app.use(errorHandler);

  return app;
};
