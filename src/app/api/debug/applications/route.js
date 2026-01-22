import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Application from "@/models/Application";

export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    
    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email parameter required" },
        { status: 400 }
      );
    }
    
    // Find all applications for this email
    const applications = await Application.find({
      email: email.toLowerCase()
    }).select('applicationId email name role status createdAt').lean();
    
    return NextResponse.json({
      success: true,
      email: email,
      count: applications.length,
      applications: applications
    });
    
  } catch (error) {
    console.error("Debug error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
