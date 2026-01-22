import Image from "next/image";

export default function HeroBall() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-10">
      <Image
        src="/balls.png"
        alt="Decorative spinning ball"
        width={600}
        height={600}
        className="opacity-60 animate-spin-slow"
        priority
      />
    </div>
  );
}