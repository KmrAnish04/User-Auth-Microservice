// User Authentication Controller
const jwt = require('jsonwebtoken');
const passport = require('passport');


// Just a Hello Route
function helloLogin (req, res) { 
    console.log(req);
    res.json({msg: "hello bhai!"}) 
}

// Handling User Login
async function handleUserLogin (req, res, next) {
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
}


// Handling User LogOut
function handleUserLogOut (req, res, next) {
    req.logout(function (err) {
        if(err) {return next(err)};
        console.log("User is Logging Out!")
        res.redirect('/');
    })
}


module.exports = {handleUserLogin, helloLogin, handleUserLogOut}