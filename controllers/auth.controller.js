// User Authentication Controller
const jwt = require('jsonwebtoken');
const passport = require('passport');
const ApiError = require("../src/utils/ApiError.js");
const ApiResponse = require("../src/utils/ApiResponse.js");
const AsyncHandler = require("../src/utils/AsyncHandler.js");
const {encodedId} = require("../src/utils/utilitiy.js");
const URL = require("url").URL;
const {
    ALLOWED_APPS_ORIGINS, 
    ALLOWED_APPS_NAMES, 
    APPS_SESSIONS, 
    USER_SESSIONS, 
    SSO_TOKEN_CACHE,
    AUTH_HEADER,
    BEARER_AUTH_SCHEME,
    HEADER_REG_EX
} = require("../src/appConfigs/AllowedAppsConfig.js");
const app = require('../app.js');
const {UserModel} = require('../models/user.js');

const {generateJwtToken} = require("../src/JWT_Helper.js");



////////////////////////////////////////////////////////////////////////////
//                          User Login Handler >> Get
////////////////////////////////////////////////////////////////////////////
const giveLoginAccess = AsyncHandler(async (req, res) => {
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
                // req.session.user = user._id;
                req.session.user = user._id.toString();
                USER_SESSIONS[req.session.user] = user.email;

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


////////////////////////////////////////////////////////////////////////////
//                          Utility Functions
////////////////////////////////////////////////////////////////////////////
const fillSSOTokenCache = (origin, userId, ssoToken) => {
    SSO_TOKEN_CACHE[ssoToken] = [userId, ALLOWED_APPS_NAMES[origin]];
}

const storeAppInCache = (origin, userId, ssoToken) => {
    if(APPS_SESSIONS[userId] == null){
        APPS_SESSIONS[userId] = { [ALLOWED_APPS_NAMES[origin]]: true }; // why  [ AllowedAppNames[origin] ]
    }
    else{
        APPS_SESSIONS[userId][ALLOWED_APPS_NAMES[origin]] = true;
    }

    console.log({...APPS_SESSIONS}, {...USER_SESSIONS}, {...SSO_TOKEN_CACHE});
    fillSSOTokenCache(origin, userId, ssoToken);
}


//
const parseAuthHeader = (hdrValue) => {
    if(typeof hdrValue !== "string") return null;
    const matches = hdrValue.match(HEADER_REG_EX);
    return matches && {scheme: matches[1], value: matches[2]};
}
const fetchAuthHeaderByScheme = (authSheme) => {
    const authSchemeLower = authSheme.toLowerCase();
    return function(request){
        let token = null;
        if(request.headers[AUTH_HEADER]){
            const authParams = parseAuthHeader(request.headers[AUTH_HEADER]);
            console.log('authParams :>> ', authParams);

            if(authParams && authSchemeLower === authParams.scheme.toLowerCase()){
                token = authParams.value;
            }
        }

        return token;
    }
}
const fetchBearerTokenFromAuthHeader = function (){
    return fetchAuthHeaderByScheme(BEARER_AUTH_SCHEME);
}

const fetchAppTokenFromRequest = fetchBearerTokenFromAuthHeader();

const generatePayload = (ssoToken)=>{
    return new Promise(async (resolve, reject)=>{
        const globalSessionToken = SSO_TOKEN_CACHE[ssoToken][0];
        const appName = SSO_TOKEN_CACHE[ssoToken][1];
        const userEmail = USER_SESSIONS[globalSessionToken];
        console.log("In genPayload ", userEmail, );
        const user = await UserModel.findOne({email: userEmail});
        console.log('user :>> ', user);
        
        if(!user){ 
            console.log("In genPayload !user");
            // throw new Api?Error(404, "User doesn't exist!!! ❌"); 
            reject(user);
        }

        const payload = {userId: user._id.toString(), email: user.email};
        // return payload;
        resolve(payload);
    })
}

const verifySSOToken = AsyncHandler(async (req, res, next) => {
    const appToken = fetchAppTokenFromRequest(req);
    const {ssoToken} = req.query;
    console.log("here1");
    console.log('appToken :>> ', appToken);
    console.log('ssoToken :>> ', ssoToken);
    console.log('SSO_TOKEN_CACHE :>> ', SSO_TOKEN_CACHE);
    if(
        appToken == null || 
        ssoToken == null || 
        SSO_TOKEN_CACHE[ssoToken] == null
    ){
        console.log("here2");
        throw new ApiError(400, "Bad Request! ❌");
    }

    const appName = SSO_TOKEN_CACHE[ssoToken][1];
    const globalSessionToken = SSO_TOKEN_CACHE[ssoToken][0];

    if(
        appToken !== process.env[appName] ||
        APPS_SESSIONS[globalSessionToken][appName] !== true
    ){
        throw new ApiError(403, "Unauthorized Access ❌");
    }

    try {
        const payload = await generatePayload(ssoToken);
        console.log("payload: ", payload)
        const token = await generateJwtToken(payload);
        console.log("token: ", token);
        delete SSO_TOKEN_CACHE[ssoToken]; // As we are proving it to user, no the token is of no use and deleteing it to avoid mis-use

        return res
        .status(200)
        .json(new ApiResponse(200, {token}, "LoggedIn Successfully! ✅"));
        
    } catch (error) {
        console.log('error VerifySSOToken() :>> ', error);
        throw new ApiError(502, "Internal Server Error! ❌"); 
    }

});

module.exports = {
    giveLoginAccess,
    handleUserLogin,
    handleUserLogOut,
    verifySSOToken
}