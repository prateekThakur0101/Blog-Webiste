const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const { checkForAuthenticationCookie } = require('./middlewares/authentication');
const Blog = require('./models/blog');

const userRoutes = require('./routes/user');
const blogRoute = require('./routes/blog');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/blogify').then(() =>{
  console.log('Connected to MongoDB');
  }).catch(err => {
  console.error('Error connecting to MongoDB:', err);
  });

const app = express();
const PORT = 8000;

// Setting up the Ejs.
app.set('view engine', 'ejs');
app.set('views', path.resolve('./views'));

// Middleware:-
app.use( express.json());
app.use( express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(checkForAuthenticationCookie('token'));
app.use(express.static(path.resolve('./public')));



app.get('/', async(req,res)=>{
  const allBlogs = await Blog.find({});
  res.render("home",{
    user: req.user,
    blogs: allBlogs
  });
})

app.use('/user', userRoutes);
app.use('/blog', blogRoute);

app.listen(PORT, ()=>{
  console.log(`Server is running on http://localhost:${PORT}`);
})