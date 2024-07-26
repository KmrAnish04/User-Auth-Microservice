// User Register Controllers
const ApiResponse = require('../src/utils/ApiResponse.js');


async function handleUserSignIn(req, res, next) {
    return res
    .status(200)
    .json(new ApiResponse(200, {}, "SignUp Successfull!!! 🎉🎊✅"))
}

module.exports = {handleUserSignIn}