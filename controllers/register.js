// User Register Controllers
const passport = require('passport');

function helloSignIn (req, res) { res.send(passport) }

async function handleUserSignIn(req, res, next) {
    console.log("Creating New User!")
    res.json({
        message: 'SingUp Successfull!',
        user: req.user
    });
}

module.exports = {handleUserSignIn, helloSignIn}