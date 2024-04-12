const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const passport = require('passport');
const { exists } = require('../models/model');

router.get('', (req, res)=>{
    res.send('Hello Login!');
})


router.post('/login', async (req, res, next) => {
    passport.authenticate(
        'login',
        async (err, user, info) => {
            try {
                if(err){
                    const error = new Error('An error occured.');
                    return next(error);
                }
                else if(!user){
                    const error = new Error(`Email or Password doesn't Matched! Login Failed! ❌`);
                    return next(error);
                }

                req.login(
                    user,
                    {session: false},
                    async (error) => {
                        if(error) return next(error);
                        const  body = { _id: user._id, email: user.email };
                        const token = jwt.sign({ user: body }, 'anish_json-web-token');
                        return res.json({token});
                    }
                );
            }
            catch (error) {
                return next(error);
            }
        }
    )
    (req, res, next);
})


module.exports = router;