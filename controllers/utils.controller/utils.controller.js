// ********************** Utility Functions **********************

const {UserModel} = require('../../models/user.model.js');
const {
    AUTH_HEADER,
    BEARER_AUTH_SCHEME,
    HEADER_REG_EX
} = require('../../src/constants.js');
const { getRedisClient } = require('../../src/RedisDB/redis.connection.js');




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
const fillSSOTokenCache = async (origin, userId, ssoToken) => {
    const appNameFromRedis = await this.getDataFromRedis(
        'ALLOWED_APPS_NAMES',
        origin
    );

    const storeSSOTokenResult = await this.setDataInRedis(
        'SSO_TOKEN_CACHE',
        ssoToken,
        [userId, appNameFromRedis],
        30
    );

    console.log("App Name: ", appNameFromRedis);
    console.log("set sso token result: ", storeSSOTokenResult)
}

module.exports.storeAppInCache = async (origin, userId, ssoToken) => {
    const appNameInRedis = await this.getDataFromRedis('ALLOWED_APPS_NAMES', origin);
    const storeRst = await this.setDataInRedis(
        'APPS_SESSIONS',
        userId,
        {[appNameInRedis]: true}
    );
    console.log("storeAppInCache() Date Stored In Redis: ", storeRst);
    fillSSOTokenCache(origin, userId, ssoToken);
}



////////////////////////////////////////////////////////////////////////////
//                          Generate Payload
////////////////////////////////////////////////////////////////////////////
module.exports.generatePayload = (ssoToken)=>{
    return new Promise(async (resolve, reject)=>{
        
        // UserId is global Session Token
        const ssoTokenData = await this.getDataFromRedis('SSO_TOKEN_CACHE', ssoToken);
        const globalSessionToken = ssoTokenData[0];

        const userSessionData = await this.getDataFromRedis('USER_SESSIONS', globalSessionToken);
        const userEmail = userSessionData.email;
        
        console.log("In genPayload() ");
        console.log('globalSessionToken :>> ', globalSessionToken);
        console.log('userSessionData :>> ', userSessionData);
        console.log('userEmail :>> ', userEmail);

        const user = await UserModel.findOne({email: userEmail});
        console.log('user :>> ', user);
        
        if(!user){ 
            console.log("In genPayload !user");
            reject(user);
            // throw new ApiError(404, "User doesn't exist!!! ❌"); 
        }

        const payload = {userId: user._id.toString(), email: user.email};
        resolve(payload);
    })
}



////////////////////////////////////////////////////////////////////////////
//                          Redis Set Data
////////////////////////////////////////////////////////////////////////////
module.exports.setDataInRedis = async (key, field, value, ttlInSeconds = null) => {
    try {
        const RedisClient = getRedisClient();
        const result = await RedisClient.hSet(
            key,
            field,
            JSON.stringify(value)
        );

        // If a TTL is provided, set the expiry time on the key
        if (ttlInSeconds !== null) {
            console.log(`setting expiry for ${key}:${field} for ${ttlInSeconds} sec. !!!⌛`)
            console.log(RedisClient)
            RedisClient.hexpire(key, ttlInSeconds, field);
        }

        return result;
    } 
    catch (error) {
        console.error('Error setting JSON data in Redis:', error);
        return null;
    }
}



////////////////////////////////////////////////////////////////////////////
//                          Redis Get Data
////////////////////////////////////////////////////////////////////////////
module.exports.getDataFromRedis = async (key, field) => {
    try {
        const RedisClient = getRedisClient();
        const data = await RedisClient.hGet(key, field);
        
        if (isJSONString(data)) { return JSON.parse(data);} // Check if the data is JSON-stringified
        return data; // If not JSON-stringified, return it as it is
    } 
    catch (error) {
        console.error('Error fetching or parsing JSON data from Redis:', error);
        return null; // Or handle the error as needed
    }
}

////////////////////////////////////////////////////////////////////////////
//                          Redis Delete Data
////////////////////////////////////////////////////////////////////////////
module.exports.deleteDataFromRedis = async (key, field) => {    
    try {
        const RedisClient = getRedisClient();
        const result = await RedisClient.hDel(key, field);
        console.log(`Field ${field} deleted from hash ${key}. Result: ${result}`);
    } 
    catch (error) { console.error('Error deleting field from hash:', error); }
}


////////////////////////////////////////////////////////////////////////////
// Helper function to check if a string is JSON-stringified
////////////////////////////////////////////////////////////////////////////
function isJSONString(str) {
    if (typeof str !== 'string') { return false; }
    try { JSON.parse(str); return true;} 
    catch (e) { return false; }
}
