import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Application from "@/models/Application";

export async function POST(request) {
  try {
    // Connect to MongoDB
    await connectDB();

    const data = await request.json();

    // Helpers
    const extractGithubUsername = (val) => {
      if (!val) return undefined;
      try {
        // If it's a URL, take last path segment
        if (/^https?:\/\//i.test(val)) {
          const u = new URL(val);
          const parts = u.pathname.split('/').filter(Boolean);
          return parts[parts.length - 1] || undefined;
        }
        // Plain username
        return val.replace(/^@/, '').trim();
      } catch {
        return val.replace(/^@/, '').trim();
      }
    };

    const toArray = (val) => {
      if (!val) return undefined;
      if (Array.isArray(val)) return val;
      return String(val)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    };

    // Normalize input across roles
    const email = data.email?.toLowerCase();
    const role = data.role;
    const githubUsername = extractGithubUsername(data.github);
    const base = {
      name: data.name,
      email,
      role,
      githubUsername,
      github: data.github,
      linkedin: data.linkedin,
    };

    let normalized = { ...base };

    if (role === 'contributor') {
      normalized = {
        ...normalized,
        college: data.college,
        graduationYear: data.graduationYear,
        techStack: toArray(data.techStack),
        experienceLevel: data.experienceLevel,
        whyContribute: data.whyContribute,
      };
    } else if (role === 'mentor') {
      normalized = {
        ...normalized,
        expertise: toArray(data.expertise),
        mentorshipExperience: data.mentorshipExperience,
        availability: data.availability,
      };
    } else if (role === 'project-admin') {
      normalized = {
        ...normalized,
        projectName: data.projectName,
        projectDescription: data.projectDescription,
        projectUrl: data.projectGithub,
        techStackUsed: toArray(data.techStack),
        lookingFor: data.contributorExpectations,
        projectGoals: data.projectGoals,
        availability: data.availability,
      };
    }

    // Check for duplicate application (same email and role, but only if pending or approved)
    const existingApplication = await Application.findOne({
      email,
      role,
      status: { $in: ['pending', 'approved'] }
    });

    if (existingApplication) {
      return NextResponse.json(
        {
          success: false,
          message: `You have already applied as ${data.role}. Application ID: ${existingApplication.applicationId}. Status: ${existingApplication.status}`,
          applicationId: existingApplication.applicationId,
          status: existingApplication.status
        },
        { status: 409 } // Conflict
      );
    }

    // Generate unique application ID with ECW prefix
    const applicationId = `ECW-2026-${Date.now().toString().slice(-6)}`;

    console.log('Creating new application:', { email, role, applicationId });

    // Create new application
    const newApplication = new Application({
      applicationId,
      ...normalized,
      status: "pending",
      submittedAt: new Date(),
      createdAt: new Date()
    });

    await newApplication.save();

    console.log('Application saved successfully:', applicationId);

    return NextResponse.json(
      {
        success: true,
        message: "Application submitted successfully",
        applicationId: newApplication.applicationId,
        id: newApplication._id
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error processing application:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to submit application",
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
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const email = searchParams.get('email');

    // Build query
    let query = {};
    if (role) query.role = role;
    if (status) query.status = status;
    if (email) query.email = email.toLowerCase();

    // Fetch applications
    const applications = await Application.find(query)
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(
      {
        success: true,
        applications,
        count: applications.length
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error reading applications:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to retrieve applications",
        error: error.message
      },
      { status: 500 }
    );
  }
}
