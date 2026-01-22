import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Application from "@/models/Application";

export async function POST(request) {
  try {
    await connectDB();
    
    const { email, action } = await request.json();
    
    if (action === 'fix-ids') {
      // Update all APP-* IDs to ECW-2025 format
      const applications = await Application.find({
        email: email.toLowerCase(),
        applicationId: { $regex: /^APP-/ }
      });
      
      const updates = [];
      for (const app of applications) {
        const newId = `ECW-2025-${Date.now().toString().slice(-6)}`;
        app.applicationId = newId;
        await app.save();
        updates.push({ oldId: app._id, newId: newId, status: app.status });
      }
      
      return NextResponse.json({
        success: true,
        message: 'Application IDs updated',
        updates: updates
      });
    }
    
    if (action === 'remove-duplicates') {
      // Keep only the approved application, delete pending duplicates
      const approved = await Application.findOne({
        email: email.toLowerCase(),
        status: 'approved'
      });
      
      if (approved) {
        const deleted = await Application.deleteMany({
          email: email.toLowerCase(),
          _id: { $ne: approved._id }
        });
        
        return NextResponse.json({
          success: true,
          message: 'Duplicates removed',
          kept: approved.applicationId,
          deletedCount: deleted.deletedCount
        });
      }
    }
    
    return NextResponse.json(
      { success: false, message: 'Invalid action' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error("Fix error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
