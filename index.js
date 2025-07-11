const express = require('express');
const path = require('path');
const connectionHandler = require('./connection');
const app = express();
const verifyToken = require('./middlewares/auth');
const projectRouter = require('./routes/project')
const userRouter = require('./routes/user');
const cookieParser = require('cookie-parser');
const PORT = 8000;

app.set('view engine','ejs');
app.set('views',path.resolve('./views'));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// app.use(verifyToken);

app.listen(PORT,()=>{console.log(`[✅] server success`)});
connectionHandler();

//home route
app.get('/',verifyToken,(req,res)=>{
    res.render('home');
});
app.get('/user/logout', (req, res) => {
  res.clearCookie('token',{
    httpOnly:true,
  }); // Removes the JWT cookie
  res.redirect('/user/login'); // Redirect to login page
});

//
app.use('/project',verifyToken,projectRouter);
app.use('/user',userRouter);