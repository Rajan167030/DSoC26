"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import Footer from "@/components/Footer";
import useAuth from "../../hooks/useAuth";

export default function MyApplicationPage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  // useEffect(() => {
  //   const userData = localStorage.getItem("ecwoc_user");
  //   if (!userData) {
  //     router.push("/login");
  //     return;
  //   }
  //   setUser(JSON.parse(userData));
  //   setLoading(false);
  // }, [router]);



  const getStatusBadge = (status) => {
    switch (status) {
      case "approved":
        return <span className="px-4 py-2 bg-emerald-100 text-emerald-800 rounded-full text-sm font-bold">✓ APPROVED</span>;
      case "rejected":
        return <span className="px-4 py-2 bg-red-100 text-red-800 rounded-full text-sm font-bold">✗ REJECTED</span>;
      default:
        return <span className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm font-bold">⏳ PENDING</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-32 pb-12 max-w-7xl relative">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -top-16 -left-8 w-72 h-72 bg-purple-700/10 rounded-full blur-3xl transform rotate-45"></div>
        <div className="pointer-events-none absolute -bottom-24 -right-16 w-96 h-96 bg-indigo-700/10 rounded-full blur-3xl"></div>

        <div className="max-w-4xl mx-auto">
          <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl ring-1 ring-white/6 transition-all duration-700 transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-6 gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                  My Application
                </h1>
                <p className="mt-1 text-sm text-slate-300 max-w-lg">
                  Overview of your application status, ID and next steps. Keep an eye here for updates and quick actions.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push("/")}
                  className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-white/6 text-slate-100 border border-white/8 rounded-lg hover:bg-white/8 transition"
                >
                  ← Back
                </button>
                <button
                  onClick={logout}
                  className="px-3 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition shadow-sm"
                >
                  Logout
                </button>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between p-5 bg-gradient-to-r from-white/6 to-white/3 rounded-xl border border-white/8 shadow-sm transition-transform transform hover:scale-[1.01]">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">{user?.name || "—"}</h2>
                  <p className="text-sm text-slate-300 flex items-center gap-2">
                    <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none"><path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM3 21a9 9 0 0 1 18 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    {user?.email || "No email"}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="transform transition-all duration-500">{getStatusBadge(user?.status)}</div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-5 bg-white/3 rounded-xl border border-white/6 transition hover:shadow-xl hover:-translate-y-1">
                  <p className="text-xs text-slate-300 mb-1">Application ID</p>
                  <p className="font-mono font-semibold text-lg text-white">{user?.applicationId || "—"}</p>
                </div>
                <div className="p-5 bg-white/3 rounded-xl border border-white/6 transition hover:shadow-xl hover:-translate-y-1">
                  <p className="text-xs text-slate-300 mb-1">Role</p>
                  <p className="font-semibold text-lg text-white capitalize">{user?.role?.replace("-", " ") || "—"}</p>
                </div>
              </div>

              {user?.status === "approved" && (
                <div className="p-6 bg-gradient-to-r from-emerald-900/40 to-emerald-800/30 border border-emerald-400/10 rounded-2xl">
                  <div className="flex items-start gap-5">
                    <div className="w-14 h-10 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg transform transition-transform motion-reduce:transform-none animate-bounce">
                      <span className="material-symbols-outlined text-white text-3xl">check_circle</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-1">🎉 Congratulations — Approved!</h3>
                      <p className="text-emerald-100 mb-4">Your application is approved. You can view your public profile or generate an ID card to get started.</p>
                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={() => router.push(`/profile/${user?.email.split("@")[0].toLowerCase()}`)}
                          className="px-5 py-3 bg-emerald-500 text-white rounded-lg font-semibold hover:bg-emerald-600 transition shadow"
                        >
                          View My Profile →
                        </button>
                        <button
                          onClick={() => router.push("/id-card/generate")}
                          className="px-5 py-3 bg-violet-600 text-white rounded-lg font-semibold hover:bg-violet-700 transition shadow"
                        >
                          Generate ID Card
                        </button>
                        <button
                          onClick={() => navigator.clipboard?.writeText(window.location.origin + `/profile/${user?.username}`)}
                          className="px-4 py-3 bg-white/6 text-white rounded-lg hover:bg-white/8 transition"
                        >
                          Copy Profile Link
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {user?.status === "pending" && (
                <div className="p-6 bg-gradient-to-r from-yellow-900/30 to-yellow-800/20 border border-yellow-400/10 rounded-2xl">
                  <div className="flex items-start gap-5">
                    <div className="w-14 h-10 bg-yellow-500 rounded-full flex items-center justify-center shadow-md">
                      <span className="material-symbols-outlined text-white text-3xl">schedule</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">Application Under Review</h3>
                      <p className="text-yellow-100">Our team is reviewing your application. We'll notify you by email when a decision is made. Meanwhile, you can explore contributor resources.</p>
                    </div>
                  </div>
                </div>
              )}

              {user?.status === "rejected" && (
                <div className="p-6 bg-gradient-to-r from-rose-900/30 to-rose-800/20 border border-rose-400/10 rounded-2xl">
                  <div className="flex items-start gap-5">
                    <div className="w-14 h-10 bg-rose-500 rounded-full flex items-center justify-center shadow-md">
                      <span className="material-symbols-outlined text-white text-3xl">cancel</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">Application Not Selected</h3>
                      <p className="text-rose-100">We're sorry — your application wasn't selected this time. We encourage you to apply again and continue contributing to open source. See suggestions below to strengthen future applications.</p>
                      <div className="mt-4 flex gap-3">
                        <button
                          onClick={() => router.push("/apply")}
                          className="px-4 py-2 bg-white/6 text-white rounded-md hover:bg-white/8 transition"
                        >
                          Re-apply
                        </button>
                        <button
                          onClick={() => router.push("/resources")}
                          className="px-4 py-2 bg-rose-500 text-white rounded-md hover:bg-rose-600 transition"
                        >
                          Resources & Tips
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
