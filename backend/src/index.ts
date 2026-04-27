import { env } from './config/env';
import { createApp } from './app';

const start = async (): Promise<void> => {
  const app = await createApp();

  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`ProofSnap backend listening on port ${env.port}`);
  });
};

void start();
