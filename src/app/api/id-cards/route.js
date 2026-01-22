import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import IDCard from "@/models/IDCard";
import Application from "@/models/Application";

export async function POST(request) {
  try {
    await connectDB();

    const data = await request.json();

    // Validate required fields
    if (!data.idNumber || !data.name || !data.email || !data.role) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if ID card already exists (by idNumber)
    const existingCard = await IDCard.findOne({ idNumber: data.idNumber });
    //console log all id cards 
    const allIdCards = await IDCard.find({});
    console.log("All ID Cards:", allIdCards);
    
    if (existingCard) {
      return NextResponse.json(
        {
          success: false,
          message: "ID card with this number already exists",
          existingCard: {
            idNumber: existingCard.idNumber,
            profileUrl: existingCard.profileUrl
          }
        },
        { status: 409 }
      );
    }

    // Verify application exists and is approved
    const application = await Application.findOne({
      email: data.email.toLowerCase(),
      status: 'approved'
    });

    if (!application) {
      return NextResponse.json(
        { success: false, message: "No approved application found for this email" },
        { status: 403 }
      );
    }

    // SECURITY: Verify the role matches the approved application role
    if (data.role !== application.role) {
      return NextResponse.json(
        {
          success: false,
          message: "Role mismatch. You can only generate ID card for your approved role: " + application.role
        },
        { status: 403 }
      );
    }

    // Check if user already has an ID card (ATOMIC CHECK to prevent race condition)
    const existingUserCard = await IDCard.findOne({ email: data.email.toLowerCase() });
    if (existingUserCard) {
      return NextResponse.json(
        {
          success: false,
          message: "You already have an ID card generated",
          existingCard: {
            idNumber: existingUserCard.idNumber,
            profileUrl: existingUserCard.profileUrl
          }
        },
        { status: 409 }
      );
    }

    // Create ID card with additional race condition protection
    try {
      const idCard = new IDCard({
        idNumber: data.idNumber,
        applicationId: application.applicationId,
        name: data.name,
        username: data.username, // Add username field
        email: data.email.toLowerCase(),
        role: data.role,
        photo: data.photo,
        githubUsername: data.githubUsername,
        linkedinUrl: data.linkedinUrl,
        profileUrl: data.profileUrl,
        qrCodeDataUrl: data.qrCode,
        imageUrl: data.imageUrl,
        useGithubPhoto: data.useGithubPhoto || true,
        generatedAt: new Date(),
        createdAt: new Date()
      });

      await idCard.save();

      return NextResponse.json(
        {
          success: true,
          message: "ID card saved successfully",
          idCard: {
            id: idCard._id,
            idNumber: idCard.idNumber,
            profileUrl: idCard.profileUrl
          }
        },
        { status: 201 }
      );
    } catch (saveError) {
      // Handle duplicate key error (race condition caught by unique index)
      if (saveError.code === 11000) {
        return NextResponse.json(
          { success: false, message: "ID card already exists for this email" },
          { status: 409 }
        );
      }
      throw saveError; // Re-throw other errors
    }
  } catch (error) {
    console.error("Error saving ID card:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to save ID card",
        error: error.message
      },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const idNumber = searchParams.get('idNumber');
    const role = searchParams.get('role');

    // Build query
    let query = {};
    if (email) query.email = email.toLowerCase();
    if (idNumber) query.idNumber = idNumber;
    if (role) query.role = role;

    // Fetch ID cards
    const idCards = await IDCard.find(query)
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(
      {
        success: true,
        idCards,
        count: idCards.length
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching ID cards:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch ID cards",
        error: error.message
      },
      { status: 500 }
    );
  }
}
