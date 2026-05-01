import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getPostDetails, deletePost } from "@/repos/posts.js";

export async function GET(request, { params }) {
    const { id } = await params;

    const cookieStore = await cookies();
    const currentUserId = cookieStore.get("userId")?.value;

    if (!currentUserId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await getPostDetails(id, currentUserId);

    if (result.error) {
        return NextResponse.json(
            { error: result.error.message },
            { status: result.error.status }
        );
    }

    return NextResponse.json(result.data, { status: 200 });
}

export async function DELETE(request, { params }) {
    const { id } = await params;

    const cookieStore = await cookies();
    const currentUserId = cookieStore.get("userId")?.value;

    if (!currentUserId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await deletePost(id, currentUserId);

    if (result.error) {
        return NextResponse.json(
            { error: result.error.message },
            { status: result.error.status }
        );
    }

    return NextResponse.json({ message: "Post deleted successfully" }, { status: 200 });
}