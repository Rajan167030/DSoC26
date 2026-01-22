"use client";
import ScrollFloat from "./ScrollFloat";
import { motion } from "framer-motion";
import { useMotionPref } from "../lib/motionVariants";

export default function ProgramOverview() {
  const { sectionVariant, fadeInUp, staggerContainer, blurReveal } =
    useMotionPref();
  return (
    <motion.section
      variants={sectionVariant}
      // initial="hidden"
      // whileInView="show"
      // viewport={{ once: true, amount: 0.3 }}
      className="bg-white/90 backdrop-blur-md rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-10 mb-12 sm:mb-16 md:mb-20 shadow-lg border border-white/20"
    >
      <ScrollFloat animationDuration={1} ease="back.inOut(2)">
        <motion.h2
          variants={fadeInUp}
          className="text-2xl sm:text-3xl md:text-4xl font-bold-custom text-gray-900 mb-4 sm:mb-6"
        >
          Program Overview
        </motion.h2>
      </ScrollFloat>
      <motion.div
        variants={staggerContainer}
        className="grid md:grid-cols-2 gap-6 sm:gap-8 items-start"
      >
        <ScrollFloat
          animationDuration={1.2}
          ease="power2.out"
          enableParallax={false}
        >
          <motion.div variants={fadeInUp} className="space-y-3 sm:space-y-4">
            <motion.p
              variants={fadeInUp}
              className="text-sm sm:text-base text-gray-900 font-normal leading-relaxed"
            >
              DSoC 2026 is a collaborative program aimed at fostering
              open-source development skills through real-world projects.
              Participants work directly with maintainers and mentors to make
              meaningful contributions to active open-source repositories.
            </motion.p>
            <motion.p
              variants={fadeInUp}
              className="text-sm sm:text-base text-gray-900 font-normal leading-relaxed"
            >
              This year, we're focusing on cutting-edge technologies and
              impactful projects across various domains: Web3, AI/ML, Cloud
              Native, Cybersecurity, and more. Our goal is to bridge the gap
              between academic learning and practical industry experience.
            </motion.p>
            <div className="space-y-2 pt-2">
              <motion.div
                variants={fadeInUp}
                className="flex items-center space-x-2 sm:space-x-3 text-gray-600"
              >
                <span className="material-symbols-outlined text-lg sm:text-xl text-[var(--deep-blue-start)]">
                  code
                </span>
                <span className="font-normal text-sm sm:text-base">
                  Hands-on coding experience
                </span>
              </motion.div>
              <motion.div
                variants={fadeInUp}
                className="flex items-center space-x-2 sm:space-x-3 text-gray-600"
              >
                <span className="material-symbols-outlined text-lg sm:text-xl text-[var(--deep-blue-start)]">
                  group
                </span>
                <span className="font-normal text-sm sm:text-base">
                  Collaborate with global developers
                </span>
              </motion.div>
              <motion.div
                variants={fadeInUp}
                className="flex items-center space-x-2 sm:space-x-3 text-gray-600"
              >
                <span className="material-symbols-outlined text-lg sm:text-xl text-indigo-500">
                  trending_up
                </span>
                <span className="font-normal text-sm sm:text-base">
                  Accelerate your career trajectory
                </span>
              </motion.div>
            </div>
          </motion.div>
        </ScrollFloat>
        <ScrollFloat
          animationDuration={1.2}
          ease="power2.out"
          scrollStart="top bottom-=20%"
        >
          <motion.div
            variants={blurReveal}
            className="relative rounded-xl sm:rounded-2xl overflow-hidden shadow-xl border border-white/30"
          >
            <video
              className="w-full h-full object-cover"
              autoPlay
              loop
              muted
              playsInline
            >
              <source src="/code-typing.mp4" type="video/mp4" />
            </video>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 sm:p-4 text-white">
              <h3 className="font-bold-custom text-base sm:text-lg md:text-xl">
                Project: QuantumVault API
              </h3>
              <p className="font-thin-custom text-xs sm:text-sm">
                Working on secure backend microservices with Go and Kubernetes.
              </p>
            </div>
          </motion.div>
        </ScrollFloat>
      </motion.div>
    </motion.section>
  );
}
