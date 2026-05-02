import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserProfile, updateUserProfile, deleteUser } from "@/repos/users.js";

export async function GET(request, { params }) {
    const { id } = await params;

    const result = await getUserProfile(id);

    if (result.error) {
        return NextResponse.json(
            { error: result.error.message },
            { status: result.error.status }
        );
    }

    return NextResponse.json(result.data, { status: 200 });
}

export async function PATCH(request, { params }) {
    const { id } = await params;

    const cookieStore = await cookies();
    const currentUserId = cookieStore.get("userId")?.value;

    if (!currentUserId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (currentUserId !== id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    const allowedFields = ["username", "bio", "avatarUrl", "bannerUrl"];
    const newData = {};
    for (const field of allowedFields) {
        if (body[field] !== undefined) {
            newData[field] = body[field];
        }
    }

    if (Object.keys(newData).length === 0) {
        return NextResponse.json(
            { error: "No valid fields to update" },
            { status: 400 }
        );
    }

    const result = await updateUserProfile(id, newData);

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

    if (currentUserId !== id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const result = await deleteUser(id);

    if (result.error) {
        return NextResponse.json(
            { error: result.error.message },
            { status: result.error.status }
        );
    }

    const cookieStore2 = await cookies();
    cookieStore2.delete("userId");

    return NextResponse.json({ message: "Account deleted successfully" }, { status: 200 });
}