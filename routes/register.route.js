/* Register User */
const express = require('express');
const router = express.Router();
const passport = require('passport');
const {handleUserSignIn, helloSignIn} = require('../controllers/register');

router.get('', helloSignIn);
router.post('/signup', passport.authenticate('signup', {session: false}), handleUserSignIn);


module.exports = router;