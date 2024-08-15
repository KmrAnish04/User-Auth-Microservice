const connectToMongoDB = require('./src/db/connectMongoDB.js');
const {connectRedisClient} = require('./src/RedisDB/redis.connection.js');
const app = require("./app.js");

const PORT = 3000;

const REDIS_HOST = 'redis://localhost';
const REDIS_PORT = 6379;
const REDIS_URL = `${REDIS_HOST}:${REDIS_PORT}`;


// ********************************* DB Connection and Start Server *********************************
connectToMongoDB(process.env.DB_URL)
.then(async ()=>{ 
    await connectRedisClient(REDIS_URL);
    app.listen(PORT, ()=>{
        console.log(`Listening on port ${PORT}: http://localhost:${PORT}/`);
    });
})
.catch(err=>{ console.error("Can't listen to the port, something went wrong!", err); })