import { getFollowers } from "@/repos/follows";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
    const { id } = await params;
    const result=await getFollowers(id);

    if (result.error) {
        return NextResponse.json({ error: result.error.message}, { status:result.error.status});
    }
    return NextResponse.json(result.data);
    
}
