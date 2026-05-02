import prisma from "./prisma.js";

//create new comments
export async function createComment(postId, authorId, text) {
    try {
        const result = await prisma.comment.create({
            data: {
                text,
                postId,
                authorId,
            },
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        avatarUrl: true,
                    },
                },
            },
        });

        return {
            data: result,
        };
    } catch (e) {
        return {
            error: {
                message: "Failed to create new Comment",
                status: 500,
            }
        };
    }
}

//deleting a comment by author or post owner
export async function deleteComment(commentId, currentUserId) {
    try {
        const comment = await prisma.comment.findUnique({
            where: { id: commentId },
            select: {
                id: true,
                authorId: true,
                post: {
                    select: {
                        authorId: true,
                    },
                },
            },
        });

        if (!comment) {
            return {
                error: {
                    message: "Comment not found",
                    status: 404,
                },
            };
        }

        const isCommentOwner = comment.authorId === currentUserId;
        const isPostOwner = comment.post.authorId === currentUserId;

        if (!isCommentOwner && !isPostOwner) {
            return {
                error: {
                    message: "You are not allowed to delete this Comment",
                    status: 403,
                }
            }
        };

        const result = await prisma.comment.delete({
            where: { id: commentId },
        });

        return {
            data: result,
        };
    } catch (e) {
        return {
            error: {
                message: "Failed to delete Comment",
                status: 500,
            }
        };
    }
}

//get all comments for a specific post
export async function getCommentsByPost(postId) {
  try {
    const result = await prisma.comment.findMany({
        where: {postId},
        orderBy: {
            createdAt: "asc"
        },
        include: {
            author: {
                select: {
                    id:true,
                    username: true, 
                    avatarUrl: true,
                },
            },
        },
    });

    return {
      data: result,
    };
  } catch (e) {
    return {
      error: {
        message: "Failed to fetch Comments",
        status: 500,
      }
    };
  }
}

//count comments for a post
export async function countCommentsByPost(postId) {
  try {
    const result = await prisma.comment.count({
        where: {postId},
    });
    return {
      data: result,
    };
  } catch (e) {
    return {
      error: {
        message: "Failed to count Comments",
        status: 500,
      }
    };
  }
}