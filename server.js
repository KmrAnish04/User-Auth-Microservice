const express = require('express');
const app = express();
const port = 3000;

// Custom Imports
const UserAuthentication = require('./routes/UserAuthentication');
const UserAuthorization = require('./routes/UserAuthorization');



// Routes
app.use('/auth', UserAuthentication);
app.use('/authr', UserAuthorization);




app.listen(port, ()=>{console.log(`Listening on port ${port}: http://localhost:3000/`);});