import { NextResponse } from "next/server";
import { getEveryoneFeed, createPost } from "@/repos/posts.js";

//Get /api/posts
export async function GET(request) {
    const{searchParams} =new URL (request.URL);
    const currentUserID=searchParams.get("currentUserID");
    const result=await getEveryoneFeed(currentUserID);
    


    if (result.error) {
        return NextResponse.json(
            { error: result.error.message },
            { status: result.error.status }
        );
    }

    return NextResponse.json(result.data);
}
    

//Post/api/posts
export async function POST(request) {
    const body = await request.json();
    const {authorId, caption, imageUrl}=body;

    if (!authorId || ! caption) {
        return NextResponse.json({ error: "AuthorID and Caption Required" }, { status: 400 });
    }
    const result = await createPost(authorId, {caption, imageUrl});

    if (result.error) {
        return NextResponse.json(
            { error: result.error.message },
            { status: result.error.status }
        );
    }

    return NextResponse.json(result.data,{status:201});
}
    
