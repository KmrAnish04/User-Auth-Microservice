const connectToMongoDB = require('./src/db/connectMongoDB.js');
const app = require("./app.js");

const PORT = 3000;


// ********************************* DB Connection and Start Server *********************************
connectToMongoDB('mongodb://localhost:27017/UserAuthMicroservice')
.then(()=>{ 
    app.listen(PORT, ()=>{console.log(`Listening on port ${PORT}: http://localhost:${PORT}/`);});
})
.catch(err=>{ console.error("Can't listen to the port, something went wrong!", err); })