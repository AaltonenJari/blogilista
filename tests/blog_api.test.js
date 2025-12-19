const assert = require('node:assert')
const { test, after, beforeEach, describe } = require('node:test')
const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const helper = require('./test_helper')
const Blog = require('../models/blog')
const { log } = require('node:console')

const api = supertest(app)

describe('when there is initially some blogs saved', () => {
  beforeEach(async () => {
    await Blog.deleteMany({})
    
    const blogObjects = helper.initialBlogss.map(blog => new Blog(blog))
    const promiseArray = blogObjects.map(blog => blog.save())
    await Promise.all(promiseArray)
  })

  test('blogs are returned as json', async () => {
    await api
      .get('/api/blogs')
      .expect(200)
      .expect('Content-Type', /application\/json/)
  })

  test('all blogs are returned', async () => {
    const response = await api.get('/api/blogs')

    assert.strictEqual(response.body.length, helper.initialBlogss.length)
  })

  test('a specific blog is within the returned blogs', async () => {
    const response = await api.get('/api/blogs')

    const titles = response.body.map(e => e.title)
    assert(titles.includes('Mitä opin Osaamismarkkinoilta'))
  })

  test('blog identifier is named id', async () => {
    const response = await api.get('/api/blogs')

    const blog = response.body[0]
    assert.ok(blog.id)
  })

  describe('addition of a new blog', () => {
    test('a valid blog can be added ', async () => {
      const newBlog = {
        title: "Tekoälyä vai ei älyä? – Kuinka tekoäly muokkaa inhimillistä johtamista?",
        author: "Heljä Laitinen",
        url: "https://piilo-osaajat.com/2025/01/10/kuinka-tekoaly-muokkaa-inhimillista-johtamista/",
        likes: 5
      }

      await api
        .post('/api/blogs')
        .send(newBlog)
        .expect(201)
        .expect('Content-Type', /application\/json/)

      const blogsAtEnd = await helper.blogsInDb()
      assert.strictEqual(blogsAtEnd.length, helper.initialBlogss.length + 1)

      const contents = blogsAtEnd.map(n => n.title)

      assert(contents.includes('Tekoälyä vai ei älyä? – Kuinka tekoäly muokkaa inhimillistä johtamista?'))
    })

    test('blog without title and url is not added', async () => {
      const newBlog = {
        author: "Jari Aaltonen"
      }

      await api
        .post('/api/blogs')
        .send(newBlog)
        .expect(400)

      const blogsAtEnd = await helper.blogsInDb()
      assert.strictEqual(blogsAtEnd.length, helper.initialBlogss.length)
    })

    test ('if likes property is missing, it will default to zero', async () => {
      const newBlog = {
        title: "Tekoäly työnhaussa: Hakemuksen laatiminen",
        author: "Jari Aaltonen",
        url: "https://piilo-osaajat.com/2024/11/28/tekoaly-tyonhaussa-hakemuksen-laatiminen/"
      }

      await api
        .post('/api/blogs')
        .send(newBlog)
        .expect(201)
        .expect('Content-Type', /application\/json/)

      const blogsAtEnd = await helper.blogsInDb()
      const blog = blogsAtEnd.find(b => b.title === "Tekoäly työnhaussa: Hakemuksen laatiminen")
      assert.strictEqual(blog.likes, 0)
    })
  })
  
  describe('deletion of a blog', () => {
    test('a blog can be deleted', async () => {
      const blogsAtStart = await helper.blogsInDb()
      const blogToDelete = blogsAtStart[0]

      await api
        .delete(`/api/blogs/${blogToDelete.id}`)
        .expect(204)

      const blogsAtEnd = await helper.blogsInDb()

      const contents = blogsAtEnd.map(n => n.title)
      assert(!contents.includes(blogToDelete.title))

      assert.strictEqual(blogsAtEnd.length, helper.initialBlogss.length - 1)
    })
  })
})

after(async () => {
  await mongoose.connection.close()
})