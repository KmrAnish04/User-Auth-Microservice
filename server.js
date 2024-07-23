const connectToMongoDB = require('./src/db/connectMongoDB.js');
const app = require("./app.js");

const PORT = 3000;


// ********************************* DB Connection and Start Server *********************************
connectToMongoDB(process.env.DB_URL)
.then(()=>{ 
    app.listen(PORT, ()=>{console.log(`Listening on port ${PORT}: http://localhost:${PORT}/`);});
})
.catch(err=>{ console.error("Can't listen to the port, something went wrong!", err); })