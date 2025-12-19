const Blog = require('../models/blog')

const initialBlogss = [
  {
    title: "Mitä opin Osaamismarkkinoilta",
    author: "Anna Scier",
    url: "https://piilo-osaajat.com/2025/06/09/mita-opin-osaamismarkkinoilta/",
    likes: 7
  },
  {
    title: "Politiikka meemiytyy, eikä se ole lopulta hauskaa",
    author: "Katri Rantala",
    url: "https://piilo-osaajat.com/2025/04/10/politiikka-meemiytyy-eika-se-ole-lopulta-hauskaa/",
    likes: 6
  },
  {
    title: "Tekoäly työnhaussa: Hakemuksen laatiminen",
    author: "Jari Aaltonen",
    url: "https://piilo-osaajat.com/2024/11/28/tekoaly-tyonhaussa-hakemuksen-laatiminen/",
    likes: 2
  }
]

const nonExistingId = async () => {
  const blog = new Blog({ title: 'willremovethissoon' })
  await blog.save()
  await blog.deleteOne()

  return blog._id.toString()
}

const blogsInDb = async () => {
  const blogs = await Blog.find({})
  return blogs.map(blog => blog.toJSON())
}

module.exports = {
  initialBlogss, nonExistingId, blogsInDb
}