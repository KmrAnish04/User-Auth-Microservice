const express = require('express');
const router = express.Router();

// Health check endpoint - no authentication required
router.get('/', async (req, res) => {
    try {
        const healthcheck = {
            status: 'healthy',
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            version: '1.0.0',
            services: {
                server: 'running'
            }
        };

        // TODO: Add MongoDB health check (will do after we add proper connection status tracking)
        // TODO: Add Redis health check (will do after we add proper connection status tracking)

        res.status(200).json(healthcheck);
    } catch (error) {
        const healthcheck = {
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: error.message
        };
        res.status(503).json(healthcheck);
    }
});

module.exports = router;
