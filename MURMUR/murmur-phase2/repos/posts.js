import prisma from "./prisma.js"

//creating new post
export async function createPost(authorId, data) {
    try {
        const result = await prisma.post.create({
            data: {
                caption: data.caption || "",
                imageUrl: data.imageUrl || "",
                authorId,
            },
            include: {
                author: {
                    select: {
                        id: true,
                        avatarUrl: true,
                        username: true,
                    },
                },
                _count: {
                    select: {
                        likes: true,
                        comments: true,
                    },
                },
            },
        });
        return {
            data: result
        };
    } catch (e) {
        return {
            error: {
                message: "Failed to create post",
                status: 500,
            }
        };
    }
}

//deleting a post
export async function deletePost(postId, currentUserId) {
    try {
        const post = await prisma.post.findUnique({
            where: { id: postId },
            select: {
                id: true,
                authorId: true,
            },
        });

        if (!post) {
            return {
                error: {
                    message: "Post not found",
                    status: 404,
                },
            };
        }

        if (post.authorId !== currentUserId) {
            return {
                error: {
                    message: "You are not allowed to delete this post",
                    status: 403,
                },
            }
        }

        const result = await prisma.post.delete({
            where: { id: postId }
        })
        return {
            data: result,
        };
    } catch (e) {
        return {
            error: {
                message: "Failed to delete Post",
                status: 500,
            }
        };
    }
}

//get post by id
export async function getPostById(postId) {
    try {
        const result = await prisma.post.findUnique({
            where: { id: postId },
        });


        if (!result) {
            return {
                error: {
                    message: "Post not found",
                    status: 404,
                },
            };
        }
        return {
            data: result,
        };
    } catch (e) {
        return {
            error: {
                message: "Failed to get Post",
                status: 500,
            }
        };
    }
}

//get details for a single post
export async function getPostDetails(postId, currentUserId) {
    try {
        const result = await prisma.post.findUnique({
            where: { id: postId },
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        avatarUrl: true,
                    },
                },
                comments: {
                    orderBy: {
                        createdAt: "asc",
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
                },
                likes: {
                    where: { userId: currentUserId },
                    select: {
                        id: true,
                    },
                },
                _count: {
                    select: {
                        likes: true,
                        comments: true,
                    },
                },
            },
        });

        if (!result) {
            return {
                error: {
                    message: "Post not found",
                    status: 404,
                },
            };
        }

        return {
            data: {
                ...result,
                likedByMe: result.likes.length > 0,
                canDelete: result.authorId === currentUserId,
            },
        };

    } catch (e) {
        return {
            error: {
                message: "Failed to fetch post details",
                status: 500,
            },
        };
    }
}

//get posts for the "Everyone" feed,
export async function getEveryoneFeed(currentUserId) {
    try {
        const result = await prisma.post.findMany({
            orderBy: {
                createdAt: "desc",
            },
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        avatarUrl: true,
                    },
                },
                likes: {
                    where: {
                        userId: currentUserId,
                    },
                    select: {
                        id: true,
                    },
                },
                _count: {
                    select: {
                        likes: true,
                        comments: true,
                    },
                },
            },
        });

        return {
            data: result.map(post => ({
                ...post,
                likedByMe: post.likes.length > 0,
            })),
        };

    } catch (e) {
        return {
            error: {
                message: "Failed to fetch 'Everyone' Feed",
                status: 500,
            },
        };
    };
}

//get posts in the following feed
export async function getFollowingFeed(currentUserId) {
    try {
        const following = await prisma.follow.findMany({
            where: { followerId: currentUserId },
            select: {
                followingId: true,
            },
        });
        const followingIds = following.map(f => f.followingId);

        const result = await prisma.post.findMany({
            where: {
                authorId: {
                    in: followingIds,
                },
            },
            orderBy: {
                createdAt: "desc",
            },
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        avatarUrl: true,
                    },
                },
                likes: {
                    where: { userId: currentUserId },
                    select: { id: true, },
                },
                _count: {
                    select: {
                        likes: true,
                        comments: true,
                    },
                },
            },
        });

        return {
            data: result.map(post => ({
                ...post,
                likedByMe: post.likes.length > 0,
            })),
        };

    } catch (e) {
        return {
            error: {
                message: "Failed to fetch 'Following' Feed",
                status: 500,
            },
        };
    };
}

//get posts by a specific user
export async function getUserPosts(userId, currentUserId) {
    try {
        const result = await prisma.post.findMany({
            where: { authorId: userId },
            orderBy: { createdAt: "desc" },
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        avatarUrl: true,
                    },
                },
                likes: {
                    where: { userId: currentUserId },
                    select: { id: true },
                },
                _count: {
                    select: {
                        likes: true,
                        comments: true,
                    },
                },
            },
        });

        return {
            data: result.map((post) => ({
                ...post,
                likedByMe: post.likes.length > 0,
            })),
        };
    } catch (e) {
        return {
            error: {
                message: "Failed to fetch User Posts",
                status: 500,
            }
        };
    }
}

//get posts liked by  specific User
export async function getLikedPosts(userId, currentUserId) {
    try {
        const liked = await prisma.like.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            include: {
                post: {
                    include: {
                        author: {
                            select: {
                                id: true,
                                username: true,
                                avatarUrl: true,
                            },
                        },
                        likes: {
                            where: {
                                userId: currentUserId,
                            },
                            select: {
                                id: true,
                            },
                        },
                        _count: {
                            select: {
                                likes: true,
                                comments: true,
                            },
                        },
                    },
                },
            },
        });

         const result = liked.map((like) => ({
            ...like.post,
            likedByMe: like.post.likes.length > 0,
        }));

        return {
            data: result
        };

    } catch (e) {
        return {
            error: {
                message: "Failed to fetch Liked posts",
                status: 500,
            }
        };
    }
}