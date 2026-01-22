"use client";
import IDCard from "./IDCard";
import { motion } from "framer-motion";
import { useMotionPref } from "../lib/motionVariants";

export default function IDCardGallery({
  savedIDCards,
  showIDPreview,
  setShowIDPreview,
}) {
  const { fadeInUp, staggerContainer, scaleIn } = useMotionPref();
  if (!showIDPreview || savedIDCards.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={() => setShowIDPreview(false)}
    >
      <motion.div
        variants={scaleIn}
        initial="hidden"
        animate="show"
        className="bg-white/70 backdrop-blur-md rounded-3xl px-8 py-1 w-1/2 max-h-[80vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold-custom text-gray-900">
            Generated ID Cards
          </h2>
          <button
            onClick={() => setShowIDPreview(false)}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            <span className="material-symbols-outlined text-gray-900">
              close
            </span>
          </button>
        </div>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {savedIDCards.map((card, index) => (
            <motion.div
              key={index}
              variants={fadeInUp}
              className="transform hover:scale-105 transition-transform"
            >
              <div className="scale-85">
                <IDCard data={card} qrCodeDataUrl={card.qrCode} />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
