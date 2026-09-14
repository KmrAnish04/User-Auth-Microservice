const connectToMongoDB = require('./src/db/connectMongoDB.js');
const SSOAuthServerConfig = require('./src/config.js');
const app = require('./app.js');
const logger = require('./src/utils/logger.js');
const validateEnv = require('./src/utils/validateEnv.js');

const PORT = SSOAuthServerConfig.app.port;

let server;

async function startServer() {
    try {
        validateEnv();

        // Connect to MongoDB first
        await connectToMongoDB(SSOAuthServerConfig.mongoDB.path);

        // Setup application
        await app.setupApp();

        // Start HTTP server
        server = app.listen(PORT, () => {
            logger.info(`Server started on port ${PORT}: http://localhost:${PORT}/`);
        });

    } catch (err) {
        logger.error('Application failed to start', {
            error: err.message,
            stack: err.stack
        });

        process.exit(1);
    }
}

// Graceful shutdown handler
function gracefulShutdown(signal) {
    logger.info(`${signal} received: closing HTTP server gracefully`);
    
    if (!server) {
        logger.warn('Server not running, exiting');
        process.exit(0);
    }
    
    server.close(() => {
        logger.info('HTTP server closed');
        
        // TODO: Close MongoDB connection gracefully
        // TODO: Close Redis connection gracefully
        
        logger.info('Graceful shutdown complete');
        process.exit(0);
    });
    
    // Force shutdown after 30 seconds if connections don't close
    setTimeout(() => {
        logger.error('Forcing shutdown after timeout');
        process.exit(1);
    }, 30000);
}

// Process signal handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
    process.exit(1);
});

process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Rejection', { reason });
    process.exit(1);
});

startServer();
