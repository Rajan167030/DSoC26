"use client";
import { motion } from "framer-motion";
import { useMotionPref } from "../lib/motionVariants";

export default function ProgramStats() {
  const { sectionVariant, fadeInUp, staggerContainer, cardVariant } =
    useMotionPref();
  return (
    <motion.section
      variants={sectionVariant}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.3 }}
      className="mb-20"
    >
      <motion.h2
        variants={fadeInUp}
        className="text-2xl sm:text-3xl md:text-4xl font-bold-custom text-white text-center mb-8 sm:mb-12 px-4"
      >
        Program by the{" "}
        <span className="font-sans italic text-indigo-500">numbers</span>
      </motion.h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8 px-4">
        {/* CARD */}
        <motion.div
          variants={cardVariant}
          className="group relative bg-white/10 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-center border border-white/20 
                        shadow-[0_8px_30px_rgba(0,0,0,0.25)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.35)]
                        transition-all duration-500 hover:-translate-y-1"
        >
          {/* Glow behind number */}
          <div
            className="absolute inset-0 -z-10 rounded-2xl sm:rounded-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 
                          bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] blur-2xl"
          ></div>

          <p
            className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text 
                        bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] mb-2 sm:mb-3 drop-shadow-sm"
          >
            4,000+
          </p>

          <p className="text-base sm:text-lg font-semibold text-white/90 tracking-wide">
            Contributors Expected
          </p>
          <p className="text-xs sm:text-sm font-thin-custom text-white/60 mt-1">
            Global participation
          </p>
        </motion.div>

        {/* CARD */}
        <motion.div
          variants={cardVariant}
          className="group relative bg-white/10 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-center border border-white/20 
                        shadow-[0_8px_30px_rgba(0,0,0,0.25)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.35)]
                        transition-all duration-500 hover:-translate-y-1"
        >
          <div
            className="absolute inset-0 -z-10 rounded-2xl sm:rounded-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 
                          bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] blur-2xl"
          ></div>

          <p
            className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text 
                        bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] mb-2 sm:mb-3 drop-shadow-sm"
          >
            100+
          </p>

          <p className="text-base sm:text-lg font-semibold text-white/90 tracking-wide">
            Mentors
          </p>
          <p className="text-xs sm:text-sm font-thin-custom text-white/60 mt-1">
            Industry experts
          </p>
        </motion.div>

        {/* CARD */}
        <motion.div
          variants={cardVariant}
          className="group relative bg-white/10 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-center border border-white/20 
                        shadow-[0_8px_30px_rgba(0,0,0,0.25)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.35)]
                        transition-all duration-500 hover:-translate-y-1"
        >
          <div
            className="absolute inset-0 -z-10 rounded-2xl sm:rounded-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 
                          bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] blur-2xl"
          ></div>

          <p
            className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text 
                        bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] mb-2 sm:mb-3 drop-shadow-sm"
          >
            120+
          </p>

          <p className="text-base sm:text-lg font-semibold text-white/90 tracking-wide">
            Project Admins
          </p>
          <p className="text-xs sm:text-sm font-thin-custom text-white/60 mt-1">
            Diverse tech stacks
          </p>
        </motion.div>

        {/* CARD */}
        <motion.div
          variants={cardVariant}
          className="group relative bg-white/10 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-center border border-white/20 
                        shadow-[0_8px_30px_rgba(0,0,0,0.25)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.35)]
                        transition-all duration-500 hover:-translate-y-1"
        >
          <div
            className="absolute inset-0 -z-10 rounded-2xl sm:rounded-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 
                          bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] blur-2xl"
          ></div>

          <p
            className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text 
                        bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] mb-2 sm:mb-3 drop-shadow-sm"
          >
            4,500+
          </p>

          <p className="text-base sm:text-lg font-semibold text-white/90 tracking-wide">
            Community Members
          </p>
          <p className="text-xs sm:text-sm font-thin-custom text-white/60 mt-1">
            Active and growing
          </p>
        </motion.div>
      </div>
    </motion.section>
  );
}
