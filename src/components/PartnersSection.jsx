"use client";
import ScrollFloat from "./ScrollFloat";
import { Demo } from "./SparklesDemo";
import { motion } from "framer-motion";
import { useMotionPref } from "../lib/motionVariants";
import Link from "next/link";

export default function PartnersSection() {
  const { sectionVariant, fadeInUp } = useMotionPref();
  return (
    <motion.section
      variants={sectionVariant}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.3 }}
      className=" backdrop-blur-2xl bg-white/5 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-10 mb-12 sm:mb-16 md:mb-20 shadow-lg border border-white/20 text-center overflow-hidden hover:border-violet-800/50"
    >
      {/* <ScrollFloat animationDuration={1} ease="back.inOut(2)" stagger={0.1}>
        <h2 className="text-4xl font-bold-custom text-gray-900 mb-10">
          Our Esteemed Partners & Sponsors
        </h2>
      </ScrollFloat> */}

      <Demo />

      {/* <ScrollFloat animationDuration={0.3} ease="back.out(1.7)"> */}
      
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.1, stiffness: 100 }}
      >
        <Link
          href="https://forms.gle/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-6 sm:px-8 py-2.5 sm:py-3
                     text-lg sm:text-xl md:text-2xl
                     bg-transparent text-[var(--deep-purple-start)]
                     font-bold-custom rounded-full
                     border-2 border-[var(--deep-purple-start)]
                     hover:bg-[var(--deep-purple-start)]
                     hover:text-white
                     transition-all duration-300"
        >
          Sponsor Us
        </Link>
      </motion.div>
      {/* </ScrollFloat> */}
    </motion.section>
  );
}
