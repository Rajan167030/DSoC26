"use client";
import React from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export default function TermsPage() {
  return (
    <div className="bg-black min-h-screen text-gray-200">
      <Navbar />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-12 max-w-7xl">
        <section className="rounded-3xl px-6 md:px-10 py-10 md:py-16 mb-8 border border-white/10 bg-gradient-to-br from-white/3 to-white/2 backdrop-blur-sm">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold mb-3 text-white">Terms & Conditions</h1>
            <p className="text-gray-300 text-lg">Please read these terms before participating.</p>
          </div>
        </section>

        <main className="grid gap-8 lg:grid-cols-3">
          <article className="lg:col-span-2 space-y-6">
            <div className="bg-white/5 border border-white/6 rounded-2xl p-6">
              <h3 className="text-xl font-semibold text-white mb-2">1. Contribution License</h3>
              <p className="text-gray-300 text-sm">
                By contributing, you agree to license your contributions under the project's license (e.g., MIT or Apache-2.0), as stated in the repository.
              </p>
            </div>

            <div className="bg-white/5 border border-white/6 rounded-2xl p-6">
              <h3 className="text-xl font-semibold text-white mb-2">2. Code of Conduct</h3>
              <p className="text-gray-300 text-sm">
                All contributors must adhere to the Code of Conduct. Harassment, hate speech, or abusive behavior is not tolerated.
              </p>
            </div>

            <div className="bg-white/5 border border-white/6 rounded-2xl p-6">
              <h3 className="text-xl font-semibold text-white mb-2">3. No Warranty</h3>
              <p className="text-gray-300 text-sm">
                The software is provided 'as-is'. We disclaim warranties and liabilities to the extent permitted by law.
              </p>
            </div>

            <div className="bg-white/5 border border-white/6 rounded-2xl p-6">
              <h3 className="text-xl font-semibold text-white mb-2">4. Privacy</h3>
              <p className="text-gray-300 text-sm">
                Contributor data handling is described in our Privacy Policy.
              </p>
            </div>
          </article>

          <aside className="space-y-6">
            <div className="bg-white/6 border border-white/8 rounded-2xl p-5">
              <h5 className="text-sm font-semibold text-white mb-2">Quick Links</h5>
              <ul className="space-y-2 text-sm">
                <li><a href="/faq" className="text-gray-300 hover:text-violet-400 transition">FAQs</a></li>
                <li><a href="/privacy" className="text-gray-300 hover:text-violet-400 transition">Privacy Policy</a></li>
                <li><a href="/apply" className="text-gray-300 hover:text-violet-400 transition">Apply</a></li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-5 text-white shadow-lg">
              <h4 className="font-bold-custom text-lg mb-2">Need help?</h4>
              <p className="text-sm">Contact code@elitecoders.xyz for any legal inquiries.</p>
            </div>
          </aside>
        </main>
        <Footer />
      </div>
    </div>
  );
}
