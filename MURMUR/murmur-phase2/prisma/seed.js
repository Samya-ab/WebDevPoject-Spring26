import prisma from "@/repos/prisma";
import { faker } from "@faker-js/faker";

const NEW_USERS = 30;
const POSTS_PER_USER = () => faker.number.int({ min: 3, max: 15 });
const COMMENT_PER_POST = () => faker.number.int({ min: 1, max: 30 });
const FOLLOWS_PER_USER = () => faker.number.int({ min: 5, max: 25 });
const LIKES_PER_USER = () => faker.number.int({ min: 0, max: 30 });


const seed = async () => {

    //we delete old data if there's any
    await prisma.like.deleteMany();
    await prisma.follow.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.post.deleteMany();
    await prisma.user.deleteMany();

    const users = [];

    //seeding data
    //Users -> Posts
    for (let i = 0; i < NEW_USERS; i++) {
        const userCreatedAt = faker.date.past({ years: 2 });
        const user = await prisma.user.create({
            data: {
                username: faker.internet.username().slice(0, 20),
                email: faker.internet.email(),
                password: faker.internet.password(),
                bio: faker.lorem.sentence(),
                avatarUrl: faker.image.avatar(),
                bannerUrl: faker.image.urlPicsumPhotos({ width: 1200, height: 400 }),
                createdAt: userCreatedAt,

                posts: {
                    create: Array.from({ length: POSTS_PER_USER() }, () => ({
                        caption: faker.lorem.sentence({ min: 1, max: 3 }),
                        imageUrl: Math.random() > 0.4
                            ? faker.image.urlPicsumPhotos({ width: 800, height: 600 })
                            : null,
                        createdAt: faker.date.between({ from: userCreatedAt, to: new Date() }),
                    })),
                },
            },
            include: { posts: true },
        });

        users.push(user);
    }
    //users and posts creation ended


    //comment creation
    const allPosts = await prisma.post.findMany({ select: { id: true, createdAt: true } });

    for (const post of allPosts) {
        const count = COMMENT_PER_POST();
        if (count === 0) continue;

        await prisma.comment.createMany({
            data: Array.from({ length: count }, () => ({
                text: faker.lorem.sentence(),
                authorId: faker.helpers.arrayElement(users).id,
                postId: post.id,
                createdAt: faker.date.between({ from: post.createdAt, to: new Date() }),
            })),
        });
    }

    //comments for each post created


    //likes creation for each user/post
    const likePair = new Set();
    for (const user of users) {
        const likeCount = LIKES_PER_USER();

        for (let i = 0; i < likeCount; i++) {
            const post = faker.helpers.arrayElement(allPosts);
            const key = `${user.id}:${post.id}`;
            if (likePair.has(key)) continue;
            likePair.add(key);

            await prisma.like.create({
                data: { userId: user.id, postId: post.id },
            });
        }
    }
    //like creation complete


    //Follows
    const followPair = new Set();
    for (const user of users) {
        const followCount = FOLLOWS_PER_USER();

        for (let i = 0; i < followCount; i++) {
            let key, following;

            do {
                following = faker.helpers.arrayElement(users);
                key = `${user.id}:${following.id}`
            } while (user.id === following.id || followPair.has(key));

            followPair.add(key);

            await prisma.follow.create({
                data: { followerId: user.id, followingId: following.id },
            });
        }
    }

    //followers and following pairs created


    //Done
    console.log("DB seeded!");
};


try {
    await seed();
} catch (e) {
    console.error("seed failed", e);
    await prisma.$disconnect();
    process.exit(1);
}