import prisma from "./prisma.js"

//toggle like/unlike on a post
export async function toggleLike(userId, postId) {
    try {
        const existLike = await prisma.like.findUnique({
            where: {
                userId_postId: { userId, postId },
            },
        });

        if (existLike) {
            await prisma.like.delete({
                where: {
                    userId_postId: {
                        userId, postId
                    },
                },
            });

            return {
                data: {
                    liked: false,
                },
            };
        }

        await prisma.like.create({
            data: {
                userId, 
                postId,
            },
        });

        return {
            data: {
                liked: true,
            },
        };

    
    } catch (e) {
        return {
            error: {
                message: "Failed to toggle like",
                status: 500,
            }
        };
    }
}