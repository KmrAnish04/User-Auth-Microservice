const express = require('express');
const passport = require('passport');
const router = express.Router();
const { 
    handleUserLogin, 
    giveLoginAccess, 
    handleUserLogOut, 
    verifySSOToken,
    letSignUpUser,
    doSignUpUser
} = require('../controllers/auth.controller');

router.route('/login')
    .get(giveLoginAccess)
    .post(handleUserLogin);


router.route('/signup')
    .get(letSignUpUser)
    .post(doSignUpUser)

    
router.get('/verifySSOToken', verifySSOToken)

router.post('/logout', handleUserLogOut);


router.get('/google/login', passport.authenticate('google', { scope: ['email', 'profile']}))
router.get('/google/callback', passport.authenticate('google',{successRedirect: '/Blogs',failureRedirect: '/'}));



module.exports = router;