import prisma from "./prisma.js"

// Total Users
export async function getTotalUsers() {
  try {
    const result = await prisma.user.count();
    return { data: result };
  } catch (e) {
    return {
      error: {
        message: "Failed to count Users",
        status: 500,
      },
    };
  }
}

//  Total Posts
export async function getTotalPosts() {
  try {
    const result = await prisma.post.count();
    return { data: result };
  } catch (e) {
    return {
      error: {
        message: "Failed to count Posts",
        status: 500,
      },
    };
  }
}

//  Total Comments
export async function getTotalComments() {
  try {
    const result = await prisma.comment.count();
    return { data: result };
  } catch (e) {
    return {
      error: {
        message: "Failed to count Comments",
        status: 500,
      },
    };
  }
}

// Total Likes
export async function getTotalLikes() {
  try {
    const result = await prisma.like.count();
    return { data: result };
  } catch (e) {
    return {
      error: {
        message: "Failed to count Likes",
        status: 500,
      },
    };
  }
}

//  Most Active User (by number of posts)
export async function getMostActiveUser() {
  try {
    const result = await prisma.post.groupBy({
      by: ["authorId"],
      _count: { id: true },
      orderBy: {
        _count: { id: "desc" },
      },
      take: 1,
    });

    return { data: result };
  } catch (e) {
    return {
      error: {
        message: "Failed to calculate Most Active User",
        status: 500,
      },
    };
  }
}

//  Most Followed User
export async function getMostFollowedUser() {
  try {
    const result = await prisma.follow.groupBy({
      by: ["followingId"],
      _count: { followingId: true },
      orderBy: {
        _count: { followingId: "desc" },
      },
      take: 1,
    });

    return { data: result };
  } catch (e) {
    return {
      error: {
        message: "Failed to calculate Most Followed User",
        status: 500,
      },
    };
  }
}

//  Most Liked Post
export async function getMostLikedPost() {
  try {
    const result = await prisma.like.groupBy({
      by: ["postId"],
      _count: { postId: true },
      orderBy: {
        _count: { postId: "desc" },
      },
      take: 1,
    });

    return { data: result };
  } catch (e) {
    return {
      error: {
        message: "Failed to calculate Most Liked Post",
        status: 500,
      },
    };
  }
}

//  Average Followers Per User
export async function getAverageFollowers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        _count: {
          select: { followers: true },
        },
      },
    });

    const totalFollowers = users.reduce(
      (sum, user) => sum + user._count.followers,
      0
    );

    const average =
      users.length === 0 ? 0 : totalFollowers / users.length;

    return { data: average };
  } catch (e) {
    return {
      error: {
        message: "Failed to calculate Average Followers",
        status: 500,
      },
    };
  }
}