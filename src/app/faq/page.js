"use client";
import React from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export default function FaqPage() {
  return (
    <div className="bg-black min-h-screen text-gray-200">
      <Navbar />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-12 max-w-7xl">
        <section className="relative rounded-3xl px-6 md:px-10 py-10 md:py-16 mb-8 border border-white/10 bg-gradient-to-br from-white/3 to-white/2 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-5xl font-bold mb-3 text-white">
              Frequently Asked Questions
            </h1>
            <p className="text-gray-300 text-lg">
              Quick answers for contributors, mentors and curious visitors.
            </p>
          </div>
        </section>

        <main className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Q&A cards */}
            {[
              {
                q: "How can I contribute?",
                a: "Fork the repo, create a branch, implement the change and open a PR. Follow CONTRIBUTING.md and the issue templates.",
              },
              {
                q: "Do I need prior experience?",
                a: "No. We provide beginner-friendly issues and mentorship. Look for 'good-first-issue' tags to start.",
              },
              {
                q: "Are there certificates or recognition?",
                a: "Yes — active contributors receive certificates and community recognition based on quality and consistency.",
              },
              {
                q: "How long does the program run?",
                a: "The typical cohort runs for 8–12 weeks with milestones for onboarding, contribution, and evaluation.",
              },
            ].map((item) => (
              <details
                key={item.q}
                className="group bg-white/5 border border-white/6 rounded-2xl p-5 open:shadow-md"
              >
                <summary className="cursor-pointer flex items-center justify-between gap-4">
                  <h3 className="text-lg font-semibold text-white">{item.q}</h3>
                  <span className="text-sm text-gray-400 group-open:rotate-45 transition-transform">+</span>
                </summary>
                <div className="mt-3 text-gray-300 text-sm leading-relaxed">{item.a}</div>
              </details>
            ))}
          </div>

          <aside className="space-y-6">
            <div className="bg-white/6 border border-white/8 rounded-2xl p-5">
              <h4 className="font-bold-custom text-lg text-white mb-3">Need help?</h4>
              <p className="text-sm text-gray-300 mb-4">
                If your question isn't listed, open a discussion on GitHub or reach out on our community channel.
              </p>
              <div className="flex gap-3">
                <a
                  href="/apply"
                  className="inline-flex items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow"
                >
                  Apply
                </a>
                <a
                  href="/team"
                  className="inline-flex items-center justify-center rounded-full border border-white/10 px-4 py-2 text-sm text-white/80"
                >
                  Join Community
                </a>
              </div>
            </div>

            <div className="bg-white/6 border border-white/8 rounded-2xl p-5">
              <h5 className="text-sm font-semibold text-white mb-2">Quick Links</h5>
              <ul className="space-y-2 text-sm">
                <li><a href="/faq" className="text-gray-300 hover:text-violet-400 transition">All FAQs</a></li>
                <li><a href="/terms" className="text-gray-300 hover:text-violet-400 transition">Terms & Conditions</a></li>
                <li><a href="/privacy" className="text-gray-300 hover:text-violet-400 transition">Privacy Policy</a></li>
              </ul>
            </div>
          </aside>
        </main>


        <Footer />
      </div>
    </div>
  );
}
