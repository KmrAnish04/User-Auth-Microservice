// User Route Controller
const mongoose = require('mongoose');

const {UserModel} = require("../models/user.model");
// const UserModel = mongoose.models['user']; 

/* GET users listing. */
async function getAllUsers(req, res, next) {
    try {
        const users = await UserModel.find({});
        res.json(users);
    } catch (err) { next(err);}
};
  
/* GET user profile. */
async function getUserProfile(req, res, next) {
    // res.json({
    //     message: 'You made it to the secure route!',
    //     user: req.user,
    //     token: req.query.secret_token
    // })


    try {
        // Assuming you have a userId stored in the request, retrieve the user from MongoDB
        const userId = req.user._id; // Assuming the user ID is stored in req.user.id
        console.log("user profile id: ", userId)
        const user = await UserModel.findById(userId); // Find user by ID in MongoDB

        if (!user) {
            // If user is not found, return an error response
            return res.status(404).json({ message: 'User not found' });
        }

        
        // If user is found, return user profile data in the response
        res.json({
            message: 'You made it to the secure route!',
            user: user, // Include user profile data
            token: req.query.secret_token
        });
        
    } catch (error) {
        // If an error occurs during database query, return an error response
        console.error('Error fetching user profile:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};


module.exports = {getAllUsers, getUserProfile};