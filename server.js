const connectToMongoDB = require('./src/db/connectMongoDB.js');
const {connectRedisClient} = require('./src/RedisDB/redis.connection.js');
const app = require("./app.js");

const PORT = process.env.PORT || 3000;

// ********************************* DB Connection and Start Server *********************************
connectToMongoDB(process.env.DB_URL)
.then(async ()=>{ 
    await connectRedisClient(process.env.REDIS_DB_URL);
    app.listen(PORT, ()=>{
        console.log(`Listening on port ${PORT}: http://localhost:${PORT}/`);
    });
})
.catch(err=>{ console.error("Can't listen to the port, something went wrong!", err); })