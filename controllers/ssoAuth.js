// User Authentication Controller
const jwt = require('jsonwebtoken');
const passport = require('passport');
const crypto = require('crypto');
const { Store } = require('express-session');

// Just a Hello Route
function helloLogin (req, res) { 
    console.log(req);
    res.json({msg: "hello bhai!"}) 
}

function generateUUID() {
    const uuid = crypto.randomUUID();
    console.log(`UUID Generated: ${uuid}`);
    return uuid;
}


var ApplicationAccessData = {};

function storeApplicationInCache(origin, appSSOLOGINUUID) {
    ApplicationAccessData[appSSOLOGINUUID] = origin;
}


function giveUserGUIDForFurtherLogin(req, res, next){
    const redirectUrl = req.body.next;
    // const {next} = req.query;

    const url = new URL(redirectUrl);
    const userSSOLoginTempUUID = generateUUID();
    storeApplicationInCache(url.origin, userSSOLoginTempUUID);
    console.log("AppAccessData: ", ApplicationAccessData);
    return res.redirect(`${redirectUrl}?userSSOLoginTempUUID=${userSSOLoginTempUUID}`);
}


// Handling User Login
async function handleUserSSOLogin (req, res, next) {
    const redirectUrl = req.body.next 
    // console.log(req.body)

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
                        // return res.json({token});
                        return res.redirect(`${redirectUrl}?token=${token}`);
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


module.exports = {handleUserSSOLogin, helloLogin, handleUserLogOut, giveUserGUIDForFurtherLogin}