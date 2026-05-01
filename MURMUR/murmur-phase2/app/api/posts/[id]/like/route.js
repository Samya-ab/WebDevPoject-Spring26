import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { toggleLike } from "@/repos/likes.js";

export async function POST(request, { params }) {
    const { id } = await params;

    const cookieStore = await cookies();
    const currentUserId = cookieStore.get("userId")?.value;

    if (!currentUserId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await toggleLike(currentUserId, id);

    if (result.error) {
        return NextResponse.json(
            { error: result.error.message },
            { status: result.error.status }
        );
    }

    // result.data = { liked: true } or { liked: false }
    return NextResponse.json(result.data, { status: 200 });
}