const express = require('express');
const multer = require('multer');
const router = express.Router();
const path = require('path');
const Blog = require('../models/blog');
const Comment = require('../models/comment');

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

// Route to show add new blog form
router.get('/add-new', (req, res) => {
  return res.render('addBlog', {
    user: req.user
  });
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

module.exports = router;
