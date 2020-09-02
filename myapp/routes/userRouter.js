const bodyParser = require('body-parser');
const mongoose = require('mongoose');
var passport = require('passport');
var User = require('../models/users');
var auth = require('../auth');
var userRouter = require('express').Router();

//Adjusting to MongoDB + NodeJS updates
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useUnifiedTopology', true);
mongoose.set('useCreateIndex', true);


userRouter.use(bodyParser.json());

userRouter.route('/')
.all((req, res, next) => {
    res.statusCode = 200;
    res.contentType('application/json');
    next();
})
.get((req, res) => {
    res.json({ success: true, message:"Will send al users"});
//    res.render('index', { user : req.user });
});

userRouter.route('/register')
.all((req, res, next) => {
    res.statusCode = 200;
    res.contentType('application/json');
    next()
})
.get((req, res, next) => {
    res.json({ success: true, message:"Will send registration page"});
})
.post((req, res, next) => {
    User.register(new User({ username : req.body.username , 
    firstname:req.body.firstname, lastname: req.body.lastname,
    birthdate: req.body.birthdate}), 
    req.body.password, (err, user) => {
        if (err) {
            res.statusCode = 500;
            return res.json({success:false, error:err.message});
        }
        passport.authenticate('local')(req, res, () => {
            res.redirect('/');
        });
    });
});

userRouter.route('/login')
.all((req, res, next) => {
    res.statusCode = 200;
    res.contentType('application/json');
    next()
})
.get(function(req, res) {
    res.render('login', { user : req.user });
})
.post(function(req, res, next) {
    passport.authenticate('local', (err, user, info) => {
        if(err) return next(err);
        if(!user){
            res.statusCode = 401;
            return res.json({success: false, status: 'JWT invalid', err: info});
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

userRouter.get('/checkToken', function(req, res) {
    passport.authenticate('jwt', {session: false}, (err, user, info) => {
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

userRouter.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});

userRouter.get('/ping', function(req, res){
    res.send("pong!", 200);
});


module.exports = userRouter;