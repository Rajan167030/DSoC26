"use client";
import React from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { FlickeringGrid } from "@/components/ui/flickering-grid";
import { motion } from "framer-motion";
import { useMotionPref } from "../../lib/motionVariants";

export default function About() {
  const { sectionVariant, fadeInUp, staggerContainer, cardVariant } =
    useMotionPref();

  return (
    <div className="bg-black min-h-screen text-gray-200">
      <Navbar />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-8 max-w-7xl">
        <FlickeringGrid
          className="absolute inset-0 z-0 h-full"
          squareSize={4}
          gridGap={6}
          color="#6B7280"
          maxOpacity={0.2}
          flickerChance={0.05}
        />

        {/* Hero Section */}
        <motion.section
          variants={sectionVariant}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          className="relative bg-white/5 backdrop-blur-2xl rounded-3xl px-6 md:px-10 lg:px-16 py-10 md:py-16 mb-16 border border-white/20 overflow-hidden"
        >
          <motion.div variants={staggerContainer} className="max-w-4xl">
            <motion.h1
              variants={fadeInUp}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6"
            >
              About{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--deep-blue-start)] to-[var(--deep-purple-end)]">
                Devnovate Summer of Code &apos;26
              </span>
            </motion.h1>
            <motion.p
              variants={fadeInUp}
              className="text-lg sm:text-xl text-gray-300 mb-4"
            >
              Devnovate Summer of Code (DSoC &apos;26) is an open-source
              program crafted for real collaboration, real contributions, and
              real growth. It helps students and early stage developers move
              from tutorials to production-ready projects.
            </motion.p>
            <motion.p variants={fadeInUp} className="text-base text-gray-400">
              Over a focused winter timeline, you work with mentors,
              maintainers, and a friendly community to ship meaningful code,
              polish documentation, and understand how real open-source projects
              run.
            </motion.p>
          </motion.div>
        </motion.section>

        {/* Mission & Vision */}
        <motion.section
          variants={sectionVariant}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          className="mb-16"
        >
          <motion.div
            variants={staggerContainer}
            className="grid gap-6 md:grid-cols-2"
          >
            <motion.div
              variants={cardVariant}
              className="bg-white/90 backdrop-blur-xl rounded-2xl p-6 md:p-8 shadow-lg border border-white/30"
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Our Mission
              </h3>
              <p className="text-gray-700">
                DSoC &apos;26 exists to help students and new developers gain
                practical open-source experience in a structured, supportive
                space. The goal is simple: contribute, learn, and leave with
                visible work and a stronger GitHub profile.
              </p>
            </motion.div>
            <motion.div
              variants={cardVariant}
              className="bg-white/90 backdrop-blur-xl rounded-2xl p-6 md:p-8 shadow-lg border border-white/30"
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Our Vision
              </h3>
              <p className="text-gray-700">
                We&apos;re building a long-term ecosystem where contributors,
                mentors, and maintainers grow together. DSoC is a launchpad
                into global open-source communities, internships, and programs
                like GSoC and more.
              </p>
            </motion.div>
          </motion.div>
        </motion.section>

        {/* What is ECWoC */}
        <motion.section
          variants={sectionVariant}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          className="bg-white/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-6 md:p-10 mb-16 shadow-lg border border-white/30"
        >
          <motion.h2
            variants={fadeInUp}
            className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
          >
            What is DSoC &apos;26
          </motion.h2>
          <motion.p
            variants={fadeInUp}
            className="text-gray-700 mb-8 max-w-3xl"
          >
            DSoC is a summer open-source contribution program where you
            collaborate with mentors on curated projects. From first-time
            contributors to growing developers, everyone gets room to learn,
            ship, and showcase their work.
          </motion.p>
          <motion.div
            variants={staggerContainer}
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
          >
            {[
              {
                title: "Open-Source First",
                desc: "Work on real repositories. Your issues and PRs stay live on GitHub.",
              },
              {
                title: "Mentor-Guided",
                desc: "Get reviews, feedback, and support so you're never stuck alone.",
              },
              {
                title: "Production Mindset",
                desc: "Learn about code quality, docs, testing, and maintainability.",
              },
              {
                title: "Community Vibes",
                desc: "Connect with devs, maintainers, and organizers who love to build.",
              },
            ].map((item) => (
              <motion.div
                variants={cardVariant}
                key={item.title}
                className="bg-white/50 backdrop-blur-sm rounded-xl p-5 border border-gray-200 hover:border-indigo-300 hover:shadow-lg transition-all duration-300"
              >
                <h3 className="text-base font-bold text-gray-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.section>

        {/* Program Flow */}
        <motion.section
          variants={sectionVariant}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          className="mb-16"
        >
          <div className="grid gap-8 lg:grid-cols-2">
            <motion.div
              variants={staggerContainer}
              className="bg-white/90 backdrop-blur-xl rounded-2xl p-6 md:p-8 shadow-lg border border-white/30"
            >
              <motion.h2
                variants={fadeInUp}
                className="text-3xl font-bold text-gray-900 mb-4"
              >
                How the program works
              </motion.h2>
              <motion.p
                variants={fadeInUp}
                className="text-gray-700 mb-6"
              >
                ECWoC is built as a clear journey. From applying to shipping
                your final contributions, you always know what&apos;s next.
              </motion.p>
              <div className="space-y-4">
                {[
                  {
                    step: "1",
                    title: "Applications Open",
                    desc: "Share your basic profile and interests. No perfect resume needed—curiosity matters more.",
                  },
                  {
                    step: "2",
                    title: "Onboarding",
                    desc: "Join the community, read project docs, and set up repos and tooling.",
                  },
                  {
                    step: "3",
                    title: "Contribution Phase",
                    desc: "Pick issues, send PRs, iterate on feedback, and learn how maintainers think.",
                  },
                  {
                    step: "4",
                    title: "Evaluation & Recognition",
                    desc: "Consistent contributors are recognised with certificates, shoutouts, and sometimes swags.",
                  },
                ].map((item) => (
                  <motion.div
                    variants={cardVariant}
                    key={item.title}
                    className="flex gap-4 bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-gray-200 hover:border-indigo-300 transition-colors"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-sm font-bold flex-shrink-0">
                      {item.step}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 mb-1">
                        {item.title}
                      </p>
                      <p className="text-sm text-gray-600">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            <div className="space-y-6">
              <motion.div
                variants={cardVariant}
                className="bg-white/90 backdrop-blur-xl rounded-2xl p-6 md:p-8 shadow-lg border border-white/30"
              >
                <h3 className="text-2xl font-bold text-gray-900 mb-6">
                  Program Timeline 2026
                </h3>
                <div className="relative space-y-6">
                  {/* Vertical connecting line */}
                  <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gradient-to-b from-indigo-500 via-purple-500 via-blue-500 to-emerald-500" />
                  
                  {[
                    {
                      phase: "Phase 1",
                      date: "Dec 15 - Jan 05",
                      title: "Applications Open",
                      desc: "Register and submit your application",
                      icon: "campaign",
                      color: "indigo",
                    },
                    {
                      phase: "Phase 2",
                      date: "Dec 15 - Jan 05",
                      title: "Community Bonding",
                      desc: "Get to know mentors, explore projects",
                      icon: "group_add",
                      color: "purple",
                    },
                    {
                      phase: "Phase 3",
                      date: "Jan 01 - Feb 28",
                      title: "Coding Period",
                      desc: "Active contributions and mentorship",
                      icon: "code",
                      color: "blue",
                    },
                    {
                      phase: "Phase 4",
                      date: "Mar 16 - Mar 31",
                      title: "Final Evaluation",
                      desc: "Project review and recognition",
                      icon: "workspace_premium",
                      color: "emerald",
                    },
                  ].map((item) => (
                    <motion.div
                      key={item.phase}
                      variants={cardVariant}
                      className="relative flex items-start gap-4 pl-12"
                    >
                      <div className="absolute left-0 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg z-10">
                        <span className="material-symbols-outlined text-white text-sm">
                          {item.icon}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-bold text-indigo-600 text-sm">
                            {item.phase}
                          </p>
                          <span className="text-xs text-gray-500">•</span>
                          <p className="text-xs text-gray-600 font-medium">
                            {item.date}
                          </p>
                        </div>
                        <p className="font-bold text-gray-900 text-sm mb-1">
                          {item.title}
                        </p>
                        <p className="text-xs text-gray-600">
                          {item.desc}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Program Stats */}
              <motion.div
                variants={cardVariant}
                className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 shadow-lg text-white"
              >
                <h3 className="text-lg font-bold mb-4">Program Highlights</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Duration", value: "3 Months", icon: "schedule" },
                    { label: "Projects", value: "45+", icon: "folder_open" },
                    { label: "Mentors", value: "30+", icon: "person" },
                    { label: "Contributors", value: "1000+", icon: "groups" },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center"
                    >
                      <span className="material-symbols-outlined text-2xl mb-1 block">
                        {stat.icon}
                      </span>
                      <p className="text-xl font-bold">{stat.value}</p>
                      <p className="text-xs text-indigo-100">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* About Elite Coders */}
        <motion.section
          variants={sectionVariant}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          className="mb-16"
        >
          <div className="grid gap-8 lg:grid-cols-2">
            <motion.div
              variants={staggerContainer}
              className="bg-white/90 backdrop-blur-xl rounded-2xl p-6 md:p-8 shadow-lg border border-white/30"
            >
              <motion.h2
                variants={fadeInUp}
                className="text-3xl font-bold text-gray-900 mb-4"
              >
                About Devnovate
              </motion.h2>
              <motion.p
                variants={fadeInUp}
                className="text-gray-700 mb-6"
              >
                Devnovate is a developer community focused on real-world
                projects, open-source, and peer-led learning. We run programs
                like DSoC, workshops, and hack-style initiatives to help
                developers learn by actually building.
              </motion.p>
              <motion.div
                variants={staggerContainer}
                className="grid gap-3 sm:grid-cols-2"
              >
                {[
                  "Open-source programs & sprints",
                  "Tech workshops & sessions",
                  "Mentorship & peer learning",
                  "Community events & collabs",
                ].map((text) => (
                  <motion.div
                    variants={cardVariant}
                    key={text}
                    className="flex items-center gap-2 text-sm text-gray-700 bg-white/50 backdrop-blur-sm rounded-lg p-3 border border-gray-200"
                  >
                    <span className="material-symbols-outlined text-indigo-500 text-lg">
                      check_circle
                    </span>
                    <span>{text}</span>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
            <motion.div
              variants={cardVariant}
              className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 md:p-8 shadow-xl text-white flex flex-col justify-center"
            >
              <h3 className="text-2xl font-bold mb-3">
                Be part of DSoC &apos;26
              </h3>
              <p className="mb-6 text-indigo-100">
                Ready to build, learn, and vibe with other devs this summer?
                Join the Devnovate Summer of Code &apos;26 cohort.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href="/apply"
                  className="inline-flex items-center justify-center rounded-full bg-white text-indigo-600 px-6 py-3 font-bold hover:bg-gray-100 transition-all duration-300 hover:scale-105 shadow-lg"
                >
                  Apply Now
                </a>
                <a
                  href="/apply"
                  className="inline-flex items-center justify-center rounded-full border-2 border-white px-6 py-3 font-bold hover:bg-white/10 transition-all duration-300"
                >
                  Join the Community
                </a>
              </div>
            </motion.div>
          </div>
        </motion.section>

        <Footer />
      </div>
    </div>
  );
}
