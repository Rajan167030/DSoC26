"use client";
import IDCard from "./IDCard";
import { motion } from "framer-motion";
import { useMotionPref } from "../lib/motionVariants";

export default function ShowcaseJourney({
  savedIDCards,
  showIDPreview,
  setShowIDPreview,
}) {
  const {
    sectionVariant,
    fadeInUp,
    fadeInUpCustom,
    scaleIn,
    staggerContainer,
    blurReveal,
  } = useMotionPref();

  const sampleCard = {
    name: "Alex Johnson",
    role: "Contributor",
    photo: "https://i.pravatar.cc/300?img=12",
    idNumber: "ECW-2026-0001",
    profileUrl: "https://example.com/ecwoc/alex-johnson",
    githubUsername: "alexjohnson",
    linkedinUrl: "https://linkedin.com/in/alex-johnson",
  };
  return (
    <motion.section
      variants={sectionVariant}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.3 }}
      className="bg-white/90 backdrop-blur-md rounded-3xl p-4 sm:p-6 md:p-10 mb-20 shadow-lg border border-white/20"
    >
      <motion.h2
        variants={fadeInUp}
        className="text-2xl sm:text-3xl md:text-4xl font-bold-custom text-gray-900 mb-6 md:mb-8 text-center"
      >
        Showcase Your Journey
      </motion.h2>
      <motion.div
        variants={staggerContainer}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10 items-center"
      >
        <motion.div variants={fadeInUp} className="order-2 lg:order-1">
          <h3 className="font-bold-custom text-xl sm:text-2xl md:text-3xl text-gray-900 mb-3 md:mb-4">
            Generate Your Personalized DSoC ID
          </h3>
          <p className="font-normal text-sm md:text-base text-gray-900 leading-relaxed mb-4 md:mb-6">
            Create a dynamic, shareable profile that highlights your
            contributions, projects, and skills developed during the Winter of
            Code. This ID acts as your digital portfolio, recognized by mentors
            and potential employers.
          </p>
          <ul className="list-disc list-inside text-sm md:text-base text-gray-900 font-normal mb-4 md:mb-6 space-y-1 md:space-y-2">
            <li>Showcase completed projects and code repositories.</li>
            <li>Display skills acquired and technologies mastered.</li>
            <li>Highlight mentor endorsements and community recognition.</li>
            <li>Integrated with LinkedIn for easy sharing.</li>
          </ul>
          <a
            href="/id-card/generate"
            className="inline-block px-6 sm:px-8 py-2 sm:py-3 bg-gradient-to-tr from-purple-500 to-purple-700 text-white font-bold-custom text-sm sm:text-base rounded-full shadow-lg hover:bg-gradient-to-br transition-transform duration-300"
          >
            Generate Your DSoC ID Now
          </a>
        </motion.div>
        <motion.div
          variants={scaleIn}
          className="relative bg-gray-200 rounded-2xl overflow-hidden shadow-xl border border-white/30 h-[300px] sm:h-[350px] md:h-[400px] flex items-center justify-center order-1 lg:order-2"
        >
          {savedIDCards.length > 0 ? (
            <div className="w-full h-full p-2 sm:p-4 overflow-auto">
              <div className="flex gap-4 items-center justify-center h-full">
                <div className="scale-50 sm:scale-50 transform">
                  <IDCard
                    data={savedIDCards[0]}
                    qrCodeDataUrl={savedIDCards[0].qrCode}
                  />
                </div>
              </div>
              <button
                onClick={() => setShowIDPreview(!showIDPreview)}
                className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-white/90 backdrop-blur-sm px-3 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-bold-custom text-gray-900 hover:bg-white transition-colors"
              >
                {showIDPreview ? "Hide" : "View Gallery"}
              </button>
            </div>
          ) : (
            <div className="w-full h-full p-2 sm:p-4 overflow-auto">
              <div className="flex gap-4 items-center justify-center h-full">
                <div className="scale-50 sm:scale-50 transform">
                  <IDCard data={sampleCard} />
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </motion.section>
  );
}
