// ********************************* Package Imports *********************************
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session =  require("express-session");
const { connectRedisClient } = require('./src/RedisDB/redis.connection.js');
const getRedisSessionStore = require('./src/RedisDB/RedisSessionStore.js')


// ********************************* Custom Imports *********************************
const { logReqRes, catchErrors, errorHandler } = require('./middlewares/index.middleware.js');
const passport = require("passport");
require('./src/passport-Config');



// ********************************* Routes Imports ************************************************
const userAuthRoute = require('./routes/auth.route.js');
const user = require('./routes/user.route.js');



// ********************************* App Initialization *********************************
const app = express();

app.setupApp = async () => {

    const RedisClient = await connectRedisClient(process.env.REDIS_DB_URL);
    
    // ********************************* Setup Passport Middlewares *********************************
    app.use(session({
        // store: getRedisSessionStore(RedisClient),
        secret:"Any normal Word",       //decode or encode session
        resave: false,          
        saveUninitialized:false,
        cookie:{ secure: false, maxAge: 5*60*1000 }    
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


    app.get('/', async function(req, res, next) {
        // req.sessionID = `my-prefix:${'anishapp: ' + req.sessionID}`;
        // req.session.save((err) => {
        //     if (err) {
        //         console.log('some err :>> ', err);
        //     } else {
        //         // Continue with your logic
        //     }
        // });

        getRedisSessionStore().set(`my-prefix:${'anishapp: ' + req.sessionID}`, req.session, (err, data)=>{
            console.log("start");
            console.log("err: ", err);
            console.log("data: ", data)
            console.log("end");
        })

        console.log("Logs from /");
        console.log("req :>> ", req.session);
        console.log("req.sessionID :>> ", req.sessionID);
        
        // await getRedisSessionStore().get("BcQR5VeL8EbFOpX4Cmd14IkL8Pu6goLu", (err, data)=>{
        //     console.log("start");
        //     console.log("err: ", err);
        //     console.log("data: ", data)
        //     console.log("end");
        // });
        res.json({msg: "Hey Hii ✋, You're at Home Page!"})
    })



    // ********************************* Error Handling *********************************
    app.use(catchErrors()); // catch 404 and forward to error handler
    app.use(errorHandler()); // error handler

}


// setupApp();


module.exports = app;