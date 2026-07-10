"use client";

import { CircleCheck, type AnimatedIconHandle } from "@humaner/shared/icons";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

function fadeUpVariant(delay: number): Variants {
  return {
    hidden: { opacity: 0, y: 12 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        delay,
        duration: 0.55,
        ease: [0.22, 1, 0.36, 1] as const,
      },
    },
  };
}

type WaitlistSuccessStateProps = {
  className?: string;
};

export function WaitlistSuccessState({
  className,
}: WaitlistSuccessStateProps): React.JSX.Element {
  const reduceMotion = useReducedMotion();
  const checkRef = useRef<AnimatedIconHandle>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      checkRef.current?.startAnimation();
    }, 120);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <motion.div
      className={cn("text-center", className)}
      initial={reduceMotion ? false : "hidden"}
      animate="show"
      variants={{
        hidden: {},
        show: {
          transition: { staggerChildren: 0.12, delayChildren: 0.05 },
        },
      }}
    >
      <motion.div
        className="mx-auto flex size-12 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-400/10"
        variants={fadeUpVariant(0)}
      >
        <CircleCheck ref={checkRef} className="size-6 text-emerald-400" />
      </motion.div>

      <motion.p
        className="mt-4 text-sm font-medium text-white"
        variants={fadeUpVariant(0.1)}
      >
        E-mail sent
      </motion.p>

      <motion.p
        className="mt-3 text-sm leading-relaxed text-white/55"
        variants={fadeUpVariant(0.22)}
      >
        Stay tuned, we got something else for you.
      </motion.p>
    </motion.div>
  );
}
