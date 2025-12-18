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

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog
}