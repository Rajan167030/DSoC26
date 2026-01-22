"use client";
import React from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export default function PrivacyPage() {
  return (
    <div className="bg-black min-h-screen text-gray-200">
      <Navbar />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-12 max-w-7xl">
        <section className="rounded-3xl px-6 md:px-10 py-10 md:py-16 mb-8 border border-white/10 bg-gradient-to-br from-white/3 to-white/2 backdrop-blur-sm">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold mb-3 text-white">Privacy Policy</h1>
            <p className="text-gray-300 text-lg">Last updated: Dec 1, 2025</p>
          </div>
        </section>

        <main className="grid gap-8 lg:grid-cols-3">
          <article className="lg:col-span-2 space-y-6">
            <div className="bg-white/5 border border-white/6 rounded-2xl p-6">
              <h3 className="text-xl font-semibold text-white mb-2">What we collect</h3>
              <p className="text-gray-300 text-sm">
                We collect minimal data required to provide the contribution experience: public profile data (GitHub username), optional contact email, and contribution metadata. We do not sell personal data.
              </p>
              <ul className="list-disc pl-5 mt-3 text-sm text-gray-300">
                <li>Profile & public account information</li>
                <li>PR and issue metadata for leaderboard & recognition</li>
                <li>Optional contact emails for notifications</li>
              </ul>
            </div>

            <div className="bg-white/5 border border-white/6 rounded-2xl p-6">
              <h3 className="text-xl font-semibold text-white mb-2">How we use data</h3>
              <p className="text-gray-300 text-sm">
                Data is used to power contributor dashboards, send updates, and evaluate eligibility for recognition and certificates.
              </p>
            </div>

            <div className="bg-white/5 border border-white/6 rounded-2xl p-6">
              <h3 className="text-xl font-semibold text-white mb-2">Contact</h3>
              <p className="text-gray-300 text-sm">
                Questions? Email <a href="mailto:code@elitecoders.xyz" className="text-violet-400 underline">code@elitecoders.xyz</a>.
              </p>
            </div>
          </article>

          <aside className="space-y-6">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-5 text-white shadow-lg">
              <h4 className="font-bold-custom text-lg mb-2">Privacy at a glance</h4>
              <p className="text-sm">Minimal data collection · No selling · Contributor-first approach</p>
            </div>

            <div className="bg-white/6 border border-white/8 rounded-2xl p-5">
              <h5 className="text-sm font-semibold text-white mb-2">Quick Links</h5>
              <ul className="space-y-2 text-sm">
                <li><a href="/terms" className="text-gray-300 hover:text-violet-400 transition">Terms & Conditions</a></li>
                <li><a href="/faq" className="text-gray-300 hover:text-violet-400 transition">FAQs</a></li>
                <li><a href="/apply" className="text-gray-300 hover:text-violet-400 transition">Apply</a></li>
              </ul>
            </div>
          </aside>
        </main>


        <Footer />
      </div>
    </div>
  );
}
