import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Application from '@/models/Application';
import IDCard from '@/models/IDCard';

export const dynamic = 'force-dynamic';

function normalizeGithubUsername(value) {
  if (value == null) return '';
  const raw = String(value).trim();
  if (!raw) return '';

  // Allow users to paste profile URLs too.
  // Examples:
  // - https://github.com/octocat
  // - github.com/octocat/
  // - @octocat
  let cleaned = raw;
  cleaned = cleaned.replace(/^https?:\/\/(www\.)?github\.com\//i, '');
  cleaned = cleaned.replace(/^github\.com\//i, '');
  cleaned = cleaned.replace(/^@/, '');
  cleaned = cleaned.replace(/\/$/, '');
  cleaned = cleaned.trim();

  // GitHub username constraints: 1-39, alnum + hyphen, no consecutive/edge hyphens.
  // We'll keep it permissive but strip obvious bad chars.
  cleaned = cleaned.replace(/[^a-zA-Z0-9-]/g, '');
  return cleaned.slice(0, 39);
}

function normalizeLinkedinUrl(value) {
  if (value == null) return '';
  return String(value).trim().slice(0, 300);
}

function getSessionEmail() {
  try {
    const cookieStore = cookies();
    const sessionToken = cookieStore?.get?.('github_session')?.value;
    if (!sessionToken) return null;

    const sessionData = JSON.parse(Buffer.from(sessionToken, 'base64').toString('utf-8'));
    if (!sessionData?.user?.email) return null;
    if (sessionData?.expires && new Date(sessionData.expires) < new Date()) return null;
    return String(sessionData.user.email).toLowerCase();
  } catch {
    return null;
  }
}

export async function POST(request) {
  try {
    await connectDB();

    const sessionEmail = getSessionEmail();

    let body = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const bodyEmail = body?.email ? String(body.email).toLowerCase().trim() : null;
    const email = sessionEmail || bodyEmail;

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated (missing email).' },
        { status: 401 }
      );
    }

    // If a cookie session exists, don’t allow updating a different email.
    if (sessionEmail && bodyEmail && sessionEmail !== bodyEmail) {
      return NextResponse.json(
        { success: false, message: 'Forbidden: session/email mismatch.' },
        { status: 403 }
      );
    }

    const githubUsername = normalizeGithubUsername(body?.githubUsername);
    const linkedinUrl = normalizeLinkedinUrl(body?.linkedinUrl);

    const now = new Date();
    const setUpdate = {
      githubUsername: githubUsername || null,
      linkedinUrl: linkedinUrl || null,
      updatedAt: now,
    };

    const [userRes, appRes, idRes] = await Promise.all([
      User.updateOne({ email }, { $set: setUpdate }),
      Application.updateMany(
        { email },
        {
          $set: {
            githubUsername: githubUsername || null,
            github: githubUsername || null,
            linkedinUrl: linkedinUrl || null,
            linkedin: linkedinUrl || null,
            updatedAt: now,
          },
        }
      ),
      IDCard.updateMany({ email }, { $set: setUpdate }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        email,
        githubUsername: githubUsername || null,
        linkedinUrl: linkedinUrl || null,
        updated: {
          users: userRes?.modifiedCount ?? 0,
          applications: appRes?.modifiedCount ?? 0,
          idCards: idRes?.modifiedCount ?? 0,
        },
      },
    });
  } catch (error) {
    console.error('Error updating socials:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update socials', error: error.message },
      { status: 500 }
    );
  }
}
