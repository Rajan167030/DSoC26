import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");

    if (!username) {
      return NextResponse.json(
        { success: false, message: "Username is required" },
        { status: 400 }
      );
    }

    // Fetch GitHub user data
    const response = await fetch(`https://api.github.com/users/${username}`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        // Add GitHub token if available for higher rate limits
        // 'Authorization': `token ${process.env.GITHUB_TOKEN}`
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { success: false, message: "GitHub user not found" },
          { status: 404 }
        );
      }
      throw new Error("Failed to fetch GitHub user");
    }

    const userData = await response.json();

    return NextResponse.json({
      success: true,
      avatar_url: userData.avatar_url,
      name: userData.name || userData.login,
      bio: userData.bio,
      profile_url: userData.html_url
    });
  } catch (error) {
    console.error("Error fetching GitHub photo:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
