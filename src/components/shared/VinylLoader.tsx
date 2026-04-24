import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

type VinylLoaderProps = {
  className?: string;
  /**
   * Caption under the vinyl. Omit for default "Loading".
   * Pass an empty string to hide the caption (e.g. when you render your own text below).
   */
  label?: string;
  size?: "sm" | "md" | "lg";
};

const sizeClass = {
  sm: "h-14 w-14",
  md: "h-[4.5rem] w-[4.5rem] md:h-24 md:w-24",
  lg: "h-24 w-24 md:h-32 md:w-32",
};

const spinDuration = 2.4;
const glowDuration = 2.2;

/**
 * Brand-forward loading mark: emerald vinyl with smooth spin + pulsing glow.
 */
export function VinylLoader({
  className,
  label,
  size = "md",
}: VinylLoaderProps) {
  const reduceMotion = useReducedMotion();
  const caption = label === undefined ? "Loading" : label;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 text-center",
        className
      )}
    >
      <div className="relative grid place-items-center">
        <motion.div
          className="pointer-events-none absolute rounded-full bg-emerald-500/30 blur-xl"
          aria-hidden
          initial={false}
          animate={
            reduceMotion
              ? { opacity: 0.4 }
              : {
                  scale: [1, 1.18, 1],
                  opacity: [0.28, 0.5, 0.28],
                }
          }
          transition={{
            duration: glowDuration,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ width: "135%", height: "135%" }}
        />
        <motion.div
          className="pointer-events-none absolute rounded-full border border-emerald-400/25"
          aria-hidden
          initial={false}
          animate={
            reduceMotion
              ? { opacity: 0.35 }
              : { opacity: [0.25, 0.55, 0.25], scale: [0.92, 1, 0.92] }
          }
          transition={{
            duration: glowDuration * 1.1,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{ width: "118%", height: "118%" }}
        />
        <motion.img
          src="/assets/icons/vinyl.svg"
          alt=""
          className={cn(
            "relative z-[1] drop-shadow-[0_0_14px_rgba(16,185,129,0.4)]",
            sizeClass[size]
          )}
          initial={false}
          animate={
            reduceMotion ? { rotate: 0 } : { rotate: 360 }
          }
          transition={
            reduceMotion
              ? {}
              : {
                  rotate: {
                    duration: spinDuration,
                    repeat: Infinity,
                    ease: "linear",
                  },
                }
          }
        />
      </div>
      {caption !== "" ? (
        <p className="text-light-3 text-[11px] font-semibold uppercase tracking-[0.2em]">
          {caption}
        </p>
      ) : null}
    </div>
  );
}
