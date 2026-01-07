const blogsRouter = require('express').Router()
const Blog = require('../models/blog')
const User = require('../models/user')
const jwt = require('jsonwebtoken')
const { userExtractor } = require('../utils/middleware')

blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog
    .find({}).populate('user', { username: 1, name: 1 })

  response.json(blogs)
})


blogsRouter.post('/', userExtractor, async (request, response) => {
  const body = request.body
  const user = request.user

  const blog = new Blog({
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes || 0,
    user: user._id
  }) 

  const savedBlog = await blog.save()

  user.blogs = user.blogs.concat(savedBlog._id)
  await user.save()

  const populatedBlog = await savedBlog.populate('user', {
    name: 1,
    username: 1
  })
  
  response.status(201).json(populatedBlog)
})

blogsRouter.delete('/:id', userExtractor, async (request, response ) => {
  const blog =  await Blog.findById(request.params.id)

  if (!blog) {
    return response.status(404).end()
  }

  // get user from request object
  const user = request.user

  if (blog.user.toString() !== user.id.toString()) {
    return response.status(401).json({ error: 'only the creator can delete a blog' })
  }

  await Blog.findByIdAndDelete(request.params.id)
  response.status(204).end()
})

blogsRouter.put('/:id', userExtractor, async (request, response) => {
  const { title, author, url, likes } = request.body
  const user = request.user

  const updatedBlog = await Blog
    .findByIdAndUpdate(
      request.params.id,
      {
        title,
        author,
        url,
        likes,
        user: user.id
      },
      { new: true, runValidators: true }
    )
    .populate('user', { name: 1, username: 1 })

  if (!updatedBlog) {
    return response.status(404).end()
  }

  response.json(updatedBlog)
})

module.exports = blogsRouter