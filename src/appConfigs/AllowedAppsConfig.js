

module.exports.ALLOWED_APPS_ORIGINS = {
    "http://consumer.anishkmr.in:3020": true,
    "http://consumertwo.anishkmr.in:3030": true,
    "http://sso.anishkmr.in:3080": false,
    "http://127.0.0.1:3020": true,
    "http://127.0.0.1:8000": true,
    "https://www.google.com": true,
};


module.exports.ALLOWED_APPS_NAMES = {
    "http://consumer.anishkmr.in:3020": "sso_consumer",
    "http://consumertwo.anishkmr.in:3030": "singleSignOn_consumer",
    "http://127.0.0.1:3020": "local_consumer",
    "http://127.0.0.1:8000": "Anish_Devfolio"
};


module.exports.APPS_SESSIONS = {};

module.exports.USER_SESSIONS = {};

module.exports.SSO_TOKEN_CACHE = {};