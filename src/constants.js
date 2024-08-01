module.exports.HEADER_REG_EX = /(\S+)\s+(\S+)/;

module.exports.AUTH_HEADER = "authorization";

module.exports.BEARER_AUTH_SCHEME = "bearer";

module.exports.JWT_TOKEN_HEADERS = {
    issuer: "SSO-Server-Anish",
    algorithm: "RS256",
    expiresIn: "1m"
};


module.exports.JWT_ACCESS_TOKEN_HEADERS = {
    issuer: "SSO-Server-Anish",
    algorithm: "RS256",
    expiresIn: "1m"
};


module.exports.JWT_REFRESH_TOKEN_HEADERS = {
    issuer: "SSO-Server-Anish",
    expiresIn: "10d"
};


module.exports.GOOGLE_AUTH_CALLBACK_URL = "http://localhost:3000/api/v1/auth/google/callback";