const express = require('express');
const router = express.Router();
const { handleUserLogin, helloLogin } = require('../controllers/auth');

router.get('/', helloLogin)
router.post('/login', handleUserLogin);


module.exports = router;