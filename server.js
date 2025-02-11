const connectToMongoDB = require('./src/db/connectMongoDB.js');
const SSOAuthServerConfig = require('./src/config.js');
const app = require("./app.js");

const PORT = SSOAuthServerConfig.app.port;

(async function () {
    try {
        // First, connect to MongoDB
        await connectToMongoDB(SSOAuthServerConfig.mongoDB.path);
        // await connectToMongoDB(process.env.DB_DOCKER_URL);

        await app.setupApp();

        // Start the server
        app.listen(PORT, () => {
            console.log(`Listening on port ${PORT}: http://localhost:${PORT}/`);
        });
    } catch (err) {
        console.error("Can't listen to the port, something went wrong!", err);
    }
})();
