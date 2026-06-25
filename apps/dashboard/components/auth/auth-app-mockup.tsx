import * as React from 'react';
import Image from 'next/image';

export function AuthAppMockup(): React.JSX.Element {
  return (
    <div className="relative flex h-full min-h-[520px] flex-col justify-end overflow-hidden p-8 sm:p-10">
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/20" />

      <div className="relative z-10 flex flex-1 flex-col justify-center">
        <div className="overflow-hidden rounded-2xl border border-white/15 bg-white/10 shadow-[0_40px_100px_-30px_rgb(0_0_0_/_0.55)] backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-fracture" />
              <span className="text-xs font-medium text-white/90">
                Casual · Ecommerce widget
              </span>
            </div>
            <span className="text-[11px] text-white/40">Live preview</span>
          </div>

          <div className="space-y-4 p-5 sm:p-6">
            <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-white px-4 py-2.5 text-sm text-foreground">
              do you ship overseas?
            </div>
            <div className="w-fit max-w-[90%] rounded-2xl rounded-bl-sm border border-white/10 bg-white/15 px-4 py-3 text-sm leading-relaxed text-white/90 backdrop-blur-sm">
              yep we do! international delivery takes 5–10 business days
              depending on where you&apos;re at. shipping&apos;s free over $75
              btw :)
            </div>
            <div className="border-t border-white/10 pt-4">
              <span className="rounded-full bg-fracture/20 px-2 py-0.5 text-[11px] text-fracture">
                Matched &ldquo;International delivery&rdquo;
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 mt-8 flex items-center justify-between gap-6">
        <p className="font-display text-xl text-white/90 sm:text-2xl">
          Support that feels human
        </p>
        <Image
          src="/humaner.svg"
          alt=""
          width={160}
          height={52}
          className="h-11 w-auto shrink-0 brightness-0 invert opacity-90 sm:h-12"
        />
      </div>
    </div>
  );
}
