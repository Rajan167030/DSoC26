import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Application from "@/models/Application";
import User from "@/models/User";

export async function POST(request) {
  try {
    await connectDB();
    
    const { email, applicationId } = await request.json();

    console.log('Login attempt:', { email, applicationId });

    if (!email || !applicationId) {
      return NextResponse.json(
        { success: false, message: "Email and Application ID are required" },
        { status: 400 }
      );
    }

    const applications = await Application.find()
    console.log('All applications:', applications);

    // Find application - try both exact match and case-insensitive
    let application = await Application.findOne({
      email: email.toLowerCase(),
      applicationId: applicationId.trim()
    });

    // If not found, try case-insensitive applicationId (escape special regex chars)
    if (!application) {
      const escapedId = applicationId.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      application = await Application.findOne({
        email: email.toLowerCase(),
        applicationId: { $regex: new RegExp(`^${escapedId}$`, 'i') }
      });
    }

    console.log('Application found:', application ? { 
      id: application._id, 
      email: application.email, 
      applicationId: application.applicationId,
      status: application.status 
    } : 'NOT FOUND');

    if (!application) {
      return NextResponse.json(
        { success: false, message: "Invalid credentials. Please check your email and application ID." },
        { status: 401 }
      );
    }

    // Check if approved and has user profile
    let userProfile = null;
    if (application.status === "approved") {
      userProfile = await User.findOne({ email: email.toLowerCase() });
    }

    return NextResponse.json({
      success: true,
      user: {
        name: application.name,
        email: application.email,
        applicationId: application.applicationId,
        status: application.status,
        role: application.role,
        username: userProfile?.username || application.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, ''),
        isApproved: application.status === "approved",
        hasProfile: !!userProfile
      }
    });

  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
