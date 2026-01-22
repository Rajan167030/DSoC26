"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register plugin once
gsap.registerPlugin(ScrollTrigger);

/**
 * SmoothScrollProvider
 * Adaptive Lenis + GSAP ScrollTrigger integration for responsive smooth scrolling.
 * - Disables heavy smoothing on mobile/low-memory devices.
 * - Integrates Lenis scroll with ScrollTrigger (scrollerProxy on desktop).
 * - Debounces expensive updates on mobile for performance.
 */
export default function SmoothScrollProvider({ children }) {
  useEffect(() => {
    const ua = navigator.userAgent;
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    const isTouch = "ontouchstart" in window;
    const deviceMemory = navigator.deviceMemory || 8; // assume higher if not provided
    const hasLimitedRAM = deviceMemory <= 4;

    // Configure Lenis adaptively with smoother settings
    const lenis = new Lenis({
      smooth: !isMobile && !hasLimitedRAM,
      lerp: isMobile ? 0.2 : 0.1,
      duration: isMobile ? 0.8 : 1.8,
      easing: isMobile
        ? (t) => t // linear on mobile
        : (t) => 1 - Math.pow(1 - t, 3), // power3.out for smoother performance
      direction: "vertical",
      gestureOrientation: "vertical",
      smoothTouch: false,
      syncTouch: !isTouch,
      touchInertiaMultiplier: isMobile ? 20 : 35,
      wheelMultiplier: isMobile ? 0.5 : 0.7,
      infinite: false,
      autoResize: true,
      normalizeWheel: !isMobile,
    });

    // RAF loop (throttled for mobile)
    let rafId;
    const raf = (time) => {
      if (isMobile) {
        const now = performance.now();
        if (raf.lastTime && now - raf.lastTime < 33) {
          // ~30fps throttle
          rafId = requestAnimationFrame(raf);
          return;
        }
        raf.lastTime = now;
      }
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    raf.lastTime = 0;
    rafId = requestAnimationFrame(raf);

    // ScrollTrigger update handling
    let scrollTimeout;
    lenis.on("scroll", () => {
      if (isMobile) {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => ScrollTrigger.update(), 24);
      } else {
        ScrollTrigger.update();
      }
    });

    // Desktop scroller proxy for ScrollTrigger with smoother easing
    if (!isMobile) {
      ScrollTrigger.scrollerProxy(document.body, {
        scrollTop(value) {
          if (value !== undefined) {
            lenis.scrollTo(value, {
              immediate: false,
              duration: 2.0,
              easing: (t) => 1 - Math.pow(1 - t, 4), // power4.out
              force: true,
              lock: false,
            });
          }
          return lenis.scroll;
        },
        getBoundingClientRect() {
          return {
            top: 0,
            left: 0,
            width: window.innerWidth,
            height: window.innerHeight,
          };
        },
        pinType: document.body.style.transform ? "transform" : "fixed",
      });
    }

    // Refresh & resize handling
    const onRefresh = () => {
      lenis.raf(performance.now());
      lenis.resize();
    };
    let resizeTimeout;
    const onResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(
        () => {
          lenis.resize();
          if (!isMobile) ScrollTrigger.refresh();
        },
        isMobile ? 150 : 40
      );
    };
    ScrollTrigger.addEventListener("refresh", onRefresh);
    window.addEventListener("resize", onResize, { passive: true });

    if (!isMobile) ScrollTrigger.refresh();

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      clearTimeout(scrollTimeout);
      clearTimeout(resizeTimeout);
      lenis.destroy();
      ScrollTrigger.removeEventListener("refresh", onRefresh);
      window.removeEventListener("resize", onResize);
      if (!isMobile) ScrollTrigger.killAll();
    };
  }, []);

  return <>{children}</>;
}
