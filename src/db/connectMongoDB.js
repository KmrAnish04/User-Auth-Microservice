// MongoDB Connection => connectMongoDB.js

const mongoose = require('mongoose');

async function connectToMongoDB(dbURL){
    console.log("mongo url: ", dbURL)
    return new Promise((resolve, reject)=>{
        mongoose.connect(dbURL)
        .then((res)=>{
            console.log('MongoDB connected successfully! 🟩 ✅');
            resolve(res);
        })
        .catch((err)=>{
            console.error('Error connecting to MongoDB:', err);
            reject(err);
        })
    })
}


module.exports = connectToMongoDB;