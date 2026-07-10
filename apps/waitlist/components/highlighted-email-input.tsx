"use client";

import { HighlightedTextInput } from "@humaner/react";
import { forwardRef, type ChangeEvent, type InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type HighlightedEmailInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "onChange" | "value"
> & {
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

export const HighlightedEmailInput = forwardRef<
  HTMLInputElement,
  HighlightedEmailInputProps
>(function HighlightedEmailInput({ className, ...props }, ref) {
  return (
    <HighlightedTextInput
      ref={ref}
      tone="dark"
      type="email"
      containerClassName="h-9 w-full min-w-[12rem] max-w-[16rem] flex-none"
      className={cn(
        "h-full w-full border-0 border-b border-white/20 bg-transparent px-0 text-sm leading-9 placeholder:text-transparent focus:border-white/50 disabled:opacity-60",
        className,
      )}
      mirrorClassName="flex h-full items-center leading-9"
      {...props}
    />
  );
});
