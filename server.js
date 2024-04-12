const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const port = 3000;


// Custom Imports
const connectToMongoDB = require('./src/db/connectMongoDB');
const passport = require("passport");
require('./src/passport-Config');
const UserAuthentication = require('./routes/auth');
const UserAuthorization = require('./routes/register');
const user = require('./routes/user');


const app = express();


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));



// Routes
app.use('/auth', UserAuthentication);
app.use('/register', UserAuthorization);
app.use('/user', passport.authenticate('jwt', {session: false}), user);


// catch 404 and forward to error handler
app.use(function(req, res, next){
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
});


// error handler
app.use(function(err, req, res, next){
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') == 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error', {err});
});



connectToMongoDB('mongodb://localhost:27017/UserAuthMicroservice')
.then(()=>{ app.listen(port, ()=>{console.log(`Listening on port ${port}: http://localhost:3000/`);});})
.catch(err=>{ console.error("Can't listen to the port, something went wrong!", err);})