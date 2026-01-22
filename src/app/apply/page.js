"use client";

import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ApplyPage() {
  const router = useRouter();

  useEffect(() => {
    // if these thing is in localStorage then redirect to /my-application page
    // "ecwoc_application_email"
    // "ecwoc_application_id"
    if (typeof window !== "undefined") {
      const email = localStorage.getItem("ecwoc_application_email");
      const applicationId = localStorage.getItem("ecwoc_application_id");
      if (email && applicationId) {
        router.push("/my-application");
      }
    }
  }, [router]);

  const roles = [
    {
      title: "Contributor",
      icon: "code",
      gradient: "from-[var(--deep-blue-start)] to-[var(--deep-blue-end)]",
      description: "Join as a contributor to work on open-source projects, learn from experienced mentors, and make meaningful contributions to real-world applications.",
      responsibilities: [
        "Work on assigned issues and features",
        "Collaborate with project maintainers",
        "Learn and grow through code reviews",
        "Contribute to documentation and testing"
      ],
      href: "/apply/contributor"
    },
    {
      title: "Mentor",
      icon: "school",
      gradient: "from-[var(--deep-purple-start)] to-[var(--deep-purple-end)]",
      description: "Guide and support contributors throughout their journey, share your expertise, and help build the next generation of open-source developers.",
      responsibilities: [
        "Guide contributors on technical challenges",
        "Review pull requests and provide feedback",
        "Conduct weekly mentorship sessions",
        "Help contributors achieve their goals"
      ],
      href: "/apply/mentor"
    },
    {
      title: "Project Admin",
      icon: "admin_panel_settings",
      gradient: "from-indigo-500 to-sky-500",
      description: "Lead your open-source project through DSoC, manage contributors and mentors, and grow your project's community while making a lasting impact.",
      responsibilities: [
        "Manage project roadmap and milestones",
        "Coordinate with mentors and contributors",
        "Define project scope and requirements",
        "Ensure project quality and timely delivery"
      ],
      href: "/apply/project-admin"
    }
  ];

  return (
    <div className="bg-black min-h-screen text-gray-200">
      <Navbar />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-32 pb-8 max-w-7xl">
        <div className="text-center py-8 mb-16">
          <h1 className="text-4xl md:text-6xl font-bold-custom text-white mb-4">
            Apply to <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-700 to-[var(--deep-purple-end)]">DSoC 2026</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 font-thin-custom max-w-3xl mx-auto">
            Choose your role and start your journey in open-source contribution
          </p>
        </div>

        <section className="mb-16">
          <div className="grid md:grid-cols-3 gap-8">
            {roles.map((role, index) => (
              <div key={index} className="bg-white/90 backdrop-blur-md rounded-3xl p-8 shadow-lg border border-white/20 transform hover:scale-105 transition-transform duration-300 flex flex-col">
                <div className={`p-4 rounded-full inline-flex mb-6 bg-gradient-to-br ${role.gradient} text-white self-center`}>
                  <span className="material-symbols-outlined text-4xl">{role.icon}</span>
                </div>
                
                <h2 className="font-bold-custom text-3xl text-gray-900 mb-4 text-center">{role.title}</h2>
                
                <p className="font-thin-custom text-gray-700 leading-relaxed mb-6 text-center flex-grow">
                  {role.description}
                </p>
                
                <div className="mb-6">
                  <h3 className="font-bold-custom text-lg text-gray-900 mb-3">Key Responsibilities:</h3>
                  <ul className="space-y-2">
                    {role.responsibilities.map((resp, idx) => (
                      <li key={idx} className="flex items-start text-gray-700">
                        <span className="material-symbols-outlined text-emerald-500 text-xl mr-2 flex-shrink-0">check_circle</span>
                        <span className="font-thin-custom text-sm">{resp}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link 
                  href={role.href}
                  className={`px-8 py-3 bg-gradient-to-r ${role.gradient} text-white font-bold-custom rounded-full shadow-lg hover:scale-105 transition-transform duration-300 text-center mt-auto`}
                >
                  Apply as {role.title}
                </Link>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white/90 backdrop-blur-md rounded-3xl p-8 mb-16 shadow-lg border border-white/20">
          <h2 className="text-3xl font-bold-custom text-gray-900 mb-6 text-center">Application Timeline</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold-custom text-xl mx-auto mb-3">1</div>
              <h3 className="font-bold-custom text-lg text-gray-900 mb-2">Choose Role</h3>
              <p className="font-thin-custom text-sm text-gray-600">Select the role that best fits your goals</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold-custom text-xl mx-auto mb-3">2</div>
              <h3 className="font-bold-custom text-lg text-gray-900 mb-2">Fill Application</h3>
              <p className="font-thin-custom text-sm text-gray-600">Complete the application form with your details</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold-custom text-xl mx-auto mb-3">3</div>
              <h3 className="font-bold-custom text-lg text-gray-900 mb-2">Review Process</h3>
              <p className="font-thin-custom text-sm text-gray-600">Our team will review your application</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold-custom text-xl mx-auto mb-3">4</div>
              <h3 className="font-bold-custom text-lg text-gray-900 mb-2">Get Started</h3>
              <p className="font-thin-custom text-sm text-gray-600">Receive confirmation and start your journey</p>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </div>
  );
}
