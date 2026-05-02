import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { searchUsers } from "@/repos/users.js";

export async function GET(request) {
    const cookieStore = await cookies();
    const currentUserId = cookieStore.get("userId")?.value;

    if (!currentUserId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || query.trim() === "") {
        return NextResponse.json(
            { error: "Search query 'q' is required" },
            { status: 400 }
        );
    }

    const result = await searchUsers(query.trim(), currentUserId);

    if (result.error) {
        return NextResponse.json(
            { error: result.error.message },
            { status: result.error.status }
        );
    }

    return NextResponse.json(result.data, { status: 200 });
}