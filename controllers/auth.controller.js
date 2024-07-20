// User Authentication Controller
const jwt = require('jsonwebtoken');
const passport = require('passport');
const allowOrigin = require("../src/appConfigs/AllowedOrigins.json");
const ApiError = require("../src/utils/ApiError.js");
const AsyncHandler = require("../src/utils/AsyncHandler.js");
const {encodedId} = require("../src/utils/utilitiy.js");
const { CLIENT_RENEG_WINDOW } = require('tls');
const { emit } = require('process');
const URL = require("url").URL;



////////////////////////////////////////////////////////////////////////////
//                          User Login Handler >> Get
////////////////////////////////////////////////////////////////////////////
const giveLoginAccess = AsyncHandler(async (req, res) => {
    const { redirectURL } = req.query;

    if (redirectURL != null) {
        if (!allowOrigin[redirectURL]) {
            throw new ApiError(401, "You are not allowed to access the sso-server ❌");
        }
    }

    if (req.session.user != null && redirectURL == null) {
        return res.redirect("/")
    }

    // If global session already has user then directly redirect with token
    // if(req.session.user != null && redirectURL != null){
    //     const url = new URL(redirectURL);
    //     const shortLivedToken = encodeId();
    //     storeAppInCache();
    //     return res.redirect("");
    // }

    return res.render("loginUser", {
        title: "SSO-Server | Login"
    });
});



////////////////////////////////////////////////////////////////////////////
//                          User Login Handler >> Post
////////////////////////////////////////////////////////////////////////////
const handleUserLogin = AsyncHandler(async (req, res, next) => {
    console.log("here")
    passport.authenticate('login',
        async (err, user, info) => {
            try {
                if (err) { return next(err); } 
                else if (!user) {
                    const err = new ApiError(401, "401 Unauthorized | Email or Password doesn't Matched! Login Failed! ❌")
                    return next(err);
                }

                const { redirectURL } = req.query;
                req.session.user = user._id;
                // req.user = user._id;
                // sessionUser[id] = user.email;

                if(redirectURL == null){ return res.redirect("/"); }

                const url = new URL(redirectURL);
                const ssoToken = encodedId(); // Short Lived Token
                // storeApplicationInCache();

                console.log("Here after success!", info);
                console.log('user :>> ', user);
                console.log('req.session :>> ', req.session);


                return res.redirect(`${redirectURL}?ssoToken=${ssoToken}`);    
            } 
            catch (error) { return next(error);}
        }
    )
    (req, res, next);
})

// Handling User LogOut
function handleUserLogOut(req, res, next) {
    req.logout(function (err) {
        if (err) {
            return next(err)
        };
        console.log("User is Logging Out!")
        res.redirect('/');
    })
}


module.exports = {
    giveLoginAccess,
    handleUserLogin,
    handleUserLogOut
}