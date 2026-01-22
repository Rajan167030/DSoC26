"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function ScrollFloat({
  children,
  animationDuration = 1,
  ease = "power2.out",
  scrollStart = "top bottom-=100",
  stagger = 0,
  className = ""
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const elements = containerRef.current.children;
    if (!elements || elements.length === 0) return;

    const ctx = gsap.context(() => {
      gsap.from(elements, {
        y: 50,
        opacity: 0,
        duration: animationDuration,
        ease: ease,
        stagger: stagger,
        force3D: true,
        willChange: "transform, opacity",
        scrollTrigger: {
          trigger: containerRef.current,
          start: scrollStart,
          toggleActions: "play none none none",
          once: true,
          fastScrollEnd: true,
          preventOverlaps: true
        }
      });
    }, containerRef);

    return () => ctx.revert();
  }, [animationDuration, ease, scrollStart, stagger]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}
