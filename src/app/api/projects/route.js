import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Application from '@/models/Application';
import User from '@/models/User';

//  get contributors count from GitHub with low-cost request.
async function getContributorsCountFromGithub(owner, repo, token) {
  if (!owner || !repo) return null;
  try {
    const perPage = 1; // ask for 1 item and inspect Link header for total pages
    const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contributors?per_page=${perPage}&anon=1`;
    const headers = { Accept: 'application/vnd.github.v3+json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(url, { headers });
    if (!res.ok) {
      return null;
    }
    const list = await res.json();
    // If Link header exists with rel="last", parse last page number
    const link = res.headers.get('link');
    if (link) {
      const m = link.match(/<[^>]+[?&]page=(\d+)[^>]*>;\s*rel="last"/i);
      if (m && m[1]) {
        // when per_page=1, last page number equals contributor count
        const lastPage = parseInt(m[1], 10);
        if (Number.isFinite(lastPage)) return lastPage;
      }
    }
    // Fallback: length of returned list
    if (Array.isArray(list)) return list.length;
    return null;
  } catch (e) {
    return null;
  }
}

// Helper: simple concurrency-limited map
async function mapWithConcurrency(items, fn, concurrency = 5) {
  const results = new Array(items.length);
  let idx = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }).map(async () => {
    while (idx < items.length) {
      const i = idx++;
      try {
        results[i] = await fn(items[i], i);
      } catch (e) {
        results[i] = undefined;
      }
    }
  });
  await Promise.all(workers);
  return results;
}

export async function GET(req) {
  try {
    await connectDB();

    // Fetch all approved project-admin applications with project details
    const approvedProjects = await Application.find({
      role: 'project-admin',
      status: 'approved',
      projectName: { $exists: true, $ne: '' }
    })
      .select(
        'applicationId name email role githubUsername github linkedin linkedinUrl projectName projectDescription projectUrl techStackUsed lookingFor projectGoals status submittedAt createdAt updatedAt availability'
      )
      .sort({ createdAt: -1 })
      .lean();

    // Enrich with user data for admin info and actual stats
    const projectsWithAdmins = await Promise.all(
      approvedProjects.map(async (project) => {
        const admin = await User.findOne({
          email: project.email
        })
          .select('username name githubUsername role isSelected projectStats')
          .lean();

        // Get actual stats from user's projectStats if available (keep as fallback)
        let stats = {
          contributors: 0,
          prs: 0,
          issues: 0
        };

        if (admin?.projectStats) {
          stats = {
            contributors: admin.projectStats.totalContributors || 0,
            prs: admin.projectStats.prsMerged || 0,
            issues: admin.projectStats.issuesResolved || 0
          };

          const projectInList = admin.projectStats.projectsList?.find(
            p => p.name?.toLowerCase() === project.projectName?.toLowerCase() ||
              (p.repoUrl && project.projectUrl && p.repoUrl?.includes(project.projectUrl))
          );

          if (projectInList) {
            stats = {
              contributors: projectInList.contributors || stats.contributors || 0,
              prs: projectInList.prs || stats.prs || 0,
              issues: projectInList.issues || stats.issues || 0
            };
          }
        }

        // Return project with admin and fallback stats; contributor count may be updated later via GitHub API
        return {
          ...project,
          admin: admin || {
            username: project.githubUsername,
            name: project.name
          },
          stats,
          createdAt: project.createdAt
        };
      })
    );

    // Try to enrich contributor counts from GitHub for projects that expose a repo URL
    const githubToken = process.env.GITHUB_TOKEN;

    const enriched = await mapWithConcurrency(projectsWithAdmins, async (proj) => {
      try {
        const repoUrl = proj.projectUrl || proj.github || proj.repoUrl || '';
        const match = (repoUrl || '').match(/github\.com\/(.+?)\/(.+?)(?:$|\/|\?)/i);
        if (match) {
          const owner = match[1];
          const repo = match[2].replace(/\.git$/i, '');
          const count = await getContributorsCountFromGithub(owner, repo, githubToken);
          if (Number.isFinite(count)) {
            return { ...proj, stats: { ...(proj.stats || {}), contributors: count } };
          }
        }
      } catch (e) {
        // swallow errors and return original
      }
      return proj;
    }, 5);

    return NextResponse.json({
      success: true,
      projects: enriched,
      count: enriched.length
    });

  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch projects',
        details: error.message
      },
      { status: 500 }
    );
  }
}
