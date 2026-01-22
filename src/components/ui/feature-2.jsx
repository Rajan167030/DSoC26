import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Settings2, Sparkles, Zap } from "lucide-react";
import { ReactNode } from "react";

export function Features() {
  return (
    <section className="py-16 md:py-32">
      <div className="@container mx-auto max-w-5xl px-6">
        <div className="text-center">
          <h2 className="text-balance text-4xl font-semibold lg:text-5xl">
            Prepare for your <span className="font-sans italic text-indigo-500">future</span>
          </h2>
       
        </div>
        <div className="mx-auto mt-8 flex flex-wrap gap-6 justify-center *:text-center md:mt-16">
          <Card className="group border-0 bg-white/10 shadow-none flex-1 min-w-sm hover:bg-white/20 transition-all duration-300">
            <CardHeader className="pb-3">
              <CardDecorator>
                <span className="material-symbols-outlined text-2xl">
                  rocket_launch
                </span>
              </CardDecorator>

              <h3 className="mt-6 text-xl font-semibold">Prepare for GSoC &amp; Top Programs</h3>
            </CardHeader>

            <CardContent>
              <p className="text-lg text-muted-foreground">
              Our structured curriculum and mentorship are designed to give you a
            competitive edge for prestigious programs like Google Summer of
            Code.
              </p>
            </CardContent>
                                    {/* <a
            className="text-indigo-600 font-bold-custom flex items-center justify-center "
            href="#"
          >
            Learn More{" "}
            <span className="material-symbols-outlined text-sm ml-1 group-hover:translate-x-1 transition-transform">
              arrow_forward
            </span>
          </a> */}
          </Card>

          <Card className="group border-0 bg-white/10 hover:bg-white/20 shadow-none flex-1 min-w-sm transition-all duration-300">
            <CardHeader className="pb-3">
              <CardDecorator>
           
                  <span className="material-symbols-outlined text-2xl">
                    book
                  </span>
              
              </CardDecorator>

              <h3 className="mt-6 text-xl font-semibold">How to Get Started with Open Source</h3>
            </CardHeader>

            <CardContent>
              <p className="text-lg text-muted-foreground">
                A comprehensive guide for beginners, covering everything from
                finding your first issue to making impactful pull requests and
                navigating GitHub.
              </p>
            </CardContent>
                                    {/* <a
            className="text-violet-600 font-bold-custom flex items-center justify-center mb-4 "
            href="#"
          >
            Learn More{" "}
            <span className="material-symbols-outlined text-sm ml-1 group-hover:translate-x-1 transition-transform">
              arrow_forward
            </span>
          </a> */}
          </Card>

          <Card className="group border-0 bg-white/10 hover:bg-white/20 shadow-none flex-1 min-w-sm transition-all duration-300">
            <CardHeader className="pb-3">
              <CardDecorator>
                <span className="material-symbols-outlined text-2xl">
                  group_add
                </span>
              </CardDecorator>

              <h3 className="mt-6 text-xl font-semibold">Weekly Mentorship Sessions</h3>
            </CardHeader>

            <CardContent>
              <p className="text-lg text-muted-foreground">
                Engage in live Q&amp;A sessions, code reviews, and career guidance
                workshops with our expert mentors. Topics range from specific tech
                deep-dives to interview prep.
              </p>
            </CardContent>
                      {/* <a
            className="text-emerald-600 font-bold-custom flex items-center justify-center mb-4"
            href="#"
          >
            Learn More{" "}
            <span className="material-symbols-outlined text-sm ml-1 group-hover:translate-x-1 transition-transform">
              arrow_forward
            </span>
          </a> */}
          </Card>
        </div>
      </div>
    </section>
  );
}

const CardDecorator = ({ children }) => (
  <div
    aria-hidden
    className="relative mx-auto size-36 [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"
  >
    <div className="absolute inset-0 [--border:violet] bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:24px_24px] opacity-10" />
    <div className="bg-background absolute inset-0 m-auto flex size-12 items-center justify-center border-t border-l">
      {children}
    </div>
  </div>
);
