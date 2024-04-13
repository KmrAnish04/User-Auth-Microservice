// User Route Controller

const UserModel = require("../models/user");


/* GET users listing. */
async function getAllUsers(req, res, next) {
    try {
        const users = await UserModel.find({});
        res.json(users);
    } catch (err) { next(err);}
};
  
/* GET user profile. */
function getUserProfile(req, res, next) {
    res.json({
        message: 'You made it to the secure route!',
        user: req.user,
        token: req.query.secret_token
    })
};


module.exports = {getAllUsers, getUserProfile};