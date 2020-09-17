const express = require('express'); 
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const {addAsync} = require('@awaitjs/express');

const cors = require('./cors');
const Dishes = require('../models/dishes');
var auth = require('../auth');

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
.get(cors.cors, (req,res,next) => {
  Dishes.find(req.query)
  .populate('comments.author')
  .then((dishes) => {
    //dishes can be null or []
    if (!dishes || dishes.length < 3) { 
      return next(new Error('Nothing to see here')) 
    };
    res.json({success:true, dishes});
  }, (err) => {next(err)} )
  .catch((err) => next(err));
})
.post(cors.restrict, 
  auth.verifyAuthentication, 
  auth.verifyAdmin, 
  (req, res, next) => 
  {
    Dishes.create(req.body)
    .then(
      (dish) => {res.json({success:true, dish:dish})}, 
      (err) => next(err) )
    .catch((err) => {
      res.json({success: false, dish:dish});
      return next(err);
    });
  }
)
.put(cors.restrict, 
  auth.verifyAuthentication, 
  auth.verifyAdmin, 
  (req, res, next) => 
  {
    res.statusCode = 403;
    res.end('PUT operation not supported on /dishes');
  }
)
.delete(cors.restrict, 
  auth.verifyAuthentication, 
  auth.verifyAdmin, 
  (req, res, next) => 
  {
    Dishes.deleteMany({})
    .then(
      (deleted) => {res.json({success:true, deleted})},
      (err) => { next(err) })
    .catch((err) => next(err));
  }
);

//SPECIFIC DISH
dishRouter.route('/:dishId',)
.all((req,res,next) => {
  res.statusCode = 200;
  res.contentType('application/json');
  next();
})
.get(cors.cors, (req,res,next) => {
  Dishes.findById(req.params.dishId)
  .populate('comments.author')
  .then((dish) => {
    if (!dish) { return next(new Error('There are no items!')) };
    return res.json({success:true, dish})
  }, (err) => {next(err)} )
  .catch((err) => next(err));
})
.post(cors.restrict, 
  auth.verifyAuthentication, 
  auth.verifyAdmin, 
  (req, res, next) => 
  {
    res.statusCode = 403;
    res.end('Operation not supported');
  }
)
.put(cors.restrict,
  auth.verifyAuthentication, 
  auth.verifyAdmin, (req, res, next) => 
  {
    Dishes.findByIdAndUpdate(req.params.dishId, 
      {$set: req.body}, 
      { new: true })
    .then((dish) => { 
      if (!dish) { return next(new Error('There are no items!')) };
      res.json({ success:true, dish }) 
    }, (err) => {
      res.json({success:false, error:err});
      next(err); })
    .catch((err) => next(err));
  }
)
.delete(cors.restrict,
  auth.verifyAuthentication, 
  auth.verifyAdmin, (req, res, next) => 
  {
    Dishes.findByIdAndDelete(req.params.dishId)
    .then(
      (deleted) => { res.json({success:true, deleted}) }, 
      (err) => next(err) )
    .catch((err) => next(err));
  }
);

//ALL COMMENTS
dishRouter.route('/:dishId/comments',)
.all((req,res,next) => {
  res.statusCode = 200;
  res.contentType('application/json');
  next();
})
.get(cors.cors, (req,res,next) => {
  Dishes.findById(req.params.dishId)
  .populate('comments.author')
  .then((dish) => {
    if (!dish || !dish.comments) { 
      return next(new Error('There are no items!')) 
    };
    res.json(dish.comments);
  }, (err) => {next(err)} )
  .catch((err) => next(err));
})
.post(cors.restrict,
  auth.verifyAuthentication, 
  (req, res, next) => 
  {
    /*Dishes.findById(req.params.dishId)
    .then((dish) => { 
      if (!dish) { return next(new Error('There are no items!')) };
      req.body.author = req.user._id;
      dish.comments.push(req.body);
      dish.save()
      .then((dish) => { res.redirect('/dishes/'+req.params.dishId) } 
        ,(err) => next(err))
    }, (err) => next(err))
    .catch((err) => next(err));*/

    Dishes.findById(req.params.dishId)
    .then((dish) => { 
      if (!dish) { return next(new Error('There are no items!')) };
      req.body.author = req.user._id;
      dish.comments.push(req.body);
      return dish.save();
    }, (err) => next(err))
    .then((dish) => { res.redirect('/dishes/'+req.params.dishId) },
      (err) => next(err))
    .catch((err) => next(err));
  }
)
.put(cors.restrict, 
  auth.verifyAuthentication, 
  auth.verifyAdmin, 
  (req, res, next) => 
  {
    res.statusCode = 403;
    res.end('PUT operation not supported on /dishes');
  }
)
.delete(cors.restrict,
  auth.verifyAuthentication, 
  auth.verifyAdmin, 
  (req, res, next) => 
  {
    Dishes.findById(req.params.dishId)
    .then((dish) => { 
      if(!dish) { return next(new Error('There are no items!')) }
      for (let i = (dish.comments.length -1); i >= 0; i--) {
        dish.comments.id(dish.comments[i]._id).remove();
      }
      return dish.save();
    }, (err) => next(err) )
    .then((dish) => { res.json(dish); }, (err) => next(err))
    .catch((err) => next(err));
  }
);

//SPECIFIC COMMENTS
dishRouter.route('/:dishId/comments/:commentId',)
.all((req,res,next) => {
  res.statusCode = 200;
  res.contentType('application/json');
  next();
})
.get(cors.cors, (req,res,next) => {
  Dishes.findById(req.params.dishId)
  .populate('comments.author')
  .then(dish => {
    if(!dish) { return next(new Error('There are no dishes!')) }
    if(!dish.comments.id(req.params.commentId)) { 
      return next(new Error('There are no comments!')) 
    } else {
      res.json(dish.comments.id(req.params.commentId));
    }
  }, (err) => next(err))
  .catch((err) => next(err));
})
.post(cors.restrict, 
  auth.verifyAuthentication, 
  auth.verifyAdmin, 
  (req, res, next) => 
  {
    res.statusCode = 403;
    res.end('Operation not supported on /dishes');
  }
)
.put(cors.restrict,
  auth.verifyAuthentication, 
  (req, res, next) => 
  {
    Dishes.findById(req.params.dishId)
    .then((dish) => {
      if(!dish) { return next(new Error('There are no dishes!')) }
      if(!dish.comments.id(req.params.commentId)) { 
        return next(new Error('There are no comments!')) 
      }
      err = auth.matchUser(dish.comments.id(req.params.commentId).author._id, req.user._id);
      if(err) { return next(err) };

      let commentId = req.params.commentId;
      let userRating = req.body.rating;
      let userComment = req.body.comment;
      if (userRating) { dish.comments.id(commentId).rating = userRating };
      if (userComment) { dish.comments.id(commentId).comment = userComment };
      return dish.save()
    }, (err) => next(err))
    .then((dish) => { res.json({ success:true, dish }); }, 
      (err) => next(err))
    .catch((err) => next(err)); 
  }
)
.delete(cors.restrict, 
  auth.verifyAuthentication, 
  (req, res, next) => 
  {
    Dishes.findById(req.params.dishId)
    .then((dish) => {
      if(!dish) { return next(new Error('There are no dishes!')) }
      if(!dish.comments.id(req.params.commentId)) { 
        return next(new Error('There are no comments!')) 
      }
      err = auth.matchUser(dish.comments.id(req.params.commentId).author._id, req.user._id);
      if(err) { return next(err) };

      dish.comments.id(req.params.commentId).remove();
      return dish.save();
    } ,(err) => next(err))
    .then((dish) => { res.json({ success:true, dish }); }
      , (err) => next(err))
    .catch((err) => next(err))
  }
);

module.exports = dishRouter;