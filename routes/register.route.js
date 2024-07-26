/* Register User */
const express = require('express');
const router = express.Router();
const passport = require('passport');
const {handleUserSignIn} = require('../controllers/register.controller.js');
const ApiError = require("../src/utils/ApiError.js");

router.post('/signup', (req, res, next) => {
    passport.authenticate(
        'signup', 
        {session: false}, 
        (err, user, info) => {
            if (err) {
                console.log('Error during signup:', err.message || 'Error during signup');
                return next(new ApiError(405, err.message || 'Error during signup'));
            }

            if (!user) {
                return res
                .status(500)
                .json(new ApiError(500, info ? info.message : 'Signup failed, Internal Server Error!'));
            }

            next(); 
        })(req, res, next);

}, handleUserSignIn);



module.exports = router;