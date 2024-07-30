const express = require('express');
const router = express.Router();
const { 
    letUserLogin, 
    doUserLogin, 
    doUserLogOut, 
    verifySSOToken,
    letSignUpUser,
    doSignUpUser,
    doGoogleUserLogin,
    googleAuthCallback
} = require('../controllers/auth.controller.js');




// User Register/Signup Route
router.route('/signup')
    .get(letSignUpUser)
    .post(doSignUpUser);


// User Login Route
router.route('/login')
    .get(letUserLogin)
    .post(doUserLogin);


// Verify SSO Token Route
router.get('/verifySSOToken', verifySSOToken);


// User Logout Route
router.post('/logout', doUserLogOut);


// Google Auth Routes
router.get('/google/login', doGoogleUserLogin);
router.get('/google/callback', googleAuthCallback);



// Export Router
module.exports = router;