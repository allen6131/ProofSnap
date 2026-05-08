import serverless from 'serverless-http';

import { createApp } from './app';

let cachedHandler: ReturnType<typeof serverless> | null = null;

export const handler = async (
  event: Parameters<ReturnType<typeof serverless>>[0],
  context: Parameters<ReturnType<typeof serverless>>[1],
): Promise<unknown> => {
  if (!cachedHandler) {
    const app = await createApp();
    cachedHandler = serverless(app);
  }
  return cachedHandler(event, context);
};
