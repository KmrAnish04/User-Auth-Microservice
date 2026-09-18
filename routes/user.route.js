const express = require('express');
const { getUserProfile, getAllUsers } = require('../controllers/user.controller');
const router = express.Router();

/* GET users listing. */
router.get('/', getAllUsers);

/* GET user profile. */
router.get('/profile', getUserProfile);

module.exports = router;

/* Test endpoint for load testing - simulates slow operation */
router.get('/slow-test', async (req, res) => {
  // Simulate slow database query or processing
  const delay = parseInt(req.query.delay) || 2000; // Default 2 seconds
  
  await new Promise(resolve => setTimeout(resolve, delay));
  
  res.json({
    success: true,
    message: 'Slow test endpoint',
    delay: delay,
    timestamp: new Date().toISOString()
  });
});
