import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSuggestedUsers } from "@/repos/users.js";

export async function GET(request) {
    const cookieStore = await cookies();
    const currentUserId = cookieStore.get("userId")?.value;

    if (!currentUserId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await getSuggestedUsers(currentUserId);

    if (result.error) {
        return NextResponse.json(
            { error: result.error.message },
            { status: result.error.status }
        );
    }

    return NextResponse.json(result.data, { status: 200 });
}