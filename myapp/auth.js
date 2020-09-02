var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var User = require('./models/users');
var jwt = require('jsonwebtoken');
var JwtStrategy = require('passport-jwt').Strategy;
var ExtractJwt = require('passport-jwt').ExtractJwt;

const secretKey = 'Qu!cK Br0wN F0X';
exports.secretKey = {'secretKey': secretKey};

// Generate JSON web token synchronously
exports.getToken = function(user) {
    return jwt.sign(user, secretKey, {expiresIn: '2h'});
};

// Local authentication
exports.local = passport.use(new LocalStrategy(User.authenticate()));

// Jwt authentication
var opts = {}
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = secretKey;

exports.jwtPassport = passport.use(new JwtStrategy(opts, function(jwt_payload, done) {
    //User.findOne({id: jwt_payload.sub}, function(err, user) {
    User.findOne({_id: jwt_payload._id}, function(err, user) {
        if (err) {
            return done(err, false);
        }
        if (user) {
            return done(null, user);
        } else {
            return done(null, false);
        }
    });
}));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());