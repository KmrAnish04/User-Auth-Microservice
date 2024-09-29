const mongoose = require('mongoose');
const findOrCreate = require("mongoose-findorcreate");
const bcrypt = require('bcrypt');


const Schema = mongoose.Schema;
const UserSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    }
});



// Before the user information is saved in the database, this function will be called, you will get the plain text password, hash it, and store it.
UserSchema.pre(
    'save',
    async function(next){
        const user = this;
        const hash = await bcrypt.hash(this.password, 10);
        this.password = hash;
        next();
    }
);


// make sure that the user trying to log in has the correct credentials
UserSchema.methods.isValidPassword = async function(password){
    const user = this;
    const compare = await bcrypt.compare(password, user.password);
    return compare;
}

// User Schema for Google Authenticated Users
const GoogleUserSchema = new Schema({ 
    googleId: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: Object,
        required: true,
        unique: false
    },
   displayName: {
        type: String,
        required: true,
        unique: false
    },
    email: {
        type: String,
        required: true,
        unique: false
    }
});
GoogleUserSchema.plugin(findOrCreate);



const UserModel = mongoose.model('user', UserSchema);
const GoogleUserModel = mongoose.model('GoogleUser', GoogleUserSchema);
module.exports = {UserModel, GoogleUserModel};