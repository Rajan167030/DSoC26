import { NextResponse } from "next/server";
import User from "@/models/User";
import connectDB from "@/lib/db";

// Check if user already exists with any email and different role than currently is
export async function POST(request) {
    try {
        await connectDB();
        const { email, role } = await request.json();
        if (!email || !role) {
            return NextResponse.json(
                { success: false, message: "Email and role are required" },
                { status: 400 }
            );
        }
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        // conditions are Project admin can't be contributor, Mentor can't be contributor, Contributor can't be Mentor or Project admin
        if (existingUser) {
            const existingRole = existingUser.role;

            // contributor -> not allowed if existing is mentor or project-admin
            if (role === "contributor" && existingRole === "mentor") {
                return NextResponse.json(
                    {
                        success: true,
                        hasOtherRole: true,
                        message: "You are already registered as a Mentor. Mentors cannot also be Contributors."
                    },
                    { status: 200 }
                );
            }
            if (role === "contributor" && existingRole === "project-admin") {
                return NextResponse.json(
                    {
                        success: true,
                        hasOtherRole: true,
                        message: "You are already registered as a Project Admin. Project Admins cannot also be Contributors."
                    },
                    { status: 200 }
                );
            }

            // mentor -> not allowed if existing is project-admin
            if (role === "mentor" && existingRole === "project-admin") {
                return NextResponse.json(
                    {
                        success: true,
                        hasOtherRole: true,
                        message: "You are already registered as a Project Admin. You cannot register as a Mentor."
                    },
                    { status: 200 }
                );
            }

            // mentor -> not allowed if existing is contributor
            if (role === "mentor" && existingRole === "contributor") {
                return NextResponse.json(
                    {
                        success: true,
                        hasOtherRole: true,
                        message: "You are already registered as a Contributor. You cannot register as a Mentor."
                    },
                    { status: 200 }
                );
            }

            // project-admin -> not allowed if existing is mentor or contributor
            if (role === "project-admin" && existingRole === "mentor") {
                return NextResponse.json(
                    {
                        success: true,
                        hasOtherRole: true,
                        message: "You are already registered as a Mentor. You cannot register as a Project Admin."
                    },
                    { status: 200 }
                );
            }
            if (role === "project-admin" && existingRole === "contributor") {
                return NextResponse.json(
                    {
                        success: true,
                        hasOtherRole: true,
                        message: "You are already registered as a Contributor. Contributors cannot be Project Admins."
                    },
                    { status: 200 }
                );
            }

            // same role
            return NextResponse.json(
                {
                    success: true,
                    hasOtherRole: false,
                    message: `User already registered as ${existingRole}.`
                },
                { status: 200 }
            );
        }

        // If no existing user found, no conflicting role exists
        return NextResponse.json(
            {
                success: true,
                hasOtherRole: false,
                message: "No conflicting role found."
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error checking multiple roles:", error);
        return NextResponse.json(
            { success: false, message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
