const express = require('express'); 
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const cors = require('./cors');
const Dishes = require('../models/dishes');
var myErr = require('../error')
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
      return next(new myErr.NotFoundError('Dish'));
    };

    // HATEOAS compatibility
    let obj = {};
    obj.links = [];
    for (let dish of dishes){
      obj.links.push({href:`/${dish.id}`, rel:'dish', type:'GET'});
    };

    return res.json({success:true, links:obj.links, dishes:dishes});
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
      (dish) => {
        let obj = {};
        obj.links = [];
        obj.links.push({href:`/`, rel:'dishes', type:'GET'});
        obj.links.push({href:`/${dish.id}`, rel:'dish', type:'GET'});

        return res.json({success:true, links:obj.links, dish:dish})
      }, 
      (err) => next(err) )
    .catch((err) => next(err));
  }
)
.put(cors.restrict, 
  auth.verifyAuthentication, 
  auth.verifyAdmin, 
  (req, res, next) => 
  {
    return next(new myErr.ForbiddenMethodError('PUT'))
  }
)
.delete(cors.restrict, 
  auth.verifyAuthentication, 
  auth.verifyAdmin, 
  (req, res, next) => 
  {
    Dishes.deleteMany({})
    .then(
      (del) => {
        let links = {href:`/`, rel:'dishes', type:'GET'};
        return res.json({success:true, links:links, deleted:del})
      },
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
    let links = {href:`/`, rel:'dishes', type:'GET'};

    if (!dish) { 
      return next(new myErr.NotFoundError('Dish'));
    };
    return res.json({success:true, links:links, dish:dish})
  }, (err) => {next(err)} )
  .catch((err) => next(err));
})
.post(cors.restrict, 
  auth.verifyAuthentication, 
  auth.verifyAdmin, 
  (req, res, next) => 
  {
    return next(new myErr.ForbiddenMethodError('POST'))
  }
)
.put(cors.restrict,
  auth.verifyAuthentication, 
  auth.verifyAdmin, (req, res, next) => 
  {
    let links = {href:`/`, rel:'dishes', type:'GET'};
    Dishes.findByIdAndUpdate(req.params.dishId, 
      {$set: req.body}, 
      { new: true })
    .then((dish) => {
      if (!dish) { 
        return next(new myErr.NotFoundError('Dish')); 
      };
      
      return res.json({ success:true, links:links, dish:dish }) 
    }, (err) => next(err) )
    .catch((err) => next(err));
  }
)
.delete(cors.restrict,
  auth.verifyAuthentication, 
  auth.verifyAdmin, (req, res, next) => 
  {
    Dishes.findByIdAndDelete(req.params.dishId)
    .then(
      (del) => { 
        let links = {href:`/`, rel:'dishes', type:'GET'};
        return res.json({success:true, links:links, deleted:del})
       }, 
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
    if (!dish) {
      return next(new myErr.NotFoundError('Dish'));
    } else if (!dish.comments) {
      return next(new myErr.NotFoundError('Comment'));
    };

    let obj = {};
    obj.links = [];
    obj.links.push({href:`/`, rel:'dishes', type:'GET'});
    obj.links.push({href:`/${req.params.dishId}`, rel:'dish', type:'GET'});
    for (let comment of dish.comments){
      obj.links.push({href:`/${comment.id}`, rel:'dish-comment', type:'GET'});
    };

    return res.json({success:true, links:obj.links, comments:dish.comments});
  }, (err) => {next(err)} )
  .catch((err) => next(err));
})
.post(cors.restrict,
  auth.verifyAuthentication, 
  (req, res, next) => 
  {
    Dishes.findById(req.params.dishId)
    .then((dish) => { 
      if (!dish) { 
        return next(new myErr.NotFoundError('Dish')) 
      };
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
    return next(new myErr.ForbiddenMethodError('PUT'))
  }
)
.delete(cors.restrict,
  auth.verifyAuthentication, 
  auth.verifyAdmin, 
  (req, res, next) => 
  {
    Dishes.findById(req.params.dishId)
    .then((dish) => { 
      if(!dish) { 
        return next(new myErr.NotFoundError('Dish'));
      }
      for (let i = (dish.comments.length -1); i >= 0; i--) {
        dish.comments.id(dish.comments[i]._id).remove();
      }
      return dish.save();
    }, (err) => next(err) )
    .then((dish) => { 
      let obj = {};
      obj.links = [];
      obj.links.push({href:`/`, rel:'dishes', type:'GET'});
      obj.links.push({href:`/${req.params.dishId}`, rel:'dish', type:'GET'});
      return res.json({success:true, links:obj.links, dish:dish});
    }, (err) => next(err))
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
    if(!dish) { 
      return next(new myErr.NotFoundError('Dish'));
    }
    if(!dish.comments.id(req.params.commentId)) { 
      return next(new myErr.NotFoundError('Comment'));
    } else {
      let comment = dish.comments.id(req.params.commentId);
      let obj = {};
      obj.links = [];
      obj.links.push({href:`/`, rel:'dishes', type:'GET'});
      obj.links.push({href:`/${req.params.dishId}`, rel:'dish', type:'GET'});
      obj.links.push({href:`/${req.params.dishId}/comments`, rel:'dish-comment', type:'GET'});
      return res.json({success:true, links:obj.links, comment:comment})
    }
  }, (err) => next(err))
  .catch((err) => next(err));
})
.post(cors.restrict, 
  auth.verifyAuthentication, 
  auth.verifyAdmin, 
  (req, res, next) => 
  {
    return next(new myErr.ForbiddenMethodError('POST'))
  }
)
.put(cors.restrict,
  auth.verifyAuthentication, 
  (req, res, next) => 
  {
    Dishes.findById(req.params.dishId)
    .then((dish) => {
      if(!dish) { 
        return next(new myErr.NotFoundError('Dish'));
      }

      let commentDB = dish.comments.id(req.params.commentId);
      if(!commentDB) { 
        return next(new myErr.NotFoundError('Comment'));
      }

      // Checking if comment author and user match
      // Will call error handler if they don't
      auth.matchUser(commentDB.author._id, req.user._id,next);

      // This will only be executed if users match
      if (userRating) { commentDB.rating = req.body.rating };
      if (userComment) { commentDB.comment = req.body.comment };
      return dish.save()
    }, (err) => next(err))
    .then((dish) => { 
      let obj = {};
      obj.links = [];
      obj.links.push({href:`/`, rel:'dishes', type:'GET'});
      obj.links.push({href:`/${req.params.dishId}`, rel:'dish', type:'GET'});
      obj.links.push({href:`/${req.params.dishId}/comments`, rel:'dish-comment', type:'GET'});
      return res.json({success:true, links:obj.links, comment:dish.comments.id(req.params.commentId)})
    }, 
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
      if(!dish) {
        return next(new myErr.NotFoundError('Dish'));
      }

      let commentDB = dish.comments.id(req.params.commentId);
      if(!commentDB) { 
        return next(new myErr.NotFoundError('Dish'));
      }

      // Check if logged in user and author match
      // Will call error handler if they don't
      auth.matchUser(commentDB.author._id, req.user._id);

      //This will only be executed if users match
      dish.comments.id(req.params.commentId).remove();
      return dish.save();
    } ,(err) => next(err))
    .then((dish) => { 
      let obj = {};
      obj.links = [];
      obj.links.push({href:`/`, rel:'dishes', type:'GET'});
      obj.links.push({href:`/${req.params.dishId}`, rel:'dish', type:'GET'});
      obj.links.push({href:`/${req.params.dishId}/comments`, rel:'dish-comment', type:'GET'});
      return res.json({success:true, links:obj.links, dish:dish})
    }
      , (err) => next(err))
    .catch((err) => next(err))
  }
);

module.exports = dishRouter;