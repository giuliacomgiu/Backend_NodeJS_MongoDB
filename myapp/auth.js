var cors = require('cors');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
const FacebookTokenStrategy = require('passport-facebook-token');
var GoogleStrategy = require('passport-google-oauth20').Strategy;
//const {OAuth2Client} = require('google-auth-library');
//const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
var jwt = require('jsonwebtoken');
var JwtStrategy = require('passport-jwt').Strategy;
var ExtractJwt = require('passport-jwt').ExtractJwt;
var User = require('./models/users');

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
/*  User.findOne({_id: jwt_payload._id}, function(err, user) {
    if (err) {
      return done(err, false);
    }
    if (user) {
      return done(null, user);
    } else {
      return done(null, false);
    }
  });*/
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
  callbackURL: 'http://localhost:3000/users/facebook/callback'
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
  callbackURL: 'http://localhost:3000/users/google/callback'
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
exports.matchUser = function(stored_id, req_id){
  if (!req_id || !stored_id.equals(req_id))
  {
    err = new Error('Unauthorized.');
    err.status = 401;
    return err;
  } else {
    return null;
  }
};

// Check google token and create 
/*exports.googleToken = async function(payload){
  await User.findOne({googleId: payload['sub']}, function(err, user) {
    if(err){ user = false }
    else {
      err = null;
      if(!user) 
      {
        user = new User({googleId: payload['sub']});
        //user.firstname = payload['name'];
        //user.save((err, user) => {})
      }
    }
  return user
  })
}*/

/*
* MIDDLEWARES
*/
// Check if user is authenticated
//exports.verifyAuthentication = passport.authenticate(['jwt', 'facebook']);
exports.verifyAuthentication = function(req, res, next) {
  if (req.user) { next() }
  else {
    res.status(401).end(); // this has no body
    return;
  }
}

// Check if user is admin
exports.verifyAdmin = function(req, res, next){
  if (req.user.admin) { next() }
  else {
    err = new Error('Unauthorized.'); // this has a body
    err.status = 401;
    return next(err);
  }
};
