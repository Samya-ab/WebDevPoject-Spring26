import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { deleteComment } from "@/repos/comments.js";


export async function DELETE(request, { params }) {
    const { commentId } = await params;

    const cookieStore = await cookies();
    const currentUserId = cookieStore.get("userId")?.value;

    if (!currentUserId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await deleteComment(commentId, currentUserId);

    if (result.error) {
        return NextResponse.json(
            { error: result.error.message },
            { status: result.error.status }
        );
    }

    return NextResponse.json({ message: "Comment deleted successfully" }, { status: 200 });
}