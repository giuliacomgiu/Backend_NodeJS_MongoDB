var cors = require('cors');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
const FacebookTokenStrategy = require('passport-facebook-token');
var GoogleStrategy = require('passport-google-oauth20').Strategy;
var jwt = require('jsonwebtoken');
var JwtStrategy = require('passport-jwt').Strategy;
var ExtractJwt = require('passport-jwt').ExtractJwt;

var User = require('./models/users');
const myErr = require('./error');
/*
* PASSPORT CONFIGURATION
*/
// Local authentication
passport.use(new LocalStrategy(User.authenticate()));

// Jwt authentication
var opts = {}
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = process.env.SECRET_KEY;

passport.use(new JwtStrategy(opts, function(jwt_payload, done) {
  User.findOne({_id: jwt_payload._id})
  .then((user) => {
    if(!user) {
      return done(null, false);
    } else {
      return done(null, user);
    }
  })
  .catch((err) => { return done(err, false) })
}));

// Facebook token authentication
passport.use(new FacebookTokenStrategy({
  clientID: process.env.FACEBOOK_APP_ID,
  clientSecret: process.env.FACEBOOK_APP_SECRET
}, (accessToken, refreshToken, profile, done) => {
  User.findOne({facebookId: profile.id}, (err, user) => {
    if (err) {
      return done(err, false);
    }
    if (!err && user !== null) {
      return done(null, user);
    }
    else {
      user = new User({ username: profile.displayName });
      user.facebookId = profile.id;
      user.firstname = profile.name.givenName;
      user.lastname = profile.name.familyName;
      user.save((err, user) => {
        if (err)
          return done(err, false);
        else
          return done(null, user);
      })
    }
  });
}
));

// Facebook session login
passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_APP_ID,
  clientSecret: process.env.FACEBOOK_APP_SECRET,
  callbackURL: `${process.env.APP_URI_SSL}:${process.env.PORT}/users/facebook/callback`
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOne({ facebookId: profile.id })
    .then((user) => {
      if(!user) {
        user = new User({ facebookId: profile.id });
        if (profile.givenName) {user.firstname = profile.givenName};
        if (profile.familyName) {user.lastname = profile.familyName};
        if (profile.displayName) {user.username = profile.displayName};
        return user.save();
      } else {
        return user;
      }
    })
  .then((user) => { return cb(null, user) })
  .catch((err) => { return cb(err, false) } );
  }
));

//Google token login

// Google session login
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `${process.env.APP_URI_SSL}:${process.env.PORT}/users/google/callback`
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOne({ googleId: profile.id })
    .then((user) => {
      if(!user) {
        user = new User({ googleId: profile.id });
        if (profile.name.givenName) {user.firstname = profile.name.givenName};
        if (profile.name.familyName) {user.lastname = profile.name.familyName};
        if (profile.displayName) {user.username = profile.displayName};
        return user.save();
      } else {
        return user;
      }
    })
  .then((user) => { return cb(null, user) })
  .catch((err) => { return cb(err, false) } );
  }
));

passport.serializeUser(function(user, done) {
  done(null, user._id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
  done(err, user);
  });
});

module.exports.passport = passport;

/*
* METHODS
*/
// Generate JSON web token synchronously
exports.getToken = function(user) {
  return jwt.sign(user, process.env.SECRET_KEY, {expiresIn: '2h'});
};

// Check if authenticated user matches stored user. 
exports.matchUser = function(stored_id, req_id, next){
  if (!req_id || !stored_id.equals(req_id))
  {
    return next(new myErr.UnauthOperationError());
  } else {
    return true;
  }
};

/*
* MIDDLEWARES
*/
// Check if user is authenticated
//exports.verifyAuthentication = passport.authenticate(['jwt', 'facebook']);
exports.verifyAuthentication = function(req, res, next) {
  if (req.user) { next() }
  else {
    return next(new myErr.AuthenticationError());
  }
}

// Check if user is admin
exports.verifyAdmin = function(req, res, next){
  if (req.user.admin) { next() }
  else {
    return next(new myErr.AuthenticationError());
  }
};
