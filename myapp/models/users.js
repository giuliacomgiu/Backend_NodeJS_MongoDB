const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');
const { model } = require('./dishes');

const User = new Schema({
    firstname: {
        type: String/*,
        required: true*/
    },
    lastname: {
        type: String/*,
        required: true*/
    },
    birthdate: {
        type: Date
    },
    admin: {
        type: Boolean,
        default: false
    },
    facebookId: {
        type: String
    },
    googleId: {
        type: String
    }
});

User.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', User);