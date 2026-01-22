'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function TestProfile() {
  const [email, setEmail] = useState('');
  const [activityType, setActivityType] = useState('pr_merged');
  const [description, setDescription] = useState('');
  const [customPoints, setCustomPoints] = useState(0);
  const [commits, setCommits] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const activityTypes = [
    { value: 'pr_merged', label: 'PR Merged (+50 pts)', points: 50 },
    { value: 'pr_opened', label: 'PR Opened (+10 pts)', points: 10 },
    { value: 'issue_resolved', label: 'Issue Resolved (+30 pts)', points: 30 },
    { value: 'commits', label: 'Commits (+5 pts each)', points: 0 },
    { value: 'custom', label: 'Custom Points', points: 0 }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const body = {
        email,
        activityDescription: description
      };

      // Add activity-specific fields
      if (activityType === 'pr_merged') {
        body.prMerged = true;
      } else if (activityType === 'pr_opened') {
        body.prOpened = true;
      } else if (activityType === 'issue_resolved') {
        body.issueResolved = true;
      } else if (activityType === 'commits') {
        body.commits = parseInt(commits) || 0;
      } else if (activityType === 'custom') {
        body.points = parseInt(customPoints) || 0;
        body.activityType = 'custom';
      }

      const res = await fetch('/api/profile/add-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (res.ok) {
        setResult({ success: true, data });
        // Reset form
        setDescription('');
        setCustomPoints(0);
        setCommits(0);
      } else {
        setResult({ success: false, error: data.error });
      }
    } catch (error) {
      setResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">🧪 Test Profile System</h1>
          <p className="text-gray-600 mb-8">Manually add points and activities to user profiles</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                User Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="user@example.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Activity Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Activity Type
              </label>
              <select
                value={activityType}
                onChange={(e) => setActivityType(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {activityTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Commits (if activity type is commits) */}
            {activityType === 'commits' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Number of Commits
                </label>
                <input
                  type="number"
                  value={commits}
                  onChange={(e) => setCommits(e.target.value)}
                  min="1"
                  placeholder="10"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Each commit = 5 points
                </p>
              </div>
            )}

            {/* Custom Points */}
            {activityType === 'custom' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Custom Points
                </label>
                <input
                  type="number"
                  value={customPoints}
                  onChange={(e) => setCustomPoints(e.target.value)}
                  placeholder="50"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            )}

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Activity Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                placeholder="Fixed critical bug in authentication module"
                rows="3"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-4 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding Points...' : 'Add Activity & Points'}
            </button>
          </form>

          {/* Result Display */}
          {result && (
            <div className={`mt-6 p-6 rounded-lg ${result.success ? 'bg-green-50 border-l-4 border-green-500' : 'bg-red-50 border-l-4 border-red-500'}`}>
              {result.success ? (
                <>
                  <h3 className="text-lg font-bold text-green-800 mb-2">✅ Success!</h3>
                  <p className="text-green-700 mb-4">Points added successfully</p>
                  
                  <div className="bg-white rounded-lg p-4 mb-4">
                    <div className="text-sm text-gray-600 mb-2">Username: <span className="font-semibold">{result.data.user.username}</span></div>
                    <div className="text-sm text-gray-600 mb-2">Total Points: <span className="font-bold text-purple-600 text-lg">{result.data.user.stats.totalPoints}</span></div>
                    <div className="text-sm text-gray-600">
                      PRs Merged: <span className="font-semibold">{result.data.user.stats.pullRequests.merged}</span> | 
                      Issues Resolved: <span className="font-semibold">{result.data.user.stats.issues.resolved}</span> | 
                      Commits: <span className="font-semibold">{result.data.user.stats.commits}</span>
                    </div>
                  </div>

                  {result.data.user.badges && result.data.user.badges.length > 0 && (
                    <div className="bg-yellow-50 rounded-lg p-4 mb-4">
                      <div className="font-semibold text-yellow-800 mb-2">🎉 Badges Earned:</div>
                      <div className="flex flex-wrap gap-2">
                        {result.data.user.badges.map((badge, idx) => (
                          <span key={idx} className="bg-yellow-200 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold">
                            {badge.icon} {badge.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <a
                    href={`/profile/${result.data.user.username}`}
                    target="_blank"
                    className="inline-block bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
                  >
                    View Profile →
                  </a>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-bold text-red-800 mb-2">❌ Error</h3>
                  <p className="text-red-700">{result.error}</p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Quick Reference */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Points Reference</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl mb-1">✅</div>
              <div className="font-semibold text-green-800">PR Merged</div>
              <div className="text-sm text-gray-600">+50 points</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl mb-1">🔄</div>
              <div className="font-semibold text-blue-800">PR Opened</div>
              <div className="text-sm text-gray-600">+10 points</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl mb-1">🐛</div>
              <div className="font-semibold text-purple-800">Issue Resolved</div>
              <div className="text-sm text-gray-600">+30 points</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-2xl mb-1">💻</div>
              <div className="font-semibold text-orange-800">Commit</div>
              <div className="text-sm text-gray-600">+5 points each</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-2xl mb-1">📝</div>
              <div className="font-semibold text-yellow-800">Documentation</div>
              <div className="text-sm text-gray-600">+25 points</div>
            </div>
            <div className="bg-pink-50 p-4 rounded-lg">
              <div className="text-2xl mb-1">👀</div>
              <div className="font-semibold text-pink-800">Code Review</div>
              <div className="text-sm text-gray-600">+15 points</div>
            </div>
          </div>

          <div className="mt-6 bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg">
            <div className="font-semibold text-gray-800 mb-2">🏆 Badge Milestones</div>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>🎯 <strong>First PR</strong> - Submit first pull request</li>
              <li>🏆 <strong>PR Master</strong> - Merge 10+ pull requests</li>
              <li>⚔️ <strong>Code Warrior</strong> - Make 100+ commits</li>
              <li>💯 <strong>Century</strong> - Earn 100+ points</li>
              <li>👑 <strong>Legend</strong> - Earn 500+ points</li>
            </ul>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
