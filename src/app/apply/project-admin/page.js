"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import Link from "next/link";

export default function ProjectAdminApplicationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    github: "",
    linkedin: "",
    previousExperience: "",
    whyJoin: "",
    projectName: "",
    projectGithub: "",
    projectDescription: "",
    techStack: "",
    projectGoals: "",
    contributorExpectations: "",
    mentorSupport: "",
    availability: ""
  });

  // Pre-fill form from URL query parameters if provided
  useEffect(() => {
    if (!searchParams) return;
    const fields = [
      "name",
      "email",
      "github",
      "linkedin",
      "previousExperience",
      "whyJoin",
      "projectName",
      "projectGithub",
      "projectDescription",
      "techStack",
      "projectGoals",
      "contributorExpectations",
      "mentorSupport",
      "availability",
    ];

    const updates = {};
    fields.forEach((f) => {
      const val = searchParams.get(f);
      if (val) updates[f] = val;
    });

    if (Object.keys(updates).length > 0) {
      setFormData((prev) => ({ ...prev, ...updates }));
    }
  }, [searchParams]);

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
        role: "project-admin"
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
      const techStackArray = (formData.techStack || "")
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const response = await fetch("/api/applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: "project-admin",
          ...formData,
          techStack: techStackArray,
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
            <Link href="/apply" className="text-sky-600 hover:text-sky-700 font-bold-custom flex items-center mb-4">
              <span className="material-symbols-outlined mr-2">arrow_back</span>
              Back to Role Selection
            </Link>
            <div className="flex items-center mb-4">
              <div className="p-3 rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 text-white mr-4">
                <span className="material-symbols-outlined text-3xl">admin_panel_settings</span>
              </div>
              <div>
                <h1 className="text-4xl font-bold-custom text-gray-900">Project Admin Application</h1>
                <p className="text-gray-600 font-thin-custom">Join DSoC 2026 as a Project Admin</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Personal Information Section */}
            <div className="border-b border-gray-300 pb-6">
              <h2 className="text-2xl font-bold-custom text-gray-900 mb-4">Personal Information</h2>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
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
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none transition-all text-gray-900 font-thin-custom"
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
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none transition-all text-gray-900 font-thin-custom"
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
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none transition-all text-gray-900 font-thin-custom"
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
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none transition-all text-gray-900 font-thin-custom"
                    placeholder="linkedin.com/in/yourprofile"
                  />
                </div>
              </div>
            </div>

            {/* Project Information Section */}
            <div className="border-b border-gray-300 pb-6">
              <h2 className="text-2xl font-bold-custom text-gray-900 mb-4">Project Information</h2>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label htmlFor="projectName" className="block text-gray-900 font-bold-custom mb-2">
                    Project Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="projectName"
                    name="projectName"
                    required
                    value={formData.projectName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none transition-all text-gray-900 font-thin-custom"
                    placeholder="Your project's name"
                  />
                </div>

                <div>
                  <label htmlFor="projectGithub" className="block text-gray-900 font-bold-custom mb-2">
                    Project GitHub Repository <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    id="projectGithub"
                    name="projectGithub"
                    required
                    value={formData.projectGithub}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none transition-all text-gray-900 font-thin-custom"
                    placeholder="https://github.com/username/project"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label htmlFor="projectDescription" className="block text-gray-900 font-bold-custom mb-2">
                  Project Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="projectDescription"
                  name="projectDescription"
                  rows="5"
                  required
                  value={formData.projectDescription}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none transition-all text-gray-900 font-thin-custom"
                  placeholder="Provide a comprehensive description of your project, its purpose, and target audience..."
                ></textarea>
                <p className="text-sm text-gray-600 font-thin-custom mt-1">Describe what your project does and its impact</p>
              </div>

              <div>
                <label htmlFor="techStack" className="block text-gray-900 font-bold-custom mb-2">
                  Technology Stack <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="techStack"
                  name="techStack"
                  required
                  value={formData.techStack}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none transition-all text-gray-900 font-thin-custom"
                  placeholder="e.g., React, Node.js, MongoDB, Docker, AWS"
                />
                <p className="text-sm text-gray-600 font-thin-custom mt-1">List all technologies, frameworks, and tools used in your project</p>
              </div>
            </div>

            {/* Experience & Goals Section */}
            <div className="border-b border-gray-300 pb-6">
              <h2 className="text-2xl font-bold-custom text-gray-900 mb-4">Experience & Goals</h2>

              <div className="mb-6">
                <label htmlFor="previousExperience" className="block text-gray-900 font-bold-custom mb-2">
                  Previous Open Source Experience <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="previousExperience"
                  name="previousExperience"
                  rows="4"
                  required
                  value={formData.previousExperience}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none transition-all text-gray-900 font-thin-custom"
                  placeholder="Describe your experience maintaining open-source projects, leading teams, or contributing to major projects..."
                ></textarea>
              </div>

              <div className="mb-6">
                <label htmlFor="projectGoals" className="block text-gray-900 font-bold-custom mb-2">
                  Project Goals for DSoC 2026 <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="projectGoals"
                  name="projectGoals"
                  rows="4"
                  required
                  value={formData.projectGoals}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none transition-all text-gray-900 font-thin-custom"
                  placeholder="What do you hope to achieve with your project during this program? List specific milestones and features..."
                ></textarea>
              </div>

              <div>
                <label htmlFor="whyJoin" className="block text-gray-900 font-bold-custom mb-2">
                  Why do you want to be a Project Admin in DSoC 2026? <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="whyJoin"
                  name="whyJoin"
                  rows="5"
                  required
                  value={formData.whyJoin}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none transition-all text-gray-900 font-thin-custom"
                  placeholder="Share your motivation, vision for the project, and how this program aligns with your goals..."
                ></textarea>
              </div>
            </div>

            {/* Management & Support Section */}
            <div className="border-b border-gray-300 pb-6">
              <h2 className="text-2xl font-bold-custom text-gray-900 mb-4">Management & Support</h2>

              <div className="mb-6">
                <label htmlFor="contributorExpectations" className="block text-gray-900 font-bold-custom mb-2">
                  Contributor Expectations <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="contributorExpectations"
                  name="contributorExpectations"
                  rows="4"
                  required
                  value={formData.contributorExpectations}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none transition-all text-gray-900 font-thin-custom"
                  placeholder="How many contributors do you need? What skill levels? What types of contributions are you looking for?"
                ></textarea>
              </div>

              <div className="mb-6">
                <label htmlFor="mentorSupport" className="block text-gray-900 font-bold-custom mb-2">
                  Mentor Support Plan <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="mentorSupport"
                  name="mentorSupport"
                  rows="4"
                  required
                  value={formData.mentorSupport}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none transition-all text-gray-900 font-thin-custom"
                  placeholder="How will you support contributors? Do you have mentors? What onboarding process will you provide?"
                ></textarea>
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
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none transition-all text-gray-900 font-thin-custom"
                >
                  <option value="">Select your availability</option>
                  <option value="10-15">10-15 hours per week</option>
                  <option value="15-20">15-20 hours per week</option>
                  <option value="20-25">20-25 hours per week</option>
                  <option value="25+">25+ hours per week</option>
                </select>
                <p className="text-sm text-gray-600 font-thin-custom mt-1">As a Project Admin, you'll need to manage issues, review PRs, and coordinate with contributors</p>
              </div>
            </div>

            <div className="bg-sky-50 rounded-lg p-4 border border-sky-200">
              <p className="text-gray-700 font-thin-custom text-sm mb-3">
                <span className="material-symbols-outlined text-sky-600 text-lg align-middle mr-2">info</span>
                <strong>Project Admin Commitment:</strong> You commit to:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-700 font-thin-custom text-sm ml-6">
                <li>Maintaining an active, welcoming project environment</li>
                <li>Providing timely reviews and feedback on pull requests</li>
                <li>Creating and maintaining well-documented issues for contributors</li>
                <li>Supporting contributors and mentors throughout the program</li>
                <li>Following the DSoC Code of Conduct</li>
              </ul>
            </div>

            <div className="flex flex-col md:flex-row gap-4 pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-8 py-4 bg-gradient-to-r from-indigo-500 to-sky-500 text-white font-bold-custom rounded-full shadow-lg hover:scale-105 transition-transform duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="flex-1 px-8 py-4 bg-transparent text-sky-600 font-bold-custom rounded-full border-2 border-sky-600 hover:bg-sky-600 hover:text-white transition-all duration-300 text-center"
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
