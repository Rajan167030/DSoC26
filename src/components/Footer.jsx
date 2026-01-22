
"use client";
import Link from "next/link";
export default function Footer() {
  return (
    <footer className="bg-white/90 backdrop-blur-md rounded-3xl p-6 md:p-10 shadow-lg border border-white/20 text-sm text-gray-700 font-thin-custom">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-10">
          <div>
            <div className="text-2xl font-bold-custom text-gray-900 mb-3">
              DSoC <span className="text-violet-600">'26</span>
            </div>
            <p className="text-gray-600 leading-relaxed">
              Empowering the next generation of open-source contributors through
              real-world projects and mentorship.
            </p>
          </div>

          {/* QUICK LINKS */}
          <div>
  <h4 className="font-bold-custom text-lg text-gray-900 mb-4">
    Quick Links
  </h4>

  <ul className="space-y-2">
    <li>
      <Link
        href="/faq"
        className="hover:text-violet-600 transition-colors"
      >
        FAQs
      </Link>
    </li>

    <li>
      <Link
        href="/terms"
        className="hover:text-violet-600 transition-colors"
      >
        Terms & Conditions
      </Link>
    </li>

    <li>
      <Link
        href="/privacy"
        className="hover:text-violet-600 transition-colors"
      >
        Privacy Policy
      </Link>
    </li>
  </ul>
</div>

          {/* SOCIAL ICONS */}
          <div>
            <h4 className="font-bold-custom text-lg text-gray-900 mb-4">
              Community
            </h4>

            <div className="flex items-center space-x-4">
              {/* GitHub */}
                <a
                href="https://github.com/hackwithindia"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/60 border border-white/50 hover:bg-violet-100 transition-all"
                >
                <svg
                  className="w-6 h-6 text-gray-700"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 .5C5.7.5.98 5.26.98 11.52c0 4.7 3.03 8.69 7.24 10.09.53.1.72-.23.72-.51v-1.78c-2.95.64-3.57-1.42-3.57-1.42-.48-1.22-1.17-1.55-1.17-1.55-.96-.65.07-.64.07-.64 1.06.07 1.62 1.09 1.62 1.09.94 1.62 2.47 1.15 3.07.88.09-.68.37-1.15.67-1.41-2.36-.27-4.84-1.18-4.84-5.26 0-1.16.41-2.1 1.09-2.85-.11-.27-.48-1.36.1-2.84 0 0 .9-.29 2.95 1.09 2.02-.32 4.05-.32 6.07 0 2.05-1.38 2.95-1.09 2.95-1.09.58 1.48.21 2.57.1 2.84.68.75 1.09 1.69 1.09 2.85 0 4.09-2.49 4.99-4.86 5.25.38.33.71.98.71 1.98v2.93c0 .28.19.61.73.51 4.2-1.4 7.23-5.39 7.23-10.09C23.02 5.26 18.27.5 12 .5z" />
                </svg>
              </a>

              {/* Discord */}
                <a
                  href="https://discord.gg/hackwithindia"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Discord"
                  className="w-10 h-10 flex items-center justify-center
                            rounded-xl bg-white/60 border border-white/50
                            hover:bg-violet-100 transition-all"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="w-6 h-6 text-gray-700 fill-current"
                  >
                    <path d="M20.317 4.369a19.79 19.79 0 0 0-4.885-1.515.075.075 0 0 0-.079.037c-.21.375-.444.864-.608 1.249a18.27 18.27 0 0 0-5.48 0c-.164-.39-.403-.874-.617-1.249a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.03.027C1.18 8.046.579 11.58.923 15.067a.082.082 0 0 0 .03.055 19.9 19.9 0 0 0 5.993 3.03.076.076 0 0 0 .084-.028c.462-.63.873-1.295 1.226-1.994a.076.076 0 0 0-.042-.104 13.107 13.107 0 0 1-1.872-.878.076.076 0 0 1-.007-.124c.125-.094.25-.192.37-.291a.077.077 0 0 1 .081-.011c3.927 1.793 8.18 1.793 12.062 0a.076.076 0 0 1 .082.01c.12.1.245.199.37.293a.076.076 0 0 1-.006.123 12.299 12.299 0 0 1-1.873.878.076.076 0 0 0-.04.104c.36.699.772 1.364 1.225 1.994a.076.076 0 0 0 .084.028 19.9 19.9 0 0 0 5.995-3.03.076.076 0 0 0 .03-.054c.5-4.535-.838-8.046-2.324-10.671a.068.068 0 0 0-.031-.03zM8.02 14.551c-1.183 0-2.157-1.084-2.157-2.419s.975-2.419 2.157-2.419c1.21 0 2.176 1.093 2.157 2.42 0 1.335-.955 2.418-2.157 2.418zm7.974 0c-1.183 0-2.157-1.084-2.157-2.419s.975-2.419 2.157-2.419c1.21 0 2.176 1.093 2.157 2.42 0 1.335-.947 2.418-2.157 2.418z"/>
                  </svg>
                </a>


              {/* LinkedIn */}
              <a
              href="https://www.linkedin.com/company/hackwithindia"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/60 border border-white/50 hover:bg-blue-200 transition-all"
              >

                <svg
                  className="w-6 h-6 text-gray-700"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M4.98 3.5C3.88 3.5 3 4.38 3 5.48s.88 1.98 1.98 1.98 1.98-.88 1.98-1.98S6.08 3.5 4.98 3.5zM3.5 8.98h3v11.5h-3V8.98zM9.5 8.98h2.88v1.57h.04c.4-.76 1.39-1.57 2.86-1.57 3.06 0 3.62 2.01 3.62 4.63v6.87h-3v-6.09c0-1.45-.03-3.32-2.02-3.32-2.02 0-2.32 1.57-2.32 3.2v6.21h-3V8.98z" />
                </svg>
              </a>
            </div>
          </div>

          {/* CONTACT */}
          <div>
            <h4 className="font-bold-custom text-lg text-gray-900 mb-4">
              Contact Us
            </h4>
            <a
              href="mailto:hello@hackwithindia@gmail.com"
              className="flex items-center text-gray-700 hover:text-violet-600 transition-colors"
            >
              <span className="material-symbols-outlined mr-2 text-lg">
                mail
              </span>
              hello@hackwithindia@gmail.com
            </a>
          </div>
        </div>

        {/* BOTTOM COPYRIGHT */}
        <div className="mt-10 pt-6 border-t border-gray-300 text-center text-gray-600 text-xs">
          © 2026 Devnovate Summer of Code. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
