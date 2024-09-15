const connectToMongoDB = require('./src/db/connectMongoDB.js');
const app = require("./app.js");

const PORT = process.env.PORT || 3000;

(async function () {
    try {
        // First, connect to MongoDB
        await connectToMongoDB(process.env.DB_URL);

        await app.setupApp();

        // Start the server
        app.listen(PORT, () => {
            console.log(`Listening on port ${PORT}: http://localhost:${PORT}/`);
        });
    } catch (err) {
        console.error("Can't listen to the port, something went wrong!", err);
    }
})();
