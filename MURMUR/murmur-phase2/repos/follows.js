import prisma from "./prisma.js"

//toggle follow/unfollow
export async function toggleFollow(followerId, followingId) {
    try {
        if (followerId === followingId) {
            return {
                error: {
                    message: "You cannot follow yourself!",
                    status: 400,
                }
            };
        }

        const exist = await prisma.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId, followingId,
                },
            },
        });

        if (exist) {
            await prisma.follow.delete({
                where: {
                    followerId_followingId: {
                        followerId, followingId,
                    },
                },
            });

            return {
                data: {
                    following: false,
                },
            };
        }

        await prisma.follow.create({
            data: {
                followerId,
                followingId,
            },
        });

        return {
            data: {
                following: true,
            },
        };
    } catch (e) {
        return {
            error: {
                message: "Failed to toggle Follow",
                status: 500,
            }
        };
    }
}

//check if followerId follows followingId
export async function isFollowing(followerId, followingId) {
    try {
        const result = await prisma.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId, followingId,
                },
            },
        });
        return {
            data: !!result,
        };
    } catch (e) {
        return {
            error: {
                message: "Failed to check follow",
                status: 500,
            }
        };
    }
}

//get followers for a certain user
export async function getFollowers(userId) {
    try {
        const result = await prisma.follow.findMany({
            where: {
                followingId: userId,
            },
            include: {
                follower: {
                    select: {
                        id: true,
                        username: true,
                        avatarUrl: true,
                    },
                },
            },
        });

        return {
            data: result.map(f => f.follower)
        };
    } catch (e) {
        return {
            error: {
                message: "Failed to fetch followers",
                status: 500,
            }
        };
    }
}

//get people that this user is following
export async function getFollowing(userId) {
    try {
        const result = await prisma.follow.findMany({
            where: {
                followerId: userId,
            },
            include: {
                following: {
                    select: {
                        id: true,
                        username: true,
                        avatarUrl: true,
                    },
                },
            },
        });

        return {
            data: result.map((f) => f.following),
        };
    } catch (e) {
        return {
            error: {
                message: "Failed to fetch following",
                status: 500,
            }
        };
    }
}