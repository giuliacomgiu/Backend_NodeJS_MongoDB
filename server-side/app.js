var createError = require('http-errors');
var express = require('express');
var path = require('path');
const cookieParser = require('cookie-parser');
//const session = require('cookie-session');
var logger = require('morgan');
const mongoose = require('mongoose');

var auth = require('./auth');
const cors = require('./routes/cors');
const indexRouter = require('./routes/index');
const userRouter = require('./routes/userRouter');
const dishRouter = require('./routes/dishRouter');
const myErr = require('./error');

// connecting to db
mongoose.connect(process.env.MONGO_URI, {useNewUrlParser: true});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {console.log('Connected to database')});


// creating app as express app
var app = express();

// SSL redirect
app.all('*', (req, res, next) => {
  if (req.secure) {
      return next();
  }
  else {
      res.redirect(307, 'https://' + req.hostname + ':' + app.get('secPort') + req.url);
  }
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
//app.use(session({secret: process.env.SECRET_KEY}));
app.use(require('express-session')({secret: process.env.SECRET_KEY}))
app.use(auth.passport.initialize());
app.use(auth.passport.session());
app.use(express.static(path.join(__dirname, 'public')));

// Enabling CORS preflight
app.options('*', cors.restrict);

// Routes
app.use('/', indexRouter);
app.use('/users', userRouter);
app.use('/dishes', dishRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

//error preparation
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  next(err);
});

// database error handler
app.use(function databaseHandler(err, req, res, next) {
  if (err instanceof mongoose.Error ||
      err instanceof myErr.NotFoundError ||
      err instanceof myErr.UnauthOperationError ||
      err instanceof myErr.AuthenticationError ||
      err instanceof myErr.CORSError) 
      {
        return res.status(err.status || 503).json({
          success: false,
          type: err.type,
          name: err.name,
          error: err.message
        });
      };
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // render the error page
  res.status(err.status || 500);
  res.json({
    success:false, 
    type: err.type, 
    name: err.name, 
    error:err.message})
});

module.exports = app;
