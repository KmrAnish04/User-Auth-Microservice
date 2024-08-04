// ********************************* Package Imports *********************************
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session =  require("express-session");



// ********************************* Custom Imports *********************************
const { logReqRes, catchErrors, errorHandler } = require('./middlewares/index.middleware.js');
const passport = require("passport");
require('./src/passport-Config');



// ********************************* Routes Imports ************************************************
const userAuthRoute = require('./routes/auth.route.js');
const user = require('./routes/user.route.js');



// ********************************* App Initialization *********************************
const app = express();



// ********************************* Setup Passport Middlewares *********************************
app.use(session({
    secret:"Any normal Word",       //decode or encode session
    resave: false,          
    saveUninitialized:false,
    cookie:{ maxAge: 2*60*1000 }    
}));
app.use(passport.initialize());
app.use(passport.session());



// ********************************* Setup App Level Middlewares *********************************
app.set('views', path.join(__dirname, 'views'));            // views directory setup
app.set('view engine', 'ejs'); // view engine setup
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json({limit: '16kb'}));

app.use(express.static(path.join(__dirname, 'public')));
app.use(logReqRes('log.txt'))                               // Custom Middleware
// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));



// ********************************* Routes *********************************
app.use('/api/v1/auth', userAuthRoute);


app.use('/api/v1/users', passport.authenticate('jwt', {session: false}), user);
app.use('/Blogs', function(req, res, next) {
    console.log("Log from /Blogs: ", req.isAuthenticated());
    res.json("Here are the Blogs!")
})
app.use('/', function(req, res, next) {
    console.log("Logs from /", req.isAuthenticated());
    res.json({msg: "Hey Hii ✋, You're at Home Page!"})
})



// ********************************* Error Handling *********************************
app.use(catchErrors()); // catch 404 and forward to error handler
app.use(errorHandler()); // error handler


module.exports = app;