"use client";
import ScrollFloat from "./ScrollFloat";
import { Users, Code2, GraduationCap, ShieldCheck } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { FeatureCard } from "@/components/ui/grid-features-card";

const features = [
  {
    title: "Community-Led Program",
    icon: Users,
    color: "text-indigo-500",
    description:
      "Driven by a passionate global community, ensuring relevance and real-world impact.",
    gradientClass:
      "bg-gradient-to-br from-[var(--deep-blue-start)] to-[var(--deep-blue-end)]",
  },
  {
    title: "Led by Experienced Developers",
    icon: Code2,
    color: "text-violet-500",
    description:
      "Guidance from industry veterans who have shipped real products and managed large-scale open-source projects.",
    gradientClass:
      "bg-gradient-to-br from-[var(--deep-purple-start)] to-[var(--deep-purple-end)]",
  },
  {
    title: "Mentors & Admins from Top Open Source Programs",
    icon: GraduationCap,
    color: "text-sky-500",
    description:
      "Learn directly from maintainers of projects featured in GSoC, Outreachy, and more.",
    gradientClass: "bg-gradient-to-br from-indigo-500 to-sky-500",
  },
  {
    title: "Backed by Trusted Sponsors",
    icon: ShieldCheck,
    color: "text-teal-500",
    description:
      "Supported by leading tech companies, offering invaluable resources and potential career paths.",
    gradientClass: "bg-gradient-to-br from-teal-500 to-emerald-500",
  },
];

function AnimatedContainer({ className, delay = 0.1, children }) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return children;
  }

  return (
    <motion.div
      initial={{ filter: "blur(4px)", translateY: -8, opacity: 0 }}
      whileInView={{ filter: "blur(0px)", translateY: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.8 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function WhyDifferent() {
  return (
    <section className="mb-12 sm:mb-16 md:mb-20">
      <div className="mx-auto w-full max-w-5xl space-y-6 sm:space-y-8 px-4">
        <AnimatedContainer className="mx-auto max-w-3xl text-center">
          <ScrollFloat animationDuration={1} ease="back.inOut(2)" stagger={0.1}>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold-custom text-white text-center mb-8 sm:mb-10">
              Why ECWoC is{" "}
              <span className="font-sans italic text-indigo-500">
                different
              </span>
            </h2>
          </ScrollFloat>
        </AnimatedContainer>

        <AnimatedContainer
          delay={0.4}
          className="grid grid-cols-1 divide-x divide-y divide-dashed border border-dashed sm:grid-cols-2 lg:grid-cols-4 "
        >
          {features.map((feature, i) => (
            <FeatureCard key={i} feature={feature} />
          ))}
        </AnimatedContainer>
      </div>
    </section>
  );
}