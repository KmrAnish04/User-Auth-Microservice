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
    googleAuthCallback,
    updateAuthTokens,
    registerUserSessionIDFromApp
} = require('../controllers/auth.controller.js');




// User Register/Signup Route
router.route('/signup').get(letSignUpUser).post(doSignUpUser);


// User Login Route
router.route('/login').get(letUserLogin).post(doUserLogin);


// Verify SSO Token Route
router.get('/verifySSOToken', verifySSOToken);


// Register LoggedIn User App Session in SSO redis Session Store
router.post('/register-sessionid', registerUserSessionIDFromApp);


// User Logout Route
router.get('/logout', doUserLogOut);


// Google Auth Routes
router.get('/google/login', doGoogleUserLogin);
router.get('/google/callback', googleAuthCallback);


router.post('/update-auth-tokens', updateAuthTokens)



// Export Router
module.exports = router;