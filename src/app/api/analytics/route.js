import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Application from "@/models/Application";
import IDCard from "@/models/IDCard";

export async function GET() {
  try {
    await connectDB();
    
    // Get application statistics
    const totalApplications = await Application.countDocuments();
    const pendingApplications = await Application.countDocuments({ status: 'pending' });
    const approvedApplications = await Application.countDocuments({ status: 'approved' });
    const rejectedApplications = await Application.countDocuments({ status: 'rejected' });
    
    // Get role distribution
    const contributorCount = await Application.countDocuments({ role: 'contributor' });
    const mentorCount = await Application.countDocuments({ role: 'mentor' });
    const projectAdminCount = await Application.countDocuments({ role: 'project-admin' });
    
    // Get ID card statistics
    const totalIDCards = await IDCard.countDocuments();
    const totalDownloads = await IDCard.aggregate([
      { $group: { _id: null, total: { $sum: '$downloadCount' } } }
    ]);
    
    // Get recent applications (last 10)
    const recentApplications = await Application.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('name email role status createdAt')
      .lean();
    
    // Get recent ID cards (last 10)
    const recentIDCards = await IDCard.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('idNumber name role createdAt downloadCount')
      .lean();
    
    // Get applications by date (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const applicationsByDate = await Application.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        applications: {
          total: totalApplications,
          pending: pendingApplications,
          approved: approvedApplications,
          rejected: rejectedApplications,
          byRole: {
            contributor: contributorCount,
            mentor: mentorCount,
            projectAdmin: projectAdminCount
          }
        },
        idCards: {
          total: totalIDCards,
          totalDownloads: totalDownloads[0]?.total || 0
        },
        recent: {
          applications: recentApplications,
          idCards: recentIDCards
        },
        timeline: applicationsByDate
      }
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to fetch analytics",
        error: error.message 
      },
      { status: 500 }
    );
  }
}
