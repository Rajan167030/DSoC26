"use client";
import { motion } from "framer-motion";
import { useMotionPref } from "../lib/motionVariants";

export default function WhatYouGet() {
  const {
    sectionVariant,
    fadeInUp,
    fadeInUpCustom,
    staggerContainer,
    cardVariant,
    blurReveal,
  } = useMotionPref();
  return (
    <motion.section
      variants={sectionVariant}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.3 }}
      className="bg-white/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-10 mb-16 shadow-xl border border-white/30"
    >
      <motion.h2
        variants={fadeInUp}
        className="text-2xl sm:text-3xl md:text-4xl font-bold-custom text-gray-900 mb-8 sm:mb-10 text-center md:text-left"
      >
        What You Will Get
      </motion.h2>

      <div className="grid lg:grid-cols-2 gap-12 items-start">
        {/* LEFT SIDE – Benefit List */}
        <motion.div variants={staggerContainer}>
          <ul className="space-y-4 sm:space-y-6 text-gray-900">
            {[
              {
                title: "Official Certificates",
                desc: "Receive a blockchain-verified certificate upon successful completion, recognized by partners.",
              },
              {
                title: "Recognition from Community",
                desc: "Be highlighted in our community showcases, gaining visibility among peers and potential employers.",
              },
              {
                title: "Mentorship Opportunities",
                desc: "1:1 and group sessions with experienced mentors to guide your project and career path.",
              },
              {
                title: "Real Project Contributions",
                desc: "Work on impactful open-source projects, gaining tangible experience for your portfolio.",
              },
              {
                title: "Exclusive Swags & Goodies",
                desc: "Limited edition DSoC '26 merchandise for top contributors and active community members.",
              },
              {
                title: "Event Tickets & Passes",
                desc: "Access to premium tech conferences and workshops hosted by our partners.",
              },
              {
                title: "LinkedIn-Verified Contribution Badge",
                desc: "Showcase your contributions with an official digital badge on your professional profile.",
              },
            ].map((item, index) => (
              <motion.li
                variants={fadeInUpCustom}
                custom={index}
                key={index}
                className="flex items-start group"
              >
                <span className="material-symbols-outlined text-xl sm:text-2xl text-emerald-500 mr-3 sm:mr-4 group-hover:scale-110 transition-transform">
                  check_circle
                </span>
                <div>
                  <h4 className="font-bold-custom text-base sm:text-lg text-gray-900 group-hover:text-emerald-600 transition-colors">
                    {item.title}
                  </h4>
                  <p className="font-thin-custom text-xs sm:text-sm text-gray-600">
                    {item.desc}
                  </p>
                </div>
              </motion.li>
            ))}
          </ul>
        </motion.div>

        {/* RIGHT SIDE – Swags Section (Responsive) */}
        <motion.div
          variants={staggerContainer}
          className="relative grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 place-items-center"
        >
          <motion.div
            variants={blurReveal}
            className="w-48 sm:w-56 md:w-64 rounded-xl shadow-2xl transform rotate-3 hover:rotate-0 hover:scale-105 transition-all duration-300 bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center"
          >
            <span className="text-white text-lg font-bold">DSoC T-Shirt</span>
          </motion.div>
          <motion.div
            variants={blurReveal}
            className="w-48 sm:w-56 md:w-64 rounded-xl shadow-2xl transform -rotate-3 hover:rotate-0 hover:scale-105 transition-all duration-300 bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center"
          >
            <span className="text-white text-lg font-bold">DSoC Hoodie</span>
          </motion.div>

          {/* Certificate large image spanning full width */}
          <motion.div 
            variants={blurReveal}
            className="sm:col-span-2 flex justify-center -mt-2"
          >
            <div className="w-72 sm:w-96 rounded-xl shadow-2xl hover:scale-105 transition-transform duration-300 bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center p-12">
              <span className="text-white text-xl font-bold">DSoC Certificate</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </motion.section>
  );
}
