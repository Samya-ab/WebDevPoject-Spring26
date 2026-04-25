import prisma from "./prisma.js"

//creating new user
export async function createUser(data) {
    try {
        const result = await prisma.user.create({
            data: {
                username: data.username,
                email: data.email,
                password: data.password,
                bio: data.bio || "",
                avatarUrl: data.avatarUrl || "",
                bannerUrl: data.bannerUrl || "",
            },
        });
        return {
            data: result,
        };
    } catch (e) {
        return {
            error: {
                message: "Failed to create User",
                status: 500
            }
        };
    }
}


//get user by email
export async function getUserByEmail(email) {
    try {
        const result = await prisma.user.findUnique({
            where: { email },
        });

        if (!result) {
            return {
                error: {
                    message: "User not found",
                    status: 404,
                }
            }
        }

        return {
            data: result,
        };
    } catch (e) {
        return {
            error: {
                message: "Failed to  get User",
                status: 500,
            }
        };
    }
}


//get user by id 
export async function getUserById(id) {
    try {
        const result = await prisma.user.findUnique({
            where: { id },
        });


        if (!result) {
            return {
                error: {
                    message: "User not found",
                    status: 404,
                }
            }
        }

        return {
            data: result,
        };
    } catch (e) {
        return {
            error: {
                message: "Failed to  get User",
                status: 500,
            }
        };
    }
}


//get user by username
export async function getUserByUsername(username) {
    try {
        const result = await prisma.user.findUnique({
            where: { username },
        });

        if (!result) {
            return {
                error: {
                    message: "User not found",
                    status: 404,
                }
            }
        }

        return {
            data: result,
        };
    } catch (e) {
        return {
            error: {
                message: "Failed to  get User",
                status: 500,
            }
        };
    }
}

//get all users
export async function getAllUsers() {
    try {
        const result = await prisma.user.findMany({
            select: {
                id: true,
                username: true,
                bio: true,
                avatarUrl: true,
                bannerUrl: true,
            },
        });
    
        return {
            data: result,
        };
    } catch (e) {
        return {
            error: {
                message: "Failed to fetch Users",
                status: 500,
            }
        };
    }
}

//search users by username
export async function searchUsers(query, currentId) {
    try {
        const result = await prisma.user.findMany({
            where: {
                username: {
                    contains: query,
                },
                NOT: {
                    id: currentId,
                },
            },
            select: {
                id: true,
                username: true,
                avatarUrl: true,
                bio: true,
            },
            take: 10,
        });

        return {
            data: result,
        };

    } catch (e) {
        return {
            error: {
                message: "Failed to fetch Users",
                status: 500,
            }
        };
    }
}

//get user profile 
export async function getUserProfile(userId) {
    try {
        const result = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                email: true,
                bio: true,
                avatarUrl: true,
                bannerUrl: true,
                createdAt: true,
                _count: {
                    select: {
                        posts: true,
                        followers: true,
                        following: true,
                    },
                },
            },
        });


        if (!result) {
            return {
                error: {
                    message: "User not found",
                    status: 404,
                }
            }
        }

        return {
            data: result,
        };

    } catch (e) {
        return {
            error: {
                message: "Failed to get User",
                status: 500,
            }
        };
    }
}

//updating user profile
export async function updateUserProfile(userId, newData) {
    try {
        const result = await prisma.user.update({
            where: { id: userId },
            data: {
                ...(newData.username !== undefined && { username: newData.username }),
                ...(newData.bio !== undefined && { bio: newData.bio }),
                ...(newData.avatarUrl !== undefined && { avatarUrl: newData.avatarUrl }),
                ...(newData.bannerUrl !== undefined && { bannerUrl: newData.bannerUrl }),
            },
            select: {
                id: true,
                username: true,
                email: true,
                bio: true,
                avatarUrl: true,
                bannerUrl: true,
            },
        });
        return {
            data: result,
        };

    } catch (e) {
        return {
            error: {
                message: "Failed to update User",
                status: 500,
            }
        };
    }
}

//get user suggestions (users that the current user isn't following)
export async function getSuggestedUsers(currentId) {
  try {
    const following = await prisma.follow.findMany({
        where: {followerId: currentId},
        select: {
            followingId: true,
        },
    });

    const followingIds = following.map(f => f.followingId);

    const result = await prisma.user.findMany({
        where: {
            id: {
                notIn: [currentId, ...followingIds],
            },
        },
        select: {
            id: true,
            username: true,
            avatarUrl: true,
            bio: true,
        },
        take: 5,
    });

    return {
      data: result,
    };
  } catch (e) {
    return {
      error: {
        message: "Failed to get Suggested Users",
        status: 500,
      }
    };
  }
}

//delete user
export async function deleteUser(userId) {
  try {
    const result = await prisma.user.delete({
        where: {id: userId},
    })
    return {
      data: result,
    };
  } catch (e) {
    return {
      error: {
        message: "Failed to delete User",
        status: 500,
      }
    };
  }
}