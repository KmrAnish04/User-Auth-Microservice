const passport = require("passport");
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth2').Strategy;
const passportJWT = require('passport-jwt');
const JWTStrategy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;
const {UserModel, GoogleUserModel} = require('../models/user.model.js');
const ApiError = require("./utils/ApiError.js");
require('dotenv').config();


// SignUp Middleware
passport.use(
    'signup',
    new LocalStrategy(
        {
            usernameField: 'email',
            passwordField: 'password'
        },
        async (email, password, cb) => {
            try{
                const isUserExists = await UserModel.findOne({email}).select("-password");
               
                if(isUserExists){
                    console.log('isUserExists :>> ', isUserExists);
                    throw new ApiError(405, "User Already Exists!")
                    // const error = new ApiError(405, "User Already Exists!")
                    // return cb(error, null);
                }

                const user = await UserModel.create({email, password});
                return cb(null, user, {message: "signup successfull!", status: 200});

            }
            catch (error) { cb(error) }
        }
    )
)

// LogIn Middleware
passport.use(
    'login',
    new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password'
    },
    async (email, password, cb) => {
        try {
            const user = await UserModel.findOne({email});

            if(!user){ return cb(null, false, {message: 'User not found!'}) }

            const validate = await user.isValidPassword(password);
            if(!validate) { return cb(null, false, {message: 'Wrong Password!'}) }

            return cb(null, user, {message: 'User Found Valid!'});
        }
        catch (error) { return cb(error) }
    }
));

// Middleware that allows only requests with valid tokens to access some special routes needing authentication
passport.use(new JWTStrategy(
    {
        secretOrKey: 'anish_json-web-token',
        jwtFromRequest: ExtractJWT.fromUrlQueryParameter('secret_token')
    },
    async (token, cb) => {
        try{ return cb(null, token.user) }
        catch (errror) { cb(error) }
    }
    // or find user matching the id
    // function (jwtPayload, cb){
    //     return UserModel.findOneById(jwtPayload.id)
    //     .then(user => {return cb(null, user);})
    //     .catch(err => {return cb(err);})
    // }
));


// Google Login Middleware
passport.use(new GoogleStrategy({
        clientID: process.env.Google_Client_ID,
        clientSecret: process.env.Google_Client_Secret,
        callbackURL: "http://localhost:3000/api/v1/auth/google/callback",
        passReqToCallback: true
    },
    function (request, accessToken, refreshToken, profile, done) {
        console.log({request, accessToken, refreshToken, profile});
        GoogleUserModel.findOrCreate(
            {
                googleId: profile.id, 
                email: profile.email,
                name: profile.name,
                displayName: profile.displayName,
            }, 
            function (err, user){
                console.log("Saving Data For Google User!")
                return done(err, user);
            }
    )}
));


passport.serializeUser((user,done)=>{done(null,user);})
passport.deserializeUser((user,done)=>{done(null,user);})
