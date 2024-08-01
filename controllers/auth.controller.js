// User Authentication Controller
const passport = require('passport');
const ApiError = require("../src/utils/ApiError.js");
const ApiResponse = require("../src/utils/ApiResponse.js");
const AsyncHandler = require("../src/utils/AsyncHandler.js");
const {encodedId} = require("../src/utils/utility.js");
const {
    generateJwtToken,
    generateAccessToken,
    generateRefreshToken
} = require("../src/JWT_Helper.js");
const URL = require("url").URL;
const {
    ALLOWED_APPS_ORIGINS, 
    APPS_SESSIONS, 
    USER_SESSIONS, 
    SSO_TOKEN_CACHE,
} = require("../src/appConfigs/AllowedAppsConfig.js");
const {
    fetchAppTokenFromRequest, 
    storeAppInCache, 
    generatePayload
} = require('./utils.controller/utils.controller.js')
const querystring = require('querystring');





////////////////////////////////////////////////////////////////////////////
//                          User Login Handler >> Get
////////////////////////////////////////////////////////////////////////////
const letUserLogin = AsyncHandler(async (req, res) => {
    const { redirectURL } = req.query;

    if (redirectURL != null) {
        const url = new URL(redirectURL);
        if (!ALLOWED_APPS_ORIGINS[url.origin]) {
            throw new ApiError(401, "You are not allowed to access the sso-server ❌");
        }
    }

    if (req.session.user != null && redirectURL == null) {
        return res.redirect("/")
    }

    // If global session already has user then directly redirect with token
    if(req.session.user != null && redirectURL != null){
        const url = new URL(redirectURL);
        console.log("encodedID: ", encodedId);

        const ssoToken = encodedId(); // Short Lived Token
        storeAppInCache(url.origin, req.session.user, ssoToken);
        return res.redirect(`${redirectURL}?ssoToken=${ssoToken}`);
    }

    return res.render("loginUser", {
        title: "SSO-Server | Login",
        redirectURL // For Google Auth Button
    });
});



////////////////////////////////////////////////////////////////////////////
//                          User Login Handler >> Post
////////////////////////////////////////////////////////////////////////////
const doUserLogin = AsyncHandler(async (req, res, next) => {
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
                // req.session.user = user._id;
                req.session.user = user._id.toString();
                USER_SESSIONS[req.session.user] = {email: user.email};

                if(redirectURL == null){ return res.redirect("/"); }

                const url = new URL(redirectURL);
                console.log("encodedID: ", encodedId);
                const ssoToken = encodedId(); // Short Lived Token
                storeAppInCache(url.origin, req.session.user, ssoToken);

                console.log("Here after success!", info);
                console.log('user :>> ', user);
                console.log('req.session :>> ', req.session);

                return res.redirect(`${redirectURL}?ssoToken=${ssoToken}`);    
            } 
            catch (error) { return next(error); }
        }
    )
    (req, res, next);
})



////////////////////////////////////////////////////////////////////////////
//                          User Logout Handler >> Get
////////////////////////////////////////////////////////////////////////////
function doUserLogOut(req, res, next) {
    req.logout(function (err) {
        if (err) {
            return next(err)
        };
        console.log("User is Logging Out!")
        res.redirect('/');
    })
}



////////////////////////////////////////////////////////////////////////////
//                    Verify SSO Token Given By Use >> Get
////////////////////////////////////////////////////////////////////////////
const verifySSOToken = AsyncHandler(async (req, res, next) => {
    const appToken = fetchAppTokenFromRequest(req);
    const {ssoToken} = req.query;
    
    if(appToken == null || ssoToken == null || SSO_TOKEN_CACHE[ssoToken] == null){
        console.log("here2");
        throw new ApiError(400, "Bad Request! ❌");
    }

    const appName = SSO_TOKEN_CACHE[ssoToken][1];
    const globalSessionToken = SSO_TOKEN_CACHE[ssoToken][0];

    if(
        appToken !== process.env[appName] ||
        APPS_SESSIONS[globalSessionToken][appName] !== true
    ){ throw new ApiError(403, "Unauthorized Access ❌"); }


    try {
        const payload = await generatePayload(ssoToken);

        // Classic JWT Token
        // const token = await generateJwtToken(payload);
        // console.log("token: ", token);
        
        const accessToken = await generateAccessToken(payload);
        const refreshToken = await generateRefreshToken({userId: payload.userId});
        
        const userId = SSO_TOKEN_CACHE[ssoToken][0];
        USER_SESSIONS[userId]["accessToken"] = accessToken;
        USER_SESSIONS[userId]["refreshToken"] = refreshToken;

        console.log('USER_SESSIONS :>> ', USER_SESSIONS);
        console.log('payload :>> ', payload);
        
        delete SSO_TOKEN_CACHE[ssoToken]; // As we are proving it to user, no the token is of no use and deleteing it to avoid mis-use

        return res
        .status(200)
        .json(new ApiResponse(200, {accessToken, refreshToken}, "LoggedIn Successfully! ✅"));
        
    } catch (error) {
        console.log('error VerifySSOToken() :>> ', error);
        throw new ApiError(502, "Internal Server Error! ❌"); 
    }

});



////////////////////////////////////////////////////////////////////////////
//                    Let User SignUp >> Get     // Not used anywhere till now
////////////////////////////////////////////////////////////////////////////
const letSignUpUser = AsyncHandler(async (req, res, next) => {
    return res
    .status(200)
    .json(new ApiResponse(200, {}, "this is SignUp Page!"))
});



////////////////////////////////////////////////////////////////////////////
//                    Let User SignUp >> Post
////////////////////////////////////////////////////////////////////////////
const doSignUpUser = AsyncHandler( async (req, res, next) => {
    passport.authenticate(
        'signup', 
        {session: false}, 
        (err, user, info) => {
            try {
                if (err) {
                    console.log('Error during signup:', err.message || 'Error during signup');
                    return next(new ApiError(405, err.message || 'Error during signup'));
                }
    
                if (!user) {
                    console.log("Not able to get user, inside if(!user){} condition!!");
                    return next(new ApiError(500, info ? info.message : 'Signup failed, Internal Server Error!'));
                }
                
                // show a flash message to user and let him know that signup is successfull
                // and redirect him to /login page, to ask him to login with new singup credentials.
                // also take care of how you will manage redirectURL incase of signup process.
                return res
                .status(200)
                .json(new ApiResponse(200, {}, "SignUp Successfull!!! 🎉🎊✅"))
                
            } 
            catch (error) { return next(error); }
        }
    )(req, res, next);

});



////////////////////////////////////////////////////////////////////////////
//                      User Login GOOGLE Strategy
////////////////////////////////////////////////////////////////////////////
const doGoogleUserLogin = AsyncHandler(async(req, res, next) => {
    console.log("Inside doGoogleUserLogin()");
    console.log("In doGoogleUserLogin() :>> req: ", req.query);

    // Prepare the state parameter including the redirectURL
    const state = querystring.stringify({ redirectURL: req.query.redirectURL });

    passport.authenticate('google', {
        scope: ['email', 'profile'],
        state: state
    })(req, res, next);
});



////////////////////////////////////////////////////////////////////////////
//                      Google Auth Callback
////////////////////////////////////////////////////////////////////////////
const googleAuthCallback = AsyncHandler(async (req, res, next) => {
    // Call passport.authenticate and pass in the parameters
    passport.authenticate('google', 
        async (err, user, info) => {
            if (err) {
                console.log("In google callback err", err); 
                return next(err); 
            }
            if (!user) { return res.redirect('/'); }
            
            console.log("Inside googleAuthCallback()");
            const state = querystring.parse(req.query.state);
            const redirectURL = state.redirectURL;


            console.log("redirectURL: ", redirectURL);
            console.log('user :>> ', user);
            console.log('info :>> ', info);
            console.log('req.user :>> ', req.user);
            console.log('req.session :>> ', req.session);


            req.session.user = info.user._id.toString();
            USER_SESSIONS[req.session.user] = {email: info.user.email};

            if(redirectURL == null) {return res.redirect("/")}

            const url = new URL(redirectURL);
            const ssoToken = encodedId();
            storeAppInCache(url.origin, req.session.user, ssoToken);

            return res.redirect(`${redirectURL}?ssoToken=${ssoToken}`);
        }
    )(req, res, next);  // Note that we're invoking the middleware here
})




////////////////////////////////////////////////////////////////
//                    Functions Export
////////////////////////////////////////////////////////////////
module.exports = {
    letUserLogin,
    doUserLogin,
    doUserLogOut,
    verifySSOToken,
    letSignUpUser,
    doSignUpUser,
    doGoogleUserLogin,
    googleAuthCallback
}