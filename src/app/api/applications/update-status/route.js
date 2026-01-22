import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Application from "@/models/Application";
import User from "@/models/User";

export async function PATCH(request) {
  try {
    await connectDB();
    
    const { applicationId, status } = await request.json();

    if (!applicationId || !status) {
      return NextResponse.json(
        { success: false, message: "Application ID and status are required" },
        { status: 400 }
      );
    }

    if (!["pending", "approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { success: false, message: "Invalid status. Must be: pending, approved, or rejected" },
        { status: 400 }
      );
    }

    // Find and update application
    const application = await Application.findOneAndUpdate(
      { applicationId },
      { 
        status,
        updatedAt: new Date(),
        reviewedAt: new Date()
      },
      { new: true }
    );
    
    if (!application) {
      return NextResponse.json(
        { success: false, message: "Application not found" },
        { status: 404 }
      );
    }

    // Auto-create user profile when approved
    if (status === 'approved') {
      try {
        // Check if user already exists
        let user = await User.findOne({ email: application.email });
        
        if (!user) {
          // Create new user profile
          user = new User({
            email: application.email,
            name: application.name,
            githubUsername: application.githubUsername || application.github?.split('/').pop(),
            linkedinUrl: application.linkedinUrl || application.linkedin,
            role: application.role,
            college: application.college,
            graduationYear: application.graduationYear,
            organization: application.organization,
            techStack: application.techStack || application.techStackUsed,
            expertise: application.expertise,
            isSelected: true,
            selectionDate: new Date(),
            isVerified: true,
            applicationId: application._id
          });
          
          await user.save();
          
          // Update application with user reference
          application.userId = user._id;
          await application.save();
          
          console.log(`✅ User profile created for ${application.name} (${application.email})`);
        } else if (!user.isSelected) {
          // Update existing user to selected status
          user.isSelected = true;
          user.selectionDate = new Date();
          user.isVerified = true;
          user.applicationId = application._id;
          user.role = application.role;
          
          await user.save();
          
          console.log(`✅ User ${application.name} marked as selected`);
        }
      } catch (userError) {
        console.error('Error creating user profile:', userError);
        // Don't fail the approval if user creation fails
      }
    }

    return NextResponse.json({
      success: true,
      message: `Application ${status} successfully`,
      application
    });
  } catch (error) {
    console.error("Error updating application status:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to update application status",
        error: error.message 
      },
      { status: 500 }
    );
  }
}
