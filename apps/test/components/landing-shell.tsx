import * as React from "react";

import { cn } from "@/lib/utils";

export type LandingShellProps = {
  children: React.ReactNode;
  className?: string;
};

export function LandingShell({
  children,
  className,
}: LandingShellProps): React.JSX.Element {
  return (
    <div className={cn("relative min-h-[100svh] overflow-hidden", className)}>
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div
          className="hero-bg-layer absolute inset-0 bg-cover bg-center bg-no-repeat opacity-90"
          style={{ backgroundImage: "url(/burgundy.png)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-black/50" />
        <div className="absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-background from-[12%] via-background/85 via-[48%] to-transparent" />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}
