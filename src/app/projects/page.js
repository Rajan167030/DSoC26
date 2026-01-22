'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useMotionPref } from '@/lib/motionVariants';
import { fadeInUp } from '@/lib/motionVariants';

// Mock projects used only when the API returns an empty list
function getMockProjects() {
  return [
    {
      _id: 'mock-1',
      applicationId: 'ECW-2025-00001',
      name: 'DSoC Core Team',
      email: 'core-team@example.com',
      role: 'project-admin',
      githubUsername: 'DSoC-core',
      github: 'https://github.com/example/DSoC-portal',
      linkedin: 'https://www.linkedin.com/company/dsoc/',
      projectName: 'DSoC Portal Revamp',
      projectDescription:
        'Modernizing the DSoC portal with improved UX, better performance, and contributor-friendly tooling.',
      techStackUsed: ['Next.js', 'Tailwind CSS', 'Node.js'],
      createdAt: '2024-12-20T10:00:00.000Z',
      stats: {
        contributors: 14,
        prs: 32,
        issues: 18,
      },
      lookingFor:
        'Frontend contributors familiar with React/Next.js and Tailwind to build new dashboards and components.',
      projectGoals:
        'Ship a fast, accessible portal that makes it easy for contributors to discover and join DSoC projects.',
      status: 'approved',
      submittedAt: '2024-12-10T09:00:00.000Z',
      updatedAt: '2024-12-22T18:30:00.000Z',
      availability: '10-15',
      projectUrl: 'https://github.com/example/DSoC-portal',
      admin: {
        username: 'dsoc-admin',
        name: 'DSoC Core Team',
      },
    },
    {
      _id: 'mock-2',
      applicationId: 'DSOC-2025-00002',
      name: 'Mentor Ops',
      email: 'mentor-ops@example.com',
      role: 'project-admin',
      githubUsername: 'mentor-ops',
      github: 'https://github.com/example/mentor-matching',
      linkedin: 'https://www.linkedin.com/company/mentor-ops/',
      projectName: 'Mentor Matching Service',
      projectDescription:
        'A matching engine that pairs mentees with mentors based on skills, goals, and availability.',
      techStackUsed: ['Node.js', 'Express', 'MongoDB'],
      createdAt: '2024-12-15T09:30:00.000Z',
      stats: {
        contributors: 9,
        prs: 21,
        issues: 11,
      },
      lookingFor:
        'Backend developers and data enthusiasts to improve matching algorithms and observability.',
      projectGoals:
        'Improve mentor-mentee pairing quality and reduce waiting time for new participants.',
      status: 'approved',
      submittedAt: '2024-12-05T11:45:00.000Z',
      updatedAt: '2024-12-18T16:10:00.000Z',
      availability: '5-10',
      projectUrl: 'https://github.com/example/mentor-matching',
      admin: {
        username: 'mentor-admin',
        name: 'Mentor Ops',
      },
    },
    {
      _id: 'mock-3',
      applicationId: 'ECW-2025-00003',
      name: 'Data Viz Team',
      email: 'data-viz@example.com',
      role: 'project-admin',
      githubUsername: 'data-viz-team',
      github: 'https://github.com/example/contributor-analytics',
      linkedin: 'https://www.linkedin.com/company/data-viz-team/',
      projectName: 'Contributor Analytics Dashboard',
      projectDescription:
        'Interactive dashboards that visualize contributor activity, PR throughput, and onboarding funnels.',
      techStackUsed: ['Next.js', 'TypeScript', 'Chart.js'],
      createdAt: '2024-12-10T14:15:00.000Z',
      stats: {
        contributors: 7,
        prs: 17,
        issues: 9,
      },
      lookingFor:
        'People who love data viz, dashboard UX, and building reusable chart components.',
      projectGoals:
        'Provide maintainers with clear insights into contributor health and bottlenecks.',
      status: 'approved',
      submittedAt: '2024-12-01T10:20:00.000Z',
      updatedAt: '2024-12-12T19:05:00.000Z',
      availability: '8-12',
      projectUrl: 'https://github.com/example/contributor-analytics',
      admin: {
        username: 'data-viz-lead',
        name: 'Data Viz Team',
      },
    },
    {
      _id: 'mock-4',
      applicationId: 'ECW-2025-00004',
      name: 'Docs Champion',
      email: 'docs@example.com',
      role: 'project-admin',
      githubUsername: 'docs-champion',
      github: 'https://github.com/example/onboarding-playbook',
      linkedin: 'https://www.linkedin.com/company/docs-champion/',
      projectName: 'Onboarding Playbook Generator',
      projectDescription:
        'Automated generation of project-specific onboarding docs and checklists for new contributors.',
      techStackUsed: ['Node.js', 'Markdown', 'GitHub Actions'],
      createdAt: '2024-11-30T08:00:00.000Z',
      stats: {
        contributors: 5,
        prs: 11,
        issues: 6,
      },
      lookingFor:
        'Documentation nerds and automation fans to refine templates and workflows.',
      projectGoals:
        'Standardize onboarding checklists across projects and reduce time-to-first-PR.',
      status: 'approved',
      submittedAt: '2024-11-20T13:40:00.000Z',
      updatedAt: '2024-12-02T09:25:00.000Z',
      availability: '5-8',
      projectUrl: 'https://github.com/example/onboarding-playbook',
      admin: {
        username: 'docs-champion',
        name: 'Docs Champion',
      },
    },
    {
      _id: 'mock-5',
      applicationId: 'ECW-2025-00005',
      name: 'Design Guild',
      email: 'design-guild@example.com',
      role: 'project-admin',
      githubUsername: 'design-guild',
      github: 'https://github.com/example/id-card-generator',
      linkedin: 'https://www.linkedin.com/company/design-guild/',
      projectName: 'ID Card Generator',
      projectDescription:
        'Dynamic ID card generator for event participants with export and sharing capabilities.',
      techStackUsed: ['React', 'Tailwind CSS', 'Canvas'],
      createdAt: '2024-11-25T16:45:00.000Z',
      stats: {
        contributors: 4,
        prs: 9,
        issues: 4,
      },
      lookingFor:
        'Design-focused contributors to experiment with layouts, animations, and export presets.',
      projectGoals:
        'Offer polished, customizable ID templates that are easy to export and reuse.',
      status: 'approved',
      submittedAt: '2024-11-15T15:00:00.000Z',
      updatedAt: '2024-11-28T20:10:00.000Z',
      availability: '3-6',
      projectUrl: 'https://github.com/example/id-card-generator',
      admin: {
        username: 'design-guru',
        name: 'Design Guild',
      },
    },
    {
      _id: 'mock-6',
      applicationId: 'ECW-2025-00006',
      name: 'Learning Core',
      email: 'learning-core@example.com',
      role: 'project-admin',
      githubUsername: 'learning-core',
      github: 'https://github.com/example/ecwoc-learning-hub',
      linkedin: 'https://www.linkedin.com/company/learning-core/',
      projectName: 'DSoC Learning Hub',
      projectDescription:
        'Curated learning paths, resources, and challenges to help first-time contributors ramp up quickly.',
      techStackUsed: ['Next.js', 'Tailwind CSS', 'MDX'],
      createdAt: '2024-11-18T12:20:00.000Z',
      stats: {
        contributors: 12,
        prs: 26,
        issues: 14,
      },
      lookingFor:
        'Content curators and frontend devs to add tracks, challenges, and UI polish.',
      projectGoals:
        'Build a central place where newcomers can pick a track and reach their first contribution quickly.',
      status: 'approved',
      submittedAt: '2024-11-10T09:15:00.000Z',
      updatedAt: '2024-11-20T18:00:00.000Z',
      availability: '10-20',
      projectUrl: 'https://github.com/example/ecwoc-learning-hub',
      admin: {
        username: 'learning-core',
        name: 'Learning Core',
      },
    },
  ];
}

function ensureAbsoluteUrl(value) {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  // Handle protocol-relative and common domain-only inputs
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  return `https://${trimmed}`;
}

function normalizeGitHubUrl(value, githubUsername) {
  if (value && typeof value === 'string') {
    const v = value.trim();
    if (!v) return githubUsername ? `https://github.com/${githubUsername}` : null;
    if (v.includes('github.com')) return ensureAbsoluteUrl(v);
    // if user provided just a username/repo path like "owner/repo" or "username"
    return `https://github.com/${v.replace(/^\//, '')}`;
  }
  return githubUsername ? `https://github.com/${githubUsername}` : null;
}

function normalizeLinkedInUrl(value) {
  if (!value || typeof value !== 'string') return null;
  const v = value.trim();
  if (!v) return null;
  if (v.includes('linkedin.com')) return ensureAbsoluteUrl(v);
  // If user stored only a handle/slug, assume it's a profile.
  return `https://www.linkedin.com/in/${v.replace(/^\//, '')}`;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTechs, setSelectedTechs] = useState([]);
  const [isTechDropdownOpen, setIsTechDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recent');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/projects');
      const data = await res.json();

      if (res.ok) {
        const fetched = data.projects || [];
        if (fetched.length === 0) {
          setProjects(getMockProjects());
        } else {
          setProjects(fetched);
        }
      } else {
        console.error('Failed to fetch projects:', data.error);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects
    .filter(project => {
      const matchesSearch =
        project.projectName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.projectDescription?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.techStackUsed?.some(tech => tech.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesTechFilter =
        selectedTechs.length === 0 ||
        project.techStackUsed?.some(tech => selectedTechs.includes(tech));

      return matchesSearch && matchesTechFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          // Sort by latest updatedAt (fallback to createdAt)
          return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
        case 'contributors': {
          const aCount = Number(a.stats?.contributors ?? 0) || 0;
          const bCount = Number(b.stats?.contributors ?? 0) || 0;
          return bCount - aCount;
        }
        case 'activity': {
          // Sort by issues assigned in last 24h (mock: use issues count if no assignedIssues)
          const now = Date.now();
          const getRecentAssigned = (proj) => {
            if (Array.isArray(proj.assignedIssues)) {
              return proj.assignedIssues.filter((iss) => {
                const assignedAt = new Date(iss.assignedAt).getTime();
                return now - assignedAt < 24 * 60 * 60 * 1000;
              }).length;
            }
            return proj.stats?.issues || 0;
          };
          return getRecentAssigned(b) - getRecentAssigned(a);
        }
        default:
          return 0;
      }
    });

  const allTechStacks = [...new Set(projects.flatMap(p => p.techStackUsed || []))];

  // Helper function to determine project activity level
  const getActivityLevel = (stats) => {
    const total = (stats?.contributors || 0) + (stats?.prs || 0) + (stats?.issues || 0);
    if (total >= 50) {
      return {
        level: 'High activity',
        badgeClass:
          'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30',
      };
    }
    if (total >= 20) {
      return {
        level: 'Moderate activity',
        badgeClass:
          'bg-amber-500/10 text-amber-300 border border-amber-500/30',
      };
    }
    return {
      level: 'New / low activity',
      badgeClass: 'bg-sky-500/10 text-sky-300 border border-sky-500/30',
    };
  };

  const formatDate = (value) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const toggleTechFilter = (tech) => {
    setSelectedTechs((prev) =>
      prev.includes(tech) ? prev.filter((t) => t !== tech) : [...prev, tech]
    );
  };

  return (
    <div className="min-h-screen bg-black text-gray-200">
      <Navbar />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-32 pb-8 max-w-7xl">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <motion.h1
            variants={fadeInUp}
            className="text-5xl md:text-6xl font-bold-custom text-white mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent"
          >
            Explore <span className="italic text-indigo-500">Projects.</span>
          </motion.h1>
          <p className="text-base md:text-lg text-gray-400 max-w-3xl mx-auto mb-10">
            Browse projects led by our community, understand what they are building,
            and find a place where your skills can make an impact.
          </p>

          {/* Quick Stats */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
            <div className="px-4 sm:px-5 py-3 bg-zinc-900/60 border border-zinc-800 rounded-xl sm:rounded-2xl">
              <div className="text-xl sm:text-2xl font-semibold text-indigo-400">
                {projects.length}
              </div>
              <div className="text-xs sm:text-sm text-gray-500 mt-1">Active Projects</div>
            </div>
            <div className="px-4 sm:px-5 py-3 bg-zinc-900/60 border border-zinc-800 rounded-xl sm:rounded-2xl">
              <div className="text-xl sm:text-2xl font-semibold text-sky-400">
                {allTechStacks.length}
              </div>
              <div className="text-xs sm:text-sm text-gray-500 mt-1">Technologies</div>
            </div>
            {/* <div className="px-4 sm:px-5 py-3 bg-zinc-900/60 border border-zinc-800 rounded-xl sm:rounded-2xl">
              <div className="text-xl sm:text-2xl font-semibold text-emerald-400">
                {projects.reduce((sum, p) => sum + (p.stats?.contributors || 0), 0)}
              </div>
              <div className="text-xs sm:text-sm text-gray-500 mt-1">Contributors</div>
            </div> */}
          </div>
        </motion.div>

        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            {/* Search Bar */}
            <div className="flex-1">
              <div className="relative group">
                <input
                  type="text"
                  placeholder="Search projects by name, description, or tech stack..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 sm:px-6 py-3 sm:py-3.5 text-sm sm:text-base bg-zinc-900 border border-zinc-800 rounded-xl sm:rounded-2xl text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500/60 focus:bg-zinc-900/80 transition-all duration-200"
                />
                <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-blue-500 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Tech Filters (multi-select) */}
            <div className="relative md:w-60">
              <button
                type="button"
                onClick={() => setIsTechDropdownOpen((open) => !open)}
                className="w-full px-4 sm:px-6 py-3 sm:py-3.5 text-sm sm:text-base bg-zinc-900 border border-zinc-800 rounded-xl sm:rounded-2xl text-gray-100 focus:outline-none focus:border-indigo-500/60 hover:bg-zinc-900/80 transition-all duration-200 cursor-pointer flex items-center justify-between gap-2"
              >
                <span className="truncate text-left">
                  {selectedTechs.length === 0
                    ? 'All technologies'
                    : `${selectedTechs.length} tech stack${selectedTechs.length > 1 ? 's' : ''} selected`}
                </span>
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform ${isTechDropdownOpen ? 'rotate-180' : ''
                    }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isTechDropdownOpen && allTechStacks.length > 0 && (
                <div className="absolute right-0 mt-2 w-full md:w-64 max-h-72 overflow-y-auto rounded-xl bg-black border border-zinc-800 shadow-xl z-20">
                  <div className="px-3 py-2 border-b border-zinc-800 flex items-center justify-between text-[11px] text-gray-400">
                    <span>Filter by tech stack</span>
                    <button
                      type="button"
                      onClick={() => setSelectedTechs([])}
                      className="text-indigo-300 hover:text-indigo-200"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="py-1">
                    {allTechStacks.slice(0, 20).map((tech) => {
                      const isSelected = selectedTechs.includes(tech);
                      return (
                        <button
                          key={tech}
                          type="button"
                          onClick={() => toggleTechFilter(tech)}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${isSelected
                            ? 'bg-zinc-900 text-indigo-300'
                            : 'text-gray-200 hover:bg-zinc-900/70'
                            }`}
                        >
                          <span
                            className={`inline-flex h-3 w-3 rounded-sm border ${isSelected
                              ? 'bg-indigo-500 border-indigo-400'
                              : 'border-zinc-600'
                              }`}
                          />
                          <span className="truncate">{tech}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Sort Options */}
            <div className="md:w-72">
              {/* <div className="mb-1 hidden md:block text-xs text-gray-500">Sort by</div> */}
              <div className="flex md:flex-row gap-2 bg-zinc-950/60 border border-zinc-800 rounded-2xl p-1">
                {[
                  { id: 'recent', label: 'Most recent' },
                  { id: 'contributors', label: 'Most contributors' },
                  { id: 'activity', label: 'Most active' },
                ].map((option) => {
                  const isActive = sortBy === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setSortBy(option.id)}
                      className={`flex-1 flex items-center justify-center h-10 px-3 rounded-xl text-xs sm:text-sm font-medium transition-colors ${isActive
                          ? 'bg-indigo-600 text-white border border-indigo-500 ring-1 ring-indigo-500/20'
                          : 'bg-transparent text-gray-300 border border-transparent hover:bg-zinc-900 hover:text-white'
                        }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6 text-sm">
              <span className="text-white font-semibold">
                {filteredProjects.length} {filteredProjects.length === 1 ? 'project' : 'projects'}
              </span>
              {searchTerm && (
                <span className="px-3 py-1 bg-zinc-900 border border-zinc-700 rounded-full text-indigo-300 text-xs">
                  Searching: &apos;{searchTerm}&apos;
                </span>
              )}
              {selectedTechs.length > 0 && (
                <span className="px-3 py-1 bg-zinc-900 border border-zinc-700 rounded-full text-sky-300 text-xs max-w-xs truncate">
                  Tech: {selectedTechs.slice(0, 2).join(', ')}
                  {selectedTechs.length > 2 && ` +${selectedTechs.length - 2} more`}
                </span>
              )}
            </div>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedTechs([]);
                setIsTechDropdownOpen(false);
                setSortBy('recent');
              }}
              className="text-sm text-gray-400 hover:text-white transition"
            >
              Clear filters
            </button>
          </div>
        </motion.div>

        {/* Loading State (skeleton) */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse group relative bg-zinc-900/70 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-zinc-800 overflow-hidden"
              >
                <div className="h-4 bg-zinc-800 rounded w-3/4 mb-3"></div>
                <div className="h-3 bg-zinc-800 rounded w-1/2 mb-4"></div>

                <div className="space-y-2">
                  <div className="h-3 bg-zinc-800 rounded w-full"></div>
                  <div className="h-3 bg-zinc-800 rounded w-full"></div>
                  <div className="h-3 bg-zinc-800 rounded w-5/6"></div>
                </div>

                <div className="mt-4 flex gap-3">
                  <div className="h-9 flex-1 bg-zinc-800 rounded"></div>
                  <div className="h-9 w-28 bg-zinc-800 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredProjects.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center py-20"
          >
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 mx-auto mb-6 bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-800">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">No Projects Found</h3>
              <p className="text-gray-400 mb-6">
                {searchTerm || selectedTechs.length > 0
                  ? "Try adjusting your search filters to find more projects"
                  : "No projects have been added yet. Check back soon!"}
              </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedTechs([]);
                  setIsTechDropdownOpen(false);
                  setSortBy('recent');
                }}
                className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-500 transition shadow-sm"
              >
                Clear All Filters
              </button>
            </div>
          </motion.div>
        )}

        {!loading && filteredProjects.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {filteredProjects.map((project, index) => {
                const activity = getActivityLevel(project.stats);
                const githubHref = normalizeGitHubUrl(project.github, project.githubUsername);
                const linkedinHref = normalizeLinkedInUrl(project.linkedin);
                const projectHref = ensureAbsoluteUrl(project.projectUrl);
                return (
                  <motion.div
                    key={project._id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="group relative  bg-zinc-900/70 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-zinc-800 hover:border-zinc-600 transition-all duration-200 hover:bg-zinc-900 overflow-visible pt-12"
                  >
                    {/* Activity Badge */}
                    <div className="absolute top-3 right-3 z-30">
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${activity.badgeClass} shadow-sm`}>
                        {activity.level}
                      </div>
                    </div>

                    {/* Project Header */}
                    <div className="flex items-start mt-4 gap-3 sm:gap-4 mb-3 sm:mb-4">
                      <div className="flex-shrink-0">
                        {/* <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-white text-xl sm:text-2xl font-semibold group-hover:border-indigo-500 transition-colors duration-200">
                          {project.projectName?.charAt(0).toUpperCase()}
                        </div> */}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg sm:text-xl font-semibold text-white mb-1 sm:mb-1.5 group-hover:text-indigo-300 transition-colors duration-200 truncate">
                          {project.projectName}
                        </h3>
                        <div className="flex flex-col gap-1 text-sm text-gray-400">
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                            <a
                              href={`/profile/${project.admin?.username || project.githubUsername}`}
                              className="font-semibold hover:text-blue-400 transition truncate"
                            >
                              {project.admin?.name || project.name}
                            </a>
                          </div>

                          <div className="flex items-center gap-3">
                            {project.githubUsername && (
                              <a
                                href={githubHref || undefined}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 hover:text-white transition truncate"
                              >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.29-.01-1.05-.02-2.06-3.34.73-4.04-1.61-4.04-1.61-.55-1.4-1.34-1.77-1.34-1.77-1.09-.75.08-.74.08-.74 1.2.08 1.84 1.23 1.84 1.23 1.07 1.84 2.8 1.31 3.48 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.34-5.47-5.96 0-1.32.47-2.39 1.24-3.24-.12-.3-.54-1.52.12-3.16 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 3-.4c1.02 0 2.05.14 3 .4 2.28-1.55 3.29-1.23 3.29-1.23.66 1.64.24 2.86.12 3.16.77.85 1.23 1.92 1.23 3.24 0 4.63-2.81 5.66-5.49 5.96.43.37.81 1.1.81 2.22 0 1.6-.02 2.89-.02 3.28 0 .32.21.7.82.58C20.57 21.8 24 17.3 24 12 24 5.37 18.63 0 12 0z" />
                                </svg>
                                {/* <span className="truncate">{project.githubUsername}</span> */}
                              </a>
                            )}
                            {project.linkedin && (
                              <a
                                href={linkedinHref || undefined}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 hover:text-white transition truncate"
                              >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M4.98 3.5C4.98 4.88 3.88 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1 4.98 2.12 4.98 3.5zM.24 8.25H4.7V24H.24V8.25zM8.34 8.25H12.6v2.14h.06c.59-1.12 2.03-2.3 4.18-2.3 4.47 0 5.29 2.94 5.29 6.77V24h-4.46v-7.3c0-1.74-.03-3.98-2.43-3.98-2.44 0-2.82 1.9-2.82 3.86V24H8.34V8.25z" />
                                </svg>
                                {/* <span className="truncate">LinkedIn</span> */}
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-gray-400 text-sm mb-4 line-clamp-3 leading-relaxed">
                      {project.projectDescription}
                    </p>

                    {/* Project Goals */}
                    {project.projectGoals && (
                      <div className="mb-4 p-3 bg-zinc-900 border border-zinc-800 rounded-xl">
                        <div className="text-xs text-gray-500 mb-1 font-semibold">Project goals</div>
                        <p className="text-sm text-gray-300 line-clamp-2 leading-relaxed">{project.projectGoals}</p>
                      </div>
                    )}

                    {/* Stats Grid */}
                    {/* <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="bg-zinc-900 rounded-xl p-3 border border-zinc-800 text-center">
                        <div className="text-2xl font-semibold text-indigo-400">
                          {project.stats?.contributors || 0}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Contributors</div>
                      </div>
                      <div className="bg-zinc-900 rounded-xl p-3 border border-zinc-800 text-center">
                        <div className="text-2xl font-semibold text-sky-400">
                          {project.stats?.prs || 0}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">PRs</div>
                      </div>
                      <div className="bg-zinc-900 rounded-xl p-3 border border-zinc-800 text-center">
                        <div className="text-2xl font-semibold text-emerald-400">
                          {project.stats?.issues || 0}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">Issues</div>
                      </div>
                    </div> */}

                    {/* Tech Stack */}
                    {project.techStackUsed && project.techStackUsed.length > 0 && (
                      <div className="mb-4">
                        <div className="text-xs text-gray-500 mb-2 font-semibold">Tech Stack</div>
                        <div className="flex flex-wrap gap-2">
                          {project.techStackUsed.slice(0, 4).map((tech, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1.5 bg-zinc-900 border border-zinc-700 text-gray-100 text-xs rounded-lg font-medium hover:border-indigo-500/60 transition-colors duration-200"
                            >
                              {tech}
                            </span>
                          ))}
                          {project.techStackUsed.length > 4 && (
                            <span className="px-3 py-1.5 bg-zinc-900 border border-zinc-700 text-gray-400 text-xs rounded-lg">
                              +{project.techStackUsed.length - 4} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Looking For */}
                    {project.lookingFor && (
                      <div className="mb-5 p-4 bg-zinc-900 rounded-xl border border-zinc-800">
                        <div className="flex items-center gap-2 mb-1.5">
                          <svg className="w-4 h-4 text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                          </svg>
                          <div className="text-xs text-indigo-400 font-semibold">Looking for:</div>
                        </div>
                        <div className="text-sm text-white font-medium leading-relaxed">{project.lookingFor}</div>
                      </div>
                    )}

                    {/* Meta Info */}
                    <div className="mt-1 mb-4 flex flex-wrap items-center gap-2 text-[11px] text-gray-400">
                      {project.status && (
                        <span className="px-2 py-1 rounded-full bg-zinc-900 border border-zinc-700 text-emerald-400 font-semibold uppercase tracking-wide">
                          {project.status}
                        </span>
                      )}
                      {project.availability && (
                        <span className="px-2 py-1 rounded-full bg-zinc-900 border border-zinc-700">
                          Availability: {project.availability} hrs/week
                        </span>
                      )}
                      {formatDate(project.submittedAt) && (
                        <span className="px-2 py-1 rounded-full bg-zinc-900 border border-zinc-700">
                          Applied on {formatDate(project.submittedAt)}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      {project.projectUrl && (
                        <a
                          href={projectHref || undefined}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-500 transition-colors duration-200 text-center shadow-sm"
                        >
                          <span className="flex items-center justify-center gap-2">
                            View project
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </span>
                        </a>
                      )}
                      {project.admin?.username && (
                        <a
                          href={`/profile/${project.admin.username}`}
                          className="px-4 py-3 bg-zinc-900 border border-zinc-800 text-gray-100 rounded-xl text-sm font-medium hover:border-indigo-500/60 hover:text-white transition-colors duration-200 flex items-center gap-2"
                          title="Contact Admin"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                          </svg>
                        </a>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <Footer />
    </div>
  );
}
