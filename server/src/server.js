const http = require('http');

const env = require('./config/env');
const { connectDB } = require('./config/db');
const app = require('./app');
const { initSockets } = require('./sockets');

async function main() {
  await connectDB();

  // Create the HTTP server explicitly so Socket.IO can attach
  // to the same server as the REST API.
  const httpServer = http.createServer(app);

  // Initialize Socket.IO on the same HTTP server.
  const io = initSockets(httpServer);

  // Make Socket.IO available to REST controllers through:
  // req.app.get('io')
  //
  // This keeps app.js independent from the sockets module
  // and avoids circular dependencies.
  app.set('io', io);

  // Start the HTTP + Socket.IO server.
  httpServer.listen(env.port, () => {
    console.log(
      `[server] listening on port ${env.port} (${env.nodeEnv})`
    );
  });

  // Graceful shutdown.
  const shutdown = (signal) => {
    console.log(`[server] received ${signal}, shutting down`);

    // Stop accepting Socket.IO connections.
    io.close();

    // Close the HTTP server.
    httpServer.close(() => {
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  console.error('[server] failed to start:', err);
  process.exit(1);
});