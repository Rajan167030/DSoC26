import { Sparkles } from "./Sparkles"
import { useTheme } from "next-themes"
import LogoCarouselDemo from "./ui/LogoDemo"
export function Demo() {
  const { theme } = useTheme()
  return (
    <div className="h-full w-full overflow-hidden">
      <div className="mx-auto mt-12 w-full max-w-2xl">
        <div className="text-center text-3xl text-foreground">
          <span className=" text-white text-3xl md:text-5xl">
            Our Esteemed 
          </span>

          <br />

          <span className="text-indigo-500 text-3xl md:text-5xl font-bold"> Partners & Sponsors</span>
        </div>

        <div className="mt-14  ">
          {/* <Retool />

          <Vercel />

          <Remote />

          <Arc />

          <Raycast /> */}
          <LogoCarouselDemo />
        </div>
      </div>

      <div className="relative -mt-32 h-96 w-full overflow-hidden [mask-image:radial-gradient(50%_50%,white,transparent)]">
        <div className="absolute inset-0 before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_bottom_center,#8350e8,transparent_70%)] before:opacity-40" />
        <div className="absolute -left-1/2 top-1/2 aspect-[1/0.7] z-10 w-[200%] rounded-[100%] border-t border-zinc-900/20 dark:border-white/20 bg-zinc-900" />
        <Sparkles
          density={1200}
          className="absolute inset-x-0 bottom-0 h-full w-full [mask-image:radial-gradient(50%_50%,white,transparent_85%)]"
          color={theme === "dark" ? "#ffffff" : "#ffffff"}
        />
      </div>
    </div>
  )
}

