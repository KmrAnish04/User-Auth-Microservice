const express = require('express');
const router = express.Router();
const { handleUserLogin, helloLogin, handleUserLogOut } = require('../controllers/auth');

router.get('/', helloLogin)
router.post('/login', handleUserLogin);
router.post('/logout', handleUserLogOut)


module.exports = router;