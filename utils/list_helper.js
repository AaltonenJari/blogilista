const dummy = (blogs) => {
  //  palauttaa aina luvun 1
  return 1
}

const totalLikes = (blogs) => {
  //  palauttaa blogien yhteenlaskettujen tykkäysten eli likejen määrän
  return blogs.reduce((sum, blog) => sum + blog.likes, 0)
}

const favoriteBlog = (blogs) => {
  //  palauttaa blogin, jolla on eniten tykkäyksiä eli likeja
  if (blogs.length === 0) {
    return null
  }

  let favorite = blogs[0]

  for (let blog of blogs) {
    if (blog.likes > favorite.likes) {
      favorite = blog
    }
  }

  return favorite
}

const mostBlogs = (blogs) => {
  //  palauttaa kirjoittajan, jolla on eniten blogeja, sekä blogien lukumäärän
  if (blogs.length === 0) {
    return null
  }

  const authorCounts = {}
  blogs.forEach(blog => {
    authorCounts[blog.author] = (authorCounts[blog.author] || 0) + 1
  })

  const maxBlogs = Math.max(...Object.values(authorCounts))
  const mostBlogsAuthor = Object.keys(authorCounts).find(
    author => authorCounts[author] === maxBlogs
  )

  return {
    author: mostBlogsAuthor,
    blogs: maxBlogs
  } 
}

const mostLikes = (blogs) => {
  //  palauttaa kirjoittajan, jonka blogeilla on eniten tykkäyksiä eli likeja, sekä tykkäysten määrän
  if (blogs.length === 0) {
    return null
  }

  const authorLikes = {}
  blogs.forEach(blog => {
    authorLikes[blog.author] = (authorLikes[blog.author] || 0) + blog.likes
  })

  const maxLikes = Math.max(...Object.values(authorLikes))
  const mostLikesAuthor = Object.keys(authorLikes).find(
    author => authorLikes[author] === maxLikes
  )

  return {  
    author: mostLikesAuthor,
    likes: maxLikes
  }
}

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs,
  mostLikes
}