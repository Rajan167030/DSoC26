"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import Link from "next/link";

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const [confettiActive, setConfettiActive] = useState(true);
  const applicationId = searchParams.get("applicationId");
  const email = searchParams.get("email");

  useEffect(() => {
    // Disable confetti after 5 seconds
    const timer = setTimeout(() => {
      setConfettiActive(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="bg-black min-h-screen text-gray-200">
      <Navbar />
      <div className="container mx-auto px-4 pt-32 pb-8 max-w-7xl">

        <div className="bg-white/90 backdrop-blur-md rounded-3xl p-8 md:p-12 shadow-lg border border-white/20 mb-16 text-center">
          {/* Success Icon */}
          <div className="mb-8">
            <div className="inline-flex p-6 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 text-white animate-bounce">
              <span className="material-symbols-outlined text-6xl">check_circle</span>
            </div>
          </div>

          {/* Success Message */}
          <h1 className="text-4xl md:text-5xl font-bold-custom text-gray-900 mb-4">
            Application Submitted Successfully!
          </h1>
          
          <p className="text-xl text-gray-700 font-thin-custom mb-8 max-w-2xl mx-auto">
            Thank you for applying to DSoC 2026. Your application has been received and will be reviewed by our team.
          </p>

          {/* Application ID Section */}
          {applicationId && (
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 border-2 border-purple-300 rounded-xl p-6 mb-8 max-w-2xl mx-auto">
              <p className="text-sm text-gray-600 mb-2">Your Application ID</p>
              <p className="text-3xl font-bold text-purple-900 font-mono mb-3">{applicationId}</p>
              <p className="text-sm text-gray-700">
                ⚠️ <strong>Save this ID!</strong> You'll need it along with your email to login and check your application status.
              </p>
            </div>
          )}

          {email && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 max-w-2xl mx-auto">
              <p className="text-sm text-blue-800">
                📧 Confirmation email sent to <strong>{email}</strong>
              </p>
            </div>
          )}

          {/* Login Button */}
          {applicationId && (
            <div className="mb-8">
              <Link
                href="/login"
                className="inline-block px-8 py-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold-custom rounded-full shadow-lg hover:scale-105 transition-transform duration-300"
              >
                Login to View Your Application →
              </Link>
            </div>
          )}

          {/* What's Next Section */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-8 mb-8 text-left">
            <h2 className="text-2xl font-bold-custom text-gray-900 mb-6 text-center">What Happens Next?</h2>
            
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold-custom text-lg mr-4">
                  1
                </div>
                <div className="flex-1">
                  <h3 className="font-bold-custom text-lg text-gray-900 mb-1">Confirmation Email</h3>
                  <p className="text-gray-600 font-thin-custom">
                    You'll receive a confirmation email within 24 hours at the email address you provided.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold-custom text-lg mr-4">
                  2
                </div>
                <div className="flex-1">
                  <h3 className="font-bold-custom text-lg text-gray-900 mb-1">Application Review</h3>
                  <p className="text-gray-600 font-thin-custom">
                    Our team will carefully review your application. This process typically takes 5-7 business days.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold-custom text-lg mr-4">
                  3
                </div>
                <div className="flex-1">
                  <h3 className="font-bold-custom text-lg text-gray-900 mb-1">Selection Notification</h3>
                  <p className="text-gray-600 font-thin-custom">
                    You'll be notified about your application status via email. Selected candidates will receive onboarding instructions.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold-custom text-lg mr-4">
                  4
                </div>
                <div className="flex-1">
                  <h3 className="font-bold-custom text-lg text-gray-900 mb-1">Program Kickoff</h3>
                  <p className="text-gray-600 font-thin-custom">
                    Join the DSoC 2026 community and start your open-source journey with us!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Important Information */}
          <div className="bg-blue-50 rounded-lg p-6 mb-8 text-left border border-blue-200">
            <div className="flex items-start">
              <span className="material-symbols-outlined text-blue-600 text-2xl mr-3 flex-shrink-0">info</span>
              <div>
                <h3 className="font-bold-custom text-lg text-gray-900 mb-2">Important Information</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 font-thin-custom">
                  <li>Check your email regularly for updates and communication from our team</li>
                  <li>Make sure to check your spam folder if you don't receive a confirmation email</li>
                  <li>Join our community Discord server to stay connected (link in confirmation email)</li>
                  <li>Follow us on social media for the latest updates and announcements</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="px-8 py-4 bg-gradient-to-r from-[var(--deep-blue-start)] to-[var(--deep-purple-end)] text-white font-bold-custom rounded-full shadow-lg hover:scale-105 transition-transform duration-300 text-center"
            >
              Return to Home
            </Link>
            <a
              href="https://discord.gg/eMTePUK3gJ"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-transparent text-indigo-600 font-bold-custom rounded-full border-2 border-indigo-600 hover:bg-indigo-600 hover:text-white transition-all duration-300 text-center"
            >
              Join Discord Community
            </a>
          </div>

          {/* Social Share */}
          <div className="mt-8 pt-8 border-t border-gray-300">
            <p className="text-gray-700 font-bold-custom mb-4">Share your application!</p>
            <div className="flex justify-center gap-4">
              <a
                href="https://twitter.com/intent/tweet?text=I%20just%20applied%20to%20DSoC%202026!%20Join%20me%20in%20this%20amazing%20open-source%20journey.%20%23DSoC2026%20%23OpenSource"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-sky-500 text-white rounded-full hover:bg-sky-600 transition-colors"
              >
                <span className="material-symbols-outlined">share</span>
              </a>
              <a
                href="https://www.linkedin.com/sharing/share-offsite/?url=YOUR_WEBSITE_URL"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
              >
                <span className="material-symbols-outlined">work</span>
              </a>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
}
