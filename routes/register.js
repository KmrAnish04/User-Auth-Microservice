/* Register User */
const express = require('express');
const router = express.Router();
const passport = require('passport');


router.get('', (req, res)=>{
    res.send(passport);
})

router.post('/signup', passport.authenticate('signup', {session: false}),
    async (req, res, next) =>{
        console.log("Creating New User!")
        res.json({
            message: 'SingUp Successfull!',
            user: req.user
        });
    }
);



module.exports = router;