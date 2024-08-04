const jwt = require('jsonwebtoken');
const {privateCert} = require('../config/index.config.js').keys;
const {JWT_TOKEN_HEADERS, JWT_REFRESH_TOKEN_HEADERS, JWT_ACCESS_TOKEN_HEADERS} = require('./constants.js');


const generateJwtToken = (payload) => 
    new Promise((resolve, reject)=>{
        jwt.sign(
            {...payload},
            privateCert,
            JWT_TOKEN_HEADERS,
            (err, token)=>{
                if(err){return reject(err)}
                return resolve(token);
            }
        );
    });



const generateAccessToken = (payload)=>
    new Promise((resolve, reject)=>{
        jwt.sign(
            {...payload},
            privateCert,
            JWT_ACCESS_TOKEN_HEADERS,
            (err, token)=>{
                if(err){return reject(err)}
                return resolve(token);
            }
        );
    });



const generateRefreshToken = (payload)=>
    new Promise((resolve, reject)=>{
        jwt.sign(
            {...payload},
            process.env.REFRESH_TOKEN_SECRET,
            JWT_REFRESH_TOKEN_HEADERS,
            (err, token)=>{
                if(err){return reject(err)}
                return resolve(token);
            }
        )
    });




////////////////////////////////////////////////////////////////////////////
//                          Jwt Token Verificator
////////////////////////////////////////////////////////////////////////////
const verifyRefreshToken = (token, key) => 
    new Promise((resolve, reject)=>{
        jwt.verify(
            token,
            key,
            JWT_TOKEN_HEADERS,
            (err, decoded) => {
                if(err){ return reject(err); }
                return resolve(decoded);
            }
        );
    });



module.exports = Object.assign({},{
    generateJwtToken,
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken
})