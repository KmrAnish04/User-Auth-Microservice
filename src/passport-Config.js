const passport = require("passport");
const LocalStrategy = require('passport-local').Strategy;
const passportJWT = require('passport-jwt');
const JWTStrategy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;
const UserModel = require('../models/user');


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
                const user = await UserModel.create({email, password});
                return cb(null, user);

                // const user = new UserModel({email, password});
                // user.save().then(user => console.log("user saved!", user));
                // return cb(null, user);

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

            return cb(null, user, {message: 'Logged In Successfully!'});
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