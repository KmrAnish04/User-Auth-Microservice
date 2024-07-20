const express = require('express');
const passport = require('passport');
const router = express.Router();
const { handleUserLogin, giveLoginAccess, handleUserLogOut } = require('../controllers/auth.controller');

router.route('/login')
    .get(giveLoginAccess)
    .post(handleUserLogin);

router.post('/logout', handleUserLogOut);


router.get('/google/login', passport.authenticate('google', { scope: ['email', 'profile']}))
router.get('/google/callback', passport.authenticate('google',{successRedirect: '/Blogs',failureRedirect: '/'}));

// router.get('/sso', function(req, res){
//     const callback_URL = req.query.next;
//     console.log("Callback_URL: ", callback_URL)
//     res.json("Ye lo guid token aur wapis jafa ho jao jaha se aaye the.");
// })

module.exports = router;