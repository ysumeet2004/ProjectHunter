const express = require('express');
const userRouter = express.Router();
const {userSignupHandler,loginHandler} = require('../controllers/user')

userRouter.get('/login',(req,res)=>{
    res.render('login');
})
userRouter.get('/signup',(req,res)=>{
    res.render('signup');
});
userRouter.post('/signup',userSignupHandler);
userRouter.post('/login',loginHandler);
module.exports = userRouter;