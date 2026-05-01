import { NextResponse } from "next/server";
import bcrypt from 'bcryptjs';
import { createUser, getUserByEmail } from '@/repos/users.js';
import { error } from "node:console";
import { cookies } from "next/headers";
//POST /api/
export async function POST(request) {
    try {
        const body = await request.json();
        const required=['email','password' ];
        const m=required.filter(f=>!body[f]);
        if(m.length>0){
            return NextResponse.json(
                {error: "Missing:"},
                { status: 400 }

            );
        }
        const result = await getUserByEmail(body.email);
        const user = result.data;
        if(!user){
            return NextResponse.json(
                {error:"Invalid"},
                {status:401}
            );
        }

        const isvalid=await bcrypt.compare(body.password,user.password);
        if(!isvalid){
            return NextResponse.json(
                {error:"Invalid"},
                {status:401}
            );
        }
        (await cookies()).set('userId', user.id,{
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7

        });
        const { password: _, ...userWithoutPass } = user;
        return NextResponse.json({
            user:userWithoutPass,
            userId:user.id},
            {status:200});


    }catch (error) {
        console.error('Login error: ',error);
        return NextResponse.json(
                {error: "Invalid"},
                { status: 400 }

            );

        
    }

}

