"use client";
import HeroBall from "./HeroBall";
import TextType from "./TextType";
import { ContainerTextFlip } from "./ui/container-text-flip";
import { motion } from "framer-motion";
import { useMotionPref } from "../lib/motionVariants";

export default function HeroSection() {
  const {
    sectionVariant,
    staggerContainer,
    scaleIn,
    fadeInUpCustom,
    fadeInUp,
  } = useMotionPref();

  return (
    <motion.header
      variants={sectionVariant}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.35 }}
      className="relative bg-white/5 backdrop-blur-2xl rounded-3xl px-4 py-6 sm:px-6 md:px-10 lg:px-16 md:py-10 mb-16  border border-white/20 overflow-hidden"
    >
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.4 }}
        className="relative text-center z-10 py-4"
      >
        <motion.div
          // variants={scaleIn}
          className="mx-auto mt-8 md:mt-20 w-full max-w-[360px] md:max-w-[520px]"
        >
          <HeroBall />
        </motion.div>

        {/* Headline with animated TextType */}
        <motion.h1
          variants={fadeInUpCustom}
          custom={0}
          className="mt-6 flex flex-col gap-4 text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold-custom dark:text-white leading-tight mb-4"
        >
          Devnovate{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--deep-blue-start)] to-[var(--deep-purple-end)]">
            <ContainerTextFlip
              words={[
                "Summer of Code 2026",
                "Open Source Program",
                "Real Projects, Real Impact",
              ]}
            />
          </span>
        </motion.h1>

        {/* Subheading */}
        <motion.p
          variants={fadeInUpCustom}
          custom={1}
          className="mx-auto max-w-[48rem] text-sm sm:text-base md:text-lg dark:text-gray-300 font-thin-custom mb-6 md:mb-10 px-2"
        >
          An open-source program designed for real collaboration, real
          contributions, and real growth. Empowering the next generation of
          developers to build the future.
        </motion.p>

        <motion.div
          variants={fadeInUp}
          className="flex flex-col sm:flex-col md:flex-row items-center justify-center gap-3 md:gap-6 px-2"
        >
          <motion.a
            variants={fadeInUpCustom}
            custom={2}
            href="/apply"
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 md:px-12 md:py-4
                   rounded-full font-bold-custom text-white text-base md:text-lg
                   bg-gradient-to-r from-violet-500 to-violet-700
                   shadow-[0_8px_30px_rgba(99,102,241,0.35)]
                   hover:shadow-[0_8px_40px_rgba(99,102,241,0.55)]
                   hover:scale-[1.04] active:scale-[0.98]
                   transition-all duration-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(99,102,241,0.18)]"
            aria-label="Register Now"
          >
            <span>Apply Now</span>
          </motion.a>

          <motion.a
            variants={fadeInUpCustom}
            custom={3}
            href="https://discord.gg/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full md:w-auto inline-flex items-center justify-center px-8 py-3.5 md:px-12 md:py-4
                   rounded-full font-bold-custom text-base md:text-lg
                   border-2 border-[#5B21B6] text-white
                   bg-black/30 backdrop-blur-sm
                   hover:bg-[#5B21B6] hover:text-white
                   hover:shadow-[0_8px_30px_rgba(91,33,182,0.45)]
                   transition-all duration-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(91,33,182,0.12)]"
            aria-label="Join Community"
          >
            Join Community
          </motion.a>
        </motion.div>
      </motion.div>

      <div className="pointer-events-none hidden md:block absolute left-6 right-6 bottom-0 h-[1px] bg-white/5" />
    </motion.header>
  );
}
