const bodyParser = require('body-parser');
const mongoose = require('mongoose');
var userRouter = require('express').Router();
var https = require('https');
const url = require('url');
const cors = require('./cors');
var User = require('../models/users');
var auth = require('../auth');
var myErr = require('../error');

//Adjusting to MongoDB + NodeJS updates
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useUnifiedTopology', true);
mongoose.set('useCreateIndex', true);

userRouter.use(bodyParser.json());
const routName = '/users'

userRouter.route('/')
.get(cors.restrict, 
  auth.verifyAuthentication, 
  auth.verifyAdmin,
  (req, res, next) => 
  {
    let obj = {};
    obj.links = [];
    obj.links.push({href:`/`, rel:'home', type:'GET'});
    obj.links.push({href:`${routName}/register`, rel:'signup', type:'GET,POST'});
    obj.links.push({href:`${routName}/login`, rel:'login', type:'GET,POST'});
    obj.links.push({href:`${routName}/checkToken`, rel:'validate-token', type:'GET,POST'});
    obj.links.push({href:`${routName}/google`, rel:'login-google', type:'GET'});
    obj.links.push({href:`${routName}/facebook`, rel:'login-facebook', type:'GET'});
    obj.links.push({href:`${routName}/facebook/token`, rel:'login-facebook-token', type:'GET'});
    obj.links.push({href:`${routName}/logout`, rel:'logout', type:'GET'});
    obj.links.push({href:`${routName}/ping`, rel:'ping', type:'GET'});

    res.statusCode = 200;
    res.contentType('application/json');
    res.json({ success: true, links:obj.links, message:"Will send all users"});
  }
);

userRouter.route('/register')
.all((req, res, next) => {
  res.statusCode = 200;
  res.contentType('application/json');
  next()
})
.get(cors.restrict, 
  auth.verifyAuthentication, 
  auth.verifyAdmin, 
  (req, res, next) => 
  {
    let obj = {};
    obj.links = [];
    obj.links.push({href:`${routName}`, rel:'user', type:'GET'});
    res.json({ success: true, link:obj.links, message:"Will send registration page"}); 
  }
)
.post(cors.restrict, (req, res, next) => {
  User.register(new User({ username : req.body.username , 
  firstname:req.body.firstname, lastname: req.body.lastname,
  birthdate: req.body.birthdate}), 
  req.body.password, (err, user) => {
    if (err) { return next(err) }
    auth.passport.authenticate('local', {session: false})(req, res, () => {
      res.redirect('/');
    });
  });
});

// Login
userRouter.route('/login')
.all((req, res, next) => {
  res.statusCode = 200;
  res.contentType('application/json');
  next()
})
.get(cors.restrict, function(req, res) {
  res.render('login', { user : req.user });
})
.post(cors.restrict, function(req, res, next) {
  auth.passport.authenticate('local', {session: false}, (err, user, info) => {
    if(err) return next(err);
    if(!user){
      return next(new myErr.AuthenticationError(
        `Couldn't authenticate, invalid user.`, 
        `InvalidUser`
      ));
    };

    req.logIn(user, function(err){
      if(err) {
        return next(new myErr.AuthenticationError());
      };
    });

    var token = auth.getToken({_id: req.user._id});
    let obj = {};
    obj.links = [];
    obj.links.push({href:`${routName}`, rel:'user', type:'GET'});
    res.json({
      success: true, 
      status: 'Login Successful!', 
      links: obj.links, 
      token: token
    });
  })(req,res,next);
});

// Check JWT Token
userRouter.get('/checkToken', cors.restrict, function(req, res) {
  auth.passport.authenticate('jwt', {session: false}, (err, user, info) => {
    res.contentType('application/json');
    if (err) return next(err);
    if(!user) {
      return next(new myErr.AuthenticationError(
        `Couldn't authenticate, invalid user.`, 
        `InvalidUser`))
      } else {
      res.statusCode = 200;

      let obj = {};
      obj.links = [];
      obj.links.push({href:`/`, rel:'home', type:'GET'});
      obj.links.push({href:`${routName}`, rel:'user', type:'GET'});
      return res.json({
        success:true, 
        status: 'You are authenticated.', 
        links:obj.links,
        user:user
      })
    }
  })(req, res);
});

// Google authorization redirect
userRouter.get('/google', 
  cors.restrict, 
  auth.passport.authenticate('google', { scope: ['profile'] }));

// Google callback function. Uses sessions.
userRouter.get('/google/callback',
  cors.cors, 
  auth.passport.authenticate('google', 
  { failureRedirect: 
    `${process.env.APP_URI_SSL}:${process.env.PORT}${routName}/login` 
  }),
  function(req, res) {
    res.redirect('/');
  });

// Facebook token login
userRouter.get('/facebook/token',
  cors.restrict, 
  auth.passport.authenticate('facebook-token', {session: false}),
  function (req, res) 
{
  if (req.user){
    var token = auth.getToken({_id: req.user._id});
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    let obj = {};
    obj.links = [];
    obj.links.push({href:`/`, rel:'home', type:'GET'});
    obj.links.push({href:`${routName}`, rel:'user', type:'GET'});
    return res.json({
      success: true, 
      links:obj.links, 
      token: token, 
      status: 'You are successfully logged in!'
    });
  } else {
    //return next(new myErr.AuthenticationError())
    res.statusCode = 401
    return res.redirect(
      `${process.env.APP_URI_SSL}:${process.env.PORT}${routName}/login`
    );
  }
});

// Facebook redirect
userRouter.get('/facebook', cors.cors, auth.passport.authenticate('facebook') );

// Facebook session login
userRouter.get('/facebook/callback',
  cors.cors,  
  auth.passport.authenticate('facebook', 
  { failureRedirect: `${process.env.APP_URI_SSL}:${process.env.PORT}${routName}/login` }),
  function(req, res) {
    res.redirect('/');
  });

userRouter.get('/logout',cors.restrict, function(req, res) {
  // Destroys session on the server and
  // clears session cookie on client side
  // Using both logout and session.destroy for
  // Redundant safety and avoiding problems w async.
  req.logout();
  req.session.destroy(function() {
    res.clearCookie('connect.sid');
    res.redirect('/');
  });
});

userRouter.get('/ping', function(req, res){
  res.send("pong!", 200);
});

module.exports = userRouter;