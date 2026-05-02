import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getEveryoneFeed, createPost } from "@/repos/posts.js";

export async function GET(request) {
    const cookieStore = await cookies();
    const currentUserID = cookieStore.get("userId")?.value;

    if (!currentUserID) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await getEveryoneFeed(currentUserID);

    if (result.error) {
        return NextResponse.json(
            { error: result.error.message },
            { status: result.error.status }
        );
    }

    return NextResponse.json(result.data);
}

export async function POST(request) {
    const cookieStore = await cookies();
    const authorId = cookieStore.get("userId")?.value;

    if (!authorId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { caption, imageUrl } = body;

    if (!caption) {
        return NextResponse.json({ error: "Caption required" }, { status: 400 });
    }

    const result = await createPost(authorId, { caption, imageUrl });

    if (result.error) {
        return NextResponse.json(
            { error: result.error.message },
            { status: result.error.status }
        );
    }

    return NextResponse.json(result.data, { status: 201 });
}