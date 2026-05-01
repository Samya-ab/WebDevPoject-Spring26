import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCommentsByPost, createComment } from "@/repos/comments.js";

export async function GET(request, { params }) {
    const { id } = await params;

    const cookieStore = await cookies();
    const currentUserId = cookieStore.get("userId")?.value;

    if (!currentUserId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await getCommentsByPost(id);

    if (result.error) {
        return NextResponse.json(
            { error: result.error.message },
            { status: result.error.status }
        );
    }

    return NextResponse.json(result.data, { status: 200 });
}

export async function POST(request, { params }) {
    const { id } = await params;

    const cookieStore = await cookies();
    const currentUserId = cookieStore.get("userId")?.value;

    if (!currentUserId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    if (!body.text || body.text.trim() === "") {
        return NextResponse.json(
            { error: "Comment text is required" },
            { status: 400 }
        );
    }

    const result = await createComment(id, currentUserId, body.text.trim());

    if (result.error) {
        return NextResponse.json(
            { error: result.error.message },
            { status: result.error.status }
        );
    }

    return NextResponse.json(result.data, { status: 201 });
}