import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getEveryoneFeed, createPost } from "@/repos/posts.js";

export async function GET(request) {
    const cookieStore = await cookies();
    const currentUserId = cookieStore.get("userId")?.value;

    if (!currentUserId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await getEveryoneFeed(currentUserId);

    if (result.error) {
        return NextResponse.json(
            { error: result.error.message },
            { status: result.error.status }
        );
    }

    return NextResponse.json(result.data, { status: 200 });
}

export async function POST(request) {
    const cookieStore = await cookies();
    const currentUserId = cookieStore.get("userId")?.value;

    if (!currentUserId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    if (!body.caption && !body.imageUrl) {
        return NextResponse.json(
            { error: "A post must have a caption or an image" },
            { status: 400 }
        );
    }

    const result = await createPost(currentUserId, {
        caption: body.caption || "",
        imageUrl: body.imageUrl || "",
    });

    if (result.error) {
        return NextResponse.json(
            { error: result.error.message },
            { status: result.error.status }
        );
    }

    return NextResponse.json(result.data, { status: 201 });
}