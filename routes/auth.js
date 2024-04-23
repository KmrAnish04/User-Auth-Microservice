const express = require('express');
const passport = require('passport');
const router = express.Router();
const { handleUserLogin, helloLogin, handleUserLogOut } = require('../controllers/auth');

router.get('/', helloLogin)
router.post('/login', handleUserLogin);
router.post('/logout', handleUserLogOut)
router.get('/google/login', passport.authenticate('google', {
    scope: ['email', 'profile']
}))
router.get('/goggle/callback', passport.authenticate('google',{
    successRedirect: '/',
    failureRedirect: '/api/auth/'
}))


module.exports = router;