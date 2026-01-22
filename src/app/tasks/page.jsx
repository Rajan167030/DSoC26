"use client";

import { motion } from "framer-motion";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { fadeInUp } from "@/lib/motionVariants";
import Link from "next/link";

export default function TasksPage() {
  // Logged-in view
  return (
    <>
      {/* Navbar */}
      <Navbar />
      <div className="min-h-screen pt-32 pb-20 px-6 text-white max-w-screen flex flex-col justify-center items-center gap-3 mx-auto">
        <motion.h1
          variants={fadeInUp}
          className="text-5xl md:text-6xl font-bold-custom text-white mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent"
        >
          Your <span className="italic text-indigo-500">tasks.</span>
        </motion.h1>
        <motion.p
          variants={fadeInUp}
          className="text-xl text-gray-400 font-thin-custom max-w-3xl mx-auto"
        >
          Complete tasks to earn DSoC points. More tasks from CPs will be added
          soon!
        </motion.p>
        {/* Main Content */}

        {/* ================= NEW TASK 1 - 50 POINTS ================= */}
       
        {/* ================= NEW TASK 2 - 50 POINTS ================= */}
        
        <div
          className="w-full max-w-5xl mb-10 p-6 rounded-xl 
                  border border-pink-500/40 bg-gradient-to-br from-pink-500/10 to-blue-500/10 backdrop-blur
                  "
        >
          <div className="flex items-start justify-between mb-3">
            <h2 className="text-2xl md:text-3xl font-semibold">
              ✨ Duality ai Registration [Mandatory Task]
            </h2>
            <span className="px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r from-pink-500 to-blue-500 text-white">
              +50 Points
            </span>
          </div>
         
          <p className="text-gray-300 mb-4">
            Duality AI registration task is a task for the participants of DSoC 2026 in which participants can participate and earn {" "}
            <strong className="text-pink-400">50 points</strong> on successful
            completion and verification!
          </p>

          <ul className="list-disc list-inside text-gray-300 mb-4 space-y-1">
            <li>Complete the registration in the form and submit proof</li>
            <li>Submit accurate information and wait for validation</li>
            <li>Only validated entries will receive rewards! 🎉</li>
          </ul>

          <a
            href="https://forms.gle/4r1feEgXjgeM6C6g9"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 
                       bg-gradient-to-r from-purple-500 to-violet-500 hover:from-pink-600 hover:to-blue-600
                       transition rounded-full font-semibold text-white shadow-lg"
          >
            📋 Fill completion form
          </a>
        </div>

        {/*         
         <div
          className="w-full max-w-5xl my-10 p-6 rounded-xl 
                  border border-purple-500/40 bg-gradient-to-br from-purple-500/10 to-violet-500/10 backdrop-blur
                  "
        >
          <div className="flex items-start justify-between mb-3">
            <h2 className="text-2xl md:text-3xl font-semibold">
              🎯 Daytona Task Submission [Easy - 1 Min]
            </h2>
            <span className="px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r from-purple-500 to-violet-500 text-white">
              +40 Points
            </span>
          </div>

          <p className="text-gray-300 mb-4">
            This form is used to track participation in Daytona task under Devnovate
            Summer of Code (DSoC). Please ensure the details and
            screenshots provided are accurate. Earn{" "}
            <strong className="text-purple-400">40 points</strong> on successful
            completion and verification!
          </p>

          <ul className="list-disc list-inside text-gray-300 mb-4 space-y-1">
            <li>Complete the required Daytona task</li>
            <li>Provide accurate details and screenshots</li>
            <li>Submit the form and wait for verification</li>
            <li>
              ⚠️ Incorrect or fake submissions may lead to disqualification
            </li>
          </ul>

          <a
            href="https://forms.gle/fE2zLHhBcyuDV8dB7"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 
                       bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600
                       transition rounded-full font-semibold text-white shadow-lg"
          >
            📝 Fill daytona Task Form
          </a>
        </div>
        */}
          {/*
        <div
          className="w-full max-w-5xl my-10 p-6 rounded-xl 
                  border border-purple-500/40 bg-gradient-to-br from-purple-500/10 to-violet-500/10 backdrop-blur
                  "
        >
          <div className="flex items-start justify-between mb-3">
            <h2 className="text-2xl md:text-3xl font-semibold">
              🎯 Keploy Tasks Submission 
            </h2>
            <span className="px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r from-purple-500 to-violet-500 text-white">
              +50 Points
            </span>
          </div>

          <p className="text-gray-300 mb-4">
            This form is used to track participation in Keploy tasks under Devnovate
            Summer of Code (DSoC). Please ensure the details and
            screenshots provided are accurate. Earn{" "}
            <strong className="text-purple-400">50 points</strong> on successful
            completion and verification!
          </p>

          <ul className="list-disc list-inside text-gray-300 mb-4 space-y-1">
            <li>Complete the required Keploy tasks</li>
            <li>Provide accurate details and screenshots</li>
            <li>Submit the form and wait for verification</li>
            <li>
              ⚠️ Incorrect or fake submissions may lead to disqualification
            </li>
          </ul>

          <a
            href="https://forms.gle/GS1GC6rakmnJXB3YA"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 
                       bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600
                       transition rounded-full font-semibold text-white shadow-lg"
          >
            📝 Fill Keploy Tasks Form
          </a>
        </div>

        */}
       
        {/* ================= TASK 2 ================= */}
        <div
          className="w-full max-w-5xl p-6 rounded-xl 
                        border border-violet-500/30 bg-white/5 backdrop-blur"
        >
          <h2 className="text-2xl md:text-3xl font-semibold mb-2">
            📱 Follow Us on Social Media
          </h2>

          <p className="text-gray-400 mb-4">
            Stay updated with announcements, tasks, and community discussions.
          </p>

          <div className="flex flex-wrap gap-4">
            <a
              href="https://www.instagram.com/elite_coders_"
              target="_blank"
              className="px-5 py-2 rounded-full font-semibold 
                         bg-gradient-to-r from-pink-500 to-yellow-500"
            >
              Instagram
            </a>

            <a
              href="https://www.linkedin.com/company/elite-coders"
              target="_blank"
              className="px-5 py-2 rounded-full font-semibold bg-blue-600"
            >
              LinkedIn
            </a>

            <a
              href="https://discord.gg/eMTePUK3gJ"
              target="_blank"
              className="px-5 py-2 rounded-full font-semibold bg-indigo-600"
            >
              Discord
            </a>
          </div>
        </div>

        {/* ================= HOW TO MAKE YOUR FIRST CONTRIBUTION ================= */}
        <div
          className="w-full max-w-5xl p-6 rounded-xl 
                      border border-violet-500/30 bg-white/5 backdrop-blur"
        >
          <h2 className="text-2xl md:text-3xl font-semibold mb-4">
            🚀 How to Make Your First Open-Source Contribution
          </h2>

          <p className="text-gray-400 mb-4">
            New to open source? Don’t worry! Follow the steps below to make your
            first successful contribution to DSoC.
          </p>

          <div className="space-y-4 text-gray-400 text-m leading-relaxed">
            <div>
              <h3 className="font-semibold text-white mb-1">
                1️⃣ Pick an Issue
              </h3>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  Go to the repository’s <strong>Issues</strong> section.
                </li>
                <li>
                  Look for issues labeled <code>good first issue</code> or{" "}
                  <code>easy</code>.
                </li>
                <li>Read the issue description carefully before starting.</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-1">
                2️⃣ Fork the Repository
              </h3>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  Click the <strong>Fork</strong> button on the top-right of the
                  repo.
                </li>
                <li>
                  This creates a copy of the project in your GitHub account.
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-1">
                3️⃣ Clone the Fork Locally
              </h3>
              <div className="bg-black/30 p-3 rounded-lg font-mono text-sm">
                git clone https://github.com/your-username/repo-name.git
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-1">
                4️⃣ Create a New Branch
              </h3>
              <div className="bg-black/30 p-3 rounded-lg font-mono text-sm">
                git checkout -b fix-issue-name
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-1">
                5️⃣ Make Changes & Commit
              </h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Fix the issue or add the feature.</li>
                <li>Commit your changes with a clear message.</li>
              </ul>
              <div className="bg-black/30 p-3 rounded-lg font-mono text-sm mt-2">
                git add .<br />
                git commit -m "Fix: short description of change"
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-1">
                6️⃣ Push & Create a Pull Request
              </h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Push your branch to your fork.</li>
                <li>
                  Click <strong>Compare & Pull Request</strong> on GitHub.
                </li>
                <li>Explain what you changed in the PR description.</li>
              </ul>
              <div className="bg-black/30 p-3 rounded-lg font-mono text-xs mt-2">
                git push origin fix-issue-name
              </div>
            </div>
          </div>
        </div>

        <div className="w-full max-w-5xl mt-0.5 p-6 rounded-xl border border-violet-500/30 bg-white/5 backdrop-blur">
          <h3 className="text-xl font-semibold text-white mb-2">
            Explore Projects
          </h3>

          <p className="text-gray-300 text-sm leading-relaxed">
            Visit the{" "}
            <Link href="/projects" className="text-indigo-400 font-medium">
              Projects
            </Link>{" "}
            page available in the navigation bar. Explore ongoing and completed
            projects to understand how they are structured and identify areas
            where you can contribute.
          </p>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </>
  );
}
