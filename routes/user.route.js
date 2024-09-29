const express = require('express');
const { getUserProfile, getAllUsers } = require('../controllers/user.controller');
const router = express.Router();

/* GET users listing. */
router.get('/', getAllUsers);

/* GET user profile. */
router.get('/profile', getUserProfile);

module.exports = router;