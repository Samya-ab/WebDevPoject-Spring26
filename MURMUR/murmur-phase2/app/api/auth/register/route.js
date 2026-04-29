import { NextResponse } from "next/server";
import bcrypt from 'bcryptjs';
import { createUser } from '@/repos/users.js';
//POST /api/
export async function POST(request) {
    try {
        const body = await request.json();
        const required=['username','email','password' ];
        const m=required.filter(f=>!body[f]);
        if(m.length>0){
            return NextResponse.json(
                {error: "Missing:"+m.join(' ,')},
                { status: 400 }

            );
        }
        const hashedPass = await bcrypt.hash(body.password,10);
        const newUser = await createUser({
            username: body.username,
            email: body.email,
            password: body.password,
            bio: body.bio || "",
            avatarUrl: body.avatarUrl || "",
            bannerUrl: body.bannerUrl || "",
        });
        return NextResponse.json(newUser, { status: 201 });
       
    }catch (error) {
        console.error('Register error: ',error);
        if(error.code==='p2002'){
            return NextResponse.json(
                {error:"Email or UserName already Exists"},
                {status: 409}
            );
        }
        return NextResponse.json(
                {error: "Invalid"},
                { status: 400 }

            );

        
    }

}

