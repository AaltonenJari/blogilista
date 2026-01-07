const assert = require('node:assert')
const { test, after, beforeEach, describe } = require('node:test')
const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const helper = require('./test_helper')
const Blog = require('../models/blog')
const { log } = require('node:console')
const User = require('../models/user')

const api = supertest(app)

describe('when there is initially some blogs saved', () => {
  beforeEach(async () => {
    await Blog.deleteMany({})
    await User.deleteMany({})
    
    await api.post('/api/users').send(helper.initialUser)

    const newUser = {
      username: 'mluukkai',
      name: 'Matti Luukkainen',
      password: 'salainen',
    }

    await api
      .post('/api/users')
      .send(newUser)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const loginRes = await api
      .post('/api/login')
      .send({
        username: 'testuser',
        password: 'sekret'
      })
    token = `Bearer ${loginRes.body.token}`

    await api
        .post('/api/blogs')
        .set('Authorization', token)
        .send(helper.initialBlogss[0])
        .expect(201)
        .expect('Content-Type', /application\/json/)

    await api
        .post('/api/blogs')
        .set('Authorization', token)
        .send(helper.initialBlogss[1])
        .expect(201)
        .expect('Content-Type', /application\/json/)
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
    test.only('a valid blog can be added ', async () => {
      const newBlog = {
        title: "Tekoälyä vai ei älyä? – Kuinka tekoäly muokkaa inhimillistä johtamista?",
        author: "Heljä Laitinen",
        url: "https://piilo-osaajat.com/2025/01/10/kuinka-tekoaly-muokkaa-inhimillista-johtamista/",
        likes: 5
      }

      await api
        .post('/api/blogs')
        .set('Authorization', token)
        .send(newBlog)
        .expect(201)
        .expect('Content-Type', /application\/json/)

      const blogsAtEnd = await helper.blogsInDb()
      assert.strictEqual(blogsAtEnd.length, helper.initialBlogss.length + 1)

      const titles = blogsAtEnd.map(b => b.title)

      assert(titles.includes('Tekoälyä vai ei älyä? – Kuinka tekoäly muokkaa inhimillistä johtamista?'))
    })

    test('blog without title and url is not added', async () => {
      const newBlog = {
        author: "Jari Aaltonen"
      }

      await api
        .post('/api/blogs')
        .set('Authorization', token)
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
        .set('Authorization', token)
        .send(newBlog)
        .expect(201)
        .expect('Content-Type', /application\/json/)

      const blogsAtEnd = await helper.blogsInDb()
      const blog = blogsAtEnd.find(b => b.title === "Tekoäly työnhaussa: Hakemuksen laatiminen")
      assert.strictEqual(blog.likes, 0)
    })

    test('a new blog without valid token is not added', async () => {
      const newBlog = {
        title: "Tekoälyä vai ei älyä? – Kuinka tekoäly muokkaa inhimillistä johtamista?",
        author: "Heljä Laitinen",
        url: "https://piilo-osaajat.com/2025/01/10/kuinka-tekoaly-muokkaa-inhimillista-johtamista/",
        likes: 5
      }

      await api
        .post('/api/blogs')
        .send(newBlog)
        .expect(401)
        .expect('Content-Type', /application\/json/)

      const blogsAtEnd = await helper.blogsInDb()
      assert.strictEqual(blogsAtEnd.length, helper.initialBlogss.length)
    })

  })
  
  describe('deletion of a blog', () => {
    test('a blog can be deleted', async () => {
      const blogToDelete =
      {
        title: "Tekoäly työnhaussa: Hakemuksen laatiminen",
        author: "Jari Aaltonen",
        url: "https://piilo-osaajat.com/2024/11/28/tekoaly-tyonhaussa-hakemuksen-laatiminen/",
        likes: 2
      }

       const res = await api
        .post('/api/blogs')
        .set('Authorization', token)
        .send(blogToDelete)
        .expect(201)
        .expect('Content-Type', /application\/json/)

      let blogsAtEnd = await helper.blogsInDb()
      assert.strictEqual(blogsAtEnd.length, helper.initialBlogss.length + 1)

      await api
        .delete(`/api/blogs/${res.body.id}`)
        .set('Authorization', token)
        .expect(204)

      blogsAtEnd = await helper.blogsInDb()

      const contents = blogsAtEnd.map(n => n.title)
      assert(!contents.includes(blogToDelete.title))

      assert.strictEqual(blogsAtEnd.length, helper.initialBlogss.length)
    })

    test('deleting a non-existing blog returns 404', async () => {
      const nonExistingId = await helper.nonExistingId()

      await api
        .delete(`/api/blogs/${nonExistingId}`)
        .set('Authorization', token)
        .expect(404)

      const blogsAtEnd = await helper.blogsInDb()
      assert.strictEqual(blogsAtEnd.length, helper.initialBlogss.length)
    })
  })

  describe('updating a blog', () => {
    test('a blog can be updated', async () => {
      const blogsAtStart = await helper.blogsInDb()
      const blogToUpdate = blogsAtStart[0]

      const updatedBlogData = {
        likes: 4,
        id: blogToUpdate.id,
        title: blogToUpdate.title,
        author: blogToUpdate.author,
        url: blogToUpdate.url
      }

      await api
        .put(`/api/blogs/${blogToUpdate.id}`)
        .set('Authorization', token)
        .send(updatedBlogData)
        .expect(200)

      const blogsAtEnd = await helper.blogsInDb()
      const updatedBlog = blogsAtEnd.find(b => b.id === blogToUpdate.id)

      assert.strictEqual(updatedBlog.title, updatedBlogData.title)
      assert.strictEqual(updatedBlog.author, updatedBlogData.author)
      assert.strictEqual(updatedBlog.url, updatedBlogData.url)
      assert.strictEqual(updatedBlog.likes, updatedBlogData.likes)
    })

    test('updating a non-existing blog returns 404', async () => {
      const nonExistingId = await helper.nonExistingId()

      const updatedBlogData = {
        likes: 10,
        title: "Non-existing blog",
        author: "Non-existing author",
        url: "https://non-existing-url.com",
        id: nonExistingId
      }

      await api
        .put(`/api/blogs/${nonExistingId}`)
        .set('Authorization', token)
        .send(updatedBlogData)
        .expect(404)

      const blogsAtEnd = await helper.blogsInDb()
      assert.strictEqual(blogsAtEnd.length, helper.initialBlogss.length)
    })
  })

})

after(async () => {
  await mongoose.connection.close()
})