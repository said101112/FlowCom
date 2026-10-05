import http from 'node:http';

import { createApp } from './app.js';
import { connectDatabase, disconnectDatabase } from './config/db.js';
import { env } from './config/env.js';
import { attachGateway } from './realtime/gateway.js';
import { logger } from './utils/logger.js';

const port = Number(env.PORT);

async function bootstrap() {
  await connectDatabase();

  const httpServer = http.createServer(createApp());
  attachGateway(httpServer);

  httpServer.listen(port, () => {
    logger.info(`Backend FlowCom à l'écoute sur le port ${port} [${env.NODE_ENV}]`);
  });

  shutdown(httpServer);
}

function shutdown(httpServer) {
  const stop = (signal) => {
    logger.info(`${signal} reçu, arrêt en cours...`);
    httpServer.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGTERM', () => stop('SIGTERM'));
  process.on('SIGINT', () => stop('SIGINT'));
}

process.on('unhandledRejection', (reason) => {
  logger.error('Promesse rejetée sans gestion', reason);
});

bootstrap().catch((error) => {
  logger.error('Démarrage impossible', error);
  process.exit(1);
});