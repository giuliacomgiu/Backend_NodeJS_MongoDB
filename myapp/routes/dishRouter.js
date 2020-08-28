const express = require('express'); 
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const {addAsync} = require('@awaitjs/express');

//const cors = require('./cors');
const Dishes = require('../models/dishes');
//var auth = require('../authenticate');

//Adjusting to MongoDB + NodeJS updates
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useUnifiedTopology', true);
mongoose.set('useCreateIndex', true);

const dishRouter = express.Router();

dishRouter.use(bodyParser.json());

//ALL DISHES
dishRouter.route('/',)
.all((req,res,next) => {
    res.statusCode = 200;
    res.contentType('application/json');
    next();
})
.get((req,res,next) => {
    Dishes.find(req.query)
    .populate('comments')
    .then((dishes) => {res.json({success:true, dishes})}
        , (err) => {next(err)} )
    .catch((err) => next(err));
})
.post((req, res, next) => {

    // input must always be in an array
    // CHECK HERE! When err in array, res.json gets only false response
    req.body.forEach((dish) => {
        Dishes.create(dish)
        .then((dish) => {res.json({success: true, dish})}
            ,(err) => {
                res.json({success: false, dish:dish});
                next(err);
            })
        .catch((err) => {});
    });
})
.put((req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /dishes');
})
.delete((req, res, next) => {
    Dishes.deleteMany({})
    .then((deleted) => {res.json({success:true, deleted})}
        , (err) => next(err))
    .catch((err) => next(err));
});

//SPECIFIC DISH
dishRouter.route('/:dishId',)
.all((req,res,next) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    next();
})
.get((req,res,next) => {
    Dishes.findById(req.params.dishId)
    .populate('comments')
    .then((dish) => {res.json({success:true, dish})}
        , (err) => {next(err)} )
    .catch((err) => next(err));
})
.post((req, res, next) => {
    res.statusCode = 403;
    res.end('Operation not supported');
})
.put((req, res, next) => {
    Dishes.findByIdAndUpdate(req.params.dishId
        , {$set: req.body}
        , { new: true })
    .then((dish) => { res.json({ success:true, dish }) }
        , (err) => { next(err) })
    .catch((err) => next(err));
})
.delete((req, res, next) => {
    Dishes.findByIdAndDelete(req.params.dishId)
    .then((deleted) => { res.json({success:true, deleted}) } 
        , (err) => {
            res.json({success:false, error: err})
            next(err)} ) //formatting is weird
    .catch((err) => next(err));
});

//ALL COMMENTS
dishRouter.route('/:dishId/comments',)
.all((req,res,next) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    next();
})
.get((req,res,next) => {
    Dishes.findById(req.params.dishId)
    .populate('comments')
    .then((dish) => {res.json(dish.comments)}
        , (err) => {next(err)} )
    .catch((err) => next(err));
})
.post((req, res, next) => {
    res.end('Will add the comment: ' + req.body.comment + 
    ' with rating: ' + req.body.rating);
})
.put((req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /dishes');
})
.delete((req, res, next) => {
    res.end('Deleting all dishes');
});

//SPECIFIC COMMENTS
dishRouter.route('/:dishId/comments/:commentId',)
.all((req,res,next) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    next();
})
.get((req,res,next) => {
    res.end('Will send it to you!');
})
.post((req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /dishes');
})
.put((req, res, next) => {
    res.end('Will update the comment: ' + req.body.comment + 
    ' and rating: ' + req.body.rating);
})
.delete((req, res, next) => {
    res.end('Deleting all dishes');
});

module.exports = dishRouter;