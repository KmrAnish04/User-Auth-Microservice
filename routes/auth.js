const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const passport = require('passport');

router.get('', (req, res)=>{
    res.send('Hello Login!');
})


/* POST Login. */
router.post('/login', (req, res, next)=>{
    passport.authenticate('local', {session: false}, (err, user, info)=>{
        if(err || !user){
            return res.status(400).json({
                message: info ? info.message : 'Login failed', 
                user: user
            });
        }

        req.login(user, {session: false}, (err)=>{
            if(err){res.send(err)};
            const token = jwt.sign(user, 'anish_json-web-token');
            return res.json({user, token});
        });
    }) 
    (req, res); 
});



module.exports = router;