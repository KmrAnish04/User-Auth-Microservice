const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session =  require("express-session");

// Custom Imports
const { logReqRes, catchErrors, errorHandler } = require('./middlewares');
const connectToMongoDB = require('./src/db/connectMongoDB');
const passport = require("passport");
require('./src/passport-Config');

// Routes Imports
const UserAuthentication = require('./routes/auth');
const UserAuthorization = require('./routes/register');
const user = require('./routes/user');


const port = 3000;
const app = express();


app.use(session({
    secret:"Any normal Word",       //decode or encode session
    resave: false,          
    saveUninitialized:false,
    cookie:{
        maxAge: 2*60*1000 
    }    
}));
app.use(passport.initialize());
app.use(passport.session());


app.set('views', path.join(__dirname, 'views'));            // views directory setup
app.set('view engine', 'ejs'); // view engine setup
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(logReqRes('log.txt'))                               // Custom Middleware
// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));


// Routes
app.use('/api/auth', UserAuthentication);
app.use('/api/register', UserAuthorization);
app.use('/api/users', passport.authenticate('jwt', {session: false}), user);
app.use('/', function(req, res, next) {res.json("Heyj Hii ✋, You're at Home Page!")})


// Error Handling
app.use(catchErrors()); // catch 404 and forward to error handler
app.use(errorHandler()); // error handler


connectToMongoDB('mongodb://localhost:27017/UserAuthMicroservice')
.then(()=>{ app.listen(port, ()=>{console.log(`Listening on port ${port}: http://localhost:3000/`);});})
.catch(err=>{ console.error("Can't listen to the port, something went wrong!", err);})