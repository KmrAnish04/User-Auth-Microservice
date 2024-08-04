// ********************** Utility Functions **********************

const {UserModel} = require('../../models/user.model.js');
const {
    ALLOWED_APPS_NAMES, 
    APPS_SESSIONS, 
    USER_SESSIONS, 
    SSO_TOKEN_CACHE,
} = require('../../src/appConfigs/AllowedAppsConfig.js');
const {
    AUTH_HEADER,
    BEARER_AUTH_SCHEME,
    HEADER_REG_EX
} = require('../../src/constants.js');




////////////////////////////////////////////////////////////////////////////
//                          Fetch Token form Request
////////////////////////////////////////////////////////////////////////////
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
module.exports.fetchAppTokenFromRequest = fetchBearerTokenFromAuthHeader();



////////////////////////////////////////////////////////////////////////////
//                          Store App In Cache
////////////////////////////////////////////////////////////////////////////
const fillSSOTokenCache = (origin, userId, ssoToken) => {
    SSO_TOKEN_CACHE[ssoToken] = [userId, ALLOWED_APPS_NAMES[origin]];
}
module.exports.storeAppInCache = (origin, userId, ssoToken) => {
    if(APPS_SESSIONS[userId] == null){
        APPS_SESSIONS[userId] = { [ALLOWED_APPS_NAMES[origin]]: true }; // why  [ AllowedAppNames[origin] ]
    }
    else{
        APPS_SESSIONS[userId][ALLOWED_APPS_NAMES[origin]] = true;
    }

    console.log("APPS_SESSIONS", {...APPS_SESSIONS});
    console.log("USER_SESSIONS", {...USER_SESSIONS});
    console.log("SSO_TOKEN_CACHE", {...SSO_TOKEN_CACHE});
    fillSSOTokenCache(origin, userId, ssoToken);
}



////////////////////////////////////////////////////////////////////////////
//                          Generate Payload
////////////////////////////////////////////////////////////////////////////
module.exports.generatePayload = (ssoToken)=>{
    return new Promise(async (resolve, reject)=>{
        const globalSessionToken = SSO_TOKEN_CACHE[ssoToken][0];
        const appName = SSO_TOKEN_CACHE[ssoToken][1];
        const userEmail = USER_SESSIONS[globalSessionToken].email;
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