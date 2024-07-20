const express = require('express');
const passport = require('passport');
const router = express.Router();
const { handleUserSSOLogin, helloLogin, handleUserLogOut, giveUserGUIDForFurtherLogin } = require('../controllers/ssoAuth');

router.get('/', (req, res)=>{
    const callback_URL = req.query.next;
    console.log(callback_URL)
    // res.json({msg: "This is SSO auth route!"});
    res.render('ssoAuth', {queryParams: req.query.next})
});
// router.post('/login', handleUserSSOLogin);
router.post('/login', giveUserGUIDForFurtherLogin);
// router.post('/logout', handleUserLogOut);
// router.get('/google/login', passport.authenticate('google', { scope: ['email', 'profile']}))
// router.get('/google/callback', passport.authenticate('google',{successRedirect: '/Blogs',failureRedirect: '/'}));

// router.get('/sso', function(req, res){
//     const callback_URL = req.query.next;
//     console.log("Callback_URL: ", callback_URL)

//     res.json("Ye lo guid token aur wapis jafa ho jao jaha se aaye the.");

// })

module.exports = router;