"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

export function ContainerTextFlip({
  words = ["better", "modern", "beautiful", "awesome"],
  interval = 2500, // slightly faster cycle
  className,
  textClassName,
  animationDuration = 450, // faster in/out animation
  paddingX = 20, // reduce horizontal padding for tighter appearance
}) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const measureRef = useRef(null);
  const [fixedWidth, setFixedWidth] = useState(null);

  // Precompute max width once to avoid jitter during transitions
  useEffect(() => {
    if (!measureRef.current) return;
    const ctx = measureRef.current;
    let max = 0;
    words.forEach((w) => {
      ctx.textContent = w;
      const width = ctx.scrollWidth;
      if (width > max) max = width;
    });
    setFixedWidth(max + paddingX); // add horizontal padding
    ctx.textContent = ""; // cleanup
  }, [words, paddingX]);

  // Word advance timer
  useEffect(() => {
    const id = setInterval(() => {
      setCurrentWordIndex((i) => (i + 1) % words.length);
    }, interval);
    return () => clearInterval(id);
  }, [interval, words.length]);

  const currentWord = words[currentWordIndex];

  // Split letters once for current word
  const letters = useMemo(() => currentWord.split(""), [currentWord]);

  return (
    <div
      className={cn(
        "relative inline-block rounded-lg pt-2 pb-3 md:h-16 lg:h-20 text-center font-bold  ",
        "text-2xl md:text-5xl lg:text-7xl",
        className
      )}
      style={fixedWidth ? { width: fixedWidth } : undefined}
    >
      {/* Hidden measurer */}
      <span
        ref={measureRef}
        className="absolute top-0 left-0 invisible pointer-events-none whitespace-nowrap font-bold"
        aria-hidden
      />
      <AnimatePresence mode="wait">
        <motion.div
          key={currentWordIndex}
          className={cn(
            "absolute inset-0 flex items-center justify-center w-full",
            textClassName
          )}
          initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -10, filter: "blur(6px)" }}
          transition={{ duration: animationDuration / 1000, ease: "easeOut" }}
        >
          <div className="whitespace-nowrap">
            {letters.map((letter, i) => {
              // Preserve visible spacing for whitespace characters
              if (letter === " ") {
                return (
                  <span
                    key={i}
                    className="inline-block"
                    // tighter fixed width space
                    style={{ width: "0.35ch" }}
                  >
                    {"\u00A0"}
                  </span>
                );
              }
              return (
                <motion.span
                  key={i}
                  className="inline-block font-bold  text-transparent bg-clip-text bg-gradient-to-br from-[#484be8] via-[#8B5CF6] to-white"
                  initial={{ opacity: 0, y: 10, rotateX: 70 }}
                  animate={{ opacity: 1, y: 0, rotateX: 0 }}
                  transition={{
                    delay: i * 0.02,
                    duration: 0.4,
                    ease: "easeOut",
                  }}
                >
                  {letter} 
                </motion.span>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
