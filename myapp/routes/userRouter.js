const bodyParser = require('body-parser');
const mongoose = require('mongoose');
var passport = require('passport');
var User = require('../models/users');
const userRouter = require('express').Router();

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
.post(passport.authenticate('local'), function(req, res) {
    res.redirect('/');
});

userRouter.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});

userRouter.get('/ping', function(req, res){
    res.send("pong!", 200);
});


module.exports = userRouter;