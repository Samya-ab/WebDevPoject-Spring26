const session = JSON.parse(localStorage.getItem("session"));
const users = JSON.parse(localStorage.getItem("users")) || [];
const posts = JSON.parse(localStorage.getItem("posts")) || [];

const currentUser = users.find(u => u.id === session.userId);

// show posts from followed users
const feedPosts = posts.filter(p =>
    currentUser.following.includes(p.authorId)
);