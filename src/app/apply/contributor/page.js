"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import useAuth from "@/hooks/useAuth";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import Link from "next/link";

export default function ContributorApplicationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { user: authUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    github: "",
    linkedin: "",
    college: "",
    graduationYear: "",
    techStack: "",
    experienceLevel: "",
    whyContribute: ""
  });

  // Pre-fill form with OAuth data or URL params
  useEffect(() => {
    const prefill = searchParams.get('prefill');
    const nameParam = searchParams.get('name');
    const emailParam = searchParams.get('email');

    // if user profile already exists with this email then redirect to profile page
    const emailToUse = authUser?.email || session?.user?.email || emailParam || '';
    if (emailToUse) {
      (async () => {
        try {
          const res = await fetch(`/api/profile?email=${encodeURIComponent(emailToUse)}`);
            if (res.ok) {
            const data = await res.json();
            const user = data?.user;
            const derivedUsername = user?.username;
            const isLoggedIn = !!(authUser || session?.user);

            const redirectTo = isLoggedIn
              ? (user?.isApproved && derivedUsername ? `/profile/${derivedUsername}` : "/apply/success")
              : "/login";

            if (redirectTo) {
              router.push(redirectTo);
              return; // stop further prefill when redirecting
            }
            }
        } catch (e) {
          // silently ignore; user can continue filling the form
          console.warn('Profile lookup failed, continuing with form.', e);
        }
      })();
    }

    if (authUser || session?.user || (prefill && (nameParam || emailParam))) {

      setFormData(prev => ({
        ...prev,
        name: authUser?.name || session?.user?.name || nameParam || prev.name,
        email: authUser?.email || session?.user?.email || emailParam || prev.email,
        github: (authUser?.username || authUser?.name || session?.user?.name || '')
          .toLowerCase()
          .replace(/\s+/g, '') || prev.github // Guess GitHub username
      }));
    }
  }, [authUser, session, searchParams]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // restricting if already in other role
    const roleCheckResponse = await fetch("/api/check-multiple-roles", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: formData.email,
        role: "contributor"
      }),
    });

    const roleCheckData = await roleCheckResponse.json();

    if (roleCheckResponse.ok && roleCheckData.hasOtherRole) {
      toast.error(roleCheckData.message);
      setIsSubmitting(false);
      return;
    }

    try {
      // Convert techStack string to array
      const techStackArray = formData.techStack
        .split(',')
        .map(tech => tech.trim())
        .filter(Boolean);

      const response = await fetch("/api/applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: "contributor",
          ...formData,
          techStack: techStackArray,
          submittedAt: new Date().toISOString()
        }),
      });

      const data = await response.json();

      if (response.ok) {
        router.push("/apply/success");
        // set in localStorage
        localStorage.setItem("ecwoc_application_email", formData.email);
        localStorage.setItem("ecwoc_application_id", data.applicationId);
      } else {
        // Show the actual error message from the server
        toast.error(data.message || "Failed to submit application. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting application:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-black min-h-screen text-gray-200">
      <Navbar />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-32 pb-8 max-w-7xl">

        <div className="bg-white/90 backdrop-blur-md rounded-3xl p-8 md:p-12 shadow-lg border border-white/20 mb-16">
          <div className="mb-8">
            <Link href="/apply" className="text-indigo-600 hover:text-indigo-700 font-bold-custom flex items-center mb-4">
              <span className="material-symbols-outlined mr-2">arrow_back</span>
              Back to Role Selection
            </Link>
            <div className="flex items-center mb-4">
              <div className="p-3 rounded-full bg-gradient-to-br from-[var(--deep-blue-start)] to-[var(--deep-blue-end)] text-white mr-4">
                <span className="material-symbols-outlined text-3xl">code</span>
              </div>
              <div>
                <h1 className="text-4xl font-bold-custom text-gray-900">Contributor Application</h1>
                <p className="text-gray-600 font-thin-custom">Join DSoC 2026 as a Contributor</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {session?.user && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-6">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-green-600">check_circle</span>
                  <div>
                    <p className="text-green-800 font-semibold">Signed in with {session.user.email}</p>
                    <p className="text-green-700 text-sm">Some fields have been auto-filled from your account</p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-gray-900 font-bold-custom mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-gray-900 font-thin-custom"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-gray-900 font-bold-custom mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-gray-900 font-thin-custom"
                  placeholder="your.email@example.com"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="github" className="block text-gray-900 font-bold-custom mb-2">
                  GitHub Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="github"
                  name="github"
                  required
                  value={formData.github}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-gray-900 font-thin-custom"
                  placeholder="github.com/yourusername"
                />
              </div>

              <div>
                <label htmlFor="linkedin" className="block text-gray-900 font-bold-custom mb-2">
                  LinkedIn Profile <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="linkedin"
                  name="linkedin"
                  required
                  value={formData.linkedin}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-gray-900 font-thin-custom"
                  placeholder="linkedin.com/in/yourprofile"
                />
              </div>
            </div>

            <div>
              <label htmlFor="techStack" className="block text-gray-900 font-bold-custom mb-2">
                Tech Stack <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="techStack"
                name="techStack"
                required
                value={formData.techStack}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-gray-900 font-thin-custom"
                placeholder="e.g., JavaScript, React, Python, Node.js"
              />
              <p className="text-sm text-gray-600 font-thin-custom mt-1">List your programming languages and technologies (comma-separated)</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="college" className="block text-gray-900 font-bold-custom mb-2">
                  College/University <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="college"
                  name="college"
                  required
                  value={formData.college}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-gray-900 font-thin-custom"
                  placeholder="Your institution name"
                />
              </div>

              <div>
                <label htmlFor="graduationYear" className="block text-gray-900 font-bold-custom mb-2">
                  Graduation Year <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="graduationYear"
                  name="graduationYear"
                  required
                  value={formData.graduationYear}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-gray-900 font-thin-custom"
                  placeholder="e.g., 2025 or 2026"
                />
              </div>
            </div>

            <div>
              <label htmlFor="experienceLevel" className="block text-gray-900 font-bold-custom mb-2">
                Experience Level <span className="text-red-500">*</span>
              </label>
              <select
                id="experienceLevel"
                name="experienceLevel"
                required
                value={formData.experienceLevel}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-gray-900 font-thin-custom"
              >
                <option value="">Select your experience level</option>
                <option value="Beginner">Beginner - Just starting with open source</option>
                <option value="Intermediate">Intermediate - Some open source experience</option>
                <option value="Advanced">Advanced - Regular open source contributor</option>
              </select>
            </div>

            <div>
              <label htmlFor="whyContribute" className="block text-gray-900 font-bold-custom mb-2">
                Why do you want to contribute to DSoC 2026? <span className="text-red-500">*</span>
              </label>
              <textarea
                id="whyContribute"
                name="whyContribute"
                rows="5"
                required
                value={formData.whyContribute}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-gray-900 font-thin-custom"
                placeholder="Share your motivation, goals, and what you hope to achieve through this program..."
              ></textarea>
              <p className="text-sm text-gray-600 font-thin-custom mt-1">Minimum 100 characters</p>
            </div>

            <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
              <p className="text-gray-700 font-thin-custom text-sm">
                <span className="material-symbols-outlined text-indigo-600 text-lg align-middle mr-2">info</span>
                By submitting this application, you agree to follow the DSoC Code of Conduct and commit to active participation throughout the program.
              </p>
            </div>

            <div className="flex flex-col md:flex-row gap-4 pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-8 py-4 bg-gradient-to-r from-[var(--deep-blue-start)] to-[var(--deep-blue-end)] text-white font-bold-custom rounded-full shadow-lg hover:scale-105 transition-transform duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
                    Submitting...
                  </span>
                ) : (
                  "Submit Application"
                )}
              </button>
              <Link
                href="/apply"
                className="flex-1 px-8 py-4 bg-transparent text-indigo-600 font-bold-custom rounded-full border-2 border-indigo-600 hover:bg-indigo-600 hover:text-white transition-all duration-300 text-center"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>

        <Footer />
      </div>
    </div>
  );
}
