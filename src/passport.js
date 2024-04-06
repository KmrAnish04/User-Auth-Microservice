const passport = require("passport")
const LocalStrategy = require('passport-local').Strategy;
const passportJWT = require('passport-jwt');
const JWTStrategy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;

passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
    },
    function (email, password, cb){
        return UserModel.findOne({email, password})
        .then(user=>{
            if(!user){return cb(null, false, {message: 'Incorrect email or password.'});}
            return cb(null, user, {message: 'Logged In Successfully'});
        })
        .catch(err=>cb(err));
    }
));


// Middleware that allows only requests with valid tokens to access some special routes needing authentication
passport.use(new JWTStrategy({
    jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
    secretOrKey: 'anish_json-web-token'
    },
    function (jwtPayload, cb){
        return UserModel.findOneById(jwtPayload.id)
        .then(user => {return cb(null, user);})
        .catch(err => {return cb(err);})
    }
))