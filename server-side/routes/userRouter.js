const bodyParser = require('body-parser');
const mongoose = require('mongoose');
var userRouter = require('express').Router();
var https = require('https');
const url = require('url');
const cors = require('./cors');
var User = require('../models/users');
var auth = require('../auth');

//Adjusting to MongoDB + NodeJS updates
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useUnifiedTopology', true);
mongoose.set('useCreateIndex', true);


userRouter.use(bodyParser.json());

userRouter.route('/')
.all((req, res, next) => {
    res.statusCode = 200;
    next();
})
.get(cors.restrict, 
    auth.verifyAuthentication, 
    auth.verifyAdmin,
    (req, res, next) => 
    {
        res.contentType('application/json');
        res.json({ success: true, message:"Will send all users"});
//    res.render('index', { user : req.user });
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
        res.json({ success: true, message:"Will send registration page"}); 
    }
)
.post(cors.restrict, (req, res, next) => {
    User.register(new User({ username : req.body.username , 
    firstname:req.body.firstname, lastname: req.body.lastname,
    birthdate: req.body.birthdate}), 
    req.body.password, (err, user) => {
        if (err) {
            res.statusCode = 500;
            return res.json({success:false, error:err.message});
        }
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
            res.statusCode = 401;
            return res.json({success: false, status: 'Unauthorized', err: info});
        };

        req.logIn(user, function(err){
            if(err) {
                res.statusCode = 401;
                return res.json({success: false, status: 'Couldnt login', 
                    err: err.message});
            };
        });

        var token = auth.getToken({_id: req.user._id});
        res.json({success: true, status: 'Login Successful!', token: token});
    })(req,res,next);
});

// Check JWT Token
userRouter.get('/checkToken', cors.restrict, function(req, res) {
    auth.passport.authenticate('jwt', {session: false}, (err, user, info) => {
        if (err) return next(err);
        if(!user) {
            res.statusCode = 401;
            res.contentType('application/json');
            return res.json({success:false, status:'You are not authenticated', error:info});
        } else {
            res.statusCode = 200;
            res.contentType('application/json');
            return res.json({success:true, status: 'You are authenticated.', user:user})
        }
    })(req, res);
});

// Google authorization redirect
userRouter.get('/google', 
    cors.restrict, 
    auth.passport.authenticate('google', { scope: ['profile'] }));

// Google callback function. Uses sessions.
userRouter.get('/google/callback',
    cors.restrict, 
    auth.passport.authenticate('google', 
    { failureRedirect: `${process.env.APP_URI_SSL}/users/login` }),
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
        return res.json({success: true, token: token, status: 'You are successfully logged in!'});
    } else {
        res.statusCode = 401
        return res.redirect(`${process.env.APP_URI_SSL}/users/login`);
    }
});

// Facebook redirect
userRouter.get('/facebook', cors.cors, auth.passport.authenticate('facebook') );

// Facebook session login
userRouter.get('/facebook/callback',
    cors.cors,  
    auth.passport.authenticate('facebook', 
    { failureRedirect: `${process.env.APP_URI_SSL}/users/login` }),
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
/*
// Google Token Callback url
userRouter.post('/google/token/', (req, res, next) => {
    async function authorizing(){
        try {
            const code = req.body.idtoken
            if (*//*req.hasHeader('X-Requested-With') && *//*code){
                // acquire the code from the querystring, and close the web server.
                console.log(`Code is ${code}`);
                res.end('Authentication successful! Please return to the console.');

                // Now that we have the code, use that to acquire tokens.
                const r = await oAuth2Client.getToken(code);
                // Make sure to set the credentials on the OAuth2 client.
                oAuth2Client.setCredentials(r.tokens);
                console.log('Tokens acquired.');
                if(r.tokens.refresh_token) console.log(`Refresh: ${r.tokens.refresh_token}`)
            }
        } catch (e) {
            next(e);
        }
    }
    authorizing();
})*/

module.exports = userRouter;