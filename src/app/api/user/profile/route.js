import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Application from "@/models/Application";
import IDCard from "@/models/IDCard";

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    
    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email is required" },
        { status: 400 }
      );
    }

    // Find user's application
    const application = await Application.findOne({ 
      email: email.toLowerCase() 
    }).lean();

    if (!application) {
      return NextResponse.json(
        { success: false, message: "No application found for this email" },
        { status: 404 }
      );
    }

    // Find user's ID cards
    const idCards = await IDCard.find({ 
      email: email.toLowerCase() 
    }).lean();

    return NextResponse.json({
      success: true,
      data: {
        application: {
          id: application.applicationId,
          name: application.name,
          email: application.email,
          role: application.role,
          status: application.status,
          submittedAt: application.submittedAt || application.createdAt,
          reviewedAt: application.reviewedAt
        },
        idCards: idCards.map(card => ({
          idNumber: card.idNumber,
          role: card.role,
          profileUrl: card.profileUrl,
          downloadCount: card.downloadCount,
          createdAt: card.createdAt
        })),
        stats: {
          totalIDCards: idCards.length,
          totalDownloads: idCards.reduce((sum, card) => sum + (card.downloadCount || 0), 0)
        }
      }
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to fetch user profile",
        error: error.message 
      },
      { status: 500 }
    );
  }
}
