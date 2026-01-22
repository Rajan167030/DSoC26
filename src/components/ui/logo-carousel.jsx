"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const distributeLogos = (allLogos, columnCount) => {
  const shuffled = shuffleArray(allLogos);
  const columns = Array.from({ length: columnCount }, () => []);

  shuffled.forEach((logo, index) => {
    columns[index % columnCount].push(logo);
  });

  const maxLength = Math.max(...columns.map((col) => col.length));
  columns.forEach((col) => {
    while (col.length < maxLength) {
      col.push(shuffled[Math.floor(Math.random() * shuffled.length)]);
    }
  });

  return columns;
};

const LogoColumn = React.memo(({ logos, index, currentTime }) => {
  const cycleInterval = 2000;
  const columnDelay = index * 200;
  const adjustedTime =
    (currentTime + columnDelay) % (cycleInterval * logos.length);
  const currentIndex = Math.floor(adjustedTime / cycleInterval);
  const currentItem = useMemo(() => logos[currentIndex], [logos, currentIndex]);
  const CurrentLogo = currentItem?.img;

  return (
    <motion.div
      className="relative flex flex-col items-center justify-center gap-2 md:gap-3"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.1,
        duration: 0.5,
        ease: "easeOut",
      }}
    >
      <div className="relative h-14 w-24 overflow-hidden md:h-24 md:w-48">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${logos[currentIndex].id}-${currentIndex}`}
            className="absolute inset-0 flex items-center justify-center"
            initial={{ y: "10%", opacity: 0, filter: "blur(8px)" }}
            animate={{
              y: "0%",
              opacity: 1,
              filter: "blur(0px)",
              transition: {
                type: "spring",
                stiffness: 300,
                damping: 20,
                mass: 1,
                bounce: 0.2,
                duration: 0.5,
              },
            }}
            exit={{
              y: "-20%",
              opacity: 0,
              filter: "blur(6px)",
              transition: {
                type: "tween",
                ease: "easeIn",
                duration: 0.3,
              },
            }}
          >
            {(() => {
              const cls =
                "h-20 w-20 max-h-[80%] max-w-[80%] object-contain md:h-48 md:w-48";
              if (!CurrentLogo) return null;
              if (typeof CurrentLogo === "string") {
                return (
                  <img
                    src={CurrentLogo}
                    alt={currentItem?.name || "Logo"}
                    className={cls}
                    loading="lazy"
                    decoding="async"
                  />
                );
              }
              if (React.isValidElement(CurrentLogo)) {
                return React.cloneElement(CurrentLogo, { className: cls });
              }
              // Assume it's a component type
              const Comp = CurrentLogo;
              return <Comp className={cls} />;
            })()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Community Name Label */}
      <AnimatePresence mode="wait">
        <motion.p
          key={`name-${logos[currentIndex].id}`}
          className="text-xs md:text-sm font-medium text-gray-300 text-center px-2 h-8 flex items-center justify-center"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.3 }}
        >
          {currentItem?.name}
        </motion.p>
      </AnimatePresence>
    </motion.div>
  );
});

export function LogoCarousel({ columnCount = 2, logos }) {
  const [logoSets, setLogoSets] = useState([]);
  const [currentTime, setCurrentTime] = useState(0);

  const updateTime = useCallback(() => {
    setCurrentTime((prevTime) => prevTime + 100);
  }, []);

  useEffect(() => {
    const intervalId = setInterval(updateTime, 100);
    return () => clearInterval(intervalId);
  }, [updateTime]);

  useEffect(() => {
    const distributedLogos = distributeLogos(logos, columnCount);
    setLogoSets(distributedLogos);
  }, [logos, columnCount]);

  return (
    <div className="flex items-center justify-center gap-6 ">
      {logoSets.map((logos, index) => (
        <LogoColumn
          key={index}
          logos={logos}
          index={index}
          currentTime={currentTime}
        />
      ))}
    </div>
  );
}

export { LogoColumn };
