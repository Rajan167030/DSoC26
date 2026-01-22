"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import Link from "next/link";

export default function MentorApplicationPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    github: "",
    linkedin: "",
    previousExperience: "",
    whyJoin: "",
    expertise: "",
    mentorshipExperience: "",
    availability: "",
    preferredDomains: ""
  });

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
        role: "mentor"
      }),
    });

    const roleCheckData = await roleCheckResponse.json();

    if (roleCheckResponse.ok && roleCheckData.hasOtherRole) {
      toast.error(roleCheckData.message);
      setIsSubmitting(false);
      return;
    }

    try {
      // Normalize expertise into array
      const expertiseArray = (formData.expertise || "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const response = await fetch("/api/applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: "mentor",
          ...formData,
          expertise: expertiseArray,
          submittedAt: new Date().toISOString()
        }),
      });

      const data = await response.json();

      if (response.ok) {
        router.push("/apply/success");
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
            <Link href="/apply" className="text-purple-600 hover:text-purple-700 font-bold-custom flex items-center mb-4">
              <span className="material-symbols-outlined mr-2">arrow_back</span>
              Back to Role Selection
            </Link>
            <div className="flex items-center mb-4">
              <div className="p-3 rounded-full bg-gradient-to-br from-[var(--deep-purple-start)] to-[var(--deep-purple-end)] text-white mr-4">
                <span className="material-symbols-outlined text-3xl">school</span>
              </div>
              <div>
                <h1 className="text-4xl font-bold-custom text-gray-900">Mentor Application</h1>
                <p className="text-gray-600 font-thin-custom">Join DSoC 2026 as a Mentor</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
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
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-gray-900 font-thin-custom"
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
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-gray-900 font-thin-custom"
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
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-gray-900 font-thin-custom"
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
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-gray-900 font-thin-custom"
                  placeholder="linkedin.com/in/yourprofile"
                />
              </div>
            </div>

            <div>
              <label htmlFor="expertise" className="block text-gray-900 font-bold-custom mb-2">
                Areas of Expertise <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="expertise"
                name="expertise"
                required
                value={formData.expertise}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-gray-900 font-thin-custom"
                placeholder="e.g., Web Development, Machine Learning, DevOps"
              />
              <p className="text-sm text-gray-600 font-thin-custom mt-1">List your technical expertise areas (comma-separated)</p>
            </div>

            <div>
              <label htmlFor="preferredDomains" className="block text-gray-900 font-bold-custom mb-2">
                Preferred Mentoring Domains <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="preferredDomains"
                name="preferredDomains"
                required
                value={formData.preferredDomains}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-gray-900 font-thin-custom"
                placeholder="e.g., Frontend, Backend, Mobile Development, AI/ML"
              />
            </div>

            <div>
              <label htmlFor="previousExperience" className="block text-gray-900 font-bold-custom mb-2">
                Professional Experience <span className="text-red-500">*</span>
              </label>
              <textarea
                id="previousExperience"
                name="previousExperience"
                rows="4"
                required
                value={formData.previousExperience}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-gray-900 font-thin-custom"
                placeholder="Describe your professional experience, current role, and relevant achievements..."
              ></textarea>
            </div>

            <div>
              <label htmlFor="mentorshipExperience" className="block text-gray-900 font-bold-custom mb-2">
                Mentorship Experience (Optional)
              </label>
              <textarea
                id="mentorshipExperience"
                name="mentorshipExperience"
                rows="4"
                value={formData.mentorshipExperience}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-gray-900 font-thin-custom"
                placeholder="Share your previous mentoring experience, teaching roles, or community contributions..."
              ></textarea>
            </div>

            <div>
              <label htmlFor="whyJoin" className="block text-gray-900 font-bold-custom mb-2">
                Why do you want to be a mentor in DSoC 2026? <span className="text-red-500">*</span>
              </label>
              <textarea
                id="whyJoin"
                name="whyJoin"
                rows="5"
                required
                value={formData.whyJoin}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-gray-900 font-thin-custom"
                placeholder="Share your motivation to mentor, what you can offer to contributors, and your goals..."
              ></textarea>
              <p className="text-sm text-gray-600 font-thin-custom mt-1">Minimum 100 characters</p>
            </div>

            <div>
              <label htmlFor="availability" className="block text-gray-900 font-bold-custom mb-2">
                Weekly Availability <span className="text-red-500">*</span>
              </label>
              <select
                id="availability"
                name="availability"
                required
                value={formData.availability}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all text-gray-900 font-thin-custom"
              >
                <option value="">Select your availability</option>
                <option value="3-5">3-5 hours per week</option>
                <option value="5-8">5-8 hours per week</option>
                <option value="8-10">8-10 hours per week</option>
                <option value="10+">10+ hours per week</option>
              </select>
              <p className="text-sm text-gray-600 font-thin-custom mt-1">Includes review time, 1:1 sessions, and group mentoring</p>
            </div>

            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <p className="text-gray-700 font-thin-custom text-sm">
                <span className="material-symbols-outlined text-purple-600 text-lg align-middle mr-2">info</span>
                By submitting this application, you commit to providing quality mentorship, timely code reviews, and supporting contributors throughout the program.
              </p>
            </div>

            <div className="flex flex-col md:flex-row gap-4 pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-8 py-4 bg-gradient-to-r from-[var(--deep-purple-start)] to-[var(--deep-purple-end)] text-white font-bold-custom rounded-full shadow-lg hover:scale-105 transition-transform duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="flex-1 px-8 py-4 bg-transparent text-purple-600 font-bold-custom rounded-full border-2 border-purple-600 hover:bg-purple-600 hover:text-white transition-all duration-300 text-center"
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
