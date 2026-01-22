import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Application from "@/models/Application";

export async function POST(request) {
  try {
    await connectDB();
    
    const { email, applicationId } = await request.json();

    if (!email && !applicationId) {
      return NextResponse.json(
        { success: false, message: "Email or Application ID is required" },
        { status: 400 }
      );
    }

    // Build query
    let query = {};
    if (applicationId) {
      query.applicationId = applicationId;
    } else if (email) {
      query.email = email.toLowerCase();
    }

    // Find application
    const application = await Application.findOne(query).lean();

    if (!application) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Application not found. Please check your email or application ID.",
          verified: false
        },
        { status: 404 }
      );
    }

    // Check if application is approved
    if (application.status !== "approved") {
      return NextResponse.json(
        { 
          success: false, 
          message: `Your application status is: ${application.status}. Only approved applications can generate ID cards.`,
          verified: false,
          status: application.status
        },
        { status: 403 }
      );
    }

    // Return approved application data
    return NextResponse.json({
      success: true,
      verified: true,
      message: "Application verified successfully!",
      application: {
        id: application.applicationId,
        name: application.name,
        email: application.email,
        role: application.role,
        githubUsername: application.githubUsername || application.github,
        linkedinUrl: application.linkedinUrl || application.linkedin,
        status: application.status
      }
    });
  } catch (error) {
    console.error("Error verifying application:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to verify application",
        verified: false,
        error: error.message 
      },
      { status: 500 }
    );
  }
}
