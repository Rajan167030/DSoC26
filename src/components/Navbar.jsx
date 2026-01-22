// "use client";

// import useAuth from "../hooks/useAuth";

// export default function Navbar() {
//   const { user, isLoggedIn, loading, logout } = useAuth();

//   const profileLink = isLoggedIn
//     ? user?.isApproved && user?.username
//       ? `/profile/${user.username}`
//       : "/my-application"
//     : "/login";

//   return (
//     <nav className="flex justify-between items-center mb-10 ">
//       <div className="text-2xl font-bold-custom dark:text-white">
//         <a href="/" className="hover:text-violet-400 transition-colors">
//           ECWoC <span className="text-violet-400">'26</span>
//         </a>
//       </div>
//       {/* <ul className="hidden md:flex space-x-8 dark:text-gray-300 font-thin-custom items-center">
//         <li>
//           <a className="hover:text-violet-400 transition-colors" href="/">
//             Home
//           </a>
//         </li>
//         <li>
//           <a className="hover:text-violet-400 transition-colors" href="/about">
//             About
//           </a>
//         </li>
//         <li>
//           <a
//             className="hover:text-violet-400 transition-colors"
//             href="#benefits"
//           >
//             Benefits
//           </a>
//         </li>
//         <li>
//           <a className="hover:text-violet-400 transition-colors" href="/apply">
//             Apply Now
//           </a>
//         </li>
//         <li>
//           <a
//             className="hover:text-violet-400 transition-colors"
//             href="/leaderboard"
//           >
//             Leaderboard
//           </a>
//         </li>
//         <li>
//           <a
//             className="hover:text-violet-400 transition-colors"
//             href="#sponsors"
//           >
//             Sponsors
//           </a>
//         </li>
//         <li>
//           <a
//             className="hover:text-violet-400 transition-colors"
//             href={profileLink}
//           >
//             {loading ? "..." : isLoggedIn ? "My Profile" : "Login"}
//           </a>
//         </li>
//         {isLoggedIn && (
//           <li>
//             <button
//               onClick={logout}
//               className="text-sm px-3 py-1 rounded-md border border-violet-400/40 hover:bg-violet-500/10 transition-colors"
//             >
//               Logout
//             </button>
//           </li>
//         )}
//       </ul> */}
//       <ul className="hidden md:flex space-x-8 dark:text-gray-300 font-semibold items-center">
//   {[
//     { label: "Home", href: "/" },
//     { label: "About", href: "/about" },
//     { label: "Benefits", href: "#benefits" },
//     { label: "Apply Now", href: "/apply" },
//     { label: "Leaderboard", href: "/leaderboard" },
//     { label: "Sponsors", href: "#sponsors" },
//   ].map((item) => (
//     <li key={item.href}>
//       <a
//         href={item.href}
//         className="relative transition-colors hover:text-violet-400 after:absolute after:left-0 after:-bottom-1 after:h-[2px] after:w-0 after:bg-violet-400 after:transition-all hover:after:w-full"
//       >
//         {item.label}
//       </a>
//     </li>
//   ))}

//   <li>
//     <a
//       href={profileLink}
//       className="relative transition-colors hover:text-violet-400 after:absolute after:left-0 after:-bottom-1 after:h-[2px] after:w-0 after:bg-violet-400 after:transition-all hover:after:w-full"
//     >
//       {loading ? "..." : isLoggedIn ? "My Profile" : "Login"}
//     </a>
//   </li>

//   {isLoggedIn && (
//     <li>
//       <button
//         onClick={logout}
//         className="text-sm px-3 py-1 rounded-md border border-violet-400/40
//                    hover:bg-violet-500/10 hover:border-violet-400 transition-colors font-semibold"
//       >
//         Logout
//       </button>
//     </li>
//   )}
// </ul>

//       <button className="md:hidden dark:text-gray-300">
//         <span className="material-symbols-outlined">menu</span>
//       </button>
//     </nav>
//   );
// }

"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { Toaster } from "react-hot-toast";
import useAuth from "../hooks/useAuth";

export default function Navbar() {
  const { user, isLoggedIn, loading, logout } = useAuth();
  // console.log('Navbar user state:', { user, isLoggedIn, loading });
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef(null);
  const btnRef = useRef(null);
  const navRef = useRef(null);
  const logoRef = useRef(null);

  // Track scroll position for sticky navbar with GSAP
  useEffect(() => {
    let lastScrollY = 0;
    let isAnimating = false;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const shouldBeScrolled = currentScrollY > 50;

      // Only animate if state needs to change
      if ((shouldBeScrolled && !scrolled) || (!shouldBeScrolled && scrolled)) {
        if (!isAnimating) {
          isAnimating = true;
          setScrolled(shouldBeScrolled);

          if (navRef.current && logoRef.current) {
            if (shouldBeScrolled) {
              // Animate to floating state
              gsap.to(navRef.current, {
                top: "1.5rem",
                left: "50%",
                right: "auto",
                x: "-50%",
                width: "92%",
                maxWidth: "72rem",
                backgroundColor: "rgba(0, 0, 0, 0.8)",
                backdropFilter: "blur(12px)",
                paddingTop: "0.75rem",
                paddingBottom: "0.75rem",
                paddingLeft: "2rem",
                paddingRight: "2rem",
                borderRadius: "1rem",
                duration: 0,
                ease: "power2.inOut",
                onComplete: () => {
                  isAnimating = false;
                },
              });
              // Animate logo
              gsap.to(logoRef.current, {
                fontSize: "1.25rem",
                duration: 0.4,
                ease: "power2.out",
              });
            } else {
              // Animate back to full width
              gsap.to(navRef.current, {
                top: "0",
                left: "0",
                right: "0",
                x: "0%",
                width: "100%",
                maxWidth: "none",
                backgroundColor: "rgba(0, 0, 0, 0)",
                backdropFilter: "blur(0px)",
                paddingTop: "1.25rem",
                paddingBottom: "1.25rem",
                paddingLeft: "1.5rem",
                paddingRight: "1.5rem",
                borderRadius: "0",
                duration: 0.4,
                ease: "power2.out",
                onComplete: () => {
                  isAnimating = false;
                },
              });
              // Animate logo back
              gsap.to(logoRef.current, {
                fontSize: "1.5rem",
                duration: 0.4,
                ease: "power2.out",
              });
            }
          }
        }
      }
      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [scrolled]);

  // Prefer explicit username; fallback to email prefix if missing
  const derivedUsername =
    (user?.email ? user.email.split("@")[0].toLowerCase() : null);
  const profileLink = isLoggedIn
    ? user?.isApproved && derivedUsername
      ? `/profile/${derivedUsername}`
      // : "/apply/success"
      : "/my-application"
    : "/login";

  // close on esc
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // close on outside click
  useEffect(() => {
    function onClick(e) {
      if (!open) return;
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        btnRef.current &&
        !btnRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [open]);

  // Links array for reuse
  const links = [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Team", href: "/team" },
    { label: "Projects", href: "/projects" },
    { label: "Leaderboard", href: "/leaderboard" },
  ];

  return (
    <nav
      ref={navRef}
      className={`fixed z-50 backdrop-blur-xl ${
        scrolled
          ? "shadow-2xl shadow-violet-500/20 border border-violet-500/30"
          : ""
      }`}
      style={{
        top: 0,
        left: 0,
        right: 0,
        width: "100%",
        backgroundColor: "rgba(0, 0, 0, 0)",
        paddingTop: "1.25rem",
        paddingBottom: "1.25rem",
        paddingLeft: "1.5rem",
        paddingRight: "1.5rem",
        borderRadius: "0",
      }}
    >
      <div
        className={`flex items-center justify-between ${
          scrolled ? "" : "container mx-auto max-w-7xl"
        }`}
      >
        {/* Logo */}
        <div
          ref={logoRef}
          className="font-bold-custom dark:text-white"
          style={{ fontSize: "1.5rem" }}
        >
          <Link href="/" className="hover:text-violet-400 transition-colors">
            DSoC <span className="text-violet-400">&apos;26</span>
          </Link>
        </div>

        {/* Desktop links */}
        <ul
          className={`hidden md:flex dark:text-gray-300 font-semibold items-center ${
            scrolled ? "space-x-5" : "space-x-8"
          }`}
        >
          {links.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className="relative text-lg transition-colors hover:text-violet-400 after:absolute after:left-0 after:-bottom-1 after:h-[2px] after:w-0 after:bg-violet-400 after:transition-all hover:after:w-full"
              >
                {item.label}
              </a>
            </li>
          ))}
          
          {isLoggedIn && (
  <li>
    <a
      href="/tasks"
      className="relative transition-colors hover:text-violet-400 after:absolute after:left-0 after:-bottom-1 after:h-[2px] after:w-0 after:bg-violet-400 after:transition-all hover:after:w-full"
    >
      Tasks
    </a>
  </li>
)}

          {/* Apply Now Button */}
          { user&& user.isApplied ? 
            <li>
            <a
              href="/my-application"
              className={`rounded-full bg-violet-600 hover:bg-violet-700 text-white font-semibold transition-all transform hover:scale-105 ${
                scrolled ? "px-5 py-2 text-sm" : "px-5 py-2 text-sm"
                }`}
                >
              My Application
            </a>
          </li>
            
              :

            <li>
            <a
              href="/apply"
              className={`rounded-full bg-violet-600 hover:bg-violet-700 text-white font-semibold transition-all transform hover:scale-105 ${
                scrolled ? "px-5 py-2 text-sm" : "px-5 py-2 text-sm"
                }`}
                >
              Apply Now
            </a>
          </li>
            } 

          {/* Login/Profile */}
          <li>
            <a
              href={profileLink}
              className="relative transition-colors hover:text-violet-400 after:absolute after:left-0 after:-bottom-1 after:h-[2px] after:w-0 after:bg-violet-400 after:transition-all hover:after:w-full"
            >
              {loading ? "..." : isLoggedIn ? "My Profile" : "Login"}
            </a>
          </li>

          {/* Logout */}

          {isLoggedIn && (
            <li>
              <button
                onClick={logout}
                className="text-sm px-4 py-1.5 rounded-full border border-violet-400/40 hover:bg-violet-500/10 hover:border-violet-400 transition-colors font-semibold"
              >
                Logout
              </button>
            </li>
          )}
        </ul>

        {/* Mobile menu button */}
        <button
          ref={btnRef}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((s) => !s)}
          className={`md:hidden p-2 w-10 flex justify-center items-center rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition ${
            scrolled ? "scale-90" : ""
          }`}
        >
          <span className="material-symbols-outlined">
            {open ? "close" : "menu"}
          </span>
        </button>

        {/* Mobile menu */}
        <div
          id="mobile-menu"
          ref={menuRef}
          className={`absolute ${
            scrolled ? "top-14" : "top-full"
          } right-4 w-[95vw] max-w-xs md:hidden transform-gpu transition-all duration-300
                      ${
                        open
                          ? "opacity-100 translate-y-0 scale-100"
                          : "opacity-0 -translate-y-2 scale-95 pointer-events-none"
                      }`}
        >
          <div className="bg-white/90 dark:bg-[#0b1220]/90 backdrop-blur-md rounded-xl border-2 border-purple-800 overflow-hidden relative ">
            {/* Animated blurry background */}
            <div className="absolute inset-0 -z-10 overflow-hidden rounded-inherit">
              <div className="absolute -top-40 -right-40 w-80 h-80 bg-violet-500/30 rounded-full blur-3xl animate-pulse"></div>
              <div
                className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse"
                style={{ animationDelay: "1s" }}
              ></div>
            </div>
            <div className="flex flex-col p-4 space-y-2">
              {links.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block px-3 py-2 font-semibold rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 transition"
                >
                  {item.label}
                </a>
              ))}
              
              {/* TASKS LINK IN MOBILE (ONLY LOGGED IN) */}
              {isLoggedIn && (
                <a
                  href="/tasks"
                  onClick={() => setOpen(false)}
                  className="block px-3 py-2 rounded-md text-gray-700 dark:text-gray-200 
                  hover:bg-gray-100 dark:hover:bg-white/5 transition"
                >
                  Tasks
                </a>
              )}

              <a
                href="/apply"
                onClick={() => setOpen(false)}
                className="block px-3 py-2 rounded-full bg-gradient-to-tr from-violet-500 to-violet-800 text-white font-semibold transition text-center"
              >
                Apply Now
              </a>

              <a
                href={profileLink}
                onClick={() => setOpen(false)}
                className="block px-3 py-2 font-semibold rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 transition"
              >
                {loading ? "..." : isLoggedIn ? "My Profile" : "Login"}
              </a>

              {isLoggedIn ? (
                <button
                  onClick={() => {
                    logout();
                    setOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 transition"
                >
                  Logout
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
      {/* Global Toaster for app-wide toast messages */}
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
    </nav>
  );
}
