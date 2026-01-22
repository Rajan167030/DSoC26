"use client";
import ScrollFloat from "./ScrollFloat";
import { Features } from "./ui/feature-2";
import { motion } from "framer-motion";
import { useMotionPref } from "../lib/motionVariants";
export default function PrepareFuture() {
  const { sectionVariant, fadeInUp, staggerContainer } = useMotionPref();
  return (
    <motion.section
      variants={sectionVariant}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.3 }}
      className="mb-20"
    >
      <motion.div variants={staggerContainer} className="w-full">
        <motion.div variants={fadeInUp}>
          <Features />
        </motion.div>
      </motion.div>
    </motion.section>
  );
}
