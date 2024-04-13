// User Authentication Controller
const jwt = require('jsonwebtoken');
const passport = require('passport');


// Just a Hello Route
function helloLogin (req, res) { res.send('Hello Login!') }

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


module.exports = {handleUserLogin, helloLogin}