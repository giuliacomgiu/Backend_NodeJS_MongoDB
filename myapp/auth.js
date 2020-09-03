var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var User = require('./models/users');
var jwt = require('jsonwebtoken');
var JwtStrategy = require('passport-jwt').Strategy;
var ExtractJwt = require('passport-jwt').ExtractJwt;

// Generate JSON web token synchronously
exports.getToken = function(user) {
    return jwt.sign(user, process.env.SECRET_KEY, {expiresIn: '2h'});
};

// Local authentication
passport.use(new LocalStrategy(User.authenticate()));

// Jwt authentication
var opts = {}
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = process.env.SECRET_KEY;

passport.use(new JwtStrategy(opts, function(jwt_payload, done) {
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

module.exports.passport = passport;

exports.verifyAuthentication = passport.authenticate('jwt',{session:false});

exports.verifyAdmin = function(req, res, next){
    if (req.user.admin) { next() }
    else {
        err = new Error('Unauthorized.');
        err.status = 403;
        return next(err);
    }
}

// Check user authorization before operation. Dont use as middleware
exports.matchUser = function(stored_id, req_id){
    if (!req_id || !stored_id.equals(req_id))
    {
        err = new Error('Unauthorized.');
        err.status = 403;
        return err;
    } else {
        return null;
    }
}