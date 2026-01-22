import { cn } from "@/lib/utils";
import React from "react";

export function FeatureCard({ feature, className, ...props }) {
  const seed = `${feature?.title || ''}|${feature?.description || ''}|${feature?.color || ''}`;
  const p = React.useMemo(() => genPatternFromSeed(seed), [seed]);

  return (
    <div
      className={cn("relative overflow-hidden h-full  p-6", className)}
      {...props}
    >
      <div className="pointer-events-none absolute top-0 left-1/2 -mt-2 -ml-20 h-full w-full [mask-image:linear-gradient(white,transparent)]">
        <div className="from-foreground/5 to-foreground/1 absolute inset-0 bg-gradient-to-r [mask-image:radial-gradient(farthest-side_at_top,white,transparent)] opacity-100 ">
          <GridPattern
            width={20}
            height={20}
            x="-12"
            y="4"
            squares={p}
            className="fill-foreground/5 stroke-foreground/25 absolute inset-0 h-full w-full mix-blend-overlay"
          />
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <feature.icon
          className={`text-foreground/75 size-8 ${feature.color}`}
          strokeWidth={1}
          aria-hidden
        />
        <h3 className={`mt-10 text-sm md:text-xl ${feature.color}`}>
          {feature.title}
        </h3>
        <p className="text-muted-foreground relative z-20 mt-2 text-lg font-light">
          {feature.description}
        </p>
      </div>
    </div>
  );
}

function GridPattern({ width, height, x, y, squares, ...props }) {
  const patternId = React.useId();

  return (
    <svg aria-hidden="true" {...props}>
      <defs>
        <pattern
          id={patternId}
          width={width}
          height={height}
          patternUnits="userSpaceOnUse"
          x={x}
          y={y}
        >
          <path d={`M.5 ${height}V.5H${width}`} fill="none" />
        </pattern>
      </defs>
      <rect
        width="100%"
        height="100%"
        strokeWidth={0}
        fill={`url(#${patternId})`}
      />
      {squares && (
        <svg x={x} y={y} className="overflow-visible">
          {squares.map(([x, y], index) => (
            <rect
              strokeWidth="0"
              key={index}
              width={width + 1}
              height={height + 1}
              x={x * width}
              y={y * height}
            />
          ))}
        </svg>
      )}
    </svg>
  );
}

function genRandomPattern(len = 5) {
  const length = Number.isFinite(len) && len > 0 ? Math.floor(len) : 5;
  return Array.from({ length }, () => [
    Math.floor(Math.random() * 4) + 7,
    Math.floor(Math.random() * 6) + 1,
  ]);
}

function hashStringToUint32(value) {
  // FNV-1a 32-bit
  let hash = 2166136261;
  const str = String(value ?? '');
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed) {
  let t = seed >>> 0;
  return function next() {
    t += 0x6d2b79f5;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function genPatternFromSeed(seed, len = 5) {
  const length = Number.isFinite(len) && len > 0 ? Math.floor(len) : 5;
  const rng = mulberry32(hashStringToUint32(seed));
  return Array.from({ length }, () => [
    Math.floor(rng() * 4) + 7,
    Math.floor(rng() * 6) + 1,
  ]);
}
