import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import IDCard from "@/models/IDCard";

export async function PATCH(request) {
  try {
    await connectDB();
    
    const { idNumber } = await request.json();

    if (!idNumber) {
      return NextResponse.json(
        { success: false, message: "ID number is required" },
        { status: 400 }
      );
    }

    // Find and update download count
    const idCard = await IDCard.findOne({ idNumber });
    
    if (!idCard) {
      return NextResponse.json(
        { success: false, message: "ID card not found" },
        { status: 404 }
      );
    }

    await idCard.recordDownload();

    return NextResponse.json({
      success: true,
      message: "Download recorded",
      downloadCount: idCard.downloadCount
    });
  } catch (error) {
    console.error("Error recording download:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to record download",
        error: error.message 
      },
      { status: 500 }
    );
  }
}
