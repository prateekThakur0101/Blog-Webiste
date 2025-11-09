const express = require('express');
const multer = require('multer');
const router = express.Router();
const path = require('path');
const Blog = require('../models/blog');
const Comment = require('../models/comment');
const fs = require('fs');

// Multer storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.resolve('./public/uploads/')); // Upload folder
  },
  filename: function (req, file, cb) {
    const fileName = `${Date.now()}-${file.originalname}`;
    cb(null, fileName);
  }
});

const upload = multer({ storage });

// Route to show all user's blogs
router.get('/my-blogs', async (req, res) => {
  if (!req.user) {
    return res.redirect('/user/signin');
  }
  try {
    const userBlogs = await Blog.find({ createdBy: req.user._id }).sort({ createdAt: -1 });
    return res.render('myBlogs', {
      user: req.user,
      blogs: userBlogs
    });
  } catch (error) {
    console.error('Error loading user blogs:', error);
    return res.status(500).send('Internal Server Error');
  }
});

// Route to show add new blog form
router.get('/add-new', (req, res) => {
  return res.render('addBlog', {
    user: req.user
  });
});

// Route to show edit blog form
router.get('/edit/:id', async (req, res) => {
  if (!req.user) {
    return res.redirect('/user/signin');
  }
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).send('Blog not found');
    }
    // Check if the user is the author of the blog
    if (blog.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).send('Unauthorized');
    }
    return res.render('editBlog', {
      user: req.user,
      blog
    });
  } catch (error) {
    console.error('Error loading blog for edit:', error);
    return res.status(500).send('Internal Server Error');
  }
});

// Route to show a blog by ID (with populated author data)
router.get('/:id', async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).populate('createdBy');
    // console.log(blog);
    const comments = await Comment.find({blogId: req.params.id}).populate('createdBy')
    if (!blog) {
      return res.status(404).send('Blog not found');
    }

    return res.render('blog', {
      user: req.user,
      blog,
      comments
    });
  } catch (error) {
    console.error('Error loading blog:', error);
    return res.status(500).send('Internal Server Error');
  }
});

router.post('/comment/:blogId',async(req,res)=>{
  await Comment.create({
    content: req.body.content,
    blogId: req.params.blogId,
    createdBy: req.user._id,
  });
  return res.redirect(`/blog/${req.params.blogId}`)
})

// Route to like/unlike a comment
router.post('/comment/:commentId/like', async(req, res)=>{
  if (!req.user) {
    return res.status(401).json({ error: 'Please sign in to like comments' });
  }
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    const userIndex = comment.likes.indexOf(req.user._id);
    
    if (userIndex === -1) {
      // User hasn't liked the comment, so add like
      comment.likes.push(req.user._id);
    } else {
      // User already liked the comment, so remove like
      comment.likes.splice(userIndex, 1);
    }
    
    await comment.save();
    
    return res.json({ 
      success: true, 
      likes: comment.likes.length,
      liked: userIndex === -1
    });
  } catch (error) {
    console.error('Error liking comment:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
})


// Route to create new blog post
router.post('/', upload.single('coverImage'), async (req, res) => {
  try {
    const { title, body } = req.body; 

    const blog = await Blog.create({
      title,
      body,
      createdBy: req.user._id,
      coverImageUrl: `/uploads/${req.file.filename}`
    });

    return res.redirect(`/blog/${blog._id}`);
  } catch (error) {
    console.error('Error creating blog:', error);
    return res.status(500).send('Internal Server Error');
  }
});

// Route to update blog post
router.post('/edit/:id', upload.single('coverImage'), async (req, res) => {
  if (!req.user) {
    return res.redirect('/user/signin');
  }
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).send('Blog not found');
    }
    // Check if the user is the author of the blog
    if (blog.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).send('Unauthorized');
    }

    const { title, body } = req.body;
    blog.title = title;
    blog.body = body;

    // If a new cover image is uploaded, update it and delete the old one
    if (req.file) {
      // Delete old image if it exists
      if (blog.coverImageUrl) {
        const oldImagePath = path.resolve('./public' + blog.coverImageUrl);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      blog.coverImageUrl = `/uploads/${req.file.filename}`;
    }

    await blog.save();
    return res.redirect(`/blog/${blog._id}`);
  } catch (error) {
    console.error('Error updating blog:', error);
    return res.status(500).send('Internal Server Error');
  }
});

// Route to delete blog post
router.post('/delete/:id', async (req, res) => {
  if (!req.user) {
    return res.redirect('/user/signin');
  }
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).send('Blog not found');
    }
    // Check if the user is the author of the blog
    if (blog.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).send('Unauthorized');
    }

    // Delete the cover image file if it exists
    if (blog.coverImageUrl) {
      const imagePath = path.resolve('./public' + blog.coverImageUrl);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    // Delete all comments associated with the blog
    await Comment.deleteMany({ blogId: req.params.id });

    // Delete the blog
    await Blog.findByIdAndDelete(req.params.id);

    return res.redirect('/blog/my-blogs');
  } catch (error) {
    console.error('Error deleting blog:', error);
    return res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
