import { NextResponse } from "next/server";
import { error } from "node:console";
import { toggleFollow, isFollowing } from "@/repos/follows.js";
import { getUserById } from "@/repos/users.js";

export async function GET(request, { params }) {
    const { id } = await params;
    const{searchParams} = await params;
    const followID=searchParams.get("followerID");

    if (!followID) {
        return NextResponse.json({ error: "followID not found" }, { status: 404 });
    }
    const result = await toggleFollow(followID, id);

    if (result.error) {
        return NextResponse.json(
            { error: result.error.message },
            { status: result.error.status }
        );
    }

    return NextResponse.json(result.data);
}
    


export async function POST(request, { params }) {
    const { id } = await params;
    const body = await request.json();
    const {followID}=body;

    if (!followID) {
        return NextResponse.json({ error: "followID not found" }, { status: 404 });
    }
    const result = await toggleFollow(followID, id);

    if (result.error) {
        return NextResponse.json(
            { error: result.error.message },
            { status: result.error.status }
        );
    }

    return NextResponse.json(result.data);
}
    
