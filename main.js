/**
 * Module dependencies.
 */

// for webpack
if (process.env.NODE_ENV === 'production') {
  require('./assets/Comismsh.ttf'); // eslint-disable-line
}

const debug = require('debug')('tmcube:server');
const http = require('http');

const { MongoClient } = require('mongodb');

// Connection URL
const mongoUrl = 'mongodb://localhost:27017';

// Database Name
const dbName = 'tmcu';

// Use connect method to connect to the server
MongoClient.connect(mongoUrl).catch((error) => {
  debug(`Connect to mongodb ${mongoUrl} was failed with error: ${error}`);
}).then((client) => {
  debug('Connected mongoDB correctly to server');

  const db = client.db(dbName);

  const app = require('./app')(db); // eslint-disable-line

  /**
   * Normalize a port into a number, string, or false.
   */

  function normalizePort(val) {
    const normalPort = parseInt(val, 10);

    if (Number.isNaN(normalPort)) {
      // named pipe
      return val;
    }

    if (normalPort >= 0) {
      // port number
      return normalPort;
    }

    return false;
  }

  /**
   * Get port from environment and store in Express.
   */

  const port = normalizePort(process.env.PORT || '4000');
  app.set('port', port);

  /**
   * Create HTTP server.
   */

  const server = http.createServer(app);

  /**
   * Event listener for HTTP server "error" event.
   */

  function onError(error) {
    if (error.syscall !== 'listen') {
      throw error;
    }

    const bind = typeof port === 'string'
      ? `Pipe ${port}`
      : `Port ${port}`;

    // handle specific listen errors with friendly messages
    switch (error.code) {
    case 'EACCES':
      debug(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      debug(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
    }
  }

  /**
   * Event listener for HTTP server "listening" event.
   */

  function onListening() {
    const addr = server.address();
    const bind = typeof addr === 'string'
      ? `pipe ${addr}`
      : `port ${addr.port}`;
    debug(`Listening on ${bind}`);
  }

  /**
   * Listen on provided port, on all network interfaces.
   */

  server.listen(port);
  server.on('error', onError);
  server.on('listening', onListening);
});
