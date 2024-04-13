const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');

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


app.set('views', path.join(__dirname, 'views')); // views directory setup
app.set('view engine', 'ejs'); // view engine setup
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(logReqRes('log.txt')) // Custom Middleware
// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));


// Routes
app.use('/api/auth', UserAuthentication);
app.use('/api/register', UserAuthorization);
app.use('/api/users', passport.authenticate('jwt', {session: false}), user);


// Error Handling
app.use(catchErrors()); // catch 404 and forward to error handler
app.use(errorHandler()); // error handler


connectToMongoDB('mongodb://localhost:27017/UserAuthMicroservice')
.then(()=>{ app.listen(port, ()=>{console.log(`Listening on port ${port}: http://localhost:3000/`);});})
.catch(err=>{ console.error("Can't listen to the port, something went wrong!", err);})