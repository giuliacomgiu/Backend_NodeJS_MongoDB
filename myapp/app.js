var createError = require('http-errors');
var express = require('express');
var path = require('path');
const cookieParser = require('cookie-parser');
const session = require('cookie-session');
var logger = require('morgan');
var passport = require('passport');

const auth = require('./auth');
const indexRouter = require('./routes/index');
const userRouter = require('./routes/userRouter');
const dishRouter = require('./routes/dishRouter');

// connecting to db
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/myapp', {useNewUrlParser: true});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {console.log('Connected to database')});


// creating app as express app
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
//app.use(session({secret:'Qu!cK Br0wN F0X'}));
app.use(express.static(path.join(__dirname, 'public')));

// Configure passport middleware
app.use(passport.initialize());
//app.use(passport.session());

// Routes
app.use('/', indexRouter);
app.use('/users', userRouter);
app.use('/dishes', dishRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
