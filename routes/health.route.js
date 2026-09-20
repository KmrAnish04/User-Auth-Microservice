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

        // await new Promise(resolve => setTimeout(resolve, 20000));
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

// Test endpoint for load testing - simulates slow operation (PUBLIC, NO AUTH)
router.get('/slow-test', async (req, res) => {
    // Simulate slow database query or processing
    const delay = parseInt(req.query.delay) || 2000; // Default 2 seconds
    
    await new Promise(resolve => setTimeout(resolve, delay));
    
    res.json({
        success: true,
        message: 'Slow test endpoint - helps visualize active connections in Grafana',
        delay: delay,
        timestamp: new Date().toISOString()
    });
});

// Test endpoint for 5xx error testing (PUBLIC, NO AUTH)
router.get('/error-test', async (req, res) => {
    const logger = require('../src/utils/logger');
    
    try {
        // Log an error message
        logger.error('Test error triggered via /health/error-test endpoint', {
            timestamp: new Date().toISOString(),
            test: true
        });
        
        // Explicitly send 500 response
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'This is a test 500 error for monitoring dashboard testing',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
