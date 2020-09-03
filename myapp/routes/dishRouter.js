const express = require('express'); 
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const {addAsync} = require('@awaitjs/express');

//const cors = require('./cors');
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
.get((req,res,next) => {
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

    // input must always be in an array
    /*let respSuccess = '{';
    let respFail = '{'
    req.body.forEach((dish) => {
        Dishes.create(dish)
        .then((dish) => {
            respSuccess += '{"success":true, "dish":' + dish.toString() + '},';
            //remove comma for last obj
        }, (err) => {
            respFail += '{"success":false, "err"' + err.message
                + ', "dish":' + dish.toString() + '},';
        })
        .catch((err) => next(err));
    });
    console.log(respSuccess + '\n' + respFail);
    respSuccess[-1] = '}';
    respFail[-1] = '}';
    res.send(('{' + respSuccess + ',' + respFail + '}'));
    console.log('{' + respSuccess + ',' + respFail + '}');*/
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
    res.contentType('application/json');
    next();
})
.get((req,res,next) => {
    Dishes.findById(req.params.dishId)
    .populate('comments.author')
    .then((dish) => {
        if (!dish) { return next(new Error('There are no items!')) };
        res.json({success:true, dish})
    }, (err) => {next(err)} )
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
    .then((dish) => { 
        if (!dish) { return next(new Error('There are no items!')) };
        res.json({ success:true, dish }) 
    }, (err) => {
        res.json({success:false, error:err});
        next(err); })
    .catch((err) => next(err));
})
.delete((req, res, next) => {
    Dishes.findByIdAndDelete(req.params.dishId)
    .then((deleted) => { res.json({success:true, deleted}) } 
        , (err) => next(err) ) //formatting is weird
    .catch((err) => next(err));
});

//ALL COMMENTS
dishRouter.route('/:dishId/comments',)
.all((req,res,next) => {
    res.statusCode = 200;
    res.contentType('application/json');
    next();
})
.get((req,res,next) => {
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
.post(auth.verifyUser, (req, res, next) => {
    Dishes.findById(req.params.dishId)
    .then((dish) => { 
        if (!dish) { return next(new Error('There are no items!')) };
        req.body.author = req.user._id;
        dish.comments.push(req.body);
        dish.save()
        .then((dish) => { res.redirect('/dishes/'+req.params.dishId) } 
            ,(err) => next(err))
    }, (err) => next(err))
    .catch((err) => next(err));
    
    // Check if redirect works
    //Must verify user
})
.put((req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /dishes');
})
.delete((req, res, next) => {
    Dishes.findById(req.params.dishId)
    .then((dish) => { 
        if(!dish) { return next(new Error('There are no items!')) }
        for (let i = (dish.comments.length -1); i >= 0; i--) {
            dish.comments.id(dish.comments[i]._id).remove();
        }
        dish.save()
        .then((dish) => { res.json(dish); }
            , (err) => next(err));
    }, (err) => next(err) ) //formatting is weird
    .catch((err) => next(err));
});

//SPECIFIC COMMENTS
dishRouter.route('/:dishId/comments/:commentId',)
.all((req,res,next) => {
    res.statusCode = 200;
    res.contentType('application/json');
    next();
})
.get((req,res,next) => {
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
.post((req, res, next) => {
    res.statusCode = 403;
    res.end('Operation not supported on /dishes');
})
.put((req, res, next) => {
    Dishes.findById(req.params.dishId)
    .then((dish) => {
        if(!dish) { return next(new Error('There are no dishes!')) }
        if(!dish.comments.id(req.params.commentId)) { 
            return next(new Error('There are no comments!')) 
        }

        let commentId = req.params.commentId;
        let userRating = req.body.rating;
        let userComment = req.body.comment;
        if (userRating) { dish.comments.id(commentId).rating = userRating };
        if (userComment) { dish.comments.id(commentId).comment = userComment };
        dish.save()
        .then((dish) => { res.json({ success:true, dish }); }
            , (err) => next(err));

    }, (err) => next(err))
    .catch((err) => next(err)); 
})
.delete((req, res, next) => {
    Dishes.findById(req.params.dishId)
    .then((dish) => {
        if(!dish) { return next(new Error('There are no dishes!')) }
        if(!dish.comments.id(req.params.commentId)) { 
            return next(new Error('There are no comments!')) 
        }

        dish.comments.id(req.params.commentId).remove();
        dish.save()
        .then((dish) => { res.json({ success:true, dish }); }
            , (err) => next(err));
    } ,(err) => next(err))
    .catch((err) => next(err))
});

module.exports = dishRouter;