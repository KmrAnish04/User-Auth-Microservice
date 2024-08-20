// User Authentication Controller
const passport = require('passport');
const ApiError = require("../src/utils/ApiError.js");
const ApiResponse = require("../src/utils/ApiResponse.js");
const AsyncHandler = require("../src/utils/AsyncHandler.js");
const {encodedId} = require("../src/utils/utility.js");
const {UserModel} = require("../models/user.model.js");
const {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken
} = require("../src/JWT_Helper.js");
const URL = require("url").URL;

const {
    fetchAppTokenFromRequest, 
    storeAppInCache, 
    generatePayload
} = require('./utils.controller/utils.controller.js')
const querystring = require('querystring');

const {getDataFromRedis, setDataInRedis, deleteDataFromRedis} = require('./utils.controller/utils.controller.js');


////////////////////////////////////////////////////////////////////////////
//                          User Login Handler >> Get
////////////////////////////////////////////////////////////////////////////
const letUserLogin = AsyncHandler(async (req, res) => {
    console.log("\n********************************");
    console.log("Inside letUserLogin() :>> ");


    const { redirectURL } = req.query;

    if (redirectURL != null) {
        const url = new URL(redirectURL);
        const isAppAllowed = await getDataFromRedis(
            'ALLOWED_APPS_ORIGINS',
            url.origin
        );
        console.log('isAppAllowed :>> ', url.origin, isAppAllowed, typeof isAppAllowed);

        if (!isAppAllowed) {
            throw new ApiError(401, "You are not allowed to access the sso-server ❌");
        }
    }

    
    console.log("req.session.user :>>" , req.session.user);
    console.log("req.user :>>" , req.user);
    console.log('redirectURL :>> ', redirectURL);
    console.log("******************************** \n");

    if (req.session.user != null && redirectURL == null) {
        return res.redirect("/")
    }

    // If global session already has user then directly redirect with token
    if(req.session.user != null && redirectURL != null){
        console.log("\n ********************************");
        console.log("sub-Inside cond. :>> if(req.session.user != null && redirectURL != null) ");
        console.log("req.session.user :>>" , req.session.user);
        console.log('redirectURL :>> ', redirectURL);
        console.log("******************************** \n");
        
        const url = new URL(redirectURL);
        const ssoToken = encodedId(); // Short Lived Token
        await storeAppInCache(url.origin, req.session.user, ssoToken);
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
    console.log("\n\n ********************************************")
    console.log("Inside doUserLogin() :>> ")

    passport.authenticate('login',
        async (err, user, info) => {
            try {
                if (err) { return next(err); } 
                else if (!user) {
                    const err = new ApiError(401, "401 Unauthorized | Email or Password doesn't Matched! Login Failed! ❌")
                    return next(err);
                }

                const { redirectURL } = req.query;
                const userId = user._id.toString();
                req.session.user = userId

                const StoreResult = await setDataInRedis(
                    'USER_SESSIONS',
                    userId,
                    {"email": user.email}
                );
                console.log("StoreResult: ", StoreResult) 

                if(redirectURL == null){ return res.redirect("/"); }

                const url = new URL(redirectURL);
                const ssoToken = encodedId(); // Short Lived Token
                await storeAppInCache(url.origin, req.session.user, ssoToken);

                console.log("******************************************** \n\n")
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
    // console.log("\n\n********************************************")
    // console.log("Inside verifySSOToken() :>> ")

    const appToken = fetchAppTokenFromRequest(req);
    const {ssoToken} = req.query;

    const ssoTokenCacheFromRedis = await getDataFromRedis('SSO_TOKEN_CACHE', ssoToken);
    
    if(!appToken || !ssoToken || !ssoTokenCacheFromRedis){
        console.log("In 400, Bad Request! ❌");
        throw new ApiError(400, "Bad Request! ❌");
    }

    const appName = ssoTokenCacheFromRedis[1]; // aap name
    const globalSessionToken = ssoTokenCacheFromRedis[0]; // userId

    const appSessionFromRedis = await getDataFromRedis(
        'APPS_SESSIONS',
        globalSessionToken
    );

    if(
        appToken !== process.env[appName] ||
        appSessionFromRedis[appName] !== true
    ){ throw new ApiError(403, "Unauthorized Access ❌"); }


    try {
        const payload = await generatePayload(ssoToken);
        // console.log('payload :>> ', payload);
        
        const accessToken = await generateAccessToken(payload);
        const refreshToken = await generateRefreshToken({userId: payload.userId});

        const UserSessionDataFromRedis = await getDataFromRedis('USER_SESSIONS', payload.userId);
        
        UserSessionDataFromRedis["accessToken"] = accessToken;
        UserSessionDataFromRedis["refreshToken"] = refreshToken;

        const setUserSessionDataInRedisResult = await setDataInRedis(
            'USER_SESSIONS',
            payload.userId,
            UserSessionDataFromRedis
        );

        // or you can set feild expiry in redis
        deleteDataFromRedis('SSO_TOKEN_CACHE', ssoToken); // As we are proving it to user, no the token is of no use and deleteing it to avoid mis-use

        return res
        .status(200)
        .json(new ApiResponse(200, {accessToken, refreshToken}, "LoggedIn Successfully! ✅"));
        
    } catch (error) {
        console.log('error VerifySSOToken() :>> ', error);
        throw new ApiError(502, "Internal Server Error! ❌"); 
    }

});



////////////////////////////////////////////////////////////////////////////
//                          Update Access Token
////////////////////////////////////////////////////////////////////////////
const updateAuthTokens = AsyncHandler(async (req, res, next) => {
    // console.log("\n\n********************************************")
    // console.log("Inside updateAuthTokens()")

    const userRefreshToken = req.body.refreshToken;
    // console.log('userRefreshToken :>> ', userRefreshToken);

    if(!userRefreshToken){ throw new ApiError(401, "Unauthorized Request!!!")}
    let decodedToken = null;

    try {
        decodedToken = await verifyRefreshToken(userRefreshToken, process.env.REFRESH_TOKEN_SECRET); 
    } 
    catch (error) {
        console.log('error while verify refreshToken :>> ', error);
        throw new ApiError(401, error.message?error.message:"Token Verification Faild!")
    }

    const userInLocalDB = await getDataFromRedis(
        'USER_SESSIONS',
        decodedToken.userId
    )

    const userEmail = userInLocalDB.email;
    const refreshTokenInDB = userInLocalDB.refreshToken
    
    if(userRefreshToken !== refreshTokenInDB){ throw new ApiError(401, "Refresh Token is expired or Not Valid!!!")}
    
    const user = await UserModel.findOne({email: userEmail});
    if(!user){ throw new ApiError(401, "Invalid Refresh Token!!!")}
    const payload = {userId: user._id.toString(), email: user.email};
        
    const newAccessToken = await generateAccessToken(payload);

    const UserSessionDataFromRedis = await getDataFromRedis(
        'USER_SESSIONS',
        decodedToken.userId
    );

    UserSessionDataFromRedis["accessToken"] = newAccessToken;

    const storeRedisRst = await setDataInRedis(
        'USER_SESSIONS',
        decodedToken.userId,
        UserSessionDataFromRedis
    );

    res.status(200)
    .cookie("accessToken", newAccessToken, {httpOnly: true, secure: true})
    .json(new ApiResponse(
        200, 
        { newAccessToken},
        "Access Token Updated Successfully!!!✅"
    ));

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
    console.log("\n\n*********************************************");
    console.log("Inside doGoogleUserLogin()");

    // console.log("In doGoogleUserLogin() :>> req: ", req.query);

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
    console.log("\n\n*********************************************");
    console.log("Inside googleAuthCallback()");

    // Call passport.authenticate and pass in the parameters
    passport.authenticate('google', 
        async (err, user, info) => {
            if (err) {
                console.log("In google callback err", err); 
                return next(err); 
            }
            if (!user) { return res.redirect('/'); }
            
            const state = querystring.parse(req.query.state);
            const redirectURL = state.redirectURL;

            const userId = info.user._id.toString();
            req.session.user = userId;
            
            const UserSessionDataFromRedis = await getDataFromRedis('USER_SESSIONS', userId);
            UserSessionDataFromRedis["email"] = info.user.email;
        
            const storeRedisRst = await setDataInRedis(
                'USER_SESSIONS',
                userId,
                UserSessionDataFromRedis
            );

            if(redirectURL == null) {return res.redirect("/")}

            const url = new URL(redirectURL);
            const ssoToken = encodedId();
            await storeAppInCache(url.origin, req.session.user, ssoToken);

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
    googleAuthCallback,
    updateAuthTokens
}