"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";

export default function AnalyticsDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch("/api/analytics");
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-black min-h-screen text-gray-200 flex items-center justify-center">
        <div className="text-center">
          <span className="material-symbols-outlined text-6xl animate-spin text-indigo-500 mb-4">progress_activity</span>
          <p className="text-xl font-bold-custom">Loading Analytics...</p>
        </div>
      </div>
    );
  }

  const approvalRate = stats?.applications.total > 0 
    ? ((stats.applications.approved / stats.applications.total) * 100).toFixed(1)
    : 0;

  const idCardGenerationRate = stats?.applications.approved > 0
    ? ((stats.idCards.total / stats.applications.approved) * 100).toFixed(1)
    : 0;

  const avgDownloadsPerCard = stats?.idCards.total > 0
    ? (stats.idCards.totalDownloads / stats.idCards.total).toFixed(1)
    : 0;

  return (
    <div className="bg-black min-h-screen text-gray-200">
      <Navbar />
      <div className="container mx-auto px-4 pt-32 pb-8 max-w-7xl">

        <div className="bg-white/90 backdrop-blur-md rounded-3xl p-8 md:p-12 shadow-lg border border-white/20 mb-16">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold-custom text-gray-900 mb-2">Analytics Dashboard</h1>
              <p className="text-gray-600 font-thin-custom">Real-time insights and statistics</p>
            </div>
            <button
              onClick={() => router.push("/admin")}
              className="px-6 py-3 bg-indigo-600 text-white rounded-full font-bold-custom hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined">arrow_back</span>
              Back to Admin
            </button>
          </div>

          {/* Key Metrics */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="material-symbols-outlined text-5xl opacity-80">apps</span>
              </div>
              <p className="text-4xl font-bold-custom mb-1">{stats?.applications.total || 0}</p>
              <p className="font-thin-custom text-sm opacity-90">Total Applications</p>
            </div>

            <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="material-symbols-outlined text-5xl opacity-80">check_circle</span>
              </div>
              <p className="text-4xl font-bold-custom mb-1">{stats?.applications.approved || 0}</p>
              <p className="font-thin-custom text-sm opacity-90">Approved ({approvalRate}%)</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="material-symbols-outlined text-5xl opacity-80">badge</span>
              </div>
              <p className="text-4xl font-bold-custom mb-1">{stats?.idCards.total || 0}</p>
              <p className="font-thin-custom text-sm opacity-90">ID Cards Generated</p>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="material-symbols-outlined text-5xl opacity-80">download</span>
              </div>
              <p className="text-4xl font-bold-custom mb-1">{stats?.idCards.totalDownloads || 0}</p>
              <p className="font-thin-custom text-sm opacity-90">Total Downloads</p>
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <h3 className="text-xl font-bold-custom text-gray-900 mb-4 flex items-center">
                <span className="material-symbols-outlined mr-2 text-indigo-600">pie_chart</span>
                Application Status
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <span className="font-thin-custom text-gray-700">Pending</span>
                  <span className="font-bold-custom text-yellow-700">{stats?.applications.pending || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                  <span className="font-thin-custom text-gray-700">Approved</span>
                  <span className="font-bold-custom text-emerald-700">{stats?.applications.approved || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <span className="font-thin-custom text-gray-700">Rejected</span>
                  <span className="font-bold-custom text-red-700">{stats?.applications.rejected || 0}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <h3 className="text-xl font-bold-custom text-gray-900 mb-4 flex items-center">
                <span className="material-symbols-outlined mr-2 text-indigo-600">groups</span>
                Role Distribution
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <span className="font-thin-custom text-gray-700 flex items-center">
                    <span className="material-symbols-outlined text-blue-600 mr-2">code</span>
                    Contributors
                  </span>
                  <span className="font-bold-custom text-blue-700">{stats?.applications.byRole.contributor || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <span className="font-thin-custom text-gray-700 flex items-center">
                    <span className="material-symbols-outlined text-purple-600 mr-2">school</span>
                    Mentors
                  </span>
                  <span className="font-bold-custom text-purple-700">{stats?.applications.byRole.mentor || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-cyan-50 rounded-lg">
                  <span className="font-thin-custom text-gray-700 flex items-center">
                    <span className="material-symbols-outlined text-cyan-600 mr-2">admin_panel_settings</span>
                    Project Admins
                  </span>
                  <span className="font-bold-custom text-cyan-700">{stats?.applications.byRole.projectAdmin || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-200 mb-8">
            <h3 className="text-xl font-bold-custom text-gray-900 mb-4 flex items-center">
              <span className="material-symbols-outlined mr-2 text-indigo-600">speed</span>
              Performance Metrics
            </h3>
            <div className="grid sm:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-4xl font-bold-custom text-indigo-600 mb-2">{approvalRate}%</p>
                <p className="text-sm font-thin-custom text-gray-600">Approval Rate</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold-custom text-purple-600 mb-2">{idCardGenerationRate}%</p>
                <p className="text-sm font-thin-custom text-gray-600">ID Generation Rate</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold-custom text-pink-600 mb-2">{avgDownloadsPerCard}</p>
                <p className="text-sm font-thin-custom text-gray-600">Avg Downloads/Card</p>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <h3 className="text-xl font-bold-custom text-gray-900 mb-4 flex items-center">
                <span className="material-symbols-outlined mr-2 text-emerald-600">history</span>
                Recent Applications
              </h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {stats?.recent.applications?.map((app, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex-1">
                      <p className="font-bold-custom text-gray-900 text-sm">{app.name}</p>
                      <p className="text-xs text-gray-600 font-thin-custom">{app.email}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold-custom ${
                        app.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                        app.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {app.status}
                      </span>
                    </div>
                  </div>
                ))}
                {(!stats?.recent.applications || stats.recent.applications.length === 0) && (
                  <p className="text-center text-gray-500 py-4 font-thin-custom">No applications yet</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <h3 className="text-xl font-bold-custom text-gray-900 mb-4 flex items-center">
                <span className="material-symbols-outlined mr-2 text-purple-600">badge</span>
                Recent ID Cards
              </h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {stats?.recent.idCards?.map((card, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex-1">
                      <p className="font-bold-custom text-gray-900 text-sm">{card.name}</p>
                      <p className="text-xs text-gray-600 font-thin-custom">{card.idNumber}</p>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <span className="material-symbols-outlined text-gray-500 text-sm">download</span>
                      <span className="text-sm font-bold-custom text-gray-700">{card.downloadCount || 0}</span>
                    </div>
                  </div>
                ))}
                {(!stats?.recent.idCards || stats.recent.idCards.length === 0) && (
                  <p className="text-center text-gray-500 py-4 font-thin-custom">No ID cards generated yet</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
}
